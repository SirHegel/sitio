import { PERSONA, SITIO } from './datos.js';
import { esc, migas, pagina, persona } from './plantilla.js';
import { descargaNeiva, descargaUnrealValidada, DESCARGA_NEIVA_UNREAL } from './descarga-neiva.js';

// El antecedente web conserva su revisión. La evidencia final se fija al recibo publicado.
export const NEIVA_REVISION_EVIDENCIA = '5fd5188fb125309eae3f0b76af3e4755948d07d6';
export const NEIVA_REVISION_NATIVA = '247e28ae25e243eaa9700dfd1f1bd525c93e6239';
const codigo = 'https://github.com/SirHegel/neiva-abierta';
const evidencia = `${codigo}/blob/${NEIVA_REVISION_NATIVA}`;
const disponible = descargaUnrealValidada();

export const NEIVA_ABIERTA = {
  slug: 'neiva-abierta', nombre: 'Neiva Abierta', repo: codigo,
  resumen: `Explora una interpretación de Neiva, Huila, a pie o en coche, con Unreal Engine 5.5.4. ${disponible ? 'Alfa 0.2 disponible gratis para Linux x64.' : 'Alfa en desarrollo; descarga Linux x64 en preparación.'}`,
  estado: disponible ? 'Unreal Engine · Alfa 0.2 para Linux' : 'Unreal Engine · Alfa en desarrollo',
  lenguajes: ['Unreal C++', 'Linux x64', 'Cartografía abierta'],
  cifras: 'Exploración a pie · Coche conducible · Ciudad aproximada',
};

// O(1) tiempo y espacio: un reproductor sin reproducción ni descarga automática del vídeo.
export function videoNeivaUnreal() {
  return `<figure class="neiva-evidencia" id="video-neiva">
    <video controls playsinline preload="none" poster="/activos/neiva-unreal-linux.png" width="1920" height="1080" aria-label="Vídeo de jugabilidad de Neiva Abierta, alfa 0.2 para Linux">
      <source src="/activos/neiva-unreal-linux.webm" type="video/webm">
      <a href="/activos/neiva-unreal-linux.webm">Abrir el vídeo de jugabilidad</a>.
    </video>
    <figcaption>Jugabilidad real de la alfa 0.2 para Linux. El personaje recorre la ciudad interpretada a pie y en coche.</figcaption>
  </figure>`;
}

