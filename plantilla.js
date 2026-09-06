/* ============================================================================
   Plantilla. Una sola cabecera para todo el sitio: el título, la descripción,
   el canónico y el JSON-LD se derivan de los mismos datos, de modo que no
   pueden desincronizarse. Un sitio cuyo marcado contradice su contenido no
   confunde solo a Google.
   ========================================================================= */

import { SITIO, PERSONA, GOOGLE_ETIQUETA } from "./datos.js";

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Dentro de <script> el único carácter peligroso es "<": cerrar la etiqueta.
const json = (o) => JSON.stringify(o, null, 2).replace(/</g, "\\u003c");

export const MENU = [
  { ruta: "/", texto: "Inicio" },
  { ruta: "/hoja-de-vida/", texto: "Hoja de vida" },
  { ruta: "/academico/", texto: "Académico" },
  { ruta: "/proyectos/", texto: "Proyectos" },
  { ruta: "/contribuciones/", texto: "Contribuciones" },
  { ruta: "/blog/", texto: "Blog" },
  { ruta: "/trayectoria/", texto: "Trayectoria" },
];

/* La entidad Persona. Es el ancla: todas las páginas apuntan a este mismo
   @id, y sameAs le dice a Google que LinkedIn, GitHub y humanizar.tech son
   la misma persona que firma este sitio. */
export function persona() {
  return {
    "@type": "Person",
    "@id": SITIO + "/#persona",
    name: PERSONA.nombre,
    alternateName: PERSONA.alias,
    givenName: "Jhon Steven",
    familyName: "Alvarez Ruiz",
    jobTitle: PERSONA.titular,
    description:
      "Analista de datos y desarrollador de automatización en Neiva, Huila, Colombia. " +
      "Estudiante de Economía (UNAD) y Tecnología en Análisis y Desarrollo de Software (SENA). Trabaja automatización " +
      "en Python, análisis de datos y arquitectura de sistemas multiagente.",
    url: SITIO + "/",
    image: SITIO + "/activos/retrato-profesional.jpg",
    email: "mailto:" + PERSONA.email,
    telephone: PERSONA.telefono,
    sameAs: PERSONA.perfiles(),
    knowsAbout: PERSONA.sabeDe,
    knowsLanguage: [
      { "@type": "Language", name: "Español" },
      { "@type": "Language", name: "Inglés" },
    ],
    nationality: { "@type": "Country", name: "Colombia" },
    address: {
      "@type": "PostalAddress",
      addressLocality: PERSONA.ciudad,
      addressRegion: PERSONA.region,
      addressCountry: "CO",
    },
    alumniOf: [
      { "@type": "EducationalOrganization", name: "I.E. Humberto Tafur Charry" },
    ],
    affiliation: [
      { "@type": "CollegeOrUniversity", name: "Universidad Nacional Abierta y a Distancia (UNAD)", sameAs: "https://www.unad.edu.co/" },
      { "@type": "EducationalOrganization", name: "Servicio Nacional de Aprendizaje (SENA)", sameAs: "https://www.sena.edu.co/" },
      { "@type": "CollegeOrUniversity", name: "Universidad Surcolombiana", sameAs: "https://www.usco.edu.co/" },
    ],
    worksFor: [
      { "@type": "Organization", name: "Designter S.A.S" },
      { "@type": "Organization", name: "Polidinámica" },
    ],
  };
}

export function migas(tramos) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: tramos.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.nombre,
      item: SITIO + t.ruta,
    })),
  };
}

/* --------------------------------------------------------------- la página */

export function pagina({
  ruta,
  titulo,
  descripcion,
  grafo = [],
  cuerpo,
  puerta = false,
  noIndex = false,
  analitica = true,
  scripts = [],
  claseCuerpo = "",
}) {
  const url = SITIO + ruta;
  const ld = { "@context": "https://schema.org", "@graph": grafo };
  const escenaInicial = ruta.startsWith("/blog/") ? "celuloide"
    : /^\/(proyectos|contribuciones|academico)\//.test(ruta) ? "nocturno" : "terciopelo";

  const enlaces = MENU.map(
    (m) => {
      const activo = m.ruta === "/" ? ruta === "/" : ruta.startsWith(m.ruta);
      return `<a href="${m.ruta}"${activo ? ' class="activo" aria-current="page"' : ""}>${esc(m.texto)}</a>`;
    }
  ).join("\n          ");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${url}">

<meta name="author" content="${esc(PERSONA.nombre)}">
<meta name="robots" content="${noIndex ? "noindex, nofollow, noarchive" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"}">
<meta name="google-site-verification" content="${GOOGLE_ETIQUETA}">
<meta name="theme-color" content="#0A0806">
<meta name="color-scheme" content="dark">

<meta property="og:type" content="${ruta === "/" ? "profile" : "article"}">
<meta property="og:site_name" content="${esc(PERSONA.nombre)}">
<meta property="og:locale" content="es_CO">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITIO}/activos/portada.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(PERSONA.nombre)} — ${esc(PERSONA.titular)}">
${ruta === "/" ? `<meta property="profile:first_name" content="Jhon Steven">
<meta property="profile:last_name" content="Alvarez Ruiz">` : ""}

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(descripcion)}">
<meta name="twitter:image" content="${SITIO}/activos/portada.png">

