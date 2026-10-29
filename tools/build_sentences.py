#!/usr/bin/env python3
"""Mine a large practice bank from Tatoeba sentence pairs — quality pass.

Differences from the first version:
  - Part-of-speech comes from spaCy (fr_core_news_md), not Lexique. Lexique
    labels many inflected forms as separate lemmas with wrong categories
    ("bonne" -> noun, "vole" -> noun), which produced nonsensical distractors.
  - Only NOUNs preceded by a determiner / adjective / preposition are blanked,
    so the gap is always a well-formed noun slot.
  - Distractor pool is built from POS votes over the corpus itself, not from
    a dictionary, so options are always the same category.
  - Sentences with too many proper nouns (Tatoeba's "Tom ..." lines) are dropped.
  - Every item carries a CEFR-ish level derived from sentence length.

Sources: Tatoeba (CC BY 2.0 FR) bulk exports.
Usage:   python tools/build_sentences.py --target 16000
Output:  app/sentences.js
"""

from __future__ import annotations

import argparse
import bz2
import csv
import json
import random
import re
from collections import defaultdict
from pathlib import Path

SRC = Path("content/tatoeba")
LEXIQUE = Path("content/lexique/Lexique383.tsv")
OUT = Path("app/sentences.js")

TOKEN_RE = re.compile(r"[\wÀ-ÿ'-]+")

BLOCKED = {
    "baiser", "baise", "baises", "baisez", "baisent", "baisé", "foutre", "foutu",
    "putain", "merde", "con", "conne", "salope", "pute", "nique", "chier", "cul",
    "bite", "couille", "enculer", "branler", "bordel", "zob", "nichon", "sucer",
    "suce", "pédé", "nègre", "viol", "tuer", "tue", "tué", "tués", "tuée", "tuées",
    "mourir", "mort", "morte", "sang", "guerre", "sauvage", "sauvages",
}

TAG_RULES = [
    ("negation", re.compile(r"\bne\b[^.!?]*\b(pas|plus|jamais|rien|personne|aucun|aucune)\b", re.I)),
    ("question", re.compile(r"\?$|^(est-ce|qu'|qui|que|quoi|où|quand|comment|pourquoi|combien)\b", re.I)),
    ("relative", re.compile(r"\b(qui|dont|lequel|laquelle|lesquels|lesquelles)\b|\bce (qui|que)\b", re.I)),
    ("conditionnel", re.compile(r"\b(serait|serais|aurait|aurais|irait|irais|ferait|ferais|pourrait|pourrais|voudrait|voudrais|aimerait|aimerais)\b", re.I)),
    ("subjonctif", re.compile(r"\b(qu'|que\s+(je|tu|il|elle|on|nous|vous|ils|elles)\b)[^.!?]*\b(sois|soit|soient|aie|aies|ait|aient|aille|ailles|fasse|fasses|puisse|puisses|vienne|viennes)\b", re.I)),
    ("passe_compose", re.compile(r"\b(ai|as|a|avons|avez|ont|suis|es|est|sommes|êtes|sont)\s+[\wÀ-ÿ]+(é|ée|és|ées|i|ie|is|ies|it|u|ue|us|ues|ut)\b", re.I)),
    ("imparfait", re.compile(r"\b[\wÀ-ÿ]+(ais|ait|ions|iez|aient)\b", re.I)),
    ("futur", re.compile(r"\b[\wÀ-ÿ]+(rai|ras|ra|rons|rez|ront)\b", re.I)),
    ("prepositions", re.compile(r"\b(à|au|aux|de|du|des|dans|sur|sous|avec|pour|par|chez|entre|vers|depuis|pendant|avant|après|contre|sans)\b", re.I)),
    ("articles", re.compile(r"\b(le|la|les|un|une|des)\b", re.I)),
    ("pronouns", re.compile(r"\b(je|tu|il|elle|on|nous|vous|ils|elles|me|te|se|lui|leur|y|en)\b", re.I)),
    ("adverbs", re.compile(r"\b[\wÀ-ÿ]+ment\b", re.I)),
]

