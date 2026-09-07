import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DESCARGA_NEIVA_UNREAL, descargaUnrealValidada, descargaNeiva } from "../descarga-neiva.js";

// Comprobante sintético de contrato: este archivo no declara una release existente.
const artifact = () => {
  const value = { url: "https://github.com/SirHegel/neiva-abierta/releases/download/test-fixture/neiva-test.zip", sha256: "a".repeat(64), bytes: 100, platform: "Linux x64" };
  return { ...value, verification: { ...value, httpStatus: 200, launchPassed: true, checkedAt: "2026-09-07T08:00:00Z" } };
};

test("sin ejecutable validado hay estado pendiente y cero botones de descarga", () => {
  assert.ok(Object.values(DESCARGA_NEIVA_UNREAL).every(value => value === null));
  assert.equal(descargaUnrealValidada(), false);
  assert.match(descargaNeiva(), /Descarga Unreal pendiente de compilación/);
  assert.doesNotMatch(descargaNeiva(), /<a\b|data-descarga-unreal/);
});

test("el contrato exige release del repositorio y comprobantes coherentes de archivo y ejecución", () => {
  assert.equal(descargaUnrealValidada(artifact()), true);
  assert.match(descargaNeiva(artifact()), /data-descarga-unreal/);
  for (const change of [
    value => { value.verification = null; },
    value => { value.verification.sha256 = "b".repeat(64); },
    value => { value.verification.bytes = 99; },
    value => { value.verification.launchPassed = false; },
    value => { value.url = "https://github.com/otro/repo/releases/download/x/y.zip"; },
    value => { value.url = "javascript:alert(1)"; },
    value => { value.platform = "Móvil"; },
  ]) {
    const value = artifact(); change(value);
    assert.equal(descargaUnrealValidada(value), false);
    assert.doesNotMatch(descargaNeiva(value), /data-descarga-unreal/);
  }
});

test("páginas construidas separan Unreal pendiente del prototipo Three.js anterior", () => {
  for (const route of ["juegos", "proyectos/neiva-abierta"]) {
    const html = readFileSync(new URL(`../publico/${route}/index.html`, import.meta.url), "utf8");
    assert.match(html, /Descarga Unreal pendiente de compilación/);
    assert.match(html, /prototipo web anterior|Prototipo web 0\.4 anterior/);
    assert.doesNotMatch(html, /data-descarga-unreal|href="[^"]+\/releases\/download\//);
  }
});
