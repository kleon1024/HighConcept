// Abstract shots: where literal modelling would be weak, the idea is drawn instead.
//   pattern — one gold line evolves through culture: oracle crack 卜 → 云雷纹 → meander → baroque volute → circuit.
//   dream   — the network dreams: a constellation sheep jumps the fence three times, the fourth becomes the seed.
import {
  THREE, TAU, clamp, lerp, smooth, easeOut, easeIn, easeInOut, range, v3, col, rng,
  backdrop, rig, mats, Dust, LineBuilder, squareSpiral, camera, look, drift, seedPoint,
} from '../core.js';

// ---------------------------------------------------------------- polyline utilities
function resample(pts, n) {
  const d = [0];
  for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const L = d[d.length - 1], out = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const s = L * k / (n - 1);
    while (j < d.length - 2 && d[j + 1] < s) j++;
    const t = (s - d[j]) / Math.max(1e-6, d[j + 1] - d[j]);
    out.push(pts[j].clone().lerp(pts[j + 1], clamp(t)));
  }
  return out;
}
const P = (x, y) => v3(x, y, 0);

// ---------------------------------------------------------------- the five patterns (≈ fit in [-1.6,1.6]×[-0.9,0.9])
function patOracle() { // 卜: a long vertical crack with one side branch, slightly jagged
  const r = rng(5), pts = [];
  for (let i = 0; i <= 20; i++) pts.push(P(-0.15 + (r() - 0.5) * 0.06, 0.85 - i * 0.085));
  for (let i = 20; i >= 9; i--) pts.push(P(pts[i].x + 0.01, pts[i].y));
  for (let i = 1; i <= 10; i++) pts.push(P(-0.15 + i * 0.09, 0.08 - i * 0.025 + (r() - 0.5) * 0.05));
  return pts;
}
function patYunlei() { // 云雷纹: two mirrored square spirals joined into an S
  const sp = squareSpiral(3, 0.15).map(p => P(p.x * 1.1, p.y * 1.1));
  const left = sp.slice().reverse().map(p => P(p.x - 0.6, p.y));
  const right = sp.map(p => P(-p.x + 0.6, -p.y));
  return [...left, P(-0.05, -0.55), P(0.05, 0.55), ...right];
}
function patMeander() { // Greek key, three units
  const pts = [P(-1.5, -0.6)];
  for (let k = 0; k < 3; k++) {
    const x = -1.5 + k * 1.0;
    pts.push(P(x + 0.8, -0.6), P(x + 0.8, 0.6), P(x + 0.2, 0.6), P(x + 0.2, -0.2), P(x + 0.55, -0.2), P(x + 0.55, 0.3), P(x + 0.45, 0.3), P(x + 0.45, -0.1), P(x + 0.3, -0.1), P(x + 0.3, 0.5), P(x + 0.7, 0.5), P(x + 0.7, -0.5), P(x + 1.0, -0.5));
  }
  pts.push(P(1.5, -0.6));
  return pts;
}
function patVolute() { // baroque S-scroll: two golden spirals joined
  const spiral = (cx, cy, s, dir) => { const o = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * TAU * 1.6; const r = s * Math.pow(0.78, a * 1.6); o.push(P(cx + Math.cos(a * dir) * r, cy + Math.sin(a * dir) * r)); } return o; };
  const a = spiral(-0.7, 0.15, 0.62, 1).reverse(), b = spiral(0.7, -0.15, 0.62, 1).map(p => P(1.4 - p.x + 0.0, -p.y));
  const leaf = []; for (let i = 0; i <= 30; i++) { const s = i / 30; leaf.push(P(-0.1 + s * 0.2, 0.47 - Math.sin(s * Math.PI) * 0.94 * (1 - s * 0.1))); }
  return [...a, ...leaf, ...b.map(p => P(p.x - 0.7, p.y)).reverse().reverse()];
}
function patCircuit() { // PCB trace with vias and 45° bends
  const pts = [P(-1.55, 0.55)];
  const add = (x, y) => pts.push(P(x, y));
  const via = (x, y) => { for (let i = 0; i <= 16; i++) { const a = i / 16 * TAU; add(x + Math.cos(a) * 0.07, y + Math.sin(a) * 0.07); } };
  add(-1.0, 0.55); add(-0.75, 0.3); add(-0.75, -0.2); via(-0.75, -0.27); add(-0.75, -0.2);
  add(-0.75, -0.45); add(-0.5, -0.7); add(0.1, -0.7); add(0.3, -0.5); add(0.3, 0.2); via(0.3, 0.27); add(0.3, 0.2);
  add(0.3, 0.45); add(0.5, 0.65); add(1.0, 0.65); add(1.2, 0.45); add(1.2, -0.3); add(1.55, -0.3);
  return pts;
}
const PATTERNS = [patOracle, patYunlei, patMeander, patVolute, patCircuit];
const PAT_COLORS = ['#fff1d0', '#ffcf70', '#ffe3a8', '#ffc65a', '#7fdcff'];

