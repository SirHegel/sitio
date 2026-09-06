const RUTA_ARTICULO = "/blog/oro-perimetros/";
const FECHA_CORTE = "2026-08-29";
const FECHA_PUBLICACION = "2026-09-05";

const COMPUERTAS = Object.freeze([
  Object.freeze({
    id: "geografia_3_de_3",
    nombre: "Geografía de los tres casos",
    estado: "aprobada",
    evidencia: "3/3 veredictos geoespaciales; 0 deltas numéricos, 3 límites de estimabilidad, 1 magnitud oficial reportada y 2/2 títulos colombianos contrastados con RUNAP.",
  }),
  Object.freeze({
    id: "unidad_aduanera",
    nombre: "Unidad aduanera",
    estado: "aprobada",
    evidencia: "La salida cartográfica distribuye 2/2 features agregados que reúnen 3 observaciones nacionales anuales con año, países, HS6, kg y USD. El compuesto mensual exacto permanece restringido. H3 conserva TODO(dato): faltan DUA, contenido, origen minero y recepción física.",
  }),
  Object.freeze({
    id: "hipotesis",
    nombre: "Hipótesis H1–H4",
    estado: "aprobada",
    evidencia: "12/12 casillas de cuatro hipótesis por tres casos tienen veredicto documental: 0 confirmadas o refutadas y 12 TODO(dato) con el documento faltante identificado.",
  }),
  Object.freeze({
    id: "capas_publicas",
    nombre: "Capas públicas",
    estado: "aprobada",
    evidencia: "9/9 familias de datos tienen archivo descargable, procedencia, fecha, licencia y huella SHA-256.",
  }),
  Object.freeze({
    id: "manuscrito",
    nombre: "Manuscrito",
    estado: "aprobada",
    evidencia: "8.996 palabras; la primera línea distingue la magnitud oficial reportada del delta todavía no calculable.",
  }),
  Object.freeze({
    id: "trazabilidad",
    nombre: "Trazabilidad factual",
    estado: "aprobada",
    evidencia: "208/208 frases sustantivas del inventario editorial conservan etiqueta de procedencia o cálculo.",
  }),
  Object.freeze({
    id: "riesgo_legal",
    nombre: "Riesgo legal",
    estado: "aprobada",
    evidencia: "La matriz contiene 28 entradas; 20 frases DOC/REG/RAYA tienen respaldo externo enlazado y superan el umbral previo de 10.",
  }),
  Object.freeze({
    id: "derecho_replica",
    nombre: "Derecho de réplica",
    estado: "pendiente",
    evidencia: "Los nombres, direcciones, puertos, periodo mensual, masa, valor y localizadores exactos de la operación fueron retirados del cuerpo y los GeoJSON. La salida conserva agregados anuales nacionales de UN Comtrade. El cierre exige cinco días hábiles completos y una consulta final sellada. La fecha de corte temporal es el 4 de septiembre de 2026.",
  }),
  Object.freeze({
    id: "aprobacion_usuario",
    nombre: "Aprobación de Jhon Steven",
    estado: "pendiente",
    evidencia: "La preview protegida es el resultado final para revisión visual. Producción exige una aprobación explícita vinculada a su revisión y deployment exactos; no existe temporizador automático.",
  }),
  Object.freeze({
    id: "rendimiento_accesibilidad",
    nombre: "Rendimiento y accesibilidad",
    estado: "aprobada",
    evidencia: "1.313 ms máximos en 6 corridas 4G frías; contraste AA, 44 px táctiles móviles, axe sin violaciones y degradación de ambos mapas sin WebGL 2 verificados.",
  }),
  Object.freeze({
    id: "mapas_y_tabla",
    nombre: "Mapas y alternativa tabular",
    estado: "aprobada",
    evidencia: "El estudio contiene 2 mapas y 12 tablas HTML legibles sin JavaScript.",
  }),
  Object.freeze({
    id: "voz",
    nombre: "Auditoría editorial",
    estado: "aprobada",
    evidencia: "El barrido mecánico no encontró construcciones vetadas en el manuscrito.",
  }),
]);

