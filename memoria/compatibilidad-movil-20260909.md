# Revisión móvil · 9 de septiembre de 2026

Solicitud: comprobar escala, aspecto y operación en celulares iOS/Android y sus
navegadores. Base pública: f8ad3cfeafc43a805ef4f721eee70f84ab1ff16f. Se mantuvo
el checkout operativo con material reservado fuera de la publicación.

La exploración recorrió 200 casos Chrome, 150 WebKit y 150 Firefox, sin
problemas en la matriz de anchos. Encontró defectos adicionales al evaluar
recortes de pantalla, texto ampliado y gestos. Las correcciones preservan
márgenes seguros, amplían controles táctiles a 44 px, evitan solape de mandos
con texto grande, permiten reflow de métricas y pie y restituyen scroll vertical
y pellizco sobre los modelos. Se mantiene el giro horizontal táctil y ambos
ejes mediante ratón/teclado. El puntero secundario no sustituye al principal.

La política Auto reiniciaba el DPR en cada resize, incluso después de haberlo
reducido por cuadros lentos. La regresión del controlador con renderer y reloj
simulados falló antes; después conserva la resolución al variar altura y
orientación, y permite volver a elevarla por elección explícita. Se corrigió
el harness inicial para usar viewport real y polling temporal independiente
del reloj rAF simulado; ese timeout no se cuenta como evidencia del defecto.

La regresión causal de scroll utiliza Input.dispatchTouchEvent. El comando
synthesizeScrollGesture tampoco desplazaba una página mínima en este Chrome;
su timeout no constituía evidencia válida del sitio. Con la secuencia corregida,
el CSS anterior impide scroll y el actual permite desplazamiento >40 px.

Matriz final sobre una copia inmutable de la construcción: 500/500 casos,
15/15 recorridos, cero errores. Chrome 152.0.7977.64: 200; WebKit 26.5: 150;
Firefox 153.0: 150. Intervalo 05:22:49.365–05:25:09.882 UTC: 140,517 s. Informe:
`/tmp/movil-final-auditoria.json`, SHA-256
`a771049b6e475a2e968166bd8d62a24e89b6c574eb2a1821b07f072c9101f8c6`.
El servidor Python no aplica la CSP de Vercel; el informe registra esa ausencia.

WebGL real se comprobó por separado sobre la base en los tres motores:
observatorio y dopamina dibujaron cuadros y respondieron al teclado. Una fuente
MP3 de prueba de 2 s permitió comprobar reproducción tras gesto en esos motores;
no constituye una medición de audio de un iPhone/Android físico. Registro:
`/tmp/movil-gpu-audio.json`. No se modificó el código de audio al no reproducirse
un fallo en estos procesos. Los visores tienen pruebas GPU adicionales.

Las pruebas nuevas de safe areas/gestos, reflow y calidad tienen ejemplos que
fallan antes y pasan después. La herramienta incluye cuatro contratos de CLI,
sitemap y red. La batería completa y la comprobación canónica se registrarán
tras terminar sus corridas.

Costo: no se contrataron servicios externos. Playwright es dependencia de
desarrollo; no entra al JavaScript entregado al visitante. WebKit se instaló en
la caché del usuario y dos bibliotecas auxiliares se extrajeron en /tmp, sin
instalación global del sistema. TODO(dato): horas humanas imputadas y consumo
eléctrico. σ = desconocida para generalización a dispositivos físicos y para
rendimiento móvil. Protocolo y fuentes: `docs/compatibilidad-movil.md`.

Batería completa local: 158/158 pruebas aprobadas, cero fallos, cancelaciones
u omisiones; 355,919 s. Incluye la matriz habitual de 50 rutas × 13 anchos,
650 combinaciones sin desbordamiento. La matriz adicional entre motores pasó
sobre una copia inmutable mientras la batería construía sus propios recursos.
