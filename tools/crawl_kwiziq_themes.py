#!/usr/bin/env python3
"""Archive the user-authorized theme directory and its bilingual word lists.
Usage: python tools/crawl_kwiziq_themes.py [--emit-only] [--delay 1]
Reuses the grammar crawler's HTTP identity, robots rules and local cache.
"""
import argparse
import hashlib
import json
import re
import time
import urllib.parse
import urllib.robotparser
from datetime import datetime, timezone
from crawl_kwiziq import ROOT, BASE, UA, request, BeautifulSoup

CACHE = ROOT / '.dev/kwiziq-themes'
DIRECTORY = BASE + '/learn/theme'
OUTPUT = ROOT / 'app/kwiziq-themes.js'

def catalog(html):
    soup = BeautifulSoup(html, 'html.parser')
    rows, seen, level = [], set(), None
    for li in soup.select('li'):
        heading = li.find('h3', recursive=False)
        if heading:
            match = re.match(r'^(A0|A1|A2|B1|B2|C1):', heading.get_text())
            if match:
                level = match.group(1)
        anchor = li.find('a', class_='list-style__link')
        if not anchor or not level or not re.fullmatch(r'/learn/theme/\d+', anchor.get('href', '')):
            continue
        url = urllib.parse.urljoin(BASE, anchor['href'])
        if url in seen:
            continue
        seen.add(url)
        description = li.select_one('.list-style__description')
        rows.append({'id': url.rsplit('/',1)[-1], 'title': anchor.get_text(' ', strip=True), 'level': level, 'url': url, 'description': description.get_text(' ',strip=True) if description else '', 'status':'pending'})
    if not rows:
        raise ValueError('No theme entries in directory')
    return rows

def extract(html):
    soup = BeautifulSoup(html, 'html.parser')
    title = soup.select_one('#main-content-wrapper h1')
    tables = soup.select('table.table-vocab-list')
    if not title or not tables:
        raise ValueError('No public vocabulary table; page may require login or use a different format')
    entries, seen, raw_rows = [], set(), 0
    for table in tables:
        for row in table.select('tbody tr'):
            cells = row.find_all('td', recursive=False)
            if len(cells)<2:
                continue
            raw_rows += 1
            fr, en = cells[0].get_text(' ',strip=True), cells[-1].get_text(' ',strip=True)
            if not fr or not en:
                raise ValueError('Incomplete bilingual vocabulary row')
            pair=(fr,en)
            if pair in seen:
                continue
            seen.add(pair)
            entries.append({'id':hashlib.sha256((fr+'\0'+en).encode()).hexdigest()[:16], 'fr':fr, 'en':en})
    if not entries:
        raise ValueError('Empty vocabulary list')
    notes = [p.get_text(' ',strip=True) for p in soup.select('.main-column > p') if p.get_text(' ',strip=True)]
    return {'status':'ready','title':title.get_text(' ',strip=True),'entries':entries,'rawRows':raw_rows,'notes':notes,'rawSha256':hashlib.sha256(html.encode()).hexdigest()}

def export(rows):
    payload={'schemaVersion':1,'source':DIRECTORY,'attribution':'KwizIQ Ltd and content authors. Imported under user-reported full authorization for personal study. Audio not included.', 'generatedAt':datetime.now(timezone.utc).isoformat(),'total':len(rows),'imported':sum(r['status']=='ready' for r in rows),'entryCount':sum(len(r.get('entries',[])) for r in rows),'themes':rows}
    temporary=OUTPUT.with_suffix('.js.tmp')
    temporary.write_text('/* User-authorized offline KwizIQ theme vocabulary archive. */\nglobalThis.KWIZIQ_THEMES = '+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
    temporary.replace(OUTPUT)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--emit-only',action='store_true')
    parser.add_argument('--delay',type=float,default=1)
    args=parser.parse_args()
    CACHE.mkdir(parents=True,exist_ok=True);(CACHE/'pages').mkdir(exist_ok=True)
    directory=CACHE/'directory.html'
    if not directory.exists() and not args.emit_only:
        directory.write_bytes(request(DIRECTORY))
    robots_file=ROOT/'.dev/kwiziq/robots.html'
    if not robots_file.exists() and not args.emit_only:
        robots_file.parent.mkdir(parents=True,exist_ok=True);robots_file.write_bytes(request(BASE+'/robots.txt'))
    robots=urllib.robotparser.RobotFileParser();robots.parse(robots_file.read_text(encoding='utf8').splitlines())
    rows=catalog(directory.read_text(encoding='utf8'))
    previous_errors={}
    if OUTPUT.exists():
        try:
            previous=json.loads(OUTPUT.read_text(encoding='utf8').split('globalThis.KWIZIQ_THEMES = ',1)[1].rsplit(';',1)[0])
            previous_errors={t['id']:{'status':'failed','error':t['error']} for t in previous['themes'] if t['status']=='failed'}
        except (ValueError,KeyError,IndexError):
            pass
    delay=max(1,args.delay,robots.crawl_delay(UA) or 0)
    print(f'Directory: {len(rows)} themes; request delay {delay}s',flush=True)
    last=time.monotonic()
    for index,row in enumerate(rows):
        page=CACHE/'pages'/(row['id']+'.html')
        try:
            if not robots.can_fetch(UA,row['url']):raise ValueError('Disallowed by robots.txt')
            if not page.exists():
                if args.emit_only:
                    row.update(previous_errors.get(row['id'],{}))
                    continue
                for attempt in range(3):
                    time.sleep(max(0,delay-(time.monotonic()-last)));last=time.monotonic()
                    try:page.write_bytes(request(row['url']));break
                    except Exception as error:
                        if getattr(error,'code',None) in (401,403) or attempt==2:raise
                        time.sleep(5)
            row.update(extract(page.read_text(encoding='utf8')))
            row['fetchedAt']=datetime.fromtimestamp(page.stat().st_mtime,timezone.utc).isoformat()
        except Exception as error:
            row.update(status='failed',error=str(error));print('FAILED '+row['url']+' '+str(error),flush=True)
        if (index+1)%20==0 and not args.emit_only:
            export(rows);print(f'Progress {index+1}/{len(rows)}',flush=True)
    export(rows)
    failed=sum(row['status']!='ready' for row in rows)
    print(f'Finished: {len(rows)-failed}/{len(rows)} themes; {sum(len(r.get("entries",[])) for r in rows)} bilingual entries; {failed} unavailable',flush=True)
    return 1 if failed else 0

if __name__=='__main__':raise SystemExit(main())
