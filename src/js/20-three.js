/* ============================================================
   ONKI — 3D LAYER (three.js + EffectComposer)
   v1 : CRT broadcast unit   v2 : scroll-driven void
   v3 : chrome dreamcore
   ============================================================ */
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass}     from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass}     from 'three/addons/postprocessing/ShaderPass.js';
import {UnrealBloomPass}from 'three/addons/postprocessing/UnrealBloomPass.js';
import {AfterimagePass} from 'three/addons/postprocessing/AfterimagePass.js';
import {OutputPass}     from 'three/addons/postprocessing/OutputPass.js';

const DPR=()=>Math.min(devicePixelRatio||1,1.6);
const energy=()=> (typeof ONKI_FM!=='undefined'&&ONKI_FM.isPlaying())?ONKI_FM.energy():0;
const clock=new THREE.Clock();

/* ---------- shared broadcast screen shader ---------- */
const SCREEN_FRAG=`
uniform float uT; uniform float uCh; uniform vec3 uA; uniform vec3 uB; uniform float uOn;
varying vec2 vUv;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n2(p);p*=2.03;a*=.5;}return v;}
void main(){
 vec2 uv=vUv; vec3 c;
 float ch=floor(uCh+.5);
 if(ch<0.5){
  float b=floor(uv.x*7.);
  vec3 bars[7];
  bars[0]=vec3(1.);bars[1]=vec3(1.,1.,0.);bars[2]=vec3(0.,1.,1.);bars[3]=vec3(0.,1.,0.);
  bars[4]=vec3(1.,0.,1.);bars[5]=vec3(1.,.12,.44);bars[6]=vec3(.1,.17,.88);
  int bi=int(b); c=bars[0];
  for(int i=0;i<7;i++){ if(i==bi) c=bars[i]; }
  if(uv.y<.24){ c=mix(vec3(.02),vec3(.1,.17,.88),step(.5,fract(uv.x*3.+uT*.2))); }
  c*= .55+.45*step(.26,uv.y);
 } else if(ch<3.5){
  vec2 p=uv*2.2; float f=fbm(p+vec2(uT*.09,-uT*.06));
  float g=fbm(p*1.9-vec2(uT*.05,uT*.07));
  c=mix(uA,uB,smoothstep(.28,.78,f));
  c=mix(c,vec3(.02,.02,.05),smoothstep(.45,.95,g));
  float fig=smoothstep(.30,.05,length((uv-vec2(.5,.42))*vec2(1.7,1.)));
  c=mix(c,c*.18,fig*.85);
  c+=pow(max(0.,1.-length(uv-vec2(.5,.55))*1.7),3.)*.28;
 } else {
  float s=h(uv*vec2(320.,240.)+uT*70.);
  c=vec3(s)*.85; c.r*=1.04; c.b*=1.08;
  c=mix(c,vec3(.02),step(.996,fract(uv.y*3.-uT*.6))*.6);
 }
 float scan=sin(uv.y*300.)*.5+.5; c*=.82+.18*scan;
 float roll=smoothstep(0.,.03,fract(uv.y-uT*.12))*smoothstep(.10,.03,fract(uv.y-uT*.12));
 c+=roll*.10;
 float v=1.-length((uv-.5)*vec2(1.15,1.))*1.25; c*=clamp(v,0.,1.)*1.15;
 c*=uOn;
 gl_FragColor=vec4(c,1.);
}`;
const SCREEN_VERT=`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
function screenMat(a,b,ch){
 return new THREE.ShaderMaterial({uniforms:{uT:{value:0},uCh:{value:ch||0},uOn:{value:1},
  uA:{value:new THREE.Color(a||'#ff8a2b')},uB:{value:new THREE.Color(b||'#1a2be0')}},
  vertexShader:SCREEN_VERT,fragmentShader:SCREEN_FRAG});
}

/* ---------- custom passes ---------- */
const CRTPass = {
 uniforms:{tDiffuse:{value:null},uT:{value:0},uAmt:{value:1}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform sampler2D tDiffuse;uniform float uT,uAmt;varying vec2 vUv;
 void main(){
  vec2 uv=vUv, c=uv-.5;
  float r2=dot(c,c);
  uv=.5+c*(1.+r2*.14*uAmt);
  if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.){gl_FragColor=vec4(0.,0.,0.,1.);return;}
  float sh=.0022*uAmt;
  vec3 col;
  col.r=texture2D(tDiffuse,uv+vec2(sh,0.)).r;
  col.g=texture2D(tDiffuse,uv).g;
  col.b=texture2D(tDiffuse,uv-vec2(sh,0.)).b;
  float scan=sin(uv.y*380.)*.5+.5; col*=.86+.14*scan;
  float grille=sin(uv.x*520.)*.5+.5; col*=.93+.07*grille;
  col*=1.-smoothstep(.30,.85,r2)*.75;
  col+=fract(sin(dot(uv,vec2(12.99,78.23))+uT)*43758.55)*.030;
  gl_FragColor=vec4(col,1.);
 }`
};
const GRAINPass = {
 uniforms:{tDiffuse:{value:null},uT:{value:0},uAmt:{value:1},uShift:{value:.0016}},
 vertexShader:CRTPass.vertexShader,
 fragmentShader:`uniform sampler2D tDiffuse;uniform float uT,uAmt,uShift;varying vec2 vUv;
 float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 void main(){
  vec2 uv=vUv, c=uv-.5;
  float d=dot(c,c);
  float s=uShift*(1.+d*5.);
  vec3 col;
  col.r=texture2D(tDiffuse,uv+vec2(s,0.)).r;
  col.g=texture2D(tDiffuse,uv).g;
  col.b=texture2D(tDiffuse,uv-vec2(s,0.)).b;
  float g=h(uv*vec2(1920.,1080.)+uT*37.);
  col+=(g-.5)*.050*uAmt;
  col*=1.-smoothstep(.16,.82,d)*1.15;
  float sl=sin(uv.y*640.)*.007; col+=sl;
  gl_FragColor=vec4(col,1.);
 }`
};
const PRISMPass = {
 uniforms:{tDiffuse:{value:null},uT:{value:0},uAmt:{value:1}},
 vertexShader:CRTPass.vertexShader,
 fragmentShader:`uniform sampler2D tDiffuse;uniform float uT,uAmt;varying vec2 vUv;
 void main(){
  vec2 uv=vUv,c=uv-.5; float d=length(c);
  float a=atan(c.y,c.x);
  vec2 off=vec2(cos(a),sin(a))*d*.010*uAmt;
  vec3 col;
  col.r=texture2D(tDiffuse,uv+off*1.25).r;
  col.g=texture2D(tDiffuse,uv).g;
  col.b=texture2D(tDiffuse,uv-off*1.25).b;
  float ring=sin(d*40.-uT*1.2)*.5+.5;
  col+=vec3(ring*.030,ring*.018,ring*.045)*smoothstep(.1,.7,d)*uAmt;
  col+=pow(max(0.,1.-d*1.5),3.)*.10;
  gl_FragColor=vec4(col,1.);
 }`
};

