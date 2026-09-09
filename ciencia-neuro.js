import { pagina, persona, esc } from './plantilla.js';
import { readFileSync } from 'node:fs';
const ensayo = JSON.parse(readFileSync(new URL('./activos/resultados-neuro.json', import.meta.url), 'utf8'));
const cifra = (n, d=3) => Number(n).toLocaleString('es-CO', { maximumFractionDigits:d });

export const ESTUDIOS_NEURO = [
  {
    id: 'sinapsis', numero: '01', nombre: 'El ritmo de una sinapsis', palabra: 'comunicar.',
    pregunta: 'Elegir un intervalo entre impulsos que permita sostener la liberación de neurotransmisor.',
    breve: 'Una neurona dispone de una reserva limitada de vesículas. Cada impulso consume una parte; el tiempo entre impulsos permite recuperarla.',
    resultado: 'Intervalo mínimo con una garantía dentro del modelo, incluso cuando la recuperación y la probabilidad de liberación son inciertas.',
    visual: 'Botón presináptico, vesículas, hendidura y receptores. Las partículas representan cantidades relativas; no son moléculas contadas en un experimento.',
    vinculo: 'La transmisión entre neuronas es uno de los mecanismos materiales que participan en percepción y aprendizaje. Esta pieza estudia la reserva sináptica; no deduce pensamientos a partir de ella.',
    controles: [
      ['u', 'Fracción liberada por impulso', .1, .8, .01, .35, ''],
      ['tauMs', 'Tiempo de recuperación', 100, 1500, 10, 500, 'ms'],
      ['deltaMs', 'Intervalo actual', 20, 1200, 10, 90, 'ms'],
      ['objetivo', 'Liberación que quieres sostener', .02, .3, .01, .18, ''],
      ['incertidumbre', 'Incertidumbre de los parámetros', 0, 40, 1, 20, '%'],
    ],
    accion: 'Aplicar intervalo certificado',
    pasos: [['El impulso llega', 'Una fracción u de las vesículas disponibles libera su contenido.'], ['La reserva se repone', 'La recuperación tarda τ. Repetir demasiado pronto reduce la respuesta.'], ['El modelo resuelve', 'Calcula cuánto esperar para sostener el objetivo en el caso más desfavorable del intervalo declarado.']],
    ecuacion: 'rₙ₊₁ = 1 − [1 − (1 − u)rₙ] e⁻Δ/τ<br>q∞ = u(1 − a) / [1 − (1 − u)a], &nbsp; a = e⁻Δ/τ',
    prueba: 'El mapa de una reserva a la siguiente tiene pendiente (1 − u)a, entre cero y uno: converge a un único equilibrio. Igualar q∞ al objetivo q y despejar da Δmín = τ ln{[u − (1 − u)q]/(u − q)}. Si q ≥ u, ningún intervalo finito alcanza ese objetivo. La respuesta estacionaria aumenta con u y disminuye con τ: dentro de una caja de incertidumbre basta resolver en u mínimo y τ máximo.',
    supuestos: 'Una reserva normalizada, recuperación exponencial y liberación instantánea. u y r son fracciones adimensionales; τ y Δ se miden en ms. Se omiten facilitación, tipos de vesícula, ruido de liberación y cambios de calcio. El intervalo calculado es una propiedad del modelo, no un protocolo para estimular un cerebro.',
    fuentes: [['Tsodyks y Markram · modelo de depresión sináptica, 1997', 'https://www.pnas.org/doi/10.1073/pnas.94.2.719'], ['Estudio experimental de intervalos y recuperación, 2018', 'https://www.nature.com/articles/s41598-018-31996-0']],
  },
  {
    id: 'dopamina', numero: '02', nombre: 'Lo que tarda una señal', palabra: 'desaparecer.',
    pregunta: 'Acotar la velocidad de eliminación de dopamina cuando las mediciones tienen error.',
    breve: 'Los transportadores recogen neurotransmisor del espacio extracelular. Su capacidad es limitada: una concentración alta no desaparece con una velocidad proporcional ilimitada.',
    resultado: 'Tiempo exacto en un modelo saturable y región de parámetros compatibles con medidas inciertas. El cálculo conserva varias respuestas posibles cuando los datos no distinguen una sola.',
    visual: 'Dopamina C₈H₁₁NO₂: conformero computacional de PubChem, CID 681. Enlaces y coordenadas proceden del registro; radios y colores facilitan la lectura. No es una estructura experimental. Los transportadores de fondo son esquemas geométricos, sin estructura proteica ajustada.',
    vinculo: 'La dopamina participa en circuitos de aprendizaje, motivación y control del movimiento. Su concentración aislada no determina felicidad, personalidad ni un diagnóstico. Aquí estudiamos su eliminación en un compartimento idealizado.',
    controles: [
      ['c0', 'Concentración inicial', .5, 3, .05, 1, 'μM'],
      ['km', 'Concentración de semisaturación K', .05, .6, .01, .2, 'μM'],
      ['vmax', 'Capacidad máxima V', .001, .008, .0001, .004, 'μM/ms'],
      ['objetivo', 'Concentración objetivo', .02, .3, .01, .1, 'μM'],
      ['plazoMs', 'Plazo del problema inverso', 100, 1000, 10, 300, 'ms'],
      ['incertidumbre', 'Error de lectura · ± % de C₀', 1, 30, 1, 10, '%'],
    ],
    accion: 'Aplicar capacidad calculada',
    pasos: [['Una señal se libera', 'El experimento comienza con una concentración C₀ conocida.'], ['Los transportadores trabajan', 'V limita la capacidad y K indica la concentración a la que se usa la mitad.'], ['Los datos dejan una región', 'Cada lectura con error impone dos fronteras. Su intersección muestra qué valores de K y V todavía explican todas las observaciones.']],
    ecuacion: 'dC/dt = −VC/(K + C)<br>Vt = C₀ − C + K ln(C₀/C)',
    prueba: 'Separar variables e integrar produce la segunda ecuación. Su lado derecho disminuye estrictamente al aumentar C, de modo que una lectura C(t) ∈ [L,U] equivale exactamente a C₀ − U + K ln(C₀/U) ≤ Vt ≤ C₀ − L + K ln(C₀/L). Cuando L > 0 son dos semiplanos en (K,V). Si L = 0 se omite la cota superior; si U = 0 con C₀ > 0, la lectura es imposible a tiempo finito. La intersección de todas las lecturas con los rangos admitidos es una región factible certificada bajo los supuestos. Un polígono vacío señala incompatibilidad; no autoriza a escoger un ajuste y ocultarla.',
    supuestos: 'Compartimento bien mezclado, C₀ exacta, V y K constantes, ausencia de nueva liberación y límites de error conocidos. C y K en μM; V en μM/ms; t en ms. Las lecturas de esta interfaz son sintéticas y se generan con los controles. No incorporan difusión, respuesta del electrodo, metabolismo ni datos de personas.',
    fuentes: [['Medición y respuesta temporal de voltametría, 2012', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3375060/'], ['Antecedente: identificación bioquímica con incertidumbre acotada, 2010', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2898671/'], ['PubChem · dopamina, CID 681', 'https://pubchem.ncbi.nlm.nih.gov/compound/681']],
  },
  {
    id: 'memoria', numero: '03', nombre: 'La estabilidad de una huella', palabra: 'recordar.',
    pregunta: 'Determinar qué equilibrio entre excitación e inhibición permite que una perturbación transitoria decaiga sin inestabilidad.',
    breve: 'Una conexión recurrente devuelve actividad al circuito. Esa realimentación prolonga una señal; el balance con la inhibición determina si la perturbación decae o crece.',
    resultado: 'Frontera exacta de estabilidad de dos poblaciones y una condición que resiste incertidumbre en sus parámetros. También detecta casos que aumentar la inhibición no puede estabilizar.',
    visual: 'Red explicativa de poblaciones excitatorias e inhibitorias. Las ramificaciones son geometría procedural; no reproducen un conectoma ni neuronas reconstruidas de una persona.',
    vinculo: 'Mantener actividad después de un estímulo es un mecanismo estudiado en memoria de trabajo. La perturbación del circuito estable finalmente desaparece: esta linealización no modela memoria persistente, recuerdos autobiográficos ni una explicación completa de la mente.',
    controles: [
      ['w', 'Realimentación excitatoria w', .2, 3, .05, 1.2, ''],
      ['g', 'Inhibición de retorno g', .05, 3, .05, 1, ''],
      ['h', 'Acoplamiento hacia inhibición h', .2, 2, .05, .8, ''],
      ['tauEMs', 'Tiempo de respuesta excitatoria', 5, 60, 1, 20, 'ms'],
      ['tauIMs', 'Tiempo de respuesta inhibitoria', 5, 60, 1, 10, 'ms'],
      ['incertidumbre', 'Incertidumbre de los parámetros', 0, 35, 1, 20, '%'],
    ],
    accion: 'Aplicar inhibición calculada',
    pasos: [['La red recibe un impulso', 'E e I describen desviaciones pequeñas alrededor de una actividad de referencia.'], ['La señal circula', 'w refuerza E; g transmite el freno de I hacia E; h activa I desde E.'], ['Se comprueba la frontera', 'Los autovalores deben tener parte real negativa. Si falla la condición de traza, aumentar g no basta.']],
    ecuacion: 'τE dE/dt = (w − 1)E − gI<br>τI dI/dt = hE − I<br>Estabilidad estricta: w &lt; mín(1 + τE/τI, 1 + gh)',
    prueba: 'Para una matriz real de dos dimensiones, ambos autovalores tienen parte real negativa exactamente cuando la traza es negativa y el determinante positivo. Aquí tr(A) = (w − 1)/τE − 1/τI y det(A) = (1 − w + gh)/(τEτI). Despejar las dos desigualdades produce la frontera. Bajo intervalos independientes, el caso restrictivo usa w máximo, h mínimo y el menor cociente τE/τI. La igualdad es una frontera marginal y no acredita estabilidad estricta.',
    supuestos: 'Linealización de dos poblaciones próximas a un equilibrio, parámetros constantes y sin retardos. E e I son desviaciones adimensionales y pueden ser negativas; no son tasas de disparo negativas. La incertidumbre declarada afecta a w, h, τE y τI; g se considera exacta. Los tiempos se expresan en ms. Una divergencia indica que el modelo lineal abandona su región útil, no una predicción clínica.',
    fuentes: [['Wilson y Cowan · dinámica de poblaciones, 1972', 'https://pubmed.ncbi.nlm.nih.gov/4332108/'], ['Homeostasis y control de bifurcaciones en Wilson–Cowan, 2025', 'https://doi.org/10.1371/journal.pcbi.1012723']],
  },
];

