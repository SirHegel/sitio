/* Sala de geometría real: carga diferida, elecciones visibles y liberación.
   Tres recorridos de usuario, O(1) páginas/contextos y memoria de observación.
   Techos fijados antes de medir: 90 000 píxeles software, 30 cuadros/s y
   ≤12 000 esquinas por pasada. La puerta se verifica en entrada-cine. */
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
  const traza = { ancho, sinWebGL, errores, fase: "crear página" };
  let cierre;
  const cerrar = () => (cierre ||= contexto.close().catch(() => {}));
  const cancelar = () => { t.diagnostic(JSON.stringify(traza)); void cerrar(); };
  t.signal.addEventListener("abort", cancelar, { once: true });
  t.after(async () => { t.signal.removeEventListener("abort", cancelar); await cerrar(); });
  for (const nombre of ["goto", "click", "evaluate", "$eval", "waitForFunction"]) {
    const ejecutar = pagina[nombre].bind(pagina);
    pagina[nombre] = (...argumentos) => {
      traza.fase = `${nombre}: ${String(argumentos[0] ?? "").slice(0, 170)}`;
      return ejecutar(...argumentos);
    };
  }
  await pagina.setViewport({ width: ancho, height: ancho < 768 ? 844 : 900, isMobile: ancho < 768, hasTouch: ancho < 768 });
  await pagina.bringToFront();
  pagina.on("pageerror", (e) => errores.push(e.message));
  await pagina.setRequestInterception(true);
  pagina.on("request", (r) => /\/_vercel\/|\/api\/visita/.test(r.url()) || r.resourceType() === "media" ? r.abort() : r.continue());
  await pagina.evaluateOnNewDocument((sinWebGL) => {
    sessionStorage.setItem("jsar:entrada-v2", "1");
    window.__qaInterior = { instancias: [], bloqueos: [] };
    document.addEventListener("securitypolicyviolation", (e) => window.__qaInterior.bloqueos.push(e.violatedDirective));
    const registros = new WeakMap();
    const nombres = new WeakMap();
    const contextoOriginal = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (tipo, ...opciones) {
      if (sinWebGL && /webgl/i.test(tipo)) return null;
      const gl = contextoOriginal.call(this, tipo, ...opciones);
      if (gl && /webgl/i.test(tipo) && this.id === "sala-roja-lienzo" && !registros.has(gl)) {
        const registro = { dibujos: 0, descartados: 0, esquinas: 0, programas: 0, programasBorrados: 0, buffers: 0, buffersBorrados: 0, uniformes: {} };
        registros.set(gl, registro);
        window.__qaInterior.instancias.push(registro);
      }
      return gl;
    };
    const proto = WebGLRenderingContext.prototype;
    for (const [metodo, campo] of [["createBuffer", "buffers"], ["deleteBuffer", "buffersBorrados"], ["createProgram", "programas"], ["deleteProgram", "programasBorrados"]]) {
      const original = proto[metodo];
      proto[metodo] = function (...args) {
        const resultado = original.apply(this, args);
        const registro = registros.get(this);
        if (registro) registro[campo] += 1;
        return resultado;
      };
    }
    const ubicacion = proto.getUniformLocation;
    proto.getUniformLocation = function (programa, nombre) {
      const valor = ubicacion.call(this, programa, nombre);
      if (valor && registros.has(this)) nombres.set(valor, nombre);
      return valor;
    };
    const uniforme = proto.uniform1f;
    proto.uniform1f = function (ubicacion, valor) {
      const registro = registros.get(this);
      if (registro && nombres.has(ubicacion)) registro.uniformes[nombres.get(ubicacion)] = valor;
      return uniforme.call(this, ubicacion, valor);
    };
    for (const metodo of ["drawArrays", "drawElements"]) {
      const original = proto[metodo];
      proto[metodo] = function (...args) {
        const registro = registros.get(this);
        if (registro) {
          registro.dibujos += 1;
          registro.descartados += Number(!this.canvas.isConnected);
          registro.esquinas = Math.max(registro.esquinas, args[metodo === "drawElements" ? 1 : 2]);
        }
        return original.apply(this, args);
      };
    }
  }, sinWebGL);
  return { pagina, errores };
}

