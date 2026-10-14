// 道 · 空 — shared timing, palette, type and ink. Raw paper, black ink and one cinnabar seal: a Song painting's
// emptiness is the stage, and one empty circle (the hub of a wheel, the hollow of a bowl, a moon gate, the moon over
// a cold river) runs through the whole film.
import React from "react";
import { Img, staticFile } from "remotion";
import J from "./dao.json";
export { clamp01, lerp, range, eOut, eIn, eInOut, backOut, win, rnd, mix } from "../elements/core";
import { eIn, eInOut, eOut, lerp, range, rnd } from "../elements/core";

export const DJ = J;
export const PAPER = "#EEE6D3", INK = "#1C1B19", INK2 = "#4A4741", WASH = "#8C877C", SEAL = "#B0301F", MIST = "rgba(238,230,211,0.0)";
export const SERIF = "'Noto Serif SC', serif";
export const SANS = "'Noto Sans SC', sans-serif";
export const BRUSH = "'Ma Shan Zheng', 'Noto Serif SC', serif";

export const Svg: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}>{children}</svg>;
export const Layer: React.FC<React.PropsWithChildren<{ o?: number; style?: React.CSSProperties }>> = ({ o = 1, style, children }) => (o <= 0.001 ? null : <div style={{ position: "absolute", inset: 0, opacity: o, ...style }}>{children}</div>);
export const fade = (t: number, a: number, b: number, fi = 0.5, fo = 0.5) => Math.min(eOut(range(t, a, a + fi)), 1 - eIn(range(t, b - fo, b)));

export const Paper: React.FC<{ o?: number }> = ({ o = 1 }) => (o <= 0.001 ? null :
  <Img src={staticFile("media/dao_paper.jpg")} style={{ position: "absolute", inset: 0, width: 1920, height: 1080, objectFit: "cover", opacity: o }} />);

type Anchor = "left" | "center" | "right";
const tx = (a: Anchor) => (a === "left" ? "0%" : a === "center" ? "-50%" : "-100%");
// a line of type that inks in: each character darkens from a soft grey bloom
export const Say: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; color?: string; anchor?: Anchor;
  font?: string; weight?: number; stagger?: number; tracking?: number; shadow?: string }> = ({ t, at, out, text, x, y, size, color = INK, anchor = "left", font = SERIF, weight = 600, stagger = 0.06, tracking = 2, shadow }) => {
  if (t < at || t >= out) return null;
  const o = 1 - eIn(range(t, out - 0.5, out));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, display: "flex", whiteSpace: "pre", opacity: o, letterSpacing: tracking }}>
      {Array.from(text).map((ch, i) => {
        const k = eOut(range(t, at + i * stagger, at + i * stagger + 0.7));
        return <span key={i} style={{ display: "inline-block", fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.3, color, opacity: k, filter: `blur(${(1 - k) * 7}px)`, textShadow: shadow }}>{ch}</span>;
      })}
    </div>
  );
};
// classical text in vertical columns, right to left, each character inking in
export const Columns: React.FC<{ t: number; at: number; out: number; cols: string[]; x: number; y: number; size: number; gap?: number; color?: string; font?: string; stagger?: number }> = ({ t, at, out, cols, x, y, size, gap = 1.35, color = INK, font = BRUSH, stagger = 0.09 }) => {
  if (t < at || t >= out) return null;
  const o = 1 - eIn(range(t, out - 0.5, out));
  let n = 0;
  return <div style={{ position: "absolute", left: 0, top: 0, opacity: o }}>
    {cols.map((c, j) => <div key={j} style={{ position: "absolute", left: x - j * size * gap, top: y, display: "flex", flexDirection: "column" }}>
      {Array.from(c).map((ch, i) => { const s = at + (n++) * stagger, k = eOut(range(t, s, s + 0.6));
        return <span key={i} style={{ fontFamily: font, fontSize: size, lineHeight: 1.06, color, opacity: k, filter: `blur(${(1 - k) * 4}px)` }}>{ch}</span>; })}
    </div>)}
  </div>;
};
export const Note: React.FC<{ t: number; at: number; out: number; text: React.ReactNode; x: number; y: number; anchor?: Anchor; size?: number; color?: string }> = ({ t, at, out, text, x, y, anchor = "left", size = 20, color = WASH }) => {
  if (t < at || t >= out) return null;
  const k = eInOut(range(t, at, at + 0.6)), o = 1 - eIn(range(t, out - 0.4, out));
  return <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, opacity: k * o, fontFamily: SANS, fontWeight: 500, fontSize: size, color, letterSpacing: 1.5, whiteSpace: "nowrap" }}>{text}</div>;
};
// a cinnabar seal, stamped
export const Seal: React.FC<{ t: number; at: number; text: string; x: number; y: number; s?: number; o?: number }> = ({ t, at, text, x, y, s = 88, o = 1 }) => {
  if (t < at || o <= 0.001) return null;
  const k = eOut(range(t, at, at + 0.18)), chars = Array.from(text), two = chars.length > 2;
  return <div style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, background: SEAL, borderRadius: 6, opacity: o * k * 0.92,
    transform: `scale(${lerp(1.35, 1, k)})`, display: "flex", flexWrap: "wrap", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 6, boxSizing: "border-box",
    boxShadow: "inset 0 0 6px rgba(80,10,0,0.5)" }}>
    {(two ? chars : [text]).map((c, i) => <span key={i} style={{ fontFamily: BRUSH, color: "#F6E9DA", fontSize: two ? s * 0.38 : s * 0.62, lineHeight: 1 }}>{c}</span>)}
  </div>;
};

