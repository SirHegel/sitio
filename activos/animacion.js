/* ============================================================================
   Movimiento. Tres lugares y ni uno más: detrás del scrim, fuera de la
   columna de texto, y en el ornamento. Quien pide movimiento reducido recibe
   la página completa, quieta.
   ========================================================================= */

import { MusicaPersistente } from "./musica.js";
import { iniciarCinematografia } from "./cinematografia.js";
import { iniciarLecturaAccesible } from "./lectura-accesible.js";
import { iniciarMovimientoInterfaz } from "./movimiento-interfaz.js";
import { iniciarEntrada, entradaPendiente } from "./entrada.js";
import "./cargar-mapa-oro.js";

const preferenciaMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
let quieto = preferenciaMovimiento.matches;
let detenerTransiciones = () => {};
const movimientoQuieto = () => quieto || document.body.classList.contains("escena-pausada")
  || document.body.classList.contains("pagina-admin");
preferenciaMovimiento.addEventListener("change", (evento) => {
  quieto = evento.matches;
  if (quieto) detenerTransiciones();
  reiniciarContenido();
});
let vigiaRevelado = null;
let vigiaContadores = null;
let versionContenido = 0;
let actualizarAvance = () => {};
addEventListener("sitio:movimiento", () => {
  if (!movimientoQuieto()) return;
  detenerTransiciones();
  reiniciarContenido();
});

/* -------------------------------------------------- el nombre, letra a letra */

function componerNombre() {
  for (const titulo of document.querySelectorAll(".nombre[data-componer]")) {
    if (titulo.dataset.compuesto === "1") continue;
    const texto = titulo.getAttribute("aria-label") || titulo.textContent.trim();
    if (!texto) continue;
    titulo.setAttribute("aria-label", texto);
    titulo.dataset.compuesto = "1";
    titulo.textContent = "";

    // Los glifos se agrupan por palabra. Sueltos, el navegador puede cortar el
    // nombre entre dos letras cualesquiera — y lo hace.
    let n = 0;
    const palabras = texto.split(" ");
    palabras.forEach((palabra, i) => {
      const caja = document.createElement("span");
      caja.className = "palabra";
      caja.setAttribute("aria-hidden", "true");
      for (const caracter of palabra) {
        const g = document.createElement("span");
        g.className = "g";
        g.style.setProperty("--g", n++);
        g.textContent = caracter;
        caja.append(g);
      }
      titulo.append(caja);
      if (i < palabras.length - 1) {
        titulo.append(Object.assign(document.createElement("span"), { className: "esp" }));
      }
    });
  }
}


/* --------------------------------------------------- revelado al desplazar */

function revelado() {
  vigiaRevelado?.disconnect();
  vigiaRevelado = null;
  const piezas = document.querySelectorAll(".revelar, .regla");
  if (!piezas.length) return;

  if (movimientoQuieto() || !("IntersectionObserver" in window)) {
    piezas.forEach((p) => p.classList.add("visible"));
    return;
  }

  // El escalonado se calcula por grupo: los hermanos entran uno tras otro.
  document.querySelectorAll("[data-escalonar]").forEach((grupo) => {
    [...grupo.children].forEach((hijo, i) => hijo.style.setProperty("--i", Math.min(i, 4)));
  });

  /* El umbral es 0 y no una fracción del elemento. Con `threshold: 0.06`
     se exigía que se viera el 6 % de la pieza, y eso vuelve imposible
     revelar cualquier bloque más alto que unas dieciséis pantallas: el
     cuerpo de un artículo largo mide ~19.700 px en un móvil, cuyo 6 % son
     ~1.180 px, más que los ~844 px que tiene la pantalla. La condición no
     se cumplía nunca, la clase `visible` no llegaba y el artículo entero
     se quedaba en opacity 0.

     Se veía solo en pantallas pequeñas y con textos largos, porque en un
     monitor el mismo 6 % sí cabe en el alto disponible. Con umbral 0
     basta con que asome un pixel, así que el tamaño del bloque deja de
     importar. El `rootMargin` negativo conserva la intención original:
     revelar cuando la pieza ya entró de verdad, no al rozar el borde. */
  const vigia = (vigiaRevelado = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("visible");
        vigia.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0 }
  ));

  piezas.forEach((p) => {
    /* Red de seguridad: si una pieza ya ocupa la pantalla al cargar
       —o el observador no llega a dispararse por cualquier motivo— se
       muestra igualmente. Un texto ilegible es peor que un texto sin
       animación. */
    const caja = p.getBoundingClientRect();
    if (p.classList.contains("prosa") || (caja.top < innerHeight && caja.bottom > 0)) p.classList.add("visible");
    else vigia.observe(p);
  });
}

