/* Entrada explícita: dos elecciones, cero reproducciones previas y salida
   en ≤3 s (sin animación con movimiento reducido). Cada caso usa O(1)
   contextos; la matriz geométrica cuesta O(A), A=13 anchos, y O(1) memoria.
   El doble de audio comprueba gesto/continuidad sin descargar el MP3. */
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
const csp = JSON.parse(readFileSync(resolve(raiz, "vercel.json"), "utf8")).headers
  .flatMap((regla) => regla.headers).find((cabecera) => cabecera.key === "Content-Security-Policy").value;
const tipos = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".webp": "image/webp" };
const botones = ["#entrar-con-musica", "#entrar-en-silencio"];
let navegador;
let servidor;
let origen;

before(async () => {
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
  navegador = await puppeteer.launch({ executablePath: ejecutableChrome(), headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
});

after(async () => {
  await navegador?.close();
  if (servidor) await new Promise((resolver) => servidor.close(resolver));
});

async function nuevaPagina(t, { ancho = 390, preferencia = "0", reducido = false, audio = "resuelve", sinJS = false } = {}) {
  const contexto = await navegador.createBrowserContext();
  const pagina = await contexto.newPage();
  const errores = [];
  const imagenes = [];
  const traza = { ancho, fase: "crear página", errores };
  let cierre;
  const cerrar = () => (cierre ||= contexto.close().catch(() => {}));
  const cancelar = () => { t.diagnostic(JSON.stringify(traza)); void cerrar(); };
  t.signal.addEventListener("abort", cancelar, { once: true });
  t.after(async () => { t.signal.removeEventListener("abort", cancelar); await cerrar(); });
  for (const nombre of ["goto", "click", "evaluate", "$eval", "waitForFunction", "reload"]) {
    const original = pagina[nombre].bind(pagina);
    pagina[nombre] = (...argumentos) => {
      traza.fase = `${nombre}: ${String(argumentos[0] ?? "").slice(0, 150)}`;
      return original(...argumentos);
    };
  }
  await pagina.setViewport({ width: ancho, height: ancho < 768 ? 844 : 900, isMobile: ancho < 768, hasTouch: ancho < 768 });
  await pagina.bringToFront();
  if (reducido) await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  pagina.on("pageerror", (error) => errores.push(error.message));
  await pagina.setRequestInterception(true);
  pagina.on("request", (peticion) => {
    if (peticion.resourceType() === "image") imagenes.push(peticion.url());
    if (peticion.resourceType() === "media" || /\/_vercel\/|\/api\/visita/.test(peticion.url())) peticion.abort();
    else peticion.continue();
  });
  await pagina.evaluateOnNewDocument(({ preferencia, audio }) => {
    if (!sessionStorage.getItem("qa:entrada-sembrada")) {
      localStorage.setItem("jsar:musica", preferencia);
      // La marca de la cortinilla antigua nunca sustituye una elección nueva.
      sessionStorage.setItem("jsar:entrado", "1");
      sessionStorage.setItem("qa:entrada-sembrada", "1");
    }
    window.__qaEntrada = { reproducciones: [], pausas: 0, bloqueos: [] };
    document.addEventListener("securitypolicyviolation", (evento) => window.__qaEntrada.bloqueos.push(evento.violatedDirective));
    let gesto = null;
    addEventListener("click", (evento) => { gesto = evento; }, true);
    const sonando = new WeakMap();
    Object.defineProperty(HTMLMediaElement.prototype, "paused", { configurable: true, get() { return !sonando.get(this); } });
    HTMLMediaElement.prototype.play = function () {
      window.__qaEntrada.reproducciones.push({
        confiable: Boolean(gesto?.isTrusted), dentroDelGesto: Boolean(gesto?.eventPhase),
        activacion: navigator.userActivation.isActive, destino: gesto?.target.closest?.("button")?.id || null,
      });
      if (audio === "bloqueado") return Promise.reject(new DOMException("Reproducción bloqueada por el navegador de prueba", "NotAllowedError"));
      if (audio === "pendiente") return new Promise(() => {});
      sonando.set(this, true);
      this.dispatchEvent(new Event("play"));
      this.dispatchEvent(new Event("playing"));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {
      window.__qaEntrada.pausas += 1;
      sonando.set(this, false);
      this.dispatchEvent(new Event("pause"));
    };
  }, { preferencia, audio });
  if (sinJS) await pagina.setJavaScriptEnabled(false);
  return { pagina, errores, cerrar, imagenes };
}

async function cargar(pagina) {
  await pagina.goto(origen + "/", { waitUntil: "networkidle2" });
  await pagina.waitForFunction(() => document.documentElement.classList.contains("js-cine"));
}

function puertaVisible() {
  const puerta = document.getElementById("puerta");
  return Boolean(puerta && !puerta.hidden && puerta.getClientRects().length && getComputedStyle(puerta).visibility !== "hidden");
}

async function comprobarDialogo(pagina) {
  assert.equal(await pagina.evaluate(puertaVisible), true, "la primera visita requiere una elección visible");
  assert.equal(await pagina.$$eval("#entrar-con-musica, #entrar-en-silencio", (elementos) => elementos.length), 2, "la puerta ofrece música y silencio");
  const dialogo = await pagina.$eval("#puerta", (e) => ({
    rol: e.getAttribute("role") || e.tagName.toLowerCase(), modal: e.matches(":modal") || e.getAttribute("aria-modal") === "true",
    nombre: e.getAttribute("aria-label") || (e.getAttribute("aria-labelledby") || "").split(/\s+/).map((id) => document.getElementById(id)?.textContent.trim() || "").join(" ").trim(),
  }));
  assert.equal(dialogo.rol, "dialog");
  assert.equal(dialogo.modal, true);
  assert.ok(dialogo.nombre, "el diálogo tiene nombre accesible");
}

async function esperarSalida(pagina) {
  await pagina.waitForFunction(() => {
    const puerta = document.getElementById("puerta");
    return !puerta || puerta.hidden || !puerta.getClientRects().length || getComputedStyle(puerta).visibility === "hidden";
  }, { timeout: 3000 });
  assert.equal(await pagina.evaluate(() => sessionStorage.getItem("jsar:entrada-v2")), "1");
}

async function comprobarSinErrores(pagina, errores) {
  assert.deepEqual(errores, []);
  assert.deepEqual(await pagina.evaluate(() => window.__qaEntrada.bloqueos), []);
}

test("la primera visita conserva dos elecciones y nunca reproduce antes de elegir, aun con preferencia antigua", { timeout: 15_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { preferencia: "1" });
  await cargar(pagina);
  await comprobarDialogo(pagina);
  await pagina.keyboard.press("Tab");
  await pagina.keyboard.press("Tab");
  await pagina.evaluate(() => new Promise((resolver) => setTimeout(resolver, 2200)));
  assert.equal(await pagina.evaluate(puertaVisible), true, "la entrada no desaparece por un temporizador");
  assert.equal(await pagina.evaluate(() => sessionStorage.getItem("jsar:entrada-v2")), null, "abrir la página no equivale a elegir");
  assert.deepEqual(await pagina.evaluate(() => window.__qaEntrada.reproducciones), [], "Tab y una preferencia previa no autorizan audio");
  await comprobarSinErrores(pagina, errores);
});

test("la elección silenciosa retiene el foco del diálogo, entra con teclado y se recuerda en la sesión", { timeout: 15_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { preferencia: "1" });
  await cargar(pagina);
  await comprobarDialogo(pagina);
  assert.equal(await pagina.evaluate(() => document.getElementById("puerta").contains(document.activeElement)), true, "el foco inicial entra al diálogo");
  for (const tecla of ["Tab", "Tab", "Tab", "Shift+Tab"]) {
    if (tecla === "Shift+Tab") { await pagina.keyboard.down("Shift"); await pagina.keyboard.press("Tab"); await pagina.keyboard.up("Shift"); }
    else await pagina.keyboard.press(tecla);
    assert.equal(await pagina.evaluate(() => document.getElementById("puerta").contains(document.activeElement)), true, "Tab permanece dentro de la elección modal");
  }
  await pagina.focus("#entrar-en-silencio");
  await pagina.keyboard.press("Enter");
  await esperarSalida(pagina);
  assert.equal(await pagina.evaluate(() => document.querySelector("main").contains(document.activeElement)), true, "la lectura recibe el foco al entrar");
  assert.equal(await pagina.evaluate(() => localStorage.getItem("jsar:musica")), "0");
  assert.deepEqual(await pagina.evaluate(() => window.__qaEntrada.reproducciones), []);
  await pagina.reload({ waitUntil: "networkidle2" });
  await pagina.waitForFunction(() => document.documentElement.classList.contains("js-cine"));
  assert.equal(await pagina.evaluate(puertaVisible), false, "una elección previa evita repetir la puerta al recargar");
  assert.deepEqual(await pagina.evaluate(() => window.__qaEntrada.reproducciones), []);
  await comprobarSinErrores(pagina, errores);
});

test("entrar con música llama play dentro del gesto y conserva el mismo audio al navegar", { timeout: 20_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { ancho: 1440 });
  await cargar(pagina);
  await comprobarDialogo(pagina);
  await pagina.waitForFunction(() => document.body.dataset.motor === "webgl" && Number(document.getElementById("observatorio").dataset.frames) > 0);
  await pagina.evaluate(() => { window.__qaCanvasEntrada = document.getElementById("observatorio"); });
  await pagina.click("#entrar-con-musica");
  const llamadas = await pagina.evaluate(() => window.__qaEntrada.reproducciones);
  assert.deepEqual(llamadas, [{ confiable: true, dentroDelGesto: true, activacion: true, destino: "entrar-con-musica" }], "play se solicita antes de abandonar el evento del usuario");
  await esperarSalida(pagina);
  await pagina.evaluate(() => { window.__qaAudioEntrada = document.querySelector("audio"); window.__qaDocumentoEntrada = document; window.__qaAudioEntrada.currentTime = 17.25; });
  for (const ruta of ["/blog/", "/proyectos/", "/ciencia/"]) {
    await pagina.evaluate((destino) => document.querySelector(`nav.menu a[href="${destino}"]`).click(), ruta);
    await pagina.waitForFunction((destino) => document.body.dataset.ruta === destino && !document.documentElement.classList.contains("navegando"), {}, ruta);
    assert.deepEqual(await pagina.evaluate(() => ({
      documento: document === window.__qaDocumentoEntrada, audio: document.querySelector("audio") === window.__qaAudioEntrada,
      cantidad: document.querySelectorAll("audio").length, segundo: window.__qaAudioEntrada.currentTime,
      llamadas: window.__qaEntrada.reproducciones.length, sonando: !window.__qaAudioEntrada.paused,
    })), { documento: true, audio: true, cantidad: 1, segundo: 17.25, llamadas: 1, sonando: true });
    assert.equal(await pagina.evaluate(puertaVisible), false);
    assert.equal(await pagina.evaluate(() => document.getElementById("observatorio") === window.__qaCanvasEntrada), true, "la sala de entrada continúa durante la lectura y navegación");
  }
  await comprobarSinErrores(pagina, errores);
});

