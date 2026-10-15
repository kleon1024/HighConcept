// 本周AI要闻 · part 2 — three giants in one week (Google's Gemini 4 Argon opens to everyone at an introductory price;
// GPT-6 reaches free ChatGPT users with answers you can tap; Meta's first frontier model), and the China front (StepFun's
// 3,999-yuan agent phone; 155 apps refuse to be driven by Doubao's phone assistant).
import React from "react";
import { AMBER, BEAM, Counter, DIM, DISPLAY, eIn, eInOut, eOut, FAINT, HEAVY, Layer, lerp, MONO, Note, range, RED, Svg, Tag, WHITE } from "./kit";
import { Headline } from "./A1";
import { at, line, seg } from "./timeline";

// ---------- three giants ----------
const Card: React.FC<React.PropsWithChildren<{ t: number; x: number; on: number; dim: number; name: string; model: string; date: string }>> = ({ t, x, on, dim, name, model, date, children }) => {
  const k = eOut(on), d = 1 - 0.45 * dim;
  return <div style={{ position: "absolute", left: x, top: 280, width: 480, height: 590, borderRadius: 14, background: "rgba(255,255,255,0.035)", opacity: lerp(0.35, 1, k) * d,
    border: `2px solid ${k > 0.5 ? AMBER : "rgba(244,241,234,0.18)"}`, boxShadow: k > 0.5 ? "0 0 50px rgba(255,181,46,0.18)" : "none", transform: `scale(${lerp(0.97, 1, k)})`, overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 32, top: 26, fontFamily: DISPLAY, fontSize: 34, letterSpacing: 4, color: k > 0.5 ? AMBER : FAINT }}>{name}</div>
    <div style={{ position: "absolute", left: 32, top: 78, fontFamily: HEAVY, fontWeight: 900, fontSize: 44, color: WHITE }}>{model}</div>
    <div style={{ position: "absolute", left: 32, top: 140, fontFamily: MONO, fontWeight: 700, fontSize: 24, color: DIM }}>{date}</div>
    <div style={{ position: "absolute", left: 32, right: 32, top: 190, bottom: 24, opacity: k }}>{children}</div>
  </div>;
};
// a tiny "answer you can tap": a bar chart, a slider and a button, assembling itself
const MiniUI: React.FC<{ t: number; at: number }> = ({ t, at }) => {
  const k = (i: number) => eOut(range(t, at + i * 0.18, at + i * 0.18 + 0.4));
  return <div style={{ position: "absolute", left: 0, right: 0, top: 150, height: 210, borderRadius: 12, border: "1.5px solid rgba(221,235,255,0.35)", background: "rgba(221,235,255,0.05)" }}>
    {[0.55, 0.8, 0.4, 0.95, 0.7].map((h, i) => <div key={i} style={{ position: "absolute", left: 24 + i * 46, bottom: 70, width: 30, height: 110 * h * k(i), background: i === 3 ? AMBER : "rgba(221,235,255,0.6)", borderRadius: 3 }} />)}
    <div style={{ position: "absolute", left: 270, top: 40, width: 110, height: 6, borderRadius: 3, background: "rgba(221,235,255,0.3)", opacity: k(5) }} />
    <div style={{ position: "absolute", left: 270 + 70 * k(6), top: 33, width: 20, height: 20, borderRadius: 10, background: AMBER, opacity: k(5) }} />
    <div style={{ position: "absolute", left: 270, top: 90, width: 110, height: 44, borderRadius: 22, background: AMBER, color: "#111", fontFamily: HEAVY, fontWeight: 900, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", opacity: k(7) }}>计算</div>
    <div style={{ position: "absolute", left: 24, bottom: 18, fontFamily: HEAVY, fontSize: 20, color: DIM, opacity: k(4) }}>回答 = 能点的界面</div>
  </div>;
};
export const Giants: React.FC<{ t: number }> = ({ t }) => {
  const S = seg("giants");
  if (t < S.t - 0.4 || t >= S.out + 0.4) return null;
  const L = (i: number) => line("giants", i).t, out = S.out + 0.2;
  const on = (i: number) => range(t, L(i + 1) - 0.1, L(i + 1) + 0.3), dim = (i: number) => (i < 2 ? range(t, L(i + 2) - 0.1, L(i + 2) + 0.3) : 0);
  const shown = eOut(range(t, S.t + 0.2, S.t + 0.8));
  return (
    <Layer o={eOut(range(t, S.t - 0.4, S.t)) * (1 - eIn(range(t, S.out - 0.1, S.out + 0.3)))}>
      <Headline t={t} at={S.t} out={out} n={3} text="同一周，三巨头同时出牌" hi="三巨头" />
      <Layer o={shown}>
        <Card t={t} x={300} on={on(0)} dim={dim(0)} name="GOOGLE" model="Gemini 4 Argon" date="10.13 全球开放">
          <div style={{ fontFamily: HEAVY, fontSize: 24, color: DIM }}>API 价格（每百万 token，输入 / 输出）</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 76, color: AMBER, marginTop: 10 }}>$2 / $10</div>
          <div style={{ fontFamily: HEAVY, fontWeight: 700, fontSize: 26, color: WHITE, marginTop: 14 }}>限时价，11月30日后</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 44, color: DIM, marginTop: 6 }}>→ $4 / $20</div>
        </Card>
        <Card t={t} x={820} on={on(1)} dim={dim(1)} name="OPENAI" model="GPT-6" date="10.8 起 · 免费用户可用">
          <Counter t={t} at={L(2) + 0.3} dur={1.0} out={out} to={12} suffix="亿+ 周活用户" x={0} y={0} size={84} suffixSize={30} />
          <div style={{ position: "absolute", top: 100, fontFamily: HEAVY, fontSize: 22, color: DIM }}>免费版用 GPT-6 Luna · 付费版用 Sol</div>
          <MiniUI t={t} at={L(2) + 0.6} />
        </Card>
        <Card t={t} x={1340} on={on(2)} dim={dim(2)} name="META" model="Muse Wonder" date="10.12 发布">
          <div style={{ fontFamily: HEAVY, fontWeight: 900, fontSize: 38, color: WHITE, lineHeight: 1.35 }}>超级智能实验室<br />第一个前沿模型</div>
          <div style={{ fontFamily: HEAVY, fontSize: 24, color: DIM, marginTop: 24, lineHeight: 1.5 }}>Muse Wonder（API）<br />Muse Wonder Full（订阅用户）</div>
          <div style={{ fontFamily: HEAVY, fontSize: 22, color: FAINT, marginTop: 24 }}>官方公告未公布跑分</div>
        </Card>
      </Layer>
      <Tag t={t} at={L(1) + 0.4} out={out} text="官方 · 三家官方公告" x={300} y={900} kind="official" />
    </Layer>
  );
};

