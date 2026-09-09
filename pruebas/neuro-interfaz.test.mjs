/* UI contracts: calculations remain usable without WebGL; two bounded GPU
   cases exercise real meshes, keyboard operation, pause and context lifecycle. */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { ejecutableChrome } from './chrome.mjs';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const publico = resolve(raiz, 'publico');
const config = JSON.parse(readFileSync(resolve(raiz, 'vercel.json'), 'utf8'));
const csp = config.headers.flatMap((rule) => rule.headers).find((header) => header.key === 'Content-Security-Policy').value;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
let browser, server, origin;

before(async () => {
  execFileSync(process.execPath, ['construir.js'], { cwd: raiz, stdio: 'pipe' });
  server = createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = resolve(publico, `.${pathname}${pathname.endsWith('/') ? 'index.html' : ''}`);
    if (!file.startsWith(publico + sep) || !existsSync(file) || !statSync(file).isFile()) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Content-Security-Policy': csp });
    createReadStream(file).pipe(response);
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await puppeteer.launch({ executablePath: ejecutableChrome(), headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
});
after(async () => { await browser?.close(); if (server) await new Promise((done) => server.close(done)); });

async function pageFor(t, { gpu = false, paused = true, width = 1100 } = {}) {
  const page = await browser.newPage();
  const close = () => page.isClosed() ? Promise.resolve() : page.close().catch(() => {});
  t.signal.addEventListener('abort', close, { once: true });
  t.after(async () => { t.signal.removeEventListener('abort', close); await close(); });
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (/\/_vercel\/|\/api\/visita/.test(request.url()) || request.resourceType() === 'media') void request.abort();
    else void request.continue();
  });
  await page.evaluateOnNewDocument(({ gpu, paused }) => {
    sessionStorage.setItem('jsar:entrada-v2', '1');
    localStorage.setItem('jsar:escena-pausa', paused ? '1' : '0');
    if (!gpu) {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) { return /webgl/i.test(type) ? null : get.call(this, type, ...args); };
    }
    const create = URL.createObjectURL;
    URL.createObjectURL = function (blob) { if (blob.type.startsWith('text/csv')) window.__csv = blob; return create.call(this, blob); };
    const click = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (this.download.endsWith('.csv')) { window.__csvFilename = this.download; return; } return click.call(this); };
  }, { gpu, paused });
  return { page, errors };
}

