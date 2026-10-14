// 儒 · act I — the character: a lone 亻 carved in stone; two strokes slide in beside it and make 仁; the bamboo-slip
// spelling (身 over 心); the students who asked what 仁 is; 「爱人」「知人」.
import React from "react";
import { Img, staticFile } from "remotion";
import { Art, BRONZE, Bar, CIN, Credit, Cut, DIM, Dust, eIn, eInOut, eOut, Hung, KAI, Layer, lerp, Note, range, RJ, RUB, SANS, Stone, Svg } from "./kit";

const HK = RJ.hook, ER = RJ.er, AS = RJ.ask, LV = RJ.love;

// the hero glyph: centre (cx, cy), size S. Its 二 half can be offset (slide-in) and the 亻 half is carved stroke by stroke.
// Geometry in em units, measured on LXGW WenKai TC: the split between 亻 and 二, and the two strokes of 二.
export const SPLIT = -0.185, SPLIT_HI = -0.09;
export const ER_TOP = { x: 0.113, y: -0.16, w: 0.495, h: 0.075 }, ER_BOT = { x: 0.131, y: 0.243, w: 0.673, h: 0.088 };
export const barOf = (cx: number, cy: number, S: number, e: typeof ER_TOP): Bar => ({ x: cx + e.x * S, y: cy + e.y * S, w: e.w * S, h: e.h * S });
export const Ren: React.FC<{ cx: number; cy: number; S: number; carve: number; slide: number; erO?: number; glow?: number; o?: number; id: string }> = ({ cx, cy, S, carve, slide, erO = 1, glow = 0, o = 1, id }) => {
  if (o <= 0.001) return null;
  const k1 = range(carve, 0, 0.45), k2 = range(carve, 0.45, 1);
  // the two strokes of 亻 as thick mask paths (em units → px): 丿 from upper right down to the left, then 丨 straight down
  const p1: [number, number][] = [[-0.2, -0.47], [-0.27, -0.3], [-0.36, -0.12], [-0.45, 0.02]], p2: [number, number][] = [[-0.3, -0.2], [-0.3, 0.2], [-0.3, 0.5]];
  const d = (P: [number, number][]) => P.map((p, i) => `${i ? "L" : "M"}${(cx + p[0] * S).toFixed(1)},${(cy + p[1] * S).toFixed(1)}`).join("");
  const L1 = 0.62 * S, L2 = 0.72 * S;
  const poly = (P: [number, number][]) => P.map((p, i) => `${i ? "L" : "M"}${(cx + p[0] * S).toFixed(1)},${(cy + p[1] * S).toFixed(1)}`).join("") + "Z";
  const txt = (clip: string) => <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontFamily={KAI} fontWeight={700} fontSize={S} fill={RUB} clipPath={`url(#${clip})`}>仁</text>;
  return (
    <g opacity={o} filter="url(#rubbed)">
      <defs>
        {/* 亻 and 二 overlap in x: the tip of 丿 reaches further right than the start of 二, so the cut steps */}
        <clipPath id={`${id}L`}><path d={poly([[-1, -1], [SPLIT_HI, -1], [SPLIT_HI, -0.3], [SPLIT, -0.3], [SPLIT, 1], [-1, 1]])} /></clipPath>
        <clipPath id={`${id}R`}><path d={poly([[SPLIT_HI, -1], [1, -1], [1, 1], [SPLIT, 1], [SPLIT, -0.3], [SPLIT_HI, -0.3]])} /></clipPath>
        <mask id={`${id}M`}>
          {k1 > 0 && <path d={d(p1)} stroke="#fff" strokeWidth={0.2 * S} fill="none" strokeLinecap="round" strokeDasharray={`${L1 * k1} ${L1 * 3}`} />}
          {k2 > 0 && <path d={d(p2)} stroke="#fff" strokeWidth={0.22 * S} fill="none" strokeLinecap="round" strokeDasharray={`${L2 * k2} ${L2 * 3}`} />}
        </mask>
      </defs>
      <g mask={`url(#${id}M)`}>{txt(`${id}L`)}</g>
      {erO > 0.001 && slide > 0 && <g transform={`translate(${(1 - slide) * 980},0)`} opacity={erO} style={{ filter: glow > 0 ? `drop-shadow(0 0 ${26 * glow}px rgba(255,236,200,${0.7 * glow}))` : undefined }}>{txt(`${id}R`)}</g>}
    </g>
  );
};

