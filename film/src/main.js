import { THREE, W, H, rng, v3, crack, LineBuilder, gradeShader, setRenderer, backdrop, seedPoint, clamp, lerp, easeOut, easeIn } from './core.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SHOTS, FPS, BEAT_SEC, SILENCES, ACCENTS } from './timeline.js';
import { shots as s01 } from './shots/ch01_cosmos.js';
import { shots as s23 } from './shots/ch23_frost_genesis.js';
import { shots as s45 } from './shots/ch45_theft_excess.js';
import { shots as s67 } from './shots/ch67_descent_awake.js';

const SCENES = { ...s01, ...s23, ...s45, ...s67 };
const PR = Number(new URLSearchParams(location.search).get('scale') || 1);
const BF = FPS * BEAT_SEC; // frames per beat

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(PR);
renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
document.body.appendChild(renderer.domElement);
setRenderer(renderer);

const overlay = new THREE.Scene();
const ortho = new THREE.OrthographicCamera(-W / H, W / H, 1, -1, -10, 10);
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W * PR, H * PR, { type: THREE.HalfFloatType, samples: 4 }));
const mainPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
const overPass = new RenderPass(overlay, ortho); overPass.clear = false; overPass.clearDepth = true;
const bloom = new UnrealBloomPass(new THREE.Vector2(W * PR, H * PR), 0.6, 0.6, 0.9);
const grade = new ShaderPass(gradeShader);
composer.addPass(mainPass); composer.addPass(overPass); composer.addPass(bloom); composer.addPass(new OutputPass()); composer.addPass(grade);

function placeholder() {
  const S = new THREE.Scene(); backdrop(S, 'void');
  const c = new THREE.PerspectiveCamera(35, W / H, 0.1, 1000); c.position.set(0, 0, 5);
  S.add(seedPoint());
  return { scene: S, cam: c, update() {} };
}

// ---------------------------------------------------------------- shot cache (current + previous, for dissolves)
const cache = new Map();
function dispose(obj) { obj.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); }); }
function getShot(idx) {
  if (!cache.has(idx)) {
    const sh = SHOTS[idx];
    cache.set(idx, (SCENES[sh.k] || placeholder)(sh.p || {}, { renderer }));
  }
  for (const k of [...cache.keys()]) if (k !== idx && k !== idx - 1 && k !== idx + 1) { dispose(cache.get(k).scene); cache.delete(k); }
  return cache.get(idx);
}
function setDustScale(scene, cam) {
  const s = H * PR / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
  scene.traverse(o => { if (o.isDust) o.material.uniforms.uScale.value = s; });
}
const shotIndexAt = beat => { const i = SHOTS.findIndex(s => beat >= s.s - 1e-9 && beat < s.s + s.l - 1e-9); return i < 0 ? SHOTS.length - 1 : i; };

const cracks = new Map();
function crackFor(beat) {
  if (!cracks.has(beat)) {
    const r = rng(beat * 13 + 1), a = W / H, L = new LineBuilder();
    crack(v3(r.range(-a, -a * 0.3), 1.1, 0), v3(r.range(a * 0.3, a), -1.1, 0), r, { depth: 7, rough: 0.28, branches: 4, branchLen: 0.3 })
      .forEach((pl, i) => L.poly(pl.map(p => p.setZ(0)), false, i ? '#ffcf70' : '#fff2d8', i ? 2 : 6));
    cracks.set(beat, L.build(1));
  }
  return cracks.get(beat);
}

