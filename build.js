const fs=require('fs'),p=require('path');
const R=__dirname, S=p.join(R,'src');
const rd=f=>fs.readFileSync(p.join(S,f),'utf8');
const cat=(dir,filter)=>fs.readdirSync(p.join(S,dir)).filter(f=>filter.test(f)).sort()
  .map(f=>`\n/* ===== ${dir}/${f} ===== */\n`+fs.readFileSync(p.join(S,dir,f),'utf8')).join('\n');

let html=rd('shell.html');
html=html.replace('/*__CSS__*/',()=>cat('css',/\.css$/));
html=html.replace('<!--__HTML_BOOT__-->',()=>rd('html/01-boot.html'));
html=html.replace('<!--__HTML_V1__-->',()=>rd('html/20-v1.html'));
html=html.replace('<!--__HTML_V2__-->',()=>rd('html/21-v2.html'));
html=html.replace('<!--__HTML_V3__-->',()=>rd('html/22-v3.html'));

const core=['js/10-audio.js','js/11-game.js','js/12-core.js','js/13-worlds.js']
  .map(f=>`\n/* ===== ${f} ===== */\n`+rd(f)).join('\n');
html=html.replace('/*__JS_CORE__*/',()=>core);
html=html.replace('/*__JS_THREE__*/',()=>rd('js/20-three.js'));

const out=p.join(R,'dist','index.html');
fs.mkdirSync(p.join(R,'dist'),{recursive:true});
fs.writeFileSync(out,html);
console.log('built',out,(fs.statSync(out).size/1024).toFixed(1)+' KB');
