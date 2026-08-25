/* ============================================================================
   Plantilla. Una sola cabecera para todo el sitio: el título, la descripción,
   el canónico y el JSON-LD se derivan de los mismos datos, de modo que no
   pueden desincronizarse. Un sitio cuyo marcado contradice su contenido no
   confunde solo a Google.
   ========================================================================= */

import { SITIO, PERSONA, EPIGRAFE, GOOGLE_ETIQUETA } from "./datos.js";

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Dentro de <script> el único carácter peligroso es "<": cerrar la etiqueta.
const json = (o) => JSON.stringify(o, null, 2).replace(/</g, "\\u003c");

export const MENU = [
  { ruta: "/", texto: "Inicio" },
  { ruta: "/hoja-de-vida/", texto: "Hoja de vida" },
  { ruta: "/academico/", texto: "Académico" },
  { ruta: "/proyectos/", texto: "Proyectos" },
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

<script type="application/ld+json">
${json(ld)}
</script>
</head>
<body${claseCuerpo ? ` class="${esc(claseCuerpo)}"` : ""} data-ruta="${esc(ruta)}">

<a class="saltar" href="#principal">Saltar al contenido</a>

<div id="fondo" aria-hidden="true"></div>
<canvas id="lienzo" aria-hidden="true"></canvas>
<div id="grano" aria-hidden="true"></div>
<div id="halo" aria-hidden="true"></div>
<div id="avance" aria-hidden="true"></div>

${puerta ? puertaHTML() : ""}

<div class="envoltura">

  <header class="barra">
    <div class="barra-caja">
      <a class="marca" href="/">Jhon Steven Alvarez Ruiz<span class="h">.</span></a>
      <nav class="menu" aria-label="Principal">
          ${enlaces}
      </nav>
    </div>
  </header>

  <main id="principal">
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

<button id="mando" type="button" aria-pressed="false"
        data-titulo-musica="Beethoven · Sinfonía n.º 5"
        aria-label="Reproducir o silenciar la Quinta Sinfonía de Beethoven">
  <span class="onda" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
  <span class="obra">Música</span>
</button>

<script type="module" src="/activos/animacion.js"></script>
${analitica ? `<script defer src="/_vercel/insights/script.js"></script>
<script type="module" src="/activos/analitica.js"></script>` : ""}
${scripts.map((src) => `<script type="module" src="${esc(src)}"></script>`).join("\n")}
</body>
</html>
`;
}

function puertaHTML() {
  return `<div id="puerta">
  <div class="puerta-caja">
    <p class="micro">Neiva · Huila · Colombia</p>
    <h1 class="nombre" data-componer>Jhon Steven Alvarez Ruiz</h1>
    <p class="pie-nota">${esc(EPIGRAFE.texto)}</p>
    <div class="puerta-acciones">
      <button class="boton primario" type="button" data-entrar-con-musica>
        <span>Entrar con música</span>
      </button>
      <button class="boton" type="button" data-entrar-en-silencio>
        <span>Entrar en silencio</span>
      </button>
    </div>
    <p class="pie-nota sep-s">
      Beethoven, Sinfonía n.º 5 en do menor, op. 67 — Skidmore College Orchestra
    </p>
  </div>
</div>`;
}
