// 失真 DISTORTION — deterministic renderAt(t) for the 30 s piece. Beat sheet: ../CONCEPT.md.
import * as THREE from 'three';
import opentype from '../node_modules/opentype.js/dist/opentype.module.js';
import {
  W, H, ACID, P, clamp, lerp, seg, smooth, easeOut, easeIn, easeInOut, easeOutBack, spring, mulberry32,
  makeRenderer, makeCamera, studioEnv, skyEnv, LIQ, chrome, taperTube, glyphShapes,
  buildSpeaker, buildThorns, makeWave, buildBlade, buildPencil, buildPedal, SLASH, HOLES, CRACKS,
} from './lib.js';

// ───────────── music grid (music/score.py: 160 BPM, riff downbeat grid starts at 0.75 s)
const T0 = 0.75, BAR = 1.5, BEAT = 0.375, S16 = BEAT / 4;
const TB = (bar, pos = 0) => T0 + (bar - 1) * BAR + pos * S16;
const GAIN_KEYS = [[0.0, 34], [2.25, 34], [2.30, 0], [4.4, 30], [5.25, 30], [5.30, 17], [11.25, 18], [13.9, 40], [14.25, 34], [17.2, 34], [17.25, 42], [30.0, 42]];
const gainAt = t => { for (let i = 1; i < GAIN_KEYS.length; i++) if (t <= GAIN_KEYS[i][0]) { const [a, va] = GAIN_KEYS[i - 1], [b, vb] = GAIN_KEYS[i]; return lerp(va, vb, (t - a) / (b - a || 1)); } return 42; };
const JABS = [TB(6, 4), TB(6, 10), TB(7)];
const HITS = [TB(1), TB(2), TB(4), TB(5), TB(6, 4), TB(6, 10), TB(7), TB(8), TB(10), TB(12), TB(14), TB(16), TB(17)];
const KICK16 = []; for (let b = 12; b <= 15; b++) for (let i = 0; i < 16; i++) KICK16.push(TB(b, i));
for (let i = 0; i < 15; i++) KICK16.push(TB(16, i));
const S = { slam: TB(1), clip: TB(2), y51: TB(4), land: TB(5), y58: TB(6), y62: TB(8), y64: TB(10), dive: TB(12), wall: TB(13), solo: TB(14), build: TB(16), fin: TB(17), line: TB(18) };

function pulse(t, list, tau = 0.12, w = 1) { let v = 0; for (const h of list) if (t >= h && t - h < 6 * tau) v = Math.max(v, w * Math.exp(-(t - h) / tau)); return v; }

// ───────────── three.js setup
const glCanvas = document.getElementById('gl');
const renderer = makeRenderer(glCanvas);
const camera = makeCamera();
const scene = new THREE.Scene();
scene.environment = studioEnv(renderer);
const SKY = skyEnv(renderer);
const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-1.2, 2.0, 1.6); scene.add(key);
const rimL = new THREE.DirectionalLight(0xffffff, 1.2); rimL.position.set(1.5, 0.4, -0.8); scene.add(rimL);
const limeLight = new THREE.PointLight(ACID, 0, 0, 0); scene.add(limeLight);

