// 御剑 YUJIAN — world layout: one continuous place that every shot films.
import * as THREE from 'three';
import { mulberry32, lerp, clamp } from './util.js';
import { ENV, skyMesh, paintMat } from './materials.js';
import { CloudField, cloudSea, scatter, STORM } from './clouds.js';
import { buildJianmu, buildIsland, buildPeaks, Chain, catenary, giantSwordG, TRUNK, PAL, CHAIN_MAT, merge, pagodaG, hallG, HALL_MAT, roofG, boxG } from './world.js';
const solidC = (g, c) => { const n = g.attributes.position.count; const a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
const col = (h) => new THREE.Color(h);
const roofG2 = (w, d, h, lift, y, x = 0) => { const g = roofG(w, d, h, lift, PAL.roofGlaze, y); if (x) g.translate(x, 0, 0); return g; };
import { Cranes } from './cranes.js';
import { FX } from './fx.js';
import { Hero } from './figure.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// floating islands around the trunk: [seed, R, depth, x, y, z, opts]
export const ISLANDS = [
  { id: 'i1', seed: 3, R: 150, depth: 540, p: V(-1596, 520, 798), halls: [{ x: -0.2, z: 0.1, w: 34, h: 14, double: true }, { x: 0.35, z: -0.3, w: 14, h: 12, pagoda: true, tiers: 5 }], fall: [[0.92, 0.6]] },
  { id: 'i2', seed: 7, R: 95, depth: 342, p: V(1176, 880, -882), halls: [{ x: 0.1, z: 0.1, w: 22, h: 10 }], fall: [[0.95, 2.2]] },
  { id: 'i3', seed: 11, R: 230, depth: 828, p: V(-882, 1260, -2058), halls: [{ x: 0, z: 0, w: 46, h: 18, double: true, glaze: true }, { x: -0.45, z: 0.3, w: 20, h: 10 }, { x: 0.5, z: 0.25, w: 16, h: 13, pagoda: true, tiers: 4 }], fall: [[0.95, 1.0], [0.9, 2.5]] },
  { id: 'i4', seed: 13, R: 70, depth: 252, p: V(882, 1520, 1344), halls: [{ x: 0, z: 0, w: 16, h: 8 }], fall: [] },
  { id: 'i5', seed: 17, R: 130, depth: 468, p: V(2058, 2010, 336), halls: [{ x: 0.1, z: -0.1, w: 28, h: 12, double: true }], fall: [[0.93, 3.5]] },
  { id: 'i6', seed: 19, R: 64, depth: 230, p: V(-1176, 2280, -462), halls: [{ x: 0, z: 0, w: 10, h: 10, pagoda: true, tiers: 3 }], fall: [] },
  { id: 'i7', seed: 23, R: 170, depth: 612, p: V(-2310, 2900, 1470), halls: [{ x: 0.1, z: 0.2, w: 36, h: 15, double: true, glaze: true }], fall: [[0.94, 5.0]] },
  { id: 'sw', seed: 29, R: 140, depth: 504, p: V(1596, 2760, -1638), halls: [], fall: [[0.93, 1.3]] },
  { id: 'i8', seed: 31, R: 110, depth: 396, p: V(630, 3400, 1890), halls: [{ x: 0, z: 0, w: 20, h: 10 }], fall: [[0.92, 4.2]] },
  { id: 'i9', seed: 37, R: 90, depth: 324, p: V(-1470, 3700, -1260), halls: [{ x: 0, z: 0, w: 12, h: 12, pagoda: true, tiers: 4 }], fall: [] },
  // lower ring, seen in the hook and from the sect mountain
  { id: 'l1', seed: 41, R: 120, depth: 432, p: V(1800, 260, 1350), halls: [{ x: 0, z: 0, w: 22, h: 10 }], fall: [[0.9, 1.0]] },
  { id: 'l2', seed: 43, R: 80, depth: 288, p: V(-2250, 380, -600), halls: [], fall: [[0.92, 0.3]] },
  { id: 'l3', seed: 47, R: 100, depth: 360, p: V(2475, 1150, -1800), halls: [{ x: 0, z: 0, w: 18, h: 10, double: true }], fall: [] },
];
// the sect mountain where she stands (S4/S5): a large floating massif far from the trunk, cliff edge facing the trunk
export const SECT = { p: V(2700, 620, 2300), R: 330, depth: 700 };
export const EDGE = V(2700 - 260 * 0.72, 620 + 30, 2300 - 260 * 0.69);   // approx cliff edge toward trunk (refined at build)

export function buildWorld(renderer, atlas) {
  const scene = new THREE.Scene(); const heroScene = new THREE.Scene();
  const sky = skyMesh(); scene.add(sky);
  const sea = cloudSea(); scene.add(sea);
  const storm = cloudSea(STORM); scene.add(storm); storm.visible = false;
  const jm = buildJianmu(); scene.add(jm.lower); scene.add(jm.upper);
  // islands
  const islands = {};
  for (const d of ISLANDS) {
    const g = buildIsland(d.seed, d.R, d.depth, { halls: d.halls }); g.position.copy(d.p); g.rotation.y = d.seed * 0.7; scene.add(g); islands[d.id] = g; g.userData.def = d;
  }
  // sect mountain: broad plateau, steep cliff; halls set back from the edge facing the trunk
  const toTrunk = Math.atan2(-SECT.p.z, -SECT.p.x);
  const sect = buildIsland(101, SECT.R, SECT.depth, { topH: 40, taper: 0.9, pines: 46, halls: [
    { x: 0.25, z: -0.35, w: 60, h: 20, double: true, glaze: true }, { x: 0.55, z: 0.1, w: 30, h: 12 }, { x: -0.05, z: -0.75, w: 18, h: 16, pagoda: true, tiers: 5 }, { x: 0.6, z: -0.6, w: 26, h: 11 }] });
  sect.position.copy(SECT.p); sect.rotation.y = -toTrunk + Math.PI; scene.add(sect);
  // giant sword in the 'sw' island
  const swordM = new THREE.Mesh(giantSwordG(520), paintMat({ brushScale: 0.05, stretch: [1, 0.3, 1], brush: 0.25, rim: 0.8 }));
  swordM.position.copy(islands.sw.position).add(V(0, 330, 0)); swordM.rotation.set(0.12, 0.6, -0.18); scene.add(swordM);
  // pillar peaks: near ring (with tops in sun) and far rings fading into mist
  scene.add(buildPeaks(5, 80, 3000, 8000, V(0, 0, 0), { wMin: 140, wVar: 220, hMin: 350, hVar: 1100 }));
  scene.add(buildPeaks(6, 100, 8000, 18000, V(0, 0, 0), { wMin: 300, wVar: 500, hMin: 500, hVar: 1800 }));
  // set-piece pillar peaks with pines (hook foreground, flight)
  const setPeaks = new THREE.Group(); scene.add(setPeaks);
  const sp = (x, z, w2, h2, seed) => { const g = buildPeaks(seed, 1, 0, 0.001, V(x, 0, z), { wMin: w2, wVar: 0.001, hMin: h2, hVar: 0.001, y: -300 }); setPeaks.add(g); };

  // chains: rung ends → islands
  const chains = [];
  const ends = jm.rungInfo;
  const pick = (y) => ends.reduce((b, e) => (Math.abs(e.y - y) < Math.abs(b.y - y) ? e : b), ends[0]);
  for (const d of ISLANDS) {
    if (d.id.startsWith('l')) continue;
    const top = d.p.clone().add(V(0, 20, 0));
    const e = pick(d.p.y + 260);
    const ch = new Chain(260, 7); const A = e.end.clone(), B = top.clone().add(V(0, 0, 0)).lerp(A, 0.04);
    const len = A.distanceTo(B) * 1.12; ch.layout(catenary(A, B, len * 0.12), len); scene.add(ch.im);
    chains.push({ ch, A, B, upper: e.upper, len });
  }
  // a few chains that hang from the upper rungs into the void (the ones that snap)
  const snapChains = [];
  for (let k = 0; k < 5; k++) {
    const e = ends.filter(x => x.upper)[2 + k * 3]; const ch = new Chain(320, 9); scene.add(ch.im);
    snapChains.push({ ch, A: e.end.clone(), len: 700 + 200 * k, phase: k * 1.3 });
  }
  // clouds
  const clouds = new CloudField(atlas, 520); scene.add(clouds.mesh);
  const baseClouds = [
    // low banks hugging the sea all around
    ...scatter(101, 70, (r) => { const a = r() * 6.28, d = 1800 + Math.pow(r(), 0.7) * 9000; const w = 500 + r() * 900; return { p: V(Math.cos(a) * d, -w * 0.03, Math.sin(a) * d), w, h: w * 0.42, cell: Math.floor(r() * 8), op: 0.9, flip: r() < 0.5 }; }),
    // mid-level wisps and bands around the trunk
    ...scatter(102, 110, (r) => { const a = r() * 6.28, d = 450 + Math.pow(r(), 0.8) * 4000; const w = 260 + r() * 900; const band = r() < 0.3; const cum = false; return { p: V(Math.cos(a) * d, 250 + r() * 3400, Math.sin(a) * d), w: band ? w * 2.0 : w, h: band ? w * 0.35 : w * 0.5, cell: band ? 8 + Math.floor(r() * 4) : (cum ? Math.floor(r() * 8) : 12 + Math.floor(r() * 4)), op: band ? 0.35 + 0.2 * r() : 0.5 + 0.35 * r(), flip: r() < 0.5 }; }),
  ];
  // 南天门 for the finale: round vermilion pillars with gold bands, a two-tier roof with ridge horns, a gold-lettered plaque,
  // a broad jade stair down the cloud bank, flanking towers and receding halls — backlit by the low sun
  const gates = new THREE.Group(); gates.visible = false; scene.add(gates);
  const GATE_MAT = paintMat({ brushScale: 0.004, brush: 0.08, rim: 1.6, wrap: 0.25, side: THREE.DoubleSide });
  const GATE = { x: 1300, y: 6300, z: -9500 };
  {
    const cyl = (r, h, c, x, y, z, seg = 24) => { const g = new THREE.CylinderGeometry(r, r, h, seg); g.translate(x, y + h / 2, z); return solidC(g, c); };
    const parts = [];
    for (const s of [-1, 1]) {
      parts.push(cyl(120, 1500, PAL.verm, s * 560, 0, 0));
      for (const yy of [60, 1300, 1420]) parts.push(cyl(132, 40, PAL.gold, s * 560, yy, 0));
      parts.push(boxG(320, 120, 320, PAL.stone, s * 560, 60, 0));
    }
    parts.push(boxG(1600, 150, 260, PAL.verm, 0, 1360, 0), boxG(1700, 50, 300, PAL.gold, 0, 1280, 0), boxG(1500, 60, 280, PAL.gold, 0, 1460, 0));
    parts.push(boxG(1500, 220, 240, PAL.roof, 0, 1600, 0));                          // bracket band (斗拱 mass)
    parts.push(roofG(2500, 780, 600, 300, PAL.roofGlaze, 1700), boxG(900, 300, 300, PAL.verm, 0, 2150, 0), roofG(1500, 560, 440, 220, PAL.roofGlaze, 2280));
    for (const s of [-1, 1]) { const h = new THREE.ConeGeometry(45, 220, 6); h.rotateZ(s * 0.5); h.translate(s * 720, 2780, 0); parts.push(solidC(h, PAL.gold)); }
    // stair: broad white-jade steps descending toward the camera
    for (let i = 0; i < 26; i++) parts.push(boxG(1300 + i * 30, 40, 70, col(0xe8eee6), 0, -i * 40, 140 + i * 70));
    const gm = new THREE.Mesh(merge(parts), GATE_MAT); gm.position.set(GATE.x, GATE.y, GATE.z); gates.add(gm);
    // plaque 「南天门」
    const pc = document.createElement('canvas'); pc.width = 256; pc.height = 640; const px = pc.getContext('2d');
    px.fillStyle = '#16303a'; px.fillRect(0, 0, 256, 640); px.strokeStyle = '#d9b46a'; px.lineWidth = 18; px.strokeRect(9, 9, 238, 622);
    px.fillStyle = '#e8c27a'; px.font = '150px "Ma Shan Zheng"'; px.textAlign = 'center'; px.textBaseline = 'middle'; ['南', '天', '门'].forEach((ch, i) => px.fillText(ch, 128, 125 + i * 195));
    const ptex = new THREE.CanvasTexture(pc); ptex.colorSpace = THREE.NoColorSpace;
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(170, 420), new THREE.MeshBasicMaterial({ map: ptex, toneMapped: false, fog: false }));
    plaque.position.set(GATE.x, GATE.y + 1520 + 60, GATE.z + 170); gates.add(plaque); gates.userData.plaque = { tex: ptex, canvas: pc };
    for (const s of [-1, 1]) { const tw = new THREE.Mesh(pagodaG(1, 6, 1.0), GATE_MAT); tw.scale.setScalar(380); tw.position.set(GATE.x + s * 2000, GATE.y - 300, GATE.z + 600); gates.add(tw); }
    const r = mulberry32(404);
    for (let i = 0; i < 10; i++) { const side = i % 2 ? 1 : -1; const d = 1 + Math.floor(i / 2); const m = new THREE.Mesh(hallG(1, 0.6, 1, { double: true, glaze: true }), GATE_MAT);
      m.scale.setScalar(480 + 260 * r()); m.position.set(GATE.x + side * (2600 + d * 1200 + 400 * r()), GATE.y - 500 + d * 280, GATE.z - 1500 - d * 900 * r()); m.rotation.y = (r() - 0.5) * 0.5; gates.add(m); }
    for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(hallG(1, 0.7, 1, { double: true, glaze: true }), GATE_MAT); m.scale.setScalar(1000 - i * 150); m.position.set(GATE.x + (i % 2 ? 500 : -400), GATE.y + 1600 + i * 900, GATE.z - 4000 - i * 2500); gates.add(m); }
  }
  // clouds wrapping the island bases
  const islandClouds = [];
  { const r = mulberry32(707); for (const d of ISLANDS) { for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + r(); const wd = d.R * (1.6 + 1.2 * r()); islandClouds.push({ p: d.p.clone().add(V(Math.cos(a) * d.R * 0.9, -d.depth * (0.55 + 0.35 * r()), Math.sin(a) * d.R * 0.9)), w: wd, h: wd * 0.45, cell: Math.floor(r() * 8), op: 0.85, flip: r() < 0.5 }); } } }
  baseClouds.push(...islandClouds);
  // cranes
  const cranes = new Cranes(80); scene.add(cranes.mesh);
  // effects
  const fx = new FX(scene, heroScene, jm);
  fx.addFalls(islands, sect);
  // hero
  const hero = new Hero(); heroScene.add(hero.group); scene.add(hero.worldSprite);

  const world = {
    scene, heroScene, sky, sea, storm, jm, setPeaks, gates, islandClouds, islands, sect, swordM, chains, snapChains, clouds, cranes, fx, hero, baseClouds, extraClouds: [],
    update(t, cam, dir, st) {
      gates.visible = !!st.gates;
      // chains to the upper trunk vanish once it breaks; the hanging ones whip loose with it
      const broken = t >= 6.0;
      for (const c of chains) if (c.upper) c.ch.im.visible = !broken;
      const showSnap = t < 9.0 && jm.upper.visible;
      for (const s of snapChains) {
        s.ch.im.visible = showSnap; if (!showSnap) continue;
        const A = s.A.clone(); if (broken) { jm.upper.updateMatrixWorld(true); A.applyMatrix4(jm.upper.matrixWorld); }
        const d = Math.max(0, t - 6.0), out = V(s.A.x, 0, s.A.z).normalize();
        const phi0 = broken ? Math.min(1.3, d * 0.9) : 0.04 * Math.sin(t + s.phase);
        s.ch.layout(u => { const ph = phi0 * (0.3 + 0.7 * u) + (broken ? 0.5 * Math.sin(3.2 * d - 4 * u + s.phase) * u * Math.min(1, d * 2) : 0); return A.clone().addScaledVector(out, Math.sin(ph) * s.len * u).add(V(0, -Math.cos(ph) * s.len * u, 0)); }, s.len);
      }
      clouds.setItems(st.clouds ? st.clouds : baseClouds.concat(world.extraClouds));
      clouds.update(cam.position, dir);
      cranes.update(t, st.cranes || [], cam);
      fx.update(t, st, cam);
      hero.update(t, st, cam);
    },
  };
  return world;
}
