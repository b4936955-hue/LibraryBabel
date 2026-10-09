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
 const wv=new Float32Array(n+2);{let last=0;for(let i=0;i<n;i++){const t=toks[i],ml=t%38;if(ml>=2)last=(ml-2)/35-.5;else if(ml===0)last=0;wv[i]=last*amp+(Math.floor(t/494)?amp*.3:0)}wv[n]=wv[n-1]||0;wv[n+1]=wv[n]}
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

/* ---------- the record player: the page ---------- */
function musicUI(host,toks,st){
 const mine=isOrig(toks);if(mine)SPEED=orig.speed||SPEED;else if(autoSpeed){SPEED=(+SG("tempo")||100)/100;autoSpeed=false}
 const n=toks.length,wrap=mk("div","rec"),L=mk("div"),Rt=mk("div"),deck=mk("div","deck");
 const mkCanvas=SZ=>{const c=mk("canvas");c.width=c.height=SZ;return c};
 const acc=getComputedStyle(document.documentElement).getPropertyValue("--ac").trim()||"#c79a4a";
 const cfg={vinyl:SG("vinyl"),label:SG("labelColor"),progress:SG("progressColor"),accent:acc,detail:SG("grooveDetail"),shine:SG("shine"),showProgress:!!SG("showProgress")};
 const R=makeRecord(mkCanvas,toks,cfg),disc=mk("div","disc");
 R.base.className="plinth";R.gro.className="grv";R.prog.className="grv";R.shn.className="shn";R.arm.className="armc";
 disc.append(R.gro,R.prog);deck.append(R.base,disc,R.shn,R.arm);L.append(deck);
 let rot=0;const turn=a=>{rot=a;disc.style.transform="rotate("+a+"rad)"};
 turn(R.setPos(-1));
 const nowp=mk("div","nowp","Ready when you are."),tm=s=>Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0");
 const songTime=p=>{if(!mine||!orig.stepTimes)return p*STEP/SPEED;const i=Math.max(0,Math.min(n,Math.floor(p))),f=i<n?p-i:0;
  return(orig.stepTimes[i]+(i<n?(orig.stepTimes[i+1]-orig.stepTimes[i])*f:0))*STEP/SPEED};
 const setPos=p=>{turn(R.setPos(p));const i=Math.min(n-1,Math.floor(p)),t=toks[i],ml=t%38,bs=Math.floor(t/38)%13,dr=Math.floor(t/494);
  nowp.textContent=tm(songTime(p))+" / "+tm(songTime(n))+"   "+(ml>=2?nm(ml):ml===1?"held":"rest")+(BAND?(bs?"  bass "+NOTE[(bs-1)%12]:"")+(dr?"  "+["","kick","snare","hat"][dr]:""):"")};
 /* the needle swings down and back */
 let anim=0;const swing=(a,b,ms,done)=>{const id=++anim,t0=performance.now();const f=now=>{if(id!==anim)return;const q=Math.min(1,(now-t0)/ms),s=q*q*(3-2*q);R.drawArm(a+(b-a)*s,false);if(q<1)requestAnimationFrame(f);else done&&done()};requestAnimationFrame(f)};
 const pb=mk("button","btn pri","Play"),row=mk("div","row");
 const doneState=()=>{delete pb.dataset.on;pb.textContent="Play";const r=R.rad(0);R.setPos(-1);turn(R.rest());nowp.textContent="Ready when you are."};
 const start=()=>{pb.dataset.on=1;pb.textContent="Stop";playToks(toks,setPos,()=>{if(pb.dataset.on)doneState()})};
 pb.onclick=()=>{AC();if(pb.dataset.on){stopAudio();return}
  if(SG("needleDrop")&&!SG("motion")){pb.dataset.on=1;pb.textContent="Stop";swing(R.PARK,R.RO,520,()=>{if(pb.dataset.on){onStop=null;delete pb.dataset.on;start()}});onStop=()=>{anim++;doneState()}}else start()};
 const si=mk("select"),sp=mk("input"),spv=mk("span","setv");
 INST_NAMES.forEach(([x,t])=>si.append(new Option(t,x,x===INST,x===INST)));si.onchange=()=>INST=si.value;
 sp.type="range";sp.min=25;sp.max=200;sp.step=5;sp.value=Math.round(SPEED*100);spv.textContent=sp.value+"%";sp.style.width="110px";sp.oninput=()=>{SPEED=sp.value/100;spv.textContent=sp.value+"%"};
 const chk=(t,get,set)=>{const l=mk("label"),c=mk("input");c.type="checkbox";c.checked=get();c.onchange=()=>set(c.checked);l.append(c," "+t);return l};
 row.append(pb,si,mk("span",null,"tempo"),sp,spv);
 const row2=mk("div","row");row2.append(chk("Bass and drums",()=>BAND,z=>BAND=z),chk("Chords underneath",()=>CHORDS,z=>CHORDS=z),chk("Loop",()=>!!SG("loop"),z=>{SET.loop=z;saveSet()}));
 if(tuneSel){const u=TUNES[tuneSel.i],tt=[];let tok=tuneSel.k;u.ns.slice(0,Math.max(2,Math.min(u.len,tuneSel.c||u.len))).forEach(([mm,d],q)=>{if(q)tok+=u.iv[q-1];tt.push(tok);for(let z=1;z<d;z++)tt.push(1)});
  const pt=mk("button","btn","Hear "+u.n+" with its real rhythm");pt.onclick=()=>{if(pt.dataset.on){stopAudio();return}doneState();stopAudio();pt.dataset.on=1;pt.textContent="Stop";playToks(tt,()=>{},()=>{delete pt.dataset.on;pt.textContent="Hear "+u.n+" with its real rhythm"},1)};row2.append(pt)}
 if(mine){const po=mk("button","btn","Play the original clip"),idle=()=>{po.textContent="Play the original clip"};
  po.onclick=()=>{AC();if(po.dataset.on){stopAudio();return}stopAudio();
   const b=orig.buf,off=Math.max(0,Math.min(orig.s,b.duration-.1)),dur=Math.max(.1,Math.min(orig.secs,b.duration-off)),s=ctx.createBufferSource(),g=ctx.createGain();
   g.gain.value=.35*SG("volume")/60;s.buffer=b;s.connect(g);g.connect(ctx.destination);
   po.dataset.on=1;po.textContent="Stop the original";nodes=[s];onStop=()=>{delete po.dataset.on;idle()};
   s.onended=()=>{if(nodes&&nodes[0]===s){nodes=null;const f=onStop;onStop=null;f&&f()}};
   s.start(0,off,dur)};row2.append(po)}
 Rt.append(row,row2,nowp);if(SG("showNotes"))winText(Rt,toks.map(t=>nm(t%38)).join(" "),"mono");
 /* mp3 to notes */
 const mp=mk("div","panel");mp.append(mk("h3",null,"Got an mp3?"),mk("p",null,"Pick a song and a spot in it, up to two minutes. I'll find the beat, write down the notes that get struck and open them as a record, with the tempo matched to the song. A record only holds a melody, a bass line and a drum beat, so what you get back is a plain cover of the tune and not the recording itself. If you want the actual sound, use the Sound room."));
 const f=mk("input");f.type="file";f.accept="audio/*,.mp3";const s0=mk("input");s0.type="number";s0.min=0;s0.value=0;s0.style.width="80px";
 const ln=mk("select");[4,8,16,32,60,120].forEach(x=>ln.append(new Option(x+" seconds",x,x===16,x===16)));
 const go=mk("button","btn pri","Make a record"),info=mk("div","note");let buf=null;
 const loadAudio=async file=>{info.textContent="Reading the file...";try{buf=await AC().decodeAudioData(await file.arrayBuffer());s0.max=Math.max(0,Math.floor(buf.duration-1));info.textContent="Got it. It's "+Math.round(buf.duration)+" seconds long. Choose where to start and hit Make a record."}catch(e){buf=null;info.textContent="I couldn't read that file. An mp3 or a wav should work."}};
 f.onchange=()=>f.files[0]&&loadAudio(f.files[0]);
 go.onclick=async()=>{if(!buf){info.textContent="Add an mp3 first.";return}
  const secs=Math.min(+ln.value,Math.floor(buf.duration)||1),s=Math.min(Math.max(0,+s0.value||0),Math.max(0,buf.duration-secs));s0.value=s;go.disabled=true;
  try{const t=await transcribe(buf,s,secs,p=>info.textContent="Listening... "+Math.round(p*100)+"%");const spd=Math.max(.25,Math.min(2,STEP/t.stepSec));SPEED=spd;autoSpeed=true;orig={buf,s:t.t0,secs:t.secs,sub:t.sub,bpm:t.bpm,speed:spd,stepTimes:t.stepTimes,toks:t};keep=true;nav(link("music",toSeed(t,1976,false),{a:0,b:t.length}))}catch(e){info.textContent="Something went wrong while listening: "+e.message;go.disabled=false}};
 const r2=mk("div","row");r2.append(f,mk("span",null,"start at"),s0,mk("span",null,"sec, for"),ln,go);
 const r3=mk("div","row"),selOf=(k,opts)=>{const s=mk("select");opts.forEach(([x,t])=>s.append(new Option(t,x,x===SG(k),x===SG(k))));s.onchange=()=>{SET[k]=s.value;saveSet()};return s};
 const ck=(t,k)=>{const l=mk("label"),c=mk("input");c.type="checkbox";c.checked=!!SG(k);c.onchange=()=>{SET[k]=c.checked;saveSet()};l.append(c," "+t);return l};
 r3.append(mk("span",null,"How many notes to catch"),selOf("transSens",[["low","Only the clear ones"],["normal","Normal"],["high","As many as possible"]]),selOf("transOct",[["auto","Move the tune into range"],["off","Leave octaves alone"]]),ck("Snap to the key","transSnap"),ck("Hear the bass","transBass"),ck("Hear the drums","transDrums"));
 const ts=mk("button","btn","Use the Sound room instead");ts.onclick=()=>nav("?m=sound");mp.append(r2,r3,info,ts);
 /* monkeys */
 const mk2=mk("div","panel");mk2.append(mk("h3",null,"Monkeys at the piano"),mk("p",null,"They just mash keys at random as fast as your computer can go. Every so often a few notes in a row happen to match the start of a song you know. The bars show the longest match any record has had so far. Open takes you to the record where it happened, and Hear plays that bit with its real rhythm."));
 const tr=mk("div","note"),mb=mk("button","btn pri","Let them loose");
 const rows=TUNES.map(u=>{const r=mk("div","tune"),bar=mk("div","bkr"),fill=mk("i"),c=mk("span"),b=mk("button","btn sm","Open");bar.append(fill);b.onclick=()=>{if(!u.rec)return;SPEED=.5;nav(link("music",toSeed(u.rec,1976,false),{a:u.pos,b:u.pos+u.best})+"&t="+u.ti+"&k="+u.rec[u.pos]+"&c="+u.best)};r.append(mk("span",null,u.n),bar,c,b);mk2.append(r);return{fill,c,u}});
 const upd=()=>{tr.textContent=monkey.tries.toLocaleString()+" tries so far";rows.forEach(x=>{x.fill.style.width=x.u.best/x.u.len*100+"%";x.c.textContent=x.u.best+"/"+x.u.len})};
 mb.onclick=()=>{if(monkey.on){stopMonkey();mb.textContent="Let them loose";return}monkey.on=true;mb.textContent="Stop";monkeyLoop(upd)};
 const rm=mk("button","btn","Start over");rm.onclick=()=>{monkey.tries=0;TUNES.forEach(u=>{u.best=0;u.rec=null});upd()};
 const mrow=mk("div","row");mrow.append(mb,rm,mk("span",null,"keys"),selOf("monkeyKeys",[["white","White keys only"],["pent","Pentatonic"],["all","Every key"]]),mk("span",null,"effort"),selOf("monkeyPower",[["6","Gentle"],["14","Normal"],["40","All out"]]));
 mk2.append(mrow,tr);upd();
 Rt.append(mp,mk2);wrap.append(L,Rt);host.append(wrap);
 if(pending){const p0=pending;pending=null;loadAudio(p0)}
 if(hl&&mine)st.textContent="That's your clip written down as notes, at about "+Math.round(orig.bpm)+" beats a minute. It won't sound like the original, but every note here is one I heard.";
 if(SG("autoplay")&&!mine&&!tuneSel)setTimeout(()=>pb.onclick(),300)}

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

