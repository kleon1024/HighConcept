// NIHIL · 虚无 — the scenes. Black ground, white type and hairlines; one gold appears only when a value is made.
import React from "react";
import { Img, staticFile } from "remotion";
import { BG, DIM, Dust, GOLD, GROT, LATIN, Line, NJ, Note, SANS, SERIF, WH, backOut, clamp01, eIn, eInOut, eOut, lerp, range, rnd, win } from "./Glyph";

const Svg: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, ...style }}>{children}</svg>;
const Layer: React.FC<React.PropsWithChildren<{ o?: number; style?: React.CSSProperties }>> = ({ o = 1, style, children }) => <div style={{ position: "absolute", inset: 0, opacity: o, ...style }}>{children}</div>;

// ═══ the opening: a word that holds everything up — it cracks and blows away
export const Hook: React.FC<{ t: number }> = ({ t }) => {
  const H = NJ.hook;
  if (t >= H.out + 0.1) return null;
  const crack = eOut(range(t, H.crack, H.crack + 0.3));
  const shake = t > H.crack && t < H.dust ? Math.sin(t * 80) * 3 : 0;
  const ring = eInOut(range(t, H.title, H.title + 0.7));
  return (
    <Layer o={1 - eIn(range(t, H.out - 0.2, H.out + 0.1))}>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${shake}px)` }}>
        <Dust t={t} id="yiyi" text="意义" size={300} cx={960} cy={470} t0={H.dust} mode="out" spread={0.6} dur={1.4} />
      </div>
      {t < H.dust + 0.2 && <Svg><path d="M790,330 L880,420 L860,470 L960,520 L940,560 L1060,640 L1130,610" fill="none" stroke={BG} strokeWidth={9}
        strokeDasharray={`${700 * crack} 999`} opacity={1 - range(t, H.dust, H.dust + 0.2)} /></Svg>}
      <Line t={t} at={H.q1} out={H.title} text="如果，一切都没有意义——" x={960} y={740} size={54} anchor="center" />
      <Line t={t} at={H.q2} out={H.title} text="你还会起床吗？" x={960} y={830} size={76} anchor="center" stagger={0.05} />
      {t >= H.title && <>
        <Svg><circle cx={960} cy={470} r={300} fill="none" stroke={WH} strokeWidth={2} strokeDasharray={`${1885 * ring} 9999`} transform="rotate(-90 960 470)" /></Svg>
        <div style={{ position: "absolute", left: 960, top: 470, transform: `translate(-50%, -50%) scale(${1 + 0.06 * Math.exp(-(t - H.title) / 0.15)})`, fontFamily: LATIN, fontWeight: 700, fontSize: 210, letterSpacing: 40, color: WH, paddingLeft: 40 }}>NIHIL</div>
        <Line t={t} at={H.title + 0.15} out={H.out + 0.2} text="虚 无" x={960} y={640} size={56} anchor="center" stagger={0.1} />
        <Note t={t} at={H.latin} out={H.out + 0.2} text="nihil · 拉丁语：什么都没有" x={960} y={740} anchor="center" />
      </>}
    </Layer>
  );
};

// ═══ where the word comes from: a hairline timeline, four dates; Nietzsche's face out of the dark
const DATES: [number, string, string, string][] = [
  [250, "1799", "雅各比", "把「虚无主义」\n带进哲学论战"], [560, "1862", "屠格涅夫《父与子》", "虚无主义者：\n不向任何权威低头"],
  [870, "1880", "陀思妥耶夫斯基", "「没有上帝，\n就什么都可以」（大意）"], [1180, "1882", "尼采", "……"],
];
export const Lineage: React.FC<{ t: number }> = ({ t }) => {
  const L = NJ.line;
  if (t < L.t - 0.1 || t > NJ.god.t + 1.6) return null;
  const draw = eInOut(range(t, L.t, L.t + 0.6)), o = 1 - eIn(range(t, L.out - 0.2, L.out + 0.2));
  const face = win(t, L.y1882, NJ.god.t + 0.7, 0.6, 0.6);
  return (
    <>
      <Layer o={face}>
        <div style={{ position: "absolute", right: 0, top: 0, width: 640, height: 1080, overflow: "hidden" }}>
          <Img src={staticFile("media/me_nietzsche.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 22%", filter: "grayscale(1) contrast(1.6) brightness(0.85)",
            transform: `scale(${1.05 + 0.08 * range(t, L.y1882, NJ.god.t + 0.7)})` }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${BG} 0%, rgba(5,5,5,0) 45%), linear-gradient(0deg, ${BG} 0%, rgba(5,5,5,0) 35%)` }} />
        </div>
      </Layer>
      <Layer o={o}>
        <Svg><line x1={100} y1={600} x2={100 + 1220 * draw} y2={600} stroke={WH} strokeWidth={1.5} opacity={0.7} /></Svg>
        {DATES.map(([x, y, who, what], i) => {
          const at = [L.y1799, L.y1862, L.y1880, L.y1882][i], k = eOut(range(t, at, at + 0.4));
          if (t < at) return null;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: 470, transform: "translateX(-50%)", opacity: k, textAlign: "center", width: 300 }}>
              <div style={{ fontFamily: GROT, fontWeight: 700, fontSize: 64, color: WH, transform: `translateY(${(1 - k) * 20}px)` }}>{y}</div>
              <div style={{ position: "absolute", left: 150, top: 125, width: 9, height: 9, borderRadius: 5, background: WH, transform: "translateX(-50%)" }} />
              <div style={{ marginTop: 50, fontFamily: SERIF, fontWeight: 900, fontSize: 32, color: WH }}>{who}</div>
              <div style={{ marginTop: 10, fontFamily: SANS, fontWeight: 700, fontSize: 24, color: DIM, whiteSpace: "pre-line", lineHeight: 1.45 }}>{what}</div>
            </div>
          );
        })}
      </Layer>
    </>
  );
};

