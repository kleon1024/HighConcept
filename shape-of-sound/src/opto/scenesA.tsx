import React from "react";
import { C, clamp01, eIn, eInOut, eOut, FONT_CN, FONT_EN, FONT_UI, Kinetic, lerp, range, useSpring, useT } from "../theme";
import { Abs, Alga, BLUE, Burst, Dots, GLOW, hash, implantAt, Membrane, Mouse, Neuron, Pill, Q, Say, Svg } from "./kit";
import { Img, staticFile } from "remotion";
import { Inset, Photo } from "../media";

// ───────────── 1 · cold open: light on → the mouse spins; light off → it stops dead
export const spinMouse = (ot: number, cx: number, cy: number, r: number, turns = 1.25) => {
  const p = -Math.PI / 2 - 2 * Math.PI * turns * ot;
  return { x: cx + r * Math.cos(p), y: cy + r * Math.sin(p), a: (p * 180) / Math.PI };
};
type Shot = (typeof Q.cold.shots)[number];
export const Cold: React.FC = () => {
  const t = useT(), sp = useSpring(), q = Q.cold;
  const shot = q.shots.find((h: Shot) => t >= h.start && t < h.end) as Shot | undefined;
  const asking = t < q.shots[0].start, after = t >= q.shots[q.shots.length - 1].end;
  const isOn = !!shot && t >= shot.on;
  const lt = shot ? t - shot.on : 0;                                   // time since this shot's light came on
  const flash = isOn ? Math.exp(-lt / 0.22) : 0, kick = isOn ? Math.exp(-lt / 0.12) : 0;
  const shake = [Math.sin(t * 97) * 14 * kick, Math.cos(t * 83) * 14 * kick];
  const CX = 540, CY = 860;
  // where the mouse is and what it is doing in each shot
  let m = { x: CX, y: CY + 40, a: 0 }, asleep = false, ghosts: { x: number; y: number; a: number }[] = [], marks = 0, zz = 0, hop = 1;
  if (asking || !shot) { m = { x: CX, y: CY + 40, a: Math.sin(t * 9) * 4 }; }
  else if (shot.kind === "wake") {
    asleep = !isOn; zz = isOn ? 0 : 1; m = { x: CX, y: CY + 40, a: -20 };
    if (isOn) { hop = 1 + 0.22 * Math.sin(Math.min(1, lt / 0.25) * Math.PI); m.a = -20 + 20 * eOut(range(lt, 0, 0.2)); marks = 1 - range(lt, 0.3, 0.7); }
  } else if (shot.kind === "freeze") {
    const walk = isOn ? shot.on - shot.start : t - shot.start;          // it walks until the light hits, then stops dead
    m = { x: CX, y: CY + 160 - walk * 260, a: 0 };
    if (isOn) { m.x += Math.sin(t * 90) * 3; m.y += Math.cos(t * 77) * 2; marks = 1; }
  } else {
    const ot = isOn ? lt : 0, sm = spinMouse(ot, CX, CY, 170);
    m = sm; if (isOn) ghosts = [6, 5, 4, 3, 2, 1].map(k => spinMouse(Math.max(0, ot - k * 0.035), CX, CY, 170));
  }
  const [ix, iy] = implantAt(m.x, m.y, m.a, 0.9 * hop);
  const slam = shot && isOn ? sp(shot.on, { damping: 9, stiffness: 260 }) : 0;
  const alga = sp(q.alga, { damping: 10 });
  const sceneOut = eInOut(range(t, q.nots - 0.25, q.nots + 0.1));    // the arena dims away for the reveal
  return (
    <Abs>
      <Abs style={{ background: BLUE, opacity: isOn ? 0.28 + 0.6 * flash : 0 }} />
      <Dots color="#FFFFFF" opacity={0.07} />
      <div style={{ position: "absolute", inset: 0, translate: `${shake[0]}px ${shake[1]}px`, opacity: 1 - sceneOut }}>
        <Svg>
          <defs><radialGradient id="arena"><stop offset="0" stopColor={isOn ? "#2A3E8F" : "#1C1C26"} /><stop offset="1" stopColor="#101016" /></radialGradient></defs>
          <circle cx={CX} cy={CY} r={300} fill="url(#arena)" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={4} />
          {[...Array(36)].map((_, i) => { const a = (i / 36) * Math.PI * 2; return <line key={i} x1={CX + Math.cos(a) * 300} y1={CY + Math.sin(a) * 300} x2={CX + Math.cos(a) * (i % 3 ? 286 : 272)} y2={CY + Math.sin(a) * (i % 3 ? 286 : 272)} stroke="#FFFFFF" strokeOpacity={0.3} strokeWidth={3} />; })}
          {isOn && <path d={`M${CX + 280} -10 Q ${CX + 160} ${CY - 360} ${ix} ${iy}`} stroke={GLOW} strokeWidth={22} fill="none" opacity={0.35} />}
          <path d={`M${CX + 280} -10 Q ${CX + 160} ${CY - 360} ${ix} ${iy}`} stroke={isOn ? "#DDEBFF" : "#6B6F80"} strokeWidth={6} fill="none" />
          {ghosts.map((g, k) => <Mouse key={k} x={g.x} y={g.y} a={g.a} s={0.9} opacity={0.3 * (1 - (k + 1) / 7)} />)}
          <Mouse x={m.x} y={m.y} a={m.a} s={0.9 * hop} glow={isOn ? 1 : 0} asleep={asleep} />
          {/* asleep: Z's drifting up */}
          {zz > 0 && [0, 1, 2].map(k => { const ph = ((t * 0.9 + k / 3) % 1); return <text key={k} x={m.x + 70 + ph * 60} y={m.y - 150 - ph * 120} fontFamily={FONT_EN} fontSize={34 + k * 10} fill="#C9C9D6" opacity={(1 - ph) * zz}>Z</text>; })}
          {/* startled / frozen: shock marks */}
          {marks > 0 && [-1, 0, 1].map(k => <line key={k} x1={m.x + k * 46} y1={m.y - 190} x2={m.x + k * 70} y2={m.y - 240} stroke={C.yellow} strokeWidth={8} strokeLinecap="round" opacity={marks} />)}
        </Svg>
      </div>
      {/* the question, over a real optogenetics rig */}
      <Photo src="media/opto_lab.jpg" at={-0.1} out={q.shots[0].start - 0.05} zoom={[1.0, 1.35]} focus={[74, 58]} shade={0.78} dur={1.4} credit="图：Bd008 · CC BY-SA 4.0" />
      {asking && <>
        <div style={{ position: "absolute", left: 0, right: 0, top: 640, height: 420, background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.65) 30%, rgba(0,0,0,0.65) 70%, rgba(0,0,0,0))" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", fontFamily: FONT_CN, fontWeight: 900, fontSize: 84, color: GLOW, opacity: eOut(range(t, q.ask, q.ask + 0.25)), textShadow: "0 0 40px rgba(127,178,255,0.8)" }}>一束光，</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 820, display: "flex", justifyContent: "center" }}>
          <Kinetic text="能遥控大脑吗？" at={q.q} size={132} color="#FFFFFF" stagger={0.05} style={{ textShadow: "0 6px 30px rgba(0,0,0,0.9)" }} />
        </div>
      </>}
      {/* each shot: what the light just did */}
      {shot && isOn && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 190, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 180, color: "#FFFFFF", scale: `${lerp(1.6, 1, Math.min(1, slam))}`, opacity: clamp01(slam * 4), letterSpacing: 10, lineHeight: 1.05 }}>{shot.label}</div>
          <div style={{ fontFamily: FONT_CN, fontWeight: 700, fontSize: 34, color: "#DDEBFF", opacity: eOut(range(lt, 0.15, 0.35)), marginTop: 18 }}>开灯 → {shot.note}</div>
        </div>
      )}
      {shot && !isOn && <div style={{ position: "absolute", left: 0, right: 0, top: 1250, textAlign: "center", fontFamily: FONT_UI, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: "#8A8A99" }}>{q.shots.indexOf(shot) + 1} / {q.shots.length}</div>}
      {/* the reveal */}
      {after && <>
        <div style={{ position: "absolute", left: 0, right: 0, top: 360, display: "flex", justifyContent: "center", gap: 70, opacity: eOut(range(t, q.nots, q.nots + 0.3)) }}>
          {["不是电极", "不是药物"].map((w, k) => (
            <div key={w} style={{ position: "relative", fontFamily: FONT_CN, fontWeight: 900, fontSize: 72, color: "#C9C9D6" }}>
              {w}
              <div style={{ position: "absolute", left: -10, right: -10, top: "52%", height: 9, background: C.red, borderRadius: 4, transformOrigin: "0 50%", scale: `${eOut(range(t, q.nots + 0.3 + k * 0.3, q.nots + 0.55 + k * 0.3))} 1`, rotate: "-6deg" }} />
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 520, display: "flex", justifyContent: "center" }}>
          <Kinetic text="是一束光" at={q.light} size={190} color={GLOW} stagger={0.07} />
        </div>
        <Svg>
          {t > 9.0 && <circle cx={540} cy={1090} r={40 + 520 * eIn(range(t, 9.0, 10))} fill={GLOW} opacity={0.5 * range(t, 9.0, 9.4)} />}
          {t > q.alga && <g opacity={clamp01(alga * 3)}><Alga x={540} y={1090} s={0.75 * Math.min(1.12, alga) * (1 + 0.12 * eIn(range(t, 9.0, 10)))} t={t} eye={1} /></g>}
        </Svg>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1360, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <Say at={q.alga + 0.1} text="开关的零件，来自" color="#FFFFFF" y={0} size={50} weight={700} center />
          <div style={{ position: "absolute", top: 76, left: 0, right: 0, display: "flex", justifyContent: "center" }}><Kinetic text="池塘里的一种绿藻" at={q.alga + 0.35} size={84} color="#00E0B0" stagger={0.04} /></div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1600, display: "flex", justifyContent: "center", opacity: clamp01(sp(q.prize) * 3), scale: `${Math.min(1.1, sp(q.prize))}` }}>
          <Pill bg={C.yellow} color={C.ink} size={40}>2026 诺贝尔生理学或医学奖</Pill>
        </div>
      </>}
    </Abs>
  );
};

