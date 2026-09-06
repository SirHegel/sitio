# Estado de proyectos

## Portafolio público

Corte: 28 de agosto de 2026. Objetivo: cobertura `C = fichas publicadas / repositorios públicos propios`. Base anterior: `21/22 = 0,9545`. Umbral: `C = 1`. Estado verificado en producción: `22/22 = 1`. El artículo, la página de contribuciones y el repositorio nuevo respondieron HTTP 200; la ruta antigua de `before-you-contribute` respondió 308 hacia el nombre vigente.

La sincronización recoge inventario Git, README saneado, releases, PR externas, logros visibles y métricas fijadas a revisión. Costo observado: 92 solicitudes API; complejidad `O(R + F + P)`.

## Artículo de política de drogas

Objetivo: publicar un análisis con una métrica territorial, base oficial, umbral anterior a la siguiente medición, error declarado, sanidad y costo. Estado: publicado con 2.685 palabras en la categoría Análisis.

## Rediseño cinematográfico y auditoría, 6 de septiembre de 2026

La portada prioriza identidad y acceso a proyectos antes del retrato. En Chrome
a 390 px, la cabecera pasó de 191,8 a 65 px y el inicio de los botones de 1.072,8
a 417 px. Son observaciones puntuales del navegador local; dispersión no medida.
La prueba responsive mide trece anchos entre 280 y 1.440 px y exige cero
desbordamientos. Las pruebas del movimiento cubren pausa, preferencia reducida,
navegación persistente y lectura sin JavaScript.

El build genera 44 páginas. El artículo de oro permanece publicado, con dos
contestaciones administrativas registradas y cero respuestas de fondo. El plazo
de cinco días hábiles terminó; el seguimiento documental sigue abierto.

El runtime de auditoría registra cada navegación que alcanza su API, cifra la
IP y conserva atribución de canal permitida. Una visita anterior al cambio no
permite recuperar la IP descartada. Los fallos de red, bloqueadores y cuotas
limitan la cobertura. El procesamiento de fondo cuesta O(P), P ≤ 45 partículas,
con techo de 30 cuadros por segundo y pausa en pestañas ocultas.

## Segunda dirección cinematográfica, 6 de septiembre de 2026

Se inspeccionaron los dos vídeos solicitados y se reemplazó el fondo anterior
con tres escenografías originales. El motor aplica profundidad aparente 2.5D,
cámara de 1,8 s y barrido de navegación de 920 ms. La portada se suspende fuera
de pantalla; conserva pausa, reducción de movimiento y respaldo sin WebGL.

Verificación local: 79/79 pruebas, cero omisiones; duración 169,7 s. La batería
responsive recorre el sitemap en trece anchos de 280 a 1.440 px. Axe no detectó
infracciones WCAG A/AA en inicio a 320/390/1.440 px ni blog a 390/1.440 px.
La auditoría estática aprobó 93 archivos, cero hallazgos privados. Cada imagen
WebP pesa menos de 200.000 bytes. Son resultados de Chrome automatizado;
Safari físico y dispositivos Android/iOS físicos siguen sin medición.

Se corrigió también el montaje del mapa al entrar desde el blog: dos pruebas
reproducen navegación, descarga tardía, desmontaje y regreso. La regresión de
entrada falló antes del arreglo y pasó después. Las capturas internas WebGL
no se usan para inferir pausa: su framebuffer puede descartarse sin dibujar;
las pruebas cuentan llamadas reales a la GPU.
