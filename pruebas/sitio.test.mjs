/* Pruebas del sitio. Se ejecutan con:  node --test pruebas/
   Cubren lo que se puede romper en silencio: la transcripción de Bach, la
   presencia del nombre en cada título, y que el sitemap no prometa páginas
   que no existen. */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

import { aFrecuencia, VOCES, PATRON } from "../activos/musica.js";
import { PERSONA, PROYECTOS } from "../datos.js";

/* ------------------------------------------------------------ la música */

test("la nota de referencia cae donde debe", () => {
  assert.equal(Math.round(aFrecuencia("A4")), 440);
  assert.equal(Math.round(aFrecuencia("C4") * 100) / 100, 261.63);
  assert.equal(Math.round(aFrecuencia("C3") * 100) / 100, 130.81);
});

test("las alteraciones suben y bajan un semitono", () => {
  assert.equal(Math.round(aFrecuencia("F#3") * 100) / 100, 185.00);
  assert.equal(aFrecuencia("Bb2").toFixed(4), aFrecuencia("A#2").toFixed(4));
});

test("el preludio tiene 35 compases de cinco voces", () => {
  assert.equal(VOCES.length, 35);
  for (const [i, compas] of VOCES.entries()) {
    assert.equal(compas.length, 5, `el compás ${i + 1} no tiene cinco voces`);
  }
});

test("las voces de cada compás van de grave a agudo", () => {
  for (const [i, compas] of VOCES.entries()) {
    for (let v = 1; v < compas.length; v++) {
      assert.ok(compas[v] > compas[v - 1], `compás ${i + 1}: la voz ${v + 1} no es más aguda que la anterior`);
    }
  }
});

test("empieza y termina en Do mayor", () => {
  const primero = VOCES[0].map((f) => Math.round(f * 100) / 100);
  assert.deepEqual(primero, [130.81, 164.81, 196.00, 261.63, 329.63]);  // Do3 Mi3 Sol3 Do4 Mi4
  const ultimo = VOCES[34].map((f) => Math.round(f * 100) / 100);
  assert.deepEqual(ultimo, [65.41, 130.81, 164.81, 196.00, 261.63]);    // Do2 Do3 Mi3 Sol3 Do4
});

test("la figura arpegiada cubre las cinco voces en ocho semicorcheas", () => {
  assert.equal(PATRON.length, 8);
  assert.deepEqual([...new Set(PATRON)].sort(), [0, 1, 2, 3, 4]);
});

/* -------------------------------------------------------------- el sitio */

const construido = (() => {
  execFileSync("node", ["construir.js"], { cwd: new URL("..", import.meta.url).pathname });
  return new URL("../publico/", import.meta.url).pathname;
})();

const rutas = ["/", "/academico/", "/proyectos/", "/trayectoria/",
  ...PROYECTOS.map((p) => `/proyectos/${p.slug}/`)];

test("cada ruta se escribe en disco", () => {
  for (const r of rutas) {
    assert.ok(existsSync(construido + r.slice(1) + "index.html"), `falta ${r}`);
  }
});

test("el nombre completo está en el título de todas las páginas", () => {
  // Es la razón de ser del sitio: si el nombre no está en el <title>, la
  // página no compite por la búsqueda del nombre.
  for (const r of rutas) {
    const html = readFileSync(construido + r.slice(1) + "index.html", "utf8");
    const titulo = html.match(/<title>([\s\S]*?)<\/title>/)[1];
    assert.ok(titulo.includes(PERSONA.nombre), `${r} → «${titulo}»`);
  }
});

test("cada página declara su canónico y no se duplica", () => {
  const vistos = new Set();
  for (const r of rutas) {
    const html = readFileSync(construido + r.slice(1) + "index.html", "utf8");
    const canon = html.match(/<link rel="canonical" href="([^"]+)"/)[1];
    assert.ok(canon.endsWith(r), `${r} apunta a ${canon}`);
    assert.ok(!vistos.has(canon), `canónico repetido: ${canon}`);
    vistos.add(canon);
  }
});

test("el JSON-LD es válido y siempre incluye la Persona", () => {
  for (const r of rutas) {
    const html = readFileSync(construido + r.slice(1) + "index.html", "utf8");
    const bruto = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
    const ld = JSON.parse(bruto);
    const tipos = ld["@graph"].map((n) => n["@type"]);
    assert.ok(tipos.includes("Person"), `${r} no declara Person`);
    const persona = ld["@graph"].find((n) => n["@type"] === "Person");
    assert.equal(persona.name, PERSONA.nombre);
    assert.ok(persona.sameAs.length >= 3, "sameAs debe enlazar los perfiles");
  }
});

test("el sitemap solo promete páginas que existen", () => {
  const mapa = readFileSync(construido + "sitemap.xml", "utf8");
  const locs = [...mapa.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(locs.length, rutas.length);
  for (const loc of locs) {
    const ruta = new URL(loc).pathname;
    assert.ok(existsSync(construido + ruta.slice(1) + "index.html"), `sitemap promete ${ruta}`);
  }
});
