"use strict";
/* ---------- settings: saved in this browser, applied everywhere ---------- */
const SETTINGS=[
 /* how the site looks */
 {g:"How it looks",k:"uiTheme",t:"select",d:"dark",l:"Color theme",o:[["dark","Dark"],["midnight","Midnight blue"],["sepia","Sepia"],["light","Light"]]},
 {g:"How it looks",k:"accent",t:"select",d:"gold",l:"Accent color",o:[["gold","Gold"],["orange","Orange"],["red","Red"],["pink","Pink"],["purple","Purple"],["blue","Blue"],["teal","Teal"],["green","Green"]]},
 {g:"How it looks",k:"contrast",t:"select",d:"normal",l:"Text contrast",o:[["normal","Normal"],["high","High"]],h:"High makes all the grey text brighter."},
 {g:"How it looks",k:"uiFont",t:"select",d:"serif",l:"Site font",o:[["serif","Serif"],["sans","Sans-serif"],["mono","Monospace"]]},
 {g:"How it looks",k:"baseSize",t:"range",d:17,min:14,max:24,step:1,l:"Text size",u:"px"},
 {g:"How it looks",k:"lineHeight",t:"range",d:1.6,min:1.3,max:2.1,step:.05,l:"Line spacing",u:""},
 {g:"How it looks",k:"pageWidth",t:"range",d:960,min:720,max:1600,step:20,l:"Width of the site",u:"px"},
 {g:"How it looks",k:"corners",t:"range",d:3,min:0,max:18,step:1,l:"Rounded corners",u:"px"},
 {g:"How it looks",k:"doorStyle",t:"select",d:"cream",l:"Room cards on the home page",o:[["cream","Cream paper"],["dark","Match the theme"]]},
 {g:"How it looks",k:"compact",t:"check",d:false,l:"Tighter spacing"},
 {g:"How it looks",k:"stickyNav",t:"check",d:false,l:"Keep the menu at the top while you scroll"},
 {g:"How it looks",k:"showHints",t:"check",d:true,l:"Show the small explanations under each page"},
 {g:"How it looks",k:"showAddress",t:"check",d:true,l:"Show each page's address"},
 {g:"How it looks",k:"motion",t:"check",d:false,l:"Reduce motion (turns off animations)"},
 /* pages */
 {g:"Pages",k:"paper",t:"select",d:"parchment",l:"Paper",o:[["parchment","Parchment"],["white","Bright white"],["dark","Dark"],["grid","Graph paper"],["sepia","Old sepia"],["green","Terminal green"]]},
 {g:"Pages",k:"font",t:"select",d:"serif",l:"Font on the page",o:[["serif","Serif"],["mono","Monospace"],["sans","Sans-serif"],["type","Typewriter"]]},
 {g:"Pages",k:"fontSize",t:"range",d:19,min:12,max:34,step:1,l:"Page text size",u:"px"},
 {g:"Pages",k:"pageLine",t:"range",d:1.7,min:1.2,max:2.4,step:.05,l:"Page line spacing",u:""},
 {g:"Pages",k:"pageSpacing",t:"range",d:.14,min:0,max:.4,step:.02,l:"Space between letters (monospace pages)",u:"em"},
 {g:"Pages",k:"viewH",t:"range",d:420,min:200,max:1000,step:20,l:"Height of every page window",u:"px"},
 {g:"Pages",k:"chunk",t:"select",d:"3000",l:"How much \"View more\" adds",o:[["1000","1,000"],["3000","3,000"],["10000","10,000"],["30000","30,000"]]},
 {g:"Pages",k:"swatchCols",t:"select",d:"8",l:"Color swatches per row",o:[["4","4"],["6","6"],["8","8"],["12","12"],["16","16"],["24","24"]]},
 {g:"Pages",k:"bmColor",t:"select",d:"white",l:"Bitmap pixel color",o:[["white","White"],["green","Green"],["amber","Amber"],["red","Red"]]},
 /* the library of shelves */
 {g:"Bookshelves",k:"showLibrary",t:"check",d:true,l:"Show the bookshelves under each page"},
 {g:"Bookshelves",k:"anim",t:"check",d:true,l:"Animate the search for your book",h:"A lamp sweeps the shelves, books slide out and yours gets pulled down."},
 {g:"Bookshelves",k:"animSpeed",t:"select",d:"1",l:"Animation speed",o:[["2","Slow"],["1","Normal"],[".5","Fast"]]},
 {g:"Bookshelves",k:"texture",t:"select",d:"leather",l:"Book covers",o:[["leather","Leather"],["cloth","Cloth"],["plain","Plain"],["marble","Marbled"],["stripes","Striped"],["worn","Worn and scuffed"],["dots","Speckled"]]},
 {g:"Bookshelves",k:"gilt",t:"check",d:true,l:"Gold trim on the spines"},
 {g:"Bookshelves",k:"light",t:"select",d:"warm",l:"Lighting",o:[["warm","Warm lamp"],["cool","Moonlight"],["dim","Candlelight"],["bright","Bright"]]},
 {g:"Bookshelves",k:"spineTitles",t:"check",d:true,l:"Write text on the spines (Letters room)"},
 /* playing music */
 {g:"Playing music",k:"volume",t:"range",d:60,min:0,max:100,step:5,l:"Volume",u:"%"},
 {g:"Playing music",k:"inst",t:"select",d:"piano",l:"Melody instrument",o:INST_NAMES_S()},
 {g:"Playing music",k:"bassInst",t:"select",d:"organ",l:"Bass instrument",o:[["organ","Organ"],["sub","Sub bass"],["piano","Piano"],["strings","Strings"],["synth","Synth"]]},
 {g:"Playing music",k:"drumKit",t:"select",d:"acoustic",l:"Drum kit",o:[["acoustic","Acoustic"],["808","808"],["soft","Soft"],["electronic","Electronic"]]},
 {g:"Playing music",k:"tempo",t:"range",d:100,min:25,max:200,step:5,l:"Starting tempo",u:"%"},
 {g:"Playing music",k:"transpose",t:"range",d:0,min:-12,max:12,step:1,l:"Transpose",u:" semitones"},
 {g:"Playing music",k:"melodyVol",t:"range",d:100,min:0,max:150,step:5,l:"Melody loudness",u:"%"},
 {g:"Playing music",k:"bassVol",t:"range",d:100,min:0,max:150,step:5,l:"Bass loudness",u:"%"},
 {g:"Playing music",k:"drumVol",t:"range",d:100,min:0,max:150,step:5,l:"Drum loudness",u:"%"},
 {g:"Playing music",k:"chordVol",t:"range",d:100,min:0,max:150,step:5,l:"Chord loudness",u:"%"},
 {g:"Playing music",k:"band",t:"check",d:true,l:"Bass and drums on to start with"},
 {g:"Playing music",k:"chords",t:"check",d:false,l:"Chords on to start with"},
 {g:"Playing music",k:"swing",t:"range",d:0,min:0,max:50,step:5,l:"Swing",u:"%",h:"Pushes every second step a little late."},
 {g:"Playing music",k:"humanize",t:"range",d:0,min:0,max:40,step:2,l:"Human feel",u:" ms",h:"Nudges the timing and loudness of each note a little at random."},
 {g:"Playing music",k:"reverb",t:"range",d:35,min:0,max:100,step:5,l:"Room echo",u:"%"},
 {g:"Playing music",k:"crackle",t:"select",d:"light",l:"Vinyl crackle",o:[["off","None"],["light","A little"],["medium","Some"],["heavy","A lot"]]},
 {g:"Playing music",k:"loop",t:"check",d:false,l:"Play records on repeat"},
 {g:"Playing music",k:"autoplay",t:"check",d:false,l:"Start playing as soon as a record opens"},
 /* the record itself */
 {g:"The record",k:"vinyl",t:"select",d:"black",l:"Vinyl color",o:[["black","Black"],["smoke","Smoky"],["red","Red"],["orange","Orange"],["gold","Gold"],["green","Green"],["teal","Teal"],["blue","Blue"],["purple","Purple"],["pink","Pink"],["white","White"]]},
 {g:"The record",k:"labelColor",t:"select",d:"accent",l:"Label color",o:[["accent","Match the accent"],["cream","Cream"],["red","Red"],["blue","Blue"],["white","White"],["black","Black"]]},
 {g:"The record",k:"progressColor",t:"select",d:"accent",l:"Color of the part already played",o:[["accent","Match the accent"],["white","White"],["red","Red"],["green","Green"],["cyan","Cyan"],["pink","Pink"]]},
 {g:"The record",k:"showProgress",t:"check",d:true,l:"Color in the part already played"},
 {g:"The record",k:"grooveDetail",t:"select",d:"normal",l:"Groove detail",o:[["smooth","Smooth and fine"],["normal","Normal"],["fast","Rough but quick"]],h:"Rough draws big records faster."},
 {g:"The record",k:"shine",t:"range",d:50,min:0,max:100,step:5,l:"Shine",u:"%"},
 {g:"The record",k:"needleDrop",t:"check",d:true,l:"Lower the needle onto the record"},
 {g:"The record",k:"showNotes",t:"check",d:true,l:"List the notes under the record"},
 /* turning mp3s into records */
 {g:"Turning mp3s into notes",k:"transSens",t:"select",d:"normal",l:"How many notes to catch",o:[["low","Only the clear ones"],["normal","Normal"],["high","As many as possible"]]},
 {g:"Turning mp3s into notes",k:"transOct",t:"select",d:"auto",l:"Octaves",o:[["auto","Move the tune into range"],["off","Leave them alone"]]},
 {g:"Turning mp3s into notes",k:"transSnap",t:"check",d:false,l:"Snap stray notes to the song's key"},
 {g:"Turning mp3s into notes",k:"transBass",t:"check",d:true,l:"Listen for the bass"},
 {g:"Turning mp3s into notes",k:"transDrums",t:"check",d:true,l:"Listen for the drums"},
 /* monkeys */
 {g:"Monkeys",k:"monkeyKeys",t:"select",d:"white",l:"Keys they can press",o:[["white","White keys only"],["pent","Pentatonic"],["all","Every key"]]},
 {g:"Monkeys",k:"monkeyPower",t:"select",d:"14",l:"How hard they work",o:[["6","Gentle"],["14","Normal"],["40","All out"]]}
];
function INST_NAMES_S(){return[["piano","Piano"],["organ","Organ"],["strings","Strings"],["guitar","Guitar"],["flute","Flute"],["marimba","Marimba"],["synth","Synth lead"],["musicbox","Music box"],["bell","Bell"],["chip","Chip"]]}
const SET=(()=>{let o={};try{o=JSON.parse(localStorage.getItem("babelSettings"))||{}}catch(e){}SETTINGS.forEach(s=>{if(!(s.k in o))o[s.k]=s.d});return o})();
const SG=k=>SET[k];
function saveSet(){try{localStorage.setItem("babelSettings",JSON.stringify(SET))}catch(e){}applySettings()}
const ACCENTS={gold:["#c79a4a","#d4a95a"],orange:["#e0803a","#ee9350"],red:["#d27a6a","#e28c7c"],pink:["#d878a4","#e68ab4"],purple:["#a58ad6","#b79ae6"],blue:["#6a9fd6","#82b3e6"],teal:["#4fb5ab","#66c6bc"],green:["#6fae7a","#82c18d"]};
const THEMES={
 dark:{bg:"#171310",pn:"#1f1a16",bd:"#372f27",tx:"#e9e0d0",mu:"#a5977f",pt:"#cbbfa9"},
 midnight:{bg:"#0d111d",pn:"#141a2b",bd:"#2a3350",tx:"#e1e7f5",mu:"#9aa6c6",pt:"#c3cce4"},
 sepia:{bg:"#e9dcc0",pn:"#f4ead2",bd:"#c8b68f",tx:"#2a2118",mu:"#64543a",pt:"#3a2f22",light:1},
 light:{bg:"#f5f3ee",pn:"#ffffff",bd:"#d6d0c2",tx:"#1d1a15",mu:"#595244",pt:"#332e26",light:1}};
