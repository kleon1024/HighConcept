// 失真 DISTORTION — shared builders: renderer, studio environments, liquid chrome, geometry.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const W = 1080, H = 1920, ACID = 0xc8ff1e;
export const P = (x, y, z = 0) => new THREE.Vector3(x - W / 2, H / 2 - y, z);    // page px -> world (z=0 plane is 1:1)

// ---------- math / easing ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = k => k * k * (3 - 2 * k);
export const easeOut = k => 1 - Math.pow(1 - k, 3);
export const easeIn = k => k * k * k;
export const easeInOut = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
export const easeOutBack = (k, s = 1.7) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
export const spring = (k, f = 3.2, d = 5.5) => k <= 0 ? 0 : 1 - Math.exp(-d * k) * Math.cos(2 * Math.PI * f * k);   // 0 -> 1 with overshoot
export function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- renderer + camera ----------
export function makeRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(W, H, false); r.setClearColor(0x000000, 0);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.outputColorSpace = THREE.SRGBColorSpace;
  return r;
}
export const FOV = 22;
export function makeCamera() {
  const c = new THREE.PerspectiveCamera(FOV, W / H, 10, 30000);
  c.position.set(0, 0, (H / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2))); c.lookAt(0, 0, 0);
  return c;
}

// ---------- environments (procedural, PMREM) ----------
export function studioEnv(renderer) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(60, 64, 32), new THREE.MeshBasicMaterial({ color: 0x030303, side: THREE.BackSide })));
  const lm = (hex, k) => { const m = new THREE.MeshBasicMaterial({ color: hex, side: THREE.DoubleSide }); m.color.multiplyScalar(k); return m; };
  const panel = (w, h, mat, pos) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.copy(pos); m.lookAt(0, 0, 0); env.add(m); };
  panel(46, 7, lm(0xffffff, 7), new THREE.Vector3(0, 34, 6));
  panel(3.2, 34, lm(0xffffff, 5.5), new THREE.Vector3(-34, 4, 10));
  panel(2.0, 30, lm(0xf2f4ff, 3.5), new THREE.Vector3(33, 2, -6));
  panel(1.0, 40, lm(0xffffff, 6), new THREE.Vector3(-14, 0, -40));
  panel(1.0, 40, lm(0xffffff, 4), new THREE.Vector3(18, 0, -40));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(55, 55, 2.4, 96, 1, true), lm(0x9a9ca2, 1.3)); band.position.y = -3; env.add(band);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(58, 64), lm(0x1a1b1e, 1.0)); floor.rotation.x = -Math.PI / 2; floor.position.y = -20; env.add(floor);
  panel(70, 22, lm(0xffffff, 3.4), new THREE.Vector3(0, 24, 40));
  panel(60, 2.2, lm(0xffffff, 5.0), new THREE.Vector3(0, 6, 46));
  panel(36, 1.6, lm(ACID, 3.2), new THREE.Vector3(-4, -12, 34));
  panel(4, 4, lm(ACID, 2.0), new THREE.Vector3(30, -10, 18));
  return new THREE.PMREMGenerator(renderer).fromScene(env, 0.0, 0.1, 200).texture;
}
export function skyEnv(renderer) {
  const env = new THREE.Scene();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD;
      void main(){
        float d = vD.y; vec3 c;
        if (d > 0.22) c = mix(vec3(1.25), vec3(3.2), smoothstep(0.22, 0.9, d));
        else if (d > 0.025) c = mix(vec3(0.05), vec3(1.25), smoothstep(0.025, 0.24, d));
        else if (d > -0.035) c = vec3(0.004);
        else c = mix(vec3(0.62), vec3(0.05), smoothstep(-0.035, -0.6, d));
        float lime = smoothstep(0.05, 0.0, abs(d + 0.11));
        c = mix(c, vec3(0.78, 1.0, 0.12) * 2.2, lime);
        float az = atan(vD.x, vD.z);
        c *= 1.0 - 0.85 * smoothstep(0.06, 0.0, abs(az - 0.9)) * step(0.0, d);
        c *= 1.0 - 0.85 * smoothstep(0.05, 0.0, abs(az + 1.3)) * step(0.0, d);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  env.add(new THREE.Mesh(new THREE.SphereGeometry(50, 96, 48), mat));
  return new THREE.PMREMGenerator(renderer).fromScene(env, 0.0, 0.1, 200).texture;
}

// ---------- liquid chrome (normal perturbation by animated simplex noise) ----------
export const LIQ = { uTime: { value: 0 }, uKick: { value: 0 } };
const SIMPLEX = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;
// amp: base perturbation; kickAmp: extra amount scaled by LIQ.uKick (0..1) on hits.  freq in 1/px of local space.
export function liquid(mat, amp = 0.2, freq = 1 / 160, speed = 0.25, kickAmp = 0.3) {
  const u = { uAmp: { value: amp }, uFreq: { value: freq }, uSpeed: { value: speed }, uKickAmp: { value: kickAmp } };
  mat.userData.liq = u;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u, { uTime: LIQ.uTime, uKick: LIQ.uKick });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLqP, vLqC0, vLqC1, vLqC2;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLqP = position; vLqC0 = normalize(modelMatrix[0].xyz); vLqC1 = normalize(modelMatrix[1].xyz); vLqC2 = normalize(modelMatrix[2].xyz);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLqP, vLqC0, vLqC1, vLqC2;\nuniform float uTime, uAmp, uFreq, uSpeed, uKick, uKickAmp;\n' + SIMPLEX)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        {
          vec3 q = vLqP * uFreq + vec3(0.0, 0.0, uTime * uSpeed);
          float e = 0.35, n0 = snoise(q);
          vec3 gw = vec3(snoise(q + vec3(e, 0.0, 0.0)) - n0, snoise(q + vec3(0.0, e, 0.0)) - n0, snoise(q + vec3(0.0, 0.0, e)) - n0) / e;
          q *= 2.7; n0 = snoise(q);
          gw += 0.35 * vec3(snoise(q + vec3(e, 0.0, 0.0)) - n0, snoise(q + vec3(0.0, e, 0.0)) - n0, 0.0) / e;
          vec3 gv = mat3(vLqC0, vLqC1, vLqC2) * gw;                      // local -> world, scale removed
          normal = normalize(normal - (uAmp + uKick * uKickAmp) * mat3(viewMatrix) * gv);
        }`);
  };
  mat.customProgramCacheKey = () => 'liq' + amp + '_' + freq + '_' + speed + '_' + kickAmp;
  return mat;
}
export const chrome = (o = {}, lq = null) => {
  const m = new THREE.MeshPhysicalMaterial(Object.assign({ color: 0xffffff, metalness: 1.0, roughness: 0.06, envMapIntensity: 1.0 }, o));
  return lq ? liquid(m, ...lq) : m;
};

// ---------- geometry ----------
export function taperTube(curve, { segs = 140, radial = 28, r0 = 16, pow = 1.15, flat = 0.62, tip = 0.25 } = {}) {
  const frames = curve.computeFrenetFrames(segs, false);
  const pos = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const s = i / segs, p = curve.getPointAt(s), N = frames.normals[i], B = frames.binormals[i];
    const r = r0 * Math.pow(1 - s, pow) + tip;
    for (let j = 0; j <= radial; j++) {
      const a = j / radial * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      pos.push(p.x + r * (c * N.x + sn * flat * B.x), p.y + r * (c * N.y + sn * flat * B.y), p.z + r * (c * N.z + sn * flat * B.z));
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

export function glyphShapes(font, ch, size) {
  const path = font.getPath(ch, 0, 0, size);
  const contours = []; let cur = null;
  for (const c of path.commands) {
    if (c.type === 'M') { cur = new THREE.Path(); cur.moveTo(c.x, -c.y); contours.push(cur); }
    else if (c.type === 'L') cur.lineTo(c.x, -c.y);
    else if (c.type === 'Q') cur.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
    else if (c.type === 'C') cur.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
  }
  const info = contours.map(p => { const pts = p.getPoints(12); return { p, pts, area: THREE.ShapeUtils.area(pts) }; }).filter(o => Math.abs(o.area) > 1);
  const big = info.reduce((a, b) => Math.abs(b.area) > Math.abs(a.area) ? b : a);
  const sign = Math.sign(big.area);
  const inside = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; };
  const outers = info.filter(o => Math.sign(o.area) === sign).map(o => { const s = new THREE.Shape(); s.curves = o.p.curves; s.currentPoint = o.p.currentPoint; return { s, o }; });
  for (const h of info.filter(o => Math.sign(o.area) !== sign)) {
    const host = outers.filter(O => inside(h.pts[0], O.o.pts)).sort((a, b) => Math.abs(a.o.area) - Math.abs(b.o.area))[0];
    if (host) host.s.holes.push(h.p);
  }
  return { shapes: outers.map(O => O.s), advance: font.charToGlyph(ch).advanceWidth * size / font.unitsPerEm };
}

// ---------- the speaker ----------
export function speakerProfile(res = 1) {
  const pts = [], push = (r, h) => pts.push(new THREE.Vector2(r, h)), n = k => Math.max(4, Math.round(k * res));
  for (let i = 0; i <= n(36); i++) { const r = 70 * i / n(36); push(r, -112 + 40 * Math.sqrt(Math.max(0, 1 - (r / 70) ** 2))); }
  push(71, -114); push(76, -116);
  for (let i = 0; i <= n(150); i++) { const u = i / n(150), r = 76 + 176 * u; push(r, -116 + 116 * Math.pow(u, 1.55) + 1.8 * Math.sin(u * Math.PI * 11) * Math.sin(u * Math.PI)); }
  for (let i = 1; i <= n(40); i++) { const u = i / n(40); push(252 + 46 * u, 26 * Math.sin(Math.PI * u)); }
  push(300, 3); push(304, 9);
  for (let i = 0; i <= 10; i++) push(304 + 30 * i / 10, 10);
  for (let i = 1; i <= 10; i++) { const a = i / 10 * Math.PI / 2; push(334 + 8 * Math.sin(a), 2 + 8 * Math.cos(a) - 30 * (i / 10) ** 2); }
  return pts;
}

// slash in speaker-local coords (y up)
export const SLASH = { a: new THREE.Vector2(-176, 150), b: new THREE.Vector2(196, -138) };
const slashRand = mulberry32(303), JAG = Array.from({ length: 64 }, () => slashRand());
const halfW = t => { const k = Math.floor(clamp(t) * 63); const n = JAG[k] * 0.5 + JAG[Math.min(63, k + 1)] * 0.5; return (10 * Math.pow(Math.sin(Math.PI * clamp(t)), 0.6)) * (0.7 + 0.6 * n); };
function distSeg(px, py, a, b) {
  const abx = b.x - a.x, aby = b.y - a.y, l2 = abx * abx + aby * aby;
  const t = clamp(((px - a.x) * abx + (py - a.y) * aby) / l2);
  const dx = px - (a.x + abx * t), dy = py - (a.y + aby * t);
  return { d: Math.sqrt(dx * dx + dy * dy), t, side: Math.sign(abx * (py - a.y) - aby * (px - a.x)) };
}
// cracks (1951) and pencil holes (1958), speaker-local
const crR = mulberry32(1951);
export const CRACKS = (() => {
  const origin = new THREE.Vector2(118, -150), out = [];
  for (let k = 0; k < 7; k++) {
    let a = -2.2 + k * 0.55 + (crR() - 0.5) * 0.3, p = origin.clone(); const pts = [p.clone()];
    const L = 120 + crR() * 170;
    for (let s = 0; s < 9; s++) { a += (crR() - 0.5) * 0.7; p = p.clone().add(new THREE.Vector2(Math.cos(a), Math.sin(a)).multiplyScalar(L / 9)); pts.push(p); }
    out.push(pts);
  }
  return { origin, lines: out };
})();
export const HOLES = [new THREE.Vector2(-120, 60), new THREE.Vector2(40, 150), new THREE.Vector2(-30, -95)];

export function buildSpeaker({ res = 1, TW = 2048, TH = 512, seg = 320, liq = [0.035, 1 / 220, 0.2, 0.12] } = {}) {
  const g = new THREE.Group();
  const prof = speakerProfile(res);
  const geo = new THREE.LatheGeometry(prof, seg); geo.rotateX(Math.PI / 2);
  const base = geo.attributes.position.array.slice();
  // slash-lip influence per vertex (computed once)
  const pos = geo.attributes.position, near = [];
  for (let i = 0; i < pos.count; i++) {
    const x = base[3 * i], y = base[3 * i + 1]; if (Math.hypot(x, y) > 300) continue;
    const { d, t, side } = distSeg(x, y, SLASH.a, SLASH.b); const w = 46;
    if (d < w && t > 0 && t < 1) near.push([i, t, Math.pow(1 - d / w, 2) * Math.sin(Math.PI * t), side]);
  }
  const ab = SLASH.b.clone().sub(SLASH.a).normalize(), nrm = new THREE.Vector2(-ab.y, ab.x);
  // texel -> damage-canvas pixel lookup (damage is drawn with canvas paths in local XY, then sampled per texel)
  const DW = 1536, EXT = 340, n = prof.length, IDX = new Int32Array(TW * TH);
  for (let y = 0; y < TH; y++) {
    const vv = 1 - (y + 0.5) / TH, fi = vv * (n - 1), i0 = Math.floor(fi), f = fi - i0;
    const r = prof[i0].x * (1 - f) + prof[Math.min(n - 1, i0 + 1)].x * f;
    for (let x = 0; x < TW; x++) {
      const phi = (x + 0.5) / TW * Math.PI * 2, lx = r * Math.sin(phi), ly = -r * Math.cos(phi);
      const px = Math.round((lx + EXT) / (2 * EXT) * (DW - 1)), py = Math.round((EXT - ly) / (2 * EXT) * (DW - 1));
      IDX[y * TW + x] = r < 300 ? py * DW + px : -1;
    }
  }
  const dc = document.createElement('canvas'); dc.width = dc.height = DW; const dx = dc.getContext('2d', { willReadFrequently: true });
  const toPx = (x, y) => [(x + EXT) / (2 * EXT) * (DW - 1), (EXT - y) / (2 * EXT) * (DW - 1)], PXU = (DW - 1) / (2 * EXT);
  const c = document.createElement('canvas'); c.width = TW; c.height = TH; const ctx = c.getContext('2d'); const img = ctx.createImageData(TW, TH);
  const alpha = new THREE.CanvasTexture(c); alpha.colorSpace = THREE.NoColorSpace; alpha.anisotropy = 4;
  const mat = chrome({ color: 0xe9ebef, roughness: 0.1, alphaMap: alpha, alphaTest: 0.5, side: THREE.DoubleSide }, liq);
  const cone = new THREE.Mesh(geo, mat); g.add(cone);
  // light behind the cone: only seen through the damage
  const lc = document.createElement('canvas'); lc.width = lc.height = 256; const lx = lc.getContext('2d');
  const grd = lx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(225,255,120,1)'); grd.addColorStop(0.35, 'rgba(200,255,30,0.75)'); grd.addColorStop(0.75, 'rgba(120,160,10,0.18)'); grd.addColorStop(1, 'rgba(0,0,0,1)');
  lx.fillStyle = '#000'; lx.fillRect(0, 0, 256, 256); lx.fillStyle = grd; lx.fillRect(0, 0, 256, 256);
  const backMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(lc), toneMapped: false });
  const back = new THREE.Mesh(new THREE.CircleGeometry(300, 96), backMat); back.position.z = -175; g.add(back);
  const gc = document.createElement('canvas'); gc.width = gc.height = 256; const gx = gc.getContext('2d');
  const g2 = gx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g2.addColorStop(0, 'rgba(240,255,170,1)'); g2.addColorStop(0.12, 'rgba(206,255,40,0.95)'); g2.addColorStop(0.45, 'rgba(200,255,30,0.25)'); g2.addColorStop(1, 'rgba(200,255,30,0)');
  gx.fillStyle = g2; gx.fillRect(0, 0, 256, 256);
  const core = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const mid = SLASH.a.clone().add(SLASH.b).multiplyScalar(0.5);
  core.position.set(mid.x, mid.y, -150); core.rotation.z = Math.atan2(SLASH.b.y - SLASH.a.y, SLASH.b.x - SLASH.a.x); core.scale.set(640, 46, 1); g.add(core);
  const boltGeo = new THREE.SphereGeometry(7, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2); boltGeo.rotateX(Math.PI / 2);
  const boltMat = chrome({ roughness: 0.04 });
  for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * Math.PI * 2; const b = new THREE.Mesh(boltGeo, boltMat); b.position.set(319 * Math.cos(a), 319 * Math.sin(a), 10); g.add(b); }

  let lastKey = '';
  // damage = { cut: 0..1 progress along the slash, open: 0..1, cracks: 0..1, holes: 0..3 (fractional = growing) }
  function setDamage({ cut = 0, open = 0, cracks = 0, holes = 0, light = 1 }) {
    const key = [cut, open, cracks, holes].map(v => v.toFixed(3)).join('|');
    backMat.color.setScalar(light); core.material.color.setRGB(0.8 * light * open, 1.0 * light * open, 0.35 * light * open);
    core.visible = open > 0.001;
    if (key === lastKey) return; lastKey = key;
    // lips
    const arr = pos.array;
    arr.set(base);
    if (open > 0) for (const [i, t, k0, side] of near) {
      const k = k0 * open * smooth(clamp((cut - t) * 6 + 0.0)); if (k <= 0) continue;
      arr[3 * i + 2] -= 34 * k; arr[3 * i] += nrm.x * side * 7 * k; arr[3 * i + 1] += nrm.y * side * 7 * k;
    }
    pos.needsUpdate = true; geo.computeVertexNormals();
    // alpha mask: draw the damage, then sample it per texel
    dx.fillStyle = '#fff'; dx.fillRect(0, 0, DW, DW); dx.fillStyle = '#000'; dx.strokeStyle = '#000'; dx.lineCap = 'round'; dx.lineJoin = 'round';
    if (open > 0 && cut > 0) {
      const L = [], R2 = [], steps = 72, ab2 = SLASH.b.clone().sub(SLASH.a);
      for (let k = 0; k <= steps; k++) {
        const t = Math.min(cut, 0.999) * k / steps, w = halfW(t) * open;
        const cx = SLASH.a.x + ab2.x * t, cy = SLASH.a.y + ab2.y * t;
        L.push(toPx(cx + nrm.x * w, cy + nrm.y * w)); R2.push(toPx(cx - nrm.x * w, cy - nrm.y * w));
      }
      dx.beginPath(); dx.moveTo(...L[0]); for (const q of L) dx.lineTo(...q); for (const q of R2.reverse()) dx.lineTo(...q); dx.closePath(); dx.fill();
    }
    for (let h = 0; h < HOLES.length; h++) { const hr = 9 * clamp(holes - h); if (hr > 0) { const [hx, hy] = toPx(HOLES[h].x, HOLES[h].y); dx.beginPath(); dx.arc(hx, hy, hr * PXU, 0, Math.PI * 2); dx.fill(); } }
    if (cracks > 0) for (const L of CRACKS.lines) {
      const segs = (L.length - 1) * cracks;
      for (let s2 = 0; s2 < segs; s2++) {
        const p0 = L[s2], p1 = L[s2 + 1], fr = Math.min(1, segs - s2);
        dx.lineWidth = Math.max(1.2, 2 * 2.6 * cracks * (1 - 0.6 * s2 / L.length) * PXU);
        dx.beginPath(); dx.moveTo(...toPx(p0.x, p0.y)); dx.lineTo(...toPx(p0.x + (p1.x - p0.x) * fr, p0.y + (p1.y - p0.y) * fr)); dx.stroke();
      }
    }
    const DD = dx.getImageData(0, 0, DW, DW).data, D = img.data;
    for (let i = 0, N = TW * TH; i < N; i++) { const j = IDX[i]; const a = j < 0 ? 255 : DD[4 * j]; D[4 * i] = D[4 * i + 1] = D[4 * i + 2] = a; D[4 * i + 3] = 255; }
    ctx.putImageData(img, 0, 0); alpha.needsUpdate = true;
  }
  setDamage({});
  return { group: g, setDamage, mat, alpha };
}

// tribal chrome thorns around the rim
export function buildThorns(scale = 1) {
  const g = new THREE.Group(), parts = [];
  const mat = chrome({ roughness: 0.03 }, [0.1, 1 / 160, 0.3, 0.3]);
  const defs = [[50, 300, 34, 0.85, true], [76, 210, 24, 0.75, true], [25, 150, 18, 0.7, false], [-40, 180, 24, 0.8, true], [-66, 110, 15, 0.7, false]];
  for (const side of [1, -1]) for (const [deg, L, r0, bend, barb] of defs) {
    const a = THREE.MathUtils.degToRad(side > 0 ? deg : 180 - deg);
    const dir = new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
    const nrm = new THREE.Vector3(-dir.y, dir.x, 0).multiplyScalar(-side * Math.sign(deg));
    const sub = new THREE.Group();
    const base = dir.clone().multiplyScalar(300);
    const p0 = new THREE.Vector3(0, 0, -18);
    const p1 = dir.clone().multiplyScalar(L * 0.38).addScaledVector(nrm, -L * 0.12 * bend).setZ(-8);
    const p2 = dir.clone().multiplyScalar(L * 0.72).addScaledVector(nrm, L * 0.22 * bend).setZ(4);
    const p3 = dir.clone().multiplyScalar(L).addScaledVector(nrm, L * 0.52 * bend).setZ(10);
    const curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3);
    sub.add(new THREE.Mesh(taperTube(curve, { r0, pow: 1.25, flat: 0.62 }), mat));
    if (barb) {
      const q0 = curve.getPointAt(0.34), t0 = curve.getTangentAt(0.34);
      const out = new THREE.Vector3(-t0.y, t0.x, 0).multiplyScalar(-side * Math.sign(deg));
      const q1 = q0.clone().addScaledVector(out, L * 0.16).addScaledVector(t0, -L * 0.02);
      const q2 = q0.clone().addScaledVector(out, L * 0.25).addScaledVector(t0, -L * 0.14).setZ(q0.z + 6);
      sub.add(new THREE.Mesh(taperTube(new THREE.QuadraticBezierCurve3(q0, q1, q2), { r0: r0 * 0.55, pow: 1.0, flat: 0.6, segs: 60 }), mat));
    }
    sub.position.copy(base); g.add(sub); parts.push({ sub, dir, L });
  }
  g.scale.setScalar(scale);
  // grow: 0..1 (thorns slide out from behind the rim and scale up, staggered)
  const setGrow = (k, t = 0) => parts.forEach((p, i) => {
    const kk = clamp(k * 1.25 - (i % 5) * 0.06);
    const s = kk <= 0 ? 0.0001 : spring(kk, 1.6, 4.5);
    p.sub.scale.setScalar(Math.max(0.0001, s));
    p.sub.position.copy(p.dir.clone().multiplyScalar(300 - 40 * (1 - Math.min(1, s))));
    p.sub.rotation.z = 0.02 * Math.sin(t * 3 + i);
  });
  return { group: g, setGrow };
}

// waveform tube: amplitude A, clip level (fraction of A), phase; curl -> ring of radius R around (0,0)
export function makeWave(mat) {
  const N = 900, X0 = -720, X1 = 720;
  const geo = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(X0, 0, 0), new THREE.Vector3(X1, 0, 0)), N, 6, 12, false);
  const mesh = new THREE.Mesh(geo, mat);
  function update({ A = 0, clip = 1, phase = 0, k = Math.PI * 2 / 260, curl = 0, R = 336, radius = 6, soft = 0.12 }) {
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const u = i / 240, x = lerp(X0, X1, u);
      let s = Math.sin(k * x + phase) * A;
      const c = Math.max(1e-3, clip * A), kw = soft * c, as = Math.abs(s);
      if (clip < 1 && as > c - kw) s = Math.sign(s) * (as > c + kw ? c : as - (as - (c - kw)) ** 2 / (4 * kw));
      // curl: map the line onto a circle (u -> angle) as curl -> 1
      const ang = Math.PI / 2 - u * Math.PI * 2;
      const rr = R + s * 0.35 * (1 - curl);
      const cx = rr * Math.cos(ang), cy = rr * Math.sin(ang);
      pts.push(new THREE.Vector3(lerp(x, cx, curl), lerp(s, cy, curl), 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts, curl > 0.98, 'catmullrom', 0.0);
    const ng = new THREE.TubeGeometry(curve, N, radius, 12, curl > 0.98);
    mesh.geometry.dispose(); mesh.geometry = ng;
  }
  return { mesh, update };
}

// double-edge razor blade
export function buildBlade() {
  const w = 300, h = 150, s = new THREE.Shape();
  s.moveTo(-w / 2 + 14, -h / 2); s.lineTo(w / 2 - 14, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + 14);
  s.lineTo(w / 2, -16); s.lineTo(w / 2 - 22, -10); s.lineTo(w / 2 - 22, 10); s.lineTo(w / 2, 16);
  s.lineTo(w / 2, h / 2 - 14); s.quadraticCurveTo(w / 2, h / 2, w / 2 - 14, h / 2); s.lineTo(-w / 2 + 14, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - 14); s.lineTo(-w / 2, 16); s.lineTo(-w / 2 + 22, 10); s.lineTo(-w / 2 + 22, -10); s.lineTo(-w / 2, -16);
  s.lineTo(-w / 2, -h / 2 + 14); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + 14, -h / 2);
  const slot = new THREE.Path(); slot.absarc(-62, 0, 11, Math.PI / 2, 3 * Math.PI / 2); slot.lineTo(62, -11); slot.absarc(62, 0, 11, -Math.PI / 2, Math.PI / 2); slot.lineTo(-62, 11);
  s.holes.push(slot);
  for (const x of [-100, 100]) { const c = new THREE.Path(); c.absarc(x, 0, 13, 0, Math.PI * 2, true); s.holes.push(c); }
  const geo = new THREE.ExtrudeGeometry(s, { depth: 2, bevelEnabled: true, bevelThickness: 1.6, bevelSize: 2.2, bevelSegments: 3, curveSegments: 24 });
  geo.translate(0, 0, -1);
  return new THREE.Mesh(geo, chrome({ roughness: 0.04 }, [0.06, 1 / 120, 0.4, 0.1]));
}

// chrome pencil (hex), tip points to -z (toward the cone)
export function buildPencil() {
  const g = new THREE.Group(), m = chrome({ roughness: 0.05 }, [0.05, 1 / 100, 0.3, 0.1]);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(17, 17, 520, 6, 1), m); body.rotation.x = Math.PI / 2; body.position.z = 330; g.add(body);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(17, 2.5, 70, 6, 1), chrome({ roughness: 0.18, color: 0xcfd2d6 })); cone.rotation.x = -Math.PI / 2; cone.position.z = 35; g.add(cone);
  const fer = new THREE.Mesh(new THREE.CylinderGeometry(18.5, 18.5, 46, 32, 1), chrome({ roughness: 0.02 })); fer.rotation.x = Math.PI / 2; fer.position.z = 613; g.add(fer);
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(18.6, 1.6, 8, 32), chrome({ roughness: 0.02 })); r.position.z = 596 + i * 11; g.add(r); }
  return g;
}

// stompbox: rounded chrome box, matte face plate with a tick ring, one big knob, two small, footswitch
export function buildPedal() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new RoundedBoxGeometry(520, 720, 150, 8, 34), chrome({ roughness: 0.07 }, [0.05, 1 / 260, 0.2, 0.25]));
  g.add(box);
  const fc = document.createElement('canvas'); fc.width = 1040; fc.height = 1440; const fx = fc.getContext('2d');
  const faceTex = new THREE.CanvasTexture(fc); faceTex.colorSpace = THREE.SRGBColorSpace; faceTex.anisotropy = 4;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(470, 650), new THREE.MeshStandardMaterial({ map: faceTex, metalness: 0.2, roughness: 0.55 }));
  face.position.z = 75.5; g.add(face);
  const knob = new THREE.Group();
  const kGeo = new THREE.CylinderGeometry(78, 84, 58, 72, 1); kGeo.rotateX(Math.PI / 2);
  const kp = kGeo.attributes.position;
  for (let i = 0; i < kp.count; i++) { const x = kp.getX(i), y = kp.getY(i), r = Math.hypot(x, y); if (r > 70) { const a = Math.atan2(y, x), k = 1 + 0.025 * Math.sign(Math.sin(a * 36)); kp.setX(i, x * k); kp.setY(i, y * k); } }
  kGeo.computeVertexNormals();
  knob.add(new THREE.Mesh(kGeo, chrome({ roughness: 0.05 })));
  const cap = new THREE.Mesh(new THREE.CircleGeometry(70, 72), new THREE.MeshStandardMaterial({ color: 0x0b0b0c, metalness: 0.6, roughness: 0.25 })); cap.position.z = 29.5; knob.add(cap);
  const ptr = new THREE.Mesh(new THREE.PlaneGeometry(8, 52), new THREE.MeshBasicMaterial({ color: ACID, toneMapped: false })); ptr.position.set(0, 38, 30); knob.add(ptr);
  knob.position.set(0, 150, 105); g.add(knob);
  const small = [];
  for (const x of [-160, 160]) { const s = new THREE.Mesh(new THREE.CylinderGeometry(34, 36, 36, 40).rotateX(Math.PI / 2), chrome({ roughness: 0.05 })); s.position.set(x, 210, 94); g.add(s); small.push(s); }
  const sw = new THREE.Group();
  const nut = new THREE.Mesh(new THREE.CylinderGeometry(46, 46, 16, 6).rotateX(Math.PI / 2), chrome({ roughness: 0.05 })); nut.position.z = 84; sw.add(nut);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(30, 32, 44, 40).rotateX(Math.PI / 2), chrome({ roughness: 0.03 })); stem.position.z = 112; sw.add(stem);
  sw.position.set(0, -200, 0); g.add(sw);
  let lastTicks = -1;
  const FP = (x, y) => [520 + x * (1040 / 470), 720 - y * (1440 / 650)], FS = 1040 / 470;
  function drawFace(level, force = false) {         // level 0..1 : lit ticks
    const ticks = Math.round(level * 10); if (ticks === lastTicks && !force) return; lastTicks = ticks;
    fx.fillStyle = '#0c0c0d'; fx.fillRect(0, 0, 1040, 1440);
    fx.strokeStyle = 'rgba(255,255,255,0.18)'; fx.lineWidth = 2; fx.strokeRect(24, 24, 992, 1392);
    const [cx, cy] = FP(0, 150);
    for (let i = 0; i <= 10; i++) {
      const a = (-135 + 27 * i) * Math.PI / 180, r0 = 96 * FS, r1 = (i % 5 === 0 ? 120 : 112) * FS;
      fx.strokeStyle = i <= ticks && ticks > 0 ? '#c8ff1e' : 'rgba(230,230,233,0.55)'; fx.lineWidth = i % 5 === 0 ? 7 : 4;
      fx.beginPath(); fx.moveTo(cx + r0 * Math.sin(a), cy - r0 * Math.cos(a)); fx.lineTo(cx + r1 * Math.sin(a), cy - r1 * Math.cos(a)); fx.stroke();
    }
    fx.textAlign = 'center'; fx.fillStyle = 'rgba(230,230,233,0.8)';
    fx.font = '400 26px "JetBrains Mono"'; fx.fillText('0', cx - 108 * FS * 0.72, cy + 108 * FS * 0.78); fx.fillText('10', cx + 108 * FS * 0.72, cy + 108 * FS * 0.78);
    fx.font = '700 40px "JetBrains Mono"'; fx.fillText('GAIN', cx, cy + 128 * FS);
    fx.font = '700 26px "JetBrains Mono"'; for (const [x, lab] of [[-160, 'LEVEL'], [160, 'TONE']]) { const [qx, qy] = FP(x, 210); fx.fillText(lab, qx, qy + 52 * FS); }
    const [tx, ty] = FP(0, -80);
    fx.font = '900 170px "Big Shoulders Display"'; fx.fillStyle = 'rgba(230,230,233,0.92)'; fx.fillText('FUZZ', tx, ty + 60);
    fx.font = '400 24px "JetBrains Mono"'; fx.fillStyle = 'rgba(230,230,233,0.5)'; fx.fillText('DST—62 · DISTORTION IN A BOX', tx, ty + 104);
    faceTex.needsUpdate = true;
  }
  drawFace(0);
  return { group: g, knob, sw, drawFace };
}
