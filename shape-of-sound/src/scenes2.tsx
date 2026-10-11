import React from "react";
import { Abs, C, Caption, ChapterHead, eIn, eInOut, eOut, FONT_CN, FONT_EN, FONT_UI, lerp, NOTE_NAMES, polar, pts, pulse, range, Tag, TL, useSpring, useT, W } from "./theme";

// a 12-note clock: nodes, labels, highlight function
const Clock: React.FC<{ cx: number; cy: number; r: number; lit: (i: number) => number; ink?: string; fill?: string; labels?: boolean; scale?: number; opacity?: number }> = ({
  cx, cy, r, lit, ink = C.paper, fill = C.yellow, labels = true, scale = 1, opacity = 1,
}) => (
  <g opacity={opacity} style={{ transformOrigin: `${cx}px ${cy}px`, scale: `${scale}` }}>
    <circle cx={cx} cy={cy} r={r} stroke={ink} strokeWidth={4} fill="none" opacity={0.5} />
    {NOTE_NAMES.map((nm, i) => {
      const [x, y] = polar(cx, cy, r, i), [lx, ly] = polar(cx, cy, r + 62, i), L = lit(i);
      return (
        <g key={i}>
          <circle cx={x} cy={y} r={16 + 14 * L} fill={L > 0.05 ? fill : ink} stroke={ink} strokeWidth={3} />
          {labels && <text x={lx} y={ly + 14} textAnchor="middle" fontFamily={FONT_EN} fontSize={40 + 12 * L} fill={ink}>{nm}</text>}
        </g>
      );
    })}
  </g>
);

