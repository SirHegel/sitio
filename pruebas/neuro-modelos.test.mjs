import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { equilibrioVesicular, simularVesiculas, resolverIntervaloVesicular, resolverVesiculasRobusto,
  concentracionLimpieza, tiempoLimpieza, resolverLimpieza, simularLimpieza,
  analizarCircuito, resolverInhibicion, resolverCircuitoRobusto, simularCircuito,
  acotarLimpieza, predecirLimpiezaAcotada, estimarLimpiezaPuntual } from '../activos/modelos-neuro.js';
const cerca = (a, b, tol = 1e-10) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);

test('vesículas: conservación, solución estacionaria y cota de contracción exacta', () => {
  for (const u of [0, .1, .35, 1]) for (const deltaMs of [0, 1, 250, 1e5]) {
    const s = simularVesiculas({ u, deltaMs, tauMs: 800, r0: .4, pulsos: 100 });
    for (const p of s.serie) { cerca(p.rPre, p.rPost + p.liberacion); assert.ok(p.rPre >= 0 && p.rPre <= 1); }
    cerca(s.errorUltimo, s.cotaUltimo);
  }
  assert.equal(equilibrioVesicular({ u: 0, tauMs: 1, deltaMs: 0 }).rEstacionario, null);
});

test('vesículas: intervalo inverso mínimo y límites inalcanzables', () => {
  for (const u of [.1, .35, 1]) for (const fraccion of [.01, .5, .99]) {
    const objetivo = u * fraccion, s = resolverIntervaloVesicular({ u, tauMs: 800, objetivo });
    cerca(equilibrioVesicular({ u, tauMs: 800, deltaMs: s.deltaMinMs }).liberacionEstacionaria, objetivo);
    assert.ok(equilibrioVesicular({ u, tauMs: 800, deltaMs: s.deltaMinMs * .99 }).liberacionEstacionaria < objetivo);
  }
  assert.equal(resolverIntervaloVesicular({ u: .5, tauMs: 1, objetivo: .5 }).finito, false);
  assert.equal(resolverIntervaloVesicular({ u: 0, tauMs: 1, objetivo: 0 }).deltaMinMs, 0);
});

test('vesículas: esquina adversa protege todo el rectángulo, el punto medio incumple', () => {
  const s = resolverVesiculasRobusto({ uMin: .25, uMax: .45, tauMinMs: 600, tauMaxMs: 1000, objetivo: .2 });
  assert.ok(s.peorLiberacionNominal < .2);
  cerca(s.peorLiberacionCertificada, .2);
  for (let i = 0; i <= 20; i++) for (let j = 0; j <= 20; j++) {
    assert.ok(equilibrioVesicular({ u: .25 + .2 * i / 20, tauMs: 600 + 400 * j / 20, deltaMs: s.deltaMinMs }).liberacionEstacionaria >= .2 - 1e-12);
  }
});

test('depuración: solución integrada, positividad y derivada de la ODE', () => {
  const p = { c0: 2, km: .2, vmax: .002 };
  for (const tMs of [0, 1, 100, 500, 1500, 3000]) {
    const c = concentracionLimpieza({ ...p, tMs });
    cerca(p.c0 - c + p.km * Math.log(p.c0 / c), p.vmax * tMs);
    assert.ok(c > 0 && c <= p.c0);
    if (tMs > 0) {
      const dt = .001;
      const derivada = (concentracionLimpieza({ ...p, tMs: tMs + dt }) - concentracionLimpieza({ ...p, tMs: tMs - dt })) / (2 * dt);
      cerca(derivada, -p.vmax * c / (p.km + c), 1e-9);
    }
  }
  assert.equal(concentracionLimpieza({ ...p, vmax: 0, tMs: 1000 }), 2);
  assert.equal(concentracionLimpieza({ ...p, c0: 0, tMs: 1000 }), 0);
  const s = simularLimpieza(p).serie;
  assert.ok(s.every((p, j) => j === 0 || p.c <= s[j - 1].c));
});

test('depuración: capacidad mínima cumple el plazo y detecta cero asintótico', () => {
  const p = { c0: 2, km: .2, objetivo: .1, plazoMs: 800 }, s = resolverLimpieza(p);
  cerca(tiempoLimpieza({ ...p, vmax: s.vmaxMin }), 800);
  cerca(concentracionLimpieza({ ...p, vmax: s.vmaxMin, tMs: 800 }), .1);
  assert.ok(concentracionLimpieza({ ...p, vmax: .99 * s.vmaxMin, tMs: 800 }) > .1);
  assert.equal(resolverLimpieza({ ...p, objetivo: 0 }).finito, false);
  assert.equal(tiempoLimpieza({ ...p, vmax: 0 }), null);
  assert.equal(tiempoLimpieza({ ...p, objetivo: 2, vmax: 0 }), 0);
});