# Function words that must not be blanked even if tagged as nouns.
STOP_NOUNS = {"chose", "truc", "gens", "personne", "monde", "fois", "coup"}


def load_sentences(path: Path, wanted: set[str] | None = None) -> dict[str, str]:
    out: dict[str, str] = {}
    with bz2.open(path, "rt", encoding="utf-8") as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 3:
                continue
            sid, _lang, text = parts[0], parts[1], parts[2]
            if wanted is not None and sid not in wanted:
                continue
            out[sid] = text
    return out


def load_links(path: Path) -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    with bz2.open(path, "rt", encoding="utf-8") as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) >= 2:
                pairs.append((parts[0], parts[1]))
    return pairs


def tag_of(fr: str) -> str:
    """Regex fallback, used only when spaCy gives us nothing."""
    for name, rx in TAG_RULES:
        if rx.search(fr):
            return name
    return "general"


def tag_of_doc(doc) -> str:
    """Tag from spaCy morphology — far more reliable than surface regex.

    Key win: Mood=Cnd catches conditionnel ("devrais"), Tense=Past catches the
    passé simple ("entra") which the old "ra" regex misread as futur, and
    Mood=Sub catches the subjunctive.
    """
    moods: set[str] = set()
    tenses: set[str] = set()
    has_ne = False
    has_question = False

    for tok in doc:
        low = tok.text.lower()
        if low in ("ne", "n'"):
            has_ne = True
        if tok.text == "?":
            has_question = True
        if tok.pos_ in ("VERB", "AUX"):
            m = tok.morph
            moods.update(m.get("Mood") or [])
            tenses.update(m.get("Tense") or [])

    if has_ne and re.search(r"\b(pas|plus|jamais|rien|personne|aucun|aucune|nulle part|guère|point)\b", doc.text, re.I):
        return "negation"
    if has_question:
        return "question"
    if "Cnd" in moods:
        return "conditionnel"
    if "Sub" in moods:
        return "subjonctif"
    if "Fut" in tenses:
        return "futur"
    # passé composé only: auxiliary tagged aux:tense, not aux:pass (passive voice)
    for tok in doc:
        if tok.pos_ == "VERB" and "Part" in (tok.morph.get("VerbForm") or []):
            if any(c.dep_ == "aux:tense" for c in tok.children):
                return "passe_compose"
    if re.search(r"\b(qui|dont|lequel|laquelle|lesquels|lesquelles)\b|\bce (qui|que)\b", doc.text, re.I):
        return "relative"
    if re.search(r"\b(à|au|aux|de|du|des|dans|sur|sous|avec|pour|par|chez|entre|vers|depuis|pendant|avant|après|contre|sans)\b", doc.text, re.I):
        return "prepositions"
    if re.search(r"\b(le|la|les|un|une|des)\b", doc.text, re.I):
        return "articles"
    if re.search(r"\b(je|tu|il|elle|on|nous|vous|ils|elles)\b", doc.text, re.I):
        return "pronouns"
    if re.search(r"\b[\wÀ-ÿ]+ment\b", doc.text, re.I):
        return "adverbs"
    return "general"


def load_freq(path: Path) -> dict[str, float]:
    """Surface form -> frequency per million.

    Deliberately does NOT filter on islem: sentences contain inflected forms
    ("vais", "mangé") and we need their frequency too, otherwise every verb
    form looks like a rare word.
    """
    out: dict[str, float] = {}
    if not path.exists():
        return out
    with path.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh, delimiter="\t"):
            w = (row.get("ortho") or "").strip().lower()
            if not w:
                continue
            try:
                f = max(float(row.get("freqfilms2") or 0), float(row.get("freqlivres") or 0))
            except ValueError:
                continue
            if f > out.get(w, 0):
                out[w] = f
    return out


