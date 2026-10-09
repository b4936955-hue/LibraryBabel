"use strict";
/* ---------- search the letters ---------- */
let dict=null,dictArr=[];
async function loadDict(){if(dict)return dict;
 for(const b of[window.BABEL_DATA_BASE,"data/","https://cdn.jsdelivr.net/gh/b4936955-hue/LibraryBabel@latest/data/"].filter(Boolean)){
  try{const r=await fetch(b+"words.txt");if(!r.ok)continue;const ws=(await r.text()).split(/\r?\n/).map(w=>w.trim().toLowerCase()).filter(w=>/^[a-z]+$/.test(w));dict=new Set(ws);dictArr=[...dict];return dict}catch(e){}}
 throw Error("Couldn't load the word list. Check your connection.")}
function searchView(){
 v.innerHTML="";v.append(mk("h2",null,"Search the letters"),mk("p","lede","Typing in a room takes you straight to a page. This works the other way around. It reads through pages one after another, a million at a time, and shows you any that contain what you typed. Most of the time it finds nothing, and you can keep going from where it stopped."));
 const q=mk("input");q.type="text";q.placeholder="a word or phrase";q.style.flex="1";
 const ex=mk("input");ex.type="checkbox";const wd=mk("input");wd.type="checkbox";
 const go=mk("button","btn pri","Search 1,000,000 pages"),more=mk("button","btn","Search the next 1,000,000"),st=mk("div","note"),out=mk("div");
 const bar=mk("div","bar");bar.append(q,go);more.style.display="none";
 const o=mk("div","row"),l1=mk("label"),l2=mk("label"),s1=mk("input");s1.type="number";s1.min=1;s1.value=1;s1.style.width="130px";
 l1.append(ex," whole page is exactly this");l2.append(wd," only real words");o.append(l1,l2,mk("span",null,"start at page"),s1);
 const BATCH=1000000,CAP=100;let run=0,next=1,total=0;
 const scan=async(from,fresh)=>{const id=++run,term=q.value.toLowerCase();if(!term.trim()){st.textContent="Type something to look for.";return}
  if(fresh){out.innerHTML="";total=0}more.style.display="none";let found=0,s=from;
  try{if(wd.checked&&!dict){st.textContent="Loading the word list...";await loadDict()}
   for(;s<from+BATCH&&found<CAP&&id===run;s++){
    if((s-from)%25000===24999){st.textContent="Looked through "+(s-from+1).toLocaleString()+" pages...";await new Promise(z=>setTimeout(z))}
    const t=fastText(s),lo=t.toLowerCase();if(ex.checked?lo!==term:!lo.includes(term))continue;
    if(wd.checked){const w=lo.match(/[a-z]+/g);if(!w||!w.every(x=>dict.has(x)))continue}
    found++;total++;const a=s,r=mk("div","res");r.append(mk("div",null,t),mk("small",null,"address "+a));r.onclick=()=>nav(link("letters",a));out.append(r)}
   if(id!==run)return;next=s;
   st.textContent="Pages "+from.toLocaleString()+" to "+(s-1).toLocaleString()+": "+(found?found+" found"+(found>=CAP?" (stopped at "+CAP+")":""):"nothing")+". "+total+" found in all.";
   more.style.display="inline-block"}
  catch(e){st.textContent=e.message}};
 go.onclick=()=>scan(Math.max(1,Math.floor(+s1.value)||1),true);more.onclick=()=>scan(next,false);
 q.onkeydown=e=>{if(e.key==="Enter")go.click()};
 v.append(bar,o,st,more,out)}
