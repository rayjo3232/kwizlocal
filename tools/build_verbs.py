#!/usr/bin/env python3
"""Generate app/verbs.js: conjugation tables for the core French verbs.

Uses verbecc (LGPL-3.0) to conjugate. Only the teaching-relevant tenses are
kept, and the subject pronoun is stripped so the table stores bare forms
("parle", "ai parlé") that can be reused for drills.

Usage:
    python tools/build_verbs.py
Output:
    app/verbs.js
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path

logging.disable(logging.CRITICAL)

from verbecc import CompleteConjugator  # noqa: E402

# (infinitive, English gloss, group)
VERBS = [
    ("être", "to be", 3), ("avoir", "to have", 3), ("aller", "to go", 3),
    ("faire", "to do / make", 3), ("dire", "to say", 3), ("pouvoir", "to be able to", 3),
    ("vouloir", "to want", 3), ("savoir", "to know", 3), ("voir", "to see", 3),
    ("devoir", "to have to", 3), ("venir", "to come", 3), ("prendre", "to take", 3),
    ("croire", "to believe", 3), ("aimer", "to like / love", 1), ("falloir", "to be necessary", 3),
    ("passer", "to pass / spend", 1), ("penser", "to think", 1), ("attendre", "to wait", 3),
    ("trouver", "to find", 1), ("laisser", "to leave / let", 1), ("arriver", "to arrive", 1),
    ("donner", "to give", 1), ("regarder", "to look at", 1), ("appeler", "to call", 1),
    ("partir", "to leave", 3), ("mettre", "to put", 3), ("rester", "to stay", 1),
    ("demander", "to ask", 1), ("connaître", "to know (someone)", 3), ("mourir", "to die", 3),
    ("comprendre", "to understand", 3), ("sortir", "to go out", 3), ("tenir", "to hold", 3),
    ("entendre", "to hear", 3), ("chercher", "to look for", 1), ("aider", "to help", 1),
    ("essayer", "to try", 1), ("revenir", "to come back", 3), ("plaire", "to please", 3),
    ("sembler", "to seem", 1), ("jouer", "to play", 1), ("finir", "to finish", 2),
    ("perdre", "to lose", 3), ("devenir", "to become", 3), ("vivre", "to live", 3),
    ("ouvrir", "to open", 3), ("oublier", "to forget", 1), ("travailler", "to work", 1),
    ("manger", "to eat", 1), ("répondre", "to answer", 3), ("entrer", "to enter", 1),
    ("tomber", "to fall", 1), ("commencer", "to start", 1), ("payer", "to pay", 1),
    ("changer", "to change", 1), ("monter", "to go up", 1), ("acheter", "to buy", 1),
    ("boire", "to drink", 3), ("lire", "to read", 3), ("écrire", "to write", 3),
    ("dormir", "to sleep", 3), ("courir", "to run", 3), ("recevoir", "to receive", 3),
    ("offrir", "to offer", 3), ("servir", "to serve", 3), ("conduire", "to drive", 3),
    ("rire", "to laugh", 3), ("naître", "to be born", 3), ("descendre", "to go down", 3),
    ("parler", "to speak", 1), ("écouter", "to listen", 1), ("habiter", "to live (somewhere)", 1),
    ("étudier", "to study", 1), ("vendre", "to sell", 3), ("rendre", "to give back", 3),
]

# Display label -> (mood, tense) in verbecc's output
TENSES = [
    ("présent", ("indicatif", "présent")),
    ("passé composé", ("indicatif", "passé-composé")),
    ("imparfait", ("indicatif", "imparfait")),
    ("futur simple", ("indicatif", "futur-simple")),
    ("plus-que-parfait", ("indicatif", "plus-que-parfait")),
    ("conditionnel", ("conditionnel", "présent")),
    ("subjonctif", ("subjonctif", "présent")),
]

PRONOUN_RE = re.compile(
    r"^(je|tu|il|elle|on|nous|vous|ils|elles|j|qu|m|t|s|l|n|d)'\s*|"
    r"^(je|tu|il|elle|on|nous|vous|ils|elles)\s+",
    re.IGNORECASE,
)


def strip_pronoun(form: str) -> str:
    out = PRONOUN_RE.sub("", form.strip(), count=1)
    return out.strip()


def six_persons(entries: list) -> list[str]:
    """Collapse verbecc's per-gender variants down to one form per person.

    verbecc emits several entries for the same person (masculine/feminine
    participles, alternative spellings). We bucket by (number, person) and
    keep the shortest variant, which is the masculine/default form.
    """
    if not entries:
        return []
    buckets: dict[tuple[str, str], str] = {}
    for e in entries:
        forms = [f for f in (e.get("c") or []) if f]
        if not forms:
            continue
        cleaned = [strip_pronoun(f) for f in forms]
        cleaned = [c for c in cleaned if c]
        if not cleaned:
            continue
        key = (str(e.get("n")), str(e.get("p")))
        best = min(cleaned, key=len)
        if key not in buckets or len(best) < len(buckets[key]):
            buckets[key] = best
    order = [("s", "1"), ("s", "2"), ("s", "3"), ("p", "1"), ("p", "2"), ("p", "3")]
    out = [buckets[k] for k in order if k in buckets]
    return out if len(out) == 6 else []


def main() -> int:
    conj = CompleteConjugator(lang="fr")
    rows = []
    missing = []

    for inf, en, group in VERBS:
        try:
            data = json.loads(conj.conjugate(inf).to_json())
        except Exception:  # noqa: BLE001
            missing.append(inf)
            continue
        moods = data.get("moods", {})
        tenses = {}
        for label, (mood, tense) in TENSES:
            entries = (moods.get(mood) or {}).get(tense)
            forms = six_persons(entries or [])
            if len(forms) == 6:
                tenses[label] = forms
        if not tenses:
            missing.append(inf)
            continue
        rows.append({"inf": inf, "en": en, "group": group, "t": tenses})

    # Emit JS
    lines = [
        "/* French verb conjugations for the core verbs.",
        "   Generated by tools/build_verbs.py using verbecc (LGPL-3.0).",
        "   Subject pronouns are stripped: forms are bare (\"parle\", \"ai parlé\"). */",
        "",
        "const VERBS = [",
    ]
    for r in rows:
        t_parts = []
        for label, forms in r["t"].items():
            arr = ", ".join('"%s"' % f.replace('"', '\\"') for f in forms)
            t_parts.append('      "%s": [%s]' % (label, arr))
        lines.append('  { inf: "%s", en: "%s", group: %d, t: {' % (r["inf"], r["en"], r["group"]))
        lines.append(",\n".join(t_parts))
        lines.append("  } },")
    lines += [
        "];",
        "",
        "const VERB_BY_INF = {};",
        "VERBS.forEach(function (v) { VERB_BY_INF[v.inf] = v; });",
        "",
        "const VERB_TENSES = [" + ", ".join('"%s"' % t[0] for t in TENSES) + "];",
        "",
        "const VERB_PERSONS = [\"je\", \"tu\", \"il / elle / on\", \"nous\", \"vous\", \"ils / elles\"];",
        "",
    ]
    out = Path("app/verbs.js")
    out.write_text("\n".join(lines), encoding="utf-8")

    print(f"verbs written: {len(rows)}")
    if missing:
        print(f"skipped: {', '.join(missing)}")
    total_forms = sum(len(v) for r in rows for v in r["t"].values())
    print(f"total conjugated forms: {total_forms}")
    print(f"wrote {out} ({out.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
