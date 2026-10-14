// 儒 · act II — outward: the golden rule carved as one column, then weighed (己 and 人 on one beam); the 己 drops
// like a stone into water, 「己欲立而立人」; 费孝通's rings (差序格局); the first ring is the family — a Western Zhou 簋
// and Li Gonglin's 孝经图 — and Mencius's word for the whole movement: 推.
import React from "react";
import { Img, staticFile } from "remotion";
import { BRONZE, CIN, Column, Credit, Cut, DIM, eIn, eInOut, eOut, Hung, KAI, Layer, lerp, Note, range, RJ, Ring, RUB, SANS, Stone, Svg } from "./kit";

const RL = RJ.rule, ST = RJ.stone, RP = RJ.ripple, VS = RJ.vessel;

// ---------- 己所不欲，勿施于人 ----------
const COL = { x: 960, y: 150, size: 92 }, STEP = 0.29, LH = 92 * 1.08;
export const BEAM = { y: 690, w: 900 }, BASE = { y: 860, w: 230 };
export const LEFT = { x: 520, y: 520 }, RIGHT = { x: 1400, y: 520 }, BIG = 250;
export const Rule: React.FC<{ t: number }> = ({ t }) => {
  if (t < RL.t - 0.5 || t >= RL.out + 0.6) return null;
  const sep = eInOut(range(t, RL.l2, RL.l2 + 0.9));
  const rest = 1 - eIn(range(t, RL.l2 - 0.1, RL.l2 + 0.4));
  const fall = eIn(range(t, RL.fall, RL.fall + 0.75));
  const settle = eOut(range(t, RL.l2 + 0.7, RL.l2 + 1.8)), wob = Math.sin((t - RL.l2) * 7) * 3 * (1 - settle) * (t > RL.l2 + 0.7 ? 1 : 0);
  const big = (ch: string, from: [number, number], to: [number, number], dy = 0, rot = 0) => {
    const x = lerp(from[0], to[0], sep), y = lerp(from[1], to[1], sep) + dy, s = lerp(COL.size, BIG, sep);
    return <div style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: KAI, fontWeight: 700, fontSize: s, lineHeight: 1, color: ch === "人" ? RUB : RUB, filter: "url(#rubbed)", transform: `rotate(${rot}deg)`, textShadow: "0 3px 0 rgba(0,0,0,0.5)" }}>{ch}</div>;
  };
  const c0: [number, number] = [COL.x, COL.y + LH / 2], c7: [number, number] = [COL.x, COL.y + 7 * LH + LH / 2];
  return (
    <Layer o={eOut(range(t, RL.t - 0.4, RL.t + 0.1)) * (1 - eIn(range(t, RL.out - 0.1, RL.out + 0.5)))}>
      <Stone />
      <Column t={t} at={RL.carve} out={RL.out + 0.5} text="己所不欲勿施于人" x={COL.x} y={COL.y} size={COL.size} stagger={STEP} hide={(i) => (i === 0 || i === 7 ? (t >= RL.l2 ? 0 : 1) : rest)} />
      {t >= RL.l2 && <>
        {fall < 1 && big("己", c0, [LEFT.x, LEFT.y], fall * 900 + wob, fall * -40)}
        {big("人", c7, [RIGHT.x, RIGHT.y], -wob)}
      </>}
      {/* the fulcrum post between the beam and its base */}
      <div style={{ position: "absolute", left: 960 - 9, top: BEAM.y, width: 18, height: BASE.y - BEAM.y, background: RUB, opacity: eOut(range(t, RL.l2 + 0.5, RL.l2 + 1.0)) * (1 - eIn(range(t, RL.fall + 0.3, RL.fall + 0.8))), filter: "url(#rubbed)" }} />
      <Cut t={t} at={RL.l2 + 1.0} out={RL.fall + 0.2} text="自己不想要的，别加给别人。" x={960} y={900} size={46} anchor="center" color={DIM} />
      <Note t={t} at={RL.l2 + 1.6} out={RL.fall + 0.2} text="这句话，《论语》里说了两次（颜渊篇、卫灵公篇）" x={960} y={985} anchor="center" size={24} />
    </Layer>
  );
};

