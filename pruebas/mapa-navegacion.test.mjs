import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { ejecutableChrome } from "./chrome.mjs";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const publico = resolve(raiz, "publico");
const csp = JSON.parse(readFileSync(resolve(raiz, "vercel.json"), "utf8"))
  .headers.flatMap((regla) => regla.headers)
  .find((cabecera) => cabecera.key === "Content-Security-Policy").value;
const tipos = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".geojson": "application/geo+json", ".webp": "image/webp" };
let navegador;
let servidor;
let origen;

before(async () => {
  execFileSync(process.execPath, ["herramientas/construir-mapa-oro.js"], { cwd: raiz, stdio: "pipe" });
  execFileSync(process.execPath, ["construir.js"], { cwd: raiz, stdio: "pipe" });
  servidor = createServer((peticion, respuesta) => {
    const ruta = new URL(peticion.url, "http://127.0.0.1").pathname;
    const archivo = resolve(publico, `.${ruta}${ruta.endsWith("/") ? "index.html" : ""}`);
    if (!archivo.startsWith(publico + sep) || !existsSync(archivo) || !statSync(archivo).isFile()) {
      respuesta.writeHead(404).end();
      return;
    }
    respuesta.writeHead(200, { "Content-Type": tipos[extname(archivo)] || "application/octet-stream", "Content-Security-Policy": csp });
    createReadStream(archivo).pipe(respuesta);
  });
  await new Promise((resolver) => servidor.listen(0, "127.0.0.1", resolver));
  origen = `http://127.0.0.1:${servidor.address().port}`;
  navegador = await puppeteer.launch({
    executablePath: ejecutableChrome(), headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader"],
  });
});

after(async () => {
  await navegador?.close();
  if (servidor) await new Promise((resolver) => servidor.close(resolver));
});

async function nuevaPagina(demoraPaquete = 0) {
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: 1280, height: 900 });
  await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  const solicitudes = [];
  const errores = [];
  pagina.on("pageerror", (error) => errores.push(error.message));
  await pagina.setRequestInterception(true);
  pagina.on("request", async (peticion) => {
    solicitudes.push(peticion.url());
    if (/\/_vercel\/|\/api\/visita|tile\.openstreetmap\.org/.test(peticion.url()) || peticion.resourceType() === "media") {
      await peticion.abort();
      return;
    }
    if (demoraPaquete && new URL(peticion.url()).pathname === "/activos/mapa-oro.js") {
      await new Promise((resolver) => setTimeout(resolver, demoraPaquete));
    }
    if (!peticion.isInterceptResolutionHandled()) await peticion.continue();
  });
  await pagina.evaluateOnNewDocument(() => {
    window.__qaMapas = { bloqueos: [] };
    addEventListener("securitypolicyviolation", (evento) => {
      window.__qaMapas.bloqueos.push({ directiva: evento.violatedDirective, uri: evento.blockedURI });
    });
  });
  return { pagina, solicitudes, errores };
}

async function esperarRuta(pagina, ruta) {
  await pagina.waitForFunction((esperada) => document.body.dataset.ruta === esperada
    && !document.documentElement.classList.contains("navegando"), {}, ruta);
}

const selectorMapa = '[data-mapa-oro][data-vista="territorio"]';
const contarPaquetes = (solicitudes) => solicitudes.filter((url) => new URL(url).pathname === "/activos/mapa-oro.js").length;