def looks_broken(fr: str) -> bool:
    """Catch the most common Tatoeba typos. Deliberately conservative:
    only patterns that are unambiguously wrong in French."""
    low = fr.lower()
    checks = [
        r"\b(il|elle|on|ce|qui) à\b",          # "il à" -> should be "a"
        r"\bsa (est|était|a été)\b",           # "sa est" -> "ça est"
        r"\bou est\b",                         # "ou est" -> "où est"
        r"\b(\w+) \1\b",                       # doubled word
        r"\bde le\b",                          # should be "du"
        r"\bde les\b",                         # should be "des"
        r"\bà le\b",                           # should be "au"
        r"\bà les\b",                          # should be "aux"
        r"\bje (\w+)ons\b",                    # "je parlons"
        r"\bnous (\w+)e\b\s*$",                # rough: "nous parle"
        # French puts a space BEFORE ? ! : ; so only comma/period are errors.
        r"\s[,.]",
        r"[,.;:!?]{2,}",                       # doubled punctuation
    ]
    return any(re.search(p, low) for p in checks)


def word_freq(w: str, freq: dict[str, float]) -> float:
    """Frequency lookup that survives elision (l'école -> école) and hyphens."""
    f = freq.get(w, 0)
    if f:
        return f
    if "'" in w:
        f = freq.get(w.split("'", 1)[1], 0)
        if f:
            return f
    if "-" in w:
        return max((freq.get(p, 0) for p in w.split("-")), default=0)
    return 0


def level_of(fr: str, tag: str, freq: dict[str, float]) -> str:
    """Length + lexical rarity, bumped when the grammar itself is advanced."""
    words = [w.lower() for w in TOKEN_RE.findall(fr)]
    n = len(words)
    scores = [word_freq(w, freq) for w in words]
    rare = sum(1 for f in scores if f < 10)
    very_rare = sum(1 for f in scores if f < 1)

    if n <= 7 and rare == 0:
        lvl = "A1"
    elif n <= 9 and rare <= 1 and very_rare == 0:
        lvl = "A2"
    elif n <= 12 and rare <= 3:
        lvl = "B1"
    else:
        lvl = "B2"

    if tag in ("subjonctif", "conditionnel", "relative") and lvl in ("A1", "A2"):
        lvl = "B1"
    if tag == "subjonctif" and lvl == "B1" and n >= 10:
        lvl = "B2"
    return lvl


def quality_ok(fr: str, en: str) -> bool:
    fw = fr.split()
    ew = en.split()
    if not (5 <= len(fw) <= 14):
        return False
    if not (4 <= len(ew) <= 16):
        return False
    ratio = len(fw) / max(1, len(ew))
    if not (0.55 <= ratio <= 1.95):
        return False
    low = fr.lower()
    if "tatoeba" in low or "http" in low:
        return False
    # Tatoeba's "Tom ..." filler sentences teach nothing.
    if re.search(r"\bTom\b", fr) or re.search(r"\bTom\b", en):
        return False
    if len(re.findall(r"\d", fr)) > 2:
        return False
    if not fr[0].isupper():
        return False
    toks = {t.lower() for t in TOKEN_RE.findall(fr)}
    if toks & BLOCKED:
        return False
    if looks_broken(fr):
        return False
    if not re.search(r"[àâçéèêëîïôûùüÿœ]", low) and len(fw) < 8:
        return False
    return True


def annotate(pairs: list[tuple[str, str]], nlp):
    """One pass: collect POS votes, blankable noun slots, and a grammar tag."""
    pos_votes: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    annotated: list[tuple[str, str, list[tuple[int, int, str]], str]] = []

    texts = [fr for fr, _en in pairs]
    for (fr, en), doc in zip(pairs, nlp.pipe(texts, batch_size=256)):
        tag = tag_of_doc(doc)
        proper = 0
        blanks: list[tuple[int, int, str]] = []
        for tok in doc:
            if tok.pos_ == "PROPN":
                proper += 1
            if not tok.is_alpha:
                continue
            w = tok.text.lower()
            if tok.pos_ in ("NOUN", "VERB", "ADJ", "ADV"):
                pos_votes[w][tok.pos_] += 1
            if tok.pos_ != "NOUN" or len(w) < 4 or w in STOP_NOUNS:
                continue
            if tok.i == 0:
                continue
            prev = doc[tok.i - 1]
            if prev.pos_ not in ("DET", "ADJ", "ADP"):
                continue
            blanks.append((tok.idx, tok.idx + len(tok.text), w))
        # Skip sentences that are mostly names — Tatoeba is full of "Tom ..." lines.
        if proper >= 2:
            continue
        if blanks:
            annotated.append((fr, en, blanks, tag))
    return annotated, pos_votes


