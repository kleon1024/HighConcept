// 佛 · 第二支箭 — part 1: the two arrows (hook), the title, and the Buddha as a physician (苦集灭道 as a diagnosis).
import React from "react";
import { Arrow, Art, BJ, Big, CINNABAR, Decode, GOLD, GOLDFILL, GOLDL, INDIGO, Layer, MUTE, Note, PAPER, SERIF, Say, Seal, Svg, VQuote, backOut, eIn, eInOut, eOut, fade, lerp, range, rnd } from "./kit";

export const TGT: [number, number] = [760, 610];

// the target: a gold ring around 「你」 — hit once (pain), hit twice (suffering)
export const Target: React.FC<{ t: number; hits: { at: number; c: string; big?: boolean }[]; o?: number; r?: number; cx?: number; cy?: number }> = ({ t, hits, o = 1, r = 74, cx = TGT[0], cy = TGT[1] }) => {
  const shake = hits.reduce((s, h) => s + (t > h.at && t < h.at + 0.4 ? Math.sin((t - h.at) * 90) * (h.big ? 9 : 5) * (1 - (t - h.at) / 0.4) : 0), 0);
  const red = hits.filter((h) => h.big && t > h.at).length ? eOut(range(t, hits.find((h) => h.big)!.at, hits.find((h) => h.big)!.at + 0.3)) : 0;
  return (
    <g opacity={o} transform={`translate(${shake} 0)`}>
      <circle cx={cx} cy={cy} r={r * 2.2} fill="url(#tgtglow)" opacity={0.55} />
      <circle cx={cx} cy={cy} r={r} fill={INDIGO} stroke={red > 0 ? CINNABAR : GOLD} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={r - 12} fill="none" stroke={GOLD} strokeWidth={1} opacity={0.5} />
      {red > 0 && [0, 1, 2, 3].map((i) => { const a = -0.6 + i * 0.5 + rnd(i) * 0.3; return <path key={i} d={`M${cx + 30},${cy} l${Math.cos(a) * 30 * red},${Math.sin(a) * 30 * red} l${Math.cos(a + 0.4) * 22 * red},${Math.sin(a + 0.4) * 22 * red}`} stroke={CINNABAR} strokeWidth={2} fill="none" />; })}
      {hits.map((h, i) => {
        const d = t - h.at;
        return d > 0 && d < 1.2 ? [0, 0.18].map((dl, j) => { const dd = d - dl; return dd > 0 ? <circle key={`${i}${j}`} cx={cx} cy={cy} r={r + dd * (h.big ? 620 : 420)} fill="none" stroke={h.c} strokeWidth={h.big ? 3 : 2} opacity={(1 - dd / 1.2) * 0.9} /> : null; }) : null;
      })}
    </g>
  );
};
export const Defs = () => (
  <defs>
    <radialGradient id="tgtglow"><stop offset="0%" stopColor={GOLD} stopOpacity={0.35} /><stop offset="100%" stopColor={GOLD} stopOpacity={0} /></radialGradient>
  </defs>
);

// the anxious thoughts that become the second arrow
export const THOUGHTS: [string, number, number, number][] = [["为什么是我", 1180, 330, 50], ["完了", 1360, 540, 58], ["凭什么", 1120, 790, 46], ["都怪他", 1500, 720, 44], ["要是没有……", 1490, 400, 40], ["我不行", 1270, 930, 40]];
export const LAUNCH: [number, number] = [1760, 230];