/* ---------- helpers ---------- */
function canvasTex(draw,w=512,h=256){
 const c=document.createElement('canvas'); c.width=w; c.height=h;
 draw(c.getContext('2d'),w,h);
 const t=new THREE.CanvasTexture(c); t.anisotropy=4; t.colorSpace=THREE.SRGBColorSpace; return t;
}
function logoTex(bg,fg,sub){
 return canvasTex((x,w,h)=>{
  x.fillStyle=bg; x.fillRect(0,0,w,h);
  x.fillStyle=fg; x.textAlign='center'; x.textBaseline='middle';
  x.font='900 116px Archivo, Arial Black, sans-serif';
  x.save(); x.translate(w/2,h/2-24); x.transform(1,0,-.16,1,0,0); x.fillText('ONKI',0,0); x.restore();
  x.save(); x.translate(w/2,h/2+68); x.transform(1,0,-.16,1,0,0); x.fillText('INC.',0,0); x.restore();
  if(sub){x.font='400 22px monospace';x.fillStyle=fg;x.globalAlpha=.7;x.fillText(sub,w/2,h-24);x.globalAlpha=1}
 },512,320);
}
function dust(n,spread,color,size){
 const g=new THREE.BufferGeometry(), p=new Float32Array(n*3);
 for(let i=0;i<n*3;i+=3){p[i]=(Math.random()-.5)*spread;p[i+1]=(Math.random()-.5)*spread;p[i+2]=(Math.random()-.5)*spread}
 g.setAttribute('position',new THREE.BufferAttribute(p,3));
 const tex=canvasTex((x,w,h)=>{const gr=x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
  gr.addColorStop(0,'#fff');gr.addColorStop(.4,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=gr;x.fillRect(0,0,w,h)},64,64);
 return new THREE.Points(g,new THREE.PointsMaterial({size:size||.05,map:tex,transparent:true,depthWrite:false,
  blending:THREE.AdditiveBlending,color:new THREE.Color(color||'#ffffff'),opacity:.85}));
}
/* build a CRT television */
function buildTV(opts={}){
 const G=new THREE.Group();
 const body=new THREE.Mesh(new THREE.BoxGeometry(3.5,2.6,2.6),
  new THREE.MeshStandardMaterial({color:opts.body||0xd9d2c0,roughness:.62,metalness:.06}));
 G.add(body);
 const bez=new THREE.Mesh(new THREE.BoxGeometry(2.86,1.98,.14),
  new THREE.MeshStandardMaterial({color:0x1c1c20,roughness:.5}));
 bez.position.set(-.22,.2,1.31); G.add(bez);
 const sm=screenMat(opts.a,opts.b,opts.ch||0);
 const scr=new THREE.Mesh(new THREE.PlaneGeometry(2.62,1.78,40,30),sm);
 scr.position.set(-.22,.2,1.40); G.add(scr);
 // bulge the screen
 const pos=scr.geometry.attributes.position;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i)/1.31,y=pos.getY(i)/.89;pos.setZ(i,(1-x*x*.24-y*y*.20)*.10)}
 pos.needsUpdate=true;
 // glass
 const glass=new THREE.Mesh(new THREE.PlaneGeometry(2.62,1.78),
  new THREE.MeshPhysicalMaterial({transparent:true,opacity:.16,roughness:.06,metalness:0,transmission:.6,color:0xbfd8ff}));
 glass.position.set(-.22,.2,1.44); G.add(glass);
 // speaker vents
 for(let i=0;i<7;i++){
  const v=new THREE.Mesh(new THREE.BoxGeometry(.5,.055,.06),
   new THREE.MeshStandardMaterial({color:0x8d857a,roughness:.8}));
  v.position.set(1.42,.85-i*.13,1.32); G.add(v);
 }
 // knobs
 for(let i=0;i<2;i++){
  const k=new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,.12,20),
   new THREE.MeshStandardMaterial({color:0x2a2a30,roughness:.4,metalness:.35}));
  k.rotation.x=Math.PI/2; k.position.set(1.42,-.42-i*.38,1.34); G.add(k);
 }
 // front buttons
 for(let i=0;i<4;i++){
  const b=new THREE.Mesh(new THREE.BoxGeometry(.19,.1,.07),
   new THREE.MeshStandardMaterial({color:0xbfb6a4,roughness:.7}));
  b.position.set(-1.0+i*.28,-1.06,1.32); G.add(b);
 }
 // brand plate
 const plate=new THREE.Mesh(new THREE.PlaneGeometry(1.0,.24),
  new THREE.MeshBasicMaterial({map:canvasTex((x,w,h)=>{x.fillStyle='#d9d2c0';x.fillRect(0,0,w,h);
   x.fillStyle='#2a2a30';x.font='700 44px "Silkscreen",monospace';x.textBaseline='middle';x.fillText('ONKI INC.',12,h/2)},256,64),transparent:true}));
 plate.position.set(-.78,-1.06,1.32); G.add(plate);
 // glow from screen
 const gl=new THREE.PointLight(0x88bbff,1.6,7); gl.position.set(-.22,.2,2.0); G.add(gl);
 G.userData={mat:sm,light:gl};
 return G;
}

