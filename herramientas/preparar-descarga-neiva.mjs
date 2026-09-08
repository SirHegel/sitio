#!/usr/bin/env node
// Coteja el archivo YA descargado; nunca declara haber ejecutado el juego.
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { descargaUnrealValidada } from '../descarga-neiva.js';

const destino = fileURLToPath(new URL('../datos/descarga-neiva.json', import.meta.url));

// O(N) tiempo, O(1) memoria acotada por stream para N bytes del archivo.
// Exige recibo externo de ejecución y correspondencia exacta URL/hash/bytes/plataforma.
export async function comprobarDescarga(recibo, archivo) {
  if (!descargaUnrealValidada(recibo)) throw Error('Falta un comprobante válido de descarga y ejecución del activo publicado.');
  const info = await stat(archivo);
  if (!info.isFile() || info.size !== recibo.bytes) throw Error('El tamaño del archivo descargado no coincide con el comprobante.');
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(archivo)) hash.update(chunk);
  if (hash.digest('hex') !== recibo.sha256) throw Error('SHA-256 del archivo descargado distinto del comprobante.');
  const { url, sha256, bytes, platform, verification: proof } = recibo;
  // Sólo se conservan campos públicos del contrato, nunca logs, rutas o credenciales.
  return { url, sha256, bytes, platform, verification: {
    url, sha256, bytes, platform, httpStatus: 200, launchPassed: true, checkedAt: proof.checkedAt,
  } };
}

// O(N) al cotejar el archivo; sin --aplicar no cambia ninguna fuente ni el estado público.
export async function main(args, { salida = destino, mostrar = console.log } = {}) {
  const { values } = parseArgs({ args, options: {
    comprobante: { type: 'string' }, archivo: { type: 'string' },
    aplicar: { type: 'boolean', default: false }, help: { type: 'boolean', short: 'h' },
  } });
  if (values.help) {
    mostrar('node herramientas/preparar-descarga-neiva.mjs --comprobante recibo.json --archivo paquete-descargado.tar.gz [--aplicar]');
    mostrar('Sin --aplicar: coteja SHA/bytes y muestra JSON. No descarga, ejecuta, publica ni prueba Unreal.');
    return;
  }
  if (!values.comprobante?.trim() || !values.archivo?.trim()) throw Error('Indica --comprobante y --archivo ya descargado.');
  const recibo = JSON.parse(await readFile(values.comprobante, 'utf8'));
  const verificado = await comprobarDescarga(recibo, values.archivo);
  const texto = JSON.stringify(verificado, null, 2) + '\n';
  if (values.aplicar) {
    const temporal = resolve(dirname(salida), `.descarga-neiva.publicacion-${randomUUID()}`);
    try {
      await writeFile(temporal, texto, { flag: 'wx' });
      await rename(temporal, salida);
    } finally { await unlink(temporal).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
  }
  mostrar(texto.trimEnd());
  return verificado;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