/* ------------------------------------------------------------- contadores */

function contadores(version = versionContenido) {
  vigiaContadores?.disconnect();
  vigiaContadores = null;
  const cifras = document.querySelectorAll("[data-hasta]");
  if (!cifras.length) return;

  const pintar = (el, v) => {
    const sufijo = el.dataset.sufijo || "";
    el.textContent = Math.round(v).toLocaleString("es-CO") + sufijo;
  };

  if (movimientoQuieto() || !("IntersectionObserver" in window)) {
    cifras.forEach((el) => pintar(el, Number(el.dataset.hasta)));
    return;
  }

  const vigia = (vigiaContadores = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        const el = e.target;
        vigia.unobserve(el);
        const hasta = Number(el.dataset.hasta);
        const inicio = performance.now();
        const dur = 1700;
        const paso = (ahora) => {
          if (version !== versionContenido || !el.isConnected) return;
          const p = Math.min(1, (ahora - inicio) / dur);
          // Desaceleración: la cifra llega, no aterriza de golpe.
          pintar(el, hasta * (1 - Math.pow(1 - p, 3.2)));
          if (p < 1) requestAnimationFrame(paso);
        };
        requestAnimationFrame(paso);
      }
    },
    { threshold: 0.4 }
  ));

  cifras.forEach((el) => { el.textContent = "0"; vigia.observe(el); });
}

/* --------------------------------------------- barra de avance y barra fija */

function avance() {
  const barra = document.getElementById("avance");
  const cabecera = document.querySelector(".barra");
  let pendiente = false;

  actualizarAvance = function actualizar() {
    pendiente = false;
    const alto = document.documentElement.scrollHeight - innerHeight;
    const p = alto > 0 ? scrollY / alto : 0;
    if (barra) barra.style.transform = `scaleX(${p})`;
    if (cabecera) cabecera.classList.toggle("encogida", scrollY > 40);
  };

  addEventListener("scroll", () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(actualizarAvance);
  }, { passive: true });

  actualizarAvance();
}


/* ------------------------------------------------- puerta de entrada y audio */

