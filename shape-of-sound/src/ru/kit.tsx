// 儒 · 仁 — shared timing, palette, type and the film's one motif. The ground is a stele rubbing (碑拓): black ink
// pounded over paper on stone, the characters left white. The motif is the two strokes of 二: they slide in beside a
// lone 亻 to make 仁, then become the rods every painting hangs between, a balance beam, the stone dropped into water,
// the rings it sends out, a vessel's rim, a cart wheel, a gate's lintel and sill, and the two beams of a bell rack.
import React from "react";
import { Img, staticFile } from "remotion";
import J from "./ru.json";
export { clamp01, lerp, range, eOut, eIn, eInOut, backOut, win, rnd, mix } from "../elements/core";
import { eIn, eInOut, eOut, lerp, range, rnd } from "../elements/core";

export const RJ = J;
export const STONE = "#131417", RUB = "#ECE6D8", DIM = "rgba(236,230,216,0.62)", FAINT = "rgba(236,230,216,0.38)", CIN = "#C4482E", BRONZE = "#8FAE86", SILK = "#CDB98E";
export const KAI = "'LXGW WenKai TC', 'Noto Serif SC', serif";
export const SERIF = "'Noto Serif SC', serif";
export const SANS = "'Noto Sans SC', sans-serif";

export const Svg: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}>{children}</svg>;
export const Layer: React.FC<React.PropsWithChildren<{ o?: number; style?: React.CSSProperties }>> = ({ o = 1, style, children }) => (o <= 0.001 ? null : <div style={{ position: "absolute", inset: 0, opacity: o, ...style }}>{children}</div>);
export const fade = (t: number, a: number, b: number, fi = 0.4, fo = 0.4) => Math.min(eOut(range(t, a, a + fi)), 1 - eIn(range(t, b - fo, b)));
export const scene = (t: number, a: number, b: number) => Math.min(eOut(range(t, a - 0.35, a + 0.25)), 1 - eInOut(range(t, b - 0.25, b + 0.4)));

// the filters every piece of "carved" white goes through: a rubbing never prints solid — the paper's tooth and the
// ink dabs leave the white mottled and its edges a little ragged
export const Filters: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <filter id="rubbed" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves={4} seed={3} result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -5.2 0 0 0 4.15" result="m" />
        <feComposite in="SourceGraphic" in2="m" operator="in" result="c" />
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={8} result="w" />
        <feDisplacementMap in="c" in2="w" scale={4} xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="rubbedSoft" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves={3} seed={5} result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3.0 0 0 0 2.5" result="m" />
        <feComposite in="SourceGraphic" in2="m" operator="in" />
      </filter>
    </defs>
  </svg>
);

export const Stone: React.FC<{ o?: number; dx?: number }> = ({ o = 1, dx = 0 }) => (o <= 0.001 ? null :
  <div style={{ position: "absolute", inset: 0, opacity: o, background: STONE }}>
    <Img src={staticFile("media/ru_rubbing.jpg")} style={{ position: "absolute", left: -60 + dx, top: -34, width: 2040, height: 1148, objectFit: "cover" }} />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)" }} />
  </div>);

