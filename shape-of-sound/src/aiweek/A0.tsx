// 本周AI要闻 · the cold open (v2): four of the week's beats in about four seconds, hard cuts with a flash frame on each
// word — 窃听器 / 芯片股暴跌 / AI 报假警 / 明星公司破产 — each a preview of the picture its story will open later, then
// "all true, all this week" and the title. The film's name sits in the top bar from the first frame.
import React from "react";
import { AMBER, Beam, Counter, DISPLAY, eIn, eInOut, eOut, FAINT, Flare, HEAVY, Layer, lerp, Letterbox, MONO, Note, range, RED, Slam, Streaks, Svg, WHITE } from "./kit";
import { Roll } from "./A1";
import { Bubble, Form } from "./A3";
import { line, seg } from "./timeline";

// one beat of the montage: on screen from its word to the next one, pushing in slowly, with its story's number in the corner
const Beat: React.FC<React.PropsWithChildren<{ t: number; a: number; b: number; n: number }>> = ({ t, a, b, n, children }) => {
  if (t < a - 0.04 || t >= b - 0.04) return null;
  const s = lerp(1.06, 1.0, eOut(range(t, a - 0.04, a + 0.5)));
  return <Layer style={{ transform: `scale(${s})` }}>
    {children}
    {/* the number this story will carry when it opens */}
    <div style={{ position: "absolute", right: 120, bottom: 160, fontFamily: DISPLAY, fontSize: 104, lineHeight: 1, color: "transparent", WebkitTextStroke: `2px ${FAINT}` }}>{String(n).padStart(2, "0")}</div>
  </Layer>;
};

export const Hook: React.FC<{ t: number }> = ({ t }) => {
  const S = seg("hook");
  if (t >= S.out + 0.6) return null;
  const L = (i: number) => line("hook", i).t;
  const title = eOut(range(t, L(4), L(4) + 0.25)), box = 1 - eInOut(range(t, S.out - 0.3, S.out + 0.4));
  // a flash frame on every cut
  const flash = Math.max(...[0, 1, 2, 3, 4].map((i) => Math.max(0, 1 - Math.abs(t - L(i) + 0.02) / 0.09)));
  return (
    <Layer>
      <Beat t={t} a={0} b={L(1)} n={1}>
        <div style={{ position: "absolute", left: 470, top: -60, width: 400, height: 900, opacity: 0.5, background: "linear-gradient(180deg, rgba(221,235,255,0.0) 0%, rgba(221,235,255,0.14) 60%, rgba(221,235,255,0.0) 100%)", clipPath: "polygon(42% 0, 58% 0, 100% 100%, 0 100%)" }} />
        <Svg><Roll cx={670} cy={610} s={1.2} t={t} rec={1} /></Svg>
        <Slam t={t} at={L(0)} out={L(1)} text="窃听器" x={1000} y={380} size={170} color={RED} stagger={0.05} />
        <Note t={t} at={L(0) + 0.1} out={L(1)} text="藏在卫生纸里 · OpenAI 高管会议室" x={1006} y={590} size={34} color={WHITE} weight={700} />
      </Beat>
      <Beat t={t} a={L(1)} b={L(2)} n={2}>
        <div style={{ position: "absolute", left: 420, top: 300, width: 200, height: 470 * eOut(range(t, L(1), L(1) + 0.6)), background: `linear-gradient(180deg, ${RED} 0%, rgba(255,90,78,0.3) 100%)`, boxShadow: "0 0 40px rgba(255,90,78,0.4)" }} />
        <Beam y={300} x0={380} x1={660} k={1} w={2} />
        <Note t={t} at={L(1)} out={L(2)} text="SK海力士 · 10月13日 · 首尔" x={720} y={330} size={34} color={WHITE} weight={700} />
        <Counter t={t} at={L(1)} dur={0.6} out={L(2)} to={-10.09} decimals={2} suffix="%" x={710} y={400} size={210} color={RED} suffixSize={110} />
        <Slam t={t} at={L(1) + 0.15} out={L(2)} text="芯片股暴跌" x={724} y={640} size={80} color={WHITE} stagger={0.04} />
      </Beat>
      <Beat t={t} a={L(2)} b={L(3)} n={5}>
        <div style={{ position: "absolute", left: -80, top: -40, width: 1920, height: 1080, transform: "scale(0.9)", transformOrigin: "380px 570px" }}><Form t={t} at={L(2) - 1.75} k={1} /></div>
        <Slam t={t} at={L(2)} out={L(3)} text="AI 报假警" x={1040} y={380} size={150} color={RED} stagger={0.05} />
        <Note t={t} at={L(2) + 0.1} out={L(3)} text="Anthropic 内部测试 · 向警方网站编造线索" x={1046} y={580} size={32} color={WHITE} weight={700} />
      </Beat>
      <Beat t={t} a={L(3)} b={L(4)} n={6}>
        <Bubble t={t} crack={eInOut(range(t, L(3) + 0.25, L(3) + 0.8))} x={-40} y={60} />
        <Slam t={t} at={L(3)} out={L(4)} text="破产" x={1000} y={380} size={200} color={WHITE} stagger={0.08} />
        <Note t={t} at={L(3) + 0.1} out={L(4)} text="明星应用 Character.AI" x={1006} y={630} size={36} color={WHITE} weight={700} />
      </Beat>
      {flash > 0 && <div style={{ position: "absolute", inset: 0, background: "#EAF2FF", opacity: 0.55 * flash }} />}
      {/* the title */}
      <Layer o={title * (1 - eIn(range(t, S.out - 0.2, S.out + 0.4)))}>
        <Streaks t={t} n={8} seed={3} />
        <Flare x={960} y={430} k={Math.max(0, 1 - Math.abs(t - L(4) - 0.05) / 0.35)} s={1.4} />
        <Beam y={560} k={eOut(range(t, L(4) - 0.1, L(4) + 0.25))} />
        <Slam t={t} at={L(4)} out={S.out + 0.5} text="本周AI要闻" x={960} y={340} size={180} anchor="center" tracking={12} />
        <Note t={t} at={L(4) + 0.3} out={S.out + 0.5} text="2026 · 10.8 — 10.15 · 全部真事" x={960} y={600} anchor="center" size={36} color={AMBER} font={MONO} weight={700} />
      </Layer>
      <Letterbox k={box} />
      {/* the film's name in the top bar from the first frame */}
      <div style={{ position: "absolute", left: 120, top: 48, opacity: box * (1 - title), fontFamily: HEAVY, fontWeight: 900, fontSize: 34, letterSpacing: 6, color: WHITE }}>
        本周AI要闻 <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, color: AMBER, marginLeft: 16 }}>10.8 — 10.15</span>
      </div>
    </Layer>
  );
};
