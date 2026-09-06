const raiz = document.getElementById("admin-app");

const estado = {
  csrf: "",
  usuario: "",
  escritos: [],
  escrito: null,
};

function elemento(tag, atributos = {}, ...hijos) {
  const nodo = document.createElement(tag);
  for (const [nombre, valor] of Object.entries(atributos)) {
    if (valor === undefined || valor === null || valor === false) continue;
    if (nombre === "class") nodo.className = valor;
    else if (nombre === "text") nodo.textContent = valor;
    else if (nombre === "checked") nodo.checked = Boolean(valor);
    else nodo.setAttribute(nombre, String(valor));
  }
  for (const hijo of hijos.flat()) {
    if (hijo === undefined || hijo === null) continue;
    nodo.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
  return nodo;
}

function campo(etiqueta, control, ayuda) {
  const label = elemento("label", { class: "admin-campo" }, elemento("span", { text: etiqueta }), control);
  if (ayuda) label.append(elemento("small", { text: ayuda }));
  return label;
}

function boton(texto, clase = "boton", tipo = "button") {
  return elemento("button", { type: tipo, class: clase, text: texto });
}

function errorLegible(error) {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

async function api(ruta, opciones = {}) {
  const headers = new Headers(opciones.headers || {});
  if (opciones.body !== undefined) headers.set("Content-Type", "application/json");
  if (opciones.mutacion && estado.csrf) headers.set("X-CSRF-Token", estado.csrf);
  let respuesta;
  try {
    respuesta = await fetch(ruta, {
      method: opciones.method || "GET",
      headers,
      body: opciones.body === undefined ? undefined : JSON.stringify(opciones.body),
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new Error("No fue posible conectar con el servidor.");
  }
  const tipo = respuesta.headers.get("content-type") || "";
  const datos = tipo.includes("application/json") ? await respuesta.json() : {};
  if (!respuesta.ok) {
    if (respuesta.status === 401 && !ruta.startsWith("/api/auth/")) inicio();
    throw new Error(datos.mensaje || "El servidor no pudo completar la operación.");
  }
  return datos;
}

function aviso(contenedor, mensaje = "", tipo = "") {
  contenedor.textContent = mensaje;
  contenedor.className = `admin-aviso${tipo ? ` ${tipo}` : ""}`;
}

function pantallaCarga(texto = "Abriendo el panel privado…") {
  raiz.setAttribute("aria-busy", "true");
  raiz.replaceChildren(elemento("p", { class: "admin-cargando", text: texto }));
}

function renderLogin() {
  raiz.setAttribute("aria-busy", "false");
  const usuario = elemento("input", { name: "usuario", type: "text", required: true, autocomplete: "username", maxlength: 200 });
  const contrasena = elemento("input", { name: "contrasena", type: "password", required: true, autocomplete: "current-password", maxlength: 1024 });
  const enviar = boton("Entrar", "boton primario", "submit");
  const mensaje = elemento("p", { class: "admin-aviso", role: "status", "aria-live": "polite" });
  const formulario = elemento(
    "form",
    { class: "admin-login" },
    elemento("p", { class: "micro", text: "Administración" }),
    elemento("h1", { text: "Panel privado" }),
    elemento("p", { text: "Publica escritos y consulta la audiencia sin exponer datos identificables." }),
    campo("Usuario", usuario),
    campo("Contraseña", contrasena),
    enviar,
    mensaje,
  );
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    enviar.disabled = true;
    aviso(mensaje, "Comprobando credenciales…");
    try {
      const sesion = await api("/api/auth/entrar", {
        method: "POST",
        mutacion: true,
        body: { usuario: usuario.value, contrasena: contrasena.value },
      });
      contrasena.value = "";
      estado.csrf = sesion.csrf;
      estado.usuario = sesion.usuario;
      renderPanel();
    } catch (error) {
      aviso(mensaje, errorLegible(error), "error");
      contrasena.select();
    } finally {
      enviar.disabled = false;
    }
  });
  raiz.replaceChildren(formulario);
  usuario.focus();
}

function renderPanel() {
  raiz.setAttribute("aria-busy", "false");
  const contenido = elemento("div", { class: "admin-contenido" });
  const mensaje = elemento("p", { class: "admin-aviso", role: "status", "aria-live": "polite" });
  const articulos = boton("Escritos", "boton primario");
  const auditoria = boton("Auditoría");
  const salir = boton("Cerrar sesión");
  const cabecera = elemento(
    "header",
    { class: "admin-cabecera" },
    elemento("div", {}, elemento("p", { class: "micro", text: "Sesión protegida" }), elemento("h1", { text: "Mesa de publicación" }), elemento("p", { text: estado.usuario })),
    elemento("nav", { "aria-label": "Secciones del panel" }, articulos, auditoria, salir),
  );
  articulos.addEventListener("click", () => {
    articulos.classList.add("primario");
    auditoria.classList.remove("primario");
    cargarEscritos(contenido, mensaje);
  });
  auditoria.addEventListener("click", () => {
    auditoria.classList.add("primario");
    articulos.classList.remove("primario");
    cargarAuditoria(contenido, mensaje);
  });
  salir.addEventListener("click", async () => {
    salir.disabled = true;
    try {
      await api("/api/auth/salir", { method: "POST", mutacion: true, body: {} });
    } catch (error) {
      aviso(mensaje, errorLegible(error), "error");
    } finally {
      estado.csrf = "";
      estado.usuario = "";
      inicio();
    }
  });
  raiz.replaceChildren(cabecera, mensaje, contenido);
  cargarEscritos(contenido, mensaje);
}

function nuevoEscrito() {
  return {
    slug: "",
    sha: "",
    titulo: "",
    categoria: "Pensamientos",
    fecha: new Date().toISOString().slice(0, 10),
    resumen: "",
    etiquetas: [],
    cuerpo: "",
  };
}

function llenarFormulario(formulario, escrito) {
  for (const nombre of ["slug", "titulo", "categoria", "fecha", "resumen", "cuerpo"]) formulario.elements[nombre].value = escrito[nombre] || "";
  formulario.elements.etiquetas.value = (escrito.etiquetas || []).join(", ");
  formulario.elements.sha.value = escrito.sha || "";
  formulario.elements.slug.readOnly = Boolean(escrito.sha);
}

function construirEditor(mensaje, alGuardar) {
  const slug = elemento("input", { name: "slug", required: true, maxlength: 80, pattern: "[a-z0-9]+(?:-[a-z0-9]+)*", placeholder: "mi-nuevo-escrito" });
  const titulo = elemento("input", { name: "titulo", required: true, maxlength: 140 });
  const categoria = elemento("input", { name: "categoria", required: true, maxlength: 60, list: "admin-categorias" });
  const categorias = elemento("datalist", { id: "admin-categorias" }, ["Derecho", "Economía", "Pensamientos", "Análisis", "Tecnología"].map((valor) => elemento("option", { value: valor })));
  const fecha = elemento("input", { name: "fecha", type: "date", required: true });
  const resumen = elemento("textarea", { name: "resumen", required: true, maxlength: 320, rows: 3 });
  const etiquetas = elemento("input", { name: "etiquetas", maxlength: 500, placeholder: "economía, datos, Colombia" });
  const cuerpo = elemento("textarea", { name: "cuerpo", required: true, maxlength: 60000, rows: 22, spellcheck: true });
  const sha = elemento("input", { name: "sha", type: "hidden" });
  const guardar = boton("Guardar escrito", "boton primario", "submit");
  const formulario = elemento(
    "form",
    { class: "admin-editor" },
    elemento("h2", { text: "Editor Markdown" }),
    sha,
    campo("Slug", slug, "Minúsculas, números y guiones. Queda fijo después de guardar."),
    campo("Título", titulo),
    campo("Categoría", categoria),
    categorias,
    campo("Fecha", fecha),
    campo("Resumen", resumen, "Máximo 320 caracteres."),
    campo("Etiquetas", etiquetas, "Sepáralas con comas; máximo 12."),
    campo("Contenido", cuerpo, "Markdown seguro; no se aceptan scripts ni HTML activo."),
    guardar,
  );
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    guardar.disabled = true;
    aviso(mensaje, "Guardando en GitHub…");
    const datos = Object.fromEntries(new FormData(formulario));
    datos.etiquetas = String(datos.etiquetas).split(",").map((valor) => valor.trim()).filter(Boolean);
    if (!datos.sha) delete datos.sha;
    try {
      const resultado = await api("/api/admin/escritos", { method: "POST", mutacion: true, body: datos });
      estado.escrito = resultado.escrito;
      llenarFormulario(formulario, estado.escrito);
      guardar.textContent = "Actualizar escrito";
      aviso(mensaje, "Escrito guardado y versionado en GitHub. Aparecerá en el sitio cuando termine el despliegue de esta revisión.", "exito");
      await alGuardar();
    } catch (error) {
      aviso(mensaje, errorLegible(error), "error");
    } finally {
      guardar.disabled = false;
    }
  });
  llenarFormulario(formulario, nuevoEscrito());
  return { formulario, llenar: (escrito) => {
    estado.escrito = escrito;
    llenarFormulario(formulario, escrito);
    guardar.textContent = escrito.sha ? "Actualizar escrito" : "Guardar escrito";
  } };
}

