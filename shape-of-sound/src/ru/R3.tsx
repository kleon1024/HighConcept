// 儒 · act III — the man and the rings: fourteen years on the road (the 「丧家之狗」 he laughed at); the gatekeeper's
// verdict and a gate that opens on 「有教无类」, rings filling with pupils; the 曾侯乙 bells (whose rack's two beams are
// 二); and the glyph again, whole: 「德不孤，必有邻」「你从来不是一个人」. Curtain call: the portrait, the title.
import React from "react";
import { CIN, Credit, Cut, DIM, eIn, eInOut, eOut, Hung, KAI, Layer, lerp, Note, range, RJ, Ring, RUB, Seal, SANS, Stone, Svg } from "./kit";
import { Ren } from "./R1";

const TR = RJ.travel, GT = RJ.gate, BL = RJ.bells, EN = RJ.end;

// ---------- 周游列国 ----------
export const ROAD = { y: 880, x0: 100, x1: 1240 };
const STATES = ["鲁", "卫", "曹", "宋", "郑", "陈", "蔡", "楚"], SX = (i: number) => 150 + i * 150;
const WR = 78;
const wheelX = (t: number) => t < 56.2 ? lerp(SX(0), SX(4), eInOut(range(t, TR.l1, 56.2))) : lerp(SX(4), SX(7), eInOut(range(t, TR.l3 + 0.3, TR.out - 0.4)));
export const STELE_BOX: [number, number, number, number] = [1370, 110, 450, 851];
const Wheel: React.FC<{ x: number; y: number; r: number; a: number; o?: number }> = ({ x, y, r, a, o = 1 }) => (
  <g transform={`translate(${x},${y}) rotate(${a})`} opacity={o} filter="url(#rubbedSoft)">
    <circle r={r} fill="none" stroke={RUB} strokeWidth={9} />
    <circle r={r - 12} fill="none" stroke={RUB} strokeWidth={3} opacity={0.7} />
    {Array.from({ length: 14 }, (_, i) => { const q = (i / 14) * Math.PI * 2; return <line key={i} x1={Math.cos(q) * 14} y1={Math.sin(q) * 14} x2={Math.cos(q) * (r - 8)} y2={Math.sin(q) * (r - 8)} stroke={RUB} strokeWidth={4} />; })}
    <circle r={16} fill={RUB} />
  </g>);
export const Travel: React.FC<{ t: number }> = ({ t }) => {
  if (t < TR.t - 0.4 || t >= TR.out + 0.6) return null;
  const x = wheelX(t), bounce = Math.max(0, Math.sin((t - TR.l3 - 0.2) * 14)) * 10 * (t > TR.l3 + 0.2 && t < TR.l3 + 1.1 ? 1 : 0);
  const stele = eInOut(range(t, TR.l2 - 0.1, TR.l2 + 0.6));
  return (
    <Layer o={eOut(range(t, TR.t - 0.4, TR.t)) * (1 - eIn(range(t, TR.out - 0.1, TR.out + 0.5)))}>
      <Stone />
      <Svg>
        <Wheel x={x} y={ROAD.y - WR - 8 - bounce} r={WR} a={(x / WR) * 57.3} o={eOut(range(t, TR.t, TR.t + 0.5))} />
        {STATES.map((s, i) => <text key={s} x={SX(i)} y={ROAD.y + 54} textAnchor="middle" fontFamily={KAI} fontWeight={700} fontSize={36}
          fill={x >= SX(i) - 10 ? (i === 4 ? CIN : RUB) : "rgba(236,230,216,0.35)"} opacity={eOut(range(t, TR.t + 0.2 + i * 0.08, TR.t + 0.6 + i * 0.08))} filter="url(#rubbedSoft)">{s}</text>)}
      </Svg>
      <Note t={t} at={TR.t + 0.8} out={TR.out + 0.3} text="路线示意 · 约前497—前484" x={ROAD.x1} y={ROAD.y + 84} anchor="right" size={20} />
      <Hung src="ru_stele.jpg" t={t} a={TR.l2} b={TR.out} box={STELE_BOX} o={stele} from={[0.5, 0.5, 1.0]} to={[0.5, 0.3, 1.05]} filter="grayscale(1) contrast(1.05) sepia(0.12)" />
      <Cut t={t} at={TR.l1} out={TR.out + 0.3} text="孔子带着学生，周游列国十四年。" x={110} y={92} size={54} />
      <Note t={t} at={TR.l1 + 0.8} out={TR.out + 0.3} text="——《史记 · 孔子世家》" x={110} y={182} size={24} />
      <Cut t={t} at={TR.l2} out={TR.out + 0.3} text="在郑国和学生走散，有人笑他：" x={110} y={262} size={44} color={DIM} />
      <Cut t={t} at={TR.l2 + 0.9} out={TR.out + 0.3} text="“累累若丧家之狗。”" x={110} y={330} size={64} />
      <Cut t={t} at={TR.l3} out={TR.out + 0.3} text="孔子笑了：“然哉！然哉！”" x={110} y={470} size={60} hi="然哉！" />
      <Note t={t} at={TR.l3 + 0.8} out={TR.out + 0.3} text="（说得对！说得对！）" x={110} y={560} size={32} />
      <Credit t={t} at={TR.l2} out={TR.out} text="吴道子（款）《先师孔子行教像》碑 · 曲阜（《亚细亚大观》1920年代）" />
    </Layer>
  );
};