// hero rig: speaker + thorns + blade + pencil + in/out waves
const rig = new THREE.Group(); scene.add(rig);
const spk = buildSpeaker(); rig.add(spk.group);
const thorns = buildThorns(); rig.add(thorns.group);
const blade = buildBlade(); rig.add(blade);
const pencil = buildPencil(); rig.add(pencil);
const ioMat = chrome({ roughness: 0.05 });
const ioWaves = new THREE.Group(); rig.add(ioWaves);
{
  const A = 64, k = Math.PI * 2 / 150;
  const mk = (x0, x1, G) => { const pts = []; for (let x = x0; x <= x1; x += 2) { const s = Math.sin(k * (x + 18)); pts.push(new THREE.Vector3(x, G < 0.5 ? A * s : A * Math.tanh(G * s) / Math.tanh(G), -22)); } return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0), pts.length * 3, 5.2, 12, false), ioMat); };
  ioWaves.add(mk(-700, -318, 0)); ioWaves.add(mk(318, 700, 9));
}
// big waveform (S2) — starts as a glowing acid line, becomes chrome
const waveMat = chrome({ roughness: 0.04, emissive: new THREE.Color(ACID), emissiveIntensity: 0 }, [0.05, 1 / 120, 0.4, 0.2]);
const wave = makeWave(waveMat); scene.add(wave.mesh);
// pedal (S5)
const pedal = buildPedal(); scene.add(pedal.group);
const led = new THREE.Mesh(new THREE.CircleGeometry(9, 24), new THREE.MeshBasicMaterial({ color: ACID, toneMapped: false })); led.position.set(0, -60, 76); pedal.group.add(led);
// tunnel (S7a)
const tunnel = new THREE.Group(); scene.add(tunnel);
const ringMat = chrome({ roughness: 0.05 }, [0.08, 1 / 200, 0.3, 0.4]);
const RINGS = 16, RSP = 520;
for (let i = 0; i < RINGS; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(470, 13, 16, 160), ringMat); tunnel.add(r); }
const gridGeo = new THREE.BufferGeometry(), gridPts = [];
for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; for (let z = 0; z < 40; z++) { const z0 = -z * 260, z1 = -(z + 1) * 260; gridPts.push(560 * Math.cos(a), 560 * Math.sin(a), z0, 560 * Math.cos(a), 560 * Math.sin(a), z1); } }
gridGeo.setAttribute('position', new THREE.Float32BufferAttribute(gridPts, 3));
const gridMat = new THREE.LineBasicMaterial({ color: ACID, transparent: true, opacity: 0.55, toneMapped: false });
const grid = new THREE.LineSegments(gridGeo, gridMat); tunnel.add(grid);
const tgc = document.createElement('canvas'); tgc.width = tgc.height = 256; { const x = tgc.getContext('2d'), g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(235,255,150,1)'); g.addColorStop(0.2, 'rgba(200,255,30,0.8)'); g.addColorStop(0.6, 'rgba(120,160,15,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }
const tunnelGlow = new THREE.Mesh(new THREE.PlaneGeometry(2600, 2600), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(tgc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); tunnel.add(tunnelGlow);
// wall of speakers (S7b)
const wallRig = new THREE.Group(); scene.add(wallRig);
const wallSpk = buildSpeaker({ res: 0.5, seg: 128, TW: 1024, TH: 256, liq: [0.03, 1 / 200, 0.25, 0.35] });
wallSpk.setDamage({ cut: 1, open: 1, cracks: 1, holes: 3, light: 1 });
wallSpk.mat.side = THREE.BackSide;    // the lathe faces the camera with its back side; DoubleSide x15 costs ~14 s/frame in SwiftShader
const wallCells = [];
for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
  const g = wallSpk.group.clone(); g.scale.setScalar(0.47); g.position.set((c - 1) * 340, (2 - r) * 340, 0);
  g.rotation.z = (r * 3 + c) * 0.9; wallRig.add(g); wallCells.push(g);
}
// title 「失真」 (S8)
const fA = await opentype.load('./fonts/noto-serif-sc-115-900.otf'), fB = await opentype.load('./fonts/noto-serif-sc-117-900.otf');
const title = new THREE.Group(); scene.add(title);
const titleMat = chrome({ roughness: 0.035, envMap: SKY }, [0.2, 1 / 210, 0.25, 0.6]);
{
  const size = 300, gA = glyphShapes(fA, '失', size), gB = glyphShapes(fB, '真', size);
  const opts = { depth: 44, bevelEnabled: true, bevelThickness: 12, bevelSize: 6.5, bevelSegments: 8, curveSegments: 16 };
  const mA = new THREE.Mesh(new THREE.ExtrudeGeometry(gA.shapes, opts), titleMat), mB = new THREE.Mesh(new THREE.ExtrudeGeometry(gB.shapes, opts), titleMat);
  mB.position.x = gA.advance + 18; const inner = new THREE.Group(); inner.add(mA, mB); title.add(inner);
  const box = new THREE.Box3().setFromObject(inner), c = box.getCenter(new THREE.Vector3());
  inner.position.set(-c.x, -c.y, -box.max.z);
}

// place a group: local pivot point (x,y) lands on screen (px,py), with scale s and euler rotation
function place(g, { s = 1, rx = 0, ry = 0, rz = 0, px = 540, py = 960, pivot = [0, 0], z = 0 }) {
  g.scale.setScalar(s); g.rotation.set(rx, ry, rz);
  const pv = new THREE.Vector3(pivot[0], pivot[1], 0).multiplyScalar(s).applyEuler(g.rotation);
  g.position.copy(P(px, py, z)).sub(pv);
}
const SLASH_MID = [(SLASH.a.x + SLASH.b.x) / 2, (SLASH.a.y + SLASH.b.y) / 2];
const SLASH_ANG = Math.atan2(SLASH.b.y - SLASH.a.y, SLASH.b.x - SLASH.a.x);
const coneH = r => r < 70 ? -112 + 40 * Math.sqrt(1 - (r / 70) ** 2) : r < 76 ? -115 : r < 252 ? -116 + 116 * Math.pow((r - 76) / 176, 1.55) : 20;

// blade along the slash: u in [-0.25, 1.25] (0..1 = across the cone)
const bladeGhosts = [0.4, 0.18].map(op => { const m = blade.clone(); m.material = blade.material.clone(); m.material.transparent = true; m.material.opacity = op; m.material.depthWrite = false; rig.add(m); return m; });
function placeBlade(m, u) {
  const x = lerp(SLASH.a.x, SLASH.b.x, u), y = lerp(SLASH.a.y, SLASH.b.y, u), r = Math.hypot(x, y);
  const lean = 0.62, yax = new THREE.Vector2(-Math.sin(SLASH_ANG), Math.cos(SLASH_ANG));
  m.quaternion.setFromEuler(new THREE.Euler(0, 0, SLASH_ANG)); m.rotateX(lean);
  const off = 75 * Math.cos(lean), dz = 75 * Math.sin(lean);
  m.position.set(x + yax.x * off, y + yax.y * off, Math.max(coneH(Math.min(r, 251)), -110) + dz - 6);
}
function bladeAt(u, du = 0.07) {
  placeBlade(blade, u); bladeGhosts.forEach((g, i) => { g.visible = blade.visible; placeBlade(g, u - du * (i + 1)); });
}

// ───────────── SVG overlay
const NS = 'http://www.w3.org/2000/svg';
const el = (p, tag, a = {}, txt) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (txt !== undefined) e.textContent = txt; p.appendChild(e); return e; };
const set = (e, a) => { for (const k in a) e.setAttribute(k, a[k]); };
const under = document.getElementById('under'), over = document.getElementById('over');
const ud = el(under, 'defs');
const hz = el(ud, 'radialGradient', { id: 'haze', cx: '50%', cy: '46%', r: '55%' });
el(hz, 'stop', { offset: 0, 'stop-color': '#2a2b2e' }); el(hz, 'stop', { offset: 0.55, 'stop-color': '#0d0d0f' }); el(hz, 'stop', { offset: 1, 'stop-color': '#050506' });
el(under, 'rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#haze)' });
const blurF = el(ud, 'filter', { id: 'soft', x: '-50%', y: '-50%', width: '200%', height: '200%' }); el(blurF, 'feGaussianBlur', { stdDeviation: 70 });
const blob = el(under, 'ellipse', { cx: 600, cy: 900, rx: 260, ry: 100, fill: '#c8ff1e', opacity: 0.0, filter: 'url(#soft)' });
const gridG = el(under, 'g', { stroke: '#ffffff', 'stroke-opacity': 0.05, 'stroke-width': 1 });
for (let i = 0; i <= 12; i++) { const x = 70 + i * (940 / 12); el(gridG, 'line', { x1: x, y1: 0, x2: x, y2: H }); }
for (let y = 160; y < H; y += 160) el(gridG, 'line', { x1: 0, y1: y, x2: W, y2: y });

