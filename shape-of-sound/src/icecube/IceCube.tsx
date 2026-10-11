import React from "react";
import { Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { C, clamp01, eIn, eInOut, eOut, FONT_CN, FONT_EN, FONT_UI, Kinetic, lerp, range, useSpring, useT } from "../theme";
import J from "./icecube.json";

const VW = 1080, VH = 1920, FPS = J.fps, X = 0.3;
const Q = J.cues;
type Sec = (typeof J.sections)[number];
const SEC = Object.fromEntries(J.sections.map(s => [s.id, s])) as Record<string, Sec>;
const NAVY = "#10195A", DEEP = "#070B24", ICE = "#7FE3FF";

const Abs: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <div style={{ position: "absolute", inset: 0, ...style }}>{children}</div>;
const hash = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const hex = (c: string) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp01(k)))).join(",")})`; };
const RAINBOW = ["#FF2E3B", "#FF6B2C", "#FFD23F", "#00D9A3", "#00E5FF", "#5B7CFF"];
const rainbow = (k: number) => { const x = clamp01(k) * (RAINBOW.length - 1), i = Math.min(RAINBOW.length - 2, Math.floor(x)); return mix(RAINBOW[i], RAINBOW[i + 1], x - i); };

// ───────────── shared bits
const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={VW} height={VH} style={{ position: "absolute", inset: 0, opacity: 0.07, mixBlendMode: "overlay", zIndex: 100 }}>
      <filter id="gi"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 12} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#gi)" />
    </svg>
  );
};
const Dots: React.FC<{ color: string; opacity?: number }> = ({ color, opacity = 0.12 }) => {
  const t = useT(), off = (t * 16) % 44;
  return (
    <svg width={VW} height={VH} style={{ position: "absolute", inset: 0, opacity }}>
      <defs><pattern id={"id" + color.slice(1)} width={44} height={44} patternUnits="userSpaceOnUse" patternTransform={`translate(${off} ${off})`}><circle cx={5} cy={5} r={3} fill={color} /></pattern></defs>
      <rect width="100%" height="100%" fill={`url(#id${color.slice(1)})`} />
    </svg>
  );
};
const Progress: React.FC = () => {
  const { fps } = useVideoConfig(), t = useCurrentFrame() / fps;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 70, display: "flex", gap: 10, zIndex: 90 }}>
      {J.sections.map(s => (
        <div key={s.id} style={{ flex: s.end - s.start, height: 8, borderRadius: 4, background: "rgba(120,120,120,0.35)", overflow: "hidden", boxShadow: "0 0 0 2px rgba(0,0,0,0.12)" }}>
          <div style={{ width: `${range(t, s.start, s.end) * 100}%`, height: "100%", background: "#FFFFFF" }} />
        </div>
      ))}
    </div>
  );
};
// a section: a diagonal colour slab wipes in over the previous one, then the content starts at its nominal time
const Section: React.FC<React.PropsWithChildren<{ s: Sec; first?: boolean }>> = ({ s, first, children }) => {
  const from = first ? s.start : s.start - X;
  return (
    <Sequence name={s.id} from={Math.round(from * FPS)} durationInFrames={Math.round((s.end - from) * FPS)}>
      <WipeIn bg={s.bg} skip={first}>
        <Sequence from={first ? 0 : Math.round(X * FPS)} layout="none">{children}</Sequence>
      </WipeIn>
    </Sequence>
  );
};
const WipeIn: React.FC<React.PropsWithChildren<{ bg: string; skip?: boolean }>> = ({ bg, skip, children }) => {
  const w = skip ? 1 : eOut(range(useT(), 0, X));
  return <Abs style={{ clipPath: `polygon(0 ${(1 - w) * 110}%, 100% ${(1 - w) * 110 - 8}%, 100% 100%, 0 100%)`, background: bg, overflow: "hidden" }}>{children}</Abs>;
};
// a caption line revealed by a sliding mask
const Say: React.FC<{ at: number; out?: number; text: string; sub?: string; color: string; y: number; size?: number; center?: boolean; weight?: number }> = ({
  at, out = 99, text, sub, color, y, size = 56, center, weight = 900,
}) => {
  const t = useT();
  if (t < at - 0.05 || t > out + 0.4) return null;
  const a = eOut(range(t, at, at + 0.45)), e = eIn(range(t, out, out + 0.3));
  return (
    <div style={{ position: "absolute", left: 70, right: 110, top: y, opacity: 1 - e, translate: `0px ${(1 - a) * 30 - e * 20}px`, textAlign: center ? "center" : "left" }}>
      <div style={{ fontFamily: FONT_CN, fontWeight: weight, fontSize: size, color, lineHeight: 1.3, whiteSpace: "pre-line", clipPath: `inset(-20% ${(1 - a) * 100}% -20% 0)` }}>{text}</div>
      {sub && <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: size * 0.5, letterSpacing: 3, color, opacity: 0.7 * a, marginTop: 10 }}>{sub}</div>}
    </div>
  );
};
const Burst: React.FC<{ x: number; y: number; at: number; t: number; color: string; r?: number; w?: number }> = ({ x, y, at, t, color, r = 90, w = 6 }) => {
  const p = range(t, at, at + 0.55);
  if (p <= 0 || p >= 1) return null;
  return <circle cx={x} cy={y} r={10 + r * eOut(p)} fill="none" stroke={color} strokeWidth={w * (1 - p) + 1} opacity={1 - p} />;
};

