// 飞升 ASCENSION — palettes, shots and the deterministic window.renderAt(t)
(function () {
const A = window.ASC, W = window.ASC_W, H = window.ASC_H, hx = A.hex;
const TAU = Math.PI * 2;

// ───────── palettes (青绿 + 朱砂 + 金, with magenta / cyan accents)
const GOLD = hx('#ffd98a'), WHITE = hx('#fff6e2');
const RING_JADE = { tube: hx('#1a2a7a'), tubeLit: hx('#ffd08a'), body: hx('#10307a'), bodyDark: hx('#0a0c3c'), bodyLit: hx('#1f7fb0'), gold: hx('#ffd27a'), gem: hx('#ff4a3a'),
  petalA: hx('#ff3b2a'), petalB: hx('#ffb01f'), innerRim: hx('#fff0c8'), spill: hx('#ffc070'), flame: hx('#ff7a2a'), flame2: hx('#ff2f7a') };
const RING_CINNABAR = { ...RING_JADE, body: hx('#7a1022'), bodyDark: hx('#2a0820'), bodyLit: hx('#ff5a3a'), petalA: hx('#ffb02a'), petalB: hx('#ff3f9a'), gem: hx('#28e0ff') };
const RING_GOLD = { ...RING_JADE, body: hx('#6a4a10'), bodyDark: hx('#241030'), bodyLit: hx('#ffcf5a'), petalA: hx('#ffffff'), petalB: hx('#ff7a2a'), gem: hx('#ff2f7a') };
const RING_TEAL = { ...RING_JADE, body: hx('#0b5a5a'), bodyDark: hx('#061a3a'), bodyLit: hx('#31e0c0'), petalA: hx('#7af0ff'), petalB: hx('#ff3b30') };
const PEAK = { rim: hx('#ffd98a'), litFace: hx('#3fd8b0'), top: hx('#127a8a'), mid: hx('#123a7a'), shade: hx('#0c0f40'), low: hx('#0e1048'), base: hx('#0a0828'),
  cun: hx('#8ff0e0'), cun2: hx('#05082a'), mist: hx('#ff8a70'), pine: hx('#06242e'), moss: hx('#127a5a'), wood: hx('#2a1030'), window: hx('#ffb347'),
  roof: hx('#100c34'), gold: GOLD, fall: hx('#9ff6ff') };
const STAIR = { tread: hx('#8a6ab8'), riser: hx('#40389a'), riserTop: hx('#5e4cac'), lip: hx('#ffe6a0'), under: hx('#141245'), rail: hx('#ffd9a0'), lamp: hx('#ffb54a'), ramp: hx('#f2d2b8'), relief: hx('#b0703a') };
const FIG = { figRim: hx('#fff0c0'), figTop: hx('#2a2a6a'), figBot: hx('#16123e'), lining: hx('#ff3b30'), sash: hx('#ff3f8a'), gold: GOLD,
  ribbonA: hx('#ff3b30'), ribbonA2: hx('#ff2f9a'), ribbonB: hx('#2fe6ff'), ribbonB2: hx('#3a6bff') };
const STROKES = [hx('#ff3b30'), hx('#ff8a2a'), hx('#ffd36b'), hx('#21d4e6'), hx('#ff3fa4'), hx('#fff3d6'), hx('#2f6bff'), hx('#18e0b0')];

// ───────── uniforms with sensible defaults
const baseU = () => ({
  time: 0, uSkyTop: hx('#0d1150'), uSkyMid: hx('#7a2f9a'), uSkyHor: hx('#ffb98a'), uHorY: 0.385, uSkyMidY: 0.62,
  uCore: [540, H - 560], uCoreR: 70, uCoreCol: WHITE, uCoreHalo: hx('#ffb27a'), uCoreInt: 1.0, uHaloR: 180,
  uRays: 0.35, uRayRot: 0, uRayN: 10, uStars: 0.6, uStroke: 1.0, uStrokeDir: [0.94, 0.34],
  clouds: [{ type: 0 }, { type: 0 }],
  bloomThr: 0.9, uBloom: 0.65, uCA: 0.7, uGrain: 0.055, uHalf: 0.5, uVig: 0.55, uExpo: 1.7, uSat: 1.28, uFlash: 0,
  uFlashCol: WHITE, uVigCol: hx('#1a0c3a'), uBloomTint: [1.0, 0.9, 0.82], uLift: [0.008, 0.0, 0.03], uGain: [1, 1, 1],
});
const coreAt = (U, x, y) => { U.uCore = [x, H - y]; }; // screen (y down) → GL (y up)
const seaCloud = (o) => ({ type: 1, P: [o.hor, o.fov ?? 1.2, o.scale ?? 1.6, o.cov ?? 0.42], Q: [o.haze ?? 0.25, o.amp ?? 0.45, o.rimK ?? 1.2, o.detail ?? 0.35],
  R: [o.lightElev ?? 0.35, o.lightX ?? 0, 1, 0], lit: o.lit, sh: o.sh, haze: o.hazeCol, rim: o.rim, drift: o.drift || [0, 0], op: o.op ?? 1 });
const bankCloud = (o) => ({ type: 2, P: [o.y0, o.y1, o.scale ?? 3, o.cov ?? 0.5], Q: [o.edge ?? 0.06, o.soft ?? 0.18, o.lightK ?? 6, o.hz ?? 0],
  R: [0, 0, o.rimK ?? 1, 0], lit: o.lit, sh: o.sh, haze: o.hazeCol || o.lit, rim: o.rim, drift: o.drift || [0, 0], op: o.op ?? 1 });
const ceilCloud = (o) => ({ ...seaCloud(o), type: 3 });
const rowCloud = (o) => ({ type: 4, P: [o.hor, o.near ?? 0.0, o.scale ?? 1.2, o.cov ?? 0.5], Q: [o.haze ?? 0.85, o.rows ?? 7, o.rimK ?? 5, 0],
  R: [0, 0, 1, 0], lit: o.lit, alt: o.alt, sh: o.sh, haze: o.hazeCol, rim: o.rim, drift: o.drift || [0, 0], op: o.op ?? 1 });

// ───────── helpers
const zoomL = (L, z, fx, fy) => L.forEach(c => c.setTransform(z, 0, 0, z, fx - fx * z, fy - fy * z));
const resetL = (L) => L.forEach(c => c.setTransform(1, 0, 0, 1, 0, 0));
const fade = (t, a, b, c, d) => A.sstep(a, b, t) * (1 - A.sstep(c, d, t));
const BEAT = 0.75;
const COUNT_COL = hx('#ffe9c0');
const counter = (f, text, a) => A.counter(f, { x: 86, y: 250, text, col: COUNT_COL, alpha: a, size: 30 });
const SKY1 = { top: hx('#050b3e'), mid: hx('#0f6f9a'), hor: hx('#ffb25a') };
const ROWS1 = (t, hor, near) => rowCloud({ hor, near: near ?? 0.06, scale: 1.3, cov: 0.5, rows: 8, haze: 0.8, rimK: 5,
  lit: hx('#ff7a62'), alt: hx('#e0488a'), sh: hx('#22186e'), hazeCol: hx('#ffa060'), rim: hx('#ffe0a0'), drift: [t * 0.06, 0] });

// ───────── SHOT: 一重天 — the endless stair to the ring gate over the sea of clouds (hero / style frame)
function shotStair(L, U, t, k) {
  const [b, m, f] = L;
  const cx = 540, cy = k.cy ?? 590, R = k.R ?? 385;
  U.uSkyTop = SKY1.top; U.uSkyMid = SKY1.mid; U.uSkyHor = SKY1.hor; U.uSkyMidY = 0.66; U.uHorY = k.hor ?? 0.39;
  coreAt(U, cx, cy); U.uCoreR = 34 * R / 385; U.uHaloR = 150 * R / 385; U.uCoreInt = 0.85; U.uCoreHalo = hx('#ffa040'); U.uRays = 0.3; U.uRayRot = t * 0.15; U.uStars = 0.7;
  const horPx = (1 - U.uHorY) * H, hazeC = hx('#ffb070');
  [[170, horPx + 12, 170, 120, 31, 0.62], [880, horPx + 8, 210, 150, 47, 0.6], [640, horPx + 4, 110, 70, 52, 0.7], [420, horPx + 6, 90, 60, 61, 0.72]].forEach(([x, y, w, h, s, hz]) =>
    A.peak(b, { x, y, w, h, seed: s, pal: PEAK, haze: hz, hazeCol: hazeC, light: [x < 540 ? 1 : -1, -1], detail: 0 }));
  A.peak(b, { x: 150, y: horPx + 150, w: 360, h: 640, seed: 11, pal: PEAK, haze: 0.05, hazeCol: hazeC, light: [1, -1], pavilion: true, t });
  A.peak(b, { x: 990, y: horPx + 120, w: 280, h: 470, seed: 23, pal: PEAK, haze: 0.12, hazeCol: hazeC, light: [-1, -1], pavilion: true, t });
  A.birds(b, { t: t + (k.birdT || 0), n: 9, seed: 3, cx: 300, cy: 300, spread: 260, dir: [0.9, 0.25], speed: 28, size: 9, col: hx('#fff4e0'), rim: hx('#ffb060'), alpha: 0.95 });
  A.haloRing(b, { x: cx, y: cy, r: R * 1.32, tilt: 0.22, rot: -0.18, col: GOLD, alpha: 0.55, n: 160, dots: 24, dotCol: hx('#ff6a3a') });
  A.haloRing(b, { x: cx, y: cy, r: R * 1.22, col: GOLD, alpha: 0.5, n: 120, dots: 8, dotR: 3, dotCol: hx('#7af0ff'), rot: t * 0.05 });
  A.strokes(b, { cx, cy, t, n: 900, seed: 4, r0: R * 1.04, r1: R * 1.55, pal: STROKES, swirl: 0.3, inflow: 0.0, width: 2.6, alpha: 0.8, len: 0.75, lanes: 9 });
  A.ring(b, { x: cx, y: cy, r: R, pal: RING_JADE, spin: t * 0.12, alpha: 1, seed: 7 });
  U.clouds[0] = ROWS1(t, U.uHorY);
  const st = { xb: 540, yb: 2080, wb: 270, xv: cx, yv: cy + 30, z0: 1, dz: 0.05, n: 260, pal: STAIR, haze: 0.06, hazeCol: hx('#ffd6b0'), offset: 0, litSteps: k.lit };
  A.stair(m, st);
  const fi = k.figStep ?? 7; const fp = A.stairAt(st, fi);
  A.figure(m, { x: fp.x, y: fp.y - (k.bob || 0) * fp.w * 0.04, s: fp.w * 1.15, t, wind: [0.35, -1], light: [0, -1], pal: FIG, bagua: 0.7 });
  U.clouds[1] = bankCloud({ y0: 0.17, y1: -0.05, scale: 3.0, cov: 0.46, soft: 0.16, edge: 0.06, lightK: 8, rimK: 0.7, lit: hx('#3a2a8a'), alt: hx('#1a4a8a'), sh: hx('#0a0a35'), rim: hx('#ffb070'), drift: [t * 0.03, t * 0.015] });
  A.pine(f, { x: -30, y: 250, ang: -0.25, len: 170, s: 70, w: 18, depth: 3, seed: 21, t, pal: { bark: hx('#0c0820'), rim: hx('#ffb070'), pad: hx('#0a2a30'), needle: hx('#2fbfa0') } });
  A.flakes(f, { t, n: 170, seed: 8, area: [0, 700, 1080, 2000], speed: 110, size: 9, pal: STROKES, alpha: 0.9, glowFrac: 0.4, dust: 260 });
  A.rain(f, { t, n: 200, seed: 5, col: hx('#9ff0ff'), headCol: hx('#fff6dc'), speed: 330, len: 70, alpha: 0.9, bokeh: 7 });
  return st;
}

// ───────── poster overlay: title, sub, seal
function posterText(f, a) {
  A.vtext(f, { x: 948, y: 250, size: 200, chars: '飞升', font: '"Zhi Mang Xing"', col: hx('#fffaf0'), col2: hx('#ffd27a'), shadow: hx('#1a0a40'), alpha: a, gap: 205 });
  A.vtext(f, { x: 948, y: 700, size: 30, chars: '九重天上', font: '"Noto Serif SC"', col: hx('#ffe9c0'), alpha: 0.95 * a, gap: 42, shadow: hx('#0a0830') });
  f.save(); f.font = '500 22px "Noto Serif SC"'; f.fillStyle = A.css(hx('#ffe9c0'), 0.85 * a); f.translate(990, 690); f.rotate(Math.PI / 2);
  f.letterSpacing = '6px'; f.fillText('ASCENSION', 0, 8); f.restore();
  A.seal(f, { x: 948, y: 900, s: 56, col: hx('#e8262b'), text: '九重', font: '"Ma Shan Zheng"', alpha: a });
}

// ───────── S1 0–3 雨，往天上落 (hook): rain rising; a drop rises and we enter the world inside it
function s1(L, U, lt) {
  const [b, m, f] = L;
  U.uSkyTop = hx('#03051e'); U.uSkyMid = hx('#0b1048'); U.uSkyHor = hx('#2a1660'); U.uSkyMidY = 0.5;
  U.uHorY = 0.24 - 0.3 * A.eio(lt / 3); U.uStars = 1.0; U.uRays = 0; U.uCoreInt = 0;
  U.clouds[0] = rowCloud({ hor: U.uHorY, near: U.uHorY - 0.3, scale: 1.3, cov: 0.5, rows: 6, haze: 0.7, rimK: 5,
    lit: hx('#34307e'), alt: hx('#4a2280'), sh: hx('#070820'), hazeCol: hx('#1c1650'), rim: hx('#8fb8ff'), drift: [lt * 0.05, 0] });
  A.rain(b, { t: lt + 3, n: 320, seed: 15, col: hx('#6fb8ff'), headCol: hx('#cfe8ff'), speed: 260, len: 50, alpha: 0.55 });
  // the drop
  let x = 540, y, R;
  if (lt < 2.25) { const u = A.eo(lt / 2.25); y = A.lerp(2150, 900, u); R = A.lerp(60, 95, u); }
  else { const u = (lt - 2.25) / 0.75, e = A.ei(u); y = A.lerp(900, 590, A.eio(u)); R = 95 * Math.pow(1500 / 95, e); }
  const ringR = 385 * Math.pow(R / 1500, 0.6), kk = ringR / 385;
  const glow = A.clamp((lt - 1.5) / 1.5);
  U.uCoreInt = 0.5 + 0.35 * glow; coreAt(U, x, y); U.uCoreR = 34 * kk; U.uHaloR = 150 * kk; U.uCoreHalo = hx('#ffa040'); U.uRays = 0.3 * glow;
  A.drop(m, { x, y, r: R, rim: hx('#bfefff'), edge: hx('#0a1040'), tail: R * 3, inner: (c, cx, cy, r) => {
    const g = c.createLinearGradient(0, -r, 0, r); g.addColorStop(0, A.css(SKY1.mid)); g.addColorStop(0.55, A.css(SKY1.hor)); g.addColorStop(0.62, A.css(hx('#ff8a6a'))); g.addColorStop(1, A.css(hx('#2a1a70')));
    c.fillStyle = g; c.fillRect(-r, -r, 2 * r, 2 * r);
    A.strokes(c, { cx: 0, cy: 0, t: lt, n: 500, seed: 4, r0: ringR * 1.04, r1: ringR * 1.55, pal: STROKES, swirl: 0.3, width: 2.6 * Math.max(0.4, kk), alpha: 0.8, len: 0.75, lanes: 9 });
    A.ring(c, { x: 0, y: 0, r: ringR, pal: RING_JADE, spin: lt * 0.12, seed: 7 });
    A.stair(c, { xb: 0, yb: 1490 * kk, wb: 270 * kk, xv: 0, yv: 30 * kk, z0: 1, dz: 0.05, n: 200, pal: STAIR, haze: 0.06, hazeCol: hx('#ffd6b0'), ramp: kk > 0.5 });
  } });
  A.rain(f, { t: lt, n: 380, seed: 5, col: hx('#9ff0ff'), headCol: hx('#ffffff'), speed: 720, len: 120, alpha: 0.95, bokeh: 9 });
  A.htext(f, { x: 540, y: 360, size: 104, text: '雨，往天上落。', font: '"Zhi Mang Xing"', col: hx('#ffffff'), col2: hx('#bfe8ff'), shadow: hx('#03051e'),
    reveal: A.clamp((lt - 0.3) / 0.7), alpha: 1 - A.sstep(2.2, 2.7, lt), track: 1.02 });
  U.uBloom = 0.75;
}

// ───────── S2 3–6 一重天
function s2(L, U, lt) {
  const beat = Math.floor(lt / BEAT), ph = (lt % BEAT) / BEAT;
  const lit = []; for (let i = 0; i <= beat; i++) lit.push({ i: 7 + i, k: Math.exp(-(lt - i * BEAT) * 3) });
  const fig = 7 + Math.min(3, lt / BEAT) * 0.95;
  // push into the figure during the last beat
  const zp = A.ei(A.clamp((lt - 2.25) / 0.75));
  const st0 = { xb: 540, yb: 2080, wb: 270, xv: 540, yv: 590 - 20 * lt / 3 + 30, z0: 1, dz: 0.05 };
  const fp = A.stairAt(st0, fig);
  const z = 1 + 0.08 * (lt / 3) + 1.1 * zp, fx = A.lerp(540, fp.x, zp), fy = A.lerp(900, fp.y - fp.w * 0.5, zp);
  zoomL(L, z, fx, fy);
  const st = shotStair(L, U, lt + 3, { cy: 590 - 20 * lt / 3, R: 385, lit, figStep: fig, bob: Math.sin(ph * Math.PI) });
  // shader-side zoom approximation
  const c = U.uCore; const sx = fx + (c[0] - fx) * z, sy = (H - fy) + (c[1] - (H - fy)) * z; U.uCore = [sx, sy]; U.uCoreR *= z; U.uHaloR *= z;
  U.uHorY = 1 - ((1 - U.uHorY) * H - fy) * z / H - fy / H; U.clouds[0].P[0] = U.uHorY;
  resetL(L); counter(L[2], '一重天', fade(lt, 0.3, 0.8, 2.2, 2.7));
}

// ───────── S3 6–9 登阶: low follow behind the cultivator, steps light on the beat, rush into the gate
function s3(L, U, lt) {
  const [b, m, f] = L;
  const rush = A.ei(A.clamp((lt - 2.25) / 0.75));
  const cy = A.lerp(380, 760, A.eio(A.clamp((lt - 2.25) / 0.75))), R = A.lerp(300, 430, A.eio(A.clamp(lt / 2.25))) * Math.pow(9, rush);
  U.uSkyTop = SKY1.top; U.uSkyMid = SKY1.mid; U.uSkyHor = SKY1.hor; U.uSkyMidY = 0.72; U.uHorY = 0.2;
  coreAt(U, 540, cy); U.uCoreR = 40 * (R / 385); U.uHaloR = 170 * Math.min(4, R / 385); U.uCoreInt = 0.9 + rush; U.uCoreHalo = hx('#ffa040'); U.uRays = 0.35; U.uRayRot = lt * 0.2;
  // side peaks sliding down (we climb)
  A.peak(b, { x: 60, y: 1300 + lt * 90, w: 420, h: 800, seed: 23, pal: PEAK, haze: 0.08, hazeCol: hx('#ffb070'), light: [1, -1], pavilion: true, t: lt });
  A.peak(b, { x: 1040, y: 1450 + lt * 110, w: 380, h: 760, seed: 11, pal: PEAK, haze: 0.1, hazeCol: hx('#ffb070'), light: [-1, -1], pavilion: true, t: lt });
  A.strokes(b, { cx: 540, cy, t: lt + 6, n: 900, seed: 4, r0: R * 1.04, r1: R * 1.6, pal: STROKES, swirl: 0.3, width: 2.8, alpha: 0.8, len: 0.75, lanes: 9 });
  A.haloRing(b, { x: 540, y: cy, r: R * 1.22, col: GOLD, alpha: 0.5, n: 120, dots: 8, dotR: 3, dotCol: hx('#7af0ff'), rot: lt * 0.05 });
  A.ring(b, { x: 540, y: cy, r: R, pal: RING_JADE, spin: (lt + 6) * 0.12, seed: 7, depth: 0.16 });
  U.clouds[0] = ROWS1(lt, 0.2, 0.0);
  const off = lt * 1.45 + rush * 6;
  const st = { xb: 540, yb: 2700, wb: 1000, xv: 540, yv: cy + 40, z0: 1, dz: 0.11, n: 150, pal: STAIR, haze: 0.05, hazeCol: hx('#ffd6b0'), offset: off };
  // step under the feet lights on each beat
  const footY = 1560; const uF = (footY - st.yb) / (st.yv - st.yb); const zF = st.z0 / (1 - uF); const iF = (zF - st.z0) / st.dz;
  const lit = []; for (let k = 0; k < 4; k++) { const tb = k * BEAT; if (lt >= tb) lit.push({ i: Math.round(iF + tb * 1.45), k: Math.exp(-(lt - tb) * 2.5) * 1.2 }); }
  st.litSteps = lit; A.stair(m, st);
  const ph = (lt % BEAT) / BEAT;
  const fs = A.lerp(640, 70, rush), fy = A.lerp(footY - 14 * Math.sin(ph * Math.PI), cy + 60, A.eio(rush));
  A.figure(m, { x: 540, y: fy, s: fs, t: lt + 6, wind: [0.25, -1], light: [0, -1], pal: FIG, bagua: 0.75, pose: rush > 0.3 ? 'fly' : 'stand', ribbonLen: 1.8 });
  A.flakes(f, { t: lt + 6, n: 200, seed: 9, area: [0, 0, 1080, 1980], speed: 220 + rush * 900, size: 12, pal: STROKES, alpha: 0.9, glowFrac: 0.4, dust: 200 });
  A.rain(f, { t: lt + 6, n: 160, seed: 6, col: hx('#9ff0ff'), headCol: hx('#fff6dc'), speed: 400 + rush * 1600, len: 90 + rush * 300, alpha: 0.8, bokeh: 6 });
  U.uFlash = 0.0;
}

// ───────── S4 9–12 二·三·四重天: tunnel of gates, one pass per beat, then the gold gate sheds its petals
const TUN = [RING_JADE, RING_TEAL, RING_CINNABAR, RING_JADE, RING_GOLD];
const TSKY = [[hx('#031630'), hx('#0a6a8a'), hx('#ffcf8a')], [hx('#021a2a'), hx('#0a7a7a'), hx('#bff7e8')], [hx('#200414'), hx('#8a1236'), hx('#ff8a3a')],
  [hx('#06103a'), hx('#1a4aa0'), hx('#ffcf6a')], [hx('#2a0a3a'), hx('#a03a7a'), hx('#ffd08a')]];
const camZ = (lt) => lt < 2.25 ? lt / BEAT + 0.6 * Math.sin(2 * Math.PI * lt / BEAT) / (2 * Math.PI) : 3 + 0.45 * A.eo((lt - 2.25) / 0.75);
function petalBurst(c, tp, cx, cy, r0, rotBase) {
  const r = A.rng(55);
  for (let i = 0; i < 32; i++) { const a = (i + 0.5) / 32 * TAU + rotBase; const del = r() * 0.25; const u = A.clamp((tp - del) / 1.1);
    if (u <= 0) continue; const e = A.ei(u);
    const rad = r0 * (0.8 + e * (2.5 + r() * 2)), s = 60 * (r0 / 300) * (1 + e * (12 + r() * 8));
    A.petal(c, { x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad, s, rot: a + Math.PI / 2 + e * (r() - 0.5) * 2, base: hx('#ffe4c8'), mid: i % 2 ? hx('#ff7ab0') : hx('#ffb02a'), tip: i % 2 ? hx('#ff2f7a') : hx('#ff5a2a'), vein: hx('#fff3d0'), edgeCol: hx('#ffd27a'), alpha: 1 - A.sstep(0.85, 1, u) * 0.3 }); }
}
function s4(L, U, lt) {
  const [b, m, f] = L;
  const z = camZ(lt), F = 300, cx = 540, cy = 860;
  const seg = Math.min(4, Math.max(0, z)), si = Math.floor(seg), sf = seg - si; const S0 = TSKY[si], S1 = TSKY[Math.min(4, si + 1)];
  U.uSkyTop = A.mix(S0[0], S1[0], A.sstep(0.5, 1, sf)); U.uSkyMid = A.mix(S0[1], S1[1], A.sstep(0.5, 1, sf)); U.uSkyHor = A.mix(S0[2], S1[2], A.sstep(0.5, 1, sf));
  U.uSkyMidY = 0.55; U.uHorY = 0.0; U.uStars = 0.4;
  coreAt(U, cx, cy); U.uCoreR = 30; U.uHaloR = 260; U.uCoreInt = 1.0; U.uCoreHalo = A.mix(S0[2], S1[2], sf); U.uRays = 0.45; U.uRayRot = lt * 0.6; U.uRayN = 14;
  // radial speed streaks
  const speed = lt < 2.25 ? (1 + 0.6 * Math.cos(2 * Math.PI * lt / BEAT)) : 0.4 * (1 - A.eo((lt - 2.25) / 0.75)) + 0.1;
  { const r = A.rng(71); b.save(); b.globalCompositeOperation = 'lighter'; b.lineCap = 'round';
    for (let i = 0; i < 420; i++) { const a = r() * TAU, d0 = r(); const ph = (d0 + z * 0.6 * (0.7 + r() * 0.6)) % 1; const rad = 60 * Math.pow(30, ph); const ln = rad * 0.08 * (0.5 + speed * 1.8);
      const c = STROKES[i % STROKES.length]; b.strokeStyle = A.css(c, 0.7 * A.sstep(0, 0.2, ph)); b.lineWidth = 0.6 + ph * 3;
      b.beginPath(); b.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); b.lineTo(cx + Math.cos(a) * (rad + ln), cy + Math.sin(a) * (rad + ln)); b.stroke(); }
    b.restore(); }
  // islets streaking past
  [[-1.3, 0.6, 1.5, 23], [1.4, -0.5, 2.3, 11], [-1.5, -0.9, 3.2, 47], [1.2, 0.9, 3.9, 31], [-1.1, 0.2, 4.6, 61]].forEach(([wx, wy, wz, sd]) => {
    const d = wz - z; if (d < 0.12 || d > 4) return; const sc = F / d; A.peak(m, { x: cx + wx * sc, y: cy + wy * sc + 0.4 * sc, w: 0.9 * sc, h: 1.4 * sc, seed: sd, pal: PEAK, haze: A.clamp((d - 0.5) / 3.5) * 0.8, hazeCol: U.uSkyHor, light: [wx < 0 ? 1 : -1, -1], pavilion: true, alpha: A.sstep(4, 3.2, d) }); });
  // gates, far to near
  for (let k = 5; k >= 1; k--) { const d = k - z; if (d < 0.07 || d > 5.5) continue; const r = F / d;
    const ox = Math.cos(k * 1.7) * 0.12 * F / d, oy = Math.sin(k * 1.3) * 0.1 * F / d;
    const hz = A.clamp((d - 1) / 4) * 0.85, pal = TUN[Math.min(4, k)];
    const tgt = d > 1.2 ? b : m;
    if (k === 4 && lt > 2.4) { // gold gate sheds its petals
      A.ring(tgt, { x: cx + ox, y: cy + oy, r, pal: { ...pal, petalA: [0, 0, 0], petalB: [0, 0, 0] }, petals: 0, spin: lt * 0.3, alpha: 1, haze: hz, hazeCol: U.uSkyHor, seed: 7 + k, depth: 0.1 });
    } else A.ring(tgt, { x: cx + ox, y: cy + oy, r, pal, spin: lt * 0.3 * (k % 2 ? 1 : -1), alpha: A.sstep(5.5, 4, d), haze: hz, hazeCol: U.uSkyHor, seed: 7 + k, depth: 0.1 });
  }
  // the cultivator flying ahead
  A.figure(m, { x: cx - 10, y: cy + 230 + Math.sin(lt * 2) * 10, s: 150, t: lt + 9, wind: [0.15, 1], light: [0, -1], pal: FIG, pose: 'fly', rot: Math.sin(lt * 1.3) * 0.08, ribbonLen: 2.2 });
  A.flakes(f, { t: lt + 9, n: 120, seed: 19, area: [0, 0, 1080, 1980], speed: 200, size: 10, pal: STROKES, alpha: 0.8, glowFrac: 0.5, dust: 160 });
  if (lt > 2.4) { const d = 4 - z; petalBurst(f, lt - 2.4, cx + Math.cos(4 * 1.7) * 0.12 * F / d, cy + Math.sin(4 * 1.3) * 0.1 * F / d, F / d * 0.8, lt * 0.3); }
  const ci = lt < BEAT ? -1 : Math.min(2, Math.floor((lt - BEAT) / BEAT)); const names = ['二重天', '三重天', '四重天'];
  if (ci >= 0) counter(f, names[ci], fade((lt - BEAT) % BEAT + (ci === 2 ? 0 : 0), 0.02, 0.15, ci === 2 ? 1.2 : 0.62, ci === 2 ? 1.4 : 0.74));
  U.uCA = 1.0 + speed * 0.8;
}

// ───────── S5 12–15 五重天 · 莲海巨构
function s5(L, U, lt) {
  const [b, m, f] = L;
  const fl = (u) => ({ x: A.lerp(170, 720, A.eio(u)), y: A.lerp(1480, 1060, A.eo(u)) - 70 * Math.sin(u * Math.PI) });
  const u = lt / 3, fp = fl(u);
  const zp = A.ei(A.clamp((lt - 2.25) / 0.75)); const z = 1 + 0.06 * u + 1.6 * zp;
  const fx = A.lerp(540, fp.x, zp), fy = A.lerp(960, fp.y - 60, zp);
  zoomL(L, z, fx, fy);
  U.uSkyTop = hx('#14082e'); U.uSkyMid = hx('#a8307e'); U.uSkyHor = hx('#ffcf8a'); U.uSkyMidY = 0.66; U.uHorY = 0.385;
  coreAt(U, 540, 610); U.uCoreR = 46; U.uHaloR = 210; U.uCoreInt = 1.0; U.uCoreHalo = hx('#ffb060'); U.uRays = 0.4; U.uRayRot = lt * 0.12; U.uStars = 0.8;
  const hazeC = hx('#ffc08a');
  [[110, 1170, 240, 400, 31, 0.35], [980, 1180, 260, 420, 47, 0.3], [300, 1185, 120, 160, 52, 0.55], [800, 1185, 130, 170, 61, 0.55]].forEach(([x, y, w, h, s, hz]) =>
    A.peak(b, { x, y, w, h, seed: s, pal: PEAK, haze: hz, hazeCol: hazeC, light: [x < 540 ? 1 : -1, -1], pavilion: w > 200, t: lt }));
  A.haloRing(b, { x: 540, y: 610, r: 330, tilt: 0.24, rot: 0.1, col: GOLD, alpha: 0.6, n: 160, dots: 20, dotCol: hx('#7af0ff') });
  A.haloRing(b, { x: 540, y: 610, r: 470, tilt: 0.2, rot: -0.12, col: GOLD, alpha: 0.45, n: 200, dots: 30, dotCol: hx('#ff6a3a') });
  A.strokes(b, { cx: 540, cy: 610, t: lt + 12, n: 700, seed: 14, r0: 250, r1: 560, pal: STROKES, swirl: 0.25, width: 2.4, alpha: 0.7, len: 0.8, lanes: 7, tilt: 0.35 });
  // light-falls rising from the palace
  A.flow(b, { t: lt, n: 220, seed: 3, area: [250, 300, 830, 1250], dir: [0, -1], speed: 160, pal: [hx('#fff0c8'), hx('#9ff6ff'), hx('#ffd36b')], width: 1.4, len: 120, alpha: 0.55 });
  A.palace(b, { x: 540, y: 1250, r: 430, tiers: 7, gap: 118, t: lt, pal: { wallTop: hx('#4a1e6a'), wall: hx('#1a0e3e'), window: hx('#ffb347'), window2: hx('#7af0ff'), roof: hx('#140a30'), roofTop: hx('#b04a7a'), gold: GOLD } });
  U.clouds[0] = rowCloud({ hor: U.uHorY, near: 0.05, scale: 1.2, cov: 0.5, rows: 8, haze: 0.75, rimK: 5,
    lit: hx('#ff9ab8'), alt: hx('#ffc38a'), sh: hx('#4a1e7a'), hazeCol: hx('#ffc890'), rim: hx('#fff0d0'), drift: [lt * 0.05, 0] });
  // lotus blossoms on the cloud sea
  [[170, 1560, 150], [930, 1700, 190], [470, 1830, 120]].forEach(([x, y, s], j) => { for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.3;
    A.petal(m, { x: x + Math.cos(a) * s * 0.28, y: y + Math.sin(a) * s * 0.28, s: s * (0.75 + 0.25 * Math.cos((i - 4) * 0.4)), rot: a + Math.PI / 2, base: hx('#fff0e0'), mid: hx('#ff8ab8'), tip: hx('#ff3f8a'), vein: hx('#fff3d0'), edgeCol: hx('#ffd27a') }); } });
  A.birds(m, { t: lt + 4, n: 7, seed: 13, cx: 760, cy: 420, spread: 200, dir: [-0.9, 0.2], speed: 30, size: 8, col: hx('#fff4e0'), rim: hx('#ffb060') });
  A.figure(m, { x: fp.x, y: fp.y, s: 150 + 30 * u, t: lt + 12, wind: [-0.55, 0.85], light: [0.3, -1], pal: FIG, pose: 'fly', rot: A.lerp(0.55, 0.25, u), ribbonLen: 2.0 });
  A.flakes(f, { t: lt + 12, n: 120, seed: 21, area: [0, 0, 1080, 1980], speed: 90, size: 9, pal: [hx('#ff8ab8'), hx('#fff0e0'), hx('#ffd36b'), hx('#ff3f8a'), hx('#7af0ff')], alpha: 0.85, glowFrac: 0.4, dust: 200 });
  A.rain(f, { t: lt + 12, n: 90, seed: 7, col: hx('#ffe0f0'), headCol: hx('#ffffff'), speed: 260, len: 60, alpha: 0.6, bokeh: 6 });
  // shader-side zoom approx
  const c = U.uCore; U.uCore = [fx + (c[0] - fx) * z, (H - fy) + (c[1] - (H - fy)) * z]; U.uCoreR *= z; U.uHaloR *= z;
  U.uHorY = 1 - (((1 - U.uHorY) * H - fy) * z + fy) / H; U.clouds[0].P[0] = U.uHorY; U.clouds[0].P[1] = Math.min(U.uHorY - 0.05, 0.05);
  resetL(L);
  if (lt < 0.7) petalBurst(f, lt + 0.6, 540 + Math.cos(4 * 1.7) * 0.12 * 300 / 0.55, 860 + Math.sin(4 * 1.3) * 0.1 * 300 / 0.55, 300 / 0.55 * 0.8, (lt + 2.4) * 0.3);
  counter(f, '五重天', fade(lt, 0.6, 1.0, 2.0, 2.4));
}