type Anchor = "left" | "center" | "right";
const tx = (a: Anchor) => (a === "left" ? "0%" : a === "center" ? "-50%" : "-100%");
// a line of carved type: each character is cut in turn — a quick white flare, then it settles into the stone.
// Characters listed in `hi` are inked in cinnabar.
export const Cut: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; color?: string; anchor?: Anchor;
  font?: string; stagger?: number; tracking?: number; hi?: string; hiColor?: string; filter?: string }> = ({ t, at, out, text, x, y, size, color = RUB, anchor = "left", font = KAI, stagger = 0.055, tracking = 3, hi = "", hiColor = CIN, filter = "url(#rubbed)" }) => {
  if (t < at || t >= out) return null;
  const o = 1 - eIn(range(t, out - 0.45, out));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, display: "flex", whiteSpace: "pre", opacity: o, letterSpacing: tracking, filter }}>
      {Array.from(text).map((ch, i) => {
        const s = at + i * stagger, k = eOut(range(t, s, s + 0.45)), flare = Math.max(0, 1 - Math.abs(t - s - 0.12) / 0.22);
        return <span key={i} style={{ display: "inline-block", fontFamily: font, fontWeight: 700, fontSize: size, lineHeight: 1.25, color: hi.includes(ch) ? hiColor : color, opacity: k,
          transform: `scale(${lerp(1.08, 1, k)})`, textShadow: `0 0 ${18 * flare}px rgba(255,248,230,${0.8 * flare}), 0 2px 0 rgba(0,0,0,0.55)` }}>{ch}</span>;
      })}
    </div>
  );
};
// vertical carved text (top to bottom), each character cut in turn
export const Column: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; color?: string; stagger?: number; hide?: (i: number) => number }> = ({ t, at, out, text, x, y, size, color = RUB, stagger = 0.3, hide }) => {
  if (t < at || t >= out) return null;
  const o = 1 - eIn(range(t, out - 0.45, out));
  return <div style={{ position: "absolute", left: x - size / 2, top: y, display: "flex", flexDirection: "column", opacity: o, filter: "url(#rubbed)" }}>
    {Array.from(text).map((ch, i) => { const s = at + i * stagger, k = eOut(range(t, s, s + 0.4)), flare = Math.max(0, 1 - Math.abs(t - s - 0.1) / 0.22);
      return <span key={i} style={{ fontFamily: KAI, fontWeight: 700, fontSize: size, lineHeight: 1.08, color, opacity: k * (hide ? hide(i) : 1), textShadow: `0 0 ${20 * flare}px rgba(255,248,230,${0.8 * flare}), 0 2px 0 rgba(0,0,0,0.55)` }}>{ch}</span>; })}
  </div>;
};
export const Note: React.FC<{ t: number; at: number; out: number; text: React.ReactNode; x: number; y: number; anchor?: Anchor; size?: number; color?: string; font?: string }> = ({ t, at, out, text, x, y, anchor = "left", size = 26, color = DIM, font = SANS }) => {
  if (t < at || t >= out) return null;
  const k = eInOut(range(t, at, at + 0.5)), o = 1 - eIn(range(t, out - 0.4, out));
  return <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, opacity: k * o, fontFamily: font, fontWeight: 500, fontSize: size, color, letterSpacing: 1.5, whiteSpace: "nowrap" }}>{text}</div>;
};
export const Credit: React.FC<{ t: number; at: number; out: number; text: string }> = ({ t, at, out, text }) =>
  <Note t={t} at={at} out={out} text={text} x={1860} y={1036} anchor="right" size={18} color="rgba(236,230,216,0.45)" />;
// a cinnabar seal
export const Seal: React.FC<{ t: number; at: number; text: string; x: number; y: number; s?: number; o?: number }> = ({ t, at, text, x, y, s = 88, o = 1 }) => {
  if (t < at || o <= 0.001) return null;
  const k = eOut(range(t, at, at + 0.18)), chars = Array.from(text), two = chars.length > 2;
  return <div style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, background: CIN, borderRadius: 5, opacity: o * k * 0.92, transform: `scale(${lerp(1.35, 1, k)})`,
    display: "flex", flexWrap: "wrap", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 6, boxSizing: "border-box", boxShadow: "inset 0 0 6px rgba(80,10,0,0.5)", filter: "url(#rubbedSoft)" }}>
    {(two ? chars : [text]).map((c, i) => <span key={i} style={{ fontFamily: KAI, fontWeight: 700, color: "#F6E9DA", fontSize: two ? s * 0.38 : s * 0.62, lineHeight: 1 }}>{c}</span>)}
  </div>;
};

