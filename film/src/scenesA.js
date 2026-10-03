// 序 · 卵 / I 振 / II 冻
import {
  THREE, GOLD, DGOLD, WHITE, ICE, TAU, clamp, lerp, smooth, easeOut, easeIn, range, v3, rng, fbm, noise3,
  Dust, LineBuilder, wire, circle, squareSpiral, crack, camera, look, orbit, starfield, seedPoint,
} from './core.js';

const eggR = y => 0.78 * Math.sqrt(Math.max(0, 1 - y * y)) * (1 - 0.13 * y);
const eggPt = (th, y, s = 1.4) => v3(eggR(y) * Math.cos(th) * s, y * s, eggR(y) * Math.sin(th) * s);

function eggThread(turns = 16, n = 1400) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const s = i / n, y = -Math.cos(Math.PI * s); pts.push(eggPt(s * TAU * turns, y)); }
  return pts;
}

// snake/ring builder shared by the ouroboros and the ending
export function snakeGeometry(span, R, phase, { rings = 90, tube = 0.22, hex = 6 } = {}) {
  const L = new LineBuilder();
  const centers = [], frames = [];
  for (let i = 0; i <= rings; i++) {
    const s = i / rings, a = phase + s * span;
    centers.push(v3(Math.cos(a) * R, Math.sin(a) * R, 0));
    frames.push(a);
  }
  const ringsPts = centers.map((c, i) => {
    const s = i / rings;
    const w = tube * (s < 0.85 ? lerp(0.25, 1, Math.pow(s / 0.85, 0.6)) : lerp(1, 1.5, (s - 0.85) / 0.15) * (s > 0.97 ? 0.7 : 1));
    const a = frames[i], radial = v3(Math.cos(a), Math.sin(a), 0), up = v3(0, 0, 1);
    const pts = [];
    for (let k = 0; k < hex; k++) {
      const t = k / hex * TAU + (i % 2) * Math.PI / hex;
      pts.push(c.clone().add(radial.clone().multiplyScalar(Math.cos(t) * w)).add(up.clone().multiplyScalar(Math.sin(t) * w)));
    }
    return pts;
  });
  ringsPts.forEach((pts, i) => {
    const k = 0.35 + 0.65 * (i / rings);
    L.poly(pts, true, GOLD.clone().multiplyScalar(k));
    if (i > 0) pts.forEach((p, j) => L.seg(ringsPts[i - 1][j], p, DGOLD, DGOLD));
  });
  return { lines: L.build(0.9), head: centers[centers.length - 1], tail: centers[0] };
}

