import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolverVesiculasRobusto, equilibrioVesicular, concentracionLimpieza,
  acotarLimpieza, predecirLimpiezaAcotada, estimarLimpiezaPuntual,
  resolverCircuitoRobusto, resolverInhibicion, analizarCircuito } from '../activos/modelos-neuro.js';

const base = new URL('../', import.meta.url);
const protocoloTexto = await readFile(new URL('docs/neuro-protocolo.json', base), 'utf8');
const protocolo = JSON.parse(protocoloTexto);
const fuente = await readFile(new URL('activos/modelos-neuro.js', base), 'utf8');
let semilla = protocolo.semilla >>> 0;
/** O(1). Generador xorshift32 reproducible; no representa ruido fisiológico medido. */
function uniforme() { semilla ^= semilla << 13; semilla ^= semilla >>> 17; semilla ^= semilla << 5; return (semilla >>> 0) / 4294967296; }
/** O(N) tiempo/O(1) extra. Dispersión muestral, N−1 en el denominador. */
function estadisticas(xs) {
  if (!xs.length) return { n: 0, media: null, desviacionMuestral: null, min: null, max: null };
  const media = xs.reduce((a, b) => a + b, 0) / xs.length;
  return { n: xs.length, media,
    desviacionMuestral: xs.length > 1 ? Math.sqrt(xs.reduce((s, x) => s + (x - media) ** 2, 0) / (xs.length - 1)) : null,
    min: Math.min(...xs), max: Math.max(...xs) };
}
/** O(P). Contención convexa; se escala V a μM/s para evitar unidades muy dispares. */
function contiene(vertices, punto) {
  if (!vertices.length) return false;
  let signo = 0;
  for (let j = 0; j < vertices.length; j++) {
    const a = vertices[j], b = vertices[(j + 1) % vertices.length];
    const cruz = 1000 * ((b.km - a.km) * (punto.vmax - a.vmax) - (b.vmax - a.vmax) * (punto.km - a.km));
    if (Math.abs(cruz) > 1e-10) { if (signo && Math.sign(cruz) !== signo) return false; signo = Math.sign(cruz); }
  }
  return true;
}

const pSin = protocolo.sinapsis;
const sinapsis = resolverVesiculasRobusto(pSin);
let cumpleNominal = 0, cumpleAcotado = 0;
const rejillaSinapsis = [];
for (let i = 0; i < pSin.puntosPorEje; i++) for (let j = 0; j < pSin.puntosPorEje; j++) {
  const u = pSin.uMin + (pSin.uMax - pSin.uMin) * i / (pSin.puntosPorEje - 1);
  const tauMs = pSin.tauMinMs + (pSin.tauMaxMs - pSin.tauMinMs) * j / (pSin.puntosPorEje - 1);
  const qNominal = equilibrioVesicular({ u, tauMs, deltaMs: sinapsis.nominalMs }).liberacionEstacionaria;
  const qAcotado = equilibrioVesicular({ u, tauMs, deltaMs: sinapsis.deltaMinMs }).liberacionEstacionaria;
  cumpleNominal += Number(qNominal >= pSin.objetivo - 1e-12);
  cumpleAcotado += Number(qAcotado >= pSin.objetivo - 1e-12);
  rejillaSinapsis.push({ u, tauMs, qNominal, qAcotado });
}

const pCir = protocolo.circuito;
const circuito = resolverCircuitoRobusto(pCir);
const nominalCir = resolverInhibicion({ w: (pCir.wMin + pCir.wMax) / 2, h: (pCir.hMin + pCir.hMax) / 2,
  tauEMs: (pCir.tauEMinMs + pCir.tauEMaxMs) / 2, tauIMs: (pCir.tauIMinMs + pCir.tauIMaxMs) / 2, margen: pCir.margen });
