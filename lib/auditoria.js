import { isIP } from "node:net";
import { createCipheriv, createDecipheriv, createHmac, randomBytes, randomUUID } from "node:crypto";
import { HttpError, header } from "./http.js";
import { GitHubError, getGitHubContent, listGitHubDirectory, parseRepository, putGitHubContent } from "./github.js";

const RECENT_LIMIT = 100;
const DIMENSION_LIMIT = 250;
const FILE_LIMIT = 420 * 1024;
const DATE_FILE = /^\d{4}-\d{2}-\d{2}\.json$/;
const DAY_MS = 86_400_000;
export const IP_ACCESS_DAYS = 7;
const EVENT_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const CAMPAIGNS = new Set(["linkedin", "github", "whatsapp", "telegram", "facebook", "instagram", "x", "twitter", "correo", "email", "cv", "qr", "sms", "signal"]);
const REFERRER_CHANNELS = new Map([["t.me", "telegram"], ["telegram.me", "telegram"], ["telegram.org", "telegram"], ["facebook.com", "facebook"], ["instagram.com", "instagram"], ["linkedin.com", "linkedin"], ["lnkd.in", "linkedin"], ["t.co", "x"], ["x.com", "x"], ["github.com", "github"]]);
const limiterSecret = randomBytes(32);
let visitLimiter = { minute: 0, total: 0, addresses: new Map() };
const networkCache = new Map();
const PUBLIC_ROUTES = new Set([
  "/", "/academico/", "/proyectos/", "/juegos/", "/blog/", "/actividad/", "/hoja-de-vida/",
  "/trayectoria/", "/privacidad/",
]);
const PUBLIC_MODULE = /^\/(?:proyectos\/[a-z0-9]+(?:-[a-z0-9]+)*|blog\/(?:tema\/)?[a-z0-9]+(?:-[a-z0-9]+)*)\/$/;
const SITEMAP_CACHE_MS = 5 * 60 * 1000;
let sitemapCache = { origin: "", expires: 0, paths: null, pending: null };

function shortText(value, fallback, max = 100) {
  if (typeof value !== "string") return fallback;
  const clean = value.normalize("NFC").replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, max) : fallback;
}

function vercelHeader(req, name, fallback = "No disponible") {
  const raw = header(req, name);
  if (!raw) return fallback;
  try {
    return shortText(decodeURIComponent(raw), fallback);
  } catch {
    return shortText(raw, fallback);
  }
}

