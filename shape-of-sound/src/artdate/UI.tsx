// The overlay: guide card, kit cards (one stack per hall), speech bubbles, the running stamp, hall titles, credits,
// and the ending type. Each hall's kinetic type speaks its own visual language.
import React from "react";
import { useCurrentFrame } from "remotion";
import J from "./artdate.json";
import { coupleScreen, passerby, poseAt } from "./couple";
import { BEAT, clamp01, FPS, inCubic, inOutSine, lerp, outBack, outExpo, range, spring, VH, VW } from "./motion";
import { aspectOf, sceneTime } from "./render";
import { camAt, workRect } from "./world";

export const useT = () => useCurrentFrame() / FPS;
export const F = {
  serif: "'Noto Serif SC', serif", sans: "'Noto Sans SC', sans-serif", latin: "'Cormorant Garamond', 'Noto Serif SC', serif",
  geo: "'Jost', 'Noto Sans SC', sans-serif", pop: "'ZCOOL QingKe HuangYou', 'Noto Sans SC', sans-serif", deco: "'Poiret One', 'Noto Serif SC', serif",
};
type Item = (typeof J.ui)[number] & Record<string, unknown>;
const UI = J.ui as Item[];
const WORK = Object.fromEntries(J.works.map((w) => [w.id, w]));
const hallOf = (t: number) => J.halls.find((h) => t >= h.start && t < h.end) ?? J.halls[0];

// ── kinetic text: characters arrive on 1/16 notes (62.5 ms) with a spring; `mode` gives each hall its own entrance
export const KText: React.FC<{ text: string; at: number; t: number; size: number; color: string; font?: string; weight?: number; mode?: string; style?: React.CSSProperties; stagger?: number; lh?: number }> = ({
  text, at, t, size, color, font = F.serif, weight = 900, mode = "spring", style, stagger = BEAT / 8, lh = 1.28,
}) => {
  const lines = text.split("\n");
  let idx = 0;
  return (
    <div style={{ fontFamily: font, fontWeight: weight, fontSize: size, color, lineHeight: lh, ...style }}>
      {lines.map((ln, li) => (
        <div key={li} style={{ whiteSpace: "pre" }}>
          {Array.from(ln).map((ch, i) => {
            const k = idx++, s = t - at - k * stagger;
            const sp = spring(s, 0.6, 2.8), e = outExpo(clamp01(s / 0.45));
            let st: React.CSSProperties = { opacity: clamp01(s * 6), transform: `translateY(${(1 - sp) * size * 0.5}px)` };
            if (mode === "blur") st = { opacity: e, filter: `blur(${(1 - e) * 14}px)`, transform: `scale(${lerp(1.25, 1, e)})` };
            if (mode === "engrave") st = { opacity: e, transform: `translateY(${(1 - e) * 14}px)`, clipPath: `inset(${(1 - e) * 100}% 0 0 0)` };
            if (mode === "collage") { const r = (Math.sin(k * 12.9) * 0.5) * 14; st = { opacity: clamp01(s * 8), transform: `rotate(${r}deg) scale(${lerp(1.6, 1, outBack(clamp01(s / 0.25), 2))})`, display: "inline-block", background: ["#F2E8D0", "#1B1B1B", "#E8D9B5", "#C9342B"][k % 4], color: k % 4 === 1 ? "#F4F0E6" : k % 4 === 3 ? "#FFF" : "#1B1B1B", fontFamily: [F.serif, F.sans, F.pop, F.serif][k % 4], padding: "0 4px", margin: "0 1px", boxShadow: "2px 3px 0 rgba(0,0,0,0.25)" }; }
            if (mode === "grid") st = { opacity: clamp01(s * 8), transform: `translateX(${(1 - outExpo(clamp01(s / 0.3))) * -30}px)` };
            return <span key={i} style={{ display: "inline-block", ...st }}>{ch === " " ? " " : ch}</span>;
          })}
        </div>
      ))}
    </div>
  );
};