const esquinasCircuito = [];
for (const w of [pCir.wMin, pCir.wMax]) for (const h of [pCir.hMin, pCir.hMax])
for (const tauEMs of [pCir.tauEMinMs, pCir.tauEMaxMs]) for (const tauIMs of [pCir.tauIMinMs, pCir.tauIMaxMs]) {
  const nominal = analizarCircuito({ w, h, tauEMs, tauIMs, g: nominalCir.gMin });
  const acotado = analizarCircuito({ w, h, tauEMs, tauIMs, g: circuito.gMin });
  esquinasCircuito.push({ w, h, tauEMs, tauIMs,
    nominal: { maxReal: nominal.maxReal, estable: nominal.estable, margenDeterminante: nominal.margenDeterminante },
    acotado: { maxReal: acotado.maxReal, estable: acotado.estable, margenDeterminante: acotado.margenDeterminante } });
}

const casos = [], c0 = protocolo.c0MicroM, epsilon = protocolo.ruidoAbsolutoMicroM;
const verticesPrior = acotarLimpieza({ c0, mediciones: [], kmMin: protocolo.priorKm[0], kmMax: protocolo.priorKm[1], vmaxMin: protocolo.priorVmax[0], vmaxMax: protocolo.priorVmax[1] }).vertices;
const prediccionPrior = predecirLimpiezaAcotada({ c0, vertices: verticesPrior, tMs: protocolo.tiempoPrediccionMs });
for (let id = 0; id < protocolo.casos; id++) {
  const km = protocolo.rangoVerdadKm[0] + uniforme() * (protocolo.rangoVerdadKm[1] - protocolo.rangoVerdadKm[0]);
  const vmax = protocolo.rangoVerdadVmax[0] + uniforme() * (protocolo.rangoVerdadVmax[1] - protocolo.rangoVerdadVmax[0]);
  const mediciones = protocolo.tiemposMedicionMs.map(tMs => {
    const verdadero = concentracionLimpieza({ c0, km, vmax, tMs });
    const error = (2 * uniforme() - 1) * epsilon, observado = verdadero + error;
    return { tMs, verdadero, observado, error, min: Math.max(0, observado - epsilon), max: Math.min(c0, observado + epsilon) };
  });
  const region = acotarLimpieza({ c0, mediciones, kmMin: protocolo.priorKm[0], kmMax: protocolo.priorKm[1], vmaxMin: protocolo.priorVmax[0], vmaxMax: protocolo.priorVmax[1] });
  const prediccion = predecirLimpiezaAcotada({ c0, vertices: region.vertices, tMs: protocolo.tiempoPrediccionMs });
  const verdadero = concentracionLimpieza({ c0, km, vmax, tMs: protocolo.tiempoPrediccionMs });
  let puntual = { fisico: false, motivo: 'La observación puntual queda fuera del dominio positivo.' };
  const dos = protocolo.comparadorPuntualIndices.map(i => ({ tMs: mediciones[i].tMs, c: mediciones[i].observado }));
  if (dos.every(p => p.c > 0 && p.c <= c0)) puntual = estimarLimpiezaPuntual({ c0, mediciones: dos });
  if (puntual.fisico) {
    puntual.prediccion = concentracionLimpieza({ c0, km: puntual.km, vmax: puntual.vmax, tMs: protocolo.tiempoPrediccionMs });
    puntual.errorAbsoluto = Math.abs(puntual.prediccion - verdadero);
  }
  casos.push({ id, verdad: { km, vmax }, mediciones, region, prediccion, verdadero, puntual,
    contieneParametros: contiene(region.vertices, { km, vmax }),
    contienePrediccion: !prediccion.vacio && verdadero >= prediccion.min - protocolo.umbralToleranciaMicroM && verdadero <= prediccion.max + protocolo.umbralToleranciaMicroM,
  });
}
const anchuras = casos.map(c => c.prediccion.vacio ? null : c.prediccion.max - c.prediccion.min).filter(x => x !== null);
const anchoPrior = prediccionPrior.max - prediccionPrior.min;
const resumen = {
  sinapsis: { ...sinapsis, total: rejillaSinapsis.length, cumpleNominal, cumpleAcotado, objetivo: pSin.objetivo, unidadIntervalo: 'ms', unidadLiberacion: 'fracción del reservorio total' },
  circuito: { ...circuito, gNominal: nominalCir.gMin, total: esquinasCircuito.length,
    establesNominal: esquinasCircuito.filter(c => c.nominal.estable).length,
    establesAcotado: esquinasCircuito.filter(c => c.acotado.estable).length,
    cumplenMargenNominal: esquinasCircuito.filter(c => c.nominal.margenDeterminante >= pCir.margen - 1e-12).length,
    cumplenMargenAcotado: esquinasCircuito.filter(c => c.acotado.margenDeterminante >= pCir.margen - 1e-12).length,
    peorMaxRealAcotado: Math.max(...esquinasCircuito.map(c => c.acotado.maxReal)), unidadAutovalor: 'ms⁻¹', unidadGanancia: 'adimensional' },
  limpieza: { total: casos.length, parametrosContenidos: casos.filter(c => c.contieneParametros).length,
    prediccionesContenidas: casos.filter(c => c.contienePrediccion).length, regionesVacias: casos.filter(c => c.region.vacio).length,
    prediccionPrior, anchoPrior, anchuraPoligono: estadisticas(anchuras),
    fraccionAnchuraPrior: estadisticas(anchuras.map(w => w / anchoPrior)),
    anchurasMayoresAlPrior: anchuras.filter(w => w > anchoPrior + protocolo.umbralToleranciaMicroM).length,
    estimacionesPuntualesFisicas: casos.filter(c => c.puntual.fisico).length,
    errorPuntualAbsoluto: estadisticas(casos.filter(c => c.puntual.fisico).map(c => c.puntual.errorAbsoluto)),
    puntualDentroEpsilon: casos.filter(c => c.puntual.fisico && c.puntual.errorAbsoluto <= epsilon).length,
    denominadorPuntual: casos.length, unidadConcentracion: 'μM',
  },
};
const cumpleProtocolo = resumen.limpieza.parametrosContenidos === protocolo.casos
  && resumen.limpieza.prediccionesContenidas === protocolo.casos && resumen.limpieza.anchurasMayoresAlPrior === 0
  && cumpleAcotado === rejillaSinapsis.length && resumen.circuito.cumplenMargenAcotado === esquinasCircuito.length;
