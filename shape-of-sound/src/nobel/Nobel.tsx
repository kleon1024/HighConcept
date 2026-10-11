import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { C, eIn, eInOut, eOut, FONT_CN, FONT_EN, FONT_UI, Kinetic, lerp, pulse, range, useSpring, useT } from "../theme";
import N from "./nobel.json";

const VW = 1080, VH = 1920;
type Card = (typeof N.cards)[number];
const Abs: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <div style={{ position: "absolute", inset: 0, ...style }}>{children}</div>;
const beats = (from: number, to: number, step = 0.5) => { const o: number[] = []; for (let t = from; t < to; t += step) o.push(t); return o; };

// ───────────── shared bits
const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={VW} height={VH} style={{ position: "absolute", inset: 0, opacity: 0.07, mixBlendMode: "overlay", zIndex: 100 }}>
      <filter id="gv"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 12} /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#gv)" />
    </svg>
  );
};
const Dots: React.FC<{ color: string }> = ({ color }) => {
  const t = useT(), off = (t * 16) % 44;
  return (
    <svg width={VW} height={VH} style={{ position: "absolute", inset: 0, opacity: 0.12 }}>
      <defs><pattern id={"vd" + color.slice(1)} width={44} height={44} patternUnits="userSpaceOnUse" patternTransform={`translate(${off} ${off})`}><circle cx={5} cy={5} r={3} fill={color} /></pattern></defs>
      <rect width="100%" height="100%" fill={`url(#vd${color.slice(1)})`} />
    </svg>
  );
};
// story-style progress segments at the very top
const Progress: React.FC = () => {
  const { fps } = useVideoConfig(), t = useCurrentFrame() / fps;
  const segs = [...N.cards.map(c => [c.start, c.end]), [N.econ.start, N.econ.end]];
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 70, display: "flex", gap: 10, zIndex: 90 }}>
      {segs.map(([a, b], i) => (
        <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(120,120,120,0.35)", overflow: "hidden", boxShadow: "0 0 0 2px rgba(0,0,0,0.12)" }}>
          <div style={{ width: `${range(t, a, b) * 100}%`, height: "100%", background: "#FFFFFF" }} />
        </div>
      ))}
    </div>
  );
};

// ───────────── 0–4 s: hook
const Hook: React.FC = () => {
  const t = useT(), sp = useSpring();
  const disc = sp(0.15, { damping: 10 });
  const cols = N.cards.map(c => c.bg).concat("#FFD23F");
  const exit = 0;
  return (
    <Abs style={{ background: C.ink }}>
      <Dots color="#FFFFFF" />
      <svg width={VW} height={VH} style={{ position: "absolute", opacity: 1 - exit }}>
        {cols.map((c, i) => {
          const s = sp(0.6 + i * 0.12), a = (i / 6) * Math.PI * 2 - Math.PI / 2 + t * 0.6;
          const r = lerp(700, 330, Math.min(1, s));
          return <circle key={i} cx={540 + Math.cos(a) * r} cy={700 + Math.sin(a) * r} r={34 * Math.min(1.2, s)} fill={c} />;
        })}
        <circle cx={540} cy={700} r={230 * disc} fill="#FFD23F" />
        <circle cx={540} cy={700} r={190 * disc} fill="none" stroke={C.ink} strokeWidth={6} strokeDasharray="4 14" style={{ transformOrigin: "540px 700px", rotate: `${t * 30}deg` }} />
        <text x={540} y={745} textAnchor="middle" fontFamily={FONT_EN} fontSize={130 * Math.min(1, disc)} fill={C.ink}>2026</text>
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1110, display: "flex", flexDirection: "column", alignItems: "center", opacity: 1 - exit }}>
        <Kinetic text="诺贝尔奖" at={0.55} size={210} color="#FFFFFF" stagger={0.07} />
        <div style={{ height: 24 }} />
        <Kinetic text="一分钟看完今年得主" at={1.05} size={64} color="#FFD23F" stagger={0.03} weight={700} />
        <div style={{ display: "flex", gap: 20, marginTop: 60, opacity: eOut(range(t, 1.6, 2.0)), translate: `0px ${(1 - eOut(range(t, 1.6, 2.0))) * 30}px` }}>
          {["5 项已揭晓", "8 位得主"].map((x, i) => <div key={i} style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 52, color: C.ink, background: i ? "#00C9A7" : "#FF3D7F", padding: "14px 34px", borderRadius: 50 }}>{x}</div>)}
        </div>
      </div>
    </Abs>
  );
};