// ---------- the gate: 知其不可而为之 · 有教无类 ----------
export const LINTEL = { x: 960, y: 318, w: 700, h: 34 }, SILL = { x: 960, y: 905, w: 700, h: 26 };
const POSTS = [650, 1270], DOOR = { y0: 336, y1: 890 };
const RC = { x: 960, y: 612 }, RR = [330, 445, 565, 695, 830];
const Door: React.FC<{ x0: number; x1: number; open: number; left: boolean }> = ({ x0, x1, open, left }) => (
  <div style={{ position: "absolute", left: x0, top: DOOR.y0, width: x1 - x0, height: DOOR.y1 - DOOR.y0, background: "#0E0F12", border: `5px solid ${RUB}`, boxSizing: "border-box",
    transformOrigin: left ? "0% 50%" : "100% 50%", transform: `perspective(1600px) rotateY(${(left ? -1 : 1) * 84 * open}deg)`, filter: "url(#rubbedSoft)", opacity: 1 - 0.4 * open }}>
    {Array.from({ length: 5 }, (_, r) => Array.from({ length: 4 }, (_, c) =>
      <div key={`${r}${c}`} style={{ position: "absolute", left: 40 + c * ((x1 - x0 - 80) / 3) - 7, top: 70 + r * 100, width: 14, height: 14, borderRadius: 7, background: RUB, opacity: 0.8 }} />))}
  </div>);
// rings of small 人: the pupils
export const People: React.FC<{ t: number; at: number; o?: number; rings?: number[]; sq?: number; size?: number; step?: number }> = ({ t, at, o = 1, rings = RR, sq = 0.62, size = 30, step = 0.5 }) => {
  if (o <= 0.001 || t < at) return null;
  return <Svg style={{ opacity: o }}>
    {rings.map((r, i) => { const n = Math.round((2 * Math.PI * r * (0.5 + sq / 2)) / (size * 1.55));
      return Array.from({ length: n }, (_, j) => { const s = at + i * step + (j / n) * step * 0.9, k = eOut(range(t, s, s + 0.3)); if (k <= 0) return null;
        const q = (j / n) * Math.PI * 2 + i * 0.4;
        return <text key={`${i}-${j}`} x={RC.x + Math.cos(q) * r} y={RC.y + Math.sin(q) * r * sq} textAnchor="middle" dominantBaseline="central" fontFamily={KAI} fontWeight={700}
          fontSize={size * (1 - 0.06 * i)} fill={RUB} opacity={k * (0.95 - 0.12 * i)} filter="url(#rubbedSoft)">人</text>; }); })}
  </Svg>;
};
export const Gate: React.FC<{ t: number }> = ({ t }) => {
  if (t < GT.t - 0.4 || t >= GT.out + 0.6) return null;
  const open = eInOut(range(t, GT.l2 - 0.2, GT.l2 + 0.9)), gone = eInOut(range(t, GT.pupils + 0.2, GT.pupils + 1.0));
  const frame = eOut(range(t, GT.t, GT.t + 0.6)) * (1 - gone);
  return (
    <Layer o={eOut(range(t, GT.t - 0.4, GT.t)) * (1 - eIn(range(t, GT.out - 0.1, GT.out + 0.5)))}>
      <Stone />
      <People t={t} at={GT.pupils} />
      <Layer o={frame}>
        {POSTS.map((x) => <div key={x} style={{ position: "absolute", left: x - 22, top: DOOR.y0 - 6, width: 44, height: DOOR.y1 - DOOR.y0 + 12, background: RUB, filter: "url(#rubbed)" }} />)}
        <Door x0={POSTS[0] + 22} x1={960} open={open} left />
        <Door x0={960} x1={POSTS[1] - 22} open={open} left={false} />
      </Layer>
      <Cut t={t} at={GT.l2 + 0.3} out={GT.out + 0.3} text="有教无类" x={960} y={538} size={124} anchor="center" />
      <Cut t={t} at={GT.l1} out={GT.pupils} text="守门人这样说孔子：" x={960} y={78} size={44} anchor="center" color={DIM} />
      <Cut t={t} at={GT.l1 + 0.6} out={GT.pupils} text="“是知其不可而为之者与？”" x={960} y={146} size={62} anchor="center" />
      <Note t={t} at={GT.l1 + 1.5} out={GT.pupils} text="明知做不成，还偏要去做的那个人？——《论语 · 宪问》" x={960} y={242} anchor="center" size={26} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 880, bottom: 0, background: "linear-gradient(180deg, rgba(10,11,13,0) 0%, rgba(10,11,13,0.85) 45%)", opacity: eOut(range(t, GT.pupils + 0.4, GT.pupils + 1.0)) }} />
      <Note t={t} at={GT.pupils + 0.6} out={GT.out + 0.3} text="谁来学，都教。——《论语 · 卫灵公》" x={960} y={950} anchor="center" size={28} color={RUB} />
      <Note t={t} at={GT.pupils + 1.4} out={GT.out + 0.3} text="“弟子盖三千焉”——《史记 · 孔子世家》" x={960} y={996} anchor="center" size={24} />
    </Layer>
  );
};

