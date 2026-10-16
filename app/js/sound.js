"use strict";
/* ---------- sound: the real waveform, kept as an address ---------- */
const MU=255,LMU=Math.log(1+MU),MULUT=Float32Array.from({length:256},(_,b)=>{const y=(b-127.5)/127.5,a=(Math.pow(1+MU,Math.abs(y))-1)/MU;return y<0?-a:a});
const toMu=x=>{const a=Math.min(1,Math.abs(x)),y=Math.log(1+MU*a)/LMU;return Math.max(0,Math.min(255,Math.round(((x<0?-y:y)+1)*127.5)))};
function packSnd(rate,u8){let s="";for(let i=0;i<u8.length;i+=30000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+30000));return"snd"+rate+":"+btoa(s)}
function unpackSnd(a){const m=/^snd(\d+):([A-Za-z0-9+\/=]+)$/.exec(a.trim());if(!m)throw Error("That isn't a sound address. They look like snd11025:AbC...");
 const rate=+m[1];if(rate<500||rate>96000)throw Error("That sample rate doesn't look right.");
 const bin=atob(m[2]);if(bin.length<2||bin.length>96e6)throw Error("That sound is too long.");
 const u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);return{rate,u8}}
const sndF32=u8=>{const f=new Float32Array(u8.length);for(let i=0;i<u8.length;i++)f[i]=MULUT[u8[i]];return f};
function wavBlob(f,rate){const n=f.length,b=new DataView(new ArrayBuffer(44+n*2)),w=(o,s)=>{for(let i=0;i<s.length;i++)b.setUint8(o+i,s.charCodeAt(i))};
 w(0,"RIFF");b.setUint32(4,36+n*2,true);w(8,"WAVEfmt ");b.setUint32(16,16,true);b.setUint16(20,1,true);b.setUint16(22,1,true);b.setUint32(24,rate,true);b.setUint32(28,rate*2,true);b.setUint16(32,2,true);b.setUint16(34,16,true);w(36,"data");b.setUint32(40,n*2,true);
 for(let i=0;i<n;i++)b.setInt16(44+i*2,Math.max(-1,Math.min(1,f[i]))*32767,true);return new Blob([b],{type:"audio/wav"})}
