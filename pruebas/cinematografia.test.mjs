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
const tipos = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".webp": "image/webp" };

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

test("una escena elegida permanece durante la navegación y el fondo obedece pausa y movimiento reducido", { timeout: 25_000 }, async () => {
  const pagina = await nuevaPagina(1440);
  try {
    await pagina.evaluateOnNewDocument(() => {
      window.cuadrosEscena = 0;
      for (const tipo of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
        if (!tipo) continue;
        for (const nombre of ["drawArrays", "drawElements"]) {
          const dibujar = tipo.prototype[nombre];
          tipo.prototype[nombre] = function (...argumentos) {
            if (this.canvas?.id === "lienzo") window.cuadrosEscena++;
            return dibujar.apply(this, argumentos);
          };
        }
      }
    });
    await cargar(pagina);
    await pagina.click("#cambiar-escena");
    const escena = await pagina.$eval("body", (e) => e.dataset.escena);
    assert.equal(escena, "nocturno");
    await pagina.evaluate(() => { window.marcaContinuidad = "mismo-documento"; });
    await pagina.click('nav.menu a[href="/blog/"]');
    await pagina.waitForFunction(() => document.body.dataset.ruta === "/blog/");
    await terminarTransicion(pagina);
    assert.equal(await pagina.evaluate(() => window.marcaContinuidad), "mismo-documento", "la navegación conserva audio y controles");
    assert.equal(await pagina.$eval("body", (e) => e.dataset.escena), escena);

    await pagina.click("#pausar-escena");
    await pagina.waitForFunction(() => document.body.classList.contains("escena-pausada"));
    // WebGL puede descartar su buffer tras componer sin dibujar otro cuadro.
    // Contar comandos comprueba la pausa sin exigir preserveDrawingBuffer.
    const cuadroPausado = await pagina.evaluate(() => window.cuadrosEscena);
    if (await pagina.$eval("#lienzo", (e) => e.dataset.motor === "webgl")) {
      assert.ok(cuadroPausado > 0, "el motor dibujó antes de pausar");
    }
    await pagina.evaluate(() => new Promise((resolver) => setTimeout(resolver, 150)));
    assert.equal(await pagina.evaluate(() => window.cuadrosEscena), cuadroPausado, "el lienzo deja de dibujar al pausar");
    await pagina.reload({ waitUntil: "networkidle2" });
    assert.equal(await pagina.$eval("#pausar-escena", (e) => e.getAttribute("aria-pressed")), "true", "la pausa se conserva tras recargar");
    await pagina.click("#pausar-escena");

    await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await pagina.waitForFunction(() => document.getElementById("pausar-escena").disabled);
    const cuadroReducido = await pagina.evaluate(() => window.cuadrosEscena);
    await pagina.evaluate(() => new Promise((resolver) => setTimeout(resolver, 150)));
    assert.equal(await pagina.evaluate(() => window.cuadrosEscena), cuadroReducido, "el cambio del sistema detiene el lienzo inmediatamente");
    assert.equal(await pagina.$eval(".luz-proyector", (e) => getComputedStyle(e).animationName), "none");
    await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await pagina.waitForFunction(() => !document.getElementById("pausar-escena").disabled);
    assert.equal(await pagina.$eval("#pausar-escena", (e) => e.getAttribute("aria-pressed")), "false");
  } finally { await pagina.close(); }
});

test("movimiento reducido inicial usa imágenes y solicita WebGL sólo al habilitar movimiento", { timeout: 20_000 }, async () => {
  const pagina = await nuevaPagina(1440);
  try {
    await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await pagina.evaluateOnNewDocument(() => {
      window.solicitudesSala = 0;
      const contexto = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (tipo, ...opciones) {
        if (this.id === "lienzo" && /^(webgl2?|experimental-webgl)$/.test(tipo)) window.solicitudesSala++;
        return contexto.call(this, tipo, ...opciones);
      };
    });
    await cargar(pagina);
    assert.equal(await pagina.evaluate(() => window.solicitudesSala), 0, "la lectura estática no solicita un contexto GPU");
    assert.equal(await pagina.$eval("#lienzo", (e) => e.dataset.motor), "imagen");
    assert.equal(await pagina.$eval("#pausar-escena", (e) => e.disabled), true);
    await pagina.click("#cambiar-escena");
    assert.equal(await pagina.$eval("body", (e) => e.dataset.escena), "nocturno");
    assert.equal(await pagina.$eval(".ambiente-nocturno", (e) => getComputedStyle(e).opacity), "1", "el respaldo fotográfico permite cambiar de escena");
    assert.equal(await pagina.evaluate(() => window.solicitudesSala), 0, "cambiar la imagen tampoco abre la GPU");

    await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await pagina.waitForFunction(() => window.solicitudesSala === 1 && !document.getElementById("pausar-escena").disabled);
    assert.equal(await pagina.$eval("body", (e) => e.dataset.escena), "nocturno", "la sala arranca en la escena elegida");
    await pagina.click("#pausar-escena");
    await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await pagina.waitForFunction(() => document.getElementById("pausar-escena").disabled);
    await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "no-preference" }]);
    await pagina.waitForFunction(() => !document.getElementById("pausar-escena").disabled);
    assert.equal(await pagina.evaluate(() => window.solicitudesSala), 1, "el contexto existente no se recrea al cambiar preferencias");
    assert.equal(await pagina.$eval("#pausar-escena", (e) => e.getAttribute("aria-pressed")), "true", "el cambio de preferencias conserva la pausa manual");
  } finally { await pagina.close(); }
});

