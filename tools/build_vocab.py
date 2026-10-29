#!/usr/bin/env python3
"""Build a curated French vocabulary list from Lexique 3.83.

Lexique 3.83 (New & Pallier) is a free academic lexicon of written and
spoken French. We only keep lemmas, their part of speech, gender and
frequency, and we drop function words (articles, prepositions, pronouns,
conjunctions) so the list is useful for vocabulary study, not grammar.

Source: http://www.lexique.org/databases/Lexique383/
Usage:  python tools/build_vocab.py --top 600
Output: content/vocab/candidates.json
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

KEEP_POS = {"NOM", "VER", "ADJ", "ADV"}
POS_LABEL = {"NOM": "noun", "VER": "verb", "ADJ": "adjective", "ADV": "adverb"}

# Lexique tags a few pure grammar words as adverbs; they belong in the
# grammar syllabus, not in a vocabulary deck.
GRAMMAR_WORDS = {"ne", "pas", "plus", "non", "oui", "si", "y", "en", "très", "trop"}


def cefr_bucket(rank: int) -> str:
    """Rough frequency-to-CEFR mapping; frequency rank is a decent proxy for
    how early a word is normally taught, but it is not an official list."""
    if rank <= 250:
        return "A1"
    if rank <= 600:
        return "A2"
    if rank <= 1200:
        return "B1"
    return "B2"


def clean_word(w: str) -> bool:
    if not w or len(w) < 2:
        return False
    probe = w.replace("-", "").replace("'", "").replace(" ", "")
    return probe.isalpha()


def main() -> int:
    ap = argparse.ArgumentParser(description="Extract a frequency-ranked French lemma list from Lexique 3.83.")
    ap.add_argument("--tsv", default="content/lexique/Lexique383.tsv")
    ap.add_argument("--top", type=int, default=600, help="how many lemmas to keep")
    ap.add_argument("--min-freq", type=float, default=1.0, help="minimum frequency per million words")
    ap.add_argument("--out", default="content/vocab/candidates.json")
    args = ap.parse_args()

    src = Path(args.tsv)
    if not src.exists():
        print(f"[error] missing {src}; download Lexique383.tsv first")
        return 2

    best: dict[str, dict] = {}
    total = 0
    with src.open(encoding="utf-8") as fh:
        reader = csv.DictReader(fh, delimiter="\t")
        for row in reader:
            total += 1
            if row.get("islem") != "1":
                continue
            pos = (row.get("cgram") or "").strip()
            if pos not in KEEP_POS:
                continue
            word = (row.get("ortho") or "").strip()
            if not clean_word(word):
                continue
            if word.lower() in GRAMMAR_WORDS:
                continue
            try:
                film = float(row.get("freqlemfilms2") or 0)
                book = float(row.get("freqlemlivres") or 0)
            except ValueError:
                continue
            freq = max(film, book)
            if freq < args.min_freq:
                continue
            prev = best.get(word)
            if prev and prev["freq"] >= freq:
                continue
            best[word] = {
                "w": word,
                "pos": pos,
                "posLabel": POS_LABEL[pos],
                "genre": (row.get("genre") or "").strip(),
                "freq": round(freq, 2),
            }

    ranked = sorted(best.values(), key=lambda x: -x["freq"])[: args.top]
    for i, item in enumerate(ranked, 1):
        item["rank"] = i
        item["level"] = cefr_bucket(i)

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": {
            "name": "Lexique 3.83",
            "authors": "Boris New, Christophe Pallier",
            "url": "http://www.lexique.org/databases/Lexique383/",
            "note": "Frequency per million words, max of film subtitles and books.",
        },
        "scanned_rows": total,
        "kept": len(ranked),
        "items": ranked,
    }
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"scanned {total} rows -> {len(best)} unique content lemmas -> kept top {len(ranked)}")
    print(f"wrote {out}")
    print("-" * 60)
    for item in ranked[:15]:
        g = f" ({item['genre']})" if item["genre"] else ""
        print(f"{item['rank']:3d}. {item['w']:<18} {item['posLabel']}{g:<8} {item['freq']:.0f}/M")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
