// Shared look: holographic gold lines, soft glowing particles, post grade.
import * as THREE from 'three';

export { THREE };
export const W = 1920, H = 1080;
export const GOLD = new THREE.Color('#E8C374');
export const DGOLD = new THREE.Color('#8A6A2F');
export const WHITE = new THREE.Color('#FFF4D6');
export const ICE = new THREE.Color('#9DB4BF');
export const BRONZE = new THREE.Color('#4E8C70');
export const TAU = Math.PI * 2;

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = t => Math.pow(clamp(t), 3);
export const range = (u, a, b) => clamp((u - a) / (b - a)); // local progress of u inside [a,b]
export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

export function rng(seed = 1) {
  let s = seed >>> 0;
  const f = () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.range = (a, b) => a + (b - a) * f();
  f.gauss = () => { let u = 0, v = 0; while (!u) u = f(); while (!v) v = f(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
  f.dir = () => { const z = f() * 2 - 1, a = f() * TAU, r = Math.sqrt(1 - z * z); return v3(r * Math.cos(a), r * Math.sin(a), z); };
  return f;
}

// smooth 3D value noise
const hash3 = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const c = (a, b, d) => hash3(xi + a, yi + b, zi + d);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w) * 2 - 1;
}
export const fbm = (x, y, z, o = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * noise3(x * f, y * f, z * f); a *= 0.5; f *= 2; } return s; };

// ---------- glowing particles ----------
const dustVS = `
attribute float aAlpha; attribute float aSize; attribute vec3 aColor;
uniform float uSize; uniform float uScale;
varying float vA; varying vec3 vC;
void main(){
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  float px = uSize * aSize * uScale / max(0.001, -mv.z);
  vA = aAlpha * clamp(px, 0.0, 1.0);
  gl_PointSize = clamp(px, 1.0, 48.0);
  vC = aColor;
  gl_Position = projectionMatrix * mv;
}`;
const dustFS = `
uniform float uOpacity; varying float vA; varying vec3 vC;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = exp(-d * d * 3.5) * (1.0 - smoothstep(0.85, 1.0, d));
  gl_FragColor = vec4(vC, a * vA * uOpacity);
}`;

export class Dust extends THREE.Points {
  constructor(n, { size = 0.03, color = GOLD, opacity = 1 } = {}) {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3), al = new Float32Array(n).fill(1), sz = new Float32Array(n).fill(1), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b; }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(al, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    const m = new THREE.ShaderMaterial({
      vertexShader: dustVS, fragmentShader: dustFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uSize: { value: size }, uScale: { value: H / (2 * Math.tan(THREE.MathUtils.degToRad(20))) }, uOpacity: { value: opacity } },
    });
    super(g, m);
    this.n = n; this.pos = pos; this.alpha = al; this.size = sz; this.col = col;
    this.frustumCulled = false;
  }
  set(i, x, y, z) { this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; }
  setV(i, v) { this.set(i, v.x, v.y, v.z); }
  color(i, c, k = 1) { this.col[i * 3] = c.r * k; this.col[i * 3 + 1] = c.g * k; this.col[i * 3 + 2] = c.b * k; }
  opacity(o) { this.material.uniforms.uOpacity.value = o; }
  fov(deg) { this.material.uniforms.uScale.value = H / (2 * Math.tan(THREE.MathUtils.degToRad(deg / 2))); return this; }
  dirty(all = false) {
    const a = this.geometry.attributes;
    a.position.needsUpdate = true; a.aAlpha.needsUpdate = true;
    if (all) { a.aSize.needsUpdate = true; a.aColor.needsUpdate = true; }
  }
}

// ---------- lines ----------
export class LineBuilder {
  constructor() { this.p = []; this.c = []; }
  seg(a, b, ca = GOLD, cb = ca) {
    this.p.push(a.x, a.y, a.z, b.x, b.y, b.z);
    this.c.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b);
    return this;
  }
  poly(pts, closed = false, color = GOLD, fade = null) {
    const n = pts.length, m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const ca = fade ? color.clone().multiplyScalar(fade(i / n)) : color;
      const cb = fade ? color.clone().multiplyScalar(fade((i + 1) / n)) : color;
      this.seg(pts[i], pts[(i + 1) % n], ca, cb);
    }
    return this;
  }
  get count() { return this.p.length / 3; }
  build(opacity = 1) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    const m = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
    const l = new THREE.LineSegments(g, m);
    l.frustumCulled = false;
    l.reveal = u => g.setDrawRange(0, Math.floor(clamp(u) * this.count / 2) * 2);
    return l;
  }
}

export function wire(geom, color = GOLD, opacity = 1, edges = false) {
  const g = edges ? new THREE.EdgesGeometry(geom, 1) : new THREE.WireframeGeometry(geom);
  const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  l.frustumCulled = false;
  return l;
}

