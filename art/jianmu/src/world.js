// 御剑 YUJIAN — the world: 建木 (the colossal tree-ladder), its rungs, hoops and stair; floating sect islands with pines,
// halls and waterfalls; pillar peaks; chains; the colossal buried sword; debris. 1 unit = 1 m. Cloud-sea top at y = 0.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, fbm3, noise3, clamp, lerp, smooth } from './util.js';
import { paintMat, glowMat } from './materials.js';

const col = h => new THREE.Color(h);
export const PAL = {
  bark: col(0x4a4841), barkHi: col(0x948d7d), moss: col(0x4d7a5c), lichen: col(0xaab8a6),
  beam: col(0x7c3a2a), beamHi: col(0xa8513a), bronze: col(0x557f72), gold: col(0xd9b16a),
  rockLit: col(0xb8aa90), rockMid: col(0x7b847f), rockLow: col(0x45606b), grass: col(0x4a8a70), grassHi: col(0x7aa883),
  pine: col(0x2f4f42), pineHi: col(0x4c6d55), stone: col(0xe7e3d8), verm: col(0xc8452e), roof: col(0x3c5359), roofGlaze: col(0x3d6c66),
  white: col(0xf1efe8),
};

function setColors(g, fn) {
  const p = g.attributes.position, n = g.attributes.normal; const c = new Float32Array(p.count * 3);
  const v = new THREE.Vector3(), nn = new THREE.Vector3(), out = new THREE.Color();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); nn.fromBufferAttribute(n, i); fn(v, nn, out, i); c[i * 3] = out.r; c[i * 3 + 1] = out.g; c[i * 3 + 2] = out.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
}
const solid = (g, c) => setColors(g, (v, n, o) => o.copy(c));
// merge with consistent attributes (non-indexed, position/normal/color only)
export function merge(list) { return mergeGeometries(list.map(g => { const x = g.index ? g.toNonIndexed() : g; if (x.attributes.uv) x.deleteAttribute('uv'); return x; })); }

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// ─────────────────────────────── 建木 trunk: a colossal ancient tree, fissured and buttressed, its axis meandering
export const TRUNK = { R: 300, y0: -900, breakY: 2400, y1: 11000, rungStep: 230, rungY0: 300 };
export function axisOff(y) { return new THREE.Vector3(70 * Math.sin(y / 1900 + 1.0) + 22 * Math.sin(y / 650), 0, 60 * Math.cos(y / 2300) + 18 * Math.sin(y / 870 + 2)); }
const ridged = (x, y, z) => 1 - Math.abs(2 * noise3(x, y, z) - 1);
export function trunkRadius(th, y) {
  const { R } = TRUNK; const tw = th + y * 0.00028;
  let r = R * (1 - 0.2 * clamp(y / 11000, 0, 1));
  r *= 1 + 0.11 * Math.cos(5 * tw + 0.8 * Math.sin(y / 900)) + 0.05 * Math.cos(9 * tw - y / 700);
  r *= 1 + 0.08 * (fbm3(Math.cos(tw) * 1.2, y / 800, Math.sin(tw) * 1.2, 3) - 0.5);
  const u = tw * R / 46;
  const rg = ridged(u, y / 360, 1.7) * 0.65 + ridged(u * 2.1, y / 170, 5.3) * 0.35;
  r += 30 * rg * rg - 15 + 6 * (noise3(u * 3, y / 40, 9) - 0.5);
  r += 22 * (noise3(Math.cos(tw) * 2, y / 260, Math.sin(tw) * 2) - 0.5);   // burls
  if (y < 0) r *= 1 + 0.5 * Math.pow(clamp(-y / 900), 1.6);
  return r;
}
function trunkGeom(ya, yb, jagTop, jagBot, seed) {
  const segR = 200, segY = Math.ceil((yb - ya) / (ya > 2000 ? 34 : 20));
  const g = new THREE.CylinderGeometry(1, 1, 1, segR, segY, true);
  const p = g.attributes.position; const rng = mulberry32(seed);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), yy = p.getY(i) + 0.5, z = p.getZ(i);
    let y = lerp(ya, yb, yy); const th = Math.atan2(z, x);
    const r = trunkRadius(th, y); const o = axisOff(y);
    if (jagTop && yy > 0.985) y -= 20 + 200 * Math.pow(noise3(th * 9, 3, 9), 1.5) + 40 * rng();
    if (jagBot && yy < 0.015) y += 30 + 160 * Math.pow(noise3(th * 9, 3, 9), 1.5);
    p.setXYZ(i, o.x + Math.cos(th) * r, y, o.z + Math.sin(th) * r);
  }
  g.computeVertexNormals();
  setColors(g, (v, n, o) => {
    const ax = axisOff(v.y); const th = Math.atan2(v.z - ax.z, v.x - ax.x); const tw = th + v.y * 0.00028; const u = tw * TRUNK.R / 46;
    const rg = ridged(u, v.y / 360, 1.7) * 0.65 + ridged(u * 2.1, v.y / 170, 5.3) * 0.35;
    o.copy(PAL.bark).lerp(PAL.barkHi, clamp(rg * rg * 1.15));
    o.lerp(col(0x2b2c28), clamp(0.5 - rg) * 1.0);                           // deep fissures
    const moss = clamp((noise3(v.x / 110, v.y / 240, v.z / 110) - 0.48) * 3.2) * clamp(rg * 1.6) * clamp(0.3 + n.y * 2.0 + 0.4);
    o.lerp(PAL.moss, moss * 0.8);
    const lich = clamp((noise3(v.x / 30 + 9, v.y / 70, v.z / 30) - 0.64) * 5);
    o.lerp(PAL.lichen, lich * 0.6);
  });
  return g;
}