function countryName(value) {
  const code = shortText(value, "", 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return value || "No disponible";
  try {
    return shortText(new Intl.DisplayNames(["es"], { type: "region" }).of(code), code, 100);
  } catch {
    return code;
  }
}

export function parseUserAgent(raw) {
  const ua = typeof raw === "string" ? raw.slice(0, 1_000) : "";
  let dispositivo = "Escritorio";
  if (/bot|crawler|spider|slurp|headless/i.test(ua)) dispositivo = "Robot";
  else if (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua)) dispositivo = "Tableta";
  else if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) dispositivo = "Móvil";

  let sistema = "Otro";
  if (/iPhone|iPad|iPod/i.test(ua)) sistema = "iOS / iPadOS";
  else if (/Android/i.test(ua)) sistema = "Android";
  else if (/Windows NT/i.test(ua)) sistema = "Windows";
  else if (/Macintosh|Mac OS X/i.test(ua)) sistema = "macOS";
  else if (/CrOS/i.test(ua)) sistema = "ChromeOS";
  else if (/Linux/i.test(ua)) sistema = "Linux";

  let navegador = "Otro";
  if (/EdgA?\//i.test(ua)) navegador = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) navegador = "Opera";
  else if (/SamsungBrowser\//i.test(ua)) navegador = "Samsung Internet";
  else if (/Firefox\/|FxiOS\//i.test(ua)) navegador = "Firefox";
  else if (/Chrome\/|CriOS\//i.test(ua)) navegador = "Chrome";
  else if (/Version\/.*Safari\//i.test(ua)) navegador = "Safari";
  let familia = "Equipo no identificado";
  if (dispositivo === "Robot") familia = "Robot";
  else if (/iPhone/i.test(ua)) familia = "iPhone";
  else if (/iPad/i.test(ua)) familia = "iPad";
  else if (sistema === "Android") familia = dispositivo === "Tableta" ? "Tableta Android" : "Teléfono Android";
  else if (sistema === "Windows") familia = "PC Windows";
  else if (sistema === "macOS") familia = "Mac";
  else if (sistema === "ChromeOS") familia = "Chromebook";
  else if (sistema === "Linux") familia = "PC Linux";
  return { dispositivo, familia, sistema, navegador };
}

export function validateVisitInput(input, origin = "https://sitio.invalid") {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(422, "visita_invalida", "La visita debe ser un objeto.");
  }
  for (const key of Object.keys(input)) {
    if (!["path", "referrer", "eventId"].includes(key)) {
      throw new HttpError(422, "campo_no_permitido", "La analítica solo admite ruta, referente e identificador del evento.");
    }
  }
  if (input.eventId !== undefined && (typeof input.eventId !== "string" || !EVENT_ID.test(input.eventId))) {
    throw new HttpError(422, "evento_invalido", "El identificador del evento no es válido.");
  }
  if (typeof input.path !== "string" || input.path.length > 500 || !input.path.startsWith("/") || input.path.startsWith("//")) {
    throw new HttpError(422, "ruta_invalida", "La ruta visitada no es válida.");
  }
  let path;
  let campana = "";
  let enlace = "";
  try {
    const url = new URL(input.path, origin);
    if (url.origin !== new URL(origin).origin) throw new Error("cross-origin");
    path = shortText(url.pathname, "/", 300);
    // Catálogo cerrado: recortar caracteres aún permitiría guardar nombres,
    // cuentas o correos transformados dentro de una etiqueta arbitraria.
    const via = (url.searchParams.get("via") || "").toLowerCase();
    const source = (url.searchParams.get("utm_source") || "").toLowerCase();
    campana = CAMPAIGNS.has(via) ? via : CAMPAIGNS.has(source) ? source : "";
    const campaign = (url.searchParams.get("utm_campaign") || "").toLowerCase();
    enlace = /^s-[a-f0-9]{12}$/.test(campaign) ? campaign : "";
  } catch {
    throw new HttpError(422, "ruta_invalida", "La ruta visitada no es válida.");
  }
  if (path === "/admin" || path.startsWith("/admin/")) {
    throw new HttpError(422, "ruta_privada", "Las rutas privadas no se incluyen en la analítica.");
  }
  if (!PUBLIC_ROUTES.has(path) && !PUBLIC_MODULE.test(path)) {
    throw new HttpError(422, "ruta_no_publica", "La ruta no pertenece al catálogo público del sitio.");
  }

  let referrer = "Directo";
  if (input.referrer !== undefined && input.referrer !== "") {
    if (typeof input.referrer !== "string" || input.referrer.length > 1_000) {
      throw new HttpError(422, "referente_invalido", "El referente no es válido.");
    }
    try {
      const base = new URL(origin);
      const source = new URL(input.referrer, base);
      referrer = source.origin === base.origin
        ? `Interno: ${PUBLIC_ROUTES.has(source.pathname) || PUBLIC_MODULE.test(source.pathname) ? source.pathname : "otra página"}`
        : shortText(source.hostname.toLowerCase().replace(/^www\./, ""), "Externo", 160);
    } catch {
      referrer = "No disponible";
    }
  }
  if (!campana) {
    for (const [domain, channel] of REFERRER_CHANNELS) {
      if (referrer === domain || referrer.endsWith(`.${domain}`)) { campana = channel; break; }
    }
  }
  return { path, referrer, campana, enlace };
}

async function fetchPublishedPaths(origin, fetchImpl) {
  let response;
  try {
    response = await fetchImpl(new URL("/sitemap.xml", origin), {
      headers: { Accept: "application/xml,text/xml;q=0.9" },
      redirect: "error",
      signal: AbortSignal.timeout(2_500),
    });
  } catch {
    throw new HttpError(503, "catalogo_no_disponible", "No fue posible verificar el catálogo público del sitio.");
  }
  if (!response.ok) {
    throw new HttpError(503, "catalogo_no_disponible", "No fue posible verificar el catálogo público del sitio.");
  }
  const declaredSize = Number(response.headers?.get?.("content-length") || 0);
  if (declaredSize > 512 * 1024) {
    throw new HttpError(503, "catalogo_invalido", "El catálogo público excede el tamaño permitido.");
  }
  const xml = await response.text();
  if (Buffer.byteLength(xml, "utf8") > 512 * 1024) {
    throw new HttpError(503, "catalogo_invalido", "El catálogo público excede el tamaño permitido.");
  }
  const expected = new URL(origin).origin;
  const paths = new Set();
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      const location = new URL(match[1].trim());
      if (location.origin === expected) paths.add(location.pathname);
    } catch {
      // Una entrada ajena o inválida no amplía el catálogo permitido.
    }
  }
  if (!paths.size || paths.size > 1_000) {
    throw new HttpError(503, "catalogo_invalido", "El catálogo público no tiene una estructura válida.");
  }
  return paths;
}

export async function requirePublishedPath(path, origin, fetchImpl = fetch, now = Date.now()) {
  const expected = new URL(origin).origin;
  if (sitemapCache.origin !== expected || sitemapCache.expires <= now || !sitemapCache.paths) {
    if (sitemapCache.origin !== expected || !sitemapCache.pending) {
      const pending = fetchPublishedPaths(expected, fetchImpl);
      sitemapCache = { origin: expected, expires: 0, paths: null, pending };
    }
    try {
      const paths = await sitemapCache.pending;
      sitemapCache = { origin: expected, expires: now + SITEMAP_CACHE_MS, paths, pending: null };
    } catch (error) {
      sitemapCache = { origin: "", expires: 0, paths: null, pending: null };
      throw error;
    }
  }
  if (!sitemapCache.paths.has(path)) {
    throw new HttpError(422, "ruta_no_publicada", "La ruta no existe en el catálogo público del sitio.");
  }
}

/** O(1) tiempo/espacio: solo el proxy de Vercel o el socket local aporta IP.
 * Fuente: https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for
 * Fuera de Vercel, las cabeceras del cliente nunca amplían la confianza. */
export function extractForwardedIp(req, env = process.env) {
  const raw = env.VERCEL === "1"
    ? (header(req, "x-vercel-forwarded-for") || header(req, "x-real-ip") || header(req, "x-forwarded-for")).trim()
    : String(req?.socket?.remoteAddress || "").trim();
  return raw.length <= 45 && isIP(raw) ? raw.toLowerCase() : "";
}

/** O(1) tiempo; O(120) memoria acotada por instancia y minuto. El límite
 * complementa el firewall distribuido; una IP compartida no identifica personas. */
export function requireVisitCapacity(req, env = process.env, now = Date.now()) {
  const minute = Math.floor(now / 60_000);
  if (visitLimiter.minute !== minute) visitLimiter = { minute, total: 0, addresses: new Map() };
  const key = createHmac("sha256", limiterSecret).update(extractForwardedIp(req, env) || "sin-ip").digest("hex");
  const count = visitLimiter.addresses.get(key) || 0;
  if (visitLimiter.total >= 120 || count >= 20) {
    throw new HttpError(429, "limite_de_visitas", "Se alcanzó el límite temporal de registros.");
  }
  visitLimiter.total += 1;
  visitLimiter.addresses.set(key, count + 1);
}

function auditKey(env) {
  const secret = env.AUDIT_IP_SECRET || env.SESSION_SECRET || "";
  return Buffer.byteLength(secret) >= 32 ? createHmac("sha256", secret).update("jsar-auditoria-ip-v1").digest() : null;
}

function eventBinding(event) {
  return Buffer.from(`${event.id}\n${event.hora}\n${event.ruta}`, "utf8");
}

/** O(1) tiempo/espacio; AES-256-GCM autentica IP, ruta, ID y fecha.
 * No existe IP en claro ni hash reversible por diccionario dentro del archivo Git. */
export function protectVisitIp(event, req, env = process.env) {
  const ip = extractForwardedIp(req, env);
  const key = auditKey(env);
  if (!ip || !key) return { estado: !ip ? "sin_ip_verificada" : "cifrado_no_configurado" };
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(eventBinding(event));
  const ciphertext = Buffer.concat([cipher.update(ip, "utf8"), cipher.final()]);
  return {
    estado: "cifrada",
    fuente: env.VERCEL === "1" ? "Proxy de Vercel" : "Socket local",
    diario: createHmac("sha256", key).update(`${event.hora.slice(0, 10)}\n${ip}`).digest("hex").slice(0, 24),
    cifrada: [nonce, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join("."),
  };
}

/** O(1) tiempo/espacio; devuelve texto únicamente en lectura admin de 7 días.
 * La caducidad limita consulta; Git conserva el historial cifrado. */
export function revealVisitIp(event, env = process.env, now = Date.now()) {
  const age = now - Date.parse(event.hora);
  if (!Number.isFinite(age) || age < 0 || age >= IP_ACCESS_DAYS * DAY_MS) return "";
  const key = auditKey(env);
  if (!key || typeof event.conexion?.cifrada !== "string") return "";
  try {
    const parts = event.conexion.cifrada.split(".").map((part) => Buffer.from(part, "base64url"));
    if (parts.length !== 3 || parts[0].length !== 12 || parts[1].length !== 16 || parts[2].length > 45) return "";
    const decipher = createDecipheriv("aes-256-gcm", key, parts[0]);
    decipher.setAAD(eventBinding(event));
    decipher.setAuthTag(parts[1]);
    const ip = Buffer.concat([decipher.update(parts[2]), decipher.final()]).toString("utf8");
    return isIP(ip) ? ip : "";
  } catch { return ""; }
}

/** O(1); ausencia y cero son distintos. Redondear no acredita precisión. */
export function approximateLocation(req, env = process.env) {
  if (env.VERCEL !== "1") return null;
  const latitude = header(req, "x-vercel-ip-latitude").trim();
  const longitude = header(req, "x-vercel-ip-longitude").trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(latitude) || !/^-?\d+(?:\.\d+)?$/.test(longitude)) return null;
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180 || (lat === 0 && lon === 0)) return null;
  return { latitud: Number(lat.toFixed(2)), longitud: Number(lon.toFixed(2)), fuente: "Vercel GeoIP", precision: "Ciudad o región; error desconocido", radioKm: null };
}

