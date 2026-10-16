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
const ICONS={letters:"M5 7h14M5 12h14M5 17h9",numbers:"M9 4 7 20M17 4l-2 16M4 9h16M3 15h16",colors:"M9 9m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0M15 15m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0",dna:"M7 3c0 6 10 6 10 12s-10 6-10 6M17 3c0 6-10 6-10 12M8.5 7h7M8.5 17h7",binary:"M4 4h6v6H4zM14 14h6v6h-6zM14 4h6v6M4 14h6v6",dice:"M4 4h16v16H4zM9 9h.01M15 15h.01M12 12h.01",emoji:"M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M9 10h.01M15 10h.01M8.5 15c1 1.5 6 1.5 7 0",pictures:"M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M16 9h.01",sound:"M3 12h2l2-6 3 12 3-9 2 5 2-2h4",music:"M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"};
function roomIcon(m){const d=document.createElementNS("http://www.w3.org/2000/svg","svg");d.setAttribute("viewBox","0 0 24 24");d.setAttribute("aria-hidden","true");const p=document.createElementNS("http://www.w3.org/2000/svg","path");p.setAttribute("d",ICONS[m]||ICONS.letters);p.setAttribute("stroke-linecap","round");p.setAttribute("stroke-linejoin","round");d.append(p);return d}
/* ---------- scale: every number here is computed from the rooms themselves ---------- */
const fmt=n=>Math.round(n).toLocaleString("en-US");
function roomDigits(m){if(m==="pictures")return 2048*2048*3*Math.log10(256);if(m==="sound")return 96e6*Math.log10(256);const R=ROOMS[m];return(R.len||R.max||BIGMAX)*Math.log10(R.K)}
function pow10(d){const s=mk("span","p10","10");s.append(mk("sup",null,fmt(d)));return s}
function scaleNote(m){const p=mk("p","scale-note");p.append("About ",pow10(roomDigits(m))," possible pages in this room. Most are noise. Every readable one is in here too.");return p}
const FAMS=[["Text and symbols",["letters","numbers","dna","dice","emoji","cards","braille","runes","kana"]],["Images",["colors","binary","pictures"]],["Sound",["sound","music"]]];
/* a real random page from the room, shown small, so each room looks like what it holds */
function specimen(m){
 const e=mk("span","spec"),R=ROOMS[m],r=n=>ri(0,n-1),txt=(L,f)=>{e.textContent=Array.from({length:L},f).join("")};
 if(m==="letters")txt(34,()=>A96[ri(1,95)]);
 else if(m==="numbers")txt(26,()=>r(10));
 else if(SHOW[m])txt(m==="emoji"?9:m==="dice"?14:24,()=>SHOW[m](r(R.K)));
 else if(m==="binary"){const g=mk("span","bits");for(let i=0;i<48;i++)g.append(mk("i",rf()<.5?"on":""));e.append(g)}
 else if(m==="colors"||m==="pictures"){for(let i=0;i<(m==="colors"?10:20);i++){const c=mk("i","sw1");c.style.background="#"+ri(0,16777215).toString(16).padStart(6,"0");e.append(c)}}
 else if(m==="sound"){for(let i=0;i<26;i++){const b=mk("i","wv");b.style.height=ri(2,16)+"px";e.append(b)}}
 else if(m==="music")txt(7,()=>{const t=ri(0,37);return(t===0?".":t===1?"-":nm(t))+" "});
 e.setAttribute("aria-hidden","true");return e}
function roomsList(){
 const wrap=mk("div","rooms");
 FAMS.forEach(([title,keys])=>{wrap.append(mk("h3","fam",title));keys.forEach(m=>{const R=ROOMS[m],a=mk("a","roomrow");a.href="?m="+m;a.onclick=e=>{e.preventDefault();nav("?m="+m)};
  const info=mk("span","ri"),st=mk("span","rs");info.append(mk("b",null,R.name),mk("span","rt",R.tag));st.append(pow10(roomDigits(m)),mk("small",null,"pages"));
  a.append(info,specimen(m),st);wrap.append(a)})});return wrap}