async function cargar(pagina) {
  await pagina.goto(origen + "/", { waitUntil: "networkidle2" });
  await pagina.waitForFunction(() => document.documentElement.classList.contains("js-cine") && !document.getElementById("puerta"));
  assert.ok(await pagina.$("#sala-roja"), "inicio publica la sección de sala interactiva");
}

async function verSala(pagina) {
  await pagina.$eval("#sala-roja", (e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
  await pagina.waitForFunction(() => document.getElementById("sala-roja").classList.contains("sala-roja-lista"));
  await pagina.waitForFunction(() => window.__qaInterior.instancias.at(-1)?.dibujos > 0);
}

// Ventana real de 350 ms: O(1) tiempo de observación y memoria.
async function medir(pagina) {
  return pagina.evaluate(async () => {
    const registro = window.__qaInterior.instancias.at(-1);
    const antes = registro.dibujos, inicio = performance.now();
    await new Promise((resolver) => setTimeout(resolver, 350));
    return { dibujos: registro.dibujos - antes, duracion: performance.now() - inicio };
  });
}

async function limpia(pagina, errores) {
  assert.deepEqual(errores, []);
  assert.deepEqual(await pagina.evaluate(() => window.__qaInterior.bloqueos), []);
  assert.ok(await pagina.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 2));
}

test("la sala se activa al entrar en pantalla y telón y lámpara responden con estado visible", { timeout: 20_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t);
  await cargar(pagina);
  assert.equal(await pagina.evaluate(() => window.__qaInterior.instancias.length), 0, "la sala fuera de vista todavía no solicita contexto gráfico");
  await verSala(pagina);
  assert.ok(await pagina.$eval("#sala-roja-lienzo", (e) => e.width * e.height <= 90_000), "SwiftShader conserva el presupuesto de píxeles");
  const muestra = await medir(pagina);
  assert.ok(muestra.dibujos > 0 && muestra.dibujos <= Math.ceil(muestra.duracion * 30 / 1000) + 2, "una pasada por cuadro respeta el techo de30fps");
  assert.ok(await pagina.evaluate(() => window.__qaInterior.instancias.at(-1).esquinas <= 12_000));
  for (const selector of ["#abrir-telon", "#luz-sala"]) {
    assert.equal(await pagina.$eval(selector, (e) => {
      const caja = e.getBoundingClientRect();
      return e.contains(document.elementFromPoint(caja.left + caja.width / 2, caja.top + caja.height / 2));
    }), true, `${selector} recibe el gesto sin que lo cubran controles flotantes`);
  }
  const apertura = await pagina.$eval("#abrir-telon", (e) => e.getAttribute("aria-pressed"));
  await pagina.click("#abrir-telon");
  assert.notEqual(await pagina.$eval("#abrir-telon", (e) => e.getAttribute("aria-pressed")), apertura);
  await pagina.waitForFunction(() => window.__qaInterior.instancias.at(-1).uniformes.apertura > .9);
  await pagina.focus("#luz-sala");
  await pagina.keyboard.press("Enter");
  assert.equal(await pagina.$eval("#luz-sala", (e) => e.getAttribute("aria-pressed")), "false");
  await pagina.waitForFunction(() => window.__qaInterior.instancias.at(-1).uniformes.lampara < .1);
  await limpia(pagina, errores);
});

