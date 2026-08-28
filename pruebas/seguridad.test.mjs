import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import {
  archivoRegularDentro,
  salidaRegularExacta,
} from "../herramientas/seguridad.js";
import {
  notaInvestigacionHtml,
  notaInvestigacionTexto,
} from "../herramientas/nota-investigacion.js";
import { ejecutableChrome, rutaChromePermitida } from "./chrome.mjs";

const raiz = fileURLToPath(new URL("..", import.meta.url));

test("la nota de investigación separa estructura y contenido sin aceptar HTML anidado", () => {
  const nota = {
    introduccion: "Línea de trabajo:",
    enfasis: "<scr<script>ipt>alert(1)</script>",
    detalle: "Texto <img src=x onerror=alert(2)>",
  };
  const html = notaInvestigacionHtml(nota);
  assert.match(html, /^Línea de trabajo: <b>/);
  assert.doesNotMatch(html, /<script|<img/i);
  assert.match(html, /&lt;scr&lt;script&gt;ipt&gt;/);
  assert.equal(
    notaInvestigacionTexto(nota),
    "Línea de trabajo: <scr<script>ipt>alert(1)</script>. Texto <img src=x onerror=alert(2)>",
  );
});

test("las rutas permitidas se validan después de resolver enlaces simbólicos", () => {
  const base = mkdtempSync(join(tmpdir(), "sitio-rutas-"));
  const permitida = join(base, "permitida");
  const hermana = join(base, "permitida-maliciosa");
  const externa = join(base, "externa.txt");
  mkdirSync(permitida);
  mkdirSync(hermana);
  writeFileSync(join(permitida, "entrada.jsonl"), "{}\n");
  writeFileSync(join(hermana, "entrada.jsonl"), "{}\n");
  writeFileSync(externa, "privado\n");
  symlinkSync(externa, join(permitida, "escape.jsonl"));

  assert.equal(
    archivoRegularDentro(permitida, join(permitida, "entrada.jsonl")),
    realpathSync(join(permitida, "entrada.jsonl")),
  );
  assert.throws(() => archivoRegularDentro(permitida, externa), /debe permanecer dentro/);
  assert.throws(
    () => archivoRegularDentro(permitida, join(permitida, "..", "externa.txt")),
    /debe permanecer dentro/,
  );
  assert.throws(
    () => archivoRegularDentro(permitida, join(hermana, "entrada.jsonl")),
    /debe permanecer dentro/,
  );
  assert.throws(() => archivoRegularDentro(permitida, join(permitida, "escape.jsonl")), /debe permanecer dentro/);

  const salida = join(permitida, "salida.js");
  assert.equal(salidaRegularExacta(salida, salida), salida);
  assert.throws(() => salidaRegularExacta(salida, externa), /solo puede escribirse/);
  assert.throws(() => salidaRegularExacta(salida, join(permitida, "construir.js")), /solo puede escribirse/);
  assert.throws(
    () => salidaRegularExacta(salida, join(base, "directorio-inexistente", "salida.js")),
    /solo puede escribirse/,
  );
  symlinkSync(externa, salida);
  assert.throws(() => salidaRegularExacta(salida, salida), /no un enlace/);
});

test("PUPPETEER_EXECUTABLE_PATH solo puede seleccionar una ruta conocida de Chrome", () => {
  assert.equal(rutaChromePermitida("/usr/bin/../bin/google-chrome"), "/usr/bin/google-chrome");
  assert.throws(() => rutaChromePermitida("/bin/sh"), /ruta conocida de Chrome/);
  assert.throws(() => ejecutableChrome("/bin/sh"), /ruta conocida de Chrome/);
});

test("el sincronizador no lee un ledger indicado fuera de su directorio privado", () => {
  assert.throws(
    () => salidaRegularExacta(join(raiz, "datos-actividad.js"), join(raiz, "construir.js"), "La salida pública"),
    /solo puede escribirse/,
  );
  const ejecucion = spawnSync(
    process.execPath,
    ["herramientas/sincronizar-actividad.js", "--ledger", "/etc/passwd"],
    { cwd: raiz, encoding: "utf8", env: { ...process.env, ORQUESTA_LEDGER: "" } },
  );
  assert.notEqual(ejecucion.status, 0);
  assert.match(ejecucion.stderr, /El ledger solo puede leerse desde/);
});