// ════════════════ 03 TWELVE NOTES: chromatic circle, the twelfth root of two, the circle of fifths star
export const Twelve: React.FC = () => {
  const t = useT(), sp = useSpring(), c = TL.c3, s0 = c.start;
  const L = (x: number) => x - s0;
  const chrom = (i: number) => L(c.chromatic) + i * c.chromaticStep;
  const fifthAt = (k: number) => L(c.fifths) + k * c.fifthStep;
  const cx = 690, cy = 545, r = 265;
  const appear = sp(L(c.chromatic) - 0.05);
  const lit = (i: number) => {
    const a = pulse(t, [chrom(i)], 0.35) * (t >= chrom(i) ? 1 : 0);
    const fk = [...Array(12)].findIndex((_, k) => (k * 7) % 12 === i);
    const b = t >= fifthAt(fk) ? 0.35 + 0.65 * pulse(t, [fifthAt(fk)], 0.3) : 0;
    return Math.max(a, b, t > L(c.keys) && t < L(c.fifths) ? 0.25 : 0);
  };
  // star {12/7}: polyline through the fifths, drawn step by step
  const starPts = [...Array(13)].map((_, k) => polar(cx, cy, r, (k * 7) % 12));
  const drawn = Math.min(12, Math.max(0, (t - L(c.fifths)) / c.fifthStep));
  const nFull = Math.floor(drawn), frac = drawn - nFull;
  const shown = starPts.slice(0, nFull + 1);
  if (nFull < 12 && drawn > 0) { const [ax, ay] = starPts[nFull], [bx, by] = starPts[nFull + 1]; shown.push([lerp(ax, bx, frac), lerp(ay, by, frac)]); }
  const keysIn = eOut(range(t, L(c.keys), L(c.keys) + 0.6)), keysOut = eIn(range(t, L(c.fifths) - 0.3, L(c.fifths)));
  return (
    <>
      <ChapterHead n="03" title="十二个音" en="TWELVE NOTES" color={C.blue} ink={C.paper} />
      <svg width={W} height={1080} style={{ position: "absolute" }}>
        <g style={{ transformOrigin: `${cx}px ${cy}px`, scale: `${Math.min(1.1, appear)}` }} opacity={Math.min(1, appear)}>
          {drawn > 0 && <polyline points={pts(shown)} stroke={C.yellow} strokeWidth={7} fill="none" strokeLinejoin="round" />}
          <Clock cx={cx} cy={cy} r={r} lit={lit} />
        </g>
        {/* one octave of piano keys */}
        <g opacity={keysIn * (1 - keysOut)} style={{ translate: `0px ${(1 - keysIn) * 60}px` }}>
          {[0, 2, 4, 5, 7, 9, 11].map((n, k) => <rect key={n} x={1240 + k * 82} y={380} width={78} height={300} rx={8} fill={C.paper} stroke={C.ink} strokeWidth={3} />)}
          {[1, 3, 6, 8, 10].map(n => { const xk = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 }[n] as number; return <rect key={n} x={1240 + xk * 82 + 54} y={380} width={52} height={185} rx={6} fill={C.ink} />; })}
          <text x={1240 + 287} y={735} textAnchor="middle" fontFamily={FONT_UI} fontWeight={700} fontSize={40} fill={C.paper}>7 白键 + 5 黑键 = 12</text>
        </g>
      </svg>
      <div style={{ position: "absolute", right: 120, top: 260, textAlign: "right", opacity: eOut(range(t, chrom(4), chrom(6))) * (1 - keysIn * 0.999) }}>
        <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 40, color: C.paper, letterSpacing: 3 }}>每走一步，频率乘以</div>
        <div style={{ fontFamily: FONT_EN, fontSize: 150, color: C.yellow, lineHeight: 1.1 }}>¹²√2</div>
        <div style={{ fontFamily: FONT_EN, fontSize: 72, color: C.paper }}>≈ 1.0595</div>
        <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 32, color: C.paper, opacity: 0.8, marginTop: 10 }}>走 12 步 = 2 × 频率 = 八度</div>
      </div>
      <Caption at={L(c.chromatic) + 0.2} out={L(c.keys) - 0.2} big="十二平均律" small="12-TONE EQUAL TEMPERAMENT" color={C.paper}  x={1140} y={850} size={70}/>
      <Caption at={L(c.keys) + 0.2} out={L(c.fifths) - 0.2} big="12 个半音 = 1 个八度" small="TWELVE SEMITONES MAKE AN OCTAVE" color={C.paper}  x={1140} y={850} size={70}/>
      <Caption at={L(c.fifths) + 0.2} out={9.5} big="五度圈：每次跳 7 步" small="CIRCLE OF FIFTHS — 7 STEPS AT A TIME VISITS ALL 12" color={C.paper}  x={1140} y={850} size={70}/>
      <Tag x={1140} y={760} color={C.yellow} size={40} opacity={eOut(range(t, L(c.fifths) + 0.5, L(c.fifths) + 1))}>C → G → D → A → E → B …</Tag>
    </>
  );
};