export function circle(r, n = 96, f = (p, i) => p) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU; pts.push(f(v3(Math.cos(a) * r, Math.sin(a) * r, 0), i)); }
  return pts;
}

// Square spiral (云雷纹), unit size, centred
export function squareSpiral(turns = 3.5, shrink = 0.14) {
  const pts = [v3(-0.5, -0.5, 0)];
  const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  let p = v3(-0.5, -0.5, 0), len = 1;
  for (let k = 0; k < turns * 4; k++) {
    const d = dirs[k % 4];
    p = p.clone().add(v3(d[0] * len, d[1] * len, 0));
    pts.push(p);
    if (k % 2 === 1 || k === 0) len -= shrink;
    if (len <= 0.05) break;
  }
  return pts;
}

// Jagged crack/lightning between a and b with optional branches. Returns array of polylines.
export function crack(a, b, r, { depth = 6, rough = 0.35, branches = 3, branchLen = 0.45 } = {}) {
  const out = [];
  const disp = (p0, p1, d, rough) => {
    let pts = [p0, p1];
    for (let k = 0; k < d; k++) {
      const nxt = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const m = pts[i].clone().add(pts[i + 1]).multiplyScalar(0.5);
        const len = pts[i].distanceTo(pts[i + 1]);
        m.add(r.dir().multiplyScalar(len * rough * (r() - 0.3)));
        nxt.push(m, pts[i + 1]);
      }
      pts = nxt;
    }
    return pts;
  };
  const main = disp(a, b, depth, rough);
  out.push(main);
  for (let k = 0; k < branches; k++) {
    const i = Math.floor(r.range(0.15, 0.8) * main.length);
    const s = main[i], dir = b.clone().sub(a).normalize().add(r.dir().multiplyScalar(0.9)).normalize();
    const e = s.clone().add(dir.multiplyScalar(a.distanceTo(b) * branchLen * r.range(0.4, 1)));
    out.push(disp(s, e, depth - 2, rough));
  }
  return out;
}

export function camera(fov = 40) {
  return new THREE.PerspectiveCamera(fov, W / H, 0.01, 3000);
}
export function look(cam, pos, target = v3()) { cam.position.copy(pos); cam.lookAt(target); return cam; }
export function orbit(r, az, el) { return v3(r * Math.cos(el) * Math.sin(az), r * Math.sin(el), r * Math.cos(el) * Math.cos(az)); }

// background dust shared by many scenes
export function starfield(n = 3000, radius = 40, seed = 9, opacity = 0.35) {
  const r = rng(seed), d = new Dust(n, { size: 0.06, opacity });
  for (let i = 0; i < n; i++) { d.setV(i, r.dir().multiplyScalar(radius * Math.cbrt(r.range(0.05, 1)))); d.alpha[i] = r.range(0.2, 1); d.color(i, r() < 0.8 ? DGOLD : GOLD); }
  d.dirty(true);
  return d;
}

// the seed: one gold point, identical in the first and last shots
export function seedPoint() {
  const d = new Dust(3, { size: 0.12 });
  d.set(0, 0, 0, 0); d.set(1, 0, 0, 0); d.set(2, 0, 0, 0);
  d.size[0] = 1; d.size[1] = 3.5; d.size[2] = 9;
  d.color(0, WHITE); d.color(1, GOLD); d.color(2, DGOLD);
  d.alpha[0] = 1; d.alpha[1] = 0.5; d.alpha[2] = 0.18;
  d.dirty(true);
  return d;
}

// ---------- post ----------
export const finalShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uFlash: { value: 0 }, uFade: { value: 1 },
    uCA: { value: 1 }, uGrain: { value: 0.035 }, uTint: { value: 0.35 }, uRes: { value: new THREE.Vector2(W, H) },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uFlash, uFade, uCA, uGrain, uTint; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5; float r2 = dot(c,c);
      vec2 off = c * uCA * 0.006;
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      float l = dot(col, vec3(0.299,0.587,0.114));
      vec3 gold = mix(vec3(0.0), vec3(1.0,0.80,0.50), pow(l, 0.92)) + max(col - 1.0, 0.0) * 0.6;
      col = mix(col, gold, uTint);
      col *= 1.0 - r2 * 1.3;
      col *= 0.97 + 0.03 * sin(vUv.y * uRes.y * 1.5708);
      col += (hash(vUv * uRes + uTime * 61.0) - 0.5) * uGrain;
      col = col * uFade + uFlash * vec3(1.0, 0.92, 0.78);
      col += vec3(0.020, 0.016, 0.012) * uFade;
      gl_FragColor = vec4(col, 1.0);
    }`,
};
