// FIRST LIGHT — the shared plan for picture and score. Times are in seconds.
// One entity, one continuous camera: light → cosmos → cell → mind → eye → light.
export const FPS = 30;
export const DURATION = 30;

export const ACTS = {
  void: [0, 5],      // quantum foam; the point ignites at IGNITE
  matter: [5, 10],   // light flows out and settles into the cosmic web
  life: [10, 17],    // dive into a node: a cell divides on the beat
  mind: [17, 25],    // neurons grow; signals accelerate to synchrony
  seeing: [25, 30],  // silence; the network becomes an iris; the eye opens
};
export const IGNITE = 2.0;
export const CLIMAX = 24.6;      // the whole network fires at once
export const SILENCE = [24.85, 25.35];
export const EYE_OPEN = 26.6;

// Tempo map: the pulse of the film. bpm(t) piecewise; beats are integrated from it.
function bpm(t) {
  if (t < 5) return 0;
  if (t < 10) return 60 + 12 * (t - 5) / 5;                    // slow heartbeat
  if (t < 17) return 80 + 24 * (t - 10) / 7;                   // life quickens
  if (t < CLIMAX) return 110 * Math.pow(170 / 110, (t - 17) / (CLIMAX - 17)); // mind accelerates
  return 0;
}
export const BEATS = (() => {
  const out = []; let phase = 0; const dt = 1 / 2000;
  for (let t = 5; t < CLIMAX; t += dt) {
    phase += bpm(t) / 60 * dt;
    if (phase >= 1) { phase -= 1; out.push(+t.toFixed(4)); }
  }
  out.unshift(5.0);
  return out;
})();
// subdivision pulses in the mind act (signals on 8ths, then 16ths near the climax)
export const PULSES = (() => {
  const p = [];
  for (let i = 0; i < BEATS.length - 1; i++) {
    const a = BEATS[i], b = BEATS[i + 1];
    if (a < 17) continue;
    const sub = a < 21 ? 2 : 4;
    for (let k = 0; k < sub; k++) p.push(+(a + (b - a) * k / sub).toFixed(4));
  }
  return p;
})();
// cell divisions land on beats in the life act
export const DIVISIONS = (() => {
  const lb = BEATS.filter(t => t >= 11 && t < 16.6);
  return [lb[1], lb[3], lb[5], lb[7]].filter(Boolean); // 1→2→4→8→16
})();

if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('plan.js')) {
  console.log(JSON.stringify({ FPS, DURATION, ACTS, IGNITE, CLIMAX, SILENCE, EYE_OPEN, BEATS, PULSES, DIVISIONS }));
}
