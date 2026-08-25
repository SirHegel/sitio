import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { HttpError, header, parseCookies, requireSameOrigin } from "./http.js";

const scrypt = promisify(scryptCallback);

export const SESSION_COOKIE = "__Host-jsar_admin";
export const PREAUTH_COOKIE = "__Host-jsar_previo";
export const SESSION_SECONDS = 8 * 60 * 60;
const PREAUTH_SECONDS = 10 * 60;
const DEFAULT_SCRYPT = Object.freeze({ N: 16_384, r: 8, p: 1, keyLength: 64 });
const LOGIN_DECAY_MS = 10 * 60 * 1000;
const LOGIN_FREE_FAILURES = 4;
const LOGIN_MAX_DELAY_MS = 30 * 1000;
let loginLimiter = { failures: 0, lastFailure: 0, blockedUntil: 0 };

function base64url(buffer) {
  return Buffer.from(buffer).toString("base64url");
}

function decodeBase64url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const decoded = Buffer.from(value, "base64url");
    return base64url(decoded) === value ? decoded : null;
  } catch {
    return null;
  }
}

function secretFrom(env = process.env) {
  const secret = env.SESSION_SECRET || "";
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new HttpError(500, "configuracion_incompleta", "SESSION_SECRET debe contener al menos 32 bytes aleatorios.");
  }
  return secret;
}

export function parsePasswordHash(encoded) {
  const match = /^scrypt\$(\d+)\$(\d+)\$(\d+)\$([A-Za-z0-9_-]+)\$([A-Za-z0-9_-]+)$/.exec(encoded || "");
  if (!match) throw new HttpError(500, "configuracion_incompleta", "ADMIN_PASSWORD_HASH no tiene el formato scrypt esperado.");
  const [, rawN, rawR, rawP, rawSalt, rawHash] = match;
  const N = Number(rawN);
  const r = Number(rawR);
  const p = Number(rawP);
  const salt = decodeBase64url(rawSalt);
  const hash = decodeBase64url(rawHash);
  const validN = Number.isInteger(N) && N >= 1024 && N <= 1_048_576 && (N & (N - 1)) === 0;
  if (!validN || !Number.isInteger(r) || r < 1 || r > 32 || !Number.isInteger(p) || p < 1 || p > 16 || !salt || salt.length < 16 || salt.length > 64 || !hash || hash.length < 32 || hash.length > 128) {
    throw new HttpError(500, "configuracion_incompleta", "ADMIN_PASSWORD_HASH contiene parámetros scrypt inválidos.");
  }
  return { N, r, p, salt, hash };
}

export async function createPasswordHash(password, options = {}) {
  if (typeof password !== "string" || password.length < 12 || password.length > 1024) {
    throw new TypeError("La contraseña debe tener entre 12 y 1024 caracteres.");
  }
  const N = options.N ?? DEFAULT_SCRYPT.N;
  const r = options.r ?? DEFAULT_SCRYPT.r;
  const p = options.p ?? DEFAULT_SCRYPT.p;
  const keyLength = options.keyLength ?? DEFAULT_SCRYPT.keyLength;
  const salt = options.salt ? Buffer.from(options.salt) : randomBytes(24);
  const derived = await scrypt(password, salt, keyLength, { N, r, p, maxmem: Math.max(64 * 1024 * 1024, 256 * N * r) });
  return `scrypt$${N}$${r}$${p}$${base64url(salt)}$${base64url(derived)}`;
}

export async function verifyPassword(password, encoded) {
  if (typeof password !== "string" || password.length > 1024) return false;
  const parsed = parsePasswordHash(encoded);
  const candidate = await scrypt(password, parsed.salt, parsed.hash.length, {
    N: parsed.N,
    r: parsed.r,
    p: parsed.p,
    maxmem: Math.max(64 * 1024 * 1024, 256 * parsed.N * parsed.r),
  });
  return candidate.length === parsed.hash.length && timingSafeEqual(candidate, parsed.hash);
}

export async function verifyCredentials(user, password, env = process.env) {
  if (!env.ADMIN_USER || !env.ADMIN_PASSWORD_HASH) {
    throw new HttpError(500, "configuracion_incompleta", "Las credenciales de administración no están configuradas.");
  }
  const passwordMatches = await verifyPassword(password, env.ADMIN_PASSWORD_HASH);
  const supplied = Buffer.from(typeof user === "string" ? user : "", "utf8");
  const expected = Buffer.from(env.ADMIN_USER, "utf8");
  const userMatches = supplied.length === expected.length && timingSafeEqual(supplied, expected);
  return userMatches && passwordMatches;
}

