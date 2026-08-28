/* Pruebas integrales del generador estático y de sus datos públicos. */

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { fileURLToPath } from "node:url";

import {
  ACTIVIDAD_IA,
  PERSONA,
  PROYECTOS,
  REPOSITORIOS_GITHUB,
} from "../datos.js";
import { ARCHIVO_HOJA_DE_VIDA, EVIDENCIA_TECNICA, HOJA_DE_VIDA } from "../datos-hoja-de-vida.js";
import { cargarEscritos, slugificar } from "../escritos.js";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const construido = fileURLToPath(new URL("../publico/", import.meta.url));
const musica = fileURLToPath(new URL("../activos/beethoven-quinta-sinfonia.mp3", import.meta.url));
const hojaDeVidaPdf = fileURLToPath(new URL(`..${ARCHIVO_HOJA_DE_VIDA}`, import.meta.url));
const hojaDeVidaFuente = fileURLToPath(new URL("../documentos/hoja-de-vida/hoja-de-vida-jhon-steven-alvarez-ruiz.html", import.meta.url));
const hojaDeVidaManifiesto = fileURLToPath(new URL("../documentos/hoja-de-vida/manifiesto.json", import.meta.url));

const sha256 = (contenido) => createHash("sha256").update(contenido).digest("hex");
const fuentesHojaDeVida = [
  "datos.js",
  "datos-github.js",
  "datos-hoja-de-vida.js",
  "herramientas/generar-hoja-de-vida.js",
  "herramientas/nota-investigacion.js",
  "activos/retrato-profesional.jpg",
];

execFileSync(process.execPath, ["construir.js"], { cwd: raiz });

const sitemap = readFileSync(`${construido}sitemap.xml`, "utf8");
const rutasPublicas = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((coincidencia) => new URL(coincidencia[1]).pathname);
const archivoRuta = (ruta) => `${construido}${ruta.slice(1)}index.html`;

test("la Quinta de Beethoven es un archivo MP3 real e íntegro", () => {
  assert.ok(existsSync(musica), "falta la grabación local");
  assert.ok(statSync(musica).size > 30 * 1024 * 1024, "el archivo no parece contener la sinfonía completa");
  const bytes = readFileSync(musica);
  assert.ok(bytes.subarray(0, 3).equals(Buffer.from("ID3")) || bytes[0] === 0xff, "cabecera MP3 inválida");
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    "564507b35cb7d3e7c7f762d00c00f7ea09f487f674bd48fd4d274e444b3066a6",
  );
});

test("el reproductor usa solo el archivo y no sintetiza una partitura", () => {
  const fuente = readFileSync(`${raiz}/activos/musica.js`, "utf8");
  assert.match(fuente, /beethoven-quinta-sinfonia\.mp3/);
  for (const resto of ["AudioContext", "createOscillator", "COMPASES", "VOCES", "aFrecuencia"]) {
    assert.ok(!fuente.includes(resto), `quedó código musical antiguo: ${resto}`);
  }
});

test("el sitemap enumera rutas únicas que existen", () => {
  assert.ok(rutasPublicas.length >= 30, "el catálogo perdió páginas");
  assert.equal(new Set(rutasPublicas).size, rutasPublicas.length, "hay rutas duplicadas");
  assert.ok(!rutasPublicas.includes("/admin/"), "el panel privado no debe indexarse");
  for (const ruta of rutasPublicas) assert.ok(existsSync(archivoRuta(ruta)), `sitemap promete ${ruta}`);
});

test("todas las páginas tienen título, canónico único y marcado de persona", () => {
  const canonicos = new Set();
  for (const ruta of rutasPublicas) {
    const html = readFileSync(archivoRuta(ruta), "utf8");
    const titulo = html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "";
    const canonico = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    const bruto = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    assert.ok(titulo.includes(PERSONA.nombre), `${ruta} no incluye el nombre en su título`);
    assert.ok(canonico?.endsWith(ruta), `${ruta} apunta a ${canonico}`);
    assert.ok(!canonicos.has(canonico), `canónico repetido: ${canonico}`);
    canonicos.add(canonico);
    const ld = JSON.parse(bruto);
    const persona = ld["@graph"].find((nodo) => nodo["@type"] === "Person");
    assert.equal(persona?.name, PERSONA.nombre, `${ruta} no declara la persona canónica`);
    assert.ok(persona.sameAs.length >= 2);
    assert.ok(!persona.sameAs.includes(PERSONA.humanizar), `${ruta} confunde el proyecto CAUCE con la identidad personal`);
  }
});

