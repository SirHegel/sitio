#!/usr/bin/env node

/**
 * Genera un snapshot publico y determinista de los repositorios de SirHegel.
 *
 * No necesita dependencias. El modo completo usa GITHUB_TOKEN o GH_TOKEN: con
 * 22 repositorios consulta mas recursos que la cuota anonima permite por hora.
 */

import { execFileSync } from "node:child_process";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PROPIETARIO = "SirHegel";
const API = "https://api.github.com";
const VERSION_API = "2022-11-28";
const MAXIMO_EXTRACTO = 3_000;
const RAIZ = dirname(dirname(fileURLToPath(import.meta.url)));
const DESTINO = join(RAIZ, "datos-github.js");
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const COMMIT_AUTOMATICO = "Sincronizar proyectos publicos de GitHub";
const EXTENSION_CODIGO = /\.(?:bash|c|cc|cpp|css|go|h|html?|java|js|jsx|mjs|cjs|php|py|rb|rs|sh|sql|svelte|ts|tsx|vue)$/i;
const RUTA_PRUEBA = /(?:^|\/)(?:tests?|pruebas?|specs?)(?:\/|$)|(?:^|\/)(?:test_|spec_).+|(?:\.test|\.spec|_test)\.[^/]+$/i;
const RUTA_DOCUMENTACION = /(?:^|\/)(?:docs?|documentacion)(?:\/|$)|(?:^|\/)(?:readme|contributing|code_of_conduct|security|support)(?:\.[^/]+)?$|\.(?:md|rst)$/i;
const RUTA_WORKFLOW = /^\.github\/workflows\/[^/]+\.ya?ml$/i;
const NOMBRE_MANIFIESTO = /^(?:package(?:-lock)?\.json|pyproject\.toml|requirements[^/]*\.txt|composer\.json|cargo\.toml|go\.mod|pom\.xml|dockerfile|vercel\.json)$/i;
let solicitudesApi = 0;

const CABECERAS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": VERSION_API,
  "User-Agent": "SirHegel-portafolio-sync",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