// custom tube with a radius profile and gnarl noise; pts: Vector3[], rf(s) → radius
function gnarlTube(pts, rf, NS, NR, seed, colorFn) {
  const curve = new THREE.CatmullRomCurve3(pts);
  const frames = curve.computeFrenetFrames(NS, false);
  const pos = [], idx = [];
  for (let i = 0; i <= NS; i++) {
    const s = i / NS; const c = curve.getPointAt(s); const N = frames.normals[i], B = frames.binormals[i];
    for (let j = 0; j < NR; j++) {
      const a = j / NR * Math.PI * 2;
      const rr = rf(s) * (1 + 0.18 * (noise3(Math.cos(a) * 1.5 + seed, s * 6, Math.sin(a) * 1.5) - 0.5) + 0.12 * (ridged(a * 3, s * 4, seed) - 0.5));
      pos.push(c.x + (N.x * Math.cos(a) + B.x * Math.sin(a)) * rr, c.y + (N.y * Math.cos(a) + B.y * Math.sin(a)) * rr, c.z + (N.z * Math.cos(a) + B.z * Math.sin(a)) * rr);
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) { const a = i * NR + j, b = i * NR + (j + 1) % NR, c2 = (i + 1) * NR + j, d = (i + 1) * NR + (j + 1) % NR; idx.push(a, c2, b, b, c2, d); }
  // cap at the tip
  const tip = curve.getPointAt(1); const ti = pos.length / 3; pos.push(tip.x, tip.y, tip.z);
  for (let j = 0; j < NR; j++) idx.push(NS * NR + j, ti, NS * NR + (j + 1) % NR);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return setColors(g, colorFn);
}
export function boxG(w, h, d, c, x = 0, y = 0, z = 0, ry = 0) { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y, z); return solid(g, c); }
function cylG(r0, r1, h, c, x = 0, y = 0, z = 0, seg = 8) { const g = new THREE.CylinderGeometry(r0, r1, h, seg); g.translate(x, y + h / 2, z); return solid(g, c); }

