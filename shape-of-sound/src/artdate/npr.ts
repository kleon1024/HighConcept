// Non-photorealistic rendering: each style turns a naturalistic source canvas into paint, dots, swirls, facets…
// Everything is a pure function of (source, frame time) so frames render in any order. Strokes on the wall are
// anchored to the world (offsetX = camera position × scale) so they scroll with the wall instead of sticking to the screen.
import { clamp01, curl, fbm, hash2, lerp, mulberry, VH, VW } from "./motion";
const fbmA = (x: number, y: number) => fbm(x * 0.004, y * 0.004, 2) * 2.2;

type Ctx = CanvasRenderingContext2D;
export type Src = { d: Uint8ClampedArray; w: number; h: number };
export const grab = (ctx: Ctx): Src => ({ d: ctx.getImageData(0, 0, VW, VH).data, w: VW, h: VH });
export const px = (s: Src, x: number, y: number): [number, number, number, number] => {
  const xi = Math.min(s.w - 1, Math.max(0, x | 0)), yi = Math.min(s.h - 1, Math.max(0, y | 0)), i = (yi * s.w + xi) * 4;
  return [s.d[i], s.d[i + 1], s.d[i + 2], s.d[i + 3]];
};

// ── colour space helpers
export const rgb2hsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
};
export const hsl = (h: number, s: number, l: number, a = 1) => `hsla(${((h % 360) + 360) % 360},${Math.round(clamp01(s) * 100)}%,${Math.round(clamp01(l) * 100)}%,${a})`;

// ── luminance gradient on a coarse grid → stroke orientation along the isophotes
export type Field = { gx: Float32Array; gy: Float32Array; cw: number; ch: number; step: number };
export const field = (s: Src, step = 6): Field => {
  const cw = Math.ceil(s.w / step), ch = Math.ceil(s.h / step), L = new Float32Array(cw * ch);
  for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) { const [r, g, b] = px(s, i * step, j * step); L[j * cw + i] = 0.3 * r + 0.59 * g + 0.11 * b; }
  const gx = new Float32Array(cw * ch), gy = new Float32Array(cw * ch);
  for (let j = 1; j < ch - 1; j++) for (let i = 1; i < cw - 1; i++) {
    const a = (q: number, r: number) => L[(j + r) * cw + i + q];
    gx[j * cw + i] = (a(1, -1) + 2 * a(1, 0) + a(1, 1)) - (a(-1, -1) + 2 * a(-1, 0) + a(-1, 1));
    gy[j * cw + i] = (a(-1, 1) + 2 * a(0, 1) + a(1, 1)) - (a(-1, -1) + 2 * a(0, -1) + a(1, -1));
  }
  return { gx, gy, cw, ch, step };
};
const fAt = (f: Field, x: number, y: number) => { const i = Math.min(f.cw - 1, Math.max(0, Math.round(x / f.step))), j = Math.min(f.ch - 1, Math.max(0, Math.round(y / f.step))); return [f.gx[j * f.cw + i], f.gy[j * f.cw + i]]; };

// ── textures (built once per page)
let _grain: HTMLCanvasElement | null = null, _canvas: HTMLCanvasElement | null = null;
const mk = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
export const grainTex = () => {
  if (_grain) return _grain;
  _grain = mk(512, 512); const g = _grain.getContext("2d")!, im = g.createImageData(512, 512), r = mulberry(7);
  for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - 0.5) * 90; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); return _grain;
};
export const canvasTex = () => {      // linen weave for the oil styles
  if (_canvas) return _canvas;
  _canvas = mk(256, 256); const g = _canvas.getContext("2d")!, r = mulberry(3);
  g.fillStyle = "#808080"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 3) { g.fillStyle = `rgba(0,0,0,${0.08 + r() * 0.08})`; g.fillRect(0, y, 256, 1); }
  for (let x = 0; x < 256; x += 3) { g.fillStyle = `rgba(255,255,255,${0.06 + r() * 0.08})`; g.fillRect(x, 0, 1, 256); }
  return _canvas;
};
export const overlayTex = (ctx: Ctx, tex: HTMLCanvasElement, alpha: number, mode: GlobalCompositeOperation = "overlay", ox = 0) => {
  ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = mode;
  const pat = ctx.createPattern(tex, "repeat")!; ctx.translate(-((ox % tex.width) + tex.width) % tex.width, 0); ctx.fillStyle = pat; ctx.fillRect(0, 0, VW + tex.width, VH); ctx.restore();
};

