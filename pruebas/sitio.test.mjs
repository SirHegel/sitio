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
import { cargarEscritos } from "../escritos.js";

const raiz = fileURLToPath(new URL("..", import.meta.url));
const construido = fileURLToPath(new URL("../publico/", import.meta.url));
const musica = fileURLToPath(new URL("../activos/beethoven-quinta-sinfonia.mp3", import.meta.url));

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
    assert.ok(persona.sameAs.length >= 3);
  }
});

test("cada repositorio público de GitHub tiene un módulo de proyecto", () => {
  assert.equal(REPOSITORIOS_GITHUB.total, REPOSITORIOS_GITHUB.repositorios.length);
  assert.ok(REPOSITORIOS_GITHUB.total >= 20);
  const directorio = `${construido}proyectos/`;
  const entradas = readdirSync(directorio, { withFileTypes: true }).filter((entrada) => entrada.isDirectory());
  const html = entradas
    .map((entrada) => readFileSync(`${directorio}${entrada.name}/index.html`, "utf8"))
    .join("\n");
  for (const repo of REPOSITORIOS_GITHUB.repositorios) {
    assert.match(repo.url, /^https:\/\/github\.com\/SirHegel\//);
    assert.ok(html.includes(repo.url), `falta el repositorio ${repo.nombre}`);
  }
  assert.ok(entradas.length >= PROYECTOS.length);
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
