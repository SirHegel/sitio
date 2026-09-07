import { crearHabitacionRoja } from "./habitacion-roja.js";

/* Escena delimitada, con partes propias. No crea otro reloj: la sala general
   llama dibujarSalaInteractiva a su cadencia de 30 fps. O(V + W·H) por dibujo;
   V <= 12000 esquinas. Canvas <=90000 píxeles software/360000 hardware.
   Sólo se crea al entrar en vista, se desmonta al navegar y no recibe datos. */
let actual = null;
let iniciado = false;
const reduccion = matchMedia("(prefers-reduced-motion: reduce)");
const fino = matchMedia("(hover: hover) and (pointer: fine)");

function quieta() {
  return document.hidden || reduccion.matches
    || document.body.classList.contains("escena-pausada")
    || document.body.classList.contains("entrada-activa");
}

function notificar() { dispatchEvent(new CustomEvent("sitio:sala-interactiva")); }

function limpiar() {
  if (!actual) return;
  const anterior = actual;
  actual = null;
  anterior.observador.disconnect();
  anterior.eventos.abort();
  anterior.modelo?.destruir();
  anterior.gl?.getExtension("WEBGL_lose_context")?.loseContext();
}

function medir(estado) {
  const caja = estado.lienzo.getBoundingClientRect();
  estado.caja = caja;
  const escala = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(estado.presupuesto / Math.max(1, caja.width * caja.height)));
  const ancho = Math.max(1, Math.floor(caja.width * escala));
  const alto = Math.max(1, Math.floor(caja.height * escala));
  if (estado.lienzo.width !== ancho) estado.lienzo.width = ancho;
  if (estado.lienzo.height !== alto) estado.lienzo.height = alto;
}

function preparar(estado) {
  if (estado.intentado) return;
  estado.intentado = true;
  try {
    estado.gl = estado.lienzo.getContext("webgl", {
      alpha: false, depth: true, antialias: false, stencil: false, powerPreference: "low-power",
    });
    if (!estado.gl) return;
    const gl = estado.gl;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    if (info && /swiftshader|llvmpipe|softpipe|software rasterizer/i.test(String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)))) estado.presupuesto = 90000;
    medir(estado);
    estado.modelo = crearHabitacionRoja(gl);
    if (!estado.modelo) return;
    estado.seccion.classList.add("sala-roja-lista");
    estado.seccion.dataset.motor = "geometria";
    for (const boton of estado.seccion.querySelectorAll("button")) boton.disabled = false;
  } catch { estado.seccion.dataset.motor = "imagen"; }
}

function reflejar(estado) {
  const telon = estado.seccion.querySelector("#abrir-telon");
  const luz = estado.seccion.querySelector("#luz-sala");
  telon.setAttribute("aria-pressed", String(estado.abierto));
  telon.querySelector("span").textContent = estado.abierto ? "Cerrar el telón" : "Abrir el telón";
  luz.setAttribute("aria-pressed", String(estado.encendida));
  luz.querySelector("span").textContent = estado.encendida ? "Apagar la lámpara" : "Encender la lámpara";
  estado.seccion.dataset.telon = estado.abierto ? "abierto" : "cerrado";
  estado.seccion.dataset.luz = estado.encendida ? "encendida" : "apagada";
}

