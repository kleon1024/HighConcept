// Transition masks: the next style "paints itself" over the frame. White = the new state shows.
import { clamp01, curl, hash, hash2, inOutSine, lerp, outCubic, outExpo, smooth, VH, VW } from "./motion";
import { Cam } from "./world";

type Ctx = CanvasRenderingContext2D;
const N = (n: number, f: (i: number) => void) => { for (let i = 0; i < n; i++) f(i); };

export const drawMask = (m: Ctx, kind: string, p: number, c: Cam, t: number) => {
  m.save(); m.fillStyle = "#fff"; m.strokeStyle = "#fff"; m.lineCap = "round"; m.lineJoin = "round";
  if (p >= 1) { m.fillRect(0, 0, VW, VH); m.restore(); return; }
  switch (kind) {
    case "brush": case "stone": {                 // long loaded-brush strokes sweep left → right, row by row
      const rows = 9;
      N(rows * 3, (i) => {
        const row = i % rows, k = Math.floor(i / rows), y = (row + 0.5) * (VH / rows) + (hash(i) - 0.5) * 40;
        const start = (row / rows) * 0.25 + k * 0.18 + hash(i * 3) * 0.08, q = outCubic(clamp01((p - start) / 0.5));
        if (q <= 0) return;
        const x0 = -60 + k * VW * 0.33 - hash(i * 7) * 120, x1 = x0 + (VW * 0.55 + 200) * q, w = VH / rows * 1.5;
        for (let b = 0; b < 6; b++) {                // bristles: several offset strokes with ragged ends
          m.lineWidth = w * (0.35 + hash(i * 11 + b) * 0.3); const dy = (b / 5 - 0.5) * w * 0.7;
          m.beginPath(); m.moveTo(x0 + hash(b + i) * 40, y + dy - 18); m.quadraticCurveTo((x0 + x1) / 2, y + dy + 12, x1 - hash(b * 3 + i) * 60, y + dy - 22); m.stroke();
        }
      });
      if (p > 0.85) { m.globalAlpha = (p - 0.85) / 0.15; m.fillRect(0, 0, VW, VH); }
      break;
    }
    case "dabs": case "iron": {                    // dabs bloom outward from the couple
      const n = 520, cx = VW * 0.4, cy = VH * 0.6;
      N(n, (i) => {
        const a = hash(i) * Math.PI * 2, r = Math.sqrt(hash(i * 1.7)) * 1050, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.8;
        const start = (r / 1050) * 0.6 + hash(i * 5) * 0.2, q = outExpo(clamp01((p - start) / 0.25));
        if (q <= 0) return;
        m.save(); m.translate(x, y); m.rotate(hash(i * 9) * 3); m.beginPath(); m.ellipse(0, 0, 58 * q, 34 * q, 0, 0, Math.PI * 2); m.fill(); m.restore();
      });
      break;
    }
    case "dots": {
      const g = 24;
      for (let y = 0; y < VH + g; y += g) for (let x = 0; x < VW + g; x += g) {
        const start = hash2(x, y) * 0.7, q = clamp01((p - start) / 0.3);
        if (q > 0) { m.beginPath(); m.arc(x, y, g * 0.75 * smooth(q), 0, Math.PI * 2); m.fill(); }
      }
      break;
    }
    case "swirl": {
      N(420, (i) => {
        let x = hash(i) * VW, y = hash(i * 2.3) * VH; const start = hash(i * 4.1) * 0.6, q = clamp01((p - start) / 0.4);
        if (q <= 0) return;
        m.lineWidth = 34; m.beginPath(); m.moveTo(x, y);
        for (let s = 0; s < 14 * q; s++) { const [u, v] = curl(x, y, 0.004), L = Math.hypot(u, v) || 1; x += (u / L) * 14; y += (v / L) * 14; m.lineTo(x, y); }
        m.stroke();
      });
      if (p > 0.8) { m.globalAlpha = (p - 0.8) / 0.2; m.fillRect(0, 0, VW, VH); }
      break;
    }
    case "roller": {                               // a paint roller wipes white from left to right (with a soft nap edge)
      const x = lerp(-120, VW + 120, inOutSine(p));
      m.fillRect(0, 0, x - 40, VH);
      N(60, (i) => { const y = (i / 60) * VH, dx = (hash(i * 3.3 + Math.floor(t * 10)) - 0.5) * 50; m.fillRect(x - 40, y, 40 + dx, VH / 60 + 1); });
      break;
    }
    case "splash": {                               // wild colour splashes from the painting
      N(36, (i) => {
        const cx = VW * (0.2 + hash(i) * 0.6), cy = VH * (0.2 + hash(i * 3) * 0.6), q = outExpo(clamp01((p - hash(i * 5) * 0.4) / 0.4)), R = 260 * q * (0.6 + hash(i * 7));
        if (R <= 0) return;
        m.beginPath(); for (let k = 0; k <= 24; k++) { const a = (k / 24) * Math.PI * 2, rr = R * (0.75 + 0.35 * hash(i * 13 + k)); m.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } m.fill();
      });
      break;
    }
    case "facets": {                               // shards fly in and lock together
      const cols = 9, rows = 7, w = VW / cols, h = VH / rows;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) for (let tri = 0; tri < 2; tri++) {
        const id = j * 20 + i * 2 + tri, q = outCubic(clamp01((p - hash(id) * 0.5) / 0.45));
        if (q <= 0) continue;
        const jx = (a: number, b: number) => (hash2(a, b) - 0.5) * w * 0.5;
        const P0: [number, number] = [i * w + jx(i, j), j * h + jx(j, i)], P1: [number, number] = [(i + 1) * w + jx(i + 1, j), j * h + jx(j, i + 1)], P2: [number, number] = [(i + 1) * w + jx(i + 1, j + 1), (j + 1) * h + jx(j + 1, i + 1)], P3: [number, number] = [i * w + jx(i, j + 1), (j + 1) * h + jx(j + 1, i)];
        const pts = tri ? [P0, P1, P2] : [P0, P2, P3], cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
        m.save(); m.translate(cx + (1 - q) * (hash(id * 3) - 0.5) * 300, cy + (1 - q) * (hash(id * 7) - 0.5) * 300); m.rotate((1 - q) * (hash(id * 9) - 0.5) * 2); m.scale(lerp(0.2, 1.02, q), lerp(0.2, 1.02, q));
        m.beginPath(); pts.forEach(([x, y], k) => (k ? m.lineTo(x - cx, y - cy) : m.moveTo(x - cx, y - cy))); m.closePath(); m.fill(); m.restore();
      }
      break;
    }
    case "blocks": {                               // Suprematist slabs drop in at angles
      N(14, (i) => {
        const q = outCubic(clamp01((p - i * 0.045) / 0.4)), w = 240 + hash(i) * 420, h = 120 + hash(i * 3) * 380;
        if (q <= 0) return;
        m.save(); m.translate(hash(i * 5) * VW, lerp(-500, hash(i * 7) * VH, q)); m.rotate((hash(i * 9) - 0.5) * 0.6); m.fillRect(-w / 2, -h / 2, w, h); m.restore();
      });
      if (p > 0.75) { m.globalAlpha = (p - 0.75) / 0.25; m.fillRect(0, 0, VW, VH); }
      break;
    }
    case "tear": {                                 // a torn paper edge rips across
      const x = lerp(-200, VW + 200, outCubic(p));
      m.beginPath(); m.moveTo(-10, -10);
      for (let y = -10; y <= VH + 20; y += 18) m.lineTo(x + (hash(y * 0.31) - 0.5) * 70 + Math.sin(y * 0.01) * 60, y);
      m.lineTo(-10, VH + 20); m.closePath(); m.fill();
      break;
    }
    case "bleed": {                                // colour bleeds in softly
      m.filter = "blur(30px)";
      N(10, (i) => { const q = outCubic(clamp01((p - hash(i) * 0.4) / 0.6)); m.beginPath(); m.arc(hash(i * 3) * VW, hash(i * 5) * VH, 700 * q, 0, Math.PI * 2); m.fill(); });
      break;
    }
    case "halftone": {                             // a Ben-Day dot wipe along the diagonal
      const g = 26;
      for (let y = 0; y < VH + g; y += g) for (let x = (y / g) % 2 ? g / 2 : 0; x < VW + g; x += g) {
        const d = (x / VW) * 0.6 + (y / VH) * 0.4, r = clamp01((p * 1.6 - d) * 2.2) * g * 0.75;
        if (r > 0) { m.beginPath(); m.arc(x, y, r, 0, Math.PI * 2); m.fill(); }
      }
      break;
    }
    case "grid": case "panels": {                  // blocks slide in on a grid, row by row, alternating directions
      const g = 135;
      for (let j = 0; j * g < VH; j++) for (let i = 0; i * g < VW + g; i++) {
        const q = outCubic(clamp01((p - j * 0.06 - (i % 4) * 0.035) / 0.42));
        if (q <= 0) continue;
        const dir = j % 2 ? 1 : -1;
        m.fillRect(i * g + dir * (1 - q) * g * 1.6, j * g, g + 1, g + 1);
      }
      break;
    }
    case "whiplash": {                             // an Art Nouveau S-curve sweeps the frame
      const x = lerp(-400, VW + 400, inOutSine(p));
      m.beginPath(); m.moveTo(-10, -10);
      for (let y = -10; y <= VH + 10; y += 10) m.lineTo(x + Math.sin(y / VH * Math.PI * 2.2) * 220, y);
      m.lineTo(-10, VH + 10); m.closePath(); m.fill();
      break;
    }
    case "sunburst": {                             // Deco rays open like a fan
      const cx = VW * 0.33, cy = VH * 1.05;
      N(18, (i) => {
        const a0 = Math.PI + (i / 18) * Math.PI, q = outCubic(clamp01((p - Math.abs(i - 9) * 0.03) / 0.5)), da = (Math.PI / 18) * q;
        if (q <= 0) return;
        m.beginPath(); m.moveTo(cx, cy); m.arc(cx, cy, 2400, a0, a0 + da); m.closePath(); m.fill();
      });
      break;
    }
    case "pipes": {
      N(12, (i) => { const y = (i / 12) * VH, q = outCubic(clamp01((p - (i % 4) * 0.08) / 0.6)); m.fillRect(0, y, VW * q, VH / 12 + 1); });
      break;
    }
    default: m.globalAlpha = p; m.fillRect(0, 0, VW, VH);
  }
  m.restore();
  void c;
};