def build_pool(pos_votes: dict[str, dict[str, int]], min_share: float = 0.65, min_votes: int = 4):
    """Word -> dominant POS, only when the vote is clear."""
    pool: dict[str, list[str]] = defaultdict(list)
    for w, votes in pos_votes.items():
        total = sum(votes.values())
        if total < min_votes:
            continue
        pos, cnt = max(votes.items(), key=lambda x: x[1])
        if cnt / total < min_share:
            continue
        if len(w) < 4 or not w.isalpha():
            continue
        pool[pos].append(w)
    return pool


def build_similarity_table(nouns: list[str], nlp, topk: int = 60) -> dict[str, list[tuple[str, float]]]:
    """Precompute nearest neighbours for each noun from spaCy's word vectors.

    This is what makes the distractors hard: instead of picking any noun of a
    similar length, we pick nouns from the same semantic field.
    """
    import numpy as np

    words, vecs = [], []
    for w in nouns:
        v = nlp.vocab[w]
        if not v.has_vector or v.vector_norm == 0:
            continue
        words.append(w)
        vecs.append(v.vector / v.vector_norm)
    if not vecs:
        return {}
    mat = np.array(vecs, dtype="float32")
    table: dict[str, list[tuple[str, float]]] = {}
    for i, w in enumerate(words):
        sims = mat @ mat[i]
        order = np.argsort(-sims)[: topk + 1]
        table[w] = [(words[j], float(sims[j])) for j in order if j != i]
    return table


def distractors_for(word: str, table: dict, used: set[str], n: int = 3) -> list[str]:
    """Same semantic field, similar length, not already in the sentence."""
    neighbours = table.get(word) or []
    band = [w for w, s in neighbours
            if 0.30 <= s <= 0.82 and w not in used and len(w) >= 4
            and abs(len(w) - len(word)) <= 4]
    if len(band) < n:
        band += [w for w, s in neighbours
                 if 0.16 <= s < 0.30 and w not in used and len(w) >= 4
                 and abs(len(w) - len(word)) <= 4 and w not in band]
    if len(band) < n:
        return []
    return band[:n]


