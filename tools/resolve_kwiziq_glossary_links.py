"""Resolve public legacy glossary links to their canonical offline identities.
Only follows links already present in the authorized archived lessons/tables.
"""
import json
import re
import time
import urllib.robotparser
from crawl_kwiziq_reference import ROOT, CACHE, BASE, UA, request, BeautifulSoup

robots=urllib.robotparser.RobotFileParser()
robots.parse((ROOT/'.dev/kwiziq/robots.html').read_text(encoding='utf8').splitlines())
sources=[ROOT/'app/kwiziq-lessons.js']+list((CACHE/'pages').glob('*.html'))
urls=set()
for source in sources:
    urls.update(BASE+'/my-languages/french/glossary/'+n for n in re.findall(r'/my-languages/french/glossary/(\d+)',source.read_text(encoding='utf8',errors='replace')))
directory=CACHE/'legacy';directory.mkdir(exist_ok=True)
aliases={};last=time.monotonic();delay=max(1,robots.crawl_delay(UA) or 0)
for i,url in enumerate(sorted(urls)):
    page=directory/(url.rsplit('/',1)[-1]+'.html')
    try:
        if not robots.can_fetch(UA,url):raise ValueError('Disallowed by robots.txt')
        if not page.exists():
            time.sleep(max(0,delay-(time.monotonic()-last)));last=time.monotonic();page.write_bytes(request(url))
        soup=BeautifulSoup(page.read_bytes().decode('utf8',errors='replace'),'html.parser')
        canonical=soup.select_one('link[rel="canonical"]')
        if canonical and canonical.get('href','').startswith(BASE+'/revision/glossary/'):
            aliases[url]=canonical['href']
        else:print('UNRESOLVED',url,flush=True)
    except Exception as error:print('UNRESOLVED',url,str(error),flush=True)
    if (i+1)%20==0:print('Resolved',i+1,'/',len(urls),flush=True)
(CACHE/'aliases.json').write_text(json.dumps(aliases,ensure_ascii=False,indent=2),encoding='utf8')
print('Canonical glossary aliases:',len(aliases),'/',len(urls),flush=True)
