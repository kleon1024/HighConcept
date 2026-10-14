// Act I: the question on Hokusai's wave, the toys spill, the map; NASA's ocean and the title; Franklin's chart and
// the mail-packet race; Homer's Gulf Stream.
import React from "react";
import { OffthreadVideo, Sequence, staticFile } from "remotion";
import { AMBER, Art, BLACK, BRUSH, Credit, DUCK, Duck, FOAM, INK, Land, Layer, Note, OJ, PAPER, RED, SANS, SERIF, SEPIA, Say, Stream, Svg, View, along, eIn, eInOut, eOut, fade, lerp, lerpView, proj, range, rnd, smoothOf } from "./kit";

const H = OJ.hook, TI = OJ.title, F = OJ.franklin, HO = OJ.homer;

// where a point of a "cover"-fitted, focus-scaled image lands on screen
export const artPt = (W: number, Hh: number, fx: number, fy: number, s: number, px: number, py: number): [number, number] => {
  const c = Math.max(1920 / W, 1080 / Hh), x0 = (1920 - W * c) * fx, y0 = (1080 - Hh * c) * fy, ox = fx * 1920, oy = fy * 1080;
  return [ox + (x0 + px * c - ox) * s, oy + (y0 + py * c - oy) * s];
};

// the North Pacific of the 1992 spill, in Hokusai's Prussian blue and paper
export const PACIFIC: View = { lon: 200, lat: 47, z: 22, kx: 0.7 };
export const SPILL = [178.1, 44.7], SITKA = [224.67, 57.05];
export const DUCK_ROUTE = [SPILL, [186, 46.4], [196, 48.6], [206, 51.6], [214, 54.4], [220, 56.3], SITKA];
export const PRUSSIAN = "#1F3B5C", HPAPER = "#E8DCC0";
const TOYS = ["#FFCF33", "#3E7BD6", "#C8473B", "#4E9E52"]; // ducks, turtles, beavers, frogs

