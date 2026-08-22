/* ============================================================
   MR. ONKI & DOG  —  160x144 pixel runner
   one engine, mounted into different shells per reality
   ============================================================ */
const ONKI_GAME = (() => {
  const W=160,H=144,GY=112;
  const PALS={
    gb:['#0f2a12','#2e6b30','#8bac0f','#cfe37a'],           // classic dot-matrix
    void:['#050507','#1a1a22','#8a8aa0','#ffffff'],          // cinematic mono
    aqua:['#12305e','#2f77c9','#7fd3ff','#eafaff']           // y2k
  };
  function make(canvas,opts={}){
    const ctx=canvas.getContext('2d');
    canvas.width=W; canvas.height=H;
    ctx.imageSmoothingEnabled=false;
    let pal=PALS[opts.pal||'gb'];
    let raf=null, running=false, over=false, started=false;
    let t=0, spd=1.5, score=0, best=+(ONKI_LS('onki_hi')||0), shake=0, flash=0;
    let px=26, py=GY, vy=0, grounded=true, duck=false;
    let dogX=6, dogHop=0;
    let obs=[], pick=[], clouds=[], tv=[];
    const hooks=opts.on||{};

    function reset(){
      t=0;spd=1.5;score=0;px=26;py=GY;vy=0;grounded=true;duck=false;obs=[];pick=[];over=false;shake=0;flash=0;
      clouds=[{x:20,y:22,s:1},{x:96,y:34,s:.7},{x:150,y:16,s:1.2}];
      tv=[{x:60,y:0},{x:130,y:0}];
    }
    reset();

    function jump(){ if(over){ reset(); running=true; return } if(!started){started=true;running=true;return} if(grounded){vy=-4.35;grounded=false;dogHop=10;beep(660,.05)} }
    function setDuck(v){ duck=v }
    function beep(f,d){ if(window.ONKI_FM&&ONKI_FM.ready&&ONKI_FM.ready()){} try{ if(hooks.sfx)hooks.sfx(f,d) }catch(e){} }

    function spawn(){
      const r=Math.random();
      if(r<.62){ obs.push({x:W+8,y:GY,w:r<.3?7:11,h:r<.3?12:16,k:r<.3?'reel':'crt'}) }
      else if(r<.78){ obs.push({x:W+8,y:GY-30,w:16,h:9,k:'bird'}) }
      else { pick.push({x:W+8,y:GY-24-Math.random()*22,r:4,got:0}) }
    }

    function step(){
      t++;
      spd=Math.min(4.4,1.5+t/1400);
      // player
      vy+=.26; py+=vy;
      if(py>=GY){py=GY;vy=0;grounded=true}
      if(dogHop>0)dogHop--;
      dogX += ((px-19)-dogX)*.12;
      // world
      if(t%Math.max(26,Math.floor(74-spd*9))===0) spawn();
      obs.forEach(o=>o.x-=spd*1.35); pick.forEach(p=>p.x-=spd*1.35);
      clouds.forEach(c=>{c.x-=spd*.18*c.s; if(c.x<-24)c.x=W+18});
      tv.forEach(c=>{c.x-=spd*.5; if(c.x<-30)c.x=W+30});
      obs=obs.filter(o=>o.x>-24); pick=pick.filter(p=>p.x>-14&&!p.got);
      // collide
      const ph=duck&&grounded?7:13, pw=10, pyT=py-ph;
      for(const o of obs){
        if(px+pw*.5>o.x && px-pw*.5<o.x+o.w && pyT<o.y && py>o.y-o.h){ die(); break }
      }
      for(const p of pick){
        if(Math.abs(p.x-px)<9 && Math.abs(p.y-(py-7))<11){ p.got=1; score+=25; flash=6; beep(1180,.04) }
      }
      score+=.12;
      if(shake>0)shake--; if(flash>0)flash--;
    }
    function die(){
      over=true; running=false; shake=10; beep(120,.3);
      const s=Math.floor(score); if(s>best){best=s; ONKI_LS('onki_hi',s)}
      if(hooks.gameover)hooks.gameover(Math.floor(score),best);
    }

    /* ---------- draw ---------- */
    function px4(x,y,w,h,c){ctx.fillStyle=pal[c];ctx.fillRect(x|0,y|0,w,h)}
    function drawOnki(x,y,d){
      const c=3, o=2;
      if(d){ px4(x-6,y-8,13,8,c); px4(x-4,y-6,2,2,0); px4(x+1,y-6,2,2,0); px4(x-5,y,3,2,o); px4(x+2,y,3,2,o); return }
      // head
      px4(x-5,y-13,11,9,c); px4(x-3,y-10,2,2,0); px4(x+2,y-10,2,2,0); px4(x-1,y-7,3,1,0);
      // body
      px4(x-4,y-4,9,4,o);
      // legs (run cycle)
      const f=Math.floor(t/4)%2;
      if(grounded){ px4(x-4,y,3,f?3:2,o); px4(x+2,y,3,f?2:3,o) } else { px4(x-5,y,3,2,o); px4(x+3,y,3,2,o) }
    }
    function drawDog(x,y){
      const f=Math.floor(t/4)%2, hop=dogHop>0?-3:0;
      px4(x-7,y-7+hop,10,5,o1()); px4(x+2,y-9+hop,5,4,o1()); px4(x+6,y-8+hop,2,1,0);
      px4(x-6,y-2+hop,2,2,o1()); px4(x+0,y-2+hop,2,f?1:2,o1()); px4(x-9,y-8+hop,2,3,o1());
      function o1(){return 1}
    }
    function draw(){
      ctx.save();
      const sx=shake?(Math.random()*2-1)*2:0, sy=shake?(Math.random()*2-1)*2:0;
      ctx.translate(sx,sy);
      // bg
      ctx.fillStyle=pal[flash>3?3:0]; ctx.fillRect(-4,-4,W+8,H+8);
      // clouds
      clouds.forEach(c=>{px4(c.x,c.y,10*c.s,3,1);px4(c.x+3,c.y-2,6*c.s,3,1)});
      // distant tv towers
      tv.forEach(c=>{px4(c.x,GY-46,12,10,1);px4(c.x+4,GY-36,4,36,1)});
      // ground
      px4(-4,GY+3,W+8,H,1);
      for(let i=0;i<W;i+=8){ px4(i-((t*spd*1.35)%8),GY+6,4,1,2) }
      // obstacles
      obs.forEach(o=>{
        if(o.k==='reel'){ px4(o.x,o.y-o.h,o.w,o.h,2); px4(o.x+2,o.y-o.h+3,3,3,0) }
        else if(o.k==='crt'){ px4(o.x,o.y-o.h,o.w,o.h,2); px4(o.x+2,o.y-o.h+2,o.w-4,o.h-6,3); px4(o.x+2,o.y-3,2,2,0) }
        else { const w=Math.floor(t/5)%2; px4(o.x,o.y,o.w,3,2); px4(o.x+4,o.y+(w?-4:3),8,3,2) }
      });
      // pickups (onki logo tiles)
      pick.forEach(p=>{ const b=Math.sin(t*.2+p.x)*1.5; px4(p.x-4,p.y-4+b,8,8,2); px4(p.x-2,p.y-2+b,4,4,3) });
      // actors
      drawDog(dogX,py>GY-2?GY:GY);
      drawOnki(px,py,duck&&grounded);
      // hud
      ctx.fillStyle=pal[2]; ctx.font='7px "Silkscreen",monospace';
      ctx.fillText('SCORE '+String(Math.floor(score)).padStart(5,'0'),4,9);
      ctx.fillText('HI '+String(best).padStart(5,'0'),W-52,9);
      if(!started){ banner('MR. ONKI & DOG','PRESS  ▶  TO RUN') }
      else if(over){ banner('GAME OVER','SCORE '+Math.floor(score)+'  ·  RETRY ▶') }
      ctx.restore();
    }
    function banner(a,b){
      ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,44,W,42);
      ctx.fillStyle=pal[3];ctx.font='9px "Silkscreen",monospace';ctx.textAlign='center';
      ctx.fillText(a,W/2,60); ctx.font='7px "Silkscreen",monospace'; ctx.fillStyle=pal[2];
      ctx.fillText(b,W/2,74); ctx.textAlign='left';
    }

    function frame(){ if(running)step(); draw(); raf=requestAnimationFrame(frame) }
    function start(){ if(raf)return; frame() }
    function stop(){ if(raf)cancelAnimationFrame(raf); raf=null }

    return {
      jump,setDuck,start,stop,reset:()=>{reset();running=true;started=true},
      pause:()=>{running=false}, resume:()=>{if(started&&!over)running=true},
      setPal:p=>{pal=PALS[p]||pal},
      isOver:()=>over, el:canvas
    };
  }
  return {make,W,H};
})();
