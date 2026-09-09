import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { ejecutableChrome } from "./chrome.mjs";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const publico = resolve(raiz, "publico");
let navegador;
let servidor;
let origen;
const tipos = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".jpg": "image/jpeg" };

before(async () => {
  execFileSync(process.execPath, ["construir.js"], { cwd: raiz, stdio: "pipe" });
  servidor = createServer((peticion, respuesta) => {
    const ruta = new URL(peticion.url, "http://127.0.0.1").pathname;
    const archivo = resolve(publico, `.${ruta}${ruta.endsWith("/") ? "index.html" : ""}`);
    if (!archivo.startsWith(publico + sep) || !existsSync(archivo) || !statSync(archivo).isFile()) {
      respuesta.writeHead(404).end();
      return;
    }
    respuesta.writeHead(200, { "Content-Type": tipos[extname(archivo)] || "application/octet-stream" });
    createReadStream(archivo).pipe(respuesta);
  });
  await new Promise((resolver) => servidor.listen(0, "127.0.0.1", resolver));
  origen = `http://127.0.0.1:${servidor.address().port}`;
  navegador = await puppeteer.launch({ executablePath: ejecutableChrome(), headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
});

after(async () => {
  await navegador?.close();
  if (servidor) await new Promise((resolver) => servidor.close(resolver));
});

async function nuevaPagina(ancho = 390) {
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: ancho, height: ancho < 768 ? 844 : 900 });
  // Geometría y movimiento del contenido; la elección inicial tiene su batería.
  await pagina.evaluateOnNewDocument(() => sessionStorage.setItem("jsar:entrada-v2", "1"));
  await pagina.setRequestInterception(true);
  pagina.on("request", (peticion) => {
    if (peticion.url().includes("/_vercel/") || peticion.url().includes("/api/visita") || peticion.resourceType() === "media") peticion.abort();
    else peticion.continue();
  });
  return pagina;
}

async function cargar(pagina, ruta = "/") {
  await pagina.goto(origen + ruta, { waitUntil: "networkidle2" });
  await pagina.waitForFunction(() => document.documentElement.classList.contains("js-cine"));
}

async function terminarTransicion(pagina) {
  await pagina.waitForFunction(() => !document.documentElement.classList.contains("navegando"));
  await pagina.evaluate(async () => {
    await new Promise((resolver) => requestAnimationFrame(resolver));
    await Promise.all(document.getAnimations()
      .filter((animacion) => animacion.effect?.pseudoElement?.startsWith("::view-transition"))
      .map((animacion) => animacion.finished.catch(() => {})));
  });
}

test("la identidad y el proyecto principal aparecen en la primera pantalla de móvil y escritorio", { timeout: 30_000 }, async () => {
  for (const ancho of [320, 390, 1440]) {
    const pagina = await nuevaPagina(ancho);
    try {
      const errores = [];
      pagina.on("pageerror", (error) => errores.push(error.message));
      await cargar(pagina);
      await pagina.waitForFunction(() => !document.getElementById("puerta"));
      const geometria = await pagina.evaluate(() => {
        const nombre = document.querySelector("main h1").getBoundingClientRect();
        const accion = document.querySelector('.portada .acciones a[href="/proyectos/"]').getBoundingClientRect();
        const barra = document.querySelector(".barra").getBoundingClientRect();
        return { nombre: nombre.top, accion: accion.bottom, alto: innerHeight, barra: barra.height, overflow: document.documentElement.scrollWidth - innerWidth };
      });
      assert.ok(geometria.nombre >= geometria.barra, `nombre visible a ${ancho}px`);
      assert.ok(geometria.accion < geometria.alto, `CTA inicial queda bajo el pliegue a ${ancho}px`);
      assert.ok(geometria.overflow <= 2, `desbordamiento horizontal a ${ancho}px`);
      assert.deepEqual(errores, []);
    } finally { await pagina.close(); }
  }
});

test("el menú móvil se abre con teclado después de desplazarse y Escape devuelve el foco", { timeout: 20_000 }, async () => {
  const pagina = await nuevaPagina();
  try {
    await cargar(pagina);
    await pagina.evaluate(() => scrollTo(0, 500));
    await pagina.waitForFunction(() => document.querySelector(".barra.encogida"));
    await pagina.focus(".menu-mando");
    await pagina.keyboard.press("Enter");
    assert.equal(await pagina.$eval(".menu-mando", (e) => e.getAttribute("aria-expanded")), "true");
    assert.notEqual(await pagina.$eval("nav.menu", (e) => getComputedStyle(e).display), "none", "el menú encogido también debe abrirse");
    await pagina.keyboard.press("Tab");
    assert.equal(await pagina.evaluate(() => document.activeElement.closest("nav.menu")?.id), "menu-principal");
    await pagina.keyboard.press("Escape");
    assert.equal(await pagina.$eval(".menu-mando", (e) => e.getAttribute("aria-expanded")), "false");
    assert.equal(await pagina.evaluate(() => document.activeElement.classList.contains("menu-mando")), true);

    await pagina.keyboard.press("Enter");
    await pagina.click('nav.menu a[href="/blog/"]');
    await pagina.waitForFunction(() => document.body.dataset.ruta === "/blog/");
    await terminarTransicion(pagina);
    assert.equal(await pagina.$eval(".menu-mando", (e) => e.getAttribute("aria-expanded")), "false");
    await pagina.focus(".menu-mando");
    await pagina.keyboard.press("Enter");
    assert.notEqual(await pagina.$eval("nav.menu", (e) => getComputedStyle(e).display), "none", "el menú sustituido por navegación sigue funcionando");
  } finally { await pagina.close(); }
});

