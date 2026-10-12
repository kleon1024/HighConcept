// The opening (0–8 s): a food label slams in — 配料表: 氧 65 %, 碳 18.5 %… — and the camera pulls back: it's printed on
// a person. Then three more labels whip past (air, the Sun, the ground), and every ingredient turns out to come from one
// table: 118 tiles slam down in a wave, and the title.
import React from "react";
import { FAM, P, backOut, clamp01, eIn, eInOut, eOut, lerp, range, win } from "../elements/core";
import { BODY, T6 } from "./core60";
import { FONT_CN } from "./Look60";
import { Card, Kin, Row, Sticker } from "./UI60";

const HK = T6.hook;
// the figure, drawn in the same units as the table (so the ending's dot-figure matches it exactly)
export const U = 92, BX = 1300, BY = 576;
export const bodyPath = (u: number, bx: number, by: number, cy = 4.7) => {
  const px = (x: number) => bx + u * (x - 9), py = (y: number) => by + u * (y - cy);
  const [hx, hy, hr] = BODY.head;
  const polys = BODY.polys.map((p) => "M" + p.map(([x, y]) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(" L") + " Z").join(" ");
  return { polys, head: { cx: px(hx), cy: py(hy), r: u * hr } };
};
const Figure: React.FC<{ fill: string; stroke?: string }> = ({ fill, stroke = P.ink }) => {
  const b = bodyPath(U, BX, BY);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={b.polys} fill={fill} stroke={stroke} strokeWidth={6} strokeLinejoin="round" />
      <circle cx={b.head.cx} cy={b.head.cy} r={b.head.r} fill={fill} stroke={stroke} strokeWidth={6} />
      <path d={b.polys} fill={fill} stroke="none" />
    </svg>
  );
};

export const YOU_ROWS = (r: number[]): Row[] => [
  { sym: "O", cn: "氧", val: 65, col: FAM.nm.c, max: 65, at: r[0] - 0.05 },
  { sym: "C", cn: "碳", val: 18.5, col: FAM.nm.c, max: 65, at: r[1] },
  { sym: "H", cn: "氢", val: 9.5, col: FAM.h.c, max: 65, at: r[2] },
  { sym: "N", cn: "氮", val: 2.6, col: FAM.nm.c, max: 65, at: r[3] },
  { sym: "Ca", cn: "钙", val: 1.3, col: FAM.ae.c, max: 65, at: r[4] },
  { sym: "P", cn: "磷", val: 0.6, col: FAM.nm.c, max: 65, at: r[5] },
];
const CARD_C = [BX, 530];      // where the card sits on the chest when we see the whole figure
const CS = 0.42;               // its scale there

const QUICK = [
  { at: HK.labels[0], name: "空气", foot: "按体积", icon: "air", rows: [["N", "氮", 78, FAM.nm.c], ["O", "氧", 21, FAM.nm.c], ["Ar", "氩", 0.9, FAM.ng.c]] },
  { at: HK.labels[1], name: "太阳", foot: "按质量", icon: "sun", rows: [["H", "氢", 73, FAM.h.c], ["He", "氦", 25, FAM.ng.c], ["…", "其他", 2, "#D8CFBE"]] },
  { at: HK.labels[2], name: "大地", foot: "地壳 · 按质量", icon: "ground", rows: [["O", "氧", 46, FAM.nm.c], ["Si", "硅", 28, FAM.md.c], ["Al", "铝", 8, FAM.pt.c], ["Fe", "铁", 5, FAM.tm.c]] },
] as const;

