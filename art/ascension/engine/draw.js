// 飞升 ASCENSION — Canvas2D painters: ring gates with hairline ornament, endless stairs, floating peaks,
// tiered palace, the lone cultivator (rim-lit silhouette with ribbons), rising rain, brush-stroke streams, type.
(function () {
const A = {};
// ───────── utilities
A.rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
A.clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
A.lerp = (a, b, t) => a + (b - a) * t;
A.sstep = (a, b, x) => { const t = A.clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
A.eio = (t) => { t = A.clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
A.eo = (t) => 1 - Math.pow(1 - A.clamp(t), 3);
A.ei = (t) => Math.pow(A.clamp(t), 3);
A.eo5 = (t) => 1 - Math.pow(1 - A.clamp(t), 5);
A.hex = (h) => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]; };
A.mix = (a, b, t) => [A.lerp(a[0], b[0], t), A.lerp(a[1], b[1], t), A.lerp(a[2], b[2], t)];
A.css = (c, a = 1) => `rgba(${Math.round(A.clamp(c[0]) * 255)},${Math.round(A.clamp(c[1]) * 255)},${Math.round(A.clamp(c[2]) * 255)},${A.clamp(a)})`;
A.mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const hh = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
A.n1 = (x, seed = 0) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return A.lerp(hh(i + seed * 17.3), hh(i + 1 + seed * 17.3), u); };
A.fbm1 = (x, seed = 0, o = 4) => { let s = 0, a = .5; for (let i = 0; i < o; i++) { s += a * A.n1(x, seed + i * 3.7); x *= 2.03; a *= .5; } return s / (1 - Math.pow(.5, o)); };
const TAU = Math.PI * 2;

// ───────── ring gate: concentric bands of hairline ornament around an open light core
// o: {x,y,r,tilt,rot,alpha,haze,hazeCol,pal,lightIn,detail,seed,spin}
A.ring = (ctx, o) => {
  const P = o.pal, a0 = o.alpha ?? 1, r = o.r; if (r < 2 || a0 <= 0) return;
  const hz = o.haze || 0, hc = o.hazeCol || [1, 1, 1];
  const col = (c) => A.mix(c, hc, hz);
  const tilt = o.tilt ?? 1, rot = o.rot || 0, sp = o.spin || 0;
  const px = Math.max(0.55, Math.min(1.6, r / 380)); // hairline scale
  const IN = o.inner ?? 0.7; const R_ = (f) => r * (IN + (f - 0.6) / 0.4 * (1 - IN)); // remap 0.6..1 band layout to IN..1
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(1, tilt); ctx.rotate(rot);
  const lw = (w) => w * px;
  // halo: hairline radial rays (背光) + a few soft flame tongues
  if (o.flames !== false) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.rotate(sp * 0.25);
    const nr = 144; ctx.lineWidth = lw(0.8);
    for (let i = 0; i < nr; i++) { const a = i / nr * TAU; const ln = r * (0.06 + 0.22 * Math.pow(A.n1(i * 0.9, 5), 2) + (i % 12 === 0 ? 0.18 : 0));
      const gg = ctx.createLinearGradient(Math.cos(a) * r, Math.sin(a) * r, Math.cos(a) * (r + ln), Math.sin(a) * (r + ln));
      gg.addColorStop(0, A.css(col(P.gold), 0.55 * a0)); gg.addColorStop(1, A.css(col(P.gold), 0));
      ctx.strokeStyle = gg; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 1.01, Math.sin(a) * r * 1.01); ctx.lineTo(Math.cos(a) * (r + ln), Math.sin(a) * (r + ln)); ctx.stroke(); }
    const nf = 12;
    for (let i = 0; i < nf; i++) { const a = (i + 0.5) / nf * TAU; const ln = r * 0.3;
      const fg = ctx.createRadialGradient(0, 0, r, 0, 0, r + ln); fg.addColorStop(0, A.css(col(P.flame), 0.22 * a0)); fg.addColorStop(1, A.css(col(P.flame2), 0));
      ctx.fillStyle = fg; ctx.beginPath(); const w = 0.05;
      ctx.moveTo(Math.cos(a - w) * r, Math.sin(a - w) * r); ctx.quadraticCurveTo(Math.cos(a) * (r + ln * 0.6), Math.sin(a) * (r + ln * 0.6), Math.cos(a + 0.03) * (r + ln), Math.sin(a + 0.03) * (r + ln));
      ctx.quadraticCurveTo(Math.cos(a + w * 0.4) * (r + ln * 0.3), Math.sin(a + w * 0.4) * (r + ln * 0.3), Math.cos(a + w) * r, Math.sin(a + w) * r); ctx.fill(); }
    ctx.restore();
  }
  // inner tube (the gate has depth): the inside surface shows as a lit crescent towards the far side
  if ((o.depth ?? 0.12) > 0) { const d = r * (o.depth ?? 0.12), ri = R_(0.6);
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, ri, 0, TAU); ctx.clip();
    const tg = ctx.createLinearGradient(0, -ri, 0, -ri + d * 2.2);
    tg.addColorStop(0, A.css(col(P.tubeLit || P.spill), 0.95 * a0)); tg.addColorStop(1, A.css(col(P.tube || P.body), 0.95 * a0));
    ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(0, 0, ri, 0, TAU); ctx.arc(0, d, ri * 0.985, 0, TAU, true); ctx.fill('evenodd');
    ctx.strokeStyle = A.css(col(P.gold), 0.6 * a0); ctx.lineWidth = lw(0.7);
    for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.arc(0, d * k / 4, ri * (1 - 0.015 * k / 4), Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); }
    ctx.strokeStyle = A.css(col(P.gold), 0.9 * a0); ctx.lineWidth = lw(1.1); ctx.beginPath(); ctx.arc(0, d, ri * 0.985, Math.PI * 1.03, Math.PI * 1.97); ctx.stroke();
    ctx.restore(); }
  // body band (jade / lacquer), lit from the inner edge
  const g = ctx.createRadialGradient(0, 0, R_(0.6), 0, 0, r * 1.0);
  g.addColorStop(0, A.css(col(P.bodyLit), 0.95 * a0)); g.addColorStop(0.12, A.css(col(P.body), 0.95 * a0));
  g.addColorStop(0.85, A.css(col(P.bodyDark), 0.97 * a0)); g.addColorStop(1, A.css(col(P.bodyLit), 0.9 * a0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.arc(0, 0, R_(0.6), 0, TAU, true); ctx.fill();
  const gold = A.css(col(P.gold), a0), goldDim = A.css(col(P.gold), 0.55 * a0);
  const circle = (rr, w, s) => { ctx.strokeStyle = s; ctx.lineWidth = lw(w); ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke(); };
  // outer rims
  circle(r, 1.6, gold); circle(R_(0.975), 0.7, goldDim); circle(R_(0.955), 0.7, goldDim);
  // tick ring
  ctx.save(); ctx.rotate(sp);
  ctx.strokeStyle = goldDim; ctx.lineWidth = lw(0.8); ctx.beginPath();
  const nt = 180;
  for (let i = 0; i < nt; i++) { const a = i / nt * TAU, l = i % 15 === 0 ? 0.05 : (i % 5 === 0 ? 0.03 : 0.016);
    ctx.moveTo(Math.cos(a) * R_(0.945), Math.sin(a) * R_(0.945)); ctx.lineTo(Math.cos(a) * R_(0.945 - l), Math.sin(a) * R_(0.945 - l)); }
  ctx.stroke();
  // star studs
  ctx.fillStyle = A.css(col(P.gem), a0);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.beginPath(); ctx.arc(Math.cos(a) * R_(0.92), Math.sin(a) * R_(0.92), lw(2.6), 0, TAU); ctx.fill(); }
  ctx.restore();
  circle(R_(0.885), 0.9, gold);
  // lotus petal band
  ctx.save(); ctx.rotate(-sp * 0.6);
  const np = o.petals || 32, rIn = R_(0.735), rOut = R_(0.875);
  for (let i = 0; i < np; i++) {
    const a = (i + 0.5) / np * TAU, da = TAU / np * 0.48;
    const c = i % 2 ? P.petalA : P.petalB;
    const pg = ctx.createRadialGradient(0, 0, rIn, 0, 0, rOut);
    pg.addColorStop(0, A.css(col(c), 0.95 * a0)); pg.addColorStop(1, A.css(col(A.mul(c, 0.35)), 0.85 * a0));
    ctx.fillStyle = pg; ctx.beginPath();
    ctx.moveTo(Math.cos(a - da) * rIn, Math.sin(a - da) * rIn);
    ctx.bezierCurveTo(Math.cos(a - da * 1.05) * (rIn + (rOut - rIn) * 0.6), Math.sin(a - da * 1.05) * (rIn + (rOut - rIn) * 0.6),
      Math.cos(a - da * 0.25) * rOut * 0.99, Math.sin(a - da * 0.25) * rOut * 0.99, Math.cos(a) * rOut, Math.sin(a) * rOut);
    ctx.bezierCurveTo(Math.cos(a + da * 0.25) * rOut * 0.99, Math.sin(a + da * 0.25) * rOut * 0.99,
      Math.cos(a + da * 1.05) * (rIn + (rOut - rIn) * 0.6), Math.sin(a + da * 1.05) * (rIn + (rOut - rIn) * 0.6), Math.cos(a + da) * rIn, Math.sin(a + da) * rIn);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = gold; ctx.lineWidth = lw(0.9); ctx.stroke();
    // inner vein
    ctx.strokeStyle = goldDim; ctx.lineWidth = lw(0.6); ctx.beginPath();
    ctx.moveTo(Math.cos(a) * rIn * 1.03, Math.sin(a) * rIn * 1.03); ctx.lineTo(Math.cos(a) * rOut * 0.95, Math.sin(a) * rOut * 0.95); ctx.stroke();
  }
  ctx.restore();
  circle(R_(0.73), 1.1, gold);
  // trigram + glyph band
  ctx.save(); ctx.rotate(sp * 0.4);
  const tri = ['111', '011', '101', '001', '110', '010', '100', '000'];
  ctx.strokeStyle = gold; ctx.lineWidth = lw(2.2);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU; ctx.save(); ctx.rotate(a + Math.PI / 2);
    for (let k = 0; k < 3; k++) { const yy = -R_(0.705 - k * 0.022), hw = r * 0.03;
      ctx.beginPath(); if (tri[i][k] === '1') { ctx.moveTo(-hw, yy); ctx.lineTo(hw, yy); } else { ctx.moveTo(-hw, yy); ctx.lineTo(-hw * 0.18, yy); ctx.moveTo(hw * 0.18, yy); ctx.lineTo(hw, yy); } ctx.stroke(); }
    ctx.restore();
    // seal-glyph marks between trigrams
    const rr = A.rng((o.seed || 7) + i * 13);
    ctx.save(); ctx.rotate(a + TAU / 16 + Math.PI / 2); ctx.lineWidth = lw(0.8); ctx.strokeStyle = goldDim;
    for (let k = 0; k < 5; k++) { const x0 = (k - 2) * r * 0.026, y0 = -R_(0.66);
      ctx.beginPath(); ctx.rect(x0 - r * 0.009, y0 - r * 0.016, r * 0.018, r * 0.032);
      for (let m = 0; m < 3; m++) { const yy = y0 - r * 0.013 + rr() * r * 0.026; ctx.moveTo(x0 - r * 0.009, yy); ctx.lineTo(x0 + (rr() - 0.3) * r * 0.009, yy); }
      ctx.stroke(); }
    ctx.restore();
  }
  ctx.restore();
  circle(R_(0.625), 0.8, goldDim); circle(R_(0.6), 1.6, A.css(col(P.innerRim), a0));
  // inner rim light (core spill)
  const li = o.lightIn ?? 1;
  if (li > 0) { ctx.globalCompositeOperation = 'lighter';
    const ig = ctx.createRadialGradient(0, 0, R_(0.56), 0, 0, R_(0.72));
    ig.addColorStop(0, A.css(P.spill, 0)); ig.addColorStop(0.25, A.css(P.spill, 0.22 * li * a0)); ig.addColorStop(1, A.css(P.spill, 0));
    ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(0, 0, R_(0.72), 0, TAU); ctx.arc(0, 0, R_(0.56), 0, TAU, true); ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; }
  ctx.restore();
};

