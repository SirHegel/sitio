# Compatibilidad móvil: protocolo y evidencia

La auditoría comprueba documentos, navegación y controles en motores de navegador
ejecutados en Linux. Los tamaños de pantalla y la entrada táctil se emulan.
La matriz bloquea WebGL expresamente y conserva canvas 2D: acredita la lectura y
el respaldo funcional cuando falta el contexto gráfico. La geometría 3D y la
reproducción de audio se comprobaron por separado en estos motores de escritorio.
Los FPS y el consumo energético en teléfonos físicos siguen pendientes de medir.

La herramienta reproducible es `herramientas/auditar-movil.mjs`, con
`playwright-core` 1.62.0 fijado en `package-lock.json`. No construye el sitio,
cambia sus archivos ni despliega. Acepta el servidor local o el origen público
autorizado; las rutas se obtienen del sitemap servido en ese origen.

## Ejecutar

Se necesitan Node 24, las dependencias del repositorio y los navegadores de la
versión de Playwright instalada:

```sh
npm ci
npx playwright-core install chromium firefox webkit
```

En Linux pueden faltar bibliotecas del sistema para los navegadores. El
instalador de Playwright permite agregar `--with-deps`; esa instalación es
independiente de la auditoría y puede necesitar privilegios del sistema.

Para probar una construcción local, prepara el sitio y mantén el servidor en
otra terminal:

```sh
npm run build
python3 -m http.server 8112 --bind 127.0.0.1 --directory publico
```

```sh
node herramientas/auditar-movil.mjs --base http://127.0.0.1:8112 --motor todos --salida /tmp/auditoria-movil.json
```

`--base` por defecto es `http://127.0.0.1:8112`; `--motor` por defecto es `todos`.
El valor de base debe ser un origen HTTP(S), sin credenciales, ruta, consulta ni
fragmento. Puede apuntar a la publicación autorizada:

```sh
node herramientas/auditar-movil.mjs --base https://jhonstevenalvarezruiz.vercel.app --motor todos --canal-chromium chrome --salida /tmp/auditoria-movil-publicada.json --capturas /tmp/auditoria-movil-capturas
```

`--canal-chromium chrome` utiliza Chrome instalado en el equipo. Si se omite,
Chromium utiliza el navegador que instala Playwright. La versión real queda
registrada; ninguno de los dos ejecuta Chrome para Android. También se puede
seleccionar únicamente `--motor webkit`, `--motor firefox` o `--motor chromium`.

El servidor sencillo de Python no aplica las cabeceras de Vercel. Cada caso
registra `cspEnCabecera`: la ausencia de infracciones con ese campo en `false`
no acredita la política CSP de producción. La corrida del dominio publicado sí
recibe sus cabeceras reales.

El informe JSON se escribe en `--salida`, o en el directorio temporal del sistema
con nombre `auditoria-movil.json`. Las capturas se producen únicamente con
`--capturas`; incluyen entrada, menú y cada estudio. La consola imprime avances
por ancho y un resumen corto. Los detalles y muestras de fallos están en JSON.

## Matriz y contratos

Los motores se ejecutan en secuencia, con una página activa por motor. El sitemap
debe tener al menos 50 rutas únicas; si aumenta, se recorren todas. Una reducción
del catálogo no disminuye silenciosamente la exigencia de cobertura.

| Motor | Ventanas CSS, ancho × alto | Casos con 50 rutas |
| --- | --- | ---: |
| Chromium o Chrome | 320 × 740; 360 × 844; 390 × 844; 844 × 390 | 200 |
| WebKit de Playwright | 320 × 740; 390 × 844; 844 × 390 | 150 |
| Firefox de Playwright | 320 × 740; 390 × 844; 844 × 390 | 150 |
| Total | Retrato y apaisado | 500 |

En los tres motores se declara `hasTouch: true`, DPR 2 y movimiento reducido.
Chromium y WebKit usan `isMobile: true`. Playwright no implementa `isMobile` para
Firefox: allí se comprueban una ventana estrecha y eventos táctiles emulados,
sin atribuirle el comportamiento completo de Firefox Android.

Cada caso exige HTTP 200, igualdad entre ancho solicitado, `innerWidth` y
`documentElement.clientWidth`, y un exceso horizontal máximo de 2 píxeles CSS.
Se comprueban los rectángulos del texto, excluyendo contenido oculto, auxiliares
de accesibilidad y contenedores con desplazamiento horizontal propio. Se recorta
solo el espacio en blanco inicial/final del nodo antes de medirlo. El informe
cuenta los problemas y conserva hasta diez muestras por documento.

