// DESCENT visual core v2: physically based materials, chapter palettes, lighting rigs,
// holographic "scan-to-solid" materialization, glowing particles and lines.
//
// Scene contract (every shot module):
//   export const shots = { key: (p, ctx) => ({ scene, cam, update(u, t) => post? }) }
//   u ∈ [0,1) is local progress of the shot, t is local seconds.
//   post (optional): { bloom, exposure, flash, fade, vignette, grain }
// Everything must be a pure function of (u, t): no Math.random, no wall clock, no accumulated state.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export { THREE, mergeVertices };
export const W = 1920, H = 1080;
export const TAU = Math.PI * 2;

// ---------------------------------------------------------------- math
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const smoother = t => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = t => Math.pow(clamp(t), 3);
export const easeInOut = t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
// spring-ish overshoot: accelerates, overshoots slightly, settles
export const settle = t => { t = clamp(t); return 1 - Math.exp(-6 * t) * Math.cos(9 * t); };
export const range = (u, a, b) => clamp((u - a) / (b - a));
export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const col = c => new THREE.Color(c);

export function rng(seed = 1) {
  let s = seed >>> 0;
  const f = () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.range = (a, b) => a + (b - a) * f();
  f.int = (a, b) => Math.floor(f.range(a, b + 1));
  f.gauss = () => { let a = 0, b = 0; while (!a) a = f(); while (!b) b = f(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(TAU * b); };
  f.dir = () => { const z = f() * 2 - 1, a = f() * TAU, r = Math.sqrt(1 - z * z); return v3(r * Math.cos(a), r * Math.sin(a), z); };
  return f;
}

const hash3 = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const c = (a, b, d) => hash3(xi + a, yi + b, zi + d);
  return lerp(lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v), w) * 2 - 1;
}
export const fbm = (x, y, z, o = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * noise3(x * f, y * f, z * f); a *= 0.5; f *= 2; } return s; };

// displace every vertex of a geometry by fn(v: Vector3, n: Vector3) -> Vector3 (in place), then recompute normals
export function displace(geom, fn) {
  const g = geom.index ? geom : mergeVertices(geom);
  g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal, v = v3(), nn = v3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); nn.fromBufferAttribute(n, i); const r = fn(v.clone(), nn.clone(), i); p.setXYZ(i, r.x, r.y, r.z); }
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- palettes (one per chapter)
// bg: [bottom, top] gradient; key/fill/rim light colours; accent for emissive details.
export const PALETTES = {
  egg: { bg: ['#020101', '#0e0804'], key: '#ffd9a8', fill: '#2a1a0c', rim: '#ffb54a', accent: '#ffc96b', env: 0.6 },
  cosmos: { bg: ['#02030c', '#141038'], key: '#fff1d6', fill: '#1a1a4a', rim: '#8f7bff', accent: '#ffcf70', env: 0.5 },
  frost: { bg: ['#01080e', '#0d3c52'], key: '#eaf7ff', fill: '#123a50', rim: '#7fe3ff', accent: '#bff4ff', env: 0.8 },
  genesis: { bg: ['#000608', '#04282a'], key: '#c8fff4', fill: '#062a2a', rim: '#ff4fb0', accent: '#3dffd6', env: 0.6 },
  theft: { bg: ['#050100', '#200a02'], key: '#ff9a3d', fill: '#1c0a04', rim: '#ffcf70', accent: '#ff7a1a', env: 0.5 },
  marble: { bg: ['#16120d', '#5a4a36'], key: '#fff3e0', fill: '#3a2e22', rim: '#ffd590', accent: '#ffcf70', env: 1.0 },
  silicon: { bg: ['#00040c', '#062a52'], key: '#d8f0ff', fill: '#04203a', rim: '#3fa9ff', accent: '#5fd0ff', env: 0.8 },
  void: { bg: ['#000000', '#020204'], key: '#ffe2b0', fill: '#000000', rim: '#ffb050', accent: '#ffc070', env: 0.2 },
  data: { bg: ['#01040a', '#062028'], key: '#bff4ff', fill: '#04161c', rim: '#ffb030', accent: '#40e0ff', env: 0.6 },
  awake: { bg: ['#030201', '#140c05'], key: '#fff0d0', fill: '#20140a', rim: '#ffc060', accent: '#ffd27a', env: 0.7 },
};

