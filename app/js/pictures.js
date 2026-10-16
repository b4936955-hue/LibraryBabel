"use strict";
/* ---------- pictures ---------- */
const MAXP=2048;
function packAddr(w,h,rgb){let s="";for(let i=0;i<rgb.length;i+=30000)s+=String.fromCharCode.apply(null,rgb.subarray(i,i+30000));return w+"x"+h+":"+btoa(s)}
function unpack(a){
 const m=/^(\d+)x(\d+):([A-Za-z0-9+\/=]+)$/.exec(a.trim());if(!m)throw Error("That isn't a picture address. They look like 16x16:AbC...");
 const w=+m[1],h=+m[2];if(!(w>0&&h>0&&w<=MAXP&&h<=MAXP))throw Error("Pictures go up to "+MAXP+" x "+MAXP+".");
 const bin=atob(m[3]);if(bin.length!==w*h*3)throw Error("That's the wrong amount of color for "+w+" x "+h+".");
 const rgb=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)rgb[i]=bin.charCodeAt(i);return{w,h,rgb}}
function picView(addr0){
 v.innerHTML="";v.append(mk("h2",null,"Pictures"),mk("p","lede","A picture is just a grid of colors, so every picture is in here somewhere. Upload a PNG (up to "+MAXP+" by "+MAXP+") to get its address, make a random one, or paste an address to see the picture."));
 const f=mk("input");f.type="file";f.accept="image/*";const st=mk("div","note"),cv=mk("canvas"),ad=mk("div","addr"),acts=mk("div","acts");
 cv.style.cssText="max-width:100%;height:auto;image-rendering:pixelated;background:#000;display:none";const win=mk("div","win center");win.append(cv);
 let cur="";
 const show=(w,h,rgb)=>{cv.width=w;cv.height=h;cv.style.width=w*Math.max(1,Math.floor(560/w))+"px";const c=cv.getContext("2d"),im=c.createImageData(w,h),d=im.data;for(let i=0,j=0,k=0;i<w*h;i++){d[j++]=rgb[k++];d[j++]=rgb[k++];d[j++]=rgb[k++];d[j++]=255}c.putImageData(im,0,0);
  cur=packAddr(w,h,rgb);cv.style.display="block";ad.textContent=cur.length>140?cur.slice(0,70)+"..."+cur.slice(-30)+" ("+cur.length.toLocaleString()+" characters)":cur;
  const small=cur.length<8000;st.textContent=w+" x "+h+(small?"":". Too big for a link, so copy the address to share it.");
  try{history.replaceState({},"",small?"?m=pictures&p="+encodeURIComponent(cur):"?m=pictures")}catch(e){}};
 const fromText=t=>{try{const p=unpack(t);show(p.w,p.h,p.rgb)}catch(e){st.textContent=e.message}};
 const handle=async file=>{try{const b=await createImageBitmap(file);if(b.width>MAXP||b.height>MAXP){st.textContent="That one's "+b.width+" x "+b.height+". The limit is "+MAXP+" x "+MAXP+".";return}
  const c=document.createElement("canvas");c.width=b.width;c.height=b.height;const x=c.getContext("2d");x.fillStyle="#000";x.fillRect(0,0,b.width,b.height);x.drawImage(b,0,0);
  const d=x.getImageData(0,0,b.width,b.height).data,rgb=new Uint8Array(b.width*b.height*3);for(let i=0,j=0;i<d.length;i+=4){rgb[j++]=d[i];rgb[j++]=d[i+1];rgb[j++]=d[i+2]}show(b.width,b.height,rgb)}catch(e){st.textContent="Couldn't read that image."}};
 f.onchange=()=>f.files[0]&&handle(f.files[0]);
 const ta=mk("textarea");ta.placeholder="Paste a picture address";const go=mk("button","btn pri","Show it"),bar=mk("div","bar");go.onclick=()=>fromText(ta.value);bar.append(ta,go);
 const wi=mk("input"),hi=mk("input"),rn=mk("button","btn","Random, at this size");[wi,hi].forEach(x=>{x.type="number";x.min=1;x.max=MAXP;x.value=256;x.style.width="90px"});
 rn.onclick=()=>{const w=Math.min(MAXP,Math.max(1,+wi.value||1)),h=Math.min(MAXP,Math.max(1,+hi.value||1));show(w,h,genPicture(w,h))};
 const rr=mk("button","btn pri","Random picture");rr.onclick=()=>{const z=randPictureSize();wi.value=z.w;hi.value=z.h;show(z.w,z.h,genPicture(z.w,z.h))};
 const r2=mk("div","row");r2.append(rr,rn,wi,mk("span",null,"by"),hi);
 const cp=mk("button","btn","Copy address"),dl=mk("button","btn","Save address as text"),sp=mk("button","btn","Save as PNG");
 cp.onclick=()=>cur&&copy(cur,st);
 dl.onclick=()=>{if(!cur)return;const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([cur]));a.download="babel-picture-address.txt";a.click()};
 sp.onclick=()=>cur&&cv.toBlob(b=>{const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="babel-picture.png";a.click()});
 acts.append(cp,dl,sp);v.append(f,r2,bar,st,ad,acts,win);
 if(addr0)fromText(addr0);
 if(pending){const p0=pending;pending=null;handle(p0)}}
