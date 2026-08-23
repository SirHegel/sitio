/* ============================================================================
   Movimiento. Tres lugares y ni uno más: detrás del scrim, fuera de la
   columna de texto, y en el ornamento. Quien pide movimiento reducido recibe
   la página completa, quieta.
   ========================================================================= */

import { MusicaPersistente } from "./musica.js";

const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let vigiaRevelado = null;
let vigiaContadores = null;
let versionContenido = 0;
let actualizarAvance = () => {};

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

/* ------------------------------------------------------- fondo: el horizonte */
/* Una retícula en fuga hacia el punto de horizonte y brasas que suben. Vive en
   el lienzo fijo, siempre por debajo del scrim. */

function horizonte() {
  const lienzo = document.getElementById("lienzo");
  if (!lienzo || quieto) return;
  const g = lienzo.getContext("2d", { alpha: true });

  let an = 0, al = 0, dpr = 1;
  const brasas = [];

  function medir() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    an = lienzo.clientWidth;
    al = lienzo.clientHeight;
    lienzo.width = Math.floor(an * dpr);
    lienzo.height = Math.floor(al * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    brasas.length = 0;
    const cuantas = Math.round(Math.min(70, (an * al) / 26000));
    for (let i = 0; i < cuantas; i++) {
      brasas.push({
        x: Math.random() * an,
        y: Math.random() * al,
        r: 0.5 + Math.random() * 1.5,
        v: 0.09 + Math.random() * 0.28,
        fase: Math.random() * Math.PI * 2,
        vaiven: 0.25 + Math.random() * 0.7,
        alfa: 0.14 + Math.random() * 0.4,
      });
    }
  }

  let t = 0;
  let corriendo = true;

  function cuadro() {
    if (!corriendo) return;
    t += 0.0042;
    g.clearRect(0, 0, an, al);

    const hy = al * 0.66;              // línea de horizonte
    const fx = an * 0.5;               // punto de fuga

    // Retícula en fuga. Opacidad baja: es atmósfera, no información.
    g.lineWidth = 1;

    for (let i = -16; i <= 16; i++) {
      const x = fx + i * (an * 0.15);
      g.beginPath();
      g.moveTo(fx, hy);
      g.lineTo(x, al + 40);
      g.strokeStyle = `rgba(232,164,76,${0.05 + 0.02 * Math.cos(i * 0.5 + t * 6)})`;
      g.stroke();
    }

    // Las horizontales se acercan: el desplazamiento es la profundidad.
    for (let i = 0; i < 18; i++) {
      const p = ((i / 18) + (t % (1 / 18)) * 18 / 18) % 1;
      const y = hy + Math.pow(p, 2.6) * (al - hy + 60);
      if (y > al + 10) continue;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(an, y);
      g.strokeStyle = `rgba(232,164,76,${0.055 * (1 - p * 0.85)})`;
      g.stroke();
    }

    // Franja de brasa sobre el horizonte. Se desvanece por arriba y por abajo:
    // un degradado que termina en opaco deja el borde del rectángulo a la vista.
    const intensidad = 0.095 + 0.028 * Math.sin(t * 3);
    const franja = g.createLinearGradient(0, hy - 150, 0, hy + 170);
    franja.addColorStop(0, "rgba(232,164,76,0)");
    franja.addColorStop(0.47, `rgba(232,164,76,${intensidad})`);
    franja.addColorStop(0.55, `rgba(212,64,44,${intensidad * 0.6})`);
    franja.addColorStop(1, "rgba(232,164,76,0)");
    g.fillStyle = franja;
    g.fillRect(0, hy - 150, an, 320);

    // Brasas.
    for (const b of brasas) {
      b.y -= b.v;
      b.fase += 0.011;
      if (b.y < -12) { b.y = al + 12; b.x = Math.random() * an; }
      const x = b.x + Math.sin(b.fase) * b.vaiven * 16;
      const parpadeo = 0.65 + 0.35 * Math.sin(b.fase * 2.1);
      g.beginPath();
      g.arc(x, b.y, b.r, 0, Math.PI * 2);
      g.fillStyle = `rgba(255,206,138,${b.alfa * parpadeo})`;
      g.fill();
    }

    requestAnimationFrame(cuadro);
  }

  medir();
  addEventListener("resize", medir, { passive: true });
  document.addEventListener("visibilitychange", () => {
    corriendo = !document.hidden;
    if (corriendo) requestAnimationFrame(cuadro);
  });
  requestAnimationFrame(cuadro);
}

/* --------------------------------------------------- revelado al desplazar */

