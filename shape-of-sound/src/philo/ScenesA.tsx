// The opening (a man with a lamp at noon), the title, I 古典 and II 古典犬儒.
import React from "react";
import { FLAME, GOLD, INK, LATIN, NIGHT, PAPER, PJ, SANS, SERIF, clamp01, eIn, eInOut, eOut, lerp, range, rnd, win } from "./base";
import { Alexander, Diogenes, Jar, Person, Socrates } from "./Icons";
import { Dust, Flame, Glow, Lamp, Line, Rays, Tag } from "./Kit";

const H = PJ.hook;
const Fill: React.FC<React.PropsWithChildren<{ bg: string }>> = ({ bg, children }) => <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>{children}</div>;
const Svg: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, ...style }}>{children}</svg>;

// a market street at noon: a row of people at two depths, drifting; `look` turns them toward the man with the lamp
export const Street: React.FC<{ t: number; c: string; look?: number; seed?: number; dx?: number }> = ({ t, c, look = 0, seed = 0, dx = 0 }) => (
  <>
    {Array.from({ length: 13 }, (_, i) => {
      const far = i % 2 === 0, s = far ? 0.62 : 0.95;
      const x = ((rnd(i + seed) * 2200 + t * (far ? 14 : 26) * (i % 3 === 0 ? -1 : 1) + dx * (far ? 0.4 : 1)) % 2200 + 2200) % 2200 - 140;
      const y = far ? 660 : 780;
      const face = look > 0.5 ? (x < 900 ? 1 : -1) : i % 3 === 0 ? -1 : 1;
      return <g key={i} transform={`translate(${x} ${y}) scale(${s})`} opacity={far ? 0.55 : 0.9}><Person c={c} b={c} h={0.9 + rnd(i + 3) * 0.25} w={0.9 + rnd(i + 5) * 0.3} face={face} /></g>;
    })}
  </>
);

