// II 冻 (frost: iceberg, water, ouroboros, dna) and III 生 (genesis: mitosis, synapse, eden, cambrian, lightning).
import {
  THREE, TAU, W, H, clamp, lerp, smooth, smoother, easeOut, easeIn, easeInOut, settle, range, v3, col, rng, fbm, noise3,
  displace, backdrop, rig, mats, canvasTexture, noiseTexture, envMap, Dust, LineBuilder, tube, crack,
  camera, look, orbit, drift, mergeVertices,
} from '../core.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ================================================================ local helpers
const Y = v3(0, 1, 0);

// tube whose radius follows rFn(s), s ∈ [0,1] along the curve
function taperTube(points, rFn, seg = 64, radial = 10, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed);
  const g = new THREE.TubeGeometry(curve, seg, 1, radial, closed);
  const P = g.attributes.position, c = v3(), p = v3();
  for (let i = 0; i <= seg; i++) {
    curve.getPointAt(i / seg, c); const r = rFn(i / seg);
    for (let j = 0; j <= radial; j++) { const k = i * (radial + 1) + j; p.fromBufferAttribute(P, k).sub(c).multiplyScalar(r).add(c); P.setXYZ(k, p.x, p.y, p.z); }
  }
  g.computeVertexNormals();
  return g;
}

// animatable swept tube: rings × radial grid, positions rewritten each frame
function sweepGeometry(rings, radial) {
  const g = new THREE.BufferGeometry(), I = [], U = [];
  for (let i = 0; i < rings; i++) for (let j = 0; j <= radial; j++) U.push(i / (rings - 1), j / radial);
  for (let i = 0; i < rings - 1; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; I.push(a, a + 1, b, b, a + 1, b + 1); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(rings * (radial + 1) * 3), 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(rings * (radial + 1) * 3), 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I);
  g.userData = { rings, radial };
  return g;
}
// pts: centres; frames: [{d: dorsal unit, s: side unit}] (optional, else parallel transport); rad: [rd, rs]
function sweepSet(g, pts, rad, frames = null, up = v3(0, 1, 0)) {
  const { rings, radial } = g.userData, P = g.attributes.position, N = g.attributes.normal;
  let D = null; const T = v3(), S = v3(), o = v3(), n = v3();
  for (let i = 0; i < rings; i++) {
    let d, s;
    if (frames) { d = frames[i].d; s = frames[i].s; }
    else {
      T.copy(pts[Math.min(i + 1, rings - 1)]).sub(pts[Math.max(i - 1, 0)]).normalize();
      if (!D) D = up.clone();
      D.sub(T.clone().multiplyScalar(D.dot(T))).normalize();
      S.crossVectors(T, D); d = D; s = S;
    }
    const [rd, rs] = rad[i];
    for (let j = 0; j <= radial; j++) {
      const a = j / radial * TAU, ca = Math.cos(a), sa = Math.sin(a), k = i * (radial + 1) + j;
      o.copy(d).multiplyScalar(ca * rd).addScaledVector(s, sa * rs).add(pts[i]);
      n.copy(d).multiplyScalar(ca * (rs + 1e-4)).addScaledVector(s, sa * (rd + 1e-4)).normalize();
      P.setXYZ(k, o.x, o.y, o.z); N.setXYZ(k, n.x, n.y, n.z);
    }
  }
  P.needsUpdate = true; N.needsUpdate = true; g.computeBoundingSphere();
}

// cylinder from a to b (pivot at a, so scale.y reveals it)
function stick(a, b, r, mat, radial = 16) {
  const len = a.distanceTo(b), g = new THREE.CylinderGeometry(r, r, 1, radial, 1, true); g.translate(0, 0.5, 0);
  const m = new THREE.Mesh(g, mat); m.position.copy(a);
  m.quaternion.setFromUnitVectors(Y, b.clone().sub(a).normalize()); m.scale.set(1, len, 1); m.userData.len = len;
  return m;
}
const ball = (r, mat, p, seg = 40) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.6)), mat); m.position.copy(p); return m; };

// tileable normal map from fbm heights
function normalTexture(key, { size = 256, scale = 6, octaves = 4, strength = 2 } = {}) {
  return canvasTexture(key, size, size, (g, w, h) => {
    const hgt = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = x / w * TAU, b = y / h * TAU, R = scale / TAU; hgt[y * w + x] = fbm(Math.cos(a) * R + 5, Math.sin(a) * R + Math.cos(b) * R, Math.sin(b) * R, octaves); }
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (hgt[y * w + (x + 1) % w] - hgt[y * w + (x + w - 1) % w]) * strength * w / 64, dy = (hgt[((y + 1) % h) * w + x] - hgt[((y + h - 1) % h) * w + x]) * strength * h / 64;
      const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
      img.data[i] = (-dx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, { srgb: false });
}

// fixed version of the rim term: view vector in view space is -vViewPosition
function rim(m, color, power = 2.5, k = 1) {
  const uni = { uRim: { value: col(color).multiplyScalar(k) }, uRimP: { value: power } };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, uni);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uRim; uniform float uRimP;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ float fr = 1.0 - abs(dot(normalize(vViewPosition), normal)); totalEmissiveRadiance += uRim * pow(fr, uRimP); }');
  };
  m.customProgramCacheKey = () => 'rim' + power;
  return uni;
}

// soft additive light shaft (cone), for underwater / volumetric light
function shaft(len, r0, r1, color, k = 0.15) {
  const g = new THREE.CylinderGeometry(r0, r1, len, 32, 1, true); g.translate(0, -len / 2, 0);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { c: { value: col(color).multiplyScalar(k) }, len: { value: len }, o: { value: 1 } },
    vertexShader: 'varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = -position.y; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 c; uniform float len; uniform float o; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float e = pow(abs(dot(vN, vV)), 2.0); float f = smoothstep(0.0, 0.08, vY/len) * (1.0 - smoothstep(0.2, 1.0, vY/len)); gl_FragColor = vec4(c * e * f * o, 1.0); }',
  });
  return new THREE.Mesh(g, m);
}

function pixelScale(renderer, cam) { return H * renderer.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))); }

// ================================================================ ICEBERG
function bergGeometry() {
  const g = displace(new THREE.IcosahedronGeometry(1, 40), v => {
    const d = v.clone().normalize();
    const n1 = fbm(d.x * 1.3 + 2, d.y * 1.3, d.z * 1.3, 4), n2 = fbm(d.x * 4 + 7, d.y * 4, d.z * 4, 3);
    const ridge = 1 - Math.abs(noise3(d.x * 2.6 + 1, d.y * 2.6, d.z * 2.6));
    const r = 1 + 0.32 * n1 + 0.06 * n2 + 0.08 * ridge * ridge;
    const p = v3(d.x * 5.4 * r, d.y * 6.4 * r, d.z * 4.0 * r);
    // the tip: a narrow, angular peak breaking the surface off-centre
    const tp = smooth((d.y - 0.62) / 0.38);
    p.x = p.x * (1 - 0.72 * tp) + 0.9 * tp; p.z *= (1 - 0.66 * tp);
    p.y += Math.pow(tp, 1.2) * 3.4 + 0.6 * tp * fbm(d.x * 6, d.z * 6, 3, 3) + 0.5 * tp * Math.max(0, d.x);
    p.y -= 6.75;
    return p;
  });
  return g;
}

