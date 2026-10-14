// 佛 · 第二支箭 — part 4: Chan on white paper (Huineng; the two verses and the mirror that is not there; the eighth
// ox-herding picture, an empty circle; the finger pointing at the moon), and the ending (the first arrow still comes,
// the second is never fired; the mantra of the Heart Sutra: gone, gone, gone beyond).
import React from "react";
import { Arrow, Art, BJ, Big, CINNABAR, Decode, Dust, GOLD, INK, Layer, MUTE, Note, PAPER, SANS, SERIF, Say, Seal, Svg, VQuote, eIn, eInOut, eOut, fade, lerp, range, rnd } from "./kit";
import { Defs, Target, THOUGHTS } from "./S1";

export const MC: [number, number] = [620, 500];   // the mirror, the empty circle, the moon and the last target share this spot
const INKM = "#6E665A";

export const Chan: React.FC<{ t: number }> = ({ t }) => {
  const C = BJ.chan;
  if (t < C.t - 0.2 || t >= C.out + 0.5) return null;
  const o = 1 - eIn(range(t, C.out - 0.1, C.out + 0.5));
  const img = fade(t, C.img, C.shen - 0.1, 0.5, 0.4);
  const mirror = eInOut(range(t, C.shen, C.shen + 0.6)), diss = range(t, C.dissolve, C.dissolve + 0.8);
  const R = 190;
  // dust: falls from the top; while the mirror stands it settles on it and the brush wipes it; afterwards it falls through
  const dust: React.ReactNode[] = [];
  if (t > C.shen && t < C.ox + 0.3) for (let i = 0; i < 90; i++) {
    const t0 = C.shen + rnd(i) * 3.6, x = MC[0] + (rnd(i + 3) - 0.5) * R * 1.6;
    if (t < t0) continue;
    const surfaceY = MC[1] + (rnd(i + 5) - 0.5) * R * 1.4, fallY = 40 + (t - t0) * 260;
    const lastWipe = C.wipes.filter((w) => w > t0 && w < t).pop();
    const landed = t0 + (surfaceY - 40) / 260;
    let y = Math.min(fallY, surfaceY), op = 0.85;
    if (t > C.fall) y = Math.min(fallY, surfaceY) + (t - C.fall) * 900 * (0.6 + rnd(i + 8) * 0.6);
    else if (lastWipe !== undefined && lastWipe > landed) { const q = range(t, lastWipe, lastWipe + 0.25); op *= 1 - q; y += q * 30; }
    if (op > 0.02 && y < 1100) dust.push(<circle key={i} cx={x} cy={y} r={2.2 + rnd(i + 2) * 2} fill={INK} opacity={op} />);
  }
  const ox = fade(t, C.ox, C.moon + 0.3, 0.4, 0.4);
  const moon = eInOut(range(t, C.moon - 0.2, C.moon + 0.5)), focus = eInOut(range(t, C.focus, C.focus + 0.6));
  return (
    <Layer o={o}>
      {/* the woodcutter */}
      <Art src="bd_huineng.jpg" t={t} a={C.img} b={C.shen} from={[0.5, 0.5, 1.02]} to={[0.5, 0.5, 1.08]} fit="contain" box={[110, 30, 470, 1020]} o={img} blend="multiply" />
      <Say t={t} at={C.who} out={C.shen - 0.1} text="慧能：" x={700} y={330} size={70} color={INK} />
      <Say t={t} at={C.who + 0.3} out={C.shen - 0.1} text="一个不识字的卖柴人。" x={700} y={440} size={70} color={INK} />
      <Note t={t} at={C.img + 0.4} out={C.shen - 0.1} text="梁楷《六祖斫竹图》南宋 · 东京国立博物馆" x={700} y={580} color={INKM} />
      <Note t={t} at={C.shen} out={C.ox - 0.2} text="五祖弘忍传法前，让弟子各写一偈" x={130} y={70} color={INKM} size={24} />
      {/* the mirror on its stand; the brush wipes it; then it isn't there */}
      <Svg>
        <defs>
          <filter id="brushy"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={4} /><feDisplacementMap in="SourceGraphic" scale={7} /></filter>
          <radialGradient id="night"><stop offset="0%" stopColor="#2A2C35" stopOpacity={0.0} /><stop offset="35%" stopColor="#2A2C35" stopOpacity={0.55} /><stop offset="100%" stopColor="#2A2C35" stopOpacity={0} /></radialGradient>
        </defs>
        {mirror > 0 && t < C.ox && <g filter="url(#brushy)" opacity={1 - diss}>
          {Array.from({ length: 36 }, (_, i) => { const a0 = (i / 36) * Math.PI * 2 - Math.PI / 2, a1 = a0 + (Math.PI * 2) / 36 * mirror, fly = diss * (60 + rnd(i) * 160);
            return <path key={i} d={`M${MC[0] + Math.cos(a0) * (R + fly)},${MC[1] + Math.sin(a0) * (R + fly)} A${R + fly},${R + fly} 0 0 1 ${MC[0] + Math.cos(a1) * (R + fly)},${MC[1] + Math.sin(a1) * (R + fly)}`}
              stroke={INK} strokeWidth={11 - diss * 6} fill="none" strokeLinecap="round" />; })}
          <line x1={MC[0]} y1={MC[1] + R} x2={MC[0]} y2={MC[1] + R + 170 * mirror} stroke={INK} strokeWidth={9} />
          <line x1={MC[0] - 130 * mirror} y1={MC[1] + R + 170} x2={MC[0] + 130 * mirror} y2={MC[1] + R + 170} stroke={INK} strokeWidth={11} />
        </g>}
        {C.wipes.map((w, i) => { const q = range(t, w - 0.05, w + 0.3); return q > 0 && q < 1 ? <path key={i} d={`M${MC[0] - R - 40},${MC[1] - 60 + i * 50} Q${MC[0]},${MC[1] - 20 + i * 50} ${MC[0] + R + 40},${MC[1] - 80 + i * 50}`}
          stroke={INK} strokeWidth={30} fill="none" strokeLinecap="round" strokeDasharray={`${q * 520} 9999`} opacity={0.75 * (1 - eIn(range(t, w + 0.1, w + 0.3)))} filter="url(#brushy)" /> : null; })}
        {dust}
        {moon > 0 && <circle cx={MC[0]} cy={MC[1]} r={520} fill="url(#night)" opacity={moon} />}
        {moon > 0 && <circle cx={MC[0]} cy={MC[1]} r={170} fill="#FBF7EC" opacity={moon} style={{ filter: `blur(${(1 - focus) * 9}px) drop-shadow(0 0 40px rgba(255,250,235,0.9))` }} />}
        {/* the finger: a long brush stroke, pointing */}
        {moon > 0 && (() => { const k = eOut(range(t, C.moon, C.moon + 0.6)); const x0 = 1380, y0 = 1060, x1 = lerp(x0, MC[0] + 230, k), y1 = lerp(y0, MC[1] + 150, k);
          return <g opacity={1 - focus * 0.85} style={{ filter: `blur(${focus * 8}px)` }}>
            <path d={`M${x0 - 14},${y0} L${x1},${y1} L${x0 + 14},${y0} Z`} fill={INK} filter="url(#brushy)" />
          </g>; })()}
      </Svg>
      <Art src="bd_ox8.jpg" t={t} a={C.ox} b={C.moon} from={[0.5, 0.5, 1.0]} to={[0.5, 0.5, 1.06]} fit="contain" box={[MC[0] - 300, MC[1] - 300, 600, 600]} o={ox} blend="multiply" mask="radial-gradient(circle at 50% 50%, #000 63%, transparent 73%)" filter="saturate(0.3) brightness(1.15) contrast(1.25)" />
      <Say t={t} at={C.ox + 0.2} out={C.moon} text="十牛图 · 第八：人牛俱忘" x={1000} y={420} size={54} color={INK} />
      <Note t={t} at={C.ox + 0.5} out={C.moon} text="传·天章周文《十牛图》室町 · 相国寺" x={1000} y={510} color={INKM} />
      {/* the two verses: 神秀 on the right, 慧能 to its left */}
      <Seal t={t} at={C.shen} out={C.ox - 0.2} text="神秀" x={1860} y={70} size={30} rot={0} />
      <VQuote t={t} at={C.shen + 0.1} out={C.ox - 0.2} cols={["身是菩提树", "心如明镜台", "时时勤拂拭", "勿使惹尘埃"]} x={1860} y={140} size={50} ink stagger={0.03} />
      <Seal t={t} at={C.neng} out={C.ox - 0.2} text="慧能" x={1460} y={70} size={30} rot={0} />
      <VQuote t={t} at={C.neng + 0.1} out={C.ox - 0.2} cols={["菩提本无树", "明镜亦非台", "本来无一物", "何处惹尘埃"]} x={1460} y={140} size={50} ink stagger={0.03} />
      <Note t={t} at={C.decode} out={C.ox - 0.2} text="《坛经》通行本；敦煌本作「佛性常清净，何处有尘埃」" x={1860} y={480} anchor="right" color={INKM} size={20} />
      <Decode t={t} at={C.decode} out={C.ox - 0.2} text="不是一直擦镜子——是看穿：本来就没有一面要守的镜子。" x={130} y={935} size={42} dark />
      <VQuote t={t} at={C.mquote} out={C.out} cols={["如人以手指月示人", "彼人因指，当应看月"]} x={1860} y={110} size={52} ink src="楞严经" stagger={0.03} />
      <Decode t={t} at={C.mdecode} out={C.out} text="这部片里所有的话，都只是手指——去看月亮。" x={130} y={935} size={44} dark />
    </Layer>
  );
};

