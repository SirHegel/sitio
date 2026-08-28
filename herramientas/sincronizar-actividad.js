#!/usr/bin/env node

/*
 * Publica un agregado seguro del ledger de Orquesta IA.
 *
 * El ledger original contiene rutas, sesiones y fragmentos de prompts; nunca se
 * copia al sitio. Este exportador conserva únicamente totales estadísticos que
 * pueden mostrarse públicamente.
 */

import { randomUUID } from "node:crypto";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { archivoRegularDentro, salidaRegularExacta } from "./seguridad.js";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ledgerPredeterminado = resolve(raiz, "../../ia/orquesta/state/ledger.jsonl");
const carpetaLedger = dirname(ledgerPredeterminado);
const salidaPredeterminada = join(raiz, "datos-actividad.js");

function argumentos(argv) {
  const opciones = {
    ledger: process.env.ORQUESTA_LEDGER || ledgerPredeterminado,
    salida: salidaPredeterminada,
  };

  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--ledger" && argv[i + 1]) opciones.ledger = resolve(argv[++i]);
    else if (argv[i] === "--salida" && argv[i + 1]) opciones.salida = resolve(argv[++i]);
    else if (argv[i] === "--help") {
      console.log("Uso: node herramientas/sincronizar-actividad.js [--ledger RUTA] [--salida RUTA]");
      process.exit(0);
    } else {
      throw new Error(`Argumento desconocido: ${argv[i]}`);
    }
  }

  return opciones;
}

const numero = (valor) => Number.isFinite(Number(valor)) ? Number(valor) : 0;

function fechaValida(valor) {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? "" : fecha.toISOString();
}

function sumar(mapa, clave, tokens, fallo = false) {
  const nombre = String(clave || "sin clasificar").trim().toLowerCase().slice(0, 48) || "sin clasificar";
  const actual = mapa.get(nombre) || { nombre, tokens: 0, llamadas: 0, fallos: 0 };
  actual.tokens += tokens;
  actual.llamadas += 1;
  if (fallo) actual.fallos += 1;
  mapa.set(nombre, actual);
}

function ordenar(mapa, limite = Infinity) {
  return [...mapa.values()]
    .sort((a, b) => b.tokens - a.tokens || a.nombre.localeCompare(b.nombre, "es"))
    .slice(0, limite);
}

function agregar(lineas) {
  const proveedores = new Map();
  const tareas = new Map();
  const dias = new Map();
  let tokens = 0;
  let llamadas = 0;
  let exitos = 0;
  let fallos = 0;
  let limitadas = 0;
  let segundos = 0;
  let desde = "";
  let hasta = "";

  for (const [indice, linea] of lineas.entries()) {
    if (!linea.trim()) continue;
    let fila;
    try {
      fila = JSON.parse(linea);
    } catch {
      throw new Error(`El ledger contiene JSON inválido en la línea ${indice + 1}`);
    }

    const gasto = Math.max(0, Math.round(numero(fila.tokens)));
    const fallo = numero(fila.rc) !== 0;
    const instante = fechaValida(fila.ts);
    const dia = /^\d{4}-\d{2}-\d{2}$/.test(String(fila.fecha || ""))
      ? String(fila.fecha)
      : instante.slice(0, 10);

    llamadas += 1;
    tokens += gasto;
    segundos += Math.max(0, numero(fila.seg));
    if (fallo) fallos += 1;
    else exitos += 1;
    if (fila.limite === true) limitadas += 1;
    if (instante && (!desde || instante < desde)) desde = instante;
    if (instante && (!hasta || instante > hasta)) hasta = instante;

    sumar(proveedores, fila.provider, gasto, fallo);
    sumar(tareas, fila.tarea, gasto, fallo);
    if (dia) sumar(dias, dia, gasto, fallo);
  }

  if (!llamadas) throw new Error("El ledger no contiene registros publicables");

  const porDia = [...dias.values()]
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .slice(-30)
    .map(({ nombre, ...resto }) => ({ fecha: nombre, ...resto }));

  return {
    esquema: 1,
    fuente: "Agregado público del ledger local de Orquesta IA",
    privacidad: "No incluye prompts, cuentas, sesiones, rutas ni identificadores de ejecución.",
    actualizadoEn: hasta,
    periodo: { desde, hasta },
    totales: {
      tokens,
      llamadas,
      exitos,
      fallos,
      tasaExito: Number(((exitos / llamadas) * 100).toFixed(1)),
      promedioTokens: Math.round(tokens / llamadas),
      segundos: Number(segundos.toFixed(1)),
      limitadas,
    },
    porProveedor: ordenar(proveedores),
    porTarea: ordenar(tareas, 10),
    porDia,
  };
}

async function main() {
  const opciones = argumentos(process.argv.slice(2));
  const ledger = archivoRegularDentro(carpetaLedger, opciones.ledger, "El ledger");
  const salida = salidaRegularExacta(salidaPredeterminada, opciones.salida, "La salida pública");
  const bruto = await readFile(ledger, "utf8");
  const actividad = agregar(bruto.split(/\r?\n/));
  const modulo = `// Generado por herramientas/sincronizar-actividad.js. No editar a mano.\n` +
    `// El ledger privado nunca forma parte de este archivo.\n\n` +
    `export const ACTIVIDAD_IA = ${JSON.stringify(actividad, null, 2)};\n`;
  const temporal = join(dirname(salida), `.${basename(salida)}.${process.pid}.${randomUUID()}.tmp`);
  try {
    await writeFile(temporal, modulo, { encoding: "utf8", mode: 0o644, flag: "wx" });
    await rename(temporal, salida);
  } finally {
    await unlink(temporal).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
  console.log(`Actividad agregada: ${actividad.totales.tokens.toLocaleString("es-CO")} tokens en ${actividad.totales.llamadas} llamadas.`);
}

main().catch((error) => {
  console.error(`No se pudo sincronizar la actividad: ${error.message}`);
  process.exitCode = 1;
});