// ---------------------------------------------------------------- constellation sheep (side view, facing right)
const SHEEP_STARS = [
  [-0.62, -0.12], [-0.6, 0.25], [-0.35, 0.42], [-0.05, 0.46], [0.25, 0.42], [0.5, 0.3], // 0–5 back
  [0.62, 0.34], [0.86, 0.27], [0.95, 0.08], [0.78, 0.0], [0.7, 0.44],                // 6–10 head, ear
  [0.45, -0.25], [0.12, -0.32], [-0.3, -0.3],                                          // 11–13 belly
  [0.38, -0.62], [0.13, -0.63], [-0.28, -0.62], [-0.5, -0.6], [-0.74, 0.1],           // 14–18 hooves, tail
];
const SHEEP_LINES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 5], [6, 10], [5, 11], [11, 12], [12, 13], [13, 0], [11, 14], [12, 15], [13, 16], [0, 17], [0, 18]];

export const shots = {
  // ── the line of culture ──
  pattern() {
    const S = new THREE.Scene(), C = camera(30);
    backdrop(S, 'theft');
    S.fog = null;
    rig(S, 'theft', { key: v3(-6, 5, 4), keyI: 1.6, rimI: 1.5, shadow: false });
    const slab = new THREE.Mesh(new THREE.PlaneGeometry(12, 8, 1, 1), mats.stone('#2a2018', { roughness: 0.85 }));
    slab.position.z = -0.02; S.add(slab);
    const N = 700;
    const shapes = PATTERNS.map(f => resample(f(), N));
    // ghost etchings: every earlier pattern stays faintly cut into the stone
    const ghosts = shapes.map((sh, i) => { const L = new LineBuilder().poly(sh, false, '#ffb050', 0.5).build(0); L.position.z = 0.001; S.add(L); return L; });
    const lineMat = mats.glow('#ffcf70', 2.0);
    let tubeMesh = null;
    const head = seedPoint(0.6); S.add(head);
    const glow = new THREE.PointLight(col('#ffb050'), 2, 4); glow.position.z = 0.6; S.add(glow);
    const marks = [0, 0.2, 0.4, 0.6, 0.8]; // when each pattern arrives (local u)
    return {
      scene: S, cam: C,
      update(u, t) {
        let k = 0; while (k < marks.length - 1 && u >= marks[k + 1]) k++;
        const m = easeOut(clamp((u - marks[k]) / 0.06)); // snap morph in ~4 frames
        const from = shapes[Math.max(0, k - 1)], to = shapes[k];
        const pts = to.map((p, i) => (k === 0 ? p : from[i].clone().lerp(p, m)));
        const draw = k === 0 ? easeOut(range(u, 0, 0.15)) : 1; // the first crack draws itself
        const n = Math.max(2, Math.floor(draw * N));
        if (tubeMesh) { S.remove(tubeMesh); tubeMesh.geometry.dispose(); }
        tubeMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.slice(0, n).map(p => p.clone().setZ(0.02))), Math.min(900, n * 2), 0.018, 6, false), lineMat);
        S.add(tubeMesh);
        lineMat.color.copy(col(PAT_COLORS[k])).multiplyScalar(2.0);
        ghosts.forEach((g, i) => { g.material.opacity = i < k ? 0.35 : 0; });
        const hp = pts[Math.floor((draw * (n - 1)) * (k === 0 ? 1 : (0.5 + 0.5 * Math.sin(t * 3))))] || pts[0];
        head.position.copy(hp).setZ(0.05); glow.position.set(hp.x, hp.y, 0.6);
        look(C, v3(lerp(-0.4, 0.4, u), lerp(-2.6, -2.2, u), lerp(4.6, 4.0, u)).add(drift(t, 0.03)), v3(lerp(-0.1, 0.1, u), 0, 0));
        return { bloom: 0.45, exposure: 1.0 };
      },
    };
  },

  // ── the machine dreams of an electric sheep ──
  dream() {
    const S = new THREE.Scene(), C = camera(35);
    backdrop(S, 'data', { stars: 2200, seed: 11 });
    const r = rng(21);
    const makeSheep = () => {
      const g = new THREE.Group();
      const stars = new Dust(SHEEP_STARS.length, { size: 0.09 });
      SHEEP_STARS.forEach(([x, y], i) => { stars.set(i, x, y, 0); stars.size[i] = r.range(0.7, 1.6); stars.color(i, col('#e8f6ff'), 3); });
      stars.dirty(true); g.add(stars);
      const L = new LineBuilder(); SHEEP_LINES.forEach(([a, b]) => L.seg(P(...SHEEP_STARS[a]), P(...SHEEP_STARS[b]), '#6fd8ff', '#6fd8ff', 0.9));
      const lines = L.build(0.8); g.add(lines);
      const wool = new Dust(1400, { size: 0.025 });
      for (let i = 0; i < 1400; i++) {
        let x, y; do { x = r.range(-0.62, 0.55); y = r.range(-0.3, 0.46); } while (((x + 0.03) / 0.6) ** 2 + ((y - 0.07) / 0.38) ** 2 > 1);
        wool.set(i, x, y, r.gauss() * 0.05); wool.alpha[i] = r.range(0.15, 0.6); wool.color(i, col('#9fe6ff'), 1.5);
      }
      wool.dirty(true); g.add(wool);
      return { g, stars, lines, wool };
    };
    const sheep = [makeSheep(), makeSheep(), makeSheep(), makeSheep()];
    sheep.forEach(s => S.add(s.g));
    // the fence: five stars, two rails
    const F = new LineBuilder(); const fence = [];
    [[0, -0.75], [0, 0.05], [-0.25, -0.75], [-0.25, 0.0], [0.25, -0.75], [0.25, 0.0]].forEach(p => fence.push(P(...p)));
    F.seg(fence[0], fence[1], '#ffcf70', '#ffcf70', 0.8).seg(fence[2], fence[3], '#ffcf70', '#ffcf70', 0.6).seg(fence[4], fence[5], '#ffcf70', '#ffcf70', 0.6)
      .seg(P(-0.4, -0.25), P(0.4, -0.25), '#ffcf70', '#ffcf70', 0.6).seg(P(-0.4, -0.05), P(0.4, -0.05), '#ffcf70', '#ffcf70', 0.6);
    const fenceL = F.build(0.7); fenceL.position.y = -0.75; fenceL.scale.setScalar(1.6); S.add(fenceL);
    // the seed the fourth sheep becomes
    const seed = seedPoint(0.45); S.add(seed);
    const stream = new Dust(SHEEP_STARS.length + 1400, { size: 0.03 }); S.add(stream);
    // timing in local u (shot is 4.75 beats from beat 45.75): jumps start on the fate-motif hits 47.25, 47.75, 48.25, 48.75
    const B = 4.75, at = b => (b - 45.75) / B;
    const jumps = [at(47.25), at(47.75), at(48.25), at(48.75)];
    const jumpLen = [0.5 / B, 0.5 / B, 0.5 / B, 1.2 / B];
    const placeSheep = (s, q, i) => {
      const x = lerp(-2.4, 2.4, q), y = 1.25 * Math.sin(Math.PI * q) - 0.55;
      s.g.position.set(x, y, 0); s.g.rotation.z = 0.35 * Math.cos(Math.PI * q) * (i === 3 ? 0.6 : 1);
    };
    return {
      scene: S, cam: C,
      update(u, t) {
        // the first sheep draws itself out of the stars before the jumps begin
        const form = easeOut(range(u, 0.0, at(47.2)));
        sheep.forEach((s, i) => {
          const q = (u - jumps[i]) / jumpLen[i];
          const visible = i === 0 ? u < jumps[0] + jumpLen[0] : q > -0.05 && q < 1.05;
          s.g.visible = visible;
          if (!visible) return;
          if (i === 0 && q < 0) { placeSheep(s, 0, 0); s.lines.reveal(form); s.stars.opacity(form); s.wool.opacity(form * 0.8); return; }
          placeSheep(s, clamp(q), i);
          s.lines.reveal(1); s.stars.opacity(1); s.wool.opacity(0.8);
          if (i === 3) { const k = range(q, 0.45, 0.7); s.lines.material.opacity = 0.8 * (1 - k); s.stars.opacity(1 - k); s.wool.opacity(0.8 * (1 - k)); s.g.visible = k < 1; }
        });
        // fourth sheep: at the top of its jump it streams into one gold point, which then falls
        const q3 = (u - jumps[3]) / jumpLen[3], k = easeInOut(range(q3, 0.45, 0.8)), fall = easeIn(range(u, 0.86, 1));
        const s3 = sheep[3];
        const peak = v3(0, 1.25 - 0.55, 0);
        const target = peak.clone().add(v3(0, -fall * 2.2, 0));
        if (q3 > 0.45) {
          s3.g.updateMatrixWorld(true);
          let n = 0;
          const pushPt = (src, i, scale) => { const w = v3(src.pos[i * 3], src.pos[i * 3 + 1], src.pos[i * 3 + 2]).applyMatrix4(s3.g.matrixWorld); const a = i * 0.7 + t * 5; const sw = (1 - k) * 0.25; stream.set(n, lerp(w.x, target.x, k) + Math.cos(a) * sw, lerp(w.y, target.y, k) + Math.sin(a) * sw, 0); stream.alpha[n] = scale * (1 - k * 0.9); stream.color(n, col('#ffcf70'), 2); n++; };
          for (let i = 0; i < SHEEP_STARS.length; i++) pushPt(s3.stars, i, 1);
          for (let i = 0; i < 1400; i++) pushPt(s3.wool, i, 0.5);
          stream.dirty(true); stream.visible = true;
        } else stream.visible = false;
        seed.position.copy(target); seed.opacity(range(q3, 0.6, 0.8));
        fenceL.material.opacity = 0.7 * range(u, 0.1, 0.3) * (1 - range(u, 0.8, 0.95));
        look(C, v3(0, 0.15, 6.2).add(drift(t, 0.05)), v3(0, 0.05 - fall * 0.4, 0));
        return { bloom: 0.8, exposure: 1.0 };
      },
    };
  },
};