function compararTexto(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

async function snapshotAnterior() {
  try {
    const fuente = await readFile(DESTINO, "utf8");
    const marca = "export const REPOSITORIOS_GITHUB = ";
    const inicio = fuente.indexOf(marca);
    if (inicio < 0) return null;
    const json = fuente.slice(inicio + marca.length).trim().replace(/;\s*$/, "");
    const datos = JSON.parse(json);
    return datos && Array.isArray(datos.repositorios) ? datos : null;
  } catch {
    return null;
  }
}

function ultimoCommitEsSincronizacion() {
  try {
    return execFileSync("git", ["log", "-1", "--pretty=%s"], {
      cwd: RAIZ,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() === COMMIT_AUTOMATICO;
  } catch {
    return false;
  }
}

function estabilizarRepositorioDelSitio(repositorios, anterior) {
  // El commit que guarda este snapshot también cambia `pushed_at` y los bytes
  // del propio repositorio `sitio`. Sin esta excepción, cada ejecución crearía
  // otro commit aunque ningún proyecto real hubiese cambiado. Tras un commit
  // manual sí se refresca una vez; tras el commit automático se conserva la
  // ficha anterior y el catálogo vuelve a ser determinista.
  if (!anterior || !ultimoCommitEsSincronizacion()) return false;
  const previo = anterior.repositorios.find((repo) => repo?.nombre === "sitio");
  const indice = repositorios.findIndex((repo) => repo?.nombre === "sitio");
  if (!previo || indice < 0) return false;
  repositorios[indice] = previo;
  return true;
}

function mensajeSeguro(valor) {
  return String(valor ?? "")
    .replace(/\s+/g, " ")
    .replace(/\b(?:gh[opusr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g, "[credencial ocultada]")
    .slice(0, 240)
    .trim();
}

function detalleLimite(respuesta) {
  const restantes = respuesta.headers.get("x-ratelimit-remaining");
  const reinicio = Number(respuesta.headers.get("x-ratelimit-reset"));
  if (respuesta.status !== 429 && !(respuesta.status === 403 && restantes === "0")) return "";

  const cuando = Number.isFinite(reinicio) && reinicio > 0
    ? new Date(reinicio * 1000).toISOString()
    : "la hora indicada por GitHub";
  return ` Se alcanzo el limite de la API; vuelve a intentar despues de ${cuando} o define GITHUB_TOKEN/GH_TOKEN.`;
}

async function pedir(ruta, { aceptar = CABECERAS.Accept, permitir404 = false, permitir409 = false } = {}) {
  let respuesta;
  try {
    solicitudesApi += 1;
    respuesta = await fetch(`${API}${ruta}`, {
      headers: { ...CABECERAS, Accept: aceptar },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new Error(`No se pudo conectar con GitHub para ${ruta}: ${mensajeSeguro(error.message)}`);
  }

  if ((permitir404 && respuesta.status === 404) || (permitir409 && respuesta.status === 409)) return null;
  if (!respuesta.ok) {
    let detalle = "";
    try {
      const cuerpo = await respuesta.json();
      detalle = mensajeSeguro(cuerpo?.message);
    } catch {
      // El codigo HTTP sigue siendo suficiente si GitHub no devuelve JSON.
    }

    throw new Error(
      `GitHub API respondio ${respuesta.status} ${respuesta.statusText} para ${ruta}`
      + (detalle ? `: ${detalle}` : ".")
      + detalleLimite(respuesta),
    );
  }

  return respuesta;
}

async function pedirJson(ruta, opciones) {
  const respuesta = await pedir(ruta, opciones);
  if (!respuesta) return null;
  try {
    return await respuesta.json();
  } catch (error) {
    throw new Error(`GitHub devolvio JSON invalido para ${ruta}: ${mensajeSeguro(error.message)}`);
  }
}

async function listarRepositorios() {
  const encontrados = [];

  for (let pagina = 1; ; pagina += 1) {
    const lote = await pedirJson(
      `/users/${encodeURIComponent(PROPIETARIO)}/repos?type=all&sort=full_name&direction=asc&per_page=100&page=${pagina}`,
    );
    if (!Array.isArray(lote)) throw new Error("GitHub devolvio una lista de repositorios invalida.");
    encontrados.push(...lote);
    if (lote.length < 100) break;
  }

  const propios = encontrados.filter((repo) => (
    repo?.owner?.login === PROPIETARIO
    && repo.private === false
    && repo.fork === false
  ));

  if (propios.length === 0) {
    throw new Error(`GitHub no devolvio repositorios publicos propios de ${PROPIETARIO}; se conserva el snapshot anterior.`);
  }

  const forks = encontrados
    .filter((repo) => repo?.owner?.login === PROPIETARIO && repo.private === false && repo.fork === true)
    .map((repo) => ({
      nombre: sanearTextoPlano(repo.name, 180),
      nombreCompleto: sanearTextoPlano(repo.full_name, 260),
      descripcion: sanearTextoPlano(repo.description),
      url: `https://github.com/${PROPIETARIO}/${encodeURIComponent(repo.name)}`,
      lenguaje: sanearTextoPlano(repo.language, 80),
      actualizadoEn: fechaIso(repo.updated_at, "updated_at", repo.name),
    }))
    .sort((a, b) => compararTexto(a.nombre.toLowerCase(), b.nombre.toLowerCase()) || compararTexto(a.nombre, b.nombre));

  return {
    propios: propios.sort((a, b) => compararTexto(a.name.toLowerCase(), b.name.toLowerCase()) || compararTexto(a.name, b.name)),
    forks,
  };
}

function decodificarEntidades(texto) {
  const conocidas = new Map([
    ["amp", "&"], ["lt", "<"], ["gt", ">"], ["quot", "\""],
    ["apos", "'"], ["nbsp", " "], ["ensp", " "], ["emsp", " "],
  ]);

  return texto.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entidad, codigo) => {
    if (codigo[0] !== "#") return conocidas.get(codigo.toLowerCase()) ?? " ";
    const base = codigo[1]?.toLowerCase() === "x" ? 16 : 10;
    const numero = Number.parseInt(codigo.slice(base === 16 ? 2 : 1), base);
    return Number.isFinite(numero) && numero >= 32 && numero <= 0x10ffff
      ? String.fromCodePoint(numero)
      : " ";
  });
}

function ocultarSecretos(texto) {
  return texto
    .replace(/-----BEGIN [^-\n]*PRIVATE KEY-----[\s\S]*?-----END [^-\n]*PRIVATE KEY-----/gi, " [credencial ocultada] ")
    .replace(/\b(?:gh[opusr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g, "[credencial ocultada]")
    .replace(/\bAKIA[0-9A-Z]{16}\b/g, "[credencial ocultada]")
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "[credencial ocultada]")
    .replace(/\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,}|glpat-[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{20,})\b/g, "[credencial ocultada]")
    .replace(/\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9_-]{16,}\b/gi, "[credencial ocultada]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]{12,}/gi, "Bearer [credencial ocultada]")
    .replace(
      /\b(api[ _-]?key|token|secret|password|passwd|authorization|bearer|private[ _-]?key|client[ _-]?secret|access[ _-]?key|database[ _-]?url|credentials?)\b\s*[:=]\s*[^\n\r]+/gi,
      "$1: [credencial ocultada]",
    );
}

function sanearMarkdown(markdown) {
  let texto = String(markdown ?? "")
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/[\u202a-\u202e\u2066-\u2069]/g, "");

  texto = ocultarSecretos(texto)
    .replace(/^---\s*\n[\s\S]*?\n---\s*(?:\n|$)/, "")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/^(?: {4}|\t).*$/gm, "")
    .replace(/^\s*\[[^\]]+\]:\s*\S+.*$/gm, "")
    .replace(/!\[[^\]]*\]\([^\n)]*(?:\)[^\n)]*)*\)/g, " ")
    .replace(/!\[[^\]]*\]\[[^\]]*\]/g, " ")
    .replace(/<\/?(?:p|div|section|article|header|footer|main|aside|details|summary|br|hr)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^\n)]*(?:\)[^\n)]*)*\)/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/<https?:\/\/[^>]+>/gi, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/^\s*[-+*]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/gm, "")
    .replace(/\|/g, " · ")
    .replace(/[*_~]+/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  texto = ocultarSecretos(decodificarEntidades(ocultarSecretos(texto)))
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (texto.length <= MAXIMO_EXTRACTO) return texto;
  const candidato = texto.slice(0, MAXIMO_EXTRACTO + 1);
  const ultimoCorte = Math.max(
    candidato.lastIndexOf(". ", MAXIMO_EXTRACTO),
    candidato.lastIndexOf(".\n", MAXIMO_EXTRACTO),
    candidato.lastIndexOf(" ", MAXIMO_EXTRACTO),
  );
  const corte = ultimoCorte >= Math.floor(MAXIMO_EXTRACTO * 0.72) ? ultimoCorte + 1 : MAXIMO_EXTRACTO;
  return `${candidato.slice(0, corte).trimEnd()}…`;
}