def main() -> int:
    ap = argparse.ArgumentParser(description="Mine a quality sentence bank from Tatoeba.")
    ap.add_argument("--target", type=int, default=16000)
    ap.add_argument("--seed", type=int, default=11)
    ap.add_argument("--order-ratio", type=float, default=0.3, help="share of word-order items")
    args = ap.parse_args()

    random.seed(args.seed)

    print("loading links…")
    links = load_links(SRC / "fra-eng_links.tsv.bz2")
    print(f"  {len(links)} fra-eng links")

    print("loading French sentences…")
    fra = load_sentences(SRC / "fra_sentences.tsv.bz2")
    print(f"  {len(fra)} French sentences")

    wanted_eng = {b for a, b in links if a in fra}
    print(f"loading English sentences (need {len(wanted_eng)})…")
    eng = load_sentences(SRC / "eng_sentences.tsv.bz2", wanted_eng)
    print(f"  {len(eng)} English sentences")

    by_fr: dict[str, str] = {}
    for a, b in links:
        if a not in fra or b not in eng:
            continue
        fr, en = fra[a].strip(), eng[b].strip()
        if not quality_ok(fr, en):
            continue
        prev = by_fr.get(fr)
        if prev is None or len(en) < len(prev):
            by_fr[fr] = en
    print(f"  {len(by_fr)} clean pairs")

    pairs = list(by_fr.items())
    random.shuffle(pairs)
    # Annotating everything is wasteful; 120k pairs is plenty for a 16k bank.
    pairs = pairs[:120000]
    print(f"annotating {len(pairs)} sentences with spaCy…")

    import spacy

    nlp = spacy.load("fr_core_news_md", disable=["ner", "lemmatizer", "senter"])
    annotated, pos_votes = annotate(pairs, nlp)
    print(f"  {len(annotated)} sentences with a blankable noun")

    pool = build_pool(pos_votes)
    print(f"  distractor pool: " + ", ".join(f"{k}={len(v)}" for k, v in sorted(pool.items())))

    print("building semantic neighbour table…")
    sim_table = build_similarity_table(pool["NOUN"], nlp)
    print(f"  {len(sim_table)} nouns have vectors")

    print("loading frequency table…")
    freq = load_freq(LEXIQUE)
    print(f"  {len(freq)} lemmas")

    # Group by tag, quota per tag so rare grammar keeps a usable count.
    by_tag: dict[str, list] = defaultdict(list)
    for fr, en, blanks, tag in annotated:
        by_tag[tag].append((fr, en, blanks))

    num_tags = max(1, len(by_tag))
    per_tag = max(150, args.target // num_tags)
    print(f"  {num_tags} tags, quota {per_tag} each")

    items = []
    for tag in sorted(by_tag):
        bucket = by_tag[tag]
        random.shuffle(bucket)
        made = 0
        for fr, en, blanks in bucket:
            if made >= per_tag:
                break
            lvl = level_of(fr, tag, freq)
            make_order = random.random() < args.order_ratio

            if make_order:
                toks = fr.split()
                if len(toks) < 5 or len(toks) > 12:
                    continue
                shuffled = toks[:]
                random.shuffle(shuffled)
                if shuffled == toks:
                    continue
                items.append([fr, en, tag, None, None, "order", lvl])
                made += 1
                continue

            start, end, word = blanks[0]
            used = {t.lower() for t in TOKEN_RE.findall(fr)}
            dist = distractors_for(word, sim_table, used)
            if len(dist) < 3:
                continue
            opts = [word] + dist
            random.shuffle(opts)
            items.append([fr, en, tag, word, opts, "gap", lvl])
            made += 1

    counts: dict[str, int] = defaultdict(int)
    for it in items:
        counts[it[2]] += 1
    levels: dict[str, int] = defaultdict(int)
    for it in items:
        levels[it[6]] += 1

    lines = [
        "/* Sentence practice bank, generated by tools/build_sentences.py.",
        "   French sentences and English translations from Tatoeba, CC BY 2.0 FR.",
        "   POS tagging by spaCy fr_core_news_md.",
        "   Item shape: [fr, en, tag, blank, options, type, level]",
        "   type \"gap\" -> fill the blank; type \"order\" -> rebuild the sentence. */",
        "",
        "const SENTENCES = [",
    ]
    for fr, en, tag, blank, opts, typ, lvl in items:
        if typ == "gap":
            opts_js = "[" + ", ".join('"%s"' % o.replace('"', '\\"') for o in opts) + "]"
            lines.append(
                '  ["%s", "%s", "%s", "%s", %s, "gap", "%s"],'
                % (fr.replace('"', '\\"'), en.replace('"', '\\"'), tag, blank, opts_js, lvl)
            )
        else:
            lines.append(
                '  ["%s", "%s", "%s", null, null, "order", "%s"],'
                % (fr.replace('"', '\\"'), en.replace('"', '\\"'), tag, lvl)
            )
    lines += ["];", ""]

    OUT.write_text("\n".join(lines), encoding="utf-8")
    size_kb = OUT.stat().st_size // 1024
    print(f"\nwrote {OUT} ({len(items)} items, {size_kb} KB)")
    print("by tag:", dict(sorted(counts.items(), key=lambda x: -x[1])))
    print("by level:", dict(sorted(levels.items())))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
