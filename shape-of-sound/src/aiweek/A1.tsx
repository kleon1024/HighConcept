// 本周AI要闻 · part 1 — the roll of toilet paper with the recorder in it (also used by the cold open, A0), the bugging
// case itself, and the Seoul chip sell-off after CXMT's plans.
import React from "react";
import { AMBER, BEAM, Beam, Counter, DIM, DISPLAY, eIn, eInOut, eOut, FAINT, HEAVY, Index, Layer, lerp, MONO, Note, range, RED, Slam, Svg, Tag, WHITE } from "./kit";
import { at, line, seg } from "./timeline";

// ---------- the roll and the bug ----------
export const Roll: React.FC<{ cx: number; cy: number; s: number; t: number; rec: number; o?: number }> = ({ cx, cy, s, t, rec, o = 1 }) => {
  if (o <= 0.001) return null;
  const blink = 0.55 + 0.45 * Math.round((Math.sin(t * Math.PI * 2 * 1.1) + 1) / 2);
  return <g transform={`translate(${cx},${cy}) scale(${s})`} opacity={o}>
    <defs>
      <linearGradient id="rollBody" x1="0" x2="1"><stop offset="0" stopColor="#5E5A55" /><stop offset="0.35" stopColor="#E9E5DE" /><stop offset="0.6" stopColor="#F6F3EE" /><stop offset="1" stopColor="#6E6A64" /></linearGradient>
      <radialGradient id="rollTop"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#D8D3CB" /></radialGradient>
    </defs>
    <path d="M-120,-110 L-120,120 A120,38 0 0 0 120,120 L120,-110 Z" fill="url(#rollBody)" />
    {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M-120,${-80 + i * 24} A120,38 0 0 0 120,${-80 + i * 24}`} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={2} />)}
    <ellipse cx={0} cy={-110} rx={120} ry={38} fill="url(#rollTop)" />
    <ellipse cx={0} cy={-110} rx={42} ry={14} fill="#2B2724" />
    <ellipse cx={0} cy={-112} rx={36} ry={11} fill="#0D0B0A" />
    {/* the recorder inside the core: a red light */}
    {rec > 0 && <>
      <circle cx={0} cy={-112} r={7} fill={RED} opacity={rec * blink} />
      <circle cx={0} cy={-112} r={26} fill={RED} opacity={rec * blink * 0.25} style={{ filter: "blur(8px)" }} />
      {[0, 1, 2].map((k) => { const u = ((t * 0.9 + k / 3) % 1); return <ellipse key={k} cx={0} cy={-112} rx={40 + u * 220} ry={(40 + u * 220) * 0.42} fill="none" stroke={RED} strokeWidth={2} opacity={rec * (1 - u) * 0.6} />; })}
    </>}
  </g>;
};
// ---------- a story card frame: index, headline, footer tags ----------
export const Headline: React.FC<{ t: number; at: number; out: number; n: number; text: string; hi?: string }> = ({ t, at, out, n, text, hi }) => <>
  <Index t={t} at={at - 0.1} out={out} n={n} x={100} y={108} size={104} />
  <Slam t={t} at={at} out={out} text={text} x={300} y={110} size={70} hi={hi} />
  <Beam y={214} x0={100} x1={1810} k={eOut(range(t, at + 0.1, at + 0.6))} o={1 - eIn(range(t, out - 0.3, out))} fromLeft w={2} />
</>;
const Fact: React.FC<{ t: number; at: number; out: number; k: string; v: string; y: number }> = ({ t, at, out, k, v, y }) => <>
  <Note t={t} at={at} out={out} text={k} x={300} y={y + 8} size={26} color={FAINT} weight={700} />
  <Note t={t} at={at + 0.08} out={out} text={v} x={430} y={y} size={38} color={WHITE} weight={700} />
</>;

export const Spy: React.FC<{ t: number }> = ({ t }) => {
  const S = seg("spy");
  if (t < S.t - 0.4 || t >= S.out + 0.4) return null;
  const out = S.out + 0.2;
  return (
    <Layer o={eOut(range(t, S.t - 0.4, S.t)) * (1 - eIn(range(t, S.out - 0.1, S.out + 0.3)))}>
      <Headline t={t} at={S.t} out={out} n={1} text="OpenAI 会议室窃听器案" hi="窃听器" />
      <Fact t={t} at={at("spy", 0, "司法部")} out={out} k="指控" v="企图窃听 · 最高可判5年" y={300} />
      <Fact t={t} at={at("spy", 0, "OpenAI")} out={out} k="嫌疑人" v="35岁 OpenAI 工程师" y={380} />
      <Fact t={t} at={at("spy", 1, "卫生纸")} out={out} k="发现" v="9月30日 · 卫生纸里，接在电视后面" y={460} />
      <Fact t={t} at={at("spy", 1, "高管")} out={out} k="被捕" v="10月9日 · 他包里还有第二个设备" y={540} />
      <Svg><Roll cx={1560} cy={560} s={0.8} t={t} rec={1} o={eOut(range(t, S.t, S.t + 0.5))} /></Svg>
      <Slam t={t} at={at("spy", 2, "揪出")} out={out} text="揪出他的，是AI。" x={300} y={660} size={88} hi="AI" />
      <Note t={t} at={at("spy", 2, "揪出") + 0.6} out={out} text="—— OpenAI 称：用自家模型分析设备、追查来源" x={306} y={780} size={26} />
      <Tag t={t} at={S.t + 0.6} out={out} text="官方 · 美国司法部 10.13" x={300} y={860} kind="official" />
      <Tag t={t} at={S.t + 0.9} out={out} text="指控 ≠ 定罪" x={640} y={860} kind="report" />
    </Layer>
  );
};

// ---------- the Seoul sell-off ----------
const BARS: [string, number][] = [["SK海力士", -10.09], ["三星电子", -7.39], ["KOSPI 指数", -5.46]];
export const Chips: React.FC<{ t: number }> = ({ t }) => {
  const S = seg("chips");
  if (t < S.t - 0.4 || t >= S.out + 0.4) return null;
  const L = (i: number) => line("chips", i).t, out = S.out + 0.2;
  const crash = at("chips", 1, "崩了"), hynix = at("chips", 1, "海力士"), kospi = at("chips", 1, "大盘");
  const shake = Math.max(0, 1 - Math.abs(t - crash) / 0.35) * Math.sin(t * 90) * 10;
  const chart = eInOut(range(t, hynix - 0.35, hynix)), barAt = [hynix, hynix + 0.35, kospi];
  return (
    <Layer o={eOut(range(t, S.t - 0.4, S.t)) * (1 - eIn(range(t, S.out - 0.1, S.out + 0.3)))} style={{ transform: `translate(${shake}px, ${shake * 0.4}px)` }}>
      <Headline t={t} at={S.t} out={out} n={2} text="长鑫一句话，韩国芯片股暴跌" hi="暴跌" />
      <Note t={t} at={L(0) + 0.3} out={hynix} text="长鑫存储高管：年底推出新一代服务器内存（DDR5 RDIMM）" x={300} y={260} size={32} color={WHITE} weight={700} />
      <Tag t={t} at={L(0) + 0.6} out={hynix} text="报道 · 10.10 会议发言" x={300} y={320} kind="report" />
      {/* the news itself: a server memory module, then the three days to Seoul */}
      <Layer o={eOut(range(t, L(0) + 0.1, L(0) + 0.6)) * (1 - eIn(range(t, crash - 0.4, crash)))}>
        <Svg>
          <g transform={`translate(560, ${lerp(470, 440, eOut(range(t, L(0) + 0.2, L(0) + 1.2)))})`}>
            <rect x={0} y={0} width={800} height={190} rx={8} fill="#1D5A3C" stroke="rgba(221,235,255,0.5)" strokeWidth={2} />
            {Array.from({ length: 9 }, (_, i) => <rect key={i} x={30 + i * 84} y={34} width={64} height={96} rx={3} fill="#0E0F12" stroke="rgba(221,235,255,0.25)" />)}
            {Array.from({ length: 70 }, (_, i) => <rect key={i} x={20 + i * 11} y={168} width={7} height={22} fill="#D9B45A" />)}
            <rect x={394} y={160} width={12} height={30} fill={"#07080A"} />
            <text x={30} y={22} fontFamily={MONO} fontWeight={700} fontSize={16} fill="rgba(244,241,234,0.75)">DDR5 RDIMM · SERVER</text>
          </g>
        </Svg>
        <Note t={t} at={L(0) + 0.5} out={crash} text="长鑫存储 · 新一代服务器内存 · 计划年底推出" x={960} y={690} anchor="center" size={34} color={WHITE} weight={700} />
        <Note t={t} at={L(1)} out={crash} text="10.10  →  10.13" x={960} y={760} anchor="center" size={44} color={AMBER} font={MONO} weight={700} />
      </Layer>
      <Layer o={1 - chart}>
        <Slam t={t} at={crash} out={hynix + 0.2} text="崩了" x={960} y={420} size={260} anchor="center" color={RED} tracking={30} />
        <Note t={t} at={crash} out={hynix + 0.2} text="10月13日 · 首尔" x={960} y={740} anchor="center" size={34} color={DIM} font={MONO} weight={700} />
      </Layer>
      <Layer o={chart}>
        {BARS.map(([name, v], i) => { const s = barAt[i], k = eOut(range(t, s, s + 0.9)), h = (Math.abs(v) / 10.09) * 420 * k, x = 420 + i * 420;
          return <React.Fragment key={name}>
            <div style={{ position: "absolute", left: x, top: 340, width: 220, height: h, background: `linear-gradient(180deg, ${RED} 0%, rgba(255,90,78,0.35) 100%)`, boxShadow: "0 0 30px rgba(255,90,78,0.35)" }} />
            <div style={{ position: "absolute", left: x - 40, top: 290, width: 300, textAlign: "center", fontFamily: HEAVY, fontWeight: 700, fontSize: 32, color: WHITE, opacity: eOut(range(t, s, s + 0.3)) }}>{name}</div>
            <Counter t={t} at={s} dur={0.9} out={out} from={0} to={v} decimals={2} suffix="%" x={x + 110} y={360 + h} size={64} color={WHITE} anchor="center" suffixSize={40} />
          </React.Fragment>; })}
        <Beam y={340} x0={380} x1={1540} k={chart} w={2} color={BEAM} />
        <Note t={t} at={kospi + 0.6} out={out} text="KOSPI 收盘 6,035.35 · 收盘数据（韩国中央日报）· 分析人士也指出获利了结" x={960} y={850} anchor="center" size={24} />
      </Layer>
    </Layer>
  );
};
export { DISPLAY, eIn };