// ───────────── 1 · hook: 100 trillion neutrinos pass through you every second
const STREAKS = [...Array(150)].map((_, i) => ({ x: hash(i) * (VW + 500) - 250, ph: hash(i + 500) * 4000, sp: 1500 + hash(i + 900) * 1500, len: 90 + hash(i + 1300) * 260, yel: i % 7 === 0, w: i % 5 === 0 ? 4 : 2 }));
const fmt = (n: number) => Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const Hook: React.FC = () => {
  const t = useT(), sp = useSpring(), q = Q.hook;
  const rain = eOut(range(t, 0, 0.8));
  const cnt = eInOut(range(t, q.count[0], q.count[1]));
  const big = sp(q.count[1], { damping: 9 });
  const spark = range(t, q.spark, q.spark + 0.7);
  return (
    <Abs>
      <Dots color="#FFFFFF" opacity={0.08} />
      <svg width={VW} height={VH} style={{ position: "absolute" }}>
        {/* body */}
        <g opacity={eOut(range(t, 0.1, 0.7))}>
          <circle cx={540} cy={960} r={100} fill="#16161D" stroke="#FFFFFF" strokeWidth={6} />
          <path d="M290 1440 C290 1230 380 1110 540 1110 C700 1110 790 1230 790 1440 Z" fill="#16161D" stroke="#FFFFFF" strokeWidth={6} />
        </g>
        {/* neutrinos raining straight through */}
        {STREAKS.map((s, i) => {
          const y = ((s.ph + t * s.sp) % (VH + 800)) - 400, x = s.x + y * 0.18;
          return <line key={i} x1={x} y1={y} x2={x + s.len * 0.18} y2={y + s.len} stroke={s.yel ? C.yellow : ICE} strokeWidth={s.w} strokeLinecap="round" opacity={rain * (s.yel ? 0.9 : 0.55)} />;
        })}
        {/* the one in a lifetime that hits */}
        {spark > 0 && spark < 1 && <>
          <circle cx={540} cy={1290} r={18 + 60 * eOut(spark)} fill="#FFFFFF" opacity={(1 - spark) * 0.9} />
          <circle cx={540} cy={1290} r={30 + 200 * eOut(spark)} fill="none" stroke={C.pink} strokeWidth={8 * (1 - spark)} />
        </>}
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 210, display: "flex", justifyContent: "center" }}>
        <Kinetic text="每一秒" at={0.15} size={96} color="#FFFFFF" stagger={0.08} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 360, height: 230, display: "flex", justifyContent: "center", alignItems: "center" }}>
        {t < q.count[1] ? (
          <div style={{ fontFamily: FONT_EN, fontSize: 64, color: C.yellow, opacity: eOut(range(t, q.count[0] - 0.2, q.count[0])) }}>{fmt(Math.pow(10, 14 * cnt))}</div>
        ) : (
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, scale: `${lerp(1.35, 1, Math.min(1, big))}`, color: C.yellow }}>
            <span style={{ fontFamily: FONT_EN, fontSize: 220, lineHeight: 1 }}>100</span>
            <span style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 150, lineHeight: 1 }}>万亿</span>
          </div>
        )}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 620, display: "flex", justifyContent: "center" }}>
        <Kinetic text="个中微子穿过你的身体" at={q.line} size={66} color="#FFFFFF" stagger={0.03} />
      </div>
      <Say at={q.calm} text="你毫无察觉。" color="#FFFFFF" y={1480} size={60} center />
      <Say at={q.life} text="一生中，只有一两个会撞上你" color={C.pink} y={1570} size={52} center />
    </Abs>
  );
};

// ───────────── 2 · ghost particle: light and protons stop at the Earth, the neutrino goes straight through
const Ghost: React.FC = () => {
  const t = useT(), sp = useSpring(), q = Q.ghost, ink = "#24061A";
  const EX = 560, EY = 1130, ER = 230;
  const lanes = [EY - 110, EY, EY + 110];
  const hitX = (dy: number) => EX - Math.sqrt(ER * ER - dy * dy);
  const earth = sp(0.5, { damping: 12 });
  const lp = range(t, q.light[0], q.light[1]), lx = lerp(-60, hitX(110), lp), lGone = range(t, q.light[1], q.light[1] + 0.4);
  const pp = range(t, q.proton[0], q.proton[1]), px = lerp(-60, hitX(0), pp), pGone = range(t, q.proton[1], q.proton[1] + 0.4);
  const np = range(t, q.neutrino[0], q.neutrino[1]), nx = lerp(-60, 1160, np);
  const wave = [...Array(60)].map((_, k) => { const x = lx - 420 + k * 7; return [Math.max(-60, x), lanes[0] + Math.sin((x - t * 600) / 9) * 16 * (x > -60 ? 1 : 0)]; });
  const chips = ["不带电", "几乎没有质量", "能直穿地球"];
  const labels: [string, number, number, string][] = [["光 · 被挡住", lanes[0], q.light[1], C.yellow], ["质子 · 被挡住", lanes[1], q.proton[1], "#FFFFFF"], ["中微子 · 穿过", lanes[2], q.neutrino[0] + 0.9, ink]];
  return (
    <Abs>
      <Dots color={ink} />
      <div style={{ position: "absolute", left: 70, top: 200 }}>
        <Kinetic text="幽灵粒子" at={0.05} size={170} color={ink} stagger={0.07} />
      </div>
      <div style={{ position: "absolute", left: 70, top: 420, display: "flex", alignItems: "center", gap: 26, opacity: eOut(range(t, q.nu, q.nu + 0.3)), translate: `${(1 - eOut(range(t, q.nu, q.nu + 0.4))) * -40}px 0px` }}>
        <div style={{ width: 150, height: 150, borderRadius: 75, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Noto Sans SC', serif", fontWeight: 900, fontSize: 120, color: ink, lineHeight: 1, paddingBottom: 14, boxSizing: "border-box", scale: `${Math.min(1.15, sp(q.nu))}` }}>ν</div>
        <div>
          <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 76, color: ink, lineHeight: 1 }}>中微子</div>
          <div style={{ fontFamily: FONT_EN, fontSize: 38, color: ink, letterSpacing: 6, marginTop: 10 }}>NEUTRINO</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, top: 640, display: "flex", gap: 18 }}>
        {chips.map((c, k) => { const s = sp(q.chips[k]); return <div key={c} style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 44, color: "#FFFFFF", background: ink, padding: "14px 30px", borderRadius: 50, opacity: clamp01(s * 3), scale: `${Math.min(1.1, s)}` }}>{c}</div>; })}
      </div>
      <svg width={VW} height={VH} style={{ position: "absolute" }}>
        {/* layered Earth */}
        <g style={{ transformOrigin: `${EX}px ${EY}px`, scale: `${earth}` }}>
          <circle cx={EX} cy={EY} r={ER} fill={C.blue} stroke={ink} strokeWidth={7} />
          <circle cx={EX} cy={EY} r={ER * 0.74} fill={C.orange} stroke={ink} strokeWidth={5} />
          <circle cx={EX} cy={EY} r={ER * 0.45} fill={C.yellow} stroke={ink} strokeWidth={5} />
          <circle cx={EX} cy={EY} r={ER * 0.2} fill="#FFFFFF" stroke={ink} strokeWidth={5} />
          <circle cx={EX} cy={EY} r={ER + 34} fill="none" stroke={ink} strokeWidth={4} strokeDasharray="6 18" style={{ transformOrigin: `${EX}px ${EY}px`, rotate: `${t * 25}deg` }} />
        </g>
        <text x={EX + ER + 20} y={EY - ER - 10} fontFamily={FONT_CN} fontWeight={900} fontSize={38} fill={ink} opacity={eOut(range(t, 0.8, 1.2))}>地球</text>
        {/* light: a wave packet that dies at the surface */}
        {lp > 0 && <polyline points={wave.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke={C.yellow} strokeWidth={8} strokeLinecap="round" opacity={1 - lGone} />}
        <Burst x={hitX(110)} y={lanes[0]} at={q.light[1]} t={t} color={C.yellow} />
        {/* proton */}
        {pp > 0 && pGone < 1 && <g opacity={1 - pGone}>
          <circle cx={px} cy={lanes[1]} r={26} fill="#FFFFFF" stroke={ink} strokeWidth={5} />
          <text x={px} y={lanes[1] + 12} textAnchor="middle" fontFamily={FONT_EN} fontSize={32} fill={ink}>p</text>
        </g>}
        <Burst x={hitX(0)} y={lanes[1]} at={q.proton[1]} t={t} color="#FFFFFF" />
        {/* neutrino: straight through */}
        {np > 0 && <>
          <line x1={-60} y1={lanes[2]} x2={nx} y2={lanes[2]} stroke={ink} strokeWidth={5} strokeDasharray="14 12" opacity={0.7} />
          <circle cx={nx} cy={lanes[2]} r={24} fill={ink} />
          <text x={nx} y={lanes[2] + 11} textAnchor="middle" fontFamily="'Noto Sans SC', serif" fontWeight={900} fontSize={34} fill="#FFFFFF">ν</text>
        </>}
        {labels.map(([s, y, at, col], k) => (
          <g key={k} opacity={eOut(range(t, at, at + 0.3))}>
            <text x={70} y={y - 40} fontFamily={FONT_CN} fontWeight={900} fontSize={34} fill={col}>{s}</text>
          </g>
        ))}
      </svg>
      <Say at={4.6} text="几乎不与任何物质发生作用" color={ink} y={1430} size={56} />
    </Abs>
  );
};

