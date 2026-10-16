"use strict";
/* ---------- random pages ----------
   Random is honest. It picks a length anywhere from 1 up to the most that still fits in a link
   (every length equally likely), then fills every symbol with a fresh, even, random pick.
   Nothing is shaped, nudged or chosen from a list. Pictures come out as noise, text as gibberish,
   music as a spray of notes. Any real page can still turn up, because every page is in here. */
const linkToks=m=>Math.max(1,Math.floor((LINK_MAX*5.1699-24)/Math.log2(ROOMS[m].K)));
const rf=()=>{if(window.crypto&&crypto.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}return Math.random()};
const ri=(a,b)=>a+Math.floor(rf()*(b-a+1)),pick=a=>a[Math.floor(rf()*a.length)];
const uni=(L,K)=>Array.from({length:L},()=>ri(0,K-1));
const maxLen=m=>Math.min(linkToks(m),ROOMS[m].max||1e9);
const randLen=m=>ri(1,maxLen(m));

function randPage(m){
 const L=randLen(m);
 if(m==="binary"){const w=ri(1,Math.min(L,200));return{seed:toSeed(uni(L,2),2,false),w}}
 return{seed:toSeed(uni(L,ROOMS[m].K),ROOMS[m].K,false)}}
function randSeed(m){return randPage(m).seed.toString()}
function goRandom(m,replace){const r=randPage(m);bmW=r.w||0;openSeed(m,r.seed,null,replace,r.w?"&w="+r.w:"")}

/* pictures: any size that fits in a link, every pixel a random color */
const PIC_MAX_AREA=1900;
function randPictureSize(){const area=ri(1,PIC_MAX_AREA),w=Math.min(area,Math.max(1,Math.round(Math.sqrt(area*Math.exp((rf()-.5)*2.8)))));return{w,h:Math.max(1,Math.floor(area/w))}}
function genPicture(w,h){const rgb=new Uint8Array(w*h*3);
 for(let i=0;i<rgb.length;i+=65536)crypto.getRandomValues(rgb.subarray(i,Math.min(i+65536,rgb.length)));
 return rgb}

/* sound: any length that fits in a link, every sample random, so it's real static */
function genSound(rate,n){
 if(!rate){rate=pick([1000,2000,4000,8000,11025,16000,22050,32000,44100]);n=ri(1,5900)}
 const u8=new Uint8Array(n);
 for(let i=0;i<n;i+=65536)crypto.getRandomValues(u8.subarray(i,Math.min(i+65536,n)));
 return{rate,u8}}
