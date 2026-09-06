/* Una traza por carga o navegación pública con JavaScript. Cada evento fija
   su ruta, referente y UUID; sus reintentos conservan esos mismos datos.
   O(E) memoria, E ≤ 20 pendientes; una solicitud simultánea. Sin cookies,
   sesiones de seguimiento ni fingerprints. */

const MAX_INTENTOS = 3;
const MAX_PENDIENTES = 20;
const canales = new Set(["linkedin", "github", "whatsapp", "telegram", "facebook", "instagram", "x", "twitter", "correo", "email", "cv", "qr", "sms", "signal"]);
const pendientes = new Set();
const cola = [];
let activa = false;
let rutaAnterior = "";
let urlAnterior = "";

function rutaSegura(valor) {
  try {
    const url = new URL(valor || location.href, location.href);
    if (url.origin !== location.origin) return "";
    const via = (url.searchParams.get("via") || "").toLowerCase();
    const source = (url.searchParams.get("utm_source") || "").toLowerCase();
    const campaign = (url.searchParams.get("utm_campaign") || "").toLowerCase();
    const segura = new URL(url.pathname.slice(0, 300) || "/", location.origin);
    if (canales.has(via)) segura.searchParams.set("via", via);
    if (canales.has(source)) segura.searchParams.set("utm_source", source);
    if (/^s-[a-f0-9]{12}$/.test(campaign)) segura.searchParams.set("utm_campaign", campaign);
    return `${segura.pathname}${segura.search}`;
  } catch {
    return "";
  }
}

function referenteSeguro(valor) {
  if (!valor) return "";
  try {
    const url = new URL(valor, location.href);
    if (!/^https?:$/.test(url.protocol)) return "";
    return url.origin === location.origin ? url.pathname : url.origin;
  } catch { return ""; }
}

function finalizar(evento) {
  evento.terminado = true;
  clearTimeout(evento.temporizador);
  pendientes.delete(evento);
}

function encolar(evento) {
  if (evento.terminado || evento.enCola || evento.enviando) return;
  clearTimeout(evento.temporizador);
  evento.enCola = true;
  cola.push(evento);
  procesarCola();
}

async function procesarCola() {
  if (activa || !cola.length) return;
  const evento = cola.shift();
  evento.enCola = false;
  if (evento.terminado) { procesarCola(); return; }
  activa = true;
  evento.enviando = true;
  evento.intentos += 1;
  try {
    const respuesta = await fetch("/api/visita/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evento.datos),
      credentials: "omit",
      cache: "no-store",
      keepalive: true,
      referrerPolicy: "strict-origin-when-cross-origin",
    });

    if (respuesta.status === 202 || (respuesta.status >= 400 && respuesta.status < 500)) finalizar(evento);
  } catch {
    // Los errores de telemetría no interrumpen la navegación.
  } finally {
    evento.enviando = false;
    activa = false;
    if (!evento.terminado) {
      if (evento.intentos >= MAX_INTENTOS) finalizar(evento);
      else evento.temporizador = setTimeout(() => encolar(evento), evento.intentos === 1 ? 1_500 : 5_000);
    }
    procesarCola();
  }
}

function registrarPagina() {
  const actual = location.pathname + location.search;
  if (actual === rutaAnterior) return;
  const ruta = rutaSegura(location.href);
  const referente = referenteSeguro(urlAnterior || document.referrer);
  rutaAnterior = actual;
  urlAnterior = location.href;
  if (!ruta || location.pathname === "/admin" || location.pathname.startsWith("/admin/") || pendientes.size >= MAX_PENDIENTES) return;
  const eventId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : "";
  const evento = { datos: { path: ruta, referrer: referente, ...(eventId ? { eventId } : {}) }, intentos: 0, terminado: false, enCola: false, enviando: false, temporizador: null };
  pendientes.add(evento);
  encolar(evento);
}

registrarPagina();
addEventListener("sitio:navegacion", registrarPagina);
addEventListener("online", () => {
  for (const evento of pendientes) encolar(evento);
}, { passive: true });
