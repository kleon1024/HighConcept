// Overlay UI for the periodic-table film: sticker captions, section chips, the year counter, the roll-call ticker.
import React from "react";
import { EL, FAM, P, T, backOut, clamp01, eIn, eOut, range, win, yearAt } from "./core";

export const FONT_CN = "'Noto Sans SC', sans-serif";
export const FONT_SYM = "'Space Grotesk', 'Noto Sans SC', sans-serif";
export const FONT_BIG = "'Archivo Black', 'Noto Sans SC', sans-serif";

export const Sticker: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties; bg?: string; shadow?: number; radius?: number; border?: number }>> = ({ children, style, bg = "#FFFFFF", shadow = 8, radius = 22, border = 5 }) => (
  <div style={{ background: bg, border: `${border}px solid ${P.ink}`, borderRadius: radius, boxShadow: `${shadow}px ${shadow}px 0 ${P.ink}`, ...style }}>{children}</div>
);

// characters rise in one after another
export const Chars: React.FC<{ text: string; t: number; at: number; stagger?: number }> = ({ text, t, at, stagger = 0.022 }) => (
  <>
    {Array.from(text).map((ch, i) => {
      const k = eOut(range(t, at + i * stagger, at + i * stagger + 0.28));
      return <span key={i} style={{ display: "inline-block", opacity: k, transform: `translateY(${(1 - k) * 16}px)`, whiteSpace: "pre" }}>{ch}</span>;
    })}
  </>
);

type Cap = { t: number; out: number; text: string; pos?: string; note?: string };
export const Captions: React.FC<{ t: number }> = ({ t }) => {
  const c = (T.captions as Cap[]).find((x) => t >= x.t - 0.05 && t < x.out + 0.3);
  if (!c) return null;
  const inK = backOut(range(t, c.t, c.t + 0.32), 2.2), out = eIn(range(t, c.out, c.out + 0.28));
  if (c.pos === "big") {
    return (
      <div style={{ position: "absolute", left: 0, right: 0, top: 790, display: "flex", justifyContent: "center", opacity: 1 - out }}>
        <Sticker bg="#FFD23F" style={{ padding: "6px 40px 10px", transform: `scale(${0.8 + 0.2 * inK}) rotate(${(1 - inK) * -3}deg)` }}>
          <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 104, color: P.ink }}><Chars text={c.text} t={t} at={c.t} stagger={0.045} /></div>
        </Sticker>
      </div>
    );
  }
  const top = c.pos === "low" ? 880 : 54;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", flexDirection: "column", alignItems: "center", opacity: 1 - out, transform: `translateY(${-out * 18}px)` }}>
      <Sticker style={{ padding: "16px 34px 18px", transform: `scale(${0.86 + 0.14 * inK}) rotate(${(1 - inK) * -2}deg)` }}>
        <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: Array.from(c.text).length > 18 ? 44 : 50, color: P.ink, lineHeight: 1.2 }}><Chars text={c.text} t={t} at={c.t + 0.05} /></div>
      </Sticker>
      {c.note && (
        <div style={{ marginTop: 16, fontFamily: FONT_CN, fontWeight: 700, fontSize: 26, color: P.ink, opacity: eOut(range(t, c.t + 0.5, c.t + 0.9)) * 0.8, background: "#FFD23F", padding: "4px 14px", borderRadius: 8 }}>{c.note}</div>
      )}
    </div>
  );
};

// the chapter tab in the top-left corner
export const SectionChip: React.FC<{ t: number }> = ({ t }) => {
  const s = T.sections.find((x) => "name" in x && t >= x.start && t < x.end) as { start: number; end: number; name: string; en: string } | undefined;
  if (!s) return null;
  const k = win(t, s.start + 0.2, s.end, 0.4, 0.4);
  const dark = s.start === 158;
  return (
    <div style={{ position: "absolute", left: 56, top: 70, opacity: k, transform: `translateX(${(1 - k) * -30}px)`, display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ fontFamily: FONT_SYM, fontWeight: 700, fontSize: 20, letterSpacing: 3, color: dark ? "#9AA3D8" : "#8C826F" }}>{s.en}</div>
      <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 26, color: dark ? "#FFFFFF" : P.ink }}>{s.name}</div>
    </div>
  );
};

// history: the year and how many elements are known
export const YearCounter: React.FC<{ t: number }> = ({ t }) => {
  const k = win(t, 18.4, 55.9, 0.4, 0.5);
  if (k <= 0) return null;
  const n = EL.filter((e) => t >= e.appear).length;
  return (
    <div style={{ position: "absolute", right: 64, top: 36, opacity: k, textAlign: "right" }}>
      <div style={{ fontFamily: FONT_BIG, fontSize: 96, color: P.ink, lineHeight: 1 }}>{yearAt(t)}</div>
      <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 30, color: P.ink, marginTop: 8 }}>
        已知 <span style={{ fontFamily: FONT_BIG, fontSize: 40, background: "#FFD23F", padding: "0 10px", borderRadius: 8 }}>{Math.min(n, 118)}</span> 种
      </div>
    </div>
  );
};

// roll call: the element that is singing right now
export const RollTicker: React.FC<{ t: number }> = ({ t }) => {
  const k = win(t, 82.8, 103.9, 0.3, 0.4);
  if (k <= 0) return null;
  let cur = EL[0];
  for (const e of EL) if (e.roll <= t && e.roll > cur.roll) cur = e;
  if (t < EL[0].roll) cur = EL[0];
  const d = t - cur.roll, pop = backOut(clamp01(d / 0.12), 2.5);
  const c = FAM[cur.fam].c;
  return (
    <div style={{ position: "absolute", left: 70, bottom: 60, opacity: k }}>
      <Sticker bg={c} style={{ width: 230, height: 230, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `scale(${0.92 + 0.08 * pop})` }}>
        <div style={{ alignSelf: "flex-start", marginLeft: 22, fontFamily: FONT_SYM, fontWeight: 700, fontSize: 30, color: P.ink }}>{cur.z}</div>
        <div style={{ fontFamily: FONT_SYM, fontWeight: 700, fontSize: 96, color: P.ink, lineHeight: 1, marginTop: -8 }}>{cur.s}</div>
        <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 30, color: P.ink, height: 40 }}>{cur.cn || " "}</div>
      </Sticker>
    </div>
  );
};

// district name tag during the neighbourhood tour
export const HoodTag: React.FC<{ t: number }> = ({ t }) => {
  const d = (T.hood as { t: number; out: number; name: string; fam?: string; id: string }[]).find((x) => t >= x.t && t < x.out);
  if (!d) return null;
  const k = win(t, d.t, d.out, 0.3, 0.3);
  const c = FAM[d.fam ?? (d.id === "h" ? "h" : "nm")].c;
  return (
    <div style={{ position: "absolute", left: 64, top: 200, opacity: k, transform: `translateX(${(1 - k) * -40}px)` }}>
      <Sticker bg="#FFFFFF" style={{ padding: "10px 26px", display: "flex", alignItems: "center", gap: 14 }} radius={16} shadow={6}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: c, border: `3px solid ${P.ink}` }} />
        <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 40, color: P.ink }}>{d.name}</div>
      </Sticker>
    </div>
  );
};

export { eIn };
