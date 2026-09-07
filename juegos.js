import { PERSONA, SITIO } from "./datos.js";
import { esc, migas, pagina, persona } from "./plantilla.js";
import { DESCARGA_NEIVA_UNREAL, descargaUnrealValidada } from "./descarga-neiva.js";

const descargaLista = descargaUnrealValidada();

export const JUEGOS = [
  {
    slug: "neiva-abierta",
    nombre: "Neiva Abierta",
    tipo: "Unreal · Preparación nativa",
    titulo: "La ciudad, a tu paso.",
    descripcion: "El desarrollo de Neiva pasa a Unreal Engine: una ciudad para recorrer con un personaje sin nombre y un pequeño estudio ficticio de Jhon. Las fachadas y alturas siguen siendo interpretadas.",
    detalle: descargaLista ? "El ejecutable verificado está disponible. La ficha indica plataforma, tamaño y SHA-256." : "Descarga Unreal pendiente de compilación. Todavía no hay un ejecutable publicado. La imagen corresponde al prototipo web anterior, hecho con Three.js.",
    url: descargaLista ? DESCARGA_NEIVA_UNREAL.url : "/proyectos/neiva-abierta/#descarga-unreal",
    repo: "https://github.com/SirHegel/neiva-abierta",
    accion: descargaLista ? `Descargar para ${DESCARGA_NEIVA_UNREAL.platform}` : "Ver desarrollo Unreal",
    controles: descargaLista ? DESCARGA_NEIVA_UNREAL.platform : "Versión nativa en preparación",
  },
  {
    slug: "bloquitos",
    nombre: "Bloquitos",
    tipo: "Rompecabezas · Bloques",
    titulo: "Una fila más.",
    descripcion: "Acomoda las piezas que caen, completa filas y supera tu propio récord. Los bloques parecen caramelos. La siguiente pieza siempre tiene otros planes.",
    detalle: "Guarda tus partidas en el dispositivo. Puedes instalarlo y jugar sin conexión después de la primera carga.",
    url: "https://bloquitos.vercel.app/",
    repo: "https://github.com/SirHegel/bloquitos",
    accion: "Jugar Bloquitos",
    controles: "Teclado · Botones y gestos táctiles",
  },
];

// Captura del juego Neiva y arte CSS decorativo de Bloquitos; sin animación propia.
function vistaJuego(slug) {
  if (slug === "neiva-abierta") return `<figure class="juego-ilustracion juego-captura">
    <img src="/activos/neiva-abierta.webp" width="1440" height="960" alt="Captura del prototipo web anterior de Neiva Abierta: Three.js 0.4 en calidad Alta, personaje frente a la Catedral recreada, árboles y fuente" loading="lazy" decoding="async">
    <figcaption class="juego-arte-nota">Prototipo web anterior / Three.js 0.4</figcaption>
  </figure>`;
  return `<div class="juego-ilustracion juego-ilustracion-bloquitos" aria-hidden="true">
    <div class="juego-tablero"><span class="pieza pieza-t"><i></i><i></i><i></i><i></i></span><span class="pieza pieza-l"><i></i><i></i><i></i><i></i></span><span class="pieza pieza-o"><i></i><i></i><i></i><i></i></span><span class="pieza pieza-i"><i></i><i></i><i></i><i></i></span><span class="pieza pieza-s"><i></i><i></i><i></i><i></i></span></div>
    <span class="juego-arte-nota">Ilustración / Una partida pendiente</span>
  </div>`;
}

export function tarjetasJuegos() {
  return `<div class="juegos-rejilla" data-escalonar>
${JUEGOS.map((juego) => `        <article class="juego-tarjeta revelar" id="${juego.slug}" aria-labelledby="${juego.slug}-titulo">
          ${vistaJuego(juego.slug)}
          <div class="juego-ficha">
            <p class="micro juego-tipo">${esc(juego.tipo)}</p>
            <h2 id="${juego.slug}-titulo">${esc(juego.nombre)}</h2>
            <p class="juego-lema">${esc(juego.titulo)}</p>
            <p>${esc(juego.descripcion)}</p>
            <p class="juego-detalle">${esc(juego.detalle)}</p>
            <p class="juego-controles">${esc(juego.controles)}</p>
            <div class="juego-acciones">
              <a class="boton primario" href="${juego.url}" target="_blank" rel="noopener"><span>${esc(juego.accion)}</span><span aria-hidden="true">↗</span><span class="solo-lectores"> (abre otra pestaña)</span></a>
              <a class="juego-codigo" href="${juego.repo}" target="_blank" rel="noopener">Código en GitHub<span class="solo-lectores"> (abre otra pestaña)</span> <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </article>`).join("\n")}
      </div>`;
}

export function indiceJuegos() {
  return pagina({
    ruta: "/juegos/",
    titulo: "Juegos de Jhon Steven Alvarez Ruiz — Neiva Abierta y Bloquitos",
    descripcion: "Bloquitos para jugar en el navegador y Neiva Abierta en preparación nativa con Unreal. La descarga de Neiva está pendiente de compilación; su prototipo web anterior sigue documentado.",
    grafo: [persona(), migas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Juegos", ruta: "/juegos/" }]), {
      "@type": "CollectionPage", "@id": SITIO + "/juegos/#pagina", url: SITIO + "/juegos/",
      name: "Juegos de " + PERSONA.nombre,
      about: { "@id": SITIO + "/#persona" },
      hasPart: JUEGOS.map((juego) => ({
        "@type": "VideoGame", name: juego.nombre, url: new URL(juego.url, SITIO).href,
        description: juego.descripcion + " " + juego.detalle,
        isAccessibleForFree: true, inLanguage: "es", gamePlatform: juego.slug === "neiva-abierta" ? "Unreal · Preparación nativa" : "Navegador web",
        author: { "@id": SITIO + "/#persona" },
      })),
    }],
    cuerpo: `    <section class="franja juegos-pagina" aria-labelledby="juegos-titulo">
      <div class="ancho">
        <header class="juegos-cabecera revelar">
          <p class="micro">Sala de juegos / Acceso gratuito</p>
          <h1 id="juegos-titulo">Te toca<br><em>moverte.</em></h1>
          <div class="juegos-entrada"><p>Neiva prepara su versión nativa.<br>Bloquitos ya se juega en el navegador.</p><span class="juegos-sello">Desarrollo<br>y partidas</span></div>
        </header>
        ${tarjetasJuegos()}
        <aside class="juegos-nota revelar" aria-label="Sobre estos juegos">
          <div><p class="micro">Del mapa a la calle</p><p>La cartografía de Neiva procede de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap y sus colaboradores</a> y <a href="https://docs.overturemaps.org/attribution/" target="_blank" rel="noopener">Overture Maps</a>. El prototipo web 0.4 anterior documenta 22 cubiertas abiertas y un inspector de procedencia. Esas comprobaciones no acreditan la compilación de Unreal ni medidas físicas de la ciudad.</p><a class="mas" href="/proyectos/neiva-abierta/">Desarrollo y límites del juego <i aria-hidden="true">→</i></a></div>
          <div><p class="micro">Controles táctiles</p><p>Bloquitos admite botones y gestos en el celular. El <a href="https://neiva-abierta.vercel.app/" target="_blank" rel="noopener">prototipo web anterior de Neiva</a> también tiene controles en pantalla. La descarga nativa de Unreal permanece pendiente.</p><a class="mas" href="mailto:${esc(PERSONA.email)}">Hablemos de tu proyecto <i aria-hidden="true">↗</i></a></div>
        </aside>
      </div>
    </section>`,
  });
}