// ---------------------------------------------------------------- environment (reflections) per palette
let _renderer = null, _pmrem = null;
const _envCache = new Map();
export function setRenderer(r) { _renderer = r; _pmrem = new THREE.PMREMGenerator(r); }
// A studio environment tinted with the palette: neutral room + coloured key and rim panels.
export function envMap(name) {
  if (_envCache.has(name)) return _envCache.get(name);
  const P = PALETTES[name];
  // dark studio: black room with a few soft boxes, so metals keep contrast
  const s = new THREE.Scene(); s.background = col('#000000');
  const panel = (c, w, h, pos, intensity) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col(c).multiplyScalar(intensity), side: THREE.DoubleSide })); m.position.copy(pos); m.lookAt(0, 0, 0); s.add(m); };
  panel(P.key, 7, 5, v3(7, 7, 6), 5);
  panel(P.key, 3, 3, v3(-2, 10, 3), 1.5);
  panel(P.rim, 2, 10, v3(-9, 1, -6), 4);
  panel(P.rim, 2, 10, v3(9, 1, -7), 1.5);
  panel(P.bg[1], 40, 40, v3(0, -14, 0), 0.8);
  const tex = _pmrem.fromScene(s, 0.03).texture;
  _envCache.set(name, tex);
  return tex;
}

// Gradient backdrop dome + optional stars.
export function backdrop(scene, name, { stars = 0, radius = 400, seed = 3 } = {}) {
  const P = PALETTES[name];
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { a: { value: col(P.bg[0]) }, b: { value: col(P.bg[1]) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 a; uniform vec3 b; varying vec3 vP; void main(){ float h = smoothstep(-0.6, 0.9, vP.y); gl_FragColor = vec4(mix(a, b, h), 1.0); }',
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), m);
  dome.renderOrder = -10; scene.add(dome);
  scene.environment = envMap(name);
  scene.environmentIntensity = P.env;
  scene.fog = new THREE.Fog(col(P.bg[0]), radius * 0.04, radius * 0.12);
  if (stars) {
    const r = rng(seed), d = new Dust(stars, { size: 1.2, sizeAttenuation: false });
    for (let i = 0; i < stars; i++) { d.setV(i, r.dir().multiplyScalar(radius * 0.9)); d.alpha[i] = Math.pow(r(), 3) * 0.9 + 0.05; d.size[i] = r.range(0.6, 2.2); d.color(i, r() < 0.8 ? col('#fff4e0') : col(P.rim)); }
    d.dirty(true); scene.add(d);
  }
  return dome;
}

// Three-point light rig in palette colours; key casts soft shadows.
export function rig(scene, name, { key = v3(5, 8, 6), keyI = 3, rimI = 4, fillI = 0.6, shadow = true, target = v3() } = {}) {
  const P = PALETTES[name];
  const k = new THREE.DirectionalLight(col(P.key), keyI); k.position.copy(key); k.target.position.copy(target);
  if (shadow) { k.castShadow = true; k.shadow.mapSize.set(1024, 1024); k.shadow.radius = 4; k.shadow.bias = -0.0005; const c = k.shadow.camera; c.left = c.bottom = -8; c.right = c.top = 8; c.near = 0.5; c.far = 40; }
  const r = new THREE.DirectionalLight(col(P.rim), rimI); r.position.set(-key.x * 1.2, key.y * 0.4, -key.z * 1.5);
  const f = new THREE.HemisphereLight(col(P.key), col(P.fill), fillI);
  scene.add(k, k.target, r, f);
  return { key: k, rim: r, fill: f };
}