// curved hip roof (庑殿/歇山 feel): concave slopes rising from an eave rectangle whose corners lift (飞檐)
export function roofG(w, d, h, lift, c, y = 0) {
  const ridge = Math.max(0, w - d) * 0.5, NP = 40, NV = 6;
  const perim = (u) => {   // eave rectangle perimeter, u in [0,1)
    const L = 2 * (w + d); let s = u * L;
    if (s < w) return [-w / 2 + s, -d / 2]; s -= w;
    if (s < d) return [w / 2, -d / 2 + s]; s -= d;
    if (s < w) return [w / 2 - s, d / 2]; s -= w;
    return [-w / 2, d / 2 - s];
  };
  const pos = [], idx = [];
  for (let i = 0; i < NP; i++) {
    const [x, z] = perim(i / NP);
    const cx = Math.abs(x) / (w / 2), cz = Math.abs(z) / (d / 2); const corner = Math.pow(Math.min(cx, cz), 4);
    const ey = y + lift * corner, ex = x * (1 + 0.08 * corner), ez = z * (1 + 0.08 * corner);
    const rx = Math.max(-ridge, Math.min(ridge, x));
    for (let j = 0; j < NV; j++) { const v = j / (NV - 1); pos.push(lerp(ex, rx, v), ey + (y + h - ey) * Math.pow(v, 1.7), lerp(ez, 0, v)); }
  }
  for (let i = 0; i < NP; i++) { const i2 = (i + 1) % NP; for (let j = 0; j < NV - 1; j++) { const a = i * NV + j, b = i2 * NV + j; idx.push(a, a + 1, b, b, a + 1, b + 1); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const ng = g.toNonIndexed(); ng.computeVertexNormals();
  const parts = [solid(ng, c)];
  parts.push(boxG(ridge * 2 + h * 0.3, h * 0.12, h * 0.12, PAL.gold, 0, y + h + h * 0.03, 0));   // ridge beam
  return merge(parts);
}

// a hall: stone platform, vermilion columns, white walls, curved roof (optionally double-eaved)
export function hallG(w, d, colH, o = {}) {
  const parts = [];
  parts.push(boxG(w * 1.25, colH * 0.25, d * 1.3, PAL.stone, 0, colH * 0.125, 0));
  parts.push(boxG(w * 0.92, colH * 0.9, d * 0.82, PAL.white, 0, colH * 0.25 + colH * 0.45, 0));
  const nc = o.cols ?? 4;
  for (let i = 0; i < nc; i++) { const x = lerp(-w / 2, w / 2, i / (nc - 1)); for (const z of [-d / 2, d / 2]) parts.push(cylG(colH * 0.06, colH * 0.06, colH, PAL.verm, x, colH * 0.25, z, 6)); }
  parts.push(boxG(w * 1.02, colH * 0.12, d * 1.02, PAL.verm, 0, colH * 1.25 - colH * 0.06, 0));
  const ry = colH * 1.25;
  const rc = o.roof || (o.glaze ? PAL.roofGlaze : PAL.roof);
  parts.push(roofG(w * 1.5, d * 1.6, colH * 0.75, colH * 0.32, rc, ry));
  if (o.double) { parts.push(boxG(w * 0.7, colH * 0.5, d * 0.6, PAL.verm, 0, ry + colH * 0.5, 0)); parts.push(roofG(w * 1.0, d * 1.05, colH * 0.6, colH * 0.25, rc, ry + colH * 0.7)); }
  return merge(parts);
}
export function pagodaG(w, tiers, tierH) {
  const parts = [boxG(w * 1.4, tierH * 0.3, w * 1.4, PAL.stone, 0, tierH * 0.15, 0)];
  let y = tierH * 0.3;
  for (let i = 0; i < tiers; i++) {
    const s = 1 - i * 0.14;
    parts.push(boxG(w * s * 0.8, tierH * 0.7, w * s * 0.8, i % 2 ? PAL.white : PAL.verm, 0, y + tierH * 0.35, 0));
    parts.push(roofG(w * s * 1.45, w * s * 1.45, tierH * 0.45, tierH * 0.22, PAL.roof, y + tierH * 0.68));
    y += tierH * 0.95;
  }
  parts.push(cylG(w * 0.04, w * 0.01, tierH * 1.2, PAL.gold, 0, y + tierH * 0.1, 0, 5));
  return merge(parts);
}
// 黄山松: a short trunk with flat layered canopies
export function pineG(h, seed) {
  const r = mulberry32(seed); const parts = [cylG(h * 0.045, h * 0.07, h * 0.75, col(0x4a3f35), 0, 0, 0, 5)];
  const n = 3 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const g = new THREE.IcosahedronGeometry(1, 1); const s = h * (0.42 - i * 0.05) * (0.8 + 0.4 * r());
    g.scale(s, s * 0.28, s * 0.8);
    const a = r() * 6.28, rr = h * 0.18 * r();
    g.translate(Math.cos(a) * rr, h * (0.45 + 0.17 * i), Math.sin(a) * rr);
    parts.push(setColors(g, (v, n, o) => o.copy(PAL.pine).lerp(PAL.pineHi, clamp(n.y * 0.8))));
  }
  return merge(parts);
}

// ─────────────────────────────── karst pillars (张家界): a cluster of irregular rock columns of different heights,
// vertically cracked, with mossy ledges and domed tops; floating ones end in jagged hanging spurs
function columnG(seed, r, h, floating, bottom) {
  const g = new THREE.CylinderGeometry(1, 1, 1, 28, Math.max(12, Math.round(h / (r * 0.35))), false);
  const p = g.attributes.position; const sx = seed * 5.3;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), yy = p.getY(i) + 0.5, z = p.getZ(i); const th = Math.atan2(z, x); const onCap = Math.abs(Math.hypot(x, z) - 1) > 0.01 && (yy > 0.999 || yy < 0.001);
    let rr = onCap ? Math.hypot(x, z) : 1;
    const y = lerp(bottom, h, yy);
    let f = 1 + 0.18 * (ridged(th * 4 + sx, y / (r * 2.2), 1.3) - 0.5) + 0.22 * (fbm3(Math.cos(th) * 1.3 + sx, y / (r * 1.8), Math.sin(th) * 1.3, 3) - 0.5);
    f += 0.05 * Math.sin(y / (r * 0.4) + noise3(th, y / r, sx) * 3);
    const topK = clamp((y - (h - r * 0.6)) / (r * 0.6));                       // round the top
    f *= Math.sqrt(Math.max(0.02, 1 - topK * topK * 0.9));
    let ny = y;
    if (floating) { const bk = clamp((bottom * 0.45 - y) / (-bottom * 0.55)); const spur = Math.pow(Math.max(0, Math.cos(2 * th + sx)) , 2); f *= lerp(1, 0.08 + 0.9 * spur * (1 - bk * 0.7), smooth(bk)); }
    if (yy > 0.999) ny = h + r * 0.15 * (noise3(x * 2 + sx, 1, z * 2) - 0.3);
    p.setXYZ(i, Math.cos(th) * r * f * rr, ny, Math.sin(th) * r * f * rr);
  }
  g.computeVertexNormals();
  return g;
}
export function karstG(seed, R, H, floating = false, depth = 0) {
  const rng = mulberry32(seed); const parts = []; const tops = [];
  const n = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const a = rng() * 6.283, d = i === 0 ? 0 : R * (0.35 + 0.35 * rng());
    const r = R * (i === 0 ? 0.62 : 0.3 + 0.25 * rng()); const h = H * (i === 0 ? 1 : 0.55 + 0.4 * rng());
    const bottom = floating ? -depth * (i === 0 ? 1 : 0.5 + 0.4 * rng()) : -400;
    const g = columnG(seed * 13 + i, r, h, floating, bottom); g.translate(Math.cos(a) * d, 0, Math.sin(a) * d);
    parts.push(g); { const tv = V3(Math.cos(a) * d, h, Math.sin(a) * d); tv.r = r; tops.push(tv); }
  }
  const geo = merge(parts.map(g => setColors(g, (v, nn, out) => {
    if (nn.y > 0.55) { out.copy(PAL.grass).lerp(PAL.pine, clamp(noise3(v.x / 15, v.y / 15, v.z / 15) * 1.3 - 0.2)); return; }
    const crack = ridged(Math.atan2(v.z, v.x) * 9 + seed, v.y / 90, 4.3);
    out.copy(PAL.rockLit).lerp(PAL.rockMid, clamp(1 - (v.y + 200) / (H + 200)) * 0.8);
    out.multiplyScalar(0.75 + 0.35 * crack);
    if (nn.y > 0.15) out.lerp(PAL.moss, 0.65);
  })));
  return { geo, tops };
}
const V3k = (x, y, z) => new THREE.Vector3(x, y, z);
export function islandGeom(seed, R, depth, o = {}) {
  const k = karstG(seed, R, R * 0.5, true, depth);
  k.geo.userData.tops = k.tops; return k.geo;
}

