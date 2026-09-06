import test from "node:test";
import assert from "node:assert/strict";

import { execFileSync } from "node:child_process";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import puppeteer from "puppeteer-core";

import { readPublicationInventory } from "../lib/publicacion-programada.js";
import { pagina as paginaHtml } from "../plantilla.js";
import { ejecutableChrome } from "./chrome.mjs";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const construido = resolve(raiz, "publico");

const tipos = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
]);

const PUBLICACION = readPublicationInventory({
  VERCEL_ENV: "preview",
  ORO_PRIVATE_PREVIEW: "1",
  VERCEL_URL: "estudio-privado.vercel.app",
  ORO_REVIEW_REVISION: "a".repeat(40),
  ORO_REVIEW_TREE: "b".repeat(40),
  ORO_REVIEW_ARTICLE_SHA256: "c".repeat(64),
  ORO_REVIEW_BODY_SHA256: "d".repeat(64),
  ORO_REVIEW_PROJECT_SHA256: "e".repeat(64),
  ORO_REPLICA_STATE: "closed",
  ORO_REPLICA_CUTOFF: "2026-09-05",
  ORO_REPLIES_COUNT: "0",
});

test("los controles cinematográficos flotantes no interceptan la administración", () => {
  const parametros = { titulo: "Prueba", descripcion: "Prueba de controles", cuerpo: "<main>Panel</main>" };
  const admin = paginaHtml({ ...parametros, ruta: "/admin/" });
  assert.doesNotMatch(admin, /class="direccion-escena"|id="mando"/);
  const publica = paginaHtml({ ...parametros, ruta: "/blog/" });
  assert.match(publica, /class="direccion-escena"/);
  assert.match(publica, /id="mando"/);
});

async function servirPublico() {
  const servidor = createServer((peticion, respuesta) => {
    const url = new URL(peticion.url || "/", "http://127.0.0.1");
    let relativa = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    if (!relativa || url.pathname.endsWith("/")) relativa += "index.html";
    const archivo = resolve(construido, relativa);
    if (!archivo.startsWith(construido + sep) || !existsSync(archivo) || !statSync(archivo).isFile()) {
      respuesta.writeHead(404).end("No encontrado");
      return;
    }
    respuesta.writeHead(200, { "Content-Type": tipos.get(extname(archivo)) || "application/octet-stream", "Cache-Control": "no-store" });
    createReadStream(archivo).pipe(respuesta);
  });
  await new Promise((resolver, rechazar) => {
    servidor.once("error", rechazar);
    servidor.listen(0, "127.0.0.1", resolver);
  });
  return {
    origen: `http://127.0.0.1:${servidor.address().port}`,
    cerrar: () => new Promise((resolver, rechazar) => servidor.close((error) => error ? rechazar(error) : resolver())),
  };
}

