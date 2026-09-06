/* Carga el paquete cartográfico únicamente cuando uno de sus montajes se
   acerca al viewport. Complejidad O(N), memoria O(N), N mapas del artículo. */

const nodos = [...document.querySelectorAll("[data-mapa-oro]")];

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
    manifiestos.set(url, fetch(url, { credentials: "same-origin" }).then((respuesta) => {
      if (!respuesta.ok) throw new Error(`manifiesto HTTP ${respuesta.status}`);
      return respuesta.json();
    }));
  }
  return manifiestos.get(url);
}

async function montar(nodo) {
  nodo.setAttribute("aria-busy", "true");
  hojaDeEstilo();
  paquete ||= import("/activos/mapa-oro.js");
  const urlManifiesto = nodo.dataset.manifiesto || "/data/oro/manifiesto.json";
  const [modulo, manifiestoInicial] = await Promise.all([
    paquete,
    obtenerManifiesto(urlManifiesto).catch(() => null),
  ]);
  modulo.montarMapasOro([nodo], manifiestoInicial);
  nodo.setAttribute("aria-busy", "false");
}

function informarFalla(nodo) {
  nodo.setAttribute("aria-busy", "false");
  nodo.setAttribute("role", "status");
  nodo.setAttribute("aria-live", "polite");
  nodo.textContent = "El mapa no cargó. La tabla accesible conserva los datos.";
}

if ("IntersectionObserver" in globalThis) {
  const observador = new IntersectionObserver((entradas) => {
    for (const entrada of entradas) {
      if (!entrada.isIntersecting) continue;
      observador.unobserve(entrada.target);
      entrada.target.dataset.inicioMapaOro = String(entrada.time || performance.now());
      montar(entrada.target).catch(() => informarFalla(entrada.target));
    }
  }, { rootMargin: "500px 0px" });
  nodos.forEach((nodo) => observador.observe(nodo));
} else {
  nodos.forEach((nodo) => {
    nodo.dataset.inicioMapaOro = String(performance.now());
    montar(nodo).catch(() => informarFalla(nodo));
  });
}
