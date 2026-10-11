// Shared pieces for the optogenetics vertical: section wipes, captions, and the recurring drawings (mouse, neuron, membrane, alga, scope).
import React from "react";
import { Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { C, clamp01, eIn, eOut, FONT_CN, FONT_UI, lerp, range, useT } from "../theme";
import J from "./opto.json";

export const VW = 1080, VH = 1920, FPS = J.fps, X = 0.3;
export const Q = J.cues;
export type Sec = (typeof J.sections)[number];
export const SEC = Object.fromEntries(J.sections.map(s => [s.id, s])) as Record<string, Sec>;
export const BLUE = "#3D7BFF", GLOW = "#7FB2FF", AMBER = "#FFB000", ALGA = "#7ED957";

export const Abs: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <div style={{ position: "absolute", inset: 0, ...style }}>{children}</div>;
export const hash = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
export const mix = (a: string, b: string, k: number) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp01(k)))).join(",")})`; };
export const Svg: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <svg width={VW} height={VH} style={{ position: "absolute", inset: 0, ...style }}>{children}</svg>;

export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={VW} height={VH} style={{ position: "absolute", inset: 0, opacity: 0.07, mixBlendMode: "overlay", zIndex: 100 }}>
      <filter id="go"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 12} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#go)" />
    </svg>
  );
};
export const Dots: React.FC<{ color: string; opacity?: number }> = ({ color, opacity = 0.12 }) => {
  const t = useT(), off = (t * 16) % 44;
  return (
    <svg width={VW} height={VH} style={{ position: "absolute", inset: 0, opacity }}>
      <defs><pattern id={"od" + color.slice(1)} width={44} height={44} patternUnits="userSpaceOnUse" patternTransform={`translate(${off} ${off})`}><circle cx={5} cy={5} r={3} fill={color} /></pattern></defs>
      <rect width="100%" height="100%" fill={`url(#od${color.slice(1)})`} />
    </svg>
  );
};
export const Progress: React.FC = () => {
  const { fps } = useVideoConfig(), t = useCurrentFrame() / fps;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 70, display: "flex", gap: 8, zIndex: 90 }}>
      {J.sections.map(s => (
        <div key={s.id} style={{ flex: s.end - s.start, height: 8, borderRadius: 4, background: "rgba(120,120,120,0.35)", overflow: "hidden", boxShadow: "0 0 0 2px rgba(0,0,0,0.12)" }}>
          <div style={{ width: `${range(t, s.start, s.end) * 100}%`, height: "100%", background: "#FFFFFF" }} />
        </div>
      ))}
    </div>
  );
};
// a section: a diagonal colour slab wipes in over the previous one, then the content starts at its nominal time
export const Section: React.FC<React.PropsWithChildren<{ s: Sec; first?: boolean }>> = ({ s, first, children }) => {
  const from = first ? s.start : s.start - X;
  return (
    <Sequence name={s.id} from={Math.round(from * FPS)} durationInFrames={Math.round((s.end - from) * FPS)}>
      <WipeIn bg={s.bg} skip={first}>
        <Sequence from={first ? 0 : Math.round(X * FPS)} layout="none">{children}</Sequence>
      </WipeIn>
    </Sequence>
  );
};
const WipeIn: React.FC<React.PropsWithChildren<{ bg: string; skip?: boolean }>> = ({ bg, skip, children }) => {
  const w = skip ? 1 : eOut(range(useT(), 0, X));
  return <Abs style={{ clipPath: `polygon(0 ${(1 - w) * 110}%, 100% ${(1 - w) * 110 - 8}%, 100% 100%, 0 100%)`, background: bg, overflow: "hidden" }}>{children}</Abs>;
};
// a caption revealed by a sliding mask; `\n` breaks lines
export const Say: React.FC<{ at: number; out?: number; text: string; sub?: string; color: string; y: number; size?: number; center?: boolean; weight?: number; x?: number }> = ({
  at, out = 99, text, sub, color, y, size = 56, center, weight = 900, x = 70,
}) => {
  const t = useT();
  if (t < at - 0.05 || t > out + 0.4) return null;
  const a = eOut(range(t, at, at + 0.45)), e = eIn(range(t, out, out + 0.3));
  return (
    <div style={{ position: "absolute", left: x, right: 100, top: y, opacity: 1 - e, translate: `0px ${(1 - a) * 30 - e * 20}px`, textAlign: center ? "center" : "left" }}>
      <div style={{ fontFamily: FONT_CN, fontWeight: weight, fontSize: size, color, lineHeight: 1.3, whiteSpace: "pre-line", clipPath: `inset(-20% ${(1 - a) * 100}% -20% 0)` }}>{text}</div>
      {sub && <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: Math.max(24, size * 0.5), letterSpacing: 3, color, opacity: 0.7 * a, marginTop: 10 }}>{sub}</div>}
    </div>
  );
};
export const Burst: React.FC<{ x: number; y: number; at: number; t: number; color: string; r?: number; w?: number }> = ({ x, y, at, t, color, r = 90, w = 6 }) => {
  const p = range(t, at, at + 0.55);
  if (p <= 0 || p >= 1) return null;
  return <circle cx={x} cy={y} r={10 + r * eOut(p)} fill="none" stroke={color} strokeWidth={w * (1 - p) + 1} opacity={1 - p} />;
};
export const Pill: React.FC<{ children: React.ReactNode; bg: string; color: string; size?: number; style?: React.CSSProperties }> = ({ children, bg, color, size = 40, style }) => (
  <div style={{ display: "inline-block", fontFamily: FONT_CN, fontWeight: 900, fontSize: size, color, background: bg, padding: `${size * 0.3}px ${size * 0.8}px`, borderRadius: size, lineHeight: 1.15, ...style }}>{children}</div>
);

