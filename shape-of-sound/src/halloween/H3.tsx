// The turn: the pumpkin's home is Mexico, where the dead are welcomed (Día de Muertos); the East's night of the dead
// (中元 / 盂兰盆, river lanterns); お盆 (Hokusai's lantern ghost, lantern boats, the 送り火); and the lift: every lantern
// lit — 「这些“鬼”，是谁？」「是我们想念的人」「怕鬼，其实是想念」.
import React from "react";
import { Land, View, proj } from "../ocean/kit";
import { Art, CREAM, Card, Credit, FELL, Flame, GLOW, HJ, LANTERNS, Lantern, Layer, NIGHT, Note, ORANGE, SANS, Say, Svg, Vignette, Embers, eIn, eInOut, eOut, fade, lerp, range, rnd, scene } from "./kit";
import { ROW } from "./H1";

const M = HJ.mexico, Z = HJ.zhongyuan, O = HJ.obon, L = HJ.lift;
const MEX: View = { lon: -100, lat: 21, z: 34, kx: 0.94 };
const OAXACA = [-96.7, 17.06];

export const Mexico: React.FC<{ t: number }> = ({ t }) => {
  if (t < M.t - 0.5 || t >= M.out + 0.6) return null;
  const v: View = { ...MEX, z: lerp(22, 40, eInOut(range(t, M.t, M.l2))) };
  const [ox, oy] = proj(v, OAXACA[0], OAXACA[1]);
  const seedY = lerp(-60, oy, eIn(range(t, M.t - 0.4, M.t + 0.6)));
  const photo = eInOut(range(t, M.l2 - 0.4, M.l2 + 0.4));
  return (
    <Layer o={scene(t, M.t, M.out)} style={{ background: "#120C10" }}>
      <Layer o={1 - photo}>
        <Svg>
          <rect x={0} y={0} width={1920} height={1080} fill="#14202A" /><Land v={v} fill="#6A4A30" stroke="#C08A50" sw={1.5} />
          {t > M.t + 0.6 && <g><circle cx={ox} cy={oy} r={14 + 40 * eOut(range(t, M.t + 0.6, M.t + 1.4))} fill="none" stroke={ORANGE} strokeWidth={4} opacity={1 - eOut(range(t, M.t + 0.6, M.t + 1.6)) * 0.7} /><circle cx={ox} cy={oy} r={10} fill={ORANGE} /></g>}
          <ellipse cx={ox} cy={seedY} rx={9} ry={14} fill="#EBDDB8" opacity={t < M.t + 0.7 ? 1 : 0} />
          <text x={ox + 24} y={oy + 46} fontFamily={SANS} fontWeight={700} fontSize={30} fill={CREAM} opacity={eOut(range(t, M.l1, M.l1 + 0.4))}>瓦哈卡 Oaxaca</text>
        </Svg>
      </Layer>
      <Layer o={photo}>
        <Art src="hw_ofrenda.jpg" t={t} a={M.l2 - 0.4} b={M.out + 0.5} from={[0.5, 0.5, 1.15]} to={[0.5, 0.45, 1.0]} filter="saturate(1.15) contrast(1.05) brightness(0.92)" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(10,6,10,0.85) 0%, rgba(10,6,10,0.35) 45%, rgba(10,6,10,0) 70%)" }} />
        <Card src="hw_catrina.jpg" t={t} at={M.l3 - 0.2} out={M.out + 0.3} x={1460} y={640} w={640} h={470} rot={4} from={[700, 0]} />
      </Layer>
      <Say t={t} at={M.l1} out={M.l2} text="南瓜的老家：墨西哥" x={110} y={110} size={62} color={ORANGE} />
      <Note t={t} at={M.l1 + 0.4} out={M.l2} text="约一万年前，在瓦哈卡被驯化" x={114} y={200} size={26} />
      <Say t={t} at={M.l2} out={M.out + 0.2} text="11月1–2日：亡灵节" x={110} y={110} size={62} color={GLOW} />
      <Note t={t} at={M.l2 + 0.3} out={M.out} text="Día de Muertos · 2008年列入联合国非遗名录" x={114} y={200} size={26} font={FELL} />
      <Say t={t} at={M.l3} out={M.out + 0.2} text="摆一桌饭，等家人回家。" x={110} y={270} size={56} />
      <Credit t={t} at={M.l2} out={M.l3} text="家中的亡灵节祭坛 · Aletsssss（CC0）" />
      <Credit t={t} at={M.l3} out={M.out} text="波萨达《卡特琳娜》约1910–13 · 大都会艺术博物馆" />
    </Layer>
  );
};

