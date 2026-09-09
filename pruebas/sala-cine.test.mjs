/* Pruebas de contrato de la sala: controles utilizables, mismo origen y
   degradación progresiva. Cada comprobación de navegador usa O(1) páginas;
   la auditoría de solicitudes usa O(R) tiempo y O(R) espacio, R = recursos. */
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
const configuracion = JSON.parse(readFileSync(resolve(raiz, "vercel.json"), "utf8"));
const csp = configuracion.headers.flatMap((regla) => regla.headers)
  .find((cabecera) => cabecera.key === "Content-Security-Policy").value;
const tipos = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".webp": "image/webp" };
let navegador;
let servidor;
let origen;
const seguimiento = new WeakMap();
let versionChrome;

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
  navegador = await puppeteer.launch({
    executablePath: ejecutableChrome(), headless: true, defaultViewport: null,
    // Backend idéntico en equipos locales y CI sin GPU física:
    // https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/swiftshader.md
    // Tipos de puntero/hover declarados por Chromium (fine=4, hover=2):
    // https://chromium.googlesource.com/chromium/src/+/HEAD/ui/base/pointer/pointer_device.h
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
      "--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4"],
  });
  versionChrome = await navegador.version();
});

after(async () => {
  await navegador?.close();
  if (servidor) await new Promise((resolver) => servidor.close(resolver));
});

async function nuevaPagina(t, { ancho = 390, sinWebGL = false, sinTransicionNativa = false, retenerBlog = false } = {}) {
  const pagina = await navegador.newPage();
  const traza = { ancho, chrome: versionChrome, fase: "crear página", estado: null };
  seguimiento.set(pagina, traza);
  const cerrar = () => pagina.isClosed() ? Promise.resolve() : pagina.close().catch(() => {});
  const cancelar = () => { t.diagnostic(`Página cancelada: ${JSON.stringify(traza)}`); void cerrar(); };
  t.signal.addEventListener("abort", cancelar, { once: true });
  t.after(async () => {
    t.signal.removeEventListener("abort", cancelar);
    await cerrar();
  });
  for (const nombre of ["goto", "click", "waitForFunction", "reload", "goBack", "evaluate", "$eval", "$$eval", "emulateMediaFeatures"]) {
    const ejecutar = pagina[nombre].bind(pagina);
    pagina[nombre] = (...argumentos) => {
      traza.fase = `${nombre}: ${String(argumentos[0] ?? "").slice(0, 180)}`;
      return ejecutar(...argumentos);
    };
  }
  await pagina.bringToFront();
  // setViewport también cambia la emulación táctil y borra las capacidades
  // del ratón en Chrome headless. CDP conserva aquí tanto CSS como matchMedia.
  const sesionViewport = await pagina.createCDPSession();
  await sesionViewport.send("Emulation.setDeviceMetricsOverride", {
    width: ancho, height: ancho < 768 ? 844 : 900,
    deviceScaleFactor: ancho < 768 ? 2 : 1, mobile: false,
  });
  // Diagnóstico reproducible para cualquier caso: CINE_QA_CPU=4.
  if (process.env.CINE_QA_CPU === "4") await sesionViewport.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const solicitudes = [];
  const errores = [];
  traza.errores = errores;
  let confirmarBlog;
  let liberarBlog;
  const blogRetenido = new Promise((resolver) => { confirmarBlog = resolver; });
  const permisoBlog = new Promise((resolver) => { liberarBlog = resolver; });
  pagina.on("pageerror", (error) => errores.push(error.message));
  await pagina.setRequestInterception(true);
  pagina.on("request", async (peticion) => {
    solicitudes.push(peticion.url());
    if (peticion.url().includes("/_vercel/") || peticion.url().includes("/api/visita") || peticion.resourceType() === "media") {
      await peticion.abort();
      return;
    }
    if (retenerBlog && peticion.resourceType() === "fetch" && new URL(peticion.url()).pathname === "/blog/") {
      confirmarBlog();
      await permisoBlog;
    }
    if (!peticion.isInterceptResolutionHandled() && !peticion.failure()) await peticion.continue();
  });
  await pagina.evaluateOnNewDocument(({ sinWebGL, sinTransicionNativa }) => {
    // Esta batería recorre el contenido; entrada-cine prueba la primera visita.
    sessionStorage.setItem("jsar:entrada-v2", "1");
    window.__qaSala = { dibujados: 0, bloqueos: [], navegaciones: [] };
    document.addEventListener("securitypolicyviolation", (evento) => {
      window.__qaSala.bloqueos.push({ directiva: evento.violatedDirective, uri: evento.blockedURI });
    });
    addEventListener("sitio:navegacion", () => window.__qaSala.navegaciones.push(location.pathname));
    if (sinTransicionNativa) Object.defineProperty(document, "startViewTransition", { value: undefined, configurable: true });
    if (sinWebGL) {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (tipo, ...opciones) {
        return /webgl/i.test(tipo) ? null : original.call(this, tipo, ...opciones);
      };
    }
    for (const Tipo of [window.WebGLRenderingContext, window.WebGL2RenderingContext].filter(Boolean)) {
      for (const nombre of ["drawArrays", "drawElements"]) {
        const original = Tipo.prototype[nombre];
        Tipo.prototype[nombre] = function (...argumentos) {
          if (this.canvas.id === "observatorio") window.__qaSala.dibujados += 1;
          return original.apply(this, argumentos);
        };
      }
    }
  }, { sinWebGL, sinTransicionNativa });
  return { pagina, solicitudes, errores, blogRetenido, liberarBlog };
}