// ───────── S6 15–18 六重天 · 背纹: close on the back, the bagua lights and becomes the sky array
const BAGUA_PAL = { line: hx('#ffd98a'), glow: hx('#ffb040'), glow2: hx('#ff3f6a'), yang: hx('#fff4dc'), yin: hx('#1a0c3a') };
function s6(L, U, lt) {
  const [b, m, f] = L;
  const grow = A.ei(A.clamp((lt - 2.1) / 0.9));
  U.uSkyTop = hx('#0a0830'); U.uSkyMid = hx('#3a2a90'); U.uSkyHor = hx('#ff7a6a'); U.uSkyMidY = 0.55; U.uHorY = 0.12;
  coreAt(U, 900, 230); U.uCoreR = 40; U.uHaloR = 220; U.uCoreInt = 0.95; U.uCoreHalo = hx('#ffa040'); U.uRays = 0.4; U.uRayRot = lt * 0.2; U.uStars = 0.5;
  U.clouds[0] = rowCloud({ hor: 0.3, near: 0.0, scale: 1.0, cov: 0.5, rows: 6, haze: 0.8, rimK: 5, lit: hx('#ff7a8a'), alt: hx('#c04aa0'), sh: hx('#22186e'), hazeCol: hx('#ff9a80'), rim: hx('#ffe0a0'), drift: [lt * 0.05, 0] });
  A.strokes(b, { cx: 900, cy: 230, t: lt + 15, n: 600, seed: 24, r0: 160, r1: 620, pal: STROKES, swirl: 0.3, width: 3, alpha: 0.6, len: 0.8, lanes: 7 });
  const s = A.lerp(2400, 2600, lt / 3), fx = 540 - 40 * Math.sin(lt * 0.5), fy = 300 + s;
  const fa = 1 - A.sstep(0.35, 0.95, grow);
  A.figure(m, { x: fx, y: fy, s, t: lt + 15, wind: [0.5, -0.75], light: [0.6, -0.8], pal: FIG, bagua: 0.6 + 0.4 * A.sstep(0.3, 1.5, lt), alpha: fa, ribbonLen: 1.3 });
  // bagua overlay grows into the sky array
  const bx = fx + 0, by = fy - 0.7 * s, br = 0.04 * s;
  const glowA = A.sstep(0.6, 1.8, lt);
  A.bagua(f, { x: A.lerp(bx, 540, grow), y: A.lerp(by, 1050, grow), r: A.lerp(br, 900, grow), tilt: 1, rot: lt * 0.5, pal: BAGUA_PAL, alpha: glowA * (0.55 + 0.45 * grow), seed: 5 });
  A.flakes(f, { t: lt + 15, n: 70, seed: 29, area: [0, 0, 1080, 1980], speed: 70, size: 11, pal: STROKES, alpha: 0.75, glowFrac: 0.5, dust: 120 });
  counter(f, '六重天', fade(lt, 0.4, 0.8, 1.9, 2.3));
  U.uBloom = 0.7 + grow * 0.4; U.bloomThr = 0.85;
}

