// 什么是爱 — part 2: the fox (taming = creating ties), four o'clock, the colour of wheat, the parting, the secret.
import React from "react";
import { Art, DUSK, GOLD, GOLDL, INK, LJ, Layer, NIGHT, Note, Orig, PAPER, ROSE, Rose, SERIF, Say, Svg, Thread, WHEAT, Wash, eInOut, eOut, fade, lerp, range, rnd } from "./kit";

const SHADOW = "0 2px 18px rgba(0,0,0,0.6)";
// Franz Marc's crystalline planes: translucent shards of red, blue, yellow and green, slowly turning
const MARC = ["#C8372D", "#23468C", "#E8C547", "#3E8E5A", "#F2EEE6", "#D9772B"];
const Shards: React.FC<{ t: number; o: number }> = ({ t, o }) => (
  <Svg>{Array.from({ length: 34 }, (_, i) => {
    const cx = rnd(i) * 1920, cy = rnd(i + 1) * 1080, r = 120 + rnd(i + 2) * 260, a0 = rnd(i + 3) * 6.28 + t * (0.05 + 0.08 * rnd(i + 4)) * (i % 2 ? 1 : -1);
    const pts = [0, 1, 2].map((k) => `${cx + Math.cos(a0 + k * 2.1 + rnd(i + k) * 0.6) * r},${cy + Math.sin(a0 + k * 2.1 + rnd(i + k) * 0.6) * r}`).join(" ");
    return <polygon key={i} points={pts} fill={MARC[i % MARC.length]} opacity={o * (0.1 + 0.16 * rnd(i + 5)) * (cx > 900 ? 1.6 : 1)} />;
  })}</Svg>
);
// Van Gogh's sky, alive: short curved strokes riding a swirling flow field
const Strokes: React.FC<{ t: number; o: number }> = ({ t, o }) => {
  const field = (x: number, y: number) => Math.sin(x * 0.004 + t * 0.4) * 1.3 + Math.cos(y * 0.006 - t * 0.3) * 1.1 + Math.sin((x + y) * 0.0025) * 0.8;
  const cols = ["#F4E3A1", "#9EC3E8", "#5F86C4", "#FFFFFF", "#E8C55A"];
  return <Svg>{Array.from({ length: 360 }, (_, i) => {
    let x = rnd(i) * 1920, y = rnd(i + 1) * 560; const pts = [`${x},${y}`];
    for (let k = 0; k < 5; k++) { const a = field(x, y); x += Math.cos(a) * 9; y += Math.sin(a) * 9; pts.push(`${x},${y}`); }
    return <polyline key={i} points={pts.join(" ")} fill="none" stroke={cols[i % cols.length]} strokeWidth={3 + rnd(i + 2) * 3} strokeLinecap="round" opacity={o * (0.25 + 0.3 * rnd(i + 3))} />;
  })}</Svg>;
};

