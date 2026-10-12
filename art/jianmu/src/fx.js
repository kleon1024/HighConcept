// 御剑 YUJIAN — light effects: additive line segments (sword streaks, trails, lightning), glow points (immortal lights,
// sparks, petals), waterfalls, debris chunks.
import * as THREE from 'three';
import { GLSL_NOISE, GLSL_ATMO, mulberry32, fbm3 } from './util.js';
import { ENV, paintMat } from './materials.js';


// ── generic additive line segments, camera-facing ribbons with soft gaussian cross-profile
export class Lines {
  constructor(max, fog = true, alphaMode = false) {
    const g = new THREE.InstancedBufferGeometry(); const b = new THREE.PlaneGeometry(1, 1);
    g.index = b.index; g.attributes.position = b.attributes.position; g.attributes.uv = b.attributes.uv;
    const mk = (n) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(max * n), n); a.setUsage(THREE.DynamicDrawUsage); return a; };
    this.aA = mk(3); this.aB = mk(3); this.aW = mk(2); this.aC = mk(3); this.aI = mk(2);
    g.setAttribute('aA', this.aA); g.setAttribute('aB', this.aB); g.setAttribute('aW', this.aW); g.setAttribute('aC', this.aC); g.setAttribute('aI', this.aI);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { ...ENV, uFogK: { value: fog ? 1 : 0 } },
      vertexShader: `attribute vec3 aA, aB, aC; attribute vec2 aW, aI; uniform vec3 uCamPos;
        varying vec2 vUv; varying vec3 vC; varying float vI; varying vec3 vWP;
        void main(){
          float k = position.x + 0.5, ac = position.y + 0.5; vec3 p = mix(aA, aB, k);
          vec3 d = aB - aA; float L = length(d); d = L > 1e-4 ? d / L : vec3(0.,1.,0.);
          vec3 toCam = normalize(uCamPos - p); vec3 side = cross(d, toCam); float sl = length(side);
          side = sl > 1e-4 ? side / sl : vec3(1.,0.,0.);
          float w = mix(aW.x, aW.y, k);
          // extend the caps a little so segments chain without gaps
          p += d * (k - 0.5) * w * 0.6;
          p += side * (ac - 0.5) * w * 2.0;
          vUv = vec2(k, ac); vC = aC; vI = mix(aI.x, aI.y, k); vWP = p;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `varying vec2 vUv; varying vec3 vC; varying float vI; varying vec3 vWP; uniform float uFogK;
        ${GLSL_ATMO}
        void main(){
          float y = (vUv.y - 0.5) * 2.0;
          float core = exp(-y * y * 18.0), glow = exp(-y * y * 2.5) * 0.35;
          vec3 c = vC * (core * 1.4 + glow) * vI;
          if (uFogK > 0.5) { float fk; vec3 dummy = atmo(vec3(0.0), vWP, fk); c *= (1.0 - fk * 0.92); }
          ${alphaMode ? 'float al = clamp((exp(-y * y * 3.0)) * vI, 0.0, 1.0); gl_FragColor = vec4(vC * al, al);' : 'gl_FragColor = vec4(c, 1.0);'}
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: alphaMode ? THREE.CustomBlending : THREE.AdditiveBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    this.mesh = new THREE.InstancedMesh(g, this.mat, max); this.mesh.frustumCulled = false; this.mesh.count = 0; this.max = max; this.n = 0;
  }
  begin() { this.n = 0; }
  add(a, b, wa, wb, c, ia, ib) {
    if (this.n >= this.max) return; const i = this.n++;
    const LS = (window.DBG && window.DBG.lineScale) || 1;
    this.aA.setXYZ(i, a.x, a.y, a.z); this.aB.setXYZ(i, b.x, b.y, b.z); this.aW.setXY(i, wa * LS, wb * LS); this.aC.setXYZ(i, c.r, c.g, c.b); this.aI.setXY(i, ia, ib);
  }
  // polyline with per-point width/intensity functions of s in 0..1
  poly(pts, wf, c, inf) { for (let i = 0; i < pts.length - 1; i++) { const s0 = i / (pts.length - 1), s1 = (i + 1) / (pts.length - 1); this.add(pts[i], pts[i + 1], wf(s0), wf(s1), c, inf(s0), inf(s1)); } }
  end() { this.mesh.count = this.n; for (const a of [this.aA, this.aB, this.aW, this.aC, this.aI]) a.needsUpdate = true; }
}

