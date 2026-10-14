// 什么是爱 — part 1: five thousand roses (the hook), Plato's halves, Romeo, the Little Prince's rose.
import React from "react";
import { Art, DUSK, FIELD, Field, GOLDL, LJ, Layer, Motes, NIGHT, Note, Orig, PAPER, Rose, Say, Svg, Thread, eIn, eInOut, eOut, fade, fieldToScreen, lerp, range } from "./kit";

const SHADOW = "0 2px 18px rgba(0,0,0,0.65)";
const VASE = "#1A0F0A";
// a Greek key (meander) band, black on terracotta, drifting slowly
const Meander: React.FC<{ y: number; t: number }> = ({ y, t }) => {
  const u = 40, off = (t * 12) % (u * 2);
  const key = (x: number) => `M${x},${y + u} v${-u} h${u * 1.5} v${u * 0.75} h${-u * 0.75} v${-u * 0.4} h${u * 0.35} M${x + u * 1.5},${y + u} h${u * 0.5}`;
  return <Svg><g transform={`translate(${-off} 0)`}>
    <line x1={-100} y1={y - 8} x2={2100} y2={y - 8} stroke={VASE} strokeWidth={4} /><line x1={-100} y1={y + u + 8} x2={2100} y2={y + u + 8} stroke={VASE} strokeWidth={4} />
    {Array.from({ length: 28 }, (_, i) => <path key={i} d={key(-80 + i * u * 2)} fill="none" stroke={VASE} strokeWidth={6} />)}
  </g></Svg>;
};

// ═══ hook: a garden of 5,000 identical roses; one lights up — why do you love only this one?
export const Hook: React.FC<{ t: number }> = ({ t }) => {
  const H = LJ.hook;
  if (t >= H.out + 0.6) return null;
  const k = eInOut(range(t, 1.1, H.out - 0.2));
  const z = lerp(1.25, 0.345, k), fx = lerp(FIELD.one[0] - 290, 3200, k), fy = lerp(FIELD.one[1] + 40, 1600, k);
  const glow = eOut(range(t, H.glow, H.glow + 0.6)), out = eIn(range(t, H.out - 0.6, H.out + 0.4));
  const [rx, ry] = fieldToScreen(FIELD.one[0], FIELD.one[1], z, fx, fy);
  const rh = 261 * z * lerp(1, 2.2, glow);
  const title = range(t, H.title, H.title + 0.5);
  return (
    <Layer o={1 - out}>
      <Field z={z} fx={fx} fy={fy} dim={0.75 * glow + 0.2 * title} filter="sepia(0.12) contrast(1.05)" />
            <Rose x={rx} y={ry} h={rh} o={glow} glow={glow} />
      <Svg><Thread d={`M${rx},${ry} C${rx - 200},${ry - 260} ${960 + 300},${380} 960,${560}`} k={eInOut(range(t, H.title - 0.2, H.out))} len={1300} /></Svg>
      <Say t={t} at={H.title} out={H.out + 0.6} text="什么是爱？" x={960} y={400} size={150} color={PAPER} weight={900} anchor="center" stagger={0.08} glow="0 0 40px rgba(242,214,142,0.55), 0 4px 30px rgba(0,0,0,0.7)" />
    </Layer>
  );
};

// ═══ Plato: we were once whole; cut in two, we spend our lives looking for the other half
export const Plato: React.FC<{ t: number }> = ({ t }) => {
  const P = LJ.plato;
  if (t < P.t - 0.6 || t >= P.out + 0.5) return null;
  const o = fade(t, P.t - 0.6, P.out + 0.5, 0.6, 0.6);
  const draw = eInOut(range(t, P.t - 0.3, P.round + 0.4)), split = eOut(range(t, P.split, P.split + 0.9));
  const sway = t > P.split ? Math.sin((t - P.split) * 2.2) * 26 * split : 0;
  const rejoin = eInOut(range(t, P.out - 0.9, P.out - 0.2));
  const cx = 960, cy = 560, R = 190, dx = (250 * split - Math.abs(sway) * 0.4) * (1 - rejoin);
  const half = (side: number) => `M${cx + side * dx},${cy - R} A${R},${R} 0 0 ${side > 0 ? 1 : 0} ${cx + side * dx},${cy + R}`;
  const bolt = range(t, P.split - 0.15, P.split + 0.25);
  return (
    <Layer o={o}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, #D2733F 0%, #B95A2C 60%, #8E3F1C 100%)" }} />
      <Meander y={40} t={t} /><Meander y={1000} t={t} />
      <Svg>
        {split === 0 ? <><Thread d={`M${cx},${cy - R} A${R},${R} 0 1 1 ${cx - 0.1},${cy - R}`} k={draw} len={1200} w={26} color={VASE} /><Thread d={`M${cx},${cy - R + 22} A${R - 22},${R - 22} 0 1 1 ${cx - 0.1},${cy - R + 22}`} k={draw} len={1100} w={1.5} color="#D2733F" /></>
          : <><Thread d={half(-1)} k={1} len={600} w={26} color={VASE} /><Thread d={half(1)} k={1} len={600} w={26} color={VASE} />
            <line x1={cx - dx + 16} y1={cy} x2={cx + dx - 16} y2={cy} stroke={VASE} strokeWidth={3} strokeDasharray="6 16" opacity={0.35 + 0.35 * Math.sin(t * 5) ** 2} /></>}
        {bolt > 0 && bolt < 1 && <polyline points={`${cx + 10},${cy - R - 120} ${cx - 18},${cy - 40} ${cx + 16},${cy - 10} ${cx - 10},${cy + R + 120}`} fill="none" stroke="#FFE7B0" strokeWidth={7 * (1 - bolt)} opacity={1 - bolt} style={{ filter: "drop-shadow(0 0 12px #FFE7B0)" }} />}
      </Svg>
      <Say t={t} at={P.intro} out={P.out} text="柏拉图讲过一个故事：" x={960} y={120} size={36} color="#3A1A0C" anchor="center" stagger={0.04} />
      <Say t={t} at={P.round} out={P.out} text="人原本是圆的。" x={960} y={175} size={66} anchor="center" color={VASE} weight={900} />
      <Say t={t} at={P.l2} out={P.out} text="被劈成两半以后，" x={960} y={800} size={56} anchor="center" color={VASE} />
      <Say t={t} at={P.l3} out={P.out} text="我们一生都在找另一半。" x={960} y={880} size={62} anchor="center" color="#FFF0D8" weight={900} glow="0 2px 0 #3A1A0C" />
      <Note t={t} at={P.note} out={P.out} text="柏拉图《会饮篇》· 阿里斯托芬：「对完整的渴望和追求，就叫做爱。」" x={960} y={955} anchor="center" color="#3A1A0C" />
    </Layer>
  );
};

