/* Insets are injected CSS values, not a claim of physical iPhone coverage.
   Native Chromium touch scrolling is exercised independently of WebGL.
   A local lightweight motor records camera commands; neuro-interfaz covers GPU. */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { ejecutableChrome } from './chrome.mjs';

const root = fileURLToPath(new URL('..', import.meta.url)), output = resolve(root, 'publico');
const config = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));
const csp = config.headers.flatMap((rule) => rule.headers).find((item) => item.key === 'Content-Security-Policy').value;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
let browser, server, origin;
before(async () => {
  if (process.env.MOVIL_QA_SIN_BUILD !== '1') execFileSync(process.execPath, ['construir.js'], { cwd: root, stdio: 'pipe' });
  server = createServer((request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname;
    const file = resolve(output, `.${path}${path.endsWith('/') ? 'index.html' : ''}`);
    if (!file.startsWith(output + sep) || !existsSync(file) || !statSync(file).isFile()) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Content-Security-Policy': csp });
    createReadStream(file).pipe(response);
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done)); origin = `http://127.0.0.1:${server.address().port}`;
  browser = await puppeteer.launch({ executablePath: ejecutableChrome(), headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
});
after(async () => { await browser?.close(); if (server) await new Promise((done) => server.close(done)); });

async function pageFor(t, { width = 390, height = 844, entrance = false, model = false } = {}) {
  const page = await browser.newPage();
  const close = () => page.isClosed() ? Promise.resolve() : page.close().catch(() => {});
  t.signal.addEventListener('abort', close, { once: true });
  t.after(async () => { t.signal.removeEventListener('abort', close); await close(); });
  await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(10000);
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (model && request.url().endsWith('/activos/neuro-motor.js')) {
      void request.respond({ status: 200, contentType: 'text/javascript', body: `export async function crearModeloNeuro(canvas){return {render(s){canvas.dataset.probeYaw=String(s.yaw||0);canvas.dataset.probePitch=String(s.pitch||0)},resize(){},dispose(){},stats:{dpr:1,software:true}}}` });
    } else if (/\/_vercel\/|\/api\/visita/.test(request.url()) || request.resourceType() === 'media') void request.abort();
    else void request.continue();
  });
  await page.evaluateOnNewDocument((entrance) => {
    if (!entrance) sessionStorage.setItem('jsar:entrada-v2', '1');
    localStorage.setItem('jsar:escena-pausa', '1');
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) { return /webgl/i.test(type) ? null : get.call(this, type, ...args); };
  }, entrance);
  return { page, errors };
}

