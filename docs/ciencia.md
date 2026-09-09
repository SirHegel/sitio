# Estudio 001: la forma de una fase

La página `/ciencia/` presenta una construcción matemática reproducible. El
resultado identifica una ambigüedad de un problema inverso elemental y el dato
adicional que permite distinguir sus ramas. Es una derivación de un caso
conocido; no declara resuelta una conjetura abierta ni atribuye novedad a la
implementación.

## Modelo

En un anillo, `u0(x)=1/√(2π)` y `u1(x)=exp(−ix)/√(2π)` son ortonormales.
El estado puro es `cos(θ/2)u0 + exp(iφ)sin(θ/2)u1`. La coordenada `x` y la
fase `φ` están en `[0,2π)` rad; `θ∈[0,π]` rad. Su densidad angular,
`ρ(x)=[1+sin(θ)cos(x−φ)]/(2π)`, tiene unidad rad⁻¹ e integral uno.
Los supuestos físicos son dos modos, radio fijo, evolución libre y ausencia de
ruido y decoherencia.

La esfera de Bloch usa `r=(sinθ cosφ,sinθ sinφ,cosθ)`, adimensional. El toro
central representa la coordenada `x` como azimut y `√ρ` como grosor de un tubo:
radio `0,32√(2πρ)` en unidades gráficas. No representa la trayectoria de una
partícula ni un orbital atómico. Su malla tiene 96×20 caras en escritorio y
72×20 en móvil; la gráfica cartesiana usa 256 intervalos. Los resultados
numéricos se calculan por separado con 512 intervalos.

La evolución explícita aplica `φ(τ)=φ(0)−τ`, con `τ=ΔE·t/ℏ` y
`ΔE=ℏ²/(2mR²)`. Un segundo de animación corresponde a 0,45 unidades de τ;
no se asignan masa, radio ni segundos físicos.

Fuentes primarias: [IBM Quantum, esfera de Bloch](https://quantum.cloud.ibm.com/learning/en/courses/general-formulation-of-quantum-information/density-matrices/bloch-sphere)
y [Barton Zwiebach, MIT 8.04, apuntes 6 y 10, 2016](https://ocw.mit.edu/courses/8-04-quantum-physics-i-spring-2016/pages/lecture-notes/).

## El dato que falta

La densidad identifica `C=sinθ` y, si `C>0`, `φ=x*`. Para `0<C<1`, existen
dos ramas: `θ=arcsin C` y `θ′=π−arcsin C`. Conocer exactamente la población modal
`P1=(1−cosθ)/2` distingue las ramas; un experimento requiere detecciones repetidas
para estimarla, una detección aislada no basta. Para `C=1` coinciden; para `C=0` no hay
máximo único y la fase no es identificable. La página contiene la prueba.

El botón de estado gemelo realiza `θ←π−θ` conservando φ. Para el objetivo
predeterminado `C=0,8`, `x*=135°`, la rama principal tiene `P1=0,2` y la otra
`P1=0,8`; la densidad es la misma. El inverso se vuelve sensible cerca del
ecuador: `dθ/dC=1/√(1−C²)`. La identificación con ruido y muestras finitas es
una continuación pendiente del cuaderno, sin afirmación de que la comunidad
carezca de métodos.

## Reproducción y verificación

Ejecutar `node --test pruebas/ciencia.test.mjs`. Las siete pruebas cubren
estados conocidos, normalización, equivalencia entre amplitud y densidad,
construcción inversa, ambigüedad, reconstrucción por momentos, exportación y
rechazo de valores fuera de dominio. La malla de conservación recorre
13 valores de θ y 11 de φ: 143 estados.

Métrica: `E=|integral(ρ)−1|`, adimensional. Umbral previo: `E≤10⁻¹²`.
La regla trapezoidal integra este armónico periódico exactamente en aritmética
real; el error mostrado es redondeo de coma flotante. En el navegador local
del 8 de septiembre de 2026, el estado inicial dio `E=1,33×10⁻¹⁵`.
Esta observación corresponde a una evaluación; no es una estimación de error
experimental. `σ=desconocida` respecto de mediciones físicas: no se realizaron.

La descarga real se verificó en Chrome: 517 líneas, cuatro de cabecera y 513
muestras incluyendo los extremos. Contiene θ/φ, integral, error y columnas
de x, partes real e imaginaria de ψ y ρ. Cada exportación toma el estado
actual y detiene su evolución. También se puede descargar el módulo fuente
en `/activos/modelo-ciencia.js`.

Verificación de interfaz: objetivo `C=0,8` produjo `P1=0,200`; el gemelo,
`P1=0,800`. Cero errores JavaScript. Capturas a 1440 y 390 píxeles;
`scrollWidth=390` en la última y cero elementos desbordados. Se mantuvo
Canvas2D activo y se deshabilitó WebGL para aislar la prueba científica de
la carga del mundo del sitio. Esta comprobación no mide rendimiento de GPU
del mundo tridimensional.

## Arquitectura, costo y ciclo de vida

`ciencia.js` genera el HTML mediante la plantilla común. El modelo puro está
en `activos/modelo-ciencia.js`; el montaje y los lienzos, en
`activos/ciencia-lab.js`; la composición, en `activos/ciencia-lab.css`.

Muestreo y CSV: O(N) tiempo y espacio, N=512. Inversión analítica: O(1).
Representación: O(V log V) tiempo y O(V) memoria para ordenar las caras de
la malla. Cada lienzo limita DPR a 1,75 y superficie a 900.000 píxeles.

`iniciarCiencia()` se instala una vez. Cada `sitio:navegacion` desmonta el
estado anterior y vuelve a montar si existe la página. Un AbortController
elimina listeners locales; ResizeObserver e IntersectionObserver se
desconectan; el RAF se cancela. La evolución requiere una acción explícita.
Fuera de pantalla o con pestaña oculta no hay bucle activo. Pausa global y
movimiento reducido detienen la evolución. Los controles mantienen su
función con las animaciones detenidas; las ecuaciones se leen sin JavaScript.

Pendiente: datos de un experimento, comparación con un estimador de referencia
y costo físico. Los píxeles de la superficie se interpolan y no sirven como
evidencia matemática.