function revelado() {
  vigiaRevelado?.disconnect();
  vigiaRevelado = null;
  const piezas = document.querySelectorAll(".revelar, .regla");
  if (!piezas.length) return;

  if (quieto || !("IntersectionObserver" in window)) {
    piezas.forEach((p) => p.classList.add("visible"));
    return;
  }

  // El escalonado se calcula por grupo: los hermanos entran uno tras otro.
  document.querySelectorAll("[data-escalonar]").forEach((grupo) => {
    [...grupo.children].forEach((hijo, i) => hijo.style.setProperty("--i", i));
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
    if (caja.top < innerHeight && caja.bottom > 0) p.classList.add("visible");
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

  if (quieto || !("IntersectionObserver" in window)) {
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

/* -------------------------------------------------------------- el halo */

function halo() {
  const h = document.getElementById("halo");
  if (!h || quieto) return;
  if (!matchMedia("(pointer: fine)").matches) return;
  document.body.classList.add("puntero-fino");

  let x = innerWidth / 2, y = innerHeight / 2, hx = x, hy = y;

  addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    // Sobre un bloque de lectura el halo se atenúa: la regla del scrim vale
    // también para el ornamento que pasa por encima.
    const bajo = document.elementFromPoint(x, y);
    document.body.classList.toggle("sobre-lectura", !!bajo?.closest(".scrim, .ficha, .metrica, .barra"));
  }, { passive: true });

  (function seguir() {
    hx += (x - hx) * 0.085;
    hy += (y - hy) * 0.085;
    h.style.transform = `translate3d(${hx}px, ${hy}px, 0)`;
    requestAnimationFrame(seguir);
  })();
}

/* ------------------------------------------------- puerta de entrada y audio */

function audio() {
  const puerta = document.getElementById("puerta");
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

  function abrir(conMusica) {
    if (puerta) puerta.classList.add("abierta");
    try { sessionStorage.setItem("jsar:entrado", "1"); } catch {}
    if (conMusica) {
      guardarPreferencia(true);
      intentarTocar();
    }
    setTimeout(() => puerta?.remove(), 1300);
  }

  puerta?.querySelector("[data-entrar-con-musica]")?.addEventListener("click", () => abrir(true));
  puerta?.querySelector("[data-entrar-en-silencio]")?.addEventListener("click", () => {
    guardarPreferencia(false);
    musica.callar();
    abrir(false);
  });

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

  // Tras una recarga completa, la puerta ya no vuelve a interrumpir la sesión.
  // La navegación progresiva conserva tanto la puerta retirada como el audio.
  let yaEntro = false;
  try { yaEntro = sessionStorage.getItem("jsar:entrado") === "1"; } catch {}
  if (yaEntro && puerta) puerta.remove();

  if (preferida()) {
    musica.solicitada = true;
    const reanudarConGesto = async () => {
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
    if (!document.hidden && preferida()) intentarTocar();
  });
  addEventListener("pageshow", () => {
    if (preferida() && !musica.sonando) intentarTocar();
  });

  reflejar();
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

function reiniciarContenido() {
  versionContenido++;
  componerNombre();
  revelado();
  contadores(versionContenido);
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

  const anunciar = () => {
    anuncio.textContent = "";
    setTimeout(() => { anuncio.textContent = `Página cargada: ${document.title}`; }, 30);
  };

  const idDesdeHash = (hash) => {
    if (!hash || hash === "#") return null;
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); }
    catch { return document.getElementById(hash.slice(1)); }
  };

  const enfocar = (url, posicion = null) => {
    requestAnimationFrame(() => {
      const principal = document.getElementById("principal");
      const destino = idDesdeHash(url.hash);
      const foco = destino || principal;
      if (foco) {
        if (!foco.matches("a, button, input, select, textarea, [tabindex]")) foco.tabIndex = -1;
        foco.focus({ preventScroll: true });
      }

      if (Array.isArray(posicion) && posicion.length === 2) {
        scrollTo(Number(posicion[0]) || 0, Number(posicion[1]) || 0);
      } else if (destino) {
        destino.scrollIntoView();
      } else {
        scrollTo(0, 0);
      }
      actualizarAvance();
      anunciar();
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
    return url;
  };

  async function ir(url, { historial = "push", posicion = null } = {}) {
    const turno = ++secuencia;
    controlador?.abort();
    controlador = new AbortController();
    navegando = true;
    document.documentElement.classList.add("navegando");
    document.getElementById("principal")?.setAttribute("aria-busy", "true");

    try {
      const respuesta = await fetch(url.href, {
        signal: controlador.signal,
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
      if (!nuevoPrincipal || !nuevoMenu || !nuevoPie || !nuevoDocumento.title) {
        throw new Error("La página interna no tiene la estructura esperada");
      }

      const principal = document.importNode(nuevoPrincipal, true);
      const menu = document.importNode(nuevoMenu, true);
      const pie = document.importNode(nuevoPie, true);
      const aplicar = () => {
        sincronizarCabeza(nuevoDocumento);
        document.body.dataset.ruta = nuevoDocumento.body.dataset.ruta || final.pathname;
        document.querySelector("main#principal")?.replaceWith(principal);
        document.querySelector("nav.menu")?.replaceWith(menu);
        document.querySelector("footer.pie")?.replaceWith(pie);
        reiniciarContenido();
      };

      if (!quieto && "startViewTransition" in document) {
        await document.startViewTransition(aplicar).updateCallbackDone;
      } else {
        aplicar();
      }

      rutaMostrada = final.pathname + final.search;
      if (historial === "push") {
        history.pushState({ __jsarPjax: true, scroll: [0, 0] }, "", final.href);
      } else if (final.href !== location.href) {
        history.replaceState({ ...estadoActual(), __jsarPjax: true }, "", final.href);
      }
      window.dispatchEvent(new CustomEvent("sitio:navegacion", {
        detail: { path: final.pathname },
      }));
      enfocar(final, posicion);
    } catch (error) {
      if (error?.name === "AbortError") return;
      // La mejora es progresiva: si red, CSP, HTML o transiciones fallan, el
      // navegador hace una carga convencional y conserva una página usable.
      if (historial === "pop") location.reload();
      else location.assign(url.href);
    } finally {
      if (turno === secuencia) {
        navegando = false;
        document.documentElement.classList.remove("navegando");
        document.getElementById("principal")?.removeAttribute("aria-busy");
        controlador = null;
      }
    }
  }

  document.addEventListener("click", (evento) => {
    const url = enlaceElegible(evento);
    if (!url) return;
    if (url.pathname === location.pathname && url.search === location.search) {
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
      enfocar(url, evento.state?.scroll || null);
      return;
    }
    ir(url, { historial: "pop", posicion: evento.state?.scroll || null });
  });
}

/* ------------------------------------------------------------------ arranque */

reiniciarContenido();
horizonte();
avance();
halo();
audio();
navegacion();