// ───────────── top-down mouse; heading 0 = facing up. `glow` lights the fibre implant.
export const Mouse: React.FC<{ x: number; y: number; a: number; s?: number; glow?: number; opacity?: number }> = ({ x, y, a, s = 1, glow = 0, opacity = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`} opacity={opacity}>
    <path d="M0 105 C 30 160, -40 200, 10 260" stroke="#F2A7B8" strokeWidth={9} fill="none" strokeLinecap="round" />
    <ellipse cx={0} cy={25} rx={62} ry={92} fill="#E9E7F2" stroke={C.ink} strokeWidth={5} />
    <circle cx={-36} cy={-100} r={22} fill="#F7B6C8" stroke={C.ink} strokeWidth={4} />
    <circle cx={36} cy={-100} r={22} fill="#F7B6C8" stroke={C.ink} strokeWidth={4} />
    <ellipse cx={0} cy={-80} rx={42} ry={54} fill="#E9E7F2" stroke={C.ink} strokeWidth={5} />
    <circle cx={0} cy={-132} r={7} fill="#F27A9B" />
    <circle cx={-16} cy={-98} r={5} fill={C.ink} /><circle cx={16} cy={-98} r={5} fill={C.ink} />
    {glow > 0 && <circle cx={0} cy={-70} r={30 + 40 * glow} fill={GLOW} opacity={0.55 * glow} />}
    <circle cx={0} cy={-70} r={14} fill={glow > 0.2 ? "#DDEBFF" : "#9AA0B5"} stroke={C.ink} strokeWidth={4} />
  </g>
);
// where the implant sits in world space, for attaching the fibre
export const implantAt = (x: number, y: number, a: number, s = 1): [number, number] => {
  const r = (a * Math.PI) / 180;
  return [x + Math.sin(r) * 70 * s, y - Math.cos(r) * 70 * s];
};

// ───────────── neuron: soma + dendrites + axon; `spike` 0..1 runs a pulse down the axon
export const Neuron: React.FC<{ x: number; y: number; s?: number; color: string; ink?: string; spike?: number; glow?: string; glowK?: number }> = ({ x, y, s = 1, color, ink = C.ink, spike = -1, glow, glowK = 0 }) => {
  const ax = (k: number) => [x + (60 + 520 * k) * s, y + Math.sin(k * 3.2) * 26 * s] as const;
  const pts = [...Array(30)].map((_, i) => ax(i / 29));
  return (
    <g>
      {[[-1, -0.9], [-1.2, 0.3], [-0.5, 1.1], [0.2, -1.2], [-0.2, 1.3]].map(([dx, dy], i) => (
        <path key={i} d={`M${x} ${y} L${x + dx * 110 * s} ${y + dy * 90 * s} M${x + dx * 80 * s} ${y + dy * 65 * s} L${x + (dx * 110 + 40) * s} ${y + (dy * 90 - 30) * s}`} stroke={ink} strokeWidth={9 * s} strokeLinecap="round" fill="none" />
      ))}
      <polyline points={pts.map(p => p.join(",")).join(" ")} stroke={ink} strokeWidth={11 * s} fill="none" strokeLinecap="round" />
      {[0.2, 0.4, 0.6, 0.8].map(k => { const [px, py] = ax(k); return <rect key={k} x={px - 28 * s} y={py - 12 * s} width={56 * s} height={24 * s} rx={12 * s} fill={color} stroke={ink} strokeWidth={4 * s} />; })}
      {glow && glowK > 0 && <circle cx={x} cy={y} r={95 * s} fill={glow} opacity={0.5 * glowK} />}
      <circle cx={x} cy={y} r={62 * s} fill={color} stroke={ink} strokeWidth={8 * s} />
      <circle cx={x - 8 * s} cy={y - 6 * s} r={20 * s} fill={ink} opacity={0.25} />
      {spike >= 0 && spike <= 1 && (() => { const [px, py] = ax(spike); return <circle cx={px} cy={py} r={22 * s} fill="#FFFFFF" stroke={ink} strokeWidth={4 * s} />; })()}
    </g>
  );
};

// ───────────── lipid bilayer with a two-part gate in the middle; ions stream through when open
export const Membrane: React.FC<{ x0: number; x1: number; y: number; open: number; gate: string; ink?: string; t: number; ion?: string; lipid?: string; flow?: number }> = ({
  x0, x1, y, open, gate, ink = C.ink, t, ion = C.orange, lipid = "#FFFFFF", flow = 1,
}) => {
  const cx = (x0 + x1) / 2, gap = 10 + 46 * open, n = Math.floor((x1 - x0) / 40);
  return (
    <g>
      {[...Array(n)].map((_, i) => { const lx = x0 + 20 + i * 40; if (Math.abs(lx - cx) < 75) return null; return (
        <g key={i}>
          <circle cx={lx} cy={y - 26} r={16} fill={lipid} stroke={ink} strokeWidth={3} />
          <circle cx={lx} cy={y + 26} r={16} fill={lipid} stroke={ink} strokeWidth={3} />
          <line x1={lx - 5} y1={y - 10} x2={lx - 5} y2={y + 10} stroke={ink} strokeWidth={2} /><line x1={lx + 5} y1={y - 10} x2={lx + 5} y2={y + 10} stroke={ink} strokeWidth={2} />
        </g>
      ); })}
      <rect x={cx - gap / 2 - 50} y={y - 62} width={50} height={124} rx={20} fill={gate} stroke={ink} strokeWidth={5} />
      <rect x={cx + gap / 2} y={y - 62} width={50} height={124} rx={20} fill={gate} stroke={ink} strokeWidth={5} />
      {open > 0.2 && [...Array(9)].map((_, i) => { const ph = (t * 1.4 * flow + i / 9) % 1, iy = y - 170 + ph * 340; return (
        <g key={i} opacity={clamp01((open - 0.2) * 2) * (ph > 0.92 ? (1 - ph) / 0.08 : 1)}>
          <circle cx={cx + Math.sin(i * 2.3) * 9} cy={iy} r={15} fill={ion} stroke={ink} strokeWidth={3} />
          <text x={cx + Math.sin(i * 2.3) * 9} y={iy + 7} textAnchor="middle" fontFamily={FONT_UI} fontWeight={700} fontSize={20} fill={ink}>+</text>
        </g>
      ); })}
    </g>
  );
};

// ───────────── Chlamydomonas: oval green cell, cup chloroplast, red eyespot, two beating flagella
export const Alga: React.FC<{ x: number; y: number; s?: number; rot?: number; t: number; eye?: number }> = ({ x, y, s = 1, rot = 0, t, eye = 0 }) => {
  const beat = Math.sin(t * 14);
  const fl = (side: number) => `M${side * 18} -138 C ${side * (60 + 30 * beat)} -220, ${side * (130 - 20 * beat)} -200, ${side * (150 + 40 * beat)} -300`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d={fl(1)} stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d={fl(-1)} stroke={C.ink} strokeWidth={6} fill="none" strokeLinecap="round" />
      <ellipse cx={0} cy={0} rx={115} ry={145} fill="#C9F27A" stroke={C.ink} strokeWidth={7} />
      <path d="M-100 -40 C -100 120, 100 120, 100 -40 C 70 60, -70 60, -100 -40 Z" fill={ALGA} stroke={C.ink} strokeWidth={4} />
      <circle cx={0} cy={-40} r={34} fill="#F5F1E8" stroke={C.ink} strokeWidth={4} />
      {eye > 0 && <circle cx={-92} cy={-30} r={30 + 26 * eye} fill="#FF2E3B" opacity={0.3 * eye} />}
      <ellipse cx={-92} cy={-30} rx={14} ry={24} fill="#FF2E3B" stroke={C.ink} strokeWidth={3} />
    </g>
  );
};

// ───────────── an oscilloscope: light pulses on top, membrane voltage below; a cursor sweeps left → right
export const spikeV = (dt: number) => (dt < 0 ? 0 : dt < 0.012 ? dt / 0.012 : dt < 0.03 ? 1 - ((dt - 0.012) / 0.018) * 1.25 : -0.25 * Math.exp(-(dt - 0.03) / 0.08));
export const Scope: React.FC<{ x: number; y: number; w: number; h: number; t: number; t0: number; t1: number; pulses: number[]; light: string; spikes?: number[]; span?: [number, number]; ink?: string; bg?: string }> = ({
  x, y, w, h, t, t0, t1, pulses, light, spikes = pulses, span, ink = C.ink, bg = "#FFFFFF",
}) => {
  const tx = (tt: number) => x + 30 + ((tt - t0) / (t1 - t0)) * (w - 60);
  const base = y + h * 0.72, amp = h * 0.42;
  const cur = Math.min(t, t1);
  const N = 240, pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const tt = t0 + (i / N) * (t1 - t0);
    if (tt > cur) break;
    let v = 0;
    for (const p of spikes) v += spikeV(tt - p - 0.004);
    v += 0.02 * Math.sin(tt * 90);
    pts.push(`${tx(tt).toFixed(1)},${(base - v * amp).toFixed(1)}`);
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={26} fill={bg} stroke={ink} strokeWidth={5} />
      {pulses.map((p, i) => p <= cur && <rect key={i} x={tx(p) - 9} y={y + 22} width={18} height={h * 0.16} rx={6} fill={light} />)}
      {span && cur > span[0] && <rect x={tx(span[0])} y={y + 22} width={tx(Math.min(cur, span[1])) - tx(span[0])} height={h * 0.16} rx={6} fill={light} />}
      <line x1={x + 30} y1={base} x2={x + w - 30} y2={base} stroke={ink} strokeWidth={2} strokeDasharray="6 10" opacity={0.35} />
      <polyline points={pts.join(" ")} stroke={ink} strokeWidth={5} fill="none" strokeLinejoin="round" />
      {t < t1 && t > t0 && <line x1={tx(cur)} y1={y + 14} x2={tx(cur)} y2={y + h - 14} stroke={light} strokeWidth={3} opacity={0.6} />}
    </g>
  );
};