// ── the guide card (hook)
const Guide: React.FC<{ it: Item; t: number }> = ({ it, t }) => {
  const a = spring(t - it.t, 0.5, 2.2), e = inCubic(range(t, it.out - 0.35, it.out));
  const lt = it.lt as number[];
  return (
    <div style={{ position: "absolute", left: 790, top: 190, width: 560, padding: "40px 44px 46px", background: "#F6F0E4", borderRadius: 26, boxShadow: `0 ${30 * a}px 60px rgba(0,0,0,0.35)`,
      transform: `translateX(${(1 - a) * 520 - e * 900}px) rotate(${(1 - a) * 8 - e * 14}deg)`, opacity: 1 - e * 0.2 }}>
      <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 21, letterSpacing: 3, color: "#C8322B", borderBottom: "2px solid #C8322B", paddingBottom: 14 }}>{it.head as string}</div>
      <KText text={it.big as string} at={it.t + 0.08} t={t} size={150} color="#1B1714" style={{ marginTop: 18, letterSpacing: 6 }} />
      <KText text={(it.lines as string[])[0]} at={lt[0]} t={t} size={48} color="#2A2420" weight={700} style={{ marginTop: 14 }} />
      <KText text={(it.lines as string[])[1]} at={lt[1]} t={t} size={48} color="#2A2420" weight={700} />
    </div>
  );
};

// ── speech bubbles anchored to the speakers' heads
const Bubble: React.FC<{ it: Item; t: number }> = ({ it, t }) => {
  const st = sceneTime(t), c = camAt(st), cs = coupleScreen(c, st);
  const who = it.who as string, lines = it.lines as string[], small = !!it.small, cool = !!it.cool;
  const size = small ? 40 : 44, w = Math.max(...lines.map((l) => Array.from(l).length)) * size + 64, h = lines.length * size * 1.3 + 44;
  let [hx, hy] = who === "her" ? cs.herHead : who === "him" ? cs.himHead : (passerby(c, st)?.head ?? [1000, 380]);
  hy = Math.max(hy, 220);
  const left = Math.min(Math.max(70, hx + (who === "her" ? 40 : -w + 30)), 880 - w + (who === "stranger" ? 500 : 0)), top = Math.min(Math.max(70, hy - h - 70), VH - 70 - h - 40);   // stays in the safe area while the camera pushes in
  const a = spring(t - it.t, 0.5, 3.2), e = inCubic(range(t, it.out - 0.22, it.out));
  const hall = hallOf(t).id, pop = hall === "modern" && t > 44.3 && t < 48;
  const bg = pop ? "#FFFFFF" : cool ? "#1B1714" : "#FFFFFF", fg = cool ? "#F6F0E4" : "#1B1714", border = pop ? "4px solid #111" : cool ? "2px solid #C9A24A" : "2px solid rgba(0,0,0,0.12)";
  const tailX = Math.min(Math.max(hx - left, 40), w - 40);
  return (
    <div style={{ position: "absolute", left, top, width: w, transformOrigin: `${tailX}px ${h + 30}px`, transform: `scale(${lerp(0.5, 1, a) * (1 - e * 0.4)})`, opacity: clamp01(a * 3) * (1 - e) }}>
      <div style={{ position: "relative", background: bg, border, borderRadius: pop ? 40 : 30, padding: "20px 30px",
        boxShadow: pop ? "6px 6px 0 #111" : "0 12px 30px rgba(0,0,0,0.28)" }}>
        <KText text={lines.join("\n")} at={it.t + 0.05} t={t} size={size} color={fg} stagger={0.031} font={pop ? F.pop : F.sans} weight={pop ? 400 : 700} lh={1.3}
          style={pop ? { letterSpacing: 2 } : undefined} />
        <svg width={60} height={60} style={{ position: "absolute", left: tailX - 30, top: h - 6 }}>
          <path d={who === "her" ? "M14 0 L46 0 L10 46 Z" : "M14 0 L46 0 L50 46 Z"} fill={bg} stroke={pop ? "#111" : "none"} strokeWidth={4} />
        </svg>
      </div>
    </div>
  );
};

