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
  // bg: [bottom, top] sky gradient; key/fill/rim lights; shadow/light: cel-shade tints; ink: outline colour
  egg: { bg: ['#140b18', '#4a2a2a'], key: '#ffe2b8', fill: '#3a2440', rim: '#ffb860', accent: '#ffc96b', env: 0.6, shadow: '#5a3f86', light: '#fff0d8', ink: '#1a0f20' },
  cosmos: { bg: ['#0c0a26', '#3a2a70'], key: '#fff1d6', fill: '#2a2a6a', rim: '#9f8bff', accent: '#ffcf70', env: 0.5, shadow: '#3c3f96', light: '#fff4e2', ink: '#0b0920' },
  frost: { bg: ['#8fc9c9', '#f2ead6'], key: '#fff8ea', fill: '#6aa0b8', rim: '#bff4ff', accent: '#bff4ff', env: 0.8, shadow: '#5a78b4', light: '#fffaf0', ink: '#1a2a40' },
  genesis: { bg: ['#0c3236', '#3e8a7a'], key: '#e8fff2', fill: '#1a4a4a', rim: '#ff7ab8', accent: '#3dffd6', env: 0.6, shadow: '#5a3c86', light: '#f4fff0', ink: '#0b1c22' },
  theft: { bg: ['#2a0e10', '#b85a2a'], key: '#ffb060', fill: '#3a1a20', rim: '#ffd890', accent: '#ff7a1a', env: 0.5, shadow: '#5a2a66', light: '#fff0d0', ink: '#1c0a10' },
  marble: { bg: ['#e0a882', '#fbe9cf'], key: '#fff3e0', fill: '#a07a80', rim: '#ffd590', accent: '#ffcf70', env: 1.0, shadow: '#8a6ab0', light: '#fffaf0', ink: '#2a1820' },
  silicon: { bg: ['#06202e', '#1f7a8a'], key: '#e0f6ff', fill: '#103a50', rim: '#5fd0ff', accent: '#5fd0ff', env: 0.8, shadow: '#2c3c86', light: '#f0fbff', ink: '#06121a' },
  void: { bg: ['#040309', '#120c20'], key: '#ffe2b0', fill: '#0a0814', rim: '#ffb050', accent: '#ffc070', env: 0.2, shadow: '#2a2050', light: '#fff0d8', ink: '#000000' },
  data: { bg: ['#0a1c28', '#2a5a6a'], key: '#d8faff', fill: '#123040', rim: '#ffb030', accent: '#40e0ff', env: 0.6, shadow: '#3c2c72', light: '#f0fcff', ink: '#071018' },
  awake: { bg: ['#3a2030', '#e8b080'], key: '#fff0d0', fill: '#5a3a4a', rim: '#ffc060', accent: '#ffd27a', env: 0.7, shadow: '#7a5a9a', light: '#fff6e6', ink: '#1e1018' },
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
  scene.fog = new THREE.Fog(col(P.bg[0]).lerp(col(P.bg[1]), 0.55), radius * 0.04, radius * 0.14);
  scene.userData.palette = name;
  dome.userData.noInk = true;
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
      c *= mix(1.0, smoothstep(1.35, 0.3, d), uVignette * 0.7);
      // painterly: low-frequency watercolour mottle + paper fibre grain
      vec2 pp = vUv * vec2(uRes.x / uRes.y, 1.0);
      float mott = sin(pp.x * 5.3 + sin(pp.y * 3.1) * 2.0) * sin(pp.y * 4.7 + sin(pp.x * 2.3) * 1.7);
      c *= 1.0 + 0.035 * mott;
      float fib = hash(floor(vUv * uRes / 2.0)) - 0.5;
      c += (hash(vUv * uRes + uTime * 17.0) - 0.5) * uGrain + fib * 0.018;
      c = c * uFade + uFlash * vec3(1.0, 0.95, 0.88);
      gl_FragColor = vec4(c, 1.0);
    }`,
};

// ---------------------------------------------------------------- Scavengers Reign / Moebius look (NPR)
// Cel shading injected into every lit (standard/physical) material: banded light, coloured shadows, crisp highlight.
// Scenes keep their own material objects (and animate them as before); only the final shading changes.
export const TOON = {
  uToonShadow: { value: col('#5a3f86') }, uToonLight: { value: col('#fff0d8') }, uToonMix: { value: 1 },
  uToonE1: { value: 0.22 }, uToonE2: { value: 0.62 }, uHatch: { value: 1 }, uPR: { value: 1 },
};
const TOON_GLSL = `
  {
    vec3 albedo = max(diffuseColor.rgb, vec3(0.015));
    vec3 lit = max(outgoingLight - totalEmissiveRadiance, vec3(0.0));
    float L = dot(lit, vec3(0.299, 0.587, 0.114)) / max(dot(albedo, vec3(0.299, 0.587, 0.114)), 0.03);
    float b = 0.55 * smoothstep(uToonE1 - 0.03, uToonE1 + 0.03, L) + 0.45 * smoothstep(uToonE2 - 0.04, uToonE2 + 0.04, L);
    vec3 shade = mix(uToonShadow * 0.55, uToonLight, b);
    // Moebius hatching in the shadow side: diagonal ink lines, denser in the darkest band
    vec2 fc = gl_FragCoord.xy / uPR;
    float h1 = smoothstep(0.62, 0.8, abs(fract((fc.x + fc.y) / 7.0) - 0.5) * 2.0);
    float h2 = smoothstep(0.62, 0.8, abs(fract((fc.x - fc.y) / 7.0) - 0.5) * 2.0);
    float dark = 1.0 - smoothstep(uToonE1 - 0.03, uToonE1 + 0.03, L), mid = 1.0 - smoothstep(uToonE2 - 0.04, uToonE2 + 0.04, L);
    shade *= 1.0 - uHatch * 0.35 * (h1 * mid * 0.6 + h2 * dark);
    vec3 toon = albedo * shade + uToonLight * 0.28 * smoothstep(1.55, 1.65, L);
    float k = uToonMix;
    #ifdef USE_TRANSMISSION
      k *= 0.5;
    #endif
    outgoingLight = mix(outgoingLight, toon + totalEmissiveRadiance, k);
  }
