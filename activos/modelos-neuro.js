/**
 * Modelos reducidos para investigación reproducible. Parámetros sintéticos.
 * Tiempo: ms; concentración: μM; Vmax: μM/ms. Sin interpretación clínica.
 * Las proposiciones son exactas en aritmética real. JavaScript usa Float64;
 * esta implementación no es una biblioteca de intervalos con redondeo dirigido.
 */
export const NEURO_TOLERANCIA = 1e-10;

/** O(1). Invariante: número finito perteneciente al intervalo indicado. */
function validar(x, min, max, nombre, estricto = false) {
  if (!Number.isFinite(x) || x < min || x > max || (estricto && x === min)) throw new RangeError(`${nombre}: dominio ${estricto ? '(' : '['}${min},${max}].`);
  return x;
}
/** O(1). Invariante: límites válidos y ordenados, sin alterar datos de entrada. */
function intervalo(lo, hi, min, max, nombre, estricto = false) {
  validar(lo, min, max, nombre, estricto); validar(hi, lo, max, nombre);
}
/** O(1). Invariante: tamaño de serie acotado y entero. */
function contar(n) { validar(n, 2, 10000, 'Muestras'); if (!Number.isInteger(n)) throw new RangeError('Muestras debe ser entero.'); }

/** O(1). Invariantes: r* y q* ∈[0,1]; Δ=0,u=0 conserva el reservorio. */
export function equilibrioVesicular({ u, tauMs, deltaMs }) {
  validar(u, 0, 1, 'u'); validar(tauMs, 0, 1e8, 'τ', true); validar(deltaMs, 0, 1e9, 'Δ');
  const recuperado = -Math.expm1(-deltaMs / tauMs);
  const a = Math.exp(-deltaMs / tauMs);
  const denominador = recuperado + u * a;
  const rEstacionario = denominador === 0 ? null : recuperado / denominador;
  return { rEstacionario, liberacionEstacionaria: u === 0 ? 0 : u * rEstacionario, contraccion: (1 - u) * a };
}

/** O(N) tiempo/memoria. r_n∈[0,1], liberación+post=pre; actualización exacta. */
export function simularVesiculas({ u = .35, tauMs = 800, deltaMs = 250, pulsos = 24, r0 = 1 } = {}) {
  const equilibrio = equilibrioVesicular({ u, tauMs, deltaMs });
  contar(pulsos); validar(r0, 0, 1, 'r0');
  const serie = [];
  const a = Math.exp(-deltaMs / tauMs), b = -Math.expm1(-deltaMs / tauMs);
  let r = r0;
  for (let indice = 0; indice < pulsos; indice++) {
    const liberacion = u * r, rPost = (1 - u) * r;
    serie.push({ indice, tMs: indice * deltaMs, rPre: r, rPost, liberacion });
    r = b + rPost * a;
  }
  return { serie, ...equilibrio,
    errorUltimo: Math.abs(serie.at(-1).liberacion - equilibrio.liberacionEstacionaria),
    cotaUltimo: equilibrio.rEstacionario === null ? 0 : u * Math.abs(r0 - equilibrio.rEstacionario) * equilibrio.contraccion ** (pulsos - 1),
  };
}

/** O(1). Δ mínimo para q*≥objetivo. null indica que ningún Δ finito alcanza q*=u>0. */
export function resolverIntervaloVesicular({ u, tauMs, objetivo }) {
  validar(u, 0, 1, 'u'); validar(tauMs, 0, 1e8, 'τ', true); validar(objetivo, 0, 1, 'Objetivo');
  if (objetivo === 0) return { deltaMinMs: 0, finito: true, motivo: 'Objetivo nulo.' };
  if (objetivo >= u) return { deltaMinMs: null, finito: false, motivo: objetivo === u ? 'El objetivo exige recuperación completa, límite Δ→∞.' : 'El objetivo supera la fracción utilizable.' };
  const deltaMinMs = tauMs * Math.log1p(u * objetivo / (u - objetivo));
  return { deltaMinMs, finito: true, motivo: 'Solución exacta del estado estacionario.' };
}

/** O(1). q* crece con u y decrece con τ: la esquina uMin,τMax es el peor caso. */
export function resolverVesiculasRobusto({ uMin, uMax, tauMinMs, tauMaxMs, objetivo }) {
  intervalo(uMin, uMax, 0, 1, 'u'); intervalo(tauMinMs, tauMaxMs, 0, 1e8, 'τ', true);
  const robusto = resolverIntervaloVesicular({ u: uMin, tauMs: tauMaxMs, objetivo });
  const nominal = resolverIntervaloVesicular({ u: (uMin + uMax) / 2, tauMs: (tauMinMs + tauMaxMs) / 2, objetivo });
  const peor = deltaMs => deltaMs === null ? null : equilibrioVesicular({ u: uMin, tauMs: tauMaxMs, deltaMs }).liberacionEstacionaria;
  return { ...robusto, nominalMs: nominal.deltaMinMs,
    peorLiberacionNominal: peor(nominal.deltaMinMs), peorLiberacionCertificada: peor(robusto.deltaMinMs),
    supuestos: 'Parámetros constantes en una caja; estado estacionario o r0≥r*. No certifica todos los transitorios para r0 arbitrario.',
  };
}

