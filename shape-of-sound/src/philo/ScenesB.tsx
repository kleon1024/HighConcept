// III 功利 (Bentham, Mill), IV 叔本华, V 虚无 (Nietzsche), VI 存在 (Sartre, Camus).
import React from "react";
import { FLAME, GOLD, LATIN, MONO, PJ, SANS, SERIF, backOut, clamp01, eIn, eInOut, eOut, lerp, range, rnd, win } from "./base";
import { AutoIcon, Diogenes, Nietzsche, Person, Pig, Sartre, Schopenhauer, Sisyphus, Socrates } from "./Icons";
import { Dust, Glow, Line, Rays, Tag } from "./Kit";

const Fill: React.FC<React.PropsWithChildren<{ bg: string }>> = ({ bg, children }) => <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>{children}</div>;
const Svg: React.FC<React.PropsWithChildren> = ({ children }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>{children}</svg>;
const lat = (s: string) => <span style={{ fontFamily: LATIN, fontStyle: "italic", fontWeight: 600 }}>{s}</span>;

// the Panopticon as a plan: a ring of cells around a tower (drawn in, k = 0 → 1)
export const PanPlan: React.FC<{ x: number; y: number; r: number; k: number; c: string; n?: number; fill?: string; figs?: number; figC?: string }> = ({ x, y, r, k, c, n = 16, fill = "none", figs = 0, figC }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill={fill} stroke={c} strokeWidth={5} strokeDasharray={`${2 * Math.PI * r * k} 9999`} />
    <circle r={r * 0.68} fill="none" stroke={c} strokeWidth={3} strokeDasharray={`${2 * Math.PI * r * 0.68 * k} 9999`} />
    {Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2, kk = clamp01(k * 1.6 - i / n * 0.6);
      return (
        <g key={i}>
          <line x1={Math.cos(a) * r * 0.68} y1={Math.sin(a) * r * 0.68} x2={Math.cos(a) * (r * 0.68 + (r * 0.32) * kk)} y2={Math.sin(a) * (r * 0.68 + (r * 0.32) * kk)} stroke={c} strokeWidth={3} />
          {figs > 0 && <circle cx={Math.cos(a + Math.PI / n) * r * 0.84} cy={Math.sin(a + Math.PI / n) * r * 0.84} r={r * 0.05} fill={figC ?? c} opacity={figs} />}
        </g>
      );
    })}
    <circle r={r * 0.22 * clamp01(k * 2 - 0.5)} fill="none" stroke={c} strokeWidth={5} />
    <circle r={r * 0.1 * clamp01(k * 2 - 0.8)} fill={c} />
  </g>
);

