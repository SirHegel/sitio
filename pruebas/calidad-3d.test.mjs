import test from 'node:test';
import assert from 'node:assert/strict';
import { limitarDpr, ajustarCalidadAutomatica } from '../activos/calidad-3d.js';

test('auto reduce la resolución software que el motor aplica aunque empiece por debajo de DPR 0.5', () => {
  const viewport = { width: 1440, height: 900, software: true };
  const initial = limitarDpr({ ...viewport, dpr: 1 });
  assert.ok(initial < 0.5);
  assert.equal(ajustarCalidadAutomatica(Array(23).fill(80), { dpr: initial, software: true }), null);
  const adjustment = ajustarCalidadAutomatica(Array(24).fill(80), { dpr: initial, software: true });
  const applied = limitarDpr({ ...viewport, dpr: adjustment.dpr });
  assert.equal(applied, adjustment.dpr, 'el motor no vuelve a subir el DPR adaptado a 0.5');
  assert.ok(applied < initial);
  assert.ok(Math.floor(viewport.width * applied) * Math.floor(viewport.height * applied)
    < Math.floor(viewport.width * initial) * Math.floor(viewport.height * initial));
});

test('los cuadros de 250 ms o más contribuyen al ajuste y una demora aislada queda acotada', () => {
  const options = { dpr: 0.5, software: true };
  const slow = ajustarCalidadAutomatica(Array(24).fill(500), options);
  assert.equal(slow.frameMs, 500);
  assert.ok(slow.dpr < options.dpr);
  const capped = ajustarCalidadAutomatica(Array(24).fill(10000), options);
  assert.equal(capped.frameMs, 1000);
});

test('software alcanza sus pisos de resolución sin elevar un presupuesto que ya esté por debajo', () => {
  for (const [mobile, minimum] of [[false, 0.2], [true, 0.45]]) {
    let dpr = 0.85;
    for (let i = 0; i < 20; i++) dpr = ajustarCalidadAutomatica(Array(24).fill(80), { dpr, software: true, mobile }).dpr;
    assert.equal(dpr, minimum);
    assert.equal(ajustarCalidadAutomatica(Array(24).fill(80), { dpr: 0.15, software: true, mobile }).dpr, 0.15);
  }
});

test('hardware conserva ventana, piso y máximo de calidad, y los cuadros rápidos no reducen resolución', () => {
  assert.equal(limitarDpr({ width: 1440, height: 900, dpr: 2, quality: 'alta' }), 2);
  assert.equal(ajustarCalidadAutomatica(Array(119).fill(33), { dpr: 1 }), null);
  assert.equal(ajustarCalidadAutomatica(Array(120).fill(33), { dpr: 1 }).dpr, 0.8);
  assert.equal(ajustarCalidadAutomatica(Array(120).fill(33), { dpr: 0.66 }).dpr, 0.65);
  assert.equal(ajustarCalidadAutomatica(Array(120).fill(16), { dpr: 1.5 }).dpr, 1.5);
});

test('las calidades software siguen siendo distintas y respetan su presupuesto a cualquier tamaño', () => {
  const qualities = [['ahorro', 140000], ['auto', 260000], ['alta', 350000]];
  const values = qualities.map(([quality]) => limitarDpr({ width: 1440, height: 900, dpr: 2, quality, software: true }));
  assert.ok(values[0] < values[1] && values[1] < values[2]);
  for (const [quality, budget] of qualities) for (const [width, height] of [[390, 844], [1440, 900], [16000, 9000]]) {
    const dpr = limitarDpr({ width, height, dpr: 2, quality, software: true });
    assert.ok(Math.floor(width * dpr) * Math.floor(height * dpr) <= budget);
  }
});
