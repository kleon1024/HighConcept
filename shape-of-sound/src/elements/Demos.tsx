// Little superflat illustrations for the neighbourhood tour, the cosmic-origin section and the ending card.
import React from "react";
import { FAM, ORIGIN, P, T, backOut, bounce, clamp01, eIn, eInOut, eOut, lerp, range, rnd, win } from "./core";
import { Chars, FONT_BIG, FONT_CN, FONT_SYM, Sticker } from "./UI";

const INK = P.ink;
const Panel: React.FC<React.PropsWithChildren<{ t: number; a: number; b: number; bg?: string; top?: number }>> = ({ t, a, b, bg = "#FFFFFF", children, top = 290 }) => {
  const k = win(t, a, b, 0.3, 0.3);
  if (k <= 0) return null;
  return (
    <div style={{ position: "absolute", right: 70, top, opacity: k, transform: `scale(${0.85 + 0.15 * backOut(range(t, a, a + 0.35), 2)}) rotate(${(1 - k) * 3}deg)` }}>
      <Sticker bg={bg} style={{ width: 440, height: 440, position: "relative", overflow: "hidden" }}>{children}</Sticker>
    </div>
  );
};
const Label: React.FC<{ text: string; c?: string; y?: number }> = ({ text, c = "#FFD23F", y = 372 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center" }}>
    <span style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 30, color: INK, background: c, padding: "2px 16px", borderRadius: 8 }}>{text}</span>
  </div>
);
const Svg: React.FC<React.PropsWithChildren<{ h?: number }>> = ({ children, h = 360 }) => (
  <svg width={430} height={h} viewBox={`-215 -${h / 2 + 10} 430 ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>{children}</svg>
);

// ── the neighbourhoods
const Hydrogen: React.FC<{ t: number }> = ({ t }) => (
  <Panel t={t} a={108.2} b={110.2}>
    <Svg>
      {Array.from({ length: 10 }, (_, i) => {
        const x = -150 + (i % 5) * 75, y = -90 + Math.floor(i / 5) * 110, k = backOut(range(t, 108.3 + i * 0.07, 108.6 + i * 0.07), 2.4);
        const h = i < 9;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
            <circle r={30} fill={h ? FAM.h.c : "#D8CFBE"} stroke={INK} strokeWidth={5} />
            <text y={11} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={30} fill={INK}>{h ? "H" : "…"}</text>
          </g>
        );
      })}
    </Svg>
    <Label text="10 个原子里，约 9 个" c={FAM.h.c} />
  </Panel>
);

const Alkali: React.FC<{ t: number }> = ({ t }) => {
  const drop = T.cues.na_drop, hit = drop + 0.45;
  const y = lerp(-170, 20, eIn(range(t, drop, hit)));
  const boom = range(t, hit, hit + 0.5);
  return (
    <>
      <Panel t={t} a={110.4} b={113.2}>
        <Svg>
          <path d="M -120 -40 L -110 140 L 110 140 L 120 -40" fill="none" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
          <path d="M -116 30 L -110 136 L 110 136 L 116 30 Z" fill="#7BC8F6" />
          {t < hit + 0.1 && <g transform={`translate(0 ${y}) rotate(${(t - drop) * 200})`}><rect x={-26} y={-26} width={52} height={52} fill="#D7DCE3" stroke={INK} strokeWidth={5} /><text y={10} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={26} fill={INK}>Na</text></g>}
          {boom > 0 && (
            <g opacity={1 - range(t, hit + 0.6, hit + 1.4)}>
              <path d={Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2, r = (i % 2 ? 50 : 120) * eOut(boom); return `${i ? "L" : "M"} ${Math.cos(a) * r} ${20 + Math.sin(a) * r * 0.8}`; }).join(" ") + " Z"} fill="#FFD23F" stroke={INK} strokeWidth={6} />
              <text y={42} textAnchor="middle" fontFamily={FONT_CN} fontWeight={900} fontSize={54} fill={INK} transform={`scale(${backOut(boom, 3)})`}>砰！</text>
            </g>
          )}
        </Svg>
        <Label text="钠 + 水" c={FAM.alk.c} />
      </Panel>
      <Panel t={t} a={113.4} b={116.0}>
        <Svg>
          <rect x={-80} y={-150} width={160} height={290} rx={26} fill="#FFFFFF" stroke={INK} strokeWidth={8} />
          <rect x={-55} y={-110} width={110} height={210} rx={10} fill="#EAF7EE" stroke={INK} strokeWidth={4} />
          <rect x={-55} y={lerp(100, -110, eOut(range(t, 113.6, 115.2)))} width={110} height={lerp(0, 210, eOut(range(t, 113.6, 115.2)))} rx={10} fill={FAM.alk.c} opacity={0.85} />
          <path d="M 10 -60 L -20 5 L 6 5 L -8 60 L 30 -10 L 2 -10 Z" fill="#FFD23F" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <text y={-120} dy={-48} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={34} fill={INK}>Li⁺</text>
        </Svg>
        <Label text="锂电池" c={FAM.alk.c} />
      </Panel>
    </>
  );
};

const Burst: React.FC<{ t: number; at: number; c: string; x: number; y: number; label: string }> = ({ t, at, c, x, y, label }) => {
  const k = range(t, at, at + 0.7);
  if (k <= 0) return null;
  const f = 1 - range(t, at + 1.4, at + 2.4);
  return (
    <g transform={`translate(${x} ${y})`} opacity={f}>
      {Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2, r = 95 * eOut(k); return <line key={i} x1={Math.cos(a) * r * 0.4} y1={Math.sin(a) * r * 0.4} x2={Math.cos(a) * r} y2={Math.sin(a) * r} stroke={c} strokeWidth={9} strokeLinecap="round" />; })}
      <circle r={16 * (1 - k * 0.4)} fill="#FFFFFF" opacity={1 - k} />
      <text y={8} textAnchor="middle" fontFamily={FONT_CN} fontWeight={900} fontSize={28} fill="#FFFFFF" opacity={eOut(range(t, at + 0.4, at + 0.7))}>{label}</text>
    </g>
  );
};
const Earth: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Panel t={t} a={116.4} b={118.6}>
      <Svg>
        <g transform="rotate(-30)">
          <rect x={-110} y={-22} width={220} height={44} rx={22} fill="#FFFFFF" stroke={INK} strokeWidth={8} />
          {[-110, 110].map((x) => <g key={x}><circle cx={x} cy={-24} r={34} fill="#FFFFFF" stroke={INK} strokeWidth={8} /><circle cx={x} cy={24} r={34} fill="#FFFFFF" stroke={INK} strokeWidth={8} /></g>)}
          <rect x={-104} y={-18} width={208} height={36} fill="#FFFFFF" />
        </g>
        <text y={130} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={48} fill={INK}>Ca</text>
      </Svg>
      <Label text="骨头里的钙" c={FAM.ae.c} />
    </Panel>
    <Panel t={t} a={118.6} b={122.0} bg="#1B2150">
      <Svg>
        {Array.from({ length: 20 }, (_, i) => <circle key={i} cx={(rnd(i) - 0.5) * 400} cy={(rnd(i + 40) - 0.5) * 320} r={2} fill="#FFFFFF" opacity={0.6} />)}
        <Burst t={t} at={T.cues.fireworks[0]} c="#FF4D4D" x={-80} y={-50} label="锶 Sr" />
        <Burst t={t} at={T.cues.fireworks[1]} c="#5DFF7A" x={90} y={-10} label="钡 Ba" />
        <Burst t={t} at={T.cues.fireworks[2]} c="#FF4D4D" x={-20} y={90} label="" />
        <Burst t={t} at={T.cues.fireworks[2] + 0.15} c="#5DFF7A" x={110} y={110} label="" />
      </Svg>
      <Label text="烟花：红锶 · 绿钡" c={FAM.ae.c} />
    </Panel>
  </>
);

const TOOL_ICONS: Record<number, React.ReactNode> = {
  26: <g><path d="M -120 -70 H 120 V -40 H 20 V 40 H 120 V 70 H -120 V 40 H -20 V -40 H -120 Z" fill="#9AA6B8" stroke={INK} strokeWidth={8} strokeLinejoin="round" /></g>,
  29: <g>{Array.from({ length: 6 }, (_, i) => <ellipse key={i} cx={-75 + i * 30} cy={0} rx={30} ry={80} fill="none" stroke="#D9822B" strokeWidth={14} />)}<line x1={-140} y1={80} x2={-110} y2={0} stroke="#D9822B" strokeWidth={14} strokeLinecap="round" /></g>,
  79: <g><path d="M -110 50 L -70 -40 H 70 L 110 50 Z" fill="#FFD23F" stroke={INK} strokeWidth={8} strokeLinejoin="round" /><path d="M -50 -20 L -40 -30" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" /><text y={30} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={40} fill={INK}>Au</text></g>,
  74: <g><path d="M -70 -10 C -70 -110 70 -110 70 -10 C 70 40 30 50 30 90 H -30 C -30 50 -70 40 -70 -10 Z" fill="#FFF3B0" stroke={INK} strokeWidth={8} /><path d="M -25 10 L -12 -30 L 0 10 L 12 -30 L 25 10" fill="none" stroke="#FF6B2C" strokeWidth={7} /><rect x={-34} y={90} width={68} height={36} fill="#9AA6B8" stroke={INK} strokeWidth={6} /></g>,
  80: <g>{[[-60, 10, 44], [40, -20, 54], [70, 70, 30], [-20, 80, 26]].map(([x, y, r], i) => <g key={i}><ellipse cx={x} cy={y} rx={r} ry={r * 0.8} fill="#C9D2DE" stroke={INK} strokeWidth={7} /><ellipse cx={x - r * 0.35} cy={y - r * 0.3} rx={r * 0.25} ry={r * 0.15} fill="#FFFFFF" /></g>)}</g>,
};
const Tools: React.FC<{ t: number }> = ({ t }) => (
  <>
    {T.tools.map((tool, i) => (
      <Panel key={i} t={t} a={tool.t} b={tool.t + 1.2}>
        <Svg><g transform={`scale(${0.9 + 0.1 * backOut(range(t, tool.t, tool.t + 0.3), 2.5)})`}>{TOOL_ICONS[tool.z]}</g></Svg>
        <Label text={tool.label} c={FAM.tm.c} />
      </Panel>
    ))}
  </>
);

const RareEarth: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Panel t={t} a={130.4} b={132.8}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
        {[["稀", "不稀"], ["土", "不是土"]].map(([a, b], i) => {
          const k = backOut(range(t, 130.9 + i * 0.6, 131.2 + i * 0.6), 2.6);
          return (
            <div key={i} style={{ position: "relative", fontFamily: FONT_CN, fontWeight: 900, fontSize: 110, color: INK }}>
              {a}
              <div style={{ position: "absolute", left: 120, top: 26, transform: `scale(${k}) rotate(-8deg)`, fontSize: 52, color: "#FF5B4F", border: "6px solid #FF5B4F", borderRadius: 10, padding: "0 10px", whiteSpace: "nowrap" }}>{b}</div>
            </div>
          );
        })}
      </div>
    </Panel>
    <Panel t={t} a={132.8} b={136.0}>
      <Svg>
        <g transform={`translate(-80 0) rotate(${Math.sin(t * 60) * 3 * win(t, 133.4, 135.6)})`}>
          <rect x={-60} y={-120} width={120} height={230} rx={20} fill="#FFFFFF" stroke={INK} strokeWidth={8} />
          <rect x={-44} y={-96} width={88} height={170} rx={6} fill="#CFE6FF" />
          {[1, 2].map((s) => <path key={s} d={`M ${-70 - s * 14} ${-30} q -10 30 0 60`} fill="none" stroke="#FF5B4F" strokeWidth={6} strokeLinecap="round" opacity={win(t, 133.4, 135.6)} />)}
        </g>
        <g transform="translate(95 -10)">
          <path d="M -50 -60 V 20 A 50 50 0 0 0 50 20 V -60 H 22 V 20 A 22 22 0 0 1 -22 20 V -60 Z" fill={FAM.ln.c} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <rect x={-50} y={-90} width={28} height={30} fill="#D7DCE3" stroke={INK} strokeWidth={6} /><rect x={22} y={-90} width={28} height={30} fill="#D7DCE3" stroke={INK} strokeWidth={6} />
          <text y={110} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={44} fill={INK}>Nd</text>
        </g>
      </Svg>
      <Label text="钕磁铁" c={FAM.ln.c} />
    </Panel>
  </>
);

const NonMetals: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Panel t={t} a={136.4} b={138.6}>
      <Svg>
        <g transform="translate(-90 -10)"><path d="M -60 -30 L -30 -70 H 30 L 60 -30 L 0 60 Z" fill="#CFF4FF" stroke={INK} strokeWidth={7} strokeLinejoin="round" /><path d="M -60 -30 H 60 M -30 -70 L -10 -30 L 0 60 M 30 -70 L 10 -30" stroke={INK} strokeWidth={4} fill="none" /></g>
        <g transform="translate(95 0) rotate(35)"><rect x={-18} y={-100} width={36} height={170} fill="#FFD23F" stroke={INK} strokeWidth={7} /><path d="M -18 70 L 0 115 L 18 70 Z" fill="#F3D9B1" stroke={INK} strokeWidth={6} strokeLinejoin="round" /><path d="M -6 100 L 0 115 L 6 100 Z" fill="#3A3A3A" /></g>
        <text x={0} y={140} textAnchor="middle" fontFamily={FONT_CN} fontWeight={900} fontSize={30} fill={INK}>=</text>
      </Svg>
      <Label text="都是碳 C" c={FAM.nm.c} />
    </Panel>
    <Panel t={t} a={138.6} b={140.4}>
      <Svg>
        <path d="M -190 90 Q -120 -10 -40 90 Z" fill="#F3D9B1" stroke={INK} strokeWidth={6} />
        <path d="M -30 10 H 30" stroke={INK} strokeWidth={8} markerEnd="" /><path d="M 18 -4 L 34 10 L 18 24" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <g transform="translate(115 20)"><rect x={-60} y={-60} width={120} height={120} rx={10} fill="#3A3F58" stroke={INK} strokeWidth={6} />
          {Array.from({ length: 5 }, (_, i) => <g key={i}><line x1={-75} y1={-40 + i * 20} x2={-60} y2={-40 + i * 20} stroke={INK} strokeWidth={5} /><line x1={60} y1={-40 + i * 20} x2={75} y2={-40 + i * 20} stroke={INK} strokeWidth={5} /></g>)}
          <text y={14} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={40} fill="#B9D24A">Si</text></g>
      </Svg>
      <Label text="沙子 → 芯片" c={FAM.md.c} />
    </Panel>
    <Panel t={t} a={140.4} b={142.4}>
      <div style={{ position: "absolute", left: 30, right: 30, top: 110, height: 150, display: "flex", border: `6px solid ${INK}`, borderRadius: 14, overflow: "hidden" }}>
        {[[78, "#4D7CFE"], [21, "#2FC27E"], [1, "#FF6FB1"]].map(([w, c], i) => (
          <div key={i} style={{ width: `${(w as number) * eOut(range(t, 140.5 + i * 0.15, 141.0 + i * 0.15))}%`, background: c as string }} />
        ))}
      </div>
      <div style={{ position: "absolute", left: 30, right: 30, top: 60, display: "flex", justifyContent: "space-between", fontFamily: FONT_CN, fontWeight: 900, fontSize: 32, color: INK, opacity: eOut(range(t, 141.0, 141.4)) }}>
        <span>氮 78%</span><span style={{ color: "#1F8A55" }}>氧 21%</span>
      </div>
      <Label text="空气" c={FAM.nm.c} y={300} />
    </Panel>
  </>
);

const Halogens: React.FC<{ t: number }> = ({ t }) => {
  const j = eInOut(range(t, 143.0, 143.8));
  return (
    <>
      <Panel t={t} a={142.6} b={144.6}>
        <Svg>
          {[[-100, "Na", FAM.alk.c], [100, "Cl", FAM.hal.c]].map(([x, s, c]) => <g key={s as string} transform={`translate(${x} 0)`}><circle r={70} fill={c as string} stroke={INK} strokeWidth={7} /><text y={14} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={44} fill={INK}>{s as string}</text></g>)}
          <circle cx={lerp(-30, 30, j)} cy={-90 - Math.sin(j * Math.PI) * 60} r={16} fill="#4D7CFE" stroke={INK} strokeWidth={5} />
          <text x={lerp(-30, 30, j)} y={-84 - Math.sin(j * Math.PI) * 60} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={20} fill="#FFFFFF">e</text>
        </Svg>
        <Label text="抢走一个电子" c={FAM.hal.c} />
      </Panel>
      <Panel t={t} a={144.6} b={147.2}>
        <Svg>
          <g transform="translate(-95 10)"><path d="M -45 -40 H 45 L 38 110 H -38 Z" fill="#FFFFFF" stroke={INK} strokeWidth={7} strokeLinejoin="round" /><path d="M -40 -40 C -40 -100 40 -100 40 -40 Z" fill="#9AA6B8" stroke={INK} strokeWidth={7} />{[-15, 0, 15].map((x) => <circle key={x} cx={x} cy={-70} r={4} fill={INK} />)}<text y={60} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={34} fill={INK}>Cl</text></g>
          <g transform="translate(85 0) rotate(-20)"><rect x={-40} y={-110} width={80} height={180} rx={10} fill="#FFFFFF" stroke={INK} strokeWidth={7} /><rect x={-24} y={70} width={48} height={34} fill="#4D7CFE" stroke={INK} strokeWidth={6} /><text y={-10} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={38} fill={INK}>F</text></g>
        </Svg>
        <Label text="食盐 · 牙膏" c={FAM.hal.c} />
      </Panel>
    </>
  );
};

const Noble: React.FC<{ t: number }> = ({ t }) => {
  const flick = 0.85 + 0.15 * Math.sin(t * 23) * Math.sin(t * 7.3);
  return (
    <>
      <Panel t={t} a={147.4} b={149.4} bg="#1B2150">
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_BIG, fontSize: 104, color: "#FFE3F1", textShadow: `0 0 18px #FF6FB1, 0 0 40px #FF6FB1, 0 0 70px #FF3D7F`, opacity: flick * eOut(range(t, 147.6, 148.0)) }}>NEON</div>
        <Label text="霓虹 = 氖 Ne" c={FAM.ng.c} />
      </Panel>
      <Panel t={t} a={149.4} b={152.2}>
        <Svg>
          <circle cx={0} cy={-50} r={70} fill="#FFD23F" stroke={INK} strokeWidth={7} />
          {Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 + t * 0.3; return <line key={i} x1={Math.cos(a) * 88} y1={-50 + Math.sin(a) * 88} x2={Math.cos(a) * 112} y2={-50 + Math.sin(a) * 112} stroke={INK} strokeWidth={7} strokeLinecap="round" />; })}
          <defs><linearGradient id="spec" x1="0" x2="1"><stop offset="0" stopColor="#8A3FFC" /><stop offset="0.25" stopColor="#3D7BFF" /><stop offset="0.45" stopColor="#2FC27E" /><stop offset="0.6" stopColor="#FFE14D" /><stop offset="0.8" stopColor="#FF8A3D" /><stop offset="1" stopColor="#E8333B" /></linearGradient></defs>
          <rect x={-170} y={90} width={340} height={48} fill="url(#spec)" stroke={INK} strokeWidth={6} />
          <rect x={52} y={86} width={7} height={56} fill={INK} opacity={eOut(range(t, 150.2, 150.6))} />
        </Svg>
        <Label text="太阳光谱里的一条黄线" c={FAM.ng.c} />
      </Panel>
    </>
  );
};