// simple outer halo ring of fine lines (for second/third rings)
A.haloRing = (ctx, o) => {
  const a0 = o.alpha ?? 1; ctx.save(); ctx.translate(o.x, o.y); ctx.scale(1, o.tilt ?? 1); ctx.rotate(o.rot || 0);
  const c = A.css(o.col, a0), c2 = A.css(o.col, 0.45 * a0), r = o.r;
  ctx.strokeStyle = c; ctx.lineWidth = o.lw || 1.2; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = c2; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, 0, r * 0.985, 0, TAU); ctx.stroke();
  ctx.beginPath(); const n = o.n || 96;
  for (let i = 0; i < n; i++) { const a = i / n * TAU, l = i % 8 === 0 ? 0.035 : 0.014;
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * r * (1 + l), Math.sin(a) * r * (1 + l)); }
  ctx.stroke();
  if (o.dots) { ctx.fillStyle = A.css(o.dotCol || o.col, a0); for (let i = 0; i < o.dots; i++) { const a = i / o.dots * TAU;
    ctx.beginPath(); ctx.arc(Math.cos(a) * r * 1.02, Math.sin(a) * r * 1.02, o.dotR || 2.5, 0, TAU); ctx.fill(); } }
  ctx.restore();
};

// ───────── endless stair rising to a vanishing point (2D perspective)
// o: {xb,yb (base centre), wb (base half width), xv,yv (vanishing), z0, dz, n, pal, haze, hazeCol, t, litSteps:[{i,k}], alpha}
A.stair = (ctx, o) => {
  const P = o.pal, n = o.n || 160, z0 = o.z0 || 1, dz = o.dz || 0.09, a0 = o.alpha ?? 1, off = o.offset || 0;
  const S = []; // per step screen geometry
  for (let i = -1; i <= n; i++) {
    const z = z0 + (i - off) * dz; if (z <= 0.05) continue;
    const u = 1 - z0 / z; // 0 at base, ->1 at infinity
    S.push({ i, z, x: A.lerp(o.xb, o.xv, u), y: A.lerp(o.yb, o.yv, u), w: o.wb * z0 / z });
  }
  const hzc = o.hazeCol || [1, 1, 1];
  const hazeOf = (z) => A.clamp(1 - Math.exp(-(z - z0) * (o.haze || 0.12)));
  // supports / stringers under the stair (dark, fading)
  for (let k = S.length - 1; k > 0; k--) {
    const s0 = S[k], s1 = S[k - 1]; const hz = hazeOf(s0.z);
    if (s0.w < 0.25) continue;
    const dep = (s0.w * 0.35);
    ctx.fillStyle = A.css(A.mix(P.under, hzc, hz), a0 * (1 - hz * 0.6));
    ctx.beginPath(); ctx.moveTo(s0.x - s0.w, s0.y); ctx.lineTo(s1.x - s1.w, s1.y); ctx.lineTo(s1.x - s1.w * 0.85, s1.y + dep * 1.9); ctx.lineTo(s0.x - s0.w * 0.85, s0.y + dep * 1.9); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s0.x + s0.w, s0.y); ctx.lineTo(s1.x + s1.w, s1.y); ctx.lineTo(s1.x + s1.w * 0.85, s1.y + dep * 1.9); ctx.lineTo(s0.x + s0.w * 0.85, s0.y + dep * 1.9); ctx.fill();
  }
  // steps from far to near
  for (let k = S.length - 1; k > 0; k--) {
    const s0 = S[k], s1 = S[k - 1]; // s1 is nearer (lower on screen)
    if (s0.w < 0.2) continue;
    const hz = hazeOf(s0.z); const gap = s1.y - s0.y; if (gap < 0.15) { continue; }
    const lip = s0.y + gap * 0.38;
    // tread (lit from the core above)
    ctx.fillStyle = A.css(A.mix(P.tread, hzc, hz), a0);
    ctx.beginPath(); ctx.moveTo(s0.x - s0.w, s0.y); ctx.lineTo(s0.x + s0.w, s0.y); ctx.lineTo(A.lerp(s0.x, s1.x, .38) + A.lerp(s0.w, s1.w, .38), lip); ctx.lineTo(A.lerp(s0.x, s1.x, .38) - A.lerp(s0.w, s1.w, .38), lip); ctx.fill();
    // riser (in shadow, coloured)
    const rg = ctx.createLinearGradient(0, lip, 0, s1.y);
    rg.addColorStop(0, A.css(A.mix(P.riserTop, hzc, hz), a0)); rg.addColorStop(1, A.css(A.mix(P.riser, hzc, hz), a0));
    ctx.fillStyle = rg; ctx.beginPath();
    ctx.moveTo(A.lerp(s0.x, s1.x, .38) - A.lerp(s0.w, s1.w, .38), lip); ctx.lineTo(A.lerp(s0.x, s1.x, .38) + A.lerp(s0.w, s1.w, .38), lip);
    ctx.lineTo(s1.x + s1.w, s1.y); ctx.lineTo(s1.x - s1.w, s1.y); ctx.fill();
    // gold lip hairline (bloom picks it up)
    let lit = 0; if (o.litSteps) for (const L of o.litSteps) if (L.i === s0.i) lit = Math.max(lit, L.k);
    ctx.strokeStyle = A.css(A.mix(P.lip, hzc, hz * 0.7), a0 * (0.55 + 0.45 * (1 - hz)) * (1 + lit));
    ctx.lineWidth = Math.max(0.5, Math.min(2.2, s0.w / 90)) * (1 + lit * 1.5);
    ctx.beginPath(); ctx.moveTo(s0.x - s0.w, s0.y); ctx.lineTo(s0.x + s0.w, s0.y); ctx.stroke();
    if (lit > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.css(P.lip, 0.35 * lit * a0);
      ctx.fillRect(s0.x - s0.w, s0.y - gap * 0.2, s0.w * 2, gap * 0.6); ctx.globalCompositeOperation = 'source-over'; }
  }
  // balustrade: posts + rails, lamps every 8 steps
  for (const side of [-1, 1]) {
    ctx.strokeStyle = A.css(P.rail, a0 * 0.9); ctx.beginPath();
    let first = true;
    for (let k = S.length - 1; k >= 0; k--) { const s = S[k]; if (s.w < 0.3) continue; const h = s.w * 0.22;
      const x = s.x + side * s.w, y = s.y - h; if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y); }
    ctx.lineWidth = 1.0; ctx.stroke();
    for (let k = S.length - 1; k >= 0; k--) { const s = S[k]; if (s.w < 0.6) continue; const h = s.w * 0.22, hz = hazeOf(s.z);
      if (s.i % 2 === 0) { ctx.strokeStyle = A.css(A.mix(P.rail, hzc, hz), a0 * 0.8); ctx.lineWidth = Math.max(0.6, s.w / 160);
        ctx.beginPath(); ctx.moveTo(s.x + side * s.w, s.y); ctx.lineTo(s.x + side * s.w, s.y - h); ctx.stroke(); }
      if (s.i % 8 === 0) { // lamp
        ctx.globalCompositeOperation = 'lighter';
        const rr = Math.max(1.2, s.w * 0.045), lx = s.x + side * s.w, ly = s.y - h * 1.25;
        const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, rr * 5);
        lg.addColorStop(0, A.css(P.lamp, a0 * (1 - hz * 0.7))); lg.addColorStop(0.25, A.css(P.lamp, 0.35 * a0 * (1 - hz))); lg.addColorStop(1, A.css(P.lamp, 0));
        ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, ly, rr * 5, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over'; }
    }
  }
  return S;
};
// screen position on the stair for a step index (fractional)
A.stairAt = (o, i) => { const z = (o.z0 || 1) + (i - (o.offset || 0)) * (o.dz || 0.09); const u = 1 - (o.z0 || 1) / z;
  return { x: A.lerp(o.xb, o.xv, u), y: A.lerp(o.yb, o.yv, u), w: o.wb * (o.z0 || 1) / z, z }; };