// ═══ the fox: tame me — taming means creating ties; one among a hundred thousand becomes the only one
export const Fox: React.FC<{ t: number }> = ({ t }) => {
  const F = LJ.fox;
  if (t < F.t - 0.5 || t >= F.out + 0.5) return null;
  const o = fade(t, F.t - 0.5, F.out + 0.5, 0.6, 0.6);
  const dots = eInOut(range(t, F.dots - 0.4, F.dots + 0.5));
  const N = 900, one = 517;
  const ox = (i: number) => 140 + (i % 45) * 37 + (rnd(i) - 0.5) * 14, oy = (i: number) => 330 + Math.floor(i / 45) * 34 + (rnd(i + 3) - 0.5) * 12;
  const link = eInOut(range(t, F.l4 - 0.2, F.l4 + 0.6));
  const foxP: [number, number] = [1560, 880];
  return (
    <Layer o={o}>
      <Wash t={t} a="rgba(230,150,90,0.35)" b="rgba(242,214,142,0.35)" />
      <Shards t={t} o={1 - dots} />
      <Art src="lv_foxes.jpg" t={t} a={F.t - 0.5} b={F.dots + 0.5} from={[0.5, 0.55, 1.05]} to={[0.5, 0.5, 1.15]} box={[lerp(900, 1920, dots), 0, 1020, 1080]}
        mask="linear-gradient(90deg, transparent 0%, #000 22%)" />
      <Say t={t} at={F.l1} out={F.dots} text="狐狸说：“驯服我吧。”" x={130} y={300} size={60} />
      <Say t={t} at={F.l2} out={F.dots} text="“驯服”，就是建立联系。" x={130} y={410} size={70} color={ROSE} weight={900} />
      <Orig t={t} at={F.l2 + 0.6} out={F.dots} text="apprivoiser — « ça signifie créer des liens »" x={134} y={520} />
      <Note t={t} at={F.l1 + 0.3} out={F.dots} text="画：弗朗茨·马尔克《狐狸》1913" x={1840} y={1020} anchor="right" color={PAPER} />
      {dots > 0 && <Layer o={dots}>
        <Svg>
          {Array.from({ length: N }, (_, i) => <circle key={i} cx={ox(i)} cy={oy(i)} r={i === one ? 7 : 4} fill={i === one && link > 0 ? GOLD : INK} opacity={i === one ? 1 : 0.32 + 0.2 * rnd(i + 9)} />)}
          <Thread d={`M${ox(one)},${oy(one)} C${ox(one) + 300},${oy(one) + 250} ${foxP[0] - 400},${foxP[1] - 80} ${foxP[0]},${foxP[1]}`} k={link} len={1100} w={3.5} />
          {link > 0 && <circle cx={ox(one)} cy={oy(one)} r={18 + 6 * Math.sin(t * 6)} fill="none" stroke={GOLD} strokeWidth={2} opacity={link} />}
          <circle cx={foxP[0]} cy={foxP[1]} r={12} fill="#D9772B" opacity={dots} />
        </Svg>
        <Say t={t} at={F.l3} out={F.out + 0.5} text="“现在，你只是十万个小男孩中的一个。" x={960} y={140} size={48} anchor="center" />
        <Say t={t} at={F.l4} out={F.out + 0.5} text="可如果你驯服了我，你就是世上唯一的。”" x={960} y={215} size={52} anchor="center" color={ROSE} weight={900} />
      </Layer>}
    </Layer>
  );
};

// ═══ four o'clock: if you come at four, at three I will begin to be happy
export const Clock: React.FC<{ t: number }> = ({ t }) => {
  const C = LJ.clock;
  if (t < C.t - 0.5 || t >= C.out + 0.5) return null;
  const o = fade(t, C.t - 0.5, C.out + 0.5, 0.6, 0.6);
  const k = eInOut(range(t, C.sweep, C.out - 0.4));
  const cx = 1330, cy = 540, R = 300;
  const hour = (90 + 30 * k) * Math.PI / 180 - Math.PI / 2, minute = (360 * k) * Math.PI / 180 - Math.PI / 2;
  const warm = k;
  const beat = 1 + 0.03 * Math.max(0, Math.sin(t * (6 + 10 * k))) ** 8;
  return (
    <Layer o={o}>
      <Wash t={t} a={`rgba(240,${Math.round(170 - 30 * warm)},${Math.round(110 - 40 * warm)},${0.35 + 0.3 * warm})`} b={`rgba(242,214,142,${0.3 + 0.4 * warm})`} />
      <Svg>
        <defs><radialGradient id="halo"><stop offset="0%" stopColor={GOLDL} stopOpacity={0.9} /><stop offset="100%" stopColor={GOLDL} stopOpacity={0} /></radialGradient></defs>
        <circle cx={cx} cy={cy} r={R * (1.25 + 0.5 * warm)} fill="url(#halo)" opacity={0.25 + 0.6 * warm} />
        <g transform={`translate(${cx} ${cy}) scale(${beat}) translate(${-cx} ${-cy})`}>
          <circle cx={cx} cy={cy} r={R} fill="#FBF5EA" stroke={INK} strokeWidth={4} />
          {Array.from({ length: 12 }, (_, i) => { const a = (i * 30 - 90) * Math.PI / 180, on = i === 3 || i === 4;
            return <text key={i} x={cx + Math.cos(a) * (R - 52)} y={cy + Math.sin(a) * (R - 52) + 14} textAnchor="middle" fontFamily={SERIF} fontWeight={on ? 900 : 600} fontSize={on ? 46 : 36}
              fill={on ? ROSE : INK}>{i === 0 ? 12 : i}</text>; })}
          <Thread d={`M${cx},${cy - R - 16} A${R + 16},${R + 16} 0 1 1 ${cx - 0.1},${cy - R - 16}`} k={k} len={2 * Math.PI * (R + 16)} w={5} />
          <line x1={cx} y1={cy} x2={cx + Math.cos(hour) * R * 0.5} y2={cy + Math.sin(hour) * R * 0.5} stroke={INK} strokeWidth={12} strokeLinecap="round" />
          <line x1={cx} y1={cy} x2={cx + Math.cos(minute) * R * 0.78} y2={cy + Math.sin(minute) * R * 0.78} stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={12} fill={ROSE} />
        </g>
      </Svg>
      <Say t={t} at={C.l1} out={C.out + 0.5} text="“如果你下午四点来，" x={130} y={380} size={62} />
      <Say t={t} at={C.l2} out={C.out + 0.5} text="我从三点起，就开始幸福。”" x={130} y={480} size={62} color={ROSE} weight={900} />
      <Orig t={t} at={C.l2 + 0.5} out={C.out + 0.5} text="« dès trois heures je commencerai d'être heureux »" x={134} y={590} />
    </Layer>
  );
};