test('E/I: criterio de Hurwitz coincide con los autovalores y localiza ambas fronteras', () => {
  for (let w = 0; w <= 4; w += .2) for (let g = 0; g <= 3; g += .2) {
    const a = analizarCircuito({ w, g, h: 1.2, tauEMs: 20, tauIMs: 10 });
    if (Math.abs(a.maxReal) > 1e-12) assert.equal(a.estable, a.maxReal < 0);
    for (const l of a.autovalores) {
      cerca(l.re ** 2 - l.im ** 2 - a.traza * l.re + a.determinante, 0);
      cerca(2 * l.re * l.im - a.traza * l.im, 0);
    }
  }
  assert.equal(analizarCircuito({ w: 1, g: 0 }).estable, false);
  assert.equal(resolverInhibicion({ w: 3, h: 1, tauEMs: 20, tauIMs: 10 }).finito, false);
});

test('E/I: propagador exacto reproduce casos diagonal, Jordan y oscilatorio', () => {
  const s = simularCircuito({ w: 0, g: 0, h: 0, tauEMs: 20, tauIMs: 10, e0: 1, i0: 2, duracionMs: 100, muestras: 100 });
  for (const p of s.serie) { cerca(p.e, Math.exp(-p.tMs / 20)); cerca(p.i, 2 * Math.exp(-p.tMs / 10)); }
  const jordan = simularCircuito({ w: 0, g: 0, h: 1, tauEMs: 20, tauIMs: 20, e0: 1, i0: 0, duracionMs: 100 });
  for (const p of jordan.serie) { cerca(p.e, Math.exp(-p.tMs / 20)); cerca(p.i, p.tMs / 20 * Math.exp(-p.tMs / 20)); }
  // Validación independiente de la solución matricial mediante RK4, paso 0,01 ms.
  const params = { w: 1.5, g: 1, h: 1.2, tauEMs: 20, tauIMs: 10 };
  const f = (e, i) => [((params.w - 1) * e - params.g * i) / params.tauEMs, (params.h * e - i) / params.tauIMs];
  let e = 1, i = 0; const dt = .01;
  for (let n = 0; n < 10000; n++) {
    const a = f(e, i), b = f(e + dt * a[0] / 2, i + dt * a[1] / 2), c = f(e + dt * b[0] / 2, i + dt * b[1] / 2), d = f(e + dt * c[0], i + dt * c[1]);
    e += dt * (a[0] + 2 * b[0] + 2 * c[0] + d[0]) / 6; i += dt * (a[1] + 2 * b[1] + 2 * c[1] + d[1]) / 6;
  }
  const fin = simularCircuito({ ...params, duracionMs: 100 }).serie.at(-1);
  cerca(fin.e, e); cerca(fin.i, i);
});

test('E/I: diseño bajo incertidumbre incluye todas las esquinas y rechaza traza imposible', () => {
  const p = { wMin: 1.5, wMax: 1.9, hMin: .8, hMax: 1.3, tauEMinMs: 18, tauEMaxMs: 22, tauIMinMs: 8, tauIMaxMs: 12, margen: .2 };
  const s = resolverCircuitoRobusto(p);
  cerca(s.gMin, 1.375);
  for (const w of [p.wMin, p.wMax]) for (const h of [p.hMin, p.hMax]) for (const tauEMs of [18, 22]) for (const tauIMs of [8, 12]) {
    const a = analizarCircuito({ w, h, tauEMs, tauIMs, g: s.gMin }); assert.equal(a.estable, true); assert.ok(a.margenDeterminante >= .2 - 1e-12);
  }
  assert.equal(resolverCircuitoRobusto({ ...p, wMax: 2.6 }).finito, false);
});

test('polígono: equivalencia con restricciones observacionales sobre una malla independiente', () => {
  const c0 = 2, verdad = { km: .2, vmax: .002 };
  const mediciones = [100, 300, 500].map(tMs => { const c = concentracionLimpieza({ c0, ...verdad, tMs }); return { tMs, min: c - .01, max: c + .01 }; });
  const p = acotarLimpieza({ c0, mediciones }); assert.equal(p.vacio, false);
  assert.ok(p.rangoKm[0] <= verdad.km && p.rangoKm[1] >= verdad.km);
  assert.ok(p.rangoVmax[0] <= verdad.vmax && p.rangoVmax[1] >= verdad.vmax);
  const dentro = (km, vmax) => {
    let signo = 0;
    for (let j = 0; j < p.vertices.length; j++) {
      const a = p.vertices[j], b = p.vertices[(j + 1) % p.vertices.length];
      const cruz = (b.km - a.km) * (vmax - a.vmax) - (b.vmax - a.vmax) * (km - a.km);
      if (Math.abs(cruz) > 1e-15) { if (signo && Math.sign(cruz) !== signo) return false; signo = Math.sign(cruz); }
    } return true;
  };
  for (let k = 0; k <= 40; k++) for (let v = 0; v <= 40; v++) {
    const km = .05 + k * .01, vmax = .0015 + v * .000025;
    const factible = mediciones.every(m => { const c = concentracionLimpieza({ c0, km, vmax, tMs: m.tMs }); return c >= m.min && c <= m.max; });
    assert.equal(dentro(km, vmax), factible);
  }
  const cota = predecirLimpiezaAcotada({ c0, vertices: p.vertices, tMs: 800 });
  const real = concentracionLimpieza({ c0, ...verdad, tMs: 800 });
  assert.ok(cota.min <= real && real <= cota.max);
  // Todos los puntos de cada segmento entre vértices deben quedar dentro de la predicción.
  for (const a of p.vertices) for (const b of p.vertices) for (const f of [0, .25, .5, .75, 1]) {
    const c = concentracionLimpieza({ c0, km: a.km * f + b.km * (1 - f), vmax: a.vmax * f + b.vmax * (1 - f), tMs: 800 });
    assert.ok(c >= cota.min - 1e-10 && c <= cota.max + 1e-10);
  }
});