// ───────────── explanatory diagrams (drawn in a 1080 × 700 box)
const ArtMedicine: React.FC<{ c: Card; lt: number }> = ({ c, lt }) => {
  const on = lt > 1.2 && (lt - 1.2) % 1.0 < 0.55;               // light toggles every second
  const onK = lt > 1.2 ? Math.max(0, Math.min(1, ((lt - 1.2) % 1.0) / 0.12)) * (on ? 1 : 0) : 0;
  const gap = 14 + 40 * onK;
  const fires = beats(1.2, 8, 1.0);
  const lastFire = fires.filter(f => f <= lt).pop() ?? -9, sp = range(lt, lastFire + 0.15, lastFire + 0.85);
  return (
    <svg width={VW} height={700}>
      {/* light beam */}
      <polygon points={`540,0 ${540 - 90 - 60 * onK},300 ${540 + 90 + 60 * onK},300`} fill="#7FB2FF" opacity={0.15 + 0.6 * onK} />
      <circle cx={540} cy={22} r={26} fill={on ? "#BFE0FF" : "#06221D"} stroke={c.ink} strokeWidth={5} />
      <text x={600} y={34} fontFamily={FONT_EN} fontSize={40} fill={c.ink}>{on ? "ON" : "OFF"}</text>
      {/* membrane with a light-gated channel */}
      {[...Array(24)].map((_, i) => <circle key={i} cx={30 + i * 44} cy={300} r={16} fill="#FFFFFF" opacity={Math.abs(30 + i * 44 - 540) < 70 ? 0 : 0.85} />)}
      {[...Array(24)].map((_, i) => <circle key={"b" + i} cx={30 + i * 44} cy={356} r={16} fill="#FFFFFF" opacity={Math.abs(30 + i * 44 - 540) < 70 ? 0 : 0.85} />)}
      <rect x={540 - gap / 2 - 52} y={268} width={52} height={120} rx={20} fill={c.accent} stroke={c.ink} strokeWidth={5} />
      <rect x={540 + gap / 2} y={268} width={52} height={120} rx={20} fill={c.accent} stroke={c.ink} strokeWidth={5} />
      {/* ions streaming through when open */}
      {[...Array(10)].map((_, i) => { const ph = ((lt * 1.6 + i / 10) % 1); const y = 160 + ph * 280; return <circle key={i} cx={540 + Math.sin(i * 2.3) * 10 * onK} cy={y} r={11} fill="#FFD23F" opacity={onK * (y < 260 || y > 400 ? 0.9 : 1)} />; })}
      {/* neuron with a spike travelling down the axon */}
      <path d="M540 470 L420 420 M540 470 L380 500 M540 470 L440 560 M540 470 L640 410" stroke={c.ink} strokeWidth={10} strokeLinecap="round" />
      <path d="M580 520 L1010 600" stroke={c.ink} strokeWidth={12} strokeLinecap="round" />
      <circle cx={540} cy={480} r={66} fill={c.accent2} stroke={c.ink} strokeWidth={8} />
      {sp > 0 && sp < 1 && <circle cx={lerp(590, 1000, sp)} cy={lerp(522, 598, sp)} r={24} fill="#FFD23F" stroke={c.ink} strokeWidth={4} />}
      <text x={70} y={640} fontFamily={FONT_CN} fontWeight={900} fontSize={40} fill={c.ink}>光敏通道打开 → 神经元放电</text>
    </svg>
  );
};
const ArtPhysics: React.FC<{ c: Card; lt: number }> = ({ c, lt }) => {
  const strings = [...Array(9)].map((_, i) => 140 + i * 100);
  const sensors: [number, number][] = [];
  strings.forEach((x, i) => { for (let k = 0; k < 11; k++) sensors.push([x + (k % 2) * 0, 170 + k * 46 + (i % 2) * 18]); });
  const ev = (t0: number, a: [number, number], b: [number, number]) => { const p = range(lt, t0, t0 + 1.4); return { p, x: lerp(a[0], b[0], p), y: lerp(a[1], b[1], p), a, b, t0 }; };
  const events = [ev(1.0, [60, 120], [1020, 680]), ev(4.3, [1020, 150], [80, 640])];
  return (
    <svg width={VW} height={700}>
      <rect x={0} y={110} width={VW} height={590} fill="#2A3590" />
      <line x1={0} y1={110} x2={VW} y2={110} stroke={c.ink} strokeWidth={6} />
      <text x={60} y={95} fontFamily={FONT_UI} fontWeight={700} fontSize={32} fill={c.ink}>南极冰面 · ICE SURFACE</text>
      <text x={1020} y={95} textAnchor="end" fontFamily={FONT_UI} fontWeight={700} fontSize={32} fill={c.accent}>深 1450–2450 m</text>
      {strings.map(x => <line key={x} x1={x} y1={110} x2={x} y2={690} stroke={c.ink} strokeWidth={2} opacity={0.35} />)}
      {sensors.map(([x, y], i) => {
        let g = 0;
        events.forEach(e => {
          if (e.p <= 0) return;
          // distance from sensor to the travelled part of the track; lights when the tip passes, then fades
          const dx = e.b[0] - e.a[0], dy = e.b[1] - e.a[1], L2 = dx * dx + dy * dy;
          const s = Math.max(0, Math.min(1, ((x - e.a[0]) * dx + (y - e.a[1]) * dy) / L2));
          if (s > e.p) return;
          const px = e.a[0] + s * dx, py = e.a[1] + s * dy, d = Math.hypot(x - px, y - py);
          const age = lt - (e.t0 + s * 1.4);
          g = Math.max(g, Math.exp(-d / 70) * Math.exp(-age / 0.9));
        });
        return <circle key={i} cx={x} cy={y} r={9 + 14 * g} fill={g > 0.08 ? c.accent2 : "#9FB2FF"} opacity={0.5 + 0.5 * g} />;
      })}
      {events.map((e, k) => e.p > 0 && e.p < 1.6 && (
        <g key={k} opacity={1 - range(lt, e.t0 + 1.4, e.t0 + 2.0)}>
          <line x1={e.a[0]} y1={e.a[1]} x2={e.x} y2={e.y} stroke={c.accent} strokeWidth={6} strokeDasharray="18 10" />
          <circle cx={e.x} cy={e.y} r={14} fill="#FFFFFF" />
        </g>
      ))}
      <text x={540} y={40} textAnchor="middle" fontFamily={FONT_CN} fontWeight={900} fontSize={38} fill={c.accent}>来自宇宙深处的中微子 ↘</text>
    </svg>
  );
};
const Molecule: React.FC<{ x: number; y: number; s: number; flip?: boolean; c: Card }> = ({ x, y, s, flip, c }) => {
  const f = flip ? -1 : 1;
  const balls: [number, number, string, number][] = [[0, -70, c.accent, 30], [-62 * f, 34, "#FFFFFF", 26], [64 * f, 30, "#0E0E12", 26], [18 * f, 58, "#2D5BFF", 18]];
  return (
    <g style={{ transformOrigin: `${x}px ${y}px`, scale: `${s}` }}>
      {balls.map(([bx, by], i) => <line key={"l" + i} x1={x} y1={y} x2={x + bx} y2={y + by} stroke={c.ink} strokeWidth={8} />)}
      <circle cx={x} cy={y} r={30} fill={c.ink} />
      {balls.map(([bx, by, col, r], i) => <circle key={i} cx={x + bx} cy={y + by} r={r} fill={col} stroke={c.ink} strokeWidth={5} />)}
    </g>
  );
};
const ArtChemistry: React.FC<{ c: Card; lt: number }> = ({ c, lt }) => {
  const sp = useSpring();
  const gen = Math.min(4, Math.max(0, Math.floor((lt - 2.6) / 0.6) + 1));   // 1 → 2 → 4 → 8 → 16 copies
  const copies = lt < 2.6 ? 1 : 2 ** gen;
  const grid = [...Array(16)].map((_, i) => [110 + (i % 4) * 100, 140 + Math.floor(i / 4) * 100] as const);
  const share = lt < 2.6 ? 0.52 : lerp(0.52, 0.995, eOut(range(lt, 2.6, 5.4)));
  const solo = eIn(range(lt, 2.4, 2.8));
  return (
    <svg width={VW} height={700}>
      <line x1={540} y1={20} x2={540} y2={540} stroke={c.ink} strokeWidth={5} strokeDasharray="14 12" />
      <text x={540} y={590} textAnchor="middle" fontFamily={FONT_CN} fontWeight={900} fontSize={34} fill={c.ink} opacity={1 - solo}>镜子 MIRROR</text>
      <g opacity={1 - solo}><Molecule x={300} y={280} s={1.6 * Math.min(1, sp(0.3))} c={c} /></g>
      <Molecule x={780} y={280} s={1.6 * Math.min(1, sp(0.6)) * (1 - 0.5 * solo)} flip c={c} />
      {lt >= 2.6 && grid.slice(0, copies).map(([x, y], i) => <Molecule key={i} x={x} y={y} s={0.55 * Math.min(1, sp(2.6 + Math.floor(Math.log2(i + 1)) * 0.6))} c={c} />)}
      {/* share bar: left-handed vs right-handed */}
      <rect x={60} y={620} width={960} height={50} rx={25} fill={c.accent2} stroke={c.ink} strokeWidth={5} />
      <rect x={60} y={620} width={960 * share} height={50} rx={25} fill={c.accent} stroke={c.ink} strokeWidth={5} />
      <text x={80} y={657} fontFamily={FONT_EN} fontSize={34} fill={c.ink}>{Math.round(share * 1000) / 10}%</text>
      <text x={1000} y={657} textAnchor="end" fontFamily={FONT_EN} fontSize={34} fill={c.ink}>{Math.round((1 - share) * 1000) / 10}%</text>
    </svg>
  );
};
const ArtLiterature: React.FC<{ c: Card; lt: number }> = ({ c, lt }) => {
  const sp = useSpring();
  const col = Math.min(1, sp(0.3));
  const frags = ["Ἔρος", "[    ]", "红", "[  ]", "SAPPHO", "]", "fragment", "[    ]"];
  return (
    <svg width={VW} height={700}>
      {/* a Doric column */}
      <g style={{ transformOrigin: "260px 650px", scale: `1 ${col}` }}>
        <rect x={140} y={90} width={240} height={46} fill={c.accent} stroke={c.ink} strokeWidth={6} />
        <path d="M165 136 L355 136 L340 170 L180 170 Z" fill={c.accent} stroke={c.ink} strokeWidth={6} />
        <rect x={180} y={170} width={160} height={440} fill="#FFF8EC" stroke={c.ink} strokeWidth={6} />
        {[0, 1, 2, 3].map(k => <line key={k} x1={210 + k * 34} y1={180} x2={210 + k * 34} y2={600} stroke={c.ink} strokeWidth={4} opacity={0.6} />)}
        <rect x={150} y={610} width={220} height={40} fill={c.accent} stroke={c.ink} strokeWidth={6} />
      </g>
      {/* fragments fly out of the column and stack into a new, modern form */}
      {frags.map((txt, i) => {
        const p = eInOut(range(lt, 1.4 + i * 0.32, 2.4 + i * 0.32));
        const x0 = 260, y0 = 300 + (i % 4) * 60, x1 = 520 + (i % 2) * 120 + (i % 3) * 30, y1 = 90 + i * 66;
        const x = lerp(x0, x1, p), y = lerp(y0, y1, p) - Math.sin(Math.PI * p) * 80;
        const w = 120 + (i * 53) % 200;
        return (
          <g key={i} opacity={p > 0 ? 1 : 0} style={{ transformOrigin: `${x}px ${y}px`, rotate: `${(1 - p) * (i % 2 ? 30 : -30)}deg` }}>
            <rect x={x} y={y - 38} width={w} height={52} rx={6} fill={i % 3 === 0 ? c.accent2 : i % 3 === 1 ? c.ink : c.accent} />
            <text x={x + 16} y={y + 2} fontFamily={i % 2 ? FONT_EN : FONT_CN} fontWeight={900} fontSize={30} fill="#FFF8EC">{txt}</text>
          </g>
        );
      })}
      <text x={540} y={680} fontFamily={FONT_CN} fontWeight={900} fontSize={38} fill={c.ink} opacity={eOut(range(lt, 4.0, 4.5))}>古典 × 当代 = 新的文学形式</text>
    </svg>
  );
};
const ArtPeace: React.FC<{ c: Card; lt: number }> = ({ c, lt }) => {
  const sp = useSpring();
  const tilt = lt < 2.6 ? Math.sin(lt * 3) * 16 * (1 - range(lt, 1.6, 2.6)) + 14 * (1 - range(lt, 0, 1.6)) : 0;
  const hits = [2.6, 3.1];
  const gavel = -50 * (1 - Math.min(1, pulse(lt, hits, 0.12) * 1.0)) + (lt < 2.4 ? -10 : 0);
  const a = (tilt * Math.PI) / 180, cx = 380, cy = 120, half = 230;
  const L = [cx - Math.cos(a) * half, cy - Math.sin(a) * half], R = [cx + Math.cos(a) * half, cy + Math.sin(a) * half];
  const pan = (x: number, y: number) => (
    <g>
      <line x1={x} y1={y} x2={x - 70} y2={y + 150} stroke={c.ink} strokeWidth={4} /><line x1={x} y1={y} x2={x + 70} y2={y + 150} stroke={c.ink} strokeWidth={4} />
      <path d={`M${x - 90} ${y + 150} Q${x} ${y + 220} ${x + 90} ${y + 150} Z`} fill={c.accent} stroke={c.ink} strokeWidth={6} />
    </g>
  );
  return (
    <svg width={VW} height={700}>
      <rect x={cx - 12} y={cy} width={24} height={300} fill={c.accent2} />
      <rect x={cx - 110} y={cy + 300} width={220} height={36} rx={10} fill={c.accent2} />
      <line x1={L[0]} y1={L[1]} x2={R[0]} y2={R[1]} stroke={c.accent2} strokeWidth={16} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={22} fill={c.accent} stroke={c.accent2} strokeWidth={6} />
      {pan(L[0], L[1])}{pan(R[0], R[1])}
      {/* gavel */}
      <g style={{ transformOrigin: "900px 330px", rotate: `${gavel}deg` }}>
        <rect x={880} y={150} width={40} height={190} rx={10} fill={c.accent2} />
        <rect x={810} y={110} width={180} height={70} rx={16} fill={c.accent} stroke={c.accent2} strokeWidth={6} />
      </g>
      <rect x={760} y={350} width={280} height={30} rx={10} fill={c.accent2} />
      {/* milestones */}
      {(c as Card & { milestones?: string[] }).milestones?.map((m, i) => {
        const s = Math.min(1, sp(3.4 + i * 0.35));
        return (
          <g key={i} opacity={s} style={{ translate: `${(1 - s) * 60}px 0px` }}>
            <rect x={60} y={450 + i * 80} width={960} height={64} rx={32} fill={i === 2 ? c.accent : "#FFFFFF"} />
            <text x={100} y={494 + i * 80} fontFamily={FONT_CN} fontWeight={900} fontSize={36} fill={C.ink}>{m}</text>
          </g>
        );
      })}
    </svg>
  );
};
const ART: Record<string, React.FC<{ c: Card; lt: number }>> = { medicine: ArtMedicine, physics: ArtPhysics, chemistry: ArtChemistry, literature: ArtLiterature, peace: ArtPeace };