async function cargar(pagina) {
  await pagina.goto(origen + "/", { waitUntil: "networkidle2" });
  await pagina.waitForFunction(() => document.documentElement.classList.contains("js-cine") && !document.getElementById("puerta"));
  await pagina.waitForFunction(() => ["webgl", "respaldo"].includes(document.body.dataset.motor));
  seguimiento.get(pagina).estado = await pagina.evaluate(() => {
    const lienzo = document.getElementById("observatorio");
    const gl = document.body.dataset.motor === "webgl" ? lienzo.getContext("webgl2") : null;
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    return {
      visible: document.visibilityState, motor: document.body.dataset.motor,
      renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : null,
      ancho: lienzo.width, alto: lienzo.height, dibujos: window.__qaSala.dibujados,
    };
  });
}

async function reposar(pagina) {
  await pagina.waitForFunction(() => !document.body.classList.contains("escena-cambiando") && !document.documentElement.classList.contains("navegando"));
}

// Ventana fija con duración real medida: O(1) tiempo de muestreo y memoria.
// Cuenta envíos a WebGL; no interpreta un framebuffer que Chrome puede vaciar.
async function medirDibujos(pagina) {
  return pagina.evaluate(async () => {
    const inicio = performance.now();
    const antes = Number(document.getElementById("observatorio").dataset.frames || 0);
    await new Promise((resolver) => setTimeout(resolver, 350));
    return { cantidad: Number(document.getElementById("observatorio").dataset.frames || 0) - antes, duracion: performance.now() - inicio };
  });
}

async function comprobarFondoAnimado(pagina, lugar) {
  const antes = await pagina.$eval("#observatorio", (e) => Number(e.dataset.frames || 0));
  await pagina.waitForFunction((anterior) => Number(document.getElementById("observatorio").dataset.frames || 0) > anterior, { timeout: 8000 }, antes);
  assert.equal(await pagina.$eval("body", (e) => e.classList.contains("escena-oculta")), false, `${lugar}: la escena permanece visible`);
}

