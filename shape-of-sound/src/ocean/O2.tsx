// Act II: how big (a Swiss poster: one river of all rivers against the ocean's rivers), why it flows (the Bauhaus:
// wind, the spinning Earth, Ekman's spiral, the hill of water, five gyres) and the nearest one to us (the Kuroshio).
import React from "react";
import { OffthreadVideo, Sequence, staticFile } from "remotion";
import { BLACK, BRUSH, Credit, DUCK, GEO, Land, Layer, Note, OJ, SANS, STREAM, Say, Svg, View, backOut, eIn, eInOut, eOut, fade, lerp, lerpView, proj, range } from "./kit";

const S = OJ.scale, W = OJ.why, K = OJ.kuro;
const COBALT = "#0F2E86", SRED = "#E8402A", CREAM = "#EDE4D0", BRED = "#D7301F", BYEL = "#F2B701", BBLUE = "#1F4E9C", BK = "#141414";

// ---------- Swiss: the bars (5 px per million m³/s) ----------
const BARS = [
  { at: S.rivers, sv: 1.2, name: "全世界所有河流", num: "120万", x: 980 },
  { at: S.gulf, sv: 30, name: "墨西哥湾流", num: "3000万", x: 1210, mult: "×25" },
  { at: S.newf, sv: 150, name: "到纽芬兰外海", num: "1.5亿", x: 1440, mult: "×125" },
  { at: S.acc, sv: 173, name: "南极绕极流", num: "1.73亿", x: 1670, mult: "×144" },
];
const BASE = 980, U = 5, BW = 180;
export const Scale: React.FC<{ t: number }> = ({ t }) => {
  if (t < S.t - 0.5 || t >= S.out + 0.8) return null;
  const o = eOut(range(t, S.t - 0.5, S.t + 0.1));
  const cur = BARS.filter((b) => t >= b.at).pop();
  const morph = eInOut(range(t, S.out - 0.4, S.out + 0.5));         // the tallest bar becomes the globe of the next act
  const bg = morph > 0 ? `color-mix(in srgb, ${COBALT} ${100 - morph * 100}%, ${CREAM})` : COBALT;
  return (
    <Layer o={o} style={{ background: bg }}>
      <Svg>
        {/* the Swiss grid */}
        <g opacity={0.18 * (1 - morph)} stroke="#FFFFFF" strokeWidth={1}>{[120, 600, 940].map((x) => <line key={x} x1={x} y1={60} x2={x} y2={1020} />)}{[160, 520, BASE].map((y) => <line key={y} x1={60} y1={y} x2={1860} y2={y} />)}</g>
        {BARS.map((b, i) => {
          const g = backOut(range(t, b.at, b.at + 0.7), 1.2), h = Math.max(3, b.sv * U * g), last = i === BARS.length - 1;
          if (t < b.at) return null;
          if (last && morph > 0) {
            // morph: bar → circle (Bauhaus globe at 960, 560, r 330)
            const x = lerp(b.x, 960 - 330, morph), y = lerp(BASE - h, 560 - 330, morph), w = lerp(BW, 660, morph), hh = lerp(h, 660, morph), rx = lerp(0, 330, morph);
            return <g key={i}><clipPath id="accClip"><rect x={x} y={y} width={w} height={hh} rx={rx} /></clipPath>
              <rect x={x} y={y} width={w} height={hh} rx={rx} fill={`color-mix(in srgb, ${SRED} ${100 - morph * 100}%, ${BBLUE})`} /></g>;
          }
          return <g key={i} opacity={1 - morph}>
            <rect x={b.x} y={BASE - h} width={BW} height={h} fill={last ? SRED : "#FFFFFF"} />
            {last && <rect x={b.x - 4} y={BASE - h - 4} width={BW + 8} height={h + 8} fill="none" stroke={SRED} strokeWidth={8} />}
            <text x={b.x} y={BASE + 40} fontFamily={SANS} fontWeight={700} fontSize={24} fill="#FFFFFF">{b.name}</text>
            {b.mult && <text x={b.x + BW / 2} y={BASE - h - 22} textAnchor="middle" fontFamily={BLACK} fontSize={44} fill={last ? "#FFFFFF" : DUCK} opacity={eOut(range(t, b.at + 0.4, b.at + 0.8))}>{b.mult}</text>}
          </g>;
        })}
      </Svg>
      {/* the Antarctic Circumpolar Current, seen through its own bar */}
      {t >= S.acc && <div style={{ position: "absolute", inset: 0, clipPath: morph > 0 ? "url(#accClip)" : `inset(${BASE - 173 * U * backOut(range(t, S.acc, S.acc + 0.7), 1.2)}px ${1920 - 1670 - BW}px ${1080 - BASE}px 1670px)`, opacity: 1 - morph }}>
        <Sequence from={Math.round(S.acc * 30)} layout="none">
          <OffthreadVideo src={staticFile("media/oc_po_acc.mp4")} muted style={{ width: 1920, height: 1080 }} />
        </Sequence>
      </div>}
      {/* the left column: the current number */}
      <Layer o={1 - morph}>
        {cur && <div key={cur.name} style={{ position: "absolute", left: 120, top: 190, opacity: eOut(range(t, cur.at, cur.at + 0.25)) }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: "#FFFFFF", letterSpacing: 2 }}>{cur.name}</div>
          <div style={{ fontFamily: BLACK, fontSize: 168, color: cur === BARS[3] ? SRED : "#FFFFFF", lineHeight: 1.05, marginTop: 10, transform: `translateY(${(1 - eOut(range(t, cur.at, cur.at + 0.3))) * 30}px)` }}>{cur.num}</div>
          <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: 30, color: "rgba(255,255,255,0.75)", marginTop: 6 }}>立方米 / 秒</div>
        </div>}
        <Say t={t} at={S.big} out={S.out + 0.2} text="地球上最大的河，在海里。" x={120} y={780} size={62} color="#FFFFFF" weight={900} blur={0} />
        <Note t={t} at={S.rivers} out={S.out} text="1 Sv（斯韦德鲁普）= 每秒100万立方米 · Donohue et al. 2016（南极绕极流）" x={120} y={1020} size={18} color="rgba(255,255,255,0.55)" />
      </Layer>
    </Layer>
  );
};

