// 御剑 YUJIAN — entry: builds the world once, exposes deterministic window.renderAt(t).
import * as THREE from 'three';
THREE.ColorManagement.enabled = false;
import { W, H } from './util.js';
import { ENV, skyMesh } from './materials.js';
import { bakeCloudAtlas, CloudField, cloudSea } from './clouds.js';
import { Post } from './post.js';
import { buildWorld } from './scene.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;

const _t0 = performance.now();
const atlas = bakeCloudAtlas(renderer);
console.error('T atlas', (performance.now() - _t0).toFixed(0));
const world = buildWorld(renderer, atlas);
console.error('T world', (performance.now() - _t0).toFixed(0));
const post = new Post(renderer);
const camera = new THREE.PerspectiveCamera(50, W / H, 2, 90000);
const heroCam = new THREE.PerspectiveCamera(50, W / H, 0.05, 400);
window.__world = world; window.__camera = camera;

window.renderAt = (t) => {
  const st = applyShot(t, world, camera, heroCam, post);
  ENV.uCamPos.value.copy(camera.position); ENV.uTime.value = t;
  if (window.DBG) { if (window.DBG.noFog) ENV.uFogDen.value = 0; if (window.DBG.noClouds) st.clouds = []; if (window.DBG.hide) for (const k of window.DBG.hide) world[k].visible = false; }
  camera.updateMatrixWorld();
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  world.update(t, camera, dir, st);
  post.render(r => {
    world.sky.position.copy(camera.position);
    r.render(world.scene, camera);
    if (st.hero) {
      heroCam.position.set(0, 0, 0); heroCam.updateMatrixWorld();
      r.clearDepth(); r.render(world.heroScene, heroCam);
    }
  });
  return true;
};
window.__t0 = _t0;
document.fonts.ready.then(() => Promise.all([
  document.fonts.load('500 60px "Noto Serif SC"', '传说上古有一架天梯众神由此上下后来断了凡人再也去一剑起万随不许梯就学会飞建木在都广帝所自淮南子'),
  document.fonts.load('200px "Zhi Mang Xing"', '御剑'), document.fonts.load('60px "Ma Shan Zheng"', '建木御剑'),
])).then(() => { console.error('T fonts', (performance.now() - _t0).toFixed(0)); window.__ready = true; });
