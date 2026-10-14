// NIHIL · 虚无: shared timing, palette and type, and the dust effect — a word sampled into particles in the browser
// (fonts loaded first, then drawn to an offscreen canvas) that blows away on the wind, or gathers back.
import React, { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import J from "./nihil.json";
export { clamp01, lerp, range, eOut, eIn, eInOut, backOut, win, rnd, mix } from "../elements/core";
import { clamp01, eIn, eInOut, range, rnd } from "../elements/core";

export const NJ = J;
export const BG = "#050505", WH = "#EEEAE0", DIM = "#8A867C", GOLD = "#E8B74A";
export const SERIF = "'Noto Serif SC', serif";
export const SANS = "'Noto Sans SC', sans-serif";
export const LATIN = "'Cormorant Garamond', 'Noto Serif SC', serif";
export const GROT = "'Space Grotesk', 'Noto Sans SC', sans-serif";

const cache: Record<string, [number, number][]> = {};
export const useGlyph = (key: string, text: string, font: string, w: number, h: number, step: number) => {
  const [pts, setPts] = useState<[number, number][] | null>(cache[key] ?? null);
  const [handle] = useState(() => (cache[key] ? null : delayRender(`glyph ${key}`)));
  useEffect(() => {
    if (cache[key]) { setPts(cache[key]); if (handle !== null) continueRender(handle); return; }
    document.fonts.load(font, text).then(() => document.fonts.ready).then(() => {
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const g = c.getContext("2d")!;
      g.fillStyle = "#fff"; g.font = font; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, h / 2);
      const d = g.getImageData(0, 0, w, h).data, out: [number, number][] = [];
      for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (d[(y * w + x) * 4 + 3] > 120) out.push([x, y]);
      cache[key] = out; setPts(out);
      if (handle !== null) continueRender(handle);
    });
  }, []);
  return pts;
};

// the dust: k(t) for each particle; `mode` out = blow away from t0, in = gather back by t0 + spread + dur
export const Dust: React.FC<{ t: number; id: string; text: string; size: number; cx: number; cy: number; t0: number; mode: "out" | "in";
  color?: string; spread?: number; dur?: number; solid?: boolean }> = ({ t, id, text, size, cx, cy, t0, mode, color = WH, spread = 0.7, dur = 1.3, solid = true }) => {
  const W = Math.ceil(size * text.length * 1.15), Hh = Math.ceil(size * 1.4), step = 4;
  const pts = useGlyph(id, text, `900 ${size}px "Noto Serif SC"`, W, Hh, step);
  if (!pts) return null;
  const x0 = cx - W / 2, y0 = cy - Hh / 2;
  const total = spread + dur;
  const prog = mode === "out" ? range(t, t0, t0 + total) : 1 - range(t, t0, t0 + total);
  // fully intact: draw the crisp word instead of the particles
  if (prog <= 0 && solid) {
    return <div style={{ position: "absolute", left: cx, top: cy, transform: "translate(-50%, -50%)", fontFamily: SERIF, fontWeight: 900, fontSize: size, color, lineHeight: 1, whiteSpace: "nowrap",
      textShadow: color === GOLD ? "0 0 40px rgba(232,183,74,0.45)" : "0 0 30px rgba(238,234,224,0.18)" }}>{text}</div>;
  }
  if (prog >= 1) return null;
  const buckets: string[][] = [[], [], [], [], [], []];
  const tt = mode === "out" ? t - t0 : t0 + total - t;                    // time since the particle left (mirrored for "in")
  for (let i = 0; i < pts.length; i++) {
    const [px, py] = pts[i], r1 = rnd(i), r2 = rnd(i + 7.3), r3 = rnd(i + 3.1);
    const delay = (px / W) * spread + r1 * 0.18;
    const k = clamp01((tt - delay) / dur);
    if (k >= 1) continue;
    const e = Math.pow(k, 1.6);
    const x = x0 + px + e * (240 + 520 * r2) + Math.sin(k * 7 + i) * 14 * k;
    const y = y0 + py - e * (90 + 300 * r3) + Math.cos(k * 5 + i * 0.7) * 10 * k;
    const o = 1 - eIn(k);
    const b = Math.min(5, Math.floor((1 - o) * 6));
    const s = 2.8 * (1 - 0.5 * k);
    buckets[b].push(`M${x.toFixed(1)} ${y.toFixed(1)}h${s.toFixed(1)}v${s.toFixed(1)}h${(-s).toFixed(1)}z`);
  }
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {buckets.map((b, i) => (b.length ? <path key={i} d={b.join("")} fill={color} opacity={1 - i / 6} /> : null))}
    </svg>
  );
};

// a line of serif type, rising out of a mask character by character
type Anchor = "left" | "center" | "right";
const tx = (a: Anchor) => (a === "left" ? "0%" : a === "center" ? "-50%" : "-100%");
export const Line: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; color?: string; anchor?: Anchor;
  font?: string; weight?: number; stagger?: number; tracking?: number; italic?: boolean; glow?: boolean }> = ({ t, at, out, text, x, y, size, color = WH, anchor = "left", font = SERIF, weight = 900, stagger = 0.035, tracking = 0, italic, glow = true }) => {
  if (t < at || t >= out) return null;
  const o = 1 - eIn(range(t, out - 0.25, out));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, display: "flex", whiteSpace: "pre", fontFamily: font, fontWeight: weight, fontSize: size, color,
      lineHeight: 1.15, opacity: o, letterSpacing: tracking, fontStyle: italic ? "italic" : "normal", textShadow: glow ? (color === GOLD ? "0 0 36px rgba(232,183,74,0.5)" : "0 0 26px rgba(238,234,224,0.22)") : undefined }}>
      {Array.from(text).map((ch, i) => {
        const k = eInOut(range(t, at + i * stagger, at + i * stagger + 0.45));
        return <span key={i} style={{ display: "inline-block", opacity: k, filter: `blur(${(1 - k) * 8}px)`, transform: `translateY(${(1 - k) * 18}px)` }}>{ch}</span>;
      })}
    </div>
  );
};
// a small hairline-boxed note
export const Note: React.FC<{ t: number; at: number; out: number; text: React.ReactNode; x: number; y: number; anchor?: Anchor; size?: number; color?: string }> = ({ t, at, out, text, x, y, anchor = "left", size = 24, color = DIM }) => {
  if (t < at || t >= out) return null;
  const k = eInOut(range(t, at, at + 0.4)), o = 1 - eIn(range(t, out - 0.25, out));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, opacity: k * o, fontFamily: SANS, fontWeight: 700, fontSize: size, color, letterSpacing: 2,
      borderTop: `1px solid ${color}`, paddingTop: 8, whiteSpace: "nowrap" }}>{text}</div>
  );
};