// ---------------------------------------------------------------- materials
const _texCache = new Map();
export function canvasTexture(key, w, h, draw, { repeat = 1, srgb = true } = {}) {
  if (_texCache.has(key)) return _texCache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = 4;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  _texCache.set(key, t);
  return t;
}
// tileable value-noise image (grayscale), used for roughness/bump/patina
export function noiseTexture(key, { size = 512, scale = 8, octaves = 5, contrast = 1, srgb = false } = {}) {
  return canvasTexture(key, size, size, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      // tile by sampling a torus in 4D-ish via two circles
      const a = x / w * TAU, b = y / h * TAU, R = scale / TAU;
      let v = fbm(Math.cos(a) * R + 10, Math.sin(a) * R + Math.cos(b) * R, Math.sin(b) * R, octaves);
      v = clamp(0.5 + v * contrast);
      const i = (y * w + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = v * 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, { srgb });
}

export const mats = {
  gold: (o = {}) => new THREE.MeshPhysicalMaterial({ color: col('#ffc35a'), metalness: 1, roughness: 0.22, clearcoat: 0.3, clearcoatRoughness: 0.2, ...o }),
  brushedGold: (o = {}) => new THREE.MeshPhysicalMaterial({ color: col('#e8b04a'), metalness: 1, roughness: 0.38, roughnessMap: noiseTexture('rough-fine', { scale: 40, contrast: 1.5 }), ...o }),
  chrome: (o = {}) => new THREE.MeshPhysicalMaterial({ color: col('#e6e8ea'), metalness: 1, roughness: 0.08, ...o }),
  iron: (o = {}) => new THREE.MeshStandardMaterial({ color: col('#5a5550'), metalness: 0.85, roughness: 0.55, roughnessMap: noiseTexture('rough-mid', { scale: 12, contrast: 1.4 }), bumpMap: noiseTexture('bump-rock', { scale: 16, contrast: 1.6 }), bumpScale: 2, ...o }),
  bronze: (o = {}) => {
    const patina = canvasTexture('patina', 512, 512, (g, w, h) => {
      const img = g.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const a = x / w * TAU, b = y / h * TAU, R = 6 / TAU;
        const n = fbm(Math.cos(a) * R + 3, Math.sin(a) * R + Math.cos(b) * R, Math.sin(b) * R, 5);
        const k = smooth((n + 0.1) * 2.2); // 0 = bare bronze, 1 = verdigris
        const i = (y * w + x) * 4;
        img.data[i] = lerp(150, 70, k); img.data[i + 1] = lerp(95, 140, k); img.data[i + 2] = lerp(45, 110, k); img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    });
    return new THREE.MeshStandardMaterial({ map: patina, metalness: 0.75, roughness: 0.5, roughnessMap: noiseTexture('rough-mid', { scale: 12, contrast: 1.4 }), ...o });
  },
  marble: (o = {}) => {
    const veins = canvasTexture('marble', 1024, 1024, (g, w, h) => {
      const img = g.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const a = x / w * TAU, b = y / h * TAU, R = 3 / TAU;
        const n = fbm(Math.cos(a) * R, Math.sin(a) * R + Math.cos(b) * R, Math.sin(b) * R, 6);
        const v = Math.abs(Math.sin((x / w * 6 + n * 5) * Math.PI));
        const k = Math.pow(v, 0.25);
        const i = (y * w + x) * 4;
        img.data[i] = lerp(150, 238, k); img.data[i + 1] = lerp(140, 232, k); img.data[i + 2] = lerp(130, 222, k); img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    });
    return new THREE.MeshPhysicalMaterial({ map: veins, roughness: 0.32, clearcoat: 0.4, clearcoatRoughness: 0.3, sheen: 0.3, ...o });
  },
  stone: (color = '#8a7a66', o = {}) => new THREE.MeshStandardMaterial({ color: col(color), roughness: 0.9, bumpMap: noiseTexture('bump-rock', { scale: 16, contrast: 1.6 }), bumpScale: 3, ...o }),
  ice: (o = {}) => new THREE.MeshPhysicalMaterial({ color: col('#cdefff'), roughness: 0.12, metalness: 0, transmission: 0.6, thickness: 1.5, ior: 1.31, clearcoat: 1, clearcoatRoughness: 0.05, attenuationColor: col('#4fb6d8'), attenuationDistance: 2.5, bumpMap: noiseTexture('bump-ice', { scale: 6, contrast: 1.2 }), bumpScale: 1.5, ...o }),
  glass: (color = '#ffffff', o = {}) => new THREE.MeshPhysicalMaterial({ color: col(color), roughness: 0.05, transmission: 0.9, thickness: 0.5, ior: 1.5, clearcoat: 1, ...o }),
  organic: (color, o = {}) => new THREE.MeshPhysicalMaterial({ color: col(color), roughness: 0.45, sheen: 1, sheenColor: col(color).lerp(col('#ffffff'), 0.4), sheenRoughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.35, ...o }),
  plastic: (color, o = {}) => new THREE.MeshPhysicalMaterial({ color: col(color), roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.1, ...o }),
  glow: (color, intensity = 3, o = {}) => new THREE.MeshBasicMaterial({ color: col(color).multiplyScalar(intensity), ...o }),
};

// ---------------------------------------------------------------- holographic scan-to-solid
// Reveals `mesh` along `axis` (world space): p=0 nothing, p=1 fully solid. Above the scan line a
// thin gold wireframe "hologram" of the same geometry is visible; at the line there is a hot band.
export function materialize(mesh, { axis = v3(0, 1, 0), color = '#ffcf70', wire = true, band = 0.08, wireGeometry = null } = {}) {
  const box = new THREE.Box3().setFromObject(mesh);
  const lo = box.min.dot(axis), hi = box.max.dot(axis);
  const uni = { uLevel: { value: lo - 1 }, uAxis: { value: axis.clone().normalize() }, uBand: { value: band * (hi - lo) }, uBandColor: { value: col(color).multiplyScalar(6) }, uWire: { value: 1 } };
  const patch = m => {
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, uni);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed,1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos; uniform float uLevel; uniform vec3 uAxis; uniform float uBand; uniform vec3 uBandColor;')
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nfloat hd = dot(vWPos, uAxis) - uLevel; if (hd > 0.0) discard;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uBandColor * smoothstep(-uBand, 0.0, hd);');
    };
    m.needsUpdate = true;
  };
  const wires = [];
  mesh.traverse(o => {
    if (!o.isMesh) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(patch);
    if (wire) {
      const wm = new THREE.ShaderMaterial({
        uniforms: uni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: 'varying vec3 vWPos; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vWPos = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: 'varying vec3 vWPos; uniform float uLevel; uniform vec3 uAxis; uniform float uBand; uniform vec3 uBandColor; uniform float uWire; void main(){ float hd = dot(vWPos, uAxis) - uLevel; if (hd < 0.0) discard; float a = (0.25 + 0.75 * exp(-hd / (uBand * 4.0))) * uWire; gl_FragColor = vec4(uBandColor * 0.06, a); }',
      });
      const w = new THREE.LineSegments(new THREE.WireframeGeometry(wireGeometry || o.geometry), wm);
      o.add(w); wires.push(w);
    }
  });
  return {
    set(p, wireOpacity = 1) { uni.uWire.value = wireOpacity; uni.uLevel.value = lerp(lo - (hi - lo) * 0.02, hi + uni.uBand.value * 2, clamp(p)); wires.forEach(w => { w.visible = p < 1; }); },
    get uniforms() { return uni; },
  };
}

