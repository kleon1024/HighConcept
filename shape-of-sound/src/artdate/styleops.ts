// The NPR passes per style (hall source = bg, couple layer = fg), hall ornaments, the geometric couples (Bauhaus,
// Suprematist) and the original pastiche artworks (urinal, colour field, pop panel, Deco and Bauhaus posters) —
// all drawn here as 风格示意, never copied from a real work.
import { coupleScreen, poseAt } from "./couple";
import { clamp01, hash, hash2, lerp, mulberry, VH, VW } from "./motion";
import { brokenColour, field, grab, hsl, paintDots, paintLayered, paintStrokes, plainColour, px, rgb2hsl, Src } from "./npr";
import { Cam } from "./world";

type Ctx = CanvasRenderingContext2D;
const boil = (t: number, fps = 10) => Math.floor(t * fps);             // painterly styles re-seed 10× a second
const mk = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };

// ── Fauvism: colour that does not describe — shadows go complementary, greys get a hue, bare canvas shows through
const fauveCol = (r: number, g: number, b: number, rnd: number, x: number, y: number) => {
  let [h, s, l] = rgb2hsl(r, g, b);
  if (s < 0.12) h = [330, 50, 150, 200, 20][Math.floor(hash2(Math.floor(x / 90), Math.floor(y / 90)) * 5)];
  if (l < 0.33) h += 160; else if (l < 0.55) h += (rnd - 0.5) * 30; else h += 25;
  return hsl(h, 0.78 + rnd * 0.15, Math.min(0.78, Math.max(0.28, l * 0.95 + 0.06)));
};

// ── Cubism: Voronoi facets mapped to the analytic palette, each shaded along its own direction, some displaced
const CUB = ["#2B241B", "#45392A", "#5E5039", "#7A6A4E", "#958166", "#B19C78", "#CDB991", "#E2D3AE", "#6F7465", "#8C8E7A"].map((c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]);
const cubist = (out: Ctx, s: Src, o: { g: number; seed: number; ox: number; mask: boolean; region: [number, number, number, number] }) => {
  const W2 = VW / 2, H2 = VH / 2, g = o.g, [x0, y0, x1, y1] = o.region, rnd = mulberry(o.seed * 7 + 3);
  const seeds: { x: number; y: number; c: number[]; dx: number; dy: number; w: number }[] = [];
  const gx0 = Math.floor((x0 + o.ox) / g) - 1, gx1 = Math.ceil((x1 + o.ox) / g) + 1;
  for (let j = Math.floor(y0 / g) - 1; j <= Math.ceil(y1 / g) + 1; j++) for (let i = gx0; i <= gx1; i++) {
    const x = i * g - o.ox + (hash2(i, j + o.seed) - 0.5) * g * 0.9, y = j * g + (hash2(j * 3.1, i + o.seed) - 0.5) * g * 0.9;
    if (o.mask && px(s, x, y)[3] < 60) continue;
    const disp = hash2(i * 1.3, j * 0.7) < 0.28 ? 26 : 0, sx = x + (hash2(i, j) - 0.5) * disp, sy = y + (hash2(j, i) - 0.5) * disp;
    let L = 0, A = [0, 0, 0];
    for (let k = 0; k < 5; k++) { const [r, gg, b] = px(s, sx + (k % 3 - 1) * g * 0.2, sy + (Math.floor(k / 3) - 0.5) * g * 0.25); A = [A[0] + r, A[1] + gg, A[2] + b]; L += 0.3 * r + 0.59 * gg + 0.11 * b; }
    L /= 5 * 255;
    const pick = Math.min(CUB.length - 1, Math.max(0, Math.round(L * 7 + (hash2(i, j * 2) > 0.8 ? 8 - L * 7 : 0) * 0 + (hash2(i * 5, j) - 0.5) * 1.4)));
    const base = hash2(i * 9, j * 9) > 0.86 ? CUB[8 + (i + j) % 2] : CUB[pick];
    const a = hash2(i * 2.2, j * 1.7) * Math.PI * 2;
    seeds.push({ x, y, c: base, dx: Math.cos(a), dy: Math.sin(a), w: 0.8 + hash2(i, j * 4) * 0.5 });
  }
  void rnd;
  const cs = g, cols = Math.ceil(VW / cs) + 3, rows = Math.ceil(VH / cs) + 3, buckets: number[][] = Array.from({ length: cols * rows }, () => []);
  seeds.forEach((p, k) => { const bi = Math.floor(p.x / cs) + 1, bj = Math.floor(p.y / cs) + 1; if (bi >= 0 && bi < cols && bj >= 0 && bj < rows) buckets[bj * cols + bi].push(k); });
  const cv = mk(W2, H2), cx = cv.getContext("2d")!, im = cx.createImageData(W2, H2), d = im.data, idx = new Int32Array(W2 * H2).fill(-1);
  for (let y = Math.max(0, Math.floor(y0 / 2)); y < Math.min(H2, Math.ceil(y1 / 2)); y++) for (let x = Math.max(0, Math.floor(x0 / 2)); x < Math.min(W2, Math.ceil(x1 / 2)); x++) {
    const X = x * 2, Y = y * 2, bi = Math.floor(X / cs) + 1, bj = Math.floor(Y / cs) + 1;
    let best = -1, bd = 1e12;
    for (let q = -1; q <= 1; q++) for (let r = -1; r <= 1; r++) { const bb = buckets[(bj + q) * cols + bi + r]; if (!bb) continue; for (const k of bb) { const p = seeds[k], dd = ((p.x - X) ** 2 + (p.y - Y) ** 2) * p.w; if (dd < bd) { bd = dd; best = k; } } }
    if (best < 0) continue;
    const a = o.mask ? s.d[((Y | 0) * VW + (X | 0)) * 4 + 3] : 255;
    if (a < 30) continue;
    idx[y * W2 + x] = best;
    const p = seeds[best], sh = 1 + (((X - p.x) * p.dx + (Y - p.y) * p.dy) / g) * 0.42, i4 = (y * W2 + x) * 4;
    d[i4] = Math.min(255, p.c[0] * sh); d[i4 + 1] = Math.min(255, p.c[1] * sh); d[i4 + 2] = Math.min(255, p.c[2] * sh); d[i4 + 3] = a;
  }
  for (let y = 0; y < H2 - 1; y++) for (let x = 0; x < W2 - 1; x++) {   // facet edges
    const k = idx[y * W2 + x]; if (k < 0) continue;
    if (k !== idx[y * W2 + x + 1] || k !== idx[(y + 1) * W2 + x]) { const i4 = (y * W2 + x) * 4; d[i4] *= 0.35; d[i4 + 1] *= 0.33; d[i4 + 2] *= 0.3; }
  }
  cx.putImageData(im, 0, 0);
  out.save(); out.imageSmoothingEnabled = true; out.drawImage(cv, 0, 0, VW, VH); out.restore();
};

