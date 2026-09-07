/* Sala roja de geometría real, sin imágenes, dependencias ni reloj propio.
   Modelo: metros, Y vertical; apertura [0,1], puntero [-1,1], avance [0,1].
   Una pasada opaca indexada: O(V + P) por cuadro y O(V + P) memoria con el
   depth buffer del contexto anfitrión. V < 12 000 esquinas; P = ancho × alto.
   Invariantes: profundidad activa, cámara fuera de objetos, telón sin saltos,
   geometría creada una sola vez; destruir() es idempotente. */

const VERTICE = `
precision highp float;
attribute vec3 posicion;
attribute vec3 normal;
attribute vec3 pigmento;
attribute vec3 superficie;
uniform mat4 camara;
uniform mediump float apertura;
uniform float tiempo;
varying mediump vec3 punto;
varying mediump vec3 orientacion;
varying mediump vec3 colorBase;
varying mediump vec2 material;
void main() {
  vec3 p = posicion;
  vec3 n = normal;
  // Cada mitad conserva el borde exterior: los pliegues se recogen, no se
  // desplaza una fotografía. Los muebles y el pasillo se desocultan detrás.
  if (superficie.z > 9.5 && superficie.z < 11.5) {
    float izquierda = 1. - step(10.5, superficie.z);
    float ancho = mix(5.8, 10.2, izquierda);
    float borde = mix(8., -8., izquierda);
    float signo = mix(-1., 1., izquierda);
    float u = clamp((p.x - borde) * signo / ancho, 0., 1.);
    p.x -= signo * apertura * 1.86 * u;
    n.x *= ancho / max(1., ancho - apertura * 1.86);
    p.z += sin(p.y * 1.8 + tiempo * .37 + u * 4.) * .018 * u;
  }
  if (superficie.z > .5 && superficie.z < 2.5) {
    float segundo = step(1.5, superficie.z);
    vec2 centro = mix(vec2(1.10, -1.10), vec2(3.75, -2.05), segundo);
    float angulo = apertura * mix(-.14, .09, segundo);
    mat2 giro = mat2(cos(angulo), -sin(angulo), sin(angulo), cos(angulo));
    p.xz = centro + giro * (p.xz - centro);
    n.xz = giro * n.xz;
  }
  punto = p;
  orientacion = n;
  colorBase = pigmento;
  material = superficie.xy;
  gl_Position = camara * vec4(p, 1.);
}`;

