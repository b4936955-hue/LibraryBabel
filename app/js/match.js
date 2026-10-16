"use strict";
/* ---------- how close does the rebuilt song sound to the original? ----------
   Both are chopped into short frames and compared on four things people actually hear: which notes are sounding (chroma),
   the tone colour (band shape), how loud it is moment to moment, and where the hits fall. The result is a score out of 100.
   The same comparison lets the converter try several readings of a clip and keep the closest one. */
function matchFeatures(x,rate,t0,secs){
 const N=Math.max(512,Math.pow(2,Math.round(Math.log2(rate*.0464)))),hop=Math.round(rate*.05),s0=Math.round(t0*rate)-(N>>1),T=Math.max(1,Math.floor((secs*rate-N)/hop)),re=new Float32Array(N),im=new Float32Array(N),w=HANN[N]||(HANN[N]=Float32Array.from({length:N},(_,i)=>.5-.5*Math.cos(2*Math.PI*i/N)));
 const NB=32,edges=Array.from({length:NB+1},(_,i)=>80*Math.pow(8000/80,i/NB)),bandOf=new Int16Array(N/2).fill(-1),chromaOf=new Int8Array(N/2).fill(-1);
 for(let b=1;b<N/2;b++){const f=b*rate/N;if(f>=80&&f<8000){let q=0;while(q<NB-1&&f>=edges[q+1])q++;bandOf[b]=q}if(f>=65&&f<2100)chromaOf[b]=((Math.round(12*Math.log2(f/440))+9)%12+12)%12}
 const bands=[],chroma=[],loud=new Float32Array(T),flux=new Float32Array(T);let prev=null;
 for(let t=0;t<T;t++){for(let i=0;i<N;i++){const k=s0+t*hop+i;re[i]=k>=0&&k<x.length?x[k]*w[i]:0;im[i]=0}fft(re,im);
  const bd=new Float32Array(NB),ch=new Float32Array(12);let tot=0;
  for(let b=1;b<N/2;b++){const e=re[b]*re[b]+im[b]*im[b];if(bandOf[b]>=0)bd[bandOf[b]]+=e;if(chromaOf[b]>=0)ch[chromaOf[b]]+=Math.sqrt(e);tot+=e}
  const db=Float32Array.from(bd,v=>10*Math.log10(v+1e-9));{let mx=-1e9;for(const v of db)if(v>mx)mx=v;for(let q=0;q<NB;q++)if(db[q]<mx-60)db[q]=mx-60}bands.push(db);chroma.push(ch);loud[t]=10*Math.log10(tot+1e-9);
  if(prev){let f=0;for(let q=0;q<NB;q++)f+=Math.max(0,db[q]-prev[q]);flux[t]=f}prev=db}
 return{bands,chroma,loud,flux,T,NB}}
function corr(a,b){const n=Math.min(a.length,b.length);let ma=0,mb=0;for(let i=0;i<n;i++){ma+=a[i];mb+=b[i]}ma/=n;mb/=n;let sab=0,saa=0,sbb=0;for(let i=0;i<n;i++){const p=a[i]-ma,q=b[i]-mb;sab+=p*q;saa+=p*p;sbb+=q*q}return sab/Math.sqrt(saa*sbb+1e-12)}
function matchScore(origBuf,start,secs,rb){
 const mono=b=>{if(b.numberOfChannels===1)return b.getChannelData(0);const o=new Float32Array(b.length),n=b.numberOfChannels;for(let c=0;c<n;c++){const d=b.getChannelData(c);for(let i=0;i<o.length;i++)o[i]+=d[i]/n}return o};
 const len=Math.max(1,Math.min(secs,rb.duration-.1)),A=matchFeatures(mono(origBuf),origBuf.sampleRate,start,len),B=matchFeatures(mono(rb),rb.sampleRate,0,len),T=Math.min(A.T,B.T),lo=Math.min(4,T>>2),hi=T-lo;
 if(hi-lo<4)return{total:0,chroma:0,tone:0,loud:0,hits:0,ltas:new Array(9).fill(0)};
 let cs=0,cn=0,td=0,tn=0;const la=new Float32Array(A.NB),lb=new Float32Array(A.NB);
 for(let t=lo;t<hi;t++){let sab=0,saa=0,sbb=0;for(let k=0;k<12;k++){sab+=A.chroma[t][k]*B.chroma[t][k];saa+=A.chroma[t][k]**2;sbb+=B.chroma[t][k]**2}
  if(saa>1e-6&&sbb>1e-6){cs+=sab/Math.sqrt(saa*sbb);cn++}
  let ma=0,mb=0;for(let q=0;q<A.NB;q++){ma+=A.bands[t][q];mb+=B.bands[t][q]}ma/=A.NB;mb/=A.NB;let d=0;for(let q=0;q<A.NB;q++){d+=Math.abs((A.bands[t][q]-ma)-(B.bands[t][q]-mb));la[q]+=A.bands[t][q];lb[q]+=B.bands[t][q]}td+=d/A.NB;tn++}
 const chroma=cn?cs/cn:0,tone=Math.max(0,1-td/tn/18),ls=Array.from(la,(v,q)=>(v-lb[q])/tn),lm=ls.reduce((p,q)=>p+q,0)/ls.length;
 const ltasErr=Math.sqrt(ls.reduce((p,q)=>p+(q-lm)**2,0)/ls.length),ltas=Math.max(0,1-ltasErr/14);
 const loud=Math.max(0,corr(A.loud.subarray(lo,hi),B.loud.subarray(lo,hi))),hits=Math.max(0,corr(A.flux.subarray(lo,hi),B.flux.subarray(lo,hi)));
 /* gap per EQ band, original minus rebuilt, with the overall level difference taken out */
 const eqGap=EQ_HZ.map(hz=>{const q=Math.max(0,Math.min(A.NB-1,Math.round(Math.log(hz/80)/Math.log(8000/80)*A.NB)));let s=0,c=0;for(let d=-1;d<=1;d++){const k=q+d;if(k>=0&&k<A.NB){s+=ls[k]-lm;c++}}return s/c});
 return{level:lm,total:.35*chroma+.2*tone+.1*ltas+.15*loud+.2*hits,chroma,tone,ltas,loud,hits,eqGap}}
