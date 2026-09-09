# Neurociencia y explicación del software · 8 de septiembre de 2026

La ampliación conserva el observatorio continuo y agrega tres estudios con
geometría Three.js, soluciones bajo incertidumbre y explicaciones pedagógicas.
El archivo de interferencia se conserva en `/ciencia/interferencia/`; el índice
ofrece sinapsis, dopamina y circuito E/I. La petición de ciencia nueva motivó
una búsqueda de antecedentes y tres derivaciones, sin atribuirles prioridad
mundial que la revisión no establece.

Modelo y fuentes: `docs/neurociencia.md`. Protocolo fijado antes de ejecutar:
`docs/neuro-protocolo.json`. Ensayo reproducible: `herramientas/investigar-neuro.mjs`.
La corrida produjo cumplimiento vesicular 441/441 frente a 207/441 nominales,
estabilidad E/I 16/16 esquinas frente a 12/16 nominales, y contención de
parámetros/predicciones de depuración 256/256. Los datos son sintéticos;
ninguna de esas cifras constituye una medición biológica. JSON con hash del
modelo y del protocolo, reproducido byte a byte en una segunda ejecución.

Se explican 24 fichas (23 repositorios públicos y un diseño privado), con
81 enlaces a código/documentos fijados y ejemplos de entrada/proceso/salida.
Se corrigieron atribuciones de funcionalidades no presentes en el código;
el ejercicio vacío permanece identificado. Hay seis pruebas específicas,
y 48 combinaciones de ficha/viewport con detalles abiertos por teclado no
registraron desbordamientos, errores JavaScript o infracciones CSP.

Tres representaciones 3D: vesículas y membranas, conformero computacional
de dopamina PubChem CID 681 y red procedural E/I. Las series matemáticas
alimentan la animación. El ciclo visual amplía y repite el tiempo del modelo;
la gráfica y el CSV conservan las unidades. La pausa, el movimiento reducido
y salir de pantalla detienen el bucle. PJAX libera el contexto local antes de
montar el siguiente; el contexto del observatorio global permanece.

Empaquetado: dos bundles independientes sumaban 1.142.074 bytes minificados;
compartir Three.js produce 599.645 bytes en los dos puntos de entrada y el
fragmento común. Son tamaños sin compresión, no latencia de red medida.
Software: el widget tiene presupuesto de 95.000 píxeles; no se prometen FPS.
Una revisión con SwiftShader registró 38/32/23 llamadas y 71.220/51.576/25.420
triángulos para sinapsis/dopamina/E-I, respectivamente.

La revisión científica independiente encontró dos defectos de interfaz:
el inverso de depuración excedía la caja fija de V y generaba una banda vacía;
el nominal vesicular anunciado difería del calculado al recortar u máximo a 1.
Dos pruebas fallaron antes y pasaron después: caja de exploración que incluye
V elegido y declara sus límites; peor caso evaluado con el nominal mostrado.
La implementación numérica se mantiene independiente de la geometría.

Verificación parcial anterior al conjunto: 13 pruebas numéricas, siete de
interfaz neuronal con dos recorridos WebGL, seis de explicaciones y 30 casos
agregados de contenido/descarga aprobados. Axe WCAG2/2.1 A/AA: cero infracciones
detectadas en cuatro rutas de neurociencia × tres anchos (280/390/1440),
12 combinaciones, sin desbordamiento. Esta matriz deshabilitó WebGL y conservó
las gráficas SVG; las pruebas de geometría usaron WebGL real.

Costo externo contratado: COP 0. TODO(dato): horas humanas imputadas, gasto de
energía y rendimiento/consumo en móviles físicos. El resultado final de la
batería y el despliegue se registrarán tras ejecutarlos.

Batería completa local aprobada: 141/141 pruebas, cero fallos, cancelaciones u
omisiones; 382,894 s. Matriz adaptable: 50 rutas públicas × 13 anchos, 650
combinaciones sin desbordamiento. La revisión final precisó que la holgura de
10⁻¹² μM corresponde al polígono de depuración; todo el cálculo usa Float64.
Se corrigió la documentación que llamaba «reales» a las representaciones 3D.

La comprobación integrada posterior recorrió 15 rutas/recursos con GPU Intel
ANGLE, incluidas las tres soluciones, CSV, cinco fichas ampliadas y móvil.
Cero errores JavaScript, HTTP o CSP. El contraste final conserva visible el
observatorio con un fondo más oscuro detrás de la lectura. Una nueva pasada
axe a 390 px en índice y tres estudios encontró cero infracciones y cero
desbordamientos. Las últimas precisiones editoriales pasaron 38 pruebas de
contenido, modelos y fichas.