const PAPERS={parchment:["#f2ead8","#2a2118"],white:["#ffffff","#111111"],dark:["#1d1a17","#e9e0d0"],grid:["#f7f9fb","#1b2a3a"],sepia:["#e4d3ae","#3a2a14"],green:["#0c1a10","#6dff9a"]};
const FONTS={serif:'Georgia,serif',mono:'ui-monospace,Consolas,monospace',sans:'system-ui,sans-serif',type:'"Courier New",Courier,monospace'};
const UFONTS={serif:'"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif',sans:'system-ui,-apple-system,"Segoe UI",sans-serif',mono:'ui-monospace,Consolas,monospace'};
const BMC={white:"240,240,240",green:"90,255,130",amber:"255,176,40",red:"255,90,80"};
const shade=(h,k)=>"#"+[1,3,5].map(i=>Math.round(parseInt(h.slice(i,i+2),16)*k).toString(16).padStart(2,"0")).join("");
function applySettings(){
 const r=document.documentElement.style,T=THEMES[SG("uiTheme")]||THEMES.dark,hi=SG("contrast")==="high",a=ACCENTS[SG("accent")]||ACCENTS.gold,p=PAPERS[SG("paper")]||PAPERS.parchment;
 const set=(k,x)=>r.setProperty(k,x);
 set("--bg",T.bg);set("--pn",T.pn);set("--bd",T.bd);set("--tx",T.tx);set("--mu",hi?T.tx:T.mu);set("--pt",hi?T.tx:T.pt);
 set("--ac",T.light?shade(a[0],.72):a[0]);set("--ach",T.light?shade(a[1],.78):a[1]);set("--paper",p[0]);set("--ink",p[1]);
 set("--pfont",FONTS[SG("font")]||FONTS.serif);set("--psize",SG("fontSize")+"px");set("--plh",SG("pageLine"));set("--pls",SG("pageSpacing")+"em");
 set("--viewh",SG("viewH")+"px");set("--cols",SG("swatchCols"));
 set("--ufont",UFONTS[SG("uiFont")]||UFONTS.serif);set("--usize",SG("baseSize")+"px");set("--lh",SG("lineHeight"));set("--pw",SG("pageWidth")+"px");set("--rad",SG("corners")+"px");
 const b=document.body,cl=(c,on)=>b.classList.toggle(c,!!on);
 cl("nomotion",SG("motion"));cl("gridpaper",SG("paper")==="grid");cl("compact",SG("compact"));cl("stickynav",SG("stickyNav"));cl("nohints",!SG("showHints"));cl("noaddr",!SG("showAddress"));cl("doorsdark",SG("doorStyle")==="dark");cl("lighttheme",T.light)}
