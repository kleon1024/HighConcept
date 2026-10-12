// The film's graphic layer: full-screen colour fields with diagonal sweeps, beat-pulsing geometry, chapter headers,
// and giant background type (the year, the proton count, the element that is singing, the district's name).
import React from "react";
import { EL, FAM, P, T, WIPE, backOut, bgAt, bgColorAt, clamp01, eInOut, eOut, isDark, range, rnd, shade, win, yearAt } from "./core";

const FONT_CN = "'Noto Sans SC', sans-serif";
const FONT_SYM = "'Space Grotesk', 'Noto Sans SC', sans-serif";
const FONT_BIG = "'Archivo Black', 'Noto Sans SC', sans-serif";

export const Background: React.FC<{ t: number }> = ({ t }) => {
  const b = bgAt(t);
  const k = eInOut(b.k);
  const X = -500 + (1920 + 1000) * k;                       // the sweep's leading edge (top), slanted 30°
  const slant = 520;
  return (
    <div style={{ position: "absolute", inset: 0, background: b.prev }}>
      {b.k > 0 && b.k < 1 && (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <polygon points={`-600,0 ${X},0 ${X - slant},1080 -600,1080`} fill={b.c} />
          <polygon points={`${X},0 ${X + 70},0 ${X + 70 - slant},1080 ${X - slant},1080`} fill={isDark(b.c) ? "#FFD23F" : P.ink} />
        </svg>
      )}
      {b.k >= 1 && <div style={{ position: "absolute", inset: 0, background: b.c }} />}
    </div>
  );
};