// ───────── S7 18–21 七重天 · 劫
function s7(L, U, lt) {
  const [b, m, f] = L;
  const settle = A.eio(A.clamp(lt / 0.7)), into = A.ei(A.clamp((lt - 2.25) / 0.75));
  const bx = 540, by = A.lerp(1050, 720, settle), br = A.lerp(900, 560, settle) * Math.pow(6, into), tilt = A.lerp(1, 0.55, settle) + (1 - A.lerp(1, 0.55, settle)) * into;
  U.uSkyTop = hx('#0e031c'); U.uSkyMid = hx('#5a0a3a'); U.uSkyHor = hx('#0a4a6a'); U.uSkyMidY = 0.5; U.uHorY = 0.1;
  coreAt(U, bx, by); U.uCoreR = 30 + 200 * into; U.uHaloR = 160 + 600 * into; U.uCoreInt = 0.8 + into; U.uCoreHalo = hx('#ff6a3a'); U.uRays = 0.5; U.uRayRot = lt * 0.8; U.uStars = 0.3;
  U.clouds[0] = bankCloud({ y0: 1.08, y1: 0.78, scale: 2.4, cov: 0.45, soft: 0.2, edge: 0.08, lightK: 8, rimK: 1.0, lit: hx('#7a1a4a'), alt: hx('#0a5a6a'), sh: hx('#12041e'), rim: hx('#ff7a3a'), drift: [lt * 0.08, lt * 0.04] });
  U.clouds[1] = bankCloud({ y0: 0.25, y1: -0.1, scale: 2.4, cov: 0.45, soft: 0.2, edge: 0.08, lightK: 8, rimK: 1.0, lit: hx('#0a5a6a'), alt: hx('#7a1a4a'), sh: hx('#0a0418'), rim: hx('#3fe0ff'), drift: [-lt * 0.08, lt * 0.03] });
  const vort = A.lerp(1, 0.35, into);
  A.strokes(b, { cx: bx, cy: by, t: lt * 1.6 + 18, n: 2000, seed: 34, r0: 140 * vort, r1: 1150 * vort, pal: [hx('#ff3b30'), hx('#ff7a2a'), hx('#ffd36b'), hx('#18d4e6'), hx('#2fe6c0'), hx('#ffffff'), hx('#ff2f7a')], swirl: 0.9, inflow: 0.0, width: 5, alpha: 0.85, len: 0.55, lanes: 10, tilt: 0.6 });
  A.fragments(m, { t: lt, n: 26, seed: 41, cx: bx, cy: by, r0: 420 * vort, r1: 1000 * vort, tilt: 0.6, swirl: 0.7, size: 46, pal: { top: hx('#e2b8a8'), side: hx('#3a3088'), lip: hx('#ffe6a0') } });
  A.bagua(m, { x: bx, y: by, r: br, tilt, rot: lt * 0.9, pal: BAGUA_PAL, alpha: 1 - A.sstep(0.6, 1, into), seed: 5 });
  for (let k = 0; k < 4; k++) { const tb = k * BEAT; const a = A.clamp(1 - (lt - tb) / 0.3); if (lt >= tb && a > 0) A.lightning(f, { seed: 100 + k, x: k % 2 ? 260 : 820, y: 300 + k * 90, ang: Math.PI / 2 + (k % 2 ? 0.4 : -0.4), len: 700, spread: 260, n: 2, w: 1.6, col: hx('#fff3c0'), glow: hx('#ffb040'), alpha: a }); }
  A.figure(m, { x: 540 + Math.sin(lt * 1.5) * 20, y: A.lerp(1700, by + 150, A.eio(A.clamp(lt / 2.4))), s: A.lerp(190, 80, A.clamp(lt / 2.4)), t: lt + 18, wind: [0.2, 1], light: [0, -1], pal: FIG, pose: 'fly', rot: Math.sin(lt * 2) * 0.1, ribbonLen: 2.2, alpha: 1 - into });
  A.flakes(f, { t: lt + 18, n: 160, seed: 39, area: [0, 0, 1080, 1980], speed: 300, size: 10, pal: STROKES, alpha: 0.85, glowFrac: 0.6, dust: 120 });
  counter(f, '七重天', fade(lt, 0.4, 0.8, 1.9, 2.3));
  U.uCA = 1.2; U.uVigCol = hx('#12031c');
}

