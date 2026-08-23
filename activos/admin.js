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
  const guardar = boton("Publicar escrito", "boton primario", "submit");
  const formulario = elemento(
    "form",
    { class: "admin-editor" },
    elemento("h2", { text: "Editor Markdown" }),
    sha,
    campo("Slug", slug, "Minúsculas, números y guiones. Queda fijo después de publicar."),
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
      aviso(mensaje, "Escrito guardado y versionado en GitHub.", "exito");
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
    guardar.textContent = escrito.sha ? "Actualizar escrito" : "Publicar escrito";
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
  return Number.isNaN(fecha.getTime()) ? "No disponible" : new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(fecha);
}

function renderAuditoria(contenido, datos) {
  const resumen = datos.resumen || {};
  /* --- Cifras de cabecera -------------------------------------------
     Se cuentan personas aparte de robots: mezclarlos infla el total y
     hace creer que hubo audiencia donde solo pasó un indexador. */
  const recientes = datos.recientes || [];
  const robots = recientes.filter((v) => v.dispositivo === "Robot").length;
  const personas = recientes.length - robots;
  const tarjetas = elemento(
    "div",
    { class: "admin-tarjetas" },
    tarjeta(resumen.total || 0, "Ingresos auditados"),
    tarjeta(personas, "De personas", robots ? `y ${robots} de robots` : ""),
    tarjeta(Object.keys(resumen.porCiudad || {}).length, "Ciudades"),
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
  for (const visita of recientes) {
    const etiquetas = elemento("div", { class: "admin-ingreso-etqs" });
    if (visita.dispositivo === "Robot") etiquetas.append(elemento("span", { class: "etq robot", text: "Robot" }));
    if (visita.vpn === "detectada") etiquetas.append(elemento("span", { class: "etq alerta", text: "VPN o proxy" }));
    if (visita.campana && visita.campana !== "Sin etiqueta") {
      etiquetas.append(elemento("span", { class: "etq canal", text: `via ${visita.campana}` }));
    }
    lista.append(elemento(
      "article",
      { class: "admin-ingreso" },
      elemento("time", { class: "admin-ingreso-hora", text: fechaHora(visita.hora) }),
      elemento("p", { class: "admin-ingreso-ruta", text: visita.ruta }),
      elemento("p", { class: "admin-ingreso-lugar", text: `${visita.ciudad}, ${visita.pais}` }),
      elemento("p", { class: "admin-ingreso-equipo", text: `${visita.dispositivo} · ${visita.sistema} · ${visita.navegador}` }),
      elemento("p", { class: "admin-ingreso-ref", text: `Llegó desde: ${visita.referente}` }),
      etiquetas,
    ));
  }
  if (!lista.children.length) {
    lista.append(elemento("p", { class: "admin-vacio", text: "Aún no hay visitas registradas." }));
  }

  const vercel = elemento("a", {
    class: "boton",
    href: "https://vercel.com/sir-hegel/jhonstevenalvarezruiz/analytics",
    target: "_blank",
    rel: "noopener",
    text: "Abrir analítica agregada de Vercel",
  });

  contenido.replaceChildren(
    elemento("section", { class: "admin-auditoria" },
      elemento("h2", { text: "Auditoría de ingresos" }),
      elemento("p", { class: "admin-nota", text: datos.nota }),
      elemento("p", { class: "admin-nota", text: "No se guarda ninguna dirección IP: se usa un instante para deducir ciudad y tipo de red, y se descarta. Por eso aquí se ve desde dónde y con qué entraron, nunca quién es la persona." }),
      tarjetas,
      dimensiones,
      elemento("h3", { text: "Ingresos recientes" }),
      lista,
      vercel,
    ),
  );
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
