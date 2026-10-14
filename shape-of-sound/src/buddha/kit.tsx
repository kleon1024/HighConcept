// 佛 · 第二支箭 — shared timing, palette, type and the sutra kit. The look is 绀纸金字: sutras copied in gold ink on
// indigo-dyed paper. Quotes stand in vertical gold columns (read right to left) with a cinnabar seal for the source;
// every quote is followed by a 「解」 line that says it in plain words. The Chan section turns to white paper and ink.
import React, { useEffect, useState } from "react";
import { continueRender, delayRender, Img, staticFile } from "remotion";
import J from "./buddha.json";
export { clamp01, lerp, range, eOut, eIn, eInOut, backOut, win, rnd, mix } from "../elements/core";
import { clamp01, eIn, eInOut, eOut, backOut, lerp, range, rnd } from "../elements/core";

export const BJ = J;
export const INDIGO = "#0D1835", INDIGO2 = "#050B1C", GOLD = "#DDB862", GOLDL = "#F5E2A6", CINNABAR = "#C9442E", PAPER = "#EFE7D5", INK = "#17130F",
  AZURE = "#3D6FA8", MALACHITE = "#4F9C86", MUTE = "#9298B3";
export const BRUSH = "'Ma Shan Zheng', 'Noto Serif SC', serif";
export const SERIF = "'Noto Serif SC', serif";
export const SANS = "'Noto Sans SC', sans-serif";
export const GOLDFILL: React.CSSProperties = {
  backgroundImage: "linear-gradient(168deg, #FFF3C8 0%, #EBC873 30%, #B9893A 55%, #F4D98F 78%, #94672A 100%)",
  WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
};

export const Svg: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}>{children}</svg>;
export const Layer: React.FC<React.PropsWithChildren<{ o?: number; style?: React.CSSProperties }>> = ({ o = 1, style, children }) => (o <= 0.001 ? null : <div style={{ position: "absolute", inset: 0, opacity: o, ...style }}>{children}</div>);
export const fade = (t: number, a: number, b: number, fi = 0.35, fo = 0.35) => Math.min(eOut(range(t, a, a + fi)), 1 - eIn(range(t, b - fo, b)));

// ───────────── the ground: indigo paper (with fibres and a faint gold dust) or, for Chan, white paper
export const Ground: React.FC<{ t: number; paper: number }> = ({ t, paper }) => (
  <>
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 42% 40%, #16244A 0%, ${INDIGO} 45%, ${INDIGO2} 100%)` }} />
    <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("media/me_canvas.png")})`, backgroundSize: "900px 900px", mixBlendMode: "soft-light", opacity: 0.35 }} />
    <Svg>
      {Array.from({ length: 46 }, (_, i) => {
        const x = (rnd(i) * 1920 + t * (6 + rnd(i + 1) * 14)) % 1920, y = (rnd(i + 2) * 1080 - t * (4 + rnd(i + 3) * 10) + 1080 * 4) % 1080;
        return <circle key={i} cx={x} cy={y} r={0.8 + rnd(i + 4) * 1.6} fill={GOLD} opacity={0.12 + 0.2 * rnd(i + 5) * (0.6 + 0.4 * Math.sin(t * 1.3 + i))} />;
      })}
    </Svg>
    {paper > 0 && <div style={{ position: "absolute", inset: 0, opacity: paper, background: `radial-gradient(ellipse at 50% 45%, #F6F0E2 0%, ${PAPER} 60%, #DCD2BC 100%)` }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("media/me_canvas.png")})`, backgroundSize: "900px 900px", mixBlendMode: "multiply", opacity: 0.22 }} />
    </div>}
  </>
);

