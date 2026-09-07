/* Umbral de nubes: reproyección 2.5D con tres planos recursivos y torsión UV.
   Control O(1) por cuadro; una pasada GPU O(W·H), memoria O(W·H + I), I=1.
   Invariantes: sin rAF ni temporizadores; t en segundos, progreso [0,1],
   puntero [-1,1]; textura derecha y arriba conservados en reposo; techo de
   360000 píxeles software / 700000 hardware. El controlador conserva el CSS
   de respaldo mientras dibujar devuelve false. No se registra dato de GPU. */

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
uniform float aspectoImagen;
uniform vec4 camara;
uniform vec4 atmosfera;
uniform float progreso;

vec2 girar(vec2 p, float angulo) {
  float c = cos(angulo);
  float s = sin(angulo);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

// La apertura rectangular une planos sin repetir UV ni revelar costuras.
float pared(vec2 p) {
  float rectangulo = max(abs(p.x) * 1.05, abs(p.y));
  return smoothstep(.055, .17, rectangulo);
}

vec3 nubes(vec2 p) {
  return texture2D(imagen, clamp(p + .5, .002, .998)).rgb;
}

void main() {
  vec2 q = (uv - .5) * recorte;
  q += camara.xy * (.32 + length(q));
  q /= camara.z;

  // El ángulo depende del radio: las cuatro paredes se enrollan a distinta
  // velocidad. Un giro uniforme de la fotografía no produciría este embudo.
  vec2 metrico = q * vec2(aspectoImagen, 1.);
  float radio = length(metrico);
  float torsion = camara.w * (.22 + 1.25 / (.30 + radio * 2.1));
  metrico = girar(metrico, torsion);
  q = metrico / vec2(aspectoImagen, 1.);

  // Tres encuadres anidados: el siguiente se descubre dentro del hueco del
  // anterior al avanzar. No hay modulo UV, espejo ni salto entre sectores.
  vec2 lejano = q / .1764;
  vec2 medio = q / .42;
  vec3 color = nubes(lejano) * .83;
  color *= smoothstep(.018, .080, max(abs(lejano.x), abs(lejano.y)));
  color = mix(color, nubes(medio) * .94, pared(medio));
  color = mix(color, nubes(q), pared(q));

  // Bruma y luz rasante en reposo: frecuencias lentas, sin ruido temporal,
  // destellos ni desplazamiento de la tipografía HTML colocada por delante.
  float velo = .5 + .5 * sin(q.x * 10. + q.y * 8. + atmosfera.x);
  float borde = smoothstep(.035, .20, max(abs(q.x), abs(q.y)));
  float haz = 1. - smoothstep(.025, .22, abs(q.x + q.y * .56 + atmosfera.y));
  vec3 luz = mix(vec3(.16, .25, .29), vec3(.35, .22, .11), smoothstep(-.12, .28, q.x));
  color += luz * (velo * .039 + haz * .045) * borde;

  // Unas pocas aristas tenues mantienen la lectura de corredor rectangular.
  // Se tuercen junto a las nubes; no forman una retícula que tape el material.
  float diagonal = abs(abs(q.x) - abs(q.y) * 1.45);
  float arista = 1. - smoothstep(.0008, .0035, diagonal);
  float limite = smoothstep(.06, .15, max(abs(q.x), abs(q.y)));
  color += vec3(.28, .31, .30) * arista * limite * .048;
  color *= 1. - smoothstep(.38, .80, length((uv - .5) * vec2(1., .85))) * .16;

  // Llegada al negro y apertura transparente: premultiplicación explícita
  // evita un borde oscuro residual al componer sobre la sala de destino.
  color *= 1. - smoothstep(.66, .88, progreso) * .985;
  float alpha = 1. - smoothstep(.84, 1., progreso);
  gl_FragColor = vec4(max(color, 0.) * alpha, alpha);
}`;

export function crearUmbralWebGL(lienzo, alCambiar = () => {}) {
  if (!lienzo) return null;
  let gl;
  try {
    gl = lienzo.getContext("webgl", {
      alpha: true, premultipliedAlpha: true, antialias: false,
      depth: false, stencil: false, powerPreference: "low-power",
    });
  } catch { return null; }
  if (!gl) return null;

  let programa = null;
  let buffer = null;
  let textura = null;
  let ubicaciones = null;
  let perdida = false;
  let destruida = false;
  let cargada = false;
  let presupuesto = 700000;
  let ancho = 1;
  let alto = 1;
  const imagen = new Image();
  imagen.decoding = "async";

  function liberar() {
    if (!perdida) {
      if (textura) gl.deleteTexture(textura);
      if (buffer) gl.deleteBuffer(buffer);
      if (programa) gl.deleteProgram(programa);
    }
    textura = null;
    buffer = null;
    programa = null;
    ubicaciones = null;
  }

  function compilar(tipo, codigo) {
    const shader = gl.createShader(tipo);
    if (!shader) throw new Error("Umbral no disponible");
    gl.shaderSource(shader, codigo);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      throw new Error("La GPU no admite el umbral");
    }
    return shader;
  }

  function iniciar() {
    // Detección local, efímera y acotada: nunca se envía a analítica.
    presupuesto = 700000;
    try {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      if (info && /swiftshader|llvmpipe|softpipe|software rasterizer/i.test(String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)))) presupuesto = 360000;
    } catch { /* Conserva el techo general si el navegador oculta el renderer. */ }
    let vertice;
    let fragmento;
    try {
      vertice = compilar(gl.VERTEX_SHADER, VERTICE);
      fragmento = compilar(gl.FRAGMENT_SHADER, FRAGMENTO);
      programa = gl.createProgram();
      if (!programa) throw new Error("Umbral no disponible");
      gl.attachShader(programa, vertice);
      gl.attachShader(programa, fragmento);
      gl.linkProgram(programa);
      if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) throw new Error("No se pudo abrir el umbral");
    } finally {
      if (vertice) gl.deleteShader(vertice);
      if (fragmento) gl.deleteShader(fragmento);
    }
    gl.useProgram(programa);
    buffer = gl.createBuffer();
    if (!buffer) throw new Error("Umbral no disponible");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const posicion = gl.getAttribLocation(programa, "posicion");
    gl.enableVertexAttribArray(posicion);
    gl.vertexAttribPointer(posicion, 2, gl.FLOAT, false, 0, 0);
    ubicaciones = Object.fromEntries(["imagen", "recorte", "aspectoImagen", "camara", "atmosfera", "progreso"]
      .map((nombre) => [nombre, gl.getUniformLocation(programa, nombre)]));
    gl.uniform1i(ubicaciones.imagen, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
  }

  function subirImagen() {
    if (perdida || destruida || !cargada) return;
    if (textura) gl.deleteTexture(textura);
    textura = gl.createTexture();
    if (!textura) throw new Error("Textura del umbral no disponible");
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textura);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imagen);
  }

  function medir() {
    if (destruida) return;
    ancho = Math.max(1, lienzo.clientWidth || innerWidth || 1);
    alto = Math.max(1, lienzo.clientHeight || innerHeight || 1);
    const dpr = Math.min(devicePixelRatio || 1, ancho <= 768 ? 1.25 : 1.5);
    const escala = Math.min(dpr, Math.sqrt(presupuesto / (ancho * alto)));
    const anchura = Math.max(1, Math.floor(ancho * escala));
    const altura = Math.max(1, Math.floor(alto * escala));
    if (lienzo.width !== anchura) lienzo.width = anchura;
    if (lienzo.height !== altura) lienzo.height = altura;
    if (!perdida) gl.viewport(0, 0, anchura, altura);
  }

  function dibujar({ tiempo = 0, progreso = 0, x = 0, y = 0 } = {}) {
    if (destruida || perdida || !textura || !programa) return false;
    // Entradas inválidas se reducen al caso quieto; no se propagan NaN a GPU.
    const t = Number.isFinite(tiempo) ? tiempo % 3600 : 0;
    const p = Number.isFinite(progreso) ? Math.max(0, Math.min(1, progreso)) : 0;
    const px = Number.isFinite(x) ? Math.max(-1, Math.min(1, x)) : 0;
    const py = Number.isFinite(y) ? Math.max(-1, Math.min(1, y)) : 0;
    const aspecto = imagen.naturalWidth / imagen.naturalHeight;
    const relacion = ancho / alto;
    const recorteX = aspecto > relacion ? relacion / aspecto : 1;
    const recorteY = aspecto > relacion ? 1 : aspecto / relacion;
    const avance = p * p;
    gl.useProgram(programa);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textura);
    gl.uniform2f(ubicaciones.recorte, recorteX, recorteY);
    gl.uniform1f(ubicaciones.aspectoImagen, aspecto);
    gl.uniform4f(ubicaciones.camara,
      (Math.sin(t * .25) * .006 + px * .009) * (1 - p),
      ((Math.cos(t * .21) - 1) * .003 + py * .006) * (1 - p),
      1.035 + avance * 7.4 + Math.sin(t * .22) * .012 * (1 - p),
      p * p * (3 - 2 * p) * 1.08);
    gl.uniform4f(ubicaciones.atmosfera, t * .20, Math.sin(t * .23) * .045, 0, 0);
    gl.uniform1f(ubicaciones.progreso, p);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return true;
  }

  function perder(evento) {
    evento.preventDefault();
    if (destruida) return;
    perdida = true;
    liberar(); // Los recursos del contexto perdido ya son inválidos.
    alCambiar();
  }

  function restaurar() {
    if (destruida) return;
    perdida = false;
    try { iniciar(); medir(); subirImagen(); }
    catch { liberar(); }
    alCambiar();
  }

  function destruir() {
    if (destruida) return;
    destruida = true;
    imagen.onload = null;
    imagen.onerror = null;
    imagen.removeAttribute("src");
    lienzo.removeEventListener("webglcontextlost", perder);
    lienzo.removeEventListener("webglcontextrestored", restaurar);
    liberar();
    if (!perdida) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  }

  try { iniciar(); medir(); }
  catch { destruir(); return null; }
  lienzo.addEventListener("webglcontextlost", perder, false);
  lienzo.addEventListener("webglcontextrestored", restaurar, false);
  imagen.onload = () => {
    if (destruida) return;
    cargada = imagen.naturalWidth > 0 && imagen.naturalHeight > 0;
    try { subirImagen(); }
    catch { liberar(); }
    alCambiar();
  };
  imagen.onerror = () => {
    if (!destruida) alCambiar();
  };
  imagen.src = "/activos/escenas/umbral.webp";
  return { dibujar, medir, destruir };
}