// ───────── floating peak cluster (浮空峰): stone pillars with lit / shadow faces, vertical cun hairlines,
// pine crowns, a pavilion and upward light-falls; the base dissolves into mist.
const peakCache = {};
const peakShape = (seed) => {
  if (peakCache[seed]) return peakCache[seed];
  const r = A.rng(seed); const cols = [];
  const nc = 3 + Math.floor(r() * 3);
  for (let i = 0; i < nc; i++) { const main = i === 0;
    cols.push({ x: main ? (r() - 0.5) * 0.15 : (r() - 0.5) * 0.75, w: main ? 0.2 + r() * 0.08 : 0.08 + r() * 0.12, h: main ? 1.0 : 0.35 + r() * 0.5, seed: r() * 100, tilt: (r() - 0.5) * 0.08 }); }
  cols.sort((a, b) => a.h - b.h);
  peakCache[seed] = { cols, r: A.rng(seed + 77) };
  return peakCache[seed];
};
// o: {x,y (base centre), w, h, seed, pal, haze, hazeCol, light:[dx,dy], alpha, pavilion, falls, t, detail}
A.peak = (ctx, o) => {
  const S = peakShape(o.seed), P = o.pal, a0 = o.alpha ?? 1, hz = o.haze || 0, hc = o.hazeCol || [1, 1, 1];
  const C = (c) => A.mix(c, hc, hz); const lx = (o.light || [1, -1])[0] >= 0 ? 1 : -1;
  const det = (o.detail ?? 1) > 0 && o.w > 50;
  // draw back (short) columns first, main last: columns are sorted by height ascending → draw tall ones behind? draw descending height
  const cols = [...S.cols].sort((a, b) => b.h - a.h);
  cols.forEach((c, ci) => {
    const cx = o.x + c.x * o.w, cw = c.w * o.w, ch = c.h * o.h, top = o.y - ch;
    const N = 26, Lp = [], Rp = [];
    for (let i = 0; i <= N; i++) { const u = i / N; const y = A.lerp(top, o.y + o.h * 0.42 * (1 - Math.abs(c.x)), u);
      const taper = u < 0.06 ? Math.sqrt(u / 0.06) * 0.85 + 0.15 : (u > 0.62 ? Math.max(0.02, 1 - (u - 0.62) / 0.38) : 1);
      const jag = (A.fbm1(u * 9 + c.seed, 3, 3) - 0.5) * 0.35, jag2 = (A.fbm1(u * 9 + c.seed + 40, 5, 3) - 0.5) * 0.35;
      Lp.push([cx - cw / 2 * taper * (1 + jag) + c.tilt * (top - y), y]); Rp.push([cx + cw / 2 * taper * (1 + jag2) + c.tilt * (top - y), y]); }
    const path = () => { ctx.beginPath(); Lp.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); for (let i = N; i >= 0; i--) ctx.lineTo(Rp[i][0], Rp[i][1]); ctx.closePath(); };
    // rim
    path(); ctx.fillStyle = A.css(C(P.rim), a0); ctx.fill();
    ctx.save(); ctx.translate(-lx * Math.max(1.2, cw * 0.025), Math.max(1, cw * 0.02));
    path(); ctx.save(); ctx.clip();
    // cylinder shading: shadow face → lit face (towards the light)
    const g = ctx.createLinearGradient(cx - lx * cw / 2, 0, cx + lx * cw / 2, 0);
    g.addColorStop(0, A.css(C(P.shade), a0)); g.addColorStop(0.45, A.css(C(P.mid), a0)); g.addColorStop(0.8, A.css(C(P.top), a0)); g.addColorStop(1, A.css(C(P.litFace || P.top), a0));
    ctx.fillStyle = g; ctx.fillRect(cx - cw, top - 10, cw * 2, o.h * 1.6);
    // vertical value: darker and cooler towards the base
    const vg = ctx.createLinearGradient(0, top, 0, o.y + o.h * 0.4);
    vg.addColorStop(0, A.css(C(P.low), 0)); vg.addColorStop(0.55, A.css(C(P.low), 0.55 * a0)); vg.addColorStop(1, A.css(C(P.base), 0.95 * a0));
    ctx.fillStyle = vg; ctx.fillRect(cx - cw, top - 10, cw * 2, o.h * 1.6);
    if (det) { // vertical cun hairlines + horizontal strata
      const r = A.rng(Math.floor(c.seed * 1000)); ctx.lineCap = 'round';
      for (let k = 0; k < 18 + cw / 4; k++) { const fx = r(), x = cx - cw / 2 + fx * cw, y0 = top + r() * ch * 0.7, ln = (0.08 + r() * 0.3) * ch;
        const lit = (fx - 0.5) * lx > 0.1; ctx.strokeStyle = A.css(C(lit ? P.cun : P.cun2), (lit ? 0.55 : 0.4) * a0); ctx.lineWidth = Math.max(0.5, cw / 120);
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + (r() - 0.5) * cw * 0.08, y0 + ln * 0.5, x + (r() - 0.5) * cw * 0.05, y0 + ln); ctx.stroke(); }
      for (let k = 0; k < 6; k++) { const y = top + ch * (0.12 + r() * 0.5); ctx.strokeStyle = A.css(C(P.cun2), 0.35 * a0); ctx.lineWidth = Math.max(0.5, cw / 160);
        ctx.beginPath(); ctx.moveTo(cx - cw / 2, y); ctx.quadraticCurveTo(cx, y + (r() - 0.5) * ch * 0.04, cx + cw / 2, y + (r() - 0.5) * ch * 0.03); ctx.stroke(); }
    }
    ctx.restore(); ctx.restore();
    // crown: pines / green moss on the top (rim-lit blobs)
    if (cw > 10) { const r = A.rng(Math.floor(c.seed * 777)); const nb = 5 + Math.floor(cw / 12);
      for (let k = 0; k < nb; k++) { const bx = cx + (r() - 0.5) * cw * 0.95 + c.tilt * 0, by = top + 2 + r() * cw * 0.12, br = cw * (0.07 + r() * 0.09);
        ctx.fillStyle = A.css(C(P.rim), 0.9 * a0); ctx.beginPath(); ctx.ellipse(bx + lx * br * 0.18, by - br * 0.15, br * 1.15, br * 0.62, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = A.css(C(k % 3 ? P.pine : P.moss), a0); ctx.beginPath(); ctx.ellipse(bx, by, br * 1.15, br * 0.62, 0, 0, TAU); ctx.fill(); }
      if (ci === cols.length - 1 && o.pavilion && cw > 30) A.pavilion(ctx, { x: cx + cw * 0.05, y: top + cw * 0.02, s: Math.min(cw * 0.55, o.w * 0.14), pal: P, haze: hz, hazeCol: hc, alpha: a0 });
    }
  });
  // mist veil around the base
  const mg = ctx.createLinearGradient(0, o.y - o.h * 0.2, 0, o.y + o.h * 0.45);
  mg.addColorStop(0, A.css(C(P.mist), 0)); mg.addColorStop(0.55, A.css(C(P.mist), 0.35 * a0)); mg.addColorStop(1, A.css(C(P.mist), 0));
  ctx.fillStyle = mg; ctx.fillRect(o.x - o.w * 0.7, o.y - o.h * 0.2, o.w * 1.4, o.h * 0.65);
  // upward light-falls (rising streams from the underside)
  if (o.falls) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = A.rng(o.seed + 11);
    for (let i = 0; i < o.falls; i++) { const fx = o.x + (r() - 0.5) * o.w * 0.5, fy = o.y + o.h * 0.3 * r(); const len = o.h * (0.5 + r() * 0.8);
      const ph = ((o.t || 0) * 0.4 + r()) % 1; const lg = ctx.createLinearGradient(0, fy, 0, fy - len);
      lg.addColorStop(0, A.css(C(P.fall), 0)); lg.addColorStop(A.clamp(ph * 0.8 + 0.1), A.css(C(P.fall), 0.35 * a0)); lg.addColorStop(1, A.css(C(P.fall), 0));
      ctx.strokeStyle = lg; ctx.lineWidth = Math.max(0.6, o.w * 0.004); ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + (r() - .5) * 6, fy - len); ctx.stroke(); }
    ctx.restore(); }
};

