// 11 存在, 12 维特根斯坦, 13 福柯, 14 后现代, 15 现代犬儒, and the ending (a wheel of every answer, then an open circle).
import React from "react";
import { Img, staticFile } from "remotion";
import { BIG, CUE, GOLD, GROT, INK, MJ, PAPER, SANS, SERIF, backOut, clamp01, eIn, eInOut, eOut, lerp, range, rnd, win } from "./base";
import { Chip, Line } from "./Kit";
import { Compass, Scrim } from "./SegA";

const Fill: React.FC<React.PropsWithChildren<{ bg?: string }>> = ({ bg = INK, children }) => <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>{children}</div>;
const Svg: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, ...style }}>{children}</svg>;

// ═══ 11 存在: in your choices — gesture painting lands on the beat; the stone goes up the slope
const stroke = (i: number, x0: number, y0: number, len: number) => {
  const a = rnd(i) * Math.PI * 2, b = a + (rnd(i + 1) - 0.5) * 2.4;
  const x1 = x0 + Math.cos(a) * len * 0.5, y1 = y0 + Math.sin(a) * len * 0.5, x2 = x0 + Math.cos(b) * len, y2 = y0 + Math.sin(b) * len;
  return `M${x0},${y0} Q${x1},${y1} ${x2},${y2}`;
};
export const Exist: React.FC<{ t: number }> = ({ t }) => {
  const S = MJ.seg[10], C = CUE.exist;
  const cyc = ((t - C.sisy + 0.25) % 1.5 + 1.5) % 1.5, up = cyc < 1.1 ? eInOut(cyc / 1.1) : 1 - eIn((cyc - 1.1) / 0.4);
  const sx = lerp(980, 1640, up), sy = lerp(900, 430, up);
  return (
    <Fill bg="#EDE6D8">
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${staticFile("media/me_canvas.png")})`, backgroundSize: "1024px", mixBlendMode: "multiply", opacity: 0.6 }} />
      <Svg>
        {Array.from({ length: 64 }, (_, i) => {
          const at = C.drip + (i % 8) * 0.5 + Math.floor(i / 8) * 0.04;      // painted on the beats
          const k = eOut(range(t, at, at + 0.18));
          if (k <= 0) return null;
          const x0 = 700 + rnd(i + 3) * 1200, y0 = 120 + rnd(i + 7) * 840, len = 160 + rnd(i + 11) * 520;
          const col = ["#111111", "#111111", "#C8102E", "#F4EEE2", "#2A2A2A", "#D9A23A"][i % 6];
          return <path key={i} d={stroke(i, x0, y0, len)} fill="none" stroke={col} strokeWidth={8 + rnd(i + 5) * 40} strokeLinecap="round" strokeDasharray={`${len * 1.5 * k} 9999`} opacity={0.85} />;
        })}
        {Array.from({ length: 70 }, (_, i) => { const at = C.drip + rnd(i + 40) * 3; return t > at ? <circle key={"d" + i} cx={700 + rnd(i + 90) * 1200} cy={120 + rnd(i + 60) * 840} r={2 + rnd(i + 3) * 9} fill={i % 4 === 0 ? "#C8102E" : "#111"} opacity={0.8} /> : null; })}
        <g opacity={win(t, C.sisy - 0.2, S.out + 0.2, 0.25, 0.1)}>
          <path d="M880,980 L1760,380" stroke="#111" strokeWidth={22} strokeLinecap="round" />
          <circle cx={sx} cy={sy - 70} r={66} fill="#111" />
          <circle cx={sx} cy={sy - 70} r={66} fill="none" stroke={GOLD} strokeWidth={4} />
        </g>
      </Svg>
      <div style={{ position: "absolute", left: 0, top: 0, width: 680, height: 1080, background: "linear-gradient(90deg, rgba(237,230,216,0.97) 75%, rgba(237,230,216,0))" }} />
      <Line t={t} at={S.t + 0.3} out={S.out} text="存在先于本质：" x={64} y={330} size={62} color={INK} shadow="none" />
      <Line t={t} at={C.line} out={S.out} text="先活，再定义自己。" x={64} y={415} size={62} color="#C8102E" shadow="none" />
      <Line t={t} at={C.sisy} out={S.out} text="应当想象西西弗是幸福的。" x={64} y={540} size={44} color={INK} shadow="none" stagger={0.02} />
      <Chip t={t} at={C.line + 0.2} out={S.out} text="萨特 1945 · 加缪 1942" x={68} y={630} size={26} bg={INK} fg={PAPER} />
    </Fill>
  );
};

// ═══ 12 维特根斯坦: in use — a De Stijl grid of words; then the black square, and silence
const CELLS: [number, number, number, number, string, string][] = [
  [700, 80, 360, 300, "#FFFFFF", "游戏"], [1080, 80, 520, 180, "#D12C1F", "红"], [1620, 80, 220, 300, "#FFFFFF", ""],
  [1080, 280, 260, 250, "#FFFFFF", "石头！"], [1360, 280, 240, 450, "#1F4AA8", ""], [700, 400, 360, 330, "#F2C318", "痛"],
  [1620, 400, 220, 330, "#FFFFFF", "意义"], [700, 750, 640, 230, "#FFFFFF", "规则"], [1360, 750, 480, 230, "#F2C318", ""],
];
export const Witt: React.FC<{ t: number }> = ({ t }) => {
  const S = MJ.seg[11], C = CUE.witt;
  const sq = eInOut(range(t, C.mute[0] - 0.25, C.mute[0]));
  const dark = t >= C.mute[0] && t < C.mute[1];
  return (
    <Fill bg="#F4F1EA">
      <Svg>
        <rect x={680} y={60} width={1180} height={940} fill={INK} />
        {CELLS.map(([x, y, w, h, c, word], i) => {
          const k = backOut(range(t, C.grid + i * 0.06, C.grid + i * 0.06 + 0.25), 1.4);
          return (
            <g key={i} transform={`translate(${x + w / 2} ${y + h / 2}) scale(${clamp01(k)}) translate(${-(x + w / 2)} ${-(y + h / 2)})`}>
              <rect x={x} y={y} width={w} height={h} fill={c} />
              {word && <text x={x + 24} y={y + h - 26} fontFamily={SERIF} fontWeight={900} fontSize={Math.min(64, h * 0.35)} fill={c === "#FFFFFF" || c === "#F2C318" ? INK : PAPER} opacity={range(t, C.limit, C.limit + 0.3)}>{word}</text>}
            </g>
          );
        })}
        {/* the grid collapses into a black square */}
        <rect x={lerp(680, 1020, sq)} y={lerp(60, 280, sq)} width={lerp(1180, 520, sq)} height={lerp(940, 520, sq)} fill={INK} opacity={sq} />
      </Svg>
      {t > C.mute[0] - 0.3 && <div style={{ position: "absolute", left: 1020, top: 280, width: 520, height: 520, opacity: sq }}>
        <Img src={staticFile("media/ad_blacksquare.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
      <Line t={t} at={C.limit} out={C.silent} text="一个词的意义，" x={64} y={330} size={58} color={INK} shadow="none" />
      <Line t={t} at={C.limit + 0.25} out={C.silent} text="就是它的用法。" x={64} y={415} size={66} color="#D12C1F" shadow="none" />
      <Line t={t} at={C.silent} out={S.out} text="对于不可说的，" x={64} y={330} size={58} color={INK} shadow="none" />
      <Line t={t} at={C.silent + 0.25} out={S.out} text="必须保持沉默。" x={64} y={415} size={66} color={INK} shadow="none" />
      <Chip t={t} at={C.limit + 0.4} out={S.out} text="《逻辑哲学论》1921 → 《哲学研究》1953" x={68} y={530} size={26} bg={INK} fg={PAPER} />
      {dark && <div style={{ position: "absolute", left: 1280, top: 860, transform: "translateX(-50%)", fontFamily: GROT, fontWeight: 700, fontSize: 22, letterSpacing: 6, color: INK, opacity: 0.6 }}>(……)</div>}
    </Fill>
  );
};

// ═══ 13 福柯: in the gaze of power — the Panopticon plan, op-art rings, a beam; then a grid of screens
export const Fouc: React.FC<{ t: number }> = ({ t }) => {
  const S = MJ.seg[12], C = CUE.fouc, cx = 1300, cy = 540;
  const beam = (t - C.beam) * 160, toGrid = eInOut(range(t, C.grid, C.grid + 0.6));
  return (
    <Fill bg="#050608">
      <Svg>
        {Array.from({ length: 26 }, (_, i) => { const r = 40 + i * 34 + ((t - S.t) * 60) % 34; return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={i % 2 ? "#F4F1EA" : "#050608"} strokeWidth={17} opacity={0.9 * (1 - toGrid)} />; })}
      </Svg>
      <div style={{ position: "absolute", left: cx - 300, top: cy - 470, width: 600, height: 940, opacity: (1 - toGrid) * eOut(range(t, C.plan, C.plan + 0.3)), mixBlendMode: "screen" }}>
        <Img src={staticFile("media/me_panopticon.jpg")} style={{ width: "100%", height: "100%", objectFit: "contain", filter: "invert(1) sepia(1) hue-rotate(150deg) saturate(3) brightness(1.1)" }} />
      </div>
      <Svg>
        {t > C.beam && toGrid < 1 && <path d={`M${cx},${cy} L${cx + Math.cos((beam - 12) * Math.PI / 180) * 900},${cy + Math.sin((beam - 12) * Math.PI / 180) * 900} L${cx + Math.cos((beam + 12) * Math.PI / 180) * 900},${cy + Math.sin((beam + 12) * Math.PI / 180) * 900} Z`} fill="#3FE0FF" opacity={0.28 * (1 - toGrid)} />}
        {toGrid > 0 && Array.from({ length: 40 }, (_, i) => {
          const gx = 720 + (i % 10) * 116, gy = 220 + Math.floor(i / 10) * 170, k = clamp01(toGrid * 1.5 - (i % 10) * 0.05);
          const lit = (i * 7 + Math.floor(t * 6)) % 9 === 0;
          return <g key={i} opacity={k}><rect x={gx} y={gy} width={96} height={140} rx={12} fill="none" stroke="#3FE0FF" strokeWidth={3} /><circle cx={gx + 48} cy={gy + 60} r={14} fill={lit ? "#3FE0FF" : "#F4F1EA"} opacity={lit ? 1 : 0.6} /></g>;
        })}
      </Svg>
      <Scrim o={0.9} c="5,6,8" w={45} />
      <Line t={t} at={S.t + 0.3} out={S.out} text="最好的监狱没有看守：" x={64} y={330} size={56} color={PAPER} stagger={0.02} />
      <Line t={t} at={S.t + 0.6} out={S.out} text="你自己看着你自己。" x={64} y={415} size={62} color="#3FE0FF" stagger={0.03} />
      <Chip t={t} at={C.beam + 0.2} out={S.out} text="边沁设计的全景监狱 (1791) → 福柯《规训与惩罚》1975" x={68} y={530} size={24} bg={PAPER} />
      <Chip t={t} at={C.grid + 0.2} out={S.out} text="学校 · 工厂 · 医院 · 屏幕" x={68} y={590} size={28} bg="#3FE0FF" />
    </Fill>
  );
};

// ═══ 14 后现代: everywhere and nowhere — the circle as pop art, four times, then it glitches
export const Post: React.FC<{ t: number }> = ({ t }) => {
  const S = MJ.seg[13], C = CUE.post;
  const pal = [["#FF2A6D", "#FFE600"], ["#05D9E8", "#FF2A6D"], ["#FFE600", "#2D5BFF"], ["#2D5BFF", "#05D9E8"]];
  const gl = t > C.glitch ? Math.floor(t * 30) : -1;
  return (
    <Fill bg="#FFE600">
      <Svg>
        <defs><pattern id="ben" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="5" fill="#FF2A6D" /></pattern></defs>
        <rect x={0} y={0} width={1920} height={1080} fill="url(#ben)" opacity={0.35} />
        {pal.map(([bg, c], i) => {
          const x = 700 + (i % 2) * 600, y = 60 + Math.floor(i / 2) * 480, k = backOut(range(t, C.pop + i * 0.1, C.pop + i * 0.1 + 0.25), 1.6);
          const dx = gl >= 0 ? (rnd(gl + i) - 0.5) * 60 : 0;
          return (
            <g key={i} transform={`translate(${x + 290 + dx} ${y + 230}) scale(${clamp01(k)})`}>
              <rect x={-290} y={-230} width={580} height={460} fill={bg} stroke={INK} strokeWidth={8} />
              <circle r={160} fill={c} stroke={INK} strokeWidth={10} />
              <circle r={160} fill="url(#ben)" opacity={0.5} />
              {gl >= 0 && <rect x={-290} y={-230 + rnd(gl * 3 + i) * 400} width={580} height={30 + rnd(gl + i * 5) * 50} fill={["#05D9E8", "#FF2A6D", "#FFFFFF"][(gl + i) % 3]} opacity={0.8} />}
            </g>
          );
        })}
      </Svg>
      <div style={{ position: "absolute", left: 0, top: 0, width: 680, height: 1080, background: "#FFE600" }} />
      <Line t={t} at={S.t + 0.25} out={S.out} text="不再相信任何" x={64} y={330} size={60} color={INK} shadow="none" />
      <Line t={t} at={S.t + 0.45} out={S.out} text="「宏大叙事」。" x={64} y={415} size={66} color="#FF2A6D" shadow="4px 4px 0 #111" />
      <Line t={t} at={C.glitch} out={S.out} text="拟像：比真实更真实。" x={64} y={530} size={50} color={INK} shadow="none" stagger={0.03} />
      <Chip t={t} at={S.t + 0.6} out={S.out} text="利奥塔 1979 · 鲍德里亚 1981" x={68} y={620} size={26} bg={INK} fg="#FFE600" />
    </Fill>
  );
};

// ═══ 15 现代犬儒: we've seen through it all — a feed of shrugs; then the split with Diogenes
const FEED = ["反正都一样", "都是套路", "躺平吧", "认真你就输了", "看透不说透", "算了", "关我什么事", "呵呵", "随便吧", "都是剧本"];
export const Cynic: React.FC<{ t: number }> = ({ t }) => {
  const S = MJ.seg[14], C = CUE.cynic;
  const split = eInOut(range(t, C.split, C.split + 0.4));
  const scroll = (t - S.t) * 420;
  return (
    <Fill bg="#0E1033">
      <div style={{ position: "absolute", left: 1060, top: 60, width: 520, height: 960, borderRadius: 48, border: "10px solid #2B2F6B", overflow: "hidden", background: "#15183F", transform: `translateX(${split * 280}px)` }}>
        {Array.from({ length: 14 }, (_, i) => {
          const y = i * 150 - (scroll % 150) - 150 * Math.floor(scroll / 150 % 1);
          const yy = ((i * 150 - scroll) % 2100 + 2100) % 2100 - 150;
          return (
            <div key={i} style={{ position: "absolute", left: 24, top: yy, width: 452, height: 128, borderRadius: 18, background: ["#262A63", "#30245E", "#1F3A5F"][i % 3], display: "flex", alignItems: "center", gap: 18, padding: "0 22px", boxSizing: "border-box" }} data-y={y}>
              <div style={{ width: 64, height: 64, borderRadius: 32, background: ["#FF4FA3", "#4F8BFF", "#FFC24A"][i % 3] }} />
              <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 34, color: "#F6F0FF" }}>{FEED[i % FEED.length]}</div>
              <div style={{ marginLeft: "auto", fontFamily: GROT, fontWeight: 700, fontSize: 22, color: "#FF4FA3" }}>♥ {Math.floor(rnd(i) * 90 + 9)}k</div>
            </div>
          );
        })}
      </div>
      {split > 0 && (
        <div style={{ position: "absolute", left: 0, top: 0, width: 960 * split, height: 1080, overflow: "hidden" }}>
          <Img src={staticFile("media/me_diogenes.jpg")} style={{ position: "absolute", left: 0, top: 0, width: 960, height: 1080, objectFit: "cover", objectPosition: "30% 50%", filter: "contrast(1.1) saturate(1.2)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 45%)" }} />
          <div style={{ position: "absolute", left: 64, top: 860, fontFamily: SERIF, fontWeight: 900, fontSize: 56, color: GOLD }}>古典犬儒：看透了，就真活。</div>
        </div>
      )}
      {split > 0 && <div style={{ position: "absolute", left: 960 * split - 5, top: 0, width: 10, height: 1080, background: GOLD }} />}
      {split <= 0.02 && <>
        <Line t={t} at={S.t + 0.25} out={C.split} text="我们什么都看透了，" x={64} y={330} size={58} color="#F6F0FF" />
        <Line t={t} at={C.line} out={C.split} text="然后照样配合。" x={64} y={415} size={70} color="#FF4FA3" />
        <Chip t={t} at={C.line + 0.3} out={C.split} text="斯洛特戴克 1983：开明的虚假意识" x={68} y={530} size={26} bg="#F6F0FF" />
      </>}
      {split > 0.9 && <div style={{ position: "absolute", left: 1000, top: 960, fontFamily: SERIF, fontWeight: 900, fontSize: 48, color: "#FF4FA3", opacity: range(t, C.split + 0.4, C.split + 0.6), textShadow: "0 4px 18px rgba(0,0,0,0.8)" }}>现代犬儒：看透了，照样配合。</div>}
    </Fill>
  );
};

// ═══ the ending: every answer as one disc on a wheel; they fall into the centre; one open circle is left for you
const WHEEL: [string | null, string][] = [["me_athens.jpg", "#B8662F"], ["me_diogenes.jpg", "#2B1B10"], ["me_marcus.jpg", "#7A2E1C"], ["me_rose.jpg", "#0E1E5C"], ["me_vitruvian.jpg", "#E8D9B5"],
  ["me_descartes.jpg", "#120C08"], ["me_kant.jpg", "#2E4A7A"], ["me_wanderer.jpg", "#5C6B78"], ["me_wedge.jpg", "#E7E0D2"], ["me_scream.jpg", "#D9541E"], [null, "#EDE6D8"],
  ["ad_blacksquare.jpg", "#F4F1EA"], ["me_panopticon.jpg", "#050608"], [null, "#FF2A6D"], [null, "#0E1033"]];
export const End: React.FC<{ t: number }> = ({ t }) => {
  const E = CUE.end, cx = 960, cy = 470;
  const spin = (t - E.wheel) * 40, inn = eIn(range(t, E.brush - 0.6, E.brush));
  const brush = eInOut(range(t, E.brush, E.brush + 0.9));
  return (
    <Fill bg={INK}>
      {t < E.brush + 0.1 && WHEEL.map(([src, bg], i) => {
        const k = backOut(range(t, E.wheel + i * 0.05, E.wheel + i * 0.05 + 0.3), 1.6);
        const a = (i / WHEEL.length) * Math.PI * 2 + (spin * Math.PI) / 180 - Math.PI / 2, R = 360 * (1 - inn);
        const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a), r = 78 * clamp01(k) * (1 - inn * 0.7);
        return (
          <div key={i} style={{ position: "absolute", left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: "50%", overflow: "hidden", background: bg, border: `3px solid ${GOLD}` }}>
            {src && <Img src={staticFile(`media/${src}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BIG, fontSize: r * 0.55, color: PAPER, textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>{String(i + 1).padStart(2, "0")}</div>
          </div>
        );
      })}
      <Svg>
        {/* an open circle, drawn by hand, with a gap left */}
        <path d={`M${cx + 300 * Math.cos(-1.3)},${cy + 300 * Math.sin(-1.3)} A300,300 0 1 1 ${cx + 300 * Math.cos(-1.75)},${cy + 300 * Math.sin(-1.75)}`} fill="none" stroke={GOLD} strokeWidth={26} strokeLinecap="round"
          strokeDasharray={`${1820 * brush} 9999`} opacity={0.95} />
        <path d={`M${cx + 300 * Math.cos(-1.3)},${cy + 300 * Math.sin(-1.3)} A300,300 0 1 1 ${cx + 300 * Math.cos(-1.75)},${cy + 300 * Math.sin(-1.75)}`} fill="none" stroke="#FFF4C8" strokeWidth={6} strokeLinecap="round"
          strokeDasharray={`${1820 * brush} 9999`} opacity={0.7} transform={`translate(-4 -3)`} />
      </Svg>
      <Line t={t} at={E.wheel + 0.2} out={E.brush} text="15 种回答，2500 年。" x={960} y={890} size={52} color={PAPER} anchor="center" stagger={0.02} />
      <Line t={t} at={E.l1} out={61} text="意义，不是找到的——" x={960} y={820} size={60} color={PAPER} anchor="center" stagger={0.04} />
      <Line t={t} at={E.l2} out={61} text="是你活出来的。" x={960} y={910} size={76} color={GOLD} anchor="center" stagger={0.06} />
      <div style={{ position: "absolute", left: cx, top: cy, transform: "translate(-50%, -50%)", fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: PAPER, opacity: eOut(range(t, E.title, E.title + 0.5)), letterSpacing: 6, textAlign: "center" }}>
        意义，从哪来？
        <div style={{ fontFamily: GROT, fontWeight: 700, fontSize: 20, letterSpacing: 5, color: GOLD, marginTop: 10 }}>PLATO → TODAY · 60 SECONDS</div>
      </div>
    </Fill>
  );
};
export { Compass, lerp };