// an island with dressing; returns Group. topY of plateau ≈ top
export function buildIsland(seed, R, depth, o = {}) {
  const grp = new THREE.Group(); const rng = mulberry32(seed * 7 + 3);
  const rockMat = o.mat || ISLAND_MAT;
  const geo = islandGeom(seed, R, depth, o);
  const m = new THREE.Mesh(geo, rockMat); grp.add(m);
  const top = o.topH ?? R * 0.12;
  // pines crowding each column top (the bumpy tree line is the karst silhouette)
  const pines = []; const tops = geo.userData.tops || [];
  for (const tp of tops) { const np = Math.round(4 + tp.r / 9); for (let i = 0; i < np; i++) { const a = rng() * 6.28, rr = tp.r * 0.75 * Math.sqrt(rng()); pines.push([tp.x + Math.cos(a) * rr, tp.y - 2 + (1 - rr / tp.r) * tp.r * 0.05, tp.z + Math.sin(a) * rr, (tp.r * 0.16 + 5) * (0.6 + 0.8 * rng()), rng() * 6.28]); } }
  if (pines.length) {
    const pg = pineG(1, seed); const im = new THREE.InstancedMesh(pg, PINE_MAT, pines.length); const mm = new THREE.Matrix4();
    pines.forEach(([x, y, z, s, a], i) => { mm.compose(new THREE.Vector3(x, y - s * 0.1, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a), new THREE.Vector3(s, s, s)); im.setMatrixAt(i, mm); });
    grp.add(im);
  }
  // halls / pagoda
  if (o.halls) for (const hdef of o.halls) {
    const g = hdef.pagoda ? pagodaG(hdef.w, hdef.tiers || 4, hdef.h) : hallG(hdef.w, hdef.d || hdef.w * 0.6, hdef.h, hdef);
    const t0 = (geo.userData.tops || [])[0]; const hy = t0 ? t0.y - 4 : top * 0.75;
    const hm = new THREE.Mesh(g, HALL_MAT); hm.position.set(hdef.x * R * 0.5 + (t0 ? t0.x : 0), hy + (hdef.dy || 0), hdef.z * R * 0.5 + (t0 ? t0.z : 0)); hm.rotation.y = hdef.ry || 0; grp.add(hm);
  }
  grp.userData = { R, depth, top };
  return grp;
}

