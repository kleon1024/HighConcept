// Souling (knocking for soul cakes), guising (Maclise's Snap-Apple Night; children in disguise; the folk explanation
// flagged as such), America (the turnip becomes a pumpkin; postcards), and the boom (trick or treat → $13.5 bn → stop).
import React from "react";
import { Art, CREAM, Card, Credit, FELL, Flame, GLOW, HJ, INK, Lantern, Layer, Note, ORANGE, Say, Svg, Tag, Vignette, eIn, eInOut, eOut, fade, lerp, range, rnd, scene } from "./kit";

const SO = HJ.souling, G = HJ.guising, C = HJ.cards, B = HJ.boom;

// a wooden door that shakes when knocked and opens on a warm room
const Door: React.FC<{ t: number; knocks: number[]; open?: number; x?: number }> = ({ t, knocks, open = 0, x = 1320 }) => {
  const shake = knocks.reduce((a, s) => a + (t > s && t < s + 0.15 ? Math.sin((t - s) * 90) * (1 - (t - s) / 0.15) * 4 : 0), 0);
  const W = 380, H = 640, Y = 300;
  return (
    <g transform={`translate(${shake},0)`}>
      <rect x={x - W / 2 - 30} y={Y - 30} width={W + 60} height={H + 30} fill="#2A1E16" />
      <rect x={x - W / 2} y={Y} width={W} height={H} fill="#FFC77A" />
      <rect x={x - W / 2} y={Y} width={W} height={H} fill="url(#roomGlow)" />
      <defs><radialGradient id="roomGlow" cx="0.5" cy="0.45" r="0.7"><stop offset="0" stopColor="#FFE4B0" /><stop offset="1" stopColor="#D9822B" /></radialGradient></defs>
      <g transform={`translate(${x - W / 2},0) scale(${1 - 0.85 * open},1)`}>
        <rect x={0} y={Y} width={W} height={H} fill="#5A3A24" />
        {[0, 1, 2, 3].map((i) => <line key={i} x1={W * (i + 1) / 5} y1={Y} x2={W * (i + 1) / 5} y2={Y + H} stroke="#3A2416" strokeWidth={4} />)}
        <rect x={20} y={Y + 80} width={W - 40} height={18} fill="#3A2416" /><rect x={20} y={Y + H - 110} width={W - 40} height={18} fill="#3A2416" />
        <circle cx={W - 46} cy={Y + H / 2} r={11} fill="#C9A05A" />
      </g>
    </g>
  );
};

export const Souling: React.FC<{ t: number }> = ({ t }) => {
  if (t < SO.t - 0.5 || t >= SO.out + 0.6) return null;
  const cake = eOut(range(t, SO.l2 - 0.2, SO.l2 + 0.4));
  return (
    <Layer o={scene(t, SO.t, SO.out)} style={{ background: "#151019" }}>
      <Svg>
        <Door t={t} knocks={SO.knock} open={eInOut(range(t, SO.l2 - 0.4, SO.l2 + 0.3)) * 0.35} />
        {/* the soul cake */}
        {cake > 0 && <g transform={`translate(760,690) scale(${cake})`}>
          <circle r={110} fill="#C8894A" /><circle r={96} fill="#DDA05E" />
          {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={Math.cos(i * 2.4) * 70 * rnd(i)} cy={Math.sin(i * 2.4) * 70 * rnd(i)} r={5} fill="#5A3418" opacity={0.75} />)}
          <path d="M -60,0 L 60,0 M 0,-60 L 0,60" stroke="#8A5226" strokeWidth={10} strokeLinecap="round" />
        </g>}
        <Flame x={1320} y={260} h={40} t={t} glow={0.6} seed={5} o={0.9} />
      </Svg>
      <Vignette o={0.7} />
      <Say t={t} at={SO.l1} out={SO.out + 0.2} text="英格兰：穷人挨家讨“灵魂饼”" x={110} y={110} size={56} />
      <Note t={t} at={SO.l1 + 0.3} out={SO.out} text="souling · 至少从16世纪起" x={114} y={196} size={24} font={FELL} />
      <Say t={t} at={SO.l2} out={SO.out + 0.2} text="答应替这家的亡者祈祷。" x={110} y={250} size={50} color={GLOW} />
    </Layer>
  );
};

