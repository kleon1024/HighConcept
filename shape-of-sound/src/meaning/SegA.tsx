// The opening (a circle drawn by a compass, then flickering through 2500 years of styles), and the first five answers:
// Plato's Forms, the Cynic, the Stoic, the medieval God, the Renaissance human.
import React from "react";
import { Img, staticFile } from "remotion";
import { BIG, CUE, GOLD, INK, LATIN, MJ, PAPER, SANS, backOut, clamp01, eIn, eInOut, eOut, lerp, range, rnd, win } from "./base";
import { Art, Chip, Line } from "./Kit";

const Fill: React.FC<React.PropsWithChildren<{ bg?: string }>> = ({ bg = INK, children }) => <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>{children}</div>;
const Svg: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, ...style }}>{children}</svg>;
export const Scrim: React.FC<{ o?: number; c?: string; w?: number }> = ({ o = 0.85, c = "0,0,0", w = 62 }) => <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, rgba(${c},${o}) 0%, rgba(${c},${o * 0.75}) 30%, rgba(${c},0) ${w}%)` }} />;
// a circle drawn by a compass: the arc grows, a needle sweeps with it
export const Compass: React.FC<{ x: number; y: number; r: number; k: number; c?: string; w?: number; needle?: boolean }> = ({ x, y, r, k, c = GOLD, w = 6, needle = true }) => {
  const a = -Math.PI / 2 + k * Math.PI * 2;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="none" stroke={c} strokeWidth={w} strokeDasharray={`${2 * Math.PI * r * k} 99999`} transform={`rotate(-90 ${x} ${y})`} strokeLinecap="round" />
      {needle && k > 0 && k < 1 && <><line x1={x} y1={y} x2={x + r * Math.cos(a)} y2={y + r * Math.sin(a)} stroke={c} strokeWidth={3} opacity={0.8} /><circle cx={x} cy={y} r={6} fill={c} /></>}
    </g>
  );
};

// the opening: a compass draws the circle; then it flickers through every style in the film; the question
const FLASH = ["me_athens.jpg", "me_diogenes.jpg", "me_marcus.jpg", "me_rose.jpg", "me_vitruvian.jpg", "me_descartes.jpg", "me_kant.jpg", "me_wanderer.jpg", "me_wedge.jpg", "me_scream.jpg", "ad_blacksquare.jpg", "me_panopticon.jpg"];
const FLASH_Y = ["前380", "前350", "170", "400", "1486", "1637", "1785", "1818", "1845", "1882", "1953", "1975"];
const FLASH_BG = ["#B8662F", "#2B1B10", "#7A2E1C", "#0E1E5C", "#E8D9B5", "#120C08", "#1D3D6E", "#5C6B78", "#E7E0D2", "#D9541E", "#F4F1EA", "#0B0B0D"];
export const Hook: React.FC<{ t: number }> = ({ t }) => {
  const H = MJ.hook, cx = 960, cy = 500, R = 300;
  const drawK = eInOut(range(t, H.draw, H.slam));
  const fl = t >= H.flash[0] && t < H.flash[1] ? Math.floor((t - H.flash[0]) / 0.125) : -1;
  const slam = 1 + 0.12 * Math.exp(-Math.max(0, t - H.slam) / 0.08) * (t >= H.slam ? 1 : 0);
  const title = t >= H.title;
  const k = backOut(range(t, H.title, H.title + 0.4), 1.6);
  return (
    <Fill bg={fl >= 0 ? FLASH_BG[fl % FLASH_BG.length] : INK}>
      {fl >= 0 && <div style={{ position: "absolute", left: 0, right: 0, top: 190, textAlign: "center", fontFamily: BIG, fontSize: 560, lineHeight: 1, color: "rgba(255,255,255,0.16)", letterSpacing: -10 }}>{FLASH_Y[fl % FLASH_Y.length]}</div>}
      {fl >= 0 && (
        <div style={{ position: "absolute", left: cx - R, top: cy - R, width: 2 * R, height: 2 * R, borderRadius: "50%", overflow: "hidden", transform: `scale(${1 + 0.06 * ((fl % 2) * 2 - 1)})` }}>
          <Img src={staticFile(`media/${FLASH[fl % FLASH.length]}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}
      <Svg>
        {!title && <g transform={`translate(${cx} ${cy}) scale(${slam}) translate(${-cx} ${-cy})`}><Compass x={cx} y={cy} r={R} k={drawK} w={fl >= 0 ? 10 : 6} c={fl >= 0 && fl % 3 === 1 ? INK : GOLD} needle={t < H.slam} /></g>}
        {title && <>
          <circle cx={960} cy={430} r={300 * k} fill="none" stroke={GOLD} strokeWidth={4} opacity={0.9} />
          <circle cx={960} cy={430} r={330 * k} fill="none" stroke={GOLD} strokeWidth={1.5} opacity={0.4} strokeDasharray="4 10" />
        </>}
      </Svg>
      <Line t={t} at={H.ask} out={H.title} text="两千五百年，人类一直在问：" x={960} y={850} size={56} color={PAPER} anchor="center" stagger={0.03} />
      <Line t={t} at={H.title} out={H.out + 0.1} text="意义，从哪来？" x={960} y={340} size={150} color={PAPER} anchor="center" stagger={0.06} tracking={6} />
      <Line t={t} at={H.title + 0.6} out={H.out + 0.1} text="从柏拉图到今天 · 15 种回答 · 60 秒" x={960} y={560} size={40} color={GOLD} anchor="center" font={SANS} weight={700} stagger={0.012} />
    </Fill>
  );
};

