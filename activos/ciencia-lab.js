import { TAU, TOLERANCIA, estado, envolver, densidad, resolverInverso, muestrear, crearCSV } from "./modelo-ciencia.js";

const RAD = Math.PI / 180;
const formato = (numero, cifras = 3) => numero.toLocaleString("es-CO", { minimumFractionDigits: cifras, maximumFractionDigits: cifras });
let instalado = false;
let desmontar = () => {};

/** O(1) fuera del montaje. Invariante: un montaje y un listener global por módulo. */
export function iniciarCiencia() {
  if (instalado) return;
  instalado = true;
  const montar = () => {
    desmontar();
    const raiz = document.getElementById("laboratorio-ciencia");
    desmontar = raiz ? crearLaboratorio(raiz) : () => {};
  };
  addEventListener("sitio:navegacion", montar);
  montar();
}

/** O(N+V) memoria: N muestras, V vértices de la representación. */
function crearLaboratorio(raiz) {
  const ciclo = new AbortController();
  const { signal } = ciclo;
  const $ = id => raiz.querySelector(`#ciencia-${id}`);
  const reducida = matchMedia("(prefers-reduced-motion: reduce)");
  const volumen = $("volumen"), bloch = $("bloch"), grafica = $("grafica");
  const contextos = [volumen, bloch, grafica].map(lienzo => lienzo.getContext("2d"));
  if (!contextos.every(Boolean)) raiz.querySelector(".ciencia-sin-canvas").hidden = false;
  const dimensiones = new Map();
  let theta = Math.PI / 2, phi = Math.PI / 4, tiempo = 0;
  let muestra = muestrear(theta, phi);
  let corriendo = false, visible = true, fotograma = 0, anterior = 0, ultimaLectura = 0;
  let cerrado = false, modeloSucio = true;
  let yaw = -.5, pitch = .76, arrastrando = false, inicioX = 0, inicioY = 0;
  let baseYaw = yaw, basePitch = pitch;
  let puntero = null;
  const pausado = () => document.hidden || document.body.classList.contains("escena-pausada") || reducida.matches;
  const escuchar = (nodo, evento, funcion, opciones = {}) => nodo.addEventListener(evento, funcion, { ...opciones, signal });

  /** O(1) tiempo/espacio. Solo se conserva una solicitud RAF pendiente. */
  const solicitar = () => {
    if (!cerrado && !fotograma && visible && !document.hidden) fotograma = requestAnimationFrame(dibujar);
  };

  /** O(1) tiempo/espacio. Los controles reflejan el estado usado en el dibujo. */
  function reflejarControles() {
    $("theta").value = theta / RAD;
    $("phi").value = envolver(phi) / RAD;
    $("theta-valor").value = `${formato(theta / RAD, 1)}°`;
    $("phi-valor").value = `${formato(envolver(phi) / RAD, 1)}°`;
    for (const control of raiz.querySelectorAll('input[type="range"]')) {
      control.style.setProperty("--valeur", `${100 * (control.valueAsNumber - Number(control.min)) / (Number(control.max) - Number(control.min))}%`);
    }
  }

  /** O(N) cálculo y O(1) actualizaciones DOM; lectura textual equivalente al gráfico. */
  function medir() {
    muestra = muestrear(theta, phi);
    const e = estado(theta, phi);
    $("contraste").textContent = formato(e.contraste);
    $("p1").textContent = formato(e.p1);
    $("norma").textContent = formato(muestra.integral, 6);
    $("error").value = muestra.errorNorma.toExponential(2).replace(".", ",");
    $("veredicto").textContent = muestra.errorNorma <= TOLERANCIA ? "Cumple en esta evaluación." : "Fuera del umbral.";
    $("tiempo").textContent = `τ = ${formato(tiempo, 2)} · tiempo adimensional`;
    $("bloch-lectura").textContent = `Bloch: (${e.bloch.map(n => formato(n, 2)).join("; ")})`;
    reflejarControles();
  }

  /** O(1) tiempo/espacio. Pausar no altera θ, φ ni la cámara. */
  function detener() {
    corriendo = false;
    anterior = 0;
    $("evolucion").setAttribute("aria-pressed", "false");
    $("evolucion").textContent = "↻ Evolucionar fase";
  }

  /** O(N) tiempo/espacio. Una intervención manual detiene la evolución libre. */
  function aplicar(nuevoTheta, nuevaPhi) {
    detener();
    theta = nuevoTheta;
    phi = envolver(nuevaPhi);
    tiempo = 0;
    modeloSucio = true;
    medir();
    solicitar();
  }

  escuchar($("theta"), "input", () => aplicar($("theta").valueAsNumber * RAD, phi));
  escuchar($("phi"), "input", () => aplicar(theta, $("phi").valueAsNumber * RAD));
  escuchar($("reiniciar"), "click", () => {
    yaw = -.5; pitch = .76; puntero = null;
    aplicar(Math.PI / 2, Math.PI / 4);
    $("solucion").textContent = "Estado inicial: θ = 90°, φ = 45°. En el ecuador, ambas ramas coinciden.";
  });
  escuchar($("evolucion"), "click", () => {
    if (corriendo) { detener(); medir(); return; }
    if (pausado()) {
      $("solucion").textContent = "La evolución está detenida por la preferencia de movimiento. Puedes modificar cada estado con los controles.";
      return;
    }
    corriendo = true;
    anterior = 0;
    $("evolucion").setAttribute("aria-pressed", "true");
    $("evolucion").textContent = "Ⅱ Detener evolución";
    solicitar();
  });
  const reflejarObjetivo = () => {
    $("objetivo-c-valor").value = formato($("objetivo-c").valueAsNumber, 2);
    $("objetivo-x-valor").value = `${formato($("objetivo-x").valueAsNumber, 0)}°`;
    reflejarControles();
  };
  escuchar($("objetivo-c"), "input", reflejarObjetivo);
  escuchar($("objetivo-x"), "input", reflejarObjetivo);
  escuchar($("resolver"), "click", () => {
    const c = $("objetivo-c").valueAsNumber;
    const solucion = resolverInverso(c, $("objetivo-x").valueAsNumber * RAD);
    aplicar(solucion.theta, solucion.phi);
    const error = Math.abs(Math.sin(theta) - c);
    $("solucion").textContent = c === 0
      ? "C = 0: densidad uniforme. Elegimos θ = 0°; θ = 180° es su gemelo. La fase no es identificable y el máximo no es único."
      : `θ = ${formato(theta / RAD, 2)}°; φ = ${formato(phi / RAD, 1)}°. Residuo de contraste: ${error.toExponential(1)}. ${solucion.ramasDistintas ? `Gemelo: θ′ = ${formato(solucion.gemelo / RAD, 2)}°.` : "Las ramas coinciden en el ecuador."}`;
  });
  escuchar($("gemelo"), "click", () => {
    const pAnterior = estado(theta, phi).p1;
    aplicar(Math.PI - theta, phi);
    const e = estado(theta, phi);
    $("solucion").textContent = `La densidad se conserva. θ = ${formato(theta / RAD, 2)}°; P₁ cambia de ${formato(pAnterior, 4)} a ${formato(e.p1, 4)}.${Math.abs(theta - Math.PI / 2) < 1e-10 ? " En el ecuador las ramas coinciden." : " La población modal distingue las dos ramas."}`;
  });
  escuchar($("descargar"), "click", () => {
    // O(N) tiempo/espacio. El archivo corresponde exactamente al estado de descarga.
    detener(); medir();
    const blob = new Blob([crearCSV(theta, phi)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = Object.assign(document.createElement("a"), { href: url, download: "interferencia-dos-modos.csv" });
    enlace.dataset.navegacion = "normal";
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  escuchar(volumen, "pointerdown", evento => {
    if (evento.button !== 0 || reducida.matches) return;
    arrastrando = true;
    inicioX = evento.clientX; inicioY = evento.clientY;
    baseYaw = yaw; basePitch = pitch;
    volumen.setPointerCapture(evento.pointerId);
  });
  escuchar(volumen, "pointermove", evento => {
    if (reducida.matches || document.body.classList.contains("escena-pausada")) return;
    if (arrastrando) {
      yaw = baseYaw + (evento.clientX - inicioX) * .007;
      pitch = Math.min(1.5, Math.max(-.5, basePitch + (evento.clientY - inicioY) * .006));
    } else if (evento.pointerType !== "touch") {
      const caja = volumen.getBoundingClientRect();
      puntero = [(evento.clientX - caja.left) / caja.width - .5, (evento.clientY - caja.top) / caja.height - .5];
    }
    solicitar();
  });
  const soltar = () => { arrastrando = false; };
  escuchar(volumen, "pointerup", soltar);
  escuchar(volumen, "pointercancel", soltar);
  escuchar(volumen, "lostpointercapture", soltar);
  escuchar(volumen, "pointerleave", () => { puntero = null; solicitar(); });

  const actualizarMovimiento = () => {
    if (pausado()) detener();
    solicitar();
  };
  escuchar(window, "sitio:movimiento", actualizarMovimiento);
  escuchar(reducida, "change", actualizarMovimiento);
  escuchar(document, "visibilitychange", () => {
    anterior = 0;
    if (document.hidden) { cancelAnimationFrame(fotograma); fotograma = 0; }
    else solicitar();
  });
  const observador = new IntersectionObserver(entradas => {
    visible = entradas.some(entrada => entrada.isIntersecting);
    anterior = 0;
    if (!visible) { cancelAnimationFrame(fotograma); fotograma = 0; }
    else solicitar();
  }, { rootMargin: "100px" });
  observador.observe(raiz.querySelector(".ciencia-instrumento"));
  const resize = new ResizeObserver(() => { dimensiones.clear(); solicitar(); });
  [volumen, bloch, grafica].forEach(lienzo => resize.observe(lienzo));

  /** O(1) salvo redimensionamiento; DPR≤1,75, cada canvas≤900000 píxeles. */
  function preparar(lienzo, ctx) {
    if (!ctx) return null;
    let d = dimensiones.get(lienzo);
    if (!d) {
      const caja = lienzo.getBoundingClientRect();
      const ancho = Math.max(1, caja.width), alto = Math.max(1, caja.height);
      const ratio = Math.min(devicePixelRatio || 1, 1.75, Math.sqrt(900000 / (ancho * alto)));
      lienzo.width = Math.round(ancho * ratio);
      lienzo.height = Math.round(alto * ratio);
      d = { ancho, alto, ratio };
      dimensiones.set(lienzo, d);
    }
    ctx.setTransform(d.ratio, 0, 0, d.ratio, 0, 0);
    ctx.clearRect(0, 0, d.ancho, d.alto);
    return d;
  }

  /** O(V log V + N) por dibujo. RAF continuo solo durante evolución visible. */
  function dibujar(ahora) {
    fotograma = 0;
    if (cerrado || !visible || document.hidden) return;
    if (corriendo && !pausado()) {
      const dt = anterior ? Math.min(.05, (ahora - anterior) / 1000) : 0;
      tiempo += .45 * dt;
      phi = envolver(phi - .45 * dt);
      modeloSucio = true;
      if (ahora - ultimaLectura > 100) { medir(); ultimaLectura = ahora; }
    }
    anterior = ahora;
    const d0 = preparar(volumen, contextos[0]);
    if (d0) dibujarVolumen(contextos[0], d0, theta, phi, yaw + (puntero?.[0] || 0) * .5, pitch + (puntero?.[1] || 0) * .3);
    if (modeloSucio || !corriendo) {
      const d1 = preparar(bloch, contextos[1]);
      const d2 = preparar(grafica, contextos[2]);
      if (d1) dibujarBloch(contextos[1], d1, estado(theta, phi).bloch);
      if (d2) dibujarGrafica(contextos[2], d2, theta, phi);
      modeloSucio = false;
    }
    if (corriendo && !pausado()) solicitar();
  }

  raiz.querySelectorAll("input:disabled,button:disabled").forEach(control => { control.disabled = false; });
  raiz.dataset.laboratorio = "listo";
  medir(); reflejarObjetivo(); solicitar();
  return () => {
    cerrado = true;
    cancelAnimationFrame(fotograma);
    ciclo.abort();
    resize.disconnect(); observador.disconnect();
  };
}

/** O(1) tiempo/espacio. Proyección perspectiva con profundidad positiva. */
function proyector(ancho, alto, yaw, pitch, escala = .32) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const s = Math.min(ancho, alto * 1.42) * escala;
  return (x, y, z) => {
    const xx = x * cy + z * sy, zz = -x * sy + z * cy;
    const yy = y * cp - zz * sp, profundidad = y * sp + zz * cp;
    const perspectiva = 5 / (5 - profundidad);
    return [ancho * .5 + xx * s * perspectiva, alto * .48 - yy * s * perspectiva, profundidad];
  };
}

/** O(V log V) tiempo/O(V) espacio. Malla paramétrica, radio del tubo=0,32√(2πρ). */
function dibujarVolumen(ctx, { ancho, alto }, theta, phi, yaw, pitch) {
  const proyectar = proyector(ancho, alto, yaw, pitch);
  const pasos = ancho < 500 ? 72 : 96;
  const anillos = 20;
  const puntos = [];
  const caras = [];
  const contraste = Math.sin(theta);
  const cp = Math.cos(pitch), sp = Math.sin(pitch), cy = Math.cos(yaw), sy = Math.sin(yaw);
  for (let i = 0; i < pasos; i++) {
    const u = i * TAU / pasos, cu = Math.cos(u), su = Math.sin(u);
    const radio = .32 * Math.sqrt(Math.max(0, 1 + contraste * Math.cos(u - phi)));
    for (let j = 0; j < anillos; j++) {
      const v = j * TAU / anillos, cv = Math.cos(v), sv = Math.sin(v);
      puntos.push(proyectar((1 + radio * cv) * cu, radio * sv, (1 + radio * cv) * su));
    }
  }
  for (let i = 0; i < pasos; i++) {
    const u = (i + .5) * TAU / pasos;
    for (let j = 0; j < anillos; j++) {
      const v = (j + .5) * TAU / anillos;
      const indices = [i * anillos + j, ((i + 1) % pasos) * anillos + j,
        ((i + 1) % pasos) * anillos + (j + 1) % anillos, i * anillos + (j + 1) % anillos];
      const n0 = Math.cos(u) * Math.cos(v), n1 = Math.sin(v), n2 = Math.sin(u) * Math.cos(v);
      const nx = n0 * cy + n2 * sy, nz0 = -n0 * sy + n2 * cy;
      const ny = n1 * cp - nz0 * sp, nz = n1 * sp + nz0 * cp;
      const luz = Math.max(0, -.4 * nx + .55 * ny + .73 * nz);
      const brillo = Math.pow(Math.max(0, -.3 * nx + .35 * ny + .88 * nz), 18);
      caras.push({ indices, z: indices.reduce((n, k) => n + puntos[k][2], 0) / 4, luz, brillo });
    }
  }
  // La cuadrícula solo sitúa la representación; no aporta medidas físicas.
  ctx.lineWidth = .5;
  ctx.strokeStyle = "rgba(230,184,163,.13)";
  for (let i = -3; i <= 3; i++) {
    const p = proyectar(i * .6, -.64, -1.9), q = proyectar(i * .6, -.64, 1.9);
    const r = proyectar(-1.9, -.64, i * .6), s = proyectar(1.9, -.64, i * .6);
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]);
    ctx.moveTo(r[0], r[1]); ctx.lineTo(s[0], s[1]); ctx.stroke();
  }
  const halo = ctx.createRadialGradient(ancho / 2, alto / 2, 10, ancho / 2, alto / 2, Math.min(ancho, alto) * .46);
  halo.addColorStop(0, "rgba(168,43,35,.11)"); halo.addColorStop(1, "rgba(168,43,35,0)");
  ctx.fillStyle = halo; ctx.fillRect(0, 0, ancho, alto);
  caras.sort((a, b) => a.z - b.z);
  for (const cara of caras) {
    const { indices, luz, brillo } = cara;
    const r = Math.round(39 + luz * 91 + brillo * 116);
    const g = Math.round(17 + luz * 40 + brillo * 169);
    const b = Math.round(21 + luz * 31 + brillo * 151);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.strokeStyle = `rgba(247,206,181,${.05 + luz * .13 + brillo * .18})`;
    ctx.lineWidth = .55;
    ctx.beginPath();
    indices.forEach((k, i) => i ? ctx.lineTo(puntos[k][0], puntos[k][1]) : ctx.moveTo(puntos[k][0], puntos[k][1]));
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // Una curva sobre la superficie sigue el ángulo x; referencias 0 y π.
  ctx.strokeStyle = "rgba(255,173,136,.72)"; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= pasos; i++) {
    const p = puntos[(i % pasos) * anillos + 5];
    i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
  }
  ctx.stroke();
  ctx.font = "10px monospace"; ctx.fillStyle = "#c5aaa0";
  for (const [u, texto] of [[0,"x = 0"],[Math.PI,"x = π"]]) {
    const p = proyectar(1.65 * Math.cos(u), 0, 1.65 * Math.sin(u));
    ctx.textAlign = p[0] > ancho / 2 ? "left" : "right";
    ctx.fillText(texto, p[0], p[1]);
  }
  if (contraste > TOLERANCIA) {
    const nodo = proyectar(1.05 * Math.cos(phi), .55, 1.05 * Math.sin(phi));
    ctx.fillStyle = "#f7d6b7"; ctx.beginPath(); ctx.arc(nodo[0], nodo[1], 2.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#f7d6b755"; ctx.beginPath(); ctx.arc(nodo[0], nodo[1], 7, 0, TAU); ctx.stroke();
  }
}

/** O(K) tiempo/O(1) memoria, K fijo. Esfera unitaria de coordenadas X,Y,Z. */
function dibujarBloch(ctx, { ancho, alto }, vector) {
  const p = proyector(ancho, alto, -.6, .22, .34);
  const proyectarBloch = (x, y, z) => p(x, z, y);
  ctx.lineWidth = .7; ctx.strokeStyle = "#e1c1ac40";
  for (let eje = 0; eje < 3; eje++) {
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const angulo = TAU * i / 100;
      const coords = [Math.cos(angulo), Math.sin(angulo)];
      coords.splice(eje, 0, 0);
      const q = proyectarBloch(...coords);
      i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
    }
    ctx.stroke();
  }
  const origen = proyectarBloch(0, 0, 0);
  ctx.font = "9px monospace"; ctx.fillStyle = "#cfbfb0"; ctx.textAlign = "center";
  for (const [coords, etiqueta] of [[[1.25,0,0],"X"],[[0,1.25,0],"Y"],[[0,0,1.25],"Z · |0⟩"],[[0,0,-1.25],"|1⟩"]]) {
    const q = proyectarBloch(...coords);
    ctx.beginPath(); ctx.moveTo(origen[0], origen[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    ctx.fillText(etiqueta, q[0], q[1] + (coords[2] > 0 ? -5 : 10));
  }
  const punta = proyectarBloch(...vector);
  ctx.strokeStyle = "#ff9370"; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(origen[0], origen[1]); ctx.lineTo(punta[0], punta[1]); ctx.stroke();
  ctx.fillStyle = "#ffb997"; ctx.shadowColor = "#ff7058"; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.arc(punta[0], punta[1], 4, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
}

/** O(N) tiempo/O(1) espacio, N=256. Ejes angulares y densidad con unidades. */
function dibujarGrafica(ctx, { ancho, alto }, theta, phi) {
  const l = 49, r = 14, t = 22, b = 33;
  const w = Math.max(1, ancho - l - r), h = Math.max(1, alto - t - b);
  const x = angulo => l + w * angulo / TAU;
  const y = valor => t + h - valor * Math.PI * h;
  ctx.font = "9px monospace"; ctx.textAlign = "right"; ctx.fillStyle = "#b7a79a"; ctx.lineWidth = .5;
  for (let i = 0; i < 3; i++) {
    const yy = t + h * i / 2;
    ctx.strokeStyle = "#eed9c524"; ctx.beginPath(); ctx.moveTo(l, yy); ctx.lineTo(l + w, yy); ctx.stroke();
    ctx.fillText(["1/π", "1/2π", "0"][i], l - 8, yy + 3);
  }
  ctx.textAlign = "center";
  for (let i = 0; i <= 4; i++) {
    const xx = l + w * i / 4;
    ctx.strokeStyle = "#eed9c512"; ctx.beginPath(); ctx.moveTo(xx, t); ctx.lineTo(xx, t + h); ctx.stroke();
    ctx.fillText(["0", "π/2", "π", "3π/2", "2π"][i], xx, t + h + 16);
  }
  ctx.textAlign = "left"; ctx.fillText("ρ [rad⁻¹]", l, 10);
  ctx.textAlign = "right"; ctx.fillText("x [rad]", l + w, alto - 1);
  ctx.strokeStyle = "#d4b4a766"; ctx.setLineDash([4,4]);
  ctx.beginPath(); ctx.moveTo(l, y(1 / TAU)); ctx.lineTo(l + w, y(1 / TAU)); ctx.stroke(); ctx.setLineDash([]);
  const relleno = ctx.createLinearGradient(0, t, 0, t + h);
  relleno.addColorStop(0, "#ff735335"); relleno.addColorStop(1, "#ff735300");
  ctx.beginPath(); ctx.moveTo(l, t + h);
  for (let i = 0; i <= 256; i++) { const a = TAU * i / 256; ctx.lineTo(x(a), y(densidad(a, theta, phi))); }
  ctx.lineTo(l + w, t + h); ctx.closePath(); ctx.fillStyle = relleno; ctx.fill();
  ctx.beginPath();
  for (let i = 0; i <= 256; i++) { const a = TAU * i / 256; i ? ctx.lineTo(x(a), y(densidad(a, theta, phi))) : ctx.moveTo(x(a), y(densidad(a, theta, phi))); }
  ctx.strokeStyle = "#ff9274"; ctx.lineWidth = 1.75; ctx.stroke();
  if (Math.sin(theta) > 1e-10) {
    const xx = x(envolver(phi)), yy = y(densidad(phi, theta, phi));
    ctx.fillStyle = "#f5dfc6"; ctx.beginPath(); ctx.arc(xx, yy, 3, 0, TAU); ctx.fill();
  }
}