<link rel="icon" href="/activos/icono.svg" type="image/svg+xml">
<link rel="alternate" type="application/rss+xml" title="Escritos de ${esc(PERSONA.nombre)}" href="${SITIO}/feed.xml">
<link rel="stylesheet" href="/activos/estilos.css">
<link rel="stylesheet" href="/activos/cinematografia.css">
<link rel="stylesheet" href="/activos/direccion-arte.css">
<link rel="stylesheet" href="/activos/transiciones.css">
${!ruta.startsWith("/admin/") ? `<link rel="preload" as="image" href="/activos/escenas/${escenaInicial}.webp" media="(min-width: 769px)">
<link rel="preload" as="image" href="/activos/escenas/${escenaInicial}-movil.webp" media="(max-width: 768px)">` : ""}

<script type="application/ld+json">
${json(ld)}
</script>
</head>
<body${claseCuerpo ? ` class="${esc(claseCuerpo)}"` : ""} data-ruta="${esc(ruta)}" data-escena="${escenaInicial}">

<a class="saltar" href="#principal">Saltar al contenido</a>

<div id="fondo" aria-hidden="true">
  <div class="ambiente ambiente-terciopelo"></div>
  <div class="ambiente ambiente-nocturno"></div>
  <div class="ambiente ambiente-celuloide"></div>
  <div class="luz-proyector"></div>
</div>
<canvas id="lienzo" aria-hidden="true"></canvas>
<div id="grano" aria-hidden="true"></div>
<div id="halo" aria-hidden="true"></div>
<div id="avance" aria-hidden="true"></div>

${puerta ? puertaHTML() : ""}

<div class="envoltura">

  <header class="barra">
    <div class="barra-caja">
      <a class="marca" href="/" aria-label="Jhon Steven Alvarez Ruiz · Inicio"><span class="marca-sello" aria-hidden="true">JS<span class="h">/</span></span><span class="marca-nombre">Jhon Steven Alvarez Ruiz</span></a>
      <button class="menu-mando" type="button" aria-expanded="false" aria-controls="menu-principal">Menú <span aria-hidden="true">＋</span></button>
      <nav class="menu" id="menu-principal" aria-label="Principal">
          ${enlaces}
      </nav>
    </div>
  </header>

  <main id="principal" tabindex="-1">
${cuerpo}
  </main>

  <footer class="pie">
    <div class="pie-caja">
      <div>
        <h4>Perfiles</h4>
        <a href="${PERSONA.linkedin}" rel="me noopener" target="_blank">LinkedIn</a>
        <a href="${PERSONA.github}" rel="me noopener" target="_blank">GitHub · SirHegel</a>
        <a href="${PERSONA.humanizar}" rel="noopener" target="_blank">CAUCE V3</a>
      </div>
      <div>
        <h4>Sitio</h4>
        ${MENU.map((m) => `<a href="${m.ruta}">${esc(m.texto)}</a>`).join("\n        ")}
        <a href="/privacidad/">Privacidad</a>
        <a href="/admin/" rel="nofollow" data-navegacion="normal">Administrar</a>
      </div>
      <div>
        <h4>Contacto</h4>
        <a href="mailto:${PERSONA.email}">${PERSONA.email}</a>
        <a href="https://www.google.com/maps/place/Neiva,+Huila" rel="noopener" target="_blank">${PERSONA.ciudad}, ${PERSONA.region}, ${PERSONA.pais}</a>
      </div>
      <div>
        <h4>Nota</h4>
        <p class="pie-nota medida-corta">Beethoven, Quinta Sinfonía. Grabación de la Skidmore College Orchestra liberada al dominio público.</p>
      </div>
    </div>
    <p class="firma">© ${new Date().getFullYear()} ${esc(PERSONA.nombre)} · ${esc(PERSONA.ciudad)}, ${esc(PERSONA.pais)}</p>
  </footer>

</div>

${ruta.startsWith("/admin/") ? "" : `<div class="direccion-escena" aria-label="Ambiente visual">
  <span class="escena-indice" aria-hidden="true">01</span>
  <button id="cambiar-escena" type="button" aria-label="Cambiar ambiente visual: Terciopelo">Terciopelo <span aria-hidden="true">↗</span></button>
  <button id="pausar-escena" type="button" aria-pressed="false" aria-label="Pausar animación de fondo"><span aria-hidden="true">Ⅱ</span></button>
</div>

<button id="mando" type="button" aria-pressed="false"
        data-titulo-musica="Beethoven · Sinfonía n.º 5"
        aria-label="Reproducir o silenciar la Quinta Sinfonía de Beethoven">
  <span class="onda" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
  <span class="obra">Música</span>
</button>`}

<script type="module" src="/activos/animacion.js"></script>
${analitica ? `<script defer src="/_vercel/insights/script.js"></script>
<script type="module" src="/activos/analitica.js"></script>` : ""}
${scripts.map((src) => `<script type="module" src="${esc(src)}"></script>`).join("\n")}
</body>
</html>
`;
}

function puertaHTML() {
  return `<div id="puerta" aria-hidden="true"><span class="inicio-sello">JS /<small>Una mirada propia.</small></span></div>`;
}