// ───────────── 2 · title
export const Title: React.FC = () => {
  const t = useT(), q = Q.title;
  const tog = eInOut(range(t, q.toggle, q.toggle + 0.25));
  return (
    <Abs>
      <Dots color="#FFFFFF" opacity={0.08} />
      <Svg>
        <polygon points={`540,-20 ${540 - 380},820 ${540 + 380},820`} fill="#FFFFFF" opacity={(0.1 + 0.05 * Math.sin(t * 20)) * eOut(range(t, 0, 0.3))} />
        <polygon points={`540,-20 ${540 - 160},820 ${540 + 160},820`} fill="#FFFFFF" opacity={0.12 * eOut(range(t, 0, 0.3))} />
      </Svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 540, display: "flex", justifyContent: "center" }}>
        <Kinetic text="光遗传学" at={q.title} size={210} color="#FFFFFF" stagger={0.08} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", fontFamily: FONT_EN, fontSize: 66, color: C.yellow, letterSpacing: 10, opacity: eOut(range(t, q.sub, q.sub + 0.3)) }}>OPTOGENETICS</div>
      {/* a light switch flipping on */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 940, display: "flex", justifyContent: "center", alignItems: "center", gap: 36, opacity: eOut(range(t, q.sub, q.sub + 0.3)) }}>
        <div style={{ width: 200, height: 100, borderRadius: 50, background: tog > 0.5 ? C.yellow : "#1B2A80", border: `6px solid ${C.ink}`, position: "relative", boxSizing: "border-box" }}>
          <div style={{ position: "absolute", top: 8, left: lerp(8, 108, tog), width: 72, height: 72, borderRadius: 36, background: "#FFFFFF", border: `5px solid ${C.ink}`, boxSizing: "border-box" }} />
        </div>
        <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 76, color: "#FFFFFF" }}>用光，开关大脑</div>
      </div>
      <div style={{ position: "absolute", left: 300 - 60, top: 990 - 60, width: 120, height: 120, borderRadius: 60, background: "#FFFFFF", opacity: 0.6 * range(t, 1.15, 1.5), scale: `${1 + 1.6 * eIn(range(t, 1.15, 1.6))}` }} />
    </Abs>
  );
};