// ── glow points (camera-facing discs). kind 0 = soft glow, 1 = petal (pink ellipse, alpha-blended look via additive tint)
export class Points {
  constructor(max, blending = THREE.AdditiveBlending, fog = true) {
    const g = new THREE.InstancedBufferGeometry(); const b = new THREE.PlaneGeometry(1, 1);
    g.index = b.index; g.attributes.position = b.attributes.position; g.attributes.uv = b.attributes.uv;
    const mk = (n) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(max * n), n); a.setUsage(THREE.DynamicDrawUsage); return a; };
    this.aP = mk(4); this.aC = mk(4); g.setAttribute('aP', this.aP); g.setAttribute('aC', this.aC);
    const premul = blending !== THREE.AdditiveBlending;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { ...ENV, uFogK: { value: fog ? 1 : 0 } },
      vertexShader: `attribute vec4 aP, aC; uniform vec3 uCamPos; varying vec2 vUv; varying vec4 vC; varying vec3 vWP;
        void main(){ vec3 toCam = normalize(uCamPos - aP.xyz); vec3 r = normalize(cross(vec3(0.,1.,0.), toCam)); vec3 u = cross(toCam, r);
          vec3 p = aP.xyz + (r * position.x + u * position.y) * aP.w; vUv = uv; vC = aC; vWP = p;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
      fragmentShader: `varying vec2 vUv; varying vec4 vC; varying vec3 vWP; uniform float uFogK;
        ${GLSL_ATMO}
        void main(){ vec2 d = (vUv - 0.5) * 2.0; float r2 = dot(d, d);
          float a = exp(-r2 * 7.0) + exp(-r2 * 60.0) * 1.5;
          vec3 c = vC.rgb * a * vC.a;
          float fk = 0.0; if (uFogK > 0.5) { vec3 dummy = atmo(vec3(0.0), vWP, fk); }
          ${premul ? 'float al = clamp(a * vC.a, 0.0, 1.0); vec3 cc = vC.rgb; cc = atmo(cc, vWP, fk); gl_FragColor = vec4(cc * al, al);' : 'gl_FragColor = vec4(c * (1.0 - fk * 0.9), 1.0);'}
        }`,
      transparent: true, depthWrite: false, blending: premul ? THREE.CustomBlending : THREE.AdditiveBlending,
      blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    this.mesh = new THREE.InstancedMesh(g, this.mat, max); this.mesh.frustumCulled = false; this.mesh.count = 0; this.max = max; this.n = 0;
  }
  begin() { this.n = 0; }
  add(p, size, c, k = 1) { if (this.n >= this.max) return; const i = this.n++; this.aP.setXYZW(i, p.x, p.y, p.z, size); this.aC.setXYZW(i, c.r, c.g, c.b, k); }
  end() { this.mesh.count = this.n; this.aP.needsUpdate = true; this.aC.needsUpdate = true; }
}

// ── waterfalls: arcing strips with downward-streaming streaks, fading into mist
const FALL_MAT = new THREE.ShaderMaterial({
  uniforms: { ...ENV },
  vertexShader: `varying vec2 vUv; varying vec3 vWP; void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
  fragmentShader: `uniform float uTime; uniform vec3 uSunCol; varying vec2 vUv; varying vec3 vWP;
    ${GLSL_NOISE}
    ${GLSL_ATMO}
    void main(){
      float x = vUv.x, y = 1.0 - vUv.y;   // y: 0 at lip → 1 at bottom
      float edge = smoothstep(0.0, 0.25, x) * smoothstep(1.0, 0.75, x);
      float s = vnoise(vec2(x * 22.0, y * 6.0 - uTime * 1.6)) * 0.6 + vnoise(vec2(x * 60.0, y * 14.0 - uTime * 3.1)) * 0.4;
      float a = edge * (0.35 + 0.65 * s) * smoothstep(1.0, 0.25, y) * smoothstep(0.0, 0.03, y);
      a *= 0.6;
      vec3 c = mix(vec3(0.86, 0.92, 0.92), vec3(1.0), s) * (0.8 + 0.3 * uSunCol);
      float fk; c = atmo(c, vWP, fk);
      gl_FragColor = vec4(c * a, a);
    }`,
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
});
function fallGeom(w, L, out) {
  const g = new THREE.PlaneGeometry(1, 1, 1, 24); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), v = 0.5 - p.getY(i); const y = -v * L; const z = out * Math.sqrt(v) * L * 0.08; p.setXYZ(i, x * w * (1 + v * 1.5), y, z); }
  g.computeVertexNormals(); return g;
}

