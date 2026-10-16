/* Light ribbon.
   A band of light is born under the About photograph: a thin stream pours
   from the bottom of the picture, unwinds as it falls, swoops out to the page
   margin so it runs beside the About text, and below the section opens into a
   twisting 3D band that weaves down the page. Brand cyan to violet light in
   the dark theme, teal, indigo and violet ink in the light one.

   Plain WebGL 1, no library. Strands are thin quads with a soft falloff; their
   energy is normalised so overlaps never burn to a white tube; on capable
   desktops a small blur pass adds real bloom. A text-safe mask, built from the
   page's own headings, paragraphs and lists, dims the light wherever there is
   something to read. The loop idles at about 30 fps, pauses when the tab is
   hidden, steps down on slow machines, and draws a still frame for people who
   ask for less motion. Nothing on the page depends on it. */
(function () {
  'use strict';
  var root = document.documentElement;
  var conn = navigator.connection || {};
  if (conn.saveData) return;
  var cv = document.getElementById('ribbonCanvas');
  if (!cv) return;
  var gl = cv.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, depth: false, powerPreference: 'low-power' });
  if (!gl) { cv.remove(); return; }

  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var touch = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  var small = root.clientWidth < 768;
  var weak = small || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  var tier = 0;                                    /* 0 bloom, 1 no bloom, 2 dpr 1, 3 half the strands */
  try { tier = +sessionStorage.getItem('sfa-rb-tier') || 0; } catch (e) {}
  if (weak && tier < 1) tier = 1;

  var STRANDS = small ? 32 : 84, POINTS = small ? 110 : 180, HAZE = small ? 0 : 7, DUST = small ? 0 : 200;
  var AMP = small ? 1.05 : 0.74, WID = small ? 0.10 : 0.22, GAIN = small ? 0.45 : 1;
  var STREAM_N = small ? 10 : 14, POUR_MS = small ? 2200 : 2600;

  /* ---- shaders ---------------------------------------------------------- */
  var COMMON =
    'precision highp float;' +
    'uniform float uTime,uScroll,uVh,uAspect,uDpr,uLight,uAmp,uWid,uClear,uSrcX,uSrcY,uFree,uPour,uEdge,uDive,uUnwind,uN,uDocH,uEnergy,uSmall;' +
    'float docOf(float u){return uScroll+(-0.25+u*1.5)*uVh;}' +
    'float wave(float k){return uAmp*sin(k*1.9+0.9)+0.14*sin(k*3.7+uTime*0.07);}' +
    /* 0 while the stream runs beside the About section, 1 once it is free */
    'float freeAmt(float d){return smoothstep(uFree,uFree+1.2*uVh,d);}' +
    'float ease5(float t){t=clamp(t,0.0,1.0);return t*t*t*(t*(t*6.0-15.0)+10.0);}' +
    'float centreX(float y){' +
    '  float d=y-uSrcY,fr=freeAmt(d);' +
    '  float xs=mix(uSrcX,uEdge,ease5((d-0.12*uDive)/(0.88*uDive)));' +
    '  xs+=0.006*sin(y/uVh*5.0+uTime*0.6)*(1.0-fr)*smoothstep(uDive,uDive*1.4,d);' +
    '  return mix(xs,wave(y/uVh),fr);' +
    '}' +
    /* an hourglass: wide lip at the photo, a waist, then a slim stream (square units, vh=2) */
    'float streamW(float d){' +
    '  float a=mix(0.14,0.046,smoothstep(0.0,0.18*uVh,d));' +
    '  float b=mix(0.046,0.064,smoothstep(0.18*uVh,0.6*uVh,d));' +
    '  return (d<0.18*uVh?a:b)*mix(1.0,0.5,uSmall);' +
    '}' +
    'vec2 ribbon(float u,float s,float seed,out float z,out float th,out float w,out float fr){' +
    '  float viewY=(-0.25+u*1.5)*uVh,y=uScroll+viewY,d=y-uSrcY,k=y/uVh,e=0.01*uVh;' +
    '  float cx=centreX(y);' +
    '  float dx=(centreX(y+e)-centreX(y-e))/(2.0*e)*uVh;' +
    '  vec2 tang=normalize(vec2(dx*uAspect,-2.0));' +
    '  vec2 nrm=vec2(-tang.y,tang.x);' +
    '  fr=freeAmt(d);' +
    /* the outer strands peel away last */
    '  float frS=smoothstep(uFree,uFree+uVh*(0.8+0.6*abs(s)),d);' +
    '  w=mix(streamW(d)*(0.8+0.4*seed),uWid+0.06*sin(k*1.7+1.3),frS);' +
    /* one fold per screen; a turn as it leaves the photo; a tight helix that unwinds during the pour; a half turn as it opens */
    '  th=k*2.2+uTime*0.18+3.0*exp(-max(d,0.0)/(0.35*uVh))' +
    '    +(1.0-uUnwind)*(1.0-smoothstep(0.0,0.8*uVh,d))*9.0*(d/uVh)+3.14159*fr;' +
    '  float fan=pow(abs(s),5.0)*sign(s)*0.07*fr*sin(u*5.0+seed*6.2831+uTime*0.35);' +
    '  float drift=(1.0-fr)*0.008*sin(uTime*0.6+seed*6.2831);' +
    '  float off=s*w*cos(th)+fan+drift;' +
    '  z=s*w*sin(th);' +
    '  float persp=1.0/(1.0+z*1.4);' +
    '  vec2 C=vec2(cx*uAspect,1.0-(viewY/uVh)*2.0);' +
    '  vec2 q=C+nrm*off*persp;' +
    '  return vec2(q.x/uAspect,q.y);' +
    '}' +
    'vec3 hue(float t){' +
    '  vec3 a=mix(vec3(0.176,0.831,0.749),vec3(0.133,0.827,0.933),smoothstep(0.0,0.12,t));' +
    '  a=mix(a,vec3(0.376,0.647,0.980),smoothstep(0.12,0.45,t));' +
    '  a=mix(a,vec3(0.506,0.549,0.973),smoothstep(0.45,0.75,t));' +
    '  a=mix(a,vec3(0.655,0.545,0.980),smoothstep(0.75,1.0,t));' +
    '  vec3 b=mix(vec3(0.055,0.455,0.565),vec3(0.118,0.227,0.541),smoothstep(0.15,0.45,t));' +
    '  b=mix(b,vec3(0.357,0.129,0.714),smoothstep(0.5,0.8,t));' +
    '  return mix(a,b,uLight);' +
    '}' +
    'float clearCentre(float x){return mix(mix(0.4,0.5,uLight),1.0,smoothstep(uClear,uClear+0.44,abs(x)));}' +
    'float ends(float u){return smoothstep(0.0,0.08,u)*(1.0-smoothstep(0.92,1.0,u));}';

  /* aV = (u along the strand, s across the band, side -1..1, kind 0 strand / 1 haze) */
  var STRAND_VS = COMMON +
    'attribute vec4 aV;' +
    'varying vec3 vCol;varying float vA,vSide,vWhite,vKind;varying vec2 vMuv;' +
    'void main(){' +
    '  float u=aV.x,s=aV.y,kind=aV.w,seed=fract(sin(s*91.7+kind*13.1)*43758.5);' +
    '  float z,th,w,fr,z1,th1,w1,fr1;' +
    '  vec2 p=ribbon(u,s,seed,z,th,w,fr);' +
    '  vec2 p2=ribbon(min(u+0.004,1.0),s,seed,z1,th1,w1,fr1);' +
    '  vec2 p0=ribbon(max(u-0.004,0.0),s,seed,z1,th1,w1,fr1);' +
    '  vec2 dd=normalize((p2-p0)*vec2(uAspect,1.0)+1e-6);' +
    '  vec2 n=vec2(-dd.y,dd.x);' +
    '  float persp=1.0/(1.0+z*1.4);' +
    '  float c=abs(cos(th)),fold=pow(1.0-c,5.0)*fr;' +
    '  float px=kind>0.5?40.0:mix(mix(3.5,6.0,fr),mix(3.2,4.4,fr),uLight);' +
    '  px*=mix(1.0,2.0,fold)*persp;' +
    '  gl_Position=vec4(p+n*aV.z*px*uDpr*2.0/vec2(uVh*uAspect,uVh),0.0,1.0);' +
    '  float y=docOf(u),d=y-uSrcY;' +
    /* where the band turns edge-on many strands stack: share the light between them */
    '  float gap=c*2.0*w/(uN-1.0)*0.5*uVh;' +
    '  float cover=mix(1.0,max(0.2,sqrt(clamp(gap/(2.0*px*uDpr+0.001),0.0,1.0))),fr);' +
    '  float far=smoothstep(-0.05,0.08,z);' +
    '  float lit=0.55+0.45*max(0.0,cos(th));' +
    '  float lead=0.35+1.15*pow(seed,4.0);' +
    /* light travels down the strands at about one screen a second */
    '  float comet=pow(0.5+0.5*sin((d/uVh)*4.0-uTime*4.4+seed*6.2831),14.0);' +
    '  float calm=0.82+0.18*sin(u*7.0-uTime*0.45+s*5.0);' +
    /* the pour: each strand arrives a little after the one before */
    '  float myPour=uPour-(1.0-seed)*0.25*uVh;' +
    '  float gate=smoothstep(0.0,0.035*uVh,d)*(1.0-smoothstep(myPour-0.3*uVh,myPour,d));' +
    '  float hx=(d-myPour+0.06*uVh)/(0.12*uVh);' +
    '  float head=uPour>1e6?0.0:exp(-hx*hx);' +
    '  float sq=' + (STREAM_N / STRANDS).toFixed(4) + ';' +
    '  float vis=mix(step(seed,sq)*mix(0.65,1.0,seed/sq),1.0,smoothstep(0.3,0.6,fr));' +
    '  float base=ends(u)*gate*clearCentre(p.x)*vis*mix(0.55,1.0,fr);' +
    '  vec3 col=hue(s*0.5+0.5);' +
    '  col=mix(col,vec3(0.30,0.36,0.75),0.4*far*(1.0-uLight));' +
    '  col=mix(col,vec3(1.0),0.35*fold*uLight);' +
    '  if(kind>0.5){col=mix(hue(0.5),vec3(0.39,0.40,0.95),uLight);vA=base*mix(0.07,0.12,uLight);}' +
    '  else vA=base*cover*(1.0+1.8*fold)*mix(1.0,0.35,far)*lit*(lead*(calm+0.9*comet*(1.0-uLight))+1.4*head)*mix(0.9,1.7,uLight);' +
    '  vA*=uEnergy;vCol=col;vSide=aV.z;vKind=kind;' +
    '  vWhite=step(seed,0.17)*0.12*(1.0-uLight);' +
    '  vMuv=vec2(p.x*0.5+0.5,y/uDocH);' +
    '}';
  var STRAND_FS = 'precision mediump float;' +
    'uniform sampler2D uMask;uniform float uLightF,uMaskOn;' +
    'varying vec3 vCol;varying float vA,vSide,vWhite,vKind;varying vec2 vMuv;' +
    'void main(){' +
    '  float g=exp(-vSide*vSide*2.2),core=exp(-vSide*vSide*30.0);' +
    /* text-safe: the light steps back wherever there is something to read */
    '  float m=uMaskOn>0.5?texture2D(uMask,vMuv).r:0.0;' +
    '  float keep=mix(1.0,mix(0.12,0.2,uLightF),m);' +
    '  float a=vKind>0.5?vA*g:vA*mix(g*0.6+core*0.8,core*0.8+g*0.3,uLightF);' +
    '  a*=keep;' +
    '  vec3 col=mix(vCol,vec3(1.0),vWhite*core);' +
    '  gl_FragColor=vec4(col*a,a);' +
    '}';

  var DUST_VS = COMMON +
    'attribute vec3 aD;' +
    'varying vec3 vCol;varying float vA;' +
    'void main(){' +
    '  float u=fract(aD.x+uTime*0.018*(0.4+aD.z));' +
    '  float z,th,w,fr;' +
    '  vec2 p=ribbon(u,aD.y,aD.z,z,th,w,fr);' +
    '  gl_Position=vec4(p,0.0,1.0);' +
    '  gl_PointSize=(1.2+aD.z*1.6)*uDpr;' +
    '  float d=docOf(u)-uSrcY;' +
    '  vCol=mix(hue(aD.y*0.5+0.5),vec3(1.0),0.35);' +
    '  vA=uEnergy*ends(u)*clearCentre(p.x)*fr*(1.0-smoothstep(uPour-0.3*uVh,uPour,d))*0.6*(0.5+0.5*sin(uTime*0.6+aD.z*40.0));' +
    '}';
  var DUST_FS = 'precision mediump float;varying vec3 vCol;varying float vA;' +
    'void main(){vec2 d=gl_PointCoord-0.5;float a=vA*(1.0-smoothstep(0.0,0.5,length(d)));gl_FragColor=vec4(vCol*a,a);}';

  /* the flare where the light leaves the photo: a thin horizontal streak with a soft core */
  var FLARE_VS = 'precision highp float;attribute vec2 aQ;uniform vec2 uPos,uSize;varying vec2 vQ;' +
    'void main(){vQ=aQ;gl_Position=vec4(uPos+aQ*uSize,0.0,1.0);}';
  var FLARE_FS = 'precision mediump float;varying vec2 vQ;uniform float uAmt;' +
    'void main(){vec2 d=vQ*0.5;float f=exp(-d.y*d.y*900.0)*exp(-d.x*d.x*6.0)+0.4*exp(-dot(d,d)*30.0);' +
    'vec3 c=mix(vec3(0.13,0.83,0.93),vec3(1.0),exp(-dot(d,d)*120.0));float a=f*uAmt;gl_FragColor=vec4(c*a,a);}';

  /* bloom: strands go to a texture, a quarter-size copy is blurred, the two are tone mapped together */
  var QUAD_VS = 'precision highp float;attribute vec2 aQ;varying vec2 vUv;void main(){vUv=aQ*0.5+0.5;gl_Position=vec4(aQ,0.0,1.0);}';
  var COPY_FS = 'precision mediump float;uniform sampler2D uT;varying vec2 vUv;void main(){gl_FragColor=texture2D(uT,vUv);}';
  var BLUR_FS = 'precision mediump float;uniform sampler2D uT;uniform vec2 uDir;varying vec2 vUv;' +
    'void main(){vec4 c=texture2D(uT,vUv)*0.2270270;' +
    'c+=(texture2D(uT,vUv+uDir*1.3846154)+texture2D(uT,vUv-uDir*1.3846154))*0.3162162;' +
    'c+=(texture2D(uT,vUv+uDir*3.2307692)+texture2D(uT,vUv-uDir*3.2307692))*0.0702703;gl_FragColor=c;}';
  var COMP_FS = 'precision mediump float;uniform sampler2D uS,uB;varying vec2 vUv;' +
    'void main(){vec3 c=texture2D(uS,vUv).rgb*4.0+texture2D(uB,vUv).rgb*2.4;' +
    'c=1.0-exp(-c*1.1);' +
    'c+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-0.5)/255.0;' +
    'c=max(c,0.0);gl_FragColor=vec4(c,max(c.r,max(c.g,c.b)));}';

  function prog(vs, fs) {
    function sh(t, src) {
      var s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    var p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  var strandP, dustP, flareP, copyP, blurP, compP;
  try {
    strandP = prog(STRAND_VS, STRAND_FS); dustP = prog(DUST_VS, DUST_FS); flareP = prog(FLARE_VS, FLARE_FS);
  } catch (e) { cv.remove(); return; }
  try { copyP = prog(QUAD_VS, COPY_FS); blurP = prog(QUAD_VS, BLUR_FS); compP = prog(QUAD_VS, COMP_FS); }
  catch (e) { copyP = null; if (tier < 1) tier = 1; }

  /* ---- geometry: every strand is a quad strip, all in one buffer ---------- */
  function build(list) {
    var verts = [], idx = [];
    list.forEach(function (st) {
      var b = verts.length / 4;
      for (var p = 0; p < POINTS; p++) {
        var u = p / (POINTS - 1);
        verts.push(u, st[0], -1, st[1], u, st[0], 1, st[1]);
        if (p) { var a = b + (p - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
    });
    return { v: verts, i: idx };
  }
  function sv(n, i) { return n < 2 ? 0 : (i / (n - 1)) * 2 - 1; }
  var hazeList = [], allList = [], halfList = [];
  for (var h = 0; h < HAZE; h++) hazeList.push([sv(HAZE, h) * 0.85, 1]);
  for (var s = 0; s < STRANDS; s++) { allList.push([sv(STRANDS, s), 0]); if (!(s % 2)) halfList.push([sv(STRANDS, s), 0]); }
  var gH = build(hazeList), gA = build(allList), gI = build(halfList);
  var offA = gH.v.length / 4, offI = offA + gA.v.length / 4;
  if (offI + gI.v.length / 4 > 65535) { cv.remove(); return; }
  var vAll = new Float32Array(gH.v.concat(gA.v, gI.v));
  var iAll = new Uint16Array(gH.i.concat(gA.i.map(function (x) { return x + offA; }), gI.i.map(function (x) { return x + offI; })));
  /* haze, every strand, every other strand (the light theme's ink, and the slowest machines) */
  var R = { haze: [0, gH.i.length], all: [gH.i.length, gA.i.length], half: [gH.i.length + gA.i.length, gI.i.length] };

  var vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, vAll, gl.STATIC_DRAW);
  var ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, iAll, gl.STATIC_DRAW);
  var dust = new Float32Array(Math.max(1, DUST) * 3), rs = 7;
  function rnd() { rs = (rs * 16807) % 2147483647; return rs / 2147483647; }
  for (var d = 0; d < DUST; d++) { dust[d * 3] = rnd(); dust[d * 3 + 1] = rnd() * 2 - 1; dust[d * 3 + 2] = rnd(); }
  var dbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, dbo); gl.bufferData(gl.ARRAY_BUFFER, dust, gl.STATIC_DRAW);
  var qbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  var UN = ['uTime', 'uScroll', 'uVh', 'uAspect', 'uDpr', 'uLight', 'uAmp', 'uWid', 'uClear', 'uSrcX', 'uSrcY', 'uFree',
            'uPour', 'uEdge', 'uDive', 'uUnwind', 'uN', 'uDocH', 'uEnergy', 'uSmall', 'uMask', 'uLightF', 'uMaskOn',
            'uPos', 'uSize', 'uAmt', 'uT', 'uDir', 'uS', 'uB'];
  function uni(pr) { var o = {}; UN.forEach(function (k) { o[k] = gl.getUniformLocation(pr, k); }); return o; }
  var SU = uni(strandP), DU = uni(dustP), FU = uni(flareP);
  var CU = copyP && uni(copyP), BU = copyP && uni(blurP), MU = copyP && uni(compP);
  var aV = gl.getAttribLocation(strandP, 'aV'), aD = gl.getAttribLocation(dustP, 'aD');
  var aQf = gl.getAttribLocation(flareP, 'aQ');

  /* ---- render targets for the bloom -------------------------------------- */
  function target(w, h) {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return ok ? { t: t, f: f, w: w, h: h } : null;
  }
  function drop(rt) { if (rt) { gl.deleteTexture(rt.t); gl.deleteFramebuffer(rt.f); } }
  var rtS = null, rtB1 = null, rtB2 = null;
  function targets() {
    drop(rtS); drop(rtB1); drop(rtB2); rtS = rtB1 = rtB2 = null;
    if (tier > 0 || !copyP || small) return;
    var qw = Math.max(1, W >> 2), qh = Math.max(1, H >> 2);
    rtS = target(W, H); rtB1 = target(qw, qh); rtB2 = target(qw, qh);
    if (!rtS || !rtB1 || !rtB2) { drop(rtS); drop(rtB1); drop(rtB2); rtS = rtB1 = rtB2 = null; tier = 1; }
  }

  /* ---- the text-safe mask -------------------------------------------------- */
  var maskTex = gl.createTexture(), maskOn = 0, docH = 1;
  var MASK_SEL = 'main h2,main h3,main h4,main p,main li,main label,main blockquote,main figcaption,' +
                 '.section-badge,.info-item,.cc-count-live,.btn-cyber-primary,.btn-cyber-outline,' +
                 '.tc-head,.tc-note,.tc-ref,.hz-card,.hof-card,.achievement-box';
  function buildMask() {
    try {
      docH = Math.max(1, root.scrollHeight);
      var cw = root.clientWidth, rows = Math.min(4096, Math.ceil(docH / 16)), sy = rows / docH, sx = 64 / cw;
      var a = document.createElement('canvas'); a.width = 64; a.height = rows;
      var c = a.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, 64, rows); c.fillStyle = '#fff';
      var y0 = window.pageYOffset, list = document.querySelectorAll(MASK_SEL);
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (el.closest('#heroPin,#hero,.hc')) continue;
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        c.fillRect((r.left - 12) * sx, (r.top + y0 - 10) * sy, (r.width + 24) * sx, Math.max(1, (r.height + 20) * sy));
      }
      var b = document.createElement('canvas'); b.width = 64; b.height = rows;
      var bc = b.getContext('2d');
      if ('filter' in bc) bc.filter = 'blur(1px)';
      bc.drawImage(a, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, maskTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, b);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      maskOn = 1;
    } catch (e) { maskOn = 0; }
  }

  /* ---- layout ------------------------------------------------------------ */
  var dpr = 1, W = 0, H = 0, lastW = 0, lastH = 0, light = 0, t0 = performance.now(), lost = false;
  function size(force) {
    var w = root.clientWidth, h = root.clientHeight;
    /* a phone's address bar showing or hiding is not a new layout */
    if (!force && touch && w === lastW && Math.abs(h - lastH) < 160) return false;
    lastW = w; lastH = h;
    var cap = tier >= 2 ? 1 : (tier === 0 && !small ? 1.5 : (weak ? 1.25 : 2));
    dpr = Math.min(window.devicePixelRatio || 1, cap);
    W = Math.round(w * dpr); H = Math.round(h * dpr);
    cv.width = W; cv.height = H;
    targets();
    return true;
  }

  /* positions without the entrance transforms, so the source never jumps */
  function docBox(el) {
    var x = 0, y = 0, e = el;
    while (e) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
  }
  var vhCss = root.clientHeight, clearX = 0.25;
  var srcX = 0, srcDoc = 0, freeDoc = 0, edgeX = -0.96, diveDoc = 400;
  function measure() {
    vhCss = root.clientHeight;
    var cw = root.clientWidth;
    clearX = Math.max(0.1, Math.min(0.5, 380 / (cw / 2) * 0.45));
    var im = document.querySelector('#about .about-image'), ab = document.getElementById('about');
    if (!im || !ab) { srcDoc = vhCss; srcX = 0.6; freeDoc = 0; return; }
    var r = docBox(im), a = docBox(ab);
    srcDoc = r.y + r.h;
    /* on a phone the text sits under the photo, so the stream leaves from its right corner */
    srcX = small ? Math.min(0.9, (r.x + r.w * 0.86) / cw * 2 - 1) : (r.x + r.w / 2) / cw * 2 - 1;
    freeDoc = Math.max(0, a.y + a.h - srcDoc);
    var box = ab.querySelector('.container'), facts = ab.querySelector('.info-item');
    if (small) {
      edgeX = 1 - 2 * 14 / cw;
      diveDoc = vhCss * 0.15;
    } else {
      var left = box ? docBox(box).x + 12 : 40;
      edgeX = Math.max(-0.985, (left * 0.5) / cw * 2 - 1);
      diveDoc = facts ? Math.max(80, docBox(facts).y - srcDoc - 40) : freeDoc * 0.6;
    }
  }

  /* ---- the pour ------------------------------------------------------------ */
  var pourT0 = -1, waitT = 0;
  function easeInOut(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function pourState(now) {
    if (pourT0 < 0) return { len: 0, unwind: 0, flare: 0 };
    var t = now - pourT0;
    if (RM || t >= POUR_MS) return { len: 1e7, unwind: 1, flare: RM ? 0.3 : 0.28 + 0.06 * Math.sin(t / 900) };
    /* it reaches at least just past the bottom of the screen, so nothing pops in later */
    var target = Math.max(freeDoc + vhCss * 2.4, window.pageYOffset + vhCss - srcDoc + vhCss * 0.3);
    var k = Math.max(0, Math.min(1, (t - 150) / (POUR_MS - 350)));
    var fl = t < 300 ? t / 300 : t < 2000 ? 1 : 1 - 0.72 * Math.min(1, (t - 2000) / 600);
    return { len: easeInOut(k) * target, unwind: Math.max(0, Math.min(1, (t - 400) / (POUR_MS - 400))), flare: fl };
  }
  /* About is opaque only while it is the curtain over the pinned hero */
  function aboutClear() {
    if (root.getAttribute('data-motion') !== 'full' || root.clientWidth < 992) return true;
    var hero = document.getElementById('hero');
    return !hero || hero.classList.contains('hc-gone');
  }
  function startPour() {
    if (pourT0 >= 0) return;
    measure();
    pourT0 = performance.now();
    /* arriving from a deep link, well past the source: it is already there */
    if (srcDoc < window.pageYOffset - vhCss * 0.2) pourT0 -= POUR_MS;
    root.classList.add('rb-src');
    busyUntil = pourT0 + POUR_MS + 400;
    buildMask();
  }
  function reveal() {
    var top = srcDoc - window.pageYOffset;
    if (pourT0 < 0 && top < vhCss * 0.92) {
      if (aboutClear()) startPour();
      else { clearTimeout(waitT); waitT = setTimeout(update, 120); }   /* the curtain is still settling */
    }
    return pourT0 >= 0 && top < vhCss ? 1 : 0;
  }

  /* ---- drawing ------------------------------------------------------------- */
  function setU(U, now, ps, energy) {
    gl.uniform1f(U.uTime, now);
    gl.uniform1f(U.uScroll, window.pageYOffset * dpr);
    gl.uniform1f(U.uVh, H);
    gl.uniform1f(U.uAspect, W / H);
    gl.uniform1f(U.uDpr, dpr);
    gl.uniform1f(U.uLight, light);
    gl.uniform1f(U.uAmp, AMP);
    gl.uniform1f(U.uWid, WID);
    gl.uniform1f(U.uClear, clearX);
    gl.uniform1f(U.uSrcX, srcX);
    gl.uniform1f(U.uSrcY, srcDoc * dpr);
    gl.uniform1f(U.uFree, freeDoc * dpr);
    gl.uniform1f(U.uPour, ps.len > 1e6 ? 1e7 : ps.len * dpr);
    gl.uniform1f(U.uEdge, edgeX);
    gl.uniform1f(U.uDive, diveDoc * dpr);
    gl.uniform1f(U.uUnwind, ps.unwind);
    gl.uniform1f(U.uN, half() ? STRANDS / 2 : STRANDS);
    gl.uniform1f(U.uDocH, docH * dpr);
    gl.uniform1f(U.uEnergy, energy * GAIN);
    gl.uniform1f(U.uSmall, small ? 1 : 0);
  }
  function half() { return light > 0.5 || tier >= 3; }

  function strands(now, ps, energy, dark) {
    gl.useProgram(strandP); setU(SU, now, ps, energy);
    gl.uniform1f(SU.uLightF, light); gl.uniform1f(SU.uMaskOn, maskOn);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, maskTex); gl.uniform1i(SU.uMask, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.enableVertexAttribArray(aV); gl.vertexAttribPointer(aV, 4, gl.FLOAT, false, 0, 0);
    /* the haze fakes bloom where there is no bloom pass; the light theme uses it as the band's body */
    if (R.haze[1] && (!dark || !rtS)) gl.drawElements(gl.TRIANGLES, R.haze[1], gl.UNSIGNED_SHORT, R.haze[0] * 2);
    var r = half() ? R.half : R.all;
    gl.drawElements(gl.TRIANGLES, r[1], gl.UNSIGNED_SHORT, r[0] * 2);
    gl.disableVertexAttribArray(aV);
    if (dark && DUST) {
      gl.useProgram(dustP); setU(DU, now, ps, energy);
      gl.bindBuffer(gl.ARRAY_BUFFER, dbo); gl.enableVertexAttribArray(aD);
      gl.vertexAttribPointer(aD, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, DUST);
      gl.disableVertexAttribArray(aD);
    }
  }
  function flare(ps, energy) {
    if (ps.flare <= 0.001) return;
    var y = 1 - 2 * (srcDoc - window.pageYOffset) / vhCss;
    if (y < -1.3 || y > 1.3) return;
    gl.useProgram(flareP);
    gl.uniform2f(FU.uPos, srcX, y);
    gl.uniform2f(FU.uSize, (small ? 90 : 160) * 2 / root.clientWidth, (small ? 22 : 36) * 2 / vhCss);
    gl.uniform1f(FU.uAmt, ps.flare * energy);
    gl.bindBuffer(gl.ARRAY_BUFFER, qbo); gl.enableVertexAttribArray(aQf);
    gl.vertexAttribPointer(aQf, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(aQf);
  }
  function quad(p) {
    var a = gl.getAttribLocation(p, 'aQ');
    gl.bindBuffer(gl.ARRAY_BUFFER, qbo); gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(a);
  }

  function draw() {
    if (lost) return;
    var now = RM ? 0 : (performance.now() - t0) / 1000, ps = pourState(performance.now()), dark = light < 0.5;
    var bloom = dark && rtS;
    gl.enable(gl.BLEND);
    if (bloom) {
      /* strands and flare into the scene texture at a quarter of their energy, for headroom */
      gl.bindFramebuffer(gl.FRAMEBUFFER, rtS.f); gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.blendFunc(gl.ONE, gl.ONE);
      strands(now, ps, 0.34, true); flare(ps, 0.25);
      gl.disable(gl.BLEND);
      /* a quarter-size copy, blurred across and then down */
      gl.bindFramebuffer(gl.FRAMEBUFFER, rtB1.f); gl.viewport(0, 0, rtB1.w, rtB1.h);
      gl.useProgram(copyP); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rtS.t); gl.uniform1i(CU.uT, 0); quad(copyP);
      gl.bindFramebuffer(gl.FRAMEBUFFER, rtB2.f);
      gl.useProgram(blurP); gl.bindTexture(gl.TEXTURE_2D, rtB1.t); gl.uniform1i(BU.uT, 0);
      gl.uniform2f(BU.uDir, 1 / rtB1.w, 0); quad(blurP);
      gl.bindFramebuffer(gl.FRAMEBUFFER, rtB1.f);
      gl.bindTexture(gl.TEXTURE_2D, rtB2.t); gl.uniform2f(BU.uDir, 0, 1 / rtB1.h); quad(blurP);
      /* the scene and its glow, tone mapped so overlaps turn to light, not to a white tube */
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
      gl.useProgram(compP);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, rtS.t); gl.uniform1i(MU.uS, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, rtB1.t); gl.uniform1i(MU.uB, 1);
      quad(compP);
      gl.activeTexture(gl.TEXTURE0);
      return;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    /* light on dark adds up like light; ink on paper layers like ink */
    if (dark) gl.blendFunc(gl.ONE, gl.ONE); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    strands(now, ps, 1, dark);
    if (dark) flare(ps, 1);
  }

  /* ---- loop: full rate for a second after a scroll and through the pour,
     about 30 fps at rest, nothing while off screen or hidden; a machine that
     keeps missing frames steps down one tier and remembers it -------------- */
  var raf = 0, running = false, busyUntil = 0, lastFrame = 0, samples = [], prevTs = 0;
  function governor(ts) {
    if (prevTs && ts < busyUntil) {
      samples.push(ts - prevTs);
      if (samples.length >= 90) {
        var m = samples.slice().sort(function (a, b) { return a - b; })[45];
        samples = [];
        if (m > 22 && tier < 3) {
          tier++;
          try { sessionStorage.setItem('sfa-rb-tier', tier); } catch (e) {}
          size(true);
        }
      }
    }
    prevTs = ts;
  }
  function loop(ts) {
    raf = 0;
    if (!running || lost) return;
    if (ts < busyUntil || ts - lastFrame >= 31) { governor(ts); lastFrame = ts; draw(); }
    else prevTs = 0;
    raf = requestAnimationFrame(loop);
  }
  function kick() { if (running && !raf && !lost && !RM) raf = requestAnimationFrame(loop); }
  function visible() { return !lost && !document.hidden && reveal() > 0 && !(small && light > 0.5); }
  var rmT = 0;
  function update() {
    var on = visible();
    cv.style.opacity = on ? '1' : '0';
    root.classList.toggle('rb-on', on);
    running = on;
    if (RM) { clearTimeout(rmT); if (on) rmT = setTimeout(draw, 140); return; }   /* a still frame once the reader stops */
    if (on) { busyUntil = Math.max(busyUntil, performance.now() + 1000); kick(); }
  }

  function theme() { light = root.getAttribute('data-theme') === 'light' ? 1 : 0; }
  theme();
  new MutationObserver(function () { theme(); update(); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  /* a very fast scroll through the pour finishes it, rather than racing it */
  var lastY = window.pageYOffset, lastT = performance.now();
  window.addEventListener('scroll', function () {
    var n = performance.now(), y = window.pageYOffset;
    if (pourT0 >= 0 && n - pourT0 < POUR_MS && n - lastT < 120 && Math.abs(y - lastY) > vhCss * 1.5 * ((n - lastT) / 100)) pourT0 -= POUR_MS;
    lastY = y; lastT = n;
    update();
  }, { passive: true });
  document.addEventListener('visibilitychange', update);

  var rt = 0, roT = 0;
  function relayout() { measure(); if (pourT0 >= 0) buildMask(); update(); }
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (size(false)) relayout(); }, 150);
  });
  window.addEventListener('load', function () { relayout(); });
  if (window.ResizeObserver) {
    new ResizeObserver(function () { clearTimeout(roT); roT = setTimeout(function () { requestAnimationFrame(relayout); }, 300); })
      .observe(document.body);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

  /* if the GPU takes the context away, the page simply goes on without it */
  cv.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    lost = true; running = false; cv.style.opacity = '0'; root.classList.remove('rb-on');
    setTimeout(function () { cv.remove(); }, 900);
  });

  size(true);
  measure();
  update();
})();
