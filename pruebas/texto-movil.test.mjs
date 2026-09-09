// Regresión de texto ampliado: duplicar la raíz CSS ejercita unidades rem y
// mínimos intrínsecos. Esta prueba no equivale al zoom nativo del navegador.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { ejecutableChrome } from './chrome.mjs';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const publico = resolve(raiz, 'publico');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

test('texto al 200% conserva métricas, invitación científica, epígrafe y pie en móvil', { timeout: 60_000 }, async (t) => {
  execFileSync(process.execPath, ['construir.js'], { cwd: raiz, stdio: 'pipe' });
  const servidor = createServer((req, res) => {
    let ruta = new URL(req.url, 'http://localhost').pathname;
    if (ruta.endsWith('/')) ruta += 'index.html';
    const archivo = resolve(publico, '.' + ruta);
    if (!archivo.startsWith(publico + sep) || !existsSync(archivo) || !statSync(archivo).isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': tipos[extname(archivo)] || 'application/octet-stream' });
    createReadStream(archivo).pipe(res);
  });
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  const origen = `http://127.0.0.1:${servidor.address().port}`;
  let navegador;
  try {
    navegador = await puppeteer.launch({ executablePath: ejecutableChrome(), headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const pagina = await navegador.newPage();
    await pagina.setRequestInterception(true);
    pagina.on('request', (req) => {
      if (!req.url().startsWith(origen) || /observatorio-motor|neuro-motor|\/api\/|\/_vercel\//.test(req.url()) || req.resourceType() === 'media') req.abort();
      else req.continue();
    });
    await pagina.evaluateOnNewDocument(() => {
      try { sessionStorage.setItem('jsar:entrada-v2', '1'); } catch { /* about:blank */ }
      const contexto = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (tipo, ...args) {
        return tipo.includes('webgl') ? null : contexto.call(this, tipo, ...args);
      };
    });
    await pagina.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    for (const ancho of [320, 390]) {
      await pagina.setViewport({ width: ancho, height: 844, isMobile: true, hasTouch: true });
      for (const ruta of ['/', '/ciencia/dopamina/', '/proyectos/polidinamica-inteligencia-leads/']) {
        await t.test(`${ruta} a ${ancho}px con raíz de 32px`, async () => {
          const respuesta = await pagina.goto(origen + ruta, { waitUntil: 'networkidle0' });
          assert.equal(respuesta.status(), 200);
          await pagina.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
          await pagina.waitForFunction(() => {
            const cifra = document.querySelector('.metrica .cifra');
            return getComputedStyle(document.documentElement).fontSize === '32px' &&
              (!cifra || parseFloat(getComputedStyle(cifra).fontSize) >= 60);
          }, { timeout: 5_000 });
          const resultado = await pagina.evaluate(async () => {
            await document.fonts.ready;
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
            const fallos = [];
            // Cada texto se mide contra su contenedor y contra clientWidth:
            // en móvil innerWidth puede crecer junto al contenido desbordado.
            // O(n + g) tiempo, O(f) espacio: nodos, rectángulos y fallos.
            const cajas = document.querySelectorAll('.metricas, .ciencia-invitacion, .epigrafe .plancha, .pie-caja');
            for (const caja of cajas) {
              const borde = caja.getBoundingClientRect();
              const caminar = document.createTreeWalker(caja, NodeFilter.SHOW_TEXT);
              for (let nodo = caminar.nextNode(); nodo; nodo = caminar.nextNode()) {
                const inicio = nodo.data.search(/\S/);
                if (inicio < 0 || nodo.parentElement.closest('[aria-hidden="true"],.solo-lectores')) continue;
                const rango = document.createRange();
                rango.setStart(nodo, inicio);
                rango.setEnd(nodo, nodo.data.trimEnd().length);
                for (const r of rango.getClientRects()) {
                  if (r.width < .5 || r.height < .5) continue;
                  if (r.left < Math.max(0, borde.left) - 2 || r.right > Math.min(document.documentElement.clientWidth, borde.right) + 2) {
                    fallos.push({ caja: caja.className, texto: nodo.data.trim(), izquierda: r.left, derecha: r.right, limite: borde.right });
                  }
                }
              }
            }
            return {
              ancho: innerWidth, client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth,
              raiz: getComputedStyle(document.documentElement).fontSize,
              cifra: document.querySelector('.metrica .cifra') ? parseFloat(getComputedStyle(document.querySelector('.metrica .cifra')).fontSize) : null,
              fallos,
            };
          });
          assert.equal(resultado.raiz, '32px', 'la prueba mantiene la ampliación de texto');
          if (resultado.cifra !== null) assert.ok(resultado.cifra >= 60, `la cifra conserva su tamaño ampliado: ${resultado.cifra}px`);
          assert.deepEqual(resultado.fallos, [], JSON.stringify(resultado));
          assert.equal(resultado.client, ancho);
          assert.ok(resultado.scroll <= ancho + 2, `scrollWidth ${resultado.scroll} > ${ancho}`);
          assert.equal(resultado.ancho, ancho, 'el contenido no ensancha el viewport móvil');
        });
      }
    }
  } finally {
    await navegador?.close();
    await new Promise((r) => servidor.close(r));
  }
});