// ───────────── one prize card (8 s)
const X = 0.3;
const PrizeCard: React.FC<{ c: Card; i: number }> = ({ c, i }) => {
  const lt = useT() - X, spRaw = useSpring(), len = c.end - c.start;
  const sp = (at: number, cfg?: object) => spRaw(at + X, cfg);
  const wipe = eOut(range(lt, -X, 0));
  const exit = 0 * len;
  const Art = ART[c.id];
  const pIn = (k: number) => Math.min(1, sp(1.9 + k * 0.22));
  return (
    <Abs style={{ clipPath: `polygon(0 ${(1 - wipe) * 110}%, 100% ${(1 - wipe) * 110 - 8}%, 100% 100%, 0 100%)`, background: c.bg }}>
      <Dots color={c.ink} />
      <div style={{ position: "absolute", inset: 0, opacity: 1 - exit, translate: `0px ${-exit * 60}px` }}>
        {/* category row */}
        <div style={{ position: "absolute", left: 70, right: 70, top: 130, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: eOut(range(lt, -0.15, 0.12)) }}>
          <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 44, color: c.bg, background: c.ink, padding: "10px 28px", borderRadius: 40 }}>{c.cat}</div>
          <div style={{ fontFamily: FONT_EN, fontSize: 44, color: c.ink }}>{c.date}</div>
        </div>
        <div style={{ position: "absolute", left: 70, top: 215, fontFamily: FONT_UI, fontWeight: 700, fontSize: 28, letterSpacing: 6, color: c.ink, opacity: 0.7 * eOut(range(lt, -0.1, 0.2)) }}>0{i + 1} / 05 · {c.catEn}</div>
        {/* headline */}
        <div style={{ position: "absolute", left: 66, top: 270 }}>
          <Kinetic text={c.head[0]} at={-0.12 + X} size={128} color={c.ink} stagger={0.05} />
          <Kinetic text={c.head[1]} at={0.05 + X} size={128} color={c.ink} stagger={0.05} />
        </div>
        {/* official citation, paraphrased in Chinese */}
        <div style={{ position: "absolute", left: 70, right: 110, top: 572, fontFamily: FONT_CN, fontWeight: 700, fontSize: 32, lineHeight: 1.4, color: c.ink, opacity: 0.85 * eOut(range(lt, 0.5, 0.9)) }}>“{c.cite}”</div>
        {/* the diagram */}
        <div style={{ position: "absolute", left: 0, top: 690, opacity: eOut(range(lt, 0.15, 0.45)) }}><Sequence from={Math.round(X * 30)} layout="none"><Art c={c} lt={lt} /></Sequence></div>
        {/* plain-language explanation */}
        <div style={{ position: "absolute", left: 70, right: 110, top: 1410, fontFamily: FONT_CN, fontWeight: 900, fontSize: 44, lineHeight: 1.35, color: c.ink, opacity: eOut(range(lt, 1.3, 1.7)), translate: `0px ${(1 - eOut(range(lt, 1.3, 1.7))) * 30}px` }}>{c.explain}</div>
        {/* laureates */}
        <div style={{ position: "absolute", left: 70, right: 110, top: c.people.length > 2 ? 1540 : 1530, display: "flex", flexDirection: "column", gap: c.people.length > 2 ? 10 : 18 }}>
          {c.people.map(([cn, en, from], k) => (
            <div key={k} style={{ display: "flex", flexDirection: c.people.length > 2 ? "row" : "column", alignItems: c.people.length > 2 ? "baseline" : "flex-start", gap: c.people.length > 2 ? 18 : 4, opacity: pIn(k), translate: `${(1 - pIn(k)) * -80}px 0px` }}>
              <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: c.people.length > 2 ? 54 : 64, color: c.ink }}>{cn}</div>
              <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 28, color: c.ink, opacity: 0.8 }}>{en} · {from}</div>
            </div>
          ))}
        </div>
      </div>
    </Abs>
  );
};