export const Hook: React.FC<{ t: number }> = ({ t }) => {
  const noon = eInOut(range(t, H.noon, H.noon + 0.6));
  const z = eInOut(range(t, H.noon, H.noon + 0.9));
  const S = lerp(3.2, 1, z), gx = lerp(275, 1000 + (t - 1.4) * 34, z), gy = lerp(584, 650, z);
  const push = eIn(range(t, 5.55, 6.0));                       // the camera dives into the flame
  const fx = gx + 214 * S, fy = gy - 20 * S;
  const look = eOut(range(t, H.ans, H.ans + 0.3));
  return (
    <Fill bg={NIGHT}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${fx}px ${fy}px`, transform: `scale(${1 + 9 * push})` }}>
        <div style={{ position: "absolute", inset: 0, background: PAPER, opacity: noon }} />
        <Svg>
          <g opacity={noon}>
            <Glow x={1500} y={220} r={520} id="hsun" c="#FFFFFF" o={1} />
            <Rays x={1500} y={220} r={1400} t={t} c="#FFF3D0" o={0.5} n={24} />
            <circle cx={1500} cy={220} r={110} fill="#FFFDF4" />
            <rect x={0} y={860} width={1920} height={220} fill="#E4D2AC" />
            <Street t={t} c={INK} look={look} />
          </g>
          <Glow x={fx} y={fy - 20} r={260 * (1 - noon * 0.6)} id="hflame" o={1 - noon * 0.5} />
          <g transform={`translate(${gx} ${gy}) scale(${S})`}><Diogenes c={INK} b={PAPER} t={t} /></g>
        </Svg>
        <Line t={t} at={H.t1} out={5.6} text="大白天，" x={120} y={150} size={92} color={INK} />
        <Line t={t} at={H.t2} out={5.6} text="他提着灯上街。" x={120} y={262} size={92} color={INK} />
        <Tag t={t} at={H.ask} out={5.6} text="「你在找什么？」" x={1420} y={540} size={40} bg={INK} fg={PAPER} anchor="center" />
        <Line t={t} at={H.ans} out={5.6} text="「找一个人。」" x={120} y={400} size={118} color="#B3101F" />
        <Tag t={t} at={H.name} out={5.6} text={<span>第欧根尼 <span style={{ fontFamily: LATIN, fontStyle: "italic", fontWeight: 600 }}>Diogenes</span> · 公元前 4 世纪 · 雅典</span>} x={124} y={560} size={34} bg={GOLD} fg={INK} />
      </div>
      <div style={{ position: "absolute", inset: 0, background: NIGHT, opacity: push }} />
    </Fill>
  );
};

export const Title: React.FC<{ t: number }> = ({ t }) => {
  const T0 = PJ.title.t;
  const k = eOut(range(t, T0, T0 + 0.5));
  return (
    <Fill bg={NIGHT}>
      <Svg>
        <Glow x={960} y={430} r={700} id="tglow" o={k} />
        <g transform={`translate(${960 - 116 * 1.6} ${520}) scale(1.6)`} opacity={k}><Lamp t={t} ink="#2A1E14" /></g>
      </Svg>
      <Dust t={t} o={0.5 * k} />
      <Line t={t} at={T0 + 0.1} out={PJ.title.out + 0.5} text="提灯的人" x={960} y={600} size={170} color={PAPER} anchor="center" stagger={0.07} tracking={18} glow="rgba(255,194,74,0.35)" />
      <Line t={t} at={T0 + 0.5} out={PJ.title.out + 0.5} text="60 秒 · 一盏灯照亮西方哲学的一条线" x={960} y={810} size={40} color={GOLD} anchor="center" font={SANS} weight={700} stagger={0.015} />
    </Fill>
  );
};

// a black-figure meander band
const Meander: React.FC<{ y: number; c: string; w?: number }> = ({ y, c, w = 1920 }) => (
  <g transform={`translate(0 ${y})`}>
    <rect x={0} y={-2} width={w} height={4} fill={c} /><rect x={0} y={40} width={w} height={4} fill={c} />
    {Array.from({ length: Math.ceil(w / 48) }, (_, i) => <path key={i} d={`M${i * 48 + 6},34 v-26 h30 v18 h-14 v-8`} fill="none" stroke={c} strokeWidth={5} />)}
  </g>
);

// ═══ I 古典: Socrates' question, Plato's cave, Aristotle's mean
export const Classic: React.FC<{ t: number }> = ({ t }) => {
  const C = PJ.classic, S0 = PJ.sec[0], ink = S0.ink, bg = S0.bg, cream = "#F4D9B8";
  const bust = win(t, C.socrates - 0.5, C.cave + 0.3, 0.4, 0.35), cave = win(t, C.cave - 0.1, C.mean + 0.2, 0.35, 0.3), mean = win(t, C.mean - 0.1, 15, 0.35, 0.1);
  const lt = t - C.cave, turn = eInOut(range(t, C.turn, C.turn + 0.3)), walk = eInOut(range(t, C.out, C.mean + 0.1));
  const sun = clamp01(win(t, C.out - 0.2, 15, 0.4, 0.1) + 0);
  const sw = Math.sin((t - C.mean) * 7) * Math.exp(-Math.max(0, t - C.settle) * 3) * (t < C.settle ? 1 : 1);
  const mx = 1170 + 420 * (t < C.settle ? Math.sin((t - C.mean) * 9) * (1 - range(t, C.mean, C.settle)) : sw * 0.15);
  return (
    <Fill bg={bg}>
      <Svg>
        <Meander y={890} c={ink} />
        {/* Socrates */}
        <g transform={`translate(${380 - (1 - bust) * 200} 560) scale(1.35)`} opacity={bust}><Socrates c={ink} b={cream} /></g>
        {/* the cave */}
        <g opacity={cave}>
          <path d="M560,780 L560,330 C700,250 1000,240 1200,300 C1300,330 1340,370 1360,420 L1360,780 Z" fill={ink} />
          <path d="M1300,420 L1420,330 L1460,350 L1360,470 Z" fill={ink} />
          <rect x={590} y={350} width={18} height={420} fill="#3A2416" />
          {/* the shadows of the puppets, cast on the back wall */}
          {[0, 1, 2].map((i) => {
            const k = Math.sin(lt * 2.4 + i * 1.3) * 26;
            const d = i === 0 ? `M640,${470 + k} l60,-50 l30,90 Z` : i === 1 ? `M680,${610 + k * 0.6} m-40,0 a40,40 0 1 0 80,0 a40,40 0 1 0 -80,0` : `M660,${380 + k * 0.8} h70 v60 h-70 Z`;
            return <path key={i} d={d} fill="#5C3A22" opacity={0.95} />;
          })}
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${760 + i * 70 + (i === 2 ? walk * 560 : 0)} ${640 - (i === 2 ? walk * 270 : 0)}) scale(${(i === 2 ? (turn > 0.5 ? -1 : 1) : 1) * 0.42} 0.42)`}>
              <Person c={cream} b={cream} face={1} />
            </g>
          ))}
          <rect x={1020} y={590} width={150} height={60} fill={cream} opacity={0.85} />
          {[0, 1, 2].map((i) => <line key={i} x1={1050 + i * 40} y1={590} x2={1050 + i * 40 + Math.sin(lt * 2.4 + i * 1.3) * 8} y2={520} stroke={cream} strokeWidth={4} />)}
          <g transform="translate(1240 660)"><Flame t={t} s={1.1} /></g>
          <Glow x={1240} y={630} r={240} id="cavefire" />
          <text x={760} y={330} fontFamily={SANS} fontWeight={900} fontSize={30} fill={cream} opacity={0.9}>影子</text>
          <text x={1190} y={760} fontFamily={SANS} fontWeight={900} fontSize={30} fill={cream} opacity={0.9}>火</text>
        </g>
        {/* the Good: a sun outside the cave, which stays for the rest of the section (the iris opens from it) */}
        <g opacity={sun}>
          <Rays x={1430} y={300} r={420} t={t} c={FLAME} o={0.35} n={16} />
          <circle cx={1430} cy={300} r={62 + 8 * Math.sin(t * 3)} fill={FLAME} stroke={ink} strokeWidth={6} />
        </g>
        {/* Aristotle's mean */}
        <g opacity={mean}>
          <line x1={640} y1={600} x2={1700} y2={600} stroke={ink} strokeWidth={8} strokeLinecap="round" />
          {[[640, "怯懦"], [1170, "勇敢"], [1700, "鲁莽"]].map(([x, s], i) => (
            <g key={i}><circle cx={x as number} cy={600} r={i === 1 ? 14 : 10} fill={ink} />
              <text x={x as number} y={680} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={i === 1 ? 64 : 44} fill={i === 1 ? cream : ink} opacity={i === 1 ? range(t, C.settle, C.settle + 0.3) * 0.7 + 0.3 : 0.75}>{s}</text></g>
          ))}
          <g transform={`translate(${mx} 600)`}><circle r={30} fill={FLAME} stroke={ink} strokeWidth={6} /></g>
        </g>
      </Svg>
      {/* Socrates' words */}
      <Tag t={t} at={C.socrates + 0.1} out={C.cave} text={<span>苏格拉底 <span style={{ fontFamily: LATIN, fontStyle: "italic", fontWeight: 600 }}>Socrates</span></span>} x={240} y={850 - 80} size={34} bg={ink} fg={cream} />
      <Line t={t} at={C.socrates + 0.15} out={C.cave} text="未经审视的人生，" x={780} y={330} size={84} color={ink} />
      <Line t={t} at={C.socrates + 0.45} out={C.cave} text="不值得过。" x={780} y={440} size={84} color={cream} />
      <Tag t={t} at={C.cup} out={C.cave} text="公元前 399 年：因为「教坏青年」被判饮毒酒" x={784} y={590} size={32} bg={cream} fg={ink} />
      {/* Plato */}
      <Tag t={t} at={C.cave} out={C.mean} text={<span>柏拉图 · 洞穴寓言 <span style={{ fontFamily: LATIN, fontStyle: "italic", fontWeight: 600 }}>Plato</span></span>} x={560} y={250} size={32} bg={ink} fg={cream} />
      <Line t={t} at={C.cave + 0.2} out={C.mean} text="你看到的，可能只是影子" x={560} y={800} size={60} color={ink} stagger={0.02} />
      <Tag t={t} at={C.out} out={C.mean} text="走出洞穴，才看得见「善」的太阳" x={1500} y={420} size={30} bg={cream} fg={ink} anchor="center" />
      {/* Aristotle */}
      <Tag t={t} at={C.mean} out={14.1} text={<span>亚里士多德 · 中道 <span style={{ fontFamily: LATIN, fontStyle: "italic", fontWeight: 600 }}>Aristotle</span></span>} x={640} y={470} size={32} bg={ink} fg={cream} />
      <Line t={t} at={C.mean + 0.2} out={14.1} text="美德，在两个极端的中间" x={640} y={760} size={60} color={ink} stagger={0.02} />
      <Tag t={t} at={C.sum} out={14.1} text="古典的答案：理性 → 美德 → 幸福" x={72} y={250} size={36} bg={FLAME} fg={ink} />
    </Fill>
  );
};

