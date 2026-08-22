/* ============================================================
   ONKI — WORLDS : v1 desktop · v2 void · v3 dreamcore
   ============================================================ */
(() => {
const {$,$$,clamp,lerp,PROJECTS,WHATIFS,VFXCAPS,FX,Router,glitchDom}=ONKI;
/* real media, if a project has any */
const isVid=u=>/\.(mp4|webm|mov|m4v)(\?|$)/i.test(u||'');
const mediaTag=p=>!p.media?'':(isVid(p.media)
 ? `<video class="media" src="${p.media}" autoplay muted loop playsinline preload="metadata"></video>`
 : `<img class="media" src="${p.media}" alt="${p.t}" loading="lazy">`);
const games={};

/* ============================================================
   REALITY 01 — ONKI OS 98
   ============================================================ */
const V1=(()=>{
 let zTop=20, order=[];
 const wins=()=>$$('#v1-wins .win');
 const winOf=n=>$(`#v1-wins .win[data-w="${n}"]`);

 function grid(){
  const g=$('#v1-grid'); if(!g)return;
  g.innerHTML=PROJECTS.map((p,i)=>`
   <button class="pcard" data-size="${p.size==='wide'?'wide':'std'}" data-p="${p.id}" data-tag="${p.s}" style="--pc:${i%2?'#1a2be0':'#ff1f6f'}">
     <span class="pcard-bar">${p.t}<em>${p.y}</em></span>
     <span class="thumb${p.media?' has-media':''}" style="--c1:${p.c[0]};--c2:${p.c[1]};--c3:${p.c[2]}">
       ${mediaTag(p)}<i class="fld"></i><i class="sil"></i><i class="rl"></i><i class="sc"></i><i class="gr"></i>
       <em class="tc">00:0${i}:1${i}:0${i}</em><em class="slot">[ MEDIA SLOT ]</em>
     </span>
     <span class="pcard-meta"><h3>${p.t}</h3><p>${p.k}</p><span class="st ${p.sc}">${p.s}</span></span>
   </button>`).join('');
  g.addEventListener('click',e=>{const c=e.target.closest('.pcard'); if(c){FX.burst(.7);glitchDom(230)}});
 }

 /* ---- window manager ---- */
 function focus(w){ w.style.setProperty('--z',++zTop); wins().forEach(x=>x.classList.toggle('blur',x!==w)); tasks(); }
 function open(n){
  const w=winOf(n); if(!w)return;
  w.classList.add('open'); w.classList.remove('mini'); focus(w);
  if(!order.includes(n))order.push(n); tasks();
  if(n==='tv'&&window.__onkiTV)window.__onkiTV();
  if(n==='game'&&window.__onkiGB)window.__onkiGB();
 }
 function close(n){ const w=winOf(n); if(!w)return; w.classList.remove('open'); order=order.filter(o=>o!==n); tasks(); }
 function tasks(){
  const bar=$('#v1-tasks'); if(!bar)return;
  bar.innerHTML=order.map(n=>{const w=winOf(n);if(!w)return'';
   const t=$('.win-bar b',w).textContent;
   return `<button data-task="${n}" class="${w.classList.contains('mini')?'':'on'}">${t}</button>`}).join('');
 }
 function drag(w){
  const bar=$('.win-bar',w); let sx,sy,ox,oy,on=false;
  bar.addEventListener('pointerdown',e=>{
   if(e.target.closest('button'))return;
   on=true; w.classList.add('drag'); bar.setPointerCapture(e.pointerId);
   sx=e.clientX; sy=e.clientY; ox=parseFloat(w.style.getPropertyValue('--x'))||w.offsetLeft; oy=parseFloat(w.style.getPropertyValue('--y'))||w.offsetTop;
   focus(w);
  });
  bar.addEventListener('pointermove',e=>{ if(!on)return;
   const p=w.parentElement.getBoundingClientRect();
   w.dataset.moved='1';
   w.style.setProperty('--x',clamp(ox+e.clientX-sx,-40,p.width-70)+'px');
   w.style.setProperty('--y',clamp(oy+e.clientY-sy,0,p.height-30)+'px'); });
  const end=()=>{on=false;w.classList.remove('drag')};
  bar.addEventListener('pointerup',end); bar.addEventListener('pointercancel',end);
  const grip=$('.win-grip',w);
  if(grip){ let gw,gh,gon=false;
   grip.addEventListener('pointerdown',e=>{gon=true;grip.setPointerCapture(e.pointerId);sx=e.clientX;sy=e.clientY;gw=w.offsetWidth;gh=w.offsetHeight;focus(w);e.stopPropagation()});
   grip.addEventListener('pointermove',e=>{ if(!gon)return;
    w.dataset.moved='1';
    w.style.setProperty('--w',Math.max(240,gw+e.clientX-sx)+'px');
    w.style.setProperty('--h',Math.max(150,gh+e.clientY-sy)+'px');
    window.dispatchEvent(new Event('resize')); });
   grip.addEventListener('pointerup',()=>gon=false);
  }
 }

 /* responsive tiling for windows the user hasn't moved yet */
 function layout(){
  const host=$('#v1-wins'); if(!host)return;
  const W=host.clientWidth||innerWidth, H=host.clientHeight||(innerHeight-40);
  const set=(n,x,y,w,h)=>{ const el=winOf(n); if(!el||el.dataset.moved)return;
   w=Math.min(w,W-16); h=Math.min(h,H-16);
   el.style.setProperty('--w',Math.round(w)+'px'); el.style.setProperty('--h',Math.round(h)+'px');
   el.style.setProperty('--x',Math.round(clamp(x,6,Math.max(6,W-w-6)))+'px');
   el.style.setProperty('--y',Math.round(clamp(y,4,Math.max(4,H-h-6)))+'px'); };
  if(W<860){
   set('about',10,10,W-20,Math.min(268,H*.36));
   set('tv',18,H*.30,W-36,Math.min(280,H*.36));
   set('film',10,H*.13,W-20,H*.80);
   set('game',10,H*.05,W-20,H*.90);
   set('vfx',16,H*.32,W-32,290);
   set('what',12,H*.46,W-24,236);
   set('contact',12,H*.18,W-24,Math.min(380,H*.62));
   set('fm',12,H-330,Math.min(330,W-24),318);
  }else{
   set('about',112,44,398,300);
   set('tv',524,44,452,392);
   set('film',112,446,Math.min(720,W-430),Math.min(408,H-458));
   set('fm',W-372,Math.max(60,H-402),348,352);
   set('game',Math.min(150,W-780),40,Math.min(760,W-40),Math.min(840,H-30));
   set('vfx',Math.min(600,W-440),Math.min(470,H-330),400,300);
   set('what',210,Math.min(556,H-268),404,244);
   set('contact',Math.min(330,W-640),140,600,400);
  }
 }
 let rz;
 addEventListener('resize',()=>{ clearTimeout(rz); rz=setTimeout(layout,180) },{passive:true});

 function init(){
  grid();
  wins().forEach(w=>{ drag(w); w.addEventListener('pointerdown',()=>focus(w)); });
  layout();
  const boot1=window.__ONKIOPENALL?['about','tv','film','vfx','what','contact','game','fm']:['about','tv','film','fm'];
  boot1.forEach((n,i)=>setTimeout(()=>open(n),160+i*130));
  document.addEventListener('click',e=>{
   const o=e.target.closest('#v1 [data-open]'); if(o){ open(o.dataset.open); return }
   const a=e.target.closest('#v1 [data-act]'); if(a){ act(a); return }
   const t=e.target.closest('[data-task]'); if(t){ const w=winOf(t.dataset.task);
     if(w.classList.contains('mini')||w.classList.contains('blur')){w.classList.remove('mini');focus(w)} else {w.classList.add('mini');tasks()} return }
  });
  function act(a){
   const w=a.closest('.win'), n=w&&w.dataset.w, k=a.dataset.act;
   if(k==='close'&&n)close(n);
   else if(k==='min'&&n){w.classList.add('mini');tasks()}
   else if(k==='max'&&n){w.classList.toggle('max');window.dispatchEvent(new Event('resize'))}
   else if(k==='invert'){ $('#v1').style.filter=$('#v1').style.filter?'':'invert(1) hue-rotate(180deg)'; FX.burst(.9) }
   else if(k==='shuffle'){ const g=$('#v1-grid'); [...g.children].sort(()=>Math.random()-.5).forEach(c=>g.appendChild(c)); FX.burst(.7); glitchDom(240) }
   else if(k==='clone'){ FX.burst(1.1); glitchDom(400);
     const q=$('.dlg .t-body'); if(q)q.textContent=WHATIFS[(Math.random()*WHATIFS.length)|0] }
   else if(k==='shutdown'){ shutdown() }
  }
  // start menu
  const sm=$('#v1-startmenu'), sb=$('#v1-start');
  sb.addEventListener('click',e=>{e.stopPropagation();sm.classList.toggle('on');sb.classList.toggle('on')});
  document.addEventListener('click',()=>{sm.classList.remove('on');sb.classList.remove('on')});
  $$('#v1-startmenu button').forEach(b=>b.addEventListener('click',()=>{sm.classList.remove('on');sb.classList.remove('on')}));
  // tray speaker
  $('#v1-tray-spk').addEventListener('click',()=>{
   const w=winOf('fm');
   if(!w.classList.contains('open')||w.classList.contains('mini')){open('fm'); if(typeof ONKI_FM!=='undefined'){ONKI_FM.mute(false);ONKI_FM.play()}}
   else if(typeof ONKI_FM!=='undefined'){ONKI_FM.mute()}
  });
  // tv channel
  let ch=0; const CH=['SHOWREEL','THE OTTER','BLONDIE','COMMERCIALS','STATIC'];
  $$('#v1 [data-tvch]').forEach(b=>b.addEventListener('click',()=>{
   ch=(ch + +b.dataset.tvch + CH.length)%CH.length;
   $('#v1-tv-label').textContent='CH '+String(ch+1).padStart(2,'0')+' — '+CH[ch];
   if(window.__onkiTVch)window.__onkiTVch(ch); FX.burst(.9); glitchDom(180);
  }));
  const sp=$('#v1 [data-tvspin]'); if(sp)sp.addEventListener('click',()=>{if(window.__onkiTVspin)window.__onkiTVspin()});
  const gsp=$('#v1 [data-gbspin]'); if(gsp)gsp.addEventListener('click',()=>{if(window.__onkiGBspin)window.__onkiGBspin()});
  mountGame('v1-game','gb');
  player1();
  trayEq();
 }
 function shutdown(){
  const v=$('#v1'); v.classList.add('bsod'); FX.burst(1.6);
  const off=e=>{ v.classList.remove('bsod'); removeEventListener('keydown',off); removeEventListener('click',off) };
  setTimeout(()=>{ addEventListener('keydown',off); addEventListener('click',off) },400);
 }
 function trayEq(){
  const bars=$$('#v1-tray-eq i'); if(!bars.length)return;
  (function f(){ const s=typeof ONKI_FM!=='undefined'&&ONKI_FM.spectrum();
   bars.forEach((b,i)=>{ const v=s?s[4+i*6]/255:0; b.style.height=(2+v*12).toFixed(1)+'px';
    b.style.background=v>.7?'#ff1f6f':v>.4?'#ffd23a':'#0a8a2a' });
   requestAnimationFrame(f) })();
 }
 /* ---- PLAYER 01 ---- */
 function player1(){
  if(typeof ONKI_FM==='undefined')return;
  const list=$('#fm1-list'), vis=$('#fm1-vis');
  list.innerHTML=ONKI_FM.tracks.map((t,i)=>`<div class="fm1-row" data-i="${i}"><i>${String(i+1).padStart(2,'0')}</i><b>${t.by} — ${t.n}</b><em>${ONKI_FM.fmt(t.dur)}</em></div>`).join('');
  list.addEventListener('click',e=>{const r=e.target.closest('.fm1-row'); if(r)ONKI_FM.select(+r.dataset.i)});
  $$('#v1 [data-fm]').forEach(b=>b.addEventListener('click',()=>{
   const a=b.dataset.fm;
   if(a==='play')ONKI_FM.play(); else if(a==='pause')ONKI_FM.pause();
   else if(a==='stop')ONKI_FM.stop(); else if(a==='next'){ONKI_FM.next();ONKI_FM.play()}
   else if(a==='prev'){ONKI_FM.prev();ONKI_FM.play()}
  }));
  const seek=$('#fm1-seek'); let dragging=false;
  seek.addEventListener('input',()=>{dragging=true});
  seek.addEventListener('change',()=>{ONKI_FM.seek(seek.value/1000);dragging=false});
  $('#fm1-vol').addEventListener('input',e=>ONKI_FM.setVol(e.target.value/100));
  ONKI_FM.on(s=>{
   $('#fm1-title').textContent=`${s.track.by} — ${s.track.n}`;
   $('#fm1-time').textContent=ONKI_FM.fmt(s.pos);
   $('#fm1-dur').textContent=ONKI_FM.fmt(s.dur);
   $('#fm1-kbps').textContent=`${s.track.bpm} bpm · ${ONKI_FM.profileName()}`;
   if(!dragging)seek.value=Math.round(ONKI_FM.progress()*1000);
   $$('.fm1-row',list).forEach(r=>r.classList.toggle('on',+r.dataset.i===s.index));
   document.body.classList.toggle('fm-off',s.muted||!s.playing);
  });
  // spectrum
  const c=vis.getContext('2d'); vis.width=148; vis.height=68;
  (function f(){ const s=ONKI_FM.spectrum();
   c.fillStyle='#04060e'; c.fillRect(0,0,148,68);
   if(s){ const N=18; for(let i=0;i<N;i++){ const v=s[2+i*4]/255, h=Math.max(1,v*62);
     for(let y=0;y<h;y+=4){ const t=y/62; c.fillStyle=t>.72?'#ff1f6f':t>.42?'#ffd23a':'#c8ff2e'; c.fillRect(i*8+1,66-y,6,3) } } }
   c.fillStyle='rgba(0,0,0,.35)'; for(let y=0;y<68;y+=3)c.fillRect(0,y,148,1);
   requestAnimationFrame(f) })();
 }
 return {init,open};
})();

/* ============================================================
   REALITY 02 — ONKI ∴ NULL
   ============================================================ */
const V2=(()=>{
 const LABELS=['HOME','ABOUT','FILM + TV','INTERACTIVE','VFX','WHAT IF?','CONTACT'];
 let secs=[], cur=0, sc;
 function init(){
  sc=$('#v2-scroll'); secs=$$('.v2-sec',sc);
  $('#v2-dots').innerHTML=LABELS.map((l,i)=>`<li data-i="${i}" data-l="${l}"></li>`).join('');
  $$('#v2-dots li').forEach(li=>li.addEventListener('click',()=>goSec(+li.dataset.i)));
  $$('#v2 [data-sec]').forEach(b=>b.addEventListener('click',()=>goSec(+b.dataset.sec)));
  $('[data-scrolldown]').addEventListener('click',()=>goSec(1));
  index(); bars(); whatif(); player2(); mountGame('v2-game','void'); logoCycle();
  sc.addEventListener('scroll',onScroll,{passive:true});
  $('#v2 [data-act=invert2]').addEventListener('click',()=>{$('#v2').classList.toggle('inv');FX.burst(1)});
  $('#v2 [data-act=shuffle2]').addEventListener('click',()=>{
   const g=$('#v2-index'); [...g.children].sort(()=>Math.random()-.5).forEach(c=>g.appendChild(c)); FX.burst(.8); glitchDom(260) });
  $('#v2-spk').addEventListener('click',()=>{ $('#fm2').dataset.open='1'; ONKI_FM.play() });
  onScroll();
 }
 function goSec(i){ const s=secs[i]; if(s)sc.scrollTo({top:s.offsetTop,behavior:'smooth'}) }
 function logoCycle(){
  const l=$('#v2 .v2-logo'); if(!l)return; let n=0;
  const step=()=>{ n=(n+1)%4; l.dataset.lg=n };
  setInterval(()=>{ if(Router.current()==='v2')step() },5200);
  l.addEventListener('pointerenter',step);
 }
 function onScroll(){
  const y=sc.scrollTop+innerHeight*.4;
  let n=0; secs.forEach((s,i)=>{ if(s.offsetTop<=y)n=i });
  if(n!==cur){ cur=n;
   $$('#v2-dots li').forEach((l,i)=>l.classList.toggle('on',i===cur));
   $$('#v2-nav button, .v2-nav button').forEach(b=>b.classList.toggle('cur',+b.dataset.sec===cur));
   if(cur===4)fillBars();
   if(window.__onkiV2Sec)window.__onkiV2Sec(cur);
  }
  if(window.__onkiV2Scroll)window.__onkiV2Scroll(sc.scrollTop/Math.max(1,sc.scrollHeight-sc.clientHeight));
 }
 function index(){
  const g=$('#v2-index'), pv=$('#v2-preview');
  g.innerHTML=PROJECTS.map(p=>`
   <button class="v2-row ${p.sc}" data-p="${p.id}">
     <span class="rt">${p.t}</span><span class="ry">${p.y}</span>
     <span class="rk">${p.k}</span><span class="rs">${p.s}</span>
   </button>`).join('');
  $$('.v2-row',g).forEach(r=>{
   const p=PROJECTS.find(x=>x.id===r.dataset.p);
   r.addEventListener('pointerenter',()=>{
    pv.classList.add('on');
    pv.style.setProperty('--c1',p.c[0]);pv.style.setProperty('--c2',p.c[1]);pv.style.setProperty('--c3',p.c[2]);
    pv.classList.toggle('has-media',!!p.media);
    let pm=$('.pv-media',pv);
    if(p.media){ if(!pm){pm=document.createElement(isVid(p.media)?'video':'img');pm.className='pv-media';
       if(isVid(p.media)){pm.autoplay=pm.muted=pm.loop=pm.playsInline=true} pv.prepend(pm)} pm.src=p.media }
    else if(pm) pm.remove();
    $('.pv-meta b',pv).textContent=p.t; $('.pv-meta em',pv).textContent=p.k;
   });
   r.addEventListener('pointerleave',()=>pv.classList.remove('on'));
   r.addEventListener('click',()=>{FX.burst(.8);glitchDom(240)});
  });
 }
 function bars(){
  $('#v2-bars').innerHTML=VFXCAPS.map(([n,v])=>`<div class="bar"><span>${n}</span><span class="tr"><i data-v="${v}"></i></span><span class="vl">${v}%</span></div>`).join('');
 }
 function fillBars(){ $$('#v2-bars .tr i').forEach((i,k)=>setTimeout(()=>i.style.right=(100-+i.dataset.v)+'%',k*110)) }
 function whatif(){
  const el=$('#v2-whatq'); let idx=0,timer;
  function type(s){
   clearInterval(timer); let i=0; el.innerHTML='';
   timer=setInterval(()=>{ i++; el.innerHTML=s.slice(0,i).replace(/\n/g,'<br>')+'<span class="cur"></span>';
    if(i>=s.length)clearInterval(timer) },26);
  }
  type(WHATIFS[0]);
  $('#v2-whatbtn').addEventListener('click',()=>{ idx=(idx+1)%WHATIFS.length; type(WHATIFS[idx]); FX.burst(.7) });
 }
 /* ---- PLAYER 02 ---- */
 function player2(){
  if(typeof ONKI_FM==='undefined')return;
  const box=$('#fm2'), wave=$('#fm2-wave'), list=$('#fm2-list');
  $('#fm2-tab').addEventListener('click',()=>{ box.dataset.open=box.dataset.open==='1'?'0':'1' });
  list.innerHTML=ONKI_FM.tracks.map((t,i)=>`<li data-i="${i}"><em>${String(i+1).padStart(2,'0')}</em><b>${t.n}</b><em>${t.by}</em><em>${ONKI_FM.fmt(t.dur)}</em></li>`).join('');
  list.addEventListener('click',e=>{const li=e.target.closest('li'); if(li){ONKI_FM.select(+li.dataset.i)}});
  $$('#fm2 [data-fm]').forEach(b=>b.addEventListener('click',()=>{
   const a=b.dataset.fm;
   if(a==='toggle')ONKI_FM.toggle(); else if(a==='next'){ONKI_FM.next();ONKI_FM.play()} else if(a==='prev'){ONKI_FM.prev();ONKI_FM.play()}
  }));
  $('#fm2-vol').addEventListener('input',e=>ONKI_FM.setVol(e.target.value/100));
  const scrub=$('#fm2-scrub');
  scrub.addEventListener('click',e=>{const r=scrub.getBoundingClientRect();ONKI_FM.seek((e.clientX-r.left)/r.width)});
  ONKI_FM.on(s=>{
   $('#fm2-title').textContent=s.track.n; $('#fm2-by').textContent=s.track.by;
   $('#fm2-tabtitle').textContent=s.track.n; $('#fm2-prof').textContent=ONKI_FM.profileName();
   $('#fm2-t').textContent=ONKI_FM.fmt(s.pos); $('#fm2-d').textContent=ONKI_FM.fmt(s.dur);
   const p=ONKI_FM.progress()*100; $('#fm2-fill').style.width=p+'%'; $('#fm2-head').style.left=p+'%';
   $('#fm2-toggle').textContent=s.playing?'❚❚':'▶';
   $$('#fm2-list li').forEach(l=>l.classList.toggle('on',+l.dataset.i===s.index));
  });
  const c=wave.getContext('2d'); let W=0,H=0;
  const eq=$$('.fm2-eq i');
  (function f(){
   const r=wave.getBoundingClientRect();
   if(r.width&&(W!==r.width|0)){W=r.width|0;H=46;wave.width=W*2;wave.height=H*2;c.scale(2,2)}
   if(W){ c.clearRect(0,0,W,H);
    const d=ONKI_FM.wave();
    c.beginPath();
    for(let i=0;i<W;i++){ const v=d?(d[(i/W*d.length)|0]-128)/128:0; const y=H/2+v*H*.44;
      i?c.lineTo(i,y):c.moveTo(i,y) }
    c.strokeStyle='rgba(255,255,255,.72)'; c.lineWidth=1; c.stroke();
    c.beginPath();
    for(let i=0;i<W;i++){ const v=d?(d[(i/W*d.length)|0]-128)/128:0; const y=H/2+v*H*.44;
      i?c.lineTo(i+2,y):c.moveTo(i+2,y) }
    c.strokeStyle='rgba(255,31,111,.5)'; c.stroke();
   }
   const s=ONKI_FM.spectrum();
   eq.forEach((b,i)=>b.style.height=(2+(s?s[3+i*7]/255:0)*11).toFixed(1)+'px');
   requestAnimationFrame(f) })();
 }
 return {init};
})();

/* ============================================================
   REALITY 03 — DREAMCORE 2001
   ============================================================ */
const V3=(()=>{
 let secs=[], sc;
 function init(){
  sc=$('#v3-scroll'); secs=$$('.v3-sec',sc);
  $$('#v3 [data-sec3]').forEach(b=>b.addEventListener('click',()=>{
   const s=secs[+b.dataset.sec3]; if(s)sc.scrollTo({top:s.offsetTop,behavior:'smooth'})}));
  tiles(); gauges(); whatif(); player3(); mountGame('v3-game','aqua');
  $('#v3 [data-act=invert3]').addEventListener('click',()=>{$('#v3').classList.toggle('inv');FX.burst(1)});
  $('#v3 [data-act=copy3]').addEventListener('click',e=>{
   try{navigator.clipboard&&navigator.clipboard.writeText('hello@onki.tv').catch(()=>{})}catch(_){}
   const b=e.target.closest('button'); const o=b.textContent; b.textContent='COPIED ✓'; setTimeout(()=>b.textContent=o,1500);
  });
  sc.addEventListener('scroll',()=>{ if(window.__onkiV3Scroll)window.__onkiV3Scroll(sc.scrollTop/Math.max(1,sc.scrollHeight-sc.clientHeight)) },{passive:true});
  const hi=$('#v3-hi'); if(hi)setInterval(()=>hi.textContent=String(+(ONKI_LS('onki_hi')||0)).padStart(5,'0'),900);
 }
 function tiles(){
  const g=$('#v3-grid'); if(!g)return;
  g.innerHTML=PROJECTS.map(p=>`
   <button class="tile" data-p="${p.id}">
    <span class="tile-thumb${p.media?' has-media':''}" style="--c1:${p.c[0]};--c2:${p.c[1]};--c3:${p.c[2]}">
      ${mediaTag(p)}<i class="fld"></i><i class="sc"></i><i class="gl"></i><i class="pl">▶</i><em class="slot">MEDIA SLOT</em>
    </span>
    <span class="tile-meta"><h3>${p.t}</h3><p>${p.k} · ${p.y}</p><span class="st ${p.sc}">${p.s}</span></span>
   </button>`).join('');
  g.addEventListener('click',e=>{const t=e.target.closest('.tile'); if(t){FX.burst(.8);ONKI.Cursor.ripple(innerWidth/2,innerHeight/2)}});
 }
 function gauges(){
  const g=$('#v3-gauges'); if(!g)return;
  g.innerHTML=VFXCAPS.map(([n,v])=>`<div class="gauge"><div class="dial" style="--p:0" data-t="${v}" data-v="0%"></div><b>${n}</b></div>`).join('');
  setTimeout(()=>$$('#v3-gauges .dial').forEach((d,i)=>{
   const target=+d.dataset.t; let v=0;
   const iv=setInterval(()=>{ v=Math.min(target,v+2); d.style.setProperty('--p',v); d.dataset.v=v+'%'; if(v>=target)clearInterval(iv) },14+i*4);
  }),700);
 }
 function whatif(){
  const el=$('#v3-whatq'); let i=0,timer;
  function type(s){ clearInterval(timer); let k=0; el.textContent='';
   timer=setInterval(()=>{k++;el.textContent=s.slice(0,k); if(k>=s.length)clearInterval(timer)},24) }
  $('#v3-whatbtn').addEventListener('click',()=>{ i=(i+1)%WHATIFS.length; type(WHATIFS[i]); FX.burst(.6) });
 }
 /* ---- PLAYER 03 ---- */
 function player3(){
  if(typeof ONKI_FM==='undefined')return;
  const box=$('#fm3'), list=$('#fm3-list'), leds=$('#fm3-leds');
  leds.innerHTML=Array.from({length:22},()=>'<i></i>').join('');
  const L=$$('i',leds);
  list.innerHTML=ONKI_FM.tracks.map((t,i)=>`<div class="fm3-row" data-i="${i}"><i>${i+1}</i><b>${t.n}</b><em>${ONKI_FM.fmt(t.dur)}</em></div>`).join('');
  list.addEventListener('click',e=>{const r=e.target.closest('.fm3-row'); if(r)ONKI_FM.select(+r.dataset.i)});
  $$('#fm3 [data-fm]').forEach(b=>b.addEventListener('click',()=>{
   const a=b.dataset.fm;
   if(a==='toggle')ONKI_FM.toggle(); else if(a==='next'){ONKI_FM.next();ONKI_FM.play()}
   else if(a==='prev'){ONKI_FM.prev();ONKI_FM.play()} else if(a==='stop')ONKI_FM.stop();
  }));
  $('#fm3-vol').addEventListener('input',e=>ONKI_FM.setVol(e.target.value/100));
  const scrub=$('#fm3-scrub');
  scrub.addEventListener('click',e=>{const r=scrub.getBoundingClientRect();ONKI_FM.seek((e.clientX-r.left)/r.width)});
  $('#fm3-close').addEventListener('click',()=>box.classList.add('hide'));
  $('#fm3-min').addEventListener('click',()=>box.classList.add('hide'));
  $('#fm3-mini').addEventListener('click',()=>{box.classList.remove('hide');ONKI_FM.play()});
  // drag
  const bar=$('#fm3-drag'); let on=false,sx,sy,ox,oy;
  bar.addEventListener('pointerdown',e=>{ if(e.target.closest('s'))return;
   on=true;bar.setPointerCapture(e.pointerId);sx=e.clientX;sy=e.clientY;
   const r=box.getBoundingClientRect();ox=r.left;oy=r.top;box.style.right='auto';box.style.bottom='auto';});
  bar.addEventListener('pointermove',e=>{ if(!on)return;
   box.style.left=clamp(ox+e.clientX-sx,0,innerWidth-120)+'px';
   box.style.top=clamp(oy+e.clientY-sy,0,innerHeight-60)+'px'});
  bar.addEventListener('pointerup',()=>on=false);
  ONKI_FM.on(s=>{
   $('#fm3-title').textContent=s.track.n; $('#fm3-by').textContent=s.track.by;
   $('#fm3-t').textContent=ONKI_FM.fmt(s.pos); $('#fm3-d').textContent=ONKI_FM.fmt(s.dur);
   $('#fm3-mode').textContent=(s.playing?'PLAY':'PAUSE')+' · '+ONKI_FM.profileName();
   const p=ONKI_FM.progress()*100; $('#fm3-fill').style.width=p+'%'; $('#fm3-head').style.left=p+'%';
   $('#fm3-toggle').textContent=s.playing?'❚❚':'▶';
   $$('.fm3-row',list).forEach(r=>r.classList.toggle('on',+r.dataset.i===s.index));
  });
  (function f(){ const s=ONKI_FM.spectrum();
   L.forEach((b,i)=>{ const v=s?s[1+i*3]/255:0; b.style.height=(2+v*12).toFixed(1)+'px';
    b.style.background=v>.72?'#ff6fbd':v>.42?'#e8c37a':'#7ef5a0' });
   requestAnimationFrame(f) })();
 }
 return {init};
})();

/* ============================================================
   GAME MOUNTING (shared engine, per-reality palette)
   ============================================================ */
function mountGame(id,pal){
 const cv=document.getElementById(id); if(!cv||typeof ONKI_GAME==='undefined')return;
 const g=ONKI_GAME.make(cv,{pal});
 games[id]=g; g.start();
 const shell=cv.closest('[data-shell]')||cv.closest('.v2-cab')||cv.parentElement;
 const root=cv.closest('.world');
 (root?$$('[data-gk]',root):[]).forEach(b=>{
  const k=b.dataset.gk;
  const down=e=>{ e.preventDefault();
   if(k==='a'||k==='up'||k==='start')g.jump();
   else if(k==='down')g.setDuck(true);
   else if(k==='b')g.jump(); };
  const up=()=>{ if(k==='down')g.setDuck(false) };
  b.addEventListener('pointerdown',down); b.addEventListener('pointerup',up); b.addEventListener('pointerleave',up);
 });
 cv.addEventListener('pointerdown',e=>{e.preventDefault();g.jump()});
 cv.setAttribute('tabindex','0');
}
function liveGame(){
 const id=Router.current(); const key=id==='v1'?'v1-game':id==='v2'?'v2-game':'v3-game';
 const g=games[key]; if(!g)return null;
 const r=g.el.getBoundingClientRect();
 if(r.width<10||r.bottom<40||r.top>innerHeight-40)return null;
 return g;
}
addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea'))return;
 const g=liveGame(); if(!g)return;
 if(e.key===' '||e.key==='ArrowUp'){ e.preventDefault(); g.jump() }
 if(e.key==='ArrowDown'){ e.preventDefault(); g.setDuck(true) }
});
addEventListener('keyup',e=>{ if(e.key==='ArrowDown'){ Object.values(games).forEach(g=>g.setDuck(false)) } });

