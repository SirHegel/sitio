const limpio = (valor) => String(valor ?? "").replace(/\s+/g, " ").trim();
const escaparHtml = (valor) => limpio(valor)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

export function notaInvestigacionTexto(nota) {
  return `${limpio(nota.introduccion)} ${limpio(nota.enfasis)}. ${limpio(nota.detalle)}`.trim();
}

export function notaInvestigacionHtml(nota) {
  return `${escaparHtml(nota.introduccion)} <b>${escaparHtml(nota.enfasis)}</b>. ${escaparHtml(nota.detalle)}`;
}
