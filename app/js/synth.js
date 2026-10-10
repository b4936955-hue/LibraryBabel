"use strict";
/* ---------- synth: instruments, drums, and the player ---------- */
let INST=SG("inst"),BAND=!!SG("band"),CHORDS=!!SG("chords"),SPEED=(+SG("tempo")||100)/100,os=[],noise=null,verb=null;
/* [wave, overtone multiple, loudness] for each oscillator in an instrument. f = brightness, s = holds its note, a = fade-in, d = fixed fade-out */
const INSTR={
 piano:{p:[["sine",1,1],["sine",2,.4],["triangle",3,.15]],f:6000},
 organ:{p:[["sine",1,1],["sine",2,.6],["sine",4,.3]],f:6000,s:1},
 strings:{p:[["sawtooth",1,.4],["sawtooth",1.006,.4]],f:1800,s:1,a:.08},
 bell:{p:[["sine",1,1],["sine",3.5,.3]],f:6000,d:2.4},
 chip:{p:[["square",1,.4]],f:4000,s:1},
 guitar:{p:[["sawtooth",1,.45],["triangle",2,.3],["sine",3,.1]],f:2400,d:1.3},
 flute:{p:[["sine",1,1],["sine",2,.12],["sine",3,.05]],f:5000,s:1,a:.06,vib:1},
 marimba:{p:[["sine",1,1],["sine",4,.22]],f:5000,d:.7},
 synth:{p:[["sawtooth",1,.35],["square",1.004,.3]],f:2400,s:1,a:.02},
 musicbox:{p:[["sine",1,.8],["sine",5.4,.18],["sine",8.2,.07]],f:7000,d:1.5},
 sub:{p:[["sine",1,1],["triangle",2,.18]],f:900,s:1}};
const INST_NAMES=[["piano","Piano"],["organ","Organ"],["strings","Strings"],["guitar","Guitar"],["flute","Flute"],["marimba","Marimba"],["synth","Synth lead"],["musicbox","Music box"],["bell","Bell"],["chip","Chip"]];
const BASS_NAMES=[["organ","Organ"],["sub","Sub bass"],["piano","Piano"],["strings","Strings"],["synth","Synth"]];
/* kick: [start Hz, end Hz, sweep time, length, loudness]; snare and hat: [filter Hz, length, loudness] */
const KITS={acoustic:{k:[140,45,.12,.24,.9],s:[1800,.17,.5],h:[7000,.045,.13]},
 "808":{k:[110,32,.3,.55,1],s:[1200,.2,.4],h:[9000,.05,.11]},
 soft:{k:[100,50,.1,.18,.6],s:[2500,.12,.26],h:[8000,.03,.08]},
 electronic:{k:[200,48,.08,.2,.9],s:[3000,.1,.5],h:[11000,.03,.14]}};
const jit=(amt)=>amt?(Math.random()*2-1)*amt:0;
function voice(m,st,en,kind,out,vol){
 const I=INSTR[kind]||INSTR.piano,f=440*Math.pow(2,(m-69)/12),g=ctx.createGain(),fl=ctx.createBiquadFilter(),sus=!!I.s,len=en-st,atk=I.a||.01;
 fl.type="lowpass";fl.frequency.value=I.f;
 g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(vol,st+atk);
 if(sus){g.gain.setValueAtTime(vol*.85,Math.max(st+atk+.01,en-.06));g.gain.linearRampToValueAtTime(0,en+.05)}
 else g.gain.exponentialRampToValueAtTime(.001,st+(I.d||Math.min(len*1.4+.3,3.2)));
 let lfo=null;if(I.vib){lfo=ctx.createOscillator();lfo.frequency.value=5.2;lfo.start(st);lfo.stop(en+.2);lfo._e=en+.2;os.push(lfo)}
 I.p.forEach(([t,r,a])=>{const o=ctx.createOscillator(),ga=ctx.createGain();o.type=t;o.frequency.value=f*r;ga.gain.value=a;
  if(lfo){const lg=ctx.createGain();lg.gain.value=f*r*.006;lfo.connect(lg);lg.connect(o.frequency)}
  o.connect(ga);ga.connect(fl);o.start(st);o._e=en+(sus?.1:(I.d||3.2)+.1);o.stop(o._e);os.push(o)});
 fl.connect(g);g.connect(out)}
function drum(k,st,out,vol){
 const K=KITS[SG("drumKit")]||KITS.acoustic,P=K[k],g=ctx.createGain();g.connect(out);
 if(k==="k"){const o=ctx.createOscillator();o.frequency.setValueAtTime(P[0],st);o.frequency.exponentialRampToValueAtTime(P[1],st+P[2]);g.gain.setValueAtTime(P[4]*vol,st);g.gain.exponentialRampToValueAtTime(.001,st+P[3]);o.connect(g);o.start(st);o._e=st+P[3]+.03;o.stop(o._e);os.push(o)}
 else{const s=ctx.createBufferSource(),f=ctx.createBiquadFilter();s.buffer=noise;f.type="highpass";f.frequency.value=P[0];g.gain.setValueAtTime(P[2]*vol,st);g.gain.exponentialRampToValueAtTime(.001,st+P[1]);s.connect(f);f.connect(g);s.start(st);s._e=st+P[1]+.05;s.stop(s._e);os.push(s)}}
