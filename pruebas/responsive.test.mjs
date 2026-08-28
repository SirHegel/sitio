/* Auditoría geométrica real en Chrome. Un `overflow-x: hidden` puede ocultar
   un fallo sin corregirlo, así que se miden los glifos contra su caja. */

import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import puppeteer from "puppeteer-core";
import { ejecutableChrome } from "./chrome.mjs";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const construido = resolve(raiz, "publico");
const ANCHOS = [280, 320, 360, 390, 412, 430, 768, 960, 961, 1024, 1180, 1280, 1440];
const CAJAS = [
  ".scrim",
  ".ficha",
  ".rotulo",
  ".metrica",
  ".escrito-card",
  ".cv-retrato",
  ".epigrafe .plancha",
].join(",");

const tipos = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".pdf", "application/pdf"],
  [".xml", "application/xml; charset=utf-8"],
]);

async function servirPublico() {
  const servidor = createServer((peticion, respuesta) => {
    try {
      const url = new URL(peticion.url || "/", "http://127.0.0.1");
      let relativa = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      if (!relativa || url.pathname.endsWith("/")) relativa += "index.html";
      const archivo = resolve(construido, relativa);
      if (!archivo.startsWith(construido + sep) || !existsSync(archivo) || !statSync(archivo).isFile()) {
        respuesta.writeHead(404).end("No encontrado");
        return;
      }
      respuesta.writeHead(200, {
        "Content-Type": tipos.get(extname(archivo)) || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      const flujo = createReadStream(archivo);
      flujo.on("error", () => respuesta.destroy());
      flujo.pipe(respuesta);
    } catch {
      respuesta.writeHead(400).end("Solicitud inválida");
    }
  });
  await new Promise((resolver, rechazar) => {
    servidor.once("error", rechazar);
    servidor.listen(0, "127.0.0.1", resolver);
  });
  const direccion = servidor.address();
  return {
    origen: `http://127.0.0.1:${direccion.port}`,
    cerrar: () => new Promise((resolver, rechazar) => servidor.close((error) => error ? rechazar(error) : resolver())),
  };
}

test("ningún contenido público abandona su caja en móvil ni al cambiar de breakpoint", { timeout: 180_000 }, async () => {
  const chrome = ejecutableChrome();
  assert.ok(chrome, "la auditoría responsive necesita Chrome; define PUPPETEER_EXECUTABLE_PATH");

  execFileSync(process.execPath, ["construir.js"], { cwd: raiz, stdio: "pipe" });
  const sitemap = readFileSync(resolve(construido, "sitemap.xml"), "utf8");
  const rutas = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((coincidencia) => new URL(coincidencia[1]).pathname);
  assert.ok(rutas.length >= 30, "el sitemap no tiene suficientes rutas para la auditoría");

  const servidor = await servirPublico();
  const navegador = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const pagina = await navegador.newPage();
  const fallos = [];

  try {
    await pagina.setRequestInterception(true);
    pagina.on("request", (peticion) => {
      const url = peticion.url();
      if (
        peticion.resourceType() === "media" ||
        url.includes("/_vercel/") ||
        url.includes("/api/visita")
      ) peticion.abort();
      else peticion.continue();
    });
    await pagina.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);

    for (const ancho of ANCHOS) {
      const movil = ancho <= 430;
      await pagina.setViewport({
        width: ancho,
        height: movil ? 844 : 900,
        deviceScaleFactor: movil ? 2 : 1,
        isMobile: movil,
        hasTouch: movil,
      });

      for (const ruta of rutas) {
        const respuesta = await pagina.goto(servidor.origen + ruta, { waitUntil: "domcontentloaded" });
        assert.equal(respuesta?.status(), 200, `${ruta} no cargó durante la auditoría responsive`);
        await pagina.evaluate(async () => {
          await document.fonts.ready;
          await new Promise((resolver) => requestAnimationFrame(() => requestAnimationFrame(resolver)));
        });

        const resultado = await pagina.evaluate(({ anchoEsperado, selectorCajas }) => {
          const tolerancia = 2;
          const problemas = [];
          const describir = (elemento) => {
            const id = elemento.id ? `#${elemento.id}` : "";
            const clases = typeof elemento.className === "string" && elemento.className.trim()
              ? `.${elemento.className.trim().split(/\s+/).slice(0, 4).join(".")}`
              : "";
            return `${elemento.tagName.toLowerCase()}${id}${clases}`;
          };
          const visible = (elemento) => {
            const estilo = getComputedStyle(elemento);
            const caja = elemento.getBoundingClientRect();
            return estilo.display !== "none" && estilo.visibility !== "hidden" && caja.width > 0 && caja.height > 0;
          };
          const protegidoPorScroll = (elemento, limite = null) => {
            for (let actual = elemento; actual && actual !== limite; actual = actual.parentElement) {
              const estilo = getComputedStyle(actual);
              if (/auto|scroll/.test(estilo.overflowX) && actual.scrollWidth > actual.clientWidth + tolerancia) {
                return true;
              }
            }
            return false;
          };
          const fuera = (recta, limite) =>
            recta.left < limite.left - tolerancia || recta.right > limite.right + tolerancia;

          if (innerWidth !== anchoEsperado) {
            problemas.push({ tipo: "viewport-escalado", esperado: anchoEsperado, real: innerWidth });
          }
          if (document.documentElement.scrollWidth > innerWidth + tolerancia) {
            problemas.push({
              tipo: "pagina-horizontal",
              viewport: innerWidth,
              contenido: document.documentElement.scrollWidth,
            });
          }

          const caminante = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          for (let nodo = caminante.nextNode(); nodo; nodo = caminante.nextNode()) {
            const inicio = nodo.data.search(/\S/);
            if (inicio < 0) continue;
            const padre = nodo.parentElement;
            if (!padre || !visible(padre) || padre.closest(".saltar, .solo-lectores")) continue;
            const fin = nodo.data.search(/\s*$/);
            const rango = document.createRange();
            rango.setStart(nodo, inicio);
            rango.setEnd(nodo, Math.max(inicio + 1, fin));
            const cajaLimite = padre.closest(selectorCajas);
            const limiteCaja = cajaLimite?.getBoundingClientRect();

            for (const recta of rango.getClientRects()) {
              if (recta.width < 0.5 || recta.height < 0.5) continue;
              if (!protegidoPorScroll(padre) && fuera(recta, { left: 0, right: innerWidth })) {
                problemas.push({
                  tipo: "texto-fuera-de-pantalla",
                  elemento: describir(padre),
                  texto: nodo.data.trim().replace(/\s+/g, " ").slice(0, 90),
                  izquierda: Number(recta.left.toFixed(1)),
                  derecha: Number(recta.right.toFixed(1)),
                });
              }
              if (
                cajaLimite &&
                !protegidoPorScroll(padre, cajaLimite.parentElement) &&
                fuera(recta, limiteCaja)
              ) {
                problemas.push({
                  tipo: "texto-fuera-de-caja",
                  caja: describir(cajaLimite),
                  elemento: describir(padre),
                  texto: nodo.data.trim().replace(/\s+/g, " ").slice(0, 90),
                  limiteIzquierdo: Number(limiteCaja.left.toFixed(1)),
                  limiteDerecho: Number(limiteCaja.right.toFixed(1)),
                  izquierda: Number(recta.left.toFixed(1)),
                  derecha: Number(recta.right.toFixed(1)),
                });
              }
              if (problemas.length >= 20) break;
            }
            if (problemas.length >= 20) break;
          }

          if (problemas.length < 20) {
            for (const elemento of document.querySelectorAll(`${selectorCajas} *`)) {
              if (!visible(elemento)) continue;
              const cajaLimite = elemento.parentElement?.closest(selectorCajas);
              if (!cajaLimite || protegidoPorScroll(elemento, cajaLimite.parentElement)) continue;
              const recta = elemento.getBoundingClientRect();
              const limite = cajaLimite.getBoundingClientRect();
              if (fuera(recta, limite)) {
                problemas.push({
                  tipo: "elemento-fuera-de-caja",
                  caja: describir(cajaLimite),
                  elemento: describir(elemento),
                  izquierda: Number(recta.left.toFixed(1)),
                  derecha: Number(recta.right.toFixed(1)),
                  limiteIzquierdo: Number(limite.left.toFixed(1)),
                  limiteDerecho: Number(limite.right.toFixed(1)),
                });
              }
              if (problemas.length >= 20) break;
            }
          }

          return problemas;
        }, { anchoEsperado: ancho, selectorCajas: CAJAS });

        if (resultado.length) fallos.push({ ancho, ruta, problemas: resultado });
      }
    }
  } finally {
    await pagina.close();
    await navegador.close();
    await servidor.cerrar();
  }

  assert.deepEqual(
    fallos,
    [],
    `se encontraron desbordamientos en ${fallos.length} combinaciones:\n${JSON.stringify(fallos, null, 2)}`,
  );
});