async function scoreTokens(toks,buf,start,secs,mx,timing,rate){
 const rb=await renderToks(toks,{rate:rate||22050,mx,timing,spd:1,poly:true,reverb:.12,gain:.3,inst:"match"});return{rb,sc:matchScore(buf,start,secs,rb)}}
/* try several readings, keep the closest, then even out the tone with a small EQ */
const MATCH_VARIANTS=[
 {lanes:5,abs:.2,rel:.3,bassField:false,drums:false},
 {lanes:5,abs:.2,rel:.3,bassField:false,drums:true},
 {lanes:5,abs:.3,rel:.42,bassField:false,drums:true},
 {lanes:3,abs:.25,rel:.38,bassField:true,drums:true},
 {lanes:4,abs:.15,rel:.25,bassField:false,drums:true},
 {lanes:1,abs:.3,rel:.5,bassField:true,drums:true}];
async function autoMatch(an,buf,cb){
 const timing={stepTimes:an.stepTimes,stepSec:an.stepSec},len=Math.min(an.secs,24);let best=null;const y=()=>new Promise(z=>setTimeout(z));
 for(let i=0;i<MATCH_VARIANTS.length;i++){cb&&cb(i/(MATCH_VARIANTS.length+2),"Trying reading "+(i+1)+" of "+MATCH_VARIANTS.length);await y();
  const t=tokensFromAnalysis(an,MATCH_VARIANTS[i]),r=await scoreTokens(t,buf,an.t0,len,t.mx,timing,16000);
  if(!best||r.sc.total>best.sc.total)best={t,sc:r.sc,i}}
 for(const mul of[.6,1.7,3,0]){cb&&cb(.8,"Matching how notes fade");await y();const base=best.t.mx,inst={...base.inst,tau:mul?Math.min(30,Math.max(.3,base.inst.tau*mul)):30},mx2={...base,inst},r=await scoreTokens(best.t,buf,an.t0,len,mx2,timing,16000);if(r.sc.total>best.sc.total+.003){best.t.mx=mx2;best.sc=r.sc}}
 let gap=best.sc.eqGap;gap.level=best.sc.level;const eq=new Array(10).fill(0);
 for(let pass=0;pass<2;pass++){cb&&cb((MATCH_VARIANTS.length+pass)/(MATCH_VARIANTS.length+2),"Matching the tone");await y();
  for(let i=0;i<9;i++)eq[i]=i<1||i>6?0:Math.max(-8,Math.min(8,Math.round(eq[i]+gap[i]*.7)));eq[9]=Math.max(-24,Math.min(24,Math.round((eq[9]||0)+(gap.level||0))));best.t.mx.eq=eq.slice();
  const r=await scoreTokens(best.t,buf,an.t0,len,best.t.mx,timing,16000);if(r.sc.total<best.sc.total-.004){eq.fill(0);best.t.mx.eq=eq.slice();break}best.sc=r.sc;gap=r.sc.eqGap;gap.level=r.sc.level}
 best.t.score=best.sc;best.t.pick=best.i;return best.t}
