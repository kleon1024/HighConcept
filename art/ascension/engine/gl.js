// 飞升 ASCENSION — WebGL2 pipeline: sky + light core + god rays + two fbm cloud layers composited with three
// Canvas2D layers, then bloom and a film/ink post (chromatic aberration, halftone in shadows, grain, vignette, grade).
(function () {
const W = 1080, H = 1920;

const VS = `#version 300 es
in vec2 p; out vec2 vUv; void main(){ vUv = p*0.5+0.5; gl_Position = vec4(p,0,1); }`;

const NOISE = `
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p, int oct){ float s=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<8;i++){ if(i>=oct) break; s+=a*vnoise(p); p=m*p+vec2(3.1,7.7); a*=.5; } return s; }
`;

// ── scene pass
const FS_SCENE = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes; uniform float uTime;
uniform vec3 uSkyTop, uSkyMid, uSkyHor; uniform float uHorY, uSkyMidY;
uniform vec2 uCore; uniform float uCoreR; uniform vec3 uCoreCol, uCoreHalo; uniform float uCoreInt, uHaloR;
uniform float uRays, uRayRot, uRayN, uStars;
uniform sampler2D uL0, uL1, uL2;
uniform sampler2D uC0, uC1;
uniform float uStroke; uniform vec2 uStrokeDir;
${NOISE}
vec3 sky(vec2 uv){
  float y = uv.y;
  vec3 c = y > uSkyMidY ? mix(uSkyMid, uSkyTop, smoothstep(uSkyMidY, 1.0, y)) : mix(uSkyHor, uSkyMid, smoothstep(uHorY-0.02, uSkyMidY, y));
  // painterly streaks in the sky
  vec2 px = uv*uRes;
  float st = vnoise(vec2(dot(px,uStrokeDir), dot(px,vec2(-uStrokeDir.y,uStrokeDir.x))*0.035)*vec2(0.02,1.0)+3.0);
  c *= 0.93 + 0.14*st*uStroke;
  // stars
  if (uStars > 0.0) {
    vec2 g = floor(px/7.0); float h = hash(g);
    vec2 cp = (g+0.5+0.35*vec2(hash(g+1.3)-0.5, hash(g+2.1)-0.5))*7.0;
    float d = length(px-cp);
    float s = step(0.985, h) * smoothstep(1.6, 0.0, d) * (0.5+0.5*sin(uTime*3.0+h*60.0));
    c += vec3(0.9,0.95,1.0) * s * uStars * smoothstep(uHorY, 1.0, y);
  }
  return c;
}
vec4 over(vec4 dst, vec4 src){ return vec4(src.rgb + dst.rgb*(1.0-src.a), 1.0); }
void main(){
  vec2 uv = vUv; vec2 px = uv*uRes;
  vec3 c = sky(uv);
  // light core halo (behind everything)
  float d = length(px - uCore);
  c += uCoreHalo * (exp(-d/uHaloR)*0.9 + exp(-d/(uHaloR*3.5))*0.35) * uCoreInt;
  vec4 acc = vec4(c,1.0);
  vec2 tuv = vec2(uv.x, 1.0-uv.y);
  vec4 l0 = texture(uL0, tuv); acc = over(acc, l0);
  vec4 c0 = texture(uC0, uv); acc = over(acc, c0);
  vec4 l1 = texture(uL1, tuv); acc = over(acc, l1);
  vec4 c1 = texture(uC1, uv); acc = over(acc, c1);
  // god rays (volumetric glow through everything but the front layer)
  if (uRays > 0.0) {
    vec2 v = px - uCore; float ang = atan(v.y, v.x);
    float r = vnoise(vec2(ang*uRayN + uRayRot, 0.5)) * 0.65 + vnoise(vec2(ang*uRayN*2.7 - uRayRot*1.3, 4.0))*0.35;
    r = pow(r, 3.0);
    float fall = exp(-length(v)/(uRes.y*0.55));
    acc.rgb += uCoreHalo * r * fall * uRays;
  }
  // core disc
  float disc = smoothstep(uCoreR, uCoreR*0.55, d);
  acc.rgb += uCoreCol * disc * uCoreInt * 1.6 + uCoreCol * exp(-d/(uCoreR*0.9)) * uCoreInt * 0.8;
  vec4 l2 = texture(uL2, tuv); acc = over(acc, l2);
  o = vec4(acc.rgb, 1.0);
}`;


const FS_CLOUD = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes; uniform float uTime; uniform vec2 uCore;
uniform int uCT; uniform vec4 uCP, uCQ, uCR; uniform vec3 uCLit, uCSh, uCHaze, uCRim; uniform vec2 uCDrift; uniform float uCOp;
${NOISE}
float cloudField(vec2 p, int oct){
  vec2 q = vec2(fbm(p,3), fbm(p+vec2(5.2,1.3),3));
  return fbm(p + 1.4*q, oct);
}
// heightfield for the sea of clouds (cheap, used while marching)
float HF(vec2 p, float cov){ float f = fbm(p, 4) + 0.06*vnoise(p*7.0); float k = smoothstep(cov, cov + 0.42, f); return sqrt(k)*0.85 + k*0.15; }
void main(){
  vec2 uv = vUv; vec2 px = uv*uRes; float asp = uRes.x/uRes.y;
  vec2 toCore = normalize(uCore - px + 1e-4);
  float coreD = length(uCore - px)/uRes.y;
  vec4 P = uCP, Q = uCQ;
  if (uCT == 1 || uCT == 3) {
    // P: x=horizonY, y=fov, z=scale, w=coverage ; Q: x=hazeK, y=amp (cloud height / cam height), z=rimK, w=detail ; uCR: x=lightElev, y=lightX
    float s = (uCT == 1) ? 1.0 : -1.0;
    vec3 rd = normalize(vec3((uv.x-0.5)*asp*P.y, (uv.y-P.x)*P.y, 1.0));
    if (rd.y*s >= -0.0005) { o = vec4(0); return; }
    vec3 ro = vec3(uCDrift.x, 1.0*s, uCDrift.y);
    float amp = Q.y; float ry = -rd.y*s;
    float t0 = (1.0 - amp)/ry, t1 = 1.0/ry;
    float t = t0, tl = t0; float hit = -1.0; float h = 0.0;
    const int N = 40;
    float dt = (t1 - t0)/float(N);
    for (int i = 0; i < N; i++) {
      vec3 p = ro + rd*t; float hh = amp * HF(p.xz*P.z, P.w);
      if (p.y*s <= hh) { hit = t; h = hh; break; }
      tl = t; t += dt;
    }
    if (hit < 0.0) { hit = t1; h = 0.0; }
    else { // refine
      float a = tl, b = hit;
      for (int k = 0; k < 5; k++) { float m = 0.5*(a+b); vec3 p = ro + rd*m; if (p.y*s <= amp*HF(p.xz*P.z, P.w)) b = m; else a = m; }
      hit = b; vec3 p = ro + rd*hit; h = amp*HF(p.xz*P.z, P.w);
    }
    vec3 p = ro + rd*hit; vec2 w = p.xz*P.z;
    float e = 0.02;
    float hx = amp*HF(w + vec2(e,0.0), P.w) - amp*HF(w - vec2(e,0.0), P.w);
    float hz = amp*HF(w + vec2(0.0,e), P.w) - amp*HF(w - vec2(0.0,e), P.w);
    vec3 n = normalize(vec3(-hx*P.z/(2.0*e), 1.0, -hz*P.z/(2.0*e)));
    n.y *= s;
    vec3 L = normalize(vec3(uCR.y, uCR.x*s, 1.0));
    // detail texture (wispy, domain-warped) only for shading
    float det = cloudField(w*2.3 + vec2(uTime*0.02, 0.0), 4);
    float hn = h/amp;
    float dif = clamp(dot(n, L)*0.5 + 0.5, 0.0, 1.0);
    float rim = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 4.0) * (0.3 + 0.7*clamp(dot(rd, L), 0.0, 1.0));
    vec3 col = mix(uCSh, uCLit, clamp(dif*0.55 + hn*0.55 + (det-0.5)*Q.w, 0.0, 1.0));
    col *= 0.55 + 0.45*smoothstep(0.0, 0.35, hn);                  // valleys sink into shadow
    col += uCRim * rim * Q.z * (0.5 + 1.5*exp(-coreD*2.5)) * smoothstep(0.05, 0.4, hn);
    float fwd = pow(clamp(dot(rd, L), 0.0, 1.0), 6.0);
    vec3 hzc = uCHaze * (1.0 + 1.2*fwd);
    float f = 1.0 - exp(-(hit - t0*0.9) * Q.x);
    col = mix(col, hzc, clamp(f, 0.0, 1.0));
    float a = uCOp * smoothstep(0.0, 0.006, ry);
    o = vec4(col*a, a); return;
  }
  if (uCT == 2) {
    // screen bank — P: x=yTop, y=yBottom, z=scale, w=coverage ; Q: x=edge softness, y=softness, z=lightK, w=haze
    vec2 p = vec2(uv.x*asp, uv.y)*P.z + uCDrift;
    float band = smoothstep(P.y - Q.x, P.y + Q.x, uv.y) * (1.0 - smoothstep(P.x - Q.x, P.x + Q.x, uv.y));
    float h = cloudField(p, 6);
    float h2 = cloudField(p + toCore*0.06, 6);
    float m = h * (0.3 + 0.7*band) + band*0.32 - 0.14;
    float d = smoothstep(P.w, P.w + Q.y, m);
    float rim = clamp((h2 - h)*Q.z*-1.0 + 0.5, 0.0, 1.0);
    vec3 col = mix(uCSh, uCLit, clamp(rim*0.7 + (m-P.w)*0.9, 0.0, 1.0));
    float edge = clamp(1.0 - abs(d*2.0-1.0), 0.0, 1.0);
    col += uCRim * (pow(rim, 3.0)*0.8 + edge*0.5) * (0.5 + 1.5*exp(-coreD*3.0)) * uCR.z;
    col = mix(col, uCHaze, Q.w);
    float a = d * uCOp;
    o = vec4(col*a, a); return;
  }
  o = vec4(0);
}`;

const FS_BRIGHT = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D uTex; uniform float uThr;
void main(){ vec3 c = texture(uTex, vUv).rgb; float l = max(c.r, max(c.g, c.b));
  float k = smoothstep(uThr, uThr + 0.35, l); o = vec4(c * k, 1.0); }`;
const FS_BLUR = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o; uniform sampler2D uTex; uniform vec2 uDir;
void main(){ vec3 s = texture(uTex, vUv).rgb*0.227;
  s += (texture(uTex, vUv+uDir*1.385).rgb + texture(uTex, vUv-uDir*1.385).rgb)*0.316;
  s += (texture(uTex, vUv+uDir*3.231).rgb + texture(uTex, vUv-uDir*3.231).rgb)*0.070; o = vec4(s,1.0); }`;
const FS_POST = `#version 300 es
precision highp float; in vec2 vUv; out vec4 o;
uniform sampler2D uScene, uB1, uB2, uB3, uB4; uniform vec2 uRes; uniform float uTime;
uniform float uBloom, uCA, uGrain, uHalf, uVig, uExpo, uSat, uFlash; uniform vec3 uFlashCol, uVigCol, uBloomTint;
uniform vec3 uLift, uGain;
${NOISE}
void main(){
  vec2 uv = vUv; vec2 cdir = uv - 0.5; float r2 = dot(cdir,cdir);
  vec2 off = cdir * uCA * (0.25 + 2.0*r2) / uRes * 1000.0 * 0.004;
  vec3 c;
  c.r = texture(uScene, uv + off).r; c.g = texture(uScene, uv).g; c.b = texture(uScene, uv - off).b;
  vec3 b = texture(uB1,uv).rgb*0.7 + texture(uB2,uv).rgb*0.7 + texture(uB3,uv).rgb*0.5 + texture(uB4,uv).rgb*0.35;
  c += b * uBloom * uBloomTint;
  // filmic shoulder that keeps hue
  c = vec3(1.0) - exp(-c * uExpo);
  float l = dot(c, vec3(0.2126,0.7152,0.0722));
  c = mix(vec3(l), c, uSat);
  c = uLift + c*(uGain - uLift);
  // halftone in the shadows (ink-print feel)
  vec2 px = uv*uRes; mat2 R = mat2(0.7071,-0.7071,0.7071,0.7071);
  vec2 g = R*px/5.0; vec2 f = fract(g)-0.5; float dd = length(f);
  float shadow = smoothstep(0.32, 0.04, l);
  float dotm = smoothstep(0.42*shadow+0.02, 0.42*shadow-0.06, dd);
  c *= 1.0 - uHalf * shadow * (1.0-dotm) * 0.5;
  // vignette tinted
  float v = smoothstep(0.25, 0.95, length(cdir*vec2(1.0,0.75))*1.25);
  c = mix(c, c*uVigCol, v*uVig);
  // grain
  float n = hash(px + fract(uTime*13.1)*vec2(91.7,17.3)) - 0.5;
  c += n * uGrain * (0.6 + 0.8*(1.0-l));
  c = mix(c, uFlashCol, uFlash);
  o = vec4(clamp(c,0.0,1.0), 1.0);
}`;

function GL(canvas) {
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false });
  if (!gl) throw new Error('no webgl2');
  const half = !!gl.getExtension('EXT_color_buffer_float');
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x);
    if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x) + '\n' + s.split('\n').map((l,i)=>(i+1)+': '+l).join('\n')); return x; };
  const prog = (fs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); p.u = {}; return p; };
  const P = { cloud: prog(FS_CLOUD), scene: prog(FS_SCENE), bright: prog(FS_BRIGHT), blur: prog(FS_BLUR), post: prog(FS_POST) };
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = (w, h, hdr) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    if (hdr && half) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
  const fbo = (w, h, hdr) => { const t = tex(w, h, hdr); const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { f, t, w, h }; };
  const scene = fbo(W, H, true);
  const cl = [fbo(W / 2, H / 2, true), fbo(W / 2, H / 2, true)];
  const lv = [2, 4, 8, 16].map(d => [fbo(Math.ceil(W / d), Math.ceil(H / d), true), fbo(Math.ceil(W / d), Math.ceil(H / d), true)]);
  const layerTex = [0, 1, 2].map(() => tex(W, H, false));
  const loc = (p, n) => (n in p.u) ? p.u[n] : (p.u[n] = gl.getUniformLocation(p, n));
  const set = (p, n, v) => { const l = loc(p, n); if (l === null) return;
    if (typeof v === 'number') gl.uniform1f(l, v);
    else if (v.length === 2) gl.uniform2fv(l, v); else if (v.length === 3) gl.uniform3fv(l, v); else if (v.length === 4) gl.uniform4fv(l, v); };
  const draw = (target) => { gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.f : null);
    gl.viewport(0, 0, target ? target.w : W, target ? target.h : H); gl.drawArrays(gl.TRIANGLES, 0, 3); };
  const bindTex = (p, name, unit, t) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(loc(p, name), unit); };

  function render(U, layers) {
    // upload the 2D layers
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    layers.forEach((cv, i) => { gl.bindTexture(gl.TEXTURE_2D, layerTex[i]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv); });
    let p = P.cloud; gl.useProgram(p);
    for (let i = 0; i < 2; i++) { const C = U.clouds[i] || { type: 0 };
      set(p, 'uRes', [W / 2, H / 2]); set(p, 'uTime', U.time); set(p, 'uCore', [U.uCore[0] / 2, U.uCore[1] / 2]);
      gl.uniform1i(loc(p, 'uCT'), C.type || 0);
      if (C.type) { set(p, 'uCP', C.P); set(p, 'uCQ', C.Q); set(p, 'uCR', C.R || [0.3, 0, 1, 0]); set(p, 'uCLit', C.lit); set(p, 'uCSh', C.sh);
        set(p, 'uCHaze', C.haze); set(p, 'uCRim', C.rim); set(p, 'uCDrift', C.drift); set(p, 'uCOp', C.op); }
      draw(cl[i]);
    }
    p = P.scene; gl.useProgram(p);
    set(p, 'uRes', [W, H]); set(p, 'uTime', U.time);
    for (const k of ['uSkyTop', 'uSkyMid', 'uSkyHor', 'uHorY', 'uSkyMidY', 'uCore', 'uCoreR', 'uCoreCol', 'uCoreHalo', 'uCoreInt', 'uHaloR',
      'uRays', 'uRayRot', 'uRayN', 'uStars', 'uStroke', 'uStrokeDir']) set(p, k, U[k]);
    layerTex.forEach((t, i) => bindTex(p, 'uL' + i, i, t)); bindTex(p, 'uC0', 3, cl[0].t); bindTex(p, 'uC1', 4, cl[1].t);
    draw(scene);
    // bloom chain
    p = P.bright; gl.useProgram(p); bindTex(p, 'uTex', 0, scene.t); set(p, 'uThr', U.bloomThr); draw(lv[0][0]);
    p = P.blur; gl.useProgram(p);
    for (let i = 0; i < 4; i++) {
      if (i > 0) { bindTex(p, 'uTex', 0, lv[i - 1][0].t); set(p, 'uDir', [0, 0]); draw(lv[i][0]); }
      const [a, b] = lv[i];
      for (let k = 0; k < 2; k++) {
        bindTex(p, 'uTex', 0, a.t); set(p, 'uDir', [1 / a.w, 0]); draw(b);
        bindTex(p, 'uTex', 0, b.t); set(p, 'uDir', [0, 1 / a.h]); draw(a);
      }
    }
    p = P.post; gl.useProgram(p);
    bindTex(p, 'uScene', 0, scene.t); lv.forEach((l, i) => bindTex(p, 'uB' + (i + 1), i + 1, l[0].t));
    set(p, 'uRes', [W, H]); set(p, 'uTime', U.time);
    for (const k of ['uBloom', 'uCA', 'uGrain', 'uHalf', 'uVig', 'uExpo', 'uSat', 'uFlash', 'uFlashCol', 'uVigCol', 'uBloomTint', 'uLift', 'uGain']) set(p, k, U[k]);
    draw(null);
  }
  return { render, gl };
}
window.AscGL = GL; window.ASC_W = W; window.ASC_H = H;
})();