// ---------- the China front ----------
const Phone: React.FC<{ t: number; x: number; y: number; k: number }> = ({ t, x, y, k }) => (k <= 0.001 ? null :
  <div style={{ position: "absolute", left: x, top: y + (1 - k) * 60, width: 250, height: 500, borderRadius: 38, border: "3px solid rgba(221,235,255,0.6)", background: "linear-gradient(160deg, #15171C, #0B0C0F)", opacity: k, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
    <div style={{ position: "absolute", left: 100, top: 14, width: 50, height: 10, borderRadius: 5, background: "#000" }} />
    <Svg style={{ left: 0, top: 0, width: 250, height: 500 } as React.CSSProperties}>
      {[0, 1, 2].map((i) => { const u = ((t * 0.6 + i / 3) % 1); return <circle key={i} cx={125} cy={230} r={30 + u * 70} fill="none" stroke={AMBER} strokeWidth={2} opacity={(1 - u) * 0.8} />; })}
      <circle cx={125} cy={230} r={26} fill={AMBER} />
    </Svg>
    <div style={{ position: "absolute", left: 0, right: 0, top: 350, textAlign: "center", fontFamily: HEAVY, fontWeight: 700, fontSize: 24, color: WHITE }}>你好，我是 Amoo</div>
    <div style={{ position: "absolute", left: 30, right: 30, top: 400, height: 44, borderRadius: 22, border: "1.5px solid rgba(221,235,255,0.35)", fontFamily: HEAVY, fontSize: 18, color: DIM, display: "flex", alignItems: "center", paddingLeft: 16 }}>帮我订明早的高铁票…</div>
  </div>);
const APPS = ["微信", "淘宝", "支付宝", "QQ", "高德地图", "DeepSeek", "Kimi", "拼多多", "小红书", "WPS"];
export const China: React.FC<{ t: number }> = ({ t }) => {
  const S = seg("china");
  if (t < S.t - 0.4 || t >= S.out + 0.4) return null;
  const L = (i: number) => line("china", i).t, out = S.out + 0.2;
  const step = 1 - eInOut(range(t, L(1) - 0.4, L(1))), dou = eInOut(range(t, L(1) - 0.4, L(1)));
  const price = at("china", 0, "三千"), n155 = at("china", 1, "一百五十五"), wx = at("china", 2, "微信");
  return (
    <Layer o={eOut(range(t, S.t - 0.4, S.t)) * (1 - eIn(range(t, S.out - 0.1, S.out + 0.3)))}>
      <Headline t={t} at={S.t} out={out} n={4} text="中国战场，火药味十足" hi="中国" />
      <Layer o={step}>
        <Phone t={t} x={480} y={290} k={eOut(range(t, at("china", 0, "阶跃") - 0.1, at("china", 0, "阶跃") + 0.6))} />
        <Note t={t} at={at("china", 0, "阶跃")} out={out} text="阶跃星辰 · STEPX Neo" x={820} y={330} size={44} color={WHITE} weight={900} />
        <Note t={t} at={at("china", 0, "AI")} out={out} text="会替你点手机的 AI 手机" x={822} y={400} size={30} />
        <Counter t={t} at={price} dur={0.9} out={out} to={3999} suffix="元" x={820} y={470} size={130} suffixSize={50} />
        <Note t={t} at={price + 0.6} out={out} text="先行版 · 10.13 发布 · 10.16 首销" x={822} y={630} size={26} />
        <Tag t={t} at={price + 0.8} out={out} text="官方" x={822} y={680} kind="official" />
      </Layer>
      <Layer o={dou}>
        <Svg>
          {Array.from({ length: 155 }, (_, i) => { const c = i % 31, r = Math.floor(i / 31), s = n155 + i * 0.009, k = eOut(range(t, s, s + 0.3));
            const x = 300 + c * 49, y = 330 + r * 62;
            return <g key={i}>
              <rect x={x} y={y} width={40} height={40} rx={10} fill={k > 0.5 ? "rgba(255,90,78,0.85)" : "rgba(221,235,255,0.12)"} />
              {k > 0.5 && <path d={`M${x + 12},${y + 12}L${x + 28},${y + 28}M${x + 28},${y + 12}L${x + 12},${y + 28}`} stroke="#fff" strokeWidth={3} />}
            </g>; })}
        </Svg>
        <Counter t={t} at={n155} dur={1.4} out={out} to={155} suffix="款应用拒绝被豆包操作" x={300} y={660} size={110} suffixSize={42} color={RED} />
        {APPS.map((a, i) => { const s = wx + (i < 3 ? i * 0.3 : 0.9 + (i - 3) * 0.08), k = eOut(range(t, s, s + 0.25));
          return k > 0 ? <div key={a} style={{ position: "absolute", left: 300 + (i % 5) * 300, top: 800 + Math.floor(i / 5) * 56, opacity: k * (1 - eIn(range(t, out - 0.3, out))), fontFamily: HEAVY, fontWeight: 900, fontSize: 34, color: WHITE }}>
            <span style={{ color: RED, marginRight: 10 }}>✕</span>{a}</div> : null; })}
        <Note t={t} at={wx + 1.2} out={out} text="腾讯系 66 · 阿里系 23 · 目前适用于两款努比亚手机 · 名单每周更新" x={1810} y={930} anchor="right" size={22} />
        <Tag t={t} at={L(1) + 0.5} out={out} text="官方 · 豆包公告 10.14" x={1810 - 280} y={290} kind="official" />
      </Layer>
    </Layer>
  );
};
export { BEAM, eInOut };
