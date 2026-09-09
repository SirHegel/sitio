import { esc } from "./plantilla.js";
import descarga from "./datos/descarga-neiva.json" with { type: "json" };

// Se completa sólo después de descargar el activo de una release y probar su ejecución.
// El comprobante repite URL, SHA, tamaño y plataforma para detectar datos desactualizados.
export const DESCARGA_NEIVA_UNREAL = Object.freeze(descarga);

// Recibo público y medios aprobados del paquete 0.3 descargado y ejecutado.
export const NEIVA_REVISION_NATIVA = '73f34183af717941cd709e98e38e813c7db39d88';
export const NEIVA_RUTA_RECIBO = 'data/verification/unreal-03-download.json';
export const NEIVA_MEDIOS_VERIFICADOS = true;

// O(L) tiempo y espacio, L <= 1.024. Un recibo 0.2 no habilita una ficha 0.3.
export function entregaNeivaLista(artifact = DESCARGA_NEIVA_UNREAL, publication = {
  revision: NEIVA_REVISION_NATIVA, receiptPath: NEIVA_RUTA_RECIBO, mediaVerified: NEIVA_MEDIOS_VERIFICADOS,
}) {
  return descargaUnrealValidada(artifact)
    && new URL(artifact.url).pathname.startsWith('/SirHegel/neiva-abierta/releases/download/unreal-v0.3.0-linux-alpha/')
    && artifact.platform === 'Linux x64'
    && /^[a-f0-9]{40}$/.test(publication?.revision || '')
    && /^data\/verification\/[a-z0-9-]+\.json$/.test(publication?.receiptPath || '')
    && publication?.mediaVerified === true;
}

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
  if (!entregaNeivaLista(artifact)) return `<section id="descarga-unreal" class="sep-m" aria-labelledby="descarga-unreal-titulo">
    <h2 id="descarga-unreal-titulo">Descarga Linux x64 en preparación</h2>
    <p>La alfa 0.3 está en desarrollo. La próxima descarga se habilitará cuando el paquete publicado haya sido descargado y probado.</p>
  </section>`;
  const hash = artifact.sha256.match(/.{1,16}/g).map(esc).join("<wbr>");
  return `<section id="descarga-unreal" class="sep-m" aria-labelledby="descarga-unreal-titulo">
    <h2 id="descarga-unreal-titulo">Descarga para ${esc(artifact.platform)}</h2>
    <a class="boton primario" href="${esc(artifact.url)}" rel="noopener" target="_blank" data-descarga-unreal><span>Descargar Neiva para ${esc(artifact.platform)}</span></a>
    <p>Gratis · Archivo .tar.gz · ${(artifact.bytes / 1048576).toFixed(1).replace(".", ",")} MiB</p>
    <details class="sep-s"><summary>Verificar el archivo descargado</summary><p>Tamaño exacto: ${artifact.bytes.toLocaleString("es-CO")} bytes. SHA-256: <code>${hash}</code>.</p></details>
  </section>`;
}