// ═══ wheat: I don't eat bread — but your hair is golden; the wheat will remind me of you
export const Wheat: React.FC<{ t: number }> = ({ t }) => {
  const W = LJ.wheat;
  if (t < W.t - 0.5 || t >= W.out + 0.5) return null;
  const o = fade(t, W.t - 0.5, W.out + 0.5, 0.6, 0.6);
  return (
    <Layer o={o}>
      <Art src="lv_wheat.jpg" t={t} a={W.t - 0.5} b={W.out + 0.5} from={[0.3, 0.75, 1.15]} to={[0.6, 0.72, 1.22]} filter="saturate(1.05) contrast(1.03)" />
      <Strokes t={t} o={eOut(range(t, W.t, W.t + 1.2))} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,14,8,0) 50%, rgba(20,14,8,0.78) 100%)" }} />
      <Svg>{[0, 1, 2].map((j) => { const y = 640 + j * 40; const pts = Array.from({ length: 25 }, (_, i) => `${i * 80},${y + Math.sin(i * 0.6 + t * 2.2 + j) * 10}`).join(" L");
        return <path key={j} d={`M${pts}`} fill="none" stroke={GOLDL} strokeWidth={2} opacity={0.35 * eOut(range(t, W.t, W.t + 1))} />; })}</Svg>
      <Say t={t} at={W.l1} out={W.out + 0.5} text="“以后看见麦子，" x={130} y={750} size={60} color={PAPER} glow={SHADOW} />
      <Say t={t} at={W.l2} out={W.out + 0.5} text="我就会想起你金色的头发。”" x={130} y={845} size={60} color={GOLDL} weight={900} glow={SHADOW} />
      <Orig t={t} at={W.l2 + 0.5} out={W.out + 0.5} text="« Le blé, qui est doré, me fera souvenir de toi. »" x={134} y={950} color="#E8D9B5" />
      <Note t={t} at={W.t + 0.2} out={W.out} text="梵高《有柏树的麦田》1889 · 大都会艺术博物馆" x={1840} y={40} anchor="right" color={PAPER} />
    </Layer>
  );
};