// ── a comic sweat drop (on his temple)
const Sweat: React.FC<{ it: Item; t: number }> = ({ it, t }) => {
  const st = sceneTime(t), c = camAt(st), cs = coupleScreen(c, st), k = cs.k;
  const a = outBack(clamp01((t - it.t) / 0.25), 2), slide = clamp01((st - it.t - 0.2) / 0.7), e = range(t, it.out - 0.2, it.out);
  const x = cs.himHead[0] + 12.5 * k, y = cs.himHead[1] + 8 * k + slide * 10 * k, r = 2.6 * k * a;
  return (
    <svg width={VW} height={VH} style={{ position: "absolute", inset: 0, opacity: 1 - e }}>
      <path d={`M${x} ${y - 2.6 * r} C ${x + 1.2 * r} ${y - 0.8 * r}, ${x + r} ${y + r}, ${x} ${y + r} C ${x - r} ${y + r}, ${x - 1.2 * r} ${y - 0.8 * r}, ${x} ${y - 2.6 * r} Z`}
        fill="#A8D8F0" stroke="#2B5A78" strokeWidth={3} />
      <path d={`M${x - 0.35 * r} ${y - 0.6 * r} q ${-0.15 * r} ${0.5 * r} ${0.1 * r} ${0.9 * r}`} stroke="#FFF" strokeWidth={3} fill="none" opacity={a} />
    </svg>
  );
};

// ── the running stamp 「又一个被骂出来的名字」
const Stamp: React.FC<{ it: Item; t: number }> = ({ it, t }) => {
  const s = t - it.t, a = clamp01(s / 0.12), land = s < 0.12 ? lerp(1.9, 1, outExpo(s / 0.12)) : 1 + 0.06 * Math.exp(-(s - 0.12) * 9) * Math.sin((s - 0.12) * 40);
  const e = inCubic(range(t, it.out - 0.2, it.out)), onCard = !!it.card;
  const x = onCard ? 930 : (it.x as number), y = onCard ? 560 : (it.y as number);
  const red = "#C8322B";
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `rotate(${-9 + Math.sin(it.n as number) * 3}deg) scale(${land})`, transformOrigin: "50% 50%", opacity: a * (1 - e) }}>
      <div style={{ border: `5px solid ${red}`, outline: `2px solid ${red}`, outlineOffset: 4, padding: "8px 18px 6px", color: red, fontFamily: F.serif, fontWeight: 900, fontSize: 30, letterSpacing: 2, display: "flex", alignItems: "center", gap: 14, background: "rgba(246,240,228,0.94)", boxShadow: "0 6px 14px rgba(0,0,0,0.3)",
        WebkitMaskImage: "radial-gradient(circle at 30% 40%, #000 60%, rgba(0,0,0,0.75) 61%, #000 75%)" }}>
        <span>{it.text as string}</span><span style={{ fontFamily: F.latin, fontStyle: "italic", fontWeight: 700, fontSize: 40 }}>№{it.n as number}</span>
      </div>
      {it.note && <div style={{ marginTop: 14, fontFamily: F.sans, fontWeight: 700, fontSize: 22, color: "#FFF", background: "rgba(150,30,25,0.9)", padding: "6px 12px", display: "inline-block", borderRadius: 6 }}>{it.note as string}</div>}
    </div>
  );
};

// ── hall title + architecture tag (top-left)
const HallTitle: React.FC<{ it: Item; t: number }> = ({ it, t }) => {
  const h = J.halls.find((x) => x.id === it.hall)!, a = spring(t - it.t, 0.6, 2.2), e = inCubic(range(t, it.out - 0.3, it.out));
  const look: Record<string, React.CSSProperties> = {
    classic: { fontFamily: F.serif, fontWeight: 900, color: "#EBC968", textShadow: "0 2px 0 #5A3D10, 0 -1px 0 rgba(255,240,200,0.6), 0 0 16px rgba(0,0,0,0.5)" },
    impr: { fontFamily: F.serif, fontWeight: 700, color: "#FDF8EE", textShadow: "0 0 18px rgba(80,110,160,0.8), 0 2px 2px rgba(0,0,0,0.4)" },
    modern: { fontFamily: F.sans, fontWeight: 900, color: "#111", background: "#FFF", padding: "0 14px" },
    design: { fontFamily: F.geo, fontWeight: 700, color: "#FFF", background: "#D2342A", padding: "0 14px" },
  };
  return (
    <div style={{ position: "absolute", left: 70, top: 60, opacity: clamp01(a * 2) * (1 - e), transform: `translateY(${(1 - a) * -30}px)` }}>
      <div style={{ fontSize: 50, letterSpacing: 6, lineHeight: 1.2, display: "inline-block", ...look[it.hall as string] }}>
        <KText text={h.name} at={it.t} t={t} size={50} color="inherit" font="inherit" weight={look[it.hall as string].fontWeight as number} mode={it.hall === "impr" ? "blur" : it.hall === "classic" ? "engrave" : it.hall === "design" ? "grid" : "spring"} />
      </div>
      <div style={{ marginTop: 10, fontFamily: F.sans, fontWeight: 700, fontSize: 21, letterSpacing: 2, color: "#FFF", background: "rgba(20,16,12,0.62)", padding: "6px 12px", borderRadius: 4, display: "inline-block", opacity: clamp01((t - it.t - 0.35) * 3) }}>{h.tag}</div>
    </div>
  );
};