function renderListaEscritos(lista, editor, mensaje) {
  lista.replaceChildren();
  if (!estado.escritos.length) {
    lista.append(elemento("p", { text: "Todavía no hay escritos publicados." }));
    return;
  }
  for (const escrito of estado.escritos) {
    const abrir = boton(`${escrito.titulo} · ${escrito.fecha}`, "admin-escrito");
    abrir.addEventListener("click", async () => {
      abrir.disabled = true;
      aviso(mensaje, `Abriendo «${escrito.titulo}»…`);
      try {
        const datos = await api(`/api/admin/escritos?slug=${encodeURIComponent(escrito.slug)}`);
        editor.llenar(datos.escrito);
        aviso(mensaje, "Escrito listo para editar.");
      } catch (error) {
        aviso(mensaje, errorLegible(error), "error");
      } finally {
        abrir.disabled = false;
      }
    });
    lista.append(elemento("article", { class: "admin-escrito-fila" }, abrir, elemento("small", { text: `${escrito.categoria} · ${escrito.resumen}` })));
  }
}

async function cargarEscritos(contenido, mensaje) {
  contenido.replaceChildren(elemento("p", { text: "Cargando escritos…" }));
  try {
    const datos = await api("/api/admin/escritos");
    estado.escritos = datos.escritos || [];
    const lista = elemento("div", { class: "admin-lista-escritos" });
    let editor;
    editor = construirEditor(mensaje, async () => {
      const actualizados = await api("/api/admin/escritos");
      estado.escritos = actualizados.escritos || [];
      renderListaEscritos(lista, editor, mensaje);
    });
    const nuevo = boton("Nuevo escrito");
    nuevo.addEventListener("click", () => {
      editor.llenar(nuevoEscrito());
      aviso(mensaje, "Editor limpio para un escrito nuevo.");
    });
    const biblioteca = elemento("section", { class: "admin-biblioteca" }, elemento("div", { class: "admin-seccion-titulo" }, elemento("h2", { text: "Biblioteca" }), nuevo), lista);
    renderListaEscritos(lista, editor, mensaje);
    contenido.replaceChildren(biblioteca, editor.formulario);
    aviso(mensaje, `${estado.escritos.length} escrito${estado.escritos.length === 1 ? "" : "s"} disponible${estado.escritos.length === 1 ? "" : "s"}.`);
  } catch (error) {
    contenido.replaceChildren();
    aviso(mensaje, errorLegible(error), "error");
  }
}