const Icon: React.FC<{ kind: string; t: number; at: number }> = ({ kind, t, at }) => {
  const k = backOut(range(t, at, at + 0.35), 1.6), lt = t - at;
  if (kind === "air") {
    const mols = [[-150, -90, 0, "N"], [60, -150, 1, "N"], [170, -20, 2, "N"], [-60, 30, 3, "O"], [-190, 110, 4, "N"], [90, 120, 5, "N"], [-20, -200, 6, "N"], [200, 170, 7, "O"], [-120, 210, 8, "N"]] as const;
    return (
      <g transform={`scale(${k})`}>
        <circle r={300} fill="rgba(255,255,255,0.12)" stroke="#FFFFFF" strokeWidth={6} />
        {[-120, 0, 120].map((y, i) => <path key={i} d={`M-260,${y + 40} q65,-50 130,0 t130,0 t130,0 t130,0`} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={10} strokeLinecap="round" transform={`translate(${((lt * 160 + i * 60) % 130) - 65} 0)`} />)}
        {mols.map(([x, y, i, e]) => {
          const c = e === "O" ? "#FFD23F" : "#FFFFFF", a = lt * 1.6 + i;
          return (
            <g key={i} transform={`translate(${x + 14 * Math.sin(a)} ${y + 12 * Math.cos(a * 1.3)}) rotate(${a * 40})`}>
              <line x1={-26} x2={26} stroke={P.ink} strokeWidth={8} /><circle cx={-26} r={26} fill={c} stroke={P.ink} strokeWidth={5} /><circle cx={26} r={26} fill={c} stroke={P.ink} strokeWidth={5} />
            </g>
          );
        })}
      </g>
    );
  }
  if (kind === "sun") {
    return (
      <g transform={`scale(${k}) rotate(${lt * 30})`}>
        {Array.from({ length: 14 }, (_, i) => <polygon key={i} points="-30,-250 30,-250 0,-330" fill="#FFD23F" stroke={P.ink} strokeWidth={5} transform={`rotate(${i * (360 / 14)})`} />)}
        <circle r={230} fill="#FFD23F" stroke={P.ink} strokeWidth={7} />
        <circle r={150} fill="#FFE98A" />
        <text y={58} textAnchor="middle" fontFamily="'Space Grotesk'" fontWeight={700} fontSize={170} fill={P.ink} transform={`rotate(${-lt * 30})`}>H</text>
      </g>
    );
  }
  const layers = ["#E2B062", "#C8873E", "#9C5E33", "#6E3E22"];
  return (
    <g transform={`scale(${k})`}>
      {layers.map((c, i) => (
        <rect key={i} x={-290} y={-150 + i * 95 + (1 - k) * 60 * i} width={580} height={110} rx={30} fill={c} stroke={P.ink} strokeWidth={6} />
      ))}
      <rect x={-290} y={-215} width={580} height={70} rx={30} fill="#2FC27E" stroke={P.ink} strokeWidth={6} />
      {[[-160, -40], [40, 60], [180, -10], [-60, 150], [120, 160]].map(([x, y], i) => <polygon key={i} points={`${x - 22},${y + 14} ${x},${y - 24} ${x + 24},${y + 10}`} fill="#F6F0E4" stroke={P.ink} strokeWidth={4} />)}
    </g>
  );
};

