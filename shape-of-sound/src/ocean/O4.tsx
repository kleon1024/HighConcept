// Act IV: the sea remembers (HMS Challenger, 1872, and the deep Pacific still cooling from the Little Ice Age), the
// conveyor's weakening heartbeat (the AMOC), and the ending on Ma Yuan's water: Li Bai's river that "never returns"
// does return — the water rising from the deep last saw the sun about when he was writing; the duck floats home.
import React from "react";
import { Art, BLACK, BRUSH, Credit, DUCK, Duck, FOAM, Layer, Note, OJ, SANS, SERIF, STREAM, Say, Svg, eIn, eInOut, eOut, fade, range } from "./kit";

const C = OJ.challenger, A = OJ.amoc, E = OJ.ending;
const SILK_INK = "#2A1C10";

export const Challenger: React.FC<{ t: number }> = ({ t }) => {
  if (t < C.t - 0.6 || t >= C.out + 0.6) return null;
  const o = Math.min(eOut(range(t, C.t - 0.6, C.t + 0.3)), 1 - eInOut(range(t, C.out - 0.3, C.out + 0.5)));
  const mem = eInOut(range(t, C.memory - 0.3, C.memory + 0.5));
  const gauge = fade(t, C.l2 - 0.2, C.memory, 0.4, 0.4), cold = eOut(range(t, C.l2 + 0.4, C.l2 + 1.4));
  return (
    <Layer o={o} style={{ background: "#0C1218" }}>
      <Art src="oc_challenger.jpg" t={t} a={C.t - 0.6} b={C.out + 0.6} from={[0.5, 0.45, 1.06]} to={[0.56, 0.42, 1.2]} filter="grayscale(1) sepia(0.35) hue-rotate(175deg) saturate(0.7) contrast(1.15) brightness(0.92)" />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(8,14,22,0.75) 0%, rgba(8,14,22,0.2) 55%, rgba(8,14,22,0) 100%)" }} />
      <Say t={t} at={C.l1} out={C.l2} text="1872年，挑战者号出海，" x={110} y={110} size={58} weight={900} />
      <Say t={t} at={C.l1 + 0.5} out={C.l2} text="第一次环球测量深海水温" x={110} y={195} size={58} weight={600} color={STREAM} />
      <Say t={t} at={C.l2} out={C.memory} text="一百多年后再测：" x={110} y={110} size={58} weight={600} />
      <Say t={t} at={C.l2 + 0.4} out={C.memory} text="太平洋深处，还在变冷" x={110} y={195} size={72} weight={900} color="#9FD0FF" />
      <Say t={t} at={C.l3} out={C.memory} text="它还在回应几百年前的小冰期" x={110} y={300} size={50} weight={600} />
      {/* a depth gauge (schematic): the 1870s reading and today's, deep in the Pacific */}
      <Svg>
        <g opacity={gauge}>
          <line x1={1640} y1={160} x2={1640} y2={940} stroke="rgba(234,244,247,0.6)" strokeWidth={3} />
          {[0, 1000, 2000, 3000, 4000, 5000].map((m, i) => <g key={m}><line x1={1628} y1={160 + i * 156} x2={1652} y2={160 + i * 156} stroke="rgba(234,244,247,0.6)" strokeWidth={3} />
            <text x={1668} y={168 + i * 156} fontFamily={SANS} fontWeight={500} fontSize={22} fill="rgba(234,244,247,0.7)">{m} 米</text></g>)}
          <rect x={1600} y={160 + 2 * 156} width={80} height={2 * 156} fill="#5FA8FF" opacity={0.18 + 0.25 * cold} />
          <path d={`M 1560,${160 + 2.5 * 156} l 0,${70 * cold} m -16,-18 l 16,18 l 16,-18`} stroke="#9FD0FF" strokeWidth={5} fill="none" opacity={cold} />
          <text x={1545} y={160 + 2.5 * 156 + 34} textAnchor="end" fontFamily={SANS} fontWeight={700} fontSize={28} fill="#9FD0FF" opacity={cold}>变冷</text>
          <text x={1640} y={985} textAnchor="middle" fontFamily={SANS} fontWeight={500} fontSize={20} fill="rgba(234,244,247,0.5)">示意</text>
        </g>
      </Svg>
      <div style={{ position: "absolute", inset: 0, background: "#060A10", opacity: mem * 0.75 }} />
      <Say t={t} at={C.memory} out={C.out + 0.3} text="大海，有记忆。" x={960} y={430} size={130} anchor="center" weight={900} stagger={0.09} shadow="0 6px 40px rgba(0,0,0,0.7)" />
      <Credit t={t} at={C.t} out={C.memory} text="HMS Challenger，《伦敦新闻画报》1872 · Gebbie & Huybers 2019, Science" />
    </Layer>
  );
};

