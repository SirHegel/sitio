import test from "node:test";
import assert from "node:assert/strict";

import handler, { readAdminAudit } from "../api/admin/auditoria.js";
import { privatePreviewUrl, readPublicationInventory } from "../lib/publicacion-programada.js";

function response() {
  const headers = new Map();
  return {
    statusCode: 0,
    body: "",
    setHeader(name, value) { headers.set(name.toLowerCase(), value); },
    getHeader(name) { return headers.get(name.toLowerCase()); },
    end(value = "") { this.body = String(value); },
  };
}

test("la URL privada exige ambiente preview, marca explícita y dominio de Vercel", () => {
  const hostname = "sitio-estudio-oro-ficticio.vercel.app";
  assert.equal(privatePreviewUrl({ VERCEL_ENV: "preview", ORO_PRIVATE_PREVIEW: "1", VERCEL_URL: hostname }), `https://${hostname}/blog/oro-perimetros/`);
  assert.equal(privatePreviewUrl({ VERCEL_ENV: "preview", VERCEL_URL: hostname }), null);
  assert.equal(privatePreviewUrl({ VERCEL_ENV: "production", ORO_PRIVATE_PREVIEW: "1", VERCEL_URL: hostname }), null);
  assert.equal(privatePreviewUrl({ VERCEL_ENV: "preview", ORO_PRIVATE_PREVIEW: "1", VERCEL_URL: "atacante.test" }), null);
  assert.equal(privatePreviewUrl({ VERCEL_ENV: "preview", ORO_PRIVATE_PREVIEW: "1", VERCEL_URL: "usuario%40ejemplo.vercel.app" }), null);
  assert.equal(privatePreviewUrl({ VERCEL_ENV: "preview", ORO_PRIVATE_PREVIEW: "1", VERCEL_URL: "doble..punto.vercel.app" }), null);
});

