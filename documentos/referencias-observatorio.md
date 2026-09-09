# Referencias audiovisuales del observatorio

Revisión: 8 de septiembre de 2026. La dirección propuesta conserva una sala reconocible durante todo el recorrido: profundidad real, objetos que responden al visitante y experimentos que explican su modelo. El vínculo con *Twin Peaks* procede del encargo del autor. Los vídeos aportan recursos de composición y divulgación; ninguno acredita una escena de Blender ni el rendimiento de una web en el dispositivo del visitante.

## Fuentes y alcance de la inspección

Se recuperaron los dos vídeos públicos mediante los metadatos de FxTwitter y sus archivos de `video.twimg.com`, después del bloqueo de acceso directo a X. Se descargaron copias de análisis a `/tmp/xreferences/`; el sitio no incorpora metraje ni capturas de terceros.

| Referencia | Fuente original | Copia examinada, medida con `ffprobe` |
|---|---|---|
| Tutorial de diseño, compartido por Alex | [Publicación aportada](https://x.com/alextalksai/status/2096311625363894355), [publicación original de Viktor Oddy](https://x.com/viktoroddy/status/2096237489828827555), [metadatos recuperados](https://api.fxtwitter.com/alextalksai/status/2096311625363894355) | 611,196 s; 1108 × 720 px; 30 cuadros/s |
| Divulgación cuántica de Kyutaro | [Publicación aportada](https://x.com/kyutaro15/status/2096045534440210587), [metadatos recuperados](https://api.fxtwitter.com/kyutaro15/status/2096045534440210587) | 397,061 s; 1280 × 720 px; 24 cuadros/s |

La revisión visual recorrió la duración completa mediante hojas de contacto: una muestra cada 15 s del tutorial y cada 10 s del vídeo cuántico. Se ampliaron fotogramas puntuales y cuatro intervalos a una muestra por segundo: tutorial 02:45–03:14 y 08:05–08:34; cuántica 01:52–02:21 y 02:58–03:27. Esta metodología permite identificar composición, secuencia y cambios visibles. No equivale a inspeccionar cada fotograma, escuchar íntegramente el audio, transcribir el japonés ni auditar el código de las referencias. Los tiempos de las tablas identifican ventanas observadas; la precisión del muestreo fino es de un segundo.

La frecuencia de codificación del vídeo tampoco mide la frecuencia de renderizado de la web grabada. `σ_FPS_web = desconocida`: faltan trazas del navegador original y datos del equipo.

Huellas SHA-256 de las copias examinadas:

```text
tutorial.mp4  eda5106518cb7a3d7bc1d682e410a2ff3d86d568f10e4df406a5422ea9448b5c
quantum.mp4   1df1d26aaddd812ad4eeb8ae64b5e8b232c70c2c8aaa207937fdfd378dc9fb9e
```

## Tutorial: observación y adaptación

| Tiempo observado | Qué aparece | Adaptación al portafolio |
|---|---|---|
| 00:00–00:30 | Apertura espacial con profundidad de vórtice; después, ejemplos de sitios en X. | Dar a la entrada un foco espacial claro y una cámara con recorrido corto. |
| 01:00–01:30 | Catálogo de referencias, con una composición planetaria de fondo oscuro y planeta que ocupa buena parte de la pantalla. | Elegir un lenguaje visual estable antes de añadir efectos; reservar una zona de lectura alrededor del objeto principal. |
| 02:45–03:14, inspección a 1 muestra/s | Globo de gran tamaño con borde azul iluminado; su superficie rota mientras el cursor se mueve. La interfaz cambia entre Tierra, Marte y Venus. | Un objeto con volumen, iluminación y respuesta de cámara hace tangible la portada. La adaptación mantiene la misma sala y su identidad durante la navegación. El vídeo no permite identificar con certeza la relación exacta entre arrastre y rotación. |
| 03:30–03:45 | Tarjetas planetarias y regreso al hero. | Integrar los proyectos mediante una jerarquía editorial legible y acceso explícito a sus fichas. |
| 04:00–04:45; ampliación a 05:33 | Búsqueda de vídeo en Pinterest, selección de un túnel de contornos luminosos, interfaz de recorte y posterior adjunto MP4. | El vídeo sirve como referencia de profundidad y ritmo. El encargo actual exige construir objetos y movimiento en el navegador; no se traslada el archivo a un fondo de vídeo. |
| 05:55, fotograma ampliado | El prompt visible pide una página de estudio 3D con animación vinculada al scroll y contenido. | Definir comportamiento de cámara, superficies e interacción en términos observables, con contenido que siga siendo utilizable. |
| 06:00–06:30; 07:30 | Primera composición del estudio: túnel, título editorial y tarjetas con piezas abstractas. | Dar al contenido un peso visual comparable al de la instalación, con controles y llamadas a la acción reconocibles. |
| 08:05–08:23, inspección a 1 muestra/s | El túnel conserva su geometría visual y alterna contornos magenta, cian y naranja. Los capítulos de texto cambian de escala y opacidad en profundidad. | Conservar el espacio durante el scroll y modular cámara y luz con suavidad. Los textos del portafolio mantienen estabilidad suficiente para leer y seleccionar. |
| 08:24–09:30 | Regreso a Pinterest, navegación entre herramientas y publicaciones de ejemplos. | Referencia del proceso de iteración; no demuestra una técnica gráfica adicional. |
| 09:45–10:00 | Nueva presentación de la portada planetaria. | Comprobar la portada aislada, además de verla dentro del entorno de edición. |

La incorporación del MP4 está observada. El material disponible no permite concluir que toda la web final se renderice con ese MP4 ni atribuir su implementación a una biblioteca específica. La apariencia de profundidad por sí sola tampoco demuestra geometría 3D manipulable.

## Cuántica: observación y adaptación

| Tiempo observado | Qué aparece | Adaptación al laboratorio |
|---|---|---|
| 00:00–00:10 | Ondas cian sobre aros finos, con partículas dispersas y fondo oscuro. | Presentar un fenómeno mediante curvas y partículas que se calculen a partir del mismo estado del experimento. |
| 00:20–00:50 | Barrera dorada, partícula y malla ondulatoria a ambos lados; aparece `E < V`. | Hacer visible la geometría del dispositivo y separar parámetros, ecuación y resultado. |
| 01:00–01:20 | Punta sobre una retícula de átomos; luego un corral circular con ondas concéntricas. | Modelar el instrumento y el campo como piezas independientes, con escala visual declarada. |
| 01:30–01:40 | Circuito sobre placa, trazos dorados y punto de luz concentrado. | Usar luz localizada para dirigir la atención a la variable que está cambiando. |
| 01:52–02:10, inspección a 1 muestra/s | Pantalla de doble rendija en un escenario estable; se añaden ondas y detecciones tras la barrera. | Mantener cámara y suelo comunes durante una explicación; animar el mecanismo observado. |
| 02:11–02:21, inspección a 1 muestra/s; vista general hasta 02:30 | El detector acumula puntos y aumenta su contador. Las franjas aparecen al aumentar la muestra; después se ve un patrón distinto. | Relacionar cada punto dibujado con una simulación reproducible. Mostrar número de muestras, hipótesis y error antes de interpretar el patrón. |
| 02:40–02:50 | Estructura molecular de nodos y enlaces junto al aparato de interferencia. | Reutilizar geometría instanciada y una iluminación coherente para modelos de distinta complejidad. |
| 02:58–03:27, inspección a 1 muestra/s | Un imán se eleva sobre un disco; aparecen curvas cian alrededor del imán sin sustituir el escenario. | Usar curvas de campo y movimiento limitado del objeto para explicar una relación física en la misma sala. |
| 03:40–04:00 | Matriz de pequeños vórtices y filamentos sobre el disco. | Representar conjuntos repetidos con geometría compartida y parámetros físicos visibles. |
| 04:10–05:10 | Cilindro translúcido, película que sube por la pared, flujo exterior, fuente y superficie con vórtices. | Dar continuidad material a varios estados de un experimento; la transparencia debe permitir leer los objetos interiores. |
| 05:20–06:10 | Nube que se concentra, superficie con pico y ondas colectivas. | Vincular un control a una transformación visual y a una magnitud calculada; declarar el carácter ilustrativo cuando no exista simulación física completa. |
| 06:20–06:30 | Regreso a ondas y partículas; cierre con créditos y fuentes. | Mantener visible la procedencia de los modelos y el límite entre ilustración, experimento y resultado. |

El vídeo conserva fondo oscuro, suelo azul grisáceo, luz cian/violeta, objetos dorados y una cámara oblicua en buena parte de sus capítulos. Sí hay cortes y fundidos entre explicaciones. La adaptación toma su coherencia visual para una sala continua, conforme al encargo del autor.

## Decisiones para la sala

La traducción de *Twin Peaks* será una dirección de arte original: telón carmesí con pliegues modelados, suelo geométrico, luz cálida lateral y un objeto central extraño. Son decisiones del proyecto derivadas del encargo, no técnicas verificadas en estos vídeos. El laboratorio comparte materiales, tipografía y espacio con la portada. La interacción del ratón modifica cámara, luz o geometría dentro de límites que permitan leer.

La demostración científica necesita ecuaciones, supuestos y una prueba reproducible. Una visualización de una conjetura abierta se rotula como exploración. Cualquier avance afirmado requiere un enunciado preciso y una demostración verificable; los efectos visuales no aportan esa prueba.

La extracción de referencias procesa el vídeo en tiempo `O(F)` respecto al número de fotogramas decodificados y almacenamiento `O(B)` respecto a los bytes de las copias temporales. No se midieron horas humanas ni costo monetario: `TODO(dato)`, registrar tiempo de revisión y costo de herramientas. Esta revisión cualitativa es una línea base; no se fijó un umbral cuantitativo de semejanza antes de inspeccionar el material y no se declara que lo haya superado.
