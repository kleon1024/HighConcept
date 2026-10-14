// The middle: 留白 (Ma Yuan's lone fisherman — the white is river, mist and sky), water (上善若水; the softest
// wears the hardest), the cook (庄子·养生主: the blade only travels the gaps), the useless tree (庄子·人间世) and
// the butterfly (庄子·齐物论).
import React from "react";
import { Art, BRUSH, Brush, Columns, Credit, DJ, INK, INK2, Layer, Note, Paper, Pt, SEAL, Say, Svg, WASH, eIn, eInOut, eOut, fade, lerp, range, rnd } from "./kit";

const LB = DJ.liubai, WA = DJ.water, CK = DJ.cook, TR = DJ.tree, FL = DJ.fly;
export const SILK = "brightness(1.75) contrast(0.82) saturate(0.55) sepia(0.25)";
const scene = (t: number, a: number, b: number) => Math.min(eOut(range(t, a - 0.5, a + 0.3)), 1 - eInOut(range(t, b - 0.3, b + 0.5)));

export const Liubai: React.FC<{ t: number }> = ({ t }) => {
  if (t < LB.t - 0.5 || t >= LB.out + 0.6) return null;
  return (
    <Layer o={scene(t, LB.t, LB.out)}>
      <Paper />
      <Art src="dao_fisher.jpg" t={t} a={LB.t - 0.5} b={LB.out + 0.5} from={[0.5, 0.55, 1.0]} to={[0.5, 0.56, 1.12]} filter={SILK} />
      <Say t={t} at={LB.l1} out={LB.hush} text="中国画，为什么留这么多白？" x={110} y={110} size={60} weight={900} />
      <Say t={t} at={LB.l2} out={LB.l3} text="那片白，是江水，是雾，是天。" x={110} y={110} size={60} weight={900} />
      <Say t={t} at={LB.l3} out={LB.out + 0.3} text="空着的地方，让画能呼吸。" x={110} y={110} size={60} weight={900} />
      <Note t={t} at={LB.l2 + 0.6} out={LB.out} text="“马一角”：南宋马远，常把画面大半留空" x={112} y={200} size={24} color={INK2} />
      <Credit t={t} at={LB.t} out={LB.out} text="传马远《寒江独钓图》（南宋）· 东京国立博物馆" />
    </Layer>
  );
};