// ═══ III 功利: the happiness calculus, Mill's scale, the auto-icon and the Panopticon
export const Util: React.FC<{ t: number }> = ({ t }) => {
  const U = PJ.util, S = PJ.sec[2], ink = S.ink, bg = S.bg, cy = "#7FD3FF";
  const dots = win(t, U.dots - 0.5, U.mill + 0.2, 0.3, 0.3), scale = win(t, U.mill - 0.1, U.icon + 0.2, 0.3, 0.3), icon = win(t, U.icon - 0.1, 27, 0.35, 0.1);
  const total = Math.round(128 * eOut(range(t, U.sum, U.mill - 0.2)));
  const tip = eInOut(range(t, U.tip, U.tip + 0.5)) * 12 * (1 + 0.1 * Math.sin(t * 6) * Math.exp(-Math.max(0, t - U.tip - 0.5) * 3));
  const pan = eOut(range(t, U.pan, U.pan + 0.8));
  return (
    <Fill bg={bg}>
      <Svg>
        {Array.from({ length: 33 }, (_, i) => <line key={"v" + i} x1={i * 60} y1={0} x2={i * 60} y2={1080} stroke={cy} strokeWidth={1} opacity={0.1} />)}
        {Array.from({ length: 19 }, (_, i) => <line key={"h" + i} x1={0} y1={i * 60} x2={1920} y2={i * 60} stroke={cy} strokeWidth={1} opacity={0.1} />)}
        {/* the calculus: every person a + or − */}
        <g opacity={dots}>
          {Array.from({ length: 36 }, (_, i) => {
            const cx = 760 + (i % 9) * 92, cyy = 330 + Math.floor(i / 9) * 110, at = U.dots - 0.45 + i * 0.018, k = backOut(range(t, at, at + 0.25), 2);
            const v = Math.round((rnd(i) - 0.32) * 9), pos = v >= 0;
            return (
              <g key={i} transform={`translate(${cx} ${cyy}) scale(${k})`}>
                <circle r={22} fill="none" stroke={ink} strokeWidth={4} />
                <text y={10} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={26} fill={pos ? cy : "#FF6B7A"} opacity={range(t, U.sum - 0.3, U.sum)}>{pos ? "+" + v : v}</text>
              </g>
            );
          })}
          <rect x={760} y={770} width={810} height={4} fill={ink} />
        </g>
        {/* Mill's scale: a satisfied pig against a dissatisfied Socrates */}
        <g opacity={scale} transform="translate(1180 470)">
          <rect x={-8} y={-10} width={16} height={330} fill={ink} /><path d="M-90,330 h180 l-30,-30 h-120 Z" fill={ink} />
          <g transform={`rotate(${tip})`}>
            <rect x={-420} y={-14} width={840} height={14} fill={ink} />
            <g transform="translate(-380 0)"><line x1={-60} y1={0} x2={-60} y2={150} stroke={ink} strokeWidth={3} /><line x1={60} y1={0} x2={60} y2={150} stroke={ink} strokeWidth={3} />
              <g transform={`rotate(${-tip})`}><rect x={-110} y={150} width={220} height={12} fill={ink} /><g transform="translate(0 96) scale(0.72)"><Pig c={ink} b={bg} /></g></g></g>
            <g transform="translate(380 0)"><line x1={-60} y1={0} x2={-60} y2={150} stroke={ink} strokeWidth={3} /><line x1={60} y1={0} x2={60} y2={150} stroke={ink} strokeWidth={3} />
              <g transform={`rotate(${-tip})`}><rect x={-110} y={150} width={220} height={12} fill={ink} /><g transform="translate(0 70) scale(0.5)"><Socrates c={ink} b={bg} /></g></g></g>
          </g>
        </g>
        {/* the auto-icon and the Panopticon */}
        <g opacity={icon}>
          <g transform="translate(470 590) scale(1.05)"><AutoIcon c={ink} b={bg} /></g>
          {t > U.pan - 0.1 && <PanPlan x={1300} y={520} r={250} k={pan} c={cy} />}
        </g>
      </Svg>
      <Tag t={t} at={U.dots} out={U.mill} text={<span>边沁 {lat("Bentham")} · 1789</span>} x={760} y={200} size={32} bg={ink} fg={bg} />
      <Line t={t} at={U.dots + 0.1} out={U.mill} text="最大多数人的最大幸福" x={760} y={810} size={64} color={ink} stagger={0.025} />
      <Tag t={t} at={U.sum} out={U.mill} text={<span>幸福可以算：Σ 快乐 − 痛苦 = <span style={{ fontFamily: MONO }}>+{total}</span></span>} x={1570} y={200} size={30} bg={cy} fg={bg} anchor="right" />
      <Tag t={t} at={U.mill} out={U.icon} text={<span>密尔 {lat("Mill")} · 1863</span>} x={760} y={200} size={32} bg={ink} fg={bg} />
      <Line t={t} at={U.mill + 0.1} out={U.icon} text="宁做不满足的苏格拉底，" x={560} y={820} size={54} color={ink} stagger={0.02} />
      <Line t={t} at={U.mill + 0.4} out={U.icon} text="不做满足的猪。" x={1150} y={890} size={54} color={cy} stagger={0.02} />
      <Tag t={t} at={U.tip} out={U.icon} text="快乐也分高低" x={1560} y={300} size={34} bg={GOLD} fg={bg} />
      <Line t={t} at={U.icon} out={U.pan} text="边沁死后被做成标本，" x={760} y={330} size={54} color={ink} stagger={0.02} />
      <Line t={t} at={U.icon + 0.25} out={U.pan} text="至今坐在伦敦大学学院。" x={760} y={410} size={54} color={ink} stagger={0.02} />
      <Tag t={t} at={U.pan} out={26.1} text="他还画过一座监狱：全景敞视监狱（1791）" x={1300} y={820} size={32} bg={GOLD} fg={bg} anchor="center" />
    </Fill>
  );
};

