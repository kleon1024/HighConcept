// 本周AI要闻 — shared timing, palette, type and the film's devices. A movie-trailer look for a news recap: black
// ground, film grain, letterbox bars at the open and the close, and one horizontal beam of light that slices in to
// open every story, then becomes the headline's underline or the bar of its chart. Type slams in on the narrator's
// beats; numbers count. No logos anywhere: company names are set as plain text.
import React from "react";
export { clamp01, lerp, range, eOut, eIn, eInOut, backOut, win, rnd, mix } from "../elements/core";
import { eIn, eInOut, eOut, lerp, range, rnd } from "../elements/core";

export const BG = "#07080A", WHITE = "#F4F1EA", DIM = "rgba(244,241,234,0.62)", FAINT = "rgba(244,241,234,0.35)", AMBER = "#FFB52E", BEAM = "#DDEBFF", RED = "#FF5A4E";
export const HEAVY = "'Noto Sans SC', sans-serif";
export const DISPLAY = "'Archivo Black', 'Noto Sans SC', sans-serif";
export const MONO = "'Space Grotesk', 'Noto Sans SC', sans-serif";

export const Svg: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}>{children}</svg>;
export const Layer: React.FC<React.PropsWithChildren<{ o?: number; style?: React.CSSProperties }>> = ({ o = 1, style, children }) => (o <= 0.001 ? null : <div style={{ position: "absolute", inset: 0, opacity: o, ...style }}>{children}</div>);

// film grain + a slow vignette; the grain pattern changes every frame
export const Grain: React.FC<{ t: number; o?: number }> = ({ t, o = 0.09 }) => {
  const seed = Math.floor(t * 24) % 50;
  return <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: o, mixBlendMode: "screen", pointerEvents: "none" }}>
    <filter id={`gr${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={seed} /><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.5" /></filter>
    <rect width={1920} height={1080} filter={`url(#gr${seed})`} />
  </svg>;
};
export const Vignette: React.FC<{ o?: number }> = ({ o = 1 }) =>
  <div style={{ position: "absolute", inset: 0, opacity: o, background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none" }} />;
// cinema bars: k = 0 open (full frame), 1 = 2.39:1
export const Letterbox: React.FC<{ k: number }> = ({ k }) => {
  const h = 138 * k; if (h < 0.5) return null;
  return <><div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h, background: "#000" }} /><div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: h, background: "#000" }} /></>;
};

// the beam: a horizontal line of light. x0..x1 at height y; k reveals it from the centre outward (or from the left with fromLeft)
export const Beam: React.FC<{ y: number; x0?: number; x1?: number; k: number; o?: number; w?: number; color?: string; fromLeft?: boolean }> = ({ y, x0 = -60, x1 = 1980, k, o = 1, w = 3, color = BEAM, fromLeft = false }) => {
  if (k <= 0 || o <= 0.001) return null;
  const c = (x0 + x1) / 2, half = (x1 - x0) / 2, a = fromLeft ? x0 : c - half * k, b = fromLeft ? x0 + (x1 - x0) * k : c + half * k;
  return <div style={{ position: "absolute", left: a, top: y - w / 2, width: Math.max(0, b - a), height: w, opacity: o, background: color,
    boxShadow: `0 0 18px 3px ${color}, 0 0 60px 8px rgba(160,200,255,0.35)` }} />;
};
// a flare: the beam's hot centre that flashes on an impact
export const Flare: React.FC<{ x: number; y: number; k: number; s?: number }> = ({ x, y, k, s = 1 }) => {
  if (k <= 0.001) return null;
  return <div style={{ position: "absolute", left: x - 700 * s, top: y - 60 * s, width: 1400 * s, height: 120 * s, opacity: k,
    background: "radial-gradient(ellipse at 50% 50%, rgba(235,244,255,0.95) 0%, rgba(150,190,255,0.35) 25%, rgba(0,0,0,0) 70%)", mixBlendMode: "screen" }} />;
};

