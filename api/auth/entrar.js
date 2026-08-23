import { PREAUTH_COOKIE, SESSION_COOKIE, SESSION_SECONDS, clearCookie, cookie, createSession, readPreauth, recordLoginFailure, recordLoginSuccess, requireLoginCapacity, requireMutation, verifyCredentials } from "../../lib/auth.js";
import { HttpError, allowMethods, appendHeader, json, readJson, sendError } from "../../lib/http.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;
  try {
    const preauth = readPreauth(req);
    if (!preauth) throw new HttpError(403, "csrf_invalido", "Recarga el panel antes de iniciar sesión.");
    requireMutation(req, preauth.csrf);
    const body = await readJson(req, 8 * 1024);
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !["usuario", "contrasena"].includes(key))) {
      throw new HttpError(422, "credenciales_invalidas", "Envía únicamente usuario y contraseña.");
    }
    if (typeof body.usuario !== "string" || body.usuario.length > 200 || typeof body.contrasena !== "string" || body.contrasena.length > 1024) {
      throw new HttpError(422, "credenciales_invalidas", "El formato de las credenciales no es válido.");
    }
    requireLoginCapacity();
    if (!(await verifyCredentials(body.usuario, body.contrasena))) {
      recordLoginFailure();
      throw new HttpError(401, "credenciales_incorrectas", "Usuario o contraseña incorrectos.");
    }
    recordLoginSuccess();
    const session = createSession();
    appendHeader(res, "Set-Cookie", cookie(SESSION_COOKIE, session.token, SESSION_SECONDS));
    appendHeader(res, "Set-Cookie", clearCookie(PREAUTH_COOKIE));
    json(res, 200, {
      autenticada: true,
      usuario: process.env.ADMIN_USER,
      csrf: session.payload.csrf,
      expira: new Date(session.payload.exp * 1000).toISOString(),
    });
  } catch (error) {
    sendError(res, error);
  }
}
