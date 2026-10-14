// 红楼 · 第一页 — shared timing, palette, type and the film's two devices.
//  · A garden wall with a plum-blossom window (梅花窗, after the one in 扬州何园): every picture is seen through it, and
//    every cut zooms through it into the next world.
//  · The red commentary of 脂砚斋 (朱批): the novel is set in black printed type, and each decoding is brushed in red
//    beside it, labelled 正文 or 脂批 so the film never passes a reader's guess off as the text.
// The film's colour drains with the story: warm paper in the garden, grey at the dream, white at the end, then warm
// paper again for the first page.
import React from "react";
import { Img, staticFile } from "remotion";
import J from "./hlm.json";
export { clamp01, lerp, range, eOut, eIn, eInOut, backOut, win, rnd, mix } from "../elements/core";
import { eIn, eInOut, eOut, lerp, range, rnd } from "../elements/core";

export const HJ = J;
export const INK = "#1D1A17", INK2 = "#4D4740", RED = "#B3242B", WALL = "#EEEAE2", STONEC = "#8E8A83", FAINT = "rgba(29,26,23,0.5)";
export const SERIF = "'Noto Serif SC', serif";
export const SANS = "'Noto Sans SC', sans-serif";
export const XING = "'Zhi Mang Xing', 'Ma Shan Zheng', serif";

export const Svg: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", ...style }}>{children}</svg>;
export const Layer: React.FC<React.PropsWithChildren<{ o?: number; style?: React.CSSProperties }>> = ({ o = 1, style, children }) => (o <= 0.001 ? null : <div style={{ position: "absolute", inset: 0, opacity: o, ...style }}>{children}</div>);
export const fade = (t: number, a: number, b: number, fi = 0.4, fo = 0.4) => Math.min(eOut(range(t, a, a + fi)), 1 - eIn(range(t, b - fo, b)));

// ---------- the colour of the page over the film ----------
const W = J.white, T = J.turn, L = J.lift;
export const paperAt = (t: number) => {
  // warm → grey (the dream and the fall) → white → warm again for the first page
  const cool = eInOut(range(t, T.t - 1, T.t + 4)), white = eInOut(range(t, W.t, W.l2 + 1)), back = eInOut(range(t, L.t - 0.6, L.t + 0.6));
  const warm = [241, 233, 218], grey = [226, 226, 223], wh = [250, 250, 248];
  const c = warm.map((w, i) => lerp(lerp(lerp(w, grey[i], cool), wh[i], white), w, back));
  return `rgb(${c.map((v) => Math.round(v)).join(",")})`;
};
export const Paper: React.FC<{ t: number; o?: number }> = ({ t, o = 1 }) => (o <= 0.001 ? null :
  <div style={{ position: "absolute", inset: 0, opacity: o, background: paperAt(t) }}>
    <Img src={staticFile("media/dao_paper.jpg")} style={{ position: "absolute", inset: 0, width: 1920, height: 1080, objectFit: "cover", mixBlendMode: "multiply", opacity: 0.35 }} />
  </div>);

// ---------- the plum-blossom window ----------
// the outline of five overlapping circles (petals) round a centre, as a polygon of the union's boundary
export const flowerD = (cx: number, cy: number, R: number, rot = 0, n = 240) => {
  const d = R * 0.5, r = R * 0.55, cs = Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + rot + (i * 2 * Math.PI) / 5; return [Math.cos(a) * d, Math.sin(a) * d]; });
  const pts: string[] = [];
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * Math.PI * 2, ux = Math.cos(a), uy = Math.sin(a);
    let best = 0;
    for (const [px, py] of cs) { const b = px * ux + py * uy, disc = r * r - (px * px + py * py) + b * b; if (disc > 0) best = Math.max(best, b + Math.sqrt(disc)); }
    pts.push(`${k ? "L" : "M"}${(cx + ux * best).toFixed(1)},${(cy + uy * best).toFixed(1)}`);
  }
  return pts.join("") + "Z";
};
// the wall: a white garden wall with a soft lime-wash texture, a flower-shaped hole and a stone frame round it.
// Whatever is passed as children is seen through the hole.
export const Window: React.FC<React.PropsWithChildren<{ cx: number; cy: number; R: number; o?: number; wall?: string; frame?: number; rot?: number }>> = ({ cx, cy, R, o = 1, wall = WALL, frame = 1, rot = 0, children }) => {
  if (o <= 0.001) return null;
  const d = flowerD(cx, cy, R, rot);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <div style={{ position: "absolute", inset: 0, clipPath: `path('${d}')` }}>{children}</div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="limewash"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={4} /><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.43  0 0 0 0 0.40  0 0 0 0.10 0" /><feComposite in2="SourceGraphic" operator="in" /></filter>
        </defs>
        <path d={`M-10,-10H1930V1090H-10Z${d}`} fill={wall} fillRule="evenodd" />
        <path d={`M-10,-10H1930V1090H-10Z${d}`} fill={wall} fillRule="evenodd" filter="url(#limewash)" />
        {frame > 0 && <>
          <path d={d} fill="none" stroke={STONEC} strokeWidth={R * 0.075} opacity={frame} />
          <path d={d} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={R * 0.02} opacity={frame} transform={`translate(0,${R * 0.012})`} />
        </>}
      </svg>
    </div>
  );
};

