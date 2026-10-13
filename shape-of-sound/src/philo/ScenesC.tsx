// VII 福柯 (the Panopticon returns; 1984: his last lectures were about Diogenes), VIII 现代犬儒, and the ending.
import React from "react";
import { FLAME, GOLD, INK, LATIN, MONO, NIGHT, PAPER, PJ, SANS, SERIF, SEC, backOut, clamp01, eInOut, eOut, lerp, range, rnd, win } from "./base";
import { Diogenes, Foucault, Sofa } from "./Icons";
import { Dust, Flame, Glow, Lamp, Line, Rays, Tag } from "./Kit";
import { PanPlan } from "./ScenesB";
import { Street } from "./ScenesA";

const Fill: React.FC<React.PropsWithChildren<{ bg: string }>> = ({ bg, children }) => <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>{children}</div>;
const Svg: React.FC<React.PropsWithChildren> = ({ children }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>{children}</svg>;
const lat = (s: string) => <span style={{ fontFamily: LATIN, fontStyle: "italic", fontWeight: 600 }}>{s}</span>;

// ═══ VII 福柯
export const Fouc: React.FC<{ t: number }> = ({ t }) => {
  const F = PJ.foucault, S = PJ.sec[6], ink = S.ink, bg = S.bg, cy = "#3FE0FF";
  const pan = win(t, F.pan - 0.5, F.y1984 + 0.1, 0.3, 0.3), end = win(t, F.y1984 - 0.1, 51, 0.3, 0.1);
  const beamOn = eOut(range(t, F.beam, F.beam + 0.3)) * (1 - eInOut(range(t, F.dark, F.dark + 0.3)));
  const toGrid = eInOut(range(t, F.grid, F.grid + 0.7));
  const ang = (t - F.beam) * 140;
  const lampK = backOut(range(t, F.lamp, F.lamp + 0.45), 1.6);
  const N = 16, R = 250, X0 = 1280, Y0 = 520;
  return (
    <Fill bg={bg}>
      <Svg>
        <g transform="translate(400 560) scale(1.05)" opacity={pan}><Foucault c={ink} b={bg} neck="#F2F2F2" /></g>
        <g opacity={pan}>
          {toGrid < 0.02 ? (
            <>
              <PanPlan x={X0} y={Y0} r={R} k={1} c={cy} n={N} figs={1} figC={ink} />
              {beamOn > 0 && <path d={`M${X0},${Y0} L${X0 + Math.cos((ang - 14) * Math.PI / 180) * 330},${Y0 + Math.sin((ang - 14) * Math.PI / 180) * 330} A330,330 0 0 1 ${X0 + Math.cos((ang + 14) * Math.PI / 180) * 330},${Y0 + Math.sin((ang + 14) * Math.PI / 180) * 330} Z`} fill={cy} opacity={0.32 * beamOn} />}
              <circle cx={X0} cy={Y0} r={22} fill={beamOn > 0.1 ? cy : "#0E2A33"} stroke={cy} strokeWidth={4} />
            </>
          ) : (
            // the ring of cells unrolls into a grid: classroom, barracks, factory, hospital … screens
            Array.from({ length: 48 }, (_, i) => {
              const a = ((i % N) / N) * Math.PI * 2, ring = [X0 + Math.cos(a) * R * 0.84, Y0 + Math.sin(a) * R * 0.84];
              const gx = 760 + (i % 12) * 90, gy = 300 + Math.floor(i / 12) * 120;
              const x = lerp(ring[0], gx, toGrid), y = lerp(ring[1], gy, toGrid);
              const w = lerp(14, 70, toGrid), h = lerp(14, 96, toGrid), lit = toGrid > 0.9 && i % 5 === (Math.floor(t * 4) % 5);
              return <g key={i}>
                <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={8} fill="none" stroke={cy} strokeWidth={3} opacity={i < N || toGrid > 0.3 ? 1 : toGrid * 3} />
                <rect x={x - 6} y={y - 6} width={12} height={12} rx={6} fill={lit ? cy : ink} />
              </g>;
            })
          )}
        </g>
        {/* 1984 */}
        <g opacity={end}>
          <Glow x={1340} y={520} r={420} id="fl84" o={lampK} />
          <g transform={`translate(1180 560) scale(${1.4 * lampK})`}><Lamp t={t} ink="#2A1E14" /></g>
        </g>
      </Svg>
      <Tag t={t} at={F.pan} out={F.y1984} text={<span>福柯 {lat("Foucault")} · 1975《规训与惩罚》</span>} x={240} y={770} size={30} bg={ink} fg={bg} />
      <Line t={t} at={F.pan + 0.1} out={F.dark} text="边沁的监狱，成了现代社会的图纸" x={700} y={830} size={56} color={ink} stagger={0.02} />
      <Line t={t} at={F.dark} out={F.y1984} text="不知道有没有人在看——于是自己管住自己" x={700} y={830} size={52} color={ink} stagger={0.018} />
      <Tag t={t} at={F.grid + 0.3} out={F.y1984} text="学校 · 军营 · 工厂 · 医院 · 屏幕" x={1300} y={200} size={34} bg={cy} fg={bg} anchor="center" />
      <Line t={t} at={F.y1984} out={50.1} text="1984 年，他的最后一门课，讲的是——" x={240} y={200} size={56} color={ink} stagger={0.02} />
      <Line t={t} at={F.lamp + 0.1} out={50.1} text="第欧根尼。" x={240} y={300} size={130} color={GOLD} stagger={0.08} glow="rgba(255,194,74,0.4)" />
      <Tag t={t} at={F.lamp + 0.4} out={50.1} text="《说真话的勇气》：用整个生活去说真话" x={244} y={480} size={30} bg={GOLD} fg={bg} />
    </Fill>
  );
};

// ═══ VIII 现代犬儒: see through it all, go along anyway; and the split screen with the ancient kind
export const Cynic: React.FC<{ t: number }> = ({ t }) => {
  const C = PJ.cynic, S = PJ.sec[7], ink = S.ink, bg = S.bg, pk = "#FF4FA3", bl = "#4F8BFF";
  const sofa = win(t, C.sofa - 0.5, 55, 0.3, 0.1), split = eInOut(range(t, C.split, C.split + 0.45));
  const W = 960 * split;
  const roll = Math.sin(t * 3) * 6;
  return (
    <Fill bg={bg}>
      <Svg>
        <defs><linearGradient id="cyg" x1="0" x2="1"><stop offset="0" stopColor={pk} stopOpacity={0.35} /><stop offset="1" stopColor={bl} stopOpacity={0.35} /></linearGradient></defs>
        <rect x={0} y={0} width={1920} height={1080} fill="url(#cyg)" opacity={0.5} />
        <g opacity={sofa} transform={`translate(${1240 + 220 * split} 660) scale(${1.25 - 0.2 * split}) rotate(${roll * 0.1})`}><Sofa c="#2B2F6B" b={ink} glow="#9FD0FF" /></g>
        {split > 0 && <g transform="translate(1580 380) scale(0.9)" opacity={split}><Lamp t={t} on={0} ink="#3A3F7A" /></g>}
      </Svg>
      {/* the split screen: the ancient kind on the left, lit; the modern kind on the right, lamp off */}
      {split > 0 && (
        <>
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: 1080, background: PAPER, overflow: "hidden" }}>
            <svg width={960} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
              <Glow x={560} y={430} r={460} id="spl" />
              <g transform="translate(330 640) scale(1.2)"><Diogenes c={INK} b={PAPER} t={t} /></g>
            </svg>
            <div style={{ position: "absolute", left: 70, top: 70, fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: INK }}>古典犬儒</div>
            <div style={{ position: "absolute", left: 70, top: 870, fontFamily: SERIF, fontWeight: 900, fontSize: 60, color: INK }}>看透了 → <span style={{ color: "#B3101F" }}>真活</span></div>
          </div>
          <div style={{ position: "absolute", left: W - 6, top: 0, width: 12, height: 1080, background: GOLD }} />
        </>
      )}
      <Line t={t} at={C.sofa} out={C.split} text="可今天说的「犬儒」，变了味：" x={100} y={170} size={56} color={ink} stagger={0.02} />
      <Line t={t} at={C.sloter - 0.35} out={C.split} text="什么都看透，照样配合。" x={100} y={270} size={84} color={pk} stagger={0.04} />
      <Tag t={t} at={C.sloter + 0.2} out={C.split} text={<span>斯洛特戴克 {lat("Sloterdijk")} 1983：「开明的虚假意识」</span>} x={104} y={420} size={30} bg={ink} fg={bg} />
      {split > 0.9 && <>
        <div style={{ position: "absolute", left: 1030, top: 70, fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: ink }}>现代犬儒</div>
        <Line t={t} at={C.right} out={54.1} text="看透了 → 算了" x={1030} y={870} size={60} color={ink} stagger={0.03} />
      </>}
    </Fill>
  );
};

