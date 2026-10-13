// Thinkers and props as flat cut-paper icons: each reduced to the one or two features everyone knows (Socrates' beard,
// Schopenhauer's tufts, Nietzsche's moustache, Sartre's glasses and pipe, Foucault's bald head and turtleneck).
// Every icon is drawn around (0, 0) at about 300 px tall; c = the paper colour of the figure, b = the cut-out details.
import React from "react";
import { GOLD } from "./base";
import { Lamp } from "./Kit";

type P = { c: string; b: string; t?: number };

// Socrates: a bust in profile, a dome of a head, a snub nose and a beard of curls, on a pedestal
export const Socrates: React.FC<P> = ({ c, b }) => (
  <g>
    <rect x={-84} y={118} width={168} height={30} fill={c} /><rect x={-104} y={148} width={208} height={18} fill={c} />
    <path d="M-104,118 C-100,70 -70,40 -24,30 L52,34 C86,46 104,76 108,118 Z" fill={c} />
    <path d="M-66,-30 C-96,-80 -88,-170 -10,-182 C50,-190 82,-150 80,-118 L86,-104 L108,-84 C112,-78 106,-72 98,-72 L90,-70 C94,-62 92,-56 86,-54
             C100,-30 104,0 92,22 C78,44 46,54 14,50 C-8,48 -22,40 -30,30 C-40,10 -54,-6 -66,-30 Z" fill={c} />
    <path d="M44,-118 C52,-124 62,-124 70,-118" fill="none" stroke={b} strokeWidth={4} strokeLinecap="round" />
    <path d="M46,-108 C54,-104 62,-104 68,-108" fill="none" stroke={b} strokeWidth={3} />
    <path d="M-14,-100 C-28,-104 -30,-82 -16,-78" fill="none" stroke={b} strokeWidth={4} />
    <path d="M60,-52 C40,-44 30,-30 34,-10 M78,-30 C60,-20 56,0 62,18 M30,-40 C14,-26 10,-6 16,14 M86,0 C74,10 72,24 76,34" fill="none" stroke={b} strokeWidth={3} opacity={0.8} />
    <path d="M-60,-120 c8,-6 14,0 10,8 M-70,-90 c8,-6 14,0 10,8 M-64,-60 c8,-6 14,0 10,8" fill="none" stroke={b} strokeWidth={3} opacity={0.8} />
    <path d="M-80,70 C-50,90 -10,96 30,80 M-60,100 C-20,116 30,112 70,96" fill="none" stroke={b} strokeWidth={3} opacity={0.6} />
  </g>
);

// Diogenes: a ragged cloak, a beard, a staff, and the lamp held out in front
export const Diogenes: React.FC<P & { lampOn?: number }> = ({ c, b, t = 0, lampOn = 1 }) => {
  const step = Math.sin(t * 6) * 6;
  return (
    <g>
      <line x1={-62} y1={-150} x2={-80 + step * 0.3} y2={150} stroke={c} strokeWidth={9} strokeLinecap="round" />
      <path d={`M-40,-90 C-60,-40 -64,40 -70,140 L-50,150 L-36,132 L-20,152 L-4,134 L12,152 L26,132 L44,150 L56,140 C50,60 44,-30 30,-90 Z`} fill={c} />
      <path d="M-30,-96 C-10,-110 20,-110 34,-92 L30,-60 C10,-70 -12,-70 -30,-60 Z" fill={c} />
      <circle cx={2} cy={-132} r={34} fill={c} />
      <path d="M8,-112 L40,-108 L24,-62 L-4,-90 Z" fill={c} />
      <circle cx={18} cy={-140} r={4.5} fill={b} />
      <path d="M26,-74 L120,-40" stroke={c} strokeWidth={16} strokeLinecap="round" />
      <g transform="translate(150 -36)"><line x1={0} y1={-6} x2={0} y2={12} stroke={c} strokeWidth={4} /><g transform="translate(0 30) scale(0.55)"><Lamp t={t} on={lampOn} ink={c} /></g></g>
      <path d="M-20,-40 L10,40 M10,-30 L30,60" stroke={b} strokeWidth={3} opacity={0.5} />
    </g>
  );
};