function booleanOrNull(value) {
  return typeof value === "boolean" ? value : null;
}

export async function evaluateNetwork(req, env = process.env, fetchImpl = fetch) {
  const empty = { vpn: null, proxy: null, tor: null, datacenter: null, egress: null, clasificacion: "no evaluada" };
  const ip = extractForwardedIp(req, env);
  if (!ip || env.VERCEL !== "1") return empty;
  const cacheKey = createHmac("sha256", limiterSecret).update(ip).digest("hex");
  const cached = networkCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return { ...cached.value };
  const url = new URL("https://api.ipapi.is/");
  url.searchParams.set("q", ip);
  if (env.IPAPI_KEY) url.searchParams.set("key", env.IPAPI_KEY);
  try {
    const response = await fetchImpl(url, {
      headers: { Accept: "application/json", "User-Agent": "sitio-jhon-auditoria" },
      signal: AbortSignal.timeout(2_500),
    });
    if (!response.ok) return empty;
    const result = await response.json();
    const vpn = booleanOrNull(result?.is_vpn);
    const proxy = booleanOrNull(result?.is_proxy);
    const tor = booleanOrNull(result?.is_tor);
    const datacenter = booleanOrNull(result?.is_datacenter);
    const egress = [vpn, proxy, tor].some((flag) => flag === true)
      ? true
      : [vpn, proxy, tor].every((flag) => flag === false) ? false : null;
    const evaluated = [vpn, proxy, tor].every((flag) => typeof flag === "boolean");
    const value = {
      vpn,
      proxy,
      tor,
      datacenter,
      egress,
      clasificacion: egress === true ? "detectada" : evaluated ? "no detectada" : "no evaluada",
    };
    if (networkCache.size >= 500) networkCache.delete(networkCache.keys().next().value);
    networkCache.set(cacheKey, { expires: Date.now() + 300_000, value });
    return value;
  } catch {
    return empty;
  }
}

