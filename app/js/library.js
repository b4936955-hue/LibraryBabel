"use strict";
/* ---------- the library itself: a wall of shelves ---------- */
const SPINES=["#6b2d2a","#4a2f23","#2f4a3a","#27384f","#7a5a2b","#3b2f3f","#26262a","#5a3a2a","#8a3b2e","#35553f","#40506b","#a07a3a","#524034","#6a5a46"];
const esc=t=>t.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function libraryView(m,seed,l){
 const s=seed-1n,hexBase=s-s%640n,w0=l.wall-1,cur=Number(s%160n),box=mk("section","library");
 const cap=mk("p",null,"Every page sits on a shelf in a six-sided room. Four of the walls are shelves, five shelves high with 32 books on each. The other two sides open onto a hall and a staircase. This one is volume "+l.vol+" on shelf "+l.shelf+" (counting from the top) of wall "+l.wall+", in room "+l.hex+". Click any book to pull it down and read it.");
 const cap2=mk("div","note"),holder=mk("div","wall"),tabs=mk("div","acts");
 let wall=w0;
 const paint=w=>{
  const LT=LIGHTS[SG("light")]||LIGHTS.warm,tex=SG("texture"),gilt=SG("gilt");
  const base=hexBase+BigInt(w)*160n,seedNum=Number(base%4294967291n),W=1000,top=34,sh=112,spineTitles=m==="letters"&&b36len(seed)<1200&&SG("spineTitles");
  let h='<svg viewBox="0 0 1000 650" role="img" aria-label="A wall of bookshelves. Wall '+(w+1)+' of this room.">'+
   '<defs><linearGradient id="wl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b211a"/><stop offset="1" stop-color="#1c1510"/></linearGradient>'+
   '<linearGradient id="wd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4b3624"/><stop offset=".5" stop-color="#5a4330"/><stop offset="1" stop-color="#3d2b1c"/></linearGradient>'+
   '<linearGradient id="bd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#65492f"/><stop offset="1" stop-color="#3a2a1b"/></linearGradient>'+
   '<linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a1b"/><stop offset="1" stop-color="#20160e"/></linearGradient>'+
   '<radialGradient id="lamp" cx=".5" cy=".3" r=".75"><stop offset="0" stop-color="'+LT.c+'" stop-opacity="'+LT.a+'"/><stop offset="1" stop-color="'+LT.c+'" stop-opacity="0"/></radialGradient>'+
   '<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="'+LT.v+'"/></radialGradient>'+texDef(SG("texture"))+'</defs>'+
   '<rect width="1000" height="650" fill="url(#wl)"/><rect x="22" y="30" width="956" height="580" fill="#120d09"/>';
  for(let si=0;si<5;si++){
   const y0=top+si*sh,floorY=y0+100,r=rng("w"+seedNum+"-"+si),ws=[];let tot=0;
   for(let i=0;i<32;i++){const q=20+r()*20;ws.push(q);tot+=q}
   const k=948/tot;let x=26;
   for(let i=0;i<32;i++){
    const idx=si*32+i,bw=ws[i]*k,bh=64+r()*32,col=SPINES[Math.floor(r()*SPINES.length)],on=w===w0&&idx===cur,y=floorY-bh;
    let title="";
    if(spineTitles){try{title=toToks(base+BigInt(idx)+1n,96,0,1e6).map(t=>A96[t]).join("").replace(/\s+/g," ").trim().slice(0,Math.floor(bh/6))}catch(e){}}
    h+='<g class="bk'+(on?' on':'')+'" data-k="'+idx+'"><title>Volume '+(i+1)+', shelf '+(si+1)+'</title>'+
     '<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+(bw-1).toFixed(1)+'" height="'+bh.toFixed(1)+'" rx="1.5" fill="'+col+'"'+(on?' stroke="#e9e0d0" stroke-width="1.2"':'')+'/>'+(tex!=="plain"?'<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+(bw-1).toFixed(1)+'" height="'+bh.toFixed(1)+'" rx="1.5" fill="url(#tx)"/>':'')+
     '<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+(bw*.26).toFixed(1)+'" height="'+bh.toFixed(1)+'" fill="#fff" opacity=".09"/>'+
     '<rect x="'+(x+bw*.7).toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+(bw*.3-1).toFixed(1)+'" height="'+bh.toFixed(1)+'" fill="#000" opacity=".24"/>'+
     (gilt?'<rect x="'+x.toFixed(1)+'" y="'+(y+7).toFixed(1)+'" width="'+(bw-1).toFixed(1)+'" height="2" fill="#c9a45c" opacity=".6"/>'+
     '<rect x="'+x.toFixed(1)+'" y="'+(y+bh-9).toFixed(1)+'" width="'+(bw-1).toFixed(1)+'" height="2" fill="#c9a45c" opacity=".6"/>':'');
    if(title)h+='<text transform="translate('+(x+bw/2+2.5).toFixed(1)+','+(floorY-8).toFixed(1)+') rotate(-90)" font-size="8.5" font-family="Georgia,serif" fill="#e3d3a4" opacity=".9">'+esc(title)+'</text>';
    else h+='<rect x="'+(x+2).toFixed(1)+'" y="'+(y+bh*.38).toFixed(1)+'" width="'+(bw-5).toFixed(1)+'" height="14" fill="#d9cba8" opacity=".85"/><text x="'+(x+bw/2-.5).toFixed(1)+'" y="'+(y+bh*.38+10.5).toFixed(1)+'" font-size="8" text-anchor="middle" font-family="Georgia,serif" fill="#3a2a1b">'+(i+1)+'</text>';
    h+='</g>';x+=bw}
   h+='<rect x="22" y="'+floorY+'" width="956" height="12" fill="url(#bd)"/><rect x="22" y="'+(floorY+12)+'" width="956" height="3" fill="#000" opacity=".35"/>'}
  h+='<rect x="0" y="0" width="1000" height="30" fill="url(#wd)"/><rect x="0" y="26" width="1000" height="3" fill="#c9a45c" opacity=".5"/>'+
   '<rect x="0" y="30" width="22" height="590" fill="url(#wd)"/><rect x="978" y="30" width="22" height="590" fill="url(#wd)"/>'+
   '<rect x="0" y="610" width="1000" height="40" fill="url(#fl)"/><rect x="0" y="608" width="1000" height="4" fill="#5a4330"/>'+
   '<rect width="1000" height="650" fill="url(#lamp)" pointer-events="none"/><rect width="1000" height="650" fill="url(#vig)" pointer-events="none"/></svg>';
  holder.innerHTML=h;
  holder.querySelectorAll(".bk").forEach(g=>g.onclick=()=>openSeed(m,base+BigInt(g.dataset.k)+1n));
  tb.forEach((b,i)=>b.classList.toggle("here",i===w));if(SG("anim")&&!SG("motion"))findAnim(holder,w===w0?cur:-1,cap2)};
 const tb=[0,1,2,3].map(i=>{const b=mk("button","btn sm","Wall "+(i+1));b.onclick=()=>{wall=i;paint(i)};tabs.append(b);return b});
 const bp=mk("button","btn sm","Previous room"),bn=mk("button","btn sm","Next room"),br=mk("button","btn sm","Random book on this wall");
 bp.onclick=()=>openSeed(m,seed>640n?seed-640n:seed);bn.onclick=()=>openSeed(m,seed+640n);
 br.onclick=()=>openSeed(m,hexBase+BigInt(wall)*160n+BigInt(Math.floor(Math.random()*160))+1n);
 tabs.append(bp,bn,br);
 paint(w0);
 box.append(mk("h3",null,"Where this page lives"),cap,cap2,holder,tabs);return box}