// ───────────── 3 · why: light is blocked, charged particles are bent, only neutrinos point back
const Messenger: React.FC = () => {
  const t = useT(), sp = useSpring(), q = Q.messenger;
  const SX = 540, SY = 570, HZ = 1340;
  const src = sp(0.2, { damping: 12 });
  const lp = range(t, q.light[0], q.light[1]), rp = range(t, q.ray[0], q.ray[1]), np = range(t, q.nu[0], q.nu[1]);
  const back = range(t, q.nu[1] + 0.25, q.nu[1] + 1.0);
  const pathStyle = (p: number) => ({ strokeDasharray: "1 1", strokeDashoffset: 1 - p });
  return (
    <Abs>
      <Dots color="#FFFFFF" opacity={0.07} />
      <div style={{ position: "absolute", left: 70, top: 200 }}>
        <Kinetic text="为什么偏偏要抓它？" at={0.05} size={92} color="#FFFFFF" stagger={0.04} />
      </div>
      <svg width={VW} height={VH} style={{ position: "absolute" }}>
        {/* the horizon of Earth */}
        <circle cx={540} cy={HZ + 1000} r={1000} fill={C.mint} stroke={C.ink} strokeWidth={6} />
        {/* magnetic field loops */}
        {[0, 1, 2].map(k => <ellipse key={k} cx={830} cy={1010} rx={90 + k * 55} ry={50 + k * 32} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeDasharray="8 12" opacity={0.3 * eOut(range(t, 0.6, 1.2))} style={{ transformOrigin: "830px 1010px", rotate: `${-25 + t * (k % 2 ? 12 : -12)}deg` }} />)}
        <text x={890} y={880} fontFamily={FONT_UI} fontWeight={700} fontSize={30} fill="#FFFFFF" opacity={0.6 * eOut(range(t, 0.8, 1.2))}>磁场 B</text>
        {/* dust cloud */}
        <g opacity={eOut(range(t, 0.5, 1.0))}>
          {[...Array(11)].map((_, k) => <circle key={k} cx={405 + Math.cos(k * 2.1) * (30 + (k % 3) * 22)} cy={1000 + Math.sin(k * 2.1) * (22 + (k % 4) * 12)} r={38 + (k % 3) * 12} fill={k % 2 ? "#9C8CE0" : "#7B6CC8"} opacity={0.85} />)}
          <text x={300} y={1120} fontFamily={FONT_UI} fontWeight={700} fontSize={28} fill="#FFFFFF" opacity={0.7}>尘埃 DUST</text>
        </g>
        {/* the three messengers */}
        <path d={`M${SX} ${SY + 40} L405 990`} pathLength={1} stroke={C.yellow} strokeWidth={10} strokeLinecap="round" fill="none" style={pathStyle(lp)} />
        <Burst x={405} y={985} at={q.light[1]} t={t} color={C.yellow} r={110} />
        <path d={`M${SX} ${SY + 40} L640 830 C700 990 960 900 900 1040 C860 1180 690 1140 770 1240 C830 1310 980 1290 1030 1340`} pathLength={1} stroke={C.pink} strokeWidth={9} strokeLinecap="round" fill="none" style={pathStyle(rp)} />
        <path d={`M${SX} ${SY + 40} L${SX} ${HZ}`} pathLength={1} stroke={ICE} strokeWidth={12} strokeLinecap="round" fill="none" style={pathStyle(np)} />
        <Burst x={SX} y={HZ} at={q.nu[1]} t={t} color={C.ink} r={130} w={8} />
        {/* the neutrino line points back at its source */}
        {back > 0 && <line x1={SX} y1={HZ - 10} x2={SX} y2={lerp(HZ - 10, SY + 60, eOut(back))} stroke={C.yellow} strokeWidth={6} strokeDasharray="4 16" strokeLinecap="round" />}
        {/* the source: a black hole with a disc and twin jets */}
        <g style={{ transformOrigin: `${SX}px ${SY}px`, scale: `${src}` }}>
          {[1, -1].map(s => <polygon key={s} points={`${SX},${SY} ${SX + s * 150 - 18},${SY - s * 130} ${SX + s * 150 + 18},${SY - s * 110}`} fill={ICE} opacity={0.6 + 0.3 * Math.sin(t * 9)} />)}
          <ellipse cx={SX} cy={SY} rx={120} ry={30} fill="none" stroke={C.orange} strokeWidth={12} strokeDasharray="30 14" style={{ transformOrigin: `${SX}px ${SY}px`, rotate: "-12deg" }} strokeDashoffset={-t * 120} />
          <circle cx={SX} cy={SY} r={44} fill="#05051A" stroke="#FFFFFF" strokeWidth={4} />
        </g>
        <text x={SX - 330} y={SY + 8} fontFamily={FONT_CN} fontWeight={900} fontSize={32} fill="#FFFFFF" opacity={eOut(range(t, 0.5, 0.9))}>黑洞 · 耀变体</text>
        {/* labels */}
        <g opacity={eOut(range(t, q.light[1], q.light[1] + 0.3))}>
          <text x={70} y={1210} fontFamily={FONT_CN} fontWeight={900} fontSize={42} fill={C.yellow}>光</text>
          <text x={70} y={1258} fontFamily={FONT_CN} fontWeight={700} fontSize={32} fill="#FFFFFF">被尘埃挡住</text>
        </g>
        <g opacity={eOut(range(t, q.ray[1] - 0.6, q.ray[1] - 0.3))}>
          <text x={760} y={720} fontFamily={FONT_CN} fontWeight={900} fontSize={42} fill={C.pink}>带电粒子</text>
          <text x={760} y={768} fontFamily={FONT_CN} fontWeight={700} fontSize={32} fill="#FFFFFF">被磁场扭弯</text>
        </g>
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1400, display: "flex", justifyContent: "center" }}>
        <Kinetic text="只有它，能指回源头" at={q.nu[1] + 0.15} size={80} color={C.ink} stagger={0.04} />
      </div>
      <Say at={q.nu[1] + 0.7} text="中微子：笔直飞来的宇宙信使" color={C.ink} y={1530} size={44} weight={700} center />
    </Abs>
  );
};