// O(K) tiempo y espacio de salida para K controles. La evidencia técnica vive en su registro enlazado.
export function paginaNeiva() {
  const controles = [
    ['W / A / S / D', 'Caminar o conducir'], ['Mouse', 'Mirar alrededor'],
    ['Shift', 'Correr mientras lo mantienes pulsado'], ['Espacio', 'Saltar a pie; frenar en el coche'],
    ['E', 'Entrar o salir del coche; contactar desde el estudio'],
    ['C / V', 'Cambiar el color de camiseta / pantalón'],
    ['R', 'Volver al inicio o recuperar el coche'], ['Esc / P', 'Pausar, continuar o salir'],
  ];
  return pagina({
    ruta: '/proyectos/neiva-abierta/',
    titulo: 'Neiva Abierta para Linux — juego de Jhon Steven Alvarez Ruiz',
    descripcion: NEIVA_ABIERTA.resumen,
    grafo: [persona(), migas([{ nombre: 'Inicio', ruta: '/' }, { nombre: 'Juegos', ruta: '/juegos/' }, { nombre: 'Neiva Abierta', ruta: '/proyectos/neiva-abierta/' }]), {
      '@type': 'VideoGame', '@id': SITIO + '/proyectos/neiva-abierta/#juego', name: 'Neiva Abierta',
      url: SITIO + '/proyectos/neiva-abierta/', description: NEIVA_ABIERTA.resumen,
      operatingSystem: 'Linux x64', gamePlatform: 'PC', softwareVersion: '0.2.0-alpha',
      isAccessibleForFree: true, inLanguage: 'es', author: { '@id': SITIO + '/#persona' },
      ...(descargaUnrealValidada() ? { downloadUrl: DESCARGA_NEIVA_UNREAL.url } : {}),
    }],
    cuerpo: `    <section class="franja">
      <div class="scrim columna revelar proyecto-cabecera">
        <p class="micro"><a href="/juegos/">Juegos</a> · Unreal Engine 5.5.4 · ${disponible ? 'Alfa 0.2 disponible para Linux' : 'Alfa en desarrollo'}</p>
        <h1 class="titulo media">Neiva Abierta</h1>
        <p class="lead">Camina por una interpretación de Neiva. Acércate al coche, súbete y sigue el recorrido a tu ritmo.</p>
        <p>Un personaje sin nombre recorre la ciudad, cambia los colores de su ropa y conduce. El parque incorpora árboles de copa ancha y bancos. Un pequeño estudio ficticio permite contactar mis servicios de desarrollo.</p>
        ${descargaNeiva()}
        <div class="acciones sep-s"><a class="boton" href="#video-neiva"><span>Ver jugabilidad</span></a><a class="boton" href="#controles-neiva"><span>Ver controles</span></a></div>
        ${videoNeivaUnreal()}
      </div>
    </section>
    <section class="franja" aria-labelledby="abrir-neiva">
      <div class="scrim columna revelar prosa-ancha">
        <h2 id="abrir-neiva">${descargaUnrealValidada() ? 'Para abrir el juego' : 'Preparar tu equipo'}</h2>
        <p>${descargaUnrealValidada() ? 'Descarga el archivo para Linux y extrae su contenido completo en una carpeta.' : 'La próxima alfa está prevista para Linux x64. Cuando la descarga esté disponible, extrae su contenido completo en una carpeta.'} Abre una terminal en esa carpeta y ejecuta:</p>
        <pre><code>./Jugar-Neiva.sh</code></pre>
        <p>Conserva la carpeta <code>Linux/</code> junto al lanzador. El juego incluye lo necesario para ejecutarse; no necesitas instalar el editor de Unreal. La primera carga puede tardar.</p>
        <h3>Equipo compatible</h3>
        <p>Linux x64, una sesión gráfica y una GPU con controlador compatible con Vulkan. Se probó en una NVIDIA RTX 4050 Laptop con 6 GB de memoria gráfica; los requisitos mínimos para otros equipos todavía no están establecidos.</p>
        <p>${disponible ? 'Esta descarga corresponde a Linux.' : 'La entrega prevista corresponde a Linux.'} Las versiones Windows, Android e iOS siguen pendientes. En celular puedes ver el vídeo y jugar <a href="https://bloquitos.vercel.app/" rel="noopener" target="_blank">Bloquitos</a>.</p>
      </div>
    </section>
    <section class="franja" aria-labelledby="controles-neiva">
      <div class="scrim columna revelar prosa-ancha">
        <h2 id="controles-neiva">Controles</h2>
        <table><thead><tr><th scope="col">Entrada</th><th scope="col">Acción</th></tr></thead><tbody>${controles.map(([tecla, accion]) => `<tr><th scope="row">${esc(tecla)}</th><td>${esc(accion)}</td></tr>`).join('')}</tbody></table>
        <p>Acércate al coche antes de pulsar E. Al bajarte, vuelves a controlar al personaje. C y V cambian el color de las prendas que ya lleva.</p>
      </div>
    </section>
    <section class="franja" aria-labelledby="alcance-neiva">
      <div class="scrim columna revelar prosa-ancha">
        <h2 id="alcance-neiva">Una ciudad todavía en construcción</h2>
        <p>El recorrido utiliza calles y huellas de edificios de mapas abiertos. Las fachadas, muchas alturas y parte del centro son interpretadas. El terreno es plano; faltan interiores y detalles de barrios. La vegetación del parque es una composición del juego y no un inventario de los árboles de Neiva. El estudio de Jhon es ficticio y no representa una dirección comercial real.</p>
        <p>Esta alfa permite explorar y conducir. Queda trabajo en iluminación, animaciones y rendimiento; las imágenes muestran ese acabado actual. La ciudad no es una réplica exacta de Neiva ni tiene el detalle de una producción AAA.</p>
        <p><a href="${evidencia}/docs/FIDELIDAD.md" rel="noopener" target="_blank">Fuentes y alcance del modelo</a> · <a href="${evidencia}/data/verification/unreal-visual-download.json" rel="noopener" target="_blank">Registro técnico de pruebas</a> · <a href="${codigo}" rel="noopener" target="_blank">Código y créditos</a></p>
        <p>El <a href="https://neiva-abierta.vercel.app/" rel="noopener" target="_blank">prototipo web anterior, hecho con Three.js</a>, se conserva como antecedente. Para transmitir Unreal desde tu propio computador, consulta la <a href="${evidencia}/docs/DISTRIBUCION.md" rel="noopener" target="_blank">guía local de transmisión</a>; no hay una partida pública permanente en el navegador.</p>
        <p><a class="mas" href="mailto:${esc(PERSONA.email)}">Contactar a Jhon <i aria-hidden="true">↗</i></a></p>
      </div>
    </section>`,
  });
}