function sanearTextoPlano(texto, maximo = 350) {
  const limpio = sanearMarkdown(texto).replace(/\s*\n\s*/g, " ");
  if (limpio.length <= maximo) return limpio;
  const prefijo = limpio.slice(0, maximo + 1);
  const corte = prefijo.lastIndexOf(" ", maximo);
  return `${prefijo.slice(0, corte > maximo * 0.7 ? corte : maximo).trimEnd()}…`;
}

function fechaIso(valor, campo, repo) {
  const fecha = new Date(valor);
  if (!valor || Number.isNaN(fecha.valueOf())) {
    throw new Error(`GitHub devolvio ${campo} invalido para ${repo}.`);
  }
  return fecha.toISOString();
}

function fechaIsoOpcional(valor, campo, repo) {
  return valor ? fechaIso(valor, campo, repo) : null;
}

function homepageSegura(valor) {
  if (!valor) return "";
  try {
    const url = new URL(valor);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return ocultarSecretos(url.href) === url.href ? url.href : "";
  } catch {
    return "";
  }
}

function enteroNoNegativo(valor, campo) {
  if (!Number.isSafeInteger(valor) || valor < 0) throw new Error(`El informe de metricas contiene ${campo} invalido.`);
  return valor;
}

/**
 * Invariante: cada blob cuenta una vez y las pruebas quedan fuera de fuente.
 * Tiempo O(F), espacio O(F), con F = entradas del arbol Git.
 */
