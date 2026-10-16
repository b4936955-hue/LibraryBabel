#!/usr/bin/env python3
"""Rebuild standalone.html (the offline copy) from app/. Run: python build_standalone.py
Reuses the embedded piano samples already inside standalone.html, so nothing else is needed."""
import json,re,os
root=os.path.dirname(os.path.abspath(__file__))
rd=lambda p:open(os.path.join(root,p),encoding='utf8').read().replace('\r\n','\n')
man=json.loads(rd('app/manifest.json'))
old=open(os.path.join(root,'standalone.html'),encoding='utf8').read()
m=re.search(r'<script>window\.BABEL_PIANO_B64=.*?</script>',old,re.S)
if not m: raise SystemExit('No embedded piano found in standalone.html')
safe=lambda t:re.sub(r'</(script|style)',r'<\\/\1',t,flags=re.I)
css='\n'.join('<style>'+safe(rd(c))+'</style>' for c in man['css'])
js='\n'.join('<script>'+safe(rd(j))+'\n//# sourceURL='+j+'</script>' for j in man['js'])
html=rd(man['shell']).replace('<!--STYLE-->',css).replace('<!--SCRIPTS-->',m.group(0)+'\n'+js)
open(os.path.join(root,'standalone.html'),'w',encoding='utf8',newline='\n').write(html)
print('standalone.html rebuilt:',len(html)//1024,'KB')
