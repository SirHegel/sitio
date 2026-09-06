/* Pruebas de contrato de la sala: controles utilizables, mismo origen y
   degradación progresiva. Cada comprobación de navegador usa O(1) páginas;
   la auditoría de activos usa O(A) tiempo y O(A) espacio, A = 6 escenas. */
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
    executablePath: ejecutableChrome(), headless: true,
    // Backend idéntico en equipos locales y CI sin GPU física:
    // https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/swiftshader.md
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
});

after(async () => {
  await navegador?.close();
  if (servidor) await new Promise((resolver) => servidor.close(resolver));
});

async function nuevaPagina(t, { ancho = 390, sinWebGL = false, sinTransicionNativa = false, retenerBlog = false } = {}) {
  const pagina = await navegador.newPage();
  const traza = { ancho, fase: "crear página", estado: null };
  seguimiento.set(pagina, traza);
  const cerrar = () => pagina.isClosed() ? Promise.resolve() : pagina.close().catch(() => {});
  const cancelar = () => { t.diagnostic(`Página cancelada: ${JSON.stringify(traza)}`); void cerrar(); };
  t.signal.addEventListener("abort", cancelar, { once: true });
  t.after(async () => {
    t.signal.removeEventListener("abort", cancelar);
    await cerrar();
  });
  for (const nombre of ["goto", "click", "waitForFunction", "reload", "goBack"]) {
    const ejecutar = pagina[nombre].bind(pagina);
    pagina[nombre] = (...argumentos) => {
      traza.fase = `${nombre}: ${String(argumentos[0] ?? "").slice(0, 180)}`;
      return ejecutar(...argumentos);
    };
  }
  await pagina.bringToFront();
  await pagina.setViewport({ width: ancho, height: ancho < 768 ? 844 : 900, deviceScaleFactor: ancho < 768 ? 2 : 1 });
  const solicitudes = [];
  const errores = [];
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
          if (this.canvas.id === "lienzo") window.__qaSala.dibujados += 1;
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
  seguimiento.get(pagina).estado = await pagina.evaluate(() => {
    const lienzo = document.getElementById("lienzo");
    const gl = lienzo.dataset.motor === "webgl" ? lienzo.getContext("webgl") : null;
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    return {
      visible: document.visibilityState, motor: lienzo.dataset.motor,
      renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : null,
      ancho: lienzo.width, alto: lienzo.height, dibujos: window.__qaSala.dibujados,
    };
  });
}

async function reposar(pagina) {
  await pagina.waitForFunction(() => !document.body.classList.contains("escena-cambiando") && !document.documentElement.classList.contains("navegando"));
}

test("las escenas publicadas conservan seis imágenes locales bajo 200 kB cada una", () => {
  for (const nombre of ["terciopelo", "nocturno", "celuloide"]) {
    for (const sufijo of ["", "-movil"]) {
      const archivo = resolve(publico, `activos/escenas/${nombre}${sufijo}.webp`);
      assert.ok(existsSync(archivo), `${nombre}${sufijo} se publica`);
      assert.ok(statSync(archivo).size < 200_000, `${nombre}${sufijo} excede el presupuesto fijado de 200 kB`);
    }
  }
});

test("la selección de escenas funciona con teclado y carga versiones móviles bajo la CSP publicada", { timeout: 30_000 }, async (t) => {
  const { pagina, solicitudes, errores } = await nuevaPagina(t);
  try {
    await cargar(pagina);
    const escenas = await pagina.$$eval("[data-ir-escena]", (botones) => botones.map((boton) => boton.dataset.irEscena));
    assert.deepEqual(new Set(escenas), new Set(["terciopelo", "nocturno", "celuloide"]));
    await pagina.focus('[data-ir-escena="celuloide"]');
    await pagina.keyboard.press("Enter");
    await pagina.waitForFunction(() => document.body.dataset.escena === "celuloide");
    await reposar(pagina);
    assert.equal(await pagina.$eval('[data-ir-escena="celuloide"]', (e) => e.getAttribute("aria-pressed")), "true");
    assert.equal(await pagina.$$eval('[data-ir-escena][aria-pressed="true"]', (e) => e.length), 1);
    const capturas = solicitudes.filter((url) => new URL(url).pathname.startsWith("/activos/escenas/"));
    assert.ok(capturas.length > 0, "la sala carga sus imágenes");
    assert.ok(capturas.every((url) => new URL(url).origin === origen && new URL(url).pathname.endsWith("-movil.webp")), "móvil no descarga la variante de escritorio");
    assert.deepEqual(await pagina.evaluate(() => window.__qaSala.bloqueos), [], "ningún recurso requiere relajar CSP");
    assert.deepEqual(errores, []);
  } finally { await pagina.close(); }
});