function inventariarArbol(arbol, repo) {
  if (arbol === null) {
    return {
      revision: null,
      vacio: true,
      completo: true,
      archivos: 0,
      bytesVersionados: 0,
      archivosFuente: 0,
      archivosPrueba: 0,
      archivosDocumentacion: 0,
      workflows: 0,
      manifiestos: [],
      componentes: [],
    };
  }
  if (!arbol || !Array.isArray(arbol.tree) || !/^[a-f0-9]{40}$/i.test(arbol.sha || "")) {
    throw new Error(`GitHub devolvio un arbol invalido para ${repo}.`);
  }
  if (arbol.truncated) throw new Error(`El arbol de ${repo} llego truncado; se conserva el snapshot anterior.`);

  const blobs = arbol.tree.filter((entrada) => entrada?.type === "blob" && typeof entrada.path === "string");
  const rutasCodigo = blobs.filter((entrada) => (
    EXTENSION_CODIGO.test(entrada.path)
    || (entrada.mode === "100755" && !RUTA_DOCUMENTACION.test(entrada.path))
  ));
  const pruebas = rutasCodigo.filter((entrada) => RUTA_PRUEBA.test(entrada.path));
  const fuentes = rutasCodigo.filter((entrada) => !RUTA_PRUEBA.test(entrada.path));
  const manifiestos = blobs
    .map((entrada) => entrada.path)
    .filter((ruta) => NOMBRE_MANIFIESTO.test(ruta.split("/").at(-1)))
    .sort(compararTexto);
  const componentes = [...new Set(blobs.map((entrada) => entrada.path.split("/")[0]).filter(Boolean))]
    .sort(compararTexto);

  return {
    revision: arbol.sha.toLowerCase(),
    vacio: blobs.length === 0,
    completo: true,
    archivos: blobs.length,
    bytesVersionados: blobs.reduce((total, entrada) => total + (Number.isSafeInteger(entrada.size) ? entrada.size : 0), 0),
    archivosFuente: fuentes.length,
    archivosPrueba: pruebas.length,
    archivosDocumentacion: blobs.filter((entrada) => RUTA_DOCUMENTACION.test(entrada.path)).length,
    workflows: blobs.filter((entrada) => RUTA_WORKFLOW.test(entrada.path)).length,
    manifiestos,
    componentes,
  };
}

function normalizarRelease(release, repo) {
  if (!release || release.draft || !release.html_url || !release.tag_name) return null;
  return {
    repositorio: repo,
    etiqueta: sanearTextoPlano(release.tag_name, 120),
    nombre: sanearTextoPlano(release.name || release.tag_name, 180),
    url: homepageSegura(release.html_url),
    publicadoEn: fechaIso(release.published_at || release.created_at, "published_at", `${repo}/${release.tag_name}`),
    preliminar: Boolean(release.prerelease),
    activos: Array.isArray(release.assets)
      ? release.assets.slice(0, 30).map((activo) => ({
          nombre: sanearTextoPlano(activo?.name, 180),
          url: homepageSegura(activo?.browser_download_url),
          bytes: Number.isSafeInteger(activo?.size) ? activo.size : 0,
          descargas: Number.isSafeInteger(activo?.download_count) ? activo.download_count : 0,
        })).filter((activo) => activo.nombre && activo.url)
      : [],
  };
}