// where the hero stands over the first ten seconds
export const heroAt = (t: number) => {
  const k = eInOut(range(t, ER.bamboo, ER.bamboo + 0.7));
  return { cx: lerp(960, 640, k), cy: lerp(600, 610, k), S: lerp(560, 470, k) };
};
// the painting in the next scene hangs between these two rods
export const ASK_BOX: [number, number, number, number] = [140, 172, 880, 748];
export const HAND = ER.out - 0.3;   // when the glyph's 二 becomes the motif's two bars
export const HERO_END = { cx: 640, cy: 610, S: 470 };
export const rodTop = (b: number[]): Bar => ({ x: b[0] + b[2] / 2, y: b[1] - 16, w: b[2] + 70, h: 22 })
export const rodBot = (b: number[]): Bar => ({ x: b[0] + b[2] / 2, y: b[1] + b[3] + 16, w: b[2] + 70, h: 22 });

export const Hook: React.FC<{ t: number }> = ({ t }) => {
  if (t >= ER.out + 0.8) return null;
  const h = heroAt(t), carve = range(t, HK.carve, HK.carve + 1.1), slide = eOut(range(t, ER.slide, ER.slide + 0.5));
  const glow = Math.max(0, 1 - Math.abs(t - ER.slide - 0.6) / 0.6) + 0.35 * eOut(range(t, ER.l1, ER.l1 + 0.5)) * (1 - range(t, ER.bamboo, ER.bamboo + 0.5));
  // at the cut the glyph's 二 hands over to the two carved bars of the motif layer (motif.tsx)
  const hand = range(t, HAND - 0.1, HAND);
  const glyph = 1 - eIn(range(t, ER.out - 0.3, ER.out + 0.2));
  const slip = eOut(range(t, ER.bamboo + 0.2, ER.bamboo + 0.8));
  return (
    <Layer o={1 - eIn(range(t, ER.out + 0.3, ER.out + 0.8))}>
      <Layer o={1 - eIn(range(t, ER.out - 0.2, ER.out + 0.4))}><Stone /></Layer>
      <Svg>
        <Ren id="hero" cx={h.cx} cy={h.cy} S={h.S} carve={carve} slide={slide} erO={1 - hand} glow={glow} o={glyph} />
        <Dust x={h.cx - 0.3 * h.S} y={h.cy} t={t} a={HK.carve} b={HK.carve + 1.1} n={18} seed={3} />
        <Dust x={h.cx + 0.2 * h.S} y={h.cy + 0.3 * h.S} t={t} a={ER.slide + 0.4} b={ER.slide + 0.6} n={14} seed={9} />
      </Svg>
      <Cut t={t} at={HK.l1} out={ER.l1 - 0.3} text="孔子的“仁”，" x={960} y={70} size={76} anchor="center" />
      <Cut t={t} at={HK.l2} out={ER.l1 - 0.3} text="一个人，做不到。" x={960} y={170} size={76} anchor="center" hi="一个人" />
      <Cut t={t} at={ER.l1} out={ER.out} text="仁 ＝ 人 ＋ 二" x={960} y={80} size={88} anchor="center" hi="二" />
      <Note t={t} at={ER.l2} out={ER.bamboo + 0.3} text="《说文解字》：“仁，亲也。从人从二。”" x={960} y={206} anchor="center" size={36} />
      {/* the bamboo-slip spelling: 身 over 心 */}
      {slip > 0.001 && <Layer o={slip * (1 - eIn(range(t, ER.out - 0.3, ER.out + 0.1)))}>
        <BambooSlip x={1290} y={lerp(300, 260, slip)} />
        <Cut t={t} at={ER.bamboo + 0.35} out={ER.out + 0.2} text="战国竹简里，" x={1430} y={300} size={44} color={DIM} />
        <Cut t={t} at={ER.bamboo + 0.6} out={ER.out + 0.2} text="仁写作：上身下心" x={1430} y={366} size={44} color={DIM} hi="身心" hiColor={BRONZE} />
        <Cut t={t} at={ER.bamboo + 1.0} out={ER.out + 0.2} text="始于一颗心，" x={1430} y={540} size={58} />
        <Cut t={t} at={ER.bamboo + 1.45} out={ER.out + 0.2} text="成于两个人。" x={1430} y={626} size={58} hi="两个人" />
        <Note t={t} at={ER.bamboo + 0.5} out={ER.out + 0.2} text="郭店楚简 · 字形示意" x={1290} y={930} anchor="center" size={22} />
      </Layer>}
    </Layer>
  );
};

