"use strict";
/* ---------- listening: audio in, notes out ----------
   1. Find the beat. Onsets are tracked, the tempo is fitted, and every step is laid on the real beat
      (sixteenths, or eighths for fast songs), so the rhythm follows the song and not a fixed clock.
   2. Learn the instrument. A harmonic model (NMF) is fitted to the clip. It works out which notes are
      sounding and what the instrument's overtones and decay look like, all from the audio itself.
   3. Read the notes off that fit: pitch, loudness, true octave. Quantize them to the steps and spread
      them over up to five parts.
   4. Drum hits come from sudden jumps in low, mid and high frequencies, right on the steps. */
function fft(re,im){const n=re.length;
 for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){let t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t}}
 for(let len=2;len<=n;len<<=1){const a=-2*Math.PI/len,wr=Math.cos(a),wi=Math.sin(a),h=len>>1;
  for(let i=0;i<n;i+=len){let cr=1,ci=0;for(let k=0;k<h;k++){const u=i+k,w=u+h,tr=re[w]*cr-im[w]*ci,ti=re[w]*ci+im[w]*cr;re[w]=re[u]-tr;im[w]=im[u]-ti;re[u]+=tr;im[u]+=ti;const t=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=t}}}}
const HANN={};
/* square root of the magnitude spectrum of N samples centred on sample c */
function spec(x,c,N,out){const re=new Float32Array(N),im=new Float32Array(N),w=HANN[N]||(HANN[N]=Float32Array.from({length:N},(_,i)=>.5-.5*Math.cos(2*Math.PI*i/N)));
 for(let i=0;i<N;i++){const k=c-N/2+i;re[i]=k>=0&&k<x.length?x[k]*w[i]:0}
 fft(re,im);for(let i=0;i<N/2;i++)out[i]=Math.sqrt(Math.hypot(re[i],im[i]))}
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


/* ===== the note finder ===== */
const NMF_P0=33,NMF_P1=100,NMF_NP=NMF_P1-NMF_P0+1,NMF_H=14,NMF_COMP=.7;
const nmfReg=m=>m<=52?0:m<=72?1:2;
/* magnitude spectrogram: a frame every `hop` samples, window N, keeping only bins below fmax */
function nmfStft(x,sr,N,hop,t0s,t1s,fmax){
 const s0=Math.max(0,Math.floor(t0s*sr)),s1=Math.min(x.length,Math.floor(t1s*sr)),T=Math.max(1,Math.floor((s1-s0)/hop)),F=Math.min(N/2,Math.floor(fmax*N/sr));
 const mag=new Float32Array(T*F),re=new Float32Array(N),im=new Float32Array(N),w=HANN[N]||(HANN[N]=Float32Array.from({length:N},(_,i)=>.5-.5*Math.cos(2*Math.PI*i/N)));
 for(let t=0;t<T;t++){const c=s0+t*hop+(hop>>1);
  for(let i=0;i<N;i++){const k=c-N/2+i;re[i]=k>=0&&k<x.length?x[k]*w[i]:0;im[i]=0}
  fft(re,im);for(let b=0;b<F;b++)mag[t*F+b]=Math.hypot(re[b],im[b])}
 return{mag,T,F,hop,sr,N,t0:s0/sr}}
/* how far the recording sits from concert pitch, in cents: spectral peaks vote on their distance from the nearest semitone */
function nmfTuning(S){
 const{mag,T,F,N,sr}=S;let cs=0,sn=0;const lo=Math.max(2,Math.round(150*N/sr)),hi=Math.min(F-3,Math.round(1500*N/sr));
 for(let t=0;t<T;t+=2){const o=t*F;let mx=0;for(let b=lo;b<hi;b++)if(mag[o+b]>mx)mx=mag[o+b];if(mx<=0)continue;
  for(let b=lo;b<hi;b++){const m=mag[o+b];if(m<.15*mx||m<mag[o+b-1]||m<mag[o+b+1]||m<mag[o+b-2]||m<mag[o+b+2])continue;
   const a=mag[o+b-1],c=mag[o+b+1],d=a-2*m+c,off=d<0?.5*(a-c)/d:0,fr=(b+off)*sr/N,mm=69+12*Math.log2(fr/440),dv=mm-Math.round(mm);cs+=m*Math.cos(2*Math.PI*dv);sn+=m*Math.sin(2*Math.PI*dv)}}
 return cs*cs+sn*sn>0?Math.max(-45,Math.min(45,Math.atan2(sn,cs)/(2*Math.PI)*100)):0}