function reiniciar() {
  limpiar();
  const seccion = document.getElementById("sala-roja");
  const lienzo = document.getElementById("sala-roja-lienzo");
  if (!seccion || !lienzo) return;
  const eventos = new AbortController();
  const estado = {
    seccion, lienzo, eventos, modelo: null, gl: null, caja: null, visible: false,
    intentado: false, presupuesto: 360000, abierto: false, encendida: true,
    apertura: 0, luz: 1, x: 0, y: 0, destinoX: 0, destinoY: 0, previsualizando: false,
    ultimo: null, tiempo: 0, pendiente: true, observador: null,
  };
  actual = estado;
  const { signal } = eventos;
  const cambiar = (tipo) => {
    if (tipo === "telon") estado.abierto = !estado.abierto;
    else estado.encendida = !estado.encendida;
    estado.pendiente = true;
    reflejar(estado);
    notificar();
  };
  seccion.querySelector("#abrir-telon").addEventListener("click", () => cambiar("telon"), { signal });
  seccion.querySelector("#luz-sala").addEventListener("click", () => cambiar("luz"), { signal });
  seccion.addEventListener("pointermove", (evento) => {
    if (!estado.visible || quieta() || evento.pointerType !== "mouse" || evento.buttons
      || !fino.matches) return;
    const caja = estado.caja;
    if (!caja?.width || !caja?.height) return;
    estado.destinoX = Math.max(-1, Math.min(1, (evento.clientX - caja.left) / caja.width * 2 - 1));
    estado.destinoY = Math.max(-1, Math.min(1, (evento.clientY - caja.top) / caja.height * 2 - 1));
  }, { passive: true, signal });
  seccion.addEventListener("pointerleave", () => { estado.destinoX = 0; estado.destinoY = 0; estado.previsualizando = false; }, { passive: true, signal });
  const telon = seccion.querySelector("#abrir-telon");
  telon.addEventListener("pointerenter", (evento) => {
    if (evento.pointerType === "mouse" && !quieta()) estado.previsualizando = true;
  }, { passive: true, signal });
  telon.addEventListener("pointerleave", () => { estado.previsualizando = false; }, { passive: true, signal });
  lienzo.addEventListener("webglcontextlost", (evento) => {
    evento.preventDefault();
    estado.modelo = null;
    estado.seccion.classList.remove("sala-roja-lista");
    estado.seccion.dataset.motor = "imagen";
    for (const boton of estado.seccion.querySelectorAll("button")) boton.disabled = true;
  }, { signal });
  lienzo.addEventListener("webglcontextrestored", () => {
    estado.intentado = false;
    preparar(estado);
    estado.pendiente = true;
    notificar();
  }, { signal });
  estado.observador = new IntersectionObserver((entradas) => {
    if (actual !== estado) return;
    estado.visible = entradas.some((entrada) => entrada.isIntersecting);
    estado.ultimo = null;
    if (estado.visible) {
      preparar(estado);
      medir(estado);
      estado.pendiente = true;
      notificar();
    }
  }, { threshold: 0, rootMargin: "0px" });
  estado.observador.observe(lienzo);
  reflejar(estado);
}

export function dibujarSalaInteractiva(tiempoGeneral = 0) {
  const estado = actual;
  if (!estado?.visible || !estado.modelo || !estado.lienzo.isConnected) return;
  const detenida = quieta();
  if (detenida && !estado.pendiente) { estado.ultimo = null; return; }
  const delta = estado.ultimo === null ? 0 : Math.min(.08, Math.max(0, tiempoGeneral - estado.ultimo));
  estado.ultimo = tiempoGeneral;
  const suavidad = detenida ? 1 : 1 - Math.exp(-Math.max(delta, .001) * 4.2);
  if (!detenida) estado.tiempo += delta;
  const destino = estado.abierto || !detenida && estado.previsualizando ? 1 : 0;
  const luz = estado.encendida ? 1 : 0;
  estado.apertura += (destino - estado.apertura) * suavidad;
  estado.luz += (luz - estado.luz) * suavidad;
  estado.x += ((detenida ? 0 : estado.destinoX) - estado.x) * suavidad;
  estado.y += ((detenida ? 0 : estado.destinoY) - estado.y) * suavidad;
  estado.modelo.dibujar({
    ancho: estado.lienzo.width, alto: estado.lienzo.height,
    tiempo: estado.tiempo, x: estado.x, y: estado.y,
    apertura: estado.apertura, lampara: estado.luz,
  });
  estado.pendiente = false;
}

export function iniciarSalaInteractiva() {
  if (iniciado) return;
  iniciado = true;
  addEventListener("sitio:navegacion", reiniciar);
  addEventListener("resize", () => {
    if (!actual?.visible) return;
    medir(actual); actual.pendiente = true; notificar();
  }, { passive: true });
  addEventListener("scroll", () => {
    if (actual?.visible) actual.caja = actual.lienzo.getBoundingClientRect();
  }, { passive: true });
  reiniciar();
}
