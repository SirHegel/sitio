/** Compilador deliberadamente estrecho del único MDX especial del sitio. */

import { readFile } from "node:fs/promises";
import { parseArticleMarkdown } from "./lib/escritos.js";
import { markdownAHtml, slugificar } from "./escritos.js";

const SLUG = "oro-perimetros";
const MARCA = (vista) => `@@MAPA_ORO_${vista.toUpperCase()}@@`;
const COMPONENTE = /^<MapaOro manifiestoUrl="\/data\/oro\/manifiesto\.json" vista="(territorio|mundo)" \/>$/gm;

function contarPalabras(texto) {
  return String(texto || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/@@MAPA_ORO_[A-Z]+@@/g, " ")
    .replace(/<[^>]+>/g, " ")
    .match(/[\p{L}\p{N}][\p{L}\p{N}’'_-]*/gu)?.length || 0;
}

function fechaLegible(fecha) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "UTC" })
    .format(new Date(`${fecha}T00:00:00Z`));
}

function montaje(vista) {
  const etiqueta = vista === "mundo" ? "Mapa mundial del alcance documentado" : "Mapa territorial del estudio";
  return `<div class="mapa-oro-montaje" data-mapa-oro data-manifiesto="/data/oro/manifiesto.json" data-vista="${vista}" aria-label="${etiqueta}" aria-busy="false"><p role="status">Visualización cartográfica. La tabla conserva los datos con o sin JavaScript.</p></div>`;
}

/**
 * Complejidad O(B), B bytes de entrada. Invariantes: admite únicamente dos
 * instancias exactas de MapaOro; todo otro HTML conserva el rechazo del parser.
 */
export function compilarMdxOro(mdx) {
  const vistas = [];
  const markdown = String(mdx).replace(COMPONENTE, (_, vista) => {
    vistas.push(vista);
    return MARCA(vista);
  });
  if (vistas.filter((vista) => vista === "territorio").length !== 1
    || vistas.filter((vista) => vista === "mundo").length !== 1) {
    throw new Error("El MDX requiere un componente MapaOro permitido por cada vista");
  }

  // El cuerpo principal queda limitado a 6.000–9.000 palabras por la compuerta
  // editorial. Este techo mayor reserva espacio para réplicas íntegras anexas.
  const articulo = parseArticleMarkdown(markdown, {
    slug: SLUG,
    maxBodyCharacters: 180_000,
    maxBodyBytes: 240_000,
  });
  let html = markdownAHtml(articulo.cuerpo);
  for (const vista of ["territorio", "mundo"]) {
    html = html.replace(`<p>${MARCA(vista)}</p>`, montaje(vista));
  }
  const totalPalabras = contarPalabras(articulo.cuerpo);
  return {
    ...articulo,
    slug: SLUG,
    categoriaSlug: slugificar(articulo.categoria),
    fechaLegible: fechaLegible(articulo.fecha),
    html,
    palabras: totalPalabras,
    minutos: Math.max(1, Math.ceil(totalPalabras / 220)),
    scripts: ["/activos/cargar-mapa-oro.js"],
    especial: "oro",
  };
}

export async function cargarEstudioOro(ruta) {
  return compilarMdxOro(await readFile(ruta, "utf8"));
}
