// The NPR passes per style, applied to the hall source (bg) and to the couple layer (fg), plus the original pastiche
// artworks (urinal, colour field, pop panel, Deco and Bauhaus posters) drawn as vector "风格示意".
import { brokenColour, field, grab, paintDots, paintLayered, paintStrokes, plainColour } from "./npr";
import { Cam } from "./world";

type Ctx = CanvasRenderingContext2D;
const boil = (t: number, fps = 10) => Math.floor(t * fps);             // painterly styles re-seed 10× a second

export const stylizeBg = (out: Ctx, src: Ctx, kind: string, c: Cam, t: number, style: string) => {
  const ox = c.x * c.s, b = boil(t);
  if (kind === "none") { out.drawImage(src.canvas, 0, 0); return; }
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
    out.save(); out.filter = "blur(6px)"; out.globalAlpha = 0.55; out.drawImage(src.canvas, 0, 0); out.restore();
    out.fillStyle = "rgba(245,238,222,0.45)"; out.fillRect(0, 0, out.canvas.width, out.canvas.height);
    paintDots(out, s, { grid: 8, r: [2.6, 3.6], seed: b % 4, ox });
    return;
  }
  if (kind === "swirl") {
    out.save(); out.filter = "blur(4px)"; out.drawImage(src.canvas, 0, 0); out.restore();
    const f = field(s, 8);
    paintStrokes(out, s, f, { grid: 9, len: [20, 34], width: [5, 7], seed: b % 3, ox, follow: 0.35, swirl: 0.75, bend: 0.6, edge: 0.35, colour: plainColour(1.5, 0.02, 0.12), ridge: 0.15 });
    return;
  }
  if (kind === "oil" || kind === "sfumato") {
    const soft = kind === "sfumato";
    out.save(); out.filter = soft ? "blur(3px)" : "blur(2px)"; out.drawImage(src.canvas, 0, 0); out.restore();
    const f = field(s, 8);
    paintStrokes(out, s, f, { grid: soft ? 8 : 9, len: soft ? [9, 15] : [12, 22], width: soft ? [6, 8] : [6, 9], seed: b % 3, ox, follow: 0.8, angle: 0.2, bend: 0.2, alpha: soft ? 0.55 : 0.8, colour: plainColour(soft ? 0.95 : 1.1, 0, soft ? 0.03 : 0.06), ridge: soft ? 0.05 : 0.1 });
    return;
  }
  out.drawImage(src.canvas, 0, 0);
  void style;
};

export const stylizeFg = (out: Ctx, src: Ctx, kind: string, c: Cam, t: number, style: string) => {
  const b = boil(t);
  if (kind === "none") { out.drawImage(src.canvas, 0, 0); return; }
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
  if (kind === "dots") {
    paintDots(out, s, { grid: 6, r: [2.2, 3.0], seed: 3 + (b % 4), maskA: true, region });
    return;
  }
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
  out.drawImage(src.canvas, 0, 0);
  void c; void style;
};

// bounding box of the opaque pixels (sampled), so the couple's strokes only cover the couple
const bbox = (s: { d: Uint8ClampedArray; w: number; h: number }): [number, number, number, number] | null => {
  let x0 = s.w, y0 = s.h, x1 = -1, y1 = -1;
  for (let y = 0; y < s.h; y += 6) for (let x = 0; x < s.w; x += 6) if (s.d[(y * s.w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : [x0 - 12, y0 - 12, x1 + 12, y1 + 12];
};

// ── original pastiche artworks (drawn centred at 0,0 inside a w×h rect)
export const drawArt = (ctx: Ctx, kind: string, w: number, h: number, c: Cam, t: number, style: string) => {
  ctx.fillStyle = "#EEE"; ctx.fillRect(-w / 2, -h / 2, w, h);
  void kind; void c; void t; void style;
};
