/* ============================================================================
   Reproductor persistente.

   La música es un archivo local servido por el propio sitio. El elemento
   <audio> se crea una sola vez, fuera de las regiones que cambia la navegación
   progresiva, de modo que pasar de una ruta a otra no corta ni reinicia la
   reproducción. No se usa Web Audio ni se sintetiza sonido en el navegador.
   ========================================================================= */

const FUENTES = [
  { src: "/activos/beethoven-quinta-sinfonia.mp3", type: "audio/mpeg" },
];

const LLAVE_POSICION = "jsar:musica:segundo";

function leerPosicion(llave) {
  try {
    const posicion = Number(sessionStorage.getItem(llave));
    return Number.isFinite(posicion) && posicion >= 0 ? posicion : 0;
  } catch {
    return 0;
  }
}

function guardarPosicion(llave, audio) {
  if (!Number.isFinite(audio.currentTime)) return;
  try { sessionStorage.setItem(llave, String(audio.currentTime)); } catch {}
}

export class MusicaPersistente {
  constructor({ fuentes = FUENTES, llavePosicion = LLAVE_POSICION } = {}) {
    this.fuentes = fuentes;
    this.llavePosicion = llavePosicion;
    this.audio = null;
    this.solicitada = false;
    this.error = null;
    this.bloqueada = false;
    this.suscriptores = new Set();
    this.ultimoGuardado = 0;
  }

  get sonando() {
    return Boolean(this.audio && !this.audio.paused && !this.audio.ended);
  }

  suscribir(funcion) {
    this.suscriptores.add(funcion);
    return () => this.suscriptores.delete(funcion);
  }

  emitir() {
    for (const funcion of this.suscriptores) funcion(this);
  }

  preparar() {
    if (this.audio) return this.audio;

    const audio = document.createElement("audio");
    audio.id = "musica-persistente";
    audio.hidden = true;
    audio.preload = "metadata";
    audio.loop = true;
    audio.playsInline = true;
    audio.setAttribute("playsinline", "");
    audio.setAttribute("aria-hidden", "true");

    for (const fuente of this.fuentes) {
      const source = document.createElement("source");
      source.src = fuente.src;
      source.type = fuente.type;
      audio.append(source);
    }

    const restaurar = () => {
      const guardada = leerPosicion(this.llavePosicion);
      if (!guardada || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
      // El módulo conserva la fase del tema entre recargas, pero nunca deja el
      // cursor exactamente en el final: algunos motores lo interpretarían como
      // una reproducción ya terminada.
      audio.currentTime = Math.min(guardada % audio.duration, Math.max(0, audio.duration - 0.05));
    };

    audio.addEventListener("loadedmetadata", restaurar);
    audio.addEventListener("durationchange", restaurar, { once: true });
    audio.addEventListener("timeupdate", () => {
      const ahora = performance.now();
      if (ahora - this.ultimoGuardado < 1000) return;
      this.ultimoGuardado = ahora;
      guardarPosicion(this.llavePosicion, audio);
    });

    audio.addEventListener("play", () => {
      this.error = null;
      this.bloqueada = false;
      this.emitir();
    });
    audio.addEventListener("pause", () => this.emitir());
    audio.addEventListener("waiting", () => this.emitir());
    audio.addEventListener("playing", () => this.emitir());
    audio.addEventListener("error", () => {
      this.bloqueada = false;
      this.error = audio.error || new Error("No se pudo cargar la música local");
      this.emitir();
    });

    // `loop` evita el estado ended en los navegadores modernos. Este manejador
    // cubre motores antiguos o una pérdida puntual del atributo y reinicia sin
    // reconstruir el elemento.
    audio.addEventListener("ended", () => {
      if (!this.solicitada) return;
      audio.currentTime = 0;
      audio.play().catch((error) => {
        this.error = error;
        this.emitir();
      });
    });

    addEventListener("pagehide", () => guardarPosicion(this.llavePosicion, audio));
    document.body.append(audio);
    audio.load();
    this.audio = audio;
    return audio;
  }

  async tocar() {
    const audio = this.preparar();
    this.solicitada = true;
    if (audio.ended) audio.currentTime = 0;

    try {
      await audio.play();
      this.error = null;
      this.bloqueada = false;
      this.emitir();
      return true;
    } catch (error) {
      // La preferencia permanece encendida. Así, si el sistema operativo o la
      // política de autoplay bloqueó este intento, un gesto posterior puede
      // reanudar el mismo elemento y el mismo segundo.
      this.bloqueada = error?.name === "NotAllowedError";
      this.error = this.bloqueada || error?.name === "AbortError" ? null : error;
      this.emitir();
      throw error;
    }
  }

  callar() {
    this.solicitada = false;
    if (!this.audio) return;
    this.audio.pause();
    guardarPosicion(this.llavePosicion, this.audio);
    this.emitir();
  }

  async reanudar() {
    if (!this.solicitada) return false;
    return this.tocar();
  }

  async alternar() {
    if (this.sonando) {
      this.callar();
      return false;
    }
    return this.tocar();
  }
}
