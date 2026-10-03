// Shared beat grid for picture and score. 120 BPM, 30 fps → 1 beat = 15 frames.
//
// v5 structure: the film breathes. Long, slow passages carry the story spine (the gold seed's journey);
// short, fast montages cut on the drums carry the many motifs. Transitions connect shots by shape and motion.
//
// Shot fields:
//   s, l   start / length in beats
//   k      scene key;  p  scene params
//   win    [a, b] — which part of the scene's own animation (u range) plays during this shot (default [0,1])
//   tr     transition INTO this shot: 'cut' (default) | 'zoom' (zoom-through, spark) | 'dissolve' | 'fadein' | 'crack'
export const BPM = 120;
export const FPS = 30;
export const BEAT_SEC = 60 / BPM;
export const TOTAL_BEATS = 60;

// energy sections (drive the score and the cutting)
export const SECTIONS = [
  { name: 'seed', s: 0, e: 8, energy: 'slow' },
  { name: 'cosmos burst', s: 8, e: 10, energy: 'fast' },
  { name: 'the fall', s: 10, e: 16, energy: 'slow' },
  { name: 'chemistry burst', s: 16, e: 20, energy: 'fast' },
  { name: 'first eye', s: 20, e: 25, energy: 'slow' },
  { name: 'fire', s: 25, e: 29, energy: 'medium' },
  { name: 'civilization', s: 29, e: 37, energy: 'fastest' },
  { name: 'black hole', s: 37, e: 43, energy: 'slow' },
  { name: 'dream', s: 43, e: 51.5, energy: 'medium' },
  { name: 'awake', s: 51.5, e: 60, energy: 'slow' },
];

export const SHOTS = [
  // ── slow: the seed becomes the cosmic egg (4 s) ──
  { s: 0, l: 8, k: 'egg' },
  // ── fast: the egg bursts into the cosmos (1 s, cuts on the drums) ──
  { s: 8, l: 1, k: 'panguEyes', win: [0.25, 1], tr: 'crack' },
  { s: 9, l: 0.5, k: 'solids', win: [0.45, 0.8] },
  { s: 9.5, l: 0.5, k: 'orbitals', win: [0, 1] },
  // ── slow: a meteorite carries the seed down into the polar sea (3 s) ──
  { s: 10, l: 2.5, k: 'meteor', win: [0, 0.97], tr: 'zoom' },
  { s: 12.5, l: 3.5, k: 'iceberg', tr: 'zoom' },
  // ── fast: chemistry (2 s) ──
  { s: 16, l: 0.5, k: 'water', win: [0.35, 0.95], tr: 'zoom' },
  { s: 16.5, l: 1.25, k: 'ouroboros', win: [0.3, 0.8] },          // bite lands exactly on beat 17
  { s: 17.75, l: 0.75, k: 'dna', win: [0.15, 0.75] },
  { s: 18.5, l: 0.5, k: 'mitosis', win: [0, 1], tr: 'zoom' },
  { s: 19, l: 0.5, k: 'synapse', win: [0.3, 1] },
  { s: 19.5, l: 0.375, k: 'eden', win: [0.4, 1] },
  // ── slow: the Cambrian sea; everything stops; the first eye receives light (2.5 s) ──
  { s: 20, l: 4, k: 'cambrian', tr: 'fadein' },
  { s: 24, l: 2.5, k: 'lightning', win: [0.1, 1] },          // lightning; the tree burns: stolen fire
  // ── medium: the flame test (fate motif) ──
  { s: 26.5, l: 0.5, k: 'flame', p: { el: 'Li' } },
  { s: 27, l: 0.5, k: 'flame', p: { el: 'K' } },
  { s: 27.5, l: 0.5, k: 'flame', p: { el: 'Cu' } },
  { s: 28, l: 1, k: 'flame', p: { el: 'Na' } },
  // ── fastest: civilization accelerates (4 s), shots shorten 1 → ½ → ¼ beat ──
  { s: 29, l: 1, k: 'oracle', win: [0, 0.6], tr: 'zoom' },  // fire cracks the bone: 卜
  { s: 30, l: 1.5, k: 'pattern' },                            // the line of culture: 卜 → 云雷纹 → meander → volute → circuit
  { s: 31.5, l: 0.75, k: 'parthenon', win: [0.3, 1] },
  { s: 32.25, l: 0.75, k: 'armillary', win: [0.2, 0.9] },
  { s: 33, l: 0.75, k: 'dome', win: [0.3, 0.9] },
  { s: 33.75, l: 0.75, k: 'library', win: [0.2, 0.8] },
  { s: 34.5, l: 1.5, k: 'chip', win: [0.2, 1], tr: 'zoom' },  // the megastructure: a city of circuits
  { s: 36, l: 0.25, k: 'solids', win: [0.55, 0.6] },
  { s: 36.25, l: 0.25, k: 'dna', win: [0.4, 0.45] },
  { s: 36.5, l: 0.25, k: 'parthenon', win: [0.85, 0.9] },
  { s: 36.75, l: 0.25, k: 'dome', win: [0.5, 0.55] },
  // ── slow: the black hole swallows it all (3 s) ──
  { s: 37, l: 5.5, k: 'blackhole', tr: 'zoom' },
  // ── medium: descent, the dreaming machine, electric sheep (fate motif) (4 s) ──
  { s: 43, l: 2, k: 'loss', tr: 'fadein' },
  { s: 45, l: 0.75, k: 'network', tr: 'dissolve' },
  { s: 45.75, l: 4.75, k: 'dream', tr: 'dissolve' },       // the network dreams: a constellation sheep jumps three times; the fourth becomes the seed
  { s: 50.5, l: 0.75, k: 'converge', tr: 'zoom' },
  // ── slow: the eye opens; the ouroboros closes; back to the seed (4.25 s) ──
  { s: 51.5, l: 4.5, k: 'eye', tr: 'fadein' },
  { s: 56, l: 4, k: 'ending' },
];

// Absolute silence / black (beats), shared by picture and score: breaths before the big turns.
export const SILENCES = [[7.75, 8], [19.875, 20], [42.5, 43], [51.25, 51.5]];

// Accents for light pulses: every cut inside fast sections plus the score's marked hits.
export const ACCENTS = [
  ...SHOTS.filter(s => SECTIONS.some(x => x.energy.startsWith('fast') && s.s >= x.s && s.s < x.e)).map(s => s.s),
  8, 12.5, 17, 22.5, 24.25, 26.5, 27, 27.5, 28, 29.21, 29.42, 29.625, 30.3, 30.6, 30.9, 31.2, 37, 47.25, 47.75, 48.25, 48.75, 53.3, 56,
].sort((a, b) => a - b);

if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].endsWith('timeline.js')) {
  console.log(JSON.stringify({ BPM, FPS, TOTAL_BEATS, SECTIONS, SHOTS, SILENCES, ACCENTS }));
}
