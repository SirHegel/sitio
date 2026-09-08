# Descarga verificada de Neiva Unreal 0.3

La ficha ofrece la alfa 0.3 para Linux x64, publicada el 8 de septiembre de
2026. El archivo público se descargó y ejecutó antes de activar el contrato.
El recibo contiene HTTP 200, `launchPassed: true`, 19 comprobaciones de juego
y salida nativa 0. El preparador cotejó los bytes locales con ese recibo.
Windows y macOS siguen pendientes de compilación y pruebas en equipos nativos.

| Dato | Valor comprobado |
| --- | --- |
| Archivo | `Neiva-Abierta-Unreal-0.3.0-Linux-x64.tar.gz` |
| Tamaño | 743.035.069 bytes |
| SHA-256 | `65a11768f536f81d9c47ab62788d28e054007e6eb7ec05c4bd9ce28f1cda4cfb` |
| Fuente del juego | `e7a7e280e3e9887df70557ac56aa89318617aeab` |
| Revisión del recibo | `73f34183af717941cd709e98e38e813c7db39d88` |
| Recibo | `data/verification/unreal-03-download.json` |
| Fecha del recibo | `2026-09-08T09:28:06.243231+00:00` |

[Release pública](https://github.com/SirHegel/neiva-abierta/releases/tag/unreal-v0.3.0-linux-alpha),
[recibo fijado](https://github.com/SirHegel/neiva-abierta/blob/73f34183af717941cd709e98e38e813c7db39d88/data/verification/unreal-03-download.json)
y [registro de juego y medios](https://github.com/SirHegel/neiva-abierta/blob/73f34183af717941cd709e98e38e813c7db39d88/data/verification/unreal-03.json).
Las afirmaciones de lluvia, siete clips de voz sintética y alturas estimadas
proceden de esa entrega. Las fachadas son interpretadas; las alturas revisadas
no son mediciones físicas certificadas ni acreditan un escaneo exacto.

## Contrato y actualización

`datos/descarga-neiva.json` contiene `url`, `sha256`, `bytes`, `platform` y
`verification`. Este último repite esos cuatro valores e incorpora
`httpStatus: 200`, `launchPassed: true` y `checkedAt` ISO, tomados de la prueba
real. La URL debe ser un activo estable de `SirHegel/neiva-abierta` en GitHub
Releases, sin firmas temporales ni consultas.

El recibo público 0.3 organiza los datos bajo `download` y la fecha bajo
`checkedAtUtc`. Para el preparador se normalizan esos campos al contrato
anterior, conservando literalmente sus valores; no se deduce una ejecución
correcta de la presencia del binario ni se usan fixtures como comprobantes.

```sh
node herramientas/preparar-descarga-neiva.mjs \
  --comprobante /ruta/recibo-normalizado-real.json \
  --archivo /ruta/paquete-publico-descargado.tar.gz
```

El comando calcula SHA-256 en flujo y rechaza diferencias de tamaño o hash.
No descarga, ejecuta ni publica Unreal. Añadir `--aplicar` reemplaza únicamente
el contrato público mediante un archivo temporal. El costo es O(N) tiempo y
memoria adicional acotada por el stream, para N bytes del archivo.

`entregaNeivaLista` exige además la release **0.3** y plataforma Linux x64,
una revisión pública de 40 caracteres, ruta de recibo válida y medios
aprobados. Un recibo válido de la alfa 0.2 no habilita una ficha 0.3. La
regresión automatizada comprueba ese caso, ejecución rechazada y evidencia
ausente. Completar también `NEIVA_REVISION_NATIVA`, `NEIVA_RUTA_RECIBO` y
`NEIVA_MEDIOS_VERIFICADOS`; revisar las dos plantillas antes de publicar.
No se editan los snapshots de GitHub ni el perfil de la hoja de vida.

## Medios de la entrega

Se copiaron los archivos finales aprobados a `activos/` sin modificarlos.
La captura procede del paquete descargado, sin retoques ni cambio de tamaño.
El vídeo fue recodificado previamente para su publicación: VP8 con audio
Vorbis, 1.920 × 1.080, 18,500 segundos y 555 cuadros a 30 fps normalizados.
Esa cadencia del archivo no es una medición del rendimiento nativo del juego.

| Archivo del sitio | Bytes | SHA-256 |
| --- | ---: | --- |
| `neiva-unreal-linux.png` | 2.864.670 | `5753ac5f47428afd5899eb07f6cc837dbc1715bdef955a0890d4166e8ed953e3` |
| `neiva-unreal-linux.webm` | 19.522.814 | `98701845b7bd3006d69ff333b0f77ca8734ba8191f5b65e5ddc9039fce6a3247` |

El vídeo contiene conversación sobre Jhon, lluvia y recorrido a pie. El
reproductor requiere pulsación, tiene controles, `playsinline` y
`preload="none"`. `neiva-unreal-linux-es.vtt` transcribe literalmente el clip
`jhon` del manifiesto del juego; su único cue usa tiempos aproximados de
0,1 a 12,0 segundos. No certifica una transcripción alineada palabra a palabra.
La prueba automatizada comprueba pista de audio decodificada, volumen no
silenciado y subtítulo cargado; no evalúa percepción humana del sonido.

## Comprobación del sitio

```sh
npm run build
npm test
```

El build genera 46 páginas. La batería completa pasó 103 pruebas, sin fallos
ni casos omitidos, en 169,29 segundos; incluye 45 rutas en trece anchos de
280 a 1.440 px. La revisión local de la ficha y `/juegos/` cubre
320, 390, 960 y 1.440 px: ocho casos, con umbral cero para desbordamientos,
errores JS/HTTP e infracciones axe WCAG 2/2.1 A/AA. Resultado: ocho aprobados,
vídeo con audio y subtítulo decodificado en los cuatro anchos. La navegación
parte del inicio y abre el menú móvil cuando corresponde. Bloquitos conserva
su enlace y arte. La analítica se excluye para no registrar visitas sintéticas.

Modelo: C = casos aprobados / 8; base anterior, ocho casos de la alfa 0.2;
umbral C = 1 y resultado local 8/8. La generación de las plantillas cuesta
O(T), T caracteres emitidos; la validación de URL y revisión cuesta O(L),
L acotada a 1.024 caracteres. Sanidad: versión anterior, metadatos ausentes y
comprobante discordante conservan la descarga desactivada. `σ = desconocida`:
Chrome automatizado, sin dispositivos físicos. `TODO(dato)`: rendimiento y
requisitos mínimos en otros computadores; fuente necesaria, pruebas nativas.

La publicación usa el build de Vercel y `herramientas/sanear-salida-vercel.mjs`
antes de `vercel deploy --prebuilt --prod`. Después se repiten las ocho
combinaciones en el dominio canónico y se cotejan HTTP, bytes y hashes de
PNG, WebM y VTT. La descarga del juego se comprueba con una petición Range;
no hace falta transferir de nuevo sus 743 MB para validar el enlace del sitio.