const resultado = { version: protocolo.version, fecha: protocolo.fecha, naturaleza: 'Experimento sintético; no observaciones biológicas.',
  prioridadCientifica: protocolo.prioridadCientifica, cumpleProtocolo,
  hashFuenteSHA256: createHash('sha256').update(fuente).digest('hex'), hashProtocoloSHA256: createHash('sha256').update(protocoloTexto).digest('hex'),
  algoritmoAleatorio: 'xorshift32; uniforme [0,1); semillas y rangos fijados en protocolo',
  protocolo, resumen, rejillaSinapsis, esquinasCircuito, casos,
  limitaciones: ['C0 conocida exactamente.', 'Ruido realmente acotado; los valores atípicos fuera de la cota invalidan la garantía.', 'Modelo saturable de un compartimento, sin difusión ni liberación adicional.', 'Parámetros de cada caja independientes y constantes.', 'Proposiciones en aritmética real; implementación Float64 sin redondeo dirigido.', 'Sin comparación contra estimadores publicados del estado del arte.', 'Prioridad científica no establecida; no constituye solución de la mente ni una aplicación clínica.'] };
const destino = new URL('activos/resultados-neuro.json', base);
await writeFile(destino, JSON.stringify(resultado, null, 2) + '\n');
console.log(JSON.stringify({ archivo: fileURLToPath(destino), cumpleProtocolo, resumen }, null, 2));
if (!cumpleProtocolo) process.exitCode = 1;
