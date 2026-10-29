#!/usr/bin/env python3
"""Attach English example sentences to the vocabulary list and emit app/vocab.js.

Reads content/vocab/candidates.json (built by build_vocab.py), asks the
public Tatoeba API for short French sentences containing each word that
already have an English translation, caches the results, then writes a
plain-JS data file the offline app can load.

Tatoeba sentences are CC BY 2.0 FR (https://tatoeba.org).

Usage:
    python tools/fetch_vocab_examples.py --limit-per-word 2
    python tools/fetch_vocab_examples.py --only 50      # quick trial run
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://tatoeba.org/en/api_v0/search"
UA = "kwiziq-local/0.1 (personal study; contact: local)"
TOKEN_RE = re.compile(r"[\wÀ-ÿ'-]+")

# Coarse profanity filter: Tatoeba is a general corpus and some short
# sentences are not suitable study material.
BLOCKED = {
    "baiser", "baise", "baises", "baisez", "baisent", "baisé",
    "foutre", "foutu", "foutue", "putain", "merde", "con", "conne",
    "salope", "pute", "nique", "niquer", "chier", "chiotte", "cul",
    "bite", "couille", "couilles", "enculer", "branler", "pédé", "negre",
    "bordel", "zob", "nichon", "nichons", "sucer", "suce",
}


def is_clean(text: str) -> bool:
    toks = {t.lower() for t in TOKEN_RE.findall(text)}
    return not (toks & BLOCKED)


def fetch(query: str, page: int = 1) -> dict:
    params = {
        "from": "fra",
        "to": "eng",
        "query": query,
        "sort": "relevance",
        "orphans": "no",
        "unapproved": "no",
        "page": str(page),
    }
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def eng_translations(groups) -> list[str]:
    out: list[str] = []
    for group in groups or []:
        for tr in group:
            if tr.get("lang") == "eng" and tr.get("text"):
                out.append(tr["text"].strip())
    seen: set[str] = set()
    return [x for x in out if not (x in seen or seen.add(x))]


def pick(results: list, word: str, limit: int) -> list[dict]:
    """Prefer natural 3-14 word sentences; fall back to very short ones.

    Tatoeba ranks single-word searches by relevance, which mostly surfaces
    1-2 word exclamations, so short sentences are kept as a safety net
    instead of discarding the word entirely.
    """
    low = word.lower()
    good: list[dict] = []
    short: list[dict] = []
    for r in results:
        fr = (r.get("text") or "").strip()
        if not fr:
            continue
        tokens = [t.lower() for t in TOKEN_RE.findall(fr)]
        if low not in tokens:
            continue
        n = len(tokens)
        if n > 14:
            continue
        if not is_clean(fr):
            continue
        en = eng_translations(r.get("translations"))
        if not en:
            continue
        cand = {"fr": fr, "en": en[0], "id": r.get("id")}
        if n >= 3:
            good.append(cand)
        elif n == 2:
            short.append(cand)

    picked = good[:limit]
    if len(picked) < limit:
        picked += short[: limit - len(picked)]
    return picked


def main() -> int:
    ap = argparse.ArgumentParser(description="Fetch Tatoeba example sentences for the vocabulary list.")
    ap.add_argument("--candidates", default="content/vocab/candidates.json")
    ap.add_argument("--cache", default="content/vocab/examples.json")
    ap.add_argument("--out", default="app/vocab.js")
    ap.add_argument("--limit-per-word", type=int, default=2)
    ap.add_argument("--only", type=int, default=0, help="only process the first N items (trial run)")
    ap.add_argument("--delay", type=float, default=0.8, help="seconds between requests (single-worker mode)")
    ap.add_argument("--workers", type=int, default=4, help="parallel requests; use 1 for strict politeness")
    ap.add_argument("--pages", type=int, default=2, help="how many Tatoeba result pages to scan per word")
    ap.add_argument("--refresh", action="store_true", help="ignore the cache and refetch")
    ap.add_argument("--emit-only", action="store_true", help="skip fetching and only rebuild app/vocab.js from the cache")
    args = ap.parse_args()

    cand_path = Path(args.candidates)
    if not cand_path.exists():
        print(f"[error] missing {cand_path}; run tools/build_vocab.py first")
        return 2

    data = json.loads(cand_path.read_text(encoding="utf-8"))
    items = data.get("items", [])
    if args.only:
        items = items[: args.only]

    cache_path = Path(args.cache)
    cache: dict[str, list] = {}
    if cache_path.exists() and not args.refresh:
        try:
            cache = json.loads(cache_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            cache = {}

    todo = [it for it in items if it["w"] not in cache]
    if args.emit_only:
        todo = []
    print(f"{len(items)} words, {len(todo)} to fetch, {len(cache)} cached")

    def fetch_one(word: str) -> list:
        results: list = []
        for page in range(1, args.pages + 1):
            payload = fetch(word, page)
            results.extend(payload.get("results", []))
            if len(pick(results, word, args.limit_per_word)) >= args.limit_per_word:
                break
        return pick(results, word, args.limit_per_word)

    cache_path.parent.mkdir(parents=True, exist_ok=True)
    done = 0

    if args.workers > 1 and todo:
        from concurrent.futures import ThreadPoolExecutor, as_completed

        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = {pool.submit(fetch_one, it["w"]): it["w"] for it in todo}
            for fut in as_completed(futures):
                word = futures[fut]
                try:
                    cache[word] = fut.result()
                except Exception as exc:  # noqa: BLE001
                    cache[word] = []
                    print(f"  {word}: request failed ({exc})")
                done += 1
                if done % 20 == 0:
                    cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
                    with_ex = sum(1 for it in items if cache.get(it["w"]))
                    print(f"  {done}/{len(todo)} fetched · {with_ex}/{len(items)} words with examples")
    else:
        for it in todo:
            word = it["w"]
            try:
                cache[word] = fetch_one(word)
            except Exception as exc:  # noqa: BLE001
                print(f"  {word}: request failed ({exc})")
                cache[word] = []
            done += 1
            if done % 20 == 0:
                cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
                with_ex = sum(1 for it in items if cache.get(it["w"]))
                print(f"  {done}/{len(todo)} fetched · {with_ex}/{len(items)} words with examples")
            time.sleep(args.delay)

    if not args.emit_only:
        cache_path.write_text(json.dumps(cache, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    with_ex = sum(1 for it in items if cache.get(it["w"]))
    print(f"done: {with_ex}/{len(items)} words have at least one example")

    # Emit the JS data file
    lines = [
        "/* French vocabulary, generated by tools/fetch_vocab_examples.py.",
        "   Frequency: Lexique 3.83 (New & Pallier).",
        "   Example sentences: Tatoeba, CC BY 2.0 FR. */",
        "",
        "const VOCAB = [",
    ]
    for it in items:
        ex = cache.get(it["w"], [])
        ex_js = ", ".join(
            "[\"%s\", \"%s\"]" % (e["fr"].replace('"', '\\"'), e["en"].replace('"', '\\"'))
            for e in ex
        )
        lines.append(
            '  { w: "%s", pos: "%s", g: "%s", rank: %d, level: "%s", freq: %s, ex: [%s] },'
            % (
                it["w"].replace('"', '\\"'),
                it["posLabel"],
                it.get("genre", ""),
                it["rank"],
                it.get("level", "A1"),
                it["freq"],
                ex_js,
            )
        )
    lines += [
        "];",
        "",
        "const VOCAB_BY_WORD = {};",
        "VOCAB.forEach(function (v) { VOCAB_BY_WORD[v.w] = v; });",
        "",
    ]
    out = Path(args.out)
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {out} ({len(items)} words)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