/* ============================================================
   REALITY 01 — CRT unit inside a window
   ============================================================ */
const S1=(()=>{
 let ren,scene,cam,comp,tv,crt,mount,ready=false,spin=0,rx=-.12,ry=.5,vx=0,vy=0,dist=7.4;
 function init(){
  mount=document.getElementById('v1-tv-mount'); if(!mount||ready)return;
  try{ ren=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'}) }catch(e){ return }
  ren.setPixelRatio(DPR()); ren.setSize(mount.clientWidth||420,mount.clientHeight||280,false);
  ren.toneMapping=THREE.ACESFilmicToneMapping; ren.toneMappingExposure=1.05;
  mount.innerHTML=''; mount.appendChild(ren.domElement);
  scene=new THREE.Scene(); scene.background=new THREE.Color(0x080a12);
  scene.fog=new THREE.FogExp2(0x080a12,.055);
  cam=new THREE.PerspectiveCamera(38,1,.1,90); cam.position.set(0,.5,dist);
  scene.add(new THREE.HemisphereLight(0x9fc4ff,0x201a14,1.05));
  const key=new THREE.DirectionalLight(0xffffff,1.5); key.position.set(4,6,6); scene.add(key);
  const rim=new THREE.DirectionalLight(0xff3f8f,1.5); rim.position.set(-6,2,-4); scene.add(rim);
  const rim2=new THREE.DirectionalLight(0x38f0ff,.9); rim2.position.set(6,-1,-5); scene.add(rim2);
  tv=buildTV({ch:0,a:'#ff8a2b',b:'#1a2be0'}); scene.add(tv);
  // pedestal grid
  const grid=new THREE.GridHelper(40,40,0x2b3a6a,0x16203c); grid.position.y=-1.45; scene.add(grid);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),
   new THREE.MeshStandardMaterial({color:0x0a0f1c,roughness:.35,metalness:.5}));
  floor.rotation.x=-Math.PI/2; floor.position.y=-1.46; scene.add(floor);
  scene.add(dust(220,16,'#9fc4ff',.045));
  comp=new EffectComposer(ren);
  comp.addPass(new RenderPass(scene,cam));
  const bl=new UnrealBloomPass(new THREE.Vector2(512,512),.62,.72,.62); comp.addPass(bl);
  crt=new ShaderPass(CRTPass); comp.addPass(crt);
  comp.addPass(new OutputPass());
  bindDrag(ren.domElement);
  ready=true; resize();
 }
 function bindDrag(el){
  let on=false,px=0,py=0;
  el.addEventListener('pointerdown',e=>{on=true;px=e.clientX;py=e.clientY;el.setPointerCapture(e.pointerId);el.style.cursor='grabbing'});
  el.addEventListener('pointermove',e=>{ if(!on)return;
   vy=(e.clientX-px)*.008; vx=(e.clientY-py)*.006; ry+=vy; rx+=vx; px=e.clientX; py=e.clientY;
   rx=Math.max(-.9,Math.min(.9,rx)) });
  const up=()=>{on=false;el.style.cursor='grab'};
  el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up);
  el.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(4.6,Math.min(13,dist+e.deltaY*.006))},{passive:false});
 }
 function resize(){ if(!ready||!mount)return;
  const w=mount.clientWidth||420,h=mount.clientHeight||280;
  ren.setSize(w,h,false); comp.setSize(w,h); cam.aspect=w/h; cam.updateProjectionMatrix(); }
 function frame(t){
  if(!ready)return;
  const e=energy();
  vy*=.93; vx*=.93; if(spin>0){ry+=.02*spin;spin=Math.max(0,spin-.004)}
  ry+=vy*.25; rx+=vx*.25;
  tv.rotation.y+=(ry-tv.rotation.y)*.12;
  tv.rotation.x+=(rx-tv.rotation.x)*.12;
  tv.position.y=Math.sin(t*.8)*.06;
  cam.position.z+=(dist-cam.position.z)*.08;
  tv.userData.mat.uniforms.uT.value=t;
  tv.userData.light.intensity=1.3+e*3.2;
  crt.uniforms.uT.value=t; crt.uniforms.uAmt.value=1+e*.7;
  comp.render();
 }
 return {init,frame,resize,
  ch:i=>{if(ready)tv.userData.mat.uniforms.uCh.value=i},
  spin:()=>{spin=1}};
})();