const METRICAS = Object.freeze([
  Object.freeze({
    id: "deltas_territoriales",
    nombre: "Deltas territoriales medidos",
    valor: 0,
    unidad: "de 3 casos",
    base: "polígonos oficiales comparables y huellas atribuibles disponibles",
    umbral: "3/3",
    cumple: false,
    nota: "Las 34,04 ha de Crucitas son una magnitud oficial reportada; no constituyen el delta entre huella real y perímetro legal.",
  }),
  Object.freeze({
    id: "hipotesis_empiricas",
    nombre: "Decisiones empíricas H1–H4",
    valor: 0,
    unidad: "de 12 casillas",
    base: "4 hipótesis × 3 casos",
    umbral: "12/12 confirmadas o refutadas",
    cumple: false,
    nota: "Las 12 casillas conservan TODO(dato) con el documento faltante identificado.",
  }),
  Object.freeze({
    id: "cruce_runap",
    nombre: "Títulos contrastados con RUNAP",
    valor: 2,
    unidad: "de 2 títulos",
    base: "0/2 títulos contrastados",
    umbral: "2/2",
    cumple: true,
    solapes: 0,
    alcance: "RUNAP",
    nota: "Resultado: 0 solapes en 2/2 títulos colombianos. El alcance cubre RUNAP al corte; quedan fuera páramo, Ley 2, territorios colectivos y otras figuras.",
  }),
  Object.freeze({
    id: "agregados_aduaneros_publicos",
    nombre: "Features aduaneros públicos agregados",
    valor: 2,
    unidad: "de 2 features cartográficos",
    base: "0/2 features reproducibles",
    umbral: "2/2",
    cumple: true,
    observacionesAnuales: 3,
    veredictoH3: "TODO(dato)",
    nota: "Los 2 features reúnen 3 observaciones nacionales: un espejo de 2018 y el par exportador–espejo de 2019. La ficha mensual, los actores, los puertos y los localizadores quedan en el expediente restringido. H3 sigue en TODO(dato): los agregados no acreditan origen Crucitas, contenido aurífero, recepción ni procesamiento.",
  }),
  Object.freeze({
    id: "agua_agataes",
    nombre: "Sistemas reconciliados con el inventario nominal atribuido",
    valor: null,
    unidad: "sistemas reconciliados",
    base: 0,
    umbral: "17/17 reconciliados",
    cumple: false,
    pilotos: 1,
    sistemasPrimariosIdentificados: 2,
    coincidenciaConInventarioRaya: null,
    demandaMineraLitrosDia: null,
    deficitAgregadoLitrosDia: null,
    nota: "Dos actos primarios de la CAS identifican sistemas rurales distintos; sus nombres y captaciones quedan restringidos. Falta el inventario nominal atribuido por RAYA, su reconciliación, los aforos y el balance hídrico del PMA/EIA y del PTO de CEI-101.",
  }),
  Object.freeze({
    id: "ramas_github_heredadas",
    nombre: "Ramas públicas heredadas con geometría exacta",
    valor: 2,
    unidad: "ramas",
    base: "2 ramas remotas detectadas",
    umbral: "0 ramas expuestas",
    cumple: false,
    nota: "origin/estudio/oro-perimetros y origin/estudio/oro-perimetros-publicable conservan artefactos históricos. La preview nueva no los usa; su purga exige autorización para borrar o reescribir historial remoto.",
  }),
  Object.freeze({
    id: "primer_render",
    nombre: "Primer render interactivo",
    valor: 1313,
    unidad: "ms",
    base: "6 corridas frías en 4G simulada",
    umbral: "< 2500 ms",
    cumple: true,
    nota: "Intervalo observado: 1.155–1.313 ms; σ muestral = 61,64 ms.",
  }),
  Object.freeze({
    id: "manuscrito",
    nombre: "Extensión del cuerpo",
    valor: 8996,
    unidad: "palabras",
    base: "conteo mecánico sin front matter ni anexos",
    umbral: "6.000–9.000 palabras",
    cumple: true,
    nota: "El artículo queda dentro del rango fijado antes de redactar.",
  }),
  Object.freeze({
    id: "capas_descargables",
    nombre: "Capas descargables",
    valor: 9,
    unidad: "de 9 familias",
    base: "manifiesto público v2",
    umbral: "9/9",
    cumple: true,
    nota: "Cada familia declara procedencia, derechos y SHA-256.",
  }),
  Object.freeze({
    id: "trazas",
    nombre: "Frases factuales trazadas",
    valor: 208,
    unidad: "de 208 frases",
    base: "inventario editorial",
    umbral: "100 % etiquetadas",
    cumple: true,
    nota: "Las etiquetas distinguen documento, registro, reporteo, cálculo e interpretación.",
  }),
  Object.freeze({
    id: "riesgo",
    nombre: "Frases expuestas con respaldo externo",
    valor: 20,
    unidad: "frases",
    base: "pasada legal del manuscrito",
    umbral: "≥ 10",
    cumple: true,
    entradasMatrizRiesgo: 28,
    nota: "La matriz contiene 28 entradas. La métrica cuenta 20 líneas DOC/REG/RAYA con enlace externo; las restantes conservan soporte interno o interpretación declarada.",
  }),
]);