// ───────── S8 21–24 八重天 · 天井
function s8(L, U, lt) {
  const [b, m, f] = L;
  const grow = A.ei(A.clamp((lt - 2.25) / 0.75));
  U.uSkyTop = hx('#0a0a3a'); U.uSkyMid = hx('#1a1a6a'); U.uSkyHor = hx('#2a1a7a'); U.uSkyMidY = 0.5; U.uHorY = 0.0; U.uStars = 0;
  coreAt(U, 540, 900); U.uCoreR = A.lerp(40, 70, lt / 2.25) + 380 * grow; U.uHaloR = 220 + 900 * grow; U.uCoreInt = 1.0 + grow; U.uCoreHalo = hx('#ffb050'); U.uRays = 0.6; U.uRayRot = lt * 0.3; U.uRayN = 16;
  A.well(b, { x: 540, y: 900, r: 1700, k: 0.76, tiers: 16, phase: -lt * 0.42 - grow * 1.2, rot: lt * 0.08, t: lt, pal: { wallLit: hx('#3a5ad0'), wall: hx('#141a6a'), wallDark: hx('#070826'), win: hx('#ffb347'), win2: hx('#7af0ff'), gold: GOLD, beam: hx('#ff5a3a'), haze: hx('#ffd8a0') } });
  A.strokes(m, { cx: 540, cy: 900, t: lt + 21, n: 700, seed: 44, r0: 120, r1: 520, pal: [hx('#ffd36b'), hx('#fff3d6'), hx('#7af0ff'), hx('#ff7a2a')], swirl: 0.5, width: 2.2, alpha: 0.7, len: 0.7, lanes: 6 });
  A.figure(m, { x: 540, y: A.lerp(1380, 1010, A.eio(lt / 3)), s: A.lerp(170, 70, A.eio(lt / 3)), t: lt + 21, wind: [0.1, 1], light: [0, -1], pal: FIG, pose: 'fly', ribbonLen: 2.0, alpha: 1 - grow });
  A.motes(f, { t: lt, n: 70, seed: 81, speed: 160, size: 3, pal: [hx('#ffd36b'), hx('#fff3d6'), hx('#7af0ff')], alpha: 0.85 });
  counter(f, '八重天', fade(lt, 0.4, 0.8, 1.9, 2.3));
}