export function createVisitEvent(req, input, network, now = new Date(), origin = "https://sitio.invalid", env = process.env) {
  const { path, referrer, campana, enlace } = validateVisitInput(input, origin);
  const agent = parseUserAgent(header(req, "user-agent"));
  const trustedReq = env.VERCEL === "1" ? req : { headers: {} };
  const country = vercelHeader(trustedReq, "x-vercel-ip-country");
  const event = {
    id: input.eventId || randomUUID(),
    tipo: "pagina",
    hora: now.toISOString(),
    ruta: path,
    referente: referrer,
    campana: campana || "Sin etiqueta",
    enlace: enlace || "Sin identificador",
    pais: countryName(country),
    region: vercelHeader(trustedReq, "x-vercel-ip-country-region"),
    ciudad: vercelHeader(trustedReq, "x-vercel-ip-city"),
    ubicacion: approximateLocation(req, env),
    peticion: shortText(header(trustedReq, "x-vercel-id"), "", 120).replace(/[^a-zA-Z0-9:._-]/g, ""),
    ...agent,
    vpn: network.clasificacion,
    banderas: {
      vpn: booleanOrNull(network.vpn),
      proxy: booleanOrNull(network.proxy),
      tor: booleanOrNull(network.tor),
      datacenter: booleanOrNull(network.datacenter),
      egress: booleanOrNull(network.egress),
    },
  };
  event.conexion = protectVisitIp(event, req, env);
  return event;
}