// ═══ ending: the first arrow still comes; the thoughts dissolve before they become a second; gone, gone beyond
const MANTRA = ["揭谛", "揭谛", "波罗揭谛", "波罗僧揭谛", "菩提萨婆诃"];
export const End: React.FC<{ t: number }> = ({ t }) => {
  const E = BJ.end;
  if (t < E.t - 0.4) return null;
  const tgtO = eOut(range(t, E.t - 0.4, E.t + 0.2)) * (1 - eIn(range(t, E.card - 0.4, E.card)));
  const rise = eInOut(range(t, E.shore, E.chord + 0.6));
  const ty = lerp(MC[1], 440, rise), firstO = 1 - eIn(range(t, E.mantra[0] - 0.4, E.mantra[0]));
  const glow = eOut(range(t, E.chord, E.chord + 0.6)) * (1 - eIn(range(t, E.card - 0.3, E.card + 0.3)));
  return (
    <Layer>
      <Svg>
        <Defs />
        {/* the far shore */}
        {t > E.shore - 0.1 && (() => { const k = eInOut(range(t, E.shore, E.shore + 0.9)), fo = 1 - eIn(range(t, E.card - 0.3, E.card + 0.3));
          return <g opacity={fo}>
            <line x1={960 - 960 * k} y1={740} x2={960 + 960 * k} y2={740} stroke={GOLD} strokeWidth={3} />
            <path d={`M${1920 - 1300 * k},700 C${1700 - 900 * k},640 ${1500 - 500 * k},${690 - 40 * k} 1920,${640}`} stroke={GOLD} strokeWidth={1.5} fill="none" opacity={0.6 * k} />
          </g>; })()}
        {glow > 0 && <circle cx={MC[0]} cy={ty} r={260 + glow * 140} fill="url(#tgtglow)" opacity={glow} />}
        <g opacity={tgtO}>
          <Target t={t} hits={[{ at: E.hit, c: GOLD }]} cx={MC[0]} cy={ty} r={74} />
        </g>
        <Arrow t={t} t0={E.arrow} t1={E.hit} p0={[-300, 300]} p1={[MC[0] - 72, MC[1]]} o={firstO} />
      </Svg>
      {tgtO > 0 && <div style={{ position: "absolute", left: MC[0], top: ty, transform: "translate(-50%, -50%)", fontFamily: SERIF, fontWeight: 900, fontSize: 52, color: PAPER, opacity: tgtO }}>你</div>}
      {/* the thoughts come — and turn to dust before they can become an arrow */}
      {THOUGHTS.map(([w, x, y, s], i) => {
        const a = E.swarm + i * 0.1;
        if (t < a) return null;
        if (t < E.dissolve + i * 0.06) {
          const jx = Math.sin(t * 37 + i * 3) * 4, jy = Math.cos(t * 41 + i) * 3;
          return <div key={i} style={{ position: "absolute", left: x + jx, top: y + jy, transform: "translate(-50%, -50%)", fontFamily: SERIF, fontWeight: 900, fontSize: s, color: CINNABAR,
            opacity: eOut(range(t, a, a + 0.3)), whiteSpace: "nowrap" }}>{w}</div>;
        }
        return <Dust key={i} t={t} id={`th${i}`} text={w} size={s} cx={x} cy={y} t0={E.dissolve + i * 0.06} mode="out" color={GOLD} spread={0.3} dur={1.4} />;
      })}
      <Say t={t} at={E.l1} out={E.mantra[0] - 0.2} text="第一支箭，还会来。" x={130} y={110} size={80} />
      <Say t={t} at={E.l2} out={E.mantra[0] - 0.2} text="第二支——可以不射。" x={130} y={230} size={84} gold />
      {/* the mantra */}
      {MANTRA.map((m, i) => {
        const at = E.mantra[i];
        if (t < at || t >= E.card) return null;
        return <VQuote key={i} t={t} at={at} out={E.card} cols={[m]} x={1880 - i * 125} y={110} size={82} stagger={0.09} />;
      })}
      <Note t={t} at={E.trans - 0.1} out={E.card} text="《心经》结尾的咒语 · 玄奘不译 · 大意：" x={130} y={845} color={PAPER} />
      <Say t={t} at={E.trans} out={E.card} text="去吧，去吧，到彼岸去吧，大家都到彼岸——觉醒吧。" x={130} y={900} size={48} stagger={0.05} />
      {/* the card */}
      <Big t={t} at={E.card} out={99} ch="佛" x={960} y={440} size={300} />
      <Say t={t} at={E.card + 0.4} out={99} text="痛，躲不开；苦，可以放下。" x={960} y={690} size={52} anchor="center" />
      <Say t={t} at={E.card + 0.9} out={99} text="儒 · 释 · 道 ｜ 一 · 佛" x={960} y={800} size={30} anchor="center" color={MUTE} font={SANS} weight={700} tracking={4} />
    </Layer>
  );
};