test('las áreas seguras simuladas protegen entrada, cabecera, contenido y mandos en vertical y apaisado', { timeout: 35000 }, async (t) => {
  for (const frame of [
    { width: 390, height: 844, top: 47, right: 0, bottom: 34, left: 0 },
    { width: 844, height: 390, top: 0, right: 59, bottom: 21, left: 59 },
  ]) {
    const { page, errors } = await pageFor(t, { ...frame, entrance: true });
    await page.goto(origin + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#puerta[open]');
    await page.evaluate((frame) => { for (const side of ['top', 'right', 'bottom', 'left']) document.documentElement.style.setProperty(`--safe-${side}`, `${frame[side]}px`); }, frame);
    const intro = await page.$eval('.umbral-cabecera', (element) => { const r = element.getBoundingClientRect(); return { top: r.top, left: r.left, right: r.right }; });
    assert.ok(intro.top >= frame.top + 8, `cabecera de entrada fuera del recorte superior: ${JSON.stringify({ frame, intro })}`);
    assert.ok(intro.left >= frame.left + 8 && intro.right <= frame.width - frame.right - 8, 'entrada respeta ambas zonas laterales');
    await page.$eval('#puerta', (dialog) => { dialog.scrollTop = dialog.scrollHeight; });
    const choice = await page.$eval('#entrar-en-silencio', (element) => { const r = element.getBoundingClientRect(); return { bottom: r.bottom, left: r.left, right: r.right }; });
    assert.ok(choice.bottom <= frame.height - frame.bottom, 'el botón no invade el indicador inferior al final del diálogo');
    await page.click('#entrar-en-silencio');
    await page.waitForFunction(() => !document.getElementById('puerta'));
    const boxes = await page.evaluate(() => {
      const rect = (selector) => { const r = document.querySelector(selector).getBoundingClientRect(); return { top: r.top, right: r.right, left: r.left, bottom: r.bottom }; };
      return { brand: rect('.marca'), content: rect('.portada-caja'), controls: rect('.direccion-escena'), music: rect('#mando'), overflow: document.documentElement.scrollWidth - innerWidth };
    });
    assert.ok(boxes.brand.top >= frame.top && boxes.brand.left >= frame.left + 8, 'la marca respeta el recorte superior y lateral');
    assert.ok(boxes.content.left >= frame.left + 8 && boxes.content.right <= frame.width - frame.right - 8, 'el texto principal respeta ambos bordes');
    assert.ok(boxes.controls.bottom <= frame.height - frame.bottom - 8 && boxes.controls.left >= frame.left + 8, 'los controles evitan el gesto inferior y el recorte lateral');
    assert.ok(boxes.music.bottom <= frame.height - frame.bottom - 8 && boxes.music.right <= frame.width - frame.right - 8, 'el mando musical evita el gesto inferior y el recorte lateral');
    assert.equal(boxes.overflow, 0); assert.deepEqual(errors, []);
    await page.close();
  }
});

test('los controles de ciencia y los mandos flotantes ofrecen blancos de al menos 44px al tacto', { timeout: 25000 }, async (t) => {
  const { page, errors } = await pageFor(t);
  for (const route of ['/ciencia/sinapsis/', '/ciencia/interferencia/']) {
    await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.ciencia');
    const targets = await page.$$eval('.neuro-rutas a, .neuro-visor-pie button, .neuro-control input, .ciencia-control input, #pausar-escena, #calidad-3d, #mando', (elements) => elements.map((element) => {
      const r = element.getBoundingClientRect(); return { target: element.id || element.className || element.textContent, width: r.width, height: r.height };
    }));
    assert.ok(targets.length > 3);
    assert.deepEqual(targets.filter((item) => item.width < 44 || item.height < 44), [], `blancos táctiles pequeños en ${route}`);
  }
  assert.deepEqual(errors, []);
});

test('los mandos flotantes conservan su separación con texto al 200% en móvil', { timeout: 25000 }, async (t) => {
  for (const width of [390, 320]) {
    const { page } = await pageFor(t, { width });
    await page.goto(origin + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.dataset.motor === 'respaldo');
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const controls = await page.evaluate(() => {
      const rect = (selector) => { const r = document.querySelector(selector).getBoundingClientRect(); return { left: r.left, right: r.right, width: r.width, height: r.height }; };
      return { scene: rect('.direccion-escena'), music: rect('#mando'), pause: rect('#pausar-escena'), quality: rect('#calidad-3d') };
    });
    assert.ok(controls.scene.right + 8 <= controls.music.left, `mandos separados a ${width}px: ${JSON.stringify(controls)}`);
    for (const control of [controls.pause, controls.quality, controls.music]) assert.ok(control.width >= 44 && control.height >= 44);
    await page.close();
  }
});

test('un gesto vertical iniciado en el visor desplaza la página y uno horizontal gira el modelo', { timeout: 25000 }, async (t) => {
  const { page, errors } = await pageFor(t, { model: true });
  await page.goto(origin + '/ciencia/memoria/', { waitUntil: 'domcontentloaded' });
  await page.$eval('#neuro-visor', (canvas) => canvas.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForFunction(() => document.getElementById('neuro-visor').dataset.neuroMotor === 'webgl');
  const box = await page.$eval('#neuro-visor', (canvas) => { const r = canvas.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const session = await page.createCDPSession(), beforeScroll = await page.evaluate(() => scrollY);
  // Raw touch events exercise Chromium's native pan recognizer. CDP's higher
  // level synthesizeScrollGesture does not scroll even a plain control page.
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x: box.x, y: box.y }] });
  for (let step = 1; step <= 6; step++) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 1, x: box.x, y: box.y - step * 30 }] });
    await new Promise((done) => setTimeout(done, 20));
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForFunction((before) => scrollY > before + 40, {}, beforeScroll);
  await page.$eval('#neuro-visor', (canvas) => canvas.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const nextBox = await page.$eval('#neuro-visor', (canvas) => { const r = canvas.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const yaw = await page.$eval('#neuro-visor', (canvas) => Number(canvas.dataset.probeYaw));
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, x: nextBox.x, y: nextBox.y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 1, x: nextBox.x + 65, y: nextBox.y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.ok(Math.abs(await page.$eval('#neuro-visor', (canvas) => Number(canvas.dataset.probeYaw)) - yaw) > 0.1);
  assert.deepEqual(errors, []);
});

test('un segundo puntero no sustituye el arrastre primario y perder la captura termina el gesto', { timeout: 25000 }, async (t) => {
  const { page, errors } = await pageFor(t, { model: true });
  await page.goto(origin + '/ciencia/memoria/', { waitUntil: 'domcontentloaded' });
  await page.$eval('#neuro-visor', (canvas) => canvas.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForFunction(() => document.getElementById('neuro-visor').dataset.neuroMotor === 'webgl');
  const state = await page.$eval('#neuro-visor', (canvas) => {
    // Synthetic pointer sequences isolate identity handling from browser pinch
    // recognition. Native scroll and horizontal touch are tested separately.
    canvas.setPointerCapture = () => {};
    const emit = (type, id, x, primary) => canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: id, pointerType: 'touch', isPrimary: primary, clientX: x, clientY: 250, button: 0 }));
    emit('pointerdown', 1, 100, true);
    emit('pointerdown', 2, 220, false);
    emit('pointermove', 2, 260, false);
    emit('pointermove', 1, 110, true);
    emit('pointerup', 2, 260, false);
    emit('pointermove', 1, 120, true);
    const beforeLost = Number(canvas.dataset.probeYaw);
    emit('lostpointercapture', 1, 120, true);
    emit('pointermove', 1, 170, true);
    return { beforeLost, afterLost: Number(canvas.dataset.probeYaw), pitch: Number(canvas.dataset.probePitch) };
  });
  assert.ok(Math.abs(state.beforeLost - 0.18) < 1e-9, 'el origen sigue siendo x=100 del puntero primario');
  assert.equal(state.afterLost, state.beforeLost); assert.equal(state.pitch, 0);
  assert.deepEqual(errors, []);
});