// ───────── S9 24–27 九重天 · 光核 → white
const WHITE_SKY = { top: hx('#fff6e6'), mid: hx('#fff1da'), hor: hx('#ffe6c0') };
function s9(L, U, lt) {
  const [b, m, f] = L;
  const into = A.ei(A.clamp(lt / 1.0)), white = A.sstep(0.6, 1.0, lt);
  if (lt < 1.0) {
    U.uSkyTop = hx('#0a0a3a'); U.uSkyMid = hx('#1a1a6a'); U.uSkyHor = hx('#2a1a7a'); U.uHorY = 0;
    coreAt(U, 540, 900); U.uCoreR = 450 + 2400 * into; U.uHaloR = 1100 + 2000 * into; U.uCoreInt = 2 + 2 * into; U.uCoreHalo = hx('#ffb050'); U.uRays = 0.8; U.uRayRot = lt; U.uRayN = 16;
    A.well(b, { x: 540, y: 900, r: 1700, k: 0.76, tiers: 16, phase: -1.4 - lt * 3, rot: 0.2, t: lt, alpha: 1 - into, pal: { wallLit: hx('#3a5ad0'), wall: hx('#141a6a'), wallDark: hx('#070826'), win: hx('#ffb347'), win2: hx('#7af0ff'), gold: GOLD, beam: hx('#ff5a3a'), haze: hx('#ffd8a0') } });
    petalBurst(f, lt * 1.1, 540, 900, 200, 0.3);
    U.uFlash = 0.9 * white;
  } else {
    U.uSkyTop = WHITE_SKY.top; U.uSkyMid = WHITE_SKY.mid; U.uSkyHor = WHITE_SKY.hor; U.uSkyMidY = 0.5; U.uHorY = 0.0; U.uCoreInt = 0.25; coreAt(U, 540, 900); U.uCoreR = 200; U.uHaloR = 600; U.uCoreHalo = hx('#ffe0a0'); U.uRays = 0; U.uStars = 0;
    U.uFlash = 0.9 * (1 - A.sstep(1.0, 1.7, lt));
    A.motes(f, { t: lt + 3, n: 46, seed: 91, speed: 70, size: 3.2, pal: [hx('#e0a040'), hx('#ff6a3a'), hx('#3ab0d0')], alpha: 0.8 * A.sstep(1.1, 1.8, lt), add: false });
    A.haloRing(b, { x: 540, y: 900, r: 420, col: hx('#e0b060'), alpha: 0.5 * A.sstep(1.8, 2.8, lt), n: 160, lw: 1.0, rot: lt * 0.05 });
    counter(f, '九重天', 0);
    A.counter(f, { x: 86, y: 250, text: '九重天', col: hx('#b07a2a'), alpha: fade(lt, 1.3, 1.7, 2.5, 2.9), size: 30 });
  }
  U.uVig = 0.15 + 0.4 * (1 - white); U.uVigCol = hx('#f0d0a0'); U.uHalf = 0.0; U.uGrain = 0.03; U.uBloom = 0.9;
}