// ───────────── 4 · the idea: use the Antarctic ice
const Idea: React.FC = () => {
  const t = useT(), sp = useSpring(), q = Q.idea, ink = C.ink;
  const GX = 540, GY = 950, GR = 280;
  const globe = sp(0.3, { damping: 12 }), pin = sp(q.pin, { damping: 9 });
  return (
    <Abs>
      <Dots color={ink} />
      <div style={{ position: "absolute", left: 70, top: 200 }}>
        <Kinetic text="可它太难抓了" at={0.05} size={120} color={ink} stagger={0.05} />
      </div>
      <Say at={0.6} text="绝大多数一穿而过，探测器必须巨大" color={ink} y={370} size={44} weight={700} />
      <svg width={VW} height={VH} style={{ position: "absolute" }}>
        <defs><clipPath id="globe"><circle cx={GX} cy={GY} r={GR} /></clipPath></defs>
        <g style={{ transformOrigin: `${GX}px ${GY}px`, scale: `${globe}` }}>
          <circle cx={GX} cy={GY} r={GR} fill={C.blue} stroke={ink} strokeWidth={8} />
          <g clipPath="url(#globe)">
            {[-0.6, -0.3, 0, 0.3, 0.6].map(k => <ellipse key={k} cx={GX} cy={GY + k * GR + 40 * k} rx={GR * Math.sqrt(1 - k * k)} ry={GR * 0.16} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.45} />)}
            {[0, 1, 2, 3, 4, 5].map(k => <ellipse key={k} cx={GX} cy={GY} rx={GR * Math.abs(Math.cos(k * Math.PI / 6 + t * 0.7))} ry={GR} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.45} />)}
            {/* Antarctica: a white cap near the bottom */}
            <ellipse cx={GX} cy={GY + GR * 0.86} rx={GR * 0.62} ry={GR * 0.24} fill="#FFFFFF" stroke={ink} strokeWidth={5} />
          </g>
        </g>
        {/* pin */}
        <g opacity={clamp01(pin * 4)} style={{ translate: `0px ${(1 - Math.min(1, pin)) * -260}px` }}>
          <path d={`M${GX} ${GY + GR * 0.86} C${GX - 30} ${GY + GR * 0.86 - 60} ${GX - 52} ${GY + GR * 0.86 - 90} ${GX - 52} ${GY + GR * 0.86 - 120} A52 52 0 1 1 ${GX + 52} ${GY + GR * 0.86 - 120} C${GX + 52} ${GY + GR * 0.86 - 90} ${GX + 30} ${GY + GR * 0.86 - 60} ${GX} ${GY + GR * 0.86} Z`} fill={C.pink} stroke={ink} strokeWidth={6} />
          <circle cx={GX} cy={GY + GR * 0.86 - 122} r={18} fill="#FFFFFF" stroke={ink} strokeWidth={5} />
        </g>
        <Burst x={GX} y={GY + GR * 0.86} at={q.pin + 0.15} t={t} color={ink} r={120} />
        <g opacity={eOut(range(t, q.pin + 0.3, q.pin + 0.6))}>
          <rect x={GX + 80} y={GY + GR * 0.86 - 150} width={180} height={64} rx={32} fill={ink} />
          <text x={GX + 170} y={GY + GR * 0.86 - 106} textAnchor="middle" fontFamily={FONT_CN} fontWeight={900} fontSize={36} fill="#FFFFFF">南极点</text>
        </g>
      </svg>
      <Say at={1.5} text="哈尔岑的点子：" color={ink} y={1330} size={50} />
      <div style={{ position: "absolute", left: 70, top: 1410 }}>
        <Kinetic text="直接用南极的冰" at={q.hit} size={118} color={ink} stagger={0.045} />
      </div>
      <Say at={2.7} text="冰下两千米：清澈、漆黑、稳定" color={ink} y={1570} size={44} weight={700} />
    </Abs>
  );
};