// tiny pavilion: base, two-tier roof with upturned eaves, warm window
A.pavilion = (ctx, o) => {
  const s = o.s, P = o.pal, a0 = o.alpha ?? 1, C = (c) => A.mix(c, o.hazeCol || [1, 1, 1], o.haze || 0);
  ctx.save(); ctx.translate(o.x, o.y);
  ctx.fillStyle = A.css(C(P.wood), a0); ctx.fillRect(-s * 0.32, -s * 0.5, s * 0.64, s * 0.5);
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = A.css(P.window, 0.9 * a0);
  ctx.fillRect(-s * 0.2, -s * 0.38, s * 0.12, s * 0.22); ctx.fillRect(s * 0.08, -s * 0.38, s * 0.12, s * 0.22);
  ctx.globalCompositeOperation = 'source-over';
  const roof = (y, w, h) => { ctx.fillStyle = A.css(C(P.roof), a0); ctx.beginPath(); ctx.moveTo(-w, y);
    ctx.quadraticCurveTo(-w * 0.55, y - h * 0.15, -w * 0.25, y - h); ctx.lineTo(w * 0.25, y - h); ctx.quadraticCurveTo(w * 0.55, y - h * 0.15, w, y); ctx.quadraticCurveTo(0, y - h * 0.3, -w, y); ctx.fill();
    ctx.strokeStyle = A.css(C(P.gold), 0.9 * a0); ctx.lineWidth = Math.max(0.5, s / 40); ctx.beginPath(); ctx.moveTo(-w, y); ctx.quadraticCurveTo(0, y - h * 0.3, w, y); ctx.stroke(); };
  roof(-s * 0.48, s * 0.62, s * 0.3); ctx.fillStyle = A.css(C(P.wood), a0); ctx.fillRect(-s * 0.18, -s * 0.85, s * 0.36, s * 0.3); roof(-s * 0.8, s * 0.42, s * 0.28);
  ctx.restore();
};

