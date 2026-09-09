/* Un observatorio persistente: geometría real, interacción y continuidad.
   O(R) tiempo para R destinos y O(1) contextos de navegador por recorrido.
   El contador de cuadros prueba pausa; los comandos GPU acreditan geometría. */
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
const csp = JSON.parse(readFileSync(resolve(raiz, "vercel.json"), "utf8")).headers.flatMap((r) => r.headers)
  .find((h) => h.key === "Content-Security-Policy").value;
const tipos = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".webp": "image/webp" };
let navegador;
let servidor;
let origen;

before(async () => {
  execFileSync(process.execPath, ["construir.js"], { cwd: raiz, stdio: "pipe" });
  servidor = createServer((peticion, respuesta) => {
    const ruta = new URL(peticion.url, "http://127.0.0.1").pathname;
    const archivo = resolve(publico, `.${ruta}${ruta.endsWith("/") ? "index.html" : ""}`);
    if (!archivo.startsWith(publico + sep) || !existsSync(archivo) || !statSync(archivo).isFile()) return respuesta.writeHead(404).end();
    respuesta.writeHead(200, { "Content-Type": tipos[extname(archivo)] || "application/octet-stream", "Content-Security-Policy": csp });
    createReadStream(archivo).pipe(respuesta);
  });
  await new Promise((resolver) => servidor.listen(0, "127.0.0.1", resolver));
  origen = `http://127.0.0.1:${servidor.address().port}`;
  navegador = await puppeteer.launch({ executablePath: ejecutableChrome(), headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
});

after(async () => {
  await navegador?.close();
  if (servidor) await new Promise((resolver) => servidor.close(resolver));
});

async function nuevaPagina(t, { ancho = 1440, sinWebGL = false } = {}) {
  const contexto = await navegador.createBrowserContext();
  const pagina = await contexto.newPage();
  const errores = [];
  let cierre;
  const cerrar = () => (cierre ||= contexto.close().catch(() => {}));
  const cancelar = () => { t.diagnostic(JSON.stringify({ ancho, sinWebGL, errores })); void cerrar(); };
  t.signal.addEventListener("abort", cancelar, { once: true });
  t.after(async () => { t.signal.removeEventListener("abort", cancelar); await cerrar(); });
  await pagina.setViewport({ width: ancho, height: ancho < 768 ? 844 : 900, isMobile: ancho < 768, hasTouch: ancho < 768 });
  await pagina.bringToFront();
  pagina.on("pageerror", (e) => errores.push(e.message));
  await pagina.setRequestInterception(true);
  pagina.on("request", (r) => /\/_vercel\/|\/api\/visita/.test(r.url()) || r.resourceType() === "media" ? r.abort() : r.continue());
  await pagina.evaluateOnNewDocument((sinWebGL) => {
    sessionStorage.setItem("jsar:entrada-v2", "1");
    window.__qaInterior = { contextos: 0, dibujos: 0, triangulos: 0, desconectados: 0, bloqueos: [] };
    document.addEventListener("securitypolicyviolation", (e) => window.__qaInterior.bloqueos.push(e.violatedDirective));
    const registros = new WeakSet();
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (tipo, ...opciones) {
      if (sinWebGL && /webgl/i.test(tipo)) return null;
      const gl = original.call(this, tipo, ...opciones);
      if (gl && /webgl/i.test(tipo) && this.id === "observatorio" && !registros.has(gl)) {
        registros.add(gl);
        window.__qaInterior.contextos += 1;
      }
      return gl;
    };
    for (const Tipo of [window.WebGLRenderingContext, window.WebGL2RenderingContext].filter(Boolean)) {
      for (const metodo of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
        const original = Tipo.prototype[metodo];
        if (!original) continue;
        Tipo.prototype[metodo] = function (...args) {
          if (this.canvas?.id === "observatorio") {
            const r = window.__qaInterior;
            r.dibujos += 1;
            r.desconectados += Number(!this.canvas.isConnected);
            if (args[0] === this.TRIANGLES) r.triangulos += Math.floor(args[metodo.includes("Elements") ? 1 : 2] / 3);
          }
          return original.apply(this, args);
        };
      }
    }
  }, sinWebGL);
  return { pagina, errores };
}

async function cargar(pagina) {
  await pagina.goto(origen + "/", { waitUntil: "networkidle2" });
  await pagina.waitForFunction(() => document.documentElement.classList.contains("js-cine") && !document.getElementById("puerta") && ["webgl", "respaldo"].includes(document.body.dataset.motor));
}

// Una ventana de 300 ms mide continuidad real sin fijar FPS de hardware ajeno.
async function medir(pagina) {
  return pagina.evaluate(async () => {
    const lienzo = document.getElementById("observatorio");
    const antes = Number(lienzo.dataset.frames || 0);
    await new Promise((resolver) => setTimeout(resolver, 300));
    return Number(lienzo.dataset.frames || 0) - antes;
  });
}

async function esperarMovimiento(pagina) {
  const antes = await pagina.$eval("#observatorio", (e) => Number(e.dataset.frames || 0));
  await pagina.waitForFunction((anterior) => Number(document.getElementById("observatorio").dataset.frames || 0) > anterior, { timeout: 8000 }, antes);
}

async function limpia(pagina, errores) {
  assert.deepEqual(errores, []);
  assert.deepEqual(await pagina.evaluate(() => window.__qaInterior.bloqueos), []);
  assert.ok(await pagina.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 2));
}

test("telón, lámpara y órbita responden con teclado sobre geometría real", { timeout: 30_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t);
  await cargar(pagina);
  assert.equal(await pagina.$eval("body", (e) => e.dataset.motor), "webgl");
  await pagina.waitForFunction(() => window.__qaInterior.triangulos > 0 && Number(document.getElementById("observatorio").dataset.frames) > 0);
  assert.equal(await pagina.evaluate(() => window.__qaInterior.contextos), 1);
  assert.equal(await pagina.$("#cambiar-escena, #sala-roja-lienzo"), null, "no hay escenarios ni contextos alternos");
  for (const accion of ["telon", "luz", "orbita"]) {
    const selector = `[data-accion-3d="${accion}"]`;
    await pagina.$eval(selector, (e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
    assert.equal(await pagina.$eval(selector, (e) => e.disabled), false);
    const inicial = await pagina.$eval(selector, (e) => e.getAttribute("aria-pressed"));
    assert.ok(["true", "false"].includes(inicial));
    await pagina.focus(selector);
    await pagina.keyboard.press("Enter");
    await pagina.waitForFunction(({ selector, inicial }) => document.querySelector(selector).getAttribute("aria-pressed") !== inicial, {}, { selector, inicial });
    await esperarMovimiento(pagina);
  }
  await limpia(pagina, errores);
});

test("el observatorio y su contexto permanecen en todos los destinos del menú", { timeout: 40_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { ancho: 390 });
  await cargar(pagina);
  await pagina.waitForFunction(() => Number(document.getElementById("observatorio").dataset.frames) > 0);
  await pagina.evaluate(() => { window.__qaCanvasInicial = document.getElementById("observatorio"); window.__qaDocumento = document; });
  const rutas = await pagina.$$eval('nav.menu a[href^="/"]', (enlaces) => [...new Set(enlaces.map((e) => e.pathname))]);
  assert.ok(rutas.includes("/ciencia/"), "el laboratorio forma parte de la navegación pública");
  for (const ruta of [...rutas.filter((r) => r !== "/"), "/"]) {
    await pagina.evaluate((destino) => document.querySelector(`nav.menu a[href="${destino}"]`).click(), ruta);
    await pagina.waitForFunction((destino) => document.body.dataset.ruta === destino && !document.documentElement.classList.contains("navegando"), {}, ruta);
    assert.deepEqual(await pagina.evaluate(() => ({
      canvas: document.getElementById("observatorio") === window.__qaCanvasInicial,
      conectado: window.__qaCanvasInicial.isConnected, documento: document === window.__qaDocumento,
      cantidad: document.querySelectorAll("#observatorio").length, contextos: window.__qaInterior.contextos,
      descartados: window.__qaInterior.desconectados,
    })), { canvas: true, conectado: true, documento: true, cantidad: 1, contextos: 1, descartados: 0 }, ruta);
    await esperarMovimiento(pagina);
    await limpia(pagina, errores);
  }
});

test("el gesto táctil actúa sobre la sala y la pausa conserva el cuadro al desplazarse", { timeout: 30_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { ancho: 390 });
  await cargar(pagina);
  const selector = '[data-accion-3d="telon"]';
  await pagina.$eval(selector, (e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
  const antes = await pagina.$eval(selector, (e) => e.getAttribute("aria-pressed"));
  const boton = await pagina.$eval(selector, (e) => {
    const caja = e.getBoundingClientRect();
    return { x: caja.left + caja.width / 2, y: caja.top + caja.height / 2, alto: caja.height };
  });
  assert.ok(boton.alto >= 44, "el control táctil tiene altura utilizable");
  await pagina.touchscreen.tap(boton.x, boton.y);
  assert.notEqual(await pagina.$eval(selector, (e) => e.getAttribute("aria-pressed")), antes);
  await pagina.click("#pausar-escena");
  await pagina.waitForFunction(() => document.body.classList.contains("escena-pausada"));
  await pagina.evaluate(() => new Promise((resolver) => requestAnimationFrame(() => requestAnimationFrame(resolver))));
  assert.equal(await medir(pagina), 0);
  await pagina.$eval(".pie", (e) => e.scrollIntoView({ block: "end", behavior: "instant" }));
  assert.equal(await medir(pagina), 0, "la pausa también congela la cámara durante el scroll");
  await pagina.click("#pausar-escena");
  await esperarMovimiento(pagina);
  await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await pagina.waitForFunction(() => document.getElementById("pausar-escena").disabled);
  await pagina.evaluate(() => new Promise((resolver) => requestAnimationFrame(() => requestAnimationFrame(resolver))));
  assert.equal(await medir(pagina), 0);
  await limpia(pagina, errores);
});

test("la calidad cambia la resolución del mismo canvas y respeta el viewport", { timeout: 25_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t);
  await cargar(pagina);
  assert.deepEqual(await pagina.$$eval("#calidad-3d option", (opciones) => opciones.map((e) => e.value)), ["auto", "alta", "ahorro"]);
  await pagina.evaluate(() => { window.__qaCanvasCalidad = document.getElementById("observatorio"); });
  await pagina.select("#calidad-3d", "alta");
  const alta = await pagina.$eval("#observatorio", (e) => ({ dpr: Number(e.dataset.dpr), pixeles: e.width * e.height }));
  await pagina.select("#calidad-3d", "ahorro");
  await pagina.waitForFunction((anterior) => document.getElementById("observatorio").width * document.getElementById("observatorio").height < anterior, {}, alta.pixeles);
  const ahorro = await pagina.$eval("#observatorio", (e) => ({ dpr: Number(e.dataset.dpr), pixeles: e.width * e.height }));
  assert.ok(ahorro.dpr > 0 && ahorro.dpr < alta.dpr);
  assert.ok(ahorro.pixeles > 0 && ahorro.pixeles < alta.pixeles);
  assert.equal(await pagina.evaluate(() => document.getElementById("observatorio") === window.__qaCanvasCalidad), true);
  assert.equal(await pagina.evaluate(() => window.__qaInterior.contextos), 1);
  await pagina.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await pagina.waitForFunction(() => Math.abs(document.getElementById("observatorio").getBoundingClientRect().width - innerWidth) <= 2);
  await limpia(pagina, errores);
});
