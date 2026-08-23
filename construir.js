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
  EDUCACION, INVESTIGACION, LINEAS, CERTIFICACIONES, IDIOMAS, PROYECTOS, ACTUALIDAD,
  ACTIVIDAD_IA, REPOSITORIOS_GITHUB,
} from "./datos.js";
import { cargarEscritos, categoriasDe, slugificar } from "./escritos.js";

const raiz = dirname(fileURLToPath(import.meta.url));
const salida = join(raiz, "publico");
const ESCRITOS = await cargarEscritos(join(raiz, "escritos"));
const CATEGORIAS = categoriasDe(ESCRITOS, ["Derecho", "Economía", "Pensamientos", "Análisis"]);

const fechaHumana = (valor, opciones = { dateStyle: "medium" }) =>
  new Intl.DateTimeFormat("es-CO", { ...opciones, timeZone: "America/Bogota" }).format(new Date(valor));

const numeroHumano = (valor) => Number(valor || 0).toLocaleString("es-CO");

const nombreRepo = (url) => {
  try { return new URL(url).pathname.split("/").filter(Boolean).at(-1).toLowerCase(); }
  catch { return ""; }
};

function nombreLegible(nombre) {
  if (!/[-_]/.test(nombre) && /[A-Z]/.test(nombre.slice(1))) return nombre;
  const siglas = new Map([
    ["api", "API"], ["adso", "ADSO"], ["ai", "AI"], ["crud", "CRUD"],
    ["ia", "IA"], ["php", "PHP"], ["cli", "CLI"], ["x", "X"],
  ]);
  return nombre.split(/[-_]+/).filter(Boolean).map((parte, i) =>
    siglas.get(parte.toLowerCase()) || (i === 0
      ? parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase()
      : parte.toLowerCase())
  ).join(" ");
}

function proyectoDesdeGitHub(repo) {
  const lenguajes = repo.lenguajes.slice(0, 5).map((l) => l.nombre);
  const temas = repo.temas.slice(0, 8);
  const actualizado = fechaHumana(repo.publicadoEn || repo.actualizadoEn);
  const licencia = repo.licencia?.spdx && repo.licencia.spdx !== "NOASSERTION"
    ? repo.licencia.spdx
    : "sin licencia declarada";
  const explicacion = repo.extractoReadme || repo.descripcion ||
    `Repositorio público de ${PERSONA.nombre}. La explicación se completará cuando el proyecto publique su README.`;
  const demo = repo.homepage && !repo.homepage.startsWith(SITIO) ? repo.homepage : "";

  return {
    slug: slugificar(repo.slug || repo.nombre),
    nombre: nombreLegible(repo.nombre),
    resumen: repo.descripcion || `Repositorio público ${repo.nombre}, sincronizado automáticamente desde GitHub.`,
    repo: repo.url,
    demo,
    estado: "Sincronizado desde GitHub",
    lenguajes: lenguajes.length ? lenguajes : ["Repositorio"],
    cifras: `${lenguajes.length || 0} lenguajes · ${licencia} · actualizado ${actualizado}`,
    porQue: explicacion,
    automatico: true,
    github: repo,
    detalles: [
      ["Qué resuelve", repo.descripcion || "El repositorio todavía no declara una descripción pública."],
      ["Superficie técnica", [
        lenguajes.length ? `Lenguajes: ${lenguajes.join(", ")}.` : "GitHub aún no detecta un lenguaje principal.",
        temas.length ? `Temas: ${temas.join(", ")}.` : "Sin temas declarados.",
      ].join(" ")],
      ["Estado verificable", `Rama ${repo.ramaPredeterminada}; ${licencia}; última publicación ${actualizado}. ${repo.estrellas} estrellas y ${repo.forks} forks al corte del catálogo.`],
    ],
  };
}

const githubPorNombre = new Map(REPOSITORIOS_GITHUB.repositorios.map((r) => [r.nombre.toLowerCase(), r]));
const proyectosCurados = PROYECTOS.map((proyecto) => {
  const vivo = proyecto.repo ? githubPorNombre.get(nombreRepo(proyecto.repo)) : null;
  return { ...proyecto, github: vivo || null };
});
const nombresCurados = new Set(proyectosCurados.map((p) => nombreRepo(p.repo)).filter(Boolean));
const proyectosAutomaticos = REPOSITORIOS_GITHUB.repositorios
  .filter((repo) => !nombresCurados.has(repo.nombre.toLowerCase()))
  .map(proyectoDesdeGitHub)
  .sort((a, b) => (b.github.publicadoEn || "").localeCompare(a.github.publicadoEn || ""));