// ---------- the bells ----------
export const BELL_BOX: [number, number, number, number] = [90, 140, 1100, 537];
const SC = BELL_BOX[2] / 700;   // the plate is the top of the photo; 700 px of it at 1024-px scale span the box
const bx = (x: number) => BELL_BOX[0] + x * SC, by = (y: number) => BELL_BOX[1] + y * SC;
const STRIKES: [number, number][] = [[52, 185], [140, 185], [236, 190], [312, 185], [386, 185], [452, 185], [512, 185]];
// the rack's two lacquered beams, above and below the row of bells: 二
export const BEAMS = [{ x: BELL_BOX[0] + BELL_BOX[2] / 2, y: by(60), w: BELL_BOX[2], h: 64 }, { x: BELL_BOX[0] + BELL_BOX[2] / 2, y: by(298), w: BELL_BOX[2], h: 64 }];
export const Bells: React.FC<{ t: number }> = ({ t }) => {
  if (t < BL.t - 0.5 || t >= BL.out + 0.6) return null;
  const pic = eInOut(range(t, BL.t - 0.4, BL.t + 0.5));
  return (
    <Layer o={eOut(range(t, BL.t - 0.5, BL.t - 0.1)) * (1 - eIn(range(t, BL.out - 0.1, BL.out + 0.5)))}>
      <Stone />
      <Hung src="ru_bells.jpg" t={t} a={BL.t} b={BL.out} box={BELL_BOX} o={pic} rods={0} from={[0.5, 0.5, 1.0]} to={[0.4, 0.5, 1.06]}
        filter="saturate(0.75) sepia(0.15) brightness(0.9) contrast(1.1)" />
      <Svg>
        {BL.strike.map((s, i) => { const u = (t - s) / 1.6; if (u < 0 || u > 1) return null;
          const [x, y] = STRIKES[i], major = s >= BL.major;
          return <g key={i}>
            <circle cx={bx(x)} cy={by(y)} r={40 + 60 * u} fill={`rgba(255,${major ? 226 : 214},170,${0.35 * (1 - u)})`} style={{ filter: "blur(12px)" }} />
            <Ring cx={bx(x)} cy={by(y)} r={30 + 260 * eOut(u)} o={(1 - u) * 0.85} w={3} sq={1} />
          </g>; })}
      </Svg>
      <Cut t={t} at={BL.l1} out={BL.out + 0.3} text="“四海之内，" x={1250} y={140} size={76} />
      <Cut t={t} at={BL.l1 + 0.8} out={BL.out + 0.3} text="皆兄弟也。”" x={1286} y={240} size={76} hi="兄弟" />
      <Note t={t} at={BL.l1 + 1.6} out={BL.out + 0.3} text="——子夏，安慰没有兄弟的同学" x={1286} y={352} size={26} />
      <Cut t={t} at={BL.l1 + 2.6} out={BL.out + 0.3} text="战国 · 曾侯乙编钟：" x={90} y={720} size={38} color={DIM} />
      <Cut t={t} at={BL.l1 + 3.2} out={BL.out + 0.3} text="一口钟，敲两处，响两个音。" x={90} y={786} size={50} />
      <Cut t={t} at={BL.major} out={BL.out + 0.3} text="和而不同。" x={1250} y={560} size={92} color={CIN} />
      <Note t={t} at={BL.major + 0.6} out={BL.out + 0.3} text="——《论语 · 子路》" x={1256} y={684} size={26} />
      <Credit t={t} at={BL.t} out={BL.out} text="曾侯乙编钟（战国，前433年或稍后）· 湖北省博物馆 · 摄影 Gary Todd（CC0）" />
    </Layer>
  );
};

