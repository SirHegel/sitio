import { requireAdmin, requireMutation } from "../../lib/auth.js";
import { listArticles, readArticle, saveArticle } from "../../lib/escritos.js";
import { allowMethods, json, queryValue, readJson, sendError } from "../../lib/http.js";

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["GET", "POST"])) return;
  try {
    const session = requireAdmin(req);
    if (req.method === "GET") {
      const slug = queryValue(req, "slug");
      if (slug) json(res, 200, { escrito: await readArticle(slug) });
      else {
        const escritos = await listArticles();
        json(res, 200, { escritos, total: escritos.length });
      }
      return;
    }
    requireMutation(req, session.csrf);
    const input = await readJson(req, 128 * 1024);
    const escrito = await saveArticle(input);
    json(res, input.sha ? 200 : 201, { escrito });
  } catch (error) {
    sendError(res, error);
  }
}
