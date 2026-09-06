import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import { ejecutableChrome } from "./chrome.mjs";

test("el panel privado filtra, explica el mapa y mantiene el rastro dentro de la pantalla", { timeout: 45_000 }, async () => {
  const [javascript, baseCss, cinemaCss] = await Promise.all([readFile(new URL("../activos/admin.js", import.meta.url), "utf8"), readFile(new URL("../activos/estilos.css", import.meta.url), "utf8"), readFile(new URL("../activos/cinematografia.css", import.meta.url), "utf8")]);
  const css = `${baseCss}\n${cinemaCss}`;
  const first = { id: "b40fba79-3af1-4f8f-a401-d1a14fa363ec", hora: "2026-09-06T12:00:00.000Z", ruta: "/blog/", ciudad: "Bogotá", pais: "Colombia", dispositivo: "Móvil", sistema: "iOS", navegador: "Safari", referente: "Directo", vpn: "no evaluada", conexion: { estado: "cifrada", fuente: "Proxy de Vercel", ip: "2001:db8:0000:0000:0000:0000:0000:0001", diario: "a".repeat(24) }, peticion: "bog1::iad1::rastro-ficticio-extendido-para-verificar-desbordamiento", ubicacion: { latitud: 4.71, longitud: -74.07, fuente: "Vercel GeoIP" } };
  const data = { resumen: { total: 250, porDispositivo: { Móvil: 200, Robot: 50 } }, recientes: [first, { ...first, id: "c40fba79-3af1-4f8f-a401-d1a14fa363ec", ciudad: "<img src=x onerror=alert(1)>", ruta: "/proyectos/", dispositivo: "Robot", vpn: "detectada", conexion: {}, ubicacion: null }], nota: "Datos ficticios de prueba", periodoDias: 2 };
  const server = createServer((req, res) => {
    const path = new URL(req.url, "http://127.0.0.1").pathname;
    if (path.startsWith("/api/")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(path.endsWith("/sesion") ? { autenticada: true, usuario: "Prueba" } : path.endsWith("/auditoria") ? data : { escritos: [] }));
    } else if (path === "/admin.js") { res.writeHead(200, { "Content-Type": "text/javascript" }).end(javascript); }
    else if (path === "/estilos.css") { res.writeHead(200, { "Content-Type": "text/css" }).end(css); }
    else { res.writeHead(200, { "Content-Type": "text/html" }).end('<!doctype html><html lang="es"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/estilos.css"><title>Prueba de auditoría</title><body><main class="admin-marco"><div id="admin-app" class="scrim ancho"></div></main><script src="/admin.js" type="module"></script></body></html>'); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const browser = await puppeteer.launch({ executablePath: ejecutableChrome(), headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.setDefaultTimeout(5000);
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForSelector(".admin-cabecera");
    const buttons = await page.$$(".admin-cabecera nav button");
    await buttons[1].click();
    try { await page.waitForSelector(".admin-ingreso"); }
    catch { assert.fail(`No cargó auditoría: ${await page.$eval("#admin-app", (node) => node.textContent)}; ${errors.join(", ")}`); }
    const totals = await page.$$eval(".admin-tarjetas strong", (nodes) => nodes.map((node) => node.textContent));
    assert.deepEqual(totals, ["250", "200", "50", "2"]);
    const map = await page.$eval(".admin-mapa-enlace", (node) => ({ href: node.href, rel: node.rel }));
    assert.equal(map.href, "https://www.openstreetmap.org/#map=10/4.71/-74.07");
    assert.match(map.rel, /noreferrer/);
    assert.equal(await page.$(".admin-ingreso img"), null);
    await page.select(".admin-auditoria-filtros select", "robot");
    assert.equal(await page.$$eval(".admin-ingreso:not([hidden])", (nodes) => nodes.length), 1);
    await page.select(".admin-auditoria-filtros select", "todas");
    await page.type(".admin-auditoria-filtros input", "2001:db8");
    assert.equal(await page.$$eval(".admin-ingreso:not([hidden])", (nodes) => nodes.length), 1);
    await page.$eval(".admin-auditoria-filtros input", (node) => { node.value = ""; node.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.$$eval(".admin-ingreso-detalle", (nodes) => nodes.forEach((node) => { node.open = true; }));
    for (const width of [320, 390, 1440]) {
      await page.setViewport({ width, height: 850 });
      const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, buttons: Array.from(document.querySelectorAll(".admin-ingreso summary, .admin-mapa-enlace")).map((node) => node.getBoundingClientRect().height) }));
      assert.ok(dimensions.scroll <= dimensions.width + 1, `desborda ${width}px: ${dimensions.scroll}px`);
      assert.ok(dimensions.buttons.every((height) => height >= 44), `control técnico menor de 44px a ${width}px`);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
