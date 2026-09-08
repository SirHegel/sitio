# Estado de proyectos

## Portafolio público

Corte: 28 de agosto de 2026. Objetivo: cobertura `C = fichas publicadas / repositorios públicos propios`. Base anterior: `21/22 = 0,9545`. Umbral: `C = 1`. Estado verificado en producción: `22/22 = 1`. El artículo, la página de contribuciones y el repositorio nuevo respondieron HTTP 200; la ruta antigua de `before-you-contribute` respondió 308 hacia el nombre vigente.

La sincronización recoge inventario Git, README saneado, releases, PR externas, logros visibles y métricas fijadas a revisión. Costo observado: 92 solicitudes API; complejidad `O(R + F + P)`.

## Artículo de política de drogas

Objetivo: publicar un análisis con una métrica territorial, base oficial, umbral anterior a la siguiente medición, error declarado, sanidad y costo. Estado: publicado con 2.685 palabras en la categoría Análisis.

## Rediseño cinematográfico y auditoría, 6 de septiembre de 2026

La portada prioriza identidad y acceso a proyectos antes del retrato. En Chrome
a 390 px, la cabecera pasó de 191,8 a 65 px y el inicio de los botones de 1.072,8
a 417 px. Son observaciones puntuales del navegador local; dispersión no medida.
La prueba responsive mide trece anchos entre 280 y 1.440 px y exige cero
desbordamientos. Las pruebas del movimiento cubren pausa, preferencia reducida,
navegación persistente y lectura sin JavaScript.

El build genera 44 páginas. El artículo de oro permanece publicado, con dos
contestaciones administrativas registradas y cero respuestas de fondo. El plazo
de cinco días hábiles terminó; el seguimiento documental sigue abierto.

El runtime de auditoría registra cada navegación que alcanza su API, cifra la
IP y conserva atribución de canal permitida. Una visita anterior al cambio no
permite recuperar la IP descartada. Los fallos de red, bloqueadores y cuotas
limitan la cobertura. El procesamiento de fondo cuesta O(P), P ≤ 45 partículas,
con techo de 30 cuadros por segundo y pausa en pestañas ocultas.

## Segunda dirección cinematográfica, 6 de septiembre de 2026

Se inspeccionaron los dos vídeos solicitados y se reemplazó el fondo anterior
con tres escenografías originales. El motor aplica profundidad aparente 2.5D,
cámara de 1,8 s y barrido de navegación de 920 ms. Esta iteración suspendía la
portada fuera de pantalla; la ampliación posterior retira ese límite.

Verificación local: 79/79 pruebas, cero omisiones; duración 169,7 s. La batería
responsive recorre el sitemap en trece anchos de 280 a 1.440 px. Axe no detectó
infracciones WCAG A/AA en inicio a 320/390/1.440 px ni blog a 390/1.440 px.
La auditoría estática aprobó 93 archivos, cero hallazgos privados. Cada imagen
WebP pesa menos de 200.000 bytes. Son resultados de Chrome automatizado;
Safari físico y dispositivos Android/iOS físicos siguen sin medición.

Se corrigió también el montaje del mapa al entrar desde el blog: dos pruebas
reproducen navegación, descarga tardía, desmontaje y regreso. La regresión de
entrada falló antes del arreglo y pasó después. Las capturas internas WebGL
no se usan para inferir pausa: su framebuffer puede descartarse sin dibujar;
las pruebas cuentan llamadas reales a la GPU.

## Movimiento integral, 6 de septiembre de 2026

El nuevo encargo extiende los fondos animados a todo el recorrido público,
incluidos contenido de inicio y pie. Se mantienen pausa, reducción de movimiento
y respaldo sin WebGL. Se añaden lluvia, haces móviles, deriva de cámara,
decoraciones por sección e interacción limitada en tarjetas y fotografías.
La regresión del fondo detenido después del hero falló antes del cambio.
Modelo y presupuestos en `memoria/movimiento-integral-20260906.md`.

