// 佛 · 第二支箭 — part 2: impermanence and grasping (诸行无常, 执着, the three poisons on the Wheel of Life), no-self
// (the character 我 sliced into the five aggregates; Nagasena's chariot), dependent origination and emptiness
// (a sheet of paper with a cloud in it).
import React from "react";
import { Art, BJ, BRUSH, Big, Decode, GOLD, GOLDFILL, GOLDL, INDIGO, Layer, MUTE, Note, PAPER, SANS, SERIF, Say, Seal, Svg, VQuote, backOut, eIn, eInOut, eOut, lerp, range, rnd } from "./kit";

// ═══ 诸行无常: a form gathers, holds, warps and scatters (生住异灭); then a grip on running sand; then the wheel
const FC: [number, number] = [760, 470];
export const HUB: [number, number] = [0.471, 0.478];          // the hub of the wheel in the thangka (fraction of the image)
export const Flux: React.FC<{ t: number }> = ({ t }) => {
  const F = BJ.flux;
  if (t < F.t - 0.1 || t >= F.out + 0.5) return null;
  const [p0, p1, p2, p3] = F.phases;
  const N = 420;
  const grip = eInOut(range(t, F.grasp + 0.2, F.wheel - 0.2));
  const wheelIn = eInOut(range(t, F.wheel - 0.35, F.wheel + 0.25));
  const o = 1 - eIn(range(t, F.out, F.out + 0.5));
  const phaseIdx = t < p1 ? 0 : t < p2 ? 1 : t < p3 ? 2 : 3;
  // particles: born from the collapsed tiles, form a ring, warp, scatter; then fall as sand through the grip
  const dots: React.ReactNode[] = [];
  if (t < F.wheel + 0.2) for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, r1 = rnd(i), r2 = rnd(i + 5.5), r3 = rnd(i + 9.1);
    let x: number, y: number, op = 1;
    if (t < F.grasp) {
      const born = eOut(range(t, p0 - 0.3 + r1 * 0.4, p0 + 0.45 + r1 * 0.3));
      const warp = eInOut(range(t, p2, p3)), gone = eIn(range(t, p3, p3 + 0.9 + r2 * 0.3));
      const R = 200 + Math.sin(t * 2.2 + i * 0.05) * 6 * (1 - warp) + warp * (Math.sin(a * 3 + t * 2) * 70 + Math.sin(a * 5 - t) * 40 + (r2 - 0.5) * 60);
      const hx = FC[0] + Math.cos(a) * R * (1 + warp * 0.25), hy = FC[1] + Math.sin(a) * R * (1 - warp * 0.15);
      const sx = 960 + (r1 - 0.5) * 60, sy = 470 + (r2 - 0.5) * 60;
      x = lerp(sx, hx, born) + gone * Math.cos(a + r3) * (240 + 520 * r3); y = lerp(sy, hy, born) + gone * (Math.sin(a + r3) * (240 + 420 * r3) - 160);
      op = born * (1 - gone) * (0.55 + 0.45 * r3);
    } else {
      // sand: falls from above into the grip; the tighter the grip, the faster it leaks out below
      const life = 1.1, ph = ((t - F.grasp) / life + r1) % 1, gx = FC[0] + (r2 - 0.5) * (70 - 40 * grip);
      const yTop = 40, yGrip = FC[1] + 40, leak = 0.35 + grip * 1.2;
      const fallIn = Math.min(1, ph * 2.0), fallOut = Math.max(0, ph * 2.0 - 1) * leak;
      x = gx + (fallOut > 0 ? (r3 - 0.5) * 80 * fallOut : 0); y = lerp(yTop, yGrip, eIn(fallIn)) + fallOut * 420;
      op = range(t, F.grasp - 0.1, F.grasp + 0.3) * (y > 1000 ? 0 : 1) * (0.5 + 0.5 * r3) * (1 - wheelIn);
    }
    if (op > 0.02) dots.push(<circle key={i} cx={x} cy={y} r={1.6 + r3 * 1.6} fill={GOLD} opacity={op} />);
  }
  // the grip: two arcs that close; at the end they become a circle — the hub of the wheel
  const gap = lerp(140, 64, grip), arcR = lerp(150, 120, wheelIn);
  return (
    <Layer o={o}>
      {/* the wheel of life: push into the hub, where a rooster, a snake and a pig chase each other's tails */}
      {t > F.wheel - 0.4 && <Art src="bd_wheel.jpg" t={t} a={F.wheel - 0.4} b={F.out + 0.5} from={[HUB[0], HUB[1], 1.0]} to={[HUB[0], HUB[1], 2.4]} o={wheelIn}
        filter="saturate(0.85) contrast(1.05) brightness(0.9)" fit="cover" />}
      {t > F.wheel && <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(5,11,28,0) 22%, rgba(5,11,28,0.55) 45%, rgba(5,11,28,0.9) 80%)", opacity: wheelIn }} />}
      {t > F.wheel && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 300, background: "linear-gradient(180deg, rgba(5,11,28,0), rgba(5,11,28,0.95))", opacity: wheelIn }} />}
      <Svg>
        {dots}
        {t > F.grasp && t < F.wheel + 0.4 && (() => {
          const k = eOut(range(t, F.grasp, F.grasp + 0.4)), cx = lerp(FC[0], 960, wheelIn), cy = lerp(FC[1] + 40, 540, wheelIn);
          const sweep = lerp(1.1, Math.PI, wheelIn);
          const arc = (side: number) => { const a0 = Math.PI / 2 + side * (Math.PI / 2 - sweep) , a1 = Math.PI / 2 + side * (Math.PI / 2 + sweep);
            const ox = side * lerp(gap, 0, wheelIn); return `M${cx + ox + Math.cos(a0) * arcR * side},${cy + Math.sin(a0) * arcR} A${arcR},${arcR} 0 0 ${side > 0 ? 0 : 1} ${cx + ox + Math.cos(a1) * arcR * side},${cy + Math.sin(a1) * arcR}`; };
          return <g opacity={k * (1 - eIn(range(t, F.wheel + 0.1, F.wheel + 0.4)))}><path d={arc(-1)} stroke={GOLD} strokeWidth={6} fill="none" strokeLinecap="round" /><path d={arc(1)} stroke={GOLD} strokeWidth={6} fill="none" strokeLinecap="round" /></g>;
        })()}
      </Svg>
      <VQuote t={t} at={F.quote} out={F.grasp} cols={["诸行无常"]} x={1830} y={150} size={76} />
      <Seal t={t} at={F.quote + 0.4} out={F.grasp} text="三法印 · 一" x={1830 - 76 * 1.42 - 14} y={170} size={26} vertical />
      {/* 生 住 异 灭 */}
      {t > p0 - 0.2 && t < F.grasp && ["生", "住", "异", "灭"].map((c, i) => {
        const on = i === phaseIdx, k = eOut(range(t, F.phases[i] - 0.1, F.phases[i] + 0.2));
        return <div key={i} style={{ position: "absolute", left: FC[0] - 300 + i * 200, top: 790, fontFamily: BRUSH, fontSize: on ? 96 : 72, lineHeight: 1,
          opacity: (on ? 1 : t > F.phases[i] ? 0.35 : 0.12) * (1 - eIn(range(t, F.grasp - 0.4, F.grasp))), ...(on ? GOLDFILL : { color: MUTE }), transform: `translate(-50%, -50%) scale(${on ? 1 + 0.08 * (1 - k) : 1})` }}>{c}</div>;
      })}
      <Decode t={t} at={F.decode} out={F.grasp + 0.6} text="苦，不是因为一切都在变——是因为你想让它不变。" x={130} y={930} size={44} />
      <Big t={t} at={F.glabel} out={F.wheel} ch="执着" x={1330} y={430} size={170} />
      <Say t={t} at={F.gdecode} out={F.wheel} text="抓得越紧，漏得越快。" x={1330} y={600} size={54} anchor="center" />
      {/* the three poisons */}
      {[["贪", "公鸡", -270, -210], ["嗔", "蛇", 310, -10], ["痴", "猪", -250, 230]].map(([c, a, dx, dy], i) => {
        const at = F.poisons[i];
        if (t < at) return null;
        const k = backOut(range(t, at, at + 0.3), 2);
        return <div key={i} style={{ position: "absolute", left: 960 + (dx as number), top: 540 + (dy as number), transform: `translate(-50%, -50%) scale(${k})`, textAlign: "center",
          opacity: 1 - eIn(range(t, F.out - 0.2, F.out + 0.2)), width: 170, height: 170, borderRadius: "50%", background: "rgba(5,11,28,0.86)", border: `2px solid ${GOLD}`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 0 30px rgba(0,0,0,0.6)" }}>
          <div style={{ fontFamily: BRUSH, fontSize: 96, lineHeight: 1, ...GOLDFILL }}>{c}</div>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24, color: PAPER }}>{a}</div>
        </div>;
      })}
      <Seal t={t} at={F.poisons[0] - 0.2} out={F.out} text="三毒 · 轮回的轴心" x={1830} y={120} size={30} />
      <Note t={t} at={F.wheel + 0.3} out={F.out} text="藏传唐卡《六道轮回图》· Wellcome Collection, CC BY 4.0" x={1840} y={1015} anchor="right" color={PAPER} />
      <Say t={t} at={F.who} out={F.out + 0.3} text="那个在「抓」的我——是谁？" x={960} y={905} size={58} anchor="center" gold />
    </Layer>
  );
};