const enlaceFuentes = (estudio) => estudio.fuentes.map(([texto,url]) => `<p><a href="${url}" target="_blank" rel="noopener">${esc(texto)} ↗</a></p>`).join('');
const navegacionEstudios = (actual = '') => `<nav class="neuro-rutas" aria-label="Estudios de neurociencia"><a href="/ciencia/"${!actual ? ' aria-current="page"' : ''}>Cuaderno</a>${ESTUDIOS_NEURO.map(e=>`<a href="/ciencia/${e.id}/"${actual===e.id?' aria-current="page"':''}>${e.numero} / ${e.id === 'memoria' ? 'Memoria' : e.id === 'dopamina' ? 'Dopamina' : 'Sinapsis'}</a>`).join('')}</nav>`;
function resultadosEnsayo(id = '') {
 const {sinapsis:s,circuito:c,limpieza:l}=ensayo.resumen;
 const piezas = [
  ['sinapsis','Sostener la liberación',`${s.cumpleAcotado}/${s.total}`,`casos cumplen el objetivo. El intervalo nominal cumple ${s.cumpleNominal}/${s.total}.`,`Δ nominal ${cifra(s.nominalMs)} ms; Δ con incertidumbre ${cifra(s.deltaMinMs)} ms. Rejilla de 21 × 21 parámetros; objetivo ${cifra(s.objetivo)} de la reserva por impulso.`],
  ['dopamina','Conservar la incertidumbre',`${l.prediccionesContenidas}/${l.total}`,`predicciones verdaderas contenidas en los intervalos calculados. Parámetros contenidos: ${l.parametrosContenidos}/${l.total}.`,`Ancho previo ${cifra(l.anchoPrior,6)} μM. Ancho posterior medio ${cifra(l.anchuraPoligono.media,6)} μM; desviación muestral ${cifra(l.anchuraPoligono.desviacionMuestral,6)} μM, n = ${l.total}.`],
  ['memoria','Estabilizar toda la caja',`${c.establesAcotado}/${c.total}`,`combinaciones extremas estables. Con la ganancia nominal: ${c.establesNominal}/${c.total}.`,`g nominal ${cifra(c.gNominal,6)}; g calculada ${cifra(c.gMin,6)}. Ganancias adimensionales; las desigualdades de la demostración cubren también el interior de la caja.`],
 ].filter(p=>!id||p[0]===id);
 return `<section class="neuro-ensayos"><p class="ciencia-kicker">ENSAYO REPRODUCIBLE / PARÁMETROS FIJADOS ANTES DE EJECUTAR</p><h2>Resultados con datos sintéticos.</h2><div class="neuro-ensayos-rejilla">${piezas.map(([,titulo,valor,explicacion,metodo])=>`<article><h3>${titulo}</h3><strong>${valor}</strong><p>${explicacion}</p><p class="neuro-ensayo-metodo">${metodo}</p></article>`).join('')}</div><p class="neuro-ensayo-limite">La rejilla y las simulaciones comprueban la implementación en esos casos. La demostración establece el alcance matemático. Los comparadores nominales muestran el efecto de ignorar incertidumbre; no acreditan superioridad frente a métodos publicados. El protocolo de esta corrida es independiente de los controles del explorador.</p><a href="/activos/resultados-neuro.json" download>Descargar protocolo, casos y resultados · JSON ↓</a></section>`;
}
const visor = (tipo, etiqueta) => `<div class="neuro-visor" data-neuro-laboratorio><div class="neuro-visor-cabecera"><span>${etiqueta}</span><span data-neuro-render-status>Preparando geometría</span></div><canvas id="neuro-visor" tabindex="0" data-modelo-neuro="${tipo}" aria-label="Modelo tridimensional interactivo: ${esc(etiqueta)}"></canvas><div class="neuro-visor-pie"><span>Arrastra o usa las flechas · t = <output data-neuro-tiempo>0 ms</output></span><div><button type="button" data-neuro-vista="reset">Centrar vista</button><button type="button" data-neuro-vista="pausa" aria-pressed="false">Pausar modelo</button></div></div><p class="neuro-respaldo" hidden>La geometría 3D no está disponible en este navegador. El cálculo, las gráficas y la demostración siguen accesibles.</p></div>`;

