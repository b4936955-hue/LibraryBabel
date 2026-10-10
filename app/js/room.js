"use strict";
/* ---------- a room ---------- */
const ASK={
 letters:"Type or paste something to find its page. Or paste an address like @123.",
 numbers:"Type some digits to find their page. Or paste an address like @123.",
 colors:"Type colors like #c79a4a #fff. Or paste an address like @123.",
 dna:"Type a strand like GATTACA. Or paste an address like @123.",
 binary:"Type some 0s and 1s. Or paste an address like @123.",
 dice:"Type rolls like 4 1 6 6 2. Or paste an address like @123.",
 emoji:"Paste some smiley faces. Or paste an address like @123.",
 music:"Type notes like C4 E4 G4 - - C5. Or paste an address like @123.",
 musicpoly:"Type notes like C4 E4 G4 - - C5. Or paste a polyphonic music address like @musicpoly:123."};
async function room(m,arg){
 const R=ROOMS[m],tok=viewTok;let seed,toks,err="";
 try{seed=typeof arg==="bigint"?arg:BigInt(arg)}catch(e){err="That address doesn't look right."}
 const big=!err&&b36len(seed)>LINK_MAX;
 v.innerHTML="";v.append(mk("h2",null,R.name),mk("p","lede",R.tag));
 const ta=mk("textarea");ta.placeholder=ASK[m]||"Type or paste something to find its page. Or paste an address like @123.";
 const st=mk("div","note"),go=mk("button","btn pri","Find it");
 const open=async()=>{try{st.textContent="One sec...";await new Promise(z=>setTimeout(z,20));const r=resolve(m,ta.value);openSeed(r.room||m,r.seed,r.hl)}catch(e){st.textContent=e.message}};
 go.onclick=open;ta.onkeydown=e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey||m!=="letters")){e.preventDefault();open()}};
 const bar=mk("div","bar");bar.append(ta,go);v.append(bar,st);
 if(err){st.textContent=err;return}
 if(big){st.textContent="Opening a big page...";await new Promise(z=>setTimeout(z,30))}
 try{toks=toToks(seed,R.K,R.len,R.max)}catch(e){st.textContent=e.message;return}
 if(tok!==viewTok)return;
 if(big)st.textContent=toks.length.toLocaleString()+" symbols. That's too big for a link, so copy the address and paste it in the box above whenever you want to come back.";
 /* the address as text, built only when someone asks (it can be millions of digits) */
 let sc=null;const S=()=>sc||(sc=seed.toString()),addrText=()=>"@"+(m==="letters"?"":m+":")+S(),l=loc(seed);
 const ad=mk("div","addr");
 ad.textContent=big?"Address: about "+Math.floor(seed.toString(16).length*4*0.30103).toLocaleString()+" digits. Click to copy it.":short(S());
 ad.title="Click to copy the address";ad.onclick=()=>{st.textContent="Getting the address ready...";setTimeout(()=>copy(addrText(),st),20)};
 v.append(ad);
 const sg=mk("div");v.append(sg);
 let text=null,png=null;
 if(m==="letters"){text=toks.map(i=>A96[i]).join("");winText(sg,text,"")}
 if(PER[m]){const sh=SHOW[m]||String,per=PER[m],parts=[];for(let i=0;i<toks.length;i++)parts.push(sh(toks[i])+((i+1)%per?"":"\n"));text=parts.join("");winText(sg,text,"mono")}
 if(m==="binary")png=bitmapView(sg,toks);
 if(m==="colors"){text=toks.map(t=>"#"+t.toString(16).padStart(6,"0")).join(" ");winChunks(sg,toks.length,(a,b,g)=>{for(let i=a;i<b;i++){const t=toks[i],x="#"+t.toString(16).padStart(6,"0"),c=mk("i",hl&&i>=hl.a&&i<hl.b?"hl":"");c.style.background=x;c.title=x+" (click to copy)";c.onclick=()=>copy(x,st);g.append(c)}},"sw","swatches")}
 if(m==="music"||m==="musicpoly")musicUI(sg,toks,st,m==="musicpoly");
 const a=mk("div","acts"),bR=mk("button","btn pri","Random page"),bP=mk("button","btn","Previous page"),bN=mk("button","btn","Next page"),b2=mk("button","btn","Copy link"),b3=mk("button","btn","Copy address"),b4=mk("button","btn");
 bR.onclick=()=>goRandom(m);
 bP.onclick=()=>openSeed(m,seed>1n?seed-1n:seed);bN.onclick=()=>openSeed(m,seed+1n);
 const canSave=!big&&S().length<50000,saved=()=>getCat().some(x=>x.m===m&&x.s===S());
 b4.textContent=canSave?(saved()?"On my shelf":"Save to my shelf"):"Too big for my shelf";if(!canSave)b4.disabled=true;
 b2.onclick=()=>big?st.textContent="That one's too big for a link. Copy the address instead.":copy(shareLink(m,seed,hl),st);
 b3.onclick=()=>{st.textContent="Getting the address ready...";setTimeout(()=>copy(addrText(),st),20)};
 b4.onclick=()=>{if(!canSave)return;let c=getCat();if(saved())c=c.filter(x=>!(x.m===m&&x.s===S()));else c.push({m,s:S()});setCat(c);b4.textContent=saved()?"On my shelf":"Save to my shelf"};
 a.append(bR,bP,bN);
 if(m==="letters"){const bw=mk("button","btn","Random word");bw.onclick=async()=>{try{st.textContent="Picking a word...";await loadDict();const w=dictArr[Math.floor(Math.random()*dictArr.length)],r=resolve("letters",w);st.textContent="";openSeed("letters",r.seed)}catch(e){st.textContent=e.message}};a.append(bw)}
 a.append(b2,b3,b4);
 if(text&&(big||text.length>3000||true)){const bt=mk("button","btn","Save as .txt");bt.onclick=()=>saveBlob(new Blob([text],{type:"text/plain"}),"babel-"+m+".txt");a.append(bt)}
 if(png){const bp=mk("button","btn","Save as PNG");bp.onclick=()=>png().toBlob(b=>b&&saveBlob(b,"babel-bitmap.png"));a.append(bp)}
 if(big||toks.length>3000){const b5=mk("button","btn","Save address as text");b5.onclick=()=>saveBlob(new Blob([addrText()],{type:"text/plain"}),"babel-"+m+"-address.txt");a.append(b5)}
 v.append(a);
 v.append(mk("p","fine","Random picks a length and then fills in every symbol completely at random. Nothing is shaped, so you mostly get noise. Any real page is still in here, you just need to know its address."));
 if(SG("showLibrary"))v.append(libraryView(m,seed,l))}