// 中元: the full moon of the seventh month, a 1915 photo of river lanterns, lanterns drifting on dark water
export const Zhongyuan: React.FC<{ t: number }> = ({ t }) => {
  if (t < Z.t - 0.5 || t >= Z.out + 0.6) return null;
  return (
    <Layer o={scene(t, Z.t, Z.out)} style={{ background: "#0A0A12" }}>
      <Art src="hw_hedeng.jpg" t={t} a={Z.t - 0.5} b={Z.out + 0.5} from={[0.5, 0.55, 1.1]} to={[0.5, 0.5, 1.0]} filter="sepia(0.6) brightness(0.62) contrast(1.1)" o={0.85} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,8,16,0.85) 0%, rgba(8,8,16,0.2) 40%, rgba(8,8,16,0.75) 100%)" }} />
      <Svg>
        <circle cx={1560} cy={200} r={95} fill="#F4E7C8" opacity={0.9} /><circle cx={1560} cy={200} r={170} fill="#F4E7C8" opacity={0.08} />
        {Array.from({ length: 9 }, (_, i) => { const x = ((i * 260 + (t - Z.t) * (30 + 10 * rnd(i))) % 2200) - 140, y = 820 + 160 * rnd(i + 3) + Math.sin(t * 1.3 + i) * 6;
          return <Lantern key={i} kind={3} x={x} y={y} s={0.55 + 0.35 * rnd(i + 7)} lit={0.9} t={t + i} />; })}
      </Svg>
      <Say t={t} at={Z.l1} out={Z.out + 0.2} text="七月十五：中元节 · 盂兰盆节" x={110} y={110} size={58} />
      <Note t={t} at={Z.l1 + 0.3} out={Z.out} text="放河灯，为亡魂照亮回去的路" x={114} y={196} size={26} />
      <Say t={t} at={Z.l2} out={Z.out + 0.2} text="《盂兰盆经》：目连为救亡母，设供养僧" x={110} y={250} size={40} weight={600} color={GLOW} />
      <Credit t={t} at={Z.t} out={Z.out} text="中元节的水灯 · 《台湾写真帖》1915" />
    </Layer>
  );
};

// お盆: a fun scare (Hokusai's lantern ghost), then the lantern boats and the 送り火
export const Obon: React.FC<{ t: number }> = ({ t }) => {
  if (t < O.t - 0.5 || t >= O.out + 0.6) return null;
  const sc = eOut(range(t, O.scare, O.scare + 0.25)), ghostO = 1 - eInOut(range(t, O.l1 - 0.3, O.l1 + 0.3));
  const boats = fade(t, O.l1 - 0.3, O.fires + 0.3, 0.5, 0.5), fire = eInOut(range(t, O.fires - 0.2, O.fires + 0.6));
  return (
    <Layer o={scene(t, O.t, O.out)} style={{ background: NIGHT }}>
      <Layer o={ghostO}>
        <Art src="hw_oiwa.jpg" t={t} a={O.scare} b={O.l1} from={[0.5, 0.5, 1.0]} to={[0.5, 0.5, 1.08]} fit="contain" filter="contrast(1.1) saturate(1.1)" style={{ transform: `scale(${lerp(1.4, 1, sc)})` }} />
        <div style={{ position: "absolute", inset: 0, background: "#FFF6E0", opacity: Math.max(0, 0.8 - (t - O.scare) * 4) * (t >= O.scare ? 1 : 0) }} />
      </Layer>
      <Layer o={boats}>
        <div style={{ position: "absolute", left: 752, top: 196, width: 1076, height: 783, boxShadow: "0 20px 60px rgba(0,0,0,0.7)", outline: "1px solid rgba(255,179,71,0.35)", outlineOffset: 6 }} />
        <Art src="hw_boats.jpg" t={t} a={O.l1 - 0.3} b={O.fires + 0.3} from={[0.55, 0.6, 1.0]} to={[0.62, 0.62, 1.12]} box={[752, 196, 1076, 783]} filter="saturate(1.1) contrast(1.06) brightness(0.92)" />
      </Layer>
      <Layer o={fire}><Art src="hw_daimonji.jpg" t={t} a={O.fires - 0.2} b={O.out + 0.5} from={[0.5, 0.45, 1.2]} to={[0.5, 0.45, 1.0]} filter="saturate(1.1)" /></Layer>
      <Vignette o={0.6} />
      <Embers t={t} n={30} o={fire} seed={4} />
      <Say t={t} at={O.l1} out={O.out + 0.2} text="日本：お盆" x={110} y={100} size={64} />
      <Say t={t} at={O.l1 + 0.6} out={O.out + 0.2} text="点火迎接，放灯送别。" x={110} y={190} size={54} color={GLOW} />
      <Say t={t} at={O.l2} out={O.out + 0.2} text="和中元节，出自同一个目连的故事" x={110} y={280} size={38} weight={600} />
      <Credit t={t} at={O.scare} out={O.l1} text="葛饰北斋《百物语 · お岩さん》约1831 · 美国国会图书馆" />
      <Credit t={t} at={O.l1} out={O.fires} text="《灯节：亡者离去》1862 · 荷兰国立博物馆" />
      <Credit t={t} at={O.fires} out={O.out} text="京都五山送り火 · Takeshi Kuboki（CC BY 2.0）" />
    </Layer>
  );
};