// Límite deliberadamente global por instancia: no conserva IP, hash de IP,
// usuario introducido ni ningún otro identificador del visitante.
export function requireLoginCapacity(now = Date.now()) {
  if (now - loginLimiter.lastFailure >= LOGIN_DECAY_MS) loginLimiter = { failures: 0, lastFailure: 0, blockedUntil: 0 };
  if (now < loginLimiter.blockedUntil) {
    throw new HttpError(429, "demasiados_intentos", "Hay demasiados intentos de acceso. Espera unos segundos y vuelve a intentarlo.");
  }
}

export function recordLoginFailure(now = Date.now()) {
  if (now - loginLimiter.lastFailure >= LOGIN_DECAY_MS) loginLimiter = { failures: 0, lastFailure: 0, blockedUntil: 0 };
  loginLimiter.failures = Math.min(loginLimiter.failures + 1, 32);
  loginLimiter.lastFailure = now;
  const exponent = loginLimiter.failures - LOGIN_FREE_FAILURES - 1;
  const delay = exponent >= 0 ? Math.min(LOGIN_MAX_DELAY_MS, 1000 * (2 ** exponent)) : 0;
  loginLimiter.blockedUntil = now + delay;
}

export function recordLoginSuccess() {
  loginLimiter = { failures: 0, lastFailure: 0, blockedUntil: 0 };
}

function signature(encodedPayload, secret) {
  return createHmac("sha256", secret).update(encodedPayload).digest();
}

export function createSignedToken(subject, ttlSeconds, env = process.env, now = Date.now()) {
  const payload = {
    v: 1,
    sub: subject,
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + ttlSeconds,
    csrf: base64url(randomBytes(24)),
  };
  const encoded = base64url(Buffer.from(JSON.stringify(payload), "utf8"));
  return { token: `${encoded}.${base64url(signature(encoded, secretFrom(env)))}`, payload };
}

export function verifySignedToken(token, expectedSubject, env = process.env, now = Date.now()) {
  if (typeof token !== "string" || token.length > 2048) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const received = decodeBase64url(parts[1]);
  const expected = signature(parts[0], secretFrom(env));
  if (!received || received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const seconds = Math.floor(now / 1000);
    if (payload.v !== 1 || payload.sub !== expectedSubject || !Number.isInteger(payload.iat) || !Number.isInteger(payload.exp) || payload.iat > seconds + 60 || payload.exp <= seconds || payload.exp - payload.iat > SESSION_SECONDS || !/^[A-Za-z0-9_-]{24,}$/.test(payload.csrf || "")) return null;
    return payload;
  } catch {
    return null;
  }
}

export function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearCookie(name) {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

export function createSession(env = process.env, now = Date.now()) {
  return createSignedToken(`admin:${env.ADMIN_USER}`, SESSION_SECONDS, env, now);
}

export function createPreauth(env = process.env, now = Date.now()) {
  return createSignedToken("preauth", PREAUTH_SECONDS, env, now);
}

export function readSession(req, env = process.env, now = Date.now()) {
  const token = parseCookies(req)[SESSION_COOKIE];
  return verifySignedToken(token, `admin:${env.ADMIN_USER}`, env, now);
}

export function readPreauth(req, env = process.env, now = Date.now()) {
  const token = parseCookies(req)[PREAUTH_COOKIE];
  return verifySignedToken(token, "preauth", env, now);
}

export function requireAdmin(req, env = process.env) {
  const session = readSession(req, env);
  if (!session) throw new HttpError(401, "sesion_requerida", "Inicia sesión para continuar.");
  return session;
}

function sameToken(a, b) {
  const left = Buffer.from(typeof a === "string" ? a : "", "utf8");
  const right = Buffer.from(typeof b === "string" ? b : "", "utf8");
  return left.length > 0 && left.length === right.length && timingSafeEqual(left, right);
}

export function requireMutation(req, csrf, env = process.env) {
  requireSameOrigin(req, env);
  if (!sameToken(header(req, "x-csrf-token"), csrf)) {
    throw new HttpError(403, "csrf_invalido", "El token de seguridad expiró. Recarga el panel e inténtalo de nuevo.");
  }
}
