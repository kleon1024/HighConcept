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
const PEAK = { rim: hx('#ffe6a8'), litFace: hx('#8ff2c8'), top: hx('#1fb39a'), mid: hx('#1f58c0'), shade: hx('#141a5a'), low: hx('#1c1f6a'), base: hx('#100b34'),
  cun: hx('#d8fff0'), cun2: hx('#0c1450'), mist: hx('#ffa880'), pine: hx('#0b3440'), moss: hx('#1f8a5a'), wood: hx('#3a1530'), window: hx('#ffb347'),
  roof: hx('#151040'), gold: GOLD, fall: hx('#9ff6ff') };
const STAIR = { tread: hx('#e2b8a8'), riser: hx('#34307e'), riserTop: hx('#6a5aa8'), lip: hx('#ffe6a0'), under: hx('#141245'), rail: hx('#ffd9a0'), lamp: hx('#ffb54a'), ramp: hx('#f2d2b8'), relief: hx('#b0703a') };
const FIG = { figRim: hx('#fff0c0'), figTop: hx('#2a2a6a'), figBot: hx('#16123e'), lining: hx('#ff3b30'), sash: hx('#ff3f8a'), gold: GOLD,
  ribbonA: hx('#ff3b30'), ribbonA2: hx('#ff2f9a'), ribbonB: hx('#2fe6ff'), ribbonB2: hx('#3a6bff') };
const STROKES = [hx('#ff3b30'), hx('#ff8a2a'), hx('#ffd36b'), hx('#21d4e6'), hx('#ff3fa4'), hx('#fff3d6'), hx('#2f6bff'), hx('#18e0b0')];

// ───────── uniforms with sensible defaults
const baseU = () => ({
  time: 0, uSkyTop: hx('#0d1150'), uSkyMid: hx('#7a2f9a'), uSkyHor: hx('#ffb98a'), uHorY: 0.385, uSkyMidY: 0.62,
  uCore: [540, H - 560], uCoreR: 70, uCoreCol: WHITE, uCoreHalo: hx('#ffb27a'), uCoreInt: 1.0, uHaloR: 180,
  uRays: 0.35, uRayRot: 0, uRayN: 10, uStars: 0.6, uStroke: 1.0, uStrokeDir: [0.94, 0.34],
  clouds: [{ type: 0 }, { type: 0 }],
  bloomThr: 0.74, uBloom: 0.6, uCA: 0.7, uGrain: 0.055, uHalf: 0.5, uVig: 0.55, uExpo: 1.7, uSat: 1.28, uFlash: 0,
  uFlashCol: WHITE, uVigCol: hx('#1a0c3a'), uBloomTint: [1.0, 0.9, 0.82], uLift: [0.008, 0.0, 0.03], uGain: [1, 1, 1],
});
const coreAt = (U, x, y) => { U.uCore = [x, H - y]; }; // screen (y down) → GL (y up)
const seaCloud = (o) => ({ type: 1, P: [o.hor, o.fov ?? 1.2, o.scale ?? 1.6, o.cov ?? 0.42], Q: [o.haze ?? 0.25, o.amp ?? 0.45, o.rimK ?? 1.2, o.detail ?? 0.35],
  R: [o.lightElev ?? 0.35, o.lightX ?? 0, 1, 0], lit: o.lit, sh: o.sh, haze: o.hazeCol, rim: o.rim, drift: o.drift || [0, 0], op: o.op ?? 1 });
const bankCloud = (o) => ({ type: 2, P: [o.y0, o.y1, o.scale ?? 3, o.cov ?? 0.5], Q: [o.edge ?? 0.06, o.soft ?? 0.18, o.lightK ?? 6, o.hz ?? 0],
  R: [0, 0, o.rimK ?? 1, 0], lit: o.lit, sh: o.sh, haze: o.hazeCol || o.lit, rim: o.rim, drift: o.drift || [0, 0], op: o.op ?? 1 });
const ceilCloud = (o) => ({ ...seaCloud(o), type: 3 });