export const Hook: React.FC<{ t: number }> = ({ t }) => {
  if (t >= H.out + 0.5) return null;
  // the print: a slow push, then it shrinks into the spill point of the map
  const push = eInOut(range(t, 0, H.map)), s = lerp(1.0, 1.1, push), fx = 0.5, fy = lerp(0.42, 0.5, push);
  const m = eInOut(range(t, H.map - 0.2, H.map + 0.9));                 // print → map
  const [sx, sy] = proj(PACIFIC, SPILL[0], SPILL[1]);
  const printScale = lerp(1, 0.07, m), printX = lerp(0, sx - 960 * printScale, m), printY = lerp(0, sy - 540 * printScale, m);
  const zin = eIn(range(t, H.out - 0.5, H.out + 0.4));                   // zoom into the sea → the NASA ocean
  const v: View = lerpView(PACIFIC, { lon: 206, lat: 50, z: 120, kx: 0.7 }, zin);
  // the duck rides the trough by Mount Fuji until the container lands
  const [dx, dy] = artPt(1920, 1314, fx, fy, s, 1395, 905);
  const bob = Math.sin(t * 3.1) * 6, roll = Math.sin(t * 2.3) * 7;
  // the container falls and splashes at the duck
  const fall = range(t, H.drop, H.drop + 0.35), splash = range(t, H.drop + 0.33, H.drop + 1.3);
  const cy = lerp(-260, dy - 40, eIn(fall));
  const burst = range(t, H.burst - 0.05, H.map);
  return (
    <Layer o={1 - eIn(range(t, H.out - 0.15, H.out + 0.45))}>
      {/* the map (under the print) */}
      <Layer o={m} style={{ background: PRUSSIAN }}>
        <Svg>
          <Land v={v} fill={HPAPER} stroke="#3A3226" sw={1.2} />
          <path d={smoothOf(v, DUCK_ROUTE)} fill="none" stroke="rgba(255,236,170,0.35)" strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
        </Svg>
      </Layer>
      {/* the print */}
      <div style={{ position: "absolute", left: printX, top: printY, width: 1920, height: 1080, transform: `scale(${printScale})`, transformOrigin: "0 0", opacity: 1 - eIn(range(t, H.map + 0.5, H.map + 1.0)),
        boxShadow: m > 0.05 ? "0 10px 60px rgba(0,0,0,0.5)" : undefined }}>
        <Art src="oc_wave.jpg" t={t} a={0} b={H.map} from={[fx, 0.42, 1.0]} to={[fx, 0.5, 1.1]} filter="saturate(1.05) contrast(1.04)" />
        <Svg>
          {t < H.drop + 0.4 && <Duck x={dx} y={dy + bob} s={92} rot={roll} />}
          {fall > 0 && fall < 1 && <g transform={`translate(${dx - 70},${cy}) rotate(${lerp(-18, 6, fall)})`}>
            <rect x={0} y={0} width={150} height={66} fill="#C8572B" stroke="#5A2412" strokeWidth={3} />
            {[1, 2, 3, 4, 5, 6].map((i) => <line key={i} x1={i * 21.4} y1={4} x2={i * 21.4} y2={62} stroke="#7A3015" strokeWidth={3} />)}
          </g>}
          {/* the splash: a crown of foam in Hokusai's claws */}
          {splash > 0 && splash < 1 && Array.from({ length: 26 }, (_, i) => {
            const a = Math.PI * (1.05 + 0.9 * (i / 25)), r = 40 + 230 * eOut(splash) * (0.6 + 0.4 * rnd(i)), g = 260 * splash * splash;
            return <circle key={i} cx={dx + Math.cos(a) * r} cy={dy - 30 + Math.sin(a) * r * 0.9 + g} r={(1 - splash) * (9 + 9 * rnd(i + 3))} fill="#F7F1E1" stroke="#2C4A70" strokeWidth={2} />;
          })}
        </Svg>
      </div>
      {/* 28,800 toys burst out of the container (one dot = 72 toys) and then drift along the route on the map */}
      <Svg>
        {burst > 0 && Array.from({ length: 400 }, (_, i) => {
          const a = rnd(i) * Math.PI * 2, sp = 120 + 900 * Math.pow(rnd(i + 7), 1.6), d = sp * (1 - Math.exp(-3 * burst * 1.5));
          const bx = dx + Math.cos(a) * d, by = dy - 30 + Math.sin(a) * d * 0.62;
          // on the map: each dot rides the route with its own lag and spread
          const u = eInOut(range(t, H.map + 0.1 + rnd(i + 2) * 0.5, H.arrive + 0.6 + rnd(i + 5) * 0.8)) * (0.25 + 0.75 * rnd(i + 9));
          const [rx, ry] = along(v, DUCK_ROUTE, u), sprd = (1 - u * 0.6) * 46 * zinK(t);
          const mx = rx + (rnd(i + 11) - 0.5) * sprd * 2, my = ry + (rnd(i + 13) - 0.5) * sprd * 1.4;
          const k = eInOut(range(t, H.map - 0.1, H.map + 0.8));
          return <circle key={i} cx={lerp(bx, mx, k)} cy={lerp(by, my, k)} r={lerp(5, 3.2, k)} fill={TOYS[i % 4]} opacity={0.95} />;
        })}
        {/* the first ducks reach Alaska */}
        {t > H.arrive - 0.2 && (() => { const [x, y] = proj(v, SITKA[0], SITKA[1]); const k = eOut(range(t, H.arrive, H.arrive + 0.5));
          return <g opacity={k}><circle cx={x} cy={y} r={14 + 30 * k} fill="none" stroke={DUCK} strokeWidth={3} opacity={1 - k * 0.6} /><circle cx={x} cy={y} r={7} fill={DUCK} /></g>; })()}
      </Svg>
      {/* the question, with the subject named in frame 1 */}
      <Layer o={1 - eIn(range(t, H.drop - 0.25, H.drop + 0.1))}>
        <div style={{ position: "absolute", right: 96, top: 70, width: 150, height: 300, background: "#F3EAD3", border: "4px double #3B2F22", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(40,30,20,0.25)", opacity: eOut(range(t, 0, 0.25)), transform: `scale(${lerp(1.25, 1, eOut(range(t, 0, 0.25)))})` }}>
          <div style={{ writingMode: "vertical-rl", fontFamily: BRUSH, fontSize: 112, color: "#7A1F14", lineHeight: 1 }}>洋流</div>
        </div>
        <Say t={t} at={0.15} out={H.drop + 0.1} text="掉进海里的东西，" x={1660} y={110} size={78} anchor="right" color={INK} weight={900} stagger={0.03} blur={0} />
        <Say t={t} at={0.55} out={H.drop + 0.1} text="会漂到哪？" x={1660} y={210} size={110} anchor="right" color="#7A1F14" weight={900} stagger={0.05} blur={0} />
      </Layer>
      {/* the count */}
      <Layer o={fade(t, H.burst, H.map + 0.25, 0.2, 0.3)}>
        <div style={{ position: "absolute", right: 110, top: 120, textAlign: "right" }}>
          <div style={{ fontFamily: BLACK, fontSize: 170, color: INK, lineHeight: 1, letterSpacing: -4 }}>{Math.round(28800 * eOut(range(t, H.burst, H.burst + 0.9))).toLocaleString("en-US")}</div>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 46, color: "#7A1F14", marginTop: 12 }}>只浴盆玩具，掉进太平洋</div>
          <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 26, color: SEPIA, marginTop: 10, letterSpacing: 2 }}>1992年1月 · 一个集装箱在风暴中落海</div>
        </div>
      </Layer>
      {/* on the map */}
      <Say t={t} at={H.map + 0.35} out={H.out + 0.2} text="10个月后，" x={130} y={700} size={60} color={HPAPER} weight={600} />
      <Say t={t} at={H.map + 0.65} out={H.out + 0.2} text="漂到3200公里外的阿拉斯加" x={130} y={782} size={76} color={DUCK} weight={900} />
      <Note t={t} at={H.map + 0.5} out={H.out} text="1992.01.10 落海  →  1992.11.16 锡特卡上岸" x={132} y={900} size={26} color="rgba(232,220,192,0.75)" />
      <Credit t={t} at={0} out={H.map - 0.1} text="葛饰北斋《神奈川冲浪里》约1831 · 大都会艺术博物馆" color="rgba(40,30,20,0.6)" />
    </Layer>
  );
};
// spread of the dots shrinks as the camera zooms in (keeps them a stream, not a cloud)
const zinK = (t: number) => 1 - 0.5 * eIn(range(t, H.out - 0.5, H.out + 0.4));