const FRAGMENTO = `
precision mediump float;
varying mediump vec3 punto;
varying mediump vec3 orientacion;
varying mediump vec3 colorBase;
varying mediump vec2 material;
uniform vec3 ojo;
uniform mediump float apertura;
uniform float oscuridad;
uniform float lampara;
uniform vec2 resolucion;
float sombra(vec2 p, vec2 centro, vec2 radio) {
  vec2 q = (p - centro) / radio;
  return exp(-dot(q, q) * 2.4);
}
float grano(vec3 p) {
  vec3 q = fract(p * .1031);
  q += dot(q, q.yzx + 19.19);
  return fract((q.x + q.y) * q.z);
}
void main() {
  vec3 n = normalize(orientacion);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(ojo - punto);
  vec3 alFoco = vec3(4.4, 2.68, -3.6) - punto;
  float distancia = length(alFoco);
  vec3 l = alFoco / max(distancia, .01);
  vec3 key = normalize(vec3(-.55, 1.6, 1.8));
  vec3 base = colorBase;
  float difusa = max(dot(n, l), 0.);
  float relleno = max(dot(n, key), 0.);
  float borde = pow(1. - max(dot(n, v), 0.), 3.);
  float brillo = material.y;
  if (material.x < .5) {
    // Chevron continuo sobre el plano, con transición antialias proporcional
    // a la distancia; no texturas externas ni líneas que tiemblen al fondo.
    float diente = abs(fract(punto.x / 1.28) * 2. - 1.);
    float fase = sin((punto.z / .72 + diente * .60) * 6.283185);
    float ancho = clamp(length(ojo - punto) * .018, .055, .38);
    float blanco = smoothstep(-ancho, ancho, fase);
    base = mix(vec3(.052, .047, .043), vec3(.40, .365, .32), blanco);
    float contacto = max(sombra(punto.xz, vec2(1.10, -1.1), vec2(1.05, 1.1)),
      sombra(punto.xz, vec2(3.75, -2.05), vec2(1.05, 1.1)));
    contacto = max(contacto, sombra(punto.xz, vec2(2.7, .05), vec2(.88, .75)) * .83);
    contacto = max(contacto, sombra(punto.xz, vec2(4.4, -3.6), vec2(.47, .47)) * .7);
    base *= 1. - contacto * .77;
    base *= 1. - smoothstep(.2, 7., punto.z) * .65;
    base += vec3(.085, .008, .007) * exp(-abs(punto.z + 4.8) * .30);
  } else if (material.x < 1.5) {
    // Terciopelo: cuerpo granate, crestas de pliegue y brillo rasante suave.
    float hilo = .94 + .06 * grano(punto * 65.);
    base *= hilo;
    base *= .93 + .07 * sin(punto.x * 1.73 + sin(punto.y * .6));
    base += vec3(.20, .018, .021) * borde;
  } else if (material.x < 2.5) {
    // Variación de acabado ligada al objeto: no ruido de pantalla animado.
    base *= .96 + .04 * grano(punto * 95.);
  }
  vec3 ambiente = vec3(.20, .17, .15) + vec3(.08, .017, .016) * max(n.z, 0.);
  vec3 luz = ambiente + vec3(.78, .73, .65) * relleno * .70;
  luz += vec3(1., .60, .28) * difusa * 2.5 * lampara / (1. + distancia * distancia * .15);
  vec3 h = normalize(l + v);
  float especular = pow(max(dot(n, h), 0.), mix(13., 90., brillo)) * brillo;
  float superior = pow(max(dot(n, normalize(key + v)), 0.), 48.) * brillo;
  vec3 color = base * luz + vec3(.94, .58, .27) * especular * .35 * lampara
    + vec3(.65, .66, .70) * superior * .22;
  if (material.x < .5) {
    float reflejo = exp(-pow((punto.x - 4.4) / .68, 2.) - abs(punto.z + 2.1) * .48);
    color += vec3(.075, .029, .008) * reflejo * lampara;
  }
  if (material.x > 2.5 && material.x < 3.5) {
    // La emisión cae hacia los lados del cono: se lee una pantalla circular,
    // con el foco dentro y trama de lino estable, no un trapecio plano.
    float frente = pow(max(dot(n, normalize(vec3(-.18, -.2, 1.))), 0.), .72);
    float tejido = .94 + .06 * grano(punto * 115.);
    float bombilla = .42 + frente * 1.0;
    color += base * vec3(1., .70, .38) * bombilla * tejido * (1.0 + apertura * .27) * lampara;
  } else if (material.x > 1.5 && brillo > .60) {
    color += base * (.18 + borde * .3);
  }
  if (material.x > 3.5) color = base;
  float distanciaNiebla = smoothstep(8., 24., length(ojo - punto));
  color = mix(color, vec3(.035, .013, .018), distanciaNiebla * .72);
  vec2 uv = gl_FragCoord.xy / resolucion;
  float vineta = smoothstep(.27, .82, length((uv - .5) * vec2(1., .8)));
  color *= 1. - vineta * .42;
  // Curva suave de exposición: preserva brillo de metal y sombra del tejido.
  color = vec3(1.) - exp(-max(color, vec3(0.)) * 1.5);
  color = pow(color, vec3(.88));
  color *= 1. - oscuridad;
  gl_FragColor = vec4(color, 1.);
}`;

const limitar = (n, bajo, alto) => Math.min(alto, Math.max(bajo, Number.isFinite(n) ? n : bajo));
const normalizar = (v) => { const l = Math.hypot(...v) || 1; return v.map((n) => n / l); };
const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const punto = (a, b) => a.reduce((s, n, i) => s + n * b[i], 0);

function perspectiva(aspecto, ojo, destino) {
  const z = normalizar(ojo.map((n, i) => n - destino[i]));
  const x = normalizar(cruz([0, 1, 0], z));
  const y = cruz(z, x);
  const vista = [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
    -punto(x, ojo), -punto(y, ojo), -punto(z, ojo), 1];
  const f = 1 / Math.tan((aspecto < .85 ? 53 : 46) * Math.PI / 360);
  const cerca = .12, lejos = 45;
  const proyeccion = [f / aspecto, 0, 0, 0, 0, f, 0, 0, 0, 0,
    (lejos + cerca) / (cerca - lejos), -1, 0, 0, 2 * lejos * cerca / (cerca - lejos), 0];
  const resultado = new Float32Array(16);
  for (let columna = 0; columna < 4; columna++) for (let fila = 0; fila < 4; fila++) {
    for (let k = 0; k < 4; k++) resultado[columna * 4 + fila] += proyeccion[k * 4 + fila] * vista[columna * 4 + k];
  }
  return resultado;
}