function soundView(addr0){
 v.innerHTML="";v.append(mk("h2",null,"Sound"),mk("p","lede","Real audio, stored as numbers. Upload an mp3 or wav and its address is the sound itself. Pick how much of it to keep and how clear it should be. A lower sample rate gives a much shorter address, but the sound gets muffled and crunchy."));
 const f=mk("input");f.type="file";f.accept="audio/*,.mp3";
 const s0=mk("input");s0.type="number";s0.min=0;s0.value=0;s0.style.width="80px";
 const ln=mk("select"),rt=mk("select");[[5,"5 seconds"],[10,"10 seconds"],[20,"20 seconds"],[30,"30 seconds"],[60,"1 minute"],[120,"2 minutes"],[300,"5 minutes"],[600,"10 minutes"],["full","The whole song"]].forEach(([x,t])=>ln.append(new Option(t,x,x===10,x===10)));
 [[1000,"1 kHz, tiniest"],[2000,"2 kHz"],[4000,"4 kHz"],[8000,"8 kHz, phone"],[11025,"11 kHz"],[16000,"16 kHz"],[22050,"22 kHz"],[32000,"32 kHz, best"],[44100,"44.1 kHz, CD"]].forEach(([x,t])=>rt.append(new Option(t,x,x===11025,x===11025)));
 const go=mk("button","btn pri","Store it"),st=mk("div","note"),cv=mk("canvas"),ad=mk("div","addr"),acts=mk("div","acts");
 cv.width=900;cv.height=120;cv.style.cssText="width:100%;max-width:900px;height:120px;background:#0f0c09;border:1px solid var(--bd);border-radius:3px;margin-top:10px;display:none";
 let buf=null,cur="",pf=null,prate=0;
 const draw=x=>{const c=cv.getContext("2d"),W=cv.width,H=cv.height;c.clearRect(0,0,W,H);c.fillStyle="#c79a4a";const per=x.length/W;
  for(let i=0;i<W;i++){let lo=0,hi=0;const a=Math.floor(i*per),b=Math.max(a+1,Math.floor((i+1)*per));for(let k=a;k<b&&k<x.length;k++){if(x[k]<lo)lo=x[k];if(x[k]>hi)hi=x[k]}c.fillRect(i,H/2-hi*H/2,1,Math.max(1,(hi-lo)*H/2))}};
 const show=(rate,u8)=>{pf=sndF32(u8);prate=rate;cur=packSnd(rate,u8);cv.style.display="block";draw(pf);
  ad.textContent=cur.length>140?cur.slice(0,70)+"..."+cur.slice(-30)+" ("+cur.length.toLocaleString()+" characters)":cur;
  const small=cur.length<8000;st.textContent=(u8.length/rate<1?Math.max(1,Math.round(u8.length/rate*1000))+" milliseconds":(u8.length/rate).toFixed(1)+" seconds")+" at "+rate+" Hz."+(small?"":" Too big for a link, so copy the address or save it as text to share it.");
  try{history.replaceState({},"",small?"?m=sound&p="+encodeURIComponent(cur):"?m=sound")}catch(e){}};
 const fromText=t=>{try{const p=unpackSnd(t);show(p.rate,p.u8)}catch(e){st.textContent=e.message}};
 const store=async()=>{if(!buf){st.textContent="Add an audio file first.";return}
  try{const rate=+rt.value,want=ln.value==="full"?buf.duration:+ln.value,secs=Math.max(.2,Math.min(want,buf.duration)),s=Math.min(Math.max(0,+s0.value||0),Math.max(0,buf.duration-secs));s0.value=s;st.textContent="Storing it...";
   /* browsers won't render below 8 kHz, so render higher and average down */
   const rr=rate<8000?rate*Math.ceil(8000/rate):rate,ra=rr/rate,n=Math.max(1,Math.round(secs*rate));
   const oc=new OfflineAudioContext(1,n*ra,rr),src=oc.createBufferSource();src.buffer=buf;src.connect(oc.destination);src.start(0,s,secs);
   const out=(await oc.startRendering()).getChannelData(0),u8=new Uint8Array(n);
   for(let i=0;i<n;i++){let t=0;for(let k=0;k<ra;k++)t+=out[i*ra+k]||0;u8[i]=toMu(t/ra)}show(rate,u8)}
  catch(e){st.textContent="Couldn't store that clip."}};
 const load=async file=>{st.textContent="Reading it...";try{buf=await AC().decodeAudioData(await file.arrayBuffer());s0.max=Math.max(0,Math.floor(buf.duration-1));st.textContent="Got it. It's "+Math.round(buf.duration)+" seconds long.";await store()}catch(e){buf=null;st.textContent="Couldn't read that file. Try an mp3 or wav."}};
 f.onchange=()=>f.files[0]&&load(f.files[0]);go.onclick=store;
 const r1=mk("div","row");r1.append(f,mk("span",null,"start at"),s0,mk("span",null,"sec, for"),ln,rt,go);
 const ta=mk("textarea");ta.placeholder="Paste a sound address";const sh=mk("button","btn pri","Hear it"),bar=mk("div","bar");sh.onclick=()=>fromText(ta.value);bar.append(ta,sh);
 const rn=mk("button","btn pri","Random sound"),rn2=mk("button","btn","Random, at the length and rate above");
 rn.onclick=()=>{const r=genSound();rt.value=String(r.rate);show(r.rate,r.u8)};
 rn2.onclick=()=>{const rate=+rt.value,n=Math.max(8,Math.round((ln.value==="full"?30:+ln.value)*rate)),r=genSound(rate,n);show(r.rate,r.u8)};
 const pl=mk("button","btn pri","Play");
 pl.onclick=()=>{if(!pf)return;if(pl.dataset.on){stopAudio();return}AC();stopAudio();let b,rate=prate,x=pf;
  try{b=ctx.createBuffer(1,x.length,rate)}catch(e){const r2=44100,y=new Float32Array(Math.round(x.length*r2/rate));for(let i=0;i<y.length;i++){const q=i*rate/r2,a=Math.floor(q),t=q-a;y[i]=x[a]*(1-t)+(x[Math.min(a+1,x.length-1)])*t}x=y;b=ctx.createBuffer(1,x.length,r2)}
  b.copyToChannel(x,0);const s=ctx.createBufferSource(),g=ctx.createGain();g.gain.value=.6*SG("volume")/60;s.buffer=b;s.connect(g);g.connect(ctx.destination);pl.dataset.on=1;pl.textContent="Stop";
  nodes=[s];onStop=()=>{delete pl.dataset.on;pl.textContent="Play"};s.onended=()=>stopAudio();s.start()};
 const cp=mk("button","btn","Copy address"),dl=mk("button","btn","Save address as text"),sw=mk("button","btn","Save as WAV");
 cp.onclick=()=>cur&&copy(cur,st);
 dl.onclick=()=>{if(!cur)return;const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([cur]));a.download="babel-sound-address.txt";a.click()};
 sw.onclick=()=>{if(!pf)return;const a=document.createElement("a");a.href=URL.createObjectURL(wavBlob(pf,prate));a.download="babel-sound.wav";a.click()};
 acts.append(pl,rn,rn2,cp,dl,sw);v.append(r1,bar,st,ad,acts,cv,mk("p","fine","Random picks a length that fits in a link, then a volume, then a kind of sound, so you get tones, rumbles, bleeps and clicks as well as plain static. Static is still by far the most common thing in here."));
 if(addr0)fromText(addr0);
 if(pending){const p0=pending;pending=null;load(p0)}}
