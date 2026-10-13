// 06 笛卡尔, 07 康德 vs 边沁, 08 叔本华, 09 马克思, 10 尼采.
import React from "react";
import { Img, staticFile } from "remotion";
import { BIG, CUE, GOLD, GROT, INK, MJ, PAPER, SANS, SERIF, backOut, clamp01, eIn, eInOut, eOut, lerp, range, rnd, win } from "./base";
import { Art, Chip, Line } from "./Kit";
import { Scrim } from "./SegA";

const Fill: React.FC<React.PropsWithChildren<{ bg?: string }>> = ({ bg = INK, children }) => <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>{children}</div>;
const Svg: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, ...style }}>{children}</svg>;

// ═══ 06 笛卡尔: in "I think" — chiaroscuro and the coordinate plane; everything doubtable flickers, the origin stays
export const Cogito: React.FC<{ t: number }> = ({ t }) => {
  const S = MJ.seg[5], C = CUE.cogito, ox = 1180, oy = 600;
  const ax = eInOut(range(t, C.axes, C.axes + 0.45));
  const light = 0.55 + 0.45 * eOut(range(t, S.t, S.t + 0.6));
  return (
    <Fill bg="#070504">
      <div style={{ position: "absolute", left: 1220, top: 0, width: 700, height: 1080, overflow: "hidden" }}>
        <Img src={staticFile("media/me_descartes.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%", filter: `contrast(1.3) brightness(${light}) sepia(0.2)`,
          transform: `scale(${1.05 + 0.08 * range(t, S.t, S.out)})` }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 55% 35%, rgba(0,0,0,0) 20%, rgba(7,5,4,0.85) 70%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #070504 0%, rgba(7,5,4,0) 30%)" }} />
      </div>
      <Svg>
        <line x1={ox - 900 * ax} y1={oy} x2={ox + 700 * ax} y2={oy} stroke={GOLD} strokeWidth={3} />
        <line x1={ox} y1={oy + 420 * ax} x2={ox} y2={oy - 520 * ax} stroke={GOLD} strokeWidth={3} />
        {Array.from({ length: 13 }, (_, i) => <line key={i} x1={ox - 600 + i * 100} y1={oy - 8} x2={ox - 600 + i * 100} y2={oy + 8} stroke={GOLD} strokeWidth={2} opacity={ax} />)}
        {/* the world as doubtful points: they flicker and go out */}
        {Array.from({ length: 40 }, (_, i) => {
          const x = ox + (rnd(i) - 0.5) * 1100, y = oy + (rnd(i + 50) - 0.6) * 760;
          const gone = range(t, C.point + i * 0.008, C.point + 0.2 + i * 0.008);
          const fl = 0.3 + 0.7 * Math.abs(Math.sin(t * (5 + rnd(i + 9) * 9) + i));
          return <circle key={i} cx={x} cy={y} r={5} fill={PAPER} opacity={ax * fl * (1 - gone) * win(t, C.doubt, 30, 0.3, 0.1)} />;
        })}
        <circle cx={ox} cy={oy} r={14 + 6 * Math.exp(-Math.max(0, t - C.point) / 0.15)} fill={GOLD} opacity={eOut(range(t, C.point, C.point + 0.2))} />
        <circle cx={ox} cy={oy} r={40 * eOut(range(t, C.point, C.point + 0.4))} fill="none" stroke={GOLD} strokeWidth={3} opacity={1 - range(t, C.point + 0.4, C.point + 1)} />
      </Svg>
      <Chip t={t} at={C.point + 0.1} out={S.out} text="我 (0, 0)" x={ox + 30} y={oy + 20} size={30} />
      <Line t={t} at={C.doubt - 0.3} out={S.out} text="一切都能怀疑——" x={64} y={330} size={58} color={PAPER} stagger={0.03} />
      <Line t={t} at={C.doubt} out={S.out} text="除了正在怀疑的我。" x={64} y={415} size={58} color={PAPER} stagger={0.03} />
      <Line t={t} at={C.point} out={S.out} text="我思，故我在。" x={64} y={520} size={86} color={GOLD} stagger={0.06} />
      <Chip t={t} at={C.axes + 0.3} out={S.out} text="他还发明了坐标系：把世界变成数" x={68} y={660} size={26} bg={PAPER} />
    </Fill>
  );
};

// ═══ 07 康德 vs 边沁: in morality — motives or outcomes; two neoclassical ovals and a balance
const Oval: React.FC<{ src: string; x: number; y: number; w: number; h: number; k: number; bg: string }> = ({ src, x, y, w, h, k, bg }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: "50%", overflow: "hidden", border: `10px solid ${PAPER}`, boxShadow: `0 0 0 4px ${bg}, 0 0 0 8px ${PAPER}`, transform: `scale(${k})` }}>
    <Img src={staticFile(`media/${src}`)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 25%", filter: "contrast(1.05) saturate(0.9)" }} />
  </div>
);
export const Ethics: React.FC<{ t: number }> = ({ t }) => {
  const S = MJ.seg[6], C = CUE.ethics;
  const kk = backOut(range(t, C.kant, C.kant + 0.4), 1.5), kb = backOut(range(t, C.bentham, C.bentham + 0.4), 1.5);
  const tilt = (eInOut(range(t, C.kant + 0.6, C.kant + 1.0)) - 2 * eInOut(range(t, C.bentham + 0.4, C.bentham + 0.8)) + eInOut(range(t, C.vs, C.vs + 0.4))) * 12;
  const cx = 1300;
  return (
    <Fill bg="#2E4A7A">
      <div style={{ position: "absolute", left: cx, top: 0, width: 620, height: 1080, background: "#5E7D5A" }} />
      <Svg>
        {/* neoclassical ornament: a frieze of ovals and a colonnade line */}
        {Array.from({ length: 30 }, (_, i) => <ellipse key={i} cx={720 + i * 42} cy={90} rx={14} ry={22} fill="none" stroke={PAPER} strokeWidth={2} opacity={0.5} />)}
        {Array.from({ length: 30 }, (_, i) => <line key={"c" + i} x1={720 + i * 42} y1={950} x2={720 + i * 42} y2={1000} stroke={PAPER} strokeWidth={6} opacity={0.35} />)}
        <g transform={`translate(${cx} 760)`}>
          <polygon points="0,-20 -26,40 26,40" fill={PAPER} />
          <g transform={`rotate(${tilt})`}>
            <rect x={-330} y={-26} width={660} height={8} fill={PAPER} />
            <line x1={-300} y1={-22} x2={-300} y2={40} stroke={PAPER} strokeWidth={3} /><rect x={-370} y={40} width={140} height={10} fill={PAPER} />
            <line x1={300} y1={-22} x2={300} y2={40} stroke={PAPER} strokeWidth={3} /><rect x={230} y={40} width={140} height={10} fill={PAPER} />
          </g>
        </g>
      </Svg>
      <Oval src="me_kant.jpg" x={980} y={430} w={330} h={420} k={kk} bg="#2E4A7A" />
      <Oval src="me_bentham.jpg" x={1610} y={430} w={330} h={420} k={kb} bg="#5E7D5A" />
      <div style={{ position: "absolute", left: 980, top: 680, transform: "translateX(-50%)", fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: PAPER, opacity: kk }}>康德 · 看动机</div>
      <div style={{ position: "absolute", left: 1610, top: 680, transform: "translateX(-50%)", fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: PAPER, opacity: clamp01(kb) }}>边沁 · 看结果</div>
      <Line t={t} at={C.kant + 0.2} out={S.out} text="人永远是目的，" x={64} y={330} size={56} color={PAPER} />
      <Line t={t} at={C.kant + 0.45} out={S.out} text="不能只当手段。" x={64} y={410} size={56} color={GOLD} />
      <Line t={t} at={C.bentham + 0.1} out={S.out} text="最大多数人的最大幸福。" x={64} y={520} size={52} color="#CFE8C0" />
      <Chip t={t} at={C.vs} out={S.out} text="你会为救五个人，牺牲一个人吗？" x={68} y={640} size={28} bg={PAPER} />
      <div style={{ position: "absolute", left: cx, top: 760, transform: `translate(-50%, -50%) scale(${backOut(range(t, C.vs, C.vs + 0.3), 2)})`, fontFamily: BIG, fontSize: 90, color: GOLD, opacity: range(t, C.vs, C.vs + 0.1) }}>VS</div>
    </Fill>
  );
};

