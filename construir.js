/* ============================================================================
   Generador. Lee datos.js, escribe publico/. Sin dependencias.
       node construir.js
   ========================================================================= */

import { mkdir, writeFile, readdir, copyFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { pagina, persona, migas, esc, MENU } from "./plantilla.js";
import {
  SITIO, CLAVE_INDEXNOW, GOOGLE_ARCHIVO, PERSONA, EPIGRAFE, PRESENTACION, METRICAS, EXPERIENCIA,
  EDUCACION, INVESTIGACION, LINEAS, CERTIFICACIONES, IDIOMAS, PROYECTOS,
} from "./datos.js";

const raiz = dirname(fileURLToPath(import.meta.url));
const salida = join(raiz, "publico");

/* ---------------------------------------------------------------- piezas */

const franja = (contenido, extra = "") => `    <section class="franja ${extra}">\n${contenido}\n    </section>`;

const rejillaMetricas = () => `      <div class="metricas revelar" data-escalonar>
${METRICAS.map((m) => `        <div class="metrica">
          <span class="cifra" data-hasta="${m.valor}" data-sufijo="${m.sufijo}">${m.valor}</span>
          <span class="etiqueta">${esc(m.etiqueta)}</span>
          <span class="nota">${esc(m.nota)}</span>
        </div>`).join("\n")}
      </div>`;

const fichaProyecto = (p) => `        <a class="ficha revelar" href="/proyectos/${p.slug}/">
          <h3>${esc(p.nombre)}</h3>
          <p>${esc(p.resumen)}</p>
          <div class="etiquetas">${p.lenguajes.map((l) => `<span>${esc(l)}</span>`).join("")}</div>
          <p class="cifras">${esc(p.cifras)}</p>
          <span class="mas">Ver el proyecto <i>→</i></span>
        </a>`;

const hitoEmpleo = (e) => `        <article class="hito revelar">
          <p class="fecha">${esc(e.fechas)}</p>
          <h3>${esc(e.cargo)}</h3>
          <p class="donde">${esc(e.empresa)} · <span class="tenue">${esc(e.lugar)}</span></p>
          <ul>${e.puntos.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        </article>`;

const hitoEstudio = (e) => `        <article class="hito revelar">
          <p class="fecha">${esc(e.fechas)}</p>
          <h3>${esc(e.titulo)}</h3>
          <p class="donde">${e.sitio ? `<a href="${e.sitio}" rel="noopener" target="_blank">${esc(e.institucion)}</a>` : esc(e.institucion)}</p>
          ${e.nota ? `<p class="nota-hito">${esc(e.nota)}</p>` : ""}
        </article>`;

/* Rótulo de sección: eyebrow y título sobre plancha, como cualquier lectura. */
const rotulo = (micro, titulo, tono = "") => `      <div class="rotulo revelar">
        <p class="micro ${tono}">${esc(micro)}</p>
        <h2 class="titulo">${esc(titulo)}</h2>
      </div>`;

/* La línea temporal también es texto: va sobre plancha. */
const lineaTiempo = (html) => `      <div class="scrim medio revelar">
        <div class="linea">
${html}
        </div>
      </div>`;

const epigrafe = () => `    <section class="franja epigrafe revelar">
      <div class="plancha">
        <q>${esc(EPIGRAFE.texto)}</q>
        <span class="fuente">${esc(EPIGRAFE.fuente)}</span>
      </div>
    </section>`;

/* ---------------------------------------------------------------- inicio */

function inicio() {
  const destacados = PROYECTOS.slice(0, 3).map(fichaProyecto).join("\n");

  const cuerpo = `    <section class="portada">
      <div class="portada-caja">
        <p class="micro">Neiva · Huila · Colombia</p>
        <h1 class="nombre" data-componer>Jhon Steven Alvarez Ruiz</h1>
        <p class="titular">${esc(PERSONA.titular)}</p>
        <p class="subtitular">${esc(PERSONA.subtitular)}</p>
        <p class="lugar">Disponible para trabajo remoto</p>
        <div class="acciones">
          <a class="boton primario" href="/proyectos/"><span>Ver proyectos</span></a>
          <a class="boton" href="/academico/"><span>Formación académica</span></a>
          <a class="boton" href="${PERSONA.linkedin}" rel="me noopener" target="_blank"><span>LinkedIn</span></a>
          <a class="boton" href="${PERSONA.github}" rel="me noopener" target="_blank"><span>GitHub</span></a>
        </div>
      </div>
      <figure class="retrato">
        <img src="/activos/retrato.jpg" width="800" height="800" fetchpriority="high"
             alt="Retrato de ${esc(PERSONA.nombre)}, economista y analista de datos en ${esc(PERSONA.ciudad)}, ${esc(PERSONA.pais)}">
        <figcaption>${esc(PERSONA.nombre)} · ${esc(PERSONA.ciudad)}, ${esc(PERSONA.region)}</figcaption>
      </figure>
    </section>

${franja(`      <div class="scrim columna revelar">
        <p class="micro">Quién</p>
${PRESENTACION.map((p) => `        <p class="lead">${p.trim()}</p>`).join("\n")}
      </div>

      <hr class="regla">

${rejillaMetricas()}`)}

${franja(`${rotulo("Líneas de trabajo", "Un solo problema, tres instrumentos")}
      <div class="rejilla duo" data-escalonar>
${LINEAS.map((l) => `        <article class="ficha revelar">
          <h3>${esc(l.titulo)}</h3>
          <p>${l.cuerpo.trim()}</p>
        </article>`).join("\n")}
      </div>`)}

${franja(`${rotulo("Selección", "Proyectos", "verde")}
      <div class="rejilla" data-escalonar>
${destacados}
      </div>
      <p class="sep-m"><a class="mas" href="/proyectos/">Los ${PROYECTOS.length} proyectos <i>→</i></a></p>`)}

${franja(`      <div class="scrim columna revelar">
        <p class="micro">Académico</p>
        <h2 class="titulo">Economía, software e investigación</h2>
        <p class="lead">Pregrado en Economía en la <b>UNAD</b> con énfasis en econometría y estadística
        aplicada, y tecnología en <b>Análisis y Desarrollo de Software en el SENA</b>. Miembro activo
        del <b>semillero de investigación de la Universidad Surcolombiana</b>, en la línea de
        distribución de la tierra en Colombia.</p>
        <p class="sep-s"><a class="mas" href="/academico/">Formación completa <i>→</i></a></p>
      </div>`)}

${epigrafe()}`;

  return pagina({
    ruta: "/",
    puerta: true,
    titulo: "Jhon Steven Alvarez Ruiz — Economista y analista de datos | Neiva, Colombia",
    descripcion:
      "Sitio oficial de Jhon Steven Alvarez Ruiz, economista y analista de datos en Neiva, Huila. " +
      "Formación en Economía (UNAD) y Análisis y Desarrollo de Software (SENA), semillero de " +
      "investigación de la Universidad Surcolombiana, y proyectos de automatización en Python.",
    grafo: [
      persona(),
      {
        "@type": "WebSite",
        "@id": SITIO + "/#sitio",
        url: SITIO + "/",
        name: PERSONA.nombre,
        inLanguage: "es-CO",
        publisher: { "@id": SITIO + "/#persona" },
      },
      {
        "@type": "ProfilePage",
        "@id": SITIO + "/#pagina",
        url: SITIO + "/",
        name: PERSONA.nombre + " — " + PERSONA.titular,
        isPartOf: { "@id": SITIO + "/#sitio" },
        about: { "@id": SITIO + "/#persona" },
        mainEntity: { "@id": SITIO + "/#persona" },
      },
    ],
    cuerpo,
  });
}

/* -------------------------------------------------------------- académico */

function academico() {
  const cuerpo = `${franja(`      <div class="scrim columna revelar">
        <p class="micro">Formación</p>
        <h1 class="titulo grande">Académico</h1>
        <p class="lead">Formación, investigación y credenciales de <b>Jhon Steven Alvarez Ruiz</b>.
        Todo lo que aparece aquí está respaldado por certificado o por matrícula vigente: si no
        está verificado, no está.</p>
      </div>`)}

${franja(`${rotulo("Titulaciones", "Educación")}
${lineaTiempo(EDUCACION.map(hitoEstudio).join("\n"))}`)}

${franja(`      <div class="scrim columna revelar">
        <p class="micro verde">Investigación</p>
        <h2 class="titulo">${esc(INVESTIGACION.titulo)}</h2>
        <p class="donde">
          <a href="${INVESTIGACION.sitio}" rel="noopener" target="_blank">${esc(INVESTIGACION.institucion)}</a>
          · <span class="tenue">${esc(INVESTIGACION.fechas)}</span>
        </p>
        <p class="lead">${INVESTIGACION.nota.trim()}</p>
      </div>`)}

${franja(`${rotulo("Líneas", "Qué investigo y por qué")}
      <div class="rejilla duo" data-escalonar>
${LINEAS.map((l) => `        <article class="ficha revelar">
          <h3>${esc(l.titulo)}</h3>
          <p>${l.cuerpo.trim()}</p>
        </article>`).join("\n")}
      </div>`)}

${franja(`${rotulo("Credenciales", "Certificaciones")}
      <div class="scrim ancho revelar">
        <ul class="lista-limpia">
${CERTIFICACIONES.map((c) => `          <li>
            <span class="qual">${esc(c.nombre)}<br><span class="emisor">${esc(c.emisor)}</span></span>
            <span class="cuando">${esc(c.fecha)}</span>
          </li>`).join("\n")}
        </ul>
      </div>
      <p class="pie-nota revelar sep-s">Idiomas: ${esc(IDIOMAS)}</p>`)}

${epigrafe()}`;

  return pagina({
    ruta: "/academico/",
    titulo: "Formación académica de Jhon Steven Alvarez Ruiz — Economía UNAD, ADSO SENA, semillero USCO",
    descripcion:
      "Formación académica, investigación y certificaciones de Jhon Steven Alvarez Ruiz: pregrado en " +
      "Economía (UNAD), Tecnólogo en Análisis y Desarrollo de Software (SENA), semillero de " +
      "investigación de la Universidad Surcolombiana y nueve certificaciones de IBM, MinTIC y SENA.",
    grafo: [
      persona(),
      migas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Académico", ruta: "/academico/" }]),
      {
        "@type": "ProfilePage",
        "@id": SITIO + "/academico/#pagina",
        url: SITIO + "/academico/",
        name: "Formación académica de " + PERSONA.nombre,
        isPartOf: { "@id": SITIO + "/#sitio" },
        mainEntity: {
          "@id": SITIO + "/#persona",
          hasCredential: CERTIFICACIONES.map((c) => ({
            "@type": "EducationalOccupationalCredential",
            name: c.nombre,
            dateCreated: c.anio,
            recognizedBy: { "@type": "Organization", name: c.emisor },
          })),
        },
      },
    ],
    cuerpo,
  });
}

/* -------------------------------------------------------------- proyectos */

function indiceProyectos() {
  const cuerpo = `${franja(`      <div class="scrim columna revelar">
        <p class="micro verde">Obra</p>
        <h1 class="titulo grande">Proyectos</h1>
        <p class="lead">Ordenados por dificultad técnica medida contra el código, no por antigüedad
        ni por tamaño. Cada cifra sale del repositorio, no de una estimación.</p>
      </div>`)}

${franja(`      <div class="rejilla" data-escalonar>
${PROYECTOS.map(fichaProyecto).join("\n")}
      </div>`)}`;

  return pagina({
    ruta: "/proyectos/",
    titulo: "Proyectos de Jhon Steven Alvarez Ruiz — Python, datos y sistemas multiagente",
    descripcion:
      "Proyectos de software de Jhon Steven Alvarez Ruiz: orquestación multiagente, automatización " +
      "de procesos en Python, auditoría de entregables y desarrollo web sin dependencias. Código " +
      "abierto en GitHub con pruebas y CI.",
    grafo: [
      persona(),
      migas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Proyectos", ruta: "/proyectos/" }]),
      {
        "@type": "CollectionPage",
        "@id": SITIO + "/proyectos/#pagina",
        url: SITIO + "/proyectos/",
        name: "Proyectos de " + PERSONA.nombre,
        isPartOf: { "@id": SITIO + "/#sitio" },
        about: { "@id": SITIO + "/#persona" },
        hasPart: PROYECTOS.map((p) => ({
          "@type": "SoftwareSourceCode",
          name: p.nombre,
          url: SITIO + "/proyectos/" + p.slug + "/",
          codeRepository: p.repo,
          author: { "@id": SITIO + "/#persona" },
        })),
      },
    ],
    cuerpo,
  });
}

function proyecto(p) {
  const cuerpo = `${franja(`      <div class="scrim columna revelar">
        <p class="micro"><a class="heredado" href="/proyectos/">Proyectos</a> · ${esc(p.lenguajes[0])}</p>
        <h1 class="titulo media">${esc(p.nombre)}</h1>
        <p class="lead">${esc(p.resumen)}</p>
        <div class="etiquetas sep-s">${p.lenguajes.map((l) => `<span>${esc(l)}</span>`).join("")}</div>
        <p class="cifras-sueltas">${esc(p.cifras)}</p>
        <div class="acciones">
          <a class="boton primario" href="${p.repo}" rel="noopener" target="_blank"><span>Código en GitHub</span></a>
          ${p.demo ? `<a class="boton" href="${p.demo}" rel="noopener" target="_blank"><span>Probarlo</span></a>` : ""}
        </div>
      </div>`)}

${franja(`      <div class="scrim columna revelar">
        <p class="micro">Por qué existe</p>
        <p class="lead">${p.porQue.trim()}</p>
      </div>`)}

${franja(`${rotulo("Decisiones", "Cómo está construido", "verde")}
      <div class="rejilla" data-escalonar>
${p.detalles.map(([t, d]) => `        <article class="ficha revelar">
          <h3>${esc(t)}</h3>
          <p>${esc(d)}</p>
        </article>`).join("\n")}
      </div>`)}

${franja(`      <div class="scrim columna revelar">
        <p class="micro topo">Autoría</p>
        <p class="lead">${esc(p.nombre)} es un proyecto de <b>Jhon Steven Alvarez Ruiz</b>,
        economista y analista de datos en Neiva, Colombia. El código está publicado en
        <a href="${PERSONA.github}" rel="me noopener" target="_blank">github.com/SirHegel</a>.</p>
        <p class="sep-s"><a class="mas" href="/proyectos/">Los demás proyectos <i>→</i></a></p>
      </div>`)}`;

  return pagina({
    ruta: "/proyectos/" + p.slug + "/",
    titulo: `${p.nombre} — proyecto de Jhon Steven Alvarez Ruiz`,
    descripcion: `${p.resumen} Proyecto de código abierto de Jhon Steven Alvarez Ruiz (${p.lenguajes.join(", ")}).`,
    grafo: [
      persona(),
      migas([
        { nombre: "Inicio", ruta: "/" },
        { nombre: "Proyectos", ruta: "/proyectos/" },
        { nombre: p.nombre, ruta: "/proyectos/" + p.slug + "/" },
      ]),
      {
        "@type": "SoftwareSourceCode",
        "@id": SITIO + "/proyectos/" + p.slug + "/#obra",
        name: p.nombre,
        description: p.resumen,
        url: SITIO + "/proyectos/" + p.slug + "/",
        codeRepository: p.repo,
        programmingLanguage: p.lenguajes,
        author: { "@id": SITIO + "/#persona" },
        creator: { "@id": SITIO + "/#persona" },
        maintainer: { "@id": SITIO + "/#persona" },
        inLanguage: "es",
      },
    ],
    cuerpo,
  });
}

/* ------------------------------------------------------------ trayectoria */

function trayectoria() {
  const cuerpo = `${franja(`      <div class="scrim columna revelar">
        <p class="micro">Hoja de vida</p>
        <h1 class="titulo grande">Trayectoria</h1>
        <p class="lead">Experiencia profesional de <b>Jhon Steven Alvarez Ruiz</b> en auditoría,
        análisis de datos, dirección de operación y desarrollo de software, entre 2024 y hoy.</p>
        <div class="acciones">
          <a class="boton primario" href="${PERSONA.linkedin}" rel="me noopener" target="_blank"><span>Perfil de LinkedIn</span></a>
          <a class="boton" href="mailto:${PERSONA.email}"><span>Escribirme</span></a>
        </div>
      </div>`)}

${franja(`${rotulo("Experiencia", "Dónde he trabajado", "verde")}
${lineaTiempo(EXPERIENCIA.map(hitoEmpleo).join("\n"))}`)}

${franja(`${rotulo("Formación", "Educación")}
${lineaTiempo(EDUCACION.map(hitoEstudio).join("\n"))}
      <p class="sep-m"><a class="mas revelar" href="/academico/">Certificaciones e investigación <i>→</i></a></p>`)}

${epigrafe()}`;

  return pagina({
    ruta: "/trayectoria/",
    titulo: "Trayectoria profesional de Jhon Steven Alvarez Ruiz — analista de datos y auditor",
    descripcion:
      "Experiencia profesional de Jhon Steven Alvarez Ruiz: consultor en Polidinámica, director " +
      "ejecutivo de Designter S.A.S, auditor y analista de datos financieros en Translegal Group " +
      "Colombia y FUNDESPAC. Python, SQL, Power BI y automatización de procesos.",
    grafo: [
      persona(),
      migas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Trayectoria", ruta: "/trayectoria/" }]),
      {
        "@type": "ProfilePage",
        "@id": SITIO + "/trayectoria/#pagina",
        url: SITIO + "/trayectoria/",
        name: "Trayectoria profesional de " + PERSONA.nombre,
        isPartOf: { "@id": SITIO + "/#sitio" },
        mainEntity: {
          "@id": SITIO + "/#persona",
          hasOccupation: EXPERIENCIA.map((e) => ({
            "@type": "Occupation",
            name: e.cargo,
            occupationLocation: { "@type": "Place", name: e.lugar },
            hiringOrganization: { "@type": "Organization", name: e.empresa },
          })),
        },
      },
    ],
    cuerpo,
  });
}

/* ------------------------------------------------------------- escritura */

const RUTAS = [
  ["/", inicio],
  ["/academico/", academico],
  ["/proyectos/", indiceProyectos],
  ["/trayectoria/", trayectoria],
  ...PROYECTOS.map((p) => ["/proyectos/" + p.slug + "/", () => proyecto(p)]),
];

async function copiarArbol(desde, hacia) {
  await mkdir(hacia, { recursive: true });
  for (const e of await readdir(desde, { withFileTypes: true })) {
    const o = join(desde, e.name), d = join(hacia, e.name);
    if (e.isDirectory()) await copiarArbol(o, d);
    else await copyFile(o, d);
  }
}

async function construir() {
  await rm(salida, { recursive: true, force: true });
  await mkdir(salida, { recursive: true });

  for (const [ruta, hacer] of RUTAS) {
    const dir = join(salida, ruta);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "index.html"), hacer(), "utf8");
  }

  await copiarArbol(join(raiz, "activos"), join(salida, "activos"));

  const hoy = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${RUTAS.map(([r]) => `  <url>
    <loc>${SITIO}${r}</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>${r === "/" ? "weekly" : "monthly"}</changefreq>
    <priority>${r === "/" ? "1.0" : r.split("/").length > 3 ? "0.7" : "0.8"}</priority>
  </url>`).join("\n")}