const PROYECTOS_TODOS = [...proyectosCurados, ...proyectosAutomaticos];
const slugsProyecto = new Set();
for (const item of PROYECTOS_TODOS) {
  if (!item.slug || slugsProyecto.has(item.slug)) {
    throw new Error(`Slug de proyecto vacío o repetido: ${item.slug || "(vacío)"}`);
  }
  slugsProyecto.add(item.slug);
}

/* ---------------------------------------------------------------- piezas */

const franja = (contenido, extra = "") => `    <section class="franja ${extra}">\n${contenido}\n    </section>`;

const rejillaMetricas = () => `      <div class="metricas revelar" data-escalonar>
${METRICAS.map((m) => `        <${m.enlace ? `a href="${m.enlace}"` : "div"} class="metrica">
          <span class="cifra" data-hasta="${m.valor}" data-sufijo="${m.sufijo}">${m.valor}</span>
          <span class="etiqueta">${esc(m.etiqueta)}</span>
          <span class="nota">${esc(m.nota)}</span>
        </${m.enlace ? "a" : "div"}>`).join("\n")}
      </div>`;

const fichaProyecto = (p) => `        <a class="ficha revelar" href="/proyectos/${p.slug}/">
          ${p.estado ? `<span class="estado-proyecto">${esc(p.estado)}</span>` : ""}
          <h3>${esc(p.nombre)}</h3>
          <p>${esc(p.resumen)}</p>
          <div class="etiquetas">${p.lenguajes.map((l) => `<span>${esc(l)}</span>`).join("")}</div>
          <p class="cifras">${esc(p.cifras)}</p>
          <span class="mas">Ver el proyecto <i>→</i></span>
        </a>`;

const fichaEscrito = (e) => `        <article class="escrito-card revelar" data-tema="${esc(e.categoriaSlug)}">
          <div class="escrito-meta">
            <a class="filtro-blog" href="/blog/tema/${e.categoriaSlug}/">${esc(e.categoria)}</a>
            <time datetime="${e.fecha}">${esc(e.fechaLegible)}</time>
            <span>${e.minutos} min</span>
          </div>
          <h3><a href="/blog/${e.slug}/">${esc(e.titulo)}</a></h3>
          <p>${esc(e.resumen)}</p>
          <a class="mas" href="/blog/${e.slug}/">Leer el escrito <i>→</i></a>
        </article>`;

const filtrosBlog = (activo = "") => `      <nav class="filtros-blog revelar" aria-label="Temas del blog">
        <a class="filtro-blog${!activo ? " activo" : ""}" href="/blog/"${!activo ? ' aria-current="page"' : ""}>Todos</a>
${CATEGORIAS.map((c) => `        <a class="filtro-blog${c.slug === activo ? " activo" : ""}" href="/blog/tema/${c.slug}/"${c.slug === activo ? ' aria-current="page"' : ""}>${esc(c.nombre)}</a>`).join("\n")}
      </nav>`;

const parrafosEscapados = (texto) => String(texto || "")
  .split(/\n\s*\n/)
  .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
  .filter(Boolean)
  .map((p) => `<p class="lead">${esc(p)}</p>`)
  .join("\n        ");

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
  const destacados = proyectosCurados.slice(0, 3).map(fichaProyecto).join("\n");
  const escritosRecientes = ESCRITOS.slice(0, 3).map(fichaEscrito).join("\n");

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

${franja(`      <div class="scrim columna revelar actualidad">
        <div class="estado-linea">
          <p class="micro verde">Ahora · ${esc(ACTUALIDAD.empresa)}</p>
          <span class="estado-proyecto">${esc(ACTUALIDAD.estado)}</span>
        </div>
        <h2 class="titulo">${esc(ACTUALIDAD.titulo)}</h2>
        <p class="lead">${esc(ACTUALIDAD.cuerpo.trim())}</p>
      </div>`)}

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
      <p class="sep-m"><a class="mas" href="/proyectos/">Los ${PROYECTOS_TODOS.length} proyectos y repositorios <i>→</i></a></p>`)}

${franja(`${rotulo("Escritura", "Últimos textos", "verde")}
      <div class="lista-escritos" data-escalonar>
