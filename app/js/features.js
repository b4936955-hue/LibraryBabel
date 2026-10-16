"use strict";
/* ---------- little extras: toasts, shortcuts, quick jump, recent pages, page of the day ---------- */
function toast(msg){const t=mk("div","toast",msg);$("#toasts").append(t);setTimeout(()=>t.remove(),2400)}
const getRecent=()=>{try{return JSON.parse(localStorage.getItem("babelRecent"))||[]}catch(e){return[]}};
function trackVisit(m,seed){
 if(!m||!ROOMS[m]||!seed)return;let s=String(seed);if(s.length>40)return;
 const r=getRecent().filter(x=>!(x.m===m&&x.s===s));r.unshift({m,s,t:Date.now()});try{localStorage.setItem("babelRecent",JSON.stringify(r.slice(0,12)))}catch(e){}}
/* the page of the day: the same page for everyone on the same date */
function dailyPage(){const d=new Date(),key=d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(),r=rng("babel-"+key),len=140+Math.floor(r()*160);
 const toks=Array.from({length:len},()=>Math.floor(r()*96));return{key,seed:toSeed(toks,96,false),text:toks.map(i=>A96[i]).join("")}}
/* what the quick-jump box can do */
function commands(){
 const cur=new URLSearchParams(location.search).get("m"),c=[];
 c.push({t:"Home",s:"go",f:()=>nav("?")});
 for(const k in ROOMS){if(ROOMS[k].hidden)continue;c.push({t:ROOMS[k].name,s:"room",f:()=>nav("?m="+k)});c.push({t:"Random page in "+ROOMS[k].name,s:"random",f:()=>goRandom(k)})}
 c.push({t:"Search the letters",s:"go",f:()=>nav("?v=search")},{t:"My shelf",s:"go",f:()=>nav("?v=catalog")},{t:"Settings",s:"go",f:()=>nav("?v=settings")},{t:"About",s:"go",f:()=>nav("?v=about")},
  {t:"Today's page",s:"daily",f:()=>openSeed("letters",dailyPage().seed)},{t:"Surprise me",s:"random",f:()=>{const ks=Object.keys(ROOMS).filter(k=>!ROOMS[k].hidden&&ROOMS[k].len===0&&k!=="pictures"&&k!=="sound");goRandom(ks[Math.floor(Math.random()*ks.length)])}},
  {t:"Keyboard shortcuts",s:"help",f:showHelp});
 return c}
function overlay(build){const o=mk("div","overlay"),d=mk("div","dlg");o.append(d);o.onclick=e=>{if(e.target===o)close()};const close=()=>{o.remove();document.removeEventListener("keydown",esc,true)};const esc=e=>{if(e.key==="Escape"){e.stopPropagation();close()}};document.addEventListener("keydown",esc,true);build(d,close);document.body.append(o);return close}
function showPalette(){
 overlay((d,close)=>{const q=mk("input");q.type="text";q.placeholder="Jump to a room, a page, a setting...";q.setAttribute("aria-label","Quick jump");const list=mk("div");d.append(q,list);let sel=0,shown=[];
  const draw=()=>{const t=q.value.trim().toLowerCase();shown=commands().filter(c=>!t||c.t.toLowerCase().includes(t)).slice(0,9);sel=Math.min(sel,Math.max(0,shown.length-1));list.innerHTML="";
   shown.forEach((c,i)=>{const r=mk("div","cmd"+(i===sel?" on":""));r.append(mk("span",null,c.t),mk("small",null,c.s));r.onclick=()=>{close();c.f()};list.append(r)});if(!shown.length)list.append(mk("p","fine","Nothing matches that."))};
  q.oninput=()=>{sel=0;draw()};q.onkeydown=e=>{if(e.key==="ArrowDown"){sel=Math.min(shown.length-1,sel+1);draw();e.preventDefault()}else if(e.key==="ArrowUp"){sel=Math.max(0,sel-1);draw();e.preventDefault()}else if(e.key==="Enter"&&shown[sel]){close();shown[sel].f()}};draw();setTimeout(()=>q.focus(),0)})}
function showHelp(){
 overlay(d=>{d.append(mk("h3",null,"Keyboard shortcuts"));const k=mk("div","keys");
  [["/ or Ctrl+K","Quick jump to anything"],["R","Random page in this room"],["\u2190  \u2192","Previous or next page"],["Space","Play or stop (music and sound)"],["S","Save or unsave this page on your shelf"],["H","Back to the home page"],["?","This list"],["Esc","Close whatever is open"]].forEach(([a,b])=>{const kb=mk("span");a.split(" ").forEach((x,i)=>{if(/^(or|and)$/.test(x))kb.append(" "+x+" ");else{kb.append(mk("kbd",null,x));kb.append(" ")}});k.append(kb,mk("span",null,b))});
  d.append(k)})}
addEventListener("keydown",e=>{
 const tag=(e.target.tagName||"").toLowerCase(),typing=tag==="input"||tag==="textarea"||tag==="select"||e.target.isContentEditable;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();showPalette();return}
 if(typing||e.ctrlKey||e.metaKey||e.altKey)return;
 const m=new URLSearchParams(location.search).get("m"),btn=t=>[...document.querySelectorAll("main .acts .btn")].find(b=>b.textContent.trim()===t);
 if(e.key==="/"){e.preventDefault();showPalette()}
 else if(e.key==="?"){showHelp()}
 else if(e.key.toLowerCase()==="h"){nav("?")}
 else if(e.key.toLowerCase()==="r"&&m&&ROOMS[m]){const b=btn("Random page");if(b)b.click();else goRandom(m)}
 else if(e.key==="ArrowRight"){const b=btn("Next page");if(b){e.preventDefault();b.click()}}
 else if(e.key==="ArrowLeft"){const b=btn("Previous page");if(b){e.preventDefault();b.click()}}
 else if(e.key.toLowerCase()==="s"){const b=document.querySelector("main .acts .btn:nth-last-child(1)");const sb=[...document.querySelectorAll("main .acts .btn")].find(x=>/shelf/i.test(x.textContent));if(sb)sb.click()}
 else if(e.key===" "){const b=[...document.querySelectorAll("main .rec .btn.pri, main .acts .btn")].find(x=>/^(Play|Stop)$/.test(x.textContent.trim()));if(b){e.preventDefault();b.click()}}});

/* ---------- little tooltips ---------- */
const tipEl=(()=>{const t=document.createElement("div");t.id="tip";document.body.append(t);return t})();
function showTip(text,x,y){tipEl.textContent=text;tipEl.style.left=Math.min(innerWidth-tipEl.offsetWidth-8,x+14)+"px";tipEl.style.top=(y-34)+"px";tipEl.classList.add("on")}
function hideTip(){tipEl.classList.remove("on")}
