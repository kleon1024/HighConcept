// 佛 · 第二支箭 — part 3: the Heart Sutra (a wave is water; the 260 characters, 21 of them 无; even 苦集灭道 is empty;
// the raft), the Diamond Sutra (the oldest dated printed book; 凡所有相 as labels peeled off Sengai's ○△□; the six
// likenesses 梦幻泡影露电), and 应无所住 (a goose over a still pond leaves no reflection behind).
import React from "react";
import { Art, AZURE, BJ, BRUSH, Big, CINNABAR, Decode, GOLD, GOLDFILL, GOLDL, INDIGO, INDIGO2, Layer, MUTE, Note, PAPER, SERIF, Say, Seal, Svg, VQuote, backOut, eIn, eInOut, eOut, fade, lerp, range, rnd } from "./kit";

export const XINJING = "观自在菩萨行深般若波罗蜜多时照见五蕴皆空度一切苦厄舍利子色不异空空不异色色即是空空即是色受想行识亦复如是舍利子是诸法空相不生不灭不垢不净不增不减是故空中无色无受想行识无眼耳鼻舌身意无色声香味触法无眼界乃至无意识界无无明亦无无明尽乃至无老死亦无老死尽无苦集灭道无智亦无得以无所得故菩提萨埵依般若波罗蜜多故心无挂碍无挂碍故无有恐怖远离颠倒梦想究竟涅槃三世诸佛依般若波罗蜜多故得阿耨多罗三藐三菩提故知般若波罗蜜多是大神咒是大明咒是无上咒是无等等咒能除一切苦真实不虚故说般若波罗蜜多咒即说咒曰揭谛揭谛波罗揭谛波罗僧揭谛菩提萨婆诃";
const HY = 640;   // the horizon / waterline

// water below the line, with a travelling bump (the wave)
const Water: React.FC<{ t: number; amp: number; xc: number; o?: number }> = ({ t, amp, xc, o = 1 }) => {
  const pts: string[] = [];
  for (let x = 0; x <= 1920; x += 12) {
    const w = Math.exp(-Math.pow((x - xc) / 190, 2)), lean = Math.exp(-Math.pow((x - xc - 60) / 120, 2)) * 0.35;
    pts.push(`${x},${(HY - amp * (w + lean * amp / 260) + Math.sin(x * 0.02 + t * 2) * 3).toFixed(1)}`);
  }
  return (
    <g opacity={o}>
      <defs><linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={AZURE} stopOpacity={0.55} /><stop offset="100%" stopColor={INDIGO2} stopOpacity={0.9} /></linearGradient></defs>
      <path d={`M0,1080 L${pts.join(" L")} L1920,1080 Z`} fill="url(#water)" />
      <polyline points={pts.join(" ")} fill="none" stroke={GOLD} strokeWidth={3} />
      {Array.from({ length: 9 }, (_, i) => { const y = HY + 40 + i * 42, x = ((i * 377 + t * (30 + i * 8)) % 2200) - 140; return <line key={i} x1={x} y1={y} x2={x + 120 + i * 10} y2={y} stroke={GOLD} strokeWidth={1} opacity={0.18} />; })}
      {amp > 40 && Array.from({ length: 16 }, (_, i) => { const a = rnd(i) * Math.PI, x = xc + Math.cos(a) * 60 + 30, y = HY - amp - 10 - Math.sin(a) * 18 - ((t * 60 + i * 13) % 26); return <circle key={i} cx={x} cy={y} r={1.5 + rnd(i + 2) * 2} fill={GOLDL} opacity={0.6 * Math.min(1, amp / 200)} />; })}
    </g>
  );
};