test("la dirección privada solo se dibuja tras autenticar y la auditoría cabe en móvil", { timeout: 90_000 }, async () => {
  const chrome = ejecutableChrome();
  assert.ok(chrome, "la prueba del panel privado necesita Chrome");
  execFileSync(process.execPath, ["construir.js"], { cwd: raiz, stdio: "pipe" });

  const servidor = await servirPublico();
  const navegador = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  let pagina = await navegador.newPage();
  let autenticada = false;
  let publicacionRespuesta = PUBLICACION;
  let erroresPagina = [];

  const configurarPagina = async (objetivo) => {
    objetivo.setDefaultTimeout(10_000);
    objetivo.setDefaultNavigationTimeout(10_000);
    await objetivo.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    objetivo.on("pageerror", (error) => erroresPagina.push(error.message));
    await objetivo.setRequestInterception(true);
    objetivo.on("request", (peticion) => {
      const ruta = new URL(peticion.url()).pathname;
      if (ruta === "/api/auth/sesion") {
        peticion.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(autenticada
            ? { autenticada: true, csrf: "csrf-de-prueba", usuario: "Jhon Steven" }
            : { autenticada: false }),
        });
        return;
      }
      if (ruta === "/api/admin/escritos") {
        peticion.respond({ status: 200, contentType: "application/json", body: JSON.stringify({ escritos: [] }) });
        return;
      }
      if (ruta === "/api/admin/auditoria") {
        peticion.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            publicacion: publicacionRespuesta,
            audiencia: { disponible: false, codigo: "credencial_omitida_en_preview_privada" },
            resumen: { total: 0, porCiudad: {}, porPais: {}, porRuta: {}, porReferente: {}, porCampana: {}, porDispositivo: {}, porVpn: {} },
            recientes: [],
            periodoDias: 0,
            nota: "Auditoría de prueba.",
          }),
        });
        return;
      }
      peticion.continue();
    });
  };
  await configurarPagina(pagina);

  try {
    await pagina.setViewport({ width: 320, height: 800, deviceScaleFactor: 2 });
    await pagina.goto(`${servidor.origen}/admin/`, { waitUntil: "domcontentloaded" });
    await pagina.waitForSelector(".admin-login");
    assert.ok(await pagina.$(".admin-login"), "la sesión cerrada debe mostrar el acceso");
    assert.equal(await pagina.$(".admin-vista-previa"), null, "la sesión cerrada no debe dibujar la dirección privada");

    autenticada = true;
    await pagina.close();
    pagina = null;
    erroresPagina = [];
    pagina = await navegador.newPage();
    await configurarPagina(pagina);
    await pagina.setViewport({ width: 320, height: 800, deviceScaleFactor: 2 });
    await pagina.goto(`${servidor.origen}/admin/`, { waitUntil: "domcontentloaded" });
    try {
      await pagina.waitForSelector(".admin-cabecera");
    } catch (error) {
      const texto = await pagina.evaluate(() => document.body.textContent).catch(() => "sin DOM");
      throw new Error(`el panel no cargó: ${erroresPagina.join(" | ") || error.message}; DOM: ${texto.slice(0, 400)}`);
    }
    const navegacionPrivada = await pagina.$$(".admin-cabecera nav button");
    assert.ok(navegacionPrivada.length >= 2);
    await navegacionPrivada[1].click();
    try {
      await pagina.waitForSelector(".admin-publicacion .admin-vista-previa");
    } catch (error) {
      const diagnostico = await pagina.evaluate(() => ({
        aviso: document.querySelector(".admin-aviso")?.textContent,
        contenido: document.querySelector(".admin-contenido")?.textContent.slice(0, 500),
      }));
      throw new Error(`el panel de publicación no abrió: ${error.message}; ${JSON.stringify(diagnostico)}; errores: ${erroresPagina.join(" | ")}`);
    }

    for (const medida of [
      { ancho: 320, alto: 800, movil: true },
      { ancho: 390, alto: 844, movil: true },
      { ancho: 1440, alto: 900, movil: false },
    ]) {
      if (medida.ancho !== 320) {
        const anterior = pagina;
        pagina = await navegador.newPage();
        await anterior.close();
        erroresPagina = [];
        await configurarPagina(pagina);
        await pagina.setViewport({ width: medida.ancho, height: medida.alto, deviceScaleFactor: medida.movil ? 2 : 1 });
        await pagina.goto(`${servidor.origen}/admin/`, { waitUntil: "domcontentloaded" });
        await pagina.waitForSelector(".admin-cabecera");
        const navegacion = await pagina.$$(".admin-cabecera nav button");
        assert.ok(navegacion.length >= 2);
        await navegacion[1].click();
        await pagina.waitForSelector(".admin-publicacion .admin-vista-previa");
      }
      const geometria = await pagina.evaluate(() => {
        const seccion = document.querySelector(".admin-publicacion");
        const enlace = document.querySelector(".admin-vista-previa");
        const recta = seccion.getBoundingClientRect();
        const boton = enlace.getBoundingClientRect();
        return {
          anchoVista: innerWidth,
          anchoDocumento: document.documentElement.scrollWidth,
          izquierda: recta.left,
          derecha: recta.right,
          botonAlto: boton.height,
          href: enlace.href,
          compuertas: document.querySelectorAll(".admin-lista-control li").length,
          entregables: document.querySelectorAll(".admin-entregables article").length,
          texto: seccion.textContent,
          textoPanel: document.querySelector(".admin-auditoria-conjunto").textContent,
        };
      });

      assert.ok(geometria.anchoDocumento <= geometria.anchoVista + 2, `hay desbordamiento a ${medida.ancho}px`);
      assert.ok(geometria.izquierda >= -2 && geometria.derecha <= geometria.anchoVista + 2, `la publicación sale de pantalla a ${medida.ancho}px`);
      assert.ok(geometria.botonAlto >= 44, `el enlace privado mide menos de 44 px a ${medida.ancho}px`);
      assert.equal(geometria.href, PUBLICACION.visibilidad.url);
      assert.equal(geometria.compuertas, PUBLICACION.compuertas.length);
      assert.equal(geometria.entregables, PUBLICACION.entregables.length);
      for (const texto of ["Resultado final privado", "0 de 3 casos", "0 de 12 casillas", "2 ramas", "Requiere autorización", "Espera tu aprobación", "11 de 12 aprobadas", "Sin fecha automática", "Deshabilitado", "Sujetos consultados", "DSN de rebote", "TODO(dato) sistemas reconciliados", "Actos primarios identificados: 2", "Coincidencia nominal con inventario atribuido: null · TODO(dato)", "Entradas totales de la matriz: 28", "dentro del sitio, este panel es el único lugar que revela el enlace", "Sello del resultado final", "Commit aprobado", "SHA-256 del HTML", "SHA-256 del cuerpo editorial", "SHA-256 del proyecto Vercel", "Deployment revisado", "Cualquier cambio invalida la aprobación", "Pantallas cronometradas", "Comprobaciones funcionales", "Fin de la métrica", "Teselas durante auditoría", "Compuertas técnicas de salida", "Lo que quedó creado", "Pruebas de publicación", "Límites declarados"]) {
        assert.ok(geometria.texto.includes(texto), `falta «${texto}» a ${medida.ancho}px`);
      }
      assert.ok(geometria.textoPanel.includes("Audiencia omitida en esta vista previa"));
      assert.ok(!geometria.textoPanel.includes("Ingresos auditados"), "el panel no debe presentar el cero técnico como audiencia medida");
      assert.ok(!geometria.texto.includes("No disponible"), "el contrato de publicación debe quedar completamente rotulado");
    }
    publicacionRespuesta = readPublicationInventory({
      VERCEL_ENV: "production",
      ORO_PUBLICATION_STATE: "published",
      ORO_USER_APPROVAL_STATE: "approved",
      ORO_RELEASE_HUELLA: "a".repeat(64),
      ORO_REPLIES_COUNT: "2",
      ORO_PUBLICATION_DATE: "2026-09-06",
      ORO_REPLICA_STATE: "closed",
      ORO_REPLICA_CUTOFF: "2026-09-06",
    });
    const anterior = pagina;
    pagina = await navegador.newPage();
    await anterior.close();
    erroresPagina = [];
    await configurarPagina(pagina);
    await pagina.setViewport({ width: 320, height: 800, deviceScaleFactor: 2 });
    await pagina.goto(`${servidor.origen}/admin/`, { waitUntil: "domcontentloaded" });
    await pagina.waitForSelector(".admin-cabecera");
    const botonesPublicados = await pagina.$$(".admin-cabecera nav button");
    await botonesPublicados[1].click();
    await pagina.waitForSelector(".admin-publicacion .admin-articulo-publico");
    const publicada = await pagina.evaluate(() => {
      const enlace = document.querySelector(".admin-articulo-publico");
      return {
        anchoVista: innerWidth,
        anchoDocumento: document.documentElement.scrollWidth,
        altoBoton: enlace.getBoundingClientRect().height,
        href: enlace.href,
        texto: document.querySelector(".admin-publicacion").textContent,
      };
    });
    assert.ok(publicada.anchoDocumento <= publicada.anchoVista + 2, "el estado publicado se desborda a 320 px");
    assert.ok(publicada.altoBoton >= 44, "el enlace público mide menos de 44 px");
    assert.equal(publicada.href, `${servidor.origen}/blog/oro-perimetros/`);
    for (const texto of ["Publicación verificada", "Publicada", "12 de 12 aprobadas", "Cerrada", "Publicado"]) {
      assert.ok(publicada.texto.includes(texto), `falta «${texto}» en el estado publicado`);
    }
  } finally {
    if (pagina) await pagina.close().catch(() => {});
    await navegador.close();
    await servidor.cerrar();
  }
});

test("el cliente no incrusta la ruta privada y rechaza protocolos ajenos a HTTPS", () => {
  const javascript = readFileSync(resolve(raiz, "activos/admin.js"), "utf8");
  assert.doesNotMatch(javascript, /estudio-privado\.vercel\.app/);
  assert.match(javascript, /url\.protocol === "https:"/);
  assert.match(javascript, /url\.hostname\.endsWith\("\.vercel\.app"\)/);
  assert.match(javascript, /const urlPrevia = direccionVistaPrevia\(visibilidad\.url\)/);
  assert.match(javascript, /if \(urlPrevia\)/);
  assert.match(javascript, /publicacion\.estado === "publicada"/);
  assert.match(javascript, /direccionArticuloPublico\(visibilidad\.rutaPublica\)/);
  assert.match(javascript, /admin-articulo-publico/);
  assert.match(javascript, /url\.origin === window\.location\.origin/);
  assert.doesNotMatch(javascript, /innerHTML/);
});