El observatorio debe quedar en `data-motor="respaldo"` al impedir la creación de
WebGL. Ese resultado esperado acredita degradación funcional, no renderizado 3D.
El informe registra las capacidades CSS (`svh`, `dvh`, áreas seguras, `touch-action`,
tipo de puntero) y API del proceso usado. La existencia de
`WebGL2RenderingContext` se registra separada del bloqueo deliberado del contexto.

Después de la matriz se ejecutan cinco comprobaciones adicionales a 390 × 844:

1. Abrir la entrada y elegir silencio; el diálogo debe cerrarse y el audio
   permanecer pausado.
2. Abrir el menú y navegar a Ciencia; el menú debe cerrarse y conservar el mismo
   canvas del observatorio durante la navegación interna.
3. Aplicar la solución de sinapsis al campo `deltaMs`.
4. Aplicar la solución de dopamina al campo `vmax`.
5. Aplicar la solución de memoria al campo `g`.

Cada solución exige un valor finito, diferencia absoluta máxima de `1e-7`
respecto al valor calculado y el mensaje de respaldo del visor visible. Se
comprueba la acción real del botón sobre el formulario. Los datos de cálculo
siguen disponibles aunque la visualización 3D esté bloqueada.

La auditoría bloquea medios, rutas de telemetría/API, solicitudes a otros orígenes
y métodos distintos de GET/HEAD. Registra errores JavaScript, respuestas HTTP
fallidas de documentos/scripts/estilos e infracciones CSP. No envía visitas de
analítica, correos ni publicaciones. El audio se prueba aquí únicamente en su
estado de silencio; su reproducción tiene otra batería.

Los códigos de salida son 0 para aprobación completa, 1 para fallo o corrida
incompleta, 2 para argumentos o errores que impidan escribir la salida y 130
para interrupción. Los contextos se cierran mediante `finally`; una interrupción
solicita cerrar el navegador activo y conserva el informe parcial cuando la
ruta de salida es escribible.

## Procedencia del informe

El esquema JSON, versión 1, conserva hora inicial/final, origen, plataforma,
arquitectura, versión de Node, Playwright y cada navegador. Añade SHA-256 de la
herramienta, sitemap, hojas CSS de portada y respuesta HTML de cada caso.

`checkoutHerramienta` identifica la copia Git donde se ejecutó la herramienta;
no identifica automáticamente el despliegue remoto. Las huellas corresponden a
los bytes consultados. Si ocurre otro despliegue durante el recorrido, los hashes
de cada caso permiten identificar contenido distinto; conviene repetir sobre
una publicación estable antes de emitir el veredicto.

## Línea base del 9 de septiembre de 2026

Los scripts exploratorios anteriores produjeron los siguientes resultados de
matriz. Se conservaron sus informes locales para contrastar la migración a la
herramienta versionada:

| Motor informado | Casos | Fallos de matriz / errores JS | Artefacto de origen |
| --- | ---: | --- | --- |
| Chrome/152.0.7977.64 | 200 | 0 / 0 | `/tmp/auditoria-movil-chromium/informe.json` |
| WebKit 26.5 | 150 | 0 / 0 | `/tmp/movil-webkit-audit.json` |
| Firefox 153.0 | 150 | 0 / 0 | `/tmp/movil-firefox-audit.json` |

La matriz exploratoria de Chrome usó anchos 320, 360, 390 y 412. La herramienta
versionada incorpora 844 × 390 en lugar de 412 para incluir apaisado en esa
matriz. Sus 200 casos tienen el mismo tamaño, pero no son observaciones idénticas.
WebKit y Firefox conservaron los tres tamaños de la herramienta inicial.

Las comprobaciones exploratorias de entrada, menú y soluciones aprobaron en
WebKit y Firefox. Los recorridos adicionales de Chrome detectaron asuntos de
texto ampliado y controles que motivaron regresiones específicas; aprobar la
matriz de anchos por sí sola no los descarta.

Huellas SHA-256 de los informes exploratorios leídos:

```text
Chrome  3d3994a63189c7798608125bfd4b7d20d97e0f9b6070032b96ad4d708bac9e6d
WebKit  2b5d0b7a5b932c21dec965a8f5a3153c3361337da672a085519cb7e960c612d6
Firefox 4d229897c4fea1c06ded69a18dfd4dc2fb485b2dfda265497fbf6620c066928a
```

Verificación de la herramienta al incorporarla: sintaxis aprobada, ayuda CLI y
cuatro pruebas de argumentos, matriz, sitemap y bloqueo de red aprobadas. No se
lanzaron navegadores durante esa preparación.

## Resultado de la herramienta versionada

El informe `/tmp/movil-final-auditoria.json` acredita la corrida local sobre
`http://127.0.0.1:8114`, desde `2026-09-09T05:22:49.365Z` hasta
`2026-09-09T05:25:09.882Z`: **500 de 500 casos y 15 de 15 recorridos aprobados**,
con cero errores JavaScript, fallos de contrato o recursos HTTP críticos fallidos.
La duración transcurrida fue 140,517 segundos, incluyendo los tres motores en
secuencia. El equipo informó Linux x64, Node v24.20.0 y Playwright 1.62.0.

| Motor ejecutado | Casos aprobados | Recorridos aprobados | Fallos / errores JS |
| --- | ---: | ---: | --- |
| Chrome 152.0.7977.64, canal `chrome` | 200 / 200 | 5 / 5 | 0 / 0 |
| WebKit de Playwright 26.5 | 150 / 150 | 5 / 5 | 0 / 0 |
| Firefox de Playwright 153.0 | 150 / 150 | 5 / 5 | 0 / 0 |

El servidor local no envió CSP en ninguno de los 500 documentos. No se observaron
infracciones, pero esta corrida no valida las cabeceras de producción. La copia
Git base fue `f8ad3cfeafc43a805ef4f721eee70f84ab1ff16f`; los ajustes locales se
identifican mediante las huellas de la herramienta y de los recursos servidos
guardadas en el informe, sin atribuirlos a ese commit previo.

```text
Informe     a771049b6e475a2e968166bd8d62a24e89b6c574eb2a1821b07f072c9101f8c6
Herramienta 6f4c3cca3c0c919fc8865cfa9d6a940714b26aba32589110d0138090ee2aad5f
Sitemap     41e55b885c6bd0ebea6520bb8d43444b2a4529b1d96a31114c25ba1a01d96a71
```

Las comprobaciones complementarias quedaron en `/tmp/movil-gpu-audio.json`.
Los mismos tres motores crearon WebGL en la sala y el modelo de dopamina; el
contador de cuadros aumentó tras una acción de teclado. También aprobaron la
reproducción de un MP3 de prueba después del primer gesto táctil emulado
(`paused: false`, estado `sonando`), sin errores JavaScript. Esto verifica la
creación del contexto, una respuesta gráfica y el permiso de reproducción con
ese archivo de prueba. No mide FPS sostenidos, consumo, reproducción completa
del archivo musical del sitio ni comportamiento en teléfonos físicos.

```text
WebGL/audio 2e739611302f300be8a555441863a95887d53d436229f4436aa438b462e85aa0
```

Las regresiones específicas adicionales aprobaron controles y desplazamiento
móvil (5/5), texto ampliado (7/7, incluidos seis subcasos) y conservación de
calidad gráfica (6/6). La prueba de texto cambia la raíz CSS a 32 px; su resultado
no equivale al zoom nativo. Estos conteos son independientes de los 500 casos y
no anticipan el resultado de la batería completa del repositorio.

## Fuentes primarias y decisiones de compatibilidad