## Entrada elegida y sala interactiva, 6 de septiembre de 2026

Se recupera la primera elección de música o silencio. El autor confirmó
Beethoven, Quinta Sinfonía. La apertura utiliza un portal original con torsión
en profundidad; una nueva sección incorpora telones, muebles y lámpara como
geometría independiente. Se mantienen fotografías globales y lectura estable.
Modelo, referencias, prompt y comprobaciones en `memoria/entrada-y-sala-20260906.md`.

## Sala de juegos, 6 de septiembre de 2026

El catálogo incorpora Neiva Abierta y Bloquitos en `/juegos/`, con acceso
desde portada y navegación global. Modelo: `C = juegos enlazados / juegos
solicitados`; base del catálogo anterior `0/2`, umbral `C = 1`, resultado
local `2/2`. Esta métrica mide acceso desde el sitio; no certifica el alcance
de la ciudad ni el rendimiento de los juegos.

Verificación local: build de 45 páginas y 95/95 pruebas integrales aprobadas,
sin omisiones, en 157,5 segundos. La matriz responsive recorrió 44 rutas
públicas en trece anchos entre 280 y 1.440 px: 572 combinaciones, cero
desbordamientos.
La prueba de navegación usa 320, 390, 960 y 1.440 px; exige continuidad del
documento al entrar, escena correcta y objetivos táctiles de al menos 44 px.
Las capturas locales de 320, 390 y 1.440 px no registran desbordamiento del
documento. Axe WCAG 2/2.1 A/AA no detectó infracciones en esos tres anchos.
`σ = desconocida`: Chrome automatizado, sin dispositivos físicos.
Sanidad: sin JavaScript permanecen ambos enlaces y la navegación.

El render del catálogo cuesta `O(J)` tiempo y espacio, `J = 2` juegos; el arte
CSS es estático. Se reutilizan las dependencias del sitio. Las horas humanas
y costo en pesos siguen en los pendientes generales. La publicación debe
verificarse sobre la revisión final.

Neiva Abierta quedó publicado en `https://neiva-abierta.vercel.app/` y
el código abierto en `https://github.com/SirHegel/neiva-abierta`. El juego
combina 6.137 tramos OSM y 35.875 huellas OSM/Overture con alturas y fachadas
interpretadas. Se comprobaron 17 pruebas de datos/física, caminar, conducir,
salir del carro, contactar el estudio y controles táctiles a 320/390 px.
El proyecto Unreal está incluido como fuente sin compilar; el visor oficial
de Google consultado no marca cobertura fotogramétrica de Neiva.

## Captura de Neiva Abierta, 6 de septiembre de 2026

La tarjeta de Neiva muestra una captura del juego con la recreación de la
Catedral, edificios y árboles. Se copió `preview.webp` del repositorio del
juego a `activos/neiva-abierta.webp`: 1.440 × 960 px, 319.058 bytes,
SHA-256 `693f2e6990f5aea69e964647740d1e641e6798f7a24dfc2196370f90286f6c10`.
El rótulo identifica la captura; la descripción conserva el carácter
interpretado de las fachadas y las alturas ausentes.

Modelo: `C = tarjetas de Neiva con captura real / tarjetas de Neiva`.
Base previa `0/1`; umbral fijado antes de probar `C = 1`; resultado `1/1`.
Sanidad: la prueba detectó la imagen ausente antes de incorporarla y después
verificó su formato WebP en el sitio construido. Bloquitos conserva su
ilustración. La decodificación cuesta `O(P)` tiempo y espacio para
`P = 1.382.400` píxeles; no se añaden dependencias de ejecución.