/* one atom is one overtone of one pitch, drawn as a small bump of bins (index 0 is a sub-octave, which some organs have) */
function nmfAtoms(F,N,sr,tune,inh){
 const atoms=[];
 for(let p=0;p<NMF_NP;p++){const m=NMF_P0+p,f0=440*Math.pow(2,(m-69)/12+tune/1200),list=[];
  for(let h=0;h<=NMF_H;h++){const hh=h===0?.5:h,fh=f0*hh*Math.sqrt(1+inh*hh*hh),kc=fh*N/sr;if(kc>=F-3)break;if(kc<2)continue;
   const hw=2.1+.05*hh,k0=Math.max(0,Math.ceil(kc-hw)),k1=Math.min(F-1,Math.floor(kc+hw)),g=[];
   for(let k=k0;k<=k1;k++){const d=(k-kc)/hw,c=Math.cos(Math.PI*d/2);g.push(c*c)}
   list.push({h,k0,g})}
  atoms.push(list)}
 return atoms}
const nmfYield=()=>new Promise(z=>setTimeout(z));
async function nmfRun(S,opt,prog){
 const{mag,T,F,N,sr}=S,P=NMF_NP,NN=3,atoms=nmfAtoms(F,N,sr,opt.tune||0,3e-4);
 const a=[0,1,2].map(()=>Float64Array.from({length:NMF_H+1},(_,i)=>i===0?.02:Math.pow(i,-.9)));
 const V=new Float32Array(T*F);for(let i=0;i<V.length;i++)V[i]=Math.pow(mag[i],NMF_COMP)+1e-9;
 let Wi=[],Wv=[];const colsum=new Float32Array(P);
 const build=()=>{Wi=[];Wv=[];for(let p=0;p<P;p++){const r=nmfReg(NMF_P0+p),idx=[],val=[];
   for(const at of atoms[p]){const ah=a[r][at.h];for(let j=0;j<at.g.length;j++){idx.push(at.k0+j);val.push(ah*at.g[j])}}
   Wi.push(Int32Array.from(idx));Wv.push(Float32Array.from(val));let s=0;for(let j=0;j<val.length;j++)s+=val[j];colsum[p]=s}};
 build();
 const H=new Float32Array(P*T).fill(.05),Hn=new Float32Array(NN*T).fill(.05),Wn=new Float32Array(NN*F);
 for(let q=0;q<NN;q++)for(let k=0;k<F;k++)Wn[q*F+k]=(q===0?1:q===1?Math.exp(-k/(F*.15)):Math.exp(-(F-k)/(F*.3)))*(.5+.5*((k*2654435761>>>0)%1000)/1000);
 const WH=new Float32Array(T*F),R=new Float32Array(T*F),lam=opt.sparse==null?.4:opt.sparse,iters=opt.iters||60;
 for(let it=0;it<iters;it++){
  WH.fill(1e-9);
  for(let p=0;p<P;p++){const idx=Wi[p],val=Wv[p],n=idx.length;for(let t=0;t<T;t++){const h=H[p*T+t];if(h<1e-7)continue;const o=t*F;for(let j=0;j<n;j++)WH[o+idx[j]]+=val[j]*h}}
  for(let q=0;q<NN;q++)for(let t=0;t<T;t++){const h=Hn[q*T+t],o=t*F,wo=q*F;for(let k=0;k<F;k++)WH[o+k]+=Wn[wo+k]*h}
  for(let i=0;i<R.length;i++)R[i]=V[i]/WH[i];
  for(let p=0;p<P;p++){const idx=Wi[p],val=Wv[p],n=idx.length,den=colsum[p]+lam;for(let t=0;t<T;t++){let s=0;const o=t*F;for(let j=0;j<n;j++)s+=val[j]*R[o+idx[j]];H[p*T+t]*=s/den}}
  for(let q=0;q<NN;q++){let den=0;const wo=q*F;for(let k=0;k<F;k++)den+=Wn[wo+k];den+=lam;for(let t=0;t<T;t++){let s=0;const o=t*F;for(let k=0;k<F;k++)s+=Wn[wo+k]*R[o+k];Hn[q*T+t]*=s/den}}
  if(it%3===2)for(let q=0;q<NN;q++){const wo=q*F;let hs=1e-9;for(let t=0;t<T;t++)hs+=Hn[q*T+t];for(let k=0;k<F;k++){let s=0;for(let t=0;t<T;t++)s+=Hn[q*T+t]*R[t*F+k];Wn[wo+k]*=s/hs}}
  /* learn the instrument: how loud each overtone is, for low, middle and high notes */
  if(it>=15&&it%15===14){
   const num=[0,1,2].map(()=>new Float64Array(NMF_H+1)),dd=[0,1,2].map(()=>new Float64Array(NMF_H+1));
   for(let p=0;p<P;p++){const r=nmfReg(NMF_P0+p);let hsum=0;for(let t=0;t<T;t++)hsum+=H[p*T+t];if(hsum<1e-6)continue;
    for(const at of atoms[p]){let nu=0,de=0;for(let t=0;t<T;t++){const h=H[p*T+t];if(h<1e-6)continue;const o=t*F;for(let j=0;j<at.g.length;j++){nu+=h*at.g[j]*R[o+at.k0+j];de+=h*at.g[j]}}num[r][at.h]+=nu;dd[r][at.h]+=de}}
   for(let r=0;r<3;r++){for(let h=0;h<=NMF_H;h++)if(dd[r][h]>1e-6)a[r][h]*=Math.min(2,Math.max(.5,num[r][h]/dd[r][h]));const s=a[r][1]||1;for(let h=0;h<=NMF_H;h++)a[r][h]/=s}
   build()}
  if(it%4===3){prog&&prog((it+1)/iters);await nmfYield()}}
 return{H,T,P,a}}
