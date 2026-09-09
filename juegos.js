import { PERSONA, SITIO } from "./datos.js";
import { esc, migas, pagina, persona } from "./plantilla.js";
import { DESCARGA_NEIVA_UNREAL, entregaNeivaLista as descargaUnrealValidada, NEIVA_MEDIOS_VERIFICADOS } from "./descarga-neiva.js";

const descargaLista = descargaUnrealValidada();

export const JUEGOS = [
  {
    slug: "neiva-abierta",
    nombre: "Neiva Abierta",
    tipo: descargaLista ? "Unreal Engine 5.5.4 · Alfa 0.3 para Linux" : "Unreal Engine 5.5.4 · Alfa en desarrollo",
    titulo: "La ciudad, a tu paso.",
    descripcion: "Recorre una interpretación de Neiva con un personaje sin nombre y un coche conducible. Conversa con peatones sobre Jhon mediante diálogos escritos y voz sintética. La lluvia aparece periódicamente y el suelo se seca después.",
    detalle: descargaLista ? "Alfa 0.3 disponible gratis para Linux x64. Mira la jugabilidad real y consulta los controles antes de empezar." : "Descarga Linux x64 en preparación. La alfa 0.3 sigue en desarrollo; las fachadas y muchas alturas son aproximadas.",
    url: descargaLista ? DESCARGA_NEIVA_UNREAL.url : "/proyectos/neiva-abierta/#descarga-unreal",
    repo: "https://github.com/SirHegel/neiva-abierta",
    accion: descargaLista ? `Descargar para ${DESCARGA_NEIVA_UNREAL.platform}` : "Ver el juego",
    controles: descargaLista ? DESCARGA_NEIVA_UNREAL.platform : "WASD · Mouse · E interactuar · C / V colores",
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

// Captura del paquete Linux 0.3 descargado y ejecutado; sin retoques ni cambio de tamaño.
function vistaJuego(slug) {
  if (slug === "neiva-abierta") return `<figure class="juego-ilustracion juego-captura">
    <img src="/activos/neiva-unreal-linux.png" width="1920" height="1080" alt="Conversación con un vecino bajo la lluvia en Neiva Abierta, con peatones y edificios interpretados al fondo" loading="lazy" decoding="async">
    <figcaption class="juego-arte-nota">Unreal / ${NEIVA_MEDIOS_VERIFICADOS ? 'Alfa 0.3 para Linux' : 'Alfa 0.3 · Captura en revisión'}</figcaption>
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
              ${juego.slug === "neiva-abierta" ? `<a class="juego-codigo" href="/proyectos/neiva-abierta/#video-neiva">Ver vídeo y controles</a>` : ""}
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
    descripcion: `${descargaLista ? 'Neiva Abierta, alfa 0.3 disponible para Linux con Unreal' : 'Neiva Abierta, alfa en desarrollo con Unreal para Linux'}, y Bloquitos para jugar gratis en el navegador. Vídeo, controles y alcance de cada juego.`,
    grafo: [persona(), migas([{ nombre: "Inicio", ruta: "/" }, { nombre: "Juegos", ruta: "/juegos/" }]), {
      "@type": "CollectionPage", "@id": SITIO + "/juegos/#pagina", url: SITIO + "/juegos/",
      name: "Juegos de " + PERSONA.nombre,
      about: { "@id": SITIO + "/#persona" },
      hasPart: JUEGOS.map((juego) => ({
        "@type": "VideoGame", name: juego.nombre, url: new URL(juego.url, SITIO).href,
        description: juego.descripcion + " " + juego.detalle,
        isAccessibleForFree: true, inLanguage: "es", gamePlatform: juego.slug === "neiva-abierta" ? "Linux x64 · Unreal Engine 5.5.4" : "Navegador web",
        author: { "@id": SITIO + "/#persona" },
      })),
    }],
    cuerpo: `    <section class="franja juegos-pagina" aria-labelledby="juegos-titulo">
      <div class="ancho">
        <header class="juegos-cabecera revelar">
          <p class="micro">Sala de juegos / Acceso gratuito</p>
          <h1 id="juegos-titulo">Te toca<br><em>moverte.</em></h1>
          <div class="juegos-entrada"><p>Neiva Abierta sigue creciendo en Unreal.<br>Bloquitos se juega en el navegador.</p><span class="juegos-sello">Desarrollo<br>y partidas</span></div>
        </header>
        ${tarjetasJuegos()}
        <aside class="juegos-nota revelar" aria-label="Sobre estos juegos">
          <div><p class="micro">Del mapa a la calle</p><p>La cartografía de Neiva procede de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap y sus colaboradores</a> y <a href="https://docs.overturemaps.org/attribution/" target="_blank" rel="noopener">Overture Maps</a>. La alfa 0.3 revisa 17.697 alturas estimadas con datos de Google Research Open Buildings Temporal de 2023: 17.696 automáticas y una revisión manual. Las fachadas siguen interpretadas y faltan interiores y detalles de barrios. Estas estimaciones no acreditan un escaneo exacto de la ciudad.</p><a class="mas" href="/proyectos/neiva-abierta/">Vídeo, controles y alcance <i aria-hidden="true">→</i></a></div>
          <div><p class="micro">Controles táctiles</p><p>Bloquitos admite botones y gestos en el celular. El <a href="https://neiva-abierta.vercel.app/" target="_blank" rel="noopener">prototipo web anterior de Neiva</a> conserva controles en pantalla. ${descargaLista ? 'La alfa 0.3 de Unreal se descarga para Linux' : 'La próxima alfa de Unreal está prevista para Linux'}; su vídeo se puede ver desde el teléfono. Windows y macOS esperan compilación y pruebas en equipos nativos; aún no tienen descarga.</p><a class="mas" href="mailto:${esc(PERSONA.email)}">Hablemos de tu proyecto <i aria-hidden="true">↗</i></a></div>
        </aside>
      </div>
    </section>`,
  });
}
