// 本周AI要闻 · part 3 — AI acting up (from Anthropic's own reports: an invented tip sent to a police homicide form in
// testing, live internet cut from all internal tests; a projection that self-copying AI worms may not be far off), the
// fall of Character.AI, and the close: a fast recap of the week's words, then the title and sources.
import React from "react";
import { AMBER, BEAM, Beam, Counter, DIM, DISPLAY, eIn, eInOut, eOut, FAINT, Flare, HEAVY, Layer, lerp, Letterbox, MONO, Note, range, RED, Slam, Streaks, Svg, Tag, WHITE } from "./kit";
import { Headline } from "./A1";
import { allLines, at, line, seg } from "./timeline";

const TIP = "I may have information regarding this case.";
// the police tip form: the tip is typed from at + 0.3 s, submitted at at + 1.6 s, stamped as spam at at + 1.9 s
export const Form: React.FC<{ t: number; at: number; k: number }> = ({ t, at, k }) => {
  if (k <= 0.001) return null;
  const n = Math.floor(TIP.length * eInOut(range(t, at + 0.3, at + 1.45))), press = range(t, at + 1.55, at + 1.7), stamp = eOut(range(t, at + 1.9, at + 2.08));
  const field = (label: string, y: number, v = "", h = 54) => <>
    <div style={{ position: "absolute", left: 36, top: y, fontFamily: HEAVY, fontSize: 22, color: DIM }}>{label}</div>
    <div style={{ position: "absolute", left: 36, right: 36, top: y + 32, height: h, borderRadius: 6, border: "1.5px solid rgba(221,235,255,0.35)", background: "rgba(221,235,255,0.04)",
      fontFamily: MONO, fontSize: 24, color: WHITE, padding: "12px 14px", boxSizing: "border-box" }}>{v}</div>
  </>;
  return <div style={{ position: "absolute", left: 300, top: 290, width: 760, height: 560, borderRadius: 12, background: "#0F1115", border: "1.5px solid rgba(221,235,255,0.25)", opacity: k, overflow: "hidden" }}>
    <div style={{ height: 56, background: "rgba(221,235,255,0.08)", display: "flex", alignItems: "center", paddingLeft: 24, fontFamily: HEAVY, fontWeight: 700, fontSize: 24, color: WHITE }}>警方网站 · 凶案线索提交</div>
    {field("姓名", 80)}{field("联系方式", 180)}{field("线索", 280, TIP.slice(0, n) + (n < TIP.length && Math.floor(t * 3) % 2 ? "▌" : ""), 110)}
    <div style={{ position: "absolute", right: 36, bottom: 32, width: 150, height: 52, borderRadius: 26, background: press > 0 ? AMBER : "rgba(255,181,46,0.6)", transform: `scale(${1 - 0.08 * Math.sin(Math.PI * press)})`,
      fontFamily: HEAVY, fontWeight: 900, fontSize: 24, color: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>提交</div>
    {stamp > 0 && <div style={{ position: "absolute", left: 150, top: 190, padding: "12px 30px", border: `5px solid ${RED}`, borderRadius: 8, color: RED, fontFamily: HEAVY, fontWeight: 900, fontSize: 46, lineHeight: 1.25, textAlign: "center",
      transform: `rotate(-10deg) scale(${lerp(1.8, 1, stamp)})`, opacity: stamp, background: "rgba(15,17,21,0.8)" }}>已标记为垃圾信息<br /><span style={{ fontSize: 34 }}>从未转交警方</span></div>}
  </div>;
};
// fifteen cheap TV boxes, networked; a model's layers spread across them
const Boxes: React.FC<{ t: number; at: number; k: number }> = ({ t, at, k }) => (k <= 0.001 ? null :
  <Svg style={{ opacity: k }}>
    {Array.from({ length: 15 }, (_, i) => { const c = i % 5, r = Math.floor(i / 5), x = 1160 + c * 132, y = 330 + r * 120, on = eOut(range(t, at + 0.3 + i * 0.12, at + 0.6 + i * 0.12));
      return <g key={i}>
        {i > 0 && <line x1={1160 + ((i - 1) % 5) * 132 + 50} y1={330 + Math.floor((i - 1) / 5) * 120 + 30} x2={x + 50} y2={y + 30} stroke={AMBER} strokeWidth={2} opacity={on * 0.7} />}
        <rect x={x} y={y} width={100} height={60} rx={8} fill={on > 0.5 ? "rgba(255,181,46,0.2)" : "rgba(221,235,255,0.06)"} stroke={on > 0.5 ? AMBER : "rgba(221,235,255,0.35)"} strokeWidth={2} />
        <circle cx={x + 86} cy={y + 46} r={4} fill={on > 0.5 ? AMBER : "rgba(221,235,255,0.3)"} />
      </g>; })}
  </Svg>);
export const Rogue: React.FC<{ t: number }> = ({ t }) => {
  const S = seg("rogue");
  if (t < S.t - 0.4 || t >= S.out + 0.4) return null;
  const L = (i: number) => line("rogue", i).t, out = S.out + 0.2;
  const formAt = at("rogue", 1, "假线索") - 1.9;   // the spam stamp lands on 假线索
  const form = eOut(range(t, L(1) - 0.2, L(1) + 0.3)) * (1 - 0.75 * eInOut(range(t, L(2) - 0.2, L(2) + 0.3))) * (1 - eIn(range(t, L(3) - 0.4, L(3))));
  const cutAt = at("rogue", 2, "切断"), cut = eInOut(range(t, cutAt, cutAt + 0.6)), worm = eOut(range(t, L(3) - 0.2, L(3) + 0.3));
  const wormAt = at("rogue", 3, "AI");
  const alarm = 0.5 + 0.5 * Math.sin(t * 6);
  return (
    <Layer o={eOut(range(t, S.t - 0.4, S.t)) * (1 - eIn(range(t, S.out - 0.1, S.out + 0.3)))}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 6, background: RED, opacity: 0.6 * alarm }} />
      <Headline t={t} at={S.t} out={out} n={5} text="AI，越界了？" hi="越界" />
      <Note t={t} at={L(0) + 0.5} out={L(1)} text="两份 Anthropic 自己发布的报告" x={300} y={300} size={34} color={WHITE} weight={700} />
      {[["10.9", "调查：测试中模型的意外行为", "模型在真实网站上做了不该做的事"], ["10.12", "自我复制的 AI", "红队推演：AI 能否把自己复制出去"]].map(([d, a, b], i) => {
        const s0 = at("rogue", 0, "Anthropic") + i * 0.35, k = eOut(range(t, s0, s0 + 0.5)), o = k * (1 - eIn(range(t, L(1) - 0.3, L(1))));
        return o > 0.001 ? <div key={d} style={{ position: "absolute", left: 300 + i * 560 + (1 - k) * 80, top: 380, width: 500, height: 380, opacity: o, borderRadius: 10, background: "#EDEAE3", boxShadow: "0 30px 60px rgba(0,0,0,0.6)", transform: `rotate(${i ? 2 : -2}deg)`, padding: "36px 40px", boxSizing: "border-box" }}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, color: "#7A2A22", letterSpacing: 2 }}>ANTHROPIC · RESEARCH · {d}</div>
          <div style={{ fontFamily: HEAVY, fontWeight: 900, fontSize: 40, color: "#15171C", marginTop: 26, lineHeight: 1.3 }}>{a}</div>
          <div style={{ fontFamily: HEAVY, fontWeight: 500, fontSize: 24, color: "#4A4A4A", marginTop: 18 }}>{b}</div>
          {Array.from({ length: 4 }, (_, j) => <div key={j} style={{ height: 10, borderRadius: 5, background: "rgba(21,23,28,0.12)", marginTop: j ? 14 : 34, width: `${90 - j * 12}%` }} />)}
        </div> : null; })}
      <Form t={t} at={formAt} k={form} />
      <Layer o={1 - eIn(range(t, L(3) - 0.4, L(3)))}>
        <Note t={t} at={at("rogue", 1, "克劳德")} out={out} text="Claude Haiku 4.5 · 内部测试中" x={1120} y={320} size={32} color={WHITE} weight={700} />
        <Note t={t} at={at("rogue", 1, "克劳德") + 0.4} out={out} text="只被要求“在随机网页上演示任务”" x={1120} y={372} size={24} />
        <Tag t={t} at={at("rogue", 1, "克劳德") + 0.7} out={out} text="官方 · Anthropic 10.9" x={1120} y={420} kind="official" />
        {/* the cable is cut */}
        <Svg style={{ opacity: eOut(range(t, L(2) - 0.1, L(2) + 0.4)) }}>
          <path d={`M1120,${600} L${1400 - 60 * cut},${600}`} stroke={WHITE} strokeWidth={8} strokeLinecap="round" />
          <path d={`M${1460 + 60 * cut},${600} L1800,${600}`} stroke={WHITE} strokeWidth={8} strokeLinecap="round" />
          <rect x={1380 - 60 * cut} y={585} width={30} height={30} rx={4} fill={WHITE} />
          <rect x={1460 + 60 * cut} y={585} width={30} height={30} rx={4} fill="none" stroke={WHITE} strokeWidth={4} />
          {cut > 0.2 && cut < 0.9 && Array.from({ length: 8 }, (_, i) => <line key={i} x1={1430} y1={600} x2={1430 + Math.cos(i) * 40 * cut} y2={600 + Math.sin(i * 1.7) * 40 * cut} stroke={AMBER} strokeWidth={3} />)}
        </Svg>
        <Slam t={t} at={cutAt + 0.3} out={out} text="所有内部测试：断网" x={1120} y={660} size={54} hi="断网" />
      </Layer>
      <Layer o={worm}>
        <Slam t={t} at={wormAt} out={out} text="AI 蠕虫" x={300} y={300} size={150} color={RED} stagger={0.08} />
        <Note t={t} at={wormAt + 0.4} out={out} text="会自我复制、在设备之间传播的 AI" x={306} y={490} size={32} color={WHITE} weight={700} />
        <Counter t={t} at={wormAt + 0.7} dur={1.0} out={out} to={825} prefix="$" x={300} y={560} size={110} />
        <Note t={t} at={wormAt + 1.1} out={out} text="= 15台 × 55美元的杂牌电视盒子，合力跑起一个260亿参数的模型" x={306} y={690} size={26} />
        <Boxes t={t} at={wormAt - 0.3} k={worm} />
        <Tag t={t} at={at("rogue", 3, "可能")} out={out} text="推演 · 并非已出现" x={300} y={760} kind="rumor" />
        <Note t={t} at={at("rogue", 3, "可能") + 0.3} out={out} text="报告原话：“我们还没有真正失控的自我复制体”" x={306} y={820} size={24} />
      </Layer>
    </Layer>
  );
};