// ───────────── 3 · the problem: 86 billion neurons, crude tools, Crick's wish
const inBrain = (x: number, y: number) =>
  ((x - 530) / 380) ** 2 + ((y - 880) / 250) ** 2 < 1 && y < 1080 ||
  ((x - 760) / 150) ** 2 + ((y - 1090) / 95) ** 2 < 1 ||
  ((x - 640) / 46) ** 2 + ((y - 1170) / 120) ** 2 < 1;
const BRAIN: [number, number][] = [];
for (let i = 0; BRAIN.length < 520 && i < 20000; i++) { const x = 130 + hash(i * 2) * 820, y = 610 + hash(i * 2 + 1) * 700; if (inBrain(x, y)) BRAIN.push([x, y]); }
const EDGES: [number, number][] = [];
BRAIN.forEach(([x, y], i) => {
  const near = BRAIN.map(([u, v], j) => [Math.hypot(u - x, v - y), j] as [number, number]).filter(([d, j]) => j > i && d < 70).sort((a, b) => a[0] - b[0]).slice(0, 2);
  near.forEach(([, j]) => EDGES.push([i, j]));
});
export const Problem: React.FC = () => {
  const t = useT(), sp = useSpring(), q = Q.problem;
  const cnt = eOut(range(t, q.count[0], q.count[1]));
  const E: [number, number] = [520, 870], ePin = eOut(range(t, q.electrode, q.electrode + 0.4)), zap = q.electrode + 0.4;
  const pillP = sp(q.drug, { damping: 12 }), wash = range(t, q.drug + 0.4, q.drug + 2.4);
  return (
    <Abs>
      <Dots color="#FFFFFF" opacity={0.06} />
      <Say at={q.count[0]} text="你的大脑里，有约" color="#FFFFFF" y={190} size={46} weight={700} center />
      <div style={{ position: "absolute", left: 0, right: 0, top: 255, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 12, color: C.yellow, opacity: eOut(range(t, q.count[0], q.count[0] + 0.3)) }}>
        <span style={{ fontFamily: FONT_EN, fontSize: 190, lineHeight: 1 }}>{Math.round(860 * cnt)}</span>
        <span style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 140, lineHeight: 1 }}>亿</span>
      </div>
      <Say at={q.count[1] - 0.3} text="个神经元" color="#FFFFFF" y={470} size={56} center />
      <Svg>
        {EDGES.map(([i, j], k) => {
          const a = BRAIN[i], b = BRAIN[j], ap = range(t, q.count[0] + hash(i) * 1.4, q.count[0] + hash(i) * 1.4 + 0.3);
          return <line key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#8F7CFF" strokeWidth={1.6} opacity={0.35 * ap * (t > q.net ? 0.8 + 0.6 * Math.sin(t * 6 + k) : 1)} />;
        })}
        {BRAIN.map(([x, y], i) => {
          const ap = range(t, q.count[0] + hash(i) * 1.4, q.count[0] + hash(i) * 1.4 + 0.3);
          const chatter = t > q.net ? Math.max(0, Math.sin(t * (3 + hash(i + 7) * 5) + i) - 0.85) / 0.15 : 0;
          const d = Math.hypot(x - E[0], y - E[1]);
          const zapK = t > zap ? Math.exp(-(t - zap) / 0.6) * clamp01(1 - d / 190) : 0;
          const washK = clamp01(wash * 1.6 - Math.hypot(x - 300, y - 760) / 700) * (1 - range(t, q.end - 0.4, q.end));
          const col = zapK > 0.05 ? C.yellow : washK > 0.05 ? C.pink : chatter > 0.3 ? "#FFFFFF" : "#B9A6FF";
          return <circle key={i} cx={x} cy={y} r={(4 + 3 * chatter + 8 * zapK + 2 * washK) * eOut(ap)} fill={col} opacity={0.6 + 0.4 * Math.max(chatter, zapK, washK)} />;
        })}
        {t > q.end - 1.0 && <circle cx={540} cy={880} r={8 + 80 * eIn(range(t, q.end - 1.0, q.end - 0.4))} fill={C.yellow} stroke="#FFFFFF" strokeWidth={4} />}
        {/* electrode */}
        {t > q.electrode && t < q.drug + 0.3 && <g opacity={1 - range(t, q.drug, q.drug + 0.3)}>
          <line x1={lerp(1000, E[0] + 120, ePin)} y1={lerp(500, E[1] - 200, ePin)} x2={lerp(1000, E[0], ePin) } y2={lerp(500, E[1], ePin)} stroke="#D7D7E0" strokeWidth={10} strokeLinecap="round" />
          {t > zap && [0, 1, 2, 3, 4, 5].map(k => { const a = k * 1.05 + t * 2; const r1 = 30, r2 = 150 * eOut(range(t, zap, zap + 0.3)); return <polyline key={k} points={`${E[0] + Math.cos(a) * r1},${E[1] + Math.sin(a) * r1} ${E[0] + Math.cos(a + 0.25) * r2 * 0.6},${E[1] + Math.sin(a + 0.25) * r2 * 0.6} ${E[0] + Math.cos(a) * r2},${E[1] + Math.sin(a) * r2}`} stroke={C.yellow} strokeWidth={5} fill="none" opacity={Math.exp(-(t - zap) / 0.5)} />; })}
          <Burst x={E[0]} y={E[1]} at={zap} t={t} color={C.yellow} r={190} />
          <text x={E[0] + 150} y={E[1] - 210} fontFamily={FONT_CN} fontWeight={900} fontSize={40} fill="#FFFFFF">电极</text>
        </g>}
        {/* drug */}
        {t > q.drug && t < q.end && <g opacity={1 - range(t, q.end - 0.4, q.end)} transform={`translate(300 ${lerp(560, 760, Math.min(1, pillP))}) rotate(-30)`}>
          <rect x={-60} y={-28} width={120} height={56} rx={28} fill="#FFFFFF" stroke={C.ink} strokeWidth={5} />
          <rect x={0} y={-28} width={60} height={56} rx={0} fill={C.pink} />
          <rect x={-60} y={-28} width={120} height={56} rx={28} fill="none" stroke={C.ink} strokeWidth={5} />
        </g>}
        {t > q.drug && t < q.end && <text x={190} y={680} fontFamily={FONT_CN} fontWeight={900} fontSize={40} fill="#FFFFFF" opacity={1 - range(t, q.end - 0.4, q.end)}>药物</text>}
      </Svg>
      <Say at={q.need} out={q.end - 0.3} text={"要弄清谁管什么，\n就得能单独开关它们"} color="#FFFFFF" y={1330} size={56} />
      <Say at={q.electrode + 0.3} out={q.end - 0.3} text="电极：一戳一大片，分不清谁是谁" color={C.yellow} y={1500} size={46} />
      <Say at={q.drug + 0.2} out={q.end - 0.3} text="药物：太慢，要几分钟才起效" color={C.pink} y={1580} size={46} />
    </Abs>
  );
};

