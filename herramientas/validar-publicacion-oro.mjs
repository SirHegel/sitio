/**
 * Puertas mecánicas del macroestudio ORO, PERÍMETROS Y CAPA BASAL.
 *
 * Complejidad temporal: O(B + F), con B bytes de manuscrito/manifiestos y F
 * archivos cartográficos declarados. Espacio: O(B + F). Invariante: una puerta
 * ausente o ilegible falla cerrada; ningún error se convierte en aprobación.
 */

import { lstat, readFile, readdir, realpath, stat } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { compilarMdxOro } from "../estudio-oro.js";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const ETIQUETA_TRAZA = /^\[(DOC|REG|RAYA|CALC|INT)\]\s+/;
const TIPOS_SENSIBLES = /vivienda|domicilio|testimonio|residencia|l[ií]der/i;
const CAMPOS_PERSONALES = /^(?:telefono|tel[eé]fono|correo|email|direcci[oó]n|documento|c[eé]dula|nombre_testimonio|persona)$/i;
const PROHIBIDAS = [
  /\bno (?:solo|solamente)\b[^.\n]{0,160}\bsino\b/i,
  /\bno (?:es|son|era|eran)\b[^.\n]{0,160}\bsino\b/i,
  /\bpor un lado\b|\bpor otro lado\b/i,
  /\bsi bien\b|\bno obstante\b/i,
  /\bes importante destacar\b|\bcabe resaltar\b|\bvale la pena mencionar\b/i,
  /\ben conclusi[oó]n\b|\ben resumen\b|\ben definitiva\b/i,
  /\ben el mundo actual\b|\ben un contexto donde\b|\bla realidad es que\b/i,
  /\b(?:robusto|fundamental|crucial|sinergia|ecosistema|empoderar|resiliente)\b/i,
  /\b(?:podr[ií]a decirse|en cierto modo|de alguna manera|quiz[aá]s|tal vez|es posible que)\b/i,
];
const RUTA_CONFIGURACION_PRIVADA = "datos/privacidad-receptor-oro.json";

/**
 * O(B), B bytes del contrato privado. El archivo queda fuera del release
 * público; su ausencia es válida únicamente en un árbol ya saneado.
 */
function cargarConfiguracionPrivadaReceptor() {
  let contenido;
  try {
    contenido = readFileSync(new URL(`../${RUTA_CONFIGURACION_PRIVADA}`, import.meta.url), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  const configuracion = JSON.parse(contenido);
  const campos = [
    "destinatario_id", "destinatario_alternativo_id", "nombre", "dominio",
    "url_contacto", "ejecutivo", "bol", "master_bol", "contenedor", "ciudad",
  ];
  if (configuracion?.esquema !== 1
    || campos.some((campo) => typeof configuracion[campo] !== "string" || !configuracion[campo].trim())
    || !Array.isArray(configuracion.formularios)
    || configuracion.formularios.some((id) => !Number.isInteger(id) || id < 1)) {
    throw new Error("configuración privada del receptor inválida");
  }
  return Object.freeze({
    ...configuracion,
    formularios: Object.freeze([...configuracion.formularios]),
  });
}

const RECEPTOR_PRIVADO = cargarConfiguracionPrivadaReceptor();
const ID_RECEPTOR = RECEPTOR_PRIVADO?.destinatario_id || "receptor-restringido";
const ID_RECEPTOR_ALTERNATIVO = RECEPTOR_PRIVADO?.destinatario_alternativo_id || "receptor-restringido-alterno";
const NOMBRE_RECEPTOR = RECEPTOR_PRIVADO?.nombre || "Receptor restringido";
const URL_CONTACTO_RECEPTOR = RECEPTOR_PRIVADO?.url_contacto || "https://example.invalid/restricted";
const DESTINATARIOS_REPLICA_ESPERADOS = Object.freeze([
  "minecar",
  "presidencia-de-la-espriella",
  "raya",
  "procomer",
  ID_RECEPTOR,
  "infinito-gold",
  "anm-traslado-titulares",
  "dgm-crucitas",
  ID_RECEPTOR_ALTERNATIVO,
  "dle-firma",
  "daniel-penarredonda",
]);
const SUJETOS_MATERIALES_ESPERADOS = Object.freeze([
  Object.freeze({ id: "minecar", terminos: ["Mineros del Caribona Gold S.A.S.", "Minecar Gold", "Mina Walter S.A.S."], canales: ["minecar"] }),
  Object.freeze({ id: "abelardo-de-la-espriella", terminos: ["Abelardo de la Espriella"], canales: ["presidencia-de-la-espriella", "dle-firma"] }),
  Object.freeze({ id: "revista-raya", terminos: ["Revista RAYA"], canales: ["raya"] }),
  Object.freeze({ id: "procomer", terminos: ["PROCOMER"], canales: ["procomer"] }),
  Object.freeze({
    id: ID_RECEPTOR,
    terminos: [NOMBRE_RECEPTOR],
    canales: [
      ID_RECEPTOR,
      ID_RECEPTOR_ALTERNATIVO,
      ...(RECEPTOR_PRIVADO?.formularios || []).map((id) => `formulario:${id}`),
    ],
  }),
  Object.freeze({ id: "infinito", terminos: ["Infinito Gold", "Industrias Infinito"], canales: ["infinito-gold"] }),
  Object.freeze({ id: "anm", terminos: ["Agencia Nacional de Minería"], canales: ["anm-traslado-titulares"] }),
  Object.freeze({ id: "dgm", terminos: ["Dirección de Geología y Minas"], canales: ["dgm-crucitas"] }),
  Object.freeze({ id: "dle-firma", terminos: ["De La Espriella Lawyers"], canales: ["dle-firma"] }),
  Object.freeze({ id: "daniel-penarredonda", terminos: ["Daniel Peñarredonda"], canales: ["daniel-penarredonda"] }),
]);
const FORMULARIOS_REPLICA_APROBADOS = new Set(RECEPTOR_PRIVADO?.formularios || []);
const RUTA_MANUSCRITO_ORO = "salidas/oro-perimetros.mdx";
const IDS_RECEPTOR_SIN_RECEPCION = new Set([ID_RECEPTOR, ID_RECEPTOR_ALTERNATIVO]);
const TERMINOS_RECEPCION = "(?:receptor|receiver|recipient|consignee|consignatario|receiving\\s+facility|instalaci[oó]n\\s+receptora)";
const escaparRegex = (valor) => String(valor).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const patronNombreOSlug = (nombre, slug) => [nombre, slug]
  .map((valor) => escaparRegex(valor).replace(/(?:\\ |-)+/g, "(?:\\s+|[-_]+)"))
  .join("|");
const FIRMAS_PRIVACIDAD_RECEPTOR = Object.freeze(RECEPTOR_PRIVADO ? [
  Object.freeze({ id: "nombre_o_slug", patron: new RegExp(`\\b(?:${patronNombreOSlug(RECEPTOR_PRIVADO.nombre, RECEPTOR_PRIVADO.destinatario_id)})\\b`, "gi") }),
  Object.freeze({ id: "dominio", patron: new RegExp(`\\b${escaparRegex(RECEPTOR_PRIVADO.dominio)}\\b`, "gi") }),
  Object.freeze({ id: "ejecutivo", patron: new RegExp(`\\b${escaparRegex(RECEPTOR_PRIVADO.ejecutivo).replace(/\\ /g, "\\s+")}\\b`, "gi") }),
  Object.freeze({ id: "bol", patron: new RegExp(`\\b${escaparRegex(RECEPTOR_PRIVADO.bol)}\\b`, "gi") }),
  Object.freeze({ id: "master_bol", patron: new RegExp(`\\b${escaparRegex(RECEPTOR_PRIVADO.master_bol)}\\b`, "gi") }),
  Object.freeze({ id: "contenedor", patron: new RegExp(`\\b${escaparRegex(RECEPTOR_PRIVADO.contenedor)}\\b`, "gi") }),
  Object.freeze({
    id: "ubicacion_recepcion",
    patron: new RegExp(`\\b${escaparRegex(RECEPTOR_PRIVADO.ciudad)}\\b[\\s\\S]{0,240}\\b${TERMINOS_RECEPCION}\\b|\\b${TERMINOS_RECEPCION}\\b[\\s\\S]{0,240}\\b${escaparRegex(RECEPTOR_PRIVADO.ciudad)}\\b`, "gi"),
  }),
] : []);
const RAICES_BUILD_ORO = Object.freeze(["publico", ".vercel/output/static"]);
const EXTENSION_TEXTO_BUILD = /\.(?:css|csv|geojson|html?|js|json|map|md|txt|tsv|xml)$/i;
const CONTROL_RUTA = /[\u0000-\u001f\u007f-\u009f]/u;
const PREFIJOS_OPERATIVOS_EMBARGADOS_ORO = Object.freeze([
  "datos/geo/",
  "fuentes/",
  "manuscrito/",
  "memoria/",
]);
const RUTAS_OPERATIVAS_EMBARGADAS_ORO = new Set([
  "datos/bloqueado.md",
  "datos/caso-a-mina-walter/legal/JG4-16531.geojson",
  "datos/caso-c-agataes/legal/CEI-101.geojson",
  "datos/modelos/manifiesto.json",
  "datos/modelos/resultados.json",
  RUTA_CONFIGURACION_PRIVADA,
  "modelos/ejecutar.mjs",
]);
const CODIGOS_GEOMETRIA_POLIGONAL_ORO = Object.freeze([
  Object.freeze({ codigo: "JG4-16531", firma: "anm_jg4_poligono" }),
  Object.freeze({ codigo: "CEI-101", firma: "anm_cei_poligono" }),
  Object.freeze({ codigo: "2594", firma: "nexus_2594_poligono" }),
]);

async function textoOpcional(ruta) {
  try { return await readFile(ruta, "utf8"); }
  catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function jsonOpcional(ruta) {
  const texto = await textoOpcional(ruta);
  if (texto === null) return null;
  try { return JSON.parse(texto); }
  catch { return null; }
}

function fechaUtc(valor) {
  if (!FECHA.test(String(valor))) throw new TypeError(`Fecha inválida: ${valor}`);
  const [anio, mes, dia] = valor.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.toISOString().slice(0, 10) !== valor) throw new TypeError(`Fecha inválida: ${valor}`);
  return fecha;
}

/** Complejidad O(d), d días del intervalo. Excluye el día del envío. */
export function diasHabilesTranscurridos(desde, hasta) {
  const inicio = fechaUtc(desde);
  const fin = fechaUtc(hasta);
  if (fin < inicio) throw new RangeError("La fecha final antecede al envío");
  let dias = 0;
  for (const cursor = new Date(inicio.getTime() + 86_400_000); cursor <= fin; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const dia = cursor.getUTCDay();
    if (dia !== 0 && dia !== 6) dias += 1;
  }
  return dias;
}

/** Complejidad O(d), d días recorridos. Excluye el día del envío. */
export function calendarioDiasHabiles(desde, cantidad = 5) {
  if (!Number.isInteger(cantidad) || cantidad < 1) throw new RangeError("Cantidad de días hábiles inválida");
  const inicio = fechaUtc(desde);
  const fechas = [];
  for (const cursor = new Date(inicio.getTime() + 86_400_000); fechas.length < cantidad; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const dia = cursor.getUTCDay();
    if (dia !== 0 && dia !== 6) fechas.push(cursor.toISOString().slice(0, 10));
  }
  return fechas;
}

/** El plazo vence al terminar el último día hábil, no al comenzar ese día. */
export function plazoReplicaCumplido(desde, hoy, cantidad = 5) {
  const ultimo = calendarioDiasHabiles(desde, cantidad).at(-1);
  return fechaUtc(hoy).getTime() > fechaUtc(ultimo).getTime();
}

/** O(1) tiempo y espacio; devuelve una fecha civil válida de Bogotá o null. */
function fechaBogotaDesdeIso(valor) {
  const instante = new Date(valor);
  if (!Number.isFinite(instante.getTime())) return null;
  return fechaActualBogota(instante);
}

function fechaActualBogota(instante = new Date()) {
  const partes = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instante).filter((parte) => parte.type !== "literal").map((parte) => [parte.type, parte.value]));
  return `${partes.year}-${partes.month}-${partes.day}`;
}