// a dodecahedron in gold wire: Plato's figure for the cosmos
const PHI = (1 + Math.sqrt(5)) / 2;
const DV: [number, number, number][] = [];
for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) DV.push([a, b, c]);
for (const a of [-1, 1]) for (const b of [-1, 1]) { DV.push([0, a / PHI, b * PHI]); DV.push([a / PHI, b * PHI, 0]); DV.push([a * PHI, 0, b / PHI]); }
const DE: [number, number][] = [];
for (let i = 0; i < DV.length; i++) for (let j = i + 1; j < DV.length; j++) { const d = Math.hypot(DV[i][0] - DV[j][0], DV[i][1] - DV[j][1], DV[i][2] - DV[j][2]); if (Math.abs(d - 2 / PHI) < 0.01) DE.push([i, j]); }
export const Dodeca: React.FC<{ x: number; y: number; s: number; t: number; c?: string; o?: number }> = ({ x, y, s, t, c = GOLD, o = 1 }) => {
  const a = t * 0.7, b = t * 0.45;
  const P = DV.map(([vx, vy, vz]) => { const x1 = vx * Math.cos(a) - vz * Math.sin(a), z1 = vx * Math.sin(a) + vz * Math.cos(a); const y2 = vy * Math.cos(b) - z1 * Math.sin(b), z2 = vy * Math.sin(b) + z1 * Math.cos(b); return [x + x1 * s, y + y2 * s, z2]; });
  return <g opacity={o}>{DE.map(([i, j], k) => <line key={k} x1={P[i][0]} y1={P[i][1]} x2={P[j][0]} y2={P[j][1]} stroke={c} strokeWidth={2 + (P[i][2] + P[j][2] + 3.4) * 0.6} opacity={0.35 + 0.18 * (P[i][2] + P[j][2] + 3.4) / 2} />)}</g>;
};

