import { isIP } from "node:net";
import { HttpError, header } from "./http.js";
import { GitHubError, getGitHubContent, listGitHubDirectory, parseRepository, putGitHubContent } from "./github.js";

const RECENT_LIMIT = 100;
const DIMENSION_LIMIT = 250;
const FILE_LIMIT = 420 * 1024;
const DATE_FILE = /^\d{4}-\d{2}-\d{2}\.json$/;
const PUBLIC_ROUTES = new Set([
  "/", "/academico/", "/proyectos/", "/blog/", "/actividad/",
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
  return { dispositivo, sistema, navegador };
}

export function validateVisitInput(input, origin = "https://sitio.invalid") {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(422, "visita_invalida", "La visita debe ser un objeto.");
  }
  for (const key of Object.keys(input)) {
    if (!["path", "referrer"].includes(key)) {
      throw new HttpError(422, "campo_no_permitido", "La analítica solo admite ruta y referente.");
    }
  }
  if (typeof input.path !== "string" || input.path.length > 500 || !input.path.startsWith("/") || input.path.startsWith("//")) {
    throw new HttpError(422, "ruta_invalida", "La ruta visitada no es válida.");
  }
  let path;
  let campana = "";
  try {
    const url = new URL(input.path, origin);
    if (url.origin !== new URL(origin).origin) throw new Error("cross-origin");
    path = shortText(url.pathname, "/", 300);
    /* Etiqueta de canal (?via=linkedin). Es un rótulo que él mismo elige
       al compartir, no un identificador de persona: se guarda como
       dimensión agregada igual que el país, y se recorta a un alfabeto
       corto para que nadie pueda colar datos personales por ahí. */
    const via = (url.searchParams.get("via") || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
    campana = via || "";
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
        ? `Interno: ${shortText(source.pathname, "/", 240)}`
        : shortText(source.hostname.toLowerCase().replace(/^www\./, ""), "Externo", 160);
    } catch {
      referrer = "No disponible";
    }
  }
  return { path, referrer, campana };
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

export function extractForwardedIp(req) {
  let raw = header(req, "x-forwarded-for").split(",", 1)[0].trim();
  if (raw.startsWith("[") && raw.includes("]")) raw = raw.slice(1, raw.indexOf("]"));
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(raw)) raw = raw.slice(0, raw.lastIndexOf(":"));
  return isIP(raw) ? raw : "";
}

function booleanOrNull(value) {
  return typeof value === "boolean" ? value : null;
}

export async function evaluateNetwork(req, env = process.env, fetchImpl = fetch) {
  const empty = { vpn: null, proxy: null, tor: null, datacenter: null, egress: null, clasificacion: "no evaluada" };
  const ip = extractForwardedIp(req);
  if (!ip) return empty;
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
    return {
      vpn,
      proxy,
      tor,
      datacenter,
      egress,
      clasificacion: egress === true ? "detectada" : evaluated ? "no detectada" : "no evaluada",
    };
  } catch {
    return empty;
  }
}