// clipped flat headline (dates / DISTORTION): text clipped between two acid rails, ghost outline outside
function makeHeadline(id) {
  const g = el(under, 'g', { opacity: 0 });
  const cp = el(ud, 'clipPath', { id: id + 'in' }); const cr = el(cp, 'rect', { x: 0, y: 0, width: W, height: 0 });
  const co = el(ud, 'clipPath', { id: id + 'out' }); const co1 = el(co, 'rect', { x: 0, y: 0, width: W, height: 0 }); const co2 = el(co, 'rect', { x: 0, y: 0, width: W, height: 0 });
  const attrs = { style: "font-family:'Big Shoulders Display';font-weight:900", 'text-anchor': 'middle' };
  const tIn = el(g, 'text', Object.assign({ fill: '#c3c4c7', 'clip-path': `url(#${id}in)` }, attrs));
  const tOut = el(g, 'text', Object.assign({ fill: 'none', stroke: '#e6e7e9', 'stroke-opacity': 0.35, 'stroke-width': 1.2, 'clip-path': `url(#${id}out)` }, attrs));
  const r1 = el(g, 'line', { x1: 70, x2: 1010, stroke: '#c8ff1e', 'stroke-width': 2 }), r2 = el(g, 'line', { x1: 70, x2: 1010, stroke: '#c8ff1e', 'stroke-width': 2 });
  const l1 = el(g, 'text', { x: 1010, 'text-anchor': 'end', fill: '#c8ff1e', 'font-size': 11, 'letter-spacing': 1.3 }, '+ RAIL');
  const l2 = el(g, 'text', { x: 1010, 'text-anchor': 'end', fill: '#c8ff1e', 'font-size': 11, 'letter-spacing': 1.3 }, '− RAIL');
  // state: text, baseline y, size, rails (top,bot), squash, opacity, fit width
  return (st) => {
    if (!st || st.op <= 0) { set(g, { opacity: 0 }); return; }
    const { text, y, size, top, bot, op = 1, sy = 1, fit } = st;
    for (const t of [tIn, tOut]) { t.textContent = text; set(t, { x: 540, y, 'font-size': size, transform: `translate(0 ${y}) scale(1 ${sy}) translate(0 ${-y})` }); if (fit) set(t, { textLength: fit, lengthAdjust: 'spacingAndGlyphs' }); else { t.removeAttribute('textLength'); } }
    set(cr, { y: top, height: Math.max(0, bot - top) });
    set(co1, { y: y - size, height: Math.max(0, top - (y - size)) }); set(co2, { y: bot, height: size * 0.25 });
    set(r1, { y1: top, y2: top }); set(r2, { y1: bot, y2: bot });
    set(l1, { y: top - 8 }); set(l2, { y: bot + 18 });
    set(g, { opacity: op });
  };
}
const headDate = makeHeadline('hd'), headBig = makeHeadline('hb'), headFinal = makeHeadline('hf');

// HUD (over)
const od = el(over, 'defs');
const gf = el(od, 'filter', { id: 'glint', x: '-100%', y: '-100%', width: '300%', height: '300%' }); el(gf, 'feGaussianBlur', { stdDeviation: 3, result: 'b' });
const gm = el(gf, 'feMerge'); el(gm, 'feMergeNode', { in: 'b' }); el(gm, 'feMergeNode', { in: 'SourceGraphic' });
const mono = (p, x, y, s, o = {}) => el(p, 'text', Object.assign({ x, y, 'font-size': 13, fill: '#a9aaad', 'letter-spacing': 1.3 }, o), s);
const hud = el(over, 'g');
for (const [x, y] of [[40, 40], [1040, 40], [40, 1880], [1040, 1880]]) {
  el(hud, 'path', { d: `M${x - 12} ${y}H${x + 12}M${x} ${y - 12}V${y + 12}`, stroke: '#8d8e91', 'stroke-width': 1 });
  el(hud, 'circle', { cx: x, cy: y, r: 5, fill: 'none', stroke: '#8d8e91', 'stroke-width': 1 });
}
mono(hud, 70, 104, 'DST—01', { fill: '#e6e7e9', 'font-weight': 700, 'font-size': 15 });
mono(hud, 160, 104, '失真 / DISTORTION / SIGNAL CHAIN STUDY', { 'font-family': "'JetBrains Mono','Noto Serif SC'" });
const chainT = mono(hud, 70, 128, 'GTR → AMP → CONE → TAPE');
const gainBox = el(hud, 'rect', { x: 836, y: 88, width: 174, height: 24, fill: '#c8ff1e' });
const gainT = mono(hud, 846, 105, 'GAIN  +34 dB', { fill: '#050506', 'font-weight': 700, 'font-size': 14 });
const tcT = mono(hud, 1010, 136, '00:00:00', { 'text-anchor': 'end' });
el(hud, 'line', { x1: 70, y1: 150, x2: 1010, y2: 150, stroke: '#ffffff', 'stroke-opacity': 0.25 });
el(hud, 'text', { x: 0, y: 0, 'font-size': 11, fill: '#7d7e81', 'letter-spacing': 3, transform: 'translate(44 1180) rotate(-90)' }, 'BROKEN SPEAKERS — FUZZ — OVERDRIVE — 1951 → 1964');
// bottom ruler: the history log (micro-type only in the bottom 300 px)
const FY = 1700;
el(hud, 'line', { x1: 70, y1: FY - 40, x2: 1010, y2: FY - 40, stroke: '#ffffff', 'stroke-opacity': 0.25 });
const STOPS = [[70, '1951', 'ROCKET 88', 'DAMAGED AMP', S.y51], [305, '1958', 'RUMBLE', 'PENCIL HOLES', S.y58], [540, '1962', 'FZ-1', 'FUZZ IN A BOX', S.y62], [775, '1964', 'YOU REALLY GOT ME', 'RAZOR · CONE', S.y64]];
const stopEls = STOPS.map(([x, y1, a, b]) => ({
  tick: el(hud, 'line', { x1: x, y1: FY - 40, x2: x, y2: FY - 28, stroke: '#e6e7e9', 'stroke-width': 2 }),
  yr: mono(hud, x, FY - 6, y1, { fill: '#6c6d70', 'font-weight': 700, 'font-size': 15 }),
  a: mono(hud, x, FY + 14, a, { 'font-size': 11, fill: '#6c6d70' }), b: mono(hud, x, FY + 30, b, { 'font-size': 10, fill: '#4d4e51' }),
}));
const playhead = el(hud, 'rect', { x: 70, y: FY - 44, width: 3, height: 20, fill: '#c8ff1e' });
const tg = el(hud, 'g', { stroke: '#8d8e91', 'stroke-width': 1 });
for (let i = 0; i <= 94; i++) { const x = 70 + i * 10; el(tg, 'line', { x1: x, y1: 1790, x2: x, y2: 1790 + (i % 10 === 0 ? 14 : i % 5 === 0 ? 9 : 5) }); }
mono(hud, 70, 1832, 'DST—01 · ACID GRAPHICS · 1080×1920 · 30 FPS · 160 BPM', { 'font-size': 10, fill: '#6c6d70' });
const frameT = mono(hud, 1010, 1832, 'F 0000', { 'font-size': 10, fill: '#6c6d70', 'text-anchor': 'end' });