${escritosRecientes}
      </div>
      <p class="sep-m"><a class="mas" href="/blog/">Abrir el archivo completo <i>→</i></a></p>`)}

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
        <p class="lead">${PROYECTOS_TODOS.length} módulos: trabajo seleccionado y los
        ${REPOSITORIOS_GITHUB.total} repositorios públicos propios de GitHub. El catálogo se
        reconstruye automáticamente; los proyectos destacados conservan además una explicación
        editorial de las decisiones que les dieron forma.</p>
      </div>`)}

${franja(`${rotulo("Selección", "Proyectos con contexto")}
      <div class="rejilla" data-escalonar>
${proyectosCurados.map(fichaProyecto).join("\n")}
      </div>`)}

${franja(`      <div id="github" class="ancla-seccion"></div>
${rotulo("GitHub", "Repositorio público completo", "verde")}
      <div class="scrim columna revelar resumen-sincronizacion">
        <p class="lead">${REPOSITORIOS_GITHUB.total} repositorios propios, sin forks ni proyectos
        privados. Última sincronización con actividad real de GitHub:
        <time datetime="${REPOSITORIOS_GITHUB.actualizadoEn}">${fechaHumana(REPOSITORIOS_GITHUB.actualizadoEn)}</time>.</p>
      </div>
      <div class="rejilla sep-m" data-escalonar>
${proyectosAutomaticos.map(fichaProyecto).join("\n") || "        <p class=\"pie-nota\">Todos los repositorios ya cuentan con contexto editorial.</p>"}
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
        hasPart: PROYECTOS_TODOS.map((p) => ({
          "@type": "SoftwareSourceCode",
          name: p.nombre,
          url: SITIO + "/proyectos/" + p.slug + "/",
          ...(p.repo ? { codeRepository: p.repo } : {}),
          author: { "@id": SITIO + "/#persona" },
        })),
      },
    ],
    cuerpo,
  });
}

function proyecto(p) {
  const razon = p.automatico
    ? parrafosEscapados(p.porQue)
    : `<p class="lead">${p.porQue.trim()}</p>`;
  const cuerpo = `${franja(`      <div class="scrim columna revelar proyecto-cabecera">
        <p class="micro"><a class="heredado" href="/proyectos/">Proyectos</a> · ${esc(p.lenguajes[0])}</p>
        ${p.estado ? `<span class="estado-proyecto">${esc(p.estado)}</span>` : ""}
        <h1 class="titulo media">${esc(p.nombre)}</h1>
        <p class="lead">${esc(p.resumen)}</p>
        <div class="etiquetas sep-s">${p.lenguajes.map((l) => `<span>${esc(l)}</span>`).join("")}</div>
        <p class="cifras-sueltas">${esc(p.cifras)}</p>
        <div class="acciones">
          ${p.repo ? `<a class="boton primario" href="${p.repo}" rel="noopener" target="_blank"><span>Código en GitHub</span></a>` : `<span class="boton desactivado"><span>${esc(p.visibilidad || "Proyecto no público")}</span></span>`}
          ${p.demo ? `<a class="boton" href="${p.demo}" rel="noopener" target="_blank"><span>Probarlo</span></a>` : ""}
        </div>
      </div>`)}

${franja(`      <div class="scrim columna revelar proyecto-razon prosa-ancha">
        <p class="micro">Por qué existe</p>
        ${razon}
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
        economista y analista de datos en Neiva, Colombia. ${p.repo
          ? `El repositorio forma parte del catálogo público de <a href="${PERSONA.github}" rel="me noopener" target="_blank">github.com/SirHegel</a>.`
          : "La ficha describe únicamente su arquitectura y propósito públicos; el código y los datos comerciales permanecen privados."}</p>
        <p class="sep-s"><a class="mas" href="/proyectos/">Los demás proyectos <i>→</i></a></p>
      </div>`)}`;

  return pagina({
    ruta: "/proyectos/" + p.slug + "/",
    titulo: `${p.nombre} — proyecto de Jhon Steven Alvarez Ruiz`,
    descripcion: `${p.resumen} Proyecto de Jhon Steven Alvarez Ruiz (${p.lenguajes.join(", ")}).`,
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
        ...(p.repo ? { codeRepository: p.repo } : {}),
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

/* ------------------------------------------------------------------ blog */

function indiceBlog(categoria = null) {
  const escritos = categoria
    ? ESCRITOS.filter((e) => e.categoriaSlug === categoria.slug)
    : ESCRITOS;
  const ruta = categoria ? `/blog/tema/${categoria.slug}/` : "/blog/";
  const tituloVisible = categoria ? categoria.nombre : "Escritos";
  const lista = escritos.length
    ? escritos.map(fichaEscrito).join("\n")
    : `        <div class="scrim columna revelar vacio-blog">
          <p class="lead">Todavía no hay escritos publicados en ${esc(categoria?.nombre || "este tema")}.</p>
          <p class="pie-nota">El tema ya está preparado: el próximo texto aparecerá aquí al publicarse desde el panel privado.</p>
        </div>`;

  const cuerpo = `${franja(`      <div class="scrim columna revelar">
        <p class="micro verde">Archivo</p>
        <h1 class="titulo grande">${esc(tituloVisible)}</h1>
        <p class="lead">Derecho, economía, pensamientos y análisis en textos que se abren como
        páginas independientes. Cada nuevo Markdown publicado desde el panel crea su título, tema,
        ruta, metadatos y entrada en el feed sin editar el generador.</p>
      </div>`)}

${franja(`${filtrosBlog(categoria?.slug || "")}
      <div class="lista-escritos sep-m" data-escalonar>
${lista}
      </div>`)}`;

  return pagina({
    ruta,
    titulo: categoria
      ? `${categoria.nombre} — escritos de Jhon Steven Alvarez Ruiz`
      : "Escritos de Jhon Steven Alvarez Ruiz — derecho, economía, pensamientos y análisis",
    descripcion: categoria
      ? `Textos de ${PERSONA.nombre} sobre ${categoria.nombre.toLowerCase()}.`
      : `Blog de ${PERSONA.nombre}: escritos de derecho, economía, pensamientos, análisis y sistemas.`,
    grafo: [
      persona(),
      migas(categoria
        ? [{ nombre: "Inicio", ruta: "/" }, { nombre: "Blog", ruta: "/blog/" }, { nombre: categoria.nombre, ruta }]
        : [{ nombre: "Inicio", ruta: "/" }, { nombre: "Blog", ruta: "/blog/" }]),
      {
        "@type": "CollectionPage",
        "@id": SITIO + ruta + "#pagina",
        url: SITIO + ruta,
        name: tituloVisible,
        inLanguage: "es-CO",
        author: { "@id": SITIO + "/#persona" },
        hasPart: escritos.map((e) => ({ "@id": `${SITIO}/blog/${e.slug}/#articulo` })),
      },
    ],
    cuerpo,
  });
}