// ═══ hook: the first arrow is pain; the second, you shoot yourself
export const Hook: React.FC<{ t: number }> = ({ t }) => {
  const H = BJ.hook;
  if (t >= H.out + 0.6) return null;
  const o = 1 - eIn(range(t, H.out - 0.2, H.out + 0.5));
  return (
    <Layer o={1}>
      <Svg>
        <Defs />
        <Target t={t} hits={[{ at: H.hit1, c: GOLD }, { at: H.hit2, c: CINNABAR, big: true }]} o={1} r={74 + 226 * eInOut(range(t, H.out - 0.3, H.out + 0.4))} />
        <Arrow t={t} t0={-0.2} t1={H.hit1} p0={[-300, 330]} p1={[TGT[0] - 72, TGT[1]]} o={o} />
        <Arrow t={t} t0={H.form + 0.1} t1={H.hit2} p0={LAUNCH} p1={[TGT[0] + 70, TGT[1] - 6]} color={CINNABAR} bend={-60} o={o} />
      </Svg>
      <Layer o={o}>
        <div style={{ position: "absolute", left: TGT[0], top: TGT[1], transform: "translate(-50%, -50%)", fontFamily: SERIF, fontWeight: 900, fontSize: 52, color: PAPER }}>你</div>
        {/* the thoughts swarm, shake, and rush to the launch point */}
        {THOUGHTS.map(([w, x, y, s], i) => {
          const a = H.swarm + i * 0.13, k = eOut(range(t, a, a + 0.3)), g = eIn(range(t, H.form - 0.1 + i * 0.03, H.form + 0.2 + i * 0.03));
          if (t < a || g >= 1) return null;
          const jx = Math.sin(t * 37 + i * 3) * 4, jy = Math.cos(t * 41 + i) * 3;
          return <div key={i} style={{ position: "absolute", left: lerp(x, LAUNCH[0], g) + jx, top: lerp(y, LAUNCH[1], g) + jy, transform: `translate(-50%, -50%) scale(${lerp(1, 0.2, g)})`,
            fontFamily: SERIF, fontWeight: 900, fontSize: s, color: CINNABAR, opacity: k * (1 - g * 0.6), whiteSpace: "nowrap", textShadow: "0 0 18px rgba(201,68,46,0.45)" }}>{w}</div>;
        })}
        <Say t={t} at={H.t1} out={H.out} text="第一支箭：痛。" x={130} y={110} size={84} gold />
        <Seal t={t} at={H.t1 + 0.5} out={H.out} text="身受" x={760} y={128} size={30} anchor="left" />
        <Say t={t} at={H.t2} out={H.out} text="第二支箭：" x={130} y={240} size={84} color={CINNABAR} />
        <Say t={t} at={H.t2 + 0.35} out={H.out} text="是你自己射的。" x={130} y={350} size={84} />
        <Seal t={t} at={H.t2 + 0.9} out={H.out} text="心受" x={760} y={258} size={30} anchor="left" />
        <VQuote t={t} at={H.quote} out={H.out} cols={["譬如士夫被一毒箭", "不被第二毒箭"]} x={1820} y={110} size={62} src="杂阿含经" />
        <Decode t={t} at={H.decode} out={H.out} text="痛，躲不开；苦，是你自己加上去的。" x={130} y={900} size={46} />
      </Layer>
    </Layer>
  );
};

// ═══ title: 佛 = the awakened one; Liang Kai's Shakyamuni coming down from the mountains
export const ENSO: [number, number, number] = [640, 520, 300];
export const Title: React.FC<{ t: number }> = ({ t }) => {
  const T = BJ.title;
  if (t < T.t - 0.4 || t >= T.out + 0.4) return null;
  const o = fade(t, T.t - 0.3, T.out + 0.4, 0.4, 0.5);
  const slide = eInOut(range(t, T.out - 0.2, T.out + 0.4));
  return (
    <Layer o={o}>
      <Art src="bd_shakyamuni.jpg" t={t} a={T.t - 0.4} b={T.out + 0.4} from={[0.5, 0.32, 1.08]} to={[0.5, 0.36, 1.16]} box={[1230 + slide * 700, 0, 600, 1080]}
        filter="sepia(0.45) saturate(0.8) brightness(0.9) contrast(1.06)" />
      <div style={{ position: "absolute", left: 1230 + slide * 700, top: 0, width: 220, height: 1080, background: `linear-gradient(90deg, ${INDIGO}, rgba(13,24,53,0))` }} />
      <Svg>
        <circle cx={ENSO[0]} cy={ENSO[1]} r={ENSO[2]} fill="none" stroke={GOLD} strokeWidth={9} strokeLinecap="round" strokeDasharray={`${1885 * 0.93} 9999`} transform={`rotate(-70 ${ENSO[0]} ${ENSO[1]})`} opacity={0.85} />
      </Svg>
      <Big t={t} at={T.t + 0.05} out={T.out + 0.4} ch="佛" x={ENSO[0]} y={ENSO[1] - 10} size={400} />
      <Say t={t} at={T.sub} out={T.out + 0.4} text="Buddha · 觉醒的人" x={ENSO[0]} y={880} size={46} anchor="center" color={GOLDL} stagger={0.03} />
      <Seal t={t} at={T.seal} out={T.out + 0.4} text="觉者" x={ENSO[0] + 290} y={250} size={34} vertical anchor="left" rot={4} />
      <Note t={t} at={T.t + 0.3} out={T.out + 0.2} text="梁楷《出山释迦图》南宋 · 东京国立博物馆" x={1840} y={1015} anchor="right" color={PAPER} />
    </Layer>
  );
};

