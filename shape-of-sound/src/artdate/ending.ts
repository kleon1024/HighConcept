// The ending inserts: two glasses clink over the black square, and (later) the museum seen in cross-section.
import { clamp01, inCubic, lerp, outBack, outCubic, range, VH, VW } from "./motion";

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
  ctx.fillStyle = "#F4EFE6"; ctx.beginPath(); ctx.moveTo(side * 52, 20); ctx.lineTo(side * 74, 22); ctx.lineTo(side * 84, 128); ctx.lineTo(side * 62, 126); ctx.closePath(); ctx.fill();   // shirt cuff
  ctx.fillStyle = "#E3AE88";                                            // the hand: palm + wrapped fingers
  ctx.beginPath(); ctx.ellipse(side * 34, 70, 46, 58, side * 0.35, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(side * (6 - i * 2), 26 + i * 22, 22, 11, side * 0.1, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = "rgba(150,90,60,0.55)"; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(side * -12, 37 + i * 22); ctx.lineTo(side * 18, 37 + i * 22); ctx.stroke(); }
  ctx.fillStyle = "#EDBF9C"; ctx.beginPath(); ctx.ellipse(side * -14, 6, 12, 22, side * -0.5, 0, Math.PI * 2); ctx.fill();     // thumb
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