// ───────────── vertical sutra text: columns right to left, each character bleeding in like ink; the source as a seal
export const VQuote: React.FC<{ t: number; at: number; out: number; cols: string[]; x: number; y: number; size?: number; src?: string; color?: string;
  stagger?: number; gap?: number; ink?: boolean }> = ({ t, at, out, cols, x, y, size = 64, src, color, stagger = 0.045, gap = 1.42, ink }) => {
  if (t < at || t >= out) return null;
  const o = 1 - eIn(range(t, out - 0.3, out));
  let n = 0;
  const fill: React.CSSProperties = ink ? { color: INK } : color ? { color } : GOLDFILL;
  const colW = size * gap;
  const maxLen = Math.max(...cols.map((c) => Array.from(c).length));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: o }}>
      {cols.map((c, ci) => (
        <div key={ci} style={{ position: "absolute", left: x - (ci + 1) * colW + (colW - size) / 2, top: y, width: size, display: "flex", flexDirection: "column", alignItems: "center" }}>
          {Array.from(c).map((ch, i) => {
            const k = eOut(range(t, at + (n++) * stagger, at + (n - 1) * stagger + 0.5));
            const punct = "，。；：、！？——…「」『』".includes(ch);
            return <span key={i} style={{ fontFamily: SERIF, fontWeight: 900, fontSize: punct ? size * 0.7 : size, lineHeight: punct ? 0.75 : 1.12, height: punct ? size * 0.55 : undefined,
              alignSelf: punct ? "flex-end" : undefined, opacity: k, filter: `blur(${(1 - k) * 7}px)`, transform: `scale(${1 + (1 - k) * 0.18})`,
              textShadow: ink ? undefined : "0 0 22px rgba(221,184,98,0.28)", ...fill }}>{ch}</span>;
          })}
        </div>
      ))}
      {src && <Seal t={t} at={at + n * stagger + 0.1} out={out} text={src} x={x - cols.length * colW - 14} y={y + Math.min(maxLen, 6) * size * 1.12 - 10} size={26} vertical />}
    </div>
  );
};

// ───────────── a cinnabar seal: lands with a press (slight overshoot), white characters cut into red
export const Seal: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size?: number; vertical?: boolean; rot?: number; anchor?: "left" | "right" | "center" }> = ({ t, at, out, text, x, y, size = 30, vertical, rot = -3, anchor = "right" }) => {
  if (t < at || t >= out) return null;
  const k = range(t, at, at + 0.22), s = lerp(1.7, 1, backOut(k, 2.4)), o = Math.min(1, k * 3) * (1 - eIn(range(t, out - 0.3, out)));
  const ax = anchor === "left" ? "0%" : anchor === "center" ? "-50%" : "-100%";
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${ax}) rotate(${rot}deg) scale(${s})`, transformOrigin: "50% 50%", opacity: o,
      background: CINNABAR, color: PAPER, fontFamily: SERIF, fontWeight: 900, fontSize: size, lineHeight: 1.05, padding: `${size * 0.22}px ${size * 0.2}px`,
      writingMode: vertical ? "vertical-rl" : undefined, letterSpacing: vertical ? 2 : 3, borderRadius: 3, boxShadow: "inset 0 0 0 2px rgba(239,231,213,0.55)", whiteSpace: "nowrap" }}>{text}</div>
  );
};

// ───────────── 「解」: the plain-words line under every quote
type Anchor = "left" | "center" | "right";
const tx = (a: Anchor) => (a === "left" ? "0%" : a === "center" ? "-50%" : "-100%");
export const Decode: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size?: number; anchor?: Anchor; dark?: boolean; tag?: string }> = ({ t, at, out, text, x, y, size = 44, anchor = "left", dark, tag = "解" }) => {
  if (t < at || t >= out) return null;
  const k = eOut(range(t, at, at + 0.55)), o = 1 - eIn(range(t, out - 0.3, out));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, display: "flex", alignItems: "center", gap: size * 0.4, opacity: o, whiteSpace: "nowrap" }}>
      <span style={{ background: CINNABAR, color: PAPER, fontFamily: SERIF, fontWeight: 900, fontSize: size * 0.62, lineHeight: 1, padding: size * 0.16, borderRadius: 3,
        transform: `scale(${lerp(1.6, 1, backOut(range(t, at, at + 0.25), 2.2))})`, opacity: Math.min(1, range(t, at, at + 0.12) * 3) }}>{tag}</span>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: size, color: dark ? INK : PAPER, clipPath: `inset(-20% ${(1 - k) * 100}% -20% 0)`,
        textShadow: dark ? undefined : "0 2px 18px rgba(0,0,0,0.5)" }}>{text}</span>
    </div>
  );
};

// a plain line of type (statements, questions), each character blurring in
export const Say: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; color?: string; anchor?: Anchor;
  font?: string; weight?: number; stagger?: number; gold?: boolean; tracking?: number }> = ({ t, at, out, text, x, y, size, color = PAPER, anchor = "left", font = SERIF, weight = 900, stagger = 0.04, gold, tracking = 0 }) => {
  if (t < at || t >= out) return null;
  const o = 1 - eIn(range(t, out - 0.3, out));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, display: "flex", whiteSpace: "pre", opacity: o, letterSpacing: tracking }}>
      {Array.from(text).map((ch, i) => {
        const k = eInOut(range(t, at + i * stagger, at + i * stagger + 0.4));
        return <span key={i} style={{ display: "inline-block", fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.15, opacity: k, filter: `blur(${(1 - k) * 8}px)`,
          transform: `translateY(${(1 - k) * 16}px)`, ...(gold ? GOLDFILL : { color }), textShadow: gold ? "0 0 26px rgba(221,184,98,0.35)" : color === INK ? undefined : "0 2px 16px rgba(0,0,0,0.45)" }}>{ch}</span>;
      })}
    </div>
  );
};

// a small hairline-topped note (credits, sources)
export const Note: React.FC<{ t: number; at: number; out: number; text: React.ReactNode; x: number; y: number; anchor?: Anchor; size?: number; color?: string }> = ({ t, at, out, text, x, y, anchor = "left", size = 22, color = MUTE }) => {
  if (t < at || t >= out) return null;
  const k = eInOut(range(t, at, at + 0.4)), o = 1 - eIn(range(t, out - 0.25, out));
  return <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, opacity: k * o, fontFamily: SANS, fontWeight: 700, fontSize: size, color, letterSpacing: 2,
    borderTop: `1px solid ${color}`, paddingTop: 7, whiteSpace: "nowrap" }}>{text}</div>;
};

// ───────────── a giant brush character, written on with a diagonal sweep
export const Big: React.FC<{ t: number; at: number; out: number; ch: string; x: number; y: number; size: number; ink?: boolean; o?: number; style?: React.CSSProperties }> = ({ t, at, out, ch, x, y, size, ink, o = 1, style }) => {
  if (t < at || t >= out) return null;
  const k = eInOut(range(t, at, at + 0.6)), oo = o * (1 - eIn(range(t, out - 0.35, out)));
  const m = `linear-gradient(135deg, #000 ${k * 120 - 20}%, transparent ${k * 120}%)`;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${1.06 - 0.06 * eOut(range(t, at, at + 0.9))})`, opacity: oo,
      fontFamily: BRUSH, fontSize: size, lineHeight: 1, whiteSpace: "nowrap", WebkitMaskImage: m, maskImage: m, ...(ink ? { color: INK } : GOLDFILL),
      filter: ink ? undefined : "drop-shadow(0 0 30px rgba(221,184,98,0.35))", ...style }}>{ch}</div>
  );
};

