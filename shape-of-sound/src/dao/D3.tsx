// Taiji (有无相生, 反者道之动), the full calendar of a modern life (满了的杯子), and the ending on Ma Yuan's cold river:
// the circle becomes the moon — 「给生活，留一点白」.
import React from "react";
import { Art, BRUSH, Columns, Credit, DJ, INK, INK2, InkCircle, Layer, Note, Paper, SANS, SEAL, Say, Seal, Svg, WASH, eIn, eInOut, eOut, lerp, range, rnd } from "./kit";

const TJ = DJ.taiji, B = DJ.busy, E = DJ.end;

export const Taiji: React.FC<{ t: number }> = ({ t }) => {
  if (t < TJ.t - 0.5 || t >= TJ.out + 0.6) return null;
  const o = Math.min(eOut(range(t, TJ.t - 0.5, TJ.t + 0.3)), 1 - eInOut(range(t, TJ.out - 0.3, TJ.out + 0.5)));
  const cx = 1160, cy = 560, R = 300;
  const fill = eInOut(range(t, TJ.fill, TJ.fill + 1.0)), rot = (t - TJ.spin) * 22 * (t > TJ.spin ? 1 : 0);
  const yin = `M ${cx},${cy - R} A ${R},${R} 0 0 1 ${cx},${cy + R} A ${R / 2},${R / 2} 0 0 1 ${cx},${cy} A ${R / 2},${R / 2} 0 0 0 ${cx},${cy - R} Z`;
  return (
    <Layer o={o}>
      <Paper />
      <Svg>
        <g transform={`rotate(${rot} ${cx} ${cy})`}>
          <path d={yin} fill={INK} opacity={0.9 * fill} style={{ filter: `blur(${(1 - fill) * 14}px)` }} />
          <circle cx={cx} cy={cy - R / 2} r={R * 0.13} fill={INK} opacity={0.9 * eOut(range(t, TJ.fill + 0.8, TJ.fill + 1.2))} />
          <circle cx={cx} cy={cy + R / 2} r={R * 0.13} fill="#EEE6D3" opacity={eOut(range(t, TJ.fill + 0.8, TJ.fill + 1.2))} />
          <InkCircle id="tjC" cx={cx} cy={cy} r={R} w={22} k={eInOut(range(t, TJ.t - 0.3, TJ.fill + 0.6))} seed={11} />
        </g>
      </Svg>
      <Columns t={t} at={TJ.l1} out={TJ.l2} x={300} y={150} size={96} cols={["有无相生"]} />
      <Say t={t} at={TJ.l1 + 0.6} out={TJ.l2} text="有和无，互相生出对方。" x={110} y={620} size={44} weight={900} />
      <Note t={t} at={TJ.l1 + 0.8} out={TJ.l2} text="《道德经》第二章" x={112} y={690} size={22} />
      <Columns t={t} at={TJ.l2} out={TJ.l3} x={300} y={150} size={96} cols={["反者道之动"]} />
      <Say t={t} at={TJ.l2 + 0.6} out={TJ.l3} text="走到头，就会往回走。" x={110} y={700} size={44} weight={900} />
      <Note t={t} at={TJ.l2 + 0.8} out={TJ.l3} text="《道德经》第四十章" x={112} y={770} size={22} />
      <Columns t={t} at={TJ.l3} out={TJ.out + 0.3} x={300} y={150} size={96} cols={["弱者道之用"]} />
      <Say t={t} at={TJ.l3 + 0.6} out={TJ.out + 0.3} text="柔软，才是道的力气。" x={110} y={700} size={44} weight={900} />
      <Note t={t} at={TJ.l3 + 0.8} out={TJ.out} text="《道德经》第四十章 · 大意" x={112} y={770} size={22} />
    </Layer>
  );
};