/* the activations become notes: where a pitch is clearly on, split where it dips and comes back, time the start where it rises */
function nmfNotes(res,S,o){
 const{H,T,P}=res,fr=S.hop/S.sr,h=new Float32Array(P*T);
 for(let p=0;p<P;p++)for(let t=0;t<T;t++){const a=H[p*T+Math.max(0,t-1)],b=H[p*T+t],c=H[p*T+Math.min(T-1,t+1)];h[p*T+t]=(a+2*b+c)/4}
 const col=new Float32Array(T);for(let t=0;t<T;t++){let m=0;for(let p=0;p<P;p++)if(h[p*T+t]>m)m=h[p*T+t];col[t]=m}
 const sorted=Array.from(col).sort((x,y)=>x-y),ref=Math.max(1e-6,sorted[Math.floor(sorted.length*.95)]||1);
 const abs=(o.abs==null?.2:o.abs)*ref,rel=o.rel==null?.3:o.rel,dip=o.dip||.45,rise=o.rise||2,minF=o.minFrames||5,pMin=o.pMin||36;
 const notes=[];
 for(let p=0;p<P;p++){if(NMF_P0+p<pMin)continue;
  const act=new Uint8Array(T);for(let t=0;t<T;t++){const v=h[p*T+t];act[t]=v>=abs&&v>=rel*col[t]?1:0}
  for(let t=1;t<T-1;t++)if(!act[t]&&act[t-1]&&act[t+1])act[t]=1;
  let t=0;while(t<T){if(!act[t]){t++;continue}let e=t;while(e<T&&act[e])e++;
   const cuts=[t];let peak=h[p*T+t],valley=peak,valleyAt=t;
   for(let q=t+1;q<e;q++){const v=h[p*T+q];if(v>peak){peak=v;valley=v;valleyAt=q;continue}
    if(v<valley){valley=v;valleyAt=q}else if(valley<dip*peak&&v>valley*rise){cuts.push(valleyAt);peak=v;valley=v;valleyAt=q}}
   cuts.push(e);
   for(let c=0;c<cuts.length-1;c++){const sa=cuts[c],sb=cuts[c+1];let pk=0;for(let q=sa;q<sb;q++)if(h[p*T+q]>pk)pk=h[p*T+q];
    if(sb-sa<(pk>=.5*ref?3:minF))continue;
    const early=(()=>{let m=0;for(let q=sa;q<Math.min(sb,sa+8);q++)m=Math.max(m,h[p*T+q]);return m})();let on=sa;
    for(let q=Math.max(0,sa-4);q<Math.min(sb,sa+10);q++)if(h[p*T+q]>=.5*early){on=q;break}
    /* how fast it dies away: slope of the log curve after the peak */
    let pa=sa;for(let q=sa;q<sb;q++)if(h[p*T+q]>=early*.98){pa=q;break}
    let rate=null;if(sb-pa>=14){let sx=0,sy=0,sxx=0,sxy=0,m=0;for(let q=pa;q<Math.min(sb-4,pa+60);q++){const x=(q-pa)*fr,y=Math.log(h[p*T+q]+1e-6);sx+=x;sy+=y;sxx+=x*x;sxy+=x*y;m++}const den=m*sxx-sx*sx;if(den>0)rate=(m*sxy-sx*sy)/den}
    notes.push({p:p+NMF_P0,s:S.t0+(on+.5)*fr,e:S.t0+(sb+.5)*fr,v:early/ref,rate})}
   t=e}}
 return{notes,ref}}