// ---------------------------------------------------------------- glowing particles (HDR, additive)
const dustVS = `
attribute float aAlpha; attribute float aSize; attribute vec3 aColor;
uniform float uSize; uniform float uScale; uniform float uAtt;
varying float vA; varying vec3 vC;
void main(){
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  float px = uAtt > 0.5 ? uSize * aSize * uScale / max(0.001, -mv.z) : uSize * aSize;
  vA = aAlpha * clamp(px, 0.0, 1.0);
  gl_PointSize = clamp(px, 1.0, 64.0);
  vC = aColor;
  gl_Position = projectionMatrix * mv;
}`;
const dustFS = `
uniform float uOpacity; varying float vA; varying vec3 vC;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = exp(-d * d * 4.0) * (1.0 - smoothstep(0.8, 1.0, d));
  gl_FragColor = vec4(vC, a * vA * uOpacity);
}`;
export class Dust extends THREE.Points {
  constructor(n, { size = 0.03, color = '#ffcf70', opacity = 1, sizeAttenuation = true, intensity = 1 } = {}) {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3), al = new Float32Array(n).fill(1), sz = new Float32Array(n).fill(1), cl = new Float32Array(n * 3);
    const c = col(color).multiplyScalar(intensity);
    for (let i = 0; i < n; i++) { cl[i * 3] = c.r; cl[i * 3 + 1] = c.g; cl[i * 3 + 2] = c.b; }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(al, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(cl, 3));
    super(g, new THREE.ShaderMaterial({
      vertexShader: dustVS, fragmentShader: dustFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uSize: { value: size }, uScale: { value: 1300 }, uOpacity: { value: opacity }, uAtt: { value: sizeAttenuation ? 1 : 0 } },
    }));
    this.isDust = true; this.n = n; this.pos = pos; this.alpha = al; this.size = sz; this.col = cl; this.frustumCulled = false;
  }
  set(i, x, y, z) { this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; }
  setV(i, v) { this.set(i, v.x, v.y, v.z); }
  color(i, c, k = 1) { c = c.isColor ? c : col(c); this.col[i * 3] = c.r * k; this.col[i * 3 + 1] = c.g * k; this.col[i * 3 + 2] = c.b * k; }
  opacity(o) { this.material.uniforms.uOpacity.value = o; }
  dirty(all = false) { const a = this.geometry.attributes; a.position.needsUpdate = true; a.aAlpha.needsUpdate = true; if (all) { a.aSize.needsUpdate = true; a.aColor.needsUpdate = true; } }
}