test("Escape elige silencio sin activar una preferencia musical anterior", { timeout: 15_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { preferencia: "1" });
  await cargar(pagina);
  await comprobarDialogo(pagina);
  await pagina.keyboard.press("Escape");
  await esperarSalida(pagina);
  assert.equal(await pagina.evaluate(() => localStorage.getItem("jsar:musica")), "0");
  assert.deepEqual(await pagina.evaluate(() => window.__qaEntrada.reproducciones), []);
  assert.equal(await pagina.evaluate(() => document.querySelector("main").contains(document.activeElement)), true);
  await comprobarSinErrores(pagina, errores);
});

test("un play bloqueado o pendiente permite entrar y deja disponible el mando de música", { timeout: 20_000 }, async (t) => {
  for (const audio of ["bloqueado", "pendiente"]) {
    const { pagina, errores, cerrar } = await nuevaPagina(t, { audio });
    await cargar(pagina);
    await comprobarDialogo(pagina);
    await pagina.click("#entrar-con-musica");
    await esperarSalida(pagina);
    assert.equal(await pagina.evaluate(() => window.__qaEntrada.reproducciones.length), 1, "un intento no se duplica mientras la entrada termina");
    assert.equal(await pagina.$eval("#mando", (e) => e.disabled), false);
    assert.equal(await pagina.$eval("#mando", (e) => e.getAttribute("aria-pressed")), "false", "no se presenta como sonido activo un intento bloqueado");
    await comprobarSinErrores(pagina, errores);
    await cerrar();
  }
});

