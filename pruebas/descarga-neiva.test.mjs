import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DESCARGA_NEIVA_UNREAL, descargaUnrealValidada, descargaNeiva, entregaNeivaLista, NEIVA_REVISION_NATIVA, NEIVA_RUTA_RECIBO } from "../descarga-neiva.js";
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
  assert.match(descargaNeiva(pending), /alfa 0\.3 está en desarrollo/);
  assert.doesNotMatch(descargaNeiva(pending), /archivo Linux está publicado/);
});

test("el contrato exige release del repositorio y comprobantes coherentes de archivo y ejecución", () => {
  assert.equal(descargaUnrealValidada(artifact()), true);
  assert.doesNotMatch(descargaNeiva(artifact()), /data-descarga-unreal/, "Un recibo genérico no acredita la entrega anunciada.");
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
    if (entregaNeivaLista()) {
      assert.ok(html.includes(DESCARGA_NEIVA_UNREAL.url));
      assert.match(html, /Alfa 0\.3 (?:disponible|para Linux)/);
      assert.doesNotMatch(html, /próxima alfa|Próxima alfa|descarga Linux x64 en preparación|Descarga Linux x64 en preparación|entrega prevista/i);
    } else {
      assert.match(html, /Alfa en desarrollo/);
      assert.doesNotMatch(html, /href="[^"]+\/releases\/download\//);
    }
    assert.match(html, /interpretad|aproximaci/);
  }
});

test('una entrega anterior o evidencia incompleta no habilitan el botón de la alfa anunciada', () => {
  // Metadatos sintéticos: sólo prueban la selección de versión, no una publicación real.
  const value = artifact();
  value.url = value.verification.url = 'https://github.com/SirHegel/neiva-abierta/releases/download/unreal-v0.3.0-linux-alpha/fixture.tar.gz';
  const publication = { revision: 'b'.repeat(40), receiptPath: 'data/verification/fixture.json', mediaVerified: true };
  assert.equal(entregaNeivaLista(value, publication), true);
  const previous = structuredClone(value);
  previous.url = previous.verification.url = previous.url.replace('unreal-v0.3.0', 'unreal-v0.2.0');
  assert.equal(descargaUnrealValidada(previous), true);
  assert.equal(entregaNeivaLista(previous, publication), false);
  for (const incomplete of [null, { ...publication, revision: null },
    { ...publication, receiptPath: '../fixture.json' }, { ...publication, mediaVerified: false }])
    assert.equal(entregaNeivaLista(value, incomplete), false);
  const untested = structuredClone(value);
  untested.verification.launchPassed = false;
  assert.equal(entregaNeivaLista(untested, publication), false);
});

test("páginas construidas presentan el juego Linux con descarga condicionada y antecedente web identificado", () => {
  const lista = entregaNeivaLista();
  if (lista) assert.match(DESCARGA_NEIVA_UNREAL.url, /unreal-v0\.3\.0-linux-alpha/);
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
  if (lista) {
    assert.ok(ficha.includes(NEIVA_REVISION_NATIVA));
    assert.ok(ficha.includes(NEIVA_RUTA_RECIBO));
  }
  assert.match(ficha, /<video\b[^>]*controls[^>]*playsinline[^>]*preload="none"/);
  assert.match(ficha, /src="\/activos\/neiva-unreal-linux\.webm"/);
  assert.doesNotMatch(ficha, /<video\b[^>]*autoplay|game05|WALKING|Editor-game|cuadros decodificados|<h3>Ecuación/);
  assert.match(ficha, /\.\/Jugar-Neiva\.sh/);
  assert.match(ficha, lista ? /Esta descarga corresponde a Linux/ : /La entrega prevista corresponde a Linux/);
  assert.match(ficha, lista ? /Alfa 0\.3 disponible para Linux/ : /Alfa en desarrollo/);
  assert.match(ficha, /ocho peatones/);
  assert.match(ficha, /siete clips/);
  assert.match(ficha, /17\.697/);
  assert.match(ficha, /17\.696/);
  assert.match(ficha, /una revisión manual/);
  assert.match(ficha, /se bloquean el movimiento, el salto y el reinicio/);
  assert.match(ficha, /Windows y macOS/);
  assert.doesNotMatch(ficha, /estudio ficticio|desde el estudio/);
  assert.match(ficha, /<track kind="captions"[^>]+srclang="es"/);
  assert.match(ficha, /Se recodificó/);
  const captions = readFileSync(new URL('../activos/neiva-unreal-linux-es.vtt', import.meta.url), 'utf8');
  assert.match(captions, /^WEBVTT/);
  assert.match(captions, /00:00\.100 --> 00:12\.000/);
  assert.match(captions, /Se llama Jhon Steven Álvarez Ruiz/);
});