export const scenesA = {
  // ── 序 · 卵 ── fate thread → golden egg → Brahma's lotus → first crack
  egg() {
    const S = new THREE.Scene(), C = camera(35);
    const seed = seedPoint(); S.add(seed);
    const threadPts = [v3(0, 0, 0), ...eggThread()];
    const thread = new LineBuilder().poly(threadPts, false, GOLD, s => 0.4 + 0.6 * Math.sin(Math.PI * s)).build(0.85);
    S.add(thread);
    // 云雷纹 etched around the equator
    const lb = new LineBuilder();
    for (let k = 0; k < 10; k++) {
      const th0 = k / 10 * TAU;
      [-0.12, 0.28].forEach((yc, j) => {
        const sp = squareSpiral(3, 0.15).map(p => eggPt(th0 + (j ? -p.x : p.x) * 0.42, yc + p.y * 0.3, 1.415));
        lb.poly(sp, false, GOLD);
      });
    }
    const pattern = lb.build(0.9); S.add(pattern);
    // lotus
    const lotus = new THREE.Group(); lotus.position.y = -1.55; S.add(lotus);
    const petals = [];
    for (let layer = 0; layer < 2; layer++) for (let k = 0; k < 12; k++) {
      const pts = [];
      for (let i = 0; i <= 24; i++) { const s = i / 24; pts.push(v3(Math.sin(Math.PI * s) * 0.32 * (1 - 0.3 * s), 0, s * 1.3)); }
      for (let i = 24; i >= 0; i--) { const s = i / 24; pts.push(v3(-Math.sin(Math.PI * s) * 0.32 * (1 - 0.3 * s), 0, s * 1.3)); }
      const mid = []; for (let i = 0; i <= 10; i++) mid.push(v3(0, 0, i / 10 * 1.25));
      const g = new THREE.Group();
      const pl = new LineBuilder().poly(pts, true, layer ? GOLD : DGOLD).poly(mid, false, DGOLD).build(0.8);
      const inner = new THREE.Group(); inner.add(pl); g.add(inner);
      g.rotation.y = k / 12 * TAU + layer * TAU / 24;
      lotus.add(g); petals.push({ inner, layer });
    }
    const dust = starfield(2500, 18, 3, 0.4); S.add(dust);
    const r = rng(7);
    const crk = new LineBuilder();
    crack(eggPt(0.4, 0.95, 1.43), eggPt(0.9, -0.1, 1.43), r, { depth: 5, rough: 0.5, branches: 4 }).forEach(pl => crk.poly(pl.map(p => p.normalize().multiplyScalar(1.45 * (0.8 + 0.2 * Math.abs(p.y)) )), false, WHITE));
    const cr = crk.build(1); S.add(cr);
    return {
      scene: S, cam: C,
      update(u) {
        const a = range(u, 0.06, 0.2);
        seed.opacity(smooth(a)); seed.scale.setScalar(1 + 2 * range(u, 0.2, 0.4));
        thread.reveal(easeOut(range(u, 0.2, 0.62)));
        pattern.reveal(range(u, 0.5, 0.8)); pattern.material.opacity = 0.9;
        petals.forEach(({ inner, layer }) => { inner.rotation.x = -lerp(1.45, layer ? 0.75 : 0.35, easeOut(range(u, 0.55, 0.95))); });
        lotus.scale.setScalar(smooth(range(u, 0.5, 0.7)));
        dust.opacity(0.35 * range(u, 0.3, 0.8));
        cr.reveal(range(u, 0.86, 0.98)); cr.material.opacity = range(u, 0.86, 0.9);
        S.rotation.y = 0.5 * u;
        look(C, v3(0, 0.2, lerp(9.5, 6.5, smooth(u))), v3(0, -0.15 * u, 0));
        return { bloom: 1.1 + 0.8 * range(u, 0.9, 1) };
      },
    };
  },

  // ── shell bursts; Pangu's eyes become sun and moon ──
  burst() {
    const S = new THREE.Scene(), C = camera(38);
    const pts = eggThread(16, 1400), r = rng(11), shards = [];
    for (let k = 0; k < 70; k++) {
      const i0 = k * 20, seg = pts.slice(i0, i0 + 22);
      const c = seg[0].clone();
      const g = new THREE.Group();
      g.add(new LineBuilder().poly(seg.map(p => p.clone().sub(c)), false, GOLD).build(0.9));
      g.position.copy(c); S.add(g);
      shards.push({ g, c, v: c.clone().normalize().multiplyScalar(r.range(2, 6)), w: r.dir().multiplyScalar(r.range(2, 8)) });
    }
    const sun = wire(new THREE.IcosahedronGeometry(0.55, 3), GOLD, 0.9); S.add(sun);
    const moon = wire(new THREE.IcosahedronGeometry(0.4, 2), DGOLD, 0.6); S.add(moon);
    const halo = new Dust(4000, { size: 0.04 }); S.add(halo);
    const hr = rng(4); const hd = [];
    for (let i = 0; i < 4000; i++) hd.push({ d: hr.dir(), r: hr.range(0.5, 1.6), which: i % 3 === 0 ? 1 : 0, ph: hr() });
    const flash = seedPoint(); S.add(flash);
    return {
      scene: S, cam: C,
      update(u) {
        const e = easeOut(u);
        shards.forEach(s => { s.g.position.copy(s.c).addScaledVector(s.v, e * 1.4); s.g.rotation.set(s.w.x * e, s.w.y * e, s.w.z * e); s.g.children[0].material.opacity = 1 - u * 0.7; });
        sun.position.set(-2.4 * e, 0.3 * e, 0); moon.position.set(2.4 * e, -0.2 * e, 0);
        sun.rotation.y = u * 2; moon.rotation.y = -u * 2;
        hd.forEach((h, i) => { const c = h.which ? moon.position : sun.position; const rr = h.r * (0.6 + 0.4 * e) * (h.which ? 0.7 : 1);
          halo.set(i, c.x + h.d.x * rr, c.y + h.d.y * rr, c.z + h.d.z * rr); halo.alpha[i] = (h.which ? 0.35 : 0.8) * (1 - h.r / 1.8); });
        halo.dirty();
        flash.scale.setScalar(lerp(14, 1, easeOut(u * 2))); flash.opacity(1 - u);
        look(C, v3(0, 0, lerp(5, 8, e)));
        return { bloom: 1.6 - u * 0.4 };
      },
    };
  },

  // ── strings: closed strings in standing-wave modes ──
  strings() {
    const S = new THREE.Scene(), C = camera(45), r = rng(21), loops = [];
    const L = new LineBuilder();
    for (let k = 0; k < 90; k++) {
      const n = 2 + Math.floor(r() * 7), R = r.range(0.3, 1.1), q = new THREE.Quaternion().setFromUnitVectors(v3(0, 0, 1), r.dir());
      const c = v3(r.range(-6, 6), r.range(-3.5, 3.5), r.range(-14, 2));
      loops.push({ n, R, q, c, amp: r.range(0.08, 0.22), w: r.range(10, 22), start: L.count });
      const pts = circle(1, 128); L.poly(pts, true, r() < 0.3 ? WHITE : GOLD);
    }
    const lines = L.build(0.8); S.add(lines); S.add(starfield(1500, 30, 5, 0.3));
    const pos = lines.geometry.attributes.position;
    return {
      scene: S, cam: C,
      update(u, t) {
        loops.forEach(o => {
          for (let i = 0; i < 128; i++) for (const j of [0, 1]) {
            const a = ((i + j) % 128) / 128 * TAU;
            const rr = o.R * (1 + o.amp * Math.sin(o.n * a) * Math.sin(o.w * t));
            const p = v3(Math.cos(a) * rr, Math.sin(a) * rr, o.amp * 0.5 * Math.cos(o.n * a) * Math.cos(o.w * t)).applyQuaternion(o.q).add(o.c);
            pos.setXYZ(o.start + i * 2 + j, p.x, p.y, p.z);
          }
        });
        pos.needsUpdate = true;
        look(C, v3(0, 0, lerp(6, 2, u)), v3(0.3 * u, 0, -10));
      },
    };
  },

  // ── Platonic solids, nested (Kepler / Timaeus) ──
  solids() {
    const S = new THREE.Scene(), C = camera(40);
    const geos = [new THREE.OctahedronGeometry(0.9), new THREE.IcosahedronGeometry(1.25), new THREE.DodecahedronGeometry(1.65), new THREE.TetrahedronGeometry(2.4), new THREE.BoxGeometry(2.6, 2.6, 2.6)];
    const solids = geos.map((g, i) => { const w = wire(g, i % 2 ? GOLD : WHITE, 0.85, true); S.add(w); return w; });
    const verts = [];
    geos.forEach((g, gi) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) verts.push({ v: v3(p.getX(i), p.getY(i), p.getZ(i)), gi }); });
    const d = new Dust(verts.length * 12, { size: 0.05 }); S.add(d);
    const r = rng(3), em = [];
    for (let i = 0; i < verts.length * 12; i++) em.push({ k: i % verts.length, ph: r(), sp: r.range(0.5, 2) });
    S.add(starfield(1500, 30, 8, 0.3));
    return {
      scene: S, cam: C,
      update(u, t) {
        solids.forEach((s, i) => s.rotation.set(t * (0.4 + i * 0.15) * (i % 2 ? 1 : -1), t * (0.7 - i * 0.1), 0.2 * i));
        em.forEach((e, i) => {
          const vv = verts[e.k], s = solids[vv.gi], a = (e.ph + t * e.sp) % 1;
          const p = vv.v.clone().applyEuler(s.rotation).multiplyScalar(1 + a * 0.8);
          d.setV(i, p); d.alpha[i] = (1 - a) * 0.35;
        });
        d.dirty();
        look(C, orbit(lerp(7.5, 6, u), 0.4 + u * 0.5, 0.25));
      },
    };
  },

  // ── electron clouds: 2s → 4p → 6d ──
  orbitals() {
    const S = new THREE.Scene(), C = camera(40);
    const lag = (k, a, x) => { if (k === 0) return 1; let L0 = 1, L1 = 1 + a - x; for (let i = 1; i < k; i++) { const L2 = ((2 * i + 1 + a - x) * L1 - (i + a) * L0) / (i + 1); L0 = L1; L1 = L2; } return L1; };
    const NP = 16000;
    const sample = (n, l, ang, seed) => {
      const r = rng(seed), rmax = n * n * 2.2 + 6, out = [];
      const dens = (rr, ct) => { const rho = 2 * rr / n; const R = Math.pow(rho, l) * Math.exp(-rho / 2) * lag(n - l - 1, 2 * l + 1, rho); return R * R * rr * rr * ang(ct); };
      let mx = 0; for (let i = 0; i < 40000; i++) mx = Math.max(mx, dens(r() * rmax, r() * 2 - 1));
      while (out.length < NP) {
        const rr = r() * rmax, d = r.dir();
        if (r() * mx * 1.05 < dens(rr, d.z)) out.push(d.multiplyScalar(rr * 2.4 / (n * n * 1.6 + 3)));
      }
      return out;
    };
    const clouds = [
      sample(2, 0, () => 1, 1),
      sample(4, 1, c => c * c, 2),
      sample(6, 2, c => (3 * c * c - 1) ** 2, 3),
    ];
    const d = new Dust(NP, { size: 0.03 }); S.add(d);
    const r = rng(9); for (let i = 0; i < NP; i++) { d.alpha[i] = r.range(0.35, 0.9); d.color(i, r() < 0.15 ? WHITE : GOLD); }
    d.dirty(true);
    const nuc = seedPoint(); S.add(nuc);
    return {
      scene: S, cam: C,
      update(u, t) {
        const ph = Math.min(2, Math.floor(u * 3)), lu = u * 3 - ph;
        const from = clouds[Math.max(0, ph - 1)], to = clouds[ph], m = ph === 0 ? 1 : easeOut(lu / 0.45);
        for (let i = 0; i < NP; i++) { const a = from[i], b = to[i]; d.set(i, lerp(a.x, b.x, m), lerp(a.y, b.y, m), lerp(a.z, b.z, m)); }
        d.dirty(); d.rotation.y = t * 0.6;
        look(C, orbit(5.2, 0.3 + u * 0.4, 0.35));
        return { bloom: 1.0 + (1 - Math.min(1, lu * 4)) * 0.8 };
      },
    };
  },

  // ── supercluster cosmic web (and the neural network that rhymes with it) ──
  cosmicweb(p = {}) {
    const S = new THREE.Scene(), C = camera(45), r = rng(42);
    const nodes = [];
    for (let i = 0; i < 150; i++) { const c = r.dir().multiplyScalar(7 * Math.cbrt(r())); c.y *= 0.7; nodes.push(c); }
    const edges = [];
    nodes.forEach((a, i) => {
      nodes.map((b, j) => [a.distanceTo(b), j]).sort((x, y) => x[0] - y[0]).slice(1, 4).forEach(([dd, j]) => { if (i < j || !edges.some(e => e[0] === j && e[1] === i)) edges.push([i, j]); });
    });
    const NP = 42000, d = new Dust(NP, { size: 0.03 }); S.add(d);
    for (let i = 0; i < NP; i++) {
      if (i < 12000) { const c = nodes[i % nodes.length]; d.setV(i, c.clone().add(v3(r.gauss(), r.gauss(), r.gauss()).multiplyScalar(0.16))); d.alpha[i] = r.range(0.4, 1); d.color(i, r() < 0.3 ? WHITE : GOLD); }
      else { const [a, b] = edges[i % edges.length]; const s = r(); const pp = nodes[a].clone().lerp(nodes[b], s).add(v3(r.gauss(), r.gauss(), r.gauss()).multiplyScalar(0.07 + 0.05 * Math.sin(Math.PI * s))); d.setV(i, pp); d.alpha[i] = r.range(0.15, 0.7); d.color(i, r() < 0.7 ? GOLD : DGOLD); }
    }
    d.dirty(true);
    let lines = null, pulses = null;
    if (p.neural) {
      const L = new LineBuilder(); edges.forEach(([a, b]) => L.seg(nodes[a], nodes[b], DGOLD, DGOLD));
      lines = L.build(0.45); S.add(lines);
      pulses = new Dust(edges.length * 2, { size: 0.12 }); S.add(pulses);
      pulses.ph = edges.flatMap(() => [r(), r()]);
      for (let i = 0; i < pulses.n; i++) pulses.color(i, WHITE);
      pulses.dirty(true);
    }
    S.add(starfield(2000, 40, 77, 0.25));
    const camAt = u => orbit(lerp(6, 15, easeOut(u)), 0.2 + 0.5 * u, 0.25);
    return {
      scene: S, cam: C,
      update(u, t) {
        if (p.neural) {
          look(C, camAt(1).multiplyScalar(lerp(1, 0.82, u)));
          edges.forEach(([a, b], k) => { for (const j of [0, 1]) { const s = (pulses.ph[k * 2 + j] + t * 1.6) % 1; pulses.setV(k * 2 + j, nodes[a].clone().lerp(nodes[b], s)); pulses.alpha[k * 2 + j] = Math.sin(Math.PI * s) * smooth(u * 3); } });
          pulses.dirty();
          lines.material.opacity = 0.45 * smooth(u * 2);
        } else look(C, camAt(u));
      },
    };
  },

  // ── meteorite falling to the polar earth ──
  meteor() {
    const S = new THREE.Scene(), C = camera(40);
    const g = new THREE.IcosahedronGeometry(1, 3), pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) { const v = v3(pa.getX(i), pa.getY(i), pa.getZ(i)); v.multiplyScalar(1 + 0.35 * fbm(v.x * 1.3, v.y * 1.3, v.z * 1.3)); pa.setXYZ(i, v.x, v.y, v.z); }
    const rock = new THREE.Group(); rock.add(wire(g, GOLD, 0.55));
    // Widmanstätten lamellae: three families of parallel chords
    const wl = new LineBuilder();
    [v3(1, 0.2, 0), v3(0.2, 1, 0.3), v3(0.3, -0.2, 1)].forEach((dir, f) => {
      dir.normalize(); const side = v3(0, 0, 1).cross(dir).normalize(); const up = dir.clone().cross(side);
      for (let k = -4; k <= 4; k++) wl.seg(side.clone().multiplyScalar(k * 0.18).sub(dir.clone().multiplyScalar(0.9)), side.clone().multiplyScalar(k * 0.18).add(dir.clone().multiplyScalar(0.9)), f ? DGOLD : GOLD);
      void up;
    });
    rock.add(wl.build(0.5)); const core = seedPoint(); rock.add(core); S.add(rock);
    const r = rng(5), NT = 9000, tail = new Dust(NT, { size: 0.05 }); S.add(tail);
    const td = []; for (let i = 0; i < NT; i++) td.push({ ph: r(), off: v3(r.gauss(), r.gauss(), r.gauss()), br: Math.floor(r() * 3) });
    const brDir = [v3(0, 0, 0), v3(0.5, 0.4, 0), v3(-0.4, 0.5, 0.2)];
    const earth = new THREE.Group();
    const eL = new LineBuilder();
    for (let la = -80; la <= 80; la += 10) { const y = Math.sin(la * Math.PI / 180), rr = Math.cos(la * Math.PI / 180); eL.poly(circle(rr, 120).map(p => v3(p.x, y, p.y)), true, la > 50 ? ICE : DGOLD); }
    for (let lo = 0; lo < 180; lo += 15) eL.poly(circle(1, 120).map(p => v3(p.x, p.y, 0).applyAxisAngle(v3(0, 1, 0), lo * Math.PI / 180)), true, DGOLD);
    earth.add(eL.build(0.5)); earth.scale.setScalar(30); earth.rotation.x = 0.9; S.add(earth);
    S.add(starfield(3000, 60, 13, 0.35));
    return {
      scene: S, cam: C,
      update(u, t) {
        const e = easeIn(u * 0.9);
        const pos = v3(lerp(-6, 0, e), lerp(5, 0.2, e), lerp(-26, 4.5, e));
        rock.position.copy(pos); rock.rotation.set(t * 1.5, t * 2.1, 0);
        const back = v3(-6, 5, -26).sub(v3(0, 0.2, 4.5)).normalize();
        td.forEach((o, i) => {
          const a = (o.ph + t * 2.5) % 1, bd = brDir[o.br];
          const p = pos.clone().addScaledVector(back, a * 14).addScaledVector(bd, a > 0.35 ? (a - 0.35) * 6 : 0).addScaledVector(o.off, 0.08 + a * 0.5);
          tail.setV(i, p); tail.alpha[i] = (1 - a) * 0.9;
        });
        tail.dirty();
        earth.position.set(0, lerp(-55, -33, smooth(range(u, 0.3, 1))), -10);
        earth.rotation.y = t * 0.1;
        look(C, v3(0, 0, 9), v3(pos.x * 0.3, pos.y * 0.3, 0));
        return { bloom: 1.2 + 1.5 * range(u, 0.85, 1), flash: 0.8 * easeIn(range(u, 0.9, 1)) };
      },
    };
  },

  // ── II: Freud's iceberg in the prehistoric polar sea ──
  iceberg() {
    const S = new THREE.Scene(), C = camera(42);
    const water = new LineBuilder();
    for (let k = -40; k <= 40; k++) { water.seg(v3(k * 0.6, 0, -24), v3(k * 0.6, 0, 24), ICE); water.seg(v3(-24, 0, k * 0.6), v3(24, 0, k * 0.6), ICE); }
    S.add(water.build(0.12));
    const g = new THREE.IcosahedronGeometry(1, 4), pa = g.attributes.position;
    for (let i = 0; i < pa.count; i++) {
      const v = v3(pa.getX(i), pa.getY(i), pa.getZ(i)); const n = 1 + 0.32 * fbm(v.x * 1.8 + 3, v.y * 1.8, v.z * 1.8);
      pa.setXYZ(i, v.x * 3.2 * n, v.y * 4.6 * n - 3.4, v.z * 3.0 * n);
    }
    const wg = new THREE.WireframeGeometry(g), wp = wg.attributes.position, col = new Float32Array(wp.count * 3);
    for (let i = 0; i < wp.count; i++) { const c = wp.getY(i) > 0 ? ICE : DGOLD.clone().lerp(GOLD, clamp(-wp.getY(i) / 8)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    wg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const berg = new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    S.add(berg);
    // the unconscious: buried forms glowing under the waterline
    const deep = new THREE.Group(); deep.position.y = -4.2; S.add(deep);
    [new THREE.DodecahedronGeometry(0.5), new THREE.TorusKnotGeometry(0.4, 0.08, 64, 6), new THREE.OctahedronGeometry(0.45)].forEach((gg, i) => {
      const w = wire(gg, GOLD, 0.7, i !== 1); w.position.set((i - 1) * 1.3, Math.sin(i * 2) * 0.8, 0.4); deep.add(w);
    });
    const r = rng(17), core = new Dust(5000, { size: 0.05 }); deep.add(core);
    for (let i = 0; i < 5000; i++) { core.setV(i, v3(r.gauss() * 1.2, r.gauss() * 1.4, r.gauss() * 1.0)); core.alpha[i] = r.range(0.2, 0.9); }
    core.dirty();
    const snow = new Dust(3000, { size: 0.04, color: ICE }); S.add(snow);
    const sd = []; for (let i = 0; i < 3000; i++) sd.push(v3(r.range(-14, 14), r.range(-10, 10), r.range(-14, 10)));
    return {
      scene: S, cam: C,
      update(u, t) {
        sd.forEach((p, i) => snow.set(i, p.x + Math.sin(t + i) * 0.2, ((p.y - t * 0.6) % 10 + 10) % 20 - 10, p.z));
        snow.dirty();
        deep.rotation.y = t * 0.4;
        const y = lerp(2.4, -4.5, smooth(range(u, 0.2, 0.8)));
        look(C, v3(Math.sin(u) * 3, y, lerp(13, 10, u)), v3(0, lerp(0.5, -3.5, smooth(range(u, 0.2, 0.8))), 0));
        return { tint: y > 0 ? 0.2 : 0.45 };
      },
    };
  },

  // ── H2O: 104.5° ──
  h2o() {
    const S = new THREE.Scene(), C = camera(40);
    const mol = new THREE.Group(); S.add(mol);
    const O = wire(new THREE.IcosahedronGeometry(0.62, 2), GOLD, 0.8); mol.add(O);
    const ang = 104.5 * Math.PI / 180, hs = [];
    [-1, 1].forEach(sg => {
      const p = v3(Math.sin(sg * ang / 2) * 1.5, -Math.cos(ang / 2) * 1.5, 0);
      const h = wire(new THREE.IcosahedronGeometry(0.36, 2), ICE, 0.8); h.position.copy(p); mol.add(h); hs.push(p);
      const L = new LineBuilder().seg(v3(), p, GOLD).seg(v3(0.05, 0, 0.05), p.clone().add(v3(0.05, 0, 0.05)), DGOLD).build(0.9); mol.add(L);
    });
    const arcPts = []; for (let i = 0; i <= 60; i++) { const a = -ang / 2 + ang * i / 60; arcPts.push(v3(Math.sin(a) * 0.95, -Math.cos(a) * 0.95, 0)); }
    const arc = new LineBuilder().poly(arcPts, false, WHITE).build(1); mol.add(arc);
    const r = rng(2), cl = new Dust(6000, { size: 0.03 }); mol.add(cl);
    for (let i = 0; i < 6000; i++) { const c = i % 3 === 0 ? v3() : hs[i % 2]; cl.setV(i, c.clone().add(r.dir().multiplyScalar(Math.abs(r.gauss()) * (c.length() ? 0.4 : 0.75)))); cl.alpha[i] = r.range(0.05, 0.25); }
    cl.dirty();
    // ice Ih lattice behind
    const lat = new LineBuilder();
    for (let z = 0; z < 3; z++) for (let i = -8; i <= 8; i++) for (let j = -5; j <= 5; j++) {
      const cx = i * 1.5 * 1.1, cy = j * 1.732 * 1.1 + (i % 2 ? 0.866 * 1.1 : 0);
      lat.poly(circle(1.1, 6).map(p => v3(p.x + cx, p.y + cy, -6 - z * 3)), true, ICE);
    }
    S.add(lat.build(0.12));
    return {
      scene: S, cam: C,
      update(u, t) {
        arc.reveal(easeOut(range(u, 0.15, 0.7)));
        mol.rotation.y = Math.sin(t * 1.5) * 0.5; mol.rotation.x = 0.2;
        look(C, v3(0, 0, lerp(6.5, 5.2, u)), v3(0, -0.4, 0));
      },
    };
  },

  // ── structural formulae drawing themselves (no letters) ──
  formula() {
    const S = new THREE.Scene(), C = camera(40);
    const hex = (cx, cy, s, rot = 0) => circle(s, 6).map(p => v3(p.x, p.y, 0).applyAxisAngle(v3(0, 0, 1), rot).add(v3(cx, cy, 0)));
    const mols = [];
    const mk = (fn, pos, rot) => { const L = new LineBuilder(), atoms = []; fn(L, atoms); const g = new THREE.Group(); const l = L.build(0.95); g.add(l); const d = new Dust(atoms.length, { size: 0.09 }); atoms.forEach((a, i) => { d.setV(i, a); d.color(i, WHITE); }); d.dirty(true); g.add(d); g.position.copy(pos); g.rotation.set(...rot); S.add(g); mols.push({ l, d, g }); };
    const ring = (L, atoms, pts, dbl = []) => { L.poly(pts, true, GOLD); pts.forEach(p => atoms.push(p)); const c = pts.reduce((a, b) => a.clone().add(b)).multiplyScalar(1 / pts.length); dbl.forEach(i => L.seg(pts[i].clone().lerp(c, 0.2), pts[(i + 1) % pts.length].clone().lerp(c, 0.2), DGOLD)); };
    // adenine: fused 6+5 rings with amine branch
    mk((L, A) => { const h = hex(0, 0, 0.8, Math.PI / 6); ring(L, A, h, [0, 2, 4]);
      const p5 = [h[0], h[5], h[5].clone().add(v3(0.9, -0.15, 0)), h[0].clone().add(v3(1.25, 0.4, 0)), h[0].clone().add(v3(0.9, 0.95, 0))];
      L.poly([h[0], p5[4], p5[3], p5[2], h[5]], false, GOLD); A.push(p5[2], p5[3], p5[4]);
      const n = h[1].clone().add(v3(0, 0.8, 0)); L.seg(h[1], n, GOLD); A.push(n); }, v3(-2.6, 0.6, 0), [0.1, 0.4, 0]);
    // ribose pentagon with branches
    mk((L, A) => { const p = circle(0.75, 5).map(q => v3(q.x, q.y, 0)); ring(L, A, p); [0, 1, 3].forEach(i => { const e = p[i].clone().multiplyScalar(1.8); L.seg(p[i], e, DGOLD); A.push(e); }); }, v3(2.4, 1.1, -1.5), [-0.3, -0.5, 0.2]);
    // glycine zigzag with C=O
    mk((L, A) => { const z = [v3(-1.4, 0, 0), v3(-0.7, 0.4, 0), v3(0, 0, 0), v3(0.7, 0.4, 0)]; L.poly(z, false, GOLD); z.forEach(p => A.push(p)); const o = v3(0, -0.8, 0); L.seg(z[2], o, GOLD).seg(z[2].clone().add(v3(0.1, 0, 0)), o.clone().add(v3(0.1, 0, 0)), DGOLD); A.push(o); }, v3(0.4, -1.6, 0.6), [0.2, 0.2, -0.1]);
    // benzene foreshadow
    mk((L, A) => ring(L, A, hex(0, 0, 0.7), [0, 2, 4]), v3(-0.5, 2.0, -3), [0.6, 0.2, 0]);
    S.add(starfield(1200, 25, 31, 0.25));
    return {
      scene: S, cam: C,
      update(u, t) {
        mols.forEach((m, i) => { const a = range(u, i * 0.12, 0.45 + i * 0.12); m.l.reveal(easeOut(a)); m.d.opacity(a); m.g.rotation.y += 0.004; });
        look(C, v3(Math.sin(t) * 0.5, 0, lerp(7, 5.8, u)));
      },
    };
  },

  // ── Kekulé's dream: the snake bites its tail and becomes benzene ──
  ouroboros() {
    const S = new THREE.Scene(), C = camera(38);
    const holder = new THREE.Group(); S.add(holder);
    const r = rng(6), NP = 6000, pi = new Dust(NP, { size: 0.04 }); S.add(pi);
    const pd = []; for (let i = 0; i < NP; i++) pd.push({ a: r() * TAU, rr: r.gauss() * 0.22, h: (i % 2 ? 1 : -1) * (0.55 + r.gauss() * 0.15) });
    const hexR = 1.9, hexPts = circle(hexR, 6).map(p => v3(p.x, p.y, 0));
    const benz = new LineBuilder(); benz.poly(hexPts, true, WHITE);
    [0, 2, 4].forEach(i => benz.seg(hexPts[i].clone().multiplyScalar(0.8), hexPts[(i + 1) % 6].clone().multiplyScalar(0.8), GOLD));
    const bz = benz.build(1); S.add(bz);
    const atoms = new Dust(6, { size: 0.25 }); hexPts.forEach((p, i) => { atoms.setV(i, p); atoms.color(i, WHITE); }); atoms.dirty(true); S.add(atoms);
    let snake = null;
    return {
      scene: S, cam: C,
      update(u, t) {
        const bite = 0.5;
        if (snake) { holder.remove(snake.lines); snake.lines.geometry.dispose(); }
        const span = u < bite ? lerp(TAU * 0.72, TAU * 0.995, easeIn(u / bite)) : TAU * 0.995;
        snake = snakeGeometry(span, hexR, -t * 2.2, { tube: 0.3 * (1 - smooth(range(u, bite, 0.85))) + 0.02 });
        holder.add(snake.lines);
        snake.lines.material.opacity = 0.9 * (1 - smooth(range(u, 0.6, 0.95)));
        const k = smooth(range(u, bite, 0.8));
        bz.material.opacity = k; atoms.opacity(k);
        pd.forEach((p, i) => { const a = p.a + t * 3; const rr = hexR * 0.95 + p.rr; pi.set(i, Math.cos(a) * rr, Math.sin(a) * rr, p.h); pi.alpha[i] = 0.5; });
        pi.dirty(); pi.opacity(smooth(range(u, 0.6, 0.9)));
        S.rotation.x = -0.75 + 0.2 * u; S.rotation.z = t * 0.15;
        look(C, v3(0, 0, lerp(7.5, 6.8, u)));
        return { flash: u > bite ? 0.6 * Math.exp(-(u - bite) * 30) : 0, bloom: 1.2 + (u > bite ? Math.exp(-(u - bite) * 12) : 0) };
      },
    };
  },

  // ── DNA tunnel ──
  dna() {
    const S = new THREE.Scene(), C = camera(70);
    const L = new LineBuilder(), R = 1.25, pitch = 3.4, n = 260, rungs = [];
    const strand = off => { const pts = []; for (let i = 0; i <= n * 4; i++) { const z = -i / 4 * 0.34; const a = z / pitch * TAU + off; pts.push(v3(Math.cos(a) * R, Math.sin(a) * R, z)); } return pts; };
    L.poly(strand(0), false, GOLD); L.poly(strand(2.2), false, GOLD);
    const nd = new Dust(n * 2, { size: 0.06 });
    for (let i = 0; i < n; i++) {
      const z = -i * 0.34, a = z / pitch * TAU;
      const p1 = v3(Math.cos(a) * R, Math.sin(a) * R, z), p2 = v3(Math.cos(a + 2.2) * R, Math.sin(a + 2.2) * R, z);
      const m = p1.clone().lerp(p2, 0.5);
      L.seg(p1, m, DGOLD, GOLD).seg(m, p2, GOLD, DGOLD);
      nd.setV(i * 2, p1); nd.setV(i * 2 + 1, p2); rungs.push(m);
      if (i % 10 === 5) { const sp = squareSpiral(2, 0.2).map(q => v3(q.x * 0.25, q.y * 0.25, 0).applyAxisAngle(v3(0, 0, 1), a).add(m)); L.poly(sp, false, DGOLD); }
    }
    nd.dirty(true);
    S.add(L.build(0.75)); S.add(nd);
    const gp = seedPoint(); gp.position.copy(rungs[40]); S.add(gp);
    return {
      scene: S, cam: C,
      update(u, t) {
        const z = lerp(4, -22, u);
        C.position.set(0, 0, z); C.up.set(Math.cos(t * 0.8), Math.sin(t * 0.8), 0); C.lookAt(0.2, 0, z - 10);
        gp.opacity(0.6 + 0.4 * Math.sin(t * 20));
      },
    };
  },
};
