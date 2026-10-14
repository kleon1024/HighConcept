// Act III: the ducks' map (Hokusai's blue again: the Kuroshio leads into the duck route, Sitka, the model that
// predicted the next landfall), the other face of the gyre (the garbage patch), and the slow river in the deep
// (Haeckel's creatures; the conveyor belt on a night map, with a dynasty clock for the thousand-year loop).
import React from "react";
import { Img, staticFile } from "remotion";
import { AMBER, BLACK, Credit, DUCK, Duck, FOAM, Land, Layer, Note, OJ, SANS, SERIF, STREAM, Say, Specks, Stream, Svg, View, along, eIn, eInOut, eOut, fade, lerp, lerpView, proj, range, rnd, smoothOf } from "./kit";
import { DUCK_ROUTE, HPAPER, PRUSSIAN, SITKA, SPILL } from "./O1";

const D = OJ.ducks, P = OJ.plastic, DP = OJ.deep;

const KURO_PATH = [[121.8, 22], [122.6, 24.5], [124.5, 26.5], [127.5, 28.8], [131, 31], [135, 33.3], [139.5, 35], [142.5, 35.8], [148, 36.4], [155, 37.6], [165, 39.6], [175, 42], [178.1, 44.7]];
const MODEL_LOOP = [SITKA, [214, 59.4], [203, 57.6], [192, 54.2], [180, 52.4], [168, 53.2], [161, 49.5], [154, 45], [150, 41], [156, 38.6], [166, 40.2], [178, 43.6]];
const TO_WA = [[205, 51.2], [214, 50.2], [224, 49], [232, 48], [235.6, 47.3]];
const V_KURO: View = { lon: 152, lat: 37, z: 15, kx: 0.8 };
const V_DUCK: View = { lon: 196, lat: 48, z: 21, kx: 0.7 };
const V_PATCH: View = { lon: 220, lat: 33, z: 25, kx: 0.84 };
const PATCH = { lon: 220, lat: 32, rx: 8.5, ry: 5.7 };   // ≈ 1.6 million km² (Lebreton et al. 2018)
const POP = ["#FF4FA3", "#2EC4F1", "#FFD23F", "#7BE04A", "#FF7A2F", "#B07CFF", "#FFFFFF"];

const viewAt = (t: number): View => {
  if (t < D.t + 1.6) return lerpView(V_KURO, V_DUCK, eInOut(range(t, D.t, D.t + 1.6)));
  if (t < P.t) return V_DUCK;
  return lerpView(V_DUCK, V_PATCH, eInOut(range(t, P.t - 0.2, P.t + 1.2)));
};
const Pin: React.FC<{ x: number; y: number; k: number; c: string; label: string; sub?: string; side?: "left" | "right" }> = ({ x, y, k, c, label, sub, side = "right" }) => {
  if (k <= 0) return null;
  const dx = side === "right" ? 26 : -26, a = side === "right" ? "start" : "end";
  return <g opacity={Math.min(1, k * 1.5)}>
    <circle cx={x} cy={y} r={10 + 26 * (1 - k)} fill="none" stroke={c} strokeWidth={3} opacity={1 - k * 0.5} />
    <circle cx={x} cy={y} r={9} fill={c} stroke={PRUSSIAN} strokeWidth={3} />
    <text x={x + dx} y={y - 8} textAnchor={a} fontFamily={SANS} fontWeight={700} fontSize={30} fill={c} stroke={PRUSSIAN} strokeWidth={7} paintOrder="stroke" strokeLinejoin="round">{label}</text>
    {sub && <text x={x + dx} y={y + 28} textAnchor={a} fontFamily={SANS} fontWeight={500} fontSize={22} fill="#F4ECD8" stroke={PRUSSIAN} strokeWidth={6} paintOrder="stroke" strokeLinejoin="round">{sub}</text>}
  </g>;
};

