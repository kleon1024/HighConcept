// The hook (a flame in a carved turnip: 「万圣节的南瓜灯，原本是萝卜」), the question with the film's five lanterns,
// Samhain (a bonfire and a fairy mound whose door opens — 传说), and All Hallows (1 November, its eve, Hallowe'en).
import React from "react";
import { CREAM, Card, Credit, FELL, Flame, GLOW, HJ, LANTERNS, Lantern, Layer, MOSS, NIGHT, Note, ORANGE, PURPLE, SANS, Say, Svg, Tag, Embers, eIn, eInOut, eOut, fade, lerp, range, scene } from "./kit";

const H = HJ.hook, T = HJ.thesis, S = HJ.samhain, A = HJ.hallows;
export const ROW = { x0: 360, dx: 300, y: 800, s: 1.25 };

export const Hook: React.FC<{ t: number }> = ({ t }) => {
  if (t >= T.t + 0.6) return null;
  const lit = eOut(range(t, H.strike + 0.15, H.strike + 0.6));
  const go = eInOut(range(t, T.t - 0.5, T.t + 0.3));                     // the lantern glides into its place in the row
  const x = lerp(880, ROW.x0, go), y = lerp(990, ROW.y, go), sc = lerp(3.0, ROW.s, go);
  const match = range(t, 0, 0.5);
  return (
    <Layer o={1} style={{ background: go < 1 ? NIGHT : "transparent" }}>
      <Svg>
        <Lantern kind={0} x={x} y={y} s={sc} lit={lit} t={t} />
        {/* the match that lights it */}
        {match < 1 && <g opacity={1 - eIn(range(t, 0.35, 0.5))}><line x1={x + 160} y1={y - 120 - 140 * (1 - match)} x2={x + 40} y2={y - 220 - 140 * (1 - match)} stroke="#D9B98A" strokeWidth={8} strokeLinecap="round" /><Flame x={x + 40} y={y - 222 - 140 * (1 - match)} h={44} t={t} seed={8} /></g>}
      </Svg>
      <Card src="hw_turnip.jpg" t={t} at={H.l2 + 0.2} out={T.t + 0.1} x={1480} y={600} w={540} h={700} rot={5} from={[700, 0]} focus={[0.55, 0.42]} />
      <Note t={t} at={H.l2 + 0.6} out={T.t} text="马恩岛的萝卜灯（真实照片）" x={1480} y={968} anchor="center" size={24} />
      <Layer o={1 - go}>
        <Say t={t} at={H.l1} out={T.t} text="万圣节的南瓜灯，" x={110} y={90} size={70} />
        <Say t={t} at={H.l2} out={T.t} text="原本是萝卜。" x={110} y={185} size={120} color={ORANGE} stagger={0.07} />
      </Layer>
      <Credit t={t} at={H.l2 + 0.4} out={T.t} text="Hop-tu-Naa 萝卜灯 · Culture Vannin（CC0）" />
    </Layer>
  );
};

