"use strict";
/* ---------- synth: instruments, drums, and the player ----------
   A record is first turned into a plan (a list of timed notes, drum hits and chords), then the plan is played live
   a few seconds at a time, or rendered all at once for saving and for checking how close it sounds to the original. */
let INST=SG("inst"),BAND=!!SG("band"),CHORDS=!!SG("chords"),SPEED=(+SG("tempo")||100)/100,os=[];
/* [wave, overtone multiple, loudness] per oscillator. f = brightness, s = holds its note, a = fade-in, d = fixed fade-out */
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
const INST_NAMES=[["match","Match the recording"],["piano","Piano"],["organ","Organ"],["strings","Strings"],["guitar","Guitar"],["flute","Flute"],["marimba","Marimba"],["synth","Synth lead"],["musicbox","Music box"],["bell","Bell"],["chip","Chip"]];
const BASS_NAMES=[["organ","Organ"],["sub","Sub bass"],["piano","Piano"],["strings","Strings"],["synth","Synth"]];
/* kick: [start Hz, end Hz, sweep time, length, loudness]; snare and hat: [filter Hz, length, loudness] */
const KITS={acoustic:{k:[140,45,.12,.24,.9],s:[1800,.17,.5],h:[7000,.045,.13]},
 "808":{k:[110,32,.3,.55,1],s:[1200,.2,.4],h:[9000,.05,.11]},
 soft:{k:[100,50,.1,.18,.6],s:[2500,.12,.26],h:[8000,.03,.08]},
 electronic:{k:[200,48,.08,.2,.9],s:[3000,.1,.5],h:[11000,.03,.14]}};
const jit=amt=>amt?(Math.random()*2-1)*amt:0;
const CRACKLE={off:0,light:.0006,medium:.002,heavy:.005};
let ctx=null,nodes=null,raf=0,onStop=null,pumpT=0;
const AC=()=>{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();ctx.resume();return ctx};

/* ---- loudness and tuning that travel with a record ---- */
const velGain=v=>Math.min(1.5,Math.pow(10,(v-56)*.8/20));
/* which sidecar goes with these tokens: the one from the clip just converted, or the one in the link */
function mxFor(toks){if(tuneSel)return null;if(typeof isOrig==="function"&&isOrig(toks)&&orig&&orig.mx)return orig.mx;return MUSIC_MX||null}

/* ---- the real piano: recorded samples (Salamander Grand Piano, CC BY 3.0), one every three semitones, bent to fit ---- */
const PIANO={bufs:null,ready:null,tried:false};
const pianoName=m=>["C","Cs","D","Ds","E","F","Fs","G","Gs","A","As","B"][m%12]+(Math.floor(m/12)-1);
function loadPiano(){
 if(PIANO.ready)return PIANO.ready;
 PIANO.ready=(async()=>{const c=AC(),bufs={},names=[];for(let m=21;m<=108;m+=3)names.push([m,pianoName(m)]);
  const embedded=window.BABEL_PIANO_B64;
  const bases=[window.BABEL_DATA_BASE&&window.BABEL_DATA_BASE+"piano/","data/piano/","https://cdn.jsdelivr.net/gh/b4936955-hue/LibraryBabel@latest/data/piano/"].filter(Boolean);
  try{await Promise.all(names.map(async([m,n])=>{let ab=null;
    if(embedded&&embedded[n]){const bin=atob(embedded[n]),u=new Uint8Array(bin.length);for(let i=0;i<u.length;i++)u[i]=bin.charCodeAt(i);ab=u.buffer}
    else for(const b of bases){try{const r=await fetch(b+n+".mp3");if(r.ok){ab=await r.arrayBuffer();break}}catch(e){}}
    if(!ab)throw new Error("no "+n);bufs[m]=await c.decodeAudioData(ab)}));PIANO.bufs=bufs}catch(e){PIANO.bufs=null;PIANO.failed=true}
  return PIANO.bufs})();return PIANO.ready}
