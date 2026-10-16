"use strict";
/* ---------- interface helpers: grouped actions, a settings section bar, and empty states that say what to do ---------- */
/* the room page used to show eleven equal buttons; they are the same buttons, grouped by what they do */
function groupActs(a){
 const G=[["Move",/^(Random page|Previous page|Next page|Random word)$/],["Share",/^(Copy link|Copy address|Copy text|Share)$/],["Keep",/./]],box=mk("div","toolbar"),parts=G.map(([t])=>{const d=mk("div","tg"),r=mk("div","tgb");d.append(mk("span","tl",t),r);d.r=r;return d});
 [...a.children].forEach(b=>parts[G.findIndex(([,re])=>re.test(b.textContent))].r.append(b));
 parts.forEach(p=>{if(p.r.children.length)box.append(p)});return box}
/* sixty settings in one scroll: a bar that jumps to each section and stays in view */
{const sv=settingsView;settingsView=function(){sv();try{
 const heads=[...v.querySelectorAll("h3")];if(heads.length<3)return;
 const nav=mk("nav","jump");nav.setAttribute("aria-label","Settings sections");
 heads.forEach(h=>{h.classList.add("sethead");const b=mk("button","jumpb",h.textContent);b.onclick=()=>h.scrollIntoView({behavior:SG("motion")?"auto":"smooth",block:"start"});nav.append(b)});
 const lede=v.querySelector(".lede");if(lede)lede.after(nav)}catch(e){}}}
/* an empty shelf should offer the next step, not just state the fact */
{const cv=catalogView;catalogView=function(){cv();try{
 const p=[...v.querySelectorAll("p")].find(x=>/Nothing here yet/.test(x.textContent));if(!p)return;
 p.textContent="Nothing here yet. Open any page and press \u201CSave to my shelf\u201D. It will be waiting here, and you can export the whole shelf to keep it.";
 const a=mk("div","acts"),r=mk("button","btn pri","Browse the rooms"),s=mk("button","btn","Surprise me");
 r.onclick=()=>nav("?v=rooms");s.onclick=()=>commands().find(c=>c.t==="Surprise me").f();a.append(r,s);p.after(a)}catch(e){}}}
/* searching: say what to expect before the first try */
{const sw=searchView;searchView=function(){sw();try{
 const l=v.querySelector(".lede");if(l)l.after(mk("p","fine","Short words turn up quickly. Every extra letter makes a phrase about 96 times rarer, so if nothing turns up, try fewer words."))}catch(e){}}}
