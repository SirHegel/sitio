/* Laboratorio neuronal: geometrías locales, sin imágenes ni carga de modelos.
   Las membranas y redes son esquemas; no reproducen una preparación biológica.
   Construcción O(V+E); cuadro O(V+E+P), P píxeles. Recursos GPU acotados.
   Un solo contexto por visor; render no crea rAF y dispose es idempotente. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const bound = (n, fallback = 0) => Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
const v = (x, y, z) => new THREE.Vector3(x, y, z);

export async function crearModeloNeuro(canvas, { tipo = 'sinapsis' } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  let software = false;
  try {
    const gl = renderer.getContext(), info = gl.getExtension('WEBGL_debug_renderer_info');
    software = /swiftshader|llvmpipe|softpipe|software|swrast|lavapipe/i.test(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '');
  } catch {}
  renderer.setClearColor(0x110b10, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 60);
  const root = new THREE.Group();
  scene.add(root);
  const resources = new Set();
  const own = (item) => { resources.add(item); return item; };
  const geometry = (item) => own(item);
  const surface = (parameters) => own(new THREE.MeshStandardMaterial(parameters));
  const amber = surface({ color: 0xc39e69, roughness: 0.3, metalness: 0.65 });
  const ivory = surface({ color: 0xe1d4bc, roughness: 0.34, metalness: 0.23 });
  const burgundy = surface({ color: 0x732038, roughness: 0.4, metalness: 0.37 });
  const cyan = surface({ color: 0x6bacae, roughness: 0.32, metalness: 0.45 });
  const dark = surface({ color: 0x27232c, roughness: 0.41, metalness: 0.62 });
  const luminous = surface({ color: 0xfad1a0, emissive: 0xd98645, emissiveIntensity: 0.45, roughness: 0.25 });
  const add = (shape, material, parent = root) => { const mesh = new THREE.Mesh(shape, material); parent.add(mesh); return mesh; };
  const sphere = (r, detail = 16) => geometry(new THREE.SphereGeometry(r, detail, Math.max(8, detail / 2)));
  const tube = (points, radius = 0.04, segments = 28) => geometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 7, false));
  const linkShape = (start, end, radius) => {
    const shape = new THREE.CylinderGeometry(radius, radius, start.distanceTo(end), 8);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(v(0, 1, 0), end.clone().sub(start).normalize());
    shape.applyMatrix4(new THREE.Matrix4().compose(start.clone().add(end).multiplyScalar(0.5), quaternion, v(1, 1, 1)));
    return shape;
  };
  const merge = (parts, material, parent = root) => {
    const shape = geometry(mergeGeometries(parts, false));
    parts.forEach((part) => part.dispose());
    return add(shape, material, parent);
  };
  const instanced = (shape, material, count, parent = root) => {
    const mesh = own(new THREE.InstancedMesh(shape, material, count));
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    parent.add(mesh);
    return mesh;
  };
  const transform = new THREE.Object3D();
  const instance = (mesh, index, position, scale = 1) => {
    transform.position.copy(position); transform.rotation.set(0, 0, 0); transform.scale.setScalar(scale);
    transform.updateMatrix(); mesh.setMatrixAt(index, transform.matrix);
  };

  // Six painted light panels form a procedural reflection environment.
  // These are generated illumination maps, not anatomical pictures.
  const faces = Array.from({ length: 6 }, (_, index) => {
    const face = document.createElement('canvas'); face.width = face.height = 32;
    const ctx = face.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 32, 32);
    gradient.addColorStop(0, index === 3 ? '#341326' : '#d9c1a6');
    gradient.addColorStop(0.28, '#71696e'); gradient.addColorStop(0.43, '#19141d');
    gradient.addColorStop(0.7, index === 1 ? '#8e3044' : '#2b232b'); gradient.addColorStop(1, '#a58b78');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 32, 32);
    return face;
  });
  const environment = own(new THREE.CubeTexture(faces));
  environment.needsUpdate = true; environment.colorSpace = THREE.SRGBColorSpace;
  scene.environment = environment;
  scene.environmentIntensity = 0.62;
  scene.add(new THREE.HemisphereLight(0xffddba, 0x361024, 1.6));
  const key = new THREE.DirectionalLight(0xffe8ce, 3.1); key.position.set(-3, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x96cfd2, 1.3); rim.position.set(4, 1, -3); scene.add(rim);

  const base = add(geometry(new THREE.CylinderGeometry(3.7, 3.9, 0.12, 64)), dark);
  base.position.y = -2.55;
  const trim = add(geometry(new THREE.TorusGeometry(3.68, 0.012, 6, 96)), amber);
  trim.rotation.x = Math.PI / 2; trim.position.y = -2.48;
  const measures = [];
  for (let i = 0; i < 60; i++) {
    const a = TAU * i / 60, r = i % 5 === 0 ? 3.46 : 3.56;
    measures.push(v(Math.cos(a) * r, -2.476, Math.sin(a) * r), v(Math.cos(a) * 3.64, -2.476, Math.sin(a) * 3.64));
  }
  root.add(new THREE.LineSegments(geometry(new THREE.BufferGeometry().setFromPoints(measures)), own(new THREE.LineBasicMaterial({ color: 0x8d7764, transparent: true, opacity: 0.58 }))));

  function membrane(y, width = 4.8, depth = 2.5) {
    const layer = new THREE.Group(); root.add(layer);
    const slab = add(geometry(new RoundedBoxGeometry(width, 0.16, depth, 2, 0.07)), burgundy, layer); slab.position.y = y;
    const heads = instanced(sphere(0.063, 8), amber, 180, layer);
    let count = 0;
    for (let row = 0; row < 6; row++) for (let column = 0; column < 15; column++) for (const side of [-1, 1]) {
      instance(heads, count++, v((column - 7) * width / 16, y + side * 0.105, (row - 2.5) * depth / 7));
    }
    heads.instanceMatrix.needsUpdate = true;
    return layer;
  }
  let update = () => {};

  if (tipo === 'sinapsis') {
    // The rear shell is deliberately cut away so the vesicle pool remains visible.
    const shell = add(geometry(new THREE.SphereGeometry(2.22, 44, 22, Math.PI, Math.PI, 0, Math.PI * 0.52)), burgundy);
    shell.position.y = 0.15; shell.scale.y = 0.89;
    const innerShell = add(geometry(new THREE.SphereGeometry(2.17, 44, 22, Math.PI, Math.PI, 0, Math.PI * 0.52)), surface({ color: 0x957168, roughness: 0.65, metalness: 0.12, side: THREE.BackSide }));
    innerShell.position.copy(shell.position); innerShell.scale.copy(shell.scale);
    membrane(0.05, 4.4, 2.3); membrane(-1.18, 4.8, 2.7);
    const vesicleSurface = surface({ color: 0xbd9281, metalness: 0.32, roughness: 0.25, transparent: true, opacity: 0.62 });
    const vesicles = [];
    for (let i = 0; i < 13; i++) {
      const x = Math.sin(i * 2.4) * (i < 8 ? 1.45 : 0.9), y = 0.58 + (i % 3) * 0.43, z = Math.cos(i * 1.7) * 0.65;
      const group = new THREE.Group(); group.position.set(x, y, z); root.add(group);
      add(sphere(0.23, 20), vesicleSurface, group);
      const contents = instanced(sphere(0.033, 8), luminous, 9, group);
      for (let j = 0; j < 9; j++) instance(contents, j, v(Math.cos(j * 2.4) * 0.12, Math.sin(j * 1.7) * 0.12, Math.cos(j * 3.1) * 0.1));
      contents.instanceMatrix.needsUpdate = true;
      vesicles.push({ group, x, y, z });
    }
    const receptors = [];
    for (let i = 0; i < 5; i++) {
      const group = new THREE.Group(); group.position.set((i - 2) * 0.88, -1.16, 0.25); root.add(group);
      const parts = [];
      for (const sign of [-1, 1]) {
        parts.push(linkShape(v(sign * 0.09, -0.25, 0), v(sign * 0.09, 0.24, 0), 0.056));
        parts.push(linkShape(v(sign * 0.09, 0.24, 0), v(sign * 0.23, 0.47, 0), 0.055));
      }
      const material = surface({ color: 0x70aaa9, emissive: 0x245d61, emissiveIntensity: 0.12, roughness: 0.3, metalness: 0.6 });
      merge(parts, material, group); receptors.push(material);
    }
    const transmitters = instanced(sphere(0.035, 8), luminous, 84);
    update = (time, state) => {
      const release = bound(state.release, 0.4), activity = bound(state.activity, 0.55);
      for (let i = 0; i < vesicles.length; i++) {
        const item = vesicles[i];
        item.group.position.y = item.y + Math.sin(time * 0.55 + i) * 0.045;
        item.group.visible = i / vesicles.length < activity;
      }
      for (let i = 0; i < 84; i++) {
        const phase = (time * 0.24 + i / 84) % 1;
        const x = Math.sin(i * 5.71) * (0.25 + phase * 1.6);
        instance(transmitters, i, v(x, -0.12 - phase * 0.76, Math.cos(i * 2.1) * 0.7), i / 84 < release ? 0.8 + activity * 0.5 : 0.001);
      }
      transmitters.instanceMatrix.needsUpdate = true;
      receptors.forEach((material, i) => { material.emissiveIntensity = 0.12 + release * (0.3 + Math.sin(time * 1.5 + i) * 0.22); });
    };
  } else if (tipo === 'dopamina') {
    /* Computed conformer from PubChem CID 681, id 000002A900000001.
       https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/681/record/JSON?record_type=3d
       22 atoms, 22 bonds, C8H11NO2. Coordinates in Å, scaled for display.
       PubChem computational geometry (MMFF94), not an experimental structure. */
    const elements = [8,8,7,6,6,6,6,6,6,6,6,1,1,1,1,1,1,1,1,1,1,1];
    const xs = [-2.2392,-3.3557,4.4081,2.1628,0.704,2.9862,-0.0999,0.1434,-1.4642,-1.2209,-2.0247,2.5111,2.3332,2.849,2.6457,0.3315,0.7594,-1.6445,4.5468,4.7362,-3.1541,-3.5639];
    const ys = [1.9626,-0.5612,0.2624,-0.0212,-0.1603,0.1008,0.9759,-1.4267,0.8456,-1.557,-0.4208,-0.8817,0.8564,-0.7888,0.9593,1.9659,-2.3195,-2.5496,1.0868,-0.5285,1.6866,-1.5074];
    const zs = [0.0548,0.3868,0.3445,-0.6613,-0.385,0.6289,-0.2919,-0.2187,-0.0326,0.0407,0.1336,-1.2481,-1.2993,1.2541,1.2192,-0.4187,-0.2869,0.1686,-0.2388,-0.2089,0.2377,0.4721];
    const a1 = [1,1,2,2,3,3,3,4,4,4,4,5,5,6,6,7,7,8,8,9,10,10];
    const a2 = [9,21,11,22,6,19,20,5,6,12,13,7,8,14,15,9,16,10,17,11,11,18];
    const orders = [1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,2,1,2,1,1];
    const atoms = xs.map((x, i) => v((x - 0.45) * 0.62, ys[i] * 0.62 + 0.65, zs[i] * 0.62));
    const molecule = new THREE.Group(); root.add(molecule);
    const materials = { 1: ivory, 6: dark, 7: cyan, 8: burgundy };
    elements.forEach((element, index) => {
      const atom = add(sphere(element === 1 ? 0.115 : element === 6 ? 0.205 : 0.245, 24), materials[element], molecule);
      atom.position.copy(atoms[index]); atom.userData.element = element;
    });
    const bonds = [];
    a1.forEach((atom, i) => {
      const start = atoms[atom - 1], end = atoms[a2[i] - 1];
      const perpendicular = v(-(end.y - start.y), end.x - start.x, 0).normalize();
      for (let j = 0; j < orders[i]; j++) {
        const shift = perpendicular.clone().multiplyScalar((j - (orders[i] - 1) / 2) * 0.115);
        bonds.push(linkShape(start.clone().add(shift), end.clone().add(shift), 0.048));
      }
    });
    merge(bonds, amber, molecule);
    membrane(-1.72, 6.1, 1.65);
    for (const x of [-2.55, 2.55]) {
      const parts = [];
      // Twelve helices indicate a transporter; schematic topology only.
      for (let helix = 0; helix < 12; helix++) {
        const angle = helix * TAU / 12, points = [];
        for (let k = 0; k <= 32; k++) {
          const phase = k * TAU / 8;
          points.push(v(x + Math.cos(angle) * 0.3 + Math.cos(phase) * 0.045, -2.2 + k / 32 * 1.02, Math.sin(angle) * 0.3 + Math.sin(phase) * 0.045));
        }
        parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 32, 0.027, 6, false));
      }
      merge(parts, cyan);
    }
    const particles = instanced(sphere(0.027, 8), luminous, 72);
    update = (time, state) => {
      molecule.rotation.y = Math.sin(time * 0.13) * 0.15;
      const clearance = bound(state.clearance, 0.5), activity = bound(state.activity, 0.6);
      for (let i = 0; i < 72; i++) {
        const phase = (time * (0.1 + clearance * 0.22) + i / 72) % 1;
        const direction = i % 2 ? 1 : -1;
        const position = v(direction * (1.9 + phase * 0.65), -0.2 - phase * 1.9, Math.sin(i * 2.1) * (1 - phase) * 0.7);
        instance(particles, i, position, i / 72 < activity ? 1 : 0.001);
      }
      particles.instanceMatrix.needsUpdate = true;
    };
  } else {
    const count = 15, nodes = [];
    for (let i = 0; i < count; i++) {
      const angle = TAU * i / count;
      nodes.push(v(Math.cos(angle) * (i % 3 === 0 ? 1.38 : 2.35), Math.sin(angle) * 1.65 + 0.15, Math.sin(i * 2.2) * 1.1));
    }
    const excitatory = surface({ color: 0xc9a16f, emissive: 0x986026, emissiveIntensity: 0.42, metalness: 0.52, roughness: 0.3 });
    const inhibitory = surface({ color: 0x70b9bd, emissive: 0x28666f, emissiveIntensity: 0.45, metalness: 0.5, roughness: 0.29 });
    const bodies = nodes.map((position, index) => {
      const body = add(sphere(index % 4 === 0 ? 0.22 : 0.17, 20), index % 4 === 0 ? inhibitory : excitatory);
      body.position.copy(position); return body;
    });
    for (const inhibitoryType of [false, true]) {
      const branches = [];
      nodes.forEach((position, i) => {
        if ((i % 4 === 0) !== inhibitoryType) return;
        for (let branch = 0; branch < 6; branch++) {
          const angle = branch * TAU / 6 + i;
          const elbow = position.clone().add(v(Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, Math.sin(i + branch) * 0.18));
          branches.push(linkShape(position, elbow, 0.026));
          for (const sign of [-1, 1]) {
            const end = elbow.clone().add(v(Math.cos(angle + sign * 0.6) * 0.2, Math.sin(angle + sign * 0.6) * 0.2, sign * 0.1));
            branches.push(linkShape(elbow, end, 0.011));
          }
        }
      });
      merge(branches, inhibitoryType ? cyan : amber);
    }
    const paths = [], axons = [];
    for (let i = 0; i < count; i++) for (const offset of [3, 6]) {
      const a = nodes[i], b = nodes[(i + offset) % count];
      const midpoint = a.clone().add(b).multiplyScalar(0.5).add(v(0, Math.sin(i) * 0.3, 0.5));
      const path = new THREE.CatmullRomCurve3([a, midpoint, b]); paths.push(path);
      axons.push(new THREE.TubeGeometry(path, 22, 0.012, 5, false));
    }
    merge(axons, surface({ color: 0x8a717d, roughness: 0.65, metalness: 0.2, transparent: true, opacity: 0.52 }));
    const signals = instanced(sphere(0.041, 8), luminous, paths.length);
    update = (time, state) => {
      const memory = bound(state.memory, 0.58), inhibition = bound(state.inhibition, 0.45), activity = bound(state.activity, 0.6);
      excitatory.emissiveIntensity = 0.08 + activity * 0.5 + memory * 0.45;
      inhibitory.emissiveIntensity = 0.12 + inhibition * 1.1;
      bodies.forEach((body, i) => { body.scale.setScalar(0.93 + Math.sin(time * 1.5 + i * 0.7) * 0.06 * activity); });
      paths.forEach((path, i) => {
        const phase = (time * 0.22 + i / paths.length) % 1;
        instance(signals, i, path.getPoint(phase), 0.2 + memory * 0.7 + activity * 0.35);
      });
      signals.instanceMatrix.needsUpdate = true;
    };
  }

  let disposed = false, width = 1, height = 1, dpr = 1;
  const focus = v(0, -0.15, 0);
  function resize(options = {}) {
    if (disposed) return;
    width = Math.max(1, options.width || canvas.clientWidth || 640);
    height = Math.max(1, options.height || canvas.clientHeight || 480);
    const requested = Math.min(options.dpr || devicePixelRatio || 1, 1.65);
    dpr = software ? Math.min(requested, 0.65, Math.sqrt(95000 / (width * height))) : requested;
    renderer.setPixelRatio(dpr); renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
  }
  function render(state = {}) {
    if (disposed) return;
    const time = Number.isFinite(state.time) ? state.time : 0;
    const yaw = Number.isFinite(state.yaw) ? state.yaw : 0;
    const pitch = Math.max(-0.55, Math.min(0.65, Number.isFinite(state.pitch) ? state.pitch : 0));
    const zoom = Math.max(0.7, Math.min(1.6, Number.isFinite(state.zoom) ? state.zoom : 1));
    const distance = (width < 520 ? 12.9 : 10.8) / zoom;
    camera.position.set(Math.sin(yaw) * distance, 2.6 + pitch * 5, Math.cos(yaw) * distance);
    camera.lookAt(focus);
    root.rotation.y = (state.pointerX || 0) * 0.065;
    update(time, state);
    renderer.render(scene, camera);
  }
  function dispose({ loseContext = true } = {}) {
    if (disposed) return;
    disposed = true; scene.clear();
    resources.forEach((resource) => resource.dispose?.()); resources.clear();
    renderer.renderLists.dispose(); renderer.dispose();
    if (loseContext) renderer.forceContextLoss();
  }
  resize();
  return { render, resize, dispose, get stats() { return { software, dpr, width, height, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }; } };
}