// ═══ IV 叔本华: the blind will under the world, the pendulum between pain and boredom
export const Schop: React.FC<{ t: number }> = ({ t }) => {
  const Q = PJ.schop, S = PJ.sec[3], ink = S.ink, bg = S.bg, vi = "#8B5CF6";
  const will = win(t, Q.will - 0.1, Q.pend + 0.2, 0.35, 0.3), pend = win(t, Q.pend - 0.1, 33, 0.35, 0.1);
  const push = eOut(range(t, Q.push, Q.push + 0.6));
  const ang = 34 * Math.sin(Math.PI * (t - Q.pend) / 0.5 + Math.PI / 2) * eOut(range(t, Q.pend, Q.pend + 0.3));
  const L = 400, px = 1250, py = 240, bx = px + L * Math.sin((ang * Math.PI) / 180), by = py + L * Math.cos((ang * Math.PI) / 180);
  const leftOn = clamp01((-ang - 26) / 8), rightOn = clamp01((ang - 26) / 8);
  return (
    <Fill bg={bg}>
      <Svg>
        <Glow x={420} y={520} r={380} id="schg" c={vi} o={0.8} />
        <g transform="translate(420 560) scale(1.05)"><Schopenhauer c={ink} b={bg} /></g>
        {/* the will under the veil */}
        <g opacity={will}>
          {Array.from({ length: 9 }, (_, i) => {
            const a = t * (0.8 + i * 0.13) + i, r = 90 + rnd(i) * 80;
            return <circle key={i} cx={1250 + Math.cos(a) * (120 + i * 18)} cy={700 + Math.sin(a * 1.3) * 60} r={r} fill={i % 2 ? "#3B1E66" : "#24123F"} opacity={0.9} />;
          })}
          <path d={`M700,${520} ${Array.from({ length: 23 }, (_, i) => { const x = 700 + i * 50; const bump = push * 60 * Math.max(0, Math.sin(i * 0.9 + t * 3)); return `L${x},${520 - bump}`; }).join(" ")}`} fill="none" stroke={ink} strokeWidth={5} />
          {[[820, "circle"], [1060, "tri"], [1320, "sq"], [1580, "circle"]].map(([x, k], i) => {
            const bump = push * 60 * Math.max(0, Math.sin(((x as number) - 700) / 50 * 0.9 + t * 3));
            const y = 520 - bump - 40;
            return k === "circle" ? <circle key={i} cx={x as number} cy={y} r={36} fill="none" stroke={ink} strokeWidth={5} /> : k === "tri" ? <polygon key={i} points={`${x},${y - 40} ${(x as number) + 40},${y + 30} ${(x as number) - 40},${y + 30}`} fill="none" stroke={ink} strokeWidth={5} /> : <rect key={i} x={(x as number) - 34} y={y - 34} width={68} height={68} fill="none" stroke={ink} strokeWidth={5} />;
          })}
          <text x={1820} y={470} textAnchor="end" fontFamily={SERIF} fontWeight={900} fontSize={40} fill={ink}>表象</text>
          <text x={1820} y={780} textAnchor="end" fontFamily={SERIF} fontWeight={900} fontSize={40} fill={vi}>意志</text>
        </g>
        {/* the pendulum */}
        <g opacity={pend}>
          <text x={820} y={720} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={90} fill={ink} opacity={0.35 + 0.65 * leftOn}>痛苦</text>
          <text x={1680} y={720} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={90} fill={ink} opacity={0.35 + 0.65 * rightOn}>无聊</text>
          <path d={`M${px - L * Math.sin(0.6)},${py + L * Math.cos(0.6)} A${L},${L} 0 0 0 ${px + L * Math.sin(0.6)},${py + L * Math.cos(0.6)}`} fill="none" stroke={ink} strokeWidth={2} strokeDasharray="6 10" opacity={0.4} />
          <line x1={px} y1={py} x2={bx} y2={by} stroke={ink} strokeWidth={5} />
          <circle cx={px} cy={py} r={10} fill={ink} />
          <circle cx={bx} cy={by} r={48} fill={GOLD} stroke={ink} strokeWidth={5} />
        </g>
      </Svg>
      <Tag t={t} at={Q.will} out={Q.pend} text={<span>叔本华 {lat("Schopenhauer")} · 1818</span>} x={240} y={770} size={30} bg={ink} fg={bg} />
      <Line t={t} at={Q.will + 0.15} out={Q.pend} text="世界底下，是一股盲目的「意志」" x={700} y={830} size={56} color={ink} stagger={0.02} />
      <Line t={t} at={Q.pend + 0.1} out={32.1} text="人生像钟摆，在痛苦和无聊之间摆" x={700} y={830} size={56} color={ink} stagger={0.02} />
      <Tag t={t} at={Q.hegel} out={32.1} text="他故意和黑格尔同时开课——只来了 5 个学生" x={700} y={250} size={30} bg={GOLD} fg={bg} rot={-1.5} />
      <Tag t={t} at={Q.cure} out={32.1} text="出路：艺术、同情、少欲" x={240} y={770} size={32} bg={vi} fg={ink} />
    </Fill>
  );
};