// ═══ 08 叔本华: in the blind will — the Wanderer above the fog, a pendulum between pain and boredom
export const Will: React.FC<{ t: number }> = ({ t }) => {
  const S = MJ.seg[7], C = CUE.will, px = 1340, py = 140, L = 520;
  const ang = 32 * Math.sin(Math.PI * (t - C.pend) / 0.5 + Math.PI / 2) * eOut(range(t, C.pend, C.pend + 0.3));
  const bx = px + L * Math.sin((ang * Math.PI) / 180), by = py + L * Math.cos((ang * Math.PI) / 180);
  const left = clamp01((-ang - 24) / 8), right = clamp01((ang - 24) / 8);
  return (
    <Fill bg="#5C6B78">
      <Art src="me_wanderer.jpg" t={t} a={S.t} b={S.out} from={[0.5, 0.35, 1.0]} to={[0.5, 0.3, 1.18]} filter="contrast(1.1) saturate(1.05)" />
      <Scrim o={0.8} c="20,26,34" />
      <Svg>
        <g opacity={win(t, C.pend - 0.1, S.out + 0.2, 0.25, 0.1)}>
          <text x={1000} y={700} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={84} fill={PAPER} opacity={0.35 + 0.65 * left}>痛苦</text>
          <text x={1700} y={700} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={84} fill={PAPER} opacity={0.35 + 0.65 * right}>无聊</text>
          <line x1={px} y1={py} x2={bx} y2={by} stroke={GOLD} strokeWidth={4} />
          <circle cx={px} cy={py} r={9} fill={GOLD} />
          <circle cx={bx} cy={by} r={52} fill={GOLD} />
          <circle cx={bx} cy={by} r={70} fill="none" stroke={GOLD} strokeWidth={2} opacity={0.5} />
        </g>
      </Svg>
      <div style={{ position: "absolute", right: 70, top: 160, width: 190, height: 190, borderRadius: "50%", overflow: "hidden", border: `4px solid ${GOLD}`, opacity: eOut(range(t, S.t + 0.2, S.t + 0.5)) }}>
        <Img src={staticFile("media/me_schop.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 25%", filter: "grayscale(1) contrast(1.2)" }} />
      </div>
      <Line t={t} at={S.t + 0.3} out={S.out} text="一切背后，是盲目的「意志」：" x={64} y={330} size={50} color={PAPER} stagger={0.02} />
      <Line t={t} at={S.t + 0.6} out={S.out} text="永远想要，永不满足。" x={64} y={410} size={58} color={GOLD} />
      <Line t={t} at={C.line} out={S.out} text="人生像钟摆，在痛苦和无聊之间来回" x={64} y={520} size={40} color={PAPER} stagger={0.015} />
      <Chip t={t} at={C.line + 0.3} out={S.out} text="同一年：弗里德里希画《雾海上的旅人》" x={68} y={600} size={26} bg={PAPER} />
    </Fill>
  );
};