// ── Dada: the couple rebuilt from torn scraps — newsprint, halftone photo, coloured paper
let _news: HTMLCanvasElement | null = null;
const newsprint = () => {
  if (_news) return _news;
  _news = mk(256, 256); const g = _news.getContext("2d")!, r = mulberry(11);
  g.fillStyle = "#EDE6D3"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#3A3631";
  for (let y = 6; y < 256; y += 9) { let x = 4; while (x < 250) { const w = 4 + r() * 22; g.globalAlpha = 0.55 + r() * 0.3; g.fillRect(x, y, w, 4); x += w + 3; } }
  g.globalAlpha = 1; g.font = "900 46px 'Noto Serif SC', serif"; g.fillText("DADA", 18, 120); g.font = "700 22px 'Noto Sans SC'"; g.fillText("CABARET VOLTAIRE", 12, 200);
  return _news;
};
const dada = (out: Ctx, src: Ctx, region: [number, number, number, number], seed: number) => {
  const [x0, y0, x1, y1] = region, tmp = mk(VW, VH), tg = tmp.getContext("2d")!, pat = tg.createPattern(newsprint(), "repeat")!;
  const cols = 4, rows = 7, w = (x1 - x0) / cols, h = (y1 - y0) / rows, papers = ["#C9342B", "#E3C77A", "#2E4A6B", "#F2EBDD"];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const k = j * cols + i, cx = x0 + (i + 0.5) * w, cy = y0 + (j + 0.5) * h, rr = hash(k + seed * 0.1);
    const pts: [number, number][] = [];
    for (let q = 0; q < 9; q++) { const a = (q / 9) * Math.PI * 2, rad = (0.62 + hash2(k, q) * 0.25) * Math.max(w, h) * 0.75; pts.push([cx + Math.cos(a) * rad * (w / Math.max(w, h)), cy + Math.sin(a) * rad * (h / Math.max(w, h))]); }
    tg.save(); tg.translate(cx, cy); tg.rotate((rr - 0.5) * 0.25); tg.translate(-cx + (hash(k * 3) - 0.5) * 10, -cy + (hash(k * 5) - 0.5) * 8);
    tg.beginPath(); pts.forEach(([x, y], q) => (q ? tg.lineTo(x, y) : tg.moveTo(x, y))); tg.closePath();
    tg.shadowColor = "rgba(0,0,0,0.3)"; tg.shadowBlur = 6; tg.shadowOffsetX = 2; tg.shadowOffsetY = 3;
    tg.fillStyle = "#FBF7EC"; tg.fill(); tg.shadowColor = "transparent";
    tg.save(); tg.clip();
    if (rr < 0.4) { tg.filter = "grayscale(1) contrast(1.8) brightness(1.1)"; tg.drawImage(src.canvas, 0, 0); tg.filter = "none"; }
    else if (rr < 0.68) { tg.fillStyle = pat; tg.fillRect(cx - w, cy - h, w * 2, h * 2); tg.globalCompositeOperation = "multiply"; tg.globalAlpha = 0.5; tg.drawImage(src.canvas, 0, 0); tg.globalAlpha = 1; tg.globalCompositeOperation = "source-over"; }
    else { tg.fillStyle = papers[Math.floor(hash(k * 7) * 4)]; tg.fillRect(cx - w, cy - h, w * 2, h * 2); tg.globalAlpha = 0.25; tg.drawImage(src.canvas, 0, 0); tg.globalAlpha = 1; }
    tg.restore();
    tg.strokeStyle = "rgba(255,252,244,0.9)"; tg.lineWidth = 2.5; tg.stroke();
    tg.restore();
  }
  // keep the scraps inside a slightly dilated silhouette so the couple still reads
  const m = mk(VW, VH), mg = m.getContext("2d")!; mg.filter = "blur(5px)"; mg.drawImage(src.canvas, 0, 0); mg.drawImage(src.canvas, 0, 0);
  tg.globalCompositeOperation = "destination-in"; tg.drawImage(m, 0, 0); tg.globalCompositeOperation = "source-over";
  out.drawImage(tmp, 0, 0);
};