/* ===== drums: sudden jumps in the low, middle and high end, measured around each step ===== */
function drumFeatures(xr,sr,tS,stepDur,n){
 const ND=2048,hd=ND/2,fb=(a,b)=>[Math.round(a*ND/sr),Math.min(hd,Math.round(b*ND/sr))];
 const B0=fb(40,200),B1=fb(1500,5000),B2=fb(6000,Math.min(16000,sr/2-100)),bd=[B0,B1,B2],F=[];
 const frame=q=>{const i=Math.floor(q/4),A=new Float32Array(hd);spec(xr,Math.round((tS(i)+((q%4+4)%4-1.5)*.25*stepDur(i))*sr),ND,A);return A};
 const Fq=new Map(),get=q=>{if(!Fq.has(q))Fq.set(q,frame(q));return Fq.get(q)};
 for(let i=0;i<n;i++){const f=[0,0,0,0];let bestHi=-1;
  for(let j=0;j<4;j++){const q=4*i+j,c=get(q),p=get(q-1);let hi=0;
   for(let k=0;k<3;k++){let t=0;for(let b=bd[k][0];b<bd[k][1];b++)t+=Math.max(0,c[b]*c[b]-p[b]*p[b]);f[k]=Math.max(f[k],t);if(k>0)hi+=t}
   if(hi>bestHi){bestHi=hi;/* how noise-like the top end is at the hardest hit: tones are peaky, drums are flat */
    let ls=0,as=0,m=0;for(let b=B1[0];b<B2[1];b++){const v=c[b]*c[b]+1e-9;ls+=Math.log(v);as+=v;m++}f[3]=Math.exp(ls/m)/(as/m)}}
  F.push(f);Fq.delete(4*i-5);Fq.delete(4*i-4);Fq.delete(4*i-3);Fq.delete(4*i-2)}
 return F}
/* 0 none, 1 kick, 2 snare, 3 hat.
   No fixed gates on how noisy the top end looks: real mp3s are low-passed and tilted, which made the old gates reject every hit.
   Each band is scored against the clip's own typical level (robust z-score) plus a floor relative to its strongest hits.
   If almost nothing is found the bar is lowered a step at a time, and if nearly every step fires it is raised, so a song with drums always gets some. */