export const Lift: React.FC<{ t: number }> = ({ t }) => {
  if (t < L.t - 0.5) return null;
  const card = eInOut(range(t, L.title - 0.3, L.title + 0.8));
  return (
    <Layer o={eOut(range(t, L.t - 0.5, L.t + 0.3))} style={{ background: NIGHT }}>
      <Svg>
        {LANTERNS.map((_, i) => <Lantern key={i} kind={i} x={ROW.x0 + i * ROW.dx} y={ROW.y} s={ROW.s} lit={eOut(range(t, L.lit[i], L.lit[i] + 0.5))} t={t} />)}
        {LANTERNS.map((n, i) => <text key={n} x={ROW.x0 + i * ROW.dx} y={ROW.y + 60} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill={GLOW} opacity={eOut(range(t, L.lit[i], L.lit[i] + 0.5)) * (1 - card)}>{n}</text>)}
      </Svg>
      <Embers t={t} n={50} o={eOut(range(t, L.l3, L.l3 + 1))} seed={7} />
      <Say t={t} at={L.l1} out={L.l2} text="这些“鬼”，是谁？" x={960} y={180} size={80} anchor="center" />
      <Say t={t} at={L.l2} out={L.l3} text="是我们想念的人。" x={960} y={180} size={80} anchor="center" color={GLOW} />
      <Say t={t} at={L.l3} out={L.title + 0.3} text="怕鬼，其实是想念。" x={960} y={170} size={104} anchor="center" color={ORANGE} stagger={0.08} />
      <Layer o={card} style={{ background: "rgba(10,7,12,0.92)" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: "'Noto Serif SC', serif", fontWeight: 900, fontSize: 150, color: CREAM, letterSpacing: 24, textShadow: "0 0 30px rgba(240,122,26,0.6)" }}>万圣节</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 500, textAlign: "center", fontFamily: FELL, fontStyle: "italic", fontSize: 64, color: ORANGE }}>Hallowe'en</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 930, textAlign: "center", fontFamily: SANS, fontWeight: 500, fontSize: 19, color: "rgba(242,230,201,0.6)", lineHeight: 1.7 }}>
          图：Culture Vannin · 麦克利斯 · 密苏里历史博物馆藏明信片 · 葛饰北斋 · 波萨达 · 《台湾写真帖》 · 荷兰国立博物馆 · Takeshi Kuboki<br />资料：Hutton《The Stations of the Sun》 · 美国国会图书馆民俗中心 · NRF 2026 · UNESCO · 《盂兰盆经》
        </div>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}><Flame x={960} y={720} h={60} t={t} seed={9} /></svg>
      </Layer>
      <Vignette o={0.5} />
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: eIn(range(t, L.out - 0.6, L.out)) }} />
    </Layer>
  );
};