test("cada repositorio público de GitHub tiene un módulo de proyecto", () => {
  assert.equal(REPOSITORIOS_GITHUB.total, REPOSITORIOS_GITHUB.repositorios.length);
  assert.ok(REPOSITORIOS_GITHUB.total >= 22);
  const directorio = `${construido}proyectos/`;
  const entradas = readdirSync(directorio, { withFileTypes: true }).filter((entrada) => entrada.isDirectory());
  const html = entradas
    .map((entrada) => readFileSync(`${directorio}${entrada.name}/index.html`, "utf8"))
    .join("\n");
  for (const repo of REPOSITORIOS_GITHUB.repositorios) {
    assert.match(repo.url, /^https:\/\/github\.com\/SirHegel\//);
    assert.ok(html.includes(repo.url), `falta el repositorio ${repo.nombre}`);
    assert.ok(repo.inventario && Number.isInteger(repo.inventario.archivos), `falta el inventario de ${repo.nombre}`);
    if (repo.inventario.vacio) assert.equal(repo.inventario.revision, null);
    else assert.match(repo.inventario.revision, /^[a-f0-9]{40}$/i, `falta la revisión de ${repo.nombre}`);
    const informe = readFileSync(`${directorio}${slugificar(repo.slug)}/index.html`, "utf8");
    for (const seccion of ["Qué hice", "Qué contiene", "Cómo se verificó", "Resultados medidos", "Límites y pendientes", "Costo"]) {
      assert.ok(informe.includes(seccion), `${repo.nombre} no publica la sección ${seccion}`);
    }
  }
  assert.ok(entradas.length >= PROYECTOS.length);
});

test("el perfil publica releases, contribuciones externas, logros y métricas reproducibles", () => {
  assert.equal(REPOSITORIOS_GITHUB.metricas.schemaVersion, 1);
  assert.equal(REPOSITORIOS_GITHUB.metricas.totales.repositorios, REPOSITORIOS_GITHUB.metricas.repositorios.length);
  assert.equal(REPOSITORIOS_GITHUB.forks.length, REPOSITORIOS_GITHUB.perfilGitHub.forksPublicos);
  assert.equal(REPOSITORIOS_GITHUB.total + REPOSITORIOS_GITHUB.forks.length, REPOSITORIOS_GITHUB.perfilGitHub.repositoriosPublicos);
  assert.ok(REPOSITORIOS_GITHUB.releases.length >= 9);
  assert.ok(REPOSITORIOS_GITHUB.contribucionesExternas.totales.pullRequests >= 20);
  assert.ok(REPOSITORIOS_GITHUB.logros.some((logro) => logro.slug === "quickdraw"));
  assert.ok(REPOSITORIOS_GITHUB.logros.some((logro) => logro.slug === "yolo"));
  assert.ok(rutasPublicas.includes("/contribuciones/"));
  const html = readFileSync(archivoRuta("/contribuciones/"), "utf8");
  for (const texto of ["Releases", "Forks públicos", "Contribuciones externas", "Logros visibles", "25.216", "9.903"]) {
    assert.ok(html.includes(texto), `contribuciones no publica ${texto}`);
  }
});

test("el repositorio renombrado conserva una redirección permanente", () => {
  const configuracion = JSON.parse(readFileSync(`${raiz}/vercel.json`, "utf8"));
  assert.ok(configuracion.redirects.some((regla) => (
    regla.source === "/proyectos/before-you-contribute/"
    && regla.destination === "/proyectos/gh-before-you-contribute/"
    && regla.permanent === true
  )));
});

test("el blog genera artículos, temas y feed", async () => {
  const escritos = await cargarEscritos(`${raiz}/escritos`);
  assert.ok(escritos.length >= 3);
  for (const escrito of escritos) {
    assert.ok(existsSync(archivoRuta(`/blog/${escrito.slug}/`)), `falta ${escrito.slug}`);
    const html = readFileSync(archivoRuta(`/blog/${escrito.slug}/`), "utf8");
    assert.ok(html.includes(escrito.titulo));
  }
  const feed = readFileSync(`${construido}feed.xml`, "utf8");
  assert.equal([...feed.matchAll(/<item>/g)].length, escritos.length);
  for (const tema of ["derecho", "economia", "pensamientos", "analisis"]) {
    assert.ok(existsSync(archivoRuta(`/blog/tema/${tema}/`)), `falta el tema ${tema}`);
  }
  assert.ok(
    escritos.some((escrito) => escrito.slug === "abelardo-de-la-espriella-y-la-politica-de-drogas"),
    "falta el análisis de la política de drogas de Abelardo de la Espriella",
  );
});

test("el blog conserva tarjetas distinguibles en móvil", () => {
  const estilos = readFileSync(`${raiz}/activos/estilos.css`, "utf8");
  const inicio = estilos.indexOf("@media (max-width: 34rem)", estilos.indexOf(".lista-escritos"));
  const fin = estilos.indexOf("\n}\n", inicio);
  assert.ok(inicio >= 0 && fin > inicio, "falta el ajuste móvil del blog");
  const movil = estilos.slice(inicio, fin);
  assert.match(movil, /\.escrito-card \{[\s\S]*?border-color: var\(--filete-2\);[\s\S]*?border-left: 2px solid/);
  assert.match(movil, /\.escrito-card:focus-within,[\s\S]*?\.escrito-card:active/);
});

test("trayectoria presenta certificaciones e investigación como una llamada accesible", () => {
  const html = readFileSync(archivoRuta("/trayectoria/"), "utf8");
  assert.match(html, /<a class="ficha llamada-academica revelar sep-m" href="\/academico\/">/);
  assert.match(html, /<h3>Certificaciones e investigación<\/h3>/);
  assert.match(html, /<i aria-hidden="true">→<\/i>/);
  assert.doesNotMatch(html, /<p class="sep-m"><a class="mas revelar" href="\/academico\/">/);
});

test("la hoja de vida pública ofrece un PDF ATS y datos de contacto coherentes", () => {
  assert.ok(rutasPublicas.includes("/hoja-de-vida/"), "la hoja de vida falta en el sitemap");
  const html = readFileSync(archivoRuta("/hoja-de-vida/"), "utf8");
  assert.ok(html.includes(`href="${ARCHIVO_HOJA_DE_VIDA}"`), "falta el enlace al PDF");
  assert.match(html, /download="hoja-de-vida-jhon-steven-alvarez-ruiz\.pdf"/);
  assert.ok(html.includes(PERSONA.telefono));
  assert.ok(html.includes(PERSONA.email));
  assert.ok(html.includes("/activos/retrato-profesional.jpg"));
  assert.ok(html.includes(HOJA_DE_VIDA.cauce.url));
  assert.ok(html.includes(HOJA_DE_VIDA.cauce.repositorioPublico));
  assert.ok(html.includes("Aycomer") && html.includes("Proyecto privado"));
  assert.ok(!html.includes('href=""'), "la hoja de vida contiene un enlace vacío");
  for (const termino of ["CAUCE V3", "OpenClaw", "Hermes", "Claude Code", "PostgreSQL", "MySQL", "SQLite"]) {
    assert.ok(html.includes(termino), `la página no incluye ${termino}`);
  }

  assert.ok(existsSync(hojaDeVidaPdf), "falta el PDF descargable");
  const pdf = readFileSync(hojaDeVidaPdf);
  assert.ok(pdf.subarray(0, 5).equals(Buffer.from("%PDF-")), "el archivo descargable no es PDF");
  assert.ok(pdf.length > 100_000, "el PDF parece incompleto");

  const fuente = readFileSync(hojaDeVidaFuente, "utf8");
  for (const texto of [PERSONA.nombre, PERSONA.telefono, PERSONA.email, "Perfil profesional", "Experiencia profesional", "Educación", "Certificaciones"]) {
    assert.ok(fuente.includes(texto), `la fuente ATS no incluye ${texto}`);
  }
  assert.ok(
    fuente.includes("Línea de trabajo: distribución de la tierra en Colombia."),
    "la fuente ATS perdió el texto plano de investigación",
  );
  assert.ok(
    !fuente.includes("<b>distribución de la tierra en Colombia</b>"),
    "la fuente ATS no debe conservar marcado HTML dentro de la nota",
  );
  const telefonosPublicados = [...`${html}\n${fuente}`.matchAll(/(?<!\d)3(?:[ .-]?\d){9}(?!\d)/g)]
    .map((coincidencia) => coincidencia[0].replace(/\D/g, ""));
  assert.deepEqual(new Set(telefonosPublicados), new Set([PERSONA.telefono.replace(/\D/g, "").slice(-10)]));
  assert.ok(!html.includes("CONTRASEÑAS") && !fuente.includes("CONTRASEÑAS"));

  const manifiesto = JSON.parse(readFileSync(hojaDeVidaManifiesto, "utf8"));
  const huellaFuentes = createHash("sha256");
  for (const relativa of fuentesHojaDeVida) {
    huellaFuentes.update(relativa).update("\0").update(readFileSync(`${raiz}/${relativa}`)).update("\0");
  }
  assert.equal(manifiesto.fuenteSha256, huellaFuentes.digest("hex"), "el PDF no refleja las fuentes actuales");
  assert.equal(manifiesto.htmlSha256, sha256(Buffer.from(fuente)), "la fuente HTML cambió después de generar el PDF");
  assert.equal(manifiesto.pdfSha256, sha256(pdf), "el PDF cambió después de su validación");
  assert.equal(manifiesto.pdfBytes, pdf.length);
  assert.equal(manifiesto.paginas, 5);
  assert.equal(manifiesto.etiquetado, true);
  assert.equal(manifiesto.textoExtraible, true);
});

test("las métricas técnicas del dossier se suman y coinciden con los proyectos", () => {
  const suma = EVIDENCIA_TECNICA.proyectos.reduce(
    (total, proyecto) => ({
      fuente: total.fuente + proyecto.fuente,
      prueba: total.prueba + proyecto.prueba,
      commits: total.commits + proyecto.commits,
      pipelines: total.pipelines + proyecto.pipelines,
    }),
    { fuente: 0, prueba: 0, commits: 0, pipelines: 0 },
  );
  assert.deepEqual(EVIDENCIA_TECNICA.totales, suma);
  assert.deepEqual(suma, { fuente: 25_216, prueba: 9_903, commits: 52, pipelines: 6 });
  for (const evidencia of EVIDENCIA_TECNICA.proyectos) {
    assert.match(evidencia.revision, /^[a-f0-9]{40}$/);
    assert.ok(REPOSITORIOS_GITHUB.repositorios.some((repo) => repo.nombre === evidencia.repositorio));
  }
});

test("la navegación enlaza la hoja de vida desde todas las páginas públicas", () => {
  for (const ruta of rutasPublicas) {
    const html = readFileSync(archivoRuta(ruta), "utf8");
    assert.match(html, /href="\/hoja-de-vida\/"[^>]*>Hoja de vida<\/a>/, `${ruta} no enlaza la hoja de vida`);
  }
});

test("el perfil público no presenta como terminados los estudios que siguen en curso", () => {
  for (const ruta of ["/", "/proyectos/sitio/", "/proyectos/sirhegel/"]) {
    const html = readFileSync(archivoRuta(ruta), "utf8");
    assert.ok(!/economista/i.test(html), `${ruta} conserva el título profesional no terminado`);
  }
  const academico = readFileSync(archivoRuta("/academico/"), "utf8");
  assert.ok(academico.includes("(en curso)"));
  assert.ok(
    academico.includes("Línea de trabajo: <b>distribución de la tierra en Colombia</b>"),
    "la página académica perdió el énfasis semántico de la investigación",
  );
  assert.ok(!academico.includes("[object Object]"), "la nota estructurada se renderizó como objeto");
});

test("la actividad publicada cuadra y no expone el ledger", () => {
  const totalProveedor = ACTIVIDAD_IA.porProveedor.reduce((suma, fila) => suma + fila.tokens, 0);
  const llamadasProveedor = ACTIVIDAD_IA.porProveedor.reduce((suma, fila) => suma + fila.llamadas, 0);
  assert.equal(totalProveedor, ACTIVIDAD_IA.totales.tokens);
  assert.equal(llamadasProveedor, ACTIVIDAD_IA.totales.llamadas);
  const claves = [];
  const recorrer = (valor) => {
    if (!valor || typeof valor !== "object") return;
    for (const [clave, hijo] of Object.entries(valor)) {
      claves.push(clave.toLowerCase());
      recorrer(hijo);
    }
  };
  recorrer(ACTIVIDAD_IA);
  for (const privado of ["prompt", "session", "session_id", "account", "ruta", "execution_id"]) {
    assert.ok(!claves.includes(privado), `el agregado contiene el campo privado ${privado}`);
  }
  assert.ok(!JSON.stringify(ACTIVIDAD_IA).includes("/home/"));
  const html = readFileSync(archivoRuta("/actividad/"), "utf8");
  assert.ok(html.includes(ACTIVIDAD_IA.totales.tokens.toLocaleString("es-CO")));
});

test("el panel es privado, no indexable y no se autoaudita", () => {
  const html = readFileSync(archivoRuta("/admin/"), "utf8");
  assert.match(html, /name="robots" content="noindex, nofollow, noarchive"/);
  assert.match(html, /src="\/activos\/admin\.js"/);
  assert.ok(!html.includes("/activos/analitica.js"));
  assert.ok(!html.includes("/_vercel/insights/script.js"));
  assert.match(html, /data-ruta="\/admin\/"/);
});

test("la analítica pública es agregada y explica sus límites", () => {
  const inicio = readFileSync(archivoRuta("/"), "utf8");
  assert.match(inicio, /src="\/_vercel\/insights\/script\.js"/);
  assert.match(inicio, /src="\/activos\/analitica\.js"/);
  const privacidad = readFileSync(archivoRuta("/privacidad/"), "utf8");
  for (const texto of ["ipapi.is", "90 días", "no la convierte en hash", "VPN residencial"]) {
    assert.ok(privacidad.includes(texto), `la política no explica: ${texto}`);
  }
});

test("el revelado no depende del alto del bloque, para que un artículo largo se vea en móvil", () => {
  const fuente = readFileSync(new URL("../activos/animacion.js", import.meta.url), "utf8");
  const observador = fuente.slice(fuente.indexOf("vigiaRevelado = new IntersectionObserver"));
  const umbral = /threshold:\s*([0-9.]+)/.exec(observador);
  assert.ok(umbral, "el observador de revelado debe declarar un umbral explícito");

  // Un umbral mayor que cero exige ver una FRACCIÓN del elemento. El cuerpo
  // de un artículo largo mide del orden de 19.700 px en un móvil de 844 px
  // de alto: con umbral 0,06 harían falta 1.180 px visibles y la condición
  // no se cumple nunca, así que la clase `visible` no llega y el texto se
  // queda invisible. Con umbral 0 basta un pixel y el alto deja de importar.
  const altoArticulo = 19_675;
  const altoPantalla = 844;
  const exigido = Number(umbral[1]) * altoArticulo;
  assert.ok(
    exigido <= altoPantalla,
    `umbral ${umbral[1]} exige ${Math.round(exigido)} px visibles y la pantalla solo tiene ${altoPantalla} px`,
  );

  // Y debe existir la red de seguridad para lo que ya está en pantalla.
  assert.match(observador, /classList\.add\("visible"\)/);
});
