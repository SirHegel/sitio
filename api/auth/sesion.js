import { PREAUTH_COOKIE, SESSION_COOKIE, clearCookie, cookie, createPreauth, readSession } from "../../lib/auth.js";
import { allowMethods, appendHeader, json, sendError } from "../../lib/http.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;
  try {
    const session = readSession(req);
    if (session) {
      json(res, 200, {
        autenticada: true,
        usuario: process.env.ADMIN_USER,
        csrf: session.csrf,
        expira: new Date(session.exp * 1000).toISOString(),
      });
      return;
    }
    const preauth = createPreauth();
    appendHeader(res, "Set-Cookie", clearCookie(SESSION_COOKIE));
    appendHeader(res, "Set-Cookie", cookie(PREAUTH_COOKIE, preauth.token, preauth.payload.exp - preauth.payload.iat));
    json(res, 200, { autenticada: false, csrf: preauth.payload.csrf });
  } catch (error) {
    sendError(res, error);
  }
}