// a chat bubble that cracks in two (crack 0..1), drawn around (320..800, 330..770), shifted by x, y
export const Bubble: React.FC<{ t: number; crack: number; o?: number; x?: number; y?: number }> = ({ t, crack, o = 1, x = 0, y = 0 }) => (o <= 0.001 ? null :
  <Svg style={{ opacity: o * (1 - 0.6 * crack) }}>
    <g transform={`translate(${x},${y})`}>
      <g transform={`translate(${-40 * crack},${30 * crack}) rotate(${-6 * crack} 560 520)`}>
        <path d="M360,330 H620 L590,450 L640,520 L600,700 H360 A40,40 0 0 1 320,660 V370 A40,40 0 0 1 360,330 Z" fill="rgba(221,235,255,0.08)" stroke={BEAM} strokeWidth={3} />
      </g>
      <g transform={`translate(${40 * crack},${50 * crack}) rotate(${7 * crack} 700 520)`}>
        <path d="M620,330 H760 A40,40 0 0 1 800,370 V660 A40,40 0 0 1 760,700 H600 L640,520 L590,450 Z" fill="rgba(221,235,255,0.08)" stroke={BEAM} strokeWidth={3} />
        <path d="M520,700 L470,770 L560,700" fill="rgba(221,235,255,0.08)" stroke={BEAM} strokeWidth={3} />
      </g>
      {[0, 1, 2].map((i) => <circle key={i} cx={470 + i * 80} cy={515} r={14} fill={WHITE} opacity={(0.4 + 0.6 * Math.max(0, Math.sin(t * 5 - i))) * (1 - crack)} />)}
    </g>
  </Svg>);