// ═══ V 虚无: the book, the madman's lantern, God is dead, the earth unchained, the values fall
export const Nihil: React.FC<{ t: number }> = ({ t }) => {
  const N = PJ.nihil, S = PJ.sec[4], ink = S.ink, bg = S.bg, dk = "#3A0408";
  const book = win(t, N.book - 0.5, N.mad + 0.1, 0.3, 0.25), mad = win(t, N.mad - 0.1, N.dead + 0.1, 0.3, 0.2), dead = win(t, N.dead - 0.05, N.tower + 0.1, 0.2, 0.25), tower = win(t, N.tower - 0.1, 39, 0.3, 0.1);
  const un = eInOut(range(t, N.unchain, N.unchain + 1.2));
  const sunX = lerp(1540, 1700, un), sunY = lerp(300, 240, un);
  return (
    <Fill bg={bg}>
      <Svg>
        {/* the bookshop */}
        <g opacity={book} transform={`translate(1250 520) rotate(${-6 + 6 * eOut(range(t, N.book, N.book + 0.4))})`}>
          <rect x={-200} y={-260} width={400} height={520} fill={dk} stroke={ink} strokeWidth={6} />
          <rect x={-200} y={-260} width={40} height={520} fill={ink} opacity={0.2} />
          <text x={20} y={-120} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={42} fill={ink}>作为意志</text>
          <text x={20} y={-66} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={42} fill={ink}>和表象的</text>
          <text x={20} y={-12} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={42} fill={ink}>世界</text>
          <text x={20} y={200} textAnchor="middle" fontFamily={LATIN} fontStyle="italic" fontWeight={600} fontSize={30} fill={ink}>Schopenhauer</text>
        </g>
        <g opacity={book + mad * 0} transform="translate(420 560) scale(1.05)"><Nietzsche c={ink} b={bg} /></g>
        {/* the madman with his lantern in the morning market: the same lamp as Diogenes */}
        <g opacity={mad}>
          <rect x={0} y={860} width={1920} height={220} fill={dk} />
          {Array.from({ length: 9 }, (_, i) => <g key={i} transform={`translate(${200 + i * 200 + Math.sin(t + i) * 10} ${780}) scale(0.8)`} opacity={0.75}><Person c={dk} b={dk} face={i < 5 ? 1 : -1} h={0.9 + rnd(i) * 0.3} /></g>)}
          <g transform={`translate(${760 + (t - N.mad) * 120} 690) scale(1.1)`}><Diogenes c={ink} b={bg} t={t} /></g>
        </g>
        {/* God is dead: the earth comes loose from its sun */}
        <g opacity={Math.max(dead, 0.75 * tower)}>
          <Rays x={sunX} y={sunY} r={700} t={t} c={FLAME} o={0.3 * (1 - un * 0.7)} />
          <circle cx={sunX} cy={sunY} r={80} fill={FLAME} stroke={dk} strokeWidth={6} opacity={1 - un * 0.4} />
          <line x1={sunX} y1={sunY + 80} x2={lerp(1540, 1300, un)} y2={lerp(600, 800, un)} stroke={ink} strokeWidth={4} strokeDasharray={un > 0.15 ? "4 40" : "12 10"} opacity={1 - un} />
          <g transform={`translate(${lerp(1540, 1280, un)} ${lerp(660, 860, un)}) rotate(${un * 160})`}>
            <circle r={66} fill="#2D5BFF" stroke={dk} strokeWidth={6} /><path d="M-40,-20 q20,-30 40,-6 q20,20 30,-2 M-30,30 q20,10 34,-10" fill="none" stroke="#2FC27E" strokeWidth={14} strokeLinecap="round" />
          </g>
        </g>
        {/* the values fall */}
        <g opacity={tower}>
          {["上帝", "真理", "道德", "意义"].map((w, i) => {
            const fall = range(t, N.fall + i * 0.12, N.fall + i * 0.12 + 0.9), g = eIn(fall);
            const x = 1650 + g * (i % 2 ? 160 : -300) * (1 + i * 0.2), y = 300 + i * 120 + g * (700 - i * 60), r = g * (i % 2 ? 70 : -60);
            return (
              <g key={w} transform={`translate(${x} ${y}) rotate(${r})`} opacity={1 - clamp01((fall - 0.85) / 0.15)}>
                <rect x={-150} y={-52} width={300} height={104} fill={i === 0 ? FLAME : ink} stroke={dk} strokeWidth={6} />
                <text y={22} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={60} fill={dk}>{w}</text>
              </g>
            );
          })}
        </g>
      </Svg>
      <Tag t={t} at={N.book} out={N.mad} text={<span>1865，一个大学生在旧书店买到这本书：尼采 {lat("Nietzsche")}</span>} x={700} y={850} size={30} bg={ink} fg={bg} />
      <Line t={t} at={N.mad} out={N.dead} text="又一个大白天提灯的人：" x={700} y={200} size={58} color={ink} stagger={0.02} />
      <Tag t={t} at={N.mad + 0.4} out={N.dead} text="「我在找上帝！」" x={704} y={300} size={44} bg={ink} fg={bg} />
      <Line t={t} at={N.dead} out={N.tower} text="上帝死了。" x={700} y={180} size={150} color={ink} stagger={0.06} />
      <Tag t={t} at={N.unchain} out={N.tower} text="「我们把地球从太阳上解开了」 · 1882" x={704} y={380} size={32} bg={dk} fg={ink} />
      <Line t={t} at={N.tower} out={38.1} text="虚无主义：" x={700} y={220} size={66} color={ink} stagger={0.03} />
      <Line t={t} at={N.tower + 0.15} out={38.1} text="最高的价值，自己贬值了" x={700} y={310} size={60} color={ink} stagger={0.025} />
      <Tag t={t} at={N.make} out={38.1} text="尼采：那就自己创造价值" x={704} y={430} size={38} bg={FLAME} fg={dk} />
    </Fill>
  );
};