// a crowd member: head, a draped body, varied heights; facing left or right
export const Person: React.FC<P & { h?: number; w?: number; face?: number; look?: number }> = ({ c, h = 1, w = 1, face = 1 }) => (
  <g transform={`scale(${face * w} ${h})`}>
    <circle cx={0} cy={-122} r={26} fill={c} />
    <path d="M-34,-92 C-48,-40 -52,40 -46,120 L46,120 C52,40 48,-40 34,-92 C20,-100 -20,-100 -34,-92 Z" fill={c} />
  </g>
);

// Alexander: a crested helmet, a cape and a spear: a big shadow
export const Alexander: React.FC<P> = ({ c, b }) => (
  <g>
    <line x1={110} y1={-260} x2={120} y2={220} stroke={c} strokeWidth={10} />
    <path d="M110,-270 l14,40 l-28,0 Z" fill={c} />
    <path d="M-80,-120 C-120,0 -130,120 -120,220 L120,220 C126,120 110,0 80,-120 C40,-140 -40,-140 -80,-120 Z" fill={c} />
    <path d="M-50,-150 C-56,-230 56,-240 52,-150 L52,-120 L-50,-120 Z" fill={c} />
    <path d="M-70,-200 C-60,-290 70,-300 80,-200 C60,-250 -40,-250 -70,-200 Z" fill={c} />
    <rect x={-14} y={-190} width={10} height={44} fill={b} /><rect x={8} y={-190} width={10} height={44} fill={b} />
  </g>
);

// the jar Diogenes lived in, on its side
export const Jar: React.FC<P> = ({ c, b }) => (
  <g>
    <ellipse cx={0} cy={0} rx={190} ry={120} fill={c} />
    <ellipse cx={168} cy={0} rx={30} ry={64} fill={b} />
    <ellipse cx={168} cy={0} rx={18} ry={48} fill={c} opacity={0.4} />
    {[-60, 0, 60].map((y) => <path key={y} d={`M-170,${y} C-60,${y + 14} 60,${y + 14} 150,${y}`} fill="none" stroke={b} strokeWidth={4} opacity={0.5} />)}
  </g>
);

// Bentham's auto-icon: seated in a glass box, a broad hat, a cane
export const AutoIcon: React.FC<P> = ({ c, b }) => (
  <g>
    <rect x={-150} y={-260} width={300} height={420} fill="none" stroke={c} strokeWidth={6} />
    <line x1={-150} y1={-260} x2={-110} y2={-290} stroke={c} strokeWidth={4} /><line x1={150} y1={-260} x2={190} y2={-290} stroke={c} strokeWidth={4} />
    <line x1={-110} y1={-290} x2={190} y2={-290} stroke={c} strokeWidth={4} /><line x1={190} y1={-290} x2={190} y2={130} stroke={c} strokeWidth={4} /><line x1={150} y1={160} x2={190} y2={130} stroke={c} strokeWidth={4} />
    <rect x={-90} y={20} width={180} height={20} fill={c} /><rect x={-80} y={40} width={14} height={120} fill={c} /><rect x={66} y={40} width={14} height={120} fill={c} />
    <path d="M-50,-110 C-70,-60 -70,0 -60,30 L60,30 C70,0 70,-60 50,-110 Z" fill={c} />
    <path d="M-50,30 L-60,140 L-30,140 L-10,40 Z M50,30 L60,140 L30,140 L10,40 Z" fill={c} />
    <circle cx={0} cy={-150} r={34} fill={c} />
    <ellipse cx={0} cy={-176} rx={74} ry={12} fill={c} /><path d="M-34,-176 C-34,-214 34,-214 34,-176 Z" fill={c} />
    <path d="M-28,-150 C-40,-120 -40,-100 -34,-90 M28,-150 C40,-120 40,-100 34,-90" stroke={c} strokeWidth={14} fill="none" />
    <line x1={30} y1={-20} x2={44} y2={150} stroke={b} strokeWidth={6} />
    <circle cx={-10} cy={-152} r={4} fill={b} /><circle cx={12} cy={-152} r={4} fill={b} />
  </g>
);

