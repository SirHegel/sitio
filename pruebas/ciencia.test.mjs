import test from "node:test";
import assert from "node:assert/strict";
import { TAU, TOLERANCIA, estado, amplitud, densidad, resolverInverso, muestrear, reconstruir, crearCSV, envolver } from "../activos/modelo-ciencia.js";

const cerca = (actual, esperado, tolerancia = 1e-12) => assert.ok(Math.abs(actual - esperado) <= tolerancia, `${actual} ≠ ${esperado}`);

test("estados conocidos: polos uniformes, ecuador con nodo y vector Bloch unitario", () => {
  for (const theta of [0, Math.PI / 2, Math.PI]) {
    const e = estado(theta, Math.PI / 4);
    cerca(e.p0 + e.p1, 1);
    cerca(e.bloch.reduce((s, n) => s + n * n, 0), 1);
  }
  cerca(estado(0, 0).p1, 0);
  cerca(estado(Math.PI, 0).p1, 1);
  for (const x of [0, 1, Math.PI, TAU]) {
    cerca(densidad(x, 0, .7), 1 / TAU);
    cerca(densidad(x, Math.PI, .7), 1 / TAU);
  }
  cerca(densidad(Math.PI, Math.PI / 2, 0), 0);
  cerca(densidad(0, Math.PI / 2, 0), 1 / Math.PI);
});

test("conservación y equivalencia de amplitud compleja en una malla de estados", () => {
  for (let i = 0; i <= 12; i++) for (let j = 0; j < 11; j++) {
    const theta = i * Math.PI / 12, phi = j * TAU / 11;
    const muestra = muestrear(theta, phi);
    assert.ok(muestra.errorNorma <= TOLERANCIA);
    assert.ok(muestra.errorAmplitud <= TOLERANCIA);
    assert.ok(muestra.filas.every(f => f.rho >= 0));
    const psi = amplitud(.317, theta, phi);
    cerca(psi.re * psi.re + psi.im * psi.im, densidad(.317, theta, phi));
    cerca(densidad(.317, theta, phi + TAU), densidad(.317, theta, phi));
  }
});

test("inverso construye contraste y máximo, incluyendo los casos degenerados", () => {
  for (const c of [0, .01, .3, .8, .999, 1]) for (const phi of [0, .317, Math.PI, TAU]) {
    const s = resolverInverso(c, phi);
    const max = densidad(s.phi, s.theta, s.phi), min = densidad(s.phi + Math.PI, s.theta, s.phi);
    cerca((max - min) / (max + min), c);
    assert.ok(muestrear(s.theta, s.phi, 64).filas.every(f => f.rho <= max + TOLERANCIA));
    assert.equal(s.faseIdentificable, c > 0);
    assert.equal(s.ramasDistintas, c < 1);
  }
});

test("la densidad no identifica la rama; una población modal sí", () => {
  const theta = Math.asin(.8), gemelo = Math.PI - theta, phi = 1.31;
  const a = muestrear(theta, phi), b = muestrear(gemelo, phi);
  for (let i = 0; i < a.filas.length; i++) cerca(a.filas[i].rho, b.filas[i].rho);
  cerca(estado(theta, phi).p1, .2);
  cerca(estado(gemelo, phi).p1, .8);
  cerca(estado(theta, phi).p1 + estado(gemelo, phi).p1, 1);
  cerca(Math.acos(1 - 2 * estado(theta, phi).p1), theta);
  cerca(Math.acos(1 - 2 * estado(gemelo, phi).p1), gemelo);
});

test("reconstrucción por momentos recupera contraste y fase de las muestras", () => {
  for (const theta of [.1, .7, 1.2, 2.3, 3]) for (const phi of [.1, 1.7, 4, 6.2]) {
    const r = reconstruir(muestrear(theta, phi, 256).filas);
    cerca(r.contraste, Math.sin(theta));
    cerca(r.phi, phi);
    cerca(r.masa, 1);
    cerca(r.theta, Math.min(theta, Math.PI - theta));
  }
  assert.equal(reconstruir(muestrear(0, 1).filas).phi, null);
});

test("exportación reproduce estado, extremos y 513 filas numéricas", () => {
  const csv = crearCSV(.7, -.4);
  const lineas = csv.trim().split("\n");
  assert.equal(lineas.length, 517);
  assert.match(lineas[1], /theta_rad=0.7/);
  const filas = lineas.slice(4).map(linea => linea.split(",").map(Number));
  assert.equal(filas.length, 513);
  cerca(filas[0][0], 0); cerca(filas.at(-1)[0], TAU);
  for (const [x, re, im, rho] of filas) {
    assert.ok([x, re, im, rho].every(Number.isFinite));
    cerca(re * re + im * im, rho);
  }
});

test("el modelo rechaza valores fuera de dominio en vez de producir NaN", () => {
  for (const n of [NaN, Infinity, -Infinity]) {
    assert.throws(() => estado(n, 0), RangeError);
    assert.throws(() => estado(0, n), RangeError);
    assert.throws(() => densidad(n, 0, 0), RangeError);
    assert.throws(() => resolverInverso(n, 0), RangeError);
  }
  assert.throws(() => estado(-.1, 0), RangeError);
  assert.throws(() => estado(Math.PI + .1, 0), RangeError);
  assert.throws(() => resolverInverso(1.001, 0), RangeError);
  assert.throws(() => muestrear(0, 0, 2), RangeError);
  assert.throws(() => muestrear(0, 0, 3.5), RangeError);
  assert.throws(() => reconstruir([]), RangeError);
  cerca(envolver(-.4), TAU - .4);
});