function geometria() {
  const vertices = [], indices = [];
  const GRANATE = [.31, .017, .029], CUERO = [.067, .061, .054];
  const MADERA = [.11, .054, .029], LATON = [.39, .25, .11];
  let grupo = 0;

  function vertice(p, n, c, mat = [2, .15, 0]) {
    const indice = vertices.length / 12;
    vertices.push(...p, ...n, ...c, mat[0], mat[1], mat[2] || grupo);
    return indice;
  }
  function malla(nx, ny, forma, color, mat) {
    const inicio = vertices.length / 12;
    for (let y = 0; y <= ny; y++) for (let x = 0; x <= nx; x++) {
      const [p, n] = forma(x / nx, y / ny);
      vertice(p, n, color, mat);
    }
    for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
      const a = inicio + y * (nx + 1) + x, b = a + nx + 1;
      const p = (i) => vertices.slice(i * 12, i * 12 + 3);
      const pa = p(a), pb = p(b), pc = p(a + 1);
      const producto = cruz(pb.map((n, i) => n - pa[i]), pc.map((n, i) => n - pa[i]));
      const correcta = punto(producto, vertices.slice(a * 12 + 3, a * 12 + 6)) >= 0;
      if (correcta) indices.push(a, b, a + 1, a + 1, b, b + 1);
      else indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  function transformar(p, centro, giro = 0) {
    const c = Math.cos(giro), s = Math.sin(giro);
    return [p[0] * c + p[2] * s + centro[0], p[1] + centro[1], -p[0] * s + p[2] * c + centro[2]];
  }
  function caja(centro, medidas, radio, color, brillo = .25, giro = 0, mat = 2) {
    const mitad = medidas.map((n) => n / 2);
    // Cubo redondeado por proyección sobre su núcleo: normales continuas en
    // el bisel, con caras planas para conservar la silueta de la tapicería.
    for (let eje = 0; eje < 3; eje++) for (const signo of [-1, 1]) {
      const otros = [0, 1, 2].filter((n) => n !== eje);
      malla(radio ? 3 : 1, radio ? 3 : 1, (u, v) => {
        const p = [0, 0, 0];
        p[eje] = mitad[eje] * signo;
        p[otros[0]] = (u * 2 - 1) * mitad[otros[0]];
        p[otros[1]] = (v * 2 - 1) * mitad[otros[1]];
        const nucleo = p.map((n, i) => limitar(n, -mitad[i] + radio, mitad[i] - radio));
        let n = radio ? normalizar(p.map((x, i) => x - nucleo[i])) : [0, 0, 0];
        if (!radio) n[eje] = signo;
        const q = radio ? nucleo.map((x, i) => x + n[i] * radio) : p;
        return [transformar(q, centro, giro), transformar(n, [0, 0, 0], giro)];
      }, color, [mat, brillo, 0]);
    }
  }
  function torno(centro, perfil, color, brillo = .3, mat = 2, segmentos = 24) {
    malla(segmentos, perfil.length - 1, (u, v) => {
      const i = Math.round(v * (perfil.length - 1));
      const [r, y] = perfil[i];
      const anterior = perfil[Math.max(0, i - 1)], siguiente = perfil[Math.min(perfil.length - 1, i + 1)];
      const a = u * Math.PI * 2;
      const n = normalizar([Math.cos(a) * (siguiente[1] - anterior[1]), anterior[0] - siguiente[0], Math.sin(a) * (siguiente[1] - anterior[1])]);
      return [[centro[0] + Math.cos(a) * r, centro[1] + y, centro[2] + Math.sin(a) * r], n];
    }, color, [mat, brillo, 0]);
  }
  function telon(x0, x1, z, tipo, pliegues, segmentos) {
    malla(segmentos, 5, (u, v) => {
      const fase = u * Math.PI * 2 * pliegues;
      const ondulacion = Math.cos(fase) * .135 + Math.cos(fase * 2) * .021;
      const derivada = (-Math.sin(fase) * .135 - Math.sin(fase * 2) * .042) * Math.PI * 2 * pliegues / (x1 - x0);
      const y = v * 5.7 + .035 + Math.cos(fase) * .018 * (1 - v);
      return [[x0 + u * (x1 - x0), y, z + ondulacion], normalizar([-derivada, .014, 1])];
    }, GRANATE, [1, .06, tipo]);
  }
  function sillon(x, z, giro) {
    const pieza = (c, tam, r, color = CUERO, brillo = .42) => caja(transformar(c, [x, 0, z], giro), tam, r, color, brillo, giro);
    pieza([0, .49, 0], [1.34, .19, 1.24], .065, MADERA);
    pieza([0, .68, .08], [1.13, .29, 1.12], .12);
    pieza([0, 1.13, -.43], [1.10, 1.03, .28], .12);
    pieza([-.64, .87, -.005], [.21, .37, 1.14], .087);
    pieza([.64, .87, -.005], [.21, .37, 1.14], .087);
    // Patas estrechas con casquillo latón: pequeños cambios de silueta que
    // permiten leer un sillón y su peso, no una caja flotante.
    for (const lx of [-.49, .49]) for (const lz of [-.43, .43]) {
      const c = transformar([lx, 0, lz], [x, 0, z], giro);
      torno(c, [[.04, .035], [.05, .09], [.06, .49]], MADERA, .35, 2, 8);
    }
  }

  // Piso y caja arquitectónica. La abertura deja ver las paredes del pasillo.
  malla(1, 1, (u, v) => [[-11 + u * 22, 0, 7 - v * 23], [0, 1, 0]], [.3, .3, .3], [0, .24, 0]);
  caja([-5.85, 3.0, -6.5], [12.3, 6.0, .14], 0, [.10, .008, .012], .03);
  caja([7.1, 3.0, -6.5], [6.2, 6.0, .14], 0, [.10, .008, .012], .03);
  caja([2.2, 5.4, -6.5], [3.5, 1.2, .14], 0, [.04, .006, .010], .03);
  caja([.41, 2.5, -9.5], [.12, 5, 6], 0, [.12, .07, .028], .1);
  caja([3.99, 2.5, -9.5], [.12, 5, 6], 0, [.10, .045, .016], .1);
  caja([2.2, 2.6, -12.5], [3.6, 5.2, .1], 0, [.009, .007, .009], 0);
  for (const x of [.48, 3.92]) caja([x, 2.35, -6.38], [.028, 4.7, .025], 0, [.23, .11, .042], .6, 0, 4);
  telon(-8, 2.2, -6.25, 10, 12, 48);
  telon(2.2, 8, -6.25, 11, 8, 36);
  // Bastidores de primer plano. Son independientes del fondo y producen
  // oclusión/parallax real incluso con una traslación de cámara muy acotada.
  telon(-7.7, -4.6, -.75, 0, 5, 24);
  telon(6.3, 8.8, -1.6, 0, 4, 20);
  grupo = 1; sillon(1.10, -1.10, -.20);
  grupo = 2; sillon(3.75, -2.05, -.55);
  grupo = 0;

  // Mesa tulipán, plato, taza de cerámica, superficie de café y asa abierta.
  torno([2.7, 0, .05], [[0, .025], [.36, .025], [.39, .055], [.30, .105], [.09, .18], [.058, .72], [.65, .74], [.68, .79], [.64, .83], [0, .83]], MADERA, .46, 2, 20);
  torno([2.66, .83, .05], [[0, .009], [.165, .009], [.18, .023], [.155, .033], [0, .033]], [.66, .60, .49], .50, 2, 20);
  torno([2.66, .86, .05], [[0, .01], [.095, .01], [.116, .16], [.11, .172], [.092, .159], [.086, .055]], [.75, .70, .59], .57, 2, 20);
  torno([2.66, .997, .05], [[0, 0], [.10, 0]], [.036, .018, .007], .48, 2, 20);
  malla(10, 4, (u, v) => {
    const a = u * Math.PI * 2, b = v * Math.PI * 2;
    const r = .082 + Math.cos(b) * .016;
    return [[2.785 + Math.cos(a) * r, .951 + Math.sin(a) * r, .05 + Math.sin(b) * .016],
      [Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b)]];
  }, [.67, .61, .50], [2, .5, 0]);

  // Lámpara de pie y pantalla de tejido; la luz cálida tiene su origen aquí.
  torno([4.4, 0, -3.6], [[0, .025], [.31, .025], [.31, .055], [.24, .09], [.045, .12], [.038, 2.56]], LATON, .65, 2, 16);
  torno([4.4, 2.35, -3.6], [[.57, 0], [.55, .045], [.30, .70], [.29, .73]], [.59, .42, .23], .08, 3, 28);
  torno([4.4, 3.06, -3.6], [[.29, 0], [.31, .018], [.29, .035]], LATON, .50, 2, 20);
  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
}