function findDrums(xr,sr,tS,stepDur,n){
 const F=drumFeatures(xr,sr,tS,stepDur,n),zero=()=>new Array(n).fill(0);if(!n)return zero();
 const med=a=>{const s=Array.from(a).sort((x,y)=>x-y);return s[s.length>>1]||0},mad=(a,m)=>med(a.map(v=>Math.abs(v-m)));
 const band=k=>{const c=F.map(f=>f[k]),m=med(c),sd=mad(c,m)*1.4826+1e-12,top=pctl(c,.95)+1e-12;return{z:c.map(v=>(v-m)/sd),r:c.map(v=>v/top)}};
 const lo=band(0),mid=band(1),hi=band(2);
 const pass=T=>F.map((f,i)=>{
  const k=lo.z[i]>T*1.15&&lo.r[i]>.3,sn=mid.z[i]>T*.6&&hi.z[i]>T*.55&&mid.r[i]>.2,h=hi.z[i]>T&&hi.r[i]>.25;
  if(k&&!(sn&&mid.z[i]>lo.z[i]*1.4))return 1;if(sn)return 2;return h?3:0});
 const count=a=>a.reduce((c,v)=>c+(v?1:0),0),want=Math.max(2,Math.round(n*.06));
 let out=pass(2.6);
 for(const T of[2.1,1.8]){if(count(out)>=want)break;out=pass(T)}
 for(let T=3.2;count(out)>n*.7&&T<7;T+=.8)out=pass(T);
 return out}

/* ===== the first half of listening: beat, spectrum, instrument. Takes a while, so it is done once per clip. ===== */
async function analyzeClip(buf,start,secs,cb,hop,win,sparse,iters){
 const sr=buf.sampleRate,chs=Math.max(1,buf.numberOfChannels||1),total=buf.length||buf.getChannelData(0).length,dur=total/sr,yld=()=>new Promise(z=>setTimeout(z));
 secs=Math.max(1,Math.min(secs,dur-start));/* near the end of the song, listen further back so the tempo is still sure */
 const PADT=12+Math.max(0,12-(dur-(start+secs)));
 const r0=Math.max(0,start-PADT),r1=Math.min(total/sr,start+secs+PADT+2),a0=Math.floor(r0*sr),a1=Math.min(total,Math.ceil(r1*sr)),L=a1-a0;
 const D=Math.max(1,Math.round(sr/22050)),srd=sr/D,M=Math.floor(L/D),xd=new Float32Array(M);let xf;
 {const dsum=new Float32Array(L);for(let c=0;c<chs;c++){const d=buf.getChannelData(c);for(let i=0;i<L;i++)dsum[i]+=d[a0+i]/chs}
  for(let i=0;i<M;i++){let s=0;for(let k=0;k<D;k++)s+=dsum[i*D+k];xd[i]=s/D}xf=dsum}
 cb&&cb(.02);await yld();
 /* the beat */
 const oe=onsetEnv(xd,srd),fps=oe.fps;cb&&cb(.1);await yld();
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
 const sub=Math.round(secs/(T/4))<=960?4:2,n=Math.max(8,Math.min(960,Math.round(secs/(T/sub))));
 const g0=beatAt(k0),tS=i=>beatAt(k0+i/sub),stepDur=i=>tS(i+1)-tS(i),stepSec=(tS(n)-g0)/n;
 const G=Float64Array.from({length:n+1},(_,i)=>tS(i));
 cb&&cb(.15);await yld();
 /* the notes: spectrum, tuning, then the harmonic fit */
 const S=nmfStft(xd,srd,win||4096,hop||512,Math.max(0,g0-.35),Math.min(M/srd,tS(n)+.35),5000);
 const tune=nmfTuning(S);cb&&cb(.2);await yld();
 const res=await nmfRun(S,{tune,sparse:sparse,iters:iters},p=>cb&&cb(.2+.5*p));
 cb&&cb(.72);await yld();
 const drm=findDrums(xf,sr,tS,stepDur,n);
 cb&&cb(.85);await yld();
 /* what the instrument sounds like: overtone levels by register and how fast its notes fade */
 const base=nmfNotes(res,S,{abs:.2,rel:.3}),rates=base.notes.filter(x=>x.rate!=null).map(x=>x.rate).sort((p,q)=>p-q);
 const rate=rates.length>=3?rates[rates.length>>1]:-.3,tau=rate>-.08?30:Math.max(.5,Math.min(30,.7/-rate));
 const harm=res.a.map(r=>Array.from(r.slice(1,13)).map(v=>Math.max(.004,Math.pow(Math.max(1e-4,v),1/NMF_COMP)))),sub05=res.a.map(r=>Math.pow(Math.max(1e-4,r[0]),1/NMF_COMP));
 return{sr,srd,S,res,tune,n,sub,stepSec,bpm:60/(stepSec*sub),g0,r0,t0:r0+g0,secs:tS(n)-g0,G,drm,inst:{harm,sub:sub05,tau},refNotes:base.notes.length,
  stepTimes:Float64Array.from({length:n+1},(_,i)=>(G[i]-g0)/stepSec)}}

