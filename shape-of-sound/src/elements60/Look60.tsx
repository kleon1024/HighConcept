// The graphic layer: colour fields with diagonal sweeps, beat-kicked superflat geometry, a starfield, chapter headers.
import React from "react";
import { P, backOut, clamp01, eInOut, eOut, isDark, range, rnd, shade, win } from "../elements/core";
import { LENS, T6, WIPE6, bg6, bgCol6, cam6, lensAt } from "./core60";

export const FONT_CN = "'Noto Sans SC', sans-serif";
export const FONT_SYM = "'Space Grotesk', 'Noto Sans SC', sans-serif";
export const FONT_BIG = "'Archivo Black', 'Noto Sans SC', sans-serif";
export const inkOn = (t: number) => (isDark(bgCol6(t)) ? "#FFFFFF" : P.ink);

export const Background6: React.FC<{ t: number }> = ({ t }) => {
  const b = bg6(t);
  const k = eInOut(b.k);
  const X = -560 + (1920 + 1120) * k, slant = 560;
  return (
    <div style={{ position: "absolute", inset: 0, background: b.prev }}>
      {b.k > 0 && b.k < 1 && (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <polygon points={`-700,0 ${X},0 ${X - slant},1080 -700,1080`} fill={b.c} />
          <polygon points={`${X},0 ${X + 60},0 ${X + 60 - slant},1080 ${X - slant},1080`} fill={isDark(b.c) ? "#FFD23F" : P.ink} />
          <polygon points={`${X + 90},0 ${X + 104},0 ${X + 104 - slant},1080 ${X + 90 - slant},1080`} fill={isDark(b.c) ? "#FFD23F" : P.ink} opacity={0.6} />
        </svg>
      )}
      {b.k >= 1 && <div style={{ position: "absolute", inset: 0, background: b.c }} />}
    </div>
  );
};

