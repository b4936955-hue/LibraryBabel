"use strict";
/* is this the record that was just made from the mp3? (then we know its tempo and can play the original) */
let autoSpeed=false;
function isOrig(toks){if(!orig||!orig.toks||orig.toks.length!==toks.length)return false;for(let i=0;i<toks.length;i++)if(orig.toks[i]!==toks[i])return false;return true}
/* ---------- the record: drawing ---------- */
const TAU=Math.PI*2;
const VINYL={black:["#26262c","#09090b"],red:["#b02d2d","#4a1010"],blue:["#2f55b0","#101e4a"],gold:["#c19b3e","#52400f"],green:["#2a9a58","#0f3d22"],white:["#f0ece4","#9a958a"],purple:["#7142b0","#2a1450"],orange:["#df7a30","#5c2a0a"],pink:["#df78a4","#5a1a38"],teal:["#2ca29b","#0c3a38"],smoke:["#53535c","#15151a"]};
const LABELC={cream:"#ece2cb",red:"#b8453a",blue:"#3f67a8",white:"#f4f1ea",black:"#25211d"};
const PROGC={white:"#ffffff",red:"#ff5a4a",green:"#58f08a",cyan:"#4fd8ff",pink:"#ff7ab8"};
const lum=h=>{const n=parseInt(h.slice(1),16);return(.299*(n>>16)+.587*(n>>8&255)+.114*(n&255))/255};
/* One record. Every step is a stretch of groove that wobbles with its note. The groove is one smooth spiral,
   and the disc turns so that the spot being played is always right under the needle. */
