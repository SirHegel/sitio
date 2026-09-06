/* Escenografía sobre planos con profundidad aparente. Un triángulo por cuadro:
   O(W·H) tiempo y O(W·H + I) memoria, I <= 3 imágenes. Sin rAF propio.
   Invariantes: textura sin inversión; DPR móvil <= 1.25; progreso [0,1];
   rasterización por CPU <= 360000 píxeles; la imagen CSS permanece disponible
   si falla la GPU o la carga de recursos. Texto y controles conservan su tamaño. */
const VERTICE = `
attribute vec2 posicion;
varying vec2 uv;
void main() {
  uv = vec2(posicion.x * .5 + .5, .5 - posicion.y * .5);
  gl_Position = vec4(posicion, 0., 1.);
}`;

const FRAGMENTO = `
precision mediump float;
varying vec2 uv;
uniform sampler2D imagen;
uniform vec2 recorte;
uniform vec2 origen;
uniform vec2 foco;
uniform vec2 puntero;
uniform vec2 deriva;
uniform vec4 pulso;
uniform vec2 resolucion;
uniform float tiempo;
uniform float acercamiento;
uniform float encuadre;
uniform float paso;
uniform float viajando;
uniform float escena;
float azar(vec2 p) {
  vec3 semilla = fract(vec3(p.xyx) * .1031);
  semilla += dot(semilla, semilla.yzx + 33.33);
  return fract((semilla.x + semilla.y) * semilla.z);
}
void main() {
  // Deriva de cámara y planos de profundidad; el encuadre conserva un margen.
  float suelo = smoothstep(.43, 1., uv.y);
  float lateral = uv.x - foco.x;
  lateral *= lateral;
  float profundidad = .18 + suelo * .55 + lateral * .75;
  vec2 centroCamara = mix(foco, vec2(.5, .48), encuadre);
  vec2 p = foco + (uv - centroCamara) / acercamiento;
  p += (puntero * .022 + deriva) * (.35 + profundidad * .65);
  if (escena < .5) {
    float cortina = (1. - smoothstep(.56, .73, p.y)) * smoothstep(.075, .20, abs(p.x - foco.x));
    p.x += sin(p.y * 8. + tiempo * .55) * .0014 * cortina;
  }
  vec2 imagenUV = p * recorte + origen;
  vec3 color = texture2D(imagen, clamp(imagenUV, .001, .999)).rgb;

  // Haces con barrido lento y bruma desplazada; nunca destellos o blancos plenos.
  float bruma = .5 + .5 * sin(uv.x * 7. + uv.y * 3. + tiempo * .28);
  float eje = foco.x + (uv.y - foco.y) * (.25 + pulso.x * .14) + pulso.y * .025;
  float haz = 1. - smoothstep(.016, .11 + suelo * .30, abs(uv.x - eje));
  vec3 luz = vec3(.78, .46, .25);
  if (escena > .5 && escena < 1.5) luz = vec3(.38, .49, .60);
  if (escena > 1.5) {
    luz = vec3(.85, .65, .36);
    float distanciaHaz = clamp((.64 - imagenUV.x) / .48, 0., 1.);
    float ejeProyector = .61 - distanciaHaz * .20 + pulso.x * .028 * distanciaHaz;
    haz = (1. - smoothstep(.012, .03 + distanciaHaz * .17, abs(imagenUV.y - ejeProyector)));
    haz *= smoothstep(.12, .28, imagenUV.x) * (1. - smoothstep(.63, .67, imagenUV.x));
    color += luz * haz * (.055 + (.5 + .5 * pulso.z) * .045);
  } else {
    color += luz * haz * (.025 + (.5 + .5 * pulso.z) * .03) * smoothstep(.25, .95, uv.y);
  }
  color = mix(color, luz * .44, bruma * .047 * smoothstep(.40, 1., uv.y));

  if (escena > .5 && escena < 1.5) {
    // Lluvia fina en planos diagonales; las fachadas y el suelo quedan rígidos.
    float columnas = resolucion.x < resolucion.y ? 30. : 58.;
    vec2 lluviaUV = vec2(uv.x * columnas + uv.y * 9. + tiempo * .20, uv.y * 9. - tiempo * 8.);
    float semilla = azar(vec2(floor(lluviaUV.x), 7.));
    float trazo = (1. - smoothstep(.015, .065, abs(fract(lluviaUV.x) - .5)));
    trazo *= (1. - smoothstep(.10, .40, fract(lluviaUV.y + semilla))) * step(.36, semilla);
    color += vec3(.64, .74, .83) * trazo * .13 * smoothstep(.02, .25, uv.y);
    float reflejo = (.5 + .5 * sin(uv.y * 82. + tiempo * .75)) * (.5 + .5 * pulso.z);
    color += vec3(.36, .43, .48) * reflejo * .04 * smoothstep(.62, .96, uv.y);
  } else {
    // Polvo iluminado en movimiento: coste constante, sin bucle por partícula.
    vec2 celdaUV = uv * vec2(23., 16.) + vec2(tiempo * .12, -tiempo * .44);
    vec2 celda = floor(celdaUV);
    vec2 part = fract(celdaUV) - vec2(azar(celda), azar(celda + 13.));
    float polvo = (1. - smoothstep(.010, .055, length(part))) * step(.92, azar(celda + 5.));
    color += luz * polvo * (.16 + haz * .34);
  }

  // Acercarse, atravesar el umbral y abrir el nuevo plano, sin destellos blancos.
  float cierre = smoothstep(.34, .50, paso) * (1. - smoothstep(.54, .81, paso)) * viajando;
  vec2 portal = (uv - foco) * vec2(resolucion.x / resolucion.y, 1.);
  float distancia = length(portal);
  color *= 1. - cierre * (.975 + smoothstep(.02, .8, distancia) * .02);
  float anillo = 1. - smoothstep(.005, .05, abs(distancia - (.10 + fract(paso * 2.4) * 1.25)));
  color += vec3(.20, .085, .040) * anillo * cierre * .19;
  float vineta = smoothstep(.3, 1.05, length((uv - .5) * vec2(1., .85)));
  color *= 1. - vineta * .12;
  gl_FragColor = vec4(max(color, 0.), 1.);
}`;

