// 红楼 · act II — the joy and the turn: the four 春 sisters in four windows (元迎探惜 = 原应叹息); the golden garden on
// the happiest night, whose four plays are four prophecies; the 太虚幻境 archway, the tea and the wine; the register,
// where every girl's ending is already written.
import React from "react";
import { Art, Col, Credit, eIn, eInOut, eOut, HJ, INK, INK2, Layer, lerp, Note, Paper, Pi, range, RED, Say, SERIF, Svg, Tag, Window, XING } from "./kit";
import { Rules } from "./H1";

const SS = HJ.sisters, GD = HJ.garden, TN = HJ.turn, RG = HJ.register;

// four sisters, four windows
export const SISTERS = [
  { img: "hlm_yuanchun.jpg", name: "元春", pun: "原", fate: "虎兕相逢大梦归", focus: [0.72, 0.56] as [number, number] },
  { img: "hlm_yingchun.jpg", name: "迎春", pun: "应", fate: "一载赴黄粱", focus: [0.36, 0.64] as [number, number] },
  { img: "hlm_tanchun.jpg", name: "探春", pun: "叹", fate: "千里东风一梦遥", focus: [0.33, 0.5] as [number, number] },
  { img: "hlm_xichun.jpg", name: "惜春", pun: "息", fate: "独卧青灯古佛旁", focus: [0.32, 0.36] as [number, number] },
];
export const WX = [360, 760, 1160, 1560];
export const Pane: React.FC<{ t: number; i: number; cx: number; cy: number; R: number; grey?: number; a: number; b: number }> = ({ t, i, cx, cy, R, grey = 0, a, b }) => {
  const s = SISTERS[i];
  return <Window cx={cx} cy={cy} R={R} wall="rgba(0,0,0,0)" frame={1}>
    <Art src={s.img} t={t} a={a} b={b} from={[s.focus[0], s.focus[1], 1.9]} to={[s.focus[0], s.focus[1], 2.05]} box={[cx - R * 1.1, cy - R * 1.1, R * 2.2, R * 2.2]}
      filter={`grayscale(${grey}) brightness(${1 - 0.25 * grey}) contrast(1.05)`} />
  </Window>;
};
export const Wall: React.FC<{ t: number; o?: number }> = ({ t, o = 1 }) => <Paper t={t} o={o} />;