/* ---------- mp3 -> notes ---------- */
/* The listener works in four passes.
   1. Find the beat. Onsets are tracked, the tempo is fitted, and the steps are laid on the real beat (sixteenths, or eighths for fast songs),
      so the rhythm lines up with the song instead of with a fixed clock. The player is slowed or sped up to match.
   2. Melody: a note is only written where a NEW note is struck (the spectrum changes), and the highest strong new voice wins.
      Sustained pads can't take over, because a pitch that was already ringing isn't new. A note is held while it keeps ringing.
   3. Bass: the lowest strong voice, as one of 12 pitch names.
   4. Drums: sudden jumps in low, mid and high frequencies, right on the steps. */
function fft(re,im){const n=re.length;
 for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){let t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t}}
 for(let len=2;len<=n;len<<=1){const a=-2*Math.PI/len,wr=Math.cos(a),wi=Math.sin(a),h=len>>1;
  for(let i=0;i<n;i+=len){let cr=1,ci=0;for(let k=0;k<h;k++){const u=i+k,w=u+h,tr=re[w]*cr-im[w]*ci,ti=re[w]*ci+im[w]*cr;re[w]=re[u]-tr;im[w]=im[u]-ti;re[u]+=tr;im[u]+=ti;const t=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=t}}}}
const HANN={};
/* square root of the magnitude spectrum of N samples centred on sample c */
function spec(x,c,N,out){const re=new Float32Array(N),im=new Float32Array(N),w=HANN[N]||(HANN[N]=Float32Array.from({length:N},(_,i)=>.5-.5*Math.cos(2*Math.PI*i/N)));
 for(let i=0;i<N;i++){const k=c-N/2+i;re[i]=k>=0&&k<x.length?x[k]*w[i]:0}
 fft(re,im);for(let i=0;i<N/2;i++)out[i]=Math.sqrt(Math.hypot(re[i],im[i]))}