export function indiceCiencia() {
  return pagina({titulo:'Ciencia · Neurotransmisión y modelos · Jhon Steven Alvarez Ruiz',descripcion:'Tres estudios de neurociencia computacional con geometría 3D, soluciones matemáticas verificables e investigación sobre incertidumbre.',ruta:'/ciencia/',claseCuerpo:'pagina-ciencia',grafo:[persona()],cuerpo:`
<article class="ciencia neuro-indice">
 ${navegacionEstudios()}
 <header class="neuro-portada"><div><p class="ciencia-kicker">NEUROCIENCIA COMPUTACIONAL / CUADERNO ABIERTO</p><h1>La señal<br>deja <em>huella.</em></h1><p class="neuro-intro">Una mente depende de una actividad material compleja. Este cuaderno examina tres piezas: cómo se transmite una señal, cómo desaparece un neurotransmisor y cómo una red regula su actividad tras un estímulo.</p><a class="neuro-enlace" href="#estudios-neuro">Explorar los tres problemas ↓</a></div>${visor('memoria','Materia / circuitos que se comunican')}</header>
 <div class="neuro-alcance"><span>ESTADO DE LA INVESTIGACIÓN</span><p>Construimos soluciones exactas dentro de modelos declarados y comprobamos qué cambia al incluir incertidumbre. La prioridad científica de las propuestas está pendiente de establecer; los antecedentes, las pruebas y los límites forman parte del resultado. Los experimentos de esta página usan datos sintéticos.</p></div>
 <section id="estudios-neuro" class="neuro-catalogo" aria-label="Tres problemas y sus soluciones">${ESTUDIOS_NEURO.map(e=>`<a class="neuro-tarjeta" href="/ciencia/${e.id}/"><div class="neuro-tarjeta-meta"><span>ESTUDIO ${e.numero}</span><span>Modelo 3D ↗</span></div><h2>${e.nombre}</h2><p>${e.pregunta}</p><div class="neuro-tarjeta-solucion"><span>Qué podrás resolver</span><p>${e.resultado}</p></div><span class="neuro-tarjeta-abrir">Abrir experimento <i aria-hidden="true">→</i></span></a>`).join('')}</section>
 ${resultadosEnsayo()}
 <section class="neuro-metodo"><div><p class="ciencia-kicker">DE LA PREGUNTA A LA PRUEBA</p><h2>Que se entienda.<br>Que se pueda comprobar.</h2></div><div><p>Cada estudio comienza con un problema explicado en lenguaje cotidiano. Después puedes cambiar parámetros, observar la geometría y leer una solución calculada en tu navegador. Las curvas muestran magnitudes del modelo; la escena ayuda a interpretar su mecanismo.</p><p>La aportación del proyecto reúne derivaciones, algoritmos de cálculo y certificados de incertidumbre en una implementación reproducible. Una solución del modelo requiere prueba matemática. Afirmar utilidad biológica requiere además datos y comparación experimental.</p><a href="/activos/resultados-neuro.json" download>Descargar resultados reproducibles · JSON ↓</a><a href="https://github.com/SirHegel/sitio/blob/master/docs/neurociencia.md">Leer metodología y antecedentes ↗</a></div></section>
 <a class="neuro-archivo" href="/ciencia/interferencia/"><span>ARCHIVO / ESTUDIO DE INTERFERENCIA</span><h2>Dos estados, una misma sombra.</h2><p>El laboratorio anterior sigue disponible, con el problema inverso y su demostración.</p><span>Volver a la forma de una fase ↗</span></a>
</article>`});
}