// the heartbeat of the Atlantic overturning: beats come slower and weaker, then the line lies down into a wave
const BEATS = [[75.5, 1], [76.2, 0.88], [77.0, 0.76], [77.95, 0.62], [79.05, 0.46]];
const ecg = (u: number) => (u < -0.06 || u > 0.12 ? 0 : u < 0 ? -0.15 * Math.sin(((u + 0.06) / 0.06) * Math.PI) : u < 0.03 ? Math.sin((u / 0.03) * Math.PI) : -0.35 * Math.sin(((u - 0.03) / 0.09) * Math.PI));
export const Amoc: React.FC<{ t: number }> = ({ t }) => {
  if (t < A.t - 0.4 || t >= A.out + 0.8) return null;
  const o = Math.min(eOut(range(t, A.t - 0.4, A.t + 0.2)), 1 - eIn(range(t, A.out + 0.1, A.out + 0.7)));
  const SPEED = 900, wave = eInOut(range(t, A.flat, A.out + 0.4));
  const ys = Array.from({ length: 193 }, (_, i) => {
    const x = i * 10; let y = 0;
    for (const [tb, amp] of BEATS) { const xb = 1500 - (t - tb) * SPEED; y += amp * ecg((x - xb) / 1200) * 230; }
    y = y * (1 - wave) + wave * Math.sin(x / 120 + t * 2) * 26;
    return `${i ? "L" : "M"}${x},${(560 - y).toFixed(1)}`;
  }).join("");
  return (
    <Layer o={o} style={{ background: "#03070D" }}>
      <Svg>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <line key={i} x1={0} y1={260 + i * 100} x2={1920} y2={260 + i * 100} stroke="rgba(95,168,255,0.07)" strokeWidth={1} />)}
        <path d={ys} fill="none" stroke="#5FA8FF" strokeWidth={14} opacity={0.18} style={{ filter: "blur(8px)" }} />
        <path d={ys} fill="none" stroke="#BFE1FF" strokeWidth={4} />
      </Svg>
      <Say t={t} at={A.l1} out={A.out + 0.2} text="如今，大西洋这段传送带，" x={110} y={110} size={58} weight={600} />
      <Say t={t} at={A.l2} out={A.out + 0.2} text="处在一千多年来最弱。" x={110} y={195} size={80} weight={900} color="#FF9A6A" />
      <Note t={t} at={A.t} out={A.out} text="大西洋经向翻转环流（AMOC）· Caesar et al. 2021, Nature Geoscience" x={112} y={1020} size={18} color="rgba(234,244,247,0.55)" />
    </Layer>
  );
};