async function prepararGestoTarjeta(pagina, selector) {
  await pagina.$eval(selector, (e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
  await pagina.waitForFunction((destino) => document.querySelector(destino).classList.contains("visible"), {}, selector);
  await pagina.$eval(selector, async (e) => {
    await Promise.all(e.getAnimations({ subtree: true })
      .filter((a) => a.effect?.getTiming().iterations !== Infinity)
      .map((a) => a.finished.catch(() => {})));
    // Entrega el scroll, que suelta el gesto anterior, antes del mousemove.
    await new Promise((resolver) => requestAnimationFrame(resolver));
  });
  return pagina.$eval(selector, (e) => e.getBoundingClientRect().toJSON());
}

test("la sala usa recursos locales sin fotografías escénicas bajo la CSP publicada", { timeout: 30_000 }, async (t) => {
  const { pagina, solicitudes, errores } = await nuevaPagina(t);
  try {
    await cargar(pagina);
    assert.equal(await pagina.$eval("body", (e) => e.dataset.motor), "webgl", "el navegador de prueba permite renderizar geometría real");
    assert.equal(await pagina.$$eval("#observatorio", (e) => e.length), 1);
    assert.equal(await pagina.$("#cambiar-escena, #recorrer-escenas, [data-ir-escena]"), null);
    assert.deepEqual(solicitudes.filter((url) => /\/activos\/escenas\//.test(new URL(url).pathname)), [], "la escena no solicita los fondos fotográficos antiguos");
    assert.equal(await pagina.$$eval(".portada img, #puerta img", (e) => e.length), 0, "la entrada y la portada no dependen de fotos");
    assert.ok(solicitudes.filter((url) => /observatorio.*\.js/.test(new URL(url).pathname)).every((url) => new URL(url).origin === origen));
    assert.deepEqual(await pagina.evaluate(() => window.__qaSala.bloqueos), [], "ningún recurso requiere relajar CSP");
    assert.deepEqual(errores, []);
  } finally { await pagina.close(); }
});

test("sin WebGL el respaldo conserva lectura y navegación en móvil", { timeout: 25_000 }, async (t) => {
  const { pagina, solicitudes, errores } = await nuevaPagina(t, { sinWebGL: true });
  try {
    await cargar(pagina);
    assert.equal(await pagina.$eval("body", (e) => e.dataset.motor), "respaldo");
    assert.ok(await pagina.$eval("main h1", (e) => e.textContent.trim().length > 0 && e.getBoundingClientRect().height > 0));
    assert.equal(await pagina.$eval(".respaldo-aviso", (e) => getComputedStyle(e).display === "none"), false);
    assert.equal(await pagina.$$eval("[data-accion-3d]", (botones) => botones.every((e) => e.disabled)), true, "las acciones gráficas no simulan funcionar sin GPU");
    assert.deepEqual(solicitudes.filter((url) => /\/activos\/escenas\//.test(new URL(url).pathname)), []);
    await pagina.click(".menu-mando");
    await pagina.click('nav.menu a[href="/blog/"]');
    await pagina.waitForFunction(() => document.body.dataset.ruta === "/blog/");
    await reposar(pagina);
    assert.ok(await pagina.$eval("main h1", (e) => e.textContent.trim().length > 0));
    assert.equal(await pagina.evaluate(() => window.__qaSala.navegaciones.length), 1);
    assert.ok(await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    assert.deepEqual(await pagina.evaluate(() => window.__qaSala.bloqueos), []);
    assert.deepEqual(errores, []);
  } finally { await pagina.close(); }
});

test("el fondo sigue animado en contenido, blog, proyectos y pie, y respeta la pausa global", { timeout: 20_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { ancho: 1440 });
  try {
    await cargar(pagina);
    if (await pagina.$eval("body", (e) => e.dataset.motor !== "webgl")) {
      t.skip("Chrome no ofrece WebGL; la degradación sin GPU se cubre aparte");
      return;
    }
    await pagina.waitForFunction(() => window.__qaSala.dibujados > 1);
    await pagina.evaluate(() => {
      const finalPortada = scrollY + document.querySelector(".portada").getBoundingClientRect().bottom;
      scrollTo({ top: finalPortada + 8, behavior: "instant" });
    });
    await comprobarFondoAnimado(pagina, "contenido después de portada");
    await pagina.$eval(".pie", (e) => e.scrollIntoView({ block: "start", behavior: "instant" }));
    await comprobarFondoAnimado(pagina, "pie de inicio");
    assert.equal(await pagina.$eval("#pausar-escena", (e) => e.getAttribute("aria-pressed")), "false", "desplazarse no modifica la preferencia manual");
    for (const ruta of ["/blog/", "/proyectos/"]) {
      await pagina.evaluate((destino) => document.querySelector(`nav.menu a[href="${destino}"]`).click(), ruta);
      await pagina.waitForFunction((destino) => document.body.dataset.ruta === destino, {}, ruta);
      await reposar(pagina);
      await comprobarFondoAnimado(pagina, ruta);
    }
    const proyecto = await pagina.$eval('a.ficha[href^="/proyectos/"]', (e) => { const ruta = e.pathname; e.click(); return ruta; });
    await pagina.waitForFunction((ruta) => document.body.dataset.ruta === ruta, {}, proyecto);
    await reposar(pagina);
    await comprobarFondoAnimado(pagina, "ficha de proyecto");
    await pagina.$eval(".pie", (e) => e.scrollIntoView({ block: "start", behavior: "instant" }));
    await comprobarFondoAnimado(pagina, "pie de proyecto");
    await pagina.click("#pausar-escena");
    assert.equal(await pagina.$eval("#pausar-escena", (e) => e.getAttribute("aria-pressed")), "true");
    assert.equal((await medirDibujos(pagina)).cantidad, 0, "la pausa detiene el fondo en el pie");
    await pagina.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    assert.equal((await medirDibujos(pagina)).cantidad, 0, "volver al encabezado conserva la pausa");
    assert.equal(await pagina.$eval("#pausar-escena", (e) => e.getAttribute("aria-pressed")), "true");
    assert.deepEqual(errores, []);
  } finally {
    if (!pagina.isClosed()) await pagina.evaluate(() => localStorage.removeItem("jsar:escena-pausa"));
    await pagina.close();
  }
});

test("los ornamentos visibles se animan por defecto y la pausa o movimiento reducido los detienen", { timeout: 25_000 }, async (t) => {
  for (const ancho of [390, 1440]) {
    // Aquí se observan transforms y animaciones CSS. El caso anterior mide
    // con GPU real que la misma pausa detiene los cuadros del observatorio.
    const { pagina, errores } = await nuevaPagina(t, { ancho, sinWebGL: true });
    try {
      await cargar(pagina);
      assert.equal(await pagina.$eval("body", (e) => e.dataset.motor), "respaldo");
      await pagina.$eval(".contenido-editorial .rotulo", (e) => {
        window.__qaSeccion = e.closest(".franja");
        // Una sección móvil puede medir más de un viewport. Centrar su
        // rótulo mantiene dentro de pantalla el ornamento que se observa.
        e.scrollIntoView({ block: "center", behavior: "instant" });
      });
      await pagina.waitForFunction(() => window.__qaSeccion.classList.contains("movimiento-en-vista"));
      const estado = () => pagina.evaluate(() => [window.__qaSeccion, window.__qaSeccion.querySelector(".rotulo")]
        .map((e, i) => {
          const estilo = getComputedStyle(e, i ? "::after" : "::before");
          return { animacion: estilo.animationName, estado: estilo.animationPlayState, transformacion: estilo.transform };
        }));
      const inicial = await estado();
      assert.ok(inicial.every((e) => e.animacion !== "none" && e.estado === "running"), `haz y filete se animan a ${ancho}px`);
      await pagina.waitForFunction((anteriores) => [window.__qaSeccion, window.__qaSeccion.querySelector(".rotulo")]
        .every((e, i) => getComputedStyle(e, i ? "::after" : "::before").transform !== anteriores[i].transformacion), { timeout: 3000 }, inicial);

      await pagina.click("#pausar-escena");
      await pagina.waitForFunction(() => document.body.classList.contains("escena-pausada"));
      await pagina.evaluate(async () => {
        // CSS puede indicar paused antes de que el compositor termine su
        // tarea de pausa. Esperar ready conserva la comparación exacta.
        await Promise.all(document.getAnimations()
          .filter((a) => a.effect?.getTiming().iterations === Infinity)
          .map((a) => a.ready.catch(() => {})));
        await new Promise((resolver) => requestAnimationFrame(resolver));
      });
      const congelados = await estado();
      await pagina.evaluate(() => new Promise((resolver) => setTimeout(resolver, 250)));
      assert.deepEqual(await estado(), congelados, "la pausa congela las transformaciones decorativas");
      assert.ok(await pagina.evaluate(() => document.getAnimations().filter((a) => a.effect?.getTiming().iterations === Infinity)
        .every((a) => a.playState === "paused")), "ninguna animación CSS infinita continúa tras pausar");
      const fases = await pagina.$eval(".pie", async (pie) => {
        pie.scrollIntoView({ block: "center", behavior: "instant" });
        const luz = pie.getAnimations({ subtree: true }).find((a) => a.animationName === "luz-en-superficie");
        if (!luz) throw new Error("El pie debe conservar su animación de luz");
        const anterior = luz.currentTime;
        const muestras = [];
        try {
          // Cinco fases fijas, O(1): una captura temprana no detecta el
          // desbordamiento que puede aparecer al final del recorrido.
          for (const tiempo of [0, 3000, 6000, 9000, 12000]) {
            luz.currentTime = tiempo;
            await new Promise((resolver) => requestAnimationFrame(resolver));
            muestras.push({ tiempo, exceso: document.documentElement.scrollWidth - innerWidth });
          }
        } finally { luz.currentTime = anterior; }
        return muestras;
      });
      for (const fase of fases) assert.ok(fase.exceso <= 2,
        `el haz del pie no desborda a ${ancho}px y ${fase.tiempo}ms (exceso: ${fase.exceso}px)`);
      await pagina.click("#pausar-escena");
      await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
      const preferencia = await pagina.evaluate(() => ({
        reducido: matchMedia("(prefers-reduced-motion: reduce)").matches,
        visible: document.visibilityState, cuerpo: document.body.className,
        deshabilitado: document.getElementById("pausar-escena").disabled,
        dibujos: window.__qaSala.dibujados,
      }));
      seguimiento.get(pagina).movimiento = preferencia;
      assert.equal(preferencia.reducido, true,
        "la emulación del navegador aplica la preferencia antes de comprobar su control");
      await pagina.waitForFunction(() => document.getElementById("pausar-escena").disabled);
      assert.ok((await estado()).every((e) => e.animacion === "none" || e.estado === "paused"));
      assert.equal((await medirDibujos(pagina)).cantidad, 0, "reducir movimiento detiene también el fondo");
      assert.deepEqual(await pagina.evaluate(() => window.__qaSala.bloqueos), []);
      assert.deepEqual(errores, []);
    } finally {
      if (!pagina.isClosed()) await pagina.evaluate(() => localStorage.removeItem("jsar:escena-pausa"));
      await pagina.close();
    }
  }
});

test("las tarjetas responden a puntero y teclado, se neutralizan al pausar y se renuevan tras navegar", { timeout: 25_000 }, async (t) => {
  // La respuesta de las tarjetas es HTML/CSS; compilar y animar el fondo
  // no forma parte de este contrato de puntero, teclado y desmontaje PJAX.
  const { pagina, errores } = await nuevaPagina(t, { ancho: 1440, sinWebGL: true });
  const tarjeta = 'a.ficha.tarjeta-interactiva[href^="/proyectos/"]';
  try {
    await cargar(pagina);
    assert.equal(await pagina.$eval("body", (e) => e.dataset.motor), "respaldo");
    assert.equal(await pagina.evaluate(() => matchMedia("(hover: hover) and (pointer: fine)").matches), true, "el navegador de la prueba ofrece un ratón con hover real");
    await pagina.waitForSelector(tarjeta);
    await pagina.$eval(tarjeta, (e) => { window.__qaTarjetaAnterior = e; });
    const caja = await prepararGestoTarjeta(pagina, tarjeta);
    await pagina.mouse.move(caja.left + caja.width * .8, caja.top + caja.height * .25);
    await pagina.waitForFunction((selector) => Math.abs(parseFloat(document.querySelector(selector).style.getPropertyValue("--tarjeta-ry"))) > .2, {}, tarjeta);
    const inclinacion = await pagina.$eval(tarjeta, (e) => ["--tarjeta-rx", "--tarjeta-ry"].map((p) => parseFloat(e.style.getPropertyValue(p))));
    assert.ok(inclinacion.every((valor) => Math.abs(valor) <= 1.6), "la inclinación conserva su límite angular");
    assert.notEqual(await pagina.$eval(tarjeta, (e) => getComputedStyle(e).transform), "none");
    await pagina.mouse.move(1, 1);
    await pagina.waitForFunction((selector) => ["--tarjeta-rx", "--tarjeta-ry", "--tarjeta-luz"]
      .every((p) => Number.parseFloat(document.querySelector(selector).style.getPropertyValue(p)) === 0), {}, tarjeta);

    await pagina.keyboard.press("Tab");
    await pagina.focus(tarjeta);
    await pagina.waitForFunction((selector) => parseFloat(document.querySelector(selector).style.getPropertyValue("--tarjeta-luz")) > .4, {}, tarjeta);
    assert.deepEqual(await pagina.$eval(tarjeta, (e) => ["--tarjeta-rx", "--tarjeta-ry"].map((p) => parseFloat(e.style.getPropertyValue(p)))), [0, 0], "el teclado ilumina sin inclinar la lectura");
    await pagina.click("#pausar-escena");
    await pagina.waitForFunction((selector) => parseFloat(document.querySelector(selector).style.getPropertyValue("--tarjeta-luz")) === 0, {}, tarjeta);
    assert.deepEqual(await pagina.$eval(tarjeta, (e) => ["--tarjeta-rx", "--tarjeta-ry"].map((p) => parseFloat(e.style.getPropertyValue(p)))), [0, 0]);
    await pagina.click("#pausar-escena");
    await pagina.evaluate(() => document.querySelector('nav.menu a[href="/blog/"]').click());
    await pagina.waitForFunction(() => document.body.dataset.ruta === "/blog/");
    await reposar(pagina);
    await pagina.waitForSelector(".escrito-card.tarjeta-interactiva");
    assert.equal(await pagina.evaluate(() => window.__qaTarjetaAnterior.isConnected), false);
    assert.equal(await pagina.evaluate(() => window.__qaTarjetaAnterior.classList.contains("tarjeta-interactiva")), false, "el registro deja de conservar la tarjeta reemplazada");
    const nuevaCaja = await prepararGestoTarjeta(pagina, ".escrito-card.tarjeta-interactiva");
    await pagina.mouse.move(nuevaCaja.left + nuevaCaja.width * .75, nuevaCaja.top + nuevaCaja.height * .3);
    await pagina.waitForFunction(() => parseFloat(document.querySelector(".escrito-card.tarjeta-interactiva").style.getPropertyValue("--tarjeta-luz")) > .4);
    await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await pagina.waitForFunction(() => parseFloat(document.querySelector(".escrito-card.tarjeta-interactiva").style.getPropertyValue("--tarjeta-luz")) === 0);
    assert.equal(await pagina.$eval(".escrito-card.tarjeta-interactiva", (e) => getComputedStyle(e).transform), "none");
    assert.ok(await pagina.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    assert.deepEqual(await pagina.evaluate(() => window.__qaSala.bloqueos), []);
    assert.deepEqual(errores, []);
  } finally {
    if (!pagina.isClosed()) await pagina.evaluate(() => localStorage.removeItem("jsar:escena-pausa"));
    await pagina.close();
  }
});

test("perder el contexto gráfico conserva la lectura y restaura el mismo observatorio", { timeout: 30_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { ancho: 1440 });
  try {
    await cargar(pagina);
    const disponible = await pagina.evaluate(() => {
      window.__qaCanvasAntes = document.getElementById("observatorio");
      const gl = window.__qaCanvasAntes.getContext("webgl2");
      window.__qaContexto = gl?.getExtension("WEBGL_lose_context");
      return Boolean(window.__qaContexto);
    });
    if (!disponible) { t.skip("Chrome no ofrece WEBGL_lose_context; el caso sin WebGL se cubre aparte"); return; }
    await pagina.evaluate(() => window.__qaContexto.loseContext());
    await pagina.waitForFunction(() => document.body.dataset.motor === "respaldo");
    assert.ok(await pagina.$eval("main h1", (e) => e.getBoundingClientRect().height > 0));
    await pagina.evaluate(() => document.querySelector('nav.menu a[href="/blog/"]').click());
    await pagina.waitForFunction(() => document.body.dataset.ruta === "/blog/");
    await reposar(pagina);
    await pagina.evaluate(() => window.__qaContexto.restoreContext());
    await pagina.waitForFunction(() => document.body.dataset.motor === "webgl");
    assert.equal(await pagina.evaluate(() => document.getElementById("observatorio") === window.__qaCanvasAntes), true);
    await comprobarFondoAnimado(pagina, "contexto restaurado");
    assert.deepEqual(await pagina.evaluate(() => window.__qaSala.bloqueos), []);
    assert.deepEqual(errores, []);
  } finally { await pagina.close(); }
});

test("dos navegaciones rápidas conservan el último destino con y sin View Transitions", { timeout: 30_000 }, async (t) => {
  for (const sinTransicionNativa of [false, true]) {
    const { pagina, errores, blogRetenido, liberarBlog } = await nuevaPagina(t, { ancho: 1440, sinTransicionNativa, retenerBlog: true });
    try {
      await cargar(pagina);
      await pagina.evaluate(() => { window.__qaDocumento = document; window.__qaAudio = document.querySelector("audio"); });
      await pagina.evaluate(() => document.querySelector('nav.menu a[href="/blog/"]').click());
      await blogRetenido;
      // El primer fetch no puede sustituir el menú durante el segundo clic.
      // La barrera prueba la cancelación sin depender del tiempo de la GPU.
      await pagina.evaluate(() => document.querySelector('nav.menu a[href="/proyectos/"]').click());
      liberarBlog();
      await pagina.waitForFunction(() => document.body.dataset.ruta === "/proyectos/");
      await reposar(pagina);
      assert.equal(new URL(pagina.url()).pathname, "/proyectos/");
      assert.equal(await pagina.evaluate(() => document === window.__qaDocumento), true);
      assert.equal(await pagina.evaluate(() => document.querySelector("audio") === window.__qaAudio), true);
      assert.deepEqual(await pagina.evaluate(() => window.__qaSala.navegaciones), ["/proyectos/"]);
      assert.equal(await pagina.evaluate(() => document.activeElement.id), "principal", "el foco aterriza en contenido actual");
      await pagina.goBack({ waitUntil: "domcontentloaded" });
      await pagina.waitForFunction(() => document.body.dataset.ruta === "/");
      await reposar(pagina);
      assert.deepEqual(errores, []);
    } finally { liberarBlog(); await pagina.close(); }
  }
});

test("navegaciones consecutivas conservan el último destino y el historial restaura el scroll", { timeout: 30_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { ancho: 1440 });
  try {
    await cargar(pagina);
    await pagina.evaluate(() => {
      window.__qaHistorial = history.length;
      document.querySelector('nav.menu a[href="/blog/"]').click();
      // Ambos clics ocurren antes de resolver el primer fetch: la cancelación
      // prueba la navegación continua sin depender de una transición retirada.
      document.querySelector('nav.menu a[href="/proyectos/"]').click();
    });
    await pagina.waitForFunction(() => document.body.dataset.ruta === "/proyectos/");
    await reposar(pagina);
    assert.deepEqual(await pagina.evaluate(() => window.__qaSala.navegaciones), ["/proyectos/"]);
    assert.equal(await pagina.evaluate(() => history.length - window.__qaHistorial), 1);
    await pagina.click('nav.menu a[href="/blog/"]');
    await pagina.waitForFunction(() => document.body.dataset.ruta === "/blog/");
    await reposar(pagina);
    await pagina.evaluate(async () => {
      scrollTo({ top: 500, behavior: "instant" });
      await new Promise((resolver) => requestAnimationFrame(() => requestAnimationFrame(resolver)));
    });
    assert.equal(await pagina.evaluate(() => scrollY), 500);
    await pagina.click('nav.menu a[href="/proyectos/"]');
    await pagina.waitForFunction(() => document.body.dataset.ruta === "/proyectos/");
    await reposar(pagina);
    await pagina.goBack({ waitUntil: "domcontentloaded" });
    await pagina.waitForFunction(() => document.body.dataset.ruta === "/blog/");
    await reposar(pagina);
    assert.ok(Math.abs(await pagina.evaluate(() => scrollY) - 500) < 2, "volver devuelve el punto de lectura");
    assert.deepEqual(errores, []);
  } finally { await pagina.close(); }
});