// a bamboo slip with 身 written over 心, packed into one character as on the 郭店 slips (示意)
const BambooSlip: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div style={{ position: "absolute", left: x - 62, top: y, width: 124, height: 640, borderRadius: 8,
    background: "linear-gradient(90deg, #6E5A33 0%, #B79A62 18%, #C9AE76 50%, #B79A62 82%, #6E5A33 100%)", boxShadow: "0 18px 40px rgba(0,0,0,0.7)" }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: 8, opacity: 0.35, background: "repeating-linear-gradient(90deg, rgba(60,40,10,0.0) 0px, rgba(60,40,10,0.0) 9px, rgba(60,40,10,0.5) 10px, rgba(60,40,10,0.0) 11px)" }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", flexDirection: "column", alignItems: "center", color: "#2A2016", fontFamily: KAI, fontWeight: 700 }}>
      <span style={{ fontSize: 96, lineHeight: 0.8, transform: "scaleY(0.72)", transformOrigin: "50% 100%" }}>身</span>
      <span style={{ fontSize: 96, lineHeight: 0.8, transform: "scaleY(0.6)", transformOrigin: "50% 0%" }}>心</span>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 420, display: "flex", flexDirection: "column", alignItems: "center", color: "rgba(42,32,22,0.35)", fontFamily: KAI, fontSize: 44, lineHeight: 1.1 }}>
      <span>者</span><span>人</span><span>也</span>
    </div>
  </div>);