// ───────────── economics teaser
const Wipe: React.FC<React.PropsWithChildren<{ bg: string }>> = ({ bg, children }) => {
  const w = eOut(range(useT(), 0, X));
  return <Abs style={{ clipPath: `polygon(0 ${(1 - w) * 110}%, 100% ${(1 - w) * 110 - 8}%, 100% 100%, 0 100%)`, background: bg }}><Sequence from={0} layout="none">{children}</Sequence></Abs>;
};
const Econ: React.FC = () => {
  const t = useT(), sp = useSpring();
  const q = sp(0.1, { damping: 8 });
  return (
    <Abs style={{ background: "#FFD23F" }}>
      <Dots color={C.ink} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 260, textAlign: "center", fontFamily: FONT_EN, fontSize: 620, color: C.ink, lineHeight: 1, scale: `${q}`, rotate: `${(1 - Math.min(1, q)) * -30 + Math.sin(t * 4) * 3}deg` }}>?</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1000, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Kinetic text="经济学奖" at={0.3} size={150} color={C.ink} stagger={0.06} />
        <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 60, color: "#FFD23F", background: C.ink, padding: "14px 40px", borderRadius: 50, marginTop: 40, opacity: eOut(range(t, 0.8, 1.1)) }}>10 · 12 揭晓</div>
        <div style={{ fontFamily: FONT_CN, fontWeight: 700, fontSize: 34, color: C.ink, marginTop: 40, opacity: 0.8 * eOut(range(t, 1.2, 1.6)), textAlign: "center", lineHeight: 1.5 }}>瑞典中央银行纪念阿尔弗雷德·诺贝尔<br />经济学奖 · 本周一公布</div>
      </div>
    </Abs>
  );
};

