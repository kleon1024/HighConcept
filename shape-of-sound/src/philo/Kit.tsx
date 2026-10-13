// The film's kit: the lamp and its flame, light, kinetic serif type, tags, the section header, the timeline ruler and
// the iris transition (the next scene opens out of a circle of light carried over from the last one).
import React from "react";
import { EMBER, FLAME, GOLD, LATIN, MONO, PJ, RULER_Y, SANS, SERIF, SEC, backOut, clamp01, eIn, eInOut, eOut, fmtYear, isDark, playYear, range, rnd, yearX } from "./base";

// ───────────── the flame (a teardrop that breathes) and an oil lamp (a Greek lychnos)
export const Flame: React.FC<{ t: number; s?: number; on?: number }> = ({ t, s = 1, on = 1 }) => {
  if (on <= 0.001) return null;
  const f = 1 + 0.08 * Math.sin(t * 23) + 0.05 * Math.sin(t * 37 + 1), sway = 4 * Math.sin(t * 9);
  return (
    <g transform={`scale(${s * on})`}>
      <ellipse cx={0} cy={-26} rx={46} ry={60} fill={GOLD} opacity={0.25} />
      <path d={`M0,${-78 * f} C${18 + sway},${-46 * f} 22,-14 0,0 C-22,-14 ${-18 + sway},${-46 * f} 0,${-78 * f} Z`} fill={EMBER} />
      <path d={`M0,${-56 * f} C${10 + sway * 0.6},${-34 * f} 12,-10 0,-2 C-12,-10 ${-10 + sway * 0.6},${-34 * f} 0,${-56 * f} Z`} fill={FLAME} />
    </g>
  );
};
export const Lamp: React.FC<{ t: number; s?: number; on?: number; ink?: string }> = ({ t, s = 1, on = 1, ink = "#140C08" }) => (
  <g transform={`scale(${s})`}>
    <path d="M-70,0 C-70,-34 40,-40 70,-14 L118,-6 C126,-4 126,8 118,10 L66,14 C40,40 -70,36 -70,0 Z" fill={ink} />
    <circle cx={-6} cy={-6} r={10} fill="none" stroke={GOLD} strokeWidth={4} opacity={0.6} />
    <path d="M-70,0 C-96,-6 -104,-34 -84,-42" fill="none" stroke={ink} strokeWidth={10} strokeLinecap="round" />
    <g transform="translate(116 -8)"><Flame t={t} s={0.55} on={on} /></g>
  </g>
);
// a pool of warm light around a point
export const Glow: React.FC<{ x: number; y: number; r: number; o?: number; c?: string; id: string }> = ({ x, y, r, o = 1, c = GOLD, id }) => (
  <>
    <defs><radialGradient id={id}><stop offset="0" stopColor={c} stopOpacity={0.55 * o} /><stop offset="0.45" stopColor={c} stopOpacity={0.18 * o} /><stop offset="1" stopColor={c} stopOpacity={0} /></radialGradient></defs>
    <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
  </>
);
// light rays turning slowly behind something
export const Rays: React.FC<{ x: number; y: number; r: number; n?: number; t: number; c?: string; o?: number }> = ({ x, y, r, n = 18, t, c = GOLD, o = 0.18 }) => (
  <g transform={`translate(${x} ${y}) rotate(${t * 8})`} opacity={o}>
    {Array.from({ length: n }, (_, i) => <polygon key={i} points={`0,0 ${r * Math.cos(0.07)},${r * Math.sin(0.07)} ${r * Math.cos(-0.07)},${r * Math.sin(-0.07)}`} fill={c} transform={`rotate(${(360 / n) * i})`} />)}
  </g>
);