function pianoVoice(c,m,st,en,out,vol,fr,mx){
 let best=null,bd=99;for(const k in PIANO.bufs){const d=Math.abs(+k-m);if(d<bd){bd=d;best=+k}}
 const s=c.createBufferSource(),g=c.createGain(),rate=Math.pow(2,(m-best)/12+((mx&&mx.tune)||0)/1200),hold=Math.max(en,st+.08),rel=.22;
 s.buffer=PIANO.bufs[best];s.playbackRate.value=rate;g.gain.setValueAtTime(vol,st);g.gain.setValueAtTime(vol,hold);g.gain.setTargetAtTime(0,hold,rel/3);
 /* the samples carry low hammer/room noise; stacked over hundreds of high notes it becomes a low mud, so each note only keeps what is at or above its own pitch */
 const hp=c.createBiquadFilter();hp.type="highpass";hp.Q.value=.707;hp.frequency.value=Math.min(c.sampleRate*.45,440*Math.pow(2,(m-69)/12+((mx&&mx.tune)||0)/1200)*.9);
 s.connect(hp);hp.connect(g);g.connect(out);s.start(st);const stop=Math.min(st+s.buffer.duration/rate,hold+rel*2.5);s.stop(stop);s._e=stop;fr.push(s)}

/* ---- one note ---- */
const waveCache=new WeakMap();
function profWave(c,mx,reg){let m=waveCache.get(c);if(!m)waveCache.set(c,m=new Map());const key=(mx.inst?mx.inst.harm[reg].map(v=>v.toFixed(2)).join():"d")+"|"+reg;let w=m.get(key);
 if(!w){const H=mx.inst?mx.inst.harm[reg]:[1,.5,.3,.2,.12,.08,.05,.03,.02,.015,.01,.01],re=new Float32Array(H.length+1),im=new Float32Array(H.length+1);for(let h=1;h<=H.length;h++)im[h]=H[h-1];w=c.createPeriodicWave(re,im);m.set(key,w)}return w}
/* the "match" instrument: overtones and fade speed taken from the recording itself */
function matchVoice(c,m,st,en,out,vol,mx,noise,fr){
 const f=440*Math.pow(2,(m-69)/12+(mx.tune||0)/1200),reg=m<=52?0:m<=72?1:2,inst=mx.inst||{tau:1.2},sustained=inst.tau>=8,
  tau=sustained?inst.tau:Math.max(.12,inst.tau*Math.pow(2,-(m-60)/30)),g=c.createGain(),lp=c.createBiquadFilter(),w=profWave(c,mx,reg),rel=sustained?.09:.16;
 lp.type="lowpass";const top=Math.min(c.sampleRate*.45,f*(5+14*Math.min(1,vol*1.2)));lp.frequency.setValueAtTime(top,st);if(!sustained)lp.frequency.exponentialRampToValueAtTime(Math.max(f*3.5,300),st+Math.min(3,tau*.9));
 const atk=sustained?.03:.004;g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(vol,st+atk);
 if(sustained){g.gain.setValueAtTime(vol*.9,Math.max(st+atk+.01,en-.02));g.gain.linearRampToValueAtTime(0,en+rel)}
 else{g.gain.setTargetAtTime(0,st+atk,tau/2.2);const hold=Math.max(en,st+.06);g.gain.setValueAtTime(vol*Math.exp(-(hold-st-atk)/(tau/2.2))+1e-5,hold);g.gain.setTargetAtTime(0,hold,rel/3)}
 const stop=en+(sustained?rel+.1:Math.min(3,tau*2.2)+.3);
 [-1,1].forEach(s=>{const o=c.createOscillator(),og=c.createGain();o.setPeriodicWave(w);o.frequency.value=f*(1+s*.0005);og.gain.value=.5;o.connect(og);og.connect(lp);o.start(st);o.stop(stop);o._e=stop;fr.push(o)});
 lp.connect(g);g.connect(out);
 if(!sustained&&noise){const s=c.createBufferSource(),bp=c.createBiquadFilter(),ng=c.createGain();s.buffer=noise;bp.type="bandpass";bp.frequency.value=Math.min(c.sampleRate*.4,f*3+400);bp.Q.value=.8;ng.gain.setValueAtTime(vol*.18,st);ng.gain.exponentialRampToValueAtTime(.0005,st+.03);s.connect(bp);bp.connect(ng);ng.connect(out);s.start(st);s.stop(st+.05);s._e=st+.06;fr.push(s)}}