// ════════════════ 04 SCALES & CHORDS: W W H W W W H; major vs minor triangle; I–V–vi–IV
export const Chords: React.FC = () => {
  const t = useT(), sp = useSpring(), c = TL.c4, s0 = c.start;
  const L = (x: number) => x - s0;
  const steps = [2, 2, 1, 2, 2, 2, 1];
  const scaleNotes = [0, 2, 4, 5, 7, 9, 11];
  const stairOut = eIn(range(t, L(c.major) - 0.4, L(c.major)));
  const clockMove = eInOut(range(t, L(c.major) - 0.4, L(c.major) + 0.3));
  const cx = lerp(1430, 880, clockMove), cy = lerp(560, 520, clockMove), r = lerp(230, 275, clockMove);
  const clockIn = Math.min(1, sp(L(c.scale) - 0.15));
  // which triad is shown (vertex note indices), with spring morphs between them
  const triads: [number, number[], string, string][] = [
    [L(c.major), [0, 4, 7], "C", C.yellow],
    [L(c.minor), [0, 3, 7], "Cm", C.violet],
    [L(c.prog), [0, 4, 7], "I", C.yellow],
    [L(c.prog) + c.progStep, [7, 11, 2], "V", C.pink],
    [L(c.prog) + 2 * c.progStep, [9, 0, 4], "vi", C.blue],
    [L(c.prog) + 3 * c.progStep, [5, 9, 0], "IV", C.orange],
  ];
  let cur = -1; triads.forEach(([at], i) => { if (t >= at) cur = i; });
  const triPts = (idx: number) => triads[idx][1].map(n => polar(cx, cy, r, n));
  let poly: (readonly [number, number])[] = [];
  if (cur >= 0) {
    const m = Math.min(1, sp(triads[cur][0], { damping: 14, stiffness: 170 }));
    const from = cur > 0 ? triPts(cur - 1) : triPts(cur).map(() => [cx, cy] as const);
    poly = triPts(cur).map((p, k) => [lerp(from[k][0], p[0], m), lerp(from[k][1], p[1], m)] as const);
  }
  const scaleLit = (i: number) => {
    const k = scaleNotes.indexOf(i);
    if (cur >= 0) return triads[cur][1].includes(i) ? 1 : 0;
    return k >= 0 && t >= L(c.scale) + k * c.scaleStep ? 0.6 + 0.4 * pulse(t, [L(c.scale) + k * c.scaleStep], 0.25) : 0;
  };
  const hepta = scaleNotes.filter((_, k) => t >= L(c.scale) + k * c.scaleStep).map(n => polar(cx, cy, r, n));
  const progIn = eOut(range(t, L(c.prog), L(c.prog) + 0.4));
  return (
    <>
      <ChapterHead n="04" title="音阶与和弦" en="SCALES & CHORDS" color={C.mint} />
      {/* staircase: whole and half steps as blocks */}
      <svg width={W} height={1080} style={{ position: "absolute", opacity: 1 - stairOut, translate: `${-stairOut * 120}px 0px` }}>
        {steps.map((w, k) => {
          const at = L(c.scale) + (k + 1) * c.scaleStep, s = Math.min(1.15, sp(at));
          let x = 140; for (let j = 0; j < k; j++) x += steps[j] * 80 + 10;
          const y = 760 - (k + 1) * 62;
          return (
            <g key={k} opacity={Math.min(1, s * 2)}>
              <rect x={x} y={y + (1 - s) * 60} width={w * 80} height={760 - y} rx={10} fill={w === 2 ? C.ink : C.paper} stroke={C.ink} strokeWidth={4} />
              <text x={x + w * 40} y={y + 46} textAnchor="middle" fontFamily={FONT_CN} fontWeight={900} fontSize={34} fill={w === 2 ? C.paper : C.ink}>{w === 2 ? "全" : "半"}</text>
            </g>
          );
        })}
      </svg>
      <svg width={W} height={1080} style={{ position: "absolute" }}>
        {cur < 0 && hepta.length > 1 && <polygon points={pts(hepta)} fill={C.yellow} fillOpacity={0.35} stroke={C.ink} strokeWidth={5} />}
        {cur >= 0 && <polygon points={pts(poly)} fill={triads[cur][3]} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />}
        <Clock cx={cx} cy={cy} r={r} lit={scaleLit} ink={C.ink} fill={C.paper} opacity={clockIn} scale={clockIn} />
      </svg>
      <Caption at={L(c.scale) + 0.2} out={L(c.major) - 0.3} big="大调音阶：全 全 半 全 全 全 半" small="MAJOR SCALE: W W H W W W H" size={66} />
      <div style={{ position: "absolute", left: 1330, top: 360, width: 520, opacity: cur === 0 || cur === 1 ? 1 : 0 }}>
        <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 86, color: C.ink }}>{cur === 1 ? "小三和弦" : "大三和弦"}</div>
        <div style={{ fontFamily: FONT_EN, fontSize: 64, color: cur === 1 ? C.violet : C.ink, marginTop: 6 }}>{cur === 1 ? "C · E♭ · G" : "C · E · G"}</div>
        <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 44, color: C.ink, marginTop: 24 }}>{cur === 1 ? "3 + 4 个半音 → 忧伤" : "4 + 3 个半音 → 明亮"}</div>
      </div>
      <div style={{ position: "absolute", left: 110, top: 330, opacity: progIn }}>
        {triads.slice(2).map(([at, , nm, col], k) => {
          const on = cur === k + 2;
          return <div key={k} style={{ fontFamily: FONT_EN, fontSize: on ? 150 : 96, lineHeight: 1.05, color: on ? col : C.ink, opacity: on ? 1 : 0.35, WebkitTextStroke: on ? `4px ${C.ink}` : undefined }}>{nm}</div>;
        })}
      </div>
      <Caption at={L(c.prog) + 0.3} out={12.5} big="流行歌的秘密：I – V – vi – IV" small="THE FOUR CHORDS BEHIND COUNTLESS POP SONGS" x={110} y={915} size={62} />
    </>
  );
};

