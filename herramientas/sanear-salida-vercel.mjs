#!/usr/bin/env node

/**
 * Minimiza y audita una salida preconstruida de Vercel.
 * Complejidad: O(F + B) en tiempo y O(Bmax) en memoria, con F archivos,
 * B bytes textuales y Bmax el archivo mayor. Invariantes: destino exacto
 * `.vercel/output`, cero enlaces simbólicos, cero rutas privadas o tokens.
 */

import { lstat, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { detectarFirmasGeometriaExactaOro } from "./validar-publicacion-oro.mjs";

const destino = resolve(process.argv[2] || "");
if (basename(destino) !== "output" || basename(dirname(destino)) !== ".vercel") {
  throw new Error("el destino debe ser un directorio .vercel/output explícito");
}

const extensionesTexto = /\.(?:css|csv|geojson|html?|js|json|map|md|mjs|svg|tsv|txt|xml)$/i;
const rutaPrivada = /(?:\/home\/[A-Za-z0-9._-]+\/|\/Users\/[A-Za-z0-9._-]+\/|[A-Za-z]:\\Users\\)/;
const secreto = /(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|AIza[A-Za-z0-9_-]{30,}|AKIA[A-Z0-9]{16})/;
const rutaOperativa = /(?:respuestas-privadas|formularios-privados|\.env(?:\.|$)|\.eml$)/i;

function sanear(valor) {
  if (typeof valor === "string") {
    return valor
      .replace(/\/home\/[A-Za-z0-9._-]+\/[^\s",}]*/g, "[ruta-local]")
      .replace(/\/Users\/[A-Za-z0-9._-]+\/[^\s",}]*/g, "[ruta-local]")
      .replace(/[A-Za-z]:\\Users\\[^\s",}]*/g, "[ruta-local]");
  }
  if (Array.isArray(valor)) return valor.map(sanear);
  if (valor && typeof valor === "object") {
    return Object.fromEntries(Object.entries(valor).map(([clave, contenido]) => [clave, sanear(contenido)]));
  }
  return valor;
}

async function recorrer(carpeta, base = carpeta) {
  const archivos = [];
  for (const entrada of await readdir(carpeta, { withFileTypes: true })) {
    const ruta = join(carpeta, entrada.name);
    const estado = await lstat(ruta);
    if (estado.isSymbolicLink()) throw new Error("la salida contiene un enlace simbólico");
    if (estado.isDirectory()) archivos.push(...await recorrer(ruta, base));
    else if (estado.isFile()) archivos.push({ ruta, relativa: ruta.slice(base.length + 1), bytes: estado.size });
    else throw new Error("la salida contiene una entrada especial");
  }
  return archivos;
}

const iniciales = await recorrer(destino);
for (const archivo of iniciales.filter((item) =>
  item.relativa === "builds.json"
  || (item.relativa.startsWith("diagnostics/") && item.relativa.endsWith(".json")))) {
  const original = JSON.parse(await readFile(archivo.ruta, "utf8"));
  const temporal = `${archivo.ruta}.saneado-${process.pid}`;
  await writeFile(temporal, `${JSON.stringify(sanear(original))}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
  await rename(temporal, archivo.ruta);
}

const archivos = await recorrer(destino);
const raicesPermitidas = new Set(["builds.json", "config.json", "diagnostics", "functions", "static"]);
const fallas = [];
for (const archivo of archivos) {
  const raiz = archivo.relativa.split("/")[0];
  if (!raicesPermitidas.has(raiz) || rutaOperativa.test(archivo.relativa)) {
    fallas.push(`${archivo.relativa}: ruta no permitida`);
    continue;
  }
  if (!extensionesTexto.test(archivo.relativa)) continue;
  const texto = await readFile(archivo.ruta, "utf8");
  if (rutaPrivada.test(texto)) fallas.push(`${archivo.relativa}: ruta local persistente`);
  if (secreto.test(texto)) fallas.push(`${archivo.relativa}: patrón de secreto`);
  // La capa legal publica a propósito los dos perímetros que sirve la ANM. La
  // excepción es de una sola ruta y dos firmas: el polígono de Crucitas y los
  // vértices locales Nexus siguen prohibidos también dentro de esa capa.
  const capaLegalPublica = /(?:^|\/)data\/oro\/legal\.geojson$/.test(archivo.relativa);
  const firmasAdmitidas = new Set(["anm_jg4_poligono", "anm_cei_poligono"]);
  const geometrias = detectarFirmasGeometriaExactaOro(texto)
    .filter((item) => !(capaLegalPublica && firmasAdmitidas.has(item.firma)));
  if (geometrias.length) {
    fallas.push(`${archivo.relativa}: geometría exacta prohibida (${geometrias.map((item) => item.firma).join(", ")})`);
  }
}
if (fallas.length) throw new Error(`salida Vercel rechazada (${fallas.length} hallazgos): ${fallas.join("; ")}`);
process.stdout.write(`${JSON.stringify({ archivos: archivos.length, bytes: archivos.reduce((suma, item) => suma + item.bytes, 0), hallazgos: 0 })}\n`);