// ── kit cards: one stack per hall on the right
const LABEL: Record<string, string> = { id: "一秒认出", line: "装逼台词", move: "进阶动作", mine: "踩雷" };
const CARD: Record<string, { bg: string; ink: string; accent: string; border: string; radius: number; font: string; mode: string; extra?: React.CSSProperties }> = {
  classic: { bg: "#F5EEDC", ink: "#2A2118", accent: "#8E2C2C", border: "3px double #B08A3A", radius: 10, font: F.serif, mode: "engrave", extra: { boxShadow: "inset 0 0 0 10px #F5EEDC, inset 0 0 0 11px #C9A24A" } },
  impr: { bg: "#F7F4EE", ink: "#26324A", accent: "#4A6FA5", border: "none", radius: 24, font: F.serif, mode: "blur", extra: { backgroundImage: "radial-gradient(circle at 20% 15%, rgba(140,180,220,0.35), transparent 45%), radial-gradient(circle at 85% 80%, rgba(240,180,140,0.35), transparent 45%)" } },
  modern: { bg: "#FFFFFF", ink: "#111111", accent: "#111111", border: "3px solid #111", radius: 0, font: F.sans, mode: "spring" },
  design: { bg: "#FAFAF7", ink: "#141414", accent: "#D2342A", border: "2px solid #141414", radius: 0, font: F.sans, mode: "grid", extra: { backgroundImage: "linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)", backgroundSize: "24px 24px" } },
};
const QUICK: Record<string, Partial<{ bg: string; ink: string; accent: string; mode: string; font: string }>> = {
  fauve: { bg: "#FFF4E0", accent: "#1F9E6B", ink: "#B8261E" }, cubist: { bg: "#EFE6D2", accent: "#6B5B3E", ink: "#3E3426" }, suprematist: { bg: "#FFFFFF", accent: "#C8322B", ink: "#111" },
  dada: { bg: "#F2E8D0", accent: "#111", ink: "#111", mode: "collage" }, colorfield: { bg: "#2A1416", accent: "#E8A05A", ink: "#F6E3CF" }, pop: { bg: "#FFF6D6", accent: "#E8322B", ink: "#111", font: F.pop },
  nouveau: { bg: "#F4ECD8", accent: "#7A8F5C", ink: "#3E3424", font: F.serif }, deco: { bg: "#151515", accent: "#D4AF37", ink: "#F3E6C4", font: F.serif }, bauhaus: { bg: "#FAFAF7", accent: "#D2342A", ink: "#141414" },
};
const Card: React.FC<{ it: Item; t: number; depth: number; leaving: number }> = ({ it, t, depth, leaving }) => {
  const base = CARD[it.hall as string] ?? CARD.modern, q = QUICK[(it.style as string) ?? ""] ?? {};
  const look = { ...base, ...q }, mode = q.mode ?? base.mode, font = q.font ?? base.font;
  const s = t - it.t, a = spring(s, 0.55, 2.4), shadow = spring(s - 0.06, 0.7, 2.0);
  const type = it.type as string, mine = type === "mine";
  const dz = depth > 0 ? outExpo(clamp01(depth)) : 0;
  const fly = outExpo(clamp01(leaving / 0.5));
  const tf = `translate(${(1 - a) * 140 + fly * 700}px, ${(1 - a) * 40 - dz * 26}px) rotate(${(1 - a) * 5 - dz * 3 + fly * 16}deg) scale(${1 - dz * 0.06})`;
  const work = it.work ? WORK[it.work as string] : null;
  return (
    <div style={{ position: "absolute", left: 912, top: 150, width: 458, transform: tf, transformOrigin: "100% 0%", opacity: clamp01(a * 4) * (depth > 1.6 ? 0 : 1) * (1 - fly * 0.6), filter: depth > 0 ? `brightness(${1 - dz * 0.12})` : undefined }}>
      <div style={{ background: look.bg, border: mine ? "4px solid #C8322B" : base.border, borderRadius: base.radius, padding: "28px 34px 30px", boxShadow: `0 ${8 + shadow * 22}px ${20 + shadow * 30}px rgba(0,0,0,${0.18 + shadow * 0.2})`, position: "relative", overflow: "hidden", ...base.extra, ...(q.bg ? { backgroundColor: q.bg } : {}) }}>
        <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 22, letterSpacing: 5, color: mine ? "#C8322B" : look.accent, display: "flex", alignItems: "center", gap: 10, opacity: clamp01(s * 5) }}>
          <span style={{ width: 12, height: 12, background: mine ? "#C8322B" : look.accent, display: "inline-block", transform: type === "id" ? "rotate(45deg)" : undefined, borderRadius: type === "move" ? 6 : 0 }} />
          {mine ? "踩雷 ✕" : LABEL[type]}{it.pre ? ` · ${it.pre as string}` : ""}
        </div>
        {type === "id" && (
          <>
            <KText stagger={it.quick ? 0.02 : 0.031} text={it.name as string} at={it.t + (it.quick ? 0.04 : 0.1)} t={t} size={(it.name as string).length > 4 ? 64 : 78} color={look.ink} font={font} mode={mode} style={{ marginTop: 12, letterSpacing: 4 }} weight={font === F.pop ? 400 : 900} />
            <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 2, opacity: clamp01((s - 0.25) * 4) }}>
              <span style={{ fontFamily: F.latin, fontStyle: "italic", fontWeight: 600, fontSize: (it.en as string).length > 14 ? 30 : 38, color: look.accent, whiteSpace: "nowrap" }}>{it.en as string}</span>
              <span style={{ fontFamily: F.geo, fontWeight: 500, fontSize: 24, color: look.ink, opacity: 0.75, whiteSpace: "nowrap" }}>{it.years as string}</span>
            </div>
            <div style={{ height: 2, background: look.accent, opacity: 0.35, margin: "18px 0 16px", transform: `scaleX(${outExpo(clamp01((s - 0.3) / 0.5))})`, transformOrigin: "0 50%" }} />
            <KText stagger={it.quick ? 0.02 : 0.031} text={it.tell as string} at={it.t + (it.quick ? 0.16 : 0.3)} t={t} size={Math.min(40, Math.floor(386 / Array.from(it.tell as string).length))} color={look.ink} font={font} weight={700} mode={mode === "collage" ? "spring" : mode} />
            {it.callback && <div style={{ marginTop: 14, fontFamily: F.sans, fontWeight: 900, fontSize: 26, color: "#C8322B", opacity: clamp01((s - 0.7) * 4) }}>← {it.callback as string}</div>}
          </>
        )}
        {type !== "id" && (
          <KText stagger={0.031} text={it.text as string} at={it.t + 0.1} t={t} size={Math.min(mine ? 52 : 46, Math.floor(386 / Math.max(...(it.text as string).split("\n").map((l) => Array.from(l).length))))} color={mine ? "#1B1714" : look.ink} font={font} mode={mode === "collage" ? "spring" : mode} weight={900} style={{ marginTop: 14 }} lh={1.32} />
        )}
        {it.flip && <MonetManet t={t} at={it.t + 0.5} />}
        {it.note && <div style={{ marginTop: 16, fontFamily: F.sans, fontWeight: 500, fontSize: 21, color: look.ink, opacity: 0.7 * clamp01((s - 0.6) * 3) }}>{it.note as string}</div>}
        {work && <div style={{ display: "none" }} />}
      </div>
    </div>
  );
};
const MonetManet: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const k = clamp01((t - at) / 0.35), flip = Math.sin(k * Math.PI);
  return (
    <div style={{ marginTop: 14, display: "flex", gap: 2, fontFamily: F.latin, fontWeight: 700, fontSize: 60, color: "#1B1714", letterSpacing: 6 }}>
      {"M?NET".split("").map((ch, i) => i === 1
        ? <span key={i} style={{ display: "inline-block", color: "#C8322B", transform: `rotateX(${flip * 90}deg)` }}>{k < 0.5 ? "O" : "A"}</span>
        : <span key={i}>{ch}</span>)}
    </div>
  );
};

