// 什么是爱 — the theatre: a velvet curtain with embroidered gold words (it rises on the prologue, falls for the
// intermission between joy and grief, falls again before the curtain call, and closes on the title), the act
// labels, and the curtain call — the cast (eight paintings) bow one by one under their spotlights.
import React from "react";
import { Img, staticFile } from "remotion";
import { GOLD, GOLDL, INK, LATIN, LJ, Layer, PAPER, SERIF, Svg, eIn, eInOut, eOut, lerp, range, rnd } from "./kit";

const C = LJ.curtain;
// how closed the curtain is: 1 = closed, 0 = open
export const curtainAt = (t: number) => {
  const seg = (a: [number, number], open: boolean) => (open ? 1 - eInOut(range(t, a[0], a[1])) : eInOut(range(t, a[0], a[1])));
  if (t < C.close2[0]) return seg(C.open1 as [number, number], true);
  if (t < C.open2[0]) return seg(C.close2 as [number, number], false);
  if (t < C.close3[0]) return seg(C.open2 as [number, number], true);
  if (t < C.open3[0]) return seg(C.close3 as [number, number], false);
  if (t < C.close4[0]) return seg(C.open3 as [number, number], true);
  return seg(C.close4 as [number, number], false);
};
// the theatre frame (valance, drapes) is on screen only around the curtain moments
const frameAt = (t: number) => Math.max(1 - eIn(range(t, 5.0, 6.0)), Math.min(eOut(range(t, 45.4, 45.9)), 1 - eIn(range(t, 48.4, 49.2))), eOut(range(t, 89.6, 90.2)));

const Panel: React.FC<{ side: -1 | 1; c: number; t: number }> = ({ side, c, t }) => {
  const w = lerp(150, 1010, c), sway = Math.sin(t * 1.3 + side) * 6 * (1 - Math.abs(c - 0.5) * 2);
  const period = lerp(46, 120, c);
  const pts: string[] = [];
  for (let i = 0; i <= 20; i++) { const y = i / 20, bulge = (1 - c) * 60 * Math.sin(Math.PI * Math.min(1, y * 1.15)) + sway * y;
    pts.push(`${side < 0 ? w - bulge : 1920 - w + bulge}px ${y * 1080}px`); }
  const poly = side < 0 ? `polygon(0px 0px, ${pts.join(", ")}, 0px 1080px)` : `polygon(1920px 0px, ${pts.join(", ")}, 1920px 1080px)`;
  return (
    <div style={{ position: "absolute", inset: 0, clipPath: poly,
      background: `linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.55) 100%), repeating-linear-gradient(90deg, #4A0712 0px, #8C1123 ${period * 0.3}px, #C01C33 ${period * 0.5}px, #8C1123 ${period * 0.7}px, #4A0712 ${period}px)`,
      backgroundPosition: `${side < 0 ? 0 : 1920 - w}px 0px` }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 34, background: `repeating-linear-gradient(90deg, ${GOLD} 0px, ${GOLDL} 3px, ${GOLD} 5px, #7A5A1A 8px)`, opacity: 0.9 }} />
    </div>
  );
};

