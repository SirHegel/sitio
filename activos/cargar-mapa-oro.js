/* El cargador acompaña la navegación; el paquete cartográfico se descarga
   únicamente al acercarse a un mapa. O(D + R) tiempo y O(N) memoria por
   navegación: D nodos del documento, N mapas, R registros anteriores. */

const registros = new Map();
let observador = null;

function hojaDeEstilo() {
  if (document.querySelector('link[data-estilo-mapa-oro]')) return;
  const enlace = document.createElement("link");
  enlace.rel = "stylesheet";
  enlace.href = "/activos/mapa-oro.css";
  enlace.dataset.estiloMapaOro = "1";
  document.head.append(enlace);
}

let paquete;
const manifiestos = new Map();
function obtenerManifiesto(url) {
  if (!manifiestos.has(url)) {
    manifiestos.set(url, fetch(url, { credentials: "same-origin" })
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error(`manifiesto HTTP ${respuesta.status}`);
        return respuesta.json();
      })
      .catch((error) => {
        manifiestos.delete(url);
        throw error;
      }));
  }
  return manifiestos.get(url);
}

async function montar(nodo, registro) {
  if (registros.get(nodo) !== registro || !nodo.isConnected || registro.iniciado) return;
  registro.iniciado = true;
  nodo.dataset.inicioMapaOro = String(performance.now());
  nodo.setAttribute("aria-busy", "true");
  hojaDeEstilo();
  paquete ||= import("/activos/mapa-oro.js").catch((error) => {
    paquete = null;
    throw error;
  });
  const urlManifiesto = nodo.dataset.manifiesto || "/data/oro/manifiesto.json";
  const [modulo, manifiestoInicial] = await Promise.all([
    paquete,
    obtenerManifiesto(urlManifiesto).catch(() => null),
  ]);
  // La descarga puede terminar después de navegar. Un nodo que salió del
  // documento nunca recibe una raíz, trabajadores ni un contexto WebGL.
  if (registros.get(nodo) !== registro || !nodo.isConnected) return;
  registro.desmontar = modulo.montarMapasOro([nodo], manifiestoInicial);
  nodo.setAttribute("aria-busy", "false");
}

function informarFalla(nodo) {
  if (!nodo.isConnected || !registros.has(nodo)) return;
  nodo.setAttribute("aria-busy", "false");
  nodo.setAttribute("role", "status");
  nodo.setAttribute("aria-live", "polite");
  nodo.textContent = "El mapa no cargó. La tabla accesible conserva los datos.";
}

/** O(D + R). Invariantes: una raíz por nodo conectado, una hoja de estilos;
 * las raíces anteriores se desmontan y los observadores no retienen nodos. */
export function iniciarMapasOro() {
  for (const [nodo, registro] of registros) {
    if (nodo.isConnected) continue;
    observador?.unobserve(nodo);
    registros.delete(nodo);
    nodo.setAttribute("aria-busy", "false");
    if (typeof registro.desmontar === "function") registro.desmontar();
  }

  if (!observador && "IntersectionObserver" in globalThis) {
    observador = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue;
        observador.unobserve(entrada.target);
        const registro = registros.get(entrada.target);
        if (registro) montar(entrada.target, registro).catch(() => informarFalla(entrada.target));
      }
    }, { rootMargin: "500px 0px" });
  }

  for (const nodo of document.querySelectorAll("[data-mapa-oro]")) {
    if (registros.has(nodo)) continue;
    const registro = { iniciado: false, desmontar: null };
    registros.set(nodo, registro);
    if (observador) observador.observe(nodo);
    else montar(nodo, registro).catch(() => informarFalla(nodo));
  }
  if (registros.size === 0) {
    observador?.disconnect();
    observador = null;
  }
}

addEventListener("sitio:navegacion", iniciarMapasOro);
iniciarMapasOro();
