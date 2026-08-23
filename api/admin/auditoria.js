import { requireAdmin } from "../../lib/auth.js";
import { readAudit } from "../../lib/auditoria.js";
import { allowMethods, json, sendError } from "../../lib/http.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;
  try {
    requireAdmin(req);
    json(res, 200, await readAudit());
  } catch (error) {
    sendError(res, error);
  }
}