// scene micro labels (staggered in)
const labG = el(over, 'g');
const labs = [mono(labG, 70, 470, ''), mono(labG, 70, 490, ''), mono(labG, 70, 510, '')];
// S2 explainer: rails across the wave + harmonic bars
const s2 = el(over, 'g', { opacity: 0 });
const wr1 = el(s2, 'line', { x1: 0, x2: W, stroke: '#c8ff1e', 'stroke-width': 2 }), wr2 = el(s2, 'line', { x1: 0, x2: W, stroke: '#c8ff1e', 'stroke-width': 2 });
const wl1 = mono(s2, 1010, 0, '+ RAIL', { 'text-anchor': 'end', fill: '#c8ff1e', 'font-size': 12 }), wl2 = mono(s2, 1010, 0, '− RAIL', { 'text-anchor': 'end', fill: '#c8ff1e', 'font-size': 12 });
mono(s2, 70, 1330, 'HARMONICS', { 'font-size': 11, fill: '#e6e7e9', 'font-weight': 700 });
const bars = [1, 3, 5, 7, 9, 11, 13].map((h, i) => ({ r: el(s2, 'rect', { x: 70 + i * 26, y: 1450, width: 14, height: 0, fill: i ? '#e6e7e9' : '#c8ff1e' }), t: mono(s2, 70 + i * 26, 1470, String(h), { 'font-size': 10 }) }));
const inT = mono(s2, 70, 1290, 'IN  · SINE', { 'font-size': 12, fill: '#e6e7e9' });
// final line
const fin = el(over, 'g', { opacity: 0 });
const LINE = '失真，是最真的声音', lineChars = [...LINE].map((ch, i) => el(fin, 'text', { x: 540 + (i - (LINE.length - 1) / 2) * 52, y: 1290, 'text-anchor': 'middle', 'font-family': "'Noto Serif SC'", 'font-weight': 700, 'font-size': 46, fill: '#e6e7e9', opacity: 0 }, ch));
const finEn = mono(fin, 540, 1336, 'THE TRUEST SOUND IS THE BROKEN ONE', { 'text-anchor': 'middle', 'font-size': 13, fill: '#a9aaad', opacity: 0, 'letter-spacing': 3 });
// T7 clip mask (everything outside the rails goes black) + rails
const mask = el(over, 'g', { opacity: 0 });
const mTop = el(mask, 'rect', { x: 0, y: 0, width: W, height: 0, fill: '#050506' }), mBot = el(mask, 'rect', { x: 0, y: H, width: W, height: 0, fill: '#050506' });
const mr1 = el(mask, 'line', { x1: 0, x2: W, stroke: '#c8ff1e', 'stroke-width': 2.5 }), mr2 = el(mask, 'line', { x1: 0, x2: W, stroke: '#c8ff1e', 'stroke-width': 2.5 });
const flash = el(over, 'rect', { x: 0, y: 0, width: W, height: H, fill: '#e9ffb0', opacity: 0 });
const sparkG = el(over, 'g');
const glint = (x, y, r, op) => { const k = 0.11; return el(sparkG, 'path', { d: `M0 ${-r} L${r * k} ${-r * k} L${r} 0 L${r * k} ${r * k} L0 ${r} L${-r * k} ${r * k} L${-r} 0 L${-r * k} ${-r * k} Z`, fill: '#fff', opacity: op, filter: 'url(#glint)', transform: `translate(${x} ${y})` }); };

// ───────────── post: grain, bloom, fringe, slice glitch
const grainC = document.createElement('canvas'); grainC.width = 1200; grainC.height = 2040;
{ const g = grainC.getContext('2d'), img = g.createImageData(1200, 2040), rnd = mulberry32(7); for (let i = 0; i < 1200 * 2040; i++) { const v = 128 + (rnd() + rnd() + rnd() - 1.5) * 70; img.data[4 * i] = img.data[4 * i + 1] = img.data[4 * i + 2] = v; img.data[4 * i + 3] = 255; } g.putImageData(img, 0, 0); }
const grainCtx = document.getElementById('grain').getContext('2d');
const post = document.getElementById('post'), postCtx = post.getContext('2d');
const bloomCtx = document.getElementById('bloom').getContext('2d');
const q4 = document.createElement('canvas'); q4.width = W / 4; q4.height = H / 4; const q4x = q4.getContext('2d', { willReadFrequently: true });
const fr1 = document.createElement('canvas'); fr1.width = W; fr1.height = H; const fr1x = fr1.getContext('2d');
const fr2 = document.createElement('canvas'); fr2.width = W; fr2.height = H; const fr2x = fr2.getContext('2d');
function bloom(src, strength = 0.6, thresh = 0.86, fringe = 0.45) {
  q4x.clearRect(0, 0, W / 4, H / 4); q4x.drawImage(src, 0, 0, W / 4, H / 4);
  const d = q4x.getImageData(0, 0, W / 4, H / 4), a = d.data;
  for (let i = 0; i < a.length; i += 4) { const l = (0.2126 * a[i] + 0.7152 * a[i + 1] + 0.0722 * a[i + 2]) / 255, k = Math.max(0, (l - thresh) / (1 - thresh)) * a[i + 3] / 255; a[i] *= k; a[i + 1] *= k; a[i + 2] *= k; a[i + 3] = 255; }
  q4x.putImageData(d, 0, 0);
  bloomCtx.clearRect(0, 0, W, H); bloomCtx.globalAlpha = strength;
  bloomCtx.filter = 'blur(10px)'; bloomCtx.drawImage(q4, 0, 0, W, H); bloomCtx.filter = 'blur(34px)'; bloomCtx.drawImage(q4, 0, 0, W, H);
  bloomCtx.filter = 'none';
  for (const [col, dx] of [['#ff0000', -2.5], ['#0000ff', 2.5]]) {
    fr1x.globalCompositeOperation = 'source-over'; fr1x.fillStyle = '#000'; fr1x.fillRect(0, 0, W, H); fr1x.drawImage(src, 0, 0);
    fr1x.globalCompositeOperation = 'multiply'; fr1x.fillStyle = col; fr1x.fillRect(0, 0, W, H);
    fr2x.globalCompositeOperation = 'source-over'; fr2x.clearRect(0, 0, W, H); fr2x.drawImage(fr1, 0, 0); fr2x.globalCompositeOperation = 'difference'; fr2x.drawImage(fr1, dx, 0);
    bloomCtx.globalAlpha = fringe; bloomCtx.drawImage(fr2, 0, 0);
  }
  bloomCtx.globalAlpha = 1;
}

// ───────────── renderAt(t)
const FPS = 30;
const show = (o, v) => { o.visible = v; };
function setLabels(t, t0, lines, y0 = 470) {
  labs.forEach((e, i) => { const k = seg(t, t0 + 0.12 + i * 0.07, t0 + 0.3 + i * 0.07); e.textContent = lines[i] || ''; set(e, { opacity: k, x: 70 + (1 - k) * -12, y: y0 + 20 * i }); });
}