function escrito(e) {
  const relacionados = ESCRITOS
    .filter((otro) => otro.slug !== e.slug && otro.categoriaSlug === e.categoriaSlug)
    .slice(0, 2);
  const cuerpo = `${franja(`      <header class="scrim columna revelar articulo-cabecera">
        <p class="micro"><a class="heredado" href="/blog/">Escritos</a> ·
          <a href="/blog/tema/${e.categoriaSlug}/">${esc(e.categoria)}</a></p>
        <h1 class="titulo media">${esc(e.titulo)}</h1>
        <p class="lead">${esc(e.resumen)}</p>
        <div class="escrito-meta sep-s">
          <time datetime="${e.fecha}">${esc(e.fechaLegible)}</time>
          <span>${e.minutos} min de lectura</span>
          <span>${numeroHumano(e.palabras)} palabras</span>
        </div>
      </header>`)}

${franja(`      <article class="scrim prosa prosa-ancha revelar">
${e.html}
        ${e.etiquetas.length ? `<footer class="etiquetas sep-m">${e.etiquetas.map((tag) => `<span>${esc(tag)}</span>`).join("")}</footer>` : ""}
      </article>`)}

${relacionados.length ? franja(`${rotulo("Continuar", `Más en ${e.categoria}`, "verde")}
      <div class="lista-escritos" data-escalonar>
${relacionados.map(fichaEscrito).join("\n")}
      </div>`) : ""}`;

  return pagina({
    ruta: `/blog/${e.slug}/`,
    titulo: `${e.titulo} — ${PERSONA.nombre}`,
    descripcion: e.resumen,
    grafo: [
      persona(),
      migas([
        { nombre: "Inicio", ruta: "/" },
        { nombre: "Blog", ruta: "/blog/" },
        { nombre: e.titulo, ruta: `/blog/${e.slug}/` },
      ]),
      {
        "@type": "Article",
        "@id": `${SITIO}/blog/${e.slug}/#articulo`,
        headline: e.titulo,
        description: e.resumen,
        datePublished: e.fecha,
        dateModified: e.fecha,
        articleSection: e.categoria,
        keywords: e.etiquetas,
        wordCount: e.palabras,
        inLanguage: "es-CO",
        url: `${SITIO}/blog/${e.slug}/`,
        author: { "@id": SITIO + "/#persona" },
        publisher: { "@id": SITIO + "/#persona" },
        isPartOf: { "@id": SITIO + "/#sitio" },
      },
    ],
    cuerpo,
  });
}