function roomsView(){v.innerHTML="";v.append(mk("h2",null,"The rooms"),mk("p","lede","Each room is a different alphabet. The pages in the specimen column are real ones, drawn at random from that room just now."),roomsList())}
function scalePanel(){
 const D=roomDigits("letters"),lv=Math.floor(D/80),s=mk("section","scale"),g=mk("div","figs");
 const fig=(big,...t)=>{const d=mk("div","fig"),p=mk("p");p.append(...t);d.append(big,p);return d};
 s.append(mk("h2",null,"How big is everything?"));
 g.append(
  fig(pow10(D),"pages in the Letters room alone. Written out in full, that count would fill about "+fmt(D/3000)+" printed pages."),
  fig(pow10(80),"is roughly the number of atoms in the observable universe. Make every atom a universe of atoms, nest that "+fmt(lv)+" levels deep, and you are still short of the pages in one room."),
  fig(mk("span","p10 sm","1,000,000"),"characters fit on a single page. A whole novel fits in one book, and the novel nobody has written yet is in here too."));
 s.append(g,mk("p","fine","The count is finite, because a page stops at a million characters. That is the only limit. It is also far past anything you can picture."));return s}
function home(){
 v.innerHTML="";
 const hero=mk("section","hero"),ta=mk("textarea"),go=mk("button","btn pri","Find it"),st=mk("div","note"),live=mk("div","livead"),bar=mk("div","bar");
 hero.append(mk("h1",null,"Everything that was, is, or will be written is already on a shelf in here."),
  mk("p","sub","Every book. Every true sentence about your life, and every lie about it. Each is a page with an address. Nothing is written here. You look it up."));
 ta.placeholder="Type anything: your name, a sentence, a number, notes like C4 E4 G4, colors like #c79a4a. You can also drop an mp3 or a PNG anywhere on the page.";ta.setAttribute("aria-label","Find the page for anything you type");
 const run=()=>{try{const r=detect(ta.value);if(r==="pictures")return nav("?m=pictures&p="+encodeURIComponent(ta.value.trim()));if(r==="sound")return nav("?m=sound&p="+encodeURIComponent(ta.value.trim()));const x=resolve(r,ta.value);openSeed(x.room||r,x.seed,x.hl)}catch(e){st.textContent=e.message}};
 go.onclick=run;ta.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();run()}};
 let tm=0;ta.oninput=()=>{clearTimeout(tm);tm=setTimeout(()=>{live.textContent="";const x=ta.value;if(!x.trim()||x.length>4000)return;try{const r=detect(x);if(r==="pictures"||r==="sound")return;const q=resolve(r,x),s=q.seed.toString();live.textContent="That is page @"+(s.length>34?s.slice(0,16)+"\u2026"+s.slice(-12):s)+" in "+ROOMS[q.room||r].name+", an address "+s.length.toLocaleString()+" digits long. It was there before you typed it."}catch(e){}},140)};
 bar.append(ta,go);hero.append(bar,live,st,mk("p","fine","The page that says the opposite is in here too. The Library cannot tell you which one is true."));v.append(hero,scalePanel());
 const dp=dailyPage(),row=mk("div","twin"),daily=mk("button","day");
 daily.append(mk("h3",null,"Today's page"),mk("span","snip",dp.text),mk("small","fine","The same page for everyone today. Open it."));daily.onclick=()=>openSeed("letters",dp.seed);
 const pick=mk("div","day"),acts=mk("div","acts"),sur=mk("button","btn","Surprise me"),pal=mk("button","btn","Quick jump");sur.onclick=()=>commands().find(c=>c.t==="Surprise me").f();pal.onclick=showPalette;
 acts.append(sur,pal);pick.append(mk("h3",null,"Not sure where to start?"),mk("p",null,"Let the library choose a room and a page, or press / to jump anywhere."),acts);row.append(daily,pick);v.append(row);
 const rec=getRecent();if(rec.length){v.append(mk("h3","fam","Where you've been"));const ch=mk("div","chips");
  rec.slice(0,8).forEach(x=>{const c=mk("button","chip",ROOMS[x.m].name);c.append(mk("small",null,short(x.s).slice(0,18)));c.onclick=()=>openSeed(x.m,BigInt(x.s));ch.append(c)});v.append(ch)}
 v.append(mk("h2","rooms-h","The rooms"),roomsList())}