function voice(c,m,st,en,kind,out,vol,fr,mx,noise){
 if(kind==="piano"&&PIANO.bufs)return pianoVoice(c,m,st,en,out,vol*1.15,fr,mx);
 if(kind==="match"&&mx)return matchVoice(c,m,st,en,out,vol,mx,noise,fr);
 const I=INSTR[kind==="match"?"piano":kind]||INSTR.piano,f=440*Math.pow(2,(m-69)/12+((mx&&mx.tune)||0)/1200),g=c.createGain(),fl=c.createBiquadFilter(),sus=!!I.s,len=en-st,atk=I.a||.01;
 fl.type="lowpass";fl.frequency.value=I.f;
 g.gain.setValueAtTime(0,st);g.gain.linearRampToValueAtTime(vol,st+atk);
 if(sus){g.gain.setValueAtTime(vol*.85,Math.max(st+atk+.01,en-.06));g.gain.linearRampToValueAtTime(0,en+.05)}
 else g.gain.exponentialRampToValueAtTime(.001,st+(I.d||Math.min(len*1.4+.3,3.2)));
 let lfo=null;if(I.vib){lfo=c.createOscillator();lfo.frequency.value=5.2;lfo.start(st);lfo.stop(en+.2);lfo._e=en+.2;fr.push(lfo)}
 I.p.forEach(([t,r,a])=>{const o=c.createOscillator(),ga=c.createGain();o.type=t;o.frequency.value=f*r;ga.gain.value=a;
  if(lfo){const lg=c.createGain();lg.gain.value=f*r*.006;lfo.connect(lg);lg.connect(o.frequency)}
  o.connect(ga);ga.connect(fl);o.start(st);o._e=en+(sus?.1:(I.d||3.2)+.1);o.stop(o._e);fr.push(o)});
 fl.connect(g);g.connect(out)}
function drum(c,k,st,out,vol,fr,noise){
 const K=KITS[SG("drumKit")]||KITS.acoustic,P=K[k],g=c.createGain();g.connect(out);
 const nz=(f,type,q,gain,len,when)=>{const s=c.createBufferSource(),fl=c.createBiquadFilter(),ng=c.createGain();s.buffer=noise;fl.type=type;fl.frequency.value=f;fl.Q.value=q;ng.gain.setValueAtTime(gain*vol,when);ng.gain.exponentialRampToValueAtTime(.001,when+len);ng.gain.linearRampToValueAtTime(0,when+len+.012);s.connect(fl);fl.connect(ng);ng.connect(out);s.start(when,Math.random()*.5);s._e=when+len+.05;s.stop(s._e);fr.push(s)};
 if(k==="k"){const o=c.createOscillator(),lp=c.createBiquadFilter();lp.type="lowpass";lp.frequency.value=900;o.frequency.setValueAtTime(P[0],st);o.frequency.exponentialRampToValueAtTime(P[1],st+P[2]);g.gain.setValueAtTime(P[4]*vol,st);g.gain.exponentialRampToValueAtTime(.001,st+P[3]);g.gain.linearRampToValueAtTime(0,st+P[3]+.015);o.connect(lp);lp.connect(g);o.start(st);o._e=st+P[3]+.03;o.stop(o._e);fr.push(o);nz(3000,"bandpass",1,.12,.012,st)}
 else if(k==="s"){const o=c.createOscillator(),og=c.createGain();o.type="triangle";o.frequency.setValueAtTime(220,st);o.frequency.exponentialRampToValueAtTime(150,st+.08);og.gain.setValueAtTime(.35*vol,st);og.gain.exponentialRampToValueAtTime(.001,st+.13);og.gain.linearRampToValueAtTime(0,st+.145);o.connect(og);og.connect(out);o.start(st);o._e=st+.16;o.stop(o._e);fr.push(o);nz(P[0]*.9,"highpass",.7,P[2]*.9,P[1],st);nz(5200,"bandpass",.8,P[2]*.35,P[1]*.7,st)}
 else{nz(P[0],"highpass",.8,P[2]*1.1,P[1],st);nz(Math.min(P[0]*1.25,13000),"bandpass",2.5,P[2]*.6,P[1]*.8,st)}}
