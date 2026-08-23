import { PREAUTH_COOKIE, SESSION_COOKIE, clearCookie, requireAdmin, requireMutation } from "../../lib/auth.js";
import { allowMethods, appendHeader, json, sendError } from "../../lib/http.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;
  try {
    const session = requireAdmin(req);
    requireMutation(req, session.csrf);
    appendHeader(res, "Set-Cookie", clearCookie(SESSION_COOKIE));
    appendHeader(res, "Set-Cookie", clearCookie(PREAUTH_COOKIE));
    json(res, 200, { cerrada: true });
  } catch (error) {
    sendError(res, error);
  }
}
