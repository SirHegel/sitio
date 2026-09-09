import { PERSONA, SITIO } from './datos.js';
import { esc, migas, pagina, persona } from './plantilla.js';
import { descargaNeiva, entregaNeivaLista as descargaUnrealValidada, DESCARGA_NEIVA_UNREAL, NEIVA_REVISION_NATIVA, NEIVA_RUTA_RECIBO, NEIVA_MEDIOS_VERIFICADOS } from './descarga-neiva.js';

// El antecedente web conserva su revisión. La evidencia final se fija al recibo publicado.
export const NEIVA_REVISION_EVIDENCIA = '5fd5188fb125309eae3f0b76af3e4755948d07d6';
export { NEIVA_REVISION_NATIVA };
const codigo = 'https://github.com/SirHegel/neiva-abierta';
const evidencia = NEIVA_REVISION_NATIVA ? `${codigo}/blob/${NEIVA_REVISION_NATIVA}` : `${codigo}/blob/main`;
const disponible = descargaUnrealValidada();

export const NEIVA_ABIERTA = {
  slug: 'neiva-abierta', nombre: 'Neiva Abierta', repo: codigo,
  resumen: `Explora una interpretación de Neiva, Huila, a pie o en coche, con Unreal Engine 5.5.4. ${disponible ? 'Alfa 0.3 disponible gratis para Linux x64.' : 'Alfa en desarrollo; descarga Linux x64 en preparación.'}`,
  estado: disponible ? 'Unreal Engine · Alfa 0.3 para Linux' : 'Unreal Engine · Alfa en desarrollo',
  lenguajes: ['Unreal C++', 'Linux x64', 'Cartografía abierta'],
  cifras: 'Exploración a pie · Coche conducible · Ciudad aproximada',
};

// O(1) tiempo y espacio: un reproductor sin reproducción ni descarga automática del vídeo.
export function videoNeivaUnreal() {
  return `<figure class="neiva-evidencia" id="video-neiva">
    <video controls playsinline preload="none" poster="/activos/neiva-unreal-linux.png" width="1920" height="1080" aria-label="${NEIVA_MEDIOS_VERIFICADOS ? 'Vídeo de jugabilidad de Neiva Abierta, alfa 0.3 para Linux' : 'Grabación de jugabilidad de la alfa 0.3, en revisión'}">
      <source src="/activos/neiva-unreal-linux.webm" type="video/webm">
      <track kind="captions" src="/activos/neiva-unreal-linux-es.vtt" srclang="es" label="Español" default>
      <a href="/activos/neiva-unreal-linux.webm">Abrir el vídeo de jugabilidad</a>.
    </video>
    <figcaption>${NEIVA_MEDIOS_VERIFICADOS ? 'Jugabilidad real de la alfa 0.3 para Linux.' : 'Grabación de la alfa 0.3, en revisión.'} Una conversación sobre Jhon con voz sintética y texto, lluvia y recorrido a pie.</figcaption>
    <details class="sep-s"><summary>Sobre esta grabación</summary><p>El vídeo procede del paquete Linux descargado. Se recodificó a 1.920 × 1.080 píxeles y 30 cuadros por segundo para su publicación; esa frecuencia del archivo no mide los FPS nativos del juego. La voz sintética forma parte de la partida.</p></details>
  </figure>`;
}