/* ---- the plan: every note, drum hit and chord with its time, built from the tokens ---- */
function buildPlan(toks,o){
 o=o||{};const n=toks.length,poly=o.poly,SP=STEP/(o.spd||SPEED),mx=o.mx||null,timingData=o.timing||null;
 const timing=timingData&&timingData.stepTimes&&timingData.stepTimes.length===n+1?timingData.stepTimes:null,stepSec=timing?(timingData.stepSec||STEP/(timingData.speed||SPEED)):0;
 const unitAt=i=>timing?timing[Math.max(0,Math.min(n,i))]*stepSec/STEP:Math.max(0,Math.min(n,i)),timeAt=i=>unitAt(i)*SP;
 const V=k=>(+SG(k)||0)/100,hum=+SG("humanize")||0,swing=(+SG("swing")||0)/100,tr=+SG("transpose")||0,bassI=SG("bassSound")||"piano";
 const parts=toks.map(t=>musicParts(t,poly)),L=poly?MUSIC_VOICES:1,mel=Array.from({length:L},(_,v)=>parts.map(p=>p.voices[v]||0)),bas=parts.map(p=>p.bass),drm=parts.map(p=>p.drum);
 const BS=o.sub||4,useChords=o.chords&&!o.noChords,band=o.band!==false,ev=[];
 /* number every note start, in step then part order: that is how the sidecar lines up with the notes */
 let onset=0,last=-1;const vg=o.mixVel!==false;
 const at=i=>timeAt(i)+(i%2&&!timing?swing*(unitAt(i+1)-unitAt(i))*SP*.5:0)+jit(hum/1000),vel=()=>1-(hum?Math.random()*hum/40*.35:0);
 const from=o.from||0;
 for(let i=0;i<n;i++){const st=Math.max(0,at(i));
  for(let l=0;l<L;l++){const c=mel[l][i];if(c>=2){const k=onset++;let len=1;while(mel[l][i+len]===1)len++;
    if(i<from)continue;const note=c-2+48+(mx&&mx.oct?12*(mx.oct[k]||0):0),vv=mx&&mx.vel&&vg?velGain(mx.vel[k]==null?44:mx.vel[k]):.8;
    if(l===0)last=note;ev.push({t:st,e:Math.max(st+.05,timeAt(i+len)),k:"n",m:note+tr,v:.9*V("melodyVol")*vv*vel()})}}
  if(i<from)continue;
  if(band){
   if(bas[i]&&(i===0||bas[i-1]!==bas[i]||i%BS===0)){let len=1;while(i+len<n&&bas[i+len]===bas[i]&&(i+len)%BS)len++;ev.push({t:st,e:Math.max(st+.05,timeAt(i+len)),k:"b",m:35+bas[i]+tr,v:.6*V("bassVol")*vel()})}
   const dv=V("drumVol")*vel();if(drm[i]===1)ev.push({t:st,k:"d",d:"k",v:dv});else if(drm[i]===2)ev.push({t:st,k:"d",d:"s",v:dv});else if(drm[i]===3)ev.push({t:st,k:"d",d:"h",v:dv})}
  if(useChords&&i%(4*BS)===0&&last>=0){const BL=4*BS,cnt=new Array(13).fill(0);for(let j=i;j<i+BL&&j<n;j++)cnt[bas[j]]++;let bb=0;for(let q=1;q<=12;q++)if(cnt[q]>cnt[bb]||(bb===0&&cnt[q]>0))bb=q;
   const r=bb?48+(bb-1):48+last%12;let mi=0,ma=0;for(let j=i;j<i+BL&&j<n;j++)if(mel[0][j]>=2){const pc=(mel[0][j]-2+48)%12;if(pc===(r+3)%12)mi=1;if(pc===(r+4)%12)ma=1}
   [0,mi&&!ma?3:4,7].forEach(x=>ev.push({t:st,e:Math.max(st+.05,timeAt(i+BL)),k:"c",m:r+x+tr,v:.16*V("chordVol")}))}}
 const t0=timeAt(from);ev.forEach(e=>{e.t-=t0;if(e.e!=null)e.e-=t0});
 return{ev,total:timeAt(n)-t0,unitAt,timeAt,n,mx}}