test("el mismo observatorio continúa al navegar y respeta pausa, recarga y movimiento reducido", { timeout: 30_000 }, async () => {
  const pagina = await nuevaPagina(1440);
  try {
    await cargar(pagina);
    await pagina.waitForFunction(() => ["webgl", "respaldo"].includes(document.body.dataset.motor));
    assert.equal(await pagina.$("#cambiar-escena"), null, "la navegación conserva una sala uniforme");
    await pagina.evaluate(() => { window.marcaContinuidad = document; window.observatorioContinuo = document.getElementById("observatorio"); });
    await pagina.click('nav.menu a[href="/blog/"]');
    await pagina.waitForFunction(() => document.body.dataset.ruta === "/blog/");
    await terminarTransicion(pagina);
    assert.equal(await pagina.evaluate(() => document === window.marcaContinuidad), true);
    assert.equal(await pagina.evaluate(() => document.getElementById("observatorio") === window.observatorioContinuo), true);

    await pagina.click("#pausar-escena");
    await pagina.waitForFunction(() => document.body.classList.contains("escena-pausada"));
    await pagina.evaluate(() => new Promise((resolver) => requestAnimationFrame(() => requestAnimationFrame(resolver))));
    const pausado = await pagina.$eval("#observatorio", (e) => Number(e.dataset.frames || 0));
    await pagina.evaluate(() => new Promise((resolver) => setTimeout(resolver, 200)));
    assert.equal(await pagina.$eval("#observatorio", (e) => Number(e.dataset.frames || 0)), pausado, "el motor no produce cuadros durante la pausa");
    await pagina.reload({ waitUntil: "networkidle2" });
    assert.equal(await pagina.$eval("#pausar-escena", (e) => e.getAttribute("aria-pressed")), "true", "la pausa se conserva tras recargar");
    await pagina.click("#pausar-escena");

    await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await pagina.waitForFunction(() => document.getElementById("pausar-escena").disabled);
    await pagina.evaluate(() => new Promise((resolver) => requestAnimationFrame(() => requestAnimationFrame(resolver))));
    const reducido = await pagina.$eval("#observatorio", (e) => Number(e.dataset.frames || 0));
    await pagina.evaluate(() => new Promise((resolver) => setTimeout(resolver, 200)));
    assert.equal(await pagina.$eval("#observatorio", (e) => Number(e.dataset.frames || 0)), reducido);
    await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await pagina.waitForFunction(() => !document.getElementById("pausar-escena").disabled);
    assert.equal(await pagina.$eval("#pausar-escena", (e) => e.getAttribute("aria-pressed")), "false");
  } finally { await pagina.close(); }
});

test("movimiento reducido inicial conserva una composición quieta y reanuda el mismo lienzo", { timeout: 25_000 }, async () => {
  const pagina = await nuevaPagina(1440);
  try {
    await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await cargar(pagina);
    await pagina.waitForFunction(() => ["webgl", "respaldo"].includes(document.body.dataset.motor));
    assert.equal(await pagina.$eval("#pausar-escena", (e) => e.disabled), true);
    await pagina.evaluate(() => { window.observatorioReducido = document.getElementById("observatorio"); });
    const antes = await pagina.$eval("#observatorio", (e) => Number(e.dataset.frames || 0));
    await pagina.evaluate(() => new Promise((resolver) => setTimeout(resolver, 200)));
    assert.equal(await pagina.$eval("#observatorio", (e) => Number(e.dataset.frames || 0)), antes);
    assert.ok(await pagina.$eval("main h1", (e) => e.textContent.trim().length > 0));
    await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await pagina.waitForFunction(() => !document.getElementById("pausar-escena").disabled);
    if (await pagina.$eval("body", (e) => e.dataset.motor === "webgl")) {
      await pagina.waitForFunction((anterior) => Number(document.getElementById("observatorio").dataset.frames) > anterior, {}, antes);
    }
    assert.equal(await pagina.evaluate(() => document.getElementById("observatorio") === window.observatorioReducido), true);
  } finally { await pagina.close(); }
});

test("sin JavaScript se pueden leer inicio y blog, usar navegación y omitir la entrada", { timeout: 15_000 }, async () => {
  const pagina = await nuevaPagina();
  try {
    await pagina.setJavaScriptEnabled(false);
    for (const ruta of ["/", "/blog/"]) {
      await pagina.goto(origen + ruta, { waitUntil: "networkidle2" });
      const estado = await pagina.evaluate(() => ({
        puerta: document.getElementById("puerta") ? getComputedStyle(document.getElementById("puerta")).display : "none",
        menu: getComputedStyle(document.querySelector("nav.menu")).display,
        nombre: document.querySelector("main h1").textContent.trim(),
        invisibles: [...document.querySelectorAll(".revelar, .retrato")].filter((e) => getComputedStyle(e).opacity === "0").length,
        controles: getComputedStyle(document.querySelector(".direccion-escena")).display,
      }));
      assert.equal(estado.puerta, "none");
      assert.notEqual(estado.menu, "none");
      assert.ok(estado.nombre.length > 0);
      assert.equal(estado.invisibles, 0);
      assert.equal(estado.controles, "none");
    }
  } finally { await pagina.close(); }
});
