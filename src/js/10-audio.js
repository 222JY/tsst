/* ============================================================
   ONKI — safe storage (sandboxed iframes throw on localStorage)
   ============================================================ */
function ONKI_LS(k,v){
  try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,String(v)); }
  catch(e){ ONKI_LS._m=ONKI_LS._m||{}; if(v===undefined) return ONKI_LS._m[k]??null; ONKI_LS._m[k]=String(v); }
  return null;
}
function ONKI_SS(k,v){
  try{ if(v===undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k,String(v)); }
  catch(e){ ONKI_SS._m=ONKI_SS._m||{}; if(v===undefined) return ONKI_SS._m[k]??null; ONKI_SS._m[k]=String(v); }
  return null;
}

/* ============================================================
   ONKI FM — procedural music engine
   5 tracks · 3 voice profiles (chip / noir / y2k) · one transport
   ============================================================ */
const ONKI_FM = (() => {
  const A = {};
  let ctx=null, master=null, comp=null, analyser=null, wet=null, dry=null, conv=null;
  let freqData=null, timeData=null;

  /* ---- deterministic rng ---- */
  function rng(seed){let s=seed>>>0;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296}}
  const mtof = m => 440*Math.pow(2,(m-69)/12);

  /* ---- scales ---- */
  const MODES={aeolian:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10],lydian:[0,2,4,6,7,9,11],mixolydian:[0,2,4,5,7,9,10],phrygian:[0,1,3,5,7,8,10]};
  function deg(root,mode,d){const sc=MODES[mode];const o=Math.floor(d/7);return root+sc[((d%7)+7)%7]+12*o}

  /* ============================================================
     TRACK DEFINITIONS
     ============================================================ */
  const TRACKS=[
    {id:'someday',  n:'SOMEDAY',    by:'KL3',      bpm:96,  bars:32, root:57, mode:'aeolian',    prog:[0,5,3,4],  feel:'dream',  seed:1337, tint:'#ff1f6f'},
    {id:'fragments',n:'FRAGMENTS',  by:'ONKI INC.',bpm:112, bars:32, root:55, mode:'dorian',     prog:[0,3,6,4],  feel:'broken', seed:8112, tint:'#38f0ff'},
    {id:'echo',     n:'ECHO DRIVE', by:'KL3',      bpm:126, bars:40, root:52, mode:'aeolian',    prog:[0,6,3,5],  feel:'drive',  seed:4242, tint:'#c8ff2e'},
    {id:'lucid',    n:'LUCID',      by:'ONKI INC.',bpm:88,  bars:24, root:60, mode:'lydian',     prog:[0,4,2,5],  feel:'float',  seed:9091, tint:'#a98cff'},
    {id:'dream',    n:'DREAMSTATE', by:'KL3',      bpm:104, bars:32, root:53, mode:'mixolydian', prog:[0,2,5,3],  feel:'wide',   seed:5150, tint:'#ffb03a'}
  ];

  /* build 16th-note patterns per track (deterministic) */
  function build(t){
    const r=rng(t.seed), steps=t.bars*16, K=[],S=[],H=[],O=[],B=[],L=[],P=[];
    const dense = t.feel==='drive'?1:t.feel==='broken'?.8:.5;
    for(let i=0;i<steps;i++){
      const b=i%16, bar=Math.floor(i/16), sec=Math.floor(bar/8);
      const intro = bar<2, drop = sec>=1;
      // drums
      let k=0,s=0,h=0,o=0;
      if(t.feel==='drive'){ k = (b%4===0)?1:0; if(b===10&&r()<.4)k=1; s=(b===4||b===12)?1:0; h=(b%2===0)?1:(r()<.25?.5:0); o=(b===14)?1:0; }
      else if(t.feel==='broken'){ k=(b===0||b===6||b===11)?1:(r()<.06?1:0); s=(b===4||b===12)?1:(r()<.05?.6:0); h=(r()<.5)?(r()<.3?1:.45):0; o=(b===7&&r()<.5)?1:0; }
      else if(t.feel==='wide'){ k=(b===0||b===8)?1:(b===11&&r()<.5?1:0); s=(b===4||b===12)?1:0; h=(b%2===0)?.6:(r()<.2?.35:0); o=(b===14&&r()<.4)?1:0; }
      else if(t.feel==='dream'){ k=(b===0||b===8)?1:0; s=(b===12)?1:0; h=(b%4===2)?.55:(r()<.15?.3:0); o=0; }
      else { k=(b===0||b===10)?1:0; s=(b===8)?1:0; h=(b%4===0)?.5:0; o=0; }
      if(intro){k*=0;s*=0;h*=.4}
      if(!drop&&t.feel!=='dream'){h*=.7}
      K[i]=k;S[i]=s;H[i]=h;O[i]=o;
      // harmony
      const ch=t.prog[Math.floor(bar/2)%t.prog.length];
      // bass
      let bv=0,bn=0;
      if(t.feel==='drive'){ if(b%2===0){bv=1;bn=deg(t.root,t.mode,ch)-12+(b%8===4?7:0)} }
      else if(t.feel==='broken'){ if(b===0||b===6||b===11||(r()<.1)){bv=1;bn=deg(t.root,t.mode,ch)-12+(r()<.25?3:0)} }
      else { if(b===0||b===8){bv=1;bn=deg(t.root,t.mode,ch)-12} }
      B[i]=bv?bn:null;
      // lead / arp
      let lv=null;
      const arpSpeed = t.feel==='drive'?2:t.feel==='float'?4:t.feel==='broken'?2:4;
      if(bar>=2 && b%arpSpeed===0){
        const shape=[0,2,4,6,4,2][(i/arpSpeed|0)%6];
        if(r()<(bar<6?.55:.9)) lv=deg(t.root,t.mode,ch+shape)+ (drop?12:0);
      }
      if(t.feel==='dream'&&bar>=4&&b%8===0) lv=deg(t.root,t.mode,ch+ (r()<.5?4:2))+12;
      L[i]=lv;
      // pad chord (once per 2 bars)
      P[i]= (b===0 && bar%2===0) ? [deg(t.root,t.mode,ch),deg(t.root,t.mode,ch+2),deg(t.root,t.mode,ch+4),deg(t.root,t.mode,ch+6)] : null;
    }
    return {K,S,H,O,B,L,P,steps};
  }
  TRACKS.forEach(t=>{t.pat=build(t); t.dur=t.bars*4*60/t.bpm;});

  /* ============================================================
     VOICE PROFILES
     ============================================================ */
  function env(p,t,a,d,s,r,peak){p.cancelScheduledValues(t);p.setValueAtTime(.0001,t);p.exponentialRampToValueAtTime(peak,t+a);p.exponentialRampToValueAtTime(Math.max(peak*s,.0001),t+a+d);p.exponentialRampToValueAtTime(.0001,t+a+d+r);}
  function noiseBuf(sec){const n=ctx.sampleRate*sec,b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return b}
  let NB=null;
  function noise(){const s=ctx.createBufferSource();s.buffer=NB;return s}

  const PROFILES={
    /* ---------- 8-BIT / OS98 ---------- */
    chip:{
      name:'PCM / 8-BIT', reverb:.10, gain:.85,
      lead(t,f,d,v=1){const o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.setValueAtTime(f,t);
        o.frequency.setValueAtTime(f*1.0,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16*v,t+.005);g.gain.setValueAtTime(.16*v,t+d*.5);g.gain.linearRampToValueAtTime(0,t+d);
        o.connect(g);g.connect(dry);o.start(t);o.stop(t+d+.02)},
      bass(t,f,d,v=1){const o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.34*v,t+.004);g.gain.linearRampToValueAtTime(0,t+d);o.connect(g);g.connect(dry);o.start(t);o.stop(t+d+.02)},
      pad(t,ns,d){ns.slice(0,3).forEach((n,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.setValueAtTime(mtof(n),t);const dd=ctx.createDelay();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.045,t+.02);g.gain.linearRampToValueAtTime(0,t+d*.9);o.connect(g);g.connect(wet);o.start(t+i*.01);o.stop(t+d)})},
      kick(t,v=1){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(45,t+.09);g.gain.setValueAtTime(.85*v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.16);o.connect(g);g.connect(dry);o.start(t);o.stop(t+.18)},
      snare(t,v=1){const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='highpass';f.frequency.value=1400;g.gain.setValueAtTime(.42*v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.11);s.connect(f);f.connect(g);g.connect(dry);s.start(t);s.stop(t+.13)},
      hat(t,v=1){const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='highpass';f.frequency.value=7000;g.gain.setValueAtTime(.14*v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.03);s.connect(f);f.connect(g);g.connect(dry);s.start(t);s.stop(t+.05)},
      open(t,v=1){const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='highpass';f.frequency.value=6000;g.gain.setValueAtTime(.12*v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.22);s.connect(f);f.connect(g);g.connect(dry);s.start(t);s.stop(t+.24)}
    },
    /* ---------- CINEMATIC / NULL ---------- */
    noir:{
      name:'ANALOG / TAPE', reverb:.62, gain:1,
      lead(t,f,d,v=1){const g=ctx.createGain(),fl=ctx.createBiquadFilter();fl.type='lowpass';fl.Q.value=6;
        fl.frequency.setValueAtTime(400,t);fl.frequency.exponentialRampToValueAtTime(Math.min(5200,f*7),t+.14);fl.frequency.exponentialRampToValueAtTime(700,t+d);
        [0,-.09,.11].forEach(dt=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(f*Math.pow(2,dt/12),t);o.connect(fl);o.start(t);o.stop(t+d+.1)});
        env(g.gain,t,.02,.1,.6,d*.9,.09*v);fl.connect(g);g.connect(wet);g.connect(dry)},
      bass(t,f,d,v=1){const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),fl=ctx.createBiquadFilter();
        o.type='sine';o2.type='sawtooth';o.frequency.setValueAtTime(f/2,t);o2.frequency.setValueAtTime(f,t);
        fl.type='lowpass';fl.frequency.setValueAtTime(220,t);fl.Q.value=2;
        const g2=ctx.createGain();g2.gain.value=.22;o2.connect(fl);fl.connect(g2);g2.connect(g);o.connect(g);
        env(g.gain,t,.015,.18,.5,d,.4*v);g.connect(dry);o.start(t);o2.start(t);o.stop(t+d+.2);o2.stop(t+d+.2)},
      pad(t,ns,d){ns.forEach((n,i)=>{const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),fl=ctx.createBiquadFilter();
        o.type='sawtooth';o2.type='sawtooth';o.frequency.value=mtof(n);o2.frequency.value=mtof(n)*1.006;
        fl.type='lowpass';fl.frequency.setValueAtTime(500,t);fl.frequency.linearRampToValueAtTime(1500,t+d*.5);fl.frequency.linearRampToValueAtTime(400,t+d);
        env(g.gain,t,.9,.6,.7,d*.7,.035);o.connect(fl);o2.connect(fl);fl.connect(g);g.connect(wet);o.start(t);o2.start(t);o.stop(t+d+.6);o2.stop(t+d+.6)})},
      kick(t,v=1){const o=ctx.createOscillator(),g=ctx.createGain(),s=noise(),sg=ctx.createGain(),sf=ctx.createBiquadFilter();
        o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(38,t+.13);g.gain.setValueAtTime(1.0*v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.34);
        sf.type='lowpass';sf.frequency.value=900;sg.gain.setValueAtTime(.2*v,t);sg.gain.exponentialRampToValueAtTime(.0001,t+.03);
        s.connect(sf);sf.connect(sg);sg.connect(dry);o.connect(g);g.connect(dry);o.start(t);o.stop(t+.36);s.start(t);s.stop(t+.05)},
      snare(t,v=1){const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='bandpass';f.frequency.value=1900;f.Q.value=.7;
        g.gain.setValueAtTime(.4*v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.24);s.connect(f);f.connect(g);g.connect(dry);g.connect(wet);s.start(t);s.stop(t+.26)},
      hat(t,v=1){const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='highpass';f.frequency.value=8500;g.gain.setValueAtTime(.08*v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.045);s.connect(f);f.connect(g);g.connect(dry);s.start(t);s.stop(t+.06)},
      open(t,v=1){const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='highpass';f.frequency.value=6500;g.gain.setValueAtTime(.07*v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.5);s.connect(f);f.connect(g);g.connect(wet);g.connect(dry);s.start(t);s.stop(t+.52)}
    },
    /* ---------- Y2K / DREAMCORE ---------- */
    y2k:{
      name:'SUPERSAW / GLOSS', reverb:.42, gain:.95,
      lead(t,f,d,v=1){const g=ctx.createGain(),fl=ctx.createBiquadFilter();fl.type='lowpass';fl.Q.value=3;
        fl.frequency.setValueAtTime(1200,t);fl.frequency.exponentialRampToValueAtTime(7000,t+.06);fl.frequency.exponentialRampToValueAtTime(1800,t+d);
        [-.14,-.05,0,.05,.14].forEach(dt=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(f*Math.pow(2,dt/12),t);o.connect(fl);o.start(t);o.stop(t+d+.05)});
        env(g.gain,t,.006,.07,.55,d*.8,.075*v);fl.connect(g);g.connect(dry);g.connect(wet)},
      bass(t,f,d,v=1){const o=ctx.createOscillator(),g=ctx.createGain(),fl=ctx.createBiquadFilter();o.type='sawtooth';o.frequency.setValueAtTime(f,t);
        fl.type='lowpass';fl.frequency.setValueAtTime(1100,t);fl.frequency.exponentialRampToValueAtTime(180,t+d*.8);fl.Q.value=7;
        env(g.gain,t,.005,.09,.35,d,.3*v);o.connect(fl);fl.connect(g);g.connect(dry);o.start(t);o.stop(t+d+.05)},
      pad(t,ns,d){ns.forEach((n,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.value=mtof(n)*(i%2?2:1);
        env(g.gain,t,.5,.5,.6,d*.7,.03);o.connect(g);g.connect(wet);o.start(t);o.stop(t+d+.4)});
        // bell sparkle
        const b=ctx.createOscillator(),bg=ctx.createGain(),m=ctx.createOscillator(),mg=ctx.createGain();
        b.type='sine';b.frequency.value=mtof(ns[3]+12);m.frequency.value=mtof(ns[3]+12)*3.1;mg.gain.value=420;m.connect(mg);mg.connect(b.frequency);
        env(bg.gain,t,.005,.4,.1,1.2,.06);b.connect(bg);bg.connect(wet);b.start(t);m.start(t);b.stop(t+1.8);m.stop(t+1.8)},
      kick(t,v=1){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(180,t);o.frequency.exponentialRampToValueAtTime(48,t+.07);g.gain.setValueAtTime(1.0*v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.2);o.connect(g);g.connect(dry);o.start(t);o.stop(t+.22)},
      snare(t,v=1){const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='highpass';f.frequency.value=2200;
        g.gain.setValueAtTime(.36*v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.16);s.connect(f);f.connect(g);g.connect(dry);g.connect(wet);s.start(t);s.stop(t+.18);
        const c=noise(),cf=ctx.createBiquadFilter(),cg=ctx.createGain();cf.type='bandpass';cf.frequency.value=3000;cg.gain.setValueAtTime(.2*v,t+.002);cg.gain.exponentialRampToValueAtTime(.0001,t+.08);c.connect(cf);cf.connect(cg);cg.connect(dry);c.start(t+.002);c.stop(t+.1)},
      hat(t,v=1){const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='highpass';f.frequency.value=9500;g.gain.setValueAtTime(.11*v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.035);s.connect(f);f.connect(g);g.connect(dry);s.start(t);s.stop(t+.05)},
      open(t,v=1){const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='highpass';f.frequency.value=7000;g.gain.setValueAtTime(.1*v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.34);s.connect(f);f.connect(g);g.connect(dry);g.connect(wet);s.start(t);s.stop(t+.36)}
    }
  };

  /* ============================================================
     TRANSPORT
     ============================================================ */
  let profile='chip', ti=0, step=0, nextTime=0, playing=false, timer=null, vol=.72, muted=false;
  const LOOK=.12, TICK=25;
  const subs=[];
  A.on = fn => (subs.push(fn), fn);
  function emit(){const t=TRACKS[ti];subs.forEach(f=>{try{f({playing,track:t,index:ti,step,pos:A.position(),dur:t.dur,vol,muted,profile})}catch(e){}})}

  function init(){
    if(ctx) return true;
    try{ const AC=window.AudioContext||window.webkitAudioContext; ctx=new AC(); }catch(e){ return false }
    NB=noiseBuf(2);
    master=ctx.createGain(); master.gain.value=vol;
    comp=ctx.createDynamicsCompressor(); comp.threshold.value=-14; comp.knee.value=22; comp.ratio.value=6; comp.attack.value=.004; comp.release.value=.22;
    analyser=ctx.createAnalyser(); analyser.fftSize=1024; analyser.smoothingTimeConstant=.76;
    freqData=new Uint8Array(analyser.frequencyBinCount); timeData=new Uint8Array(analyser.fftSize);
    // reverb
    conv=ctx.createConvolver();
    const len=ctx.sampleRate*2.6, ib=ctx.createBuffer(2,len,ctx.sampleRate);
    for(let c=0;c<2;c++){const d=ib.getChannelData(c);for(let i=0;i<len;i++){const x=i/len;d[i]=(Math.random()*2-1)*Math.pow(1-x,2.6)*(1-x*.3)}}
    conv.buffer=ib;
    wet=ctx.createGain(); dry=ctx.createGain(); dry.gain.value=1;
    const wetOut=ctx.createGain(); wetOut.gain.value=PROFILES[profile].reverb;
    wet.connect(conv); conv.connect(wetOut); wetOut.connect(comp); dry.connect(comp);
    A._wetOut=wetOut;
    comp.connect(master); master.connect(analyser); analyser.connect(ctx.destination);
    return true;
  }

  function schedule(){
    const t=TRACKS[ti], P=PROFILES[profile], p=t.pat, spb=60/t.bpm/4;
    while(nextTime < ctx.currentTime + LOOK){
      const i=step%p.steps, T=nextTime;
      if(p.K[i]) P.kick(T,p.K[i]);
      if(p.S[i]) P.snare(T,p.S[i]);
      if(p.H[i]) P.hat(T,p.H[i]);
      if(p.O[i]) P.open(T,p.O[i]);
      if(p.B[i]!=null) P.bass(T,mtof(p.B[i]),spb*(t.feel==='drive'?1.6:3.2));
      if(p.L[i]!=null) P.lead(T,mtof(p.L[i]),spb*(t.feel==='float'?3.4:2.2));
      if(p.P[i]) P.pad(T,p.P[i],spb*32);
      nextTime+=spb; step++;
      if(step>=p.steps){ step=0; A.next(true); return; }
    }
  }
  function loop(){ if(!playing) return;
    if(ctx.state!=='running'){ nextTime=ctx.currentTime+.06; emit(); return }
    schedule(); emit(); }
  /* browsers require a gesture — arm a one-shot unlock if we're still suspended */
  let armed=false;
  function arm(){
    if(armed)return; armed=true;
    const go=()=>{ if(ctx&&ctx.state==='suspended')ctx.resume(); if(ctx&&ctx.state==='running'){nextTime=ctx.currentTime+.06;
      ['pointerdown','keydown','touchstart'].forEach(k=>document.removeEventListener(k,go,true)); armed=false} };
    ['pointerdown','keydown','touchstart'].forEach(k=>document.addEventListener(k,go,true));
  }

  /* ---------- public ---------- */
  A.tracks=TRACKS;
  A.ready=()=>!!ctx;
  A.profileName=()=>PROFILES[profile].name;
  A.setProfile=p=>{ if(!PROFILES[p])return; profile=p; if(A._wetOut) A._wetOut.gain.setTargetAtTime(PROFILES[p].reverb,ctx.currentTime,.2); if(master) master.gain.setTargetAtTime(muted?0:vol*PROFILES[p].gain,ctx.currentTime,.1); emit(); };
  A.play=()=>{ if(!init())return;
    if(ctx.state==='suspended'){ ctx.resume().catch(()=>{}); arm(); }
    if(playing)return;
    playing=true; nextTime=ctx.currentTime+.06; clearInterval(timer); timer=setInterval(loop,TICK); document.body.classList.add('fm-on'); emit(); };
  A.pause=()=>{ playing=false; clearInterval(timer); document.body.classList.remove('fm-on'); emit(); };
  A.toggle=()=>{ playing?A.pause():A.play() };
  A.stop=()=>{ A.pause(); step=0; emit() };
  A.next=(auto)=>{ ti=(ti+1)%TRACKS.length; step=0; if(ctx)nextTime=Math.max(nextTime,ctx.currentTime+.04); emit(); if(!auto&&playing){} };
  A.prev=()=>{ if(A.position()>3){step=0;emit();return} ti=(ti-1+TRACKS.length)%TRACKS.length; step=0; emit() };
  A.select=i=>{ ti=(i+TRACKS.length)%TRACKS.length; step=0; if(ctx)nextTime=ctx.currentTime+.04; emit(); A.play() };
  A.seek=frac=>{ const t=TRACKS[ti]; step=Math.max(0,Math.min(t.pat.steps-1,Math.floor(frac*t.pat.steps))); if(ctx)nextTime=ctx.currentTime+.02; emit() };
  A.position=()=>{ const t=TRACKS[ti]; return step*(60/t.bpm/4) };
  A.progress=()=>{ const t=TRACKS[ti]; return step/t.pat.steps };
  A.setVol=v=>{ vol=Math.max(0,Math.min(1,v)); if(master)master.gain.setTargetAtTime(muted?0:vol*PROFILES[profile].gain,ctx.currentTime,.05); emit() };
  A.getVol=()=>vol;
  A.mute=m=>{ muted=(m==null)?!muted:m; if(master)master.gain.setTargetAtTime(muted?0:vol*PROFILES[profile].gain,ctx.currentTime,.05); emit() };
  A.isMuted=()=>muted;
  A.isPlaying=()=>playing;
  A.current=()=>TRACKS[ti];
  A.spectrum=()=>{ if(!analyser)return null; analyser.getByteFrequencyData(freqData); return freqData };
  A.wave=()=>{ if(!analyser)return null; analyser.getByteTimeDomainData(timeData); return timeData };
  A.energy=()=>{ const f=A.spectrum(); if(!f)return 0; let s=0; for(let i=0;i<40;i++)s+=f[i]; return s/(40*255) };
  A.fmt=s=>{ s=Math.max(0,s|0); return (s/60|0).toString().padStart(2,'0')+':'+(s%60).toString().padStart(2,'0') };
  return A;
})();
