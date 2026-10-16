"use strict";
/* ---------- more rooms: each is just another alphabet for the same idea (a page is a string, a string is a number) ---------- */
const cpRange=(a,n)=>({show:i=>String.fromCodePoint(a+i),parse:c=>{const k=c.codePointAt(0)-a;return k>=0&&k<n?k:-1}});
/* playing cards: the Unicode block skips the knight, so 52 cards are 4 suits of 13 ranks */
const CARD={show:i=>String.fromCodePoint(0x1F0A1+Math.floor(i/13)*16+((i%13)<11?i%13:i%13+1)),parse:c=>{const x=c.codePointAt(0)-0x1F0A1,s=Math.floor(x/16),r=x%16;return x<0||s>3||r===11||r>13?-1:s*13+(r>11?r-1:r)}};
const EXTRA={
 cards:{R:{name:"Cards",K:52,len:0,max:1000000,tag:"Shuffled decks, dealt as long as you like. Every hand ever played is a page.",hue:"#8f5f6a"},io:CARD,per:26,ask:"Paste some playing cards"},
 braille:{R:{name:"Braille",K:256,len:0,max:1000000,tag:"Raised dots, 256 patterns a cell. Anything ever said in Braille, and everything nobody has.",hue:"#7f8a9a"},io:cpRange(0x2800,256),per:40,ask:"Paste some Braille cells"},
 runes:{R:{name:"Runes",K:75,len:0,max:1000000,tag:"Futhark and its cousins. Every inscription ever carved, and every one nobody did.",hue:"#8a7a5a"},io:cpRange(0x16A0,75),per:24,ask:"Paste some runes"},
 kana:{R:{name:"Kana",K:83,len:0,max:1000000,tag:"Hiragana only. Every poem, letter and shopping list that can be written without a single kanji.",hue:"#9a7f8f"},io:cpRange(0x3041,83),per:20,ask:"Paste some hiragana"}};
for(const m in EXTRA){const e=EXTRA[m];ROOMS[m]=e.R;SYM[m]=e.io.parse;SHOW[m]=e.io.show;PER[m]=e.per;ASK[m]=e.ask+". Or paste an address like @"+m+":123."}
/* the home box guesses the room: if every character belongs to one of the new alphabets, it goes there */
{const old=detect;detect=function(t){const f=[...t.replace(/\s/g,"")];if(f.length)for(const m in EXTRA)if(f.every(c=>SYM[m](c)>=0))return m;return old(t)}}
