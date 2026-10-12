// 御剑 YUJIAN — the timeline. applyShot(t) places the camera, lights the world, and returns per-frame state.
// Grid: 80 BPM → beat 0.75 s, bar 3 s. Beat sheet: ../CONCEPT.md
import * as THREE from 'three';
import { clamp, lerp, seg, smooth, smoother, easeOut, easeIn, easeInOut, easeInOutSine, mulberry32, track, W, H } from './util.js';
import { ENV, SKY } from './materials.js';
import { CLOUD, SEA } from './clouds.js';
import { GRADE } from './post.js';
import { Captions } from './text.js';
import { TRUNK, axisOff } from './world.js';
import { SECT } from './scene.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const C = (h) => new THREE.Color(h);
const caps = new Captions();

// ───────────────────────── light presets (all colours sRGB-ish display values)
const P = {
  dawn: { sun: [-0.36, 0.42, -0.83], sunCol: 0xffcf8c, sunK: 1.55, skyAmb: 0x3d6874, groundAmb: 0x4a5049, rim: 0xffcf80, fog: 0xd2dcd3, fogSun: 0xf2dfba, fogDen: 0.00008, fogH: 200, fogFall: 500, fogStart: 700,
    zen: 0x86aeba, hor: 0xe9e4d2, voidc: 0xbccac8, glow: 0xffd08a, lit: 0xfff4e4, shade: 0xa4b5c0, crim: 0xffd48a, seaVoid: 0x93a6b2 },
  cold: { sun: [-0.2, 0.42, -0.88], sunCol: 0xc9d3d2, sunK: 0.75, skyAmb: 0x93abb0, groundAmb: 0x5f6f70, rim: 0xd8e0de, fog: 0xc9d5d4, fogSun: 0xdfe5e2, fogDen: 0.00022, fogH: 250, fogFall: 600,
    zen: 0x8fa7ad, hor: 0xd6dedb, voidc: 0xb3c2c2, glow: 0xe4e8e2, lit: 0xe7ecea, shade: 0x9aabae, crim: 0xe0e6e2, seaVoid: 0x9fb2b4 },
  sect: { sun: [0.55, 0.38, -0.74], sunCol: 0xe6ddc8, sunK: 0.95, skyAmb: 0x7a929a, groundAmb: 0x55605e, rim: 0xf1e2c0, fog: 0xccd8d6, fogSun: 0xe9e6da, fogDen: 0.00019, fogH: 300, fogFall: 700,
    zen: 0x93acb2, hor: 0xdde3dd, voidc: 0xb5c4c3, glow: 0xf0e8d4, lit: 0xeef1ec, shade: 0x9fb1b3, crim: 0xf2e8d2, seaVoid: 0xa7b9ba },
  flight: { sun: [-0.35, 0.55, -0.76], sunCol: 0xffdcaa, sunK: 1.3, skyAmb: 0x6c8b95, groundAmb: 0x5e6460, rim: 0xffe0a0, fog: 0xd8e6e2, fogSun: 0xfff0cc, fogDen: 0.00017, fogH: 300, fogFall: 700,
    zen: 0x98bec4, hor: 0xeef2e6, voidc: 0xc6d6d3, glow: 0xffefc4, lit: 0xfcf8ee, shade: 0xaec3c4, crim: 0xfff0c8, seaVoid: 0xb0c6c7 },
  storm: { sun: [-0.2, 0.6, -0.77], sunCol: 0x5d7a84, sunK: 0.5, skyAmb: 0x2f4c56, groundAmb: 0x1d2f36, rim: 0x9fc0c8, fog: 0x1f3c47, fogSun: 0x2e4f5a, fogDen: 0.00035, fogH: 300, fogFall: 900,
    zen: 0x0f2630, hor: 0x2a4a55, voidc: 0x1c3640, glow: 0x3f5f68, lit: 0x587a83, shade: 0x1a323b, crim: 0x86a6ae, seaVoid: 0x16303a },
  gold: { sun: [0.21, 0.235, -0.95], sunCol: 0xffc878, sunK: 1.3, skyAmb: 0x5f7380, groundAmb: 0x6e5c4e, rim: 0xffcf70, fog: 0xd6bb94, fogSun: 0xffd08a, fogDen: 0.00004, fogH: 4250, fogFall: 260, high: 0,
    zen: 0x5d88a3, hor: 0xe8c592, voidc: 0xc9ab84, glow: 0xffc46a, lit: 0xf8e2b8, shade: 0xb79f92, crim: 0xffd27e, seaVoid: 0xb29a88 },
};
const tmpA = new THREE.Color(), tmpB = new THREE.Color();
function setEnv(a, b = a, k = 0) {
  const lc = (u, x, y) => u.value.copy(tmpA.set(x)).lerp(tmpB.set(y), k);
  ENV.uSunDir.value.set(...a.sun.map((v, i) => lerp(v, b.sun[i], k))).normalize();
  lc(ENV.uSunCol, a.sunCol, b.sunCol); ENV.uSunCol.value.multiplyScalar(lerp(a.sunK, b.sunK, k));
  lc(ENV.uSkyAmb, a.skyAmb, b.skyAmb); lc(ENV.uGroundAmb, a.groundAmb, b.groundAmb); lc(ENV.uRimCol, a.rim, b.rim);
  lc(ENV.uFogCol, a.fog, b.fog); lc(ENV.uFogSunCol, a.fogSun, b.fogSun);
  ENV.uFogDen.value = lerp(a.fogDen, b.fogDen, k); ENV.uFogHeight.value = lerp(a.fogH, b.fogH, k); ENV.uFogHeightFall.value = lerp(a.fogFall, b.fogFall, k);
  lc(SKY.uZenith, a.zen, b.zen); lc(SKY.uHorizon, a.hor, b.hor); lc(SKY.uVoid, a.voidc, b.voidc); lc(SKY.uSunGlow, a.glow, b.glow);
  lc(CLOUD.uLit, a.lit, b.lit); lc(CLOUD.uShade, a.shade, b.shade); lc(CLOUD.uCloudRim, a.crim, b.crim); lc(SEA.uVoidCol, a.seaVoid, b.seaVoid);
  ENV.uFogMax.value = 1.0; ENV.uFogSunPow.value = 10; ENV.uFogStart.value = lerp(a.fogStart ?? 300, b.fogStart ?? 300, k); ENV.uFlashCol.value.set(0, 0, 0); ENV.uHighFog.value = lerp(a.high ?? 0.85, b.high ?? 0.85, k); ENV.uHighFogY.value = lerp(a.highY ?? 4800, b.highY ?? 4800, k);
}
function grade(o = {}) {
  GRADE.uExposure.value = o.exp ?? 1.0; GRADE.uBloom.value = o.bloom ?? 0.35; GRADE.uBloomThresh.value = o.thresh ?? 0.8;
  GRADE.uLift.value.set(...(o.lift ?? [0.0, 0.0, 0.0])); GRADE.uGamma.value.set(...(o.gamma ?? [1, 1, 1])); GRADE.uGain.value.set(...(o.gain ?? [1, 1, 1]));
  GRADE.uSat.value = o.sat ?? 1.05; GRADE.uChroma.value = o.chroma ?? 0.0016; GRADE.uVignette.value = o.vig ?? 0.2; GRADE.uGrain.value = o.grain ?? 0.03;
  GRADE.uPaper.value = o.paper ?? 0.03; GRADE.uContrast.value = o.contrast ?? 1.1; GRADE.uRayThresh.value = o.rayThresh ?? 0.9; GRADE.uFlash.value.set(...(o.flashCol ?? [1, 0.96, 0.86]), o.flash ?? 0); GRADE.uFade.value = o.fade ?? 0;
}
function aim(cam, pos, target, fov = 50, roll = 0, near = 2) {
  cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(target);
  if (roll) cam.rotateZ(roll);
  if (cam.fov !== fov || cam.near !== near) { cam.fov = fov; cam.near = near; cam.updateProjectionMatrix(); }
}
// screen-left vector for a camera looking from p to q (horizontal)
function leftOf(p, q) { const f = q.clone().sub(p); f.y = 0; f.normalize(); return V(f.z, 0, -f.x); }
function shake(t, t0, amp, dur = 0.8) { if (t < t0 || t > t0 + dur) return V(0, 0, 0); const k = 1 - (t - t0) / dur; const a = amp * k * k; return V(Math.sin(t * 61) * a, Math.sin(t * 47 + 1) * a, Math.sin(t * 53 + 2) * a); }