// ───────────── 5+6 · the detector: cross-section → isometric cube → lights off → one event
// geometry in metres: 86 strings on a 125 m hexagonal grid (radius-5 hexagon minus five corners), 60 sensors each from 1450 to 2450 m
const STR: [number, number][] = [];
for (let a = -5; a <= 5; a++) for (let b = -5; b <= 5; b++) {
  if (Math.abs(a + b) > 5) continue;
  const corner = Math.max(Math.abs(a), Math.abs(b), Math.abs(a + b)) === 5 && (a === 0 || b === 0 || a + b === 0);
  if (corner && !(a === -5 && b === 5)) continue;
  STR.push([125 * (a + b / 2), 125 * (b * Math.sqrt(3) / 2)]);
}
const HEXR = [...Array(6)].map((_, i) => [625 * Math.cos(i * Math.PI / 3), 625 * Math.sin(i * Math.PI / 3)] as [number, number]);
const DOMZ = [...Array(60)].map((_, j) => -j * 1000 / 59);
const norm3 = (v: number[]) => { const l = Math.hypot(...v); return v.map(x => x / l); };
const V0 = [-120, 80, -380], DIR = norm3([0.55, -0.35, -0.75]), TRK = 820;
type Lit = { i: number; j: number; u: number; d: number; b: number };
const LIT: Lit[] = [];
STR.forEach(([x, y], i) => DOMZ.forEach((z, j) => {
  const p = [x - V0[0], y - V0[1], z - V0[2]];
  const u = Math.max(0, Math.min(TRK, p[0] * DIR[0] + p[1] * DIR[1] + p[2] * DIR[2]));
  const d = Math.hypot(p[0] - DIR[0] * u, p[1] - DIR[1] * u, p[2] - DIR[2] * u);
  const b = Math.exp(-d / 50) + 0.7 * Math.exp(-Math.hypot(...p) / 60);
  if (b > 0.1) LIT.push({ i, j, u, d, b: Math.min(1.5, b) });
}));
const TOP = 700, SC = 0.52;

