/* Movimiento de superficie: inclinación <= 1,6 grados, luz bajo el puntero
   y profundidad sólo en fotografías. El scroll, el foco y los enlaces son
   nativos. O(D) al navegar, D nodos del documento; O(A + V) por cuadro, A
   tarjetas pendientes y V imágenes visibles. Un rAF termina al converger. */

let reiniciarInstancia = null;

const PROPIEDADES_TARJETA = ["--tarjeta-rx", "--tarjeta-ry", "--luz-x", "--luz-y", "--tarjeta-luz"];
const UNIDADES = ["deg", "deg", "%", "%", ""];
const NEUTRO = [0, 0, 50, 50, 0];
const UMBRALES = [.004, .004, .06, .06, .002];
const acotar = (valor, minimo, maximo) => Math.min(maximo, Math.max(minimo, valor));

export function iniciarMovimientoInterfaz() {
  if (reiniciarInstancia) { reiniciarInstancia(); return; }
  if (document.body.classList.contains("pagina-admin")) return;

  const cuerpo = document.body;
  const reduccion = matchMedia("(prefers-reduced-motion: reduce)");
  const fino = matchMedia("(hover: hover) and (pointer: fine)");
  const tarjetas = new Map();
  const imagenes = new Map();
  const observados = new Map();
  const seccionesVisibles = new Set();
  const imagenesVisibles = new Set();
  const tarjetasPendientes = new Set();
  const imagenesPendientes = new Set();
  let observador = null;
  let cuadro = 0;
  let ultimoCuadro = 0;
  let medirImagenes = true;
  let puntero = null;
  let foco = null;
  let teclado = true;
  let paginaActiva = true;
  let habilitado = false;
  let coordenadas = { x: 0, y: 0 };

  function permitido() {
    return paginaActiva && !document.hidden && !reduccion.matches
      && !cuerpo.classList.contains("escena-pausada")
      && !cuerpo.classList.contains("escena-oculta")
      && !cuerpo.classList.contains("pagina-admin");
  }

  function programar() {
    if (cuadro || !habilitado) return;
    if (!tarjetasPendientes.size && !imagenesPendientes.size
      && !(medirImagenes && imagenesVisibles.size)) return;
    cuadro = requestAnimationFrame(actualizar);
  }

  function buscarTarjeta(nodo) {
    if (!(nodo instanceof Element)) return null;
    return tarjetas.get(nodo.closest(".tarjeta-interactiva")) || null;
  }

  function ensuciar(registro) {
    if (!registro) return;
    tarjetasPendientes.add(registro);
    programar();
  }

  function soltarPuntero() {
    const anterior = puntero;
    puntero = null;
    ensuciar(anterior);
  }

  function objetivoTarjeta(registro) {
    const apuntada = puntero === registro && fino.matches;
    const enfocada = foco === registro;
    registro.destino = [...NEUTRO];
    if (apuntada && !enfocada) {
      registro.caja ||= registro.nodo.getBoundingClientRect();
      const caja = registro.caja;
      const x = acotar((coordenadas.x - caja.left) / Math.max(1, caja.width), 0, 1);
      const y = acotar((coordenadas.y - caja.top) / Math.max(1, caja.height), 0, 1);
      registro.destino = [(y - .5) * -3.2, (x - .5) * 3.2, x * 100, y * 100, 1];
    } else if (enfocada) {
      registro.destino[4] = .7;
    }
    registro.activa = apuntada || enfocada;
  }

  function pintarTarjeta(registro) {
    registro.nodo.classList.toggle("tarjeta-activa", Boolean(registro.activa));
    PROPIEDADES_TARJETA.forEach((propiedad, indice) => {
      registro.nodo.style.setProperty(propiedad, `${Number(registro.actual[indice].toFixed(4))}${UNIDADES[indice]}`);
    });
  }

  function actualizar(ahora) {
    cuadro = 0;
    if (!permitido()) { estado(); return; }
    const delta = ultimoCuadro ? acotar(ahora - ultimoCuadro, 1, 64) : 16;
    ultimoCuadro = ahora;
    const avance = 1 - Math.exp(-delta / 65);

    // Todas las lecturas geométricas preceden a las escrituras. La caja de
    // una tarjeta se conserva durante el gesto para evitar realimentación
    // entre su inclinación visual y la posición calculada del puntero.
    for (const registro of tarjetasPendientes) objetivoTarjeta(registro);
    if (medirImagenes) {
      for (const registro of imagenesVisibles) {
        const caja = registro.marco.getBoundingClientRect();
        const progreso = acotar((innerHeight / 2 - caja.top - caja.height / 2)
          / Math.max(1, (innerHeight + caja.height) / 2), -1, 1);
        // La ampliación de 4,5 % cubre el desplazamiento: nunca se descubre
        // el borde de una foto baja ni se necesita mover su pie de imagen.
        const amplitud = Math.min(innerWidth < 768 ? 8 : 16, caja.height * .02);
        registro.destino = progreso * amplitud;
        imagenesPendientes.add(registro);
      }
      medirImagenes = false;
    }

    for (const registro of tarjetasPendientes) {
      if (!registro.nodo.isConnected) { tarjetasPendientes.delete(registro); continue; }
      let pendiente = false;
      registro.actual = registro.actual.map((valor, indice) => {
        const diferencia = registro.destino[indice] - valor;
        if (Math.abs(diferencia) <= UMBRALES[indice]) return registro.destino[indice];
        pendiente = true;
        return valor + diferencia * avance;
      });
      pintarTarjeta(registro);
      if (!pendiente) tarjetasPendientes.delete(registro);
    }

    for (const registro of imagenesPendientes) {
      if (!registro.nodo.isConnected || !imagenesVisibles.has(registro)) {
        imagenesPendientes.delete(registro);
        continue;
      }
      const diferencia = registro.destino - registro.actual;
      const pendiente = Math.abs(diferencia) > .025;
      registro.actual = pendiente ? registro.actual + diferencia * avance : registro.destino;
      registro.nodo.style.setProperty("--imagen-y", `${registro.actual.toFixed(3)}px`);
      registro.nodo.style.setProperty("--imagen-escala", "1.045");
      if (!pendiente) imagenesPendientes.delete(registro);
    }

    if (tarjetasPendientes.size || imagenesPendientes.size) programar();
    else ultimoCuadro = 0;
  }

  function neutralizar() {
    cancelAnimationFrame(cuadro);
    cuadro = 0;
    ultimoCuadro = 0;
    puntero = null;
    foco = null;
    tarjetasPendientes.clear();
    imagenesPendientes.clear();
    for (const registro of tarjetas.values()) {
      registro.actual = [...NEUTRO];
      registro.destino = [...NEUTRO];
      registro.caja = null;
      registro.activa = false;
      pintarTarjeta(registro);
    }
    for (const registro of imagenes.values()) {
      registro.actual = 0;
      registro.destino = 0;
      registro.nodo.style.setProperty("--imagen-y", "0px");
      registro.nodo.style.setProperty("--imagen-escala", "1");
    }
    seccionesVisibles.forEach((nodo) => nodo.classList.remove("movimiento-en-vista"));
  }

  function estado() {
    const siguiente = permitido();
    if (habilitado === siguiente) return;
    habilitado = siguiente;
    dispatchEvent(new CustomEvent("sitio:movimiento", { detail: { pausado: !habilitado } }));
    if (!habilitado) { neutralizar(); return; }
    seccionesVisibles.forEach((nodo) => nodo.classList.add("movimiento-en-vista"));
    medirImagenes = true;
    programar();
  }

  function observar(nodo, imagen = null, seccion = false) {
    if (!nodo) return;
    if (!observados.has(nodo)) observados.set(nodo, { imagenes: [], seccion: false });
    const registro = observados.get(nodo);
    if (imagen) registro.imagenes.push(imagen);
    if (seccion) registro.seccion = true;
  }

  function reiniciar() {
    neutralizar();
    observador?.disconnect();
    for (const registro of tarjetas.values()) {
      registro.nodo.classList.remove("tarjeta-interactiva");
      PROPIEDADES_TARJETA.forEach((propiedad) => registro.nodo.style.removeProperty(propiedad));
    }
    for (const registro of imagenes.values()) {
      registro.nodo.classList.remove("imagen-profundidad");
      registro.nodo.style.removeProperty("--imagen-y");
      registro.nodo.style.removeProperty("--imagen-escala");
    }
    tarjetas.clear(); imagenes.clear(); observados.clear();
    seccionesVisibles.clear(); imagenesVisibles.clear();
    habilitado = permitido();
    if (cuerpo.classList.contains("pagina-admin")) return;

    for (const nodo of document.querySelectorAll("main .ficha, main .escrito-card, main .metrica")) {
      if (nodo.closest(".prosa, [data-mapa-oro]")) continue;
      nodo.classList.add("tarjeta-interactiva");
      tarjetas.set(nodo, { nodo, actual: [...NEUTRO], destino: [...NEUTRO], caja: null });
    }
    for (const nodo of document.querySelectorAll("main .fotograma-imagen img, main .sala-imaginaria img, main .cv-retrato img")) {
      if (nodo.closest(".prosa, [data-mapa-oro]")) continue;
      const marco = nodo.closest(".fotograma-imagen, .sala-imaginaria, .cv-retrato-imagen");
      if (!marco) continue;
      const registro = { nodo, marco, actual: 0, destino: 0 };
      nodo.classList.add("imagen-profundidad");
      imagenes.set(nodo, registro);
      observar(marco, registro);
    }
    document.querySelectorAll("main .franja, footer.pie").forEach((nodo) => observar(nodo, null, true));

    if ("IntersectionObserver" in window) {
      observador = new IntersectionObserver((entradas) => {
        for (const entrada of entradas) {
          const registro = observados.get(entrada.target);
          if (!registro) continue;
          if (registro.seccion) {
            if (entrada.isIntersecting) seccionesVisibles.add(entrada.target);
            else seccionesVisibles.delete(entrada.target);
            entrada.target.classList.toggle("movimiento-en-vista", entrada.isIntersecting && habilitado);
          }
          for (const imagen of registro.imagenes) {
            if (entrada.isIntersecting) imagenesVisibles.add(imagen);
            else { imagenesVisibles.delete(imagen); imagenesPendientes.delete(imagen); }
          }
        }
        medirImagenes = true;
        programar();
      }, { threshold: 0 });
      observados.forEach((_, nodo) => observador.observe(nodo));
    }
    // Sin observador las fotografías y los adornos conservan su estado
    // estático. Los enlaces y su respuesta al puntero siguen disponibles.
    if (!habilitado) neutralizar();
  }

  function moverPuntero(evento) {
    if (!habilitado || !fino.matches || evento.pointerType !== "mouse" || evento.buttons) {
      if (puntero) soltarPuntero();
      return;
    }
    const siguiente = buscarTarjeta(evento.target);
    if (siguiente !== puntero) {
      const anterior = puntero;
      puntero = siguiente;
      if (siguiente) siguiente.caja = null;
      ensuciar(anterior);
    }
    coordenadas = { x: evento.clientX, y: evento.clientY };
    ensuciar(puntero);
  }

  function cambiarFoco(nodo) {
    const anterior = foco;
    foco = habilitado && teclado ? buscarTarjeta(nodo) : null;
    ensuciar(anterior); ensuciar(foco);
  }

  document.addEventListener("pointermove", moverPuntero, { passive: true });
  document.addEventListener("pointerout", (evento) => {
    if (puntero && (!(evento.relatedTarget instanceof Node) || !puntero.nodo.contains(evento.relatedTarget))) soltarPuntero();
  }, { passive: true });
  document.addEventListener("pointerdown", (evento) => {
    teclado = false;
    cambiarFoco(null);
    if (evento.pointerType !== "mouse") soltarPuntero();
  }, { passive: true });
  document.addEventListener("keydown", (evento) => {
    if (evento.metaKey || evento.ctrlKey || evento.altKey) return;
    teclado = true;
    cambiarFoco(document.activeElement);
  });
  document.addEventListener("focusin", (evento) => cambiarFoco(evento.target));
  document.addEventListener("focusout", (evento) => cambiarFoco(evento.relatedTarget));
  document.addEventListener("load", (evento) => {
    if (!imagenes.has(evento.target)) return;
    medirImagenes = true; programar();
  }, true);
  addEventListener("scroll", () => {
    soltarPuntero();
    medirImagenes = true;
    programar();
  }, { passive: true });
  addEventListener("resize", () => {
    soltarPuntero();
    medirImagenes = true;
    programar();
  }, { passive: true });
  addEventListener("blur", soltarPuntero);
  addEventListener("pagehide", () => { paginaActiva = false; estado(); });
  addEventListener("pageshow", () => { paginaActiva = true; estado(); });
  document.addEventListener("visibilitychange", estado);
  reduccion.addEventListener("change", estado);
  fino.addEventListener("change", () => { soltarPuntero(); });
  new MutationObserver(estado).observe(cuerpo, { attributes: true, attributeFilter: ["class"] });
  addEventListener("sitio:navegacion", reiniciar);
  reiniciarInstancia = reiniciar;
  reiniciar();
}