export const Thesis: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.t - 0.3 || t >= T.out + 0.6) return null;
  const dive = eIn(range(t, T.dive, T.out + 0.5));
  return (
    <Layer o={Math.min(eOut(range(t, T.t - 0.3, T.t + 0.3)), 1 - eIn(range(t, T.out + 0.1, T.out + 0.5)))} style={{ background: NIGHT }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1, 9, dive)})`, transformOrigin: `${ROW.x0}px ${ROW.y - 75}px` }}>
        <Svg>
          {LANTERNS.map((_, i) => <Lantern key={i} kind={i} x={ROW.x0 + i * ROW.dx} y={ROW.y} s={ROW.s} lit={i === 0 ? 1 : 0} t={t} />)}
          {LANTERNS.map((n, i) => <text key={n} x={ROW.x0 + i * ROW.dx} y={ROW.y + 60} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill={i === 0 ? GLOW : "rgba(242,230,201,0.45)"}
            opacity={eOut(range(t, T.row + 0.3 + i * 0.12, T.row + 0.6 + i * 0.12))}>{n}</text>)}
        </Svg>
      </div>
      <Say t={t} at={T.l1} out={T.out + 0.2} text="人类为什么需要一个“鬼节”？" x={960} y={180} size={76} anchor="center" />
    </Layer>
  );
};

// a night of paper-cut silhouettes: the moon, hills, a bonfire, a fairy mound whose door opens
export const Samhain: React.FC<{ t: number }> = ({ t }) => {
  if (t < S.t - 0.5 || t >= S.out + 0.6) return null;
  const door = eInOut(range(t, S.door, S.door + 1.0));
  const toArch = eInOut(range(t, S.out - 0.6, S.out + 0.4));
  const MX = 1380, MY = 760;
  return (
    <Layer o={scene(t, S.t, S.out)} style={{ background: `linear-gradient(180deg, #0B0712 0%, ${PURPLE} 55%, #3A2342 100%)` }}>
      <Svg>
        <circle cx={1500} cy={250} r={120} fill="#F4E7C8" opacity={0.92} />
        <circle cx={1500} cy={250} r={220} fill="#F4E7C8" opacity={0.08} />
        <path d="M 0,760 C 300,640 520,660 760,720 C 980,770 1160,690 1400,700 C 1620,710 1800,660 1920,700 L 1920,1080 L 0,1080 Z" fill="#1A1622" />
        <path d="M 0,860 C 260,780 520,800 820,850 C 1080,890 1340,820 1640,840 C 1780,850 1860,830 1920,840 L 1920,1080 L 0,1080 Z" fill={MOSS} />
        {/* the fairy mound (síd) and its door */}
        <path d={`M ${MX - 300},${MY + 120} C ${MX - 220},${MY - 120} ${MX + 220},${MY - 120} ${MX + 300},${MY + 120} Z`} fill="#16241C" />
        <path d={`M ${MX - 70},${MY + 110} L ${MX - 70},${MY + 10} A 70,70 0 0 1 ${MX + 70},${MY + 10} L ${MX + 70},${MY + 110} Z`} fill={`rgba(255,200,120,${0.15 + 0.85 * door})`} />
        {door > 0 && <path d={`M ${MX - 70},${MY + 110} L ${MX - 70},${MY + 10} A 70,70 0 0 1 ${MX + 70},${MY + 10} L ${MX + 70},${MY + 110} Z`} fill="none" stroke={GLOW} strokeWidth={4} opacity={door} />}
        {door > 0 && <path d={`M ${MX - 70},${MY + 110} L ${MX - 300},${MY + 320} L ${MX + 300},${MY + 320} L ${MX + 70},${MY + 110} Z`} fill={`rgba(255,190,110,${0.22 * door})`} style={{ filter: "blur(12px)" }} />}
        <g transform={`translate(${MX - 70 - 70 * door * 0.2},0)`}><path d={`M 0,${MY + 110} L 0,${MY + 10} A 70,70 0 0 1 ${70 * (1 - door)},${MY - 60 + 70 * door * 0.0} L ${70 * (1 - door)},${MY + 110} Z`} fill="#0D150F" opacity={1 - door * 0.9} /></g>
        {/* the bonfire */}
        <Flame x={460} y={735} h={150} t={t} seed={1} />
        <Flame x={420} y={740} h={90} t={t + 0.4} seed={2} glow={0} />
        <Flame x={505} y={742} h={100} t={t + 0.9} seed={3} glow={0} />
        <path d="M 380,750 L 540,736 M 390,736 L 530,752" stroke="#2A1A10" strokeWidth={12} strokeLinecap="round" />
      </Svg>
      <Embers t={t} n={36} o={0.8} />
      <Say t={t} at={S.l1} out={S.out + 0.2} text="中世纪爱尔兰：萨温节" x={110} y={100} size={64} />
      <Note t={t} at={S.l1 + 0.3} out={S.out} text="Samhain · 11月1日，冬季的开端" x={114} y={190} size={30} font={FELL} color="rgba(242,230,201,0.8)" />
      <Say t={t} at={S.l2} out={S.out + 0.2} text="传说这一夜，仙丘的门会打开。" x={110} y={250} size={56} color={CREAM} />
      <Tag t={t} at={S.l2 + 0.3} out={S.out} text="传说" x={114} y={340} />
      <div style={{ position: "absolute", inset: 0, background: NIGHT, opacity: toArch * 0.6 }} />
    </Layer>
  );
};