const Actinides: React.FC<{ t: number }> = ({ t }) => (
  <>
    <Panel t={t} a={152.4} b={154.4}>
      <Svg>
        <path d="M -110 130 C -80 40 -80 -40 -100 -110 H 100 C 80 -40 80 40 110 130 Z" fill="#E9E2D3" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        {[0, 1, 2].map((i) => <circle key={i} cx={-40 + i * 40 + Math.sin(t * 2 + i) * 6} cy={-150 - ((t * 40 + i * 30) % 60)} r={34} fill="#FFFFFF" stroke={INK} strokeWidth={6} opacity={0.9} />)}
        <text y={50} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={56} fill={INK}>U</text>
      </Svg>
      <Label text="核电站" c={FAM.an.c} />
    </Panel>
    <Panel t={t} a={154.4} b={156.0}>
      <Svg>
        <ellipse cx={0} cy={0} rx={130} ry={130} fill="#FFFFFF" stroke={INK} strokeWidth={8} />
        <ellipse cx={0} cy={0} rx={80} ry={80} fill="none" stroke={INK} strokeWidth={5} />
        {Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return <line key={i} x1={Math.cos(a) * 92} y1={Math.sin(a) * 92} x2={Math.cos(a) * 118} y2={Math.sin(a) * 118} stroke={INK} strokeWidth={6} />; })}
        <circle r={10} fill="#FF5B4F" opacity={0.5 + 0.5 * Math.sin(t * 8)} />
        <text y={44} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={36} fill={INK}>Am</text>
      </Svg>
      <Label text="烟雾报警器" c={FAM.an.c} />
    </Panel>
    <Panel t={t} a={156.0} b={158.0}>
      <Svg>
        <circle r={120} fill="none" stroke={INK} strokeWidth={22} />
        <circle r={120} fill="none" stroke="#C77DFF" strokeWidth={10} />
        {(() => { const a = t * 5; return <circle cx={Math.cos(a) * 120} cy={Math.sin(a) * 120} r={16} fill="#FFD23F" stroke={INK} strokeWidth={5} />; })()}
        <text y={14} textAnchor="middle" fontFamily={FONT_CN} fontWeight={900} fontSize={40} fill={INK}>加速器</text>
      </Svg>
      <Label text="在实验室里撞出来" c={FAM.an.c} />
    </Panel>
  </>
);