WebKit documenta que `viewport-fit=cover` exige proteger los controles mediante
áreas seguras; estas deben coexistir con márgenes mínimos. Esto sustenta la
revisión de controles inferiores y apaisado. [Áreas seguras de WebKit](https://webkit.org/blog/7929/designing-websites-for-iphone-x/).

Safari incorporó WebGL2 en la versión 15. Safari 15.4 añadió `svh/dvh`,
`Array.at` y `<dialog>`. El soporte declarado de una API no garantiza que el
contexto gráfico se pueda crear en cada dispositivo. La aplicación conserva el
respaldo y las pruebas específicas de pérdida de contexto.
[WebKit en Safari 15](https://webkit.org/blog/11989/new-webkit-features-in-safari-15/),
[WebKit en Safari 15.4](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/).

La reproducción con sonido puede exigir un gesto. La aplicación trata el rechazo
de `play()` y conserva una acción manual; recordar una preferencia no sustituye
ese permiso del navegador. [Política de Chrome](https://developer.chrome.com/blog/autoplay)
y [política de medios de WebKit](https://webkit.org/blog/6784/new-video-policies-for-ios/).

Firefox añadió View Transitions para navegación dentro del documento en 144.
La navegación conserva detección de capacidad y una aplicación directa del
contenido. [Notas de Firefox 144 para desarrolladores](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/144).

Samsung documenta el uso combinado de ratón y tacto en Samsung Internet/DeX;
detectar tacto no permite descartar ratón. Esa guía conserva ejemplos antiguos de
versiones y no se usa para deducir qué versión tienen instalados los visitantes.
[Compatibilidad de entrada de Samsung](https://developer.samsung.com/samsung-dex/modify-optional.html).

Playwright declara que usa compilaciones modificadas de WebKit y Firefox; WebKit
en Linux no ejecuta Safari comercial. Sus perfiles emulan parámetros como tamaño,
agente y entrada táctil. Los códecs y otras capacidades dependen del sistema
operativo. [Navegadores de Playwright](https://playwright.dev/docs/browsers),
[emulación de dispositivos](https://playwright.dev/docs/emulation).

## Alcance pendiente en teléfonos

Una aprobación permite afirmar «verificado en los motores y versiones indicados,
en Linux con entrada táctil y ventanas emuladas». Todavía requiere dispositivos
físicos para acreditar Safari/iPhone, Chrome/Android, Firefox/Android y Samsung
Internet. El propio modo de dispositivos de Chrome se define como una
aproximación: no reproduce la arquitectura ni el rendimiento de un teléfono.
[Límites del modo de dispositivos de Chrome](https://developer.chrome.com/docs/devtools/device-mode).

El protocolo físico mínimo pendiente debe conservar modelo de teléfono, versión
de sistema y navegador, y comprobar entrada silenciosa/musical, menú completo,
retrato/apaisado, barras del navegador, teclado virtual, zoom, desplazamiento
iniciado sobre los visores, retorno desde otra aplicación y soluciones de los
tres estudios. Para el motor gráfico se necesitan frecuencia y consumo medidos
durante un recorrido definido, con tiempo de calentamiento y duración registrados.

Se mantienen pruebas separadas para controles táctiles, áreas seguras, texto al
200 %, conservación de calidad tras cambiar el alto y comportamiento del motor
3D. La ampliación de la raíz CSS en esas pruebas no equivale al zoom nativo o al
tamaño de texto del sistema operativo.

## Modelo, error y costo

Sea R el número de rutas y V_m el número de ventanas del motor m. Los casos
esperados son N = R × ΣV_m; con R = 50 y V = 4 + 3 + 3, N = 500. El umbral
establecido antes de la corrida final es completar N casos, aprobar los cinco
recorridos por motor y registrar cero fallos de contrato, errores JS y errores
HTTP críticos. Las medidas de ancho usan píxeles CSS, con tolerancia de 2 px por
redondeo. La comparación de soluciones conserva tolerancia absoluta de `1e-7` en
la unidad del parámetro aplicado; no mide error de un experimento biológico.

Sanidad: el sitemap vacío o duplicado falla; un recurso 404 falla; el contexto
WebGL bloqueado debe producir respaldo explícito; una solución no aplicada falla.
La ausencia de salida o una corrida interrumpida nunca equivalen a aprobación.

Costo de análisis DOM por caso: O(T × (D + G)), con T nodos de texto, D profundidad
y G rectángulos por nodo. El informe ocupa O(N + F), para N casos y F muestras de
error acotadas por caso, más las capturas opcionales. No se paralelizan motores.
`σ = desconocida` para la generalización a teléfonos físicos.
Duración medida de la matriz final local: 140,517 segundos. `TODO(dato)`: consumo
energético y horas humanas imputadas a la validación; requieren medición física y
un registro de trabajo, respectivamente.

Batería general local de la entrega: **158/158 pruebas aprobadas**, sin fallos,
cancelaciones ni omisiones; 355,919 segundos. Incluye 650 combinaciones de rutas
y anchos en Chromium, además de la matriz independiente de 500 casos entre
motores descrita arriba. El resultado del dominio publicado se comprueba
separadamente después del despliegue.
