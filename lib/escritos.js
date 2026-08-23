import { HttpError } from "./http.js";
import { GitHubError, getGitHubContent, listGitHubDirectory, putGitHubContent } from "./github.js";

export const SITE_REPOSITORY = Object.freeze({ owner: "SirHegel", repo: "sitio", branch: "master" });
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/;
const FRONT_FIELDS = ["titulo", "categoria", "fecha", "resumen", "etiquetas"];
const RAW_HTML = /<\s*\/?\s*[A-Za-z][^>]*>/;
const DANGEROUS_URI = /(?:javascript|vbscript|data)\s*:/i;

export function validateSlug(value) {
  if (typeof value !== "string" || value.length > 80 || !SLUG.test(value)) {
    throw new HttpError(422, "slug_invalido", "El slug solo puede contener minúsculas, números y guiones simples.");
  }
  return value;
}

function cleanText(value, field, max, min = 1) {
  if (typeof value !== "string") throw new HttpError(422, "campo_invalido", `${field} debe ser texto.`);
  const result = value.normalize("NFC").trim().replace(/\r\n?/g, "\n");
  if (result.length < min || result.length > max || CONTROL.test(result)) {
    throw new HttpError(422, "campo_invalido", `${field} no cumple la longitud o el formato permitidos.`);
  }
  return result;
}

function cleanDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(422, "fecha_invalida", "La fecha debe usar el formato AAAA-MM-DD.");
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new HttpError(422, "fecha_invalida", "La fecha no existe en el calendario.");
  }
  return value;
}

function cleanTags(value) {
  if (!Array.isArray(value) || value.length > 12) {
    throw new HttpError(422, "etiquetas_invalidas", "Las etiquetas deben ser una lista de máximo 12 elementos.");
  }
  const unique = [];
  const seen = new Set();
  for (const raw of value) {
    const tag = cleanText(raw, "Cada etiqueta", 40).replace(/\s+/g, " ");
    const key = tag.toLocaleLowerCase("es");
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(tag);
    }
  }
  return unique;
}

function categorySlug(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function validateArticle(input, { requireSlug = true } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(422, "escrito_invalido", "El escrito debe ser un objeto.");
  }
  const allowed = new Set(["slug", "sha", "titulo", "categoria", "fecha", "resumen", "etiquetas", "cuerpo"]);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) throw new HttpError(422, "campo_no_permitido", `El campo «${key}» no está permitido.`);
  }
  const cuerpo = cleanText(input.cuerpo, "El cuerpo", 60_000);
  if (Buffer.byteLength(cuerpo, "utf8") > 80_000 || RAW_HTML.test(cuerpo) || DANGEROUS_URI.test(cuerpo)) {
    throw new HttpError(422, "markdown_inseguro", "El Markdown contiene HTML o enlaces no permitidos.");
  }
  const categoria = cleanText(input.categoria, "La categoría", 60).replace(/\s+/g, " ");
  if (!categorySlug(categoria)) {
    throw new HttpError(422, "categoria_invalida", "La categoría debe contener al menos una letra o un número legible.");
  }
  const article = {
    titulo: cleanText(input.titulo, "El título", 140),
    categoria,
    fecha: cleanDate(input.fecha),
    resumen: cleanText(input.resumen, "El resumen", 320),
    etiquetas: cleanTags(input.etiquetas),
    cuerpo,
  };
  if (requireSlug) article.slug = validateSlug(input.slug);
  if (input.sha !== undefined && input.sha !== "") {
    if (typeof input.sha !== "string" || !/^[a-f0-9]{40,64}$/i.test(input.sha)) {
      throw new HttpError(422, "sha_invalido", "La versión del escrito no es válida.");
    }
    article.sha = input.sha.toLowerCase();
  }
  return article;
}

export function serializeArticle(article) {
  const valid = validateArticle(article);
  const lines = ["---"];
  for (const field of FRONT_FIELDS) lines.push(`${field}: ${JSON.stringify(valid[field])}`);
  lines.push("---", "", valid.cuerpo, "");
  return lines.join("\n");
}

function parseFrontValue(raw, field) {
  const value = raw.trim();
  try {
    return JSON.parse(value);
  } catch {
    if (field === "etiquetas" && value.startsWith("[") && value.endsWith("]")) {
      return value.slice(1, -1).split(",").map((tag) => tag.trim()).filter(Boolean);
    }
    if (field === "etiquetas") return value.split(",").map((tag) => tag.trim()).filter(Boolean);
    return value;
  }
}