/** O(1). Dominio físico del modelo saturable: C0≥0, Km>0 y Vmax≥0. */
function validarLimpieza({ c0, km, vmax = 0 }) {
  validar(c0, 0, 1e6, 'C0'); validar(km, 0, 1e6, 'Km', true); validar(vmax, 0, 1e6, 'Vmax');
}

/**
 * O(B) tiempo/O(1) memoria, B≤80 bisecciones. Invariantes: 0≤C(t)≤C0.
 * Se resuelve C0(1−exp(−y))+Km*y=V*t, y=log(C0/C). La ecuación es monótona.
 * Evita el desbordamiento de la expresión equivalente con Lambert W.
 */
export function concentracionLimpieza({ c0, km, vmax, tMs }) {
  validarLimpieza({ c0, km, vmax }); validar(tMs, 0, 1e9, 't');
  if (!c0 || !vmax || !tMs) return c0;
  const carga = vmax * tMs;
  let lo = Math.max(0, (carga - c0) / km), hi = carga / km;
  for (let j = 0; j < 80; j++) {
    const y = lo + (hi - lo) / 2;
    if (y === lo || y === hi) break;
    if (-c0 * Math.expm1(-y) + km * y < carga) lo = y; else hi = y;
  }
  return c0 * Math.exp(-(lo + hi) / 2);
}

/** O(1). Tiempo exacto hasta Cobjetivo. null representa tiempo infinito. */
export function tiempoLimpieza({ c0, km, vmax, objetivo }) {
  validarLimpieza({ c0, km, vmax }); validar(objetivo, 0, 1e6, 'Objetivo');
  if (objetivo >= c0) return 0;
  if (!objetivo || !vmax) return null;
  return (c0 - objetivo + km * Math.log(c0 / objetivo)) / vmax;
}

/** O(1). Capacidad mínima para alcanzar el objetivo antes del plazo. */
export function resolverLimpieza({ c0, km, objetivo, plazoMs }) {
  validarLimpieza({ c0, km }); validar(objetivo, 0, 1e6, 'Objetivo'); validar(plazoMs, 0, 1e9, 'Plazo');
  if (objetivo >= c0) return { vmaxMin: 0, finito: true };
  if (!objetivo || !plazoMs) return { vmaxMin: null, finito: false };
  return { vmaxMin: (c0 - objetivo + km * Math.log(c0 / objetivo)) / plazoMs, finito: true };
}

/** O(NB) tiempo/O(N) memoria. Monotonía y positividad proceden de la solución integrada. */
export function simularLimpieza({ c0 = 2, km = .2, vmax = .002, duracionMs = 1500, muestras = 240, objetivo = .1 } = {}) {
  contar(muestras); validar(duracionMs, 0, 1e9, 'Duración');
  const tiempoObjetivoMs = tiempoLimpieza({ c0, km, vmax, objetivo });
  const serie = Array.from({ length: muestras + 1 }, (_, i) => {
    const tMs = i * duracionMs / muestras;
    return { tMs, c: concentracionLimpieza({ c0, km, vmax, tMs }) };
  });
  return { serie, tiempoObjetivoMs };
}

/** O(1). Matriz de desviaciones E/I: E,I pueden ser negativos; no son tasas absolutas. */
export function analizarCircuito({ w = 1.8, g = .4, h = 1.2, tauEMs = 20, tauIMs = 10 } = {}) {
  validar(w, 0, 100, 'w'); validar(g, 0, 100, 'g'); validar(h, 0, 100, 'h');
  validar(tauEMs, 0, 1e8, 'τE', true); validar(tauIMs, 0, 1e8, 'τI', true);
  const a = (w - 1) / tauEMs, b = -g / tauEMs, c = h / tauIMs, d = -1 / tauIMs;
  const traza = a + d, determinante = (1 - w + g * h) / (tauEMs * tauIMs);
  const discriminante = traza * traza - 4 * determinante;
  const raiz = Math.sqrt(Math.abs(discriminante));
  const autovalores = discriminante >= 0
    ? [{ re: (traza + raiz) / 2, im: 0 }, { re: (traza - raiz) / 2, im: 0 }]
    : [{ re: traza / 2, im: raiz / 2 }, { re: traza / 2, im: -raiz / 2 }];
  return { matriz: [a, b, c, d], traza, determinante, autovalores,
    maxReal: Math.max(...autovalores.map(l => l.re)),
    estable: traza < 0 && determinante > 0,
    limiteW: Math.min(1 + tauEMs / tauIMs, 1 + g * h),
    margenDeterminante: 1 - w + g * h,
  };
}

