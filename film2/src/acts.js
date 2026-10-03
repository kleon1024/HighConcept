// FIRST LIGHT — the five acts. Each act: (ctx) => ({ scene, cam, update(t) }) with t = absolute film seconds.
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import {
  THREE, W, H, TAU, clamp, lerp, smooth, easeOut, easeIn, easeInOut, range, v3, col, rng, spring,
  camera, fullscreen, SPRITE_FS, GLSL_NOISE,
} from './core.js';
import { IGNITE, BEATS, PULSES, DIVISIONS, CLIMAX, EYE_OPEN } from './plan.js';

// beat envelope: 1 on each beat, decaying
export function beatPulse(t, beats = BEATS, decay = 0.18) {
  let last = -1e9; for (const b of beats) { if (b <= t) last = b; else break; }
  return Math.exp(-(t - last) / decay);
}

// ════════════════════════════════════════════════════════════════ I · VOID (0–5 s)
export function actVoid() {
  const fs = fullscreen(`
    uniform float uTime; uniform vec2 uRes; varying vec2 vUv;
    ${GLSL_NOISE}
    void main(){
      vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
      float t = uTime;
      float pull = smoothstep(4.0, 5.0, t);                       // the void inhales before the light pours out
      vec2 q = p * (1.0 + pull * 1.2 * smoothstep(0.9, 0.0, length(p)));
      float n = fbm(vec3(q * 2.6, t * 0.10));
      float n2 = fbm(vec3(q * 8.0 + n * 1.5, t * 0.25));
      vec3 c = vec3(0.045, 0.04, 0.11) * pow(n, 2.2) * 1.8 + vec3(0.08, 0.07, 0.19) * pow(n2, 5.0) * 2.2;
      // virtual particles blinking in and out of existence
      vec2 g = floor(q * 70.0), f = fract(q * 70.0) - 0.5;
      float h = hash1(vec3(g, floor(t * 5.0 + hash1(vec3(g, 3.0)) * 5.0)));
      c += vec3(0.55, 0.5, 1.0) * step(0.988, h) * exp(-dot(f, f) * 26.0) * 0.4 * (1.0 - pull);
      // the first light
      float r = length(p);
      float ign = smoothstep(${IGNITE.toFixed(2)}, ${(IGNITE + 0.12).toFixed(2)}, t);
      float bright = ign * (0.8 + 0.2 * sin(t * 3.1)) * (1.0 + pull * 4.0);
      c += vec3(1.0, 0.93, 0.78) * exp(-r * r * 4000.0) * 2.2 * bright;
      c += vec3(1.0, 0.72, 0.42) * exp(-r * 40.0) * 0.45 * bright;
      c += vec3(0.6, 0.5, 1.0) * exp(-r * 7.0) * 0.06 * bright;
      // closed strings vibrating around it
      float sa = smoothstep(2.7, 3.5, t) * (1.0 - pull);
      float ang = atan(p.y, p.x);
      for (int k = 0; k < 6; k++) {
        float fk = float(k), R = 0.055 + fk * 0.032, nn = 2.0 + mod(fk * 3.0, 6.0);
        float rr = R * (1.0 + 0.1 * sin(nn * ang + fk * 1.3) * sin(t * (5.0 + fk * 1.9)));
        c += vec3(1.0, 0.78, 0.48) * exp(-pow((r - rr) / 0.0016, 2.0)) * sa * (0.55 - fk * 0.07);
      }
      gl_FragColor = vec4(c, 1.0);
    }`, {});
  return { ...fs, update(t) { fs.mat.uniforms.uTime.value = t; return { bloom: 0.9 }; } };
}

// ════════════════════════════════════════════════════════════════ II · MATTER (5–10 s)
// cosmic web: Voronoi-like filaments between clustered nodes
function cosmicWeb(seed = 7) {
  const r = rng(seed), nodes = [];
  for (let i = 0; i < 90; i++) { const d = r.dir().multiplyScalar(12 * Math.pow(r(), 0.7)); d.y *= 0.75; nodes.push({ p: d, w: r.range(0.5, 1.6) }); }
  const edges = new Set();
  nodes.forEach((a, i) => nodes.map((b, j) => [a.p.distanceTo(b.p), j]).sort((x, y) => x[0] - y[0]).slice(1, 4).forEach(([, j]) => edges.add(i < j ? `${i}-${j}` : `${j}-${i}`)));
  return { nodes, edges: [...edges].map(e => e.split('-').map(Number)) };
}
export const WEB = cosmicWeb();
// the node we dive into: bright, off-centre
export const DIVE_NODE = WEB.nodes.map((n, i) => [n.p.distanceTo(v3(4, 1.5, 5)), i]).sort((a, b) => a[0] - b[0])[0][1];

