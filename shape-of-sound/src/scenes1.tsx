import React from "react";
import { Abs, C, Caption, ChapterHead, eIn, eInOut, eOut, FONT_CN, FONT_EN, FONT_UI, Kinetic, lerp, range, Tag, TL, useSpring, useT, W, clamp01 } from "./theme";

const sinePath = (x0: number, x1: number, cy: number, amp: number, cycles: number, phase: number, steps = 400, upto = 1) => {
  let d = "";
  const n = Math.max(2, Math.floor(steps * upto));
  for (let i = 0; i <= n; i++) {
    const u = i / steps, x = x0 + (x1 - x0) * u;
    const y = cy - Math.sin(u * cycles * Math.PI * 2 + phase) * amp;
    d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
  }
  return d;
};

// ════════════════ OPEN 0–6: a dot → a wave → overtones → the title
export const Open: React.FC = () => {
  const t = useT(), sp = useSpring(), O = TL.open;
  const dot = sp(O.ping);
  const draw = eOut(range(t, O.wave, O.wave + 1.2));
  const fan = eOut(range(t, O.harmonics, O.harmonics + 1.0));
  const titleIn = range(t, O.title - 0.15, O.title);
  const wavesOut = eIn(range(t, O.title - 0.25, O.title + 0.1));
  const cols = [C.paper, C.yellow, C.pink, C.blue, C.mint];
  return (
    <Abs style={{ background: C.ink }}>
      <svg width={W} height={1080} style={{ position: "absolute" }}>
        {cols.map((c, k) => {
          const h = k + 1, cy = 540 + (k - 2) * 120 * fan;
          const amp = 90 / Math.sqrt(h) * (k === 0 ? 1 : fan);
          return (
            <path key={k} d={sinePath(160, 1760, cy, amp, 4 * h, -t * 6 * h, 600, k === 0 ? draw : 1)} stroke={c} strokeWidth={k === 0 ? 7 : 6} fill="none"
              strokeLinecap="round" opacity={(k === 0 ? 1 : fan) * (1 - wavesOut)} />
          );
        })}
        <circle cx={draw > 0 ? 160 + 1600 * draw : 960} cy={540} r={18 * dot * (1 - wavesOut)} fill={C.paper} />
      </svg>
      <Tag x={160} y={380} color={C.paper} opacity={range(t, O.wave + 0.3, O.wave + 0.6) * (1 - fan) * (1 - wavesOut)}>f = 440 Hz · 正弦波 SINE</Tag>
      <Tag x={160} y={150} color={C.paper} opacity={fan * (1 - wavesOut)}>泛音 OVERTONES · 1f 2f 3f 4f 5f</Tag>
      {titleIn > 0 && <TitleCard />}
    </Abs>
  );
};
const TitleCard: React.FC = () => {
  const t = useT(), sp = useSpring(), at = TL.open.title;
  const shapes = [
    { at: at, c: C.yellow, el: (s: number) => <circle cx={300} cy={260} r={130 * s} /> },
    { at: at + 0.5, c: C.pink, el: (s: number) => <polygon points={`${1640},${190 - 150 * s} ${1640 + 150 * s},${190 + 110 * s} ${1640 - 150 * s},${190 + 110 * s}`} /> },
    { at: at + 1.0, c: C.blue, el: (s: number) => <rect x={1560 - 110 * s} y={860 - 110 * s} width={220 * s} height={220 * s} rx={10} /> },
    { at: at + 1.5, c: C.mint, el: (s: number) => <rect x={240} y={880 - 30 * s} width={360 * s} height={60 * s} rx={30} /> },
  ];
  return (
    <>
      <svg width={W} height={1080} style={{ position: "absolute" }}>
        {shapes.map((s, i) => <g key={i} fill={s.c} style={{ rotate: `${(1 - Math.min(1, sp(s.at))) * 40}deg`, transformOrigin: "center", transformBox: "fill-box" }}>{s.el(sp(s.at))}</g>)}
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Kinetic text="声音的形状" at={at} size={230} color={C.paper} stagger={0.06} />
        <div style={{ height: 30 }} />
        <Kinetic text="THE SHAPE OF SOUND" at={at + 0.35} size={78} color={C.yellow} font={FONT_EN} stagger={0.02} weight={400} tracking={10} />
      </div>
      <Tag x={110} y={990} color={C.paper} size={28} opacity={eOut(range(t, at + 0.8, at + 1.2))}>乐理 · 数学 · 流派 —— 一切都是几何</Tag>
    </>
  );
};

