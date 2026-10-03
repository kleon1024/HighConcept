// Shared beat grid for picture and score. 120 BPM, 30 fps → 1 beat = 15 frames.
// s = start beat, l = length in beats, k = scene key, p = scene params.
// One subject per shot; each chapter has its own palette (see storyboard v4).
export const BPM = 120;
export const FPS = 30;
export const BEAT_SEC = 60 / BPM;
export const TOTAL_BEATS = 60;

export const CHAPTERS = [
  { name: 'egg', s: 0 },
  { name: 'cosmos', s: 4 },
  { name: 'frost', s: 12 },
  { name: 'genesis', s: 20 },
  { name: 'theft', s: 28 },
  { name: 'excess', s: 36 },
  { name: 'descent', s: 48 },
  { name: 'awake', s: 56 },
];

export const SHOTS = [
  // 序 · 卵 — gold on black
  { s: 0, l: 4, k: 'egg' },
  // I 振 — indigo cosmos, gold
  { s: 4, l: 2, k: 'panguEyes' },
  { s: 6, l: 2, k: 'solids' },
  { s: 8, l: 2, k: 'orbitals' },
  { s: 10, l: 2, k: 'meteor' },
  // II 冻 — glacial cyan and white
  { s: 12, l: 2, k: 'iceberg' },
  { s: 14, l: 2, k: 'water' },
  { s: 16, l: 2, k: 'ouroboros' },
  { s: 18, l: 2, k: 'dna' },
  // III 生 — bioluminescent teal and magenta
  { s: 20, l: 2, k: 'mitosis' },
  { s: 22, l: 1, k: 'synapse' },
  { s: 23, l: 1, k: 'eden' },
  { s: 24, l: 2, k: 'cambrian' },
  { s: 26, l: 2, k: 'lightning' },
  // IV 盗 — firelight, bronze
  { s: 28, l: 2, k: 'cave' },
  { s: 30, l: 0.5, k: 'flame', p: { el: 'Li' } },
  { s: 30.5, l: 0.5, k: 'flame', p: { el: 'K' } },
  { s: 31, l: 0.5, k: 'flame', p: { el: 'Cu' } },
  { s: 31.5, l: 1.5, k: 'flame', p: { el: 'Na' } },
  { s: 33, l: 1, k: 'ding' },
  { s: 34, l: 2, k: 'oracle' },
  // V 繁 — marble and gilt, then silicon blue, then the void
  { s: 36, l: 1, k: 'parthenon' },
  { s: 37, l: 1, k: 'armillary' },
  { s: 38, l: 1, k: 'dome' },
  { s: 39, l: 1, k: 'library' },
  { s: 40, l: 1, k: 'chip' },
  { s: 41, l: 2, k: 'babel' },
  { s: 43, l: 0.5, k: 'solids', p: { flash: true, u0: 0.5 } },
  { s: 43.5, l: 0.5, k: 'dna', p: { flash: true, u0: 0.4 } },
  { s: 44, l: 0.5, k: 'ding', p: { flash: true, u0: 0.8 } },
  { s: 44.5, l: 0.5, k: 'dome', p: { flash: true, u0: 0.5 } },
  { s: 45, l: 3, k: 'blackhole' },
  // VI 降 — data cyan and amber
  { s: 48, l: 2, k: 'loss' },
  { s: 50, l: 1, k: 'network' },
  { s: 51, l: 1, k: 'android' },
  { s: 52, l: 0.5, k: 'sheep', p: { n: 0 } },
  { s: 52.5, l: 0.5, k: 'sheep', p: { n: 1 } },
  { s: 53, l: 0.5, k: 'sheep', p: { n: 2 } },
  { s: 53.5, l: 1.5, k: 'sheep', p: { n: 3, dissolve: true } },
  { s: 55, l: 1, k: 'converge' },
  // VII 觉 — gold returns
  { s: 56, l: 2, k: 'eye' },
  { s: 58, l: 2, k: 'ending' },
];

// Moments of absolute silence / black (beat ranges), shared by picture and score.
export const SILENCES = [
  [11.75, 12], [19.75, 20], [27.75, 28], [35.75, 36], [47.5, 48], [55.5, 56],
];

// Musical accents the picture reacts to (light pulses), in beats. Generated from the score plan.
export const ACCENTS = [
  0.5, 1, 1.5, 2.5, 4, 6, 8, 8.667, 9.333, 10, 12, 14, 14.5, 16, 17, 18, 20, 20.5, 21, 21.5, 22, 23, 24, 26.5,
  28, 29, 30, 30.5, 31, 31.5, 33, 34, 34.25, 34.5, 34.75, 36, 37, 38, 39, 40, 41, 42, 43, 43.5, 44, 44.5, 45,
  48, 50, 51, 52, 52.5, 53, 53.5, 55, 56.8, 58,
];

if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('timeline.js')) {
  console.log(JSON.stringify({ BPM, FPS, TOTAL_BEATS, CHAPTERS, SHOTS, SILENCES, ACCENTS }));
}