`;
export function toonify(scene) {
  scene.traverse(o => {
    if (!o.isMesh) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
      if (!m || !m.isMeshStandardMaterial || m.userData.toon) return;
      const prev = m.onBeforeCompile;
      m.onBeforeCompile = (sh, r) => {
        if (prev) prev.call(m, sh, r);
        Object.assign(sh.uniforms, TOON);
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform vec3 uToonShadow; uniform vec3 uToonLight; uniform float uToonMix; uniform float uToonE1; uniform float uToonE2; uniform float uHatch; uniform float uPR;')
          .replace('#include <opaque_fragment>', TOON_GLSL + '#include <opaque_fragment>');
      };
      const prevKey = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : () => '';
      m.customProgramCacheKey = () => prevKey() + '|toon';
      m.userData.toon = true;
      m.needsUpdate = true;
    });
  });
}

// Ink lines: edges from a normal + depth pre-pass, slightly "boiled" like hand-drawn line work.
export const inkShader = {
  uniforms: {
    tDiffuse: { value: null }, tNormal: { value: null }, tDepth: { value: null },
    uNear: { value: 0.05 }, uFar: { value: 2000 }, uRes: { value: new THREE.Vector2(W, H) },
    uInk: { value: col('#1a0f20') }, uWidth: { value: 1.3 }, uStrength: { value: 0.85 }, uBoil: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    #include <packing>
    uniform sampler2D tDiffuse, tNormal, tDepth; uniform float uNear, uFar, uWidth, uStrength, uBoil; uniform vec2 uRes; uniform vec3 uInk; varying vec2 vUv;
    float vz(vec2 uv){ float d = texture2D(tDepth, uv).x; return -perspectiveDepthToViewZ(d, uNear, uFar); }
    vec3 nrm(vec2 uv){ return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }
    float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      vec2 jitter = (vec2(h(floor(vUv * 40.0) + uBoil), h(floor(vUv * 40.0) + uBoil + 7.0)) - 0.5) * 0.7 / uRes;
      vec2 uv = vUv + jitter, px = uWidth / uRes;
      float z0 = vz(uv); vec3 n0 = nrm(uv); float bg = step(0.9999, texture2D(tDepth, uv).x);
      float dn = 0.0, dz = 0.0;
      vec2 o[4]; o[0] = vec2(px.x, 0.0); o[1] = vec2(-px.x, 0.0); o[2] = vec2(0.0, px.y); o[3] = vec2(0.0, -px.y);
      for (int i = 0; i < 4; i++) {
        float zi = vz(uv + o[i]); vec3 ni = nrm(uv + o[i]);
        float bgi = step(0.9999, texture2D(tDepth, uv + o[i]).x);
        dn = max(dn, (1.0 - dot(n0, ni)) * (1.0 - max(bg, bgi)));
        dz = max(dz, abs(zi - z0) / max(min(z0, zi), 0.001) + abs(bg - bgi));
      }
      float e = max(smoothstep(0.18, 0.4, dn), smoothstep(0.06, 0.14, dz));
      e *= 1.0 - smoothstep(0.6, 1.0, z0 / uFar * 8.0) * 0.6; // far lines fade into the haze
      c = mix(c, uInk, e * uStrength);
      gl_FragColor = vec4(c, 1.0);
    }`,
};

