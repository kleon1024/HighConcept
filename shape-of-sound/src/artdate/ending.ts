// The ending inserts: two glasses clink over the black square, and (later) the museum seen in cross-section.
import { clamp01, inCubic, lerp, outBack, outCubic, range, VH, VW } from "./motion";
import { ARCH, Cam, P, PAL, poly } from "./world";

type Ctx = CanvasRenderingContext2D;
export const CLINK = 68.0;

// one wine glass held by a hand; (x, y) is the rim centre, tilt in radians, side = -1 (from the left) | 1 (from the right)
const glass = (ctx: Ctx, x: number, y: number, s: number, tilt: number, side: number, slosh: number, sleeve: string, sleeveDk: string) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s);
  const R = 62, bowlH = 120, stemH = 120;
  // sleeve + hand come in from the side, holding the stem
  ctx.save(); ctx.translate(0, bowlH + 40);
  ctx.fillStyle = sleeve; ctx.beginPath(); ctx.moveTo(side * 58, 22); ctx.bezierCurveTo(side * 200, 40, side * 380, 120, side * 620, 150); ctx.lineTo(side * 620, 360); ctx.bezierCurveTo(side * 380, 300, side * 200, 170, side * 70, 128); ctx.closePath(); ctx.fill();
  ctx.fillStyle = sleeveDk; ctx.beginPath(); ctx.moveTo(side * 66, 108); ctx.bezierCurveTo(side * 200, 150, side * 380, 280, side * 620, 330); ctx.lineTo(side * 620, 360); ctx.bezierCurveTo(side * 380, 300, side * 200, 170, side * 70, 128); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 4; ctx.lineCap = "round";                          // sleeve creases
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(side * (150 + i * 90), 60 + i * 28); ctx.quadraticCurveTo(side * (175 + i * 90), 110 + i * 34, side * (150 + i * 95), 165 + i * 38); ctx.stroke(); }
  ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(side * 90, 32); ctx.bezierCurveTo(side * 220, 55, side * 380, 128, side * 620, 160); ctx.stroke();
  ctx.fillStyle = "#F4EFE6"; ctx.beginPath(); ctx.moveTo(side * 50, 16); ctx.lineTo(side * 82, 20); ctx.lineTo(side * 92, 132); ctx.lineTo(side * 60, 130); ctx.closePath(); ctx.fill();   // shirt cuff
  ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#CFC6B6"; ctx.beginPath(); ctx.arc(side * 74, 74, 4.5, 0, Math.PI * 2); ctx.fill();
  const hg = ctx.createLinearGradient(side * -20, 0, side * 80, 130); hg.addColorStop(0, "#F0C4A2"); hg.addColorStop(1, "#C98B66");
  ctx.fillStyle = hg;                                                   // the hand: palm + wrapped fingers, shaded
  ctx.beginPath(); ctx.ellipse(side * 34, 70, 46, 58, side * 0.35, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(side * (6 - i * 2), 26 + i * 22, 22, 11, side * 0.1, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = "rgba(140,80,50,0.55)"; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(side * -8, 26 + i * 22, 9, side > 0 ? Math.PI * 0.6 : Math.PI * -0.4, side > 0 ? Math.PI * 1.4 : Math.PI * 0.4); ctx.stroke(); }
  ctx.fillStyle = "#EDBF9C"; ctx.beginPath(); ctx.ellipse(side * -14, 6, 12, 22, side * -0.5, 0, Math.PI * 2); ctx.fill();     // thumb
  ctx.fillStyle = "rgba(255,235,220,0.7)"; ctx.beginPath(); ctx.ellipse(side * -17, -6, 5, 7, side * -0.5, 0, Math.PI * 2); ctx.fill();   // nail
  ctx.restore();
  // foot + stem
  ctx.fillStyle = "rgba(220,230,240,0.35)"; ctx.beginPath(); ctx.ellipse(0, bowlH + stemH + 30, 56, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(240,245,255,0.75)"; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = "rgba(225,235,245,0.45)"; ctx.fillRect(-5, bowlH - 4, 10, stemH + 34);
  ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.fillRect(-2, bowlH, 2.5, stemH + 26);
  // the bowl (tulip): glass body, then the wine with a sloshing surface
  const bowl = () => { ctx.beginPath(); ctx.moveTo(-R * 0.86, 0); ctx.bezierCurveTo(-R * 1.08, bowlH * 0.55, -R * 0.62, bowlH, 0, bowlH); ctx.bezierCurveTo(R * 0.62, bowlH, R * 1.08, bowlH * 0.55, R * 0.86, 0); ctx.closePath(); };
  bowl(); ctx.fillStyle = "rgba(210,225,240,0.16)"; ctx.fill();
  ctx.save(); bowl(); ctx.clip();
  const lvl = bowlH * 0.48, sl = slosh * 16;
  const wg = ctx.createLinearGradient(0, lvl, 0, bowlH); wg.addColorStop(0, "#8E1B2E"); wg.addColorStop(1, "#3E0812");
  ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(-R * 1.2, lvl + sl); ctx.lineTo(R * 1.2, lvl - sl); ctx.lineTo(R * 1.2, bowlH + 5); ctx.lineTo(-R * 1.2, bowlH + 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(200,60,80,0.55)"; ctx.beginPath(); ctx.ellipse(0, lvl, R * 0.9, 7, -sl / R, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  bowl(); ctx.strokeStyle = "rgba(235,242,250,0.85)"; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 5; ctx.lineCap = "round";                     // highlights
  ctx.beginPath(); ctx.moveTo(-R * 0.7, bowlH * 0.12); ctx.quadraticCurveTo(-R * 0.86, bowlH * 0.5, -R * 0.45, bowlH * 0.82); ctx.stroke();
  ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(R * 0.62, bowlH * 0.2); ctx.quadraticCurveTo(R * 0.7, bowlH * 0.42, R * 0.58, bowlH * 0.6); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, R * 0.86, 9, 0, 0, Math.PI * 2); ctx.strokeStyle = "rgba(240,246,255,0.8)"; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.save(); ctx.filter = "blur(6px)"; ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.beginPath(); ctx.ellipse(-R * 0.45, bowlH * 0.32, R * 0.12, bowlH * 0.22, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();   // soft specular
  ctx.fillStyle = "rgba(255,190,200,0.35)"; ctx.beginPath(); ctx.ellipse(R * 0.25, bowlH * 0.75, R * 0.22, 6, 0, 0, Math.PI * 2); ctx.fill();   // wine caustic
  ctx.restore();
};

export const drawClink = (ctx: Ctx, t: number) => {
  if (t < 67.45 || t > 69.9) return;
  const s = t - CLINK;
  // anticipation (a small pull back), the approach, contact on the downbeat, a damped recoil
  let off: number;
  if (s < -0.32) off = lerp(900, 980, outCubic(range(t, 67.45, CLINK - 0.32)));
  else if (s < 0) off = lerp(980, 0, inCubic(clamp01((s + 0.32) / 0.32)));
  else off = 26 * Math.exp(-s * 7) * Math.sin(s * 22) + 6 * (1 - Math.exp(-s * 4));
  const fade = 1 - clamp01((t - 69.25) / 0.6), slosh = s > 0 ? Math.exp(-s * 3) * Math.sin(s * 14) : clamp01((s + 0.32) / 0.32) * 0.4;
  const cx = VW / 2, cy = VH * 0.22, sc = 1.0;
  ctx.save(); ctx.globalAlpha = fade;
  glass(ctx, cx - 58 * sc - off, cy, sc, 0.13, -1, -slosh, "#B98552", "#8E6236");
  glass(ctx, cx + 58 * sc + off, cy, sc, -0.13, 1, slosh, "#8A2436", "#5E1424");
  if (s >= 0 && s < 0.6) {                                              // a warm, soft flare at the contact point (no sparkles)
    const k = Math.exp(-s * 6), g = ctx.createRadialGradient(cx, cy + 10, 0, cx, cy + 10, 220 * (0.6 + s));
    g.addColorStop(0, `rgba(255,236,200,${0.55 * k})`); g.addColorStop(1, "rgba(255,236,200,0)");
    ctx.fillStyle = g; ctx.fillRect(cx - 300, cy - 290, 600, 600);
  }
  ctx.restore();
};
void outBack;

// ── the finale: the camera pulls back until the whole museum shows as a dollhouse section, four halls side by side
export const HALLS: [string, number, number, number][] = [["palace", -66, -30, 5.3], ["station", -30, 0, 9.9], ["cube", 0, 30, 3.9], ["design", 30, 58, 3.9]];
export const drawFinaleShell = (ctx: Ctx, c: Cam, t: number, inside: (id: string) => void) => {
  // sky at dusk and the ground
  const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, "#1C2A48"); g.addColorStop(0.62, "#B97A68"); g.addColorStop(0.8, "#F0B98A"); g.addColorStop(1, "#F0B98A");
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  const [, yg] = P(c, 0, 0, 0);
  ctx.fillStyle = "#2A221E"; ctx.fillRect(0, yg, VW, VH - yg);
  for (const [id, x0, x1, top] of HALLS) {
    const [X0, Y1] = P(c, x0, top, 0), [X1] = P(c, x1, 0, 0);
    if (X1 < -10 || X0 > VW + 10) continue;
    roof(ctx, c, id, x0, x1, top, t);
    ctx.save(); ctx.beginPath(); ctx.rect(X0, Y1, X1 - X0, yg - Y1 + 2); ctx.clip(); inside(id); ctx.restore();
    const lw = Math.max(2, 0.35 * c.s);                                 // the section cut (poché)
    ctx.strokeStyle = "#1A1512"; ctx.lineWidth = lw; ctx.strokeRect(X0, Y1, X1 - X0, yg - Y1);
  }
  ctx.fillStyle = "#1A1512"; ctx.fillRect(0, yg, VW, Math.max(3, 0.4 * c.s));
};
const roof = (ctx: Ctx, c: Cam, id: string, x0: number, x1: number, top: number, t: number) => {
  const p = PAL[id] ?? PAL.cube, R = (x: number, y: number) => P(c, x, y, 0);
  if (id === "palace") {                                                 // cream façade band, slate mansard, a small dome
    poly(ctx, [R(x0, top), R(x1, top), R(x1, top + 1.2), R(x0, top + 1.2)], "#E8DCC4");
    poly(ctx, [R(x0 - 0.3, top + 1.2), R(x1 + 0.3, top + 1.2), R(x1 - 1.5, top + 4), R(x0 + 1.5, top + 4)], "#3E4654");
    for (let x = x0 + 2; x < x1 - 1; x += 3) poly(ctx, [R(x, top + 1.6), R(x + 0.9, top + 1.6), R(x + 0.9, top + 2.8), R(x, top + 2.8)], "#E8DCC4");
    const cx = (x0 + x1) / 2, [X, Y] = R(cx, top + 4), r = 4 * c.s;
    ctx.fillStyle = "#4A5363"; ctx.beginPath(); ctx.arc(X, Y, r, Math.PI, 0); ctx.fill(); ctx.fillStyle = "#C99A3B"; ctx.fillRect(X - 0.12 * c.s, Y - r - 1.2 * c.s, 0.24 * c.s, 1.2 * c.s);
  } else if (id === "station") {                                         // the glazed iron shed and two clock pavilions
    poly(ctx, [R(x0 + 2, top), R(x1 - 2, top), R(x1 - 2, top + 3.4), R(x0 + 2, top + 3.4)], p.glass);
    for (let x = x0 + 2; x <= x1 - 2; x += 2) { const [a, b] = R(x, top), [, e] = R(x, top + 3.4); ctx.strokeStyle = p.rib; ctx.lineWidth = Math.max(1, 0.12 * c.s); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(a, e); ctx.stroke(); }
    for (const px of [x0, x1 - 4]) {
      poly(ctx, [R(px, top - 0.2), R(px + 4, top - 0.2), R(px + 4, top + 5), R(px, top + 5)], p.wall);
      const [X, Y] = R(px + 2, top + 3), r = 1.2 * c.s; ctx.fillStyle = p.gold; ctx.beginPath(); ctx.arc(X, Y, r * 1.15, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = p.clock; ctx.beginPath(); ctx.arc(X, Y, r, 0, Math.PI * 2); ctx.fill();
    }
  } else if (id === "cube") {
    poly(ctx, [R(x0, top), R(x1, top), R(x1, top + 1.0), R(x0, top + 1.0)], "#F1EEE8");
  } else {                                                               // flat roof, curtain-wall band, colour-coded pipes
    poly(ctx, [R(x0, top), R(x1, top), R(x1, top + 1.4), R(x0, top + 1.4)], p.glass);
    ["#2457A5", "#2E9B57", "#F2C230", "#D2342A"].forEach((col, i) => {
      poly(ctx, [R(x0, top + 1.5 + i * 0.5), R(x1, top + 1.5 + i * 0.5), R(x1, top + 1.85 + i * 0.5), R(x0, top + 1.85 + i * 0.5)], col);
      poly(ctx, [R(x0 + 3 + i * 6, top), R(x0 + 3.5 + i * 6, top), R(x0 + 3.5 + i * 6, top + 5), R(x0 + 3 + i * 6, top + 5)], col);
    });
  }
  void t; void ARCH;
};