export const Curtain: React.FC<{ t: number }> = ({ t }) => {
  const c = curtainAt(t), f = frameAt(t);
  if (c <= 0.001 && f <= 0.001) return null;
  const words = (at: number, until: number) => Math.min(eOut(range(t, at, at + 0.6)), 1 - eIn(range(t, until - 0.4, until)));
  return (
    <>
      {c > 0.001 && <><Panel side={-1} c={c} t={t} /><Panel side={1} c={c} t={t} /></>}
      {c > 0.82 && (() => {
        const o = eOut(range(c, 0.82, 1));
        const emb = { fontFamily: SERIF, fontWeight: 900, backgroundImage: "linear-gradient(170deg, #FFF0C2 0%, #E2B95A 40%, #A7782A 70%, #F2D58A 100%)", WebkitBackgroundClip: "text" as const, backgroundClip: "text" as const,
          color: "transparent", filter: "drop-shadow(0 3px 2px rgba(40,0,5,0.8)) drop-shadow(0 0 18px rgba(242,214,142,0.35))", whiteSpace: "nowrap" as const };
        return <Layer o={o}>
          {t < 3 && <>
            <div style={{ position: "absolute", left: 960, top: 360, transform: "translate(-50%, -50%)", fontSize: 104, ...emb, opacity: words(-1, 99) }}>五千朵玫瑰，</div>
            <div style={{ position: "absolute", left: 960, top: 520, transform: "translate(-50%, -50%)", fontSize: 104, ...emb, opacity: words(LJ.hook.q2 - 0.3, 99) }}>为什么你只爱这一朵？</div>
          </>}
          {t > 44 && t < 49 && <>
            <div style={{ position: "absolute", left: 960, top: 450, transform: "translate(-50%, -50%)", fontSize: 54, letterSpacing: 18, ...emb }}>第四幕</div>
            <div style={{ position: "absolute", left: 960, top: 560, transform: "translate(-50%, -50%)", fontSize: 110, letterSpacing: 30, ...emb }}>失去</div>
          </>}
          {t > 89 && t < 93 && <div style={{ position: "absolute", left: 960, top: 520, transform: "translate(-50%, -50%)", fontSize: 130, letterSpacing: 40, ...emb }}>谢幕</div>}
          {t > 95 && <>
            <div style={{ position: "absolute", left: 960, top: 470, transform: "translate(-50%, -50%)", fontSize: 140, letterSpacing: 20, ...emb }}>什么是爱</div>
            <div style={{ position: "absolute", left: 960, top: 610, transform: "translate(-50%, -50%)", fontSize: 40, ...emb, fontFamily: LATIN, fontStyle: "italic", fontWeight: 600 }}>« On ne voit bien qu'avec le cœur. »</div>
          </>}
        </Layer>;
      })()}
      {f > 0.001 && <Layer o={f}>
        {/* the valance: a swagged pelmet with gold fringe */}
        <Svg>
          <defs><linearGradient id="val" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3A050E" /><stop offset="100%" stopColor="#9C1428" /></linearGradient></defs>
          <path d={`M0,0 L1920,0 L1920,70 ${Array.from({ length: 8 }, (_, i) => { const x0 = 1920 - i * 240, x1 = x0 - 240; return `Q${(x0 + x1) / 2},170 ${x1},70`; }).join(" ")} Z`} fill="url(#val)" />
          <path d={`M1920,70 ${Array.from({ length: 8 }, (_, i) => { const x0 = 1920 - i * 240, x1 = x0 - 240; return `Q${(x0 + x1) / 2},170 ${x1},70`; }).join(" ")}`} fill="none" stroke={GOLD} strokeWidth={6} />
          {Array.from({ length: 8 }, (_, i) => <g key={i}><circle cx={1920 - i * 240 - 240} cy={74} r={10} fill={GOLDL} /><path d={`M${1920 - i * 240 - 240},84 l-8,46 l16,0 z`} fill={GOLD} /></g>)}
        </Svg>
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 160px 40px rgba(0,0,0,0.75)", pointerEvents: "none" }} />
      </Layer>}
    </>
  );
};

// the playbill label at the start of each act
export const ActLabel: React.FC<{ t: number }> = ({ t }) => {
  const acts = LJ.acts as [number, string, string][];
  const light = [false, true, false, false, false, false, true, false];
  return <>{acts.map(([at, act, name], i) => {
    if (!name || t < at + (i === 0 ? 4.0 : 0.3) || t > at + (i === 0 ? 5.6 : 3.0)) return null;
    const a = at + (i === 0 ? 4.0 : 0.3), b = at + (i === 0 ? 5.6 : 3.0), o = Math.min(eOut(range(t, a, a + 0.5)), 1 - eIn(range(t, b - 0.5, b)));
    const col = light[i] ? INK : GOLDL;
    return <div key={i} style={{ position: "absolute", left: 120, top: i === 0 || i === 4 ? 200 : 56, opacity: o, display: "flex", alignItems: "center", gap: 18, fontFamily: SERIF, color: col, textShadow: light[i] ? undefined : "0 2px 10px rgba(0,0,0,0.6)" }}>
      <div style={{ width: 60 * o, height: 1.5, background: col }} />
      <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: 8 }}>{act}</span>
      <span style={{ fontSize: 34, fontWeight: 900, letterSpacing: 10 }}>{name}</span>
    </div>;
  })}</>;
};

