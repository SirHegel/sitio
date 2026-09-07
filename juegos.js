import { PERSONA, SITIO } from "./datos.js";
import { esc, migas, pagina, persona } from "./plantilla.js";

export const JUEGOS = [
  {
    slug: "neiva-abierta",
    nombre: "Neiva Abierta",
    tipo: "Exploración 3D · Prototipo",
    titulo: "La ciudad, a tu paso.",
    descripcion: "Recorre Neiva con un personaje sin nombre. Sube a un carro y encuentra un pequeño estudio ficticio donde contactar los servicios de desarrollo de Jhon.",
    detalle: "Cartografía de OpenStreetMap y Overture; los edificios se interpretan a partir de sus datos. La cobertura y el detalle dependen de los datos disponibles.",
    url: "https://neiva-abierta.vercel.app/",
    repo: "https://github.com/SirHegel/neiva-abierta",
    accion: "Explorar Neiva",
    controles: "Teclado y ratón · Controles táctiles",
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

// Arte editorial CSS: decorativo, determinista, O(1) tiempo y espacio.
// No representa una captura ni una reconstrucción de la ciudad.
function ilustracion(slug) {
  if (slug === "neiva-abierta") return `<div class="juego-ilustracion juego-ilustracion-neiva" aria-hidden="true">
    <div class="juego-sol"></div><div class="juego-montanas"></div>
    <div class="juego-ciudad"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="juego-carretera"></div><div class="juego-estudio">J /</div><div class="juego-personaje"></div>
    <span class="juego-arte-nota">Ilustración / Neiva, Huila</span>
  </div>`;
  return `<div class="juego-ilustracion juego-ilustracion-bloquitos" aria-hidden="true">
    <div class="juego-tablero"><span class="pieza pieza-t"><i></i><i></i><i></i><i></i></span><span class="pieza pieza-l"><i></i><i></i><i></i><i></i></span><span class="pieza pieza-o"><i></i><i></i><i></i><i></i></span><span class="pieza pieza-i"><i></i><i></i><i></i><i></i></span><span class="pieza pieza-s"><i></i><i></i><i></i><i></i></span></div>
    <span class="juego-arte-nota">Ilustración / Una partida pendiente</span>
  </div>`;
}

export function tarjetasJuegos() {
  return `<div class="juegos-rejilla" data-escalonar>
${JUEGOS.map((juego) => `        <article class="juego-tarjeta revelar" id="${juego.slug}" aria-labelledby="${juego.slug}-titulo">
          ${ilustracion(juego.slug)}
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
    descripcion: "Juega gratis a Neiva Abierta, un prototipo de exploración 3D de Neiva, y a Bloquitos, un juego de bloques. En tu navegador, con controles para computador y celular.",
    grafo: [persona(), migas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Juegos", ruta: "/juegos/" }]), {
      "@type": "CollectionPage", "@id": SITIO + "/juegos/#pagina", url: SITIO + "/juegos/",
      name: "Juegos de " + PERSONA.nombre,
      about: { "@id": SITIO + "/#persona" },
      hasPart: JUEGOS.map((juego) => ({
        "@type": "VideoGame", name: juego.nombre, url: juego.url,
        description: juego.descripcion + " " + juego.detalle,
        isAccessibleForFree: true, inLanguage: "es", gamePlatform: "Navegador web",
        author: { "@id": SITIO + "/#persona" },
      })),
    }],
    cuerpo: `    <section class="franja juegos-pagina" aria-labelledby="juegos-titulo">
      <div class="ancho">
        <header class="juegos-cabecera revelar">
          <p class="micro">Sala de juegos / Acceso gratuito</p>
          <h1 id="juegos-titulo">Te toca<br><em>moverte.</em></h1>
          <div class="juegos-entrada"><p>Una ciudad para recorrer. Una partida que se alarga.<br>Juegos hechos aquí, abiertos para quien llegue.</p><span class="juegos-sello">Sin cuenta<br>En tu navegador</span></div>
        </header>
        ${tarjetasJuegos()}
        <aside class="juegos-nota revelar" aria-label="Sobre estos juegos">
          <div><p class="micro">Del mapa a la calle</p><p>Neiva Abierta es una interpretación jugable en desarrollo. Los datos proceden de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap y sus colaboradores</a> y de <a href="https://docs.overturemaps.org/attribution/" target="_blank" rel="noopener">Overture Maps</a>. Las fachadas, alturas ausentes y el estudio de Jhon son recreaciones; consulta el alcance y la fecha de los mapas dentro del juego.</p></div>
          <div><p class="micro">También en el celular</p><p>Abre el juego y usa sus controles en pantalla. Neiva Abierta requiere un navegador con gráficos 3D; su fluidez depende del equipo. Bloquitos también admite gestos táctiles.</p><a class="mas" href="mailto:${esc(PERSONA.email)}">Hablemos de tu proyecto <i aria-hidden="true">↗</i></a></div>
        </aside>
      </div>
    </section>`,
  });
}