// ───────────── type
type Anchor = "left" | "center" | "right";
const tx = (a: Anchor) => (a === "left" ? "0%" : a === "center" ? "-50%" : "-100%");
// a line of serif type: characters rise out of a mask one after another, and leave as a block
export const Line: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; color: string; anchor?: Anchor;
  font?: string; weight?: number; stagger?: number; tracking?: number; italic?: boolean; glow?: string }> = ({ t, at, out, text, x, y, size, color, anchor = "left", font = SERIF, weight = 900, stagger = 0.028, tracking = 0, italic, glow }) => {
  if (t < at || t >= out) return null;
  const o = 1 - eIn(range(t, out - 0.2, out)), lift = eIn(range(t, out - 0.2, out)) * -size * 0.3;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(${tx(anchor)}, ${lift}px)`, display: "flex", whiteSpace: "pre", fontFamily: font, fontWeight: weight,
      fontSize: size, color, lineHeight: 1.12, opacity: o, letterSpacing: tracking, fontStyle: italic ? "italic" : "normal", textShadow: glow ? `0 0 ${size * 0.5}px ${glow}` : undefined }}>
      {Array.from(text).map((ch, i) => {
        const k = eOut(range(t, at + i * stagger, at + i * stagger + 0.32));
        return <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}>
          <span style={{ display: "inline-block", transform: `translateY(${(1 - k) * 105}%)` }}>{ch}</span></span>;
      })}
    </div>
  );
};
// a small label in a box (filled or outlined) that slides in from the left
export const Tag: React.FC<{ t: number; at: number; out: number; text: React.ReactNode; x: number; y: number; size?: number; bg?: string; fg?: string; anchor?: Anchor; border?: string; rot?: number }> = ({ t, at, out, text, x, y, size = 30, bg = GOLD, fg = "#140C08", anchor = "left", border, rot = 0 }) => {
  if (t < at || t >= out) return null;
  const k = backOut(range(t, at, at + 0.3), 1.6), o = 1 - eIn(range(t, out - 0.2, out));
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx(anchor)}) rotate(${rot}deg) scaleX(${clamp01(k)})`, transformOrigin: anchor === "right" ? "right center" : anchor === "center" ? "center" : "left center",
      opacity: o, background: bg, color: fg, fontFamily: SANS, fontWeight: 900, fontSize: size, padding: `${size * 0.18}px ${size * 0.5}px`, whiteSpace: "nowrap", border, lineHeight: 1.2 }}>
      <span style={{ opacity: clamp01(k * 2 - 0.6) }}>{text}</span>
    </div>
  );
};