// water: drops fall on a stone, faster and faster (the same times as the score's drops), and wear a hollow in it
export const dropTimes = (() => { const out: number[] = []; let s = WA.drip, k = 0; while (s < WA.out - 0.3) { out.push(s); s += Math.max(0.18, 0.86 ** k); k++; } return out; })();
export const Water: React.FC<{ t: number }> = ({ t }) => {
  if (t < WA.t - 0.5 || t >= WA.out + 0.6) return null;
  const SX = 1240, SY = 820;
  const worn = eInOut(range(t, WA.drip, WA.out - 0.4));
  const years = Math.round(Math.pow(10, 3 * worn));
  return (
    <Layer o={scene(t, WA.t, WA.out)}>
      <Paper />
      <Svg>
        {/* the stone: layered ink washes (dark at the base, paler on top) with dry texture strokes (皴) */}
        <defs>
          <radialGradient id="stoneG" cx="0.45" cy="0.2" r="0.95"><stop offset="0" stopColor="#8E897E" /><stop offset="0.55" stopColor="#5C584F" /><stop offset="1" stopColor="#2B2925" /></radialGradient>
          <filter id="stoneR" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves={3} seed={7} /><feDisplacementMap in="SourceGraphic" scale={22} xChannelSelector="R" yChannelSelector="G" /></filter>
        </defs>
        <ellipse cx={SX} cy={SY + 70} rx={360} ry={50} fill={INK} opacity={0.18} style={{ filter: "blur(16px)" }} />
        <g filter="url(#stoneR)">
          <path d={`M ${SX - 320},${SY + 80} C ${SX - 330},${SY - 30} ${SX - 170},${SY - 150} ${SX - 20},${SY - 142} C ${SX + 170},${SY - 150} ${SX + 310},${SY - 50} ${SX + 320},${SY + 80} Z`} fill="url(#stoneG)" opacity={0.92} />
          <path d={`M ${SX - 320},${SY + 80} C ${SX - 300},${SY + 10} ${SX - 200},${SY - 30} ${SX - 120},${SY + 20} C ${SX - 40},${SY + 60} ${SX + 120},${SY + 10} ${SX + 320},${SY + 80} Z`} fill={INK} opacity={0.35} style={{ filter: "blur(5px)" }} />
        </g>
        <Brush id="stoneA" pts={[[SX - 310, SY + 70], [SX - 280, SY - 10], [SX - 190, SY - 100], [SX - 60, SY - 140]]} w={12} k={1} seed={41} o={0.85} />
        <Brush id="stoneB" pts={[[SX + 70, SY - 138], [SX + 200, SY - 100], [SX + 290, SY - 20], [SX + 315, SY + 70]]} w={10} k={1} seed={43} o={0.8} />
        {[[-200, -40, 90], [-60, -80, 120], [90, -60, 110], [180, 0, 80], [-120, 20, 100]].map(([dx, dy, L], i) =>
          <Brush key={i} id={`cun${i}`} pts={[[SX + dx, SY + dy], [SX + dx + L * 0.5, SY + dy + 18], [SX + dx + L, SY + dy + 10]]} w={6} k={1} seed={50 + i} o={0.55} />)}
        {/* the hollow the drops have worn */}
        <ellipse cx={SX} cy={SY - 134} rx={18 + 60 * worn} ry={5 + 18 * worn} fill="#2A2824" opacity={0.12 + 0.4 * worn} style={{ filter: "blur(3px)" }} />
        <ellipse cx={SX} cy={SY - 137} rx={(18 + 60 * worn) * 0.65} ry={(5 + 18 * worn) * 0.45} fill="#B9C4C4" opacity={0.45 * worn} style={{ filter: "blur(2px)" }} />
        {/* the drops */}
        {dropTimes.map((s, i) => { const u = (t - (s - 0.42)) / 0.42; if (u < 0 || u > 1.6) return null;
          if (u <= 1) { const y = lerp(120, SY - 140, u * u); return <ellipse key={i} cx={SX} cy={y} rx={7} ry={11} fill={INK2} opacity={0.85} />; }
          const v = (u - 1) / 0.6; return <g key={i} opacity={1 - v}>{[-1, 1].map((d) => <circle key={d} cx={SX + d * 40 * v} cy={SY - 140 - 30 * Math.sin(Math.PI * v)} r={4} fill={INK2} />)}<ellipse cx={SX} cy={SY - 136} rx={30 + 60 * v} ry={6 + 10 * v} fill="none" stroke={INK2} strokeWidth={2} /></g>; })}
      </Svg>
      <Columns t={t} at={WA.l1} out={WA.l2} x={300} y={120} size={100} cols={["上善若水"]} />
      <Say t={t} at={WA.l1 + 0.6} out={WA.l2} text="最好的样子，像水。" x={110} y={620} size={46} weight={900} />
      <Note t={t} at={WA.l1 + 0.8} out={WA.l2} text="《道德经》第八章" x={112} y={690} size={22} />
      <Columns t={t} at={WA.l2} out={WA.out + 0.3} x={420} y={110} size={64} gap={1.4} cols={["天下莫柔弱于水，", "而攻坚强者莫之能胜。"]} stagger={0.06} />
      <Say t={t} at={WA.l3} out={WA.out + 0.3} text="最软的，能穿过最硬的。" x={110} y={820} size={46} weight={900} />
      <Note t={t} at={WA.l2 + 0.6} out={WA.out} text="《道德经》第七十八章" x={112} y={900} size={22} />
      <div style={{ position: "absolute", left: SX + 260, top: SY - 260, fontFamily: BRUSH, fontSize: 54, color: INK2, opacity: fade(t, WA.drip + 0.5, WA.out, 0.4, 0.4) }}>{years >= 1000 ? "一千年" : years >= 100 ? "一百年" : years >= 10 ? "十年" : "一年"}</div>
    </Layer>
  );
};