// ═══ II 古典犬儒: the dog-philosopher, the jar, the bowl, Alexander
export const Kynic: React.FC<{ t: number }> = ({ t }) => {
  const K = PJ.kynic, S1 = PJ.sec[1], ink = S1.ink, bg = S1.bg;
  const tree = win(t, K.tree - 0.5, K.jar + 0.2, 0.3, 0.3), jar = win(t, K.jar - 0.1, 21, 0.35, 0.1);
  const ax = lerp(2300, 1350, eOut(range(t, K.alex, K.alex + 0.5))) + 360 * eInOut(range(t, K.aside, K.aside + 0.45));
  const shade = win(t, K.alex + 0.3, K.aside + 0.45, 0.3, 0.4);
  const bowl = range(t, K.bowl, K.bowl + 0.7);
  const nodes: [number, string, string][] = [[700, "苏格拉底", "Socrates"], [1110, "安提斯泰尼", "Antisthenes"], [1520, "第欧根尼", "Diogenes"]];
  return (
    <Fill bg={bg}>
      <Svg>
        <Glow x={1430} y={300} r={600} id="ksun" c="#FFFFFF" />
        <Rays x={1430} y={300} r={1400} t={t} c="#FFF0C4" o={0.45} n={22} />
        <circle cx={1430} cy={300} r={66} fill="#FFFDF4" stroke={ink} strokeWidth={5} />
        <rect x={0} y={860} width={1920} height={220} fill="#E4D2AC" />
        {/* the lineage */}
        <g opacity={tree}>
          {nodes.map(([x, cn, en], i) => {
            const k = eOut(range(t, K.tree - 0.4 + i * 0.2, K.tree - 0.1 + i * 0.2));
            return (
              <g key={i} opacity={k}>
                {i > 0 && <line x1={nodes[i - 1][0] + 60} y1={470} x2={nodes[i - 1][0] + 60 + (x - nodes[i - 1][0] - 120) * k} y2={470} stroke={ink} strokeWidth={5} markerEnd="" />}
                <circle cx={x} cy={470} r={16} fill={i === 2 ? GOLD : ink} stroke={ink} strokeWidth={4} />
                <text x={x} y={540} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={40} fill={ink}>{cn}</text>
                <text x={x} y={578} textAnchor="middle" fontFamily={LATIN} fontStyle="italic" fontWeight={600} fontSize={26} fill={ink} opacity={0.7}>{en}</text>
              </g>
            );
          })}
        </g>
        {/* the jar, the child, the bowl */}
        <g opacity={jar}>
          <g transform="translate(720 700)"><Jar c="#B5653A" b={ink} /></g>
          <g transform={`translate(${880} ${640}) scale(0.62)`}><circle cx={20} cy={10} r={44} fill={ink} /><path d="M30,40 L70,50 L40,100 Z" fill={ink} /></g>
          <g transform={`translate(${880 + bowl * 380} ${690 - Math.sin(bowl * Math.PI) * 260 + bowl * 120}) rotate(${bowl * 540})`} opacity={1 - range(t, K.bowl + 0.6, K.bowl + 0.8)}>
            <path d="M-30,0 a30,18 0 0 0 60,0 Z" fill="#7A3E20" stroke={ink} strokeWidth={4} />
          </g>
          <g transform="translate(470 760) scale(0.55)" opacity={eOut(range(t, K.bowl - 0.2, K.bowl + 0.1))}>
            <Person c={ink} b={ink} face={1} />
            <path d="M18,-90 C40,-80 46,-70 34,-60" stroke={ink} strokeWidth={18} fill="none" strokeLinecap="round" />
          </g>
        </g>
        {/* Alexander's shadow */}
        <polygon points={`${ax - 140},${1080} ${ax + 160},${1080} ${ax - 900},${320} ${ax - 1400},${320}`} fill={ink} opacity={0.22 * shade} />
        <g transform={`translate(${ax} 640) scale(1.6)`}><Alexander c={ink} b={bg} /></g>
      </Svg>
      <Line t={t} at={K.tree + 0.1} out={K.jar} text="苏格拉底的学生的学生" x={700} y={300} size={56} color={ink} stagger={0.02} />
      <Line t={t} at={K.dog} out={K.jar} text={"犬儒 = 像狗一样活"} x={700} y={640} size={72} color={ink} stagger={0.03} />
      <Tag t={t} at={K.dog + 0.2} out={K.jar} text={<span><span style={{ fontFamily: LATIN, fontStyle: "italic" }}>kyōn</span> = 狗：只要活着必需的，别的都扔掉</span>} x={704} y={760} size={32} bg={ink} fg={bg} />
      <Tag t={t} at={K.jar} out={K.alex} text="住在一只陶罐里" x={500} y={420} size={40} bg={ink} fg={bg} />
      <Tag t={t} at={K.bowl} out={K.alex} text="看到孩子用手捧水喝，他把唯一的碗也扔了" x={500} y={490} size={32} bg={GOLD} fg={ink} />
      <Tag t={t} at={K.alex} out={K.aside + 0.2} text="亚历山大大帝：「我能为你做点什么？」" x={1880} y={150} size={32} bg={ink} fg={bg} anchor="right" />
      <Line t={t} at={K.sun} out={20.1} text="「别挡住我的阳光。」" x={100} y={250} size={92} color="#B3101F" stagger={0.04} />
      <Tag t={t} at={K.sum} out={20.1} text="古典犬儒：看穿虚伪的规矩，按本性真活" x={104} y={380} size={36} bg={GOLD} fg={ink} />
    </Fill>
  );
};
export { FLAME };