/** O(1). Ganancia mínima con 1−w+g*h≥margen>0; g no cambia la traza. */
export function resolverInhibicion({ w, h, tauEMs, tauIMs, margen = .2 }) {
  analizarCircuito({ w, h, tauEMs, tauIMs, g: 0 }); validar(margen, 0, 100, 'Margen', true);
  if (w >= 1 + tauEMs / tauIMs) return { gMin: null, finito: false, motivo: 'La traza no es negativa: aumentar g no basta.' };
  const requerido = w - 1 + margen;
  if (requerido <= 0) return { gMin: 0, finito: true, motivo: 'El circuito ya cumple con g=0.' };
  if (!h) return { gMin: null, finito: false, motivo: 'h=0: la realimentación inhibitoria está desconectada.' };
  return { gMin: requerido / h, finito: true, motivo: 'Margen positivo de determinante con traza negativa.' };
}

/** O(1). Extremos exactos de Hurwitz para una caja independiente de parámetros positivos. */
export function resolverCircuitoRobusto({ wMin, wMax, hMin, hMax, tauEMinMs, tauEMaxMs, tauIMinMs, tauIMaxMs, margen = .2 }) {
  intervalo(wMin, wMax, 0, 100, 'w'); intervalo(hMin, hMax, 0, 100, 'h');
  intervalo(tauEMinMs, tauEMaxMs, 0, 1e8, 'τE', true); intervalo(tauIMinMs, tauIMaxMs, 0, 1e8, 'τI', true);
  const limiteTraza = 1 + tauEMinMs / tauIMaxMs;
  const peorTraza = (wMax - 1) / (wMax >= 1 ? tauEMinMs : tauEMaxMs) - 1 / tauIMaxMs;
  const solucion = resolverInhibicion({ w: wMax, h: hMin, tauEMs: tauEMinMs, tauIMs: tauIMaxMs, margen });
  return { ...solucion, limiteTraza, peorTraza,
    margenDeterminante: solucion.finito ? 1 - wMax + solucion.gMin * hMin : null,
  };
}

/**
 * O(1) tiempo/espacio. exp(A*t) por Cayley-Hamilton, sin discretización de la ODE.
 * Incluye discriminante nulo (Jordan), real e imaginario. Valores demasiado
 * grandes se marcan truncados en la serie; no se hacen pasar por estabilidad.
 */
function evolucionLineal(matriz, t, e0, i0) {
  const [a, b, c, d] = matriz, mu = (a + d) / 2;
  const z2 = ((a - d) / 2) ** 2 + b * c;
  let f, k;
  if (Math.abs(z2) < 1e-20) { f = Math.exp(mu * t); k = f * t; }
  else if (z2 > 0) {
    const z = Math.sqrt(z2), mas = Math.exp((mu + z) * t), menos = Math.exp((mu - z) * t);
    f = (mas + menos) / 2; k = (mas - menos) / (2 * z);
  } else {
    const z = Math.sqrt(-z2), factor = Math.exp(mu * t);
    f = factor * Math.cos(z * t); k = factor * Math.sin(z * t) / z;
  }
  return { e: f * e0 + k * ((a - mu) * e0 + b * i0), i: f * i0 + k * (c * e0 + (d - mu) * i0) };
}

/** O(N) tiempo/memoria. Respuesta libre de desviaciones iniciales; s=0 tras el impulso. */
export function simularCircuito({ w = 1.8, g = .4, h = 1.2, tauEMs = 20, tauIMs = 10, duracionMs = 300, muestras = 240, e0 = 1, i0 = 0 } = {}) {
  const analisis = analizarCircuito({ w, g, h, tauEMs, tauIMs });
  contar(muestras); validar(duracionMs, 0, 1e9, 'Duración'); validar(e0, -1e6, 1e6, 'E0'); validar(i0, -1e6, 1e6, 'I0');
  const serie = []; let truncada = false;
  for (let n = 0; n <= muestras; n++) {
    const tMs = n * duracionMs / muestras, punto = evolucionLineal(analisis.matriz, tMs, e0, i0);
    if (![punto.e, punto.i].every(Number.isFinite) || Math.max(Math.abs(punto.e), Math.abs(punto.i)) > 1e12) { truncada = true; break; }
    serie.push({ tMs, ...punto });
  }
  return { serie, ...analisis, truncada };
}

