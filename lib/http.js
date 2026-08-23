const JSON_LIMIT = 64 * 1024;

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

export function header(req, name) {
  const value = req?.headers?.[name.toLowerCase()] ?? req?.headers?.[name];
  if (Array.isArray(value)) return value[0] || "";
  return typeof value === "string" ? value : "";
}

export function parseCookies(req) {
  const result = Object.create(null);
  for (const part of header(req, "cookie").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    const key = part.slice(0, separator).trim();
    const raw = part.slice(separator + 1).trim();
    try {
      result[key] = decodeURIComponent(raw);
    } catch {
      result[key] = raw;
    }
  }
  return result;
}

export function appendHeader(res, name, value) {
  const previous = typeof res.getHeader === "function" ? res.getHeader(name) : undefined;
  const values = previous ? (Array.isArray(previous) ? [...previous, value] : [previous, value]) : value;
  res.setHeader(name, values);
}

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(body));
}

export function noContent(res, status = 204) {
  res.statusCode = status;
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end();
}

export function allowMethods(req, res, methods) {
  if (methods.includes(req.method)) return true;
  res.setHeader("Allow", methods.join(", "));
  json(res, 405, { error: "metodo_no_permitido", mensaje: "Método no permitido." });
  return false;
}

export async function readJson(req, limit = JSON_LIMIT) {
  const contentType = header(req, "content-type").split(";", 1)[0].trim().toLowerCase();
  if (contentType && contentType !== "application/json") {
    throw new HttpError(415, "tipo_no_admitido", "El cuerpo debe enviarse como JSON.");
  }

  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
    const value = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);
    if (Buffer.byteLength(value) > limit) throw new HttpError(413, "cuerpo_muy_grande", "El cuerpo excede el límite permitido.");
    try {
      return JSON.parse(value);
    } catch {
      throw new HttpError(400, "json_invalido", "El cuerpo JSON no es válido.");
    }
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > limit) throw new HttpError(413, "cuerpo_muy_grande", "El cuerpo excede el límite permitido.");
    chunks.push(bytes);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    throw new HttpError(400, "json_invalido", "El cuerpo JSON no es válido.");
  }
}

function normalizedOrigin(value) {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.pathname !== "/") return "";
    return url.origin.toLowerCase();
  } catch {
    return "";
  }
}

export function expectedOrigin(req, env = process.env) {
  if (env.SITE_ORIGIN) {
    const configured = normalizedOrigin(env.SITE_ORIGIN);
    if (!configured) throw new HttpError(500, "configuracion_invalida", "SITE_ORIGIN no es un origen válido.");
    return configured;
  }
  const host = header(req, "x-forwarded-host").split(",", 1)[0].trim() || header(req, "host");
  const protocol = header(req, "x-forwarded-proto").split(",", 1)[0].trim() || "https";
  const inferred = normalizedOrigin(`${protocol}://${host}`);
  if (!inferred) throw new HttpError(403, "origen_invalido", "No fue posible verificar el origen de la solicitud.");
  return inferred;
}

export function requireSameOrigin(req, env = process.env) {
  const origin = normalizedOrigin(header(req, "origin"));
  const expected = expectedOrigin(req, env);
  const fetchSite = header(req, "sec-fetch-site").toLowerCase();
  if (!origin || origin !== expected || (fetchSite && !["same-origin", "none"].includes(fetchSite))) {
    throw new HttpError(403, "origen_no_permitido", "La solicitud no proviene de este sitio.");
  }
}

export function queryValue(req, name) {
  const direct = req?.query?.[name];
  if (Array.isArray(direct)) return direct[0] || "";
  if (typeof direct === "string") return direct;
  try {
    return new URL(req.url, "https://sitio.invalid").searchParams.get(name) || "";
  } catch {
    return "";
  }
}

export function sendError(res, error) {
  if (error instanceof HttpError) {
    json(res, error.status, { error: error.code, mensaje: error.message });
    return;
  }
  json(res, 500, { error: "error_interno", mensaje: "No fue posible completar la solicitud." });
}
