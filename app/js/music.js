"use strict";
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
 const setPos=p=>{turn(R.setPos(p));const i=Math.min(n-1,Math.floor(p)),t=toks[i],ml=t%38,bs=Math.floor(t/38)%13,dr=Math.floor(t/494);
  nowp.textContent=tm(p*STEP/SPEED)+" / "+tm(n*STEP/SPEED)+"   "+(ml>=2?nm(ml):ml===1?"held":"rest")+(BAND?(bs?"  bass "+NOTE[(bs-1)%12]:"")+(dr?"  "+["","kick","snare","hat"][dr]:""):"")};
 /* the needle swings down and back */
 let anim=0;const swing=(a,b,ms,done)=>{const id=++anim,t0=performance.now();const f=now=>{if(id!==anim)return;const q=Math.min(1,(now-t0)/ms),s=q*q*(3-2*q);R.drawArm(a+(b-a)*s,false);if(q<1)requestAnimationFrame(f);else done&&done()};requestAnimationFrame(f)};
 const pb=mk("button","btn pri","Play"),row=mk("div","row");
 const doneState=()=>{delete pb.dataset.on;pb.textContent="Play";const r=R.rad(0);R.setPos(-1);turn(R.rest());nowp.textContent="Ready when you are."};
 const start=()=>{pb.dataset.on=1;pb.textContent="Stop";playToks(toks,setPos,()=>{if(pb.dataset.on)doneState()})};
 pb.onclick=()=>{if(pb.dataset.on){stopAudio();return}
  if(SG("needleDrop")&&!SG("motion")){pb.dataset.on=1;pb.textContent="Stop";swing(R.PARK,R.RO,520,()=>{if(pb.dataset.on){onStop=null;delete pb.dataset.on;start()}});onStop=()=>{anim++;doneState()}}else start()};
 const si=mk("select"),sp=mk("input"),spv=mk("span","setv");
 INST_NAMES.forEach(([x,t])=>si.append(new Option(t,x,x===INST,x===INST)));si.onchange=()=>INST=si.value;
 sp.type="range";sp.min=25;sp.max=200;sp.step=5;sp.value=Math.round(SPEED*100);spv.textContent=sp.value+"%";sp.style.width="110px";sp.oninput=()=>{SPEED=sp.value/100;spv.textContent=sp.value+"%"};
 const chk=(t,get,set)=>{const l=mk("label"),c=mk("input");c.type="checkbox";c.checked=get();c.onchange=()=>set(c.checked);l.append(c," "+t);return l};
 row.append(pb,si,mk("span",null,"tempo"),sp,spv);
 const row2=mk("div","row");row2.append(chk("Bass and drums",()=>BAND,z=>BAND=z),chk("Chords underneath",()=>CHORDS,z=>CHORDS=z),chk("Loop",()=>!!SG("loop"),z=>{SET.loop=z;saveSet()}));
 if(tuneSel){const u=TUNES[tuneSel.i],tt=[];let tok=tuneSel.k;u.ns.slice(0,Math.max(2,Math.min(u.len,tuneSel.c||u.len))).forEach(([mm,d],q)=>{if(q)tok+=u.iv[q-1];tt.push(tok);for(let z=1;z<d;z++)tt.push(1)});
  const pt=mk("button","btn","Hear "+u.n+" with its real rhythm");pt.onclick=()=>{if(pt.dataset.on){stopAudio();return}doneState();stopAudio();pt.dataset.on=1;pt.textContent="Stop";playToks(tt,()=>{},()=>{delete pt.dataset.on;pt.textContent="Hear "+u.n+" with its real rhythm"},1)};row2.append(pt)}
 if(orig){const po=mk("button","btn","Play the original clip");po.onclick=()=>{stopAudio();AC();const s=ctx.createBufferSource(),g=ctx.createGain();g.gain.value=SG("volume")/60;s.buffer=orig.buf;s.connect(g);g.connect(ctx.destination);s.start(0,orig.s,orig.secs);nodes=[s]};row2.append(po)}
 Rt.append(row,row2,nowp);if(SG("showNotes"))winText(Rt,toks.map(t=>nm(t%38)).join(" "),"mono");
 /* mp3 to notes */
 const mp=mk("div","panel");mp.append(mk("h3",null,"Got an mp3?"),mk("p",null,"Pick a song and a spot in it, up to two minutes. I'll listen, write down the notes I hear and open them as a record. A record only holds a melody, a bass line and a drum beat, so what you get back is a plain cover of the tune and not the recording itself. If you want the actual sound, use the Sound room."));
 const f=mk("input");f.type="file";f.accept="audio/*,.mp3";const s0=mk("input");s0.type="number";s0.min=0;s0.value=0;s0.style.width="80px";
 const ln=mk("select");[4,8,16,32,60,120].forEach(x=>ln.append(new Option(x+" seconds",x,x===16,x===16)));
 const go=mk("button","btn pri","Make a record"),info=mk("div","note");let buf=null;
 const loadAudio=async file=>{info.textContent="Reading the file...";try{buf=await AC().decodeAudioData(await file.arrayBuffer());s0.max=Math.max(0,Math.floor(buf.duration-1));info.textContent="Got it. It's "+Math.round(buf.duration)+" seconds long. Choose where to start and hit Make a record."}catch(e){buf=null;info.textContent="I couldn't read that file. An mp3 or a wav should work."}};
 f.onchange=()=>f.files[0]&&loadAudio(f.files[0]);
 go.onclick=async()=>{if(!buf){info.textContent="Add an mp3 first.";return}
  const secs=Math.min(+ln.value,Math.floor(buf.duration)||1),s=Math.min(Math.max(0,+s0.value||0),Math.max(0,buf.duration-secs));s0.value=s;go.disabled=true;
  try{const t=await transcribe(buf,s,secs,p=>info.textContent="Listening... "+Math.round(p*100)+"%");orig={buf,s,secs};keep=true;nav(link("music",toSeed(t,1976,false),{a:0,b:t.length}))}catch(e){info.textContent="Something went wrong while listening: "+e.message;go.disabled=false}};
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
 if(hl&&orig)st.textContent="That's your clip written down as notes. It won't sound like the original, but every note here is one I heard.";
 if(SG("autoplay")&&!orig&&!tuneSel)setTimeout(()=>pb.onclick(),300)}

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
/* Each step (an eighth of a second) gets one melody note (or a rest, or "hold"), one bass note and one drum hit.
   The melody is the highest strong voice in the mix, found by picking the strongest pitch, removing its overtones, and looking again. */
