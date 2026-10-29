# Kwiz Local — French demo

A local-only, no-build prototype of the Kwiziq learning loop:
**Brainmap → 10-question kwiz → per-answer feedback → updated scores**.

Everything runs in the browser. No server, no account, no network calls.

## Run it

**Double-click `start.bat`.** It launches a tiny local server on
`http://localhost:8765/` and opens your browser. Press any key in the window
to stop it, or run `stop.bat` if it got left behind.

The server matters because a `file://` page cannot register a service worker —
without one you get no offline cache and no "Add to Home Screen".

If Python is not installed, `start.bat` falls back to opening `index.html`
directly. Everything still works; only the PWA install is unavailable.

```bash
# manual equivalent
cd app
python -m http.server 8765
```

## Install it on your phone

1. Run `start.bat` on the PC and note the machine's LAN IP
   (`ipconfig` → IPv4, e.g. `192.168.1.20`).
2. On the phone, open `http://192.168.1.20:8765/` (same Wi-Fi).
3. **Android/Chrome**: menu → *Add to Home screen*.
   **iOS/Safari**: share → *Add to Home Screen*.

After the first load the service worker caches every asset, so the app opens
offline and remembers your progress in `localStorage`.

On a phone the top nav is replaced by a bottom tab bar (Home / Practise /
Library / Notebook / More), buttons grow to 44px touch targets, and the layout
collapses to one column.

## First 60 seconds

1. Take the **placement test** from the dashboard banner (20 questions across A0–B2, no feedback until the end).
   It estimates your level and fills the Brainmap in one go, aligned to the CEFR grammar progression.
   Prefer a shortcut? **Load demo progress** in Settings fills the map with synthetic scores.
2. Open **Brainmap** and click any rectangle: score, rule, examples, and a practice button.
3. Click **Kwiz your Studyplan** on the dashboard: 10 questions, mixed points, instant feedback.
4. Finish the set to see the results table and how the map changes.
5. Open **Library**, pick a point marked `NEW`, and try the **Pre-learn** flow:
   Primer → Guided (with hints) → Check (2 of 3 to pass).

**Reset everything** is in Settings.

## What is implemented

| Piece | Status |
|---|---|
| 154 knowledge points, A0–B2, CEFR-aligned, English explanations | done |
| 777 items: choice / fill / correction + 10 reading passages (A1–B2) | done |
| **Quick kwiz**: 3-question (~1 min) and 10-question modes | done |
| **Per-answer score movement**: every answer shows the exact delta for that point | done |
| **Auto-advance**: jumps to the next question after a correct answer (toggle in Settings) | done |
| Session timer + duration on the result page | done |
| BKT mastery update per point | done |
| Display score −100…100 with evidence shrinkage | done |
| Level score aggregation (weighted, can go negative) | done |
| 10-question session builder (weak / due / new, difficulty ramp) | done |
| Brainmap treemap with grammar areas, drill-down, colour by score, drawer | done |
| Pre-learn state machine (Primer → Guided → Check) | done |
| Results table with per-answer explanation + practise-mistakes | done |
| **Result page "What changed"**: score delta per point vs. session start | done |
| Library filters by level, grammar area and search + sort (weakest / strongest / recent) | done |
| **Notebook**: wrong answers collected automatically + saved points + practise all | done |
| **Vocabulary**: frequency-ranked words with Tatoeba examples + flashcards | done |
| **Cloze**: fill the gap in a real sentence, 4 options, drawn from the vocab deck | done |
| **Gender drill**: le/la for nouns that have gender data | done |
| **Verb conjugations**: 74 core verbs × 7 tenses, table + drill | done |
| **Reading practice**: one passage at a time, weakest first, 5 questions each | done |
| **Sentence practice**: ~14k mined Tatoeba sentences (gap-fill + word order), semantic distractors, filter by grammar tag and CEFR level | done |
| **Common mistakes**: every point shows a wrong-vs-right table, generated from its own choice items | done |
| **Deep explanations**: 144 of 154 points carry usage notes, extra examples and a memory tip | done |
| **Related points**: every lesson drawer cross-links to what it builds on and what it leads to | done |
| **Adaptive retry**: a point you miss in a full kwiz comes back two questions later (3-question quick kwiz stays short) | done |
| **Reading translation**: reveal / hide an English translation under each passage | done |
| **Tap-a-word gloss**: tap a French word in an example or a reading passage to see its English gloss (FreeDict + hand-written function words) | done |
| **Vocab cards**: tap anywhere on a card (except Mark known) to reveal the translation; the card tints while showing | done |
| **Activity trend**: 7-day and 30-day bars on the dashboard, height = questions, colour = accuracy | done |
| **Weekly summary**: questions, accuracy, minutes, sessions, weakest area | done |
| **Learn → practise → learn**: one-click jump into an untouched point from the dashboard or result page | done |
| **Translate**: write the French for an English sentence, partial credit by word-level LCS | done |
| Placement test: 20 questions, seeds the Brainmap | done |
| **PWA**: installable, offline cache via service worker | done |
| **Phone layout**: bottom tab bar, 44px touch targets, safe-area padding | done |
| TCF-style exam: 20 timed questions, score /699, CEFR band | done |
| Exam answers feed the Brainmap (same BKT path as kwiz) | done |
| Reading comprehension with passages | done |
| Daily goal bar (10 / 20 / 30 / 50 per day, set in Settings) | done |
| Streak, stars, monthly stats | done |
| localStorage persistence + JSON export / import | done |
| "I already know this" — mark a point as mastered from the drawer | done |
| "Practise N weak points" — a session across every point below 50 | done |
| Study plan stays stable between renders (reshuffles after each session) | done |
| Audio | **not included** (by choice) |
| Chinese explanations | **not included** (English only) |
| FSRS-grade scheduling | simplified interval, not full FSRS |
| Writing challenges, dictation | not yet |