// a modern life: a month of squares filling with ink until nothing is left white; then it washes away
const COLS = 7, ROWS = 5, CW = 200, CH = 128, GX = 960 - (COLS * CW) / 2, GY = 300;
export const Busy: React.FC<{ t: number }> = ({ t }) => {
  if (t < B.t - 0.5 || t >= B.out + 0.6) return null;
  const o = Math.min(eOut(range(t, B.t - 0.5, B.t + 0.3)), 1 - eInOut(range(t, B.out - 0.3, B.out + 0.5)));
  const grid = eInOut(range(t, B.t, B.fill));
  const wash = eInOut(range(t, B.clear, B.clear + 1.0));
  return (
    <Layer o={o}>
      <Paper />
      <Svg>
        <g opacity={grid * (1 - wash * 0.7)} stroke={INK2} strokeWidth={2.5}>
          {Array.from({ length: COLS + 1 }, (_, i) => <line key={`c${i}`} x1={GX + i * CW} y1={GY} x2={GX + i * CW} y2={GY + ROWS * CH * grid} />)}
          {Array.from({ length: ROWS + 1 }, (_, i) => <line key={`r${i}`} x1={GX} y1={GY + i * CH} x2={GX + COLS * CW * grid} y2={GY + i * CH} />)}
        </g>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          // each square fills at its own moment, faster and faster (busier and busier)
          const order = Math.floor(rnd(i * 3 + 1) * 1000) / 1000, at = B.fill + (B.full - B.fill) * Math.sqrt(order);
          const k = eOut(range(t, at, at + 0.18)); if (k <= 0) return null;
          const x = GX + (i % COLS) * CW, y = GY + Math.floor(i / COLS) * CH;
          return <rect key={i} x={x + 8} y={y + 8} width={(CW - 16) * k} height={CH - 16} fill={INK} opacity={0.88 * (1 - wash)} rx={3}
            transform={`rotate(${(rnd(i) - 0.5) * 2} ${x + CW / 2} ${y + CH / 2})`} style={{ filter: wash > 0 ? `blur(${wash * 18}px)` : undefined }} />;
        })}
      </Svg>
      <Say t={t} at={B.l1} out={B.l2} text="今天的我们：" x={GX} y={170} size={52} weight={900} />
      <Say t={t} at={B.l2} out={B.clear} text="把每一格，都填满了。" x={GX} y={170} size={52} weight={900} />
      <Say t={t} at={B.l3} out={B.out + 0.3} text="可满了的杯子，装不进新的水。" x={960} y={480} size={64} anchor="center" weight={900} />
    </Layer>
  );
};

// the ending: Ma Yuan's lone fisherman on the cold river; the circle is the moon
export const End: React.FC<{ t: number }> = ({ t }) => {
  if (t < E.t - 0.6) return null;
  const o = eOut(range(t, E.t - 0.6, E.t + 0.4));
  const card = eInOut(range(t, E.title - 0.3, E.title + 0.9));
  return (
    <Layer o={o}>
      <Paper />
      <Art src="dao_fisher.jpg" t={t} a={E.t - 0.6} b={E.title} from={[0.5, 0.55, 1.18]} to={[0.5, 0.52, 1.0]} filter="sepia(0.2) contrast(1.05) brightness(1.02)" />
      <Svg><InkCircle id="moon" cx={1500} cy={250} r={90} w={10} k={eInOut(range(t, E.moon, E.moon + 1.4))} seed={31} color={INK2} /></Svg>
      <Say t={t} at={E.l1} out={E.title + 0.2} text="给生活，留一点白。" x={140} y={150} size={92} font={BRUSH} weight={400} stagger={0.12} />
      <Say t={t} at={E.l2} out={E.title + 0.2} text="空，才有用。" x={150} y={290} size={58} weight={900} color={INK2} stagger={0.09} />
      <Seal t={t} at={E.seal} text="道" x={540} y={410} s={84} o={1 - card} />
      <Credit t={t} at={E.t} out={E.title} text="马远《寒江独钓图》（南宋）· 东京国立博物馆" />
      <Layer o={card}>
        <Paper />
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: BRUSH, fontSize: 230, color: INK, letterSpacing: 40 }}>道 · 空</div>
        <Seal t={t} at={E.title + 0.6} text="老子" x={1290} y={560} s={86} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 940, textAlign: "center", fontFamily: SANS, fontWeight: 500, fontSize: 20, color: WASH, letterSpacing: 1.5, lineHeight: 1.7 }}>
          引文：《道德经》第二、八、十一、四十、七十八章 · 《庄子》养生主、人间世、齐物论<br />图：马远 · 韩滉 · 及画中所列
        </div>
      </Layer>
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: eIn(range(t, E.out - 0.6, E.out)) }} />
    </Layer>
  );
};
export { SEAL, lerp };