test("blog → artículo monta el mapa diferido, lo libera al salir y lo recupera al volver", { timeout: 35_000 }, async () => {
  const { pagina, solicitudes, errores } = await nuevaPagina();
  try {
    await pagina.goto(origen + "/blog/", { waitUntil: "networkidle2" });
    assert.equal(contarPaquetes(solicitudes), 0, "el blog no descarga el motor cartográfico");
    await pagina.evaluate(() => { window.__qaDocumentoMapa = document; window.__qaAudioMapa = document.querySelector("audio"); });
    await pagina.click('main a[href="/blog/oro-perimetros/"]');
    await esperarRuta(pagina, "/blog/oro-perimetros/");
    await pagina.$eval(selectorMapa, (nodo) => nodo.scrollIntoView({ behavior: "instant", block: "start" }));
    await pagina.waitForSelector(`${selectorMapa} .mapa-oro-app`, { timeout: 8_000 });
    await pagina.waitForFunction(() => document.querySelector('[data-vista="territorio"] .mapa-oro-lienzo')?.dataset.mapState === "ready", { timeout: 12_000 });
    assert.equal(await pagina.evaluate(() => document === window.__qaDocumentoMapa), true);
    assert.equal(await pagina.evaluate(() => document.querySelector("audio") === window.__qaAudioMapa), true);
    assert.equal(contarPaquetes(solicitudes), 1);
    await pagina.evaluate(() => {
      window.__qaMapaAnterior = document.querySelector('[data-mapa-oro][data-vista="territorio"]');
      dispatchEvent(new CustomEvent("sitio:navegacion"));
      dispatchEvent(new CustomEvent("sitio:navegacion"));
    });
    assert.equal(await pagina.$$eval(`${selectorMapa} .mapa-oro-app`, (nodos) => nodos.length), 1, "reinicializar no duplica raíces");
    await pagina.click('nav.menu a[href="/blog/"]');
    await esperarRuta(pagina, "/blog/");
    assert.equal(await pagina.evaluate(() => window.__qaMapaAnterior.childElementCount), 0, "salir desmonta React y libera el contexto MapLibre");
    assert.equal(await pagina.evaluate(() => window.__qaMapaAnterior.dataset.montado), undefined);
    await pagina.click('main a[href="/blog/oro-perimetros/"]');
    await esperarRuta(pagina, "/blog/oro-perimetros/");
    await pagina.$eval(selectorMapa, (nodo) => nodo.scrollIntoView({ behavior: "instant", block: "start" }));
    await pagina.waitForFunction(() => document.querySelector('[data-vista="territorio"] .mapa-oro-lienzo')?.dataset.mapState === "ready", { timeout: 12_000 });
    assert.equal(contarPaquetes(solicitudes), 1, "volver reutiliza el módulo descargado");
    assert.equal(await pagina.$$eval('link[data-estilo-mapa-oro]', (nodos) => nodos.length), 1);
    assert.deepEqual(await pagina.evaluate(() => window.__qaMapas.bloqueos), []);
    assert.deepEqual(errores, []);
  } finally { await pagina.close(); }
});

test("abandonar el artículo durante la descarga no monta un mapa en el documento descartado", { timeout: 25_000 }, async () => {
  const { pagina, errores } = await nuevaPagina(500);
  try {
    await pagina.goto(origen + "/blog/", { waitUntil: "networkidle2" });
    await pagina.click('main a[href="/blog/oro-perimetros/"]');
    await esperarRuta(pagina, "/blog/oro-perimetros/");
    const descarga = pagina.waitForRequest((peticion) => new URL(peticion.url()).pathname === "/activos/mapa-oro.js");
    await pagina.$eval(selectorMapa, (nodo) => { window.__qaMapaDescartado = nodo; nodo.scrollIntoView({ behavior: "instant", block: "start" }); });
    await descarga;
    const paqueteListo = pagina.waitForResponse((respuesta) => new URL(respuesta.url()).pathname === "/activos/mapa-oro.js");
    await pagina.click('nav.menu a[href="/blog/"]');
    await esperarRuta(pagina, "/blog/");
    await paqueteListo;
    await pagina.evaluate(() => new Promise((resolver) => setTimeout(resolver, 150)));
    assert.equal(await pagina.evaluate(() => window.__qaMapaDescartado.isConnected), false);
    assert.equal(await pagina.evaluate(() => window.__qaMapaDescartado.dataset.montado), undefined);
    assert.equal(await pagina.evaluate(() => window.__qaMapaDescartado.querySelector(".mapa-oro-app")), null);
    assert.deepEqual(errores, []);
  } finally { await pagina.close(); }
});
