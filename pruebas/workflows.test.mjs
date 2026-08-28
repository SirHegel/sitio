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
    const prueba = fuente.indexOf("npm test");
    if (prueba < 0) continue;
    const instalacion = fuente.indexOf("npm ci");
    assert.ok(instalacion >= 0, `${archivo} ejecuta npm test sin npm ci`);
    assert.ok(instalacion < prueba, `${archivo} instala dependencias después de probar`);
  }
});