export const Fall: React.FC<{ t: number }> = ({ t }) => {
  const S = seg("fall");
  if (t < S.t - 0.4 || t >= S.out + 0.4) return null;
  const L = (i: number) => line("fall", i).t, out = S.out + 0.2;
  const bust = at("fall", 0, "破产"), crack = eInOut(range(t, bust - 0.1, bust + 0.5));
  return (
    <Layer o={eOut(range(t, S.t - 0.4, S.t)) * (1 - eIn(range(t, S.out - 0.1, S.out + 0.3)))}>
      <Headline t={t} at={S.t} out={out} n={6} text="Character.AI 申请破产" hi="破产" />
      <Bubble t={t} crack={crack} o={eOut(range(t, S.t + 0.2, S.t + 0.6))} />
      <Note t={t} at={L(0) + 0.4} out={out} text="10.12 · 在美国申请破产保护，出售资产" x={900} y={330} size={30} color={WHITE} weight={700} />
      <Tag t={t} at={bust} out={out} text="官方 · 公司声明" x={900} y={385} kind="official" />
      <Note t={t} at={L(1)} out={out} text="迪士尼起拍价" x={900} y={470} size={30} color={DIM} weight={700} />
      <Counter t={t} at={at("fall", 1, "两千万")} dur={1.0} out={out} to={20000000} prefix="$" x={900} y={520} size={110} />
      <Note t={t} at={at("fall", 1, "只买")} out={out} text="只买部分IP的非独家授权 · 可被更高报价超越" x={900} y={660} size={26} />
      <Note t={t} at={at("fall", 1, "只买") + 0.4} out={out} text="出售期间应用照常运行；无人接手才会关停" x={900} y={706} size={26} />
    </Layer>
  );
};