async function load(page, tipo) {
  await page.goto(`${origin}/ciencia/${tipo}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#neuro-visor')?.__neuroEstado?.serie?.length > 0);
}

for (const [tipo, field, value] of [['sinapsis', 'u', 0.5], ['dopamina', 'km', 0.35], ['memoria', 'w', 1.6]]) {
  test(`${tipo}: parámetros, solución, gráfica y CSV funcionan aunque falte WebGL`, { timeout: 35000 }, async (t) => {
    const { page, errors } = await pageFor(t);
    await load(page, tipo);
    const original = await page.$eval(`[name="${field}"]`, (input) => input.value);
    const initialPath = await page.$eval('[data-neuro-grafica] .neuro-chart-linea', (path) => path.getAttribute('d'));
    await page.$eval(`[name="${field}"]`, (input, value) => { input.value = String(value); input.dispatchEvent(new Event('input', { bubbles: true })); }, value);
    await page.waitForFunction((field, value) => document.getElementById('neuro-visor').__neuroEstado.parametros[field] === value, {}, field, value);
    assert.notEqual(await page.$eval('[data-neuro-grafica] .neuro-chart-linea', (path) => path.getAttribute('d')), initialPath);
    const solution = await page.$eval('#neuro-visor', (canvas) => canvas.__neuroEstado.accion);
    assert.ok(solution && Number.isFinite(solution.valor));
    await page.click('[data-neuro-resolver]');
    const applied = await page.$eval(`[name="${solution.campo}"]`, (input) => Number(input.value));
    assert.ok(Math.abs(applied - solution.valor) < 1e-7, 'el control aplica la solución calculada sin recortarla al rango anterior');
    assert.ok((await page.$eval('[data-neuro-conclusion]', (element) => element.textContent)).length > 60);
    const axes = await page.$eval('[data-neuro-grafica] svg', (svg) => svg.textContent);
    assert.match(axes, /ms/);
    if (tipo === 'dopamina') assert.ok(await page.$('[data-neuro-region] polygon'));
    await page.click('[data-neuro-descargar]');
    const csv = await page.evaluate(async () => ({ name: window.__csvFilename, text: await window.__csv.text() }));
    assert.equal(csv.name, `estudio-${tipo}.csv`);
    assert.match(csv.text, /Datos sintéticos/);
    const rows = csv.text.split('\n').filter((row) => !row.startsWith('#'));
    assert.match(rows[0], /tMs/);
    assert.ok(rows.length > 20);
    assert.ok(rows.slice(1).every((row) => row.split(',').every((value) => Number.isFinite(Number(value)))));
    await page.click('[data-neuro-form] [type="reset"]');
    await page.waitForFunction((field, value) => document.getElementById('neuro-visor').__neuroEstado.parametros[field] === Number(value), {}, field, original);
    await page.$eval('#neuro-visor', (canvas) => canvas.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForFunction(() => document.getElementById('neuro-visor').dataset.neuroMotor === 'respaldo');
    assert.equal(await page.$eval('.neuro-respaldo', (element) => element.hidden), false);
    assert.deepEqual(errors, []);
  });
}

test('los modelos WebGL responden al teclado en pausa y PJAX libera su contexto conservando el observatorio', { timeout: 55000 }, async (t) => {
  const { page, errors } = await pageFor(t, { gpu: true });
  await load(page, 'sinapsis');
  await page.$eval('#neuro-visor', (canvas) => canvas.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForFunction(() => document.getElementById('neuro-visor').dataset.neuroMotor === 'webgl' && document.body.dataset.motor === 'webgl');
  await page.evaluate(() => { window.__background = document.getElementById('observatorio'); window.__backgroundGl = window.__background.getContext('webgl2'); });
  const before = await page.$eval('#neuro-visor', (canvas) => Number(canvas.dataset.frames));
  await new Promise((done) => setTimeout(done, 180));
  assert.equal(await page.$eval('#neuro-visor', (canvas) => Number(canvas.dataset.frames)), before);
  await page.focus('#neuro-visor');
  await page.keyboard.press('ArrowRight');
  assert.ok(await page.$eval('#neuro-visor', (canvas, before) => Number(canvas.dataset.frames) > before, before));
  for (const tipo of ['dopamina', 'memoria']) {
    await page.evaluate(() => { window.__oldModel = document.getElementById('neuro-visor'); window.__oldGl = window.__oldModel.getContext('webgl2'); });
    await page.$eval(`.neuro-rutas a[href="/ciencia/${tipo}/"]`, (link) => link.click());
    await page.waitForFunction((tipo) => document.getElementById('neuro-visor')?.dataset.modeloNeuro === tipo, {}, tipo);
    await page.$eval('#neuro-visor', (canvas) => canvas.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForFunction(() => document.getElementById('neuro-visor').dataset.neuroMotor === 'webgl');
    const continuity = await page.evaluate(() => ({ detached: !window.__oldModel.isConnected, released: window.__oldGl.isContextLost(),
      sameCanvas: window.__background === document.getElementById('observatorio'), sameContext: window.__backgroundGl === document.getElementById('observatorio').getContext('webgl2') }));
    assert.deepEqual(continuity, { detached: true, released: true, sameCanvas: true, sameContext: true });
  }
  assert.deepEqual(errors, []);
});

test('el tiempo calculado anima el modelo y movimiento reducido detiene cuadros y sincroniza el control', { timeout: 40000 }, async (t) => {
  const { page, errors } = await pageFor(t, { gpu: true, paused: false, width: 800 });
  await load(page, 'memoria');
  await page.$eval('#neuro-visor', (canvas) => canvas.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForFunction(() => Number(document.getElementById('neuro-visor').dataset.tiempoModelo) > 0);
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.waitForFunction(() => document.querySelector('[data-neuro-vista="pausa"]').disabled && document.querySelector('[data-neuro-vista="pausa"]').getAttribute('aria-pressed') === 'true');
  const before = await page.$eval('#neuro-visor', (canvas) => ({ frames: canvas.dataset.frames, time: canvas.dataset.tiempoModelo }));
  await new Promise((done) => setTimeout(done, 200));
  assert.deepEqual(await page.$eval('#neuro-visor', (canvas) => ({ frames: canvas.dataset.frames, time: canvas.dataset.tiempoModelo })), before);
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await page.waitForFunction((before) => Number(document.getElementById('neuro-visor').dataset.frames) > Number(before), {}, before.frames);
  assert.deepEqual(errors, []);
});

test('dopamina: aplicar una capacidad superior al rango inicial conserva una región compatible y bandas válidas', { timeout: 35000 }, async (t) => {
  const { page, errors } = await pageFor(t);
  await load(page, 'dopamina');
  await page.$eval('[data-neuro-form]', (form) => {
    for (const [name, value] of Object.entries({ c0: 3, km: 0.6, objetivo: 0.02, plazoMs: 100, incertidumbre: 1 })) form.elements.namedItem(name).value = String(value);
    form.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(() => document.getElementById('neuro-visor').__neuroEstado.parametros.plazoMs === 100);
  await page.click('[data-neuro-resolver]');
  await page.waitForFunction(() => Number(document.querySelector('[name="vmax"]').value) > 0.05);
  assert.ok(await page.$('[data-neuro-region] polygon'), 'las lecturas sintéticas deben seguir admitiendo los parámetros que las generaron, aunque V supere 0,02');
  const paths = await page.$$eval('[data-neuro-grafica] path', (elements) => elements.map((element) => element.getAttribute('d')));
  assert.ok(paths.every((path) => path && !/^\s*Z\s*$/i.test(path) && !/NaN|Infinity/.test(path)), 'la banda no emite un cierre SVG sin vértices');
  assert.doesNotMatch(await page.$eval('[data-neuro-conclusion]', (element) => element.textContent), /0 vértices/);
  assert.deepEqual(errors, []);
});

test('sinapsis: el peor caso del intervalo nominal usa el parámetro central que muestra el formulario', { timeout: 35000 }, async (t) => {
  const { page, errors } = await pageFor(t);
  await load(page, 'sinapsis');
  await page.$eval('[data-neuro-form]', (form) => {
    for (const [name, value] of Object.entries({ u: 0.8, tauMs: 500, objetivo: 0.18, incertidumbre: 40 })) form.elements.namedItem(name).value = String(value);
    form.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForFunction(() => document.getElementById('neuro-visor').__neuroEstado.parametros.u === 0.8);
  // Independent fixed case: Δnominal=104.424155563692 ms for u=.8, τ=500.
  // At umin=.48 and τmax=700, q∞=0.120493686617; clipping umax at1
  // must not substitute the uncertainty interval midpoint (.74) for UI u=.8.
  const result = await page.$eval('[data-neuro-conclusion]', (element) => element.textContent);
  assert.ok(result.includes('peor caso sólo sostiene 0,12.'), `la conclusión debe usar el intervalo nominal mostrado: ${result}`);
  const nominal = await page.$$eval('[data-neuro-resultados] .neuro-medida', (elements) => elements.find((element) => element.textContent.includes('Intervalo mínimo nominal'))?.textContent || '');
  assert.match(nominal, /104,4\s*ms/);
  assert.deepEqual(errors, []);
});