const LIGHTS={warm:{c:"#ffd596",a:".22",v:".6"},cool:{c:"#a8c8ff",a:".26",v:".6"},dim:{c:"#ff9a4a",a:".30",v:".85"},bright:{c:"#fff4dc",a:".12",v:".25"}};
function texDef(t){
 const P=(b)=>'<pattern id="tx" width="'+b[0]+'" height="'+b[0]+'" patternUnits="userSpaceOnUse">'+b[1]+'</pattern>';
 return({
  leather:P([7,'<circle cx="1.5" cy="1.5" r=".8" fill="#000" opacity=".45"/><circle cx="5" cy="4.5" r=".7" fill="#fff" opacity=".22"/><circle cx="3" cy="6" r=".5" fill="#000" opacity=".35"/>']),
  cloth:P([4,'<path d="M0 .5H4M0 2.5H4" stroke="#000" stroke-width=".7" opacity=".35"/><path d="M.5 0V4M2.5 0V4" stroke="#fff" stroke-width=".6" opacity=".18"/>']),
  marble:P([26,'<path d="M0 6C6 0 12 14 26 8" stroke="#fff" fill="none" opacity=".4"/><path d="M0 18C8 12 14 24 26 16" stroke="#000" fill="none" stroke-width="1.4" opacity=".4"/><path d="M4 26C10 18 18 22 26 26" stroke="#fff" fill="none" opacity=".25"/>']),
  stripes:P([6,'<rect width="1.6" height="6" fill="#fff" opacity=".22"/><rect x="3.4" width="1" height="6" fill="#000" opacity=".3"/>']),
  worn:P([46,'<ellipse cx="10" cy="12" rx="9" ry="5" fill="#000" opacity=".28"/><ellipse cx="32" cy="30" rx="8" ry="11" fill="#fff" opacity=".12"/><path d="M2 40L20 36M28 6L44 10" stroke="#fff" opacity=".3"/><ellipse cx="38" cy="8" rx="5" ry="3" fill="#000" opacity=".25"/>']),
  dots:P([9,'<circle cx="2" cy="2" r="1" fill="#e8d9a8" opacity=".5"/><circle cx="6.5" cy="5.5" r=".8" fill="#000" opacity=".4"/><circle cx="7" cy="1.5" r=".5" fill="#e8d9a8" opacity=".4"/>'])
 })[t]||""}
