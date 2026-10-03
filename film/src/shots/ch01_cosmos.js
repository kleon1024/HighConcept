// 序 · 卵 and I 振 — gold on black, then the indigo cosmos.
import {
  THREE, TAU, clamp, lerp, smooth, smoother, easeOut, easeIn, easeInOut, range, v3, col, rng, fbm,
  displace, backdrop, rig, mats, materialize, canvasTexture, Dust, LineBuilder, tube, squareSpiral,
  camera, look, orbit, drift, seedPoint,
} from '../core.js';

// egg profile (y from -1 to 1), slightly pointed at the top
const eggR = y => 0.74 * Math.sqrt(Math.max(0, 1 - y * y)) * (1 - 0.12 * y);
function eggGeometry(s = 1.3, seg = 160) {
  const pts = [];
  for (let i = 0; i <= 120; i++) { const y = -Math.cos(Math.PI * i / 120); pts.push(new THREE.Vector2(Math.max(1e-4, eggR(y) * s), y * s)); }
  return new THREE.LatheGeometry(pts, seg);
}
// 云雷纹 band as a bump map (lathe UV: x around, y bottom→top)
function thunderCloudBump() {
  return canvasTexture('yunlei-band', 2048, 1024, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'square';
    const band = (y0, hh, n, flip) => {
      g.fillStyle = '#fff'; g.fillRect(0, y0 - 6, w, 5); g.fillRect(0, y0 + hh + 1, w, 5);
      for (let k = 0; k < n; k++) {
        const cx = (k + 0.5) * w / n, sz = hh * 0.8;
        const sp = squareSpiral(3, 0.15);
        g.beginPath();
        sp.forEach((p, i) => { const x = cx + ((k + flip) % 2 ? -p.x : p.x) * sz, y = y0 + hh / 2 + p.y * sz; i ? g.lineTo(x, y) : g.moveTo(x, y); });
        g.stroke();
      }
    };
    band(h * 0.40, h * 0.1, 24, 0);
    band(h * 0.53, h * 0.07, 32, 1);
  }, { srgb: false });
}
// a cupped lotus petal rising from radius r0; open = tilt from vertical (rad). Rebuilt each frame.
const NU = 20, NV = 10;
function petalGeometry() {
  const geo = new THREE.BufferGeometry(), I = [], U = [];
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) U.push(j / NV, i / NU);
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((NU + 1) * (NV + 1) * 3), 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); geo.setIndex(I);
  return geo;
}
function shapePetal(geo, { len = 1.2, wid = 0.45, r0 = 0.5, open = 0.4, curl = 0.5, cup = 0.5 }) {
  const P = geo.attributes.position; let y = 0, z = 0; const spine = [];
  for (let i = 0; i <= NU; i++) { const a = open + curl * (i / NU) ** 2; spine.push([y, z, a]); y += Math.cos(a) * len / NU; z += Math.sin(a) * len / NU; }
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) {
    const s = i / NU, w = (j / NV - 0.5) * 2, [sy, sz, a] = spine[i];
    const half = wid * Math.sin(Math.PI * Math.min(1, Math.pow(s, 0.7) * 1.0)) * (1 - 0.35 * s) + 0.02;
    const k = cup * w * w * half;
    P.setXYZ(i * (NV + 1) + j, w * half, sy + k * Math.sin(a), r0 + sz - k * Math.cos(a));
  }
  P.needsUpdate = true; geo.computeVertexNormals();
}