// a real image, moved and graded (focus x, focus y, scale) inside a box
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

// ---------- 二 ----------
// one stroke of 二 as a carved bar: a slightly tapered, rounded slab of rubbing white. (x, y) is its centre.
export type Bar = { x: number; y: number; w: number; h: number; r?: number };
export const mixBar = (a: Bar, b: Bar, k: number): Bar => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k), r: lerp(a.r ?? 0, b.r ?? 0, k) });
export const Stroke: React.FC<{ b: Bar; o?: number; glow?: number; color?: string }> = ({ b, o = 1, glow = 0, color = RUB }) => (o <= 0.001 ? null :
  <div style={{ position: "absolute", left: b.x - b.w / 2, top: b.y - b.h / 2, width: b.w, height: b.h, opacity: o, transform: `rotate(${b.r ?? 0}deg)`,
    background: color, borderRadius: `${b.h * 0.5}px ${b.h * 0.35}px ${b.h * 0.42}px ${b.h * 0.5}px`, filter: "url(#rubbed)",
    boxShadow: glow > 0 ? `0 0 ${30 * glow}px rgba(255,236,200,${0.55 * glow})` : undefined }} />);
// a painting hung between the two strokes (the rods of a hanging scroll)
export const Hung: React.FC<{ src: string; t: number; a: number; b: number; box: [number, number, number, number]; o?: number; from?: [number, number, number]; to?: [number, number, number]; filter?: string; rods?: number }> = ({ src, t, a, b, box, o = 1, from = [0.5, 0.5, 1.0], to = [0.5, 0.5, 1.06], filter, rods = 1 }) => {
  if (o <= 0.001) return null;
  const [l, tp, w, h] = box;
  return <div style={{ position: "absolute", inset: 0, opacity: o }}>
    <div style={{ position: "absolute", left: l, top: tp, width: w, height: h, boxShadow: "0 24px 70px rgba(0,0,0,0.75)" }} />
    <Art src={src} t={t} a={a} b={b} from={from} to={to} box={box} filter={filter} />
    <Stroke b={{ x: l + w / 2, y: tp - 16, w: w + 70, h: 22 }} o={rods} />
    <Stroke b={{ x: l + w / 2, y: tp + h + 16, w: w + 70, h: 22 }} o={rods} />
  </div>;
};

// ---------- water ----------
// a ripple ring in rubbing white: thin, a little uneven, fading as it widens
export const Ring: React.FC<{ cx: number; cy: number; r: number; o?: number; w?: number; sq?: number }> = ({ cx, cy, r, o = 1, w = 3, sq = 0.38 }) => (o <= 0.001 || r <= 0 ? null :
  <ellipse cx={cx} cy={cy} rx={r} ry={r * sq} fill="none" stroke={RUB} strokeWidth={w} opacity={o} filter="url(#rubbedSoft)" />);

// small specks of stone dust thrown off where the chisel is (x, y) while k runs 0..1
export const Dust: React.FC<{ x: number; y: number; t: number; a: number; b: number; n?: number; seed?: number }> = ({ x, y, t, a, b, n = 14, seed = 1 }) => {
  if (t < a || t > b + 0.8) return null;
  return <>{Array.from({ length: n }, (_, i) => {
    const t0 = a + (b - a) * rnd(seed + i * 3), u = (t - t0) / 0.7;
    if (u < 0 || u > 1) return null;
    const ang = -Math.PI * (0.15 + 0.7 * rnd(seed + i * 7)), v = 60 + 140 * rnd(seed + i * 11);
    const px = x + Math.cos(ang) * v * u + (rnd(seed + i) - 0.5) * 40, py = y + Math.sin(ang) * v * u + 160 * u * u;
    return <circle key={i} cx={px} cy={py} r={1.2 + 2.2 * rnd(seed + i * 5)} fill={RUB} opacity={(1 - u) * 0.8} />;
  })}</>;
};
export { eIn as _eIn };
