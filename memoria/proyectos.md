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