// ═══ 诸法无我: slice 我 into the five aggregates; then Nagasena's chariot comes apart
const SC: [number, number] = [700, 500];
const HEAPS: [string, string][] = [["色", "身体"], ["受", "感受"], ["想", "念头"], ["行", "意志"], ["识", "觉知"]];
export const Self: React.FC<{ t: number }> = ({ t }) => {
  const S = BJ.self;
  if (t < S.t - 0.4 || t >= S.out + 0.4) return null;
  const o = 1 - eIn(range(t, S.out - 0.1, S.out + 0.4));
  const appear = eOut(range(t, S.t - 0.4, S.t + 0.3));
  const split = eOut(range(t, S.split, S.split + 0.6)), sliceOut = eIn(range(t, S.cart - 0.4, S.cart));
  const size = 560, top = SC[1] - size * 0.55, band = (size * 1.05) / 5;
  const cart = eInOut(range(t, S.cart, S.cart + 0.6)), apart = eOut(range(t, S.apart, S.apart + 0.7));
  const wc: [number, number] = [620, 640];
  const spokes = eOut(range(t, S.out - 0.6, S.out + 0.3));
  return (
    <Layer o={o}>
      {/* the character, whole, then in five bands */}
      {t < S.cart && HEAPS.map((_, i) => {
        const dx = split * (i % 2 ? 1 : -1) * (40 + i * 18), dy = split * (i - 2) * 22;
        return <div key={i} style={{ position: "absolute", left: SC[0] + dx, top: SC[1] + dy, transform: `translate(-50%, -50%) scale(${lerp(1.6, 1, appear)})`, fontFamily: BRUSH, fontSize: size, lineHeight: 1.05,
          clipPath: `inset(${i * 20}% -10% ${(4 - i) * 20}% -10%)`, opacity: appear * (1 - sliceOut), ...GOLDFILL, filter: "drop-shadow(0 0 30px rgba(221,184,98,0.3))" }}>我</div>;
      })}
      {t < S.cart && HEAPS.map(([c, d], i) => {
        const at = S.heaps[i], k = eOut(range(t, at, at + 0.3));
        if (t < at) return null;
        const y = top + band * (i + 0.5) + split * (i - 2) * 22 + 20;
        return <div key={i} style={{ position: "absolute", left: 1080, top: y, transform: `translate(${(1 - k) * 30}px, -50%)`, opacity: k * (1 - sliceOut), display: "flex", alignItems: "baseline", gap: 16 }}>
          <span style={{ fontFamily: BRUSH, fontSize: 70, lineHeight: 1, ...GOLDFILL }}>{c}</span>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 34, color: PAPER }}>{d}</span>
        </div>;
      })}
      <Svg>{t < S.cart && HEAPS.map((_, i) => { const at = S.heaps[i]; if (t < at) return null; const y = top + band * (i + 0.5) + split * (i - 2) * 22 + 20;
        return <line key={i} x1={SC[0] + 300} y1={y} x2={lerp(SC[0] + 300, 1060, eOut(range(t, at, at + 0.3)))} y2={y} stroke={GOLD} strokeWidth={1} opacity={0.5 * (1 - sliceOut)} />; })}</Svg>
      <VQuote t={t} at={S.quote} out={S.cart} cols={["诸法无我"]} x={1830} y={150} size={76} />
      <Seal t={t} at={S.quote + 0.4} out={S.cart} text="三法印 · 二" x={1830 - 76 * 1.42 - 14} y={170} size={26} vertical />
      <Say t={t} at={S.which} out={S.cart} text="哪一块，是「我」？" x={SC[0]} y={905} size={58} anchor="center" gold />
      {/* the chariot: wheel, axle, box, shaft — assembled, then taken apart */}
      {t > S.cart - 0.1 && (() => {
        const wx = wc[0] - apart * 170, wy = wc[1] + apart * 90, bx = 560 + apart * 0, by = 470 - apart * 60, sx = 860 + apart * 280, sy = 560 + apart * 30, ax = wc[0] + apart * 60, ay = wc[1] + apart * 210;
        const d = (len: number) => ({ strokeDasharray: `${len * cart} 9999` });
        return <Svg>
          <g opacity={1}>
            <circle cx={wx} cy={wy} r={130} fill="none" stroke={GOLD} strokeWidth={6} style={d(820)} />
            {Array.from({ length: 10 }, (_, k) => { const a = (k / 10) * Math.PI * 2 + spokes * 0.4; const L = 130 + spokes * (700 + rnd(k) * 900); return <line key={k} x1={wx} y1={wy} x2={wx + Math.cos(a) * L * cart} y2={wy + Math.sin(a) * L * cart} stroke={GOLD} strokeWidth={spokes > 0 ? 2 : 3} opacity={spokes > 0 ? 1 - spokes * 0.5 : 1} />; })}
            <circle cx={ax} cy={ay} r={18} fill={GOLD} opacity={cart} />
            <rect x={bx - 230} y={by - 70} width={460} height={140} fill="none" stroke={GOLD} strokeWidth={5} style={d(1200)} opacity={1 - spokes} />
            <line x1={sx - 120} y1={sy} x2={sx + 520 * cart} y2={sy - 90 * cart} stroke={GOLD} strokeWidth={5} opacity={1 - spokes} />
          </g>
        </Svg>;
      })()}
      {t > S.apart && [["轮", -170 + 620, 640 + 90 + 180], ["轴", 620 + 60, 640 + 210 + 70], ["舆", 560, 470 - 60 - 110], ["辕", 860 + 280 + 300, 560 + 30 - 140]].map(([c, x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x as number, top: y as number, transform: "translate(-50%, -50%)", fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: PAPER,
          opacity: eOut(range(t, S.apart + 0.2 + i * 0.08, S.apart + 0.5 + i * 0.08)) * (1 - eIn(range(t, S.out - 0.6, S.out - 0.2))) }}>{c}</div>
      ))}
      <Say t={t} at={S.apart} out={S.out - 0.2} text="轮子是车吗？轴是车吗？" x={130} y={90} size={56} />
      <Say t={t} at={S.name} out={S.out - 0.2} text="「车」，只是零件凑在一起时的名字。" x={130} y={180} size={56} gold />
      <Seal t={t} at={S.name + 0.6} out={S.out - 0.2} text="那先比丘经" x={1100} y={190} size={28} anchor="left" />
      <Decode t={t} at={S.decode} out={S.out} text="「我」也一样：不是没有你——是没有一个不变的你。" x={130} y={935} size={44} />
    </Layer>
  );
};

