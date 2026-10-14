// 洋流 — shared timing, palettes, type and pieces. Each act wears its own art style (Hokusai, Franklin's engraved
// chart, Homer, Swiss posters, the Bauhaus, NASA's Perpetual Ocean, a nautical chart, Haeckel, a Victorian engraving,
// Ma Yuan's water); one luminous stream — "the river in the sea" — and one yellow duck run through all of them.
import React from "react";
import { Img, staticFile } from "remotion";
import J from "./ocean.json";
import LAND from "./land.json";
export { clamp01, lerp, range, eOut, eIn, eInOut, backOut, win, rnd, mix } from "../elements/core";
import { eIn, eInOut, eOut, lerp, range } from "../elements/core";

export const OJ = J;
export const NAVY = "#0B1E33", DEEP = "#050B16", FOAM = "#EAF4F7", SEA = "#2C6E8F", STREAM = "#BFE9FF", AMBER = "#F2B33D",
  INK = "#1E2328", PAPER = "#F1E8D6", SEPIA = "#5A4630", DUCK = "#FFCF33", RED = "#D7301F", MUTE = "#8796A3";
export const SERIF = "'Noto Serif SC', serif";
export const SANS = "'Noto Sans SC', sans-serif";
export const BRUSH = "'Ma Shan Zheng', 'Noto Serif SC', serif";
export const LATIN = "'Cormorant Garamond', 'Noto Serif SC', serif";
export const GEO = "'Jost', 'Noto Sans SC', sans-serif";
export const BLACK = "'Archivo Black', 'Noto Sans SC', sans-serif";

export const Svg: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}>{children}</svg>;
export const Layer: React.FC<React.PropsWithChildren<{ o?: number; style?: React.CSSProperties }>> = ({ o = 1, style, children }) => (o <= 0.001 ? null : <div style={{ position: "absolute", inset: 0, opacity: o, ...style }}>{children}</div>);
export const fade = (t: number, a: number, b: number, fi = 0.4, fo = 0.4) => Math.min(eOut(range(t, a, a + fi)), 1 - eIn(range(t, b - fo, b)));

type Anchor = "left" | "center" | "right";
const tx = (a: Anchor) => (a === "left" ? "0%" : a === "center" ? "-50%" : "-100%");
// a line of type, each character rising into place
export const Say: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; color?: string; anchor?: Anchor;
  font?: string; weight?: number; stagger?: number; shadow?: string; tracking?: number; vertical?: boolean; blur?: number }> = ({ t, at, out, text, x, y, size, color = FOAM, anchor = "left", font = SERIF, weight = 600, stagger = 0.035, shadow, tracking = 0, vertical, blur = 5 }) => {
  if (t < at || t >= out) return null;
  const o = 1 - eIn(range(t, out - 0.35, out));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: vertical ? undefined : `translateX(${tx(anchor)})`, display: "flex", flexDirection: vertical ? "column" : "row", whiteSpace: "pre", opacity: o, letterSpacing: tracking }}>
      {Array.from(text).map((ch, i) => {
        const k = eOut(range(t, at + i * stagger, at + i * stagger + 0.45));
        return <span key={i} style={{ display: "inline-block", fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: vertical ? 1.08 : 1.25, color, opacity: k, filter: blur ? `blur(${(1 - k) * blur}px)` : undefined,
          transform: `translateY(${(1 - k) * 14}px)`, textShadow: shadow }}>{ch}</span>;
      })}
    </div>
  );
};
export const Note: React.FC<{ t: number; at: number; out: number; text: React.ReactNode; x: number; y: number; anchor?: Anchor; size?: number; color?: string; font?: string }> = ({ t, at, out, text, x, y, anchor = "left", size = 22, color = MUTE, font = SANS }) => {
  if (t < at || t >= out) return null;
  const k = eInOut(range(t, at, at + 0.5)), o = 1 - eIn(range(t, out - 0.3, out));
  return <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, opacity: k * o, fontFamily: font, fontWeight: 500, fontSize: size, color, letterSpacing: 1.2, whiteSpace: "nowrap" }}>{text}</div>;
};
// a big number that counts up
export const Count: React.FC<{ t: number; a: number; b: number; to: number; x: number; y: number; size: number; color?: string; anchor?: Anchor; font?: string; suffix?: string; o?: number }> = ({ t, a, b, to, x, y, size, color = FOAM, anchor = "left", font = BLACK, suffix = "", o = 1 }) => {
  if (t < a || o <= 0.001) return null;
  const v = Math.round(to * eOut(range(t, a, b)));
  return <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, fontFamily: font, fontSize: size, color, opacity: o, lineHeight: 1, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{v.toLocaleString("en-US")}{suffix}</div>;
};