/* a lamp sweeps the shelves down to the book, lighting them as it goes, then the book slides out */
function findAnim(holder,target,note){
 const svg=holder.querySelector("svg"),bks=[...holder.querySelectorAll(".bk")];if(!svg||!bks.length)return;
 const sp=+SG("animSpeed")||1,pos=bks.map(g=>{const r=g.querySelector("rect"),x=+r.getAttribute("x"),w=+r.getAttribute("width");return{g,cx:x+w/2,row:Math.floor(+g.dataset.k/32)}});
 const tRow=target>=0?Math.floor(target/32):4,NS="http://www.w3.org/2000/svg",lamp=document.createElementNS(NS,"circle");
 lamp.setAttribute("r","70");lamp.setAttribute("fill","url(#lamp)");lamp.setAttribute("pointer-events","none");svg.append(lamp);
 pos.forEach(p=>{p.g.style.opacity=".18";p.lit=false;if(p.g.classList.contains("on")){p.g.dataset.on="1";p.g.classList.remove("on")}});
 const tok=viewTok,per=650*sp,tail=900*sp,total=(tRow+1)*per+tail,t0=performance.now();let done=false,raf2=0;
 const finish=()=>{if(done)return;done=true;cancelAnimationFrame(raf2);lamp.remove();pos.forEach(p=>{p.g.style.opacity="";if(p.g.dataset.on)p.g.classList.add("on")});if(note)note.textContent=""};
 holder.addEventListener("click",finish,{once:true,capture:true});
 const frame=now=>{if(done)return;if(tok!==viewTok||!holder.isConnected){finish();return}
  const t=now-t0;let row=Math.min(tRow,Math.floor(t/per)),f=Math.min(1,(t-row*per)/per);
  if(t>=(tRow+1)*per){const tp=pos.find(p=>+p.g.dataset.k===target);const q=Math.min(1,(t-(tRow+1)*per)/tail);
   if(tp)lamp.setAttribute("cx",(tp.cx+(1-q)*0)),lamp.setAttribute("cy",34+tRow*112+50);else{lamp.setAttribute("cx",500);lamp.setAttribute("cy",34+tRow*112+50)}
   pos.forEach(p=>{if(!p.lit||q>.3){p.g.style.opacity=String(Math.min(1,.18+(q>.3?(q-.3)/.7*.82:0)+(p.lit?.82:0)))}});
   if(note)note.textContent="Found it.";if(t>=total)return finish()}
  else{const lx=row%2?1000-f*1000:f*1000;lamp.setAttribute("cx",lx);lamp.setAttribute("cy",34+row*112+50);
   pos.forEach(p=>{if(!p.lit&&(p.row<row||(p.row===row&&(row%2?p.cx>=lx:p.cx<=lx)))){p.lit=true;p.g.style.opacity="1"}});
   if(note)note.textContent="Looking through the shelves..."}
  raf2=requestAnimationFrame(frame)};
 raf2=requestAnimationFrame(frame)}