// ───────────── the section header: a Roman numeral, the school's name, its Latin/Greek name, and a hairline
export const Header: React.FC<{ t: number }> = ({ t }) => {
  const s = SEC.find((x) => t >= x.t - 0.02 && t < x.out);
  if (!s) return null;
  const k = eOut(range(t, s.t, s.t + 0.45)), o = (1 - eIn(range(t, s.out - 0.25, s.out))) * (s.id === "cynic" ? 1 - eIn(range(t, PJ.cynic.split - 0.1, PJ.cynic.split + 0.2)) : 1);
  const ink = s.ink;
  return (
    <div style={{ position: "absolute", left: 72, top: 44, opacity: o, color: ink }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
        <span style={{ fontFamily: LATIN, fontWeight: 700, fontSize: 92, lineHeight: 0.9, transform: `translateY(${(1 - k) * 30}px)`, display: "inline-block", opacity: k }}>{s.n}</span>
        <span style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 52, letterSpacing: 4, overflow: "hidden", display: "inline-block" }}>
          {Array.from(s.name).map((ch, i) => { const kk = eOut(range(t, s.t + 0.08 + i * 0.05, s.t + 0.38 + i * 0.05)); return <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - kk) * 110}%)` }}>{ch}</span>; })}
        </span>
      </div>
      <div style={{ height: 2, width: 420 * k, background: ink, opacity: 0.6, margin: "10px 0 8px" }} />
      <div style={{ fontFamily: LATIN, fontWeight: 600, fontStyle: "italic", fontSize: 26, letterSpacing: 6, opacity: 0.8 * k }}>{s.en}</div>
    </div>
  );
};

// ───────────── the ruler: 2400 years along the bottom; the lamp is the playhead; visited thinkers stay lit
const MARKS = [-400, -350, 1800, 1850, 1900, 1950, 2000];
export const Ruler: React.FC<{ t: number; ink: string }> = ({ t, ink }) => {
  const vis = clamp01(range(t, 6.2, 6.8)) * (1 - eInOut(range(t, PJ.end.lamp - 0.3, PJ.end.lamp))) + eOut(range(t, PJ.end.title, PJ.end.title + 0.5)) * 0;
  if (vis <= 0) return null;
  const p = playYear(t);
  const lit = SEC.filter((s) => t >= s.t);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: vis, pointerEvents: "none" }}>
      <line x1={150} y1={RULER_Y} x2={560} y2={RULER_Y} stroke={ink} strokeWidth={2} opacity={0.55} />
      <line x1={700} y1={RULER_Y} x2={1770} y2={RULER_Y} stroke={ink} strokeWidth={2} opacity={0.55} />
      <text x={630} y={RULER_Y + 8} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={18} fill={ink} opacity={0.55}>≈ 2000 年</text>
      <path d={`M576,${RULER_Y} q8,-8 16,0 t16,0 t16,0 M652,${RULER_Y} q8,-8 16,0 t16,0`} fill="none" stroke={ink} strokeWidth={2} opacity={0.4} />
      {MARKS.map((y) => <g key={y}><line x1={yearX(y)} y1={RULER_Y - 6} x2={yearX(y)} y2={RULER_Y + 6} stroke={ink} strokeWidth={2} opacity={0.55} />
        <text x={yearX(y)} y={RULER_Y + 34} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={17} fill={ink} opacity={0.55}>{y < 0 ? `${-y} BC` : y}</text></g>)}
      {lit.map((s) => <circle key={s.id} cx={yearX(s.year)} cy={RULER_Y} r={6} fill={GOLD} stroke={ink} strokeWidth={2} />)}
      <g transform={`translate(${p.x} ${RULER_Y - 8})`}><Flame t={t} s={0.42} /></g>
      <text x={p.x} y={RULER_Y - 52} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={22} fill={ink} opacity={p.moving ? 0.4 : 0.95}>{p.y === 2024 ? "今天" : fmtYear(p.y)}</text>
    </svg>
  );
};

// ───────────── the iris: a scene that starts at T opens out of a circle of light at (x, y) over `dur` seconds
export const irisAt = (t: number) => {
  const I = PJ.iris.find((i) => t >= i.t - i.dur && t < i.t);
  if (!I) return null;
  const k = eInOut(range(t, I.t - I.dur, I.t));
  const R = Math.hypot(Math.max(I.x, 1920 - I.x), Math.max(I.y, 1080 - I.y)) + 40;
  return { ...I, k, r: 6 + (R - 6) * k };
};
export const Iris: React.FC<React.PropsWithChildren<{ t: number; start: number }>> = ({ t, start, children }) => {
  const I = PJ.iris.find((i) => Math.abs(i.t - start) < 1e-6);
  if (!I || t >= start) return <>{children}</>;
  const k = eInOut(range(t, start - I.dur, start)), R = Math.hypot(Math.max(I.x, 1920 - I.x), Math.max(I.y, 1080 - I.y)) + 40, r = 6 + (R - 6) * k;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, clipPath: `circle(${r}px at ${I.x}px ${I.y}px)` }}>{children}</div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <circle cx={I.x} cy={I.y} r={r} fill="none" stroke={GOLD} strokeWidth={10 + 30 * (1 - k)} opacity={0.9 * (1 - k * 0.6)} />
        <circle cx={I.x} cy={I.y} r={r + 22} fill="none" stroke={FLAME} strokeWidth={3} opacity={0.6 * (1 - k)} />
      </svg>
    </div>
  );
};

// dust drifting in the light
export const Dust: React.FC<{ t: number; c?: string; n?: number; o?: number }> = ({ t, c = FLAME, n = 40, o = 0.5 }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    {Array.from({ length: n }, (_, i) => {
      const x = (rnd(i) * 1920 + t * (8 + rnd(i + 1) * 20)) % 1920, y = (rnd(i + 7) * 1080 - t * (6 + rnd(i + 2) * 14) + 2000) % 1080;
      return <circle key={i} cx={x} cy={y} r={1 + rnd(i + 3) * 2.2} fill={c} opacity={o * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + i)))} />;
    })}
  </svg>
);
export const inkFor = (bg: string) => (isDark(bg) ? "#F6EEDC" : "#140C08");