// ───────────────────────── shared cloud sets
const R = (s) => mulberry32(s);
function wispsAround(seed, n, center, rad, yMin, yMax, wMin, wMax, op = 0.7, bands = 0.4) {
  const r = R(seed); const out = [];
  for (let i = 0; i < n; i++) {
    const a = r() * 6.283, d = Math.sqrt(r()) * rad; const w = lerp(wMin, wMax, r()); const band = r() < bands;
    out.push({ p: V(center.x + Math.cos(a) * d, lerp(yMin, yMax, r()), center.z + Math.sin(a) * d), w: band ? w * 2.4 : w, h: band ? w * 0.3 : w * 0.5, cell: band ? 8 + Math.floor(r() * 4) : (r() < 0.5 ? 12 + Math.floor(r() * 4) : Math.floor(r() * 8)), op: op * (0.6 + 0.4 * r()), flip: r() < 0.5 });
  }
  return out;
}
let _c1 = null;
// mist bands wrapping the trunk at several heights (so it vanishes into haze above and below)
function trunkBands() { const r = R(19); const out = []; for (const y of [650, 1500, 2900, 4300, 5600]) for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + r(); const d = 330 + 160 * r(); const o = axisOff(y); const wd = 500 + 400 * r(); out.push({ p: V(o.x + Math.cos(a) * d, y + (r() - 0.5) * 80, o.z + Math.sin(a) * d), w: wd, h: wd * 0.3, cell: 12 + Math.floor(r() * 4), op: 0.35 + 0.2 * r(), flip: r() < 0.5 }); } return out; }
function ringClouds(seed, n, c, r0, r1, w0, w1, op = 0.95) { const r = R(seed); const out = []; for (let i = 0; i < n; i++) { const a = i / n * 6.283 + r() * 0.3, d = lerp(r0, r1, r()); const w = lerp(w0, w1, r()); out.push({ p: V(c.x + Math.cos(a) * d, c.y + r() * 60, c.z + Math.sin(a) * d), w, h: w * 0.45, cell: Math.floor(r() * 8), op, flip: r() < 0.5 }); } return out; }

// ───────────────────────── shots
function intact(w) { const j = w.jm; j.upper.visible = true; j.upper.position.set(0, 0, 0); j.upper.rotation.set(0, 0, 0); j.sleeve.visible = true; j.splinters.visible = false; }
const SHOTS = [];
function shot(t0, t1, fn) { SHOTS.push({ t0, t1, fn }); }

// S1 · 0–3 · hook: tilt up the colossal trunk out of the cloud sea (高远)
const S1cam = V(-3500, 520, 3800);
shot(0, 3, (t, w, cam, st) => {
  setEnv(P.dawn); grade({ exp: 0.97, bloom: 0.35, contrast: 1.15, rayThresh: 0.9 }); st.rays = 0.4;
  const k = easeInOutSine(seg(t, 0, 3.6));
  const pos = S1cam.clone().add(V(80 * k, 260 * k, -120 * k));
  const L = leftOf(pos, V(0, 0, 0));
  const tgt = V(0, lerp(120, 5200, k), 0).addScaledVector(L, lerp(900, 1150, k));
  aim(cam, pos, tgt, 52);
  intact(w);
  st.cranes = [
    { c: V(-3240, 650, 3460), v: V(16, 2.5, -6), n: 7, spread: 22, size: 2.6, seed: 3, t0: 0 },
    { c: V(-2950, 900, 3150), v: V(12, 2, -8), n: 6, spread: 34, size: 2.6, seed: 5, t0: 0 },
  ];
  if (!_c1) _c1 = w.baseClouds.concat(wispsAround(11, 14, V(-900, 0, 1300), 900, 350, 1500, 160, 420, 0.4, 0.0), ringClouds(12, 12, V(0, 40, 0), 420, 760, 600, 1100, 0.9), trunkBands());
  st.clouds = _c1;
  st.caps = [
    { text: '传说，', t0: 0.25, t1: 2.75, x: 300, y: 300, size: 66, align: 'left' },
    { text: '上古有一架天梯。', t0: 0.55, t1: 2.75, x: 300, y: 400, size: 66, align: 'left' },
    { text: '建木', t0: 1.3, t1: 5.7, x: 980, y: 760, size: 40, vertical: true, spacing: 0.5, color: '#3b5156', rule: [980, 840, 980, 1000] },
  ];
});


