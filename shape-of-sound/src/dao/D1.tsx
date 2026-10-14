// The hook (one empty circle becomes a wheel's hub, a bowl's hollow and a moon gate: 「空，才有用」) and the title
// (道德经 第十一章 in columns).
import React from "react";
import { BRUSH, Brush, Columns, DJ, INK, INK2, InkCircle, Layer, Note, Paper, Pt, SEAL, SERIF, Say, Seal, Svg, WASH, eIn, eInOut, eOut, fade, lerp, range } from "./kit";

const H = DJ.hook, T = DJ.title;
const C = { x: 960, y: 640, r: 270 };

export const Hook: React.FC<{ t: number }> = ({ t }) => {
  if (t >= T.t + 0.8) return null;
  const draw = eInOut(range(t, H.circle, H.circle + 1.1));
  const wheel = fade(t, H.wheel, H.bowl + 0.2, 0.35, 0.4), spin = (t - H.wheel) * 0.5;
  const bowlK = eInOut(range(t, H.bowl - 0.1, H.bowl + 0.5)), bowlO = fade(t, H.bowl - 0.1, H.room + 0.2, 0.3, 0.4);
  const roomK = eInOut(range(t, H.room - 0.1, H.room + 0.6));
  const zoom = eIn(range(t, H.out - 0.6, T.t + 0.6));                       // through the moon gate
  const ry = C.r * lerp(1, 0.32, bowlK * (1 - roomK));
  const label = (at: number, out: number, a: string) => <Say t={t} at={at} out={out} text={a} x={1440} y={560} size={58} font={SERIF} weight={900} />;
  const why = (at: number, out: number) => <Say t={t} at={at} out={out} text="用的，是中间的空。" x={1440} y={650} size={40} weight={600} color={INK2} />;
  return (
    <Layer o={1 - eIn(range(t, T.t + 0.1, T.t + 0.7))}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1, 6, zoom)})`, transformOrigin: `${C.x}px ${C.y}px` }}>
        <Paper />
        {/* the moon gate: a wall of wash with a round opening */}
        {roomK > 0 && <Svg>
          <defs><mask id="gate"><rect x={0} y={0} width={1920} height={1080} fill="#fff" /><circle cx={C.x} cy={C.y} r={C.r - 4} fill="#000" /></mask></defs>
          {/* through the gate: a far landscape in pale wash */}
          <g opacity={roomK * 0.55}>
            <path d={`M ${C.x - 300},${C.y + 60} Q ${C.x - 180},${C.y - 120} ${C.x - 60},${C.y + 10} Q ${C.x + 40},${C.y - 170} ${C.x + 160},${C.y - 10} Q ${C.x + 240},${C.y - 80} ${C.x + 320},${C.y + 40} L ${C.x + 320},${C.y + 300} L ${C.x - 300},${C.y + 300} Z`} fill="#9A958A" style={{ filter: "blur(6px)" }} />
            <path d={`M ${C.x - 300},${C.y + 140} Q ${C.x - 100},${C.y + 40} ${C.x + 80},${C.y + 130} Q ${C.x + 200},${C.y + 70} ${C.x + 320},${C.y + 140} L ${C.x + 320},${C.y + 300} L ${C.x - 300},${C.y + 300} Z`} fill="#6E6A62" style={{ filter: "blur(4px)" }} />
          </g>
          {/* a white-washed garden wall (粉墙) under a dark tile roof (黛瓦) */}
          <g mask="url(#gate)" opacity={roomK}>
            <rect x={0} y={250} width={1920} height={830} fill="#F3EEE4" />
            <rect x={0} y={250} width={1920} height={830} fill="url(#wallWash)" />
            <rect x={0} y={232} width={1920} height={30} fill="#33312C" />
            {Array.from({ length: 49 }, (_, i) => <path key={i} d={`M ${i * 40},262 q 20,18 40,0`} fill="#33312C" />)}
            <rect x={0} y={214} width={1920} height={14} fill="#46433C" />
          </g>
          <defs><linearGradient id="wallWash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D9D1C0" stopOpacity="0.7" /><stop offset="0.25" stopColor="#E9E2D3" stopOpacity="0.2" /><stop offset="1" stopColor="#CFC6B2" stopOpacity="0.5" /></linearGradient></defs>
        </Svg>}
        <Svg>
          {/* the bowl: the circle tips into a rim, a body below, tea in the hollow */}
          {bowlO > 0 && <g opacity={bowlO}>
            <ellipse cx={C.x} cy={C.y} rx={C.r * 0.97} ry={ry * 0.95} fill={`rgba(120,110,80,${0.25 * bowlK})`} />
            <Brush id="bowlB" pts={Array.from({ length: 40 }, (_, i) => { const a = Math.PI * (i / 39); return [C.x - Math.cos(a) * C.r * 0.98, C.y + Math.sin(a) * C.r * 0.62] as Pt; })} w={22} k={bowlK} seed={21} />
            <Brush id="bowlF" pts={[[C.x - 90, C.y + C.r * 0.62 + 4], [C.x + 90, C.y + C.r * 0.62 + 4]]} w={16} k={eInOut(range(t, H.bowl + 0.4, H.bowl + 0.8))} seed={22} />
          </g>}
          {/* the circle itself: drawn once, it stays all through the hook */}
          <g transform={`translate(${C.x},${C.y}) scale(1,${ry / C.r}) translate(${-C.x},${-C.y})`}>
            <InkCircle id="hookC" cx={C.x} cy={C.y} r={C.r} w={30} k={draw} seed={3} />
          </g>
          {/* the wheel: thirty spokes round an empty hub */}
          {wheel > 0 && <g opacity={wheel} transform={`rotate(${(spin * 180) / Math.PI} ${C.x} ${C.y})`} style={{ filter: "url(#hookCr)" }}>
            {Array.from({ length: 30 }, (_, i) => { const a = (i / 30) * Math.PI * 2, k = eOut(range(t, H.wheel + i * 0.012, H.wheel + 0.3 + i * 0.012));
              return <line key={i} x1={C.x + Math.cos(a) * 52} y1={C.y + Math.sin(a) * 52} x2={C.x + Math.cos(a) * lerp(52, C.r - 12, k)} y2={C.y + Math.sin(a) * lerp(52, C.r - 12, k)} stroke={INK} strokeWidth={6} strokeLinecap="round" opacity={0.85} />; })}
            <circle cx={C.x} cy={C.y} r={46} fill="none" stroke={INK} strokeWidth={12} />
          </g>}
          {wheel > 0 && <circle cx={C.x} cy={C.y} r={34} fill={SEAL} opacity={0.22 * wheel * (0.7 + 0.3 * Math.sin(t * 5))} />}
        </Svg>
      </div>
      {/* the claim, from frame 1 */}
      <Layer o={1 - eIn(range(t, H.out - 0.5, H.out))}>
        <Say t={t} at={0.0} out={H.out} text="老子说：" x={960} y={70} size={44} anchor="center" weight={600} color={INK2} stagger={0.03} />
        <Say t={t} at={H.claim} out={H.out} text="空，才有用。" x={960} y={130} size={128} anchor="center" font={BRUSH} weight={400} stagger={0.12} />
      </Layer>
      {label(H.wheel + 0.2, H.bowl, "车轮")}{why(H.wheel + 0.6, H.bowl)}
      {label(H.bowl + 0.2, H.room, "杯子")}{why(H.bowl + 0.6, H.room)}
      {label(H.room + 0.2, H.out, "房间")}{why(H.room + 0.6, H.out)}
      <Note t={t} at={H.wheel + 0.2} out={H.bowl} text="三十根辐条，围着一个空的“毂”" x={1442} y={720} size={24} />
    </Layer>
  );
};

export const Title: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.t - 0.4 || t >= T.out + 0.6) return null;
  const o = Math.min(eOut(range(t, T.t - 0.4, T.t + 0.4)), 1 - eInOut(range(t, T.out - 0.3, T.out + 0.5)));
  return (
    <Layer o={o}>
      <Paper />
      <div style={{ position: "absolute", left: 170, top: 170, fontFamily: BRUSH, fontSize: 520, color: INK, lineHeight: 1, opacity: eOut(range(t, T.big, T.big + 0.8)), filter: `blur(${(1 - eOut(range(t, T.big, T.big + 0.8))) * 10}px)` }}>空</div>
      <Seal t={t} at={T.big + 0.7} text="老子" x={700} y={720} s={96} />
      <Columns t={t} at={T.cols} out={T.out + 0.4} x={1700} y={110} size={54} gap={1.45} stagger={0.045}
        cols={["三十辐共一毂，", "当其无，有车之用。", "埏埴以为器，", "当其无，有器之用。", "凿户牖以为室，", "当其无，有室之用。", "故有之以为利，", "无之以为用。"]} />
      <Note t={t} at={T.cols + 0.3} out={T.out} text="《道德经》第十一章" x={1150} y={1000} size={24} color={INK2} />
      <Say t={t} at={T.gloss} out={T.out + 0.4} text="“有”给了它样子，“无”才让它能用。" x={170} y={860} size={42} weight={900} color={INK} stagger={0.04} />
      <Note t={t} at={T.gloss + 0.3} out={T.out} text="大意" x={172} y={930} size={20} color={WASH} />
    </Layer>
  );
};