function audio() {
  const mando = document.getElementById("mando");
  const musica = new MusicaPersistente();
  const LLAVE = "jsar:musica";
  const titulo = mando?.dataset.tituloMusica || mando?.dataset.obra || mando?.dataset.titulo || "Beethoven · Sinfonía n.º 5";

  const preferida = () => {
    try { return localStorage.getItem(LLAVE) === "1"; } catch { return false; }
  };

  const guardarPreferencia = (encendida) => {
    try { localStorage.setItem(LLAVE, encendida ? "1" : "0"); } catch {}
  };
  const eligiendoEntrada = () => entradaPendiente() || Boolean(document.getElementById("puerta")?.open);

  function reflejar() {
    if (!mando) return;
    mando.classList.toggle("sonando", musica.sonando);
    mando.classList.toggle("sin-audio", Boolean(musica.error));
    mando.setAttribute("aria-pressed", String(musica.sonando));
    mando.dataset.estado = musica.error
      ? "error"
      : musica.bloqueada ? "esperando-gesto" : musica.sonando ? "sonando" : "pausada";
    mando.setAttribute(
      "aria-label",
      musica.error
        ? "La música no está disponible. Intentar reproducir de nuevo"
        : musica.sonando ? `Silenciar ${titulo}` : `Reproducir ${titulo}`
    );
    const obra = mando.querySelector(".obra");
    if (obra) obra.textContent = musica.sonando ? titulo : "Música";
  }

  async function intentarTocar() {
    musica.solicitada = true;
    try {
      await musica.tocar();
      return true;
    } catch {
      // `play()` puede ser bloqueado aun con una preferencia guardada. No se
      // simula un estado activo: el siguiente gesto o regreso a la pestaña lo
      // intentará de nuevo sobre el mismo elemento.
      return false;
    } finally {
      reflejar();
    }
  }


  mando?.addEventListener("click", async () => {
    if (musica.sonando) {
      guardarPreferencia(false);
      musica.callar();
      reflejar();
      return;
    }
    guardarPreferencia(true);
    await intentarTocar();
  });

  musica.suscribir(reflejar);
  musica.preparar();


  if (preferida()) {
    musica.solicitada = true;
    const reanudarConGesto = async (evento) => {
      if (eligiendoEntrada() || evento.target?.closest?.("#mando")) return;
      if (!preferida()) {
        removeEventListener("pointerdown", reanudarConGesto);
        removeEventListener("keydown", reanudarConGesto);
        return;
      }
      if (await intentarTocar()) {
        removeEventListener("pointerdown", reanudarConGesto);
        removeEventListener("keydown", reanudarConGesto);
      }
    };
    addEventListener("pointerdown", reanudarConGesto, { passive: true });
    addEventListener("keydown", reanudarConGesto);
  }

  // No se pausa al ocultar la pestaña. Si el sistema operativo suspendió el
  // medio, al volver se solicita reanudarlo; un rechazo de autoplay queda en
  // silencio real y el mando sigue disponible para un gesto explícito.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && preferida() && !eligiendoEntrada()) intentarTocar();
  });
  addEventListener("pageshow", () => {
    if (preferida() && !musica.sonando && !eligiendoEntrada()) intentarTocar();
  });

  reflejar();
  return {
    tocar: () => { guardarPreferencia(true); return intentarTocar(); },
    silenciar: () => { guardarPreferencia(false); musica.callar(); reflejar(); },
  };
}

/* ---------------------------------------- navegación progresiva persistente */

const SELECTORES_CABEZA = [
  'meta[name="description"]',
  'meta[name="author"]',
  'meta[name="robots"]',
  'meta[name="google-site-verification"]',
  'meta[name="theme-color"]',
  'meta[name="color-scheme"]',
  'meta[property^="og:"]',
  'meta[property^="profile:"]',
  'meta[name^="twitter:"]',
  'link[rel="canonical"]',
  'link[rel="alternate"]',
  'script[type="application/ld+json"]',
].join(",");

function reiniciarContenido({ entrada = false } = {}) {
  versionContenido++;
  const principal = document.getElementById("principal");
  principal?.classList.toggle("entrada-cine", entrada && !movimientoQuieto());
  componerNombre();
  revelado();
  contadores(versionContenido);
  iniciarLecturaAccesible();
  requestAnimationFrame(actualizarAvance);
}

function sincronizarCabeza(nuevoDocumento) {
  document.title = nuevoDocumento.title;
  document.documentElement.lang = nuevoDocumento.documentElement.lang || "es";
  document.head.querySelectorAll(SELECTORES_CABEZA).forEach((nodo) => nodo.remove());
  for (const nodo of nuevoDocumento.head.querySelectorAll(SELECTORES_CABEZA)) {
    document.head.append(document.importNode(nodo, true));
  }
}

