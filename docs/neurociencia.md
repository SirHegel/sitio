# Tres diseños bajo incertidumbre

Fecha: 8 de septiembre de 2026. Estado: investigación computacional con
demostraciones para modelos reducidos y ensayos sintéticos reproducibles.
**Prioridad científica no establecida.** Se encontraron antecedentes de las
tres familias de modelos y de estimación por conjuntos. La búsqueda realizada
no permite afirmar que las proposiciones específicas aparezcan por primera
vez aquí. Tampoco demuestra que nadie las haya publicado.

El aporte de este cuaderno es una implementación propia de tres problemas de
diseño bajo incertidumbre, con sus condiciones de validez, pruebas y un ensayo
fijado antes de ejecutar. El problema central de investigación es construir
regiones factibles y predicciones acotadas de una curva de depuración sin
convertir mediciones inciertas en parámetros exactos. La validación biológica
y una revisión especializada de prioridad siguen pendientes. Ninguno de los
resultados constituye una explicación de la mente, un diagnóstico o una
intervención clínica.

## 1. Liberación vesicular: separar pulsos cuando los parámetros no se conocen exactamente

### Modelo, alcance y variables

La fracción disponible antes del pulso n es `r_n∈[0,1]`. Cada pulso libera
`q_n=u*r_n`, donde `u∈[0,1]`, y deja `(1−u)r_n`. Entre pulsos, la recuperación
satisface `dr/dt=(1−r)/τ`. El intervalo Δ y τ se expresan en ms.

Supuestos: 1) utilización u constante; 2) reservorio total normalizado;
3) liberación instantánea y recuperación monoexponencial; 4) ausencia de
facilitación, refractariedad y ruido de liberación. La aproximación elimina
el estado efectivo de duración breve. Se apoya en el régimen descrito por
Misha Tsodyks y Henry Markram, *The neural code between neocortical pyramidal
neurons depends on neurotransmitter release probability*, PNAS 94, 719–723,
1997 ([artículo original](https://pmc.ncbi.nlm.nih.gov/articles/PMC19580/)).
Ese trabajo usa un modelo más completo y mediciones; este cuaderno no copia
sus datos ni presenta sus valores sintéticos como parámetros de personas.

Con `a=exp(−Δ/τ)`, la integración entre pulsos da

```text
r_(n+1) = 1−a + (1−u)*a*r_n
r* = (1−a) / [1−(1−u)*a]
q* = u*(1−a) / [1−(1−u)*a]
```

Para `u>0` o `Δ>0`, el punto fijo es único. La contracción vale
`λ=(1−u)*a<1`, y la igualdad
`|q_n−q*|=u*|r_0−r*|*λ^n` cuantifica el transitorio. Con u=Δ=0, cada valor
de r permanece constante y no existe un punto fijo único.

### Proposición: intervalo mínimo para toda una caja de incertidumbre

Sean `u∈[uL,uH]`, `τ∈[τL,τH]` constantes y `0<qObjetivo<uL`. Entonces el
menor intervalo que satisface `q*≥qObjetivo` para todos los parámetros es

```text
Δ* = τH * ln[1 + uL*qObjetivo/(uL−qObjetivo)].
```

Prueba: al escribir `D=1−a+u*a`, se obtiene

```text
∂q*/∂u = (1−a)²/D² ≥ 0
∂q*/∂a = −u²/D² ≤ 0
∂a/∂τ = a*Δ/τ² ≥ 0.
```

El mínimo de q* en la caja se alcanza en `(uL,τH)`. Para esa esquina,
resolver `q*=qObjetivo` produce la expresión indicada. q* crece estrictamente
con Δ cuando u>0, por lo que cualquier intervalo menor incumple en esa
esquina. Esto demuestra suficiencia y necesidad dentro del modelo.

Casos extremos: qObjetivo=0 admite Δ=0. Si qObjetivo>uL, el objetivo es
imposible. Si qObjetivo=uL>0, solo se alcanza en el límite Δ→∞. Esta cota
protege el estado estacionario. También protege cada pulso si `r_0≥r*`;
no protege el primer pulso de un reservorio arbitrariamente agotado.

La sensibilidad respecto del objetivo diverge al acercarse a uL:

```text
dΔ*/dq = τH*uL² / [(uL−q)*(uL−(1−uL)*q)].
```

### Ensayo y métrica

Se fijó la caja `u∈[0,25;0,45]`, `τ∈[600;1000] ms`, objetivo q*=0,2.
El diseño que reemplaza incertidumbres por sus puntos medios usa
Δ=306,393802 ms y su peor liberación es 0,147291. El diseño de la proposición
usa Δ=693,147181 ms y su peor liberación es 0,2.

La rejilla prefijada de 21×21 pares produjo cumplimiento en 207/441 casos
para el punto medio y 441/441 para el diseño de la caja. La rejilla es una
prueba finita de implementación; la protección de todos los parámetros
procede de la demostración. El objetivo y los denominadores fueron fijados
antes de la corrida. Costo analítico: O(1) tiempo y memoria. Simulación de N
pulsos: O(N) tiempo y memoria. Error fisiológico: `σ=desconocida`, porque
no se dispone de mediciones para este ensayo.

## 2. Depuración saturable: recuperar una región de parámetros en vez de inventar precisión

### Modelo y antecedentes

Se modela `dC/dt=−V*C/(K+C)` con concentración inicial C0 conocida,
`C≥0`, `K>0` en μM y `V≥0` en μM/ms. Tiempo t en ms. Supuestos:
1) un compartimento bien mezclado; 2) captación saturable dominante;
3) ninguna liberación adicional; 4) parámetros constantes; 5) C0 exacta.