export const Pig: React.FC<P> = ({ c, b }) => (
  <g>
    <ellipse cx={0} cy={0} rx={90} ry={60} fill={c} />
    {[-55, -25, 25, 55].map((x) => <rect key={x} x={x - 9} y={40} width={18} height={40} fill={c} />)}
    <ellipse cx={92} cy={-6} rx={22} ry={26} fill={c} stroke={b} strokeWidth={4} />
    <circle cx={88} cy={-12} r={4} fill={b} /><circle cx={96} cy={2} r={4} fill={b} />
    <path d="M50,-50 l16,-34 l14,30 Z" fill={c} /><circle cx={62} cy={-24} r={5} fill={b} />
    <path d="M58,8 q10,12 24,0" fill="none" stroke={b} strokeWidth={4} strokeLinecap="round" />
    <path d="M-90,-6 c-22,-10 -22,20 -6,14 c10,-4 4,-18 -6,-10" fill="none" stroke={c} strokeWidth={6} />
  </g>
);

// Schopenhauer: the bald crown, the two white tufts, the frown, a high collar
export const Schopenhauer: React.FC<P> = ({ c, b }) => (
  <g>
    <path d="M-120,170 C-110,90 -60,70 0,70 C60,70 110,90 120,170 Z" fill={c} />
    <path d="M-30,70 L0,120 L30,70 Z" fill={b} />
    <ellipse cx={0} cy={-30} rx={78} ry={100} fill={c} />
    {[[-1, 1], [1, 1]].map(([s], i) => (
      <g key={i} transform={`scale(${s} 1)`}>
        <path d="M70,-40 C110,-90 160,-60 140,-30 C180,-10 160,40 120,30 C130,60 90,70 74,40 Z" fill={c} stroke={b} strokeWidth={4} />
        <path d="M100,-40 c10,10 20,10 30,6 M96,0 c14,8 24,8 34,2" fill="none" stroke={b} strokeWidth={3} />
      </g>
    ))}
    <path d="M-44,-40 l28,8 M44,-40 l-28,8" stroke={b} strokeWidth={7} strokeLinecap="round" />
    <circle cx={-28} cy={-22} r={6} fill={b} /><circle cx={28} cy={-22} r={6} fill={b} />
    <path d="M0,-18 L-8,20 L6,20" fill="none" stroke={b} strokeWidth={4} />
    <path d="M-30,48 C-14,36 14,36 30,48" fill="none" stroke={b} strokeWidth={6} strokeLinecap="round" />
    <path d="M-60,-100 C-30,-124 30,-124 60,-100" fill="none" stroke={b} strokeWidth={3} opacity={0.4} />
  </g>
);

// Nietzsche: swept hair, deep brows, and the moustache
export const Nietzsche: React.FC<P> = ({ c, b }) => (
  <g>
    <path d="M-120,170 C-110,90 -60,70 0,70 C60,70 110,90 120,170 Z" fill={c} />
    <path d="M-20,70 L0,110 L20,70 Z" fill={b} />
    <ellipse cx={0} cy={-30} rx={76} ry={100} fill={c} />
    <path d="M-80,-60 C-90,-150 60,-170 84,-80 C60,-120 -20,-130 -80,-60 Z" fill={c} stroke={b} strokeWidth={4} />
    <path d="M-50,-46 l34,6 M50,-46 l-34,6" stroke={b} strokeWidth={10} strokeLinecap="round" />
    <circle cx={-30} cy={-26} r={6} fill={b} /><circle cx={30} cy={-26} r={6} fill={b} />
    <path d="M0,-20 L-8,10 L8,10" fill="none" stroke={b} strokeWidth={4} />
    <path d="M-86,44 C-70,4 -20,6 0,18 C20,6 70,4 86,44 C60,30 30,40 0,34 C-30,40 -60,30 -86,44 Z" fill={b} />
    <path d="M-86,44 C-70,4 -20,6 0,18 C20,6 70,4 86,44 C70,64 30,52 0,48 C-30,52 -70,64 -86,44 Z" fill={b} />
  </g>
);