// ═══ VI 存在: existence before essence (the paper-knife and the person), Sisyphus
export const Exist: React.FC<{ t: number }> = ({ t }) => {
  const X = PJ.exist, S = PJ.sec[5], ink = S.ink, bg = S.bg, blue = "#5B8CFF";
  const rows = win(t, X.knife - 0.5, X.sisy + 0.1, 0.3, 0.3), sisy = win(t, X.sisy - 0.1, 45, 0.35, 0.1);
  const kb = eOut(range(t, X.knife + 0.1, X.knife + 0.5)), ks = eOut(range(t, X.knife + 0.5, X.knife + 0.8));
  const hd = eOut(range(t, X.human, X.human + 0.25)), hs = range(t, X.human + 0.35, X.human + 1.1);
  // Sisyphus: up the slope in 1.5 s, the stone rolls back in 0.5 s; at 44.0 the stone is at the top (the iris opens from it)
  const cyc = ((t - X.sisy + 0.5) % 2 + 2) % 2, up = cyc < 1.5 ? eInOut(cyc / 1.5) : 1 - eIn((cyc - 1.5) / 0.5);
  const sx = lerp(760, 1330, up), sy = lerp(800, 520, up);
  return (
    <Fill bg={bg}>
      <Svg>
        <g transform="translate(400 560) scale(1.05)" opacity={rows}><Sartre c={ink} b={bg} /></g>
        <g opacity={rows}>
          {/* paper-knife: the design first, then the thing */}
          <g transform="translate(900 330)">
            <path d="M-120,0 L120,-14 L150,0 L120,14 Z M-180,-12 h60 v24 h-60 Z" fill="none" stroke={blue} strokeWidth={3} strokeDasharray="8 6" opacity={kb} />
            <line x1={-180} y1={40} x2={-180 + 330 * kb} y2={40} stroke={blue} strokeWidth={2} /><text x={-15} y={70} textAnchor="middle" fontFamily={MONO} fontSize={20} fill={blue} opacity={kb}>DESIGN</text>
          </g>
          <text x={1150} y={345} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={50} fill={ink} opacity={ks}>→</text>
          <g transform="translate(1440 330)" opacity={ks}><path d="M-120,0 L120,-14 L150,0 L120,14 Z" fill="#C9CED6" stroke={ink} strokeWidth={3} /><rect x={-180} y={-12} width={60} height={24} fill="#7A4A2C" /></g>
          <text x={1720} y={340} fontFamily={SANS} fontWeight={900} fontSize={30} fill={ink} opacity={ks}>裁纸刀</text>
          {/* a person: first exists, then draws their own outline */}
          <circle cx={900} cy={600} r={18 * hd} fill={GOLD} />
          <text x={1150} y={615} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={50} fill={ink} opacity={hd}>→</text>
          <g transform="translate(1440 650) scale(1.0)">
            <circle cx={0} cy={-122} r={26} fill="none" stroke={GOLD} strokeWidth={7} strokeDasharray={`${170 * clamp01(hs * 2)} 999`} />
            <path d="M-34,-92 C-48,-40 -52,40 -46,120 L46,120 C52,40 48,-40 34,-92 C20,-100 -20,-100 -34,-92 Z" fill="none" stroke={GOLD} strokeWidth={7} strokeDasharray={`${700 * clamp01(hs * 1.4 - 0.3)} 999`} />
          </g>
          <text x={1600} y={640} fontFamily={SERIF} fontWeight={900} fontSize={56} fill={GOLD} opacity={hd}>人</text>
        </g>
        {/* Sisyphus */}
        <g opacity={sisy}>
          <line x1={640} y1={880} x2={1460} y2={470} stroke={ink} strokeWidth={8} />
          <circle cx={sx} cy={sy - 58} r={58} fill="#8A8F99" stroke={ink} strokeWidth={6} />
          <g transform={`translate(${sx - 70} ${sy + 34}) rotate(-26)`} opacity={cyc < 1.5 ? 1 : 0.35}><Sisyphus c={ink} b={bg} /></g>
        </g>
      </Svg>
      <Tag t={t} at={X.knife} out={X.sisy} text={<span>萨特 {lat("Sartre")} · 1945 · 巴黎</span>} x={240} y={770} size={30} bg={ink} fg={bg} />
      <Tag t={t} at={X.knife + 0.3} out={X.sisy} text="刀：先有设计，再造出来" x={760} y={420} size={28} bg={blue} fg={ink} />
      <Tag t={t} at={X.human + 0.2} out={X.sisy} text="人：先存在，再定义自己" x={760} y={700} size={28} bg={GOLD} fg={bg} />
      <Line t={t} at={X.knife + 0.1} out={X.sisy} text="存在先于本质" x={760} y={800} size={84} color={ink} stagger={0.05} />
      <Tag t={t} at={X.free} out={X.sisy} text="「人是被判定为自由的」" x={1880} y={180} size={34} bg={ink} fg={bg} anchor="right" />
      <Tag t={t} at={X.sisy} out={44.1} text={<span>加缪 {lat("Camus")} · 荒诞</span>} x={240} y={770} size={30} bg={ink} fg={bg} />
      <Line t={t} at={X.sisy + 0.1} out={44.1} text="推石头上山，石头又滚下来" x={700} y={180} size={56} color={ink} stagger={0.02} />
      <Line t={t} at={X.happy} out={44.1} text="应当想象西西弗是幸福的。" x={700} y={270} size={64} color={GOLD} stagger={0.03} />
    </Fill>
  );
};
export { Dust, eOut, win };
