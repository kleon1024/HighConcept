// Type and stickers: kinetic labels (≤ 10 characters a line), giant numbers, and the ingredient card (配料表) that opens
// and closes the film.
import React from "react";
import { P, backOut, clamp01, eIn, eOut, range } from "../elements/core";
import { FONT_BIG, FONT_CN, FONT_SYM } from "./Look60";

export const inOut = (t: number, at: number, out: number, fi = 0.3, fo = 0.25) => ({
  k: backOut(range(t, at, at + fi), 1.7), o: 1 - eIn(range(t, out - fo, out)), on: t >= at && t < out,
});

// a sticker: a box with an ink border and a hard shadow; it slaps on (overshoot + a small turn) and lifts off
export const Sticker: React.FC<{ t: number; at: number; out: number; x: number; y: number; text: React.ReactNode; size?: number; bg?: string; fg?: string;
  rot?: number; anchor?: "left" | "center" | "right"; font?: string; pad?: number }> = ({ t, at, out, x, y, text, size = 40, bg = "#FFFFFF", fg = P.ink, rot = -2, anchor = "left", font = FONT_CN, pad }) => {
  const a = inOut(t, at, out, 0.28, 0.2);
  if (!a.on) return null;
  const tx = anchor === "left" ? "0%" : anchor === "center" ? "-50%" : "-100%";
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx}) rotate(${rot * (2 - a.k)}deg) scale(${(0.5 + 0.5 * a.k) * (0.85 + 0.15 * a.o)})`,
      transformOrigin: anchor === "left" ? "left center" : anchor === "center" ? "center" : "right center", opacity: a.o * clamp01(a.k * 3) }}>
      <div style={{ background: bg, color: fg, fontFamily: font, fontWeight: 900, fontSize: size, lineHeight: 1.15, padding: `${(pad ?? size * 0.22)}px ${(pad ?? size * 0.22) * 1.6}px`,
        border: `${Math.max(3, size * 0.09)}px solid ${P.ink}`, boxShadow: `${size * 0.16}px ${size * 0.16}px 0 ${P.ink}`, whiteSpace: "nowrap", borderRadius: 6 }}>{text}</div>
    </div>
  );
};

// kinetic type: characters drop in one after another
export const Kin: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; color: string; stagger?: number;
  anchor?: "left" | "center" | "right"; font?: string; weight?: number; shadow?: string; tracking?: number }> = ({ t, at, out, text, x, y, size, color, stagger = 0.035, anchor = "left", font = FONT_CN, weight = 900, shadow, tracking = 0 }) => {
  if (t < at || t >= out) return null;
  const o = 1 - eIn(range(t, out - 0.22, out));
  const tx = anchor === "left" ? "0%" : anchor === "center" ? "-50%" : "-100%";
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translateX(${tx})`, display: "flex", whiteSpace: "pre", fontFamily: font, fontWeight: weight, fontSize: size,
      color, lineHeight: 1.05, opacity: o, letterSpacing: tracking, textShadow: shadow }}>
      {Array.from(text).map((ch, i) => {
        const k = backOut(range(t, at + i * stagger, at + i * stagger + 0.26), 1.9);
        return <span key={i} style={{ display: "inline-block", transform: `translateY(${(1 - k) * size * 0.5}px) scale(${0.6 + 0.4 * k})`, opacity: clamp01(k * 2.5) }}>{ch}</span>;
      })}
    </div>
  );
};