// ---------- the end ----------
export const END_HERO = { cx: 960, cy: 540, S: 500 };
export const PORTRAIT_BOX: [number, number, number, number] = [250, 196, 500, 616];
export const END_HAND = EN.t + 0.7;
const CREDITS = [
  "画面：传马远《孔子像》（南宋）· 故宫博物院",
  "《孝经图 · 开宗明义章》（南宋）· 台北故宫博物院",
  "传李公麟《孝经图》、西周青铜簋 · 大都会艺术博物馆（CC0）",
  "吴道子（款）孔子像碑 · 曾侯乙编钟（摄影 Gary Todd，CC0）",
  "引文：《论语》《孟子》《大学》《史记》《说文》· 费孝通《乡土中国》",
  "配乐：埙、琴、笙、特磬、编钟、柷敔（合成）· 金声玉振",
];
export const End: React.FC<{ t: number }> = ({ t }) => {
  if (t < EN.t - 0.5) return null;
  const card = eInOut(range(t, EN.title - 0.2, EN.title + 0.7));
  const h = END_HERO, er = range(t, END_HAND - 0.1, END_HAND);
  return (
    <Layer o={eOut(range(t, EN.t - 0.5, EN.t)) * (1 - eIn(range(t, EN.out - 0.7, EN.out)))}>
      <Stone />
      <Layer o={1 - card}>
        <People t={t} at={EN.l2} rings={[400, 520, 650]} sq={0.6} size={26} step={0.35} o={0.55} />
        <Svg><Ren id="end" cx={h.cx} cy={h.cy} S={h.S} carve={eOut(range(t, EN.t - 0.2, EN.t + 0.6))} slide={1} erO={er} glow={0.4 * er} /></Svg>
        <Cut t={t} at={EN.l1} out={EN.title} text="德不孤，必有邻。" x={960} y={52} size={80} anchor="center" hi="邻" />
        <Note t={t} at={EN.l1 + 0.8} out={EN.title} text="——孔子《论语 · 里仁》" x={960} y={166} anchor="center" size={26} />
        <Cut t={t} at={EN.l2} out={EN.title} text="你从来不是一个人。" x={960} y={850} size={80} anchor="center" />
      </Layer>
      {card > 0.001 && <Layer o={card}>
        <Hung src="ru_kongzi.jpg" t={t} a={EN.title} b={EN.out} box={PORTRAIT_BOX} rods={0} from={[0.5, 0.35, 1.04]} to={[0.5, 0.3, 1.0]} filter="contrast(1.08) brightness(1.3)" />
        <Cut t={t} at={EN.title + 0.2} out={EN.out + 1} text="儒" x={900} y={186} size={230} />
        <Seal t={t} at={EN.title + 0.9} text="仁" x={1200} y={330} s={86} />
        <Cut t={t} at={EN.title + 0.6} out={EN.out + 1} text="一个人，成不了“仁”" x={904} y={490} size={52} color={DIM} hi="仁" />
        {CREDITS.map((c, i) => <Note key={i} t={t} at={EN.title + 1.0 + i * 0.08} out={EN.out + 1} text={c} x={904} y={640 + i * 34} size={20} />)}
      </Layer>}
    </Layer>
  );
};
export { SANS };