const ENTREGABLES = Object.freeze([
  Object.freeze({ id: "articulo", nombre: "Macroestudio editorial", descripcion: "Artículo de 8.996 palabras con metodología, modelos, márgenes, pruebas de sanidad y veredictos H1–H4.", estado: "creado" }),
  Object.freeze({ id: "mapa-territorio", nombre: "Mapa territorial", descripcion: "Vista interactiva de los tres casos con 9 familias conmutables y descarga de datos públicos.", estado: "creado" }),
  Object.freeze({ id: "mapa-mundo", nombre: "Mapa mundo", descripcion: "Vista de casos, rutas documentadas y nodos de comercialización con atribución separada.", estado: "creado" }),
  Object.freeze({ id: "cortina", nombre: "Comparador satelital", descripcion: "Cortina antes/después con método y fuente visibles en la propia interfaz.", estado: "creado" }),
  Object.freeze({ id: "tablas", nombre: "Alternativa accesible", descripcion: "12 tablas HTML mantienen el contenido cuando JavaScript o WebGL 2 faltan.", estado: "creado" }),
  Object.freeze({ id: "datos", nombre: "Paquete de datos públicos", descripcion: "9 GeoJSON con manifiesto de fuente, fecha, licencia, hash y descarga directa.", estado: "creado" }),
  Object.freeze({ id: "auditoria", nombre: "Expediente de auditoría", descripcion: "115 registros documentales y pruebas editoriales, legales, cartográficas, móviles y de publicación transaccional.", estado: "creado" }),
  Object.freeze({ id: "cruce-runap", nombre: "Cruce RUNAP", descripcion: "Cruce reproducible en EPSG:9377 de 2/2 títulos colombianos contra RUNAP: 0 solapes, con el alcance ambiental delimitado.", estado: "creado" }),
  Object.freeze({ id: "ficha-aduanera-agregada", nombre: "Ficha aduanera pública agregada", descripcion: "Dos registros anuales nacionales reproducibles, con contraste de masa y veredicto H3 en TODO(dato); el compuesto mensual queda restringido.", estado: "creado" }),
  Object.freeze({ id: "ficha-hidrica-piloto", nombre: "Ficha hídrica piloto", descripcion: "Dos actos primarios de la CAS identifican sistemas distintos y uno admite cálculo de oferta bruta; la reconciliación con los 17 atribuidos y el déficit agregado siguen abiertos.", estado: "creado" }),
  Object.freeze({ id: "auditoria-licencias", nombre: "Auditoría de licencias", descripcion: "Inventario de derechos, licencias declaradas y restricciones; los insumos sin autorización afirmativa quedan fuera de la redistribución.", estado: "creado" }),
  Object.freeze({ id: "vista-previa-protegida", nombre: "Resultado final protegido", descripcion: "Resultado final de revisión desplegado en privado; no se lista fuera de Auditoría y Vercel exige autenticación.", estado: "creado" }),
  Object.freeze({ id: "monitoreo-replica", nombre: "Monitoreo de réplica", descripcion: "Consulta final programada para 10 sujetos: 11 transacciones SMTP, 3 DSN, 0 respuestas y 9 canales sin evento en el corte.", estado: "programado" }),
  Object.freeze({ id: "remediacion-github", nombre: "Remediación de ramas históricas", descripcion: "Retiro de dos ramas remotas que ya exponen geometría exacta; no ejecutado porque exige autorización expresa para borrar o reescribir historial público.", estado: "requiere_autorizacion" }),
  Object.freeze({ id: "salida-produccion", nombre: "Salida pública", descripcion: "Sin fecha automática. Solo puede ejecutarse después del cierre de réplica y de una aprobación explícita de Jhon Steven sobre esta preview exacta.", estado: "espera_aprobacion_usuario" }),
]);

