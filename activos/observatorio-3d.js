/*
 * Cámara roja — escenografía modelada, sin fotografías ni recursos remotos.
 * Todas las distancias son unidades de escena. Tres ejes, un espacio continuo.
 * Construcción O(V + P); cuadro O(V + P + W·H), memoria O(V + P + W·H).
 * V = vértices de geometría, P = partículas, W/H = resolución de dibujo.
 * Los controles normalizados se acotan; las órbitas permanecen en su esfera.
 * No crea un requestAnimationFrame: el propietario decide cuándo dibujar.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const PI = Math.PI;
const TAU = PI * 2;
const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, Number.isFinite(n) ? n : a));

export async function crearObservatorio(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  // Software rasterizers need a pixel budget before the first scene draw.
  // A missing/blocked debug extension leaves normal hardware quality intact.
  let software = false;
  try {
    const gl = renderer.getContext();
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    const device = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : '';
    software = /swiftshader|llvmpipe|softpipe|swrast|lavapipe|software|microsoft basic render|mesa offscreen/i.test(device);
  } catch { /* Browser privacy settings may deny renderer identification. */ }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.93;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.setClearColor(0x160608, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x160608);
  scene.fog = new THREE.FogExp2(0x150608, 0.033);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 65);
  const resources = new Set();
  const remember = (resource) => { resources.add(resource); return resource; };
  const material = (parameters) => remember(new THREE.MeshStandardMaterial(parameters));
  const physical = (parameters) => remember(new THREE.MeshPhysicalMaterial(parameters));
  const geometry = (shape) => remember(shape);
  const mesh = (shape, surface, parent = scene) => {
    const item = new THREE.Mesh(shape, surface);
    item.castShadow = true;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  };
  const box = (w, h, d, radius = 0.025) => geometry(new RoundedBoxGeometry(w, h, d, 2, radius));
  const cylinder = (top, bottom, height, segments = 48) => geometry(new THREE.CylinderGeometry(top, bottom, height, segments));
  const torus = (radius, tube, radial = 12, tubular = 112) => geometry(new THREE.TorusGeometry(radius, tube, radial, tubular));
  const brass = material({ color: 0x8a6a3a, metalness: 0.92, roughness: 0.26 });
  const darkMetal = material({ color: 0x181614, metalness: 0.84, roughness: 0.29 });
  const chrome = physical({ color: 0xd2d2cb, metalness: 1, roughness: 0.14, clearcoat: 0.32, clearcoatRoughness: 0.16 });
  const silverEdge = material({ color: 0xc6baa1, metalness: 0.96, roughness: 0.23 });
  const black = material({ color: 0x020203, metalness: 0, roughness: 0.82, envMapIntensity: 0 });

  // A small physical light stage baked once into a PMREM environment. Reflection
  // panels are meshes, not image maps. The temporary room is released at once.
  const environmentScene = new THREE.Scene();
  const environmentGeometry = new THREE.BoxGeometry(1, 1, 1);
  const environmentMaterials = [];
  const panel = (color, scale, position, intensity = 1) => {
    const surface = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
    surface.color.multiplyScalar(intensity);
    environmentMaterials.push(surface);
    const object = new THREE.Mesh(environmentGeometry, surface);
    object.scale.set(...scale);
    object.position.set(...position);
    environmentScene.add(object);
  };
  panel(0x180b10, [24, 16, 24], [0, 3, 0]);
  panel(0xffe7c5, [2.2, 9, 1], [-5, 3, 3], 5.5);
  panel(0xffffff, [1, 10, 4], [5, 2, -1], 4);
  panel(0xff1f25, [8, 7, 1], [0, 2, -5], 2.2);
  panel(0xffebca, [8, 1, 6], [0, 7, 0], 3.8);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(environmentScene, 0.035, 0.1, 40, { size: software ? 64 : 256 });
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.55;
  environmentGeometry.dispose();
  environmentMaterials.forEach((surface) => surface.dispose());
  pmrem.dispose();

  const hemi = new THREE.HemisphereLight(0xddd5ca, 0x29080d, 0.38);
  scene.add(hemi);
  const key = new THREE.SpotLight(0xffe4c1, 160, 25, 0.56, 0.78, 2);
  key.position.set(0.5, 7.4, 5.2);
  key.target.position.set(2.6, 1.3, -0.3);
  key.castShadow = true;
  key.shadow.mapSize.set(software ? 512 : 1024, software ? 512 : 1024);
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.035;
  key.shadow.camera.near = 0.3;
  key.shadow.camera.far = 22;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xd8dfff, 0.75);
  rim.position.set(6, 5, -3);
  scene.add(rim);
  const redWash = new THREE.PointLight(0xff172e, 12, 13, 2);
  redWash.position.set(1.6, 3.2, -3.6);
  scene.add(redWash);
  const curtainWash = new THREE.PointLight(0xe0251c, 9, 14, 2);
  curtainWash.position.set(-5, 1.2, -3.5);
  scene.add(curtainWash);

  // The chevrons are actual alternating polygon strips, with continuous joins.
  const floorBase = mesh(geometry(new THREE.PlaneGeometry(34, 34)), black);
  floorBase.rotation.x = -PI / 2;
  floorBase.position.set(0, -0.012, -3);
  floorBase.castShadow = false;
  const zigzags = [];
  const zigNormals = [];
  const addTriangle = (a, b, c) => {
    zigzags.push(...a, ...b, ...c);
    zigNormals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
  };
  for (let row = -18; row < 13; row++) {
    for (let column = -17; column < 17; column++) {
      const x1 = column * 0.98;
      const x2 = (column + 1) * 0.98;
      const z1 = row * 0.94 + (Math.abs(column % 2) ? 0.5 : 0);
      const z2 = row * 0.94 + (Math.abs((column + 1) % 2) ? 0.5 : 0);
      const a = [x1, 0, z1], b = [x2, 0, z2], c = [x2, 0, z2 + 0.47], d = [x1, 0, z1 + 0.47];
      addTriangle(a, d, b);
      addTriangle(b, d, c);
    }
  }
  const chevronGeometry = geometry(new THREE.BufferGeometry());
  chevronGeometry.setAttribute('position', new THREE.Float32BufferAttribute(zigzags, 3));
  chevronGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(zigNormals, 3));
  const ivory = material({ color: 0xaaa08b, roughness: 0.68, metalness: 0, envMapIntensity: 0.17 });
  const chevronFloor = mesh(chevronGeometry, ivory);
  chevronFloor.castShadow = false;

  const clothUniforms = { uTime: { value: 0 }, uPointer: { value: 0 }, uEnergy: { value: 0.4 } };
  const velvet = physical({ color: 0x420915, roughness: 0.93, metalness: 0, sheen: 0.48, sheenColor: 0x802134, sheenRoughness: 0.92, envMapIntensity: 0.2, side: THREE.DoubleSide });
  velvet.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, clothUniforms);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\nuniform float uTime;\nuniform float uPointer;\nuniform float uEnergy;`);
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      float hanging = clamp(1.0 - (position.y + 4.3) / 8.6, 0.0, 1.0);
      float wave = sin(position.x * 2.0 + uTime * .65 + position.y * .52);
      transformed.z += wave * .068 * hanging * uEnergy;
      transformed.x += sin(position.y * .8 + uTime * .4 + position.x) * .025 * hanging * uEnergy;
      transformed.z += exp(-pow((position.x - uPointer * 7.0) * .5, 2.0)) * .10 * hanging * uEnergy;
    `);
  };
  velvet.customProgramCacheKey = () => 'observatorio-velvet-1';
  function makeCurtain(width, x, z, rotation = 0) {
    const shape = geometry(new THREE.PlaneGeometry(width, 8.6, Math.ceil(width * 20), 28));
    const positions = shape.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const px = positions.getX(i), py = positions.getY(i);
      const bottom = 1 - (py + 4.3) / 8.6;
      const pleat = Math.sin(px * 9.5) * 0.20 + Math.sin(px * 19 + 0.35) * 0.047;
      positions.setZ(i, pleat * (0.72 + bottom * 0.32) + Math.sin(px * 0.8) * 0.055 * bottom);
      positions.setY(i, py + Math.cos(px * 9.5) * 0.024 * bottom ** 8);
    }
    shape.computeVertexNormals();
    const curtain = mesh(shape, velvet);
    curtain.position.set(x, 6.86, z);
    curtain.scale.y = 1.6;
    curtain.rotation.y = rotation;
    curtain.castShadow = false;
    return curtain;
  }
  const leftCurtain = makeCurtain(11.8, -4.42, -5.4);
  const rightCurtain = makeCurtain(11.8, 7.42, -5.4);
  makeCurtain(14, -10.3, 0.7, PI / 2);
  makeCurtain(14, 11.6, 0.7, -PI / 2);
  const rearDark = mesh(geometry(new THREE.PlaneGeometry(25, 20)), material({ color: 0x08040a, roughness: 1 }));
  rearDark.position.set(0, 9, -6.1);
  rearDark.castShadow = false;
  const curtainRail = mesh(cylinder(0.043, 0.043, 25), brass);
  curtainRail.rotation.z = PI / 2;
  curtainRail.position.set(0, 13.66, -5.15);

  // Marble is a shader pigment on a bevelled solid, generated in object space.
  const marble = physical({ color: 0xa79c88, roughness: 0.37, metalness: 0.04, clearcoat: 0.2 });
  marble.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 marblePosition;');
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nmarblePosition = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 marblePosition;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      vec3 p = marblePosition;
      float vein = sin(p.y * 9.0 + p.x * 6.0 + sin(p.z * 7.0 + p.y * 4.0) * 2.5 + sin(p.x * 17.0) * .4);
      float hairline = pow(abs(vein), 24.0);
      diffuseColor.rgb *= 1.0 - hairline * .19;
    `);
  };
  marble.customProgramCacheKey = () => 'observatorio-marble-1';
  const pedestal = new THREE.Group();
  pedestal.position.set(2.55, 0, 0.05);
  pedestal.rotation.y = -0.14;
  scene.add(pedestal);
  mesh(box(1.92, 0.14, 1.77, 0.024), marble, pedestal).position.y = 0.07;
  mesh(box(1.66, 0.12, 1.52, 0.022), marble, pedestal).position.y = 0.2;
  mesh(box(1.33, 0.74, 1.22, 0.016), marble, pedestal).position.y = 0.62;
  mesh(box(1.53, 0.1, 1.41, 0.018), marble, pedestal).position.y = 1.04;
  mesh(box(1.56, 0.032, 1.44, 0.01), brass, pedestal).position.y = 1.102;
  const plaque = mesh(box(0.38, 0.1, 0.016, 0.006), darkMetal, pedestal);
  plaque.position.set(0, 0.69, 0.622);
  // Engraving marks remain geometry at close range.
  for (let i = 0; i < 7; i++) {
    const mark = mesh(geometry(new THREE.BoxGeometry(0.008, i % 3 === 0 ? 0.033 : 0.021, 0.003)), brass, pedestal);
    mark.position.set((i - 3) * 0.027, 0.69, 0.632);
    mark.castShadow = false;
  }
  const stand = mesh(cylinder(0.12, 0.23, 0.29), darkMetal, pedestal);
  stand.position.y = 1.26;
  mesh(torus(0.226, 0.026, 8, 48), brass, pedestal).rotation.x = PI / 2;
  pedestal.children[pedestal.children.length - 1].position.y = 1.14;

  // The armillary is machined as nested gimbals, with rivets and inset tracks.
  const sculpture = new THREE.Group();
  sculpture.name = 'instrumento';
  sculpture.userData.interaction = 'instrumento';
  sculpture.position.set(2.55, 2.94, 0.05);
  scene.add(sculpture);
  const outer = new THREE.Group();
  sculpture.add(outer);
  const mainRing = mesh(torus(1.5, 0.135, 20, 160), chrome, outer);
  mainRing.userData.interaction = 'instrumento';
  const edgeFront = mesh(torus(1.5, 0.018, 8, 144), silverEdge, outer);
  edgeFront.position.z = 0.132;
  const edgeBack = mesh(torus(1.5, 0.018, 8, 144), silverEdge, outer);
  edgeBack.position.z = -0.132;
  const fineTrack = mesh(torus(1.68, 0.014, 6, 128), brass, outer);
  fineTrack.rotation.y = 0.03;
  const screws = new THREE.InstancedMesh(geometry(new THREE.SphereGeometry(0.023, 8, 5)), darkMetal, 40);
  remember(screws);
  const transform = new THREE.Object3D();
  for (let i = 0; i < 40; i++) {
    const angle = TAU * i / 40;
    transform.position.set(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0.14);
    transform.scale.set(1, 1, 0.38);
    transform.updateMatrix();
    screws.setMatrixAt(i, transform.matrix);
  }
  outer.add(screws);
  const middle = new THREE.Group();
  sculpture.add(middle);
  mesh(torus(1.19, 0.087, 16, 136), chrome, middle);
  const middleTrim = mesh(torus(1.192, 0.015, 8, 120), brass, middle);
  middleTrim.position.z = 0.087;
  const inner = new THREE.Group();
  sculpture.add(inner);
  mesh(torus(0.91, 0.058, 12, 120), silverEdge, inner);
  const orbit = mesh(torus(0.65, 0.012, 6, 96), brass, inner);
  orbit.rotation.x = 0.45;
  const spindle = mesh(cylinder(0.025, 0.025, 2.72, 12), darkMetal, outer);
  spindle.rotation.z = PI / 2;
  const coreMaterial = physical({ color: 0x9b1724, emissive: 0xd51b32, emissiveIntensity: 0.47, roughness: 0.2, metalness: 0.53, clearcoat: 1, clearcoatRoughness: 0.12 });
  const core = mesh(geometry(new THREE.IcosahedronGeometry(0.34, 4)), coreMaterial, sculpture);
  const coreLight = new THREE.PointLight(0xff243d, 3.5, 3.7, 2);
  sculpture.add(coreLight);
  const haloMaterial = remember(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uOpacity: { value: 0.16 } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec2 vUv; uniform float uOpacity; void main(){float r=length(vUv-.5)*2.;float glow=exp(-r*r*7.)*(1.-smoothstep(.3,1.,r));gl_FragColor=vec4(1.,.035,.07,glow*uOpacity);}'
  }));
  const halo = mesh(geometry(new THREE.PlaneGeometry(1.9, 1.9)), haloMaterial, sculpture);
  halo.castShadow = false;
  halo.receiveShadow = false;

  // A spherical orbit field belongs to the instrument, never a flat backdrop.
  const orbitCount = 156;
  const orbitPositions = new Float32Array(orbitCount * 3);
  const orbitSeeds = new Float32Array(orbitCount * 3);
  for (let i = 0; i < orbitCount; i++) {
    orbitSeeds[i * 3] = TAU * i / orbitCount;
    orbitSeeds[i * 3 + 1] = (i % 3) * PI / 3 + 0.35;
    orbitSeeds[i * 3 + 2] = 0.48 + (i % 7) * 0.084;
  }
  const orbitGeometry = geometry(new THREE.BufferGeometry());
  orbitGeometry.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3).setUsage(THREE.DynamicDrawUsage));
  const orbitMaterial = remember(new THREE.PointsMaterial({ color: 0xffd7a3, size: 0.022, sizeAttenuation: true, transparent: true, opacity: 0.67, depthWrite: false, blending: THREE.AdditiveBlending }));
  const orbitPoints = new THREE.Points(orbitGeometry, orbitMaterial);
  orbitPoints.frustumCulled = false;
  sculpture.add(orbitPoints);

  // Tufted club chair: a single designed object with real curved upholstery.
  const chair = new THREE.Group();
  chair.name = 'butaca';
  chair.position.set(-3.9, 0, -1.2);
  chair.rotation.y = 0.24;
  scene.add(chair);
  const leather = physical({ color: 0x1c1413, roughness: 0.73, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.66, sheen: 0.23, sheenColor: 0x463830, envMapIntensity: 0.4 });
  mesh(box(1.6, 0.32, 1.58, 0.14), leather, chair).position.set(0, 0.47, 0);
  mesh(box(1.08, 0.25, 1.1, 0.11), leather, chair).position.set(0, 0.72, 0.07);
  const back = mesh(box(1.51, 1.35, 0.34, 0.14), leather, chair);
  back.position.set(0, 1.1, -0.58);
  back.rotation.x = -0.08;
  for (const side of [-1, 1]) {
    mesh(box(0.34, 0.73, 1.44, 0.16), leather, chair).position.set(side * 0.72, 0.9, 0.04);
    for (const depth of [-0.52, 0.5]) mesh(cylinder(0.049, 0.031, 0.35, 12), brass, chair).position.set(side * 0.61, 0.18, depth);
  }
  const tuftGeometry = geometry(new THREE.SphereGeometry(0.037, 8, 6));
  for (let row = 0; row < 3; row++) for (let column = 0; column < 3; column++) {
    const tuft = mesh(tuftGeometry, darkMetal, chair);
    tuft.scale.z = 0.25;
    tuft.position.set((column - 1) * 0.32, 0.95 + row * 0.25, -0.372 - row * 0.02);
  }

  // Pleated shade, warm filament, brass stem and counterweight foot.
  const lampGroup = new THREE.Group();
  lampGroup.name = 'lampara';
  lampGroup.userData.interaction = 'lampara';
  lampGroup.position.set(5.4, 0, -2.15);
  scene.add(lampGroup);
  mesh(cylinder(0.36, 0.41, 0.11), darkMetal, lampGroup).position.y = 0.065;
  mesh(cylinder(0.26, 0.33, 0.05), brass, lampGroup).position.y = 0.145;
  mesh(cylinder(0.027, 0.034, 2.65, 20), brass, lampGroup).position.y = 1.45;
  mesh(cylinder(0.1, 0.13, 0.18, 24), darkMetal, lampGroup).position.y = 2.77;
  const shadeGeometry = geometry(new THREE.CylinderGeometry(0.36, 0.72, 0.84, 128, 1, true));
  const shadePositions = shadeGeometry.attributes.position;
  for (let i = 0; i < shadePositions.count; i++) {
    const x = shadePositions.getX(i), z = shadePositions.getZ(i);
    const angle = Math.atan2(z, x);
    const pleat = 1 + Math.cos(angle * 64) * 0.021;
    shadePositions.setX(i, x * pleat);
    shadePositions.setZ(i, z * pleat);
  }
  shadeGeometry.computeVertexNormals();
  const shadeMaterial = physical({ color: 0xd6b580, emissive: 0xffb05c, emissiveIntensity: 0.35, roughness: 0.86, side: THREE.DoubleSide, sheen: 0.4, sheenColor: 0xfedbb2 });
  const shade = mesh(shadeGeometry, shadeMaterial, lampGroup);
  shade.position.y = 3.11;
  shade.userData.interaction = 'lampara';
  shade.castShadow = false;
  for (const [radius, height] of [[0.72, 2.69], [0.36, 3.53]]) {
    const trim = mesh(torus(radius, 0.018, 8, 72), brass, lampGroup);
    trim.rotation.x = PI / 2;
    trim.position.y = height;
  }
  const bulbSurface = material({ color: 0xffddab, emissive: 0xffa34f, emissiveIntensity: 2.7, roughness: 0.2 });
  mesh(geometry(new THREE.SphereGeometry(0.09, 16, 12)), bulbSurface, lampGroup).position.y = 2.93;
  const lampLight = new THREE.PointLight(0xffad62, 30, 9, 2);
  lampLight.position.set(5.4, 2.82, -2.15);
  scene.add(lampLight);

  // Small table and cup: ceramic and coffee are separate modeled surfaces.
  const table = new THREE.Group();
  table.position.set(-2.46, 0, -0.68);
  scene.add(table);
  mesh(cylinder(0.49, 0.49, 0.055), darkMetal, table).position.y = 0.76;
  mesh(cylinder(0.033, 0.047, 0.72, 16), brass, table).position.y = 0.37;
  mesh(cylinder(0.27, 0.32, 0.045), darkMetal, table).position.y = 0.03;
  const porcelain = physical({ color: 0xded7c7, roughness: 0.19, clearcoat: 0.8 });
  mesh(cylinder(0.14, 0.14, 0.016), porcelain, table).position.set(0.06, 0.8, 0.06);
  const cupPoints = [new THREE.Vector2(0.058, 0), new THREE.Vector2(0.069, 0.025), new THREE.Vector2(0.078, 0.13), new THREE.Vector2(0.068, 0.13), new THREE.Vector2(0.059, 0.025), new THREE.Vector2(0.052, 0.012)];
  mesh(geometry(new THREE.LatheGeometry(cupPoints, 28)), porcelain, table).position.set(0.06, 0.81, 0.06);
  const handle = mesh(torus(0.038, 0.01, 8, 28), porcelain, table);
  handle.position.set(0.15, 0.875, 0.06);
  mesh(cylinder(0.066, 0.066, 0.003, 28), material({ color: 0x170906, roughness: 0.15 }), table).position.set(0.06, 0.925, 0.06);

  const dustCount = 140;
  const dustPosition = new Float32Array(dustCount * 3);
  let seed = 517;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
  for (let i = 0; i < dustCount; i++) {
    dustPosition[i * 3] = random() * 16 - 7;
    dustPosition[i * 3 + 1] = random() * 7 + 0.3;
    dustPosition[i * 3 + 2] = random() * 9 - 4;
  }
  const dustGeometry = geometry(new THREE.BufferGeometry());
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPosition, 3));
  const dustMaterial = remember(new THREE.PointsMaterial({ color: 0xeec6a1, size: 0.014, transparent: true, opacity: 0.35, depthWrite: false, sizeAttenuation: true, blending: THREE.AdditiveBlending }));
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  scene.add(dust);

  // A soft mesh glow anchors the plinth without a full-screen postprocessing pass.
  const contactMaterial = remember(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec2 vUv; void main(){float d=length((vUv-.5)*2.);float a=exp(-d*d*4.)*(1.-smoothstep(.65,1.,d));gl_FragColor=vec4(.015,.004,.008,a*.61);}'
  }));
  const contact = mesh(geometry(new THREE.PlaneGeometry(4.9, 4.5)), contactMaterial);
  contact.position.set(2.55, 0.009, 0.05);
  contact.rotation.x = -PI / 2;
  contact.castShadow = false;
  contact.receiveShadow = false;

  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const target = new THREE.Vector3();
  const desiredCamera = new THREE.Vector3();
  const state = { entry: 0, aperture: 0, lamp: 1, science: 0, x: 0, y: 0, scroll: 0 };
  let width = 1, height = 1, mobile = false, disposed = false;
  let previousTime = null, animationTime = 0, frame = 0;
  let currentDpr = 1;
  let previousSoftwareControlSignature = '';
  function resize(options = {}) {
    if (disposed) return;
    width = Math.max(1, options.width || canvas.clientWidth || window.innerWidth);
    height = Math.max(1, options.height || canvas.clientHeight || window.innerHeight);
    mobile = width < 760;
    const requestedDpr = clamp(options.dpr ?? window.devicePixelRatio ?? 1, 0.5, 2);
    // Software quality keeps the selector meaningful within explicit budgets.
    // Invariant: W·H·DPR² never exceeds the selected tier's pixel budget.
    const softwareTier = options.quality === 'alta'
      ? { pixels: 350000, desktop: 0.6, mobile: 1 }
      : options.quality === 'ahorro'
        ? { pixels: 140000, desktop: 0.35, mobile: 0.65 }
        : { pixels: 260000, desktop: 0.5, mobile: 0.85 };
    const softwareDpr = Math.min(mobile ? softwareTier.mobile : softwareTier.desktop, Math.sqrt(softwareTier.pixels / (width * height)));
    currentDpr = software ? Math.min(requestedDpr, softwareDpr) : requestedDpr;
    renderer.setPixelRatio(currentDpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = mobile ? 54 : 43;
    camera.updateProjectionMatrix();
    renderer.shadowMap.needsUpdate = true;
  }

  function render(input = {}) {
    if (disposed) return;
    const time = Number.isFinite(input.time) ? input.time : performance.now() * 0.001;
    const delta = previousTime === null ? 1 / 60 : clamp(time - previousTime, 0, 0.06);
    previousTime = time;
    const paused = Boolean(input.paused);
    if (!paused) animationTime += delta;
    const follow = paused ? 1 : 1 - Math.exp(-delta * 4.3);
    const previousAperture = state.aperture;
    const previousLamp = state.lamp;
    const previousScience = state.science;
    const previousEntry = state.entry;
    const approach = (key, value) => { state[key] += (value - state[key]) * follow; };
    approach('x', clamp(input.pointerX || 0, -1, 1));
    approach('y', clamp(input.pointerY || 0, -1, 1));
    approach('entry', clamp(input.entry ?? 0));
    approach('aperture', clamp(input.aperture ?? 0));
    approach('science', clamp(input.science ?? 0));
    approach('scroll', clamp(input.scroll ?? 0));
    approach('lamp', typeof input.lamp === 'boolean' ? Number(input.lamp) : clamp(input.lamp ?? 1));
    const t = animationTime;

    if (mobile) {
      desiredCamera.set(1.72 + state.x * 0.17, 4.5 - state.y * 0.09 + state.scroll * 0.2, 12.5 - state.entry * 0.35 - state.science * 0.25);
      target.set(1.72 + state.x * 0.025, 4.6 + state.scroll * 0.2, 0);
    } else {
      desiredCamera.set(state.x * 0.25 + state.scroll * 0.18, 2.72 - state.y * 0.12 + state.scroll * 0.42, 10.1 - state.entry * 0.58 - state.science * 0.3);
      target.set(0.13 + state.x * 0.06 + state.science * 0.15, 2.37 + state.scroll * 0.25, -0.1);
    }
    camera.position.copy(desiredCamera);
    camera.lookAt(target);
    sculpture.rotation.y = Math.sin(t * 0.13) * 0.10 + state.x * 0.18 + state.science * 0.16;
    sculpture.rotation.x = state.y * 0.045;
    outer.rotation.set(0.32 + Math.sin(t * 0.19) * 0.075, -0.3 + Math.sin(t * 0.15) * 0.14, -0.22 + state.x * 0.07);
    middle.rotation.set(1.17 + Math.sin(t * 0.16) * 0.16, 0.53 + t * 0.095, 0.21);
    inner.rotation.set(-0.58, 1.17 - t * 0.12, 0.47 + Math.sin(t * 0.13) * 0.3);
    core.rotation.set(t * 0.04, t * 0.07, 0);
    halo.quaternion.copy(camera.quaternion);
    coreMaterial.emissiveIntensity = 0.4 + Math.sin(t * 0.8) * 0.065 + state.science * 0.4;
    haloMaterial.uniforms.uOpacity.value = 0.15 + state.science * 0.12;
    clothUniforms.uTime.value = t;
    clothUniforms.uPointer.value = state.x;
    clothUniforms.uEnergy.value = 0.6 + Math.abs(state.x) * 0.6;
    leftCurtain.position.x = -4.42 - state.aperture * 1.6;
    rightCurtain.position.x = 7.42 + state.aperture * 1.6;
    lampLight.intensity = 2 + state.lamp * 28;
    shadeMaterial.emissiveIntensity = 0.035 + state.lamp * 0.32;
    bulbSurface.emissiveIntensity = 0.2 + state.lamp * 2.5;
    dust.rotation.y = Math.sin(t * 0.03) * 0.12;
    dust.position.y = Math.sin(t * 0.11) * 0.08;
    for (let i = 0; i < orbitCount; i++) {
      const j = i * 3;
      const a = orbitSeeds[j] + t * (0.13 + (i % 3) * 0.018);
      const tilt = orbitSeeds[j + 1];
      const radius = orbitSeeds[j + 2] * (1 + state.science * 0.19);
      orbitPositions[j] = Math.cos(a) * radius;
      orbitPositions[j + 1] = Math.sin(a) * radius * Math.cos(tilt);
      orbitPositions[j + 2] = Math.sin(a) * radius * Math.sin(tilt);
    }
    orbitGeometry.attributes.position.needsUpdate = true;
    orbitMaterial.opacity = 0.5 + state.science * 0.4;
    // Hardware refreshes 1024² shadows every six frames. Software keeps a 512²
    // map and refreshes only after a control crosses its midpoint (or on resize).
    // Rounded controls prevent continuously interpolated input from redrawing it.
    const staticControlChanged = paused && (state.aperture !== previousAperture || state.lamp !== previousLamp || state.science !== previousScience || state.entry !== previousEntry);
    const softwareControlSignature = `${Math.round(state.aperture)}:${Math.round(state.lamp)}:${Math.round(state.science)}`;
    const softwareControlChanged = software && softwareControlSignature !== previousSoftwareControlSignature;
    previousSoftwareControlSignature = softwareControlSignature;
    if ((!software && frame++ % 6 === 0 && !paused) || staticControlChanged || softwareControlChanged) renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
  }

  function pick(clientX, clientY) {
    if (disposed) return null;
    const rect = canvas.getBoundingClientRect();
    pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([sculpture, lampGroup], true);
    if (!hits.length) return null;
    let object = hits[0].object;
    while (object && !object.userData.interaction) object = object.parent;
    return object?.userData.interaction || null;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    scene.clear();
    resources.forEach((resource) => resource.dispose?.());
    resources.clear();
    key.shadow.dispose();
    environment.dispose();
    renderer.renderLists.dispose();
    renderer.dispose();
  }
  resize();
  render({ time: 0 });
  return {
    render, resize, dispose, pick,
    get stats() {
      return { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, width, height, dpr: currentDpr, software };
    },
  };
}
