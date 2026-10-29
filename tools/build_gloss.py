#!/usr/bin/env python3
"""Build a small French -> English gloss map for the vocabulary deck.

Source: FreeDict fra-eng 0.4.1 (TEI), GPL/LGPL. Used locally only, with
attribution. We keep one short English gloss per headword, which is enough for
a tap-a-word popover; it is not a full dictionary.

Usage:
    python tools/build_gloss.py
"""

from __future__ import annotations

import argparse
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

TEI = Path("content/dict/fra-eng/fra-eng.tei")
ARCHIVE = Path("content/dict/fra-eng.src.tar.xz")
URL = "https://download.freedict.org/dictionaries/fra-eng/0.4.1/freedict-fra-eng-0.4.1.src.tar.xz"
CAND = Path("content/vocab/candidates.json")
OUT = Path("app/gloss.js")

# Function words are filtered out of the frequency list (it keeps content words),
# yet they are the ones a learner taps most. Hand-written so a tap on "le" or
# "pas" explains itself instead of saying "not in the deck".
EXTRA = {
    "le": "the", "la": "the", "les": "the",
    "un": "a / an", "une": "a / an", "des": "some / of the",
    "de": "of / from", "du": "of the", "d'": "of / from",
    "à": "to / at", "au": "to the", "aux": "to the",
    "et": "and", "ou": "or", "mais": "but", "donc": "so / therefore",
    "or": "yet / now", "ni": "nor", "car": "because",
    "que": "that / which", "qui": "who / which", "quoi": "what",
    "où": "where", "quand": "when", "comment": "how",
    "pourquoi": "why", "combien": "how much / how many",
    "je": "I", "tu": "you (informal)", "il": "he / it", "elle": "she / it",
    "on": "one / we", "nous": "we / us", "vous": "you (formal / plural)",
    "ils": "they (m.)", "elles": "they (f.)",
    "me": "me", "te": "you", "se": "himself / herself / itself",
    "lui": "him / to him", "leur": "their / to them",
    "y": "there", "en": "of it / some",
    "ne": "not (negation)", "pas": "not", "plus": "more / no longer",
    "très": "very", "tout": "all / everything", "tous": "all",
    "ce": "this / that", "cet": "this / that", "cette": "this / that", "ces": "these / those",
    "mon": "my", "ma": "my", "mes": "my",
    "ton": "your", "ta": "your", "tes": "your",
    "son": "his / her", "sa": "his / her", "ses": "his / her",
    "notre": "our", "nos": "our", "votre": "your", "vos": "your",
    "pour": "for", "par": "by", "avec": "with", "sans": "without",
    "sur": "on", "sous": "under", "dans": "in", "entre": "between",
    "chez": "at (someone's place)", "vers": "towards", "depuis": "since",
    "pendant": "during", "avant": "before", "après": "after",
    "si": "if", "comme": "like / as", "parce": "because",
    "est": "is", "sont": "are", "était": "was", "étaient": "were",
    "suis": "am", "es": "are", "sommes": "are", "êtes": "are",
    "a": "has", "ont": "have", "ai": "have", "as": "have",
    "fait": "does / makes", "va": "goes", "vais": "go",
    "peut": "can", "veux": "want", "sais": "know", "dit": "says",
    "aussi": "also", "bien": "well / indeed", "encore": "still / again",
    "déjà": "already", "toujours": "always / still", "jamais": "never / ever",
}


def ensure_tei(tei: Path) -> None:
    """Download and unpack the FreeDict source the first time it is needed."""
    if tei.exists():
        return
    import tarfile
    import urllib.request

    tei.parent.mkdir(parents=True, exist_ok=True)
    if not ARCHIVE.exists():
        print(f"downloading {URL}")
        req = urllib.request.Request(URL, headers={"User-Agent": "kwizlocal/1.0"})
        ARCHIVE.write_bytes(urllib.request.urlopen(req, timeout=60).read())
    with tarfile.open(ARCHIVE, "r:xz") as tar:
        tar.extractall(ARCHIVE.parent)


def local(tag: str) -> str:
    return tag.split("}")[-1]


def clean(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "").strip()
    return text


def parse_tei(path: Path) -> dict[str, list[str]]:
    root = ET.parse(path).getroot()
    out: dict[str, list[str]] = {}
    for entry in root.iter():
        if local(entry.tag) != "entry":
            continue
        orth = ""
        for form in entry:
            if local(form.tag) != "form":
                continue
            for node in form:
                if local(node.tag) == "orth":
                    orth = clean(node.text)
                    break
        if not orth:
            continue
        glosses: list[str] = []
        for sense in entry:
            if local(sense.tag) != "sense":
                continue
            for cit in sense.iter():
                if local(cit.tag) != "cit" or cit.get("type") != "trans":
                    continue
                for q in cit:
                    if local(q.tag) == "quote":
                        g = clean(q.text)
                        if g and g not in glosses:
                            glosses.append(g)
        if glosses:
            key = orth.lower()
            out.setdefault(key, [])
            for g in glosses:
                if g not in out[key]:
                    out[key].append(g)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tei", default=str(TEI))
    ap.add_argument("--candidates", default=str(CAND))
    ap.add_argument("--out", default=str(OUT))
    ap.add_argument("--max-gloss", type=int, default=3)
    args = ap.parse_args()

    ensure_tei(Path(args.tei))
    table = parse_tei(Path(args.tei))
    data = json.loads(Path(args.candidates).read_text(encoding="utf-8"))
    words = [it["w"] for it in data["items"]]

    gloss: dict[str, str] = {}
    for w in words:
        key = w.lower()
        hits = table.get(key)
        if not hits:
            # simple fallbacks: strip a trailing plural -s, try the stem
            for alt in (key[:-1] if key.endswith("s") else "", key[:-1] if key.endswith("e") else ""):
                if alt and table.get(alt):
                    hits = table[alt]
                    break
        if hits:
            gloss[w] = "; ".join(hits[: args.max_gloss])

    merged: dict[str, str] = {}
    merged.update(EXTRA)
    merged.update(gloss)  # dictionary gloss wins if a word is in both

    lines = [
        "/* French -> English glosses for the vocabulary popover.",
        "   Content words: FreeDict fra-eng 0.4.1 (https://freedict.org), GPL/LGPL.",
        "   Function words: hand-written. Local use only; not a full dictionary. */",
        "",
        "const GLOSS = {",
    ]
    for w, g in merged.items():
        js = g.replace("\\", "\\\\").replace('"', '\\"')
        lines.append('  %s: "%s",' % (json.dumps(w, ensure_ascii=False), js))
    lines.append("};")
    Path(args.out).write_text("\n".join(lines) + "\n", encoding="utf-8")

    covered = sum(1 for w in words if w in gloss)
    print(f"{covered}/{len(words)} words glossed -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
