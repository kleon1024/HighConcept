// 什么是爱 — shared timing, palette, type and pieces. Warm paper, rose and wheat; one gold thread (the fox's
// 「建立联系」) runs through the film and ties each scene to the next. Real paintings carry the people; the rest is
// type, light and the thread.
import React from "react";
import { Img, staticFile } from "remotion";
import J from "./love.json";
export { clamp01, lerp, range, eOut, eIn, eInOut, backOut, win, rnd, mix } from "../elements/core";
import { eIn, eInOut, eOut, lerp, range, rnd } from "../elements/core";

export const LJ = J;
export const PAPER = "#F4ECDE", PAPER2 = "#E9DCC4", INK = "#2B221D", ROSE = "#B8323F", GOLD = "#C9992E", GOLDL = "#F2D68E", WHEAT = "#E3B04B",
  NIGHT = "#121833", DUSK = "#3B2A4A", MUTE = "#8C7F72", CREAM = "#FFF8EC";
export const SERIF = "'Noto Serif SC', serif";
export const SANS = "'Noto Sans SC', sans-serif";
export const BRUSH = "'Ma Shan Zheng', 'Noto Serif SC', serif";
export const LATIN = "'Cormorant Garamond', 'Noto Serif SC', serif";
export const FIELD = { w: 6400, h: 3200, one: [4048, 1568] as [number, number], cell: 64 };

export const Svg: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}>{children}</svg>;
export const Layer: React.FC<React.PropsWithChildren<{ o?: number; style?: React.CSSProperties }>> = ({ o = 1, style, children }) => (o <= 0.001 ? null : <div style={{ position: "absolute", inset: 0, opacity: o, ...style }}>{children}</div>);
export const fade = (t: number, a: number, b: number, fi = 0.4, fo = 0.4) => Math.min(eOut(range(t, a, a + fi)), 1 - eIn(range(t, b - fo, b)));

type Anchor = "left" | "center" | "right";
const tx = (a: Anchor) => (a === "left" ? "0%" : a === "center" ? "-50%" : "-100%");
// a line of type, each character blurring up into place (slower and softer than an explainer: this film breathes)
export const Say: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; color?: string; anchor?: Anchor;
  font?: string; weight?: number; stagger?: number; italic?: boolean; glow?: string; tracking?: number; vertical?: boolean }> = ({ t, at, out, text, x, y, size, color = INK, anchor = "left", font = SERIF, weight = 600, stagger = 0.05, italic, glow, tracking = 0, vertical }) => {
  if (t < at || t >= out) return null;
  const o = 1 - eIn(range(t, out - 0.45, out));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: vertical ? undefined : `translateX(${tx(anchor)})`, display: "flex", flexDirection: vertical ? "column" : "row", whiteSpace: "pre", opacity: o, letterSpacing: tracking }}>
      {Array.from(text).map((ch, i) => {
        const k = eInOut(range(t, at + i * stagger, at + i * stagger + 0.6));
        return <span key={i} style={{ display: "inline-block", fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: vertical ? 1.1 : 1.25, color, opacity: k, filter: `blur(${(1 - k) * 6}px)`,
          transform: `translateY(${(1 - k) * 12}px)`, fontStyle: italic ? "italic" : "normal", textShadow: glow }}>{ch}</span>;
      })}
    </div>
  );
};
// the original words, small and italic, under a Chinese line
export const Orig: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; anchor?: Anchor; color?: string; size?: number }> = ({ t, at, out, text, x, y, anchor = "left", color = MUTE, size = 30 }) => {
  if (t < at || t >= out) return null;
  const o = Math.min(eOut(range(t, at, at + 0.8)), 1 - eIn(range(t, out - 0.4, out)));
  return <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, opacity: o, fontFamily: LATIN, fontStyle: "italic", fontWeight: 600, fontSize: size, color, whiteSpace: "nowrap" }}>{text}</div>;
};
export const Note: React.FC<{ t: number; at: number; out: number; text: React.ReactNode; x: number; y: number; anchor?: Anchor; size?: number; color?: string }> = ({ t, at, out, text, x, y, anchor = "left", size = 22, color = MUTE }) => {
  if (t < at || t >= out) return null;
  const k = eInOut(range(t, at, at + 0.5)), o = 1 - eIn(range(t, out - 0.3, out));
  return <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, opacity: k * o, fontFamily: SANS, fontWeight: 500, fontSize: size, color, letterSpacing: 1.5, whiteSpace: "nowrap" }}>{text}</div>;
};

