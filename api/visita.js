import { createVisitEvent, evaluateNetwork, persistVisit, requirePublishedPath, validateVisitInput } from "../lib/auditoria.js";
import { allowMethods, expectedOrigin, json, readJson, requireSameOrigin, sendError } from "../lib/http.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["POST"])) return;
  try {
    requireSameOrigin(req);
    const input = await readJson(req, 4 * 1024);
    const origin = expectedOrigin(req);
    const { path } = validateVisitInput(input, origin);
    await requirePublishedPath(path, origin);
    const network = await evaluateNetwork(req);
    const event = createVisitEvent(req, input, network, new Date(), origin);
    await persistVisit(event);
    json(res, 202, { registrada: true });
  } catch (error) {
    sendError(res, error);
  }
}