function entradasOrdenadas(mapa, limite = 12) {
  return Object.entries(mapa || {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es")).slice(0, limite);
}

function tablaDimension(titulo, mapa) {
  const cuerpo = elemento("tbody");
  for (const [nombre, cantidad] of entradasOrdenadas(mapa)) cuerpo.append(elemento("tr", {}, elemento("th", { scope: "row", text: nombre }), elemento("td", { text: cantidad })));
  if (!cuerpo.children.length) cuerpo.append(elemento("tr", {}, elemento("td", { colspan: 2, text: "Sin datos" })));
  return elemento("section", { class: "admin-dimension" }, elemento("h3", { text: titulo }), elemento("table", {}, cuerpo));
}

function fechaHora(valor) {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "No disponible";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(valor))) {
    return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "UTC" }).format(fecha);
  }
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(fecha);
}

function numeroLegible(valor) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(valor);
  }
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  return valor === undefined || valor === null || valor === "" ? "No disponible" : String(valor);
}

function estadoPublicacion(valor) {
  const etiquetas = {
    vista_previa_privada: "Resultado final privado",
    esperando_aprobacion: "Esperando aprobación",
    programada: "Programada",
    publicada: "Publicada",
  };
  return etiquetas[valor] || numeroLegible(valor);
}

function estadoOperativo(valor) {
  const etiquetas = {
    embargada_hasta_cierre: "Embargada hasta el cierre",
    embargada_hasta_aprobacion: "Embargada hasta aprobación",
    deshabilitado: "Deshabilitado",
    bloqueada_en_vista_previa: "Bloqueada en vista previa",
    habilitada_en_produccion: "Habilitada en producción",
    en_curso: "En curso",
    publicada: "Publicada",
    cerrada: "Cerrada",
    pendiente_documentacion: "Plazo cumplido · documentación pendiente",
  };
  return etiquetas[valor] || numeroLegible(valor);
}

function estadoRevision(valor) {
  const etiquetas = {
    aprobada: "Aprobada",
    pendiente: "Pendiente",
    creado: "Creado",
    programado: "Programado",
    publicado: "Publicado",
    requiere_autorizacion: "Requiere autorización",
    espera_aprobacion_usuario: "Espera tu aprobación",
  };
  return etiquetas[valor] || numeroLegible(valor);
}

function claseRevision(valor) {
  if (["aprobada", "creado", "publicado"].includes(valor)) return "cumple";
  if (["pendiente", "programado", "requiere_autorizacion", "espera_aprobacion_usuario"].includes(valor)) return "pendiente";
  return "neutro";
}

function direccionVistaPrevia(valor) {
  if (typeof valor !== "string" || !valor.trim()) return null;
  try {
    const url = new URL(valor);
    const anfitrionPermitido = url.hostname === window.location.hostname || url.hostname.endsWith(".vercel.app");
    return url.protocol === "https:" && anfitrionPermitido ? url.href : null;
  } catch {
    return null;
  }
}

function direccionArticuloPublico(valor) {
  if (typeof valor !== "string" || !valor.startsWith("/blog/")) return null;
  try {
    const url = new URL(valor, window.location.origin);
    return url.origin === window.location.origin && !url.search && !url.hash ? url.href : null;
  } catch {
    return null;
  }
}

function datoPublicacion(nombre, valor, clase = "") {
  return elemento(
    "div",
    { class: `admin-publicacion-dato${clase ? ` ${clase}` : ""}` },
    elemento("dt", { text: nombre }),
    elemento("dd", { text: numeroLegible(valor) }),
  );
}

