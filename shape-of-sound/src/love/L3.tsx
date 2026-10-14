// 什么是爱 — part 3: loss (元好问's geese, 归有光's loquat tree), what love becomes (Rilke, Fromm), a cascade of answers,
// Klimt's gold, and the ending — who is your rose? Go and see them at four this afternoon.
import React from "react";
import { Art, BRUSH, FIELD, Field, GOLD, GOLDL, INK, LJ, Layer, MUTE, Motes, Note, Orig, PAPER, ROSE, Rose, SERIF, Say, Svg, Thread, Wash, eIn, eInOut, eOut, fade, fieldToScreen, lerp, range, rnd } from "./kit";

const SHADOW = "0 2px 18px rgba(0,0,0,0.6)";
const goose = (x: number, y: number, s: number, flap: number) => `M${x - 34 * s},${y + 10 * flap * s} Q${x - 16 * s},${y - 14 * flap * s - 6 * s} ${x},${y} Q${x + 16 * s},${y - 14 * flap * s - 6 * s} ${x + 34 * s},${y + 10 * flap * s}`;

// ═══ 元好问 and the geese: one was killed; the other circled, crying, and threw itself to the ground
export const Geese: React.FC<{ t: number }> = ({ t }) => {
  const G = LJ.geese;
  if (t < G.t - 0.5 || t >= G.out + 0.5) return null;
  const o = fade(t, G.t - 0.5, G.out + 0.5, 0.7, 0.7);
  const fly = range(t, G.t, G.kill), base = 230 + 560 * fly;
  const flap = Math.sin(t * 9);
  const A: [number, number] = [base, 330 + Math.sin(t * 1.5) * 12];
  const killK = range(t, G.kill, G.kill + 1.2);
  const B: [number, number] = t < G.kill ? [base + 150, 300 + Math.sin(t * 1.5 + 1) * 12] : [base + 150 + killK * 60, 300 + eIn(killK) * 800];
  // the survivor circles, then dives
  let S = A;
  if (t >= G.kill) {
    const c = range(t, G.kill, G.fall), ang = c * Math.PI * 3.2;
    S = [A[0] + 40 + Math.cos(ang) * 110 - 110, 330 + Math.sin(ang) * 70];
    if (t >= G.fall) { const d = eIn(range(t, G.fall, G.fall + 1.0)); S = [S[0] + d * 40, S[1] + d * 800]; }
  }
  const snap = range(t, G.kill, G.kill + 0.5);
  const poem = eOut(range(t, G.poem, G.poem + 0.8));
  return (
    <Layer o={o}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #0B1640 0%, #1B2F6E 38%, #6D84B8 72%, #C9D2E4 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(11,22,64,0.0) 60%, rgba(11,22,64,0.65) 100%)" }} />
      <div style={{ position: "absolute", left: 360, top: 120, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, #FFF8E2 0%, #F4E7C2 60%, rgba(244,231,194,0) 72%)", opacity: 0.95 }} />
      <Motes t={t} n={60} color="#E8ECFF" seed={7} o={0.8} />
      <Art src="lv_geese.jpg" t={t} a={G.t - 0.5} b={G.out + 0.5} from={[0.5, 0.15, 1.0]} to={[0.5, 0.35, 1.08]} box={[1300, 0, 560, 1080]} mask="linear-gradient(90deg, transparent 0%, #000 18%)" filter="saturate(0.85) brightness(0.92)" />
      <Svg>
        {t < G.kill + 0.5 && <path d={`M${A[0]},${A[1]} Q${(A[0] + B[0]) / 2},${(A[1] + B[1]) / 2 + 20 + snap * 120} ${t < G.kill ? B[0] : lerp(A[0], B[0], 1 - snap)},${t < G.kill ? B[1] : lerp(A[1], B[1], 1 - snap)}`}
          fill="none" stroke={GOLD} strokeWidth={2.5} opacity={1 - snap} />}
        {killK < 1 && <path d={goose(B[0], B[1], 1.7, t < G.kill ? flap : 0.2)} stroke={PAPER} strokeWidth={5} fill="none" strokeLinecap="round" opacity={1 - killK} />}
        {(t < G.fall + 1.0) && <path d={goose(S[0], S[1], 1.8, t < G.fall ? flap : -0.6)} stroke={PAPER} strokeWidth={5.5} fill="none" strokeLinecap="round" opacity={1 - range(t, G.fall + 0.6, G.fall + 1.0)} />}
      </Svg>
      <Say t={t} at={G.l1} out={G.poem - 0.2} text="1205年，十六岁的元好问遇见一个捕雁人。" x={130} y={700} size={40} color={PAPER} stagger={0.03} />
      <Say t={t} at={G.l2} out={G.poem - 0.2} text="一只雁被杀了。" x={130} y={775} size={50} color={PAPER} />
      <Say t={t} at={G.l3} out={G.poem - 0.2} text="另一只盘旋悲鸣，不肯离开——" x={130} y={850} size={50} color={PAPER} />
      <Say t={t} at={G.l4} out={G.poem - 0.2} text="然后，扑向了地面。" x={130} y={925} size={50} color={GOLDL} weight={900} />
      {poem > 0 && <>
        <Say t={t} at={G.poem} out={G.out + 0.5} text="问世间，情是何物，" x={1000} y={110} size={96} color={PAPER} font={BRUSH} weight={400} vertical stagger={0.09} glow="0 0 30px rgba(200,210,255,0.35)" />
        <Say t={t} at={G.poem + 0.9} out={G.out + 0.5} text="直教生死相许？" x={850} y={110} size={96} color={GOLDL} font={BRUSH} weight={400} vertical stagger={0.09} glow="0 0 30px rgba(242,214,142,0.5)" />
        <Note t={t} at={G.poem + 0.5} out={G.out} text="元好问《摸鱼儿·雁丘词》· 画：歌川广重《月下雁》" x={130} y={1010} color="#AEB4D6" />
      </>}
    </Layer>
  );
};

// ═══ 归有光: the loquat tree his wife planted the year she died now stands tall, its crown like a canopy
export const Loquat: React.FC<{ t: number }> = ({ t }) => {
  const L = LJ.loquat;
  if (t < L.t - 0.5 || t >= L.out + 0.5) return null;
  const o = fade(t, L.t - 0.5, L.out + 0.5, 0.8, 0.6);
  const grow = eInOut(range(t, L.t, L.l3 + 0.5));
  return (
    <Layer o={o}>
      <Wash t={t} a="rgba(170,190,160,0.4)" b="rgba(240,200,170,0.4)" base="#EFE8DA" />
      <Art src="lv_loquat.jpg" t={t} a={L.t - 0.5} b={L.out + 0.5} from={[0.5, 0.5, 1.0]} to={[0.5, 0.45, 1.08]} fit="contain" box={[1040, 120, 780, 780]} blend="multiply" />
      <Svg>
        <Thread d="M980,1080 C980,900 1100,820 1180,700 C1230,620 1300,560 1380,520" k={grow} len={760} w={3} />
        <Thread d="M1180,700 C1150,640 1120,600 1080,560" k={range(grow, 0.5, 1)} len={200} w={2} />
        <Thread d="M1290,590 C1330,520 1380,470 1450,450" k={range(grow, 0.65, 1)} len={240} w={2} />
      </Svg>
      <Say t={t} at={L.l1} out={L.out + 0.5} text="归有光的妻子去世后——" x={130} y={300} size={42} color={MUTE} />
      <Say t={t} at={L.l2} out={L.out + 0.5} text="她亲手种下的枇杷树，" x={130} y={380} size={62} />
      <Say t={t} at={L.l2 + 0.7} out={L.out + 0.5} text="如今已亭亭如盖。" x={130} y={470} size={62} />
      <Say t={t} at={L.l3} out={L.out + 0.5} text="爱没有离开，它长成了一棵树。" x={130} y={620} size={56} color={ROSE} weight={900} />
      <Note t={t} at={L.l3 + 0.4} out={L.out} text="「庭有枇杷树，吾妻死之年所手植也，今已亭亭如盖矣。」——归有光《项脊轩志》· 画：林椿《枇杷山鸟图》南宋" x={130} y={1000} size={21} />
    </Layer>
  );
};

// ═══ Rilke over Rembrandt's hands: two solitudes that protect, border and greet each other
export const Rilke: React.FC<{ t: number }> = ({ t }) => {
  const R = LJ.rilke;
  if (t < R.t - 0.5 || t >= R.out + 0.5) return null;
  const o = fade(t, R.t - 0.5, R.out + 0.5, 0.7, 0.6);
  return (
    <Layer o={o}>
      <Art src="lv_bride.jpg" t={t} a={R.t - 0.5} b={R.out + 0.5} from={[0.52, 0.6, 1.35]} to={[0.54, 0.64, 1.6]} filter="contrast(1.05) brightness(0.95)" />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(18,10,6,0.88) 0%, rgba(18,10,6,0.55) 45%, rgba(18,10,6,0) 75%)" }} />
      <Say t={t} at={R.l1} out={R.out + 0.5} text="爱，是两个孤独，" x={130} y={380} size={70} color={PAPER} glow={SHADOW} />
      <Say t={t} at={R.l2} out={R.out + 0.5} text="彼此守护，彼此致意。" x={130} y={490} size={70} color={GOLDL} weight={900} glow={SHADOW} />
      <Orig t={t} at={R.l2 + 0.5} out={R.out + 0.5} text="« … daß zwei Einsamkeiten einander schützen, grenzen und grüßen. »" x={134} y={600} color="#D8C8B0" size={28} />
      <Note t={t} at={R.l1 + 0.4} out={R.out} text="里尔克《给青年诗人的信》1904 · 画：伦勃朗《犹太新娘》约1665" x={134} y={660} color="#B8A890" />
    </Layer>
  );
};

// ═══ Fromm: love is not something you fall into; it is an ability you practise — the thread weaves a cloth
export const Fromm: React.FC<{ t: number }> = ({ t }) => {
  const F = LJ.fromm;
  if (t < F.t - 0.5 || t >= F.out + 0.5) return null;
  const o = fade(t, F.t - 0.5, F.out + 0.5, 0.6, 0.6);
  const k = range(t, F.t - 0.3, F.out);
  const rows = 9;
  return (
    <Layer o={o}>
      <Wash t={t} a="rgba(242,214,142,0.35)" b="rgba(232,170,170,0.3)" />
      <Svg>
        {Array.from({ length: rows }, (_, r) => {
          const y = 690 + r * 40, kr = Math.max(0, Math.min(1, k * rows * 0.9 - r * 0.6));
          const pts = Array.from({ length: 49 }, (_, i) => `${i * 40},${y + (i % 2 ? 1 : -1) * (r % 2 ? 1 : -1) * 9}`).join(" L");
          return <Thread key={r} d={`M${pts}`} k={kr} len={2100} w={2.4} color={r % 3 === 1 ? "#B8323F" : GOLD} />;
        })}
      </Svg>
      <Say t={t} at={F.l1} out={F.out + 0.5} text="爱不是“坠入”的，" x={960} y={260} size={70} anchor="center" />
      <Say t={t} at={F.l2} out={F.out + 0.5} text="是一种需要练习的能力。" x={960} y={370} size={70} anchor="center" color={ROSE} weight={900} />
      <Orig t={t} at={F.l2 + 0.5} out={F.out + 0.5} text="“Love is an activity … it is a ‘standing in’, not a ‘falling for’.”" x={960} y={480} anchor="center" size={27} />
      <Note t={t} at={F.l1 + 0.4} out={F.out} text="弗洛姆《爱的艺术》1956" x={960} y={540} anchor="center" />
    </Layer>
  );
};

// ═══ a cascade of answers from across time
const MQ: [string, string][] = [["情不知所起，一往而深。", "汤显祖《牡丹亭》1598"], ["爱是恒久忍耐，又有恩慈。", "《哥林多前书》13:4"], ["十年生死两茫茫，不思量，自难忘。", "苏轼《江城子》1075"]];
export const Montage: React.FC<{ t: number }> = ({ t }) => {
  const M = LJ.montage;
  if (t < M.t - 0.4 || t >= M.out + 0.6) return null;
  const o = fade(t, M.t - 0.4, M.out + 0.6, 0.4, 0.7);
  return (
    <Layer o={o}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, #3A2618 0%, #1C120C 70%)" }} />
      <Motes t={t} n={90} seed={11} />
      {MQ.map(([q, src], i) => {
        const at = M.q[i];
        if (t < at) return null;
        const k = eOut(range(t, at, at + 0.5)), dimmed = i < 2 && t > M.q[i + 1] ? 0.55 : 1;
        const y = 300 + i * 190;
        return <div key={i} style={{ position: "absolute", left: 960, top: y, transform: `translate(-50%, -50%) scale(${1.12 - 0.12 * k})`, opacity: k * dimmed, textAlign: "center", whiteSpace: "nowrap", filter: `blur(${(1 - k) * 6}px)` }}>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 62, color: i === 2 ? GOLDL : PAPER, textShadow: "0 0 30px rgba(242,214,142,0.35)" }}>{q}</div>
          <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 28, color: "#C8B08A", marginTop: 6 }}>—— {src}</div>
        </div>;
      })}
    </Layer>
  );
};

