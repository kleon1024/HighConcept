import "@fontsource/noto-sans-sc/900.css";
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/archivo-black/400.css";
import React from "react";
import { Easing, spring, useCurrentFrame, useVideoConfig } from "remotion";
import T from "./timeline.json";

export const TL = T;
export const W = 1920;
export const H = 1080;

export const C = {
  ink: "#0E0E12",
  paper: "#F5F1E8",
  yellow: "#FFD23F",
  pink: "#FF3D7F",
  blue: "#2D5BFF",
  mint: "#00D9A3",
  orange: "#FF6B2C",
  violet: "#6C3CFF",
  red: "#FF2E3B",
  cyan: "#00E5FF",
};
export const CHAPTER = [C.yellow, C.pink, C.blue, C.mint, C.orange, C.violet];

export const FONT_CN = "'Noto Sans SC', sans-serif";
export const FONT_EN = "'Archivo Black', 'Noto Sans SC', sans-serif";
export const FONT_UI = "'Space Grotesk', 'Noto Sans SC', sans-serif";

export const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

// local time in seconds inside the current <Sequence>
export const useT = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const range = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
const inCubic = Easing.bezier(0.55, 0, 1, 0.45);
export const eOut = (x: number) => outExpo(clamp01(x));
export const eIn = (x: number) => inCubic(clamp01(x));
export const eInOut = (x: number) => Easing.bezier(0.65, 0, 0.35, 1)(clamp01(x));

// spring that starts at time `at` (seconds); overshoots then settles
export const useSpring = () => {
  const { fps } = useVideoConfig();
  const t = useT();
  return (at: number, cfg: { damping?: number; stiffness?: number; mass?: number } = {}) =>
    spring({ frame: Math.max(0, (t - at) * fps), fps, config: { damping: 11, stiffness: 140, mass: 0.7, ...cfg } });
};

// pulse 1 → 0 after each time in `times`
export const pulse = (t: number, times: number[], decay = 0.18) => {
  let last = -1e9;
  for (const x of times) if (x <= t) last = x;
  return Math.exp(-(t - last) / decay);
};

export const Abs: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => (
  <div style={{ position: "absolute", inset: 0, ...style }}>{children}</div>
);

// ───────────── kinetic type: characters spring up with a stagger
export const Kinetic: React.FC<{
  text: string; at: number; size: number; color: string; font?: string; stagger?: number; weight?: number;
  out?: number; style?: React.CSSProperties; tracking?: number;
}> = ({ text, at, size, color, font = FONT_CN, stagger = 0.04, weight = 900, out, style, tracking = 0 }) => {
  const t = useT();
  const sp = useSpring();
  const exit = out === undefined ? 0 : eIn(range(t, out, out + 0.35));
  return (
    <div style={{ display: "flex", fontFamily: font, fontWeight: weight, fontSize: size, color, lineHeight: 1.05, letterSpacing: tracking, ...style }}>
      {Array.from(text).map((ch, i) => {
        const s = sp(at + i * stagger);
        return (
          <span key={i} style={{ display: "inline-block", whiteSpace: "pre", opacity: clamp01(s * 3) * (1 - exit),
            translate: `0px ${lerp(size * 0.6, 0, s) + exit * -size * 0.4}px`, scale: `${lerp(0.6, 1, Math.min(1.2, s))}` }}>
            {ch}
          </span>
        );
      })}
    </div>
  );
};

// ───────────── caption block: big line + small English line, revealed by a sliding mask
export const Caption: React.FC<{ at: number; out: number; big: string; small?: string; color?: string; x?: number; y?: number; size?: number; align?: "left" | "center" }> = ({
  at, out, big, small, color = C.ink, x = 110, y = 840, size = 76, align = "left",
}) => {
  const t = useT();
  if (t < at - 0.05 || t > out + 0.5) return null;
  const a = eOut(range(t, at, at + 0.5)), e = eIn(range(t, out, out + 0.35));
  const style: React.CSSProperties = align === "center" ? { left: 0, right: 0, textAlign: "center", top: y } : { left: x, top: y };
  return (
    <div style={{ position: "absolute", ...style, opacity: 1 - e, translate: `0px ${(1 - a) * 40 - e * 30}px` }}>
      <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: size, color, clipPath: `inset(0 ${(1 - a) * 100}% 0 0)`, lineHeight: 1.15 }}>{big}</div>
      {small && <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: size * 0.42, letterSpacing: 3, color, opacity: 0.75 * a, marginTop: 10 }}>{small}</div>}
    </div>
  );
};

// ───────────── chapter opening: an ink panel sweeps off revealing the chapter colour; the header lands top-left
export const ChapterHead: React.FC<{ n: string; title: string; en: string; color: string; ink?: string }> = ({ n, title, en, color, ink = C.ink }) => {
  const t = useT();
  const land = eInOut(range(t, 0.45, 0.9));
  const big = lerp(1, 0.32, land);
  return (
    <>
      <Abs style={{ background: color }} />
      <DotGrid color={ink} />
      {[C.ink, ...CHAPTER.filter(c => c !== color).slice(0, 2)].map((c, k) => {
        const sw = eInOut(range(t, k * 0.07, 0.45 + k * 0.07));
        return <Abs key={k} style={{ background: c, translate: `${sw * 125}% 0px`, transform: "skewX(-12deg)", left: "-15%", right: "-15%", zIndex: 52 - k }} />;
      })}
      <div style={{ position: "absolute", left: lerp(160, 110, land), top: lerp(250, 70, land), transformOrigin: "0 0", scale: `${big}`, zIndex: 40, display: "flex", alignItems: "flex-end", gap: 40 }}>
        <div style={{ fontFamily: FONT_EN, fontSize: 380, color: ink, lineHeight: 0.8 }}>{n}</div>
        <div>
          <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 150, color: ink, lineHeight: 1 }}>{title}</div>
          <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 52, color: ink, letterSpacing: 8, marginTop: 14 }}>{en}</div>
        </div>
      </div>
    </>
  );
};

// ───────────── film grain (deterministic per frame)
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "overlay", pointerEvents: "none", zIndex: 100 }}>
      <filter id="g">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 12} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#g)" />
    </svg>
  );
};

// a small mono annotation tag ("f = 440 Hz")
export const Tag: React.FC<{ children: React.ReactNode; x: number; y: number; color?: string; size?: number; opacity?: number }> = ({ children, x, y, color = C.ink, size = 34, opacity = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, fontFamily: FONT_UI, fontWeight: 700, fontSize: size, color, letterSpacing: 2, opacity }}>{children}</div>
);

// geometry helpers
export const polar = (cx: number, cy: number, r: number, i: number, n = 12) => {
  const a = (i / n) * Math.PI * 2 - Math.PI / 2;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
};
export const pts = (p: ReadonlyArray<readonly [number, number]>) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

// slowly drifting dot grid: texture for every chapter background
export const DotGrid: React.FC<{ color: string; opacity?: number }> = ({ color, opacity = 0.12 }) => {
  const t = useT();
  const off = (t * 18) % 48;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity }}>
      <defs>
        <pattern id={"dots" + color.replace("#", "")} width={48} height={48} patternUnits="userSpaceOnUse" patternTransform={`translate(${off} ${off * 0.5})`}>
          <circle cx={6} cy={6} r={3} fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#dots${color.replace("#", "")})`} />
    </svg>
  );
};
