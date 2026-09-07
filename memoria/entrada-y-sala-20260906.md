# Una elección antes del primer plano

Encargo: recuperar entrada con música o en silencio, hacer del umbral una
transición de profundidad y dar a la sala roja piezas que respondan al visitante.
El autor confirmó la Quinta Sinfonía de Beethoven. Se conserva la grabación
local y su licencia de dominio público; es instrumental y no se añaden letras.

La versión anterior retiraba la puerta por temporizador, sin elección. La
regresión nueva falló sobre esa versión a los 2,16 s: la puerta ya no estaba
visible. La llave de sesión nueva `jsar:entrada-v2` se escribe al elegir;
la marca antigua `jsar:entrado` no equivale al consentimiento de esta entrada.

Referencias inspeccionadas: [portal compartido por alextalksai](https://x.com/alextalksai/status/2096311625363894355),
original [Viktor Oddy](https://x.com/viktoroddy/status/2096237489828827555/video/1),
y [escena del coche compartida por RoundtableSpace](https://x.com/RoundtableSpace/status/2095900946291368295),
original [Viktor Oddy](https://x.com/viktoroddy/status/2095837672690647088).
Se recuperaron vídeos por metadatos públicos; la lectura directa de X devolvía
403. Ningún fotograma se incorpora al sitio. El primero combina portal
rectangular, torsión de nubes y títulos que avanzan hacia cámara. En el segundo
se abren puertas y maletero, aparecen flores y asciende otro panel. La captura
no demuestra si el original utiliza mallas 3D o fotogramas prerenderizados.

## Modelo y límites de entrada

`p = clamp((t - t_elección) / 1800 ms, 0, 1)`. El portal usa una imagen local,
tres planos anidados y torsión UV diferencial; profundidad aparente 2.5D.
El puntero se limita a `[-1,1]` en ambos ejes. El control cuesta `O(1)` por
cuadro y la GPU `O(W·H)`, con memoria `O(W·H + I)`, `I = 1` textura.
Techo: 30 cuadros/s; 360.000 píxeles en software, 700.000 en hardware. El
portal libera recursos antes de iniciar la sala: los dos bucles no coinciden.

Umbrales fijados antes de probar: salida en menos de 3 s; salida inmediata con
movimiento reducido; ambos botones dentro del viewport en los trece anchos
de 280 a 1.440 px; targets de al menos 44 px, desbordamiento ≤2 px por redondeo;
cero reproducciones antes de elegir, cero errores JS/CSP en las pruebas.
Se conserva imagen de respaldo, lectura sin JS y elección estática con
movimiento reducido. La falta de audio o GPU no bloquea la lectura.

La reproducción se solicita dentro del clic, antes de cualquier espera.
`Entrar en silencio` guarda silencio aunque exista una preferencia antigua.
El diálogo nativo aísla el contenido inferior, cierra el ciclo de Tab y
devuelve el foco al contenido al terminar. Escape entra en silencio.

Prueba aislada del portal: SwiftShader, dos CPU, 60 cuadros sincronizados
con lectura del framebuffer: media 16,58 ms, p95 18,20 ms. No es una medición
de dispositivos físicos. Se verificaron orientación, transparencia final,
redimensionamiento, pérdida/restauración y destrucción idempotente.
`σ = desconocida` para Safari y móviles físicos, no disponibles en el entorno.

La entrada aprobó ocho pruebas con dos CPU en 34,68 s. Se corrigió además
el progreso al redimensionar durante el viaje: antes `0,23267 → 0`, después
`0,23111 → 0,23561`. `pageshow` restablece el reloj aunque no llegue
`visibilitychange`; se verificó mediante eventos persistidos simulados, no
mediante una navegación BFCache física. En inicio a 390 y 1.440 px, axe no
detectó infracciones WCAG A/AA ni 2.1AA; errores JS/CSP y overflow: cero.

## Sala interior

La fotografía cinematográfica global se conserva. Inmediatamente después de
la portada aparece una escena interactiva independiente inspirada en la sala
roja de Twin Peaks. El telón tiene mitades de geometría plegada; los sillones,
la mesa, la taza y la lámpara ocupan posiciones tridimensionales. Sus oclusiones
usan profundidad real. El acabado es ilustrado, sin atribuirle fotorealismo.

Posiciones en metros con Y vertical; apertura y lámpara en `[0,1]`, puntero
en `[-1,1]`. La geometría fija ocupa 166.956 bytes: 2.983 vértices únicos,
11.886 esquinas, 3.962 triángulos y una llamada de dibujo. Costo por cuadro
`O(V + P_s)`; memoria `O(V + P_s)`. Se limita el canvas de la sección a
90.000 píxeles en software y 360.000 en hardware. La resolución menor en
software conserva tiempo de CPU para el fondo general simultáneo; no limita
el tamaño ni la nitidez de la tipografía HTML. No se agrega otro rAF.

El contexto nace al entrar la sección en vista; la GPU no dibuja esa sección
fuera de pantalla. Se liberan modelo y contexto al navegar. Los controles
funcionan con clic, teclado y toque. La pausa global conserva el cuadro;
movimiento reducido muestra una composición quieta y permite cambios estáticos.
El respaldo fotográfico móvil usa su variante propia mediante `picture`.

Prueba aislada del renderer antes de reducir el presupuesto: 179.560 píxeles,
sin antialias, SwiftShader con dos CPU, veinte muestras con lectura de
framebuffer: mediana 31,1 ms, p95 31,7 ms. Ese resultado no mide el sitio
completo ni representa los 90.000 píxeles del presupuesto final.

Las tres regresiones integradas de la sala aprobaron con dos CPU en 14,51 s.
Detectaron antes una superposición: en escritorio el dock del fondo ocupaba
el centro del botón del telón; `elementFromPoint` devolvía el mando de escena.
Se llevó la fila de interacción al área media en escritorio y se separó del
borde inferior en móvil. La prueba conserva clic real y comprueba ambos
objetivos antes de actuar. La auditoría estática revisó 101 archivos sin
errores ni hallazgos privados.

Comparación del suavizado con 89.823 píxeles, SwiftShader y dos CPU, veinte
cuadros sincronizados: sin MSAA, mediana 17,0 ms y p95 17,6 ms; con MSAA,
26,6 y 27,1 ms. Se mantiene desactivado por el costo observado al combinar
la sección con el fondo. En software pueden verse bordes escalonados; no se
oculta esa limitación con una afirmación de acabado fotográfico.

La batería local completa aprobó 93 pruebas, cero fallos, cancelaciones u
omisiones, en 150,44 s. Conserva las 43 rutas en trece anchos. La revisión
visual final llevó también la instrucción de la sala junto a sus botones,
fuera de la zona del dock. El pie permite repetir la apertura con
`/?entrada=1`; al elegir se retira únicamente ese parámetro de la URL.

## Activo original

Se utilizó la habilidad imagegen, herramienta integrada, para crear el fondo
del portal. Archivo consumido: `activos/escenas/umbral.webp`, 91.184 bytes,
1.672 × 941 px. El PNG original se conserva en el directorio de imágenes
generadas de Codex; el sitio sirve únicamente su copia WebP local. No se
descargaron imágenes ajenas ni se añadieron servicios externos de ejecución.

Prompt final:

> Use case: stylized-concept. Asset type: original photographic matte painting for an animated WebGL entrance portal on a Spanish cinema personal website. Primary request: a monumental rectangular abyss forming within a swirling storm of volumetric clouds, cinematic futuristic black-hole tunnel leading into a mysterious red theatre. Wide landscape 16:9 composition, straight-on symmetrical perspective with vanishing point at EXACT image center (50% x, 50% y). Main rectangle opening occupies central 32% width and 48% height, profound ink-black void inside; multiple nested fine bronze rectangular frames recede into this darkness, with perspective guiding lines on the four inner surfaces. Sculptural storm clouds in desaturated midnight petrol-blue, pewter and silver rim light billow around the opening, with restrained aged-gold illumination on lower right edges and faint oxblood glow deep within the tunnel. Photorealistic atmospheric depth, detailed soft cloud filaments, nuanced chiaroscuro and filmic grain, luxurious 70mm cinema photography, very controlled highlights, mysterious and elegant not video-game neon. Outer edges dark and hazy to support live ivory editorial type; all typography will be added in HTML. No letters, no formulas, no text, no logos, no UI, no watermark, no people, no spaceship, no planets. The image itself must fill the entire frame edge to edge, no poster border. Keep the center opening distinct with crisp yet atmospheric perspective; clouds are the subject around it.