export const ISLAND_MAT = paintMat({ brushScale: 0.035, stretch: [1, 2.6, 1], brush: 0.18, rim: 0.55, rock: 1.0 });
export const PINE_MAT = paintMat({ brushScale: 0.2, brush: 0.15, rim: 0.4, wrap: 0.5 });
export const HALL_MAT = paintMat({ brushScale: 0.08, brush: 0.08, rim: 0.35, wrap: 0.3, side: THREE.DoubleSide });
export const TRUNK_MAT = paintMat({ brushScale: 0.03, stretch: [2.5, 0.25, 2.5], brush: 0.25, rim: 0.6, wrap: 0.4 });
export const BEAM_MAT = paintMat({ brushScale: 0.05, stretch: [0.4, 1, 0.4], brush: 0.2, rim: 0.5 });
export const PEAK_MAT = paintMat({ brushScale: 0.012, stretch: [1, 3, 1], brush: 0.2, rim: 0.5, wrap: 0.4, rock: 0.8 });

// ─────────────────────────────── the tree-ladder assembly
// branch template: a thick gnarled limb rising at the end (九欘), a stair with vermilion rails along its top, a twig branching
// off mid-way, a vermilion-roofed hall at the tip, jade canopies glowing at both ends, lanterns underneath
function canopyG(c, sz, rng) {
  const parts = [];
  for (let i = 0; i < 6; i++) { const g = new THREE.IcosahedronGeometry(1, 2); const s = sz * (0.55 + 0.45 * rng()); g.scale(s, s * 0.42, s * 0.85); g.rotateY(rng() * 6.28);
    g.translate(c.x + (rng() - 0.5) * sz * 1.1, c.y + (rng() - 0.2) * sz * 0.45, c.z + (rng() - 0.5) * sz * 1.1);
    parts.push(setColors(g, (v, n, o) => { o.copy(col(0x2f8a6c)).lerp(col(0x9fe6c2), clamp(n.y * 0.8 + 0.1 + (noise3(v.x / 9, v.y / 9, v.z / 9) - 0.5) * 0.6)); })); }
  return merge(parts);
}
function branchTemplate(L, seed) {
  const R = TRUNK.R; const rng = mulberry32(seed);
  const rise = L * (0.3 + 0.12 * rng()); const sway = (rng() - 0.5) * L * 0.25;
  const pts = [V3(R * 0.5, -30, 0), V3(R + L * 0.25, 10, sway * 0.2), V3(R + L * 0.6, rise * 0.25, sway * 0.7), V3(R + L * 0.88, rise * 0.7, sway), V3(R + L, rise, sway * 0.9)];
  const r0 = 100 + 18 * rng(), r1 = 26;
  const rf = s => lerp(r0, r1, Math.pow(s, 0.75)) * (s < 0.06 ? 1 + (0.06 - s) * 9 : 1);
  const barkCol = (v, n, o) => { o.copy(PAL.bark).lerp(PAL.barkHi, clamp(0.5 + n.y * 0.5)); o.lerp(PAL.moss, clamp(n.y * 1.5 - 0.45) * 0.85); o.lerp(col(0x2b2c28), clamp(-n.y) * 0.3); };
  const parts = [gnarlTube(pts, rf, 44, 16, seed, barkCol)];
  const curve = new THREE.CatmullRomCurve3(pts);
  // twig
  const s0 = 0.5 + 0.1 * rng(); const tp = curve.getPointAt(s0); const tdir = V3(0.3, 0.9, (rng() - 0.5) * 1.2).normalize();
  const twigPts = [tp.clone(), tp.clone().addScaledVector(tdir, L * 0.18).add(V3(0, 0, 0)), tp.clone().addScaledVector(tdir, L * 0.36).add(V3(L * 0.08, 0, 0))];
  parts.push(gnarlTube(twigPts, s => lerp(rf(s0) * 0.5, 12, s), 14, 10, seed + 5, barkCol));
  const twigEnd = twigPts[2];
  // stair + rails along the top of the main limb
  const stairPts = [];
  for (let i = 3; i <= 40; i++) {
    const s = i / 44; const c = curve.getPointAt(s); const rr = rf(s) * 0.93; const tan = curve.getTangentAt(s);
    const yaw = Math.atan2(-tan.z, tan.x);
    parts.push(boxG(12, 2.4, 14, PAL.stone, c.x, c.y + rr + 1.2, c.z, yaw));
    stairPts.push(V3(c.x, c.y + rr + 3, c.z));
    if (i % 2 === 0) for (const zz of [-7.5, 7.5]) { const off = V3(-Math.sin(yaw) * 0, 0, 0); parts.push(boxG(1.5, 7, 1.5, PAL.verm, c.x + Math.sin(yaw) * zz, c.y + rr + 5, c.z + Math.cos(yaw) * zz)); }
  }
  for (const zz of [-7.5, 7.5]) { const rp = []; for (let i = 3; i <= 40; i += 3) { const s = i / 44; const c = curve.getPointAt(s); const tan = curve.getTangentAt(s); const yaw = Math.atan2(-tan.z, tan.x); rp.push(V3(c.x + Math.sin(yaw) * zz, c.y + rf(s) * 0.93 + 8.5, c.z + Math.cos(yaw) * zz)); }
    parts.push(solid(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp), 30, 0.9, 4, false), PAL.verm)); }
  // tip: platform, hall (vermilion roof, gold ridge), jade canopy behind; canopy on the twig
  const tip = curve.getPointAt(1);
  parts.push(boxG(64, 8, 50, PAL.stone, tip.x - 8, tip.y + r1 * 0.6, tip.z));
  const h = hallG(40, 28, 15, { double: true, roof: rng() < 0.6 ? col(0xb2402a) : PAL.roofGlaze }); h.translate(tip.x - 8, tip.y + r1 * 0.6 + 4, tip.z); parts.push(h);
  const canopies = [canopyG(tip.clone().add(V3(40, 50, 0)), 120, rng), canopyG(twigEnd.clone().add(V3(0, 30, 0)), 100, rng)];
  const lanterns = [0.25, 0.45, 0.65, 0.85].map(s => { const c = curve.getPointAt(s); return V3(c.x, c.y - rf(s) - 10, c.z); });
  lanterns.push(tip.clone().add(V3(-30, -6, 22)), tip.clone().add(V3(-30, -6, -22)), tip.clone().add(V3(14, -6, 22)), tip.clone().add(V3(14, -6, -22)));
  return { geo: merge(parts), canopy: merge(canopies), tip, lanterns, stairPts };
}

