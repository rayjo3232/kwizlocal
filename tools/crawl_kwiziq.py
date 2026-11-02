#!/usr/bin/env python3
"""Archive the user-authorized public grammar directory, not private quiz APIs.

Install: python -m pip install -r tools/requirements-crawl.txt
Run: python tools/crawl_kwiziq.py --delay 1
Raw responses stay in ignored .dev/kwiziq; exported text is deployable offline.
The cache is resumable; --emit-only rebuilds without network access.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / '.dev/python-libs'))
from bs4 import BeautifulSoup  # noqa: E402

BASE = 'https://french.kwiziq.com'
DIRECTORY = BASE + '/revision/grammar'
UA = 'KwizLocal/1.0 (user-authorized personal study archive)'
CACHE = ROOT / '.dev/kwiziq'
OUTPUT = ROOT / 'app/kwiziq-lessons.js'
ALLOWED = {'p','div','span','h2','h3','h4','h5','strong','b','em','i','u','s','sub','sup','ul','ol','li','table','thead','tbody','tr','th','td','a','br','hr','blockquote'}

def request(url: str) -> bytes:
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=45) as response:
        if not response.headers.get('Content-Type', '').startswith(('text/', 'application/xhtml')):
            raise ValueError('Unexpected content type')
        return response.read()

def directory(html: str) -> list[dict]:
    soup = BeautifulSoup(html, 'html.parser')
    rows, seen = [], set()
    level = category = None
    for li in soup.select('ul.list-style li'):
        heading = li.find('h4')
        if heading:
            match = re.match(r'^(A0|A1|A2|B1|B2|C1|C2):\s*(.+)$', heading.get_text(' ', strip=True))
            if match:
                level, category = match.groups()
        anchor = li.find('a', href=True)
        if not anchor or not level:
            continue
        url = urllib.parse.urljoin(BASE, anchor['href']).split('#')[0]
        if not url.startswith(BASE + '/revision/grammar/') or url in seen:
            continue
        seen.add(url)
        rows.append({'id': hashlib.sha256(url.encode()).hexdigest()[:16], 'title': anchor.get_text(' ', strip=True), 'level': level, 'category': category, 'url': url, 'status': 'pending'})
    if not rows:
        raise ValueError('Grammar directory selector returned no lessons')
    return rows

def clean(fragment) -> str:
    # Remote HTML is data. Remove execution, forms, trackers and marketing.
    fragment = BeautifulSoup(str(fragment), 'html.parser')
    for node in fragment.select('script,style,iframe,object,embed,svg,form,input,button,audio,video,source,.audio-player,.sticky,.banner-cta,.video-wrapper,[data-popup],[data-trk-cat*="NoBotContentPanel"]'):
        node.decompose()
    for node in list(fragment.find_all(True)):
        if node.name == 'img':
            alt = node.get('alt', '').strip()
            url = urllib.parse.urljoin(BASE, node.get('src', ''))
            link = fragment.new_tag('a', href=url)
            link.string = '图示（需联网）' + (': ' + alt if alt else '')
            node.replace_with(link)
    for node in list(fragment.find_all(True)):
        if node.name not in ALLOWED:
            node.unwrap()
            continue
        attrs = {}
        old_classes = node.get('class', [])
        classes = []
        for source, target in [('text-example','source-example'),('text-panel--note','source-note'),('text-panel--tip','source-note'),('txt--lang-native','source-native'),('txt--lang-foreign','source-foreign')]:
            if source in old_classes:
                classes.append(target)
        if classes:
            attrs['class'] = classes
        if node.name in {'td','th'}:
            for key in ['colspan','rowspan']:
                if str(node.get(key, '')).isdigit():
                    attrs[key] = str(min(30, max(1, int(node[key]))))
        if node.name == 'a':
            url = urllib.parse.urljoin(BASE, node.get('href', ''))
            if urllib.parse.urlsplit(url).scheme == 'https':
                attrs.update(href=url, target='_blank', rel='noopener noreferrer')
        node.attrs = attrs
    return str(fragment)

def extract(html: str) -> dict:
    soup = BeautifulSoup(html, 'html.parser')
    main = soup.select_one('.main-column')
    article = main.select_one('.article') if main else None
    h1 = main.find('h1') if main else None
    if article is None or h1 is None or len(article.get_text(' ', strip=True)) < 120:
        raise ValueError('No complete public lesson article; login or page structure may differ')
    quiz = main.select_one('#kwiz-app')
    author = main.select_one('.content-meta__author')
    updated = main.select_one('.content-meta__date')
    examples = []
    for example in main.select('.text-example'):
        native, foreign = example.select_one('.txt--lang-native'), example.select_one('.txt--lang-foreign')
        if native and foreign:
            pair = [native.get_text(' ', strip=True), foreign.get_text(' ', strip=True)]
            if pair not in examples:
                examples.append(pair)
    related = []
    aside = soup.select_one('.aside-column')
    if aside:
        related = [{'title': a.get_text(' ', strip=True), 'url': urllib.parse.urljoin(BASE, a['href'])} for a in aside.select('a[href]') if '/revision/grammar/' in a['href']]
    body = clean(article)
    resources = main.select_one('.callout--lesson-examples')
    if resources:
        body += clean(resources)
    text = BeautifulSoup(body, 'html.parser').get_text(' ', strip=True)
    if len(text) < 120:
        raise ValueError('Sanitized lesson is too short')
    return {'status': 'ready', 'title': h1.get_text(' ', strip=True), 'html': body, 'text': text, 'examples': examples, 'related': related, 'sourceLessonId': quiz.get('data-kwizkey') if quiz else None, 'author': author.get_text(' ', strip=True) if author else '', 'sourceUpdated': updated.get_text(' ', strip=True) if updated else '', 'fetchedAt': datetime.now(timezone.utc).isoformat(), 'rawSha256': hashlib.sha256(html.encode()).hexdigest()}

def export(rows: list[dict]) -> None:
    # Internal links point to the offline copy only when it was actually imported.
    urls = {r['url']: r['id'] for r in rows if r['status'] == 'ready'}
    ids = {r['sourceLessonId']: r['id'] for r in rows if r.get('sourceLessonId') and r['status'] == 'ready'}
    for row in rows:
        if row['status'] != 'ready':
            continue
        soup = BeautifulSoup(row['html'], 'html.parser')
        for anchor in soup.select('a[href]'):
            url = anchor['href'].split('#')[0]
            match = re.search(r'/my-languages/french/(?:view|review)/(\d+)', url, re.I)
            local_id = urls.get(url) or (ids.get(match.group(1)) if match else None)
            if local_id:
                anchor['href'] = '#/source/' + local_id
                anchor.attrs.pop('target', None)
                anchor.attrs.pop('rel', None)
        row['html'] = str(soup)
    payload = {'schemaVersion': 1, 'source': DIRECTORY, 'attribution': 'KwizIQ Ltd and credited authors. Imported under the user-reported full authorization for personal study.', 'generatedAt': datetime.now(timezone.utc).isoformat(), 'total': len(rows), 'imported': sum(r['status'] == 'ready' for r in rows), 'lessons': rows}
    temporary = OUTPUT.with_suffix('.js.tmp')
    temporary.write_text('/* User-authorized offline KwizIQ grammar archive. */\nglobalThis.KWIZIQ_ARCHIVE = ' + json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf8')
    temporary.replace(OUTPUT)

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--delay', type=float, default=1.0)
    parser.add_argument('--limit', type=int, default=0)
    parser.add_argument('--emit-only', action='store_true')
    args = parser.parse_args()
    CACHE.mkdir(parents=True, exist_ok=True)
    (CACHE / 'pages').mkdir(exist_ok=True)
    if not args.emit_only:
        for name, url in [('robots', BASE + '/robots.txt'), ('directory', DIRECTORY)]:
            file = CACHE / (name + '.html')
            if not file.exists():
                file.write_bytes(request(url))
    robots = urllib.robotparser.RobotFileParser()
    robots.parse((CACHE / 'robots.html').read_text(encoding='utf8').splitlines())
    rows = directory((CACHE / 'directory.html').read_text(encoding='utf8'))
    wait = max(1.0, args.delay, robots.crawl_delay(UA) or 0)
    if args.limit:
        rows = rows[:args.limit]
    print(f'Directory: {len(rows)} lessons; serial request delay {wait}s', flush=True)
    last_request = time.monotonic()
    for index, row in enumerate(rows):
        file = CACHE / 'pages' / (row['id'] + '.html')
        try:
            if not robots.can_fetch(UA, row['url']):
                raise ValueError('Disallowed by robots.txt for this crawler')
            if not file.exists():
                if args.emit_only:
                    continue
                for attempt in range(3):
                    time.sleep(max(0, wait - (time.monotonic() - last_request)))
                    last_request = time.monotonic()
                    try:
                        file.write_bytes(request(row['url']))
                        break
                    except urllib.error.HTTPError as error:
                        if error.code in (401,403):
                            raise
                        if attempt == 2:
                            raise
                        time.sleep(max(5, int(error.headers.get('Retry-After', '5'))))
                    except (TimeoutError, urllib.error.URLError):
                        if attempt == 2:
                            raise
                        time.sleep(5)
            row.update(extract(file.read_text(encoding='utf8')))
            row['fetchedAt'] = datetime.fromtimestamp(file.stat().st_mtime, timezone.utc).isoformat()
        except Exception as error:
            row.update(status='failed', error=str(error))
            print(f"FAILED {index + 1}: {row['url']} {error}", flush=True)
        if (index + 1) % 20 == 0 and not args.emit_only:
            export(rows)
            print(f'Progress {index + 1}/{len(rows)}; ready {sum(r["status"] == "ready" for r in rows)}', flush=True)
    export(rows)
    failed = [r for r in rows if r['status'] != 'ready']
    print(f'Finished: {len(rows)-len(failed)}/{len(rows)} imported; {len(failed)} unavailable; {OUTPUT.stat().st_size:,} bytes', flush=True)
    return 1 if failed else 0

if __name__ == '__main__':
    raise SystemExit(main())