/**
 * Invariante: los totales publicados son la suma del mismo arreglo fijado a SHA.
 * Tiempo O(R), espacio O(R), con R = repositorios medidos.
 */
function normalizarMetricas(manifiesto) {
  if (!manifiesto || manifiesto.schema_version !== 1 || !Array.isArray(manifiesto.repositories)) {
    throw new Error("El informe metricas/repositorios.json no cumple el esquema 1.");
  }
  const repositorios = manifiesto.repositories.map((item) => {
    if (!item || typeof item.name !== "string" || !/^[a-f0-9]{40}$/i.test(item.revision || "")) {
      throw new Error("El informe de metricas contiene un repositorio o SHA invalido.");
    }
    const esperado = item.expected || {};
    return {
      nombre: item.name,
      url: homepageSegura(item.url),
      revision: item.revision.toLowerCase(),
      exclusiones: Array.isArray(item.exclude_paths) ? item.exclude_paths.map((ruta) => sanearTextoPlano(ruta, 300)) : [],
      fuente: enteroNoNegativo(esperado.source?.lines, `${item.name}.source.lines`),
      prueba: enteroNoNegativo(esperado.test?.lines, `${item.name}.test.lines`),
      commits: enteroNoNegativo(esperado.commits, `${item.name}.commits`),
      pipelines: enteroNoNegativo(esperado.pipelines, `${item.name}.pipelines`),
      lenguajesFuente: esperado.source?.languages || {},
      lenguajesPrueba: esperado.test?.languages || {},
    };
  }).sort((a, b) => compararTexto(a.nombre, b.nombre));

  const totales = repositorios.reduce((suma, item) => ({
    repositorios: suma.repositorios + 1,
    fuente: suma.fuente + item.fuente,
    prueba: suma.prueba + item.prueba,
    commits: suma.commits + item.commits,
    pipelines: suma.pipelines + item.pipelines,
  }), { repositorios: 0, fuente: 0, prueba: 0, commits: 0, pipelines: 0 });
  const declarados = manifiesto.expected_totals || {};
  for (const [campo, valor] of [
    ["repositories", totales.repositorios],
    ["source.lines", totales.fuente],
    ["test.lines", totales.prueba],
    ["commits", totales.commits],
    ["pipelines", totales.pipelines],
  ]) {
    const observado = campo.split(".").reduce((objeto, parte) => objeto?.[parte], declarados);
    if (observado !== valor) throw new Error(`El total ${campo} del informe de metricas no cuadra con sus repositorios.`);
  }

  return {
    schemaVersion: 1,
    metodo: "Conteo reproducible de lineas fisicas, commits alcanzables y workflows, fijado a una revision por repositorio.",
    fuente: "https://github.com/SirHegel/SirHegel/blob/main/metricas/repositorios.json",
    totales: {
      ...totales,
      razonPruebaFuente: Number((totales.prueba / Math.max(totales.fuente, 1)).toFixed(4)),
    },
    repositorios,
  };
}

async function cargarMetricas() {
  const respuesta = await pedir("/repos/SirHegel/SirHegel/contents/metricas/repositorios.json", {
    aceptar: "application/vnd.github.raw+json",
  });
  let manifiesto;
  try {
    manifiesto = JSON.parse(await respuesta.text());
  } catch (error) {
    throw new Error(`GitHub devolvio metricas invalidas: ${mensajeSeguro(error.message)}`);
  }
  return normalizarMetricas(manifiesto);
}