export const Guising: React.FC<{ t: number }> = ({ t }) => {
  if (t < G.t - 0.5 || t >= G.out + 0.6) return null;
  const pop = eOut(range(t, G.gag, G.gag + 0.35));
  return (
    <Layer o={scene(t, G.t, G.out)} style={{ background: "#120D10" }}>
      <Card src="hw_snap.png" t={t} at={G.t - 0.2} out={G.out + 0.3} x={900} y={600} w={960} h={660} rot={-2} from={[0, 900]} />
      {pop > 0 && <div style={{ position: "absolute", left: 1380, top: lerp(1100, 220, pop), width: 480, height: 600, transform: `rotate(${lerp(18, 6, pop)}deg)`, boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
        background: CREAM, padding: 12, boxSizing: "border-box" }}>
        <Art src="hw_laugh.jpg" t={t} a={G.gag} b={G.out} from={[0.5, 0.35, 1.0]} to={[0.5, 0.35, 1.05]} box={[0, 0, 456, 576]} />
      </div>}
      <Say t={t} at={G.l1} out={G.l2} text="1833年，爱尔兰的万圣夜派对" x={110} y={90} size={52} />
      <Note t={t} at={G.l1 + 0.4} out={G.l2} text="咬吊着的苹果、占卜婚姻……" x={114} y={170} size={26} />
      <Say t={t} at={G.l2} out={G.out + 0.2} text="孩子们扮成鬼，挨家讨赏" x={110} y={90} size={52} color={GLOW} />
      <Say t={t} at={G.gag + 0.9} out={G.out + 0.2} text="一说：为了让真鬼认不出你" x={110} y={170} size={40} color={CREAM} />
      <Tag t={t} at={G.gag + 1.1} out={G.out} text="民间说法" x={114} y={232} />
      <Credit t={t} at={G.t} out={G.gag} text="丹尼尔·麦克利斯《Snap-Apple Night》1833" />
      <Credit t={t} at={G.gag} out={G.out} text="葛饰北斋《百物语 · 笑ひはんにや》约1831 · 美国国会图书馆" />
    </Layer>
  );
};

// America: the turnip becomes a pumpkin; the postcards fly in
export const Cards: React.FC<{ t: number }> = ({ t }) => {
  if (t < C.t - 0.5 || t >= C.out + 0.6) return null;
  const m = eInOut(range(t, C.morph, C.morph + 0.8)), shrink = eInOut(range(t, C.fly - 0.4, C.fly + 0.3));
  return (
    <Layer o={scene(t, C.t, C.out)} style={{ background: "#1A1220" }}>
      <Svg>
        <g opacity={1 - shrink}>
          <g opacity={1 - m}><Lantern kind={0} x={960} y={760} s={2.4 * (1 - 0.2 * m)} lit={1} t={t} /></g>
          <g opacity={m}><Lantern kind={1} x={960} y={760} s={2.0 + 0.4 * m} lit={1} t={t} /></g>
        </g>
      </Svg>
      <Card src="hw_witch.jpg" t={t} at={C.fly} out={C.out + 0.3} x={560} y={600} w={720} h={470} rot={-8} from={[-900, -300]} />
      <Card src="hw_cats.jpg" t={t} at={C.fly + 0.35} out={C.out + 0.3} x={1380} y={560} w={420} h={660} rot={7} from={[900, -400]} />
      <Card src="hw_boys.jpg" t={t} at={C.fly + 0.7} out={C.out + 0.3} x={900} y={760} w={640} h={410} rot={3} from={[0, 900]} />
      <Card src="hw_pulled.jpg" t={t} at={C.fly + 1.05} out={C.out + 0.3} x={1520} y={860} w={560} h={350} rot={-5} from={[900, 600]} />
      <Say t={t} at={C.l1} out={C.fly} text="到了美洲，萝卜换成了南瓜" x={960} y={140} size={60} anchor="center" />
      <Say t={t} at={C.l2} out={C.out + 0.2} text="1900年代：万圣节明信片大流行" x={110} y={90} size={52} />
      <Credit t={t} at={C.fly} out={C.out} text="万圣节明信片，约1908–1910 · 密苏里历史博物馆" />
    </Layer>
  );
};