function renderMetricaPublicacion(metrica) {
  const valorPrincipal = metrica.valor === null ? "TODO(dato)" : numeroLegible(metrica.valor);
  const valor = `${valorPrincipal}${metrica.unidad ? ` ${metrica.unidad}` : ""}`;
  const detalles = [];
  if (metrica.base !== undefined && metrica.base !== null && metrica.base !== "") {
    detalles.push(`Base: ${numeroLegible(metrica.base)}`);
  }
  if (metrica.umbral !== undefined && metrica.umbral !== null && metrica.umbral !== "") {
    detalles.push(`Umbral: ${numeroLegible(metrica.umbral)}`);
  }
  if (Number.isFinite(metrica.sistemasPrimariosIdentificados)) {
    detalles.push(`Actos primarios identificados: ${numeroLegible(metrica.sistemasPrimariosIdentificados)}`);
  }
  if (Number.isFinite(metrica.entradasMatrizRiesgo)) {
    detalles.push(`Entradas totales de la matriz: ${numeroLegible(metrica.entradasMatrizRiesgo)}`);
  }
  if (Object.hasOwn(metrica, "coincidenciaConInventarioRaya")) {
    detalles.push(`Coincidencia nominal con inventario atribuido: ${metrica.coincidenciaConInventarioRaya === null ? "null · TODO(dato)" : numeroLegible(metrica.coincidenciaConInventarioRaya)}`);
  }
  if (Object.hasOwn(metrica, "demandaMineraLitrosDia")) {
    detalles.push(`Demanda minera: ${metrica.demandaMineraLitrosDia === null ? "null · TODO(dato)" : `${numeroLegible(metrica.demandaMineraLitrosDia)} L/día`}`);
  }
  if (Object.hasOwn(metrica, "deficitAgregadoLitrosDia")) {
    detalles.push(`Déficit agregado: ${metrica.deficitAgregadoLitrosDia === null ? "null · TODO(dato)" : `${numeroLegible(metrica.deficitAgregadoLitrosDia)} L/día`}`);
  }
  if (metrica.nota) detalles.push(String(metrica.nota));
  const tarjetaMetrica = elemento(
    "article",
    { class: "admin-publicacion-metrica" },
    elemento("strong", { text: valor }),
    elemento("span", { text: metrica.nombre || metrica.id || "Métrica" }),
  );
  if (detalles.length) tarjetaMetrica.append(elemento("small", { text: detalles.join(" · ") }));
  if (typeof metrica.cumple === "boolean") {
    tarjetaMetrica.append(elemento("span", {
      class: `admin-estado ${metrica.cumple ? "cumple" : "pendiente"}`,
      text: metrica.cumple ? "Cumple el umbral" : "Pendiente del umbral",
    }));
  }
  return tarjetaMetrica;
}

