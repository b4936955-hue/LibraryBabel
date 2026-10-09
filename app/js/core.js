"use strict";
/* ---------- engine: every page is an address in base K ---------- */
const STEP=.125, BIGMAX=1000000, LINK_MAX=8000, A96=["\n"];
for(let c=32;c<127;c++)A96.push(String.fromCharCode(c));
const I96=Object.fromEntries(A96.map((c,i)=>[c,i]));
const ROOMS={
 letters:{name:"Letters",K:96,len:0,max:1000000,tag:"Anything you can type is a page in here, up to a million characters.",hue:"#b8893a"},
 numbers:{name:"Numbers",K:10,len:0,max:1000000,tag:"Any string of digits. A phone number, a birthday, or a million random ones.",hue:"#5f7f9a"},
 colors:{name:"Colors",K:16777216,len:0,max:50000,tag:"Color swatches, anywhere from one to fifty thousand of them.",hue:"#9a5f5f"},
 dna:{name:"DNA",K:4,len:0,max:1000000,tag:"Strings of A, C, G and T, as short or as long as you want.",hue:"#5f8f6a"},
 binary:{name:"Bitmaps",K:2,len:0,max:262144,tag:"Black and white pictures of any size. You choose how wide the rows are.",hue:"#8a8478"},
 dice:{name:"Dice",K:6,len:0,max:1000000,tag:"Dice rolls. One die or a million of them.",hue:"#9a6a5f"},
 emoji:{name:"Emoji",K:64,len:0,max:1000000,tag:"Rows of little smiley faces.",hue:"#a39255"},
 pictures:{name:"Pictures",K:16777216,len:0,tag:"Real pictures, up to 2048 by 2048. Upload one and I'll give you its address.",hue:"#7a6a96"},
 sound:{name:"Sound",K:256,len:0,tag:"Real audio, up to a whole song. Upload an mp3 and I'll give you its address.",hue:"#a0704a"},
 music:{name:"Music",K:1976,len:0,max:20000,tag:"Records with a melody, a bass line and drums, from a single note up to about forty minutes.",hue:"#6a8f86"}
};
/* Pages up to LINK_MAX base-36 digits live in the link. Bigger ones become an address you copy and paste. */
const PKC=new Map();
function PK(k,e){const key=k+":"+e;let x=PKC.get(key);if(x===undefined){x=k**BigInt(e);PKC.set(key,x)}return x}
function pv(t,lo,hi,k){const n=hi-lo;if(n<=48){let x=0n;for(let i=lo;i<hi;i++)x=x*k+BigInt(t[i]);return x}
 const mid=lo+(n>>1);return pv(t,lo,mid,k)*PK(k,hi-mid)+pv(t,mid,hi,k)}
function dig(n,k,len,out,off){if(len<=48){for(let i=len-1;i>=0;i--){out[off+i]=Number(n%k);n/=k}return}
 const h=len>>1,r=len-h,pw=PK(k,r),q=n/pw,m=n-q*pw;dig(q,k,h,out,off);dig(m,k,r,out,off+h)}
const maxOf=m=>ROOMS[m]&&ROOMS[m].max||BIGMAX;
function toToks(seed,K,len,max){
 const n0=seed-1n,k=BigInt(K);if(n0<0n)throw Error("Addresses start at 1.");
 if(len){if(n0>=PK(k,len))throw Error("That address is past the last page.");const o=new Array(len);dig(n0,k,len,o,0);return o}
 const cap=max||BIGMAX,bits=n0.toString(16).length*4;
 if(bits>(cap+2)*Math.log2(K)+8)throw Error("That address is too big for a page.");
 let L=Math.max(1,Math.floor(bits/Math.log2(K)));const off=l=>(PK(k,l)-k)/(k-1n);
 while(L>1&&off(L)>n0)L--;while(off(L+1)<=n0)L++;
 if(L>cap)throw Error("That address is too big for a page.");
 const o=new Array(L);dig(n0-off(L),k,L,o,0);return o}