// a painting or print, moved and graded (focus x, focus y, scale)
export const Art: React.FC<{ src: string; t: number; a: number; b: number; from: [number, number, number]; to: [number, number, number]; filter?: string; o?: number;
  fit?: "cover" | "contain"; box?: [number, number, number, number]; mask?: string }> = ({ src, t, a, b, from, to, filter, o = 1, fit = "cover", box, mask }) => {
  if (o <= 0.001) return null;
  const k = eInOut(range(t, a, b));
  const fx = lerp(from[0], to[0], k), fy = lerp(from[1], to[1], k), s = lerp(from[2], to[2], k);
  const [l, tp, w, h] = box ?? [0, 0, 1920, 1080];
  return (
    <div style={{ position: "absolute", left: l, top: tp, width: w, height: h, overflow: "hidden", opacity: o, WebkitMaskImage: mask, maskImage: mask }}>
      <Img src={staticFile(`media/${src}`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, objectPosition: `${fx * 100}% ${fy * 100}%`,
        transformOrigin: `${fx * 100}% ${fy * 100}%`, transform: `scale(${s})`, filter }} />
    </div>
  );
};

// ---------- the map: Natural Earth land, plate carrée, any centre and zoom, wrapping round the globe ----------
// a view: centre (lon, lat), z = screen pixels per degree of latitude, kx = horizontal squeeze (cos of the mid latitude)
export type View = { lon: number; lat: number; z: number; kx?: number };
export const lerpView = (a: View, b: View, k: number): View => ({ lon: lerp(a.lon, b.lon, k), lat: lerp(a.lat, b.lat, k), z: a.z * Math.pow(b.z / a.z, k), kx: lerp(a.kx ?? 1, b.kx ?? 1, k) });
export const proj = (v: View, lon: number, lat: number): [number, number] => [960 + (lon - v.lon) * v.z * (v.kx ?? 1), 540 - (lat - v.lat) * v.z];
export const pathOf = (v: View, pts: number[][]) => pts.map(([lo, la], i) => { const [x, y] = proj(v, lo, la); return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`; }).join("");
// smooth path (Catmull–Rom → cubic Bézier) through projected points
export const smoothOf = (v: View, pts: number[][]) => {
  const P = pts.map(([lo, la]) => proj(v, lo, la));
  if (P.length < 3) return pathOf(v, pts);
  let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
};
// point at fraction k along a polyline of (lon, lat), by projected length
export const along = (v: View, pts: number[][], k: number): [number, number, number] => {
  const P = pts.map(([lo, la]) => proj(v, lo, la));
  const seg = P.slice(1).map((p, i) => Math.hypot(p[0] - P[i][0], p[1] - P[i][1])); const L = seg.reduce((a, b) => a + b, 0);
  let s = Math.max(0, Math.min(1, k)) * L;
  for (let i = 0; i < seg.length; i++) {
    if (s <= seg[i] || i === seg.length - 1) { const u = seg[i] ? s / seg[i] : 0; const a = P[i], b = P[i + 1];
      return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), Math.atan2(b[1] - a[1], b[0] - a[0])]; }
    s -= seg[i];
  }
  return [P[0][0], P[0][1], 0];
};
export const Land: React.FC<{ v: View; fill: string; stroke?: string; sw?: number; o?: number; filter?: string }> = ({ v, fill, stroke = "none", sw = 1, o = 1, filter }) => {
  if (o <= 0.001) return null;
  const sx = (v.z * (v.kx ?? 1)) / LAND.k, sy = v.z / LAND.k;
  const x0 = 960 - (v.lon + 180) * v.z * (v.kx ?? 1), y0 = 540 - (90 - v.lat) * v.z, W = 360 * v.z * (v.kx ?? 1);
  return (
    <g opacity={o} style={{ filter }}>
      {[-1, 0, 1].map((c) => <path key={c} d={LAND.d} transform={`translate(${x0 + c * W},${y0}) scale(${sx},${sy})`} fill={fill} stroke={stroke} strokeWidth={sw / sx} strokeLinejoin="round" />)}
    </g>
  );
};
// graticule every `step` degrees
export const Graticule: React.FC<{ v: View; step?: number; color: string; o?: number; w?: number }> = ({ v, step = 10, color, o = 1, w = 1 }) => {
  const xs: number[] = [], ys: number[] = [];
  for (let lo = Math.floor((v.lon - 200) / step) * step; lo <= v.lon + 200; lo += step) { const x = proj(v, lo, 0)[0]; if (x > -10 && x < 1930) xs.push(x); }
  for (let la = -80; la <= 80; la += step) { const y = proj(v, 0, la)[1]; if (y > -10 && y < 1090) ys.push(y); }
  return <g opacity={o} stroke={color} strokeWidth={w}>{xs.map((x, i) => <line key={`x${i}`} x1={x} y1={0} x2={x} y2={1080} />)}{ys.map((y, i) => <line key={`y${i}`} x1={0} y1={y} x2={1920} y2={y} />)}</g>;
};

// a stream: a path drawn up to k, with comets of light running along it (the river in the sea)
export const Stream: React.FC<{ d: string; k?: number; len: number; t: number; w?: number; color?: string; o?: number; speed?: number; comets?: number; glow?: boolean }> = ({ d, k = 1, len, t, w = 6, color = STREAM, o = 1, speed = 260, comets = 6, glow = true }) => {
  if (k <= 0 || o <= 0.001) return null;
  const shown = len * k, gap = len / comets;
  return (
    <g opacity={o}>
      {glow && <path d={d} fill="none" stroke={color} strokeWidth={w * 3.2} strokeLinecap="round" strokeDasharray={`${shown} ${len * 2}`} opacity={0.16} style={{ filter: "blur(6px)" }} />}
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={`${shown} ${len * 2}`} opacity={0.55} />
      <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={w * 0.7} strokeLinecap="round" strokeDasharray={`${gap * 0.18} ${gap * 0.82}`} strokeDashoffset={-((t * speed) % gap)}
        style={{ clipPath: undefined }} opacity={k >= 1 ? 0.9 : 0.9 * k} />
    </g>
  );
};

// ---------- the yellow duck (a bath toy, drawn: body, raised tail, head, beak, eye) ----------
// (x, y) = the waterline under its middle; s = height in pixels; facing right unless flip
export const Duck: React.FC<{ x: number; y: number; s: number; rot?: number; flip?: boolean; o?: number; tone?: number; glow?: number }> = ({ x, y, s, rot = 0, flip, o = 1, tone = 1, glow = 0 }) => {
  if (o <= 0.001) return null;
  const k = s / 100;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${flip ? -k : k},${k})`} opacity={o} style={{ filter: glow ? `drop-shadow(0 0 ${14 * glow}px rgba(255,214,90,${0.8 * glow}))` : undefined }}>
      <defs>
        <radialGradient id="dkB" cx="0.42" cy="0.32" r="0.75"><stop offset="0" stopColor="#FFF0A0" /><stop offset="0.45" stopColor={DUCK} /><stop offset="1" stopColor="#E59A12" /></radialGradient>
        <radialGradient id="dkH" cx="0.38" cy="0.3" r="0.8"><stop offset="0" stopColor="#FFF4B8" /><stop offset="0.5" stopColor={DUCK} /><stop offset="1" stopColor="#E89E14" /></radialGradient>
      </defs>
      <g style={{ filter: tone < 1 ? `brightness(${tone})` : undefined }}>
        {/* body with the tail swept up behind */}
        <path d="M -52,-8 C -60,-30 -58,-50 -66,-62 C -50,-58 -36,-44 -28,-36 C -6,-44 30,-44 48,-30 C 62,-18 60,0 44,4 C 20,10 -24,10 -40,6 C -50,4 -54,-2 -52,-8 Z" fill="url(#dkB)" />
        {/* wing */}
        <path d="M -20,-24 C -4,-30 18,-28 26,-18 C 14,-10 -6,-10 -20,-24 Z" fill="#F0AE1E" opacity={0.75} />
        {/* head */}
        <circle cx={26} cy={-62} r={26} fill="url(#dkH)" />
        {/* beak */}
        <path d="M 46,-62 C 60,-66 72,-62 76,-56 C 68,-52 56,-50 46,-52 Z" fill="#F07A1A" />
        <path d="M 46,-54 C 56,-52 66,-52 74,-55 C 66,-48 54,-46 46,-50 Z" fill="#D65E10" />
        {/* eye */}
        <ellipse cx={34} cy={-70} rx={4.6} ry={5.6} fill="#1B1B1B" />
        <circle cx={35.6} cy={-72} r={1.6} fill="#FFFFFF" />
        {/* rim light */}
        <path d="M -28,-36 C -6,-44 30,-44 48,-30" fill="none" stroke="#FFF6C8" strokeWidth={2.2} opacity={0.6} />
      </g>
    </g>
  );
};