let pending=null;
addEventListener("dragover",e=>e.preventDefault());
addEventListener("drop",e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(!f)return;pending=f;nav(/audio|\.(mp3|wav|m4a|ogg)$/i.test(f.type+f.name)?"?m=sound":"?m=pictures")});
function aboutView(){
 v.innerHTML="<h2>What this is</h2>"+
 "<p>A library where every possible page already exists. Nobody writes anything here. You look up where something already lives.</p>"+
 "<p>Every page has an address, one very large number. Type something and you get its address. The same address gives the same page every time, on any device. Press Random and you will mostly get nonsense, because nearly everything in here is nonsense.</p>"+
 "<h3>Why that means everything is in here</h3>"+
 "<p>If a page can hold any string of characters, then every string is a page. That includes every book that was written, every book that will be, and your whole life described accurately. It also includes every false version of each. The Library holds all of it equally and cannot say which is which. Finding something meaningful still means already knowing where to look.</p>"+
 "<h3>The limits, honestly</h3>"+
 "<p>Letters, numbers, DNA, dice, emoji, cards, Braille, runes and kana go up to a million symbols a page. Colors stop at fifty thousand, bitmaps at 262,144 pixels, music at about forty minutes. If a page fits in a link, the link is the page. Bigger ones get an address you copy and paste back in later. Pictures and sounds work the same way.</p>"+
 "<p>Random picks a length, then fills in every symbol completely at random. Nothing is steered or chosen from a list, so pictures come out as static and text as gibberish. Any real page is still in here somewhere.</p>"+
 "<h3>Music</h3>"+
 "<p>Records hold up to five notes at once, plus bass and drums. On the Music page you can turn a stretch of a song into a record: I find the beat, work out the notes and drums, try a few readings against your clip, and keep the closest. It is a rebuild from notes, so it will never be the recording itself. The Sound room keeps the real audio. The monkeys at the piano make up random records and wait for a tune they know.</p>"+
 "<p>The piano is recorded samples from the Salamander Grand Piano by Alexander Holm (CC BY 3.0).</p>"+
 "<p>The shelves under each page are the same address written another way: 32 books to a shelf, 5 shelves to a wall, 4 walls to a room.</p>"}
function catalogView(){
 v.innerHTML="";v.append(mk("h2",null,"My shelf"));let c=getCat();
 if(!c.length){v.append(mk("p",null,"Nothing here yet. Save a page and it shows up on this shelf."));const imp=mk("button","btn","Import a shelf");imp.onclick=()=>importShelf(catalogView);v.append(imp);return}
 v.append(mk("p","lede",c.length+(c.length===1?" page":" pages")+" saved in this browser. Give them names if you like."));
 const bar=mk("div","shelfbar"),q=mk("input");q.type="text";q.placeholder="Filter by name or room";q.setAttribute("aria-label","Filter the shelf");q.style.flex="1";q.style.minWidth="180px";
 const ex=mk("button","btn","Export"),im=mk("button","btn","Import");ex.onclick=()=>{saveBlob(new Blob([JSON.stringify(getCat(),null,1)],{type:"application/json"}),"babel-shelf.json");toast("Shelf saved to a file")};im.onclick=()=>importShelf(catalogView);
 bar.append(q,ex,im);v.append(bar);const list=mk("div");v.append(list);
 const draw=()=>{list.innerHTML="";const t=q.value.trim().toLowerCase();
  c.forEach((x,i)=>{if(t&&!((x.n||"")+" "+ROOMS[x.m].name).toLowerCase().includes(t))return;
   const r=mk("div","res");r.append(mk("b",null,ROOMS[x.m].name),mk("br"),mk("small",null,short(x.s)));
   const b=mk("button","btn sm","Remove");b.onclick=e=>{e.stopPropagation();c.splice(i,1);setCat(c);toast("Removed");catalogView()};r.append(" ",b);
   const lab=mk("input","lab");lab.type="text";lab.placeholder="Add a name...";lab.value=x.n||"";lab.setAttribute("aria-label","Name for this page");lab.onclick=e=>e.stopPropagation();lab.oninput=()=>{x.n=lab.value;setCat(c)};r.append(lab);
   r.onclick=()=>openSeed(x.m,BigInt(x.s),null,false,musicLinkExtras(decodeMusicTiming(x.dt,x.ds),x.p,decodeMX(x.mx)));list.append(r)})};
 q.oninput=draw;draw()}
function importShelf(done){const f=document.createElement("input");f.type="file";f.accept=".json,application/json";f.onchange=async()=>{try{const a=JSON.parse(await f.files[0].text());if(!Array.isArray(a))throw 0;const cur=getCat(),have=new Set(cur.map(x=>x.m+":"+x.s));let n=0;a.forEach(x=>{if(x&&ROOMS[x.m]&&/^\d+$/.test(x.s)&&!have.has(x.m+":"+x.s)){cur.push(x);n++}});setCat(cur);toast(n+(n===1?" page":" pages")+" added");done()}catch(e){toast("That file isn't a shelf I can read")}};f.click()}
