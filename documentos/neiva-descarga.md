# Publicar una descarga verificada de Neiva

La ficha preparada describe la **alfa 0.2 disponible para Linux x64**, con
Unreal 5.5.4, personaje, vehículo y vegetación. El contrato local se activó el
8 de septiembre de 2026: el archivo publicado y descargado mide 741.359.235 bytes,
con SHA-256 `2fd09f22b18a790f44876a5b87ae1a0e50d517c17853c1df831d0fd8821d7c5d`.
El recibo confirma HTTP 200 y ejecución aprobada del paquete descargado.
La evidencia pública quedó fijada al commit
`247e28ae25e243eaa9700dfd1f1bd525c93e6239`. La captura y el vídeo finales
aprobados se incorporaron sin retoques, recodificación ni cambio de tamaño.

## Antes de completar el comprobante

1. Terminar el paquete nativo y validar sus binarios, datos e informe. Crear el
   archivo que se distribuirá, con licencias y atribuciones.
2. Publicar ese archivo real como activo de una release de
   `SirHegel/neiva-abierta`. Conservar la URL estable de GitHub Releases;
   no copiar enlaces temporales firmados de CDN.
3. Descargar el activo publicado de nuevo. Medir sus bytes y SHA-256 y compararlos
   con el archivo que se subió. Confirmar respuesta HTTP 200 de esa descarga.
4. Extraer en una carpeta nueva y probar ese paquete descargado: inicio, caminar,
   cámara, coche, freno, salida y cierre. Guardar el resultado y la fecha real.
   Confirmar controles y transmisión aparte si se anuncian para otros dispositivos.

Para futuras entregas, el comprobante de entrada es un JSON con este contrato:

| Campo | Evidencia necesaria |
| --- | --- |
| `url` | URL HTTPS de un activo real bajo `github.com/SirHegel/neiva-abierta/releases/download/`, sin consulta ni fragmento |
| `sha256` | Huella del archivo descargado, 64 caracteres hexadecimales minúsculos |
| `bytes` | Entero positivo con el tamaño exacto del archivo descargado |
| `platform` | `Linux x64` o `Windows x64`, correspondiente a la ejecución probada |
| `verification` | Objeto que repite URL, SHA, bytes y plataforma, con `httpStatus`, `launchPassed` y fecha ISO `checkedAt` |

`httpStatus: 200` y `launchPassed: true` sólo proceden de las comprobaciones
realizadas. El script no los deduce de un binario presente, de una importación
exitosa ni del nombre del archivo.

## Preparar y aplicar

Primero cotejar el recibo con los bytes del archivo descargado:

```sh
node herramientas/preparar-descarga-neiva.mjs \
  --comprobante /ruta/recibo-real.json --archivo /ruta/paquete-descargado.tar.gz
```

Este comando calcula el hash en flujo y muestra los campos públicos, sin
modificar el sitio. Rechaza diferencias de tamaño o huella y comprobantes
incompletos. No descarga, ejecuta ni publica Unreal. El trabajo cuesta O(N)
tiempo y memoria adicional acotada por el stream, con N bytes del archivo.

Después de revisar el resultado real, aplicar explícitamente:

```sh
node herramientas/preparar-descarga-neiva.mjs \
  --comprobante /ruta/recibo-real.json --archivo /ruta/paquete-descargado.tar.gz --aplicar
npm run build
node --test --test-concurrency=1 pruebas/descarga-neiva.test.mjs \
  pruebas/preparar-descarga-neiva.test.mjs pruebas/sitio.test.mjs
```

`--aplicar` reemplaza únicamente `datos/descarga-neiva.json` mediante un archivo
temporal. Descarga, ficha y tarjeta consumen ese contrato en el build. Antes de
publicar, revisar también los textos de `neiva-abierta.js`, `juegos.js` y la
entrada de portada en `construir.js`: deben describir la entrega verificada.
Los snapshots automáticos de GitHub y el perfil de la hoja de vida no se editan.

Los medios finales esperados son `activos/neiva-unreal-linux.png` y
`activos/neiva-unreal-linux.webm`. La plantilla reserva 1.920 × 1.080 píxeles y
usa un reproductor voluntario, con controles, `playsinline` y `preload="none"`.
Incorporar una captura y un vídeo originales aprobados de la nueva entrega,
con sus hashes y procedencia; ajustar dimensiones y texto alternativo si cambia
el encuadre. También fijar `NEIVA_REVISION_NATIVA` al commit público que contenga
el registro de la nueva verificación.
Para 0.2, el comprobante corresponde a
`data/verification/unreal-visual-download.json`; el detalle está en
`data/verification/unreal-visual-upgrade.json` y `docs/MEJORA-VISUAL-0.2.md`.
`unreal-native.json` acredita la entrega histórica 0.1.

La captura final 0.2 ya se incorporó sin retoques: PNG de 1.920 × 1.080,
3.632.115 bytes, SHA-256
`49d93585ed0bcd9457e381db6e70fc48bed82b40f5fc8fc8a927ee5092f0eb5f`.
Muestra al personaje, el coche rojo, vegetación y edificios de la ciudad
interpretada. El vídeo VP8 nativo contiene 529 cuadros decodificables en
17,206 segundos, a 1.920 × 1.080: 18.486.318 bytes, SHA-256
`7790e20d2102de6db45dde5af2d77d8448c700ca036082c228ea883d3f7308bc`.
Se conserva el contenido codificado original de la observación `tROZAC`.

Las imágenes de desarrollo con avisos del motor no se aprobaron para publicar.
La QA de preparación utilizó temporalmente la captura `mjWR8q` y el vídeo
`on4WtW`: comprobaron diseño y reproducción, no la calidad final ni el paquete
0.2. Se retiraron sus copias temporales de `activos/` y del build después de
probar. Tampoco incorporar los dos PNG antiguos `neiva-unreal-game05.png` y
`neiva-unreal-coche-game05.png` a la entrega final. No retocar una advertencia
para hacer pasar una captura por aprobada ni presentar Three.js como Unreal.

Verificar la navegación y la ficha a 320, 390 y 1.440 px antes del despliegue.
Una vez publicado, comprobar la URL canónica, las imágenes y la descarga desde
`/juegos/` y `/proyectos/neiva-abierta/`. El preparador no hace commit, push,
release ni despliegue Vercel.

Preparación del 8 de septiembre de 2026: build de 46 páginas; 25 pruebas de
contenido/contrato/preparador y dos de navegador aprobadas. Revisión adicional
de ficha y Juegos en 320/390/960/1.440 px: ocho casos con cero desbordamientos,
errores JS/HTTP e infracciones axe WCAG A/AA. El vídeo VP8 1.920 × 1.080 se
decodificó tras pulsar su control en los cuatro anchos. Son pruebas locales
con medios provisionales; deben repetirse con los medios finales antes de
publicar. Los servicios de analítica se simularon localmente.

La revisión final con descarga activa y medios aprobados volvió a construir
46 páginas y pasó 26 pruebas de contenido/contrato/preparador y dos de
navegador. Ficha y Juegos se comprobaron a 320/390/960/1.440 px: ocho casos sin
desbordamientos, errores JS/HTTP ni infracciones axe WCAG A/AA. El vídeo se
decodificó tras pulsar su control en los cuatro anchos. La revisión local usa
Chrome automatizado y no establece compatibilidad con equipos físicos.
Tras incorporar por fast-forward las actualizaciones públicas del inventario,
la batería completa `npm test` pasó sus 102 pruebas, incluida la geometría de
45 rutas públicas en 13 anchos de 280 a 1.440 px.
