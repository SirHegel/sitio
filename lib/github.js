import { HttpError } from "./http.js";

const API_ROOT = "https://api.github.com";
const NAME = /^[A-Za-z0-9_.-]{1,100}$/;

export class GitHubError extends Error {
  constructor(status, operation) {
    super(`GitHub respondió ${status} al ${operation}.`);
    this.name = "GitHubError";
    this.status = status;
    this.operation = operation;
  }
}

export function parseRepository(value, defaultOwner = "SirHegel") {
  const parts = String(value || "").split("/");
  const owner = parts.length === 2 ? parts[0] : defaultOwner;
  const repo = parts.length === 2 ? parts[1] : parts[0];
  if (!NAME.test(owner) || !NAME.test(repo)) {
    throw new HttpError(500, "configuracion_invalida", "El repositorio configurado no es válido.");
  }
  return { owner, repo };
}

function encodePath(path) {
  const parts = String(path).split("/");
  if (!parts.length || parts.some((part) => !part || part === "." || part === "..")) {
    throw new TypeError("Ruta de contenido no válida.");
  }
  return parts.map(encodeURIComponent).join("/");
}

function tokenFrom(token) {
  if (!token || typeof token !== "string") {
    throw new HttpError(500, "configuracion_incompleta", "No hay un token de GitHub configurado en el servidor.");
  }
  return token;
}

async function request(url, options, fetchImpl = fetch) {
  const {
    token,
    allowNotFound = false,
    operation = "consultar contenido",
    headers: extraHeaders,
    ...requestOptions
  } = options;
  const authorization = tokenFrom(token);
  let response;
  try {
    response = await fetchImpl(url, {
      ...requestOptions,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${authorization}`,
        "Content-Type": "application/json",
        "User-Agent": "sitio-jhon-admin",
        "X-GitHub-Api-Version": "2022-11-28",
        ...extraHeaders,
      },
      signal: requestOptions.signal ?? AbortSignal.timeout(8_000),
    });
  } catch {
    throw new GitHubError(0, operation);
  }
  if (response.status === 404 && allowNotFound) return null;
  if (!response.ok) throw new GitHubError(response.status, operation);
  if (response.status === 204) return null;
  try {
    return await response.json();
  } catch {
    throw new GitHubError(response.status, operation);
  }
}

function contentUrl(owner, repo, path, branch) {
  const url = new URL(`${API_ROOT}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodePath(path)}`);
  if (branch) url.searchParams.set("ref", branch);
  return url.toString();
}

export async function getGitHubContent({ owner, repo, path, branch, token, fetchImpl }) {
  const data = await request(contentUrl(owner, repo, path, branch), {
    method: "GET",
    token,
    allowNotFound: true,
    operation: "leer contenido",
  }, fetchImpl);
  if (data === null) return null;
  if (Array.isArray(data) || data.type !== "file" || data.encoding !== "base64" || typeof data.content !== "string") {
    throw new GitHubError(502, "interpretar contenido");
  }
  return {
    name: data.name,
    path: data.path,
    sha: data.sha,
    size: data.size,
    text: Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8"),
  };
}

export async function listGitHubDirectory({ owner, repo, path, branch, token, fetchImpl }) {
  const data = await request(contentUrl(owner, repo, path, branch), {
    method: "GET",
    token,
    allowNotFound: true,
    operation: "listar contenido",
  }, fetchImpl);
  if (data === null) return [];
  if (!Array.isArray(data)) throw new GitHubError(502, "interpretar el directorio");
  return data.map(({ name, path: itemPath, sha, size, type }) => ({ name, path: itemPath, sha, size, type }));
}

export async function putGitHubContent({ owner, repo, path, branch, token, text, message, sha, fetchImpl }) {
  const body = {
    message,
    content: Buffer.from(text, "utf8").toString("base64"),
  };
  if (branch) body.branch = branch;
  if (sha) body.sha = sha;
  return request(contentUrl(owner, repo, path), {
    method: "PUT",
    token,
    operation: "guardar contenido",
    body: JSON.stringify(body),
  }, fetchImpl);
}
