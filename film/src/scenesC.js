// V 繁 / VI 降 / VII 觉
import {
  THREE, GOLD, DGOLD, WHITE, ICE, TAU, clamp, lerp, smooth, easeOut, easeIn, range, v3, rng, fbm, noise3,
  Dust, LineBuilder, wire, circle, squareSpiral, camera, look, orbit, starfield, seedPoint,
} from './core.js';
import { snakeGeometry } from './scenesA.js';

// ---------- loss landscape + a real momentum-SGD trajectory ----------
const wells = [[0, 0, -2.6, 2.2], [4, -3, -1.2, 1.4], [-4, 3, -1.0, 1.3], [5, 5, 1.6, 1.6], [-5, -4, 1.4, 1.5], [2, 6, 1.0, 1.0], [-3, -6, 0.9, 1.2], [6, 0, 0.8, 1.0]];
export const lossF = (x, z) => {
  let h = 0.018 * (x * x + z * z) + 0.25 * Math.sin(1.2 * x) * Math.cos(1.0 * z) + 0.35 * fbm(x * 0.15, 0.3, z * 0.15, 3);
  for (const [cx, cz, a, s] of wells) h += a * Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (2 * s * s));
  return h * 1.3;
};
export const trajectory = (() => {
  const r = rng(99), pts = []; let x = 5.2, z = 5.6, vx = 0, vz = 0;
  for (let i = 0; i < 700; i++) {
    const e = 1e-3, gx = (lossF(x + e, z) - lossF(x - e, z)) / (2 * e), gz = (lossF(x, z + e) - lossF(x, z - e)) / (2 * e);
    vx = 0.9 * vx - 0.035 * gx + r.gauss() * 0.004; vz = 0.9 * vz - 0.035 * gz + r.gauss() * 0.004;
    x += vx; z += vz; pts.push(v3(x, lossF(x, z) + 0.06, z));
  }
  return pts;
})();
function terrain(ext = 10, n = 90, f = lossF) {
  const L = new LineBuilder();
  for (const axis of [0, 1]) for (let i = 0; i <= n; i++) {
    const pts = [];
    for (let j = 0; j <= n * 2; j++) {
      const a = -ext + 2 * ext * i / n, b = -ext + 2 * ext * j / (n * 2);
      const x = axis ? b : a, z = axis ? a : b, y = f(x, z);
      pts.push(v3(x, y, z));
    }
    const c = GOLD.clone().multiplyScalar(0.9);
    L.poly(pts, false, c, s => 0.35 + 0.65 * clamp(1 - Math.abs(pts[Math.min(pts.length - 1, Math.floor(s * pts.length))].y) / 3));
  }
  return L.build(0.42);
}