// All Hallows: a gothic arch, three calendar leaves, and "All Hallows' Even" squashing into "Hallowe'en"
const LEAVES = [["10.31", "万圣夜", "All Hallows' Eve"], ["11.1", "万圣节", "All Saints' Day"], ["11.2", "万灵节", "All Souls' Day"]];
export const Hallows: React.FC<{ t: number }> = ({ t }) => {
  if (t < A.t - 0.5 || t >= A.out + 0.6) return null;
  const sq = eInOut(range(t, A.squash, A.squash + 0.8));
  return (
    <Layer o={scene(t, A.t, A.out)} style={{ background: "#120D18" }}>
      <Svg>
        {/* a gothic window glowing */}
        <path d="M 760,980 L 760,420 Q 760,200 960,120 Q 1160,200 1160,420 L 1160,980 Z" fill="#2A1E34" stroke="#4A3B52" strokeWidth={10} />
        <path d="M 790,960 L 790,430 Q 790,230 960,155 Q 1130,230 1130,430 L 1130,960 Z" fill="url(#glass)" opacity={0.7} />
        <defs><linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5B3A7A" /><stop offset="0.5" stopColor="#A8562A" /><stop offset="1" stopColor="#3A2342" /></linearGradient></defs>
        <line x1={960} y1={155} x2={960} y2={960} stroke="#4A3B52" strokeWidth={8} /><line x1={790} y1={560} x2={1130} y2={560} stroke="#4A3B52" strokeWidth={8} />
      </Svg>
      {LEAVES.map(([d, cn, en], i) => {
        const at = A.cal[i], k = eOut(range(t, at, at + 0.35)); if (t < at) return null;
        const x = 140 + i * 0, y = 330 + i * 150, hi = i === 0 && t > A.l2;
        return <div key={d} style={{ position: "absolute", left: x, top: y, width: 520, height: 128, background: hi ? "#F7D9A8" : CREAM, borderRadius: 6, boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
          transform: `perspective(800px) rotateX(${(1 - k) * 80}deg)`, transformOrigin: "50% 0%", display: "flex", alignItems: "center", gap: 22, padding: "0 26px", boxSizing: "border-box" }}>
          <div style={{ fontFamily: FELL, fontSize: 64, color: hi ? "#B5440C" : "#3A2A1E", width: 150 }}>{d}</div>
          <div><div style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 900, fontSize: 40, color: "#2A1E16" }}>{cn}</div><div style={{ fontFamily: FELL, fontStyle: "italic", fontSize: 26, color: "#6A5440" }}>{en}</div></div>
        </div>;
      })}
      <Say t={t} at={A.l1} out={A.l2} text="教会定下：11月1日，万圣节" x={110} y={110} size={54} />
      <Note t={t} at={A.l1 + 0.3} out={A.out} text="8–9世纪，教宗格里高利三世、四世" x={114} y={190} size={24} />
      <Say t={t} at={A.l2} out={A.out + 0.2} text="10月31日，是它的“前夜”。" x={110} y={110} size={54} color={GLOW} />
      {/* All Hallows' Even → Hallowe'en */}
      <div style={{ position: "absolute", left: 1240, top: 720, fontFamily: FELL, fontSize: 70, color: CREAM, opacity: fade(t, A.l2 + 0.3, A.out + 0.3), whiteSpace: "nowrap", textShadow: "0 0 18px rgba(240,122,26,0.5)" }}>
        {sq < 0.5 ? <span style={{ letterSpacing: lerp(0, -14, sq * 2) }}><span style={{ opacity: 1 - sq * 2 }}>All </span>Hallows<span style={{ opacity: 1 - sq * 2 }}>' </span>Even</span>
          : <span style={{ color: ORANGE, display: "inline-block", transform: `scale(${1 + 0.25 * Math.sin((sq - 0.5) * 2 * Math.PI)})` }}>Hallowe'en</span>}
      </div>
      <Note t={t} at={A.squash + 0.6} out={A.out} text="苏格兰话的缩写" x={1244} y={820} size={24} />
    </Layer>
  );
};
export { eIn as _eIn };