test("movimiento reducido conserva la elección estática y termina inmediatamente después de elegir", { timeout: 15_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { reducido: true });
  await cargar(pagina);
  await comprobarDialogo(pagina);
  assert.ok(await pagina.$eval("#puerta", (e) => e.getAnimations({ subtree: true }).every((a) => a.playState !== "running")), "la elección reducida no contiene animación activa");
  await pagina.click("#entrar-en-silencio");
  assert.equal(await pagina.evaluate(puertaVisible), false, "la preferencia reducida no espera la salida cinematográfica");
  await esperarSalida(pagina);
  await comprobarSinErrores(pagina, errores);
});

test("ambas elecciones caben sin desbordamiento ni recortes en trece anchos de 280 a 1440 px", { timeout: 20_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { reducido: true });
  await cargar(pagina);
  await comprobarDialogo(pagina);
  for (const ancho of [280, 320, 360, 390, 412, 430, 768, 960, 961, 1024, 1180, 1280, 1440]) {
    await pagina.setViewport({ width: ancho, height: ancho < 768 ? 844 : 900, isMobile: ancho < 768, hasTouch: ancho < 768 });
    await pagina.evaluate(async () => { await document.fonts.ready; await new Promise((resolver) => requestAnimationFrame(() => requestAnimationFrame(resolver))); });
    const geometria = await pagina.evaluate((selectores) => ({
      exceso: document.documentElement.scrollWidth - innerWidth,
      botones: selectores.map((selector) => {
        const e = document.querySelector(selector);
        const caja = e.getBoundingClientRect();
        const punto = document.elementFromPoint(caja.left + caja.width / 2, caja.top + caja.height / 2);
        return { visible: caja.left >= -2 && caja.right <= innerWidth + 2 && caja.top >= 0 && caja.bottom <= innerHeight,
          alto: caja.height, recibeGesto: e.contains(punto), texto: e.textContent.trim() };
      }),
    }), botones);
    assert.ok(geometria.exceso <= 2, `la puerta desborda a ${ancho}px`);
    assert.ok(geometria.botones.every((e) => e.visible && e.recibeGesto && e.alto >= 44 && e.texto), `ambas elecciones son visibles y utilizables a ${ancho}px: ${JSON.stringify(geometria)}`);
  }
  await comprobarSinErrores(pagina, errores);
});