// ── credit line for the work on screen
const Credit: React.FC<{ t: number }> = ({ t }) => {
  const ids = UI.filter((u) => u.type === "id" && u.work);
  let cur: Item | null = null;
  for (const u of ids) if (t >= (u.t as number) - 0.2 && t < (u.out as number) + (u.quick ? 0.1 : 1.6)) cur = u;
  if (t < 3.0 || (t > 62 && t < 67.6)) cur = { work: "blacksquare", t: t < 3 ? 0 : 62.3, out: t < 3 ? 2.9 : 67.5 } as unknown as Item;
  if (!cur) return null;
  const w = WORK[cur.work as string], a = clamp01((t - (cur.t as number)) * 4);
  return <div style={{ position: "absolute", left: 70, bottom: 64, maxWidth: 820, fontFamily: F.sans, fontWeight: 500, fontSize: 19, color: "#FFF", background: "rgba(15,12,10,0.55)", padding: "6px 12px", borderRadius: 4, opacity: a * 0.92 }}>{w.credit}</div>;
};

// ── ending type
const Cheers: React.FC<{ it: Item; t: number }> = ({ it, t }) => {
  const s = t - it.t, e = inCubic(range(t, it.out - 0.3, it.out));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 735, textAlign: "center", opacity: 1 - e }}>
      <KText text={it.text as string} at={it.t + 0.02} t={t} size={150} color="#F6F0E4" font={F.latin} weight={600} stagger={BEAT / 8} style={{ fontStyle: "italic", letterSpacing: 2, textShadow: "0 0 40px rgba(255,220,150,0.35)" }} />
      <div style={{ width: 240 * outExpo(clamp01(s / 0.6)), height: 2, background: "#C9A24A", margin: "8px auto 0" }} />
    </div>
  );
};
const Final: React.FC<{ it: Item; t: number }> = ({ it, t }) => {
  const lt = it.lt as number[], back = inOutSine(range(t, it.t + 0.1, it.t + 0.6));
  return (
    <>
    {/* a soft dusk band behind the line, so it reads over the bright gallery wall during the pull-back */}
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 330, opacity: back,
      background: "linear-gradient(to bottom, rgba(22,20,34,0.78) 0%, rgba(22,20,34,0.62) 55%, rgba(22,20,34,0) 100%)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 96, textAlign: "center", textShadow: "0 2px 14px rgba(0,0,0,0.55)" }}>
      <KText text={(it.lines as string[])[0]} at={lt[0]} t={t} size={60} color="#FDF8EE" weight={700} stagger={0.08} />
      <KText text={(it.lines as string[])[1]} at={lt[1]} t={t} size={60} color="#FDF8EE" weight={900} stagger={0.08} style={{ marginTop: 6 }} />
    </div>
    </>
  );
};
const Credits: React.FC<{ it: Item; t: number }> = ({ it, t }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, textAlign: "center", fontFamily: F.sans, fontWeight: 500, fontSize: 19, color: "#F6F0E4", opacity: 0.85 * clamp01((t - (it.t as number)) * 2), lineHeight: 1.6 }}>
    {(it.lines as string[]).map((l, i) => <div key={i}>{l}</div>)}
  </div>
);
const Freeze: React.FC<{ it: Item; t: number }> = ({ it, t }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center" }}>
    <span style={{ fontFamily: F.serif, fontWeight: 700, fontSize: 40, color: "#F6F0E4", background: "rgba(20,20,24,0.7)", padding: "10px 22px", letterSpacing: 4, opacity: clamp01((t - (it.t as number)) * 6) }}>{it.text as string}</span>
  </div>
);
const WallText: React.FC<{ it: Item; t: number; slap?: boolean }> = ({ it, t, slap }) => {
  const s = t - it.t, a = slap ? outBack(clamp01(s / 0.18), 2.4) : outExpo(clamp01(s / 0.4)), e = inCubic(range(t, it.out - 0.15, it.out));
  return (
    <div style={{ position: "absolute", left: slap ? 600 : 260, top: slap ? 372 : 210, transform: `rotate(${slap ? -6 : 0}deg) scale(${slap ? lerp(1.8, 1, a) : 1})`, opacity: (slap ? clamp01(s * 10) : a) * (1 - e),
      background: slap ? "#FF5FA2" : "transparent", padding: slap ? "14px 30px" : 0, boxShadow: slap ? "8px 8px 0 #2A8BD8" : undefined, border: slap ? "4px solid #111" : undefined }}>
      <div style={{ fontFamily: slap ? F.pop : F.geo, fontWeight: slap ? 400 : 700, fontSize: slap ? 92 : 84, color: slap ? "#111" : "#141414", letterSpacing: slap ? 2 : 10 }}>{it.text as string}</div>
      <div style={{ fontFamily: F.geo, fontWeight: 500, fontSize: 28, color: "#141414", marginTop: 4 }}>{it.by as string}</div>
    </div>
  );
};