/** O(P). Recorte convexo por a*Km+b*V≤c. ε es holgura numérica, no error experimental. */
function recortar(poligono, a, b, c) {
  const salida = [], holgura = 1e-12;
  for (let j = 0; j < poligono.length; j++) {
    const p = poligono[j], q = poligono[(j + 1) % poligono.length];
    const fp = a * p.km + b * p.vmax - c - holgura;
    const fq = a * q.km + b * q.vmax - c - holgura;
    if (fp <= 0) salida.push(p);
    if ((fp <= 0) !== (fq <= 0)) {
      const s = fp / (fp - fq);
      salida.push({ km: p.km + s * (q.km - p.km), vmax: p.vmax + s * (q.vmax - p.vmax) });
    }
  }
  return salida;
}

/**
 * O(M²) peor caso tiempo/O(M) memoria: 2M semiplanos, ≤4+2M vértices.
 * Factibilidad exacta EN EL MODELO con C0 conocida y mediciones acotadas.
 * La implementación Float64 usa holgura 10⁻¹² μM; no redondeo dirigido.
 */
export function acotarLimpieza({ c0, mediciones, kmMin = .01, kmMax = 1, vmaxMin = .0001, vmaxMax = .01 }) {
  validar(c0, 0, 1e6, 'C0', true);
  intervalo(kmMin, kmMax, 0, 1e6, 'Km', true); intervalo(vmaxMin, vmaxMax, 0, 1e6, 'Vmax');
  if (!Array.isArray(mediciones) || mediciones.length > 1000) throw new RangeError('Mediciones inválidas.');
  let vertices = [{ km: kmMin, vmax: vmaxMin }, { km: kmMax, vmax: vmaxMin }, { km: kmMax, vmax: vmaxMax }, { km: kmMin, vmax: vmaxMax }];
  for (const { tMs, min, max } of mediciones) {
    validar(tMs, 0, 1e9, 't', true); intervalo(min, max, 0, c0, 'Concentración');
    if (!max) { vertices = []; break; } // C(t)>0 a tiempo finito para C0>0, Km>0.
    vertices = recortar(vertices, Math.log(c0 / max), -tMs, max - c0);
    if (min > 0) vertices = recortar(vertices, -Math.log(c0 / min), tMs, c0 - min);
    if (!vertices.length) break;
  }
  let dobleArea = 0;
  for (let j = 0; j < vertices.length; j++) { const p = vertices[j], q = vertices[(j + 1) % vertices.length]; dobleArea += p.km * q.vmax - q.km * p.vmax; }
  return { vertices, vacio: !vertices.length, area: Math.abs(dobleArea) / 2,
    rangoKm: vertices.length ? [Math.min(...vertices.map(p => p.km)), Math.max(...vertices.map(p => p.km))] : null,
    rangoVmax: vertices.length ? [Math.min(...vertices.map(p => p.vmax)), Math.max(...vertices.map(p => p.vmax))] : null,
    holguraNumerica: 1e-12, redondeoDirigido: false,
  };
}

/**
 * O(PB) tiempo/O(1) memoria adicional. Los niveles de C(t) son semiplanos:
 * sus extremos en un polígono convexo se alcanzan en vértices (prueba en docs).
 */
export function predecirLimpiezaAcotada({ c0, vertices, tMs }) {
  validar(c0, 0, 1e6, 'C0'); validar(tMs, 0, 1e9, 't');
  if (!Array.isArray(vertices)) throw new RangeError('Polígono inválido.');
  if (!vertices.length) return { min: null, max: null, vacio: true };
  let min = Infinity, max = -Infinity;
  for (const { km, vmax } of vertices) { const c = concentracionLimpieza({ c0, km, vmax, tMs }); min = Math.min(min, c); max = Math.max(max, c); }
  return { min, max, vacio: false };
}

/** O(1). Comparador puntual con dos mediciones exactas; singularidad/negatividad explícitas. */
export function estimarLimpiezaPuntual({ c0, mediciones }) {
  validar(c0, 0, 1e6, 'C0', true);
  if (!Array.isArray(mediciones) || mediciones.length !== 2) throw new RangeError('Se requieren dos mediciones.');
  const [p, q] = mediciones;
  for (const m of mediciones) { validar(m.tMs, 0, 1e9, 't', true); validar(m.c, 0, c0, 'C', true); }
  const lp = Math.log(c0 / p.c), lq = Math.log(c0 / q.c);
  const denominador = p.tMs * lq - q.tMs * lp;
  if (Math.abs(denominador) < 1e-12) return { km: null, vmax: null, fisico: false, singular: true };
  const km = (q.tMs * (c0 - p.c) - p.tMs * (c0 - q.c)) / denominador;
  const vmax = (c0 - p.c + km * lp) / p.tMs;
  return { km, vmax, fisico: km > 0 && vmax >= 0, singular: false };
}