// Klimt's ornament: gold spirals, ringed circles and little rectangles bloom out of the dark before the painting arrives
const Mosaic: React.FC<{ t: number; at: number; o: number }> = ({ t, at, o }) => (
  <Svg>
    <defs><radialGradient id="kg"><stop offset="0%" stopColor="#FFF0B0" /><stop offset="55%" stopColor="#E0B040" /><stop offset="100%" stopColor="#8A5A12" /></radialGradient></defs>
    {Array.from({ length: 120 }, (_, i) => {
      const x = rnd(i) * 1920, y = rnd(i + 1) * 1080, d = Math.hypot(x - 960, y - 540) / 1100, k = eOut(range(t, at + d * 0.9, at + d * 0.9 + 0.5)), kind = i % 4, s = 20 + rnd(i + 2) * 46;
      if (k <= 0) return null;
      const g = <g key={i} transform={`translate(${x} ${y}) scale(${k}) rotate(${(t - at) * 20 * (i % 2 ? 1 : -1)})`} opacity={o}>
        {kind === 0 && <><circle r={s} fill="url(#kg)" /><circle r={s * 0.62} fill="none" stroke="#5A3A08" strokeWidth={3} /><circle r={s * 0.3} fill="#5A3A08" /></>}
        {kind === 1 && <path d={Array.from({ length: 40 }, (_, j) => { const a = j * 0.45, r = s * j / 40; return `${j ? "L" : "M"}${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(" ")} fill="none" stroke="#E8B848" strokeWidth={4} />}
        {kind === 2 && <><rect x={-s * 0.4} y={-s * 0.7} width={s * 0.8} height={s * 1.4} fill="#1A1206" stroke="#E0B040" strokeWidth={3} /><rect x={-s * 0.2} y={-s * 0.45} width={s * 0.4} height={s * 0.9} fill="#E0B040" /></>}
        {kind === 3 && <><circle r={s * 0.7} fill="#C9ACD8" opacity={0.8} /><circle r={s * 0.45} fill="none" stroke="#F4E2A0" strokeWidth={3} /><circle r={s * 0.18} fill="#E07848" /></>}
      </g>;
      return g;
    })}
  </Svg>
);

// ═══ Klimt's gold: no words
export const Kiss: React.FC<{ t: number }> = ({ t }) => {
  const K = LJ.kiss;
  if (t < K.t - 0.6 || t >= K.out + 0.6) return null;
  const o = fade(t, K.t - 0.6, K.out + 0.6, 0.8, 0.8);
  return (
    <Layer o={o}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, #2A1D08 0%, #0E0904 75%)" }} />
      <Mosaic t={t} at={K.bloom} o={1 - 0.75 * eInOut(range(t, K.paint, K.paint + 1.4))} />
      <Art src="lv_kiss.jpg" t={t} a={K.paint - 0.4} b={K.out + 0.6} from={[0.5, 0.2, 1.0]} to={[0.47, 0.17, 1.45]} filter="saturate(1.05) contrast(1.04)" o={eInOut(range(t, K.paint - 0.2, K.paint + 1.0))} />
      <Motes t={t} n={60} seed={13} color="#FFE7A8" />
      <Note t={t} at={K.t + 0.4} out={K.out} text="克里姆特《吻》1907—1908 · 美景宫" x={1840} y={1020} anchor="right" color={PAPER} />
    </Layer>
  );
};

// ═══ the ending: so what is love? … who is your rose? go and see them at four this afternoon
export const End: React.FC<{ t: number }> = ({ t }) => {
  const E = LJ.end;
  if (t < E.t - 0.6 || t > LJ.curtain.close3[1] + 0.2) return null;
  const o = eOut(range(t, E.t - 0.6, E.t + 0.2));
  const roses = eInOut(range(t, E.roses - 0.4, E.roses + 0.5)), card = eInOut(range(t, E.card - 0.3, E.card + 0.6));
  const zin = eInOut(range(t, E.go1, E.go2 + 1.4));
  const z = lerp(0.5, 1.9, zin), fx = lerp(3600, FIELD.one[0], zin), fy = lerp(1400, FIELD.one[1] - 170 / z, zin);
  const [rx, ry] = fieldToScreen(FIELD.one[0], FIELD.one[1], z, fx, fy);
  const glow = eOut(range(t, E.roses + 0.2, E.roses + 1.0));
  const cl = eInOut(range(t, E.a1, E.a1 + 1.6));
  const hour = (90 + 30 * cl - 90) * Math.PI / 180, minute = (360 * cl - 90) * Math.PI / 180;
  return (
    <Layer o={o}>
      <Wash t={t} a="rgba(232,170,170,0.35)" b="rgba(242,214,142,0.45)" />
      <Say t={t} at={E.ask} out={E.a1 - 0.1} text="所以，什么是爱？" x={960} y={440} size={84} anchor="center" />
      {t > E.a1 - 0.1 && t < E.a2 && <Svg><g opacity={fade(t, E.a1 - 0.1, E.a2, 0.4, 0.4)}>
        <circle cx={960} cy={330} r={70} fill="#FBF5EA" stroke={INK} strokeWidth={3} />
        <line x1={960} y1={330} x2={960 + Math.cos(hour) * 36} y2={330 + Math.sin(hour) * 36} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <line x1={960} y1={330} x2={960 + Math.cos(minute) * 54} y2={330 + Math.sin(minute) * 54} stroke={ROSE} strokeWidth={3} strokeLinecap="round" />
      </g></Svg>}
      <Say t={t} at={E.a1} out={E.a2} text="是有一个人，让你从三点就开始幸福。" x={960} y={450} size={62} anchor="center" stagger={0.04} />
      {t > E.a2 - 0.1 && t < E.a3 && <Rose x={980} y={300} h={300} o={fade(t, E.a2 - 0.1, E.a3, 0.4, 0.4)} glow={0.3} />}
      <Say t={t} at={E.a2} out={E.a3} text="是你为一朵玫瑰，“浪费”的时间。" x={960} y={500} size={62} anchor="center" stagger={0.04} />
      {t > E.a3 - 0.1 && t < E.roses && <Svg><g opacity={fade(t, E.a3 - 0.1, E.roses, 0.4, 0.4)}>
        <Thread d="M860,330 C900,260 1020,260 1000,330 C980,400 900,380 940,320 C980,260 1060,300 1060,330" k={eInOut(range(t, E.a3, E.a3 + 1.2))} len={600} w={4} />
      </g></Svg>}
      <Say t={t} at={E.a3} out={E.roses} text="是驯服了，就永远负责。" x={960} y={450} size={66} anchor="center" color={ROSE} weight={900} />
      {roses > 0 && <Layer o={roses * (1 - card)}>
        <Field z={z} fx={fx} fy={fy} dim={0.7 * glow} filter="sepia(0.1)" />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(15,10,10,0.55) 0%, rgba(15,10,10,0.2) 60%)" }} />
        <Rose x={rx} y={ry} h={261 * z * lerp(1.6, 1.25, zin)} glow={glow} />
        <Svg><Thread d={`M${rx},${ry} C${rx + 300},${ry + 200} ${1700},${900} ${2100},${1150}`} k={eInOut(range(t, E.go2, E.card))} len={1600} w={4} /></Svg>
        <Say t={t} at={E.mine} out={E.go1} text="你的那朵玫瑰，" x={960} y={130} size={78} anchor="center" color={PAPER} glow={SHADOW} />
        <Say t={t} at={E.who} out={E.go1} text="是谁？" x={960} y={240} size={110} anchor="center" color={GOLDL} weight={900} glow="0 0 36px rgba(242,214,142,0.6), 0 4px 20px rgba(0,0,0,0.6)" />
        <Say t={t} at={E.go1} out={E.card + 0.6} text="今天下午四点，" x={960} y={130} size={78} anchor="center" color={PAPER} glow={SHADOW} />
        <Say t={t} at={E.go2} out={E.card + 0.6} text="去见 ta 吧。" x={960} y={240} size={110} anchor="center" color={GOLDL} weight={900} glow="0 0 36px rgba(242,214,142,0.6), 0 4px 20px rgba(0,0,0,0.6)" />
      </Layer>}
      {card > 0 && <Layer o={card}>
        <Wash t={t} a="rgba(232,170,170,0.3)" b="rgba(242,214,142,0.4)" />
        <Say t={t} at={E.card + 0.1} out={99} text="什么是爱" x={960} y={400} size={110} anchor="center" weight={900} stagger={0.1} />
        <Orig t={t} at={E.card + 0.6} out={99} text="« On ne voit bien qu'avec le cœur. »" x={960} y={560} anchor="center" size={36} color="#8C6A5A" />
        <Note t={t} at={E.card + 1.0} out={99} text="《小王子》· 柏拉图 · 莎士比亚 · 元好问 · 归有光 · 里尔克 · 弗洛姆 · 汤显祖 · 苏轼" x={960} y={1000} anchor="center" />
      </Layer>}
    </Layer>
  );
};
