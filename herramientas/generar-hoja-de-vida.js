#!/usr/bin/env node

/* Genera la fuente HTML y el PDF descargable de la hoja de vida.
   El documento usa un flujo principal lineal, encabezados semánticos y texto real
   para conservar una lectura limpia en ATS y extractores de PDF. */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  ACTIVIDAD_IA,
  CERTIFICACIONES,
  EDUCACION,
  EXPERIENCIA,
  IDIOMAS,
  INVESTIGACION,
  PERSONA,
  REPOSITORIOS_GITHUB,
  SITIO,
} from "../datos.js";
import { ARCHIVO_HOJA_DE_VIDA, EVIDENCIA_TECNICA, HOJA_DE_VIDA } from "../datos-hoja-de-vida.js";
import { notaInvestigacionTexto } from "./nota-investigacion.js";

const raiz = dirname(dirname(fileURLToPath(import.meta.url)));
const carpeta = join(raiz, "documentos", "hoja-de-vida");
const htmlRuta = join(carpeta, "hoja-de-vida-jhon-steven-alvarez-ruiz.html");
const manifiestoRuta = join(carpeta, "manifiesto.json");
const pdfRuta = join(raiz, ARCHIVO_HOJA_DE_VIDA.replace(/^\//, ""));
const fotoRuta = join(raiz, "activos", "retrato-profesional.jpg");

const esc = (valor) => String(valor ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const limpio = (valor) => String(valor ?? "").replace(/\s+/g, " ").trim();
const lista = (items) => `<ul>${items.map((item) => `<li>${esc(limpio(item))}</li>`).join("")}</ul>`;
const sha256 = (contenido) => createHash("sha256").update(contenido).digest("hex");

const fuentesRelativas = [
  "datos.js",
  "datos-github.js",
  "datos-hoja-de-vida.js",
  "herramientas/generar-hoja-de-vida.js",
  "herramientas/nota-investigacion.js",
  "activos/retrato-profesional.jpg",
];
const huellaFuentes = createHash("sha256");
for (const relativa of fuentesRelativas) {
  huellaFuentes.update(relativa).update("\0").update(await readFile(join(raiz, relativa))).update("\0");
}

const experiencia = EXPERIENCIA.map((empleo) => `
      <article class="entrada">
        <div class="entrada-cabecera">
          <h3>${esc(empleo.cargo)}</h3>
          <p class="fecha">${esc(empleo.fechas)}</p>
        </div>
        <p class="entidad">${esc(empleo.empresa)} · ${esc(empleo.lugar)}</p>
        ${lista(empleo.puntos)}
      </article>`).join("");

const proyectos = HOJA_DE_VIDA.proyectos.map((proyecto) => `
      <article class="entrada proyecto">
        <h3>${proyecto.url ? `<a href="${esc(proyecto.url)}">${esc(proyecto.nombre)}</a>` : esc(proyecto.nombre)}</h3>
        <p class="tecnologias">${esc(proyecto.tecnologias)}${proyecto.visibilidad ? ` · ${esc(proyecto.visibilidad)}` : ""}</p>
        <p>${esc(limpio(proyecto.descripcion))}</p>
      </article>`).join("");

const educacion = EDUCACION.map((estudio) => `
      <article class="entrada compacta">
        <div class="entrada-cabecera">
          <h3>${esc(estudio.titulo)}</h3>
          <p class="fecha">${esc(estudio.fechas)}</p>
        </div>
        <p class="entidad">${esc(estudio.institucion)}</p>
        ${estudio.nota ? `<p>${esc(estudio.nota)}</p>` : ""}
      </article>`).join("");

const certificaciones = CERTIFICACIONES.map((credencial) => `
        <li><strong>${esc(credencial.nombre)}</strong> — ${esc(credencial.emisor)} · ${esc(credencial.fecha)}</li>`).join("");

const competencias = HOJA_DE_VIDA.competencias.map((grupo) => `
      <div class="competencia">
        <h3>${esc(grupo.nombre)}</h3>
        <p>${esc(grupo.items)}</p>
      </div>`).join("");

const foto = (await readFile(fotoRuta)).toString("base64");
const periodoActividad = `${new Date(ACTIVIDAD_IA.periodo.desde).toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}–${new Date(ACTIVIDAD_IA.periodo.hasta).toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}`;

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="author" content="${esc(PERSONA.nombre)}">
<meta name="description" content="Hoja de vida de ${esc(PERSONA.nombre)}: automatización, sistemas multiagente, datos y economía aplicada.">
<title>Hoja de vida — ${esc(PERSONA.nombre)}</title>
<style>
  @page { size: A4; margin: 12mm 14mm 14mm; }
  * { box-sizing: border-box; }
  html { color: #172235; background: #fff; font-family: Arial, "Helvetica Neue", sans-serif; font-size: 9.7pt; line-height: 1.38; }
  body { margin: 0 auto; max-width: 182mm; }
  a { color: #173f67; text-decoration: none; }
  p { margin: 0 0 5pt; }
  strong { color: #101b2c; }
  header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 31mm;
    gap: 8mm;
    align-items: start;
    padding: 0 0 7mm;
    border-bottom: 2.2pt solid #b9752a;
  }
  .identidad { min-width: 0; }
  .kicker { margin: 0 0 3pt; color: #b06b21; font-size: 8pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  h1 { margin: 0; color: #0d2843; font-size: 23pt; line-height: 1.02; letter-spacing: -.025em; }
  .titular { margin: 5pt 0 7pt; color: #304a62; font-size: 11.2pt; font-weight: 700; line-height: 1.25; }
  .contacto, .enlaces { margin: 2pt 0 0; font-size: 8.8pt; line-height: 1.35; }
  .contacto { color: #32465a; }
  .enlaces { overflow-wrap: anywhere; }
  .foto { width: 31mm; height: 42mm; object-fit: cover; object-position: center 22%; border: 1pt solid #c9d1d8; border-radius: 2mm; }
  main { padding-top: 3mm; }
  section { margin-top: 5.5mm; }
  h2 {
    margin: 0 0 3.2mm;
    padding-bottom: 1.4mm;
    border-bottom: .8pt solid #bcc7d1;
    color: #0d3658;
    font-size: 12pt;
    line-height: 1.15;
    letter-spacing: .065em;
    text-transform: uppercase;
  }
  h3 { margin: 0; color: #14283d; font-size: 10.2pt; line-height: 1.25; }
  ul { margin: 2pt 0 0; padding-left: 15pt; }
  li { margin: 0 0 2.7pt; padding-left: 1pt; }
  .resumen p { margin-bottom: 5pt; }
  .destacado {
    margin-top: 5mm;
    padding: 4mm 4.5mm;
    border-left: 3pt solid #b9752a;
    background: #f2f5f7;
  }
  .destacado h2 { margin-bottom: 2mm; border: 0; padding: 0; }
  .destacado .meta { color: #476177; font-size: 8.8pt; }
  .destacado ul { columns: 1; }
  .competencia { margin-bottom: 3.3mm; break-inside: avoid; }
  .competencia h3 { color: #173f67; font-size: 9.5pt; }
  .competencia p { margin-top: 1pt; }
  .entrada { margin: 0 0 5mm; break-inside: avoid-page; }
  .entrada-cabecera { display: flex; align-items: baseline; justify-content: space-between; gap: 8mm; }
  .entrada-cabecera h3 { flex: 1; }
  .fecha { flex: 0 0 auto; margin: 0; color: #4d6174; font-size: 8.6pt; font-weight: 700; text-align: right; }
  .entidad { margin: 1pt 0 2.2pt; color: #986020; font-weight: 700; }
  .entrada.compacta { margin-bottom: 3.8mm; }
  .proyecto { padding-bottom: 4mm; border-bottom: .7pt solid #d6dde3; }
  .proyecto:last-child { border-bottom: 0; }
  .proyecto .tecnologias { margin: 1pt 0 2pt; color: #986020; font-size: 8.7pt; font-weight: 700; }
  .evidencia { margin: 2.5mm 0 0; padding-left: 15pt; }
  .evidencia li { margin-bottom: 2pt; }
  .investigacion { break-inside: avoid; }
  .certificaciones { columns: 1; }
  .certificaciones li { margin-bottom: 3pt; }
  .cierre { margin-top: 6mm; padding-top: 3mm; border-top: 1pt solid #b9752a; color: #52677a; font-size: 8.4pt; }
  .pagina-nueva { break-before: page; }
  @media screen {
    body { padding: 14mm; box-shadow: 0 0 20px rgba(20, 36, 51, .12); }
  }
  @media print {
    html, body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    a { color: #173f67; }
  }
</style>
</head>
<body>
  <header>
    <div class="identidad">
      <p class="kicker">Hoja de vida · ${esc(HOJA_DE_VIDA.actualizado)}</p>
      <h1>${esc(PERSONA.nombre)}</h1>
      <p class="titular">${esc(HOJA_DE_VIDA.titular)}</p>
      <p class="contacto">${esc(HOJA_DE_VIDA.disponibilidad)} · ${esc(PERSONA.telefono)} · <a href="mailto:${esc(PERSONA.email)}">${esc(PERSONA.email)}</a></p>
      <p class="enlaces"><a href="${esc(SITIO)}">${esc(SITIO.replace(/^https?:\/\//, ""))}</a> · <a href="${esc(PERSONA.linkedin)}">LinkedIn</a> · <a href="${esc(PERSONA.github)}">GitHub</a></p>
    </div>
    <img class="foto" src="data:image/jpeg;base64,${foto}" alt="Retrato profesional de ${esc(PERSONA.nombre)}">
  </header>

  <main>
    <section class="resumen" aria-labelledby="perfil">
      <h2 id="perfil">Perfil profesional</h2>
      ${HOJA_DE_VIDA.resumen.map((parrafo) => `<p>${esc(limpio(parrafo))}</p>`).join("")}
    </section>

    <section class="destacado" aria-labelledby="cauce">
      <h2 id="cauce">${esc(HOJA_DE_VIDA.cauce.nombre)} · Arquitectura multi-harness</h2>
      <p class="meta">Co-creado con <a href="${esc(HOJA_DE_VIDA.cauce.socioUrl)}">${esc(HOJA_DE_VIDA.cauce.socio)}</a> · <a href="${esc(HOJA_DE_VIDA.cauce.url)}">humanizar.tech</a> · <a href="${esc(HOJA_DE_VIDA.cauce.repositorioPublico)}">Repositorio de la presentación pública</a></p>
      <p>${esc(limpio(HOJA_DE_VIDA.cauce.descripcion))}</p>
      ${lista(HOJA_DE_VIDA.cauce.puntos)}
    </section>

    <section class="pagina-nueva" aria-labelledby="diferencial">
      <h2 id="diferencial">Diferencial profesional</h2>
      ${lista(HOJA_DE_VIDA.diferenciales)}
    </section>

    <section aria-labelledby="competencias">
      <h2 id="competencias">Competencias técnicas</h2>
      ${competencias}
    </section>

    <section class="pagina-nueva" aria-labelledby="experiencia">
      <h2 id="experiencia">Experiencia profesional</h2>
      ${experiencia}
    </section>

    <section class="pagina-nueva" aria-labelledby="proyectos">
      <h2 id="proyectos">Proyectos técnicos seleccionados</h2>
      ${proyectos}
    </section>

    <section aria-labelledby="evidencia">
      <h2 id="evidencia">Evidencia técnica pública</h2>
      <p>Inventario verificado al ${esc(EVIDENCIA_TECNICA.corte)}. Seis repositorios fijados a revisiones completas suman ${esc(EVIDENCIA_TECNICA.totales.fuente.toLocaleString("es-CO"))} líneas de fuente, ${esc(EVIDENCIA_TECNICA.totales.prueba.toLocaleString("es-CO"))} líneas de prueba y ${esc(EVIDENCIA_TECNICA.totales.commits.toLocaleString("es-CO"))} commits alcanzables.</p>
      <ul class="evidencia">
        <li><strong>${esc(REPOSITORIOS_GITHUB.total)}</strong> repositorios públicos propios inventariados.</li>
        <li><strong>${esc(EVIDENCIA_TECNICA.totales.prueba.toLocaleString("es-CO"))}</strong> líneas de prueba; denominador: ${esc(EVIDENCIA_TECNICA.totales.fuente.toLocaleString("es-CO"))} líneas de fuente.</li>
        <li><strong>${esc(EVIDENCIA_TECNICA.totales.pipelines.toLocaleString("es-CO"))}</strong> workflows medidos en el mismo manifiesto reproducible.</li>
      </ul>
      <p style="margin-top:3mm"><strong>Orquesta IA, corte ${esc(periodoActividad)}:</strong> ${esc(ACTIVIDAD_IA.totales.tokens.toLocaleString("es-CO"))} tokens contabilizados, ${esc(ACTIVIDAD_IA.totales.llamadas.toLocaleString("es-CO"))} llamadas, ${esc(ACTIVIDAD_IA.totales.exitos.toLocaleString("es-CO"))} exitosas y ${esc(ACTIVIDAD_IA.totales.tasaExito.toLocaleString("es-CO"))} % de éxito. Es una ventana auditada, no una estimación acumulada permanente.</p>
    </section>

    <section class="pagina-nueva" aria-labelledby="educacion">
      <h2 id="educacion">Educación</h2>
      ${educacion}
    </section>

    <section class="investigacion" aria-labelledby="investigacion">
      <h2 id="investigacion">Investigación académica</h2>
      <h3>${esc(INVESTIGACION.titulo)} · ${esc(INVESTIGACION.institucion)}</h3>
      <p class="entidad">${esc(INVESTIGACION.fechas)}</p>
      <p>${esc(notaInvestigacionTexto(INVESTIGACION.nota))}</p>
    </section>

    <section aria-labelledby="certificaciones">
      <h2 id="certificaciones">Certificaciones y formación complementaria</h2>
      <ul class="certificaciones">${certificaciones}
      </ul>
    </section>

    <section aria-labelledby="idiomas">
      <h2 id="idiomas">Idiomas</h2>
      <p>${esc(IDIOMAS)}</p>
    </section>

    <p class="cierre">Referencias laborales y soportes documentales disponibles a solicitud. Documento público sin número de identificación, dirección residencial ni datos privados de terceros.</p>
  </main>
</body>
</html>
`;

const htmlFinal = html.replace(/[ \t]+$/gm, "");

await mkdir(carpeta, { recursive: true });
await writeFile(htmlRuta, htmlFinal, "utf8");

execFileSync("google-chrome", [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--allow-file-access-from-files",
  "--no-pdf-header-footer",
  "--export-tagged-pdf",
  "--generate-pdf-document-outline",
  `--print-to-pdf=${pdfRuta}`,
  pathToFileURL(htmlRuta).href,
], { stdio: ["ignore", "pipe", "pipe"] });

const pdf = await readFile(pdfRuta);
if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-")) || pdf.length < 50_000) {
  throw new Error("Chrome no produjo un PDF válido de la hoja de vida");
}

const informacionPdf = execFileSync("pdfinfo", [pdfRuta], { encoding: "utf8" });
const paginas = Number(informacionPdf.match(/^Pages:\s+(\d+)/m)?.[1] || 0);
const etiquetado = /^Tagged:\s+yes$/m.test(informacionPdf);
if (!paginas || !etiquetado) throw new Error("El PDF debe conservar páginas detectables y etiquetado semántico");

const textoPdf = execFileSync("pdftotext", ["-layout", pdfRuta, "-"], { encoding: "utf8" });
for (const termino of [PERSONA.nombre, PERSONA.telefono, PERSONA.email, "PERFIL PROFESIONAL", "EXPERIENCIA PROFESIONAL", "CAUCE V3"]) {
  if (!textoPdf.includes(termino)) throw new Error(`El texto extraído del PDF no contiene: ${termino}`);
}

await writeFile(manifiestoRuta, `${JSON.stringify({
  version: 1,
  fuenteSha256: huellaFuentes.digest("hex"),
  htmlSha256: sha256(Buffer.from(htmlFinal)),
  pdfSha256: sha256(pdf),
  pdfBytes: pdf.length,
  paginas,
  etiquetado,
  textoExtraible: true,
}, null, 2)}\n`, "utf8");

console.log(`Fuente: ${htmlRuta}`);
console.log(`PDF:    ${pdfRuta} (${pdf.length.toLocaleString("es-CO")} bytes)`);
console.log(`Control: ${manifiestoRuta}`);