// ═══ the parting: I will cry. — Then what did you gain? — The colour of the wheat.
export const Part: React.FC<{ t: number }> = ({ t }) => {
  const P = LJ.part;
  if (t < P.t - 0.5 || t >= P.out + 0.5) return null;
  const o = fade(t, P.t - 0.5, P.out + 0.5, 0.6, 0.7);
  const apart = eInOut(range(t, P.t, P.l3)), gold = eOut(range(t, P.l3 - 0.1, P.l3 + 1.0));
  const ax = 960 - 120 - 420 * apart, bx = 960 + 120 + 420 * apart, y = 820;
  return (
    <Layer o={o}>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${NIGHT} 0%, ${DUSK} 55%, #7A4A5A 100%)` }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 60%, ${WHEAT} 0%, #C98A3A 45%, #6E4A2A 100%)`, opacity: gold }} />
      <Svg>
        <path d={`M${ax},${y} Q960,${y + 40 + 60 * apart} ${bx},${y}`} fill="none" stroke={GOLDL} strokeWidth={lerp(4, 1.2, apart)} opacity={0.9} />
        <circle cx={ax} cy={y} r={10} fill={GOLDL} /><circle cx={bx} cy={y} r={10} fill="#E0843A" />
      </Svg>
      <Say t={t} at={P.l1} out={P.out + 0.5} text="“我会哭的。”" x={960} y={250} size={70} color={PAPER} anchor="center" glow={SHADOW} />
      <Say t={t} at={P.l2} out={P.out + 0.5} text="“那你得到了什么？”" x={960} y={370} size={58} color={PAPER} anchor="center" glow={SHADOW} />
      <Say t={t} at={P.l3} out={P.out + 0.5} text="“麦子的颜色。”" x={960} y={500} size={104} color="#FFF3CF" anchor="center" weight={900} stagger={0.09} glow="0 0 40px rgba(255,230,160,0.8), 0 4px 24px rgba(80,40,0,0.5)" />
      <Orig t={t} at={P.l3 + 0.6} out={P.out + 0.5} text="« J'y gagne, à cause de la couleur du blé. »" x={960} y={650} anchor="center" color="#FFF0D0" />
    </Layer>
  );
};

// ═══ the secret: what is essential is invisible to the eye; it is the time you spent on your rose
export const Secret: React.FC<{ t: number }> = ({ t }) => {
  const S = LJ.secret;
  if (t < S.t - 0.5 || t >= S.out + 0.5) return null;
  const o = fade(t, S.t - 0.5, S.out + 0.5, 0.6, 0.6);
  const k = eInOut(range(t, S.t, S.time2 + 1.0));
  return (
    <Layer o={o}>
      <Wash t={t} a="rgba(232,160,160,0.35)" b="rgba(242,214,142,0.35)" />
      <Svg><Thread d="M560,330 m-260,0 a260,260 0 1,0 520,0 a260,260 0 1,0 -520,0" k={k} len={1640} w={3} /></Svg>
      <Rose x={560} y={330} h={820} glow={0.25} rot={Math.sin(t * 0.8) * 1.5} />
      <Say t={t} at={S.l1} out={S.out + 0.5} text="“本质的东西，" x={1000} y={230} size={62} />
      <Say t={t} at={S.l2} out={S.out + 0.5} text="眼睛是看不见的。”" x={1000} y={320} size={62} />
      <Orig t={t} at={S.l2 + 0.4} out={S.out + 0.5} text="« L'essentiel est invisible pour les yeux. »" x={1004} y={415} />
      <Say t={t} at={S.time1} out={S.out + 0.5} text="“你为你的玫瑰花费的时间，" x={1000} y={560} size={62} />
      <Say t={t} at={S.time2} out={S.out + 0.5} text="让她变得如此重要。”" x={1000} y={650} size={66} color={ROSE} weight={900} />
      <Orig t={t} at={S.time2 + 0.5} out={S.out + 0.5} text="« C'est le temps que tu as perdu pour ta rose qui fait ta rose si importante. »" x={1004} y={745} size={24} />
      <Note t={t} at={S.t + 0.3} out={S.out} text="圣埃克苏佩里《小王子》1943 · 玫瑰：雷杜德《玫瑰图谱》1817—1824" x={1004} y={1010} />
    </Layer>
  );
};
