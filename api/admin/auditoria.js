import { requireAdmin } from "../../lib/auth.js";
import { readAudit } from "../../lib/auditoria.js";
import { allowMethods, json, sendError } from "../../lib/http.js";
import { readPublicationInventory } from "../../lib/publicacion-programada.js";

function emptyPrivateAudienceAudit() {
  return {
    periodoDias: 0,
    resumen: {
      total: 0,
      porPais: {},
      porCiudad: {},
      porDispositivo: {},
      porVpn: {},
      porRuta: {},
      porReferente: {},
      porCampana: {},
    },
    recientes: [],
    audiencia: {
      disponible: false,
      codigo: "credencial_omitida_en_preview_privada",
    },
    nota: "La analítica de audiencia no está disponible en esta vista privada. Sus credenciales de producción no se copiaron al despliegue.",
  };
}

/**
 * Complejidad: O(A), donde A es el costo de leer la auditoría de audiencia;
 * espacio O(A). Invariante: únicamente la preview privada marcada puede
 * degradar esa lectura; producción y previews ordinarias fallan cerradas.
 */
export async function readAdminAudit(env = process.env, auditReader = readAudit) {
  let auditoria;
  try {
    auditoria = await auditReader(env);
  } catch (error) {
    if (env.VERCEL_ENV !== "preview" || env.ORO_PRIVATE_PREVIEW !== "1") throw error;
    auditoria = emptyPrivateAudienceAudit();
  }
  return { ...auditoria, publicacion: readPublicationInventory(env) };
}

export default async function handler(req, res) {
  if (!allowMethods(req, res, ["GET"])) return;
  try {
    requireAdmin(req);
    json(res, 200, await readAdminAudit());
  } catch (error) {
    sendError(res, error);
  }
}