// ---------------------------------------------------------------- lines (HDR colours, additive)
export class LineBuilder {
  constructor() { this.p = []; this.c = []; }
  seg(a, b, ca = '#ffcf70', cb = ca, k = 1) { ca = col(ca).multiplyScalar(k); cb = col(cb).multiplyScalar(k); this.p.push(a.x, a.y, a.z, b.x, b.y, b.z); this.c.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b); return this; }
  poly(pts, closed = false, color = '#ffcf70', k = 1) { const m = closed ? pts.length : pts.length - 1; for (let i = 0; i < m; i++) this.seg(pts[i], pts[(i + 1) % pts.length], color, color, k); return this; }
  get count() { return this.p.length / 3; }
  build(opacity = 1) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
    l.frustumCulled = false;
    const n = this.count;
    l.reveal = u => g.setDrawRange(0, Math.floor(clamp(u) * n / 2) * 2);
    return l;
  }
}
export function circle(r, n = 96) { const pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; pts.push(v3(Math.cos(a) * r, Math.sin(a) * r, 0)); } return pts; }
// smooth tube along points (CatmullRom)
export function tube(points, radius = 0.05, seg = 200, radial = 12, closed = false) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed), seg, radius, radial, closed);
}
// Square spiral (云雷纹) polyline, unit size, centred
export function squareSpiral(turns = 3.5, shrink = 0.14) {
  const pts = [v3(-0.5, -0.5, 0)], dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  let p = v3(-0.5, -0.5, 0), len = 1;
  for (let k = 0; k < turns * 4; k++) { const d = dirs[k % 4]; p = p.clone().add(v3(d[0] * len, d[1] * len, 0)); pts.push(p); if (k % 2 === 1 || k === 0) len -= shrink; if (len <= 0.05) break; }
  return pts;
}
// jagged crack/lightning polylines from a to b
export function crack(a, b, r, { depth = 6, rough = 0.35, branches = 3, branchLen = 0.45 } = {}) {
  const disp = (p0, p1, d) => {
    let pts = [p0, p1];
    for (let k = 0; k < d; k++) { const nx = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const m = pts[i].clone().add(pts[i + 1]).multiplyScalar(0.5); m.add(r.dir().multiplyScalar(pts[i].distanceTo(pts[i + 1]) * rough * (r() - 0.3))); nx.push(m, pts[i + 1]); } pts = nx; }
    return pts;
  };
  const main = disp(a, b, depth), out = [main];
  for (let k = 0; k < branches; k++) { const s = main[Math.floor(r.range(0.15, 0.8) * main.length)]; const dir = b.clone().sub(a).normalize().add(r.dir().multiplyScalar(0.9)).normalize(); out.push(disp(s, s.clone().add(dir.multiplyScalar(a.distanceTo(b) * branchLen * r.range(0.4, 1))), depth - 2)); }
  return out;
}