function icebergShot() {
  const R = rng(23);
  const world = new THREE.Scene();
  // sky (above) and deep water (below) domes: swapped per render
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {},
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec3 vP; void main(){
      float h = vP.y;
      vec3 zen = vec3(0.006,0.025,0.06), mid = vec3(0.05,0.17,0.28), hor = vec3(0.42,0.55,0.62), warm = vec3(1.0,0.58,0.40);
      vec3 c = mix(mid, zen, smoothstep(0.05, 0.6, h));
      c = mix(hor, c, smoothstep(0.0, 0.22, h));
      float sunAz = max(0.0, dot(normalize(vec3(vP.x, 0.0, vP.z)), normalize(vec3(-0.75, 0.0, -0.65))));
      c += warm * pow(sunAz, 6.0) * exp(-max(h,0.0) * 14.0) * 0.9;
      c = mix(c, vec3(0.02,0.07,0.1), 1.0 - smoothstep(-0.02, 0.0, h));
      gl_FragColor = vec4(c, 1.0); }`,
  });
  const deepMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec3 vP; void main(){ float h = vP.y;
      vec3 c = mix(vec3(0.004,0.03,0.05), vec3(0.03,0.22,0.30), smoothstep(-0.7, 0.25, h));
      gl_FragColor = vec4(c, 1.0); }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), skyMat); dome.renderOrder = -10; world.add(dome);

  // environment for reflections: the twilight sky itself
  const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), skyMat));
  const pm = new THREE.PMREMGenerator(window.__r); const env = pm.fromScene(envScene, 0.02).texture; pm.dispose();
  world.environment = env; world.environmentIntensity = 1.0;

  // lights: low polar sun from behind-left, cool sky fill, and light from above for the deep
  const sun = new THREE.DirectionalLight(col('#ffe2c8'), 2.6); sun.position.set(-9, 3.2, -4); world.add(sun);
  const front = new THREE.DirectionalLight(col('#cfeaff'), 1.2); front.position.set(6, 5, 12); world.add(front);
  const hemi = new THREE.HemisphereLight(col('#9fd4ea'), col('#06222e'), 0.7); world.add(hemi);

  // the iceberg
  const bump = noiseTexture('ice-bump-fine', { scale: 18, contrast: 1.4 });
  const bergMat = new THREE.MeshPhysicalMaterial({ color: col('#e8f7ff'), roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.15, sheen: 0.6, sheenColor: col('#9fe6ff'), bumpMap: bump, bumpScale: 1.2, transparent: true });
  const forms = [v3(0.3, -5.6, 2.2), v3(-2.3, -3.0, 1.9), v3(2.5, -3.2, 1.6), v3(-1.0, -8.6, 1.6)];
  const bU = { uForms: { value: forms }, uGlow: { value: 1 }, uUnder: { value: 0 } };
  bergMat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, bU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform vec3 uForms[4]; uniform float uGlow; uniform float uUnder;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float below = 1.0 - smoothstep(-0.3, 0.05, vWP.y);
        float gl = 0.0; for (int i = 0; i < 4; i++) { float d = length(vWP - uForms[i]); gl += exp(-d * 0.75) * (i == 0 ? 1.4 : 0.8); }
        float fr = 1.0 - abs(dot(normalize(vViewPosition), normal));
        totalEmissiveRadiance += vec3(1.0, 0.62, 0.22) * gl * uGlow * below * (0.35 + 0.65 * (1.0 - fr));
        totalEmissiveRadiance += vec3(0.25, 0.75, 0.9) * pow(fr, 3.0) * below * 0.35;`)
      .replace('#include <opaque_fragment>', '#include <opaque_fragment>\n gl_FragColor.a = mix(1.0, mix(0.5, 0.92, pow(fr, 1.5)), below);');
  };
  const berg = new THREE.Mesh(bergGeometry(), bergMat); world.add(berg);

  // buried golden forms: an egg (the origin), a coiled serpent (what is to come), shards
  const goldM = mats.gold({ emissive: col('#ff9a2a'), emissiveIntensity: 0.9, roughness: 0.25 });
  const eggPts = []; for (let i = 0; i <= 40; i++) { const y = -Math.cos(Math.PI * i / 40); eggPts.push(new THREE.Vector2(Math.max(1e-3, 0.74 * Math.sqrt(1 - y * y) * (1 - 0.12 * y)), y)); }
  const egg = new THREE.Mesh(new THREE.LatheGeometry(eggPts, 48), goldM); egg.position.copy(forms[0]); egg.scale.setScalar(1.4); egg.rotation.z = 0.35; world.add(egg);
  const coil = []; for (let i = 0; i <= 120; i++) { const s = i / 120, a = s * TAU * 2.4; coil.push(v3(Math.cos(a) * (0.55 - 0.25 * s), s * 0.9 - 0.45, Math.sin(a) * (0.55 - 0.25 * s))); }
  const coilM = new THREE.Mesh(taperTube(coil, s => 0.11 * (1 - 0.8 * s) + 0.02, 160, 10), goldM); coilM.position.copy(forms[1]); coilM.scale.setScalar(1.3); coilM.rotation.set(0.5, 0, 0.3); world.add(coilM);
  [forms[2], forms[3]].forEach((f, i) => { const o = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), goldM); o.position.copy(f); o.scale.set(0.7, 1.5, 0.7); o.rotation.set(0.3 + i, i, 0.4); world.add(o); });
  const inner = new THREE.PointLight(col('#ffb050'), 40, 12, 2); inner.position.copy(forms[0]).add(v3(0, 0, 0.8)); world.add(inner);

  // water: top surface (seen from above) and underside (seen from below)
  const wn = normalTexture('water-n', { size: 256, scale: 5, strength: 3 }); wn.repeat.set(18, 18);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshPhysicalMaterial({ color: col('#03141c'), roughness: 0.06, metalness: 0, normalMap: wn, normalScale: new THREE.Vector2(0.35, 0.35), clearcoat: 1 }));
  top.rotation.x = -Math.PI / 2; world.add(top);
  const uMat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: { t: { value: 0 } },
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform float t; varying vec3 vW;
      void main(){
        vec3 v = normalize(vW - cameraPosition); float d = length(vW - cameraPosition);
        float rip = sin(vW.x*1.7 + t*1.3) * sin(vW.z*1.3 - t) + 0.5*sin(vW.x*3.9 - vW.z*2.7 + t*2.1);
        float up = clamp(v.y, 0.0, 1.0);
        float snell = smoothstep(0.55, 0.85, up + rip * 0.04);
        vec3 c = mix(vec3(0.02, 0.16, 0.22), vec3(0.55, 0.85, 0.95), snell);
        c += vec3(0.25,0.6,0.7) * pow(max(0.0, rip * 0.5 + 0.5), 6.0) * 0.4 * exp(-d*0.05);
        c = mix(vec3(0.02,0.14,0.19), c, exp(-d * 0.05));
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const under = new THREE.Mesh(new THREE.PlaneGeometry(600, 600, 1, 1), uMat); under.rotation.x = -Math.PI / 2; under.position.y = -0.001; world.add(under);

  // underwater light shafts and suspended motes
  const shafts = new THREE.Group(); world.add(shafts);
  for (let i = 0; i < 7; i++) { const s = shaft(16, 0.4, R.range(1.5, 2.5), '#7fe3ff', 0.05); s.position.set(R.range(-11, 11), 0, R.range(-4, 6)); s.rotation.set(R.range(-0.15, 0.15), 0, R.range(0.15, 0.35)); shafts.add(s); }
  const motes = new Dust(500, { size: 0.025, color: '#bff4ff', intensity: 1.2 }); world.add(motes);
  for (let i = 0; i < 500; i++) { motes.set(i, R.range(-14, 14), R.range(-10, -0.2), R.range(-2, 14)); motes.alpha[i] = R.range(0.1, 0.5); }
  motes.dirty(true);

  // two cameras (above / below the waterline), composited with a wavy meniscus
  const Ca = camera(38, 0.1, 1000), Cu = camera(38, 0.1, 1000);
  const PR = window.__r.getPixelRatio();
  const mk = () => new THREE.WebGLRenderTarget(W * PR, H * PR, { type: THREE.HalfFloatType, samples: 4 });
  const rtA = mk(), rtB = mk();
  const comp = new THREE.Scene(), oc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2); oc.position.z = 1;
  const compU = { tA: { value: rtA.texture }, tB: { value: rtB.texture }, split: { value: 0.5 }, t: { value: 0 }, asp: { value: W / H } };
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: compU, depthWrite: false, depthTest: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tA, tB; uniform float split, t, asp; varying vec2 vUv;
      void main(){
        float x = vUv.x * asp;
        float wl = split + 0.010*sin(x*5.0 + t*2.2) + 0.006*sin(x*13.0 - t*3.1) + 0.003*sin(x*31.0 + t*5.0);
        float d = vUv.y - wl;
        vec2 ruv = vUv + vec2(0.0, -0.012 * exp(-abs(d) * 30.0));
        vec3 a = texture2D(tA, vUv).rgb;
        vec3 b = texture2D(tB, ruv).rgb;
        vec3 c = d > 0.0 ? a : b;
        float line = exp(-abs(d) * 420.0);
        c = mix(c, vec3(0.75, 0.92, 1.0) * 1.1, line * 0.85);
        c *= 1.0 - 0.35 * exp(-max(-d, 0.0) * 90.0) * step(d, 0.0) * (1.0 - line);
        gl_FragColor = vec4(c, 1.0); }`,
  }));
  quad.frustumCulled = false; comp.add(quad);

  return {
    scene: comp, cam: oc,
    update(u, t) {
      const r = window.__r;
      const sink = easeInOut(u);
      wn.offset.set(t * 0.02, t * 0.013);
      uMat.uniforms.t.value = t; compU.t.value = t;
      compU.split.value = lerp(0.47, 0.66, sink);
      // gentle bob
      berg.rotation.y = -0.25 + t * 0.03; egg.rotation.y = t * 0.4;
      [egg, coilM].forEach(o => o.position.applyAxisAngle && null);
      const bob = Math.sin(t * 1.4) * 0.05;
      const camZ = lerp(24, 22.5, u), camX = lerp(1.8, 1.2, u);
      bU.uGlow.value = lerp(0.7, 1.15, smooth(range(u, 0.1, 0.9)));
      // above
      dome.material = skyMat; dome.position.set(camX, 0, camZ); top.visible = true; under.visible = false; shafts.visible = false; motes.visible = false;
      world.fog = new THREE.Fog(col('#3a6476'), 60, 300);
      look(Ca, v3(camX, lerp(0.9, 0.5, sink) + bob, camZ), v3(0.4, lerp(0.6, 1.4, sink), 0));
      const prev = r.getRenderTarget();
      r.setRenderTarget(rtA); r.render(world, Ca);
      // below
      dome.material = deepMat; top.visible = false; under.visible = true; shafts.visible = true; motes.visible = true;
      world.fog = new THREE.FogExp2(col('#06303c'), 0.032);
      motes.material.uniforms.uScale.value = pixelScale(r, Cu);
      look(Cu, v3(camX, lerp(-0.6, -1.6, sink) + bob, camZ), v3(0.3, lerp(-4.6, -5.0, sink), 0));
      r.setRenderTarget(rtB); r.render(world, Cu);
      r.setRenderTarget(prev);
      return { bloom: 0.5, threshold: 0.85, exposure: 1.0 };
    },
  };
}

// ================================================================ WATER
// skeletal formulas: atoms (2D, bond length 1) + bonds [i, j, order]
function hexPt(k) { const a = (90 + 60 * k) * Math.PI / 180; return v3(Math.cos(a), Math.sin(a), 0); }
function adenine() {
  const hx = [0, 1, 2, 3, 4, 5].map(hexPt);
  const c = v3(0.866 + 0.688, 0, 0), pr = 0.851, pp = a => c.clone().add(v3(Math.cos(a * Math.PI / 180) * pr, Math.sin(a * Math.PI / 180) * pr, 0));
  // 0 C6, 1 N1, 2 C2, 3 N3, 4 C4, 5 C5, 6 N7, 7 C8, 8 N9, 9 N6(amine)
  const atoms = [...hx, pp(72), pp(0), pp(-72), v3(0, 2, 0)];
  const el = ['C', 'N', 'C', 'N', 'C', 'C', 'N', 'C', 'N', 'N'];
  const bonds = [[9, 0, 1], [0, 1, 2], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1], [5, 6, 1], [6, 7, 2], [7, 8, 1], [8, 4, 1]];
  return { atoms, el, bonds, centres: [v3(0, 0, 0), c] };
}
function glycine() {
  const z = (x, y) => v3(x * 0.866, y, 0);
  // N, Ca, C, O(=), O(H)
  const atoms = [z(0, 0), z(1, 0.5), z(2, 0), z(2, -1), z(3, 0.5)];
  const el = ['N', 'C', 'C', 'O', 'O'];
  const bonds = [[0, 1, 1], [1, 2, 1], [2, 3, 2], [2, 4, 1]];
  return { atoms, el, bonds, centres: [z(2, 0).add(v3(-0.6, 0, 0))] };
}

function waterShot() {
  const S = new THREE.Scene(), C = camera(32);
  backdrop(S, 'frost');
  S.fog = null;
  const L = rig(S, 'frost', { key: v3(4, 6, 7), keyI: 2.6, rimI: 3.5, fillI: 0.5, shadow: false });
  const mol = new THREE.Group(); mol.position.set(-1.7, 0.1, 0); S.add(mol);
  const oM = mats.plastic('#d8222c', { roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05 });
  const hM = mats.plastic('#f4f6f8', { roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 });
  const ang = 104.5 * Math.PI / 180, bl = 1.45;
  const h1 = v3(Math.sin(ang / 2) * bl, -Math.cos(ang / 2) * bl, 0), h2 = v3(-Math.sin(ang / 2) * bl, -Math.cos(ang / 2) * bl, 0);
  mol.add(ball(0.62, oM, v3(), 64), ball(0.36, hM, h1, 48), ball(0.36, hM, h2, 48));
  [h1, h2].forEach(h => { const mid = h.clone().multiplyScalar(0.5); mol.add(stick(v3(), mid, 0.12, oM), stick(mid, h, 0.12, hM)); });
  // the 104.5° angle: gold arc
  const arcPts = []; for (let i = 0; i <= 60; i++) { const a = -Math.PI / 2 - ang / 2 + ang * i / 60; arcPts.push(v3(Math.cos(a) * 0.98, Math.sin(a) * 0.98, 0.0)); }
  const arcGeo = tube(arcPts, 0.022, 120, 8); const arcM = new THREE.Mesh(arcGeo, new THREE.MeshStandardMaterial({ color: col('#ffc35a'), emissive: col('#ffb340'), emissiveIntensity: 2.2, metalness: 0.6, roughness: 0.3 }));
  mol.add(arcM); const arcN = arcGeo.index.count;
  const tickM = arcM.material;
  // dotted guide lines along the two bonds beyond the arc
  // electron density haze: isosurface of summed gaussians
  const atomsD = [[v3(), 1.0, 0.95], [h1, 0.55, 0.62], [h2, 0.55, 0.62]];
  const dens = p => atomsD.reduce((s, [c, a, w]) => s + a * Math.exp(-p.distanceToSquared(c) / (w * w)), 0);
  const cen = v3(0, -0.45, 0);
  const shell = iso => displace(new THREE.IcosahedronGeometry(1, 24), v => { const d = v.clone().normalize(); let r = 0.2; while (r < 4 && dens(cen.clone().addScaledVector(d, r)) > iso) r += 0.02; return cen.clone().addScaledVector(d, r); });
  const hazeMat = k => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { c: { value: col('#7fe3ff').multiplyScalar(k) }, o: { value: 1 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 c; uniform float o; varying vec3 vN; varying vec3 vV; void main(){ float e = abs(dot(vN, vV)); gl_FragColor = vec4(c * pow(e, 1.3) * o, 1.0); }',
  });
  const hz1 = new THREE.Mesh(shell(0.10), hazeMat(0.06)), hz2 = new THREE.Mesh(shell(0.22), hazeMat(0.06)), hz3 = new THREE.Mesh(shell(0.4), hazeMat(0.05));
  mol.add(hz1, hz2, hz3);

  // skeletal formulas that draw themselves
  const lineM = new THREE.MeshStandardMaterial({ color: col('#ffc35a'), emissive: col('#ffb340'), emissiveIntensity: 1.8, metalness: 0.7, roughness: 0.3 });
  const nM = new THREE.MeshStandardMaterial({ color: col('#3a6bff'), emissive: col('#4a7bff'), emissiveIntensity: 1.4 });
  const oxM = new THREE.MeshStandardMaterial({ color: col('#ff3a40'), emissive: col('#ff3a40'), emissiveIntensity: 1.2 });
  const formulas = [];
  const build = (F, pos, sc, rotY) => {
    const g = new THREE.Group(); g.position.copy(pos); g.scale.setScalar(sc); g.rotation.y = rotY; S.add(g);
    const items = [];
    F.bonds.forEach(([i, j, o]) => {
      const a = F.atoms[i], b = F.atoms[j];
      // shorten at heteroatoms so the coloured dot reads
      const s = stick(a, b, 0.035, lineM, 8); g.add(s); items.push(s);
      if (o === 2) {
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const ctr = F.centres.reduce((best, c) => c.distanceTo(mid) < best.distanceTo(mid) ? c : best);
        const off = ctr.clone().sub(mid); off.sub(b.clone().sub(a).normalize().multiplyScalar(off.dot(b.clone().sub(a).normalize()))).setLength(0.2);
        const a2 = a.clone().lerp(b, 0.16).add(off), b2 = a.clone().lerp(b, 0.84).add(off);
        const s2 = stick(a2, b2, 0.03, lineM, 8); g.add(s2); items.push(s2);
      }
    });
    const dots = [];
    F.atoms.forEach((a, i) => { if (F.el[i] === 'C') return; const d = ball(0.11, F.el[i] === 'N' ? nM : oxM, a, 20); g.add(d); dots.push(d); });
    formulas.push({ g, items, dots });
  };
  build(adenine(), v3(1.55, -0.95, -0.3), 0.62, -0.2);
  build(glycine(), v3(1.25, 1.25, -0.2), 0.62, -0.2);
  const pen = new Dust(2, { size: 0.06, color: '#fff2c8', intensity: 4 }); S.add(pen);
  const dust = new Dust(300, { size: 0.015, color: '#bff4ff', intensity: 1 }); S.add(dust);
  const R = rng(5); for (let i = 0; i < 300; i++) { dust.set(i, R.range(-8, 8), R.range(-5, 5), R.range(-8, 2)); dust.alpha[i] = R.range(0.1, 0.4); } dust.dirty(true);

  return {
    scene: S, cam: C,
    update(u, t) {
      arcGeo.setDrawRange(0, Math.floor(easeOut(range(u, 0.08, 0.3)) * arcN / 3) * 3);
      mol.rotation.y = lerp(-0.5, 0.25, easeInOut(u)) ; mol.rotation.x = 0.1;
      const br = 1 + 0.03 * Math.sin(t * 5);
      hz1.scale.setScalar(br); hz2.scale.setScalar(1 + 0.04 * Math.sin(t * 4 + 1));
      // formulas draw bond by bond in the second half
      let penP = null;
      formulas.forEach((F, fi) => {
        const a0 = 0.45 + fi * 0.08, a1 = a0 + 0.42, n = F.items.length;
        F.items.forEach((s, k) => {
          const q = range(u, a0 + (a1 - a0) * k / n, a0 + (a1 - a0) * (k + 1) / n);
          s.visible = q > 0; s.scale.y = s.userData.len * easeInOut(q);
          if (q > 0 && q < 1) { penP = s.localToWorld(v3(0, 1, 0)); }
        });
        F.dots.forEach((d, k) => d.scale.setScalar(settle(range(u, a1 - 0.05 + k * 0.01, a1 + 0.08))));
        F.g.rotation.x = 0.05 * Math.sin(t + fi);
      });
      if (penP) { pen.set(0, penP.x, penP.y, penP.z); pen.opacity(1); } else pen.opacity(0); pen.dirty();
      const camP = orbit(lerp(7.0, 9.6, easeInOut(range(u, 0.3, 1))), lerp(-0.22, 0.12, u), 0.1).add(drift(t, 0.03));
      look(C, camP, v3(lerp(-1.7, 0.05, easeInOut(range(u, 0.3, 0.9))), 0, 0));
      return { bloom: 0.55, exposure: 1.05 };
    },
  };
}

// ================================================================ OUROBOROS
function scaleTextures() {
  const draw = (mode) => (g, w, h) => {
    // x: along body (one tile), y: around (0 dorsal, 0.5 belly, 1 dorsal)
    g.fillStyle = mode ? '#000' : '#2c4a50'; g.fillRect(0, 0, w, h);
    const rows = 16, cols = 7, sw = w / cols, sh = h / rows;
    for (let r = 0; r < rows + 1; r++) for (let c = 0; c < cols + 1; c++) {
      const cx = (c + (r % 2) * 0.5) * sw, cy = r * sh, v = cy / h, belly = Math.abs(v - 0.5) < 0.14;
      if (belly) continue;
      const dors = Math.min(v, 1 - v); // 0 at spine
      // dorsal zigzag blotches
      const zig = Math.abs(((cx / w) * 2 + 0.5) % 1 - 0.5) * 2; const inBlotch = Math.abs(dors - 0.02 - zig * 0.1) < 0.07;
      const base = inBlotch ? [18, 28, 32] : dors < 0.25 ? [70, 120, 122] : [110, 160, 150];
      const grd = g.createRadialGradient(cx - sw * 0.15, cy - sh * 0.1, 1, cx, cy, sw * 0.62);
      if (mode) { grd.addColorStop(0, '#fff'); grd.addColorStop(0.7, '#999'); grd.addColorStop(1, '#000'); }
      else { grd.addColorStop(0, `rgb(${base.map(x => Math.min(255, x * 1.35)).join(',')})`); grd.addColorStop(1, `rgb(${base.map(x => x * 0.55).join(',')})`); }
      g.fillStyle = grd; g.beginPath();
      g.moveTo(cx - sw * 0.55, cy); g.quadraticCurveTo(cx, cy - sh * 0.75, cx + sw * 0.5, cy); g.quadraticCurveTo(cx, cy + sh * 0.75, cx - sw * 0.55, cy); g.fill();
    }
    // ventral scutes
    for (let c = 0; c < cols; c++) {
      const x0 = c * w / cols, y0 = h * 0.36, y1 = h * 0.64;
      const grd = g.createLinearGradient(x0, 0, x0 + w / cols, 0);
      if (mode) { grd.addColorStop(0, '#222'); grd.addColorStop(0.25, '#fff'); grd.addColorStop(1, '#888'); }
      else { grd.addColorStop(0, '#6d6a58'); grd.addColorStop(0.3, '#e8e2c4'); grd.addColorStop(1, '#b8b096'); }
      g.fillStyle = grd; g.fillRect(x0, y0, w / cols - 2, y1 - y0);
    }
  };
  return { map: canvasTexture('snake-col', 512, 1024, draw(0)), bump: canvasTexture('snake-bump', 512, 1024, draw(1), { srgb: false }) };
}
function eyeTexture() {
  return canvasTexture('snake-eye', 256, 256, (g, w, h) => {
    const grd = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    grd.addColorStop(0, '#ffe08a'); grd.addColorStop(0.6, '#d89420'); grd.addColorStop(0.95, '#5a3008'); grd.addColorStop(1, '#100800');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(80,40,0,0.5)'; g.lineWidth = 2;
    for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * 30, h / 2 + Math.sin(a) * 30); g.lineTo(w / 2 + Math.cos(a) * 110, h / 2 + Math.sin(a) * 110); g.stroke(); }
    g.fillStyle = '#000'; g.beginPath(); g.ellipse(w / 2, h / 2, 16, 92, 0, 0, TAU); g.fill();
  });
}
// snake head in local frame: +x forward, +y dorsal, +z side. Returns { group, jaw }
function snakeHead(skinMat, rBody) {
  const grp = new THREE.Group();
  const L = rBody * 3.7, Wd = rBody * 1.25, Ht = rBody * 0.85;
  const shape = (v, lower) => {
    const s = (v.x + 1) / 2; // 0 back .. 1 snout
    const taper = 1 - 0.55 * Math.pow(s, 1.6);
    const x = (v.x * 0.5 + 0.35) * L;
    let y = v.y * Ht * (lower ? 0.55 : 1) * (1 - 0.4 * s);
    if (!lower) y = Math.max(y, -Ht * 0.12); else y = Math.min(y, 0.0);
    const z = v.z * Wd * taper * (1 + 0.15 * Math.exp(-((s - 0.35) ** 2) * 30));
    return v3(x, y + (lower ? -Ht * 0.08 : 0), z);
  };
  const up = new THREE.Mesh(displace(new THREE.SphereGeometry(1, 64, 40), v => shape(v, false)), skinMat);
  const jaw = new THREE.Group(); jaw.position.set(-L * 0.12, -Ht * 0.06, 0);
  const lowM = new THREE.Mesh(displace(new THREE.SphereGeometry(1, 48, 28), v => shape(v, true).add(v3(L * 0.12, Ht * 0.06, 0)).multiply(v3(0.97, 1, 0.9))), skinMat);
  jaw.add(lowM);
  const mouthM = mats.organic('#8a2a38', { roughness: 0.5 });
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), mouthM); mouth.scale.set(L * 0.42, Ht * 0.12, Wd * 0.62); mouth.position.set(L * 0.28, -Ht * 0.1, 0); grp.add(mouth);
  // fangs
  const fangM = mats.plastic('#f6f0e0', { roughness: 0.2 });
  [-1, 1].forEach(sd => { const f = new THREE.Mesh(new THREE.ConeGeometry(rBody * 0.07, rBody * 0.55, 12), fangM); f.rotation.z = Math.PI + 0.25; f.position.set(L * 0.68, -Ht * 0.3, sd * Wd * 0.3); grp.add(f); });
  // eyes with slit pupils + brow scale
  const eyeM = new THREE.MeshPhysicalMaterial({ map: eyeTexture(), roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 });
  [-1, 1].forEach(sd => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(rBody * 0.26, 32, 20), eyeM);
    e.position.set(L * 0.42, Ht * 0.32, sd * Wd * 0.62); e.rotation.y = sd > 0 ? -Math.PI / 2 + 0.3 : Math.PI / 2 - 0.3; e.rotation.order = 'YXZ';
    grp.add(e);
    const brow = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), skinMat); brow.scale.set(rBody * 0.42, rBody * 0.12, rBody * 0.2); brow.position.set(L * 0.42, Ht * 0.56, sd * Wd * 0.55); brow.rotation.x = sd * 0.5; grp.add(brow);
  });
  grp.add(up, jaw);
  return { group: grp, jaw, L };
}

function ouroborosShot() {
  const S = new THREE.Scene(), C = camera(30);
  backdrop(S, 'frost'); S.fog = null;
  const L = rig(S, 'frost', { key: v3(3, 7, 8), keyI: 3.0, rimI: 4, fillI: 0.45, shadow: false });
  const { map, bump } = scaleTextures(); map.repeat.set(30, 1); bump.repeat.set(30, 1);
  const skin = new THREE.MeshPhysicalMaterial({ map, bumpMap: bump, bumpScale: 2, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.25, iridescence: 0.5, iridescenceIOR: 1.6, sheen: 0.4, sheenColor: col('#9fe6ff') });
  const headSkin = skin.clone(); headSkin.map = map.clone(); headSkin.map.repeat.set(3, 2); headSkin.map.needsUpdate = true; headSkin.bumpMap = bump.clone(); headSkin.bumpMap.repeat.set(3, 2); headSkin.bumpMap.needsUpdate = true;
  const RINGS = 260, RAD = 32, rB = 0.3;
  const bodyGeo = sweepGeometry(RINGS, RAD); const body = new THREE.Mesh(bodyGeo, skin); S.add(body);
  const head = snakeHead(headSkin, rB); S.add(head.group);
  const Lbody = TAU * 1.9, psi = head.L * 1.3 * 0.6;
  const zOf = a => 0.14 * Math.sin(3 * a + 0.5);
  const pts = Array.from({ length: RINGS }, () => v3()), frames = Array.from({ length: RINGS }, () => ({ d: v3(), s: v3() })), rad = Array.from({ length: RINGS }, () => [0, 0]);

  // benzene: 6 C, 6 H, alternating double bonds, π clouds
  const ben = new THREE.Group(); S.add(ben);
  const cM = mats.plastic('#1c1f24', { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.04 });
  const hM = mats.plastic('#f2f4f6', { roughness: 0.2, clearcoat: 1 });
  const bM = mats.plastic('#9aa4ae', { roughness: 0.25, metalness: 0.2 });
  const Rc = 1.35, Rh = 2.35, atomsB = [];
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * TAU + Math.PI / 2, cp = v3(Math.cos(a) * Rc, Math.sin(a) * Rc, 0), hp = v3(Math.cos(a) * Rh, Math.sin(a) * Rh, 0);
    const c = ball(0.34, cM, cp, 48), h = ball(0.22, hM, hp, 32); ben.add(c, h);
    const n = (k + 1) % 6, a2 = n / 6 * TAU + Math.PI / 2, cq = v3(Math.cos(a2) * Rc, Math.sin(a2) * Rc, 0);
    const bonds = [stick(cp, cq, 0.075, bM), stick(cp, hp, 0.075, bM)];
    if (k % 2 === 0) { const off = cp.clone().add(cq).multiplyScalar(-0.5).setLength(0.24); bonds.push(stick(cp.clone().lerp(cq, 0.2).add(off), cp.clone().lerp(cq, 0.8).add(off), 0.055, bM)); }
    bonds.forEach(b => ben.add(b));
    atomsB.push({ a, items: [c, h, ...bonds] });
  }
  const piMat = new THREE.MeshPhysicalMaterial({ color: col('#7fe3ff'), transparent: true, opacity: 0.32, roughness: 0.15, clearcoat: 1, depthWrite: false, emissive: col('#2aa8d8'), emissiveIntensity: 0.5 });
  rim(piMat, '#bff4ff', 2.0, 1.4);
  const pis = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.TorusGeometry(Rc, 0.3, 32, 96), piMat); m.position.z = s * 0.55; m.scale.set(1, 1, 0.7); ben.add(m); return m; });

  return {
    scene: S, cam: C,
    update(u, t) {
      // the chase: ring tightens until the head takes the tail exactly at u = 0.5 (beat 17)
      const close = easeIn(range(u, 0, 0.5)) ;
      const Phi = lerp(TAU - 1.2, TAU + 0.12, close) / (1 + psi / Lbody);
      const Rr = Lbody / Phi;
      const th0 = -0.6 + t * 0.15 - Phi * 0.5 + Math.PI * 0.5;
      const dis = range(u, 0.6, 0.82); // dissolve sweep into benzene
      for (let i = 0; i < RINGS; i++) {
        const s = i / (RINGS - 1), a = th0 + Phi * s;
        pts[i].set(Math.cos(a) * Rr, Math.sin(a) * Rr, zOf(a));
        frames[i].d.set(Math.cos(a), Math.sin(a), -0.15 * Math.cos(3 * a + 0.5)).normalize(); frames[i].s.set(0, 0, 1);
        let r = rB * (Math.min(1, Math.pow(s / 0.4, 0.75)) * (1 - 0.18 * smooth((s - 0.85) / 0.15)) + 0.03);
        const ang = ((a - th0) / TAU); const gone = smooth((dis * 1.2 - ang) / 0.2);
        r *= 1 - gone;
        rad[i][0] = r * 0.92; rad[i][1] = r * 1.05;
      }
      sweepSet(bodyGeo, pts, rad, frames);
      // head
      const ah = th0 + Phi, hp = v3(Math.cos(ah) * Rr, Math.sin(ah) * Rr, zOf(ah));
      const T = v3(-Math.sin(ah), Math.cos(ah), 0.42 * Math.cos(3 * ah + 0.5) / Rr).normalize(), D = v3(Math.cos(ah), Math.sin(ah), 0), Z = v3().crossVectors(T, D);
      head.group.position.copy(hp).addScaledVector(T, -0.06);
      head.group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(T, D, Z));
      // jaw: gapes wide as it lunges, snaps shut on the tail at u = 0.5
      const open = smooth(range(u, 0.18, 0.42)) * (1 - smooth(range(u, 0.47, 0.5)));
      head.jaw.rotation.z = -0.75 * open - 0.12 * (u >= 0.5 ? 1 - range(u, 0.5, 0.6) : 0);
      const hs = 1 - smooth(range(u, 0.72, 0.84)); head.group.scale.setScalar(Math.max(1e-3, hs) * 1.3); head.group.visible = hs > 0.01;
      body.visible = dis < 1;
      // benzene appears in the snake's wake
      atomsB.forEach((A, k) => { const ang = (((A.a - th0) % TAU) + TAU) % TAU / TAU; const q = dis <= 0 ? 0 : settle(range(dis * 1.2 - ang + 0.05, 0, 0.35)); A.items.forEach(m => m.visible = q > 0.001); A.items[0].scale.setScalar(Math.max(1e-3, q)); A.items[1].scale.setScalar(Math.max(1e-3, q)); A.items.slice(2).forEach(b => { b.scale.x = b.scale.z = Math.max(1e-3, q); }); });
      const pq = smooth(range(u, 0.8, 0.95)); pis.forEach((p, i) => { p.visible = pq > 0; p.material.opacity = 0.3 * pq; p.position.z = (i ? 1 : -1) * lerp(0.2, 0.6, pq); });
      ben.rotation.z = t * 0.12;
      // camera: face-on for the chase, then tilts to reveal the π clouds above and below
      const tilt = easeInOut(range(u, 0.55, 1));
      const dist = lerp(11.2, 9.0, u);
      // lean in on the bite, then back out for the molecule
      const lean = smooth(range(u, 0.25, 0.5)) * (1 - smooth(range(u, 0.56, 0.8)));
      const bite = v3(Math.cos(ah) * Rr, Math.sin(ah) * Rr, 0);
      const tgt = bite.clone().multiplyScalar(0.55 * lean);
      const camP = v3(0, -Math.sin(tilt * 0.95) * dist, Math.cos(tilt * 0.95) * dist).multiplyScalar(1 - 0.38 * lean).add(tgt).add(v3(Math.sin(t * 0.4) * 0.3, 0, 0)).add(drift(t, 0.02));
      C.up.set(0, 1, 0); look(C, camP, tgt);
      return { bloom: 0.5, exposure: 1.05 };
    },
  };
}

// ================================================================ DNA
function dnaShot(p) {
  const S = new THREE.Scene(), C = camera(34, 0.05, 200);
  backdrop(S, 'frost'); S.fog = new THREE.Fog(col('#01080e'), 9, 24); S.environmentIntensity = 0.45;
  rig(S, 'frost', { key: v3(3, 8, 6), keyI: 1.7, rimI: 2.2, fillI: 0.35, shadow: false });
  const NBP = 52, rise = 0.34, tw = TAU / 10.5, Rb = 1.0, minor = 150 * Math.PI / 180;
  const x0 = -NBP * rise / 2;
  const strandPt = (k, s) => { const a = k * tw + (s ? minor : 0); return v3(x0 + k * rise, Math.cos(a) * Rb, Math.sin(a) * Rb); };
  const fine = s => { const pts = []; for (let k = 0; k <= (NBP - 1) * 6; k++) { const kk = k / 6, a = kk * tw + (s ? minor : 0); pts.push(v3(x0 + kk * rise, Math.cos(a) * Rb, Math.sin(a) * Rb)); } return pts; };
  const gold = mats.gold({ roughness: 0.3, color: col('#d9a24a') });
  [0, 1].forEach(s => S.add(new THREE.Mesh(tube(fine(s), 0.1, 900, 14), gold)));
  // phosphates
  const phos = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 24, 16), mats.gold({ roughness: 0.35, color: col('#d9a24a') }), NBP * 2);
  const m4 = new THREE.Matrix4();
  for (let k = 0; k < NBP; k++) for (let s = 0; s < 2; s++) { m4.makeTranslation(strandPt(k, s)); phos.setMatrixAt(k * 2 + s, m4); }
  S.add(phos);
  // base pairs: two coloured halves meeting at the chord midpoint
  const BASE = { A: '#ff4f6d', T: '#ffc94a', G: '#3fd0ff', C: '#8f7bff' };
  const R = rng(18), seq = Array.from({ length: NBP }, () => 'ATGC'[R.int(0, 3)]);
  const pair = { A: 'T', T: 'A', G: 'C', C: 'G' };
  const slab = new THREE.CylinderGeometry(0.5, 0.5, 1, 20, 1); slab.rotateZ(Math.PI / 2); slab.scale(1, 0.2, 0.62);
  const baseM = new THREE.MeshPhysicalMaterial({ roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 });
  const bases = new THREE.InstancedMesh(slab, baseM, NBP * 2);
  const glowK = 26; let glowObjs = [];
  const q = new THREE.Quaternion(), X = v3(1, 0, 0);
  for (let k = 0; k < NBP; k++) {
    const a = strandPt(k, 0), b = strandPt(k, 1), mid = a.clone().add(b).multiplyScalar(0.5);
    [[a, seq[k]], [b, pair[seq[k]]]].forEach(([e, L], s) => {
      const start = e.clone().lerp(mid, 0.12), len = start.distanceTo(mid) - 0.015, c = start.clone().add(mid).multiplyScalar(0.5);
      const dir = mid.clone().sub(start).normalize();
      // slabs lie flat, stacked along the helix axis
      q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(dir, X, v3().crossVectors(dir, X)));
      m4.compose(c, q, v3(len, 1, 1));
      if (k === glowK) { const m = new THREE.Mesh(slab, new THREE.MeshPhysicalMaterial({ color: col(BASE[L]), emissive: col(BASE[L]), emissiveIntensity: 0, roughness: 0.15, clearcoat: 1 })); m.applyMatrix4(m4); S.add(m); glowObjs.push(m); m4.makeScale(0, 0, 0); }
      bases.setMatrixAt(k * 2 + s, m4); bases.setColorAt(k * 2 + s, col(BASE[L]));
    });
  }
  S.add(bases);
  const gA = strandPt(glowK, 0), gB = strandPt(glowK, 1), gMid = gA.clone().add(gB).multiplyScalar(0.5);
  const pl = new THREE.PointLight(col('#ffffff'), 0, 3, 2); pl.position.copy(gMid); S.add(pl);
  const dust = new Dust(400, { size: 0.02, color: '#bff4ff', intensity: 1 }); S.add(dust);
  for (let i = 0; i < 400; i++) { dust.set(i, R.range(-12, 12), R.range(-4, 4), R.range(-5, 3)); dust.alpha[i] = R.range(0.1, 0.45); } dust.dirty(true);
  return {
    scene: S, cam: C,
    update(u, t) {
      const g = smooth(range(u, 0.35, 0.6)) * (0.8 + 0.2 * Math.sin(t * 9));
      glowObjs.forEach(m => m.material.emissiveIntensity = 2.2 * g); pl.intensity = 6 * g;
      // glide along the axis while slowly orbiting it
      const e = easeInOut(u);
      const cx = lerp(-4.0, gMid.x - 0.4, e), az = lerp(0.7, -0.15, e), rr = lerp(8.5, 5.0, e);
      const camP = v3(cx, Math.sin(az) * rr * 0.55 + 0.6, Math.cos(az) * rr).add(drift(t, 0.02));
      look(C, camP, v3(lerp(cx + 2.0, gMid.x, e), lerp(0, gMid.y * 0.4, e), lerp(0, gMid.z * 0.4, e)));
      return { bloom: 0.4, exposure: 0.95 };
    },
  };
}

// ================================================================ MITOSIS (embryo cleavage 1 → 2 → 4 → 8)
const NR = 44, NC = 48;
function blobGeometry() {
  const g = new THREE.BufferGeometry(), I = [];
  for (let i = 0; i < NR - 1; i++) for (let j = 0; j < NC; j++) { const a = i * NC + j, b = i * NC + (j + 1) % NC, c = a + NC, d = b + NC; I.push(a, c, b, b, c, d); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(NR * NC * 3), 3)); g.setIndex(I);
  return g;
}
// two spheres (radius r, centres ±d on y), smooth-unioned with k (k → 0: pinched apart)
function blobSet(g, r, d, k) {
  const P = g.attributes.position, top = d + r + k * 0.25;
  const f = (rho, y) => { const a = Math.hypot(rho, y - d) - r, b = Math.hypot(rho, y + d) - r; if (k <= 1e-4) return Math.min(a, b); const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k / 4; };
  for (let i = 0; i < NR; i++) {
    const y = -top * Math.cos(Math.PI * i / (NR - 1));
    let lo = 0, hi = r + k + 0.01, rho = 0;
    if (f(0, y) < 0) { for (let it = 0; it < 22; it++) { const m = (lo + hi) / 2; if (f(m, y) < 0) lo = m; else hi = m; } rho = lo; }
    for (let j = 0; j < NC; j++) { const a = j / NC * TAU; P.setXYZ(i * NC + j, Math.cos(a) * rho, y, Math.sin(a) * rho); }
  }
  P.needsUpdate = true; g.computeVertexNormals(); g.computeBoundingSphere();
}

function mitosisShot() {
  const S = new THREE.Scene(), C = camera(32);
  backdrop(S, 'genesis'); S.fog = null;
  const L = rig(S, 'genesis', { key: v3(4, 7, 6), keyI: 2.2, rimI: 3.5, fillI: 0.5, shadow: false });
  const R = rng(31);
  const axes = [v3(1, 0, 0), v3(0, 1, 0), v3(0, 0, 1)];
  const r0 = 1.55, rG = [r0, r0 * 0.8, r0 * 0.64, r0 * 0.51], sG = [0, rG[1] * 0.9, rG[2] * 0.92, rG[3] * 0.95];
  const ev = [7 / 30, 15 / 30, 22 / 30]; // division completes exactly on frames 307, 315, 322
  const qOf = (u, g) => g === 0 ? (u >= ev[0] ? 1 : smoother(range(u, 0.04, ev[0]))) : smoother(range(u, ev[g] - 0.2, ev[g]));
  const memM = new THREE.MeshPhysicalMaterial({ color: col('#4fd8c4'), transparent: true, opacity: 0.28, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.1, depthWrite: false, sheen: 1, sheenColor: col('#ff6fc0'), sheenRoughness: 0.35 });
  rim(memM, '#5fffe0', 2.2, 1.1);
  const cytM = new THREE.MeshPhysicalMaterial({ color: col('#0b3a3a'), transparent: true, opacity: 0.35, roughness: 0.6, depthWrite: false, emissive: col('#0a5a50'), emissiveIntensity: 0.35, side: THREE.BackSide });
  const blobs = [0, 1, 2, 3].map(() => { const g = blobGeometry(); const o = new THREE.Group(); const a = new THREE.Mesh(g, cytM), b = new THREE.Mesh(g, memM); b.renderOrder = 2; o.add(a, b); S.add(o); return { g, o }; });
  // lineage of each of the 8 final cells
  const bits = Array.from({ length: 8 }, (_, c) => [c & 1 ? 1 : -1, c & 2 ? 1 : -1, c & 4 ? 1 : -1]);
  const centre = (c, q) => { const p = v3(); for (let g = 0; g < 3; g++) p.addScaledVector(axes[g], bits[c][g] * sG[g + 1] * q[g]); return p; };
  // nuclei and organelles follow their lineage
  const nucM = mats.organic('#c23a8e', { emissive: col('#ff4fb0'), emissiveIntensity: 0.55, roughness: 0.35 });
  const nuclei = bits.map(() => { const n = ball(1, nucM, v3(), 32); S.add(n); return n; });
  const orgGeo = new THREE.CapsuleGeometry(0.035, 0.11, 4, 8);
  const org = new THREE.InstancedMesh(orgGeo, new THREE.MeshStandardMaterial({ color: col('#3dffd6'), emissive: col('#3dffd6'), emissiveIntensity: 1.2, roughness: 0.4 }), 8 * 14);
  const orgD = []; for (let i = 0; i < 8 * 14; i++) orgD.push({ c: Math.floor(i / 14), d: R.dir().multiplyScalar(Math.cbrt(R()) * 0.75), rot: new THREE.Euler(R() * 6, R() * 6, R() * 6), ph: R() * 6 });
  S.add(org);
  const zona = new THREE.Mesh(new THREE.SphereGeometry(2.55, 64, 40), new THREE.MeshPhysicalMaterial({ color: col('#3dffd6'), transparent: true, opacity: 0.05, roughness: 0.2, depthWrite: false, clearcoat: 1 }));
  rim(zona.material, '#3dffd6', 3.5, 0.5); S.add(zona);
  const motes = new Dust(300, { size: 0.02, color: '#3dffd6', intensity: 1.2 }); S.add(motes);
  for (let i = 0; i < 300; i++) { motes.setV(i, R.dir().multiplyScalar(R.range(3.2, 9))); motes.alpha[i] = R.range(0.1, 0.5); motes.color(i, R() < 0.3 ? col('#ff4fb0') : col('#3dffd6'), 1.2); }
  motes.dirty(true);
  const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion();
  return {
    scene: S, cam: C,
    update(u, t) {
      const q = [qOf(u, 0), qOf(u, 1), qOf(u, 2)];
      // which division is active: the latest that has started
      let g = 0; if (u >= ev[0]) g = 1; if (u >= ev[1]) g = 2;
      const nPar = 1 << g;
      blobs.forEach((B, i) => {
        B.o.visible = i < nPar; if (!B.o.visible) return;
        // parent i at depth g: lineage of final cell with those first g bits
        const qp = q.map((x, k) => k < g ? 1 : 0);
        const pc = centre(i, qp); // bits beyond g ignored because qp is 0 there
        const qg = q[g];
        const rr = lerp(rG[g], rG[g + 1], qg), d = sG[g + 1] * qg, k = lerp(rG[g] * 1.2, 0, Math.pow(qg, 0.7));
        blobSet(B.g, rr * (1 + 0.02 * Math.sin(t * 3 + i)), d, k);
        B.o.position.copy(pc);
        B.o.quaternion.setFromUnitVectors(Y, axes[g]);
      });
      // nuclei: split with each division
      nuclei.forEach((n, c) => {
        const p = centre(c, q); n.position.copy(p);
        const gen = q.filter(x => x >= 1).length, act = q[Math.min(gen, 2)];
        n.scale.setScalar(rG[Math.min(gen, 3)] * 0.36 * (gen < 3 ? 1 - 0.25 * Math.sin(Math.PI * act) : 1));
      });
      orgD.forEach((o, i) => {
        const gen = Math.min(3, q.filter(x => x >= 1).length), rad = lerp(rG[gen], rG[Math.min(3, gen + 1)], gen < 3 ? q[gen] : 0);
        const p = centre(o.c, q).addScaledVector(o.d, rad).add(v3(Math.sin(t * 1.3 + o.ph) * 0.03, Math.cos(t + o.ph) * 0.03, 0));
        qq.setFromEuler(new THREE.Euler(o.rot.x + t * 0.3, o.rot.y, o.rot.z)); m4.compose(p, qq, v3(1, 1, 1)); org.setMatrixAt(i, m4);
      });
      org.instanceMatrix.needsUpdate = true;
      const camP = orbit(lerp(8.6, 9.6, u), lerp(-0.35, 0.55, easeInOut(u)), lerp(0.42, 0.3, u)).add(drift(t, 0.03));
      look(C, camP, v3(0, 0, 0));
      return { bloom: 0.55, exposure: 1.0 };
    },
  };
}

// ================================================================ SYNAPSE
function synapseShot() {
  const S = new THREE.Scene(), C = camera(34, 0.05, 300);
  backdrop(S, 'genesis'); S.fog = new THREE.FogExp2(col('#000608'), 0.05);
  rig(S, 'genesis', { key: v3(3, 6, 7), keyI: 2.0, rimI: 1.6, fillI: 0.45, shadow: false });
  S.environmentIntensity = 0.35;
  const R = rng(41);
  // presynaptic: axon + terminal bouton (left)
  const axonPts = [v3(-9, 3.4, -2.5), v3(-6, 2.6, -1.2), v3(-3.6, 1.1, -0.2), v3(-2.1, 0.25, 0), v3(-1.3, 0, 0)];
  const axonGeo = taperTube(axonPts, s => lerp(0.32, 0.42, s), 120, 20);
  const pre = new THREE.MeshPhysicalMaterial({ color: col('#2a8c84'), roughness: 0.55, envMapIntensity: 0.25, clearcoat: 0.0, sheen: 0.8, sheenColor: col('#7fffe8'), transparent: true, opacity: 0.55, depthWrite: false });
  const pulseU = { uP: { value: -1 }, uPC: { value: col('#ff6fc8').multiplyScalar(1.6) } };
  const axM = pre.clone();
  axM.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, pulseU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vS;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvS = uv.x;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vS; uniform float uP; uniform vec3 uPC;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ float x = (vS - uP) / 0.05; totalEmissiveRadiance += uPC * exp(-x * x) + uPC * 0.12 * exp((vS - uP) / 0.12) * step(vS, uP); }');
  };
  axM.opacity = 0.85;
  const axon = new THREE.Mesh(axonGeo, axM); S.add(axon);
  const boutonGeo = displace(new THREE.SphereGeometry(1, 64, 48), v => { const p = v.clone().multiply(v3(1.15, 1.05, 1.05)); if (p.x > 0.45) p.x = 0.45 + (p.x - 0.45) * 0.25; p.addScaledVector(v, 0.04 * fbm(v.x * 3, v.y * 3, v.z * 3, 2)); return p; });
  const bouton = new THREE.Mesh(boutonGeo, pre); bouton.position.set(-0.92, 0, 0); S.add(bouton);
  const preRim = rim(pre, '#3dffd6', 2.2, 0.8);
  // postsynaptic dendritic spine (right): mushroom head on a thin neck
  const post = new THREE.MeshPhysicalMaterial({ color: col('#7a2c6a'), roughness: 0.55, envMapIntensity: 0.25, clearcoat: 0.0, sheen: 0.8, sheenColor: col('#ff9ad8'), transparent: true, opacity: 0.8 });
  const postRim = rim(post, '#ff4fb0', 2.4, 0.6);
  const headGeo = displace(new THREE.SphereGeometry(1, 64, 48), v => { const p = v.clone().multiply(v3(0.95, 0.9, 0.95)); if (p.x < -0.5) p.x = -0.5 + (p.x + 0.5) * 0.25; p.addScaledVector(v, 0.03 * fbm(v.x * 3 + 4, v.y * 3, v.z * 3, 2)); return p; });
  const spine = new THREE.Mesh(headGeo, post); spine.position.set(0.82, 0, 0); S.add(spine);
  const neck = new THREE.Mesh(taperTube([v3(1.0, -0.6, 0), v3(1.25, -1.6, 0.1), v3(1.9, -3.0, 0.3), v3(2.6, -4.8, 0.2)], s => lerp(0.3, 0.42, s), 60, 16), post); S.add(neck);
  // receptors on the postsynaptic face
  const recN = 40, rec = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.045, 0.1, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }), recN);
  const recP = [];
  const m4 = new THREE.Matrix4(), qz = new THREE.Quaternion().setFromUnitVectors(Y, v3(-1, 0, 0));
  for (let i = 0; i < recN; i++) { const a = R() * TAU, rr = Math.sqrt(R()) * 0.62; const p = v3(0.2, Math.cos(a) * rr, Math.sin(a) * rr); recP.push(p); m4.compose(p, qz, v3(1, 1, 1)); rec.setMatrixAt(i, m4); rec.setColorAt(i, col('#401030')); }
  S.add(rec);
  // vesicles inside the bouton, clustered at the active zone
  const vesN = 26, ves = [];
  const vesM = new THREE.MeshPhysicalMaterial({ color: col('#bff4ff'), transparent: true, opacity: 0.35, roughness: 0.1, clearcoat: 1, depthWrite: false });
  const coreM = new THREE.MeshBasicMaterial({ color: col('#ff4fb0').multiplyScalar(2.2) });
  for (let i = 0; i < vesN; i++) {
    let p; do { p = v3(R.range(-1.2, -0.62), R.range(-0.8, 0.8), R.range(-0.8, 0.8)); } while (p.clone().sub(v3(-0.92, 0, 0)).length() > 0.85);
    const g = new THREE.Group(); g.position.copy(p); const sh = ball(0.11, vesM, v3(), 20), co = ball(0.06, coreM, v3(), 12); g.add(sh, co); S.add(g);
    ves.push({ g, p, sh, co, fuse: -1 });
  }
  // the four closest to the membrane fuse
  const order = ves.map((v, i) => [v.p.x, i]).sort((a, b) => b[0] - a[0]);
  const sites = [];
  order.slice(0, 5).forEach(([, i], k) => { const v = ves[i]; v.fuse = 0.36 + k * 0.05; v.site = v3(-0.42, clamp(v.p.y, -0.5, 0.5), clamp(v.p.z, -0.5, 0.5)); sites.push(v); });
  // neurotransmitter
  const NT = 260, nt = new Dust(NT, { size: 0.035, color: '#ff8ad8', intensity: 3 }); S.add(nt);
  const ntD = []; for (let i = 0; i < NT; i++) ntD.push({ s: i % sites.length, dir: v3(R.range(0.3, 1), R.gauss() * 0.5, R.gauss() * 0.5).normalize(), sp: R.range(0.6, 1.2), ph: R() });
  const cleftLight = new THREE.PointLight(col('#ff4fb0'), 0, 3, 2); cleftLight.position.set(0, 0, 0.3); S.add(cleftLight);
  return {
    scene: S, cam: C,
    update(u, t) {
      // action potential runs down the axon, arriving at u ≈ 0.35
      pulseU.uP.value = lerp(-0.1, 1.15, easeIn(range(u, 0, 0.36)) );
      const arrive = Math.exp(-Math.pow((u - 0.37) / 0.08, 2));
      preRim.uRim.value.copy(col('#3dffd6')).multiplyScalar(0.7).lerp(col('#ff6fc8').multiplyScalar(1.1), arrive);
      let rel = 0;
      ves.forEach(v => {
        if (v.fuse < 0) { v.g.position.copy(v.p).add(v3(Math.sin(t * 2 + v.p.y * 9) * 0.01, Math.cos(t * 2.3 + v.p.z * 9) * 0.01, 0)); return; }
        const m = easeInOut(range(u, v.fuse - 0.12, v.fuse)), o = range(u, v.fuse, v.fuse + 0.14);
        v.g.position.copy(v.p).lerp(v.site, m);
        v.g.scale.set(1 - 0.75 * o, 1 + 0.4 * o, 1 + 0.4 * o).multiplyScalar(1 - 0.5 * o);
        v.co.visible = o < 0.6;
      });
      // release: each site emits a plume that drifts across the cleft and binds
      ntD.forEach((d, i) => {
        const s = sites[d.s], age = range(u, s.fuse + d.ph * 0.15, s.fuse + d.ph * 0.15 + 0.45);
        if (age <= 0) { nt.alpha[i] = 0; nt.set(i, s.site.x, s.site.y, s.site.z); return; }
        const dist = easeOut(age) * d.sp * 0.75;
        const p = s.site.clone().addScaledVector(d.dir, dist); p.x = Math.min(p.x, 0.17);
        nt.set(i, p.x, p.y, p.z); nt.alpha[i] = Math.min(1, age * 6) * 0.9;
        rel = Math.max(rel, age);
      });
      nt.dirty();
      cleftLight.intensity = 3 * smooth(range(u, 0.4, 0.6));
      const bind = smooth(range(u, 0.55, 0.9));
      recP.forEach((p, i) => rec.setColorAt(i, col('#401030').lerp(col('#ff6fd0').multiplyScalar(3), bind * (0.5 + 0.5 * Math.sin(i * 7.1)) )));
      rec.instanceColor.needsUpdate = true;
      postRim.uRim.value.copy(col('#ff4fb0')).multiplyScalar(lerp(0.6, 1.6, bind));
      const camP = v3(lerp(0.9, 0.3, u), lerp(1.0, 0.6, u), lerp(6.6, 5.2, easeOut(u))).add(drift(t, 0.02));
      look(C, camP, v3(lerp(-0.6, -0.1, u), 0, 0));
      return { bloom: 0.45, exposure: 1.0 };
    },
  };
}

// ================================================================ EDEN
// recursive branching (dendritic) tree; returns { geos, tips, nodes }
function growTree(R, { trunk = 1.8, r0 = 0.22, depth = 5, spread = 0.65, up = 0.55, twist = 0.25, kids = [2, 3], shrink = 0.72, root = v3() } = {}) {
  const geos = [], tips = [], nodes = [];
  const branch = (p0, dir, len, r, d) => {
    const pts = [p0.clone()]; let p = p0.clone(), dv = dir.clone();
    for (let k = 1; k <= 5; k++) { dv.add(R.dir().multiplyScalar(twist)).add(v3(0, up * 0.15, 0)).normalize(); p = p.clone().addScaledVector(dv, len / 5); pts.push(p); }
    const r1 = r * shrink;
    geos.push(taperTube(pts, s => lerp(r, r1, s), 12, d > 2 ? 12 : 7));
    if (d <= 0) { tips.push({ p, r: r1, dir: dv.clone() }); return; }
    nodes.push({ p, r: r1 });
    const n = R.int(kids[0], kids[1]);
    for (let i = 0; i < n; i++) {
      const az = (i / n) * TAU + R.range(-0.5, 0.5);
      const side = v3(Math.cos(az), 0, Math.sin(az));
      const nd = dv.clone().multiplyScalar(1 - spread).addScaledVector(side, spread).add(v3(0, up * 0.3, 0)).normalize();
      branch(p, nd, len * R.range(0.68, 0.82), r1, d - 1);
    }
  };
  branch(root, v3(0, 1, 0), trunk, r0, depth);
  return { geos, tips, nodes };
}
function appleGeometry() {
  const pts = [];
  for (let i = 0; i <= 48; i++) { const a = Math.PI * i / 48; let x = Math.sin(a) * (1 + 0.12 * Math.sin(a)) * (1 + 0.08 * Math.cos(a)), y = -Math.cos(a) * 0.9; y += 0.32 * Math.exp(-a * a * 6) - 0.36 * Math.exp(-Math.pow(Math.PI - a, 2) * 6); pts.push(new THREE.Vector2(Math.max(1e-3, x), y)); }
  return new THREE.LatheGeometry(pts, 64);
}
function glowDisc(inner, outer, size, k = 1) {
  return new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { a: { value: col(inner) }, b: { value: col(outer) }, k: { value: k } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 a; uniform vec3 b; uniform float k; varying vec2 vUv; void main(){ float r = length(vUv - 0.5) * 2.0; vec3 c = a * exp(-r * r * 18.0) + b * exp(-r * r * 4.0) * (1.0 - smoothstep(0.7, 1.0, r)); gl_FragColor = vec4(c * k, 1.0); }',
  }));
}
function edenShot() {
  const S = new THREE.Scene(), C = camera(30, 0.1, 500);
  backdrop(S, 'genesis'); S.fog = new THREE.FogExp2(col('#021416'), 0.025);
  const L = rig(S, 'genesis', { key: v3(-3, 6, 6), keyI: 1.0, rimI: 2.5, fillI: 0.25, shadow: false });
  L.rim.position.set(2, 6, -8); L.rim.color.set('#9fffe8');
  const R = rng(77);
  // glowing horizon disc behind the crown: makes the silhouette iconic
  const disc = glowDisc('#9fffe8', '#1c7a74', 18, 0.9); disc.position.set(0, 3.4, -9); S.add(disc);
  const disc2 = glowDisc('#000000', '#5a0a40', 40, 0.5); disc2.position.set(0, 2.0, -14); S.add(disc2);
  // ground mound
  const ground = new THREE.Mesh(displace(new THREE.CircleGeometry(150, 160, 0, TAU).rotateX(-Math.PI / 2), v => { v.y = -0.15 * Math.exp(-v.lengthSq() / 30) * 0 + 0.5 * Math.exp(-v.lengthSq() / 12) + 0.15 * fbm(v.x * 0.4, 0, v.z * 0.4, 3); return v; }), new THREE.MeshStandardMaterial({ color: col('#020807'), roughness: 0.95 }));
  ground.position.y = -0.5; S.add(ground);
  // the tree: dendrites
  const T = growTree(R, { trunk: 2.4, r0: 0.26, depth: 4, spread: 0.72, up: 0.25, twist: 0.28, kids: [2, 3], shrink: 0.66, root: v3(0, -0.2, 0) });
  // roots: axon-terminal-like
  const roots = []; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + R() * 0.5, pts = [v3(0, 0.1, 0)]; for (let k = 1; k <= 5; k++) pts.push(v3(Math.cos(a) * k * 0.45, 0.1 - k * 0.07 + 0.3 * Math.exp(-k), Math.sin(a) * k * 0.45)); roots.push(taperTube(pts, s => lerp(0.2, 0.02, s), 16, 8)); }
  const barkM = new THREE.MeshPhysicalMaterial({ color: col('#061616'), roughness: 0.6, clearcoat: 0.4, bumpMap: noiseTexture('bark-n', { scale: 30, contrast: 1.5 }), bumpScale: 1.5, sheen: 0.6, sheenColor: col('#3dffd6') });
  const barkRim = rim(barkM, '#3dffd6', 3.0, 0.9);
  const tree = new THREE.Mesh(mergeGeometries([...T.geos, ...roots].map(g => g.index ? g.toNonIndexed() : g)), barkM); S.add(tree);
  // somata at branch points, boutons at the tips
  const soma = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), barkM, T.nodes.length);
  const m4 = new THREE.Matrix4(); T.nodes.forEach((n, i) => { m4.makeScale(n.r * 1.5, n.r * 1.5, n.r * 1.5).setPosition(n.p); soma.setMatrixAt(i, m4); }); S.add(soma);
  const tipM = new THREE.MeshBasicMaterial({ color: col('#ff4fb0').multiplyScalar(2) });
  const tips = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), tipM, T.tips.length);
  T.tips.forEach((tp, i) => { m4.makeScale(0.035, 0.035, 0.035).setPosition(tp.p); tips.setMatrixAt(i, m4); tips.setColorAt(i, R() < 0.5 ? col('#ff4fb0').multiplyScalar(R.range(0.6, 1.6)) : col('#3dffd6').multiplyScalar(R.range(0.6, 1.4))); });
  tips.material = new THREE.MeshBasicMaterial({ color: 0xffffff }); S.add(tips);
  // the golden apple, hanging from the tip nearest a chosen point on the right of the crown
  const want = v3(2.4, 2.9, 1.0); let best = T.tips[0]; T.tips.forEach(tp => { if (tp.p.distanceTo(want) < best.p.distanceTo(want)) best = tp; });
  const apple = new THREE.Group(); S.add(apple);
  const appleM = mats.gold({ color: col('#ffc84a'), roughness: 0.3, emissive: col('#ff9a20'), emissiveIntensity: 0.25 });
  const ap = new THREE.Mesh(appleGeometry(), appleM); ap.scale.setScalar(0.34); apple.add(ap);
  const stem = new THREE.Mesh(taperTube([v3(0, 0.18, 0), v3(0.01, 0.32, 0), v3(0.04, 0.44, 0)], s => 0.018, 8, 6), new THREE.MeshStandardMaterial({ color: col('#3a2a14'), roughness: 0.7 })); apple.add(stem);
  const leaf = new THREE.Mesh(displace(new THREE.SphereGeometry(1, 24, 12), v => v3(v.x * 0.16, v.y * 0.012 + 0.05 * v.x * v.x, v.z * 0.06)), mats.gold({ color: col('#e8b04a'), roughness: 0.25 })); leaf.position.set(0.14, 0.38, 0); leaf.scale.setScalar(1.4); leaf.rotation.z = 0.5; apple.add(leaf);
  apple.position.copy(best.p).add(v3(0, -0.48, 0));
  const aLight = new THREE.PointLight(col('#ffc060'), 3, 3, 2); aLight.position.copy(apple.position).add(v3(0.3, 0.1, 0.6)); S.add(aLight);
  // serpent coiled around the trunk, head reaching out towards the apple
  const { map, bump } = scaleTextures(); const smap = map.clone(), sbump = bump.clone(); smap.repeat.set(22, 1); sbump.repeat.set(22, 1); smap.needsUpdate = sbump.needsUpdate = true;
  const skin = new THREE.MeshPhysicalMaterial({ map: smap, bumpMap: sbump, bumpScale: 2, roughness: 0.35, clearcoat: 0.8, iridescence: 0.6, sheen: 0.4, sheenColor: col('#ff9ad8') });
  const NS = 220, sPts = [];
  const trunkTop = 2.0, rT = 0.26;
  for (let i = 0; i < NS; i++) {
    const s = i / (NS - 1);
    if (s < 0.78) { const q = s / 0.78, a = q * TAU * 2.6 + 1.2, y = lerp(0.05, 1.75, q), rr = rT * lerp(1.0, 0.75, q) + 0.1; sPts.push(v3(Math.cos(a) * rr, y, Math.sin(a) * rr)); }
    else sPts.push(null);
  }
  // neck: from the last coil point curving out towards the apple
  const lastI = sPts.findIndex(p => p === null), p0 = sPts[lastI - 1], pA = apple.position.clone().add(v3(-0.75, -0.02, 0.45));
  const neckC = new THREE.CatmullRomCurve3([p0, p0.clone().lerp(pA, 0.4).add(v3(0, 0.45, 0.25)), pA]);
  for (let i = lastI; i < NS; i++) sPts[i] = neckC.getPoint((i - lastI + 1) / (NS - lastI));
  const sRad = sPts.map((_, i) => { const s = i / (NS - 1); const r = 0.1 * (Math.min(1, Math.pow(s / 0.3, 0.7)) * (1 - 0.2 * smooth((s - 0.9) / 0.1)) + 0.05); return [r * 0.92, r * 1.05]; });
  const sFr = sPts.map((p, i) => { const s = i / (NS - 1), T2 = sPts[Math.min(i + 1, NS - 1)].clone().sub(sPts[Math.max(i - 1, 0)]).normalize(); const out = v3(p.x, 0, p.z).normalize().lerp(Y, smooth((s - 0.74) / 0.12)); const d = out.sub(T2.clone().multiplyScalar(out.dot(T2))).normalize(); return { d, s: v3().crossVectors(T2, d) }; });
  const snakeGeo = sweepGeometry(NS, 20); sweepSet(snakeGeo, sPts, sRad, sFr);
  const snake = new THREE.Mesh(snakeGeo, skin); S.add(snake);
  const head = snakeHead(skin, 0.1); head.group.scale.setScalar(1.25); S.add(head.group);
  const hT = pA.clone().sub(sPts[NS - 3]).normalize();
  const place = (t) => {
    const T2 = hT.clone().applyAxisAngle(Y, 0.08 * Math.sin(t * 3)).normalize(), D = Y.clone().sub(T2.clone().multiplyScalar(T2.y)).normalize(), Z = v3().crossVectors(T2, D);
    head.group.position.copy(pA).addScaledVector(T2, -0.02); head.group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(T2, D, Z));
  };
  const motes = new Dust(200, { size: 0.02, color: '#3dffd6', intensity: 1.2 }); S.add(motes);
  for (let i = 0; i < 200; i++) { motes.set(i, R.range(-6, 6), R.range(-0.4, 6), R.range(-4, 3)); motes.alpha[i] = R.range(0.1, 0.5); motes.color(i, R() < 0.4 ? col('#ff4fb0') : col('#3dffd6')); } motes.dirty(true);
  return {
    scene: S, cam: C,
    update(u, t) {
      place(t); head.jaw.rotation.z = -0.12 - 0.1 * smooth(range(u, 0.5, 0.8));
      apple.rotation.y = t * 0.6; apple.position.y = best.p.y - 0.48 + Math.sin(t * 2) * 0.01;
      appleM.emissiveIntensity = 0.25 + 0.25 * smooth(range(u, 0.3, 0.9));
      const camP = v3(lerp(0.3, 0.55, u), lerp(1.0, 1.3, u), lerp(14.5, 13.2, easeOut(u))).add(drift(t, 0.02));
      look(C, camP, v3(0.35, lerp(2.5, 2.6, u), 0));
      return { bloom: 0.6, exposure: 1.0 };
    },
  };
}

// ================================================================ CAMBRIAN
const TL = 2.0;
const trWidth = s => {
  let w;
  if (s < 0.3) w = 0.66 * Math.pow(Math.sin(Math.PI / 2 * s / 0.3), 0.55);
  else if (s < 0.8) { const q = (s - 0.3) / 0.5, f = (q * 11) % 1; w = 0.64 - 0.16 * q + 0.07 * Math.pow(f, 5); }
  else w = 0.48 * Math.sqrt(Math.max(0, 1 - Math.pow((s - 0.8) / 0.2, 2))) + 0.0;
  return w;
};
function trilobiteCarapace() {
  const NS = 180, NW = 72, g = new THREE.BufferGeometry(), P = [], Cc = [], I = [];
  const base = col('#8a5a34'), dark = col('#2e1a0e'), light = col('#d8a468');
  for (let i = 0; i <= NS; i++) for (let j = 0; j <= NW; j++) {
    const s = i / NS, w = j / NW * 2 - 1, Wd = trWidth(s);
    const aw = Math.abs(w);
    const env = Math.pow(Math.sin(Math.PI * clamp(s * 1.02, 0, 1)), 0.35);
    let h = 0.22 * Math.pow(Math.max(0, 1 - aw * aw), 0.7) * env;
    // axial lobe (rachis) and its furrows: the "three lobes"
    const ax = Math.exp(-Math.pow(w / 0.24, 4));
    h += 0.07 * ax * (s > 0.28 ? 1 : 0.3) - 0.035 * Math.exp(-Math.pow((aw - 0.3) / 0.05, 2)) * (s > 0.3 ? 1 : 0);
    let tone = 0;
    // thoracic segments: overlapping plates
    if (s > 0.3 && s < 0.8) { const f = ((s - 0.3) / 0.5 * 11) % 1; h += 0.025 * f * (1 - aw * 0.3); tone = f > 0.9 ? -1 : f * 0.6; h -= 0.012 * Math.exp(-Math.pow((f - 0.5) / 0.12, 2)) * (aw > 0.33 ? 1 : 0); }
    // cephalon: glabella, border rim
    if (s < 0.32) { h += 0.15 * Math.exp(-Math.pow(w / 0.26, 2) - Math.pow((s - 0.16) / 0.1, 2)); h += 0.018 * Math.exp(-Math.pow((aw - 0.93) / 0.04, 2)); tone = 0.3 * Math.exp(-Math.pow(w / 0.26, 2) - Math.pow((s - 0.16) / 0.1, 2)); if (Math.abs(s - 0.3) < 0.006) tone = -1; }
    // pygidium ribs
    if (s >= 0.8) { const f = ((s - 0.8) / 0.2 * 5) % 1; h += 0.01 * f * (1 - aw); if (f > 0.92) tone = -0.6; if (Math.abs(s - 0.8) < 0.005) tone = -1; }
    if (Math.abs(aw - 0.3) < 0.03 && s > 0.3) tone = Math.min(tone, -0.5);
    P.push(-(s - 0.5) * TL, 0.1 + h, w * Wd);
    const c = tone >= 0 ? base.clone().lerp(light, tone) : base.clone().lerp(dark, -tone);
    c.lerp(dark, 0.5 * Math.pow(aw, 6)); Cc.push(c.r, c.g, c.b);
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NW; j++) { const a = i * (NW + 1) + j, b = a + NW + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setIndex(I); g.computeVertexNormals();
  return g;
}
// lens positions on the compound eye (local to eye centre), facing outward-up (+z side, +y up)
function eyeLenses(n, axis) {
  const out = [], ga = Math.PI * (3 - Math.sqrt(5));
  const q = new THREE.Quaternion().setFromUnitVectors(v3(0, 0, 1), axis);
  for (let i = 0; i < n; i++) { const z = 1 - (i / (n - 1)) * (1 - Math.cos(1.25)), r = Math.sqrt(1 - z * z), a = i * ga; const d = v3(Math.cos(a) * r, Math.sin(a) * r, z); const lat = Math.asin(Math.sin(a) * r); if (Math.abs(Math.sin(a) * r) > 0.75) continue; out.push(d.applyQuaternion(q)); }
  return out;
}
function makeTrilobite(cara, mat, legMat, lensN = 0) {
  const grp = new THREE.Group();
  const plain = new THREE.MeshPhysicalMaterial({ color: col('#7a4e2c'), roughness: 0.32, clearcoat: 0.8 });
  const eyeBase = new THREE.MeshPhysicalMaterial({ color: col('#3a2412'), roughness: 0.3, clearcoat: 1 });
  const shell = new THREE.Mesh(cara, mat); shell.castShadow = true; shell.receiveShadow = true; grp.add(shell);
  // genal spines
  [-1, 1].forEach(sd => { const sp = new THREE.Mesh(taperTube([v3(-(0.3 - 0.5) * TL, 0.11, sd * 0.64), v3(-(0.42 - 0.5) * TL, 0.1, sd * 0.68), v3(-(0.62 - 0.5) * TL, 0.08, sd * 0.66)], s => lerp(0.05, 0.004, s), 16, 8), plain); sp.castShadow = true; grp.add(sp); });
  // antennae
  [-1, 1].forEach(sd => grp.add(new THREE.Mesh(taperTube([v3(0.98, 0.1, sd * 0.12), v3(1.25, 0.14, sd * 0.3), v3(1.5, 0.1, sd * 0.55), v3(1.7, 0.06, sd * 0.85)], s => lerp(0.018, 0.005, s), 24, 6), legMat)));
  // legs (biramous limbs peeking out from under the pleurae)
  const legs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.008, 0.016, 1, 6).translate(0, -0.5, 0), legMat, 24); grp.add(legs);
  // compound eyes: crescent mounds of calcite lenses
  const eyes = [];
  [-1, 1].forEach(sd => {
    const c = v3(-(0.19 - 0.5) * TL, 0.26, sd * 0.36), axis = v3(0, 0.55, sd).normalize();
    const mound = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 20), eyeBase); mound.position.copy(c); mound.scale.set(1.25, 0.8, 0.8); grp.add(mound);
    eyes.push({ c, axis, side: sd });
  });
  return { grp, legs, eyes };
}
function anomalocaris(R) {
  const grp = new THREE.Group();
  const bodyM = mats.organic('#b4405e', { roughness: 0.4, clearcoat: 0.7, sheenColor: col('#ff9ad0') });
  const flapM = mats.organic('#d0607a', { roughness: 0.35, side: THREE.DoubleSide, transparent: true, opacity: 0.92, sheenColor: col('#ffc0e0') });
  const segs = 13, flaps = [];
  for (let i = 0; i < segs; i++) {
    const s = i / (segs - 1), x = 1.4 - s * 3.0, rw = 0.34 * Math.sin(Math.PI * (0.15 + 0.8 * s)) + 0.08;
    const b = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), bodyM); b.position.set(x, 0, 0); b.scale.set(0.16, rw * 0.55, rw); grp.add(b);
    if (i > 0 && i < segs - 1) [-1, 1].forEach(sd => {
      const pv = new THREE.Group(); pv.position.set(x, 0, sd * rw * 0.85); grp.add(pv);
      const f = new THREE.Mesh(displace(new THREE.CircleGeometry(1, 24), v => v3(v.x * 0.2, 0.04 * v.y * v.y, v.y * 0.4)), flapM);
      f.position.z = sd * 0.36; f.rotation.y = 0.25 * sd; pv.add(f); flaps.push({ pv, i, sd });
    });
  }
  // head, stalked eyes, frontal appendages
  const headM = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), bodyM); headM.position.set(1.62, 0, 0); headM.scale.set(0.3, 0.2, 0.28); grp.add(headM);
  const eyeM = mats.plastic('#050505', { roughness: 0.05 });
  [-1, 1].forEach(sd => { grp.add(new THREE.Mesh(taperTube([v3(1.6, 0.05, sd * 0.18), v3(1.66, 0.22, sd * 0.4), v3(1.7, 0.3, sd * 0.52)], s => 0.035, 10, 8), bodyM)); grp.add(ball(0.09, eyeM, v3(1.7, 0.3, sd * 0.55), 20)); });
  const arms = [];
  [-1, 1].forEach(sd => {
    const arm = new THREE.Group(); arm.position.set(1.85, -0.05, sd * 0.1); grp.add(arm);
    const pts = []; for (let k = 0; k <= 12; k++) { const a = k / 12 * 2.4; pts.push(v3(Math.sin(a) * 0.45 + k * 0.02, -0.45 + Math.cos(a) * 0.45, sd * 0.05 * k / 12)); }
    arm.add(new THREE.Mesh(taperTube(pts, s => lerp(0.07, 0.02, s), 48, 10), bodyM));
    for (let k = 1; k < 12; k++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.12, 6), bodyM); sp.position.copy(pts[k]); sp.lookAt(v3(0.2, -0.45, 0)); sp.rotateX(Math.PI / 2); arm.add(sp); }
    arms.push(arm);
  });
  // tail fan
  [-1, 1].forEach(sd => [0, 1, 2].forEach(k => { const f = new THREE.Mesh(displace(new THREE.CircleGeometry(1, 20), v => v3(v.x * 0.32, v.y * 0.07, 0)).translate(0.3, 0, 0), flapM); f.position.set(-1.75 - k * 0.04, 0.05 + k * 0.03, sd * 0.1); f.rotation.set(Math.PI / 2, 0, sd * (0.5 + k * 0.25) + Math.PI); grp.add(f); }));
  return { grp, flaps, arms };
}
function cambrianShot() {
  const S = new THREE.Scene(), C = camera(36, 0.004, 300);
  backdrop(S, 'genesis'); S.fog = new THREE.FogExp2(col('#03221f'), 0.09); S.environmentIntensity = 0.5;
  const L = rig(S, 'genesis', { key: v3(1.5, 9, 3), keyI: 2.6, rimI: 1.6, fillI: 0.5, shadow: true });
  L.key.color.set('#d8fff4');
  const R = rng(55);
  // seafloor: rippled silt
  const floorG = new THREE.PlaneGeometry(40, 40, 220, 220).rotateX(-Math.PI / 2);
  displace(floorG, v => { v.y = 0.12 * fbm(v.x * 0.35, 0, v.z * 0.35, 4) + 0.025 * Math.sin(v.x * 7 + 2 * fbm(v.x * 0.5, 1, v.z * 0.5, 2)) - 0.02; return v; });
  const caust = canvasTexture('caustic', 256, 256, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = x / w * TAU, b = y / h * TAU; let v = 0; for (let k = 0; k < 3; k++) v += Math.abs(Math.sin(a * (k + 2) + Math.sin(b * (k + 1) + k) * 2.0) + Math.sin(b * (k + 2) + Math.cos(a * (3 - k)) * 2.0)); v = Math.pow(clamp(1 - v / 3.2), 4) * 255; const i = (y * w + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
  }, { repeat: 6 });
  const floor = new THREE.Mesh(floorG, new THREE.MeshStandardMaterial({ color: col('#6c7a68'), roughness: 0.95, bumpMap: noiseTexture('silt', { scale: 40, contrast: 1.3 }), bumpScale: 1.2, emissive: col('#4fd8c4'), emissiveMap: caust, emissiveIntensity: 0.12 }));
  floor.receiveShadow = true; S.add(floor);
  // rocks and sponges
  const rockM = mats.stone('#4a504a');
  for (let i = 0; i < 9; i++) { const r = new THREE.Mesh(displace(new THREE.IcosahedronGeometry(1, 3), v => v.multiplyScalar(1 + 0.3 * fbm(v.x * 2 + i, v.y * 2, v.z * 2, 3))), rockM); const a = R() * TAU, d = R.range(3, 9); r.position.set(Math.cos(a) * d, -0.1, Math.sin(a) * d - 2); r.scale.set(R.range(0.3, 0.9), R.range(0.2, 0.5), R.range(0.3, 0.8)); r.castShadow = r.receiveShadow = true; S.add(r); }
  const spongeM = mats.organic('#c08850', { roughness: 0.7, bumpMap: noiseTexture('sponge', { scale: 50, contrast: 2 }), bumpScale: 3, side: THREE.DoubleSide });
  for (let i = 0; i < 5; i++) { const pts = []; const hgt = R.range(0.6, 1.4); for (let k = 0; k <= 12; k++) { const s = k / 12; pts.push(new THREE.Vector2(0.08 + 0.22 * Math.pow(s, 0.8) + 0.04 * Math.sin(s * 9), s * hgt)); } const sp = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), spongeM); sp.position.set(R.range(-6, 5), -0.05, R.range(-7, -3)); sp.castShadow = true; S.add(sp); }
  // trilobites
  const cara = trilobiteCarapace();
  const tMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2, bumpMap: noiseTexture('pits', { scale: 60, contrast: 1.2 }), bumpScale: 0.6 });
  const legMat = mats.organic('#a07048', { roughness: 0.5 });
  const lensGlass = new THREE.MeshPhysicalMaterial({ color: col('#4a3014'), roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.7, depthWrite: false });
  const lensCoreM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const tris = [
    { p: v3(0.4, 0, 0.6), h: 0.35, v: 0.35, sc: 1, hero: true },
    { p: v3(-2.6, 0, -1.4), h: 0.9, v: 0.4, sc: 0.8 },
    { p: v3(2.6, 0, -2.2), h: 2.6, v: 0.3, sc: 0.7 },
  ].map(d => {
    const T = makeTrilobite(cara, tMat, legMat); T.grp.scale.setScalar(d.sc); T.grp.rotation.y = d.h; S.add(T.grp); return { ...d, ...T };
  });
  const hero = tris[0];
  // hero eye lenses (the one facing camera, +z side)
  const he = hero.eyes[1], lensDirs = eyeLenses(150, he.axis);
  const lenses = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), lensGlass, lensDirs.length);
  const cores = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), lensCoreM, lensDirs.length);
  const em = new THREE.Matrix4(), eq = new THREE.Quaternion();
  const eyeR = 0.1;
  lensDirs.forEach((d, i) => {
    const p = he.c.clone().addScaledVector(v3(d.x * 1.25, d.y * 0.8, d.z * 0.8), eyeR * 1.0);
    eq.setFromUnitVectors(v3(0, 0, 1), d);
    em.compose(p, eq, v3(0.011, 0.011, 0.007)); lenses.setMatrixAt(i, em);
    em.compose(p.clone().addScaledVector(d, -0.002), eq, v3(0.006, 0.006, 0.004)); cores.setMatrixAt(i, em); cores.setColorAt(i, col('#100806'));
  });
  hero.grp.add(cores, lenses);
  // anomalocaris
  const A = anomalocaris(R); A.grp.scale.setScalar(0.85); S.add(A.grp);
  // light shafts from above and marine snow
  for (let i = 0; i < 5; i++) { const s = shaft(14, 0.5, 2.2, '#9ffff0', 0.045); s.position.set(R.range(-6, 6), 12, R.range(-6, 0)); s.rotation.z = R.range(-0.2, 0.2); S.add(s); }
  const beam = shaft(6, 0.02, 0.06, '#fff2d0', 0.6); S.add(beam);
  const snow = new Dust(500, { size: 0.02, color: '#c8fff4', intensity: 1 }); S.add(snow);
  const sd = []; for (let i = 0; i < 500; i++) sd.push(v3(R.range(-8, 8), R.range(0, 5), R.range(-8, 4)));
  // effective (slowing) time: the music freezes at the downbeat
  const tEff = u => { let s = 0; const n = 40; for (let k = 0; k < n; k++) { const x = u * (k + 0.5) / n; s += (1 - smooth(range(x, 0, 0.22))) * u / n; } return s * 1.0; };
  const legQ = new THREE.Quaternion(), legM = new THREE.Matrix4();
  const eyeWorld = v3(), eyeAxisW = v3();
  return {
    scene: S, cam: C,
    update(u, t) {
      const te = tEff(u) * 2.0; // seconds of motion
      tris.forEach((T, k) => {
        const dir = v3(Math.cos(T.h), 0, -Math.sin(T.h));
        T.grp.position.copy(T.p).addScaledVector(dir, T.v * (te - 0.3) * T.sc);
        T.grp.position.y = 0.02 + 0.006 * Math.sin(te * 12 + k);
        for (let i = 0; i < 24; i++) {
          const sd2 = i % 2 ? 1 : -1, j = Math.floor(i / 2), s = 0.32 + j * 0.04;
          const ph = te * 14 - j * 0.7 + (sd2 > 0 ? Math.PI : 0);
          legQ.setFromEuler(new THREE.Euler(-sd2 * (1.15 + 0.12 * Math.cos(ph)), 0.35 * Math.sin(ph), 0));
          legM.compose(v3(-(s - 0.5) * TL, 0.12, sd2 * (trWidth(s) - 0.08)), legQ, v3(1, 0.22, 1)); T.legs.setMatrixAt(i, legM);
        }
        T.legs.instanceMatrix.needsUpdate = true;
      });
      // anomalocaris glides above, flaps rippling (slowing to a stop)
      A.grp.position.set(1.6 - te * 1.3, 0.95 + 0.05 * Math.sin(te * 3), -3.4); A.grp.rotation.set(0.05 * Math.sin(te * 2), Math.PI + 0.25, 0.08);
      A.flaps.forEach(f => { f.pv.rotation.x = f.sd * 0.45 * Math.sin(te * 9 - f.i * 0.55); });
      A.arms.forEach((a, i) => { a.rotation.z = -0.15 + 0.1 * Math.sin(te * 4 + i); });
      sd.forEach((p, i) => snow.set(i, p.x + Math.sin(te + i) * 0.05, p.y - (te * 0.1 + i * 0.37) % 1 * 0.3, p.z)); snow.dirty();
      // first light: lenses ignite from the top of the eye downward
      hero.grp.updateMatrixWorld(true);
      eyeWorld.copy(he.c).applyMatrix4(hero.grp.matrixWorld);
      eyeAxisW.copy(he.axis).transformDirection(hero.grp.matrixWorld);
      lensDirs.forEach((d, i) => { const lit = smooth(range(u, 0.55 + 0.25 * (1 - (d.y + 0.2)), 0.67 + 0.25 * (1 - (d.y + 0.2)))); cores.setColorAt(i, col('#100806').lerp(col('#ffd890').multiplyScalar(3.2), lit)); });
      cores.instanceColor.needsUpdate = true;
      const beamOn = smooth(range(u, 0.5, 0.7));
      beam.position.copy(eyeWorld).add(v3(0.6, 5.8, 0.4)); beam.lookAt(eyeWorld); beam.rotateX(-Math.PI / 2); beam.material.uniforms.o.value = beamOn;
      beam.visible = beamOn > 0;
      // camera: wide on the seafloor, then a push into the compound eye
      const k = easeInOut(range(u, 0.12, 0.88));
      const dist = 6.5 * Math.pow(0.32 / 6.5, k);
      const viewDir = v3(0.35, 0.5, 1).normalize().lerp(eyeAxisW.clone().add(v3(0.25, 0.15, 0.3)).normalize(), smooth(range(u, 0.2, 0.8))).normalize();
      const tgt = v3(0, 0.3, -0.5).lerp(eyeWorld, smooth(range(u, 0.05, 0.6)));
      look(C, tgt.clone().addScaledVector(viewDir, dist).add(drift(t, 0.01 * dist)), tgt);
      S.fog.density = lerp(0.09, 0.03, k);
      return { bloom: 0.55, exposure: lerp(1.0, 1.05, u) };
    },
  };
}

// ================================================================ LIGHTNING
function lightningShot() {
  const S = new THREE.Scene(), C = camera(34, 0.1, 600);
  const R = rng(91);
  // storm sky: dark teal gradient with a sick magenta glow at the horizon
  const skyU = { flash: { value: 0 } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: skyU,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform float flash; varying vec3 vP; void main(){ float h = vP.y;
      vec3 c = mix(vec3(0.05,0.10,0.11), vec3(0.008,0.03,0.04), smoothstep(0.0, 0.5, h));
      c += vec3(0.30,0.06,0.18) * exp(-abs(h) * 14.0) * 0.6;
      c += vec3(0.6,0.65,0.9) * flash * smoothstep(-0.05, 0.4, h) * 0.6;
      gl_FragColor = vec4(c, 1.0); }`,
  })); sky.renderOrder = -10; S.add(sky);
  S.environment = envMap('genesis'); S.environmentIntensity = 0.3;
  S.fog = new THREE.FogExp2(col('#0a1a1c'), 0.018);
  // clouds: layered noise sheets, lit from inside by the strike
  const cloudTex = canvasTexture('storm-cloud', 512, 512, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = x / w * TAU, b = y / h * TAU, Rr = 4 / TAU; const n = fbm(Math.cos(a) * Rr + 3, Math.sin(a) * Rr + Math.cos(b) * Rr, Math.sin(b) * Rr, 6); const v = clamp((n + 0.15) * 2.2); const i = (y * w + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 255 * (0.5 + 0.5 * v); img.data[i + 3] = 255 * v; }
    g.putImageData(img, 0, 0);
  });
  const clouds = [];
  for (let i = 0; i < 4; i++) {
    const m = new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, depthWrite: false, color: col('#1a2c30'), fog: false, side: THREE.DoubleSide });
    const c = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), m); c.rotation.x = Math.PI / 2; c.position.set(0, 16 + i * 2.5, -30); c.material.map = cloudTex.clone(); c.material.map.repeat.set(2 + i, 2 + i); c.material.map.offset.set(i * 0.3, i * 0.17); c.material.map.needsUpdate = true; S.add(c); clouds.push(c);
  }
  // barren primordial land and distant volcanic ridges
  const landG = new THREE.PlaneGeometry(240, 240, 240, 240).rotateX(-Math.PI / 2);
  displace(landG, v => { const d = Math.hypot(v.x, v.z); v.y = 0.6 * fbm(v.x * 0.08, 0, v.z * 0.08, 5) + 0.15 * fbm(v.x * 0.6, 3, v.z * 0.6, 3) + Math.max(0, -v.z - 40) * 0.25 * (0.6 + fbm(v.x * 0.03, 5, 0, 4)) - 0.4 * Math.exp(-d * d / 20); return v; });
  const land = new THREE.Mesh(landG, mats.stone('#2c2a28', { roughness: 0.95, bumpScale: 2 })); land.receiveShadow = true; S.add(land);
  // dead tree: twisted, leafless
  const T = growTree(R, { trunk: 1.9, r0: 0.22, depth: 4, spread: 0.6, up: 0.25, twist: 0.4, kids: [2, 3], shrink: 0.66, root: v3(0, -0.3, 0) });
  const woodM = new THREE.MeshStandardMaterial({ color: col('#2a221c'), roughness: 0.9, bumpMap: noiseTexture('bark-n', { scale: 30, contrast: 1.5 }), bumpScale: 2, emissive: col('#ff5a10'), emissiveMap: noiseTexture('ember', { scale: 14, contrast: 3 }), emissiveIntensity: 0 });
  const tree = new THREE.Mesh(mergeGeometries(T.geos.map(g => g.toNonIndexed())), woodM); tree.castShadow = true; S.add(tree);
  let topTip = T.tips[0]; T.tips.forEach(tp => { if (tp.p.y > topTip.p.y) topTip = tp; });
  // lightning bolt: jagged main channel + branches as glowing tubes
  const strikeAt = v3(topTip.p.x, topTip.p.y, topTip.p.z), from = v3(-6, 22, -10);
  const paths = crack(from, strikeAt, R, { depth: 7, rough: 0.32, branches: 6, branchLen: 0.35 });
  const boltM = new THREE.MeshBasicMaterial({ color: col('#f2eaff').multiplyScalar(6), fog: false });
  const haloM = new THREE.MeshBasicMaterial({ color: col('#b07aff').multiplyScalar(0.9), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const bolts = paths.map((pl, i) => { const g = tube(pl, i ? 0.03 : 0.07, pl.length * 3, 6); const m = new THREE.Mesh(g, boltM), h = new THREE.Mesh(tube(pl, i ? 0.12 : 0.3, pl.length * 3, 6), haloM); const grp = new THREE.Group(); grp.add(m, h); S.add(grp); return { grp, g, hg: h.geometry, n: g.index.count, hn: h.geometry.index.count, i }; });
  const boltLight = new THREE.PointLight(col('#d8d0ff'), 0, 60, 1.5); boltLight.position.copy(strikeAt).add(v3(-1, 4, 1)); S.add(boltLight);
  const moon = new THREE.DirectionalLight(col('#7fb8c0'), 0.5); moon.position.set(-4, 6, -8); S.add(moon);
  const hemi = new THREE.HemisphereLight(col('#3a6a70'), col('#0a0806'), 0.4); S.add(hemi);
  // fire: flame tongues at the crown (shader-animated, additive)
  const flameU = { t: { value: 0 }, k: { value: 0 } };
  const flameM = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: flameU,
    vertexShader: `uniform float t; uniform float k; varying float vH; varying vec3 vN; varying vec3 vV; attribute float aSeed;
      void main(){ vec3 p = position; vH = clamp(p.y + 0.5, 0.0, 1.0);
        float w = 1.0 - vH * 0.85; p.xz *= w;
        p.x += sin(t * 9.0 + aSeed * 7.0 + vH * 4.0) * 0.12 * vH; p.z += cos(t * 7.0 + aSeed * 5.0 + vH * 3.0) * 0.1 * vH;
        p.y *= (0.8 + 0.25 * sin(t * 13.0 + aSeed * 3.0)) ;
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(p, 1.0); vN = normalize(normalMatrix * mat3(instanceMatrix) * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float k; varying float vH; varying vec3 vN; varying vec3 vV;
      void main(){ float e = pow(abs(dot(vN, vV)), 1.5); vec3 c = mix(vec3(4.0, 2.2, 0.7), vec3(2.2, 0.35, 0.05), vH); gl_FragColor = vec4(c * e * (1.0 - vH) * k, 1.0); }`,
  });
  const flameGeo = new THREE.SphereGeometry(0.5, 16, 12); flameGeo.translate(0, 0.0, 0);
  const fl = [...T.tips.filter(tp => tp.p.y > topTip.p.y - 1.4), ...T.nodes.filter(n => n.p.y > topTip.p.y - 1.6)].slice(0, 26);
  const flames = new THREE.InstancedMesh(flameGeo, flameM, fl.length);
  const seeds = new Float32Array(fl.length).map((_, i) => R()); flameGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
  const fm4 = new THREE.Matrix4(); flames.frustumCulled = false; S.add(flames);
  const fireLight = new THREE.PointLight(col('#ff7a20'), 0, 18, 1.6); fireLight.position.copy(strikeAt).add(v3(0, -0.4, 0.6)); fireLight.castShadow = false; S.add(fireLight);
  const embers = new Dust(70, { size: 0.03, color: '#ffa040', intensity: 3 }); S.add(embers);
  const ed = []; for (let i = 0; i < 70; i++) ed.push({ o: fl[i % fl.length].p.clone(), v: v3(R.range(-0.3, 0.3), R.range(0.6, 1.4), R.range(-0.3, 0.3)), ph: R() });
  const ST = 7 / 30; // strike: frame 397
  return {
    scene: S, cam: C,
    update(u, t) {
      // stepped leader descends just before the strike, return stroke on the hit, two re-strikes
      const lead = range(u, ST - 0.07, ST);
      const af = u - ST, ret = af >= 0 ? Math.exp(-af * 40) + 0.6 * Math.exp(-Math.pow((af - 0.06) / 0.012, 2)) + 0.3 * Math.exp(-Math.pow((af - 0.12) / 0.012, 2)) : 0;
      bolts.forEach(B => {
        const vis = af >= 0 ? (B.i === 0 ? 1 : clamp(1 - af * 8)) : lead;
        B.grp.visible = vis > 0 && (af < 0.22);
        B.g.setDrawRange(0, Math.floor((af >= 0 ? 1 : lead) * B.n / 3) * 3); B.hg.setDrawRange(0, Math.floor((af >= 0 ? 1 : lead) * B.hn / 3) * 3);
      });
      const bright = af >= 0 ? ret : lead * 0.15;
      boltM.color.copy(col('#f2eaff')).multiplyScalar(2 + 6 * bright); haloM.opacity = 0.15 + 0.4 * bright;
      boltLight.intensity = 260 * bright; skyU.flash.value = bright * 0.9;
      clouds.forEach((c, i) => c.material.color.copy(col('#1a2c30')).lerp(col('#a0a8e0'), clamp(bright * (0.8 - i * 0.15))));
      // ignition
      const fire = smooth(range(u, ST + 0.02, ST + 0.35));
      flameU.t.value = t; flameU.k.value = fire;
      fl.forEach((f, i) => { const s = (0.35 + 0.5 * seeds[i]) * fire * (1 + 0.15 * Math.sin(t * 11 + i)); fm4.makeScale(s * 0.8, s * 2.2, s * 0.8).setPosition(f.p.clone().add(v3(0, s * 0.8, 0))); flames.setMatrixAt(i, fm4); });
      flames.instanceMatrix.needsUpdate = true;
      woodM.emissiveIntensity = 1.6 * fire * (0.8 + 0.2 * Math.sin(t * 17));
      fireLight.intensity = 40 * fire * (0.85 + 0.15 * Math.sin(t * 23) * Math.sin(t * 7));
      ed.forEach((e, i) => { const a = ((t * 0.8 + e.ph) % 1); embers.setV(i, e.o.clone().addScaledVector(e.v, a * 1.6).add(v3(Math.sin(t * 3 + i) * 0.1, 0, 0))); embers.alpha[i] = fire * Math.sin(Math.PI * a); }); embers.dirty();
      const camP = v3(lerp(3.2, 2.4, u), lerp(1.0, 1.4, u), lerp(12.5, 10.5, easeOut(u))).add(drift(t, 0.02)).add(v3(0, 0, 0));
      const shake = af >= 0 ? Math.exp(-af * 25) * 0.04 : 0;
      look(C, camP.add(v3(Math.sin(t * 60) * shake, Math.cos(t * 47) * shake, 0)), v3(-0.5, lerp(3.2, 3.0, u), 0));
      return { bloom: 0.7, threshold: 0.85, exposure: 1.0, flash: af >= 0 ? 0.55 * Math.exp(-af * 50) : 0 };
    },
  };
}

export const shots = {
  iceberg: (p, ctx) => { window.__r = ctx.renderer; return icebergShot(p); },
  water: (p, ctx) => { window.__r = ctx.renderer; return waterShot(p); },
  ouroboros: (p, ctx) => { window.__r = ctx.renderer; return ouroborosShot(p); },
  dna: (p, ctx) => { window.__r = ctx.renderer; return dnaShot(p); },
  mitosis: (p, ctx) => { window.__r = ctx.renderer; return mitosisShot(p); },
  synapse: (p, ctx) => { window.__r = ctx.renderer; return synapseShot(p); },
  eden: (p, ctx) => { window.__r = ctx.renderer; return edenShot(p); },
  cambrian: (p, ctx) => { window.__r = ctx.renderer; return cambrianShot(p); },
  lightning: (p, ctx) => { window.__r = ctx.renderer; return lightningShot(p); },
};
