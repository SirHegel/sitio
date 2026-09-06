import React, { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { ExpressionSpecification, FilterSpecification, Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./MapaOro.css";

/* Encuadres del mapa territorial. Las tres coordenadas son las anclas OSM ya
   publicadas en /data/oro/legal.geojson: nodos abiertos de OpenStreetMap, no
   vértices de expediente. El estudio no publica perímetros exactos porque las
   geometrías del FeatureServer ANM y los servicios Nexus no tienen licencia
   afirmativa de reutilización; el zoom 11 muestra la zona, no el polígono. */
const FOCOS_TERRITORIO = [
  { id: "general", nombre: "Vista general", lng: -78.7, lat: 8.6, zoom: 4.3 },
  { id: "mina-walter", nombre: "Mina Walter", lng: -74.4738996, lat: 8.2956227, zoom: 11 },
  { id: "agataes", nombre: "Serranía de los Agataes", lng: -73.5895841, lat: 6.1785935, zoom: 11 },
  { id: "crucitas", nombre: "Crucitas", lng: -84.333147, lat: 10.8882234, zoom: 11 },
] as const;

const FAMILIAS = [
  "legal",
  "huella",
  "delta",
  "proteccion",
  "agua",
  "tension",
  "buffers",
  "rutas",
  "eventos",
] as const;

type Familia = typeof FAMILIAS[number];
type Vista = "territorio" | "mundo";
type Pesos = { w1: number; w2: number; w3: number; w4: number; w5: number };
type EscenarioPesos = { id: string; nombre: string; pesos: Pesos; alcance: string };

type Capa = {
  id: string;
  nombre: string;
  familia: Familia;
  url: string;
  color: string;
  geometria: "fill" | "line" | "circle" | "heatmap";
  fuente: string;
  enlaceFuente: string;
  fecha: string;
  licencia: string;
  licenciaMaterialPropio: string;
  derechosGeometria: string;
  descarga: { habilitada: boolean; motivo: string };
  sha256: string;
  temporal?: { minimo: number; maximo: number; campo: string; valores: number[] };
  vista?: Vista | "ambas";
  estadoDatos?: string;
  entidades?: number;
  variablesDisponibles?: string[];
  escenariosPesos?: EscenarioPesos[];
};

type CalidadEscena = {
  pixelesTotales: number;
  pixelesClaros: number;
  pixelesSinObservacionClara: number;
  pixelesNodata: number;
  porcentajeClaroSobreTotal: number;
};
type Escena = {
  url: string;
  fecha: string;
  alt: string;
  fuente: string;
  enlaceFuente: string;
  sha256: string;
  tamanoBytes: number;
  ancho: number;
  alto: number;
  crs: string;
  extensionM: [number, number, number, number];
  escenas: string[];
  calidad: CalidadEscena;
};
type Comparacion = {
  id: string;
  titulo: string;
  antes: Escena;
  despues: Escena;
  metodo: string;
  advertencia: string;
  licencia: string;
  licenciaUrl: string;
  bandasRgb: string[];
  estiramientoDn: Record<string, { min: number; max: number }>;
  mascaraVisual: { id: string; etiqueta: string; color: string }[];
  crs: string;
  extensionM: [number, number, number, number];
  resolucionFuenteM: [number, number];
  vista?: Vista | "ambas";
};

type Manifiesto = {
  version: number;
  corte: string;
  estiloBase: string;
  centro: { territorio: [number, number, number]; mundo: [number, number, number] };
  capas: Capa[];
  comparaciones: Comparacion[];
};

const PESOS_BASE: Pesos = { w1: 0.2, w2: 0.2, w3: 0.2, w4: 0.2, w5: 0.2 };
const ETIQUETAS_PESO: Record<keyof Pesos, string> = {
  w1: "Desplazamiento",
  w2: "Violencia",
  w3: "Agua",
  w4: "Protección",
  w5: "Cobertura",
};
const VARIABLES_TENSION = ["D", "H", "A", "P", "C"] as const;
const SHA256 = /^[a-f0-9]{64}$/;
const COLOR_HEX = /^#[a-f0-9]{6}$/i;
const PLANTILLA_OSM = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ORDEN_DIBUJO: Record<Familia, number> = {
  buffers: 0,
  tension: 1,
  legal: 2,
  rutas: 3,
  huella: 4,
  delta: 5,
  proteccion: 6,
  agua: 7,
  eventos: 8,
};

// Fondo abierto y sin llave. Mantener el estilo en el paquete evita una
// petición de configuración antes del primer dibujo. OpenStreetMap Standard
// conserva su atribución visible dentro del control de MapLibre.
const ESTILO_INICIAL: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "fondo", type: "background", paint: { "background-color": "#10161d" } }],
};

const ATRIBUCION_BASE = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';

/** Complejidad O(1) temporal y espacial. Invariante: MapLibre solo se crea
 * cuando el navegador entrega un contexto WebGL 2 utilizable. */
function webgl2Disponible(): boolean {
  try {
    const prueba = document.createElement("canvas");
    return Boolean(prueba.getContext("webgl2", { failIfMajorPerformanceCaveat: true }));
  } catch {
    return false;
  }
}

/** Complejidad O(1); MapLibre gestiona las teselas visibles. Invariante: el
 * primer dibujo temático ya fue medido y la capa base queda por debajo de los
 * datos. */