function settingsView(){
 v.innerHTML="";v.append(mk("h2",null,"Settings"),mk("p","lede","Everything here saves in this browser and changes right away."));
 const q=mk("input");q.type="text";q.placeholder="Search the settings";q.style.cssText="width:100%;max-width:420px;margin:4px 0 6px";v.append(q);
 const rows=[],heads=[];let g="",box=null,head=null;
 SETTINGS.forEach(s=>{
  if(s.g!==g){g=s.g;head=mk("h3","rooms-h",g);v.append(head);box=mk("div","setgrid");v.append(box);heads.push({head,box})}
  const row=mk("label","setrow"),nm=mk("span","setl",s.l);if(s.h){nm.append(mk("small",null,s.h))}let c;
  if(s.t==="check"){c=mk("input");c.type="checkbox";c.checked=!!SG(s.k);c.onchange=()=>{SET[s.k]=c.checked;saveSet()};row.append(nm,c)}
  else if(s.t==="select"){c=mk("select");s.o.forEach(([x,t])=>c.append(new Option(t,x,x===String(SG(s.k)),x===String(SG(s.k)))));c.onchange=()=>{SET[s.k]=c.value;saveSet()};row.append(nm,c)}
  else{c=mk("input");c.type="range";c.min=s.min;c.max=s.max;c.step=s.step;c.value=SG(s.k);const o=mk("span","setv",SG(s.k)+s.u);c.oninput=()=>{SET[s.k]=+c.value;o.textContent=c.value+s.u;saveSet()};row.append(nm,c,o)}
  box.append(row);rows.push({row,s,box})});
 q.oninput=()=>{const t=q.value.trim().toLowerCase();rows.forEach(x=>x.row.style.display=!t||(x.s.l+" "+x.s.g+" "+(x.s.h||"")).toLowerCase().includes(t)?"":"none");
  heads.forEach(h=>{const any=[...h.box.children].some(c=>c.style.display!=="none");h.head.style.display=h.box.style.display=any?"":"none"})};
 const rs=mk("button","btn","Put everything back how it was");rs.onclick=()=>{SETTINGS.forEach(s=>SET[s.k]=s.d);saveSet();settingsView()};
 const ac=mk("div","acts");ac.append(rs);v.append(ac)}