export function parseArticleMarkdown(markdown, { slug, sha } = {}) {
  const normalized = String(markdown).replace(/\r\n?/g, "\n");
  if (!normalized.startsWith("---\n")) throw new HttpError(422, "front_matter_invalido", "El escrito no comienza con front matter.");
  const end = normalized.indexOf("\n---\n", 4);
  if (end < 0 || end > 8_000) throw new HttpError(422, "front_matter_invalido", "El front matter no tiene un cierre válido.");
  const meta = Object.create(null);
  for (const line of normalized.slice(4, end).split("\n")) {
    const match = /^([a-z]+):\s*(.*)$/.exec(line);
    if (!match || !FRONT_FIELDS.includes(match[1]) || Object.hasOwn(meta, match[1])) {
      throw new HttpError(422, "front_matter_invalido", "El front matter contiene campos desconocidos o repetidos.");
    }
    meta[match[1]] = parseFrontValue(match[2], match[1]);
  }
  const parsed = validateArticle({ ...meta, slug: validateSlug(slug), sha, cuerpo: normalized.slice(end + 5).trim() });
  return parsed;
}

function config(env) {
  return { ...SITE_REPOSITORY, token: env.GITHUB_SITE_TOKEN };
}

function mapGitHubError(error) {
  if (!(error instanceof GitHubError)) throw error;
  if ([409, 422].includes(error.status)) {
    throw new HttpError(409, "conflicto_de_version", "El escrito cambió en GitHub. Recarga la versión más reciente antes de guardar.");
  }
  if (error.status === 401 || error.status === 403) {
    throw new HttpError(503, "github_no_disponible", "GitHub rechazó las credenciales del servidor.");
  }
  throw new HttpError(503, "github_no_disponible", "No fue posible comunicarse con GitHub.");
}

export async function readArticle(slug, env = process.env, fetchImpl) {
  const safeSlug = validateSlug(slug);
  try {
    const file = await getGitHubContent({ ...config(env), path: `escritos/${safeSlug}.md`, fetchImpl });
    if (!file) throw new HttpError(404, "escrito_no_encontrado", "El escrito no existe.");
    return parseArticleMarkdown(file.text, { slug: safeSlug, sha: file.sha });
  } catch (error) {
    mapGitHubError(error);
  }
}

export async function listArticles(env = process.env, fetchImpl) {
  try {
    const files = (await listGitHubDirectory({ ...config(env), path: "escritos", fetchImpl }))
      .filter((file) => file.type === "file" && file.name.endsWith(".md"))
      .slice(0, 200);
    const articles = [];
    for (let index = 0; index < files.length; index += 8) {
      const batch = files.slice(index, index + 8);
      const parsed = await Promise.all(batch.map(async (file) => {
        const slug = file.name.slice(0, -3);
        if (!SLUG.test(slug)) return null;
        const content = await getGitHubContent({ ...config(env), path: file.path, fetchImpl });
        if (!content) return null;
        const { cuerpo, ...summary } = parseArticleMarkdown(content.text, { slug, sha: content.sha });
        return summary;
      }));
      articles.push(...parsed.filter(Boolean));
    }
    return articles.sort((a, b) => b.fecha.localeCompare(a.fecha) || a.titulo.localeCompare(b.titulo, "es"));
  } catch (error) {
    mapGitHubError(error);
  }
}

export async function saveArticle(input, env = process.env, fetchImpl) {
  const article = validateArticle(input);
  const repository = config(env);
  const path = `escritos/${article.slug}.md`;
  try {
    const current = await getGitHubContent({ ...repository, path, fetchImpl });
    if (current && (!article.sha || article.sha !== current.sha)) {
      throw new HttpError(409, "conflicto_de_version", "El escrito ya existe o cambió en GitHub. Ábrelo de nuevo antes de sobrescribirlo.");
    }
    if (!current && article.sha) {
      throw new HttpError(409, "conflicto_de_version", "El escrito ya no existe en GitHub. Recarga el listado.");
    }
    const result = await putGitHubContent({
      ...repository,
      path,
      fetchImpl,
      sha: current?.sha,
      text: serializeArticle(article),
      message: `${current ? "Actualizar" : "Publicar"} escrito: ${article.slug}`,
    });
    return { ...article, sha: result?.content?.sha || current?.sha || null, commit: result?.commit?.sha || null };
  } catch (error) {
    mapGitHubError(error);
  }
}