test("sin WebGL la escena sigue visible y los controles no bloquean navegación ni lectura", { timeout: 25_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { sinWebGL: true });
  try {
    await cargar(pagina);
    await pagina.click('[data-ir-escena="nocturno"]');
    await pagina.waitForFunction(() => document.body.dataset.escena === "nocturno");
    await reposar(pagina);
    await pagina.waitForFunction(() => Number(getComputedStyle(document.querySelector(".ambiente-nocturno")).opacity) > .1);
    const fondo = await pagina.$eval(".ambiente-nocturno", (e) => ({ imagen: getComputedStyle(e).backgroundImage, opacidad: Number(getComputedStyle(e).opacity) }));
    assert.match(fondo.imagen, /nocturno/);
    assert.ok(fondo.opacidad > 0, "permanece una escena CSS cuando no hay GPU");
    await pagina.click(".menu-mando");
    await pagina.click('nav.menu a[href="/blog/"]');
    await pagina.waitForFunction(() => document.body.dataset.ruta === "/blog/");
    await reposar(pagina);
    assert.ok(await pagina.$eval("main h1", (e) => e.textContent.trim().length > 0));
    assert.equal(await pagina.evaluate(() => window.__qaSala.navegaciones.length), 1, "navegación progresiva funciona en fallback");
    assert.deepEqual(errores, []);
  } finally { await pagina.close(); }
});

test("el recorrido voluntario se detiene al pausar o pedir movimiento reducido", { timeout: 25_000 }, async (t) => {
  const { pagina } = await nuevaPagina(t, { ancho: 1440 });
  try {
    await cargar(pagina);
    assert.equal(await pagina.$eval("#recorrer-escenas", (e) => e.getAttribute("aria-pressed")), "false", "no inicia un carrusel automático al cargar");
    await pagina.click("#recorrer-escenas");
    assert.equal(await pagina.$eval("#recorrer-escenas", (e) => e.getAttribute("aria-pressed")), "true");
    await pagina.click("#pausar-escena");
    assert.equal(await pagina.$eval("#recorrer-escenas", (e) => e.getAttribute("aria-pressed")), "false");
    await pagina.evaluate(() => new Promise((resolver) => setTimeout(resolver, 250)));
    const cuadros = await pagina.evaluate(() => window.__qaSala.dibujados);
    await pagina.evaluate(() => new Promise((resolver) => setTimeout(resolver, 250)));
    assert.equal(await pagina.evaluate(() => window.__qaSala.dibujados), cuadros, "pausar detiene los draw calls de la sala");
    await pagina.click("#pausar-escena");
    await pagina.click("#recorrer-escenas");
    await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await pagina.waitForFunction(() => document.getElementById("pausar-escena").disabled);
    assert.equal(await pagina.$eval("#recorrer-escenas", (e) => e.getAttribute("aria-pressed")), "false");
    await pagina.evaluate(() => new Promise((resolver) => setTimeout(resolver, 250)));
    const reducidos = await pagina.evaluate(() => window.__qaSala.dibujados);
    await pagina.evaluate(() => new Promise((resolver) => setTimeout(resolver, 250)));
    assert.equal(await pagina.evaluate(() => window.__qaSala.dibujados), reducidos, "la preferencia detiene los draw calls");
  } finally { await pagina.close(); }
});

test("el motor deja de dibujar fuera de portada, vuelve al entrar y conserva la pausa elegida", { timeout: 20_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { ancho: 1440 });
  try {
    await cargar(pagina);
    if (await pagina.$eval("#lienzo", (e) => e.dataset.motor !== "webgl")) {
      t.skip("Chrome no ofrece WebGL; la degradación sin GPU se cubre aparte");
      return;
    }
    await pagina.waitForFunction(() => window.__qaSala.dibujados > 1);
    await pagina.evaluate(() => {
      const finalPortada = scrollY + document.querySelector(".portada").getBoundingClientRect().bottom;
      scrollTo({ top: finalPortada + 8, behavior: "instant" });
    });
    await pagina.waitForFunction(() => document.body.classList.contains("escena-oculta"));
    const fuera = await pagina.evaluate(() => window.__qaSala.dibujados);
    await pagina.evaluate(() => new Promise((resolver) => setTimeout(resolver, 300)));
    assert.equal(await pagina.evaluate(() => window.__qaSala.dibujados), fuera, "el fondo tapado no consume nuevos dibujos");
    assert.equal(await pagina.$eval("#pausar-escena", (e) => e.getAttribute("aria-pressed")), "false", "salir de portada no cambia la preferencia manual");
    await pagina.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await pagina.waitForFunction((cuadros) => !document.body.classList.contains("escena-oculta") && window.__qaSala.dibujados > cuadros, {}, fuera);
    await pagina.click("#pausar-escena");
    assert.equal(await pagina.$eval("#pausar-escena", (e) => e.getAttribute("aria-pressed")), "true");
    const pausados = await pagina.evaluate(() => window.__qaSala.dibujados);
    await pagina.evaluate(() => {
      const finalPortada = scrollY + document.querySelector(".portada").getBoundingClientRect().bottom;
      scrollTo({ top: finalPortada + 8, behavior: "instant" });
    });
    await pagina.waitForFunction(() => document.body.classList.contains("escena-oculta"));
    await pagina.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await pagina.waitForFunction(() => !document.body.classList.contains("escena-oculta"));
    await pagina.evaluate(() => new Promise((resolver) => setTimeout(resolver, 300)));
    assert.equal(await pagina.evaluate(() => window.__qaSala.dibujados), pausados, "volver a portada respeta la pausa manual");
    assert.equal(await pagina.$eval("#pausar-escena", (e) => e.getAttribute("aria-pressed")), "true");
    assert.deepEqual(errores, []);
  } finally {
    if (!pagina.isClosed()) await pagina.evaluate(() => localStorage.removeItem("jsar:escena-pausa"));
    await pagina.close();
  }
});