// ---------- water ----------
export const WC = { x: 960, y: 640 };
const RINGS_R = [150, 270, 395, 525], LABELS = ["家", "乡里", "国", "天下"];
const SQ = 0.36;
const emitted = [ST.drop, ST.l1, ST.l2, ...Array.from({ length: 8 }, (_, i) => RP.t + i)];
// ring radius of the labelled rings over time (they settle at their radius, then shrink onto the 簋's rim)
export const ringR = (t: number, i: number) => RINGS_R[i] * eOut(range(t, RP.rings[i], RP.rings[i] + 0.9));
export const Water: React.FC<{ t: number }> = ({ t }) => {
  if (t < ST.t - 0.3 || t >= VS.t + 1.0) return null;
  const drop = range(t, ST.t + 0.0, ST.drop), dy = lerp(-160, WC.y, drop * drop);
  const into = eInOut(range(t, VS.t - 0.3, VS.t + 0.6));   // rings → the 簋's rim
  const cx = lerp(WC.x, GUI_RIM.x, into), cy = lerp(WC.y, GUI_RIM.y, into);
  return (
    <Layer o={eOut(range(t, ST.t - 0.3, ST.t + 0.1)) * (1 - eIn(range(t, VS.t + 0.4, VS.t + 1.0)))}>
      <Stone />
      {/* the water: the same stone, darker, with a faint sheen near the horizon */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,7,10,0.55) 0%, rgba(20,24,30,0.25) 45%, rgba(5,6,8,0.6) 100%)" }} />
      <Svg>
        {/* the falling stone: 己 */}
        {t < ST.drop + 0.12 && <text x={WC.x} y={dy} textAnchor="middle" dominantBaseline="central" fontFamily={KAI} fontWeight={700} fontSize={130} fill={RUB} filter="url(#rubbed)"
          transform={`rotate(${lerp(-40, 0, drop)} ${WC.x} ${dy}) scale(1)`} opacity={1 - range(t, ST.drop, ST.drop + 0.12)}>己</text>}
        {/* splash */}
        {Array.from({ length: 16 }, (_, i) => { const u = (t - ST.drop) / 0.8; if (u < 0 || u > 1) return null;
          const a = -Math.PI * (0.1 + 0.8 * (i / 15)), v = 120 + 80 * ((i * 37) % 7) / 7;
          return <circle key={i} cx={WC.x + Math.cos(a) * v * u} cy={WC.y + Math.sin(a) * v * u * 1.4 + 260 * u * u} r={3.5 - 2 * u} fill={RUB} opacity={1 - u} />; })}
        {/* rings emitted by the stone and the music's pulses */}
        {emitted.map((s, i) => { const u = (t - s) / 4.2; if (u < 0 || u > 1) return null;
          return <Ring key={i} cx={WC.x} cy={WC.y} r={30 + 820 * eOut(u)} o={(1 - u) ** 1.4 * (i < 3 ? 0.9 : 0.5) * (1 - into)} w={i < 3 ? 4 : 2.5} sq={SQ} />; })}
        {/* the centre: 己, a small glowing stone under the water */}
        {t >= ST.drop && <g opacity={eOut(range(t, ST.drop + 0.4, ST.drop + 1.2)) * (1 - into)}>
          <circle cx={WC.x} cy={WC.y} r={34} fill="rgba(236,230,216,0.12)" />
          <text x={WC.x} y={WC.y} textAnchor="middle" dominantBaseline="central" fontFamily={KAI} fontWeight={700} fontSize={56} fill={RUB} filter="url(#rubbed)">己</text>
        </g>}
        {/* the labelled rings of 差序格局 */}
        {RINGS_R.map((_, i) => { const r = ringR(t, i); if (r <= 0) return null;
          const rr = lerp(r, GUI_RIM.rx * (0.5 + 0.18 * i), into);
          return <g key={i}>
            <Ring cx={cx} cy={cy} r={rr} sq={lerp(SQ, GUI_RIM.ry / GUI_RIM.rx, into)} o={0.95 * (1 - 0.4 * into)} w={4} />
            {(() => { const a = -0.42, lx = cx + Math.cos(a) * rr + 12, ly = cy + Math.sin(a) * rr * SQ - 8;
              return <text x={lx} y={ly} fontFamily={KAI} fontWeight={700} fontSize={44} fill={i === 0 ? CIN : RUB} filter="url(#rubbed)" opacity={eOut(range(t, RP.rings[i] + 0.3, RP.rings[i] + 0.8)) * (1 - into)}>{LABELS[i]}</text>; })()}
          </g>; })}
      </Svg>
      {/* text: 雍也 and 费孝通 */}
      <Cut t={t} at={ST.l1} out={RP.t + 0.1} text="己欲立而立人，" x={960} y={70} size={74} anchor="center" hi="人" />
      <Cut t={t} at={ST.l2} out={RP.t + 0.1} text="己欲达而达人。" x={960} y={172} size={74} anchor="center" hi="人" />
      <Note t={t} at={ST.l2 + 1.0} out={RP.t + 0.1} text="自己想站稳，也扶别人站稳；自己想走通，也帮别人走通。——《论语 · 雍也》" x={960} y={985} anchor="center" size={24} />
      <Cut t={t} at={RP.l1} out={VS.t} text="“像把一块石头丢在水面上，" x={960} y={64} size={60} anchor="center" />
      <Cut t={t} at={RP.l2} out={VS.t} text="一圈圈推出去的波纹。”" x={960} y={154} size={60} anchor="center" hi="推" />
      <Note t={t} at={RP.l2 + 0.8} out={VS.t} text="——费孝通《乡土中国》（节引）" x={960} y={250} anchor="center" size={26} />
      <Note t={t} at={RP.rings[3] + 0.6} out={VS.t} text="《大学》：身修而后家齐，家齐而后国治，国治而后天下平" x={960} y={985} anchor="center" size={24} />
    </Layer>
  );
};