/** Tiempo O(P), espacio O(P), con P = pull requests publicos recuperados. */
async function listarContribucionesExternas() {
  const encontrados = [];
  let totalGitHub = null;
  for (let pagina = 1; ; pagina += 1) {
    const resultado = await pedirJson(`/search/issues?q=is%3Apr%20author%3A${encodeURIComponent(PROPIETARIO)}&sort=created&order=desc&per_page=100&page=${pagina}`);
    if (!resultado || !Array.isArray(resultado.items) || !Number.isSafeInteger(resultado.total_count)) {
      throw new Error("GitHub devolvio una busqueda de pull requests invalida.");
    }
    if (totalGitHub === null) totalGitHub = resultado.total_count;
    encontrados.push(...resultado.items);
    if (resultado.items.length < 100 || encontrados.length >= Math.min(totalGitHub, 1_000)) break;
  }

  const normalizados = encontrados.map((item) => {
    let url;
    try { url = new URL(item.html_url); } catch { return null; }
    const partes = url.pathname.split("/").filter(Boolean);
    if (url.hostname !== "github.com" || partes.length < 4 || partes[2] !== "pull" || !/^\d+$/.test(partes[3])) return null;
    return {
      repositorio: `${partes[0]}/${partes[1]}`,
      titulo: sanearTextoPlano(item.title, 240),
      estado: item.state === "open" ? "abierta" : item.pull_request?.merged_at ? "fusionada" : "cerrada",
      url: url.href,
      creadoEn: fechaIso(item.created_at, "created_at", item.html_url),
      actualizadoEn: fechaIso(item.updated_at, "updated_at", item.html_url),
    };
  }).filter(Boolean);
  const externas = normalizados.filter((item) => item.repositorio.split("/")[0].toLowerCase() !== PROPIETARIO.toLowerCase());
  const contar = (lista, estado) => lista.filter((item) => item.estado === estado).length;
  return {
    totales: {
      pullRequestsPublicos: normalizados.length,
      fusionadosPublicos: contar(normalizados, "fusionada"),
      pullRequests: externas.length,
      repositorios: new Set(externas.map((item) => item.repositorio.toLowerCase())).size,
      fusionadas: contar(externas, "fusionada"),
      abiertas: contar(externas, "abierta"),
      cerradas: contar(externas, "cerrada"),
    },
    pullRequests: externas,
  };
}