// superflat geometry drifting behind everything; every beat gives it a small kick
export const Geometry: React.FC<{ t: number }> = ({ t }) => {
  const vis = win(t, 13.8, 158.2, 0.5, 0.4) + win(t, 179.6, 192.5, 0.6, 0.2);
  if (vis <= 0) return null;
  const bg = bgColorAt(t), dark = isDark(bg);
  const beat = Math.exp(-((t % 0.5) / 0.12));
  const tone = dark ? "rgba(255,255,255,0.07)" : shade(bg, 0.9);
  const accents = ["#FF5B4F", "#FFD23F", "#2D5BFF", "#00D9A3", "#FF6FB1", "#FFFFFF"];
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: vis }}>
      {Array.from({ length: 16 }, (_, i) => {
        const x = ((rnd(i) * 2200 + t * (12 + rnd(i + 3) * 26)) % 2200) - 140, y = rnd(i + 40) * 1080 + Math.sin(t * 0.6 + i) * 30;
        const r = 26 + rnd(i + 9) * 70, rot = t * (rnd(i + 5) - 0.5) * 40 + i * 30;
        const acc = i % 5 === 0, col = acc ? accents[i % accents.length] : tone;
        const sc = 1 + (acc ? 0.12 : 0.05) * beat;
        const kind = i % 4;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`} opacity={acc ? 0.85 : 1}>
            {kind === 0 && <circle r={acc ? r * 0.3 : r} fill={col} />}
            {kind === 1 && <polygon points={`0,${-r} ${r * 0.87},${r * 0.5} ${-r * 0.87},${r * 0.5}`} fill={acc ? "none" : col} stroke={acc ? col : "none"} strokeWidth={8} />}
            {kind === 2 && <rect x={-r * 0.6} y={-r * 0.6} width={r * 1.2} height={r * 1.2} fill={col} />}
            {kind === 3 && <circle r={r * 0.7} fill="none" stroke={col} strokeWidth={acc ? 7 : 16} />}
          </g>
        );
      })}
    </svg>
  );
};

// chapter headers in the top-left corner, like "01 声音=振动" in 声音的形状
const CHAPTERS = [
  { t: 18.0, out: 56.0, n: "01", name: "拼图", en: "HOW WE FOUND THEM" },
  { t: 56.0, out: 104.0, n: "02", name: "读懂这张表", en: "HOW TO READ IT" },
  { t: 104.0, out: 158.0, n: "03", name: "元素街坊", en: "THE NEIGHBOURHOODS" },
  { t: 158.0, out: 179.0, n: "04", name: "从哪里来", en: "WHERE THEY CAME FROM" },
];
export const ChapterHeader: React.FC<{ t: number }> = ({ t }) => {
  const c = CHAPTERS.find((x) => t >= x.t - 0.05 && t < x.out);
  if (!c) return null;
  const k = backOut(range(t, c.t, c.t + 0.5), 1.8), out = 1 - eInOut(range(t, c.out - 0.35, c.out));
  const ink = isDark(bgColorAt(t)) ? "#FFFFFF" : P.ink;
  return (
    <div style={{ position: "absolute", left: 56, top: 40, display: "flex", alignItems: "flex-end", gap: 14, opacity: out }}>
      <div style={{ fontFamily: FONT_BIG, fontSize: 84, color: ink, lineHeight: 0.9, transform: `scale(${0.4 + 0.6 * k})`, transformOrigin: "left bottom" }}>{c.n}</div>
      <div style={{ display: "flex", flexDirection: "column", paddingBottom: 4 }}>
        <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 36, color: ink, lineHeight: 1.1 }}>
          {Array.from(c.name).map((ch, i) => { const kk = eOut(range(t, c.t + 0.15 + i * 0.05, c.t + 0.45 + i * 0.05)); return <span key={i} style={{ display: "inline-block", opacity: kk, transform: `translateY(${(1 - kk) * 20}px)` }}>{ch}</span>; })}
        </div>
        <div style={{ fontFamily: FONT_SYM, fontWeight: 700, fontSize: 15, letterSpacing: 2.5, color: ink, opacity: 0.7 * eOut(range(t, c.t + 0.4, c.t + 0.8)) }}>{c.en}</div>
      </div>
    </div>
  );
};

// giant type behind the table
export const GiantType: React.FC<{ t: number }> = ({ t }) => {
  const bg = bgColorAt(t), dark = isDark(bg);
  const tone = dark ? "rgba(255,255,255,0.08)" : shade(bg, 0.86);
  let text = "", font = FONT_BIG, size = 420, color = tone, k = 0, x = 960, y = 600, scale = 1;
  if (t > 18.4 && t < 55.9) { text = yearAt(t); k = win(t, 18.4, 55.9, 0.4, 0.4); size = 460; y = 640; }
  else if (t > 58.8 && t < 64.2) {
    let n = 1; for (let i = 1; i <= 8; i++) if (t >= 59.4 + (i - 1) * 0.5) n = i;
    if (t > 61.8) n = Math.max(8, Math.round(8 + 110 * eInOut(range(t, 61.8, 63.6))));
    text = String(n); k = win(t, 58.8, 64.2, 0.3, 0.3); size = 620; scale = 1 + 0.06 * Math.exp(-((t - 59.4) % 0.5) / 0.15);
  } else if (t > 83 && t < 103.9) {
    let cur = EL[0]; for (const e of EL) if (e.roll <= t && e.roll > cur.roll) cur = e;
    text = cur.s; k = win(t, 83, 103.9, 0.3, 0.3); size = 700; y = 600; color = FAM[cur.fam].c;
    const d = t - cur.roll; scale = 1 + 0.12 * Math.exp(-d / 0.12);
    return (
      <div style={{ position: "absolute", left: 0, right: 0, top: y - size * 0.62, textAlign: "center", fontFamily: FONT_SYM, fontWeight: 700, fontSize: size, lineHeight: 1, color, opacity: 0.2 * k, transform: `scale(${scale})` }}>{text}</div>
    );
  } else {
    const d = (T.hood as { t: number; out: number; name: string }[]).find((h) => t >= h.t && t < h.out);
    if (d) { text = d.name.split(" ")[0]; k = win(t, d.t, d.out, 0.35, 0.35); font = FONT_CN; size = 300; x = 960 + (t - d.t) * 30; y = 700; }
  }
  if (!text || k <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x - 1400, width: 2800, top: y - size * 0.62, textAlign: "center", fontFamily: font, fontWeight: 900, fontSize: size, lineHeight: 1, color, opacity: k, transform: `scale(${scale})`, whiteSpace: "nowrap" }}>{text}</div>
  );
};

export { WIPE, clamp01 };