// ═══ Romeo and Juliet: the one thing that grows when you give it away
export const Romeo: React.FC<{ t: number }> = ({ t }) => {
  const R = LJ.romeo;
  if (t < R.t - 0.5 || t >= R.out + 0.5) return null;
  const o = 1 - range(t, R.out - 0.1, R.out + 0.5);
  const iris = lerp(190, 1500, eIn(range(t, R.t - 0.3, R.t + 0.7)));
  const mask = `radial-gradient(circle ${iris}px at 960px 560px, #000 ${iris - 4}px, transparent ${iris}px)`;
  return (
    <Layer o={o} style={{ WebkitMaskImage: mask, maskImage: mask }}>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, #1A1A2C 0%, #231B2B 60%, #2E2030 100%)` }} />
      <Art src="lv_romeo.jpg" t={t} a={R.t - 0.5} b={R.out + 0.5} from={[0.5, 0.36, 1.05]} to={[0.5, 0.4, 1.18]} box={[0, 0, 900, 1080]}
        mask="linear-gradient(90deg, #000 70%, transparent 100%)" filter="saturate(0.9) contrast(1.05)" />
      <Svg><Thread d="M430,380 C640,300 820,420 960,400" k={eInOut(range(t, R.t, R.l1 + 0.5))} len={600} /></Svg>
      <Say t={t} at={R.l1} out={R.out} text="我给你的越多，" x={980} y={300} size={76} color={PAPER} weight={600} />
      <Say t={t} at={R.l2} out={R.out} text="我自己就越富有。" x={980} y={410} size={76} color={PAPER} weight={600} />
      <Orig t={t} at={R.l2 + 0.5} out={R.out} text="“the more I give to thee, the more I have, for both are infinite.”" x={984} y={540} size={27} color="#B9AFC0" />
      <Note t={t} at={R.l2 + 0.7} out={R.out} text="莎士比亚《罗密欧与朱丽叶》1597 · 画：迪克西 1884" x={984} y={590} color="#9C93A8" />
      <Say t={t} at={R.decode} out={R.out} text="爱，是唯一越给越多的东西。" x={980} y={730} size={54} color={GOLDL} weight={900} glow="0 0 26px rgba(242,214,142,0.4)" />
    </Layer>
  );
};

// ═══ the Little Prince's rose: the only one in the universe — until he saw five thousand
export const Prince: React.FC<{ t: number }> = ({ t }) => {
  const P = LJ.prince;
  if (t < P.t - 0.5 || t >= P.out + 0.5) return null;
  const o = fade(t, P.t - 0.5, P.out + 0.5, 0.6, 0.6);
  const earth = eInOut(range(t, P.earth - 0.3, P.earth + 0.4));
  const z = lerp(0.62, 0.5, range(t, P.earth, P.out + 0.5));
  return (
    <Layer o={o}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 35% 75%, #4A3558 0%, ${DUSK} 35%, ${NIGHT} 100%)` }} />
      <Motes t={t} n={70} color="#FFF4D8" seed={3} />
      <Svg>
        <defs><radialGradient id="planet" cx="40%" cy="35%"><stop offset="0%" stopColor="#E9C79A" /><stop offset="100%" stopColor="#8E6A4E" /></radialGradient></defs>
        <circle cx={620} cy={900} r={160} fill="url(#planet)" />
        <Thread d="M650,620 C760,420 880,360 1000,330" k={eInOut(range(t, P.t, P.l1 + 0.6))} len={500} />
      </Svg>
      <Rose x={650} y={640} h={360} glow={0.5 + 0.2 * Math.sin(t * 2)} />
      <Say t={t} at={P.l1} out={P.earth} text="小王子有一朵玫瑰。" x={1000} y={290} size={68} color={PAPER} />
      <Say t={t} at={P.l2} out={P.earth} text="她说，她是全宇宙唯一的一朵。" x={1000} y={400} size={54} color={GOLDL} />
      <Layer o={earth}>
        <Field z={z} fx={2600} fy={1500} dim={0.15} filter="sepia(0.15)" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(15,10,10,0) 55%, rgba(15,10,10,0.82) 100%)" }} />
        <Say t={t} at={P.l3} out={P.out + 0.5} text="直到他在地球上，看见了五千朵。" x={960} y={890} size={60} color={PAPER} anchor="center" glow={SHADOW} />
      </Layer>
    </Layer>
  );
};