/* bitmaps: bits drawn row by row, and you choose the row width */
function bitmapView(host,toks){
 const n=toks.length,cv=mk("canvas","bmp"),row=mk("div","row"),sel=mk("select");
 let w=bmW>0?bmW:(n<=256?16:Math.min(1024,Math.max(16,1<<Math.ceil(Math.log2(Math.sqrt(n))))));
 const ws=[...new Set([1,2,4,8,16,24,32,48,64,96,128,256,512,1024,w])].filter(x=>x<=Math.max(n,w)).sort((a,b)=>a-b);
 ws.forEach(x=>sel.append(new Option(x+" across",x,x===w,x===w)));
 const draw=()=>{w=+sel.value;const h=Math.ceil(n/w);cv.width=w;cv.height=h;const c=cv.getContext&&cv.getContext("2d");
  const sc=Math.max(1,Math.floor(560/w)),col=BMC[SG("bmColor")]||BMC.white,cc=col.split(",").map(Number);cv.style.width=w*sc+"px";if(!c)return;
  const im=c.createImageData(w,h),d=im.data;for(let i=0;i<w*h;i++){const j=i*4,val=i<n?(toks[i]?240:14):52;const on=val>100,dim=val===14;d[j]=on?cc[0]:dim?14:52;d[j+1]=on?cc[1]:dim?14:52;d[j+2]=on?cc[2]:dim?14:52;d[j+3]=255}c.putImageData(im,0,0)};
 sel.onchange=draw;row.append(mk("span",null,n.toLocaleString()+" pixels, drawn"),sel);host.append(row);winShell(host,"center").append(cv);draw();return()=>cv}


/* ---------- same-height windows with "View more" ---------- */
function winShell(host,cls){const w=mk("div","win"+(cls?" "+cls:""));host.append(w);return w}
function moreBar(host,total,unit,add){
 const bar=mk("div","morebar"),info=mk("span","note"),more=mk("button","btn","View more"),all=mk("button","btn","View all");
 let shown=0;const step=()=>+SG("chunk")||3000;
 const upd=()=>{info.textContent="Showing "+shown.toLocaleString()+" of "+total.toLocaleString()+" "+unit;more.style.display=all.style.display=shown>=total?"none":""};
 const go=n=>{if(shown>=total)return;const e=Math.min(total,shown+n);shown=add(shown,e);upd()};
 more.onclick=()=>go(step());all.onclick=()=>{all.textContent="Working...";setTimeout(()=>{go(total);all.textContent="View all"},20)};
 bar.append(more,all,info);host.append(bar);go(step());return go}
function winText(host,text,cls){
 const w=winShell(host),p=mk("div","paper "+cls);w.append(p);let go;
 go=moreBar(host,text.length,"characters",(a,b)=>{const c=text.charCodeAt(b-1);if(b<text.length&&c>=0xD800&&c<0xDC00)b++;p.append(document.createTextNode(text.slice(a,b)));return b});
 w.onscroll=()=>{if(w.scrollTop+w.clientHeight>w.scrollHeight-80)go(+SG("chunk")||3000)}}
function winChunks(host,total,fn,cls,unit){
 const w=winShell(host),g=mk("div",cls);w.append(g);let go;
 go=moreBar(host,total,unit,(a,b)=>{fn(a,b,g);return b});
 w.onscroll=()=>{if(w.scrollTop+w.clientHeight>w.scrollHeight-80)go(+SG("chunk")||3000)}}