export const stylizeBg = (out: Ctx, src: Ctx, kind: string, c: Cam, t: number, style: string) => {
  const ox = c.x * c.s, b = boil(t);
  if (kind === "none") { out.drawImage(src.canvas, 0, 0); return; }
  if (kind === "soft") { out.save(); out.filter = "blur(18px) saturate(1.5)"; out.drawImage(src.canvas, 0, 0); out.restore(); out.fillStyle = "rgba(120,30,30,0.18)"; out.fillRect(0, 0, VW, VH); return; }
  const s = grab(src);
  if (kind === "dabs") {
    out.save(); out.filter = "blur(6px)"; out.drawImage(src.canvas, 0, 0); out.restore();
    const f = field(s, 8);
    paintLayered(out, s, f, [
      { grid: 15, len: [20, 30], width: [11, 15], ox, follow: 0.5, angle: -0.3, wander: 0.6, bend: 0.25, ridge: 0.12 },
      { grid: 9, len: [12, 18], width: [6, 8.5], ox, follow: 0.75, angle: -0.3, wander: 0.5, bend: 0.25, ridge: 0.14, thresh: 40 },
      { grid: 6, len: [7, 11], width: [3.5, 5], ox, follow: 0.85, angle: 0.4, wander: 0.4, bend: 0.2, ridge: 0.1, thresh: 46 },
    ], b % 3, brokenColour(1.12, 1));
    return;
  }
  if (kind === "dots") {
    out.fillStyle = "#F4EEDF"; out.fillRect(0, 0, VW, VH);
    out.save(); out.filter = "blur(5px)"; out.globalAlpha = 0.75; out.drawImage(src.canvas, 0, 0); out.restore();
    paintDots(out, s, { grid: 5.5, r: [2.4, 3.2], seed: b % 4, ox });
    return;
  }
  if (kind === "swirl") {
    out.save(); out.filter = "blur(4px)"; out.drawImage(src.canvas, 0, 0); out.restore();
    const f = field(s, 8);
    paintLayered(out, s, f, [
      { grid: 8, len: [20, 30], width: [6, 8], ox, follow: 0.3, swirl: 0.8, bend: 0.7, edge: 0.18, ridge: 0.16 },
      { grid: 6, len: [12, 18], width: [3.5, 5], ox, follow: 0.5, swirl: 0.6, bend: 0.6, edge: 0.15, ridge: 0.12, thresh: 30 },
    ], b % 3, plainColour(1.5, 0.02, 0.14));
    return;
  }
  if (kind === "oil" || kind === "sfumato") {
    const soft = kind === "sfumato";
    out.save(); out.filter = soft ? "blur(3px)" : "blur(2px)"; out.drawImage(src.canvas, 0, 0); out.restore();
    const f = field(s, 8);
    paintLayered(out, s, f, [
      { grid: soft ? 12 : 13, len: soft ? [14, 22] : [18, 28], width: soft ? [8, 11] : [9, 12], ox, follow: 0.8, angle: 0.2, wander: 0.4, bend: 0.2, alpha: soft ? 0.5 : 0.8, ridge: soft ? 0.04 : 0.09 },
      { grid: 7, len: soft ? [8, 12] : [9, 14], width: [4, 6], ox, follow: 0.9, angle: 0.2, wander: 0.3, bend: 0.2, alpha: soft ? 0.5 : 0.85, ridge: 0.06, thresh: soft ? 50 : 40 },
    ], b % 3, plainColour(soft ? 0.92 : 1.1, 0, soft ? 0.03 : 0.06));
    return;
  }
  if (kind === "fauve") {
    out.fillStyle = "#F4EAD2"; out.fillRect(0, 0, VW, VH);                   // bare canvas between the strokes
    paintStrokes(out, s, field(s, 8), { grid: 12, len: [24, 38], width: [14, 19], seed: b % 3, ox, follow: 0.55, angle: 0.25, wander: 0.8, bend: 0.3, jitter: 1, colour: (r, g, bb, rnd, x, y) => (rnd < 0.04 ? "" : fauveCol(r, g, bb, rnd, x, y)) });
    return;
  }
  if (kind === "cubist") { cubist(out, s, { g: 64, seed: b % 2, ox, mask: false, region: [0, 0, VW, VH] }); return; }
  out.drawImage(src.canvas, 0, 0);
  void style;
};