## Vocabulary data

The Vocab page reads `app/vocab.js`, which is generated, not hand-written.
The current build has **600 words, 483 with example sentences**.

```bash
# 1. download Lexique 3.83 (free academic lexicon, ~25 MB TSV)
#    http://www.lexique.org/databases/Lexique383/
python tools/build_vocab.py --top 600

# 2. attach short French sentences with English translations from Tatoeba
python tools/fetch_vocab_examples.py --limit-per-word 2 --workers 10
```

- **Frequency / part of speech / gender**: Lexique 3.83 (New & Pallier), academic licence.
- **Example sentences**: Tatoeba, CC BY 2.0 FR.
- CEFR labels are a rough frequency-band mapping, not an official list.
- The fetch step caches to `content/vocab/examples.json`, so re-running resumes where it stopped.
- `--emit-only` rebuilds `app/vocab.js` from the cache without any network calls.
- Want more words? Raise `--top` (e.g. 600 or 1200) and re-run both steps.

## Word glosses

`app/gloss.js` maps a French word to one short English gloss, used by the
tap-a-word popover in lesson examples. Content words come from **FreeDict
fra-eng 0.4.1** (GPL/LGPL, local use only); function words (`le`, `pas`, `très`…)
are hand-written because the frequency list only keeps content words.

```bash
python tools/build_gloss.py   # needs content/dict/fra-eng/fra-eng.tei
```

## Verb data

`app/verbs.js` is generated by `tools/build_verbs.py` using **verbecc**
(LGPL-3.0). It covers 74 core verbs × 7 tenses (présent, passé composé,
imparfait, futur simple, plus-que-parfait, conditionnel, subjonctif),
3,108 conjugated forms in total.

```bash
pip install verbecc tzdata   # tzdata is needed on Windows
python tools/build_verbs.py
```

Subject pronouns are stripped at build time, so the data stores bare forms
(`parle`, `ai parlé`) and the UI re-attaches pronouns, handling elision
(`je` + `ai` → `j'ai`).

## Deep explanations

`app/deep.js` adds a second layer to the short rule in `data.js`, keyed by
point id:

```js
"a1.pronouns.on": {
  usage: "The everyday stand-in for we, and also for people in general.",
  more: [["On y va ?", "Shall we go?"], ...],
  tip: "on takes il/elle verb forms no matter how many people are involved."
}
```

Missing ids fall back silently to the short rule, so the file can grow in
batches. Currently covers all 22 A0 points and 29 of the 31 A1 points —
2,400 words, roughly 47 words per point on top of the original 35.

`commonMistakes()` builds the wrong-vs-right table from the point's own choice
items: it fills the `___` slot of each prompt, so a row reads
"la / les livre (masculine) → le livre (masculine)" rather than a bare "la → le".

## Sentence bank

`app/sentences.js` holds ~14,000 practice items mined from Tatoeba:

```bash
# bulk exports (CC BY 2.0 FR)
#   https://downloads.tatoeba.org/exports/per_language/fra/fra_sentences.tsv.bz2
#   https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2
#   https://downloads.tatoeba.org/exports/per_language/fra/fra-eng_links.tsv.bz2
python tools/build_sentences.py --target 16000
```

Pipeline: 729k French sentences × 442k fra-eng links → 207k clean pairs after
filtering (length, length ratio, profanity, digits, proper nouns) → 120k
sentences tagged with **spaCy `fr_core_news_md`** → ~1,300 items per grammar
tag.