test('polígono: datos incompatibles, concentración cero e información adicional', () => {
  const c0 = 2;
  const a = acotarLimpieza({ c0, mediciones: [] });
  const b = acotarLimpieza({ c0, mediciones: [{ tMs: 100, min: 1.7, max: 1.9 }] });
  assert.ok(b.area <= a.area);
  assert.equal(acotarLimpieza({ c0, mediciones: [{ tMs: 100, min: 0, max: 0 }] }).vacio, true);
  assert.equal(acotarLimpieza({ c0, mediciones: [{ tMs: 100, min: 1.7, max: 1.8 }, { tMs: 100, min: 1.9, max: 2 }] }).vacio, true);
  assert.equal(acotarLimpieza({ c0, mediciones: [{ tMs: 100, min: 0, max: 2 }] }).vacio, false);
  const c = predecirLimpiezaAcotada({ c0, vertices: [], tMs: 100 }); assert.equal(c.vacio, true); assert.equal(c.min, null);
});

test('comparador puntual recupera parámetros sin ruido; rechaza singularidad', () => {
  const p = { c0: 2, km: .2, vmax: .002 };
  const mediciones = [100, 500].map(tMs => ({ tMs, c: concentracionLimpieza({ ...p, tMs }) }));
  const e = estimarLimpiezaPuntual({ c0: 2, mediciones }); cerca(e.km, .2); cerca(e.vmax, .002);
  assert.equal(estimarLimpiezaPuntual({ c0: 2, mediciones: [mediciones[0], mediciones[0]] }).singular, true);
});

test('dominios invalidan silencios de NaN, intervalos invertidos y tiempos negativos', () => {
  assert.throws(() => simularVesiculas({ u: 2 }), RangeError);
  assert.throws(() => simularVesiculas({ tauMs: 0 }), RangeError);
  assert.throws(() => concentracionLimpieza({ c0: 1, km: 0, vmax: 1, tMs: 1 }), RangeError);
  assert.throws(() => analizarCircuito({ tauEMs: 0 }), RangeError);
  assert.throws(() => resolverVesiculasRobusto({ uMin: .4, uMax: .2, tauMinMs: 1, tauMaxMs: 2, objetivo: .1 }), RangeError);
  assert.throws(() => acotarLimpieza({ c0: 2, mediciones: [{ tMs: -1, min: .1, max: 1 }] }), RangeError);
  assert.throws(() => acotarLimpieza({ c0: 2, mediciones: [{ tMs: 1, min: .1, max: 3 }] }), RangeError);
});

test('el informe publicado corresponde al código y protocolo actuales, sin omitir casos', async () => {
  const base = new URL('../', import.meta.url);
  const [fuente, protocolo, informe] = await Promise.all([
    readFile(new URL('activos/modelos-neuro.js', base), 'utf8'),
    readFile(new URL('docs/neuro-protocolo.json', base), 'utf8'),
    readFile(new URL('activos/resultados-neuro.json', base), 'utf8'),
  ]);
  const r = JSON.parse(informe), p = JSON.parse(protocolo);
  assert.equal(r.hashFuenteSHA256, createHash('sha256').update(fuente).digest('hex'));
  assert.equal(r.hashProtocoloSHA256, createHash('sha256').update(protocolo).digest('hex'));
  assert.equal(r.casos.length, p.casos); assert.equal(r.cumpleProtocolo, true);
  assert.equal(r.resumen.limpieza.parametrosContenidos, p.casos);
  for (const caso of r.casos) {
    assert.equal(caso.mediciones.length, p.tiemposMedicionMs.length);
    for (const m of caso.mediciones) {
      cerca(m.observado, m.verdadero + m.error);
      assert.ok(Math.abs(m.error) <= p.ruidoAbsolutoMicroM);
      cerca(m.verdadero, concentracionLimpieza({ c0: p.c0MicroM, ...caso.verdad, tMs: m.tMs }));
    }
    cerca(caso.verdadero, concentracionLimpieza({ c0: p.c0MicroM, ...caso.verdad, tMs: p.tiempoPrediccionMs }));
  }
});