// ───────────── an artwork, graded and moved (focus x, focus y, scale)
export const Art: React.FC<{ src: string; t: number; a: number; b: number; from: [number, number, number]; to: [number, number, number]; filter?: string; o?: number;
  fit?: "cover" | "contain"; box?: [number, number, number, number]; blend?: React.CSSProperties["mixBlendMode"]; mask?: string }> = ({ src, t, a, b, from, to, filter, o = 1, fit = "cover", box, blend, mask }) => {
  if (o <= 0.001) return null;
  const k = eInOut(range(t, a, b));
  const fx = lerp(from[0], to[0], k), fy = lerp(from[1], to[1], k), s = lerp(from[2], to[2], k);
  const [l, tp, w, h] = box ?? [0, 0, 1920, 1080];
  return (
    <div style={{ position: "absolute", left: l, top: tp, width: w, height: h, overflow: "hidden", opacity: o, mixBlendMode: blend, WebkitMaskImage: mask, maskImage: mask }}>
      <Img src={staticFile(`media/${src}`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, objectPosition: `${fx * 100}% ${fy * 100}%`,
        transformOrigin: `${fx * 100}% ${fy * 100}%`, transform: `scale(${s})`, filter }} />
    </div>
  );
};

// ───────────── an arrow in flight: from p0 to p1 along a slight arc, quivering after it lands
export const Arrow: React.FC<{ t: number; t0: number; t1: number; p0: [number, number]; p1: [number, number]; color?: string; len?: number; bend?: number; o?: number }> = ({ t, t0, t1, p0, p1, color = GOLD, len = 300, bend = -80, o = 1 }) => {
  if (t < t0 || o <= 0) return null;
  const k = range(t, t0, t1), e = Math.pow(k, 1.6);
  const pt = (u: number): [number, number] => [lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u) + bend * 4 * u * (1 - u)];
  const [x, y] = pt(e), [xb, yb] = pt(Math.max(0, e - 0.02));
  let ang = Math.atan2(y - yb, x - xb);
  if (k >= 1) { const d = t - t1; ang = Math.atan2(p1[1] - pt(0.98)[1], p1[0] - pt(0.98)[0]) + Math.sin(d * 55) * 0.07 * Math.exp(-d * 5); }
  const c = Math.cos(ang), s = Math.sin(ang), tailX = x - c * len, tailY = y - s * len;
  const trail = k < 1 ? Array.from({ length: 14 }, (_, i) => pt(Math.max(0, e - i * 0.018))) : [];
  return (
    <g opacity={o}>
      {trail.length > 1 && <polyline points={trail.map(([a, b]) => `${a - c * len * 0.5},${b - s * len * 0.5}`).join(" ")} fill="none" stroke={color} strokeWidth={2} opacity={0.25} />}
      <line x1={tailX} y1={tailY} x2={x - c * 18} y2={y - s * 18} stroke={color} strokeWidth={4} strokeLinecap="round" />
      <path d={`M${x},${y} L${x - c * 34 + s * 12},${y - s * 34 - c * 12} L${x - c * 26},${y - s * 26} L${x - c * 34 - s * 12},${y - s * 34 + c * 12} Z`} fill={color} />
      {[0, 1].map((j) => { const sg = j ? 1 : -1; return <path key={j} d={`M${tailX + c * 8},${tailY + s * 8} l${-c * 26 + sg * s * 16},${-s * 26 - sg * c * 16} M${tailX + c * 30},${tailY + s * 30} l${-c * 26 + sg * s * 16},${-s * 26 - sg * c * 16}`} stroke={color} strokeWidth={2.5} fill="none" />; })}
    </g>
  );
};