/* ---------------------------------------------------------- actividad IA */

const filaActividad = (item, maximo) => `          <li>
            <span class="dato-nombre">${esc(nombreLegible(item.nombre))}</span>
            <progress max="${maximo || 1}" value="${item.tokens}" aria-label="${esc(item.nombre)}: ${numeroHumano(item.tokens)} tokens"></progress>
            <span class="dato-valor">${numeroHumano(item.tokens)}</span>
            <span class="dato-nota">${numeroHumano(item.llamadas)} llamadas · ${numeroHumano(item.fallos)} fallos</span>
          </li>`;

function actividad() {
  const t = ACTIVIDAD_IA.totales;
  const maxProveedor = Math.max(...ACTIVIDAD_IA.porProveedor.map((x) => x.tokens), 1);
  const maxTarea = Math.max(...ACTIVIDAD_IA.porTarea.map((x) => x.tokens), 1);
  const cuerpo = `${franja(`      <div class="scrim columna revelar">
        <p class="micro verde">Orquesta IA · telemetría pública</p>
        <h1 class="titulo grande">Actividad</h1>
        <p class="lead">Contexto verificable del consumo que Orquesta IA registra: volumen,
        llamadas, resultados, proveedores y tipo de tarea. El agregado se reconstruye desde el
        ledger privado; jamás publica prompts, cuentas, sesiones, rutas ni identificadores.</p>
      </div>`)}

${franja(`      <div class="metricas metricas-actividad revelar" data-escalonar>
        <div class="metrica"><span class="cifra">${numeroHumano(t.tokens)}</span><span class="etiqueta">tokens contabilizados</span><span class="nota">histórico del ledger</span></div>
        <div class="metrica"><span class="cifra">${numeroHumano(t.llamadas)}</span><span class="etiqueta">llamadas registradas</span><span class="nota">${numeroHumano(t.exitos)} exitosas · ${numeroHumano(t.fallos)} fallidas</span></div>
        <div class="metrica"><span class="cifra">${String(t.tasaExito).replace(".", ",")}%</span><span class="etiqueta">tasa de éxito</span><span class="nota">según código de salida</span></div>
        <div class="metrica"><span class="cifra">${numeroHumano(t.promedioTokens)}</span><span class="etiqueta">tokens por llamada</span><span class="nota">promedio histórico</span></div>
      </div>`)}

${franja(`${rotulo("Distribución", "Por proveedor")}
      <div class="scrim ancho revelar">
        <ul class="barras-datos">
${ACTIVIDAD_IA.porProveedor.map((x) => filaActividad(x, maxProveedor)).join("\n")}
        </ul>
      </div>`)}

${franja(`${rotulo("Trabajo", "Por tipo de tarea", "verde")}
      <div class="scrim ancho revelar">
        <ul class="barras-datos">
${ACTIVIDAD_IA.porTarea.map((x) => filaActividad(x, maxTarea)).join("\n")}
        </ul>
      </div>`)}

${franja(`${rotulo("Serie", "Actividad diaria")}
      <div class="scrim ancho revelar tabla-contenedor">
        <table class="tabla-datos">
          <thead><tr><th>Fecha</th><th>Tokens</th><th>Llamadas</th><th>Fallos</th></tr></thead>
          <tbody>
${ACTIVIDAD_IA.porDia.map((d) => `            <tr><th scope="row"><time datetime="${d.fecha}">${fechaHumana(d.fecha + "T12:00:00Z")}</time></th><td>${numeroHumano(d.tokens)}</td><td>${numeroHumano(d.llamadas)}</td><td>${numeroHumano(d.fallos)}</td></tr>`).join("\n")}
          </tbody>
        </table>
      </div>
      <p class="pie-nota revelar sep-s">Corte: <time datetime="${ACTIVIDAD_IA.actualizadoEn}">${fechaHumana(ACTIVIDAD_IA.actualizadoEn, { dateStyle: "long", timeStyle: "short" })}</time>. ${esc(ACTIVIDAD_IA.privacidad)}</p>`)}`;

  return pagina({
    ruta: "/actividad/",
    titulo: `Actividad de Orquesta IA — ${PERSONA.nombre}`,
    descripcion: `${numeroHumano(t.tokens)} tokens en ${numeroHumano(t.llamadas)} llamadas: agregado público y anonimizado de Orquesta IA.`,
    grafo: [
      persona(),
      migas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Actividad", ruta: "/actividad/" }]),
      {
        "@type": "Dataset",
        "@id": SITIO + "/actividad/#datos",
        name: "Actividad agregada de Orquesta IA",
        description: ACTIVIDAD_IA.privacidad,
        url: SITIO + "/actividad/",
        temporalCoverage: `${ACTIVIDAD_IA.periodo.desde}/${ACTIVIDAD_IA.periodo.hasta}`,
        creator: { "@id": SITIO + "/#persona" },
        measurementTechnique: "Agregación determinista de un ledger JSONL privado",
        variableMeasured: ["tokens", "llamadas", "fallos", "segundos"],
      },
    ],
    cuerpo,
  });
}