// ───────────── recap grid
const Outro: React.FC = () => {
  const t = useT(), sp = useSpring();
  const tiles = [
    ...N.cards.map(c => ({ cat: c.cat, names: c.people.map(p => p[0]).join(" / "), bg: c.bg, ink: c.ink })),
    { cat: "经济学", names: "10 · 12 揭晓", bg: "#FFD23F", ink: C.ink },
  ];
  return (
    <Abs style={{ background: C.ink }}>
      <div style={{ position: "absolute", left: 70, top: 150 }}>
        <Kinetic text="2026 诺贝尔奖" at={0.1} size={110} color="#FFFFFF" stagger={0.04} />
      </div>
      <div style={{ position: "absolute", left: 60, right: 60, top: 330, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {tiles.map((x, i) => {
          const s = Math.min(1, sp(0.3 + i * 0.1));
          return (
            <div key={i} style={{ background: x.bg, borderRadius: 32, height: 360, padding: 34, boxSizing: "border-box", scale: `${s}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 58, color: x.ink }}>{x.cat}</div>
              <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: x.names.length > 14 ? 30 : 40, color: x.ink, lineHeight: 1.35 }}>{x.names}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, top: 1500, fontFamily: FONT_CN, fontWeight: 700, fontSize: 28, color: "#FFFFFF", opacity: 0.6 * eOut(range(t, 1.2, 1.6)), lineHeight: 1.5 }}>
        信息来源：诺贝尔奖官方公告及新闻报道（截至 2026 年 10 月 11 日）
      </div>
    </Abs>
  );
};

export const Nobel2026: React.FC = () => {
  const { fps } = useVideoConfig();
  const seq = (a: number, b: number) => ({ from: Math.round(a * fps), durationInFrames: Math.round((b - a) * fps), premountFor: fps });
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Sequence name="Hook" {...seq(N.hook.start, N.hook.end)}><Hook /></Sequence>
      {N.cards.map((c, i) => <Sequence key={c.id} name={c.cat} {...seq(c.start - X, c.end)}><PrizeCard c={c} i={i} /></Sequence>)}
      <Sequence name="Economics" {...seq(N.econ.start - X, N.econ.end)}><Wipe bg="#FFD23F"><Econ /></Wipe></Sequence>
      <Sequence name="Recap" {...seq(N.outro.start - X, N.outro.end)}><Wipe bg={C.ink}><Outro /></Wipe></Sequence>
      <Progress />
      <Grain />
      <Audio src={staticFile("nobel_score.wav")} />
    </AbsoluteFill>
  );
};
export const _u = { eInOut, FONT_UI };