export function buildJianmu() {
  const { R, y0, breakY, y1, rungStep, rungY0 } = TRUNK;
  const lower = new THREE.Group(), upper = new THREE.Group();
  lower.add(new THREE.Mesh(trunkGeom(y0, breakY, true, false, 11), TRUNK_MAT));
  upper.add(new THREE.Mesh(trunkGeom(breakY, y1, false, true, 12), TRUNK_MAT));
  const sleeve = new THREE.Mesh(trunkGeom(breakY - 300, breakY + 300, false, false, 13), TRUNK_MAT);
  sleeve.scale.set(1.012, 1, 1.012); lower.add(sleeve);
  const splinters = new THREE.Group(); lower.add(splinters); splinters.visible = false;
  {
    const rng = mulberry32(77); const parts = []; const o = axisOff(breakY);
    for (let i = 0; i < 40; i++) { const a = rng() * 6.28, rr = R * (0.5 + 0.5 * rng()); const h = 80 + 300 * rng() * rng(); const g = new THREE.ConeGeometry(14 + 26 * rng(), h, 5); g.rotateZ((rng() - 0.5) * 0.5); g.rotateX((rng() - 0.5) * 0.5); g.translate(o.x + Math.cos(a) * rr, breakY - 80 + h / 2, o.z + Math.sin(a) * rr); parts.push(solid(g, col(0xc9b48c).lerp(col(0xeadbb8), rng()))); }
    splinters.add(new THREE.Mesh(merge(parts), TRUNK_MAT));
  }
  const tpls = [0, 1, 2, 3, 4].map(i => branchTemplate(470 + 90 * (i % 3), 100 + i));
  const levels = []; for (let y = rungY0; y < y1 - 400; y += rungStep) levels.push(y);
  const lists = { lower: tpls.map(() => []), upper: tpls.map(() => []) };
  const lantern = { lower: [], upper: [] };
  const rungInfo = [];
  levels.forEach((y, k) => {
    const key = y < breakY - 120 ? 'lower' : 'upper';
    const ang = k * (Math.PI + 0.55) + 0.2 * Math.sin(k * 1.7);
    const ti = (k * 3) % tpls.length; const T = tpls[ti];
    const o = axisOff(y);
    const m = new THREE.Matrix4().compose(V3(o.x, y, o.z), new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), ang), V3(1, 1, 1));
    lists[key][ti].push(m);
    for (const lp of T.lanterns) lantern[key].push(new THREE.Matrix4().compose(lp.clone().applyMatrix4(m), new THREE.Quaternion(), V3(5, 7, 5)));
    rungInfo.push({ y, end: T.tip.clone().applyMatrix4(m), upper: key === 'upper', ang, m, ti });
  });
  const lanternMat = glowMat(0xffb35c, { k: 1.6 });
  const lanternG = new THREE.SphereGeometry(1, 8, 6);
  for (const [key, grp] of [['lower', lower], ['upper', upper]]) {
    tpls.forEach((T, i) => { const L = lists[key][i]; if (!L.length) return;
      const im = new THREE.InstancedMesh(T.geo, BRANCH_MAT, L.length); L.forEach((m, j) => im.setMatrixAt(j, m)); im.frustumCulled = false; grp.add(im);
      const ic = new THREE.InstancedMesh(T.canopy, CANOPY_MAT, L.length); L.forEach((m, j) => ic.setMatrixAt(j, m)); ic.frustumCulled = false; grp.add(ic); });
    const LL = lantern[key]; const im = new THREE.InstancedMesh(lanternG, lanternMat, LL.length); LL.forEach((m, j) => im.setMatrixAt(j, m)); im.frustumCulled = false; grp.add(im);
  }
  // spiral stair (栈道) wrapping the trunk with a vermilion railing
  const pitch = 620;
  const stairAt = (y, dr = 0) => { const a = (y / pitch) * Math.PI * 2; const o = axisOff(y); const r = trunkRadius(a, y) + 14 + dr; return V3(o.x + Math.cos(a) * r, y, o.z + Math.sin(a) * r); };
  const stair = (ya, yb) => {
    const turns = (yb - ya) / pitch, N = Math.ceil(turns * 260); const pos = [], cols = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const y = lerp(ya, yb, i / N); const pi = stairAt(y, -12), po = stairAt(y, 8);
      for (const [p, dy, c] of [[pi, 0, PAL.stone], [po, 0, PAL.stone], [po, 6, PAL.verm], [po.clone().add(V3(0, 0, 0)).multiplyScalar(1), 7.5, PAL.verm]]) { pos.push(p.x, p.y + dy, p.z); cols.push(c.r, c.g, c.b); }
      if (i < N) { const b = i * 4; idx.push(b, b + 4, b + 1, b + 1, b + 4, b + 5, b + 2, b + 6, b + 3, b + 3, b + 6, b + 7, b + 1, b + 5, b + 2, b + 2, b + 5, b + 6); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setIndex(idx); g.computeVertexNormals();
    return new THREE.Mesh(g, paintMat({ brush: 0.05, rim: 0.3, side: THREE.DoubleSide }));
  };
  lower.add(stair(-100, breakY - 100)); upper.add(stair(breakY + 100, y1 - 500));
  return { lower, upper, sleeve, splinters, levels, rungInfo, tpls, stairPoint: (y) => stairAt(y, -2).add(V3(0, 4, 0)) };
}
export const CANOPY_MAT = paintMat({ brushScale: 0.08, brush: 0.18, rim: 1.4, wrap: 0.7, emissive: 0.16 });
export const BRANCH_MAT = paintMat({ brushScale: 0.04, stretch: [0.5, 1.5, 0.5], brush: 0.22, rim: 0.55, wrap: 0.4 });

