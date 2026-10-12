// 御剑 YUJIAN — the cultivator: a back-view figure drawn in Canvas 2D each frame (robe, wide sleeves, long hair and bun,
// sword on the back, vermilion 披帛 / sash / hair ribbons with procedural flutter), plus the flying sword under her feet.
// Drawn to a 1024² canvas (feet at FEET), lit with a rim pass, used as a billboard texture in the world.
import * as THREE from 'three';
import { GLSL_ATMO, clamp, lerp } from './util.js';
import { ENV } from './materials.js';

export const CW = 1024, FEET = [512, 820], BODY = 560;   // canvas size, feet origin, body height in px
const PAL = {
  robe: '#eef3ee', robeMid: '#d3e1dc', robeSh: '#9ab3b3', robeDeep: '#6f8f93', inner: '#8db2b0', hem: '#c8452e',
  hair: '#161d25', hairHi: '#41535f', skin: '#efd9c8', verm: '#d0452c', vermHi: '#ef7a4f', vermSh: '#8e2a22', peach: '#f3b3a4',
  gold: '#e3be72', jade: '#5fbfa3', sheath: '#24343b', sword: '#e9fbff', swordGlow: 'rgba(160,240,255,', shoe: '#2a2f33',
};

// ── ribbon: centreline bends from its base direction into the wind, with travelling waves; twist shows the back face
function ribbon(ctx, o) {
  const { x, y, ang, len, w, n = 44, t, ph = 0, wind = [0, 1], follow = 0.55, amp = 0.5, freq = 1.0, waves = 1.1, cFront, cBack, taper = 0.25, tw = 1, sheen = 'rgba(255,220,190,0.55)', alpha = 1 } = o;
  const wa = Math.atan2(wind[1], wind[0]);
  let da = wa - ang; da = Math.atan2(Math.sin(da), Math.cos(da));
  const pts = []; let px = x, py = y; const sl = len / n;
  for (let i = 0; i <= n; i++) {
    const s = i / n; pts.push([px, py]);
    const k = Math.min(1, s / follow); const base = ang + da * (k * k * (3 - 2 * k));
    const aa = base + amp * Math.pow(s, 0.8) * Math.sin(6.283 * (freq * t - waves * s) + ph) + amp * 0.35 * s * Math.sin(6.283 * (1.9 * freq * t - 2.3 * waves * s) + 2 * ph);
    px += Math.cos(aa) * sl; py += Math.sin(aa) * sl;
  }
  const L = [], R = [], side = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n; const [x0, y0] = pts[Math.max(0, i - 1)], [x1, y1] = pts[Math.min(n, i + 1)];
    const d = Math.atan2(y1 - y0, x1 - x0); const nx = -Math.sin(d), ny = Math.cos(d);
    const twist = Math.cos(6.283 * 0.35 * tw * t - s * 5.0 + ph * 1.3);
    const ww = w * (1 - (1 - taper) * s) * (0.25 + 0.75 * Math.abs(twist)) * (i === 0 ? 0.7 : 1);
    L.push([pts[i][0] + nx * ww / 2, pts[i][1] + ny * ww / 2]); R.push([pts[i][0] - nx * ww / 2, pts[i][1] - ny * ww / 2]); side.push(twist > 0);
  }
  ctx.save(); ctx.globalAlpha = alpha;
  let i0 = 0;
  while (i0 < n) {   // runs of the same face, drawn as smooth polygons
    let i1 = i0; while (i1 < n && side[i1 + 1] === side[i0]) i1++;
    i1 = Math.min(n, i1 + 1);
    ctx.beginPath(); ctx.moveTo(L[i0][0], L[i0][1]);
    for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (let i = i1; i >= i0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath(); ctx.fillStyle = side[i0] ? cFront : cBack; ctx.fill();
    if (side[i0] && sheen) { ctx.strokeStyle = sheen; ctx.lineWidth = Math.max(1, w * 0.08); ctx.beginPath(); ctx.moveTo(L[i0][0], L[i0][1]); for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(L[i][0], L[i][1]); ctx.stroke(); }
    i0 = i1;
  }
  ctx.restore();
  return pts;
}

