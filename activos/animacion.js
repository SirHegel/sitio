/* ============================================================================
   Movimiento. Tres lugares y ni uno más: detrás del scrim, fuera de la
   columna de texto, y en el ornamento. Quien pide movimiento reducido recibe
   la página completa, quieta.
   ========================================================================= */

import { Preludio } from "./musica.js";

const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* -------------------------------------------------- el nombre, letra a letra */

function componerNombre() {
  for (const titulo of document.querySelectorAll(".nombre[data-componer]")) {
    const texto = titulo.textContent.trim();
    titulo.setAttribute("aria-label", texto);
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

  const vigia = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("visible");
        vigia.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.06 }
  );

  piezas.forEach((p) => vigia.observe(p));
}

/* ------------------------------------------------------------- contadores */

function contadores() {
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

  const vigia = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        const el = e.target;
        vigia.unobserve(el);
        const hasta = Number(el.dataset.hasta);
        const inicio = performance.now();
        const dur = 1700;
        const paso = (ahora) => {
          const p = Math.min(1, (ahora - inicio) / dur);
          // Desaceleración: la cifra llega, no aterriza de golpe.
          pintar(el, hasta * (1 - Math.pow(1 - p, 3.2)));
          if (p < 1) requestAnimationFrame(paso);
        };
        requestAnimationFrame(paso);
      }
    },
    { threshold: 0.4 }
  );

  cifras.forEach((el) => { el.textContent = "0"; vigia.observe(el); });
}

/* --------------------------------------------- barra de avance y barra fija */

function avance() {
  const barra = document.getElementById("avance");
  const cabecera = document.querySelector(".barra");
  let pendiente = false;

  function actualizar() {
    pendiente = false;
    const alto = document.documentElement.scrollHeight - innerHeight;
    const p = alto > 0 ? scrollY / alto : 0;
    if (barra) barra.style.transform = `scaleX(${p})`;
    if (cabecera) cabecera.classList.toggle("encogida", scrollY > 40);
  }

  addEventListener("scroll", () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(actualizar);
  }, { passive: true });

  actualizar();
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
  const preludio = new Preludio();
  const LLAVE = "jsar:musica";

  function reflejar() {
    if (!mando) return;
    mando.classList.toggle("sonando", preludio.sonando);
    mando.setAttribute("aria-pressed", String(preludio.sonando));
    mando.querySelector(".obra").textContent = preludio.sonando ? "Bach · BWV 846" : "Música";
  }

  function abrir(conMusica) {
    if (puerta) puerta.classList.add("abierta");
    try { sessionStorage.setItem("jsar:entrado", "1"); } catch {}
    if (conMusica) {
      preludio.tocar().then(reflejar);
      try { localStorage.setItem(LLAVE, "1"); } catch {}
    }
    setTimeout(() => puerta?.remove(), 1300);
  }

  puerta?.querySelector("[data-entrar-con-musica]")?.addEventListener("click", () => abrir(true));
  puerta?.querySelector("[data-entrar-en-silencio]")?.addEventListener("click", () => {
    try { localStorage.setItem(LLAVE, "0"); } catch {}
    abrir(false);
  });

  mando?.addEventListener("click", () => {
    const sonando = preludio.alternar();
    try { localStorage.setItem(LLAVE, sonando ? "1" : "0"); } catch {}
    setTimeout(reflejar, 0);
  });

  // Al cambiar de página dentro del sitio, la puerta ya no se muestra; si la
  // música quedó encendida, se reanuda con el primer gesto — el navegador no
  // permite menos.
  let yaEntro = false;
  try { yaEntro = sessionStorage.getItem("jsar:entrado") === "1"; } catch {}
  if (yaEntro && puerta) puerta.remove();

  let queria = false;
  try { queria = localStorage.getItem(LLAVE) === "1"; } catch {}
  if (yaEntro && queria) {
    const reanudar = () => {
      preludio.tocar().then(reflejar);
      removeEventListener("pointerdown", reanudar);
      removeEventListener("keydown", reanudar);
    };
    addEventListener("pointerdown", reanudar, { once: true });
    addEventListener("keydown", reanudar, { once: true });
  }

  // Fuera de la pestaña, silencio.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && preludio.sonando) { preludio.callar(); reflejar(); }
  });

  reflejar();
}

/* ------------------------------------------------------------------ arranque */

componerNombre();
horizonte();
revelado();
contadores();
avance();
halo();
audio();