// a giant number with a punch on arrival
export const Giant: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; color: string; anchor?: "left" | "center" | "right"; font?: string; stroke?: string }> = ({ t, at, out, text, x, y, size, color, anchor = "center", font = FONT_BIG, stroke }) => {
  const a = inOut(t, at, out, 0.3, 0.2);
  if (!a.on) return null;
  const tx = anchor === "left" ? "0%" : anchor === "center" ? "-50%" : "-100%";
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(${tx}, -50%) scale(${(0.3 + 0.7 * a.k) * (1 + 0.04 * Math.exp(-(t - at) / 0.2))})`,
      transformOrigin: anchor === "left" ? "left center" : anchor === "center" ? "center" : "right center", fontFamily: font, fontSize: size, color, lineHeight: 1, opacity: a.o,
      whiteSpace: "nowrap", WebkitTextStroke: stroke }}>{text}</div>
  );
};

// ───────────── the ingredient card (配料表): a white food label with an ink border and a hard shadow
export type Row = { sym?: string; cn: string; val?: number; unit?: string; col?: string; max?: number; tag?: string; tagC?: string; text?: string; at: number; tagAt?: number };
export const Card: React.FC<{ t: number; title: string; rows: Row[]; foot?: string; w?: number; accent?: string; at: number }> = ({ t, title, rows, foot, w = 720, accent = P.ink, at }) => {
  const head = eOut(range(t, at, at + 0.2));
  return (
    <div style={{ width: w, background: "#FFFFFF", border: `8px solid ${P.ink}`, boxShadow: `18px 18px 0 ${P.ink}`, borderRadius: 10, fontFamily: FONT_CN }}>
      <div style={{ background: accent, color: "#FFFFFF", fontWeight: 900, fontSize: 64, padding: "10px 30px 14px", letterSpacing: 6, borderRadius: "2px 2px 0 0", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ opacity: head, display: "inline-block", transform: `translateX(${(1 - head) * -30}px)` }}>{title}</span>
        <span style={{ fontFamily: FONT_SYM, fontWeight: 700, fontSize: 22, letterSpacing: 2, opacity: 0.75 }}>INGREDIENTS</span>
      </div>
      <div style={{ padding: "16px 30px 18px" }}>
        {rows.map((r, i) => {
          const k = eOut(range(t, r.at, r.at + 0.22));
          const kb = eOut(range(t, r.at + 0.03, r.at + 0.3));
          const tk = r.tagAt !== undefined ? backOut(range(t, r.tagAt, r.tagAt + 0.25), 2) : 0;
          if (r.text !== undefined) {
            return (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 18, height: 74, opacity: k, transform: `translateX(${(1 - k) * 40}px)`, borderTop: i ? "3px solid #E6E0D4" : "none" }}>
                <span style={{ fontWeight: 900, fontSize: 34, color: "#8A8478", width: 160, flexShrink: 0, paddingTop: 14 }}>{r.cn}</span>
                <span style={{ fontWeight: 900, fontSize: 42, color: P.ink, paddingTop: 10 }}>{r.text}</span>
              </div>
            );
          }
          const shown = (r.val ?? 0) * kb;
          return (
            <div key={i} style={{ position: "relative", display: "flex", alignItems: "center", gap: 16, height: 74, opacity: k, transform: `translateX(${(1 - k) * 40}px)`, borderTop: i ? "3px solid #E6E0D4" : "none" }}>
              <div style={{ width: 54, height: 54, background: r.col, border: `4px solid ${P.ink}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT_SYM, fontWeight: 700, fontSize: r.sym && r.sym.length > 1 ? 24 : 30, color: P.ink, flexShrink: 0 }}>{r.sym}</div>
              <span style={{ fontWeight: 900, fontSize: 40, color: P.ink, width: r.cn.length > 1 ? 86 : 64, flexShrink: 0, whiteSpace: "nowrap" }}>{r.cn}</span>
              <div style={{ flex: 1, height: 26, background: "#F1ECE2", borderRadius: 13, overflow: "hidden" }}>
                <div style={{ width: `${(100 * shown) / (r.max ?? 100)}%`, height: "100%", background: r.col, borderRight: shown > 0.3 ? `3px solid ${P.ink}` : "none" }} />
              </div>
              <span style={{ fontFamily: FONT_SYM, fontWeight: 700, fontSize: 40, color: P.ink, width: 150, textAlign: "right", flexShrink: 0 }}>
                {Number.isInteger(r.val ?? 0) ? Math.round(shown) : shown.toFixed(1)}{r.unit ?? "%"}
              </span>
              {r.tag && tk > 0 && (
                <span style={{ position: "absolute", right: -18, transform: `translateX(100%) scale(${tk})`, transformOrigin: "left center", background: r.tagC, color: P.ink,
                  fontWeight: 900, fontSize: 38, padding: "4px 16px", border: `4px solid ${P.ink}`, borderRadius: 30, whiteSpace: "nowrap", boxShadow: `5px 5px 0 ${P.ink}` }}>← {r.tag}</span>
              )}
            </div>
          );
        })}
        {foot && <div style={{ fontWeight: 700, fontSize: 22, color: "#8A8478", marginTop: 8 }}>{foot}</div>}
      </div>
    </div>
  );
};