export const Ducks: React.FC<{ t: number }> = ({ t }) => {
  if (t < D.t - 0.6 || t >= P.out + 0.6) return null;
  const o = eOut(range(t, D.t - 0.6, D.t + 0.2));
  const v = viewAt(t);
  const darken = eInOut(range(t, P.sink - 0.2, P.out + 0.4));
  // the duck rides from the spill to Sitka
  const dk = eInOut(range(t, D.l1 + 0.6, D.sitka));
  const [dx, dy, da] = along(v, DUCK_ROUTE, dk);
  const date = (() => { const m = Math.floor(lerp(1, 11.5, dk)); return dk >= 1 ? "1992.11.16" : `1992.${String(m).padStart(2, "0")}`; })();
  const model = eInOut(range(t, D.model + 0.2, D.model + 1.8)), wa = eInOut(range(t, D.wa, D.wa + 0.9));
  const pl = range(t, P.t, P.out);
  const [pcx, pcy] = proj(v, PATCH.lon, PATCH.lat), prx = PATCH.rx * v.z * (v.kx ?? 1), pry = PATCH.ry * v.z;
  return (
    <Layer o={o * (1 - eIn(range(t, P.out - 0.1, P.out + 0.5)))} style={{ background: PRUSSIAN }}>
      <Svg>
        {/* faint swell lines in the Hokusai blue */}
        {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M -20,${70 + i * 66} ${Array.from({ length: 21 }, (_, j) => `Q ${j * 100 - 50 + ((t * 20 + i * 37) % 100)},${70 + i * 66 - 10} ${j * 100 + ((t * 20 + i * 37) % 100)},${70 + i * 66}`).join(" ")}`}
          fill="none" stroke="rgba(232,220,192,0.06)" strokeWidth={2} />)}
        <Land v={v} fill={HPAPER} stroke="#3A3226" sw={1.4} />
        {/* the Kuroshio carries on east: the same river the toys rode */}
        <Stream d={smoothOf(v, KURO_PATH)} len={2600} t={t} w={8} color={STREAM} k={eInOut(range(t, D.t - 0.4, D.t + 1.0))} o={1 - eIn(range(t, P.t, P.t + 0.6))} speed={240} />
        <Stream d={smoothOf(v, DUCK_ROUTE)} len={1800} t={t} w={8} color={DUCK} k={dk} o={1 - eIn(range(t, P.t, P.t + 0.6))} speed={200} comets={5} />
        {/* the model's forecast: the toys circle the Alaska gyre and some head for Washington */}
        {model > 0 && <g opacity={1 - eIn(range(t, P.t, P.t + 0.6))}>
          <path d={smoothOf(v, MODEL_LOOP)} fill="none" stroke={AMBER} strokeWidth={4} pathLength={1000} strokeDasharray={`${1000 * model} 1000`} />
          <path d={smoothOf(v, TO_WA)} fill="none" stroke={AMBER} strokeWidth={4} strokeDasharray={`${1000 * wa} 1000`} pathLength={1000} />
          {/* a model grid behind it */}
          <g opacity={0.25 * model}>{Array.from({ length: 13 * 7 }, (_, i) => { const lo = 160 + (i % 13) * 6, la = 38 + Math.floor(i / 13) * 4; const [x, y] = proj(v, lo, la);
            return <circle key={i} cx={x} cy={y} r={2.2} fill={AMBER} />; })}</g>
        </g>}
        <Pin {...pinAt(v, SPILL)} k={eOut(range(t, D.l1, D.l1 + 0.5)) * (1 - eIn(range(t, P.t, P.t + 0.5)))} c="#FF8A65" label="落海点" sub="1992.01.10" side="left" />
        <Pin {...pinAt(v, SITKA)} k={eOut(range(t, D.sitka, D.sitka + 0.5)) * (1 - eIn(range(t, P.t, P.t + 0.5)))} c={DUCK} label="锡特卡，阿拉斯加" sub="1992.11.16 · 第一批上岸" side="left" />
        <Pin {...pinAt(v, [235.6, 47.3])} k={wa >= 1 ? eOut(range(t, D.wa + 0.9, D.wa + 1.3)) * (1 - eIn(range(t, P.t, P.t + 0.5))) : 0} c="#9BE38A" label="华盛顿州 ✓" sub="1996 · 预测命中" side="right" />
        {t < P.t + 0.4 && <Duck x={dx} y={dy + 6} s={lerp(70, 54, dk)} rot={Math.sin(t * 2.6) * 8 + (da * 180) / Math.PI * 0.15} o={1 - eIn(range(t, P.t, P.t + 0.4))} glow={0.6} />}
        {/* the garbage patch: the same gyre gathers what we throw away */}
        {pl > 0 && Array.from({ length: 360 }, (_, i) => {
          const r0 = 1.3 + rnd(i) * 1.6, th0 = rnd(i + 3) * Math.PI * 2, gather = eInOut(range(t, P.t + rnd(i + 5) * 0.8, P.area + 0.6 + rnd(i + 6) * 0.8));
          const r = lerp(r0, 0.08 + 0.92 * Math.sqrt(rnd(i + 8)), gather), th = th0 + (t - P.t) * (0.5 + 0.9 / (r + 0.3));
          const x = pcx + Math.cos(th) * prx * r, y0 = pcy + Math.sin(th) * pry * r;
          const sink = eIn(range(t, P.sink + rnd(i + 9) * 0.5, P.out + 0.4)), y = y0 + sink * (500 + 500 * rnd(i + 10));
          const sz = 5 + 9 * rnd(i + 11), c = POP[i % POP.length], sh = i % 3, rot = (t * 60 * (rnd(i + 12) - 0.5) + rnd(i + 13) * 360);
          const op = eOut(range(t, P.t + rnd(i + 5) * 0.6, P.t + 0.5 + rnd(i + 5) * 0.6)) * (1 - sink * 0.85);
          return <g key={i} transform={`translate(${x},${y}) rotate(${rot})`} opacity={op}>
            {sh === 0 ? <rect x={-sz / 2} y={-sz / 3} width={sz} height={sz * 0.66} fill={c} /> : sh === 1 ? <path d={`M 0,${-sz / 1.6} L ${sz / 1.8},${sz / 2.4} L ${-sz / 1.8},${sz / 2.4} Z`} fill={c} /> : <circle r={sz / 2.2} fill={c} />}
          </g>;
        })}
        {t > P.area && <ellipse cx={pcx} cy={pcy} rx={prx} ry={pry} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeDasharray="8 10" opacity={eOut(range(t, P.area, P.area + 0.5)) * (1 - eIn(range(t, P.sink, P.sink + 0.4)))} />}
        {pl > 0 && <g opacity={eOut(range(t, P.t + 0.4, P.t + 1.0)) * (1 - eIn(range(t, P.sink, P.sink + 0.4)))}>
          {[[204.5, 20.6, "夏威夷"], [240.5, 36.5, "加利福尼亚"]].map(([lo, la, n]) => { const [x, y] = proj(v, lo as number, la as number);
            return <g key={n as string}><circle cx={x} cy={y} r={6} fill={HPAPER} /><text x={x + 14} y={y + 8} fontFamily={SANS} fontWeight={700} fontSize={24} fill={HPAPER}>{n}</text></g>; })}
        </g>}
      </Svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 300, background: `linear-gradient(180deg, ${PRUSSIAN}F2 0%, ${PRUSSIAN}CC 45%, ${PRUSSIAN}00 100%)` }} />
      <div style={{ position: "absolute", inset: 0, background: "#02060C", opacity: darken }} />
      {/* type */}
      <Say t={t} at={D.l1} out={D.sitka} text="黑潮一路向东——正是鸭子们走的路" x={110} y={90} size={56} color={HPAPER} weight={900} />
      <div style={{ position: "absolute", right: 110, top: 96, fontFamily: BLACK, fontSize: 64, color: DUCK, opacity: fade(t, D.l1 + 0.4, D.model, 0.3, 0.3), fontVariantNumeric: "tabular-nums" }}>{date}</div>
      <Say t={t} at={D.l2} out={D.model} text="10个月，3200公里，第一批上岸" x={110} y={90} size={56} color={DUCK} weight={900} />
      <Say t={t} at={D.model} out={D.wa} text="海洋学家拿它们，校准洋流模型" x={110} y={90} size={56} color={HPAPER} weight={900} />
      <Note t={t} at={D.model + 0.4} out={P.t} text="Curtis Ebbesmeyer & James Ingraham · OSCURS 洋流模型" x={112} y={172} size={24} color="rgba(232,220,192,0.7)" />
      <Say t={t} at={D.wa} out={P.t} text="预测下一批的落点——猜中了" x={110} y={90} size={56} color="#9BE38A" weight={900} />
      <Say t={t} at={P.l1} out={P.area} text="可同一个环流，也把垃圾聚到一起" x={110} y={90} size={56} color={FOAM} weight={900} />
      <Layer o={fade(t, P.area, P.sink + 0.3, 0.25, 0.4)}>
        <div style={{ position: "absolute", left: 110, top: 70 }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, color: FOAM }}>太平洋垃圾带</div>
          <div style={{ fontFamily: BLACK, fontSize: 120, color: "#FF4FA3", lineHeight: 1.1 }}>160万 km²</div>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 52, color: FOAM, opacity: eOut(range(t, P.area + 0.5, P.area + 0.8)) }}>≈ 一个新疆</div>
        </div>
        <div style={{ position: "absolute", right: 110, top: 760, textAlign: "right", opacity: eOut(range(t, P.pieces, P.pieces + 0.3)) }}>
          <div style={{ fontFamily: BLACK, fontSize: 110, color: "#2EC4F1", lineHeight: 1 }}>1.8万亿</div>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: FOAM, marginTop: 8 }}>块塑料</div>
        </div>
        <Note t={t} at={P.area} out={P.out} text="Lebreton et al. 2018, Scientific Reports" x={112} y={1020} size={18} color="rgba(234,244,247,0.55)" />
      </Layer>
    </Layer>
  );
};
const pinAt = (v: View, p: number[]) => { const [x, y] = proj(v, p[0], p[1]); return { x, y }; };

// ---------- the deep ----------
const NIGHT: View = { lon: 75, lat: 2, z: 5, kx: 1 };
const DEEP_PATH = [[-35, 62], [-42, 52], [-48, 40], [-42, 20], [-33, 0], [-28, -20], [-15, -42], [10, -52], [45, -55], [80, -55], [115, -54], [150, -58], [175, -55], [190, -45], [186, -25], [181, 0], [179, 20], [185, 38], [195, 46]];
const SURF_PATH = [[195, 46], [176, 30], [158, 18], [136, 8], [122, 0], [114, -9], [98, -13], [80, -15], [60, -22], [40, -32], [20, -36], [5, -25], [-10, -8], [-30, 5], [-55, 16], [-76, 26], [-74, 35], [-58, 42], [-40, 50], [-28, 58], [-35, 62]];
const yearAt = (k: number) => Math.round(1026 + 1000 * k);
const dynasty = (y: number) => (y >= 2026 ? "今天" : y >= 1912 ? "近现代" : y >= 1644 ? "清" : y >= 1368 ? "明" : y >= 1279 ? "元" : y >= 1127 ? "南宋" : "北宋");
const Cut: React.FC<{ src: string; x: number; y: number; w: number; o?: number; rot?: number; filter?: string }> = ({ src, x, y, w, o = 1, rot = 0, filter }) => (o <= 0.001 ? null :
  <Img src={staticFile(`media/${src}`)} style={{ position: "absolute", left: x - w / 2, top: y - w * 0.7, width: w, opacity: o, transform: `rotate(${rot}deg)`, filter }} />);

export const Deep: React.FC<{ t: number }> = ({ t }) => {
  if (t < DP.t - 0.4 || t >= DP.out + 0.8) return null;
  const o = Math.min(eOut(range(t, DP.t - 0.4, DP.t + 0.3)), 1 - eInOut(range(t, DP.out - 0.2, DP.out + 0.6)));
  const dive = eInOut(range(t, DP.t, DP.sink));                       // descending: blue light fades to black
  const mapK = eInOut(range(t, DP.sink - 0.4, DP.sink + 0.6));
  const k = range(t, DP.loop, DP.loop + 4.8), year = yearAt(k);
  const [hx, hy] = along(NIGHT, DEEP_PATH, k);
  const sinkPulse = range(t, DP.sink + 0.2, DP.sink + 1.4);
  const [gx, gy] = proj(NIGHT, -35, 62);
  return (
    <Layer o={o} style={{ background: "#02060C" }}>
      {/* the descent */}
      <Layer o={1 - mapK}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(20,70,110,${0.9 * (1 - dive)}) 0%, rgba(5,20,40,${0.7 * (1 - dive * 0.7)}) 45%, rgba(2,6,12,1) 100%)` }} />
        {/* shafts of light from the surface, fading as we sink */}
        <Svg>{[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${300 + i * 330 + Math.sin(t + i) * 30},-20 L ${200 + i * 360},1100 L ${280 + i * 360},1100 Z`} fill="rgba(180,230,255,0.06)" opacity={1 - dive} />)}</Svg>
        <Cut src="oc_jelly_cut.png" x={1420} y={lerp(860, 420, range(t, DP.t, DP.sink + 0.4))} w={760 * (1 + 0.025 * Math.sin(t * 2.2))} rot={-6 + Math.sin(t * 0.8) * 3} o={0.95} filter="saturate(1.05)" />
        <Cut src="oc_radio_cut.png" x={420} y={lerp(1000, 560, range(t, DP.t, DP.sink + 0.4))} w={560} rot={8} o={0.8} />
        <Specks t={t} n={90} color="#DDEEFF" o={0.8} seed={3} rise={-18} />
        <Say t={t} at={DP.l1} out={DP.sink + 0.2} text="海面之下，" x={110} y={110} size={60} weight={600} />
        <Say t={t} at={DP.l1 + 0.5} out={DP.sink + 0.2} text="还有一条更慢的河。" x={110} y={195} size={84} weight={900} color={STREAM} />
        <Credit t={t} at={DP.t} out={DP.sink} text="恩斯特·海克尔《自然界的艺术形态》1904" />
      </Layer>
      {/* the conveyor belt on a night map */}
      <Layer o={mapK}>
        <Svg>
          <Land v={NIGHT} fill="#16222E" stroke="#2A3B4C" sw={1} />
          <Stream d={smoothOf(NIGHT, SURF_PATH)} len={6000} t={t} w={5} color="#F2783D" o={0.45} speed={120} comets={12} glow={false} />
          <Stream d={smoothOf(NIGHT, DEEP_PATH)} k={Math.max(0.0001, k)} len={6000} t={t} w={8} color="#5FA8FF" speed={140} comets={10} />
          {/* Greenland: cold, salty water sinks */}
          {sinkPulse > 0 && <g opacity={1 - eIn(range(t, DP.loop + 1, DP.loop + 2))}>
            {[0, 1, 2].map((i) => { const u = (sinkPulse * 1.6 + i / 3) % 1; return <circle key={i} cx={gx} cy={gy + u * 40} r={10 + u * 40} fill="none" stroke="#9FD0FF" strokeWidth={3} opacity={1 - u} />; })}
            <path d={`M ${gx},${gy - 30} l 0,${70} m -14,-16 l 14,16 l 14,-16`} stroke="#9FD0FF" strokeWidth={5} fill="none" />
          </g>}
          {k > 0 && <g><circle cx={hx} cy={hy} r={26} fill="#5FA8FF" opacity={0.25} /><circle cx={hx} cy={hy} r={10} fill="#E6F3FF" /></g>}
          {k >= 1 && <circle cx={hx} cy={hy} r={20 + 60 * eOut(range(t, DP.loop + 4.8, DP.loop + 5.4))} fill="none" stroke={DUCK} strokeWidth={4} opacity={1 - eOut(range(t, DP.loop + 4.8, DP.loop + 5.6))} />}
        </Svg>
        <Say t={t} at={DP.sink + 0.2} out={DP.loop + 0.2} text="格陵兰外海：又冷又咸的水，沉入海底" x={110} y={90} size={52} weight={900} />
        <Say t={t} at={DP.l3} out={DP.out + 0.2} text="走完一圈，大约一千年。" x={110} y={90} size={64} weight={900} color="#9FD0FF" />
        {/* the dynasty clock */}
        <div style={{ position: "absolute", right: 110, top: 80, textAlign: "right", opacity: fade(t, DP.loop - 0.1, DP.out + 0.3, 0.3, 0.4) }}>
          <div style={{ fontFamily: BLACK, fontSize: 120, color: k >= 1 ? DUCK : "#E6F3FF", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{year}</div>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: k >= 1 ? DUCK : "#9FD0FF", marginTop: 6 }}>{dynasty(year)}</div>
        </div>
        <Note t={t} at={DP.loop} out={DP.out} text="NOAA：一团海水走完全球传送带约需1000年 · 路线为示意" x={112} y={1020} size={18} color="rgba(234,244,247,0.55)" />
      </Layer>
    </Layer>
  );
};