export const stylizeFg = (out: Ctx, src: Ctx, kind: string, c: Cam, t: number, style: string) => {
  const b = boil(t);
  if (kind === "none") { out.drawImage(src.canvas, 0, 0); return; }
  if (kind === "soft") { out.save(); out.filter = "blur(4px) saturate(1.6)"; out.drawImage(src.canvas, 0, 0); out.filter = "blur(18px)"; out.globalAlpha = 0.5; out.globalCompositeOperation = "screen"; out.drawImage(src.canvas, 0, 0); out.restore(); return; }
  const s = grab(src), region = bbox(s);
  if (!region) return;
  if (kind === "dabs") {
    out.save(); out.globalAlpha = 0.95; out.filter = "blur(1.5px)"; out.drawImage(src.canvas, 0, 0); out.restore();
    const f = field(s, 4);
    paintLayered(out, s, f, [
      { grid: 8, len: [10, 15], width: [6, 8], follow: 0.75, angle: 1.45, bend: 0.25, maskA: true, region, ridge: 0.12 },
      { grid: 4.5, len: [6, 9], width: [3, 4.5], follow: 0.85, angle: 1.45, bend: 0.2, maskA: true, region, ridge: 0.1, thresh: 36 },
    ], 5 + (b % 3), brokenColour(1.12, 0.55));
    return;
  }
  if (kind === "dots") { paintDots(out, s, { grid: 5, r: [2.0, 2.8], seed: 3 + (b % 4), maskA: true, region }); return; }
  if (kind === "swirl") {
    const f = field(s, 5);
    out.save(); out.globalAlpha = 0.85; out.drawImage(src.canvas, 0, 0); out.restore();
    paintStrokes(out, s, f, { grid: 6, len: [14, 22], width: [4, 5.5], seed: b % 3, follow: 0.6, swirl: 0.45, bend: 0.5, edge: 0.4, maskA: true, region, colour: plainColour(1.5, 0.03, 0.14), ridge: 0.12 });
    return;
  }
  if (kind === "oil" || kind === "sfumato") {
    const soft = kind === "sfumato";
    out.save(); out.filter = soft ? "blur(1.6px)" : "blur(0.8px)"; out.drawImage(src.canvas, 0, 0); out.restore();
    const f = field(s, 5);
    paintStrokes(out, s, f, { grid: 5, len: soft ? [6, 10] : [7, 12], width: [3.5, 5], seed: b % 3, follow: 0.85, angle: 1.4, bend: 0.2, alpha: soft ? 0.45 : 0.7, maskA: true, region, colour: plainColour(1.05, 0, 0.04), ridge: 0.06 });
    return;
  }
  if (kind === "fauve") {
    out.save(); out.filter = "blur(2px) saturate(2.2) hue-rotate(-12deg)"; out.drawImage(src.canvas, 0, 0); out.restore();
    paintStrokes(out, s, field(s, 4), { grid: 6, len: [11, 17], width: [6, 8], seed: b % 3, follow: 0.7, angle: 1.4, bend: 0.25, maskA: true, region, colour: fauveCol });
    return;
  }
  if (kind === "cubist") { cubist(out, s, { g: 26, seed: 5 + (b % 2), ox: 0, mask: true, region }); return; }
  if (kind === "dada") { dada(out, src, region, Math.floor(t * 4)); return; }
  out.drawImage(src.canvas, 0, 0);
  void c; void style;
};