test("sin JavaScript se pueden leer inicio, blog y juegos, usar navegación y omitir la entrada", { timeout: 15_000 }, async () => {
  const pagina = await nuevaPagina();
  try {
    await pagina.setJavaScriptEnabled(false);
    for (const ruta of ["/", "/blog/", "/juegos/"]) {
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

test("Juegos se alcanza con menú móvil y conserva navegación, escena y enlaces jugables", { timeout: 35_000 }, async () => {
  for (const ancho of [320, 390, 960, 1440]) {
    const pagina = await nuevaPagina(ancho);
    try {
      await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
      await cargar(pagina, "/blog/");
      await pagina.evaluate(() => { window.marcaJuegos = "mismo-documento"; });
      if (ancho < 768) await pagina.click(".menu-mando");
      const enlace = 'nav.menu a[href="/juegos/"]';
      await pagina.focus(enlace);
      await pagina.keyboard.press("Enter");
      await pagina.waitForFunction(() => document.body.dataset.ruta === "/juegos/");
      await terminarTransicion(pagina);
      assert.equal(await pagina.evaluate(() => window.marcaJuegos), "mismo-documento");
      assert.equal(await pagina.$eval(enlace, (e) => e.getAttribute("aria-current")), "page");
      assert.equal(await pagina.$eval("body", (e) => e.dataset.escena), "nocturno");
      if (ancho < 768) assert.equal(await pagina.$eval(".menu-mando", (e) => e.getAttribute("aria-expanded")), "false");
      await pagina.$eval(".juego-captura", (e) => e.scrollIntoView({ block: "center" }));
      await pagina.waitForFunction(() => {
        const captura = document.querySelector(".juego-captura img");
        return captura?.complete && captura.naturalWidth > 0;
      });
      const estado = await pagina.evaluate(() => ({
        titulos: [...document.querySelectorAll(".juego-ficha h2")].map((e) => e.textContent),
        enlaces: [...document.querySelectorAll(".juego-acciones .boton")].map((e) => ({
          url: e.href, alto: e.getBoundingClientRect().height, ancho: e.getBoundingClientRect().width,
          x: e.getBoundingClientRect().x, derecha: e.getBoundingClientRect().right,
        })),
        ancho: innerWidth,
        captura: (() => {
          const imagen = document.querySelector(".juego-captura img");
          const caja = imagen.getBoundingClientRect();
          return { x: caja.x, derecha: caja.right, ancho: caja.width, alto: caja.height };
        })(),
        overflow: document.documentElement.scrollWidth - innerWidth,
      }));
      assert.deepEqual(estado.titulos, ["Neiva Abierta", "Bloquitos"]);
      assert.deepEqual(estado.enlaces.map((e) => e.url), ["https://neiva-abierta.vercel.app/", "https://bloquitos.vercel.app/"]);
      assert.ok(estado.captura.ancho > 0 && estado.captura.alto > 0, `captura visible a ${ancho}px`);
      assert.ok(estado.captura.x >= 0 && estado.captura.derecha <= estado.ancho, `captura cabe a ${ancho}px`);
      assert.ok(estado.overflow <= 2, `sin desbordamiento horizontal a ${ancho}px`);
      for (const boton of estado.enlaces) {
        assert.ok(boton.alto >= 44 && boton.ancho >= 44, `objetivo táctil a ${ancho}px`);
        assert.ok(boton.x >= 0 && boton.derecha <= estado.ancho, `acción accesible completa a ${ancho}px`);
      }
    } finally { await pagina.close(); }
  }
});