const mf=(m,tu)=>440*Math.pow(2,(m-69)/12+(tu||0)/1200);
const HW=[1,.85,.7,.55,.42,.3];
const MLO=40,MHI=100;
/* peaks stand out: divide by the local average over about a quarter of the frequency, keep what rises above it */
function whiten(S,out){const n=S.length,P=new Float64Array(n+1);for(let i=0;i<n;i++)P[i+1]=P[i]+S[i];
 for(let b=0;b<n;b++){const h=Math.max(5,Math.round(b*.22)),lo=Math.max(0,b-h),hi=Math.min(n,b+h+1),m=(P[hi]-P[lo])/(hi-lo);out[b]=Math.min(8,Math.max(0,S[b]/(m+1e-9)-1.1))}
 /* keep only real peaks: a local maximum that stands well above its surroundings */
 const t=Float32Array.from(out);for(let b=0;b<n;b++){let ok=t[b]>=GATE;for(let d=-2;d<=2&&ok;d++){const q=b+d;if(q>=0&&q<n&&t[q]>t[b])ok=false}out[b]=ok?t[b]:0}}
const GATE=1.2;
function band(S,sr,N,f){const lo=Math.max(1,Math.floor(f*.9715*N/sr)),hi=Math.min(S.length-2,Math.ceil(f*1.0293*N/sr));let m=0;for(let b=lo;b<=hi;b++)if(S[b]>m)m=S[b];return m}
function sal(S,sr,N,m,tu){const f=mf(m,tu);let t=0;for(let h=1;h<=HW.length;h++){if(f*h*1.03>sr/2)break;t+=HW[h-1]*band(S,sr,N,f*h)}return t}
function wipe(S,sr,N,m,tu){const f=mf(m,tu);for(let h=1;h<=HW.length;h++){const lo=Math.max(1,Math.floor(f*h*.9715*N/sr)),hi=Math.min(S.length-2,Math.ceil(f*h*1.0293*N/sr));for(let b=lo;b<=hi;b++)S[b]=0}}
const KEYMAJ=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88],KEYMIN=[6.33,2.68,3.52,5.38,2.6,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
const pctl=(a,p)=>{const s=Array.from(a).sort((u,v)=>u-v);return s.length?s[Math.min(s.length-1,Math.floor(p*s.length))]:0};

/* ---- pass 1: the beat ---- */
function onsetEnv(x,sr){
 const N=1024,H=256,nb=N/2,nf=Math.max(0,Math.floor((x.length-N)/H)),fps=sr/H,edges=[2,6,12,24,48,96,190,372,512],NBD=edges.length-1;
 const env=new Float32Array(nf),low=new Float32Array(nf),prev=new Float32Array(nb),S=new Float32Array(nb);
 const lo=[];for(let k=0;k<NBD;k++)lo.push(0);
 const raw=[];
 for(let f=0;f<nf;f++){spec(x,f*H+N/2,N,S);const v=new Float32Array(NBD);
  for(let k=0;k<NBD;k++){let s=0;for(let b=edges[k];b<edges[k+1];b++){const d=Math.log1p(40*S[b]*S[b])-Math.log1p(40*prev[b]*prev[b]);if(d>0)s+=d}v[k]=s/(edges[k+1]-edges[k])}
  prev.set(S);raw.push(v)}
 const sc=new Float32Array(NBD);for(let k=0;k<NBD;k++){let m=0;for(let f=0;f<nf;f++)m+=raw[f][k];sc[k]=m/Math.max(1,nf)+1e-6}
 for(let f=0;f<nf;f++){let s=0;for(let k=0;k<NBD;k++)s+=raw[f][k]/sc[k];env[f]=s;low[f]=(raw[f][0]/sc[0]+raw[f][1]/sc[1]+raw[f][2]/sc[2])}
 const flat=a=>{const o=new Float32Array(a.length),w=Math.round(fps*.8);let acc=0,q=[];
  const P=new Float64Array(a.length+1);for(let i=0;i<a.length;i++)P[i+1]=P[i]+a[i];
  let sd=0;for(let i=0;i<a.length;i++){const l=Math.max(0,i-w),h=Math.min(a.length,i+w+1),m=(P[h]-P[l])/(h-l);o[i]=Math.max(0,a[i]-m)}
  let m=0;for(let i=0;i<o.length;i++)m+=o[i]*o[i];sd=Math.sqrt(m/Math.max(1,o.length))||1;for(let i=0;i<o.length;i++)o[i]/=sd;return o};
 return{env:flat(env),low:flat(low),fps}}
function pickTempo(env,fps){
 const n=env.length;let best=100,bs=-1;
 const lo=Math.floor(fps*60/190),hi=Math.ceil(fps*60/55),ac=new Float64Array(hi+2);
 for(let l=lo-1;l<=hi+1;l++){let s=0;for(let i=l;i<n;i++)s+=env[i]*env[i-l];ac[l]=s/Math.max(1,n-l)}
 const res=[];
 for(let l=lo;l<=hi;l++){const bpm=60*fps/l,pr=Math.exp(-.5*Math.pow(Math.log2(bpm/105)/.85,2));
  /* a real tempo also shows up at double and half the lag, so add those in */
  let s=ac[l]+.5*(l*2<=hi+1?ac[l*2]:0)+.25*(l*4<=hi+1?ac[l*4]:0);s*=pr;res.push([s,l]);if(s>bs){bs=s;best=l}}
 /* refine the lag to a fraction */
 const l=best,a=ac[l-1],b=ac[l],c=ac[l+1],d=a-2*b+c,fr=d<0?.5*(a-c)/d:0;return(l+Math.max(-.5,Math.min(.5,fr)))}
function trackBeats(env,fps,P){
 const n=env.length,C=new Float64Array(n),B=new Int32Array(n).fill(-1),alpha=100;
 for(let t=0;t<n;t++){let b=0,bj=-1;const lo=Math.max(0,Math.floor(t-2*P)),hi=Math.floor(t-P/2);
  for(let j=lo;j<=hi;j++){const d=Math.log((t-j)/P),s=C[j]-alpha*d*d;if(bj<0||s>b){b=s;bj=j}}
  if(bj<0){C[t]=env[t]}else{C[t]=env[t]+b;B[t]=bj}}
 let e=n-1,bv=-1e18;for(let t=Math.max(0,Math.floor(n-P));t<n;t++)if(C[t]>bv){bv=C[t];e=t}
 const out=[];for(let t=e;t>=0;t=B[t]){out.push(t);if(B[t]<0)break}return out.reverse()}
/* a straight line through the beats, ignoring the odd stray one */
function fitLine(ts){let a=ts[0],T=(ts[ts.length-1]-ts[0])/Math.max(1,ts.length-1),keep=ts.map((_,i)=>i);
 for(let it=0;it<4;it++){let sx=0,sy=0,sxx=0,sxy=0,m=keep.length;if(m<2)break;keep.forEach(k=>{sx+=k;sy+=ts[k];sxx+=k*k;sxy+=k*ts[k]});
  const den=m*sxx-sx*sx;if(!den)break;T=(m*sxy-sx*sy)/den;a=(sy-T*sx)/m;
  const res=ts.map((t,k)=>Math.abs(t-(a+T*k)));const lim=Math.max(.08*T,pctl(res,.75)*1.5);keep=ts.map((_,k)=>k).filter(k=>res[k]<=lim)}
 const res=ts.map((t,k)=>Math.abs(t-(a+T*k)));return{a,T,dev:pctl(res,.9)/T}}
function smoothBeatTimes(ts){
 const out=ts.map((t,i)=>{const lo=Math.max(0,i-2),hi=Math.min(ts.length,i+3),part=ts.slice(lo,hi);
  if(part.length<2)return t;const f=fitLine(part);return f.a+(i-lo)*f.T});
 for(let i=1;i<out.length;i++)out[i]=Math.max(out[i],out[i-1]+.05);
 return out
}

async function transcribe(buf,start,secs,cb){
 const sr=buf.sampleRate,chs=Math.max(1,buf.numberOfChannels||1),total=buf.length||buf.getChannelData(0).length,dur=total/sr;
 secs=Math.max(1,Math.min(secs,dur-start));/* near the end of the song, listen further back so the tempo is still sure */
 const PADT=12+Math.max(0,12-(dur-(start+secs)));
 const r0=Math.max(0,start-PADT),r1=Math.min(total/sr,start+secs+PADT+2),a0=Math.floor(r0*sr),a1=Math.min(total,Math.ceil(r1*sr)),L=a1-a0;
 const D=Math.max(1,Math.round(sr/22050)),srd=sr/D,M=Math.floor(L/D),xd=new Float32Array(M);
 {const dsum=new Float32Array(L);for(let c=0;c<chs;c++){const d=buf.getChannelData(c);for(let i=0;i<L;i++)dsum[i]+=d[a0+i]/chs}
  for(let i=0;i<M;i++){let s=0;for(let k=0;k<D;k++)s+=dsum[i*D+k];xd[i]=s/D}
  var xf=dsum}
 cb&&cb(.02);await new Promise(z=>setTimeout(z));
 /* beat */
 const oe=onsetEnv(xd,srd),fps=oe.fps;cb&&cb(.12);await new Promise(z=>setTimeout(z));
 const flatEnv=!oe.env.some(v=>v>0),Pf=flatEnv?fps*.6:pickTempo(oe.env,fps),beats=flatEnv?[]:trackBeats(oe.env,fps,Pf);
 let T=60/(60*fps/Pf),b0=0,beatTimes=[];
 if(beats.length>=4){beatTimes=smoothBeatTimes(beats.map(i=>i/fps));const fl=fitLine(beatTimes);T=fl.T;b0=fl.a}else{b0=beats.length?beats[0]/fps:0}
 /* which beat is the bar line: the one whose neighbours hit hardest in the low end */
 const bidx=k=>Math.max(0,Math.min(oe.low.length-1,Math.round((b0+k*T)*fps)));
 const nbt=Math.floor((oe.env.length/fps-b0)/T),sc4=[0,0,0,0],cn4=[0,0,0,0];
 for(let k=0;k<=nbt;k++){let m=0;for(let d=-1;d<=1;d++)m=Math.max(m,oe.low[Math.max(0,Math.min(oe.low.length-1,bidx(k)+d))]);sc4[((k%4)+4)%4]+=m;cn4[((k%4)+4)%4]++}
 let dph=0;{let bv=-1;for(let q=0;q<4;q++){const v=sc4[q]/Math.max(1,cn4[q]);if(v>bv){bv=v;dph=q}}}
 const beatAt=k=>{if(!beatTimes.length)return b0+k*T;const i=Math.floor(k),f=k-i;
  if(i<0)return beatTimes[0]+k*T;
  if(i>=beatTimes.length-1)return beatTimes[beatTimes.length-1]+(k-(beatTimes.length-1))*T;
  return beatTimes[i]*(1-f)+beatTimes[i+1]*f};
 const secRel=start-r0;let k0=0,bd=1e9;for(let k=-8;k<=Math.ceil((oe.env.length/fps-b0)/T);k++){if(((k%4)+4)%4!==dph)continue;const d=Math.abs(beatAt(k)-secRel);if(d<bd){bd=d;k0=k}}
 let sub=Math.round(secs/(T/4))<=960?4:2;const roughStepSec=T/sub,n=Math.max(8,Math.min(960,Math.round(secs/roughStepSec)));
 const g0=beatAt(k0);/* grid start, seconds from r0 */
 const tS=i=>beatAt(k0+i/sub),stepDur=i=>tS(i+1)-tS(i);
 const stepSec=(tS(n)-g0)/n;
 /* the frame stream: one spectrum per step, taken over that step */
 const NM=stepSec>=.13?4096:2048,NB=8192,hm=NM/2,SM=new Float32Array(hm),SB=new Float32Array(NB/2),sx=t=>Math.round(t*srd);
 const WF=[],bassS=[];
 for(let i=-2;i<n;i++){
  if(i%4===3){cb&&cb(.15+.35*i/n);await new Promise(z=>setTimeout(z))}
  const Wc=new Float32Array(hm);spec(xd,sx(tS(i)+.5*stepDur(i)),NM,SM);whiten(SM,Wc);WF.push(Wc);
  if(i>=0){spec(xd,sx(tS(i)+.5*stepDur(i)),NB,SB);const Wb=new Float32Array(NB/2);whiten(SB,Wb);bassS.push(Wb)}}
 /* how far off concert pitch the recording is: peaks of the whole clip vote on how far they sit from the nearest semitone */
 let tu=0;{let cs=0,sn=0;for(let q=2;q<WF.length;q++){const W=WF[q];for(let b=Math.round(150*NM/srd);b<Math.round(1500*NM/srd);b++)if(W[b]>0){const fr=b*srd/NM,mm=69+12*Math.log2(fr/440),dv=mm-Math.round(mm);cs+=W[b]*Math.cos(2*Math.PI*dv);sn+=W[b]*Math.sin(2*Math.PI*dv)}}
  if(cs*cs+sn*sn>0)tu=Math.max(-45,Math.min(45,Math.atan2(sn,cs)/(2*Math.PI)*100))}
 const steady=[],cand=[],novBest=[],bass=[],bassStr=[],Wd=new Float32Array(hm),MM=[52,92];
 /* a voice counts when its base note and an overtone are both new */
 const salN=(W,m)=>{const f=mf(m,tu);let t=0,got=0,base=0;for(let h=1;h<=HW.length;h++){const fh=f*h;if(fh>4500)break;const cb_=fh*NM/srd,hw=Math.max(1.2,fh*.02*NM/srd);let v=0;for(let b=Math.max(1,Math.floor(cb_-hw));b<=Math.min(hm-2,Math.ceil(cb_+hw));b++)if(W[b]>v)v=W[b];
   if(h===1)base=v;else if(v>0&&h<=3)got++;t+=HW[h-1]*v}
  return base>0&&(got>0||f*2>4500)?t:0};
 const wipeN=(W,m)=>{const f=mf(m,tu);for(let h=1;h<=HW.length;h++){const fh=f*h,cb_=fh*NM/srd,hw=Math.max(1.2,fh*.02*NM/srd);for(let b=Math.max(1,Math.floor(cb_-hw));b<=Math.min(hm-2,Math.ceil(cb_+hw));b++)W[b]=0}};
 for(let i=0;i<n;i++){
  const Wc=WF[i+2],Wp=WF[i+1],Wpp=WF[i];
  for(let b=0;b<hm;b++){let q=0;for(let d=-1;d<=1;d++){const k=b+d;if(k>=0&&k<hm)q=Math.max(q,Wp[k],Wpp[k])}Wd[b]=Math.max(0,Wc[b]-q)}
  const st=new Float32Array(MHI-MLO+1);for(let m=MM[0];m<=MM[1];m++)st[m-MLO]=salN(Wc,m);steady.push(st);
  const pk=[];let s1=0;for(let r=0;r<5;r++){let best=-1,bs=0;for(let m=MM[0];m<=MM[1];m++){if(pk.some(p=>p[0]===m))continue;const s=salN(Wd,m);if(s>bs){bs=s;best=m}}
   if(best<0||bs<=0)break;if(!r)s1=bs;if(bs<.3*s1)break;pk.push([best,bs]);wipeN(Wd,best)}
  cand.push(pk);novBest.push(s1);
  const Wb=bassS[i];let bb=-1,bv=0;for(let m=33;m<=55;m++){const s=sal(Wb,srd,NB,m,tu);if(s>bv){bv=s;bb=m}}bass.push(bb);bassStr.push(bv)}
 /* melody: a note starts where something new and strong appears */
 const sens={low:.8,normal:.55,high:.4}[SG("transSens")]||.55,ref=Math.max(1e-9,pctl(novBest,.9)),thr=sens*ref;
 /* first find every place a note might start, then drop echoes: one struck note shows up in two neighbouring steps because the windows overlap */
 const midi=new Array(n).fill(null),start_=new Array(n).fill(false),pm=new Array(n).fill(null);
 for(let i=0;i<n;i++)if(novBest[i]>=thr&&cand[i].length){const pk=cand[i],s1=pk[0][1];let hi=pk[0];pk.forEach(p=>{if(p[1]>=.45*s1&&p[0]>hi[0])hi=p});pm[i]=hi[0]}
 for(let i=1;i<n;i++)if(pm[i]!==null&&pm[i-1]!==null){const same=Math.abs(pm[i]-pm[i-1])<=1;
  if(same||Math.min(novBest[i],novBest[i-1])<.8*Math.max(novBest[i],novBest[i-1])){if(novBest[i]>novBest[i-1]*(same?1:1)){pm[i-1]=null}else pm[i]=null}}
 let cur=null,base=0,curStart=-1;const maxHold=4*sub*2;
 for(let i=0;i<n;i++){
  if(pm[i]!==null){cur=pm[i];curStart=i;base=steady[i][cur-MLO]||1e-9;midi[i]=cur;start_[i]=true}
  else if(cur!==null){const s=steady[i][cur-MLO];if(s>=.3*base&&i-curStart<maxHold)midi[i]=cur;else cur=null}}
 /* put the tune in the notes a record can hold (C3 to B5), moving whole octaves so it keeps its shape */
 const used=midi.filter(m=>m!==null);let shift=0;
 if(used.length&&SG("transOct")!=="off"){let bc=-1,bdd=1e9;const med=used.slice().sort((p,q)=>p-q)[used.length>>1];
  for(let s=-48;s<=48;s+=12){const cnt=used.filter(m=>m+s>=48&&m+s<=83).length,d=Math.abs(med+s-65.5);if(cnt>bc||(cnt===bc&&d<bdd)){bc=cnt;bdd=d;shift=s}}}
 const fold=m=>{m+=shift;while(m<48)m+=12;while(m>83)m-=12;return m};
 let notes=midi.map(m=>m===null?null:fold(m));
 if(SG("transSnap")&&notes.some(m=>m!==null)){const hist=new Array(12).fill(0);notes.forEach(m=>{if(m!==null)hist[m%12]++});
  let bk=0,bs=-1e9,bmin=false;for(let t=0;t<12;t++)for(const mn of[false,true]){const pr=mn?KEYMIN:KEYMAJ;let s=0;for(let i=0;i<12;i++)s+=hist[(i+t)%12]*pr[i];if(s>bs){bs=s;bk=t;bmin=mn}}
  const sc=(bmin?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11]).map(i=>(i+bk)%12);
  notes=notes.map(m=>{if(m===null||sc.includes(m%12))return m;for(const d of[1,-1,2,-2]){const c=m+d;if(c>=48&&c<=83&&sc.includes(c%12))return c}return m})}
 const tok=new Array(n);
 for(let i=0;i<n;i++){const m=notes[i];if(m===null){tok[i]=0;continue}tok[i]=(start_[i]||i===0||notes[i-1]!==m)?2+m-48:1}
 /* bass */
 const doBass=SG("transBass")!==false,doDrums=SG("transDrums")!==false,bm=Math.max(1e-9,pctl(bassStr,.9));
 let bs_=bass.map((m,i)=>!doBass||m<0||bassStr[i]<.2*bm?0:1+m%12);
 for(let i=1;i<n-1;i++)if(bs_[i-1]===bs_[i+1]&&bs_[i]!==bs_[i-1])bs_[i]=bs_[i-1];
 /* drums: jumps in the low, middle and high end, measured around each step */
 const ND=2048,hd=ND/2,fl=[];let Pq=[];
 const sx2=t=>Math.round(t*sr),xr=xf;
 const fb=(a,b)=>[Math.round(a*ND/sr),Math.min(hd,Math.round(b*ND/sr))];
 const B0=fb(40,200),B1=fb(1500,5000),B2=fb(6000,Math.min(16000,sr/2-100));
 const frame=(q)=>{const i=Math.floor(q/4),A=new Float32Array(hd);spec(xr,sx2(tS(i)+((q%4+4)%4-1.5)*.25*stepDur(i)),ND,A);return A};
 const Fq=new Map();const get=q=>{if(!Fq.has(q))Fq.set(q,frame(q));return Fq.get(q)};
 for(let i=0;i<n;i++){let f=[0,0,0];for(let j=0;j<4;j++){const q=4*i+j,c=get(q),p=get(q-1);const bd=[B0,B1,B2];for(let k=0;k<3;k++){let t=0;for(let b=bd[k][0];b<bd[k][1];b++)t+=Math.max(0,c[b]*c[b]-p[b]*p[b]);f[k]=Math.max(f[k],t)}}fl.push(f);Fq.delete(4*i-4);Fq.delete(4*i-3);Fq.delete(4*i-2);Fq.delete(4*i-5)}
 const th=b=>{const v=fl.map(f=>f[b]),m=v.reduce((p,q)=>p+q,0)/n;return m+Math.sqrt(v.reduce((p,q)=>p+(q-m)*(q-m),0)/n)};
 const Tt=[th(0),th(1),th(2)];
 cb&&cb(.97);
 const out=tok.map((mel,i)=>{const f=fl[i],d=!doDrums?0:f[1]>Tt[1]&&f[2]>Tt[2]?2:f[0]>Tt[0]?1:f[2]>Tt[2]?3:0;return mel+38*(bs_[i]+13*d)});
 out.stepTimes=Float64Array.from({length:n+1},(_,i)=>(tS(i)-g0)/stepSec);
 out.stepSec=stepSec;out.sub=sub;out.bpm=60/(stepSec*sub);out.t0=r0+g0;out.secs=tS(n)-g0; return out}