function cargarBaseAbierta(
  mapa: MapLibreMap,
  elemento: HTMLDivElement,
  primeraCapa: string | undefined,
  plantilla: string,
): void {
  if (mapa.getSource("base-osm")) return;
  elemento.dataset.basemapState = "loading";
  elemento.dataset.basemapProvider = "OpenStreetMap Standard sin llave";
  mapa.addSource("base-osm", {
    type: "raster",
    tiles: [plantilla],
    tileSize: 256,
    maxzoom: 19,
    attribution: ATRIBUCION_BASE,
  });
  mapa.addLayer(
    { id: "base-osm", type: "raster", source: "base-osm", paint: { "raster-opacity": 0.78 } },
    primeraCapa,
  );
  const marcarCarga = () => {
    if (mapa.isSourceLoaded("base-osm")) {
      elemento.dataset.basemapState = "loaded";
      mapa.off("sourcedata", marcarCarga);
    }
  };
  mapa.on("sourcedata", marcarCarga);
  marcarCarga();
}

/** Complejidad O(1) temporal y espacial. Invariante: la salida suma 1 ± 1e-12. */
function normalizarPesos(pesos: Pesos): Pesos {
  const suma = Object.values(pesos).reduce((total, valor) => total + Math.max(0, valor), 0);
  if (suma === 0) return PESOS_BASE;
  return Object.fromEntries(
    Object.entries(pesos).map(([llave, valor]) => [llave, Math.max(0, valor) / suma]),
  ) as Pesos;
}

/** Complejidad O(1). Invariante: solo acepta las cinco claves publicadas y
 * una suma unitaria dentro de la tolerancia numérica declarada. */
function pesosValidos(valor: unknown): valor is Pesos {
  if (!valor || typeof valor !== "object") return false;
  const registro = valor as Record<string, unknown>;
  const claves = Object.keys(registro).sort();
  const esperadas = ["w1", "w2", "w3", "w4", "w5"];
  if (claves.length !== esperadas.length || claves.some((clave, indice) => clave !== esperadas[indice])) {
    return false;
  }
  const valores = esperadas.map((clave) => registro[clave]);
  if (!valores.every((item) => typeof item === "number" && Number.isFinite(item) && item >= 0 && item <= 1)) {
    return false;
  }
  return Math.abs(valores.map(Number).reduce((suma, item) => suma + item, 0) - 1) <= 1e-12;
}

/** Complejidad O(1). Invariante: compara las cinco coordenadas del vector. */
function pesosCoinciden(a: Pesos, b: Pesos): boolean {
  return (Object.keys(PESOS_BASE) as (keyof Pesos)[]).every((clave) => Math.abs(a[clave] - b[clave]) <= 1e-12);
}

/** Complejidad O(L log L), L=9. Invariante: polígonos de contexto quedan
 * debajo de líneas y puntos interactivos. */
function ordenarCapas(capas: Capa[]): Capa[] {
  return [...capas].sort((a, b) => ORDEN_DIBUJO[a.familia] - ORDEN_DIBUJO[b.familia]);
}

/** Complejidad O(1). Invariante: cada variable D,H,A,P,C ya fue filtrada a
 * [0,1]; una propiedad ausente nunca recibe el valor cero. */
function expresionValorTension(pesos: Pesos): ExpressionSpecification {
  return [
    "+",
    ["*", pesos.w1, ["get", "D"]],
    ["*", pesos.w2, ["get", "H"]],
    ["*", pesos.w3, ["get", "A"]],
    ["*", pesos.w4, ["get", "P"]],
    ["*", pesos.w5, ["get", "C"]],
  ];
}

/** Complejidad O(1). Invariante: una celda entra al índice únicamente cuando
 * las cinco variables existen, son numéricas y pertenecen a [0,1]. */
function filtroTensionCompleta(): FilterSpecification {
  return [
    "all",
    ...VARIABLES_TENSION.flatMap((campo) => [
      ["has", campo],
      ["==", ["typeof", ["get", campo]], "number"],
      [">=", ["get", campo], 0],
      ["<=", ["get", campo], 1],
    ]),
  ] as FilterSpecification;
}

/** Complejidad O(1). Invariante: una ficha marcada para una vista nunca se
 * dibuja en la otra; el filtro temporal conserva las demás restricciones. */
function filtroCapa(capa: Capa, vista: Vista, anio: number | null): FilterSpecification {
  const condiciones: FilterSpecification[] = [[
    "any",
    ["!", ["has", "vista"]],
    ["==", ["get", "vista"], "ambas"],
    ["==", ["get", "vista"], vista],
  ] as FilterSpecification];
  if (capa.familia === "tension") condiciones.push(filtroTensionCompleta());
  if (capa.temporal && anio !== null) {
    condiciones.push(["==", ["get", capa.temporal.campo], anio] as FilterSpecification);
  }
  return ["all", ...condiciones] as FilterSpecification;
}

/** Complejidad O(L). Invariantes: nueve familias únicas, archivos confinados
 * a /data/oro y hashes SHA-256 con forma válida. */