test("sin JavaScript el contenido y la navegación permanecen accesibles sin elegir entrada", { timeout: 15_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { sinJS: true });
  await pagina.goto(origen + "/", { waitUntil: "networkidle2" });
  assert.equal(await pagina.evaluate(puertaVisible), false);
  const enlace = '.portada .acciones a[href="/proyectos/"]';
  await Promise.all([pagina.waitForNavigation({ waitUntil: "domcontentloaded" }), pagina.click(enlace)]);
  assert.equal(new URL(pagina.url()).pathname, "/proyectos/");
  assert.ok(await pagina.$eval("main h1", (e) => e.textContent.trim()));
  assert.deepEqual(errores, []);
});

test("el primer acceso modela su sala sin solicitar fotografías de portada o entrada", { timeout: 20_000 }, async (t) => {
  const { pagina, errores, imagenes } = await nuevaPagina(t, { ancho: 1440 });
  await cargar(pagina);
  await comprobarDialogo(pagina);
  await pagina.waitForFunction(() => document.body.dataset.motor === "webgl" && Number(document.getElementById("observatorio").dataset.frames) > 0);
  assert.equal(await pagina.$$eval("#puerta img, .portada img", (e) => e.length), 0);
  assert.deepEqual(imagenes.filter((url) => /\.(?:avif|webp|jpe?g|png)(?:[?#]|$)/i.test(url)), [], "la primera vista se renderiza sin descargar fondos raster");
  await comprobarSinErrores(pagina, errores);
});