</urlset>
`;
  await writeFile(join(salida, "sitemap.xml"), sitemap, "utf8");

  await writeFile(join(salida, "robots.txt"),
`User-agent: *
Allow: /

Sitemap: ${SITIO}/sitemap.xml
`, "utf8");

  await writeFile(join(salida, CLAVE_INDEXNOW + ".txt"), CLAVE_INDEXNOW, "utf8");
  await writeFile(join(salida, GOOGLE_ARCHIVO),
    "google-site-verification: " + GOOGLE_ARCHIVO + "\n", "utf8");

  // Enlaces de verificación de identidad para IndieAuth y para los rastreadores
  // que leen rel="me" de ida y vuelta.
  await writeFile(join(salida, "humans.txt"),
`/* AUTOR */
  Nombre:  ${PERSONA.nombre}
  Oficio:  ${PERSONA.titular}
  Lugar:   ${PERSONA.ciudad}, ${PERSONA.region}, ${PERSONA.pais}
  GitHub:  ${PERSONA.github}
  LinkedIn:${PERSONA.linkedin}

/* SITIO */
  Estático, sin dependencias externas.
  La música es Bach (BWV 846) sintetizado con Web Audio, no un archivo.
`, "utf8");

  console.log(`Construido: ${RUTAS.length} páginas + sitemap + robots en publico/`);
  for (const [r] of RUTAS) console.log("  " + r);
}

construir().catch((e) => { console.error(e); process.exit(1); });
