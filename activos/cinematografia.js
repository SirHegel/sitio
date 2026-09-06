import { crearSalaWebGL } from "./sala-webgl.js";

/* Cámara y controles: un solo rAF, máximo 30 fps, en todas las rutas públicas.
   Pausa, movimiento reducido, pestaña oculta y administración detienen el bucle.
   Escena [0,2], cambio 1.8 s,
   recorrido voluntario 9 s por escena. O(1) por cuadro de control; O(W·H) GPU.
   El scroll sigue siendo nativo; ningún evento bloquea el contenido. */
export function iniciarCinematografia() {
  const documento = document.documentElement;
  const cuerpo = document.body;
  if (documento.classList.contains("js-cine")) return;
  const reduccion = matchMedia("(prefers-reduced-motion: reduce)");
  const fino = matchMedia("(pointer: fine)");
  const escenas = ["terciopelo", "nocturno", "celuloide"];
  const nombres = ["Terciopelo", "Nocturno", "Celuloide"];
  const titulos = ["La habitación roja", "Después de medianoche", "La sala de proyección"];
  const actos = ["Acto I / El umbral", "Acto II / La ciudad", "Acto III / El montaje"];
  const lienzo = document.getElementById("lienzo");
  let sala = null;
  let salaIntentada = false;
  let pausaManual = false;
  let eleccionManual = false;
  let indice = 0;
  let cuadro = 0;
  let ultimo = 0;
  let tiempo = 0;
  let recorrido = false;
  let relojRecorrido = 0;
  let transicion = null;
  let versionEscena = 0;
  let observador = null;
  let paginaActiva = true;
  const puntero = { x: 0, y: 0, destinoX: 0, destinoY: 0 };
  try { pausaManual = localStorage.getItem("jsar:escena-pausa") === "1"; } catch {}

  function administrativa() { return cuerpo.classList.contains("pagina-admin"); }
  function corriendo() { return paginaActiva && !administrativa() && !pausaManual && !reduccion.matches && !document.hidden; }

  function reflejar() {
    const nombre = escenas[indice];
    cuerpo.dataset.escena = nombre;
    const cambiar = document.getElementById("cambiar-escena");
    if (cambiar) {
      cambiar.replaceChildren(document.createTextNode(nombres[indice] + " "));
      const flecha = document.createElement("span");
      flecha.setAttribute("aria-hidden", "true");
      flecha.textContent = "↗";
      cambiar.append(flecha);
      cambiar.setAttribute("aria-label", `Cambiar ambiente visual: ${nombres[indice]}`);
    }
    document.querySelectorAll(".escena-indice").forEach((nodo) => { nodo.textContent = String(indice + 1).padStart(2, "0"); });
    document.querySelectorAll("[data-escena-titulo]").forEach((nodo) => { nodo.textContent = nodo.getAttribute(`data-titulo-${nombre}`) || titulos[indice]; });
    document.querySelectorAll("[data-escena-subtitulo]").forEach((nodo) => { nodo.textContent = nodo.getAttribute(`data-subtitulo-${nombre}`) || actos[indice]; });
    document.querySelectorAll("[data-ir-escena]").forEach((nodo) => {
      const activa = nodo.dataset.irEscena === nombre;
      nodo.setAttribute("aria-pressed", String(activa));
      nodo.classList.toggle("activa", activa);
    });
    const recorrer = document.getElementById("recorrer-escenas");
    if (recorrer) {
      recorrer.setAttribute("aria-pressed", String(recorrido));
      recorrer.setAttribute("aria-label", recorrido ? "Detener recorrido cinematográfico" : "Recorrer las tres escenas");
      recorrer.disabled = reduccion.matches || administrativa() || !sala?.disponible(nombre);
      const etiqueta = recorrer.querySelector("[data-recorrido-etiqueta]");
      if (etiqueta) etiqueta.textContent = recorrido ? "Detener recorrido" : "Recorrer las escenas";
    }
  }

  function detenerRecorrido() {
    if (!recorrido) return;
    recorrido = false;
    relojRecorrido = 0;
    reflejar();
  }

  function dibujar() {
    const lista = !administrativa() && sala?.dibujar({
      escena: escenas[indice], anterior: transicion?.anterior,
      progreso: transicion ? Math.min(1, transicion.tiempo / 1.8) : 1,
      tiempo, x: puntero.x, y: puntero.y,
      avance: Math.min(1, Math.max(0, scrollY / Math.max(1, innerHeight))),
      movimiento: !reduccion.matches,
    });
    cuerpo.classList.toggle("sala-lista", Boolean(lista));
    if (lienzo) lienzo.dataset.motor = lista ? "webgl" : "imagen";
    return lista;
  }

  async function escena(nombre, animada = true) {
    const siguiente = escenas.indexOf(nombre);
    if (siguiente < 0) return;
    const anterior = escenas[indice];
    const version = ++versionEscena;
    indice = siguiente;
    reflejar();
    if (nombre === anterior) return;
    transicion = null;
    cuerpo.classList.remove("escena-cambiando");
    const disponible = await sala?.preparar(nombre);
    if (version !== versionEscena) return;
    if (animada && disponible && sala.disponible(anterior) && corriendo()) {
      transicion = { anterior, tiempo: 0 };
      cuerpo.classList.add("escena-cambiando");
    }
    dibujar(); estado();
    dispatchEvent(new CustomEvent("sitio:escena", { detail: { escena: nombre, indice, transicion: Boolean(transicion) } }));
  }

  function escenaDeRuta() {
    if (eleccionManual) return;
    const ruta = cuerpo.dataset.ruta || location.pathname;
    escena(ruta.startsWith("/blog/") ? "celuloide" : /^\/(proyectos|contribuciones|academico)\//.test(ruta) ? "nocturno" : "terciopelo", false);
  }

  function animar(ahora) {
    cuadro = 0;
    if (!corriendo() || !sala?.disponible(escenas[indice])) return;
    const transcurrido = ahora - ultimo;
    if (transcurrido >= 1000 / 30) {
      const delta = Math.min(transcurrido / 1000, .08);
      ultimo = ahora;
      tiempo += delta;
      const inercia = 1 - Math.exp(-delta * 3.5);
      puntero.x += (puntero.destinoX - puntero.x) * inercia;
      puntero.y += (puntero.destinoY - puntero.y) * inercia;
      if (transicion) {
        transicion.tiempo += delta;
        if (transicion.tiempo >= 1.8) {
          transicion = null;
          cuerpo.classList.remove("escena-cambiando");
        }
      }
      if (recorrido) {
        relojRecorrido += delta;
        if (relojRecorrido >= 9 && !transicion) {
          relojRecorrido = 0;
          escena(escenas[(indice + 1) % escenas.length]);
        }
      }
      dibujar();
    }
    cuadro = requestAnimationFrame(animar);
  }

  function iniciarSala() {
    // La lectura estática usa la fotografía CSS sin abrir un contexto GPU.
    // Un cambio posterior de preferencia habilita un único intento de creación.
    if (salaIntentada || administrativa() || reduccion.matches || !paginaActiva || document.hidden) return;
    salaIntentada = true;
    sala = crearSalaWebGL(lienzo, () => {
      if (!sala?.disponible(escenas[indice])) {
        transicion = null;
        cuerpo.classList.remove("escena-cambiando");
        detenerRecorrido();
      }
      dibujar(); estado();
    });
    // La primera imagen manda; las demás se precargan sin frenar el texto.
    sala?.preparar(escenas[indice]).then(() => {
      dibujar(); estado();
      escenas.filter((nombre) => nombre !== escenas[indice]).forEach((nombre) => { sala.preparar(nombre); });
    });
  }

  function estado() {
    iniciarSala();
    cancelAnimationFrame(cuadro);
    cuadro = 0;
    const pausado = administrativa() || pausaManual || reduccion.matches;
    const oculta = document.hidden || !paginaActiva;
    cuerpo.classList.toggle("escena-pausada", pausado);
    cuerpo.classList.toggle("escena-oculta", oculta);
    if (pausado || oculta) detenerRecorrido();
    if ((pausado || oculta) && transicion) {
      transicion = null;
      cuerpo.classList.remove("escena-cambiando");
      dibujar();
    }
    const pausar = document.getElementById("pausar-escena");
    if (pausar) {
      pausar.setAttribute("aria-pressed", String(pausado));
      pausar.setAttribute("aria-label", reduccion.matches ? "Movimiento reducido activado en tu dispositivo" : pausado ? "Reanudar movimiento del sitio" : "Pausar movimiento del sitio");
      pausar.disabled = reduccion.matches;
      if (pausar.firstElementChild) pausar.firstElementChild.textContent = pausado ? "▷" : "Ⅱ";
    }
    reflejar();
    if (corriendo() && sala?.disponible(escenas[indice])) {
      ultimo = performance.now();
      cuadro = requestAnimationFrame(animar);
    }
  }

  function medir() { sala?.medir(); dibujar(); estado(); }

  function observarEscenas() {
    observador?.disconnect();
    escenaDeRuta(); reflejar();
    // El plano inicial se dirige manualmente. Otras páginas pueden marcar un
    // cambio deliberado sin que todas sus secciones compitan al entrar en vista.
    if ((cuerpo.dataset.ruta || location.pathname) === "/" || !("IntersectionObserver" in window)) return;
    observador = new IntersectionObserver((entradas) => {
      if (eleccionManual || recorrido || !corriendo() || transicion) return;
      const entrada = entradas.find((e) => e.isIntersecting);
      if (entrada) escena(entrada.target.dataset.ambiente);
    }, { rootMargin: "-35% 0px -45% 0px", threshold: 0 });
    document.querySelectorAll('[data-ambiente][data-escena-scroll="si"]').forEach((nodo) => observador.observe(nodo));
  }

  function menu(abierto, enfocar = false) {
    document.querySelector(".barra")?.classList.toggle("menu-abierto", abierto);
    const boton = document.querySelector(".menu-mando");
    boton?.setAttribute("aria-expanded", String(abierto));
    if (boton?.lastElementChild) boton.lastElementChild.textContent = abierto ? "−" : "＋";
    if (enfocar) boton?.focus();
  }

  document.addEventListener("click", (evento) => {
    if (!(evento.target instanceof Element)) return;
    const destino = evento.target.closest("[data-ir-escena]");
    if (destino || evento.target.closest("#cambiar-escena")) {
      detenerRecorrido(); eleccionManual = true;
      escena(destino?.dataset.irEscena || escenas[(indice + 1) % escenas.length]);
    }
    if (evento.target.closest("#pausar-escena")) {
      pausaManual = !pausaManual;
      try { localStorage.setItem("jsar:escena-pausa", pausaManual ? "1" : "0"); } catch {}
      estado();
    }
    if (evento.target.closest("#recorrer-escenas") && !reduccion.matches && !administrativa() && sala?.disponible(escenas[indice])) {
      recorrido = !recorrido;
      relojRecorrido = 0;
      if (recorrido) {
        eleccionManual = true; pausaManual = false;
        try { localStorage.setItem("jsar:escena-pausa", "0"); } catch {}
      }
      estado();
    }
    const botonMenu = evento.target.closest(".menu-mando");
    if (botonMenu) menu(botonMenu.getAttribute("aria-expanded") !== "true");
    else if (evento.target.closest("nav.menu a") || !evento.target.closest(".barra")) menu(false);
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && document.querySelector(".menu-abierto")) menu(false, true);
    if (["Escape", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"].includes(evento.key)) detenerRecorrido();
  });
  addEventListener("pointermove", (evento) => {
    if (!fino.matches || !corriendo()) return;
    puntero.destinoX = (evento.clientX / innerWidth - .5) * 2;
    puntero.destinoY = (evento.clientY / innerHeight - .5) * 2;
  }, { passive: true });
  addEventListener("wheel", detenerRecorrido, { passive: true });
  addEventListener("touchmove", detenerRecorrido, { passive: true });
  addEventListener("scroll", detenerRecorrido, { passive: true });
  addEventListener("resize", medir, { passive: true });
  document.addEventListener("visibilitychange", estado);
  reduccion.addEventListener("change", estado);
  addEventListener("pagehide", () => { paginaActiva = false; estado(); });
  addEventListener("pageshow", () => { paginaActiva = true; estado(); });
  addEventListener("sitio:transicion", () => { detenerRecorrido(); menu(false); });
  addEventListener("sitio:navegacion", () => { menu(false); observarEscenas(); dibujar(); estado(); });

  documento.classList.add("js-cine");
  const puerta = document.getElementById("puerta");
  let visto = false;
  try { visto = sessionStorage.getItem("jsar:entrado") === "1"; sessionStorage.setItem("jsar:entrado", "1"); } catch {}
  if (visto || reduccion.matches) puerta?.remove();
  else setTimeout(() => puerta?.remove(), 1800);
  observarEscenas();
  medir(); estado();
}