function blankMap(value) {
  const result = Object.create(null);
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const [key, count] of Object.entries(value).slice(0, DIMENSION_LIMIT + 1)) {
    if (typeof key === "string" && key.length <= 180 && Number.isSafeInteger(count) && count >= 0) result[key] = count;
  }
  return result;
}

function cleanFlag(value) {
  return typeof value === "boolean" ? value : null;
}

function cleanLocation(value) {
  if (value?.fuente !== "Vercel GeoIP" || !Number.isFinite(value.latitud) || !Number.isFinite(value.longitud)
      || Math.abs(value.latitud) > 90 || Math.abs(value.longitud) > 180 || (value.latitud === 0 && value.longitud === 0)) return null;
  return { latitud: Number(value.latitud.toFixed(2)), longitud: Number(value.longitud.toFixed(2)), fuente: "Vercel GeoIP", precision: "Ciudad o región; error desconocido", radioKm: null };
}

function cleanConnection(value) {
  const estado = ["cifrada", "sin_ip_verificada", "cifrado_no_configurado"].includes(value?.estado) ? value.estado : "registro_anterior";
  if (estado !== "cifrada") return { estado };
  return {
    estado,
    fuente: value.fuente === "Proxy de Vercel" ? value.fuente : "Socket local",
    diario: /^[a-f0-9]{24}$/.test(value.diario || "") ? value.diario : "",
    cifrada: /^[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{3,60}$/.test(value.cifrada || "") ? value.cifrada : "",
  };
}

function cleanStoredEvent(item) {
  if (!item || typeof item !== "object" || typeof item.hora !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(item.hora) || !Number.isFinite(Date.parse(item.hora))) return null;
  if (new Date(item.hora).toISOString() !== item.hora) return null;
  const vpn = ["detectada", "no detectada", "no evaluada"].includes(item.vpn) ? item.vpn : "no evaluada";
  return {
    id: EVENT_ID.test(item.id || "") ? item.id : "",
    tipo: item.tipo === "pagina" ? "pagina" : "ingreso",
    hora: item.hora.slice(0, 24),
    ruta: shortText(item.ruta, "/", 300),
    referente: shortText(item.referente, "No disponible", 240),
    /* Sin esta línea la etiqueta de canal se perdía aquí: esta función
       recorta el evento a una lista blanca de campos, y todo lo que no
       esté nombrado se descarta en silencio. */
    campana: shortText(item.campana, "Sin etiqueta", 32),
    enlace: /^s-[a-f0-9]{12}$/.test(item.enlace || "") ? item.enlace : "Sin identificador",
    pais: shortText(item.pais, "No disponible"),
    region: shortText(item.region, "No disponible"),
    ciudad: shortText(item.ciudad, "No disponible"),
    conexion: cleanConnection(item.conexion),
    ubicacion: cleanLocation(item.ubicacion),
    peticion: shortText(item.peticion, "", 120).replace(/[^a-zA-Z0-9:._-]/g, ""),
    dispositivo: shortText(item.dispositivo, "Otro", 40),
    familia: shortText(item.familia, "Equipo no identificado", 40),
    sistema: shortText(item.sistema, "Otro", 40),
    navegador: shortText(item.navegador, "Otro", 40),
    vpn,
    banderas: {
      vpn: cleanFlag(item.banderas?.vpn),
      proxy: cleanFlag(item.banderas?.proxy),
      tor: cleanFlag(item.banderas?.tor),
      datacenter: cleanFlag(item.banderas?.datacenter),
      egress: cleanFlag(item.banderas?.egress),
    },
  };
}

function cleanRecent(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(-RECENT_LIMIT).map(cleanStoredEvent).filter(Boolean);
}

export function normalizeDaily(value, day) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    version: 3,
    fecha: day,
    total: Number.isSafeInteger(source.total) && source.total >= 0 ? source.total : 0,
    porPais: blankMap(source.porPais),
    porCiudad: blankMap(source.porCiudad),
    porDispositivo: blankMap(source.porDispositivo),
    porVpn: blankMap(source.porVpn),
    /* Dimensiones añadidas después. blankMap sobre un valor ausente
       devuelve un mapa vacío, así que los archivos diarios anteriores
       se siguen leyendo sin migración ni pérdida. */
    porRuta: blankMap(source.porRuta),
    porReferente: blankMap(source.porReferente),
    porCampana: blankMap(source.porCampana),
    porEnlace: blankMap(source.porEnlace),
    recientes: cleanRecent(source.recientes),
    actualizado: typeof source.actualizado === "string" ? source.actualizado : null,
  };
}