export function actMatter() {
  const S = new THREE.Scene(), C = camera(50, 0.01, 400);
  const r = rng(11), NF = 120000, NN = 40000, N = NF + NN;
  const home = new Float32Array(N * 3), rnd = new Float32Array(N * 4), isNode = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    let p;
    if (i < NN) { const n = WEB.nodes[i % WEB.nodes.length]; const s = 0.09 * n.w * (i % WEB.nodes.length === DIVE_NODE ? 1.6 : 1); p = n.p.clone().add(v3(r.gauss(), r.gauss(), r.gauss()).multiplyScalar(s)); isNode[i] = 1; }
    else { const [a, b] = WEB.edges[i % WEB.edges.length]; const s = r(); const mid = Math.sin(Math.PI * s); p = WEB.nodes[a].p.clone().lerp(WEB.nodes[b].p, s).add(v3(r.gauss(), r.gauss(), r.gauss()).multiplyScalar(0.05 + 0.1 * mid)); }
    home.set([p.x, p.y, p.z], i * 3); rnd.set([r(), r(), r(), r()], i * 4);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  g.setAttribute('aHome', new THREE.BufferAttribute(home, 3));
  g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4));
  g.setAttribute('aNode', new THREE.BufferAttribute(isNode, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uPulse: { value: 0 }, uDim: { value: 1 }, uScale: { value: H / (2 * Math.tan(THREE.MathUtils.degToRad(25))) }, uSize: { value: 0.045 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aHome; attribute vec4 aRand; attribute float aNode;
      uniform float uT, uPulse, uScale, uSize, uDim; varying vec3 vC; varying float vA;
      vec3 rot(vec3 v, vec3 k, float a){ return v * cos(a) + cross(k, v) * sin(a) + k * dot(k, v) * (1.0 - cos(a)); }
      void main(){
        float delay = aRand.x * 0.6 + length(aHome) / 12.0 * 0.9;
        float e = clamp((uT - delay) / 2.6, 0.0, 1.0); e = 1.0 - pow(1.0 - e, 3.0);
        vec3 axis = normalize(aRand.yzw * 2.0 - 1.0 + 0.001);
        vec3 p = rot(aHome * e, axis, (1.0 - e) * 2.6);
        float turb = e * (1.0 - e) * 4.0;
        p += vec3(sin(p.y * 1.3 + uT * 1.1 + aRand.x * 6.0), sin(p.z * 1.1 - uT * 0.9 + aRand.y * 6.0), sin(p.x * 1.2 + uT * 0.7 + aRand.z * 6.0)) * 0.9 * turb;
        p += vec3(sin(uT * 0.4 + aRand.y * 20.0), sin(uT * 0.33 + aRand.z * 20.0), sin(uT * 0.37 + aRand.w * 20.0)) * 0.035;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float px = uSize * (aNode > 0.5 ? 1.5 : 1.0) * (0.5 + aRand.w) * uScale / -mv.z;
        gl_PointSize = clamp(px, 1.0, 12.0);
        vec3 hot = vec3(1.0, 0.9, 0.72) * 0.9;
        vec3 cool = aNode > 0.5 ? mix(vec3(1.0, 0.62, 0.26), vec3(1.0, 0.82, 0.5), aRand.z) * 1.3 : mix(vec3(0.25, 0.3, 1.0), vec3(0.75, 0.3, 1.0), aRand.y) * 1.2;
        vC = mix(hot, cool, e) * (1.0 + uPulse * (aNode > 0.5 ? 1.0 : 0.35));
        vA = (aNode > 0.5 ? 0.35 : 0.16) * clamp(px, 0.0, 1.0) * mix(0.12, 1.0, e) * smoothstep(0.15, 1.2, -mv.z) / max(1.0, px / 12.0) * 0.6 * uDim;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: SPRITE_FS,
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; S.add(pts);
  // faint deep-field stars
  const sr = rng(3), NS = 3000, sp = new Float32Array(NS * 3);
  for (let i = 0; i < NS; i++) { const d = sr.dir().multiplyScalar(120 + sr() * 60); sp.set([d.x, d.y, d.z], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  S.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: col('#8a86c0'), size: 1.2, sizeAttenuation: false, transparent: true, opacity: 0.5 })));
  const target = WEB.nodes[DIVE_NODE].p;
  return {
    scene: S, cam: C,
    update(t) {
      const lt = t - 5;
      m.uniforms.uT.value = lt; m.uniforms.uPulse.value = beatPulse(t);
      const back = easeOut(range(lt, 0, 3.4)), dive = easeInOut(range(lt, 3.3, 5.0));
      const a = 0.4 + lt * 0.12;
      const wide = v3(Math.sin(a) * lerp(1.5, 26, back), lerp(0.3, 6, back), Math.cos(a) * lerp(1.5, 26, back));
      const near = target.clone().add(target.clone().normalize().multiplyScalar(0.45)).add(v3(0, 0.08, 0));
      C.position.copy(wide).lerp(near, dive);
      C.lookAt(v3().lerp(target, smooth(range(lt, 2.8, 4.6))));
      m.uniforms.uDim.value = 1 - 0.75 * dive;
      return { bloom: 0.45, threshold: 0.7 };
    },
  };
}

// ════════════════════════════════════════════════════════════════ III · LIFE (10–17 s)
export function actLife() {
  const S = new THREE.Scene(), C = camera(42, 0.01, 200);
  S.background = col('#020a0c');
  const membrane = new THREE.ShaderMaterial({
    uniforms: { uPulse: { value: 0 }, uT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; vW = position; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uPulse, uT; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      ${GLSL_NOISE}
      void main(){
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.3);
        float grain = fbm(vW * 14.0 + uT * 0.3);
        vec3 rim = mix(vec3(0.35, 1.0, 0.85), vec3(1.0, 0.45, 0.75), smoothstep(-0.3, 0.6, vN.y + grain * 0.4 - 0.2));
        vec3 c = mix(vec3(0.01, 0.06, 0.06), rim, f) * (0.05 + 0.75 * f) * (0.7 + 0.6 * grain) * (1.0 + uPulse * 0.6);
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mc = new MarchingCubes(88, membrane, false, false, 200000);
  mc.isolation = 80; mc.scale.setScalar(3); S.add(mc);
  // nuclei: golden chromatin clouds inside each cell
  const NPC = 260, LEAVES = 16, NNUC = NPC * LEAVES;
  const nr = rng(5), off = new Float32Array(NNUC * 3), nucPos = new Float32Array(NNUC * 3), nucRnd = new Float32Array(NNUC);
  for (let i = 0; i < NNUC; i++) { const d = nr.dir().multiplyScalar(Math.pow(nr(), 0.6)); off.set([d.x, d.y, d.z], i * 3); nucRnd[i] = nr(); }
  const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.BufferAttribute(nucPos, 3)); ng.setAttribute('aR', new THREE.BufferAttribute(nucRnd, 1));
  const nucMat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: H / (2 * Math.tan(THREE.MathUtils.degToRad(21))) }, uPulse: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aR; uniform float uScale, uPulse; varying vec3 vC; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float px = 0.022 * uScale / -mv.z; gl_PointSize = clamp(px, 1.0, 30.0);
        vC = mix(vec3(1.0, 0.7, 0.35), vec3(1.0, 0.9, 0.7), aR) * (0.7 + uPulse * 0.6); vA = 0.35 * clamp(px, 0.0, 1.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: SPRITE_FS,
  });
  const nuc = new THREE.Points(ng, nucMat); nuc.frustumCulled = false; S.add(nuc);
  // plankton drifting in the deep
  const pr = rng(9), NP = 4000, pp = new Float32Array(NP * 3);
  for (let i = 0; i < NP; i++) pp.set([pr.range(-12, 12), pr.range(-8, 8), pr.range(-14, 6)], i * 3);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const plankton = new THREE.Points(pg, new THREE.PointsMaterial({ color: col('#2a8a80'), size: 0.03, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  S.add(plankton);
  // division geometry: each generation splits along a new axis
  const axes = [v3(1, 0.15, 0).normalize(), v3(0.1, 1, 0.2).normalize(), v3(0.2, -0.1, 1).normalize(), v3(1, -1, 0.6).normalize()];
  const seps = [0.11, 0.08, 0.06, 0.045];
  const leafPos = (i, t) => {
    const p = v3(0.5, 0.5, 0.5);
    for (let j = 0; j < 4; j++) { const k = clamp(spring((t - DIVISIONS[j]) / 0.55), -0.2, 1.3); const sgn = (i >> j) & 1 ? 1 : -1; p.addScaledVector(axes[j], sgn * seps[j] * k); }
    return p;
  };
  return {
    scene: S, cam: C,
    leafWorld: (i, t) => leafPos(i, t).subScalar(0.5).multiplyScalar(6).applyEuler(mc.rotation),
    update(t) {
      const lt = t - 10, pulse = beatPulse(t);
      membrane.uniforms.uPulse.value = pulse; membrane.uniforms.uT.value = lt; nucMat.uniforms.uPulse.value = pulse;
      mc.rotation.set(0.2, lt * 0.18, 0.05);
      mc.reset();
      const leaves = [];
      for (let i = 0; i < LEAVES; i++) { const p = leafPos(i, t); leaves.push(p); mc.addBall(p.x, p.y, p.z, 0.19, 12); }
      mc.update();
      // nuclei follow their cells; size shrinks as cells divide
      const gen = DIVISIONS.filter(d => t >= d).length, nucR = 0.42 / Math.pow(2, gen * 0.45);
      for (let i = 0; i < NNUC; i++) {
        const leaf = leaves[i % LEAVES].clone().subScalar(0.5).multiplyScalar(6);
        const o = v3(off[i * 3], off[i * 3 + 1], off[i * 3 + 2]).multiplyScalar(nucR * (1 + 0.05 * Math.sin(lt * 3 + i)));
        const w = leaf.add(o).applyEuler(mc.rotation);
        nucPos.set([w.x, w.y, w.z], i * 3);
      }
      ng.attributes.position.needsUpdate = true;
      plankton.rotation.y = lt * 0.02;
      const out = easeOut(range(lt, 0, 1.6)), push = easeInOut(range(lt, 5.6, 7));
      const a = 0.3 + lt * 0.16;
      const camP = v3(Math.sin(a) * lerp(0.6, 4.6, out), lerp(0.05, 0.9, out), Math.cos(a) * lerp(0.6, 4.6, out));
      C.position.copy(camP).lerp(camP.clone().multiplyScalar(0.55).add(v3(0, 0.4, 0)), push);
      C.lookAt(0, 0, 0);
      return { bloom: 0.6 };
    },
  };
}

// ════════════════════════════════════════════════════════════════ IV · MIND (17–25 s)
function growArbor(roots, seed = 21) {
  const r = rng(seed), V = [], B = [], D = [], L = []; // positions, birth, path distance, level
  const GROW = 3.2; // units per second
  const branch = (p, dir, len, level, birth, dist) => {
    let cur = p.clone(), d = dir.clone();
    for (let s = 0; s < 4; s++) {
      d.add(r.dir().multiplyScalar(0.28)).add(p.clone().normalize().multiplyScalar(0.12)).normalize();
      const nxt = cur.clone().addScaledVector(d, len / 4);
      V.push(cur.x, cur.y, cur.z, nxt.x, nxt.y, nxt.z);
      B.push(birth + dist / GROW, birth + (dist + len / 4) / GROW);
      D.push(dist, dist + len / 4); L.push(level, level);
      dist += len / 4; cur = nxt;
    }
    if (level >= 6) return;
    const kids = level < 2 ? 3 : r() < 0.25 ? 3 : 2;
    for (let k = 0; k < kids; k++) {
      const nd = d.clone().applyAxisAngle(r.dir().cross(d).normalize(), r.range(0.35, 0.8)).normalize();
      branch(cur, nd, len * r.range(0.72, 0.86), level + 1, birth, dist);
    }
  };
  roots.forEach((p, i) => { for (let k = 0; k < 2; k++) branch(p, p.clone().normalize().add(r.dir().multiplyScalar(0.7)).normalize(), 2.4, 0, r.range(0, 0.4), 0); });
  return { V: new Float32Array(V), B: new Float32Array(B), D: new Float32Array(D), L: new Float32Array(L) };
}

export function actMind(life) {
  const S = new THREE.Scene(), C = camera(55, 0.01, 300);
  S.background = col('#010508'); S.fog = new THREE.FogExp2(0x010508, 0.035);
  const roots = []; for (let i = 0; i < 16; i++) roots.push(life.leafWorld(i, 17));
  const A = growArbor(roots);
  const pulses = PULSES.map(p => p - 17);
  const uni = {
    uT: { value: 0 }, uPulses: { value: new Float32Array(64).fill(-100) }, uN: { value: Math.min(64, pulses.length) },
    uSpeed: { value: 7.5 }, uSync: { value: 0 }, uScale: { value: H / (2 * Math.tan(THREE.MathUtils.degToRad(27.5))) },
  };
  uni.uPulses.value.set(pulses.slice(0, 64));
  const common = `
    attribute float aBirth; attribute float aDist; attribute float aLevel;
    uniform float uT, uPulses[64], uSpeed, uSync, uScale, uN;
    varying vec3 vC; varying float vA;
    vec3 shade(){
      float I = 0.0;
      for (int i = 0; i < 64; i++) { if (float(i) >= uN) break; float pt = uPulses[i]; if (pt > uT || uT - pt > 3.0) continue;
        float x = (uT - pt) * uSpeed; I += exp(-pow((aDist - x) / 0.55, 2.0)) * exp(-(uT - pt) * 0.5); }
      float tip = exp(-max(0.0, uT - aBirth) * 6.0);
      vec3 base = mix(vec3(0.12, 0.55, 0.7), vec3(0.35, 0.25, 0.8), aLevel / 7.0) * (0.16 - aLevel * 0.012);
      return base * 1.6 + vec3(1.0, 0.72, 0.35) * (I * 0.9 + tip * 0.6) + vec3(1.0, 0.75, 0.45) * uSync * 0.7;
    }`;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(A.V, 3));
  geo.setAttribute('aBirth', new THREE.BufferAttribute(A.B, 1));
  geo.setAttribute('aDist', new THREE.BufferAttribute(A.D, 1));
  geo.setAttribute('aLevel', new THREE.BufferAttribute(A.L, 1));
  const lineMat = new THREE.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: common + `void main(){ vC = shade(); vA = step(aBirth, uT); vec4 mv = modelViewMatrix * vec4(position, 1.0); vA *= exp(-max(0.0, -mv.z - 6.0) * 0.05); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: 'varying vec3 vC; varying float vA; void main(){ if (vA < 0.01) discard; gl_FragColor = vec4(vC * vA, 1.0); }',
  });
  const lines = new THREE.LineSegments(geo, lineMat); lines.frustumCulled = false; S.add(lines);
  const ptMat = new THREE.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: common + `void main(){ vC = shade(); vec4 mv = modelViewMatrix * vec4(position, 1.0); float px = 0.09 * (1.0 - aLevel / 9.0) * uScale / -mv.z;
      gl_PointSize = clamp(px, 1.0, 26.0); vA = step(aBirth, uT) * 0.22 * clamp(px, 0.0, 1.0) * exp(-max(0.0, -mv.z - 6.0) * 0.05); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: SPRITE_FS,
  });
  const pts = new THREE.Points(geo, ptMat); pts.frustumCulled = false; S.add(pts);
  // the cell cluster the neurons sprout from, fading away
  const cellMat = new THREE.MeshBasicMaterial({ color: col('#2aa89a'), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  
  // the camera spirals outward through the growing arbor, accelerating with the tempo
  const at = k => { const th = 0.6 + k * 4.2, R = lerp(2.6, 7.0, k); return v3(Math.sin(th) * R, Math.sin(k * 5) * 1.6 + 0.6, Math.cos(th) * R); };
  return {
    scene: S, cam: C,
    update(t) {
      const lt = t - 17;
      uni.uT.value = lt;
      uni.uSync.value = t >= CLIMAX ? Math.exp(-(t - CLIMAX) / 0.25) : 0;
      cellMat.opacity = 0.18 * (1 - range(lt, 0.0, 1.0));
      const k = Math.pow(range(lt, 0, CLIMAX - 17 + 0.3), 1.5);
      C.position.copy(at(k));
      C.lookAt(at(Math.min(1, k + 0.08)).multiplyScalar(0.45));
      C.rotateZ(Math.sin(lt * 0.4) * 0.12);
      return { bloom: 0.55 + 0.6 * uni.uSync.value };
    },
  };
}

// ════════════════════════════════════════════════════════════════ V · SEEING (25.35–30 s)
export function actSeeing() {
  const fs = fullscreen(`
    uniform float uTime, uOpen, uPupil, uZoom, uSeed, uFade; uniform vec2 uRes; varying vec2 vUv;
    ${GLSL_NOISE}
    void main(){
      vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0) / uZoom;
      float r = length(p), a = atan(p.y, p.x);
      // the aperture of the lids
      float w = 0.98, hh = uOpen * 0.43 * max(0.0, 1.0 - pow(p.x / w, 2.0));
      float inside = smoothstep(0.0, 0.008, hh - abs(p.y));
      float R = 0.34;
      // iris: radial fibres grown like the neurons of the previous act
      float warp = fbm(vec3(cos(a) * 3.0, sin(a) * 3.0, r * 4.0));
      float fib = pow(1.0 - abs(sin(a * 70.0 + warp * 9.0)), 6.0);
      float fib2 = pow(1.0 - abs(sin(a * 23.0 + warp * 5.0 + r * 6.0)), 10.0);
      float crypt = smoothstep(0.55, 0.75, fbm(vec3(p * 18.0, 2.0)));
      vec3 iris = mix(vec3(1.0, 0.62, 0.22), vec3(0.16, 0.55, 0.55), smoothstep(0.1, R, r));
      iris *= 0.35 + 0.5 * fib + 0.3 * fib2 - 0.25 * crypt;
      iris += vec3(1.0, 0.8, 0.45) * fib2 * 0.6 * smoothstep(R, 0.12, r) * (0.6 + 0.4 * sin(uTime * 2.0 - r * 30.0));
      float collarette = exp(-pow((r - 0.15 - 0.012 * sin(a * 14.0)) / 0.008, 2.0));
      iris += vec3(1.0, 0.75, 0.4) * collarette * 0.5;
      iris *= mix(1.0, 0.15, smoothstep(R - 0.05, R, r));                    // limbal ring
      vec3 sclera = vec3(0.16, 0.14, 0.13) * (1.0 - r * 0.7) + vec3(0.25, 0.06, 0.05) * pow(fbm(vec3(p * 30.0, 1.0)), 6.0) * 0.4;
      vec3 eye = mix(iris, sclera, smoothstep(R - 0.004, R + 0.004, r));
      // the pupil, and in it the first light
      float pu = smoothstep(uPupil + 0.004, uPupil - 0.004, r);
      eye = mix(eye, vec3(0.0), pu);
      vec2 hp = p - vec2(-0.075, 0.08);
      eye += vec3(1.0, 0.95, 0.9) * smoothstep(0.035, 0.015, length(hp * vec2(1.0, 1.4))) * 0.35;   // wet highlight
      float sr = length(p - vec2(0.018, 0.012));
      eye += vec3(1.0, 0.85, 0.6) * (exp(-sr * sr * 12000.0) * 1.8 + exp(-sr * 60.0) * 0.2) * pu;
      vec3 skin = vec3(0.025, 0.016, 0.012) * (1.0 - r);
      skin += vec3(1.0, 0.7, 0.45) * exp(-abs(abs(p.y) - hh) / 0.003) * 0.25 * smoothstep(0.0, 0.05, uOpen) * step(abs(p.x), w);
      vec3 c = mix(skin, eye, inside);
      // after the pupil swallows the frame: the seed of light again
      float s0 = length((vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0));
      c = c * uFade + vec3(1.0, 0.93, 0.78) * (exp(-s0 * s0 * 4000.0) * 2.2 + exp(-s0 * 40.0) * 0.4) * uSeed;
      gl_FragColor = vec4(c, 1.0);
    }`, { uOpen: { value: 0 }, uPupil: { value: 0.08 }, uZoom: { value: 1 }, uSeed: { value: 0 }, uFade: { value: 1 } });
  return {
    ...fs,
    update(t) {
      const u = fs.mat.uniforms;
      u.uTime.value = t;
      u.uOpen.value = easeInOut(range(t, 25.6, EYE_OPEN + 0.4));
      const dil = easeIn(range(t, 28.4, 29.5));
      u.uPupil.value = lerp(0.075 + 0.006 * Math.sin(t * 2.2), 1.6, dil);
      u.uZoom.value = lerp(1.0, 1.35, easeInOut(range(t, 25.6, 29.5)));
      u.uFade.value = 1 - range(t, 29.4, 29.55);
      u.uSeed.value = smooth(range(t, 29.6, 29.75));
      return { bloom: 0.8 };
    },
  };
}