test("el inventario privado expone estado auditable sin geometrías ni contactos", () => {
  const publicacion = readPublicationInventory({
    VERCEL_ENV: "preview",
    ORO_PRIVATE_PREVIEW: "1",
    VERCEL_URL: "sitio-estudio-oro-ficticio.vercel.app",
    ORO_REVIEW_REVISION: "a".repeat(40),
    ORO_REVIEW_TREE: "b".repeat(40),
    ORO_REVIEW_ARTICLE_SHA256: "c".repeat(64),
    ORO_REVIEW_BODY_SHA256: "d".repeat(64),
    ORO_REVIEW_PROJECT_SHA256: "e".repeat(64),
    ORO_REPLICA_STATE: "closed",
    ORO_REPLICA_CUTOFF: "2026-09-05",
    ORO_REPLIES_COUNT: "0",
  });
  assert.equal(publicacion.estado, "vista_previa_privada");
  assert.equal(publicacion.visibilidad.vistaPreviaPrivada, true);
  assert.equal(publicacion.conteo.compuertasAprobadas, 11);
  assert.equal(publicacion.conteo.compuertasTotales, 12);
  assert.equal(publicacion.compuertas.find((item) => item.id === "derecho_replica")?.estado, "aprobada");
  assert.equal(publicacion.compuertas.find((item) => item.id === "aprobacion_usuario")?.estado, "pendiente");
  assert.equal(publicacion.programacion.publicacion, null);
  assert.equal(publicacion.programacion.temporizadorAutomatico, "deshabilitado");
  assert.equal(publicacion.programacion.aprobacionUsuario, "pendiente");
  assert.equal(publicacion.artefactoRevision?.proyectoSha256, "e".repeat(64));
  assert.equal(publicacion.artefactoRevision?.deploymentHost, "sitio-estudio-oro-ficticio.vercel.app");
  assert.equal(publicacion.pruebas.aprobadas, publicacion.pruebas.total);
  assert.equal(publicacion.pruebas.total, 200);
  assert.equal(publicacion.metricas.find((item) => item.id === "primer_render")?.valor, 1313);
  assert.equal(publicacion.metricas.find((item) => item.id === "manuscrito")?.valor, 8996);
  assert.equal(publicacion.metricas.find((item) => item.id === "trazas")?.valor, 208);
  assert.equal(publicacion.metricas.find((item) => item.id === "riesgo")?.valor, 20);
  assert.equal(publicacion.metricas.find((item) => item.id === "riesgo")?.entradasMatrizRiesgo, 28);
  assert.deepEqual(
    publicacion.metricas
      .filter((item) => ["deltas_territoriales", "hipotesis_empiricas"].includes(item.id))
      .map((item) => [item.valor, item.cumple]),
    [[0, false], [0, false]],
  );
  assert.deepEqual(
    publicacion.metricas
      .filter((item) => ["cruce_runap", "agregados_aduaneros_publicos", "agua_agataes"].includes(item.id))
      .map((item) => [item.id, item.valor, item.cumple]),
    [
      ["cruce_runap", 2, true],
      ["agregados_aduaneros_publicos", 2, true],
      ["agua_agataes", null, false],
    ],
  );
  const runap = publicacion.metricas.find((item) => item.id === "cruce_runap");
  assert.equal(runap?.solapes, 0);
  assert.equal(runap?.alcance, "RUNAP");
  const aduanera = publicacion.metricas.find((item) => item.id === "agregados_aduaneros_publicos");
  assert.equal(aduanera?.veredictoH3, "TODO(dato)");
  assert.equal(aduanera?.observacionesAnuales, 3);
  const agua = publicacion.metricas.find((item) => item.id === "agua_agataes");
  assert.equal(agua?.unidad, "sistemas reconciliados");
  assert.equal(agua?.pilotos, 1);
  assert.equal(agua?.sistemasPrimariosIdentificados, 2);
  assert.equal(agua?.coincidenciaConInventarioRaya, null);
  assert.equal(agua?.demandaMineraLitrosDia, null);
  assert.equal(agua?.deficitAgregadoLitrosDia, null);
  assert.deepEqual(
    {
      sujetos: publicacion.programacion.plazoReplica.sujetos,
      smtp: publicacion.programacion.plazoReplica.transaccionesSmtp,
      dsn: publicacion.programacion.plazoReplica.dsn,
      respuestas: publicacion.programacion.plazoReplica.respuestas,
      sinEvento: publicacion.programacion.plazoReplica.canalesSinEvento,
    },
    { sujetos: 10, smtp: 11, dsn: 3, respuestas: 0, sinEvento: 9 },
  );
  assert.deepEqual(
    [
      "cruce-runap",
      "ficha-aduanera-agregada",
      "ficha-hidrica-piloto",
      "auditoria-licencias",
      "vista-previa-protegida",
    ].map((id) => publicacion.entregables.find((item) => item.id === id)?.estado),
    ["creado", "creado", "creado", "creado", "creado"],
  );
  assert.equal(publicacion.entregables.find((item) => item.id === "monitoreo-replica")?.estado, "programado");
  assert.equal(publicacion.entregables.find((item) => item.id === "remediacion-github")?.estado, "requiere_autorizacion");
  assert.equal(publicacion.entregables.find((item) => item.id === "salida-produccion")?.estado, "espera_aprobacion_usuario");
  assert.ok(publicacion.entregables.some((item) => item.id === "mapa-territorio" && item.estado === "creado"));

  const serializado = JSON.stringify(publicacion).toLowerCase();
  assert.doesNotMatch(serializado, /\b-?\d{1,3}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}\b/);
  assert.doesNotMatch(serializado, /[\w.+-]+@[\w.-]+\.[a-z]{2,}/);
  assert.doesNotMatch(serializado, /"(?:message[_-]?id|destinatario_id|direcci[oó]n|tel[eé]fono)"\s*:/);
});