// the students ask: the 孝经图 (Confucius teaching, 曾子 kneeling), and five students who got five answers
const ASKS: [string, string][] = [["颜渊问仁", "克己复礼为仁"], ["仲弓问仁", "己所不欲，勿施于人"], ["司马牛问仁", "仁者，其言也讱"], ["樊迟问仁", "爱人"], ["子张问仁", "恭、宽、信、敏、惠"]];
export const Ask: React.FC<{ t: number }> = ({ t }) => {
  if (t < AS.t - 0.5 || t >= AS.out + 0.6) return null;
  const pic = eInOut(range(t, AS.t - 0.1, AS.t + 0.6));
  // the rods (motif layer) carry on into the next scene: they shrink to the two strokes between the two 人
  const go = eInOut(range(t, AS.out - 0.4, AS.out + 0.4));
  return (
    <Layer o={1 - eIn(range(t, AS.out + 0.1, AS.out + 0.6))}>
      <Layer o={eOut(range(t, AS.t - 0.5, AS.t + 0.1))}><Stone /></Layer>
      <Layer o={(1 - go)}>
        <Hung src="ru_xiaojing.jpg" t={t} a={AS.t} b={AS.out} box={ASK_BOX} o={pic} from={[0.5, 0.5, 1.0]} to={[0.62, 0.52, 1.12]} rods={0} filter="sepia(0.2) contrast(1.05) brightness(0.95)" />
      </Layer>
      <Layer o={1 - go}>
        <Cut t={t} at={AS.l1} out={AS.out} text="学生问：什么是“仁”？" x={1090} y={150} size={56} />
        {ASKS.map(([who, ans], i) => {
          const s = AS.cascade[i], k = eOut(range(t, s, s + 0.4));
          return t < s ? null : <div key={i} style={{ position: "absolute", left: 1090 + (1 - k) * 60, top: 262 + i * 112, opacity: k }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24, color: CIN, letterSpacing: 2 }}>{who}</div>
            <div style={{ fontFamily: KAI, fontWeight: 700, fontSize: 48, color: RUB, lineHeight: 1.2, filter: "url(#rubbed)" }}>{ans}</div>
          </div>;
        })}
        <Cut t={t} at={AS.l2} out={AS.out} text="孔子看着眼前的人，回答。" x={1090} y={858} size={50} hi="眼前的人" />
        <Note t={t} at={AS.cascade[4] + 0.3} out={AS.out} text="《论语》颜渊篇、阳货篇" x={1090} y={950} size={22} />
        <Credit t={t} at={AS.t} out={AS.out} text="《孝经图 · 开宗明义章》（南宋）· 台北故宫博物院" />
      </Layer>
    </Layer>
  );
};

// 爱人 / 知人: two 人, mirrored, facing each other; the two strokes between them
export const LOVE_BARS: Bar[] = [{ x: 960, y: 566, w: 200, h: 24 }, { x: 960, y: 726, w: 272, h: 26 }];
export const LOVE_REN = { l: 590, r: 1330, y: 640, S: 430 };
export const Love: React.FC<{ t: number }> = ({ t }) => {
  if (t < LV.t - 0.5 || t >= LV.out + 0.6) return null;
  const a = eOut(range(t, LV.l1 + 0.6, LV.l1 + 1.2)), b = eOut(range(t, LV.l2 + 0.6, LV.l2 + 1.2)), lean = eInOut(range(t, LV.l3, LV.l3 + 1.2));
  const man = (x: number, k: number, flip: boolean) => k <= 0.001 ? null :
    <div style={{ position: "absolute", left: x - LOVE_REN.S / 2, top: LOVE_REN.y - LOVE_REN.S / 2, width: LOVE_REN.S, height: LOVE_REN.S, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: KAI, fontWeight: 700, fontSize: LOVE_REN.S, lineHeight: 1, color: RUB, opacity: k, filter: "url(#rubbed)",
      transform: `scaleX(${flip ? -1 : 1}) rotate(${lerp(0, 5, lean)}deg) scale(${lerp(1.06, 1, k)})`, textShadow: "0 3px 0 rgba(0,0,0,0.5)" }}>人</div>;
  const end = LV.out;
  return (
    <Layer o={Math.min(eOut(range(t, LV.t - 0.3, LV.t + 0.2)), 1)}>
      <Stone />
      {man(LOVE_REN.l, a, false)}
      {man(LOVE_REN.r, b, true)}
      <Cut t={t} at={LV.l1} out={end + 0.3} text="樊迟问仁。子曰：“爱人。”" x={960} y={70} size={66} anchor="center" hi="人" />
      <Cut t={t} at={LV.l2} out={end + 0.3} text="问知。子曰：“知人。”" x={960} y={168} size={66} anchor="center" hi="人" />
      <Cut t={t} at={LV.l3} out={end + 0.3} text="两个答案，都落在“人”上。" x={960} y={870} size={58} anchor="center" hi="人" />
      <Note t={t} at={LV.l3 + 0.9} out={end + 0.3} text="《论语 · 颜渊》　（“仁者爱人”这四个字，出自《孟子》）" x={960} y={972} anchor="center" size={24} />
    </Layer>
  );
};
export { Art, Img, staticFile, eIn };