// ---------------------------------------------------------------- Moebius / Scavengers Reign landscape kit
function cloudTexture(key, seed) {
  return canvasTexture(key, 1024, 256, (g, w, h) => {
    const r = rng(seed); g.clearRect(0, 0, w, h); g.fillStyle = '#fff';
    for (let k = 0; k < 3; k++) {
      const cx = w * (0.2 + 0.3 * k + r.range(-0.05, 0.05)), base = h * 0.78, len = w * r.range(0.18, 0.3);
      g.beginPath(); g.rect(cx - len, base - 6, len * 2, 6); g.fill();
      for (let i = 0; i < 9; i++) { const x = cx - len + (i + 0.5) * len * 2 / 9, rr = h * r.range(0.12, 0.3) * Math.sin(Math.PI * (i + 0.5) / 9); g.beginPath(); g.arc(x, base - rr * 0.6, rr, 0, TAU); g.fill(); }
    }
  });
}
export function reignLandscape(scene, {
  y = -1.6, ground = '#c98a5a', groundDark = '#8a5240', far = '#5a2f55', near = '#8a4a5a', cloud = '#ffd8b8', cloud2 = '#f2a890',
  flora = ['#3f8f86', '#e07a6a', '#f2c27a', '#8a6ab0'], seed = 1, floraCount = 14, clear = 2.6, mesas = 9,
} = {}) {
  const r = rng(seed), G = new THREE.Group(); scene.add(G);
  // dunes
  const gg = new THREE.PlaneGeometry(400, 400, 200, 200); gg.rotateX(-Math.PI / 2);
  const pa = gg.attributes.position, colors = new Float32Array(pa.count * 3), cA = col(ground), cB = col(groundDark);
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i), z = pa.getZ(i), d = Math.hypot(x, z);
    const hgt = (fbm(x * 0.03, 1, z * 0.03, 4) * 3 + Math.sin(x * 0.08 + z * 0.05) * 0.6) * smooth((d - clear) / 12);
    pa.setY(i, hgt); const c = cA.clone().lerp(cB, clamp(0.5 - hgt * 0.25)); colors.set([c.r, c.g, c.b], i * 3);
  }
  gg.setAttribute('color', new THREE.BufferAttribute(colors, 3)); gg.computeVertexNormals();
  const groundM = new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  groundM.position.y = y; groundM.receiveShadow = true; G.add(groundM);
  // mesas / buttes in receding layers (atmospheric perspective by colour)
  for (let k = 0; k < mesas; k++) {
    const dist = r.range(60, 170), ang = r.range(-1.2, 1.2) + Math.PI, w = r.range(10, 30), hh = r.range(6, 22);
    const sh = new THREE.Shape(); sh.moveTo(-w, 0); sh.lineTo(-w * 0.7, hh * 0.85); sh.lineTo(-w * 0.55, hh); sh.lineTo(w * 0.5, hh); sh.lineTo(w * 0.65, hh * 0.8); sh.lineTo(w, 0);
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 8, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: col(near).lerp(col(far), clamp((dist - 60) / 110)), roughness: 1 }));
    m.position.set(Math.sin(ang) * dist, y - 1, Math.cos(ang) * dist); m.lookAt(0, y, 0); G.add(m);
  }
  // painted clouds: flat layered shapes
  for (let k = 0; k < 6; k++) {
    const tex = cloudTexture('cloud' + (k % 3), 30 + k % 3);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(160, 40), new THREE.MeshBasicMaterial({ map: tex, color: col(k % 2 ? cloud : cloud2), transparent: true, depthWrite: false, fog: false }));
    const ang = Math.PI + r.range(-0.9, 0.9), dist = r.range(220, 300);
    m.position.set(Math.sin(ang) * dist, y + r.range(25, 70), Math.cos(ang) * dist); m.lookAt(0, m.position.y, 0); m.userData.noInk = true; G.add(m);
  }
  // alien flora: curved stalks with bulbs, caps and frills
  const plants = [];
  for (let k = 0; k < floraCount; k++) {
    let x, z; do { x = r.range(-16, 16); z = r.range(-18, 4); } while (Math.hypot(x, z) < clear + 1.2 || (z > -3 && Math.abs(x) < 6));
    const P = new THREE.Group(); P.position.set(x, y, z);
    const hgt = r.range(1.2, 4.5), bend = r.range(-0.6, 0.6), c = col(flora[k % flora.length]);
    const pts = []; for (let i = 0; i <= 8; i++) { const s = i / 8; pts.push(v3(bend * s * s, s * hgt, 0)); }
    const stalk = new THREE.Mesh(tube(pts, 0.06 + hgt * 0.015, 24, 8), new THREE.MeshStandardMaterial({ color: c.clone().multiplyScalar(0.8), roughness: 0.8 }));
    stalk.castShadow = true; P.add(stalk);
    const top = pts[8], kind = k % 3;
    let head;
    if (kind === 0) head = new THREE.Mesh(new THREE.SphereGeometry(0.25 + hgt * 0.06, 24, 16), new THREE.MeshStandardMaterial({ color: c.clone().lerp(col('#fff2d0'), 0.3), roughness: 0.6, emissive: c, emissiveIntensity: 0.15 }));
    else if (kind === 1) head = new THREE.Mesh(new THREE.SphereGeometry(0.5 + hgt * 0.08, 24, 12, 0, TAU, 0, Math.PI / 2.2), new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, side: THREE.DoubleSide }));
    else head = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 16, 1, true), new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, side: THREE.DoubleSide }));
    head.position.copy(top); head.castShadow = true; P.add(head);
    if (kind === 0) for (let j = 0; j < 3; j++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshStandardMaterial({ color: col('#fff2d0'), emissive: col('#ffcf70'), emissiveIntensity: 0.6 })); b.position.copy(pts[3 + j * 2]).add(v3(0.12, 0, 0)); P.add(b); }
    G.add(P); plants.push({ P, ph: r() * TAU, amp: r.range(0.02, 0.06) });
  }
  G.sway = t => plants.forEach(p => { p.P.rotation.z = Math.sin(t * 0.8 + p.ph) * p.amp; });
  return G;
}