/* ---- the output chain: volume, matching EQ, compressor, room echo ---- */
const EQ_HZ=[80,160,320,640,1250,2500,5000,8000,12000];
function masterChain(c,mx,reverb,gain){
 const out=c.createGain(),comp=c.createDynamicsCompressor(),cv=c.createConvolver(),wet=c.createGain(),hp=c.createBiquadFilter();let head=out;hp.type="highpass";hp.frequency.value=28;hp.Q.value=.6;comp.threshold.value=-14;comp.knee.value=12;comp.ratio.value=3.5;comp.attack.value=.004;comp.release.value=.2;
 out.gain.value=gain*(mx&&mx.eq&&mx.eq[9]?Math.pow(10,mx.eq[9]/20):1);
 if(mx&&mx.eq&&mx.eq.some(x=>x)){EQ_HZ.forEach((hz,i)=>{if(hz>c.sampleRate*.45)return;const b=c.createBiquadFilter();b.type="peaking";b.frequency.value=hz;b.Q.value=1.1;b.gain.value=mx.eq[i]||0;head.connect(b);head=b})}
 const len=c.sampleRate*1.6|0,ir=c.createBuffer(2,len,c.sampleRate);for(let ch=0;ch<2;ch++){const q=ir.getChannelData(ch);let z=0;for(let i=0;i<len;i++){z+=.28*((Math.random()*2-1)-z);q[i]=z*2.6*Math.pow(1-i/len,3)}}
 cv.buffer=ir;wet.gain.value=reverb;head.connect(hp);hp.connect(comp);head.connect(cv);cv.connect(wet);wet.connect(comp);comp.connect(c.destination);return out}
function makeNoise(c){const b=c.createBuffer(1,c.sampleRate,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b}
function emit(c,out,e,t0,kind,bassI,noise,mx,fr){
 if(e.k==="n")voice(c,e.m,t0+e.t,t0+e.e,kind,out,e.v,fr,mx,noise);
 else if(e.k==="b")voice(c,e.m,t0+e.t,t0+e.e,bassI,out,e.v,fr,null,noise);
 else if(e.k==="c")voice(c,e.m,t0+e.t,t0+e.e,"piano",out,e.v*.8,fr,null,noise);
 else drum(c,e.d,t0+e.t,out,e.v,fr,noise)}
/* the whole record rendered at once into an audio buffer (for saving, and for scoring against the original) */
async function renderToks(toks,o){
 o=o||{};const rate=o.rate||44100,mx=o.mx||null,plan=buildPlan(toks,{...o,mx,chords:false,poly:o.poly!==false});
 const len=Math.ceil((plan.total+2.5)*rate),c=new OfflineAudioContext(1,len,rate),noise=makeNoise(c),out=masterChain(c,mx,o.reverb==null?(+SG("reverb")||0)/100*.6:o.reverb,o.gain==null?.3*SG("volume")/60:o.gain),fr=[];
 const kind=o.inst||"match";plan.ev.forEach(e=>emit(c,out,e,0,kind,SG("bassSound")||"piano",noise,mx,fr));
 return c.startRendering()}

/* ---- live playback ---- */
function playToks(toks,onPos,end,spd,from){
 AC();stopAudio();onStop=end;os=[];from=from||0;
 const tun=!!tuneSel,mx=mxFor(toks),mine=!tun&&isOrig(toks)&&orig,timing=!tun?(mine&&orig.stepTimes?orig:MUSIC_TIMING):null,SP=STEP/(spd||SPEED),n=toks.length;
 const hasBand=!mx||mx.band!==false&&!(mine&&orig.pianoOnly);
 const plan=buildPlan(toks,{poly:MUSIC_POLY&&!tun,spd,mx,timing,from,chords:CHORDS&&!pianoRecord&&hasBand,band:BAND&&hasBand,sub:(mine&&orig.sub)||4});
 const t0=ctx.currentTime+.08,noise=ctx._noise||(ctx._noise=makeNoise(ctx)),out=masterChain(ctx,mx,(+SG("reverb")||0)/100*.6,.3*SG("volume")/60),kind=INST,bassI=SG("bassSound")||"piano";
 const base=plan.unitAt(from);nodes=os;
 const dens=CRACKLE[SG("crackle")]||0;
 if(dens){const nb=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),cd=nb.getChannelData(0);for(let i=0;i<cd.length;i++)cd[i]=Math.random()<dens?Math.random()*2-1:0;
  const ns=ctx.createBufferSource(),ng=ctx.createGain();ng.gain.value=.5;ns.buffer=nb;ns.loop=true;ns.connect(ng);ng.connect(out);ns.start(t0);ns.stop(t0+plan.total+.1);os.push(ns)}
 let nx=0;const pump=()=>{pumpT=0;if(!ctx||nodes!==os)return;const now=ctx.currentTime;for(let k=os.length-1;k>=0;k--)if(os[k]._e<now)os.splice(k,1);
  while(nx<plan.ev.length&&t0+plan.ev[nx].t<now+4)emit(ctx,out,plan.ev[nx++],t0,kind,bassI,noise,mx,os);if(nx<plan.ev.length)pumpT=setTimeout(pump,250)};
 pump();
 const tick=()=>{const elapsed=(ctx.currentTime-t0)/SP+base;
  if(elapsed>=plan.unitAt(n)){if(SG("loop")){const f=onPos,e=onStop;onStop=null;nodes.forEach(o=>{try{o.stop()}catch(x){}});nodes=null;cancelAnimationFrame(raf);f(0);playToks(toks,f,e,spd);return}stopAudio();return}
  let lo=0,hi=n;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(plan.unitAt(mid)<=elapsed)lo=mid;else hi=mid-1}
  const p=lo<n?lo+(elapsed-plan.unitAt(lo))/(plan.unitAt(lo+1)-plan.unitAt(lo)):n;
  onPos(Math.max(0,p));raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick)}