La captación Michaelis–Menten aparece en el modelo de Kathleen Wiencke,
Annette Horstmann, David Mathar, Arno Villringer y Jane Neumann, *Dopamine
release, diffusion and uptake: A computational model for synaptic and volume
transmission*, PLOS Computational Biology 16, e1008410, 2020
([artículo y código originales](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1008410)).
El modelo del cuaderno omite la difusión y la geometría de aquel trabajo.
Por tanto sus concentraciones no predicen una hendidura sináptica real.

La solución integrada es conocida:

```text
C0−C(t) + K*ln[C0/C(t)] = V*t.
```

G. L. Atkins e I. A. Nimmo ya estudiaban estimaciones con la ecuación
integrada en *The reliability of Michaelis constants and maximum velocities
estimated by using the integrated Michaelis-Menten equation*, Biochemical
Journal 135, 779–784, 1973
([registro y artículo](https://pubmed.ncbi.nlm.nih.gov/4778274/)).
La inversión puntual de dos observaciones tampoco constituye una invención
de este cuaderno.

Un problema de diseño sencillo se resuelve directamente: para alcanzar
`0<CObjetivo<C0` antes de T>0, la capacidad mínima es
`Vmin=[C0−CObjetivo+K ln(C0/CObjetivo)]/T`. Con K>0, llegar a cero exige
tiempo infinito. La implementación evita exponentes de Lambert W mediante
la variable `y=ln(C0/C)` y resuelve
`C0(1−e^(−y))+K*y=V*t`, una ecuación estrictamente creciente.

### Proposición: región factible exacta con errores acotados

Sean observaciones en tiempos positivos t_i con
`C(t_i)∈[L_i,U_i]⊆[0,C0]`. Sobre una caja previa `K>0,V≥0`, la región
factible de parámetros es la intersección con los semiplanos

```text
C0−U_i + K*ln(C0/U_i) ≤ V*t_i
V*t_i ≤ C0−L_i + K*ln(C0/L_i), cuando L_i>0.
```

Si L_i=0, no se impone el segundo semiplano. Si U_i=0 con C0>0 y K>0,
la región es vacía para tiempos finitos. Una región vacía denuncia
incompatibilidad entre datos, cotas, dominio previo o modelo; no identifica
por sí sola cuál de ellos falló.

Prueba: la función `F_K(C)=C0−C+K ln(C0/C)` tiene derivada
`−1−K/C<0`. En consecuencia, `C∈[L,U]` equivale a
`F_K(U)≤V*t≤F_K(L)`. Cada desigualdad es afín en K y V. Al imponerlas
simultáneamente, su intersección es un polígono convexo —o un conjunto
degenerado o vacío— exactamente igual al conjunto factible del modelo.
La suficiencia no requiere escoger una curva distinta para cada medición:
cada par `(K,V)` tiene una única trayectoria y todas las desigualdades
se aplican a esa misma trayectoria.

### Proposición: predicción extrema en los vértices

Para un t futuro fijo, el mínimo y máximo de C(t) sobre un polígono
compacto factible se obtienen evaluando sus vértices.

Prueba: para cualquier concentración z>0, el conjunto de parámetros con
`C(t)≤z` es el semiplano `F_K(z)≤V*t`; el conjunto con `C(t)≥z` es el
semiplano contrario. Si z es el máximo entre los vértices, todos ellos
pertenecen al primer semiplano. Por convexidad, todo el polígono pertenece
a él, por lo que ninguna concentración interior excede z. El argumento
del mínimo es idéntico con la desigualdad contraria. Una función no lineal
de dos parámetros se acota así con evaluaciones en una lista finita de
vértices, sin una búsqueda de rejilla del interior.

### Qué se investigó y qué antecedente impide atribuirse la familia de métodos

Se buscó `Michaelis-Menten set membership`, `bounded-error parameter
estimation`, `integrated Michaelis-Menten linear parameter estimation` e
`interval parameter estimation`, el 8 de septiembre de 2026. La búsqueda
encontró estimación por conjuntos aplicada a sistemas bioquímicos, métodos
de intervalos y problemas con mecanismos Michaelis–Menten. Philipp
Rumschinski, Steffen Borchers, Sandro Bosio, Robert Weismantel y Rolf
Findeisen publicaron *Set-base dynamical parameter estimation and model
invalidation for biochemical reaction networks*, BMC Systems Biology 4,
69, 2010 ([artículo original](https://doi.org/10.1186/1752-0509-4-69)).

La pregunta específica de este desarrollo es si la estructura afín de la
ecuación integrada permite una implementación pequeña de la región
factible y sus predicciones extremas, útil en el navegador. Se obtuvo una
respuesta afirmativa bajo los supuestos escritos y se verificó su código.
No se ha establecido que esa reducción exacta sea inédita. La prioridad
exige una revisión bibliográfica especializada y revisión externa. No se
presenta el programa como superior a algoritmos publicados.

### Ensayo fijado antes de ejecutar

`docs/neuro-protocolo.json` fija semilla xorshift32 20260908 y 256 casos.
C0=2 μM; K verdadero uniforme en [0,05;0,8] μM; V verdadero uniforme en
[0,001;0,006] μM/ms. La caja previa es K∈[0,01;1] μM,
V∈[0,0001;0,01] μM/ms. Se observan t=50,150,300,500 ms. Se añade error
uniforme en [−0,02;0,02] μM, acotado por construcción. La predicción se
evalúa en 700 ms. Estos rangos son sintéticos, no una población de sujetos.

Umbrales previos: contener parámetros y predicción verdaderos en 256/256
casos; nunca ensanchar el intervalo previo, tolerancia 10⁻⁹ μM. Resultado:
256/256 parámetros contenidos, 256/256 predicciones contenidas y cero
regiones vacías. El intervalo previo de predicción mide 1,953516 μM.
El ancho posterior medio es 0,079731 μM, desviación estándar muestral
0,051863 μM, n=256; rango [3,617×10⁻⁹;0,219840] μM. Cero anchuras
excedieron el intervalo previo.

También se documentó un comparador puntual elemental, que usa las
observaciones primera y cuarta como si fueran exactas. Produjo parámetros
físicos en 177/256 casos. Para esos 177, el error absoluto de predicción fue
0,031830 μM de media, desviación muestral 0,033338 μM. Solo 83/256 corridas
produjeron una estimación física con error de predicción ≤0,02 μM. No se
eliminan de los archivos los 79 casos no físicos. No se comparan media de
error puntual y anchura de intervalo como si fueran la misma métrica.

El punto medio y el intervalo previo son comparadores ilustrativos. El
ensayo muestra el efecto de conservar las cotas de incertidumbre; no mide
superioridad frente a tomografía, ajuste de máxima verosimilitud ni un
estimador publicado del estado del arte. Una cota de error falsa o C0
incierta puede invalidar la región: ambas son limitaciones materiales.

### Error, sanidad y costo

La proposición es exacta en aritmética real. `recortar` usa Float64 y una
holgura de 10⁻¹² μM en las desigualdades; no emplea redondeo dirigido.
Por tanto se distingue una garantía matemática condicional de una
certificación formal de todas las operaciones del programa. Las pruebas
contrastan la región con 1681 puntos de parámetros y verifican la predicción
sobre combinaciones convexas de vértices. Datos repetidos contradictorios
producen una región vacía; [0,C0] no inventa información adicional.

M observaciones definen 2M semiplanos y a lo sumo 4+2M vértices, contando la
caja previa. El recorte implementado cuesta O(M²) tiempo en el peor caso y
O(M) memoria. Predecir en P vértices cuesta O(PB), B≤80 bisecciones por
concentración. La tolerancia del ensayo comprueba la implementación en sus
casos declarados; no es una cota universal de errores de Math.log/Math.exp.
`σ=desconocida` respecto de una medición fisiológica real.

## 3. Circuito excitación/inhibición: conocer cuándo una ganancia sí puede estabilizar

### Modelo

Sean E e I desviaciones adimensionales respecto de un equilibrio; pueden
ser negativas y no son tasas de disparo absolutas. Se estudia

```text
τE*dE/dt = (w−1)*E − g*I + s
τI*dI/dt = h*E − I
```

Las constantes τE,τI>0 se expresan en ms; w,g,h≥0 son ganancias
adimensionales. Se simula la respuesta libre s=0 tras fijar una desviación
inicial, mediante la exponencial matricial exacta en aritmética real.

Supuestos: 1) dos poblaciones y aproximación lineal local; 2) ganancias y
tiempos constantes; 3) ausencia de retardos, saturación y plasticidad;
4) ninguna identificación de E o I con pensamiento o memoria personal.
La referencia de población es Hugh R. Wilson y Jack D. Cowan, *Excitatory
and inhibitory interactions in localized populations of model neurons*,
Biophysical Journal 12, 1–24, 1972
([artículo original](https://pubmed.ncbi.nlm.nih.gov/4332108/)).
El modelo original es no lineal. La estabilidad aquí se refiere únicamente
a esta matriz reducida. Una respuesta estable decae y no representa una
memoria persistente.

### Región exacta y extensión bajo incertidumbre

La matriz tiene

```text
tr(A) = (w−1)/τE − 1/τI
det(A) = [1−w+g*h]/(τE*τI).
```

Para una matriz real 2×2, todos los autovalores tienen parte real negativa
si y solo si tr(A)<0 y det(A)>0. Aplicar ese criterio produce

```text
w < min[1+τE/τI, 1+g*h].
```

En una caja independiente de incertidumbre sobre w,h,τE,τI, la condición
necesaria y suficiente para estabilidad en toda la caja es

```text
wH < 1+τEL/τIH
wH < 1+g*hL.
```

Prueba: las condiciones escalares se cumplen para todos los parámetros si
y solo si se cumplen con w máximo y las razones/productos mínimos. Los
extremos pertenecen a la caja, por lo que incumplir cualquiera produce un
contraejemplo admisible. Las desigualdades son estrictas: las fronteras
no son estabilidad asintótica.

Fijado un margen m>0 para el numerador del determinante,
`1−w+g*h≥m`, el mínimo g que lo alcanza en la caja, si la condición de
traza es factible y hL>0, es

```text
g* = max[0,(wH−1+m)/hL].
```

Si hL=0 y el numerador exigido es positivo, ningún g finito basta.
Si la condición de traza falla, aumentar g tampoco basta: g no aparece en
la traza. El margen m no es un porcentaje ni una tasa de decaimiento;
tiene unidad adimensional y su denominador positivo es τEτI.

### Ensayo

La caja prefijada es w∈[1,5;1,9], h∈[0,8;1,3], τE∈[18;22] ms y
τI∈[8;12] ms, con m=0,2. El diseño nominal usa g=0,857143. Es estable en
12/16 esquinas y alcanza el margen en 8/16. La solución de la caja usa
g=1,375, es estable en 16/16 y alcanza el margen en 16/16. La peor parte
real entre esas esquinas es −0,016667 ms⁻¹. Esta última cifra es una
observación de esquinas, no una afirmación de que el peor autovalor de
toda la caja necesariamente esté allí.

Las condiciones de traza/determinante sí prueban estabilidad para toda la
caja. Las pruebas numéricas comparan la exponencial matricial con RK4
independiente y cubren matrices diagonal, oscilatoria y de Jordan. La
representación corta una trayectoria si desborda el rango visual de 10¹²;
la marca `truncada` impide hacer pasar una divergencia por estabilidad.
Análisis y diseño: O(1). N puntos de trayectoria: O(N) tiempo/memoria.
Error de extrapolación biológica: `σ=desconocida`; no hay datos ajustados.

## Reproducción, archivos y trabajo pendiente

Ejecutar, sin dependencias nuevas:

```bash
node --test pruebas/neuro-modelos.test.mjs
node herramientas/investigar-neuro.mjs
```

El script carga el protocolo fijado, ejecuta los casos y escribe
`activos/resultados-neuro.json`. Se incluyen todos los parámetros verdaderos,
errores sintéticos, mediciones, vértices y predicciones, además de las
huellas SHA-256 del modelo y del protocolo. La fecha es la del protocolo;
no se añade un reloj que rompa la reproducción del archivo.

La revisión de trece pruebas aprueba los modelos, sus inversos, casos
degenerados, cotas y correspondencia del informe con las huellas del modelo
y protocolo. Una segunda ejecución produjo un archivo idéntico byte por
byte, SHA-256 `7e846b94c4378d3db74bff5a9aafc8eaf1d97ab0a663d5c4683deb4489d6aedb`.
El ensayo finito cumple todos los
umbrales predefinidos. Esta observación no transforma una simulación en
evidencia de un cerebro, ni prueba una prioridad científica.

Quedan pendientes: revisión externa de las proposiciones y búsqueda
bibliográfica especializada; comparación con estimadores publicados bajo
las mismas hipótesis; incertidumbre común en C0, que impide usar estos
semiplanos como región exacta sin reformular el problema; valores atípicos
fuera de la cota; calibración con datos de instrumento y validación de los
supuestos de un compartimento. `TODO(dato)`: datos experimentales,
calibración del sensor, costo físico y tiempos de adquisición.