// ───────────────────────── helpers for the later shots
const GOLD = C(0xffe2a0), WHITEGOLD = C(0xfff4d6), CYAN = C(0xbff4ff), SWORD = C(0xd8fbff);
const ray = new THREE.Raycaster();
function groundY(obj, x, z) { ray.set(V(x, 5000, z), V(0, -1, 0)); const h = ray.intersectObject(obj, true); return h.length ? h[0].point.y : null; }
let EDGE = null;
function sectEdge(w) {
  if (EDGE) return EDGE;
  const c = SECT.p; const dir = V(-c.x, 0, -c.z).normalize();          // toward the trunk
  w.sect.updateMatrixWorld(true);
  const rock = w.sect.children[0];
  // walk outward until the ground drops: the cliff lip
  let lip = null, lipY = null;
  for (let r = 150; r < 420; r += 2) { const x = c.x + dir.x * r, z = c.z + dir.z * r; const y = groundY(rock, x, z); if (y === null || (lipY !== null && y < lipY - 25)) break; lip = V(x, y, z); lipY = y; }
  const stand = lip.clone().addScaledVector(dir, -9); stand.y = groundY(rock, stand.x, stand.z);
  EDGE = { dir, lip, stand, left: V(dir.z, 0, -dir.x) };
  return EDGE;
}
// god lights along the stair (gold) — some climbing, some descending
function godLights(fx, t, k = 1, scatterT = null) {
  const r = R(77);
  for (let i = 0; i < 70; i++) {
    const up = i % 3 !== 0; const v = (up ? 1 : -1) * (55 + 40 * r()); const y0 = 300 + r() * 2400;
    let y = 200 + ((y0 + v * t) % 2200 + 2200) % 2200;
    let p = fx.jm.stairPoint(y);
    let fade = k;
    if (scatterT !== null && t > scatterT) { const d = t - scatterT; p = p.clone().add(V(0, d * d * (120 + 160 * r()), 0)).addScaledVector(V(p.x, 0, p.z).normalize(), d * 80); fade *= Math.max(0, 1 - d / (1.2 + r())); }
    if (fade <= 0.01) continue;
    const sz = 9 + 6 * r();
    fx.points.add(p, sz * 2.4, WHITEGOLD, 0.9 * fade);
    const back = fx.jm.stairPoint(y - v * 0.18);
    fx.lines.add(back, p, 1.5, 3.5, GOLD, 0.0, 0.8 * fade);
  }
  // lights flying between branch tips (arcs upward)
  for (let i = 0; i < 18; i++) {
    const e = fx.jm.rungInfo[(i * 5) % fx.jm.rungInfo.length]; const ph = ((t * 0.35 + r()) % 1);
    const A = e.end.clone().add(V(0, 20, 0)), B = V(0, e.y + 300, 0).add(V(e.end.x * 0.4, 0, e.end.z * 0.4));
    const p = A.clone().lerp(B, ph); p.y += Math.sin(ph * Math.PI) * 120;
    let fade = k * Math.sin(ph * Math.PI);
    if (scatterT !== null && t > scatterT) fade *= Math.max(0, 1 - (t - scatterT) / 1.0);
    if (fade > 0.01) fx.points.add(p, 22, WHITEGOLD, 0.8 * fade);
  }
}
// rising sword-lights (other cultivators): streaks from below toward a convergence point
function swordSwarm(fx, t, o) {
  const r = R(o.seed || 9);
  for (let i = 0; i < o.n; i++) {
    const t0 = o.t0 + r() * o.spread; const a = r() * 6.283, d = lerp(o.rMin, o.rMax, Math.sqrt(r()));
    const start = V(o.c.x + Math.cos(a) * d, lerp(o.yMin, o.yMax, r()), o.c.z + Math.sin(a) * d);
    const sp = lerp(o.vMin, o.vMax, r()); const dt = t - t0; if (dt < 0) continue;
    const dir = o.target.clone().sub(start).normalize(); dir.y = Math.max(dir.y, o.minUp ?? 0.55); dir.normalize();
    const head = start.clone().addScaledVector(dir, sp * dt + 0.5 * (o.acc || 0) * dt * dt);
    const len = Math.min(sp * 0.18 + 30, sp * dt + 1);
    const tail = head.clone().addScaledVector(dir, -len);
    const k = Math.min(1, dt / 0.3) * (o.fade ? o.fade(head, t) : 1);
    const gold = r() < 0.25; const c = gold ? GOLD : CYAN;
    const B = o.bright || 1.4;
    fx.lines.add(tail, head, o.w * 0.3, o.w, c, 0.0, B * k);
    fx.points.add(head, o.w * (o.headK ?? 5), gold ? WHITEGOLD : SWORD, 0.6 * B * k);
  }
}
function boltPts(seed, A, B, jag, n = 14) {
  const r = R(seed); const pts = [];
  const d = B.clone().sub(A); const L = d.length(); const side = V(-d.z, 0, d.x).normalize(); const side2 = d.clone().cross(side).normalize();
  for (let i = 0; i <= n; i++) { const k = i / n; const p = A.clone().lerp(B, k); if (i > 0 && i < n) { p.addScaledVector(side, (r() - 0.5) * jag * L); p.addScaledVector(side2, (r() - 0.5) * jag * L); } pts.push(p); }
  return pts;
}
function drawBolt(fx, seed, A, B, k, branches = 3) {
  if (k <= 0.01) return;
  const main = boltPts(seed, A, B, 0.09, 16);
  fx.lines.poly(main, s => 7 + 4 * (1 - s), WHITEGOLD, s => 1.6 * k);
  const r = R(seed + 1);
  for (let b = 0; b < branches; b++) {
    const i = 2 + Math.floor(r() * 10); const P0 = main[i]; const dir = B.clone().sub(A).normalize().add(V(r() - 0.5, -0.2, r() - 0.5).multiplyScalar(1.4)).normalize();
    const P1 = P0.clone().addScaledVector(dir, A.distanceTo(B) * (0.15 + 0.2 * r()));
    fx.lines.poly(boltPts(seed + 10 + b, P0, P1, 0.12, 7), s => 3.5 * (1 - s) + 0.5, WHITEGOLD, s => 1.1 * k * (1 - s * 0.5));
  }
}
let _camPos = V(0, 0, 0);
function heroTrail(fx, pathFn, t, n, dt, wmax, lines = fx.lines, col = CYAN) {
  const pts = []; for (let i = 0; i < n; i++) pts.push(pathFn(t - i * dt));
  const near = pts.map(p => smooth(clamp((p.distanceTo(_camPos) - 3) / 12)));
  const at = (s) => near[Math.min(n - 1, Math.round(s * (n - 1)))];
  lines.poly(pts, s => wmax * (1 - s) + 0.05, col, s => 1.5 * Math.pow(1 - s, 1.5) * at(s));
  lines.poly(pts, s => wmax * 0.25 * (1 - s) + 0.02, WHITEGOLD, s => 1.4 * Math.pow(1 - s, 2) * at(s));
}

