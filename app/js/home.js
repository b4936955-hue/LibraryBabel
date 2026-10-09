"use strict";
/* ---------- home / about / shelf ---------- */
function detect(t){
 const x=t.trim(),face=[...x.replace(/\s/g,"")];
 if(/^\d+x\d+:[A-Za-z0-9+\/=]+$/.test(x))return"pictures";
 if(/^snd\d+:[A-Za-z0-9+\/=]+$/.test(x))return"sound";
 {const a=parseAddr(x);if(a)return a.m||"letters"}
 if(/^\d+$/.test(x))return"numbers";
 if(/^(\s*([A-Ga-g][#b]?\d|[-.]))+\s*$/.test(x)&&/[A-Ga-g][#b]?\d/.test(x))return"music";
 if(/^(\s*#[0-9a-f]{3}([0-9a-f]{3})?\b)+\s*$/i.test(x))return"colors";
 if(/^[01\s]{16,}$/.test(x))return"binary";
 if(/^[ACGTacgt\s]{12,}$/.test(x))return"dna";
 if(face.length&&face.every(c=>{const k=c.codePointAt(0)-0x1F600;return k>=0&&k<64}))return"emoji";
 return"letters"}
function home(){
 v.innerHTML="";
 v.append(mk("h1",null,"The Library of Babel"),mk("p","sub","Every page that could ever be written is already in here somewhere. You don't write anything. You just go and find it."));
 const ta=mk("textarea"),go=mk("button","btn pri","Find it"),st=mk("div","note"),bar=mk("div","bar");
 ta.placeholder="Type or paste anything: words, digits, notes like C4 E4 G4, colors like #c79a4a. You can also drop an mp3 or a PNG anywhere on the page.";
 const run=()=>{try{const r=detect(ta.value);if(r==="pictures")return nav("?m=pictures&p="+encodeURIComponent(ta.value.trim()));if(r==="sound")return nav("?m=sound&p="+encodeURIComponent(ta.value.trim()));const x=resolve(r,ta.value);openSeed(x.room||r,x.seed,x.hl)}catch(e){st.textContent=e.message}};
 go.onclick=run;ta.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();run()}};
 bar.append(ta,go);v.append(bar,st);
 v.append(mk("h3","rooms-h","The rooms"));
 const d=mk("div","doors");
 for(const m in ROOMS){const b=mk("button","door");b.style.borderTopColor=ROOMS[m].hue;b.append(mk("b",null,ROOMS[m].name),mk("span",null,ROOMS[m].tag));b.onclick=()=>nav("?m="+m);d.append(b)}
 v.append(d)}
let pending=null;
addEventListener("dragover",e=>e.preventDefault());
addEventListener("drop",e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(!f)return;pending=f;nav(/audio|\.(mp3|wav|m4a|ogg)$/i.test(f.type+f.name)?"?m=sound":"?m=pictures")});
function aboutView(){
 v.innerHTML="<h2>What this is</h2>"+
 "<p>This is a library where every possible page already exists. Nobody writes anything here. You just look up where something already lives.</p>"+
 "<p>Every page has an address, which is one very big number. Type something and you get its address. The same address gives you the same page every time, on any device. Hit Random and you'll mostly get nonsense, because nearly everything in here is nonsense.</p>"+
 "<p>A page can be as short or as long as it needs to be. Letters, numbers, DNA, dice, emoji and bitmaps go up to about a million symbols. Colors stop at fifty thousand and music at about forty minutes. If a page fits in a link, the link is the page. If it's too big, you get an address to copy and paste back in later. Pictures and sounds work the same way.</p>"+
 "<p>The Random button picks a length and then fills in every symbol completely at random. Nothing is steered or picked from a list, so pictures come out as static and text comes out as gibberish. Any real page is still in here somewhere.</p>"+
 "<p>Music is a record made of steps, eight to every second. Each step is a rest, a held note or one of 36 notes, plus a bass note and a drum hit. The monkeys on the Music page make up random records and watch for a tune they know. The mp3 button writes down the notes it hears, which isn't the same as keeping the sound. The Sound room keeps the real audio.</p>"+
 "<p>The shelves at the bottom of each page are the same address written another way: 32 books on a shelf, 5 shelves on a wall, 4 walls to a room.</p>"}
function catalogView(){
 v.innerHTML="";v.append(mk("h2",null,"My shelf"));const c=getCat();
 if(!c.length){v.append(mk("p",null,"Nothing here yet. Save a page and it'll show up on this shelf."));return}
 c.forEach((x,i)=>{const r=mk("div","res");r.append(mk("b",null,ROOMS[x.m].name),mk("br"),mk("small",null,short(x.s)));const b=mk("button","btn sm","Remove");b.onclick=e=>{e.stopPropagation();c.splice(i,1);setCat(c);catalogView()};r.append(" ",b);r.onclick=()=>openSeed(x.m,BigInt(x.s));v.append(r)})}
