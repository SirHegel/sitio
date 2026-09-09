/**
 * Dos modos ortonormales en un anillo: u0 = 1/√(2π), u1 = e^(-ix)/√(2π).
 * θ ∈ [0,π], φ y x en radianes. ρ tiene unidad rad⁻¹.
 * Sin mediciones, aleatoriedad ni dependencias del DOM.
 */
export const TAU = 2 * Math.PI;
export const TOLERANCIA = 1e-12;

/** O(1) tiempo/espacio. Invariante: salida finita en [min,max]. */
function rango(valor, min, max, nombre) {
  if (!Number.isFinite(valor) || valor < min || valor > max) {
    throw new RangeError(`${nombre} debe pertenecer a [${min}, ${max}].`);
  }
  return valor;
}

/** O(1) tiempo/espacio. Invariante: salida ∈ [0,2π). */
export function envolver(angulo) {
  if (!Number.isFinite(angulo)) throw new RangeError("Ángulo no finito.");
  return ((angulo % TAU) + TAU) % TAU;
}

/** O(1) tiempo/espacio. Invariantes: P0+P1=1; |Bloch|²=1, salvo redondeo. */
export function estado(theta, phi) {
  rango(theta, 0, Math.PI, "θ");
  const fase = envolver(phi);
  const a = Math.cos(theta / 2);
  const b = Math.sin(theta / 2);
  const contraste = Math.sin(theta);
  return {
    theta, phi: fase, a, b,
    p0: a * a, p1: b * b, contraste,
    bloch: [contraste * Math.cos(fase), contraste * Math.sin(fase), Math.cos(theta)],
  };
}

/** O(1) tiempo/espacio. Invariante: amplitud compleja en la base indicada. */
export function amplitud(x, theta, phi) {
  if (!Number.isFinite(x)) throw new RangeError("x no finito.");
  const e = estado(theta, phi);
  const escala = Math.sqrt(TAU);
  return {
    re: (e.a + e.b * Math.cos(e.phi - x)) / escala,
    im: e.b * Math.sin(e.phi - x) / escala,
  };
}

/** O(1) tiempo/espacio. Invariante: ρ ≥ 0 e integral analítica igual a 1. */
export function densidad(x, theta, phi) {
  if (!Number.isFinite(x)) throw new RangeError("x no finito.");
  rango(theta, 0, Math.PI, "θ");
  return (1 + Math.sin(theta) * Math.cos(x - envolver(phi))) / TAU;
}

/** O(1) tiempo/espacio. Invariantes: sin θ=C; máximo en x* si C>0. */
export function resolverInverso(contraste, maximo) {
  rango(contraste, 0, 1, "Contraste");
  const theta = Math.asin(contraste);
  const phi = envolver(maximo);
  return {
    theta, phi, gemelo: Math.PI - theta,
    faseIdentificable: contraste > 0,
    ramasDistintas: contraste < 1,
  };
}

/**
 * O(N) tiempo/espacio. N intervalos uniformes; incluye ambos extremos para CSV.
 * La regla trapezoidal integra exactamente el armónico en aritmética real, N≥3.
 */
export function muestrear(theta, phi, n = 512) {
  estado(theta, phi);
  rango(n, 3, 16384, "Número de intervalos");
  if (!Number.isInteger(n)) throw new RangeError("N debe ser entero.");
  const filas = [];
  const paso = TAU / n;
  let integral = 0;
  let errorAmplitud = 0;
  for (let i = 0; i <= n; i++) {
    const x = i * paso;
    const psi = amplitud(x, theta, phi);
    const rho = densidad(x, theta, phi);
    integral += rho * paso * (i === 0 || i === n ? 0.5 : 1);
    errorAmplitud = Math.max(errorAmplitud, Math.abs(rho - psi.re ** 2 - psi.im ** 2));
    filas.push({ x, re: psi.re, im: psi.im, rho });
  }
  return { filas, integral, errorNorma: Math.abs(integral - 1), errorAmplitud, n };
}

/**
 * O(N) tiempo / O(1) espacio extra. Reconstruye los momentos de una densidad.
 * Invariante: para la malla periódica del modelo a=C cosφ y b=C sinφ.
 * La rama sur requiere una medición modal adicional; rho sola no la identifica.
 */
export function reconstruir(filas) {
  if (!Array.isArray(filas) || filas.length < 4) throw new RangeError("Faltan muestras.");
  let a = 0;
  let b = 0;
  let masa = 0;
  for (let i = 1; i < filas.length; i++) {
    const anterior = filas[i - 1];
    const actual = filas[i];
    if (![anterior.x, anterior.rho, actual.x, actual.rho].every(Number.isFinite)
      || actual.x <= anterior.x || anterior.rho < 0 || actual.rho < 0) {
      throw new RangeError("Malla no válida.");
    }
    const dx = actual.x - anterior.x;
    masa += dx * (anterior.rho + actual.rho) / 2;
    a += dx * (anterior.rho * Math.cos(anterior.x) + actual.rho * Math.cos(actual.x));
    b += dx * (anterior.rho * Math.sin(anterior.x) + actual.rho * Math.sin(actual.x));
  }
  const contraste = Math.min(1, Math.hypot(a, b));
  return {
    a, b, masa, contraste,
    phi: contraste > TOLERANCIA ? envolver(Math.atan2(b, a)) : null,
    theta: Math.asin(contraste),
  };
}

/** O(N) tiempo/espacio. Invariante: CSV numérico, coma y punto decimal. */
export function crearCSV(theta, phi, n = 512) {
  const e = estado(theta, phi);
  const muestra = muestrear(theta, phi, n);
  return [
    "# modelo=anillo-dos-modos-v1; u1=exp(-i*x)/sqrt(2*pi)",
    `# theta_rad=${e.theta}; phi_rad=${e.phi}; intervalos=${n}`,
    `# integral=${muestra.integral}; error_norma=${muestra.errorNorma}`,
    "x_rad,re_psi_rad^-1/2,im_psi_rad^-1/2,rho_rad^-1",
    ...muestra.filas.map(fila => [fila.x, fila.re, fila.im, fila.rho].join(",")),
  ].join("\n") + "\n";
}
