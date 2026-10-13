// The film's kit: artworks with camera moves and treatments, film grain, the trio card (哲学 / 艺术 / 音乐), the answer
// line (意义，在……), the timeline, and the cut effects that land each segment on the downbeat.
import React from "react";
import { Img, staticFile } from "remotion";
import { BIG, GOLD, GROT, INK, LATIN, MJ, PAPER, SANS, SEG, SERIF, backOut, clamp01, eIn, eInOut, eOut, lerp, range, rnd } from "./base";

// ───────────── an artwork that fills the frame, with a slow camera move from one focus/zoom to another
export const Art: React.FC<{ src: string; t: number; a: number; b: number; from: [number, number, number]; to: [number, number, number];
  filter?: string; o?: number; fit?: "cover" | "contain"; style?: React.CSSProperties }> = ({ src, t, a, b, from, to, filter, o = 1, fit = "cover", style }) => {
  const k = eInOut(range(t, a, b));
  const fx = lerp(from[0], to[0], k), fy = lerp(from[1], to[1], k), s = lerp(from[2], to[2], k);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: o, ...style }}>
      <Img src={staticFile(`media/${src}`)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, objectPosition: `${fx * 100}% ${fy * 100}%`,
        transformOrigin: `${fx * 100}% ${fy * 100}%`, transform: `scale(${s})`, filter }} />
    </div>
  );
};

