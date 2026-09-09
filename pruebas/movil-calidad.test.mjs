import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import puppeteer from 'puppeteer-core';
import { ejecutableChrome } from './chrome.mjs';

// El reloj y el renderer se sustituyen para comprobar la política de calidad,
// no FPS ni rendimiento de un teléfono. Se ejecuta el controlador real.
test('Auto conserva la resolución aprendida al cambiar la altura o girar el móvil', { timeout: 20000 }, async () => {
  const controlador = readFileSync(new URL('../activos/cinematografia.js', import.meta.url), 'utf8');
  const calidad = readFileSync(new URL('../activos/calidad-3d.js', import.meta.url), 'utf8');
  const renderer = `export function crearObservatorio(){const stats={dpr:1,software:false};
    return {stats,resize(p){stats.dpr=p.dpr;window.ultimoTamano=p;},render(){},pick(){return null;}};}`;
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}canvas{display:block;width:100%;height:100px}</style></head><body><canvas id="observatorio"></canvas><button id="pausar-escena"></button>
    <select id="calidad-3d"><option value="auto">Auto</option><option value="alta">Alta</option><option value="ahorro">Ligera</option></select>
    <script type="module">import {iniciarCinematografia} from '/cinematografia.js';iniciarCinematografia();</script></body></html>`;
  const archivos = { '/': html, '/cinematografia.js': controlador, '/calidad-3d.js': calidad, '/observatorio-motor.js': renderer };
  const server = createServer((req,res) => {
    const data = archivos[req.url];
    res.writeHead(data === undefined ? 404 : 200, {'Content-Type': req.url === '/' ? 'text/html' : 'text/javascript'}).end(data || '');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: ejecutableChrome(), headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] });
    const page = await browser.newPage();
    await page.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
    await page.evaluateOnNewDocument(() => {
      const queue = new Map(); let id = 0;
      window.requestAnimationFrame = callback => { queue.set(++id, callback); return id; };
      window.cancelAnimationFrame = id => queue.delete(id);
      window.medirCuadrosLentos = () => {
        let now = performance.now();
        for (let n = 0; n < 125; n++) { now += 50; const next = [...queue.values()]; queue.clear(); next.forEach(callback => callback(now)); }
      };
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(() => document.body.dataset.motor === 'webgl', {polling:20});
    const inicial = await page.$eval('#observatorio', c => Number(c.dataset.dpr));
    await page.evaluate(() => window.medirCuadrosLentos());
    const aprendido = await page.$eval('#observatorio', c => Number(c.dataset.dpr));
    assert.ok(aprendido < inicial, 'el controlador debe adaptar Auto durante el intervalo lento simulado');
    for (const [width,height] of [[390,740],[390,900],[844,390]]) {
      await page.setViewport({width,height,deviceScaleFactor:2,isMobile:true,hasTouch:true});
      await page.waitForFunction((height) => window.ultimoTamano.height === height, {polling:20}, height);
      assert.ok(await page.$eval('#observatorio', (c, limite) => Number(c.dataset.dpr) <= limite, aprendido),
        'ocultar la barra del navegador o girar el teléfono no debe subir la resolución que Auto redujo');
    }
    await page.select('#calidad-3d','alta');
    assert.equal(await page.$eval('#observatorio', c => Number(c.dataset.dpr)), 2, 'elegir Alta explícitamente permite elevar la resolución');
    await page.select('#calidad-3d','auto');
    assert.equal(await page.$eval('#observatorio', c => Number(c.dataset.dpr)), inicial, 'elegir Auto de nuevo inicia otra medición');
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
});