export function estudioNeuro(id) {
 const e=ESTUDIOS_NEURO.find(item=>item.id===id);
 if(!e)throw new Error('Estudio de neurociencia desconocido');
 const controles=e.controles.map(([nombre,etiqueta,min,max,step,valor,unidad])=>`<label class="neuro-control" for="neuro-${nombre}"><span>${etiqueta}<output for="neuro-${nombre}" data-neuro-valor="${nombre}">${valor} ${unidad}</output></span><input id="neuro-${nombre}" name="${nombre}" type="range" min="${min}" max="${max}" step="${step}" value="${valor}" data-unidad="${unidad}" disabled><small>${min} — ${max} ${unidad}</small></label>`).join('');
 return pagina({titulo:`${e.nombre} · Ciencia · Jhon Steven Alvarez Ruiz`,descripcion:e.pregunta,ruta:`/ciencia/${id}/`,claseCuerpo:'pagina-ciencia',grafo:[persona()],cuerpo:`
<article class="ciencia neuro-estudio" data-neuro-estudio="${id}">
 ${navegacionEstudios(id)}
 <header class="neuro-estudio-cabecera"><p class="ciencia-kicker">ESTUDIO ${e.numero} / ${e.nombre}</p><h1>La materia de<br><em>${e.palabra}</em></h1><p class="neuro-intro">${e.pregunta}</p></header>
 <section class="neuro-explicacion" aria-label="El problema explicado"><p>${e.breve}</p><p>${e.vinculo}</p></section>
 <section class="neuro-experimento" aria-label="Modelo y parámetros">${visor(id,e.nombre)}<form data-neuro-form class="neuro-formulario"><div class="neuro-formulario-titulo"><span>INTERVENIR EL MODELO</span><span>Parámetros ilustrativos</span></div>${controles}<div class="neuro-formulario-acciones"><button type="button" data-neuro-resolver disabled>${e.accion} ↗</button><button type="reset" disabled>Restablecer</button></div><p class="neuro-formulario-nota">Cada ciclo de animación reinicia la misma respuesta y amplía su tiempo. El cálculo se actualiza al mover un control. Un valor sin solución finita se indica explícitamente.</p></form></section>
 <p class="neuro-procedencia">${e.visual}</p>
 <section class="neuro-resultados" aria-labelledby="neuro-resultado-titulo"><div class="neuro-seccion-cabecera"><p class="ciencia-kicker">SOLUCIÓN CALCULADA</p><h2 id="neuro-resultado-titulo">Lo que permite afirmar<br>este experimento.</h2></div><div data-neuro-resultados class="neuro-resultados-cifras"><p>Activa JavaScript para calcular el estado. Las ecuaciones y la demostración se pueden leer sin él.</p></div><p data-neuro-conclusion class="neuro-conclusion" role="status" aria-live="polite"></p></section>
 <section class="neuro-graficas"><div class="neuro-grafica"><h3 data-neuro-grafica-titulo>Respuesta del modelo</h3><div data-neuro-grafica></div><p>Tiempo del modelo en milisegundos. Datos sintéticos calculados a partir de los parámetros elegidos.</p></div>${id==='dopamina'?'<div class="neuro-grafica"><h3>Parámetros compatibles con las lecturas</h3><div data-neuro-region></div><p>El área conserva incertidumbre. Un punto ajustado a las lecturas centrales no demuestra que los parámetros sean únicos.</p></div>':''}</section>
 <section class="neuro-pasos" aria-label="Cómo funciona">${e.pasos.map(([titulo,texto],i)=>`<div><span>0${i+1}</span><h3>${titulo}</h3><p>${texto}</p></div>`).join('')}</section>
 ${resultadosEnsayo(id)}
 <section class="neuro-cuaderno"><div><p class="ciencia-kicker">ABRIR EL RAZONAMIENTO</p><h2>La prueba<br>acompaña la imagen.</h2><p>Solución matemática bajo supuestos explícitos. Investigación computacional sin validación experimental ni prioridad científica establecida.</p><button type="button" data-neuro-descargar disabled>Descargar estado y curvas · CSV ↓</button><a href="/activos/modelos-neuro.js" download>Código de los modelos · JavaScript ↓</a><a href="/activos/resultados-neuro.json" download>Corrida reproducible · JSON ↓</a></div><div>
 <details open><summary>01 / Ecuaciones y demostración</summary><div class="ciencia-nota"><div class="ciencia-ecuacion">${e.ecuacion}</div><p>${e.prueba}</p></div></details>
 <details><summary>02 / Qué representa y qué queda fuera</summary><div class="ciencia-nota"><p>${e.supuestos}</p><p>Error físico: σ = desconocida; no hay una medición biológica usada para validar este simulador. La incertidumbre que manipulas está declarada dentro del problema matemático y no sustituye esa medición.</p></div></details>
 <details><summary>03 / Qué construimos y cómo se verifica</summary><div class="ciencia-nota"><p>Implementación original de los cálculos, geometría 3D procedural, controles accesibles, gráficas y exportación. El módulo matemático es independiente del dibujo para poder probarlo sin navegador.</p><p>Las pruebas comprueban dominios, límites, casos degenerados y concordancia entre solución y simulación. El protocolo de investigación conserva parámetros, líneas base, errores y resultados, incluidos los casos que no admiten una solución.</p><p>Las evaluaciones recorren N muestras en tiempo y memoria O(N). La inversión vesicular y las condiciones de estabilidad tienen costo O(1). La depuración resuelve una ecuación monótona con bisección; la región factible recorta un polígono por cada lectura.</p><p><a href="https://github.com/SirHegel/sitio/blob/master/docs/neurociencia.md">Leer métricas, umbrales y reproducción completa ↗</a></p></div></details>
 <details><summary>04 / Antecedentes y trabajo pendiente</summary><div class="ciencia-nota">${enlaceFuentes(e)}<p>Los modelos y las familias de métodos tienen antecedentes. La combinación implementada aquí es una propuesta de investigación: falta establecer una mejora frente a métodos publicados con el mismo problema, comparar datos instrumentales y someter los resultados a revisión independiente. Una búsqueda sin coincidencias no demuestra novedad. El cálculo usa Float64 sin redondeo dirigido. El polígono de depuración admite una holgura de 10⁻¹² μM; estos resultados no constituyen una certificación formal de aritmética de intervalos.</p></div></details>
 </div></section>
 <footer class="ciencia-cierre"><span>ESTUDIO ${e.numero} / CUADERNO ABIERTO</span><p>Medir la señal.<br>Discutir la prueba.</p><a href="/ciencia/">Explorar los otros estudios ↗</a></footer>
</article>`});
}
