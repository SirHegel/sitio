/* Auditoría privada de ingreso.

   Vercel Web Analytics contabiliza de forma agregada las páginas y transiciones.
   Este módulo envía solo el primer ingreso de cada sesión para añadir ciudad y
   una estimación de red. No crea cookies, identificadores ni fingerprints. */

const LLAVE = "jsar:ingreso-auditado";
const MAX_INTENTOS = 3;
let enviadaEnMemoria = false;
let enviando = false;
let intentos = 0;

function rutaSegura(valor) {
  try {
    const url = new URL(valor || location.href, location.href);
    if (url.origin !== location.origin) return "";
    return url.pathname.slice(0, 300) || "/";
  } catch {
    return "";
  }
}

function yaEnviada() {
  if (enviadaEnMemoria) return true;
  try { return sessionStorage.getItem(LLAVE) === "1"; }
  catch { return false; }
}

function marcarEnviada() {
  enviadaEnMemoria = true;
  try { sessionStorage.setItem(LLAVE, "1"); } catch {}
}

function reintentar() {
  if (intentos >= MAX_INTENTOS || yaEnviada()) return;
  const espera = [1_500, 5_000, 15_000][Math.max(0, intentos - 1)] || 15_000;
  setTimeout(registrarIngreso, espera);
}

async function registrarIngreso() {
  const ruta = rutaSegura(location.href);
  if (!ruta || ruta === "/admin" || ruta.startsWith("/admin/") || yaEnviada() || enviando) return;
  enviando = true;
  intentos += 1;
  try {
    const respuesta = await fetch("/api/visita", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: ruta, referrer: document.referrer || "" }),
      credentials: "omit",
      cache: "no-store",
      keepalive: true,
      referrerPolicy: "strict-origin-when-cross-origin",
    });

    if (respuesta.status === 202 || respuesta.status === 429) {
      // Un 429 significa que el firewall ya protegió la cuota. Vercel Web
      // Analytics conserva igualmente la visita agregada sin reintentos.
      marcarEnviada();
    } else if (respuesta.status >= 400 && respuesta.status < 500) {
      marcarEnviada();
    } else {
      reintentar();
    }
  } catch {
    reintentar();
  } finally {
    enviando = false;
  }
}

registrarIngreso();
addEventListener("online", registrarIngreso, { passive: true });
