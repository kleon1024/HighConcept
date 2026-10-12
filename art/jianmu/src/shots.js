// 御剑 YUJIAN — the timeline. applyShot(t) places the camera, lights the world, and returns per-frame state.
// Grid: 80 BPM → beat 0.75 s, bar 3 s. Beat sheet: ../CONCEPT.md
import * as THREE from 'three';
import { clamp, lerp, seg, smooth, smoother, easeOut, easeIn, easeInOut, easeInOutSine, mulberry32, track, W, H } from './util.js';
import { ENV, SKY, paintMat } from './materials.js';
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
  dawn: { sun: [-0.62, 0.42, -0.66], sunCol: 0xffc883, sunK: 1.6, skyAmb: 0x3d6874, groundAmb: 0x4a5049, rim: 0xffcf80, fog: 0xd2dcd3, fogSun: 0xf2dfba, fogDen: 0.00008, fogH: 200, fogFall: 500, fogStart: 700,
    zen: 0x8db1b8, hor: 0xefe5cc, voidc: 0xbccac8, glow: 0xffcf86, lit: 0xfff6ea, shade: 0xb3c1cb, crim: 0xffd48a, seaVoid: 0x9fb0bc },
  cold: { sun: [-0.2, 0.42, -0.88], sunCol: 0xc9d3d2, sunK: 0.75, skyAmb: 0x93abb0, groundAmb: 0x5f6f70, rim: 0xd8e0de, fog: 0xc9d5d4, fogSun: 0xdfe5e2, fogDen: 0.00022, fogH: 250, fogFall: 600,
    zen: 0x8fa7ad, hor: 0xd6dedb, voidc: 0xb3c2c2, glow: 0xe4e8e2, lit: 0xe7ecea, shade: 0x9aabae, crim: 0xe0e6e2, seaVoid: 0x9fb2b4 },
  sect: { sun: [-0.55, 0.32, -0.77], sunCol: 0xf0d2a8, sunK: 1.2, skyAmb: 0x46707b, groundAmb: 0x4b524f, rim: 0xffd9a0, fog: 0xc7d3d2, fogSun: 0xe9dcc4, fogDen: 0.0001, fogH: 300, fogFall: 700, fogStart: 200,
    zen: 0x7ea2ad, hor: 0xdedfd4, voidc: 0xb5c4c3, glow: 0xf3dcb0, lit: 0xf3f2ec, shade: 0x9fb1bb, crim: 0xf2e0c0, seaVoid: 0x99adb5 },
  flight: { sun: [-0.45, 0.5, -0.74], sunCol: 0xffd096, sunK: 1.5, skyAmb: 0x3f6a76, groundAmb: 0x4c524c, rim: 0xffd48a, fog: 0xc9d6d3, fogSun: 0xf3dfba, fogDen: 0.00009, fogH: 300, fogFall: 700, fogStart: 500,
    zen: 0x2f6f86, hor: 0xf0e2c4, voidc: 0xb3c4c4, glow: 0xffcf86, lit: 0xfdf4e4, shade: 0x9fb2bf, crim: 0xffd48a, seaVoid: 0x93a6b2 },
  storm: { sun: [-0.2, 0.6, -0.77], sunCol: 0x6f8f98, sunK: 0.6, skyAmb: 0x2f5560, groundAmb: 0x1d2f36, rim: 0xb7d4da, fog: 0x24434e, fogSun: 0x35596a, fogDen: 0.00028, fogH: 300, fogFall: 900, fogStart: 100,
    zen: 0x10303c, hor: 0x2c505c, voidc: 0x1c3640, glow: 0x4a6c75, lit: 0x86a8b0, shade: 0x22414b, crim: 0xc8e2e6, seaVoid: 0x16303a },
  gold: { sun: [0.19, 0.3, -0.935], sunCol: 0xffc878, sunK: 1.3, skyAmb: 0x5f7380, groundAmb: 0x6e5c4e, rim: 0xffcf70, fog: 0xd6bb94, fogSun: 0xffd08a, fogDen: 0.00004, fogH: 4250, fogFall: 260, high: 0,
    zen: 0x5d88a3, hor: 0xeccb98, voidc: 0xcdb5a0, glow: 0xffc46a, lit: 0xfff0da, shade: 0xc4a9a4, crim: 0xffd27e, seaVoid: 0xbaa3a0 },
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
const S1cam = V(-1750, 380, 1950);
shot(0, 3, (t, w, cam, st) => {
  setEnv(P.dawn); grade({ exp: 0.98, bloom: 0.38, contrast: 1.16, rayThresh: 0.95, sat: 1.1, gain: [1.03, 1.0, 0.96] }); st.rays = 0.35;
  const k = easeInOutSine(seg(t, 0, 3.6));
  const pos = S1cam.clone().add(V(60 * k, 200 * k, -60 * k));
  const L = leftOf(pos, V(0, 0, 0));
  const tgt = V(0, lerp(250, 5200, k), 0).addScaledVector(L, lerp(620, 560, k));
  aim(cam, pos, tgt, 60);
  intact(w);
  st.cranes = [
    { c: V(-1560, 520, 1800), v: V(15, 3, -7), n: 9, spread: 24, size: 2.6, seed: 3, t0: 0 },
    { c: V(-1420, 760, 1600), v: V(12, 2.5, -8), n: 7, spread: 34, size: 2.6, seed: 5, t0: 0 },
    { c: V(-1200, 1150, 1350), v: V(10, 3, -9), n: 5, spread: 40, size: 2.6, seed: 9, t0: 0 },
  ];
  if (!_c1) _c1 = w.baseClouds.concat(wispsAround(11, 14, V(-900, 0, 1300), 900, 350, 1500, 160, 420, 0.4, 0.0), ringClouds(12, 12, V(0, 40, 0), 420, 760, 600, 1100, 0.9));
  st.clouds = _c1;
  st.caps = [
    { text: '传说，', t0: 0.25, t1: 2.75, x: 300, y: 300, size: 66, align: 'left' },
    { text: '上古有一架天梯。', t0: 0.55, t1: 2.75, x: 300, y: 400, size: 66, align: 'left' },
    { text: '建木', t0: 1.2, t1: 2.85, x: 640, y: 980, size: 58, vertical: true, spacing: 0.4, color: '#1d3439', font: '58px "Ma Shan Zheng"', rule: [676, 1060, 800, 1110] },
  ];
});