// ---------- the first ring: the family ----------
// the 簋 cut-out (1400×1050 png) placed so the rim of its lid sits at GUI_RIM
const GUI = { s: 0.95, rimX: 690, rimY: 300 };
export const GUI_RIM = { x: 960, y: 372, rx: 150, ry: 42 };
export const FAMILY_BOX: [number, number, number, number] = [1100, 150, 640, 782];
export const Vessel: React.FC<{ t: number }> = ({ t }) => {
  if (t < VS.t - 0.4 || t >= VS.out + 0.6) return null;
  const g = eOut(range(t, VS.t - 0.2, VS.t + 0.7)), away = eInOut(range(t, VS.family - 0.2, VS.family + 0.6));
  const pic = eInOut(range(t, VS.family, VS.family + 0.7));
  const L = GUI_RIM.x - GUI.rimX * GUI.s, T = GUI_RIM.y - GUI.rimY * GUI.s;
  return (
    <Layer o={eOut(range(t, VS.t - 0.4, VS.t)) * (1 - eIn(range(t, VS.out - 0.1, VS.out + 0.5)))}>
      <Stone />
      <Img src={staticFile("media/ru_gui.png")} style={{ position: "absolute", left: lerp(L, L - 520, away), top: T, width: 1400 * GUI.s, height: 1050 * GUI.s, opacity: g * (1 - away),
        transform: `scale(${lerp(1, 0.8, away)})`, transformOrigin: "50% 40%", filter: "drop-shadow(0 30px 40px rgba(0,0,0,0.6)) brightness(0.95)" }} />
      <Cut t={t} at={VS.l1} out={VS.family + 0.2} text="第一圈：家。" x={120} y={130} size={76} hi="家" />
      <Note t={t} at={VS.l1 + 0.7} out={VS.family + 0.2} text="西周 · 青铜簋：盛黍稷，祭祖先" x={120} y={250} size={28} color={BRONZE} />
      <Hung src="ru_family.jpg" t={t} a={VS.family} b={VS.out} box={FAMILY_BOX} o={pic} rods={0} from={[0.5, 0.45, 1.0]} to={[0.5, 0.5, 1.07]} filter="contrast(1.1) brightness(1.2)" />
      <Cut t={t} at={VS.l2} out={VS.out + 0.3} text="老吾老，以及人之老；" x={110} y={300} size={60} hi="人" />
      <Cut t={t} at={VS.l2 + 1.5} out={VS.out + 0.3} text="幼吾幼，以及人之幼。" x={110} y={394} size={60} hi="人" />
      <Note t={t} at={VS.l2 + 2.2} out={VS.out + 0.3} text="——《孟子 · 梁惠王上》" x={110} y={500} size={26} />
      <Cut t={t} at={VS.l2 + 3.1} out={VS.out + 0.3} text="孟子管这叫——" x={110} y={600} size={46} color={DIM} />
      <Cut t={t} at={VS.l2 + 3.7} out={VS.out + 0.3} text="推" x={110} y={660} size={210} color={CIN} />
      <Note t={t} at={VS.l2 + 4.3} out={VS.out + 0.3} text="费孝通（大意）：孔子最看重的，就是这个“推”字。" x={110} y={940} size={26} />
      <Credit t={t} at={VS.t} out={VS.family} text="西周 青铜簋（前11—前10世纪）· 大都会艺术博物馆" />
      <Credit t={t} at={VS.family} out={VS.out} text="传李公麟《孝经图》（北宋，约1085）· 大都会艺术博物馆" />
    </Layer>
  );
};
export { SANS, eIn };