// ── reaction marks (emanata): "!" when she is impressed, "…" when she is not, "?" over his panic
const Marks: React.FC<{ t: number }> = ({ t }) => {
  if (t > 67.6) return null;
  const st = sceneTime(t), c = camAt(st), cs = coupleScreen(c, st), her = poseAt("her", st), him = poseAt("him", st), k = cs.k;
  const imp = her.lean * her.smile, sk = her.cross, q = him.panic;
  const [hx, hy] = cs.herHead, [mx, my] = cs.himHead;
  const ink = "#1B1714";
  return (
    <svg width={VW} height={VH} style={{ position: "absolute", inset: 0 }}>
      {imp > 0.05 && <g transform={`translate(${hx - 24 * k} ${hy - 6 * k}) scale(${outBack(clamp01(imp * 1.3), 2.2) * k / 4})`} opacity={clamp01(imp * 3)}>
        <path d="M0 -26 L-3 -6 L3 -6 Z" fill="#C8322B" /><circle cx={0} cy={1} r={3.2} fill="#C8322B" />
        <path d="M-14 -20 L-9 -12 M14 -20 L9 -12" stroke="#C8322B" strokeWidth={3} strokeLinecap="round" />
      </g>}
      {sk > 0.05 && <g transform={`translate(${hx - 30 * k} ${hy + 2 * k})`} opacity={clamp01(sk * 2)}>
        {[0, 1, 2].map((i) => <circle key={i} cx={-i * 5.5 * k * clamp01(sk * 3 - i * 0.6)} cy={0} r={1.5 * k} fill={ink} />)}
      </g>}
      {q > 0.05 && t < 4.2 && <g transform={`translate(${mx - 18 * k} ${my - 4 * k}) scale(${outBack(clamp01(q * 1.2), 2) * k / 4})`} opacity={clamp01(q * 3)}>
        <text x={0} y={0} fontFamily={F.serif} fontWeight={900} fontSize={30} fill={ink}>?</text>
      </g>}
    </svg>
  );
};