// ════════════════ 01 VIBRATION: rotating point → sine; faster = higher; ×2 = octave
export const Vibration: React.FC = () => {
  const t = useT(), c1 = TL.c1, s0 = c1.start;
  const L = (x: number) => x - s0;
  // rotation frequency multiplier: 1× → 4× during the speed-up
  const k = t < L(c1.speedup) ? 1 : t < L(c1.octave) ? Math.pow(4, eInOut(range(t, L(c1.speedup), L(c1.octave)))) : 1;
  // integrate phase (closed form for the exponential section is overkill; approximate by sampling)
  let phase = 0; const dt = 1 / 120;
  for (let x = 0; x < t; x += dt) { const kk = x < L(c1.speedup) ? 1 : x < L(c1.octave) ? Math.pow(4, eInOut(range(x, L(c1.speedup), L(c1.octave)))) : 1; phase += kk * 1.1 * Math.PI * 2 * dt; }
  const appear = eOut(range(t, L(c1.circle), L(c1.circle) + 0.6));
  const oct = eInOut(range(t, L(c1.octave), L(c1.octave) + 0.6));
  const cx = 480, cy = 560, R = 200;
  const px = cx + Math.cos(phase) * R, py = cy - Math.sin(phase) * R;
  const x0 = 800, x1 = 1800;
  const cycles = 3 * k;
  const hz = Math.round(220 * k);
  return (
    <>
      <ChapterHead n="01" title="声音 = 振动" en="SOUND IS VIBRATION" color={C.yellow} />
      <svg width={W} height={1080} style={{ position: "absolute", opacity: appear }}>
        <g opacity={1 - oct}>
          <circle cx={cx} cy={cy} r={R} stroke={C.ink} strokeWidth={5} fill="none" />
          <line x1={cx} y1={cy} x2={px} y2={py} stroke={C.ink} strokeWidth={5} />
          <line x1={px} y1={py} x2={x0} y2={py} stroke={C.ink} strokeWidth={3} strokeDasharray="10 12" />
          <circle cx={px} cy={py} r={20} fill={C.pink} />
          <path d={sinePath(x0, x1, cy, R, cycles, phase + Math.PI / 2 - Math.PI / 2, 700)} stroke={C.ink} strokeWidth={7} fill="none" />
          <circle cx={x0} cy={py} r={16} fill={C.pink} />
        </g>
        <g opacity={oct}>
          <path d={sinePath(260, 1660, 470, 150, 4, 0, 800)} stroke={C.blue} strokeWidth={8} fill="none" />
          <path d={sinePath(260, 1660, 470, 150, 8, 0, 800)} stroke={C.pink} strokeWidth={6} fill="none" />
          {[0, 1, 2, 3, 4].map(i => <circle key={i} cx={260 + i * 350} cy={470} r={18 * oct} fill={C.ink} />)}
        </g>
      </svg>
      <Tag x={x0} y={300} opacity={appear * (1 - oct)} size={44}>f = {hz} Hz</Tag>
      <Tag x={260} y={240} opacity={oct} size={40} color={C.blue}>220 Hz</Tag>
      <Tag x={1480} y={240} opacity={oct} size={40} color={C.pink}>440 Hz</Tag>
      <Caption at={L(c1.circle) + 0.3} out={L(c1.speedup) - 0.2} big="旋转的点 → 一条正弦波" small="A SPINNING POINT TRACES A SINE WAVE" />
      <Caption at={L(c1.speedup) + 0.1} out={L(c1.octave) - 0.2} big="转得越快，音越高" small="FASTER SPIN = HIGHER PITCH" />
      <Caption at={L(c1.octave) + 0.3} out={L(c1.end) - 0.1} big="频率 × 2 = 八度  2 : 1" small="DOUBLE THE FREQUENCY — THE SAME NOTE, AN OCTAVE UP" />
    </>
  );
};