window.renderAt = function (t) {
  const f = Math.round(t * FPS);
  LIQ.uTime.value = t;
  const kick = Math.max(pulse(t, HITS, 0.14), 0.45 * pulse(t, KICK16, 0.05));
  LIQ.uKick.value = kick;
  let shake = [0, 0], glitch = 0, flashOp = 0;
  const rs = mulberry32(f * 7 + 3);
  // hide everything, then switch on per scene
  [rig, wave.mesh, pedal.group, tunnel, wallRig, title].forEach(o => show(o, false));
  show(blade, false); show(pencil, false); show(ioWaves, false); bladeGhosts.forEach(g => show(g, false));
  limeLight.intensity = 0; scene.environmentRotation.set(0, 0, 0);
  headDate(null); headBig(null); headFinal(null); set(s2, { opacity: 0 }); set(fin, { opacity: 0 }); set(mask, { opacity: 0 });
  sparkG.replaceChildren(); set(blob, { opacity: 0 });
  let labelSet = null;

  // ── S1 HOOK 0–2.25
  if (t < S.clip) {
    show(rig, true); show(thorns.group, true);
    const cutP = easeInOut(seg(t, 0.02, 0.34));
    const open = smooth(seg(t, 0.06, 0.5)) * (1 + 0.25 * pulse(t, [S.slam], 0.2));
    const light = smooth(seg(t, 0.2, 0.7)) * (1 + 0.8 * pulse(t, [S.slam], 0.25));
    spk.setDamage({ cut: cutP, open: Math.min(open, 1.25), cracks: 0, holes: 0, light });
    if (t < 0.5) { show(blade, true); bladeAt(lerp(-0.08, 1.45, easeInOut(seg(t, -0.06, 0.42)))); }
    let s, pv, px, py, rz = 0, rx = -0.1, ry = 0.12;
    if (t < S.slam) { s = lerp(2.7, 2.9, t / S.slam); pv = SLASH_MID; px = 540; py = 960; }
    else if (t < 1.85) {
      const k = spring(seg(t, S.slam, S.slam + 0.7), 1.4, 5.0);
      s = lerp(2.9, 1.0, k) + 0.04 * seg(t, 1.2, 1.85); pv = [lerp(SLASH_MID[0], 0, k), lerp(SLASH_MID[1], 0, k)]; px = 540; py = lerp(960, 868, k);
      rx = lerp(-0.1, -0.16, k); ry = lerp(0.12, 0.24, k);
    } else {
      const k = easeIn(seg(t, 1.85, S.clip));
      s = lerp(1.04, 16, k); pv = [lerp(0, SLASH_MID[0], smooth(seg(t, 1.85, 2.05))), lerp(0, SLASH_MID[1], smooth(seg(t, 1.85, 2.05)))];
      px = 540; py = lerp(868, 960, smooth(seg(t, 1.85, 2.1))); rz = -SLASH_ANG * smooth(seg(t, 1.85, 2.15)); rx = lerp(-0.16, 0, k); ry = lerp(0.24, 0, k);
    }
    place(rig, { s, rx, ry, rz, px, py, pivot: pv });
    thorns.setGrow(seg(t, S.slam, S.slam + 0.8), t);
    const sh = 16 * pulse(t, [S.slam], 0.09); shake = [(rs() - 0.5) * sh, (rs() - 0.5) * sh];
    flashOp = 0.18 * pulse(t, [S.slam], 0.05) + 0.35 * smooth(seg(t, 2.15, S.clip));
    set(blob, { opacity: 0.08 * light });
    if (t >= S.slam + 0.15 && t < 1.85) { glint(272, 664, 30 * smooth(seg(t, 0.95, 1.2)), 0.9); glint(842, 600, 20 * smooth(seg(t, 1.05, 1.3)), 0.85); }
  }
  // ── S2 CLIP 2.25–5.25
  else if (t < S.y51) {
    show(wave.mesh, true);
    const A = 230 * easeOut(seg(t, S.clip, S.clip + 0.55));
    const railSteps = [[S.clip, 330], [TB(2, 8), 235], [TB(2, 12), 190], [TB(3), 158], [TB(3, 4), 128], [TB(3, 8), 110]];
    let rail = 330; for (let i = 1; i < railSteps.length; i++) { const [tt, v] = railSteps[i]; if (t >= tt) rail = lerp(railSteps[i - 1][1], v, easeOutBack(seg(t, tt, tt + 0.14), 2.2)); }
    if (t >= TB(3, 8)) rail = 110;
    const curl = easeInOut(seg(t, 4.55, S.y51));
    const clip = Math.min(1, rail / Math.max(1, A));
    wave.update({ A: A * (1 - 0.8 * curl), clip: lerp(clip, 1, curl), phase: -t * 7.0, curl, R: 336, radius: 6.5, soft: 0.1 });
    waveMat.emissiveIntensity = 1.6 * (1 - smooth(seg(t, S.clip, S.clip + 0.5)));
    wave.mesh.position.copy(P(540, lerp(960, 868, curl)));
    wave.mesh.scale.setScalar(1);
    // big flat CLIP behind the wave, cut by the same rails
    const ry0 = 960, cOp = 1 - smooth(seg(t, 4.5, 4.9));
    headBig({ text: 'CLIP', y: ry0 + 205, size: 560, top: ry0 - rail, bot: ry0 + rail, op: cOp * smooth(seg(t, S.clip + 0.05, S.clip + 0.3)) });
    set(s2, { opacity: 1 - smooth(seg(t, 4.55, 4.9)) });
    set(wr1, { y1: ry0 - rail, y2: ry0 - rail }); set(wr2, { y1: ry0 + rail, y2: ry0 + rail });
    set(wl1, { y: ry0 - rail - 8 }); set(wl2, { y: ry0 + rail + 18 });
    const sat = clamp((A - rail) / 160);       // how hard it clips
    bars.forEach((b, i) => { const hgt = i === 0 ? 90 : 90 * sat * Math.pow(0.72, i - 1) / 1.0; set(b.r, { y: 1450 - hgt, height: hgt }); });
    inT.textContent = sat > 0.05 ? 'OUT · CLIPPED → SQUARE' : 'IN  · SINE';
    labelSet = [S.clip, ['SIGNAL > RAIL = CLIPPED', 'FLAT TOPS → ODD HARMONICS', 'THE SOUND OF OVERLOAD']];
    flashOp = 0.3 * (1 - seg(t, S.clip, S.clip + 0.07));
    if (curl > 0) { show(rig, curl > 0.97); }
    if (curl > 0.97) { spk.setDamage({}); thorns.setGrow(0); place(rig, { s: 1, px: 540, py: 868 }); }
    set(blob, { opacity: 0.05 * sat });
  }
  // ── S3 1951 5.25–8.25
  else if (t < S.y58) {
    show(rig, true); show(thorns.group, false);
    const turn = easeInOut(seg(t, S.y51, S.y51 + 0.7));
    let py = lerp(868, 880, turn), rz = 0, sy = 1;
    const jolt = easeOut(seg(t, 6.0, 6.28)), fall = easeIn(seg(t, 6.28, S.land));
    py -= 46 * jolt * (1 - fall); py += 120 * fall; rz += 0.07 * jolt * (1 - 0.6 * fall);
    const land = seg(t, S.land, S.land + 0.6);
    if (t >= S.land) { py = lerp(1000, 960, easeOut(land)); rz = 0.028 * Math.exp(-6 * land) * Math.cos(12 * land); sy = 1 - 0.05 * Math.exp(-7 * land) * Math.cos(16 * land); }
    place(rig, { s: 0.98, rx: lerp(0, -0.17, turn), ry: lerp(0, 0.34, turn), rz, px: 540, py });
    rig.scale.y *= sy;
    const cracks = easeOut(seg(t, S.land, S.land + 0.24));
    spk.setDamage({ cracks, light: 0.55 + 0.6 * pulse(t, [S.land], 0.3) });
    const sh = 22 * pulse(t, [S.land], 0.08); shake = [(rs() - 0.5) * sh, (rs() - 0.5) * sh];
    if (t < S.y51 + 0.25) { const k = 1 - seg(t, S.y51, S.y51 + 0.25); show(wave.mesh, true); wave.update({ A: 0, clip: 1, curl: 1, R: 336, radius: 6.5 * k + 0.01 }); wave.mesh.position.copy(P(540, 868)); }
    headDate(dateState(t, S.y51, S.y58, '1951'));
    labelSet = [S.y51, ['ROCKET 88 · JACKIE BRENSTON & HIS DELTA CATS', 'GUITAR AMP DAMAGED ON THE ROAD → CONE BURST', 'STUFFED WITH PAPER · RECORDED ANYWAY']];
    flashOp = 0.12 * pulse(t, [S.land], 0.06);
  }
  // ── S4 1958 8.25–11.25
  else if (t < S.y62) {
    show(rig, true);
    glitch = pulse(t, [S.y58], 0.05) > 0.2 ? 1 : 0;
    const whip = easeOut(seg(t, S.y58, S.y58 + 0.35));
    let s = 1.0, px = 540, py = 960, pv = [0, 0], ry = lerp(0.34, -0.3, whip), rx = -0.17;
    // T4 zoom into the last hole
    const z = easeIn(seg(t, 10.85, S.y62));
    if (z > 0) { s = lerp(1.0, 34, z); pv = [HOLES[2].x * smooth(seg(t, 10.85, 11.0)), HOLES[2].y * smooth(seg(t, 10.85, 11.0))]; ry = lerp(ry, 0, z); rx = lerp(rx, 0, z); py = lerp(960, 900, z); }
    place(rig, { s, rx, ry, px, py, pivot: pv });
    let holes = 0; JABS.forEach((j, i) => { holes = Math.max(holes, i + easeOut(seg(t, j, j + 0.06))); if (t < j) holes = Math.min(holes, i); });
    spk.setDamage({ cracks: 1, holes, light: 0.7 + 0.7 * pulse(t, JABS, 0.2) });
    // pencil
    const ji = JABS.findIndex(j => t < j + 0.22);
    if (ji >= 0 && t > S.y58 + 0.12 && z === 0) {
      show(pencil, true);
      const j = JABS[ji], h = HOLES[ji], r = Math.hypot(h.x, h.y);
      const inK = easeIn(seg(t, j - 0.16, j)), outK = easeOut(seg(t, j + 0.05, j + 0.22));
      const dist = t < j ? lerp(340, 0, inK) : lerp(0, 300, outK);
      const prev = ji > 0 ? HOLES[ji - 1] : new THREE.Vector2(160, 260);
      const mv = smooth(seg(t, (ji > 0 ? JABS[ji - 1] + 0.22 : S.y58 + 0.12), j - 0.16));
      const hx = lerp(prev.x, h.x, mv), hy = lerp(prev.y, h.y, mv);
      pencil.quaternion.setFromEuler(new THREE.Euler(-0.95, 0.62, 0));
      const axis = new THREE.Vector3(0, 0, 1).applyQuaternion(pencil.quaternion);
      pencil.position.set(hx, hy, coneH(r)).addScaledVector(axis, dist);
    }
    const sh = 10 * pulse(t, JABS, 0.06); shake = [(rs() - 0.5) * sh, (rs() - 0.5) * sh];
    headDate(dateState(t, S.y58, S.y62 - 0.4, '1958'));
    labelSet = [S.y58, ['RUMBLE · LINK WRAY', 'HOLES PUNCHED IN THE SPEAKER WITH A PENCIL', 'DAMAGE ON PURPOSE']];
    flashOp = 0.2 * smooth(seg(t, 11.12, S.y62));
  }
  // ── S5 1962 11.25–14.25
  else if (t < S.y64) {
    show(pedal.group, true);
    const out = easeOut(seg(t, S.y62, S.y62 + 0.9));
    const push = easeIn(seg(t, 13.9, S.y64));
    const knobLocal = [0, 150];
    let s = lerp(4.3, 1.0, out), rx = lerp(0, -0.42, out), ry = lerp(0, 0.2, out), pv = knobLocal, px = 540, py = lerp(900, 860, out);
    pv = [knobLocal[0] * (1 - out), knobLocal[1] * (1 - out)];
    if (push > 0) { s = lerp(1.0, 2.5, push); pv = [lerp(pv[0], knobLocal[0], push), lerp(pv[1], knobLocal[1], push)]; rx = lerp(rx, 0, push); ry = lerp(ry, 0, push); py = lerp(py, 868, push); }
    place(pedal.group, { s, rx, ry, px, py, pivot: pv, z: -105 * s });
    const turn = easeInOut(seg(t, 11.9, 13.85));
    pedal.knob.rotation.z = -(-135 + 270 * turn) * Math.PI / 180;
    pedal.drawFace(turn);
    const stomp = pulse(t, [11.625], 0.06);
    pedal.sw.position.z = -8 * stomp; led.visible = t >= 11.625;
    limeLight.intensity = 1.6 * turn * (1 + 0.5 * kick); limeLight.position.copy(pedal.group.position).add(new THREE.Vector3(260, 300, 420));
    headDate(dateState(t, S.y62, S.y64 - 0.35, '1962'));
    labelSet = [S.y62, ['MAESTRO FZ-1 FUZZ-TONE', 'THE SOUND OF DAMAGE, SOLD IN A BOX', `KNOB → ${Math.round(turn * 10)} / 10`]];
    flashOp = 0.2 * (1 - seg(t, S.y62, S.y62 + 0.07));
    set(blob, { opacity: 0.09 * turn });
  }
  // ── S6 1964 14.25–17.25
  else if (t < S.dive) {
    show(rig, true); show(thorns.group, true);
    const back = spring(seg(t, S.y64, S.y64 + 0.6), 1.2, 5.5);
    const bladeU = seg(t, 14.62, 14.95), cutP = easeInOut(bladeU);
    const open = smooth(seg(t, 14.68, 15.1)) * (1 + 0.2 * pulse(t, [TB(10, 8)], 0.2));
    spk.setDamage({ cut: cutP, open, cracks: 1, holes: 3, light: 0.75 + 0.6 * smooth(seg(t, 14.7, 15.1)) + 0.5 * pulse(t, [TB(10, 8)], 0.25) });
    if (t > 14.55 && t < 15.05) { show(blade, true); bladeAt(lerp(-0.35, 1.45, easeInOut(seg(t, 14.58, 15.02)))); }
    let s = lerp(3.0, 1.0, back), rx = lerp(0, -0.16, back), ry = lerp(0, 0.24, back), pv = [0, 0], px = 540, py = 868, rz = 0;
    const z = easeIn(seg(t, 16.85, S.dive));
    if (z > 0) { s = lerp(1.0, 16, z); pv = [SLASH_MID[0] * smooth(seg(t, 16.85, 17.05)), SLASH_MID[1] * smooth(seg(t, 16.85, 17.05))]; py = lerp(868, 960, smooth(seg(t, 16.85, 17.1))); rz = -SLASH_ANG * smooth(seg(t, 16.85, 17.15)); rx = lerp(rx, 0, z); ry = lerp(ry, 0, z); }
    place(rig, { s, rx, ry, rz, px, py, pivot: pv });
    thorns.setGrow(seg(t, TB(10, 8), TB(10, 8) + 0.9), t);
    show(ioWaves, t > TB(10, 8)); ioWaves.scale.set(1, smooth(seg(t, TB(10, 8), TB(10, 8) + 0.3)) + 0.001, 1);
    const sh = 12 * pulse(t, [TB(10, 8)], 0.08); shake = [(rs() - 0.5) * sh, (rs() - 0.5) * sh];
    headDate(dateState(t, S.y64, 16.7, '1964'));
    labelSet = [S.y64, ['YOU REALLY GOT ME · THE KINKS', 'DAVE DAVIES SLASHES HIS AMP’S CONE WITH A RAZOR', 'THE RIFF THAT TAUGHT ROCK TO GROWL'], 1410];   // below the speaker: the thorns fill the upper band
    flashOp = 0.35 * smooth(seg(t, 17.15, S.dive));
    set(blob, { opacity: 0.07 });
    if (t > 15.3 && t < 16.8) { glint(272, 664, 30, 0.9); glint(842, 600, 20, 0.85); }
  }
  // ── S7a DIVE 17.25–18.75
  else if (t < S.wall) {
    show(tunnel, true);
    const k = seg(t, S.dive, S.wall), speed = 5200;
    tunnel.position.set(0, 0, 0); tunnel.rotation.set(0, 0, 0.6 * k);
    tunnel.children.forEach((r, i) => {
      if (r === grid || r === tunnelGlow) return;
      let z = -((i * RSP - (t - S.dive) * speed) % (RINGS * RSP) + RINGS * RSP) % (RINGS * RSP);
      r.position.set(60 * Math.sin(z / 900 + t), 40 * Math.cos(z / 1100), z + 1800);
      const pk = 1 + 0.05 * pulse(t, KICK16, 0.05); r.scale.setScalar(pk * lerp(1, 1.9, easeIn(seg(t, 18.4, S.wall))));
    });
    grid.position.z = 1800 + ((t - S.dive) * speed) % 260; grid.rotation.z = -0.3 * k;
    gridMat.opacity = 0.5 * (1 - smooth(seg(t, 18.4, S.wall)));
    tunnelGlow.position.z = -7000; tunnelGlow.material.color.setScalar(0.55 + 0.45 * k);
    flashOp = 0.3 * (1 - seg(t, S.dive, S.dive + 0.07)) + 0.3 * smooth(seg(t, 18.6, S.wall));
  }
  // ── S7b WALL 18.75–24.75
  else if (t < S.fin) {
    show(wallRig, true);
    const k = seg(t, S.wall, S.fin), arrive = easeOut(seg(t, S.wall, S.wall + 0.7)), build = easeIn(seg(t, S.build, S.fin));
    const s = lerp(1.6, 1.0, arrive) * (1 + 0.22 * build);
    place(wallRig, { s, rx: -0.2 + 0.08 * k, ry: 0.28 - 0.4 * k, px: 540, py: 900 });
    wallCells.forEach((g, i) => { const ph = pulse(t, KICK16, 0.05) * (0.6 + 0.4 * ((i * 7) % 3) / 2); g.position.z = 18 * ph; });
    scene.environmentRotation.set(0, (t - S.wall) * 0.5 + (t > S.solo ? Math.sin((t - S.solo) * 2.2) * 0.6 : 0), 0);
    const sh = 5 * pulse(t, KICK16, 0.04) + 6 * build; shake = [(rs() - 0.5) * sh, (rs() - 0.5) * sh];
    flashOp = 0.3 * (1 - seg(t, S.wall, S.wall + 0.08));
    // T7: rails close in during the build, slam on the final chord
    const close = easeIn(seg(t, S.build, S.fin));
    const gap = lerp(960, 2, close);
    set(mask, { opacity: build > 0 ? 1 : 0 });
    set(mTop, { y: 0, height: Math.max(0, 960 - gap) }); set(mBot, { y: 960 + gap, height: Math.max(0, 960 - gap) });
    set(mr1, { y1: 960 - gap, y2: 960 - gap }); set(mr2, { y1: 960 + gap, y2: 960 + gap });
    set(blob, { opacity: 0.08 });
  }
  // ── S8 FINAL 24.75–30
  else {
    show(title, true);
    const openK = easeOut(seg(t, S.fin + 0.06, S.fin + 0.7));
    const gap = lerp(2, 960, openK);
    set(mask, { opacity: 1 - smooth(seg(t, S.fin + 0.55, S.fin + 0.9)) });
    set(mTop, { y: 0, height: Math.max(0, 960 - gap) }); set(mBot, { y: 960 + gap, height: Math.max(0, 960 - gap) });
    set(mr1, { y1: 960 - gap, y2: 960 - gap }); set(mr2, { y1: 960 + gap, y2: 960 + gap });
    const settle = seg(t, S.fin, 28.5);
    titleMat.userData.liq.uAmp.value = lerp(0.55, 0.2, easeOut(settle)) - 0.08 * seg(t, 28.5, 30);
    const push = smooth(seg(t, S.fin, 30));
    place(title, { s: lerp(1.12, 1.18, push) * (1 + 0.04 * pulse(t, [S.fin], 0.2)), rx: -0.11, px: 540, py: 900, z: 40 });
    headFinal({ text: 'DISTORTION', y: 430, size: 318, top: lerp(326, 222, easeOutBack(seg(t, 25.2, 25.45), 2)), bot: lerp(326, 404, easeOutBack(seg(t, 25.2, 25.45), 2)), fit: 940, op: smooth(seg(t, 25.15, 25.3)) });
    set(fin, { opacity: 1 });
    lineChars.forEach((e, i) => { const k = seg(t, S.line + i * 0.06, S.line + 0.25 + i * 0.06); set(e, { opacity: k, y: 1290 + 10 * (1 - easeOut(k)) }); });
    set(finEn, { opacity: seg(t, S.line + 0.7, S.line + 1.0) });
    const sh = 20 * pulse(t, [S.fin], 0.1); shake = [(rs() - 0.5) * sh, (rs() - 0.5) * sh];
    flashOp = 0.45 * (1 - seg(t, S.fin, S.fin + 0.08));
    set(blob, { opacity: 0.06 * (1 - 0.5 * seg(t, 28.5, 30)), cy: 900 });
    renderer.toneMappingExposure = lerp(1.05, 0.92, smooth(seg(t, 28.4, 30)));
    if (t > 26.0) { glint(352, 742, 28 * smooth(seg(t, 26.0, 26.4)), 0.9); glint(730, 1080, 20 * smooth(seg(t, 26.3, 26.7)), 0.8); }
    labelSet = null;
  }
  if (t < S.fin) renderer.toneMappingExposure = 1.05;

  // ── HUD
  const g = gainAt(t);
  gainT.textContent = `GAIN  +${String(Math.round(g)).padStart(2, '0')} dB`;
  const secs = Math.floor(t), fr = f % FPS;
  tcT.textContent = `00:00:${String(secs).padStart(2, '0')}:${String(fr).padStart(2, '0')}`;
  frameT.textContent = 'F ' + String(f).padStart(4, '0');
  chainT.textContent = t < S.clip ? 'GTR → AMP → CONE(SLASHED) → TAPE' : t < S.y51 ? 'SINE → GAIN → RAIL → SQUARE' : t < S.y62 ? 'GTR → BROKEN AMP → TAPE' : t < S.y64 ? 'GTR → FUZZ BOX → AMP' : 'GTR → AMP(∞) → WALL';
  STOPS.forEach((st, i) => { const on = t >= st[4], cur = on && (i === 3 ? t < S.dive : t < STOPS[i + 1][4]); const col = cur ? '#c8ff1e' : on ? '#e6e7e9' : '#6c6d70'; set(stopEls[i].yr, { fill: col }); set(stopEls[i].a, { fill: on ? '#a9aaad' : '#5a5b5e' }); set(stopEls[i].tick, { stroke: cur ? '#c8ff1e' : '#e6e7e9' }); });
  const phx = t < S.y51 ? 70 : t < S.y58 ? lerp(70, 305, seg(t, S.y51 + 2.4, S.y58)) : t < S.y62 ? lerp(305, 540, seg(t, S.y58 + 2.4, S.y62)) : t < S.y64 ? lerp(540, 775, seg(t, S.y62 + 2.4, S.y64)) : lerp(775, 1010, seg(t, S.y64 + 2.4, S.fin));
  set(playhead, { x: phx - 1.5 });
  if (labelSet) setLabels(t, labelSet[0], labelSet[1], labelSet[2]); else labs.forEach(e => set(e, { opacity: 0 }));
  set(flash, { opacity: clamp(flashOp, 0, 0.95) });

  // ── render + post
  camera.position.x = shake[0]; camera.position.y = -shake[1];
  renderer.render(scene, camera);
  let src = glCanvas;
  if (glitch) {
    postCtx.clearRect(0, 0, W, H);
    for (let y = 0; y < H;) { const h = 20 + Math.floor(rs() * 140), dx = (rs() - 0.5) * 120 * (rs() > 0.4 ? 1 : 0); postCtx.drawImage(glCanvas, 0, y, W, h, dx, y, W, h); y += h; }
    src = post;
  }
  post.style.visibility = glitch ? 'visible' : 'hidden'; glCanvas.style.visibility = glitch ? 'hidden' : 'visible';
  over.style.transform = glitch ? `translateX(${(rs() - 0.5) * 30}px)` : '';
  bloom(src);
  grainCtx.clearRect(0, 0, W, H); grainCtx.drawImage(grainC, -Math.floor(mulberry32(f + 11)() * 120), -Math.floor(mulberry32(f + 29)() * 120));
};

// date headline state: rails snap in on the scene's downbeat, collapse (clip to nothing) at its end
function dateState(t, t0, t1, text) {
  if (t < t0 || t > t1 + 0.14) return null;
  const inK = easeOutBack(seg(t, t0 + 0.02, t0 + 0.24), 2.4), outK = easeIn(seg(t, t1, t1 + 0.14));
  const mid = 315, half = 92 * inK * (1 - outK);
  return { text, y: 430, size: 340, top: mid - half, bot: mid + half, sy: 1 + 0.18 * (1 - seg(t, t0, t0 + 0.2)), op: 1 };
}

await document.fonts.ready;
await document.fonts.load('900 300px "Big Shoulders Display"', '1951CLIPDISTORTIONFUZZ');
await document.fonts.load('400 13px "JetBrains Mono"', 'GAIN'); await document.fonts.load('700 13px "JetBrains Mono"', 'GAIN');
await document.fonts.load('700 46px "Noto Serif SC"', '失真，是最真的声音');
pedal.drawFace(0, true);
window.renderAt(0);
window.__dbg = { renderer, scene, camera, wallRig, wallCells }; window.__ready = true;