// ── demonstrations drawn over the art: perspective lines to the vanishing point; a layout grid snapping into place
const workScreen = (id: string, t: number) => {
  const st = sceneTime(t), c = camAt(st), w = J.works.find((x) => x.id === id)!;
  return workRect(c, w, aspectOf(w), st);
};
const VP: [number, number] = [0.489, 0.524];                            // Christ's right temple in the Last Supper image
const Perspective: React.FC<{ it: Item; t: number }> = ({ it, t }) => {
  const r = workScreen("lastsupper", t), s = t - (it.t as number), e = inCubic(range(t, (it.out as number) - 0.3, it.out as number));
  const vx = r.x + r.w * VP[0], vy = r.y + r.h * VP[1];
  const starts: [number, number][] = [[0, 0.04], [1, 0.04], [0, 0.56], [1, 0.56], [0.16, 0.0], [0.84, 0.0], [0.0, 0.84], [1, 0.84]];
  return (
    <svg width={VW} height={VH} style={{ position: "absolute", inset: 0, opacity: 1 - e }}>
      {starts.map(([u, v], i) => {
        const k = outExpo(clamp01((s - 0.25 - i * BEAT / 2) / 0.35)), x0 = r.x + r.w * u, y0 = r.y + r.h * v;
        return <line key={i} x1={x0} y1={y0} x2={lerp(x0, vx, k)} y2={lerp(y0, vy, k)} stroke="#FFD87A" strokeWidth={3} strokeLinecap="round" strokeDasharray="10 7" opacity={k > 0 ? 0.95 : 0} />;
      })}
      {s > 1.25 && <g transform={`translate(${vx} ${vy})`}>
        <circle r={10 + 26 * outExpo(clamp01((s - 1.25) / 0.5))} fill="none" stroke="#FFD87A" strokeWidth={3} opacity={1 - clamp01((s - 1.25) / 0.6) * 0.6} />
        <circle r={6} fill="#C8322B" stroke="#FFF" strokeWidth={2} />
      </g>}
      {s > 1.35 && <text x={vx + 18} y={vy - 16} fontFamily={F.sans} fontWeight={900} fontSize={24} fill="#FFF" stroke="#2A1A0A" strokeWidth={4} paintOrder="stroke" opacity={clamp01((s - 1.35) * 5)}>消失点</text>}
    </svg>
  );
};
const GridSnap: React.FC<{ it: Item; t: number }> = ({ it, t }) => {
  const r = workScreen("bauhaus", t), s = t - (it.t as number), e = inCubic(range(t, (it.out as number) - 0.3, it.out as number));
  const xs = [0, 0.38, 0.62, 1].map((u) => r.x + r.w * u), ys = [0, 0.45, 0.55, 1].map((v) => r.y + r.h * v);
  const lines = [...xs.map((x) => ["v", x] as const), ...ys.map((y) => ["h", y] as const)];
  return (
    <svg width={VW} height={VH} style={{ position: "absolute", inset: 0, opacity: 1 - e }}>
      {lines.map(([d, v], i) => {
        const k = outExpo(clamp01((s - 0.2 - i * BEAT / 4) / 0.3));
        return d === "v" ? <line key={i} x1={v} x2={v} y1={VH / 2 - k * VH * 0.6} y2={VH / 2 + k * VH * 0.6} stroke="#D2342A" strokeWidth={2.5} opacity={0.9} />
          : <line key={i} y1={v} y2={v} x1={460 - k * 520} x2={460 + k * 520} stroke="#D2342A" strokeWidth={2.5} opacity={0.9} />;
      })}
    </svg>
  );
};