// film grain and a vignette over everything
export const Grain: React.FC<{ t: number; o?: number }> = ({ t, o = 0.13 }) => {
  const f = Math.floor(t * 24);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("media/me_grain.png")})`, backgroundSize: "512px 512px",
        backgroundPosition: `${Math.floor(rnd(f) * 512)}px ${Math.floor(rnd(f + 99) * 512)}px`, mixBlendMode: "overlay", opacity: o, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)", pointerEvents: "none" }} />
    </>
  );
};

// ───────────── type
type Anchor = "left" | "center" | "right";
const tx = (a: Anchor) => (a === "left" ? "0%" : a === "center" ? "-50%" : "-100%");
export const Line: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; color: string; anchor?: Anchor;
  font?: string; weight?: number; stagger?: number; tracking?: number; shadow?: string; italic?: boolean }> = ({ t, at, out, text, x, y, size, color, anchor = "left", font = SERIF, weight = 900, stagger = 0.025, tracking = 0, shadow, italic }) => {
  if (t < at || t >= out) return null;
  const o = 1 - eIn(range(t, out - 0.16, out));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)})`, display: "flex", whiteSpace: "pre", fontFamily: font, fontWeight: weight, fontSize: size, color,
      lineHeight: 1.12, opacity: o, letterSpacing: tracking, textShadow: shadow ?? "0 4px 24px rgba(0,0,0,0.45)", fontStyle: italic ? "italic" : "normal" }}>
      {Array.from(text).map((ch, i) => {
        const k = eOut(range(t, at + i * stagger, at + i * stagger + 0.28));
        return <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}><span style={{ display: "inline-block", transform: `translateY(${(1 - k) * 105}%)` }}>{ch}</span></span>;
      })}
    </div>
  );
};
export const Chip: React.FC<{ t: number; at: number; out: number; text: React.ReactNode; x: number; y: number; size?: number; bg?: string; fg?: string; anchor?: Anchor; rot?: number }> = ({ t, at, out, text, x, y, size = 30, bg = GOLD, fg = INK, anchor = "left", rot = 0 }) => {
  if (t < at || t >= out) return null;
  const k = backOut(range(t, at, at + 0.25), 1.6), o = 1 - eIn(range(t, out - 0.15, out));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)}) rotate(${rot}deg) scaleX(${clamp01(k)})`, transformOrigin: anchor === "right" ? "right center" : anchor === "center" ? "center" : "left center",
      opacity: o, background: bg, color: fg, fontFamily: SANS, fontWeight: 900, fontSize: size, padding: `${size * 0.16}px ${size * 0.45}px`, whiteSpace: "nowrap", lineHeight: 1.2 }}>
      <span style={{ opacity: clamp01(k * 2 - 0.6) }}>{text}</span>
    </div>
  );
};

// ───────────── the segment frame: index, the answer to "where is meaning?", and the trio card
const fmtY = (y: number) => (y < 0 ? `公元前 ${-y}` : `${y}`);
export const Frame: React.FC<{ t: number; light?: boolean }> = ({ t, light }) => {
  const i = SEG.findIndex((s) => t >= s.t && t < s.out);
  if (i < 0) return null;
  const s = SEG[i], k = eOut(range(t, s.t, s.t + 0.35)), o = (1 - eIn(range(t, s.out - 0.12, s.out))) * (s.id === "cynic" ? 1 - eIn(range(t, MJ.cue.cynic.split - 0.1, MJ.cue.cynic.split + 0.2)) : 1);
  const fg = light ? INK : PAPER, sub = light ? "rgba(11,11,13,0.7)" : "rgba(244,238,226,0.75)";
  const rows: [string, string][] = [["哲学", `${s.who} · ${s.phil}`], ["艺术", s.art], ["声音", s.music]];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o, pointerEvents: "none" }}>
      {/* the index and the year */}
      <div style={{ position: "absolute", left: 64, top: 44, display: "flex", alignItems: "baseline", gap: 18, color: fg }}>
        <span style={{ fontFamily: BIG, fontSize: 96, lineHeight: 0.85, transform: `translateY(${(1 - k) * 40}px)`, display: "inline-block", opacity: k, textShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>{String(i + 1).padStart(2, "0")}</span>
        <span style={{ fontFamily: GROT, fontWeight: 700, fontSize: 30, letterSpacing: 2, opacity: 0.9 * k }}>{fmtY(s.year)}</span>
      </div>
      {/* where is meaning? */}
      <div style={{ position: "absolute", left: 64, top: 160, display: "flex", alignItems: "baseline", gap: 16, color: fg, textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
        <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 34, color: GOLD, opacity: k }}>意义</span>
        <span style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 58 }}>
          {Array.from(s.where).map((ch, j) => { const kk = eOut(range(t, s.t + 0.08 + j * 0.03, s.t + 0.36 + j * 0.03)); return <span key={j} style={{ display: "inline-block", overflow: "hidden" }}><span style={{ display: "inline-block", transform: `translateY(${(1 - kk) * 105}%)` }}>{ch}</span></span>; })}
        </span>
      </div>
      {/* the trio card */}
      <div style={{ position: "absolute", left: 64, bottom: 96, display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map(([kname, v], j) => {
          const kk = eOut(range(t, s.t + 0.15 + j * 0.08, s.t + 0.45 + j * 0.08));
          return (
            <div key={j} style={{ display: "flex", alignItems: "center", gap: 12, transform: `translateX(${(1 - kk) * -40}px)`, opacity: kk }}>
              <span style={{ fontFamily: SANS, fontWeight: 900, fontSize: 20, color: INK, background: [GOLD, "#E9E2D2", "#9FD8FF"][j], padding: "2px 10px" }}>{kname}</span>
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24, color: fg, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>{v}</span>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", right: 64, top: 52, fontFamily: LATIN, fontStyle: "italic", fontWeight: 600, fontSize: 26, color: sub, letterSpacing: 3 }}>意义，从哪来？</div>
    </div>
  );
};

// ───────────── the timeline: 2500 years compressed into one bar, the segment's year lit
const YX = (y: number) => (y < 0 ? lerp(120, 360, clamp01((y + 450) / 300)) : y < 1400 ? lerp(380, 620, clamp01(y / 1400)) : lerp(640, 1800, clamp01((y - 1400) / 600)));
export const Timeline: React.FC<{ t: number; light?: boolean }> = ({ t, light }) => {
  const s = SEG.find((x) => t >= x.t && t < x.out);
  if (!s) return null;
  const ink = light ? INK : PAPER;
  const done = SEG.filter((x) => x.t <= t);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <line x1={120} y1={1040} x2={1800} y2={1040} stroke={ink} strokeWidth={2} opacity={0.35} />
      {done.map((x) => <circle key={x.id} cx={YX(x.year)} cy={1040} r={x === s ? 9 : 5} fill={x === s ? GOLD : ink} opacity={x === s ? 1 : 0.6} />)}
      {[[-400, "古希腊"], [400, "中世纪"], [1500, "近代"], [1900, "现代"]].map(([y, n]) => <text key={n as string} x={YX(y as number)} y={1028} fontFamily={SANS} fontWeight={700} fontSize={16} fill={ink} opacity={0.5}>{n}</text>)}
    </svg>
  );
};

// ───────────── cut effects, centred on each segment boundary: they cover the hard cut on the downbeat
export type CutKind = "slats" | "flash" | "glitch" | "iris" | "wipe" | "pixel" | "shutter";
export const Cut: React.FC<{ t: number; at: number; kind: CutKind; c?: string; c2?: string; x?: number; y?: number }> = ({ t, at, kind, c = GOLD, c2 = INK, x = 1280, y = 520 }) => {
  const a = at - 0.22, b = at + 0.22;
  if (t < a || t > b) return null;
  const k = range(t, a, b);                           // 0 → 1 across the cut
  const cover = k < 0.5 ? eIn(k * 2) : 1 - eOut((k - 0.5) * 2); // 0 → 1 → 0
  if (kind === "flash") return <div style={{ position: "absolute", inset: 0, background: c, opacity: Math.pow(cover, 1.5) * 0.95 }} />;
  if (kind === "slats") {
    return (
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 12 }, (_, i) => { const d = clamp01(cover * 1.4 - (i % 2 ? 0.2 : 0)); return <rect key={i} x={i % 2 ? 1920 - 1920 * d : 0} y={i * 90} width={1920 * d} height={91} fill={i % 3 === 0 ? c : c2} />; })}
      </svg>
    );
  }
  if (kind === "shutter") {
    return (
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 8 }, (_, i) => <polygon key={i} points={`${x},${y} ${x + 2400 * Math.cos((i / 8) * Math.PI * 2)},${y + 2400 * Math.sin((i / 8) * Math.PI * 2)} ${x + 2400 * Math.cos(((i + cover) / 8) * Math.PI * 2)},${y + 2400 * Math.sin(((i + cover) / 8) * Math.PI * 2)}`} fill={i % 2 ? c : c2} />)}
      </svg>
    );
  }
  if (kind === "iris") {
    const r = cover * 1500;
    return <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}><circle cx={x} cy={y} r={r} fill={c2} /><circle cx={x} cy={y} r={r} fill="none" stroke={c} strokeWidth={24} /></svg>;
  }
  if (kind === "wipe") {
    const X = lerp(-400, 2320, eInOut(k));
    return <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}><polygon points={`${X - 700},0 ${X},0 ${X - 400},1080 ${X - 1100},1080`} fill={c2} /><polygon points={`${X},0 ${X + 50},0 ${X - 350},1080 ${X - 400},1080`} fill={c} /></svg>;
  }
  if (kind === "pixel") {
    const N = 16, M = 9;
    return (
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: N * M }, (_, i) => { const on = rnd(i * 3.1 + at) < cover * 1.15; return on ? <rect key={i} x={(i % N) * 120} y={Math.floor(i / N) * 120} width={121} height={121} fill={rnd(i + at) < 0.2 ? c : c2} /> : null; })}
      </svg>
    );
  }
  // glitch: bands of colour and offset slices
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
      {Array.from({ length: 14 }, (_, i) => { const h = 20 + rnd(i + Math.floor(t * 30)) * 90, yy = rnd(i * 7 + Math.floor(t * 30)) * 1080; return <rect key={i} x={0} y={yy} width={1920} height={h} fill={["#FF2A6D", "#05D9E8", "#F5C451"][i % 3]} opacity={cover * 0.7} transform={`translate(${(rnd(i + 3) - 0.5) * 200 * cover} 0)`} />; })}
    </svg>
  );
};
export { PAPER, MJ };