// ───────── the lone cultivator: back view, rim-lit silhouette, long hair, wide sleeves, two ribbons (披帛)
// o: {x,y (feet), s (height px), t, wind:[x,y], light:[x,y] (unit, towards light), pal, alpha, lean, rot, bagua (0..1), pose:'stand'|'fly'}
A.figure = (ctx, o) => {
  const s = o.s, t = o.t || 0, P = o.pal, a0 = o.alpha ?? 1;
  const wx = (o.wind || [0.3, -1])[0], wy = (o.wind || [0.3, -1])[1];
  const fly = o.pose === 'fly' ? 1 : 0;
  ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
  const sw = (k, ph) => Math.sin(t * k + ph);
  const hemSway = 0.025 * sw(2.1, 0); const tr = wx * 0.16 + hemSway; // hem trail follows the wind
  const shapes = [];
  // outer robe
  shapes.push(() => { ctx.beginPath(); ctx.moveTo(-0.03, -0.855);
    ctx.bezierCurveTo(-0.07, -0.85, -0.09, -0.835, -0.095, -0.795);
    ctx.bezierCurveTo(-0.11, -0.6, -0.15 + tr * 0.3, -0.3 + fly * 0.05, -0.19 + tr, 0.0 + fly * 0.06);
    for (let i = 0; i <= 10; i++) { const u = i / 10, x = A.lerp(-0.19 + tr, 0.17 + tr * 0.35, u);
      ctx.lineTo(x, 0.008 * Math.sin(i * 2.1 + t * 3.2) + fly * 0.06 * (1 - u) - 0.02 * Math.sin(u * Math.PI) ); }
    ctx.bezierCurveTo(0.15 + tr * 0.2, -0.3, 0.11, -0.6, 0.095, -0.795);
    ctx.bezierCurveTo(0.09, -0.835, 0.07, -0.85, 0.03, -0.855); ctx.closePath(); });
  // wide hanging sleeves (广袖)
  for (const sd of [-1, 1]) shapes.push(() => { const b = sw(1.7, sd) * 0.012 + wx * 0.05 + (sd < 0 ? 0 : 0.01); const lift = fly * 0.1;
    ctx.beginPath(); ctx.moveTo(sd * 0.085, -0.78);
    ctx.bezierCurveTo(sd * 0.13, -0.73 - lift, sd * 0.16, -0.62 - lift, sd * 0.175 + b, -0.5 - lift * 0.6);
    ctx.bezierCurveTo(sd * 0.19 + b * 1.3, -0.4 - lift * 0.4, sd * 0.165 + b * 1.5, -0.33 - lift * 0.3, sd * 0.125 + b, -0.35 - lift * 0.3);
    ctx.bezierCurveTo(sd * 0.105, -0.44, sd * 0.098, -0.6, sd * 0.08, -0.7); ctx.closePath(); });
  // head + bun
  shapes.push(() => { ctx.beginPath(); ctx.ellipse(0, -0.9, 0.04, 0.047, 0, 0, TAU); ctx.moveTo(0.035, -0.96); ctx.ellipse(0.004, -0.96, 0.03, 0.025, 0, 0, TAU); });
  // hair down the back
  shapes.push(() => { const h = sw(1.3, 0.5) * 0.02 + wx * 0.04; const ln = 0.4 - fly * 0.04;
    ctx.beginPath(); ctx.moveTo(-0.036, -0.9); ctx.bezierCurveTo(-0.05, -0.78, -0.04 + h * 0.5, -0.66, -0.015 + h, -0.9 + ln + fly * 0.1);
    ctx.lineTo(0.004 + h * 1.2, -0.88 + ln + fly * 0.12); ctx.bezierCurveTo(0.035 + h, -0.66, 0.05, -0.78, 0.036, -0.9); ctx.closePath(); });
  const L = o.light || [0, -1], rw = 0.014;
  // rim pass then body pass
  ctx.fillStyle = A.css(P.figRim, a0); for (const f of shapes) { f(); ctx.fill(); }
  ctx.save(); ctx.translate(-L[0] * rw, -L[1] * rw);
  const bg = ctx.createLinearGradient(0, -1, 0, 0); bg.addColorStop(0, A.css(P.figTop, a0)); bg.addColorStop(1, A.css(P.figBot, a0));
  ctx.fillStyle = bg; for (const f of shapes) { f(); ctx.fill(); }
  ctx.restore();
  // inner skirt lining glimpse + sash (saturated accents)
  ctx.fillStyle = A.css(P.lining, 0.95 * a0); ctx.beginPath();
  ctx.moveTo(-0.17 + tr * 0.9, -0.004 + fly * 0.05); ctx.quadraticCurveTo(0.0 + tr * 0.5, 0.012 + fly * 0.04, 0.15 + tr * 0.35, -0.006); ctx.lineTo(0.15 + tr * 0.35, -0.03); ctx.quadraticCurveTo(0, -0.022, -0.16 + tr * 0.9, -0.026 + fly * 0.05); ctx.fill();
  ctx.fillStyle = A.css(P.sash, 0.9 * a0); ctx.beginPath(); ctx.moveTo(-0.1, -0.6); ctx.quadraticCurveTo(0, -0.592, 0.1, -0.6); ctx.lineTo(0.102, -0.582); ctx.quadraticCurveTo(0, -0.574, -0.102, -0.582); ctx.fill();
  // sash tail streaming with the wind
  ctx.strokeStyle = A.css(P.sash, 0.85 * a0); ctx.lineWidth = 0.009; ctx.beginPath(); ctx.moveTo(0.03, -0.585);
  ctx.bezierCurveTo(0.05 + wx * 0.06, -0.5, 0.04 + wx * 0.12 + sw(2.4, 1) * 0.02, -0.42, 0.06 + wx * 0.18, -0.34); ctx.stroke();
  // gold hairline embroidery: hem band, cuffs, bagua on the back
  ctx.strokeStyle = A.css(P.gold, 0.85 * a0); ctx.lineWidth = 1.1 / s;
  ctx.beginPath(); ctx.moveTo(-0.18 + tr * 0.95, -0.045 + fly * 0.05); ctx.quadraticCurveTo(0, -0.06, 0.16 + tr * 0.35, -0.045); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-0.03, -0.85); ctx.bezierCurveTo(-0.02, -0.6, -0.02 + tr * 0.2, -0.3, -0.01 + tr * 0.5, -0.05); ctx.stroke();
  const bq = o.bagua ?? 0.6;
  if (bq > 0) { ctx.save(); ctx.translate(0, -0.7); ctx.rotate(t * 0.4); ctx.strokeStyle = A.css(P.gold, bq * a0); ctx.lineWidth = 0.8 / s;
    ctx.beginPath(); ctx.arc(0, 0, 0.04, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 0.031, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i / 8 * TAU); ctx.beginPath(); ctx.moveTo(-0.009, -0.035); ctx.lineTo(0.009, -0.035); ctx.stroke(); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, 0.014, 0, TAU); ctx.stroke(); ctx.restore(); }
  // hairpin glint
  ctx.strokeStyle = A.css(P.gold, a0); ctx.lineWidth = 1.2 / s; ctx.beginPath(); ctx.moveTo(-0.045, -0.975); ctx.lineTo(0.05, -0.94); ctx.stroke();
  ctx.restore();
  // ribbons in screen space (drawn after so they can stream far)
  A.ribbons(ctx, o);
};
A.ribbons = (ctx, o) => {
  const s = o.s, t = o.t || 0, P = o.pal, a0 = o.alpha ?? 1, w = o.wind || [0.3, -1];
  const rot = o.rot || 0, cr = Math.cos(rot), sr = Math.sin(rot);
  const toS = (x, y) => [o.x + (x * cr - y * sr) * s, o.y + (x * sr + y * cr) * s];
  const defs = [{ bx: -0.16, by: -0.52, col: P.ribbonA, col2: P.ribbonA2, ph: 0, side: -1 }, { bx: 0.17, by: -0.5, col: P.ribbonB, col2: P.ribbonB2, ph: 2.1, side: 1 }];
  for (const d of defs) {
    const N = 48, len = (o.ribbonLen || 1.6), pts = [];
    for (let i = 0; i <= N; i++) { const u = i / N;
      const amp = 0.05 + 0.2 * u; const wave = Math.sin(u * 7.0 - t * 2.6 + d.ph) * amp;
      const curl = d.side * 0.25 * u * u;
      let x = d.bx + (w[0] * len * u) + d.side * 0.1 * u + wave * (-w[1]) + curl;
      let y = d.by + (w[1] * len * u * 0.9) + wave * w[0] * 0.6 + 0.12 * Math.sin(u * 3 + d.ph);
      pts.push(toS(x, y)); }
    // strip with width tapering, ribbon twists (width modulated)
    const L = [], R = [];
    for (let i = 0; i <= N; i++) { const p = pts[i], q = pts[Math.min(N, i + 1)], pp = pts[Math.max(0, i - 1)];
      let dx = q[0] - pp[0], dy = q[1] - pp[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const u = i / N; const tw = Math.abs(Math.cos(u * 9 - t * 1.8 + d.ph)) * 0.8 + 0.2; const ww = s * 0.032 * (1 - 0.5 * u) * tw;
      L.push([p[0] - dy * ww, p[1] + dx * ww]); R.push([p[0] + dy * ww, p[1] - dx * ww]); }
    const g = ctx.createLinearGradient(pts[0][0], pts[0][1], pts[N][0], pts[N][1]);
    g.addColorStop(0, A.css(d.col, 0.92 * a0)); g.addColorStop(0.6, A.css(d.col2, 0.75 * a0)); g.addColorStop(1, A.css(d.col2, 0));
    ctx.fillStyle = g; ctx.beginPath(); L.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); for (let i = N; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = A.css(P.gold, 0.7 * a0); ctx.lineWidth = 0.8; ctx.beginPath(); L.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
  }
};

// ───────── rising rain (雨往天上落): streaks rising with bright heads, bokeh drops near camera
// o: {t, n, seed, col, headCol, speed, area:[x0,y0,x1,y1], len, alpha, bokeh}
A.rain = (ctx, o) => {
  const r = A.rng(o.seed || 3), n = o.n || 300, [x0, y0, x1, y1] = o.area || [0, 0, 1080, 1920], H = y1 - y0, a0 = o.alpha ?? 1;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const d = r(), x = x0 + r() * (x1 - x0), sp = (o.speed || 400) * (0.4 + d * 0.9), ph = r();
    let y = y1 - (((ph * H) + o.t * sp) % H);
    const len = (o.len || 60) * (0.3 + d), w = 0.5 + d * 1.6, a = (0.25 + 0.75 * d) * a0;
    const g = ctx.createLinearGradient(x, y, x, y + len); g.addColorStop(0, A.css(o.headCol, a)); g.addColorStop(0.15, A.css(o.col, a * 0.6)); g.addColorStop(1, A.css(o.col, 0));
    ctx.strokeStyle = g; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
    if (d > 0.82) { ctx.fillStyle = A.css(o.headCol, a); ctx.beginPath(); ctx.arc(x, y, w * 1.3, 0, TAU); ctx.fill(); }
  }
  // bokeh drops
  for (let i = 0; i < (o.bokeh || 0); i++) {
    const x = x0 + r() * (x1 - x0), sp = (o.speed || 400) * 1.6, ph = r(), R = 10 + r() * 34;
    const y = y1 + R - (((ph * (H + 2 * R)) + o.t * sp) % (H + 2 * R));
    const g = ctx.createRadialGradient(x, y, R * 0.2, x, y, R);
    g.addColorStop(0, A.css(o.col, 0.04 * a0)); g.addColorStop(0.82, A.css(o.headCol, 0.1 * a0)); g.addColorStop(0.95, A.css(o.headCol, 0.22 * a0)); g.addColorStop(1, A.css(o.headCol, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
  }
  ctx.restore();
};

// ───────── brush-stroke stream (深海 particle-ink): tapered strokes flowing in coloured lanes around a centre
// o: {cx,cy,t,n,seed,r0,r1,pal:[cols],swirl,inflow,width,alpha,tilt,len,lanes}
A.strokes = (ctx, o) => {
  const r = A.rng(o.seed || 1), n = o.n || 1500, a0 = o.alpha ?? 1, tilt = o.tilt ?? 1, nl = o.lanes || 7;
  const lanes = []; for (let i = 0; i < nl; i++) lanes.push({ r: A.lerp(o.r0, o.r1, (i + 0.5) / nl + (r() - 0.5) * 0.08), c: o.pal[i % o.pal.length], c2: o.pal[(i + 3) % o.pal.length], ph: r() * TAU, w: 0.5 + r() });
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < n; i++) {
    const ln_ = lanes[Math.floor(r() * nl)];
    const spread = (r() - 0.5) * (o.r1 - o.r0) / nl * 1.6;
    const rr0 = ln_.r + spread; const a = r() * TAU; const sp = (o.swirl || 0.5) * (0.7 + r() * 0.6) * Math.pow(o.r0 / rr0, 0.7);
    const c = r() < 0.75 ? ln_.c : ln_.c2; const w = (o.width || 3) * (0.4 + r() * r() * 2.2) * ln_.w;
    const al = (0.3 + 0.6 * r()) * a0, add = r() < (o.addFrac ?? 0.55), ln = (o.len || 0.25) * (0.4 + r() * 1.2);
    const pt = (k) => { const tt = o.t + k; const rad = rr0 * (1 + 0.04 * Math.sin(a * 3 + tt + ln_.ph)) * Math.exp(-(o.inflow || 0) * 0.15 * tt);
      const an = a + sp * tt; return [o.cx + Math.cos(an) * rad, o.cy + Math.sin(an) * rad * tilt, rad]; };
    const N = 6, P = []; for (let k = 0; k <= N; k++) P.push(pt(-ln + ln * k / N));
    const fade = A.sstep(o.r0 * 0.96, o.r0 * 1.1, P[N][2]) * (1 - A.sstep(o.r1 * 0.88, o.r1 * 1.02, P[N][2]));
    if (fade <= 0.01) continue;
    // tapered polygon
    const Lp = [], Rp = [];
    for (let k = 0; k <= N; k++) { const p = P[k], q = P[Math.min(N, k + 1)], pp = P[Math.max(0, k - 1)];
      let dx = q[0] - pp[0], dy = q[1] - pp[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const ww = w * Math.sin(Math.PI * (0.08 + 0.84 * k / N)) * (k === N ? 0.6 : 1);
      Lp.push([p[0] - dy * ww, p[1] + dx * ww]); Rp.push([p[0] + dy * ww, p[1] - dx * ww]); }
    ctx.globalCompositeOperation = add ? 'lighter' : 'source-over';
    ctx.fillStyle = A.css(c, al * fade); ctx.beginPath(); Lp.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    for (let k = N; k >= 0; k--) ctx.lineTo(Rp[k][0], Rp[k][1]); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
};
// linear flow of strokes (updraft / speed lines) — o: {t,n,seed,area,dir:[x,y],speed,pal,width,len,alpha}
A.flow = (ctx, o) => {
  const r = A.rng(o.seed || 2), n = o.n || 600, [x0, y0, x1, y1] = o.area, a0 = o.alpha ?? 1, d = o.dir || [0, -1];
  ctx.save(); ctx.lineCap = 'round';
  const Wd = x1 - x0, Hd = y1 - y0;
  for (let i = 0; i < n; i++) {
    const c = o.pal[Math.floor(r() * o.pal.length)], w = (o.width || 2) * (0.3 + r() * 1.4), ln = (o.len || 80) * (0.4 + r());
    const sp = (o.speed || 300) * (0.5 + r()); let x = x0 + r() * Wd, y = y0 + r() * Hd;
    x = x0 + ((((x - x0) + d[0] * sp * o.t) % Wd) + Wd) % Wd; y = y0 + ((((y - y0) + d[1] * sp * o.t) % Hd) + Hd) % Hd;
    const wav = Math.sin(y * 0.01 + i) * 8;
    ctx.globalCompositeOperation = r() < 0.6 ? 'lighter' : 'source-over';
    ctx.strokeStyle = A.css(c, (0.2 + 0.6 * r()) * a0); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - d[0] * ln * 0.5 + wav, y - d[1] * ln * 0.5, x - d[0] * ln, y - d[1] * ln); ctx.stroke();
  }
  ctx.restore();
};

// ───────── tiered ring palace (巨构): stacked elliptical tiers with eaves, windows and light shafts
// o: {x,y (base of lowest tier), r (radius px of lowest), tiers, gap, pal, haze, hazeCol, t, alpha}
A.palace = (ctx, o) => {
  const P = o.pal, a0 = o.alpha ?? 1, C = (c) => A.mix(c, o.hazeCol || [1, 1, 1], o.haze || 0);
  const n = o.tiers || 6;
  for (let k = 0; k < n; k++) {
    const rr = o.r * Math.pow(0.78, k), y = o.y - k * o.gap * Math.pow(0.9, k), ey = rr * 0.18, hgt = o.gap * 0.55 * Math.pow(0.9, k);
    // front wall (dark lacquer) with window rows
    const wg = ctx.createLinearGradient(0, y - hgt, 0, y + ey);
    wg.addColorStop(0, A.css(C(P.wallTop), a0)); wg.addColorStop(1, A.css(C(P.wall), a0));
    ctx.fillStyle = wg; ctx.beginPath(); ctx.ellipse(o.x, y - hgt, rr, ey, 0, 0, Math.PI); ctx.lineTo(o.x - rr, y); ctx.ellipse(o.x, y, rr, ey, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
    // windows: warm dots along the arc
    ctx.globalCompositeOperation = 'lighter';
    const nw = Math.floor(10 + rr / 8);
    for (let i = 0; i < nw; i++) { const a = (i + 0.5) / nw * Math.PI; const wx = o.x + Math.cos(a) * rr * 0.98, wy = y - hgt * 0.45 + Math.sin(a) * ey;
      const vis = Math.sin(a); if (vis < 0.1) continue; const ww = Math.max(0.8, rr * 0.012 * vis), wh = hgt * 0.32;
      const flick = 0.75 + 0.25 * A.n1(i * 3.1 + (o.t || 0) * 2 + k * 7, 4);
      ctx.fillStyle = A.css(C(k % 2 ? P.window : P.window2), 0.85 * a0 * flick); ctx.fillRect(wx - ww / 2, wy - wh / 2, ww, wh); }
    ctx.globalCompositeOperation = 'source-over';
    // roof / eave band: curved upturned edges + gold hairline
    ctx.fillStyle = A.css(C(P.roof), a0); ctx.beginPath(); ctx.ellipse(o.x, y - hgt, rr * 1.08, ey * 1.12, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = A.css(C(P.roofTop), a0); ctx.beginPath(); ctx.ellipse(o.x, y - hgt - ey * 0.12, rr * 0.98, ey * 0.95, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = A.css(C(P.gold), 0.95 * a0); ctx.lineWidth = Math.max(0.6, rr / 260);
    ctx.beginPath(); ctx.ellipse(o.x, y - hgt, rr * 1.08, ey * 1.12, 0, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(o.x, y - hgt + ey * 0.05, rr * 1.0, ey * 1.0, 0, 0, Math.PI); ctx.stroke();
    // upturned eave tips
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(o.x + sd * rr * 1.08, y - hgt); ctx.quadraticCurveTo(o.x + sd * rr * 1.14, y - hgt - ey * 0.25, o.x + sd * rr * 1.16, y - hgt - ey * 0.55); ctx.stroke(); }
  }
};

// ───────── vertical calligraphy with a brush-reveal (top→bottom per character)
// o: {x,y,size,chars,font,reveal (0..1),col,col2,glow,alpha,gap}
A.vtext = (ctx, o) => {
  const a0 = o.alpha ?? 1; if (a0 <= 0) return;
  ctx.save(); ctx.font = `${o.size}px ${o.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const n = o.chars.length, gap = o.gap ?? o.size * 1.02;
  for (let i = 0; i < n; i++) {
    const y = o.y + i * gap, ch = o.chars[i];
    const rv = A.clamp((o.reveal ?? 1) * n - i); if (rv <= 0) continue;
    ctx.save(); ctx.beginPath(); const top = y - o.size * 0.6, hgt = o.size * 1.2 * A.eo(rv);
    ctx.rect(o.x - o.size, top, o.size * 2, hgt); ctx.clip();
    if (o.shadow) { ctx.shadowColor = A.css(o.shadow, 0.65 * a0); ctx.shadowBlur = o.size * 0.25; }
    const g = ctx.createLinearGradient(0, y - o.size / 2, 0, y + o.size / 2);
    g.addColorStop(0, A.css(o.col, a0)); g.addColorStop(1, A.css(o.col2 || o.col, a0));
    ctx.fillStyle = g; ctx.fillText(ch, o.x, y);
    ctx.restore();
  }
  ctx.restore();
};
A.seal = (ctx, o) => { // vermilion seal with two characters
  const a0 = o.alpha ?? 1; if (a0 <= 0) return; ctx.save(); ctx.translate(o.x, o.y);
  ctx.fillStyle = A.css(o.col, 0.92 * a0); const s = o.s; ctx.beginPath(); ctx.rect(-s / 2, -s / 2, s, s); ctx.fill();
  ctx.fillStyle = A.css(o.ink || [1, 0.95, 0.85], a0); ctx.font = `${s * 0.42}px ${o.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(o.text[0], 0, -s * 0.21); ctx.fillText(o.text[1], 0, s * 0.23); ctx.restore(); };

window.ASC = A;
})();