/* ============================================================
   BOOT
   ============================================================ */
const safe=(n,fn)=>{ try{ fn() }catch(e){ console.warn('[onki '+n+']',e);
  if(location.search.indexOf('debug')>-1){ const d=document.createElement('pre');
   d.style.cssText='position:fixed;left:8px;top:8px;z-index:99999;color:#f66;background:#000c;font:11px monospace;padding:8px;max-width:60vw;white-space:pre-wrap';
   d.textContent=n+': '+(e&&e.message)+'\n'+(e&&e.stack||''); document.body.appendChild(d) } } };
function ready(){
 safe('cursor',()=>{ONKI.Cursor._bind();ONKI.Cursor.init()});
 safe('fx',()=>FX.init()); safe('wire',()=>ONKI.wire()); safe('clocks',()=>ONKI.startClocks());
 safe('v1',()=>V1.init()); safe('v2',()=>V2.init()); safe('v3',()=>V3.init());
 safe('boot',()=>ONKI.boot());
 // pause offscreen games
 window.__onkiWorldEnter=id=>{
  Object.entries(games).forEach(([k,g])=>{ if(k.startsWith(id))g.resume(); else g.pause() });
  const sc=$('#'+id+' .scroller'); if(sc&&id!=='v1')sc.scrollTop=sc.scrollTop;
 };
 document.addEventListener('onki:esc',()=>{
  const rl=$('#relocator'); if(rl)rl.dataset.open='0';
  $$('#v1 .win.open').forEach(w=>{ if(w.dataset.w!=='fm')w.classList.remove('open') });
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready); else ready();
})();
