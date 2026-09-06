# Datos públicos del estudio sobre oro y perímetros

`manifiesto.json` conecta las nueve familias que consume `MapaOro.tsx`. Cada
entrada conserva archivo, URL pública, fuente enlazada, fecha, condición de
licencia, tamaño y SHA-256. Los documentos originales permanecen fuera del
artefacto web cuando sus condiciones no autorizan redistribución.

Las capas `legal.geojson`, `huella-estado.geojson`, `delta-estado.geojson`,
`proteccion-estado.geojson`, `agua-estado.geojson` y `eventos.geojson` contienen
fichas sobre anclas puntuales de OpenStreetMap. Los puntos no son centroides
registrales ni perímetros exactos y su tamaño no codifica hectáreas. Las áreas
ANM se conservan como datos documentales o cálculos internos en las tablas del
estudio; el área histórica 2594 es un cálculo interno condicionado por los
vértices aproximados de Nexus. Ninguno de esos perímetros se redistribuye en el
payload público. El total documental de Crucitas, 34,04 ha, carece de polígono
DGM.

`tension-no-calculable.geojson` publica cero celdas. Sus cinco variables quedan
en `null`; la ausencia documental no se convierte en cero. `buffers.geojson`
publica cero geometrías: los radios de 5, 10 y 25 km quedan documentados, pero
no se derivan sin un perímetro exacto redistribuible. Las anclas y las líneas de
`rutas-contexto.geojson` proceden de OpenStreetMap bajo ODbL 1.0. Las dos
líneas aduaneras usan agregados nacionales anuales y no acreditan rutas comerciales.

Reproducción local:

```bash
.venv-oro/bin/python geo/construir_capas_publicas.py
node --test pruebas/capas-publicas-oro.test.mjs
```
