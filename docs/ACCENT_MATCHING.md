# Lenient French accents — Sprint 1 (FR-INPUT-001)

Typing `é` / `è` / `ê` on an Android keyboard is painful, so an answer that is
right apart from its diacritics now passes — and says so. `parle` still fails
against `parler`, and `somes` still fails against `sommes`: the matcher only
ignores accents, it never guesses.

## What changed

- **New `app/answer-matcher.js`.** One place that decides whether typed French
  matches. Returns a status rather than a boolean:
  `exact` / `accent_only` / `incorrect`, plus the expected spelling and which
  characters carry a different accent.
- **`Engine.matchAnswer(item, given, mode)`** wraps it and tries `answer` then
  every entry in `accept`, returning the variant that actually matched.
  `Engine.isCorrect()` is now a thin boolean wrapper, so nothing that used to
  call it had to change.
- **Every typed-answer path goes through it**: the main kwiz, placement, the
  exam, pre-learn guided and check steps, and the conjugation drill. Choice
  questions compare exactly — a wrong option is never "close enough".
- **Settings → Lenient French accents** (default on). Off means every accent
  must be typed. The value lives in the existing `state` object, so it travels
  with export/import and needs no migration.
- **Feedback** names the standard spelling and the character to watch:
  *"Accepted — the accent is missing or different. Standard spelling: **êtes** ·
  you wrote etes — check ê."* The result page marks such answers with
  "Accepted without the accent".
- **Word pairs where the accent changes the meaning** (`a/à`, `ou/où`, `du/dû`,
  `la/là`, `sur/sûr`, `des/dès`) still pass in lenient mode, but the feedback
  adds a warning. A future "balanced" mode can make these strict without
  touching anything else.
- **`accent: true`** is written on the attempt row when an answer was right only
  after stripping accents. It is optional, so old rows are untouched and
  "how many accent slips" is just a filter.

## Deliberately not included

- No edit distance. `etr`, `etrez` and `atre` all fail.
- No `œ/oe`, punctuation, hyphen or plural tolerance — those are a separate
  future item, and folding them in here would hide real spelling mistakes.
- Choice options, ids, names and search boxes are compared exactly.

## Verification

```bash
node tools/check_data.js
node tools/check_guided.js
node tools/check_answer_matcher.js    # 50 checks
node --check app/engine.js
node --check app/app.js
python tools/build_dist.py
```

The browser smoke suite covers the UI end of it: an unaccented answer passes
and shows the note, strict mode refuses it, a different word still fails, the
toggle persists, and a correct choice shows no accent note.