test("la pausa congela la sala y la navegación libera la geometría antes de volver a montarla", { timeout: 25_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { ancho: 390 });
  await cargar(pagina);
  await verSala(pagina);
  await pagina.evaluate(() => { window.__qaLienzoAnterior = document.getElementById("sala-roja-lienzo"); window.__qaGLAnterior = window.__qaLienzoAnterior.getContext("webgl"); });
  const boton = await pagina.$eval("#abrir-telon", (e) => e.getBoundingClientRect().toJSON());
  await pagina.touchscreen.tap(boton.left + boton.width / 2, boton.top + boton.height / 2);
  assert.equal(await pagina.$eval("#abrir-telon", (e) => e.getAttribute("aria-pressed")), "true");
  await pagina.click("#pausar-escena");
  assert.equal((await medir(pagina)).dibujos, 0, "la pausa global congela la geometría");
  await pagina.click("#pausar-escena");
  assert.ok((await medir(pagina)).dibujos > 0);
  await pagina.evaluate(() => document.querySelector('nav.menu a[href="/blog/"]').click());
  await pagina.waitForFunction(() => document.body.dataset.ruta === "/blog/" && !document.documentElement.classList.contains("navegando"));
  const descartada = await pagina.evaluate(() => {
    const r = window.__qaInterior.instancias[0];
    return { conectada: window.__qaLienzoAnterior.isConnected, descartados: r.descartados,
      liberada: window.__qaGLAnterior.isContextLost() || (r.buffersBorrados >= r.buffers && r.programasBorrados >= r.programas) };
  });
  assert.deepEqual(descartada, { conectada: false, descartados: 0, liberada: true });
  const anterior = await pagina.evaluate(() => window.__qaInterior.instancias[0].dibujos);
  await pagina.evaluate(() => document.querySelector('nav.menu a[href="/"]').click());
  await pagina.waitForFunction(() => document.body.dataset.ruta === "/" && !document.documentElement.classList.contains("navegando"));
  await verSala(pagina);
  assert.equal(await pagina.evaluate(() => document.getElementById("sala-roja-lienzo") === window.__qaLienzoAnterior), false);
  assert.equal(await pagina.evaluate(() => window.__qaInterior.instancias.length), 2);
  assert.equal(await pagina.evaluate(() => window.__qaInterior.instancias[0].dibujos), anterior, "el canvas descartado nunca vuelve a dibujarse");
  await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await pagina.waitForFunction(() => document.getElementById("pausar-escena").disabled);
  assert.equal((await medir(pagina)).dibujos, 0, "movimiento reducido conserva una composición quieta");
  await limpia(pagina, errores);
});

test("sin WebGL la sala conserva una fotografía visible y no impide lectura ni navegación", { timeout: 15_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { ancho: 390, sinWebGL: true });
  await cargar(pagina);
  await pagina.$eval("#sala-roja", (e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
  await pagina.waitForFunction(() => {
    const imagen = document.querySelector("#sala-roja img");
    return imagen?.complete && imagen.naturalWidth > 0;
  });
  assert.equal(await pagina.$eval("#sala-roja", (e) => e.classList.contains("sala-roja-lista")), false);
  const respaldo = await pagina.$eval("#sala-roja", (seccion) => [seccion, ...seccion.querySelectorAll("*")].some((e) => {
    const estilo = getComputedStyle(e);
    return e.getBoundingClientRect().width > 0 && Number(estilo.opacity) > 0 && estilo.visibility !== "hidden"
      && (/url\(/.test(estilo.backgroundImage) || (e.tagName === "IMG" && e.complete && e.naturalWidth > 0));
  }));
  assert.equal(respaldo, true, "la ausencia de GPU conserva imagen fotográfica");
  assert.ok(await pagina.$eval("#sala-roja", (e) => e.textContent.trim().length > 0));
  await pagina.evaluate(() => document.querySelector('nav.menu a[href="/blog/"]').click());
  await pagina.waitForFunction(() => document.body.dataset.ruta === "/blog/" && !document.documentElement.classList.contains("navegando"));
  assert.ok(await pagina.$eval("main h1", (e) => e.textContent.trim().length > 0));
  await limpia(pagina, errores);
});
