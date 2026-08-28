# Ficha cuantitativa de *El Siguiente Programa*

Corte: 28 de agosto de 2026. Corpus: cuatro episodios, uno rotulado por temporada. Duración observada: 4.796 segundos, equivalentes a 79:56. Texto procesado: 73.771 bytes y 1.705 líneas de subtítulos.

## Corpus auditado

| Muestra | Fuente | Publicación en YouTube | Duración |
|---|---|---:|---:|
| T1E1, *Qué desastre* | [Video](https://www.youtube.com/watch?v=sNLq4s6IDGg) | 16-01-2014 | 22:01 |
| T2E6, *Cursillo de historia chibchombiana, parte 1* | [Video](https://www.youtube.com/watch?v=zRVNV0g4j5E) | 17-03-2014 | 20:13 |
| T3E1, *Al mal tiempo mala cara, parte 1* | [Video](https://www.youtube.com/watch?v=VFnGze1kn_0) | 11-12-2013 | 18:07 |
| T4E1, *El crimen organizado y civilizado, parte 1* | [Video](https://www.youtube.com/watch?v=aitBOWrOon4) | 11-12-2013 | 19:35 |

Las fechas son de publicación en YouTube. El corpus no permite asignar la fecha de emisión televisiva.

Huellas de las transcripciones locales: T1 `69782451770b6c3589ce5a8310f689acdf9d4094fa48f7f52a6b400cdb542597`; T2 `6e1bb6a240f4380fe0969413238a2d049ad269dd7509658798f50fd71bada34f`; T3 `e44bfbfc708252603544e638bdd5c0fc9bb112ad0fcbe13d77ad2e07dad3b21a`; T4 `a75b17237fcdd023cbadbe885fc65b096ecc2872525022d694c5defac1788427`.

## Modelo

`D_e` es duración en segundos; `W_e`, palabras reconocidas; `V_e = 60W_e/D_e`, palabras por minuto; `C_e`, candidatos a chiste en una ventana de 180 segundos; `J = ΣC_e/12`, candidatos por minuto.

La limpieza elimina marcas `[MM:SS]` y etiquetas entre corchetes. Un token es una secuencia alfanumérica con tildes y guiones internos.

## Ritmo verbal

| Muestra | Líneas | Palabras | Palabras/minuto |
|---|---:|---:|---:|
| T1E1 | 488 | 2.876 | 130,63 |
| T2E6 | 401 | 2.379 | 117,68 |
| T3E1 | 401 | 2.699 | 148,98 |
| T4E1 | 415 | 2.644 | 135,01 |
| Total ponderado | 1.705 | 10.598 | 132,59 |

Media simple: 133,07 palabras/minuto. Desviación estándar muestral: 12,91. Rango: 117,68–148,98. La cifra incluye canción, cortinillas y silencios dentro del denominador; no mide velocidad oral aislada.

## Bloques, cabezote y cortinillas

T1E1 y T2E6 contienen tres pares explícitos de salida y regreso. Los ocho bloques observados duran en promedio 269,25 segundos, con desviación estándar de 49,13 y rango 182–335. Los seis intervalos entre salida y regreso duran 14,00 segundos en promedio, desviación 1,10. Ese intervalo dentro del archivo publicado no equivale a la tanda comercial original.

T1E1: 01:31–06:20; 06:34–12:09; 12:22–16:06; 16:19–20:56. T2E6: 01:15–04:17; 04:33–09:51; 10:05–14:25; 14:39–19:08. T3E1 y T4E1 tienen cero marcadores textuales equivalentes: `TODO(dato)` para cortes originales.

T1 conserva canción de apertura y “hoy presentamos”; T2 añade descargo de ficción, identificación y canción; T3 y T4 comienzan con “hoy presentamos”. La ausencia de canción en dos archivos no demuestra una ausencia en emisión.

## Mecánica y personajes

El montaje observado sigue este flujo:

```text
hecho o producto mediático
→ conversación de Martín y Santiago
→ imitación, personaje-tipo o dramatización
→ regreso a la emisora y nuevo material
```

La pareja de locutores convierte llamadas, prensa y televisión en escenas. La emisora junta material heterogéneo y evita fingir neutralidad periodística.

Martín y Santiago aparecen como locutores y participantes. Cerdo aparece 17 veces en T1 y 4 en T2: presencia grotesca que degrada la solemnidad. DJ Tátara aparece en T1 y T3 como figura que entrega información o disciplina. George Barón dramatizado organiza T4. Presidente y asesores organizan T3. Solo Cerdo, Tátara, Martín y Santiago cumplen recurrencia entre episodios dentro de esta muestra.

“Hoy presentamos” aparece en 4 de 4 episodios. La preparación del tema o llamada aparece directamente en 3 de 4. Las cortinillas de salida y regreso aparecen en 2 de 4 archivos.

## Densidad preliminar de chistes

Una unidad cuenta cuando presenta inversión, juego léxico, escalamiento grotesco o choque entre personaje e institución. Repeticiones dentro del mismo desarrollo cuentan una vez. Se midieron los primeros 180 segundos posteriores a “hoy presentamos”.

| Muestra | Candidatos | Densidad/minuto |
|---|---:|---:|
| T1E1 | 8 | 2,67 |
| T2E6 | 9 | 3,00 |
| T3E1 | 10 | 3,33 |
| T4E1 | 9 | 3,00 |
| Total, 12 minutos | 36 | 3,00 |

Dispersión entre ventanas: 0,27 candidatos/minuto. Rango: 2,67–3,33. El acuerdo entre codificadores queda pendiente: `κ = TODO(dato)`. El umbral estilístico no se fijó antes del conteo, por eso esta corrida es línea base. Umbral de validez para la siguiente fase: seis episodios completos por temporada y `κ ≥ 0,70`.

## Grotesco y argumento

El patrón `institución → cuerpo o suciedad → consecuencia política` aparece en 4 de 4 episodios observados. T1 usa comida y cerdo para entrar a los premios televisivos; T2 usa cuerpos como alfombra para tratar la élite santafereña; T3 pasa de fumigación y deuda a maquillaje institucional; T4 enlaza temblores, payasos y explosivos con ayuda militar y conversaciones de paz. La fracción tiene denominador. No representa toda la serie.

## Error, sanidad y costo

La resolución de duración publicada es un segundo. `σ_ASR = desconocida` para la transcripción automática. `σ_población = desconocida`: hubo un codificador y cuatro ventanas por posición.

Las duraciones son positivas; con `W_e = 0`, `V_e = 0`. La suma da 4.796 segundos. La tasa ponderada queda entre mínimo y máximo. `36 / 12 = 3,00`; la cuenta cierra.

El conteo cuesta `O(C)` tiempo. Una lectura por flujo usa `O(1)` memoria adicional; esta corrida cargó los archivos y usó `O(C)`. Terminó en menos de 0,1 segundos. `TODO(dato)`: horas de revisión, segunda codificación, costo monetario y seis episodios completos por temporada.

El patrón está visible. La temporada completa sigue sin medir.
