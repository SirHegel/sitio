#!/usr/bin/env node
// Auditoría HTML/táctil: WebGL se bloquea expresamente. No mide GPU ni teléfonos.
// La herramienta consulta el sitio servido; no construye, despliega ni publica.
import { chromium, firefox, webkit } from 'playwright-core';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const raiz = fileURLToPath(new URL('..', import.meta.url));
const motores = { chromium, webkit, firefox };
const toleranciaPx = 2;
const tiempoEsperaMs = 15_000;
export const VENTANAS = Object.freeze({
  chromium: [[320, 740], [360, 844], [390, 844], [844, 390]],
  webkit: [[320, 740], [390, 844], [844, 390]],
  firefox: [[320, 740], [390, 844], [844, 390]],
});
const ayuda = `Uso: node herramientas/auditar-movil.mjs [opciones]
  --base URL                 Origen HTTP(S); defecto http://127.0.0.1:8112
  --motor NOMBRE             chromium, webkit, firefox o todos (defecto todos)
  --salida ARCHIVO.json      Informe; defecto ${resolve(tmpdir(), 'auditoria-movil.json')}
  --capturas DIRECTORIO      Capturas de los recorridos, opcionales
  --canal-chromium NOMBRE    chromium (incluido con Playwright) o chrome (instalado)
  --ayuda                    Mostrar esta ayuda sin abrir navegadores

El servidor debe estar iniciado. La matriz bloquea WebGL, medios, telemetría,
solicitudes a otros orígenes y escrituras HTTP. Los motores corren en secuencia.
`;