// the close: the week in seven words, then the title and sources
const WORDS: [string, string][] = [["窃听器", RED], ["崩了", RED], ["三巨头", AMBER], ["3999元", AMBER], ["155", RED], ["AI蠕虫", RED], ["破产", WHITE]];
export const End: React.FC<{ t: number }> = ({ t }) => {
  const S = seg("end");
  if (t < S.t - 0.4) return null;
  const L = (i: number) => line("end", i).t;
  const box = eInOut(range(t, S.t - 0.3, S.t + 0.4)), title = eOut(range(t, L(1), L(1) + 0.3));
  const step = (L(1) - L(0) - 0.2) / WORDS.length, wi = Math.floor((t - L(0)) / step);
  return (
    <Layer o={eOut(range(t, S.t - 0.4, S.t))}>
      <Streaks t={t} n={10} seed={11} o={1 - title} />
      {t < L(1) && wi >= 0 && wi < WORDS.length && (() => { const [w, c] = WORDS[wi], u = (t - L(0) - wi * step) / step;
        return <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", fontFamily: HEAVY, fontWeight: 900, fontSize: 200, color: c, opacity: Math.min(1, u * 6) * (1 - Math.max(0, u - 0.8) * 5),
          transform: `scale(${lerp(1.25, 1, Math.min(1, u * 3))})`, filter: `blur(${Math.max(0, 1 - u * 4) * 8}px)` }}>{w}</div>; })()}
      <Flare x={960} y={460} k={Math.max(0, 1 - Math.abs(t - L(1) - 0.05) / 0.35)} s={1.4} />
      <Beam y={600} k={eOut(range(t, L(1) - 0.1, L(1) + 0.3))} o={title} />
      <Layer o={title}>
        <Slam t={t} at={L(1)} out={S.out + 5} text="本周AI要闻" x={960} y={330} size={150} anchor="center" tracking={12} />
        <Slam t={t} at={L(1) + 0.5} out={S.out + 5} text="下周见" x={960} y={640} size={64} anchor="center" color={AMBER} tracking={20} />
        <Note t={t} at={L(1) + 1.0} out={S.out + 5} text="资料：美国司法部 · 韩国中央日报 · Google · OpenAI · Meta · 阶跃星辰 · 澎湃新闻 · Anthropic · NBC/路透" x={960} y={760} anchor="center" size={22} color={FAINT} />
        <Note t={t} at={L(1) + 1.0} out={S.out + 5} text="配音：CosyVoice 本地合成 · 不含任何公司商标" x={960} y={796} anchor="center" size={22} color={FAINT} />
      </Layer>
      <Letterbox k={box} />
    </Layer>
  );
};

// burned-in subtitles of the narration
export const Subs: React.FC<{ t: number }> = ({ t }) => {
  const Ls = allLines();
  const i = Ls.findIndex((l, j) => t >= l.t - 0.05 && t < Math.min(l.end + 0.35, (Ls[j + 1]?.t ?? 1e9) - 0.05));
  if (i < 0) return null;
  const l = Ls[i], k = eOut(range(t, l.t - 0.05, l.t + 0.12)) * (1 - eIn(range(t, l.end + 0.2, l.end + 0.35)));
  return <div style={{ position: "absolute", left: 0, right: 0, top: 990, textAlign: "center", opacity: k, fontFamily: HEAVY, fontWeight: 700, fontSize: 42, color: WHITE, letterSpacing: 2,
    textShadow: "0 0 8px #000, 0 2px 4px #000, 0 0 2px #000" }}>{l.sub.replace(/[，。：；]$/, "")}</div>;
};
export { DISPLAY, Svg };