function toSeed(t,K,fixed){const k=BigInt(K),v=pv(t,0,t.length,k);return fixed?v+1n:(PK(k,t.length)-k)/(k-1n)+v+1n}
/* rough size of an address in base 36, without building the string */
const b36len=seed=>Math.ceil((seed.toString(16).length*4)/5.1699);
function rng(str){let a=0;for(let i=0;i<str.length;i++)a=Math.imul(a^str.charCodeAt(i),2654435761)>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function pad(t,K,len){const r=rng(t.join(",")),o=t.slice(0,len);while(o.length<len)o.push(Math.floor(r()*K));return o}
function fastText(s){let r=s-1,L=1,a=96;while(r>=a){r-=a;L++;a*=96}const o=new Array(L);for(let i=L-1;i>=0;i--){o[i]=A96[r%96];r=Math.floor(r/96)}return o.join("")}
function loc(seed){const s=seed-1n,h=(s/640n).toString(b36len(seed)>LINK_MAX?16:36);return{vol:Number(s%32n)+1,shelf:Number(s/32n%5n)+1,wall:Number(s/160n%4n)+1,hex:h.length>14?h.slice(0,6)+"..."+h.slice(-6):h}}
const SYM={dna:c=>"ACGT".indexOf(c.toUpperCase()),binary:c=>"01".indexOf(c),dice:c=>"123456".indexOf(c),emoji:c=>c.codePointAt(0)-0x1F600},SHOW={dna:i=>"ACGT"[i],dice:i=>String.fromCodePoint(0x2680+i),emoji:i=>String.fromCodePoint(0x1F600+i)},PER={numbers:50,dna:60,dice:40,emoji:16};
const NOTE=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const nm=t=>t===0?".":t===1?"-":NOTE[(t-2)%12]+(3+Math.floor((t-2)/12));
const short=s=>s.length>50?s.slice(0,22)+"..."+s.slice(-22)+" ("+s.length+" digits)":s;

/* ---------- what you type becomes tokens ---------- */
/* an address looks like @123 or @numbers:123 (the room name says which room it belongs to) */
function parseAddr(val){const m=/^@(?:([a-z]+):)?(\d+)$/.exec(val.replace(/\s+/g,""));if(!m)return null;if(m[1]&&!ROOMS[m[1]])return null;return{m:m[1]||null,seed:BigInt(m[2])}}
function parseNotes(s){const o=[],re=/([A-Ga-g])([#b]?)(-?\d)|([-.r])/g,B={c:0,d:2,e:4,f:5,g:7,a:9,b:11};let m;
 while((m=re.exec(s))){if(m[4])o.push(m[4]==="-"?1:0);else{const x=12*(+m[3]+1)+B[m[1].toLowerCase()]+(m[2]==="#"?1:m[2]==="b"?-1:0);if(x<48||x>83)throw Error("Notes only go from C3 to B5.");o.push(2+x-48)}}
 if(!o.length)throw Error("Try notes like C4 E4 G4 - - C5. A dash holds the note, a dot is a rest.");return o}
function resolve(m,raw){
 const R=ROOMS[m],val=raw.trim();
 {const a=parseAddr(val);if(a)return{seed:a.seed,room:a.m}}
 if(m==="letters"){
  if(/^\d+$/.test(val))return{seed:BigInt(val)};
  if(!raw.length||raw.length>R.max)throw Error("Pages hold 1 to "+R.max.toLocaleString()+" characters.");
  return{seed:toSeed([...raw].map(c=>{const i=I96[c];if(i===undefined)throw Error("Only keyboard characters and line breaks fit on a page.");return i}),96,false)}}
 let t;
 if(SYM[m]){t=[...val.replace(/\s/g,"")].map(SYM[m]);if(!t.length||t.some(x=>!(x>=0&&x<R.K)))throw Error("Some of that doesn't fit in this room.")}
 if(m==="numbers"){t=[...val.replace(/\D/g,"")].map(Number);if(!t.length)throw Error("Type some digits, or paste an address like @123.")}
 if(m==="colors"){const f=val.match(/#?\b[0-9a-f]{6}\b|#?\b[0-9a-f]{3}\b/gi);if(!f)throw Error("Type colors like #c79a4a #fff, or paste an address like @123.");t=f.map(x=>{x=x.replace("#","");if(x.length===3)x=[...x].map(c=>c+c).join("");return parseInt(x,16)})}
 if(m==="music")t=parseNotes(val);
 if(!R.len){if(t.length>R.max)throw Error("Pages hold up to "+R.max.toLocaleString()+" here.");return{seed:toSeed(t,R.K,false)}}
 if(t.length>R.len)throw Error("That's more than one page holds ("+R.len+").");
 return{seed:toSeed(pad(t,R.K,R.len),R.K,true),hl:{a:0,b:t.length}}}

/* ---------- little helpers ---------- */
const $=(s,e=document)=>e.querySelector(s), v=$("#v");
function mk(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
let hl=null,orig=null,keep=false,tuneSel=null,bmW=0;
let BIG=null,viewTok=0;
function nav(q,replace){BIG=null;try{history[replace?"replaceState":"pushState"]({},"",q)}catch(e){}route()}
/* the one way to open a page by its seed */
function openSeed(m,seed,h,replace,extra){
 if(b36len(seed)<=LINK_MAX){BIG=null;return nav(link(m,seed,h)+(extra||""),replace)}
 BIG={m,seed};try{history[replace?"replaceState":"pushState"]({},"","?m="+m)}catch(e){}route()}
const link=(m,s,h)=>"?m="+m+"&a="+BigInt(s).toString(36)+(h?"&h="+h.a+"-"+h.b:"");
/* the page's real web address, not whatever the iframe or loader thinks it is */
function shareLink(m,seed,h){const base=/^(https?|file):/.test(location.href)?location.href.split(/[?#]/)[0]:"";return base+link(m,seed,h)}
const saveBlob=(blob,name)=>{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)};
const getCat=()=>{try{return JSON.parse(localStorage.getItem("babelCatalog"))||[]}catch(e){return[]}};
const setCat=a=>{try{localStorage.setItem("babelCatalog",JSON.stringify(a))}catch(e){}};
function copy(t,n){try{navigator.clipboard.writeText(t).then(()=>n.textContent="Copied.",()=>n.textContent="That didn't copy. Try Save address as text instead.")}catch(e){n.textContent="That didn't copy. Try Save address as text instead."}}
const NAV=[["home","Home"],...Object.keys(ROOMS).map(k=>[k,ROOMS[k].name]),["search","Search"],["catalog","My shelf"],["settings","Settings"],["about","About"]];
$("#nav").append(...NAV.map(([k,t])=>{const a=mk("a",null,t);a.dataset.k=k;a.tabIndex=0;const go=()=>nav(k==="home"?"?":ROOMS[k]?"?m="+k:"?v="+k);a.onclick=go;a.onkeydown=e=>{if(e.key==="Enter")go()};return a}));

/* ---------- router ---------- */
function route(){
 viewTok++;stopAudio();stopMonkey();
 keep=false;hl=null;{const q=(new URLSearchParams(location.search).get("h")||"").split("-").map(Number);if(q.length===2&&q[1]>q[0])hl={a:q[0],b:q[1]}}
 const p=new URLSearchParams(location.search);let seed=p.get("seed");const qa=p.get("a");
 if(qa)try{seed=[...qa].reduce((x,c)=>x*36n+BigInt(parseInt(c,36)),0n).toString()}catch(e){seed=null}
 const m=p.get("m")||(seed?"letters":null);
 bmW=+p.get("w")||0;
 tuneSel=p.get("t")!=null&&TUNES[+p.get("t")]?{i:+p.get("t"),k:+p.get("k"),c:+p.get("c")}:null;
 document.querySelectorAll("nav a").forEach(a=>a.classList.toggle("on",a.dataset.k===(m||p.get("v")||"home")));
 window.scrollTo(0,0);v.style.textAlign="";
 if(m==="pictures")return picView(p.get("p"));
 if(m==="sound")return soundView(p.get("p"));
 if(m&&ROOMS[m]){if(!seed&&BIG&&BIG.m===m)return room(m,BIG.seed);if(!seed)return goRandom(m,true);return room(m,seed)}
 const f={search:searchView,catalog:catalogView,settings:settingsView,about:aboutView}[p.get("v")];(f||home)()}
window.addEventListener("popstate",route);