// O(A + L) tiempo y espacio, A argumentos y L caracteres. Invariante: origen
// HTTP(S) sin credenciales; opciones desconocidas o valores incompletos fallan.
export function leerOpciones(args) {
  const opciones = { base: 'http://127.0.0.1:8112', motor: 'todos', salida: resolve(tmpdir(), 'auditoria-movil.json'), capturas: null, canalChromium: 'chromium', ayuda: false };
  const campos = { '--base': 'base', '--motor': 'motor', '--salida': 'salida', '--capturas': 'capturas', '--canal-chromium': 'canalChromium' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ayuda' || args[i] === '--help') { opciones.ayuda = true; continue; }
    const campo = Object.hasOwn(campos, args[i]) ? campos[args[i]] : null;
    if (!campo) throw new Error(`Opción desconocida: ${args[i]}`);
    if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Falta el valor de ${args[i]}`);
    opciones[campo] = args[++i];
  }
  let url;
  try { url = new URL(opciones.base); } catch { throw new Error('--base requiere un origen HTTP(S) válido'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('--base debe ser un origen HTTP(S) sin credenciales, ruta, consulta ni fragmento');
  }
  opciones.base = url.origin;
  if (!Object.hasOwn(motores, opciones.motor) && opciones.motor !== 'todos') throw new Error('--motor: chromium, webkit, firefox o todos');
  if (!['chromium', 'chrome'].includes(opciones.canalChromium)) throw new Error('--canal-chromium: chromium o chrome');
  opciones.salida = resolve(opciones.salida);
  if (!opciones.salida.endsWith('.json')) throw new Error('--salida requiere un archivo .json');
  if (opciones.capturas) opciones.capturas = resolve(opciones.capturas);
  return opciones;
}

// O(S) tiempo y espacio para S caracteres. Invariantes: todas las rutas se
// conservan, sin duplicados ni consultas; el sitemap debe tener contenido.
export function rutasDelSitemap(xml) {
  const rutas = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => {
    const url = new URL(m[1].replaceAll('&amp;', '&'));
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('El sitemap contiene una URL no admitida');
    return url.pathname;
  });
  if (!rutas.length || new Set(rutas).size !== rutas.length) throw new Error('El sitemap está vacío o contiene rutas duplicadas');
  return rutas;
}

// O(U) tiempo y espacio para una URL. Solo lecturas del origen autorizado;
// las rutas del sitemap se trasladan a ese origen, aunque sea un servidor local.
export function motivoBloqueo(url, tipo, metodo, base) {
  const destino = new URL(url);
  if (destino.origin !== base) return 'otroOrigen';
  if (/^\/(?:_vercel|api)(?:\/|$)/.test(destino.pathname)) return 'telemetriaOApi';
  if (tipo === 'media' || /\.(?:mp3|ogg|webm|mp4|wav|m4a)$/i.test(destino.pathname)) return 'medio';
  if (!['GET', 'HEAD'].includes(metodo)) return 'escritura';
  return null;
}

// O(B) tiempo y O(1) memoria adicional para B bytes.
const huella = (bytes) => createHash('sha256').update(bytes).digest('hex');

// O(B) tiempo y espacio para B bytes recibidos. Invariante: respuesta 200 del
// destino solicitado; no seguir redirecciones silenciosas a otro servidor.
async function leerURL(url) {
  const respuesta = await fetch(url, { signal: AbortSignal.timeout(tiempoEsperaMs), redirect: 'error' });
  if (respuesta.status !== 200) throw new Error(`HTTP ${respuesta.status}: ${url}`);
  return Buffer.from(await respuesta.arrayBuffer());
}

// Se ejecuta en el documento antes de su JavaScript. O(1), salvo V violaciones
// CSP registradas. Los canvas 2D siguen funcionando; WebGL nunca crea contexto.
function prepararDocumento() {
  try { sessionStorage.setItem('jsar:entrada-v2', '1'); localStorage.setItem('jsar:escena-pausa', '1'); } catch { /* about:blank o almacenamiento restringido */ }
  window.__auditoriaMovil = { webglBloqueado: true, intentosWebgl: 0, csp: [] };
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (tipo, ...opciones) {
    if (/webgl/i.test(tipo)) { window.__auditoriaMovil.intentosWebgl++; return null; }
    return original.call(this, tipo, ...opciones);
  };
  document.addEventListener('securitypolicyviolation', (e) => window.__auditoriaMovil.csp.push({ directiva: e.violatedDirective, uri: e.blockedURI }));
}

// Análisis DOM O(N·(D+G)) tiempo, O(F) espacio: N nodos, D profundidad,
// G rectángulos por nodo, F muestras (máximo 10). No oculta desbordamientos
// del documento: solo excluye texto con desplazamiento horizontal propio.
function medirDocumento() {
  let totalProblemas = 0;
  const muestras = [];
  const visible = (e) => { const s = getComputedStyle(e), r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
  const desplazable = (e) => { for (let p = e; p && p !== document.body; p = p.parentElement) if (/auto|scroll/.test(getComputedStyle(p).overflowX) && p.scrollWidth > p.clientWidth + 2) return true; return false; };
  const caminar = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = caminar.nextNode(); n; n = caminar.nextNode()) {
    const e = n.parentElement, inicio = n.data.search(/\S/);
    if (inicio < 0 || !e || !visible(e) || e.closest('.saltar,.solo-lectores,[aria-hidden="true"],script,style,svg') || desplazable(e)) continue;
    const rango = document.createRange(); rango.setStart(n, inicio); rango.setEnd(n, n.data.trimEnd().length);
    for (const r of rango.getClientRects()) {
      if (r.width > .5 && r.height > .5 && (r.left < -2 || r.right > document.documentElement.clientWidth + 2)) {
        totalProblemas++;
        if (muestras.length < 10) muestras.push({ texto: n.data.trim().slice(0, 90), etiqueta: e.tagName, clase: e.getAttribute('class'), izquierda: r.left, derecha: r.right });
        break;
      }
    }
  }
  return { innerWidth, clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, totalProblemas, muestras,
    motorObservatorio: document.body.dataset.motor || null, motorModelo: document.getElementById('neuro-visor')?.dataset.neuroMotor || null,
    intentosWebglBloqueados: window.__auditoriaMovil.intentosWebgl, csp: window.__auditoriaMovil.csp };
}

// O(1). Las capacidades son las de este proceso emulado; detectar la clase
// WebGL2RenderingContext no demuestra disponibilidad de una GPU física.
function medirCapacidades() {
  const admite = (propiedad, valor) => CSS.supports(propiedad, valor);
  return {
    userAgent: navigator.userAgent, devicePixelRatio, maxTouchPoints: navigator.maxTouchPoints,
    css: { svh: admite('height', '100svh'), dvh: admite('height', '100dvh'), safeArea: admite('padding-bottom', 'env(safe-area-inset-bottom)'), touchPanY: admite('touch-action', 'pan-y'),
      pointerCoarse: matchMedia('(pointer: coarse)').matches, pointerFine: matchMedia('(pointer: fine)').matches, hover: matchMedia('(hover: hover)').matches, movimientoReducido: matchMedia('(prefers-reduced-motion: reduce)').matches },
    api: { pointerEvent: 'PointerEvent' in window, pointerCapture: 'setPointerCapture' in Element.prototype, intersectionObserver: 'IntersectionObserver' in window,
      resizeObserver: 'ResizeObserver' in window, visualViewport: 'visualViewport' in window, arrayAt: typeof Array.prototype.at === 'function', viewTransitions: typeof document.startViewTransition === 'function',
      claseWebgl2: 'WebGL2RenderingContext' in window, webglBloqueadoPorAuditoria: true },
  };
}

// O(1) consultas; espera tipografías y dos cuadros, sin pausas arbitrarias.
async function esperarDocumento(pagina) {
  await pagina.evaluate(async () => { await document.fonts.ready; await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); });
}

// O(R·V·N·(D+G)) análisis más carga/renderizado, O(R·V + F) informe.
// Un motor/contexto/página a la vez; toda salida conserva si GL fue bloqueado.
async function auditarMotor(nombre, opciones, rutas, control) {
  const resultado = { motor: nombre, version: null, configuracion: { hasTouch: true, isMobile: nombre !== 'firefox', deviceScaleFactor: 2, reducedMotion: 'reduce', webgl: 'bloqueado', dispositivoFisico: false },
    capacidades: null, casos: [], recorridos: [], fallos: [], errores: [], red: { bloqueadas: {}, recursosFallidos: [] } };
  let navegador, contexto;
  try {
    navegador = await motores[nombre].launch({ headless: true, ...(nombre === 'chromium' ? { args: ['--no-sandbox', '--disable-dev-shm-usage'], ...(opciones.canalChromium === 'chrome' ? { channel: 'chrome' } : {}) } : {}) });
    control.navegador = navegador;
    resultado.version = navegador.version();
    if (nombre === 'chromium') resultado.configuracion.canal = opciones.canalChromium;
    contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, ...(nombre === 'firefox' ? {} : { isMobile: true }), reducedMotion: 'reduce' });
    await contexto.route('**/*', async (ruta) => {
      const peticion = ruta.request();
      const motivo = motivoBloqueo(peticion.url(), peticion.resourceType(), peticion.method(), opciones.base);
      if (motivo) { resultado.red.bloqueadas[motivo] = (resultado.red.bloqueadas[motivo] || 0) + 1; await ruta.abort(); }
      else await ruta.continue();
    });
    await contexto.addInitScript(prepararDocumento);
    const pagina = await contexto.newPage();
    pagina.setDefaultTimeout(tiempoEsperaMs); pagina.setDefaultNavigationTimeout(tiempoEsperaMs);
    pagina.on('pageerror', (e) => resultado.errores.push({ ruta: pagina.url(), mensaje: e.message }));
    pagina.on('response', (r) => { if (r.status() >= 400 && ['document', 'script', 'stylesheet'].includes(r.request().resourceType())) resultado.red.recursosFallidos.push({ url: r.url(), estado: r.status() }); });
    for (const [ancho, alto] of VENTANAS[nombre]) {
      if (control.interrumpido) break;
      await pagina.setViewportSize({ width: ancho, height: alto });
      for (const ruta of rutas) {
        if (control.interrumpido) break;
        const caso = { ruta, ancho, alto, estado: null, aprobado: false };
        try {
          const respuesta = await pagina.goto(opciones.base + ruta, { waitUntil: 'domcontentloaded' });
          caso.estado = respuesta?.status() || null;
          caso.htmlSha256 = respuesta ? huella(await respuesta.body()) : null;
          caso.cspEnCabecera = Boolean(respuesta?.headers()['content-security-policy']);
          await esperarDocumento(pagina);
          await pagina.waitForFunction(() => document.body.dataset.motor === 'respaldo');
          if (!resultado.capacidades) resultado.capacidades = await pagina.evaluate(medirCapacidades);
          caso.medidas = await pagina.evaluate(medirDocumento);
          const m = caso.medidas;
          caso.aprobado = caso.estado === 200 && m.innerWidth === ancho && m.clientWidth === ancho && m.scrollWidth <= ancho + toleranciaPx && m.totalProblemas === 0 && m.csp.length === 0;
        } catch (e) { caso.error = e.message; }
        resultado.casos.push(caso);
        if (!caso.aprobado) resultado.fallos.push({ ruta, ancho, alto, error: caso.error || 'Estado, viewport, texto o CSP fuera del contrato' });
      }
      console.log(`[${nombre}] ${ancho}×${alto}: ${resultado.casos.length} casos acumulados; ${resultado.fallos.length} fallos`);
    }
    if (!control.interrumpido) await auditarRecorridos(pagina, nombre, opciones, resultado);
  } catch (e) { resultado.excepcion = e.message; }
  finally {
    try { await contexto?.close(); } catch (e) { resultado.errores.push({ fase: 'cerrar contexto', mensaje: e.message }); }
    try { await navegador?.close(); } catch (e) { resultado.errores.push({ fase: 'cerrar navegador', mensaje: e.message }); }
    control.navegador = null;
  }
  resultado.esperados = rutas.length * VENTANAS[nombre].length;
  resultado.aprobado = !resultado.excepcion && !control.interrumpido && resultado.casos.length === resultado.esperados && resultado.fallos.length === 0 && resultado.errores.length === 0 && resultado.red.recursosFallidos.length === 0 && resultado.recorridos.length === 5 && resultado.recorridos.every((r) => r.aprobado);
  return resultado;
}

// O(1) recorridos con número fijo de estudios. Invariantes: entrada silenciosa,
// menú PJAX operativo y las tres soluciones realmente aplicadas al formulario.
async function auditarRecorridos(pagina, nombre, opciones, resultado) {
  const capturar = async (paso) => { if (opciones.capturas) await pagina.screenshot({ path: resolve(opciones.capturas, `${nombre}-${paso}-390.png`) }); };
  await pagina.setViewportSize({ width: 390, height: 844 });
  await pagina.goto(opciones.base + '/?entrada=1', { waitUntil: 'domcontentloaded' });
  await pagina.locator('#puerta[open]').waitFor();
  await capturar('entrada');
  await pagina.locator('#entrar-en-silencio').tap();
  await pagina.waitForFunction(() => !document.getElementById('puerta')?.open);
  const silencio = await pagina.locator('audio').evaluateAll((elementos) => elementos.every((audio) => audio.paused));
  resultado.recorridos.push({ paso: 'entrada-silenciosa', aprobado: silencio });
  // Mantener el mismo canvas acredita navegación interna; no acredita dibujo GPU.
  await pagina.evaluate(() => { window.__auditoriaCanvas = document.getElementById('observatorio'); });
  await pagina.locator('.menu-mando').tap();
  await capturar('menu');
  await pagina.locator('nav.menu a[href="/ciencia/"]').tap();
  await pagina.waitForURL(opciones.base + '/ciencia/');
  const menuCerrado = await pagina.locator('.menu-mando').getAttribute('aria-expanded') === 'false';
  const mismoCanvas = await pagina.evaluate(() => Boolean(window.__auditoriaCanvas) && window.__auditoriaCanvas === document.getElementById('observatorio'));
  resultado.recorridos.push({ paso: 'menu-ciencia-pjax', menuCerrado, mismoCanvas, aprobado: menuCerrado && mismoCanvas });
  for (const tipo of ['sinapsis', 'dopamina', 'memoria']) {
    await pagina.locator(`.neuro-rutas a[href="/ciencia/${tipo}/"]`).tap();
    await pagina.waitForURL(opciones.base + `/ciencia/${tipo}/`);
    await pagina.waitForFunction(() => document.getElementById('neuro-visor')?.__neuroEstado?.accion);
    const accion = await pagina.locator('#neuro-visor').evaluate((canvas) => canvas.__neuroEstado.accion);
    if (!['deltaMs', 'vmax', 'g'].includes(accion.campo) || !Number.isFinite(accion.valor)) throw new Error(`Acción inválida en ${tipo}`);
    await pagina.locator('[data-neuro-resolver]').tap();
    const aplicado = Number(await pagina.locator(`[name="${accion.campo}"]`).inputValue());
    await pagina.locator('#neuro-visor').scrollIntoViewIfNeeded();
    await pagina.waitForFunction(() => document.getElementById('neuro-visor')?.dataset.neuroMotor === 'respaldo');
    const respaldoVisible = await pagina.locator('.neuro-respaldo').isVisible();
    const diferencia = Math.abs(aplicado - accion.valor);
    resultado.recorridos.push({ paso: 'aplicar-solucion', tipo, campo: accion.campo, esperado: accion.valor, aplicado, diferencia, tolerancia: 1e-7, motorModelo: 'respaldo', respaldoVisible, aprobado: diferencia <= 1e-7 && respaldoVisible });
    await capturar(tipo);
  }
}

// O(B) bytes de evidencia y O(R·V) registros. Persistir también corridas fallidas
// permite distinguir una auditoría incompleta de una matriz aprobada.
export async function ejecutarAuditoria(opciones) {
  const control = { navegador: null, interrumpido: false };
  const parar = () => { control.interrumpido = true; void control.navegador?.close().catch(() => {}); };
  const informe = { schemaVersion: 1, inicio: new Date().toISOString(), base: opciones.base, maquina: { plataforma: process.platform, arquitectura: process.arch, node: process.version, playwright: require('playwright-core/package.json').version },
    protocolo: { dispositivoFisico: false, webgl: 'bloqueado', movimiento: 'reduce', toleranciaPx, minimoRutas: 50, matrices: VENTANAS,
      firefox: 'viewport y entrada táctil emulados; isMobile no soportado, sin equivalencia a Firefox Android', audio: 'medios bloqueados; se comprueba silencio, no reproducción', gpu: 'geometría, frecuencia y consumo se comprueban por separado' },
    evidencia: {}, motores: [], aprobado: false };
  process.once('SIGINT', parar); process.once('SIGTERM', parar);
  try {
    await mkdir(dirname(opciones.salida), { recursive: true });
    if (opciones.capturas) await mkdir(opciones.capturas, { recursive: true });
    informe.evidencia.herramientaSha256 = huella(await readFile(fileURLToPath(import.meta.url)));
    // Este commit identifica el checkout de la herramienta, no el servidor remoto.
    try { informe.evidencia.checkoutHerramienta = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: raiz, encoding: 'utf8', stdio: 'pipe' }).trim(); } catch { informe.evidencia.checkoutHerramienta = null; }
    const sitemap = await leerURL(opciones.base + '/sitemap.xml');
    const rutas = rutasDelSitemap(sitemap.toString('utf8'));
    informe.evidencia.sitemap = { sha256: huella(sitemap), bytes: sitemap.length, rutas };
    if (rutas.length < informe.protocolo.minimoRutas) throw new Error(`Se esperaban al menos 50 rutas; el sitemap contiene ${rutas.length}`);
    const inicio = await leerURL(opciones.base + '/');
    const estilos = [...inicio.toString('utf8').matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => new URL(m[1], opciones.base));
    informe.evidencia.css = [];
    for (const url of estilos) {
      if (url.origin !== opciones.base) throw new Error(`Hoja externa fuera de la auditoría: ${url}`);
      const bytes = await leerURL(url);
      informe.evidencia.css.push({ ruta: url.pathname, bytes: bytes.length, sha256: huella(bytes) });
    }
    if (!estilos.length) throw new Error('La portada no enlaza hojas de estilo auditables');
    const seleccion = opciones.motor === 'todos' ? ['chromium', 'webkit', 'firefox'] : [opciones.motor];
    for (const nombre of seleccion) {
      if (control.interrumpido) break;
      informe.motores.push(await auditarMotor(nombre, opciones, rutas, control));
      await writeFile(opciones.salida, JSON.stringify(informe, null, 2) + '\n');
    }
    informe.aprobado = !control.interrumpido && informe.motores.length === seleccion.length && informe.motores.every((m) => m.aprobado);
  } catch (e) { informe.excepcion = e.message; }
  finally {
    process.removeListener('SIGINT', parar); process.removeListener('SIGTERM', parar);
    informe.interrumpido = control.interrumpido;
    informe.fin = new Date().toISOString();
    informe.resumen = { casos: informe.motores.reduce((n, m) => n + m.casos.length, 0), fallos: informe.motores.reduce((n, m) => n + m.fallos.length, 0), errores: informe.motores.reduce((n, m) => n + m.errores.length, 0), aprobado: informe.aprobado };
    await writeFile(opciones.salida, JSON.stringify(informe, null, 2) + '\n');
  }
  console.log(JSON.stringify({ ...informe.resumen, salida: opciones.salida, ...(informe.excepcion ? { excepcion: informe.excepcion } : {}) }));
  return informe.interrumpido ? 130 : informe.aprobado ? 0 : 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const opciones = leerOpciones(process.argv.slice(2));
    if (opciones.ayuda) console.log(ayuda);
    else process.exitCode = await ejecutarAuditoria(opciones);
  } catch (e) { console.error(e.message); process.exitCode = 2; }
}
