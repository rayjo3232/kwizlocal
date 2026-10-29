#!/usr/bin/env python3
"""按句型从 Tatoeba 检索候选例句（法语 + 中文翻译）。

只做「候选收集」，不自动入库：例句是否贴题、翻译是否自然，必须人工判断。

用法：
    python tools/fetch_tatoeba.py --query "n'ai pas de" --limit 20
    python tools/fetch_tatoeba.py --query "est partie" --out content/candidates/pc_etre.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

API = "https://tatoeba.org/en/api_v0/search"
UA = "kwiziq-local/0.1 (content research; contact: local)"


def fetch(query: str, to_lang: str, limit: int, page: int = 1) -> dict:
    params = {
        "from": "fra",
        "to": to_lang,
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


def flatten_translations(groups: list, lang: str) -> list[str]:
    out: list[str] = []
    for group in groups or []:
        for tr in group:
            if tr.get("lang") == lang and tr.get("text"):
                out.append(tr["text"])
    # 去重，保持顺序
    seen = set()
    return [x for x in out if not (x in seen or seen.add(x))]


def word_count(text: str) -> int:
    return len(re.findall(r"[\wÀ-ÿ'-]+", text))


def normalize(cand: dict, to_lang: str) -> dict:
    return {
        "tatoeba_id": cand.get("id"),
        "fr": cand.get("text", "").strip(),
        "zh": flatten_translations(cand.get("translations"), to_lang),
        "words": word_count(cand.get("text", "")),
        "license": cand.get("license"),
        "contributor": (cand.get("user") or {}).get("username"),
        "has_audio": bool(cand.get("audios")),
        "audio_license": "unknown",  # API 不返回音频许可，禁止直接使用
        "url": f"https://tatoeba.org/en/sentences/show/{cand.get('id')}",
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Fetch French example sentences with Chinese translations from Tatoeba.")
    ap.add_argument("--query", required=True, help="法语关键词或句型，如 \"n'ai pas de\"")
    ap.add_argument("--to", default="cmn", help="目标翻译语言（默认 cmn 中文）")
    ap.add_argument("--limit", type=int, default=20, help="最多保留多少条")
    ap.add_argument("--min-words", type=int, default=3)
    ap.add_argument("--max-words", type=int, default=14)
    ap.add_argument("--page", type=int, default=1)
    ap.add_argument("--require-zh", action="store_true", default=True, help="只保留有目标语言翻译的句子")
    ap.add_argument("--out", help="输出 JSON 路径（默认 content/candidates/<slug>.json）")
    ap.add_argument("--slug", help="输出文件名（不含扩展名），默认由 query 生成")
    args = ap.parse_args()

    try:
        data = fetch(args.query, args.to, args.limit, args.page)
    except Exception as exc:  # noqa: BLE001
        print(f"[error] 请求 Tatoeba 失败：{exc}", file=sys.stderr)
        return 2

    raw = data.get("results", [])
    total = (data.get("paging") or {}).get("Sentences", {}).get("count")

    candidates = []
    for item in raw:
        c = normalize(item, args.to)
        if args.require_zh and not c["zh"]:
            continue
        if not (args.min_words <= c["words"] <= args.max_words):
            continue
        candidates.append(c)
        if len(candidates) >= args.limit:
            break

    print(f"query={args.query!r}  total={total}  kept={len(candidates)}")
    print("-" * 72)
    for i, c in enumerate(candidates, 1):
        zh = c["zh"][0] if c["zh"] else "—"
        audio = "A" if c["has_audio"] else "-"
        print(f"{i:2d}. [{audio}] {c['fr']}")
        print(f"          {zh}   (#{c['tatoeba_id']}, {c['words']}w)")

    slug = args.slug or re.sub(r"[^a-z0-9]+", "_", args.query.lower()).strip("_") or "query"
    out_path = Path(args.out) if args.out else Path("content/candidates") / f"{slug}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "query": args.query,
        "to": args.to,
        "fetched_at": date.today().isoformat(),
        "source": {
            "id": "tatoeba",
            "license": "CC BY 2.0 FR",
            "url": "https://tatoeba.org",
            "note": "例句可改写使用，需署名；音频许可逐条不同，禁止直接使用。",
        },
        "total_matches": total,
        "candidates": candidates,
    }
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("-" * 72)
    print(f"已写入 {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