const Detector: React.FC = () => {
  const t = useT(), sp = useSpring(), q = Q.detector;
  const secA = 1 - eInOut(range(t, q.iso - 0.3, q.iso + 0.3));
  const dark = eInOut(range(t, q.dark, q.dark + 0.7));
  const th = 0.5 + t * 0.03, ct = Math.cos(th), st = Math.sin(th);
  const proj = (x: number, y: number, z: number): [number, number] => { const xr = x * ct - y * st, yr = x * st + y * ct; return [540 + (xr - yr) * 0.866 * SC, TOP + (xr + yr) * 0.5 * SC - z * SC]; };
  const P = (u: number) => proj(V0[0] + DIR[0] * u, V0[1] + DIR[1] * u, V0[2] + DIR[2] * u);
  const ink = mix(NAVY, "#FFFFFF", dark);

  // ── A · cross-section
  const SY = 640, k = 0.36, yD = (m: number) => SY + m * k;
  const cnt = eOut(range(t, 0.5, 3.4));
  const xs = [...Array(9)].map((_, i) => 230 + i * 82);

  // ── B · isometric strings grow from the centre outwards
  const grow = (i: number) => eInOut(range(t, q.iso + Math.hypot(...STR[i]) / 625 * 0.9, q.iso + 0.8 + Math.hypot(...STR[i]) / 625 * 0.9));
  const isoOn = t > q.iso - 0.1;
  const strCol = mix(NAVY, ICE, dark), domCol = mix(NAVY, ICE, dark);

  // ── D · the event
  const nuP = range(t, q.nu, q.hit), mu = range(t, q.hit, q.muEnd);
  const head = P(TRK * mu), tail = P(Math.max(0, TRK * mu - 230));
  const dx = head[0] - tail[0], dy = head[1] - tail[1], dl = Math.hypot(dx, dy) || 1, nxp = -dy / dl, nyp = dx / dl, cw = 230 * Math.tan(41 * Math.PI / 180) * SC;
  const arrow = eInOut(range(t, q.arrow, q.arrow + 0.8));
  const SRCU = -1000, srcP = P(SRCU), endP = P(TRK);
  const arrHead = [lerp(endP[0], srcP[0], arrow), lerp(endP[1], srcP[1], arrow)];
  const srcS = sp(q.source, { damping: 8 });

  return (
    <Abs>
      <Abs style={{ background: DEEP, opacity: dark }} />
      <Dots color={NAVY} opacity={0.1 * (1 - dark)} />
      {/* header */}
      <div style={{ position: "absolute", left: 70, top: 190, display: "flex", alignItems: "baseline", gap: 24, opacity: 1 - dark }}>
        <Kinetic text="冰立方" at={0.05} size={150} color={NAVY} stagger={0.07} />
        <div style={{ fontFamily: FONT_EN, fontSize: 30, color: C.blue, letterSpacing: 3, opacity: eOut(range(t, 0.4, 0.8)) }}>ICECUBE</div>
      </div>
      {/* counters */}
      <div style={{ position: "absolute", left: 70, right: 70, top: 400, display: "flex", gap: 60, opacity: secA }}>
        {[[86, "根线缆"], [5160, "个光学探测器"]].map(([n, l], i) => (
          <div key={i} style={{ opacity: eOut(range(t, 0.3 + i * 0.2, 0.7 + i * 0.2)) }}>
            <div style={{ fontFamily: FONT_EN, fontSize: 120, color: C.blue, lineHeight: 1 }}>{Math.round((n as number) * cnt)}</div>
            <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 40, color: NAVY, marginTop: 8 }}>{l}</div>
          </div>
        ))}
      </div>
      <svg width={VW} height={VH} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CFEFFF" /><stop offset="0.72" stopColor="#3F6BFF" /><stop offset="1" stopColor="#2A49C8" /></linearGradient>
          <linearGradient id="cone2" gradientUnits="userSpaceOnUse" x1={tail[0]} y1={tail[1]} x2={head[0]} y2={head[1]}><stop offset="0" stopColor={ICE} stopOpacity={0.05} /><stop offset="1" stopColor={ICE} stopOpacity={0.8} /></linearGradient>
        </defs>
        {/* A · cross-section */}
        {secA > 0.01 && <g opacity={secA} style={{ transformOrigin: "540px 1100px", scale: `${lerp(0.9, 1, secA)}` }}>
          <rect x={0} y={SY} width={VW} height={VH - SY} fill="url(#ice)" opacity={eOut(range(t, 0, 0.4))} />
          <line x1={0} y1={SY} x2={VW} y2={SY} stroke={NAVY} strokeWidth={6} />
          {/* station + Eiffel tower for scale */}
          <rect x={560} y={SY - 46} width={120} height={46} fill={NAVY} />
          <rect x={600} y={SY - 70} width={8} height={24} fill={NAVY} />
          <text x={620} y={SY - 84} textAnchor="middle" fontFamily={FONT_CN} fontWeight={700} fontSize={26} fill={NAVY}>南极点站</text>
          <path d={`M940 ${SY} L966 ${SY - 119} L974 ${SY - 119} L1000 ${SY} M948 ${SY - 40} L992 ${SY - 40} M956 ${SY - 78} L984 ${SY - 78}`} stroke={NAVY} strokeWidth={5} fill="none" />
          <text x={970} y={SY - 162} textAnchor="middle" fontFamily={FONT_CN} fontWeight={700} fontSize={24} fill={NAVY}>埃菲尔铁塔</text>
          <text x={970} y={SY - 132} textAnchor="middle" fontFamily={FONT_UI} fontWeight={700} fontSize={24} fill={NAVY}>330 m</text>
          {/* depth ruler */}
          {[0, 1450, 2450].map(m => (
            <g key={m}>
              <line x1={70} y1={yD(m)} x2={150} y2={yD(m)} stroke={NAVY} strokeWidth={4} />
              <text x={70} y={yD(m) - 12} fontFamily={FONT_UI} fontWeight={700} fontSize={30} fill={m ? "#FFFFFF" : NAVY}>{m} m</text>
            </g>
          ))}
          <rect x={196} y={yD(1450)} width={720} height={yD(2450) - yD(1450)} fill="#FFFFFF" opacity={0.1 * eOut(range(t, 2.6, 3.2))} />
          {xs.map((x, i) => {
            const s0 = q.drop0 + i * q.dropStep, p = eInOut(range(t, s0, s0 + 0.6)), deep = 2450 * p;
            return (
              <g key={i}>
                {p > 0 && <line x1={x} y1={SY} x2={x} y2={yD(deep)} stroke={NAVY} strokeWidth={3} />}
                {DOMZ.map((z, j) => -z + 1450 <= deep && <circle key={j} cx={x} cy={yD(1450 - z)} r={3.2} fill={NAVY} />)}
                {p > 0 && p < 1 && <rect x={x - 9} y={yD(deep) - 16} width={18} height={32} rx={8} fill={ICE} stroke={NAVY} strokeWidth={3} />}
              </g>
            );
          })}
          <g opacity={eOut(range(t, 3.0, 3.4))}>
            <line x1={940} y1={yD(1450)} x2={940} y2={yD(2450)} stroke="#FFFFFF" strokeWidth={4} />
            <text x={956} y={yD(1950) + 12} fontFamily={FONT_UI} fontWeight={700} fontSize={34} fill="#FFFFFF">1 km</text>
          </g>
        </g>}

        {/* B · isometric hexagonal prism */}
        {isoOn && <g opacity={eOut(range(t, q.iso - 0.1, q.iso + 0.3))}>
          {[0, -1000].map(z => <polygon key={z} points={HEXR.map(([x, y]) => proj(x, y, z).join(",")).join(" ")} fill={z ? "none" : mix("#2D5BFF", ICE, dark)} fillOpacity={0.08} stroke={ink} strokeOpacity={0.5} strokeWidth={2.5} />)}
          {HEXR.map(([x, y], i) => { const a = proj(x, y, 0), b = proj(x, y, -1000); return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={ink} strokeOpacity={0.35} strokeWidth={2} />; })}
          {STR.map(([x, y], i) => {
            const g = grow(i);
            if (g <= 0) return null;
            const a = proj(x, y, 260), b = proj(x, y, 0), c = proj(x, y, -1000 * g);
            return (
              <g key={i}>
                <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={strCol} strokeWidth={1.4} opacity={0.3 * g} />
                <line x1={b[0]} y1={b[1]} x2={c[0]} y2={c[1]} stroke={strCol} strokeWidth={1.4} opacity={0.55} />
                {DOMZ.map((z, j) => { if (j / 59 > g) return null; const p = proj(x, y, z); return <circle key={j} cx={p[0]} cy={p[1]} r={2} fill={domCol} opacity={lerp(0.85, 0.45, dark)} />; })}
              </g>
            );
          })}
          {/* the ghostly neutrino coming in */}
          {nuP > 0 && <line x1={P(-900)[0]} y1={P(-900)[1]} x2={P(-900 * (1 - nuP))[0]} y2={P(-900 * (1 - nuP))[1]} stroke="#FFFFFF" strokeWidth={3} strokeDasharray="10 14" opacity={(0.35 + 0.25 * Math.sin(t * 40)) * (1 - range(t, q.hit + 0.6, q.hit + 1.2))} />}
          {/* sensors that saw the light: colour = arrival time, size = brightness */}
          {LIT.map((l, n) => {
            const tl = q.hit + (l.u / TRK) * (q.muEnd - q.hit) + l.d * 0.0012;
            const s = sp(tl, { damping: 10, stiffness: 200 });
            if (t < tl) return null;
            const [x, y] = STR[l.i], p = proj(x, y, DOMZ[l.j]), r = (3 + 13 * Math.sqrt(l.b / 1.5)) * Math.min(1.15, s), col = rainbow(l.u / TRK);
            return <g key={n}><circle cx={p[0]} cy={p[1]} r={r * 1.9} fill={col} opacity={0.2} /><circle cx={p[0]} cy={p[1]} r={r} fill={col} stroke={DEEP} strokeWidth={1.5} /></g>;
          })}
          {/* muon track + Cherenkov cone */}
          {mu > 0 && <>
            <line x1={P(0)[0]} y1={P(0)[1]} x2={head[0]} y2={head[1]} stroke={ICE} strokeWidth={16} strokeLinecap="round" opacity={0.25} />
            <line x1={P(0)[0]} y1={P(0)[1]} x2={head[0]} y2={head[1]} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
          </>}
          {mu > 0 && mu < 1 && <g opacity={1 - range(mu, 0.85, 1)}>
            <polygon points={`${head[0]},${head[1]} ${tail[0] + nxp * cw},${tail[1] + nyp * cw} ${tail[0] - nxp * cw},${tail[1] - nyp * cw}`} fill="url(#cone2)" />
            {[1, -1].map(s => <line key={s} x1={head[0]} y1={head[1]} x2={tail[0] + s * nxp * cw} y2={tail[1] + s * nyp * cw} stroke="#FFFFFF" strokeWidth={3} opacity={0.85} />)}
          </g>}
          {mu > 0 && mu < 1 && <circle cx={head[0]} cy={head[1]} r={9} fill="#FFFFFF" />}
          {(() => { const p = range(t, q.hit, q.hit + 0.7); return p > 0 && p < 1 ? <circle cx={P(0)[0]} cy={P(0)[1]} r={20 + 150 * eOut(p)} fill="#FFFFFF" opacity={0.85 * (1 - p)} /> : null; })()}
          {/* reconstruction: point back to the sky */}
          {arrow > 0 && <>
            <line x1={endP[0]} y1={endP[1]} x2={arrHead[0]} y2={arrHead[1]} stroke={C.yellow} strokeWidth={8} strokeLinecap="round" />
            <circle cx={arrHead[0]} cy={arrHead[1]} r={12} fill={C.yellow} />
          </>}
          {t > q.source && <g style={{ transformOrigin: `${srcP[0]}px ${srcP[1]}px`, scale: `${srcS * (1 + 0.08 * Math.sin(t * 8))}` }}>
            <polygon points={[0, 1, 2, 3, 4, 5, 6, 7].map(k => { const r = k % 2 ? 22 : 70, a = k * Math.PI / 4 - Math.PI / 2; return `${srcP[0] + Math.cos(a) * r},${srcP[1] + Math.sin(a) * r}`; }).join(" ")} fill={C.yellow} />
            <circle cx={srcP[0]} cy={srcP[1]} r={100} fill="none" stroke={C.yellow} strokeWidth={3} strokeDasharray="6 10" />
          </g>}
        </g>}
      </svg>
      {t > q.source && <div style={{ position: "absolute", left: srcP[0] + 120, top: srcP[1] - 40, opacity: eOut(range(t, q.source + 0.2, q.source + 0.5)) }}>
        <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 50, color: C.yellow }}>源头</div>
        <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 26, color: C.yellow, letterSpacing: 3, opacity: 0.8 }}>天空中的那个点</div>
      </div>}
      {/* B labels */}
      <Say at={q.iso + 0.6} out={q.dark - 0.4} text="↑ 冰面在上方 1450 m" color={NAVY} y={400} size={36} weight={700} />
      <div style={{ position: "absolute", left: 70, top: 1540, opacity: 1 - eIn(range(t, q.dark - 0.4, q.dark)) }}>
        {t > q.iso && <Kinetic text="1 立方公里冰" at={q.iso + 0.5} size={96} color={NAVY} stagger={0.05} />}
      </div>
      <Say at={q.iso + 1.1} out={q.dark - 0.4} text="86 根线缆 × 60 个探测器 · 2010 年建成" color={C.blue} y={1665} size={38} weight={700} />
      {/* D captions */}
      <Say at={q.dark + 0.6} out={q.hit - 0.2} text="极少数时候，它会撞上冰里的一个原子" color="#FFFFFF" y={1560} size={50} />
      <Say at={q.hit + 0.3} out={q.muEnd + 0.4} text={"撞出的粒子比冰里的光还快\n拖出一道蓝光"} sub="切伦科夫辐射 · CHERENKOV LIGHT" color="#FFFFFF" y={1560} size={50} />
      <Say at={q.muEnd + 0.7} out={q.arrow} text="5160 只眼睛，记下光到达的先后与明暗" color="#FFFFFF" y={1560} size={50} />
      <Say at={q.arrow + 0.3} text="顺着光迹倒推，指回它的来处" color={C.yellow} y={1560} size={56} />
    </Abs>
  );
};