// Render shot idx at (possibly fractional) frame f into the WebGL canvas.
function renderShot(idx, f, fx) {
  const sh = SHOTS[idx], cur = getShot(idx);
  const beat = f / BF;
  const local = clamp((beat - sh.s) / sh.l, 0, 0.9999);
  const [a, b] = sh.win || [0, 1];
  const u = a + (b - a) * local;
  const t = u * (sh.l * BEAT_SEC / (b - a)); // scene time runs at the speed its animation plays
  mainPass.scene = cur.scene; mainPass.camera = cur.cam;
  const post = cur.update(Math.min(u, 0.9999), t) || {};
  setDustScale(cur.scene, cur.cam);

  const last = ACCENTS.filter(k => k <= beat + 1e-9).pop();
  const pulse = last === undefined ? 0 : Math.exp(-(beat - last) * BEAT_SEC / 0.15);
  bloom.strength = (post.bloom ?? 0.6) * (1 + 0.3 * pulse);
  bloom.threshold = post.threshold ?? 0.9;
  renderer.toneMappingExposure = post.exposure ?? 1.0;

  overlay.clear();
  let flash = post.flash || 0;
  const framesIn = (beat - sh.s) * BF;
  if (sh.tr === 'crack' && framesIn < 6) { const c = crackFor(sh.s); c.material.opacity = 1 - framesIn / 6; overlay.add(c); flash = Math.max(flash, 0.22 * Math.exp(-framesIn / 1.5)); }

  grade.uniforms.uTime.value = Math.floor(f);
  grade.uniforms.uFlash.value = flash;
  grade.uniforms.uFade.value = (post.fade ?? 1) * fx.fade;
  grade.uniforms.uVignette.value = post.vignette ?? 0.9;
  grade.uniforms.uGrain.value = post.grain ?? 0.025;
  grade.uniforms.uZoom.value = fx.zoom;
  grade.uniforms.uRadial.value = fx.radial;
  grade.uniforms.uSpark.value = fx.spark;
  composer.render();
  return renderer.domElement;
}

// Transition effects for shot idx at frame f.
const ZOOM_OUT = 4, ZOOM_IN = 5, DISSOLVE = 8, FADEIN = 7;
function transitionFx(idx, f) {
  const sh = SHOTS[idx], next = SHOTS[idx + 1], beat = f / BF;
  const framesIn = (beat - sh.s) * BF, framesOut = (sh.s + sh.l - beat) * BF;
  const fx = { zoom: 1, radial: 0, spark: 0, fade: 1 };
  if (sh.tr === 'zoom' && framesIn < ZOOM_IN) { const k = framesIn / ZOOM_IN; fx.zoom = lerp(0.6, 1, easeOut(k)); fx.radial = (1 - k) * 1.2; fx.spark = (1 - k); }
  if (next && next.tr === 'zoom' && framesOut < ZOOM_OUT) { const k = 1 - framesOut / ZOOM_OUT; fx.zoom = lerp(1, 1.9, easeIn(k)); fx.radial = k * 1.4; fx.spark = k; }
  if (sh.tr === 'fadein' && framesIn < FADEIN) fx.fade = easeOut(framesIn / FADEIN);
  if (SILENCES.some(([a, b]) => beat >= a - 1e-9 && beat < b - 1e-9)) fx.fade = 0;
  return fx;
}

// Composite one output frame (handles dissolves) into a 2D canvas.
const comp = document.createElement('canvas'); comp.width = W * PR; comp.height = H * PR;
const cg = comp.getContext('2d');
function composite(f) {
  const idx = shotIndexAt(f / BF), sh = SHOTS[idx];
  const framesIn = (f / BF - sh.s) * BF;
  cg.globalAlpha = 1;
  if (sh.tr === 'dissolve' && idx > 0 && framesIn < DISSOLVE) {
    cg.drawImage(renderShot(idx - 1, f, transitionFx(idx - 1, Math.min(f, (sh.s) * BF - 0.01))), 0, 0);
    cg.globalAlpha = easeOut(framesIn / DISSOLVE);
  }
  cg.drawImage(renderShot(idx, f, transitionFx(idx, f)), 0, 0);
  cg.globalAlpha = 1;
  return comp;
}

// Output frame with optional motion blur (n sub-frames over a 180° shutter, clamped inside the shot).
const acc = document.createElement('canvas'); acc.width = W * PR; acc.height = H * PR;
const ag = acc.getContext('2d');
window.renderOut = function (f, n = 1) {
  const sh = SHOTS[shotIndexAt(f / BF)];
  const f0 = sh.s * BF, f1 = (sh.s + sh.l) * BF - 0.01;
  for (let j = 0; j < n; j++) {
    const fj = n > 1 ? Math.min(f1, Math.max(f0, f + (j / n - 0.5) * 0.5)) : f;
    ag.globalAlpha = 1 / (j + 1);
    ag.drawImage(composite(fj), 0, 0);
  }
  ag.globalAlpha = 1;
  return acc.toDataURL('image/png');
};
window.ready = true;
