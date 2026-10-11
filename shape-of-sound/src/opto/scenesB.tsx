import React from "react";
import { C, clamp01, eInOut, eOut, FONT_CN, FONT_EN, FONT_UI, Kinetic, lerp, range, useSpring, useT } from "../theme";
import { Abs, AMBER, BLUE, Burst, Dots, GLOW, implantAt, Mouse, Neuron, Pill, Q, Say, Scope, Svg } from "./kit";
import { spinMouse } from "./scenesA";
import { Inset } from "../media";
import { Img, staticFile } from "remotion";

// ───────────── 6 · 2005: put the algal gate into neurons
export const Transplant: React.FC = () => {
  const t = useT(), sp = useSpring(), q = Q.transplant, ink = C.ink;
  const pulses = [...Array(q.pulses)].map((_, k) => q.pulse0 + k * q.pulseStep);
  const card = sp(q.card, { damping: 12 });
  const step = (k: number) => sp(q.steps[k], { damping: 11 });
  const scope = eOut(range(t, q.scope, q.scope + 0.4));
  const cols = [210, 540, 870], IY = 770;
  return (
    <Abs>
      <Dots color={ink} opacity={0.08} />
      <div style={{ position: "absolute", left: 70, top: 180, fontFamily: FONT_EN, fontSize: 110, color: C.blue, lineHeight: 1, opacity: eOut(range(t, 0, 0.3)) }}>2005</div>
      <div style={{ position: "absolute", left: 70, top: 310 }}><Kinetic text="把绿藻的闸门，装进神经元" at={0.15} size={68} color={ink} stagger={0.035} /></div>
      {/* Deisseroth */}
      <div style={{ position: "absolute", left: 70, right: 70, top: 430, display: "flex", alignItems: "center", gap: 26, background: "#FFFFFF", borderRadius: 30, padding: "20px 28px", boxShadow: `0 0 0 5px ${ink}`, opacity: clamp01(card * 3), translate: `${(1 - Math.min(1, card)) * -80}px 0px` }}>
        <div style={{ width: 84, height: 84, borderRadius: 42, background: BLUE, border: `5px solid ${ink}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 26, height: 26, borderRadius: 13, background: C.yellow, boxShadow: `0 0 0 10px rgba(255,210,63,0.35)` }} />
        </div>
        <div>
          <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 46, color: ink }}>卡尔·戴瑟罗斯</div>
          <div style={{ fontFamily: FONT_CN, fontWeight: 700, fontSize: 28, color: ink, opacity: 0.65, marginTop: 4 }}>美国斯坦福大学 · 精神科医生 + 生物工程师</div>
        </div>
      </div>
      <Svg>
        {/* ① gene */}
        <g opacity={clamp01(step(0) * 3)} style={{ transformOrigin: `${cols[0]}px ${IY}px`, scale: `${Math.min(1.1, step(0))}` }}>
          {[0, 1].map(s => <path key={s} d={[...Array(25)].map((_, k) => `${k ? "L" : "M"}${cols[0] - 120 + k * 10} ${IY + Math.sin(k * 0.55 + s * Math.PI + t * 2) * 34}`).join(" ")} stroke={ink} strokeWidth={6} fill="none" />)}
          {[...Array(12)].map((_, k) => { const x = cols[0] - 115 + k * 20, ph = (x - cols[0] + 120) / 10 * 0.55 + t * 2; return <line key={k} x1={x} y1={IY + Math.sin(ph) * 34} x2={x} y2={IY + Math.sin(ph + Math.PI) * 34} stroke={k >= 4 && k <= 7 ? BLUE : ink} strokeWidth={k >= 4 && k <= 7 ? 8 : 3} />; })}
          <rect x={cols[0] - 45} y={IY - 62} width={90} height={124} rx={16} fill="none" stroke={BLUE} strokeWidth={5} strokeDasharray="10 8" />
          <text x={cols[0]} y={IY - 76} textAnchor="middle" fontFamily={FONT_EN} fontSize={30} fill={BLUE}>ChR2</text>
        </g>
        {/* ② virus courier */}
        <g opacity={clamp01(step(1) * 3)} style={{ transformOrigin: `${cols[1]}px ${IY}px`, scale: `${Math.min(1.1, step(1))}` }}>
          {[...Array(12)].map((_, k) => { const a = (k / 12) * Math.PI * 2; return <g key={k}><line x1={cols[1] + Math.cos(a) * 70} y1={IY + Math.sin(a) * 70} x2={cols[1] + Math.cos(a) * 96} y2={IY + Math.sin(a) * 96} stroke={ink} strokeWidth={5} /><circle cx={cols[1] + Math.cos(a) * 98} cy={IY + Math.sin(a) * 98} r={8} fill={C.pink} stroke={ink} strokeWidth={3} /></g>; })}
          <polygon points={[...Array(6)].map((_, k) => { const a = (k / 6) * Math.PI * 2 + Math.PI / 6 + t * 0.4; return `${cols[1] + Math.cos(a) * 76},${IY + Math.sin(a) * 76}`; }).join(" ")} fill={C.mint} stroke={ink} strokeWidth={6} />
          <path d={[...Array(9)].map((_, k) => `${k ? "L" : "M"}${cols[1] - 32 + k * 8} ${IY + Math.sin(k * 1.2 + t * 4) * 12}`).join(" ")} stroke={BLUE} strokeWidth={7} fill="none" strokeLinecap="round" />
        </g>
        {/* ③ only the chosen cell type */}
        <g opacity={clamp01(step(2) * 3)} style={{ transformOrigin: `${cols[2]}px ${IY}px`, scale: `${Math.min(1.1, step(2))}` }}>
          {[[-60, -45, true], [55, -55, false], [-40, 60, false], [65, 50, true]].map(([dx, dy, hit], k) => (
            <g key={k}>
              <circle cx={cols[2] + (dx as number)} cy={IY + (dy as number)} r={36} fill={hit ? "#DCE7FF" : "#FFFFFF"} stroke={ink} strokeWidth={5} />
              {hit && [...Array(6)].map((_, j) => { const a = (j / 6) * Math.PI * 2; return <circle key={j} cx={cols[2] + (dx as number) + Math.cos(a) * 36} cy={IY + (dy as number) + Math.sin(a) * 36} r={7} fill={BLUE} />; })}
            </g>
          ))}
        </g>
        {[0, 1].map(k => <path key={k} d={`M${cols[k] + 130} ${IY} L${cols[k + 1] - 130} ${IY} M${cols[k + 1] - 146} ${IY - 14} L${cols[k + 1] - 130} ${IY} L${cols[k + 1] - 146} ${IY + 14}`} stroke={ink} strokeWidth={5} fill="none" opacity={eOut(range(t, q.steps[k + 1] - 0.2, q.steps[k + 1]))} />)}
        {/* the scope: blue flashes on top, spikes below, locked together */}
        {t > q.scope && <g opacity={scope}>
          <Scope x={70} y={1060} w={940} h={300} t={t} t0={q.pulse0 - 0.3} t1={q.pulse0 + q.pulses * q.pulseStep - 0.2} pulses={pulses} light={BLUE} />
          <text x={96} y={1150} fontFamily={FONT_CN} fontWeight={900} fontSize={26} fill={BLUE}>蓝光</text>
          <text x={96} y={1335} fontFamily={FONT_CN} fontWeight={900} fontSize={26} fill={ink} opacity={0.6}>神经元电压</text>
        </g>}
      </Svg>
      {[["① 取出感光蛋白基因", 0], ["② 装进无害病毒", 1], ["③ 只送进指定神经元", 2]].map(([s, k]) => (
        <div key={k as number} style={{ position: "absolute", left: cols[k as number] - 160, width: 320, top: 900, textAlign: "center", fontFamily: FONT_CN, fontWeight: 900, fontSize: 30, color: ink, opacity: eOut(range(t, q.steps[k as number] + 0.2, q.steps[k as number] + 0.5)) }}>{s}</div>
      ))}
      <Say at={q.pulse0} out={q.only - 0.3} text="蓝光闪一下，神经元就放电一次" color={ink} y={1400} size={52} />
      <div style={{ position: "absolute", left: 70, top: 1490 }}>{t > q.ms - 0.1 && <Kinetic text="精确到毫秒" at={q.ms} size={110} color={C.blue} stagger={0.06} out={q.only - 0.3} />}</div>
      <Say at={q.only} text="只有被“改装”的神经元听光指挥，其余不受影响" color={ink} y={1400} size={40} weight={700} />
    </Abs>
  );
};

// ───────────── 7 · blue turns neurons on, yellow turns them off; the fibre; back to the mouse
export const Switch: React.FC = () => {
  const t = useT(), sp = useSpring(), q = Q.switch;
  const fires = [...Array(q.fires)].map((_, k) => q.fire0 + k * q.fireStep);
  const spont = q.spont;   // the silenced neuron fires on its own outside the yellow light
  const span: [number, number] = [q.fire0, q.fire0 + q.fires * q.fireStep];
  const lab = sp(q.labels, { damping: 10 });
  const ot = Math.max(0, t - q.spin), m = spinMouse(ot, 300, 1540, 105), [ix, iy] = implantAt(m.x, m.y, m.a, 0.5);
  const lastFire = Math.max(-9, ...fires.filter(f => f <= t)), fk = Math.exp(-(t - lastFire) / 0.08);
  return (
    <Abs>
      <Abs style={{ left: 540, background: AMBER }} />
      <Abs style={{ top: 1200, background: C.ink }} />
      <Abs style={{ bottom: 1920 - 330, background: C.ink }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 185, display: "flex", justifyContent: "center" }}><Kinetic text="不止能开，还能关" at={0.05} size={100} color="#FFFFFF" stagger={0.05} /></div>
      {[["开", "蓝光 · ChR2", "来自绿藻", "#FFFFFF", 270], ["关", "黄光 · NpHR", "来自盐湖里的古菌", C.ink, 810]].map(([g, a, b, col, x], k) => (
        <div key={k} style={{ position: "absolute", left: (x as number) - 250, width: 500, top: 360, textAlign: "center", color: col as string, opacity: clamp01(lab * 3), scale: `${Math.min(1.1, lab)}` }}>
          <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 170, lineHeight: 1 }}>{g}</div>
          <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 40, marginTop: 10 }}>{a}</div>
          <div style={{ fontFamily: FONT_CN, fontWeight: 700, fontSize: 26, opacity: 0.75, marginTop: 4 }}>{b}</div>
        </div>
      ))}
      <Svg>
        {/* beams onto each neuron */}
        <polygon points={`150,640 ${150 - 70},820 ${150 + 70},820`} fill={GLOW} opacity={t > q.fire0 && t < span[1] ? 0.35 + 0.4 * fk : 0.08} />
        <polygon points={`690,640 ${690 - 70},820 ${690 + 70},820`} fill="#FFE7A3" opacity={t > span[0] && t < span[1] ? 0.7 : 0.1} />
        <Neuron x={150} y={860} s={0.55} color="#FFFFFF" glow={GLOW} glowK={t > q.fire0 && t < span[1] ? fk : 0} spike={t > q.fire0 && t < span[1] + 0.3 ? range(t, lastFire, lastFire + 0.3) : -1} />
        <Neuron x={690} y={860} s={0.55} color="#FFFFFF" />
        <Scope x={40} y={960} w={460} h={210} t={t} t0={0} t1={q.mouse} pulses={fires} light={BLUE} bg="#EAF0FF" />
        <Scope x={580} y={960} w={460} h={210} t={t} t0={0} t1={q.mouse} pulses={[]} spikes={spont} span={span} light={AMBER} bg="#FFF6DD" />
        {/* the mouse again */}
        <g opacity={eOut(range(t, q.mouse, q.mouse + 0.4))}>
          <circle cx={300} cy={1540} r={190} fill="#1C1C26" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={4} />
          {t > q.spin && <path d={`M300 1230 Q 300 1380 ${ix} ${iy}`} stroke={GLOW} strokeWidth={16} fill="none" opacity={0.35} />}
          <path d={`M300 1230 Q 300 1380 ${ix} ${iy}`} stroke={t > q.spin ? "#DDEBFF" : "#6B6F80"} strokeWidth={5} fill="none" />
          {t > q.spin && [4, 3, 2, 1].map(k => { const g = spinMouse(Math.max(0, ot - k * 0.035), 300, 1540, 105); return <Mouse key={k} x={g.x} y={g.y} a={g.a} s={0.5} opacity={0.3 * (1 - k / 5)} />; })}
          <Mouse x={m.x} y={m.y} a={m.a} s={0.5} glow={t > q.spin ? 1 : 0} />
        </g>
      </Svg>
      <Say at={q.labels + 0.4} out={q.mouse - 0.2} text="蓝光：放电" color={GLOW} y={1210} size={34} weight={900} x={50} />
      <Say at={q.labels + 0.6} out={q.mouse - 0.2} text="黄光：原本在放电的神经元，安静了" color={AMBER} y={1210} size={30} weight={900} x={590} />
      <Say at={q.mouse} text={"还记得开头\n那只小鼠吗？"} color="#FFFFFF" y={1330} size={54} x={540} />
    </Abs>
  );
};

// ───────────── 9 · 2021: partial sight restored
export const Sight: React.FC = () => {
  const t = useT(), sp = useSpring(), q = Q.sight;
  const EX = 540, EY = 760;
  const die = eInOut(range(t, q.retina + 0.4, q.retina + 1.4));
  const inj = range(t, q.inject + 0.3, q.inject + 1.8);
  const gog = sp(q.goggles, { damping: 12 });
  const see = eOut(range(t, q.see, q.see + 0.8));
  const rods = [...Array(13)].map((_, i) => 230 + i * 52), RY = 1020;
  return (
    <Abs>
      <Abs style={{ background: `radial-gradient(circle at 50% 70%, rgba(255,176,0,${0.45 * see}), rgba(14,14,18,0) 70%)` }} />
      <div style={{ position: "absolute", left: 70, top: 180 }}><Kinetic text="2021" at={0.05} size={140} color={AMBER} font={FONT_EN} weight={400} stagger={0.06} /></div>
      <div style={{ position: "absolute", left: 70, top: 345 }}><Kinetic text="一位失明多年的患者" at={0.4} size={72} color="#FFFFFF" stagger={0.04} /></div>
      <Svg>
        {/* the eye */}
        <g opacity={eOut(range(t, 0.6, 1.0)) * (1 - see * 0.85)}>
          <path d={`M${EX - 280} ${EY} Q ${EX} ${EY - 210} ${EX + 280} ${EY} Q ${EX} ${EY + 210} ${EX - 280} ${EY} Z`} fill="#F5F1E8" stroke="#FFFFFF" strokeWidth={6} />
          <circle cx={EX} cy={EY} r={96} fill={t > q.see - 0.4 ? AMBER : "#6B6F80"} stroke={C.ink} strokeWidth={6} />
          <circle cx={EX} cy={EY} r={42} fill={C.ink} />
          {/* goggles */}
          {t > q.goggles && <g opacity={clamp01(gog * 3)} style={{ translate: `0px ${(1 - Math.min(1, gog)) * -200}px` }}>
            <rect x={EX - 330} y={EY - 150} width={660} height={300} rx={120} fill="none" stroke={AMBER} strokeWidth={22} />
            <rect x={EX - 330} y={EY - 150} width={660} height={300} rx={120} fill={AMBER} opacity={0.12} />
          </g>}
        </g>
        {/* retina strip: photoreceptors above, the surviving cells below */}
        <g opacity={eOut(range(t, q.retina, q.retina + 0.4)) * (1 - see)}>
          <text x={110} y={RY - 70} fontFamily={FONT_CN} fontWeight={900} fontSize={28} fill="#FFFFFF" opacity={0.7}>视网膜</text>
          {rods.map((x, i) => <rect key={i} x={x - 14} y={RY - 40 + die * (30 + (i % 3) * 20)} width={28} height={70} rx={14} fill={die > 0.3 ? "#4A4A58" : "#C9C9D6"} opacity={1 - die * 0.75} />)}
          {rods.filter((_, i) => i % 2 === 0).map((x, i) => { const lit = clamp01(inj * 8 - i); return <circle key={i} cx={x} cy={RY + 90} r={22} fill={lit > 0.5 ? AMBER : "#2A2A35"} stroke="#FFFFFF" strokeWidth={4} />; })}
          {t > q.goggles + 0.4 && [...Array(5)].map((_, k) => <line key={k} x1={EX - 120 + k * 60} y1={EY + 150} x2={rods[k * 3] } y2={RY - 50} stroke={AMBER} strokeWidth={4} opacity={0.35 + 0.35 * Math.sin(t * 10 + k)} />)}
        </g>
        {/* syringe */}
        {t > q.inject && t < q.goggles && <g opacity={1 - range(t, q.goggles - 0.3, q.goggles)} transform={`translate(${lerp(1080, 860, eOut(range(t, q.inject, q.inject + 0.5)))} ${EY - 40}) rotate(-25)`}>
          <rect x={0} y={-22} width={200} height={44} rx={10} fill="#FFFFFF" stroke={C.ink} strokeWidth={4} />
          <rect x={10} y={-16} width={110 * (1 - inj)} height={32} rx={6} fill={AMBER} />
          <line x1={0} y1={0} x2={-90} y2={0} stroke="#FFFFFF" strokeWidth={5} />
          <rect x={200} y={-8} width={50} height={16} fill="#FFFFFF" />
        </g>}
        {/* what he saw: a notebook on the table */}
        {see > 0 && <g opacity={see}>
          <rect x={390} y={1230} width={300} height={190} rx={18} fill="none" stroke={AMBER} strokeWidth={8} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - see} />
          {[0, 1, 2, 3].map(k => <line key={k} x1={440} y1={1280 + k * 34} x2={440 + 200 * see} y2={1280 + k * 34} stroke={AMBER} strokeWidth={5} opacity={0.7} />)}
          {[0, 1, 2, 3, 4].map(k => <circle key={k} cx={412} cy={1258 + k * 34} r={7} fill="none" stroke={AMBER} strokeWidth={4} />)}
          <line x1={200} y1={1440} x2={880} y2={1440} stroke={AMBER} strokeWidth={5} opacity={0.5} />
          <Burst x={540} y={1325} at={q.see + 0.2} t={t} color={AMBER} r={260} />
        </g>}
      </Svg>
      <Say at={q.retina} out={q.inject - 0.2} text={"视网膜色素变性：\n感光细胞已大量死亡"} color="#FFFFFF" y={1220} size={48} />
      <Inset src="media/rp_fundus.jpg" at={q.retina + 0.3} out={q.inject - 0.2} x={70} y={1390} w={420} h={360} label="真实眼底照片" credit="图：Christian Hamel · CC BY 2.0" ink="#FFFFFF" />
      <Say at={q.inject + 0.1} out={q.goggles - 0.2} text={"医生把一种藻类感光蛋白的基因\n注射进他的一只眼睛"} color="#FFFFFF" y={1220} size={46} />
      <Say at={q.goggles + 0.1} out={q.see - 0.2} text={"再戴上特制眼镜：\n把画面变成琥珀色光，投进眼底"} color="#FFFFFF" y={1220} size={46} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1480, display: "flex", justifyContent: "center" }}>{t > q.see && <Kinetic text="他“看见”了桌上的笔记本" at={q.see + 0.1} size={68} color={AMBER} stagger={0.04} />}</div>
      <Say at={q.count} text="39 次测试，摸到了 36 次" sub="部分恢复视觉 · NATURE MEDICINE 2021" color="#FFFFFF" y={1590} size={46} center />
    </Abs>
  );
};

// ───────────── 10 · the prize and the question it began with
export const Nobel: React.FC = () => {
  const t = useT(), sp = useSpring(), q = Q.nobel, ink = C.ink;
  const people = [
    { cn: "彼得·黑格曼", en: "PETER HEGEMANN", aff: "德国 · 柏林洪堡大学", col: "#7ED957", photo: "media/hegemann.jpg", pos: "45% 28%" },
    { cn: "格奥尔格·纳格尔", en: "GEORG NAGEL", aff: "德国 · 维尔茨堡大学", col: BLUE, photo: "media/nagel.jpg", pos: "50% 30%" },
    { cn: "卡尔·戴瑟罗斯", en: "KARL DEISSEROTH", aff: "美国 · 斯坦福大学", col: C.yellow, photo: "media/deisseroth.jpg", pos: "64% 24%" },
  ];
  return (
    <Abs>
      <Dots color={ink} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 190, display: "flex", justifyContent: "center", opacity: clamp01(sp(q.tag) * 3), scale: `${Math.min(1.1, sp(q.tag))}` }}>
        <Pill bg={ink} color="#FFFFFF" size={42}>2026 诺贝尔生理学或医学奖</Pill>
      </div>
      {people.map((p, k) => {
        const s = sp(q.people[k], { damping: 12 });
        return (
          <div key={k} style={{ position: "absolute", left: 70, right: 70, top: 320 + k * 200, height: 170, display: "flex", alignItems: "center", gap: 30, background: "#FFFFFF", borderRadius: 32, boxShadow: `0 0 0 5px ${ink}`, padding: "0 30px", boxSizing: "border-box", opacity: clamp01(s * 3), translate: `${(1 - Math.min(1, s)) * -140}px 0px` }}>
            <div style={{ width: 120, height: 120, borderRadius: 60, overflow: "hidden", flexShrink: 0, boxShadow: `0 0 0 6px ${p.col}, 0 0 0 10px ${ink}` }}>
              <Img src={staticFile(p.photo)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: p.pos }} />
            </div>
            <div>
              <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 52, color: ink }}>{p.cn}</div>
              <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 24, color: ink, opacity: 0.65, letterSpacing: 2, marginTop: 6 }}>{p.en} · {p.aff}</div>
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 90, right: 90, top: 940, textAlign: "center", fontFamily: FONT_CN, fontWeight: 700, fontSize: 38, color: ink, lineHeight: 1.5, opacity: eOut(range(t, q.cite, q.cite + 0.4)) }}>“表彰他们在光门控离子通道<br />与光遗传学方面的发现”</div>
      <Say at={q.q} text="一切，始于一个看似“没用”的问题：" color={ink} y={1120} size={44} center />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1210, height: 170, background: ink, display: "flex", justifyContent: "center", alignItems: "center", opacity: eOut(range(t, q.a - 0.2, q.a + 0.1)), clipPath: `inset(0 ${(1 - eInOut(range(t, q.a - 0.2, q.a + 0.2))) * 100}% 0 0)` }}>
        <Kinetic text="绿藻，是怎么看见光的？" at={q.a} size={78} color="#FFFFFF" stagger={0.045} />
      </div>
      <Say at={q.a + 1.6} text="从池塘里的一个细胞，到照进大脑的一束光" color={ink} y={1440} size={40} weight={700} center />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1650, textAlign: "center", fontFamily: FONT_CN, fontWeight: 700, fontSize: 24, color: ink, opacity: 0.5 * eOut(range(t, q.src, q.src + 0.4)) }}>资料：诺贝尔奖官方公告 · Nature Neuroscience 2005 · Nature Medicine 2021</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1615, textAlign: "center", fontFamily: FONT_UI, fontWeight: 500, fontSize: 20, color: ink, opacity: 0.55 * eOut(range(t, q.people[2], q.people[2] + 0.4)) }}>照片：Millencolin（CC BY-SA 4.0 / CC0）· Christopher Michel（CC BY-SA 4.0）</div>
    </Abs>
  );
};