export class FX {
  constructor(scene, heroScene, jm) {
    this.lines = new Lines(3000); scene.add(this.lines.mesh);
    this.points = new Points(3000); scene.add(this.points.mesh);
    this.petals = new Points(300, THREE.CustomBlending); scene.add(this.petals.mesh);
    this.hLines = new Lines(400, false); heroScene.add(this.hLines.mesh);
    this.wisps = new Lines(400, true, true); scene.add(this.wisps.mesh);
    this.hPoints = new Points(400, THREE.AdditiveBlending, false); heroScene.add(this.hPoints.mesh);
    this.hPetals = new Points(200, THREE.CustomBlending, false); heroScene.add(this.hPetals.mesh);
    this.jm = jm;
    // debris: a few templates of rock / beam chunks
    const rng = mulberry32(99);
    const rock = new THREE.IcosahedronGeometry(1, 1); const rp = rock.attributes.position;
    for (let i = 0; i < rp.count; i++) { const x = rp.getX(i), y = rp.getY(i), z = rp.getZ(i); const k = 0.5 + 1.0 * fbm3(x * 1.3 + 3, y * 1.3, z * 1.3, 3); rp.setXYZ(i, x * k * 1.25, y * k * 0.7, z * k * 0.9); }
    rock.computeVertexNormals();
    const cc = new Float32Array(rp.count * 3); for (let i = 0; i < rp.count; i++) { cc[i * 3] = 0.40; cc[i * 3 + 1] = 0.37; cc[i * 3 + 2] = 0.32; }
    rock.setAttribute('color', new THREE.BufferAttribute(cc, 3));
    this.debris = new THREE.InstancedMesh(rock, paintMat({ brushScale: 0.08, brush: 0.25, rim: 0.6 }), 400); this.debris.frustumCulled = false; this.debris.count = 0;
    this.debris.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(this.debris);
    // waterfalls from island lips
    this.falls = new THREE.Group(); scene.add(this.falls);
    this.fallMat = FALL_MAT;
  }
  addFalls(islands, sect) {
    for (const id in islands) {
      const g = islands[id]; const d = g.userData.def; if (!d || !d.fall) continue;
      for (const [rk, ang] of d.fall) {
        const R = d.R * rk; const L = d.depth * 2.0 + 250; const w = Math.max(5, d.R * 0.045);
        const m = new THREE.Mesh(fallGeom(w, L, 1), FALL_MAT);
        m.position.set(Math.cos(ang) * R, d.R * 0.05, Math.sin(ang) * R); m.rotation.y = -ang + Math.PI / 2;
        g.add(m);
      }
    }
    if (sect) for (const ang of [0.4, 2.8, 4.1]) { const R = sect.userData.R * 0.93; const m = new THREE.Mesh(fallGeom(26, 1600, 1), FALL_MAT); m.position.set(Math.cos(ang) * R, 30, Math.sin(ang) * R); m.rotation.y = -ang + Math.PI / 2; sect.add(m); }
  }
  update(t, st, cam) {
    this.lines.begin(); this.points.begin(); this.petals.begin(); this.wisps.begin(); this.hLines.begin(); this.hPoints.begin(); this.hPetals.begin();
    if (st.fx) st.fx(this, t);
    this.lines.end(); this.points.end(); this.petals.end(); this.wisps.end(); this.hLines.end(); this.hPoints.end(); this.hPetals.end();
    if (st.debris) { st.debris(this.debris, t); } else this.debris.count = 0;
  }
}