// the cook: the ox (from 韩滉《五牛图》); the gaps between the joints light up; the blade glides along them only
const GAPS: Pt[][] = [
  [[0.33, 0.22], [0.34, 0.42], [0.36, 0.62]], [[0.47, 0.20], [0.46, 0.45], [0.45, 0.68]], [[0.64, 0.20], [0.64, 0.42], [0.64, 0.64]],
  [[0.33, 0.22], [0.47, 0.20], [0.64, 0.20], [0.80, 0.22]], [[0.36, 0.62], [0.45, 0.68], [0.64, 0.64], [0.80, 0.62]],
];
export const Cook: React.FC<{ t: number }> = ({ t }) => {
  if (t < CK.t - 0.5 || t >= CK.out + 0.6) return null;
  const box = { x: 380, y: 250, w: 1240, h: 785 };
  const P = (p: Pt): Pt => [box.x + p[0] * box.w, box.y + p[1] * box.h];
  const gk = eInOut(range(t, CK.gaps, CK.gaps + 1.2));
  const path: Pt[] = [GAPS[3][0], GAPS[3][1], GAPS[1][1], GAPS[4][1], GAPS[2][1], GAPS[2][2], GAPS[4][2], GAPS[3][3]].map(P);
  const kk = range(t, CK.knife, CK.l3 - 0.2);
  const seg = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1])), L = seg.reduce((a, b) => a + b, 0);
  let sdist = kk * L, bx = path[0][0], by = path[0][1], ang = 0;
  for (let i = 0; i < seg.length; i++) { if (sdist <= seg[i]) { const u = sdist / seg[i]; bx = lerp(path[i][0], path[i + 1][0], u); by = lerp(path[i][1], path[i + 1][1], u); ang = Math.atan2(path[i + 1][1] - path[i][1], path[i + 1][0] - path[i][0]); break; } sdist -= seg[i]; }
  return (
    <Layer o={scene(t, CK.t, CK.out)}>
      <Paper />
      <Art src="dao_ox.jpg" t={t} a={CK.t - 0.5} b={CK.out + 0.5} from={[0.5, 0.5, 1.0]} to={[0.5, 0.5, 1.0]} box={[box.x, box.y, box.w, box.h]} filter="sepia(0.15) contrast(1.05)" mask="radial-gradient(ellipse at 50% 50%, #000 62%, transparent 76%)" />
      <Svg>
        <g opacity={gk * (1 - eIn(range(t, CK.l4, CK.out)))} fill="none" stroke={SEAL} strokeWidth={4} strokeDasharray="10 10" strokeLinecap="round">
          {GAPS.map((g, i) => <path key={i} d={"M" + g.map(P).map((p) => p.join(",")).join("L")} opacity={0.75} />)}
        </g>
        {kk > 0 && kk < 1 && <g transform={`translate(${bx},${by}) rotate(${(ang * 180) / Math.PI})`}>
          <path d="M -70,0 L 40,-7 L 60,0 L 40,7 Z" fill="#E8E4DA" stroke={INK} strokeWidth={2} />
          <line x1={-70} y1={0} x2={-120} y2={0} stroke={INK} strokeWidth={10} strokeLinecap="round" />
        </g>}
        {kk > 0 && <path d={"M" + path.map((p) => p.join(",")).join("L")} fill="none" stroke={SEAL} strokeWidth={6} strokeDasharray={`${L * kk} ${L * 2}`} opacity={0.9 * (1 - eIn(range(t, CK.l4, CK.out)))} />}
      </Svg>
      <Say t={t} at={CK.l1} out={CK.l2} text="庄子讲过一个厨师——庖丁。" x={110} y={90} size={54} weight={900} />
      <Say t={t} at={CK.l2} out={CK.l3} text="一把刀用了十九年，还像新磨的。" x={110} y={90} size={54} weight={900} />
      <Columns t={t} at={CK.l3} out={CK.out + 0.3} x={1760} y={120} size={80} cols={["以无厚入有间"]} />
      <Say t={t} at={CK.l3 + 0.8} out={CK.l4} text="刀刃没有厚度，骨节之间有空隙。" x={110} y={90} size={48} weight={600} color={INK2} />
      <Say t={t} at={CK.l4} out={CK.out + 0.3} text="不硬碰，顺着空隙走。" x={110} y={90} size={60} weight={900} />
      <Note t={t} at={CK.l1 + 0.4} out={CK.out} text="《庄子·养生主》· 图为示意" x={112} y={170} size={22} />
      <Credit t={t} at={CK.t} out={CK.out} text="韩滉《五牛图》（唐）局部 · 故宫博物院" />
    </Layer>
  );
};