// ════════════════ 02 RATIOS: Pythagoras' string, then Lissajous figures for each interval
const LISS = [
  { name: "同度", en: "UNISON", c: C.ink },
  { name: "八度", en: "OCTAVE", c: C.blue },
  { name: "纯五度", en: "FIFTH", c: C.violet },
  { name: "纯四度", en: "FOURTH", c: "#0B7A5A" },
  { name: "三全音", en: "TRITONE", c: C.red },
];
export const Ratios: React.FC = () => {
  const t = useT(), sp = useSpring(), c2 = TL.c2, s0 = c2.start;
  const L = (x: number) => x - s0;
  const strIn = eOut(range(t, L(c2.string) - 0.3, L(c2.string))), strOut = eIn(range(t, L(c2.liss[0]) - 0.5, L(c2.liss[0]) - 0.1));
  const pluckA = Math.max(0, t - L(c2.string)), half = t >= L(c2.halve);
  const amp = half ? 90 * Math.exp(-(t - L(c2.halve)) * 1.2) * Math.sin((t - L(c2.halve)) * 60) : 110 * Math.exp(-pluckA * 1.5) * Math.sin(pluckA * 34) * (t > L(c2.string) ? 1 : 0);
  const sx0 = 360, sx1 = 1560, sy = 470;
  let d = "";
  for (let i = 0; i <= 200; i++) { const u = i / 200; const y = sy - amp * Math.sin(Math.PI * u * (half ? 2 : 1)); d += (i ? "L" : "M") + (sx0 + (sx1 - sx0) * u) + " " + y.toFixed(1); }
  const bridge = sp(L(c2.halve));
  return (
    <>
      <ChapterHead n="02" title="和谐 = 简单的比例" en="HARMONY IS SIMPLE RATIOS" color={C.pink} />
      <svg width={W} height={1080} style={{ position: "absolute", opacity: strIn * (1 - strOut), translate: `0px ${-strOut * 80}px` }}>
        <path d={d} stroke={C.ink} strokeWidth={8} fill="none" strokeLinecap="round" />
        <rect x={sx0 - 30} y={sy - 70} width={30} height={140} fill={C.ink} />
        <rect x={sx1} y={sy - 70} width={30} height={140} fill={C.ink} />
        <polygon points={`${960},${sy - 10} ${960 + 40 * bridge},${sy + 70 * bridge} ${960 - 40 * bridge},${sy + 70 * bridge}`} fill={C.yellow} stroke={C.ink} strokeWidth={4} />
        <text x={960} y={sy + 150} textAnchor="middle" fontFamily={FONT_UI} fontWeight={700} fontSize={44} fill={C.ink} opacity={bridge}>½ 弦长 = 2 × 频率</text>
      </svg>
      <Caption at={L(c2.string) + 0.2} out={L(c2.halve) - 0.15} big="毕达哥拉斯拨动一根弦" small="PYTHAGORAS PLUCKS A STRING" />
      <Caption at={L(c2.halve) + 0.1} out={L(c2.liss[0]) - 0.3} big="弦长减半 → 高八度" small="HALF THE LENGTH — AN OCTAVE HIGHER" />
      {c2.liss.map((at, i) => <LissCard key={i} i={i} at={L(at)} ratio={c2.ratios[i] as number[]} />)}
      <Caption at={L(c2.liss[4]) + 0.2} out={9} big="比例越简单 → 听起来越和谐" small="THE SIMPLER THE RATIO, THE SWEETER THE SOUND" y={860} />
    </>
  );
};
const LissCard: React.FC<{ i: number; at: number; ratio: number[] }> = ({ i, at, ratio }) => {
  const t = useT(), sp = useSpring();
  if (t < at - 0.1) return null;
  const s = sp(at), info = LISS[i];
  const size = 300, gap = 44, x = 130 + i * (size + gap), y = 330;
  const [p, q] = ratio;
  const draw = eOut(range(t, at, at + 1.0));
  const live = t >= at && t < at + 1.2;
  let d = "";
  const tri = i === 4;
  const steps = tri ? 3000 : 700, n = Math.floor(steps * draw);
  const ph = Math.PI / 2 + (t - at) * (i === 0 ? 0.4 : 1.2);
  for (let k = 0; k <= n; k++) {
    const u = (k / steps) * Math.PI * 2;
    const X = Math.sin(p * u + ph), Y = Math.sin(q * u);
    d += (k ? "L" : "M") + (size / 2 + X * size * 0.38).toFixed(1) + " " + (size / 2 + Y * size * 0.38).toFixed(1);
  }
  return (
    <div style={{ position: "absolute", left: x, top: y, width: size, scale: `${s}`, rotate: `${(1 - Math.min(1, s)) * -12}deg` }}>
      <div style={{ width: size, height: size, background: live ? C.paper : "#FFE8EF", borderRadius: 28, boxShadow: `12px 12px 0 ${C.ink}`, border: `5px solid ${C.ink}` }}>
        <svg width={size} height={size}><path d={d} stroke={info.c} strokeWidth={tri ? 2.5 : 6} fill="none" strokeLinejoin="round" /></svg>
      </div>
      <div style={{ fontFamily: FONT_EN, fontSize: 64, color: C.ink, marginTop: 26, textAlign: "center" }}>{p}:{q}</div>
      <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 48, color: C.ink, textAlign: "center" }}>{info.name}</div>
      <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 24, letterSpacing: 4, color: C.ink, textAlign: "center", opacity: 0.7 }}>{info.en}</div>
    </div>
  );
};
export { sinePath, clamp01 as _c, FONT_CN as _f, lerp as _l };