// ═══ the physician: 苦集灭道 is a diagnosis — the illness, its cause, that it can be cured, the prescription
const ROWS: [string, string, string][] = [["苦", "病", "人生，总有不满足"], ["集", "病因", "渴爱，与执着"], ["灭", "能治", "涅槃：火，吹灭了"], ["道", "药方", "八正道"]];
const EIGHT = ["生", "老", "病", "死", "爱别离", "怨憎会", "求不得", "五阴炽盛"];
export const Doctor: React.FC<{ t: number }> = ({ t }) => {
  const D = BJ.doctor;
  if (t < D.t - 0.2 || t >= D.out + 0.5) return null;
  const o = 1 - eIn(range(t, D.out - 0.1, D.out + 0.5));
  const zoom = eInOut(range(t, D.zoom, D.zoom + 0.7));
  const rowY = (i: number) => 170 + i * 180;
  const fl = t - D.blow;
  return (
    <Layer o={o}>
      <VQuote t={t} at={D.head} out={D.zoom + 0.3} cols={["如来为大医王"]} x={1830} y={150} size={66} src="杂阿含经" />
      {ROWS.map(([c, tag, txt], i) => {
        const at = D.rows[i], ro = 1 - eIn(range(t, D.zoom - 0.1, D.zoom + 0.35)) * (i === 0 ? 0 : 1);
        if (t < at) return null;
        const line = eOut(range(t, at + 0.1, at + 0.8));
        const isKu = i === 0;
        const kx = isKu ? lerp(230, 960, zoom) : 230, ky = isKu ? lerp(rowY(i) + 70, 470, zoom) : rowY(i) + 70, ks = isKu ? lerp(140, 300, zoom) : 140;
        return (
          <React.Fragment key={i}>
            <Big t={t} at={at} out={D.out + 0.5} ch={c} x={kx} y={ky} size={ks} o={isKu ? 1 : ro} />
            <Layer o={isKu ? 1 - zoom : ro}>
              <Seal t={t} at={at + 0.15} out={D.out} text={tag} x={350} y={rowY(i) + 46} size={30} anchor="left" />
              <Say t={t} at={at + 0.25} out={D.out} text={txt} x={500} y={rowY(i) + 36} size={54} stagger={0.03} />
              <Svg><line x1={150} y1={rowY(i) + 150} x2={150 + 1180 * line} y2={rowY(i) + 150} stroke={GOLD} strokeWidth={1} opacity={0.45} /></Svg>
            </Layer>
          </React.Fragment>
        );
      })}
      {/* the flame beside 涅槃, blown out */}
      {t > D.rows[2] + 0.3 && t < D.zoom + 0.3 && (() => {
        const x = 1080, y = rowY(2) + 70, h = fl < 0 ? 1 : Math.max(0, 1 - fl / 0.35), lean = fl > 0 ? Math.min(1, fl / 0.2) * 18 : Math.sin(t * 13) * 2;
        return <Svg>
          {h > 0 && <path d={`M${x},${y + 30} C${x - 22},${y + 6} ${x - 10 + lean},${y - 30 * h} ${x + lean},${y - 62 * h} C${x + 10 + lean},${y - 30 * h} ${x + 22},${y + 6} ${x},${y + 30} Z`} fill={GOLD} opacity={0.95} style={{ filter: "drop-shadow(0 0 14px rgba(245,200,110,0.9))" }} />}
          <rect x={x - 5} y={y + 30} width={10} height={44} fill={PAPER} opacity={0.75} />
          {fl > 0 && fl < 1.6 && <path d={`M${x},${y + 20} c${12},${-30} ${-14},${-50} ${4},${-90 * Math.min(1, fl / 0.8)}`} stroke={MUTE} strokeWidth={2} fill="none" opacity={0.7 * (1 - fl / 1.6)} />}
        </Svg>;
      })()}
      <Decode t={t} at={D.decode} out={D.zoom + 0.2} text="佛陀开出的不是信仰，是一张诊断书。" x={150} y={925} size={46} />
      {/* zoom into 苦: the eight sufferings */}
      {EIGHT.map((w, i) => {
        const at = D.eight + i * 0.11, k = backOut(range(t, at, at + 0.3), 1.6);
        if (t < at) return null;
        const a = -Math.PI / 2 + (i / 8) * Math.PI * 2, x = 960 + Math.cos(a) * 400, y = 470 + Math.sin(a) * 300;
        const out = eIn(range(t, D.out - 0.3, D.out + 0.2)), cx = lerp(x, 960, out), cy = lerp(y, 470, out);
        return <div key={i} style={{ position: "absolute", left: cx, top: cy, transform: `translate(-50%, -50%) rotateX(${(1 - k) * 90}deg) scale(${1 - out * 0.7})`, border: `1.5px solid ${GOLD}`,
          background: "rgba(5,11,28,0.85)", padding: "10px 18px", whiteSpace: "nowrap", opacity: Math.min(1, k * 1.5) * (1 - out), boxShadow: "0 0 24px rgba(221,184,98,0.18)" }}>
          <span style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 40, ...GOLDFILL }}>{w}</span></div>;
      })}
      <Decode t={t} at={D.bitter} out={D.out} text="苦 ≠ 疼。苦 = 什么都抓不住。" x={960} y={900} size={50} anchor="center" />
    </Layer>
  );
};