/* ============================================================
   REALITY 02 — scroll-driven void
   ============================================================ */
const S2=(()=>{
 let ren,scene,cam,comp,ready=false,cv;
 let grain,after,stations=[],targetY=0,curY=0,mono,tv2,gb,recur=[],ring;
 function init(){
  cv=document.getElementById('v2-gl'); if(!cv||ready)return;
  try{ ren=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'}) }catch(e){ return }
  ren.setPixelRatio(DPR()); ren.toneMapping=THREE.ACESFilmicToneMapping; ren.toneMappingExposure=1.15;
  scene=new THREE.Scene(); scene.background=new THREE.Color(0x040406);
  scene.fog=new THREE.FogExp2(0x040406,.028);
  cam=new THREE.PerspectiveCamera(46,1,.1,300);
  scene.add(new THREE.HemisphereLight(0x5570ff,0x120610,.75));
  const k=new THREE.DirectionalLight(0xffffff,1.15); k.position.set(5,8,7); scene.add(k);
  const p1=new THREE.PointLight(0xff1f6f,60,60); p1.position.set(-8,4,-6); scene.add(p1);
  const p2=new THREE.PointLight(0x38f0ff,45,60); p2.position.set(9,-3,-14); scene.add(p2);

  /* -- station 0 : monolith -- */
  mono=new THREE.Group();
  const slab=new THREE.Mesh(new THREE.BoxGeometry(4.2,7.4,.6),
   new THREE.MeshStandardMaterial({color:0x0a0a0f,roughness:.28,metalness:.85}));
  mono.add(slab);
  const ms=screenMat('#ff1f6f','#1a2be0',1);
  const mscr=new THREE.Mesh(new THREE.PlaneGeometry(3.5,6.6),ms); mscr.position.z=.32; mono.add(mscr);
  mono.userData.mat=ms;
  const halo=new THREE.Mesh(new THREE.PlaneGeometry(9,12),
   new THREE.MeshBasicMaterial({map:canvasTex((x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
    g.addColorStop(0,'rgba(255,60,140,.55)');g.addColorStop(.5,'rgba(80,40,255,.18)');g.addColorStop(1,'rgba(0,0,0,0)');
    x.fillStyle=g;x.fillRect(0,0,w,h)},256,256),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  halo.position.z=-.5; mono.add(halo);
  mono.position.set(0,0,0); scene.add(mono);
  scene.add(dust(900,60,'#aab8ff',.06));

  /* -- station 1 : ring of type -- */
  ring=new THREE.Group();
  const logo=logoTex('#050508','#ffffff');
  for(let i=0;i<12;i++){
   const m=new THREE.Mesh(new THREE.PlaneGeometry(3.2,2.0),
    new THREE.MeshBasicMaterial({map:logo,transparent:true,opacity:.5,side:THREE.DoubleSide}));
   const a=i/12*Math.PI*2; m.position.set(Math.cos(a)*7,0,Math.sin(a)*7); m.lookAt(0,0,0); ring.add(m);
  }
  ring.position.set(0,-28,0); scene.add(ring);

  /* -- station 2 : the set -- */
  tv2=buildTV({body:0x22242c,ch:1,a:'#ff4fa0',b:'#2b8fff'});
  tv2.scale.setScalar(1.5); tv2.position.set(0,-58,0); scene.add(tv2);

  /* -- station 3 : handheld -- */
  gb=new THREE.Group();
  const shell=new THREE.Mesh(new THREE.BoxGeometry(3.0,4.8,.7),
   new THREE.MeshStandardMaterial({color:0xd6d0c2,roughness:.55}));
  gb.add(shell);
  const gscr=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.9),screenMat('#c8ff2e','#0f2a12',1));
  gscr.position.set(0,1.0,.37); gb.add(gscr); gb.userData.mat=gscr.material;
  const gbez=new THREE.Mesh(new THREE.BoxGeometry(2.5,2.2,.1),new THREE.MeshStandardMaterial({color:0x4a4a52,roughness:.6}));
  gbez.position.set(0,1.0,.33); gb.add(gbez);
  [[-.8,-1.3],[-.8,-1.9],[-1.15,-1.6],[-.45,-1.6]].forEach(([x,y])=>{
   const b=new THREE.Mesh(new THREE.BoxGeometry(.32,.32,.14),new THREE.MeshStandardMaterial({color:0x2a2a30,roughness:.5}));
   b.position.set(x,y,.38); gb.add(b) });
  [[.75,-1.35],[1.2,-1.65]].forEach(([x,y])=>{
   const b=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.14,20),new THREE.MeshStandardMaterial({color:0xc4256f,roughness:.35,metalness:.2}));
   b.rotation.x=Math.PI/2; b.position.set(x,y,.38); gb.add(b) });
  gb.position.set(0,-88,0); scene.add(gb);

  /* -- station 4 : email recursion tunnel -- */
  const mailTex=canvasTex((x,w,h)=>{
   x.clearRect(0,0,w,h);
   x.fillStyle='#ffffff'; x.textAlign='center'; x.textBaseline='middle';
   x.font='900 92px Archivo, Arial Black, sans-serif';
   x.fillText('HELLO@ONKI.TV',w/2,h/2);
  },1024,192);
  const COLS=[0xffffff,0xff1f6f,0x38f0ff,0xc8ff2e,0xffd23a];
  for(let i=0;i<22;i++){
   const m=new THREE.Mesh(new THREE.PlaneGeometry(12,2.25),
    new THREE.MeshBasicMaterial({map:mailTex,transparent:true,color:COLS[i%COLS.length],
     opacity:1-i/26,blending:THREE.AdditiveBlending,depthWrite:false}));
   m.position.set(0,-118,-i*2.6); m.scale.setScalar(1-i*.028); recur.push(m); scene.add(m);
  }

  stations=[
   {y:0,   z:13, look:0,   fov:46},
   {y:-28, z:15, look:-28, fov:52},
   {y:-58, z:12, look:-58, fov:42},
   {y:-88, z:10, look:-88, fov:44},
   {y:-88, z:10, look:-88, fov:44},
   {y:-118,z:12, look:-118,fov:50},
   {y:-118,z:9,  look:-118,fov:56}
  ];
  cam.position.set(0,0,13);
  comp=new EffectComposer(ren);
  comp.addPass(new RenderPass(scene,cam));
  after=new AfterimagePass(.50); comp.addPass(after);
  comp.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),1.05,.78,.42));
  grain=new ShaderPass(GRAINPass); comp.addPass(grain);
  comp.addPass(new OutputPass());
  ready=true; resize();
 }
 function resize(){ if(!ready)return; const w=innerWidth,h=innerHeight;
  ren.setSize(w,h,false); comp.setSize(w,h); cam.aspect=w/h; cam.updateProjectionMatrix(); }
 let secI=0, prog=0;
 function setSec(i){ secI=Math.max(0,Math.min(stations.length-1,i)) }
 function setScroll(p){ prog=p }
 function frame(t){
  if(!ready)return;
  const e=energy(), st=stations[secI];
  targetY=st.y; curY+=(targetY-curY)*.055;
  cam.position.y+=(curY-cam.position.y)*.09;
  cam.position.z+=(st.z-cam.position.z)*.06;
  cam.position.x=Math.sin(t*.22)*.7;
  cam.lookAt(Math.sin(t*.16)*.4,curY+Math.sin(t*.3)*.25,0);
  cam.fov+=(st.fov-cam.fov)*.05; cam.updateProjectionMatrix();
  mono.rotation.y=Math.sin(t*.24)*.42+prog*1.2;
  mono.userData.mat.uniforms.uT.value=t;
  ring.rotation.y=t*.16;
  ring.children.forEach((m,i)=>{m.position.y=Math.sin(t*.9+i)*.5;m.material.opacity=.25+e*.7});
  tv2.rotation.y=t*.36; tv2.rotation.x=Math.sin(t*.5)*.12;
  tv2.userData.mat.uniforms.uT.value=t;
  gb.rotation.y=Math.sin(t*.42)*.7; gb.rotation.z=Math.sin(t*.3)*.09;
  gb.userData.mat.uniforms.uT.value=t;
  recur.forEach((m,i)=>{ m.rotation.z=Math.sin(t*.6+i*.28)*.05;
   m.position.z=-i*2.6+((t*2.2)%2.6);
   m.material.opacity=(1-i/26)*(.45+e*.75); });
  after.uniforms.damp.value=.44+e*.28;
  grain.uniforms.uT.value=t; grain.uniforms.uAmt.value=1+e*.9;
  grain.uniforms.uShift.value=.0014+e*.004+ONKI.FX.level()*.006;
  comp.render();
 }
 return {init,frame,resize,setSec,setScroll};
})();