// ════════════════ 05 RHYTHM: 4/4 clock, 3:4 polyrhythm, Euclidean necklaces
export const Rhythm: React.FC = () => {
  const t = useT(), sp = useSpring(), c = TL.c5, s0 = c.start;
  const L = (x: number) => x - s0;
  const cx = 1160, cy = 540;
  const phase = (t >= L(c.poly)) ? 2 : (t >= L(c.e38) ? 3 : 1);
  void phase;
  const meterOn = t < L(c.poly), polyOn = t >= L(c.poly) && t < L(c.e38), eucOn = t >= L(c.e38);
  // 4/4
  const beat = 0.5, mt = t - L(c.meter);
  const mBeat = Math.floor(Math.max(0, mt) / beat) % 4, mP = mt >= 0 ? Math.exp(-((mt % beat)) / 0.15) : 0;
  const hand = (Math.max(0, mt) / (beat * 4)) * 360;
  // poly
  const pt = t - L(c.poly), cyc = c.polyCycle, rot = (Math.max(0, pt) / cyc) * 360;
  const triHit = pt >= 0 ? Math.exp(-((pt % (cyc / 3))) / 0.12) : 0, sqHit = pt >= 0 ? Math.exp(-((pt % (cyc / 4))) / 0.12) : 0;
  // euclid
  const isE58 = t >= L(c.e58), et = t - (isE58 ? L(c.e58) : L(c.e38));
  const pat = isE58 ? [0, 2, 3, 5, 6] : [0, 3, 6];
  const step = Math.floor(Math.max(0, et) / c.euclidStep) % 8, stepP = Math.exp(-((Math.max(0, et) % c.euclidStep)) / 0.1);
  const R = 280;
  const swap = sp(isE58 ? L(c.e58) : L(c.e38));
  return (
    <>
      <ChapterHead n="05" title="节奏 = 时间的几何" en="RHYTHM IS GEOMETRY IN TIME" color={C.orange} />
      <svg width={W} height={1080} style={{ position: "absolute" }}>
        {meterOn && <g style={{ transformOrigin: `${cx}px ${cy}px`, scale: `${Math.min(1, sp(L(c.meter)))}` }}>
          {[0, 1, 2, 3].map(k => {
            const a0 = k * 90 - 90, a1 = a0 + 88;
            const rad = (a: number) => (a * Math.PI) / 180;
            const on = k === mBeat ? mP : 0;
            const d = `M${cx},${cy} L${cx + Math.cos(rad(a0)) * R},${cy + Math.sin(rad(a0)) * R} A${R},${R} 0 0 1 ${cx + Math.cos(rad(a1)) * R},${cy + Math.sin(rad(a1)) * R} Z`;
            return <path key={k} d={d} fill={k % 2 === 0 ? C.ink : C.paper} opacity={0.55 + 0.45 * on} style={{ transformOrigin: `${cx}px ${cy}px`, scale: `${1 + 0.06 * on}` }} />;
          })}
          <line x1={cx} y1={cy} x2={cx + Math.cos((hand - 90) * Math.PI / 180) * (R + 40)} y2={cy + Math.sin((hand - 90) * Math.PI / 180) * (R + 40)} stroke={C.yellow} strokeWidth={10} strokeLinecap="round" />
          {["1 咚", "2 嗒", "3 咚", "4 嗒"].map((s, k) => { const a = (k * 90 - 45) * Math.PI / 180; return <text key={k} x={cx + Math.cos(a) * 190} y={cy + Math.sin(a) * 190 + 18} textAnchor="middle" fontFamily={FONT_CN} fontWeight={900} fontSize={54} fill={k % 2 === 0 ? C.paper : C.ink}>{s}</text>; })}
        </g>}
        {polyOn && <g style={{ transformOrigin: `${cx}px ${cy}px`, scale: `${Math.min(1, sp(L(c.poly)))}` }}>
          <line x1={cx} y1={cy - R - 70} x2={cx} y2={cy - R + 10} stroke={C.ink} strokeWidth={8} />
          <polygon points={pts([0, 1, 2, 3].map(k => polar(cx, cy, R, k, 4)))} fill={C.paper} fillOpacity={0.3 + 0.5 * sqHit} stroke={C.ink} strokeWidth={8} style={{ transformOrigin: `${cx}px ${cy}px`, rotate: `${rot}deg` }} />
          <polygon points={pts([0, 1, 2].map(k => polar(cx, cy, R * 0.62, k, 3)))} fill={C.yellow} fillOpacity={0.4 + 0.6 * triHit} stroke={C.ink} strokeWidth={8} style={{ transformOrigin: `${cx}px ${cy}px`, rotate: `${rot}deg` }} />
          <text x={cx - 560} y={cy + 30} textAnchor="middle" fontFamily={FONT_EN} fontSize={200} fill={C.yellow} stroke={C.ink} strokeWidth={6}>3</text>
          <text x={cx + 560} y={cy + 30} textAnchor="middle" fontFamily={FONT_EN} fontSize={200} fill={C.paper} stroke={C.ink} strokeWidth={6}>4</text>
        </g>}
        {eucOn && <g style={{ transformOrigin: `${cx}px ${cy}px`, scale: `${Math.min(1.05, 0.85 + 0.15 * swap)}` }}>
          <circle cx={cx} cy={cy} r={R} stroke={C.ink} strokeWidth={5} fill="none" />
          <polygon points={pts(pat.map(k => polar(cx, cy, R, k, 8)))} fill={isE58 ? C.pink : C.yellow} stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
          {[...Array(8)].map((_, k) => { const [x, y] = polar(cx, cy, R, k, 8), on = pat.includes(k), cur = k === step; return <circle key={k} cx={x} cy={y} r={on ? 34 + (cur ? 14 * stepP : 0) : 18} fill={on ? C.ink : C.paper} stroke={C.ink} strokeWidth={4} />; })}
          {(() => { const [x, y] = polar(cx, cy, R + 70, step, 8); return <circle cx={x} cy={y} r={14} fill={C.paper} stroke={C.ink} strokeWidth={4} />; })()}
          <text x={cx} y={cy + 30} textAnchor="middle" fontFamily={FONT_EN} fontSize={84} fill={C.ink}>E({pat.length},8)</text>
        </g>}
      </svg>
      <Caption at={L(c.meter) + 0.2} out={L(c.poly) - 0.2} big="4/4 拍：每小节 4 拍" small="FOUR BEATS TO A BAR" />
      <Caption at={L(c.poly) + 0.2} out={L(c.e38) - 0.2} big="复节奏 3 : 4" small="POLYRHYTHM — TWO GRIDS AT ONCE" />
      <Caption at={L(c.e38) + 0.2} out={L(c.e58) - 0.15} big="E(3,8) · Tresillo" small="3 HITS SPREAD AS EVENLY AS POSSIBLE OVER 8 STEPS" />
      <Caption at={L(c.e58) + 0.15} out={9.6} big="E(5,8) · Cinquillo" small="EUCLID'S ALGORITHM, FROM CUBA TO TECHNO" />
      <Tag x={110} y={760} size={34} opacity={eucOn ? eOut(range(t, L(c.e38) + 0.4, L(c.e38) + 0.8)) : 0}>把 k 个鼓点尽量均匀地放进 n 格</Tag>
    </>
  );
};
export const _unused = { Abs, eIn, lerp };
