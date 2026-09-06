/* Empaqueta el componente React y MapLibre como recursos locales. El costo es
   O(B) tiempo y espacio sobre los bytes del grafo de módulos. */

import { build } from "esbuild";
import { copyFile } from "node:fs/promises";

const trabajador = await build({
  entryPoints: ["node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs"],
  bundle: true,
  minify: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  write: false,
  legalComments: "none",
});
const fuenteTrabajador = trabajador.outputFiles[0].text;

const trabajadorEmbebido = {
  name: "maplibre-worker-source",
  setup(compilacion) {
    compilacion.onResolve({ filter: /^maplibre-worker-source$/ }, () => ({
      path: "maplibre-worker-source",
      namespace: "maplibre-worker",
    }));
    compilacion.onLoad({ filter: /.*/, namespace: "maplibre-worker" }, () => ({
      contents: `export default ${JSON.stringify(fuenteTrabajador)};`,
      loader: "js",
    }));
  },
};

await build({
  entryPoints: ["components/entrada-mapa-oro.tsx"],
  bundle: true,
  minify: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  outfile: "activos/mapa-oro.js",
  plugins: [trabajadorEmbebido],
  legalComments: "eof",
  sourcemap: false,
  // La API de compatibilidad conserva el componente React y evita enviar el
  // reconciliador completo de React DOM para dos montajes aislados.
  alias: {
    react: "preact/compat",
    "react-dom": "preact/compat",
    "react-dom/client": "preact/compat/client",
  },
  loader: { ".png": "dataurl" },
});

// MapLibre 6 resuelve este módulo junto al bundle por import.meta.url.
// Complejidad O(B) tiempo, O(1) memoria adicional. Invariante: trabajador
// local de la misma versión instalada; el mapa no depende de un CDN de scripts.
await copyFile(
  "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs",
  "activos/maplibre-gl-worker.mjs",
);
await copyFile(
  "node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs",
  "activos/maplibre-gl-shared.mjs",
);
