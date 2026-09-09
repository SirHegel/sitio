import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { comprobarDescarga, main } from '../herramientas/preparar-descarga-neiva.mjs';

// Recibos y bytes sintéticos; no acreditan una release ni un ejecutable de Unreal.
async function fixture(t) {
  const folder = await mkdtemp(join(tmpdir(), 'neiva-receipt-test-'));
  t.after(() => rm(folder, { recursive: true, force: true }));
  const bytes = Buffer.from('archivo sintético de contrato');
  const value = { url: 'https://github.com/SirHegel/neiva-abierta/releases/download/fixture/fixture.tar.gz', sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, platform: 'Linux x64' };
  const recibo = { ...value, verification: { ...value, httpStatus: 200, launchPassed: true, checkedAt: '2026-09-07T18:00:00Z' } };
  const archivo = join(folder, 'fixture.tar.gz'), comprobante = join(folder, 'receipt.json'), salida = join(folder, 'output.json');
  await writeFile(archivo, bytes); await writeFile(comprobante, JSON.stringify(recibo)); await writeFile(salida, 'pendiente');
  return { folder, archivo, comprobante, salida, recibo, bytes };
}

test('la preparación coteja archivo real y no activa la descarga sin --aplicar', async t => {
  const f = await fixture(t), output = [];
  const result = await main(['--comprobante', f.comprobante, '--archivo', f.archivo], { salida: f.salida, mostrar: value => output.push(value) });
  assert.deepEqual(result, f.recibo);
  assert.deepEqual(JSON.parse(output[0]), f.recibo);
  assert.equal(await readFile(f.salida, 'utf8'), 'pendiente');
});

test('rechaza hash alterado, tamaño distinto y prueba de ejecución ausente sin modificar salida', async t => {
  const f = await fixture(t);
  for (const mutate of [
    r => { r.verification.launchPassed = false; },
    r => { r.verification.httpStatus = 403; },
    r => { r.url = r.verification.url = 'https://github.com/otro/repo/releases/download/x/y'; },
    r => { r.sha256 = r.verification.sha256 = '0'.repeat(64); },
    r => { r.bytes = r.verification.bytes = f.bytes.length + 1; },
  ]) {
    const value = structuredClone(f.recibo); mutate(value);
    await writeFile(f.comprobante, JSON.stringify(value));
    await assert.rejects(main(['--comprobante', f.comprobante, '--archivo', f.archivo, '--aplicar'], { salida: f.salida, mostrar() {} }));
    assert.equal(await readFile(f.salida, 'utf8'), 'pendiente');
  }
  await writeFile(f.archivo, Buffer.alloc(f.bytes.length, 0));
  await assert.rejects(comprobarDescarga(f.recibo, f.archivo), /SHA-256/);
});

test('la aplicación explícita escribe sólo el contrato público tras cotejar los bytes', async t => {
  const f = await fixture(t);
  await writeFile(f.comprobante, JSON.stringify({ ...f.recibo, privateNote: 'NO PUBLICAR', verification: { ...f.recibo.verification, localPath: '/private/example' } }));
  await main(['--comprobante', f.comprobante, '--archivo', f.archivo, '--aplicar'], { salida: f.salida, mostrar() {} });
  assert.deepEqual(JSON.parse(await readFile(f.salida, 'utf8')), f.recibo);
});
