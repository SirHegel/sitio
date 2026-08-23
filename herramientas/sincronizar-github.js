#!/usr/bin/env node

/**
 * Genera un snapshot publico y determinista de los repositorios de SirHegel.
 *
 * No necesita dependencias. GITHUB_TOKEN o GH_TOKEN son opcionales; cuando se
 * ejecuta en GitHub Actions se usa el token efimero del propio workflow.
 */

import { rename, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PROPIETARIO = "SirHegel";
const API = "https://api.github.com";
const VERSION_API = "2022-11-28";
const MAXIMO_EXTRACTO = 900;
const DESTINO = join(dirname(dirname(fileURLToPath(import.meta.url))), "datos-github.js");
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

const CABECERAS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": VERSION_API,
  "User-Agent": "SirHegel-portafolio-sync",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

function compararTexto(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
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

async function pedir(ruta, { aceptar = CABECERAS.Accept, permitir404 = false } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API}${ruta}`, {
      headers: { ...CABECERAS, Accept: aceptar },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new Error(`No se pudo conectar con GitHub para ${ruta}: ${mensajeSeguro(error.message)}`);
  }

  if (permitir404 && respuesta.status === 404) return null;
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
      `/users/${encodeURIComponent(PROPIETARIO)}/repos?type=owner&sort=full_name&direction=asc&per_page=100&page=${pagina}`,
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

  return propios.sort((a, b) => compararTexto(a.name.toLowerCase(), b.name.toLowerCase()) || compararTexto(a.name, b.name));
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

async function enriquecerRepositorio(repo) {
  const nombreCodificado = encodeURIComponent(repo.name);
  const base = `/repos/${encodeURIComponent(PROPIETARIO)}/${nombreCodificado}`;
  const [estadisticasLenguajes, respuestaReadme] = await Promise.all([
    pedirJson(`${base}/languages`),
    pedir(`${base}/readme`, {
      aceptar: "application/vnd.github.raw+json",
      permitir404: true,
    }),
  ]);

  if (!estadisticasLenguajes || Array.isArray(estadisticasLenguajes) || typeof estadisticasLenguajes !== "object") {
    throw new Error(`GitHub devolvio lenguajes invalidos para ${repo.name}.`);
  }

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
  };
}

function serializar(repositorios) {
  const fechas = repositorios
    .flatMap((repo) => [repo.actualizadoEn, repo.publicadoEn])
    .filter(Boolean);
  const actualizadoEn = fechas.sort(compararTexto).at(-1);
  const snapshot = {
    propietario: PROPIETARIO,
    perfil: `https://github.com/${PROPIETARIO}`,
    actualizadoEn,
    total: repositorios.length,
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

  const repositoriosBase = await listarRepositorios();
  const repositorios = [];

  // Se procesa en serie para no disparar rafagas contra la API y para que los
  // errores indiquen con precision cual repositorio no pudo completarse.
  for (const repo of repositoriosBase) {
    repositorios.push(await enriquecerRepositorio(repo));
  }

  await guardarAtomico(serializar(repositorios));
  console.log(`Snapshot actualizado: ${repositorios.length} repositorios publicos propios de ${PROPIETARIO}.`);
}

principal().catch((error) => {
  console.error(`No se pudo sincronizar GitHub: ${mensajeSeguro(error.message)}`);
  process.exitCode = 1;
});