export const Heart: React.FC<{ t: number }> = ({ t }) => {
  const H = BJ.heart;
  if (t < H.t - 0.1 || t >= H.out + 0.5) return null;
  const o = 1 - eIn(range(t, H.out - 0.1, H.out + 0.5));
  const amp = 260 * eOut(range(t, H.rise, H.rise + 0.8)) * (1 - eInOut(range(t, H.fall, H.fall + 0.7)));
  const xc = lerp(560, 820, range(t, H.rise, H.fall + 0.7));
  const field = fade(t, H.field - 0.2, H.raft + 0.1, 0.4, 0.5);
  const waterO = 1 - field * 0.95;
  // the raft: crosses, the traveller steps off, the raft stays
  const cross = eInOut(range(t, H.raft, H.leave)), rx = lerp(330, 1420, cross), bob = Math.sin(t * 5) * 4;
  const step = eInOut(range(t, H.leave, H.leave + 0.9));
  const travX = step > 0 ? lerp(rx + 20, 1700, step) : rx + 20, travY = step > 0 ? lerp(HY - 24 + bob, HY - 30, Math.min(1, step * 3)) - Math.sin(Math.min(1, step * 3) * Math.PI) * 30 : HY - 24 + bob;
  return (
    <Layer o={o}>
      <Svg>
        <Water t={t} amp={amp} xc={xc} o={waterO} />
        {t > H.raft - 0.2 && (() => { const k = eOut(range(t, H.raft - 0.2, H.raft + 0.3)); const back = step * 40;
          return <g opacity={k}>
            <path d={`M0,${HY - 2} L250,${HY - 2} L300,${HY + 4}`} stroke={GOLD} strokeWidth={6} fill="none" />
            <path d={`M1920,${HY - 6} L1560,${HY - 6} L1500,${HY + 4}`} stroke={GOLD} strokeWidth={6} fill="none" />
            <g transform={`translate(${rx - back - 90} ${HY - 18 + bob})`}>{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={i * 36} y={0} width={32} height={20} rx={8} fill="none" stroke={GOLD} strokeWidth={2.5} />)}
              <line x1={-6} y1={8} x2={186} y2={8} stroke={GOLD} strokeWidth={1.5} /></g>
            <circle cx={travX} cy={travY - 8} r={11} fill={GOLDL} style={{ filter: "drop-shadow(0 0 10px rgba(245,226,166,0.9))" }} />
          </g>; })()}
      </Svg>
      <Big t={t} at={H.se} out={H.fall + 0.3} ch="浪" x={xc + 20} y={HY - amp - 120} size={150} />
      <Seal t={t} at={H.se + 0.3} out={H.fall + 0.3} text="= 色（形）" x={xc + 120} y={HY - amp - 150} size={30} anchor="left" />
      <Big t={t} at={H.kong} out={H.field} ch="水" x={xc} y={HY + 150} size={150} />
      <Seal t={t} at={H.kong + 0.3} out={H.field} text="= 空（本性）" x={xc + 100} y={HY + 120} size={30} anchor="left" />
      <VQuote t={t} at={H.quote} out={H.field} cols={["色不异空", "空不异色", "色即是空", "空即是色"]} x={1850} y={110} size={60} src="心经" />
      <Decode t={t} at={H.decode} out={H.field} text="浪，就是水。浪从来没有离开过水。" x={130} y={935} size={44} />
      {/* the whole Heart Sutra: 260 characters in 13 columns of 20, read right to left */}
      {field > 0 && (() => {
        const cs = 40, cw = 58, rh = 44, right = 1360, top = 100;
        const lit = (i: number) => XINJING[i] === "无";
        let wn = 0; const wIdx: Record<number, number> = {};
        Array.from(XINJING).forEach((c, i) => { if (c === "无") wIdx[i] = wn++; });
        const szStart = XINJING.indexOf("无苦集灭道");
        const sz = range(t, H.sz, H.sz + 0.3);
        return <Layer o={field}>
          <div style={{ position: "absolute", left: right + 30, top, writingMode: "vertical-rl", fontFamily: SERIF, fontWeight: 900, fontSize: 44, letterSpacing: 6, ...GOLDFILL }}>般若波罗蜜多心经</div>
          <Seal t={t} at={H.field + 0.5} out={H.raft} text="二百六十字" x={right + 30 + 50} y={top + 520} size={26} vertical anchor="left" />
          {Array.from(XINJING).map((c, i) => {
            const col = Math.floor(i / 20), row = i % 20, at = H.field + i * 0.0032, k = range(t, at, at + 0.25);
            const isWu = lit(i), wk = isWu ? eOut(range(t, H.wu + wIdx[i] * 0.03, H.wu + wIdx[i] * 0.03 + 0.25)) : 0;
            const inSz = i >= szStart && i < szStart + 5;
            const dimK = sz > 0 && !inSz ? 1 - 0.75 * sz : 1;
            return <div key={i} style={{ position: "absolute", left: right - (col + 1) * cw + (cw - cs) / 2, top: top + row * rh, width: cs, textAlign: "center", fontFamily: SERIF, fontWeight: 900, fontSize: cs, lineHeight: 1,
              opacity: k * dimK, color: wk > 0 ? CINNABAR : inSz && sz > 0 ? GOLDL : GOLD, transform: `scale(${1 + wk * 0.35 * (1 - range(t, H.wu + 0.3 + wIdx[i] * 0.03, H.wu + 0.7 + wIdx[i] * 0.03))})`,
              textShadow: wk > 0 ? "0 0 14px rgba(201,68,46,0.8)" : undefined }}>{c}</div>;
          })}
          {sz > 0 && (() => { const col = Math.floor(szStart / 20), row = szStart % 20; return <div style={{ position: "absolute", left: right - (col + 1) * cw + 2, top: top + row * rh - 8, width: cw - 4, height: rh * 5 + 8,
            border: `2px solid ${GOLDL}`, opacity: sz, boxShadow: "0 0 30px rgba(245,226,166,0.5)" }} />; })()}
          <div style={{ position: "absolute", left: 130, top: 300, opacity: eOut(range(t, H.wu, H.wu + 0.3)) * (1 - sz), display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontFamily: BRUSH, fontSize: 200, lineHeight: 1, color: CINNABAR }}>无</span>
            <span style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 90, ...GOLDFILL }}>× 21</span>
          </div>
          <Say t={t} at={H.sz + 0.1} out={H.raft} text="连「苦集灭道」，" x={130} y={360} size={58} gold />
          <Say t={t} at={H.sz + 0.5} out={H.raft} text="都是空的。" x={130} y={450} size={58} />
        </Layer>;
      })()}
      <VQuote t={t} at={H.rquote} out={H.out} cols={["知我说法，如筏喻者", "法尚应舍，何况非法"]} x={430} y={80} size={50} src="金刚经" />
      <Decode t={t} at={H.rdecode} out={H.out} text="佛法是船：过了河，就别扛着船走。" x={960} y={935} size={46} anchor="center" />
    </Layer>
  );
};