// the boom: a knock, "trick or treat", the money; then a dead stop and one seed
export const Boom: React.FC<{ t: number }> = ({ t }) => {
  if (t < B.t - 0.5 || t >= B.out + 0.6) return null;
  const stop = t >= B.stop;
  const count = Math.round(135 * eOut(range(t, B.count, B.stop - 0.3)));
  const pile = range(t, B.count, B.stop);
  return (
    <Layer o={scene(t, B.t, B.out)} style={{ background: stop ? "#050306" : "#151019" }}>
      {!stop && <Svg>
        <Door t={t} knocks={[B.knock, B.knock + 0.25, B.knock + 0.5]} open={eInOut(range(t, B.l1 - 0.1, B.l1 + 0.5))} x={1420} />
        {/* pumpkins pile up from the bottom */}
        {Array.from({ length: 70 }, (_, i) => { const at = i / 70; if (pile < at) return null; const k = eOut(Math.min(1, (pile - at) * 8));
          const x = 60 + rnd(i * 3) * 1800, row = Math.floor(i / 14), y = 1060 - row * 70 - rnd(i * 5) * 30 - (1 - k) * 300;
          return <g key={i} transform={`translate(${x},${y}) scale(${0.7 + 0.4 * rnd(i)})`}>{[-30, -10, 10, 30].map((dx, j) => <ellipse key={j} cx={dx} cy={0} rx={26} ry={34} fill={j % 2 ? "#E8731C" : "#F28A2E"} stroke="#B5520F" strokeWidth={2} />)}<rect x={-5} y={-44} width={10} height={14} fill="#4A6A2A" /></g>; })}
      </Svg>}
      {!stop && <Vignette o={0.6} />}
      {!stop && <Say t={t} at={B.l1} out={B.stop} text="“不给糖，就捣蛋！”" x={110} y={110} size={78} color={ORANGE} />}
      {!stop && <Say t={t} at={B.l2} out={B.stop} text="1927年，加拿大报纸上第一次印出这句话" x={110} y={220} size={36} weight={600} />}
      {!stop && <Note t={t} at={B.l2 + 0.3} out={B.stop} text="“trick or treat” · Blackie, Alberta" x={114} y={275} size={24} font={FELL} />}
      {!stop && t >= B.count && <div style={{ position: "absolute", left: 110, top: 380, padding: "18px 30px", background: "rgba(10,6,12,0.82)", borderRadius: 8 }}>
        <div style={{ fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 700, fontSize: 32, color: CREAM }}>2026年，美国人过万圣节要花</div>
        <div style={{ fontFamily: FELL, fontSize: 128, color: GLOW, lineHeight: 1.05 }}>{count}<span style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 900, fontSize: 64 }}> 亿美元</span></div>
        <div style={{ fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 500, fontSize: 22, color: "rgba(242,230,201,0.7)" }}>预计 · 美国零售联合会（NRF）</div>
      </div>}
      {/* the stop: one seed falls */}
      {stop && <Svg><ellipse cx={960} cy={lerp(200, 1100, eIn(range(t, B.stop + 0.15, B.out + 0.5)))} rx={9} ry={14} fill="#EBDDB8" transform={`rotate(${(t - B.stop) * 200} 960 ${lerp(200, 1100, eIn(range(t, B.stop + 0.15, B.out + 0.5)))})`} /></Svg>}
    </Layer>
  );
};
export { INK, fade };