function validarManifiesto(datos: Manifiesto): Manifiesto {
  if (datos?.version !== 2 || datos.estiloBase !== PLANTILLA_OSM || !Array.isArray(datos.capas)) {
    throw new Error("manifiesto geográfico inválido");
  }
  for (const vista of ["territorio", "mundo"] as const) {
    const centro = datos.centro?.[vista];
    if (!Array.isArray(centro) || centro.length !== 3 || !centro.every(Number.isFinite)
      || centro[0] < -180 || centro[0] > 180 || centro[1] < -90 || centro[1] > 90
      || centro[2] < 0 || centro[2] > 22) {
      throw new Error(`centro cartográfico inválido: ${vista}`);
    }
  }
  const familias = new Set<Familia>();
  const ids = new Set<string>();
  for (const capa of datos.capas) {
    if (!FAMILIAS.includes(capa.familia) || familias.has(capa.familia)) {
      throw new Error("familias geográficas incompletas o duplicadas");
    }
    if (!capa.id || ids.has(capa.id)) throw new Error("identificador de capa repetido");
    if (!/^\/data\/oro\/[a-z0-9-]+\.geojson$/.test(capa.url) || capa.url.includes("..")) {
      throw new Error("ruta de capa fuera del directorio público");
    }
    if (!capa.nombre || !capa.fuente || !/^https:\/\//.test(capa.enlaceFuente)
      || !/^\d{4}-\d{2}-\d{2}$/.test(capa.fecha) || !COLOR_HEX.test(capa.color)
      || !["fill", "line", "circle", "heatmap"].includes(capa.geometria)
      || (capa.vista && !["territorio", "mundo", "ambas"].includes(capa.vista))) {
      throw new Error("metadatos visuales de capa inválidos");
    }
    if (!SHA256.test(capa.sha256)) throw new Error("SHA-256 de capa inválido");
    if (!capa.licencia || !capa.licenciaMaterialPropio || !capa.derechosGeometria
      || typeof capa.descarga?.habilitada !== "boolean" || !capa.descarga.motivo) {
      throw new Error("licencia o decisión de descarga incompleta");
    }
    if (capa.temporal) {
      const { minimo, maximo, campo, valores } = capa.temporal;
      if (!Number.isInteger(minimo) || !Number.isInteger(maximo) || minimo > maximo
        || !/^[a-z_][a-z0-9_]*$/i.test(campo)
        || !Array.isArray(valores) || valores.length < 1
        || valores.some((valor) => !Number.isInteger(valor) || valor < minimo || valor > maximo)
        || valores.some((valor, indice) => indice > 0 && valor <= valores[indice - 1])
        || valores[0] !== minimo || valores[valores.length - 1] !== maximo) {
        throw new Error("observaciones temporales inválidas");
      }
    }
    if (capa.familia === "tension") {
      if (!Array.isArray(capa.escenariosPesos) || capa.escenariosPesos.length !== 3) {
        throw new Error("la tensión requiere tres juegos de pesos publicados");
      }
      const escenarios = new Set<string>();
      for (const escenario of capa.escenariosPesos) {
        if (!escenario.id || !escenario.nombre || !escenario.alcance
          || escenarios.has(escenario.id) || !pesosValidos(escenario.pesos)) {
          throw new Error("juego de pesos de tensión inválido");
        }
        escenarios.add(escenario.id);
      }
      if (["bajo", "base", "alto"].some((id) => !escenarios.has(id))) {
        throw new Error("faltan escenarios bajo, base o alto");
      }
    }
    familias.add(capa.familia);
    ids.add(capa.id);
  }
  if (familias.size !== FAMILIAS.length) throw new Error("faltan familias geográficas");
  if (!Array.isArray(datos.comparaciones) || datos.comparaciones.length < 1) {
    throw new Error("falta una comparación satelital real");
  }
  const comparaciones = new Set<string>();
  for (const comparacion of datos.comparaciones) {
    if (!comparacion.id || comparaciones.has(comparacion.id)) {
      throw new Error("identificador de comparación repetido");
    }
    if (!comparacion.metodo || !comparacion.advertencia || !comparacion.licencia
      || (comparacion.vista && !["territorio", "mundo", "ambas"].includes(comparacion.vista))) {
      throw new Error("comparación sin método, advertencia o licencia");
    }
    if (comparacion.crs !== "EPSG:32616"
      || !Array.isArray(comparacion.extensionM)
      || comparacion.extensionM.length !== 4
      || !comparacion.extensionM.every(Number.isFinite)) {
      throw new Error("grilla de comparación inválida");
    }
    if (!/^https:\/\//.test(comparacion.licenciaUrl)
      || !Array.isArray(comparacion.mascaraVisual)
      || comparacion.mascaraVisual.length < 2
      || comparacion.mascaraVisual.some((item) => !/^#[a-f0-9]{6}$/i.test(item.color) || !item.etiqueta)) {
      throw new Error("licencia o máscara visual de comparación inválida");
    }
    const firmas: string[] = [];
    for (const escena of [comparacion.antes, comparacion.despues]) {
      if (!/^\/data\/oro\/[a-z0-9-]+\.webp$/.test(escena.url) || escena.url.includes("..")) {
        throw new Error("ruta satelital fuera del directorio público");
      }
      if (!SHA256.test(escena.sha256)
        || !Number.isInteger(escena.ancho) || escena.ancho <= 0
        || !Number.isInteger(escena.alto) || escena.alto <= 0
        || !Number.isInteger(escena.tamanoBytes) || escena.tamanoBytes <= 0) {
        throw new Error("hash, dimensiones o tamaño satelital inválido");
      }
      if (escena.crs !== comparacion.crs
        || !Array.isArray(escena.extensionM)
        || escena.extensionM.length !== 4
        || !escena.extensionM.every(Number.isFinite)
        || !Array.isArray(escena.escenas) || escena.escenas.length < 1
        || !escena.alt || !escena.fuente || !/^https:\/\//.test(escena.enlaceFuente)) {
        throw new Error("procedencia o grilla de escena satelital inválida");
      }
      firmas.push(JSON.stringify([escena.ancho, escena.alto, escena.crs, escena.extensionM]));
    }
    if (firmas[0] !== firmas[1]
      || JSON.stringify(comparacion.extensionM) !== JSON.stringify(comparacion.antes.extensionM)) {
      throw new Error("las escenas de la cortina no comparten encuadre");
    }
    comparaciones.add(comparacion.id);
  }
  return datos;
}

/** Complejidad O(1). Invariante: la escala cromática representa T(i) en [0,1]. */
function expresionTension(pesos: Pesos): ExpressionSpecification {
  return ["interpolate", ["linear"], expresionValorTension(pesos), 0, "#173b35", 0.5, "#d49a39", 1, "#a8232a"];
}

/** Complejidad O(k), k propiedades visibles, con k acotado a veintidós. Los null
 * declarados se muestran como dato ausente; no desaparecen de la ficha. */
function fichaSegura(propiedades: Record<string, unknown>, capa: Capa): HTMLElement {
  const contenedor = document.createElement("div");
  const titulo = document.createElement("strong");
  titulo.textContent = capa.nombre;
  contenedor.append(titulo);
  const lista = document.createElement("dl");
  for (const [llaves, etiqueta, respaldo, mostrarAusente] of [
    [["nombre", "caso"], "Elemento", null, false],
    [["estado_publicacion", "estado_juridico_cartografiado"], "Estado del dato", capa.estadoDatos, false],
    [["area_ha", "area_legal_ha"], "Área (ha)", null, false],
    [["area_real_ha", "area_documentada_sin_geometria_ha", "area_intervencion_reportada_ha"], "Huella o área reportada (ha)", null, true],
    [["delta_ha"], "Delta (ha)", null, true],
    [["sigma_delta_ha", "sigma_area_ha"], "Margen / σ (ha)", null, true],
    [["solape_ha"], "Solape de protección (ha)", null, true],
    [["fecha", "fecha_corte", "anio"], "Fecha / año", capa.fecha, false],
    [["expediente", "codigo_expediente"], "Expediente", null, false],
    [["osm_id"], "ID OSM", null, false],
    [["titularidad_registral"], "Titularidad registral", capa.familia === "legal" ? "No disponible" : null, capa.familia === "legal"],
    [["titularidad_alcance"], "Alcance de titularidad", null, false],
    [["base"], "Base geométrica", null, false],
    [["origen", "socio"], "Origen / socio", null, false],
    [["destino", "reportante"], "Destino / reportante", null, false],
    [["partida"], "Partida", null, false],
    [["masa_neta_kg", "peso_neto_kg"], "Masa neta (kg)", null, false],
    [["valor_usd"], "Valor (USD)", null, false],
    [["geometria_representa"], "Qué representa la geometría", null, false],
    [["advertencia"], "Límite", null, false],
  ] as const) {
    const declarada = llaves.some((llave) => Object.hasOwn(propiedades, llave));
    const valor = llaves.map((llave) => propiedades[llave]).find((item) => item !== undefined && item !== null && item !== "") ?? respaldo;
    if ((valor === undefined || valor === null || valor === "") && !(declarada && mostrarAusente)) continue;
    const termino = document.createElement("dt");
    const dato = document.createElement("dd");
    termino.textContent = etiqueta;
    dato.textContent = valor === undefined || valor === null || valor === "" ? "No disponible" : String(valor);
    lista.append(termino, dato);
  }

  const terminoFuente = document.createElement("dt");
  const datoFuente = document.createElement("dd");
  terminoFuente.textContent = "Fuente";
  const fuenteUrl = propiedades.fuente_url ?? capa.enlaceFuente;
  let urlValida: URL | null = null;
  try {
    const candidata = new URL(String(fuenteUrl));
    if (["http:", "https:"].includes(candidata.protocol)) urlValida = candidata;
  } catch { /* Una fuente sin URL conserva atribución textual. */ }
  if (urlValida) {
    const enlace = document.createElement("a");
    enlace.href = urlValida.href;
    enlace.target = "_blank";
    enlace.rel = "noopener";
    enlace.textContent = String(propiedades.fuente ?? capa.fuente);
    datoFuente.append(enlace);
  } else {
    datoFuente.textContent = String(propiedades.fuente ?? capa.fuente);
  }
  lista.append(terminoFuente, datoFuente);

  const geometriaFuenteUrl = propiedades.geometria_fuente_url;
  if (geometriaFuenteUrl) {
    let geometriaUrlValida: URL | null = null;
    try {
      const candidata = new URL(String(geometriaFuenteUrl));
      if (["http:", "https:"].includes(candidata.protocol)) geometriaUrlValida = candidata;
    } catch { /* La atribución geométrica se conserva como texto. */ }
    const terminoGeometria = document.createElement("dt");
    const datoGeometria = document.createElement("dd");
    terminoGeometria.textContent = "Fuente de la geometría";
    if (geometriaUrlValida) {
      const enlaceGeometria = document.createElement("a");
      enlaceGeometria.href = geometriaUrlValida.href;
      enlaceGeometria.target = "_blank";
      enlaceGeometria.rel = "noopener";
      enlaceGeometria.textContent = String(propiedades.geometria_fuente ?? "OpenStreetMap");
      datoGeometria.append(enlaceGeometria);
    } else {
      datoGeometria.textContent = String(propiedades.geometria_fuente ?? "Fuente no enlazada");
    }
    lista.append(terminoGeometria, datoGeometria);
  }
  contenedor.append(lista);
  return contenedor;
}

/** Complejidad O(1). Invariante: rutas admite una subcapa puntual para nodos
 * de flujo sin mezclarla con la simbología lineal. */
function idsRenderCapa(capa: Capa): string[] {
  return capa.familia === "rutas" ? [capa.id, `${capa.id}-nodos`] : [capa.id];
}

/** Complejidad O(1). Invariante: conserva vista y tiempo al restringir el
 * tipo geométrico de una subcapa. */
function filtroConGeometria(filtro: FilterSpecification, tipo: "LineString" | "Point"): FilterSpecification {
  return ["all", filtro, ["==", ["geometry-type"], tipo]] as FilterSpecification;
}

/** Complejidad O(1) por capa; MapLibre procesa la geometría en su índice interno. */
function registrarCapa(
  mapa: MapLibreMap,
  capa: Capa,
  pesos: Pesos,
  anioInicial: number | null,
  vista: Vista,
): void {
  mapa.addSource(capa.id, { type: "geojson", data: capa.url });
  const base = { id: capa.id, source: capa.id };
  const filtro = filtroCapa(capa, vista, anioInicial);
  if (capa.geometria === "fill") {
    mapa.addLayer({
      ...base,
      type: "fill",
      filter: filtro,
      paint: {
        "fill-color": capa.familia === "tension" ? expresionTension(pesos) : capa.color,
        "fill-opacity": capa.familia === "legal" ? 0.18 : 0.5,
        "fill-outline-color": capa.color,
      },
    });
  } else if (capa.geometria === "line") {
    mapa.addLayer({
      ...base,
      type: "line",
      filter: filtroConGeometria(filtro, "LineString"),
      paint: {
        "line-color": ["match", ["get", "tipo"], "flujo_aduanero_agregado", "#d49a39", capa.color],
        "line-width": ["match", ["get", "tipo"], "flujo_aduanero_agregado", 4, 2.4],
      },
    });
    if (capa.familia === "rutas") {
      mapa.addLayer({
        id: `${capa.id}-nodos`,
        source: capa.id,
        type: "circle",
        filter: filtroConGeometria(filtro, "Point"),
        paint: {
          "circle-color": [
            "match",
            ["get", "tipo"],
            "nodo_refinacion", "#e8a44c",
            "nodo_exportacion", "#9bd5b1",
            "#d36b31",
          ],
          "circle-radius": 6,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#10161d",
        },
      });
    }
  } else if (capa.geometria === "heatmap") {
    mapa.addLayer({
      ...base,
      type: "heatmap",
      filter: filtro,
      paint: {
        "heatmap-weight": expresionValorTension(pesos),
        "heatmap-intensity": 0.9,
        "heatmap-radius": 24,
        "heatmap-opacity": 0.72,
      },
    });
  } else {
    mapa.addLayer({
      ...base,
      type: "circle",
      filter: filtro,
      paint: {
        "circle-color": capa.color,
        "circle-radius": 5,
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#fff7e8",
      },
    });
  }

}

/** Complejidad O(L) por clic, L capas renderizadas. Invariante: un clic abre
 * una sola ficha, la entidad superior, aunque varios centroides coincidan. */
function registrarInteracciones(mapa: MapLibreMap, capas: Capa[]): void {
  const capaPorRender = new Map<string, Capa>();
  for (const capa of capas) {
    for (const id of idsRenderCapa(capa)) {
      if (!mapa.getLayer(id)) continue;
      capaPorRender.set(id, capa);
      mapa.on("mouseenter", id, () => { mapa.getCanvas().style.cursor = "pointer"; });
      mapa.on("mouseleave", id, () => { mapa.getCanvas().style.cursor = ""; });
    }
  }
  mapa.on("click", (evento) => {
    const idsVisibles = [...capaPorRender.keys()].filter((id) =>
      mapa.getLayer(id) && mapa.getLayoutProperty(id, "visibility") !== "none");
    const figura = idsVisibles.length
      ? mapa.queryRenderedFeatures(evento.point, { layers: idsVisibles })[0]
      : null;
    if (!figura) return;
    const capa = capaPorRender.get(figura.layer.id);
    if (!capa) return;
    new maplibregl.Popup({ closeButton: true, focusAfterOpen: true, maxWidth: "22rem" })
      .setLngLat(evento.lngLat)
      .setDOMContent(fichaSegura((figura.properties || {}) as Record<string, unknown>, capa))
      .addTo(mapa);
  });
}

/** Complejidad O(1) por interacción; memoria O(1). Las dos imágenes deben
 * compartir extensión, resolución y registro espacial según el manifiesto. */
function CortinaSatelital({ comparacion }: { comparacion: Comparacion }) {
  const [posicion, setPosicion] = useState(50);
  return <figure className="mapa-oro-cortina">
    <h3>{comparacion.titulo}</h3>
    <div
      className="mapa-oro-par"
      style={{
        "--posicion": `${posicion}%`,
        aspectRatio: `${comparacion.antes.ancho} / ${comparacion.antes.alto}`,
      } as React.CSSProperties}
    >
      <img
        src={comparacion.antes.url}
        alt={comparacion.antes.alt}
        width={comparacion.antes.ancho}
        height={comparacion.antes.alto}
        loading="lazy"
        decoding="async"
      />
      <img
        className="mapa-oro-despues"
        src={comparacion.despues.url}
        alt={comparacion.despues.alt}
        width={comparacion.despues.ancho}
        height={comparacion.despues.alto}
        loading="lazy"
        decoding="async"
        style={{ clipPath: `inset(0 0 0 ${posicion}%)` }}
      />
      <i className="mapa-oro-divisor" aria-hidden="true" />
      <span className="mapa-oro-antes-etiqueta">Antes · {comparacion.antes.fecha}</span>
      <span className="mapa-oro-despues-etiqueta">Después · {comparacion.despues.fecha}</span>
    </div>
    <input
      aria-label={`Comparar escenas de ${comparacion.titulo}`}
      aria-valuetext={`${posicion}% de la escena anterior visible`}
      type="range"
      min="0"
      max="100"
      value={posicion}
      onChange={(evento) => setPosicion(Number(evento.target.value))}
    />
    <figcaption className="mapa-oro-cortina-meta">
      <p><strong>Método.</strong> {comparacion.metodo}</p>
      <p><strong>Alcance.</strong> {comparacion.advertencia}</p>
      <p>
        <strong>Grilla.</strong> {comparacion.crs}; {comparacion.antes.ancho}×{comparacion.antes.alto} px;
        extensión métrica {comparacion.extensionM.join(", ")}.
      </p>
      <p>
        <strong>Observación clara.</strong> 2017: {comparacion.antes.calidad.pixelesClaros.toLocaleString("es-CO")} de {comparacion.antes.calidad.pixelesTotales.toLocaleString("es-CO")} px
        ({comparacion.antes.calidad.porcentajeClaroSobreTotal.toLocaleString("es-CO")} %). Compuesto 2018: {comparacion.despues.calidad.pixelesClaros.toLocaleString("es-CO")} de {comparacion.despues.calidad.pixelesTotales.toLocaleString("es-CO")} px
        ({comparacion.despues.calidad.porcentajeClaroSobreTotal.toLocaleString("es-CO")} %).
      </p>
      <div className="mapa-oro-mascara" role="group" aria-label="Leyenda de píxeles sin observación">
        {comparacion.mascaraVisual.map((item) => <span key={item.id}>
          <i aria-hidden="true" style={{ "--color-mascara": item.color } as React.CSSProperties} />
          {item.etiqueta}
        </span>)}
      </div>
      <p>
        Fuente: <a href={comparacion.antes.enlaceFuente} target="_blank" rel="noopener">{comparacion.antes.fuente}</a>.
        Licencia: <a href={comparacion.licenciaUrl} target="_blank" rel="noopener">{comparacion.licencia}</a>.
      </p>
    </figcaption>
  </figure>;
}

/** Complejidad React O(L) por cambio, L capas del manifiesto. Memoria O(L).
 * Invariantes: solo carga URLs declaradas en el manifiesto; los pesos suman 1;
 * ninguna coordenada se obtiene del dispositivo del lector. */
export function MapaOro({ inicioCargaMs, manifiestoUrl, manifiestoInicial, vista }: { inicioCargaMs: number; manifiestoUrl: string; manifiestoInicial?: unknown; vista: Vista }) {
  const lienzo = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapLibreMap | null>(null);
  const [manifiesto, setManifiesto] = useState<Manifiesto | null>(null);
  const [error, setError] = useState("");
  const [familias, setFamilias] = useState<Set<Familia>>(() => new Set(FAMILIAS));
  const [pesos, setPesos] = useState<Pesos>(PESOS_BASE);
  const [anio, setAnio] = useState<number | null>(null);
  const pesosNormalizados = useMemo(() => normalizarPesos(pesos), [pesos]);
  const familiasActuales = useRef(familias);
  const pesosActuales = useRef(pesosNormalizados);
  const anioActual = useRef(anio);
  familiasActuales.current = familias;
  pesosActuales.current = pesosNormalizados;
  anioActual.current = anio;
  const capas = useMemo(
    () => (manifiesto?.capas || []).filter((capa) => !capa.vista || capa.vista === "ambas" || capa.vista === vista),
    [manifiesto, vista],
  );
  const comparaciones = useMemo(
    () => (manifiesto?.comparaciones || []).filter((item) => !item.vista || item.vista === "ambas" || item.vista === vista),
    [manifiesto, vista],
  );
  const capasDibujo = useMemo(() => ordenarCapas(capas), [capas]);
  const rangoTemporal = useMemo(() => {
    const temporales = capas.flatMap((capa) => capa.temporal ? [capa.temporal] : []);
    if (!temporales.length) return null;
    const valores = [...new Set(temporales.flatMap((item) => item.valores))].sort((a, b) => a - b);
    return {
      valores,
      minimo: valores[0],
      maximo: valores[valores.length - 1],
    };
  }, [capas]);

  useEffect(() => {
    if (manifiestoInicial) {
      try {
        setManifiesto(validarManifiesto(manifiestoInicial as Manifiesto));
      } catch (causa) {
        setError(String((causa as Error).message || causa));
      }
      return;
    }
    const controlador = new AbortController();
    fetch(manifiestoUrl, { signal: controlador.signal, credentials: "same-origin" })
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error(`manifiesto HTTP ${respuesta.status}`);
        return respuesta.json() as Promise<Manifiesto>;
      })
      .then((datos) => {
        setManifiesto(validarManifiesto(datos));
      })
      .catch((causa) => {
        if (causa.name !== "AbortError") setError(String(causa.message || causa));
      });
    return () => controlador.abort();
  }, [manifiestoInicial, manifiestoUrl]);

  useEffect(() => {
    if (!manifiesto || !lienzo.current || mapa.current) return;
    const reducida = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const [lng, lat, zoom] = manifiesto.centro[vista];
    const inicioMapa = performance.now();
    if (!webgl2Disponible()) {
      lienzo.current.dataset.mapState = "unavailable";
      setError("WebGL 2 no está disponible en este navegador");
      return;
    }
    let instancia: MapLibreMap;
    try {
      instancia = new maplibregl.Map({
        container: lienzo.current,
        style: ESTILO_INICIAL,
        center: [lng, lat],
        zoom,
        fadeDuration: reducida ? 0 : 300,
        attributionControl: false,
        cooperativeGestures: true,
      });
    } catch (causa) {
      lienzo.current.dataset.mapState = "unavailable";
      setError(String((causa as Error).message || causa || "falló el motor cartográfico"));
      return;
    }
    const informarError = (evento: { error?: Error }) => {
      if (lienzo.current) lienzo.current.dataset.mapState = "unavailable";
      setError(evento.error?.message || "falló una fuente cartográfica");
    };
    instancia.on("error", informarError);
    mapa.current = instancia;
    instancia.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    instancia.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    instancia.once("load", () => {
      capasDibujo.forEach((capa) => registrarCapa(
        instancia,
        capa,
        pesosActuales.current,
        anioActual.current ?? rangoTemporal?.maximo ?? null,
        vista,
      ));
      for (const capa of capasDibujo) {
        if (familiasActuales.current.has(capa.familia)) continue;
        for (const id of idsRenderCapa(capa)) {
          if (instancia.getLayer(id)) instancia.setLayoutProperty(id, "visibility", "none");
        }
      }
      registrarInteracciones(instancia, capasDibujo);
      if (lienzo.current) {
        lienzo.current.dataset.mapState = "ready";
        lienzo.current.dataset.styleMs = String(Math.round(performance.now() - inicioMapa));
      }
      instancia.once("idle", () => {
        if (!lienzo.current) return;
        const ahora = performance.now();
        lienzo.current.dataset.mapInitMs = String(Math.round(ahora - inicioMapa));
        // La métrica empieza cuando el montaje entra en el margen observable
        // del lector. Incluye descarga diferida, manifiesto, trabajador y las
        // nueve fuentes; excluye el tiempo en que el mapa seguía fuera de vista.
        lienzo.current.dataset.entryMs = String(Math.round(inicioCargaMs));
        lienzo.current.dataset.navigationMs = String(Math.round(ahora));
        lienzo.current.dataset.renderMs = String(Math.round(ahora - inicioCargaMs));
        lienzo.current.dataset.renderScope = "primer_tematico_idle_nueve_fuentes";
        lienzo.current.dataset.basemapIncluded = "false";
        // La cartografía temática produce primero un estado completo y
        // medible. El fondo sin llave entra después como mejora progresiva.
        setTimeout(() => {
          if (lienzo.current && mapa.current === instancia) {
            cargarBaseAbierta(instancia, lienzo.current, capasDibujo[0]?.id, manifiesto.estiloBase);
          }
        }, 0);
      });
    });
    return () => {
      instancia.off("error", informarError);
      instancia.remove();
      mapa.current = null;
    };
  }, [inicioCargaMs, manifiesto, capasDibujo, rangoTemporal, vista]);

  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia?.isStyleLoaded()) return;
    for (const capa of capas) {
      for (const id of idsRenderCapa(capa)) {
        if (!instancia.getLayer(id)) continue;
        instancia.setLayoutProperty(id, "visibility", familias.has(capa.familia) ? "visible" : "none");
      }
    }
  }, [capas, familias]);

  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia?.isStyleLoaded()) return;
    for (const capa of capas.filter((item) => item.familia === "tension")) {
      if (!instancia.getLayer(capa.id)) continue;
      if (capa.geometria === "fill") {
        instancia.setPaintProperty(capa.id, "fill-color", expresionTension(pesosNormalizados));
      }
      if (capa.geometria === "heatmap") {
        instancia.setPaintProperty(capa.id, "heatmap-weight", expresionValorTension(pesosNormalizados));
      }
    }
  }, [capas, pesosNormalizados]);

  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia?.isStyleLoaded() || anio === null) return;
    for (const capa of capas.filter((item) => item.temporal)) {
      if (instancia.getLayer(capa.id)) instancia.setFilter(capa.id, filtroCapa(capa, vista, anio));
    }
  }, [anio, capas, vista]);

  const alternar = (familia: Familia) => setFamilias((actuales) => {
    const siguientes = new Set(actuales);
    if (siguientes.has(familia)) siguientes.delete(familia); else siguientes.add(familia);
    return siguientes;
  });

  const capaTension = capas.find((capa) => capa.familia === "tension");
  const escenariosPesos = capaTension?.escenariosPesos || [];
  const escenarioActivo = escenariosPesos.find((item) => pesosCoinciden(item.pesos, pesos));
  const tensionCalculable = Boolean(
    capaTension
    && capaTension.estadoDatos !== "indice_no_calculable"
    && Number(capaTension.entidades) > 0
    && VARIABLES_TENSION.every((variable) => capaTension.variablesDisponibles?.includes(variable)),
  );
  const descargasHabilitadas = capas.filter((capa) => capa.descarga.habilitada).length;
  const idEstado = `mapa-oro-estado-${vista}`;
  const idEscenario = `mapa-oro-escenario-${vista}`;

  const enfocar = (lng: number, lat: number, zoom: number) => {
    const instancia = mapa.current;
    if (!instancia) return;
    const reducida = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducida) instancia.jumpTo({ center: [lng, lat], zoom });
    else instancia.flyTo({ center: [lng, lat], zoom, duration: 1200, essential: true });
  };

  return <section className="mapa-oro-app" aria-label={vista === "mundo" ? "Mapa mundial del alcance documentado" : "Mapa territorial del estudio"}>
    <div className="mapa-oro-controles">
      {vista === "territorio" ? <fieldset className="mapa-oro-focos">
        <legend>Ir al territorio</legend>
        <p className="mapa-oro-focos-nota">
          Encuadra el ancla OSM de cada caso. No son perímetros: las geometrías
          exactas de ANM y Nexus carecen de licencia de reutilización.
        </p>
        <div className="mapa-oro-focos-botones">
          {FOCOS_TERRITORIO.map((foco) => <button
            key={foco.id}
            type="button"
            onClick={() => enfocar(foco.lng, foco.lat, foco.zoom)}
          >{foco.nombre}</button>)}
        </div>
      </fieldset> : null}
      <fieldset>
        <legend>Capas</legend>
        <div className="mapa-oro-capas">
          {FAMILIAS.map((familia) => {
            const capa = capas.find((item) => item.familia === familia);
            const color = capa?.color || "#777";
            return <label key={familia}>
              <input
                aria-label={`Mostrar ${capa?.nombre || familia}`}
                type="checkbox"
                checked={familias.has(familia)}
                onChange={() => alternar(familia)}
              />
              <span>{familia}</span><i aria-hidden="true" style={{ "--color-capa": color } as React.CSSProperties} />
            </label>;
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend>Pesos de tensión · suma 1</legend>
        <label className="mapa-oro-escenario-pesos">
          <span>Juego de sensibilidad</span>
          <select
            aria-label="Juego de pesos del índice de tensión"
            aria-describedby={idEscenario}
            disabled={escenariosPesos.length !== 3}
            value={escenarioActivo?.id || "personalizado"}
            onChange={(evento) => {
              const elegido = escenariosPesos.find((item) => item.id === evento.target.value);
              if (elegido) setPesos(elegido.pesos);
            }}
          >
            {escenariosPesos.map((escenario) => <option key={escenario.id} value={escenario.id}>{escenario.nombre}</option>)}
            {!escenarioActivo && <option value="personalizado">Personalizado</option>}
          </select>
        </label>
        <p className="mapa-oro-aviso-control" id={idEscenario}>
          {escenarioActivo?.alcance || "Ajuste personalizado sobre cinco pesos normalizados."}
        </p>
        <div className="mapa-oro-pesos">
          {(Object.keys(PESOS_BASE) as (keyof Pesos)[]).map((llave) => <label key={llave}>
            <span>{ETIQUETAS_PESO[llave]}</span>
            <input
              aria-label={`Peso ${ETIQUETAS_PESO[llave]}`}
              aria-valuetext={`${pesosNormalizados[llave].toFixed(2)} de 1`}
              disabled={!tensionCalculable}
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={pesos[llave]}
              onChange={(evento) => setPesos((actuales) => normalizarPesos({ ...actuales, [llave]: Number(evento.target.value) }))}
            />
            <output>{pesosNormalizados[llave].toFixed(2)}</output>
          </label>)}
        </div>
        <p className="mapa-oro-aviso-control">
          {tensionCalculable
            ? "Cada celda visible tiene D, H, A, P y C en el intervalo [0,1]."
            : "Índice sin celdas: D, H, A, P y C siguen ausentes. Los escenarios permiten inspeccionar el modelo; los ajustes libres permanecen desactivados y null conserva su significado."}
        </p>
      </fieldset>

      {rangoTemporal && <fieldset>
        <legend>Corte temporal de fichas</legend>
        <div className="mapa-oro-tiempo">
          <label htmlFor={`mapa-oro-anio-${vista}`}>Año de observación</label>
          <input
            id={`mapa-oro-anio-${vista}`}
            aria-valuetext={`Año ${anio ?? rangoTemporal.maximo}`}
            type="range"
            min="0"
            max={rangoTemporal.valores.length - 1}
            step="1"
            value={Math.max(0, rangoTemporal.valores.indexOf(anio ?? rangoTemporal.maximo))}
            disabled={rangoTemporal.valores.length < 2}
            onChange={(evento) => setAnio(rangoTemporal.valores[Number(evento.target.value)])}
          />
          <output>{anio ?? rangoTemporal.maximo}</output>
        </div>
        <p className="mapa-oro-aviso-control">
          Fichas disponibles: {rangoTemporal.valores.join(" y ")}. El control salta entre observaciones;
          su símbolo no representa una huella anual.
        </p>
      </fieldset>}
    </div>

    <div
      ref={lienzo}
      className={`mapa-oro-lienzo${vista === "mundo" ? " mapa-oro-lienzo--mundo" : ""}`}
      role="region"
      aria-describedby={idEstado}
      aria-label="Mapa interactivo; la tabla siguiente contiene la alternativa textual"
    />
    <p className="mapa-oro-estado" id={idEstado} role="status" aria-live="polite">
      {error
        ? `Mapa no disponible: ${error}. Use la tabla accesible del artículo.`
        : tensionCalculable
          ? `Mapa con datos trazables; ${descargasHabilitadas} de ${capas.length} GeoJSON tienen descarga habilitada.`
          : `Mapa con datos trazables. Tensión conserva cero celdas porque faltan D, H, A, P y C; ${descargasHabilitadas} de ${capas.length} GeoJSON tienen descarga habilitada.`}
    </p>
    <nav className="mapa-oro-descargas" aria-label="Descargas y fuentes de las capas">
      {capas.map((capa) => {
        const idMotivo = `mapa-oro-descarga-${vista}-${capa.familia}`;
        return <span className="mapa-oro-descarga" key={capa.id}>
          {capa.descarga.habilitada
            ? <a href={capa.url} download aria-describedby={idMotivo}>{capa.nombre} · GeoJSON</a>
            : <a href={capa.enlaceFuente} target="_blank" rel="noopener" aria-describedby={idMotivo}>
              {capa.nombre} · fuente original
            </a>}
          <small id={idMotivo}>
            {capa.descarga.habilitada ? capa.descarga.motivo : `GeoJSON no ofrecido: ${capa.descarga.motivo}`}
          </small>
        </span>;
      })}
    </nav>
    {comparaciones.length > 0 && <div className="mapa-oro-comparaciones" role="group" aria-label="Comparaciones satelitales antes y después">
      {comparaciones.map((comparacion) => <CortinaSatelital key={comparacion.id} comparacion={comparacion} />)}
    </div>}
  </section>;
}