// ═══ the Diamond Sutra: the scroll from Dunhuang; then 凡所有相 — labels slapped on Sengai's ○△□ and peeled off
export const DS: { from: [number, number, number]; to: [number, number, number] } = { from: [0.84, 0.45, 1.3], to: [0.3, 0.5, 1.0] };
export const SENGAI = { box: [190, 250, 1100, 652] as [number, number, number, number], spots: [[0.31, 0.5], [0.585, 0.47], [0.83, 0.52]] as [number, number][] };
const LABELS = ["我的", "失败", "完美"];
export const Diamond: React.FC<{ t: number }> = ({ t }) => {
  const D = BJ.diamond;
  if (t < D.t - 0.3 || t >= D.out + 0.4) return null;
  const o = 1 - eIn(range(t, D.out - 0.1, D.out + 0.4));
  const dim = 1 - 0.75 * eInOut(range(t, D.quote - 0.3, D.quote + 0.2));
  const sen = eOut(range(t, D.sengai, D.sengai + 0.5));
  const [bx, by, bw, bh] = SENGAI.box;
  return (
    <Layer o={o}>
      <Art src="bd_jingang.jpg" t={t} a={D.t - 0.3} b={D.quote + 0.5} from={DS.from} to={DS.to} o={eOut(range(t, D.t - 0.3, D.t + 0.3)) * dim * (1 - sen * 0.6)}
        filter="sepia(0.35) saturate(0.85) brightness(0.92) contrast(1.05)" />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,11,28,0) 55%, rgba(5,11,28,0.92) 100%)" }} />
      <Say t={t} at={D.fact} out={D.quote} text="现存最早、印有确切日期的印刷书——" x={130} y={800} size={50} />
      <Say t={t} at={D.fact + 0.6} out={D.quote} text="是一部《金刚经》。" x={130} y={880} size={66} gold />
      <Note t={t} at={D.fact + 0.9} out={D.quote} text="唐咸通九年（公元 868 年）· 敦煌藏经洞 · 大英图书馆" x={130} y={985} color={PAPER} />
      <VQuote t={t} at={D.quote} out={D.out} cols={["凡所有相，皆是虚妄", "若见诸相非相，则见如来"]} x={1850} y={90} size={56} src="金刚经" />
      {sen > 0 && <div style={{ position: "absolute", left: bx - 24, top: by - 24, width: bw + 48, height: bh + 48, background: "#E9E1CC", opacity: sen, boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        transform: `translateY(${(1 - sen) * 40}px)` }} />}
      {sen > 0 && <Art src="bd_sengai.jpg" t={t} a={D.sengai} b={D.out} from={[0.5, 0.5, 1]} to={[0.5, 0.5, 1.03]} fit="contain" box={[bx, by + (1 - sen) * 40, bw, bh]} o={sen} blend="multiply" />}
      {LABELS.map((w, i) => {
        const at = D.labels[i], [fx, fy] = SENGAI.spots[i];
        if (t < at) return null;
        const k = range(t, at, at + 0.18), s = lerp(1.8, 1, backOut(k, 2.6));
        const pe = eIn(range(t, D.peel + i * 0.1, D.peel + 0.6 + i * 0.1));
        const x = bx + fx * bw + pe * (120 + i * 60), y = by + fy * bh - pe * (520 + i * 80);
        return <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${s}) rotate(${(i - 1) * 6 + pe * (i % 2 ? 40 : -50)}deg)`, background: "#F7F1DE",
          padding: "10px 22px", fontFamily: SERIF, fontWeight: 900, fontSize: 46, color: CINNABAR, boxShadow: "0 8px 20px rgba(0,0,0,0.35)", border: `2px solid ${CINNABAR}`, opacity: Math.min(1, k * 4) * (1 - pe), whiteSpace: "nowrap" }}>{w}</div>;
      })}
      <Note t={t} at={D.sengai + 0.4} out={D.out} text="仙厓义梵《○△□》江户 · 出光美术馆" x={bx} y={by + bh + 40} color={PAPER} />
      <Decode t={t} at={D.decode} out={D.peel + 0.35} text="相：是你贴上去的标签。" x={130} y={980} size={44} />
      <Decode t={t} at={D.decode2} out={D.out} text="撕掉标签——东西还在，只是不再绑住你。" x={130} y={980} size={44} />
    </Layer>
  );
};

// ═══ the six likenesses: dream, illusion, bubble, shadow, dew, lightning — one tiny animation each
const SIX = ["梦", "幻", "泡", "影", "露", "电"];
const Cell: React.FC<{ i: number; t: number; at: number }> = ({ i, t, at }) => {
  const d = t - at, on = d > 0, k = eOut(range(t, at, at + 0.25));
  const cx = 110, cy = 110;
  let g: React.ReactNode = null;
  if (on) {
    if (i === 0) g = <>{[0, 1, 2, 3].map((j) => { const r = ((d * 70 + j * 30) % 120); return <circle key={j} cx={cx} cy={cy} r={r} fill="none" stroke={GOLD} strokeWidth={1.5} opacity={1 - r / 120} />; })}
      <path d={`M${cx - 26},${cy - 20} a32,32 0 1 0 ${46},${42} a26,26 0 1 1 ${-46},${-42}Z`} fill={GOLDL} transform={`translate(${Math.sin(d * 9) * 6} ${Math.cos(d * 7) * 4}) skewX(${Math.sin(d * 6) * 10})`} /></>;
    if (i === 1) { const rot = eInOut(range(d, 0.7, 1.2)) * 70; const V: [number, number][] = [[cx, cy - 62], [cx - 62, cy + 46], [cx + 62, cy + 46]];
      g = <>{V.map(([x, y], j) => { const toC = Math.atan2(cy + 10 - y, cx - x) * 180 / Math.PI + rot * (j % 2 ? 1 : -1); return <path key={j} d="M0,0 L20.8,-12 A24,24 0 1 0 20.8,12 Z" fill={GOLD} transform={`translate(${x} ${y}) rotate(${toC})`} />; })}
        <polygon points={V.map(([x, y]) => `${x},${y}`).join(" ")} fill={INDIGO} opacity={0.0} /></>; }
    if (i === 2) { const p = range(d, 0, 0.9), r = 14 + p * 30, y = cy + 70 - p * 120, pop = d > 0.9;
      g = !pop ? <><circle cx={cx} cy={y} r={r} fill="none" stroke={GOLDL} strokeWidth={2} /><circle cx={cx - r * 0.35} cy={y - r * 0.35} r={r * 0.18} fill={GOLDL} /></>
        : <>{Array.from({ length: 10 }, (_, j) => { const a = (j / 10) * Math.PI * 2, q = Math.min(1, (d - 0.9) / 0.4); return <circle key={j} cx={cx + Math.cos(a) * (44 + q * 40)} cy={cy - 50 + Math.sin(a) * (44 + q * 40)} r={3 * (1 - q)} fill={GOLDL} />; })}</>; }
    if (i === 3) { const a = -2.6 + range(d, 0, 1.6) * 2.2, lx = cx + Math.cos(a) * 90, ly = cy + 40 + Math.sin(a) * 90, px = cx, top = cy + 10, base = cy + 70;
      const sx = px + (px - lx) * 1.2, sy = base; g = <><circle cx={lx} cy={ly} r={9} fill={GOLDL} /><rect x={px - 6} y={top} width={12} height={base - top} fill={GOLD} /><polygon points={`${px - 6},${base} ${px + 6},${base} ${sx + 10},${sy} ${sx - 10},${sy}`} fill={GOLD} opacity={0.35} /><line x1={20} y1={base} x2={200} y2={base} stroke={GOLD} strokeWidth={1} opacity={0.5} /></>; }
    if (i === 4) { const s = 1 - range(d, 0.2, 1.4); g = <><path d={`M30,${cy + 60} Q${cx},${cy - 10} ${190},${cy + 10}`} stroke={GOLD} strokeWidth={2} fill="none" />
      {s > 0 && <path d={`M${cx + 20},${cy + 12} q${-12 * s},${22 * s} 0,${30 * s} q${12 * s},${-8 * s} 0,${-30 * s}Z`} fill={GOLDL} />}
      {[0, 1, 2].map((j) => { const q = range(d, 0.4 + j * 0.2, 1.4 + j * 0.2); return q > 0 && q < 1 ? <path key={j} d={`M${cx + 14 + j * 8},${cy - q * 70} c6,-8 -6,-14 0,-22`} stroke={GOLDL} strokeWidth={1.5} fill="none" opacity={1 - q} /> : null; })}</>; }
    if (i === 5) { const fl = (d > 0 && d < 0.12) || (d > 0.25 && d < 0.33); g = <>{fl && <rect x={0} y={0} width={220} height={220} fill={GOLDL} opacity={0.35} />}
      <polyline points={`${cx + 20},10 ${cx - 14},${cy - 6} ${cx + 12},${cy - 2} ${cx - 22},210`} fill="none" stroke={GOLDL} strokeWidth={fl ? 6 : 3} opacity={fl ? 1 : 0.5} style={{ filter: fl ? "drop-shadow(0 0 12px #F5E2A6)" : undefined }} /></>; }
  }
  return (
    <svg width={220} height={220} style={{ overflow: "visible" }}>
      <rect x={1} y={1} width={218} height={218} fill="rgba(5,11,28,0.6)" stroke={GOLD} strokeWidth={on ? 2 : 1} opacity={0.4 + 0.6 * k} />
      {g}
    </svg>
  );
};
export const Six: React.FC<{ t: number }> = ({ t }) => {
  const S = BJ.six;
  if (t < S.t - 0.2 || t >= S.out + 0.4) return null;
  const o = fade(t, S.t - 0.2, S.out + 0.4, 0.3, 0.5);
  const flash = t > S.items[5] && t < S.items[5] + 0.12 ? 0.22 : t > S.out - 0.1 && t < S.out + 0.25 ? 0.5 * (1 - range(t, S.out - 0.1, S.out + 0.25)) : 0;
  return (
    <Layer o={o}>
      <Say t={t} at={S.quote} out={S.out + 0.4} text="一切有为法，如梦幻泡影，如露亦如电，应作如是观。" x={960} y={140} size={52} anchor="center" gold stagger={0.025} />
      <Seal t={t} at={S.quote + 0.8} out={S.out + 0.4} text="金刚经" x={960} y={240} size={28} anchor="center" rot={0} />
      {SIX.map((c, i) => {
        const at = S.items[i], x = 960 + (i - 2.5) * 270;
        return <React.Fragment key={i}>
          <div style={{ position: "absolute", left: x - 110, top: 360, opacity: eOut(range(t, S.t + i * 0.05, S.t + 0.3 + i * 0.05)) }}><Cell i={i} t={t} at={at} /></div>
          <div style={{ position: "absolute", left: x, top: 680, transform: "translate(-50%, 0)", fontFamily: BRUSH, fontSize: 92, lineHeight: 1, ...(t > at ? GOLDFILL : { color: MUTE }), opacity: t > at ? 1 : 0.35 }}>{c}</div>
        </React.Fragment>;
      })}
      <Decode t={t} at={S.decode} out={S.out + 0.3} text="一切，都是暂时凑在一起的样子。" x={960} y={900} size={46} anchor="center" />
      {flash > 0 && <div style={{ position: "absolute", inset: 0, background: GOLDL, opacity: flash }} />}
    </Layer>
  );
};

// ═══ 应无所住而生其心: a goose crosses a still pond; its reflection comes and goes, the water keeps nothing
export const Abide: React.FC<{ t: number }> = ({ t }) => {
  const A = BJ.abide;
  if (t < A.t - 0.3 || t >= A.out + 0.6) return null;
  const o = fade(t, A.t - 0.3, A.out + 0.6, 0.4, 0.6);
  const PY = 610, gk = range(t, A.goose, A.goose + 2.3), gx = lerp(-120, 2040, gk), gy = 300 + Math.sin(gk * 3) * 20 + gk * 40;
  const flap = Math.sin(t * 13);
  const bird = (y: number, s: number) => `M${gx - 70},${y + 18 * flap * s} Q${gx - 34},${y - 30 * flap * s - 8 * s} ${gx},${y} Q${gx + 34},${y - 30 * flap * s - 8 * s} ${gx + 70},${y + 18 * flap * s}`;
  const ry = 2 * PY - gy;
  const white = eIn(range(t, A.out - 0.5, A.out + 0.4));
  return (
    <Layer o={o}>
      <Svg>
        <defs><linearGradient id="pond" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={AZURE} stopOpacity={0.35} /><stop offset="100%" stopColor={INDIGO2} stopOpacity={0.9} /></linearGradient></defs>
        <rect x={0} y={PY} width={1920} height={470} fill="url(#pond)" />
        <line x1={0} y1={PY} x2={1920} y2={PY} stroke={GOLD} strokeWidth={2} opacity={0.8} />
        {[[120, 0], [150, 1], [175, 2], [1740, 3], [1770, 4]].map(([x, j]) => <path key={j} d={`M${x},${PY} q${8 - j * 3},-${90 + j * 25} ${-10 + j * 6},-${170 + j * 30}`} stroke={GOLD} strokeWidth={2} fill="none" opacity={0.6} />)}
        <circle cx={1500} cy={170} r={44} fill={GOLDL} opacity={0.85} style={{ filter: "drop-shadow(0 0 30px rgba(245,226,166,0.6))" }} />
        <circle cx={1500} cy={2 * PY - 170} r={44} fill={GOLDL} opacity={0.25} />
        {gk > 0 && gk < 1 && <>
          <path d={bird(gy, 1)} stroke={PAPER} strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d={bird(ry, -1)} stroke={PAPER} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.35} transform={`translate(${Math.sin(t * 20) * 4} 0)`} />
        </>}
      </Svg>
      <VQuote t={t} at={A.quote} out={A.out + 0.3} cols={["应无所住", "而生其心"]} x={1860} y={110} size={74} src="金刚经" />
      <Note t={t} at={A.goose + 0.8} out={A.out} text="雁度寒潭，雁去而潭不留影。——《菜根谭》" x={130} y={170} color={PAPER} />
      <Decode t={t} at={A.decode} out={A.out + 0.3} text="心不粘在任何东西上——照样去爱，去做。" x={130} y={935} size={46} />
      <Say t={t} at={A.huineng} out={A.out + 0.3} text="相传，慧能听到这一句，当下大悟。" x={130} y={70} size={52} gold />
      {white > 0 && <div style={{ position: "absolute", inset: 0, background: PAPER, opacity: white }} />}
    </Layer>
  );
};