// ───────────── 7 · discoveries
const Discover: React.FC = () => {
  const t = useT(), sp = useSpring(), q = Q.discover, Y0 = 470, DY = 370;
  const nodes = [
    { y: "2013", title: "首次抓到宇宙高能中微子", detail: "两个最高能的事件，昵称“伯特”和“厄尼”" },
    { y: "2017", title: "追到第一个源头", detail: "耀变体 TXS 0506+056 · 约 40 亿光年外" },
    { y: "2023", title: "第一张“中微子银河”", detail: "用中微子看见了我们自己的银河系" },
  ];
  const icon = (k: number, cx: number, cy: number) => {
    if (k === 0) return <g>{[[-34, C.yellow], [34, C.orange]].map(([dx, c], i) => <circle key={i} cx={cx + (dx as number)} cy={cy} r={40 + 4 * Math.sin(t * 6 + i)} fill={c as string} stroke={C.ink} strokeWidth={5} />)}</g>;
    if (k === 1) return <g>
      {[1, -1].map(s => <polygon key={s} points={`${cx},${cy} ${cx + s * 90 - 12},${cy - s * 80} ${cx + s * 90 + 12},${cy - s * 66}`} fill={ICE} />)}
      <ellipse cx={cx} cy={cy} rx={70} ry={18} fill="none" stroke={C.yellow} strokeWidth={8} strokeDasharray="18 9" strokeDashoffset={-t * 80} />
      <circle cx={cx} cy={cy} r={26} fill="#05051A" stroke="#FFFFFF" strokeWidth={3} /></g>;
    return <g style={{ transformOrigin: `${cx}px ${cy}px`, rotate: "-20deg" }}>
      <ellipse cx={cx} cy={cy} rx={95} ry={26} fill={C.yellow} opacity={0.35} />
      <ellipse cx={cx} cy={cy} rx={95} ry={10} fill={C.yellow} />
      {[...Array(14)].map((_, i) => <circle key={i} cx={cx + (hash(i) - 0.5) * 180} cy={cy + (hash(i + 40) - 0.5) * 40} r={3 + hash(i + 80) * 4} fill="#FFFFFF" opacity={0.6 + 0.4 * Math.sin(t * 5 + i)} />)}
      <circle cx={cx} cy={cy} r={16} fill="#FFFFFF" /></g>;
  };
  return (
    <Abs>
      <Dots color="#FFFFFF" opacity={0.08} />
      <div style={{ position: "absolute", left: 70, top: 200 }}>
        <Kinetic text="它看见了什么" at={0.05} size={110} color="#FFFFFF" stagger={0.05} />
      </div>
      <svg width={VW} height={VH} style={{ position: "absolute" }}>
        <line x1={110} y1={Y0 + 40} x2={110} y2={lerp(Y0 + 40, Y0 + 2 * DY + 60, eInOut(range(t, q.nodes[0], q.nodes[2] + 0.4)))} stroke="#FFFFFF" strokeWidth={6} opacity={0.6} />
        {nodes.map((_, k) => { const s = sp(q.nodes[k]); return <g key={k}>
          <circle cx={110} cy={Y0 + k * DY + 50} r={22 * Math.min(1.2, s)} fill={C.yellow} stroke={C.ink} strokeWidth={5} />
          <g opacity={clamp01(s * 3)} style={{ transformOrigin: `${880}px ${Y0 + k * DY + 60}px`, scale: `${Math.min(1.1, s)}` }}>{icon(k, 880, Y0 + k * DY + 60)}</g>
          <Burst x={110} y={Y0 + k * DY + 50} at={q.nodes[k]} t={t} color={C.yellow} r={70} />
        </g>; })}
      </svg>
      {nodes.map((n, k) => {
        const a = eOut(range(t, q.nodes[k], q.nodes[k] + 0.5));
        return (
          <div key={k} style={{ position: "absolute", left: 170, top: Y0 + k * DY, opacity: a, translate: `${(1 - a) * 50}px 0px` }}>
            <div style={{ fontFamily: FONT_EN, fontSize: 96, color: C.yellow, lineHeight: 1 }}>{n.y}</div>
            <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 52, color: "#FFFFFF", marginTop: 14 }}>{n.title}</div>
            <div style={{ fontFamily: FONT_CN, fontWeight: 700, fontSize: 32, color: "#FFFFFF", opacity: 0.8, marginTop: 10 }}>{n.detail}</div>
          </div>
        );
      })}
    </Abs>
  );
};

