# Decisiones

## 2026-08-28

Se separaron los 22 repositorios propios de los 20 forks públicos. Razón: `42 = 22 + 20`; mezclar ambos inflaría autoría.

Se adoptó `metricas/repositorios.json` del perfil SirHegel como fuente única para líneas, commits y workflows. Suma verificada: 25.216 líneas de fuente, 9.903 de prueba, 52 commits alcanzables y 6 workflows en 6 revisiones.

Se fijó para la próxima revisión de cada ficha el umbral `M ≥ 0,25`, donde `M` es prueba/fuente. La primera medición queda como línea base; no se declara éxito retroactivo.

Se conservó la categoría Análisis para el texto sobre drogas. El asunto cruza seguridad, economía, derecho y Estado; crear una taxonomía nueva para un solo artículo agregaría un cajón sin mejorar la lectura.

## 2026-09-06

El encargo del autor autoriza rediseño, auditoría, corrección del blog y publicación.
La rama pública incorpora fuentes reproducibles y capas publicables del artículo
existente. Los correos, cuestionarios, acuses y geometrías reservadas permanecen
en el expediente local. La continuidad del artículo se acredita mediante su acta
y SHA exacto; no equivale al cierre del derecho de réplica.

Se habilita despliegue automático exclusivamente de `master`, que es la rama
de producción del proyecto Vercel conectado. La regla `**: false` bloquea las
demás ramas. El CMS conserva su commit y muestra el estado de publicación.

La dirección visual usa tres escenas originales CSS/canvas, tipografía editorial
y música voluntaria. La interfaz conserva el contenido sin JavaScript y respeta
cambios de movimiento reducido durante la sesión.

La segunda revisión sustituye esos fondos por tres escenografías originales
generadas, tras inspeccionar los dos vídeos aportados por el autor. La sala
WebGL usa profundidad aparente 2.5D, acercamiento de 1,8 s y navegación de
920 ms. No se afirma haber construido los mundos 3D de la referencia. Se
conservan imágenes de respaldo, pausa y música voluntaria. Detalle, presupuestos
y prompts en `memoria/direccion-cinematografica-20260906.md`.

La IP se cifra con AES-256-GCM; el panel limita su consulta a siete días. Git
conserva versiones cifradas históricas. Los mapas se rotulan como aproximaciones
de red, sin inferir dirección, barrio ni identidad personal.

La ampliación posterior del encargo retira la suspensión del fondo al salir de
portada. Se anima todo el recorrido público y se reservan las transformaciones
de interacción a tarjetas e imágenes. El mando de pausa ahora gobierna el
conjunto visual. Se conserva el límite de 360.000 píxeles en software, 30
cuadros/s y la exclusión del panel administrativo. La nueva regresión midió
cero dibujos fuera de portada antes de este cambio; se documenta su sustitución
en `memoria/movimiento-integral-20260906.md`.

La petición posterior recupera una entrada que espera la elección del visitante.
Se utiliza una llave de sesión nueva; una preferencia musical anterior no
activa audio durante el diálogo. La apertura dura 1,8 s y conserva salida
inmediata con movimiento reducido. La sala tridimensional tiene sección propia
para conservar el acabado fotográfico de la portada. Comparte el reloj general
y agrega una llamada de dibujo sólo mientras está visible. No se incorporan
vídeos de terceros ni nuevas dependencias.

La sección `/juegos/` reúne dos accesos jugables: Neiva Abierta y Bloquitos.
El catálogo usa navegación y pie comunes, una entrada en portada y tarjetas
con controles táctiles de al menos 44 px. El arte de las tarjetas se rotula
como ilustración. El alcance cartográfico de Neiva se describe como prototipo
con edificios interpretados, sin atribuir exactitud de fachadas a OpenStreetMap.
Bloquitos enlaza a su despliegue Vercel, comprobado con HTTP 200 el 6 de
septiembre de 2026; GitHub Pages también respondió 200. La nueva página se
incorpora al sitemap y al catálogo de rutas de auditoría existentes.

La actualización del mismo 6 de septiembre sustituye una de las dos
ilustraciones por una captura real: la tarjeta de Neiva Abierta. El archivo
de 319.058 bytes se sirve localmente y declara sus dimensiones para reservar
espacio. Se retira el dibujo CSS de Neiva; Bloquitos conserva el suyo. La
captura representa el juego publicado, con arquitectura interpretada; el
texto no atribuye exactitud de fachadas a los mapas ni ejecución web a Unreal.

## 2026-09-07

Se renueva la captura de Neiva con la versión 0.3 y su revisión del centro.
El personaje aparece frente a la Catedral y la fuente del Parque Santander;
la imagen se obtiene dentro del juego. Se conserva el tamaño de 1.440 × 960
px para mantener el espacio de la tarjeta. El archivo de 319.616 bytes se
comparte con la portada del repositorio del juego; Bloquitos conserva su arte.

La preparación de Neiva 0.4 separa su ficha editorial del inventario automático
de GitHub. `neiva-abierta.js` reúne propósito, cambios de juego, auditoría de
22 cubiertas y límites dimensionales. El catálogo mantiene dos juegos y la
misma ruta del proyecto. No se editan el inventario sincronizado ni `datos.js`,
que participa en el manifiesto de la hoja de vida. La evidencia se fija a
`5fd5188fb125309eae3f0b76af3e4755948d07d6`; la captura 0.4 en calidad Alta
reemplaza la anterior y conserva sus dimensiones. Los pendientes de rendimiento
se limitan a otros computadores y celulares físicos, pues el Intel UHD ya
cuenta con una medición documentada.

