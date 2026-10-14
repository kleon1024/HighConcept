// 红楼 · act III — the fall and the lift: 葬花 (the elegy 脂砚斋 calls a gatha for all the girls); 好了歌 with the names
// the commentator pinned to its lines; why he knew (1728, the 曹 house sealed; 「满纸荒唐言」; the 眉批 on his death);
// white everywhere (飞鸟各投林); then the first page again, the girls back in their windows, and the title.
import React from "react";
import { Art, Col, Credit, eIn, eInOut, eOut, Fall, HJ, INK, INK2, Layer, lerp, Note, Paper, Pi, range, RED, Say, Seal, SERIF, Tag, Window, XING } from "./kit";

const ZH = HJ.zanghua, HL = HJ.haole, WY = HJ.why, WH = HJ.white, LF = HJ.lift;

export const Zanghua: React.FC<{ t: number }> = ({ t }) => {
  if (t < ZH.t - 0.5 || t >= ZH.out + 0.6) return null;
  return (
    <Layer o={eOut(range(t, ZH.t - 0.5, ZH.t + 0.1)) * (1 - eIn(range(t, ZH.out - 0.1, ZH.out + 0.5)))}>
      <Paper t={t} />
      <Art src="hlm_zanghua.jpg" t={t} a={ZH.t} b={ZH.out} from={[0.5, 0.5, 1.0]} to={[0.42, 0.55, 1.18]} filter="saturate(0.9) contrast(1.03)" />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(240,236,228,0) 55%, rgba(240,236,228,0.55) 80%)" }} />
      <Fall t={t} a={ZH.t + 0.2} n={36} kind="petal" seed={5} />
      <Col t={t} at={ZH.l1} out={ZH.out} text="侬今葬花人笑痴" x={1740} y={110} size={74} stagger={0.1} />
      <Col t={t} at={ZH.l2} out={ZH.out} text="他年葬侬知是谁" x={1620} y={110} size={74} stagger={0.1} />
      <div style={{ position: "absolute", left: 90, top: 850, width: 860, height: 170, background: "rgba(244,240,232,0.82)", opacity: eOut(range(t, ZH.pi - 0.3, ZH.pi + 0.2)) * (1 - eIn(range(t, ZH.out - 0.4, ZH.out))) }} />
      <Pi t={t} at={ZH.pi} out={ZH.out} text="《葬花吟》又系诸艳一偈也。" x={120} y={862} size={58} />
      <Note t={t} at={ZH.pi + 0.9} out={ZH.out} text="甲戌本脂批：不只为黛玉一个人，是为所有女孩写的挽歌" x={120} y={960} size={26} />
      <Tag t={t} at={ZH.l1 + 0.6} out={ZH.out} text="第二十七回 · 《葬花吟》（正文）" x={1860} y={980} anchor="right" kind="zheng" />
      <Credit t={t} at={ZH.t} out={ZH.l1} text="费丹旭《黛玉葬花》（清）" />
    </Layer>
  );
};

const HAOLE: [string, string][] = [["说什么脂正浓、粉正香，", "宝钗、湘云一干人"], ["如何两鬓又成霜？", "黛玉、晴雯一干人"], ["昨日黄土陇头送白骨，", "熙凤一干人"], ["因嫌纱帽小，致使锁枷扛。", "贾赦、雨村一干人"]];
export const Haole: React.FC<{ t: number }> = ({ t }) => {
  if (t < HL.t - 0.5 || t >= HL.out + 0.4) return null;
  return (
    <Layer o={eOut(range(t, HL.t - 0.4, HL.t + 0.1))}>
      <Paper t={t} />
      <Window cx={1560} cy={560} R={230} wall="rgba(0,0,0,0)"><Art src="hlm_xifeng.jpg" t={t} a={HL.t} b={HL.out} from={[0.45, 0.5, 1.5]} to={[0.45, 0.48, 1.6]} box={[1307, 307, 506, 506]} filter="grayscale(0.3)" /></Window>
      <Say t={t} at={HL.l1} out={HL.out + 0.4} text="好便是了，了便是好。" x={120} y={90} size={80} hi="好了" />
      <Tag t={t} at={HL.l1 + 0.6} out={HL.out + 0.4} text="第一回 · 《好了歌》（正文）" x={124} y={210} kind="zheng" />
      {HAOLE.map(([a, b], i) => <React.Fragment key={a}>
        <Say t={t} at={HL.names[i]} out={HL.out + 0.4} text={a} x={120} y={300 + i * 150} size={46} stagger={0.03} color={INK2} />
        <Pi t={t} at={HL.names[i] + 0.4} out={HL.out + 0.4} text={b} x={120} y={366 + i * 150} size={50} />
      </React.Fragment>)}
      <Note t={t} at={HL.names[0] + 0.6} out={HL.out + 0.4} text="《好了歌注》每一句，甲戌本脂批都注出了是谁" x={1560} y={830} anchor="center" size={24} color={RED} />
      <Credit t={t} at={HL.t} out={HL.out} text="改琦《红楼梦图咏》· 王熙凤" />
    </Layer>
  );
};