// a painting, moved and graded (focus x, focus y, scale)
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

// the garden of five thousand identical roses: z = screen pixels per texture pixel, (fx, fy) = texture point at screen centre
export const fieldToScreen = (px: number, py: number, z: number, fx: number, fy: number): [number, number] => [960 + (px - fx) * z, 540 + (py - fy) * z];
export const Field: React.FC<{ z: number; fx: number; fy: number; o?: number; dim?: number; filter?: string }> = ({ z, fx, fy, o = 1, dim = 0, filter }) => {
  if (o <= 0.001) return null;
  const [x0, y0] = fieldToScreen(0, 0, z, fx, fy);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: o }}>
      <Img src={staticFile("media/lv_field.jpg")} style={{ position: "absolute", left: x0, top: y0, width: FIELD.w * z, height: FIELD.h * z, maxWidth: "none",
        filter: `${filter ?? ""} saturate(${1 - 0.25 * dim}) brightness(${1 - 0.6 * dim})` }} />
    </div>
  );
};
// the one rose (a cut-out of Redouté's plate), drawn at a point with a given height in pixels
export const Rose: React.FC<{ x: number; y: number; h: number; o?: number; glow?: number; rot?: number }> = ({ x, y, h, o = 1, glow = 0, rot = 0 }) => {
  if (o <= 0.001) return null;
  const w = h * (1280 / 1845);
  return (
    <div style={{ position: "absolute", left: x - w * 0.6, top: y - h * 0.25, width: w, height: h, opacity: o, transform: `rotate(${rot}deg)`, transformOrigin: "60% 25%",
      filter: glow > 0 ? `drop-shadow(0 0 ${30 * glow}px rgba(242,214,142,${0.9 * glow})) drop-shadow(0 0 ${8 * glow}px rgba(255,240,200,${glow}))` : undefined }}>
      <Img src={staticFile("media/lv_rose_cut.png")} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

// the gold thread: a path drawn from 0 to k, with a soft glow and a bead of light travelling at its tip
export const Thread: React.FC<{ d: string; k: number; len?: number; w?: number; o?: number; color?: string }> = ({ d, k, len = 3000, w = 3, o = 1, color = GOLD }) => {
  if (k <= 0 || o <= 0) return null;
  return (
    <g opacity={o}>
      {color === GOLD && <path d={d} fill="none" stroke={GOLDL} strokeWidth={w * 4} strokeLinecap="round" strokeDasharray={`${len * k} ${len * 2}`} opacity={0.18} style={{ filter: "blur(4px)" }} />}
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={`${len * k} ${len * 2}`} />
    </g>
  );
};

// a soft watercolour wash: two radial blooms of colour over paper, shifting slowly
export const Wash: React.FC<{ t: number; a: string; b: string; base?: string; o?: number }> = ({ t, a, b, base = PAPER, o = 1 }) => {
  if (o <= 0.001) return null;
  const x1 = 30 + Math.sin(t * 0.21) * 8, y1 = 30 + Math.cos(t * 0.17) * 6, x2 = 72 + Math.cos(t * 0.19) * 8, y2 = 70 + Math.sin(t * 0.23) * 6;
  return <div style={{ position: "absolute", inset: 0, opacity: o, background: `radial-gradient(ellipse at ${x1}% ${y1}%, ${a} 0%, rgba(0,0,0,0) 55%), radial-gradient(ellipse at ${x2}% ${y2}%, ${b} 0%, rgba(0,0,0,0) 60%), ${base}` }} />;
};

// floating motes of light (slow, sparse — not glitter)
export const Motes: React.FC<{ t: number; n?: number; color?: string; o?: number; seed?: number }> = ({ t, n = 40, color = GOLDL, o = 1, seed = 0 }) => (
  <Svg>{Array.from({ length: n }, (_, i) => {
    const j = i + seed * 100, x = (rnd(j) * 1920 + t * (8 + rnd(j + 1) * 16)) % 1920, y = (rnd(j + 2) * 1080 - t * (5 + rnd(j + 3) * 12) + 1080 * 5) % 1080;
    return <circle key={i} cx={x} cy={y} r={1 + rnd(j + 4) * 2.2} fill={color} opacity={o * (0.15 + 0.35 * rnd(j + 5)) * (0.6 + 0.4 * Math.sin(t * 1.1 + i))} />;
  })}</Svg>
);