// ───────── S10 27–30 飞升
function s10(L, U, lt) {
  const [b, m, f] = L;
  U.uSkyTop = WHITE_SKY.top; U.uSkyMid = WHITE_SKY.mid; U.uSkyHor = WHITE_SKY.hor; U.uSkyMidY = 0.5; U.uHorY = 0.0; U.uCoreInt = 0.25; coreAt(U, 540, 900); U.uCoreR = 200; U.uHaloR = 600; U.uCoreHalo = hx('#ffe0a0'); U.uRays = 0; U.uStars = 0;
  A.haloRing(b, { x: 540, y: 900, r: 420, col: hx('#e0b060'), alpha: 0.5, n: 160, lw: 1.0, rot: (lt + 3) * 0.05 });
  A.haloRing(b, { x: 540, y: 900, r: 470, tilt: 0.22, rot: -0.18, col: hx('#e0b060'), alpha: 0.35 * A.sstep(0, 1.2, lt), n: 160, dots: 24, dotCol: hx('#e8262b') });
  A.motes(f, { t: lt + 6, n: 46, seed: 91, speed: 70, size: 3.2, pal: [hx('#e0a040'), hx('#ff6a3a'), hx('#3ab0d0')], alpha: 0.8, add: false });
  A.vtext(f, { x: 540, y: 690, size: 340, chars: '飞升', font: '"Zhi Mang Xing"', col: hx('#1a0e30'), col2: hx('#4a1a4a'), alpha: 1, gap: 345, reveal: A.clamp(lt / 1.2) });
  A.vtext(f, { x: 830, y: 650, size: 40, chars: '人，向光里走。', font: '"Noto Serif SC"', col: hx('#7a3a22'), alpha: A.sstep(1.1, 1.6, lt), gap: 52, reveal: A.clamp((lt - 1.1) / 0.7) });
  A.seal(f, { x: 830, y: 1080, s: 64, col: hx('#e8262b'), text: '九重', font: '"Ma Shan Zheng"', alpha: A.sstep(1.6, 1.9, lt) });
  f.save(); f.font = '500 24px "Noto Serif SC"'; f.letterSpacing = '14px'; f.textAlign = 'center'; f.fillStyle = A.css(hx('#a07030'), A.sstep(1.8, 2.3, lt)); f.fillText('ASCENSION', 547, 1330); f.restore();
  U.uVig = 0.15; U.uVigCol = hx('#f0d0a0'); U.uHalf = 0.0; U.uGrain = 0.03; U.uBloom = 0.5;
}

// ───────── timeline
const SHOTS = [];
const shot = (t0, t1, fn) => SHOTS.push({ t0, t1, fn });
shot(0, 3, s1); shot(3, 6, s2); shot(6, 9, s3); shot(9, 12, s4); shot(12, 15, s5); shot(15, 18, s6); shot(18, 21, s7); shot(21, 24, s8); shot(24, 27, s9); shot(27, 30.01, s10);

let gl = null, cvs = null, layers = null;
function ensure() {
  if (gl) return;
  cvs = document.getElementById('c'); gl = window.AscGL(cvs);
  layers = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; });
}
window.renderAt = (t, opts = {}) => {
  ensure();
  const L = layers.map(c => { const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); return x; });
  const U = baseU(); U.time = t;
  if (opts.poster) { shotStair(L, U, t, { u: 0.55, lit: [] }); posterText(L[2], 1); }
  else for (const s of SHOTS) if (t >= s.t0 && t < s.t1) { s.fn(L, U, t - s.t0, t); break; }
  gl.render(U, layers);
  return true;
};
window.ASC_SHOTS = SHOTS;
})();
