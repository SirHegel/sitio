---
titulo: "Abelardo y la coca: 330.000 hectáreas contra 261.386 medidas"
categoria: "Análisis"
fecha: "2026-08-28"
resumen: "Auditoría de la política de drogas de Abelardo de la Espriella: promesa de fumigación, línea base SIMCI, primeros resultados, límites jurídicos, nueve poderes del Estado y la cuenta que todavía falta."
etiquetas: ["Abelardo de la Espriella", "política de drogas", "coca", "Colombia", "Estado", "eutaxia", "seguridad"]
---

El [24 de junio de 2026 el Consejo Nacional Electoral declaró presidente a Abelardo de la Espriella](https://www.cne.gov.co/resoluciones-cne-2026/cne-dgc-aceg-029557-2026-gen) con 12.960.166 votos. Iván Cepeda obtuvo 12.708.312. La diferencia definitiva fue de 251.854 votos, no el porcentaje redondeado del preconteo que todavía repiten algunas piezas. La Presidencia empezó el 7 de agosto. Tres semanas después ya había operativos, extradiciones y una montaña de verbos marciales. Faltaba la cuenta grande.

La campaña prometió fumigar 330.000 hectáreas de coca. El último dato oficial disponible mide 261.386.

Hay 68.614 hectáreas de diferencia. Eso equivale al 26,25 % de toda el área neta reportada por el Estado. El tigre arrancó cazando una presa más grande que el censo.

## La promesa y su denominador

El documento de campaña [*Lo que defendemos. Propuestas para desarrollo de gobierno 2026-2030*](https://propuestas.abelardopresidente.com.co/downloads/lo-que-defendemos-propuestas-2026-2030.pdf) plantea aspersión aérea, drones, erradicación manual y sustitución voluntaria. Añade bioherbicidas, bombardeos de precisión, presencia integral del Estado y cooperación con Estados Unidos e Israel. En el apartado de narcotráfico aparece la cifra: 330.000 hectáreas fumigadas con protección ambiental y campesina. La [campaña también fijó un plazo verbal de 18 meses](https://defensoresdelapatria.com/el-plan-de-de-la-espriella-para-acabar-con-la-coca-en-18-meses/).

El [Monitoreo de territorios con presencia de cultivos de coca 2024](https://www.minjusticia.gov.co/programas-co/ODC/Publicaciones/Publicaciones/Informe_monitoreo_cultivos_Colombia_2024.pdf), publicado por el Gobierno y UNODC el 25 de junio de 2026, registra 261.386 hectáreas al 31 de diciembre de 2024. En 2023 fueron 252.572. El aumento fue de 8.814 hectáreas, 3,49 % con el denominador de 2023; el informe redondea a 3,5 %.

La misma fuente reporta 9.403 hectáreas de erradicación manual forzosa durante 2024, 889.201 kilogramos de cocaína incautados y 5.226 infraestructuras destruidas. Las hectáreas crecieron. Las incautaciones también. Primera lección: actividad estatal y resultado territorial pueden moverse en direcciones distintas. Una incautación suma kilos; el área neta suma cultivos que sobrevivieron, nacieron o reaparecieron en otro lote.

El plazo de 18 meses exigiría intervenir 18.333 hectáreas mensuales para llegar a 330.000. La erradicación manual de 2024 promedió 784 hectáreas mensuales. La razón es 23,39. Son tecnologías distintas, por eso la comparación sirve como escala operativa y no como equivalencia de rendimiento. El programa no identifica flota, agente biológico, dosis por hectárea ni presupuesto.

La cifra de campaña conserva otra maña: habla de hectáreas tratadas y deja borrosa la unidad de éxito. Fumigar una hectárea dos veces produce dos hectáreas operativas en ciertos reportes y una sola hectárea física. La resiembra puede devolverla al inventario. El desplazamiento puede abrir otra. Chibchombia conoce ese milagro contable: la misma hectárea trabaja doble turno y cobra horas extra.

## El modelo que sí permite auditar

Uso un balance de existencias. Cabe en una línea:

```text
H(t+1) = max(0, H(t) + N(t) + R(t) - E(t) - S(t))
```

`H(t)` es el área neta con coca al cierre del periodo, en hectáreas, con rango `H ≥ 0`. `N(t)` mide nueva siembra y desplazamiento hacia zonas antes limpias, en hectáreas por periodo. `R(t)` es resiembra. `E(t)` registra erradicación que permanece efectiva al corte. `S(t)` representa sustitución sostenida y verificada. Todos usan la misma unidad y ventana temporal.

Los supuestos son cuatro. Primero: SIMCI mantiene una metodología comparable entre el año base y el año evaluado. Segundo: una hectárea entra una sola vez al área neta del corte. Tercero: erradicación y sustitución se descuentan únicamente cuando la coca dejó de estar presente en la medición posterior. Cuarto: un cambio de metodología se publica y se recalcula antes de atribuirlo al Gobierno.

Mi métrica objetivo es una: reducción porcentual del área neta SIMCI al 31 de diciembre de 2027.

```text
M = (261.386 - H_2027) / 261.386 × 100
```

La unidad es porcentaje de las 261.386 hectáreas medidas en 2024. El umbral queda fijado el 28 de agosto de 2026, antes de conocer `H_2027`: `M ≥ 10 %`. Eso exige `H_2027 ≤ 235.247` hectáreas, redondeado a la unidad. El umbral es editorial y permite juzgar dirección y escala; no pertenece al programa presidencial.

Como el horizonte supera doce meses, dejo los escenarios antes de la medición:

```text
bajo:  M = 3 %   → H_2027 = 253.544 ha
base:  M = 10 %  → H_2027 = 235.247 ha
alto:  M = 20 %  → H_2027 = 209.109 ha
```

No son pronósticos. Son cortes de evaluación. El Gobierno pasa o falla contra el dato que publique la misma serie.

La prueba de sanidad es seca. Si `E = 100`, `R = 100`, `N = 0` y `S = 0`, entonces `H(t+1) = H(t)`. Cien hectáreas fumigadas produjeron cero reducción neta. Si todos los flujos valen cero, el área queda igual. Si las salidas exceden el inventario, `max(0, …)` impide hectáreas negativas, prodigio reservado para una rendición de cuentas creativa.

El error no cabe debajo de la alfombra. El informe 2024 publica un valor puntual y no entrega una banda simple de incertidumbre para el total nacional: `σ_área = desconocida`. El componente de producción de cocaína quedó sin estimación comparable porque el propio informe reconoció que la metodología no capturaba adecuadamente los cambios territoriales. `σ_producción = desconocida`. Convertir hectáreas fumigadas en toneladas evitadas sería fabricar el coeficiente que falta.

## El mapa cobra distinto

El [informe SIMCI 2024](https://www.minjusticia.gov.co/programas-co/ODC/Publicaciones/Publicaciones/Informe_monitoreo_cultivos_Colombia_2024.pdf) ubica 64 % del área medida en Nariño, Norte de Santander y Putumayo. Sobre el total de 261.386 hectáreas, la magnitud equivalente es cercana a 167.287. El dato no convierte esos departamentos en una mancha homogénea. Catatumbo tiene frontera, corredores armados y una historia de sustitución; Tumaco combina costa, ríos y territorios colectivos; Putumayo carga otra infraestructura y otra relación con Ecuador. Una tarifa nacional por hectárea escondería esa heterogeneidad debajo de un promedio.

El informe también ubica 53 % del área en zonas de manejo especial: tierras de comunidades negras, resguardos indígenas, reservas forestales, parques y zonas de reserva campesina. Son unas 138.535 hectáreas al aplicar la proporción al total nacional; el valor es una conversión aritmética, no un nuevo censo espacial. Allí entran consulta, participación, restricción ambiental y logística diferenciada. La política uniforme se rompe con el primer mapa.

La Fundación Ideas para la Paz examinó las propuestas presidenciales en [*Drogas y elecciones: dos visiones enfrentadas y diez apuestas para no repetir errores*](https://ideaspaz.org/publicaciones/investigaciones-analisis/2026-06/drogas-y-elecciones-dos-visiones-enfrentadas-y-10-apuestas-para-no-repetir-errores). Su lectura ubica a De la Espriella en control territorial, fumigación, fuerza pública y persecución de capital ilícito. También identifica vacíos en desarrollo, consumo, microtráfico y finanzas criminales. El diagnóstico coincide con la distribución del programa: detalle coercitivo, instrumentos sociales sin cantidad.

El costo mínimo necesita otra ecuación:

```text
C_total = Σ(H_i × c_i) + C_monitoreo + C_consulta + C_reparación
```

`H_i` son hectáreas tratadas por modalidad y territorio; `c_i`, pesos por hectárea; los tres términos restantes cubren medición, participación y daños. El programa no publica ninguno. `C_total = TODO(dato)`. El [programa amplio alojado por La Silla Vacía](https://www.lasillavacia.com/wp-content/uploads/2026/04/Programa_de_gobierno_Abelardo_de_la_Espriella_2026_2030-1.pdf) situó entre 8 y 12 billones de pesos una bolsa llamada Plan Colombia II dentro de sus fuentes financieras, sin separar cooperación, crédito, gasto nacional o destinación antidrogas. Usar ese rango como presupuesto de fumigación falsearía la unidad.

Las dos variables que más mueven el costo son `c_i` y la repetición por resiembra. Una subida de 10 % en `c_i` aumenta 10 % el componente `H_i × c_i`. Una hectárea tratada dos veces duplica ese componente y puede conservar una sola unidad de reducción neta. Sensibilidad simple. La factura ya dejó de ser simple.

## Nueve poderes entran al sembrado

Gustavo Bueno organiza la sociedad política en nueve poderes dentro de *Primer ensayo sobre las categorías de las «ciencias políticas»*, Pentalfa, Oviedo, 1991. La política de drogas muestra la utilidad de esa tabla porque obliga a salir del Palacio de Nariño.

En la capa conjuntiva, el poder ejecutivo dirige operaciones y presupuesto. El legislativo autoriza gasto, reforma normas y controla al Gobierno. El judicial fija límites, decide casos y procesa tráfico, lavado o extinción de dominio. De la Espriella ha cargado la voz sobre el ejecutivo. Los otros dos ya están sentados en la cabina, aunque el locutor finja que salió a comerciales.

La capa basal contiene la materia que mantiene al país. El poder gestor pone vías, salud, escuelas, catastro y presencia civil. El planificador decide dónde intervenir, con qué secuencia y qué indicador manda. El redistribuidor mueve renta, tierra y activos incautados para que la economía legal pueda contratar donde hoy contrata la coca. Una aspersión sin capa basal libera un lote y conserva el sistema de incentivos que lo sembró.

La capa cortical trata la relación con fuerzas exteriores. El poder militar enfrenta organizaciones armadas y protege equipos. El federativo coordina Nación, departamentos, municipios y autoridades territoriales. El diplomático negocia extradición, inteligencia, insumos y cooperación. El programa ofrece bastante músculo militar y diplomático. La articulación federativa aparece como puestos de mando. El costo basal sigue escrito con tinta invisible.

La eutaxia permite juzgar el conjunto: continuidad material de la sociedad política, control territorial que dura y capacidad de reproducir la vida común. Una caída momentánea seguida de resiembra es distaxia aplazada. Una cifra de capturas sin justicia que condene es operación sin estructura. Un campesino que pierde coca y conserva deuda, trocha y comprador único recibe al Estado en forma de helicóptero. Mala primera impresión.

## Fumigar tiene expediente

La promesa habla de bioherbicidas. No identifica el producto. `TODO(dato)`: agente biológico, fabricante, registro ICA, dosis por hectárea, toxicología, costo y protocolo de deriva. Sin esos campos, la palabra “bio” cumple la función que cumple “artesanal” en una hamburguesa de centro comercial: sube la tranquilidad y todavía no informa la composición.

El cambio de sustancia tampoco borra el Derecho. La [Sentencia T-236 de 2017](https://www.corteconstitucional.gov.co/relatoria/2017/t-236-17.htm) exige precaución, participación, evaluación de riesgo y protección de comunidades ante la aspersión con glifosato. El [Auto 387 de 2019](https://www.corteconstitucional.gov.co/relatoria/autos/2019/a387-19.htm) reclama regulación independiente, revisión continua y mecanismos imparciales de queja. El método, el territorio y la evidencia toxicológica determinan el trámite de un nuevo agente.

Colombia ya autorizó en diciembre de 2025 una modalidad focalizada con drones a unos 1,5 metros del dosel. El [Ministerio de Justicia la definió como aspersión terrestre controlada](https://www.minjusticia.gov.co/Sala-de-prensa/Paginas/Gobierno-autoriza-erradicacion-focalizada-de-cultivos-ilicitos-con-drones-bajo-estrictos-controles-ambientales-y-tecnicos.aspx), sujeta al plan ambiental y a supervisión de ANLA. Esa experiencia ofrece una ruta técnica. No autoriza por arrastre una campaña masiva con un insumo todavía innominado.

Luis Carlos Martín Jiménez explica en *La esencia del Derecho. Filosofía materialista de las categorías jurídicas*, Pentalfa, 2021, que los principios jurídicos funcionan como generalizaciones y operaciones procesales, no como axiomas flotantes. Aquí se ve sin catecismo: la precaución vale por los procedimientos que obliga a ejecutar, la prueba que exige y la reclamación que permite. Decir “protección estricta” en un PDF no ejecuta ninguno.

El costo público permanece abierto. La campaña dijo que los bioherbicidas costarían tres veces el glifosato y omitió precio base, unidad y producto. `TODO(dato)`: pesos por hectárea para avión, dron, equipo manual y sustitución; horas de vuelo; personal; monitoreo ambiental; consulta previa; indemnizaciones; restauración. Un presupuesto sin esas partidas es un tráiler de *El Paseo*: promete movimiento, familia y desastre; la factura aparece al final.

## La dosis personal y la moral de decreto

El programa recuerda que la Corte reconoció en 1994 el porte y consumo de dosis personal. Después califica la droga como problema moral, social y de seguridad nacional. La frase construye enemigo. El mecanismo jurídico queda vacío.

La [Sentencia C-221 de 1994](https://www.corteconstitucional.gov.co/Relatoria/1994/C-221-94.htm) retiró las sanciones sobre conductas confinadas al ámbito personal. La [C-491 de 2012](https://www.corteconstitucional.gov.co/relatoria/2012/c-491-12.htm) reiteró que el porte para consumo personal no entra automáticamente al castigo penal; la finalidad de distribución sigue siendo punible incluso por debajo de los topes. Una orden presidencial no revoca sentencias constitucionales.

El Gobierno necesita presentar norma, población objetivo, instrumento de salud y criterio territorial. Al 28 de agosto no encontré un proyecto oficial que modifique el régimen de dosis personal. `TODO(dato)`: texto normativo, autoridad competente, presupuesto de prevención, tratamiento, salud mental, reducción de daños y reintegración.

Esa ausencia rompe el programa por el lado de la demanda. La oferta recibe aviones y drones. El consumo recibe una censura moral. El barrio donde se vende, se consume y se recluta queda esperando al funcionario que debía traer un indicador.

## La economía criminal no vive en una mata

Luis Carlos Martín Jiménez, en *El mito del capitalismo. Filosofía de la moneda y del comercio*, Pentalfa, 2020, obliga a mirar moneda, propiedad y circuitos de intercambio antes de bautizar cualquier transacción como “mercado”. La coca colombiana articula crédito informal, compra armada, insumos desviados, transporte, lavado y demanda exterior. La mata constituye un eslabón visible. El dinero manda la procesión.

El programa acierta cuando conecta narcotráfico con minería ilegal, extorsión, contrabando y tráfico de armas. La persecución patrimonial y la extinción de dominio entran ahí. Faltan dos números que deciden si la ofensiva toca la renta: valor anual de activos ocupados que termina en sentencia y proporción de flujos financieros trazados hasta beneficiario final.

La serie de televisión *Escobar, el patrón del mal* educó al país en una dramaturgia cómoda: muerto el jefe, llegan créditos y música de cierre. La cadena económica no mira televisión. Cambia operador, ruta o producto. Capturar cabecillas puede reducir capacidad armada; medir la economía exige seguir dinero, reemplazos y precios territoriales.

## Lo ejecutado en veintiún días

La primera etapa muestra actividad real. La [Presidencia informó el 23 de agosto](https://www.presidencia.gov.co/prensa/Paginas/En-15-dias-Fuerza-Publica-incauto-mas-de-12-toneladas-de-cocaina-y-capturo-a-1574-narcotraficantes-260823.aspx) que en quince días se incautaron 12.296 kilogramos de cocaína, 11.232 de marihuana y 114 de base de coca; también reportó 162 infraestructuras destruidas o inhabilitadas, 1.574 capturas y 81 bienes ocupados por 71.886 millones de pesos. Otro [balance oficial del 26 de agosto](https://www.presidencia.gov.co/prensa/Paginas/Mas-de-30-extradiciones-ha-firmado-el-Presidente-en-tan-solo-16-dias-260826.aspx) elevó el agregado y señaló más de 30 extradiciones firmadas.

Son cifras del Gobierno. Falta auditoría independiente y definición estable entre cortes. Sirven como indicadores de producto: kilos, capturas, bienes y actos firmados. Mi métrica de resultado sigue intacta: hectáreas netas al cierre de 2027.

El 26 de agosto el presidente anunció sometimiento a la justicia como vía para organizaciones armadas y descartó mesas que sustituyan la acción judicial. El 27 de agosto informó un bombardeo en El Retorno, Guaviare, con ocho muertos en balance preliminar. La rama operativa cortical arrancó. La política de bioherbicidas continuaba sin decreto, producto o contrato público identificado.

Tampoco apareció un acto que sustituyera la Política Nacional de Drogas 2023-2033. El Gobierno tiene discurso, operaciones iniciales y una promesa territorial. El Plan Nacional de Desarrollo 2026-2030 todavía estaba en elaboración durante agosto. La arquitectura normativa llegará después, si llega.

## La cuenta del tigre

Yo evaluaría esta política con cinco controles publicados en una misma página: área neta SIMCI, resiembra, sustitución sostenida, costo por hectárea efectiva y activos criminales con decisión judicial. Este texto conserva una sola métrica objetivo; los otros cuatro explican el mecanismo y evitan celebrar una reducción comprada con daño desplazado.

La sensibilidad dominante está en `R`, resiembra, y `N`, nueva siembra. Si ambas suben 10.000 hectáreas y la erradicación efectiva permanece igual, `H` aumenta 20.000. El modelo responde linealmente: una hectárea adicional en cualquiera de esos flujos agrega una hectárea al cierre. La segunda sensibilidad está en la eficacia de `E`: hectárea rociada y hectárea ausente en el siguiente censo son objetos distintos.

El programa ofrece coerción con nombre y apellido. La sustitución llega en una línea. La prevención ni siquiera trae cédula. El Estado de nueve poderes aparece reducido a helicóptero, fiscal y cancillería, con el gestor rural llegando tarde en una moto prestada.

Puede funcionar una ofensiva que una fuerza, justicia, renta y capa basal. Todavía no está escrita con ese nivel de detalle. El primer examen será simple: 235.247 hectáreas o menos en 2027, con método comparable y costo publicado.

330.000 fue la consigna. 261.386 es el país medido. Entre ambas cifras cabe un gobierno entero.
