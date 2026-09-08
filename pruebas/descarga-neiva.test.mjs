import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DESCARGA_NEIVA_UNREAL, descargaUnrealValidada, descargaNeiva } from "../descarga-neiva.js";
import { paginaNeiva } from '../neiva-abierta.js';
import { indiceJuegos } from '../juegos.js';

// Comprobante sintético de contrato: este archivo no declara una release existente.
const artifact = () => {
  const value = { url: "https://github.com/SirHegel/neiva-abierta/releases/download/test-fixture/neiva-test.zip", sha256: "a".repeat(64), bytes: 100, platform: "Linux x64" };
  return { ...value, verification: { ...value, httpStatus: 200, launchPassed: true, checkedAt: "2026-09-07T08:00:00Z" } };
};

test("sin ejecutable validado hay estado pendiente y cero botones de descarga", () => {
  const pending = { url: null, sha256: null, bytes: null, platform: null, verification: null };
  assert.equal(descargaUnrealValidada(pending), false);
  assert.match(descargaNeiva(pending), /Descarga Linux x64 en preparación/);
  assert.doesNotMatch(descargaNeiva(pending), /<a\b|data-descarga-unreal/);
  assert.match(descargaNeiva(pending), /alfa 0\.2 está en desarrollo/);
  assert.doesNotMatch(descargaNeiva(pending), /archivo Linux está publicado/);
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

test('las plantillas reflejan el contrato activo sin anunciar una descarga pendiente', () => {
  for (const html of [paginaNeiva(), indiceJuegos()]) {
    if (descargaUnrealValidada()) {
      assert.ok(html.includes(DESCARGA_NEIVA_UNREAL.url));
      assert.match(html, /Alfa 0\.2 (?:disponible|para Linux)/);
      assert.doesNotMatch(html, /próxima alfa|Próxima alfa|descarga Linux x64 en preparación|Descarga Linux x64 en preparación|entrega prevista/i);
    } else {
      assert.match(html, /Alfa en desarrollo/);
      assert.doesNotMatch(html, /href="[^"]+\/releases\/download\//);
    }
    assert.match(html, /interpretad|aproximaci/);
  }
});

test("páginas construidas presentan el juego Linux con descarga condicionada y antecedente web identificado", () => {
  const lista = descargaUnrealValidada();
  if (!lista) assert.ok(Object.values(DESCARGA_NEIVA_UNREAL).every(value => value === null));
  for (const route of ["juegos", "proyectos/neiva-abierta"]) {
    const html = readFileSync(new URL(`../publico/${route}/index.html`, import.meta.url), "utf8");
    assert.match(html, /Unreal Engine 5\.5\.4/);
    assert.doesNotMatch(html, /pendiente de compilación|compilación y la ejecución del juego nativo siguen pendientes/);
    assert.match(html, /prototipo web anterior|Prototipo web 0\.4 anterior/);
    if (lista) assert.ok(html.includes(DESCARGA_NEIVA_UNREAL.url));
    else {
      assert.match(html, /Descarga Linux x64 en preparación/);
      assert.doesNotMatch(html, /data-descarga-unreal|href="[^"]+\/releases\/download\//);
    }
  }
  const ficha = readFileSync(new URL('../publico/proyectos/neiva-abierta/index.html', import.meta.url), 'utf8');
  assert.match(ficha, /Registro técnico de pruebas/);
  assert.match(ficha, /\/data\/verification\/unreal-visual-download\.json/);
  assert.match(ficha, /<video\b[^>]*controls[^>]*playsinline[^>]*preload="none"/);
  assert.match(ficha, /src="\/activos\/neiva-unreal-linux\.webm"/);
  assert.doesNotMatch(ficha, /<video\b[^>]*autoplay|game05|WALKING|Editor-game|cuadros decodificados|<h3>Ecuación/);
  assert.match(ficha, /\.\/Jugar-Neiva\.sh/);
  assert.match(ficha, lista ? /Esta descarga corresponde a Linux/ : /La entrega prevista corresponde a Linux/);
  assert.match(ficha, lista ? /Alfa 0\.2 disponible para Linux/ : /Alfa en desarrollo/);
  assert.match(ficha, /árboles de copa ancha y bancos/);
});