/**
 * Complejidad temporal y espacial: O(1). Invariante: una URL se devuelve
 * únicamente para el despliegue privado marcado de forma explícita; una
 * preview ordinaria y producción reciben null.
 */
export function privatePreviewUrl(env = process.env) {
  if (env.VERCEL_ENV !== "preview" || env.ORO_PRIVATE_PREVIEW !== "1") return null;
  const hostname = String(env.VERCEL_URL || "").trim().toLowerCase();
  const etiquetas = hostname.split(".");
  const etiquetaValida = (etiqueta) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(etiqueta);
  if (!hostname || hostname.length > 253 || !hostname.endsWith(".vercel.app")
    || hostname === "vercel.app" || !etiquetas.every(etiquetaValida)) return null;
  try {
    const origin = new URL(`https://${hostname}`);
    if (origin.hostname !== hostname || origin.port) return null;
    return new URL(RUTA_ARTICULO, origin).href;
  } catch {
    return null;
  }
}

/**
 * Complejidad temporal y espacial: O(1). Invariantes: el estado publicado
 * solo existe en producción y exige una marca inyectada por el publicador
 * transaccional; el conteo de respuestas queda acotado y nunca expone autores.
 */
function publishedState(env) {
  const rawRelease = String(env.ORO_RELEASE_HUELLA ?? "").trim().toLowerCase();
  if (env.VERCEL_ENV !== "production" || env.ORO_PUBLICATION_STATE !== "published"
    || env.ORO_USER_APPROVAL_STATE !== "approved" || !/^[a-f0-9]{64}$/.test(rawRelease)) {
    return env.VERCEL_ENV === "production" && CONTINUIDAD_ORO.estado === "publicada"
      ? { published: true, replies: CONTINUIDAD_ORO.replica.respuestas, date: CONTINUIDAD_ORO.publicacionOriginal }
      : { published: false, replies: 0, date: FECHA_PUBLICACION };
  }
  const rawReplies = String(env.ORO_REPLIES_COUNT ?? "0").trim();
  const replies = /^\d{1,3}$/.test(rawReplies) ? Number(rawReplies) : null;
  const rawDate = String(env.ORO_PUBLICATION_DATE ?? "").trim();
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? new Date(`${rawDate}T00:00:00Z`)
    : null;
  const validDate = parsedDate
    && !Number.isNaN(parsedDate.getTime())
    && parsedDate.toISOString().slice(0, 10) === rawDate
    && rawDate >= CONTINUIDAD_ORO.publicacionOriginal;
  if (!validDate || replies === null || replies > 100) {
    return { published: false, replies: 0, date: FECHA_PUBLICACION };
  }
  return {
    published: true,
    replies,
    date: rawDate,
  };
}

/**
 * Complejidad temporal y espacial: O(1); el tamaño del contrato está fijado.
 * Invariantes: no incorpora coordenadas, contactos, identificadores de correo
 * ni rutas de operación; cada llamada entrega copias mutables independientes.
 */
