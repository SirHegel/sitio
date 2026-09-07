import { esc } from "./plantilla.js";

// Se completa sólo después de descargar el activo de una release y probar su ejecución.
// El comprobante repite URL, SHA, tamaño y plataforma para detectar datos desactualizados.
export const DESCARGA_NEIVA_UNREAL = Object.freeze({
  url: null, sha256: null, bytes: null, platform: null, verification: null,
});

// O(L) tiempo y espacio para L caracteres de URL, limitado a 1.024.
// Invariantes: activo del repositorio, huella/tamaño coincidentes y prueba de ejecución.
export function descargaUnrealValidada(artifact = DESCARGA_NEIVA_UNREAL) {
  if (!artifact || typeof artifact.url !== "string" || artifact.url.length > 1024) return false;
  let url;
  try { url = new URL(artifact.url); } catch { return false; }
  if (url.protocol !== "https:" || url.hostname !== "github.com" || url.username || url.password
    || !/^\/SirHegel\/neiva-abierta\/releases\/download\/[^/]+\/[^/]+$/.test(url.pathname)
    || url.search || url.hash) return false;
  if (!/^[a-f0-9]{64}$/.test(artifact.sha256 || "") || !Number.isSafeInteger(artifact.bytes) || artifact.bytes <= 0
    || !["Windows x64", "Linux x64"].includes(artifact.platform)) return false;
  const proof = artifact.verification;
  return Boolean(proof && proof.httpStatus === 200 && proof.launchPassed === true
    && proof.url === artifact.url && proof.sha256 === artifact.sha256 && proof.bytes === artifact.bytes
    && proof.platform === artifact.platform && /^\d{4}-\d{2}-\d{2}T/.test(proof.checkedAt || "")
    && Number.isFinite(Date.parse(proof.checkedAt)));
}

export function descargaNeiva(artifact = DESCARGA_NEIVA_UNREAL) {
  if (!descargaUnrealValidada(artifact)) return `<section id="descarga-unreal" class="sep-m" aria-labelledby="descarga-unreal-titulo">
    <h2 id="descarga-unreal-titulo">Descarga Unreal pendiente de compilación</h2>
    <p>La versión nativa está en preparación. Todavía no hay un ejecutable publicado ni una descarga disponible.</p>
  </section>`;
  const hash = artifact.sha256.match(/.{1,16}/g).map(esc).join("<wbr>");
  return `<section id="descarga-unreal" class="sep-m" aria-labelledby="descarga-unreal-titulo">
    <h2 id="descarga-unreal-titulo">Descarga para ${esc(artifact.platform)}</h2>
    <a class="boton primario" href="${esc(artifact.url)}" rel="noopener" target="_blank" data-descarga-unreal><span>Descargar Neiva para ${esc(artifact.platform)}</span></a>
    <p>Tamaño: ${artifact.bytes.toLocaleString("es-CO")} bytes. SHA-256: <code>${hash}</code>.</p>
  </section>`;
}