// ── the whole overlay
export const Overlay: React.FC = () => {
  const t = useT();
  const on = (u: Item) => t >= (u.t as number) - 0.02 && t < (u.out as number) + 0.02;
  // kit card stacks: cards of the current hall up to now
  const hall = hallOf(t).id, cards = UI.filter((u) => ["id", "line", "move", "mine"].includes(u.type as string) && u.hall === hall && t >= (u.t as number) - 0.02);
  const hallItem = UI.find((u) => u.type === "hall" && u.hall === hall), hallOut = hallItem ? ((hallItem.cards as number) ?? (hallItem.out as number)) : 999;
  return (
    <>
      {cards.map((u, i) => {
        const later = cards.length - 1 - i, nxt = cards[i + 1];
        const depth = later === 0 ? 0 : later - 1 + clamp01((t - (nxt.t as number)) / 0.35);
        if (depth > 2) return null;
        return <Card key={i} it={u} t={t} depth={depth} leaving={Math.max(0, t - hallOut + 0.1)} />;
      })}
      {UI.filter(on).map((u, i) => {
        switch (u.type) {
          case "bubble": return <Bubble key={i} it={u} t={t} />;
          case "sweat": return <Sweat key={i} it={u} t={t} />;
          case "guide": return <Guide key={i} it={u} t={t} />;
          case "stamp": return <Stamp key={i} it={u} t={t} />;
          case "hall": return <HallTitle key={i} it={u} t={t} />;
          case "freeze": return <Freeze key={i} it={u} t={t} />;
          case "cheers": return <Cheers key={i} it={u} t={t} />;
          case "final": return <Final key={i} it={u} t={t} />;
          case "credits": return <Credits key={i} it={u} t={t} />;
          case "walltext": return <WallText key={i} it={u} t={t} />;
          case "walltext2": return <WallText key={i} it={u} t={t} slap />;
          case "move": return u.fx === "vp" ? <Perspective key={i} it={u} t={t} /> : u.fx === "grid" ? <GridSnap key={i} it={u} t={t} /> : null;
          case "tag": return <div key={i} style={{ position: "absolute", left: 70, top: 64, fontFamily: F.sans, fontWeight: 700, fontSize: 21, letterSpacing: 2, color: "#FFF", background: "rgba(20,16,12,0.7)", padding: "6px 12px", borderRadius: 4, opacity: clamp01((t - (u.t as number)) * 5) }}>{u.text as string}</div>;
          default: return null;
        }
      })}
      <Marks t={t} />
      <Credit t={t} />
    </>
  );
};