export const Sisters: React.FC<{ t: number }> = ({ t }) => {
  if (t < SS.t - 0.5 || t >= SS.out + 0.8) return null;
  const pull = eInOut(range(t, SS.out - 0.3, SS.out + 0.6));
  return (
    <Layer o={eOut(range(t, SS.t - 0.4, SS.t + 0.1)) * (1 - eIn(range(t, SS.out + 0.2, SS.out + 0.7)))}>
      <Wall t={t} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1, 0.55, pull)})`, transformOrigin: "50% 45%" }}>
        {SISTERS.map((s, i) => { const R = 165 * eOut(range(t, SS.wins[i], SS.wins[i] + 0.5)); if (R <= 1) return null;
          const k = eOut(range(t, SS.decode[i], SS.decode[i] + 0.5));
          return <React.Fragment key={s.name}>
            <Pane t={t} i={i} cx={WX[i]} cy={430} R={R} a={SS.t} b={SS.out} />
            <div style={{ position: "absolute", left: WX[i] - 120, top: 640, width: 240, display: "flex", justifyContent: "center", fontFamily: SERIF, fontWeight: 700, fontSize: 76, color: INK,
              opacity: eOut(range(t, SS.wins[i] + 0.2, SS.wins[i] + 0.6)) }}>
              <span style={{ position: "relative", display: "inline-block", width: 80 }}>
                <span style={{ position: "absolute", left: 0, opacity: 1 - k }}>{s.name[0]}</span>
                <span style={{ position: "absolute", left: 0, opacity: k, color: RED, fontFamily: XING, fontWeight: 400, fontSize: 92, top: -10, transform: `scale(${lerp(1.4, 1, k)})` }}>{s.pun}</span>
              </span>
              <span style={{ opacity: 1 - 0.75 * k }}>{s.name[1]}</span>
            </div>
          </React.Fragment>; })}
      </div>
      <Layer o={1 - pull}>
        <Say t={t} at={SS.wins[0]} out={SS.out} text="贾府四姐妹：元春、迎春、探春、惜春" x={960} y={60} size={46} anchor="center" color={INK2} />
        <Say t={t} at={SS.l2} out={SS.out} text="元迎探惜 —— 原应叹息" x={960} y={790} size={72} anchor="center" hi="原应叹息" />
        <Note t={t} at={SS.l2 + 0.6} out={SS.out} text="本来，就应当叹息" x={960} y={900} anchor="center" size={30} color={INK2} />
        <Tag t={t} at={SS.decode[0] + 0.3} out={SS.out} text="甲戌本脂批：原也 · 应也 · 叹也 · 息也（四字连读出自读者）" x={960} y={970} anchor="center" />
        <Credit t={t} at={SS.t} out={SS.out} text="改琦《红楼梦图咏》· 元春 迎春 探春 惜春" />
      </Layer>
    </Layer>
  );
};

// ---------- the golden garden ----------
const PLAYS: [string, string][] = [["《豪宴》", "伏贾家之败"], ["《乞巧》", "伏元妃之死"], ["《仙缘》", "伏甄宝玉送玉"], ["《离魂》", "伏黛玉之死"]];
const GBOX: [number, number, number, number] = [160, 170, 1600, 900];
export const Garden: React.FC<{ t: number }> = ({ t }) => {
  if (t < GD.t - 0.6 || t >= GD.out + 0.6) return null;
  const inn = eInOut(range(t, GD.t - 0.5, GD.t + 0.6));
  return (
    <Layer o={eOut(range(t, GD.t - 0.5, GD.t)) * (1 - eIn(range(t, GD.out - 0.1, GD.out + 0.5)))}>
      <Paper t={t} />
      <div style={{ position: "absolute", left: GBOX[0], top: GBOX[1], width: GBOX[2], height: GBOX[3], boxShadow: "0 12px 40px rgba(60,40,20,0.3)", transform: `scale(${lerp(1.5, 1, inn)})`, transformOrigin: "50% 40%" }}>
        <Art src="hlm_garden.jpg" t={t} a={GD.t} b={GD.out} from={[0.3, 0.5, 1.12]} to={[0.62, 0.55, 1.2]} box={[0, 0, GBOX[2], GBOX[3]]} filter="saturate(1.1) contrast(1.04)" />
      </div>
      <Say t={t} at={GD.l1} out={GD.l2 - 0.1} text="最热闹的一夜：元妃省亲" x={960} y={52} size={60} anchor="center" />
      <Say t={t} at={GD.l2} out={GD.out} text="点的四出戏，伏下四件大事。" x={960} y={52} size={60} anchor="center" hi="伏" />
      {PLAYS.map(([p, f], i) => { const s = GD.plays[i], k = eOut(range(t, s, s + 0.35)); if (t < s) return null;
        return <div key={p} style={{ position: "absolute", left: 250 + i * 380, top: 800 + (1 - k) * 40, width: 330, height: 200, opacity: k * (1 - eIn(range(t, GD.out - 0.4, GD.out))),
          background: "rgba(246,240,228,0.94)", border: `3px solid ${RED}`, boxShadow: "0 8px 24px rgba(0,0,0,0.35)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 48, color: INK }}>{p}</div>
          <div style={{ fontFamily: XING, fontSize: 44, color: RED, clipPath: `inset(-20% ${(1 - eInOut(range(t, s + 0.3, s + 0.9))) * 100}% -20% 0)` }}>{f}</div>
        </div>; })}
      <Tag t={t} at={GD.plays[0] + 0.5} out={GD.out} text="第十八回 · 庚辰本脂批：所点之戏剧伏四事" x={1760} y={120} anchor="right" />
      <Credit t={t} at={GD.t} out={GD.out} text="孙温《全本红楼梦图》· 大观园（清，旅顺博物馆）" />
    </Layer>
  );
};

// ---------- the turn: 太虚幻境 ----------
const Arch: React.FC<{ o: number }> = ({ o }) => (o <= 0.001 ? null :
  <Svg style={{ opacity: o }}>
    <g fill="none" stroke={INK} strokeWidth={5}>
      <rect x={560} y={300} width={80} height={700} fill="rgba(255,255,255,0.35)" />
      <rect x={1280} y={300} width={80} height={700} fill="rgba(255,255,255,0.35)" />
      <path d="M470,300 L1450,300 L1420,250 L500,250 Z" fill="rgba(255,255,255,0.4)" />
      <path d="M420,250 Q960,170 1500,250" strokeWidth={7} />
      <rect x={760} y={180} width={400} height={110} fill="rgba(255,255,255,0.6)" />
    </g>
  </Svg>);
export const Turn: React.FC<{ t: number }> = ({ t }) => {
  if (t < TN.t - 0.5 || t >= TN.out + 0.6) return null;
  const arch = eOut(range(t, TN.arch - 0.2, TN.arch + 0.6)), back = eInOut(range(t, TN.tea - 0.4, TN.tea + 0.3));
  return (
    <Layer o={eOut(range(t, TN.t - 0.4, TN.t + 0.1)) * (1 - eIn(range(t, TN.out - 0.1, TN.out + 0.5)))}>
      <Paper t={t} />
      <Layer o={1 - 0.9 * back}>
        <Art src="hlm_baoyu.jpg" t={t} a={TN.t} b={TN.out} from={[0.5, 0.5, 1.0]} to={[0.5, 0.48, 1.06]} box={[660, 330, 600, 670]} o={0.55 * arch} filter="contrast(0.9) brightness(1.08)" />
        <Arch o={arch} />
        <Say t={t} at={TN.arch + 0.1} out={TN.out} text="太虚幻境" x={960} y={194} size={64} anchor="center" />
        <Col t={t} at={TN.arch + 0.5} out={TN.out} text="假作真时真亦假" x={1320} y={330} size={66} stagger={0.08} />
        <Col t={t} at={TN.arch + 1.1} out={TN.out} text="无为有处有还无" x={600} y={330} size={66} stagger={0.08} />
      </Layer>
      <Layer o={back}>
        <Say t={t} at={TN.tea} out={TN.out} text="茶名：千红一窟" x={330} y={420} size={62} anchor="center" />
        <Pi t={t} at={TN.tea + 0.7} out={TN.out} text="隐“哭”字" x={330} y={520} size={64} anchor="center" />
        <Say t={t} at={TN.wine} out={TN.out} text="酒名：万艳同杯" x={1590} y={420} size={62} anchor="center" />
        <Pi t={t} at={TN.wine + 0.6} out={TN.out} text="隐“悲”字" x={1590} y={520} size={64} anchor="center" />
        <Say t={t} at={TN.wine + 1.2} out={TN.out} text="千红一哭，万艳同悲。" x={960} y={700} size={76} anchor="center" hi="哭悲" />
        <Tag t={t} at={TN.tea + 0.9} out={TN.out} text="第五回 · 甲戌本脂批：隐“哭”字 · 隐“悲”字" x={960} y={880} anchor="center" />
      </Layer>
      <Credit t={t} at={TN.t} out={TN.tea} text="改琦《红楼梦图咏》· 贾宝玉" />
    </Layer>
  );
};

// ---------- the register ----------
const PAN = ["可叹停机德", "堪怜咏絮才", "玉带林中挂", "金簪雪里埋"];
export const Register: React.FC<{ t: number }> = ({ t }) => {
  if (t < RG.t - 0.5 || t >= RG.out + 0.6) return null;
  const sw = eInOut(range(t, RG.fates[0] - 0.6, RG.fates[0] - 0.1));
  return (
    <Layer o={eOut(range(t, RG.t - 0.4, RG.t + 0.1)) * (1 - eIn(range(t, RG.out - 0.1, RG.out + 0.5)))}>
      <Paper t={t} />
      <Layer o={1 - sw}>
        <Rules x0={1180} x1={1700} step={130} />
        {PAN.map((c, i) => <Col key={c} t={t} at={RG.page + i * 0.45} out={RG.out} text={c} x={1630 - i * 130} y={110} size={78} stagger={0.06} />)}
        <Window cx={420} cy={360} R={175} wall="rgba(0,0,0,0)"><Art src="hlm_daiyu.jpg" t={t} a={RG.t} b={RG.out} from={[0.6, 0.45, 1.6]} to={[0.6, 0.45, 1.7]} box={[227, 167, 386, 386]} /></Window>
        <Window cx={830} cy={360} R={175} wall="rgba(0,0,0,0)"><Art src="hlm_baochai.jpg" t={t} a={RG.t} b={RG.out} from={[0.35, 0.55, 1.6]} to={[0.35, 0.55, 1.7]} box={[637, 167, 386, 386]} /></Window>
        <Pi t={t} at={RG.decode} out={RG.out} text="玉带林 → 倒读：林黛玉" x={130} y={610} size={68} />
        <Pi t={t} at={RG.decode + 1.0} out={RG.out} text="雪里金簪 → 薛宝钗" x={130} y={710} size={68} />
        <Tag t={t} at={RG.page + 0.6} out={RG.out} text="第五回 · 金陵十二钗判词（正文）" x={140} y={840} kind="zheng" />
        <Note t={t} at={RG.decode + 1.6} out={RG.out} text="甲戌本脂批：“此句薛”“此句林”" x={140} y={890} size={24} color={RED} />
      </Layer>
      <Layer o={sw}>
        {SISTERS.map((s, i) => { const g = eInOut(range(t, RG.fates[i] + 0.3, RG.fates[i] + 1.0));
          return <React.Fragment key={s.name}>
            <Pane t={t} i={i} cx={WX[i]} cy={330} R={150} grey={g} a={RG.t} b={RG.out} />
            <div style={{ position: "absolute", left: WX[i] - 100, top: 510, width: 200, textAlign: "center", fontFamily: SERIF, fontWeight: 700, fontSize: 44, color: INK }}>{s.name}</div>
            <Col t={t} at={RG.fates[i]} out={RG.out} text={s.fate} x={WX[i]} y={590} size={52} red />
          </React.Fragment>; })}
        <Tag t={t} at={RG.fates[0] + 0.3} out={RG.out} text="第五回 · 判词（正文）" x={1860} y={980} anchor="right" kind="zheng" />
      </Layer>
      <Credit t={t} at={RG.t} out={RG.out} text="改琦《红楼梦图咏》" />
    </Layer>
  );
};
export { lerp };