// ───────────── glyph sampling (for dust and particles): a word drawn to an offscreen canvas, its pixels become points
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

// words that dissolve into gold dust drifting upward (mode out), or gather from it (mode in)
export const Dust: React.FC<{ t: number; id: string; text: string; size: number; cx: number; cy: number; t0: number; mode: "out" | "in"; color?: string;
  spread?: number; dur?: number; font?: string; drift?: [number, number] }> = ({ t, id, text, size, cx, cy, t0, mode, color = GOLD, spread = 0.5, dur = 1.2, font = SERIF, drift = [160, -420] }) => {
  const W = Math.ceil(size * Array.from(text).length * 1.15), Hh = Math.ceil(size * 1.4), step = size > 120 ? 4 : 3;
  const pts = useGlyph(id, text, `900 ${size}px ${font.split(",")[0]}`, W, Hh, step);
  if (!pts) return null;
  const total = spread + dur, prog = mode === "out" ? range(t, t0, t0 + total) : 1 - range(t, t0, t0 + total);
  if (prog >= 1) return null;
  const x0 = cx - W / 2, y0 = cy - Hh / 2, tt = mode === "out" ? t - t0 : t0 + total - t;
  const buckets: string[][] = [[], [], [], [], [], []];
  for (let i = 0; i < pts.length; i++) {
    const [px, py] = pts[i], r1 = rnd(i), r2 = rnd(i + 7.3), r3 = rnd(i + 3.1);
    const k = clamp01((tt - ((px / W) * spread + r1 * 0.15)) / dur);
    const e = Math.pow(k, 1.5);
    const x = x0 + px + e * drift[0] * (0.4 + r2) + Math.sin(k * 6 + i) * 12 * k, y = y0 + py + e * drift[1] * (0.4 + r3) + Math.cos(k * 5 + i) * 8 * k;
    const b = Math.min(5, Math.floor(eIn(k) * 6)), s = (step * 0.75) * (1 - 0.5 * k);
    buckets[b].push(`M${x.toFixed(1)} ${y.toFixed(1)}h${s.toFixed(1)}v${s.toFixed(1)}h${(-s).toFixed(1)}z`);
  }
  return <Svg>{buckets.map((b, i) => (b.length ? <path key={i} d={b.join("")} fill={color} opacity={1 - i / 6} /> : null))}</Svg>;
};