// ───────────── 4 · how a neuron fires: gates in the membrane, ions rush in, voltage flips
export const NeuronScene: React.FC = () => {
  const t = useT(), q = Q.neuron, ink = C.ink;
  const open = eInOut(range(t, q.open, q.open + 0.35)) * (1 - eInOut(range(t, q.open + 1.6, q.open + 2.0)));
  const mvShown = Math.round(lerp(-70, 30, eInOut(range(t, q.open + 0.15, q.open + 0.6))) - 100 * eInOut(range(t, q.open + 1.6, q.open + 2.0)));
  const spike = range(t, q.spike, q.spike + 0.9), spike2 = range(t, q.spike + 1.0, q.spike + 1.9);
  const wish = eOut(range(t, q.wish, q.wish + 0.4));
  const MX = 540, MY = 1000, MR = 270;
  return (
    <Abs>
      <Dots color={ink} />
      <div style={{ position: "absolute", left: 70, top: 190 }}><Pill bg={ink} color={C.yellow} size={36}>先搞懂</Pill></div>
      <div style={{ position: "absolute", left: 70, top: 280 }}><Kinetic text="神经元怎么放电" at={0.1} size={110} color={ink} stagger={0.05} /></div>
      <Svg>
        <Neuron x={205} y={560} s={1.2} color="#FFFFFF" spike={spike > 0 && spike < 1 ? spike : spike2 > 0 && spike2 < 1 ? spike2 : -1} />
        <line x1={260} y1={615} x2={MX - MR * 0.7} y2={MY - MR * 0.7} stroke={ink} strokeWidth={4} strokeDasharray="10 10" opacity={eOut(range(t, 0.3, 0.6))} />
        <defs><clipPath id="mag"><circle cx={MX} cy={MY} r={MR} /></clipPath></defs>
        <g opacity={eOut(range(t, 0.3, 0.6))}>
          <circle cx={MX} cy={MY} r={MR} fill="#FFF7DA" stroke={ink} strokeWidth={8} />
          <g clipPath="url(#mag)">
            {[...Array(14)].map((_, i) => { const x = MX - 220 + hash(i) * 440, y = MY - 200 + hash(i + 30) * 110 + Math.sin(t * 3 + i) * 6; return <g key={i}><circle cx={x} cy={y} r={15} fill={C.orange} stroke={ink} strokeWidth={3} /><text x={x} y={y + 7} textAnchor="middle" fontFamily={FONT_UI} fontWeight={700} fontSize={20} fill={ink}>+</text></g>; })}
            <Membrane x0={MX - MR} x1={MX + MR} y={MY} open={open} gate={mixGate(wish)} t={t} />
            {wish > 0 && <g opacity={wish}>
              {[-1, 0, 1].map(k => <line key={k} x1={MX + k * 60 - 40} y1={MY - 240} x2={MX + k * 14} y2={MY - 80} stroke={BLUE} strokeWidth={8} strokeLinecap="round" opacity={0.5 + 0.5 * Math.sin(t * 12 + k)} />)}
              <circle cx={MX - 40} cy={MY - 250} r={26} fill={C.yellow} stroke={ink} strokeWidth={4} />
            </g>}
          </g>
          <text x={MX} y={MY - MR + 50} textAnchor="middle" fontFamily={FONT_CN} fontWeight={900} fontSize={30} fill={ink} opacity={0.7}>细胞外</text>
          <text x={MX} y={MY + MR - 30} textAnchor="middle" fontFamily={FONT_CN} fontWeight={900} fontSize={30} fill={ink} opacity={0.7}>细胞内</text>
        </g>
      </Svg>
      {/* membrane potential readout */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1290, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 18, opacity: eOut(range(t, q.gates, q.gates + 0.4)) }}>
        <span style={{ fontFamily: FONT_CN, fontWeight: 700, fontSize: 34, color: ink }}>膜电位</span>
        <span style={{ fontFamily: FONT_EN, fontSize: 76, color: mvShown > 0 ? C.red : ink, minWidth: 260, textAlign: "center" }}>{mvShown > 0 ? "+" : mvShown < 0 ? "−" : ""}{Math.abs(mvShown)}</span>
        <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 40, color: ink }}>mV</span>
      </div>
      <Say at={q.gates} out={q.open - 0.2} text="细胞膜上有一道道“闸门”：离子通道" color={ink} y={1420} size={50} />
      <Say at={q.open + 0.1} out={q.spike - 0.2} text="闸门一开，正离子涌入，电压瞬间翻转" color={ink} y={1420} size={50} />
      <Say at={q.spike} out={q.wish - 0.2} text="电信号沿轴突飞奔：这就是一次“放电”" color={ink} y={1420} size={50} />
      <div style={{ position: "absolute", left: 70, top: 1420 }}>{t > q.wish - 0.1 && <Kinetic text="要是有一道“光控闸门”……" at={q.wish} size={70} color={C.blue} stagger={0.04} />}</div>
      <Say at={q.wish + 0.8} text="光一照就打开，那该多好" color={ink} y={1530} size={44} weight={700} />
    </Abs>
  );
};
const mixGate = (k: number) => (k > 0.5 ? BLUE : "#7AA2FF");