// ═══ 01 柏拉图: up there — the Forms
export const Plato: React.FC<{ t: number }> = ({ t }) => {
  const S = MJ.seg[0], C = CUE.plato;
  const form = eInOut(range(t, C.form, C.form + 0.6));
  return (
    <Fill>
      <Art src="me_athens.jpg" t={t} a={S.t} b={S.out} from={[0.5, 0.4, 1.05]} to={[0.5, 0.42, 2.1]} filter="contrast(1.08) saturate(1.1)" />
      <Scrim o={0.82} />
      <Svg>
        <g opacity={win(t, C.up, S.out + 0.2, 0.25, 0.1)}>
          <line x1={1700} y1={560} x2={1700} y2={250 + 0 * (1 - eOut(range(t, C.up, C.up + 0.3)))} stroke={GOLD} strokeWidth={8} strokeDasharray={`${310 * eOut(range(t, C.up, C.up + 0.3))} 999`} />
          <polygon points="1700,220 1676,262 1724,262" fill={GOLD} opacity={eOut(range(t, C.up + 0.2, C.up + 0.35))} />
        </g>
        <g opacity={win(t, C.down, S.out + 0.2, 0.25, 0.1)}>
          <line x1={1800} y1={600} x2={1800} y2={900} stroke={PAPER} strokeWidth={8} strokeDasharray={`${300 * eOut(range(t, C.down, C.down + 0.3))} 999`} />
          <polygon points="1800,930 1776,888 1824,888" fill={PAPER} opacity={eOut(range(t, C.down + 0.2, C.down + 0.35))} />
        </g>
        <Compass x={1280} y={470} r={250} k={form} needle={form < 1} w={5} />
        {form > 0 && <Dodeca x={1280} y={470} s={120 * eOut(range(t, C.form + 0.3, C.form + 0.8))} t={t} />}
      </Svg>
      <Chip t={t} at={C.up} out={S.out} text="柏拉图：手指向天 · 理念" x={1660} y={160} size={28} anchor="right" />
      <Chip t={t} at={C.down} out={S.out} text="亚里士多德：手掌向地 · 现实" x={1760} y={950} size={28} bg={PAPER} anchor="right" />
      <Line t={t} at={S.t + 0.3} out={S.out} text="你看到的一切，" x={64} y={330} size={66} color={PAPER} />
      <Line t={t} at={S.t + 0.55} out={S.out} text="都只是「理念」的影子" x={64} y={420} size={66} color={GOLD} />
      <Chip t={t} at={C.form + 0.2} out={S.out} text="完美的圆，只存在于理念里" x={68} y={540} size={30} bg={PAPER} />
    </Fill>
  );
};

// ═══ 02 第欧根尼: in nature — and an eclipse for Alexander
export const Kynic: React.FC<{ t: number }> = ({ t }) => {
  const S = MJ.seg[1], C = CUE.kynic;
  const ecl = eInOut(range(t, C.sun, C.sun + 0.4)) - eInOut(range(t, C.sun + 0.75, S.out - 0.1));
  return (
    <Fill>
      <Art src="me_diogenes.jpg" t={t} a={S.t} b={S.out} from={[0.35, 0.5, 1.15]} to={[0.32, 0.45, 1.6]} filter="contrast(1.1) saturate(1.15) sepia(0.15)" />
      <Scrim o={0.78} />
      <Svg>
        <defs><radialGradient id="ksun"><stop offset="0" stopColor="#FFF4C8" /><stop offset="0.6" stopColor={GOLD} stopOpacity={0.6} /><stop offset="1" stopColor={GOLD} stopOpacity={0} /></radialGradient></defs>
        <circle cx={1500} cy={280} r={260} fill="url(#ksun)" opacity={0.9} />
        <circle cx={1500} cy={280} r={110} fill="#FFF4C8" />
        <circle cx={1500 + (1 - ecl) * 260} cy={280} r={112} fill={INK} opacity={clamp01(ecl * 3)} />
        {Array.from({ length: 16 }, (_, i) => <line key={i} x1={1500 + 140 * Math.cos(i * 0.3927 + t * 0.4)} y1={280 + 140 * Math.sin(i * 0.3927 + t * 0.4)} x2={1500 + 200 * Math.cos(i * 0.3927 + t * 0.4)} y2={280 + 200 * Math.sin(i * 0.3927 + t * 0.4)} stroke={GOLD} strokeWidth={6} opacity={0.8 * (1 - ecl)} />)}
      </Svg>
      <Chip t={t} at={C.lamp} out={S.out} text="大白天提灯：「我在找一个人」" x={68} y={560} size={30} />
      <Chip t={t} at={C.sun} out={S.out} text="亚历山大大帝：「我能为你做什么？」" x={1880} y={460} size={28} bg={PAPER} anchor="right" />
      <Line t={t} at={S.t + 0.3} out={S.out} text="只要活着必需的，" x={64} y={330} size={62} color={PAPER} />
      <Line t={t} at={S.t + 0.55} out={S.out} text="别的都是累赘。" x={64} y={415} size={62} color={PAPER} />
      <Line t={t} at={C.sun + 0.3} out={S.out} text="「别挡住我的阳光。」" x={64} y={640} size={70} color={GOLD} stagger={0.04} />
    </Fill>
  );
};