export const HoodDemos: React.FC<{ t: number }> = ({ t }) => (t < 106 || t > 158.4 ? null : (
  <>
    <Hydrogen t={t} /><Alkali t={t} /><Earth t={t} /><Tools t={t} /><RareEarth t={t} /><NonMetals t={t} /><Halogens t={t} /><Noble t={t} /><Actinides t={t} />
  </>
));

// ── cosmos: night sky, the Big Bang, stars, the neutron-star chirp, and the legend
const C = T.cosmos;
export const Cosmos: React.FC<{ t: number }> = ({ t }) => {
  const k = eInOut(range(t, C.bg[0], C.bg[1])) * (1 - eInOut(range(t, C.back[0], C.back[1])));
  if (k <= 0) return null;
  const bb = range(t, C.bb, C.bb + 1.4);
  const [c0, c1] = C.chirp;
  const u = range(t, c0, c1);
  const chirpR = 90 * Math.pow(1 - u, 0.6), ang = Math.pow(u, 1.8) * 46;
  const flash = range(t, C.ns, C.ns + 1.2);
  const legend = [[C.bb, "bb"], [C.stars, "lm"], [C.stars + 0.2, "ms"], [C.stars + 0.4, "wd"], [C.ns, "ns"], [C.hm, "hm"], [C.hm + 0.2, "decay"]] as const;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: k }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 40%, ${P.night2} 0%, ${P.night} 70%)` }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 140 }, (_, i) => <circle key={i} cx={rnd(i) * 1920} cy={rnd(i + 500) * 1080} r={rnd(i + 900) * 2.2 + 0.5} fill="#FFFFFF" opacity={0.25 + 0.5 * rnd(i + 77) * (0.7 + 0.3 * Math.sin(t * 2 + i))} />)}
        {bb > 0 && (
          <g transform="translate(250 230)" opacity={1 - range(t, C.bb + 1.5, C.bb + 2.6) * 0.8}>
            <circle r={40 + 240 * eOut(bb)} fill="#FFFFFF" opacity={0.5 * (1 - bb)} />
            {[0, 1, 2].map((i) => <circle key={i} r={30 + 180 * eOut(range(t, C.bb + i * 0.15, C.bb + 1.2 + i * 0.15))} fill="none" stroke={ORIGIN.bb.c} strokeWidth={6} opacity={1 - range(t, C.bb + i * 0.15, C.bb + 1.4 + i * 0.15)} />)}
            <circle r={26} fill={ORIGIN.bb.c} />
          </g>
        )}
        {t > C.stars && (
          <g transform={`translate(250 260) scale(${backOut(range(t, C.stars, C.stars + 0.5), 2)})`} opacity={1 - range(t, c0 - 0.4, c0)}>
            <circle r={60} fill={ORIGIN.lm.c} stroke={INK} strokeWidth={6} />
            {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 + t * 0.4; return <line key={i} x1={Math.cos(a) * 74} y1={Math.sin(a) * 74} x2={Math.cos(a) * 96} y2={Math.sin(a) * 96} stroke={ORIGIN.lm.c} strokeWidth={8} strokeLinecap="round" />; })}
            {t > 165.8 && <path d={Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2, r = (i % 2 ? 70 : 150) * eOut(range(t, 165.8, 166.4)); return `${i ? "L" : "M"} ${Math.cos(a) * r} ${Math.sin(a) * r}`; }).join(" ") + " Z"} fill={ORIGIN.ms.c} opacity={0.85 * (1 - range(t, 166.6, 167.8))} />}
          </g>
        )}
        {t > c0 - 0.3 && t < C.ns + 2.5 && (
          <g transform="translate(1560 330)">
            {u < 1 && [0, 1].map((i) => {
              const a = ang + i * Math.PI;
              return (
                <g key={i}>
                  {Array.from({ length: 10 }, (_, j) => { const aa = a - j * 0.12 * (1 + u * 2); return <circle key={j} cx={Math.cos(aa) * chirpR} cy={Math.sin(aa) * chirpR * 0.6} r={14 - j} fill={ORIGIN.ns.c} opacity={(1 - j / 10) * 0.6} />; })}
                  <circle cx={Math.cos(a) * chirpR} cy={Math.sin(a) * chirpR * 0.6} r={16} fill="#FFFFFF" />
                </g>
              );
            })}
            {u < 1 && Array.from({ length: 3 }, (_, i) => <ellipse key={i} rx={chirpR + 40 + i * 50 + ((t * 120) % 50)} ry={(chirpR + 40 + i * 50 + ((t * 120) % 50)) * 0.6} fill="none" stroke={ORIGIN.ns.c} strokeWidth={3} opacity={0.35 - i * 0.1} />)}
            {flash > 0 && <>
              <circle r={30 + 170 * eOut(flash)} fill={ORIGIN.ns.c} opacity={0.55 * (1 - flash)} />
              <circle r={40} fill="#FFFFFF" opacity={1 - flash} />
            </>}
          </g>
        )}
      </svg>
      {t > c0 && t < C.ns + 2.6 && (
        <div style={{ position: "absolute", right: 80, top: 470, width: 400, opacity: win(t, c0 + 0.3, C.ns + 2.6, 0.3, 0.4), fontFamily: FONT_CN, fontWeight: 900, fontSize: 28, color: "#FFFFFF", textAlign: "right", lineHeight: 1.5 }}>
          两颗中子星，越转越快——<br /><span style={{ fontSize: 22, color: "#9AA3D8" }}>2017 年，人类第一次同时“听到”并看到这种相撞</span>
        </div>
      )}
      <div style={{ position: "absolute", left: 56, bottom: 150, display: "flex", flexDirection: "column", gap: 10 }}>
        {legend.map(([at, o]) => {
          const kk = eOut(range(t, at, at + 0.4));
          return (
            <div key={o} style={{ display: "flex", alignItems: "center", gap: 12, opacity: kk, transform: `translateX(${(1 - kk) * -30}px)` }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: ORIGIN[o].c, border: "3px solid #FFFFFF" }} />
              <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 24, color: "#FFFFFF" }}>{ORIGIN[o].name}</div>
            </div>
          );
        })}
        <div style={{ fontFamily: FONT_CN, fontWeight: 700, fontSize: 18, color: "#9AA3D8", opacity: eOut(range(t, C.bb, C.bb + 0.4)) }}>主要来源 · 简化示意（参考 Jennifer Johnson 的元素起源图）</div>
      </div>
    </div>
  );
};

// ── the ending card
export const EndCard: React.FC<{ t: number }> = ({ t }) => {
  const a = T.cues.endcard;
  const k = eOut(range(t, a, a + 0.6));
  if (k <= 0) return null;
  const chars = [["元", "1", FAM.h.c], ["素", "6", FAM.nm.c], ["周", "26", FAM.tm.c], ["期", "10", FAM.ng.c], ["表", "11", FAM.alk.c]];
  return (
    <div style={{ position: "absolute", inset: 0, background: `rgba(246,240,228,${0.82 * k})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 52, color: INK, marginRight: 12, opacity: k }}>一次看懂</div>
        {chars.map(([ch, n, c], i) => {
          const d = range(t, a + 0.1 + i * 0.08, a + 0.55 + i * 0.08);
          return (
            <Sticker key={i} bg={c} style={{ width: 130, height: 130, position: "relative", transform: `translateY(${(1 - bounce(d)) * -200}px)`, opacity: d > 0 ? 1 : 0 }} radius={14} shadow={6}>
              <div style={{ position: "absolute", left: 10, top: 6, fontFamily: FONT_SYM, fontWeight: 700, fontSize: 20, color: INK }}>{n}</div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_CN, fontWeight: 900, fontSize: 84, color: INK, paddingTop: 8 }}>{ch}</div>
            </Sticker>
          );
        })}
        <Sticker bg="#FFFFFF" style={{ width: 130, height: 130, position: "relative", borderStyle: "dashed", opacity: eOut(range(t, a + 0.7, a + 1.0)) }} radius={14} shadow={0}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_SYM, fontWeight: 700, fontSize: 84, color: "#FF5B4F" }}>?</div>
        </Sticker>
      </div>
      <div style={{ marginTop: 60, fontFamily: FONT_CN, fontWeight: 900, fontSize: 56, color: INK }}>
        <Chars text="下一个空格，也许等你来填。" t={t} at={a + 0.9} stagger={0.05} />
      </div>
      <div style={{ position: "absolute", bottom: 40, fontFamily: FONT_CN, fontWeight: 700, fontSize: 18, color: "#8C826F", opacity: eOut(range(t, a + 1.6, a + 2.0)), textAlign: "center", lineHeight: 1.6 }}>
        照片：勒科克·德布瓦博德兰（公有领域）· 门捷列夫，1897（公有领域）· Wikimedia Commons<br />
        元素起源为简化示意，参考 Jennifer Johnson 等人的元素起源周期表 · 发现年份取公认的首次确认或分离年份
      </div>
    </div>
  );
};

export { clamp01 };
