// 序 · 卵 and I 振 — gold on black, then the indigo cosmos.
import {
  THREE, TAU, clamp, lerp, smooth, smoother, easeOut, easeIn, easeInOut, range, v3, col, rng, fbm,
  displace, backdrop, rig, mats, materialize, canvasTexture, Dust, LineBuilder, tube, squareSpiral,
  camera, look, orbit, drift, seedPoint, noiseTexture, settle,
} from '../core.js';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

// egg profile (y from -1 to 1), slightly pointed at the top
const eggR = y => 0.74 * Math.sqrt(Math.max(0, 1 - y * y)) * (1 - 0.12 * y);
function eggGeometry(s = 1.3, seg = 160) {
  const pts = [];
  for (let i = 0; i <= 120; i++) { const y = -Math.cos(Math.PI * i / 120); pts.push(new THREE.Vector2(Math.max(1e-4, eggR(y) * s), y * s)); }
  return new THREE.LatheGeometry(pts, seg);
}
// 云雷纹 band as a bump map (lathe UV: x around, y bottom→top)
function thunderCloudBump() {
  return canvasTexture('yunlei-band', 2048, 1024, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'square';
    const band = (y0, hh, n, flip) => {
      g.fillStyle = '#fff'; g.fillRect(0, y0 - 6, w, 5); g.fillRect(0, y0 + hh + 1, w, 5);
      for (let k = 0; k < n; k++) {
        const cx = (k + 0.5) * w / n, sz = hh * 0.8;
        const sp = squareSpiral(3, 0.15);
        g.beginPath();
        sp.forEach((p, i) => { const x = cx + ((k + flip) % 2 ? -p.x : p.x) * sz, y = y0 + hh / 2 + p.y * sz; i ? g.lineTo(x, y) : g.moveTo(x, y); });
        g.stroke();
      }
    };
    band(h * 0.40, h * 0.1, 24, 0);
    band(h * 0.53, h * 0.07, 32, 1);
  }, { srgb: false });
}
// a cupped lotus petal rising from radius r0; open = tilt from vertical (rad). Rebuilt each frame.
const NU = 20, NV = 10;
function petalGeometry() {
  const geo = new THREE.BufferGeometry(), I = [], U = [];
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) U.push(j / NV, i / NU);
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((NU + 1) * (NV + 1) * 3), 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); geo.setIndex(I);
  return geo;
}
function shapePetal(geo, { len = 1.2, wid = 0.45, r0 = 0.5, open = 0.4, curl = 0.5, cup = 0.5 }) {
  const P = geo.attributes.position; let y = 0, z = 0; const spine = [];
  for (let i = 0; i <= NU; i++) { const a = open + curl * (i / NU) ** 2; spine.push([y, z, a]); y += Math.cos(a) * len / NU; z += Math.sin(a) * len / NU; }
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) {
    const s = i / NU, w = (j / NV - 0.5) * 2, [sy, sz, a] = spine[i];
    const half = wid * Math.sin(Math.PI * Math.min(1, Math.pow(s, 0.7) * 1.0)) * (1 - 0.35 * s) + 0.02;
    const k = cup * w * w * half;
    P.setXYZ(i * (NV + 1) + j, w * half, sy + k * Math.sin(a), r0 + sz - k * Math.cos(a));
  }
  P.needsUpdate = true; geo.computeVertexNormals();
}