El encargo posterior del 7 de septiembre exige Unreal para el desarrollo
actual. La tarjeta principal enlaza al estado nativo y conserva el prototipo
Three.js 0.4 como antecedente identificado. Se mantiene su captura sin usarla
como evidencia de Unreal. No se inventa una release ni un ejecutable.

`DESCARGA_NEIVA_UNREAL` usa `{url, sha256, bytes, platform, verification}`,
todos nulos al publicar esta preparación. Antes de completarlo se descarga
el activo real desde GitHub, se calcula SHA-256 y tamaño y se comprueba su
ejecución en la plataforma indicada. `verification` debe conservar esos cuatro
datos, `httpStatus:200`, `launchPassed:true` y `checkedAt` ISO. El enlace se
habilita sólo con coincidencia de valores; el comprobante no se fabrica con
los fixtures de prueba. Windows x64 y Linux x64 son opciones del contrato,
sin afirmar que exista actualmente un binario para alguna de ellas.

La revisión nativa posterior fija evidencia a `2a4fcd22615bb950c26fb1091f8d25f75775699d`:
Unreal 5.5.4 compilado e importado, partida de desarrollo y vídeo VP8 comprobados.
La tarjeta y la ficha sustituyen el estado de motor pendiente por ese resultado;
la descarga Linux sigue desactivada. Dos PNG originales de game05 conservan
avisos y defectos visibles. La captura Three.js anterior no se presenta como nativa.

El contrato descargable pasa a `datos/descarga-neiva.json`, todavía con sus cinco
campos nulos. El preparador coteja SHA y bytes del archivo descargado contra un
recibo de ejecución externo; sólo `--aplicar` escribe el contrato. No produce
comprobantes de ejecución ni despliega. Su salida descarta campos ajenos al
contrato público. Se conserva la autorización del encargo para publicar una
entrega real, sujeta a verificar previamente ese archivo y su ejecución.

## 2026-09-08

La preparación inicial para la alfa Unreal 0.2 mantuvo los cinco campos de
descarga nulos hasta verificar el nuevo paquete. El recibo de la descarga
pública ya acredita HTTP 200 y ejecución aprobada: se cotejaron localmente
741.359.235 bytes y SHA-256 antes de aplicar el contrato. Tarjeta y ficha
indican ahora «Alfa 0.2 para Linux». La captura final procede del paquete
descargado; el vídeo final VP8 conserva los bytes codificados originales,
1.920 × 1.080 y 529 cuadros decodificables. La evidencia pública queda fijada
al commit `247e28ae25e243eaa9700dfd1f1bd525c93e6239`.
Los medios con advertencias sirvieron sólo para pruebas locales de plantilla.
La QA se repitió con los medios finales y el contrato activo: 26 pruebas de
contenido/contrato, dos de navegador y ocho combinaciones responsive aprobadas.

La entrega web 0.3 exige comprobante de la misma release: el contrato genérico
admite formatos anteriores, pero la ficha añade control explícito de versión,
Linux x64, recibo público y medios aprobados. Una regresión cubre el recibo
válido 0.2 rechazado para 0.3. El recibo final de la descarga se fija al commit
`73f34183af717941cd709e98e38e813c7db39d88`; pruebas posteriores del sitio no
cambian esa referencia. El vídeo final incluye audio sintético y subtítulo
literal de tiempos aproximados. Se informa de su recodificación en un detalle
expandible, sin atribuir sus 30 fps al rendimiento del motor. Las cifras de
altura se separan en 17.696 automáticas y una revisión manual estimada.

## 2026-09-08 · Un observatorio continuo

La nueva petición reemplaza la escenografía fotográfica y el selector de tres
ambientes por una habitación modelada que permanece durante la entrada y la
navegación. Los cambios de contenido conservan cámara, audio y contexto GPU.
Se incorporó Ciencia al menú, preservando Juegos y todas las publicaciones
presentes en `origin/master` al integrar `0f27ae4`.

La sala se construye en Three.js y se compila con esbuild; ninguna fotografía
se usa como textura de la escenografía. La selección de calidad modifica la
resolución; el software gráfico recibe presupuesto reducido desde el arranque.
Modelo y umbrales: `memoria/observatorio-3d-20260908.md`.

El estudio científico deriva y verifica un problema inverso de dos modos. La
misma densidad puede pertenecer a dos estados; una estimación de población modal
los distingue. Se explicita que se reproduce una propiedad conocida, sin afirmar
que la visualización haya resuelto un problema abierto de la matemática.

## 2026-09-08 · Investigación neuronal y explicaciones de software

La ampliación del encargo exige al menos tres soluciones, mente y
neurotransmisores, modelación y explicaciones comprensibles. La corrección del
autor exige además no inventar ciencia. Se investigan tres problemas reducidos:
intervalo vesicular con parámetros inciertos, región factible de depuración
saturable y estabilidad E/I en una caja de parámetros. Los antecedentes
encontrados impiden anunciar las familias de métodos como inéditas. Se separan
demostración, implementación, ensayo sintético y validación biológica pendiente.

Los resultados se generan con un protocolo fijado antes de ejecutarlo y se
vinculan a hashes de fuente y protocolo. Una respuesta estable E/I decae;
no representa memoria persistente. Float64 sin redondeo dirigido no se presenta
como una biblioteca formal de intervalos. Se mantiene la escena global y se
crea como máximo un contexto de estudio adicional, liberado al navegar.

La explicación de 23 repositorios propios y un diseño privado se contrasta
con 81 enlaces fijados a revisiones. El catálogo de forks sigue separado.
Se corrigen descripciones de CRUD, Multiplicadora, Designter y Orquesta según
el código consultado. El repositorio Practice Python vacío conserva ese estado.
