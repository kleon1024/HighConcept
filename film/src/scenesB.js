// III 生 / IV 盗
import {
  THREE, GOLD, DGOLD, WHITE, BRONZE, TAU, clamp, lerp, smooth, easeOut, easeIn, range, v3, rng, fbm,
  Dust, LineBuilder, wire, circle, squareSpiral, crack, camera, look, orbit, starfield, seedPoint,
} from './core.js';

// particle flame shared by fire / flame-test shots
function flame(n, color, seed = 1, h = 3) {
  const r = rng(seed), d = new Dust(n, { size: 0.07 }), P = [];
  for (let i = 0; i < n; i++) P.push({ ph: r(), a: r() * TAU, rad: Math.abs(r.gauss()) * 0.35, sp: r.range(0.8, 1.4), w: r.range(2, 6) });
  d.step = (t, col = color) => {
    P.forEach((p, i) => {
      const age = (p.ph + t * p.sp * 0.9) % 1;
      const rr = p.rad * (1 - age) * (1 + 0.6 * Math.sin(age * 3));
      const sway = 0.25 * Math.sin(t * 3 + age * p.w + p.a) * age;
      d.set(i, Math.cos(p.a) * rr + sway, age * h - 0.2, Math.sin(p.a) * rr);
      d.alpha[i] = Math.pow(1 - age, 1.5) * 0.22;
      d.size[i] = lerp(1.1, 0.3, age);
      const c = age < 0.15 ? WHITE : col.clone().lerp(DGOLD, clamp((age - 0.4) * 1.5));
      d.color(i, c);
    });
    d.dirty(true);
  };
  return d;
}

function handOutline(s = 1) {
  const pts = [];
  const fingers = [[-0.55, 1.0, 0.16], [-0.2, 1.35, 0.15], [0.15, 1.45, 0.15], [0.48, 1.25, 0.14], [0.85, 0.45, 0.15]];
  pts.push(v3(-0.75, -1.2, 0), v3(-0.75, 0.2, 0));
  fingers.forEach(([x, top, w], i) => {
    const base = i === 4 ? 0.0 : 0.25;
    pts.push(v3(x - w, base, 0), v3(x - w, top - w, 0));
    for (let k = 0; k <= 6; k++) { const a = Math.PI - k / 6 * Math.PI; pts.push(v3(x + Math.cos(a) * w, top - w + Math.sin(a) * w, 0)); }
    pts.push(v3(x + w, base, 0));
  });
  pts.push(v3(0.75, -1.2, 0));
  return pts.map(p => p.multiplyScalar(s));
}