// ───────────────────────── helpers for the later shots
const GOLD = C(0xffe2a0), WHITEGOLD = C(0xfff4d6), CYAN = C(0xbff4ff), SWORD = C(0xd8fbff);
const ray = new THREE.Raycaster();
function groundY(obj, x, z) { ray.set(V(x, 5000, z), V(0, -1, 0)); const h = ray.intersectObject(obj, true); return h.length ? h[0].point.y : null; }
let EDGE = null;
function sectEdge(w) {
  if (EDGE) return EDGE;
  const c = SECT.p; const ud = w.sect.userData; const dir = ud.toTrunk.clone();
  w.sect.updateMatrixWorld(true);
  const rock = ud.rock;
  let lip = null, lipY = null;
  for (let r = 200; r < SECT.R * 1.3; r += 2) { const x = c.x + dir.x * r, z = c.z + dir.z * r; const y = groundY(rock, x, z); if (y === null || (lipY !== null && y < lipY - 2.5)) break; lip = V(x, y, z); lipY = y; }
  const stand = lip.clone().addScaledVector(dir, -7); stand.y = groundY(rock, stand.x, stand.z);
  EDGE = { dir, lip, stand, left: V(dir.z, 0, -dir.x) };
  const pe = w.edgeProps.peach; pe.position.copy(stand).addScaledVector(EDGE.left, 3.6).addScaledVector(dir, 5.0); pe.position.y = groundY(rock, pe.position.x, pe.position.z) - 0.3; pe.scale.setScalar(4.8); pe.rotation.y = 1.3;
  const pn = w.edgeProps.pine; pn.position.copy(stand).addScaledVector(dir, -1.0).addScaledVector(EDGE.left, 15.0); pn.position.y = groundY(rock, pn.position.x, pn.position.z) - 1; pn.scale.setScalar(11); pn.rotation.y = 0.4;
  // boulders and stones scattered near the edge
  const rocksM = []; const rr = R(313);
  for (let i = 0; i < 10; i++) { const fwd = -2 + rr() * 8, sd = (rr() - 0.5) * 40; const p = stand.clone().addScaledVector(dir, fwd).addScaledVector(EDGE.left, sd); if (Math.abs(sd) < 2.5 && fwd > -1) continue; const gy = groundY(rock, p.x, p.z); if (gy === null) continue; p.y = gy; const s = 0.6 + 1.2 * rr(); if (Math.abs(sd) < 6) continue; rocksM.push(new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(rr(), rr() * 6, rr())), V(s, s * 0.6, s))); }
  // foreground stones (scale cue) left and right of the camera→hero line
  for (let i = 0; i < 9; i++) { const fwd = -14 + rr() * 12, sd = (rr() < 0.5 ? -1 : 1) * (3 + rr() * 7); const p = stand.clone().addScaledVector(dir, fwd).addScaledVector(EDGE.left, sd); const gy = groundY(rock, p.x, p.z); if (gy === null) continue; p.y = gy - 0.1; const s = 0.25 + 0.5 * rr(); rocksM.push(new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(rr(), rr() * 6, rr())), V(s, s * 0.6, s))); }
  // grass tufts: thin double-sided blades, dark at the root, sun-bleached at the tip
  { const P = [], Cc = [], Nn = []; const gr = R(515);
    for (let i = 0; i < 2200; i++) {
      const fwd = -16 + gr() * 23, sd = (gr() - 0.5) * 26; const c0 = stand.clone().addScaledVector(dir, fwd).addScaledVector(EDGE.left, sd);
      if (fwd > 6.2) continue; const gy = groundY(rock, c0.x, c0.z); if (gy === null) continue; c0.y = gy - 0.03;
      const hgt = 0.1 + 0.26 * Math.pow(gr(), 1.6); const dry = gr();
      const base = C(0x26341c), tip = C(0x7d8a45).lerp(C(0xb7a865), dry * 0.6);
      for (let b = 0; b < 4; b++) { const a = gr() * 6.283, lean = 0.15 + 0.35 * gr(); const wd = 0.018 + 0.014 * gr();
        const ax = Math.cos(a), az = Math.sin(a); const px = -az, pz = ax;
        const A = [c0.x + px * wd, c0.y, c0.z + pz * wd], B = [c0.x - px * wd, c0.y, c0.z - pz * wd], T = [c0.x + ax * hgt * lean, c0.y + hgt, c0.z + az * hgt * lean];
        P.push(...A, ...B, ...T); Cc.push(base.r, base.g, base.b, base.r, base.g, base.b, tip.r, tip.g, tip.b); for (let k = 0; k < 3; k++) Nn.push(0, 1, 0); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
    w.edgeProps.tufts = new THREE.Mesh(g, paintMat({ brushScale: 0.5, brush: 0.1, rim: 0.2, wrap: 0.6, side: THREE.DoubleSide })); w.edgeProps.tufts.frustumCulled = false; w.scene.add(w.edgeProps.tufts); }
  w.edgeProps.rocks = new THREE.InstancedMesh(w.fx.debris.geometry, w.fx.debris.material, rocksM.length); rocksM.forEach((m, i) => w.edgeProps.rocks.setMatrixAt(i, m)); w.edgeProps.rocks.frustumCulled = false; w.scene.add(w.edgeProps.rocks);
  return EDGE;
}
// god lights along the stair (gold) — some climbing, some descending
function godLights(fx, t, k = 1, scatterT = null) {
  const r = R(77);
  for (let i = 0; i < 150; i++) {
    const up = i % 3 !== 0; const v = (up ? 1 : -1) * (55 + 40 * r()); const y0 = 300 + r() * 2400;
    let y = 200 + ((y0 + v * t) % 2200 + 2200) % 2200;
    let p = fx.jm.stairPoint(y);
    let fade = k;
    if (scatterT !== null && t > scatterT) { const d = t - scatterT; p = p.clone().add(V(0, d * d * (120 + 160 * r()), 0)).addScaledVector(V(p.x, 0, p.z).normalize(), d * 80); fade *= Math.max(0, 1 - d / (1.2 + r())); }
    if (fade <= 0.01) continue;
    const out = V(p.x, 0, p.z).normalize(); p = p.clone().addScaledVector(out, 10).add(V(0, 6, 0));
    const sz = 16 + 10 * r();
    fx.points.add(p, sz * 2.4, WHITEGOLD, 1.7 * fade);
    const back = fx.jm.stairPoint(y - v * 0.45).addScaledVector(out, 10).add(V(0, 6, 0));
    fx.lines.add(back, p, 2.0, 7.0, GOLD, 0.0, 1.3 * fade);
  }
  // lights flying between branch tips (arcs upward)
  for (let i = 0; i < 30; i++) {
    const e = fx.jm.rungInfo[(i * 3) % fx.jm.rungInfo.length]; const ph = ((t * 0.35 + r()) % 1);
    const A = e.end.clone().add(V(0, 20, 0)), B = V(0, e.y + 300, 0).add(V(e.end.x * 0.4, 0, e.end.z * 0.4));
    const p = A.clone().lerp(B, ph); p.y += Math.sin(ph * Math.PI) * 120;
    let fade = k * Math.sin(ph * Math.PI);
    if (scatterT !== null && t > scatterT) fade *= Math.max(0, 1 - (t - scatterT) / 1.0);
    if (fade > 0.01) fx.points.add(p, 44, WHITEGOLD, 1.5 * fade);
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
  fx.lines.poly(main, s => 2.2 + 1.6 * (1 - s), WHITEGOLD, s => 1.8 * k);
  const r = R(seed + 1);
  for (let b = 0; b < branches; b++) {
    const i = 2 + Math.floor(r() * 10); const P0 = main[i]; const dir = B.clone().sub(A).normalize().add(V(r() - 0.5, -0.2, r() - 0.5).multiplyScalar(1.4)).normalize();
    const P1 = P0.clone().addScaledVector(dir, A.distanceTo(B) * (0.15 + 0.2 * r()));
    fx.lines.poly(boltPts(seed + 10 + b, P0, P1, 0.12, 7), s => 1.2 * (1 - s) + 0.3, WHITEGOLD, s => 1.2 * k * (1 - s * 0.5));
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
  const pos = dir.clone().multiplyScalar(lerp(2700, 2450, k)); pos.y = lerp(700, 1450, k);
  const L = leftOf(pos, V(0, pos.y, 0));
  const tgt = V(0, lerp(1450, 2250, k), 0).addScaledVector(L, 330);
  aim(cam, pos, tgt, 50);
  if (!_c2) _c2 = w.baseClouds.concat(wispsAround(21, 12, V(-560, 0, 700), 350, 500, 2100, 140, 360, 0.32, 0.0));
  st.clouds = _c2;
  st.cranes = [{ c: V(-900, 1000, 1150), v: V(10, 4, -9), n: 5, spread: 24, size: 2.6, seed: 8, t0: 3 }];
  st.fx = (fx, tt) => godLights(fx, tt, 1);
  st.caps = [
    { text: '众神，由此上下。', t0: 3.25, t1: 5.75, x: 110, y: 330, size: 66, align: 'left' },
    { text: '建木在都广，众帝所自上下。', t0: 3.75, t1: 5.75, x: 112, y: 430, size: 30, align: 'left', color: '#3b5156', stagger: 0.03, spacing: 0.08 },
    { text: '——《淮南子·地形训》', t0: 4.2, t1: 5.75, x: 112, y: 478, size: 26, align: 'left', color: '#4d6266', stagger: 0.02, spacing: 0.04 },
  ];
});

// S3 · 6–9 · 后来，天梯断了: the crack, the topple, debris in megastructure slow motion, chains whip loose
const BREAK_DIR = V(0.8, 0, 0.35).normalize();     // the upper trunk falls this way (away and to the right)
function breakState(w, t) {
  const j = w.jm; const { breakY, R: TR } = TRUNK;
  j.sleeve.visible = false; j.splinters.visible = true; j.upper.visible = true;
  const sk = seg(t, 6.05, 9.0); const k = Math.pow(sk, 1.3);
  const th = 0.95 * k;
  const pivot = BREAK_DIR.clone().multiplyScalar(TR * 0.9).add(axisOff(breakY)); pivot.y = breakY;
  const axis = V(0, 1, 0).cross(BREAK_DIR).normalize();
  const q = new THREE.Quaternion().setFromAxisAngle(axis, th);
  j.upper.quaternion.copy(q);
  const pp = pivot.clone().applyQuaternion(q);
  j.upper.position.copy(pivot).sub(pp).add(V(0, -520 * k * k, 0)).addScaledVector(BREAK_DIR, 260 * k);
  j.upper.updateMatrixWorld(true);
  return th;
}
let _c3 = null;
shot(6, 9, (t, w, cam, st) => {
  const kc = smooth(seg(t, 6.3, 8.6));
  setEnv(P.dawn, P.cold, kc * 0.45);
  const fl = t >= 6.0 ? Math.exp(-(t - 6.0) / 0.18) : 0;
  grade({ exp: 1.0 - 0.08 * kc, bloom: 0.45, flash: fl * 0.35, flashCol: [1, 0.95, 0.8], sat: 1.05 - 0.12 * kc, contrast: 1.1 + 0.1 * kc, gamma: [1 - 0.06 * kc, 1 - 0.06 * kc, 1 - 0.04 * kc] });
  breakState(w, t);
  const k = easeInOutSine(seg(t, 5.6, 9.4));
  const dir = V(-0.55, 0, 0.83).normalize();
  const pos = dir.clone().multiplyScalar(lerp(4300, 4500, k)); pos.y = lerp(900, 800, k);
  pos.add(shake(t, 6.0, 9, 1.4));
  const L = leftOf(pos, V(0, pos.y, 0));
  const tgt = V(0, lerp(3300, 3100, k), 0).addScaledVector(L, -300);
  aim(cam, pos, tgt, 56);
  if (!_c3) _c3 = w.baseClouds.concat(wispsAround(31, 16, V(-500, 0, 800), 500, 900, 2600, 160, 420, 0.45, 0.25));
  // dust bursting from the break
  const dust = [];
  if (t > 6.0) { const r = R(33); const d = t - 6.0; for (let i = 0; i < 34; i++) { const a = r() * 6.283; const sp = 40 + 60 * r(); const p = V(Math.cos(a) * (TRUNK.R + sp * d), TRUNK.breakY - 40 + (r() - 0.6) * 120 - d * d * 10, Math.sin(a) * (TRUNK.R + sp * d)).add(axisOff(TRUNK.breakY)); const wd = 260 + 300 * d + 160 * r(); dust.push({ p, w: wd, h: wd * 0.6, cell: 12 + (i % 4), op: 0.5 * Math.min(1, d * 3) * (1 - d / 4), flip: r() < 0.5, tint: C(0x9a907f) }); } }
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
    const t0 = 6.0 + r() * 0.5; const a = r() * 6.283; const out = 40 + 110 * r(); const upv = (r() - 0.3) * 60; const sz = 14 + 70 * Math.pow(r(), 2.2);
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
function edgeProps(w, on) { w.edgeProps.peach.visible = false; w.edgeProps.pine.visible = on; if (w.edgeProps.rocks) w.edgeProps.rocks.visible = on; if (w.edgeProps.tufts) w.edgeProps.tufts.visible = on; }
function stumpDust(t, seed = 41) { const r = R(seed); const out = []; for (let i = 0; i < 14; i++) { const a = r() * 6.283; const d = 300 + 260 * r() + 30 * t; out.push({ p: V(Math.cos(a) * d * 0.7, TRUNK.breakY + 60 + r() * 300 + t * 10, Math.sin(a) * d * 0.7).add(_ab), w: 380 + 300 * r(), h: 220 + 150 * r(), cell: 12 + (i % 4), op: 0.55, flip: r() < 0.5, tint: C(0xc4beb0) }); } return out; }
let _c4 = null;
function sectCam(w, cam, t, push, tiltDown = 0) {
  const E = sectEdge(w);
  const back = lerp(10.5, 7.5, push), side = 1.5;
  const pos = E.stand.clone().addScaledVector(E.dir, -back).addScaledVector(E.left, side);
  const gy = groundY(w.sect.userData.rock, pos.x, pos.z); pos.y = Math.max(gy ?? pos.y, E.stand.y) + 1.1 + 0.6 * tiltDown;
  const tgtP = axisOff(TRUNK.breakY).add(V(0, TRUNK.breakY - 350, 0));
  const toStump = tgtP.sub(pos); const yaw = Math.atan2(toStump.x, toStump.z) - 0.03;
  const pitch = lerp(0.085, -0.32, tiltDown);
  const f = V(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
  aim(cam, pos, pos.clone().add(f.multiplyScalar(100)), 48, 0, 0.3);
  return E;
}
shot(9, 12, (t, w, cam, st) => {
  setEnv(P.sect); grade({ exp: 1.0, bloom: 0.3, sat: 0.95 });
  fallenWorld(w); edgeProps(w, true);
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
  fallenWorld(w); edgeProps(w, true);
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

function fallPos(E, t) {
  const top = E.lip.clone().addScaledVector(E.dir, 6);
  if (t < 15.0) { const d = t - 13.5; return top.add(V(0, -(3 + 0.5 * 45 * d * d), 0)).addScaledVector(E.dir, d * 14); }
  const d15 = 1.5; const bottom = top.clone().add(V(0, -(3 + 0.5 * 45 * d15 * d15), 0)).addScaledVector(E.dir, d15 * 14);
  const k = easeIn(seg(t, 15.0, 15.42));
  return bottom.lerp(fallCam(E).add(V(0, 4, 0)), k);
}
function fallCam(E) { return E.lip.clone().addScaledVector(E.dir, 4).addScaledVector(E.left, -3).add(V(0, 16, 0)); }
function swordPos(E, t) {
  const h = fallPos(E, Math.min(t, 15.0));
  if (t < 14.2) return h.clone().add(V(0, 1.4, 0));
  // the sword leaves her back, dives far below her, then sweeps up under her feet (a J, not a loop)
  const k = seg(t, 14.2, 14.97);
  const dive = h.clone().add(V(0, -lerp(0, 60, Math.sin(Math.PI * Math.min(1, k * 1.15)) ), 0)).addScaledVector(E.left, 14 * Math.sin(Math.PI * k));
  return dive.add(V(0, -0.2, 0));
}
let _c5 = null;
shot(13.5, 15.42, (t, w, cam, st) => {
  setEnv(P.sect, P.flight, smooth(seg(t, 14.9, 15.3)));
  const fl = t >= 15.0 ? Math.exp(-(t - 15.0) / 0.14) : 0;
  grade({ exp: 1.0, bloom: 0.45 + 0.4 * fl, flash: fl * 0.45, flashCol: [0.85, 0.98, 1.0], sat: 1.05, contrast: 1.12 });
  fallenWorld(w);
  const E = sectEdge(w);
  const pos = fallCam(E);
  cam.up.copy(E.dir);
  cam.position.copy(pos); cam.lookAt(pos.clone().add(V(0, -100, 0)).addScaledVector(E.dir, 62).addScaledVector(E.left, 3));
  if (cam.fov !== 58 || cam.near !== 0.5) { cam.fov = 58; cam.near = 0.5; cam.updateProjectionMatrix(); }
  if (!_c5) _c5 = w.baseClouds.concat(wispsAround(51, 30, E.lip, 900, 80, 600, 120, 380, 0.6, 0.0));
  st.clouds = _c5;
  const hp = fallPos(E, t);
  const caught = t >= 14.98;
  st.heroPose = { pos: hp, scale: 1, pose: caught ? { fly: true, gust: 1, swordGlow: 2.0, lean: 0.2 } : { wind: [0.3, -1], gust: 1, armL: 0.75, armR: 0.8, sheathed: t < 14.2 }, rimDir: [-0.6, -0.8], light: C(0xf4f4f0), roll: caught ? 0 : Math.sin(t * 2.2) * 0.5 + (t - 13.5) * 0.8 };
  st.fx = (fx, tt) => {
    if (tt >= 14.2 && tt < 15.0) { const pts = []; for (let i = 0; i < 26; i++) pts.push(swordPos(E, Math.max(14.2, tt - i * 0.012))); fx.lines.poly(pts, s => 1.4 * (1 - s) + 0.1, CYAN, s => 2.2 * (1 - s)); fx.points.add(pts[0], 5, SWORD, 1.4); }
    if (tt >= 15.0) heroTrail(fx, (x) => fallPos(E, Math.max(15.0, x)).add(V(0, -0.2, 0)), tt, 28, 0.012, 1.6 * (1 + 3 * seg(tt, 15.15, 15.42)));
    const r = R(93); for (let i = 0; i < 24; i++) { const ph = (tt * 0.3 + r()) % 1; const p = E.lip.clone().addScaledVector(E.dir, 4 + r() * 20).addScaledVector(E.left, (r() - 0.5) * 30).add(V(0, -ph * 60 + 6, 0)); fx.petals.add(p, 0.2 + 0.12 * r(), C(0xf4b7b0), 0.9); }
  };
});

// S6a · 15.42–18 · chase: beside and behind her, spiralling up around the trunk just outside the branch-rung tips
const CH_R = 1120, CH_A0 = 1.55, CH_A1 = 2.3, CH_Y0 = 1020, CH_Y1 = 1700;
function chasePos(t) { const k = clamp((t - 15.0) / 3.0); const kk = 0.35 * k + 0.65 * easeOut(k); const a = lerp(CH_A0, CH_A1, kk); const r = CH_R + 30 * Math.sin(kk * 7); return V(Math.cos(a) * r, lerp(CH_Y0, CH_Y1, kk) + 18 * Math.sin(kk * 9), Math.sin(a) * r); }
let _c6 = null, _near6 = null;
shot(15.42, 18, (t, w, cam, st) => {
  setEnv(P.flight); grade({ exp: 1.0, bloom: 0.4, sat: 1.1, chroma: 0.0024, contrast: 1.14, rayThresh: 0.95 }); st.rays = 0.12;
  fallenWorld(w);
  const hp = chasePos(t), ahead = chasePos(t + 0.06); const f = ahead.clone().sub(hp).normalize();
  const fh = V(f.x, 0, f.z).normalize(); const left = V(fh.z, 0, -fh.x); const right = left.clone().negate();
  const bank = 0.14 + 0.06 * Math.sin((t - 15.4) * 2.3);
  const pos = hp.clone().addScaledVector(f, -3.6).addScaledVector(left, 5.6).add(V(0, -2.4, 0));
  aim(cam, pos, hp.clone().add(V(0, 1.7, 0)).addScaledVector(right, 1.2).addScaledVector(f, -0.6), 50, bank, 0.3);
  if (!_c6) { const r = R(61); _c6 = w.baseClouds.slice(); for (let i = 0; i <= 70; i++) { const p = chasePos(15.0 + i / 70 * 3.2); for (let j = 0; j < 2; j++) { const a = r() * 6.283; const d = 40 + 160 * r(); const wd = 60 + 140 * r(); _c6.push({ p: p.clone().add(V(Math.cos(a) * d, (r() - 0.5) * 90, Math.sin(a) * d)), w: wd * 1.8, h: wd * 0.5, cell: 12 + Math.floor(r() * 4), op: 0.35 + 0.35 * r(), flip: r() < 0.5 }); } } }
  st.clouds = _c6;
  st.heroPose = { pos: hp, pose: { fly: true, mirror: true, gust: 1, swordGlow: 1.4, lean: 0.3 + 0.05 * Math.sin(t * 2) }, rimDir: [0.8, -0.6], rim: 'rgba(255,226,170,0.95)', rimPx: 4, light: C(0xfff6ea), roll: 0 };
  st.fx = (fx, tt) => {
    heroTrail(fx, (x) => chasePos(Math.max(15.0, x)).add(V(0, -0.2, 0)), tt, 40, 0.008, 0.22);
    // soft speed wisps and motes rushing past close to the lens
    const r = R(66);
    for (let i = 0; i < 14; i++) { const s0 = r(); const ph = (tt * 1.6 + s0) % 1; const base = chasePos(tt + 0.35 - ph * 0.7); const ang = r() * 6.283; const rad = 9 + 16 * r(); const off = left.clone().multiplyScalar(Math.cos(ang) * rad).add(V(0, Math.sin(ang) * rad * 0.7, 0)); const p = base.add(off); const q = p.clone().addScaledVector(f, -(14 + 18 * r()));
      fx.wisps.add(q, p, 0.5 + 1.2 * r(), 0.2 + 0.4 * r(), C(0xffffff), 0.0, 0.16 * Math.sin(ph * Math.PI)); }
    for (let i = 0; i < 70; i++) { const ph = (tt * 2.4 + r()) % 1; const p = chasePos(tt + 0.3 - ph * 0.6).add(V((r() - 0.5) * 40, (r() - 0.5) * 30, (r() - 0.5) * 40)); const q = p.clone().addScaledVector(f, -4); const jc = [C(0xfff0b0), C(0xb8fff0), C(0xffb0a0), C(0x9fe8ff)][i % 4];
      fx.lines.add(q, p, 0.05, 0.12, jc, 0.0, 1.6 * Math.sin(ph * Math.PI)); }
    for (let i = 0; i < 30; i++) { const ph = (tt * 1.2 + r()) % 1; const p = chasePos(tt + 0.25 - ph * 0.5).add(V((r() - 0.5) * 30, (r() - 0.5) * 20 + Math.sin(tt * 3 + i) * 2, (r() - 0.5) * 30)); fx.petals.add(p, 0.22 + 0.15 * r(), C(0xf6b8b0), 0.95); }
    if (tt > 16.4) swordSwarm(fx, tt, { seed: 7, n: 60, t0: 16.4, spread: 1.6, c: V(0, 0, 0), rMin: 1200, rMax: 3000, yMin: 500, yMax: 1300, vMin: 260, vMax: 420, target: V(0, 6000, 0), w: 3, bright: 2.2 });
  };
  // close passers: lanterns and chains whipping by near the lens
  st.near = (wld, tt) => nearPassers(wld, tt);
});
function godLightsDead() {}
function nearPassers(w, t) {}

// S6b · 18–21 · 一剑起，万剑随: she streaks up past the broken stump; sword-lights rise from every island
const WB = new THREE.CatmullRomCurve3([V(1250, 2050, 500), V(1050, 2350, 250), V(880, 2700, 30), V(760, 3100, -160), V(680, 3550, -320)]);
function widePos(t) { return WB.getPointAt(clamp((t - 17.8) / 3.4)); }
let _c7 = null, _sw6 = null; const SIDE6 = V(0.82, 0, -0.57);
shot(18, 21, (t, w, cam, st) => {
  setEnv(P.flight, P.storm, 0.35 * smooth(seg(t, 20.0, 21.0))); grade({ exp: 0.98, bloom: 0.45, sat: 1.08, contrast: 1.14, rayThresh: 0.97 }); st.rays = 0.1;
  fallenWorld(w);
  const hp = widePos(t);
  const k = easeInOutSine(seg(t, 17.8, 21.2));
  // side-on, from outside the trunk: she rises through the frame past the stump, the swarm rising all around her
  const camAt = (tt) => { const kk = easeInOutSine(seg(tt, 17.8, 21.2)); return [widePos(lerp(18.2, 20.3, kk)).addScaledVector(SIDE6, lerp(300, 420, kk)).add(V(0, -170, 0)), widePos(lerp(18.3, 20.6, kk)).add(V(0, 60, 0))]; };
  const [pos, tgt] = camAt(t);
  aim(cam, pos, tgt, 58);
  if (!_sw6) { // sword-light starts sampled inside the view (from the mid-shot camera) so the swarm crosses the frame
    const [cp, ct] = camAt(19.4); const rc = new THREE.PerspectiveCamera(58, W / H, 1, 1e5); rc.position.copy(cp); rc.lookAt(ct); rc.updateMatrixWorld(); rc.updateProjectionMatrix();
    const r = R(66); _sw6 = [];
    for (let i = 0; i < 340; i++) { const sx = r() * 2.6 - 1.3, sy = -1.25 + 1.1 * r(); const d = 260 + 2600 * Math.pow(r(), 0.8);
      const v = V(sx, sy, 0.5).unproject(rc).sub(cp).normalize(); const st0 = cp.clone().addScaledVector(v, d);
      const tgt2 = V(560 + (r() - 0.5) * 700, 5600, -480 + (r() - 0.5) * 700); const dir = tgt2.sub(st0).normalize();
      _sw6.push({ p: st0, dir, t0: 17.4 + r() * 3.3, sp: 180 + 280 * r(), gold: r() < 0.22, w: 1.2 + 2.2 * r() }); }
  }
  ENV.uSunDir.value.set(0.55, 0.45, 0.7).normalize();
  if (!_c7) _c7 = w.baseClouds.concat(wispsAround(71, 30, V(1200, 0, 600), 1400, 1500, 3600, 200, 520, 0.45, 0.3).map(c => (c.cell < 8 ? { ...c, cell: 12 + (c.cell % 4) } : c)));
  st.clouds = _c7.concat(stumpDust(t - 9));
  st.heroPose = { pos: hp, scale: 4.5, pose: { fly: true, gust: 1, swordGlow: 2.0, lean: 0.25 }, rimDir: [-0.8, -0.6], light: C(0xfff6ea) };
  st.fx = (fx, tt) => {
    heroTrail(fx, (x) => widePos(x), tt, 36, 0.02, 3.4);
    fx.points.add(hp, 7, SWORD, 1.4);
    for (const s of _sw6) { const dt = tt - s.t0; if (dt < 0) continue;
      const head = s.p.clone().addScaledVector(s.dir, s.sp * dt); const len = Math.min(s.sp * 0.22 + 25, s.sp * dt + 1); const tail = head.clone().addScaledVector(s.dir, -len);
      const kk = Math.min(1, dt / 0.25); fx.lines.add(tail, head, s.w * 0.3, s.w, s.gold ? GOLD : CYAN, 0.0, 2.4 * kk); fx.points.add(head, s.w * 4, s.gold ? WHITEGOLD : SWORD, 1.4 * kk); }
  };
  st.cranes = [{ c: V(1500, 2500, 650), v: V(-14, 3, -6), n: 7, spread: 30, size: 2.6, seed: 21, t0: 18 }];
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
  const pos = hp.clone().add(V(-26, -40, 60));
  aim(cam, pos, hp.clone().add(V(20, 120, -90)), 60, 0.08, 0.5);
  if (!_c8) { const r = R(81); _c8 = []; for (let i = 0; i < 120; i++) { const a = r() * 6.283, d = 60 + 2600 * Math.sqrt(r()); const wd = 260 + 800 * r(); _c8.push({ p: V(300 + Math.cos(a) * d, 4150 + r() * 230, -380 + Math.sin(a) * d), w: wd * 1.6, h: wd * 0.9, cell: 8 + Math.floor(r() * 8), op: 0.85, flip: r() < 0.5, flat: true, tint: C(0x9db2b8) }); } }
  st.clouds = _c8;
  // lightning
  let flash = 0, fpos = V(0, 4300, 0);
  for (const [bt, i] of BOLTS) { const d = t - bt; if (d >= 0 && d < 0.35) { const f = (d < 0.05 ? 1 : 0.55 + 0.45 * Math.sin(d * 90)) * (1 - d / 0.35); if (f > flash) { flash = f; fpos = i === 3 ? hp.clone() : V(300 + (i - 1) * 260, 4000, -380 + (i % 2 ? 200 : -200)); } } }
  ENV.uFlashCol.value.set(1.0, 0.92, 0.7).multiplyScalar(flash * 0.55); ENV.uFlashPos.value.copy(fpos);
  const hit = t >= 23.25 ? Math.exp(-(t - 23.25) / 0.3) : 0; const end = t >= 23.85 ? smooth(seg(t, 23.85, 24.0)) : 0;
  grade({ exp: 1.0, bloom: 0.6, sat: 1.0, gamma: [1.0, 1.0, 1.03], flash: flash * 0.12 + end * 0.9, flashCol: [1, 0.95, 0.8], chroma: 0.0025 });
  st.heroPose = { pos: hp, scale: 2.6, pose: { wind: [0.2 * Math.sin(t * 7), 1], gust: 1, armL: 0.3, armR: lerp(0.95, 1.0, hit), onSword: true, sheathed: false, feet: true, swordGlow: 1.3 + 2 * hit }, rimDir: [-0.5, -0.9], rim: 'rgba(255,240,200,0.9)', light: C(0xc9d6da).lerp(C(0xffffff), flash) };
  st.fx = (fx, tt) => {
    heroTrail(fx, (x) => stormPos(Math.max(21, x)), tt, 30, 0.012, 1.1);
    for (const [bt, i] of BOLTS) { const d = tt - bt; if (d < 0 || d > 0.35) continue; const k = (d < 0.05 ? 1 : 0.5 + 0.5 * Math.sin(d * 90)) * (1 - d / 0.35);
      if (i < 3) { const A = hp.clone().add(V((i - 1) * 140 + 40, 4420 - hp.y, (i % 2 ? 90 : -110))); const B = hp.clone().add(V((i - 1) * 60 - 30, -260, (i % 2 ? 40 : -60))); drawBolt(fx, 100 + i, A, B, k, 4); }
      else { const A = hp.clone().add(V(40, 1000, -30)); drawBolt(fx, 140, A, hp.clone().add(V(0, 3, 0)), k, 0); const r = R(150); for (let b = 0; b < 6; b++) { const dir = V(r() - 0.5, -0.6 - r() * 0.6, r() - 0.5).normalize(); drawBolt(fx, 160 + b, hp.clone().add(V(0, 2, 0)), hp.clone().addScaledVector(dir, 120 + 200 * r()), k * 0.8, 1); } } }
    if (hit > 0.01) fx.points.add(hp.clone().add(V(0, 1, 0)), 5 * hit + 1.5, WHITEGOLD, 1.5 * hit);
    swordSwarm(fx, tt, { seed: 10, n: 40, t0: 20.6, spread: 3.2, c: V(300, 0, -380), rMin: 60, rMax: 900, yMin: 2600, yMax: 3300, vMin: 220, vMax: 380, target: V(300, 6000, -380), w: 2.5, fade: (h) => h.y > 4350 ? 0 : 1 });
  };
  st.caps = [{ text: '天，不许。', t0: 21.3, t1: 23.15, x: 540, y: 330, size: 70, color: '#f3efe2', glow: 'rgba(10,25,30,0.8)' }];
});

// comets: sword-lights rising in arcs from below the cloud sea toward the gate, bright heads and curved glowing tails
function comets(fx, t, cam) {
  const r = R(212); const N = 230;
  const camF = V(0.1, 0, -1).normalize();
  for (let i = 0; i < N; i++) {
    const t0 = 23.4 + r() * 6.2; const life = 2.6 + 2.0 * r();
    const near = i < 40;
    const dist = near ? 250 + 900 * r() : 1200 + 6500 * r();
    const lat = (r() - 0.5) * dist * 0.9;
    const start = V(-1700 + lat + camF.x * dist, 4250, 900 + camF.z * dist);
    const target = FIN.gate.clone().add(V((r() - 0.5) * 1600, 600 + r() * 2200, 0));
    const v0 = V(-160 - 200 * r(), 380 + 240 * r(), 150 * (r() - 0.3));
    const pos = (tt) => { const d = Math.max(0, tt - t0); const k = Math.min(1, d / life); const p = start.clone().addScaledVector(v0, d); const pull = target.clone().sub(p); return p.addScaledVector(pull, k * k * 0.85); };
    const d = t - t0; if (d < 0) continue;
    const head = pos(t); if (head.y < 4380) continue;
    const pts = []; for (let j = 0; j < 18; j++) pts.push(pos(t - j * 0.06));
    const gold = r() < 0.55; const jewel = r() < 0.12;
    const c = jewel ? [C(0x9ff2d8), C(0xffb0a0), C(0xbfe6ff)][i % 3] : (gold ? GOLD : CYAN);
    const w = near ? 3 + 2.5 * r() : 8 + 10 * r(); const fade = Math.min(1, d / 0.25);
    fx.lines.poly(pts, s => w * (1 - s * 0.85), c, s => 2.8 * Math.pow(1 - s, 1.5) * fade);
    fx.points.add(head, w * 8, gold ? WHITEGOLD : SWORD, 2.0 * fade);
  }
}

// S8 · 24–30 · 破云 (平远): above the clouds in gold; the heaven gate backlit on a far cloud bank; a river of sword-lights
let _c9 = null;
const FIN = { cam0: V(-1500, 4470, 900), cam1: V(-1750, 4950, 2300), gate: V(1300, 7200, -9500) };
const FIN_DIR = V(0.255, 0, -0.967).normalize(), FIN_SIDE = V(0.967, 0, 0.255);
// she bursts up out of the cloud sea and flies for the gate; the camera rides just behind her shoulder, then lets her go
function finalPos(t) { const d = t - 23.8; const p = V(-1380, 4300, 640).addScaledVector(FIN_DIR, 115 * d + 6 * d * d); p.y += 230 * easeOut(seg(t, 23.8, 25.0)) + 22 * Math.max(0, d) + 1.5 * Math.sin(t * 2.1); p.addScaledVector(FIN_SIDE, 4 * Math.sin(t * 1.3)); return p; }
shot(24, 30.1, (t, w, cam, st) => {
  setEnv(P.gold);
  fallenWorld(w); w.storm.visible = false;
  const U = w.sea.userData.U; U.uSeaY.value = 4400; U.uSeaCover.value = 0.7; w.sea.visible = true;
  const ent = t < 24.7 ? Math.exp(-(t - 24.0) / 0.22) : 0;
  grade({ exp: 0.89, bloom: 0.34, sat: 1.1, flash: ent * 0.9, flashCol: [1, 0.93, 0.75], thresh: 0.95, vig: 0.3, contrast: 1.16, rayThresh: 0.98 }); st.rays = 0.22;
  const k = easeInOutSine(seg(t, 24.0, 30.0));
  const tc = t < 27.4 ? t : 27.4 + (t - 27.4) * 0.75 - 0.06 * (t - 27.4) * (t - 27.4);        // the camera eases off: she pulls away toward the gate
  const pos = finalPos(Math.max(23.9, tc)).addScaledVector(FIN_DIR, -lerp(30, 46, k)).addScaledVector(FIN_SIDE, lerp(-2.5, 3.5, k)).add(V(0, lerp(2.5, 6, k) - 1.5 * Math.sin(tc * 2.1), 0));
  const tgt = pos.clone().add(FIN_DIR.clone().add(V(0, lerp(0.06, 0.13, k) + 0.2 * easeInOut(seg(t, 27.1, 28.5)), 0)).normalize().multiplyScalar(1000));   // tilt up to the sky for the title
  aim(cam, pos, tgt, 54, -0.03 * Math.sin(t * 0.9));
  if (!_c9) { const r = R(91); _c9 = []; for (let i = 0; i < 60; i++) { const a = r() * 6.283, d = 1500 + 15000 * Math.pow(r(), 0.6); const wd = 900 + 2200 * r(); _c9.push({ p: V(Math.cos(a) * d, 4380 + wd * 0.1, -6000 + Math.sin(a) * d * 0.8), w: wd, h: wd * 0.45, cell: Math.floor(r() * 8), op: 0.95, flip: r() < 0.5 }); }
    // the cloud bank the stair rises out of (kept below the gate base)
    for (let i = 0; i < 16; i++) { const wd = 2500 + 3500 * r(); _c9.push({ p: V(FIN.gate.x + (r() - 0.5) * 14000, 4700 + r() * 900, FIN.gate.z + 1800 + (r() - 0.5) * 3000), w: wd, h: wd * 0.42, cell: Math.floor(r() * 8), op: 0.95, flip: r() < 0.5 }); }
    for (let i = 0; i < 8; i++) { const wd = 7000 + 6000 * r(); _c9.push({ p: V(FIN.gate.x + (r() - 0.5) * 10000, 5000 + i * 120, FIN.gate.z + 2500 + (r() - 0.5) * 2000), w: wd, h: wd * 0.18, cell: 8 + (i % 4), op: 0.6, flip: r() < 0.5 }); } }
  st.clouds = _c9;
  st.gates = true;
  const hp = finalPos(t);
  st.heroPose = { pos: hp, scale: 1.9, pose: { fly: true, gust: 1, swordGlow: 1.8, lean: 0.25 }, rimDir: [0.5, -0.85], rim: 'rgba(255,225,160,0.95)', rimPx: 5, light: C(0xfff0d8), op: 1 };
  st.fx = (fx, tt) => {
    heroTrail(fx, finalPos, tt, 20, 0.011, 1.6);
    fx.points.add(hp, 4, WHITEGOLD, 0.9 * clamp((hp.distanceTo(_camPos) - 60) / 120));
    comets(fx, tt, cam);
  };
  st.caps = [{ text: '梯断了，人就学会了飞。', t0: 24.9, t1: 27.55, x: 540, y: 330, size: 62, color: '#2a2d26', glow: 'rgba(255,246,220,0.8)' }];
  if (t >= 27.6) st.title = { t0: 27.75, x: 540, y: 470, size: 220, text: '御剑', color: '#232822', glow: 'rgba(255,240,205,0.9)' };
});

export function applyShot(t, w, cam, heroCam, post) {
  const st = { hero: false };
  w.storm.visible = false; w.sea.visible = true; w.edgeProps.peach.visible = w.edgeProps.pine.visible = false; if (w.edgeProps.rocks) w.edgeProps.rocks.visible = false; if (w.edgeProps.tufts) w.edgeProps.tufts.visible = false;
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