type Anchor = "left" | "center" | "right";
const tx = (a: Anchor) => (a === "left" ? "0%" : a === "center" ? "-50%" : "-100%");
// a line of printed type that inks in, character by character
export const Say: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; color?: string; anchor?: Anchor;
  font?: string; weight?: number; stagger?: number; tracking?: number; hi?: string; hiColor?: string }> = ({ t, at, out, text, x, y, size, color = INK, anchor = "left", font = SERIF, weight = 600, stagger = 0.05, tracking = 3, hi = "", hiColor = RED }) => {
  if (t < at || t >= out) return null;
  const o = 1 - eIn(range(t, out - 0.45, out));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, display: "flex", whiteSpace: "pre", opacity: o, letterSpacing: tracking }}>
      {Array.from(text).map((ch, i) => {
        const k = eOut(range(t, at + i * stagger, at + i * stagger + 0.5));
        return <span key={i} style={{ display: "inline-block", fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.3, color: hi.includes(ch) ? hiColor : color, opacity: k, filter: `blur(${(1 - k) * 5}px)` }}>{ch}</span>;
      })}
    </div>
  );
};
// a vertical column of type (top to bottom); with red=true it is brushed in red like a 朱批, revealed by the brush
export const Col: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; color?: string; font?: string; weight?: number; stagger?: number; red?: boolean; o?: number }> = ({ t, at, out, text, x, y, size, color = INK, font = SERIF, weight = 700, stagger = 0.07, red = false, o = 1 }) => {
  if (t < at || t >= out || o <= 0.001) return null;
  const f = 1 - eIn(range(t, out - 0.45, out)), n = Array.from(text).length;
  if (red) {   // the brush writes downward
    const k = eInOut(range(t, at, at + 0.25 + n * 0.12));
    return <div style={{ position: "absolute", left: x - size / 2, top: y, width: size * 1.2, display: "flex", flexDirection: "column", alignItems: "center", opacity: f * o,
      clipPath: `inset(0 0 ${(1 - k) * 100}% 0)` }}>
      {Array.from(text).map((ch, i) => <span key={i} style={{ fontFamily: XING, fontSize: size, lineHeight: 1.02, color: RED }}>{ch}</span>)}
    </div>;
  }
  return <div style={{ position: "absolute", left: x - size / 2, top: y, width: size * 1.1, display: "flex", flexDirection: "column", alignItems: "center", opacity: f * o }}>
    {Array.from(text).map((ch, i) => { const k = eOut(range(t, at + i * stagger, at + i * stagger + 0.45));
      return <span key={i} style={{ fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.08, color, opacity: k, filter: `blur(${(1 - k) * 4}px)` }}>{ch}</span>; })}
  </div>;
};
// a horizontal red note, brushed in from the left
export const Pi: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; anchor?: Anchor }> = ({ t, at, out, text, x, y, size, anchor = "left" }) => {
  if (t < at || t >= out) return null;
  const n = Array.from(text).length, k = eInOut(range(t, at, at + 0.2 + n * 0.08)), o = 1 - eIn(range(t, out - 0.45, out));
  return <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, whiteSpace: "nowrap", fontFamily: XING, fontSize: size, lineHeight: 1.2, color: RED, opacity: o,
    clipPath: `inset(-20% ${(1 - k) * 100}% -20% 0)` }}>{text}</div>;
};
// a small source label: 正文 / 脂批 / 读者
export const Tag: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; anchor?: Anchor; kind?: "zheng" | "pi" | "du" }> = ({ t, at, out, text, x, y, anchor = "left", kind = "pi" }) => {
  if (t < at || t >= out) return null;
  const k = eOut(range(t, at, at + 0.4)) * (1 - eIn(range(t, out - 0.4, out)));
  const c = kind === "pi" ? RED : kind === "zheng" ? INK2 : "#7A6F62";
  return <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, opacity: k, border: `1.5px solid ${c}`, color: c, borderRadius: 4, padding: "2px 10px",
    fontFamily: SANS, fontWeight: 700, fontSize: 20, letterSpacing: 2, whiteSpace: "nowrap" }}>{text}</div>;
};
export const Note: React.FC<{ t: number; at: number; out: number; text: React.ReactNode; x: number; y: number; anchor?: Anchor; size?: number; color?: string; font?: string }> = ({ t, at, out, text, x, y, anchor = "left", size = 24, color = INK2, font = SANS }) => {
  if (t < at || t >= out) return null;
  const k = eInOut(range(t, at, at + 0.5)), o = 1 - eIn(range(t, out - 0.4, out));
  return <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, opacity: k * o, fontFamily: font, fontWeight: 500, fontSize: size, color, letterSpacing: 1.5, whiteSpace: "nowrap" }}>{text}</div>;
};
export const Credit: React.FC<{ t: number; at: number; out: number; text: string }> = ({ t, at, out, text }) =>
  <Note t={t} at={at} out={out} text={text} x={1860} y={1036} anchor="right" size={18} color="rgba(29,26,23,0.5)" />;