Why spaCy instead of Lexique for part of speech: Lexique treats many inflected
forms as their own lemmas with the wrong category — it lists *bonne* as a noun
and *vole* as a noun — which produced nonsensical distractors (a verb gap
answered by choosing between four nouns). spaCy tags in context, so a gap is
always a noun slot.

**Distractors are semantic neighbours, not random nouns.** The build precomputes
a nearest-neighbour table from spaCy's word vectors (3,880 nouns with vectors),
then picks three nouns with similarity 0.30–0.82 that are not already in the
sentence and are within ±4 characters. So *infirmière* gets *assistante /
infirmier*, and *arme* gets *fusil / armure / épée* — you have to use the
context, not just "which one is a noun".

Tags come from morphology, not regex: `Mood=Cnd` for conditionnel, `Mood=Sub`
for subjonctif, `Tense=Fut` for futur, `aux:tense` + past participle for passé
composé. The imparfait tag was dropped on purpose — spaCy reports it as
`Tense=Pres` and surface regexes mistake *vais* / *fais* for imparfait, so any
label would have been unreliable.

**Broken sentences are filtered** with a conservative rule set (space before
comma/period, doubled words, `de le` instead of `du`, `il à` instead of `il a`,
`sa est` instead of `ça est`). Note that French legitimately puts a space
before `? ! : ;`, so those are not flagged.

**Level** combines length and lexical rarity: every content word is looked up in
Lexique (surface forms, so *vais* and *mangé* resolve too, with elision and
hyphen fallbacks), and a sentence is A1 only if it is ≤7 words with no word
below 10/million. Subjonctif / conditionnel / relatives are bumped to B1+.

`tools/check_data.js` validates the hand-written grammar bank; the sentence
bank is machine-generated and validated by the smoke tests instead.

## Translation practice

`#/translate` (or the **Translate** button on the Sentences page) asks you to
write the French for an English sentence. It is the only exercise in the app
that requires production rather than recognition.

**Prompts come from the hand-written example sentences**, not from the mined
corpus. Tatoeba's English side is full of idioms — "that doesn't add up",
"be on your guard against pickpockets" — which cannot be produced from the
translation alone. The examples in `data.js` and `deep.js` were written to
illustrate one grammar point each, so they are short, literal and paired with
a clean gloss. That yields roughly 500 prompts, tagged with the point they
came from.

**Scoring is deliberately forgiving**, because the goal is sentence structure,
not spelling:

- accents are stripped (`frere` = `frère`)
- punctuation and capitalisation ignored
- word-level LCS gives partial credit, so a right-words-wrong-order attempt
  scores ~65% instead of zero
- the reference line highlights in red the words you did not produce
- "Show answer" reveals it and records a zero, so the average still reflects
  what you could not write



`app/sentences.js` holds ~14,000 practice items mined from Tatoeba:

```bash
# bulk exports (CC BY 2.0 FR)
#   https://downloads.tatoeba.org/exports/per_language/fra/fra_sentences.tsv.bz2
#   https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2
#   https://downloads.tatoeba.org/exports/per_language/fra/fra-eng_links.tsv.bz2
python tools/build_sentences.py --target 16000
```

## Controls

- `1`–`4` pick a multiple-choice option (kwiz and exam)
- `Enter` check answer / continue / next question
- `Esc` skip (no penalty)
- Skipped answers are stored as `null` and never lower a score

## Adding content

Edit `data.js`. Each point uses the `K(...)` helper:

```js
K("a1.example.id", "A1", "verbs",
  "English title", "Titre français", 1.2, 2.0, ["prereq.id"],
  "One-sentence rule.",
  [["French example", "English translation"]],
  "What an English speaker usually gets wrong.",
  [
    ["choice", "Prompt ___ here.", ["a", "b"], "a", "Why."],
    ["fill",   "Prompt ___ here.", null, "answer", "Why.", "Optional hint"]
  ])
```

Item position decides the stage: **0–1 guided, 2–3 check, 4 kwiz**.
Keep at least 5 items per point so pre-learn and kwiz both have material.
A drill-heavy point (the imparfait / passé composé contrast, for instance) may
carry up to 12 — pre-learn still uses items 2–4, and "Practice this" takes up
to 8.

## Known limits (on purpose)

- The engine is a demo-grade BKT: parameters are fixed, not fitted.
- Scheduling is a simple interval, not real FSRS.
- No audio, no images, no accounts.
- The demo seed is synthetic; it is only there to make the map legible.
- 140 points covers the core CEFR A1–B2 grammar syllabus (EAQUALS inventory).
- The Brainmap category layer is a treemap approximation, not a Voronoi map.