Build de 45 páginas y 95/95 pruebas aprobadas en 160,7 segundos, sin omisiones.
La matriz recorrió 44 rutas en trece anchos: 572 combinaciones sin
desbordamientos. La navegación desde inicio por el menú cargó la captura
a 320, 390, 960 y 1.440 px; cuatro casos sin errores JavaScript, HTTP,
consola ni infracciones WCAG 2/2.1 A/AA detectadas por axe.
`σ = desconocida`: Chrome headless local, sin medición en dispositivos físicos.

## Captura del centro revisado, 7 de septiembre de 2026

La tarjeta usa ahora una captura directa de Neiva Abierta 0.3: el personaje
en el Parque Santander, con Catedral, hotel y fuente en el encuadre. Proviene
del canvas del juego, después de caminar por el parque; conversión de PNG a
WebP con calidad 90, sin retoque ni recorte. Resolución: 1.440 × 960 px;
319.616 bytes; SHA-256
`a581e0aabaf9145611d0d33223aabb0f2842e7d8b6495e58899ca52877f3c27f`.
El texto alternativo identifica personaje, parque, Catedral y fuente.

Modelo: `C = capturas de la versión actual / tarjetas de Neiva`; base `0/1`,
umbral fijado antes de probar `C = 1`; resultado `1/1`. Sanidad: ambas copias
tienen la misma huella y el navegador carga las dimensiones declaradas.
La prueba de navegación usa 320, 390, 960 y 1.440 px; umbral: cero
desbordamientos y cero errores JavaScript/HTTP. Decodificación `O(P)` tiempo
y espacio, `P = 1.382.400` píxeles. `σ = desconocida`: no se mide rendimiento
en dispositivos físicos. Esta captura conserva la arquitectura interpretada
del juego; no acredita un levantamiento completo de la ciudad.

Build de 46 páginas tras integrar la sincronización pública de GitHub y tres
pruebas pertinentes aprobadas:
catálogo estático, acceso sin JavaScript y navegación hacia Juegos. Los cuatro
anchos del control local cumplieron los umbrales; axe WCAG 2/2.1 A/AA no
detectó infracciones. La imagen construida coincide con el SHA del juego.

## Ficha de Neiva 0.4, revisión del 7 de septiembre de 2026

La preparación editorial actualiza la tarjeta de `/juegos/` y da a
`/proyectos/neiva-abierta/` una ficha propia. Describe la conducción, las
paradas de observación y el inspector de edificios; documenta las 22 cubiertas
abiertas de OSM, incluidas 14 de gasolineras. Mantiene separadas las dimensiones
de una huella del mapa y las dimensiones físicas sin medición de campo.

La evidencia enlaza la revisión publicada del juego
`5fd5188fb125309eae3f0b76af3e4755948d07d6`. La tarjeta incorpora su captura
en calidad Alta, 1.440 × 960 px y 223.406 bytes; SHA-256
`34b77ce574aeb271864e53f9ac01e3bd358964ef6b4ecba1542f7f20e0c372d5`.
Se copia el WebP original, sin retoque. El texto alternativo indica la versión,
el ajuste de calidad y los elementos visibles.

Modelo: `C = superficies editoriales actualizadas / 2` —tarjeta y ficha—;
base `0/2`, umbral previo a la comprobación `C = 1`, resultado local `2/2`.
El build produjo 46 páginas. Pasaron 19 regresiones del sitio y una prueba
de navegación hacia Juegos en cuatro anchos. La revisión adicional de tarjeta
y ficha cubrió 320, 390, 960 y 1.440 px: ocho combinaciones, cero desbordamientos,
cero errores JavaScript/HTTP de recursos públicos y cero infracciones
WCAG 2/2.1 A/AA detectadas por axe. El servidor local simuló las respuestas de
analítica y `/api/visita/`; esos servicios requieren verificación en producción.
Sanidad: Bloquitos conserva su registro, arte y enlaces; el snapshot automático
GitHub y las fuentes firmadas de la hoja de vida no se modifican.
`σ = desconocida`: estos controles de Chrome no miden la fluidez del juego.
La ficha es contenido estático; su generación cuesta O(T) tiempo y espacio
para T caracteres de salida, sin nuevas dependencias de ejecución.

