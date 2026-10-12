// 御剑 YUJIAN — post: scene RT (MSAA) → two-level bloom → final grade (chromatic fringe, curve, lift/gamma/gain,
// saturation, vignette, paper + grain, flash) → caption overlay.
import * as THREE from 'three';
import { W, H, GLSL_NOISE } from './util.js';

const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
function fsq(mat) { const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); m.frustumCulled = false; const s = new THREE.Scene(); s.add(m); return s; }
const CAM = new THREE.Camera();

export const GRADE = {
  uExposure: { value: 1.0 }, uBloom: { value: 0.35 }, uBloomThresh: { value: 0.78 },
  uLift: { value: new THREE.Vector3(0.0, 0.0, 0.0) }, uGamma: { value: new THREE.Vector3(1, 1, 1) }, uGain: { value: new THREE.Vector3(1, 1, 1) },
  uSat: { value: 1.05 }, uContrast: { value: 1.08 }, uChroma: { value: 0.0016 }, uVignette: { value: 0.22 }, uGrain: { value: 0.035 }, uPaper: { value: 0.035 },
  uFlash: { value: new THREE.Vector4(1, 0.95, 0.85, 0) },  // rgb + amount (additive veil)
  uFrame: { value: 0 }, uFade: { value: 0 },              // fade to black amount
  uRays: { value: 0.0 }, uSunUV: { value: new THREE.Vector2(0.5, 1.2) }, uRayCol: { value: new THREE.Color(1, 0.85, 0.6) }, uRayThresh: { value: 0.8 },
};

export class Post {
  constructor(renderer) {
    this.r = renderer;
    const opt = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
    this.rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4, depthBuffer: true });
    this.b1 = new THREE.WebGLRenderTarget(W / 4, H / 4, opt); this.b1b = new THREE.WebGLRenderTarget(W / 4, H / 4, opt);
    this.b2 = new THREE.WebGLRenderTarget(W / 12, H / 12, opt); this.b2b = new THREE.WebGLRenderTarget(W / 12, H / 12, opt);
    this.r1 = new THREE.WebGLRenderTarget(W / 4, H / 4, opt); this.r2 = new THREE.WebGLRenderTarget(W / 4, H / 4, opt);
    this.mRayMask = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uRayThresh: GRADE.uRayThresh }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tSrc; uniform float uRayThresh; varying vec2 vUv;
        void main(){ vec3 c = texture2D(tSrc, vUv).rgb; float l = dot(c, vec3(0.3, 0.59, 0.11)); gl_FragColor = vec4(c * smoothstep(uRayThresh, uRayThresh + 0.25, l), 1.0); }` });
    this.mRay = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uSunUV: GRADE.uSunUV, uStep: { value: 1 } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tSrc; uniform vec2 uSunUV; uniform float uStep; varying vec2 vUv;
        void main(){ vec2 d = (uSunUV - vUv) * uStep / 32.0; vec2 uv = vUv; vec3 acc = vec3(0.0); float w = 1.0, ws = 0.0;
          for (int i = 0; i < 32; i++) { vec2 q = clamp(uv, 0.0, 1.0); acc += texture2D(tSrc, q).rgb * w; ws += w; w *= 0.965; uv += d; }
          gl_FragColor = vec4(acc / ws, 1.0); }` });
    this.mBright = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uThresh: GRADE.uBloomThresh, uTexel: { value: new THREE.Vector2(1 / W, 1 / H) } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tSrc; uniform float uThresh; uniform vec2 uTexel; varying vec2 vUv;
        void main(){ vec3 c = vec3(0.0); for (int i=0;i<4;i++){ vec2 o = vec2(float(i%2)-0.5, float(i/2)-0.5) * uTexel * 2.0; c += texture2D(tSrc, vUv + o).rgb; } c *= 0.25;
          float l = max(c.r, max(c.g, c.b)); float k = smoothstep(uThresh, uThresh + 0.35, l); gl_FragColor = vec4(c * k, 1.0); }` });
    this.mBlur = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } }, vertexShader: VS,
      fragmentShader: `uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
        void main(){ vec3 c = texture2D(tSrc, vUv).rgb * 0.2270;
          c += (texture2D(tSrc, vUv + uDir * 1.3846).rgb + texture2D(tSrc, vUv - uDir * 1.3846).rgb) * 0.3162;
          c += (texture2D(tSrc, vUv + uDir * 3.2308).rgb + texture2D(tSrc, vUv - uDir * 3.2308).rgb) * 0.0703;
          gl_FragColor = vec4(c, 1.0); }` });
    this.mCopy = new THREE.ShaderMaterial({ uniforms: { tSrc: { value: null } }, vertexShader: VS, fragmentShader: 'uniform sampler2D tSrc; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tSrc, vUv); }' });
    this.textTex = null;
    this.mFinal = new THREE.ShaderMaterial({
      uniforms: { ...GRADE, tScene: { value: this.rt.texture }, tB1: { value: this.b1.texture }, tB2: { value: this.b2.texture }, tRay: { value: this.r1.texture }, tText: { value: null }, uHasText: { value: 0 } },
      vertexShader: VS,
      fragmentShader: `uniform sampler2D tScene, tB1, tB2, tText, tRay; uniform float uHasText, uRays; uniform vec3 uRayCol;