// soft drifting specks (plankton, bubbles)
export const Specks: React.FC<{ t: number; n?: number; color?: string; o?: number; seed?: number; rise?: number }> = ({ t, n = 50, color = FOAM, o = 1, seed = 0, rise = 12 }) => {
  const rndl = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  return (
    <Svg>{Array.from({ length: n }, (_, i) => {
      const j = i + seed * 100, x = (rndl(j) * 1920 + Math.sin(t * 0.3 + j) * 20) % 1920, y = ((rndl(j + 2) * 1080 - t * rise * (0.5 + rndl(j + 3))) % 1080 + 1080) % 1080;
      return <circle key={i} cx={x} cy={y} r={0.8 + rndl(j + 4) * 2.4} fill={color} opacity={o * (0.12 + 0.4 * rndl(j + 5))} />;
    })}</Svg>
  );
};

// a small credit line for a painting or dataset
export const Credit: React.FC<{ t: number; at: number; out: number; text: string; color?: string; x?: number; y?: number; anchor?: Anchor }> = ({ t, at, out, text, color = "rgba(234,244,247,0.6)", x = 1860, y = 1030, anchor = "right" }) =>
  <Note t={t} at={at} out={out} text={text} x={x} y={y} anchor={anchor} size={18} color={color} />;

export { eIn as _eIn, eInOut as _eInOut };