// Sartre: round heavy glasses (one eye off), combed hair, a pipe
export const Sartre: React.FC<P> = ({ c, b }) => (
  <g>
    <path d="M-120,170 C-110,90 -60,70 0,70 C60,70 110,90 120,170 Z" fill={c} />
    <path d="M-40,74 L0,140 L40,74 Z" fill={b} /><path d="M-10,90 L0,150 L10,90 Z" fill={c} />
    <ellipse cx={0} cy={-30} rx={80} ry={98} fill={c} />
    <path d="M-80,-50 C-84,-130 70,-140 82,-60 C40,-104 -40,-100 -80,-50 Z" fill={b} />
    <circle cx={-34} cy={-24} r={30} fill="none" stroke={b} strokeWidth={9} /><circle cx={34} cy={-24} r={30} fill="none" stroke={b} strokeWidth={9} />
    <line x1={-4} y1={-24} x2={4} y2={-24} stroke={b} strokeWidth={7} />
    <circle cx={-30} cy={-22} r={6} fill={b} /><circle cx={44} cy={-30} r={6} fill={b} />
    <path d="M-20,44 C-6,50 6,50 20,44" fill="none" stroke={b} strokeWidth={5} strokeLinecap="round" />
    <path d="M14,48 L70,70 L70,60 M64,52 h22 v26 h-22 Z" fill={b} stroke={b} strokeWidth={6} strokeLinejoin="round" />
  </g>
);

// Foucault: the bald dome (with a shine), rimmed glasses, a grin, a white turtleneck
export const Foucault: React.FC<P & { neck?: string }> = ({ c, b, neck = "#FFFFFF" }) => (
  <g>
    <path d="M-120,170 C-110,90 -60,70 0,70 C60,70 110,90 120,170 Z" fill={b} stroke={c} strokeWidth={5} />
    <rect x={-46} y={50} width={92} height={46} rx={20} fill={neck} stroke={b} strokeWidth={4} />
    <ellipse cx={0} cy={-34} rx={82} ry={104} fill={c} />
    <path d="M-40,-110 C-20,-128 20,-128 40,-112" fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" opacity={0.7} />
    <rect x={-66} y={-46} width={56} height={40} rx={14} fill="none" stroke={b} strokeWidth={7} /><rect x={10} y={-46} width={56} height={40} rx={14} fill="none" stroke={b} strokeWidth={7} />
    <line x1={-10} y1={-30} x2={10} y2={-30} stroke={b} strokeWidth={6} />
    <circle cx={-38} cy={-26} r={6} fill={b} /><circle cx={38} cy={-26} r={6} fill={b} />
    <path d="M-34,30 C-12,52 12,52 34,30" fill="none" stroke={b} strokeWidth={6} strokeLinecap="round" />
  </g>
);

// Sisyphus leaning into his stone
export const Sisyphus: React.FC<P> = ({ c }) => (
  <g>
    <circle cx={-6} cy={-130} r={20} fill={c} />
    <path d="M-20,-112 L40,-60 L30,-40 L-26,-80 L-60,20 L-40,24 L-30,-10 L-10,40 L10,36 L-6,-40 Z" fill={c} />
    <path d="M10,-100 L50,-64" stroke={c} strokeWidth={14} strokeLinecap="round" />
  </g>
);

// someone on a sofa, lit by a phone
export const Sofa: React.FC<P & { glow?: string }> = ({ c, b, glow = "#7FB8FF" }) => (
  <g>
    <rect x={-220} y={20} width={440} height={90} rx={30} fill={c} /><rect x={-220} y={-60} width={440} height={100} rx={34} fill={c} opacity={0.85} />
    <rect x={-250} y={-10} width={60} height={120} rx={26} fill={c} /><rect x={190} y={-10} width={60} height={120} rx={26} fill={c} />
    <path d="M-60,40 C-70,-20 -40,-60 -10,-60 L20,-56 C40,-30 40,10 30,40 Z" fill={b} />
    <circle cx={-20} cy={-90} r={30} fill={b} />
    <path d="M20,-30 L80,-60" stroke={b} strokeWidth={18} strokeLinecap="round" />
    <path d="M30,40 L130,50 L150,100" stroke={b} strokeWidth={22} strokeLinecap="round" fill="none" />
    <rect x={76} y={-96} width={30} height={52} rx={6} fill={glow} transform="rotate(-20 90 -70)" />
    <polygon points="76,-80 -20,-110 -20,-60" fill={glow} opacity={0.25} />
  </g>
);

export const Glint: React.FC<{ r?: number }> = ({ r = 8 }) => <circle r={r} fill={GOLD} />;