// ── the general stroke painter
export type StrokeOpts = {
  grid: number; len: [number, number]; width: [number, number]; seed: number; ox?: number; angle?: number; follow?: number;
  swirl?: number; bend?: number; alpha?: number; jitter?: number; maskA?: boolean; ridge?: number; edge?: number; wander?: number;
  colour: (r: number, g: number, b: number, rnd: number, x: number, y: number) => string; region?: [number, number, number, number];
};
export const paintStrokes = (ctx: Ctx, s: Src, f: Field | null, o: StrokeOpts) => {
  const g = o.grid, ox = o.ox ?? 0, [x0, y0, x1, y1] = o.region ?? [0, 0, VW, VH];
  ctx.save(); ctx.lineCap = "round"; ctx.globalAlpha = o.alpha ?? 1;
  const items: [number, number, number][] = [];
  const i0 = Math.floor((x0 + ox) / g) - 1, i1 = Math.ceil((x1 + ox) / g) + 1;
  for (let j = Math.floor(y0 / g) - 1; j <= Math.ceil(y1 / g) + 1; j++) for (let i = i0; i <= i1; i++) items.push([i, j, hash2(i * 1.7 + o.seed, j * 2.3 - o.seed)]);
  items.sort((a, b) => a[2] - b[2]);                                    // random overlap order, stable per cell
  for (const [i, j, r] of items) {
    const jit = o.jitter ?? 0.9;
    const x = i * g - ox + (hash2(i + o.seed, j) - 0.5) * g * jit, y = j * g + (hash2(j - o.seed, i) - 0.5) * g * jit;
    if (x < x0 - g || x > x1 + g || y < y0 - g || y > y1 + g) continue;
    const [R, G, B, A] = px(s, x, y);
    if (o.maskA && A < 120) continue;
    let ang = (o.angle ?? 0.35) + fbmA(x + ox, y) * (o.wander ?? 0);
    if (f && (o.follow ?? 0) > 0) { const [gx, gy] = fAt(f, x, y), m = Math.hypot(gx, gy); if (m > 8) ang = lerp(ang, Math.atan2(gy, gx) + Math.PI / 2, clamp01((m - 8) / 60) * o.follow!); }
    if (o.swirl) { const [u, v] = curl(x + ox, y, 0.0035); ang = lerp(ang, Math.atan2(v, u), o.swirl); }
    ang += (r - 0.5) * 0.5;
    const L = lerp(o.len[0], o.len[1], hash2(i * 3.1, j * 1.3 + o.seed)), W = lerp(o.width[0], o.width[1], hash2(i * 0.7 + o.seed, j * 5.1));
    const dx = Math.cos(ang) * L / 2, dy = Math.sin(ang) * L / 2, bend = (o.bend ?? 0.15) * L * (r - 0.5);
    const col = o.colour(R, G, B, r, x, y);
    if (!col) continue;
    if (o.edge) { ctx.strokeStyle = `rgba(20,14,10,${o.edge})`; ctx.lineWidth = W + 2; ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.quadraticCurveTo(x - dy * bend / L * 2, y + dx * bend / L * 2, x + dx, y + dy); ctx.stroke(); }
    ctx.strokeStyle = col; ctx.lineWidth = W;
    ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.quadraticCurveTo(x - dy * bend / L * 2, y + dx * bend / L * 2, x + dx, y + dy); ctx.stroke();
    if (o.ridge) {                                                      // a lighter bristle ridge gives the stroke body
      ctx.strokeStyle = `rgba(255,250,240,${o.ridge})`; ctx.lineWidth = Math.max(1, W * 0.22);
      const nx = -Math.sin(ang) * W * 0.22, ny = Math.cos(ang) * W * 0.22;
      ctx.beginPath(); ctx.moveTo(x - dx * 0.8 + nx, y - dy * 0.8 + ny); ctx.lineTo(x + dx * 0.8 + nx, y + dy * 0.8 + ny); ctx.stroke();
    }
  }
  ctx.restore();
};