export function crearSalaWebGL(lienzo, alCambiar = () => {}) {
  if (!lienzo) return null;
  let gl;
  try {
    gl = lienzo.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
  } catch { return null; }
  if (!gl) return null;
  let programa, buffer, ubicaciones;
  let perdida = false;
  let destruida = false;
  let renderizadoSoftware = false;
  const imagenes = new Map();
  const texturas = new Map();
  const cargas = new Map();
  let ancho = 1;
  let alto = 1;

  function compilar(tipo, codigo) {
    const shader = gl.createShader(tipo);
    gl.shaderSource(shader, codigo);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      throw new Error("La GPU no admite la escenografía.");
    }
    return shader;
  }

  function iniciar() {
    // Consulta local O(1): adapta el coste por cuadro cuando no existe GPU real.
    // El nombre del dispositivo no se almacena, registra ni envía a servidores.
    try {
      const informacion = gl.getExtension("WEBGL_debug_renderer_info");
      renderizadoSoftware = Boolean(informacion && /swiftshader|llvmpipe|softpipe|software rasterizer/i.test(String(gl.getParameter(informacion.UNMASKED_RENDERER_WEBGL))));
    } catch { renderizadoSoftware = false; }
    const vertice = compilar(gl.VERTEX_SHADER, VERTICE);
    const fragmento = compilar(gl.FRAGMENT_SHADER, FRAGMENTO);
    programa = gl.createProgram();
    gl.attachShader(programa, vertice);
    gl.attachShader(programa, fragmento);
    gl.linkProgram(programa);
    gl.deleteShader(vertice);
    gl.deleteShader(fragmento);
    if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) throw new Error("No se pudo abrir la sala.");
    gl.useProgram(programa);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const posicion = gl.getAttribLocation(programa, "posicion");
    gl.enableVertexAttribArray(posicion);
    gl.vertexAttribPointer(posicion, 2, gl.FLOAT, false, 0, 0);
    ubicaciones = Object.fromEntries(["imagen", "recorte", "origen", "foco", "puntero", "deriva", "pulso", "resolucion", "tiempo", "acercamiento", "encuadre", "paso", "viajando", "escena"]
      .map((nombre) => [nombre, gl.getUniformLocation(programa, nombre)]));
    gl.uniform1i(ubicaciones.imagen, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
  }

  function cargarImagen(url) {
    return new Promise((resolver, rechazar) => {
      const imagen = new Image();
      imagen.decoding = "async";
      imagen.onload = () => resolver(imagen);
      imagen.onerror = () => rechazar(new Error("Escena no disponible"));
      imagen.src = url;
    });
  }

  function subirTextura(nombre, imagen) {
    if (perdida || destruida) return;
    const anterior = texturas.get(nombre);
    if (anterior) gl.deleteTexture(anterior);
    const textura = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textura);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imagen);
    texturas.set(nombre, textura);
  }

  async function preparar(nombre) {
    if (destruida || !["terciopelo", "nocturno", "celuloide"].includes(nombre)) return false;
    if (imagenes.has(nombre)) return !perdida;
    if (cargas.has(nombre)) return cargas.get(nombre);
    const carga = (async () => {
      try {
        const base = `/activos/escenas/${nombre}`;
        const imagen = ancho <= 768
          ? await cargarImagen(`${base}-movil.webp`).catch(() => cargarImagen(`${base}.webp`))
          : await cargarImagen(`${base}.webp`);
        if (destruida) return false;
        imagenes.set(nombre, imagen);
        subirTextura(nombre, imagen);
        alCambiar();
        return !perdida;
      } catch {
        alCambiar();
        return false;
      }
    })();
    cargas.set(nombre, carga);
    return carga;
  }

  function medir() {
    ancho = Math.max(1, innerWidth);
    alto = Math.max(1, innerHeight);
    const dpr = Math.min(devicePixelRatio || 1, ancho <= 768 ? 1.25 : 1.5);
    const escala = renderizadoSoftware ? Math.min(dpr, Math.sqrt(360000 / (ancho * alto))) : dpr;
    const redondear = renderizadoSoftware ? Math.floor : Math.round;
    lienzo.width = Math.max(1, redondear(ancho * escala));
    lienzo.height = Math.max(1, redondear(alto * escala));
    if (!perdida) gl.viewport(0, 0, lienzo.width, lienzo.height);
  }

  function dibujar({ escena, anterior = escena, progreso = 1, tiempo = 0, x = 0, y = 0, avance = 0, movimiento = true }) {
    if (perdida || destruida || !programa) return false;
    const nombre = progreso < .5 ? anterior : escena;
    const textura = texturas.get(nombre);
    const imagen = imagenes.get(nombre);
    if (!textura || !imagen) return false;
    const transicion = progreso < 1 && anterior !== escena;
    const entrada = Math.max(0, (progreso - .5) / .5);
    const salida = Math.min(1, Math.max(0, (progreso - .08) / .42));
    const zoom = !transicion ? 1 : progreso < .5
      ? 1 + salida * salida * salida * 11
      : 1 + Math.pow(1 - entrada, 3) * .58;
    const relacion = ancho / alto;
    const relacionImagen = imagen.naturalWidth / imagen.naturalHeight;
    const recorteX = relacionImagen > relacion ? relacion / relacionImagen : 1;
    const recorteY = relacionImagen > relacion ? 1 : relacionImagen / relacion;
    // Replica background-position: 70% center; el umbral permanece en móvil.
    const origenX = (1 - recorteX) * .70;
    const origenY = (1 - recorteY) * .5;
    const focoImagen = nombre === "terciopelo" ? .686 : nombre === "nocturno" ? .64 : .65;
    gl.useProgram(programa);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textura);
    gl.uniform2f(ubicaciones.recorte, recorteX, recorteY);
    gl.uniform2f(ubicaciones.origen, origenX, origenY);
    gl.uniform2f(ubicaciones.foco, (focoImagen - origenX) / recorteX, (.48 - origenY) / recorteY);
    gl.uniform2f(ubicaciones.puntero, movimiento ? x : 0, movimiento ? y : 0);
    // Oscilaciones O(1) por cuadro en CPU, compartidas por todos los píxeles.
    const instante = movimiento ? tiempo : 0;
    gl.uniform2f(ubicaciones.deriva, Math.sin(instante * .32) * .011, (Math.cos(instante * .27) - 1) * .0055);
    gl.uniform4f(ubicaciones.pulso, Math.sin(instante * .38), Math.cos(instante * .29), Math.sin(instante * .52), Math.sin(instante * .65));
    gl.uniform2f(ubicaciones.resolucion, ancho, alto);
    gl.uniform1f(ubicaciones.tiempo, instante);
    gl.uniform1f(ubicaciones.acercamiento, zoom * (1.075 + (movimiento ? avance * .025 + (.5 + .5 * Math.sin(instante * .27)) * .018 : 0)));
    gl.uniform1f(ubicaciones.encuadre, !transicion ? 0 : progreso < .5 ? salida * salida * (3 - 2 * salida) : Math.pow(1 - entrada, 3));
    gl.uniform1f(ubicaciones.paso, progreso);
    gl.uniform1f(ubicaciones.viajando, transicion ? 1 : 0);
    gl.uniform1f(ubicaciones.escena, ["terciopelo", "nocturno", "celuloide"].indexOf(nombre));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return true;
  }

  function perder(evento) {
    evento.preventDefault();
    perdida = true;
    texturas.clear();
    alCambiar();
  }
  function restaurar() {
    if (destruida) return;
    try {
      perdida = false;
      iniciar(); medir();
      for (const [nombre, imagen] of imagenes) subirTextura(nombre, imagen);
    } catch { perdida = true; }
    alCambiar();
  }
  try { iniciar(); medir(); } catch { return null; }
  lienzo.addEventListener("webglcontextlost", perder, false);
  lienzo.addEventListener("webglcontextrestored", restaurar, false);
  return {
    preparar, medir, dibujar,
    disponible: (nombre) => !perdida && !destruida && texturas.has(nombre),
    destruir() {
      destruida = true;
      lienzo.removeEventListener("webglcontextlost", perder);
      lienzo.removeEventListener("webglcontextrestored", restaurar);
      if (!perdida) {
        for (const textura of texturas.values()) gl.deleteTexture(textura);
        gl.deleteBuffer(buffer); gl.deleteProgram(programa);
      }
      texturas.clear(); imagenes.clear(); cargas.clear();
    },
  };
}
