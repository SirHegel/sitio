import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import puppeteer from "puppeteer-core";
import { ejecutableChrome } from "./chrome.mjs";

const modulo = readFileSync(new URL("../activos/lectura-accesible.js", import.meta.url), "utf8");
const urlModulo = `data:text/javascript;base64,${Buffer.from(modulo).toString("base64")}`;
const axe = readFileSync(new URL("../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");

test("tablas y fórmulas anchas se recorren con teclado y recuperan su estado al ampliar la pantalla", { timeout: 30_000 }, async () => {
  const navegador = await puppeteer.launch({
    executablePath: ejecutableChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: 320, height: 700 });
    await pagina.setContent(`<!doctype html><html lang="es"><head><title>Lectura</title>
      <style>
        body { margin: 20px; } .prosa { max-width: 1000px; }
        table, pre { display: block; max-width: 100%; overflow-x: auto; }
        th, td { min-width: 150px; } pre { white-space: pre; }
      </style></head><body><main class="prosa">
      <table id="tabla"><caption>Balance por territorio</caption><thead><tr><th>Territorio</th><th>Área</th><th>Fuente</th></tr></thead>
      <tbody><tr><td>Crucitas</td><td>No estimable</td><td>Documento primario</td></tr></tbody></table>
      <pre id="formula">Δ = área real medida y validada − área legal certificada</pre>
      <pre id="corto">x = 0</pre>
      <pre id="autor" tabindex="0" role="region" aria-label="Modelo territorial">Una fórmula extensa con alcance declarado y unidad de medición</pre>
      </main></body></html>`);
    await pagina.addScriptTag({ content: axe });
    const contarFallos = () => pagina.evaluate(async () => {
      const resultado = await axe.run({ runOnly: { type: "rule", values: ["scrollable-region-focusable"] } });
      return resultado.violations.flatMap((v) => v.nodes.map((n) => n.target[0]));
    });
    assert.deepEqual((await contarFallos()).sort(), ["#formula", "#tabla"]);

    await pagina.evaluate(async (url) => {
      window.lectura = await import(url);
      window.lectura.iniciarLecturaAccesible();
    }, urlModulo);
    assert.deepEqual(await contarFallos(), []);
    assert.equal(await pagina.$eval("#corto", (e) => e.hasAttribute("tabindex")), false);
    assert.equal(await pagina.$eval("#tabla", (e) => e.hasAttribute("role")), false, "la tabla conserva su rol nativo");
    assert.equal(await pagina.$eval("#tabla", (e) => e.hasAttribute("aria-label")), false, "el caption conserva el nombre de la tabla");

    await pagina.focus("#formula");
    await pagina.keyboard.press("ArrowRight");
    await pagina.waitForFunction(() => document.getElementById("formula").scrollLeft > 0);

    await pagina.setViewport({ width: 1200, height: 700 });
    await pagina.waitForFunction(() => !document.getElementById("formula").hasAttribute("tabindex"));
    assert.equal(await pagina.$eval("#tabla", (e) => e.hasAttribute("tabindex")), false);
    assert.deepEqual(await pagina.$eval("#autor", (e) => [e.getAttribute("tabindex"), e.getAttribute("role"), e.getAttribute("aria-label")]), ["0", "region", "Modelo territorial"]);

    await pagina.evaluate(() => {
      document.querySelector("main").innerHTML = '<pre id="nuevo">Un bloque muy largo que llega después de una navegación interna y requiere desplazamiento horizontal.</pre>';
      window.lectura.iniciarLecturaAccesible();
      window.lectura.iniciarLecturaAccesible();
    });
    await pagina.setViewport({ width: 320, height: 700 });
    await pagina.waitForFunction(() => document.getElementById("nuevo").tabIndex === 0);
    assert.deepEqual(await contarFallos(), []);
  } finally {
    await navegador.close();
  }
});
