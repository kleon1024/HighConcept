// 万圣节 — shared timing, palette, type and pieces. Night black and lantern orange, vintage postcards (c. 1910) and
// real prints; one flame travels through the film from a carved turnip to the last lantern.
import React from "react";
import { Img, staticFile } from "remotion";
import J from "./halloween.json";
export { clamp01, lerp, range, eOut, eIn, eInOut, backOut, win, rnd, mix } from "../elements/core";
import { eIn, eInOut, eOut, lerp, range, rnd } from "../elements/core";

export const HJ = J;
export const NIGHT = "#0E0B12", ORANGE = "#F07A1A", GLOW = "#FFB347", CREAM = "#F2E6C9", BONE = "#EDE3CF", PURPLE = "#2A1838", MOSS = "#1C2A22", INK = "#1A1410";
export const SERIF = "'Noto Serif SC', serif";
export const SANS = "'Noto Sans SC', sans-serif";
export const FELL = "'IM Fell English', 'Noto Serif SC', serif";
export const CREEP = "'Creepster', 'Noto Serif SC', serif";

export const Svg: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}>{children}</svg>;
export const Layer: React.FC<React.PropsWithChildren<{ o?: number; style?: React.CSSProperties }>> = ({ o = 1, style, children }) => (o <= 0.001 ? null : <div style={{ position: "absolute", inset: 0, opacity: o, ...style }}>{children}</div>);
export const fade = (t: number, a: number, b: number, fi = 0.35, fo = 0.35) => Math.min(eOut(range(t, a, a + fi)), 1 - eIn(range(t, b - fo, b)));
export const scene = (t: number, a: number, b: number) => Math.min(eOut(range(t, a - 0.4, a + 0.2)), 1 - eInOut(range(t, b - 0.25, b + 0.4)));

type Anchor = "left" | "center" | "right";
const tx = (a: Anchor) => (a === "left" ? "0%" : a === "center" ? "-50%" : "-100%");
const GLOWTEXT = "0 0 18px rgba(240,122,26,0.55), 0 3px 18px rgba(0,0,0,0.8)";
// a line of type that pops up with a little bounce (fun) and a lantern glow
export const Say: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; color?: string; anchor?: Anchor;
  font?: string; weight?: number; stagger?: number; shadow?: string; tracking?: number }> = ({ t, at, out, text, x, y, size, color = CREAM, anchor = "left", font = SERIF, weight = 900, stagger = 0.035, shadow = GLOWTEXT, tracking = 1 }) => {
  if (t < at || t >= out) return null;
  const o = 1 - eIn(range(t, out - 0.3, out));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, display: "flex", whiteSpace: "pre", opacity: o, letterSpacing: tracking }}>
      {Array.from(text).map((ch, i) => {
        const u = range(t, at + i * stagger, at + i * stagger + 0.35), k = eOut(u), b = u < 1 ? Math.sin(u * Math.PI) * 0.18 : 0;
        return <span key={i} style={{ display: "inline-block", fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.25, color, opacity: k,
          transform: `translateY(${(1 - k) * 22}px) scale(${1 + b})`, textShadow: shadow }}>{ch}</span>;
      })}
    </div>
  );
};
export const Note: React.FC<{ t: number; at: number; out: number; text: React.ReactNode; x: number; y: number; anchor?: Anchor; size?: number; color?: string; font?: string }> = ({ t, at, out, text, x, y, anchor = "left", size = 22, color = "rgba(242,230,201,0.7)", font = SANS }) => {
  if (t < at || t >= out) return null;
  const k = eInOut(range(t, at, at + 0.4)), o = 1 - eIn(range(t, out - 0.3, out));
  return <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, opacity: k * o, fontFamily: font, fontWeight: 500, fontSize: size, color, letterSpacing: 1.2, whiteSpace: "nowrap", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>{text}</div>;
};
export const Credit: React.FC<{ t: number; at: number; out: number; text: string }> = ({ t, at, out, text }) =>
  <Note t={t} at={at} out={out} text={text} x={1870} y={1034} anchor="right" size={17} color="rgba(242,230,201,0.55)" />;
