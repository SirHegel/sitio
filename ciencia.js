import { pagina } from "./plantilla.js";

export function cienciaPagina() {
  return pagina({
    ruta: "/ciencia/",
    titulo: "La forma de una fase · Ciencia · Jhon Steven Álvarez Ruiz",
    descripcion: "Un laboratorio interactivo de interferencia: dos modos, una esfera de Bloch y un problema inverso con demostración y datos reproducibles.",
    claseCuerpo: "pagina-ciencia",
    cuerpo: `
<article class="ciencia" id="laboratorio-ciencia">
  <header class="ciencia-cabecera">
    <div class="ciencia-indice"><span>Observatorio / Ciencia</span><span>Estudio 001 · Interferencia</span></div>
    <div class="ciencia-titular"><h1>La forma<br>de una <em>fase.</em></h1>
      <div class="ciencia-entrada"><span class="ciencia-sello">CUADERNO EXPERIMENTAL</span>
        <p>Dos estados pueden proyectar la misma sombra. Una medición adicional revela lo que la imagen esconde.</p>
        <a href="#instrumento-ciencia">Intervenir el modelo <span aria-hidden="true">↘</span></a>
      </div>
    </div>
  </header>

  <section class="ciencia-instrumento" id="instrumento-ciencia" aria-labelledby="instrumento-titulo">
    <div class="ciencia-banda"><h2 id="instrumento-titulo">01 / Cámara de interferencia</h2><span><i aria-hidden="true"></i> Modelo calculado en tu navegador</span></div>
    <div class="ciencia-mesa">
      <div class="ciencia-visor">
        <div class="ciencia-visor-nota"><span>ρ(x) · Densidad angular</span><span>Geometría paramétrica</span></div>
        <canvas id="ciencia-volumen" aria-label="Toro paramétrico: el grosor del tubo crece con la raíz de la densidad de probabilidad. Mueve el puntero para girar la vista. Los controles de ángulo y fase permiten modificar el estado."></canvas>
        <div class="ciencia-visor-pie"><span>Arrastra para orbitar<br><small>El puntero inclina la cámara</small></span><span>Grosor ∝ √ρ<br><small>Representación sin escala espacial</small></span></div>
        <div class="ciencia-sin-canvas" hidden>La representación gráfica no está disponible. Las ecuaciones, mediciones y controles permanecen accesibles.</div>
      </div>
      <div class="ciencia-mandos">
        <div class="ciencia-mandos-titulo"><span>ESTADO PURO</span><span>|ψ⟩</span></div>
        <div class="ciencia-bloch-caja"><canvas id="ciencia-bloch" aria-label="Esfera de Bloch del estado: ejes X, Y y Z adimensionales. El polo norte es el modo cero y el sur el modo uno."></canvas><span id="ciencia-bloch-lectura">Vector de Bloch: (0,707; 0,707; 0)</span></div>
        <label class="ciencia-control" for="ciencia-theta"><span>Mezcla de modos <b>θ <output id="ciencia-theta-valor" for="ciencia-theta">90°</output></b></span><input type="range" id="ciencia-theta" min="0" max="180" step="0.1" value="90" disabled><small><span>0° · modo 0</span><span>180° · modo 1</span></small></label>
        <label class="ciencia-control" for="ciencia-phi"><span>Fase relativa <b>φ <output id="ciencia-phi-valor" for="ciencia-phi">45°</output></b></span><input type="range" id="ciencia-phi" min="0" max="360" step="0.1" value="45" disabled><small><span>0°</span><span>360° · una vuelta</span></small></label>
        <div class="ciencia-botones"><button type="button" id="ciencia-evolucion" aria-pressed="false" disabled>↻ Evolucionar fase</button><button type="button" id="ciencia-reiniciar" disabled>Reiniciar</button></div>
        <p class="ciencia-tiempo" id="ciencia-tiempo">τ = 0,00 · tiempo adimensional</p>
      </div>
    </div>
    <div class="ciencia-lecturas" aria-label="Mediciones calculadas">
      <div><span>Contraste de interferencia</span><strong id="ciencia-contraste">1,000</strong><small>(ρmáx − ρmín) / (ρmáx + ρmín)</small></div>
      <div><span>Probabilidad del modo 1</span><strong id="ciencia-p1">0,500</strong><small>P₁ = sin²(θ/2)</small></div>
      <div><span>Integral de la densidad</span><strong id="ciencia-norma">1,000000</strong><small>∫₀²π ρ(x) dx · adimensional</small></div>
    </div>
    <div class="ciencia-grafica-caja"><div class="ciencia-grafica-titulo"><h3>Una sección de la sombra</h3><span><i aria-hidden="true"></i> ρ(x), rad⁻¹ <b class="ciencia-leyenda-base">— Base uniforme</b></span></div>
      <canvas id="ciencia-grafica" aria-label="Gráfica de la densidad angular rho en radianes inversos, entre 0 y 1 sobre pi, frente a x en radianes, entre 0 y 2 pi. La curva depende de la mezcla y la fase elegidas."></canvas>
      <p class="ciencia-error">Error observado de normalización: <output id="ciencia-error">pendiente de cálculo</output>. Umbral fijado: 10⁻¹². <span id="ciencia-veredicto"></span></p>
    </div>
    <noscript><p class="ciencia-aviso">Activa JavaScript para manipular el modelo. El estado inicial es θ = π/2, φ = π/4: P₁ = 1/2, contraste = 1 y ρ(x) = [1 + cos(x − π/4)] / 2π. La demostración se puede leer completa.</p></noscript>
  </section>

  <section class="ciencia-inverso" aria-labelledby="inverso-titulo">
    <div class="ciencia-inverso-texto"><p class="ciencia-kicker">02 / Problema inverso</p><h2 id="inverso-titulo">Dibuja la sombra.<br><em>Recupera el estado.</em></h2><p>Elige el contraste y el lugar del máximo. El modelo encuentra un estado que los produce. Después cambia a su gemelo: la imagen permanece, la probabilidad modal cambia.</p><p class="ciencia-resultado-tipo">Resultado exacto del modelo · derivación de un caso conocido</p></div>
    <div class="ciencia-inverso-controles">
      <label class="ciencia-control" for="ciencia-objetivo-c"><span>Contraste deseado <b>C <output id="ciencia-objetivo-c-valor" for="ciencia-objetivo-c">0,80</output></b></span><input id="ciencia-objetivo-c" type="range" min="0" max="1" step="0.01" value="0.8" disabled><small><span>0 · uniforme</span><span>1 · nodo completo</span></small></label>
      <label class="ciencia-control" for="ciencia-objetivo-x"><span>Posición del máximo <b>x* <output id="ciencia-objetivo-x-valor" for="ciencia-objetivo-x">135°</output></b></span><input id="ciencia-objetivo-x" type="range" min="0" max="360" step="1" value="135" disabled><small><span>0°</span><span>360°</span></small></label>
      <div class="ciencia-botones"><button id="ciencia-resolver" type="button" class="ciencia-boton-principal" disabled>Resolver estado <span aria-hidden="true">↗</span></button><button id="ciencia-gemelo" type="button" disabled>Ver estado gemelo</button></div>
      <p class="ciencia-solucion" id="ciencia-solucion" role="status" aria-live="polite">La rama principal tiene θ = arcsin(C). El estado gemelo tiene θ′ = π − θ.</p>
    </div>
  </section>

  <section class="ciencia-cuaderno" aria-labelledby="cuaderno-titulo">
    <div class="ciencia-cuaderno-cabecera"><p class="ciencia-kicker">03 / El argumento, a la vista</p><h2 id="cuaderno-titulo">La cuenta tiene<br>que cerrar.</h2><p>Este estudio construye y verifica una solución exacta de un problema pequeño. No presenta una conjetura abierta como resuelta ni reclama novedad matemática.</p><button id="ciencia-descargar" type="button" disabled>↓ Descargar experimento · CSV</button><a href="https://github.com/SirHegel/sitio" target="_blank" rel="noopener">Revisar código y pruebas ↗</a></div>
    <div class="ciencia-cuaderno-notas">
      <details open><summary><span>01</span> Modelo y supuestos <span aria-hidden="true">＋</span></summary><div class="ciencia-nota">
        <p>1. Partícula ideal en un anillo de radio fijo; coordenada angular x ∈ [0, 2π), en radianes. 2. Solo intervienen dos modos ortonormales: u₀ = 1/√(2π) y u₁ = e<sup>−ix</sup>/√(2π). 3. Estado puro, sin ruido ni interacción con un entorno. La masa y el radio no se fijan: el tiempo se expresa como τ = ΔE·t/ℏ, con ΔE = ℏ²/(2mR²).</p>
        <div class="ciencia-ecuacion">ψ(x) = [cos(θ/2) + e<sup>i(φ−x)</sup> sin(θ/2)] / √(2π)</div>
        <div class="ciencia-ecuacion">ρ(x) = |ψ(x)|² = [1 + sin(θ) cos(x − φ)] / 2π</div>
        <p>θ ∈ [0, π] mezcla amplitudes; φ ∈ [0, 2π) fija su fase relativa. La densidad ρ tiene unidad rad⁻¹. Al evolucionar libremente, φ(τ) = φ(0) − τ. Un segundo de animación representa 0,45 unidades de τ; no mide un tiempo físico en segundos.</p>
        <p>La geometría del toro codifica √ρ en el grosor; sus ejes espaciales son una representación. El qubit se representa aparte: r = (sin θ cos φ, sin θ sin φ, cos θ), |r| = 1. Fuentes: <a href="https://ocw.mit.edu/courses/8-04-quantum-physics-i-spring-2016/pages/lecture-notes/" target="_blank" rel="noopener">Barton Zwiebach, MIT, 8.04, apuntes 6 y 10, 2016</a>; <a href="https://quantum.cloud.ibm.com/learning/en/courses/general-formulation-of-quantum-information/density-matrices/bloch-sphere" target="_blank" rel="noopener">IBM Quantum, esfera de Bloch</a>.</p>
      </div></details>
      <details><summary><span>02</span> Proposición y demostración <span aria-hidden="true">＋</span></summary><div class="ciencia-nota">
        <p><strong>Proposición.</strong> Para cada contraste C ∈ (0, 1] y máximo x*, existen estados con θ = arcsin C o θ = π − arcsin C, y φ = x* módulo 2π, que producen la densidad buscada. Si 0 &lt; C &lt; 1, las dos ramas tienen la misma densidad y diferentes probabilidades P₁.</p>
        <p><strong>Demostración.</strong> Al desarrollar el módulo cuadrado, el término cruzado vale 2 cos(θ/2) sin(θ/2) cos(x − φ) = sin θ cos(x − φ). Por tanto ρmáx = (1 + sin θ)/(2π), ρmín = (1 − sin θ)/(2π), y su contraste es sin θ. Ambas ramas resuelven sin θ = C; el coseno alcanza su máximo en x = φ módulo 2π.</p>
        <div class="ciencia-ecuacion">P₁(θ) = (1 − cos θ)/2<br>P₁(π − θ) = (1 + cos θ)/2</div>
        <p>Una medición adicional de P₁ determina cos θ y distingue las ramas. En C = 1 coinciden: θ = π/2. En C = 0 la densidad es uniforme, φ no se puede identificar y no existe un máximo único. En los polos la fase tampoco distingue estados físicos. La integral es 1 porque la integral de un coseno sobre el periodo completo es cero.</p>
      </div></details>
      <details><summary><span>03</span> Verificación, error y costo <span aria-hidden="true">＋</span></summary><div class="ciencia-nota">
        <p>Métrica objetivo: E = |∫ρ dx − 1|, adimensional. Base medida: el valor mostrado arriba para el estado actual; umbral fijado antes del cálculo: E ≤ 10⁻¹². La regla trapezoidal usa 512 intervalos uniformes. Para este armónico periódico la cuadratura es exacta en aritmética real; el residuo mostrado corresponde a redondeo de coma flotante.</p>
        <p>Sanidad: polos θ = 0 y π, contraste cero; ecuador θ = π/2, contraste uno; periodicidad φ + 2π; ρ ≥ 0; equivalencia entre el módulo de la amplitud y la fórmula de densidad. La sensibilidad del inverso es dθ/dC = 1/√(1 − C²), que diverge al acercarse C a 1. El laboratorio no añade ruido a las muestras.</p>
        <p>Costo del muestreo y exportación: O(N) tiempo y memoria, N = 512 intervalos. Inversión analítica: O(1). El CSV incluye parámetros, amplitud compleja, densidad e integral. La malla visual se interpola: sus píxeles no constituyen evidencia numérica. Error respecto de un experimento físico: σ = desconocida, porque no hay mediciones instrumentales.</p>
      </div></details>
      <details><summary><span>04</span> Lo que falta investigar <span aria-hidden="true">＋</span></summary><div class="ciencia-nota">
        <p>La pieza resuelta identifica el dato que falta: una población modal. El siguiente estudio puede evaluar cómo reconstruir ambos parámetros con un número finito de detecciones y ruido. Antes de medir habría que fijar el modelo de ruido, el número de muestras y un umbral de error angular.</p>
        <p>Eso es trabajo pendiente de este cuaderno, no una afirmación de que la comunidad carezca de métodos. No se ha demostrado aquí una mejora sobre tomografía cuántica conocida. TODO(dato): mediciones, comparación con un estimador de referencia y costo físico del experimento.</p>
      </div></details>
    </div>
  </section>
  <footer class="ciencia-cierre"><span>FIN DEL ESTUDIO 001</span><p>La imagen seduce.<br>La prueba responde.</p><a href="/proyectos/">Volver a las construcciones ↗</a></footer>
</article>`,
  });
}
