// 红楼 · act I — the first page: a garden window onto 林黛玉; the stone left over when the sky was mended (36,501 made,
// 36,500 used); the author's own names for his storytellers (甄士隐 = 真事隐, 贾雨村 = 假语村言); and the name game
// the 脂批 play — every name is a spoiler.
import React from "react";
import { Art, Col, Credit, eIn, eInOut, eOut, FAINT, HJ, INK, INK2, Layer, lerp, Note, Paper, Pi, range, RED, rnd, Say, SERIF, Svg, Tag, Window } from "./kit";

const HK = HJ.hook, ST = HJ.stone, NM = HJ.names, GM = HJ.game;

// ---------- hook ----------
export const Hook: React.FC<{ t: number }> = ({ t }) => {
  if (t >= HK.out + 0.6) return null;
  const push = eIn(range(t, HK.push, HK.out + 0.3)), R = lerp(300, 2600, push);
  return (
    <Layer o={1 - eIn(range(t, HK.out + 0.1, HK.out + 0.5))}>
      <Window cx={960} cy={610} R={R} frame={1 - push}>
        <Paper t={t} />
        <Art src="hlm_daiyu.jpg" t={t} a={0} b={HK.out} from={[0.6, 0.45, 1.45]} to={[0.6, 0.42, 1.6]} o={1 - eInOut(range(t, HK.push, HK.push + 0.6))} box={[610, 260, 700, 700]} />
      </Window>
      <Layer o={1 - eIn(range(t, HK.push - 0.2, HK.push + 0.3))}>
        <Say t={t} at={HK.l1} out={HK.out} text="《红楼梦》第一页，" x={960} y={50} size={66} anchor="center" />
        <Say t={t} at={HK.l2} out={HK.out} text="就写好了所有人的结局。" x={960} y={140} size={72} anchor="center" hi="结局" />
        <Credit t={t} at={0.4} out={HK.out} text="改琦《红楼梦图咏》· 林黛玉" />
      </Layer>
    </Layer>
  );
};

// ---------- the stone ----------
const STONES = Array.from({ length: 360 }, (_, i) => ({ x: 120 + rnd(i * 3 + 1) * 900, y: 560 + rnd(i * 5 + 2) * 470, r: 3 + 5 * rnd(i * 7 + 3), d: rnd(i * 11 + 4) }));
export const Stone: React.FC<{ t: number }> = ({ t }) => {
  if (t < ST.t - 0.5 || t >= ST.out + 0.6) return null;
  const n = Math.round(36501 * eOut(range(t, ST.count, ST.fly)));
  const zoom = eInOut(range(t, ST.one, ST.one + 1.4));
  return (
    <Layer o={eOut(range(t, ST.t - 0.4, ST.t + 0.1)) * (1 - eIn(range(t, ST.out - 0.1, ST.out + 0.5)))}>
      <Paper t={t} />
      <Art src="hlm_stone.jpg" t={t} a={ST.one} b={ST.out} from={[0.5, 0.55, 1.0]} to={[0.5, 0.56, 1.35]} box={[1120, 70, 640, 942]} filter="contrast(1.05)" />
      <div style={{ position: "absolute", left: 1120, top: 70, width: 640, height: 942, boxShadow: "0 10px 40px rgba(60,40,20,0.25)", outline: "1px solid rgba(60,40,20,0.25)" }} />
      <Svg>
        {/* the glow on the one stone that was left */}
        <circle cx={1440} cy={lerp(590, 600, zoom)} r={lerp(60, 150, zoom)} fill="rgba(179,36,43,0.10)" opacity={eOut(range(t, ST.one, ST.one + 0.6)) * (1 - range(t, ST.out - 0.6, ST.out))} style={{ filter: "blur(18px)" }} />
        {/* 36,500 stones (a few hundred drawn) go up to mend the sky */}
        {t < ST.one + 0.5 && STONES.map((s, i) => { const u = eIn(range(t, ST.fly + s.d * 0.5, ST.fly + 0.5 + s.d * 0.5)), k = eOut(range(t, ST.count + s.d * 0.9, ST.count + 0.2 + s.d * 0.9));
          return k > 0 ? <ellipse key={i} cx={s.x + Math.sin(i) * 30 * u} cy={s.y - u * (s.y + 60)} rx={s.r} ry={s.r * 0.75} fill={INK2} opacity={k * 0.55 * (1 - u * 0.3)} /> : null; })}
      </Svg>
      <Say t={t} at={ST.l1} out={ST.out} text="第一回：女娲炼石补天，" x={130} y={90} size={52} />
      {t >= ST.count && <div style={{ position: "absolute", left: 130, top: 170, fontFamily: SERIF, fontWeight: 900, fontSize: 132, color: INK, letterSpacing: 4, opacity: eOut(range(t, ST.count, ST.count + 0.3)) * (1 - eIn(range(t, ST.out - 0.4, ST.out))) }}>
        {n.toLocaleString("en-US").replace(/,/g, "")}<span style={{ fontSize: 52, fontWeight: 600, marginLeft: 12 }}>块</span></div>}
      <Say t={t} at={ST.fly} out={ST.out} text="用了 36500 块，" x={130} y={350} size={52} color={INK2} />
      <Say t={t} at={ST.one} out={ST.out} text="只剩 1 块——" x={130} y={430} size={64} hi="1" />
      <Say t={t} at={ST.l2 + 0.4} out={ST.out} text="就是《石头记》里的那块石头。" x={130} y={540} size={46} />
      <Pi t={t} at={ST.pi} out={ST.out} text="剩了这一块，便生出这许多故事。" x={130} y={690} size={58} />
      <Tag t={t} at={ST.pi + 0.6} out={ST.out} text="甲戌本 · 脂批" x={130} y={780} />
      <Note t={t} at={ST.l1 + 0.6} out={ST.out} text="正文：炼成顽石三万六千五百零一块，只用了三万六千五百块" x={130} y={980} size={22} color={FAINT} />
      <Credit t={t} at={ST.t} out={ST.out} text="改琦《红楼梦图咏》· 通灵宝石、绛珠仙草" />
    </Layer>
  );
};