export const scenesB = {
  // ── cells divide 1 → 2 → 4 → 8 on the eighths ──
  cells() {
    const S = new THREE.Scene(), C = camera(40), r = rng(8);
    const cells = [];
    for (let i = 0; i < 8; i++) {
      const g = new THREE.Group();
      g.add(wire(new THREE.IcosahedronGeometry(1, 2), GOLD, 0.6));
      const nuc = new Dust(400, { size: 0.04 }); for (let k = 0; k < 400; k++) { nuc.setV(k, r.dir().multiplyScalar(0.35 * Math.cbrt(r()))); nuc.color(k, k % 5 ? GOLD : WHITE); } nuc.dirty(true); g.add(nuc);
      S.add(g); cells.push(g);
    }
    const axes = [v3(1, 0, 0), v3(0, 1, 0), v3(0, 0, 1)];
    S.add(starfield(1500, 25, 4, 0.3));
    return {
      scene: S, cam: C,
      update(u, t) {
        const lvl = Math.min(3, Math.floor(u * 4)), lu = smooth((u * 4 - lvl) / 0.6);
        cells.forEach((g, i) => {
          const p = v3(); let rad = 1.6;
          for (let b = 0; b < lvl + 1; b++) {
            if (b === 0) continue;
            const sign = (i >> (b - 1)) & 1 ? 1 : -1;
            const k = b === lvl ? lu : 1;
            rad = 1.6 / Math.cbrt(2 ** b);
            p.addScaledVector(axes[(b - 1) % 3], sign * k * 1.6 / Math.pow(2, (b - 1) * 0.55));
          }
          const live = i < 2 ** lvl || (i < 2 ** (lvl + 1) && false);
          g.visible = i < 2 ** lvl;
          g.position.copy(p); g.scale.setScalar(rad * (1 + 0.04 * Math.sin(t * 9 + i))); void live;
          g.rotation.y = t * 0.5 + i;
        });
        look(C, orbit(9, 0.5 + u * 0.4, 0.3));
      },
    };
  },

  // ── synapse: vesicles release transmitter across the cleft ──
  synapse() {
    const S = new THREE.Scene(), C = camera(40);
    const pre = []; for (let i = 0; i <= 30; i++) { const y = i / 30; pre.push(new THREE.Vector2(y < 0.6 ? 0.35 + 0.1 * y : 0.35 + Math.sin((y - 0.6) / 0.4 * Math.PI / 2) * 1.0, -y * 3)); }
    const preG = new THREE.LatheGeometry(pre.map(p => new THREE.Vector2(p.x, p.y)), 20);
    const preM = wire(preG, GOLD, 0.35); preM.rotation.z = Math.PI / 2; preM.position.x = -3.6; S.add(preM);
    const post = []; for (let i = 0; i <= 20; i++) { const x = i / 20 * 1.6; post.push(new THREE.Vector2(x, 0.25 * x * x)); }
    const postM = wire(new THREE.LatheGeometry(post, 24), GOLD, 0.35); postM.rotation.z = -Math.PI / 2; postM.position.x = 0.7; S.add(postM);
    const r = rng(12), N = 5000, tx = new Dust(N, { size: 0.045 }); S.add(tx);
    const td = []; for (let i = 0; i < N; i++) td.push({ y: r.gauss() * 0.5, z: r.gauss() * 0.5, ph: r(), s: r.range(0.7, 1.3) });
    const ves = []; for (let i = 0; i < 9; i++) { const w = wire(new THREE.IcosahedronGeometry(0.16, 1), WHITE, 0.7); w.position.set(-1 - r() * 1.2, r.gauss() * 0.5, r.gauss() * 0.5); S.add(w); ves.push(w); }
    const rec = new Dust(80, { size: 0.12 }); for (let i = 0; i < 80; i++) { const y = r.gauss() * 0.6, z = r.gauss() * 0.6; rec.set(i, 0.72 + 0.25 * (y * y + z * z) / 1.6, y, z); rec.color(i, WHITE); } rec.dirty(true); S.add(rec);
    const pulse = seedPoint(); S.add(pulse);
    return {
      scene: S, cam: C,
      update(u, t) {
        pulse.position.set(lerp(-6.5, -0.6, easeOut(range(u, 0, 0.35))), 0, 0); pulse.opacity(1 - range(u, 0.35, 0.45));
        ves.forEach((v, i) => { const a = range(u, 0.3 + i * 0.03, 0.45 + i * 0.03); v.position.x = lerp(v.position.x, -0.45, a * 0.2); v.scale.setScalar(1 - smooth(range(u, 0.45 + i * 0.03, 0.5 + i * 0.03))); });
        const rel = range(u, 0.4, 1);
        td.forEach((d, i) => { const a = clamp(rel * 1.6 * d.s - d.ph * 0.6); tx.set(i, lerp(-0.4, 0.75, a), d.y * (0.4 + a), d.z * (0.4 + a)); tx.alpha[i] = a > 0 && a < 1 ? 0.3 : 0; });
        tx.dirty();
        rec.opacity(0.2 + 0.8 * range(u, 0.6, 0.8) * (0.7 + 0.3 * Math.sin(t * 40)));
        look(C, orbit(5.5, 0.35 + 0.2 * u, 0.15), v3(-0.6, 0, 0));
      },
    };
  },

  // ── dendrite tree = tree of knowledge, serpent, golden fruit ──
  tree() {
    const S = new THREE.Scene(), C = camera(40), r = rng(31), segs = [];
    const grow = (p, d, len, depth) => {
      const e = p.clone().addScaledVector(d, len); segs.push({ a: p, b: e, depth });
      if (depth >= 7) return e;
      const n = depth < 2 ? 3 : 2;
      for (let k = 0; k < n; k++) {
        const axis = r.dir(); const nd = d.clone().applyAxisAngle(axis.cross(d).normalize(), r.range(0.35, 0.7)).normalize();
        nd.y = Math.max(nd.y, -0.1); nd.normalize();
        grow(e, nd, len * r.range(0.65, 0.8), depth + 1);
      }
      return e;
    };
    grow(v3(0, -3, 0), v3(0, 1, 0), 1.6, 0);
    for (let k = 0; k < 4; k++) segs.push({ a: v3(0, -3, 0), b: v3(Math.cos(k * 1.6) * 1.5, -3.6, Math.sin(k * 1.6) * 1.5), depth: 1 });
    segs.sort((a, b) => a.depth - b.depth);
    const L = new LineBuilder(); segs.forEach(s => L.seg(s.a, s.b, s.depth < 3 ? GOLD : DGOLD, s.depth < 5 ? GOLD : DGOLD.clone().multiplyScalar(0.7)));
    const tree = L.build(0.9); S.add(tree);
    const tips = new Dust(segs.length, { size: 0.05 }); segs.forEach((s, i) => { tips.setV(i, s.b); tips.alpha[i] = s.depth / 7; }); tips.dirty(); S.add(tips);
    const fruit = seedPoint(); fruit.position.copy(segs.filter(s => s.depth === 4)[3].b); S.add(fruit);
    const sp = []; for (let i = 0; i <= 200; i++) { const s = i / 200, a = s * TAU * 3.5; sp.push(v3(Math.cos(a) * 0.28, -3 + s * 2.3, Math.sin(a) * 0.28)); }
    const serp = new LineBuilder().poly(sp, false, WHITE, s => 0.3 + s).build(1); S.add(serp);
    return {
      scene: S, cam: C,
      update(u, t) {
        tree.reveal(easeOut(range(u, 0, 0.75))); tips.opacity(range(u, 0.4, 0.9));
        serp.reveal(range(u, 0.3, 0.9)); fruit.opacity(range(u, 0.6, 0.8)); fruit.scale.setScalar(1 + 0.3 * Math.sin(t * 12));
        look(C, orbit(9, 0.3 + 0.4 * u, -0.05), v3(0, -0.5, 0));
      },
    };
  },

  // ── Cambrian: trilobites and Anomalocaris ──
  cambrian() {
    const S = new THREE.Scene(), C = camera(40), r = rng(19);
    const trilo = () => {
      const L = new LineBuilder(), segs = 9;
      const ceph = []; for (let i = 0; i <= 30; i++) { const a = Math.PI * i / 30; ceph.push(v3(Math.cos(a) * 0.6, 0.55 + Math.sin(a) * 0.45, 0.1 * Math.sin(a))); }
      L.poly(ceph, false, GOLD);
      for (let k = 0; k <= segs; k++) { const y = 0.55 - k * 0.12, w = 0.6 - k * 0.025; const rib = []; for (let i = 0; i <= 10; i++) { const x = -w + 2 * w * i / 10; rib.push(v3(x, y - 0.03 * Math.abs(x), 0.15 * (1 - (x / w) ** 2))); } L.poly(rib, false, k % 2 ? DGOLD : GOLD); }
      const py = []; for (let i = 0; i <= 20; i++) { const a = Math.PI + Math.PI * i / 20; py.push(v3(Math.cos(a) * 0.38, 0.55 - segs * 0.12 + Math.sin(a) * 0.3, 0)); }
      L.poly(py, false, GOLD);
      [-0.18, 0.18].forEach(x => L.seg(v3(x, 0.9, 0.15), v3(x * 0.8, -0.8, 0.12), DGOLD));
      [-0.3, 0.3].forEach(x => { const e = circle(0.06, 8).map(p => v3(p.x + x, p.y + 0.75, 0.2)); L.poly(e, true, WHITE); });
      return L.build(0.85);
    };
    const swarm = [];
    for (let i = 0; i < 22; i++) { const g = new THREE.Group(); g.add(trilo()); g.position.set(r.range(-8, 8), r.range(-3, 3), r.range(-10, 2)); g.rotation.set(-0.9, 0, -Math.PI / 2 + r.gauss() * 0.3); g.scale.setScalar(r.range(0.6, 1.2)); S.add(g); swarm.push({ g, v: r.range(1, 2.5), x0: g.position.x }); }
    // Anomalocaris: segmented flaps and frontal spiral appendages
    const an = new THREE.Group(), L = new LineBuilder();
    for (let k = 0; k < 11; k++) { const x = -k * 0.32, w = 0.55 - k * 0.03; L.poly(circle(1, 24).map(p => v3(x + p.x * 0.16, p.y * w, 0)), true, k % 2 ? GOLD : DGOLD); [-1, 1].forEach(sg => { const f = []; for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI; f.push(v3(x + Math.cos(a) * 0.16, sg * (w + Math.sin(a) * 0.35), 0)); } L.poly(f, false, GOLD); }); }
    [-1, 1].forEach(sg => { const ap = []; for (let i = 0; i <= 40; i++) { const s = i / 40, a = s * 4.5; ap.push(v3(0.3 + 0.6 * Math.sin(a) * (1 - s * 0.6), sg * (0.25 + 0.5 * (1 - Math.cos(a)) * (1 - s * 0.5)), 0)); } L.poly(ap, false, WHITE); });
    an.add(L.build(0.9)); an.rotation.x = -0.6; an.scale.setScalar(1.6); S.add(an);
    const sea = new Dust(4000, { size: 0.03 }); for (let i = 0; i < 4000; i++) { sea.setV(i, v3(r.range(-12, 12), r.range(-6, 6), r.range(-14, 4))); sea.alpha[i] = r.range(0.1, 0.5); } sea.dirty(); S.add(sea);
    return {
      scene: S, cam: C,
      update(u, t) {
        swarm.forEach(s => { s.g.position.x = s.x0 - s.v * t * 3; s.g.rotation.y = 0.15 * Math.sin(t * 8 + s.x0); });
        an.position.set(lerp(6, -1, u), 0.3, lerp(-3, 2.5, u)); an.children[0].rotation.z = 0.05 * Math.sin(t * 10);
        look(C, v3(0, 1, 9), v3(0, 0, 0));
      },
    };
  },

  // ── the first eye: calcite lenses light up ──
  compoundEye() {
    const S = new THREE.Scene(), C = camera(40);
    const g = new THREE.IcosahedronGeometry(3, 9), pa = g.attributes.position, uniq = new Map();
    for (let i = 0; i < pa.count; i++) { const k = `${pa.getX(i).toFixed(3)},${pa.getY(i).toFixed(3)},${pa.getZ(i).toFixed(3)}`; if (!uniq.has(k)) uniq.set(k, v3(pa.getX(i), pa.getY(i), pa.getZ(i))); }
    const lenses = [...uniq.values()].filter(v => v.z > 0.4);
    const L = new LineBuilder(), centers = new Dust(lenses.length, { size: 0.1 });
    lenses.forEach((c, i) => {
      const n = c.clone().normalize(), t1 = v3(0, 1, 0).cross(n).normalize(), t2 = n.clone().cross(t1);
      const hex = []; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; hex.push(c.clone().addScaledVector(t1, Math.cos(a) * 0.15).addScaledVector(t2, Math.sin(a) * 0.15)); }
      L.poly(hex, true, GOLD);
      centers.setV(i, c.clone().multiplyScalar(1.01)); centers.color(i, WHITE);
    });
    centers.dirty(true);
    const dome = L.build(0.65); S.add(dome); S.add(centers);
    const angles = lenses.map(c => Math.acos(c.z / c.length()));
    const shaft = new Dust(2500, { size: 0.04 }); const r = rng(5);
    const sd = []; for (let i = 0; i < 2500; i++) sd.push({ x: r.gauss() * 0.4, y: r.gauss() * 0.4, ph: r() });
    S.add(shaft);
    return {
      scene: S, cam: C,
      update(u, t) {
        const front = range(u, 0.15, 0.85) * 1.3;
        angles.forEach((a, i) => { centers.alpha[i] = a < front ? 0.4 + 0.6 * Math.exp(-(front - a) * 4) : 0; });
        centers.dirty();
        sd.forEach((s, i) => { const a = (s.ph + t * 1.5) % 1; shaft.set(i, s.x, s.y + 8 - a * 5, 3.2 + a * 0.5); shaft.alpha[i] = range(u, 0.1, 0.3) * (1 - a); });
        shaft.dirty();
        look(C, v3(0, 0, lerp(9, 3.9, easeIn(u))), v3(0, 0, 0));
        return { bloom: 1 + range(u, 0.7, 1) };
      },
    };
  },

  // ── lightning splits the frame ──
  lightning() {
    const S = new THREE.Scene(), C = camera(40), r = rng(66);
    const bolts = crack(v3(-0.6, 4.6, 0), v3(0.3, -2.6, 0), r, { depth: 7, rough: 0.45, branches: 6, branchLen: 0.35 });
    const L = new LineBuilder(); bolts.forEach((pl, i) => L.poly(pl, false, i ? GOLD : WHITE));
    const bolt = L.build(1); S.add(bolt);
    // dead tree it strikes
    const T = new LineBuilder(), tr = rng(4);
    const br = (p, d, len, dep) => { const e = p.clone().addScaledVector(d, len); T.seg(p, e, DGOLD); if (dep < 5) for (let k = 0; k < 2; k++) br(e, d.clone().applyAxisAngle(v3(0, 0, 1), tr.range(-0.7, 0.7)).normalize(), len * 0.7, dep + 1); };
    br(v3(0.3, -4, 0), v3(0, 1, 0), 0.9, 0);
    S.add(T.build(0.6));
    const ground = new LineBuilder(); for (let k = -20; k <= 20; k++) { ground.seg(v3(k, -4, -20), v3(k, -4, 6), DGOLD); ground.seg(v3(-20, -4, k - 7), v3(20, -4, k - 7), DGOLD); }
    S.add(ground.build(0.15));
    return {
      scene: S, cam: C,
      update(u, t) {
        const strike = 0.25;
        bolt.reveal(u < strike ? easeIn(u / strike) * 0.7 : 1);
        bolt.material.opacity = u < strike ? 0.6 : Math.max(0.4, Math.exp(-(u - strike) * 5) * (0.6 + 0.4 * Math.sin(t * 60)));
        look(C, v3(0, 0, 11), v3(0, 0, 0));
        return { flash: u > strike ? 0.9 * Math.exp(-(u - strike) * 14) : 0, bloom: 1.4 };
      },
    };
  },

  // ── IV: stolen fire, held in a hand ──
  fire() {
    const S = new THREE.Scene(), C = camera(40);
    const f = flame(7000, GOLD, 3); f.position.y = -0.6; S.add(f);
    const hand = new LineBuilder().poly(handOutline(0.9), false, GOLD).build(0.6); hand.position.set(-1.4, -2.2, 0.5); hand.rotation.z = -0.5; S.add(hand);
    const branch = new LineBuilder().seg(v3(-2.6, -3.4, 0.4), v3(0, -0.7, 0), GOLD).seg(v3(-2.5, -3.4, 0.4), v3(0.05, -0.75, 0), DGOLD).build(0.9); S.add(branch);
    const emb = new Dust(300, { size: 0.06 }); const r = rng(8); const ed = []; for (let i = 0; i < 300; i++) ed.push({ x: r.gauss() * 0.6, ph: r(), z: r.gauss() * 0.5 }); S.add(emb);
    return {
      scene: S, cam: C,
      update(u, t) {
        f.step(t);
        ed.forEach((e, i) => { const a = (e.ph + t * 0.6) % 1; emb.set(i, e.x + Math.sin(t * 2 + i) * a, -0.5 + a * 6, e.z); emb.alpha[i] = 1 - a; emb.color(i, WHITE); });
        emb.dirty(true);
        look(C, v3(0, 0.6, lerp(7.5, 6.5, u)), v3(0, 0.6, 0));
        return { bloom: 1.5, tint: 0.2 };
      },
    };
  },

  // ── Plato's cave: forms become shadows become paintings ──
  cave() {
    const S = new THREE.Scene(), C = camera(42);
    const wallZ = -3;
    const wall = new LineBuilder();
    for (let i = -24; i <= 24; i++) { const pts = []; for (let j = -12; j <= 12; j++) pts.push(v3(i * 0.35, j * 0.35, wallZ + 0.4 * fbm(i * 0.2, j * 0.2, 1))); wall.poly(pts, false, DGOLD); }
    S.add(wall.build(0.13));
    const fireP = v3(0, -1.6, 4);
    const f = flame(3000, GOLD, 7, 1.6); f.position.copy(fireP).add(v3(0, -0.4, 0)); S.add(f);
    const forms = [new THREE.TetrahedronGeometry(0.45), new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.OctahedronGeometry(0.45), new THREE.DodecahedronGeometry(0.42), new THREE.IcosahedronGeometry(0.45)];
    const objs = forms.map((g, i) => { const w = wire(g, GOLD, 0.5, true); w.position.set(-2 + i, -0.4 + 0.3 * Math.sin(i), 2.6); S.add(w); return { w, e: new THREE.EdgesGeometry(g, 1) }; });
    const shadowLB = new LineBuilder(); objs.forEach(o => { const p = o.e.attributes.position; for (let i = 0; i < p.count; i += 2) shadowLB.seg(v3(), v3(), GOLD); });
    const shadow = shadowLB.build(0.95); S.add(shadow);
    const sp = shadow.geometry.attributes.position;
    // hand stencils and a bison on the wall
    const art = new LineBuilder();
    [[-3.6, 1.6, 0.3], [-2.9, 2.0, -0.2], [3.3, 1.7, 0.2]].forEach(([x, y, rot]) => art.poly(handOutline(0.45).map(p => p.applyAxisAngle(v3(0, 0, 1), rot).add(v3(x, y, wallZ + 0.1))), false, GOLD));
    const bison = []; for (let i = 0; i <= 60; i++) { const a = i / 60 * TAU; bison.push(v3(2.6 + Math.cos(a) * 1.0 * (1 + 0.25 * Math.sin(a)), -1.4 + Math.sin(a) * 0.55 + (a > 0.4 && a < 1.4 ? 0.35 : 0), wallZ + 0.1)); }
    art.poly(bison, true, GOLD);
    S.add(art.build(0.6));
    // prisoners, seen from behind
    const pr = new LineBuilder();
    for (let k = 0; k < 5; k++) { const x = -3 + k * 1.5; pr.poly(circle(0.28, 24).map(p => v3(p.x + x, p.y + 0.0 - 1.6, 1.4)), true, DGOLD); const sh = []; for (let i = 0; i <= 20; i++) { const a = Math.PI * i / 20; sh.push(v3(x + Math.cos(a) * 0.6, -2.5 + Math.sin(a) * 0.55, 1.4)); } pr.poly(sh, false, DGOLD); }
    S.add(pr.build(0.5));
    return {
      scene: S, cam: C,
      update(u, t) {
        f.step(t);
        let vi = 0;
        objs.forEach((o, k) => {
          o.w.rotation.set(t * 0.7 + k, t * 0.9, 0);
          o.w.position.x = -2 + k + u * 0.6;
          const p = o.e.attributes.position;
          for (let i = 0; i < p.count; i++) {
            const v = v3(p.getX(i), p.getY(i), p.getZ(i)).applyEuler(o.w.rotation).add(o.w.position);
            const s = (wallZ - fireP.z) / (v.z - fireP.z);
            const q = fireP.clone().add(v.sub(fireP).multiplyScalar(s));
            sp.setXYZ(vi++, q.x, q.y, wallZ + 0.12);
          }
        });
        sp.needsUpdate = true;
        look(C, v3(lerp(-1.2, 1.2, u), 0.3, 7.5), v3(0, 0.2, wallZ));
        return { tint: 0.3 };
      },
    };
  },

  // ── flame test: Li, K, Cu, then sodium's gold (589 nm) ──
  flame(p = {}) {
    const cols = { Li: new THREE.Color(1, 0.12, 0.28), K: new THREE.Color(0.72, 0.42, 1), Cu: new THREE.Color(0.2, 1, 0.6), Na: new THREE.Color(1, 0.74, 0.22) };
    const S = new THREE.Scene(), C = camera(40), col = cols[p.el];
    const f = flame(6000, col, { Li: 1, K: 2, Cu: 3, Na: 4 }[p.el], 3.2); f.position.y = -1.8; S.add(f);
    const loop = new LineBuilder().poly(circle(0.18, 24).map(q => v3(q.x + 0.5, q.y - 1.2, 0)), true, WHITE).seg(v3(0.68, -1.2, 0), v3(3.5, -2.8, 0), DGOLD).build(0.8); S.add(loop);
    const burner = new LineBuilder(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; burner.seg(v3(Math.cos(a) * 0.35, -2, Math.sin(a) * 0.35), v3(Math.cos(a) * 0.45, -4, Math.sin(a) * 0.45), DGOLD); }
    burner.poly(circle(0.35, 24).map(q => v3(q.x, -2, q.y)), true, GOLD);
    S.add(burner.build(0.5));
    let spec = null;
    if (p.el === 'Na') {
      const L = new LineBuilder();
      for (let k = 0; k <= 80; k++) L.seg(v3(-4 + k * 0.1, 2.6, -1), v3(-4 + k * 0.1, k % 10 ? 2.7 : 2.8, -1), DGOLD);
      L.seg(v3(-4, 2.6, -1), v3(4, 2.6, -1), DGOLD);
      [0.9, 0.97].forEach(x => L.seg(v3(x, 2.45, -1), v3(x, 3.6, -1), WHITE));
      spec = L.build(0); S.add(spec);
    }
    return {
      scene: S, cam: C,
      update(u, t) {
        f.step(t + 3);
        if (spec) spec.material.opacity = range(u, 0.2, 0.5);
        const az = { Li: -0.3, K: 0.3, Cu: -0.1, Na: 0 }[p.el];
        look(C, orbit(p.el === 'Na' ? lerp(8, 7, u) : 6, az + u * 0.1, 0.05), v3(0, p.el === 'Na' ? 0.4 : -0.2, 0));
        return { tint: p.el === 'Na' ? lerp(0, 0.35, u) : 0, bloom: 1.5 };
      },
    };
  },

  // ── bronze ding with taotie mask ──
  taotie() {
    const S = new THREE.Scene(), C = camera(38);
    const ding = new THREE.Group(); S.add(ding);
    ding.add(wire(new THREE.BoxGeometry(3.2, 2.2, 2.6, 1, 1, 1), BRONZE, 0.55, true));
    for (const x of [-1.3, 1.3]) for (const z of [-1.0, 1.0]) { const leg = wire(new THREE.CylinderGeometry(0.16, 0.12, 1.3, 10, 1, true), BRONZE, 0.4); leg.position.set(x, -1.75, z); ding.add(leg); }
    for (const x of [-1.0, 1.0]) { const h = []; for (let i = 0; i <= 20; i++) { const a = Math.PI * i / 20; h.push(v3(x + Math.cos(a) * 0.35, 1.1 + Math.sin(a) * 0.7, 0)); } ding.add(new LineBuilder().poly(h, false, BRONZE).build(0.6)); }
    // mask on the front face
    const M = new LineBuilder(), zF = 1.31;
    const mirror = (pts, c = GOLD) => { M.poly(pts.map(p => v3(p.x, p.y, zF)), false, c); M.poly(pts.map(p => v3(-p.x, p.y, zF)), false, c); };
    const eye = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU; eye.push(v3(0.6 + Math.cos(a) * 0.32, 0.15 + Math.sin(a) * 0.18, 0)); } mirror(eye, WHITE);
    const horn = []; for (let i = 0; i <= 80; i++) { const s = i / 80, a = s * TAU * 1.6, rr = 0.42 * (1 - s * 0.85); horn.push(v3(1.0 + Math.cos(a + 2) * rr, 0.6 + Math.sin(a + 2) * rr, 0)); } mirror(horn);
    const brow = []; for (let i = 0; i <= 20; i++) { const s = i / 20; brow.push(v3(0.15 + s * 0.9, 0.48 + Math.sin(s * Math.PI) * 0.12, 0)); } mirror(brow);
    const jaw = []; for (let i = 0; i <= 30; i++) { const s = i / 30; jaw.push(v3(0.1 + s * 1.2, -0.55 - Math.sin(s * Math.PI) * 0.18, 0)); } mirror(jaw);
    M.poly([v3(0, 0.75, zF), v3(0, -0.4, zF)], false, GOLD);
    for (let i = -3; i <= 3; i++) for (let j = -2; j <= 1; j++) { if (Math.abs(i) < 2 && j > -2 && j < 1) continue; const sp = squareSpiral(2.5, 0.16).map(p => v3(i * 0.42 + p.x * 0.34, j * 0.42 - 0.1 + p.y * 0.34, zF)); M.poly(sp, false, DGOLD); }
    ding.add(M.build(0.9));
    const pupils = new Dust(2, { size: 0.16 }); pupils.set(0, 0.6, 0.15, zF + 0.02); pupils.set(1, -0.6, 0.15, zF + 0.02); pupils.color(0, WHITE); pupils.color(1, WHITE); pupils.dirty(true); ding.add(pupils);
    const r = rng(5), patina = new Dust(3000, { size: 0.03, color: BRONZE }); for (let i = 0; i < 3000; i++) { patina.set(i, r.range(-1.6, 1.6), r.range(-1.1, 1.1), (r() < 0.5 ? -1 : 1) * 1.3); patina.alpha[i] = r.range(0.2, 0.7); } patina.dirty(); ding.add(patina);
    return {
      scene: S, cam: C,
      update(u, t, flash) {
        ding.rotation.y = lerp(1.2, 0, easeOut(range(u, 0, 0.8)));
        patina.opacity(1 - range(u, 0.3, 0.9));
        pupils.opacity(0.4 + 0.6 * range(u, 0.7, 0.9));
        look(C, v3(0, 0.1, lerp(7.5, 5.2, easeOut(u))), v3(0, 0.05, 0));
        return { tint: 0.25 };
      },
    };
  },

  // ── oracle bone: the hot bronze point, the crack, the pictographs rise ──
  oracle() {
    const S = new THREE.Scene(), C = camera(40);
    const L = new LineBuilder();
    const out = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * TAU; const y = Math.sin(a) * 2.5, notch = Math.abs(y) < 0.5 ? 0.85 : 1; out.push(v3(Math.cos(a) * 1.7 * notch * (1 - 0.12 * Math.sin(a)), y, 0)); }
    L.poly(out, true, GOLD); L.seg(v3(0, 2.5, 0), v3(0, -2.5, 0), DGOLD);
    [1.55, 0.6, -0.35, -1.35].forEach(y => { const pts = []; for (let i = 0; i <= 20; i++) { const x = -1.6 + i * 0.16; pts.push(v3(x, y + 0.12 * Math.cos(x * 1.5), 0)); } L.poly(pts, false, DGOLD); });
    const hollows = [];
    for (let row = 0; row < 5; row++) for (const sg of [-1, 1]) { const c = v3(sg * (0.55 + (row % 2) * 0.25), 1.8 - row * 0.85, 0); hollows.push(c); L.poly(circle(1, 20).map(p => v3(c.x + p.x * 0.11, c.y + p.y * 0.2, 0)), true, DGOLD); }
    S.add(L.build(0.7));
    // crack network grown in four strikes from one hollow
    const r = rng(23), start = hollows[3].clone(), cracks = [];
    const add = (a, b, gen) => { const pl = crack(a, b, r, { depth: 4, rough: 0.3, branches: 0 })[0]; cracks.push({ pl, gen }); return b; };
    add(start, start.clone().add(v3(0, -0.9, 0)), 0); add(start.clone().add(v3(0, -0.4, 0)), start.clone().add(v3(0.7, -0.3, 0)), 0);
    let tips = [start.clone().add(v3(0, -0.9, 0)), start.clone().add(v3(0.7, -0.3, 0))];
    for (let gen = 1; gen < 4; gen++) { const nt = []; tips.forEach(tp => { for (let k = 0; k < 2; k++) { const e = tp.clone().add(v3(r.range(-0.8, 0.8), r.range(-0.8, 0.6), 0)); e.x = clamp(e.x, -1.5, 1.5); e.y = clamp(e.y, -2.2, 2.2); nt.push(add(tp, e, gen)); } }); tips = nt; }
    const crackLines = cracks.map(c => { const l = new LineBuilder().poly(c.pl, false, WHITE).build(1); S.add(l); return { l, gen: c.gen }; });
    // pictographs: sun, eye, fire, person
    const glyphs = [];
    const mkG = (fn, pos) => { const G = new LineBuilder(); fn(G); const l = G.build(1); l.position.copy(pos); S.add(l); glyphs.push(l); };
    mkG(G => { G.poly(circle(0.22, 24), true, GOLD); G.poly(circle(0.03, 6), true, WHITE); }, tips[0]);
    mkG(G => { const e = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * TAU; e.push(v3(Math.cos(a) * 0.3, Math.sin(a) * 0.14 * (1 + 0.3 * Math.cos(a)), 0)); } G.poly(e, true, GOLD); G.poly(circle(0.07, 12), true, WHITE); }, tips[3]);
    mkG(G => { [-0.18, 0, 0.18].forEach((x, i) => G.poly([v3(x, -0.2, 0), v3(x * 1.4, i === 1 ? 0.3 : 0.12, 0)], false, GOLD)); G.poly([v3(-0.25, -0.22, 0), v3(0.25, -0.22, 0)], false, GOLD); }, tips[5]);
    mkG(G => { G.poly([v3(-0.2, -0.25, 0), v3(0.02, 0.25, 0)], false, GOLD); G.poly([v3(0.0, 0.05, 0), v3(0.22, -0.25, 0)], false, GOLD); }, tips[7]);
    const rod = new LineBuilder().seg(v3(3.5, 3.8, 1.5), start.clone().add(v3(0.05, 0.05, 0.05)), BRONZE).build(0.8); S.add(rod);
    const tip = seedPoint(); tip.position.copy(start); S.add(tip);
    const NP = 2000, motes = new Dust(NP, { size: 0.04 }); S.add(motes); const md = []; for (let i = 0; i < NP; i++) md.push({ g: i % 4, o: r.dir().multiplyScalar(0.3), s: r() });
    return {
      scene: S, cam: C,
      update(u, t) {
        rod.material.opacity = 0.8 * (1 - range(u, 0.15, 0.3)); tip.opacity(1 - range(u, 0.2, 0.4));
        crackLines.forEach(c => { const a = range(u, 0.0 + c.gen * 0.125, 0.12 + c.gen * 0.125); c.l.reveal(easeOut(a)); });
        glyphs.forEach((g, i) => { const a = range(u, 0.55, 0.65), lift = range(u, 0.7, 1); g.material.opacity = a * (1 - lift * 0.8); g.position.z = lift * 3; g.scale.setScalar(1 + lift); });
        md.forEach((m, i) => { const g = glyphs[m.g], lift = range(u, 0.7, 1); motes.setV(i, g.position.clone().add(m.o.clone().multiplyScalar(1 + lift * 3)).add(v3(0, 0, lift * 4 * m.s))); motes.alpha[i] = lift * (1 - lift * 0.5); });
        motes.dirty();
        look(C, v3(0, -0.3, lerp(6.8, 9, easeIn(range(u, 0.6, 1)))), v3(0, 0, 0));
        return { bloom: 1.2, tint: 0.3 };
      },
    };
  },
};