// bounding box of the opaque pixels (sampled), so the couple's strokes only cover the couple
const bbox = (s: Src): [number, number, number, number] | null => {
  let x0 = s.w, y0 = s.h, x1 = -1, y1 = -1;
  for (let y = 0; y < s.h; y += 6) for (let x = 0; x < s.w; x += 6) if (s.d[(y * s.w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : [x0 - 12, y0 - 12, x1 + 12, y1 + 12];
};

// ── ornaments on the hall source (before any paint) — they belong to the room, not to the art
export const drawOrn = (ctx: Ctx, kind: string | undefined, c: Cam, t: number) => {
  if (!kind) return;
  const ox = ((c.x * c.s) % 2400 + 2400) % 2400;
  ctx.save();
  if (kind === "pop") {                                                    // Ben-Day dots over the wall
    const tile = mk(16, 16), g = tile.getContext("2d")!; g.fillStyle = "#E8322B"; for (const [x, y] of [[0, 0], [16, 0], [0, 16], [16, 16], [8, 8]]) { g.beginPath(); g.arc(x, y, 2.6, 0, Math.PI * 2); g.fill(); }
    ctx.globalAlpha = 0.32; ctx.globalCompositeOperation = "multiply"; ctx.translate(-(ox % 16), 0); ctx.fillStyle = ctx.createPattern(tile, "repeat")!; ctx.fillRect(0, 0, VW + 16, VH * 0.82);
  } else if (kind === "nouveau") {                                         // whiplash tendrils climbing the wall
    ctx.strokeStyle = "#7A5A36"; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.globalAlpha = 0.85;
    for (let i = -1; i < 4; i++) {
      const x = i * 520 - (ox % 520) + 120;
      ctx.beginPath(); ctx.moveTo(x, VH * 0.82);
      ctx.bezierCurveTo(x + 160, VH * 0.6, x - 140, VH * 0.42, x + 60, VH * 0.18); ctx.bezierCurveTo(x + 160, VH * 0.05, x + 260, VH * 0.14, x + 210, VH * 0.24); ctx.stroke();
      ctx.fillStyle = "#A8B58A"; for (let k = 0; k < 5; k++) { const yy = VH * (0.72 - k * 0.11), xx = x + Math.sin(k * 1.7) * 70; ctx.beginPath(); ctx.ellipse(xx + 22, yy, 26, 10, -0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = "#D9A6A0"; ctx.beginPath(); ctx.arc(x + 210, VH * 0.24, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  } else if (kind === "deco") {                                            // a gold sunburst and stepped chevrons
    const cx = VW * 0.42, cy = VH * 0.95;
    ctx.strokeStyle = "#D4AF37"; ctx.globalAlpha = 0.55;
    for (let k = 0; k < 36; k++) { const a = Math.PI + (k / 36) * Math.PI; ctx.lineWidth = k % 2 ? 1.5 : 4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 1600, cy + Math.sin(a) * 1600); ctx.stroke(); }
    ctx.globalAlpha = 0.9; ctx.lineWidth = 3;
    for (let k = 0; k < 4; k++) { const y = 70 + k * 16; ctx.beginPath(); for (let x = -40 - (ox % 80); x < VW + 80; x += 80) { ctx.lineTo(x, y); ctx.lineTo(x + 40, y - 18); } ctx.stroke(); }
  } else if (kind === "dada") {                                            // pasted letters on the white wall
    const words = ["DA", "DA", "!", "?", "达"];
    for (let i = 0; i < 6; i++) {
      const x = ((i * 430 - ox * 1.0) % 2200 + 2200) % 2200 - 300, y = 80 + (i % 3) * 120;
      ctx.save(); ctx.translate(x, y); ctx.rotate((hash(i) - 0.5) * 0.5);
      ctx.fillStyle = ["#F2E8D0", "#1B1B1B", "#C9342B"][i % 3]; ctx.fillRect(-10, -70, 150, 90);
      ctx.fillStyle = i % 3 === 1 ? "#F2E8D0" : "#1B1B1B"; ctx.font = `900 ${70 + (i % 2) * 20}px 'Noto Serif SC', serif`; ctx.fillText(words[i % 5], 0, 4);
      ctx.restore();
    }
  }
  ctx.restore();
  void t;
};

// ── geometric couples
export const drawBauhausCouple = (ctx: Ctx, c: Cam, t: number) => {
  const cs = coupleScreen(c, t), k = cs.k, him = poseAt("him", t), her = poseAt("her", t);
  const fig = (X: number, Y: number, p: typeof him, female: boolean) => {
    const bob = Math.abs(Math.cos(p.phase)) * 1.4 * p.walk * k, st = Math.sin(p.phase) * p.walk;
    ctx.save(); ctx.translate(X, Y - bob);
    ctx.fillStyle = "#141414";
    for (const s of [-1, 1]) ctx.fillRect(s * 7 * k - 3 * k, -58 * k + Math.max(0, s * st) * 8 * k, 6 * k, 58 * k - Math.max(0, s * st) * 8 * k);
    if (female) { ctx.fillStyle = "#D2342A"; ctx.beginPath(); ctx.moveTo(0, -138 * k); ctx.lineTo(26 * k, -52 * k); ctx.lineTo(-26 * k, -52 * k); ctx.closePath(); ctx.fill(); }
    else { ctx.fillStyle = "#F2C230"; ctx.fillRect(-22 * k, -146 * k, 44 * k, 90 * k); ctx.fillStyle = "#141414"; ctx.beginPath(); ctx.moveTo(-22 * k, -56 * k); ctx.lineTo(22 * k, -56 * k); ctx.lineTo(22 * k, -100 * k); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = "#141414"; ctx.lineWidth = 4 * k; ctx.lineCap = "round";
    const up = p.chin + p.point + p.excited, sh = p.shrug;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * (female ? 9 : 20) * k, -136 * k); ctx.lineTo(s * (24 + sh * 14) * k, (-100 - up * (s > 0 ? 40 : 0) - sh * 20) * k); ctx.stroke(); ctx.fillStyle = "#141414"; ctx.beginPath(); ctx.arc(s * (24 + sh * 14) * k, (-100 - up * (s > 0 ? 40 : 0) - sh * 20) * k, 3 * k, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = female ? "#141414" : "#2457A5"; ctx.beginPath(); ctx.arc(p.turn * 3 * k, (female ? -150 : -162) * k, 11.5 * k, 0, Math.PI * 2); ctx.fill();
    if (female) { ctx.fillStyle = "#D2342A"; ctx.beginPath(); ctx.arc(p.turn * 3 * k, -150 * k, 11.5 * k, Math.PI * 0.5 - p.turn, Math.PI * 1.5 - p.turn); ctx.fill(); }
    ctx.restore();
  };
  fig(cs.her[0], cs.her[1], her, true); fig(cs.him[0], cs.him[1], him, false);
};
export const drawSupremCouple = (ctx: Ctx, c: Cam, t: number) => {
  const cs = coupleScreen(c, t), k = cs.k, f = Math.sin(t * 1.6) * 2 * k;
  const sq = (x: number, y: number, s: number, rot: number, col: string) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = col; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore(); };
  ctx.save();
  sq(cs.him[0], cs.him[1] - 112 * k + f, 64 * k, -0.1, "#151515");                      // him: the black square
  sq(cs.her[0] + 4 * k, cs.her[1] - 96 * k - f, 46 * k, 0.16, "#C8322B");               // her: the red square
  ctx.translate((cs.him[0] + cs.her[0]) / 2, cs.him[1] - 160 * k);
  ctx.rotate(-0.35); ctx.fillStyle = "#151515"; ctx.fillRect(-70 * k, -2 * k, 150 * k, 4 * k);
  ctx.rotate(0.9); ctx.fillStyle = "#E5B32A"; ctx.fillRect(30 * k, 10 * k, 28 * k, 9 * k);
  ctx.fillStyle = "#2457A5"; ctx.beginPath(); ctx.arc(-34 * k, 40 * k, 6 * k, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
};
// Mucha's halo behind her head
export const drawHalo = (ctx: Ctx, c: Cam, t: number) => {
  const cs = coupleScreen(c, t), [x, y] = cs.herHead, k = cs.k;
  ctx.save(); ctx.translate(x, y + 14 * k);
  ctx.fillStyle = "#E9D8AE"; ctx.beginPath(); ctx.arc(0, 0, 44 * k, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#7A5A36"; ctx.lineWidth = 2 * k; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 36 * k, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#B8913E"; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 + t * 0.2; ctx.beginPath(); ctx.arc(Math.cos(a) * 40 * k, Math.sin(a) * 40 * k, 1.8 * k, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
};

// ── original pastiche artworks (drawn centred at 0,0 inside a w×h rect)
export const drawArt = (ctx: Ctx, kind: string, w: number, h: number, c: Cam, t: number, style: string) => {
  const u = Math.min(w, h) / 100;
  if (kind === "urinal") {                                                  // a porcelain urinal on its back, signed (示意图)
    const g = ctx.createRadialGradient(-w * 0.12, -h * 0.15, w * 0.05, 0, 0, w * 0.6);
    g.addColorStop(0, "#FFFFFF"); g.addColorStop(0.7, "#E4E6E8"); g.addColorStop(1, "#B9BEC4");
    ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.beginPath(); ctx.ellipse(0, h * 0.42, w * 0.46, h * 0.08, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w * 0.42, -h * 0.05);
    ctx.bezierCurveTo(-w * 0.46, -h * 0.42, w * 0.46, -h * 0.42, w * 0.42, -h * 0.05); ctx.bezierCurveTo(w * 0.4, h * 0.3, w * 0.22, h * 0.42, 0, h * 0.42); ctx.bezierCurveTo(-w * 0.22, h * 0.42, -w * 0.4, h * 0.3, -w * 0.42, -h * 0.05); ctx.fill();
    ctx.strokeStyle = "#9AA1A8"; ctx.lineWidth = 1.2 * u; ctx.stroke();
    ctx.fillStyle = "#D5D9DD"; ctx.beginPath(); ctx.ellipse(0, -h * 0.02, w * 0.3, h * 0.24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#8C949C"; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc((i % 3 - 1) * 4 * u, h * 0.12 + Math.floor(i / 3) * 4 * u, 1.1 * u, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#EEF0F2"; ctx.fillRect(-5 * u, -h * 0.47, 10 * u, h * 0.12); ctx.strokeRect(-5 * u, -h * 0.47, 10 * u, h * 0.12);
    ctx.save(); ctx.rotate(-0.18); ctx.fillStyle = "#1A1A1A"; ctx.font = `italic 700 ${8 * u}px 'Cormorant Garamond', serif`; ctx.fillText("R. MUTT", -w * 0.4, h * 0.12); ctx.font = `italic 700 ${7 * u}px 'Cormorant Garamond', serif`; ctx.fillText("1917", -w * 0.36, h * 0.2); ctx.restore();
    return;
  }
  if (kind === "colorfield") {                                              // soft stacked rectangles (风格示意)
    ctx.fillStyle = "#4E1418"; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip(); ctx.filter = `blur(${Math.max(2, 5 * u)}px)`;
    ctx.fillStyle = "#D2591F"; ctx.fillRect(-w * 0.42, -h * 0.43, w * 0.84, h * 0.42);
    ctx.fillStyle = "#E8893A"; ctx.globalAlpha = 0.5; ctx.fillRect(-w * 0.38, -h * 0.4, w * 0.76, h * 0.2); ctx.globalAlpha = 1;
    ctx.fillStyle = "#210709"; ctx.fillRect(-w * 0.42, h * 0.06, w * 0.84, h * 0.36);
    ctx.filter = "none"; ctx.restore();
    return;
  }
  if (kind === "pop") {                                                     // a comic panel: a burst and a glass (风格示意)
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip(); ctx.fillStyle = "#2A8BD8";
    for (let y = -h / 2; y < h / 2; y += 5 * u) for (let x = -w / 2 + ((y / (5 * u)) % 2) * 2.5 * u; x < w / 2; x += 5 * u) { ctx.beginPath(); ctx.arc(x, y, 1.5 * u, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "#F6C21C"; ctx.strokeStyle = "#111"; ctx.lineWidth = 2.2 * u; ctx.beginPath();
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = (i % 2 ? 26 : 44) * u; ctx.lineTo(-w * 0.12 + Math.cos(a) * r, -h * 0.14 + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#E8322B"; ctx.font = `900 ${20 * u}px 'ZCOOL QingKe HuangYou', 'Noto Sans SC'`; ctx.textAlign = "center"; ctx.fillText("POP!", -w * 0.12, -h * 0.1); ctx.strokeText("POP!", -w * 0.12, -h * 0.1);
    ctx.fillStyle = "#FFFFFF"; ctx.lineWidth = 2.4 * u; ctx.beginPath(); ctx.moveTo(w * 0.12, h * 0.02); ctx.bezierCurveTo(w * 0.1, h * 0.24, w * 0.34, h * 0.24, w * 0.32, h * 0.02); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#E8322B"; ctx.beginPath(); ctx.moveTo(w * 0.125, h * 0.09); ctx.lineTo(w * 0.315, h * 0.09); ctx.bezierCurveTo(w * 0.31, h * 0.22, w * 0.13, h * 0.22, w * 0.125, h * 0.09); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.22, h * 0.2); ctx.lineTo(w * 0.22, h * 0.38); ctx.moveTo(w * 0.15, h * 0.4); ctx.lineTo(w * 0.29, h * 0.4); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = "#111"; ctx.lineWidth = 3 * u; ctx.strokeRect(-w / 2, -h / 2, w, h);
    return;
  }
  if (kind === "deco") {                                                    // a gold-on-black poster with a stepped tower (风格示意)
    ctx.fillStyle = "#121212"; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip();
    ctx.strokeStyle = "#D4AF37"; for (let i = 0; i < 26; i++) { const a = Math.PI + (i / 26) * Math.PI; ctx.lineWidth = i % 2 ? 0.5 * u : 1.6 * u; ctx.beginPath(); ctx.moveTo(0, h * 0.42); ctx.lineTo(Math.cos(a) * w, h * 0.42 + Math.sin(a) * w); ctx.stroke(); }
    ctx.fillStyle = "#F3E6C4"; const steps = [[0.34, 0.42], [0.26, 0.2], [0.18, 0.02], [0.1, -0.16], [0.05, -0.3]];
    steps.forEach(([hw, y], i) => { const top = i < steps.length - 1 ? steps[i + 1][1] : -0.36; ctx.fillRect(-w * hw, h * top, w * hw * 2, h * (y - top)); });
    ctx.fillRect(-w * 0.01, -h * 0.46, w * 0.02, h * 0.1);
    ctx.fillStyle = "#121212"; for (let y = -0.3; y < 0.4; y += 0.05) for (const x of [-0.06, 0.03]) ctx.fillRect(w * x, h * y, w * 0.03, h * 0.025);
    ctx.restore();
    ctx.strokeStyle = "#D4AF37"; ctx.lineWidth = 1.2 * u; ctx.strokeRect(-w * 0.46, -h * 0.47, w * 0.92, h * 0.94);
    ctx.fillStyle = "#D4AF37"; ctx.font = `400 ${7 * u}px 'Poiret One', serif`; ctx.textAlign = "center"; ctx.fillText("1 9 2 5", 0, h * 0.465 - 2 * u);
    return;
  }
  if (kind === "bauhaus") {                                                 // circle, square, triangle on a grid (风格示意)
    ctx.fillStyle = "#F1ECE0"; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = "#141414"; ctx.fillRect(-w * 0.4, -h * 0.05, w * 0.8, h * 0.02); ctx.fillRect(-w * 0.12, -h * 0.42, w * 0.025, h * 0.84);
    ctx.fillStyle = "#2457A5"; ctx.beginPath(); ctx.arc(w * 0.16, -h * 0.22, w * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#D2342A"; ctx.fillRect(-w * 0.38, h * 0.04, w * 0.3, w * 0.3);
    ctx.fillStyle = "#F2C230"; ctx.beginPath(); ctx.moveTo(w * 0.1, h * 0.38); ctx.lineTo(w * 0.38, h * 0.38); ctx.lineTo(w * 0.24, h * 0.06); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(-w * 0.3, -h * 0.4); ctx.rotate(Math.PI / 2); ctx.fillStyle = "#141414"; ctx.font = `700 ${11 * u}px 'Jost', sans-serif`; ctx.fillText("bauhaus", 0, 0); ctx.restore();
    return;
  }
  ctx.fillStyle = "#EEE"; ctx.fillRect(-w / 2, -h / 2, w, h);
  void c; void t; void style; void lerp; void clamp01;
};

// the X-ray of the black square: a scan bar reveals two earlier compositions underneath (示意)
export const drawXray = (ctx: Ctx, r: { x: number; y: number; w: number; h: number }, t: number) => {
  const a = 38.6, b = 39.75, e = 40.6;
  if (t < a || t > e + 0.3) return;
  const p = clamp01((t - a) / (b - a)), fade = 1 - clamp01((t - e) / 0.3), bx = r.x + r.w * (0.08 + 0.84 * p);
  ctx.save(); ctx.beginPath(); ctx.rect(r.x + r.w * 0.08, r.y + r.h * 0.08, bx - (r.x + r.w * 0.08), r.h * 0.84); ctx.clip();
  ctx.globalAlpha = 0.92 * fade; ctx.fillStyle = "#1C2733"; ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.globalAlpha = 0.55 * fade; ctx.strokeStyle = "#BFD8EA"; ctx.lineWidth = Math.max(1, r.w * 0.006);
  for (let i = 0; i < 14; i++) { ctx.beginPath(); const x0 = r.x + r.w * (0.12 + hash(i) * 0.7), y0 = r.y + r.h * (0.12 + hash(i * 3) * 0.7); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (hash(i * 5) - 0.5) * r.w * 0.4, y0 + (hash(i * 7) - 0.5) * r.h * 0.4); ctx.lineTo(x0 + (hash(i * 9) - 0.5) * r.w * 0.3, y0 + (hash(i * 11) - 0.2) * r.h * 0.3); ctx.closePath(); ctx.stroke(); }
  const cols = ["#D2342A", "#E5B32A", "#4F7DC1", "#E8E2D2"];
  for (let i = 0; i < 6; i++) { ctx.globalAlpha = 0.42 * fade; ctx.fillStyle = cols[i % 4]; ctx.save(); ctx.translate(r.x + r.w * (0.25 + hash(i * 13) * 0.5), r.y + r.h * (0.25 + hash(i * 17) * 0.5)); ctx.rotate((hash(i) - 0.5) * 1.2); ctx.fillRect(-r.w * 0.09, -r.h * 0.04, r.w * (0.12 + hash(i * 19) * 0.12), r.h * 0.06); ctx.restore(); }
  ctx.restore();
  if (p < 1) { ctx.save(); ctx.globalAlpha = fade; const g = ctx.createLinearGradient(bx - 30, 0, bx + 6, 0); g.addColorStop(0, "rgba(160,220,255,0)"); g.addColorStop(1, "rgba(200,240,255,0.9)"); ctx.fillStyle = g; ctx.fillRect(bx - 30, r.y + r.h * 0.04, 36, r.h * 0.92); ctx.restore(); }
  if (t > a + 0.2) { ctx.save(); ctx.globalAlpha = fade * clamp01((t - a - 0.2) * 4); ctx.fillStyle = "rgba(20,28,36,0.85)"; ctx.fillRect(r.x + 8, r.y + r.h - 40, 130, 30); ctx.fillStyle = "#DCEBF5"; ctx.font = "700 18px 'Noto Sans SC', sans-serif"; ctx.fillText("X 光 · 示意", r.x + 18, r.y + r.h - 18); ctx.restore(); }
};