// ═══ the ending: the map of the whole line, then the lamp turns to us
const NODES: { id: string; cn: string; y: number; up: boolean }[] = [
  { id: "soc", cn: "苏格拉底", y: -420, up: true }, { id: "pla", cn: "柏拉图", y: -395, up: false }, { id: "dio", cn: "第欧根尼", y: -350, up: true },
  { id: "ari", cn: "亚里士多德", y: -330, up: false }, { id: "ben", cn: "边沁", y: 1789, up: true }, { id: "sch", cn: "叔本华", y: 1818, up: false },
  { id: "mil", cn: "密尔", y: 1863, up: true }, { id: "nie", cn: "尼采", y: 1882, up: false }, { id: "sar", cn: "萨特 · 加缪", y: 1945, up: true },
  { id: "fou", cn: "福柯", y: 1975, up: false }, { id: "slo", cn: "现代犬儒", y: 2000, up: true },
];
const ARCS: [string, string, string][] = [["soc", "dio", "师承"], ["soc", "pla", ""], ["pla", "ari", ""], ["ben", "mil", ""], ["sch", "nie", "旧书店"], ["nie", "sar", "上帝死后"], ["ben", "fou", "全景监狱"], ["dio", "fou", "1984 最后一课"], ["dio", "slo", "名字被借走"]];
export const End: React.FC<{ t: number }> = ({ t }) => {
  const E = PJ.end;
  const map = win(t, E.map - 0.5, E.lamp + 0.05, 0.3, 0.1);
  const Y = 560;
  const XS = [220, 380, 540, 700, 980, 1110, 1240, 1370, 1510, 1650, 1790];
  const pos = Object.fromEntries(NODES.map((n, i) => [n.id, XS[i]]));
  return (
    <Fill bg={NIGHT}>
      <Svg>
        <g opacity={map}>
          <line x1={150} y1={Y} x2={770} y2={Y} stroke={PAPER} strokeWidth={3} opacity={0.6} /><line x1={910} y1={Y} x2={1850} y2={Y} stroke={PAPER} strokeWidth={3} opacity={0.6} />
          <text x={840} y={Y + 8} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={22} fill={PAPER} opacity={0.6}>≈ 2000 年</text>
          <text x={150} y={Y + 110} fontFamily={MONO} fontWeight={700} fontSize={20} fill={PAPER} opacity={0.5}>公元前 5–4 世纪</text>
          <text x={1850} y={Y + 110} textAnchor="end" fontFamily={MONO} fontWeight={700} fontSize={20} fill={PAPER} opacity={0.5}>1789 → 今天</text>
          {ARCS.map(([a, b, lab], i) => {
            const at = E.map + 0.25 + i * 0.16, k = eOut(range(t, at, at + 0.4));
            const x1 = pos[a], x2 = pos[b], up = i % 2 === 0, h = Math.min(330, 70 + Math.abs(x2 - x1) * 0.3) * (up ? -1 : 1);
            const L = Math.abs(x2 - x1) * 1.6 + Math.abs(h) * 2;
            return (
              <g key={i}>
                <path d={`M${x1},${Y} C${x1},${Y + h} ${x2},${Y + h} ${x2},${Y}`} fill="none" stroke={GOLD} strokeWidth={4} strokeDasharray={`${L * k} 9999`} opacity={0.9} />
                {lab && <text x={(x1 + x2) / 2} y={Y + h * 0.78 + (up ? -8 : 28)} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill={FLAME} opacity={range(t, at + 0.25, at + 0.45)}>{lab}</text>}
              </g>
            );
          })}
          {NODES.map((n, i) => {
            const k = backOut(range(t, E.map - 0.45 + i * 0.05, E.map - 0.15 + i * 0.05), 2);
            return (
              <g key={n.id} transform={`translate(${pos[n.id]} ${Y})`}>
                <circle r={9 * k} fill={GOLD} />
                <text x={0} y={n.up ? -24 : 52} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={34} fill={PAPER} opacity={k}>{n.cn}</text>
              </g>
            );
          })}
        </g>
      </Svg>
      <Line t={t} at={E.map + 0.1} out={E.lamp} text="2400 年，同一个问题：" x={960} y={130} size={52} color={PAPER} anchor="center" stagger={0.02} />
      <Line t={t} at={E.map + 0.5} out={E.lamp} text="怎样活，才算一个「人」？" x={960} y={200} size={72} color={GOLD} anchor="center" stagger={0.035} />
      <Final t={t} />
    </Fill>
  );
};