/* ===== the second half: pick notes, put them on the steps, share them out over the parts ===== */
const TCFG={
 low:{lanes:1,abs:.3,rel:.5,bassField:true,drums:true},
 normal:{lanes:3,abs:.25,rel:.38,bassField:true,drums:true},
 high:{lanes:5,abs:.2,rel:.3,bassField:false,drums:false}};
const velOf=v=>Math.max(0,Math.min(63,Math.round(56+20*Math.log10(Math.pow(Math.max(1e-3,v),1/NMF_COMP))/.8)));
function tokensFromAnalysis(an,cfg){
 const{n,G,res,S}=an,K=cfg.lanes||5,bias=cfg.bias==null?-.012:cfg.bias;
 const cand=nmfNotes(res,S,{abs:cfg.abs,rel:cfg.rel,minFrames:cfg.minFrames});
 const pos=t=>{if(t<=G[0])return(t-G[0])/Math.max(1e-6,G[1]-G[0]);if(t>=G[n])return n+(t-G[n])/Math.max(1e-6,G[n]-G[n-1]);let lo=0,hi=n;while(hi-lo>1){const m=(lo+hi)>>1;if(G[m]<=t)lo=m;else hi=m}return lo+(t-G[lo])/(G[lo+1]-G[lo])};
 let notes=[];
 for(const o of cand.notes){let a=Math.round(pos(o.s+bias)),b=Math.max(a+1,Math.round(pos(o.e+(cfg.endBias==null?-.04:cfg.endBias))));if(b<=0||a>=n)continue;if(a<0)a=0;if(b>n)b=n;if(b-a<1)continue;notes.push({p:o.p,a,b,v:o.v})}
 /* optionally pull stray notes into the song's key */
 let snapScale=null;
 if(cfg.snap&&notes.length){const hist=new Array(12).fill(0);notes.forEach(x=>hist[x.p%12]+=(x.b-x.a)*x.v);
  let bk=0,bs=-1e9,bmin=false;for(let t=0;t<12;t++)for(const mn of[false,true]){const pr=mn?KEYMIN:KEYMAJ;let s=0;for(let i=0;i<12;i++)s+=hist[(i+t)%12]*pr[i];if(s>bs){bs=s;bk=t;bmin=mn}}
  snapScale=(bmin?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11]).map(i=>(i+bk)%12);
  notes.forEach(x=>{if(snapScale.includes(x.p%12))return;for(const d of[1,-1,2,-2])if(snapScale.includes((x.p+d+120)%12)){x.p+=d;return}})}
 /* the lowest notes can go to the bass part instead */
 const bass=new Array(n).fill(0);
 if(cfg.bassField){const lo=notes.filter(x=>x.p<48),bv=new Float32Array(n);notes=notes.filter(x=>x.p>=48);
  lo.sort((x,y)=>x.v-y.v);for(const x of lo)for(let i=x.a;i<x.b;i++){bass[i]=1+x.p%12;bv[i]=x.v}}
 /* share the notes out over the parts: a note starts in a free part, or takes over from a weaker one */
 const score=x=>x.v*(K===1?1+.03*(x.p-60):1);
 notes.sort((x,y)=>x.a-y.a||score(y)-score(x));
 const laneNotes=Array.from({length:K},()=>[]);let active=[];
 for(const x of notes){active=active.filter(q=>q.b>x.a&&!q.dead);
  if(active.length<K){const used=new Set(active.map(q=>q.lane));let L=0;while(used.has(L))L++;x.lane=L;active.push(x);laneNotes[L].push(x);continue}
  /* a note that has been ringing a while counts for less than a fresh attack, so held notes do not block new ones */
  const eff=q=>score(q)*Math.pow(.94,Math.max(0,x.a-q.a));let w=0;for(let q=1;q<active.length;q++)if(eff(active[q])<eff(active[w]))w=q;
  if(score(x)>eff(active[w])*.95){const wk=active[w];wk.b=x.a;if(wk.b-wk.a<1)wk.dead=true;x.lane=wk.lane;active[w]=x;laneNotes[x.lane].push(x)}}
 /* tokens, with the loudness and true octave of each note kept on the side */
 const lane=Array.from({length:K},()=>new Int32Array(n)),meta=new Map();
 for(let L=0;L<K;L++)for(const x of laneNotes[L]){if(x.dead||x.b<=x.a)continue;let fp=x.p;while(fp<48)fp+=12;while(fp>83)fp-=12;
  lane[L][x.a]=2+fp-48;for(let i=x.a+1;i<x.b;i++)lane[L][i]=1;meta.set(x.a*8+L,{vel:velOf(x.v),oct:(x.p-fp)/12})}
 const drums=cfg.drums?an.drm:new Array(n).fill(0),vel=[],oct=[],toks=[];
 for(let i=0;i<n;i++){const v=[0,0,0,0,0];for(let L=0;L<K;L++){v[L]=lane[L][i];if(v[L]>=2){const m=meta.get(i*8+L)||{vel:40,oct:0};vel.push(m.vel);oct.push(m.oct)}}
  toks.push(packMusic(v,bass[i],drums[i],true))}
 toks.stepTimes=an.stepTimes;toks.stepSec=an.stepSec;toks.sub=an.sub;toks.bpm=an.bpm;toks.t0=an.t0;toks.secs=an.secs;
 toks.mx={tune:an.tune,vel,oct,inst:an.inst,band:!!(cfg.bassField||cfg.drums)};toks.cfg=cfg;
 return toks}

