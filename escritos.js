/* Cargador Markdown deliberadamente pequeño y sin dependencias.
   El contenido se escapa antes de convertirse a HTML: un escrito nunca puede
   inyectar scripts en el sitio ni relajar la política de seguridad. */

import { readFile, readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { parseArticleMarkdown } from "./lib/escritos.js";

const escapar = (valor) => String(valor)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

export function slugificar(valor) {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function enLinea(texto) {
  const piezas = [];
  const guardar = (html) => {
    const llave = `\u0000${piezas.length}\u0000`;
    piezas.push(html);
    return llave;
  };

  let salida = String(texto);
  salida = salida.replace(/`([^`\n]+)`/g, (_, codigo) => guardar(`<code>${escapar(codigo)}</code>`));
  salida = salida.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
    (_, etiqueta, url) => guardar(`<a href="${escapar(url)}"${url.startsWith("http") ? ' rel="noopener" target="_blank"' : ""}>${escapar(etiqueta)}</a>`));
  salida = escapar(salida)
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
  salida = salida.replace(/\u0000(\d+)\u0000/g, (_, i) => piezas[Number(i)] || "");
  return salida;
}

const iniciaBloque = (linea) =>
  /^\s*$|^```|^#{2,4}\s|^>\s?|^[-*]\s+|^\d+\.\s+|^---+$/.test(linea);

export function markdownAHtml(markdown) {
  const lineas = String(markdown).replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let i = 0;

  while (i < lineas.length) {
    const linea = lineas[i];
    if (!linea.trim()) { i += 1; continue; }

    const cerca = /^```([a-z0-9_-]*)\s*$/i.exec(linea);
    if (cerca) {
      const codigo = [];
      i += 1;
      while (i < lineas.length && !/^```\s*$/.test(lineas[i])) codigo.push(lineas[i++]);
      if (i >= lineas.length) throw new Error("Bloque de código sin cierre```");
      i += 1;
      const clase = cerca[1] ? ` class="language-${escapar(cerca[1].toLowerCase())}"` : "";
      html.push(`<pre><code${clase}>${escapar(codigo.join("\n"))}</code></pre>`);
      continue;
    }

    const titulo = /^(#{2,4})\s+(.+)$/.exec(linea);
    if (titulo) {
      const nivel = titulo[1].length;
      const texto = titulo[2].trim();
      html.push(`<h${nivel} id="${slugificar(texto)}">${enLinea(texto)}</h${nivel}>`);
      i += 1;
      continue;
    }

    if (/^>\s?/.test(linea)) {
      const cita = [];
      while (i < lineas.length && /^>\s?/.test(lineas[i])) cita.push(lineas[i++].replace(/^>\s?/, ""));
      html.push(`<blockquote>${cita.map(enLinea).join("<br>")}</blockquote>`);
      continue;
    }

    const viñeta = /^[-*]\s+/.test(linea);
    const numerada = /^\d+\.\s+/.test(linea);
    if (viñeta || numerada) {
      const tipo = viñeta ? "ul" : "ol";
      const patron = viñeta ? /^[-*]\s+(.+)$/ : /^\d+\.\s+(.+)$/;
      const elementos = [];
      while (i < lineas.length) {
        const item = patron.exec(lineas[i]);
        if (!item) break;
        elementos.push(`<li>${enLinea(item[1])}</li>`);
        i += 1;
      }
      html.push(`<${tipo}>${elementos.join("")}</${tipo}>`);
      continue;
    }

    if (/^---+$/.test(linea)) {
      html.push("<hr>");
      i += 1;
      continue;
    }

    const parrafo = [linea.trim()];
    i += 1;
    while (i < lineas.length && !iniciaBloque(lineas[i])) parrafo.push(lineas[i++].trim());
    html.push(`<p>${enLinea(parrafo.join(" "))}</p>`);
  }

  return html.join("\n");
}

function palabras(texto) {
  return String(texto)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`\[\]()-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function fechaLegible(fecha) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "UTC" })
    .format(new Date(fecha + "T00:00:00Z"));
}

export async function cargarEscritos(directorio) {
  let entradas = [];
  try {
    entradas = await readdir(directorio, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const escritos = [];
  for (const entrada of entradas.sort((a, b) => a.name.localeCompare(b.name, "es"))) {
    if (!entrada.isFile() || !entrada.name.endsWith(".md") || entrada.name.toLowerCase() === "readme.md") continue;
    const ruta = join(directorio, entrada.name);
    const slug = slugificar(basename(entrada.name, ".md"));
    const { titulo, categoria, fecha, resumen, etiquetas, cuerpo } = parseArticleMarkdown(
      await readFile(ruta, "utf8"),
      { slug },
    );
    const totalPalabras = palabras(cuerpo);
    escritos.push({
      slug,
      titulo: titulo.trim().slice(0, 160),
      categoria: categoria.trim().slice(0, 60),
      categoriaSlug: slugificar(categoria),
      fecha,
      fechaLegible: fechaLegible(fecha),
      resumen: resumen.trim().slice(0, 360),
      etiquetas,
      cuerpo,
      html: markdownAHtml(cuerpo),
      palabras: totalPalabras,
      minutos: Math.max(1, Math.ceil(totalPalabras / 220)),
    });
  }

  const vistos = new Set();
  for (const escrito of escritos) {
    if (vistos.has(escrito.slug)) throw new Error(`Slug de escrito repetido: ${escrito.slug}`);
    vistos.add(escrito.slug);
  }
  return escritos.sort((a, b) => b.fecha.localeCompare(a.fecha) || a.titulo.localeCompare(b.titulo, "es"));
}

export function categoriasDe(escritos, base = []) {
  const mapa = new Map();
  for (const categoria of [...base, ...escritos.map((e) => e.categoria)]) {
    const slug = slugificar(categoria);
    if (slug && !mapa.has(slug)) mapa.set(slug, { slug, nombre: categoria });
  }
  return [...mapa.values()];
}