export const shots = {
  // ── 0–4: a gold point unspools into a thread, the thread becomes a golden egg on a lotus; first crack of light ──
  egg() {
    const S = new THREE.Scene(), C = camera(32);
    backdrop(S, 'egg', { stars: 600 });
    const L = rig(S, 'egg', { key: v3(4, 7, 5), keyI: 2.2, rimI: 3 });
    // floor: dark lacquer that catches reflections and the egg's shadow
    const floor = new THREE.Mesh(new THREE.CircleGeometry(120, 96), new THREE.MeshStandardMaterial({ color: col('#080503'), roughness: 0.95, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -1.62; floor.receiveShadow = true; S.add(floor);

    const egg = new THREE.Mesh(eggGeometry(), mats.gold({ bumpMap: thunderCloudBump(), bumpScale: 4, roughness: 0.3 }));
    egg.castShadow = true; S.add(egg);
    const scan = materialize(egg, { color: '#ffd27a', wireGeometry: eggGeometry(1.3, 36).toNonIndexed() });

    // the fate thread: a glowing filament wound around the egg
    const thr = [v3(0, 0, 0)];
    for (let i = 0; i <= 700; i++) { const s = i / 700, y = -Math.cos(Math.PI * s), a = s * TAU * 11; thr.push(v3(Math.cos(a) * eggR(y) * 1.33, y * 1.33, Math.sin(a) * eggR(y) * 1.33)); }
    const threadGeo = tube(thr, 0.008, 1400, 6);
    const thread = new THREE.Mesh(threadGeo, mats.glow('#ffcf70', 2.5)); S.add(thread);
    const tIdx = threadGeo.index.count;

    // lotus: two rings of cupped petals that open
    const lotus = new THREE.Group(); lotus.position.y = -1.55; S.add(lotus);
    const petalMat = mats.organic('#f2c6b0', { roughness: 0.4, emissive: col('#ff9a60'), emissiveIntensity: 0.12, side: THREE.DoubleSide });
    const rings = [{ n: 14, len: 1.25, wid: 0.5, r0: 0.75, off: 0, open: 1.05 }, { n: 12, len: 1.15, wid: 0.46, r0: 0.6, off: TAU / 24, open: 0.7 }, { n: 10, len: 1.0, wid: 0.4, r0: 0.45, off: 0, open: 0.35 }];
    rings.forEach((R, ring) => {
      R.geo = petalGeometry();
      for (let k = 0; k < R.n; k++) {
        const pivot = new THREE.Group(); pivot.rotation.y = R.off + k / R.n * TAU;
        const m = new THREE.Mesh(R.geo, petalMat); m.castShadow = true; m.receiveShadow = true;
        pivot.add(m); lotus.add(pivot);
      }
    });

    // the crack of light (emissive lines just above the surface)
    const r = rng(9), cr = new LineBuilder();
    const onEgg = (a, y) => v3(Math.cos(a) * eggR(y) * 1.305, y * 1.3, Math.sin(a) * eggR(y) * 1.305);
    let a = 0.9, y = 0.95; const main = [onEgg(a, y)];
    while (y > -0.2) { y -= 0.04; a += r.range(-0.12, 0.12); main.push(onEgg(a, y)); if (r() < 0.15) { let ba = a, by = y; const br = [onEgg(ba, by)]; for (let k = 0; k < 6; k++) { by -= 0.03; ba += r.range(-0.1, 0.2); br.push(onEgg(ba, by)); } cr.poly(br, false, '#ffe8b8', 4); } }
    cr.poly(main, false, '#fff3d6', 10);
    const crackL = cr.build(1); S.add(crackL);
    const glowLight = new THREE.PointLight(col('#ffcf70'), 0, 6); glowLight.position.set(0.6, 0.6, 1.2); S.add(glowLight);

    const seed = seedPoint(); S.add(seed);
    const motes = new Dust(400, { size: 0.02, color: '#ffcf70', intensity: 2 }); S.add(motes);
    const md = []; for (let i = 0; i < 400; i++) md.push({ p: v3(r.range(-5, 5), r.range(-1.8, 3), r.range(-5, 3)), ph: r() });

    return {
      scene: S, cam: C,
      update(u, t) {
        seed.opacity(smooth(range(u, 0.03, 0.12)) * (1 - range(u, 0.3, 0.4)));
        seed.position.copy(thr[Math.floor(easeOut(range(u, 0.12, 0.45)) * 700)]);
        threadGeo.setDrawRange(0, Math.floor(easeOut(range(u, 0.12, 0.45)) * tIdx / 3) * 3);
        thread.material.color.copy(col('#ffcf70')).multiplyScalar(2.5 * (1 - range(u, 0.5, 0.66)));
        scan.set(easeInOut(range(u, 0.3, 0.72)), range(u, 0.2, 0.35));
        L.key.intensity = 2.2 * range(u, 0.25, 0.5); L.rim.intensity = 3 * range(u, 0.2, 0.45);
        rings.forEach((R, ring) => { const o = easeOut(range(u, 0.45 + ring * 0.04, 0.92)); shapePetal(R.geo, { len: R.len, wid: R.wid, r0: R.r0 * lerp(0.35, 1, o), open: lerp(-0.25, R.open, o), curl: lerp(-0.3, 0.6, o), cup: 0.55 }); });
        lotus.scale.setScalar(lerp(0.85, 1, smooth(range(u, 0.4, 0.9))));
        crackL.reveal(easeOut(range(u, 0.86, 0.98))); crackL.material.opacity = range(u, 0.86, 0.9);
        glowLight.intensity = 8 * range(u, 0.86, 1);
        md.forEach((m, i) => { motes.set(i, m.p.x + Math.sin(t * 0.7 + i) * 0.2, m.p.y + ((t * 0.15 + m.ph) % 1) * 0.6, m.p.z); motes.alpha[i] = 0.5 * range(u, 0.3, 0.6) * Math.sin(Math.PI * ((t * 0.15 + m.ph) % 1)); });
        motes.dirty();
        egg.rotation.y = 0.3 * t;
        const camP = orbit(lerp(9.5, 6.4, easeInOut(u)), lerp(-0.25, 0.25, u), lerp(0.08, 0.16, u)).add(drift(t, 0.02));
        look(C, camP, v3(0, lerp(0, -0.25, u), 0));
        return { bloom: 0.45, exposure: lerp(0.85, 0.95, u) };
      },
    };
  },

  // ── 4–6: the egg splits; Pangu's eyes rise — left becomes the Sun, right the Moon — over a dark ocean ──
  panguEyes(p, ctx) {
    const S = new THREE.Scene(), C = camera(34);
    backdrop(S, 'cosmos', { stars: 1400, seed: 11 });
    S.fog = null;
    S.environmentIntensity = 0.35;
    const hemi = new THREE.HemisphereLight(col('#8f7bff'), col('#05040c'), 0.25); S.add(hemi);

    // dark ocean planet: curved horizon low in frame, with a thin violet atmosphere at the limb
    const OR = 34, oc = v3(0, -OR - 2.3, -16);
    const ocean = new THREE.Mesh(new THREE.SphereGeometry(OR, 160, 80), new THREE.MeshPhysicalMaterial({ color: col('#010208'), roughness: 0.3, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 0.08 }));
    ocean.position.copy(oc); S.add(ocean);
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(OR * 1.01, 160, 80), limbMat('#8a70ff', 1.01, 1.1));
    atmo.position.copy(oc); S.add(atmo);

    // the two shell halves (gold outside, glowing inside, incandescent broken rim)
    const bump = thunderCloudBump();
    const outerM = mats.gold({ bumpMap: bump, bumpScale: 4, roughness: 0.3 });
    const innerM = new THREE.MeshStandardMaterial({ color: col('#3a2408'), roughness: 0.5, metalness: 0.2, emissive: col('#ffb85a'), emissiveIntensity: 2.2 });
    const rimM = new THREE.MeshBasicMaterial({ color: col('#fff0c8').multiplyScalar(3), side: THREE.DoubleSide });
    const halves = [-1, 1].map(side => { const g = new THREE.Group(); g.add(new THREE.Mesh(shellHalfGeometry(side), [outerM, innerM, rimM])); S.add(g); return g; });
    const core = new THREE.PointLight(col('#ffcf80'), 0, 0, 0); S.add(core);
    const coreGlow = glowSprite('#ffd890', 3); S.add(coreGlow);

    // SUN: granulated photosphere with limb darkening + soft corona
    const sunR = 0.82;
    const gran = noiseTexture('sun-gran', { size: 512, scale: 46, octaves: 4, contrast: 1.8 });
    const gran2 = noiseTexture('sun-gran2', { size: 256, scale: 10, octaves: 3, contrast: 1.4 });
    gran.wrapS = gran.wrapT = gran2.wrapS = gran2.wrapT = THREE.RepeatWrapping;
    const sunMat = new THREE.ShaderMaterial({
      uniforms: { tG: { value: gran }, tG2: { value: gran2 }, uT: { value: 0 }, uI: { value: 1 } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: `uniform sampler2D tG, tG2; uniform float uT, uI; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){
          float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
          float g = texture2D(tG, vUv * vec2(3.0, 1.5) + vec2(uT * 0.01, 0.0)).r;
          float g2 = texture2D(tG2, vUv * vec2(2.0, 1.0) - vec2(uT * 0.004, 0.0)).r;
          float limb = 0.35 + 0.65 * pow(mu, 0.55);
          vec3 hot = vec3(1.0, 0.86, 0.62), deep = vec3(0.95, 0.38, 0.08);
          vec3 c = mix(deep, hot, smoothstep(0.15, 0.95, mu)) * limb;
          c *= 0.62 + 0.5 * g + 0.25 * (g2 - 0.5);
          gl_FragColor = vec4(c * uI, 1.0);
        }`,
    });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(sunR, 96, 64), sunMat); S.add(sun);
    const corona = glowSprite('#ffb85a', 1); S.add(corona);
    const sunLight = new THREE.PointLight(col('#ffe2b0'), 0, 0, 0); S.add(sunLight);

    // MOON: cratered grey sphere (displaced craters + maria vertex colours), lit by the sun, cool rim
    const moonR = 0.74;
    const moonGeo = moonGeometry(rng(23));
    const moonM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, bumpMap: noiseTexture('moon-bump', { size: 512, scale: 60, octaves: 4, contrast: 1.6 }), bumpScale: 0.6, emissive: col('#ffcf80'), emissiveIntensity: 0 });
    const moon = new THREE.Mesh(moonGeo, moonM); S.add(moon);
    const moonRim = new THREE.SpotLight(col('#9fb4ff'), 0, 0, 0.12, 0.5, 0); S.add(moonRim, moonRim.target);
    const moonGlow = glowSprite('#9fb0ff', 0.25); S.add(moonGlow);

    const sunEnd = v3(-2.3, 1.7, -1.4), moonEnd = v3(2.35, 1.45, -1.0);
    return {
      scene: S, cam: C,
      update(u, t) {
        const open = easeOut(range(u, 0.0, 0.62));
        const away = easeIn(range(u, 0.35, 1));
        halves.forEach((g, i) => {
          const s = i ? 1 : -1;
          g.position.set(s * (1.5 * open + 1.6 * away), -0.35 * open - 4.5 * away, -0.4 * open + 1.0 * away);
          g.rotation.set(0.25 * open, -s * 0.85 * open, -s * (0.55 * open + 0.5 * away));
        });
        innerM.emissiveIntensity = lerp(2.0, 1.0, range(u, 0.1, 0.7));
        rimM.color.copy(col('#fff0c8')).multiplyScalar(lerp(2.2, 1.0, range(u, 0.15, 0.7)));
        core.intensity = 8 * Math.sin(Math.PI * range(u, 0, 0.7)) + 1;
        coreGlow.material.opacity = 0.5 * Math.sin(Math.PI * range(u, -0.1, 0.5));
        coreGlow.scale.setScalar(lerp(1.6, 3.2, range(u, 0, 0.4)));

        // the eyes rise out of the egg and part
        const rise = easeInOut(range(u, 0.08, 0.86));
        const arc = b => v3(lerp(b.x * 0.06, b.x, rise), lerp(0.05, b.y, Math.pow(rise, 0.7)), lerp(0, b.z, rise));
        const sp = arc(sunEnd), mp = arc(moonEnd);
        sun.position.copy(sp); moon.position.copy(mp);
        const grow = lerp(0.18, 1, easeOut(range(u, 0.05, 0.8)));
        sun.scale.setScalar(grow); moon.scale.setScalar(grow * moonR);
        sunMat.uniforms.uT.value = t; sunMat.uniforms.uI.value = lerp(1.15, 0.9, range(u, 0.3, 0.9));
        corona.position.copy(sp); corona.scale.setScalar(sunR * grow * 5.2); corona.material.opacity = 0.45 * range(u, 0.05, 0.4);
        sunLight.position.copy(sp); sunLight.intensity = 4.5 * range(u, 0.1, 0.6);
        // the right eye cools from molten gold to grey stone
        const cool = smooth(range(u, 0.25, 0.75));
        moonM.emissiveIntensity = 1.1 * (1 - cool);
        moonGlow.position.copy(mp); moonGlow.scale.setScalar(moonR * grow * 3.2); moonGlow.material.opacity = 0.35 * cool;
        moonRim.position.copy(mp).add(v3(4, 2.5, -7)); moonRim.target.position.copy(mp); moonRim.intensity = 2.5 * cool;
        moon.rotation.y = 0.6 + t * 0.15; sun.rotation.y = t * 0.1;

        const k = easeInOut(u);
        const camP = v3(lerp(1.5, 0.0, k), lerp(0.55, 0.9, k), lerp(6.6, 11.0, k)).add(drift(t, 0.02, 4));
        look(C, camP, v3(0, lerp(0.1, 0.85, k), lerp(0, -1, k)));
        return { bloom: 0.55, threshold: 0.85, exposure: 1.0, vignette: 0.85 };
      },
    };
  },

  // ── 6–8 (and flash @43): strings crystallize into Kepler's nested Platonic solids ──
  solids(p) {
    const S = new THREE.Scene(), C = camera(30);
    backdrop(S, 'cosmos', { stars: 1200, seed: 5 });
    S.fog = null;
    rig(S, 'cosmos', { key: v3(5, 7, 6), keyI: 2.6, rimI: 3.5, fillI: 0.35, shadow: false });
    S.environmentIntensity = 0.9;

    // Kepler's order outside → in, with radii loosened so each frame clears the next
    const defs = [
      { g: new THREE.BoxGeometry(2.31, 2.31, 2.31), r: 0.034, rate: v3(0.10, 0.16, 0.03), c: '#ffc35a' },
      { g: new THREE.TetrahedronGeometry(1.1), r: 0.024, rate: v3(-0.22, 0.12, 0.18), c: '#ffd27a' },
      { g: new THREE.DodecahedronGeometry(0.6), r: 0.015, rate: v3(0.3, -0.25, 0.1), c: '#f0b04a' },
      { g: new THREE.IcosahedronGeometry(0.46), r: 0.012, rate: v3(-0.2, 0.42, -0.3), c: '#ffcf70' },
      { g: new THREE.OctahedronGeometry(0.35), r: 0.010, rate: v3(0.5, 0.3, 0.45), c: '#ffdc9a' },
    ];
    const sphereR = [2.06, 1.13, 0.62, 0.475, 0.36, 0.2];
    const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 12, 1, true), jointGeo = new THREE.SphereGeometry(1, 16, 12);
    const solids = defs.map((d, i) => {
      const grp = new THREE.Group(); S.add(grp);
      const { edges, verts } = polyEdges(d.g);
      const m = mats.gold({ color: col(d.c), roughness: 0.2 + i * 0.03, clearcoat: 0.6 });
      const beams = new THREE.InstancedMesh(beamGeo, m, edges.length), joints = new THREE.InstancedMesh(jointGeo, m, verts.length);
      grp.add(beams, joints);
      const setR = rr => {
        const M = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = v3();
        edges.forEach(([a, b], k) => { const dir = b.clone().sub(a); q.setFromUnitVectors(v3(0, 1, 0), dir.clone().normalize()); sc.set(rr, dir.length(), rr); M.compose(a.clone().add(b).multiplyScalar(0.5), q, sc); beams.setMatrixAt(k, M); });
        verts.forEach((v, k) => { M.compose(v, q.identity(), sc.setScalar(rr * 1.7)); joints.setMatrixAt(k, M); });
        beams.instanceMatrix.needsUpdate = joints.instanceMatrix.needsUpdate = true;
      };
      setR(d.r);
      return { grp, setR, d, edges };
    });
    // thin glass spheres between the solids, each with a gold orbit band and a tiny planet
    const spheres = sphereR.map((r, i) => {
      const grp = new THREE.Group(); S.add(grp);
      const glass = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 40), glassBubbleMat('#c4b8ff', 1)); grp.add(glass);
      const band = new THREE.Mesh(new THREE.TorusGeometry(r, 0.004 + r * 0.002, 6, 128), mats.glow('#ffcf70', 1.6)); band.rotation.x = Math.PI / 2; grp.add(band);
      const planet = new THREE.Mesh(new THREE.SphereGeometry(0.018 + r * 0.012, 16, 12), mats.glow(i % 2 ? '#d8d0ff' : '#ffe2b0', 3)); grp.add(planet);
      grp.rotation.set(0.35 * Math.sin(i * 2.1), 0, 0.25 * Math.cos(i * 1.7));
      return { grp, r, planet, band, glass };
    });
    // the sun at the centre
    const sunC = new THREE.Mesh(new THREE.SphereGeometry(0.075, 32, 20), mats.glow('#ffe0a0', 3)); S.add(sunC);
    const sunGlow = glowSprite('#ffc060', 0.7); sunGlow.scale.setScalar(0.6); S.add(sunGlow);
    const sunL = new THREE.PointLight(col('#ffd090'), 1.2, 0, 0); S.add(sunL);

    // closed strings: vibrating loops that settle onto the cube's face squares
    const r = rng(77), cube = solids[0];
    const h = 2.31 / 2;
    const faces = [
      [v3(-h, h, -h), v3(h, h, -h), v3(h, h, h), v3(-h, h, h)],
      [v3(-h, -h, h), v3(h, -h, h), v3(h, -h, -h), v3(-h, -h, -h)],
      [v3(-h, -h, h), v3(-h, h, h), v3(h, h, h), v3(h, -h, h)],
      [v3(h, -h, -h), v3(h, h, -h), v3(-h, h, -h), v3(-h, -h, -h)],
    ];
    const NS = 128;
    const strings = faces.map((f, i) => {
      const e1 = r.dir(), e3 = r.dir().cross(e1).normalize(), e2 = e3.clone().cross(e1).normalize();
      const s = { f, e1, e2, e3, c: r.dir().multiplyScalar(r.range(0.2, 0.7)), R: r.range(0.55, 0.85), n: [3, 4, 5, 6][i], m: [2, 5, 3, 4][i], w: r.range(16, 24), ph: r() * TAU };
      s.mesh = new THREE.Mesh(new THREE.BufferGeometry(), mats.glow(i % 2 ? '#fff0d0' : '#ffd890', 4));
      cube.grp.add(s.mesh);
      return s;
    });
    const squareAt = (f, x) => { x = ((x % 1) + 1) % 1 * 4; const k = Math.floor(x); return f[k].clone().lerp(f[(k + 1) % 4], x - k); };

    return {
      scene: S, cam: C,
      update(u, t) {
        const cryst = smoother(range(u, 0.08, 0.27));
        const strOn = 1 - range(u, 0.28, 0.36);
        strings.forEach((s, i) => {
          s.mesh.visible = strOn > 0;
          if (!s.mesh.visible) return;
          const amp = (1 - cryst) * (0.75 + 0.25 * Math.sin(t * 3 + i));
          const pts = [];
          for (let j = 0; j < NS; j++) {
            const th = j / NS * TAU;
            const wob = Math.sin(s.n * th + s.ph) * Math.cos(s.w * t + i) * 0.16 * amp;
            const wz = Math.sin(s.m * th) * Math.sin(s.w * 1.3 * t + s.ph) * 0.14 * amp;
            const loop = s.c.clone().multiplyScalar(1 - cryst).add(s.e1.clone().multiplyScalar(Math.cos(th) * s.R * (1 + wob))).add(s.e2.clone().multiplyScalar(Math.sin(th) * s.R * (1 + wob))).add(s.e3.clone().multiplyScalar(wz));
            pts.push(loop.lerp(squareAt(s.f, th / TAU + 0.125), cryst));
          }
          s.mesh.geometry.dispose();
          s.mesh.geometry = tube(pts, 0.012 + 0.006 * cryst, NS * 2, 6, true);
          s.mesh.material.color.copy(col(i % 2 ? '#fff0d0' : '#ffd890')).multiplyScalar(lerp(3, 1.1, cryst) * strOn);
        });
        // the cube's gold beams thicken out of the strings, the inner solids unfold in sequence
        cube.setR(cube.d.r * smooth(range(u, 0.2, 0.34)));
        cube.grp.visible = true;
        solids.forEach((s, i) => {
          const rr = s.d.rate;
          s.grp.rotation.set(rr.x * t * 2.2 + i, rr.y * t * 2.2 + i * 0.7, rr.z * t * 2.2);
          if (i === 0) return;
          const g = settle(range(u, 0.24 + i * 0.045, 0.42 + i * 0.045));
          s.grp.scale.setScalar(Math.max(1e-3, g)); s.grp.visible = g > 0.001;
        });
        spheres.forEach((sp, i) => {
          const g = smooth(range(u, 0.22 + i * 0.045, 0.4 + i * 0.045));
          sp.grp.visible = g > 0.001; sp.grp.scale.setScalar(Math.max(1e-3, lerp(0.85, 1, g)));
          sp.glass.material.uniforms.uK.value = g * (i === 0 ? 0.6 : 0.75);
          sp.band.material.color.copy(col('#ffcf70')).multiplyScalar(1.4 * g);
          const a = t * (1.6 - i * 0.18) + i * 1.3;
          sp.planet.position.set(Math.cos(a) * sp.r, 0, Math.sin(a) * sp.r); sp.planet.visible = g > 0.5;
          sp.grp.rotation.y = t * 0.1 * (i % 2 ? 1 : -1);
        });
        const sg = smooth(range(u, 0.3, 0.5));
        sunC.scale.setScalar(Math.max(1e-3, sg)); sunGlow.material.opacity = 0.8 * sg;
        const k = easeInOut(u);
        const camP = orbit(lerp(11, 7.3, k), lerp(-0.35, 0.15, k), lerp(0.32, 0.2, k)).add(drift(t, 0.02, 2));
        look(C, camP, v3(0, 0, 0));
        return { bloom: 0.5, threshold: 0.85, exposure: 1.05, vignette: 0.85 };
      },
    };
  },

  // ── 8–10: hydrogen orbitals 2s → 4p → 6d, cut-away isosurfaces coloured by phase ──
  orbitals() {
    const S = new THREE.Scene(), C = camera(32);
    backdrop(S, 'cosmos', { stars: 900, seed: 8 });
    S.fog = null;
    const L = rig(S, 'cosmos', { key: v3(4, 7, 6), keyI: 2.4, rimI: 3.5, fillI: 0.4, shadow: false });
    S.environmentIntensity = 0.5;
    const RES = 76, N3 = RES * RES * RES;
    const orbs = [
      { f: (x, y, z, r) => (2 - r) * Math.exp(-r / 2), ext: 9.5, iso: 0.2 },
      { f: (x, y, z, r) => (r * r / 4 - 5 * r + 20) * Math.exp(-r / 4) * y, ext: 32, iso: 0.26 },
      { f: (x, y, z, r) => { const q = r / 3, c = r > 1e-6 ? y / r : 1; return q * q * Math.exp(-q / 2) * (-q * q * q + 24 * q * q - 168 * q + 336) / 6 * (3 * c * c - 1); }, ext: 62, iso: 0.26 },
    ];
    // sample each wavefunction (weighted by r to equalise the nested shells) into its own grid, with a cut-away wedge facing camera
    orbs.forEach(o => {
      const F = new Float32Array(N3); let mx = 0;
      for (let k = 0; k < RES; k++) for (let j = 0; j < RES; j++) for (let i = 0; i < RES; i++) {
        const gx = (i - RES / 2) / (RES / 2), gy = (j - RES / 2) / (RES / 2), gz = (k - RES / 2) / (RES / 2);
        const x = gx * o.ext, y = gy * o.ext, z = gz * o.ext, rr = Math.hypot(x, y, z);
        const v = o.f(x, y, z, rr) * (rr + 1);
        F[i + j * RES + k * RES * RES] = v; mx = Math.max(mx, Math.abs(v));
      }
      for (let n = 0; n < N3; n++) F[n] /= mx * o.iso;
      o.F = F;
    });
    // wedge mask (in grid coords): removes the octant x>0, z>0 so the inner shells show
    const mask = new Float32Array(N3);
    for (let k = 0; k < RES; k++) for (let j = 0; j < RES; j++) for (let i = 0; i < RES; i++) {
      const gx = (i - RES / 2) / (RES / 2), gz = (k - RES / 2) / (RES / 2), gr = Math.hypot(gx, (j - RES / 2) / (RES / 2), gz);
      const w = smooth((Math.min(gx, gz) + 0.02) / 0.06);
      mask[i + j * RES + k * RES * RES] = (1 - w) * smooth((0.97 - gr) / 0.06);
    }
    const mkMat = (c, e) => new THREE.MeshPhysicalMaterial({ color: col(c), roughness: 0.24, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.22, emissive: col(e), emissiveIntensity: 0.2, iridescence: 0.0 });
    const pos = new MarchingCubes(RES, mkMat('#ffb540', '#ff8a20'), false, false, 140000);
    const neg = new MarchingCubes(RES, mkMat('#8a74f0', '#4a2cff'), false, false, 140000);
    pos.isolation = neg.isolation = 1;
    const grp = new THREE.Group(); grp.add(pos, neg); S.add(grp);
    grp.scale.setScalar(1.6);
    const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), mats.glow('#fff4e0', 6)); S.add(nuc);
    const nucGlow = glowSprite('#ffe0a0', 0.9); nucGlow.scale.setScalar(0.35); S.add(nucGlow);
    const inner = new THREE.PointLight(col('#ffd8a0'), 0.8, 0, 0); S.add(inner);
    let lastKey = '';
    const fill = (a, b, k) => {
      const key = a + ':' + b + ':' + k.toFixed(3);
      if (key === lastKey) return; lastKey = key;
      const A = orbs[a].F, B = orbs[b].F, P = pos.field, Ng = neg.field;
      for (let n = 0; n < N3; n++) { const v = (k <= 0 ? A[n] : k >= 1 ? B[n] : A[n] + (B[n] - A[n]) * k) * mask[n]; P[n] = v; Ng[n] = -v; }
      pos.normal_cache.fill(0); neg.normal_cache.fill(0);
      pos.update(); neg.update();
    };
    return {
      scene: S, cam: C,
      update(u, t) {
        const b1 = smoother(range(u, 0.3, 0.37)), b2 = smoother(range(u, 0.635, 0.705));
        if (u < 0.5) fill(0, 1, b1); else fill(1, 2, b2);
        const pop = u < 0.5 ? (u < 0.333 ? settle(range(u, 0, 0.12)) : settle(range(u, 0.333, 0.45))) : settle(range(u, 0.667, 0.79));
        grp.scale.setScalar(1.25 * lerp(0.9, 1, pop));
        grp.rotation.set(0.12, -0.25 + t * 0.12, 0.05);
        const k = easeInOut(u);
        const camP = orbit(lerp(7.6, 7.2, k), lerp(0.15, 0.45, k), lerp(0.62, 0.2, smooth(range(u, 0.25, 0.75)))).add(drift(t, 0.015, 3));
        look(C, camP, v3(0, 0, 0));
        L.key.position.copy(camP).add(v3(3, 5, 0));
        return { bloom: 0.4, threshold: 1.0, exposure: 1.0, vignette: 0.9 };
      },
    };
  },

  // ── 10–12: an iron meteorite (sawn face shows Widmanstätten) burns into the air over a polar Earth ──
  meteor(p, ctx) {
    const S = new THREE.Scene(), C = camera(38, 0.05, 3000);
    backdrop(S, 'cosmos', { stars: 1600, seed: 19, radius: 900 });
    S.fog = null;
    S.environmentIntensity = 0.45;
    const sunDir = v3(0.75, 0.45, -0.35).normalize();
    const key = new THREE.DirectionalLight(col('#fff1d6'), 3.2); key.position.copy(sunDir).multiplyScalar(50); S.add(key, key.target);
    const rimL = new THREE.DirectionalLight(col('#8f7bff'), 1.5); rimL.position.set(-30, 10, -40); S.add(rimL);
    S.add(new THREE.HemisphereLight(col('#3a4a8a'), col('#05040c'), 0.25));
    const earthshine = new THREE.DirectionalLight(col('#6f9cff'), 1.4); earthshine.position.set(-0.3, -1, 0.6); S.add(earthshine);

    // EARTH (polar view): baked albedo in an azimuthal pole-centred projection, lit by the sun, with atmosphere
    const ER = 70, ec = v3(6, -70.5, -80);
    const earthTex = bakeEarth(ctx.renderer);
    const camAt = u => v3(lerp(0, 0.6, u), lerp(0, -0.5, u), lerp(0, -1.0, u));
    const pole = camAt(0.5).sub(ec).normalize().applyAxisAngle(v3(1, 0, 0), -0.42).applyAxisAngle(v3(0, 0, 1), 0.38);
    const earth = new THREE.Mesh(new THREE.SphereGeometry(ER, 256, 128), new THREE.ShaderMaterial({
      uniforms: { tMap: { value: earthTex }, uSun: { value: sunDir }, uRot: { value: 0 } },
      vertexShader: 'varying vec3 vL; varying vec3 vN; varying vec3 vW; void main(){ vL = position; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform sampler2D tMap; uniform vec3 uSun; uniform float uRot; varying vec3 vL; varying vec3 vN; varying vec3 vW;
        void main(){
          vec3 p = normalize(vL);
          float th = acos(clamp(p.y, -1.0, 1.0)), ph = atan(p.z, p.x) + uRot;
          vec2 uv = 0.5 + 0.5 * (th / 3.14159265) * vec2(cos(ph), sin(ph));
          vec4 tx = texture2D(tMap, uv);
          vec3 N = normalize(vN), V = normalize(cameraPosition - vW), L = normalize(uSun);
          float ndl = dot(N, L), day = smoothstep(-0.12, 0.45, ndl);
          vec3 c = tx.rgb * (day * 0.9 + 0.01);
          float spec = pow(max(dot(reflect(-L, N), V), 0.0), 50.0) * tx.a * day;
          c += vec3(1.0, 0.9, 0.75) * spec * 1.4;
          float f = pow(1.0 - max(dot(N, V), 0.0), 2.5);
          c += vec3(0.2, 0.4, 1.0) * f * (0.03 + 0.35 * smoothstep(-0.25, 0.5, ndl));
          gl_FragColor = vec4(c, 1.0);
        }`,
    }));
    earth.position.copy(ec);
    earth.quaternion.setFromUnitVectors(v3(0, 1, 0), pole);
    S.add(earth);
    const atm = new THREE.Mesh(new THREE.SphereGeometry(ER * 1.028, 192, 96), new THREE.ShaderMaterial({
      side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uSun: { value: sunDir }, uLimb: { value: Math.sqrt(1 - 1 / (1.028 * 1.028)) } },
      vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform vec3 uSun; uniform float uLimb; varying vec3 vN; varying vec3 vW;
        void main(){ vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
          float d = clamp(-dot(N, V) / uLimb, 0.0, 1.0);
          float g = pow(d, 3.0);
          float day = smoothstep(-0.35, 0.5, dot(N, normalize(uSun)));
          gl_FragColor = vec4(vec3(0.3, 0.55, 1.0) * g * (0.1 + 0.9 * day), 1.0); }`,
    }));
    atm.position.copy(ec); S.add(atm);

    // METEORITE
    const met = new THREE.Group(); S.add(met);
    const { geo: rockGeo, nS } = meteoriteGeometry(rng(31));
    const crust = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.3, roughness: 0.85, roughnessMap: noiseTexture('rough-mid', { scale: 12, contrast: 1.4 }) });
    const sawn = new THREE.MeshStandardMaterial({ map: widmanstatten(), metalness: 0.6, roughness: 0.75, roughnessMap: widmanstatten(true), color: col('#d0d3d8'), envMapIntensity: 2.0 });
    const heat = { uVel: { value: v3(1, 0, 0) }, uHeat: { value: 0 }, uHeatCol: { value: col('#ff7a2a') } };
    heatPatch(crust, heat); heatPatch(sawn, { ...heat, uHeat: heat.uSawn = { value: 0 } });
    const rock = new THREE.Mesh(rockGeo, [crust, sawn]); met.add(rock);
    const hotL = new THREE.PointLight(col('#ff9a50'), 0, 0, 2); S.add(hotL);

    // plasma: bow-shock sheath around the leading face, and a long tapered trail
    const plasmaU = { uT: { value: 0 }, uI: { value: 0 } };
    const sheath = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: plasmaU,
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: `uniform float uT, uI; varying vec3 vN; varying vec3 vV; varying vec3 vP;
        void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
          float front = smoothstep(0.1, 0.95, vP.y);
          float fl = 0.8 + 0.2 * sin(vP.x * 9.0 + uT * 40.0) * sin(vP.z * 7.0 - uT * 31.0);
          vec3 c = mix(vec3(1.0, 0.45, 0.12), vec3(1.0, 0.85, 0.6), front);
          gl_FragColor = vec4(c * f * front * fl * uI * 0.9, 1.0); }`,
    }));
    const trailGeo = new THREE.CylinderGeometry(0.0, 1, 1, 64, 40, true); trailGeo.translate(0, 0.5, 0); trailGeo.rotateZ(Math.PI); trailGeo.translate(0, 0, 0);
    // after rotateZ(π): base (r=1) at y=0, apex at y=-1 → trail extends along -Y
    const trail = new THREE.Mesh(trailGeo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: plasmaU,
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: `uniform float uT, uI; varying vec3 vN; varying vec3 vV; varying vec3 vP;
        void main(){ float s = clamp(-vP.y, 0.0, 1.0);
          float core = pow(abs(dot(normalize(vN), normalize(vV))), 2.0);
          float fall = pow(1.0 - s, 2.6) * smoothstep(0.0, 0.04, s);
          float a = atan(vP.z, vP.x);
          float streak = 0.65 + 0.35 * sin(a * 9.0 + s * 26.0 - uT * 22.0) * sin(a * 4.0 - s * 13.0 + uT * 9.0);
          vec3 c = mix(vec3(1.0, 0.82, 0.55), vec3(0.9, 0.3, 0.12), pow(s, 0.45));
          c = mix(c, vec3(0.45, 0.3, 1.0), smoothstep(0.55, 1.0, s));
          gl_FragColor = vec4(c * core * fall * streak * uI * 0.9, 1.0); }`,
    }));
    const plasma = new THREE.Group(); plasma.add(trail); S.add(plasma);
    const headGlow = glowSprite('#ffb070', 0); S.add(headGlow);

    // flight path: from far upper-left down toward (and finally past) the camera
    const A = v3(-7.5, 3.3, -12.5), B = v3(1.2, 0.4, -8.5), Cc = v3(0.5, 0.0, -2.0);
    const metAt = u => {
      if (u < 0.68) return A.clone().lerp(B, Math.pow(u / 0.68, 1.15));
      return B.clone().lerp(Cc, easeIn(range(u, 0.68, 0.88)) * 0.92 + range(u, 0.68, 0.88) * 0.08);
    };
    const velAt = u => metAt(Math.min(0.999, u + 0.01)).sub(metAt(Math.max(0, u - 0.01))).normalize();
    // orientation: tumbling slowly, sawn face turned toward camera around u≈0.5
    const qBase = new THREE.Quaternion().setFromUnitVectors(nS, camAt(0.5).sub(metAt(0.5)).normalize().addScaledVector(sunDir, 0.3).normalize());
    const tumbleAxis = v3(0.3, 1, 0.2).normalize();
    return {
      scene: S, cam: C,
      update(u, t) {
        const mp = metAt(u), vel = velAt(Math.max(0.02, Math.min(u, 0.8))), cp0 = camAt;
        met.position.copy(mp);
        met.quaternion.setFromAxisAngle(tumbleAxis, (t - 0.5) * 1.1).multiply(qBase);
        met.scale.setScalar(1.0);
        const hk = smooth(range(u, 0.0, 0.7)), toCam = Math.max(0, vel.dot(cp0(u).sub(mp).normalize()));
        heat.uVel.value.copy(vel); heat.uHeat.value = lerp(0.25, 1.4, hk) * (1 - 0.75 * smooth(toCam)); heat.uSawn.value = heat.uHeat.value * 0.12;
        hotL.position.copy(mp).addScaledVector(vel, -1.5).add(v3(0, 1.2, 0)); hotL.intensity = lerp(1, 4, hk);
        plasma.position.copy(mp);
        plasma.quaternion.setFromUnitVectors(v3(0, 1, 0), vel);
        sheath.scale.set(1.3, 1.0, 1.3); sheath.position.set(0, 0.35, 0);
        trail.scale.set(lerp(0.9, 1.15, hk), lerp(10, 18, hk), lerp(0.9, 1.15, hk)); trail.position.set(0, -0.35, 0);
        plasmaU.uT.value = t; plasmaU.uI.value = lerp(0.35, 1.0, hk);
        headGlow.position.copy(mp).addScaledVector(vel, 0.5); headGlow.scale.setScalar(lerp(2.5, 4.5, hk)); headGlow.material.opacity = lerp(0.15, 0.45, hk);
        earth.material.uniforms.uRot.value = t * 0.01;
        // camera: slow truck + pan that keeps the rock framed left of centre, then it rushes past
        const cp = camAt(u).add(drift(t, 0.03, 7));
        const lead = 1 - smooth(range(u, 0.55, 0.85));
        const tgt = mp.clone().add(v3(1.4, -1.1, 0).multiplyScalar(lead * (mp.distanceTo(cp) / 10)));
        look(C, cp, tgt);
        return { bloom: 0.6, threshold: 0.85, exposure: 1.0, vignette: 0.9 };
      },
    };
  },
};