uniform float uExposure, uBloom, uSat, uContrast, uChroma, uVignette, uGrain, uPaper, uFrame, uFade; uniform vec3 uLift, uGamma, uGain; uniform vec4 uFlash;
varying vec2 vUv;
${GLSL_NOISE}
void main(){
  vec2 d = vUv - 0.5; vec2 off = d * uChroma * (0.4 + length(d) * 2.0);
  vec3 c;
  c.r = texture2D(tScene, vUv + off).r; c.g = texture2D(tScene, vUv).g; c.b = texture2D(tScene, vUv - off).b;
  vec3 bl = texture2D(tB1, vUv).rgb * 0.6 + texture2D(tB2, vUv).rgb * 0.9;
  c += bl * uBloom;
  c += texture2D(tRay, vUv).rgb * uRayCol * uRays;
  c *= uExposure;
  c += uFlash.rgb * uFlash.a;
  // soft highlight shoulder
  c = c / (1.0 + max(c - 0.85, 0.0) * 0.9);
  // lift / gamma / gain
  c = uGain * (c + uLift * (1.0 - c));
  c = pow(max(c, 0.0), 1.0 / uGamma);
  float l0 = dot(c, vec3(0.299, 0.587, 0.114));
  c = c + (c - l0) * 0.0; c = (c - 0.55) * uContrast + 0.55;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, uSat);
  // vignette
  float v = smoothstep(0.85, 0.25, length(d * vec2(1.0, 0.75)));
  c *= mix(1.0 - uVignette, 1.0, v);
  // paper fibre + grain
  vec2 px = vUv * vec2(${W}.0, ${H}.0);
  float paper = fbm2(px * 0.012, 4) * 0.7 + vnoise(px * vec2(0.9, 0.08)) * 0.3;
  c *= 1.0 + (paper - 0.5) * uPaper;
  float g = hash12(px + fract(uFrame * 0.6180339) * 1000.0) - 0.5;
  c += g * uGrain * (0.6 + 0.4 * (1.0 - l));
  c = mix(c, vec3(0.0), uFade);
  if (uHasText > 0.5) { vec4 t = texture2D(tText, vUv); c = c * (1.0 - t.a) + t.rgb; }
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}` });
    this.sBright = fsq(this.mBright); this.sBlur = fsq(this.mBlur); this.sFinal = fsq(this.mFinal);
  }
  setText(canvas) {
    if (!canvas) { this.mFinal.uniforms.uHasText.value = 0; return; }
    if (!this.textTex) { this.textTex = new THREE.CanvasTexture(canvas); this.textTex.minFilter = THREE.LinearFilter; this.textTex.generateMipmaps = false; this.textTex.premultiplyAlpha = true; }
    this.textTex.needsUpdate = true; this.mFinal.uniforms.tText.value = this.textTex; this.mFinal.uniforms.uHasText.value = 1;
  }
  blur(a, b, n) {
    for (let i = 0; i < n; i++) {
      this.mBlur.uniforms.tSrc.value = a.texture; this.mBlur.uniforms.uDir.value.set(1 / a.width, 0); this.r.setRenderTarget(b); this.r.render(this.sBlur, CAM);
      this.mBlur.uniforms.tSrc.value = b.texture; this.mBlur.uniforms.uDir.value.set(0, 1 / a.height); this.r.setRenderTarget(a); this.r.render(this.sBlur, CAM);
    }
  }
  // drawScene(renderer) renders into this.rt (already bound)
  render(drawScene) {
    const r = this.r;
    r.setRenderTarget(this.rt); r.clear(true, true, true); drawScene(r);
    this.mBright.uniforms.tSrc.value = this.rt.texture; this.mBright.uniforms.uTexel.value.set(1 / W, 1 / H);
    r.setRenderTarget(this.b1); r.render(this.sBright, CAM);
    this.blur(this.b1, this.b1b, 2);
    this.mBright.uniforms.tSrc.value = this.b1.texture; this.mBright.uniforms.uTexel.value.set(4 / W, 4 / H);
    // downsample b1 → b2 by copy (bilinear) then blur wide
    this.mCopy.uniforms.tSrc.value = this.b1.texture; r.setRenderTarget(this.b2); r.render(fsqCache(this.mCopy), CAM);
    this.blur(this.b2, this.b2b, 3);
    if (GRADE.uRays.value > 0.001) {
      this.mRayMask.uniforms.tSrc.value = this.rt.texture; r.setRenderTarget(this.r2); r.render(fsqCache(this.mRayMask), CAM);
      this.mRay.uniforms.tSrc.value = this.r2.texture; this.mRay.uniforms.uStep.value = 0.55; r.setRenderTarget(this.r1); r.render(fsqCache(this.mRay), CAM);
      this.mRay.uniforms.tSrc.value = this.r1.texture; this.mRay.uniforms.uStep.value = 0.18; r.setRenderTarget(this.r2); r.render(fsqCache(this.mRay), CAM);
      this.mCopy.uniforms.tSrc.value = this.r2.texture; r.setRenderTarget(this.r1); r.render(fsqCache(this.mCopy), CAM);
    } else { r.setRenderTarget(this.r1); r.clear(); }
    r.setRenderTarget(null); r.render(this.sFinal, CAM);
  }
}
const _fsq = new Map();
function fsqCache(m) { if (!_fsq.has(m)) _fsq.set(m, fsq(m)); return _fsq.get(m); }