// ───────────── 5 · the pond: Chlamydomonas swims to light; its light sensor is itself a gate
export const Pond: React.FC = () => {
  const t = useT(), sp = useSpring(), q = Q.pond, ink = C.ink;
  const drop = sp(q.drop, { damping: 12 }), zoom = eInOut(range(t, q.zoom, q.zoom + 0.7));
  const algaIn = eOut(range(t, q.zoom + 0.2, q.zoom + 0.8));
  const swim = eInOut(range(t, q.swim, q.swim + 2.4)) * (1 - eInOut(range(t, q.eyespot - 0.6, q.eyespot)));
  const zk = eInOut(range(t, q.eyespot, q.eyespot + 0.8));
  const S = lerp(1, 6, zk), ax = 540 + lerp(0, 160, swim) + 92 * S * zk, ay = 930 - lerp(0, 120, swim) + 30 * S * zk;
  const mag = eOut(range(t, q.eyespot + 0.5, q.eyespot + 0.9));
  const photon = range(t, q.open - 0.6, q.open), open = eInOut(range(t, q.open, q.open + 0.35));
  const MX = 540, MY = 960, MR = 300;
  return (
    <Abs>
      <Dots color={ink} opacity={0.1} />
      <Photo src="media/pond.jpg" at={-0.5} out={q.drop} zoom={[1.0, 1.3]} focus={[40, 75]} shade={0.35} dur={1.5} credit="图：danxoneil · CC BY 2.0" />
      <div style={{ position: "absolute", left: 70, top: 190 }}><Kinetic text="答案，藏在一个池塘里" at={0.05} size={86} color={t < q.drop ? "#FFFFFF" : ink} stagger={0.04} style={{ textShadow: t < q.drop ? "0 4px 24px rgba(0,0,0,0.7)" : "none" }} /></div>
      <Svg>
        {/* a drop of pond water */}
        {zoom < 1 && <g opacity={(1 - zoom) * clamp01(drop * 3)} style={{ transformOrigin: "540px 930px", scale: `${Math.min(1.1, drop) * lerp(1, 5, zoom)}` }}>
          <path d="M540 640 C 600 760, 700 840, 700 960 A160 160 0 1 1 380 960 C 380 840, 480 760, 540 640 Z" fill="#BDF5E6" stroke={ink} strokeWidth={7} />
          {[...Array(12)].map((_, i) => <ellipse key={i} cx={460 + hash(i) * 160 + Math.sin(t * 2 + i) * 8} cy={880 + hash(i + 9) * 170} rx={9} ry={12} fill={i === 5 ? "#3FA34D" : ALGA_DOT} stroke={ink} strokeWidth={2} />)}
        </g>}
        {/* the light it swims to */}
        <g opacity={eOut(range(t, q.swim, q.swim + 0.4)) * (1 - zk)}>
          {[...Array(12)].map((_, i) => { const a = (i / 12) * Math.PI * 2 + t * 0.5; return <line key={i} x1={880 + Math.cos(a) * 70} y1={480 + Math.sin(a) * 70} x2={880 + Math.cos(a) * 100} y2={480 + Math.sin(a) * 100} stroke={C.yellow} strokeWidth={8} strokeLinecap="round" />; })}
          <circle cx={880} cy={480} r={56} fill={C.yellow} stroke={ink} strokeWidth={6} />
          <polygon points={`880,480 ${ax - 80},${ay - 260} ${ax + 80},${ay - 200}`} fill={C.yellow} opacity={0.18} />
        </g>
        {algaIn > 0 && mag < 1 && <g opacity={algaIn * (1 - mag)}>
          <Alga x={ax} y={ay} s={lerp(0.3, 1, algaIn) * S} rot={lerp(0, 32, swim)} t={t} eye={t > q.swim ? 0.6 + 0.4 * Math.sin(t * 6) : 0} />
        </g>}
        {/* magnified: the eyespot's light sensor is a channel */}
        {mag > 0 && <g opacity={mag}>
          <defs><clipPath id="pmag"><circle cx={MX} cy={MY} r={MR} /></clipPath></defs>
          <circle cx={MX} cy={MY} r={MR} fill="#FFF3F0" stroke="#FF2E3B" strokeWidth={10} />
          <g clipPath="url(#pmag)">
            <Membrane x0={MX - MR} x1={MX + MR} y={MY + 30} open={open} gate={BLUE} t={t} lipid="#FFD9D2" />
            {photon > 0 && photon < 1 && <polyline points={[...Array(40)].map((_, k) => { const p = clamp01(photon * 1.2 - 0.2 + k / 40 * 0.2); const x = lerp(MX - 260, MX, p), y = lerp(MY - 260, MY - 20, p); return `${x + Math.sin(k * 1.4) * 10},${y}`; }).join(" ")} stroke={BLUE} strokeWidth={6} fill="none" />}
            <Burst x={MX} y={MY - 20} at={q.open} t={t} color={BLUE} r={160} />
          </g>
        </g>}
        {t > 7.0 && <circle cx={540} cy={990} r={20 + 120 * eIn(range(t, 7.0, 7.6))} fill={BLUE} opacity={0.75} />}
      </Svg>
      {mag > 0 && <div style={{ position: "absolute", left: 0, right: 0, top: 570, display: "flex", justifyContent: "center", opacity: mag }}>
        <Pill bg={ink} color="#FFFFFF" size={38}>通道视紫红质 · Channelrhodopsin</Pill>
      </div>}
      <Say at={q.zoom + 0.5} out={q.swim - 0.1} text="莱茵衣藻：全身只有一个细胞" sub="CHLAMYDOMONAS REINHARDTII" color={ink} y={1300} size={52} />
      <Say at={q.swim + 0.1} out={q.sci - 0.2} text="它没有眼睛，却能“看见”光、游向光" color={ink} y={1300} size={50} />
      <Inset src="media/chlamy.jpg" at={q.zoom + 0.6} out={q.sci - 0.2} x={540} y={1400} w={470} h={420} label="电镜下的真实衣藻" credit="图：Dartmouth Electron Microscope Facility · 公有领域" ink={ink} />
      <Say at={q.sci} out={q.eyespot - 0.2} text="两位德国科学家追问：它靠什么感光？" color={ink} y={1300} size={50} />
      {t > q.sci && t < q.eyespot + 0.3 && (
        <div style={{ position: "absolute", left: 70, right: 70, top: 1420, display: "flex", gap: 30, opacity: 1 - range(t, q.eyespot - 0.3, q.eyespot) }}>
          {[["彼得·黑格曼", "PETER HEGEMANN", "media/hegemann.jpg", "45% 28%"], ["格奥尔格·纳格尔", "GEORG NAGEL", "media/nagel.jpg", "50% 30%"]].map(([cn, en, ph, pos], k) => { const s = sp(q.sci + 0.4 + k * 0.25); return (
            <div key={cn} style={{ flex: 1, background: "#FFFFFF", borderRadius: 30, padding: "22px 22px", boxShadow: `0 0 0 5px ${ink}`, opacity: clamp01(s * 3), translate: `0px ${(1 - Math.min(1, s)) * 60}px`, display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ width: 96, height: 96, borderRadius: 48, overflow: "hidden", flexShrink: 0, boxShadow: `0 0 0 5px ${ink}` }}><Img src={staticFile(ph)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} /></div>
              <div>
                <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 36, color: ink }}>{cn}</div>
                <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 18, color: ink, opacity: 0.6, letterSpacing: 1, marginTop: 4 }}>{en} · 德国</div>
              </div>
            </div>
          ); })}
        </div>
      )}
      <Say at={q.eyespot + 0.6} out={q.dream - 0.2} text={"2002–2003 年，他们发现：\n这个感光蛋白，本身就是一道闸门"} color={ink} y={1300} size={48} />
      <div style={{ position: "absolute", left: 70, top: 1460 }}>{t > q.open - 0.1 && <Kinetic text="光一照，它自己打开！" at={q.open} size={84} color="#FFFFFF" stagger={0.04} out={q.dream - 0.3} />}</div>
      <Say at={q.dream} text={"这正是神经科学家\n梦寐以求的“光控闸门”"} color={ink} y={1300} size={52} />
    </Abs>
  );
};
const ALGA_DOT = "#7ED957";