test("una marca de réplica inválida no convierte una preview sellada en cierre editorial", () => {
  const base = {
    VERCEL_ENV: "preview",
    ORO_PRIVATE_PREVIEW: "1",
    VERCEL_URL: "sitio-estudio-oro-ficticio.vercel.app",
    ORO_REVIEW_REVISION: "a".repeat(40),
    ORO_REVIEW_TREE: "b".repeat(40),
    ORO_REVIEW_ARTICLE_SHA256: "c".repeat(64),
    ORO_REVIEW_BODY_SHA256: "d".repeat(64),
    ORO_REVIEW_PROJECT_SHA256: "e".repeat(64),
    ORO_REPLICA_STATE: "closed",
  };
  for (const env of [
    { ...base, ORO_REPLICA_CUTOFF: "2026-09-04", ORO_REPLIES_COUNT: "0" },
    { ...base, ORO_REPLICA_CUTOFF: "2026-09-05", ORO_REPLIES_COUNT: "101" },
    { ...base, ORO_REPLICA_CUTOFF: "2026-02-31", ORO_REPLIES_COUNT: "0" },
  ]) {
    const inventario = readPublicationInventory(env);
    assert.equal(inventario.conteo.compuertasAprobadas, 10);
    assert.equal(inventario.compuertas.find((item) => item.id === "derecho_replica")?.estado, "pendiente");
    assert.equal(inventario.programacion.plazoReplica.estado, "en_curso");
  }
});

test("previews ordinarias ocultan el estudio y producción exige cierre de réplica independiente", () => {
  for (const env of [
    { VERCEL_ENV: "preview", VERCEL_URL: "sitio-preview.vercel.app" },
    {},
  ]) {
    const publicacion = readPublicationInventory(env);
    assert.equal(publicacion.estado, "esperando_aprobacion");
    assert.equal(publicacion.visibilidad.vistaPreviaPrivada, false);
    assert.equal(publicacion.visibilidad.url, null);
  }

  const publicada = readPublicationInventory({
    VERCEL_ENV: "production",
    ORO_PUBLICATION_STATE: "published",
    ORO_USER_APPROVAL_STATE: "approved",
    ORO_RELEASE_HUELLA: "a".repeat(64),
    ORO_REPLIES_COUNT: "2",
    ORO_PUBLICATION_DATE: "2026-09-06",
    ORO_REPLICA_STATE: "closed",
    ORO_REPLICA_CUTOFF: "2026-09-06",
  });
  assert.equal(publicada.estado, "publicada");
  assert.equal(publicada.actualizado, "2026-09-06");
  assert.equal(publicada.visibilidad.produccion, "publicada");
  assert.equal(publicada.visibilidad.indexacion, "habilitada_en_produccion");
  assert.equal(publicada.visibilidad.url, null);
  assert.equal(publicada.programacion.plazoReplica.estado, "cerrada");
  assert.equal(publicada.programacion.plazoReplica.respuestas, 2);
  assert.equal(publicada.conteo.compuertasAprobadas, 12);
  assert.equal(publicada.conteo.compuertasPendientes, 0);
  assert.equal(publicada.compuertas.find((item) => item.id === "derecho_replica")?.estado, "aprobada");
  assert.equal(publicada.compuertas.find((item) => item.id === "aprobacion_usuario")?.estado, "aprobada");
  assert.equal(publicada.entregables.find((item) => item.id === "salida-produccion")?.estado, "publicado");
  assert.equal(publicada.entregables.find((item) => item.id === "monitoreo-replica")?.estado, "programado");
  assert.equal(publicada.metricas.find((item) => item.id === "deltas_territoriales")?.cumple, false);

  const conteoInvalido = readPublicationInventory({
    VERCEL_ENV: "production",
    ORO_PUBLICATION_STATE: "published",
    ORO_USER_APPROVAL_STATE: "approved",
    ORO_RELEASE_HUELLA: "a".repeat(64),
    ORO_REPLIES_COUNT: "101",
    ORO_PUBLICATION_DATE: "2026-02-31",
  });
  assert.equal(conteoInvalido.estado, "esperando_aprobacion");
  assert.equal(conteoInvalido.programacion.plazoReplica.respuestas, 0);
  assert.equal(conteoInvalido.actualizado, "2026-08-29");
});