export const Hook6: React.FC<{ t: number }> = ({ t }) => {
  if (t >= HK.out + 0.1) return null;
  // ── 0–3 s: the label, then the pull-back to the whole figure
  const zk = eInOut(range(t, HK.reveal, HK.reveal + 0.6));
  const S = lerp(2.9, 1, zk);
  const cx = lerp(960, CARD_C[0], zk), cy = lerp(560, CARD_C[1], zk);
  const slam = backOut(range(t, 0, 0.26), 2.2);
  const youOut = 1 - eIn(range(t, HK.labels[0] - 0.05, HK.labels[0] + 0.15));
  const youX = -eIn(range(t, HK.labels[0] - 0.12, HK.labels[0] + 0.12)) * 900;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {t < HK.labels[0] + 0.2 && (
        <div style={{ position: "absolute", inset: 0, opacity: youOut, transform: `translateX(${youX}px)` }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0",
            transform: `translate(${cx}px, ${cy}px) scale(${S * (1.18 - 0.18 * slam)}) rotate(${(1 - slam) * -5}deg) translate(${-CARD_C[0]}px, ${-CARD_C[1]}px)` }}>
            <Figure fill="#FF3D7F" />
            <div style={{ position: "absolute", left: CARD_C[0], top: CARD_C[1], transform: `translate(-50%, -50%) scale(${CS})` }}>
              <Card t={t} title="配料表" rows={YOU_ROWS(HK.rows)} foot="按质量 · 约数" at={-0.3} />
            </div>
          </div>
          <Kin t={t} at={HK.you} out={HK.labels[0] + 0.2} text="这是" x={110} y={300} size={100} color={P.ink} />
          <Kin t={t} at={HK.you + 0.12} out={HK.labels[0] + 0.2} text="你的配料表" x={100} y={420} size={160} color={P.ink} stagger={0.05} />
          <Sticker t={t} at={HK.you + 0.45} out={HK.labels[0] + 0.2} x={116} y={640} text="你 65% 是氧" size={54} bg="#FFFFFF" rot={-3} />
        </div>
      )}
      {/* ── 3–5 s: three more labels whip past */}
      {QUICK.map((q, i) => {
        const next = i < 2 ? QUICK[i + 1].at : HK.merge;
        if (t < q.at - 0.15 || t > next + 0.15) return null;
        const kin = eOut(range(t, q.at - 0.12, q.at + 0.16)), kout = eIn(range(t, next - 0.12, next + 0.1));
        const x = (1 - kin) * 1000 - kout * 1100, skew = (1 - kin) * -14 + kout * 14;
        const rows: Row[] = q.rows.map(([sym, cn, val, col], j) => ({ sym, cn, val, col, max: q.rows[0][2], at: q.at + 0.06 + j * 0.07 }));
        return (
          <div key={i} style={{ position: "absolute", inset: 0, transform: `translateX(${x}px) skewX(${skew}deg)` }}>
            <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}><g transform="translate(500 590)"><Icon kind={q.icon} t={t} at={q.at} /></g></svg>
            <div style={{ position: "absolute", left: 500, top: 120, transform: "translateX(-50%)", fontFamily: FONT_CN, fontWeight: 900, fontSize: 120, color: "#FFFFFF",
              textShadow: `8px 8px 0 ${P.ink}` }}>{q.name}</div>
            <div style={{ position: "absolute", left: 1050, top: 540, transform: `translateY(-50%) scale(0.92)`, transformOrigin: "left center" }}>
              <Card t={t} title="配料表" rows={rows} foot={q.foot} at={q.at - 0.1} w={760} />
            </div>
          </div>
        );
      })}
      {/* ── 5–8 s: everything comes from one table */}
      <Kin t={t} at={HK.merge + 0.05} out={HK.n118} text="万物的配料，都在这张表上" x={960} y={40} size={66} color="#FFFFFF" anchor="center" stagger={0.03} />
      <Sticker t={t} at={HK.n118} out={HK.title} x={960} y={500} text={<span>只有 <span style={{ fontFamily: "'Archivo Black'", fontSize: 110 }}>118</span> 种</span>} size={70} bg="#FFD23F" anchor="center" rot={-3} />
      <Title t={t} />
    </div>
  );
};

const Title: React.FC<{ t: number }> = ({ t }) => {
  if (t < HK.title || t > HK.out + 0.1) return null;
  const out = eIn(range(t, HK.out - 0.3, HK.out + 0.05));
  const sc = 1 + 2.2 * out;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26,
      transform: `scale(${sc})`, opacity: 1 - out }}>
      <div style={{ display: "flex", gap: 6 }}>
        {Array.from("元素周期表").map((ch, i) => {
          const k = backOut(range(t, HK.title + i * 0.05, HK.title + i * 0.05 + 0.3), 2.0);
          const c = [FAM.alk.c, FAM.ae.c, FAM.hal.c, FAM.nm.c, FAM.h.c][i];
          return (
            <div key={i} style={{ width: 210, height: 210, background: c, border: `8px solid ${P.ink}`, boxShadow: `12px 12px 0 ${P.ink}`, borderRadius: 10, display: "flex",
              alignItems: "center", justifyContent: "center", fontFamily: FONT_CN, fontWeight: 900, fontSize: 150, color: P.ink,
              transform: `translateY(${(1 - k) * -240}px) rotate(${(1 - k) * (i % 2 ? 12 : -12)}deg)`, opacity: clamp01(k * 3) }}>{ch}</div>
          );
        })}
      </div>
      <div style={{ opacity: win(t, HK.title + 0.3, HK.out + 1, 0.2, 0.01), transform: `scale(${backOut(range(t, HK.title + 0.3, HK.title + 0.6), 2)})` }}>
        <div style={{ background: "#FFFFFF", border: `7px solid ${P.ink}`, boxShadow: `12px 12px 0 ${P.ink}`, borderRadius: 8, padding: "10px 34px", fontFamily: FONT_CN, fontWeight: 900, fontSize: 70, color: P.ink }}>
          = 宇宙的配料表
        </div>
      </div>
    </div>
  );
};