export function readPublicationInventory(env = process.env) {
  const url = privatePreviewUrl(env);
  const publication = publishedState(env);
  const revisionRevision = String(env.ORO_REVIEW_REVISION || "").trim().toLowerCase();
  const revisionArbol = String(env.ORO_REVIEW_TREE || "").trim().toLowerCase();
  const revisionArticulo = String(env.ORO_REVIEW_ARTICLE_SHA256 || "").trim().toLowerCase();
  const revisionCuerpo = String(env.ORO_REVIEW_BODY_SHA256 || "").trim().toLowerCase();
  const revisionProyecto = String(env.ORO_REVIEW_PROJECT_SHA256 || "").trim().toLowerCase();
  const artefactoRevision = url
    && /^[a-f0-9]{40}$/.test(revisionRevision)
    && /^[a-f0-9]{40}$/.test(revisionArbol)
    && /^[a-f0-9]{64}$/.test(revisionArticulo)
    && /^[a-f0-9]{64}$/.test(revisionCuerpo)
    && /^[a-f0-9]{64}$/.test(revisionProyecto)
    ? {
        estado: "sellado_para_revision",
        revision: revisionRevision,
        arbol: revisionArbol,
        articuloSha256: revisionArticulo,
        cuerpoSha256: revisionCuerpo,
        proyectoSha256: revisionProyecto,
        deploymentHost: new URL(url).hostname,
        regla: "Cualquier cambio invalida la aprobación y exige otra vista previa.",
      }
    : null;
  const corteReplicaRevision = String(env.ORO_REPLICA_CUTOFF || "").trim();
  const respuestasReplicaRevision = String(env.ORO_REPLIES_COUNT ?? "0").trim();
  const fechaReplicaRevision = /^\d{4}-\d{2}-\d{2}$/.test(corteReplicaRevision)
    ? new Date(`${corteReplicaRevision}T00:00:00Z`)
    : null;
  const cantidadReplicaRevision = /^\d{1,3}$/.test(respuestasReplicaRevision)
    ? Number(respuestasReplicaRevision)
    : null;
  const replicaRevisionCerrada = Boolean((url && artefactoRevision || publication.published)
    && env.ORO_REPLICA_STATE === "closed"
    && fechaReplicaRevision
    && !Number.isNaN(fechaReplicaRevision.getTime())
    && fechaReplicaRevision.toISOString().slice(0, 10) === corteReplicaRevision
    && corteReplicaRevision >= FECHA_PUBLICACION
    && cantidadReplicaRevision !== null
    && cantidadReplicaRevision <= 100);
  const replicaCerrada = replicaRevisionCerrada;
  const replicaPendiente = publication.published && !replicaCerrada ? CONTINUIDAD_ORO.replica : null;
  const respuestasCerradas = publication.published ? publication.replies
    : replicaRevisionCerrada ? cantidadReplicaRevision : 0;
  const fechaCierre = replicaRevisionCerrada ? corteReplicaRevision : null;
  const compuertas = COMPUERTAS.map((item) => {
    if (item.id === "manuscrito" && publication.published) {
      return { ...item, evidencia: `${CONTINUIDAD_ORO.manuscritoPalabras.toLocaleString("es-CO")} palabras en el MDX revisado. Incluye el estado administrativo de la réplica al 6 de septiembre; su huella está fijada en el acta de continuidad.` };
    }
    if (item.id === "trazabilidad" && publication.published) {
      return { ...item, evidencia: `${CONTINUIDAD_ORO.trazas}/${CONTINUIDAD_ORO.trazas} entradas etiquetadas en el expediente, incluidas tres nuevas trazas administrativas del 6 de septiembre.` };
    }
    if (item.id === "derecho_replica" && replicaCerrada) {
      return {
        ...item,
        estado: "aprobada",
        evidencia: `Cinco días hábiles completos, consulta final sellada el ${fechaCierre} y ${respuestasCerradas} respuesta${respuestasCerradas === 1 ? "" : "s"} integrada${respuestasCerradas === 1 ? "" : "s"}.`,
      };
    }
    if (item.id === "derecho_replica" && replicaPendiente) {
      return { ...item, estado: "pendiente", evidencia: `${replicaPendiente.diasHabiles}/5 días hábiles completos. ${replicaPendiente.respuestas} contestaciones administrativas, ${replicaPendiente.respuestasDeFondo} respuestas de fondo. ${replicaPendiente.detalle}` };
    }
    if (item.id === "aprobacion_usuario" && publication.published) {
      return {
        ...item,
        estado: "aprobada",
        evidencia: "El autor autorizó la publicación inicial el 29 de agosto y su continuidad en el encargo del 6 de septiembre. El cierre de réplica conserva su estado independiente.",
      };
    }
    return { ...item };
  });
  const aprobadas = compuertas.filter((item) => item.estado === "aprobada").length;
  const estado = url ? "vista_previa_privada" : publication.published ? "publicada" : "esperando_aprobacion";
  return {
    esquema: 1,
    id: "oro-perimetros",
    titulo: "34,04 hectáreas reportadas tras la sentencia de Crucitas: oro, perímetros y capa basal",
    estado,
    actualizado: fechaCierre || (replicaPendiente ? replicaPendiente.consultaUtc : FECHA_CORTE),
    visibilidad: {
      produccion: publication.published ? "publicada" : "embargada_hasta_aprobacion",
      rutaPublica: RUTA_ARTICULO,
      vistaPreviaPrivada: Boolean(url),
      url,
      proteccion: publication.published
        ? "La ruta canónica está publicada; la sesión de administración conserva su expediente de salida."
        : url
        ? "Vercel Deployment Protection protege el resultado final; dentro del sitio, solo Auditoría revela el enlace después de iniciar sesión."
        : "La ruta pública permanece fuera de la compilación ordinaria y espera aprobación explícita.",
      indexacion: publication.published ? "habilitada_en_produccion" : "bloqueada_en_vista_previa",
    },
    artefactoRevision,
    programacion: {
      zonaHoraria: "America/Bogota",
      publicacion: null,
      primerMomentoElegible: "2026-09-05T00:00:00-05:00",
      temporizadorAutomatico: "deshabilitado",
      aprobacionUsuario: publication.published ? "aprobada" : "pendiente",
      plazoReplica: {
        sujetos: 10,
        cuestionarios: 10,
        transaccionesSmtp: 11,
        canalesSinEvento: replicaPendiente?.canalesSinEvento ?? 9,
        dsn: replicaPendiente?.dsn ?? 3,
        rebotes: replicaPendiente?.dsn ?? 3,
        buzonesConRebote: replicaPendiente?.buzonesConRebote ?? 2,
        respuestas: replicaPendiente?.respuestas ?? respuestasCerradas,
        respuestasDeFondo: replicaPendiente?.respuestasDeFondo ?? null,
        consultaUtc: replicaPendiente?.consultaUtc ?? null,
        diasHabiles: replicaPendiente?.diasHabiles ?? (replicaCerrada ? 5 : null),
        detalle: replicaPendiente?.detalle ?? null,
        fechaLimite: "2026-09-04T23:59:59-05:00",
        estado: replicaCerrada ? "cerrada" : replicaPendiente ? "pendiente_documentacion" : "en_curso",
      },
    },
    conteo: {
      compuertasAprobadas: aprobadas,
      compuertasTotales: COMPUERTAS.length,
      compuertasPendientes: COMPUERTAS.length - aprobadas,
    },
    metricas: METRICAS.map((item) => ({
      ...item,
      ...(item.id === "manuscrito" && publication.published ? { valor: CONTINUIDAD_ORO.manuscritoPalabras } : {}),
      ...(item.id === "trazas" && publication.published ? { valor: CONTINUIDAD_ORO.trazas } : {}),
    })),
    compuertas,
    entregables: ENTREGABLES.map((item) => ({
      ...item,
      descripcion: item.id === "monitoreo-replica" && replicaPendiente
        ? `Consulta de solo lectura sellada: ${replicaPendiente.respuestas} contestaciones administrativas y ${replicaPendiente.dsn} DSN. ${replicaPendiente.detalle}`
        : item.id === "remediacion-github" && publication.published
          ? "Dos ramas remotas fueron retiradas el 29 de agosto de 2026, con respaldo local; el historial privado no se vuelve a publicar."
          : item.descripcion,
      estado: item.id === "salida-produccion" && publication.published
        ? "publicado"
        : item.id === "monitoreo-replica" && replicaPendiente
          ? "creado"
        : item.id === "remediacion-github" && publication.published
          ? "creado"
        : item.id === "vista-previa-protegida" && !url
          ? "pendiente"
          : item.estado,
    })),
    pruebas: {
      aprobadas: 200,
      total: 200,
      renderMaximoMs: 1313,
      umbralMs: 2500,
      corridas: 6,
      viewportsCronometrados: ["390×844", "1440×900"],
      comprobacionesFuncionales: ["320×800", "390×844", "1440×900"],
      ambiente: "Medición histórica del 29 de agosto de 2026: auditoría local del prebuilt de ese corte con red 4G simulada. No acredita el rendimiento de cambios posteriores.",
      finMetrica: "Primer estado temático inactivo; la capa base progresiva comienza después y queda fuera del tiempo declarado.",
      teselasAuditoria: "Respuestas PNG locales deterministas; cero solicitudes automatizadas al servicio estándar de OpenStreetMap.",
      axeWcag: true,
      tecladoFoco: true,
      sinWebgl2: true,
      sinDesbordamiento: true,
      contrasteAA: true,
    },
    limites: [
      "Las compuertas miden integridad de salida, trazabilidad y seguridad. No equivalen al cierre empírico de todos los modelos pedidos.",
      "Los tres deltas territoriales conservan 0/3 valores numéricos: faltan geometrías oficiales comparables y huellas atribuibles.",
      "H1–H4 conservan estado TODO(dato); el estudio no presenta una hipótesis abierta como hallazgo confirmado.",
      "El cruce de 2/2 títulos produjo 0 solapes dentro de RUNAP; el resultado no cubre páramo, Ley 2, territorios colectivos ni otras figuras ambientales.",
      "La salida aduanera pública contiene 2/2 features cartográficos y 3 observaciones nacionales anuales: espejo 2018 y par exportador–espejo 2019. El expediente mensual exacto permanece restringido; la DUA original sigue pendiente para fijar semántica bruto/neto, contenido y origen minero.",
      "Los agregados año–países–HS6–masa–valor conservan riesgo de enlace con fuentes externas. k_operaciones = TODO(dato); no se presentan como registros anónimos ni como una operación individual.",
      "Dos actos primarios de la CAS identifican sistemas distintos. La coincidencia con el inventario nominal atribuido por RAYA, la demanda minera y el déficit permanecen null; faltan el PMA/EIA y el PTO de CEI-101.",
      "Dos ramas remotas heredadas conservan geometría exacta y material operativo editorial en un repositorio público. La vista nueva no las consume ni hará push; purgarlas exige autorización expresa para borrar o reescribir historial.",
      "No existe una salida automática a producción. El publicador exige un acta local de aprobación que coincida con la revisión y el deployment privado mostrados aquí.",
      "Los nombres del exportador y del consignatario, sus direcciones, puertos, periodo mensual, masa, valor y localizadores exactos fueron retirados del cuerpo y los GeoJSON. La salida conserva agregados anuales nacionales de UN Comtrade. El cierre aún exige cinco días hábiles completos y consulta final sellada.",
      "Ocho cuestionarios conservan el rótulo histórico NO ENVIADO porque son copias congeladas previas al despacho. Una aclaración de estado aceptada en 8/8 hilos enlaza cada copia con su transacción y preserva el hash original.",
      "Los miembros autorizados del proyecto pueden ver el deployment desde la consola de Vercel. Dentro del sitio generado, Auditoría es la única superficie que revela el enlace.",
      "La geometría operativa precisa permanece fuera del paquete público y de este contrato del panel.",
    ],
  };
}
import CONTINUIDAD_ORO from "../datos/continuidad-publicacion-oro.json" with { type: "json" };
