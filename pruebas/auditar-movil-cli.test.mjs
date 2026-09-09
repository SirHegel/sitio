import test from 'node:test';
import assert from 'node:assert/strict';
import { leerOpciones, rutasDelSitemap, motivoBloqueo, VENTANAS } from '../herramientas/auditar-movil.mjs';

test('la auditoría acepta origen local y canónico, sin credenciales ni rutas ambiguas', () => {
  assert.equal(leerOpciones([]).base, 'http://127.0.0.1:8112');
  assert.equal(leerOpciones(['--base', 'https://jhonstevenalvarezruiz.vercel.app/', '--motor', 'firefox']).base, 'https://jhonstevenalvarezruiz.vercel.app');
  for (const base of ['file:///tmp/sitio', 'https://u:p@example.org', 'https://example.org/proyectos/', 'https://example.org/?x=1']) assert.throws(() => leerOpciones(['--base', base]));
  assert.throws(() => leerOpciones(['--motor', 'safari']));
  assert.throws(() => leerOpciones(['--motor', 'toString']));
  assert.throws(() => leerOpciones(['--motor']));
  assert.throws(() => leerOpciones(['--opcion-inventada']));
});

test('la matriz conserva los tres anchos comunes y el mínimo de 500 casos para 50 rutas', () => {
  for (const ventanas of Object.values(VENTANAS)) for (const ancho of [320, 390, 844]) assert.ok(ventanas.some(([w]) => w === ancho));
  assert.equal(VENTANAS.chromium.length * 50, 200);
  assert.equal(VENTANAS.webkit.length * 50, 150);
  assert.equal(VENTANAS.firefox.length * 50, 150);
});

test('el sitemap conserva sus rutas y rechaza duplicados o destinos inválidos', () => {
  assert.deepEqual(rutasDelSitemap('<urlset><loc>https://ejemplo.org/</loc><loc>https://ejemplo.org/ciencia/</loc></urlset>'), ['/', '/ciencia/']);
  for (const xml of ['', '<loc>javascript:alert(1)</loc>', '<loc>https://a.org/</loc><loc>https://b.org/</loc>', '<loc>https://a.org/?secreto=x</loc>']) assert.throws(() => rutasDelSitemap(xml));
});

test('la red permite recursos propios y bloquea telemetría, medios, otros orígenes y escrituras', () => {
  const base = 'https://jhonstevenalvarezruiz.vercel.app';
  assert.equal(motivoBloqueo(base + '/activos/neuro-lab.js', 'script', 'GET', base), null);
  assert.equal(motivoBloqueo(base + '/api/visita', 'fetch', 'POST', base), 'telemetriaOApi');
  assert.equal(motivoBloqueo(base + '/_vercel/insights/script.js', 'script', 'GET', base), 'telemetriaOApi');
  assert.equal(motivoBloqueo(base + '/activos/audio.mp3?v=1', 'other', 'GET', base), 'medio');
  assert.equal(motivoBloqueo(base + '/archivo-sin-extension', 'media', 'GET', base), 'medio');
  assert.equal(motivoBloqueo(base + '.ejemplo.org/a.js', 'script', 'GET', base), 'otroOrigen');
  assert.equal(motivoBloqueo(base + '/guardar', 'fetch', 'POST', base), 'escritura');
});