function makeRecord(mkCanvas,toks,cfg){
 const n=toks.length,SZ=840,CX=SZ/2,CY=SZ/2,RO=SZ*.455,RI=SZ*.17,RL=SZ*.145,PX=SZ*.93,PY=SZ*.3,LA=300;
 const turns=Math.max(1.5,Math.min(70,n*STEP/1.8)),pitch=(RO-RI)/turns,amp=pitch*.3;
 const wv=new Float32Array(n+2);{let last=0;for(let i=0;i<n;i++){const part=musicParts(toks[i],MUSIC_POLY),ml=part.voices[0];if(ml>=2)last=(ml-2)/35-.5;else if(ml===0)last=0;wv[i]=last*amp+(part.drum?amp*.3:0)}wv[n]=wv[n-1]||0;wv[n+1]=wv[n]}
 const wob=u=>{const i=Math.min(n,Math.floor(u)),t=u-i,s=t*t*(3-2*t);return wv[i]*(1-s)+wv[i+1]*s};
 const th=u=>u/n*turns*TAU,rad=u=>RO-(RO-RI)*u/n+wob(u);
 const pos=u=>{const r=rad(u),a=th(u);return[CX+r*Math.sin(a),CY-r*Math.cos(a)]};
 const ds={smooth:1,normal:2,fast:4}[cfg.detail]||2,arc=TAU*(RO+RI)/2*turns/n;
 let sub=Math.min(500,Math.max(2,Math.ceil(arc/ds)));if(n*sub>150000)sub=Math.max(1,Math.floor(150000/n));
 const trace=(c,u0,u1)=>{c.beginPath();let first=true;for(let u=u0;u<u1;u+=1/sub){const p=pos(u);if(first){c.moveTo(p[0],p[1]);first=false}else c.lineTo(p[0],p[1])}const e=pos(u1);if(first)c.moveTo(e[0],e[1]);else c.lineTo(e[0],e[1]);c.stroke()};
 const mkc=()=>{const c=mkCanvas(SZ);return c};
 const base=mkc(),gro=mkc(),prog=mkc(),shn=mkc(),arm=mkc();
 const V=VINYL[cfg.vinyl]||VINYL.black,acc=cfg.accent,lab=LABELC[cfg.label]||acc,pc=PROGC[cfg.progress]||acc,light=lum(V[0])>.6;
 const lw=Math.max(.8,Math.min(1.9,pitch*.2))*(cfg.detail==="smooth"?.8:cfg.detail==="fast"?1.2:1);
 /* the table and the stand */
 {const c=base.getContext("2d"),bg=c.createLinearGradient(0,0,SZ,SZ);bg.addColorStop(0,"#3a2a1b");bg.addColorStop(1,"#1c130b");c.fillStyle=bg;c.fillRect(0,0,SZ,SZ);
  c.fillStyle="rgba(0,0,0,.33)";for(let y=0;y<SZ;y+=14)c.fillRect(0,y,SZ,1);
  c.beginPath();c.arc(CX,CY,RO+SZ*.03,0,TAU);c.fillStyle="#120c07";c.fill();c.lineWidth=SZ*.006;c.strokeStyle="#7a6a52";c.stroke();
  c.beginPath();c.arc(PX,PY,SZ*.05,0,TAU);c.fillStyle="#2a2018";c.fill();c.lineWidth=2;c.strokeStyle="#5a4a38";c.stroke()}
 /* the vinyl itself, with fine grooves all over it so every size looks like a record */
 {const g=gro.getContext("2d"),rg=g.createRadialGradient(CX,CY,RL,CX,CY,RO);rg.addColorStop(0,V[0]);rg.addColorStop(1,V[1]);
  g.beginPath();g.arc(CX,CY,RO,0,TAU);g.fillStyle=rg;g.fill();
  const dens=cfg.detail==="smooth"?3.4:cfg.detail==="fast"?1.8:2.4;let k=7;
  for(let r=RL+SZ*.02;r<RO-3;r+=dens){k=(k*9301+49297)%233280;const a=.025+k/233280*.06;g.beginPath();g.arc(CX,CY,r,0,TAU);g.lineWidth=.9;g.strokeStyle=(light?"rgba(0,0,0,":"rgba(255,255,255,")+a+")";g.stroke()}
  g.beginPath();g.arc(CX,CY,RO-2,0,TAU);g.lineWidth=3;g.strokeStyle="rgba(255,255,255,.12)";g.stroke();
  g.lineCap="round";g.lineJoin="round";g.lineWidth=lw;g.strokeStyle=light?"rgba(0,0,0,.4)":"rgba(255,255,255,.26)";trace(g,0,n);
  if(hl){g.lineWidth=lw*2.2;g.strokeStyle="#ffe49a";trace(g,Math.max(0,hl.a),Math.min(n,hl.b))}
  [RI-6,RI-11].forEach(r=>{g.beginPath();g.arc(CX,CY,r,0,TAU);g.lineWidth=1;g.strokeStyle=light?"rgba(0,0,0,.25)":"rgba(255,255,255,.14)";g.stroke()});
  const lg=g.createRadialGradient(CX-RL*.3,CY-RL*.3,2,CX,CY,RL);lg.addColorStop(0,lab);lg.addColorStop(1,lab);
  g.beginPath();g.arc(CX,CY,RL,0,TAU);g.fillStyle=lab;g.fill();g.lineWidth=3;g.strokeStyle="rgba(0,0,0,.25)";g.stroke();
  g.beginPath();g.arc(CX,CY,RL*.9,0,TAU);g.lineWidth=1.5;g.strokeStyle=lum(lab)>.55?"rgba(36,26,14,.35)":"rgba(255,255,255,.3)";g.stroke();
  g.fillStyle=lum(lab)>.55?"#241a0e":"#f3ece0";g.textAlign="center";
  g.font="bold "+SZ*.034+"px Georgia,serif";g.fillText("BABEL",CX,CY-SZ*.034);
  g.font=SZ*.021+"px Georgia,serif";const sec=Math.round(n*STEP);g.fillText(n.toLocaleString()+(n===1?" step":" steps"),CX,CY+SZ*.05);g.fillText(Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0"),CX,CY+SZ*.075);
  g.beginPath();g.arc(CX,CY,SZ*.009,0,TAU);g.fillStyle="#120c07";g.fill()}
 /* the shine stays put while the record turns, like a real one under a lamp */
 {const c=shn.getContext("2d"),sh=(+cfg.shine||0)/100;if(sh>0){c.save();c.beginPath();c.arc(CX,CY,RO,0,TAU);c.arc(CX,CY,RL,0,TAU,true);c.clip("evenodd");
  [[-.78,.2],[2.36,.2]].forEach(([a0,w])=>{for(let q=0;q<8;q++){const ww=w*(1-q/9);c.beginPath();c.moveTo(CX,CY);c.arc(CX,CY,RO+4,a0-ww,a0+ww);c.closePath();c.fillStyle="rgba(255,255,255,"+(.018*sh)+")";c.fill()}});c.restore()}}
 /* where the needle is: the tone arm swings on a pivot, so the needle slides along a small arc */
 const D=Math.hypot(PX-CX,PY-CY),ex=(PX-CX)/D,ey=(PY-CY)/D;
 const tip=r=>{r=Math.max(Math.abs(D-LA)+1,Math.min(D+LA-1,r));const a=(D*D+r*r-LA*LA)/(2*D),h=Math.sqrt(Math.max(0,r*r-a*a));const p1=[CX+a*ex+h*ey,CY+a*ey-h*ex];return p1};
 const naAt=r=>{const t=tip(r);return Math.atan2(t[0]-CX,-(t[1]-CY))};
 const PARK=RO+SZ*.05;
 const pcx=prog.getContext("2d"),acx=arm.getContext("2d");let lastU=0;
 const drawArm=(r,touching)=>{acx.clearRect(0,0,SZ,SZ);const T=tip(r),dx=T[0]-PX,dy=T[1]-PY,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;
  acx.lineCap="round";
  acx.strokeStyle="rgba(0,0,0,.35)";acx.lineWidth=SZ*.016;acx.beginPath();acx.moveTo(PX-ux*SZ*.09+7,PY-uy*SZ*.09+9);acx.lineTo(T[0]+7,T[1]+9);acx.stroke();
  acx.strokeStyle="#d8d8d8";acx.lineWidth=SZ*.013;acx.beginPath();acx.moveTo(PX,PY);acx.lineTo(T[0],T[1]);acx.stroke();
  acx.strokeStyle="#9a9a9a";acx.lineWidth=SZ*.022;acx.beginPath();acx.moveTo(PX-ux*SZ*.09,PY-uy*SZ*.09);acx.lineTo(PX-ux*SZ*.02,PY-uy*SZ*.02);acx.stroke();
  acx.save();acx.translate(T[0],T[1]);acx.rotate(Math.atan2(uy,ux));acx.fillStyle="#1e1e1e";acx.fillRect(-SZ*.065,-SZ*.017,SZ*.075,SZ*.034);acx.fillStyle=acc;acx.fillRect(-SZ*.065,-SZ*.017,SZ*.014,SZ*.034);acx.fillStyle="#888";acx.fillRect(SZ*.006,-SZ*.006,SZ*.012,SZ*.012);acx.restore();
  acx.beginPath();acx.arc(PX,PY,SZ*.03,0,TAU);acx.fillStyle="#bdbdbd";acx.fill();acx.beginPath();acx.arc(PX,PY,SZ*.012,0,TAU);acx.fillStyle="#333";acx.fill();
  if(touching){acx.beginPath();acx.arc(T[0],T[1],SZ*.011,0,TAU);acx.fillStyle=pc;acx.globalAlpha=.5;acx.fill();acx.globalAlpha=1}};
 const rest=()=>-(th(0))+naAt(RO);
 /* p is the position in steps, or -1 for "not playing". Returns how far to turn the disc, in radians. */
 const setPos=p=>{
  if(p<0||!cfg.showProgress){pcx.clearRect(0,0,SZ,SZ);lastU=0}
  if(p<0){drawArm(PARK,false);return rest()}
  p=Math.min(n,p);if(p<lastU){pcx.clearRect(0,0,SZ,SZ);lastU=0}
  if(cfg.showProgress&&p>lastU){pcx.lineCap="round";pcx.lineJoin="round";pcx.lineWidth=lw+(pitch>6?1.4:.5);pcx.strokeStyle=pc;pcx.globalAlpha=.92;trace(pcx,lastU,p);pcx.globalAlpha=1;lastU=p}
  const r=rad(p);drawArm(Math.min(RO,r),true);return naAt(r)-th(p)};
 return{SZ,base,gro,prog,shn,arm,setPos,drawArm,PARK,RO,rad,rest,naAt,th,tip,turns,sub}}


/* ---------- plain note lists: every note at its real time ---------- */
function parseMidi(ab){
 const d=new DataView(ab);let p=0;const u32=()=>{const v=d.getUint32(p);p+=4;return v},u16=()=>{const v=d.getUint16(p);p+=2;return v};
 if(u32()!==0x4d546864)throw new Error("not a MIDI file");u32();u16();const nt=u16(),div=u16();if(div&0x8000)throw new Error("this MIDI timing isn't supported");
 const tempos=[[0,500000]],raw=[];
 for(let t=0;t<nt;t++){if(u32()!==0x4d54726b)break;const len=u32(),end=p+len;let tick=0,run=0;const on={};
  const vlq=()=>{let v=0,b;do{b=d.getUint8(p++);v=(v<<7)|(b&127)}while(b&128);return v};
  while(p<end){tick+=vlq();let st=d.getUint8(p);if(st<128)st=run;else p++;
   if(st===0xff){const ty=d.getUint8(p++),l=vlq();if(ty===0x51&&l===3)tempos.push([tick,(d.getUint8(p)<<16)|(d.getUint8(p+1)<<8)|d.getUint8(p+2)]);p+=l}
   else if(st===0xf0||st===0xf7){p+=vlq()}
   else{run=st;const hi=st&0xf0,ch=st&15,a=d.getUint8(p++),b=hi===0xc0||hi===0xd0?0:d.getUint8(p++);
    if(ch===9)continue;const key=ch*128+a;
    if(hi===0x90&&b>0){if(on[key])raw.push({a:on[key].t,b:tick,m:a,v:on[key].v});on[key]={t:tick,v:b}}
    else if(hi===0x80||(hi===0x90&&b===0)){if(on[key]){raw.push({a:on[key].t,b:tick,m:a,v:on[key].v});delete on[key]}}}}
  for(const k in on)raw.push({a:on[k].t,b:tick,m:k%128,v:on[k].v});p=end}
 tempos.sort((x,y)=>x[0]-y[0]);const sec=tk=>{let s=0,lt=0,tp=500000;for(const[t,q]of tempos){if(t>=tk)break;s+=(t-lt)*tp/1e6/div;lt=t;tp=q}return s+(tk-lt)*tp/1e6/div};
 return raw.map(x=>({t:sec(x.a),e:sec(x.b),m:x.m,v:Math.round(x.v/127*63)})).filter(x=>x.e>x.t).sort((x,y)=>x.t-y.t||x.m-y.m)}
function noteListMidi(list){
 if(!list.length)return null;const ev=[];list.forEach(x=>{const on=Math.round(x.t*960),off=Math.max(on+1,Math.round(x.e*960)),v=Math.max(1,Math.min(127,Math.round(24+(x.v==null?44:x.v)/63*100)));ev.push({tick:on,o:1,d:[0x90,x.m,v]},{tick:off,o:0,d:[0x80,x.m,0]})});
 ev.sort((a,b)=>a.tick-b.tick||a.o-b.o);const body=[0,0xff,0x51,3,0x07,0xa1,0x20,0,0xc0,0],vlq=value=>{let b=Math.max(0,value)|0,e=b&0x7f;while((b>>=7))e=(e<<8)|((b&0x7f)|0x80);while(true){body.push(e&0xff);if(e&0x80)e>>=8;else break}};
 let tk=0;for(const e of ev){vlq(e.tick-tk);body.push(...e.d);tk=e.tick}vlq(0);body.push(0xff,0x2f,0);
 const h=[0x4d,0x54,0x68,0x64,0,0,0,6,0,0,0,1,1,0xe0,0x4d,0x54,0x72,0x6b],z=body.length;h.push(z>>>24&255,z>>>16&255,z>>>8&255,z&255);return new Uint8Array(h.concat(body))}
function makeNoteRoll(list,total,onSeek){
 const cv=mk("canvas","roll"),W=900,H=170;cv.width=W;cv.height=H;cv.tabIndex=0;cv.setAttribute("aria-label","Piano roll. Click to start playing from that spot.");
 const lo=Math.min(36,...list.map(x=>x.m))-1,hi=Math.max(84,...list.map(x=>x.m))+1,rowH=(H-4)/(hi-lo+1),sx=W/Math.max(1,total),base=document.createElement("canvas");base.width=W;base.height=H;const g=base.getContext("2d");
 g.fillStyle="rgba(0,0,0,.3)";g.fillRect(0,0,W,H);for(let m=Math.ceil(lo/12)*12;m<=hi;m+=12){g.fillStyle="rgba(255,255,255,.08)";g.fillRect(0,H-2-(m-lo+.5)*rowH,W,1)}
 list.forEach(x=>{g.globalAlpha=.4+.6*Math.min(1,(x.v==null?44:x.v)/56);g.fillStyle=LANE_COL[x.m%5];g.fillRect(x.t*sx,H-2-(x.m-lo+1)*rowH,Math.max(1.5,(x.e-x.t)*sx),Math.max(1.5,rowH-.4))});g.globalAlpha=1;
 const c=cv.getContext("2d"),paint=s=>{c.clearRect(0,0,W,H);c.drawImage(base,0,0);if(s>=0){c.fillStyle="rgba(255,255,255,.9)";c.fillRect(s*sx-1,0,2,H)}};paint(-1);
 let hv=-1,cur=-1;const draw=s=>{cur=s;paint(s);if(hv>=0){c.fillStyle="rgba(255,255,255,.25)";c.fillRect(hv*sx-.5,0,1,H)}};
 cv.onclick=e=>{const r=cv.getBoundingClientRect();onSeek(Math.max(0,(e.clientX-r.left)/r.width*total))};
 cv.onmousemove=e=>{const r=cv.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height,t=px*total,m=Math.round(hi-py*(hi-lo+1)+.0),hit=list.find(x=>t>=x.t&&t<=x.e&&Math.abs(x.m-m)<=0);
  hv=t;draw(cur);showTip((hit?NOTE[hit.m%12]+(Math.floor(hit.m/12)-1)+" \u00b7 ":"")+Math.floor(t/60)+":"+String(Math.floor(t%60)).padStart(2,"0")+" \u00b7 click to play from here",e.clientX,e.clientY)};
 cv.onmouseleave=()=>{hv=-1;draw(cur);hideTip()};return{cv,paint:draw}}
/* a player for a list of notes: real piano, a roll you can click, and saves */
function notePlayerPanel(list,title,blurb,buf,bufStart,bufLen){
 const p=mk("div","panel"),total=list.reduce((a,x)=>Math.max(a,x.e),0)+.3,tm=s=>Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0");
 p.append(mk("h3",null,title),mk("p",null,blurb));loadPiano();
 const row=mk("div","row"),pb=mk("button","btn pri","Play"),sel=mk("select"),now=mk("div","nowp","Ready when you are.");sel.setAttribute("aria-label","Instrument");
 INST_NAMES.forEach(([x,t])=>{if(x==="match")return;sel.append(new Option(t,x,x===INST,x===INST))});sel.onchange=()=>INST=sel.value;
 const roll=makeNoteRoll(list,total,s=>go(s)),setS=s=>{roll.paint(s);now.textContent=tm(s)+" / "+tm(total)};
 const done=()=>{delete pb.dataset.on;pb.textContent="Play";roll.paint(-1);now.textContent="Ready when you are."};
 async function go(from){await loadPiano();pb.dataset.on=1;pb.textContent="Stop";playNotes(list,setS,()=>{if(pb.dataset.on)done()},from||0)}
 pb.onclick=async()=>{AC();if(pb.dataset.on){stopAudio();return}await go(0)};row.append(pb,sel);
 if(buf){const po=mk("button","btn","Hear the original");po.onclick=()=>{AC();if(po.dataset.on){stopAudio();return}stopAudio();const off=Math.max(0,Math.min(bufStart,buf.duration-.1)),dur=Math.max(.1,Math.min(bufLen,buf.duration-off)),s=ctx.createBufferSource(),g=ctx.createGain();g.gain.value=.5*SG("volume")/60;s.buffer=buf;s.connect(g);g.connect(ctx.destination);
   po.dataset.on=1;po.textContent="Stop the original";nodes=[s];onStop=()=>{delete po.dataset.on;po.textContent="Hear the original"};s.onended=()=>{if(nodes&&nodes[0]===s){nodes=null;const f=onStop;onStop=null;f&&f()}};s.start(0,off,dur)};row.append(po)}
 const sv=mk("div","acts"),bm=mk("button","btn","Save as MIDI"),bw=mk("button","btn","Save as WAV");
 bm.onclick=()=>{const m=noteListMidi(list);if(m)saveBlob(new Blob([m],{type:"audio/midi"}),"babel-notes.mid")};
 bw.onclick=async()=>{bw.disabled=true;bw.textContent="Rendering...";try{const rb=await renderNotes(list,{rate:44100,inst:INST});saveBlob(wavBlob(rb.getChannelData(0),rb.sampleRate),"babel-notes.wav")}catch(e){toast("That didn't render")}bw.disabled=false;bw.textContent="Save as WAV"};
 sv.append(bm,bw);p.append(row,roll.cv,now,sv);return p}

/* ---------- the piano roll: every note of the record, drawn in time ---------- */
const LANE_COL=["#e8b64c","#6fc3b4","#d8826f","#a58ad6","#7fb0e8"];
function rollNotes(toks,poly,mx){
 const n=toks.length,L=poly?MUSIC_VOICES:1,out=[],P=toks.map(t=>musicParts(t,poly));let k=0;
 for(let i=0;i<n;i++)for(let l=0;l<L;l++){const c=P[i].voices[l];if(c>=2){let e=i+1;while(e<n&&P[e].voices[l]===1)e++;out.push({a:i,b:e,m:c-2+48+(mx&&mx.oct?12*(mx.oct[k]||0):0),l,v:mx&&mx.vel?mx.vel[k]:44});k++}}
 return{notes:out,parts:P}}
function makeRoll(toks,poly,mx,onSeek){
 const cv=mk("canvas","roll"),W=900,H=150,n=toks.length,{notes,parts}=rollNotes(toks,poly,mx);cv.width=W;cv.height=H;cv.setAttribute("aria-label","Piano roll. Click to start playing from that spot.");cv.tabIndex=0;
 const lo=Math.min(48,...notes.map(x=>x.m))-1,hi=Math.max(83,...notes.map(x=>x.m))+1,rowH=(H-14)/(hi-lo+1),sx=W/Math.max(1,n);
 const base=document.createElement("canvas");base.width=W;base.height=H;const g=base.getContext("2d");
 const css=getComputedStyle(document.documentElement);g.fillStyle="rgba(0,0,0,.28)";g.fillRect(0,0,W,H);
 for(let m=Math.ceil(lo/12)*12;m<=hi;m+=12){const y=H-14-(m-lo+.5)*rowH;g.fillStyle="rgba(255,255,255,.07)";g.fillRect(0,y,W,1)}
 for(let i=0;i<n;i+=(n>300?16:4)){g.fillStyle="rgba(255,255,255,.05)";g.fillRect(i*sx,0,1,H)}
 notes.forEach(x=>{g.globalAlpha=.45+.55*Math.min(1,x.v/56);g.fillStyle=LANE_COL[x.l%5];g.fillRect(x.a*sx,H-14-(x.m-lo+1)*rowH,Math.max(1.5,(x.b-x.a)*sx-.5),Math.max(1.5,rowH-.5))});g.globalAlpha=1;
 parts.forEach((p,i)=>{if(p.bass){g.fillStyle="rgba(150,150,150,.8)";g.fillRect(i*sx,H-9,Math.max(1,sx),2)}if(p.drum){g.fillStyle=["","#d86a5a","#e8d48a","#9ac8e8"][p.drum];g.fillRect(i*sx,H-5,Math.max(1.5,sx),4)}});
 const c=cv.getContext("2d");let last=-1;
 const paint=p=>{last=p;c.clearRect(0,0,W,H);c.drawImage(base,0,0);if(p>=0){c.fillStyle="rgba(255,255,255,.9)";c.fillRect(p*sx-1,0,2,H)}};paint(-1);
 const seek=e=>{const r=cv.getBoundingClientRect();onSeek(Math.max(0,Math.min(n-1,Math.floor((e.clientX-r.left)/r.width*n))))};
 cv.onclick=seek;cv.onmousemove=e=>{const r=cv.getBoundingClientRect(),i=Math.floor((e.clientX-r.left)/r.width*n),m=Math.round(hi-((e.clientY-r.top)/r.height*H)/rowH+0),hit=notes.find(x=>i>=x.a&&i<x.b&&Math.abs(x.m-m)<=1);showTip(hit?NOTE[hit.m%12]+(Math.floor(hit.m/12)-1):"click to play from here",e.clientX,e.clientY)};cv.onmouseleave=hideTip;return{cv,paint}}


/* ---------- a piano you can play: click, drag across the keys, or use your computer keyboard ---------- */
function keyboardPanel(){
 const p=mk("div","panel"),kb=mk("div","kb"),C0=48,N=36,white=[0,2,4,5,7,9,11],keys={},held=new Set();p.append(mk("h3",null,"Play the piano"),mk("p",null,"Click the keys, drag across them, or tap with your computer keyboard (A S D F G H J for white keys, W E T Y U for black). Click the keyboard first so it listens."));
 let out=null;const play=async m=>{AC();await loadPiano();if(!PIANO.bufs)return;if(!out){out=ctx.createGain();out.gain.value=.5*SG("volume")/60;out.connect(ctx.destination)}const t=ctx.currentTime+.01;pianoVoice(ctx,m,t,t+.6,out,.9,[])};
 const down=m=>{if(held.has(m))return;held.add(m);keys[m].classList.add("on");play(m)},up=m=>{held.delete(m);keys[m].classList.remove("on")};
 let wi=0;for(let m=C0;m<C0+N;m++){const w=white.includes(m%12);if(w){const k=mk("div","w");k.append(mk("span",null,m%12===0?"C"+(Math.floor(m/12)-1):""));kb.append(k);keys[m]=k;k.dataset.m=m;wi++}}
 const total=wi;wi=0;for(let m=C0;m<C0+N;m++){if(white.includes(m%12)){wi++;continue}const k=mk("div","b");k.style.left=(wi/total*100-1.8)+"%";kb.append(k);keys[m]=k;k.dataset.m=m}
 const pick=e=>{const el=document.elementFromPoint(e.clientX,e.clientY);return el&&el.dataset&&el.dataset.m?+el.dataset.m:null};
 let cur=null;kb.onpointerdown=e=>{const m=pick(e);if(m!=null){cur=m;down(m);kb.setPointerCapture(e.pointerId)}};
 kb.onpointermove=e=>{if(cur==null)return;const m=pick(e);if(m!=null&&m!==cur){up(cur);cur=m;down(m)}};
 kb.onpointerup=kb.onpointercancel=()=>{if(cur!=null){up(cur);cur=null}};
 const map={a:48,w:49,s:50,e:51,d:52,f:53,t:54,g:55,y:56,h:57,u:58,j:59,k:60,o:61,l:62,p:63,";":64};kb.tabIndex=0;kb.setAttribute("aria-label","Piano keyboard");
 kb.onkeydown=e=>{const m=map[e.key.toLowerCase()];if(m!=null&&keys[m]&&!e.repeat){e.preventDefault();e.stopPropagation();down(m+12)}};kb.onkeyup=e=>{const m=map[e.key.toLowerCase()];if(m!=null&&keys[m+12])up(m+12)};
 p.append(kb);return p}

/* ---------- the record player: the page ---------- */
function musicUI(host,toks,st,poly=false){
 MUSIC_POLY=poly;
 const mine=isOrig(toks),mx=mxFor(toks),playbackTiming=mine&&orig.stepTimes?orig:MUSIC_TIMING,pianoTranscription=pianoRecord||(mine&&orig.pianoOnly);
 if(INST==="match"&&!(mx&&mx.inst))INST=SG("inst")==="match"?"piano":SG("inst");loadPiano();
 
 if(playbackTiming){SPEED=1;autoSpeed=false}else if(mine)SPEED=orig.speed||SPEED;else if(autoSpeed){SPEED=(+SG("tempo")||100)/100;autoSpeed=false}
 const n=toks.length,wrap=mk("div","rec"),L=mk("div"),Rt=mk("div"),deck=mk("div","deck");
 const mkCanvas=SZ=>{const c=mk("canvas");c.width=c.height=SZ;return c};
 const acc=getComputedStyle(document.documentElement).getPropertyValue("--ac").trim()||"#c79a4a";
 const cfg={vinyl:SG("vinyl"),label:SG("labelColor"),progress:SG("progressColor"),accent:acc,detail:SG("grooveDetail"),shine:SG("shine"),showProgress:!!SG("showProgress")};
 const R=makeRecord(mkCanvas,toks,cfg),disc=mk("div","disc");
 R.base.className="plinth";R.gro.className="grv";R.prog.className="grv";R.shn.className="shn";R.arm.className="armc";
 disc.append(R.gro,R.prog);deck.append(R.base,disc,R.shn,R.arm);L.append(deck);
 let rot=0;const turn=a=>{rot=a;disc.style.transform="rotate("+a+"rad)"};turn(R.setPos(-1));
 const nowp=mk("div","nowp","Ready when you are."),tm=s=>Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0");
 const songTime=p=>{if(!playbackTiming||!playbackTiming.stepTimes)return p*STEP/SPEED;const i=Math.max(0,Math.min(n,Math.floor(p))),f=i<n?p-i:0;
  return(playbackTiming.stepTimes[i]+(i<n?(playbackTiming.stepTimes[i+1]-playbackTiming.stepTimes[i])*f:0))*(playbackTiming.stepSec||STEP/(playbackTiming.speed||SPEED))/SPEED};
 const roll=makeRoll(toks,poly,mx,i=>begin(i));
 const setPos=p=>{turn(R.setPos(p));roll.paint(p);const i=Math.min(n-1,Math.floor(p)),part=musicParts(toks[i],poly),ml=part.voices[0],bs=part.bass,dr=part.drum;
  nowp.textContent=tm(songTime(p))+" / "+tm(songTime(n))+"   "+(ml>=2?nm(ml):ml===1?"held":"rest")+(BAND?(bs?"  bass "+NOTE[(bs-1)%12]:"")+(dr?"  "+["","kick","snare","hat"][dr]:""):"")};
 let anim=0;const swing=(a,b,ms,done)=>{const id=++anim,t0=performance.now();const f=now=>{if(id!==anim)return;const q=Math.min(1,(now-t0)/ms),s=q*q*(3-2*q);R.drawArm(a+(b-a)*s,false);if(q<1)requestAnimationFrame(f);else done&&done()};requestAnimationFrame(f)};
 const pb=mk("button","btn pri","Play"),row=mk("div","row");
 const doneState=()=>{delete pb.dataset.on;pb.textContent="Play";R.setPos(-1);turn(R.rest());roll.paint(-1);nowp.textContent="Ready when you are."};
 const start=from=>{pb.dataset.on=1;pb.textContent="Stop";playToks(toks,setPos,()=>{if(pb.dataset.on)doneState()},undefined,from)};
 function begin(from){AC();if(from>0||!SG("needleDrop")||SG("motion")){start(from);return}
  pb.dataset.on=1;pb.textContent="Stop";swing(R.PARK,R.RO,520,()=>{if(pb.dataset.on){onStop=null;delete pb.dataset.on;start(0)}});onStop=()=>{anim++;doneState()}}
 pb.onclick=async()=>{AC();if(pb.dataset.on){stopAudio();return}await loadPiano();begin(0)};
 deck.title="Click the record to play or stop";deck.onclick=()=>pb.onclick();
 const si=mk("select");si.setAttribute("aria-label","Instrument");
 INST_NAMES.forEach(([x,t])=>{if(x==="match"&&!(mx&&mx.inst))return;si.append(new Option(t,x,x===INST,x===INST))});si.onchange=()=>INST=si.value;
 const sp=mk("input"),spv=mk("span","setv");sp.type="range";sp.min=25;sp.max=200;sp.step=5;sp.value=Math.round(SPEED*100);spv.textContent=sp.value+"%";sp.style.width="110px";sp.setAttribute("aria-label","Tempo");sp.oninput=()=>{SPEED=sp.value/100;spv.textContent=sp.value+"%"};
 const chk=(t,get,set)=>{const l=mk("label"),c=mk("input");c.type="checkbox";c.checked=get();c.onchange=()=>set(c.checked);l.append(c," "+t);return l};
 row.append(pb,si,mk("span",null,"tempo"),sp,spv);
 const row2=mk("div","row"),loopCheck=chk("Loop",()=>!!SG("loop"),z=>{SET.loop=z;saveSet()});
 const hasBand=toks.some(t=>{const p=musicParts(t,poly);return p.bass||p.drum});
 if(hasBand)row2.append(chk("Bass and drums",()=>BAND,z=>BAND=z));
 row2.append(chk("Chords underneath",()=>CHORDS,z=>CHORDS=z),loopCheck);
 if(tuneSel){const u=TUNES[tuneSel.i],tt=[];let tok=tuneSel.k;u.ns.slice(0,Math.max(2,Math.min(u.len,tuneSel.c||u.len))).forEach(([mm,d],q)=>{if(q)tok+=u.iv[q-1];tt.push(tok);for(let z=1;z<d;z++)tt.push(1)});
  const pt=mk("button","btn","Hear "+u.n+" with its real rhythm");pt.onclick=()=>{if(pt.dataset.on){stopAudio();return}doneState();stopAudio();pt.dataset.on=1;pt.textContent="Stop";playToks(tt,()=>{},()=>{delete pt.dataset.on;pt.textContent="Hear "+u.n+" with its real rhythm"},1)};row2.append(pt)}
 if(mine&&orig.exact)Rt.append(notePlayerPanel(orig.exact,"Every sound as notes ("+orig.exact.length.toLocaleString()+")","This plays all of them at their real times, with no limit on how many sound at once. The record below is a simplified version that fits in a link.",orig.buf,orig.s,orig.secs));
 Rt.append(row,row2,roll.cv,nowp);
 /* how close it sounds, and the original to compare against */
 if(mine){const po=mk("button","btn","Hear the original"),idle=()=>{po.textContent="Hear the original"};
  po.onclick=()=>{AC();if(po.dataset.on){stopAudio();return}stopAudio();
   const b=orig.buf,off=Math.max(0,Math.min(orig.s,b.duration-.1)),dur=Math.max(.1,Math.min(orig.secs,b.duration-off)),s=ctx.createBufferSource(),g=ctx.createGain();
   g.gain.value=.5*SG("volume")/60;s.buffer=b;s.connect(g);g.connect(ctx.destination);
   po.dataset.on=1;po.textContent="Stop the original";nodes=[s];onStop=()=>{delete po.dataset.on;idle()};
   s.onended=()=>{if(nodes&&nodes[0]===s){nodes=null;const f=onStop;onStop=null;f&&f()}};s.start(0,off,dur)};
  row2.append(po);
  if(orig.score)Rt.append(matchPanel(orig.score))}
 else if(mx&&mx.inst)Rt.append(mk("p","fine","This record carries the tone, tuning and loudness of the recording it came from, so it plays back closer to the original than a plain record would."));
 /* save it */
 const sv=mk("div","acts");const bm=mk("button","btn","Save as MIDI"),bw=mk("button","btn","Save as WAV");
 bm.onclick=()=>{const m=makeMidi(toks,mine&&orig.stepSec?orig.stepSec:STEP/SPEED,mx,playbackTiming);if(m)saveBlob(new Blob([m],{type:"audio/midi"}),"babel-record.mid");else st.textContent="Nothing to save: this record is silent."};
 bw.onclick=async()=>{bw.disabled=true;bw.textContent="Rendering...";try{const rb=await renderToks(toks,{rate:44100,mx,timing:playbackTiming,spd:playbackTiming?1:SPEED,poly,inst:INST,chords:false});saveBlob(wavBlob(rb.getChannelData(0),rb.sampleRate),"babel-record.wav")}catch(e){st.textContent="That didn't render. Try a shorter record."}bw.disabled=false;bw.textContent="Save as WAV"};
 sv.append(bm,bw);Rt.append(sv);
 if(SG("showNotes")){const held=new Array(poly?MUSIC_VOICES:1).fill(null),text=toks.map(t=>{const voices=musicParts(t,poly).voices,notes=[];
   for(let v=0;v<held.length;v++){if(voices[v]===0)held[v]=null;else if(voices[v]>=2)held[v]=voices[v];if(held[v]!==null)notes.push(nm(held[v]))}
   return notes.length?notes.join("+"):"."}).join(" ");winText(Rt,text,"mono")}
 /* audio to notes */
 const mp=mk("div","panel music-import");mp.append(mk("h3",null,"Turn a song into a record"),mk("p",null,"Pick an audio file and a stretch of it. I'll work out the beat and the notes, try a few different readings, and keep the one that sounds closest to your clip. Nothing leaves your device."));
 const f=mk("input");f.type="file";f.accept="audio/*,.mp3,.wav";f.setAttribute("aria-label","Choose an audio file");
 const s0=mk("input");s0.type="number";s0.min=0;s0.value=0;s0.style.width="100%";s0.setAttribute("aria-label","Start time in seconds");
 const ln=mk("select");[4,8,16,32,60,120].forEach(x=>ln.append(new Option(x+" seconds",x,x===16,x===16)));ln.setAttribute("aria-label","Length to convert");
 const go=mk("button","btn pri","Make the record"),info=mk("div","music-status note","Choose a file to start."),progress=mk("progress","music-progress");
 info.setAttribute("role","status");info.setAttribute("aria-live","polite");progress.max=1;progress.value=0;progress.hidden=true;progress.setAttribute("aria-label","Progress");let buf=null;
 const loadAudio=async file=>{info.textContent="Opening "+file.name+"...";try{buf=await AC().decodeAudioData(await file.arrayBuffer());s0.max=Math.max(0,Math.floor(buf.duration-1));info.textContent=file.name+" is loaded ("+Math.round(buf.duration)+" seconds). Pick where to start and hit the button."}catch(e){buf=null;info.textContent="That file wouldn't open. An mp3 or wav usually does."}};
 f.onchange=()=>f.files[0]&&loadAudio(f.files[0]);
 let latest=null;
 const open=t=>nav(link("musicpoly",toSeed(t,ROOMS.musicpoly.K,false),{a:0,b:t.length})+musicLinkExtras(orig,!!(orig&&orig.pianoOnly&&!t.mx.inst),t.mx));
 go.onclick=async()=>{if(!buf){info.textContent="Pick an audio file first.";return}
  const secs=Math.min(+ln.value,Math.floor(buf.duration)||1),s=Math.min(Math.max(0,+s0.value||0),Math.max(0,buf.duration-secs));s0.value=s;go.disabled=true;progress.hidden=false;progress.value=0;
  try{let mode=SG("transSens");if(mode==="exact"||mode==="high")mode="every";let t,an;
   const cb=(p,msg)=>{progress.value=p;info.textContent=(msg||"Listening")+"... "+Math.round(p*100)+"%"};
   let exact=null;
   if(mode==="every"){an=await analyzeClip(buf,s,secs,p=>cb(p*.8,"Listening"),256,4096);exact=everyNotes(an,{floorDb:38});t=tokensFromAnalysis(an,TCFG.high);t.an=an;cb(.95,"Writing it down")}
   else if(mode==="best"){an=await analyzeClip(buf,s,secs,p=>cb(p*.5,"Listening"));t=await autoMatch(an,buf,(p,m)=>cb(.5+p*.5,m));t.an=an}
   else{t=await transcribe(buf,s,secs,p=>cb(p,"Listening"),mode);an=t.an}
   if(!t.some(x=>x)&&!(exact&&exact.length)){progress.hidden=true;info.textContent="I couldn't hear any clear notes in that stretch. Try a louder part, or the Catch-more reading.";go.disabled=false;return}
   const spd=Math.max(.25,Math.min(2,STEP/an.stepSec));SPEED=spd;autoSpeed=true;
   orig={buf,s:an.t0,secs:an.secs,sub:an.sub,bpm:an.bpm,speed:spd,stepTimes:an.stepTimes,stepSec:an.stepSec,toks:t,pianoOnly:false,mx:t.mx,score:t.score||null,an,exact,name:(f.files[0]&&f.files[0].name)||"song"};latest=t;
   progress.value=1;info.textContent="Done. Opening your record.";go.disabled=false;open(t)}
  catch(e){progress.hidden=true;info.textContent="That didn't work: "+(e&&e.message?e.message:"something went wrong with the audio")+".";go.disabled=false}};
 const field=(title,control)=>{const l=mk("label","music-field");l.append(mk("span",null,title),control);return l};
 const r2=mk("div","music-fields");r2.append(field("Your audio file",f),field("Start at (seconds)",s0),field("How much to listen to",ln));
 const selOf=(k,opts)=>{const s=mk("select");opts.forEach(([x,t])=>s.append(new Option(t,x,x===SG(k),x===SG(k))));s.onchange=()=>{SET[k]=s.value;saveSet();updateHelp()};return s};
 const ck=(t,k)=>{const l=mk("label"),c=mk("input");c.type="checkbox";c.checked=!!SG(k);c.onchange=()=>{SET[k]=c.checked;saveSet()};l.append(c," "+t);return l};
 const sens=selOf("transSens",TRANS_MODES),sensHelp=mk("p","fine"),updateHelp=()=>{sensHelp.textContent=TRANS_HELP[SG("transSens")]||TRANS_HELP.every};updateHelp();if(!TRANS_MODES.some(x=>x[0]===SG("transSens")))sens.value="every";
 const adv=mk("details","music-advanced");adv.append(mk("summary",null,"More options"));const ex=mk("div","music-fields");ex.append(ck("Snap stray notes to the song's key","transSnap"));adv.append(ex);
 const makeRow=mk("div","music-make");makeRow.append(go);
 const again=mk("button","btn","Keep the original sound instead");again.onclick=()=>nav("?m=sound");
 const mi=mk("input");mi.type="file";mi.accept=".mid,.midi,audio/midi";mi.setAttribute("aria-label","Choose a MIDI file");const midiHost=mk("div");
 mi.onchange=async()=>{const fl=mi.files[0];if(!fl)return;midiHost.innerHTML="";try{const list=parseMidi(await fl.arrayBuffer());if(!list.length)throw new Error("it has no notes");midiHost.append(notePlayerPanel(list,fl.name+" ("+list.length.toLocaleString()+" notes)","Played with the Babel piano, so you can compare it with your own conversions.",null))}catch(e){midiHost.append(mk("p","note","I couldn't read that MIDI file: "+e.message+"."))}};
 mp.append(field("How should I listen?",sens),sensHelp,r2,adv,makeRow,progress,info,again,mk("h3",null,"Already have a MIDI file?"),mk("p",null,"Open it here to hear it on the Babel piano and see every note."),field("A MIDI file",mi),midiHost);
 /* monkeys */
 const mk2=mk("div","panel");mk2.append(mk("h3",null,"Monkeys at the piano"),mk("p",null,"They mash keys at random as fast as your computer can go. Now and then a few notes in a row happen to match the start of a song you know. The bars show the longest match so far. Open jumps to the record where it happened, and Hear plays that bit with its real rhythm."));
 const tr=mk("div","note"),mb=mk("button","btn pri","Let them loose");
 const rows=TUNES.map(u=>{const r=mk("div","tune"),bar=mk("div","bkr"),fill=mk("i"),c=mk("span"),b=mk("button","btn sm","Open");bar.append(fill);b.onclick=()=>{if(!u.rec)return;SPEED=.5;nav(link("music",toSeed(u.rec,1976,false),{a:u.pos,b:u.pos+u.best})+"&t="+u.ti+"&k="+u.rec[u.pos]+"&c="+u.best)};r.append(mk("span",null,u.n),bar,c,b);mk2.append(r);return{fill,c,u}});
 const upd=()=>{tr.textContent=monkey.tries.toLocaleString()+" tries so far";rows.forEach(x=>{x.fill.style.width=x.u.best/x.u.len*100+"%";x.c.textContent=x.u.best+"/"+x.u.len})};
 mb.onclick=()=>{if(monkey.on){stopMonkey();mb.textContent="Let them loose";return}monkey.on=true;mb.textContent="Stop";monkeyLoop(upd)};
 const rm=mk("button","btn","Start over");rm.onclick=()=>{monkey.tries=0;TUNES.forEach(u=>{u.best=0;u.rec=null});upd()};
 const mrow=mk("div","row");mrow.append(mb,rm,mk("span",null,"keys"),selOf("monkeyKeys",[["white","White keys only"],["pent","Pentatonic"],["all","Every key"]]),mk("span",null,"effort"),selOf("monkeyPower",[["6","Gentle"],["14","Normal"],["40","All out"]]));
 mk2.append(mrow,tr);upd();
 Rt.append(mp,keyboardPanel(),mk2);wrap.append(L,Rt);host.append(wrap);
 if(pending){const p0=pending;pending=null;loadAudio(p0)}
 if(hl&&mine)st.textContent="Written down at about "+Math.round(orig.bpm)+" beats a minute. A transcription is never the recording itself, so press \"Hear the original\" to compare.";
 if(SG("autoplay")&&!mine&&!tuneSel)setTimeout(()=>pb.onclick(),300)}
const TRANS_MODES=[["every","Every sound, as notes (most notes)"],["best","Closest match"],["normal","Balanced"],["low","Melody only"]];
const TRANS_HELP={every:"Turns everything it hears into notes: instruments, voices, even drums and noise. There is no cap on how many notes sound at once and no beat grid, so a song you know is still easy to pick out. The record you can share is a simplified copy.",best:"Tries several readings of your clip, plays each one back against the original, and keeps the closest. Takes a bit longer.",normal:"A clear lead plus a few strong notes at once, with bass and drums.",low:"Just the main tune, with bass and drums. Quiet background sound gets left out.",high:"As many notes as I can find, all on piano. You may hear a few extra notes from background noise."};
/* how close it sounds: a plain bar for each thing you can hear */
function matchPanel(sc){
 const p=mk("div","panel match"),pct=v=>Math.round(Math.max(0,Math.min(1,v))*100);
 p.append(mk("h3",null,"How close is it? "+pct(sc.total)+"%"),mk("p",null,"This compares the rebuilt song with your clip, moment by moment. 100% would be the recording itself. A record can only hold notes, so tone and room sound will always differ a little."));
 [["Right notes",sc.chroma],["Tone",sc.tone],["Loudness",sc.loud],["Hits and rhythm",sc.hits]].forEach(([t,v])=>{const r=mk("div","tune"),bar=mk("div","bkr"),fill=mk("i");fill.style.width=pct(v)+"%";bar.append(fill);r.append(mk("span",null,t),bar,mk("span",null,pct(v)+"%"),mk("span"));p.append(r)});
 return p}

/* ---------- monkeys ---------- */
/* each note is [midi, length in 1/8 second steps]: 4 is a quarter note, 2 an eighth, 8 a half */
const TUNES=[["Happy Birthday",[[67,3],[67,1],[69,4],[67,4],[72,4],[71,8]]],["Twinkle Twinkle",[[60,4],[60,4],[67,4],[67,4],[69,4],[69,4],[67,8]]],["Mary Had a Little Lamb",[[64,4],[62,4],[60,4],[62,4],[64,4],[64,4],[64,8]]],["Frere Jacques",[[60,4],[62,4],[64,4],[60,4],[60,4],[62,4],[64,4],[60,4]]],["Row Your Boat",[[60,6],[60,6],[60,4],[62,2],[64,8],[64,4],[62,2],[64,4]]],["Ode to Joy",[[64,4],[64,4],[65,4],[67,4],[67,4],[65,4],[64,4],[62,4]]]].map(([n,ns],ti)=>({n,ns,ti,iv:ns.slice(1).map((x,i)=>x[0]-ns[i][0]),len:ns.length,best:0,rec:null,pos:0}));
const PCS={white:[0,2,4,5,7,9,11],pent:[0,2,4,7,9],all:[0,1,2,3,4,5,6,7,8,9,10,11]};
const byFirst=new Map();TUNES.forEach(u=>{const k=u.iv[0];if(!byFirst.has(k))byFirst.set(k,[]);byFirst.get(k).push(u)});
const monkey={on:false,tries:0};
function stopMonkey(){monkey.on=false}
function monkeyLoop(ui){
 if(!monkey.on)return;const budget=+SG("monkeyPower")||14,pcs=PCS[SG("monkeyKeys")]||PCS.white,POOL=[];for(let m=48;m<=83;m++)if(pcs.includes(m%12))POOL.push(2+m-48);
 const t=performance.now(),r=new Uint8Array(256);
 while(performance.now()-t<budget){for(let b=0;b<100;b++){
  for(let i=0;i<256;i++)r[i]=POOL[Math.random()*POOL.length|0];monkey.tries++;
  for(let i=0;i<255;i++){const L=byFirst.get(r[i+1]-r[i]);if(!L)continue;
   for(const u of L){let j=2;while(j<u.len&&i+j<256&&r[i+j]-r[i+j-1]===u.iv[j-1])j++;if(j>u.best){u.best=j;u.rec=Array.from(r);u.pos=i}}}}}
 ui();setTimeout(()=>monkeyLoop(ui),0)}


function makeMidi(toks,stepSec,mx,timing){
 if(!toks.length||!Number.isFinite(stepSec)||stepSec<=0)return null;
 const events=[],n=toks.length,P=toks.map(t=>musicParts(t,true)),tickAt=i=>Math.round((timing&&timing.stepTimes&&timing.stepTimes.length===n+1?timing.stepTimes[i]:i)*stepSec*960);
 const addNote=(a,b,note,vel)=>{if(b<=a||note<0||note>127)return;const on=tickAt(a),off=Math.max(on+1,tickAt(b));events.push({tick:on,order:1,data:[0x90,note,vel]},{tick:off,order:0,data:[0x80,note,0]})};
 const idx=new Map();let k=0;for(let i=0;i<n;i++)for(let l=0;l<MUSIC_VOICES;l++)if(P[i].voices[l]>=2)idx.set(i*8+l,k++);
 for(let l=0;l<MUSIC_VOICES;l++)for(let i=0;i<n;i++){const code=P[i].voices[l];if(code<2)continue;let e=i+1;while(e<n&&P[e].voices[l]===1)e++;
  const j=idx.get(i*8+l),oc=mx&&mx.oct?12*(mx.oct[j]||0):0,v=mx&&mx.vel&&mx.vel[j]!=null?Math.round(24+mx.vel[j]/63*100):88;addNote(i,e,code-2+48+oc,Math.max(1,Math.min(127,v)))}
 for(let i=0;i<n;i++){const bass=P[i].bass,previous=i?P[i-1].bass:0;if(!bass||bass===previous)continue;let e=i+1;while(e<n&&P[e].bass===bass)e++;addNote(i,e,35+bass,80)}
 if(!events.length)return null;
 events.sort((a,b)=>a.tick-b.tick||a.order-b.order);
 const body=[0,0xff,0x51,3,0x07,0xa1,0x20,0,0xc0,0],pushVlq=value=>{let buffer=Math.max(0,value)|0,encoded=buffer&0x7f;while((buffer>>=7)){encoded=(encoded<<8)|((buffer&0x7f)|0x80)}while(true){body.push(encoded&0xff);if(encoded&0x80)encoded>>=8;else break}};
 let tick=0;for(const event of events){pushVlq(event.tick-tick);body.push(...event.data);tick=event.tick}
 pushVlq(Math.max(0,tickAt(n)-tick));body.push(0xff,0x2f,0);
 const header=[0x4d,0x54,0x68,0x64,0,0,0,6,0,0,0,1,1,0xe0,0x4d,0x54,0x72,0x6b],size=body.length;header.push(size>>>24&255,size>>>16&255,size>>>8&255,size&255);
 return new Uint8Array(header.concat(body))}