// a real painting, moved and graded (focus x, focus y, scale)
export const Art: React.FC<{ src: string; t: number; a: number; b: number; from: [number, number, number]; to: [number, number, number]; filter?: string; o?: number;
  fit?: "cover" | "contain"; box?: [number, number, number, number]; mask?: string; blend?: React.CSSProperties["mixBlendMode"] }> = ({ src, t, a, b, from, to, filter, o = 1, fit = "cover", box, mask, blend }) => {
  if (o <= 0.001) return null;
  const k = eInOut(range(t, a, b));
  const fx = lerp(from[0], to[0], k), fy = lerp(from[1], to[1], k), s = lerp(from[2], to[2], k);
  const [l, tp, w, h] = box ?? [0, 0, 1920, 1080];
  return (
    <div style={{ position: "absolute", left: l, top: tp, width: w, height: h, overflow: "hidden", opacity: o, WebkitMaskImage: mask, maskImage: mask, mixBlendMode: blend }}>
      <Img src={staticFile(`media/${src}`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, objectPosition: `${fx * 100}% ${fy * 100}%`,
        transformOrigin: `${fx * 100}% ${fy * 100}%`, transform: `scale(${s})`, filter }} />
    </div>
  );
};

// ---------- ink ----------
export type Pt = [number, number];
const segLens = (P: Pt[]) => P.slice(1).map((p, i) => Math.hypot(p[0] - P[i][0], p[1] - P[i][1]));
export const polyLen = (P: Pt[]) => segLens(P).reduce((a, b) => a + b, 0);
export const ptsD = (P: Pt[]) => P.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
// one brush stroke along a polyline. The body is an outline whose width follows the brush pressure (pressed down at
// the start, full through the middle, lifting and thinning at the end); dry streaks are cut into the second half
// (飞白, "flying white"); a turbulence filter roughens the edge and a soft second pass soaks into the paper.
// The stroke is revealed from its start up to k.
export const Brush: React.FC<{ id: string; pts: Pt[]; w: number; k: number; seed?: number; color?: string; o?: number; dry?: number; tail?: number }> = ({ id, pts, w, k, seed = 1, color = INK, o = 1, dry = 0.75, tail = 0.35 }) => {
  if (k <= 0 || o <= 0.001) return null;
  const seg = segLens(pts), L = seg.reduce((a, b) => a + b, 0);
  const s: number[] = [0]; seg.forEach((d) => s.push(s[s.length - 1] + d / L));
  const nrm = pts.map((_, j) => { const a = pts[Math.max(0, j - 1)], b = pts[Math.min(pts.length - 1, j + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1; return [-dy / m, dx / m]; });
  const width = (u: number, j: number) => w * (u < 0.06 ? 1 + 0.12 * (1 - u / 0.06) : 1) * (u < 0.55 ? 1 : 1 - (1 - tail) * ((u - 0.55) / 0.45) ** 1.3) * (1 + 0.07 * Math.sin(j * 0.9 + seed));
  const side = (sg: number) => pts.map((p, j) => { const h = (width(s[j], j) / 2) * sg; return [p[0] + nrm[j][0] * h, p[1] + nrm[j][1] * h] as Pt; });
  const outline = ptsD([...side(1), ...side(-1).reverse()]) + "Z";
  const lanes = 24;
  return (
    <g opacity={o}>
      <defs>
        <filter id={`${id}r`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={seed} />
          <feDisplacementMap in="SourceGraphic" scale={Math.max(3, w * 0.18)} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <mask id={`${id}k`}><path d={ptsD(pts)} stroke="#fff" strokeWidth={w * 2.2} fill="none" strokeLinecap="round" strokeDasharray={`${L * k} ${L * 3}`} /></mask>
        <mask id={`${id}d`}>
          <path d={outline} fill="#fff" />
          {Array.from({ length: lanes }, (_, i) => {
            const u = (i + 0.5) / lanes - 0.5, edge = Math.abs(u) * 2;
            const P = pts.map((p, j) => { const h = width(s[j], j) * u; return [p[0] + nrm[j][0] * h, p[1] + nrm[j][1] * h] as Pt; });
            const parts: string[] = []; let acc = 0, m = 0;
            while (acc < L && m < 90) {
              const at = acc / L, dr = Math.max(0, (at - 0.42) / 0.58) * dry * (0.35 + 0.65 * edge) * (0.5 + rnd(seed * 7 + i * 11 + m));
              const on = 18 + 70 * rnd(seed + i * 3 + m * 7);         // a stretch where this bristle still carries ink (not cut)
              const off = dr * (30 + 130 * rnd(seed * 5 + i + m * 3)); // a dry streak cut into the stroke
              parts.push("0", on.toFixed(1), off.toFixed(1), "0"); acc += on + off; m++;
            }
            return <path key={i} d={ptsD(P)} stroke="#000" strokeWidth={(w / lanes) * (0.45 + 0.4 * rnd(seed + i))} fill="none" strokeDasharray={parts.join(" ")} />;
          })}
        </mask>
      </defs>
      <g mask={`url(#${id}k)`}>
        <g filter={`url(#${id}r)`}>
          <path d={outline} fill={color} opacity={0.18} transform="translate(1.5,1.5)" style={{ filter: "blur(2.5px)" }} />
          <g mask={`url(#${id}d)`}><path d={outline} fill={color} opacity={0.93} /></g>
          {/* 起笔: the brush pressed down, round */}
          <circle cx={pts[0][0]} cy={pts[0][1]} r={width(0, 0) * 0.5} fill={color} opacity={0.93} />
        </g>
      </g>
    </g>
  );
};
// an ink circle (the film's motif): drawn round from about one o'clock, ending dry
export const circlePts = (cx: number, cy: number, r: number, start = -1.1, sweep = 6.05, n = 72): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => { const a = start + (sweep * i) / n, rr = r * (1 + 0.012 * Math.sin(a * 3 + 1)); return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as Pt; });
export const InkCircle: React.FC<{ id: string; cx: number; cy: number; r: number; w?: number; k: number; o?: number; seed?: number; color?: string }> = ({ id, cx, cy, r, w = 28, k, o = 1, seed = 3, color = INK }) =>
  <Brush id={id} pts={circlePts(cx, cy, r)} w={w} k={k} o={o} seed={seed} color={color} />;
// a bloom of ink spreading in water (for transitions)
export const Bloom: React.FC<{ x: number; y: number; r: number; k: number; o?: number; color?: string }> = ({ x, y, r, k, o = 1, color = "28,27,25" }) => {
  if (k <= 0 || o <= 0.001) return null;
  const R = r * eOut(k);
  return <div style={{ position: "absolute", left: x - R, top: y - R, width: R * 2, height: R * 2, borderRadius: "50%", opacity: o,
    background: `radial-gradient(circle, rgba(${color},0.95) 0%, rgba(${color},0.8) 38%, rgba(${color},0.35) 62%, rgba(${color},0) 72%)`, filter: `blur(${4 + 10 * k}px)` }} />;
};
// drifting mist bands over the paper
export const Mist: React.FC<{ t: number; o?: number; y?: number }> = ({ t, o = 1, y = 600 }) => (o <= 0.001 ? null :
  <div style={{ position: "absolute", left: -200, right: -200, top: y - 160, height: 320, opacity: o,
    background: "radial-gradient(ellipse at 50% 50%, rgba(246,241,230,0.85) 0%, rgba(246,241,230,0) 70%)", transform: `translateX(${Math.sin(t * 0.15) * 120}px)` }} />);
export const Credit: React.FC<{ t: number; at: number; out: number; text: string; color?: string }> = ({ t, at, out, text, color = "rgba(60,55,48,0.55)" }) =>
  <Note t={t} at={at} out={out} text={text} x={1860} y={1032} anchor="right" size={18} color={color} />;
export { eIn as _eIn };