function increment(dimension, key) {
  const safeKey = shortText(key, "No disponible", 180);
  if (Object.hasOwn(dimension, safeKey)) {
    dimension[safeKey] += 1;
    return;
  }
  if (Object.keys(dimension).length < DIMENSION_LIMIT) dimension[safeKey] = 1;
  else dimension.Otros = (dimension.Otros || 0) + 1;
}

export function aggregateVisit(daily, event) {
  const safeEvent = cleanStoredEvent(event);
  if (!safeEvent) throw new HttpError(422, "visita_invalida", "La visita no tiene un momento válido.");
  if (safeEvent.id && daily.recientes.some((previous) => previous.id === safeEvent.id)) return daily;
  daily.total += 1;
  increment(daily.porPais, safeEvent.pais);
  increment(daily.porCiudad, `${safeEvent.ciudad}, ${safeEvent.pais}`);
  increment(daily.porDispositivo, safeEvent.dispositivo);
  increment(daily.porVpn, safeEvent.vpn);
  increment(daily.porRuta, safeEvent.ruta);
  increment(daily.porReferente, safeEvent.referente);
  increment(daily.porCampana, safeEvent.campana || "Sin etiqueta");
  increment(daily.porEnlace, safeEvent.enlace || "Sin identificador");
  daily.recientes.push(safeEvent);
  daily.recientes = daily.recientes.slice(-RECENT_LIMIT);
  daily.actualizado = safeEvent.hora;
  return daily;
}