function fft(re,im){const n=re.length;
 for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){let t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t}}
 for(let len=2;len<=n;len<<=1){const a=-2*Math.PI/len,wr=Math.cos(a),wi=Math.sin(a),h=len>>1;
  for(let i=0;i<n;i+=len){let cr=1,ci=0;for(let k=0;k<h;k++){const u=i+k,w=u+h,tr=re[w]*cr-im[w]*ci,ti=re[w]*ci+im[w]*cr;re[w]=re[u]-tr;im[w]=im[u]-ti;re[u]+=tr;im[u]+=ti;const t=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=t}}}}
const HANN={};
function spec(x,c,N,out){const re=new Float32Array(N),im=new Float32Array(N),w=HANN[N]||(HANN[N]=Float32Array.from({length:N},(_,i)=>.5-.5*Math.cos(2*Math.PI*i/N)));
 for(let i=0;i<N;i++){const k=c-N/2+i;re[i]=k>=0&&k<x.length?x[k]*w[i]:0}
 fft(re,im);for(let i=0;i<N/2;i++)out[i]=Math.sqrt(Math.hypot(re[i],im[i]))}
/* loudest bin within a quarter tone of a frequency */
function band(S,sr,N,f){const lo=Math.max(1,Math.floor(f*.9715*N/sr)),hi=Math.min(S.length-2,Math.ceil(f*1.0293*N/sr));let m=0;for(let b=lo;b<=hi;b++)if(S[b]>m)m=S[b];return m}
const HW=[1,.8,.62,.48,.36,.26];
const mf=m=>440*Math.pow(2,(m-69)/12);
function sal(S,sr,N,m){const f=mf(m);let t=0;for(let h=1;h<=HW.length;h++){if(f*h*1.03>sr/2)break;t+=HW[h-1]*band(S,sr,N,f*h)}return t}
function wipe(S,sr,N,m){const f=mf(m);for(let h=1;h<=HW.length;h++){const lo=Math.max(1,Math.floor(f*h*.9715*N/sr)),hi=Math.min(S.length-2,Math.ceil(f*h*1.0293*N/sr)),k=h===1?0:.3;for(let b=lo;b<=hi;b++)S[b]*=k}}
const MLO=40,MHI=100,MK=MHI-MLO+1;
const KEYMAJ=[6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88],KEYMIN=[6.33,2.68,3.52,5.38,2.6,3.53,2.54,4.75,3.98,2.69,3.34,3.17];
async function transcribe(buf,start,secs,cb){
 const sr=buf.sampleRate,chs=Math.max(1,buf.numberOfChannels||1),n=Math.min(960,Math.max(1,Math.round(secs/STEP)));
 const pre=Math.round(.5*sr),a0=Math.max(0,Math.floor(start*sr)-pre),a1=Math.min(buf.length||buf.getChannelData(0).length,Math.ceil((start+secs)*sr)+pre),x=new Float32Array(a1-a0);
 for(let c=0;c<chs;c++){const d=buf.getChannelData(c);for(let i=0;i<x.length;i++)x[i]+=d[a0+i]/chs}
 const ox=Math.floor(start*sr)-a0,NM=8192,NB=16384,NS=2048,HOP=Math.round(STEP*sr/4);
 const SM=new Float32Array(NM/2),SB=new Float32Array(NB/2),W=new Float32Array(NM/2),WB=new Float32Array(NB/2),P=[],G=[],Bs=[],fl=[],lev=[];
 const sens={low:1.8,normal:3,high:5}[SG("transSens")]||3,doBass=SG("transBass")!==false,doDrums=SG("transDrums")!==false;
 let prevS=new Float32Array(NS/2),A=new Float32Array(NS/2);
 for(let q=-1;q<4*n;q++){const c=ox+Math.round((q+2)*HOP-HOP*1.5);spec(x,c,NS,A);if(q>=0)P.push(A);A=new Float32Array(NS/2)}
 for(let i=0;i<n;i++){
  if(i%3===2){cb&&cb(i/n);await new Promise(z=>setTimeout(z))}
  const c=ox+Math.floor((i+.5)*STEP*sr);
  spec(x,c,NM,SM);spec(x,c,NB,SB);
  /* find up to three voices: strongest pitch, wipe its overtones, look again */
  W.set(SM);WB.set(SB);const pk=[];
  for(let r=0;r<5;r++){let best=-1,bs=0;for(let m=52;m<=MHI;m++){if(pk.some(p=>p[0]===m))continue;const s=sal(W,sr,NM,m);if(s>bs){bs=s;best=m}}
   for(let m=MLO;m<52;m++){if(pk.some(p=>p[0]===m))continue;const s=sal(WB,sr,NB,m);if(s>bs){bs=s;best=m}}
   if(best<0||bs<=0)break;pk.push([best,bs]);wipe(W,sr,NM,best);wipe(WB,sr,NB,best)}
  const g=new Float32Array(MK);
  if(pk.length){const s1=pk[0][1];let hi=0;pk.forEach((p,j)=>{if(p[1]>=.35*s1&&p[0]>pk[hi][0])hi=j});pk.forEach((p,j)=>{const q=p[0]-MLO;g[q]=Math.max(g[q],p[1]*(j===hi&&hi>0?2:1))})}
  G.push(g);
  let e=0;for(let b=Math.round(200*NM/sr);b<Math.round(2500*NM/sr);b++)e+=SM[b];lev.push(e);
  Bs.push(Array.from({length:25},(_,k)=>sal(SB,sr,NB,28+k)));
  const fx=(lo,hi,q)=>{let t=0;for(let b=Math.round(lo*NS/sr);b<Math.round(hi*NS/sr)&&b<NS/2;b++){const cur=P[q][b],prv=q>0?P[q-1][b]:0;t+=Math.max(0,cur*cur-prv*prv)}return t};
  let f0=0,f1=0,f2=0;for(let j=0;j<4;j++){const q=4*i+j;f0=Math.max(f0,fx(40,200,q));f1=Math.max(f1,fx(1500,5000,q));f2=Math.max(f2,fx(6000,16000,q))}
  fl.push([f0,f1,f2])}
 /* melody: pick the best path through the notes so it doesn't jump around every step */
 const gm=Math.max(1e-9,...G.map(g=>Math.max(...g))),R=MK,back=[];let cost=new Float64Array(R+1);
 for(let i=0;i<n;i++){const nc=new Float64Array(R+1),bk=new Uint8Array(R+1),pkv=Math.max(...G[i]),loud=Math.min(1,pkv/gm*sens);
  for(let k=0;k<=R;k++){const em=k<R?1-G[i][k]/gm:.9*loud;let b=0,bj=0;
   if(i){b=1e9;for(let j=0;j<=R;j++){const t=cost[j]+(j===k?0:j<R&&k<R?.05+.025*Math.min(Math.abs(j-k),12):.1);if(t<b){b=t;bj=j}}}
   nc[k]=b+em;bk[k]=bj}
  cost=nc;back.push(bk)}
 let k0=cost.indexOf(Math.min(...cost));const path=new Array(n);for(let i=n-1;i>=0;i--){path[i]=k0;k0=back[i][k0]}
 const midi=path.map(p=>p===R?null:p+MLO);
 /* put the tune in the notes a record can hold (C3 to B5), moving whole octaves so it keeps its shape */
 const used=midi.filter(m=>m!==null);let shift=0;
 if(used.length&&SG("transOct")!=="off"){let bc=-1,bd=1e9;const med=used.slice().sort((p,q)=>p-q)[used.length>>1];
  for(let s=-48;s<=48;s+=12){const cnt=used.filter(m=>m+s>=48&&m+s<=83).length,d=Math.abs(med+s-65.5);if(cnt>bc||(cnt===bc&&d<bd)){bc=cnt;bd=d;shift=s}}}
 const fold=m=>{m+=shift;while(m<48)m+=12;while(m>83)m-=12;return m};
 let notes=midi.map(m=>m===null?null:fold(m));
 /* optionally nudge stray notes onto the song's key */
 if(SG("transSnap")&&notes.some(m=>m!==null)){const hist=new Array(12).fill(0);notes.forEach(m=>{if(m!==null)hist[m%12]++});
  let bk=0,bs=-1e9,bmin=false;for(let t=0;t<12;t++)for(const mn of[false,true]){const pr=mn?KEYMIN:KEYMAJ;let s=0;for(let i=0;i<12;i++)s+=hist[(i+t)%12]*pr[i];if(s>bs){bs=s;bk=t;bmin=mn}}
  const sc=(bmin?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11]).map(i=>(i+bk)%12);
  notes=notes.map(m=>{if(m===null||sc.includes(m%12))return m;for(const d of[1,-1,2,-2]){const c=m+d;if(c>=48&&c<=83&&sc.includes(c%12))return c}return m})}
 /* same note twice in a row: only call it a hold if it doesn't get struck again */
 const tok=new Array(n);
 for(let i=0;i<n;i++){const m=notes[i];
  if(m===null){tok[i]=0;continue}
  if(i&&notes[i-1]===m){let hit=false;const f=mf(midi[i]);
   for(let j=0;j<4&&!hit;j++){const q=4*i+j;let cur=0,prv=0;for(let h=1;h<=3;h++){const ff=f*h;if(ff*1.03>sr/2)break;cur+=band(P[q],sr,NS,ff);prv+=Math.max(q>0?band(P[q-1],sr,NS,ff):0,q>1?band(P[q-2],sr,NS,ff):0)}
    if(cur>prv*1.45+1e-6&&cur>.12*Math.sqrt(gm))hit=true}
   tok[i]=hit?2+m-48:1}
  else tok[i]=2+m-48}
 /* bass: strongest low note, kept as one of 12 pitch names */
 const bm=Math.max(1e-9,...Bs.map(q=>Math.max(...q)));
 const bass=Bs.map(q=>{const p=Math.max(...q);return!doBass||p<.15*bm?0:1+(28+q.indexOf(p))%12});
 for(let i=1;i<n-1;i++)if(bass[i-1]===bass[i+1])bass[i]=bass[i-1];
 /* drums: sudden jumps in low, mid and high frequencies */
 const th=b=>{const v=fl.map(f=>f[b]),m=v.reduce((p,q)=>p+q,0)/n;return m+Math.sqrt(v.reduce((p,q)=>p+(q-m)*(q-m),0)/n)};
 const T=[th(0),th(1),th(2)];
 return tok.map((mel,i)=>{const f=fl[i],d=!doDrums?0:f[1]>T[1]&&f[2]>T[2]?2:f[0]>T[0]?1:f[2]>T[2]?3:0;return mel+38*(bass[i]+13*d)})}