async function listarLogros() {
  let respuesta;
  try {
    respuesta = await fetch(`https://github.com/${encodeURIComponent(PROPIETARIO)}?tab=achievements`, {
      headers: { "User-Agent": CABECERAS["User-Agent"] },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new Error(`No se pudo leer el perfil publico para verificar logros: ${mensajeSeguro(error.message)}`);
  }
  if (!respuesta.ok) throw new Error(`GitHub respondio ${respuesta.status} al verificar logros visibles.`);
  const html = await respuesta.text();
  const logros = new Map();
  for (const coincidencia of html.matchAll(/data-achievement-slug="([a-z0-9-]+)"[\s\S]{0,700}?alt="Achievement:\s*([^"]+)"/gi)) {
    const slug = coincidencia[1].toLowerCase();
    const nombre = sanearTextoPlano(decodificarEntidades(coincidencia[2]), 100);
    if (slug && nombre) logros.set(slug, {
      slug,
      nombre,
      url: `https://github.com/${PROPIETARIO}?achievement=${encodeURIComponent(slug)}&tab=achievements`,
    });
  }
  if (html.includes('data-hovercard-type="achievement"') && logros.size === 0) {
    throw new Error("El HTML del perfil anuncia logros, pero el extractor no pudo verificarlos.");
  }
  return [...logros.values()].sort((a, b) => compararTexto(a.nombre, b.nombre));
}

async function enriquecerRepositorio(repo) {
  const nombreCodificado = encodeURIComponent(repo.name);
  const base = `/repos/${encodeURIComponent(PROPIETARIO)}/${nombreCodificado}`;
  const ramaCodificada = encodeURIComponent(repo.default_branch || "main");
  const [estadisticasLenguajes, respuestaReadme, arbol, releasesCrudos] = await Promise.all([
    pedirJson(`${base}/languages`),
    pedir(`${base}/readme`, {
      aceptar: "application/vnd.github.raw+json",
      permitir404: true,
    }),
    pedirJson(`${base}/git/trees/${ramaCodificada}?recursive=1`, { permitir409: true }),
    pedirJson(`${base}/releases?per_page=100`),
  ]);

  if (!estadisticasLenguajes || Array.isArray(estadisticasLenguajes) || typeof estadisticasLenguajes !== "object") {
    throw new Error(`GitHub devolvio lenguajes invalidos para ${repo.name}.`);
  }
  if (!Array.isArray(releasesCrudos)) throw new Error(`GitHub devolvio releases invalidas para ${repo.name}.`);

  const readme = respuestaReadme ? await respuestaReadme.text() : "";
  const lenguajes = Object.entries(estadisticasLenguajes)
    .filter(([nombre, bytes]) => nombre && Number.isSafeInteger(bytes) && bytes >= 0)
    .sort(([nombreA, bytesA], [nombreB, bytesB]) => bytesB - bytesA || compararTexto(nombreA, nombreB))
    .map(([nombre, bytes]) => ({ nombre, bytes }));

  const temas = Array.isArray(repo.topics)
    ? [...new Set(repo.topics.filter((tema) => typeof tema === "string" && tema))].sort(compararTexto)
    : [];

  const creadoEn = fechaIso(repo.created_at, "created_at", repo.name);
  const actualizadoEn = fechaIso(repo.updated_at, "updated_at", repo.name);
  // GitHub devuelve pushed_at=null en repositorios recien creados y vacios.
  const publicadoEn = fechaIsoOpcional(repo.pushed_at, "pushed_at", repo.name);
  const inventario = inventariarArbol(arbol, repo.name);
  const releases = releasesCrudos
    .map((release) => normalizarRelease(release, repo.name))
    .filter(Boolean)
    .sort((a, b) => compararTexto(b.publicadoEn, a.publicadoEn) || compararTexto(a.etiqueta, b.etiqueta));

  return {
    slug: repo.name,
    nombre: repo.name,
    descripcion: sanearTextoPlano(repo.description),
    url: `https://github.com/${PROPIETARIO}/${encodeURIComponent(repo.name)}`,
    homepage: homepageSegura(repo.homepage),
    lenguajes,
    temas,
    licencia: repo.license
      ? {
          spdx: sanearTextoPlano(repo.license.spdx_id, 80),
          nombre: sanearTextoPlano(repo.license.name, 120),
        }
      : null,
    ramaPredeterminada: sanearTextoPlano(repo.default_branch, 255),
    estrellas: Number.isSafeInteger(repo.stargazers_count) ? repo.stargazers_count : 0,
    forks: Number.isSafeInteger(repo.forks_count) ? repo.forks_count : 0,
    creadoEn,
    actualizadoEn,
    publicadoEn,
    extractoReadme: sanearMarkdown(readme),
    inventario,
    releases,
  };
}

function serializar({ repositorios, forks, metricas, contribucionesExternas, logros, perfilGitHub }) {
  const fechas = repositorios
    .flatMap((repo) => [
      repo.actualizadoEn,
      repo.publicadoEn,
      ...repo.releases.map((release) => release.publicadoEn),
    ])
    .concat(contribucionesExternas.pullRequests.map((item) => item.actualizadoEn))
    .filter(Boolean);
  const actualizadoEn = fechas.sort(compararTexto).at(-1);
  const releases = repositorios
    .flatMap((repo) => repo.releases)
    .sort((a, b) => compararTexto(b.publicadoEn, a.publicadoEn) || compararTexto(a.repositorio, b.repositorio));
  const snapshot = {
    propietario: PROPIETARIO,
    perfil: `https://github.com/${PROPIETARIO}`,
    actualizadoEn,
    total: repositorios.length,
    perfilGitHub,
    forks,
    metricas,
    releases,
    contribucionesExternas,
    logros,
    costoSincronizacion: {
      solicitudesApi,
      complejidadTemporal: "O(R + F + P)",
      complejidadEspacial: "O(R + F + P)",
      variables: "R repositorios, F archivos versionados y P pull requests publicos.",
    },
    repositorios,
  };

  return [
    "// Archivo generado por herramientas/sincronizar-github.js.",
    "// No editar a mano: el workflow lo reemplaza solo cuando GitHub cambia.",
    `export const REPOSITORIOS_GITHUB = ${JSON.stringify(snapshot, null, 2)};`,
    "",
  ].join("\n");
}

async function guardarAtomico(contenido) {
  const temporal = `${DESTINO}.${process.pid}.tmp`;
  try {
    await writeFile(temporal, contenido, { encoding: "utf8", mode: 0o644, flag: "wx" });
    await rename(temporal, DESTINO);
  } catch (error) {
    await unlink(temporal).catch(() => {});
    throw error;
  }
}

async function principal() {
  const versionMayor = Number.parseInt(process.versions.node.split(".")[0], 10);
  if (!Number.isInteger(versionMayor) || versionMayor < 20) {
    throw new Error(`Se requiere Node.js 20 o posterior; version detectada: ${process.versions.node}.`);
  }
  if (!TOKEN) {
    throw new Error("La sincronizacion completa requiere GITHUB_TOKEN o GH_TOKEN para no exceder la cuota anonima de la API.");
  }

  const anterior = await snapshotAnterior();
  const [catalogoRepositorios, metricas, contribucionesExternas, logros, perfilCrudo] = await Promise.all([
    listarRepositorios(),
    cargarMetricas(),
    listarContribucionesExternas(),
    listarLogros(),
    pedirJson(`/users/${encodeURIComponent(PROPIETARIO)}`),
  ]);
  if (!perfilCrudo || !Number.isSafeInteger(perfilCrudo.public_repos)) {
    throw new Error("GitHub devolvio un perfil publico invalido.");
  }
  const repositoriosBase = catalogoRepositorios.propios;
  const forks = catalogoRepositorios.forks;
  const repositorios = [];

  // Se procesa en serie para no disparar rafagas contra la API y para que los
  // errores indiquen con precision cual repositorio no pudo completarse.
  for (const repo of repositoriosBase) {
    repositorios.push(await enriquecerRepositorio(repo));
  }

  estabilizarRepositorioDelSitio(repositorios, anterior);

  const perfilGitHub = {
    repositoriosPublicos: perfilCrudo.public_repos,
    repositoriosPropios: repositorios.length,
    forksPublicos: forks.length,
    seguidores: enteroNoNegativo(perfilCrudo.followers, "perfil.followers"),
    seguidos: enteroNoNegativo(perfilCrudo.following, "perfil.following"),
  };
  if (perfilGitHub.repositoriosPublicos !== perfilGitHub.repositoriosPropios + perfilGitHub.forksPublicos) {
    throw new Error("El total del perfil no cuadra con repositorios propios y forks; se conserva el snapshot anterior.");
  }
  await guardarAtomico(serializar({ repositorios, forks, metricas, contribucionesExternas, logros, perfilGitHub }));
  console.log(`Snapshot actualizado: ${repositorios.length} repositorios propios, ${contribucionesExternas.totales.pullRequests} PR externas y ${logros.length} logros visibles.`);
}

principal().catch((error) => {
  console.error(`No se pudo sincronizar GitHub: ${mensajeSeguro(error.message)}`);
  process.exitCode = 1;
});