function stopAudio(){cancelAnimationFrame(raf);clearTimeout(pumpT);pumpT=0;if(nodes){nodes.forEach(o=>{try{o.stop()}catch(e){}});nodes=null}if(onStop){const f=onStop;onStop=null;f()}}

/* ---- a plain list of notes at their real times: {t, e, m, v} in seconds, MIDI number, loudness 0-63 ---- */
function notePlan(list,o){o=o||{};const from=o.from||0,tr=+SG("transpose")||0,V=(+SG("melodyVol")||0)/100,ev=[];
 for(const x of list){if(x.e<=from)continue;const t=Math.max(0,x.t-from);ev.push({t,e:Math.max(t+.06,x.e-from),k:"n",m:x.m+tr,v:.9*V*velGain(x.v==null?44:x.v)*(x.t<from?.7:1)})}
 const last=list.reduce((a,x)=>Math.max(a,x.e),0);return{ev,total:Math.max(0,last-from)+.5}}
async function renderNotes(list,o){o=o||{};await loadPiano();const rate=o.rate||44100,plan=notePlan(list,o),mx=o.mx||null,c=new OfflineAudioContext(1,Math.ceil((plan.total+3)*rate),rate),noise=makeNoise(c),out=masterChain(c,mx,(+SG("reverb")||0)/100*.6,.3*SG("volume")/60),fr=[];
 plan.ev.forEach(e=>emit(c,out,e,0,o.inst||INST,"organ",noise,mx,fr));return c.startRendering()}
function playNotes(list,onSec,end,from){
 AC();stopAudio();onStop=end;os=[];from=from||0;const plan=notePlan(list,{from}),mx=null;
 const t0=ctx.currentTime+.08,noise=ctx._noise||(ctx._noise=makeNoise(ctx)),out=masterChain(ctx,mx,(+SG("reverb")||0)/100*.6,.3*SG("volume")/60);nodes=os;
 let nx=0;const pump=()=>{pumpT=0;if(!ctx||nodes!==os)return;const now=ctx.currentTime;for(let k=os.length-1;k>=0;k--)if(os[k]._e<now)os.splice(k,1);
  while(nx<plan.ev.length&&t0+plan.ev[nx].t<now+3)emit(ctx,out,plan.ev[nx++],t0,INST,"organ",noise,mx,os);if(nx<plan.ev.length)pumpT=setTimeout(pump,200)};pump();
 const tick=()=>{const el=ctx.currentTime-t0+from;if(el>=from+plan.total){if(SG("loop")){const f=onSec,e=onStop;onStop=null;nodes.forEach(o=>{try{o.stop()}catch(x){}});nodes=null;cancelAnimationFrame(raf);playNotes(list,f,e,0);return}stopAudio();return}onSec(Math.max(0,el));raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick)}