function navegacion() {
  const MARCA = "__jsarNavegacionProgresiva";
  if (window[MARCA]) return;
  window[MARCA] = true;

  let controlador = null;
  let secuencia = 0;
  let rutaMostrada = location.pathname + location.search;
  let guardadoPendiente = false;
  let navegando = false;
  let transicionActiva = null;
  let avisoPendiente = 0;
  const animaciones = new Set();

  const corte = document.createElement("div");
  corte.className = "corte-proyector";
  corte.setAttribute("aria-hidden", "true");
  document.body.append(corte);

  // O(A), A <= 3. Invariante: cancelar deja el documento actual legible y
  // devuelve el control al último destino; no conserva estilos de WAAPI.
  detenerTransiciones = () => {
    transicionActiva?.skipTransition();
    transicionActiva = null;
    for (const animacion of animaciones) animacion.cancel();
    animaciones.clear();
    document.documentElement.removeAttribute("data-transicion");
  };

  function animar(elemento, cuadros, opciones) {
    if (movimientoQuieto() || !elemento?.animate) return Promise.resolve();
    const animacion = elemento.animate(cuadros, opciones);
    animaciones.add(animacion);
    return animacion.finished.catch(() => {}).finally(() => {
      animaciones.delete(animacion);
      animacion.cancel();
    });
  }

  function cancelarNavegacion() {
    secuencia++;
    controlador?.abort();
    controlador = null;
    navegando = false;
    clearTimeout(avisoPendiente);
    detenerTransiciones();
    document.documentElement.classList.remove("navegando");
    document.getElementById("principal")?.removeAttribute("aria-busy");
  }

  const estadoActual = () =>
    history.state && typeof history.state === "object" ? history.state : {};

  const guardarDesplazamiento = () => {
    guardadoPendiente = false;
    if (navegando) return;
    history.replaceState(
      { ...estadoActual(), __jsarPjax: true, scroll: [scrollX, scrollY] },
      "",
      location.href
    );
  };

  history.scrollRestoration = "manual";
  guardarDesplazamiento();
  addEventListener("scroll", () => {
    if (guardadoPendiente || navegando) return;
    guardadoPendiente = true;
    requestAnimationFrame(guardarDesplazamiento);
  }, { passive: true });

  const anuncio = document.createElement("div");
  anuncio.className = "solo-lectores";
  anuncio.setAttribute("role", "status");
  anuncio.setAttribute("aria-live", "polite");
  anuncio.setAttribute("aria-atomic", "true");
  document.body.append(anuncio);

  const anunciar = (turno) => {
    clearTimeout(avisoPendiente);
    anuncio.textContent = "";
    avisoPendiente = setTimeout(() => {
      if (turno === secuencia) anuncio.textContent = `Página cargada: ${document.title}`;
    }, 30);
  };

  const idDesdeHash = (hash) => {
    if (!hash || hash === "#") return null;
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); }
    catch { return document.getElementById(hash.slice(1)); }
  };

  const desplazar = (url, posicion = null) => {
    const destino = idDesdeHash(url.hash);
    if (Array.isArray(posicion) && posicion.length === 2) {
      scrollTo({ left: Number(posicion[0]) || 0, top: Number(posicion[1]) || 0, behavior: "instant" });
    } else if (destino) {
      destino.scrollIntoView({ behavior: "instant" });
    } else {
      scrollTo({ left: 0, top: 0, behavior: "instant" });
    }
    actualizarAvance();
  };

  const enfocar = (url, posicion = null, { turno = secuencia, mover = true, focoInicial = null } = {}) => {
    requestAnimationFrame(() => {
      if (turno !== secuencia) return;
      const principal = document.getElementById("principal");
      const destino = idDesdeHash(url.hash);
      const foco = destino || principal;
      const activo = document.activeElement;
      const otroControl = !mover && activo !== document.body && activo !== focoInicial
        && activo?.isConnected && !principal?.contains(activo);
      if (foco && !otroControl) {
        if (!foco.matches("a, button, input, select, textarea, [tabindex]")) foco.tabIndex = -1;
        foco.focus({ preventScroll: true });
      }

      if (mover) desplazar(url, posicion);
      anunciar(turno);
    });
  };

  const enlaceElegible = (evento) => {
    if (evento.defaultPrevented || evento.button !== 0) return null;
    // El panel carga código y política de analítica propios; se mantiene como
    // frontera de documento completa tanto al entrar como al salir.
    if (document.body.classList.contains("pagina-admin")) return null;
    if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return null;
    const enlace = evento.target instanceof Element ? evento.target.closest("a[href]") : null;
    if (!enlace || enlace.hasAttribute("download")) return null;
    if (enlace.target && enlace.target.toLowerCase() !== "_self") return null;
    if (enlace.dataset.navegacion === "normal" || enlace.getAttribute("rel")?.split(/\s+/).includes("external")) return null;

    const url = new URL(enlace.href, location.href);
    if (!/^https?:$/.test(url.protocol) || url.origin !== location.origin) return null;
    if (/^\/(admin|api|activos)(\/|$)/.test(url.pathname)) return null;
    if (/\.(?!html?$)[a-z\d]{1,8}$/i.test(url.pathname)) return null;
    return url;
  };

  async function ir(url, { historial = "push", posicion = null } = {}) {
    const turno = ++secuencia;
    const focoInicial = document.activeElement;
    controlador?.abort();
    detenerTransiciones();
    clearTimeout(avisoPendiente);
    const peticion = new AbortController();
    controlador = peticion;
    navegando = true;
    document.documentElement.classList.add("navegando");
    document.getElementById("principal")?.setAttribute("aria-busy", "true");

    try {
      const respuesta = await fetch(url.href, {
        signal: peticion.signal,
        credentials: "same-origin",
        headers: { Accept: "text/html, application/xhtml+xml" },
      });
      const tipo = respuesta.headers.get("content-type") || "";
      const final = new URL(respuesta.url || url.href);
      if (url.hash) final.hash = url.hash;
      if (!respuesta.ok || !tipo.includes("text/html") || final.origin !== location.origin) {
        throw new Error("La ruta no devolvió una página HTML interna");
      }

      const texto = await respuesta.text();
      if (turno !== secuencia) return;
      const nuevoDocumento = new DOMParser().parseFromString(texto, "text/html");
      const nuevoPrincipal = nuevoDocumento.querySelector("main#principal");
      const nuevoMenu = nuevoDocumento.querySelector("nav.menu");
      const nuevoPie = nuevoDocumento.querySelector("footer.pie");
      if (!nuevoPrincipal || !nuevoMenu || !nuevoPie || !nuevoDocumento.title
        || nuevoDocumento.body.classList.contains("pagina-admin")) {
        throw new Error("La página interna no tiene la estructura esperada");
      }

      const principal = document.importNode(nuevoPrincipal, true);
      principal.setAttribute("aria-busy", "true");
      const menu = document.importNode(nuevoMenu, true);
      const pie = document.importNode(nuevoPie, true);
      let aplicado = false;
      // O(N) para importar/inicializar N nodos. La comprobación vive DENTRO
      // del callback: ViewTransition puede ejecutarlo después de otro clic.
      // Contenido, URL, metadatos y rastro cambian en una sola operación.
      const aplicar = () => {
        if (aplicado || turno !== secuencia || peticion.signal.aborted) return;
        sincronizarCabeza(nuevoDocumento);
        for (const clase of [...document.body.classList]) {
          if (clase.startsWith("pagina-")) document.body.classList.remove(clase);
        }
        for (const clase of nuevoDocumento.body.classList) {
          if (clase.startsWith("pagina-")) document.body.classList.add(clase);
        }
        document.body.dataset.ruta = nuevoDocumento.body.dataset.ruta || final.pathname;
        document.querySelector("main#principal")?.replaceWith(principal);
        document.querySelector("nav.menu")?.replaceWith(menu);
        document.querySelector("footer.pie")?.replaceWith(pie);
        rutaMostrada = final.pathname + final.search;
        if (historial === "push") {
          history.pushState({ __jsarPjax: true, scroll: [0, 0] }, "", final.href);
        } else if (final.href !== location.href) {
          history.replaceState({ ...estadoActual(), __jsarPjax: true }, "", final.href);
        }
        // El scroll se resuelve antes de la nueva captura, evitando un salto
        // de cámara desde la posición que tenía la página anterior.
        desplazar(final, posicion);
        reiniciarContenido({ entrada: true });
        aplicado = true;
        window.dispatchEvent(new CustomEvent("sitio:navegacion", {
          detail: { path: final.pathname },
        }));
      };

      if (movimientoQuieto() || document.body.dataset.escena === "terciopelo") {
        aplicar();
      } else {
        document.documentElement.dataset.transicion = historial === "pop" ? "regreso" : "avance";
        window.dispatchEvent(new CustomEvent("sitio:transicion", {
          detail: { path: final.pathname, duracion: 920 },
        }));
        const barrido = animar(corte, [
          { transform: "translate3d(-160%, 0, 0) skewX(-12deg)", opacity: 0 },
          { opacity: .8, offset: .23 },
          { opacity: .55, offset: .65 },
          { transform: "translate3d(480%, 0, 0) skewX(-12deg)", opacity: 0 },
        ], { duration: 920, easing: "cubic-bezier(.76, 0, .24, 1)" });

        if (typeof document.startViewTransition === "function") {
          try {
            const transicion = document.startViewTransition(aplicar);
            transicionActiva = transicion;
            // ready rechaza cuando el navegador omite la captura: no es un
            // error de navegación ni debe dejar un rechazo sin atender.
            transicion.ready.catch(() => {});
            await transicion.updateCallbackDone;
            await transicion.finished.catch(() => {});
            if (transicionActiva === transicion) transicionActiva = null;
          } catch {
            aplicar();
          }
        } else {
          await animar(document.getElementById("principal"), [
            { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", transform: "none", opacity: 1 },
            { clipPath: "polygon(100% 0, 100% 0, 100% 100%, 112% 100%)", transform: "translate3d(-24px, 0, 0) scale(.985)", opacity: .2 },
          ], { duration: 300, easing: "cubic-bezier(.65, 0, .8, .35)", fill: "forwards" });
          if (turno !== secuencia) return;
          aplicar();
          await animar(principal, [
            { clipPath: "polygon(0 0, 0 0, -12% 100%, 0 100%)", transform: "translate3d(32px, 0, 0) scale(1.025)", opacity: .25 },
            { clipPath: "polygon(0 0, 112% 0, 100% 100%, 0 100%)", transform: "none", opacity: 1 },
          ], { duration: 620, easing: "cubic-bezier(.16, 1, .3, 1)" });
        }
        await barrido;
      }
      if (turno !== secuencia || !aplicado) return;
      enfocar(final, posicion, { turno, mover: false, focoInicial });
    } catch (error) {
      if (turno !== secuencia || error?.name === "AbortError") return;
      // La mejora es progresiva: si red, CSP, HTML o transiciones fallan, el
      // navegador hace una carga convencional y conserva una página usable.
      if (historial === "pop") location.reload();
      else location.assign(url.href);
    } finally {
      if (turno === secuencia) {
        navegando = false;
        document.documentElement.classList.remove("navegando");
        document.documentElement.removeAttribute("data-transicion");
        document.getElementById("principal")?.removeAttribute("aria-busy");
        controlador = null;
        guardarDesplazamiento();
      }
    }
  }

  document.addEventListener("click", (evento) => {
    const url = enlaceElegible(evento);
    if (!url) return;
    if (url.pathname === location.pathname && url.search === location.search
      && url.pathname + url.search === rutaMostrada) {
      if (navegando) cancelarNavegacion();
      // Un enlace al documento que ya está visible no debe provocar una carga
      // completa (y con ella cortar el audio). Los cambios reales de fragmento
      // se dejan al comportamiento nativo del navegador.
      if (url.hash !== location.hash) return;
      evento.preventDefault();
      enfocar(url);
      return;
    }
    evento.preventDefault();
    guardarDesplazamiento();
    ir(url);
  });

  addEventListener("popstate", (evento) => {
    const url = new URL(location.href);
    const ruta = url.pathname + url.search;
    if (ruta === rutaMostrada) {
      cancelarNavegacion();
      enfocar(url, evento.state?.scroll || null);
      return;
    }
    ir(url, { historial: "pop", posicion: evento.state?.scroll || null });
  });
  addEventListener("pagehide", cancelarNavegacion);
}

/* ------------------------------------------------------------------ arranque */

reiniciarContenido({ entrada: true });
iniciarEntrada(audio());
iniciarCinematografia();
if (movimientoQuieto()) reiniciarContenido();
iniciarMovimientoInterfaz();
let moduloCiencia = null;
async function cargarCiencia() {
  if (!moduloCiencia && !document.getElementById('laboratorio-ciencia')) return;
  try {
    moduloCiencia ||= await import('./ciencia-lab.js');
    moduloCiencia.iniciarCiencia();
  } catch (error) { console.warn('Laboratorio no disponible:', error.message); }
}
cargarCiencia();
addEventListener("sitio:navegacion", cargarCiencia);
avance();
navegacion();
addEventListener("sitio:entrada-finalizada", () => reiniciarContenido({ entrada: true }));