// back to the noon street: Diogenes turns, the lamp comes up to the lens; the last question; the flame alone in the dark
const Final: React.FC<{ t: number }> = ({ t }) => {
  const E = PJ.end;
  if (t < E.lamp - 0.6) return null;
  const I = PJ.iris.find((i) => i.t === E.lamp)!;
  const k = eInOut(range(t, E.lamp - I.dur, E.lamp)), R = Math.hypot(1920, 1080), r = 6 + R * k;
  const near = eInOut(range(t, E.lamp + 0.4, E.q + 0.2));          // the lamp is lifted toward us
  const dark = eInOut(range(t, E.title - 0.2, E.title + 0.6));
  const S = lerp(1.1, 2.4, near), gx = lerp(980, 1500 - 214 * 2.4, near), gy = lerp(660, 480 + 20 * 2.4, near);
  const fx = gx + 214 * S, fy = gy - 20 * S;
  return (
    <div style={{ position: "absolute", inset: 0, clipPath: t < E.lamp ? `circle(${r}px at ${I.x}px ${I.y}px)` : undefined }}>
      <div style={{ position: "absolute", inset: 0, background: PAPER, opacity: 1 - dark }} />
      <div style={{ position: "absolute", inset: 0, background: NIGHT, opacity: dark }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g opacity={1 - dark}>
          <Glow x={1720} y={150} r={520} id="fsun" c="#FFFFFF" />
          <Rays x={1720} y={150} r={1400} t={t} c="#FFF3D0" o={0.4} n={24} />
          <circle cx={1720} cy={150} r={90} fill="#FFFDF4" />
          <rect x={0} y={860} width={1920} height={220} fill="#E4D2AC" />
          <Street t={t} c={INK} look={1} seed={3} />
        </g>
        <Glow x={fx} y={fy - 20} r={300 + 300 * near} id="fflame" o={0.6 + 0.4 * dark} />
        <g transform={`translate(${gx} ${gy}) scale(${S})`} opacity={1 - dark}><Diogenes c={INK} b={PAPER} t={t} /></g>
        {dark > 0 && <g transform={`translate(${fx} ${fy})`} opacity={dark}><Flame t={t} s={2.2} /></g>}
      </svg>
      <Line t={t} at={E.line} out={E.q} text="「我在找一个人。」" x={120} y={180} size={104} color="#B3101F" stagger={0.05} />
      <Line t={t} at={E.q} out={E.title + 0.1} text="看透之后——" x={110} y={170} size={92} color={INK} stagger={0.05} glow="rgba(242,230,204,0.9)" />
      <Line t={t} at={E.q + 0.45} out={E.title + 0.1} text="你点灯，" x={110} y={300} size={110} color="#B3101F" stagger={0.06} glow="rgba(242,230,204,0.9)" />
      <Line t={t} at={E.q + 0.75} out={E.title + 0.1} text="还是熄灯？" x={110} y={430} size={110} color={INK} stagger={0.06} glow="rgba(242,230,204,0.9)" />
      <Line t={t} at={E.title + 0.2} out={61} text="提灯的人" x={960} y={760} size={96} color={PAPER} anchor="center" stagger={0.08} tracking={14} />
      <Line t={t} at={E.title + 0.5} out={61} text="SOCRATES → FOUCAULT · 2400 YEARS IN 60 SECONDS" x={960} y={890} size={26} color={GOLD} anchor="center" font={MONO} weight={700} stagger={0.006} tracking={4} />
    </div>
  );
};
export { Dust, SEC, clamp01, rnd };
