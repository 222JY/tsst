/* ============================================================
   ONKI — CORE : data · boot · router · cursor · post-fx
   ============================================================ */
const ONKI = (() => {
const $=(s,r)=>(r||document).querySelector(s), $$=(s,r)=>[...(r||document).querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;

/* ---------- CONTENT ----------
   media: ''  -> procedural slot (animated colour field)
   media: 'assets/otter.mp4'   -> autoplaying muted video thumbnail
   media: 'assets/otter.jpg'   -> still image thumbnail
   Works with a relative path, an absolute URL, or a data: URI.
   Change it here once and it updates in ALL THREE realities.        */
const PROJECTS=[
 {media:'', id:'otter', t:"THE OTTER",           y:'2024', k:'SHORT FILM · 19 MIN', d:'A strange and elegant fable about identity, belonging and the wild.', s:'RELEASED', sc:'rel',  size:'wide', c:['#ff8a2b','#ffd23a','#3a1c08'], link:'theotter.onki.tv'},
 {media:'', id:'where', t:"WHERE YOU'RE NEEDED", y:'2026', k:'FEATURE · PSYCHOLOGICAL HORROR', d:'A feature-length descent into the kind of help nobody asked for.', s:'IN EARLY DEVELOPMENT', sc:'dev', size:'std', c:['#6b7a3a','#c9a227','#0d1208']},
 {media:'', id:'blondie',t:"BLONDIE",            y:'2025', k:'ANIMATED SHORT · HORROR COMEDY', d:'An animated short with a grin far too wide for its face.', s:'IN POST-PRODUCTION', sc:'post', size:'std', c:['#ff4fa0','#ff9d4f','#2a0a1e']},
 {media:'', id:'danny', t:"DANNY LEARNS GERMAN", y:'2026', k:'SHORT FILM · HORROR COMEDY', d:'Language tapes. A small room. Something learning back.', s:'IN EARLY DEVELOPMENT', sc:'dev', size:'std', c:['#a24bff','#ff2bd0','#12042a']},
 {media:'', id:'horn',  t:"THE HORN",            y:'2026', k:'SHORT FILM · HORROR COMEDY', d:'It only sounds once. Everybody hears it differently.', s:'IN EARLY DEVELOPMENT', sc:'dev', size:'std', c:['#2ee6c0','#2b8fff','#03161c']},
 {media:'', id:'reel',  t:"TV COMMERCIAL REEL",  y:'2025', k:'COMMERCIALS · REEL', d:'A reel of the odd, loud and beautiful work we make for brands.', s:'PLAY REEL', sc:'post', size:'wide', c:['#38f0ff','#ff1f6f','#05060f']}
];
const WHATIFS=[
 "What if this email starts something?",
 "What if the dog was the protagonist all along?",
 "What if we shot the whole thing on one lens?",
 "What if the monster is just very tired?",
 "What if the game had no fail state?",
 "What if the short film is actually a feature?",
 "What if we said yes to the strange idea?",
 "What if you told us your deepest secret?"
];
const VFXCAPS=[['CONCEPT & PREVIS',92],['CG / SIMULATION',78],['COMPOSITING & GRADE',96],['REALTIME / ENGINE',71],['TITLES & FINISHING',88]];
const REALITIES={
  v1:{n:'ONKI OS 98',    sub:'REALITY 01 — SKEUOMORPHIC',  prof:'chip', num:'01'},
  v2:{n:'ONKI∴NULL',     sub:'REALITY 02 — CINEMATIC VOID', prof:'noir', num:'02'},
  v3:{n:'DREAMCORE 2001',sub:'REALITY 03 — Y2K AQUA',       prof:'y2k',  num:'03'}
};

/* ============================================================
   FULLSCREEN POST-PROCESSING (WebGL over the DOM)
   ============================================================ */
const FX=(()=>{
 let gl,prog,U={},raf,t0=performance.now(),cv,ok=false;
 let mode=0, glitch=0, warp=0, dpr=1;
 const VS=`attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
 const FSRC=`precision highp float;varying vec2 v;uniform vec2 R;uniform float T,MODE,GL,EN;
 float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 void main(){
  vec2 uv=v; vec2 c=uv-.5; float asp=R.x/R.y; c.x*=asp;
  float r=length(c); vec3 col=vec3(.5);
  float sc=0.,gr=(h(uv*R.xy+T*60.)-.5);
  if(MODE<0.5){
    /* ---- CRT aperture grille ---- */
    float line=sin(uv.y*R.y*2.0944 - T*3.2);
    sc = line*0.5;
    float grille = sin(uv.x*R.x*2.0944)*0.26;
    float roll = smoothstep(.0,.06,fract(uv.y*.5 - T*.09))*smoothstep(.14,.06,fract(uv.y*.5 - T*.09));
    float flick = (sin(T*38.)*.5+.5)*.022;
    col = vec3(.5) + sc*.085 + grille*.045 + roll*.10 + flick;
    col.r += .008; col.b += .011;
    col -= smoothstep(.42,.92,r)*.20;
    col += gr*.055;
  } else if(MODE<1.5){
    /* ---- anamorphic film ---- */
    float g = n2(uv*R.xy*.55 + T*90.);
    float grain = (g-.5)*.075;
    float hal = exp(-r*2.3)*.10;
    float streak = exp(-abs(c.y)*46.)*exp(-abs(c.x)*1.1)*.09;
    float sl = sin(uv.y*R.y*1.0472 - T*1.2)*.009;
    float weave = sin(T*.7)*.004;
    col = vec3(.5) + grain + hal + streak + sl + weave;
    col.r += streak*.7; col.b += hal*.5;
    col -= smoothstep(.36,1.0,r)*.30;
  } else {
    /* ---- prism gloss ---- */
    float a=atan(c.y,c.x), k=6.0;
    float kal=abs(fract(a/(6.28318/k))*2.-1.);
    float rings=sin(r*26.-T*1.6)*.5+.5;
    float caust=n2(uv*7.+vec2(T*.22,-T*.16));
    float caust2=n2(uv*13.-vec2(T*.15,T*.2));
    float sh=pow(max(0.,caust*caust2),.7);
    vec3 rain=vec3(sin(a*3.+T*.6+r*8.),sin(a*3.+2.1+T*.6+r*8.),sin(a*3.+4.2+T*.6+r*8.))*.5+.5;
    col = vec3(.5) + (sh-.28)*.16 + (rings-.5)*.028*kal + (rain-.5)*.07*smoothstep(.15,.75,r);
    col += exp(-r*3.2)*.10;
    col -= smoothstep(.55,1.05,r)*.13;
    col += gr*.03;
  }
  /* ---- glitch bands (all modes) ---- */
  if(GL>0.001){
    float band=step(1.-GL*.55, h(vec2(floor(uv.y*46.), floor(T*11.))));
    float tear=(h(vec2(floor(uv.y*160.),floor(T*22.)))-.5)*GL;
    col += band*vec3(.15,-.045,.17)*GL;
    col += tear*.12;
    float rgb=step(.5,h(vec2(floor(T*17.),3.)))*GL;
    col.r+=rgb*.06; col.b-=rgb*.05;
  }
  col=mix(vec3(.5),col,EN);
  gl_FragColor=vec4(col,1.);
 }`;
 function sh(t,s){const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o}
 function init(){
  cv=$('#fx'); if(!cv) return false;
  gl=cv.getContext('webgl',{alpha:true,antialias:false,depth:false,premultipliedAlpha:false});
  if(!gl){cv.style.display='none';return false}
  prog=gl.createProgram(); gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS)); gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FSRC)); gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){cv.style.display='none';return false}
  gl.useProgram(prog);
  const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const p=gl.getAttribLocation(prog,'p'); gl.enableVertexAttribArray(p); gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
  ['R','T','MODE','GL','EN'].forEach(k=>U[k]=gl.getUniformLocation(prog,k));
  resize(); addEventListener('resize',resize,{passive:true}); ok=true; loop(); return true;
 }
 function resize(){ if(!gl)return;
  cv.width=Math.max(2,Math.floor(innerWidth)); cv.height=Math.max(2,Math.floor(innerHeight));
  gl.viewport(0,0,cv.width,cv.height); }
 function loop(){ raf=requestAnimationFrame(loop); if(!ok)return;
  const t=(performance.now()-t0)/1000;
  glitch=Math.max(0,glitch-0.055);
  gl.uniform2f(U.R,cv.width,cv.height); gl.uniform1f(U.T,t); gl.uniform1f(U.MODE,mode);
  gl.uniform1f(U.GL,glitch); gl.uniform1f(U.EN,1.0);
  gl.drawArrays(gl.TRIANGLES,0,3); }
 return {init,set:m=>{mode=m},burst:(a=1)=>{glitch=Math.min(1.0,glitch+a*.7)},level:()=>glitch};
})();

/* ============================================================
   CURSOR
   ============================================================ */
const Cursor=(()=>{
 let el,dot,ring,tag,x=innerWidth/2,y=innerHeight/2,tx=x,ty=y,mode='dot',on=false;
 const eyes=[];
 function init(){
  el=$('#cursor'); if(!el)return;
  if(!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  document.body.classList.add('cur-on'); on=true;
  tag=$('.cur-tag',el);
  addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY;},{passive:true});
  addEventListener('pointerdown',e=>{el.classList.add('press');ripple(e.clientX,e.clientY)});
  addEventListener('pointerup',()=>el.classList.remove('press'));
  document.addEventListener('pointerover',e=>{
    const t=e.target.closest('[data-cur],a,button,.pcard,.tile,.v2-row,.win-bar,input');
    if(!t){setMode('dot');el.dataset.tag='0';return}
    const m=t.getAttribute&&t.getAttribute('data-cur');
    if(m){setMode(m)} else if(t.matches('.pcard,.tile,.v2-row')){setMode('eyes')} else {setMode('hover')}
    const lbl=t.getAttribute&&t.getAttribute('data-tag');
    if(lbl){tag.textContent=lbl;el.dataset.tag='1'} else el.dataset.tag='0';
  });
  $$('.rl-eye i').forEach(e=>eyes.push(e));
  frame();
 }
 function setMode(m){ if(m===mode)return; mode=m; el.dataset.mode=m;
  if(m==='hover'){ring.style.width='46px';ring.style.height='46px'} else if(ring){ring.style.width='';ring.style.height=''} }
 function frame(){
  x=lerp(x,tx,.32); y=lerp(y,ty,.32);
  if(el){ el.style.setProperty('--cursor-x',x+'px'); el.style.setProperty('--cursor-y',y+'px'); }
  // relocator eyes track pointer
  eyes.forEach((e,i)=>{
   const r=e.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
   const a=Math.atan2(ty-cy,tx-cx), d=Math.min(3.2,Math.hypot(tx-cx,ty-cy)/40);
   e.style.setProperty('--ex',(Math.cos(a)*d).toFixed(2)+'px');
   e.style.setProperty('--ey',(Math.sin(a)*d).toFixed(2)+'px');
  });
  // svg eyes cursor pupils
  if(mode==='eyes'&&el){ const p=$$('.cur-eyes .pup, .cur-eyes .iris',el);
   const dx=clamp((tx-x)*.5,-5,5), dy=clamp((ty-y)*.5,-4,4);
   p.forEach(n=>n.setAttribute('transform',`translate(${dx.toFixed(1)},${dy.toFixed(1)})`)); }
  requestAnimationFrame(frame);
 }
 function ripple(cx,cy){
  const c=$('#clicks'); if(!c)return;
  const d=document.createElement('div'); d.className='ripple'; d.style.left=cx+'px'; d.style.top=cy+'px';
  c.appendChild(d); setTimeout(()=>d.remove(),640);
  if(document.body.classList.contains('v3')) sparkle(cx,cy);
 }
 function sparkle(cx,cy){
  const s=$('#sparks'); if(!s)return;
  const ch=['✦','✧','★','+','·'];
  for(let i=0;i<5;i++){
   const e=document.createElement('span'); e.className='spark'; e.textContent=ch[(Math.random()*ch.length)|0];
   e.style.left=cx+'px'; e.style.top=cy+'px';
   e.style.setProperty('--dx',((Math.random()-.5)*90).toFixed(0)+'px');
   e.style.setProperty('--dy',((Math.random()-.9)*90).toFixed(0)+'px');
   e.style.color=['#fff','#ffd9ef','#9ad5ff','#c8ff2e'][(Math.random()*4)|0];
   s.appendChild(e); setTimeout(()=>e.remove(),820);
  }
 }
 return {init,setMode,ripple:(a,b)=>ripple(a,b),get ring(){return ring},
   _bind(){dot=$('.cur-dot');ring=$('.cur-ring')}};
})();

/* ============================================================
   REALITY ROUTER + TRANSITION
   ============================================================ */
const Router=(()=>{
 let cur=null, busy=false;
 function paintMini(){
  const t=$('#reloc-panel'); if(!t)return;
  $$('.rl-item').forEach(b=>b.classList.toggle('cur',b.dataset.go===cur));
 }
 function go(id,instant){
  if(busy||id===cur||!REALITIES[id])return;
  const first=!cur;
  if(instant||first){ apply(id); return }
  busy=true; transition(id,()=>{ apply(id); setTimeout(()=>busy=false,260) });
 }
 function apply(id){
  const R=REALITIES[id];
  $$('.world').forEach(w=>w.classList.toggle('active',w.id===id));
  document.body.classList.remove('v1','v2','v3'); document.body.classList.add(id);
  document.documentElement.dataset.v=id;
  cur=id; paintMini();
  const n=$('.rl-num'); if(n)n.textContent=R.num;
  FX.set(id==='v1'?0:id==='v2'?1:2); FX.burst(.8);
  if(typeof ONKI_FM!=='undefined') ONKI_FM.setProfile(R.prof);
  if(window.__onkiWorldEnter) window.__onkiWorldEnter(id);
  document.dispatchEvent(new CustomEvent('onki:reality',{detail:{id}}));
 }
 /* --- canvas transition, unique per target --- */
 function transition(target,done){
  const wrap=$('#transition'), cv=$('#tcv'), lab=$('#tlabel');
  const R=REALITIES[target];
  $('b',lab).textContent=R.n; $('i',lab).textContent=R.sub;
  const c=cv.getContext('2d'); let w=cv.width=innerWidth, h=cv.height=innerHeight;
  wrap.classList.add('on'); FX.burst(1.0);
  const kind = target==='v1'?'tv' : target==='v2'?'gate' : 'bubble';
  const start=performance.now(), DUR=1080; let swapped=false;
  (function step(now){
   const p=clamp((now-start)/DUR,0,1);
   c.clearRect(0,0,w,h);
   if(kind==='tv'){
    // channel change: static burst, then horizontal collapse to a line
    const s=p<.5?p/.5:1-(p-.5)/.5;
    const img=c.createImageData(Math.ceil(w/4),Math.ceil(h/4));
    for(let i=0;i<img.data.length;i+=4){const v=Math.random()*255;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=200*s}
    c.putImageData(img,0,0);
    c.save(); c.imageSmoothingEnabled=false; c.drawImage(cv,0,0,Math.ceil(w/4),Math.ceil(h/4),0,0,w,h); c.restore();
    const col=p<.5?p/.5:1; const hh=(1-col)*h;
    c.fillStyle='#000'; c.fillRect(0,0,w,(h-hh)/2); c.fillRect(0,h-(h-hh)/2,w,(h-hh)/2);
    if(p>.46&&p<.58){c.fillStyle='#fff';c.fillRect(0,h/2-1.5,w,3)}
   } else if(kind==='gate'){
    // film gate: black wipe + rgb tear + flash
    const e=p<.5?easeIO(p/.5):1-easeIO((p-.5)/.5);
    c.fillStyle='#040406'; c.globalAlpha=Math.min(1,e*1.5); c.fillRect(0,0,w,h); c.globalAlpha=1;
    for(let i=0;i<26;i++){
     const y=Math.random()*h, hh=Math.random()*8+1;
     c.fillStyle=['rgba(255,31,111,.5)','rgba(56,240,255,.45)','rgba(255,255,255,.35)'][i%3];
     c.fillRect((Math.random()-.5)*90,y,w,hh*e);
    }
    if(p>.44&&p<.56){c.fillStyle='rgba(255,255,255,'+(1-Math.abs(p-.5)/.06)*.7+')';c.fillRect(0,0,w,h)}
   } else {
    // bubble: expanding chrome circles + sparkle
    const e=easeIO(p);
    const R0=Math.hypot(w,h)*.62;
    c.save();
    const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.max(1,R0*(p<.5?e*2:1)));
    g.addColorStop(0,'rgba(255,255,255,.96)');g.addColorStop(.45,'rgba(154,213,255,.85)');g.addColorStop(.75,'rgba(255,176,230,.7)');g.addColorStop(1,'rgba(120,190,255,0)');
    c.globalAlpha=p<.5?e*2:Math.max(0,2-e*2); c.fillStyle=g; c.fillRect(0,0,w,h); c.restore();
    for(let i=0;i<16;i++){
     const a=(i/16)*6.283+p*3, rr=R0*e*(.3+((i*37)%10)/12);
     c.beginPath(); c.arc(w/2+Math.cos(a)*rr,h/2+Math.sin(a)*rr,10+((i*13)%18)*(1-Math.abs(p-.5)*2),0,6.283);
     c.strokeStyle='rgba(255,255,255,'+(1-Math.abs(p-.5)*2)*.75+')'; c.lineWidth=2; c.stroke();
    }
   }
   if(p>=.5&&!swapped){swapped=true;done()}
   if(p<1) requestAnimationFrame(step);
   else{ wrap.classList.remove('on'); c.clearRect(0,0,w,h); }
  })(start);
 }
 function easeIO(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
 return {go,current:()=>cur};
})();

/* ============================================================
   CLOCKS
   ============================================================ */
function startClocks(){
 const MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
 let f=0;
 (function tick(){
  const d=new Date();
  const hh=String(d.getHours()).padStart(2,'0'), mm=String(d.getMinutes()).padStart(2,'0'), ss=String(d.getSeconds()).padStart(2,'0');
  const set=(s,v)=>{const e=$(s); if(e)e.textContent=v};
  set('#v1-clock',`${hh}:${mm}:${ss}`);
  set('#v1-date',`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`);
  set('#reloc-clock',`${hh}:${mm}:${ss}`);
  set('#v2-clock',`${hh}:${mm}`);
  set('#v2-tc',`${hh}:${mm}:${ss}:${String(f).padStart(2,'0')}`);
  set('#v3-clock2',`${hh}:${mm}:${ss}`);
  set('#v3-date2',`${String(d.getDate()).padStart(2,'0')} ${MON[d.getMonth()]} ${d.getFullYear()}`);
  f=(f+3)%24;
  requestAnimationFrame(tick);
 })();
 // fake visitor counter, stable per session
 const hits=$('#v3-hits');
 if(hits){ let n=+(ONKI_SS('onki_hits')||0)||(114000+((Date.now()/86400000|0)%900));
   ONKI_SS('onki_hits',n);
   setInterval(()=>{n+=Math.random()<.3?1:0;hits.textContent=String(n).padStart(6,'0')},2600);
   hits.textContent=String(n).padStart(6,'0'); }
}

/* ============================================================
   BOOT SEQUENCE
   ============================================================ */
const LINES=[
 'ONKI BIOS v2.5.1  ·  (c) ONKI INC.  ·  ORIGINAL FICTION SINCE 2025',
 'CPU: IMAGINATION @ <span class="hl">∞ MHz</span>   MEM: 640K OK ... 65536K OK',
 '',
 'Detecting devices .....................  <span class="hl">OK</span>',
 '  CRT APERTURE GRILLE .................  <span class="hl">OK</span>',
 '  3D BROADCAST UNIT ...................  <span class="hl">OK</span>',
 '  ONKI FM TUNER .......................  <span class="pk">READY</span>',
 '  MR. ONKI &amp; DOG ......................  <span class="hl">LOADED</span>',
 '  EYES ................................  <span class="pk">2 FOUND</span>',
 '',
 'Mounting realities:',
 '  [1] ONKI OS 98 ......................  <span class="hl">MOUNTED</span>',
 '  [2] ONKI∴NULL .......................  <span class="hl">MOUNTED</span>',
 '  [3] DREAMCORE 2001 ..................  <span class="hl">MOUNTED</span>',
 '',
 'Post-processing chain ................. <span class="pk">ENGAGED</span>',
 'Type a number to choose a reality, or wait. _'
];
function boot(){
 const post=$('#boot-post'), main=$('#boot-main'), pick=$('#boot-pick'),
       fill=$('#boot-fill'), pct=$('#boot-pct'), status=$('#boot-status');
 let i=0, txt='';
 const STEPS=['MOUNTING REALITIES…','COMPILING SHADERS…','TUNING ONKI FM…','WAKING MR. ONKI…','READY — SELECT A REALITY'];
 const iv=setInterval(()=>{
  txt+=(LINES[i]||'')+'\n'; post.innerHTML=txt; i++;
  const p=Math.round(i/LINES.length*100);
  fill.style.width=p+'%'; pct.textContent=p+'%';
  status.textContent=STEPS[Math.min(STEPS.length-1,Math.floor(i/LINES.length*STEPS.length))];
  if(i>=LINES.length){ clearInterval(iv); reveal() }
 },78);
 function reveal(){
  setTimeout(()=>{ post.classList.add('off'); main.classList.add('on');
    setTimeout(()=>pick.classList.add('on'),260); },320);
  // "…or wait." — auto-boot if nobody chooses
  let left=12; const s=$('#boot-status');
  const cd=setInterval(()=>{ if(entered){clearInterval(cd);return}
   left--; s.textContent=left>0?`READY — SELECT A REALITY  ·  AUTO-BOOT IN ${left}s`:'BOOTING…';
   if(left<=0){ clearInterval(cd); enter('v1') } },1000);
 }
 $$('.pick').forEach(b=>b.addEventListener('click',()=>enter(b.dataset.boot)));
 $('#boot-skip').addEventListener('click',()=>enter('v1'));
}
let entered=false;
function enter(id){
 if(entered)return; entered=true;
 const b=$('#boot');
 Router.go(id,true);
 FX.burst(1.4);
 b.classList.add('gone');
 document.body.classList.add('booted');
 // the pick is a real user gesture — start the station
 try{ if(typeof ONKI_FM!=='undefined') ONKI_FM.play() }catch(e){}
 setTimeout(()=>b.remove(),950);
 setTimeout(()=>{ const h=$('#hud-help'); if(h)setTimeout(()=>h.classList.add('hide'),7000) },1200);
 if(window.__ONKITOUR){ const seq=window.__ONKISEQ||['v3','v2','v1']; let i=0;
   setInterval(()=>{ Router.go(seq[i%seq.length]); i++ }, window.__ONKITOURMS||9000); }
 if(window.__ONKISECTOUR){ let k=0;
   setInterval(()=>{ k++; const c=Router.current();
     if(c==='v2'){ const s2=$('#v2-scroll'),ss=$$('.v2-sec',s2); const t=ss[k%ss.length]; if(t)s2.scrollTo({top:t.offsetTop,behavior:'smooth'}) }
     if(c==='v3'){ const s3=$('#v3-scroll'),ss=$$('.v3-sec',s3); const t=ss[k%ss.length]; if(t)s3.scrollTo({top:t.offsetTop,behavior:'smooth'}) }
   }, window.__ONKISECMS||4000); }
}

/* ============================================================
   GLOBAL WIRING
   ============================================================ */
function wire(){
 // relocator
 const rl=$('#relocator');
 $('#reloc-toggle').addEventListener('click',()=>rl.dataset.open=rl.dataset.open==='1'?'0':'1');
 $$('.rl-item').forEach(b=>b.addEventListener('click',()=>{rl.dataset.open='0';Router.go(b.dataset.go)}));
 document.addEventListener('click',e=>{ if(!e.target.closest('#relocator')) rl.dataset.open='0' });
 // global data-go
 document.addEventListener('click',e=>{ const g=e.target.closest('[data-go]'); if(g&&!g.classList.contains('rl-item')) Router.go(g.dataset.go) });
 // keys
 addEventListener('keydown',e=>{
  if(e.target.matches('input,textarea'))return;
  const k=e.key.toLowerCase();
  if(!entered){ if(k==='1')enter('v1'); if(k==='2')enter('v2'); if(k==='3')enter('v3'); if(k==='enter')enter('v1'); return }
  if(k==='1')Router.go('v1'); else if(k==='2')Router.go('v2'); else if(k==='3')Router.go('v3');
  else if(k==='m'){ if(typeof ONKI_FM!=='undefined'){ONKI_FM.toggle()} }
  else if(k==='g'){ FX.burst(1.3); glitchDom(520) }
  else if(k==='escape'){ document.dispatchEvent(new CustomEvent('onki:esc')) }
 });
 // ambient glitch
 setInterval(()=>{ if(Math.random()<.09){ FX.burst(.35+Math.random()*.35); if(Math.random()<.3)glitchDom(220) } },7400);
}
let gT=null;
function glitchDom(ms){
 const w=$('.world.active'); if(!w)return;
 const d=$('#f-disp'); if(d)d.setAttribute('scale',String(6+Math.random()*16));
 w.classList.add('fx-chroma'); clearTimeout(gT);
 gT=setTimeout(()=>{ w.classList.remove('fx-chroma'); if(d)d.setAttribute('scale','0') },ms);
}

/* ---------- expose ---------- */
return {$,$$,clamp,lerp,PROJECTS,WHATIFS,VFXCAPS,REALITIES,FX,Cursor,Router,boot,wire,startClocks,glitchDom,enter};
})();