// ───────────── 8 · the prize
const Nobel: React.FC = () => {
  const t = useT(), sp = useSpring(), q = Q.nobel;
  const disc = sp(0.1, { damping: 10 });
  const cx = 540, cy = 590;
  const iso = (x: number, y: number, z: number): [number, number] => [cx + (x - y) * 0.866 * 0.17, cy - 40 + (x + y) * 0.5 * 0.17 - z * 0.17];
  const hexI = HEXR.map(([x, y]) => [x * Math.cos(t * 0.4) - y * Math.sin(t * 0.4), x * Math.sin(t * 0.4) + y * Math.cos(t * 0.4)]);
  return (
    <Abs>
      <Dots color="#FFFFFF" opacity={0.06} />
      <svg width={VW} height={VH} style={{ position: "absolute" }}>
        <g style={{ transformOrigin: `${cx}px ${cy}px`, scale: `${disc}` }}>
          <circle cx={cx} cy={cy} r={230} fill={C.yellow} />
          <circle cx={cx} cy={cy} r={196} fill="none" stroke={C.ink} strokeWidth={5} strokeDasharray="4 14" style={{ transformOrigin: `${cx}px ${cy}px`, rotate: `${t * 30}deg` }} />
          {[0, -1000].map(z => <polygon key={z} points={hexI.map(([x, y]) => iso(x, y, z).join(",")).join(" ")} fill="none" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />)}
          {hexI.map(([x, y], i) => { const a = iso(x, y, 0), b = iso(x, y, -1000); return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.ink} strokeWidth={4} />; })}
          {[[-200, 100], [150, -150], [60, 220], [-40, -60]].map(([x, y], i) => { const a = iso(x, y, 0), b = iso(x, y, -1000); return <line key={"s" + i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={C.ink} strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" />; })}
        </g>
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 870, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 40, color: C.ink, background: C.yellow, padding: "12px 34px", borderRadius: 50, opacity: eOut(range(t, 0.3, 0.6)), scale: `${Math.min(1.1, sp(0.3))}` }}>2026 诺贝尔物理学奖</div>
        <div style={{ height: 34 }} />
        <Kinetic text="弗朗西斯·哈尔岑" at={q.name} size={110} color="#FFFFFF" stagger={0.05} />
        <div style={{ fontFamily: FONT_EN, fontSize: 44, color: "#FFFFFF", letterSpacing: 6, marginTop: 20, opacity: eOut(range(t, 1.0, 1.4)) }}>FRANCIS HALZEN</div>
        <div style={{ fontFamily: FONT_CN, fontWeight: 700, fontSize: 32, color: "#FFFFFF", opacity: 0.7 * eOut(range(t, 1.2, 1.6)), marginTop: 12 }}>比利时出生 · 美国威斯康星大学麦迪逊分校</div>
      </div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 1300, fontFamily: FONT_CN, fontWeight: 700, fontSize: 38, lineHeight: 1.5, color: "#FFFFFF", textAlign: "center", opacity: 0.85 * eOut(range(t, 1.6, 2.1)), translate: `0px ${(1 - eOut(range(t, 1.6, 2.1))) * 20}px` }}>
        “表彰对冰立方中微子天文台的决定性贡献，以及发现天体来源的高能中微子”
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1490, display: "flex", justifyContent: "center" }}>
        <Kinetic text="一种新的天文学，开始了" at={q.close} size={70} color={C.yellow} stagger={0.045} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1660, textAlign: "center", fontFamily: FONT_CN, fontWeight: 700, fontSize: 24, color: "#FFFFFF", opacity: 0.45 * eOut(range(t, 3.8, 4.2)) }}>资料：诺贝尔奖官方公告 · IceCube 合作组</div>
    </Abs>
  );
};

export const IceCube: React.FC = () => (
  <Abs style={{ background: C.ink }}>
    <Section s={SEC.hook} first><Hook /></Section>
    <Section s={SEC.ghost}><Ghost /></Section>
    <Section s={SEC.messenger}><Messenger /></Section>
    <Section s={SEC.idea}><Idea /></Section>
    <Section s={SEC.detector}><Detector /></Section>
    <Section s={SEC.discover}><Discover /></Section>
    <Section s={SEC.nobel}><Nobel /></Section>
    <Progress />
    <Grain />
    <Audio src={staticFile("icecube_score.wav")} />
  </Abs>
);