// the title over NASA's Perpetual Ocean (the Gulf Stream)
export const Title: React.FC<{ t: number }> = ({ t }) => {
  if (t < TI.t - 0.6 || t >= F.t + 0.6) return null;
  const o = Math.min(eOut(range(t, TI.t - 0.6, TI.t + 0.2)), 1 - eInOut(range(t, F.t - 0.3, F.t + 0.5)));
  const zoom = lerp(1.18, 1.0, eOut(range(t, TI.t - 0.6, TI.t + 1.6)));
  return (
    <Layer o={o}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})` }}>
        <Sequence from={Math.round((TI.t - 0.6) * 30)} layout="none">
          <OffthreadVideo src={staticFile("media/oc_po_gulf.mp4")} muted style={{ width: 1920, height: 1080, filter: "saturate(1.1) contrast(1.05)" }} />
        </Sequence>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 28% 40%, rgba(5,15,30,0.55) 0%, rgba(5,15,30,0) 55%)" }} />
      <Say t={t} at={TI.title} out={F.t + 0.2} text="洋流" x={150} y={250} size={250} weight={900} stagger={0.12} shadow="0 6px 40px rgba(0,10,30,0.6)" tracking={20} />
      <Say t={t} at={TI.sub} out={F.t + 0.2} text="海里的河" x={160} y={580} size={78} weight={600} color={DUCK} stagger={0.08} shadow="0 4px 24px rgba(0,10,30,0.7)" tracking={12} />
      <Credit t={t} at={TI.t} out={F.t} text="NASA/GSFC 科学可视化工作室《永恒的海洋》· ECCO2 海流模型 2005–2007" />
    </Layer>
  );
};

// ---------- Franklin's chart of the Gulf Stream (1786 print) ----------
const FW = 1920, FH = 1564;
const STREAM_PTS = [[509, 1498], [557, 1325], [672, 1190], [826, 1075], [1018, 970], [1229, 883], [1459, 845], [1670, 864], [1843, 922]];
const MERCHANT = [[1990, 690], [1700, 700], [1450, 740], [1180, 800], [960, 862]];
const PACKET = [[1990, 980], [1750, 905], [1500, 860], [1280, 880], [1080, 950], [830, 905]];
const chartAt = (t: number) => { const k = eInOut(range(t, F.t, F.out)); return { fx: lerp(0.62, 0.55, k), fy: lerp(0.6, 0.62, k), s: lerp(1.08, 1.2, k) }; };
const smoothPx = (P: number[][]) => {
  let d = `M${P[0][0]},${P[0][1]}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    d += `C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
};
const alongPx = (P: number[][], k: number): [number, number] => {
  const seg = P.slice(1).map((p, i) => Math.hypot(p[0] - P[i][0], p[1] - P[i][1])); let s = Math.max(0, Math.min(1, k)) * seg.reduce((a, b) => a + b, 0);
  for (let i = 0; i < seg.length; i++) { if (s <= seg[i] || i === seg.length - 1) { const u = s / seg[i]; return [lerp(P[i][0], P[i + 1][0], u), lerp(P[i][1], P[i + 1][1], u)]; } s -= seg[i]; }
  return [P[0][0], P[0][1]];
};
// a chart glyph of a ship under sail
const Ship: React.FC<{ x: number; y: number; c: string; s?: number; flip?: boolean }> = ({ x, y, c, s = 1, flip }) => (
  <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
    <path d="M -26,4 L 26,4 L 18,16 L -20,16 Z" fill={c} />
    <path d="M -2,2 L -2,-40 L -22,0 Z M 3,2 L 3,-46 L 24,0 Z" fill={c} opacity={0.85} />
    <line x1={0} y1={4} x2={0} y2={-48} stroke={c} strokeWidth={2.5} />
  </g>
);
const Panel: React.FC<React.PropsWithChildren<{ o: number; x: number; y: number; w: number; h: number }>> = ({ o, x, y, w, h, children }) => (o <= 0.001 ? null :
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: "rgba(243,236,220,0.94)", border: "3px double #4A3A28", boxShadow: "0 6px 30px rgba(40,30,20,0.35)", opacity: o }}>{children}</div>);

export const Franklin: React.FC<{ t: number }> = ({ t }) => {
  if (t < F.t - 0.6 || t >= HO.t + 0.6) return null;
  const o = Math.min(eOut(range(t, F.t - 0.6, F.t + 0.3)), 1 - eInOut(range(t, HO.t - 0.3, HO.t + 0.5)));
  const c = chartAt(t);
  const P = (p: number[]) => artPt(FW, FH, c.fx, c.fy, c.s, p[0], p[1]);
  const sp = STREAM_PTS.map(P), mp = MERCHANT.map(P), pp = PACKET.map(P);
  const mk = eInOut(range(t, F.race, F.race + 2.2));
  const pk = 0.48 * eInOut(range(t, F.race, F.l3 + 0.4)) - 0.03 * Math.max(0, Math.sin((t - F.race) * 2.4)) * (t < F.l3 + 0.4 ? 1 : 0);
  const [mx, my] = alongPx(mp, mk), [px2, py2] = alongPx(pp, pk);
  const paint = eInOut(range(t, F.paint, F.paint + 2.0));
  const len = 2200;
  return (
    <Layer o={o}>
      <Art src="oc_franklin.jpg" t={t} a={F.t} b={F.out} from={[0.62, 0.6, 1.08]} to={[0.55, 0.62, 1.2]} filter="sepia(0.6) contrast(1.08) brightness(0.97)" />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(60,40,20,0.35) 100%)" }} />
      <Svg>
        {/* the stream that Folger described: painted on as the whalers knew it */}
        <Stream d={smoothPx(sp)} k={paint} len={len} t={t} w={14} color={AMBER} speed={-200} comets={7} />
        {/* the race */}
        {t > F.race - 0.2 && <g opacity={fade(t, F.race - 0.2, F.l3 + 2.0, 0.3, 0.6)}>
          <path d={smoothPx(mp)} fill="none" stroke="#2E5E8C" strokeWidth={3} strokeDasharray="6 9" opacity={0.7} />
          <path d={smoothPx(pp)} fill="none" stroke={RED} strokeWidth={3} strokeDasharray="6 9" opacity={0.7} />
          <Ship x={mx} y={my} c="#1F4E79" s={1.1} flip />
          <Ship x={px2} y={py2} c={RED} s={1.1} flip />
          <text x={mx} y={my - 62} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={30} fill="#1F4E79">商船</text>
          <text x={px2} y={py2 - 62} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={30} fill={RED}>邮船</text>
          {mk >= 1 && <text x={mx} y={my + 52} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={26} fill="#1F4E79" opacity={eOut(range(t, F.race + 2.2, F.race + 2.6))}>先到了</text>}
          {/* the current pushing back on the packet */}
          {t > F.race + 0.8 && t < F.l3 + 1.6 && [0, 1, 2].map((i) => { const ph = ((t * 1.4 + i / 3) % 1); const [ax, ay] = alongPx(pp, pk + 0.04 + ph * 0.06);
            return <path key={i} d={`M ${ax - 18},${ay + 8} l 26,-6 l -6,-8 M ${ax + 8},${ay + 2} l -6,10`} stroke={AMBER} strokeWidth={4} fill="none" opacity={(1 - ph) * 0.9} strokeLinecap="round" />; })}
        </g>}
      </Svg>
      <Panel o={fade(t, F.l1 - 0.1, F.l3 - 0.1, 0.3, 0.3)} x={80} y={60} w={900} h={262}>
        <Say t={t} at={F.l1} out={F.l3} text="1768年，富兰克林遇到一件怪事：" x={44} y={30} size={44} color={INK} weight={900} blur={0} stagger={0.03} />
        <Say t={t} at={F.l2} out={F.l3} text="英国邮船横渡大西洋，" x={44} y={102} size={52} color={INK} weight={600} blur={0} />
        <Say t={t} at={F.l2 + 0.5} out={F.l3} text="总比商船慢两个星期。" x={44} y={172} size={52} color={RED} weight={900} blur={0} />
      </Panel>
      <Panel o={fade(t, F.l3 - 0.1, F.out + 0.2, 0.3, 0.3)} x={80} y={60} w={900} h={t < F.l4 ? 196 : 126}>
        <Say t={t} at={F.l3} out={F.l4} text="捕鲸的表亲告诉他：" x={44} y={30} size={44} color={INK} weight={600} blur={0} />
        <Say t={t} at={F.l3 + 0.5} out={F.l4} text="“你们一直在逆着一条河开。”" x={44} y={100} size={56} color="#8A5410" weight={900} blur={0} />
        <Say t={t} at={F.l4} out={F.out + 0.2} text="于是他把这条河，画成了地图。" x={44} y={30} size={52} color={INK} weight={900} blur={0} />
      </Panel>
      {t > F.note && <div style={{ position: "absolute", left: 1240, top: 120, padding: "10px 26px", border: `5px solid ${RED}`, color: RED, fontFamily: SERIF, fontWeight: 900, fontSize: 46,
        transform: `rotate(-7deg) scale(${lerp(1.6, 1, eOut(range(t, F.note, F.note + 0.22)))})`, opacity: eOut(range(t, F.note, F.note + 0.15)) * (1 - eIn(range(t, F.out - 0.2, F.out + 0.2))), background: "rgba(243,236,220,0.7)" }}>船长们：不信。</div>}
      <Credit t={t} at={F.t + 0.3} out={F.out} text="富兰克林与福尔杰《湾流图》1786年版 · 美国国会图书馆" color="rgba(50,35,20,0.75)" />
    </Layer>
  );
};

// Homer's Gulf Stream: how big is this river?
export const Homer: React.FC<{ t: number }> = ({ t }) => {
  if (t < HO.t - 0.6 || t >= HO.out + 0.6) return null;
  const o = Math.min(eOut(range(t, HO.t - 0.6, HO.t + 0.3)), 1 - eInOut(range(t, HO.out - 0.2, HO.out + 0.5)));
  return (
    <Layer o={o}>
      <Art src="oc_homer.jpg" t={t} a={HO.t - 0.6} b={HO.out + 0.6} from={[0.42, 0.55, 1.35]} to={[0.45, 0.5, 1.05]} filter="saturate(1.1) contrast(1.05)" />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,20,30,0.55) 0%, rgba(5,20,30,0) 40%)" }} />
      <Say t={t} at={HO.l1} out={HO.out + 0.3} text="这条河，有多大？" x={110} y={90} size={96} weight={900} stagger={0.06} shadow="0 4px 30px rgba(0,0,0,0.6)" />
      <Credit t={t} at={HO.t} out={HO.out} text="温斯洛·霍默《墨西哥湾流》1899 · 大都会艺术博物馆" />
    </Layer>
  );
};
export { PAPER, FOAM, DUCK };