// superflat shapes drifting behind the table; every beat kicks them, every bar spins them a little
export const Geometry6: React.FC<{ t: number }> = ({ t }) => {
  const vis = win(t, 7.8, 41.0, 0.4, 0.3) + win(t, 56.4, 61, 0.4, 0.1);
  if (vis <= 0) return null;
  const bg = bgCol6(t), dark = isDark(bg);
  const beat = Math.exp(-((t % 0.5) / 0.1)), bar = eInOut(clamp01((t % 2) / 0.35));
  const tone = dark ? "rgba(255,255,255,0.08)" : shade(bg, 0.88);
  const accents = ["#FF5B4F", "#FFD23F", "#2D5BFF", "#00D9A3", "#FF6FB1", "#FFFFFF"];
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: vis }}>
      {Array.from({ length: 18 }, (_, i) => {
        const x = ((rnd(i) * 2300 + t * (30 + rnd(i + 3) * 60)) % 2300) - 190, y = rnd(i + 40) * 1080 + Math.sin(t * 0.9 + i) * 40;
        const r = 24 + rnd(i + 9) * 80, rot = t * (rnd(i + 5) - 0.5) * 70 + i * 30 + Math.floor(t / 2) * 45 * (i % 2 ? 1 : -1) + bar * 45 * (i % 2 ? 1 : -1);
        const acc = i % 4 === 0, col = acc ? accents[i % accents.length] : tone;
        const sc = 1 + (acc ? 0.18 : 0.07) * beat;
        const kind = i % 5;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`} opacity={acc ? (dark ? 0.8 : 0.9) : 1}>
            {kind === 0 && <circle r={acc ? r * 0.32 : r} fill={col} />}
            {kind === 1 && <polygon points={`0,${-r} ${r * 0.87},${r * 0.5} ${-r * 0.87},${r * 0.5}`} fill={acc ? "none" : col} stroke={acc ? col : "none"} strokeWidth={9} />}
            {kind === 2 && <rect x={-r * 0.6} y={-r * 0.6} width={r * 1.2} height={r * 1.2} fill={col} />}
            {kind === 3 && <circle r={r * 0.7} fill="none" stroke={col} strokeWidth={acc ? 8 : 18} />}
            {kind === 4 && <path d={`M${-r},0 L${r},0 M0,${-r} L0,${r}`} stroke={col} strokeWidth={acc ? 10 : 20} strokeLinecap="round" />}
          </g>
        );
      })}
    </svg>
  );
};

// a starfield for the cosmos and the ending; it zooms with the camera so the zoom-out feels like leaving the Earth
export const Stars6: React.FC<{ t: number }> = ({ t }) => {
  const C = T6.cosmos, EN = T6.end;
  const vis = win(t, C.off - 0.2, EN.back[0] + 0.5, 0.6, 0.5);
  if (vis <= 0) return null;
  const z = cam6(t).z, sc = Math.pow(z / 66, 0.55);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: vis }}>
      {Array.from({ length: 260 }, (_, i) => {
        const x = 960 + (rnd(i) * 2 - 1) * 1300 * sc, y = 540 + (rnd(i + 500) * 2 - 1) * 800 * sc;
        if (x < -10 || x > 1930 || y < -10 || y > 1090) return null;
        const r = (0.6 + rnd(i + 900) * 1.8) * (i % 23 === 0 ? 2.2 : 1);
        const tw = 0.45 + 0.55 * Math.abs(Math.sin(t * (1 + rnd(i + 3) * 3) + i));
        return <circle key={i} cx={x} cy={y} r={r} fill={i % 17 === 0 ? "#FFD23F" : i % 11 === 0 ? "#9FE8FF" : "#FFFFFF"} opacity={tw * 0.85} />;
      })}
    </svg>
  );
};

// chapter headers top-left, like "01 声音=振动" in 声音的形状; in chapter 02 a counter shows which surprise we're on
const CH = [
  { t: 8.0, out: 18.0, n: "01", name: "怎么读", en: "HOW TO READ IT" },
  { t: 18.0, out: 41.0, n: "02", name: "反常识", en: "NINE SURPRISES" },
  { t: 41.0, out: 50.0, n: "03", name: "产地", en: "WHERE IT WAS MADE" },
];
export const Header6: React.FC<{ t: number }> = ({ t }) => {
  const c = CH.find((x) => t >= x.t - 0.05 && t < x.out);
  if (!c) return null;
  const k = backOut(range(t, c.t, c.t + 0.4), 1.8), out = 1 - eInOut(range(t, c.out - 0.3, c.out));
  const ink = inkOn(t);
  const li = lensAt(t);
  return (
    <div style={{ position: "absolute", left: 56, top: 36, display: "flex", alignItems: "flex-end", gap: 14, opacity: out }}>
      <div style={{ fontFamily: FONT_BIG, fontSize: 84, color: ink, lineHeight: 0.9, transform: `scale(${0.4 + 0.6 * k})`, transformOrigin: "left bottom" }}>{c.n}</div>
      <div style={{ display: "flex", flexDirection: "column", paddingBottom: 4 }}>
        <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 36, color: ink, lineHeight: 1.1, display: "flex", alignItems: "baseline", gap: 12 }}>
          <span>{Array.from(c.name).map((ch, i) => { const kk = eOut(range(t, c.t + 0.1 + i * 0.05, c.t + 0.35 + i * 0.05)); return <span key={i} style={{ display: "inline-block", opacity: kk, transform: `translateY(${(1 - kk) * 20}px)` }}>{ch}</span>; })}</span>
          {c.n === "02" && li >= 0 && (
            <span style={{ fontFamily: FONT_SYM, fontWeight: 700, fontSize: 30, color: ink, opacity: 0.9 }}>
              <span style={{ display: "inline-block", transform: `scale(${1 + 0.35 * Math.exp(-(t - LENS[li].t) / 0.15)})` }}>{li + 1}</span>/9
            </span>
          )}
        </div>
        <div style={{ fontFamily: FONT_SYM, fontWeight: 700, fontSize: 15, letterSpacing: 2.5, color: ink, opacity: 0.7 * eOut(range(t, c.t + 0.3, c.t + 0.6)) }}>{c.en}</div>
      </div>
    </div>
  );
};

export { WIPE6 };