/* ============================================================
   REALITY 03 — chrome dreamcore
   ============================================================ */
const S3=(()=>{
 let ren,scene,cam,comp,ready=false,cv,blob,base,cd,stars=[],prism,sky,dolph;
 function init(){
  cv=document.getElementById('v3-gl'); if(!cv||ready)return;
  try{ ren=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'}) }catch(e){ return }
  ren.setPixelRatio(DPR()); ren.toneMapping=THREE.ACESFilmicToneMapping; ren.toneMappingExposure=.92;
  scene=new THREE.Scene();
  cam=new THREE.PerspectiveCamera(42,1,.1,200); cam.position.set(0,.4,9);

  /* sky dome with fbm clouds */
  const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{uT:{value:0}},
   vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
   fragmentShader:`varying vec3 vP;uniform float uT;
   float h(vec3 p){return fract(sin(dot(p,vec3(12.99,78.23,45.16)))*43758.55);}
   float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    float a=mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);
    return a;}
   float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n3(p);p*=2.02;a*=.5;}return v;}
   void main(){
    vec3 d=normalize(vP);
    float y=clamp(d.y*.5+.5,0.,1.);
    vec3 sky=mix(vec3(.62,.84,.99),mix(vec3(.16,.52,.92),vec3(.03,.22,.72),smoothstep(.58,1.,y)),smoothstep(.10,.92,y));
    sky=mix(vec3(.20,.42,.72),sky,smoothstep(-.55,-.02,d.y));
    float c=fbm(d*2.4+vec3(uT*.010,0.,uT*.007));
    float c2=fbm(d*5.8-vec3(uT*.018,uT*.009,0.));
    float cl=smoothstep(.56,.80,c*.72+c2*.34)*smoothstep(-.04,.42,d.y);
    sky=mix(sky,vec3(1.),cl*.95);
    sky+=pow(max(0.,dot(d,normalize(vec3(-.5,.45,.3)))),40.)*vec3(1.,.96,.82)*.55;
    gl_FragColor=vec4(sky,1.);
   }`});
  sky=new THREE.Mesh(new THREE.SphereGeometry(70,40,28),skyMat); scene.add(sky);

  /* environment for chrome */
  const pmrem=new THREE.PMREMGenerator(ren);
  const envTex=canvasTex((x,w,h)=>{
   const g=x.createLinearGradient(0,0,0,h);
   g.addColorStop(0,'#02133f');g.addColorStop(.22,'#0a5fd0');g.addColorStop(.44,'#7fd0ff');
   g.addColorStop(.50,'#ffffff');g.addColorStop(.58,'#ff5fb0');g.addColorStop(.72,'#123a86');
   g.addColorStop(.88,'#04102e');g.addColorStop(1,'#000814');
   x.fillStyle=g;x.fillRect(0,0,w,h);
   for(let i=0;i<20;i++){const cx=Math.random()*w,cy=Math.random()*h*.44,r=26+Math.random()*80;
    const rg=x.createRadialGradient(cx,cy,0,cx,cy,r);rg.addColorStop(0,'rgba(255,255,255,.95)');rg.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=rg;x.beginPath();x.arc(cx,cy,r,0,6.283);x.fill()}
   // hard horizon bands give chrome its definition
   x.fillStyle='rgba(0,10,30,.55)';for(let i=0;i<7;i++)x.fillRect(0,h*.62+i*22,w,7);
   x.fillStyle='rgba(255,255,255,.9)';x.fillRect(0,h*.495,w,5);
  },1024,512);
  envTex.mapping=THREE.EquirectangularReflectionMapping;
  scene.environment=pmrem.fromEquirectangular(envTex).texture;

  scene.add(new THREE.HemisphereLight(0xffffff,0x123a72,.85));
  const k=new THREE.DirectionalLight(0xffffff,2.4); k.position.set(-4,6,6); scene.add(k);
  const p=new THREE.PointLight(0xff3f9f,90,45); p.position.set(5,-2,4); scene.add(p);
  const p2=new THREE.PointLight(0x2bd8ff,70,45); p2.position.set(-6,3,3); scene.add(p2);

  /* liquid chrome blob */
  const geo=new THREE.IcosahedronGeometry(2.05,9);
  base=geo.attributes.position.array.slice(0);
  blob=new THREE.Mesh(geo,new THREE.MeshPhysicalMaterial({color:0xdfefff,metalness:1,roughness:.055,
    clearcoat:1,clearcoatRoughness:.04,envMapIntensity:2.1}));
  blob.position.set(-5.2,1.15,-4.4); blob.scale.setScalar(.66); scene.add(blob);

  /* spinning CD */
  cd=new THREE.Group();
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,.035,72),
   new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:1,roughness:.08,iridescence:1,iridescenceIOR:1.9,
    iridescenceThicknessRange:[120,760],envMapIntensity:2.0}));
  disc.rotation.x=Math.PI/2; cd.add(disc);
  const hole=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.06,40),
   new THREE.MeshStandardMaterial({color:0xeaf6ff,metalness:.2,roughness:.3}));
  hole.rotation.x=Math.PI/2; cd.add(hole);
  cd.position.set(5.2,2.2,-3.6); cd.rotation.z=.35; scene.add(cd);

  /* chrome stars */
  const starShape=new THREE.Shape();
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2-Math.PI/2, r=i%2?.34:.85;
   i?starShape.lineTo(Math.cos(a)*r,Math.sin(a)*r):starShape.moveTo(Math.cos(a)*r,Math.sin(a)*r)}
  starShape.closePath();
  const sg=new THREE.ExtrudeGeometry(starShape,{depth:.22,bevelEnabled:true,bevelSize:.07,bevelThickness:.07,bevelSegments:3});
  sg.center();
  [[-6.0,-2.1,-1.2,.7,0xffd9ef],[4.6,-2.4,-1.0,.62,0xd8f4ff],[6.2,1.0,-3.2,.5,0xfff2b0]].forEach(([x,y,z,s,c])=>{
   const m=new THREE.Mesh(sg,new THREE.MeshPhysicalMaterial({color:c,metalness:1,roughness:.10,envMapIntensity:1.8}));
   m.position.set(x,y,z); m.scale.setScalar(s); stars.push(m); scene.add(m) });

  /* chrome dolphin-ish form */
  dolph=new THREE.Mesh(new THREE.TorusKnotGeometry(.72,.24,120,18,2,3),
   new THREE.MeshPhysicalMaterial({color:0xbfe6ff,metalness:1,roughness:.06,envMapIntensity:1.9}));
  dolph.position.set(5.6,-2.6,-2.2); dolph.scale.setScalar(.78); scene.add(dolph);

  comp=new EffectComposer(ren);
  comp.addPass(new RenderPass(scene,cam));
  comp.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.34,.62,.94));
  prism=new ShaderPass(PRISMPass); comp.addPass(prism);
  comp.addPass(new OutputPass());
  ready=true; resize();
 }
 function resize(){ if(!ready)return; const w=innerWidth,h=innerHeight;
  ren.setSize(w,h,false); comp.setSize(w,h); cam.aspect=w/h; cam.updateProjectionMatrix(); }
 let prog=0;
 function setScroll(p){ prog=p }
 function frame(t){
  if(!ready)return;
  const e=energy();
  // morph blob
  const pos=blob.geometry.attributes.position, arr=pos.array;
  for(let i=0;i<arr.length;i+=3){
   const x=base[i],y=base[i+1],z=base[i+2];
   const n=Math.sin(x*1.5+t*1.1)*Math.cos(y*1.6-t*.85)*Math.sin(z*1.4+t*.6);
   const s=1+n*(.10+e*.20)+Math.sin(t*.7)*.02;
   arr[i]=x*s; arr[i+1]=y*s; arr[i+2]=z*s;
  }
  pos.needsUpdate=true; blob.geometry.computeVertexNormals();
  blob.rotation.y=t*.24; blob.rotation.x=Math.sin(t*.32)*.22;
  cd.rotation.y=t*1.9; cd.position.y=1.5+Math.sin(t*.8)*.3;
  stars.forEach((s,i)=>{ s.rotation.y=t*(.5+i*.22); s.rotation.z=Math.sin(t*.6+i)*.4;
   s.position.y+=Math.sin(t*.9+i*2)*.004 });
  dolph.rotation.x=t*.5; dolph.rotation.y=t*.32;
  dolph.position.y=-2.6+Math.sin(t*.7)*.42;
  sky.material.uniforms.uT.value=t;
  cam.position.x=Math.sin(t*.18)*1.1+prog*1.6;
  cam.position.y=.4-prog*2.4;
  cam.position.z=9-prog*1.6;
  cam.lookAt(0,-prog*1.6,0);
  prism.uniforms.uT.value=t; prism.uniforms.uAmt.value=.42+e*.9+ONKI.FX.level()*.8;
  comp.render();
 }
 return {init,frame,resize,setScroll};
})();