type Anchor = "left" | "center" | "right";
const tx = (a: Anchor) => (a === "left" ? "0%" : a === "center" ? "-50%" : "-100%");
// a line that slams in: big, from a slight scale-up and blur, all at once (or per character with stagger)
export const Slam: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; color?: string; anchor?: Anchor;
  font?: string; weight?: number; stagger?: number; tracking?: number; hi?: string; hiColor?: string }> = ({ t, at, out, text, x, y, size, color = WHITE, anchor = "left", font = HEAVY, weight = 900, stagger = 0, tracking = 2, hi = "", hiColor = AMBER }) => {
  if (t < at || t >= out) return null;
  const o = 1 - eIn(range(t, out - 0.3, out));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, display: "flex", whiteSpace: "pre", opacity: o, letterSpacing: tracking }}>
      {Array.from(text).map((ch, i) => {
        const k = eOut(range(t, at + i * stagger, at + i * stagger + 0.22));
        return <span key={i} style={{ display: "inline-block", fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.15, color: hi.includes(ch) ? hiColor : color, opacity: k,
          transform: `scale(${lerp(1.25, 1, k)})`, filter: `blur(${(1 - k) * 8}px)` }}>{ch}</span>;
      })}
    </div>
  );
};
// small caption / label text, fades in
export const Note: React.FC<{ t: number; at: number; out: number; text: React.ReactNode; x: number; y: number; anchor?: Anchor; size?: number; color?: string; font?: string; weight?: number }> = ({ t, at, out, text, x, y, anchor = "left", size = 26, color = DIM, font = HEAVY, weight = 500 }) => {
  if (t < at || t >= out) return null;
  const k = eInOut(range(t, at, at + 0.35)), o = 1 - eIn(range(t, out - 0.3, out));
  return <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, opacity: k * o, fontFamily: font, fontWeight: weight, fontSize: size, color, letterSpacing: 1.5, whiteSpace: "nowrap" }}>{text}</div>;
};
// a status tag: 官方 / 报道 / 传闻 / 预计
export const Tag: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; kind?: "official" | "report" | "rumor" }> = ({ t, at, out, text, x, y, kind = "official" }) => {
  if (t < at || t >= out) return null;
  const k = eOut(range(t, at, at + 0.3)) * (1 - eIn(range(t, out - 0.3, out)));
  const c = kind === "official" ? AMBER : kind === "report" ? BEAM : RED;
  return <div style={{ position: "absolute", left: x, top: y, opacity: k, border: `2px solid ${c}`, color: c, borderRadius: 4, padding: "3px 12px", fontFamily: HEAVY, fontWeight: 700, fontSize: 22, letterSpacing: 3 }}>{text}</div>;
};
// a counter: from a to b (eased), formatted
export const Counter: React.FC<{ t: number; at: number; dur?: number; out: number; from?: number; to: number; x: number; y: number; size: number; decimals?: number; prefix?: string; suffix?: string; color?: string; anchor?: Anchor; suffixSize?: number }> = ({ t, at, dur = 1.0, out, from = 0, to, x, y, size, decimals = 0, prefix = "", suffix = "", color = AMBER, anchor = "left", suffixSize }) => {
  if (t < at || t >= out) return null;
  const k = eOut(range(t, at, at + dur)), v = lerp(from, to, k), o = Math.min(eOut(range(t, at, at + 0.15)), 1 - eIn(range(t, out - 0.3, out)));
  const s = v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, opacity: o, fontFamily: DISPLAY, fontSize: size, lineHeight: 1, color, whiteSpace: "nowrap",
    textShadow: "0 0 30px rgba(255,181,46,0.35)" }}>
    {prefix}{s}<span style={{ fontFamily: HEAVY, fontWeight: 900, fontSize: suffixSize ?? size * 0.42, marginLeft: 10 }}>{suffix}</span>
  </div>;
};
// the story index: a big outlined number
export const Index: React.FC<{ t: number; at: number; out: number; n: number; x?: number; y?: number }> = ({ t, at, out, n, x = 110, y = 120 }) => {
  if (t < at || t >= out) return null;
  const k = eOut(range(t, at, at + 0.3)), o = 1 - eIn(range(t, out - 0.3, out));
  return <div style={{ position: "absolute", left: x, top: y, opacity: k * o, fontFamily: DISPLAY, fontSize: 150, lineHeight: 1, color: "transparent", WebkitTextStroke: `2px ${FAINT}`, transform: `translateY(${(1 - k) * 30}px)` }}>
    {String(n).padStart(2, "0")}</div>;
};
// light streaks drifting through (anamorphic flares) for the trailer moments
export const Streaks: React.FC<{ t: number; o?: number; n?: number; seed?: number }> = ({ t, o = 1, n = 6, seed = 1 }) => (o <= 0.001 ? null :
  <Svg style={{ opacity: o, mixBlendMode: "screen" }}>
    {Array.from({ length: n }, (_, i) => { const y = 120 + rnd(seed + i) * 840, sp = 60 + 140 * rnd(seed + i * 3), x = ((rnd(seed + i * 5) * 2400 + t * sp) % 2600) - 340, w = 200 + 500 * rnd(seed + i * 7);
      return <rect key={i} x={x} y={y} width={w} height={1.5} fill="#BFD6FF" opacity={0.25 + 0.35 * rnd(seed + i * 11)} />; })}
  </Svg>);
export { eIn as _eIn, eOut as _eOut, eInOut as _eInOut };