export const Tree: React.FC<{ t: number }> = ({ t }) => {
  if (t < TR.t - 0.5 || t >= TR.out + 0.6) return null;
  return (
    <Layer o={scene(t, TR.t, TR.out)}>
      <Paper />
      <Art src="dao_tree.jpg" t={t} a={TR.t - 0.5} b={TR.out + 0.5} from={[0.55, 0.45, 1.18]} to={[0.5, 0.42, 1.0]} filter="brightness(1.5) contrast(0.95) saturate(0.6) sepia(0.2)" />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(238,230,211,0.9) 0%, rgba(238,230,211,0.5) 35%, rgba(238,230,211,0) 55%)" }} />
      <Say t={t} at={TR.l1} out={TR.l2} text="木匠说：这树歪歪扭扭，没用。" x={110} y={110} size={54} weight={900} />
      <Say t={t} at={TR.l2} out={TR.l3} text="所以没人砍它，它活成了神树。" x={110} y={110} size={54} weight={900} />
      <Columns t={t} at={TR.l3} out={TR.out + 0.3} x={560} y={110} size={64} gap={1.4} cols={["人皆知有用之用，", "而莫知无用之用也。"]} stagger={0.06} />
      <Say t={t} at={TR.l3 + 1.0} out={TR.out + 0.3} text="“没用”，也是一种用。" x={110} y={880} size={48} weight={900} />
      <Credit t={t} at={TR.t} out={TR.out} text="郭熙《树色平远图》（北宋）局部 · 大都会艺术博物馆" />
      <Note t={t} at={TR.l1 + 0.4} out={TR.out} text="《庄子·人间世》· 大意" x={112} y={190} size={22} />
    </Layer>
  );
};

export const Fly: React.FC<{ t: number }> = ({ t }) => {
  if (t < FL.t - 0.5 || t >= FL.out + 0.6) return null;
  return (
    <Layer o={scene(t, FL.t, FL.out)}>
      <Paper />
      <Art src="dao_fly.jpg" t={t} a={FL.t - 0.5} b={FL.out + 0.5} from={[0.62, 0.42, 1.25]} to={[0.55, 0.52, 1.0]} filter="sepia(0.15) contrast(1.04)" />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(238,230,211,0.88) 0%, rgba(238,230,211,0.0) 38%)" }} />
      <Say t={t} at={FL.l1} out={FL.l2} text="庄周梦见自己变成了蝴蝶。" x={960} y={90} size={56} anchor="center" weight={900} />
      <Say t={t} at={FL.l2} out={FL.out + 0.3} text="醒来：是我梦见了蝶，还是蝶梦见了我？" x={960} y={90} size={52} anchor="center" weight={900} />
      <Note t={t} at={FL.l1 + 0.4} out={FL.out} text="《庄子·齐物论》· 大意" x={960} y={175} anchor="center" size={22} />
      <Credit t={t} at={FL.t} out={FL.out} text="陆治《梦蝶图》（明）" />
    </Layer>
  );
};
export { rnd, WASH };