// ─────────────────────────────── pillar peaks (张家界 / 黄山) rising from the cloud sea
export function peakGeom(seed, r, h) {
  const g = new THREE.CylinderGeometry(r * 0.7, r, h, 28, 26, false);
  g.translate(0, h / 2, 0);
  const p = g.attributes.position; const sx = seed * 13.1;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const th = Math.atan2(z, x); let rr = Math.hypot(x, z);
    const k = y / h;
    rr *= 1 + 0.42 * (fbm3(Math.cos(th) * 1.5 + sx, y / (r * 2.5), Math.sin(th) * 1.5, 4) - 0.5) + 0.3 * (ridged(th * 5 + sx, y / (r * 1.2), 2) - 0.5) + 0.12 * (Math.sin(y / (r * 0.35) + noise3(th * 3, y / r, sx) * 4) * 0.5);
    if (k > 0.94) rr *= lerp(1, 0.55, (k - 0.94) / 0.06);
    let ny = y; if (k > 0.99) ny = h + (noise3(x / r * 3 + sx, 0, z / r * 3) - 0.3) * r * 0.9;
    p.setXYZ(i, Math.cos(th) * rr, ny, Math.sin(th) * rr);
  }
  g.computeVertexNormals();
  return setColors(g, (v, n, o) => {
    if (n.y > 0.6) { o.copy(PAL.pine).lerp(PAL.grass, 0.4); return; }
    o.copy(PAL.rockLit).lerp(PAL.rockLow, clamp(1 - v.y / h) * 0.7);
    o.multiplyScalar(0.85 + 0.25 * noise3(v.x / 20, v.y / 60, v.z / 20));
    if (n.y > 0.25) o.lerp(PAL.moss, 0.6);
  });
}
export function buildPeaks(seed, n, rMin, rMax, center = new THREE.Vector3(), opts = {}) {
  const rng = mulberry32(seed); const grp = new THREE.Group();
  const tpl = []; for (let i = 0; i < 5; i++) tpl.push(karstG(seed * 7 + i, 1, 1.0, false).geo);
  // unit templates: radius 1, height 1 (+ base below); scale per instance (w, h, w)
  const lists = tpl.map(() => []);
  for (let i = 0; i < n; i++) {
    const a = (opts.a0 ?? 0) + rng() * (opts.arc ?? Math.PI * 2), d = lerp(rMin, rMax, Math.sqrt(rng()));
    const wd = (opts.wMin ?? 70) + rng() * (opts.wVar ?? 220), h = (opts.hMin ?? 250) + rng() * rng() * (opts.hVar ?? 1500);
    const x = center.x + Math.cos(a) * d, z = center.z + Math.sin(a) * d;
    lists[i % tpl.length].push(new THREE.Matrix4().compose(new THREE.Vector3(x, (opts.y ?? -60), z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rng() * 6.28), new THREE.Vector3(wd, h, wd)));
  }
  tpl.forEach((g, i) => { if (!lists[i].length) return; const im = new THREE.InstancedMesh(g, PEAK_MAT, lists[i].length); lists[i].forEach((m, j) => im.setMatrixAt(j, m)); im.frustumCulled = false; grp.add(im); });
  return grp;
}