/* ============================================================
   ONKI BOY — 3D handheld with the live game on its screen
   ============================================================ */
const S4=(()=>{
 let ren,scene,cam,comp,gb,tex,crt,mount,ready=false,spin=0,rx=-.05,ry=.42,vx=0,vy=0,dist=9.2,srcCv;
 function init(){
  mount=document.getElementById('v1-gb-mount'); srcCv=document.getElementById('v1-game');
  if(!mount||!srcCv||ready)return;
  try{ ren=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'}) }catch(e){ return }
  ren.setPixelRatio(DPR()); ren.setSize(mount.clientWidth||520,mount.clientHeight||420,false);
  ren.toneMapping=THREE.ACESFilmicToneMapping; ren.toneMappingExposure=1.08;
  mount.innerHTML=''; mount.appendChild(ren.domElement);
  scene=new THREE.Scene(); scene.background=new THREE.Color(0x070912);
  scene.fog=new THREE.FogExp2(0x070912,.035);
  cam=new THREE.PerspectiveCamera(36,1,.1,90); cam.position.set(0,0,dist);
  scene.add(new THREE.HemisphereLight(0xbcd4ff,0x201a14,1.0));
  const k=new THREE.DirectionalLight(0xffffff,1.7); k.position.set(4,7,7); scene.add(k);
  const r1=new THREE.PointLight(0xff1f6f,55,40); r1.position.set(-7,2,3); scene.add(r1);
  const r2=new THREE.PointLight(0x38f0ff,45,40); r2.position.set(7,-2,2); scene.add(r2);

  gb=new THREE.Group();
  const shellMat=new THREE.MeshStandardMaterial({color:0xd8d2c4,roughness:.52,metalness:.05});
  const body=new THREE.Mesh(new THREE.BoxGeometry(4.0,6.6,.95),shellMat); gb.add(body);
  // rounded bottom-right corner block
  const cut=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,.95,28,1,false,0,Math.PI/2),shellMat);
  cut.rotation.x=Math.PI/2; cut.position.set(.95,-2.25,0); gb.add(cut);
  // screen bezel
  const bez=new THREE.Mesh(new THREE.BoxGeometry(3.4,2.85,.12),
   new THREE.MeshStandardMaterial({color:0x4a4a54,roughness:.55}));
  bez.position.set(0,1.55,.50); gb.add(bez);
  // live game texture
  tex=new THREE.CanvasTexture(srcCv);
  tex.magFilter=THREE.NearestFilter; tex.minFilter=THREE.LinearFilter; tex.colorSpace=THREE.SRGBColorSpace;
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(2.62,2.36),
   new THREE.MeshBasicMaterial({map:tex}));
  scr.position.set(0,1.55,.575); gb.add(scr);
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(2.62,2.36),
   new THREE.MeshPhysicalMaterial({transparent:true,opacity:.13,roughness:.05,transmission:.6,color:0xbfe6ff}));
  glass.position.set(0,1.55,.60); gb.add(glass);
  const glow=new THREE.PointLight(0xc8ff2e,2.2,7); glow.position.set(0,1.55,1.4); gb.add(glow);
  gb.userData.glow=glow;
  // power led
  const led=new THREE.Mesh(new THREE.SphereGeometry(.07,12,12),
   new THREE.MeshBasicMaterial({color:0xff2d6f})); led.position.set(-1.5,1.55,.56); gb.add(led);
  // brand plate
  const plate=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.5),
   new THREE.MeshBasicMaterial({transparent:true,map:canvasTex((x,w,h)=>{
     x.clearRect(0,0,w,h); x.fillStyle='#2f3f8a'; x.textBaseline='middle';
     x.font='900 60px Archivo, Arial Black, sans-serif'; x.fillText('ONKI',10,h/2);
     x.fillStyle='#8a2f6a'; x.font='italic 40px Georgia, serif'; x.fillText('boy',176,h/2+4);
   },320,64)}));
  plate.position.set(-.28,-.15,.49); gb.add(plate);
  // d-pad
  const dm=new THREE.MeshStandardMaterial({color:0x24242c,roughness:.42});
  const dh=new THREE.Mesh(new THREE.BoxGeometry(1.15,.38,.2),dm); dh.position.set(-1.15,-1.35,.52); gb.add(dh);
  const dv=new THREE.Mesh(new THREE.BoxGeometry(.38,1.15,.2),dm); dv.position.set(-1.15,-1.35,.52); gb.add(dv);
  // A / B
  const bm=new THREE.MeshStandardMaterial({color:0xc4256f,roughness:.34,metalness:.15});
  [[1.55,-1.12],[.86,-1.55]].forEach(([x,y])=>{
   const b=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.2,24),bm);
   b.rotation.x=Math.PI/2; b.position.set(x,y,.52); gb.add(b) });
  // start / select
  const sm2=new THREE.MeshStandardMaterial({color:0x8d887c,roughness:.6});
  [[-.55,-2.35],[.32,-2.35]].forEach(([x,y])=>{
   const b=new THREE.Mesh(new THREE.CapsuleGeometry(.10,.42,4,10),sm2);
   b.rotation.set(Math.PI/2,0,-.38); b.position.set(x,y,.5); gb.add(b) });
  // speaker grille
  for(let i=0;i<6;i++){
   const g2=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.12,10),
     new THREE.MeshStandardMaterial({color:0x9a938a,roughness:.8}));
   g2.rotation.x=Math.PI/2; g2.position.set(1.05+i*.19,-2.72+i*.19,.5); gb.add(g2) }
  scene.add(gb);
  scene.add(dust(160,18,'#9fc4ff',.05));
  const grid=new THREE.GridHelper(50,50,0x2b3a6a,0x141c34); grid.position.y=-4.2; scene.add(grid);

  comp=new EffectComposer(ren);
  comp.addPass(new RenderPass(scene,cam));
  comp.addPass(new UnrealBloomPass(new THREE.Vector2(512,512),.5,.7,.72));
  crt=new ShaderPass(CRTPass); crt.uniforms.uAmt.value=.55; comp.addPass(crt);
  comp.addPass(new OutputPass());
  bind(ren.domElement);
  ready=true; resize();
 }
 function bind(el){
  let on=false,px=0,py=0;
  el.addEventListener('pointerdown',e=>{on=true;px=e.clientX;py=e.clientY;el.setPointerCapture(e.pointerId)});
  el.addEventListener('pointermove',e=>{ if(!on)return;
   vy=(e.clientX-px)*.008; vx=(e.clientY-py)*.006; ry+=vy; rx+=vx; px=e.clientX; py=e.clientY;
   rx=Math.max(-.85,Math.min(.85,rx)) });
  const up=()=>on=false;
  el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up);
  el.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(6,Math.min(16,dist+e.deltaY*.006))},{passive:false});
 }
 function resize(){ if(!ready||!mount)return;
  const w=mount.clientWidth||520,h=mount.clientHeight||420;
  ren.setSize(w,h,false); comp.setSize(w,h); cam.aspect=w/h; cam.updateProjectionMatrix(); }
 function frame(t){
  if(!ready)return;
  const e=energy();
  tex.needsUpdate=true;
  vy*=.93; vx*=.93; if(spin>0){ry+=.022*spin;spin=Math.max(0,spin-.004)}
  ry+=vy*.25; rx+=vx*.25;
  gb.rotation.y+=(ry-gb.rotation.y)*.12;
  gb.rotation.x+=(rx-gb.rotation.x)*.12;
  gb.position.y=Math.sin(t*.7)*.12;
  gb.rotation.z=Math.sin(t*.42)*.035;
  gb.userData.glow.intensity=1.8+e*3.4;
  cam.position.z+=(dist-cam.position.z)*.08;
  crt.uniforms.uT.value=t;
  comp.render();
 }
 return {init,frame,resize,spin:()=>{spin=1}};
})();

