"""Archive the authorized public glossary and conjugation reference. Resumable cache."""
import argparse
import hashlib
import json
import re
import time
import urllib.parse
import urllib.robotparser
from datetime import datetime, timezone
from crawl_kwiziq import ROOT, BASE, UA, request, BeautifulSoup, clean

CACHE = ROOT / '.dev/kwiziq-reference'
OUTPUT = ROOT / 'app/kwiziq-reference.js'

def catalog(kind, html):
    soup = BeautifulSoup(html, 'html.parser')
    anchors = [r.select_one('td a') for r in soup.select('table tr')] if kind == 'glossary' else soup.select('a[href]')
    rows, seen = [], set()
    pattern = r'/revision/glossary/[^/]+/[^/]+$' if kind == 'glossary' else r'/revision/grammar/verbs/[^/]+$'
    for a in anchors:
        if not a or not re.fullmatch(pattern, a.get('href','')): continue
        url = urllib.parse.urljoin(BASE,a['href'])
        if url in seen: continue
        seen.add(url)
        rows.append(dict(id=hashlib.sha256(url.encode()).hexdigest()[:16],url=url,title=a.get_text(' ',strip=True),status='pending'))
    if not rows: raise ValueError('Empty directory: '+kind)
    return rows

def extract(kind, html):
    s = BeautifulSoup(html,'html.parser'); main=s.select_one('.main-column'); h=s.select_one('h1')
    if not main or not h: raise ValueError('Missing public reference content')
    author=main.select_one('.content-meta__author');updated=main.select_one('.content-meta__date')
    subtitle=main.find('h2')
    canonical=s.select_one('link[rel="canonical"]')
    data=dict(canonical=canonical.get('href','') if canonical else '',subtitle=subtitle.get_text(' ',strip=True) if subtitle else '',status='ready',title=h.get_text(' ',strip=True),author=author.get_text(' ',strip=True) if author else '',sourceUpdated=updated.get_text(' ',strip=True) if updated else '')
    if kind=='verbs':
        blocks=[]
        for table in main.select('table.sm2-playlist__table'):
            heading=table.select_one('th'); forms=[]
            for tr in table.select('tbody tr'):
                cells=tr.find_all('td',recursive=False)
                if len(cells)==2:
                    forms.append(dict(person=cells[0].get_text(strip=True),form=cells[1].get_text(' ',strip=True)))
            if heading and forms: blocks.append(dict(title=heading.get_text(' ',strip=True),forms=forms))
        if not blocks: raise ValueError('Missing conjugation tables')
        data['blocks']=blocks
        section=main.select_one('table.table--verb-conjugation').find_parent('section')
        intro=section.find_previous_sibling('section')
        while intro and not intro.get_text(' ',strip=True):intro=intro.find_previous_sibling('section')
        data['html']=clean(intro) if intro else ''
        related=section.find_next_sibling('section')
        data['relatedHtml']=clean(related) if related and 'Lessons with more detail' in related.get_text(' ',strip=True) else ''
    else:
        for node in main.select('.content-meta,.banner-cta,.sticky,.callout'):node.decompose()
        definition=BeautifulSoup(str(main),'html.parser')
        for node in definition.select('.related'):node.decompose()
        if len(definition.get_text(' ',strip=True))<30:raise ValueError('Empty glossary definition')
        data['html']=clean(main)
    data['text']=BeautifulSoup(data['html'],'html.parser').get_text(' ',strip=True)
    return data

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--emit-only',action='store_true');args=p.parse_args()
    CACHE.mkdir(parents=True,exist_ok=True);(CACHE/'pages').mkdir(exist_ok=True)
    robots=urllib.robotparser.RobotFileParser();robots.parse((ROOT/'.dev/kwiziq/robots.html').read_text(encoding='utf8').splitlines())
    result={};last=time.monotonic();delay=max(1,robots.crawl_delay(UA) or 0)
    def fetch(url,path):
        nonlocal last
        if not robots.can_fetch(UA,url):raise ValueError('Disallowed by robots.txt')
        if not path.exists() and not args.emit_only:
            time.sleep(max(0,delay-(time.monotonic()-last)));last=time.monotonic();path.write_bytes(request(urllib.parse.quote(url,safe=":/?=&%")))
        return path.read_bytes().decode('utf8',errors='replace')
    for kind,path in [('glossary','/revision/glossary'),('verbs','/revision/grammar/verbs')]:
        rows=catalog(kind,fetch(BASE+path,CACHE/(kind+'.html')))
        print(kind,len(rows),flush=True)
        for i,row in enumerate(rows):
            page=CACHE/'pages'/(row['id']+'.html')
            try:
                html=fetch(row['url'],page);row.update(extract(kind,html));row['rawSha256']=hashlib.sha256(page.read_bytes()).hexdigest();row['fetchedAt']=datetime.fromtimestamp(page.stat().st_mtime,timezone.utc).isoformat()
            except Exception as e:row.update(status='failed',error=str(e));print('FAILED',row['url'],str(e),flush=True)
            if (i+1)%20==0:print(kind,i+1,'/',len(rows),flush=True)
        result[kind]=rows
    alias_file=CACHE/'aliases.json'
    result['aliases']=json.loads(alias_file.read_text(encoding='utf8')) if alias_file.exists() else {}
    for kind in ['glossary','verbs']:
        for row in result[kind]:
            if row.get('canonical') and row['canonical']!=row['url']:result['aliases'][row['canonical']]=row['url']
    result.update(schemaVersion=1,generatedAt=datetime.now(timezone.utc).isoformat(),attribution='KwizIQ Ltd and content authors. User-authorized personal study archive. Audio not included.')
    OUTPUT.write_text('/* Authorized offline glossary and verb reference. */\nglobalThis.KWIZIQ_REFERENCE = '+json.dumps(result,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
    print({k:sum(r['status']=='ready' for r in result[k]) for k in ['glossary','verbs']},flush=True)
    return int(any(r['status']!='ready' and not (k=='glossary' and r.get('error')=='Empty glossary definition') and not (k=='verbs' and r['url'].endswith('/rougir') and r.get('error')=='Missing conjugation tables') for k in ['glossary','verbs'] for r in result[k]))

if __name__=='__main__':raise SystemExit(main())