// ─────────────────────────────── chains: instanced links along a curve
export const LINK_G = solid(new THREE.TorusGeometry(1, 0.26, 6, 14), col(0x4c5552));
LINK_G.scale(1, 1.45, 1);
export const CHAIN_MAT = paintMat({ brushScale: 0.3, brush: 0.2, rim: 0.7, wrap: 0.3 });
export class Chain {
  constructor(maxLinks, linkR) { this.im = new THREE.InstancedMesh(LINK_G, CHAIN_MAT, maxLinks); this.im.frustumCulled = false; this.r = linkR; this.max = maxLinks; this.im.count = 0; this.im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); }
  // pts: function(s in 0..1) → Vector3; length in m
  layout(fn, length) {
    const step = this.r * 2.0; const n = Math.min(this.max, Math.floor(length / step));
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), s = new THREE.Vector3(this.r, this.r, this.r);
    for (let i = 0; i < n; i++) {
      const a = fn(i / n), b = fn((i + 1) / n); const d = b.clone().sub(a).normalize();
      q.setFromUnitVectors(up, d); q2.setFromAxisAngle(up, (i % 2) * Math.PI / 2); q.multiply(q2);
      m.compose(a.clone().lerp(b, 0.5), q, s); this.im.setMatrixAt(i, m);
    }
    this.im.count = n; this.im.instanceMatrix.needsUpdate = true;
  }
}
export const catenary = (A, B, sag) => s => { const p = A.clone().lerp(B, s); p.y -= sag * 4 * s * (1 - s); return p; };

// ─────────────────────────────── colossal ancient sword (剑冢)
export function giantSwordG(L) {
  const parts = [];
  // blade: diamond cross-section, tapering to a point (along -y)
  const bw = L * 0.06, bt = L * 0.012, n = 12; const pos = [], idx = [];
  for (let i = 0; i <= n; i++) { const k = i / n; const y = -k * L; const w = bw * (k < 0.85 ? 1 - 0.15 * k : (1 - k) / 0.15 * 0.87); pos.push(-w, y, 0, 0, y, bt, w, y, 0, 0, y, -bt); }
  for (let i = 0; i < n; i++) { const a = i * 4, b = a + 4; for (let j = 0; j < 4; j++) { const j2 = (j + 1) % 4; idx.push(a + j, b + j, a + j2, a + j2, b + j, b + j2); } }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setIndex(idx);
  const blade = bg.toNonIndexed(); blade.computeVertexNormals();
  parts.push(setColors(blade, (v, nn, o) => { o.copy(col(0x6f8a86)).lerp(col(0xc7c3a8), clamp(Math.abs(v.x) / bw * 0.4)); o.lerp(PAL.moss, clamp((noise3(v.x / 20, v.y / 40, 1) - 0.55) * 3) * 0.7); }));
  parts.push(boxG(L * 0.26, L * 0.035, L * 0.06, col(0x8a7344), 0, L * 0.015, 0));
  parts.push(cylG(L * 0.018, L * 0.022, L * 0.2, col(0x4a3a2c), 0, L * 0.03, 0, 8));
  const pom = new THREE.SphereGeometry(L * 0.035, 10, 8); pom.translate(0, L * 0.245, 0); parts.push(solid(pom, col(0x8a7344)));
  return merge(parts);
}