// ═══ 03 马可·奥勒留: in what you control — two rings of mosaic tiles
const Tess: React.FC<{ cx: number; cy: number; r0: number; r1: number; n: number; k: number; c: string[]; seed: number }> = ({ cx, cy, r0, r1, n, k, c, seed }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2, rr = lerp(r0, r1, rnd(i + seed)), on = clamp01(k * n - i * 0.6);
      const sz = 18 + rnd(i * 3 + seed) * 10;
      return on > 0 ? <rect key={i} x={cx + rr * Math.cos(a) - sz / 2} y={cy + rr * Math.sin(a) - sz / 2} width={sz} height={sz} fill={c[i % c.length]} transform={`rotate(${a * 57.3 + 45 * rnd(i)} ${cx + rr * Math.cos(a)} ${cy + rr * Math.sin(a)})`} opacity={on} /> : null;
    })}
  </>
);
export const Stoic: React.FC<{ t: number }> = ({ t }) => {
  const S = MJ.seg[2], C = CUE.stoic, cx = 1310, cy = 480;
  return (
    <Fill bg="#2A140C">
      <Art src="me_marcus.jpg" t={t} a={S.t} b={S.out} from={[0.5, 0.35, 1.0]} to={[0.5, 0.3, 1.25]} filter="contrast(1.1) sepia(0.35) saturate(1.2) brightness(0.8)" style={{ left: 700 }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 1080, background: "#7A2E1C" }} />
      <Svg>
        {/* a mosaic border */}
        {Array.from({ length: 36 }, (_, i) => <rect key={i} x={700 + (i % 2) * 30} y={i * 30} width={28} height={28} fill={["#E8C26A", "#2A140C", "#C9572A"][i % 3]} />)}
        <Tess cx={cx} cy={cy} r0={390} r1={450} n={130} k={range(t, C.outer, C.outer + 0.5)} c={["#2A140C", "#4A2A1A", "#6B3A22", "#1A0C06"]} seed={4} />
        <Tess cx={cx} cy={cy} r0={300} r1={330} n={120} k={range(t, C.inner, C.inner + 0.5)} c={["#F5C451", "#E8A63A", "#FFF0C0", "#C9572A"]} seed={9} />
        <circle cx={cx} cy={cy} r={285} fill="none" stroke={GOLD} strokeWidth={4} opacity={range(t, C.inner, C.inner + 0.3)} />
      </Svg>
      <Chip t={t} at={C.inner + 0.2} out={S.out} text="圈内 · 你能控制：判断 · 选择 · 行动" x={cx} y={cy - 250} size={28} anchor="center" />
      <Chip t={t} at={C.outer + 0.2} out={S.out} text="圈外 · 控制不了：天气 · 别人 · 命运" x={cx} y={cy + 400} size={28} bg="#2A140C" fg={PAPER} anchor="center" />
      <Line t={t} at={C.line - 0.6} out={S.out} text="管好你能控制的，" x={64} y={330} size={62} color={PAPER} />
      <Line t={t} at={C.line - 0.35} out={S.out} text="其余随它。" x={64} y={415} size={62} color={GOLD} />
      <Chip t={t} at={C.line} out={S.out} text="《沉思录》· 一位罗马皇帝的日记" x={68} y={540} size={28} bg={PAPER} />
    </Fill>
  );
};