export const scenesC = {
  // ── Athens: Parthenon and golden rectangles ──
  parthenon() {
    const S = new THREE.Scene(), C = camera(40), G = new THREE.Group(); S.add(G);
    for (let s = 0; s < 3; s++) G.add(wire(new THREE.BoxGeometry(9.6 - s * 0.35, 0.22, 4.6 - s * 0.35).translate(0, -2.0 + s * 0.22, 0), DGOLD, 0.6, true));
    const colAt = (x, z) => { const g = new THREE.Group(); g.add(wire(new THREE.CylinderGeometry(0.2, 0.24, 3.1, 10, 1, true), GOLD, 0.16)); g.add(wire(new THREE.BoxGeometry(0.55, 0.12, 0.55).translate(0, 1.6, 0), GOLD, 0.6, true)); g.position.set(x, -0.25, z); G.add(g); };
    for (let i = 0; i < 8; i++) { colAt(-4.2 + i * 1.2, 2.0); colAt(-4.2 + i * 1.2, -2.0); }
    for (let i = 1; i < 5; i++) { colAt(-4.2, 2 - i * 0.8); colAt(4.2, 2 - i * 0.8); }
    G.add(wire(new THREE.BoxGeometry(9.2, 0.6, 4.4).translate(0, 1.65, 0), GOLD, 0.6, true));
    const ped = new LineBuilder().poly([v3(-4.6, 1.95, 2.2), v3(0, 3.05, 2.2), v3(4.6, 1.95, 2.2)], true, GOLD).poly([v3(-4.6, 1.95, -2.2), v3(0, 3.05, -2.2), v3(4.6, 1.95, -2.2)], true, GOLD).seg(v3(0, 3.05, 2.2), v3(0, 3.05, -2.2), GOLD);
    G.add(ped.build(0.7));
    // golden rectangles + spiral on the facade
    const phi = 1.618, gr = new LineBuilder(); let x = -4.6, y = -2.1, w = 9.2, h = w / phi, dir = 0; const spiral = [];
    for (let k = 0; k < 9; k++) {
      gr.poly([v3(x, y, 2.25), v3(x + w, y, 2.25), v3(x + w, y + h, 2.25), v3(x, y + h, 2.25)], true, WHITE);
      const s = Math.min(w, h); let cx, cy, a0;
      if (dir === 0) { cx = x + s; cy = y; a0 = Math.PI / 2; x += s; w -= s; }
      else if (dir === 1) { cx = x; cy = y + h - s; a0 = 0; h -= s; }
      else if (dir === 2) { cx = x + w - s; cy = y + h; a0 = -Math.PI / 2; w -= s; }
      else { cx = x + w; cy = y + s; a0 = Math.PI; y += s; h -= s; }
      for (let i = 0; i <= 16; i++) { const a = a0 + i / 16 * Math.PI / 2; spiral.push(v3(cx + Math.cos(a) * s, cy + Math.sin(a) * s, 2.26)); }
      dir = (dir + 1) % 4;
    }
    const grl = gr.build(0.5); G.add(grl); const spl = new LineBuilder().poly(spiral, false, WHITE).build(1); G.add(spl);
    S.add(starfield(2000, 40, 3, 0.3));
    return {
      scene: S, cam: C,
      update(u) {
        grl.reveal(range(u, 0.1, 0.6)); spl.reveal(easeOut(range(u, 0.3, 0.95)));
        look(C, orbit(13, lerp(-0.5, -0.15, u), lerp(-0.05, 0.08, u)), v3(0, 0.3, 0));
      },
    };
  },

  // ── geocentric cosmos: deferents, epicycles, rosettes ──
  epicycles() {
    const S = new THREE.Scene(), C = camera(40);
    S.add(wire(new THREE.IcosahedronGeometry(0.35, 2), ICE, 0.8));
    const planets = [[1.6, 0.55, 1, 6.2], [2.6, 0.9, 1, -4.1], [3.6, 1.1, 1, 9.3], [4.5, 0.6, 1, 13.1]];
    const traces = planets.map(([R, r, w, k], i) => {
      const pts = []; for (let s = 0; s <= 3000; s++) { const t = s / 3000 * TAU * 3; pts.push(v3(R * Math.cos(w * t) + r * Math.cos(k * t), R * Math.sin(w * t) + r * Math.sin(k * t), 0)); }
      const l = new LineBuilder().poly(pts, false, i % 2 ? GOLD : WHITE).build(0.7); S.add(l);
      S.add(new LineBuilder().poly(circle(R, 128), true, DGOLD).build(0.25));
      return l;
    });
    const arm = new THREE.Group(); S.add(arm);
    [[0, 0], [1.2, 0.3], [0.4, 1.3]].forEach(([a, b]) => { const c = new LineBuilder().poly(circle(5.4, 160), true, DGOLD).build(0.35); c.rotation.set(a, b, 0); arm.add(c); });
    S.add(starfield(2000, 40, 12, 0.3));
    return {
      scene: S, cam: C,
      update(u, t) {
        traces.forEach((l, i) => l.reveal(easeOut(u) * (0.6 + 0.1 * i)));
        arm.rotation.y = t * 0.4;
        look(C, orbit(lerp(15, 12, u), 0.2, lerp(0.7, 1.45, smooth(u))), v3());
      },
    };
  },

  // ── baroque dome: recursive volutes looking up to an oculus ──
  baroque(p = {}) {
    const S = new THREE.Scene(), C = camera(75), L = new LineBuilder();
    const onDome = (th, ph, R = 10) => v3(R * Math.sin(ph) * Math.cos(th), R * Math.cos(ph), R * Math.sin(ph) * Math.sin(th));
    const volute = (pts2, depth, s, out) => { // golden spiral in 2D local coords
      const sp = []; for (let i = 0; i <= 50; i++) { const a = i / 50 * TAU * 1.25, rr = s * Math.pow(0.82, a * 2); sp.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
      out.push(sp.map(([x, y]) => [x + pts2[0], y + pts2[1]]));
      if (depth > 0) for (let k = 1; k <= 3; k++) { const q = sp[k * 10]; volute([q[0] + pts2[0], q[1] + pts2[1]], depth - 1, s * 0.36, out); }
    };
    for (let ring = 0; ring < 6; ring++) {
      const ph = 0.25 + ring * 0.2, n = 10 + ring * 4;
      for (let k = 0; k < n; k++) {
        const th0 = k / n * TAU + ring * 0.2, motif = [];
        volute([0, 0], 2, 1, motif); volute([0, 0], 1, -0.7, motif);
        const sc = 0.09 * Math.sin(ph) + 0.03;
        motif.forEach(pl => L.poly(pl.map(([x, y]) => onDome(th0 + x * sc * 1.6, ph + y * sc * 1.3)), false, ring % 2 ? GOLD : DGOLD.clone().lerp(GOLD, 0.5)));
      }
      L.poly(circle(1, 160).map(q => onDome(Math.atan2(q.y, q.x), ph + 0.1)), true, DGOLD);
    }
    for (let k = 0; k < 16; k++) { const pts = []; for (let i = 0; i <= 40; i++) pts.push(onDome(k / 16 * TAU, 0.15 + i / 40 * 1.3)); L.poly(pts, false, GOLD); }
    S.add(L.build(0.75));
    const oc = new LineBuilder().poly(circle(1, 96).map(q => onDome(Math.atan2(q.y, q.x), 0.14)), true, WHITE).build(1); S.add(oc);
    const glow = seedPoint(); glow.position.set(0, 10, 0); glow.scale.setScalar(6); S.add(glow);
    const u0 = p.u0 || 0;
    return {
      scene: S, cam: C,
      update(u, t) {
        const uu = u0 + (p.flash ? u * 0.2 : u);
        C.position.set(0, lerp(-2, 1.5, uu), 0); C.up.set(Math.cos(uu * 2), 0, Math.sin(uu * 2)); C.lookAt(0, 10, 0);
        return { bloom: 1.3 };
      },
    };
  },

  // ── Library of Babel: falling down the hexagonal shaft ──
  library() {
    const S = new THREE.Scene(), C = camera(80), L = new LineBuilder(), r = rng(14);
    const hexAt = (R, y) => circle(R, 6).map(p => v3(p.x, y, p.y));
    for (let k = 0; k < 40; k++) {
      const y = -k * 2.4, outer = hexAt(4, y), inner = hexAt(1.5, y);
      L.poly(outer, true, DGOLD); L.poly(inner, true, GOLD); L.poly(hexAt(1.5, y + 0.8), true, DGOLD);
      for (let s = 0; s < 6; s++) {
        L.seg(inner[s], inner[s].clone().add(v3(0, 0.8, 0)), DGOLD);
        if (s === 1 || s === 4) continue;
        const a = outer[s], b = outer[(s + 1) % 6];
        for (let sh = 0; sh < 4; sh++) L.seg(a.clone().add(v3(0, sh * 0.55, 0)), b.clone().add(v3(0, sh * 0.55, 0)), DGOLD);
        for (let bk = 0; bk < 28; bk++) { const q = a.clone().lerp(b, (bk + 0.5) / 28); const sh = Math.floor(r() * 4); L.seg(q.clone().add(v3(0, sh * 0.55, 0)), q.clone().add(v3(0, sh * 0.55 + r.range(0.3, 0.5), 0)), r() < 0.15 ? GOLD : DGOLD); }
      }
    }
    const lamps = new Dust(40 * 2, { size: 0.15 }); for (let k = 0; k < 40; k++) { lamps.set(k * 2, 2.5, -k * 2.4 + 2, 0); lamps.set(k * 2 + 1, -2.5, -k * 2.4 + 2, 0); lamps.color(k * 2, WHITE); lamps.color(k * 2 + 1, WHITE); } lamps.dirty(true);
    S.add(L.build(0.7)); S.add(lamps);
    return {
      scene: S, cam: C,
      update(u, t) {
        const y = lerp(3, -26, easeIn(u * 0.8 + 0.2));
        C.position.set(0, y, 0); C.up.set(Math.cos(t * 0.6), 0, Math.sin(t * 0.6)); C.lookAt(0.3, y - 10, 0.2);
      },
    };
  },

  // ── silicon: diamond-cubic lattice, a glowing dopant ──
  silicon() {
    const S = new THREE.Scene(), C = camera(40), a = 1.6, atoms = [];
    const basis = [[0, 0, 0], [0, 0.5, 0.5], [0.5, 0, 0.5], [0.5, 0.5, 0]];
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) basis.forEach(([x, y, z]) => { atoms.push(v3(i + x, j + y, k + z).multiplyScalar(a)); atoms.push(v3(i + x + 0.25, j + y + 0.25, k + z + 0.25).multiplyScalar(a)); });
    const L = new LineBuilder(), bond = a * Math.sqrt(3) / 4 + 0.01;
    for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) if (atoms[i].distanceTo(atoms[j]) < bond) L.seg(atoms[i], atoms[j], DGOLD, GOLD);
    const g = new THREE.Group(); g.add(L.build(0.6)); S.add(g);
    const d = new Dust(atoms.length, { size: 0.12 }); atoms.forEach((p, i) => d.setV(i, p)); d.dirty(); g.add(d);
    const dop = atoms.reduce((best, p) => (p.length() < best.length() ? p : best));
    const core = seedPoint(); core.position.copy(dop); g.add(core);
    const r = rng(3), el = new Dust(1500, { size: 0.04 }); g.add(el); const ed = []; for (let i = 0; i < 1500; i++) ed.push({ d: r.dir(), rr: Math.abs(r.gauss()) * 1.3 + 0.4, w: r.range(1, 3) });
    return {
      scene: S, cam: C,
      update(u, t) {
        g.rotation.set(0.3, t * 0.5, 0);
        core.scale.setScalar(1 + 0.6 * Math.sin(t * 14));
        ed.forEach((e, i) => { el.setV(i, dop.clone().add(e.d.clone().applyAxisAngle(v3(0, 1, 0), t * e.w).multiplyScalar(e.rr))); el.alpha[i] = 0.4; });
        el.dirty(); el.opacity(range(u, 0.2, 0.6));
        look(C, v3(0, 0, lerp(9, 6, u)));
      },
    };
  },

  // ── Babel: a spiral tower built of chips, rising past the sky ──
  babel() {
    const S = new THREE.Scene(), C = camera(50), L = new LineBuilder(), r = rng(8), tiers = 16;
    for (let k = 0; k < tiers; k++) {
      const R = 6 * (1 - k / 22), y0 = k * 1.3, n = Math.floor(R * 9);
      L.poly(circle(R, 160).map(p => v3(p.x, y0, p.y)), true, GOLD);
      L.poly(circle(R * 0.98, 160).map(p => v3(p.x, y0 + 1.0, p.y)), true, DGOLD);
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU, a2 = (i + 1) / n * TAU, p = v3(Math.cos(a) * R, y0, Math.sin(a) * R);
        L.seg(p, p.clone().add(v3(0, 0.75, 0)), DGOLD);
        const arch = []; for (let s = 0; s <= 8; s++) { const aa = lerp(a, a2, s / 8); arch.push(v3(Math.cos(aa) * R, y0 + 0.75 + Math.sin(s / 8 * Math.PI) * 0.18, Math.sin(aa) * R)); }
        L.poly(arch, false, GOLD);
        if (r() < 0.5) { const q = v3(Math.cos((a + a2) / 2) * R * 1.001, y0 + 0.3, Math.sin((a + a2) / 2) * R * 1.001); const tg = v3(-Math.sin(a), 0, Math.cos(a)).multiplyScalar(0.12); L.seg(q.clone().sub(tg), q.clone().add(tg), WHITE); L.seg(q.clone().sub(tg).add(v3(0, 0.15, 0)), q.clone().add(tg).add(v3(0, 0.15, 0)), DGOLD); }
      }
    }
    const ramp = []; for (let i = 0; i <= 2000; i++) { const s = i / 2000, y = s * tiers * 1.3, R = 6 * (1 - y / 1.3 / 22) + 0.35; const a = s * TAU * 8; ramp.push(v3(Math.cos(a) * R, y, Math.sin(a) * R)); }
    L.poly(ramp, false, WHITE, s => 0.5 + 0.5 * s);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; L.seg(v3(Math.cos(a) * 1.5, tiers * 1.3, Math.sin(a) * 1.5), v3(Math.cos(a) * 0.2, tiers * 1.3 + 14, Math.sin(a) * 0.2), GOLD); }
    S.add(L.build(0.6));
    const oc = new LineBuilder().poly(circle(0.9, 64).map(p => v3(p.x, tiers * 1.3 + 14, p.y)), true, WHITE).build(1); S.add(oc);
    const cloud = new Dust(6000, { size: 0.12 }); for (let i = 0; i < 6000; i++) { const a = r() * TAU, R = r.range(7, 22); cloud.set(i, Math.cos(a) * R, r.range(6, 9) + r.gauss() * 0.6, Math.sin(a) * R); cloud.alpha[i] = r.range(0.05, 0.25); cloud.color(i, DGOLD); } cloud.dirty(true); S.add(cloud);
    S.add(starfield(3000, 80, 44, 0.3));
    return {
      scene: S, cam: C,
      update(u, t) {
        const y = lerp(-1, 30, easeIn(u * 0.85 + 0.15));
        look(C, orbit(lerp(16, 12, u), 0.6 + u * 1.2, 0).add(v3(0, y, 0)), v3(0, y + lerp(6, 8, u), 0));
        cloud.rotation.y = t * 0.1;
        return { bloom: 1.2 };
      },
    };
  },

  // ── black hole: the oculus swallows everything ──
  blackhole() {
    const S = new THREE.Scene(), C = camera(40), r = rng(77);
    const shadow = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.MeshBasicMaterial({ color: 0x000000 })); S.add(shadow);
    const N = 30000, disk = new Dust(N, { size: 0.035 }), dd = [];
    for (let i = 0; i < N; i++) { const rr = 1.6 + Math.pow(r(), 1.6) * 5; dd.push({ rr, a: r() * TAU, h: r.gauss() * 0.03 * rr }); const c = rr < 2.4 ? WHITE : rr < 4 ? GOLD : DGOLD; disk.color(i, c); disk.alpha[i] = clamp(1.6 / rr) * r.range(0.15, 0.5); }
    disk.dirty(true); S.add(disk);
    const lens = new Dust(12000, { size: 0.03 }), ld = []; for (let i = 0; i < 12000; i++) { ld.push({ rr: 1.12 + Math.pow(r(), 2) * 0.9, a: r() * TAU }); lens.color(i, i % 3 ? GOLD : WHITE); lens.alpha[i] = r.range(0.1, 0.4); } lens.dirty(true);
    const lensG = new THREE.Group(); lensG.add(lens); S.add(lensG);
    const ring = new LineBuilder().poly(circle(1.05, 160), true, WHITE).build(1); lensG.add(ring);
    // falling debris: shards of the tower, stretched as they fall
    const deb = []; for (let i = 0; i < 60; i++) { const l = new LineBuilder().seg(v3(-0.15, 0, 0), v3(0.15, 0, 0), GOLD).seg(v3(0, -0.1, 0), v3(0, 0.1, 0), DGOLD).build(0.8); S.add(l); deb.push({ l, a: r() * TAU, rr: r.range(6, 14), y: r.gauss() * 1.5, sp: r.range(0.6, 1.4) }); }
    S.add(starfield(4000, 60, 21, 0.4));
    return {
      scene: S, cam: C,
      update(u, t) {
        dd.forEach((d, i) => { const a = d.a + t * 2.2 * Math.pow(1.6 / d.rr, 1.5); disk.set(i, Math.cos(a) * d.rr, d.h, Math.sin(a) * d.rr); });
        disk.dirty();
        ld.forEach((d, i) => { const a = d.a + t * 1.5 / d.rr; lens.set(i, Math.cos(a) * d.rr, Math.sin(a) * d.rr * 1.0, 0); });
        lens.dirty();
        deb.forEach(d => { const k = clamp(t * 0.5 * d.sp); const rr = lerp(d.rr, 1, easeIn(k)); const a = d.a + k * 6; d.l.position.set(Math.cos(a) * rr, d.y * (1 - k), Math.sin(a) * rr); d.l.scale.set(1 + k * 8, 1 - k * 0.8, 1); d.l.lookAt(0, 0, 0); d.l.material.opacity = 0.8 * (1 - k); });
        const dist = lerp(16, 1.6, easeIn(range(u, 0.05, 0.85)));
        look(C, orbit(dist, t * 0.15, 0.12), v3());
        lensG.quaternion.copy(C.quaternion);
        return { bloom: 1.5, ca: 1 + 3 * range(u, 0.5, 0.85) };
      },
    };
  },

  // ── VI: gradient descent across the landscape of everything ──
  loss() {
    const S = new THREE.Scene(), C = camera(50);
    S.add(terrain(10, 80));
    const trail = new LineBuilder().poly(trajectory, false, WHITE, s => 0.5 + 0.5 * s).build(1); S.add(trail);
    const ball = seedPoint(); S.add(ball);
    const r = rng(5), nodes = new Dust(trajectory.length / 10 * 2, { size: 0.08 }); S.add(nodes);
    for (let i = 0; i < nodes.n; i++) { const p = trajectory[Math.floor(i / 2) * 10]; nodes.setV(i, p.clone().add(v3((i % 2 ? 1 : -1) * 0.5, 0.3 + r() * 0.3, r.gauss() * 0.3))); }
    nodes.dirty();
    S.add(starfield(2000, 50, 7, 0.25));
    return {
      scene: S, cam: C,
      update(u) {
        const k = easeOut(u) * 0.55, idx = Math.floor(k * (trajectory.length - 1));
        trail.reveal(k);
        const p = trajectory[idx]; ball.position.copy(p);
        const back = trajectory[Math.max(0, idx - 25)];
        const dir = p.clone().sub(back).setY(0); if (dir.lengthSq() < 1e-6) dir.set(-1, 0, -1); dir.normalize();
        look(C, p.clone().addScaledVector(dir, -4.5).add(v3(0, 2.2, 0)), p.clone().addScaledVector(dir, 2));
        for (let i = 0; i < nodes.n; i++) nodes.alpha[i] = Math.floor(i / 2) * 10 < idx ? 0.9 : 0;
        nodes.dirty();
        return { bloom: 1.2 };
      },
    };
  },

  // ── the android, asleep, dreaming ──
  android() {
    const S = new THREE.Scene(), C = camera(38), head = new THREE.Group(); S.add(head);
    const R = (y, th) => {
      const a = 0.78 * Math.sqrt(Math.max(0, 1 - ((y - 0.1) / 1.25) ** 2)) * (y < -0.6 ? lerp(1, 0.75, (-0.6 - y) / 0.6) : 1);
      const b = a * 1.12;
      let r = a * b / Math.sqrt((b * Math.cos(th)) ** 2 + (a * Math.sin(th)) ** 2);
      const front = Math.pow(Math.max(0, Math.cos(th)), 14);
      const nose = Math.exp(-(((y + 0.12) / 0.2) ** 2)) * 0.3, brow = Math.exp(-(((y - 0.32) / 0.08) ** 2)) * 0.05, lips = Math.exp(-(((y + 0.5) / 0.06) ** 2)) * 0.05, chin = Math.exp(-(((y + 0.82) / 0.1) ** 2)) * 0.06;
      const sock = -Math.exp(-(((y - 0.17) / 0.09) ** 2)) * 0.05 * Math.pow(Math.max(0, Math.cos(th * 2.6)), 2);
      return r + front * (nose + brow + lips + chin) + sock * (Math.cos(th) > 0 ? 1 : 0);
    };
    const L = new LineBuilder(), ys = [];
    for (let k = 0; k <= 46; k++) { const y = -1.15 + k * 0.05; ys.push(y); const pts = []; for (let i = 0; i < 120; i++) { const th = i / 120 * TAU; const rr = R(y, th); pts.push(v3(Math.sin(th) * rr, y, Math.cos(th) * rr)); } L.poly(pts, true, k % 4 ? DGOLD : GOLD); }
    for (let i = 0; i < 24; i++) { const th = i / 24 * TAU; L.poly(ys.map(y => { const rr = R(y, th); return v3(Math.sin(th) * rr, y, Math.cos(th) * rr); }), false, DGOLD); }
    for (const sg of [-1, 1]) { const lid = []; for (let i = 0; i <= 20; i++) { const s = i / 20, th = sg * lerp(0.18, 0.6, s); const y = 0.16 - 0.035 * Math.sin(Math.PI * s); const rr = R(y, th) + 0.01; lid.push(v3(Math.sin(th) * rr, y, Math.cos(th) * rr)); } L.poly(lid, false, WHITE); }
    for (let i = 0; i < 6; i++) { const p0 = v3(-0.3 + i * 0.12, -1.15, -0.2); L.poly([p0, p0.clone().add(v3(0, -0.6 - i * 0.1, 0)), p0.clone().add(v3(-1.5 - i * 0.3, -0.6 - i * 0.1, 0)), p0.clone().add(v3(-1.5 - i * 0.3, -0.6 - i * 0.1, -3))], false, DGOLD); }
    head.add(L.build(0.7));
    const rem = new Dust(2, { size: 0.06 }); rem.color(0, WHITE); rem.color(1, WHITE); rem.dirty(true); head.add(rem);
    head.rotation.y = 0;
    const dream = new Dust(3000, { size: 0.04 }), r = rng(9), dd = []; for (let i = 0; i < 3000; i++) dd.push({ d: r.dir(), rr: r.range(1.5, 5), ph: r() });
    S.add(dream);
    return {
      scene: S, cam: C,
      update(u, t) {
        const j = Math.sin(t * 37) * 0.04 + Math.sin(t * 23) * 0.03;
        rem.set(0, Math.sin(0.4) * 0.75 + j, 0.15, Math.cos(0.4) * 0.75); rem.set(1, -Math.sin(0.4) * 0.75 + j, 0.15, Math.cos(0.4) * 0.75); rem.dirty();
        dd.forEach((d, i) => { const a = (d.ph + t * 0.2) % 1; dream.setV(i, d.d.clone().multiplyScalar(d.rr + a)); dream.alpha[i] = Math.sin(a * Math.PI) * 0.4; }); dream.dirty();
        look(C, orbit(lerp(4.2, 3.6, u), 1.25, 0.12), v3(0, -0.1, 0));
      },
    };
  },

  // ── electric sheep jump the fence; the fourth dissolves into the seed ──
  sheep(p = {}) {
    const S = new THREE.Scene(), C = camera(40), r = rng(50 + p.n), sheep = new THREE.Group(); S.add(sheep);
    const L = new LineBuilder(), pts = [];
    for (let i = 0; i < 160; i++) {
      const d = r.dir(); const c = v3(d.x * 0.95, d.y * 0.6, d.z * 0.6); const n = c.clone().normalize();
      const t1 = v3(0, 1, 0).cross(n).normalize(), t2 = n.clone().cross(t1);
      const coil = []; for (let k = 0; k <= 16; k++) { const a = k / 16 * TAU * 1.5; coil.push(c.clone().addScaledVector(t1, Math.cos(a) * 0.12).addScaledVector(t2, Math.sin(a) * 0.12).addScaledVector(n, k * 0.006)); }
      L.poly(coil, false, i % 4 ? GOLD : WHITE); coil.forEach(q => pts.push(q));
    }
    const headC = v3(1.15, 0.35, 0); L.poly(circle(1, 24).map(q => v3(headC.x + q.x * 0.32, headC.y + q.y * 0.2, 0)), true, GOLD); L.poly(circle(1, 24).map(q => v3(headC.x + q.x * 0.3, headC.y, q.y * 0.18)), true, DGOLD);
    for (const sg of [-1, 1]) L.seg(headC.clone().add(v3(-0.1, 0.12, sg * 0.15)), headC.clone().add(v3(-0.3, 0.05, sg * 0.4)), GOLD);
    const legs = []; for (const x of [-0.55, 0.55]) for (const z of [-0.3, 0.3]) legs.push([v3(x, -0.4, z), v3(x, -1.05, z)]);
    legs.forEach(([a, b]) => { L.seg(a, b, GOLD); pts.push(a, b); });
    sheep.add(L.build(0.4));
    const eyes = new Dust(2, { size: 0.08 }); eyes.set(0, headC.x + 0.2, headC.y + 0.05, 0.14); eyes.set(1, headC.x + 0.2, headC.y + 0.05, -0.14); eyes.color(0, WHITE); eyes.color(1, WHITE); eyes.dirty(true); sheep.add(eyes);
    const F = new LineBuilder(); for (const z of [-2, 0, 2]) F.seg(v3(0, -1.6, z), v3(0, 0.2, z), DGOLD); for (const y of [-0.9, -0.2]) F.seg(v3(0, y, -2.5), v3(0, y, 2.5), GOLD);
    S.add(F.build(0.7));
    S.add(terrain(14, 50, (x, z) => -1.6 + 0.12 * Math.sin(x * 0.7) * Math.cos(z * 0.6)));
    let dust = null;
    let seedP = null;
    if (p.dissolve) { dust = new Dust(pts.length, { size: 0.05 }); S.add(dust); dust.src = pts; seedP = seedPoint(); S.add(seedP); }
    const cams = [[orbit(9, Math.PI / 2, 0.05), v3(0, 0, 0)], [orbit(8, 2.2, -0.08), v3(0, 0.5, 0)], [orbit(10, 0.8, 0.45), v3(0, 0, 0)], [orbit(8.5, Math.PI / 2 - 0.2, 0.1), v3(0, 0.5, 0)]];
    return {
      scene: S, cam: C,
      update(u, t) {
        const s = p.dissolve ? lerp(0.15, 0.55, range(u, 0, 0.35)) : u;
        sheep.position.set(lerp(-4.5, 4.5, s), 2.4 * Math.sin(Math.PI * s) - 0.3, 0);
        sheep.rotation.z = -0.5 * Math.cos(Math.PI * s);
        if (dust) {
          const k = smooth(range(u, 0.35, 0.8)), fall = easeIn(range(u, 0.75, 1));
          sheep.children[0].material.opacity = 0.4 * (1 - range(u, 0.35, 0.55));
          eyes.opacity(1 - range(u, 0.35, 0.5));
          const target = v3(sheep.position.x, sheep.position.y - fall * 6, 0);
          dust.src.forEach((q, i) => { const w = q.clone().applyEuler(sheep.rotation).add(sheep.position); const sw = (1 - k) * 0.3; const a = i * 0.37 + t * 4; dust.set(i, lerp(w.x, target.x, k) + Math.cos(a) * sw, lerp(w.y, target.y, k) + Math.sin(a) * sw, lerp(w.z, target.z, k)); dust.alpha[i] = range(u, 0.35, 0.45) * 0.3 * (1 - 0.95 * k); dust.color(i, k > 0.9 ? WHITE : GOLD); });
          dust.dirty(true);
          seedP.position.copy(target); seedP.opacity(range(u, 0.6, 0.8));
        }
        const [cp, ct] = cams[p.n]; look(C, cp.clone().multiplyScalar(0.7).add(v3(sheep.position.x * 0.5, sheep.position.y * 0.6, 0)), ct.clone().add(v3(sheep.position.x * 0.8, sheep.position.y * 0.8, 0)));
        return { bloom: 1.2 };
      },
    };
  },

  // ── convergence: the trajectory spirals in, the landscape folds into one point ──
  converge() {
    const S = new THREE.Scene(), C = camera(45);
    const base = terrain(10, 70, (x, z) => lossF(x, z) * 0.6);
    const pos = base.geometry.attributes.position, orig = Float32Array.from(pos.array);
    S.add(base);
    const sp = []; for (let i = 0; i <= 900; i++) { const s = i / 900, rr = 7 * Math.exp(-4 * s) * (1 + 0.15 * Math.sin(s * 60) * (1 - s)), a = s * TAU * 5; sp.push(v3(Math.cos(a) * rr, 0.3, Math.sin(a) * rr)); }
    const trail = new LineBuilder().poly(sp, false, WHITE, s => 0.3 + 0.7 * s).build(1); S.add(trail);
    const ball = seedPoint(); S.add(ball);
    return {
      scene: S, cam: C,
      update(u) {
        trail.reveal(easeOut(u)); ball.position.copy(sp[Math.floor(easeOut(u) * 900)]);
        const k = easeIn(range(u, 0.35, 1));
        for (let i = 0; i < pos.count; i++) {
          const x = orig[i * 3], y = orig[i * 3 + 1], z = orig[i * 3 + 2], d = Math.hypot(x, z);
          const s = 1 - k * (1 - 0.15 * Math.sin(d * 3 - k * 20) * (1 - k));
          pos.setXYZ(i, x * s, y * (1 - k), z * s);
        }
        pos.needsUpdate = true;
        look(C, v3(0, lerp(16, 12, u), 0.01), v3());
        return { bloom: 1.2 + k };
      },
    };
  },

  // ── VII: Necker cube flips; the eye opens; the pupil is a black hole ──
  eye() {
    const S = new THREE.Scene(), C = camera(30);
    const seed = seedPoint(); S.add(seed);
    // Necker cube: two face sets alternately emphasised
    const cubeA = new LineBuilder(), cubeB = new LineBuilder(), s = 0.9, o = v3(0.45, 0.35, 0);
    const sq = off => [v3(-s, -s, 0), v3(s, -s, 0), v3(s, s, 0), v3(-s, s, 0)].map(p => p.add(off));
    const f1 = sq(v3()), f2 = sq(o);
    cubeA.poly(f1, true, WHITE); f1.forEach((p, i) => cubeA.seg(p, f2[i], GOLD));
    cubeB.poly(f2, true, WHITE);
    const cA = cubeA.build(1), cB = cubeB.build(1); const cube = new THREE.Group(); cube.add(cA, cB); cube.position.set(-0.22, -0.17, 0); S.add(cube);
    // eye, clipped to the lid aperture in the fragment shader
    const lidMat = new THREE.ShaderMaterial({
      uniforms: { uOpen: { value: 0 }, uOp: { value: 0.45 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
      vertexShader: `varying vec3 vP; varying vec3 vC; void main(){ vP = position; vC = color; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform float uOpen, uOp; varying vec3 vP; varying vec3 vC; void main(){ float w = 2.4; float h = uOpen * 1.25 * (1.0 - (vP.x*vP.x)/(w*w)); if (abs(vP.y) > max(h, 0.0)) discard; gl_FragColor = vec4(vC, uOp); }`,
    });
    const I = new LineBuilder(), r = rng(12);
    for (let k = 0; k < 220; k++) { const a = k / 220 * TAU, pts = []; for (let i = 0; i <= 14; i++) { const rr = lerp(0.42, 1.25, i / 14); const aa = a + 0.08 * Math.sin(i * 0.9 + k) ; pts.push(v3(Math.cos(aa) * rr, Math.sin(aa) * rr, 0)); } I.poly(pts, false, k % 5 ? DGOLD.clone().lerp(GOLD, r()) : GOLD); }
    I.poly(circle(0.75, 120, (p, i) => p.multiplyScalar(1 + 0.06 * Math.sin(i * 0.9))), true, GOLD);
    I.poly(circle(1.25, 160), true, GOLD);
    for (let k = 0; k < 6; k++) I.poly(squareSpiral(2, 0.2).map(p => v3(p.x * 0.2, p.y * 0.2, 0).add(v3(Math.cos(k / 6 * TAU) * 1.0, Math.sin(k / 6 * TAU) * 1.0, 0))), false, WHITE);
    const iris = new THREE.LineSegments(I.build().geometry, lidMat); iris.frustumCulled = false; S.add(iris);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.42, 64), new THREE.MeshBasicMaterial({ color: 0 })); pupil.position.z = 0.01; S.add(pupil);
    const acc = new Dust(4000, { size: 0.02 }), ad = []; for (let i = 0; i < 4000; i++) { ad.push({ a: r() * TAU, rr: 0.43 + Math.abs(r.gauss()) * 0.05 }); acc.color(i, i % 3 ? GOLD : WHITE); } acc.dirty(true); S.add(acc);
    const lids = new THREE.Group(); S.add(lids);
    return {
      scene: S, cam: C,
      update(u, t) {
        seed.opacity(1 - range(u, 0.02, 0.08));
        const cubeOn = range(u, 0.03, 0.1) * (1 - range(u, 0.3, 0.42));
        const flip = u < 0.17 ? 1 : u < 0.25 ? 0 : 1;
        cA.material.opacity = cubeOn * (flip ? 1 : 0.25); cB.material.opacity = cubeOn * (flip ? 0.25 : 1);
        cube.scale.setScalar(1 - 0.7 * range(u, 0.3, 0.42)); cube.rotation.z = range(u, 0.3, 0.42) * 1.2;
        const open = easeOut(range(u, 0.32, 0.62));
        lidMat.uniforms.uOpen.value = open;
        pupil.scale.setScalar(smooth(range(u, 0.32, 0.4)));
        ad.forEach((d, i) => { const a = d.a + t * 2; acc.set(i, Math.cos(a) * d.rr, Math.sin(a) * d.rr, 0.02); acc.alpha[i] = 0.5 * +(Math.abs(Math.sin(a) * 1.25 * (1 - (Math.cos(a) * d.rr) ** 2 / 5.76)) < open * 1.25); });
        acc.dirty(); acc.opacity(range(u, 0.4, 0.55));
        while (lids.children.length) { const c = lids.children.pop(); c.geometry.dispose(); }
        const lb = new LineBuilder(); const up = [], lo = [];
        for (let i = 0; i <= 80; i++) { const x = -2.4 + 4.8 * i / 80, h = 1.25 * (1 - (x * x) / 5.76); up.push(v3(x, h * open, 0)); lo.push(v3(x, -h * open, 0)); }
        lb.poly(up, false, GOLD); lb.poly(lo, false, GOLD);
        for (let i = 4; i < 80; i += 4) lb.seg(up[i], up[i].clone().add(v3(up[i].x * 0.05, 0.18 * open, 0)), DGOLD);
        const lidL = lb.build(range(u, 0.3, 0.36)); lids.add(lidL);
        const z = lerp(9, 5.2, easeOut(range(u, 0.3, 0.8))) * lerp(1, 0.18, easeIn(range(u, 0.8, 1)));
        look(C, v3(0, 0, z));
        return { bloom: 1.1 + 0.5 * range(u, 0.4, 0.6), tint: 0.4 };
      },
    };
  },

  // ── the ouroboros closes around everything and collapses to the seed ──
  ending() {
    const S = new THREE.Scene(), C = camera(35);
    const sun = new THREE.Group(); S.add(sun);
    const ir = new LineBuilder(); for (let k = 0; k < 120; k++) { const a = k / 120 * TAU; ir.seg(v3(Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0), v3(Math.cos(a) * 1.25, Math.sin(a) * 1.25, 0), DGOLD.clone().lerp(GOLD, (k % 5) / 5)); }
    ir.poly(circle(1.25, 120), true, GOLD); sun.add(ir.build(0.8));
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.42, 64), new THREE.MeshBasicMaterial({ color: 0 })); pupil.position.z = 0.01; sun.add(pupil);
    const holder = new THREE.Group(); S.add(holder);
    const seed = seedPoint(); S.add(seed);
    const r = rng(4), NP = 5000, motes = new Dust(NP, { size: 0.03 }), md = []; for (let i = 0; i < NP; i++) md.push({ d: r.dir().setZ(0).normalize().multiplyScalar(r.range(1, 5)), ph: r() }); S.add(motes);
    S.add(starfield(2000, 40, 1, 0.25));
    let snake = null;
    return {
      scene: S, cam: C,
      update(u, t) {
        sun.scale.setScalar(lerp(3.5, 0.6, easeOut(range(u, 0, 0.3))) * (1 - easeIn(range(u, 0.6, 0.88))));
        sun.rotation.z = t * 0.5;
        if (snake) { holder.remove(snake.lines); snake.lines.geometry.dispose(); }
        const span = lerp(TAU * 0.5, TAU * 0.995, easeOut(range(u, 0.12, 0.55)));
        snake = snakeGeometry(span, 3.1, Math.PI / 2 - span + t * 0.4, { tube: 0.32 });
        holder.add(snake.lines);
        const col = easeIn(range(u, 0.6, 0.88));
        holder.scale.setScalar(1 - col); snake.lines.material.opacity = 0.9 * range(u, 0.1, 0.2) * (1 - range(u, 0.8, 0.88));
        md.forEach((m, i) => { const k = (m.ph + col) ; motes.setV(i, m.d.clone().multiplyScalar(Math.max(0, 1 - col * 1.05) * (1 + 0.1 * Math.sin(t * 3 + i)))); motes.alpha[i] = 0.5 * range(u, 0.5, 0.65) * (1 - range(u, 0.85, 0.9)); void k; });
        motes.dirty();
        seed.opacity(range(u, 0.82, 0.9) * (1 - range(u, 0.96, 1)));
        look(C, v3(0, 0, 9.5));
        return { flash: u > 0.55 && u < 0.62 ? 0.5 * (1 - (u - 0.55) / 0.07) : 0, bloom: 1.2 };
      },
    };
  },
};