test("perder el contexto gráfico recupera el fondo y mantiene utilizables los controles", { timeout: 25_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { ancho: 1440 });
  try {
    await cargar(pagina);
    const disponible = await pagina.evaluate(() => {
      const gl = document.getElementById("lienzo").getContext("webgl");
      window.__qaContexto = gl?.getExtension("WEBGL_lose_context");
      return Boolean(window.__qaContexto);
    });
    if (!disponible) { t.skip("Chrome no ofrece WEBGL_lose_context; el caso sin WebGL se cubre aparte"); return; }
    assert.ok(await pagina.$eval("#lienzo", (e) => e.width * e.height <= 360_000), "SwiftShader respeta el presupuesto de 360000 píxeles");
    const anchoInicial = await pagina.$eval("#lienzo", (e) => e.width);
    await pagina.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await pagina.waitForFunction((anterior) => document.getElementById("lienzo").width !== anterior, {}, anchoInicial);
    assert.ok(await pagina.$eval("#lienzo", (e) => e.width * e.height <= 360_000), "ampliar el viewport conserva el presupuesto del backend software");
    await pagina.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await pagina.waitForFunction((anterior) => document.getElementById("lienzo").width === anterior, {}, anchoInicial);
    await pagina.click('[data-ir-escena="nocturno"]');
    await pagina.waitForFunction(() => document.body.classList.contains("escena-cambiando"));
    await pagina.evaluate(() => window.__qaContexto.loseContext());
    await pagina.waitForFunction(() => !document.body.classList.contains("sala-lista") && !document.body.classList.contains("escena-cambiando"));
    await pagina.waitForFunction(() => document.body.dataset.escena === "nocturno");
    await reposar(pagina);
    await pagina.waitForFunction(() => Number(getComputedStyle(document.querySelector(".ambiente-nocturno")).opacity) > .1);
    assert.ok(await pagina.$eval(".ambiente-nocturno", (e) => Number(getComputedStyle(e).opacity) > 0));
    await pagina.evaluate(() => window.__qaContexto.restoreContext());
    await pagina.waitForFunction(() => document.body.classList.contains("sala-lista"));
    assert.ok(await pagina.$eval("#lienzo", (e) => e.width * e.height <= 360_000), "restaurar el contexto conserva el presupuesto");
    assert.deepEqual(errores, []);
  } finally { await pagina.close(); }
});

test("dos navegaciones rápidas conservan el último destino con y sin View Transitions", { timeout: 30_000 }, async (t) => {
  for (const sinTransicionNativa of [false, true]) {
    const { pagina, errores, blogRetenido, liberarBlog } = await nuevaPagina(t, { ancho: 1440, sinTransicionNativa, retenerBlog: true });
    try {
      // Diagnóstico reproducible: CINE_QA_CPU=4 repite el caso con CPU lenta.
      if (process.env.CINE_QA_CPU === "4") {
        const sesion = await pagina.createCDPSession();
        await sesion.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      }
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

test("un callback de transición demorado no publica un destino cancelado y el historial restaura el scroll", { timeout: 30_000 }, async (t) => {
  const { pagina, errores } = await nuevaPagina(t, { ancho: 1440 });
  try {
    await cargar(pagina);
    await pagina.evaluate(() => {
      if (document.startViewTransition) {
        const transicionar = document.startViewTransition.bind(document);
        document.startViewTransition = (aplicar) => transicionar(async () => {
          await new Promise((resolver) => setTimeout(resolver, 300));
          return aplicar();
        });
      }
      window.__qaHistorial = history.length;
      document.querySelector('nav.menu a[href="/blog/"]').click();
      setTimeout(() => document.querySelector('nav.menu a[href="/proyectos/"]').click(), 40);
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
