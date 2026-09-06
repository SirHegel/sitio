/* Las tablas y fórmulas que exceden la columna deben poder recorrerse con
   teclado, también en navegadores que no enfocan el scroll automáticamente.
   Se conserva la semántica nativa de las tablas y todo atributo del autor. */

const originales = new WeakMap();
let regiones = [];
let observador = null;
let pendiente = false;
let escuchaResize = false;

/* O(N) tiempo y O(N) memoria para N regiones. Invariante: solo se agregan
   paradas de teclado a cajas con desplazamiento horizontal real; al dejar
   de desbordar se restauran exactamente los atributos anteriores. */
function actualizarRegiones() {
  pendiente = false;
  regiones.forEach((elemento, indice) => {
    const estilo = getComputedStyle(elemento);
    const desborda = /auto|scroll/.test(estilo.overflowX)
      && elemento.clientWidth > 0
      && elemento.scrollWidth > elemento.clientWidth + 1;
    const anteriores = originales.get(elemento);

    if (!desborda) {
      if (!anteriores) return;
      for (const [nombre, valor] of Object.entries(anteriores)) {
        if (valor === null) elemento.removeAttribute(nombre);
        else elemento.setAttribute(nombre, valor);
      }
      originales.delete(elemento);
      return;
    }
    if (anteriores) return;

    const atributos = {};
    const asignar = (nombre, valor) => {
      atributos[nombre] = elemento.getAttribute(nombre);
      elemento.setAttribute(nombre, valor);
    };

    if (!elemento.hasAttribute("tabindex")) asignar("tabindex", "0");
    const tabla = elemento.tagName === "TABLE";
    if (!tabla && !elemento.hasAttribute("role")) asignar("role", "region");
    if (!elemento.hasAttribute("aria-label")
      && !elemento.hasAttribute("aria-labelledby")
      && !(tabla && elemento.caption)) {
      asignar("aria-label", `${tabla ? "Tabla" : "Bloque de texto"} ${indice + 1}, desplazamiento horizontal`);
    }
    originales.set(elemento, atributos);
  });
}

/* O(1): varias notificaciones de tamaño comparten una sola medición. */
function programarMedicion() {
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(actualizarRegiones);
}

/* O(N) tiempo y memoria. Cada navegación sustituye las referencias al
   documento anterior y desconecta su observador; no acumula listeners. */
export function iniciarLecturaAccesible(raiz = document) {
  observador?.disconnect();
  regiones = [...raiz.querySelectorAll(".prosa pre, .prosa table, .tabla-contenedor")];
  actualizarRegiones();

  if ("ResizeObserver" in window) {
    observador ||= new ResizeObserver(programarMedicion);
    regiones.forEach((elemento) => observador.observe(elemento));
  } else if (!escuchaResize) {
    window.addEventListener("resize", programarMedicion, { passive: true });
    escuchaResize = true;
  }
  document.fonts?.ready.then(programarMedicion);
}
