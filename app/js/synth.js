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
 let lfo=null;if(I.vib){lfo=ctx.createOscillator();lfo.frequency.value=5.2;lfo.start(st);lfo.stop(en+.2);os.push(lfo)}
 I.p.forEach(([t,r,a])=>{const o=ctx.createOscillator(),ga=ctx.createGain();o.type=t;o.frequency.value=f*r;ga.gain.value=a;
  if(lfo){const lg=ctx.createGain();lg.gain.value=f*r*.006;lfo.connect(lg);lg.connect(o.frequency)}
  o.connect(ga);ga.connect(fl);o.start(st);o.stop(en+(sus?.1:(I.d||3.2)+.1));os.push(o)});
 fl.connect(g);g.connect(out)}
function drum(k,st,out,vol){
 const K=KITS[SG("drumKit")]||KITS.acoustic,P=K[k],g=ctx.createGain();g.connect(out);
 if(k==="k"){const o=ctx.createOscillator();o.frequency.setValueAtTime(P[0],st);o.frequency.exponentialRampToValueAtTime(P[1],st+P[2]);g.gain.setValueAtTime(P[4]*vol,st);g.gain.exponentialRampToValueAtTime(.001,st+P[3]);o.connect(g);o.start(st);o.stop(st+P[3]+.03);os.push(o)}
 else{const s=ctx.createBufferSource(),f=ctx.createBiquadFilter();s.buffer=noise;f.type="highpass";f.frequency.value=P[0];g.gain.setValueAtTime(P[2]*vol,st);g.gain.exponentialRampToValueAtTime(.001,st+P[1]);s.connect(f);f.connect(g);s.start(st);s.stop(st+P[1]+.05);os.push(s)}}
const CRACKLE={off:0,light:.0006,medium:.002,heavy:.005};
function playToks(toks,onPos,end,spd){
 AC();stopAudio();onStop=end;os=[];
 if(!noise){noise=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  verb=ctx.createBuffer(2,ctx.sampleRate*1.6|0,ctx.sampleRate);for(let c=0;c<2;c++){const q=verb.getChannelData(c);for(let i=0;i<q.length;i++)q[i]=(Math.random()*2-1)*Math.pow(1-i/q.length,3)}}
 const n=toks.length,SP=STEP/(spd||SPEED),t0=ctx.currentTime+.08,out=ctx.createGain(),comp=ctx.createDynamicsCompressor(),cv=ctx.createConvolver(),wet=ctx.createGain();
 const V=k=>(+SG(k)||0)/100,hum=+SG("humanize")||0,swing=(+SG("swing")||0)/100,tr=+SG("transpose")||0,bassI=SG("bassInst")||"organ";
 out.gain.value=.3*SG("volume")/60;cv.buffer=verb;wet.gain.value=V("reverb")*.6;out.connect(comp);out.connect(cv);cv.connect(wet);wet.connect(comp);comp.connect(ctx.destination);
 const mel=toks.map(t=>t%38),bas=toks.map(t=>Math.floor(t/38)%13),drm=toks.map(t=>Math.floor(t/494));let last=-1;
 const at=i=>t0+i*SP+(i%2?swing*SP*.5:0)+jit(hum/1000),vel=()=>1-(hum?Math.random()*hum/40*.35:0);
 for(let i=0;i<n;i++){const st=Math.max(t0,at(i));
  if(mel[i]>=2){let l=1;while(mel[i+l]===1)l++;last=mel[i]-2+48;voice(last+tr,st,Math.max(st+.05,t0+(i+l)*SP),INST,out,.9*V("melodyVol")*vel())}
  if(BAND){
   if(bas[i]&&(i===0||bas[i-1]!==bas[i]||i%4===0)){let l=1;while(i+l<n&&bas[i+l]===bas[i]&&(i+l)%4)l++;voice(35+bas[i]+tr,st,st+l*SP,bassI,out,.6*V("bassVol")*vel())}
   const dv=V("drumVol")*vel();if(drm[i]===1)drum("k",st,out,dv);else if(drm[i]===2)drum("s",st,out,dv);else if(drm[i]===3)drum("h",st,out,dv)}
  if(CHORDS&&i%16===0&&last>=0){const r=48+last%12;let mi=0,ma=0;for(let j=i;j<i+16;j++)if(mel[j]>=2){const pc=(mel[j]-2+48)%12;if(pc===(r+3)%12)mi=1;if(pc===(r+4)%12)ma=1}[0,mi&&!ma?3:4,7].forEach(x=>voice(r+x+tr,st,st+16*SP,"strings",out,.16*V("chordVol")))}}
 const dens=CRACKLE[SG("crackle")]||0;
 if(dens){const nb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),cd=nb.getChannelData(0);for(let i=0;i<cd.length;i++)cd[i]=Math.random()<dens?Math.random()*2-1:0;
  const ns=ctx.createBufferSource(),ng=ctx.createGain();ng.gain.value=.5;ns.buffer=nb;ns.loop=true;ns.connect(ng);ng.connect(out);ns.start(t0);ns.stop(t0+n*SP+.1);os.push(ns)}
 nodes=os;
 const tick=()=>{const p=(ctx.currentTime-t0)/SP;
  if(p>=n){if(SG("loop")){const f=onPos,e=onStop;onStop=null;nodes.forEach(o=>{try{o.stop()}catch(x){}});nodes=null;cancelAnimationFrame(raf);f(0);playToks(toks,f,e,spd);return}stopAudio();return}
  onPos(Math.max(0,p));raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick)}
let ctx=null,nodes=null,raf=0,onStop=null;
const AC=()=>{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();ctx.resume();return ctx};
function stopAudio(){cancelAnimationFrame(raf);if(nodes){nodes.forEach(o=>{try{o.stop()}catch(e){}});nodes=null}if(onStop){const f=onStop;onStop=null;f()}}