export function createVisitEvent(req, input, network, now = new Date(), origin = "https://sitio.invalid") {
  const { path, referrer, campana } = validateVisitInput(input, origin);
  const agent = parseUserAgent(header(req, "user-agent"));
  const country = vercelHeader(req, "x-vercel-ip-country");
  return {
    hora: now.toISOString(),
    ruta: path,
    referente: referrer,
    campana: campana || "Sin etiqueta",
    pais: countryName(country),
    region: vercelHeader(req, "x-vercel-ip-country-region"),
    ciudad: vercelHeader(req, "x-vercel-ip-city"),
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

function cleanStoredEvent(item) {
  if (!item || typeof item !== "object" || typeof item.hora !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(item.hora)) return null;
  const vpn = ["detectada", "no detectada", "no evaluada"].includes(item.vpn) ? item.vpn : "no evaluada";
  return {
    hora: item.hora.slice(0, 24),
    ruta: shortText(item.ruta, "/", 300),
    referente: shortText(item.referente, "No disponible", 240),
    /* Sin esta línea la etiqueta de canal se perdía aquí: esta función
       recorta el evento a una lista blanca de campos, y todo lo que no
       esté nombrado se descarta en silencio. */
    campana: shortText(item.campana, "Sin etiqueta", 32),
    pais: shortText(item.pais, "No disponible"),
    region: shortText(item.region, "No disponible"),
    ciudad: shortText(item.ciudad, "No disponible"),
    dispositivo: shortText(item.dispositivo, "Otro", 40),
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
    version: 1,
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
  daily.total += 1;
  increment(daily.porPais, safeEvent.pais);
  increment(daily.porCiudad, `${safeEvent.ciudad}, ${safeEvent.pais}`);
  increment(daily.porDispositivo, safeEvent.dispositivo);
  increment(daily.porVpn, safeEvent.vpn);
  increment(daily.porRuta, safeEvent.ruta);
  increment(daily.porReferente, safeEvent.referente);
  increment(daily.porCampana, safeEvent.campana || "Sin etiqueta");
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

function parseDailyFile(text, day) {
  try {
    return normalizeDaily(JSON.parse(text), day);
  } catch {
    throw new HttpError(503, "auditoria_invalida", "El archivo diario de auditoría no contiene JSON válido.");
  }
}

function serializedDaily(daily) {
  while (Buffer.byteLength(JSON.stringify(daily), "utf8") > FILE_LIMIT && daily.recientes.length) daily.recientes.shift();
  const result = `${JSON.stringify(daily, null, 2)}\n`;
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
  const safeEvent = cleanStoredEvent(event);
  if (!safeEvent) throw new HttpError(422, "visita_invalida", "La visita no tiene un momento válido.");
  const day = safeEvent.hora.slice(0, 10);
  const path = `visitas/${day}.json`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const current = await getGitHubContent({ ...repository, path, fetchImpl });
      const daily = current ? parseDailyFile(current.text, day) : normalizeDaily(null, day);
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

export async function readAudit(env = process.env, fetchImpl, days = 30) {
  const repository = repositoryConfig(env);
  try {
    const files = (await listGitHubDirectory({ ...repository, path: "visitas", fetchImpl }))
      .filter((file) => file.type === "file" && DATE_FILE.test(file.name))
      .sort((a, b) => b.name.localeCompare(a.name))
      .slice(0, Math.min(Math.max(days, 1), 90));
    const summary = {
      total: 0,
      porPais: Object.create(null),
      porCiudad: Object.create(null),
      porDispositivo: Object.create(null),
      porVpn: Object.create(null),
      porRuta: Object.create(null),
      porReferente: Object.create(null),
      porCampana: Object.create(null),
    };
    const recent = [];
    for (let index = 0; index < files.length; index += 8) {
      const batch = await Promise.all(files.slice(index, index + 8).map(async (file) => {
        const content = await getGitHubContent({ ...repository, path: file.path, fetchImpl });
        return content ? parseDailyFile(content.text, file.name.slice(0, 10)) : null;
      }));
      for (const daily of batch.filter(Boolean)) {
        summary.total += daily.total;
        mergeCounts(summary.porPais, daily.porPais);
        mergeCounts(summary.porCiudad, daily.porCiudad);
        mergeCounts(summary.porDispositivo, daily.porDispositivo);
        mergeCounts(summary.porVpn, daily.porVpn);
        mergeCounts(summary.porRuta, daily.porRuta);
        mergeCounts(summary.porReferente, daily.porReferente);
        mergeCounts(summary.porCampana, daily.porCampana);
        recent.push(...daily.recientes);
      }
    }
    recent.sort((a, b) => b.hora.localeCompare(a.hora));
    return {
      periodoDias: files.length,
      resumen: summary,
      recientes: recent.slice(0, RECENT_LIMIT),
      nota: "Cada fila representa el primer ingreso auditado de una sesión, no una persona identificada. La clasificación de VPN, proxy y Tor es una estimación y puede equivocarse.",
    };
  } catch (error) {
    auditUnavailable(error);
  }
}