/* every note that can be found, at its real time: no grid, no limit on how many sound at once */
function exactNotes(an,o){
 o=o||{};const c=nmfNotes(an.res,an.S,{abs:o.abs==null?.12:o.abs,rel:o.rel==null?.18:o.rel,minFrames:o.minFrames||3,pMin:o.pMin||33,dip:o.dip||.5,rise:o.rise||1.8}),bias=o.bias==null?-.012:o.bias;
 return c.notes.map(x=>({t:Math.max(0,x.s+bias-an.g0),e:Math.max(0,x.e-.03-an.g0),m:x.p,v:velOf(x.v)})).filter(x=>x.e>x.t+.03).sort((a,b)=>a.t-b.t||a.m-b.m)}

/* every sound becomes notes: each semitone's strength is read straight off the spectrum, frame by frame, with no model of an instrument.
   Voices, drums and noise all turn into notes, which is why a song you know can still be heard in it. */
function everyNotes(an,o){
 o=o||{};const S=an.S,{mag,T,F,N,sr}=S,fr=S.hop/sr,floorDb=o.floorDb==null?42:o.floorDb,minF=o.minFrames||3,m0=o.m0||28,m1=o.m1||104,NP=m1-m0+1;
 const kc=new Float64Array(NP),wd=new Int16Array(NP),use=[];
 for(let i=0;i<NP;i++){const f=440*Math.pow(2,(m0+i-69+an.tune/100)/12),k=f*N/sr;kc[i]=k;wd[i]=Math.max(1,Math.floor(k*(Math.pow(2,1/24)-1)));if(k<F-3&&k>=2)use.push(i)}
 const e=new Float32Array(NP*T);let all=[];
 for(let t=0;t<T;t++){const o2=t*F;for(const i of use){const c=Math.round(kc[i]);let m=0;for(let k=c-wd[i];k<=c+wd[i];k++)if(mag[o2+k]>m)m=mag[o2+k];e[i*T+t]=m;all.push(m)}}
 all=Float32Array.from(all).sort();const ref=all[Math.floor(all.length*.995)]||1,thr=ref*Math.pow(10,-floorDb/20);
 const on=new Uint8Array(NP*T);
 for(const i of use)for(let t=0;t<T;t++){const v=e[i*T+t];if(v<thr)continue;const lo=i>0?e[(i-1)*T+t]:0,hi=i<NP-1?e[(i+1)*T+t]:0;if(o.noPeak||(v>=lo&&v>=hi))on[i*T+t]=1}
 const out=[];
 for(const i of use){let t=0;while(t<T){if(!on[i*T+t]){t++;continue}let end=t;while(end<T){if(on[i*T+end]){end++;continue}if(end+1<T&&on[i*T+end+1]){end+=2;continue}break}
  const cuts=[t];let peak=e[i*T+t],val=peak,vat=t;
  for(let q=t+1;q<end;q++){const v=e[i*T+q];if(v>peak){peak=v;val=v;vat=q;continue}if(v<val){val=v;vat=q}else if(val<.5*peak&&v>val*1.8){cuts.push(vat);peak=v;val=v;vat=q}}
  cuts.push(end);
  for(let c=0;c<cuts.length-1;c++){const a=cuts[c],b=cuts[c+1];if(b-a<minF)continue;let pk=0;for(let q=a;q<b;q++)pk=Math.max(pk,e[i*T+q]);
   const db=20*Math.log10(pk/ref);out.push({a:pk,t:Math.max(0,S.t0+(a+.5)*fr-an.g0-.012),e:Math.max(0,S.t0+(b+.5)*fr-an.g0-.02),m:m0+i,v:Math.max(2,Math.min(63,Math.round(63+db*63/ (floorDb+10))))})}
  t=end}}
 let res=out.filter(x=>x.e>x.t+.02).sort((a,b)=>a.t-b.t||a.m-b.m);
 if(o.raw)return res;
 /* A note is dropped when it is an overtone of a louder note below it that sounds over most of the same time (2nd, 3rd, 4th... partials),
    and very low notes must be clearly loud: otherwise rumble and room tone become a mud of low notes. A real octave is allowed to be fairly close in loudness. */
 const OV=[[12,1.8],[19,1.3],[24,1.3],[28,1.3],[31,1.3],[34,1.3],[36,1.3]],by=new Map();
 /* 1) attack clicks: a burst of very short notes starting together across many pitches is the thump of one attack, not music */
 {const sh=res.filter(x=>x.e-x.t<.16).sort((p,q)=>p.t-q.t),bad=new Set();
  for(let i=0,lo=0;i<sh.length;i++){while(sh[i].t-sh[lo].t>.05)lo++;let hi=i;while(hi+1<sh.length&&sh[hi+1].t-sh[i].t<=.05)hi++;if(hi-lo+1>=3)for(let k=lo;k<=hi;k++)bad.add(sh[k])}
  res=res.filter(x=>!bad.has(x))}
 /* 1b) low thump: several neighbouring low semitones sounding together is broadband rumble (a kick, a sub swell), not a bass line. Keep only the strongest. */
 {const lowN=res.filter(x=>x.m<48),bad=new Set();
  for(const x of lowN){let nb=0,stronger=false;for(const y of lowN){if(y===x||Math.abs(y.m-x.m)>3)continue;if(Math.min(x.e,y.e)-Math.max(x.t,y.t)<.5*Math.min(x.e-x.t,y.e-y.t))continue;nb++;if(y.a>x.a)stronger=true}
   if(nb>=2&&stronger)bad.add(x)}
  res=res.filter(x=>!bad.has(x))}
 res.forEach(x=>{let l=by.get(x.m);if(!l)by.set(x.m,l=[]);l.push(x)});
 /* 2) overtones: a partial starts with its fundamental, lasts about as long, and is clearly weaker (real peak amplitude, not the clipped 0-63 loudness) */
 res=res.filter(x=>{
  const dur=x.e-x.t;
  if(x.m<40&&(x.v<28||dur<.45))return false;if(x.m<48&&dur<.28)return false;
  for(const[iv,ra]of OV){const L=by.get(x.m-iv);if(!L)continue;for(const y of L){if(Math.min(x.e,y.e)-Math.max(x.t,y.t)>=.6*dur&&Math.abs(y.t-x.t)<.12&&y.a>=x.a*ra)return false}}
  return true});
 return res}

/* one call for the usual case */
async function transcribe(buf,start,secs,cb,mode){
 const an=await analyzeClip(buf,start,secs,cb),m=mode||SG("transSens")||"normal";
 const t=tokensFromAnalysis(an,TCFG[m]||TCFG.normal);t.an=an;cb&&cb(.97);return t}