El código de la ficha está en `neiva-abierta.js`, separado de `datos.js` para
evitar alterar el perfil y la huella documental de la hoja de vida. Las
secciones de auditoría conservan fuente, métrica con denominador, error,
sanidad, costo y pendientes. Se enlaza la medición publicada del Intel UHD;
permanecen pendientes otros computadores y celulares físicos. La ficha no
extrapola ese resultado a todos los equipos.

## Entrega nativa de Neiva, 7 de septiembre de 2026

El encargo actual concentra Neiva Abierta en Unreal Engine. La tarjeta y la
ficha muestran «Descarga Unreal pendiente de compilación»: todavía no hay un
ejecutable nativo publicado. La captura existente se conserva, identificada
como prototipo web anterior Three.js 0.4, y su SHA no cambia. La evidencia del
prototipo anterior no se presenta como ejecución o rendimiento de Unreal.

El contrato de descarga en `descarga-neiva.js` conserva URL, SHA-256, tamaño,
plataforma y comprobante en `null`. El enlace descargable exige un activo de
una release del repositorio y un comprobante coincidente de descarga HTTP 200
y ejecución aprobada. El validador comprueba esos campos; la descarga y prueba
del ejecutable deberán realizarse antes de completarlos. Los valores positivos
de las pruebas son fixtures sintéticos, no releases existentes.

Modelo de esta corrección: `C = superficies con estado nativo explícito / 2`.
Base editorial anterior `0/2`, umbral fijado antes de probar `C = 1`, resultado
local `2/2`; cero botones de descarga sin archivo validado. Build: 46 páginas.
Pasaron 22 pruebas de sitio/contrato y la navegación a Juegos en cuatro anchos.
QA local de tarjeta y ficha: 320, 390, 960 y 1.440 px, ocho combinaciones con
cero desbordamientos, errores JS/HTTP e infracciones axe WCAG A/AA detectadas.
Como en la revisión anterior, el servidor local simula los dos endpoints de
analítica; la versión pública se verifica tras desplegar.

Sanidad: sin artefacto no se produce un enlace de descarga; una huella o tamaño
que difieran del comprobante tampoco lo habilitan. Bloquitos y el archivo de
captura se conservan. `σ = desconocida`: QA de navegador automatizado, sin
ejecución del juego Unreal. Validar el contrato cuesta O(L), L ≤ 1.024 caracteres
de URL; se reutilizan las dependencias actuales del sitio.

## Partida Unreal comprobada, preparación del 7 de septiembre de 2026

La revisión posterior sustituye el estado de motor pendiente. La evidencia
publicada `2a4fcd22615bb950c26fb1091f8d25f75775699d` acredita Unreal 5.5.4,
compilación/importación y partida de desarrollo con vídeo VP8 real. La ficha
separa ese resultado del paquete Linux, todavía en construcción. Los cinco
campos descargables permanecen nulos en `datos/descarga-neiva.json`.

La tarjeta usa el PNG original `before.png` de game05: 1.280 × 720 píxeles,
1.110.181 bytes, SHA-256
`baba20e94b73d7147ed0e40a9ce838ea2d23c88afced71535f4c0aea686c7089`.
La ficha incorpora además `car-drive.png`: mismas dimensiones, 1.248.177 bytes,
SHA-256 `3d098626883e0980ace837e7f95a4966f281908cb65db61ddfa18db8ad59458b`.
No se retocan los píxeles: aviso de sombras y defectos visibles permanecen.
La captura definitiva del paquete reemplazará estas imágenes al validar la entrega.