function renderPublicacion(datos) {
  const publicacion = datos.publicacion;
  if (!publicacion || typeof publicacion !== "object") return null;

  const visibilidad = publicacion.visibilidad || {};
  const programacion = publicacion.programacion || {};
  const replica = programacion.plazoReplica || {};
  const conteo = publicacion.conteo || {};
  const metricas = Array.isArray(publicacion.metricas) ? publicacion.metricas : [];
  const compuertas = Array.isArray(publicacion.compuertas) ? publicacion.compuertas : [];
  const entregables = Array.isArray(publicacion.entregables) ? publicacion.entregables : [];
  const pruebas = publicacion.pruebas || {};
  const artefactoRevision = publicacion.artefactoRevision;
  const limites = Array.isArray(publicacion.limites) ? publicacion.limites : [];
  const urlPrevia = direccionVistaPrevia(visibilidad.url);
  const urlPublica = publicacion.estado === "publicada"
    ? direccionArticuloPublico(visibilidad.rutaPublica)
    : null;
  const idTitulo = "admin-publicacion-titulo";

  const cabecera = elemento(
    "header",
    { class: "admin-publicacion-cabecera" },
    elemento(
      "div",
      { class: "admin-publicacion-identidad" },
      elemento("p", { class: "micro", text: publicacion.estado === "publicada" ? "Publicación verificada" : "Salida en revisión" }),
      elemento("h2", { id: idTitulo, text: publicacion.titulo || "Publicación programada" }),
      elemento("p", { class: "admin-publicacion-ruta" },
        elemento("span", { text: "Ruta pública: " }),
        elemento("code", { text: visibilidad.rutaPublica || "No disponible" }),
      ),
    ),
    elemento("span", {
      class: `admin-estado publicacion ${publicacion.estado === "vista_previa_privada" ? "privada" : "programada"}`,
      text: estadoPublicacion(publicacion.estado),
    }),
  );

  const acciones = elemento("div", { class: "admin-publicacion-acciones" });
  if (urlPrevia) {
    acciones.append(elemento("a", {
      class: "boton primario admin-vista-previa",
      href: urlPrevia,
      target: "_blank",
      rel: "noopener noreferrer",
      text: "Abrir resultado final privado",
    }));
  } else if (urlPublica) {
    acciones.append(elemento("a", {
      class: "boton primario admin-vista-previa admin-articulo-publico",
      href: urlPublica,
      text: "Abrir artículo publicado",
    }));
  }
  acciones.append(elemento("p", {
    class: "admin-nota",
    text: urlPrevia
      ? "Vercel exige autenticación antes de mostrar el estudio. El resultado final no aparece en inicio, blog, temas, feed ni sitemap; dentro del sitio, este panel es el único lugar que revela el enlace. La ruta de producción seguirá cerrada hasta tu aprobación explícita."
      : urlPublica
        ? "La ruta canónica ya está en producción y conserva aquí su inventario de auditoría."
      : "La dirección privada aparece aquí únicamente dentro de un despliegue de vista previa protegido.",
  }));

  const tarjetasMetricas = elemento("div", { class: "admin-publicacion-metricas" });
  for (const metrica of metricas) tarjetasMetricas.append(renderMetricaPublicacion(metrica));
  if (!metricas.length) tarjetasMetricas.append(elemento("p", { class: "admin-vacio", text: "El registro no entregó métricas." }));

  const visibilidadDatos = elemento(
    "dl",
    { class: "admin-publicacion-datos" },
    datoPublicacion("Producción", estadoOperativo(visibilidad.produccion)),
    datoPublicacion("Vista previa", visibilidad.vistaPreviaPrivada),
    datoPublicacion("Protección", visibilidad.proteccion),
    datoPublicacion("Indexación", estadoOperativo(visibilidad.indexacion)),
  );
  const fechaProgramada = programacion.publicacion ? fechaHora(programacion.publicacion) : "Sin fecha automática";
  const replicaDatos = elemento(
    "dl",
    { class: "admin-publicacion-datos" },
    datoPublicacion("Publicación", fechaProgramada),
    datoPublicacion("Primer momento elegible", programacion.primerMomentoElegible ? fechaHora(programacion.primerMomentoElegible) : "No disponible"),
    datoPublicacion("Temporizador automático", estadoOperativo(programacion.temporizadorAutomatico)),
    datoPublicacion("Tu aprobación", estadoRevision(programacion.aprobacionUsuario)),
    datoPublicacion("Zona horaria", programacion.zonaHoraria),
    datoPublicacion("Réplica", estadoOperativo(replica.estado)),
    datoPublicacion("Fecha límite", replica.fechaLimite ? fechaHora(replica.fechaLimite) : "No disponible"),
    datoPublicacion("Sujetos consultados", replica.sujetos),
    datoPublicacion("Cuestionarios", replica.cuestionarios),
    datoPublicacion("Transacciones SMTP", replica.transaccionesSmtp),
    datoPublicacion("Canales sin evento", replica.canalesSinEvento),
    datoPublicacion("DSN de rebote", replica.dsn ?? replica.rebotes),
    datoPublicacion("Buzones con rebote", replica.buzonesConRebote),
    datoPublicacion("Respuestas", replica.respuestas),
  );
  if (replica.consultaUtc) {
    replicaDatos.append(
      datoPublicacion("Última consulta de correo", fechaHora(replica.consultaUtc)),
      datoPublicacion("Días hábiles completos", `${replica.diasHabiles} de 5`),
      datoPublicacion("Respuestas de fondo", replica.respuestasDeFondo),
      datoPublicacion("Estado documental", replica.detalle),
    );
  }
  const estados = elemento(
    "div",
    { class: "admin-publicacion-columnas" },
    elemento("section", { class: "admin-publicacion-bloque" }, elemento("h3", { text: "Visibilidad" }), visibilidadDatos),
    elemento("section", { class: "admin-publicacion-bloque" }, elemento("h3", { text: "Salida y réplica" }), replicaDatos),
  );
  const pruebaRevision = artefactoRevision && typeof artefactoRevision === "object"
    ? elemento(
        "section",
        { class: "admin-publicacion-bloque" },
        elemento("h3", { text: "Sello del resultado final" }),
        elemento(
          "dl",
          { class: "admin-publicacion-datos" },
          datoPublicacion("Estado", estadoOperativo(artefactoRevision.estado)),
          datoPublicacion("Commit aprobado", artefactoRevision.revision),
          datoPublicacion("Árbol Git", artefactoRevision.arbol),
          datoPublicacion("SHA-256 del HTML", artefactoRevision.articuloSha256),
          datoPublicacion("SHA-256 del cuerpo editorial", artefactoRevision.cuerpoSha256),
          datoPublicacion("SHA-256 del proyecto Vercel", artefactoRevision.proyectoSha256),
          datoPublicacion("Deployment revisado", artefactoRevision.deploymentHost),
          datoPublicacion("Regla", artefactoRevision.regla),
        ),
      )
    : null;

  const listaCompuertas = elemento("ol", { class: "admin-lista-control" });
  for (const compuerta of compuertas) {
    listaCompuertas.append(elemento(
      "li",
      {},
      elemento("div", {},
        elemento("strong", { text: compuerta.nombre || compuerta.id || "Comprobación" }),
        elemento("p", { text: compuerta.evidencia || "Sin evidencia registrada." }),
      ),
      elemento("span", { class: `admin-estado ${claseRevision(compuerta.estado)}`, text: estadoRevision(compuerta.estado) }),
    ));
  }
  if (!compuertas.length) listaCompuertas.append(elemento("li", {}, elemento("p", { text: "Sin compuertas registradas." })));
  const resumenCompuertas = `${numeroLegible(conteo.compuertasAprobadas)} de ${numeroLegible(conteo.compuertasTotales)} aprobadas · ${numeroLegible(conteo.compuertasPendientes)} pendientes`;

  const listaEntregables = elemento("div", { class: "admin-entregables" });
  for (const entregable of entregables) {
    listaEntregables.append(elemento(
      "article",
      {},
      elemento("div", {},
        elemento("strong", { text: entregable.nombre || entregable.id || "Entregable" }),
        elemento("p", { text: entregable.descripcion || "Sin descripción registrada." }),
      ),
      elemento("span", { class: `admin-estado ${claseRevision(entregable.estado)}`, text: estadoRevision(entregable.estado) }),
    ));
  }
  if (!entregables.length) listaEntregables.append(elemento("p", { class: "admin-vacio", text: "Sin entregables registrados." }));

  const viewportsCronometrados = Array.isArray(pruebas.viewportsCronometrados)
    ? pruebas.viewportsCronometrados.join(" · ")
    : pruebas.viewportsCronometrados;
  const comprobacionesFuncionales = Array.isArray(pruebas.comprobacionesFuncionales)
    ? pruebas.comprobacionesFuncionales.join(" · ")
    : pruebas.comprobacionesFuncionales;
  const pruebasDatos = elemento(
    "dl",
    { class: "admin-pruebas-publicacion" },
    datoPublicacion("Pruebas", `${numeroLegible(pruebas.aprobadas)} / ${numeroLegible(pruebas.total)}`),
    datoPublicacion("Render máximo", pruebas.renderMaximoMs === undefined ? undefined : `${numeroLegible(pruebas.renderMaximoMs)} ms`),
    datoPublicacion("Umbral", pruebas.umbralMs === undefined ? undefined : `${numeroLegible(pruebas.umbralMs)} ms`),
    datoPublicacion("Corridas cronometradas", pruebas.corridas),
    datoPublicacion("Pantallas cronometradas", viewportsCronometrados),
    datoPublicacion("Comprobaciones funcionales", comprobacionesFuncionales),
    datoPublicacion("Entorno de medición", pruebas.ambiente),
    datoPublicacion("Fin de la métrica", pruebas.finMetrica),
    datoPublicacion("Teselas durante auditoría", pruebas.teselasAuditoria),
    datoPublicacion("WCAG por axe-core", pruebas.axeWcag),
    datoPublicacion("Teclado y foco", pruebas.tecladoFoco),
    datoPublicacion("Sin WebGL2", pruebas.sinWebgl2),
    datoPublicacion("Sin desbordamiento", pruebas.sinDesbordamiento),
    datoPublicacion("Contraste AA", pruebas.contrasteAA),
  );

  const pie = elemento("footer", { class: "admin-publicacion-pie" });
  if (publicacion.actualizado) {
    pie.append(elemento("p", {}, "Registro actualizado: ", elemento("time", { datetime: publicacion.actualizado, text: fechaHora(publicacion.actualizado) })));
  }
  if (limites.length) {
    pie.append(
      elemento("h3", { text: "Límites declarados" }),
      elemento("ul", {}, limites.map((limite) => elemento("li", { text: String(limite) }))),
    );
  }

  return elemento(
    "section",
    { class: "admin-publicacion", "aria-labelledby": idTitulo },
    cabecera,
    acciones,
    elemento("h3", { text: "Métricas del estudio" }),
    tarjetasMetricas,
    estados,
    pruebaRevision,
    elemento("div", { class: "admin-seccion-control" },
      elemento("div", {},
        elemento("h3", { text: "Compuertas técnicas de salida" }),
        elemento("p", { text: resumenCompuertas }),
        elemento("p", { text: "Este conteo acredita integridad editorial y operativa. Los faltantes empíricos aparecen arriba y en los límites declarados." }),
      ),
    ),
    listaCompuertas,
    elemento("h3", { text: "Lo que quedó creado" }),
    listaEntregables,
    elemento("h3", { text: "Pruebas de publicación" }),
    pruebasDatos,
    pie,
  );
}