// ═══ 09 马克思: in changing the world — Lissitzky's red wedge, a diagonal, gears
const Gear: React.FC<{ x: number; y: number; r: number; n: number; a: number; c: string }> = ({ x, y, r, n, a, c }) => (
  <g transform={`translate(${x} ${y}) rotate(${a})`}>
    {Array.from({ length: n }, (_, i) => <rect key={i} x={-r * 0.12} y={-r - r * 0.22} width={r * 0.24} height={r * 0.3} fill={c} transform={`rotate(${(360 / n) * i})`} />)}
    <circle r={r} fill={c} /><circle r={r * 0.35} fill={INK} />
  </g>
);
export const Marx: React.FC<{ t: number }> = ({ t }) => {
  const S = MJ.seg[8], C = CUE.marx;
  const band = eOut(range(t, C.punch, C.punch + 0.3));
  return (
    <Fill bg="#E7E0D2">
      <Art src="me_wedge.jpg" t={t} a={S.t} b={S.out} from={[0.5, 0.5, 1.05]} to={[0.55, 0.45, 1.35]} filter="contrast(1.2) saturate(1.3)" style={{ left: 560 }} />
      <Svg>
        <Gear x={1780} y={900} r={110} n={12} a={(t - S.t) * 90} c="#C8102E" />
        <Gear x={1600} y={1010} r={70} n={8} a={-(t - S.t) * 140} c={INK} />
        <polygon points={`0,${1080 - 700 * band} 1920,${1080 - 1200 * band} 1920,${1080 - 1080 * band} 0,${1080 - 580 * band}`} fill="#C8102E" opacity={band} />
      </Svg>
      <div style={{ position: "absolute", left: 0, top: 0, width: 600, height: 1080, background: "#E7E0D2" }} />
      <div style={{ position: "absolute", left: 360, top: 250, width: 230, height: 300, overflow: "hidden", transform: "rotate(-8deg)", border: `8px solid ${INK}`, opacity: eOut(range(t, S.t, S.t + 0.3)) }}>
        <Img src={staticFile("media/me_marx.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 25%", filter: "grayscale(1) contrast(1.4)" }} />
      </div>
      <Line t={t} at={C.quote - 0.6} out={S.out} text="哲学家只是解释世界，" x={64} y={600} size={46} color={INK} shadow="none" stagger={0.02} />
      <Line t={t} at={C.quote - 0.3} out={S.out} text="问题在于改变世界。" x={64} y={670} size={56} color="#C8102E" shadow="none" stagger={0.03} />
      {band > 0.5 && <div style={{ position: "absolute", left: 960, top: 560, transform: "translate(-50%, -50%) rotate(-15deg)", fontFamily: BIG, fontSize: 76, color: PAPER, letterSpacing: 6, opacity: range(t, C.punch + 0.15, C.punch + 0.3) }}>CHANGE THE WORLD</div>}
      <Chip t={t} at={C.quote} out={S.out} text="《关于费尔巴哈的提纲》1845" x={68} y={760} size={26} bg={INK} fg={PAPER} />
    </Fill>
  );
};