// ---------- the ending, on Ma Yuan's water ----------
const Col: React.FC<{ t: number; at: number; out: number; text: string; x: number; y: number; size: number; color?: string }> = ({ t, at, out, text, x, y, size, color = SILK_INK }) => {
  if (t < at || t >= out) return null;
  const o = 1 - eIn(range(t, out - 0.4, out));
  return <div style={{ position: "absolute", left: x, top: y, display: "flex", flexDirection: "column", opacity: o }}>
    {Array.from(text).map((ch, i) => { const k = eOut(range(t, at + i * 0.11, at + i * 0.11 + 0.5));
      return <span key={i} style={{ fontFamily: BRUSH, fontSize: size, lineHeight: 1.04, color, opacity: k, filter: `blur(${(1 - k) * 3}px)` }}>{ch}</span>; })}
  </div>;
};
export const Ending: React.FC<{ t: number }> = ({ t }) => {
  if (t < E.t - 0.6) return null;
  const o = eOut(range(t, E.t - 0.6, E.t + 0.4));
  const river = 1 - eInOut(range(t, E.home - 0.4, E.home + 0.6));
  const loop = eInOut(range(t, E.back, E.back + 1.6));
  const L = 2400;
  const titleK = eInOut(range(t, E.title - 0.3, E.title + 0.8));
  const bob = Math.sin(t * 1.9) * 5, roll = Math.sin(t * 1.4) * 5;
  return (
    <Layer o={o} style={{ background: "#1A1208" }}>
      <Layer o={river}>
        <Art src="oc_river.jpg" t={t} a={E.t - 0.6} b={E.home} from={[0.55, 0.62, 1.12]} to={[0.45, 0.58, 1.0]} filter="sepia(0.15) contrast(1.06)" />
        <Col t={t} at={E.poem} out={E.back + 0.1} text="君不见黄河之水天上来" x={1730} y={90} size={74} />
        <Col t={t} at={E.poem + 1.2} out={E.back + 0.1} text="奔流到海不复回" x={1630} y={90} size={74} />
        <Col t={t} at={E.poem + 2.0} out={E.back + 0.1} text="李白·将进酒" x={1556} y={96} size={34} color="#7A1F14" />
        {/* it does come back: the river loops round */}
        <Svg>
          <path d="M 1500,140 C 1200,120 900,260 900,520 C 900,820 1300,900 1480,760 C 1640,640 1560,420 1380,430" fill="none" stroke="#1F3B5C" strokeWidth={8} strokeLinecap="round"
            strokeDasharray={`${L * loop} ${L * 2}`} opacity={0.85 * fade(t, E.back, E.l1 + 0.2, 0.2, 0.5)} />
        </Svg>
        <Say t={t} at={E.back} out={E.l1} text="其实，它会回来。" x={300} y={180} size={96} color={SILK_INK} weight={900} stagger={0.08} blur={0} />
        <div style={{ position: "absolute", left: 240, top: 120, width: 1160, height: 300, background: "radial-gradient(ellipse at 40% 50%, rgba(238,222,190,0.75) 0%, rgba(238,222,190,0) 70%)", opacity: fade(t, E.l1 - 0.2, E.home, 0.3, 0.4) }} />
        <Say t={t} at={E.l1} out={E.home + 0.2} text="此刻从太平洋深处升起的海水，" x={300} y={170} size={58} color={SILK_INK} weight={600} blur={0} />
        <Say t={t} at={E.l2} out={E.home + 0.2} text="上一次见到阳光，李白可能还在写诗。" x={300} y={255} size={64} color="#7A1F14" weight={900} blur={0} />
        <Note t={t} at={E.l2} out={E.home} text="北太平洋深层水约1200–1500年未接触海面 · Gebbie & Huybers 2012" x={112} y={1020} size={18} color="rgba(42,28,16,0.7)" />
        <Credit t={t} at={E.t} out={E.home} text="马远《水图》· 黄河逆流（南宋）· 故宫博物院" color="rgba(42,28,16,0.7)" />
      </Layer>
      <Layer o={1 - river}>
        <Art src="oc_clouds.jpg" t={t} a={E.home - 0.4} b={E.out} from={[0.5, 0.6, 1.0]} to={[0.5, 0.62, 1.1]} filter="sepia(0.15) contrast(1.06)" />
        <Svg><Duck x={1240 + (t - E.home) * 14} y={760 + bob} s={92} rot={roll} o={eOut(range(t, E.home + 0.3, E.home + 1.0)) * (1 - titleK)} /></Svg>
        <Say t={t} at={E.home + 0.4} out={E.title + 0.2} text="每一滴海水，都在回家的路上。" x={1160} y={170} size={80} anchor="center" color={SILK_INK} weight={900} stagger={0.07} blur={0} />
        <Credit t={t} at={E.home} out={E.title} text="马远《水图》· 云生苍海（南宋）· 故宫博物院" color="rgba(42,28,16,0.7)" />
      </Layer>
      {/* the title card */}
      <Layer o={titleK} style={{ background: "#0B1E33" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: BRUSH, fontSize: 240, color: FOAM, letterSpacing: 30 }}>洋流</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 590, textAlign: "center", fontFamily: SERIF, fontWeight: 600, fontSize: 40, color: DUCK, letterSpacing: 12 }}>海里的河</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 930, textAlign: "center", fontFamily: SANS, fontWeight: 500, fontSize: 20, color: "rgba(234,244,247,0.6)", letterSpacing: 1.5, lineHeight: 1.7 }}>
          图：葛饰北斋 · 富兰克林与福尔杰 · 温斯洛·霍默 · NASA/GSFC SVS · 海克尔 · 《伦敦新闻画报》 · 马远<br />
          数据：Ebbesmeyer & Ingraham · Donohue 2016 · Lebreton 2018 · NOAA · Gebbie & Huybers 2012/2019 · Caesar 2021
        </div>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}><Duck x={960} y={760} s={60} o={eOut(range(t, E.title + 0.4, E.title + 1.0))} rot={Math.sin(t * 1.9) * 5} /></svg>
      </Layer>
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: eIn(range(t, E.out - 0.6, E.out)) }} />
    </Layer>
  );
};
export { BLACK };
