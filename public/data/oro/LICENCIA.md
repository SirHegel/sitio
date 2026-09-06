# Condiciones de uso de la cartografía del estudio

Corte: 28 de agosto de 2026.

Los textos, cálculos, esquemas de datos y metadatos originales de este estudio se ofrecen bajo [Creative Commons Atribución 4.0 Internacional](https://creativecommons.org/licenses/by/4.0/deed.es). Esa licencia no cubre el código fuente, que conserva todos sus derechos mientras el repositorio no adopte una licencia de código separada.

Las geometrías puntuales de las familias `legal`, `huella`, `delta`, `proteccion`, `agua` y `eventos` son anclas de contexto obtenidas de OpenStreetMap. No son centroides registrales ni perímetros exactos. Las anclas y las vías OSM de `rutas` se distribuyen bajo ODbL 1.0 y conservan la atribución © OpenStreetMap contributors.

Las áreas atribuidas a la Agencia Nacional de Minería son datos documentales o resultados de cálculos internos sobre capturas de sus servicios. El área histórica asociada al expediente 2594 es un cálculo interno condicionado por los vértices aproximados publicados en Nexus. Esas cifras permanecen en la narración y las tablas, pero el payload público no redistribuye los perímetros ANM/Nexus ni permite reconstruirlos. Este repositorio no concede una sublicencia sobre documentos o geometrías de esas fuentes.

`buffers.geojson` contiene cero geometrías. Los radios de 5, 10 y 25 km se documentan como método, pero no se calculan buffers públicos porque no existe un perímetro exacto redistribuible que pueda servir de base.

Condiciones por familia:

| Familia | Geometría pública | Condición aplicable |
| --- | --- | --- |
| `legal`, `huella`, `delta`, `proteccion`, `agua`, `eventos` | Anclas puntuales OSM de contexto | ODbL 1.0, © OpenStreetMap contributors; textos y metadatos propios, CC BY 4.0 |
| `rutas` | Vías OSM y línea aduanera diagramática | Vías ODbL 1.0; línea propia CC BY 4.0; campos estadísticos sujetos a los términos de UN Comtrade |
| `buffers` | Colección vacía | Esquema y documentación propios bajo CC BY 4.0; no incorpora geometría de terceros |
| `tension` | Colección vacía | Esquema y documentación propios bajo CC BY 4.0; no incorpora geometría de terceros |
| Cortina satelital | Imágenes derivadas de Sentinel-2 | [Copernicus Sentinel Data Legal Notice](https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice) |

Las nueve capas llegan al navegador por HTTP para que MapLibre pueda dibujarlas. El manifiesto declara para cada familia la fuente, la condición de uso, el alcance de descarga, el tamaño y el hash SHA-256. El hash acredita qué archivo se examinó; no concede derechos adicionales.