// the seal strip (封条) slapped across the page: two strips crossed, as on a sealed door
const Strip: React.FC<{ k: number; rot: number; y: number }> = ({ k, rot, y }) => (k <= 0 ? null :
  <div style={{ position: "absolute", left: -100, top: y, width: 2120, height: 120, transform: `rotate(${rot}deg) scale(${lerp(1.25, 1, k)})`, transformOrigin: "50% 50%", opacity: Math.min(1, k * 2),
    background: "#F3EEE2", boxShadow: "0 10px 30px rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "space-around", fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: INK }}>
    {["封", "江宁织造", "封", "曹府", "封"].map((s, i) => <span key={i} style={{ color: s === "封" ? RED : INK }}>{s}</span>)}
  </div>);
export const Why: React.FC<{ t: number }> = ({ t }) => {
  if (t < WY.t - 0.3 || t >= WY.out + 0.6) return null;
  const k1 = eOut(range(t, WY.seal, WY.seal + 0.18)), k2 = eOut(range(t, WY.seal + 0.25, WY.seal + 0.43)), go = eInOut(range(t, WY.l2 - 0.5, WY.l2));
  return (
    <Layer o={1 - eIn(range(t, WY.out - 0.1, WY.out + 0.5))}>
      <Paper t={t} />
      <Layer o={1 - 0.8 * go}>
        <Strip k={k1} rot={-12} y={460} />
        <Strip k={k2} rot={10} y={470} />
      </Layer>
      <Say t={t} at={WY.l1} out={WY.out} text="1728年，曹家被抄。" x={120} y={110} size={64} hi="抄" />
      <Note t={t} at={WY.l1 + 0.8} out={WY.out} text="那时曹雪芹还是个孩子（封条为示意）" x={124} y={210} size={30} />
      <Col t={t} at={WY.l2} out={WY.out} text="满纸荒唐言" x={1500} y={240} size={92} stagger={0.12} />
      <Col t={t} at={WY.l2 + 0.6} out={WY.out} text="一把辛酸泪" x={1360} y={240} size={92} stagger={0.12} />
      <Tag t={t} at={WY.l2 + 0.4} out={WY.out} text="第一回（正文）" x={1430} y={790} anchor="center" kind="zheng" />
      <Pi t={t} at={WY.pi} out={WY.out} text="壬午除夕，书未成，芹为泪尽而逝。" x={120} y={760} size={58} />
      <Tag t={t} at={WY.pi + 0.8} out={WY.out} text="甲戌本 · 眉批" x={124} y={860} />
      <Note t={t} at={WY.pi + 1.0} out={WY.out} text="后四十回为他人续写" x={124} y={920} size={22} />
    </Layer>
  );
};

export const White: React.FC<{ t: number }> = ({ t }) => {
  if (t < WH.t - 0.5 || t >= WH.out + 0.6) return null;
  const wash = 0.4 + 0.6 * eInOut(range(t, WH.t, WH.l2 + 0.6));   // the garden comes back already fading
  return (
    <Layer o={eOut(range(t, WH.t - 0.5, WH.t)) * (1 - eIn(range(t, WH.out - 0.1, WH.out + 0.5)))}>
      <Paper t={t} />
      <Art src="hlm_garden.jpg" t={t} a={WH.t} b={WH.out} from={[0.6, 0.5, 1.4]} to={[0.5, 0.5, 1.5]} o={1 - wash} filter={`saturate(${1 - wash}) brightness(${1 + wash * 0.6})`} />
      <div style={{ position: "absolute", inset: 0, background: "#FAFAF8", opacity: 0.25 + 0.75 * wash }} />
      <div style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 0 2px rgba(80,80,90,0.5))" }}><Fall t={t} a={WH.t - 0.4} n={70} kind="snow" seed={9} speed={0.8} /></div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 360, height: 360, background: "linear-gradient(180deg, rgba(250,250,248,0) 0%, rgba(250,250,248,0.85) 25%, rgba(250,250,248,0.85) 75%, rgba(250,250,248,0) 100%)", opacity: eOut(range(t, WH.l1 - 0.4, WH.l1 + 0.2)) }} />
      <Say t={t} at={WH.l1} out={WH.out} text="好一似食尽鸟投林，" x={960} y={400} size={60} anchor="center" color={INK2} />
      <Say t={t} at={WH.l2} out={WH.out} text="落了片白茫茫大地真干净！" x={960} y={500} size={70} anchor="center" />
      <Tag t={t} at={WH.l1 + 0.5} out={WH.out} text="第五回 · 《飞鸟各投林》（正文）" x={960} y={640} anchor="center" kind="zheng" />
    </Layer>
  );
};

// the curtain call: five girls back in their windows
const CALL = [{ img: "hlm_daiyu.jpg", name: "林黛玉", f: [0.6, 0.45] }, { img: "hlm_baochai.jpg", name: "薛宝钗", f: [0.35, 0.55] }, { img: "hlm_yuanchun.jpg", name: "贾元春", f: [0.72, 0.56] },
  { img: "hlm_tanchun.jpg", name: "贾探春", f: [0.33, 0.5] }, { img: "hlm_xifeng.jpg", name: "王熙凤", f: [0.45, 0.5] }];
const CX = [360, 660, 960, 1260, 1560];
export const Lift: React.FC<{ t: number }> = ({ t }) => {
  if (t < LF.t - 0.5) return null;
  const stone = eOut(range(t, LF.stone, LF.stone + 0.8)) * (1 - eInOut(range(t, LF.gallery[0] - 0.4, LF.gallery[0] + 0.4)));
  const card = eInOut(range(t, LF.title - 0.3, LF.title + 0.6));
  return (
    <Layer o={eOut(range(t, LF.t - 0.5, LF.t + 0.2)) * (1 - eIn(range(t, LF.out - 0.7, LF.out)))}>
      <Paper t={t} />
      <Art src="hlm_stone.jpg" t={t} a={LF.stone} b={LF.gallery[0]} from={[0.5, 0.56, 1.35]} to={[0.5, 0.55, 1.0]} box={[740, 120, 440, 648]} o={stone} />
      <Layer o={1 - card}>
        {CALL.map((c, i) => { const R = 128 * eOut(range(t, LF.gallery[i], LF.gallery[i] + 0.5)); if (R <= 1) return null;
          return <React.Fragment key={c.name}>
            <Window cx={CX[i]} cy={380} R={R} wall="rgba(0,0,0,0)"><Art src={c.img} t={t} a={LF.t} b={LF.out} from={[c.f[0], c.f[1], 1.9]} to={[c.f[0], c.f[1], 2.0]} box={[CX[i] - R * 1.1, 380 - R * 1.1, R * 2.2, R * 2.2]} /></Window>
            <div style={{ position: "absolute", left: CX[i] - 100, top: 540, width: 200, textAlign: "center", fontFamily: SERIF, fontWeight: 700, fontSize: 34, color: INK2, opacity: eOut(range(t, LF.gallery[i] + 0.3, LF.gallery[i] + 0.7)) }}>{c.name}</div>
          </React.Fragment>; })}
        <Say t={t} at={LF.l1} out={LF.title} text="结局写在第一页，" x={960} y={680} size={66} anchor="center" />
        <Say t={t} at={LF.l2} out={LF.title} text="不舍写满每一页。" x={960} y={780} size={76} anchor="center" hi="不舍" />
      </Layer>
      {card > 0.001 && <Layer o={card}>
        <Say t={t} at={LF.title} out={LF.out + 1} text="红楼梦" x={960} y={300} size={170} anchor="center" weight={900} tracking={30} />
        <Seal t={t} at={LF.title + 0.7} text="石头记" x={1290} y={420} s={92} />
        <Say t={t} at={LF.title + 0.4} out={LF.out + 1} text="第一页，就写好了所有人的结局" x={960} y={560} size={44} anchor="center" color={INK2} />
        <Note t={t} at={LF.title + 0.8} out={LF.out + 1} text="画面：改琦《红楼梦图咏》· 孙温《全本红楼梦图》· 费丹旭《黛玉葬花》· 梅花窗仿扬州何园" x={960} y={720} anchor="center" size={20} />
        <Note t={t} at={LF.title + 0.8} out={LF.out + 1} text="文本：甲戌本、庚辰本脂批，程甲本（zh.wikisource）· 配乐：曲笛、笙、檀板、三弦、琵琶、筝、箫（合成，原创旋律）" x={960} y={756} anchor="center" size={20} />
      </Layer>}
      <Credit t={t} at={LF.gallery[0]} out={LF.title} text="改琦《红楼梦图咏》" />
    </Layer>
  );
};
export { XING, eIn };