function repositoryConfig(env) {
  const repository = parseRepository(env.GITHUB_AUDIT_REPO || "sitio-auditoria");
  return {
    ...repository,
    branch: env.GITHUB_AUDIT_BRANCH || undefined,
    token: env.GITHUB_AUDIT_TOKEN,
  };
}

/** O(1), una solicitud. Toda lectura/escritura exige repositorio privado;
 * un cambio accidental de visibilidad detiene el registro antes de escribir. */
export async function requirePrivateAuditRepository(env = process.env, fetchImpl = fetch) {
  const repository = repositoryConfig(env);
  if (!repository.token) throw new HttpError(503, "auditoria_no_disponible", "La credencial de auditoría no está configurada.");
  try {
    const response = await fetchImpl(`https://api.github.com/repos/${repository.owner}/${repository.repo}`, {
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${repository.token}`, "User-Agent": "sitio-jhon-auditoria", "X-GitHub-Api-Version": "2022-11-28" },
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok || (await response.json())?.private !== true) throw new Error("private-repository-required");
  } catch {
    throw new HttpError(503, "repositorio_privado_requerido", "No se pudo acreditar que la auditoría esté en un repositorio privado.");
  }
}

function parseDailyFile(text, day) {
  try {
    return normalizeDaily(JSON.parse(text), day);
  } catch {
    throw new HttpError(503, "auditoria_invalida", "El archivo diario de auditoría no contiene JSON válido.");
  }
}

function serializedDaily(daily) {
  let result = `${JSON.stringify(daily, null, 2)}\n`;
  while (Buffer.byteLength(result, "utf8") > FILE_LIMIT && daily.recientes.length) {
    daily.recientes.shift();
    result = `${JSON.stringify(daily, null, 2)}\n`;
  }
  if (Buffer.byteLength(result, "utf8") > FILE_LIMIT) {
    throw new HttpError(503, "auditoria_llena", "El archivo diario alcanzó su límite seguro.");
  }
  return result;
}

function auditUnavailable(error) {
  if (!(error instanceof GitHubError)) throw error;
  throw new HttpError(503, "auditoria_no_disponible", "No fue posible guardar o consultar la auditoría.");
}

export async function persistVisit(event, env = process.env, fetchImpl) {
  const repository = repositoryConfig(env);
  await requirePrivateAuditRepository(env, fetchImpl);
  const safeEvent = cleanStoredEvent(event);
  if (!safeEvent) throw new HttpError(422, "visita_invalida", "La visita no tiene un momento válido.");
  const day = safeEvent.hora.slice(0, 10);
  const path = `visitas/${day}.json`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const current = await getGitHubContent({ ...repository, path, fetchImpl });
      const daily = current ? parseDailyFile(current.text, day) : normalizeDaily(null, day);
      if (safeEvent.id && daily.recientes.some((previous) => previous.id === safeEvent.id)) {
        return { totalDelDia: daily.total, sha: current?.sha || null, duplicada: true };
      }
      aggregateVisit(daily, safeEvent);
      const result = await putGitHubContent({
        ...repository,
        path,
        fetchImpl,
        sha: current?.sha,
        text: serializedDaily(daily),
        message: `Registrar visitas del ${day}`,
      });
      return { totalDelDia: daily.total, sha: result?.content?.sha || null };
    } catch (error) {
      if (error instanceof GitHubError && [409, 422].includes(error.status) && attempt < 2) continue;
      auditUnavailable(error);
    }
  }
  throw new HttpError(503, "conflicto_de_auditoria", "La auditoría recibió actualizaciones simultáneas. Inténtalo nuevamente.");
}

function mergeCounts(target, source) {
  for (const [key, count] of Object.entries(source)) target[key] = (target[key] || 0) + count;
}

export async function readAudit(env = process.env, fetchImpl, days = 30, now = Date.now()) {
  const repository = repositoryConfig(env);
  await requirePrivateAuditRepository(env, fetchImpl);
  const requestedDays = Number.isFinite(days) ? Math.min(Math.max(Math.trunc(days), 1), 90) : 30;
  const today = new Date(now).toISOString().slice(0, 10);
  const firstDay = new Date(Date.parse(`${today}T00:00:00.000Z`) - (requestedDays - 1) * DAY_MS).toISOString().slice(0, 10);
  try {
    const files = (await listGitHubDirectory({ ...repository, path: "visitas", fetchImpl }))
      .filter((file) => file.type === "file" && DATE_FILE.test(file.name) && file.name.slice(0, 10) >= firstDay && file.name.slice(0, 10) <= today)
      .sort((a, b) => b.name.localeCompare(a.name))
      .slice(0, requestedDays);
    const summary = {
      total: 0,
      porPais: Object.create(null),
      porCiudad: Object.create(null),
      porDispositivo: Object.create(null),
      porVpn: Object.create(null),
      porRuta: Object.create(null),
      porReferente: Object.create(null),
      porCampana: Object.create(null),
      porEnlace: Object.create(null),
    };
    const recent = [];
    const series = [];
    for (let index = 0; index < files.length; index += 8) {
      const batch = await Promise.all(files.slice(index, index + 8).map(async (file) => {
        const content = await getGitHubContent({ ...repository, path: file.path, fetchImpl });
        return content ? parseDailyFile(content.text, file.name.slice(0, 10)) : null;
      }));
      for (const daily of batch.filter(Boolean)) {
        summary.total += daily.total;
        series.push({ fecha: daily.fecha, total: daily.total });
        mergeCounts(summary.porPais, daily.porPais);
        mergeCounts(summary.porCiudad, daily.porCiudad);
        mergeCounts(summary.porDispositivo, daily.porDispositivo);
        mergeCounts(summary.porVpn, daily.porVpn);
        mergeCounts(summary.porRuta, daily.porRuta);
        mergeCounts(summary.porReferente, daily.porReferente);
        mergeCounts(summary.porCampana, daily.porCampana);
        mergeCounts(summary.porEnlace, daily.porEnlace);
        recent.push(...daily.recientes);
      }
    }
    recent.sort((a, b) => b.hora.localeCompare(a.hora));
    return {
      periodoDias: files.length,
      ventanaDias: requestedDays,
      desde: firstDay,
      hasta: today,
      resumen: summary,
      serieDiaria: series.sort((a, b) => a.fecha.localeCompare(b.fecha)),
      recientes: recent.slice(0, RECENT_LIMIT).map((event) => {
        const { cifrada, ...connection } = event.conexion;
        return { ...event, conexion: { ...connection, ip: revealVisitIp(event, env, now) } };
      }),
      limites: { recientes: RECENT_LIMIT, consultaIpDias: IP_ACCESS_DAYS, limitePorIpMinuto: 20, limitePorInstanciaMinuto: 120, almacenamiento: "Git privado; el historial conserva copias cifradas de IP. La ventana de consulta no elimina esas copias." },
      nota: "Cada registro nuevo corresponde a una carga o navegación de página con JavaScript; los registros anteriores corresponden al primer ingreso de sesión. Bloqueadores, errores de red y límites pueden omitir cargas. El navegador declarado y la detección de robots o VPN son estimaciones; una IP compartida no identifica a una persona.",
    };
  } catch (error) {
    auditUnavailable(error);
  }
}