// ───────── SHOT: 一重天 — the endless stair to the ring gate over the sea of clouds (hero / style frame)
function shotStair(L, U, t, k) {
  // k: {u: 0..1 progress, push: camera push, poster:bool}
  const u = k.u ?? 0.5, push = k.push ?? 0;
  const [b, m, f] = L;
  const cy = 560 + 70 * (1 - u) - push * 40, cx = 540;
  U.uSkyTop = hx('#050b3e'); U.uSkyMid = hx('#0f6f9a'); U.uSkyHor = hx('#ffb25a'); U.uSkyMidY = 0.66; U.uHorY = 0.39 - push * 0.02;
  coreAt(U, cx, cy); U.uCoreR = 34 * (1 + push * 0.3); U.uHaloR = 110; U.uCoreInt = 0.85; U.uCoreHalo = hx('#ffa040'); U.uRays = 0.3; U.uHaloR = 150; U.uRayRot = t * 0.15; U.uStars = 0.7;
  const horPx = (1 - U.uHorY) * H;
  // far haze peaks near the horizon
  const hazeC = hx('#ffb070');
  [[170, horPx + 12, 170, 120, 31, 0.62], [880, horPx + 8, 210, 150, 47, 0.6], [640, horPx + 4, 110, 70, 52, 0.7], [420, horPx + 6, 90, 60, 61, 0.72]].forEach(([x, y, w, h, s, hz]) =>
    A.peak(b, { x, y: y + push * 10, w, h, seed: s, pal: PEAK, haze: hz, hazeCol: hazeC, light: [x < 540 ? 1 : -1, -1], detail: 0 }));
  // rings: outer orbit + main gate
  const R = 385 * (1 + push * 0.25);
  A.haloRing(b, { x: cx, y: cy, r: R * 1.32, tilt: 0.22, rot: -0.18, col: GOLD, alpha: 0.55, n: 160, dots: 24, dotCol: hx('#ff6a3a') });
  A.haloRing(b, { x: cx, y: cy, r: R * 1.22, col: GOLD, alpha: 0.5, n: 120, dots: 8, dotR: 3, dotCol: hx('#7af0ff'), rot: t * 0.05 });
  A.strokes(b, { cx, cy, t, n: 900, seed: 4, r0: R * 1.04, r1: R * 1.55, pal: STROKES, swirl: 0.3, inflow: 0.0, width: 2.6, alpha: 0.8, len: 0.75, lanes: 9 });
  A.ring(b, { x: cx, y: cy, r: R, pal: RING_JADE, spin: t * 0.12, alpha: 1, seed: 7 });
  // sea of clouds
  U.clouds[0] = seaCloud({ hor: U.uHorY, fov: 1.25, scale: 1.25, cov: 0.4, amp: 0.5, haze: 0.16, rimK: 0.8, detail: 0.4, lightElev: 0.25,
    lit: hx('#ff7a5a'), alt: hx('#ff5a9a'), sh: hx('#1c1c80'), hazeCol: hx('#ffa060'), rim: hx('#ffe2a0'), drift: [t * 0.03, t * 0.12] });
  // mid peaks framing left / right (青绿)
  A.peak(m, { x: 110, y: 1080 + push * 30, w: 400, h: 640, seed: 11, pal: PEAK, haze: 0.05, hazeCol: hazeC, light: [1, -1], pavilion: true, falls: 18, t });
  A.peak(m, { x: 990, y: 990 + push * 30, w: 320, h: 520, seed: 23, pal: PEAK, haze: 0.12, hazeCol: hazeC, light: [-1, -1], pavilion: true, falls: 12, t });
  // stair to the gate
  const st = { xb: 540, yb: 2080, wb: 270, xv: cx, yv: cy + 30, z0: 1, dz: 0.05, n: 260, pal: STAIR, haze: 0.06, hazeCol: hx('#ffd6b0'), offset: k.stepOff || 0, litSteps: k.lit };
  A.stair(m, st);
  // cultivator on the stair
  const fi = k.figStep ?? 8; const fp = A.stairAt(st, fi);
  A.figure(m, { x: fp.x, y: fp.y, s: fp.w * 1.15, t, wind: [0.35, -1], light: [0, -1], pal: FIG, bagua: 0.7 });
  // front cloud bank
  U.clouds[1] = bankCloud({ y0: 0.17, y1: -0.05, scale: 3.0, cov: 0.46, soft: 0.16, edge: 0.06, lightK: 8, rimK: 0.7, lit: hx('#3a2a8a'), alt: hx('#1a4a8a'), sh: hx('#0a0a35'), rim: hx('#ffb070'), drift: [t * 0.03, t * 0.015] });
  // rising rain & bokeh
  A.rain(f, { t, n: 230, seed: 5, col: hx('#9ff0ff'), headCol: hx('#fff6dc'), speed: 330, len: 70, alpha: 0.9, bokeh: 7 });
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

// ───────── timeline
const SHOTS = [];
const shot = (t0, t1, fn) => SHOTS.push({ t0, t1, fn });
shot(0, 30, (L, U, t) => { shotStair(L, U, t, { u: t / 30 }); });

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
  else for (const s of SHOTS) if (t >= s.t0 && t < s.t1) s.fn(L, U, t - s.t0, t);
  gl.render(U, layers);
  return true;
};
window.ASC_SHOTS = SHOTS;
})();