// ═══ God is dead: the mobile of values hangs on one thread; the thread snaps; everything falls, in all directions
const MOBILE: [string, number, number, number][] = [
  ["上帝", 960, 250, 70], ["真理", 760, 400, 52], ["善", 960, 420, 52], ["美", 1160, 400, 52], ["道德", 700, 560, 44], ["目的", 900, 590, 44], ["意义", 1100, 590, 44], ["永恒", 1260, 560, 44],
  ["灵魂", 620, 700, 34], ["天堂", 820, 720, 34], ["理性", 1020, 720, 34], ["进步", 1220, 700, 34], ["秩序", 1360, 650, 34], ["历史", 560, 640, 34],
];
export const God: React.FC<{ t: number }> = ({ t }) => {
  const G = NJ.god;
  if (t < G.t || t >= G.out + 0.1) return null;
  const hang = eOut(range(t, G.hang, G.hang + 0.6)), fallT = Math.max(0, t - G.fall);
  const roll = 180 * eInOut(range(t, G.flip, G.flip + 0.9));
  const o = 1 - eIn(range(t, G.out - 0.25, G.out + 0.1));
  const sway = Math.sin(t * 2.2) * 2 * (t < G.snap ? 1 : 0);
  return (
    <Layer o={o}>
      <div style={{ position: "absolute", inset: 0, transform: `rotate(${roll}deg)` }}>
        <Svg>
          {/* threads */}
          {t < G.snap + 0.05 && <g opacity={hang} transform={`rotate(${sway} 960 0)`}>
            <line x1={960} y1={0} x2={960} y2={205} stroke={WH} strokeWidth={1.5} />
            <line x1={760} y1={330} x2={1160} y2={330} stroke={WH} strokeWidth={1.5} /><line x1={960} y1={290} x2={960} y2={330} stroke={WH} strokeWidth={1.5} />
            {[760, 960, 1160].map((x) => <line key={x} x1={x} y1={330} x2={x} y2={365} stroke={WH} strokeWidth={1} />)}
            <line x1={700} y1={480} x2={1260} y2={480} stroke={WH} strokeWidth={1.2} /><line x1={960} y1={455} x2={960} y2={480} stroke={WH} strokeWidth={1.2} />
            {[700, 900, 1100, 1260].map((x) => <line key={x} x1={x} y1={480} x2={x} y2={525} stroke={WH} strokeWidth={1} />)}
          </g>}
          {t >= G.snap && t < G.snap + 0.25 && <circle cx={960} cy={60} r={30 * range(t, G.snap, G.snap + 0.25)} fill="none" stroke={WH} strokeWidth={2} opacity={1 - range(t, G.snap, G.snap + 0.25)} />}
        </Svg>
        {MOBILE.map(([w, x, y, s], i) => {
          // after the snap: away from the centre in all directions, shrinking into the depth, turning
          const a = (i / MOBILE.length) * Math.PI * 2 + 0.4 + rnd(i) * 0.5, sp = 90 + rnd(i + 3) * 140;
          const depth = 1 / (1 + fallT * (0.18 + rnd(i + 5) * 0.3));
          const fx = x + (x - 960) * (1 / depth - 1) * 0.15 + Math.cos(a) * sp * fallT * depth * 1.4;
          const fy = y + Math.sin(a) * sp * fallT * depth * 1.4 + 120 * fallT * depth;
          const rot = fallT * (rnd(i + 9) - 0.5) * 240;
          return (
            <div key={w} style={{ position: "absolute", left: fx, top: fy, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${depth})`, fontFamily: SERIF, fontWeight: 900, fontSize: s,
              color: WH, opacity: (i < 8 ? hang : eOut(range(t, G.snap, G.snap + 0.5)) * 0.8) * (fallT > 0 ? 0.35 + 0.65 * depth : 1), whiteSpace: "nowrap", textShadow: "0 0 24px rgba(238,234,224,0.25)" }}>{w}</div>
          );
        })}
        <Line t={t} at={G.q} out={G.out} text="我们不是一直在坠落吗？" x={120} y={760} size={54} />
        <Line t={t} at={G.q + 1.0} out={G.out} text="向后，向旁边，向前——向所有方向。" x={120} y={850} size={44} color={DIM} stagger={0.03} />
      </div>
      <Line t={t} at={G.dead} out={G.q} text="上帝死了。" x={120} y={760} size={110} stagger={0.08} />
      <Line t={t} at={G.dead + 0.5} out={G.q} text="Gott ist tot. — 尼采《快乐的科学》1882" x={124} y={900} size={30} color={DIM} font={LATIN} weight={600} italic stagger={0.01} />
      <Line t={t} at={G.flip + 0.6} out={G.out} text="还有上和下吗？" x={960} y={470} size={72} anchor="center" stagger={0.06} />
    </Layer>
  );
};

// ═══ two nihilisms: the passive one deflates; the active one taps an idol with a hammer, hears it is hollow, and breaks it
export const Two: React.FC<{ t: number }> = ({ t }) => {
  const T = NJ.two;
  if (t < T.t || t >= T.out + 0.1) return null;
  const o = 1 - eIn(range(t, T.out - 0.25, T.out + 0.1));
  const deflate = eInOut(range(t, T.passive, T.out - 0.5));
  const smash = range(t, T.smash, T.smash + 1.4);
  // the hammer swings back and strikes on each tap and on the smash
  const hits = [...T.tap, T.smash];
  let swing = 0;
  for (const h of hits) { const d = t - h; if (d > -0.25 && d < 0.2) swing = d < 0 ? eIn((d + 0.25) / 0.25) : 1 - eOut(d / 0.2); }
  const ix = 1380, iy = 560;
  return (
    <Layer o={o}>
      <Svg>
        <line x1={960} y1={120} x2={960} y2={980} stroke={WH} strokeWidth={1} opacity={0.4 * eOut(range(t, T.split, T.split + 0.5))} />
        {/* passive: a circle that slowly loses its shape and its light */}
        <ellipse cx={480} cy={540 + 90 * deflate} rx={170 + 40 * deflate} ry={170 * (1 - 0.82 * deflate)} fill="none" stroke={WH} strokeWidth={3} opacity={(1 - 0.75 * deflate) * eOut(range(t, T.passive, T.passive + 0.4))} />
        {/* active: an idol, a hammer, the hollow ring of each tap, and then shards */}
        {smash <= 0 ? (
          <g opacity={eOut(range(t, T.active - 0.2, T.active + 0.3))}>
            <circle cx={ix} cy={iy - 230} r={52} fill="none" stroke={WH} strokeWidth={3} />
            <rect x={ix - 60} y={iy - 170} width={120} height={300} fill="none" stroke={WH} strokeWidth={3} />
            <rect x={ix - 100} y={iy + 130} width={200} height={40} fill="none" stroke={WH} strokeWidth={3} />
            {T.tap.map((h, i) => { const d = t - h; return d > 0 && d < 0.8 ? <circle key={i} cx={ix} cy={iy} r={60 + d * 380} fill="none" stroke={WH} strokeWidth={2} opacity={1 - d / 0.8} /> : null; })}
          </g>
        ) : (
          Array.from({ length: 22 }, (_, i) => {
            const a = rnd(i) * Math.PI * 2, d = eOut(smash) * (200 + rnd(i + 4) * 500), g = eIn(smash) * 300;
            const x = ix + (rnd(i + 2) - 0.5) * 200 + Math.cos(a) * d, y = iy + (rnd(i + 6) - 0.5) * 300 + Math.sin(a) * d + g;
            const s = 20 + rnd(i + 8) * 40;
            return <polygon key={i} points={`${x},${y - s} ${x + s * 0.8},${y + s * 0.5} ${x - s * 0.7},${y + s * 0.6}`} fill="none" stroke={WH} strokeWidth={2.5} opacity={1 - smash} transform={`rotate(${smash * 300 * (rnd(i + 1) - 0.5)} ${x} ${y})`} />;
          })
        )}
        <g transform={`translate(${ix + 330} ${iy - 40}) rotate(${-40 + 55 * swing})`} opacity={eOut(range(t, T.active, T.active + 0.3)) * (1 - range(t, T.smash + 0.4, T.smash + 0.8))}>
          <line x1={0} y1={0} x2={-150} y2={0} stroke={WH} strokeWidth={6} strokeLinecap="round" />
          <rect x={-200} y={-34} width={70} height={68} fill={WH} />
        </g>
      </Svg>
      <Note t={t} at={T.split} out={T.out + 0.1} text="消极的虚无主义" x={480} y={150} anchor="center" size={28} color={WH} />
      <Note t={t} at={T.split + 0.2} out={T.out + 0.1} text="积极的虚无主义" x={1440} y={150} anchor="center" size={28} color={WH} />
      <Line t={t} at={T.passive + 0.3} out={T.out} text="既然没有意义——那就算了。" x={480} y={800} size={40} anchor="center" stagger={0.025} />
      <Line t={t} at={T.passive + 0.9} out={T.out} text="疲惫，退缩，什么都不想要" x={480} y={870} size={28} color={DIM} anchor="center" font={SANS} weight={700} stagger={0.015} />
      {T.tap.map((h, i) => <Line key={i} t={t} at={h + 0.05} out={T.smash} text="空的。" x={1380 + (i - 1) * 140} y={250 + i * 20} size={30} color={DIM} anchor="center" stagger={0.05} />)}
      <Line t={t} at={T.active + 0.2} out={T.out} text="用锤子做哲学：" x={1440} y={780} size={40} anchor="center" />
      <Line t={t} at={T.active + 0.6} out={T.out} text="敲一敲偶像，听它是不是空心的" x={1440} y={845} size={30} color={DIM} anchor="center" font={SANS} weight={700} stagger={0.015} />
      <Line t={t} at={T.rebuild} out={T.out} text="先拆掉，才能重建。" x={1440} y={920} size={46} color={WH} anchor="center" stagger={0.05} />
      <Note t={t} at={T.smash + 0.2} out={T.out} text="《偶像的黄昏，或怎样用锤子做哲学》1888" x={1440} y={210} anchor="center" />
    </Layer>
  );
};

// ═══ the abyss: a mouth of faint light; an eye opens inside it; then Friedrich's monk before the empty sea
export const Abyss: React.FC<{ t: number }> = ({ t }) => {
  const A = NJ.abyss;
  if (t < A.t || t >= A.out + 0.15) return null;
  const ring = eInOut(range(t, A.ring, A.ring + 0.8)), eye = eInOut(range(t, A.eye, A.eye + 0.5));
  const monk = eInOut(range(t, A.monk - 0.2, A.monk + 0.5)), out = 1 - eIn(range(t, A.out - 0.4, A.out + 0.15));
  const look = Math.sin((t - A.eye) * 1.5) * 12;
  return (
    <Layer o={out}>
      <Layer o={1 - monk}>
        <Svg>
          <defs><radialGradient id="abyss"><stop offset="0.72" stopColor="#000" /><stop offset="0.86" stopColor="#3A372F" stopOpacity={0.9} /><stop offset="1" stopColor="#000" stopOpacity={0} /></radialGradient></defs>
          <circle cx={960} cy={500} r={420 * ring} fill="url(#abyss)" />
          {Array.from({ length: 60 }, (_, i) => { const a = rnd(i) * Math.PI * 2, r = (1 - ((t * 0.25 + rnd(i + 2)) % 1)) * 520 * ring; return <circle key={i} cx={960 + Math.cos(a) * r} cy={500 + Math.sin(a) * r} r={1.4} fill={WH} opacity={0.5 * (r / 520)} />; })}
          {eye > 0 && <g transform="translate(960 500)">
            <path d={`M-220,0 Q0,${-150 * eye} 220,0 Q0,${150 * eye} -220,0 Z`} fill="#0D0C0A" stroke={WH} strokeWidth={2.5} />
            <circle cx={look} cy={0} r={72 * eye} fill="none" stroke={WH} strokeWidth={2} />
            <circle cx={look} cy={0} r={34 * eye} fill={WH} opacity={0.9} />
            <circle cx={look - 12} cy={-14} r={9 * eye} fill={BG} />
          </g>}
        </Svg>
        <Line t={t} at={A.l1} out={A.monk} text="当你凝视深渊，" x={960} y={800} size={60} anchor="center" stagger={0.06} />
        <Line t={t} at={A.l2} out={A.monk} text="深渊也在凝视你。" x={960} y={890} size={60} anchor="center" stagger={0.06} />
      </Layer>
      {monk > 0 && <Layer o={monk}>
        <Img src={staticFile("media/nh_monk.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.25) brightness(0.8)",
          transform: `scale(${1.03 + 0.06 * range(t, A.monk, A.out)})` }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)" }} />
        <Note t={t} at={A.monk + 0.3} out={A.out + 0.2} text="弗里德里希《海边的僧侣》1810" x={80} y={980} color={WH} />
      </Layer>}
    </Layer>
  );
};

// ═══ the heaviest weight: a life as a line from 生 to 死; it curls into a ring and begins again, again, again
const MOMENTS = ["第一声哭", "初恋", "某个黄昏", "争吵", "失去", "拥抱", "一次失败", "此刻"];
export const Loop: React.FC<{ t: number }> = ({ t }) => {
  const Lp = NJ.loop;
  if (t < Lp.t - 0.2 || t >= Lp.out + 0.1) return null;
  const draw = eInOut(range(t, Lp.t - 0.2, Lp.line + 0.4)), curl = eInOut(range(t, Lp.curl, Lp.curl + 0.8));
  const spin = t > Lp.again ? Math.pow(t - Lp.again, 1.7) * 0.9 * (t > Lp.divine ? lerp(1, 0.35, range(t, Lp.divine, Lp.out)) : 1) : 0;
  const rings = t > Lp.again ? Math.min(14, Math.floor((t - Lp.again) * 3) + 1) : 1;
  const warm = range(t, Lp.divine, Lp.out);
  const col = warm > 0 ? `rgb(${238},${Math.round(234 - 51 * warm)},${Math.round(224 - 150 * warm)})` : WH;
  const curse = t > Lp.curse && t < Lp.divine ? (Math.floor(t * 12) % 2 === 0 ? 1 : 0) * 0.08 : 0;
  const R = 260, cx = 960, cy = 600;
  // a point along the life: straight line (curl 0) → circle (curl 1)
  const P = (u: number): [number, number] => {
    const lx = lerp(260, 1660, u), ly = 560;
    const a = -Math.PI / 2 + u * Math.PI * 2 + spin;
    return [lerp(lx, cx + R * Math.cos(a), curl), lerp(ly, cy + R * Math.sin(a), curl)];
  };
  const path = Array.from({ length: 121 }, (_, i) => P((i / 120) * draw)).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [bx, by] = P(0), [ex, ey] = P(draw);
  return (
    <Layer o={1 - eIn(range(t, Lp.out - 0.3, Lp.out + 0.1))}>
      {curse > 0 && <div style={{ position: "absolute", inset: 0, background: WH, opacity: curse }} />}
      <Svg>
        {Array.from({ length: rings - 1 }, (_, k) => <circle key={k} cx={cx} cy={cy} r={R - (k + 1) * 12} fill="none" stroke={col} strokeWidth={1.2} opacity={0.5 - k * 0.03} strokeDasharray={`${4 + k} ${10 + k * 2}`}
          transform={`rotate(${spin * 57 * (k % 2 ? -1 : 1) * (1 + k * 0.1)} ${cx} ${cy})`} />)}
        <path d={path} fill="none" stroke={col} strokeWidth={3} />
        {MOMENTS.map((m, i) => { const u = (i + 0.5) / MOMENTS.length; if (u > draw) return null; const [x, y] = P(u); return <circle key={m} cx={x} cy={y} r={6} fill={col} />; })}
        {/* the spider and the moonlight */}
        {t > Lp.spider && (() => { const k = eOut(range(t, Lp.spider, Lp.spider + 0.4)); const [mx, my] = P(0.66), [sx, sy] = P(0.3); return (
          <g opacity={k}>
            <path d={`M${mx + 22},${my - 40} a22,22 0 1 1 0.1,0 a16,16 0 1 0 -0.1,0 Z`} fill={col} transform={`translate(${-10} ${-20})`} />
            <g transform={`translate(${sx} ${sy - 46})`}><circle r={6} fill={col} />{Array.from({ length: 8 }, (_, j) => <line key={j} x1={0} y1={0} x2={16 * Math.cos(j * 0.785 + 0.4)} y2={16 * Math.sin(j * 0.785 + 0.4)} stroke={col} strokeWidth={1.5} />)}<line x1={0} y1={-6} x2={0} y2={-60} stroke={col} strokeWidth={1} /></g>
          </g>); })()}
      </Svg>
      {curl < 0.5 && MOMENTS.map((m, i) => { const u = (i + 0.5) / MOMENTS.length; if (u > draw) return null; const [x, y] = P(u); return <div key={m} style={{ position: "absolute", left: x, top: y + 18, transform: "translateX(-50%)", fontFamily: SANS, fontWeight: 700, fontSize: 22, color: DIM, opacity: 1 - curl * 2 }}>{m}</div>; })}
      {curl < 0.6 && <>
        <div style={{ position: "absolute", left: bx, top: by - 70, transform: "translateX(-50%)", fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: WH, opacity: (1 - curl * 1.6) * draw }}>生</div>
        {draw > 0.98 && <div style={{ position: "absolute", left: ex, top: ey - 70, transform: "translateX(-50%)", fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: WH, opacity: 1 - curl * 1.6 }}>死</div>}
      </>}
      {t > Lp.again && <div style={{ position: "absolute", left: cx, top: cy, transform: "translate(-50%, -50%)", fontFamily: GROT, fontWeight: 700, fontSize: 64, color: col, opacity: 0.9 }}>×{rings >= 14 ? "∞" : rings}</div>}
      <Note t={t} at={Lp.weight} out={Lp.out} text="最重的分量 · 《快乐的科学》§341" x={120} y={80} />
      <Line t={t} at={Lp.demon} out={Lp.spider} text="如果一个恶魔对你说：" x={120} y={150} size={52} />
      <Line t={t} at={Lp.line + 0.3} out={Lp.spider} text="这一生，你要一模一样地，再活无数次——" x={120} y={232} size={48} stagger={0.025} />
      <Line t={t} at={Lp.spider} out={Lp.curse} text="每一次痛苦和快乐，连同这只蜘蛛，和树间的这片月光。" x={120} y={150} size={40} stagger={0.02} />
      <Line t={t} at={Lp.curse} out={Lp.out} text="你会咬牙切齿地诅咒他——" x={120} y={150} size={52} />
      <Line t={t} at={Lp.divine} out={Lp.out} text="还是说：我从没听过比这更神圣的话？" x={120} y={900} size={52} color={col} stagger={0.03} />
    </Layer>
  );
};

// ═══ amor fati: the rings collapse into one point; chaos gathers into a dancing star — the first colour
export const Amor: React.FC<{ t: number }> = ({ t }) => {
  const A = NJ.amor;
  if (t < A.t || t >= A.out + 0.2) return null;
  const chaos = win(t, A.chaos - 0.3, A.star + 0.6, 0.5, 0.6), star = eOut(range(t, A.star, A.star + 0.8));
  const beat = Math.exp(-((t - A.star) % 0.5) / 0.12) * (t > A.star ? 1 : 0);
  const cx = 960, cy = 470;
  const pts = 10, R1 = 170 * star * (1 + 0.08 * beat), R2 = 70 * star;
  const rot = (t - A.star) * 50;
  const starPath = Array.from({ length: pts * 2 }, (_, i) => { const r = i % 2 ? R2 : R1, a = (i / (pts * 2)) * Math.PI * 2 + (rot * Math.PI) / 180; return `${i ? "L" : "M"}${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(" ") + "Z";
  return (
    <Layer o={1 - eIn(range(t, A.out - 0.3, A.out + 0.2))}>
      <Svg>
        <defs><radialGradient id="gl"><stop offset="0" stopColor={GOLD} stopOpacity={0.55} /><stop offset="1" stopColor={GOLD} stopOpacity={0} /></radialGradient></defs>
        {t < A.chaos && <circle cx={cx} cy={cy} r={8 + 4 * Math.sin(t * 9)} fill={GOLD} />}
        {/* chaos: white dust in a whirl, pulled in when the star is born */}
        {chaos > 0 && Array.from({ length: 260 }, (_, i) => {
          const a = rnd(i) * Math.PI * 2 + t * (0.6 + rnd(i + 1)) * (i % 2 ? 1 : -1), r0 = 120 + rnd(i + 2) * 620;
          const r = lerp(r0, 0, eIn(range(t, A.star - 0.2 + rnd(i + 5) * 0.3, A.star + 0.4)));
          return <circle key={i} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r * 0.75} r={1.3 + rnd(i + 3) * 1.8} fill={r < 60 ? GOLD : WH} opacity={chaos * (0.4 + 0.6 * rnd(i + 4))} />;
        })}
        {star > 0 && <>
          <circle cx={cx} cy={cy} r={360 * star} fill="url(#gl)" />
          <path d={starPath} fill={GOLD} />
          {Array.from({ length: 6 }, (_, k) => { const a = ((rot - k * 6) * Math.PI) / 180; return <circle key={k} cx={cx + 240 * Math.cos(a * 2)} cy={cy + 120 * Math.sin(a * 3)} r={5 - k * 0.6} fill={GOLD} opacity={0.6 - k * 0.09} />; })}
        </>}
      </Svg>
      <div style={{ position: "absolute", left: 960, top: 300, transform: "translate(-50%, -50%)", fontFamily: LATIN, fontStyle: "italic", fontWeight: 600, fontSize: 170, color: GOLD,
        opacity: win(t, A.latin, A.chaos, 0.5, 0.3), letterSpacing: 6, textShadow: "0 0 40px rgba(232,183,74,0.4)" }}>amor fati</div>
      <Line t={t} at={A.latin + 0.3} out={A.chaos} text="热爱命运" x={960} y={470} size={64} anchor="center" color={WH} stagger={0.1} />
      <Line t={t} at={A.love} out={A.chaos} text="不只是忍受必然——而是爱它。" x={960} y={760} size={52} anchor="center" stagger={0.04} />
      <Line t={t} at={A.chaos} out={A.become} text="你必须心中有混沌，" x={960} y={760} size={58} anchor="center" stagger={0.05} />
      <Line t={t} at={A.chaos + 1.0} out={A.become} text="才能生出一颗跳舞的星。" x={960} y={850} size={58} anchor="center" color={GOLD} stagger={0.05} />
      <Line t={t} at={A.become} out={A.out + 0.2} text="成为你自己。" x={960} y={790} size={96} anchor="center" color={GOLD} stagger={0.1} />
      <Note t={t} at={A.become + 0.4} out={A.out + 0.2} text="《查拉图斯特拉如是说》1883 · 《瞧，这个人》1888" x={960} y={930} anchor="center" />
    </Layer>
  );
};

// ═══ the ending: the dust from the opening comes back — in gold; the void is a canvas
export const End: React.FC<{ t: number }> = ({ t }) => {
  const E = NJ.end;
  if (t < E.t) return null;
  const dark = eInOut(range(t, E.dark, E.dark + 0.6));
  const pulse = 1 + 0.25 * Math.exp(-((t - E.dark) % 1.0) / 0.15);
  return (
    <>
      <Layer o={1 - dark}>
        <Dust t={t} id="yiyiGold" text="意义" size={300} cx={960} cy={470} t0={E.gather - 0.05} mode="in" color={GOLD} spread={0.5} dur={0.8} />
        <Line t={t} at={E.l1} out={E.dark} text="意义不会从天上掉下来——" x={960} y={740} size={54} anchor="center" />
        <Line t={t} at={E.l2} out={E.dark} text="是你从虚无里，亲手造出来的。" x={960} y={830} size={62} anchor="center" color={GOLD} stagger={0.04} />
      </Layer>
      {dark > 0 && <Svg><circle cx={960} cy={470} r={10 * pulse * dark} fill={GOLD} /><circle cx={960} cy={470} r={60 * dark} fill="none" stroke={GOLD} strokeWidth={1} opacity={0.3 * dark} /></Svg>}
      <Line t={t} at={E.c1} out={61} text="虚无，不是深渊。" x={960} y={640} size={66} anchor="center" stagger={0.07} />
      <Line t={t} at={E.c2} out={61} text="是画布。" x={960} y={740} size={110} anchor="center" color={GOLD} stagger={0.15} />
      <div style={{ position: "absolute", left: 960, top: 940, transform: "translateX(-50%)", fontFamily: LATIN, fontWeight: 700, fontSize: 30, letterSpacing: 18, color: DIM, opacity: eOut(range(t, E.card, E.card + 0.6)) }}>NIHIL · 虚无</div>
    </>
  );
};
export { backOut, clamp01 };