// ── the figure. p: {t, wind:[x,y] (screen dir cloth streams toward), gust 0..1, armL, armR (0 hang .. 1 raised), crouch,
//    lookUp, onSword, sheathed, swordGlow, roll}
export function drawFigure(ctx, p) {
  const t = p.t, wind = p.wind || [1, 0.15], g = p.gust ?? 0.6;
  const wl = Math.hypot(wind[0], wind[1]) || 1; const wx = wind[0] / wl, wy = wind[1] / wl;
  ctx.clearRect(0, 0, CW, CW);
  ctx.save();
  ctx.translate(FEET[0], FEET[1]);
  ctx.rotate(p.roll || 0);
  const cr = p.crouch || 0;
  const S = BODY / 560; ctx.scale(S, S * (1 - cr * 0.12));
  // key points (y up = negative)
  const yShoulder = -440, yWaist = -325, yHem = -8, yNeck = -462, yHead = -505;
  const sway = Math.sin(t * 1.3) * 3 * g;
  const hemShift = wx * 34 * g + Math.sin(t * 2.1) * 6 * g;          // hem blown downwind
  const lift = -wy * 20 * g;                                          // skirt lifts if wind blows up
  const ribbonCol = [PAL.verm, PAL.vermSh];

  // ── 1. far ribbon ends (behind body): the 披帛 tail from the far (left) elbow
  const armL = p.armL ?? 0.15, armR = p.armR ?? 0.15;
  const elbowL = [-70 - 40 * armL, yShoulder + 70 - 120 * armL], elbowR = [70 + 40 * armR, yShoulder + 70 - 120 * armR];
  const handL = [elbowL[0] - 20 - 70 * armL, elbowL[1] + 90 - 150 * armL], handR = [elbowR[0] + 20 + 70 * armR, elbowR[1] + 90 - 150 * armR];
  const windAng = Math.atan2(wy, wx);
  const baseAng = (bias) => Math.atan2(1 * (1 - bias) + wy * bias, wx * bias + 0.0001);
  ribbon(ctx, { x: handL[0], y: handL[1] + 20, ang: baseAng(0.55) + 0.2, len: 520 + 120 * g, w: 26, t, ph: 0.3, wind: [wx, wy + 0.25], follow: 0.6, amp: 0.45 * g + 0.12, freq: 0.55, waves: 1.0, cFront: PAL.verm, cBack: PAL.vermSh, taper: 0.35 });
  // sash tails (from waist)
  ribbon(ctx, { x: -8, y: yWaist + 14, ang: baseAng(0.5), len: 300 + 80 * g, w: 15, t, ph: 1.7, wind: [wx, wy + 0.4], follow: 0.5, amp: 0.5 * g + 0.12, freq: 0.75, waves: 1.2, cFront: PAL.vermHi, cBack: PAL.vermSh, taper: 0.5, tw: 1.4 });
  ribbon(ctx, { x: 10, y: yWaist + 14, ang: baseAng(0.5), len: 250 + 70 * g, w: 12, t, ph: 2.6, wind: [wx, wy + 0.5], follow: 0.5, amp: 0.5 * g + 0.12, freq: 0.85, waves: 1.3, cFront: PAL.peach, cBack: PAL.vermSh, taper: 0.5, tw: 1.2 });

  // ── 2. skirt / lower robe: a trailing silhouette pressed on the upwind side, billowing downwind; gauze overskirt on top
  const skirtEdge = (k, extra, gauze) => {
    const w = 38 + 54 * Math.pow(k, 0.85) + extra * k;
    const c = wx * g * (gauze ? 95 : 55) * k * k + Math.sin(t * 2.2 + k * 3.5 + (gauze ? 1.3 : 0)) * (gauze ? 9 : 4) * g * k;
    const press = 1 - 0.38 * Math.abs(wx) * g * k, bil = 1 + 0.3 * Math.abs(wx) * g * k;
    const lw = wx >= 0 ? press : bil, rw = wx >= 0 ? bil : press;
    return [c - w * lw * (1 + cr * 0.2), c + w * rw * (1 + cr * 0.2)];
  };
  const skirtPath = (extra, gauze, yOff) => {
    const P = new Path2D(); const M = 14; const yT = yWaist, yB = yHem + yOff;
    for (let i = 0; i <= M; i++) { const k = i / M; const [l] = skirtEdge(k, extra, gauze); const yy = lerp(yT, yB, k) + lift * k * k * (wx >= 0 ? 0.6 : 1); i ? P.lineTo(l, yy) : P.moveTo(l, yy); }
    const H = 16; const [l1, r1] = skirtEdge(1, extra, gauze);
    for (let i = 1; i <= H; i++) { const k = i / H; const x = lerp(l1, r1, k); const yy = yB + lift * (0.6 + 0.4 * k) + Math.sin(k * 10 + t * (gauze ? 5.5 : 4.0)) * (gauze ? 11 : 6) * g - (wx >= 0 ? k : 1 - k) * Math.abs(wx) * g * (gauze ? 46 : 26); P.lineTo(x, yy); }
    for (let i = M; i >= 0; i--) { const k = i / M; const [, r] = skirtEdge(k, extra, gauze); const yy = lerp(yT, yB, k) + lift * k * k * (wx >= 0 ? 1 : 0.6) - (wx >= 0 ? 1 : 0) * Math.abs(wx) * g * 26 * Math.pow(k, 3) * (gauze ? 1.8 : 1); P.lineTo(r, yy); }
    P.closePath(); return P;
  };
  const skirt = skirtPath(0, false, 0);
  // inner layer + vermilion hem line peeking below
  ctx.save(); ctx.translate(0, 12); ctx.fillStyle = PAL.inner; ctx.fill(skirt); ctx.restore();
  ctx.save(); ctx.translate(0, 15); ctx.strokeStyle = PAL.hem; ctx.lineWidth = 2.5; ctx.stroke(skirt); ctx.restore();
  const grad = ctx.createLinearGradient(-110, 0, 110, 0);
  grad.addColorStop(0, PAL.robe); grad.addColorStop(0.5, PAL.robeMid); grad.addColorStop(1, PAL.robeSh);
  ctx.fillStyle = grad; ctx.fill(skirt);
  // folds follow the skirt's centre curve
  ctx.save(); ctx.clip(skirt); ctx.lineWidth = 1.4;
  for (let i = 0; i < 11; i++) { const u = (i + 0.5) / 11; ctx.strokeStyle = i % 3 === 1 ? 'rgba(255,255,255,0.35)' : 'rgba(70,100,108,0.22)'; ctx.beginPath();
    for (let j = 0; j <= 10; j++) { const k = j / 10; const [l, r] = skirtEdge(k, 0, false); const x = lerp(l, r, u) + Math.sin(t * 3 + i * 1.7 + k * 4) * 3 * g * k; const yy = lerp(yWaist + 14, yHem + 4, k) + lift * k * k; j ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy); } ctx.stroke(); }
  // soft shadow under the waist
  const sg2 = ctx.createLinearGradient(0, yWaist, 0, yWaist + 90); sg2.addColorStop(0, 'rgba(60,90,100,0.25)'); sg2.addColorStop(1, 'rgba(60,90,100,0)'); ctx.fillStyle = sg2; ctx.fillRect(-150, yWaist, 300, 90);
  ctx.restore();
  // gauze overskirt (纱): translucent, longer, more wind
  { const gz = skirtPath(18, true, 18); ctx.save(); ctx.fillStyle = 'rgba(250,253,251,0.38)'; ctx.fill(gz); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.2; ctx.stroke(gz); ctx.restore(); }
  // feet (only when standing on the sword or stepping)
  if (p.feet) { ctx.fillStyle = PAL.shoe; ctx.beginPath(); ctx.ellipse(-22 + hemShift * 0.3, yHem + 12, 13, 7, 0, 0, 6.28); ctx.ellipse(26 + hemShift * 0.4, yHem + 8, 13, 7, 0, 0, 6.28); ctx.fill(); }

  // ── 3. torso (back), shoulders
  const torso = new Path2D();
  torso.moveTo(-34, yWaist + 6); torso.bezierCurveTo(-44, yWaist - 50, -66, yShoulder + 30, -60, yShoulder + 6);
  torso.quadraticCurveTo(-34, yShoulder - 14, -14, yNeck + 8); torso.lineTo(14, yNeck + 8);
  torso.quadraticCurveTo(34, yShoulder - 14, 60, yShoulder + 6); torso.bezierCurveTo(66, yShoulder + 30, 44, yWaist - 50, 34, yWaist + 6); torso.closePath();
  const tg = ctx.createLinearGradient(-70, 0, 70, 0); tg.addColorStop(0, PAL.robe); tg.addColorStop(0.55, PAL.robeMid); tg.addColorStop(1, PAL.robeSh);
  ctx.fillStyle = tg; ctx.fill(torso);
  // back seam & collar
  ctx.strokeStyle = 'rgba(90,120,125,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, yNeck + 14); ctx.lineTo(0, yWaist); ctx.stroke();

  // ── 4. sleeves (wide 广袖) — arm angle lifts them; cuffs flutter downwind
  const sleeve = (side, arm) => {
    // arm line shoulder → elbow → hand; the wide sleeve hangs beneath it like a wing of cloth, blown downwind
    const sx = side * 56, sy = yShoulder + 6;
    const ex = side * (70 + 40 * arm), ey = sy + 70 - 120 * arm;
    const hx = ex + side * (20 + 70 * arm), hy = ey + 90 - 150 * arm;
    const flut = Math.sin(t * 3.0 + side * 1.3) * 9 * g;
    const hang = 60 + 70 * arm;                                  // how far the sleeve droops below the arm at the cuff
    const dx = wx * 70 * g, dy = Math.max(-0.6, wy) * 50 * g;
    const cuffB = [hx + dx * 0.9 - side * 6, hy + hang + dy + flut];
    const pth = new Path2D();
    pth.moveTo(sx - side * 4, sy - 8);
    pth.quadraticCurveTo(ex + side * 4, ey - 14, hx + side * 6, hy - 6);                     // over the arm
    pth.quadraticCurveTo(hx + side * 22 + dx * 0.4, hy + hang * 0.45 + dy * 0.5, cuffB[0] + side * 12, cuffB[1]);   // cuff outer edge
    pth.quadraticCurveTo(lerp(hx, cuffB[0], 0.5) - side * 26, cuffB[1] + 18 + flut * 0.5, hx - side * 26 + dx * 0.3, hy + hang * 0.55 + dy * 0.4);  // rounded cuff bottom
    pth.quadraticCurveTo(lerp(sx, hx, 0.45) + dx * 0.15, lerp(sy, hy, 0.6) + hang * 0.5, sx - side * 26, sy + 64);   // sagging under-edge to the armpit
    pth.closePath();
    const sg = ctx.createLinearGradient(sx, sy, cuffB[0], cuffB[1]);
    sg.addColorStop(0, side < 0 ? PAL.robe : PAL.robeMid); sg.addColorStop(1, side < 0 ? PAL.robeMid : PAL.robeSh);
    ctx.fillStyle = sg; ctx.fill(pth);
    ctx.save(); ctx.clip(pth); ctx.strokeStyle = 'rgba(70,100,108,0.25)'; ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) { const u = 0.25 + i * 0.18; ctx.beginPath(); ctx.moveTo(lerp(sx, hx, u), lerp(sy, hy, u) + 4); ctx.quadraticCurveTo(lerp(sx, cuffB[0], u) + dx * 0.2, lerp(sy, cuffB[1], u) + 20, lerp(sx, cuffB[0], u + 0.1) + dx * 0.3, lerp(sy, cuffB[1], u + 0.1) + hang * u); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = PAL.inner; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cuffB[0] + side * 12, cuffB[1]); ctx.quadraticCurveTo(lerp(hx, cuffB[0], 0.5) - side * 26, cuffB[1] + 18 + flut * 0.5, hx - side * 26 + dx * 0.3, hy + hang * 0.55 + dy * 0.4); ctx.stroke();
    if (arm > 0.55) { ctx.fillStyle = PAL.skin; ctx.beginPath(); ctx.ellipse(hx + side * 8, hy - 8, 6, 9, side * 0.5, 0, 6.28); ctx.fill(); }
    return [hx, hy];
  };
  sleeve(-1, armL); sleeve(1, armR);

  // ── 5. sash (腰带)
  ctx.fillStyle = PAL.verm; ctx.beginPath(); ctx.moveTo(-37, yWaist - 10); ctx.quadraticCurveTo(0, yWaist - 16, 37, yWaist - 10); ctx.lineTo(39, yWaist + 16); ctx.quadraticCurveTo(0, yWaist + 10, -39, yWaist + 16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = PAL.gold; ctx.fillRect(-4, yWaist - 13, 8, 26);
  ctx.fillStyle = PAL.jade; ctx.beginPath(); ctx.arc(0, yWaist + 22, 6, 0, 6.28); ctx.fill();

  // ── 6. sword (scabbard on the back, diagonal from right shoulder to left hip)
  {
    const ax = 64, ay = yShoulder - 34, bx = -58, by = yWaist + 60;
    ctx.strokeStyle = PAL.sheath; ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ax - 6, ay + 12); ctx.lineTo(bx, by); ctx.stroke();
    ctx.strokeStyle = PAL.gold; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(lerp(ax, bx, 0.12), lerp(ay, by, 0.12) + 4); ctx.lineTo(lerp(ax, bx, 0.15), lerp(ay, by, 0.15) + 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lerp(ax, bx, 0.94), lerp(ay, by, 0.94)); ctx.lineTo(bx, by); ctx.stroke();
    if (p.sheathed !== false) {
      // hilt above the right shoulder + guard + tassel
      ctx.strokeStyle = PAL.gold; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ax - 18, ay + 14); ctx.lineTo(ax + 10, ay - 8); ctx.stroke();
      ctx.strokeStyle = '#3a2a24'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(ax - 4, ay + 2); ctx.lineTo(ax + 22, ay - 30); ctx.stroke();
      ctx.fillStyle = PAL.gold; ctx.beginPath(); ctx.arc(ax + 24, ay - 33, 5, 0, 6.28); ctx.fill();
      ribbon(ctx, { x: ax + 24, y: ay - 30, ang: Math.PI / 2, len: 70, w: 6, t, ph: 0.9, wind: [wx, wy + 0.6], follow: 0.4, amp: 0.6, freq: 1.2, cFront: PAL.verm, cBack: PAL.vermSh, taper: 0.6 });
    }
  }

  // ── 7. 披帛 drape across the back (crescent of fabric between the elbows), under the hair
  {
    const sagY = yShoulder + 150 + Math.sin(t * 1.4) * 8 * g; const mx = wx * 24 * g;
    const P = new Path2D();
    P.moveTo(elbowL[0] + 4, elbowL[1] - 4); P.quadraticCurveTo(mx, sagY + 40, elbowR[0] - 4, elbowR[1] - 4);
    P.lineTo(elbowR[0] - 2, elbowR[1] + 10); P.quadraticCurveTo(mx, sagY + 6, elbowL[0] + 2, elbowL[1] + 10); P.closePath();
    ctx.fillStyle = 'rgba(208,69,44,0.92)'; ctx.fill(P);
    ctx.strokeStyle = 'rgba(255,170,130,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(elbowL[0] + 4, elbowL[1] + 6); ctx.quadraticCurveTo(mx, sagY + 14, elbowR[0] - 4, elbowR[1] + 6); ctx.stroke();
  }

  // ── 8. long hair down the back (sways downwind), neck
  ctx.fillStyle = PAL.skin; ctx.fillRect(-11, yNeck - 6, 22, 20);
  const hairLen = 200;
  const hs = (k) => [wx * 60 * g * k * k + Math.sin(t * 1.6 + k * 3) * 7 * g * k, yHead + 10 + k * (hairLen + 50) + wy * 50 * g * k * k];
  // locks (behind the mass): dark ribbons continuing the hair downwind
  for (let i = 0; i < 5; i++) { const k0 = 0.55 + i * 0.07; const [x0, y0] = hs(k0); ribbon(ctx, { x: x0 + (i - 2) * 9, y: y0, ang: Math.PI / 2 + (i - 2) * 0.12, len: 120 + 30 * i + 60 * g, w: 22 - i * 2, t, ph: i * 1.3, wind: [wx, wy + 0.9], follow: 0.7, amp: 0.35 * g + 0.08, freq: 0.7, waves: 0.8, cFront: PAL.hair, cBack: '#0e1318', taper: 0.15, tw: 0.3, sheen: 'rgba(90,110,125,0.5)' }); }
  const hair = new Path2D();
  hair.moveTo(-36, yHead + 4);
  const Lh = 12; const left = [], right = [];
  for (let i = 0; i <= Lh; i++) { const k = i / Lh; const [cx, cy] = hs(k); const w = lerp(42, 16, Math.pow(k, 1.1)) + (k < 0.25 ? 6 * Math.sin(k / 0.25 * 3.14) : 0); left.push([cx - w, cy]); right.push([cx + w, cy]); }
  left.forEach(([x, y]) => hair.lineTo(x, y));
  const [tx, ty] = hs(1.06); hair.lineTo(tx, ty);
  for (let i = right.length - 1; i >= 0; i--) hair.lineTo(right[i][0], right[i][1]);
  hair.lineTo(36, yHead + 4); hair.closePath();
  const hg = ctx.createLinearGradient(-40, 0, 40, 0); hg.addColorStop(0, PAL.hairHi); hg.addColorStop(0.3, PAL.hair); hg.addColorStop(1, PAL.hair);
  ctx.fillStyle = hg; ctx.fill(hair);
  // sheen strands
  ctx.save(); ctx.clip(hair); ctx.strokeStyle = 'rgba(110,135,150,0.35)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 7; i++) { ctx.beginPath(); for (let j = 0; j <= 10; j++) { const k = j / 10; const [cx, cy] = hs(k); const x = cx + (i - 3) * lerp(10, 3, k); j ? ctx.lineTo(x, cy) : ctx.moveTo(x, cy); } ctx.stroke(); }
  ctx.restore();
  // flyaway strands
  ctx.strokeStyle = PAL.hair; ctx.lineWidth = 1.8;
  for (let i = 0; i < 6; i++) { const k0 = 0.15 + i * 0.12; const [x0, y0] = hs(k0); const sgn = i % 2 ? 1 : -1; ctx.beginPath(); ctx.moveTo(x0 + sgn * 20, y0); const [x1, y1] = hs(Math.min(k0 + 0.3, 1.1)); ctx.quadraticCurveTo(x0 + wx * 50 * g + sgn * 34, (y0 + y1) / 2, x1 + wx * 60 * g + Math.sin(t * 2.4 + i) * 12, y1 + 12); ctx.stroke(); }
  // head (back of the skull) + bun + hairpin + ribbon
  ctx.fillStyle = PAL.hair; ctx.beginPath(); ctx.ellipse(0, yHead, 34, 38, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = PAL.hairHi; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.ellipse(-12, yHead - 14, 14, 20, -0.4, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1;
  // ears (tiny, skin) peeking
  ctx.fillStyle = PAL.skin; ctx.beginPath(); ctx.ellipse(-33, yHead + 6, 4, 8, 0.2, 0, 6.28); ctx.ellipse(33, yHead + 6, 4, 8, -0.2, 0, 6.28); ctx.fill();
  const lu = p.lookUp || 0;
  const by = yHead - 44 + lu * 10;
  ctx.fillStyle = PAL.hair; ctx.beginPath(); ctx.ellipse(0, by, 22, 18, 0, 0, 6.28); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-14, by - 8, 13, 11, -0.5, 0, 6.28); ctx.fill();
  ctx.strokeStyle = PAL.gold; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-36, by + 6); ctx.lineTo(30, by - 14); ctx.stroke();
  ctx.fillStyle = PAL.jade; ctx.beginPath(); ctx.arc(32, by - 15, 5, 0, 6.28); ctx.fill();
  ctx.fillStyle = PAL.verm; ctx.beginPath(); ctx.arc(-36, by + 7, 3.5, 0, 6.28); ctx.fill();
  // hair ribbons (发带)
  ribbon(ctx, { x: 6, y: by + 10, ang: baseAng(0.6) + 0.3, len: 330 + 80 * g, w: 9, t, ph: 2.2, wind: [wx, wy + 0.15], follow: 0.45, amp: 0.55 * g + 0.15, freq: 0.9, waves: 1.4, cFront: PAL.verm, cBack: PAL.vermSh, taper: 0.4, tw: 1.6 });
  ribbon(ctx, { x: 12, y: by + 12, ang: baseAng(0.6) + 0.1, len: 280 + 60 * g, w: 7, t, ph: 3.4, wind: [wx, wy + 0.2], follow: 0.45, amp: 0.55 * g + 0.15, freq: 1.05, waves: 1.5, cFront: PAL.vermHi, cBack: PAL.vermSh, taper: 0.4, tw: 1.3 });

  // ── 9. near 披帛 tail from the right hand (in front)
  ribbon(ctx, { x: handR[0], y: handR[1] + 20, ang: baseAng(0.55) - 0.2, len: 560 + 140 * g, w: 28, t, ph: 4.1, wind: [wx, wy + 0.2], follow: 0.6, amp: 0.45 * g + 0.12, freq: 0.5, waves: 0.9, cFront: PAL.verm, cBack: PAL.vermSh, taper: 0.35 });

  // ── 10. the flying sword under her feet (seen from behind and below, pointing away)
  if (p.onSword) {
    const gl = p.swordGlow ?? 1;
    ctx.save(); ctx.translate(0, 16);
    ctx.globalCompositeOperation = 'lighter';
    for (const [wdt, al] of [[34, 0.10], [18, 0.22], [8, 0.5]]) { ctx.strokeStyle = PAL.swordGlow + (al * gl) + ')'; ctx.lineWidth = wdt; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-120, 30); ctx.lineTo(190, -40); ctx.stroke(); }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = PAL.sword; ctx.beginPath(); ctx.moveTo(-112, 24); ctx.lineTo(196, -42); ctx.lineTo(-106, 36); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = PAL.gold; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-118, 16); ctx.lineTo(-102, 44); ctx.stroke();
    ctx.strokeStyle = '#3a2a24'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-114, 32); ctx.lineTo(-146, 42); ctx.stroke();
    ribbon(ctx, { x: -148, y: 43, ang: Math.PI * 0.7, len: 90, w: 6, t, ph: 0.4, wind: [wx, wy], follow: 0.4, amp: 0.5, freq: 1.4, cFront: PAL.verm, cBack: PAL.vermSh, taper: 0.5 });
    ctx.restore();
  }
  ctx.restore();
}

