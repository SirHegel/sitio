# Movimiento durante todo el recorrido

Encargo del 6 de septiembre de 2026: mantener animados todos los fondos y
extender las interacciones al sitio completo. Se conserva la escenografía
original existente; esta revisión trabaja sobre código WebGL, CSS y eventos.
No genera ni descarga imágenes nuevas.

La revisión anterior suspendía el lienzo al salir de la portada y usaba una
superficie opaca detrás del contenido de inicio. La regresión nueva falló antes
del cambio: cero dibujos después de bajar al contenido, corrida de 2,56 s.
Se elimina esa suspensión y se reduce la opacidad de las superficies externas.
Los paneles de lectura conservan contraste; la prosa no gira ni se desplaza
continuamente. La administración permanece excluida de los efectos.

Modelo: `t` es tiempo animado en segundos; `x,y ∈ [-1,1]` representan el
puntero normalizado. La cámara suma deriva temporal, desplazamiento dirigido
y avance de scroll nativo. Cada escena modifica su luz y su atmósfera: velo
de terciopelo, lluvia nocturna o haz de proyección. Secciones y pie usan luz
decorativa en movimiento. Los indicadores y las imágenes tienen animaciones
propias; las tarjetas reaccionan al puntero y al foco del teclado.

Presupuestos anteriores a la verificación:

- Motor de fondo: un bucle, máximo 30 cuadros/s; software ≤ 360.000 píxeles.
- Tarjetas: inclinación ≤ 1,6 grados por eje, sólo puntero fino. No se inclinan
  artículos, mapas ni tablas. Luz con coordenadas dentro de `[0,100] %`.
- Imágenes: desplazamiento acotado por 2 % del alto, con escala 1,045 para
  conservar el recorte. No se modifica el archivo ni la identidad del retrato.
- Decoración local animada sólo en secciones visibles. Ninguna capa decorativa
  recibe clics. El texto queda accesible con pausa, sin JavaScript o sin WebGL.
- Desbordamiento permitido: ≤ 2 px por redondeo, mismo umbral de la matriz
  responsive de 43 rutas y trece anchos. Cero errores de JS/CSP en recorridos
  verificados; cero infracciones automáticas WCAG A/AA detectadas por axe.

Pausa: el mando visible detiene fondo, ornamentos e interacciones. La
preferencia de movimiento reducido y la suspensión de pestaña prevalecen.
Las rutas nuevas reutilizan el motor y reconstruyen las referencias de
interacción sin conservar nodos descartados. El recorrido entre escenas sigue
siendo voluntario; el movimiento dentro de cada escena comienza al cargar.

Costo: WebGL `O(W·H)` por cuadro, memoria `O(W·H + I)`, `I ≤ 3` imágenes.
Interacción: inventario `O(N)` al navegar; trabajo `O(V)` sobre elementos
visibles durante un evento, con rAF que termina al reposo. Sin nuevas
dependencias ni peticiones a servicios externos. Los datos de GPU usados para
adaptar resolución siguen siendo locales y no se registran en analítica.

Error: los resultados automatizados corresponden a Chrome. `σ = desconocida`
para Safari y teléfonos físicos, no disponibles en este entorno. El efecto
estético exige juicio visual; el conteo de cuadros acredita movimiento, no
calidad artística.

Comprobación visual del motor: dos fotogramas a `t = 0` y `t = 3 s`, sin
cursor, sobre 359.292 píxeles en SwiftShader. Se cuentan los píxeles cuya
diferencia media absoluta RGB supera 8 unidades de 255. Terciopelo pasó de
1.486 a 88.491; Nocturno, de 9.437 a 169.342; Celuloide, de 712 a 105.395.
Comparación entre `ae991fa` y esta revisión; son conteos puntuales, no una
medida de fps ni de calidad artística. Las cinco pruebas previas de
cinematografía aprobaron con dos CPU en 20,34 s.

Interacción aislada: tras un segundo de reposo se observaron 174 escrituras CSS
y 28 callbacks rAF acumulados; 400 ms después seguían siendo 174 y 28. Incremento
cero en ambos contadores. Se verificaron ratón, teclado, pausa, reducción,
limpieza PJAX y reinicio idempotente. El parallax del CV pasó de −0,197 a 2,88 px
al desplazar 250 px; el pie de foto quedó inmóvil. La auditoría de la salida
estática revisó 95 archivos sin hallazgos privados.

La revisión `f96676b` aprobó las 82 pruebas en CI en 172,6 s. En la corrida
local una comprobación de pausa leyó el estilo antes de que el compositor
terminara de congelar el cuadro; se añadió espera de `Animation.ready` y un
rAF antes de tomar la muestra. Se conserva la igualdad exacta después de
250 ms. Tres repeticiones con dos CPU aprobaron en 7,34 / 7,10 / 7,35 s.

Revisión visual: inicio, blog y proyectos a 390 y 1.440 px, seis recorridos,
cero infracciones automáticas WCAG A/AA detectadas por axe. Se verificaron
también contenido y pie; las capturas conservan legibilidad. Una prueba táctil
con `pointer: coarse` desplazó el documento y abrió el blog sin inclinar las
tarjetas; no se confunde ese resultado con el viewport estrecho con ratón de
la prueba de teclado.

Una pasada de producción reveló desbordamiento intermitente de 8 px. La
comprobación de fases lo atribuyó al giro del haz decorativo del pie: a 390 px,
su caja mide 280,797 × 512 px. En `t = 0/3/6/9/12 s` el exceso fue
`0/0/0/6/28 px`. Se retira exclusivamente la rotación del gradiente, conservando
paneo y escala. Sin giro, la extensión derecha máxima relativa al ancho de
sección es `0,68 × (0,09 + 0,07 × 0,75) = 0,0969`, inferior al margen de
escritorio `0,10`; en móvil es `0,1026 < 0,12`. La prueba mantiene esos cinco
puntos y el umbral de 2 px, sin ocultar overflow del contenido ni cortar foco.

La revisión `ac60d85` aprobó 82 pruebas locales en 134,25 s; en CI quedó
cancelada por tiempo la comprobación de movimiento reducido. Se reprodujo
con Chrome 152.0.7977.64, dos CPU y ralentización ×4: las consultas reales
de medios leían `matches: true`, pero el objeto del motor no recibía su
evento `change`. El bucle se detenía por su guardia, dejando el control sin
sincronizar. Ahora esa salida llama a `estado()` antes de retornar: refleja
la pausa en controles y decoración, sin crear otro bucle, temporizador ni
sondeo. Costo adicional `O(1)` exclusivamente al detenerse. La prueba exige
la preferencia real aplicada, botón deshabilitado y cero dibujos posteriores;
conserva su límite de 25 s. Las trazas de navegador pertenecen sólo al test.
La repetición con dos CPU y ralentización ×4 aprobó en 9,83 s; después de
retirar observadores de diagnóstico adicionales, aprobó en 10,07 s. Se
conservan únicamente versión, errores, fase e instantánea de la preferencia.