// ---------------------------------------------------------------- camera helpers
export function camera(fov = 35, near = 0.05, far = 2000) { return new THREE.PerspectiveCamera(fov, W / H, near, far); }
export function look(cam, pos, target = v3()) { cam.position.copy(pos); cam.lookAt(target); return cam; }
export function orbit(r, az, el, c = v3()) { return v3(c.x + r * Math.cos(el) * Math.sin(az), c.y + r * Math.sin(el), c.z + r * Math.cos(el) * Math.cos(az)); }
// gentle hand-held drift so locked-off shots still breathe
export function drift(t, amt = 0.03, seed = 1) { return v3(Math.sin(t * 0.9 + seed) * amt, Math.sin(t * 1.3 + seed * 2) * amt * 0.7, Math.sin(t * 0.7 + seed * 3) * amt * 0.5); }

// the seed: one gold point (first and last frame)
export function seedPoint(scale = 1) {
  const d = new Dust(3, { size: 0.12 * scale });
  for (let i = 0; i < 3; i++) d.set(i, 0, 0, 0);
  d.size[0] = 1; d.size[1] = 3.5; d.size[2] = 9;
  d.color(0, col('#fff6e0'), 4); d.color(1, col('#ffcf70'), 2); d.color(2, col('#a0702a'), 1);
  d.alpha[0] = 1; d.alpha[1] = 0.6; d.alpha[2] = 0.25;
  d.dirty(true);
  return d;
}

// ---------------------------------------------------------------- post grade (after tone mapping)
export const gradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uFlash: { value: 0 }, uFade: { value: 1 }, uGrain: { value: 0.025 }, uVignette: { value: 0.9 },
    uRes: { value: new THREE.Vector2(W, H) }, uZoom: { value: 1 }, uRadial: { value: 0 }, uSpark: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uFlash, uFade, uGrain, uVignette, uZoom, uRadial, uSpark; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      // zoom-through: scale about the centre with a radial (zoom) blur
      vec2 uv = 0.5 + (vUv - 0.5) / uZoom;
      vec3 c = vec3(0.0);
      for (int i = 0; i < 10; i++) { float k = 1.0 - uRadial * 0.12 * float(i) / 9.0; c += texture2D(tDiffuse, 0.5 + (uv - 0.5) * k).rgb; }
      c /= 10.0;
      vec2 q = vUv - 0.5; q.x *= uRes.x / uRes.y;
      // the gold spark that travels through every zoom cut
      float d = length(q);
      c += uSpark * (vec3(1.0, 0.82, 0.45) * exp(-d * d * 900.0) * 3.0 + vec3(1.0, 0.7, 0.3) * exp(-d * 18.0) * 0.35);
      c *= mix(1.0, smoothstep(1.25, 0.25, d), uVignette);
      c += (hash(vUv * uRes + uTime * 17.0) - 0.5) * uGrain;
      c = c * uFade + uFlash * vec3(1.0, 0.95, 0.88);
      gl_FragColor = vec4(c, 1.0);
    }`,
};
