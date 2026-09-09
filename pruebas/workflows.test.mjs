/* Regresiones de la automatización que actualiza y publica el portafolio. */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const directorio = `${raiz}/.github/workflows`;

test("todo workflow instala dependencias antes de ejecutar las pruebas", () => {
  for (const archivo of readdirSync(directorio).filter((nombre) => /\.ya?ml$/i.test(nombre))) {
    const fuente = readFileSync(`${directorio}/${archivo}`, "utf8");
    const prueba = fuente.search(/npm test|node --test\b/);
    if (prueba < 0) continue;
    const instalacion = fuente.indexOf("npm ci");
    assert.ok(instalacion >= 0, `${archivo} ejecuta npm test sin npm ci`);
    assert.ok(instalacion < prueba, `${archivo} instala dependencias después de probar`);
  }
});

test("la sincronización regenera y publica el PDF que depende del inventario GitHub", () => {
  const fuente = readFileSync(`${directorio}/sincronizar-portafolio.yml`, "utf8");
  const sincronizacion = fuente.indexOf("run: node herramientas/sincronizar-github.js");
  const generar = fuente.indexOf("run: npm run cv");
  const verificar = fuente.indexOf("npm test");
  assert.ok(generar > sincronizacion && generar < verificar, "el PDF debe regenerarse entre la sincronización y las pruebas");
  const archivos = /archivos=\(([^)]+)\)/.exec(fuente)?.[1].split(/\s+/) || [];
  for (const ruta of [
    "datos-github.js",
    "documentos/hoja-de-vida/hoja-de-vida-jhon-steven-alvarez-ruiz.html",
    "documentos/hoja-de-vida/manifiesto.json",
    "activos/hoja-de-vida-jhon-steven-alvarez-ruiz.pdf",
  ]) assert.ok(archivos.includes(ruta), `el commit automático omite ${ruta}`);
  assert.ok(fuente.includes('git add -- "${archivos[@]}"'));
  assert.ok(fuente.includes('git status --porcelain=v1 -- "${archivos[@]}"'));
});