// ================================================================ helpers for the cosmos shots
// soft radial glow sprite (additive); intensity scales the HDR colour
function glowSprite(color, opacity = 1) {
  const tex = canvasTexture('glow-radial', 256, 256, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    for (let i = 0; i <= 16; i++) { const x = i / 16; const a = Math.exp(-x * x * 7) * (1 - x); gr.addColorStop(x, `rgba(255,255,255,${a.toFixed(4)})`); }
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: col(color), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  return s;
}
// thin atmosphere seen at a planet's limb: back faces of a slightly larger shell, brightest right at the limb
function limbMat(color, ratio = 1.02, k = 1) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { c: { value: col(color) }, uK: { value: k }, uLimb: { value: Math.sqrt(1 - 1 / (ratio * ratio)) } },
    vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'uniform vec3 c; uniform float uK, uLimb; varying vec3 vN; varying vec3 vW; void main(){ float d = clamp(-dot(normalize(vN), normalize(cameraPosition - vW)) / uLimb, 0.0, 1.0); gl_FragColor = vec4(c * pow(d, 4.0) * uK, 1.0); }',
  });
}
// additive fresnel shell (atmospheres)
function fresnelMat(color, { power = 3, k = 1, back = false } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: back ? THREE.BackSide : THREE.FrontSide,
    uniforms: { c: { value: col(color) }, uK: { value: k }, uP: { value: power } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 c; uniform float uK, uP; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uP); gl_FragColor = vec4(c * f * uK, 1.0); }',
  });
}
// thin glass bubble: fresnel rim + a sharp key-light highlight, additive (cheap, no transmission pass)
function glassBubbleMat(color, k = 1) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { c: { value: col(color) }, uK: { value: k } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vWN; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vWN = normalize(mat3(modelMatrix) * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform vec3 c; uniform float uK; varying vec3 vN; varying vec3 vV; varying vec3 vWN;
      void main(){ vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N; vec3 V = normalize(vV);
        float f = pow(1.0 - abs(dot(N, V)), 3.0);
        vec3 Lv = normalize((viewMatrix * vec4(0.45, 0.7, 0.55, 0.0)).xyz);
        float sp = pow(max(dot(reflect(-Lv, N), V), 0.0), 140.0) * (gl_FrontFacing ? 1.0 : 0.25);
        gl_FragColor = vec4((c * (0.004 + f * 0.32) + vec3(1.0, 0.95, 0.85) * sp * 1.4) * uK, 1.0); }`,
  });
}
// unique edges + vertices of a polyhedron (coplanar triangle diagonals removed)
function polyEdges(g) {
  const e = new THREE.EdgesGeometry(g, 1), P = e.attributes.position, edges = [], verts = [];
  const key = v => `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`, seen = new Map();
  const add = v => { const k = key(v); if (!seen.has(k)) { seen.set(k, verts.length); verts.push(v); } return verts[seen.get(k)]; };
  for (let i = 0; i < P.count; i += 2) edges.push([add(v3().fromBufferAttribute(P, i)), add(v3().fromBufferAttribute(P, i + 1))]);
  return { edges, verts };
}
// one half of the cracked egg: outer gold shell (group 0), glowing inner wall (1), broken rim (2)
function shellHalfGeometry(side, nA = 72, nY = 110) {
  const tri = x => 1 - 4 * Math.abs(x - Math.floor(x + 0.5));
  const jagF = y => 0.12 * tri(y * 2.3 + 0.3) + 0.07 * tri(y * 5.7 + 0.1) + 0.035 * Math.sin(y * 29 + 1) + 0.02 * fbm(y * 9, 1, 2, 2);
  const jagB = y => 0.1 * tri(y * 1.9 + 0.7) + 0.06 * tri(y * 4.9 + 0.4) + 0.03 * Math.sin(y * 23);
  const aF = y => Math.PI / 2 + jagF(y), aB = y => -Math.PI / 2 + jagB(y);
  const span = y => side > 0 ? [aB(y), aF(y)] : [aF(y), aB(y) + TAU];
  const S = 1.3, pos = [], uv = [], idx = [[], [], []];
  const at = (j, i, inner) => {
    const phi = Math.PI * j / nY, y = -Math.cos(phi), [a0, a1] = span(y), a = lerp(a0, a1, i / nA), R = eggR(y) * (inner ? 0.955 : 1);
    return [Math.cos(a) * R * S, y * S * (inner ? 0.97 : 1), Math.sin(a) * R * S, a / TAU, phi / Math.PI];
  };
  const base = [0, 0];
  [false, true].forEach((inner, b) => {
    base[b] = pos.length / 3;
    for (let j = 0; j <= nY; j++) for (let i = 0; i <= nA; i++) { const q = at(j, i, inner); pos.push(q[0], q[1], q[2]); uv.push(q[3], q[4]); }
  });
  const vid = (b, j, i) => base[b] + j * (nA + 1) + i;
  const P = k => v3(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
  const triOut = (grp, a, b, c, wantOut) => {
    const pa = P(a), pb = P(b), pc = P(c), n = pb.clone().sub(pa).cross(pc.clone().sub(pa)), cen = pa.add(pb).add(pc);
    const out = n.dot(cen) >= 0;
    if (out === wantOut) idx[grp].push(a, b, c); else idx[grp].push(a, c, b);
  };
  for (let b = 0; b < 2; b++) for (let j = 0; j < nY; j++) for (let i = 0; i < nA; i++) {
    const a = vid(b, j, i), c = vid(b, j + 1, i), d = vid(b, j + 1, i + 1), e = vid(b, j, i + 1);
    triOut(b, a, c, d, b === 0); triOut(b, a, d, e, b === 0);
  }
  // rims along both crack edges (i = 0 and i = nA)
  [0, nA].forEach(i => { for (let j = 0; j < nY; j++) { const a = vid(0, j, i), c = vid(0, j + 1, i), d = vid(1, j + 1, i), e = vid(1, j, i); idx[2].push(a, c, d, a, d, e); } });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const all = [...idx[0], ...idx[1], ...idx[2]];
  g.setIndex(all);
  g.addGroup(0, idx[0].length, 0); g.addGroup(idx[0].length, idx[1].length, 1); g.addGroup(idx[0].length + idx[1].length, idx[2].length, 2);
  g.computeVertexNormals();
  return g;
}
// moon: craters with raised rims, maria as darker vertex colour
function moonGeometry(r) {
  const g = new THREE.SphereGeometry(1, 192, 128);
  const craters = [];
  for (let i = 0; i < 90; i++) { const big = i < 10; craters.push({ c: r.dir(), rad: big ? r.range(0.18, 0.32) : Math.pow(r(), 2) * 0.12 + 0.025, d: r.range(0.5, 1) }); }
  const cols = [];
  const gg = displace(g, v => {
    const n = v.clone().normalize(); let h = 0, bright = 0;
    for (const k of craters) {
      const ang = Math.acos(clamp(n.dot(k.c), -1, 1)), x = ang / k.rad;
      if (x < 1.6) { h += k.d * k.rad * 0.12 * (x < 1 ? (x * x - 1) : 0) + k.d * k.rad * 0.045 * Math.exp(-(((x - 1) / 0.2) ** 2)); bright += (x < 1 ? -0.05 : 0.12 * Math.exp(-(((x - 1) / 0.3) ** 2))); }
      else if (x < 4 && k.rad > 0.08) bright += 0.06 * Math.exp(-(x - 1.6)) * (0.5 + 0.5 * Math.sin(Math.atan2(n.y - k.c.y, n.x - k.c.x) * 13));
    }
    h += 0.003 * fbm(n.x * 9, n.y * 9, n.z * 9, 4);
    const maria = smooth((fbm(n.x * 1.6 + 4, n.y * 1.6, n.z * 1.6 - 2, 4) + 0.05) * 5);
    const lum = clamp(0.78 - 0.42 * maria + bright + 0.06 * fbm(n.x * 14, n.y * 14, n.z * 14, 3), 0.12, 0.95);
    cols.push(lum * 0.94, lum * 0.97, lum * 1.04);
    return n.multiplyScalar(1 + h);
  });
  // displace() returns an indexed geometry whose vertex order matches the merged vertices we visited
  gg.setAttribute('color', new THREE.Float32BufferAttribute(cols.map(c => Math.pow(c, 2.2)), 3));
  return gg;
}
// iron meteorite: elongated lumpy body, regmaglypt thumbprints, one flat sawn face (group 1)
function meteoriteGeometry(r) {
  const g0 = new THREE.IcosahedronGeometry(1, 6); g0.deleteAttribute('uv'); g0.deleteAttribute('normal');
  const pits = []; for (let i = 0; i < 130; i++) pits.push({ c: r.dir(), rad: r.range(0.09, 0.24), d: r.range(0.03, 0.07) });
  const nS = v3(0.2, 0.15, 1).normalize(), dS = 0.5;
  const cols = [];
  const g = displace(g0, v => {
    const n = v.clone().normalize();
    let h = 0.24 * fbm(n.x * 1.3 + 2, n.y * 1.3, n.z * 1.3, 3) + 0.07 * fbm(n.x * 4, n.y * 4, n.z * 4, 3) + 0.012 * fbm(n.x * 30, n.y * 30, n.z * 30, 2);
    for (const k of pits) { const x = Math.acos(clamp(n.dot(k.c), -1, 1)) / k.rad; if (x < 1.3) h -= k.d * (1 - x * x / 1.69) * (1 - x * x / 1.69); }
    const p = n.multiplyScalar(1 + h); p.x *= 1.3; p.y *= 0.82; p.z *= 0.95;
    const o = p.dot(nS);
    if (o > dS) p.addScaledVector(nS, dS - o);
    const c = 0.5 + 0.5 * fbm(n.x * 6 + 7, n.y * 6, n.z * 6, 3);
    const rust = smooth((fbm(n.x * 3, n.y * 3 + 5, n.z * 3, 3) - 0.1) * 4);
    cols.push(lerp(0.02, 0.06, c) * (1 + 1.2 * rust), lerp(0.018, 0.045, c) * (1 + 0.5 * rust), lerp(0.017, 0.035, c));
    return p;
  });
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  // split faces: those lying on the cut plane go to the sawn-face material
  const P = g.attributes.position, I = g.index.array, on = k => Math.abs(v3().fromBufferAttribute(P, k).dot(nS) - dS) < 1e-4;
  const a = [], b = [];
  for (let i = 0; i < I.length; i += 3) (on(I[i]) && on(I[i + 1]) && on(I[i + 2]) ? b : a).push(I[i], I[i + 1], I[i + 2]);
  g.setIndex([...a, ...b]); g.clearGroups(); g.addGroup(0, a.length, 0); g.addGroup(a.length, b.length, 1);
  // planar UVs on the cut plane
  const t1 = v3(0, 1, 0).cross(nS).normalize(), t2 = nS.clone().cross(t1), uv = [];
  for (let k = 0; k < P.count; k++) { const q = v3().fromBufferAttribute(P, k); uv.push(q.dot(t1) * 0.3 + 0.5, q.dot(t2) * 0.3 + 0.5); }
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  // the cut plane is perfectly flat: force its normals
  const Nn = g.attributes.normal; for (let k = 0; k < P.count; k++) if (on(k)) Nn.setXYZ(k, nS.x, nS.y, nS.z);
  return { geo: g, nS };
}
// etched Widmanstätten pattern: three families of kamacite lamellae at 60°, with plessite in between
function widmanstatten(rough = false) {
  return canvasTexture(rough ? 'widman-r' : 'widman', 1024, 1024, (g, w, h) => {
    const r = rng(404);
    g.fillStyle = rough ? '#6a6a6a' : '#7d7f84'; g.fillRect(0, 0, w, h);
    // plessite mottling
    for (let i = 0; i < 1600; i++) { g.fillStyle = rough ? `rgba(150,150,150,0.25)` : `rgba(${r.int(70, 95)},${r.int(72, 96)},${r.int(78, 100)},0.35)`; g.beginPath(); g.arc(r() * w, r() * h, r.range(3, 14), 0, TAU); g.fill(); }
    const angs = [0.35, 0.35 + Math.PI / 3, 0.35 + 2 * Math.PI / 3];
    for (let pass = 0; pass < 3; pass++) for (let i = 0; i < 260; i++) {
      const a = angs[r.int(0, 2)], cx = r() * w, cy = r() * h, len = r.range(60, 420), wd = r.range(5, 16);
      const lit = r() < 0.5;
      g.save(); g.translate(cx, cy); g.rotate(a);
      if (rough) g.fillStyle = lit ? '#2a2a2a' : '#a8a8a8';
      else { const v = lit ? r.int(175, 215) : r.int(110, 135); g.fillStyle = `rgb(${v},${v + 2},${v + 6})`; }
      g.fillRect(-len / 2, -wd / 2, len, wd);
      // taenite borders: thin bright edges
      if (!rough) { g.fillStyle = 'rgba(235,236,240,0.85)'; g.fillRect(-len / 2, -wd / 2, len, 1.5); g.fillRect(-len / 2, wd / 2 - 1.5, len, 1.5); }
      g.restore();
    }
  }, { srgb: !rough });
}
// heated leading face: emissive glow on surfaces facing the direction of flight
function heatPatch(m, U) {
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vHN;').replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvHN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vHN; uniform vec3 uVel; uniform float uHeat; uniform vec3 uHeatCol;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nfloat hf = max(dot(normalize(vHN), uVel), 0.0);\ntotalEmissiveRadiance += uHeatCol * (0.35 * pow(hf, 4.0) + 2.0 * pow(hf, 14.0)) * uHeat;');
  };
  m.needsUpdate = true;
}
// polar Earth albedo, baked once on the GPU into an azimuthal (pole-centred) projection. rgb = albedo, a = ocean specular
function bakeEarth(renderer) {
  const size = 1024;
  const rt = new THREE.WebGLRenderTarget(size, size, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
  const sc = new THREE.Scene(), oc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mat = new THREE.ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `varying vec2 vUv;
      float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z) * 2.0 - 1.0; }
      float fbm(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 7; i++){ s += a * vn(p); p = p * 2.03 + 0.17; a *= 0.5; } return s; }
      void main(){
        vec2 d = (vUv - 0.5) * 2.0; float rho = min(length(d), 1.0);
        float th = rho * 3.14159265, ph = atan(d.y, d.x);
        vec3 p = vec3(sin(th) * cos(ph), cos(th), sin(th) * sin(ph));
        float lat = p.y;
        float n = fbm(p * 2.2 + vec3(3.1, 0.0, 1.7)) + 0.35 * fbm(p * 6.0);
        float land = smoothstep(0.06, 0.1, n);
        float iceEdge = 0.93 + 0.03 * fbm(p * 7.0 + 9.0);
        float seaIce = smoothstep(iceEdge - 0.015, iceEdge + 0.015, lat);
        float snow = smoothstep(0.8, 0.9, lat + 0.1 * fbm(p * 9.0));
        vec3 ocean = mix(vec3(0.004, 0.018, 0.06), vec3(0.01, 0.05, 0.13), smoothstep(-0.3, 0.3, fbm(p * 5.0)));
        vec3 ground = mix(vec3(0.05, 0.055, 0.035), vec3(0.11, 0.09, 0.06), smoothstep(-0.2, 0.4, fbm(p * 12.0)));
        ground = mix(ground, vec3(0.55, 0.6, 0.66), snow);
        vec3 c = mix(ocean, ground, land);
        vec3 ice = vec3(0.5, 0.58, 0.68) * (0.85 + 0.15 * fbm(p * 30.0));
        c = mix(c, ice, seaIce);
        float cl = smoothstep(0.22, 0.65, fbm(p * 3.5 + vec3(fbm(p * 2.0) * 1.5))) * 0.55;
        c = mix(c, vec3(0.45, 0.48, 0.52), cl * 0.6);
        float spec = (1.0 - land) * (1.0 - seaIce) * (1.0 - cl);
        gl_FragColor = vec4(c, spec);
      }`,
  });
  const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); sc.add(q);
  const prev = renderer.getRenderTarget();
  renderer.setRenderTarget(rt); renderer.render(sc, oc); renderer.setRenderTarget(prev);
  q.geometry.dispose(); mat.dispose();
  return rt.texture;
}