// cel shading: shadow tone everywhere, lit tone where the shape overlaps itself shifted toward the light (hard terminator)
function cel(ctx, path, lit, shadow, off, mid) {
  ctx.fillStyle = shadow; ctx.fill(path);
  ctx.save(); ctx.clip(path); ctx.translate(off[0], off[1]);
  ctx.fillStyle = lit; ctx.fill(path);
  if (mid) { ctx.translate(off[0] * 0.6, off[1] * 0.6); ctx.fillStyle = mid; ctx.globalAlpha = 0.5; ctx.fill(path); }
  ctx.restore();
}

// ── the flight pose (御剑): 3/4 rear view, leaning into the flight toward the upper right, front foot forward on the blade,
//    robe pressed forward and streaming back, two long 披帛 and the hair in S-curves, right hand raised in 剑指
export function drawFlyer(ctx, p) {
  const t = p.t, g = p.gust ?? 1, lean = p.lean ?? 0.3, gl = p.swordGlow ?? 1.2;
  const L = [-0.75, -0.65];                               // light from the upper left (screen)
  ctx.clearRect(0, 0, CW, CW);
  ctx.save(); if (p.mirror) { ctx.translate(CW, 0); ctx.scale(-1, 1); } ctx.translate(FEET[0], FEET[1]); ctx.rotate(p.roll || 0);
  // the wind in body space streams back-down-left
  const wd = [-0.85, 0.55];
  // ── sword under the feet (drawn first: the blade is beneath her), tip toward the upper right
  {
    ctx.save(); ctx.rotate(-0.12);
    const A = [-210, 30], B = [250, -40];
    ctx.globalCompositeOperation = 'lighter';
    for (const [w2, al] of [[60, 0.08], [34, 0.16], [16, 0.35], [7, 0.7]]) { ctx.strokeStyle = `rgba(150,240,255,${al * gl})`; ctx.lineWidth = w2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#f2feff'; ctx.beginPath(); ctx.moveTo(A[0] + 20, A[1] - 6); ctx.lineTo(B[0], B[1]); ctx.lineTo(A[0] + 24, A[1] + 8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,200,220,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(A[0] + 22, A[1] + 1); ctx.lineTo(B[0] - 6, B[1] + 1); ctx.stroke();
    ctx.fillStyle = PAL.gold; ctx.save(); ctx.translate(A[0] + 16, A[1] + 1); ctx.rotate(-0.15); ctx.fillRect(-4, -14, 8, 28); ctx.restore();
    ctx.strokeStyle = '#3a2a24'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(A[0] + 12, A[1] + 2); ctx.lineTo(A[0] - 30, A[1] + 9); ctx.stroke();
    ctx.fillStyle = PAL.gold; ctx.beginPath(); ctx.arc(A[0] - 34, A[1] + 10, 6, 0, 6.28); ctx.fill();
    ribbon(ctx, { x: A[0] - 36, y: A[1] + 12, ang: Math.PI * 0.85, len: 110, w: 7, t, ph: 0.4, wind: wd, follow: 0.4, amp: 0.55, freq: 1.4, cFront: PAL.verm, cBack: PAL.vermSh, taper: 0.5 });
    ctx.restore();
  }
  ctx.rotate(lean);
  const yS = -440, yW = -322, yN = -462, yH = -505;
  // ── far 披帛 and sash tails (behind the body), streaming back in S-curves
  ribbon(ctx, { x: -60, y: yS + 150, ang: Math.PI * 0.8, len: 640, w: 30, t, ph: 0.3, wind: wd, follow: 0.35, amp: 0.55 * g + 0.15, freq: 0.6, waves: 1.3, cFront: PAL.verm, cBack: PAL.vermSh, taper: 0.3 });
  ribbon(ctx, { x: -14, y: yW + 16, ang: Math.PI * 0.75, len: 330, w: 15, t, ph: 1.7, wind: wd, follow: 0.4, amp: 0.5 * g + 0.12, freq: 0.8, waves: 1.3, cFront: PAL.vermHi, cBack: PAL.vermSh, taper: 0.45, tw: 1.4 });
  ribbon(ctx, { x: 4, y: yW + 16, ang: Math.PI * 0.7, len: 280, w: 12, t, ph: 2.6, wind: wd, follow: 0.4, amp: 0.5 * g + 0.12, freq: 0.9, waves: 1.4, cFront: PAL.peach, cBack: PAL.vermSh, taper: 0.45, tw: 1.2 });
  // ── long hair streaming back (behind the shoulders): several dark locks
  for (let i = 0; i < 4; i++) ribbon(ctx, { x: -14 + i * 8, y: yH + 10, ang: Math.PI * (0.6 + i * 0.04), len: 330 + 50 * i, w: 46 - i * 6, t, ph: i * 0.9, wind: wd, follow: 0.55, amp: 0.3 * g + 0.08, freq: 0.6, waves: 0.9, cFront: PAL.hair, cBack: PAL.hair, taper: 0.22, tw: 0.0, sheen: 'rgba(95,120,135,0.6)' });
  // ── skirt: pressed against the front leg (right), billowing back (left), hem streaming
  const fl = Math.sin(t * 4.2) * 8 * g;
  const skirt = new Path2D();
  skirt.moveTo(-36, yW); skirt.bezierCurveTo(-70, yW + 90, -150 + fl, -150, -205 + fl, -40 + fl * 0.5);
  skirt.bezierCurveTo(-170, -10, -120, 4 + fl * 0.4, -70, 2);
  for (let i = 1; i <= 8; i++) { const k = i / 8; skirt.lineTo(lerp(-70, 52, k), 4 + Math.sin(k * 9 + t * 5) * 5 * g - k * 6); }
  skirt.bezierCurveTo(60, -90, 48, yW + 80, 36, yW); skirt.closePath();
  ctx.save(); ctx.translate(-6, 10); ctx.fillStyle = PAL.inner; ctx.fill(skirt); ctx.restore();
  ctx.save(); ctx.translate(-8, 14); ctx.strokeStyle = PAL.hem; ctx.lineWidth = 2.5; ctx.stroke(skirt); ctx.restore();
  cel(ctx, skirt, PAL.robe, PAL.robeSh, [16, 8], PAL.robeMid);
  ctx.save(); ctx.clip(skirt); ctx.strokeStyle = 'rgba(70,100,108,0.28)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) { const k = i / 7; ctx.beginPath(); ctx.moveTo(lerp(-30, 30, k), yW + 20); ctx.bezierCurveTo(lerp(-60, 40, k), -200, lerp(-150, 30, k) + fl * (1 - k), -90, lerp(-190, 40, k) + fl * (1 - k), lerp(-30, 0, k)); ctx.stroke(); }
  ctx.restore();
  // gauze overskirt streaming further back
  { const gz = new Path2D(); gz.moveTo(-30, yW + 10); gz.bezierCurveTo(-90, yW + 80, -200 + fl, -170, -280 + fl * 1.5, -60 + fl); gz.bezierCurveTo(-200, -40, -140, -10, -60, -6); gz.bezierCurveTo(-20, -60, 0, yW + 70, 20, yW + 10); gz.closePath();
    ctx.fillStyle = 'rgba(250,253,251,0.35)'; ctx.fill(gz); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.2; ctx.stroke(gz); }
  // feet: front foot forward on the blade (right), back foot behind (left)
  ctx.fillStyle = PAL.shoe; ctx.beginPath(); ctx.ellipse(62, 0, 18, 8, -0.2, 0, 6.28); ctx.ellipse(-58, 12, 16, 8, -0.1, 0, 6.28); ctx.fill();
  // ── torso (3/4 back) with cel shading
  const torso = new Path2D();
  torso.moveTo(-36, yW + 6); torso.bezierCurveTo(-48, yW - 50, -66, yS + 30, -58, yS + 4);
  torso.quadraticCurveTo(-30, yS - 14, -10, yN + 8); torso.lineTo(16, yN + 8);
  torso.quadraticCurveTo(36, yS - 12, 60, yS + 8); torso.bezierCurveTo(64, yS + 30, 46, yW - 50, 36, yW + 6); torso.closePath();
  cel(ctx, torso, PAL.robe, PAL.robeSh, [14, 10], PAL.robeMid);
  ctx.strokeStyle = 'rgba(90,120,125,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(4, yN + 14); ctx.lineTo(0, yW); ctx.stroke();
  // ── left arm swept back-down, sleeve streaming; right arm forward-up with sword fingers
  const sleeve = (sx, sy, hx, hy, hang, side) => {
    const pth = new Path2D(); const fx = Math.sin(t * 3.1 + side) * 10 * g;
    pth.moveTo(sx, sy - 8); pth.quadraticCurveTo((sx + hx) / 2 + side * 6, (sy + hy) / 2 - 14, hx, hy - 6);
    pth.quadraticCurveTo(hx - 30 + fx, hy + hang * 0.5, hx - 60 + fx, hy + hang + fx * 0.5);
    pth.quadraticCurveTo(hx - 130 + fx * 2, hy + hang * 1.2, hx - 170 + fx * 2, hy + hang * 0.9);
    pth.quadraticCurveTo((sx + hx) / 2 - 60, (sy + hy) / 2 + hang * 0.9, sx - 22, sy + 60); pth.closePath();
    cel(ctx, pth, PAL.robe, PAL.robeSh, [12, 12], PAL.robeMid);
    ctx.strokeStyle = PAL.inner; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx - 60 + fx, hy + hang + fx * 0.5); ctx.quadraticCurveTo(hx - 130 + fx * 2, hy + hang * 1.2, hx - 170 + fx * 2, hy + hang * 0.9); ctx.stroke();
  };
  sleeve(-54, yS + 8, -150, yS + 150, 70, -1);                    // back arm
  // front arm: raised forward with 剑指
  { const sx = 56, sy = yS + 6, ex = 120, ey = yS - 40, hx = 168, hy = yS - 110;
    const pth = new Path2D(); const fx = Math.sin(t * 3.4) * 8 * g;
    pth.moveTo(sx - 4, sy - 10); pth.quadraticCurveTo(ex, ey - 16, hx - 6, hy + 4);
    pth.lineTo(hx + 8, hy + 22); pth.quadraticCurveTo(hx - 10 + fx, hy + 90, hx - 70 + fx * 1.5, hy + 140);
    pth.quadraticCurveTo(ex - 40, sy + 40, sx - 26, sy + 56); pth.closePath();
    cel(ctx, pth, PAL.robe, PAL.robeSh, [12, 12], PAL.robeMid);
    ctx.fillStyle = PAL.skin; ctx.save(); ctx.translate(hx + 2, hy - 2); ctx.rotate(-0.6); ctx.fillRect(-4, -18, 6, 20); ctx.fillRect(3, -16, 5, 18); ctx.beginPath(); ctx.ellipse(1, 2, 7, 8, 0, 0, 6.28); ctx.fill(); ctx.restore();
  }
  // ── sash and the empty scabbard on the back
  ctx.fillStyle = PAL.verm; ctx.beginPath(); ctx.moveTo(-37, yW - 10); ctx.quadraticCurveTo(0, yW - 16, 37, yW - 10); ctx.lineTo(39, yW + 16); ctx.quadraticCurveTo(0, yW + 10, -39, yW + 16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = PAL.gold; ctx.fillRect(-4, yW - 13, 8, 26); ctx.fillStyle = PAL.jade; ctx.beginPath(); ctx.arc(0, yW + 22, 6, 0, 6.28); ctx.fill();
  ctx.strokeStyle = PAL.sheath; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(58, yS - 20); ctx.lineTo(-56, yW + 60); ctx.stroke();
  ctx.strokeStyle = PAL.gold; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(50, yS - 12); ctx.lineTo(44, yS - 6); ctx.stroke();
  // 披帛 drape across the back
  { const P = new Path2D(); P.moveTo(-90, yS + 90); P.quadraticCurveTo(10, yS + 190, 110, yS + 30); P.lineTo(112, yS + 44); P.quadraticCurveTo(10, yS + 165, -88, yS + 104); P.closePath(); ctx.fillStyle = 'rgba(208,69,44,0.95)'; ctx.fill(P); }
  // ── head (3/4 back): hair mass, a sliver of cheek and ear on the right, bun with hairpin, hair ribbons
  ctx.fillStyle = PAL.skin; ctx.beginPath(); ctx.ellipse(24, yH + 14, 14, 26, 0.25, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#e6c3ae'; ctx.beginPath(); ctx.ellipse(31, yH + 8, 4.5, 8, 0.2, 0, 6.28); ctx.fill();
  ctx.fillStyle = PAL.skin; ctx.fillRect(-10, yN - 8, 22, 22);
  ctx.fillStyle = PAL.hair; ctx.beginPath(); ctx.ellipse(-2, yH, 34, 38, 0.15, 0, 6.28); ctx.fill();
  ctx.fillStyle = PAL.hairHi; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(-14, yH - 16, 13, 20, -0.4, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1;
  const by = yH - 44;
  ctx.fillStyle = PAL.hair; ctx.beginPath(); ctx.ellipse(-4, by, 22, 18, 0, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(-18, by - 8, 13, 11, -0.5, 0, 6.28); ctx.fill();
  ctx.strokeStyle = PAL.gold; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-40, by + 6); ctx.lineTo(28, by - 14); ctx.stroke();
  ctx.fillStyle = PAL.jade; ctx.beginPath(); ctx.arc(30, by - 15, 5, 0, 6.28); ctx.fill(); ctx.fillStyle = PAL.verm; ctx.beginPath(); ctx.arc(-40, by + 7, 3.5, 0, 6.28); ctx.fill();
  ribbon(ctx, { x: -10, y: by + 10, ang: Math.PI * 0.75, len: 360, w: 9, t, ph: 2.2, wind: wd, follow: 0.4, amp: 0.55 * g + 0.15, freq: 0.9, waves: 1.5, cFront: PAL.verm, cBack: PAL.vermSh, taper: 0.4, tw: 1.6 });
  ribbon(ctx, { x: -4, y: by + 12, ang: Math.PI * 0.7, len: 300, w: 7, t, ph: 3.4, wind: wd, follow: 0.4, amp: 0.55 * g + 0.15, freq: 1.0, waves: 1.6, cFront: PAL.vermHi, cBack: PAL.vermSh, taper: 0.4, tw: 1.3 });
  // ── near 披帛 from the front arm, streaming back under the body (in front)
  ribbon(ctx, { x: 140, y: yS - 40, ang: Math.PI * 0.62, len: 700, w: 30, t, ph: 4.1, wind: wd, follow: 0.45, amp: 0.5 * g + 0.15, freq: 0.5, waves: 1.1, cFront: PAL.verm, cBack: PAL.vermSh, taper: 0.3 });
  ctx.restore();
}

// rim pass: light edge on the sun side + a soft shadow wash on the other side
export function rimPass(ctx, scratch, dir = [-1, -0.4], rim = 'rgba(255,236,200,0.7)', px = 3) {
  const s = scratch.getContext('2d');
  s.globalCompositeOperation = 'copy'; s.drawImage(ctx.canvas, 0, 0);
  s.globalCompositeOperation = 'destination-out'; s.drawImage(ctx.canvas, -dir[0] * px, -dir[1] * px);
  s.globalCompositeOperation = 'source-in'; s.fillStyle = rim; s.fillRect(0, 0, CW, CW);
  ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.drawImage(scratch, 0, 0);
  // shadow wash from the far side
  const g = ctx.createLinearGradient(FEET[0] + dir[0] * 160, 0, FEET[0] - dir[0] * 160, 0);
  g.addColorStop(0, 'rgba(40,70,80,0)'); g.addColorStop(1, 'rgba(40,70,80,0.22)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CW);
  ctx.restore();
}

// ── Hero: owns the canvas + texture + world billboard
export class Hero {
  constructor() {
    this.canvas = document.createElement('canvas'); this.canvas.width = this.canvas.height = CW;
    this.scratch = document.createElement('canvas'); this.scratch.width = this.scratch.height = CW;
    this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas); this.tex.colorSpace = THREE.NoColorSpace; this.tex.premultiplyAlpha = true;
    this.tex.minFilter = THREE.LinearMipmapLinearFilter; this.tex.anisotropy = 4;
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...ENV, uTex: { value: this.tex }, uLight: { value: new THREE.Color(1, 1, 1) }, uOp: { value: 1 } },
      vertexShader: `varying vec2 vUv; varying vec3 vWP; void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `uniform sampler2D uTex; uniform vec3 uLight, uFlashCol; uniform float uOp; varying vec2 vUv; varying vec3 vWP;
        ${GLSL_ATMO}
        void main(){ vec4 t = texture2D(uTex, vUv); if (t.a < 0.004) discard; vec3 c = t.rgb * uLight + uFlashCol * 0.25 * t.a;
          float fk; vec3 cc = atmo(c / max(t.a, 1e-3), vWP, fk) * t.a; gl_FragColor = vec4(cc, t.a) * uOp; }`,
      transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    this.mat = mat;
    // plane sized so that BODY px = 1.7 m; anchor at the feet
    const m = 1.7 / BODY; const g = new THREE.PlaneGeometry(CW * m, CW * m); g.translate((CW / 2 - FEET[0]) * m, (FEET[1] - CW / 2) * m, 0);
    this.worldSprite = new THREE.Mesh(g, mat); this.worldSprite.frustumCulled = false; this.worldSprite.visible = false; this.worldSprite.renderOrder = 5;
    this.group = new THREE.Group();
  }
  // st.hero = {pos: Vector3 (feet), scale, pose: {...}, rimDir, light: Color, visible}
  update(t, st, cam) {
    const h = st.heroPose;
    if (!h) { this.worldSprite.visible = false; return; }
    if (h.pose.fly) drawFlyer(this.ctx, { t, ...h.pose }); else drawFigure(this.ctx, { t, ...h.pose });
    rimPass(this.ctx, this.scratch, h.rimDir || [-1, -0.3], h.rim || 'rgba(255,232,195,0.75)', h.rimPx || 3);
    this.tex.needsUpdate = true;
    const s = this.worldSprite; s.visible = true; s.position.copy(h.pos); s.scale.setScalar(h.scale || 1);
    // face the camera, keep upright relative to the camera's up
    s.quaternion.copy(cam.quaternion);
    if (h.roll) s.rotateZ(h.roll);
    this.mat.uniforms.uLight.value.copy(h.light || new THREE.Color(1, 1, 1));
    this.mat.uniforms.uOp.value = h.op ?? 1;
  }
}
