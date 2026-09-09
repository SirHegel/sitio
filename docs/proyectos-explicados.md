# Explicaciones de desarrollo de los proyectos

Lectura editorial del 8 de septiembre de 2026. Se cubren los 23 repositorios
propios del inventario público y el diseño privado de Polidinámica. Practice
Python está vacío: conserva ese estado y presenta un ejercicio futuro
expresamente propuesto. Los 20 forks del inventario permanecen fuera de estas
explicaciones de trabajo propio.

Cada ficha agrega propósito, ejemplo de entrada y salida, recorrido de datos,
función de las tecnologías, alcance publicado, comprobación y límites. Los
ejemplos son ilustrativos; los datos comerciales y financieros que incluyen son
ficticios. No representan clientes, consultas meteorológicas actuales o resultados
de ejecución. Las fuentes geográficas de Neiva conservan su procedencia real. El detalle de ingeniería
utiliza HTML `details` y funciona sin JavaScript adicional.

## Evidencia y alcance de la lectura

Se leyó la instantánea pública `datos-github.js`: descripción, extracto de README
e inventario fijado a Git. Se contrastaron fuentes mediante objetos Git de los
clones locales cuando estaban disponibles. Para los ejercicios sin un objeto
local se consultó el código público de `raw.githubusercontent.com`, siempre con
SHA completo. Esta labor no ejecutó servicios de los proyectos ni envió mensajes,
publicaciones o datos financieros.

`proyecto-explicaciones.js` conserva 81 enlaces de archivos o directorios, además
del enlace a la revisión de cada repositorio con contenido. Los directorios
acreditan estructura; los README describen el alcance declarado. Las afirmaciones
de errores concretos siguientes proceden de lectura del código. La presencia de
pruebas se distingue de una ejecución aprobada durante esta revisión.

El sitio se explica sobre `ebb898c72d9cade1e9261b68271298aa42bb5dd5`, revisión
pública que contiene el observatorio. La instantánea automática del catálogo
todavía remitía a una revisión anterior. El inventario medido permanece intacto:
una explicación nueva no actualiza por sí misma líneas, pruebas o rendimiento.

## Correcciones de descripciones

| Proyecto | Hallazgo contrastado | Consecuencia en la ficha |
| --- | --- | --- |
| CRUD | `create.php` y `update.php` operan sobre `trabajadores`. | Se describe un ejercicio de registros de trabajadores. El README mencionaba reservas hoteleras. |
| Multiplicadora | `script.js` valida el formulario; el bucle está en `tablas.php`. | Se explica una validación cliente y un cálculo de servidor. El README atribuía una segunda generación al navegador. |
| Designter Financial Bot | `process_text` extrae dígitos y clasifica mediante palabras. | Se explica un parser de reglas y sus límites con varios importes o decimales. Se retira la promesa de NLP y las alertas no acreditadas. |
| Orquesta IA | El registro publicado es `state/ledger.jsonl`. | La etiqueta y la explicación del almacenamiento usan JSONL. |
| proyecto | El formulario prepara una URL de WhatsApp; no hay almacenamiento de solicitudes en el código leído. | Se identifica el sitio Designter y se distingue preparar el mensaje de haberlo enviado o recibido. |
| Calculadora PHP | La rama de multiplicación conserva el rótulo «Suma»; `floatval` convierte entradas inválidas en cero. | Se documentan ambos pendientes del ejercicio, sin afirmar que ya estén corregidos en su repositorio. |

Fuentes directas para los desacuerdos con el README:
[alta CRUD](https://github.com/SirHegel/CRUD/blob/100912f3ccdd6755d55715cbab875b932f3c5cdb/create.php),
[actualización CRUD](https://github.com/SirHegel/CRUD/blob/100912f3ccdd6755d55715cbab875b932f3c5cdb/update.php),
[validación Multiplicadora](https://github.com/SirHegel/MULTIPLICADORA/blob/af2f6fa2595fa1a733df4e0b49dd6ae65f8f16a3/script.js),
[tabla PHP](https://github.com/SirHegel/MULTIPLICADORA/blob/af2f6fa2595fa1a733df4e0b49dd6ae65f8f16a3/tablas.php),
[parser financiero](https://github.com/SirHegel/designter-financial-bot/blob/fd1e29cf1aea4e92e4f13e2b95a01c32d0570d58/bot.py),
[registro Orquesta](https://github.com/SirHegel/orquesta-ia/blob/be4d50a0316ba6b74a0bcb0b4ceb037742af1ee6/orqlib.py),
[formulario Designter](https://github.com/SirHegel/proyecto/blob/1360d0b0d7298620a8eed657d61ea049ba31470f/script.js)
y [calculadora](https://github.com/SirHegel/CALCULADORA-PHP/blob/6eb5e2b13c663056ebf65a304e233d3fae1b93c9/operaciones.php).

## Integración y mantenimiento

`proyectoConExplicacion(p)` enriquece una copia de la ficha y conserva rutas,
enlaces, estado e inventario. Las cifras medidas permanecen en el catálogo; solo
se corrige la frase no numérica de Designter. `explicacionProyecto(p)` genera el
bloque adicional. La página especial de Neiva utiliza el mismo bloque y conserva
su contrato de descarga y las pruebas de su paquete nativo.

Las seis pruebas de `pruebas/proyecto-explicaciones.test.mjs` comprueban cobertura,
separación de forks, conservación de evidencia, correcciones de alcance, HTML
escapado y tratamiento del proyecto privado y el repositorio vacío. La cobertura
completa exige revisar una explicación si el catálogo incorpora otro repositorio
propio. No cambia automáticamente una fuente fijada cuando avanza GitHub.

Modelo de verificación: para N fichas propias, C es el número de fichas con
explicación específica y fuentes o ausencia de evidencia expresamente marcada.
Umbral fijado para esta validación: C = N. Resultado: 24/24 fichas; las seis
pruebas aprobaron. Los enlaces de origen se contrastan con inventarios u objetos
Git; esta corrida no hace una comprobación HTTP automatizada de los 81 enlaces.

Sanidad: un fork, un repositorio ajeno o una URL inválida recibe cero bloques de
autoría propia. Un repositorio vacío recibe cero enlaces a revisiones
inexistentes. Los ejemplos no ejecutan ninguna operación.

Costo del generador: O(T) tiempo y espacio para T caracteres de salida; el módulo
es parte de la construcción del sitio y no se entrega como JavaScript de
interacción. `TODO(dato)`: horas humanas imputadas y costo monetario de esta
revisión. Error de interpretación del conjunto: σ = desconocida; no se realizó
una segunda lectura independiente de todos los repositorios.

## Verificación en la página integrada

Se recorrieron las 24 fichas en Chrome 152.0.7977.64 a 390 y 1.440 píxeles de
ancho: 48 casos. El detalle se abrió mediante foco y tecla Intro. Todos conservaron
exactamente un bloque de explicación y cero píxeles de desbordamiento horizontal.
No aparecieron errores de JavaScript ni violaciones de la política CSP.

La sesión deshabilitó WebGL y declaró movimiento reducido para aislar la lectura
y los controles HTML. Esta comprobación no mide rendimiento 3D; el proyecto ya
mantiene pruebas independientes del motor. Se inspeccionaron capturas de Orquesta
IA y Neiva en móvil y de la API de tareas en escritorio. Informe temporal:
`/tmp/qa-proyectos-explicados.json`; script: `/tmp/qa-proyectos-explicados.mjs`.