// impressionist broken colour: shadows lean violet-blue, lights lean warm, rare value-matched flecks
export const brokenColour = (sat = 1.15, amount = 1) => (r: number, g: number, b: number, rnd: number) => {
  let [h, s, l] = rgb2hsl(r, g, b);
  const pull = (target: number, k: number) => { const d = ((target - h + 540) % 360) - 180; h += d * k; };
  if (l < 0.45) { pull(232, 0.22 * amount); s = Math.max(s, 0.18 * amount); } else if (l > 0.68) { pull(40, 0.16 * amount); s = Math.max(s, 0.16 * amount); }
  if (rnd > 1 - 0.05 * amount) { h += l > 0.55 ? 150 : 200; s = Math.min(0.42, s + 0.1); }
  h += (rnd - 0.5) * 14 * amount; l += (hash2(rnd * 99, 3) - 0.5) * 0.07 * amount;
  return hsl(h, Math.min(0.85, s * sat + 0.02), l);
};

// coarse-to-fine painting (after Hertzmann 1998): broad strokes everywhere, then finer strokes only where the canvas
// still differs from the source — detail at edges, calm in flat areas.
export type Layer = Omit<StrokeOpts, "colour" | "seed"> & { thresh?: number; colour?: StrokeOpts["colour"] };
export const paintLayered = (ctx: Ctx, s: Src, f: Field | null, layers: Layer[], seed: number, colour: StrokeOpts["colour"]) => {
  layers.forEach((L, li) => {
    if (li === 0 || !L.thresh) { paintStrokes(ctx, s, f, { ...L, seed: seed + li * 13, colour: L.colour ?? colour }); return; }
    const cur = grab(ctx), thr = L.thresh, base = L.colour ?? colour;
    paintStrokes(ctx, s, f, { ...L, seed: seed + li * 13, colour: (r, g, b, rnd, x, y) => {
      const [R, G, B] = px(cur, x, y), err = Math.abs(R - r) + Math.abs(G - g) + Math.abs(B - b);
      return err < thr ? "" : base(r, g, b, rnd, x, y);
    } });
  });
};
export const plainColour = (sat = 1, lift = 0, jit = 0.04) => (r: number, g: number, b: number, rnd: number) => {
  const [h, s, l] = rgb2hsl(r, g, b); return hsl(h + (rnd - 0.5) * 8, s * sat, l + lift + (rnd - 0.5) * jit);
};

// ── dots (pointillism): pure-ish hues side by side so they mix in the eye
export const paintDots = (ctx: Ctx, s: Src, o: { grid: number; r: [number, number]; seed: number; ox?: number; maskA?: boolean; region?: [number, number, number, number]; grow?: number }) => {
  const g = o.grid, ox = o.ox ?? 0, [x0, y0, x1, y1] = o.region ?? [0, 0, VW, VH], grow = o.grow ?? 1;
  for (let pass = 0; pass < 2; pass++) for (let j = Math.floor(y0 / g); j <= Math.ceil(y1 / g); j++) for (let i = Math.floor((x0 + ox) / g); i <= Math.ceil((x1 + ox) / g); i++) {
    const rr = hash2(i * 1.3 + pass * 17 + o.seed, j * 0.7);
    if (grow < 1 && hash2(i, j + 5) > grow) continue;
    const x = i * g - ox + (hash2(i + pass, j) - 0.5) * g + pass * g / 2, y = j * g + (hash2(j, i + pass) - 0.5) * g + pass * g / 2;
    const [R, G, B, A] = px(s, x, y);
    if (o.maskA && A < 120) continue;
    let [h, sat, l] = rgb2hsl(R, G, B);
    if (rr < 0.22) { h += l < 0.45 ? 190 : 25; sat = 0.55; } else { h += (rr - 0.5) * 30; sat = Math.min(1, sat * 1.5 + 0.12); }
    l = lerp(l, l > 0.5 ? 0.78 : 0.3, 0.25);
    ctx.fillStyle = hsl(h, sat, l);
    ctx.beginPath(); ctx.arc(x, y, lerp(o.r[0], o.r[1], rr) * Math.min(1, grow * 1.5), 0, Math.PI * 2); ctx.fill();
  }
};