// S2 · 3–6 · 众神，由此上下: closer, rising alongside the trunk; gold lights stream along the stair
let _c2 = null;
shot(3, 6, (t, w, cam, st) => {
  setEnv(P.dawn); grade({ exp: 1.0, bloom: 0.42 });
  intact(w);
  const k = easeInOutSine(seg(t, 2.6, 6.4));
  const dir = V(-0.62, 0, 0.78).normalize();
  const pos = dir.clone().multiplyScalar(lerp(1900, 1700, k)); pos.y = lerp(800, 1550, k);
  const L = leftOf(pos, V(0, pos.y, 0));
  const tgt = V(0, lerp(1350, 2150, k), 0).addScaledVector(L, 420);
  aim(cam, pos, tgt, 50);
  if (!_c2) _c2 = w.baseClouds.concat(wispsAround(21, 22, V(-560, 0, 700), 350, 500, 2100, 140, 360, 0.5, 0.2));
  st.clouds = _c2;
  st.cranes = [{ c: V(-900, 1000, 1150), v: V(10, 4, -9), n: 5, spread: 24, size: 2.6, seed: 8, t0: 3 }];
  st.fx = (fx, tt) => godLights(fx, tt, 1);
  st.caps = [
    { text: '众神，由此上下。', t0: 3.25, t1: 5.75, x: 300, y: 330, size: 66, align: 'left' },
    { text: '建木在都广，众帝所自上下。', t0: 3.75, t1: 5.75, x: 302, y: 430, size: 30, align: 'left', color: '#3b5156', stagger: 0.03, spacing: 0.08 },
    { text: '——《淮南子·地形训》', t0: 4.2, t1: 5.75, x: 302, y: 478, size: 26, align: 'left', color: '#4d6266', stagger: 0.02, spacing: 0.04 },
    { text: '建木', t0: 1.3, t1: 5.7, x: 980, y: 760, size: 40, vertical: true, spacing: 0.5, color: '#3b5156', rule: [980, 840, 980, 1000] },
  ];
});

// S3 · 6–9 · 后来，天梯断了: the crack, the topple, debris in megastructure slow motion, chains whip loose
const BREAK_DIR = V(0.8, 0, 0.35).normalize();     // the upper trunk falls this way (away and to the right)
function breakState(w, t) {
  const j = w.jm; const { breakY, R: TR } = TRUNK;
  j.sleeve.visible = false; j.splinters.visible = true; j.upper.visible = true;
  const k = easeIn(seg(t, 6.15, 9.6));
  const th = 0.55 * k;
  const pivot = BREAK_DIR.clone().multiplyScalar(TR * 0.9).add(axisOff(breakY)); pivot.y = breakY;
  const axis = V(0, 1, 0).cross(BREAK_DIR).normalize();
  const q = new THREE.Quaternion().setFromAxisAngle(axis, th);
  j.upper.quaternion.copy(q);
  const pp = pivot.clone().applyQuaternion(q);
  j.upper.position.copy(pivot).sub(pp).add(V(0, -260 * k * k, 0)).addScaledVector(BREAK_DIR, 120 * k);
  j.upper.updateMatrixWorld(true);
  return th;
}
let _c3 = null;
shot(6, 9, (t, w, cam, st) => {
  const kc = smooth(seg(t, 6.3, 8.6));
  setEnv(P.dawn, P.cold, kc);
  const fl = t >= 6.0 ? Math.exp(-(t - 6.0) / 0.18) : 0;
  grade({ exp: 1.0 - 0.06 * kc, bloom: 0.45, flash: fl * 0.35, flashCol: [1, 0.95, 0.8], sat: 1.05 - 0.15 * kc });
  breakState(w, t);
  const k = easeInOutSine(seg(t, 5.6, 9.4));
  const dir = V(-0.55, 0, 0.83).normalize();
  const pos = dir.clone().multiplyScalar(lerp(2100, 2250, k)); pos.y = lerp(1250, 1150, k);
  pos.add(shake(t, 6.0, 9, 1.4));
  const L = leftOf(pos, V(0, pos.y, 0));
  const tgt = V(0, lerp(2350, 2250, k), 0).addScaledVector(L, 300);
  aim(cam, pos, tgt, 52);
  if (!_c3) _c3 = w.baseClouds.concat(wispsAround(31, 16, V(-500, 0, 800), 500, 900, 2600, 160, 420, 0.45, 0.25));
  // dust bursting from the break
  const dust = [];
  if (t > 6.0) { const r = R(33); const d = t - 6.0; for (let i = 0; i < 22; i++) { const a = r() * 6.283; const sp = 40 + 60 * r(); const p = V(Math.cos(a) * (TRUNK.R + sp * d), TRUNK.breakY - 40 + (r() - 0.6) * 80 - d * d * 6, Math.sin(a) * (TRUNK.R + sp * d)).add(axisOff(TRUNK.breakY)); const wd = 120 + 160 * d + 80 * r(); dust.push({ p, w: wd, h: wd * 0.6, cell: 12 + (i % 4), op: 0.75 * Math.min(1, d * 3) * (1 - d / 4), flip: r() < 0.5, tint: C(0xb9b2a2) }); } }
  st.clouds = _c3.concat(dust);
  st.fx = (fx, tt) => {
    godLights(fx, tt, 1, 6.05);
    // the crack of light running around the trunk at 6.0
    if (tt > 5.95 && tt < 6.9) { const kk = Math.exp(-Math.max(0, tt - 6.0) / 0.25); const pts = []; const ao = axisOff(TRUNK.breakY); for (let i = 0; i <= 48; i++) { const a = i / 48 * 6.283; const rr = TRUNK.R * 1.18; pts.push(V(ao.x + Math.cos(a) * rr, TRUNK.breakY + Math.sin(i * 2.3) * 18, ao.z + Math.sin(a) * rr)); } fx.lines.poly(pts, () => 10, WHITEGOLD, () => 2.0 * kk); }
  };
  st.debris = (im, tt) => debrisAt(im, tt);
  st.chainSnap = true;
  st.caps = [{ text: '后来，天梯断了。', t0: 6.4, t1: 8.85, x: 300, y: 330, size: 66, align: 'left' }];
});
// debris: chunks flung from the break ring, falling slowly (stylised g), tumbling
const _m4 = new THREE.Matrix4(), _q4 = new THREE.Quaternion(), _e4 = new THREE.Euler();
const _ab = axisOff(TRUNK.breakY);
function debrisAt(im, t) {
  const r = R(55); let n = 0;
  for (let i = 0; i < 140; i++) {
    const t0 = 6.0 + r() * 0.5; const a = r() * 6.283; const out = 25 + 70 * r(); const upv = (r() - 0.3) * 40; const sz = 6 + 34 * Math.pow(r(), 2.2);
    const spin = (r() - 0.5) * 2; const ax = r(), ay = r();
    const d = t - t0; if (d < 0) continue;
    const g = 30;
    const p = V(Math.cos(a) * (TRUNK.R + out * d), TRUNK.breakY + upv * d - 0.5 * g * d * d, Math.sin(a) * (TRUNK.R + out * d)).add(_ab);
    _q4.setFromEuler(_e4.set(ax * 6 + spin * d, ay * 6 + spin * d * 0.7, spin * d * 0.5));
    _m4.compose(p, _q4, V(sz, sz * 0.7, sz)); im.setMatrixAt(n++, _m4);
  }
  // a few huge chunks: the S3→S4 carry (one keeps falling into the next shot)
  for (let i = 0; i < 4; i++) {
    const t0 = 6.1 + i * 0.15; const d = t - t0; if (d < 0) continue;
    const a = 0.6 + i * 1.4; const p = V(Math.cos(a) * (TRUNK.R + 30 * d + 80), TRUNK.breakY - 30 - 0.5 * 22 * d * d, Math.sin(a) * (TRUNK.R + 30 * d + 80)).add(_ab);
    _q4.setFromEuler(_e4.set(d * 0.3 + i, d * 0.2, d * 0.25)); _m4.compose(p, _q4, V(70 - i * 8, 50, 60)); im.setMatrixAt(n++, _m4);
  }
  im.count = n; im.instanceMatrix.needsUpdate = true;
}