/* ------------------------------------------------------------- privacidad */

function privacidad() {
  const cuerpo = `${franja(`      <div class="scrim columna revelar">
        <p class="micro verde">Datos y límites</p>
        <h1 class="titulo grande">Privacidad</h1>
        <p class="lead">Este sitio mide lo necesario para entender su alcance sin construir
        perfiles personales. No usa publicidad, no vende datos y no intenta identificar a quien
        lee. La ubicación es aproximada y nunca equivale a una dirección física exacta.</p>
      </div>`)}

${franja(`${rotulo("Agregado", "Páginas y audiencia")}
      <div class="scrim columna prosa-ancha revelar">
        <p>Vercel Web Analytics contabiliza de forma agregada páginas, visitantes diarios, rutas,
        referentes, país, ciudad y clase de dispositivo. No instala cookies de seguimiento ni
        entrega al panel una IP o un identificador individual reutilizable.</p>
        <p>La navegación privada <code>/admin/</code> queda excluida de la instrumentación propia
        del sitio.</p>
      </div>`)}

${franja(`${rotulo("Ingreso", "Ciudad y estimación de red", "verde")}
      <div class="scrim columna prosa-ancha revelar">
        <p>En el primer ingreso de cada sesión, el servidor conserva de forma privada: hora,
        primera ruta, dominio referente, país, región, ciudad, tipo de dispositivo, sistema,
        navegador y una clasificación estimada de VPN, proxy, Tor o centro de datos.</p>
        <p>Para obtener esa clasificación, la IP que ya acompaña la conexión se consulta
        transitoriamente en <a href="https://ipapi.is/" rel="noopener" target="_blank">ipapi.is</a>.
        El código del sitio no la escribe en el repositorio, no la convierte en hash, no la muestra
        y no conserva coordenadas ni el User-Agent completo. El proveedor y la infraestructura de
        red pueden procesarla bajo sus propias condiciones; por eso no se afirma que desaparezca
        de todo sistema externo.</p>
      </div>`)}

${franja(`${rotulo("Alcance", "Lo que la auditoría no puede prometer")}
      <div class="scrim columna prosa-ancha revelar">
        <p>Una ciudad derivada de red es aproximada. Una VPN residencial, un proxy nuevo o una red
        móvil pueden eludir la clasificación; una salida corporativa puede parecer una VPN. El
        sistema nunca pretende descubrir la ubicación real escondida detrás de una VPN.</p>
        <p>La muestra privada se protege con límite de solicitudes en el firewall. La rama activa y
        el panel muestran una ventana máxima de 90 días; Git puede conservar versiones anteriores
        en su historial de commits. Las cifras agregadas de Vercel son la fuente principal para
        páginas, países y dispositivos.</p>
      </div>`)}

${franja(`      <div class="scrim columna revelar">
        <p class="micro">Contacto</p>
        <p class="lead">Para consultar o solicitar la eliminación de información relacionada con
        esta auditoría, escribe a <a href="mailto:${PERSONA.email}">${PERSONA.email}</a>.</p>
      </div>`)}`;

  return pagina({
    ruta: "/privacidad/",
    titulo: `Privacidad y analítica — ${PERSONA.nombre}`,
    descripcion: "Cómo se agregan páginas, ciudad, dispositivo y estimaciones de red sin almacenar IP ni perfiles identificables en el sitio.",
    grafo: [
      persona(),
      migas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Privacidad", ruta: "/privacidad/" }]),
      {
        "@type": "WebPage",
        "@id": SITIO + "/privacidad/#pagina",
        url: SITIO + "/privacidad/",
        name: "Privacidad y analítica",
        inLanguage: "es-CO",
        isPartOf: { "@id": SITIO + "/#sitio" },
        about: { "@id": SITIO + "/#persona" },
      },
    ],
    cuerpo,
  });
}