// ═══ 04 奥古斯丁: in God — the rose window turns
export const God: React.FC<{ t: number }> = ({ t }) => {
  const S = MJ.seg[3], C = CUE.god;
  const rot = (t - S.t) * 9;
  return (
    <Fill bg="#05081C">
      <div style={{ position: "absolute", left: 1340 - 560, top: 540 - 560, width: 1120, height: 1120, borderRadius: "50%", overflow: "hidden", transform: `rotate(${rot}deg) scale(${1 + 0.06 * range(t, S.t, S.out)})` }}>
        <Img src={staticFile("media/me_rose.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 40%", filter: "contrast(1.25) saturate(1.45) brightness(1.1)" }} />
      </div>
      <Svg>
        <circle cx={1340} cy={540} r={560} fill="none" stroke={GOLD} strokeWidth={10} />
        {Array.from({ length: 24 }, (_, i) => <line key={i} x1={1340} y1={540} x2={1340 + 900 * Math.cos(i * 0.2618 + rot * 0.01)} y2={540 + 900 * Math.sin(i * 0.2618 + rot * 0.01)} stroke={GOLD} strokeWidth={1.5} opacity={0.25} />)}
        <circle cx={1340} cy={540} r={120 + 10 * Math.sin(t * 4)} fill="none" stroke="#FFF4C8" strokeWidth={4} opacity={win(t, C.quote, S.out, 0.3, 0.1)} />
      </Svg>
      <Scrim o={0.9} c="5,8,28" w={55} />
      <Line t={t} at={C.quote - 0.6} out={S.out} text="我们的心若不安息在你里面，" x={64} y={330} size={54} color={PAPER} stagger={0.02} />
      <Line t={t} at={C.quote - 0.3} out={S.out} text="便不得安宁。" x={64} y={410} size={54} color={GOLD} stagger={0.03} />
      <Chip t={t} at={C.quote + 0.3} out={S.out} text="奥古斯丁《忏悔录》 · 约 400 年" x={68} y={520} size={28} bg={PAPER} />
      <Chip t={t} at={C.line} out={S.out} text="一千年里：哲学是神学的婢女" x={68} y={590} size={28} />
    </Fill>
  );
};

// ═══ 05 皮科 / 达·芬奇: in the human — the Vitruvian circle and square, a perspective grid
export const Renais: React.FC<{ t: number }> = ({ t }) => {
  const S = MJ.seg[4], C = CUE.renais, cx = 1290, cy = 560;
  const kc = eInOut(range(t, C.circle, C.circle + 0.5)), ks = eInOut(range(t, C.square, C.square + 0.4));
  return (
    <Fill bg="#E8D9B5">
      <Art src="me_vitruvian.jpg" t={t} a={S.t} b={S.out} from={[0.5, 0.45, 1.0]} to={[0.5, 0.42, 1.12]} filter="contrast(1.15) sepia(0.2)" style={{ left: 640 }} fit="contain" />
      <Svg>
        {Array.from({ length: 14 }, (_, i) => { const a = (i / 13) * Math.PI; const k = eOut(range(t, S.t + i * 0.02, S.t + 0.4 + i * 0.02)); return <line key={i} x1={cx} y1={cy} x2={cx + 1400 * Math.cos(a) * k} y2={cy + 900 * Math.sin(a) * k} stroke="#B3401F" strokeWidth={1.5} opacity={0.45} />; })}
        <circle cx={cx} cy={cy} r={330} fill="none" stroke="#B3401F" strokeWidth={6} strokeDasharray={`${2 * Math.PI * 330 * kc} 9999`} transform={`rotate(-90 ${cx} ${cy})`} />
        <rect x={cx - 270} y={cy - 230} width={540} height={540} fill="none" stroke={INK} strokeWidth={5} strokeDasharray={`${2160 * ks} 9999`} />
      </Svg>
      <div style={{ position: "absolute", left: 0, top: 0, width: 660, height: 1080, background: "linear-gradient(90deg, rgba(232,217,181,0.98) 70%, rgba(232,217,181,0))" }} />
      <Line t={t} at={S.t + 0.3} out={S.out} text="人，回到了世界的中心：" x={64} y={330} size={54} color={INK} shadow="none" stagger={0.02} />
      <Line t={t} at={C.line - 0.5} out={S.out} text="人可以选择" x={64} y={415} size={66} color="#B3401F" shadow="none" />
      <Line t={t} at={C.line - 0.25} out={S.out} text="成为任何样子。" x={64} y={500} size={66} color="#B3401F" shadow="none" />
      <Chip t={t} at={C.line} out={S.out} text="皮科《论人的尊严》1486" x={68} y={610} size={28} bg={INK} fg={PAPER} />
    </Fill>
  );
};
export { BIG, LATIN, eIn };
