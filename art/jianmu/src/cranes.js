// 御剑 YUJIAN — red-crowned cranes (仙鹤): canvas-drawn flight cycle (6 frames) on instanced billboards.
import * as THREE from 'three';
import { GLSL_ATMO } from './util.js';
import { ENV } from './materials.js';

const FR = 6, FW = 256, FH = 160;
function drawCrane(ctx, k) {
  // k: wing phase 0..1 (0 = up, 0.5 = down)
  const wing = Math.cos(k * Math.PI * 2);           // +1 up, -1 down
  ctx.save(); ctx.translate(FW / 2, FH / 2 + 6);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // far wing (darker)
  const wingPath = (side, shade) => {
    const tipY = -wing * 62 * side, midY = -wing * 30 * side;
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.bezierCurveTo(-10, midY * 0.6, -6, midY, 4, tipY * 0.95);
    ctx.bezierCurveTo(14, tipY * 0.9 + 8, 22, midY + 6, 18, 4); ctx.closePath();
    ctx.fillStyle = shade; ctx.fill();
    // black primaries at the trailing tip
    ctx.beginPath(); ctx.moveTo(-6, midY * 0.9); ctx.bezierCurveTo(-2, tipY * 0.8, 2, tipY, 5, tipY * 0.98); ctx.bezierCurveTo(12, tipY * 0.9 + 6, 10, midY * 0.7 + 4, 4, midY * 0.6 + 2); ctx.closePath();
    ctx.fillStyle = '#16191b'; ctx.fill();
  };
  wingPath(-1, '#c9cdca');
  // legs trailing back
  ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-22, 3); ctx.lineTo(-78, 8); ctx.stroke();
  // body
  ctx.fillStyle = '#f6f5f0'; ctx.beginPath(); ctx.ellipse(-8, 2, 24, 9, -0.05, 0, Math.PI * 2); ctx.fill();
  // black tail feathers (tertials)
  ctx.fillStyle = '#16191b'; ctx.beginPath(); ctx.moveTo(-28, 0); ctx.quadraticCurveTo(-42, 6, -36, 12); ctx.quadraticCurveTo(-26, 10, -20, 6); ctx.fill();
  // neck (black) and head
  ctx.strokeStyle = '#16191b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(12, -1); ctx.quadraticCurveTo(38, -6, 58, -6); ctx.stroke();
  ctx.fillStyle = '#f2f0ea'; ctx.beginPath(); ctx.ellipse(62, -6, 6, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d13b2a'; ctx.beginPath(); ctx.arc(62, -9, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8f8a6a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(67, -6); ctx.lineTo(82, -4); ctx.stroke();
  // near wing (lit)
  wingPath(1, '#fbfaf6');
  ctx.restore();
}
export function craneAtlas() {
  const c = document.createElement('canvas'); c.width = FW * FR; c.height = FH; const ctx = c.getContext('2d');
  for (let i = 0; i < FR; i++) { ctx.save(); ctx.translate(i * FW, 0); drawCrane(ctx, i / FR); ctx.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; return t;
}

export class Cranes {
  constructor(max) {
    const g = new THREE.InstancedBufferGeometry(); const b = new THREE.PlaneGeometry(1, FH / FW);
    g.index = b.index; g.attributes.position = b.attributes.position; g.attributes.uv = b.attributes.uv;
    this.aF = new THREE.InstancedBufferAttribute(new Float32Array(max * 2), 2); this.aF.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aF', this.aF);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { ...ENV, uTex: { value: craneAtlas() } },
      vertexShader: `attribute vec2 aF; varying vec2 vUv; varying vec3 vWP; uniform vec3 uCamPos;
        void main(){ vec3 c = (instanceMatrix * vec4(0.,0.,0.,1.)).xyz; float s = length(instanceMatrix[0].xyz);
          vec3 toCam = normalize(uCamPos - c); vec3 right = normalize(cross(vec3(0.,1.,0.), toCam)); vec3 up = cross(toCam, right);
          vec3 wp = c + right * position.x * s * aF.y + up * position.y * s; vWP = wp;
          vUv = vec2((aF.x + uv.x) / ${FR}.0, uv.y); gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0); }`,
      fragmentShader: `uniform sampler2D uTex; varying vec2 vUv; varying vec3 vWP; uniform vec3 uSunCol;
        ${GLSL_ATMO}
        void main(){ vec4 t = texture2D(uTex, vUv); if (t.a < 0.45) discard; vec3 c = t.rgb * (0.75 + 0.35 * uSunCol); float fk; c = atmo(c, vWP, fk); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.InstancedMesh(g, this.mat, max); this.mesh.frustumCulled = false; this.mesh.count = 0; this.max = max;
  }
  // flocks: [{c: Vector3 centre at t, v: Vector3 velocity (m/s), n, spread, size, seed, t0}]
  update(t, flocks, cam) {
    let i = 0; const m = new THREE.Matrix4();
    for (const f of flocks) {
      let s = f.seed * 9301 + 49297;
      const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
      for (let k = 0; k < f.n && i < this.max; k++) {
        const ox = (rnd() - 0.5) * f.spread, oy = (rnd() - 0.5) * f.spread * 0.35, oz = (rnd() - 0.5) * f.spread * 0.6;
        // V formation-ish offset trailing behind the leader
        const lag = k * f.spread / f.n * 0.6;
        const dir = f.v.clone().normalize();
        const p = f.c.clone().addScaledVector(f.v, t - f.t0).addScaledVector(dir, -lag).add(new THREE.Vector3(ox, oy + Math.sin(t * 0.9 + k) * 2, oz));
        const phase = (t * (1.1 + 0.2 * rnd()) + rnd()) % 1;
        m.makeScale(f.size, f.size, f.size); m.setPosition(p); this.mesh.setMatrixAt(i, m);
        // flip so the crane faces its flight direction on screen
        const sp = p.clone().project(cam), sp2 = p.clone().add(f.v).project(cam);
        this.aF.setXY(i, Math.floor(phase * FR), sp2.x >= sp.x ? 1 : -1);
        i++;
      }
    }
    this.mesh.count = i; this.mesh.instanceMatrix.needsUpdate = true; this.aF.needsUpdate = true;
  }
}