/* --------------------------------------------------------------- admin */

function admin() {
  const cuerpo = `${franja(`      <div class="admin-marco">
        <div class="scrim columna articulo-cabecera">
          <p class="micro verde">Área privada</p>
          <h1 class="titulo media">Publicar y auditar</h1>
          <p class="lead">Escribe, actualiza el blog y consulta ingresos auditados por ciudad,
          país y dispositivo junto con la analítica agregada de Vercel. La IP cruda nunca se
          guarda ni se muestra en este sistema.</p>
        </div>
        <div id="admin-app" class="scrim ancho sep-m" aria-live="polite" aria-busy="true">
          <p class="lead">Cargando el panel seguro…</p>
        </div>
        <noscript><p class="scrim columna sep-m">El panel necesita JavaScript para iniciar sesión.</p></noscript>
      </div>`)}`;

  return pagina({
    ruta: "/admin/",
    titulo: `Administración — ${PERSONA.nombre}`,
    descripcion: "Panel privado de publicación y auditoría del sitio.",
    grafo: [],
    cuerpo,
    noIndex: true,
    analitica: false,
    claseCuerpo: "pagina-admin",
    scripts: ["/activos/admin.js"],
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
  ["/blog/", () => indiceBlog()],
  ["/actividad/", actividad],
  ["/trayectoria/", trayectoria],
  ["/privacidad/", privacidad],
  ["/admin/", admin, { sitemap: false }],
  ...PROYECTOS_TODOS.map((p) => ["/proyectos/" + p.slug + "/", () => proyecto(p)]),
  ...CATEGORIAS.map((c) => ["/blog/tema/" + c.slug + "/", () => indiceBlog(c)]),
  ...ESCRITOS.map((e) => ["/blog/" + e.slug + "/", () => escrito(e)]),
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
${RUTAS.filter(([, , opciones]) => opciones?.sitemap !== false).map(([r]) => `  <url>
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

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Escritos de ${esc(PERSONA.nombre)}</title>
    <link>${SITIO}/blog/</link>
    <description>Derecho, economía, pensamientos y análisis.</description>
    <language>es-CO</language>
    <atom:link href="${SITIO}/feed.xml" rel="self" type="application/rss+xml" />
${ESCRITOS.map((e) => `    <item>
      <title>${esc(e.titulo)}</title>
      <link>${SITIO}/blog/${e.slug}/</link>
      <guid isPermaLink="true">${SITIO}/blog/${e.slug}/</guid>
      <pubDate>${new Date(e.fecha + "T12:00:00Z").toUTCString()}</pubDate>
      <category>${esc(e.categoria)}</category>
      <description>${esc(e.resumen)}</description>
    </item>`).join("\n")}
  </channel>
</rss>
`;
  await writeFile(join(salida, "feed.xml"), rss, "utf8");

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
  Música: Quinta Sinfonía de Beethoven, Skidmore College Orchestra (dominio público).
`, "utf8");

  console.log(`Construido: ${RUTAS.length} páginas + sitemap + robots en publico/`);
  for (const [r] of RUTAS) console.log("  " + r);
}

construir().catch((e) => { console.error(e); process.exit(1); });