test("la publicación existente conserva dos contestaciones administrativas y no simula cierre", () => {
  for (const env of [
    { VERCEL_ENV: "production" },
    { VERCEL_ENV: "production", ORO_PUBLICATION_STATE: "published", ORO_USER_APPROVAL_STATE: "approved", ORO_RELEASE_HUELLA: "a".repeat(64), ORO_REPLIES_COUNT: "0", ORO_PUBLICATION_DATE: "2026-08-29" },
  ]) {
    const inventario = readPublicationInventory(env);
    assert.equal(inventario.estado, "publicada");
    assert.equal(inventario.programacion.plazoReplica.estado, "pendiente_documentacion");
    assert.equal(inventario.programacion.plazoReplica.respuestas, 2);
    assert.equal(inventario.programacion.plazoReplica.respuestasDeFondo, 0);
    assert.equal(inventario.programacion.plazoReplica.dsn, 6);
    assert.equal(inventario.programacion.plazoReplica.canalesSinEvento, 6);
    assert.equal(inventario.compuertas.find((item) => item.id === "derecho_replica").estado, "pendiente");
    assert.equal(inventario.compuertas.find((item) => item.id === "aprobacion_usuario").estado, "aprobada");
    assert.equal(inventario.entregables.find((item) => item.id === "monitoreo-replica").estado, "creado");
    assert.doesNotMatch(JSON.stringify(inventario), /@[A-Za-z0-9]|mensaje_sha256|message_id/);
  }
});

test("cada lectura entrega copias independientes del contrato", () => {
  const primera = readPublicationInventory({});
  primera.compuertas[0].estado = "alterada";
  primera.metricas.find((item) => item.id === "primer_render").valor = 0;
  primera.entregables[0].estado = "borrado";
  const segunda = readPublicationInventory({});
  assert.equal(segunda.compuertas[0].estado, "aprobada");
  assert.equal(segunda.metricas.find((item) => item.id === "primer_render").valor, 1313);
  assert.equal(segunda.entregables[0].estado, "creado");
});

test("la preview privada conserva el inventario cuando la analítica carece de credencial", async () => {
  const env = {
    VERCEL_ENV: "preview",
    ORO_PRIVATE_PREVIEW: "1",
    VERCEL_URL: "sitio-estudio-oro-ficticio.vercel.app",
  };
  const falla = new Error("token ausente");
  const datos = await readAdminAudit(env, async () => { throw falla; });
  assert.equal(datos.audiencia.disponible, false);
  assert.equal(datos.audiencia.codigo, "credencial_omitida_en_preview_privada");
  assert.equal(datos.publicacion.estado, "vista_previa_privada");
  assert.equal(datos.resumen.total, 0);

  await assert.rejects(
    () => readAdminAudit({ VERCEL_ENV: "production", ORO_PRIVATE_PREVIEW: "1" }, async () => { throw falla; }),
    (error) => error === falla,
  );
  await assert.rejects(
    () => readAdminAudit({ VERCEL_ENV: "preview" }, async () => { throw falla; }),
    (error) => error === falla,
  );
});

test("el endpoint exige sesión antes de construir la auditoría privada", async () => {
  const res = response();
  await handler({ method: "GET", headers: {} }, res);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(JSON.parse(res.body), {
    error: "sesion_requerida",
    mensaje: "Inicia sesión para continuar.",
  });
  assert.doesNotMatch(res.body, /publicacion|oro-perimetros|vercel\.app/);
});