// ---------- Bauhaus: why it flows ----------
const G = { x: 960, y: 560, r: 330 };
const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; c: string; w?: number; k?: number; head?: number }> = ({ x1, y1, x2, y2, c, w = 10, k = 1, head = 26 }) => {
  if (k <= 0) return null;
  const x = lerp(x1, x2, k), y = lerp(y1, y2, k), a = Math.atan2(y - y1, x - x1);
  return <g><line x1={x1} y1={y1} x2={x - Math.cos(a) * head * 0.6} y2={y - Math.sin(a) * head * 0.6} stroke={c} strokeWidth={w} />
    <path d={`M ${x},${y} L ${x - Math.cos(a - 0.45) * head},${y - Math.sin(a - 0.45) * head} L ${x - Math.cos(a + 0.45) * head},${y - Math.sin(a + 0.45) * head} Z`} fill={c} /></g>;
};
const GYRE_MAP: View = { lon: 200, lat: 5, z: 4.7, kx: 1 };
const near = (lon: number, c: number) => lon + 360 * Math.round((c - lon) / 360);
const GYRES = [
  { lon: -40, lat: 28, rx: 22, ry: 12, cw: true }, { lon: -15, lat: -24, rx: 18, ry: 11, cw: false }, { lon: 190, lat: 28, rx: 38, ry: 12, cw: true },
  { lon: 245, lat: -28, rx: 35, ry: 12, cw: false }, { lon: 80, lat: -24, rx: 24, ry: 11, cw: false },
];
export const Why: React.FC<{ t: number }> = ({ t }) => {
  if (t < W.t - 0.2 || t >= W.out + 0.8) return null;
  const out = eInOut(range(t, W.out - 0.4, W.out + 0.5));
  const globeO = 1 - eInOut(range(t, W.hill - 0.4, W.hill + 0.1));
  const slide = eInOut(range(t, W.ekman - 0.3, W.ekman + 0.4));
  const gx = lerp(G.x, 470, slide), gr = lerp(G.r, 250, slide), gy = lerp(G.y, 600, slide);
  const spin = (t - W.t) * 0.35;
  const wind = range(t, W.wind, W.wind + 0.8);
  // Ekman spiral (isometric): each layer turns right and weakens
  const ek = range(t, W.ekman + 0.1, W.ekman + 1.1), net = eOut(range(t, W.net, W.net + 0.5));
  const EX = 1240, EY = 330;
  const iso = (a: number, L: number, z: number): [number, number] => [EX + Math.cos(a) * L, EY + z + Math.sin(a) * L * 0.42];
  // the hill of water
  const hill = eInOut(range(t, W.hill, W.hill + 1.2));
  const gy2 = eInOut(range(t, W.gyres - 0.3, W.gyres + 0.6));
  const v: View = lerpView(GYRE_MAP, { lon: 135, lat: 30, z: 26, kx: 0.85 }, eIn(range(t, W.out - 0.5, W.out + 0.5)));
  return (
    <Layer o={1 - eIn(range(t, W.out + 0.2, W.out + 0.8))} style={{ background: CREAM }}>
      <Svg>
        {/* the globe */}
        <g opacity={globeO}>
          <circle cx={gx} cy={gy} r={gr} fill={BBLUE} />
          <clipPath id="globeClip"><circle cx={gx} cy={gy} r={gr} /></clipPath>
          <g clipPath="url(#globeClip)" stroke="rgba(237,228,208,0.35)" strokeWidth={2} fill="none">
            {[-60, -30, 0, 30, 60].map((la) => { const y = gy - Math.sin((la * Math.PI) / 180) * gr; const rx = Math.cos((la * Math.PI) / 180) * gr; return <ellipse key={la} cx={gx} cy={y} rx={rx} ry={rx * 0.08} />; })}
            {[0, 1, 2, 3, 4, 5].map((i) => { const ph = spin + (i * Math.PI) / 6; return <ellipse key={i} cx={gx} cy={gy} rx={Math.abs(Math.cos(ph)) * gr} ry={gr} />; })}
          </g>
          {/* winds: trades blow west (yellow), westerlies east (red) */}
          {[[15, -1, BYEL], [-15, -1, BYEL], [45, 1, BRED], [-45, 1, BRED]].map(([la, dir, c], i) => {
            const y = gy - Math.sin(((la as number) * Math.PI) / 180) * gr, half = Math.cos(((la as number) * Math.PI) / 180) * gr * 0.62;
            const x1 = gx - (dir as number) * half, x2 = gx + (dir as number) * half;
            return <Arrow key={i} x1={x1} y1={y} x2={x2} y2={y} c={c as string} w={lerp(14, 10, slide)} head={lerp(36, 28, slide)} k={eOut(range(wind, i * 0.12, i * 0.12 + 0.6))} />;
          })}
          {/* the spinning Earth turns the water right */}
          {t > W.spin && t < W.hill && (() => {
            const k = eInOut(range(t, W.spin + 0.2, W.spin + 1.4)), x0 = gx - gr * 0.5, y0 = gy + gr * 0.05;
            const pts = Array.from({ length: 30 }, (_, i) => { const u = (i / 29) * k; return [x0 + u * gr * 0.95, y0 - u * gr * 0.65 + u * u * gr * 0.55]; });
            return <g opacity={fade(t, W.spin, W.ekman + 0.2, 0.2, 0.4)}>
              <line x1={x0} y1={y0} x2={x0 + gr * 0.95} y2={y0 - gr * 0.65} stroke={BK} strokeWidth={4} strokeDasharray="10 12" opacity={0.6} />
              <path d={"M" + pts.map((p) => p.join(",")).join("L")} stroke={BK} strokeWidth={9} fill="none" strokeLinecap="round" />
              <circle cx={pts[29][0]} cy={pts[29][1]} r={20} fill={BK} />
            </g>;
          })()}
        </g>
        {/* Ekman's spiral */}
        {t > W.ekman && t < W.hill + 0.2 && <g opacity={fade(t, W.ekman, W.hill + 0.2, 0.3, 0.5)}>
          <Arrow x1={iso(0, 0, -120)[0] - 150} y1={EY - 120} x2={iso(0, 0, -120)[0] + 150} y2={EY - 120} c={BK} w={12} head={34} k={eOut(range(t, W.ekman, W.ekman + 0.4))} />
          <text x={EX + 170} y={EY - 110} fontFamily={GEO} fontWeight={700} fontSize={34} fill={BK}>风</text>
          {Array.from({ length: 9 }, (_, i) => {
            const L = 360 * Math.pow(0.82, i), z = i * 44;
            const ang = 0.785 + i * 0.32;   // surface water 45° right of the wind, turning further right with depth
            const [x2, y2] = iso(ang, L, z), [x1, y1] = [EX, EY + z];
            return <Arrow key={i} x1={x1} y1={y1} x2={x2} y2={y2} c={i % 2 ? BBLUE : "#3E6FC0"} w={9} head={24} k={eOut(range(ek, i * 0.07, i * 0.07 + 0.35))} />;
          })}
          <line x1={EX} y1={EY} x2={EX} y2={EY + 8 * 44} stroke={BK} strokeWidth={2} strokeDasharray="4 8" />
          <text x={EX - 30} y={EY + 8 * 44 + 10} textAnchor="end" fontFamily={GEO} fontWeight={700} fontSize={26} fill="#5A5248">↓ 深处</text>
          {/* seen from above: the net flow is a right angle to the wind */}
          {net > 0 && <g opacity={net}>
            <rect x={1500} y={760} width={330} height={260} fill="none" stroke={BK} strokeWidth={3} />
            <text x={1515} y={795} fontFamily={GEO} fontWeight={700} fontSize={24} fill={BK}>俯视</text>
            <Arrow x1={1560} y1={850} x2={1780} y2={850} c={BK} w={10} head={28} />
            <Arrow x1={1560} y1={850} x2={1560} y2={1000} c={BRED} w={14} head={36} k={net} />
            <path d="M 1610,850 A 50,50 0 0 1 1560,900" fill="none" stroke={BRED} strokeWidth={3} />
            <text x={1600} y={940} fontFamily={GEO} fontWeight={800} fontSize={34} fill={BRED}>90°</text>
            <text x={1790} y={840} textAnchor="end" fontFamily={GEO} fontWeight={700} fontSize={24} fill={BK}>风</text>
            <text x={1580} y={1004} fontFamily={GEO} fontWeight={700} fontSize={24} fill={BRED}>净流向</text>
          </g>}
        </g>}
        {/* the hill of water: section below, plan above */}
        {t > W.hill - 0.2 && t < W.gyres + 0.4 && <g opacity={fade(t, W.hill - 0.2, W.gyres + 0.4, 0.3, 0.5)}>
          <path d={`M 360,840 L 360,${880} ${Array.from({ length: 61 }, (_, i) => { const x = 360 + i * 20; const u = (i - 30) / 30; return `L ${x},${840 - hill * 110 * Math.exp(-u * u * 4)}`; }).join(" ")} L 1560,880 L 1560,1000 L 360,1000 Z`} fill={BBLUE} />
          <text x={960} y={720 - hill * 30} textAnchor="middle" fontFamily={GEO} fontWeight={700} fontSize={34} fill={BK} opacity={hill}>水丘</text>
          {[-1, 1].map((s) => <Arrow key={s} x1={960 + s * 520} y1={870} x2={960 + s * 260} y2={850} c={BYEL} w={10} head={28} k={hill} />)}
          {/* plan: water circles round the hill (clockwise in the north) */}
          {[150, 110, 70].map((r, i) => <g key={r}>
            <ellipse cx={960} cy={420} rx={r * 1.9} ry={r} fill="none" stroke={i === 0 ? BRED : BK} strokeWidth={i === 0 ? 10 : 4} opacity={hill} strokeDasharray={i === 0 ? "none" : "14 14"} strokeDashoffset={-t * 60} />
          </g>)}
          {[0, 1, 2, 3].map((i) => { const a = t * 0.9 + (i * Math.PI) / 2; const x = 960 + Math.cos(a) * 285, y = 420 + Math.sin(a) * 150, ta = a + Math.PI / 2;
            return <path key={i} d={`M ${x + Math.cos(ta) * 22},${y + Math.sin(ta) * 22} L ${x + Math.cos(ta + 2.5) * 22},${y + Math.sin(ta + 2.5) * 22} L ${x + Math.cos(ta - 2.5) * 22},${y + Math.sin(ta - 2.5) * 22} Z`} fill={BRED} opacity={hill} />; })}
        </g>}
        {/* five gyres on a Bauhaus world */}
        {gy2 > 0 && <g opacity={gy2}>
          <rect x={0} y={0} width={1920} height={1080} fill={CREAM} />
          <Land v={v} fill={BK} />
          {GYRES.map((g, i) => {
            const [x, y] = proj(v, near(g.lon, v.lon), g.lat), rx = g.rx * v.z * (v.kx ?? 1), ry = g.ry * v.z, k = eOut(range(t, W.gyres + i * 0.12, W.gyres + i * 0.12 + 0.5));
            const c = g.cw ? BRED : BBLUE, a = (g.cw ? 1 : -1) * t * 1.2;
            return <g key={i} opacity={k * (1 - out)}>
              <ellipse cx={x} cy={y} rx={rx * k} ry={ry * k} fill="none" stroke={c} strokeWidth={9} />
              {[0, Math.PI].map((o2, j) => { const aa = a + o2, px = x + Math.cos(aa) * rx, py = y + Math.sin(aa) * ry, ta = aa + (g.cw ? 1 : -1) * Math.PI / 2;
                return <path key={j} d={`M ${px + Math.cos(ta) * 24},${py + Math.sin(ta) * 24} L ${px + Math.cos(ta + 2.4) * 22},${py + Math.sin(ta + 2.4) * 22} L ${px + Math.cos(ta - 2.4) * 22},${py + Math.sin(ta - 2.4) * 22} Z`} fill={c} />; })}
            </g>;
          })}
        </g>}
      </Svg>
      {/* type */}
      <Say t={t} at={W.ask} out={W.wind + 0.1} text="谁在推？" x={960} y={60} size={110} anchor="center" color={BK} font={SANS} weight={900} blur={0} />
      <Layer o={fade(t, W.wind, W.ekman, 0.2, 0.3)}>
        <div style={{ position: "absolute", left: 110, top: 70, fontFamily: GEO, fontWeight: 800, fontSize: 200, color: BRED, lineHeight: 1 }}>风</div>
        <Say t={t} at={W.wind + 0.3} out={W.spin} text="信风向西，西风向东" x={110} y={300} size={44} color={BK} font={SANS} weight={700} blur={0} />
        <Say t={t} at={W.spin} out={W.ekman} text="地球在转：" x={110} y={300} size={44} color={BK} font={SANS} weight={700} blur={0} />
        <Say t={t} at={W.spin + 0.4} out={W.ekman} text="北半球的水，总往右偏" x={110} y={370} size={44} color={BRED} font={SANS} weight={900} blur={0} />
      </Layer>
      <Say t={t} at={W.ekman + 0.2} out={W.hill} text="一层推一层，越深越偏" x={110} y={80} size={54} color={BK} font={SANS} weight={900} blur={0} />
      <Note t={t} at={W.ekman + 0.4} out={W.hill} text="埃克曼螺旋 · 1905" x={112} y={160} size={26} color="#5A5248" font={GEO} />
      <Say t={t} at={W.hill + 0.2} out={W.gyres} text="水堆向大洋中央，绕着“水丘”转" x={960} y={80} size={54} anchor="center" color={BK} font={SANS} weight={900} blur={0} />
      <Layer o={gy2 * (1 - out)}>
        <div style={{ position: "absolute", left: 40, top: 590, width: 430, height: 400, background: CREAM, border: `6px solid ${BK}` }} />
        <div style={{ position: "absolute", left: 70, top: 600, fontFamily: GEO, fontWeight: 800, fontSize: 200, color: BRED, lineHeight: 1 }}>5</div>
        <Say t={t} at={W.gyres + 0.2} out={W.out + 0.2} text="五大环流" x={70} y={820} size={72} color={BK} font={SANS} weight={900} blur={0} />
        <Note t={t} at={W.gyres + 0.4} out={W.out} text="北半球顺时针 · 南半球逆时针" x={72} y={930} size={24} color="#5A5248" />
      </Layer>
    </Layer>
  );
};
// ---------- the Kuroshio, nearest to us ----------
export const Kuro: React.FC<{ t: number }> = ({ t }) => {
  if (t < K.t - 0.5 || t >= K.out + 0.8) return null;
  const o = Math.min(eOut(range(t, K.t - 0.5, K.t + 0.2)), 1 - eInOut(range(t, K.out - 0.2, K.out + 0.6)));
  const z = lerp(1.25, 1.04, eOut(range(t, K.t - 0.5, K.out)));
  return (
    <Layer o={o}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${z})`, transformOrigin: "62% 48%" }}>
        <Sequence from={Math.round((K.t - 0.5) * 30)} layout="none">
          <OffthreadVideo src={staticFile("media/oc_po_kuro.mp4")} muted style={{ width: 1920, height: 1080 }} />
        </Sequence>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(5,15,30,0.6) 0%, rgba(5,15,30,0) 45%)" }} />
      <div style={{ position: "absolute", left: 1180, top: 560, fontFamily: BRUSH, fontSize: 150, color: "#FFFFFF", textShadow: "0 4px 30px rgba(0,20,50,0.8)",
        opacity: eOut(range(t, K.t + 0.1, K.t + 0.5)) * (1 - eIn(range(t, K.out - 0.3, K.out + 0.3))), transform: `rotate(-18deg) scale(${lerp(1.3, 1, eOut(range(t, K.t + 0.1, K.t + 0.5)))})` }}>黑潮</div>
      <Say t={t} at={K.l1} out={K.out + 0.3} text="离我们最近的一条：" x={110} y={110} size={54} weight={600} shadow="0 3px 20px rgba(0,0,0,0.6)" />
      <Say t={t} at={K.l2} out={K.out + 0.3} text="从台湾东边北上，" x={110} y={190} size={64} weight={900} shadow="0 3px 20px rgba(0,0,0,0.6)" />
      <Say t={t} at={K.l2 + 0.6} out={K.out + 0.3} text="擦过日本，向东流去" x={110} y={275} size={64} weight={900} color={STREAM} shadow="0 3px 20px rgba(0,0,0,0.6)" />
      <Credit t={t} at={K.t} out={K.out} text="NASA/GSFC《永恒的海洋》" />
    </Layer>
  );
};

