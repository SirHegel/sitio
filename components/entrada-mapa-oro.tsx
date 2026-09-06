import React from "react";
import { createRoot } from "react-dom/client";
import * as maplibregl from "maplibre-gl";
import fuenteTrabajador from "maplibre-worker-source";
import { MapaOro } from "./MapaOro";

// Un solo artefacto comprimido evita dos viajes de red secuenciales antes del
// primer GeoJSON. La URL vive lo mismo que la página porque ambos mapas
// comparten el grupo global de trabajadores de MapLibre.
const urlTrabajador = URL.createObjectURL(new Blob([fuenteTrabajador], { type: "text/javascript" }));
maplibregl.setWorkerUrl(urlTrabajador);

/** Complejidad O(N) temporal y espacial para N montajes declarados en la página.
 * Invariante: cada nodo recibe una sola raíz React. */
export function montarMapasOro(nodos: Iterable<Element>, manifiestoInicial?: unknown): void {
  for (const nodo of nodos) {
    if (!(nodo instanceof HTMLElement) || nodo.dataset.montado === "1") continue;
    nodo.dataset.montado = "1";
    createRoot(nodo).render(<MapaOro
      inicioCargaMs={Number(nodo.dataset.inicioMapaOro) || performance.now()}
      manifiestoUrl={nodo.dataset.manifiesto || "/data/oro/manifiesto.json"}
      manifiestoInicial={manifiestoInicial}
      vista={nodo.dataset.vista === "mundo" ? "mundo" : "territorio"}
    />);
  }
}