// ═══ 缘起: a sheet of paper holds a cloud, rain, a tree, sunlight … pull the cloud out and the paper is gone → 空
const PC: [number, number] = [700, 510];
const NODES: [string, number][] = [["云", -100], ["雨", -55], ["树", -10], ["阳光", 35], ["土地", 80], ["伐木人", 125], ["麦子", 170], ["你的眼睛", 215]];
export const Net: React.FC<{ t: number }> = ({ t }) => {
  const N = BJ.net;
  if (t < N.t - 0.3 || t >= N.out + 0.5) return null;
  const o = 1 - eIn(range(t, N.out - 0.1, N.out + 0.5));
  const pull = eIn(range(t, N.pull, N.pull + 0.5)), gone = range(t, N.gone, N.gone + 0.7);
  const paperO = (1 - gone) * (gone > 0 ? (Math.floor(t * 20) % 2 ? 0.55 : 1) : 1) * eOut(range(t, N.paper, N.paper + 0.4));
  const pos = (i: number): [number, number] => { const a = (NODES[i][1] * Math.PI) / 180; let x = PC[0] + Math.cos(a) * 420, y = PC[1] + Math.sin(a) * 320; if (i === 0) { x -= pull * 700; y -= pull * 520; } return [x, y]; };
  const dim = (1 - 0.65 * gone) * (1 - eIn(range(t, N.kong - 0.2, N.kong + 0.4)));
  const horizon = eInOut(range(t, N.out - 0.5, N.out + 0.2));
  return (
    <Layer o={o}>
      <VQuote t={t} at={N.quote} out={N.kong} cols={["此有故彼有", "此生故彼生", "此无故彼无", "此灭故彼灭"]} x={1850} y={140} size={54} src="杂阿含经" stagger={0.03} />
      <Svg>
        {/* threads: paper → each node, then node ↔ node (the net) */}
        {NODES.map((_, i) => { const at = N.nodes + i * 0.17; if (t < at) return null; const [x, y] = pos(i), k = eOut(range(t, at, at + 0.35));
          return <line key={i} x1={PC[0]} y1={PC[1]} x2={lerp(PC[0], x, k)} y2={lerp(PC[1], y, k)} stroke={GOLD} strokeWidth={1.5} opacity={(i === 0 ? 1 - pull : 0.7) * dim} />; })}
        {t > N.web && NODES.map((_, i) => [1, 3].map((s) => { const j = (i + s) % NODES.length; const [x1, y1] = pos(i), [x2, y2] = pos(j), k = eOut(range(t, N.web + i * 0.05, N.web + 0.5 + i * 0.05));
          return <line key={`${i}-${s}`} x1={x1} y1={y1} x2={lerp(x1, x2, k)} y2={lerp(y1, y2, k)} stroke={GOLD} strokeWidth={0.8} opacity={0.35 * dim * (i === 0 || j === 0 ? 1 - pull : 1)} />; }))}
        {NODES.map(([w], i) => { const at = N.nodes + i * 0.17; if (t < at) return null; const [x, y] = pos(i), k = backOut(range(t, at, at + 0.3), 2);
          const glint = t > N.web ? 0.5 + 0.5 * Math.sin(t * 4 + i * 1.7) : 0;
          return <g key={i} opacity={dim * (i === 0 ? 1 - eIn(range(t, N.pull + 0.3, N.pull + 0.6)) : 1)}>
            <circle cx={x} cy={y} r={52 * k} fill={INDIGO} stroke={GOLD} strokeWidth={2} />
            <circle cx={x + Math.cos(t * 2 + i) * 30} cy={y + Math.sin(t * 2 + i) * 30} r={3 * glint} fill={GOLDL} opacity={glint} />
          </g>; })}
        {/* the sheet of paper */}
        <g opacity={paperO} transform={`rotate(-4 ${PC[0]} ${PC[1]}) translate(${PC[0]} ${PC[1]}) scale(${1 - gone * 0.3}) translate(${-PC[0]} ${-PC[1]})`}>
          <rect x={PC[0] - 110} y={PC[1] - 145} width={220} height={290} fill={PAPER} style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))" }} />
          {[0, 1, 2, 3, 4].map((k) => <line key={k} x1={PC[0] - 80} y1={PC[1] - 100 + k * 40} x2={PC[0] + 80 - (k === 4 ? 60 : 0)} y2={PC[1] - 100 + k * 40} stroke="#B9AD92" strokeWidth={2} />)}
        </g>
        {/* the horizon that the next scene stands on */}
        {horizon > 0 && <line x1={960 - 960 * horizon} y1={640} x2={960 + 960 * horizon} y2={640} stroke={GOLD} strokeWidth={3} />}
      </Svg>
      {NODES.map(([w], i) => { const at = N.nodes + i * 0.17; if (t < at) return null; const [x, y] = pos(i);
        return <div key={i} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", fontFamily: SERIF, fontWeight: 900, fontSize: w.length > 2 ? 22 : w.length > 1 ? 28 : 36,
          color: GOLDL, opacity: eOut(range(t, at + 0.1, at + 0.4)) * dim * (i === 0 ? 1 - eIn(range(t, N.pull + 0.3, N.pull + 0.6)) : 1), whiteSpace: "nowrap" }}>{w}</div>; })}
      <Say t={t} at={N.cloud} out={N.pull} text="这张纸里，有一朵云。" x={130} y={60} size={58} gold />
      <Note t={t} at={N.cloud + 0.6} out={N.pull} text="一行禅师讲《心经》的比喻" x={130} y={140} color={PAPER} />
      <Say t={t} at={N.gone} out={N.kong} text="拿走云——这张纸，就不在了。" x={130} y={60} size={58} />
      <Big t={t} at={N.kong} out={N.out + 0.2} ch="空" x={PC[0]} y={PC[1] - 20} size={420} />
      <Seal t={t} at={N.kong + 0.5} out={N.out} text="缘起性空" x={PC[0] + 260} y={PC[1] - 230} size={30} vertical anchor="left" rot={3} />
      <Decode t={t} at={N.decode} out={N.out} text="空，不是没有——是没有一个独立、不变的「自己」。" x={130} y={935} size={44} />
    </Layer>
  );
};
