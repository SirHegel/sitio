# Observatorio continuo, 8 de septiembre de 2026

El encargo sustituye los cambios de decorado y fondos fotográficos por una sola
habitación de geometría real. Se trabajó en una rama aislada del checkout público
y se integró `origin/master` en `0f27ae4`, conservando los juegos y el inventario
publicado. El checkout operativo con expedientes privados no fue modificado.

## Modelo visual

Three.js construye telones con pliegues y desplazamiento de vértices, suelo
chevrón, pedestal con pigmento de mármol procedural, lámpara, butaca, taza y
escultura orbital. El entorno de reflexión se calcula a partir de paneles de
luz geométricos. No se descargan imágenes para la entrada o la escenografía.
Las fotografías del CV y las capturas documentales de juegos conservan su función.

Un canvas permanece durante la entrada y navegación. El controlador propaga
puntero normalizado en [-1,1], progreso de entrada/desplazamiento y mandos en
[0,1]. Raycasting identifica lámpara e instrumento; los botones equivalentes
se pueden usar con teclado y tacto. Los créditos viven en HTML. El diálogo
conserva música voluntaria y salida con Escape.

Costo de construcción y memoria O(V + P + W·H); cuadro O(V + P + W·H), V vértices,
P partículas y W/H resolución. Escena medida por renderer.info: 71 llamadas y
96.264 triángulos en una pasada habitual; 105 llamadas y 127.608 triángulos en
la pasada que renueva sombras. Son contadores de la escena, no una frecuencia
prometida. La resolución, navegador y tarjeta alteran el costo real.

## Presupuestos anteriores a la validación final

Una sola instancia WebGL durante las rutas públicas. Cero peticiones raster
para entrada y portada. Cero nuevos cuadros de la sala durante pausa estable.
Cero errores de JavaScript/shader en los recorridos. Cero desbordamientos de
contenido en la matriz responsive. Umbral científico de normalización: 1e-12.

Hardware: DPR máximo 2, sombra 1024² cada seis cuadros. Auto reduce resolución
tras ventanas de 120 cuadros con media superior a 25 ms. El bucle sigue el
refresco de pantalla; ningún temporizador promete 60 o 120 fps. Software:
detección previa al primer cuadro, entorno PMREM 64 y sombra 512² actualizada
por cambios de controles. Alta/Auto/Ligera tienen presupuestos respectivos de
350.000/260.000/140.000 píxeles y límites adicionales de DPR. La geometría y el
contenido son iguales en esos modos.

La primera prueba de software encontró carga excesiva antes de reunir 120
cuadros. El ajuste anterior reduce el costo desde la creación del contexto.
Las corridas abortadas por contención no se cuentan como aprobadas. La matriz
responsive bloquea sólo el bundle de la sala: mide cajas HTML en todas las
rutas. Las pruebas de observatorio validan separadamente GPU, CSP y continuidad.

## Ciencia

`/ciencia/` ofrece interferencia de dos modos sobre un anillo, representación
paramétrica, esfera de Bloch, diseño inverso y CSV. La demostración identifica
la ambigüedad θ ↔ π−θ de una misma densidad y la población modal que separa las
ramas. Es una derivación de un caso conocido; no se atribuye novedad ni solución
de una conjetura abierta. El contraste inicial C=.8 reconstruye P1=.2 y su
estado gemelo P1=.8. El CSV verificado contiene 513 muestras y cuatro líneas
de metadatos/cabecera. Modelo, límites y fuentes en `docs/ciencia.md`.

## Verificación y límites

Pruebas numéricas: 7/7 aprobadas. Inspección científica aislada en Chrome con
canvas2D y WebGL deshabilitado: cero errores JavaScript, ancho móvil 390px y
cero desbordamientos. Las capturas de la sala completa fueron inspeccionadas
a 1440×960 y 390×844, incluida entrada móvil. La primera comprobación de shader
y controles pausados pasó en SwiftShader. La validación final del conjunto se
registrará después de ejecutar la batería completa.

Costo externo contratado en esta sesión: COP 0. Horas imputadas y mediciones en
Safari/iOS/Android físicos: TODO(dato). La frecuencia real en esos dispositivos
no está medida; σ entre dispositivos = desconocida. Referencias audiovisuales,
muestreo y tiempos están en `documentos/referencias-observatorio.md`.