export function crearHabitacionRoja(gl) {
  if (!gl || gl.isContextLost() || !gl.getContextAttributes()?.depth) return null;
  let programa, buffer, elementos;
  let destruida = false;
  const shaders = [];
  try {
    for (const [tipo, codigo] of [[gl.VERTEX_SHADER, VERTICE], [gl.FRAGMENT_SHADER, FRAGMENTO]]) {
      const shader = gl.createShader(tipo);
      shaders.push(shader);
      gl.shaderSource(shader, codigo);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    }
    programa = gl.createProgram();
    shaders.forEach((shader) => gl.attachShader(programa, shader));
    gl.linkProgram(programa);
    if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(programa));
    const datos = geometria();
    if (datos.indices.length > 12000) throw new Error("La habitación excede su presupuesto geométrico");
    buffer = gl.createBuffer();
    elementos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, datos.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementos);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, datos.indices, gl.STATIC_DRAW);
    const cantidad = datos.indices.length;
    const atributos = ["posicion", "normal", "pigmento", "superficie"].map((nombre) => gl.getAttribLocation(programa, nombre));
    const uniformes = Object.fromEntries(["camara", "ojo", "apertura", "tiempo", "resolucion", "oscuridad", "lampara"].map((nombre) => [nombre, gl.getUniformLocation(programa, nombre)]));
    return {
      metricas: Object.freeze({ vertices: datos.vertices.length / 12, esquinas: cantidad, triangulos: cantidad / 3, drawCalls: 1, bytes: datos.vertices.byteLength + datos.indices.byteLength }),
      dibujar({ ancho = gl.drawingBufferWidth, alto = gl.drawingBufferHeight, tiempo = 0, x = 0, y = 0, avance = 0, apertura = 0, acercamiento = 0, oscuridad = 0, lampara = 1 } = {}) {
        if (destruida || gl.isContextLost()) return false;
        const aspecto = Math.max(1, ancho) / Math.max(1, alto);
        const movil = aspecto < .85;
        const p = limitar(apertura, 0, 1);
        const px = limitar(x, -1, 1), py = limitar(y, -1, 1);
        const recorrido = limitar(avance, 0, 1);
        const dolly = limitar(acercamiento, 0, 1);
        const cierre = limitar(oscuridad, 0, 1);
        const ojo = [movil ? 2.5 + px * .16 : -.48 + px * .30, 2.43 - py * .13, (movil ? 9.4 : 7.25) - recorrido * .38 - p * .14 - dolly * .95];
        const destino = [movil ? 2.35 : .42, 1.85, -2.2];
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(.045 * (1 - cierre), .009 * (1 - cierre), .016 * (1 - cierre), 1);
        gl.clearDepth(1);
        gl.depthMask(true);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.disable(gl.BLEND);
        gl.disable(gl.CULL_FACE);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(programa);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementos);
        atributos.forEach((ubicacion, i) => {
          gl.enableVertexAttribArray(ubicacion);
          gl.vertexAttribPointer(ubicacion, 3, gl.FLOAT, false, 48, i * 12);
        });
        gl.uniformMatrix4fv(uniformes.camara, false, perspectiva(aspecto, ojo, destino));
        gl.uniform3fv(uniformes.ojo, ojo);
        gl.uniform1f(uniformes.apertura, p);
        gl.uniform1f(uniformes.oscuridad, cierre);
        gl.uniform1f(uniformes.lampara, limitar(lampara, 0, 1));
        gl.uniform1f(uniformes.tiempo, Number.isFinite(tiempo) ? tiempo : 0);
        gl.uniform2f(uniformes.resolucion, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.drawElements(gl.TRIANGLES, cantidad, gl.UNSIGNED_SHORT, 0);
        // Se comparte el contexto: el anfitrión selecciona programa y buffer
        // al volver a su plano 2D. No quedan atributos adicionales habilitados.
        atributos.forEach((ubicacion) => gl.disableVertexAttribArray(ubicacion));
        gl.disable(gl.DEPTH_TEST);
        return true;
      },
      destruir() {
        if (destruida) return;
        destruida = true;
        if (gl.isContextLost()) return;
        gl.deleteBuffer(buffer); gl.deleteBuffer(elementos); gl.deleteProgram(programa);
      },
    };
  } catch {
    if (buffer) gl.deleteBuffer(buffer);
    if (elementos) gl.deleteBuffer(elementos);
    if (programa) gl.deleteProgram(programa);
    return null;
  } finally {
    shaders.forEach((shader) => gl.deleteShader(shader));
  }
}