// O(K) tiempo y espacio de salida para K controles. La evidencia técnica vive en su registro enlazado.
export function paginaNeiva(explicacion = '') {
  const controles = [
    ['W / A / S / D', 'Caminar o conducir'], ['Mouse', 'Mirar alrededor'],
    ['Shift', 'Correr mientras lo mantienes pulsado'], ['Espacio', 'Saltar a pie; frenar en el coche'],
    ['E', 'Hablar con alguien cercano; entrar o salir del coche'],
    ['1 / 2 / 3 / 4 o clic', 'Elegir un tema durante una conversación'],
    ['C / V', 'Cambiar el color de camiseta / pantalón'],
    ['R', 'Volver al inicio o recuperar el coche'], ['Esc / P', 'Cerrar la conversación; fuera de ella, abrir la pausa'],
  ];
  return pagina({
    ruta: '/proyectos/neiva-abierta/',
    titulo: 'Neiva Abierta para Linux — juego de Jhon Steven Alvarez Ruiz',
    descripcion: NEIVA_ABIERTA.resumen,
    grafo: [persona(), migas([{ nombre: 'Inicio', ruta: '/' }, { nombre: 'Juegos', ruta: '/juegos/' }, { nombre: 'Neiva Abierta', ruta: '/proyectos/neiva-abierta/' }]), {
      '@type': 'VideoGame', '@id': SITIO + '/proyectos/neiva-abierta/#juego', name: 'Neiva Abierta',
      url: SITIO + '/proyectos/neiva-abierta/', description: NEIVA_ABIERTA.resumen,
      operatingSystem: 'Linux x64', gamePlatform: 'PC', softwareVersion: '0.3.0-alpha',
      isAccessibleForFree: true, inLanguage: 'es', author: { '@id': SITIO + '/#persona' },
      ...(descargaUnrealValidada() ? { downloadUrl: DESCARGA_NEIVA_UNREAL.url } : {}),
    }],
    cuerpo: `    <section class="franja">
      <div class="scrim columna revelar proyecto-cabecera">
        <p class="micro"><a href="/juegos/">Juegos</a> · Unreal Engine 5.5.4 · ${disponible ? 'Alfa 0.3 disponible para Linux' : 'Alfa en desarrollo'}</p>
        <h1 class="titulo media">Neiva Abierta</h1>
        <p class="lead">Camina por una interpretación de Neiva. Acércate al coche, súbete y sigue el recorrido a tu ritmo.</p>
        <p>Un personaje sin nombre recorre la ciudad, cambia los colores de su ropa y conduce. Acércate a los peatones para conversar sobre Jhon y sus servicios de desarrollo. La lluvia aparece periódicamente y las superficies se secan de forma gradual.</p>
        ${descargaNeiva()}
        <div class="acciones sep-s"><a class="boton" href="#video-neiva"><span>Ver jugabilidad</span></a><a class="boton" href="#controles-neiva"><span>Ver controles</span></a></div>
        ${videoNeivaUnreal()}
      </div>
    </section>
    ${explicacion}
    <section class="franja" aria-labelledby="abrir-neiva">
      <div class="scrim columna revelar prosa-ancha">
        <h2 id="abrir-neiva">${descargaUnrealValidada() ? 'Para abrir el juego' : 'Preparar tu equipo'}</h2>
        <p>${descargaUnrealValidada() ? 'Descarga el archivo para Linux y extrae su contenido completo en una carpeta.' : 'La próxima alfa está prevista para Linux x64. Cuando la descarga esté disponible, extrae su contenido completo en una carpeta.'} Abre una terminal en esa carpeta y ejecuta:</p>
        <pre><code>./Jugar-Neiva.sh</code></pre>
        <p>Conserva la carpeta <code>Linux/</code> junto al lanzador. El juego incluye lo necesario para ejecutarse; no necesitas instalar el editor de Unreal. La primera carga puede tardar.</p>
        <h3>Equipo compatible</h3>
        <p>Linux x64, una sesión gráfica y una GPU con controlador compatible con Vulkan. Se probó en una NVIDIA RTX 4050 Laptop con 6 GB de memoria gráfica; los requisitos mínimos para otros equipos todavía no están establecidos.</p>
        <p>${disponible ? 'Esta descarga corresponde a Linux.' : 'La entrega prevista corresponde a Linux.'} Windows y macOS siguen pendientes de compilación y pruebas en equipos de esas plataformas; todavía no hay descargas para ellos. Tampoco hay versión nativa para Android o iOS. En celular puedes ver el vídeo y jugar <a href="https://bloquitos.vercel.app/" rel="noopener" target="_blank">Bloquitos</a>.</p>
      </div>
    </section>
    <section class="franja" aria-labelledby="controles-neiva">
      <div class="scrim columna revelar prosa-ancha">
        <h2 id="controles-neiva">Controles</h2>
        <table><thead><tr><th scope="col">Entrada</th><th scope="col">Acción</th></tr></thead><tbody>${controles.map(([tecla, accion]) => `<tr><th scope="row">${esc(tecla)}</th><td>${esc(accion)}</td></tr>`).join('')}</tbody></table>
        <p>Acércate al coche antes de pulsar E. Al bajarte, vuelves a controlar al personaje. Para conversar, acércate a un peatón y pulsa E; elige un tema con los números o el cursor. Durante la conversación se bloquean el movimiento, el salto y el reinicio. E, Esc o P la cierran y devuelven el control. C y V cambian el color de las prendas que ya lleva.</p>
      </div>
    </section>
    <section class="franja" aria-labelledby="novedades-neiva">
      <div class="scrim columna revelar prosa-ancha">
        <h2 id="novedades-neiva">Conversar y seguir el recorrido</h2>
        <p>Esta alfa incorpora ocho peatones y diálogos escritos para el juego: siete clips con voz sintética en español y texto en pantalla. Puedes preguntar por Jhon, sus servicios y cómo contactarlo. Son personajes de ficción; las conversaciones no son testimonios de habitantes reales ni un chat de respuestas ilimitadas.</p>
        <p>La opción de contacto muestra el correo de Jhon. Abrir tu aplicación de correo es una acción voluntaria; el juego no envía mensajes por ti.</p>
        <h3>Llueve y escampa</h3>
        <p>El clima alterna periodos secos y lluvia. Al escampar, la humedad de las superficies disminuye gradualmente. Es una simulación del juego; no reproduce el tiempo meteorológico actual de Neiva.</p>
      </div>
    </section>
    <section class="franja" aria-labelledby="alcance-neiva">
      <div class="scrim columna revelar prosa-ancha">
        <h2 id="alcance-neiva">Una ciudad todavía en construcción</h2>
        <p>El recorrido utiliza calles y huellas de edificios de OpenStreetMap y Overture. Se revisaron 17.697 alturas estimadas: 17.696 incorporadas mediante un proceso automático y una revisión manual. La fuente es el conjunto abierto Google Research Open Buildings 2.5D Temporal de 2023. La revisión manual conserva el dato anterior para poder auditar el cambio. Estas alturas no son mediciones físicas certificadas ni un escaneo exacto de la ciudad. La incertidumbre métrica local todavía no está determinada.</p>
        <p>Las fachadas y parte del centro siguen interpretadas. El terreno es plano; faltan interiores y detalles de barrios. La vegetación del parque es una composición del juego, no un inventario de los árboles reales. La ciudad no es una réplica exacta de Neiva ni tiene el detalle de una producción AAA. Queda trabajo en iluminación, animaciones y rendimiento.</p>
        <p>Fuentes de las alturas: <a href="https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_Research_open-buildings-temporal_v1" rel="noopener" target="_blank">Google Research Open Buildings 2.5D Temporal</a>, CC BY 4.0; contiene datos modificados de Copernicus Sentinel-2. Este conjunto es independiente de las imágenes de Google Maps.</p>
        <p><a href="${evidencia}/docs/FIDELIDAD.md" rel="noopener" target="_blank">Fuentes y alcance del modelo</a> · <a href="${NEIVA_REVISION_NATIVA && NEIVA_RUTA_RECIBO ? `${evidencia}/${NEIVA_RUTA_RECIBO}` : codigo}" rel="noopener" target="_blank">${NEIVA_RUTA_RECIBO ? 'Registro técnico de pruebas' : 'Repositorio; recibo 0.3 pendiente'}</a> · <a href="${codigo}" rel="noopener" target="_blank">Código y créditos</a></p>
        <p>El <a href="https://neiva-abierta.vercel.app/" rel="noopener" target="_blank">prototipo web anterior, hecho con Three.js</a>, se conserva como antecedente. Para transmitir Unreal desde tu propio computador, consulta la <a href="${evidencia}/docs/DISTRIBUCION.md" rel="noopener" target="_blank">guía local de transmisión</a>; no hay una partida pública permanente en el navegador.</p>
        <p><a class="mas" href="mailto:${esc(PERSONA.email)}">Contactar a Jhon <i aria-hidden="true">↗</i></a></p>
      </div>
    </section>`,
  });
}