// the curtain call: eight paintings bow in turn under their spotlights
const CAST: [string, string, string, [number, number]][] = [
  ["lv_rose.jpg", "玫瑰", "雷杜德", [0.58, 0.28]], ["lv_foxes.jpg", "狐狸", "马尔克", [0.5, 0.5]], ["lv_romeo.jpg", "罗密欧与朱丽叶", "迪克西", [0.5, 0.4]],
  ["lv_wheat.jpg", "麦田", "梵高", [0.4, 0.7]], ["lv_geese.jpg", "雁", "歌川广重", [0.5, 0.3]], ["lv_loquat.jpg", "枇杷树", "林椿", [0.5, 0.5]],
  ["lv_bride.jpg", "新娘", "伦勃朗", [0.55, 0.55]], ["lv_kiss.jpg", "吻", "克里姆特", [0.5, 0.35]]];
export const CurtainCall: React.FC<{ t: number }> = ({ t }) => {
  const K = LJ.call;
  if (t < K.t - 0.2) return null;
  const all = eOut(range(t, K.bows[7] + 0.5, K.bows[7] + 1.1));
  return (
    <Layer o={1}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 110%, #3A1418 0%, #170A0C 55%, #0B0506 100%)" }} />
      <Svg>{Array.from({ length: 60 }, (_, i) => <circle key={i} cx={rnd(i) * 1920} cy={880 + rnd(i + 1) * 200} r={1 + rnd(i + 2) * 1.6} fill="#FFDCA0" opacity={0.08 + 0.12 * rnd(i + 3)} />)}</Svg>
      <div style={{ position: "absolute", left: 960, top: 150, transform: "translateX(-50%)", fontFamily: SERIF, fontWeight: 600, fontSize: 30, letterSpacing: 16, color: GOLDL, opacity: eOut(range(t, K.t + 0.6, K.t + 1.2)) }}>感 谢 出 演</div>
      {CAST.map(([src, role, by, [fx, fy]], i) => {
        const x = 165 + i * 227, at = K.bows[i];
        const lit = Math.max(eOut(range(t, at - 0.15, at + 0.3)) * (1 - 0.5 * eIn(range(t, at + 0.5, at + 0.9))), 0.5 * eOut(range(t, at + 0.5, at + 0.9)), all);
        const bow = Math.sin(Math.PI * range(t, at, at + 0.6));
        return <React.Fragment key={i}>
          <div style={{ position: "absolute", left: x - 140, top: 0, width: 280, height: 1080, background: "linear-gradient(180deg, rgba(255,225,160,0.0) 0%, rgba(255,225,160,0.10) 35%, rgba(255,225,160,0.22) 70%, rgba(255,225,160,0) 100%)",
            clipPath: "polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)", opacity: 0.3 + 0.7 * lit }} />
          <div style={{ position: "absolute", left: x - 92, top: 330, width: 184, height: 246, transform: `translateY(${bow * 22}px) rotateX(${bow * 14}deg)`, transformOrigin: "50% 100%",
            boxShadow: `0 0 0 8px #B8892C, 0 0 0 11px #6E4E14, 0 18px 40px rgba(0,0,0,0.7), 0 0 ${40 * lit}px rgba(255,220,150,${0.5 * lit})`, overflow: "hidden", filter: `brightness(${0.45 + 0.6 * lit})`,
            opacity: eOut(range(t, K.t + 0.2 + i * 0.06, K.t + 0.8 + i * 0.06)) }}>
            <Img src={staticFile(`media/${src}`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${fx * 100}% ${fy * 100}%` }} />
          </div>
          <div style={{ position: "absolute", left: x, top: 610, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap", opacity: (0.4 + 0.6 * lit) * eOut(range(t, K.t + 0.6, K.t + 1.2)) }}>
            <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: role.length > 4 ? 22 : 32, color: PAPER }}>{role}</div>
            <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: "#C8A870", marginTop: 6 }}>{by}</div>
          </div>
        </React.Fragment>;
      })}
      <div style={{ position: "absolute", left: 960, top: 780, transform: "translateX(-50%)", textAlign: "center", fontFamily: SERIF, fontWeight: 600, fontSize: 24, color: "#B8A080", lineHeight: 1.7, whiteSpace: "nowrap",
        opacity: eOut(range(t, K.bows[7], K.bows[7] + 0.6)) }}>
        原著：圣埃克苏佩里《小王子》· 柏拉图《会饮篇》· 莎士比亚 · 元好问 · 归有光 · 里尔克 · 弗洛姆 · 汤显祖 · 苏轼
      </div>
    </Layer>
  );
};