Modelo editorial: C = superficies que describen el estado nativo real / 2,
tarjeta y ficha. Base previa 0/2; umbral C = 1; comprobación local 2/2.
Umbral del contrato: cero enlaces de descarga sin comprobante coincidente.
Build de 46 páginas; 25 pruebas de contenido/contrato/preparador aprobadas y
dos controles de navegador para navegación y lectura sin JavaScript. La
navegación hacia Juegos cubre 320, 390, 960 y 1.440 px. La QA adicional de
ficha y catálogo cubre ocho combinaciones en esos anchos: cero desbordamientos,
errores JavaScript/HTTP e infracciones axe WCAG A/AA detectadas. Los endpoints
locales de analítica se simulan; producción debe verificarse después del despliegue.

Sanidad: recibo ausente, tamaño distinto, archivo alterado o ejecución no
aprobada conservan la descarga desactivada. El preparador no modifica fuentes
sin `--aplicar`. Los comprobantes de pruebas son sintéticos. SHA del archivo
se calcula en flujo: O(N) tiempo y memoria acotada por el stream para N bytes.
La decodificación de dos imágenes usa O(P) tiempo y espacio, P = 1.843.200 píxeles.
`σ = desconocida`: Chrome automatizado; sin medición de equipos físicos.
Esta preparación no está desplegada. La activación final requiere el archivo
publicado y descargado de nuevo, su ejecución probada y redacción orientada
al jugador con controles, requisitos, vídeo y alcance aproximado.

## Alfa Unreal 0.2, preparación del 8 de septiembre de 2026

La ficha y la tarjeta describen personaje sin nombre, conducción, colores de
ropa y vegetación del parque; mantienen las fachadas y alturas como
aproximaciones. Bloquitos conserva su arte y sus enlaces. La preparación
inicial mantuvo el contrato nulo hasta comprobar el nuevo paquete.

Después se activó el contrato local con `--aplicar`, cotejando los
741.359.235 bytes del archivo público descargado y SHA-256
`2fd09f22b18a790f44876a5b87ae1a0e50d517c17853c1df831d0fd8821d7c5d`.
El recibo confirma HTTP 200 y ejecución aprobada. Ficha y Juegos dicen «Alfa
0.2 para Linux». Se incorporó la captura final PNG 1.920 × 1.080 del paquete
descargado, sin retoques. La evidencia queda fijada al commit
`247e28ae25e243eaa9700dfd1f1bd525c93e6239`. El vídeo final aprobado se copió
exacto: VP8 1.920 × 1.080, 17,206 segundos, 529 cuadros y 18.486.318 bytes.
Tras incorporarlo, el build generó 46 páginas; pasaron 26 pruebas de
contenido/contrato/preparador, dos de navegador y la revisión responsive de
ambas páginas a 320/390/960/1.440 px. Cero desbordamientos, errores JS/HTTP e
infracciones axe WCAG A/AA. El reproductor decodificó el vídeo en cada ancho.
La batería completa posterior pasó 102 pruebas, incluida la geometría de las
45 rutas públicas en 13 anchos entre 280 y 1.440 px. El remoto se incorporó
mediante fast-forward antes de esa corrida.

Modelo: C = superficies revisadas / 2; base 0/2, umbral C = 1; resultado 2/2.
Build local de 46 páginas; 25 pruebas de contenido/contrato/preparador y dos
de navegador aprobadas. La QA adicional cubrió ficha y Juegos a 320, 390, 960
y 1.440 px: ocho combinaciones, cero desbordamientos, errores JS/HTTP e
infracciones axe WCAG A/AA. El control del vídeo inició la decodificación VP8
en los cuatro anchos. Se usaron medios de desarrollo sólo durante esas pruebas
y se retiraron las copias del directorio publicable después.

Sanidad: no se habilita un botón por mostrar una partida ni por existir la
release anterior. La generación de ambas plantillas cuesta O(T), T caracteres
emitidos; no hay nuevas dependencias. `σ = desconocida`: Chrome automatizado,
sin dispositivos físicos; la analítica local se simuló. Ningún commit, push
o despliegue se ejecutó en esta preparación.