/* ============================================================
   DRIVER
   ============================================================ */
let started=false;
function driver(){
 if(started)return; started=true;
 let last=0;
 (function loop(){
  requestAnimationFrame(loop);
  const t=clock.getElapsedTime();
  const cur=ONKI.Router.current();
  if(cur==='v1'){S1.frame(t);S4.frame(t)} else if(cur==='v2')S2.frame(t); else if(cur==='v3')S3.frame(t);
 })();
}
function boot(id){
 try{
  if(id==='v1'){S1.init();S4.init()} else if(id==='v2')S2.init(); else if(id==='v3')S3.init();
  driver();
  setTimeout(()=>{try{S1.resize();S2.resize();S3.resize();S4.resize()}catch(e){}},320);
 }catch(e){ console.warn('[onki 3d]',e) }
}
window.__onkiTV=()=>{ try{S1.init();S1.resize()}catch(e){} };
window.__onkiTVch=i=>S1.ch(i);
window.__onkiTVspin=()=>S1.spin();
window.__onkiGB=()=>{ try{S4.init();S4.resize()}catch(e){} };
window.__onkiGBspin=()=>S4.spin();
window.__onkiV2Sec=i=>S2.setSec(i);
window.__onkiV2Scroll=p=>S2.setScroll(p);
window.__onkiV3Scroll=p=>S3.setScroll(p);
document.addEventListener('onki:reality',e=>boot(e.detail.id));
addEventListener('resize',()=>{ S1.resize(); S2.resize(); S3.resize(); S4.resize() },{passive:true});
if(ONKI.Router.current()) boot(ONKI.Router.current());
