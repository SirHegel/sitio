/* Política de resolución compartida por el controlador y el motor.
   DPR adimensional; duraciones en ms; presupuestos en píxeles de dibujo.
   Resolución O(1); evaluación O(N) y memoria O(N), N <= 120 muestras.
   Un ajuste automático nunca aumenta DPR ni excede el presupuesto software. */
export function limitarDpr({ width, height, dpr = 1, quality = 'auto', software = false }) {
  const requested = Math.min(2, Math.max(software ? 0.2 : 0.5, Number.isFinite(dpr) ? dpr : 1));
  if (!software) return requested;
  const mobile = width < 760;
  const tier = quality === 'alta'
    ? { pixels: 350000, desktop: 0.6, mobile: 1 }
    : quality === 'ahorro'
      ? { pixels: 140000, desktop: 0.35, mobile: 0.65 }
      : { pixels: 260000, desktop: 0.5, mobile: 0.85 };
  const budgetDpr = Math.sqrt(tier.pixels / (Math.max(1, width) * Math.max(1, height)));
  return Math.min(requested, mobile ? tier.mobile : tier.desktop, budgetDpr);
}

export function ajustarCalidadAutomatica(samples, { dpr, software = false, mobile = false }) {
  const count = software ? 24 : 120;
  if (samples.length < count) return null;
  // A stall remains evidence of overload. Capping at one second prevents an
  // isolated long task from dominating several adaptation windows.
  const valid = samples.slice(-count).filter((value) => Number.isFinite(value) && value > 0);
  if (valid.length < count) return null;
  const frameMs = valid.reduce((sum, value) => sum + Math.min(value, 1000), 0) / count;
  const minimum = software ? (mobile ? 0.45 : 0.2) : 0.65;
  const threshold = software ? 45 : 25;
  return {
    frameMs,
    dpr: frameMs > threshold && dpr > minimum ? Math.max(minimum, dpr * 0.8) : dpr,
  };
}
