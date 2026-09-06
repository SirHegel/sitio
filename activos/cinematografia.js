/* Escenas originales: luz volumétrica y polvo de proyección.
   O(P) por cuadro, O(P) memoria, P <= 45. Un solo rAF, máximo 30 fps;
   se detiene al ocultar la pestaña, pausar o pedir movimiento reducido. */
export function iniciarCinematografia() {
  const documento = document.documentElement;
  const cuerpo = document.body;
  const reduccion = matchMedia("(prefers-reduced-motion: reduce)");
  const fino = matchMedia("(pointer: fine)");
  const escenas = ["terciopelo", "nocturno", "celuloide"];
  const nombres = ["Terciopelo", "Nocturno", "Celuloide"];
  const cambiar = document.getElementById("cambiar-escena");
  const pausar = document.getElementById("pausar-escena");
  const lienzo = document.getElementById("lienzo");
  let contexto = null;
  try { contexto = lienzo?.getContext("2d", { alpha: true }); } catch { /* CSS conserva la escena. */ }
  let pausaManual = false;
  const administrativa = cuerpo.classList.contains("pagina-admin");
  let eleccionManual = false;
  let indice = 0;
  let cuadro = 0;
  let ultimo = 0;
  let tiempo = 0;
  let ancho = 0;
  let alto = 0;
  let particulas = [];
  const puntero = { x: .65, y: .35, destinoX: .65, destinoY: .35 };
  try { pausaManual = localStorage.getItem("jsar:escena-pausa") === "1"; } catch {}

  function escena(nombre) {
    const siguiente = escenas.indexOf(nombre);
    if (siguiente < 0) return;
    indice = siguiente;
    cuerpo.dataset.escena = nombre;
    if (cambiar) {
      cambiar.replaceChildren(document.createTextNode(nombres[indice] + " "));
      const flecha = document.createElement("span");
      flecha.setAttribute("aria-hidden", "true");
      flecha.textContent = "↗";
      cambiar.append(flecha);
      cambiar.setAttribute("aria-label", `Cambiar ambiente visual: ${nombres[indice]}`);
    }
    const contador = document.querySelector(".escena-indice");
    if (contador) contador.textContent = String(indice + 1).padStart(2, "0");
    if (!corriendo()) dibujar(0);
  }

  function escenaDeRuta() {
    if (eleccionManual) return;
    const ruta = cuerpo.dataset.ruta || location.pathname;
    escena(ruta.startsWith("/blog/") ? "celuloide" : /^\/(proyectos|contribuciones|academico)\//.test(ruta) ? "nocturno" : "terciopelo");
  }

  function medir() {
    if (!contexto) return;
    ancho = innerWidth;
    alto = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, ancho < 768 ? 1.25 : 1.5);
    lienzo.width = Math.round(ancho * dpr);
    lienzo.height = Math.round(alto * dpr);
    contexto.setTransform(dpr, 0, 0, dpr, 0, 0);
    particulas = Array.from({ length: Math.min(45, Math.ceil(ancho * alto / 35000)) }, (_, i) => ({
      x: ((i * .61803398875) % 1) * ancho,
      y: ((i * .38196601125) % 1) * alto,
      radio: .4 + (i % 4) * .24,
      velocidad: 2 + (i % 7) * .55,
      fase: i * 2.39,
    }));
    dibujar(0);
  }

  function dibujar(delta) {
    if (!contexto) return;
    const g = contexto;
    tiempo += delta;
    puntero.x += (puntero.destinoX - puntero.x) * .035;
    puntero.y += (puntero.destinoY - puntero.y) * .035;
    g.clearRect(0, 0, ancho, alto);
    const luzX = ancho * (.66 + (puntero.x - .5) * .12);
    const luzY = alto * (.18 + (puntero.y - .5) * .08);
    const luz = g.createRadialGradient(luzX, luzY, 0, luzX, luzY, ancho * .7);
    const rgb = indice === 1 ? "149,184,187" : "227,194,138";
    luz.addColorStop(0, `rgba(${rgb},.065)`);
    luz.addColorStop(.55, `rgba(${rgb},.018)`);
    luz.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = luz;
    g.fillRect(0, 0, ancho, alto);
    for (const p of particulas) {
      p.y -= p.velocidad * delta;
      if (p.y < -4) p.y = alto + 4;
      const x = p.x + Math.sin(tiempo * .16 + p.fase) * 18;
      const intensidad = .12 + .13 * (.5 + Math.sin(tiempo * .3 + p.fase) * .5);
      g.beginPath();
      g.arc(x, p.y, p.radio, 0, Math.PI * 2);
      g.fillStyle = `rgba(${rgb},${intensidad})`;
      g.fill();
    }
  }

  function corriendo() { return !administrativa && !pausaManual && !reduccion.matches && !document.hidden; }
  function animar(ahora) {
    cuadro = 0;
    if (!corriendo() || !contexto) return;
    const transcurrido = ahora - ultimo;
    if (transcurrido >= 1000 / 30) {
      dibujar(Math.min(transcurrido / 1000, .08));
      ultimo = ahora;
    }
    cuadro = requestAnimationFrame(animar);
  }

  function estado() {
    cancelAnimationFrame(cuadro);
    cuadro = 0;
    const pausado = administrativa || pausaManual || reduccion.matches;
    cuerpo.classList.toggle("escena-pausada", pausado);
    cuerpo.classList.toggle("escena-oculta", document.hidden);
    if (pausar) {
      pausar.setAttribute("aria-pressed", String(pausado));
      pausar.setAttribute("aria-label", reduccion.matches ? "Movimiento reducido activado en tu dispositivo" : pausado ? "Reanudar animación de fondo" : "Pausar animación de fondo");
      pausar.disabled = reduccion.matches;
      pausar.firstElementChild.textContent = pausado ? "▷" : "Ⅱ";
    }
    if (corriendo() && contexto) {
      ultimo = performance.now();
      cuadro = requestAnimationFrame(animar);
    }
  }

  cambiar?.addEventListener("click", () => {
    eleccionManual = true;
    escena(escenas[(indice + 1) % escenas.length]);
  });
  pausar?.addEventListener("click", () => {
    pausaManual = !pausaManual;
    try { localStorage.setItem("jsar:escena-pausa", pausaManual ? "1" : "0"); } catch {}
    estado();
  });
  addEventListener("pointermove", (evento) => {
    if (!fino.matches || !corriendo()) return;
    puntero.destinoX = evento.clientX / innerWidth;
    puntero.destinoY = evento.clientY / innerHeight;
  }, { passive: true });
  addEventListener("resize", medir, { passive: true });
  document.addEventListener("visibilitychange", estado);
  reduccion.addEventListener("change", estado);
  addEventListener("pagehide", () => { cancelAnimationFrame(cuadro); cuadro = 0; });
  addEventListener("pageshow", estado);

  let observador = null;
  function observarEscenas() {
    observador?.disconnect();
    escenaDeRuta();
    if (!("IntersectionObserver" in window)) return;
    observador = new IntersectionObserver((entradas) => {
      if (eleccionManual || reduccion.matches || pausaManual) return;
      for (const entrada of entradas) {
        if (entrada.isIntersecting) escena(entrada.target.dataset.ambiente);
      }
    }, { rootMargin: "-15% 0px -35% 0px", threshold: 0 });
    document.querySelectorAll("[data-ambiente]").forEach((nodo) => observador.observe(nodo));
  }

  function menu(abierto, enfocar = false) {
    document.querySelector(".barra")?.classList.toggle("menu-abierto", abierto);
    const boton = document.querySelector(".menu-mando");
    boton?.setAttribute("aria-expanded", String(abierto));
    if (boton?.lastElementChild) boton.lastElementChild.textContent = abierto ? "−" : "＋";
    if (enfocar) boton?.focus();
  }
  document.querySelector(".menu-mando")?.addEventListener("click", (evento) => {
    menu(evento.currentTarget.getAttribute("aria-expanded") !== "true");
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && document.querySelector(".menu-abierto")) menu(false, true);
  });
  document.addEventListener("click", (evento) => {
    if (!(evento.target instanceof Element)) return;
    if (evento.target.closest("nav.menu a") || !evento.target.closest(".barra")) menu(false);
  });
  addEventListener("sitio:navegacion", () => { menu(false); observarEscenas(); });
  documento.classList.add("js-cine");
  const puerta = document.getElementById("puerta");
  let visto = false;
  try { visto = sessionStorage.getItem("jsar:entrado") === "1"; sessionStorage.setItem("jsar:entrado", "1"); } catch {}
  if (visto || reduccion.matches) puerta?.remove();
  else setTimeout(() => puerta?.remove(), 1200);
  medir();
  observarEscenas();
  estado();
}
