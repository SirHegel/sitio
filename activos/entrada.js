import { crearUmbralWebGL } from "./umbral-webgl.js";

/* Elección → viaje de 1,8 s → documento. Control O(1), una animación a 30 fps.
   El portal se destruye antes de arrancar la sala; nunca hay dos bucles GPU.
   Música ligada al gesto, nunca a un reloj. Fallar audio/GPU no impide entrar. */
const LLAVE = "jsar:entrada-v2";
export function entradaPendiente() {
  if (!document.getElementById("puerta") || location.hash) return false;
  if (new URLSearchParams(location.search).get("entrada") === "1") return true;
  try { return sessionStorage.getItem(LLAVE) !== "1"; } catch { return true; }
}

export function iniciarEntrada(sonido) {
  const puerta = document.getElementById("puerta");
  if (!puerta) return;
  if (!entradaPendiente() || typeof puerta.showModal !== "function") { puerta.remove(); return; }
  const reduccion = matchMedia("(prefers-reduced-motion: reduce)");
  const fino = matchMedia("(hover: hover) and (pointer: fine)");
  const pausar = document.getElementById("pausar-umbral");
  const lienzo = document.getElementById("umbral-lienzo");
  let motor = null;
  let intentado = false;
  let cuadro = 0;
  let ultimo = 0;
  let tiempo = 0;
  let inicioSalida = null;
  let respaldo = 0;
  let cerrada = false;
  let pausada = false;
  let x = 0, y = 0, destinoX = 0, destinoY = 0;
  try { pausada = localStorage.getItem("jsar:escena-pausa") === "1"; } catch {}
  const quieta = () => pausada || reduccion.matches;

  function pintar(progreso = 0) {
    puerta.classList.toggle("umbral-gpu", Boolean(motor?.dibujar({ tiempo, progreso, x, y })));
  }

  function finalizar() {
    if (cerrada) return;
    cerrada = true;
    cancelAnimationFrame(cuadro);
    clearTimeout(respaldo);
    motor?.destruir();
    removeEventListener("resize", medir);
    removeEventListener("pagehide", abandonar);
    removeEventListener("pageshow", estado);
    document.removeEventListener("visibilitychange", visibilidad);
    reduccion.removeEventListener("change", estado);
    puerta.close();
    puerta.remove();
    document.body.classList.remove("entrada-activa");
    document.getElementById("principal")?.focus({ preventScroll: true });
    dispatchEvent(new CustomEvent("sitio:entrada-finalizada"));
  }

  function animar(ahora) {
    cuadro = 0;
    if (cerrada || document.hidden) return;
    if (quieta()) { estado(); return; }
    const progreso = inicioSalida === null ? 0 : Math.min(1, (ahora - inicioSalida) / 1800);
    if (progreso >= 1) { finalizar(); return; }
    if (ahora - ultimo >= 1000 / 30) {
      const delta = Math.min((ahora - ultimo) / 1000, .08);
      ultimo = ahora;
      tiempo += delta;
      x += (destinoX - x) * (1 - Math.exp(-delta * 4));
      y += (destinoY - y) * (1 - Math.exp(-delta * 4));
      pintar(progreso);
    }
    cuadro = requestAnimationFrame(animar);
  }

  function estado() {
    if (cerrada) return;
    cancelAnimationFrame(cuadro);
    cuadro = 0;
    puerta.classList.toggle("umbral-quieto", quieta() || document.hidden);
    pausar.disabled = reduccion.matches;
    pausar.setAttribute("aria-pressed", String(quieta()));
    pausar.setAttribute("aria-label", reduccion.matches ? "Movimiento reducido activado en tu dispositivo" : pausada ? "Reanudar animación de entrada" : "Pausar animación de entrada");
    pausar.textContent = quieta() ? "▷" : "Ⅱ";
    if (inicioSalida !== null && (quieta() || document.hidden)) { finalizar(); return; }
    if (!quieta() && !document.hidden) {
      if (!intentado) {
        intentado = true;
        motor = crearUmbralWebGL(lienzo, () => {
          if (!cerrada) pintar(inicioSalida === null ? 0 : Math.min(1, (performance.now() - inicioSalida) / 1800));
        });
      }
      ultimo = performance.now();
      if (motor || inicioSalida !== null) cuadro = requestAnimationFrame(animar);
    }
  }

  function elegir(conMusica) {
    if (cerrada || inicioSalida !== null) return;
    // No await antes de play(): el permiso de reproducción pertenece al clic.
    if (conMusica) void sonido.tocar().catch(() => {});
    else sonido.silenciar();
    try { sessionStorage.setItem(LLAVE, "1"); sessionStorage.setItem("jsar:entrado", "1"); } catch {}
    const url = new URL(location.href);
    if (url.searchParams.get("entrada") === "1") {
      url.searchParams.delete("entrada");
      history.replaceState(history.state, "", url);
    }
    if (quieta() || document.hidden) { finalizar(); return; }
    inicioSalida = performance.now();
    puerta.dataset.eleccion = conMusica ? "musica" : "silencio";
    puerta.classList.add("umbral-saliendo");
    for (const boton of puerta.querySelectorAll("button")) boton.disabled = true;
    // Respaldo acotado ante suspensión del compositor; nunca espera al MP3.
    respaldo = setTimeout(finalizar, 2200);
    if (!cuadro) cuadro = requestAnimationFrame(animar);
  }

  function medir() {
    if (!cerrada) {
      motor?.medir();
      pintar(inicioSalida === null ? 0 : Math.min(1, (performance.now() - inicioSalida) / 1800));
    }
  }
  function visibilidad() { estado(); }
  function abandonar() { if (inicioSalida !== null) finalizar(); else { cancelAnimationFrame(cuadro); cuadro = 0; } }
  puerta.querySelector("#entrar-con-musica").addEventListener("click", () => elegir(true));
  puerta.querySelector("#entrar-en-silencio").addEventListener("click", () => elegir(false));
  puerta.addEventListener("cancel", (evento) => { evento.preventDefault(); elegir(false); });
  puerta.addEventListener("keydown", (evento) => {
    if (evento.key !== "Tab") return;
    const controles = [...puerta.querySelectorAll("button:not(:disabled)")];
    if (!controles.length) { evento.preventDefault(); return; }
    const primero = controles[0];
    const ultimo = controles[controles.length - 1];
    if (evento.shiftKey && document.activeElement === primero) { evento.preventDefault(); ultimo.focus(); }
    else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primero.focus(); }
  });
  pausar.addEventListener("click", () => { pausada = !pausada; estado(); });
  puerta.addEventListener("pointermove", (evento) => {
    if (!fino.matches || evento.pointerType !== "mouse" || quieta() || inicioSalida !== null) return;
    destinoX = Math.max(-1, Math.min(1, evento.clientX / innerWidth * 2 - 1));
    destinoY = Math.max(-1, Math.min(1, evento.clientY / innerHeight * 2 - 1));
  }, { passive: true });
  puerta.addEventListener("pointerleave", () => { destinoX = 0; destinoY = 0; }, { passive: true });
  addEventListener("resize", medir, { passive: true });
  addEventListener("pagehide", abandonar);
  addEventListener("pageshow", estado);
  document.addEventListener("visibilitychange", visibilidad);
  reduccion.addEventListener("change", estado);
  document.body.classList.add("entrada-activa");
  puerta.showModal();
  estado();
}