/** O(1); enlace fijo a contexto urbano, sin marcador de domicilio ni IP en URL. */
function mapaAuditoria(ubicacion) {
  if (ubicacion?.fuente !== "Vercel GeoIP" || !Number.isFinite(ubicacion.latitud) || !Number.isFinite(ubicacion.longitud)
      || Math.abs(ubicacion.latitud) > 90 || Math.abs(ubicacion.longitud) > 180) return null;
  return elemento("a", {
    class: "boton admin-mapa-enlace",
    href: `https://www.openstreetmap.org/#map=10/${ubicacion.latitud.toFixed(2)}/${ubicacion.longitud.toFixed(2)}`,
    target: "_blank", rel: "noopener noreferrer", referrerpolicy: "no-referrer",
    text: "Ver zona aproximada ↗",
    "aria-label": "Abrir en OpenStreetMap el contexto aproximado de la ciudad, con error desconocido",
  });
}

/** O(N), N ≤ 100; todo dato remoto se inserta como texto y la IP queda en panel autenticado. */
function renderAuditoria(contenido, datos) {
  const audienciaDisponible = datos.audiencia?.disponible !== false;
  const resumen = datos.resumen || {};
  const recientes = datos.recientes || [];
  const robots = resumen.porDispositivo?.Robot || 0;
  const navegadores = Math.max(0, (resumen.total || 0) - robots);
  const tarjetas = elemento(
    "div",
    { class: "admin-tarjetas" },
    tarjeta(resumen.total || 0, "Registros auditados"),
    tarjeta(navegadores, "Navegadores declarados", "No equivale a personas únicas"),
    tarjeta(robots, "Robots declarados", "Clasificación orientativa"),
    tarjeta(datos.periodoDias || 0, "Días con registro"),
  );

  /* --- Módulos ------------------------------------------------------
     Cada bloque responde una pregunta distinta: dónde están, con qué
     entran, qué leen, de dónde vienen y por qué enlace llegaron. */
  const dimensiones = elemento(
    "div",
    { class: "admin-dimensiones" },
    tablaDimension("Ciudad", resumen.porCiudad),
    tablaDimension("País", resumen.porPais),
    tablaDimension("Qué leyeron", resumen.porRuta),
    tablaDimension("De dónde vinieron", resumen.porReferente),
    tablaDimension("Enlace compartido", resumen.porCampana),
    tablaDimension("Código de enlace", resumen.porEnlace),
    tablaDimension("Equipo", resumen.porDispositivo),
    tablaDimension("Red privada o VPN", resumen.porVpn),
  );

  /* --- Ingresos recientes -------------------------------------------
     Antes eran seis columnas dentro de una caja con desplazamiento
     lateral: para leer el referente había que arrastrar la barra y se
     perdía de vista la fila. Ahora cada ingreso es una ficha con la
     información apilada, que se lee de arriba abajo y cabe igual en un
     monitor que en un teléfono. */
  const lista = elemento("div", { class: "admin-ingresos" });
  const fichas = [];
  for (const visita of recientes) {
    const etiquetas = elemento("div", { class: "admin-ingreso-etqs" });
    if (visita.dispositivo === "Robot") etiquetas.append(elemento("span", { class: "etq robot", text: "Robot" }));
    if (visita.vpn === "detectada") etiquetas.append(elemento("span", { class: "etq alerta", text: "VPN o proxy" }));
    if (visita.campana && visita.campana !== "Sin etiqueta") {
      etiquetas.append(elemento("span", { class: "etq canal", text: `via ${visita.campana}` }));
    }
    const mapa = mapaAuditoria(visita.ubicacion);
    const conexion = visita.conexion || {};
    const ipTexto = conexion.ip || (conexion.estado === "cifrado_no_configurado" ? "Cifrado pendiente de configuración" : conexion.estado === "cifrada" ? "Fuera de la ventana de consulta o clave no disponible" : "No disponible en este registro");
    const detalles = elemento("details", { class: "admin-ingreso-detalle" },
      elemento("summary", { text: "Inspeccionar rastro técnico" }),
      elemento("dl", { class: "admin-rastro" },
        elemento("dt", { text: "IP de conexión" }), elemento("dd", { text: ipTexto }),
        elemento("dt", { text: "Origen de IP" }), elemento("dd", { text: conexion.fuente || "No disponible" }),
        elemento("dt", { text: "Rastro del día" }), elemento("dd", { text: conexion.diario || "No disponible" }),
        elemento("dt", { text: "Evento" }), elemento("dd", { text: visita.id || "Registro anterior" }),
        elemento("dt", { text: "Petición Vercel" }), elemento("dd", { text: visita.peticion || "No disponible" }),
        elemento("dt", { text: "Fecha UTC" }), elemento("dd", { text: visita.hora }),
      ),
      elemento("p", { class: "admin-nota", text: "El rastro diario agrupa una conexión compartida; cambia cada día y no acredita identidad. VPN, redes móviles y proxies pueden ubicar la salida de red en otra ciudad." }),
    );
    const ficha = elemento(
      "article",
      { class: "admin-ingreso" },
      elemento("time", { class: "admin-ingreso-hora", datetime: visita.hora, text: fechaHora(visita.hora) }),
      elemento("p", { class: "admin-ingreso-ruta", text: visita.ruta }),
      elemento("p", { class: "admin-ingreso-lugar", text: `${visita.ciudad}, ${visita.pais}` }),
      elemento("p", { class: "admin-ingreso-equipo", text: `${visita.familia || visita.dispositivo} · ${visita.sistema} · ${visita.navegador}` }),
      elemento("p", { class: "admin-ingreso-ref", text: `Llegó desde: ${visita.referente}` }),
      etiquetas,
      ...(mapa ? [mapa, elemento("p", { class: "admin-nota", text: "Vercel GeoIP · escala de ciudad o región · error desconocido. El mapa no determina barrio ni dirección." })] : [elemento("p", { class: "admin-nota", text: "Mapa no disponible: este registro carece de coordenadas verificadas del proveedor." })]),
      detalles,
    );
    lista.append(ficha);
    fichas.push({ nodo: ficha, visita, texto: [visita.ruta, visita.ciudad, visita.pais, visita.referente, visita.campana, visita.enlace, conexion.ip, conexion.diario, visita.id].filter(Boolean).join(" ").toLocaleLowerCase("es") });
  }
  if (!lista.children.length) {
    lista.append(elemento("p", { class: "admin-vacio", text: "Aún no hay visitas registradas." }));
  }
  const busqueda = elemento("input", { type: "search", placeholder: "Ruta, ciudad, canal, IP o rastro…", autocomplete: "off" });
  const filtro = elemento("select", {},
    elemento("option", { value: "todas", text: "Todas las conexiones" }),
    elemento("option", { value: "mapa", text: "Con mapa aproximado" }),
    elemento("option", { value: "vpn", text: "VPN, proxy o Tor detectado" }),
    elemento("option", { value: "robot", text: "Robot declarado" }),
  );
  const conteo = elemento("p", { class: "admin-nota", role: "status", "aria-live": "polite" });
  const filtrar = () => {
    const query = busqueda.value.trim().toLocaleLowerCase("es");
    let visibles = 0;
    for (const item of fichas) {
      const cumple = (!query || item.texto.includes(query)) && (filtro.value === "todas" || (filtro.value === "mapa" && item.visita.ubicacion) || (filtro.value === "vpn" && item.visita.vpn === "detectada") || (filtro.value === "robot" && item.visita.dispositivo === "Robot"));
      item.nodo.hidden = !cumple;
      if (cumple) visibles += 1;
    }
    conteo.textContent = `${visibles} de ${fichas.length} registros recientes visibles. El resumen superior cubre todos los registros del período.`;
  };
  busqueda.addEventListener("input", filtrar);
  filtro.addEventListener("change", filtrar);
  filtrar();
  const controles = elemento("div", { class: "admin-auditoria-filtros" }, campo("Buscar en registros recientes", busqueda), campo("Filtrar conexiones", filtro));

  const vercel = elemento("a", {
    class: "boton",
    href: "https://vercel.com/sir-hegel/jhonstevenalvarezruiz/analytics",
    target: "_blank",
    rel: "noopener",
    text: "Abrir analítica agregada de Vercel",
  });

  const secciones = elemento("div", { class: "admin-auditoria-conjunto" });
  const publicacion = renderPublicacion(datos);
  if (publicacion) secciones.append(publicacion);
  const ingresos = elemento(
    "section",
    { class: "admin-auditoria" },
    elemento("h2", { text: "Auditoría de ingresos" }),
    elemento("p", { class: "admin-nota", text: datos.nota }),
  );
  if (audienciaDisponible) {
    ingresos.append(
      elemento("p", { class: "admin-nota", text: `IP cifrada en repositorio privado y consultable durante ${datos.limites?.consultaIpDias || 7} días. El historial de Git conserva copias cifradas; la ventana de consulta no las borra. La geolocalización estima la salida de red. Precisión de barrio o domicilio: no disponible.` }),
      elemento("p", { class: "admin-nota", text: datos.desde && datos.hasta ? `Período UTC: ${datos.desde} a ${datos.hasta}. Hora de las fichas: zona horaria de tu navegador.` : "Período según archivos disponibles." }),
      tarjetas,
      dimensiones,
      elemento("h3", { text: "Ingresos recientes" }),
      controles,
      conteo,
      lista,
      vercel,
    );
  } else {
    ingresos.append(elemento(
      "div",
      { class: "admin-audiencia-omitida", role: "status" },
      elemento("strong", { text: "Audiencia omitida en esta vista previa" }),
      elemento("p", { text: "El despliegue privado no recibió la credencial de analítica. Un cero aquí fingiría una medición, por eso la cuenta queda fuera." }),
    ));
  }
  secciones.append(ingresos);
  contenido.replaceChildren(secciones);
}

function tarjeta(valor, rotulo, pie = "") {
  return elemento(
    "article",
    {},
    elemento("strong", { text: String(valor) }),
    elemento("span", { text: rotulo }),
    ...(pie ? [elemento("em", { text: pie })] : []),
  );
}

async function cargarAuditoria(contenido, mensaje) {
  contenido.replaceChildren(elemento("p", { text: "Calculando los ingresos auditados…" }));
  aviso(mensaje, "Leyendo agregados privados…");
  try {
    const datos = await api("/api/admin/auditoria");
    renderAuditoria(contenido, datos);
    aviso(mensaje, "Auditoría actualizada.", "exito");
  } catch (error) {
    contenido.replaceChildren();
    aviso(mensaje, errorLegible(error), "error");
  }
}

async function inicio() {
  if (!raiz) return;
  pantallaCarga();
  try {
    const sesion = await api("/api/auth/sesion");
    estado.csrf = sesion.csrf || "";
    estado.usuario = sesion.usuario || "";
    if (sesion.autenticada) renderPanel();
    else renderLogin();
  } catch (error) {
    raiz.replaceChildren(elemento("p", { class: "admin-aviso error", text: errorLegible(error) }));
  }
}

inicio();