export const shots = {
  // ── 0–4: a gold point unspools into a thread, the thread becomes a golden egg on a lotus; first crack of light ──
  egg() {
    const S = new THREE.Scene(), C = camera(32);
    backdrop(S, 'egg', { stars: 600 });
    const L = rig(S, 'egg', { key: v3(4, 7, 5), keyI: 2.2, rimI: 3 });
    // floor: dark lacquer that catches reflections and the egg's shadow
    const floor = new THREE.Mesh(new THREE.CircleGeometry(120, 96), new THREE.MeshStandardMaterial({ color: col('#080503'), roughness: 0.95, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -1.62; floor.receiveShadow = true; S.add(floor);

    const egg = new THREE.Mesh(eggGeometry(), mats.gold({ bumpMap: thunderCloudBump(), bumpScale: 4, roughness: 0.3 }));
    egg.castShadow = true; S.add(egg);
    const scan = materialize(egg, { color: '#ffd27a', wireGeometry: eggGeometry(1.3, 36).toNonIndexed() });

    // the fate thread: a glowing filament wound around the egg
    const thr = [v3(0, 0, 0)];
    for (let i = 0; i <= 700; i++) { const s = i / 700, y = -Math.cos(Math.PI * s), a = s * TAU * 11; thr.push(v3(Math.cos(a) * eggR(y) * 1.33, y * 1.33, Math.sin(a) * eggR(y) * 1.33)); }
    const threadGeo = tube(thr, 0.008, 1400, 6);
    const thread = new THREE.Mesh(threadGeo, mats.glow('#ffcf70', 2.5)); S.add(thread);
    const tIdx = threadGeo.index.count;

    // lotus: two rings of cupped petals that open
    const lotus = new THREE.Group(); lotus.position.y = -1.55; S.add(lotus);
    const petalMat = mats.organic('#f2c6b0', { roughness: 0.4, emissive: col('#ff9a60'), emissiveIntensity: 0.12, side: THREE.DoubleSide });
    const rings = [{ n: 14, len: 1.25, wid: 0.5, r0: 0.75, off: 0, open: 1.05 }, { n: 12, len: 1.15, wid: 0.46, r0: 0.6, off: TAU / 24, open: 0.7 }, { n: 10, len: 1.0, wid: 0.4, r0: 0.45, off: 0, open: 0.35 }];
    rings.forEach((R, ring) => {
      R.geo = petalGeometry();
      for (let k = 0; k < R.n; k++) {
        const pivot = new THREE.Group(); pivot.rotation.y = R.off + k / R.n * TAU;
        const m = new THREE.Mesh(R.geo, petalMat); m.castShadow = true; m.receiveShadow = true;
        pivot.add(m); lotus.add(pivot);
      }
    });

    // the crack of light (emissive lines just above the surface)
    const r = rng(9), cr = new LineBuilder();
    const onEgg = (a, y) => v3(Math.cos(a) * eggR(y) * 1.305, y * 1.3, Math.sin(a) * eggR(y) * 1.305);
    let a = 0.9, y = 0.95; const main = [onEgg(a, y)];
    while (y > -0.2) { y -= 0.04; a += r.range(-0.12, 0.12); main.push(onEgg(a, y)); if (r() < 0.15) { let ba = a, by = y; const br = [onEgg(ba, by)]; for (let k = 0; k < 6; k++) { by -= 0.03; ba += r.range(-0.1, 0.2); br.push(onEgg(ba, by)); } cr.poly(br, false, '#ffe8b8', 4); } }
    cr.poly(main, false, '#fff3d6', 10);
    const crackL = cr.build(1); S.add(crackL);
    const glowLight = new THREE.PointLight(col('#ffcf70'), 0, 6); glowLight.position.set(0.6, 0.6, 1.2); S.add(glowLight);

    const seed = seedPoint(); S.add(seed);
    const motes = new Dust(400, { size: 0.02, color: '#ffcf70', intensity: 2 }); S.add(motes);
    const md = []; for (let i = 0; i < 400; i++) md.push({ p: v3(r.range(-5, 5), r.range(-1.8, 3), r.range(-5, 3)), ph: r() });

    return {
      scene: S, cam: C,
      update(u, t) {
        seed.opacity(smooth(range(u, 0.03, 0.12)) * (1 - range(u, 0.3, 0.4)));
        seed.position.copy(thr[Math.floor(easeOut(range(u, 0.12, 0.45)) * 700)]);
        threadGeo.setDrawRange(0, Math.floor(easeOut(range(u, 0.12, 0.45)) * tIdx / 3) * 3);
        thread.material.color.copy(col('#ffcf70')).multiplyScalar(2.5 * (1 - range(u, 0.5, 0.66)));
        scan.set(easeInOut(range(u, 0.3, 0.72)), range(u, 0.2, 0.35));
        L.key.intensity = 2.2 * range(u, 0.25, 0.5); L.rim.intensity = 3 * range(u, 0.2, 0.45);
        rings.forEach((R, ring) => { const o = easeOut(range(u, 0.45 + ring * 0.04, 0.92)); shapePetal(R.geo, { len: R.len, wid: R.wid, r0: R.r0 * lerp(0.35, 1, o), open: lerp(-0.25, R.open, o), curl: lerp(-0.3, 0.6, o), cup: 0.55 }); });
        lotus.scale.setScalar(lerp(0.85, 1, smooth(range(u, 0.4, 0.9))));
        crackL.reveal(easeOut(range(u, 0.86, 0.98))); crackL.material.opacity = range(u, 0.86, 0.9);
        glowLight.intensity = 8 * range(u, 0.86, 1);
        md.forEach((m, i) => { motes.set(i, m.p.x + Math.sin(t * 0.7 + i) * 0.2, m.p.y + ((t * 0.15 + m.ph) % 1) * 0.6, m.p.z); motes.alpha[i] = 0.5 * range(u, 0.3, 0.6) * Math.sin(Math.PI * ((t * 0.15 + m.ph) % 1)); });
        motes.dirty();
        egg.rotation.y = 0.3 * t;
        const camP = orbit(lerp(9.5, 6.4, easeInOut(u)), lerp(-0.25, 0.25, u), lerp(0.08, 0.16, u)).add(drift(t, 0.02));
        look(C, camP, v3(0, lerp(0, -0.25, u), 0));
        return { bloom: 0.45, exposure: lerp(0.85, 0.95, u) };
      },
    };
  },
};