// S4 · 9–12 · 凡人，再也上不去了 and S5a · 12–13.5 · she steps off
function fallenWorld(w) { const j = w.jm; j.upper.visible = false; j.sleeve.visible = false; j.splinters.visible = true; }
function stumpDust(t, seed = 41) { const r = R(seed); const out = []; for (let i = 0; i < 14; i++) { const a = r() * 6.283; const d = 300 + 260 * r() + 30 * t; out.push({ p: V(Math.cos(a) * d * 0.7, TRUNK.breakY + 60 + r() * 300 + t * 10, Math.sin(a) * d * 0.7).add(_ab), w: 380 + 300 * r(), h: 220 + 150 * r(), cell: 12 + (i % 4), op: 0.55, flip: r() < 0.5, tint: C(0xc4beb0) }); } return out; }
let _c4 = null;
function sectCam(w, cam, t, push, tiltDown = 0) {
  const E = sectEdge(w);
  const back = lerp(14, 10, push), side = 3.6, up = 2.4;
  const pos = E.stand.clone().addScaledVector(E.dir, -back).addScaledVector(E.left, side).add(V(0, up + 1.7 - 2.5 * tiltDown, 0));
  // look toward the stump, yawed so it sits in the left third; pitch up ~14°
  const toStump = V(0, TRUNK.breakY + 80, 0).sub(pos); const yaw = Math.atan2(toStump.x, toStump.z) - 0.09;
  const pitch = lerp(0.24, -0.35, tiltDown);
  const f = V(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
  aim(cam, pos, pos.clone().add(f.multiplyScalar(100)), 48, 0, 0.5);
  return E;
}
shot(9, 12, (t, w, cam, st) => {
  setEnv(P.sect); grade({ exp: 1.0, bloom: 0.3, sat: 0.95 });
  fallenWorld(w);
  const E = sectCam(w, cam, t, easeInOutSine(seg(t, 9, 13.5)) * 0.6);
  if (!_c4) _c4 = w.baseClouds.concat(wispsAround(41, 26, SECT.p, 1600, 300, 1400, 200, 520, 0.5, 0.35));
  st.clouds = _c4.concat(stumpDust(t - 9));
  st.heroPose = { pos: E.stand, pose: { wind: [1, 0.1], gust: 0.55, armL: 0.12, armR: 0.18, lookUp: 1 }, rimDir: [-1, -0.35], light: C(0xf2f2ec) };
  st.cranes = [{ c: E.stand.clone().addScaledVector(E.dir, 420).add(V(0, 120, 0)).addScaledVector(E.left, 260), v: E.left.clone().multiplyScalar(-12).add(V(0, 1.5, 0)), n: 6, spread: 30, size: 2.6, seed: 12, t0: 9 }];
  st.fx = (fx, tt) => { petals(fx, tt, E); };
  st.debris = (im, tt) => { // the carry: a huge fragment still falling far away, left of the stump
    const d = tt - 6.1; const p = V(Math.cos(0.6) * (TRUNK.R + 30 * d + 80), TRUNK.breakY - 30 - 0.5 * 22 * d * d, Math.sin(0.6) * (TRUNK.R + 30 * d + 80)).add(_ab);
    _q4.setFromEuler(_e4.set(d * 0.3, d * 0.2, d * 0.25)); _m4.compose(p, _q4, V(70, 50, 60)); im.setMatrixAt(0, _m4); im.count = 1; im.instanceMatrix.needsUpdate = true; };
  st.caps = [{ text: '凡人，再也上不去了。', t0: 9.3, t1: 11.85, x: 540, y: 330, size: 64 }];
});
function petals(fx, t, E) {
  const r = R(91);
  for (let i = 0; i < 40; i++) {
    const p0 = E.stand.clone().addScaledVector(E.dir, -6 + r() * 30).addScaledVector(E.left, 14 - r() * 34).add(V(0, r() * 12 - 2, 0));
    const v = E.left.clone().multiplyScalar(-(2 + 2 * r())).add(V(0, -0.4 - 0.3 * r(), 0)).addScaledVector(E.dir, 1.5 * r());
    const tt = ((t * 0.25 + r()) % 1) * 8;
    const p = p0.add(v.multiplyScalar(tt)).add(V(Math.sin(t * 2 + i) * 0.4, Math.sin(t * 3 + i * 2) * 0.3, 0));
    fx.petals.add(p, 0.16 + 0.12 * r(), C(0xf4b7b0), 0.9);
  }
}
shot(12, 13.5, (t, w, cam, st) => {
  setEnv(P.sect); grade({ exp: 1.0, bloom: 0.3, sat: 0.97 });
  fallenWorld(w);
  const E = sectCam(w, cam, t, 0.6 + 0.4 * easeInOut(seg(t, 12.4, 13.5)), easeInOut(seg(t, 12.9, 13.5)) * 0.5);
  st.clouds = (_c4 || w.baseClouds).concat(stumpDust(t - 9));
  // anticipation (crouch), step, off the edge
  const cr = Math.sin(Math.PI * seg(t, 12.0, 12.5)) * 0.9;
  const step = easeInOut(seg(t, 12.35, 12.85));
  const fall = Math.max(0, t - 12.85);
  const pos = E.stand.clone().addScaledVector(E.dir, step * 7 + fall * 6).add(V(0, step * 0.4 - 0.5 * 28 * fall * fall, 0));
  const fk = seg(t, 12.85, 13.2);
  st.heroPose = { pos, pose: { wind: [lerp(1, 0.3, fk), lerp(0.1, -1, fk)], gust: lerp(0.55, 1, fk), armL: lerp(0.12, 0.6, fk), armR: lerp(0.18, 0.7, fk), lookUp: lerp(1, 0, fk), crouch: cr }, rimDir: [-1, -0.35], light: C(0xf2f2ec) };
  st.fx = (fx, tt) => { petals(fx, tt, E); };
});

// S5b · 13.5–15.4 · falling (深远, looking straight down), the sword unsheathes, the catch at 15.0, she shoots back up
let _c5 = null;
function fallPos(E, t) {
  const top = E.lip.clone().addScaledVector(E.dir, 8);
  if (t < 15.0) { const d = t - 13.5; return top.add(V(0, -(5 + 0.5 * 85 * d * d), 0)).addScaledVector(E.dir, d * 4); }
  const d15 = 1.5; const bottom = top.clone().add(V(0, -(5 + 0.5 * 85 * d15 * d15), 0)).addScaledVector(E.dir, d15 * 4);
  const k = easeIn(seg(t, 15.0, 15.42));
  const camP = E.lip.clone().addScaledVector(E.dir, 9).add(V(0, 14, 0));
  return bottom.lerp(camP.add(V(0, 6, 0)), k);
}
function swordPos(E, t) {
  const h = fallPos(E, Math.min(t, 15.0));
  if (t < 14.2) return h.clone().add(V(0, 1.4, 0));
  const k = seg(t, 14.2, 14.95); const a = k * 6.283 * 1.6;
  const r = 9 * Math.sin(Math.PI * Math.min(1, k * 1.1));
  return h.clone().add(V(Math.cos(a) * r, -lerp(0, 1.0, k) - 14 * Math.sin(Math.PI * k), Math.sin(a) * r));
}
shot(13.5, 15.42, (t, w, cam, st) => {
  setEnv(P.sect, P.flight, smooth(seg(t, 14.9, 15.3))); 
  const fl = t >= 15.0 ? Math.exp(-(t - 15.0) / 0.14) : 0;
  grade({ exp: 1.0, bloom: 0.45 + 0.4 * fl, flash: fl * 0.45, flashCol: [0.85, 0.98, 1.0], sat: 1.0 });
  fallenWorld(w);
  const E = sectEdge(w);
  const pos = E.lip.clone().addScaledVector(E.dir, 9).add(V(0, 14, 0));
  cam.up.copy(E.dir);
  cam.position.copy(pos); cam.lookAt(pos.clone().add(V(0, -100, 0)).addScaledVector(E.dir, 12));
  if (cam.fov !== 56 || cam.near !== 0.5) { cam.fov = 56; cam.near = 0.5; cam.updateProjectionMatrix(); }
  if (!_c5) _c5 = w.baseClouds.concat(wispsAround(51, 30, E.lip, 700, 120, 520, 120, 360, 0.6, 0.0));
  st.clouds = _c5;
  const hp = fallPos(E, t);
  const caught = t >= 14.98;
  const dist = hp.distanceTo(pos);
  st.heroPose = { pos: hp, scale: 1, pose: caught ? { wind: [0.1, 1], gust: 1, armL: 0.3, armR: 0.9, onSword: true, sheathed: false, feet: true, swordGlow: 1.4 } : { wind: [0.3, -1], gust: 1, armL: 0.75, armR: 0.8, sheathed: t < 14.2 }, rimDir: [-0.6, -0.8], light: C(0xf4f4f0), roll: caught ? 0 : Math.sin(t * 2.2) * 0.5 + (t - 13.5) * 0.8 };
  st.fx = (fx, tt) => {
    if (tt >= 14.2 && tt < 15.0) { const pts = []; for (let i = 0; i < 26; i++) pts.push(swordPos(E, Math.max(14.2, tt - i * 0.012))); fx.lines.poly(pts, s => 1.6 * (1 - s) + 0.1, CYAN, s => 1.8 * (1 - s)); fx.points.add(pts[0], 4, SWORD, 1.2); }
    if (tt >= 15.0) heroTrail(fx, (x) => fallPos(E, Math.max(15.0, x)).add(V(0, -0.2, 0)), tt, 28, 0.012, 1.8 * (1 + 3 * seg(tt, 15.15, 15.42)));
  };
});

// S6a · 15.42–18 · chase: behind and below her, spiralling up around the trunk just outside the branch-rung tips
const CH_R = 1120, CH_A0 = 2.35, CH_A1 = 1.65, CH_Y0 = 1020, CH_Y1 = 1700;
function chasePos(t) { const k = clamp((t - 15.0) / 3.0); const kk = 0.35 * k + 0.65 * easeOut(k); const a = lerp(CH_A0, CH_A1, kk); const r = CH_R + 30 * Math.sin(kk * 7); return V(Math.cos(a) * r, lerp(CH_Y0, CH_Y1, kk) + 18 * Math.sin(kk * 9), Math.sin(a) * r); }
let _c6 = null;
shot(15.42, 18, (t, w, cam, st) => {
  setEnv(P.flight); grade({ exp: 1.02, bloom: 0.45, sat: 1.08, chroma: 0.0022 });
  fallenWorld(w);
  const hp = chasePos(t), ahead = chasePos(t + 0.06); const f = ahead.clone().sub(hp).normalize();
  const radial = V(hp.x, 0, hp.z).normalize();
  const pos = hp.clone().addScaledVector(f, -10).add(V(0, -2.2, 0)).addScaledVector(radial, 3.0);
  const roll = 0.16 + 0.05 * Math.sin((t - 15.4) * 2.1);
  const inward = radial.clone().negate();
  aim(cam, pos, hp.clone().addScaledVector(f, 60).add(V(0, 9, 0)).addScaledVector(inward, 33), 60, roll, 0.5);
  if (!_c6) { const r = R(61); _c6 = w.baseClouds.slice(); for (let i = 0; i <= 60; i++) { const p = chasePos(15.0 + i / 60 * 3.2); for (let j = 0; j < 2; j++) { const a = r() * 6.283; const d = 50 + 160 * r(); const wd = 50 + 120 * r(); _c6.push({ p: p.clone().add(V(Math.cos(a) * d, (r() - 0.5) * 70, Math.sin(a) * d)), w: wd * 1.8, h: wd * 0.5, cell: 12 + Math.floor(r() * 4), op: 0.35 + 0.3 * r(), flip: r() < 0.5 }); } } }
  st.clouds = _c6;
  st.heroPose = { pos: hp, pose: { wind: [-0.25 + 0.15 * Math.sin(t * 1.3), 1], gust: 1, armL: 0.3, armR: 0.95, onSword: true, sheathed: false, feet: true, swordGlow: 1.3 }, rimDir: [-0.9, -0.5], light: C(0xfff3e4), roll: roll * 0.4 };
  st.fx = (fx, tt) => {
    heroTrail(fx, (x) => chasePos(Math.max(15.0, x)).add(V(0, -0.15, 0)), tt, 40, 0.008, 0.16);
    godLightsDead(fx);
    // speed streaks of air near the camera
    const r = R(66); for (let i = 0; i < 10; i++) { const ph = (tt * 2.2 + r()) % 1; const off = V((r() - 0.5) * 30, (r() - 0.5) * 40, (r() - 0.5) * 30); const p = chasePos(tt + 0.25 - ph * 0.5).add(off); const q = p.clone().addScaledVector(f, -12 - 10 * r()); fx.lines.add(q, p, 0.03, 0.06, C(0xffffff), 0.0, 0.18 * Math.sin(ph * Math.PI)); }
    if (tt > 16.4) swordSwarm(fx, tt, { seed: 7, n: 50, t0: 16.4, spread: 1.6, c: V(0, 0, 0), rMin: 700, rMax: 2600, yMin: 500, yMax: 1300, vMin: 260, vMax: 420, target: V(0, 6000, 0), w: 3 });
  };
});
function godLightsDead() {}

// S6b · 18–21 · 一剑起，万剑随: wide, she passes the broken stump; sword-lights rise from every island
const WB = new THREE.CatmullRomCurve3([V(1150, 1880, 300), V(1000, 2250, 80), V(860, 2700, -160), V(760, 3200, -340), V(700, 3700, -460)]);
function widePos(t) { return WB.getPointAt(clamp((t - 17.7) / 3.6)); }
let _c7 = null;
shot(18, 21, (t, w, cam, st) => {
  setEnv(P.flight, P.storm, 0.35 * smooth(seg(t, 20.0, 21.0))); grade({ exp: 1.02, bloom: 0.5, sat: 1.06 });
  fallenWorld(w);
  const hp = widePos(t);
  const k = easeInOutSine(seg(t, 17.8, 21.2));
  const pos = V(lerp(2500, 2450, k), lerp(1900, 2700, k), lerp(2300, 2150, k));
  aim(cam, pos, V(lerp(400, 500, k), lerp(2400, 3300, k), lerp(-100, -200, k)), 50);
  if (!_c7) _c7 = w.baseClouds.concat(wispsAround(71, 30, V(800, 0, 800), 1400, 1200, 3600, 200, 520, 0.5, 0.3));
  st.clouds = _c7.concat(stumpDust(t - 9));
  st.heroPose = { pos: hp, scale: 3.0, pose: { wind: [0.1, 1], gust: 1, armL: 0.35, armR: 0.95, onSword: true, sheathed: false, feet: true, swordGlow: 1.6 }, rimDir: [-0.8, -0.6], light: C(0xfff6ea) };
  st.fx = (fx, tt) => {
    heroTrail(fx, (x) => widePos(x), tt, 30, 0.02, 6);
    fx.points.add(hp, 26, SWORD, 1.2);
    swordSwarm(fx, tt, { seed: 8, n: 190, t0: 17.4, spread: 3.4, c: V(200, 0, 200), rMin: 300, rMax: 3200, yMin: 300, yMax: 1800, vMin: 240, vMax: 420, target: V(200, 7000, -400), w: 5 });
  };
  st.caps = [{ text: '一剑起，万剑随。', t0: 18.3, t1: 20.8, x: 540, y: 330, size: 66 }];
});

// S7 · 21–24 · 雷劫: storm ceiling, gold-white lightning, she cuts through
function stormPos(t) { return V(300, lerp(3350, 4380, easeIn(seg(t, 21.0, 23.95)) * 0.75 + seg(t, 21.0, 23.95) * 0.25), -380); }
let _c8 = null;
const BOLTS = [[21.75, 0], [22.5, 1], [22.95, 2], [23.25, 3]];
shot(21, 24, (t, w, cam, st) => {
  setEnv(P.flight, P.storm, smooth(seg(t, 20.6, 21.4)));
  fallenWorld(w);
  w.storm.visible = true; w.sea.visible = true;
  const hp = stormPos(t);
  const pos = hp.clone().add(V(-14, -26, 22));
  aim(cam, pos, hp.clone().add(V(4, 60, -6)), 58, 0.1, 0.5);
  if (!_c8) { const r = R(81); _c8 = []; for (let i = 0; i < 70; i++) { const a = r() * 6.283, d = 100 + 2500 * Math.sqrt(r()); const wd = 300 + 700 * r(); _c8.push({ p: V(300 + Math.cos(a) * d, 4150 + r() * 220, -380 + Math.sin(a) * d), w: wd, h: wd * 0.5, cell: (i % 3 === 0) ? 8 + (i % 4) : Math.floor(r() * 8), op: 0.9, flip: r() < 0.5, tint: C(0x8fa3a8) }); } }
  st.clouds = _c8;
  // lightning
  let flash = 0, fpos = V(0, 4300, 0);
  for (const [bt, i] of BOLTS) { const d = t - bt; if (d >= 0 && d < 0.35) { const f = (d < 0.05 ? 1 : 0.55 + 0.45 * Math.sin(d * 90)) * (1 - d / 0.35); if (f > flash) { flash = f; fpos = i === 3 ? hp.clone() : V(300 + (i - 1) * 260, 4000, -380 + (i % 2 ? 200 : -200)); } } }
  ENV.uFlashCol.value.set(1.0, 0.92, 0.7).multiplyScalar(flash * 1.4); ENV.uFlashPos.value.copy(fpos);
  const hit = t >= 23.25 ? Math.exp(-(t - 23.25) / 0.3) : 0; const end = t >= 23.85 ? smooth(seg(t, 23.85, 24.0)) : 0;
  grade({ exp: 1.0, bloom: 0.6, sat: 1.0, gamma: [1.0, 1.0, 1.03], flash: flash * 0.12 + end * 0.9, flashCol: [1, 0.95, 0.8], chroma: 0.0025 });
  st.heroPose = { pos: hp, pose: { wind: [0.2 * Math.sin(t * 7), 1], gust: 1, armL: 0.3, armR: lerp(0.95, 1.0, hit), onSword: true, sheathed: false, feet: true, swordGlow: 1.3 + 2 * hit }, rimDir: [-0.5, -0.9], rim: 'rgba(255,240,200,0.9)', light: C(0xc9d6da).lerp(C(0xffffff), flash) };
  st.fx = (fx, tt) => {
    heroTrail(fx, (x) => stormPos(Math.max(21, x)), tt, 30, 0.012, 1.1);
    for (const [bt, i] of BOLTS) { const d = tt - bt; if (d < 0 || d > 0.35) continue; const k = (d < 0.05 ? 1 : 0.5 + 0.5 * Math.sin(d * 90)) * (1 - d / 0.35);
      if (i < 3) { const A = V(300 + (i - 1) * 300, 4420, -380 + (i % 2 ? 260 : -240)); const B = A.clone().add(V((i - 1) * 80, -900, 60)); drawBolt(fx, 100 + i, A, B, k, 4); }
      else { const A = hp.clone().add(V(40, 1000, -30)); drawBolt(fx, 140, A, hp.clone().add(V(0, 3, 0)), k, 0); const r = R(150); for (let b = 0; b < 6; b++) { const dir = V(r() - 0.5, -0.6 - r() * 0.6, r() - 0.5).normalize(); drawBolt(fx, 160 + b, hp.clone().add(V(0, 2, 0)), hp.clone().addScaledVector(dir, 120 + 200 * r()), k * 0.8, 1); } } }
    if (hit > 0.01) fx.points.add(hp.clone().add(V(0, 1, 0)), 30 * hit + 6, WHITEGOLD, 1.5 * hit);
    swordSwarm(fx, tt, { seed: 10, n: 40, t0: 20.6, spread: 3.2, c: V(300, 0, -380), rMin: 60, rMax: 900, yMin: 2600, yMax: 3300, vMin: 220, vMax: 380, target: V(300, 6000, -380), w: 2.5, fade: (h) => h.y > 4350 ? 0 : 1 });
  };
  st.caps = [{ text: '天，不许。', t0: 21.3, t1: 23.15, x: 540, y: 330, size: 70, color: '#f3efe2', glow: 'rgba(10,25,30,0.8)' }];
});

// S8 · 24–30 · 破云 (平远): above the clouds in gold; the heaven gate backlit on a far cloud bank; a river of sword-lights
let _c9 = null;
const FIN = { cam0: V(-900, 4460, 900), cam1: V(-1100, 4900, 2200), gate: V(1300, 6900, -9500) };
function finalPos(t) { const k = easeOut(seg(t, 23.9, 30.0)); return V(lerp(-980, -650, k), lerp(4450, 5900, k), lerp(380, -3600, k)); }
shot(24, 30.1, (t, w, cam, st) => {
  setEnv(P.gold);
  fallenWorld(w); w.storm.visible = false;
  const U = w.sea.userData.U; U.uSeaY.value = 4400; U.uSeaCover.value = 0.7; w.sea.visible = true;
  const ent = t < 24.7 ? Math.exp(-(t - 24.0) / 0.22) : 0;
  grade({ exp: 0.97, bloom: 0.6, sat: 1.08, flash: ent * 0.9, flashCol: [1, 0.93, 0.75], thresh: 0.9, vig: 0.3 });
  const k = easeInOutSine(seg(t, 24.0, 30.0)), kr = easeOut(seg(t, 24.0, 26.0));
  const pos = FIN.cam0.clone().lerp(FIN.cam1, k); pos.y = lerp(4300, FIN.cam0.y, kr) + (FIN.cam1.y - FIN.cam0.y) * k;
  const tgt = pos.clone().add(V(0.1, lerp(0.05, 0.2, kr), -1).normalize().multiplyScalar(1000));
  aim(cam, pos, tgt, 54);
  if (!_c9) { const r = R(91); _c9 = []; for (let i = 0; i < 60; i++) { const a = r() * 6.283, d = 1500 + 15000 * Math.pow(r(), 0.6); const wd = 900 + 2200 * r(); _c9.push({ p: V(Math.cos(a) * d, 4380 + wd * 0.1, -6000 + Math.sin(a) * d * 0.8), w: wd, h: wd * 0.45, cell: Math.floor(r() * 8), op: 0.95, flip: r() < 0.5 }); }
    // the cloud bank the palace stands on
    for (let i = 0; i < 14; i++) { const wd = 4500 + 4500 * r(); const yy = 4500 + Math.pow(r(), 0.7) * 2400; _c9.push({ p: FIN.gate.clone().add(V((r() - 0.5) * 16000 * (1 - (yy - 4500) / 4000), yy - FIN.gate.y + wd * 0.1, 800 + (r() - 0.5) * 4000)), w: wd, h: wd * 0.5, cell: Math.floor(r() * 8), op: 0.95, flip: r() < 0.5 }); }
    for (let i = 0; i < 10; i++) { const wd = 6000 + 6000 * r(); _c9.push({ p: FIN.gate.clone().add(V((r() - 0.5) * 12000, -2300 + i * 220, 1500 + (r() - 0.5) * 3000)), w: wd, h: wd * 0.22, cell: 8 + (i % 4), op: 0.7, flip: r() < 0.5 }); } }
  st.clouds = _c9;
  st.gates = true;
  const hp = finalPos(t);
  st.heroPose = { pos: hp, scale: 2.5, pose: { wind: [0.1, 1], gust: 0.9, armL: 0.3, armR: 0.9, onSword: true, sheathed: false, feet: true, swordGlow: 1.5 }, rimDir: [0.4, -0.9], rim: 'rgba(255,225,160,0.95)', light: C(0xfff0d8), op: 1 };
  st.fx = (fx, tt) => {
    heroTrail(fx, finalPos, tt, 34, 0.025, 7);
    fx.points.add(hp, 26, WHITEGOLD, 1.1);
    const up = FIN.gate.clone().add(V(-900, 9000, 1500));
    swordSwarm(fx, tt, { seed: 12, n: 260, t0: 23.2, spread: 6.8, c: V(-700, 0, -2200), rMin: 120, rMax: 2400, yMin: 4380, yMax: 4420, vMin: 380, vMax: 760, target: up, w: 6, bright: 2.4, minUp: 0.6, headK: 3.0 });
    swordSwarm(fx, tt, { seed: 14, n: 200, t0: 23.0, spread: 7.0, c: FIN.gate.clone().add(V(-1500, 0, 3500)), rMin: 300, rMax: 4200, yMin: 4400, yMax: 5400, vMin: 500, vMax: 900, target: up, w: 12, bright: 2.2, minUp: 0.6, headK: 2.6 });
    swordSwarm(fx, tt, { seed: 13, n: 70, t0: 23.6, spread: 6.4, c: V(-900, 0, 300), rMin: 40, rMax: 700, yMin: 4300, yMax: 4400, vMin: 200, vMax: 360, target: up, w: 2.0, bright: 2.2, minUp: 0.75, headK: 3.0 });
  };
  st.caps = [{ text: '梯断了，人就学会了飞。', t0: 24.9, t1: 27.55, x: 540, y: 330, size: 62, color: '#2a2d26', glow: 'rgba(255,246,220,0.8)' }];
  if (t >= 27.6) st.title = { t0: 27.75, x: 540, y: 470, size: 220, text: '御剑', color: '#232822', glow: 'rgba(255,240,205,0.9)' };
});

export function applyShot(t, w, cam, heroCam, post) {
  const st = { hero: false };
  w.storm.visible = false; w.sea.visible = true;
  { const U = w.sea.userData.U; U.uSeaY.value = 0; U.uSeaCover.value = 0.62; U.uAlpha.value = 0; }
  const s = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  s.fn(t, w, cam, st);
  _camPos.copy(cam.position);
  GRADE.uFrame.value = Math.round(t * 30);
  // captions
  const items = st.caps || [];
  const canvas = caps.draw(t, items);
  if (st.title) { caps.title(t, st.title); post.setText(caps.c); } else post.setText(canvas);
  return st;
}