// ═══ 10 尼采: God is dead — The Scream, the sun shatters, then make your own
export const Nietz: React.FC<{ t: number }> = ({ t }) => {
  const S = MJ.seg[9], C = CUE.nietz;
  const fall = range(t, C.fall, C.fall + 0.9);
  const shake = t > C.dead && t < C.dead + 0.4 ? Math.sin(t * 90) * 8 * (1 - range(t, C.dead, C.dead + 0.4)) : 0;
  return (
    <Fill bg="#D9541E">
      <div style={{ position: "absolute", inset: 0, transform: `translate(${shake}px, 0)` }}>
        <Art src="me_scream.jpg" t={t} a={S.t} b={S.out} from={[0.5, 0.3, 1.0]} to={[0.5, 0.25, 1.25]} filter={`contrast(1.2) saturate(${1.3 + 0.4 * range(t, C.swirl, S.out)})`} />
      </div>
      <Scrim o={0.82} c="40,8,4" />
      <Svg>
        {/* the sun breaks apart */}
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2, d = eIn(fall) * (300 + rnd(i) * 300), g = eIn(fall) * 500 * rnd(i + 3);
          const x = 1500 + Math.cos(a) * d, y = 300 + Math.sin(a) * d + g;
          return <polygon key={i} points={`${x},${y} ${x + 70 * Math.cos(a + 0.4)},${y + 70 * Math.sin(a + 0.4)} ${x + 70 * Math.cos(a - 0.5)},${y + 70 * Math.sin(a - 0.5)}`} fill={GOLD} opacity={t < C.fall ? 0 : 1 - fall * 0.8} transform={`rotate(${fall * 200 * (rnd(i) - 0.5)} ${x} ${y})`} />;
        })}
        {t < C.fall + 0.05 && <circle cx={1500} cy={300} r={110} fill={GOLD} opacity={win(t, S.t, C.fall + 0.05, 0.3, 0.05)} />}
        <circle cx={1500} cy={300} r={110 * eOut(range(t, C.make, C.make + 0.4))} fill="none" stroke={GOLD} strokeWidth={8} />
      </Svg>
      <div style={{ position: "absolute", right: 70, top: 640, width: 170, height: 210, overflow: "hidden", border: `4px solid ${PAPER}`, opacity: eOut(range(t, S.t + 0.3, S.t + 0.6)) }}>
        <Img src={staticFile("media/me_nietzsche.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 25%", filter: "grayscale(1) contrast(1.3)" }} />
      </div>
      <Line t={t} at={C.dead} out={S.out} text="上帝死了。" x={64} y={300} size={150} color={PAPER} stagger={0.07} />
      <Line t={t} at={C.fall} out={S.out} text="最高的价值，自己贬值了。" x={64} y={500} size={46} color={PAPER} stagger={0.02} />
      <Line t={t} at={C.make} out={S.out} text="那就自己创造价值。" x={64} y={580} size={64} color={GOLD} stagger={0.04} />
      <Chip t={t} at={C.dead + 0.4} out={S.out} text="《快乐的科学》1882 · 蒙克《呐喊》1893" x={68} y={690} size={26} bg={PAPER} />
    </Fill>
  );
};
export { GROT, SANS, lerp };