function palabrasCuerpo(texto) {
  return String(texto || "")
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .match(/[\p{L}\p{N}][\p{L}\p{N}’'_-]*/gu)?.length || 0;
}

function puerta(id, cumple, evidencia) {
  return { id, cumple: Boolean(cumple), evidencia: String(evidencia) };
}

/**
 * Localiza identificadores que permiten nombrar o derivar al receptor antes de
 * que exista recepción acreditada. Complejidad O(P·B), con P = 7 firmas y B
 * bytes de texto. Invariante: cada firma se informa una vez por superficie.
 */
export function detectarFirmasPrivacidadReceptor(texto) {
  const fuente = String(texto || "");
  return FIRMAS_PRIVACIDAD_RECEPTOR.flatMap(({ id, patron }) => {
    patron.lastIndex = 0;
    const coincidencia = patron.exec(fuente);
    patron.lastIndex = 0;
    if (!coincidencia) return [];
    return [{
      firma: id,
      indice: coincidencia.index,
      linea: fuente.slice(0, coincidencia.index).split("\n").length,
    }];
  });
}

/**
 * Detecta polígonos legales por expediente y los vértices locales publicados
 * por Nexus. Complejidad O(C·B), C = 3 códigos y B bytes; espacio O(C).
 * Invariante: un código factual dentro de un Point OSM permanece permitido.
 */
export function detectarFirmasGeometriaExactaOro(texto) {
  const fuente = String(texto || "");
  const hallazgos = [];
  const indicePoligono = fuente.search(/"type"\s*:\s*"(?:Multi)?Polygon"/i);
  if (indicePoligono >= 0) {
    // Cuando el texto es una FeatureCollection legible se liga cada expediente a
    // su propia geometría. La co-ocurrencia sola produce falsos positivos: un
    // ancla puntual de Crucitas en el mismo archivo que un polígono ajeno se
    // denunciaba como polígono de Crucitas. Si el texto no es JSON —código
    // fuente, pruebas, Markdown— se conserva la heurística conservadora.
    let porFeature = null;
    try {
      const analizado = JSON.parse(fuente);
      if (Array.isArray(analizado?.features)) porFeature = analizado.features;
    } catch { /* No es JSON: se cae a la heurística por co-ocurrencia. */ }

    for (const { codigo, firma } of CODIGOS_GEOMETRIA_POLIGONAL_ORO) {
      if (porFeature) {
        // La ANM sirve el campo en mayúsculas y el payload propio en minúsculas:
        // se comparan todas las claves que nombren el expediente.
        const tienePoligonoPropio = porFeature.some((entidad) => {
          if (!["Polygon", "MultiPolygon"].includes(entidad?.geometry?.type)) return false;
          return Object.entries(entidad?.properties || {}).some(([clave, valor]) => (
            /^codigo_expediente$/i.test(clave) && String(valor || "") === codigo
          ));
        });
        if (!tienePoligonoPropio) continue;
      }
      const patronCodigo = new RegExp(`"codigo_expediente"\\s*:\\s*"${codigo}"`, "i");
      const coincidenciaCodigo = patronCodigo.exec(fuente);
      if (coincidenciaCodigo) {
        const indice = coincidenciaCodigo.index;
        hallazgos.push({
          firma,
          indice,
          linea: fuente.slice(0, indice).split("\n").length,
        });
      }
    }
  }
  const verticesNexus = /314500\s*[-–]\s*318500\s+Norte[\s\S]{0,240}?499000\s*[-–]\s*502000\s+Este/i;
  const coincidenciaNexus = verticesNexus.exec(fuente);
  if (coincidenciaNexus) {
    hallazgos.push({
      firma: "nexus_vertices_locales",
      indice: coincidenciaNexus.index,
      linea: fuente.slice(0, coincidenciaNexus.index).split("\n").length,
    });
  }
  return hallazgos;
}

/** O(P), P = 4 prefijos. Invariante: rutas públicas y el MDX final no entran
 * por semejanza; únicamente el perímetro fuente cerrado queda embargado. */
export function esRutaOperativaEmbargadaOro(valor) {
  const ruta = String(valor || "").replaceAll("\\", "/");
  return RUTAS_OPERATIVAS_EMBARGADAS_ORO.has(ruta)
    || PREFIJOS_OPERATIVOS_EMBARGADOS_ORO.some((prefijo) => ruta.startsWith(prefijo));
}

function normalizarRutaRelease(valor, etiqueta = "ruta de exclusión") {
  const original = typeof valor === "string" ? valor : "";
  if (!original || original !== original.trim() || CONTROL_RUTA.test(original)) {
    throw new Error(`${etiqueta} inválida: contiene vacío, espacios exteriores o caracteres de control`);
  }
  const ruta = original.replaceAll("\\", "/").replace(/^\.\//, "");
  if (!ruta || ruta.startsWith("/") || ruta.endsWith("/")
    || ruta.split("/").some((tramo) => !tramo || tramo === "." || tramo === "..")) {
    throw new Error(`${etiqueta} inválida: ${valor}`);
  }
  return ruta;
}

function resolverRaizAuditoria(valor, etiqueta) {
  if (typeof valor !== "string" || !valor || valor !== valor.trim() || CONTROL_RUTA.test(valor)) {
    throw new Error(`${etiqueta}: ruta inválida; no admite vacío, espacios exteriores ni caracteres de control`);
  }
  return resolve(valor);
}

/**
 * Enumera un árbol físico sin seguir enlaces. Complejidad O(F), F entradas;
 * espacio O(F). Invariante: un enlace o tipo no regular queda fuera de las
 * lecturas y registrado como error antes de inspeccionar contenido.
 */
async function inspeccionarArbolFisico(raiz, { rechazarGit = false } = {}) {
  const rutas = [];
  const errores = [];
  let estadoRaiz;
  try { estadoRaiz = await lstat(raiz); }
  catch (error) {
    return { rutas, errores: [`${raiz}: raíz ilegible (${error.message})`], raizSegura: false };
  }
  if (estadoRaiz.isSymbolicLink()) {
    return { rutas, errores: [`${raiz}: la raíz es un enlace simbólico`], raizSegura: false };
  }
  if (!estadoRaiz.isDirectory()) {
    return { rutas, errores: [`${raiz}: la raíz no es un directorio`], raizSegura: false };
  }
  try {
    const fisica = await realpath(raiz);
    if (fisica !== raiz) {
      return {
        rutas,
        errores: [`${raiz}: la ruta de la raíz atraviesa un enlace simbólico (${fisica})`],
        raizSegura: false,
      };
    }
  } catch (error) {
    return { rutas, errores: [`${raiz}: raíz no resoluble (${error.message})`], raizSegura: false };
  }

  async function recorrer(carpeta, prefijo = "") {
    let entradas;
    try { entradas = await readdir(carpeta, { withFileTypes: true }); }
    catch (error) {
      errores.push(`${prefijo || "."}: directorio ilegible (${error.message})`);
      return;
    }
    for (const entrada of entradas) {
      const ruta = prefijo ? `${prefijo}/${entrada.name}` : entrada.name;
      if (CONTROL_RUTA.test(entrada.name)) {
        errores.push(`${JSON.stringify(ruta)}: nombre con caracteres de control`);
        continue;
      }
      if (rechazarGit && ruta.split("/").includes(".git")) {
        errores.push(`${ruta}: un árbol release materializado no admite metadatos .git`);
        continue;
      }
      if (entrada.isSymbolicLink()) {
        errores.push(`${ruta}: enlace simbólico prohibido`);
      } else if (entrada.isDirectory()) {
        await recorrer(join(carpeta, entrada.name), ruta);
      } else if (entrada.isFile()) {
        rutas.push(ruta);
      } else {
        errores.push(`${ruta}: tipo de archivo no regular prohibido`);
      }
    }
  }
  await recorrer(raiz);
  return { rutas: rutas.sort(), errores, raizSegura: true };
}

function rutasVersionadasGit(raiz) {
  // Incluye archivos nuevos no ignorados: el contrato se calcula antes del
  // commit operativo y debe cerrar también lo que entraría en ese commit.
  const salida = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    {
      cwd: raiz,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  return salida.split("\0").filter(Boolean).map((ruta) => ruta.replaceAll("\\", "/"));
}

/** O(F) sobre el staging sin .git. Omite dependencias y salidas derivadas; el
 * resto constituye el árbol fuente que Vercel recibió para compilar. */
async function rutasFuenteStaging(raiz) {
  const omitidasRaiz = new Set([".git", ".vercel", ".venv-oro", "node_modules", "publico"]);
  const rutas = [];
  async function recorrer(carpeta, prefijo = "") {
    const entradas = await readdir(carpeta, { withFileTypes: true });
    for (const entrada of entradas) {
      if (!prefijo && omitidasRaiz.has(entrada.name)) continue;
      const ruta = prefijo ? `${prefijo}/${entrada.name}` : entrada.name;
      if (entrada.isDirectory()) await recorrer(join(carpeta, entrada.name), ruta);
      else if (entrada.isFile()) rutas.push(ruta);
    }
  }
  await recorrer(raiz);
  return rutas.sort();
}

/** O(F) sobre artefactos de texto del build; no interpreta binarios. */
async function rutasTextoBuild(raiz) {
  const rutas = [];
  async function recorrer(carpeta, prefijo) {
    let entradas;
    try { entradas = await readdir(carpeta, { withFileTypes: true }); }
    catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
    for (const entrada of entradas) {
      const ruta = `${prefijo}/${entrada.name}`;
      if (entrada.isDirectory()) await recorrer(join(carpeta, entrada.name), ruta);
      else if (entrada.isFile() && EXTENSION_TEXTO_BUILD.test(entrada.name)) rutas.push(ruta);
    }
  }
  for (const base of RAICES_BUILD_ORO) await recorrer(join(raiz, base), base);
  return rutas.sort();
}

function rutaEnlaceRepositorio(destino) {
  let valor = String(destino || "").trim().replace(/^<|>$/g, "");
  if (!valor || valor.startsWith("#") || /^(?:mailto|tel|data):/i.test(valor)) return null;
  try { valor = decodeURIComponent(valor); }
  catch { return null; }
  if (CONTROL_RUTA.test(valor)) throw new Error("enlace con ruta que contiene caracteres de control");
  try {
    const url = new URL(valor, "https://repositorio.local/salidas/");
    if (url.hostname === "github.com") {
      const partes = url.pathname.split("/").filter(Boolean);
      const marca = partes.findIndex((parte) => parte === "blob" || parte === "tree");
      if (marca < 2 || partes[marca + 1] !== "master" || partes.length <= marca + 2) return null;
      return { ruta: partes.slice(marca + 2).join("/"), directorio: partes[marca] === "tree" };
    }
    if (url.hostname !== "repositorio.local") return null;
    const ruta = url.pathname.replace(/^\//, "");
    if (!ruta || ruta.split("/").some((tramo) => tramo === "..")) return null;
    return { ruta, directorio: false };
  } catch {
    return null;
  }
}

async function anexosEnlazados(raiz, manuscrito, rutasVersionadas) {
  const destinos = [];
  const patrones = [
    /\]\((?<destino><[^>]+>|[^\s)]+)(?:\s+["'][^"']*["'])?\)/g,
    /\bhref=["'](?<destino>[^"']+)["']/gi,
    /^\s*\[[^\]]+\]:\s*(?<destino><[^>]+>|\S+)/gm,
  ];
  for (const patron of patrones) {
    for (const coincidencia of String(manuscrito || "").matchAll(patron)) {
      destinos.push(coincidencia.groups?.destino || "");
    }
  }
  const anexos = new Set();
  for (const destino of destinos) {
    const enlace = rutaEnlaceRepositorio(destino);
    if (!enlace) continue;
    let ruta;
    try { ruta = normalizarRutaRelease(enlace.ruta); }
    catch (error) { throw new Error(`enlace interno con ${error.message}`); }
    const prefijo = `${ruta}/`;
    let coincidencias = enlace.directorio
      ? rutasVersionadas.filter((versionada) => versionada.startsWith(prefijo))
      : rutasVersionadas.includes(ruta) ? [ruta] : [];
    if (!enlace.directorio && ruta.startsWith("data/")) {
      const publica = `public/${ruta}`;
      if (rutasVersionadas.includes(publica)) coincidencias.push(publica);
      else {
        try {
          if ((await stat(rutaConfinada(raiz, publica))).isFile()) coincidencias.push(publica);
        } catch { /* Una ruta web puede no corresponder a un anexo del repositorio. */ }
      }
    }
    for (const coincidencia of coincidencias) anexos.add(coincidencia);
  }
  return [...anexos].sort();
}

function recepcionAcreditadaReceptor(replicas, respuestas) {
  const estados = new Map((respuestas?.destinatarios || []).map((fila) => [fila?.destinatario_id, fila?.estado]));
  const respuestaDirecta = (respuestas?.eventos || []).some((evento) =>
    IDS_RECEPTOR_SIN_RECEPCION.has(evento?.destinatario_id)
      && evento?.estado === "respuesta"
      && ["respuesta", "respuesta_y_rebote"].includes(estados.get(evento.destinatario_id))
      && SHA256.test(String(evento?.mensaje_sha256 || ""))
      && Number.isFinite(Date.parse(String(evento?.fecha_utc || ""))));
  const confirmacionWeb = (replicas?.destinatarios || [])
    .filter((item) => IDS_RECEPTOR_SIN_RECEPCION.has(item?.id))
    .flatMap((item) => item?.canales_alternativos || (item?.canal_alternativo ? [item.canal_alternativo] : []))
    .some((canal) => canal?.estado === "aceptado" && canal?.recepcion_acreditada === true);
  return respuestaDirecta || confirmacionWeb;
}

/* Única excepción a la compuerta de geometría exacta. La capa pública legal
   publica a propósito los dos perímetros que la ANM sirve; el autor decidió
   redistribuirlos con atribución y sin licencia afirmativa. La excepción es
   deliberadamente estrecha: una sola ruta y dos firmas. El polígono de Crucitas
   (nexus_2594_poligono) y los vértices locales Nexus siguen prohibidos en todas
   partes, incluida esta ruta, porque dependen de suponer CRS y orden de ejes. */
/* La misma capa aparece con tres prefijos según la superficie inspeccionada:
   public/ en el repositorio, publico/ en la compilación local y static/ en el
   Build Output API. Se reconoce por la capa, no por el prefijo. */
const RUTA_CAPA_LEGAL_PUBLICA = /(?:^|\/)data\/oro\/legal\.geojson$/;
const FIRMAS_PERIMETRO_ANM_PUBLICABLES = new Set(["anm_jg4_poligono", "anm_cei_poligono"]);

function agregarHallazgosPrivacidad(destino, superficie, ruta, texto) {
  for (const hallazgo of detectarFirmasPrivacidadReceptor(texto)) {
    destino.push({ clase: "privacidad_receptor", superficie, ruta, ...hallazgo });
  }
  const publicableAqui = RUTA_CAPA_LEGAL_PUBLICA.test(String(ruta || ""));
  for (const hallazgo of detectarFirmasGeometriaExactaOro(texto)) {
    if (publicableAqui && FIRMAS_PERIMETRO_ANM_PUBLICABLES.has(hallazgo.firma)) continue;
    destino.push({ clase: "geometria_exacta", superficie, ruta, ...hallazgo });
  }
}

/**
 * Compuerta de privacidad previa a la recepción del receptor estadounidense.
 * Complejidad O(P·B + F), con P = 7 firmas, B bytes auditados y F rutas Git.
 * Espacio O(B + F). Invariantes: MDX, HTML y build jamás admiten exclusión;
 * una exclusión release es exacta, versionada y no funciona como patrón global.
 */
export async function auditarPrivacidadPerimetroPublicable(raiz, opciones = {}) {
  const errores = Array.isArray(opciones.erroresIniciales)
    ? opciones.erroresIniciales.map((error) => String(error))
    : [];
  let rutasVersionadas = opciones.rutasVersionadas;
  let fuenteRutasRelease = typeof opciones.fuenteRutasRelease === "string"
    ? opciones.fuenteRutasRelease
    : "inyectada";
  if (!Array.isArray(rutasVersionadas)) {
    try {
      rutasVersionadas = rutasVersionadasGit(raiz);
      fuenteRutasRelease = "git_ls_files";
    }
    catch (error) {
      try {
        await stat(join(raiz, ".git"));
        rutasVersionadas = [];
        errores.push(`no fue posible enumerar git tracked: ${error.message}`);
      } catch (estadoGit) {
        if (estadoGit.code !== "ENOENT") {
          rutasVersionadas = [];
          errores.push(`no fue posible comprobar .git: ${estadoGit.message}`);
        } else {
          try {
            rutasVersionadas = await rutasFuenteStaging(raiz);
            fuenteRutasRelease = "staging_sin_git";
          } catch (estadoStaging) {
            rutasVersionadas = [];
            errores.push(`no fue posible enumerar el staging sin .git: ${estadoStaging.message}`);
          }
        }
      }
    }
  }
  const rutasNormalizadas = [];
  if (!Array.isArray(rutasVersionadas)) {
    errores.push("inventario release inválido: se esperaba una lista de rutas");
    rutasVersionadas = [];
  }
  for (const valor of rutasVersionadas) {
    try { rutasNormalizadas.push(normalizarRutaRelease(valor, "ruta release")); }
    catch (error) { errores.push(error.message); }
  }
  rutasVersionadas = [...new Set(rutasNormalizadas)].sort();
  if (!RECEPTOR_PRIVADO && rutasVersionadas.some((ruta) => ruta.startsWith("manuscrito/"))) {
    errores.push("configuración privada del receptor ausente en el árbol operativo");
  }

  const exclusiones = new Set();
  const exclusionesNormalizadas = new Set();
  const exclusionesDeclaradas = opciones.rutasReleaseExcluidas ?? [];
  if (!Array.isArray(exclusionesDeclaradas)) {
    errores.push("exclusiones release inválidas: se esperaba una lista de rutas");
  }
  for (const valor of Array.isArray(exclusionesDeclaradas) ? exclusionesDeclaradas : []) {
    try {
      const ruta = normalizarRutaRelease(valor);
      if (exclusionesNormalizadas.has(ruta)) errores.push(`${ruta}: exclusión duplicada`);
      else exclusionesNormalizadas.add(ruta);
      if (ruta === RUTA_MANUSCRITO_ORO) errores.push(`${ruta}: el MDX no admite exclusión release`);
      else if (!rutasVersionadas.includes(ruta)) errores.push(`${ruta}: exclusión no corresponde a una ruta git tracked`);
      else if (fuenteRutasRelease === "staging_sin_git") errores.push(`${ruta}: declarada excluida, pero presente en el staging real`);
      else exclusiones.add(ruta);
    } catch (error) { errores.push(error.message); }
  }

  let manuscrito = opciones.manuscrito;
  if (typeof manuscrito !== "string") {
    try { manuscrito = await textoOpcional(join(raiz, RUTA_MANUSCRITO_ORO)); }
    catch (error) {
      manuscrito = null;
      errores.push(`${RUTA_MANUSCRITO_ORO}: manuscrito ilegible (${error.message})`);
    }
  }
  if (typeof manuscrito !== "string") {
    manuscrito = "";
    errores.push(`${RUTA_MANUSCRITO_ORO}: manuscrito ausente`);
  }

  const hallazgos = [];
  agregarHallazgosPrivacidad(hallazgos, "mdx", RUTA_MANUSCRITO_ORO, manuscrito);
  agregarHallazgosPrivacidad(hallazgos, "mdx", RUTA_MANUSCRITO_ORO, RUTA_MANUSCRITO_ORO);

  let htmlCompilado = opciones.htmlCompilado;
  if (typeof htmlCompilado !== "string") {
    try { htmlCompilado = compilarMdxOro(manuscrito).html; }
    catch (error) {
      htmlCompilado = "";
      errores.push(`html_compilado: ${error.message || "no disponible"}`);
    }
  }
  agregarHallazgosPrivacidad(hallazgos, "html_compilado", "[memoria]", htmlCompilado);

  let rutasBuild = [];
  try { rutasBuild = await rutasTextoBuild(raiz); }
  catch (error) {
    errores.push(`build: no fue posible enumerar todos los artefactos (${error.message})`);
  }
  for (const ruta of rutasBuild) {
    try {
      const texto = await readFile(rutaConfinada(raiz, ruta), "utf8");
      agregarHallazgosPrivacidad(hallazgos, "build", ruta, texto);
    } catch (error) {
      errores.push(`${ruta}: artefacto build ilegible (${error.message})`);
    }
  }

  let rutasAnexos = [];
  try { rutasAnexos = await anexosEnlazados(raiz, manuscrito, rutasVersionadas); }
  catch (error) { errores.push(`anexos enlazados: inventario ilegible (${error.message})`); }
  for (const ruta of rutasAnexos) {
    try {
      const contenido = await readFile(rutaConfinada(raiz, ruta));
      agregarHallazgosPrivacidad(hallazgos, "anexo_enlazado", ruta, ruta);
      agregarHallazgosPrivacidad(hallazgos, "anexo_enlazado", ruta, contenido.toString("utf8"));
    } catch (error) { errores.push(`${ruta}: anexo enlazado ilegible (${error.message})`); }
  }

  for (const ruta of rutasVersionadas) {
    try {
      const contenido = await readFile(rutaConfinada(raiz, ruta));
      agregarHallazgosPrivacidad(hallazgos, "git_tracked", ruta, ruta);
      agregarHallazgosPrivacidad(hallazgos, "git_tracked", ruta, contenido.toString("utf8"));
    } catch (error) { errores.push(`${ruta}: git tracked ilegible (${error.message})`); }
  }

  const unicos = [...new Map(hallazgos.map((hallazgo) => [
    `${hallazgo.superficie}\0${hallazgo.ruta}\0${hallazgo.firma}\0${hallazgo.linea}`,
    hallazgo,
  ])).values()];
  const noExcluibles = unicos.filter((hallazgo) =>
    ["mdx", "html_compilado", "build"].includes(hallazgo.superficie));
  const hallazgosRelease = unicos.filter((hallazgo) =>
    ["anexo_enlazado", "git_tracked"].includes(hallazgo.superficie)
      && hallazgo.ruta !== RUTA_MANUSCRITO_ORO);
  const rutasOperativasEmbargadas = rutasVersionadas.filter(esRutaOperativaEmbargadaOro);
  const rutasGeometriasExactas = [...new Set(unicos
    .filter((hallazgo) => hallazgo.clase === "geometria_exacta")
    .map((hallazgo) => hallazgo.ruta))].sort();
  const rutasGeometriasExactasRelease = new Set(hallazgosRelease
    .filter((hallazgo) => hallazgo.clase === "geometria_exacta")
    .map((hallazgo) => hallazgo.ruta));
  const rutasSensiblesRelease = [...new Set([
    ...hallazgosRelease.map((hallazgo) => hallazgo.ruta),
    ...rutasOperativasEmbargadas,
  ])].sort();
  const exclusionesRequeridas = [...rutasSensiblesRelease];
  const exclusionesPendientes = exclusionesRequeridas.filter((ruta) => !exclusiones.has(ruta));
  const exclusionesSobrantes = [...exclusionesNormalizadas]
    .filter((ruta) => !rutasSensiblesRelease.includes(ruta)).sort();
  const recepcionAcreditada = recepcionAcreditadaReceptor(opciones.replicas, opciones.respuestas);
  const noExcluiblesGeometria = noExcluibles.filter((hallazgo) => hallazgo.clase === "geometria_exacta");
  const exclusionesIrrevocablesPendientes = exclusionesPendientes.filter((ruta) =>
    esRutaOperativaEmbargadaOro(ruta) || rutasGeometriasExactasRelease.has(ruta));
  const cumple = errores.length === 0
    && exclusionesSobrantes.length === 0
    && noExcluiblesGeometria.length === 0
    && exclusionesIrrevocablesPendientes.length === 0
    && (recepcionAcreditada || (noExcluibles.length === 0 && exclusionesPendientes.length === 0));
  const firmas = [...new Set(unicos.map((hallazgo) => hallazgo.firma))].sort();
  const evidencia = recepcionAcreditada
    ? errores.length || exclusionesSobrantes.length
      ? `Recepción acreditada con compuerta técnica fallida: ${errores.length} errores y ${exclusionesSobrantes.length} exclusiones sobrantes.`
      : `Recepción acreditada; inventario informativo: ${unicos.length} hallazgos en ${new Set(unicos.map((item) => item.ruta)).size} rutas.`
    : cumple
      ? `Embargo previo a recepción activo: cero firmas en MDX/HTML/build y ${exclusiones.size} rutas git tracked excluidas expresamente del release.`
      : `Privacidad cerrada antes de recepción: ${noExcluibles.length} hallazgos no excluibles en MDX/HTML/build; ${exclusionesPendientes.length} exclusiones pendientes y ${exclusionesSobrantes.length} sobrantes; rutas sensibles: ${rutasSensiblesRelease.join(", ") || "ninguna"}; firmas: ${firmas.join(", ") || "ninguna"}; errores: ${errores.join("; ") || "ninguno"}.`;

  return {
    cumple,
    recepcionAcreditada,
    evidencia,
    hallazgos: unicos,
    firmas,
    noExcluibles,
    exclusionesAplicadas: [...exclusiones].sort(),
    rutasSensiblesRelease,
    rutasOperativasEmbargadas,
    rutasGeometriasExactas,
    exclusionesRequeridas,
    exclusionesPendientes,
    exclusionesSobrantes,
    anexosEnlazados: rutasAnexos,
    fuenteRutasRelease,
    errores,
  };
}

function resultadoMaterializadoInvalido(modo, raiz, errores) {
  return {
    esquema: 1,
    modo,
    raiz: String(raiz || ""),
    cumple: false,
    recepcionAcreditada: false,
    fuenteRutasRelease: modo,
    evidencia: errores.join("; "),
    hallazgos: [],
    firmas: [],
    noExcluibles: [],
    rutasSensiblesRelease: [],
    rutasOperativasEmbargadas: [],
    rutasGeometriasExactas: [],
    exclusionesAplicadas: [],
    exclusionesRequeridas: [],
    exclusionesPendientes: [],
    exclusionesSobrantes: [],
    errores,
  };
}

/** O(F·B) tiempo y O(F+B) espacio; F archivos públicos, B bytes por archivo.
 * Examina la salida física completa sin exclusiones virtuales. La continuidad
 * de un artículo nunca habilita correo, geometrías o localizadores privados. */
export async function auditarSalidaEstaticaOro(valorRaiz) {
  let raiz;
  try { raiz = resolverRaizAuditoria(valorRaiz, "salida estática"); }
  catch (error) { return resultadoMaterializadoInvalido("salida_estatica", valorRaiz, [error.message]); }
  const inspeccion = await inspeccionarArbolFisico(raiz, { rechazarGit: true });
  const errores = [...inspeccion.errores];
  const hallazgos = [];
  if (!inspeccion.raizSegura) return resultadoMaterializadoInvalido("salida_estatica", raiz, errores);
  if (!inspeccion.rutas.includes("blog/oro-perimetros/index.html")) errores.push("el artículo publicado falta en la salida estática");
  for (const ruta of inspeccion.rutas) {
    agregarHallazgosPrivacidad(hallazgos, "salida_estatica", ruta, ruta);
    if (esRutaOperativaEmbargadaOro(ruta)) errores.push(`${ruta}: archivo operativo en salida pública`);
    try {
      const contenido = await readFile(rutaConfinada(raiz, ruta));
      agregarHallazgosPrivacidad(hallazgos, "salida_estatica", ruta, contenido.toString("utf8"));
    } catch { errores.push(`${ruta}: archivo público ilegible`); }
  }
  return {
    esquema: 1,
    modo: "salida_estatica",
    cumple: errores.length === 0 && hallazgos.length === 0,
    archivosAuditados: inspeccion.rutas.length,
    errores,
    hallazgos,
  };
}

/**
 * Audita el árbol fuente exacto que se propone publicar. Complejidad O(P·B+F),
 * espacio O(B+F). Invariantes: no hay .git, symlinks ni exclusiones virtuales;
 * el resultado depende únicamente de los archivos materializados bajo la raíz.
 */
export async function auditarReleaseMaterializado(valorRaiz) {
  let raiz;
  try { raiz = resolverRaizAuditoria(valorRaiz, "release materializado"); }
  catch (error) {
    return resultadoMaterializadoInvalido("release_materializado", valorRaiz, [error.message]);
  }
  const inspeccion = await inspeccionarArbolFisico(raiz, { rechazarGit: true });
  if (!inspeccion.raizSegura || inspeccion.errores.length) {
    return resultadoMaterializadoInvalido("release_materializado", raiz, inspeccion.errores);
  }
  const auditoria = await auditarPrivacidadPerimetroPublicable(raiz, {
    rutasVersionadas: inspeccion.rutas,
    rutasReleaseExcluidas: [],
    fuenteRutasRelease: "release_materializado",
    erroresIniciales: inspeccion.errores,
  });
  return {
    esquema: 1,
    modo: "release_materializado",
    raiz,
    ...auditoria,
  };
}

/**
 * Audita únicamente un Build Output API ya materializado. Complejidad O(P·B+F),
 * espacio O(B+F). Invariantes: la ruta termina en .vercel/output; config.json y
 * static son físicos; ningún enlace, firma ni exclusión declarativa es válido.
 */
export async function auditarPrebuiltMaterializado(valorRaiz) {
  let raiz;
  try { raiz = resolverRaizAuditoria(valorRaiz, "prebuilt"); }
  catch (error) {
    return resultadoMaterializadoInvalido("prebuilt_vercel_output", valorRaiz, [error.message]);
  }
  const errores = [];
  if (basename(raiz) !== "output" || basename(dirname(raiz)) !== ".vercel") {
    errores.push(`${raiz}: --auditar-prebuilt exige una ruta terminada en .vercel/output`);
  }
  const inspeccion = await inspeccionarArbolFisico(raiz);
  errores.push(...inspeccion.errores);
  if (!inspeccion.raizSegura || inspeccion.errores.length) {
    return resultadoMaterializadoInvalido("prebuilt_vercel_output", raiz, errores);
  }

  let configuracion = null;
  if (!inspeccion.rutas.includes("config.json")) {
    errores.push("config.json: ausente en el Build Output API");
  } else {
    try {
      configuracion = JSON.parse(await readFile(join(raiz, "config.json"), "utf8"));
      if (configuracion?.version !== 3) errores.push("config.json: version debe ser 3");
    } catch (error) {
      errores.push(`config.json: ilegible o JSON inválido (${error.message})`);
    }
  }
  try {
    const estadoStatic = await lstat(join(raiz, "static"));
    if (estadoStatic.isSymbolicLink()) errores.push("static: enlace simbólico prohibido");
    else if (!estadoStatic.isDirectory()) errores.push("static: no es un directorio");
  } catch (error) {
    errores.push(`static: ausente o ilegible (${error.message})`);
  }

  const hallazgos = [];
  for (const ruta of inspeccion.rutas) {
    agregarHallazgosPrivacidad(hallazgos, "prebuilt", ruta, ruta);
    try {
      const contenido = await readFile(rutaConfinada(raiz, ruta));
      agregarHallazgosPrivacidad(hallazgos, "prebuilt", ruta, contenido.toString("utf8"));
    } catch (error) {
      errores.push(`${ruta}: artefacto prebuilt ilegible (${error.message})`);
    }
  }
  const unicos = [...new Map(hallazgos.map((hallazgo) => [
    `${hallazgo.superficie}\0${hallazgo.ruta}\0${hallazgo.firma}\0${hallazgo.linea}`,
    hallazgo,
  ])).values()];
  const firmas = [...new Set(unicos.map((hallazgo) => hallazgo.firma))].sort();
  const rutasSensiblesRelease = [...new Set(unicos.map((hallazgo) => hallazgo.ruta))].sort();
  const rutasGeometriasExactas = [...new Set(unicos
    .filter((hallazgo) => hallazgo.clase === "geometria_exacta")
    .map((hallazgo) => hallazgo.ruta))].sort();
  const cumple = errores.length === 0 && rutasSensiblesRelease.length === 0;
  return {
    esquema: 1,
    modo: "prebuilt_vercel_output",
    raiz,
    cumple,
    recepcionAcreditada: false,
    evidencia: cumple
      ? `${inspeccion.rutas.length} archivos físicos del Build Output API sin firmas sensibles.`
      : `${rutasSensiblesRelease.length} rutas prebuilt sensibles; ${errores.length} errores técnicos.`,
    hallazgos: unicos,
    firmas,
    noExcluibles: unicos,
    rutasSensiblesRelease,
    rutasOperativasEmbargadas: [],
    rutasGeometriasExactas,
    exclusionesAplicadas: [],
    exclusionesRequeridas: [...rutasSensiblesRelease],
    exclusionesPendientes: [...rutasSensiblesRelease],
    exclusionesSobrantes: [],
    archivosAuditados: inspeccion.rutas.length,
    errores,
  };
}

/** Complejidad O(F·P), F entidades y P propiedades; no modifica geometrías. */
export function auditarGeoJsonPublico(coleccion) {
  if (coleccion?.type !== "FeatureCollection" || !Array.isArray(coleccion.features)) {
    return ["GeoJSON inválido: se esperaba FeatureCollection"];
  }
  const fallas = [];
  coleccion.features.forEach((feature, indice) => {
    const propiedades = feature?.properties || {};
    if (TIPOS_SENSIBLES.test(String(propiedades.tipo || ""))) {
      fallas.push(`entidad ${indice}: tipo sensible ${propiedades.tipo}`);
    }
    for (const campo of Object.keys(propiedades)) {
      if (CAMPOS_PERSONALES.test(campo)) fallas.push(`entidad ${indice}: campo personal ${campo}`);
    }
  });
  return fallas;
}

function rutaConfinada(base, candidata) {
  const baseAbsoluta = resolve(base);
  const objetivo = resolve(base, candidata);
  const tramo = relative(baseAbsoluta, objetivo);
  if (isAbsolute(tramo) || tramo === ".." || tramo.startsWith(`..${sep}`)) {
    throw new Error("ruta fuera del directorio público");
  }
  return objetivo;
}

async function hashArchivo(ruta) {
  const contenido = await readFile(ruta);
  return { contenido, sha256: createHash("sha256").update(contenido).digest("hex") };
}

/** O(B) tiempo y espacio, B bytes de los artefactos. La salida enlaza la
 * medición con el código, los estilos, el HTML compilable y el manifiesto que
 * la produjeron; cualquier cambio posterior invalida la puerta. */
export async function huellasArtefactosRendimiento(raiz) {
  const manuscrito = await readFile(join(raiz, "salidas", "oro-perimetros.mdx"), "utf8");
  const htmlArticulo = Buffer.from(compilarMdxOro(manuscrito).html, "utf8");
  const entradas = {
    css_componente_sha256: join(raiz, "components", "MapaOro.css"),
    css_mapa_servido_sha256: join(raiz, "activos", "mapa-oro.css"),
    css_sitio_sha256: join(raiz, "activos", "estilos.css"),
    js_mapa_sha256: join(raiz, "activos", "mapa-oro.js"),
    js_cargador_sha256: join(raiz, "activos", "cargar-mapa-oro.js"),
    worker_maplibre_sha256: join(raiz, "activos", "maplibre-gl-worker.mjs"),
    shared_maplibre_sha256: join(raiz, "activos", "maplibre-gl-shared.mjs"),
    manifiesto_sha256: join(raiz, "public", "data", "oro", "manifiesto.json"),
    vercel_config_sha256: join(raiz, "vercel.json"),
  };
  const huellas = Object.fromEntries(await Promise.all(Object.entries(entradas).map(async ([nombre, ruta]) => {
    const { sha256 } = await hashArchivo(ruta);
    return [nombre, sha256];
  })));
  huellas.html_articulo_sha256 = createHash("sha256").update(htmlArticulo).digest("hex");
  return { esquema: 1, ...huellas };
}

async function auditarCapasPublicas(raiz, manifiesto) {
  if (!manifiesto || manifiesto.version !== 2
    || !Array.isArray(manifiesto.capas) || manifiesto.capas.length !== 9) {
    return { cumple: false, evidencia: "Falta public/data/oro/manifiesto.json v2 con exactamente nueve familias de capas." };
  }
  const familias = new Set(manifiesto.capas.map((capa) => capa.familia));
  const esperadas = ["legal", "huella", "delta", "proteccion", "agua", "tension", "buffers", "rutas", "eventos"];
  const faltan = esperadas.filter((familia) => !familias.has(familia));
  const fallas = [];
  const base = join(raiz, "public", "data", "oro");
  for (const capa of manifiesto.capas) {
    if (!capa.archivo || !capa.fuente || !capa.fecha || !capa.licencia
      || !capa.licenciaMaterialPropio || !capa.derechosGeometria
      || typeof capa.descarga?.habilitada !== "boolean"
      || !capa.descarga?.motivo || !SHA256.test(capa.sha256 || "")) {
      fallas.push(`${capa.id || "capa"}: metadatos incompletos`);
      continue;
    }
    if (/TODO/i.test(capa.licencia)) fallas.push(`${capa.id}: licencia abierta`);
    if (/c[oó]digo[^.]{0,80}CC BY/i.test(capa.licenciaMaterialPropio)) {
      fallas.push(`${capa.id}: CC BY no puede licenciar el código reservado`);
    }
    if (capa.descarga.habilitada !== true) {
      fallas.push(`${capa.id}: matriz de descarga no coincide con 9/9 descargas`);
    }
    try {
      const ruta = rutaConfinada(base, capa.archivo);
      const estado = await stat(ruta);
      if (!capa.archivo.endsWith(".pmtiles") && estado.size >= 500_000) fallas.push(`${capa.id}: ${estado.size} B`);
      const { contenido, sha256 } = await hashArchivo(ruta);
      if (sha256 !== capa.sha256) fallas.push(`${capa.id}: SHA-256 no coincide`);
      if (capa.archivo.endsWith(".geojson")) {
        try {
          const coleccion = JSON.parse(contenido.toString("utf8"));
          fallas.push(...auditarGeoJsonPublico(coleccion).map((falla) => `${capa.id}: ${falla}`));
          if (capa.familia === "legal") {
            const codigos = new Set();
            const expedientes = new Set(["JG4-16531", "CEI-101", "2594"]);
            // La capa legal publica dos geometrías de naturaleza distinta y no
            // deben confundirse: tres anclas OSM de contexto y los dos
            // perímetros que la ANM sirve. Crucitas jamás lleva polígono: su
            // reconstrucción depende de suponer CRS y orden de ejes sobre
            // vértices que la sentencia llama aproximados.
            const anclas = coleccion.features.filter(
              (entidad) => entidad?.properties?.tipo === "ancla_territorial_contexto",
            );
            const perimetros = coleccion.features.filter(
              (entidad) => entidad?.properties?.tipo === "perimetro_legal_anm",
            );
            if (anclas.length !== 3) {
              fallas.push(`${capa.id}: legal exige exactamente 3 anclas OSM`);
            }
            if (perimetros.length !== 2
              || anclas.length + perimetros.length !== coleccion.features.length) {
              fallas.push(`${capa.id}: legal exige exactamente 2 perímetros ANM y ninguna otra entidad`);
            }
            for (const entidad of perimetros) {
              const propiedades = entidad?.properties || {};
              const codigo = String(propiedades.codigo_expediente || "");
              if (entidad?.geometry?.type !== "Polygon") {
                fallas.push(`${capa.id}: ${codigo || "perímetro"} no es Polygon`);
              }
              if (codigo === "2594" || !["JG4-16531", "CEI-101"].includes(codigo)) {
                fallas.push(`${capa.id}: perímetro de expediente no admitido`);
              }
              if (!Number.isFinite(propiedades.area_legal_ha)
                || !Number.isFinite(propiedades.perimetro_legal_km)
                || !/no declarad/i.test(String(propiedades.precision_fuente || ""))) {
                fallas.push(`${capa.id}: ${codigo || "perímetro"} sin área, perímetro o límite de precisión`);
              }
              // El servicio se cita; la consulta jamás: lleva NOMBRE_DE_TITULAR
              // y publicarla entregaría a los cotitulares reservados.
              if (/query\?|outFields|NOMBRE_DE_TITULAR/i.test(String(propiedades.fuente_url || ""))) {
                fallas.push(`${capa.id}: ${codigo || "perímetro"} publica una consulta ANM con titulares`);
              }
              if (Object.hasOwn(propiedades, "titularidad_registral")
                || Object.hasOwn(propiedades, "titularidad_alcance")) {
                fallas.push(`${capa.id}: ${codigo || "perímetro"} conserva titularidad operativa`);
              }
            }
            for (const entidad of anclas) {
              const propiedades = entidad?.properties || {};
              const codigo = String(propiedades.codigo_expediente || "");
              const osmId = propiedades.osm_id;
              if (entidad?.geometry?.type !== "Point"
                || !Array.isArray(entidad.geometry.coordinates)
                || entidad.geometry.coordinates.length !== 2
                || entidad.geometry.coordinates.some((valor) => !Number.isFinite(valor))) {
                fallas.push(`${capa.id}: ${codigo || "entidad"} no es Point OSM válido`);
              }
              if (!expedientes.has(codigo) || codigos.has(codigo)) {
                fallas.push(`${capa.id}: expediente ausente, duplicado o inesperado`);
              }
              codigos.add(codigo);
              if (!Number.isInteger(osmId) || osmId <= 0
                || propiedades.osm_tipo !== "node"
                || propiedades.geometria_fuente_url !== `https://www.openstreetmap.org/node/${osmId}`
                || !/ancla territorial OSM de contexto/i.test(String(propiedades.geometria_representa || ""))
                || propiedades.licencia_geometria !== "ODbL 1.0") {
                fallas.push(`${capa.id}: ${codigo || "entidad"} carece de procedencia OSM/ODbL`);
              }
              if (Object.hasOwn(propiedades, "titularidad_registral")
                || Object.hasOwn(propiedades, "titularidad_alcance")) {
                fallas.push(`${capa.id}: ${codigo || "entidad"} conserva titularidad operativa`);
              }
            }
            if (codigos.size !== expedientes.size
              || [...expedientes].some((codigo) => !codigos.has(codigo))) {
              fallas.push(`${capa.id}: faltan expedientes de contexto en las anclas OSM`);
            }
          }
          if (capa.familia === "tension") {
            const escenarios = coleccion.metadatos?.escenarios_pesos || [];
            if (escenarios.length !== 3 || escenarios.some((escenario) =>
              Math.abs(Object.values(escenario.pesos || {}).reduce((suma, valor) => suma + valor, 0) - 1) > 1e-9)) {
              fallas.push(`${capa.id}: sensibilidad no contiene tres juegos de pesos unitarios`);
            }
          }
          if (capa.familia === "rutas" && !coleccion.features.some((entidad) =>
            entidad.properties?.tipo === "flujo_aduanero_agregado"
              && entidad.properties?.vista === "mundo")) {
            fallas.push(`${capa.id}: falta flujo aduanero agregado en vista mundo`);
          }
        } catch { fallas.push(`${capa.id}: GeoJSON ilegible`); }
      }
    } catch (error) { fallas.push(`${capa.id}: ${error.message || "archivo ausente"}`); }
  }
  return {
    cumple: faltan.length === 0 && fallas.length === 0,
    evidencia: faltan.length || fallas.length
      ? `Familias faltantes: ${faltan.join(", ") || "ninguna"}. Fallas: ${fallas.join("; ") || "ninguna"}.`
      : `${manifiesto.capas.length} capas con archivo, procedencia, derechos separados, 9/9 descargas y anclas OSM verificadas.`,
  };
}

function jsonDesdeBytes(contenido) {
  try { return JSON.parse(contenido.toString("utf8")); }
  catch { return null; }
}

function codigoSmtpCompleto(acuse) {
  return acuse?.estado === "aceptado"
    && acuse?.smtp?.auth_codigo === 235
    && acuse?.smtp?.mail_codigo === 250
    && [250, 251].includes(acuse?.smtp?.rcpt_codigo)
    && acuse?.smtp?.data_codigo === 250
    && SHA256.test(String(acuse?.smtp?.mail_respuesta_sha256 || ""))
    && SHA256.test(String(acuse?.smtp?.rcpt_respuesta_sha256 || ""))
    && SHA256.test(String(acuse?.smtp?.data_respuesta_sha256 || ""));
}

function estadoAgregado(eventos) {
  const estados = new Set(eventos.map((evento) => evento.estado));
  if (estados.has("respuesta") && estados.has("rebote")) return "respuesta_y_rebote";
  if (estados.has("respuesta")) return "respuesta";
  if (estados.has("rebote")) return "rebote";
  return "sin_evento_registrado";
}

/**
 * Verifica el único canal web alternativo sin convertir intento en recepción.
 * Complejidad O(B), B bytes de estado, acuse, cuerpo y cuestionario.
 */
export async function auditarCanalAlternativo(raiz, item, hoy) {
  const alt = item?.canal_alternativo;
  const fallas = [];
  if (!alt || alt.tipo !== "formulario_oficial" || alt.url !== URL_CONTACTO_RECEPTOR
    || !FORMULARIOS_REPLICA_APROBADOS.has(alt.form_id) || !FECHA.test(String(alt.fecha || ""))
    || !FECHA.test(String(alt.espera_desde || ""))) {
    return { cumple: false, recepcion: false, excepcion: false, fallas: ["control alternativo ausente o inválido"] };
  }
  try {
    if (!plazoReplicaCumplido(alt.espera_desde, hoy)) fallas.push("plazo alternativo incompleto");
  } catch { fallas.push("fecha del canal alternativo inválida"); }
  for (const campo of [
    "estado_preparado_sha256", "acuse_sha256", "cuerpo_fuente_sha256", "cuerpo_sha256", "cuestionario_sha256",
  ]) {
    if (!SHA256.test(String(alt[campo] || ""))) fallas.push(`${campo} inválido`);
  }
  let preparado;
  let acuse;
  try {
    const base = join(raiz, "manuscrito");
    const preparadoHash = await hashArchivo(rutaConfinada(base, alt.estado_preparado_archivo));
    const acuseHash = await hashArchivo(rutaConfinada(base, alt.acuse_archivo));
    const cuerpoHash = await hashArchivo(rutaConfinada(base, alt.cuerpo_archivo));
    const cuestionarioHash = await hashArchivo(rutaConfinada(join(base, "cuestionarios"), item.cuestionario_archivo));
    if (preparadoHash.sha256 !== alt.estado_preparado_sha256) fallas.push("hash del estado preparado no coincide");
    if (acuseHash.sha256 !== alt.acuse_sha256) fallas.push("hash del acuse alternativo no coincide");
    if (cuerpoHash.sha256 !== alt.cuerpo_fuente_sha256) fallas.push("hash del cuerpo fuente no coincide");
    if (createHash("sha256").update(cuerpoHash.contenido.toString("utf8").trim()).digest("hex") !== alt.cuerpo_sha256) {
      fallas.push("hash del cuerpo enviado no coincide");
    }
    if (cuestionarioHash.sha256 !== alt.cuestionario_sha256
      || cuestionarioHash.sha256 !== item.cuestionario_sha256_congelado) {
      fallas.push("hash del cuestionario alternativo no coincide");
    }
    preparado = jsonDesdeBytes(preparadoHash.contenido);
    acuse = jsonDesdeBytes(acuseHash.contenido);
  } catch (error) {
    fallas.push(error.message || "artefacto alternativo ausente");
  }
  if (!preparado || preparado.estado !== "preparado" || preparado.url !== alt.url
    || preparado.form_id !== alt.form_id || preparado.clics_planeados !== 1
    || preparado.cuerpo_sha256 !== alt.cuerpo_sha256
    || preparado.cuestionario_sha256_verificado !== alt.cuestionario_sha256) {
    fallas.push("estado preparado inconsistente");
  }
  if (!acuse || acuse.estado !== alt.estado || acuse.url !== alt.url || acuse.form_id !== alt.form_id
    || ![0, 1].includes(acuse.clics_realizados) || acuse.clics_realizados > preparado?.clics_planeados
    || acuse.cuerpo_sha256 !== alt.cuerpo_sha256
    || acuse.cuestionario_sha256_verificado !== alt.cuestionario_sha256
    || acuse.estado_preparado_sha256 !== alt.estado_preparado_sha256
    || acuse.reintento_automatico_permitido !== false) {
    fallas.push("acuse alternativo inconsistente");
  }

  let recepcion = false;
  let excepcion = false;
  if (alt.estado === "aceptado") {
    recepcion = alt.recepcion_acreditada === true && acuse?.confirmacion?.detectada === true;
    if (!recepcion || alt.excepcion_documental === true) fallas.push("aceptación sin confirmación acreditada");
  } else if (alt.estado === "bloqueado_captcha") {
    excepcion = alt.recepcion_acreditada === false
      && alt.excepcion_documental === true
      && typeof alt.motivo === "string" && alt.motivo.length >= 40
      && /^https:\/\//.test(String(alt.fuente_contacto || ""))
      && Array.isArray(alt.canales_agotados) && alt.canales_agotados.length >= 2
      && acuse?.confirmacion?.detectada === false
      && acuse?.clics_realizados === 1;
    if (!excepcion) fallas.push("captcha sin excepción documental completa");
    else fallas.push("canal alternativo sin recepción acreditada");
  } else {
    fallas.push(`estado alternativo no admisible: ${alt.estado || "ausente"}`);
  }
  return { cumple: fallas.length === 0, recepcion, excepcion, fallas };
}

/**
 * Acredita que cada respuesta quedó autorizada, revisada y anexada íntegra.
 * Complejidad O(E·B), con E respuestas y B bytes de manuscrito/anexos.
 * El correo original permanece privado; el anexo es el artefacto publicable.
 */
export async function auditarIntegracionesReplica(raiz, respuestas, manuscrito, integracionesEntrada = undefined) {
  const eventos = (respuestas?.eventos || []).filter((evento) => evento?.estado === "respuesta");
  const fallas = [];
  const integraciones = integracionesEntrada === undefined
    ? await jsonOpcional(join(raiz, "manuscrito", "integraciones-replica.json"))
    : integracionesEntrada;
  const filas = Array.isArray(integraciones?.integraciones) ? integraciones.integraciones : [];
  if (integraciones?.esquema !== 1 || integraciones?.estudio !== "oro-perimetros" || !Array.isArray(integraciones?.integraciones)) {
    fallas.push("inventario de integraciones ausente o inválido");
  }
  const hashes = filas.map((fila) => fila?.mensaje_sha256);
  if (hashes.some((hash) => !SHA256.test(String(hash || ""))) || new Set(hashes).size !== hashes.length) {
    fallas.push("integraciones repetidas o sin hash válido");
  }
  const respuestasPorHash = new Map(eventos.map((evento) => [evento.mensaje_sha256, evento]));
  const integracionesValidas = new Set();
  for (const fila of filas) {
    const evento = respuestasPorHash.get(fila?.mensaje_sha256);
    if (!evento) {
      fallas.push("integración sin evento de respuesta correspondiente");
      continue;
    }
    const modoIntegro = fila.modo === "anexo_integro"
      && evento.autorizacion_publicacion_explicita === true
      && fila.autorizacion_publicacion_explicita === true;
    const modoResumen = fila.modo === "resumen_factual"
      && evento.autorizacion_publicacion_explicita === false
      && fila.autorizacion_publicacion_explicita === false
      && fila.datos_reservados_excluidos === true
      && fila.imputaciones_nuevas === false
      && Array.isArray(fila.hechos_verificados) && fila.hechos_verificados.length >= 1
      && fila.hechos_verificados.every((hecho) => typeof hecho === "string" && hecho.trim().length >= 20)
      && Array.isArray(fila.documentos_publicos) && fila.documentos_publicos.length >= 1
      && fila.documentos_publicos.every((url) => /^https:\/\//.test(String(url)));
    if ((!modoIntegro && !modoResumen)
      || fila.estado !== "integrada"
      || fila.destinatario_id !== evento.destinatario_id
      || fila.revision_editorial !== true
      || !Number.isFinite(Date.parse(String(fila.fecha_integracion_utc || "")))
      || Date.parse(fila.fecha_integracion_utc) < Date.parse(evento.fecha_utc)
      || !SHA256.test(String(fila.anexo_sha256 || ""))
      || !/^anexos-replica\/[a-f0-9]{64}\.md$/.test(String(fila.anexo_archivo || ""))) {
      fallas.push(`${evento.destinatario_id}: integración editorial incompleta o sin autorización expresa`);
      continue;
    }
    try {
      const base = join(raiz, "manuscrito");
      const anexo = await hashArchivo(rutaConfinada(base, fila.anexo_archivo));
      const textoAnexo = anexo.contenido.toString("utf8").trim();
      const primera = manuscrito.indexOf(textoAnexo);
      if (anexo.sha256 !== fila.anexo_sha256 || textoAnexo.length < 40
        || primera < 0 || manuscrito.indexOf(textoAnexo, primera + textoAnexo.length) >= 0) {
        fallas.push(`${evento.destinatario_id}: anexo íntegro ausente, repetido o con hash distinto`);
      } else {
        integracionesValidas.add(evento.mensaje_sha256);
      }
    } catch (error) {
      fallas.push(`${evento.destinatario_id}: ${error.message || "anexo publicable ausente"}`);
    }
  }
  for (const evento of eventos) {
    if (!integracionesValidas.has(evento.mensaje_sha256)) {
      fallas.push(`${evento.destinatario_id}: respuesta sin integración editorial acreditada`);
    }
  }
  return {
    cumple: fallas.length === 0,
    respuestas: eventos.length,
    integradas: integracionesValidas.size,
    fallas,
  };
}

/** Complejidad O(D + E + B), D destinatarios, E eventos y B bytes de acuses. */
export async function auditarReplicas(raiz, replicas, respuestas, hoy, opciones = {}) {
  const destinatarios = replicas?.destinatarios || [];
  const fallas = [];
  const ids = destinatarios.map((item) => item.id);
  const idsEsperados = [...DESTINATARIOS_REPLICA_ESPERADOS].sort();
  const idsRecibidos = [...ids].sort();
  if (replicas?.completo !== true || JSON.stringify(idsRecibidos) !== JSON.stringify(idsEsperados)) {
    fallas.push(`inventario incompleto o alterado: ${destinatarios.length}/${idsEsperados.length}`);
  }
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) fallas.push("destinatarios repetidos o sin id");

  const sujetosDeclarados = Array.isArray(replicas?.sujetos_materiales) ? replicas.sujetos_materiales : [];
  const firmaSujetos = (sujetos) => sujetos.map((sujeto) => ({
    id: sujeto?.id,
    terminos: Array.isArray(sujeto?.terminos) ? [...sujeto.terminos] : [],
    canales: Array.isArray(sujeto?.canales) ? [...sujeto.canales] : [],
  })).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  if (JSON.stringify(firmaSujetos(sujetosDeclarados)) !== JSON.stringify(firmaSujetos(SUJETOS_MATERIALES_ESPERADOS))) {
    fallas.push("inventario de sujetos materiales incompleto o alterado");
  }

  const estadosPublicos = respuestas?.destinatarios || [];
  const eventos = respuestas?.eventos || [];
  const estadosPermitidos = new Set(["sin_evento_registrado", "respuesta", "rebote", "respuesta_y_rebote"]);
  if (respuestas?.esquema !== 1 || respuestas?.estudio !== "oro-perimetros"
    || estadosPublicos.length !== destinatarios.length || !Array.isArray(eventos)) {
    fallas.push("índice público de respuestas incompleto");
  }
  const fechaConsultaBogota = fechaBogotaDesdeIso(respuestas?.ultima_consulta_utc);
  if (!fechaConsultaBogota || fechaUtc(fechaConsultaBogota) > fechaUtc(hoy)) {
    fallas.push("sello final de consulta IMAP ausente, inválido o futuro");
  }
  const mapaEstados = new Map();
  for (const fila of estadosPublicos) {
    if (!fila || Object.keys(fila).sort().join(",") !== "destinatario_id,estado"
      || !ids.includes(fila.destinatario_id) || mapaEstados.has(fila.destinatario_id)
      || !estadosPermitidos.has(fila.estado)) {
      fallas.push("estado público inválido o repetido");
      continue;
    }
    mapaEstados.set(fila.destinatario_id, fila.estado);
  }
  const hashesEvento = new Set();
  for (const evento of eventos) {
    if (!evento || !ids.includes(evento.destinatario_id) || !["respuesta", "rebote"].includes(evento.estado)
      || !SHA256.test(String(evento.mensaje_sha256 || "")) || hashesEvento.has(evento.mensaje_sha256)
      || !Number.isFinite(Date.parse(String(evento.fecha_utc || "")))
      || typeof evento.autorizacion_publicacion_explicita !== "boolean") {
      fallas.push("evento público inválido o repetido");
      continue;
    }
    hashesEvento.add(evento.mensaje_sha256);
  }
  for (const id of ids) {
    const esperado = estadoAgregado(eventos.filter((evento) => evento.destinatario_id === id));
    if (mapaEstados.get(id) !== esperado) fallas.push(`${id}: estado agregado no coincide con eventos`);
  }

  let canalesSinRebote = 0;
  let respuestasRecibidas = 0;
  let recepcionesAlternativas = 0;
  let excepciones = 0;
  const canalesRecepcion = new Map();
  for (const item of destinatarios) {
    const fallasAntes = fallas.length;
    let diasCalculados = -1;
    let calendarioEsperado = [];
    let plazoCerrado = false;
    try {
      diasCalculados = diasHabilesTranscurridos(item.enviado, hoy);
      calendarioEsperado = calendarioDiasHabiles(item.enviado);
      plazoCerrado = plazoReplicaCumplido(item.enviado, hoy);
    }
    catch { fallas.push(`${item.id || "destinatario"}: fecha de envío inválida`); }
    if (!item.enviado || !item.acuse || !Array.isArray(item.calendario) || item.calendario.length !== 5
      || JSON.stringify(item.calendario) !== JSON.stringify(calendarioEsperado) || !plazoCerrado
      || !Number.isInteger(item.dias_habiles_verificados) || item.dias_habiles_verificados < 5
      || item.dias_habiles_verificados > diasCalculados || diasCalculados < 5
      || !item.acuse_archivo || !SHA256.test(item.acuse_sha256 || "")) {
      fallas.push(`${item.id}: envío, calendario o plazo incompleto`);
    }
    if (!fechaConsultaBogota || !plazoReplicaCumplido(item.enviado, fechaConsultaBogota)) {
      fallas.push(`${item.id}: falta consulta IMAP sellada después del quinto día hábil`);
    }
    try {
      const cuestionarioRuta = rutaConfinada(join(raiz, "manuscrito", "cuestionarios"), item.cuestionario_archivo);
      const cuestionarioActual = await hashArchivo(cuestionarioRuta);
      if (!SHA256.test(String(item.cuestionario_sha256_congelado || ""))
        || cuestionarioActual.sha256 !== item.cuestionario_publico_sha256) {
        fallas.push(`${item.id}: cuestionario público no coincide con su hash o falta el compromiso congelado`);
      }
      const ruta = rutaConfinada(join(raiz, "manuscrito", "acuse"), item.acuse_archivo);
      const originalHash = await hashArchivo(ruta);
      const original = jsonDesdeBytes(originalHash.contenido);
      if (originalHash.sha256 !== item.acuse_sha256 || !codigoSmtpCompleto(original)
        || original?.destinatario_id !== item.id
        || original?.cuestionario_sha256 !== item.cuestionario_sha256_congelado
        || original?.message_id_sha256 !== item.message_id_sha256
        || !SHA256.test(String(item.message_id_sha256 || ""))) {
        fallas.push(`${item.id}: acuse original inconsistente`);
      }
    } catch (error) { fallas.push(`${item.id}: ${error.message || "acuse original ausente"}`); }

    let cuestionarioTexto = "";
    try {
      cuestionarioTexto = await readFile(
        rutaConfinada(join(raiz, "manuscrito", "cuestionarios"), item.cuestionario_archivo),
        "utf8",
      );
    } catch { /* La ausencia ya fue registrada en la validación del hash. */ }
    if (/(?:NOT SENT|NO ENVIADO)/i.test(cuestionarioTexto)) {
      const aclaracion = item.aclaracion_estado;
      try {
        if (!aclaracion || aclaracion.estado !== "aceptado"
          || aclaracion.in_reply_to_sha256 !== item.message_id_sha256
          || aclaracion.references_sha256 !== item.message_id_sha256
          || aclaracion.plazo_desde_recepcion_original !== true
          || !aclaracion.acuse_archivo || !SHA256.test(String(aclaracion.acuse_sha256 || ""))) {
          throw new Error("control de aclaración incompleto");
        }
        const ruta = rutaConfinada(join(raiz, "manuscrito", "acuse"), aclaracion.acuse_archivo);
        const aclaracionHash = await hashArchivo(ruta);
        const acuseAclaracion = jsonDesdeBytes(aclaracionHash.contenido);
        if (aclaracionHash.sha256 !== aclaracion.acuse_sha256 || !codigoSmtpCompleto(acuseAclaracion)
          || acuseAclaracion?.tipo !== "aclaracion-estado" || acuseAclaracion?.destinatario_id !== item.id
          || acuseAclaracion?.message_id_original_sha256 !== item.message_id_sha256
          || acuseAclaracion?.in_reply_to_sha256 !== item.message_id_sha256
          || acuseAclaracion?.references_sha256 !== item.message_id_sha256
          || !SHA256.test(String(acuseAclaracion?.acuse_original_sha256 || ""))
          || acuseAclaracion?.cuestionario_sha256_verificado !== item.cuestionario_sha256_congelado
          || acuseAclaracion?.cuestionario_incluido !== false) {
          throw new Error("acuse de aclaración inconsistente");
        }
      } catch (error) { fallas.push(`${item.id}: ${error.message || "aclaración ausente"}`); }
    }

    const estado = mapaEstados.get(item.id);
    if (estado === "respuesta" || estado === "respuesta_y_rebote") {
      respuestasRecibidas += 1;
    } else if (estado === "rebote") {
      canalesRecepcion.set(item.id, false);
    } else if (estado === "sin_evento_registrado") {
      canalesSinRebote += 1;
    }
    if (estado !== "rebote" && fallas.length === fallasAntes) canalesRecepcion.set(item.id, true);

    const alternativos = Array.isArray(item.canales_alternativos)
      ? item.canales_alternativos
      : item.canal_alternativo ? [item.canal_alternativo] : [];
    for (const alt of alternativos) {
      const alternativa = await auditarCanalAlternativo(raiz, { ...item, canal_alternativo: alt }, hoy);
      if (!alternativa.cumple && !alternativa.excepcion) {
        fallas.push(`${item.id}/formulario-${alt.form_id}: ${alternativa.fallas.join("; ")}`);
      }
      canalesRecepcion.set(`formulario:${alt.form_id}`, alternativa.recepcion === true);
      if (alternativa.recepcion) recepcionesAlternativas += 1;
      if (alternativa.excepcion) excepciones += 1;
    }
  }

  let manuscrito = typeof opciones.manuscrito === "string" ? opciones.manuscrito : "";
  if (typeof opciones.manuscrito !== "string") {
    try { manuscrito = await readFile(join(raiz, "salidas", "oro-perimetros.mdx"), "utf8"); }
    catch { fallas.push("manuscrito ausente para inventario de sujetos materiales"); }
  }
  const manuscritoMinusculas = manuscrito.toLocaleLowerCase("es");
  let sujetosMencionados = 0;
  let sujetosCubiertos = 0;
  for (const sujeto of SUJETOS_MATERIALES_ESPERADOS) {
    const mencionado = sujeto.terminos.some((termino) => manuscritoMinusculas.includes(termino.toLocaleLowerCase("es")));
    if (!mencionado) continue;
    sujetosMencionados += 1;
    if (sujeto.canales.some((canal) => canalesRecepcion.get(canal) === true)) {
      sujetosCubiertos += 1;
    } else {
      fallas.push(`${sujeto.id}: sujeto material mencionado sin recepción acreditada`);
    }
  }
  const integraciones = await auditarIntegracionesReplica(
    raiz,
    respuestas,
    manuscrito,
    opciones.integraciones,
  );
  fallas.push(...integraciones.fallas);
  return {
    cumple: fallas.length === 0,
    evidencia: fallas.length
      ? fallas.join("; ")
      : `${canalesSinRebote} canales SMTP sin rebote, ${respuestasRecibidas} respuestas, ${recepcionesAlternativas} recepciones alternativas, ${excepciones} intentos web fallidos documentados y ${sujetosCubiertos}/${sujetosMencionados} sujetos materiales mencionados con canal acreditado.`,
    canalesSinRebote,
    respuestasRecibidas,
    respuestasIntegradas: integraciones.integradas,
    recepcionesAlternativas,
    excepciones,
    sujetosMencionados,
    sujetosCubiertos,
    fallas,
  };
}

/**
 * Evalúa todas las puertas sin mutar el repositorio.
 * Complejidad O(B + F); falla cerrada ante archivos ausentes o JSON inválido.
 */
export async function auditarPublicacionOro(
  raiz,
  { hoy = fechaActualBogota(), rutasReleaseExcluidas = [] } = {},
) {
  fechaUtc(hoy);
  const [geo, modelos, hipotesis, capas, replicas, respuestas, integraciones, rendimiento, manuscrito, trazas, riesgo] = await Promise.all([
    jsonOpcional(join(raiz, "datos", "geo", "resultados-perimetros.json")),
    jsonOpcional(join(raiz, "datos", "modelos", "resultados.json")),
    jsonOpcional(join(raiz, "datos", "modelos", "matriz-hipotesis.json")),
    jsonOpcional(join(raiz, "public", "data", "oro", "manifiesto.json")),
    jsonOpcional(join(raiz, "manuscrito", "replicas.json")),
    jsonOpcional(join(raiz, "manuscrito", "respuestas.json")),
    jsonOpcional(join(raiz, "manuscrito", "integraciones-replica.json")),
    jsonOpcional(join(raiz, "datos", "rendimiento-mapa-oro.json")),
    textoOpcional(join(raiz, "salidas", "oro-perimetros.mdx")),
    textoOpcional(join(raiz, "manuscrito", "trazas.md")),
    textoOpcional(join(raiz, "manuscrito", "riesgo.md")),
  ]);

  const casos = geo?.casos || [];
  const casosGeograficosListos = casos.length === 3 && casos.every((caso) => {
    if (caso.estado_revision !== "publicable" || ![9377, 5367].includes(caso.crs_calculo_epsg)) return false;
    if (["calculado", "documentado_sin_geometria"].includes(caso.estado_delta)) {
      return Number.isFinite(caso.delta_ha)
        && Number.isFinite(caso.area_real_ha)
        && caso.delta_ha >= 0
        && caso.delta_ha <= caso.area_real_ha
        && (Number.isFinite(caso.sigma_delta_ha)
          || (Array.isArray(caso.intervalo_delta_ha) && caso.intervalo_delta_ha.length === 2)
          || /^σ = desconocida/i.test(caso.error_delta || ""));
    }
    return caso.estado_delta === "no_estimable_con_limites"
      && caso.delta_ha === null
      && caso.geometria_delta_disponible === false
      && Boolean(caso.error_delta)
      && Boolean(caso.documento_faltante)
      && (Number.isFinite(caso.limite_deteccion_ha)
        || (Array.isArray(caso.intervalo_diagnostico_no_atribuible_ha)
          && caso.intervalo_diagnostico_no_atribuible_ha.length === 2)
        || (Number.isFinite(caso.area_intervencion_reportada_ha)
          && caso.area_intervencion_reportada_ha > 0));
  });
  const deltasNumericos = casos.filter((caso) => Number.isFinite(caso.delta_ha));
  const areasReportadas = casos.filter((caso) => Number.isFinite(caso.area_intervencion_reportada_ha));
  const geografiaLista = casosGeograficosListos
    && deltasNumericos.length === 0
    && areasReportadas.length === 1
    && areasReportadas[0].id === "crucitas"
    && areasReportadas[0].area_intervencion_reportada_ha === 34.04;

  const pruebaComercio = modelos?.comercio?.prueba_plausibilidad;
  const cierreEstadistico = pruebaComercio?.estado === "cerrada_documental_peso_estadistico"
    && pruebaComercio?.tipo_masa_publicada === "peso_estadistico_mbpvi_de_mercancias_clasificadas"
    && pruebaComercio?.oro_fino_acreditado === false
    && pruebaComercio?.dua?.estado === "pendiente"
    && pruebaComercio?.dua?.necesario_para_publicar_masa_estadistica === false
    && pruebaComercio?.dua?.necesario_para_determinar_contenido_origen_y_regimen === true;
  const unidadLista = cierreEstadistico
    && Array.isArray(pruebaComercio.hipotesis)
    && pruebaComercio.hipotesis.length === 4
    && pruebaComercio.hipotesis.every((item) => item.documento && item.veredicto && item.prueba);

  const matriz = hipotesis?.hipotesis || [];
  const hipotesisListas = matriz.length === 4 && matriz.every((item) => {
    const veredicto = String(item.veredicto).toLowerCase();
    if (!["confirmada", "refutada", "todo(dato)"].includes(veredicto)) return false;
    if (!Array.isArray(item.evidencia) || item.evidencia.length === 0) return false;
    return veredicto !== "todo(dato)" || /\w/.test(item.documento_faltante || "");
  });
  const hipotesisConVeredicto = matriz.filter((item) =>
    ["confirmada", "refutada"].includes(String(item.veredicto).toLowerCase()),
  ).length;
  const hipotesisConPendienteNombrado = matriz.filter((item) =>
    String(item.veredicto).toLowerCase() === "todo(dato)" && /\w/.test(item.documento_faltante || ""),
  ).length;

  const capasAuditadas = await auditarCapasPublicas(raiz, capas);
  let manuscritoSinAnexos = manuscrito || "";
  for (const fila of integraciones?.integraciones || []) {
    try {
      const anexo = await readFile(rutaConfinada(join(raiz, "manuscrito"), fila.anexo_archivo), "utf8");
      manuscritoSinAnexos = manuscritoSinAnexos.replace(anexo.trim(), "");
    } catch { /* La auditoría de réplica registra el artefacto ausente. */ }
  }
  const totalPalabras = palabrasCuerpo(manuscritoSinAnexos);
  const primeraLinea = manuscrito?.replace(/^---\n[\s\S]*?\n---\n/, "").trim().split("\n")[0] || "";
  const manuscritoListo = totalPalabras >= 6_000 && totalPalabras <= 9_000
    && /^\d[\d.,]*\s+hect[aá]reas|^\d[\d.,]*\s+ha\b/i.test(primeraLinea)
    && /reportad[ao]s?|DGM/i.test(primeraLinea)
    && !/delta\s+(?:documental|total)|conjunto\s+legal\s+activo\s+vac[ií]o/i.test(primeraLinea);

  const lineasSustantivas = trazas?.split("\n").filter((linea) => linea.trim() && !/^\s*#/.test(linea)) || [];
  const lineasTraza = lineasSustantivas.filter((linea) => ETIQUETA_TRAZA.test(linea));
  const trazasListas = lineasTraza.length > 0
    && lineasTraza.length === lineasSustantivas.length
    && /\[DOC\]/.test(trazas) && /\[CALC\]/.test(trazas) && /\[INT\]/.test(trazas);
  const riesgosDocumentados = riesgo?.split("\n").filter((linea) =>
    /^\s*\d+\.\s+\[(DOC|REG|RAYA)\]/.test(linea) && /\[[^\]]+\]\((?:https?:\/\/|\/)/.test(linea),
  ).length || 0;

  const destinatarios = replicas?.destinatarios || [];
  const auditoriaReplicas = await auditarReplicas(raiz, replicas, respuestas, hoy, { integraciones });
  const auditoriaPrivacidad = await auditarPrivacidadPerimetroPublicable(raiz, {
    manuscrito: typeof manuscrito === "string" ? manuscrito : undefined,
    replicas,
    respuestas,
    rutasReleaseExcluidas,
  });
  // Decision explicita del autor de publicar con el plazo de replica todavia
  // abierto. No declara cumplido lo que no se cumplio: releva la espera y deja
  // constancia de ello en la evidencia. El control de privacidad NO se releva:
  // sigue siendo condicion necesaria, porque es lo que mantiene identidades y
  // localizadores fuera del cuerpo publicable.
  const decisionAutorReplica = process.env.ORO_REPLICA_DECISION_AUTOR === "1";
  const replicasListas = (auditoriaReplicas.cumple || decisionAutorReplica)
    && auditoriaPrivacidad.cumple;

  let huellasActuales = null;
  try { huellasActuales = await huellasArtefactosRendimiento(raiz); }
  catch { /* Falla cerrada en rendimientoListo. */ }
  const perfilesEsperados = new Map([
    ["móvil 390×844", 3],
    ["escritorio 1440×900", 3],
  ]);
  const dimensionesFuncionalesEsperadas = new Set(["320×800", "390×844", "1440×900"]);
  const etiquetasWcagEsperadas = new Set(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
  const medicionesRendimiento = Array.isArray(rendimiento?.mediciones) ? rendimiento.mediciones : [];
  const perfilesCronometrados = Array.isArray(rendimiento?.perfiles_cronometrados)
    ? rendimiento.perfiles_cronometrados : [];
  const perfilesCronometradosDeclarados = perfilesCronometrados.length === 2
    && perfilesCronometrados.every((perfil) => perfilesEsperados.get(perfil.nombre) === perfil.repeticiones)
    && new Set(perfilesCronometrados.map((perfil) => `${perfil.ancho_px}×${perfil.alto_px}`)).size === 2
    && perfilesCronometrados.some((perfil) => perfil.ancho_px === 390 && perfil.alto_px === 844)
    && perfilesCronometrados.some((perfil) => perfil.ancho_px === 1440 && perfil.alto_px === 900);
  const seisCorridasFrias = medicionesRendimiento.length === 6
    && rendimiento?.corridas_cronometradas === 6
    && rendimiento?.repeticiones_por_viewport === 3
    && rendimiento?.red?.cache === "vacía"
    && perfilesCronometradosDeclarados
    && [...perfilesEsperados].every(([perfil, cantidad]) =>
      medicionesRendimiento.filter((medicion) => medicion.perfil === perfil).length === cantidad);
  const perfilesFuncionalesDeclarados = Array.isArray(rendimiento?.perfiles_funcionales)
    && rendimiento.perfiles_funcionales.length === 3
    && new Set(rendimiento.perfiles_funcionales
      .map((perfil) => `${perfil.ancho_px}×${perfil.alto_px}`)).size === 3
    && rendimiento.perfiles_funcionales.every((perfil) =>
      dimensionesFuncionalesEsperadas.has(`${perfil.ancho_px}×${perfil.alto_px}`));
  const perfilesSinJavaScript = Array.isArray(rendimiento?.lectura_sin_javascript?.perfiles)
    ? rendimiento.lectura_sin_javascript.perfiles : [];
  const lecturaSinJavaScriptCompleta = rendimiento?.lectura_sin_javascript?.cumple === true
    && perfilesSinJavaScript.length === 3
    && new Set(perfilesSinJavaScript.map((perfil) => `${perfil.ancho_px}×${perfil.alto_px}`)).size === 3
    && perfilesSinJavaScript.every((perfil) =>
      dimensionesFuncionalesEsperadas.has(`${perfil.ancho_px}×${perfil.alto_px}`)
      && perfil.cumple === true
      && perfil.palabras >= 6_000
      && perfil.cabecera_visible === true
      && perfil.articulo_visible === true
      && perfil.tablas === 12
      && perfil.tablas_visibles === 12
      && perfil.mapa_interactivo_ausente === true
      && perfil.desbordamiento_horizontal === false);
  const mapasSinWebGL = Array.isArray(rendimiento?.degradacion_sin_webgl2?.mapas)
    ? rendimiento.degradacion_sin_webgl2.mapas : [];
  const degradacionSinWebGLCompleta = rendimiento?.degradacion_sin_webgl2?.cumple === true
    && rendimiento.degradacion_sin_webgl2?.ancho_px === 320
    && rendimiento.degradacion_sin_webgl2?.webgl2_interceptado === true
    && rendimiento.degradacion_sin_webgl2?.mapas_sin_duplicados === true
    && rendimiento.degradacion_sin_webgl2?.montaje_territorial_activado === true
    && rendimiento.degradacion_sin_webgl2?.montaje_mundo_activado === true
    && mapasSinWebGL.length === 2
    && new Set(mapasSinWebGL.map((mapa) => mapa.vista)).size === 2
    && mapasSinWebGL.every((mapa) => ["territorio", "mundo"].includes(mapa.vista)
      && mapa.montaje_activado === true
      && mapa.estado_mapa === "unavailable"
      && mapa.aviso_claro === true
      && /WebGL 2 no está disponible/.test(mapa.aviso_texto || ""))
    && rendimiento.degradacion_sin_webgl2?.canvas_maplibre === 0
    && rendimiento.degradacion_sin_webgl2?.articulo_visible === true
    && rendimiento.degradacion_sin_webgl2?.tabla_visible === true
    && rendimiento.degradacion_sin_webgl2?.tablas === 12
    && rendimiento.degradacion_sin_webgl2?.palabras >= 6_000
    && rendimiento.degradacion_sin_webgl2?.desbordamiento_horizontal === false
    && typeof rendimiento.degradacion_sin_webgl2?.evidencia === "string"
    && rendimiento.degradacion_sin_webgl2.evidencia.length > 0;
  const perfilesAxe = Array.isArray(rendimiento?.accesibilidad_automatizada?.perfiles)
    ? rendimiento.accesibilidad_automatizada.perfiles : [];
  const etiquetasAxe = rendimiento?.accesibilidad_automatizada?.etiquetas_wcag || [];
  const accesibilidadAutomatizadaCompleta = rendimiento?.accesibilidad_automatizada?.cumple === true
    && rendimiento.accesibilidad_automatizada?.motor === "axe-core"
    && /^4\./.test(rendimiento.accesibilidad_automatizada?.version || "")
    && etiquetasAxe.length === etiquetasWcagEsperadas.size
    && etiquetasAxe.every((etiqueta) => etiquetasWcagEsperadas.has(etiqueta))
    && perfilesAxe.length === 3
    && new Set(perfilesAxe.map((perfil) => `${perfil.ancho_px}×${perfil.alto_px}`)).size === 3
    && perfilesAxe.every((perfil) =>
      dimensionesFuncionalesEsperadas.has(`${perfil.ancho_px}×${perfil.alto_px}`)
      && perfil.cumple === true
      && Array.isArray(perfil.violaciones)
      && perfil.violaciones.length === 0
      && perfil.control_teclado_operable === true
      && perfil.foco_en_componente === true
      && perfil.foco_visible === true
      && perfil.mapas_sin_duplicados === true
      && perfil.regiones_nombradas === true);
  const metricaPrimerRenderCompleta = rendimiento?.metrica_objetivo?.id === "primer_render_tematico_idle"
    && rendimiento.metrica_objetivo?.unidad === "ms"
    && rendimiento.metrica_objetivo?.umbral_exito_ms === 2_500
    && rendimiento.metrica_objetivo?.fondo_osm_incluido === false
    && rendimiento?.primer_render_tematico_idle_ms === rendimiento?.primer_render_ms
    && medicionesRendimiento.every((medicion) =>
      medicion.alcance_primer_render === "primer_tematico_idle_nueve_fuentes"
      && medicion.fondo_osm_incluido_en_primer_render === "false");
  const teselasOsmInterceptadas = rendimiento?.teselas_osm?.modo === "interceptadas_en_auditoria_automatizada"
    && rendimiento.teselas_osm?.host_aplicacion === "tile.openstreetmap.org"
    && rendimiento.teselas_osm?.recurso_sustituto === "PNG determinista local"
    && rendimiento.teselas_osm?.total_interceptadas_corridas > 0
    && medicionesRendimiento.every((medicion) => medicion.teselas_osm_interceptadas > 0);
  const mapasResponsive = Array.isArray(rendimiento?.responsive_estrecho?.mapas)
    ? rendimiento.responsive_estrecho.mapas : [];
  const mapasResponsiveCompletos = mapasResponsive.length === 2
    && new Set(mapasResponsive.map((mapa) => mapa.vista)).size === 2
    && mapasResponsive.every((mapa) => ["territorio", "mundo"].includes(mapa.vista)
      && mapa.visible === true
      && mapa.lienzos === 1
      && mapa.capas_conmutables === 9
      && mapa.descargas === 9
      && mapa.enlaces_capas === 9
      && mapa.base_abierta_estado === "loaded"
      && mapa.desborda === false);
  const huellasCoinciden = huellasActuales !== null
    && JSON.stringify(rendimiento?.fingerprint_artefactos) === JSON.stringify(huellasActuales);
  const rendimientoListo = rendimiento?.perfil === "4G simulada"
    && Number.isFinite(rendimiento.primer_render_ms)
    && rendimiento.primer_render_ms < 2_500
    && rendimiento.contraste_aa === true
    && rendimiento.cortina_satelital_real === true
    && rendimiento.desbordamiento_horizontal === false
    && rendimiento.articulo_sin_mapa === true
    && lecturaSinJavaScriptCompleta
    && rendimiento.fondo_abierto_cargado === true
    && rendimiento.mapa_mundo_operable === true
    && rendimiento.blancos_tactiles_44 === true
    && rendimiento.responsive_estrecho?.cumple === true
    && rendimiento.responsive_estrecho?.ancho_px === 320
    && rendimiento.responsive_estrecho?.cabecera_compacta === true
    && rendimiento.responsive_estrecho?.cabecera_fija_alto_px <= 52
    && rendimiento.responsive_estrecho?.navegacion_activa_visible_44 === true
    && rendimiento.responsive_estrecho?.tablas === 12
    && rendimiento.responsive_estrecho?.mapas_sin_duplicados === true
    && mapasResponsiveCompletos
    && rendimiento.responsive_estrecho?.teselas_osm_interceptadas > 0
    && rendimiento.responsive_estrecho?.desbordamiento_horizontal === false
    && degradacionSinWebGLCompleta
    && accesibilidadAutomatizadaCompleta
    && rendimiento.mapas_sin_duplicados === true
    && perfilesFuncionalesDeclarados
    && metricaPrimerRenderCompleta
    && teselasOsmInterceptadas
    && seisCorridasFrias
    && huellasCoinciden;

  const interfazLista = Boolean(manuscrito
    && /<MapaOro\b/.test(manuscrito)
    && /<table\b|^\|.+\|$/m.test(manuscrito)
    && /vista=["']territorio["']/.test(manuscrito)
    && /vista=["']mundo["']/.test(manuscrito));
  const vozLista = Boolean(manuscrito) && PROHIBIDAS.every((patron) => !patron.test(manuscrito));

  const puertas = [
    puerta(
      "geografia_3_de_3",
      geografiaLista,
      geografiaLista
        ? "Tres veredictos geoespaciales; cero deltas numéricos, tres límites de estimabilidad y una magnitud DGM reportada."
        : `${casos.filter((c) => c.estado_revision === "publicable").length}/3 veredictos; ${deltasNumericos.length} deltas numéricos; ${areasReportadas.length} áreas reportadas.`,
    ),
    puerta(
      "unidad_aduanera",
      unidadLista,
      unidadLista
        ? "Peso estadístico MBPVI documentado; DUA pendiente para contenido, régimen y origen."
        : "Falta cierre documental que identifique la masa publicada y separe lo que todavía exige DUA.",
    ),
    puerta(
      "hipotesis",
      hipotesisListas,
      `${matriz.length}/4 hipótesis con estado documental: ${hipotesisConVeredicto} confirmadas o refutadas y ${hipotesisConPendienteNombrado} TODO(dato) con documento faltante.`,
    ),
    puerta("capas_publicas", capasAuditadas.cumple, capasAuditadas.evidencia),
    puerta("manuscrito", manuscritoListo, manuscritoListo ? `${totalPalabras} palabras y magnitud DGM delimitada en la primera línea.` : `${totalPalabras} palabras; falta cuerpo de 6.000–9.000 o apertura que separe área reportada y delta.`),
    puerta("trazabilidad", trazasListas, `${lineasTraza.length} frases etiquetadas en manuscrito/trazas.md.`),
    puerta("riesgo_legal", riesgosDocumentados >= 10, `${riesgosDocumentados}/10 frases expuestas con respaldo.`),
    puerta(
      "derecho_replica",
      replicasListas,
      !replicasListas
        ? `Derecho de réplica cerrado por defecto: ${auditoriaReplicas.evidencia} Control de privacidad: ${auditoriaPrivacidad.evidencia}`
        : auditoriaReplicas.cumple
          ? `${destinatarios.length} destinatarios auditados. ${auditoriaReplicas.evidencia} ${auditoriaPrivacidad.evidencia}`
          : `Publicado por decisión expresa del autor con el plazo de réplica abierto; el plazo NO se declara cumplido. ${destinatarios.length} destinatarios notificados el 28 de agosto de 2026 y el cuerpo publicable declara el estado del calendario. Estado real: ${auditoriaReplicas.evidencia} Control de privacidad: ${auditoriaPrivacidad.evidencia}`,
    ),
    puerta("rendimiento_accesibilidad", rendimientoListo, rendimientoListo
      ? `${rendimiento.primer_render_ms} ms máximos hasta el primer idle temático en seis corridas 4G frías; axe-core WCAG 2.0–2.2 A/AA, teclado, 320/390/1440, degradación doble sin WebGL 2 y huellas de todos los recursos servidos verificados.`
      : "Falta medición temática <2.500 ms en seis corridas frías, axe-core y teclado, lectura sin JavaScript en 320/390/1440, degradación de ambos mapas sin WebGL 2, contraste ampliado, teselas interceptadas o huellas vigentes."),
    puerta("mapas_y_tabla", interfazLista, interfazLista ? "Mapa territorial, mapa mundo y tabla accesible declarados." : "Falta montar ambas vistas y la tabla HTML equivalente."),
    puerta("voz", vozLista, vozLista ? "Barrido mecánico sin construcciones vetadas." : "Manuscrito ausente o contiene una construcción vetada."),
  ];

  return {
    esquema: 1,
    corte: hoy,
    publicable: puertas.every((item) => item.cumple),
    puertas,
    privacidad: {
      cumple: auditoriaPrivacidad.cumple,
      recepcionAcreditada: auditoriaPrivacidad.recepcionAcreditada,
      fuenteRutasRelease: auditoriaPrivacidad.fuenteRutasRelease,
      noExcluibles: auditoriaPrivacidad.noExcluibles,
      exclusionesAplicadas: auditoriaPrivacidad.exclusionesAplicadas,
      rutasSensiblesRelease: auditoriaPrivacidad.rutasSensiblesRelease,
      rutasOperativasEmbargadas: auditoriaPrivacidad.rutasOperativasEmbargadas,
      rutasGeometriasExactas: auditoriaPrivacidad.rutasGeometriasExactas,
      exclusionesRequeridas: auditoriaPrivacidad.exclusionesRequeridas,
      exclusionesPendientes: auditoriaPrivacidad.exclusionesPendientes,
      exclusionesSobrantes: auditoriaPrivacidad.exclusionesSobrantes,
      errores: auditoriaPrivacidad.errores,
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const prefijoExclusion = "--excluir-release=";
  const prefijoRelease = "--auditar-release-materializado=";
  const prefijoPrebuilt = "--auditar-prebuilt=";
  const argumentos = process.argv.slice(2);
  const modos = argumentos.filter((argumento) =>
    argumento.startsWith(prefijoRelease) || argumento.startsWith(prefijoPrebuilt));
  const exclusiones = argumentos.filter((argumento) => argumento.startsWith(prefijoExclusion));
  const desconocidos = argumentos.filter((argumento) =>
    !argumento.startsWith(prefijoRelease)
      && !argumento.startsWith(prefijoPrebuilt)
      && !argumento.startsWith(prefijoExclusion));

  let auditoria;
  try {
    if (desconocidos.length) {
      auditoria = resultadoMaterializadoInvalido("cli", process.cwd(), [
        `argumentos desconocidos: ${desconocidos.join(", ")}`,
      ]);
    } else if (modos.length > 1) {
      auditoria = resultadoMaterializadoInvalido("cli", process.cwd(), [
        "--auditar-release-materializado y --auditar-prebuilt son modos exclusivos",
      ]);
    } else if (modos.length === 1 && (exclusiones.length || argumentos.length !== 1)) {
      auditoria = resultadoMaterializadoInvalido("cli", process.cwd(), [
        "los modos materializados no admiten --excluir-release ni argumentos adicionales",
      ]);
    } else if (modos[0]?.startsWith(prefijoRelease)) {
      auditoria = await auditarReleaseMaterializado(modos[0].slice(prefijoRelease.length));
    } else if (modos[0]?.startsWith(prefijoPrebuilt)) {
      auditoria = await auditarPrebuiltMaterializado(modos[0].slice(prefijoPrebuilt.length));
    } else {
      const rutasReleaseExcluidas = exclusiones.map((argumento) => argumento.slice(prefijoExclusion.length));
      auditoria = await auditarPublicacionOro(process.cwd(), { rutasReleaseExcluidas });
    }
  } catch (error) {
    auditoria = resultadoMaterializadoInvalido("cli", process.cwd(), [
      `auditoría abortada: ${error.message || String(error)}`,
    ]);
  }
  process.stdout.write(`${JSON.stringify(auditoria, null, 2)}\n`);
  if (!(auditoria.publicable ?? auditoria.cumple)) process.exitCode = 1;
}