const CRACKLE={off:0,light:.0006,medium:.002,heavy:.005};
function playToks(toks,onPos,end,spd){
 AC();stopAudio();onStop=end;os=[];
 if(!noise){noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  verb=ctx.createBuffer(2,ctx.sampleRate*1.6|0,ctx.sampleRate);for(let c=0;c<2;c++){const q=verb.getChannelData(c);for(let i=0;i<q.length;i++)q[i]=(Math.random()*2-1)*Math.pow(1-i/q.length,3)}}
 const n=toks.length,SP=STEP/(spd||SPEED),timing=!tuneSel&&isOrig(toks)&&orig.stepTimes&&orig.stepTimes.length===n+1?orig.stepTimes:null;
 const unitAt=i=>timing?timing[Math.max(0,Math.min(n,i))]:Math.max(0,Math.min(n,i)),timeAt=i=>t0+unitAt(i)*SP;
 const t0=ctx.currentTime+.08,out=ctx.createGain(),comp=ctx.createDynamicsCompressor(),cv=ctx.createConvolver(),wet=ctx.createGain();
 const V=k=>(+SG(k)||0)/100,hum=+SG("humanize")||0,swing=(+SG("swing")||0)/100,tr=+SG("transpose")||0,bassI=SG("bassInst")||"organ";
 out.gain.value=.3*SG("volume")/60;cv.buffer=verb;wet.gain.value=V("reverb")*.6;out.connect(comp);out.connect(cv);cv.connect(wet);wet.connect(comp);comp.connect(ctx.destination);
 const parts=toks.map(t=>musicParts(t,MUSIC_POLY&&!tuneSel)),mel=Array.from({length:MUSIC_POLY&&!tuneSel?MUSIC_VOICES:1},(_,v)=>parts.map(p=>p.voices[v]||0)),bas=parts.map(p=>p.bass),drm=parts.map(p=>p.drum);
 const BS=(!tuneSel&&isOrig(toks)&&orig.sub)||4;let last=-1;
 const at=i=>timeAt(i)+(i%2?swing*(unitAt(i+1)-unitAt(i))*SP*.5:0)+jit(hum/1000),vel=()=>1-(hum?Math.random()*hum/40*.35:0);
 const step=i=>{const st=Math.max(t0,at(i));
  for(const lane of mel)if(lane[i]>=2){let l=1;while(lane[i+l]===1)l++;const note=lane[i]-2+48;if(lane===mel[0])last=note;voice(note+tr,st,Math.max(st+.05,timeAt(i+l)),INST,out,.9*V("melodyVol")*vel())}
  if(BAND){
   if(bas[i]&&(i===0||bas[i-1]!==bas[i]||i%BS===0)){let l=1;while(i+l<n&&bas[i+l]===bas[i]&&(i+l)%BS)l++;voice(35+bas[i]+tr,st,Math.max(st+.05,timeAt(i+l)),bassI,out,.6*V("bassVol")*vel())}
   const dv=V("drumVol")*vel();if(drm[i]===1)drum("k",st,out,dv);else if(drm[i]===2)drum("s",st,out,dv);else if(drm[i]===3)drum("h",st,out,dv)}
  if(CHORDS&&i%(4*BS)===0&&last>=0){const BL=4*BS,cnt=new Array(13).fill(0);for(let j=i;j<i+BL&&j<n;j++)cnt[bas[j]]++;let bb=0;for(let q=1;q<=12;q++)if(cnt[q]>cnt[bb]||(bb===0&&cnt[q]>0))bb=q;
   const r=bb?48+(bb-1):48+last%12;let mi=0,ma=0;for(let j=i;j<i+BL&&j<n;j++)if(mel[0][j]>=2){const pc=(mel[0][j]-2+48)%12;if(pc===(r+3)%12)mi=1;if(pc===(r+4)%12)ma=1}[0,mi&&!ma?3:4,7].forEach(x=>voice(r+x+tr,st,Math.max(st+.05,timeAt(i+BL)),"strings",out,.16*V("chordVol"))) }};
 /* only the next few seconds are built at a time, so a long or busy record never floods the audio engine */
 let nx=0;const pump=()=>{pumpT=0;if(!ctx||nodes!==os)return;const now=ctx.currentTime;for(let k=os.length-1;k>=0;k--)if(os[k]._e<now)os.splice(k,1);
  while(nx<n&&timeAt(nx)<now+4)step(nx++);if(nx<n)pumpT=setTimeout(pump,250)};
 const dens=CRACKLE[SG("crackle")]||0;
 if(dens){const nb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),cd=nb.getChannelData(0);for(let i=0;i<cd.length;i++)cd[i]=Math.random()<dens?Math.random()*2-1:0;
  const ns=ctx.createBufferSource(),ng=ctx.createGain();ng.gain.value=.5;ns.buffer=nb;ns.loop=true;ns.connect(ng);ng.connect(out);ns.start(t0);ns.stop(timeAt(n)+.1);os.push(ns)}
 nodes=os;pump();
 const tick=()=>{const elapsed=(ctx.currentTime-t0)/SP;
  if(elapsed>=unitAt(n)){if(SG("loop")){const f=onPos,e=onStop;onStop=null;nodes.forEach(o=>{try{o.stop()}catch(x){}});nodes=null;cancelAnimationFrame(raf);f(0);playToks(toks,f,e,spd);return}stopAudio();return}
  let lo=0,hi=n;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(unitAt(mid)<=elapsed)lo=mid;else hi=mid-1}
  const p=lo<n?lo+(elapsed-unitAt(lo))/(unitAt(lo+1)-unitAt(lo)):n;
  onPos(Math.max(0,p));raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick)}
let ctx=null,nodes=null,raf=0,onStop=null,pumpT=0;
const AC=()=>{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();ctx.resume();return ctx};
function stopAudio(){cancelAnimationFrame(raf);clearTimeout(pumpT);pumpT=0;if(nodes){nodes.forEach(o=>{try{o.stop()}catch(e){}});nodes=null}if(onStop){const f=onStop;onStop=null;f()}}