Diagnóstico adicional de pruebas: el launcher de `cinematografia.test.mjs`
usaba el fallback gráfico predeterminado de Chrome. Tres navegaciones agotaban
su tiempo esperando carga. Al igualar los argumentos explícitos de SwiftShader
con los demás harnesses, el primer caso pasó en 12,0 s a 320/390/1440 px sin
ampliar sus límites. La tercera corrida también aprobó menú y continuidad.
Este fallo del entorno de prueba se registra aparte del ajuste del presupuesto
software de la aplicación.

Las pruebas de teclado/tacto detectaron una lectura incorrecta de
`data-accion-3d`: el guion anterior al dígito se conserva en DOMStringMap. Se
corrigió mediante `getAttribute`. La prueba de reducción de movimiento detectó
otra carrera: `matches` se actualizaba antes del evento `change` y el bucle se
detenía sin actualizar CSS y botón. El tick ahora refleja el estado al parar.
Ambas regresiones fallaron antes de la corrección y pasaron después.

Axe-core: cero infracciones WCAG 2/2.1 A/AA detectadas en Inicio y Ciencia a
320/390/1440 px, seis combinaciones. Auditoría con GPU escénica bloqueada y
canvas científico activo. Ciencia a 280 px: cero elementos fuera de pantalla.
No equivale a certificación universal de accesibilidad ni a medición física.

## Batería final

`npm test`: 110/110 pruebas aprobadas, cero fallos, cancelaciones u omisiones;
duración 294,564 s. La matriz responsive cubrió 46 rutas públicas × 13 anchos
(280–1440 px) = 598 combinaciones, sin contenido fuera de sus cajas; duración
60,620 s. La compilación produjo 47 páginas, incluido el panel no indexable.
Las pruebas incluyen voz musical voluntaria, foco, gestos táctiles, controles,
pausa/reducción dinámica, pérdida y restauración de contexto, CSP, ciencia,
mapas, juegos, contenido, autenticación y exclusión del expediente privado.

Vista previa revisada: `https://jhonstevenalvarezruiz-nv6e72t0r-sir-hegel.vercel.app`,
basada en `55dda05`. Su controlador servido coincide byte a byte con el local:
SHA-256 `576eaa80c91131095a8b0af5ae09e395cfd0aee3fc721253f770541f5574d12b`.
La ruta Ciencia respondió correctamente mediante acceso autenticado de Vercel.

## Producción y contraste con CI

El commit `053c5ce` se publicó en el dominio canónico. La comprobación sobre
producción verificó entrada silenciosa, los tres mandos de geometría, navegación
a Ciencia sin sustituir canvas/documento, problema inverso y ancho móvil de
390 px sin desbordamiento ni errores JavaScript.

La corrida GitHub Actions `34296557866` aprobó 107 casos y canceló tres por
tiempo total (15/25 s); ninguna aserción falló. Silencio agotó su presupuesto
al recargar, ornamentos durante el segundo viewport y tarjetas tras navegar.
Los tres contratos de foco/CSS se separan del costo de compilar WebGL. Las
pruebas de geometría, entrada con continuidad, mandos y calidad mantienen el
contexto gráfico real. Se conservan los límites y todas las aserciones.
El workflow reparte automáticamente todos los archivos entre tres máquinas
con `--test-shard`, un navegador activo por máquina y sin cancelar los demás
grupos cuando falla uno. La ejecución local completa sigue siendo `npm test`.

Los tres casos ajustados pasan con CPU ralentizada 4×: 3/3, cero omisiones,
16,010 s. Se encontró además un límite real en Auto software: el DPR inicial
de 0,447903 no cumplía el umbral anterior de 0,7, y el motor imponía 0,5 a las
solicitudes menores. La política compartida permite bajar a 0,358323 ante
cuadros sostenidos de 80 o 500 ms. Antes conservaba 0,447903 en ambos casos.
Software evalúa 24 cuadros, umbral de 45 ms, pisos de DPR 0,2 en escritorio y
0,45 en móvil; hardware conserva 120 cuadros, umbral de 25 ms y piso 0,65.
Los retrasos mayores de 250 ms cuentan, acotados a 1.000 ms; pausa y regreso
a la pestaña reinician las muestras. Alta conserva sus presupuestos anteriores.

Las cinco regresiones numéricas nuevas y las dos pruebas de workflow pasan.
Controles geométricos y cambio de calidad pasan también con WebGL real:
2/2, 16,882 s. La batería tiene ahora 115 casos; el resultado independiente
de GitHub Actions queda por confirmar en el commit que incorpora este ajuste.
