// 03 产地 (41–50 s): where each ingredient was made — a big geometric diagram per origin while the table lights up by
// origin. Then the ending (50–60 s): the tiles fly into a body, the ingredient card returns with each ingredient's
// origin and a stamp (生产日期：早于地球), the camera pulls out to the stars, and back to the table with row 8 still empty.
import React from "react";
import { ORIGIN, P, backOut, clamp01, eIn, eInOut, eOut, lerp, range, win } from "../elements/core";
import { T6 } from "./core60";
import { FONT_BIG, FONT_CN } from "./Look60";
import { YOU_ROWS } from "./Hook60";
import { Card, Kin, Row } from "./UI60";

const C = T6.cosmos, EN = T6.end;
const WX = 1625, WY = 470;

const Stage: React.FC<{ t: number; a: number; b: number; children: (k: number, lt: number) => React.ReactNode }> = ({ t, a, b, children }) => {
  if (t < a - 0.05 || t > b + 0.05) return null;
  const k = backOut(range(t, a, a + 0.35), 1.5), o = 1 - eIn(range(t, b - 0.2, b));
  return <g opacity={o}>{children(k, t - a)}</g>;
};

export const Cosmos6: React.FC<{ t: number }> = ({ t }) => {
  if (t < C.off - 0.1 || t > EN.morph[0] + 0.3) return null;
  const tc = C.chirp[1], T0 = C.chirp[0];
  const out = 1 - eIn(range(t, EN.morph[0] - 0.35, EN.morph[0]));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${WX} ${WY})`}>
          {/* the Big Bang: a flash and two shock rings */}
          <Stage t={t} a={C.bb} b={C.stars}>{(k, lt) => (
            <>
              <circle r={40 + 900 * eOut(lt / 1.2)} fill="#FFFFFF" opacity={Math.max(0, 0.9 - lt * 1.2)} />
              {[0, 0.25, 0.5].map((d, i) => <circle key={i} r={Math.max(0, (lt - d) * 260)} fill="none" stroke={ORIGIN.bb.c} strokeWidth={10 - i * 2} opacity={clamp01(1 - (lt - d) / 1.3)} />)}
              <circle r={70 * k} fill={ORIGIN.bb.c} stroke={P.ink} strokeWidth={6} />
            </>
          )}</Stage>
          {/* a massive star's onion of burning shells */}
          <Stage t={t} a={C.stars} b={C.sn}>{(k, lt) => (
            <g transform={`scale(${k * (1 + 0.03 * Math.sin(lt * 10))})`}>
              {[["#9FE8FF", 230], ["#FF6FB1", 190], ["#FFA94D", 150], ["#FF6B5A", 110], ["#2FC27E", 72], ["#4D7CFE", 38]].map(([c, r], i) => (
                <circle key={i} r={(r as number) * eOut(clamp01(lt * 3 - i * 0.12))} fill={c as string} stroke={P.ink} strokeWidth={5} />
              ))}
              {["H", "He", "C", "O", "Si", "Fe"].map((s, i) => (
                <text key={s} x={0} y={-[210, 170, 130, 92, 56, 0][i] + (i === 5 ? 12 : 0)} textAnchor="middle" fontFamily="'Space Grotesk'" fontWeight={700} fontSize={i === 5 ? 34 : 28} fill={P.ink}>{s}</text>
              ))}
            </g>
          )}</Stage>
          {/* it collapses and explodes */}
          <Stage t={t} a={C.sn} b={T0}>{(k, lt) => {
            const col = 1 - eIn(clamp01(lt / 0.12)), burst = eOut(clamp01((lt - 0.1) / 0.9));
            return (
              <>
                {Array.from({ length: 20 }, (_, i) => {
                  const a = (i / 20) * Math.PI * 2, r0 = 40 + 60 * burst, r1 = 80 + 280 * burst;
                  return <line key={i} x1={r0 * Math.cos(a)} y1={r0 * Math.sin(a)} x2={r1 * Math.cos(a)} y2={r1 * Math.sin(a)} stroke={i % 2 ? "#FF6B5A" : "#FFD23F"} strokeWidth={14} strokeLinecap="round" opacity={1 - 0.5 * burst} />;
                })}
                <circle r={60 + 200 * col} fill="#FF6B5A" stroke={P.ink} strokeWidth={6} opacity={col} />
                <circle r={30 + 230 * burst} fill="none" stroke="#FFFFFF" strokeWidth={8} opacity={1 - burst} />
                <circle r={26} fill="#DDE1EC" stroke={P.ink} strokeWidth={5} />
              </>
            );
          }}</Stage>
          {/* two neutron stars spiral in (r ∝ (tc − t)^¼) and merge */}
          <Stage t={t} a={T0} b={C.lab}>{(k, lt) => {
            const tau = Math.max(0, tc - t), r = 210 * Math.pow(tau / (tc - T0), 0.25), ph = -8 * Math.pow(tc - T0, 0.625) * Math.pow(Math.max(tau, 1e-4), 0.625) * 3.2;
            const merged = t >= tc, mk = eOut(range(t, tc, tc + 0.6));
            return (
              <>
                {!merged && Array.from({ length: 26 }, (_, i) => {
                  const tt = Math.max(0, tc - (t - i * 0.03)), rr = 210 * Math.pow(tt / (tc - T0), 0.25), pp = -8 * Math.pow(tc - T0, 0.625) * Math.pow(Math.max(tt, 1e-4), 0.625) * 3.2;
                  return [0, 1].map((j) => <circle key={i + "_" + j} cx={rr * Math.cos(pp + j * Math.PI)} cy={rr * Math.sin(pp + j * Math.PI)} r={18 - i * 0.5} fill="#FFFFFF" opacity={0.3 * (1 - i / 26)} />);
                })}
                {!merged && [0, 1].map((j) => <circle key={j} cx={r * Math.cos(ph + j * Math.PI)} cy={r * Math.sin(ph + j * Math.PI)} r={30} fill="#DDE1EC" stroke={P.ink} strokeWidth={6} />)}
                {merged && <>
                  <circle r={30 + 700 * mk} fill="#FFFFFF" opacity={0.85 * (1 - mk)} />
                  {Array.from({ length: 16 }, (_, i) => {
                    const a = (i / 16) * Math.PI * 2 + 0.2;
                    return <circle key={i} cx={(60 + 210 * mk) * Math.cos(a)} cy={(60 + 210 * mk) * Math.sin(a)} r={16 * (1 - 0.4 * mk)} fill={ORIGIN.ns.c} stroke={P.ink} strokeWidth={4} />;
                  })}
                  <circle r={80 * backOut(mk, 1.6)} fill={ORIGIN.ns.c} stroke={P.ink} strokeWidth={7} />
                  <text y={26} textAnchor="middle" fontFamily="'Space Grotesk'" fontWeight={700} fontSize={70 * mk} fill={P.ink}>Au</text>
                </>}
              </>
            );
          }}</Stage>
          {/* and the last ones were made by people */}
          <Stage t={t} a={C.lab} b={EN.morph[0]}>{(k, lt) => (
            <g transform={`scale(${k})`}>
              <circle r={120} fill="none" stroke="#DDE1EC" strokeWidth={20} />
              <circle r={120} fill="none" stroke={P.ink} strokeWidth={4} />
              {[0, 1].map((i) => <circle key={i} cx={120 * Math.cos(lt * 9 * (i ? -1 : 1))} cy={120 * Math.sin(lt * 9 * (i ? -1 : 1))} r={14} fill={i ? "#FF3D7F" : "#9FE8FF"} stroke={P.ink} strokeWidth={4} />)}
            </g>
          )}</Stage>
        </g>
      </svg>
      <Kin t={t} at={C.off + 0.05} out={C.bb} text="这些配料，产自哪里？" x={1590} y={WY - 40} size={54} color="#FFFFFF" anchor="center" />
      {([
        [C.bb, C.stars, "宇宙大爆炸", "氢、氦"],
        [C.stars, C.sn, "恒星内部", "碳、氮、氧……"],
        [C.sn, T0, "恒星爆炸", "氧、硅、铁……"],
        [T0, C.ns, "两颗中子星……", ""],
        [C.ns, C.lab, "中子星相撞", "金、铂、铀"],
        [C.lab, EN.morph[0], "实验室", "最重的那些"],
      ] as const).map(([a, b, big, small], i) => (
        <React.Fragment key={i}>
          <Kin t={t} at={a} out={b} text={big} x={WX} y={WY + 290} size={64} color="#FFFFFF" anchor="center" stagger={0.03} />
          {small && <Kin t={t} at={a + 0.2} out={b} text={"→ " + small} x={WX} y={WY + 380} size={42} color={["#9FE8FF", "#FFA94D", "#FF6B5A", "#FFD84D", "#FFD84D", "#DDE1EC"][i]} anchor="center" stagger={0.02} />}
        </React.Fragment>
      ))}
      {t > C.bb && (
        <div style={{ position: "absolute", left: 136, top: 958, display: "flex", gap: 22, fontFamily: FONT_CN, fontWeight: 900, fontSize: 24, color: "#FFFFFF", opacity: win(t, C.bb, EN.morph[0], 0.3, 0.3) }}>
          {(["bb", "cr", "lm", "ms", "wd", "ns", "hm"] as const).map((o) => {
            const on = { bb: C.bb, cr: C.sn, lm: C.stars, ms: C.sn, wd: C.sn, ns: C.ns, hm: C.lab }[o];
            const kk = eOut(range(t, on, on + 0.3));
            return <span key={o} style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.25 + 0.75 * kk }}><span style={{ width: 22, height: 22, background: ORIGIN[o].c, border: `3px solid ${P.ink}`, borderRadius: 4 }} />{ORIGIN[o].name}</span>;
          })}
          <span style={{ opacity: 0.55, fontWeight: 700 }}>简化示意</span>
        </div>
      )}
    </div>
  );
};

// ═══ the ending
const ORIG_TAG: Record<string, [string, string]> = { O: ["恒星爆炸", ORIGIN.ms.c], C: ["恒星", ORIGIN.lm.c], H: ["大爆炸", ORIGIN.bb.c], N: ["恒星", ORIGIN.lm.c], Ca: ["恒星爆炸", ORIGIN.ms.c], P: ["恒星爆炸", ORIGIN.ms.c] };
export const Ending6: React.FC<{ t: number }> = ({ t }) => {
  if (t < EN.morph[0]) return null;
  const rows: Row[] = YOU_ROWS([0, 0, 0, 0, 0, 0]).map((r, i) => ({ ...r, at: EN.label + 0.05 + i * 0.06, tag: ORIG_TAG[r.sym as string][0], tagC: ORIG_TAG[r.sym as string][1], tagAt: EN.tags[Math.floor(i / 2)] }));
  const cIn = backOut(range(t, EN.label, EN.label + 0.35), 1.6), cOut = eIn(range(t, EN.zoom[0] - 0.1, EN.zoom[0] + 0.25));
  const st = range(t, EN.stamp, EN.stamp + 0.18);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Kin t={t} at={EN.morph[0] + 0.3} out={EN.zoom[0]} text="再看一次，你的配料表" x={1390} y={86} size={56} color="#FFFFFF" anchor="center" />
      {t >= EN.label && t < EN.zoom[0] + 0.3 && (
        <div style={{ position: "absolute", left: 1080, top: 560, transform: `translate(${cOut * 900}px, -50%) scale(${0.8 * cIn}) rotate(${(1 - cIn) * 6}deg)`, transformOrigin: "left center", opacity: 1 - cOut }}>
          <Card t={t} title="配料表" rows={rows} at={EN.label} foot="按质量 · 约数" />
          {st > 0 && (
            <div style={{ position: "absolute", left: 250, top: 470, transform: `rotate(-12deg) scale(${lerp(2.4, 1, eIn(st))})`, opacity: clamp01(st * 3) * 0.95,
              border: "10px solid #E8202A", borderRadius: 16, padding: "8px 26px", color: "#E8202A", fontFamily: FONT_CN, fontWeight: 900, fontSize: 64, background: "rgba(255,255,255,0.75)", whiteSpace: "nowrap", letterSpacing: 2 }}>
              生产日期：早于地球
            </div>
          )}
        </div>
      )}
      <Kin t={t} at={EN.line} out={EN.back[0] + 0.1} text="你体内的氢，和宇宙一样老。" x={960} y={250} size={84} color="#FFFFFF" anchor="center" stagger={0.045} shadow="0 0 30px rgba(159,232,255,0.5)" />
      <Kin t={t} at={EN.sub} out={EN.back[0] + 0.1} text="其余的原子，来自星星。" x={960} y={760} size={58} color="#FFD84D" anchor="center" stagger={0.04} />
      <Kin t={t} at={EN.q - 0.1} out={EN.card} text="配料表，还没写完。" x={808} y={232} size={80} color={P.ink} anchor="center" stagger={0.05} />
      <EndCard t={t} />
    </div>
  );
};

const EndCard: React.FC<{ t: number }> = ({ t }) => {
  if (t < EN.card - 0.35) return null;
  const w = eInOut(range(t, EN.card - 0.34, EN.card)), X = -560 + 3040 * w;
  const k = backOut(range(t, EN.card, EN.card + 0.35), 1.7);
  const rows: Row[] = [
    { cn: "配料", text: "118 种（未完待续）", at: EN.card + 0.2 },
    { cn: "产地", text: "宇宙", at: EN.card + 0.35 },
    { cn: "生产日期", text: "138 亿年前起", at: EN.card + 0.5 },
  ];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <polygon points={`-700,0 ${X},0 ${X - 560},1080 -700,1080`} fill="#FFD23F" />
        {w < 1 && <polygon points={`${X},0 ${X + 60},0 ${X + 60 - 560},1080 ${X - 560},1080`} fill={P.ink} />}
      </svg>
      {t >= EN.card && (
        <div style={{ position: "absolute", left: 960, top: 540, transform: `translate(-50%, -50%) scale(${1.3 * k}) rotate(${(1 - k) * -4}deg)` }}>
          <Card t={t} title="元素周期表" rows={rows} at={EN.card} w={900} />
        </div>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 64, textAlign: "center", fontFamily: FONT_BIG, fontSize: 30, letterSpacing: 6, color: P.ink, opacity: eOut(range(t, EN.card + 0.7, EN.card + 1.1)) }}>
        THE INGREDIENTS OF EVERYTHING
      </div>
    </div>
  );
};