// a cinnabar seal
export const Seal: React.FC<{ t: number; at: number; text: string; x: number; y: number; s?: number; o?: number }> = ({ t, at, text, x, y, s = 88, o = 1 }) => {
  if (t < at || o <= 0.001) return null;
  const k = eOut(range(t, at, at + 0.18)), chars = Array.from(text), two = chars.length > 2;
  return <div style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, background: RED, borderRadius: 5, opacity: o * k * 0.92, transform: `scale(${lerp(1.35, 1, k)})`,
    display: "flex", flexWrap: "wrap", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 6, boxSizing: "border-box", boxShadow: "inset 0 0 6px rgba(80,10,0,0.5)" }}>
    {(two ? chars : [text]).map((c, i) => <span key={i} style={{ fontFamily: XING, color: "#F8ECE2", fontSize: two ? s * 0.4 : s * 0.66, lineHeight: 1 }}>{c}</span>)}
  </div>;
};

// a real picture inside a box, moved and graded (focus x, focus y, scale)
export const Art: React.FC<{ src: string; t: number; a: number; b: number; from: [number, number, number]; to: [number, number, number]; filter?: string; o?: number;
  fit?: "cover" | "contain"; box?: [number, number, number, number]; style?: React.CSSProperties }> = ({ src, t, a, b, from, to, filter, o = 1, fit = "cover", box, style }) => {
  if (o <= 0.001) return null;
  const k = eInOut(range(t, a, b));
  const fx = lerp(from[0], to[0], k), fy = lerp(from[1], to[1], k), s = lerp(from[2], to[2], k);
  const [l, tp, w, h] = box ?? [0, 0, 1920, 1080];
  return (
    <div style={{ position: "absolute", left: l, top: tp, width: w, height: h, overflow: "hidden", opacity: o, ...style }}>
      <Img src={staticFile(`media/${src}`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, objectPosition: `${fx * 100}% ${fy * 100}%`,
        transformOrigin: `${fx * 100}% ${fy * 100}%`, transform: `scale(${s})`, filter }} />
    </div>
  );
};

// ---------- falling things ----------
// petals (pink-red, turning) or snow (white, soft), drifting down across the frame
export const Fall: React.FC<{ t: number; a: number; n?: number; kind?: "petal" | "snow"; o?: number; seed?: number; speed?: number }> = ({ t, a, n = 40, kind = "petal", o = 1, seed = 1, speed = 1 }) => {
  if (t < a || o <= 0.001) return null;
  return <Svg style={{ opacity: o }}>
    {Array.from({ length: n }, (_, i) => {
      const t0 = a + rnd(seed + i * 3) * 4, u = (t - t0) * (0.12 + 0.08 * rnd(seed + i * 5)) * speed;
      if (u < 0) return null;
      const y = -40 + (u % 1.15) * 1080, x = rnd(seed + i * 7) * 2000 - 40 + Math.sin(t * 0.9 + i) * 40 + u * 120;
      const r = kind === "snow" ? 2 + 4 * rnd(seed + i) : 7 + 7 * rnd(seed + i), rot = (t * 90 * (rnd(seed + i * 11) - 0.5) + i * 40) % 360;
      return kind === "snow" ? <circle key={i} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={0.85} style={{ filter: "blur(0.8px)" }} />
        : <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.55} fill={i % 3 === 0 ? "#D98A93" : "#E8A9AE"} opacity={0.85} transform={`rotate(${rot} ${x} ${y})`} />;
    })}
  </Svg>;
};
export { eIn as _eIn };