// a "传说 / 一说" tag: marks folklore as folklore
export const Tag: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number }> = ({ t, at, out, text, x, y }) => {
  if (t < at || t >= out) return null;
  const k = eOut(range(t, at, at + 0.25)), o = 1 - eIn(range(t, out - 0.3, out));
  return <div style={{ position: "absolute", left: x, top: y, padding: "4px 12px", border: `2px solid ${GLOW}`, borderRadius: 4, color: GLOW, fontFamily: SANS, fontWeight: 700, fontSize: 22,
    opacity: k * o, transform: `scale(${lerp(1.3, 1, k)})` }}>{text}</div>;
};

// an image, moved and graded (focus x, focus y, scale)
export const Art: React.FC<{ src: string; t: number; a: number; b: number; from: [number, number, number]; to: [number, number, number]; filter?: string; o?: number;
  fit?: "cover" | "contain"; box?: [number, number, number, number]; mask?: string; style?: React.CSSProperties }> = ({ src, t, a, b, from, to, filter, o = 1, fit = "cover", box, mask, style }) => {
  if (o <= 0.001) return null;
  const k = eInOut(range(t, a, b));
  const fx = lerp(from[0], to[0], k), fy = lerp(from[1], to[1], k), s = lerp(from[2], to[2], k);
  const [l, tp, w, h] = box ?? [0, 0, 1920, 1080];
  return (
    <div style={{ position: "absolute", left: l, top: tp, width: w, height: h, overflow: "hidden", opacity: o, WebkitMaskImage: mask, maskImage: mask, ...style }}>
      <Img src={staticFile(`media/${src}`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, objectPosition: `${fx * 100}% ${fy * 100}%`,
        transformOrigin: `${fx * 100}% ${fy * 100}%`, transform: `scale(${s})`, filter }} />
    </div>
  );
};
// a vintage postcard: the image on a cream card with a thin border, tilted, dropped onto the table
export const Card: React.FC<{ src: string; t: number; at: number; out: number; x: number; y: number; w: number; h: number; rot?: number; from?: [number, number]; fit?: "cover" | "contain"; focus?: [number, number] }> = ({ src, t, at, out, x, y, w, h, rot = 0, from = [0, -900], fit = "cover", focus = [0.5, 0.5] }) => {
  if (t < at - 0.01 || t >= out) return null;
  const k = eOut(range(t, at, at + 0.5)), o = 1 - eIn(range(t, out - 0.3, out));
  const dx = lerp(from[0], 0, k), dy = lerp(from[1], 0, k), r = lerp(rot - 25, rot, k);
  return (
    <div style={{ position: "absolute", left: x - w / 2 + dx, top: y - h / 2 + dy, width: w, height: h, transform: `rotate(${r}deg)`, opacity: o, background: CREAM, padding: 14, boxSizing: "border-box",
      boxShadow: "0 18px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(80,60,40,0.4) inset" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", outline: "1px solid rgba(80,60,40,0.5)" }}>
        <Img src={staticFile(`media/${src}`)} style={{ width: "100%", height: "100%", objectFit: fit, objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%`, filter: "saturate(1.05) contrast(1.04)" }} />
      </div>
    </div>
  );
};

// ---------- the flame ----------
// a candle flame at (x, y) = its base, h tall; it flickers; a warm glow lights the area round it
export const Flame: React.FC<{ x: number; y: number; h: number; t: number; o?: number; glow?: number; seed?: number }> = ({ x, y, h, t, o = 1, glow = 1, seed = 0 }) => {
  if (o <= 0.001 || h <= 0.5) return null;
  const f1 = Math.sin(t * 13 + seed) * 0.5 + Math.sin(t * 7.3 + seed * 2) * 0.5, f2 = Math.sin(t * 9.1 + seed * 3);
  const w = h * 0.42, tip = h * (1 + 0.08 * f1), lean = w * 0.18 * f2;
  const d = (k: number) => `M ${x - w * k * 0.5},${y} C ${x - w * k * 0.62},${y - h * 0.35 * k} ${x - w * k * 0.2 + lean},${y - tip * 0.7 * k} ${x + lean * 1.4},${y - tip * k} C ${x + w * k * 0.25 + lean},${y - tip * 0.7 * k} ${x + w * k * 0.62},${y - h * 0.35 * k} ${x + w * k * 0.5},${y} C ${x + w * k * 0.35},${y + h * 0.12 * k} ${x - w * k * 0.35},${y + h * 0.12 * k} ${x - w * k * 0.5},${y} Z`;
  const g = glow * (0.85 + 0.15 * f1);
  return (
    <g opacity={o}>
      <circle cx={x} cy={y - h * 0.45} r={h * 3.2 * g} fill="url(#flameGlow)" />
      <path d={d(1.0)} fill="#F07A1A" opacity={0.92} />
      <path d={d(0.72)} fill="#FFB347" />
      <path d={d(0.42)} fill="#FFF1C4" />
      <defs><radialGradient id="flameGlow"><stop offset="0" stopColor="#FFB347" stopOpacity="0.5" /><stop offset="0.35" stopColor="#F07A1A" stopOpacity="0.18" /><stop offset="1" stopColor="#F07A1A" stopOpacity="0" /></radialGradient></defs>
    </g>
  );
};

// the five lanterns of the film: a turnip, a pumpkin, an ofrenda candle, a lotus river lantern, a paper lantern.
// Drawn with real form (gradients, carved faces that glow from inside); (x, y) is the base, lit ∈ [0, 1].
export const LANTERNS = ["萝卜灯", "南瓜灯", "亡灵节蜡烛", "中元河灯", "お盆灯笼"];
const LDefs: React.FC = () => (
  <defs>
    <linearGradient id="tnB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6E345E" /><stop offset="0.38" stopColor="#9B5A80" /><stop offset="0.55" stopColor="#E9D9B2" /><stop offset="1" stopColor="#CDB582" /></linearGradient>
    <radialGradient id="tnS" cx="0.35" cy="0.35" r="0.8"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.25" /><stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0" /><stop offset="1" stopColor="#000000" stopOpacity="0.45" /></radialGradient>
    <radialGradient id="pkR" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stopColor="#FFB85A" /><stop offset="0.6" stopColor="#E8731C" /><stop offset="1" stopColor="#A9470C" /></radialGradient>
    <radialGradient id="carve" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stopColor="#FFF4C8" /><stop offset="0.5" stopColor="#FFC45A" /><stop offset="1" stopColor="#F07A1A" /></radialGradient>
    <linearGradient id="lotus" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF0F4" /><stop offset="1" stopColor="#E77C9A" /></linearGradient>
    <radialGradient id="paperL" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stopColor="#FFF3D6" /><stop offset="0.7" stopColor="#F6C27A" /><stop offset="1" stopColor="#D98B3A" /></radialGradient>
    <radialGradient id="flameGlow"><stop offset="0" stopColor="#FFB347" stopOpacity="0.5" /><stop offset="0.35" stopColor="#F07A1A" stopOpacity="0.18" /><stop offset="1" stopColor="#F07A1A" stopOpacity="0" /></radialGradient>
  </defs>
);
const carveFill = (lit: number) => (lit > 0.02 ? "url(#carve)" : "#1C1218");
const Face: React.FC<{ cx: number; cy: number; k: number; lit: number }> = ({ cx, cy, k, lit }) => (
  <g opacity={lit > 0.02 ? 0.35 + 0.65 * lit : 1} style={{ filter: lit > 0.02 ? `drop-shadow(0 0 ${8 * lit}px rgba(255,180,70,0.9))` : undefined }}>
    <path d={`M ${cx - 34 * k},${cy - 8 * k} L ${cx - 18 * k},${cy - 34 * k} L ${cx - 4 * k},${cy - 6 * k} Z`} fill={carveFill(lit)} />
    <path d={`M ${cx + 4 * k},${cy - 6 * k} L ${cx + 18 * k},${cy - 34 * k} L ${cx + 34 * k},${cy - 8 * k} Z`} fill={carveFill(lit)} />
    <path d={`M ${cx - 40 * k},${cy + 8 * k} L ${cx - 28 * k},${cy + 14 * k} L ${cx - 20 * k},${cy + 6 * k} L ${cx - 8 * k},${cy + 16 * k} L ${cx + 4 * k},${cy + 6 * k} L ${cx + 16 * k},${cy + 16 * k} L ${cx + 26 * k},${cy + 6 * k} L ${cx + 40 * k},${cy + 8 * k}
      C ${cx + 30 * k},${cy + 36 * k} ${cx - 30 * k},${cy + 36 * k} ${cx - 40 * k},${cy + 8 * k} Z`} fill={carveFill(lit)} />
  </g>
);
export const Lantern: React.FC<{ kind: number; x: number; y: number; s: number; lit: number; t: number }> = ({ kind, x, y, s, lit, t }) => {
  const dim = lit > 0.02 ? 1 : 0.42;                                            // unlit lanterns stand in the dark
  const fl = 0.9 + 0.1 * Math.sin(t * 11 + kind) * Math.sin(t * 7.1);
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <LDefs />
      {lit > 0.02 && <circle cx={0} cy={-80} r={190 * lit * fl} fill="url(#flameGlow)" />}
      {lit > 0.02 && <ellipse cx={0} cy={4} rx={120 * lit} ry={16 * lit} fill="#FFB347" opacity={0.25 * lit} style={{ filter: "blur(6px)" }} />}
      <g style={{ filter: `brightness(${dim})` }}>
        {kind === 0 && <g>
          {/* the turnip: purple shoulders, cream belly, a thin root; a lid cut at the top with a stub of leaves */}
          <path d="M -6,-150 Q -14,-176 -30,-188 M 4,-150 Q 10,-178 28,-190 M 0,-150 Q 0,-180 -2,-196" stroke="#5E7A3A" strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M -52,-140 C -84,-120 -88,-58 -66,-28 C -48,-4 -22,4 -8,10 Q 0,30 -6,54 Q 10,34 12,10 C 32,2 58,-8 70,-34 C 86,-70 80,-122 52,-140 C 30,-152 -30,-152 -52,-140 Z" fill="url(#tnB)" />
          <path d="M -52,-140 C -84,-120 -88,-58 -66,-28 C -48,-4 -22,4 -8,10 Q 0,30 -6,54 Q 10,34 12,10 C 32,2 58,-8 70,-34 C 86,-70 80,-122 52,-140 C 30,-152 -30,-152 -52,-140 Z" fill="url(#tnS)" />
          <ellipse cx={0} cy={-142} rx={46} ry={8} fill={lit > 0.02 ? `rgba(255,190,90,${0.5 * lit})` : "#2A1A22"} stroke="#4A2A3E" strokeWidth={2} />
          {[[-40, -100, -30, -40], [44, -96, 30, -36], [-10, -120, -14, -60]].map(([x1, y1, x2, y2], i) => <path key={i} d={`M ${x1},${y1} Q ${(x1 + x2) / 2 + 8},${(y1 + y2) / 2} ${x2},${y2}`} stroke="#5A2F4A" strokeWidth={1.5} fill="none" opacity={0.5} />)}
          <Face cx={0} cy={-70} k={1} lit={lit} />
        </g>}
        {kind === 1 && <g>
          {/* the pumpkin: ribs, a twisted stem, a carved face */}
          {[-58, 58, -30, 30, 0].map((dx, i) => <ellipse key={i} cx={dx} cy={-74} rx={i < 2 ? 46 : i < 4 ? 52 : 54} ry={74} fill="url(#pkR)" stroke="#9A400C" strokeWidth={2.5} />)}
          <path d="M -4,-146 C -8,-166 2,-178 14,-184 L 18,-176 C 8,-170 6,-160 8,-146 Z" fill="#5A6A2A" stroke="#3A4A1A" strokeWidth={2} />
          <Face cx={0} cy={-70} k={1.25} lit={lit} />
        </g>}
        {kind === 2 && <g>
          {/* an ofrenda candle among marigolds */}
          <rect x={-24} y={-130} width={48} height={130} rx={5} fill="#F3E6C8" />
          <path d="M -24,-122 q 6,18 0,30 M 14,-126 q -4,22 4,38" stroke="#E3D2AA" strokeWidth={6} fill="none" strokeLinecap="round" />
          <rect x={-24} y={-130} width={48} height={130} rx={5} fill="url(#tnS)" opacity={0.6} />
          {Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI, r = 58 + (i % 3) * 8; return <circle key={i} cx={Math.cos(a) * r * (i % 2 ? 1 : -1)} cy={-6 - Math.sin(a) * 12} r={13} fill={i % 2 ? "#F59B1B" : "#F2B53A"} />; })}
          <line x1={0} y1={-130} x2={0} y2={-142} stroke="#2A1A10" strokeWidth={3} />
          {lit > 0.02 && <Flame x={0} y={-140} h={46 * lit} t={t} glow={0} seed={2} />}
        </g>}
        {kind === 3 && <g>
          {/* a lotus river lantern on the water */}
          <ellipse cx={0} cy={2} rx={100} ry={14} fill="#1A2A3A" opacity={0.7} />
          {[-1, 1].map((sd) => [0, 1, 2].map((j) => <path key={`${sd}${j}`} d={`M 0,-10 Q ${sd * (40 + j * 22)},${-30 - j * 6} ${sd * (34 + j * 26)},${-74 + j * 18} Q ${sd * (14 + j * 18)},${-40} 0,-10 Z`} fill="url(#lotus)" stroke="#C85A7A" strokeWidth={1.5} opacity={0.95} />))}
          <path d="M 0,-10 Q -22,-60 0,-96 Q 22,-60 0,-10 Z" fill="url(#lotus)" stroke="#C85A7A" strokeWidth={1.5} />
          {lit > 0.02 && <Flame x={0} y={-30} h={34 * lit} t={t} glow={0} seed={3} />}
          {lit > 0.02 && <ellipse cx={0} cy={18} rx={40} ry={60} fill="#FFB347" opacity={0.18 * lit} style={{ filter: "blur(8px)" }} />}
        </g>}
        {kind === 4 && <g>
          {/* a paper lantern (提灯 / 盆提灯) */}
          <line x1={0} y1={-210} x2={0} y2={-178} stroke="#3A2A20" strokeWidth={4} />
          <rect x={-38} y={-180} width={76} height={14} rx={3} fill="#2A1E16" />
          <ellipse cx={0} cy={-96} rx={60} ry={80} fill={lit > 0.02 ? "url(#paperL)" : "#D8C9A8"} />
          {[-60, -36, -12, 12, 36, 60].map((dy, i) => <path key={i} d={`M ${-60 * Math.sqrt(Math.max(0, 1 - (dy / 80) ** 2))},${-96 + dy} Q 0,${-96 + dy + 6} ${60 * Math.sqrt(Math.max(0, 1 - (dy / 80) ** 2))},${-96 + dy}`} stroke="#8A5A2A" strokeWidth={1.6} fill="none" opacity={0.6} />)}
          <rect x={-38} y={-24} width={76} height={14} rx={3} fill="#2A1E16" />
        </g>}
      </g>
    </g>
  );
};

// drifting embers / mist
export const Embers: React.FC<{ t: number; n?: number; o?: number; seed?: number }> = ({ t, n = 40, o = 1, seed = 0 }) => (
  <Svg>{Array.from({ length: n }, (_, i) => {
    const j = i + seed * 100, x = (rnd(j) * 1920 + Math.sin(t * 0.7 + j) * 30) % 1920, y = ((rnd(j + 2) * 1080 - t * (20 + 30 * rnd(j + 3))) % 1080 + 1080) % 1080;
    return <circle key={i} cx={x} cy={y} r={1 + rnd(j + 4) * 2.2} fill={GLOW} opacity={o * (0.15 + 0.5 * rnd(j + 5)) * (0.6 + 0.4 * Math.sin(t * 3 + i))} />;
  })}</Svg>
);
export const Vignette: React.FC<{ o?: number }> = ({ o = 1 }) => <div style={{ position: "absolute", inset: 0, opacity: o, background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)" }} />;
export { eIn as _eIn };
