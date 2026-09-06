import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { leerContinuidadOro, validarContinuidadOro } from "../lib/continuidad-publicacion.js";
import { auditarSalidaEstaticaOro } from "../herramientas/validar-publicacion-oro.mjs";

const raiz = fileURLToPath(new URL("..", import.meta.url));

test("continuidad acredita HTTP anteriores y el contenido exacto sin cerrar la réplica", async () => {
  const acta = await leerContinuidadOro(raiz);
  const manuscrito = await readFile(join(raiz, "salidas/oro-perimetros.mdx"), "utf8");
  assert.equal(acta.estado, "publicada");
  assert.equal(acta.replica.estado, "pendiente_documentacion");
  assert.equal(acta.replica.respuestas, 2);
  for (const alterada of [
    { ...acta, manuscritoSha256: "0".repeat(64) },
    { ...acta, autorizacionContinuidad: null },
    { ...acta, ruta: "/blog/otra/" },
    { ...acta, verificacion: { ...acta.verificacion, articuloHttp: 404 } },
  ]) assert.throws(() => validarContinuidadOro(alterada, manuscrito), /acta de continuidad/);
  assert.throws(() => validarContinuidadOro(acta, `${manuscrito}\nCambio posterior.`), /acta de continuidad/);
});

test("sin acta no hay continuidad; ningún archivo privado puede entrar en la salida", async () => {
  const temporal = await mkdtemp(join(tmpdir(), "continuidad-oro-"));
  try {
    assert.equal(await leerContinuidadOro(temporal), null);
    await mkdir(join(temporal, "blog/oro-perimetros"), { recursive: true });
    await writeFile(join(temporal, "blog/oro-perimetros/index.html"), "<main>Estudio revisado</main>");
    assert.equal((await auditarSalidaEstaticaOro(temporal)).cumple, true);
    await mkdir(join(temporal, "manuscrito/respuestas-privadas"), { recursive: true });
    await writeFile(join(temporal, "manuscrito/respuestas-privadas/respuesta.eml"), "correo privado");
    assert.equal((await auditarSalidaEstaticaOro(temporal)).cumple, false);
  } finally { await rm(temporal, { recursive: true, force: true }); }
});