// ---------- a manuscript page: thin red column rules ----------
export const Rules: React.FC<{ o?: number; x0?: number; x1?: number; step?: number }> = ({ o = 1, x0 = 230, x1 = 1700, step = 130 }) => (o <= 0.001 ? null :
  <Svg style={{ opacity: o }}>
    <rect x={x0 - 30} y={70} width={x1 - x0 + 60} height={760} fill="none" stroke={RED} strokeWidth={3} opacity={0.35} />
    {Array.from({ length: Math.floor((x1 - x0) / step) + 1 }, (_, i) => <line key={i} x1={x0 + i * step} y1={70} x2={x0 + i * step} y2={830} stroke={RED} strokeWidth={1.4} opacity={0.22} />)}
  </Svg>);

// ---------- the author's names ----------
export const Names: React.FC<{ t: number }> = ({ t }) => {
  if (t < NM.t - 0.5 || t >= NM.out + 0.6) return null;
  return (
    <Layer o={eOut(range(t, NM.t - 0.4, NM.t + 0.1)) * (1 - eIn(range(t, NM.out - 0.1, NM.out + 0.4)))}>
      <Paper t={t} />
      <Rules />
      <Col t={t} at={NM.zhen} out={NM.out} text="甄士隐" x={1300} y={150} size={130} />
      <Col t={t} at={NM.zhenpi} out={NM.out} text="真事隐" x={1150} y={190} size={104} red />
      <Col t={t} at={NM.jia} out={NM.out} text="贾雨村" x={800} y={150} size={130} />
      <Col t={t} at={NM.jiapi} out={NM.out} text="假语村言" x={650} y={170} size={96} red />
      <Say t={t} at={NM.jiapi + 0.6} out={NM.out} text="名字里，藏着作者的话。" x={960} y={862} size={54} anchor="center" />
      <Note t={t} at={NM.zhen + 0.4} out={NM.out} text="第一回开卷自云：“将真事隐去”……“用假语村言”（甲戌本脂批亦逐字注出）" x={960} y={970} anchor="center" size={22} />
    </Layer>
  );
};

// ---------- the name game ----------
const GAME: [string, string][] = [["英莲", "应怜"], ["霍启", "祸起"], ["卜世仁", "不是人"], ["詹光", "沾光"], ["单聘仁", "善骗人"]];
const GX = [1560, 1290, 1020, 750, 480];
export const Game: React.FC<{ t: number }> = ({ t }) => {
  if (t < GM.t - 0.5 || t >= GM.out + 0.6) return null;
  return (
    <Layer o={eOut(range(t, GM.t - 0.4, GM.t + 0.1)) * (1 - eIn(range(t, GM.out - 0.1, GM.out + 0.4)))}>
      <Paper t={t} />
      <Rules />
      {GAME.map(([a, b], i) => <React.Fragment key={a}>
        <Col t={t} at={GM.items[i]} out={GM.out} text={a} x={GX[i] + 40} y={130} size={96} stagger={0.05} />
        <Col t={t} at={GM.items[i] + 0.35} out={GM.out} text={b} x={GX[i] - 72} y={160} size={84} red />
      </React.Fragment>)}
      <Say t={t} at={GM.l} out={GM.out} text="连名字，都是剧透。" x={960} y={862} size={64} anchor="center" hi="剧透" />
      <Tag t={t} at={GM.items[0] + 0.6} out={GM.out} text="甲戌本 · 庚辰本 · 脂批" x={1700} y={975} anchor="right" />
    </Layer>
  );
};
export { eIn };
