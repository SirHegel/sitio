import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const ORIGEN = "https://jhonstevenalvarezruiz.vercel.app";
const RUTA = "/blog/oro-perimetros/";
const SHA256 = /^[a-f0-9]{64}$/;

/** O(B) tiempo y espacio. Solo conserva una publicación acreditada y el MDX
 * revisado exacto; no declara cerrada la réplica ni aprueba una primera salida. */
export function validarContinuidadOro(acta, manuscrito) {
  if (!acta || acta.esquema !== 1 || acta.estado !== "publicada"
    || acta.origen !== ORIGEN || acta.ruta !== RUTA
    || acta.publicacionOriginal !== "2026-08-29"
    || acta.autorizacionContinuidad !== "encargo-del-autor-2026-09-06"
    || acta.verificacion?.articuloHttp !== 200 || acta.verificacion?.blogHttp !== 200
    || acta.verificacion?.enlaceEnBlog !== true
    || !Number.isFinite(Date.parse(acta.verificacion?.fechaUtc))
    || !SHA256.test(acta.verificacion?.articuloSha256 || "")
    || !SHA256.test(acta.verificacion?.blogSha256 || "")
    || !SHA256.test(acta.manuscritoSha256 || "")
    || typeof manuscrito !== "string"
    || createHash("sha256").update(manuscrito).digest("hex") !== acta.manuscritoSha256
    || acta.replica?.estado !== "pendiente_documentacion") {
    throw new Error("el acta de continuidad no acredita la publicación y el manuscrito revisado exacto");
  }
  return { ...acta, replica: { ...acta.replica }, verificacion: { ...acta.verificacion } };
}

/** O(B) tiempo y espacio. Ausencia del acta conserva las compuertas iniciales;
 * un acta alterada detiene el build antes de escribir la salida pública. */
export async function leerContinuidadOro(raiz) {
  let texto;
  try { texto = await readFile(join(raiz, "datos", "continuidad-publicacion-oro.json"), "utf8"); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
  const manuscrito = await readFile(join(raiz, "salidas", "oro-perimetros.mdx"), "utf8");
  return validarContinuidadOro(JSON.parse(texto), manuscrito);
}
