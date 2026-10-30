# Mastery signals and question difficulty (MASTERY-006 + QUIZ-007)

Two things were collapsed into one number each, and both were lying a little.

## Four signals, not one badge

`Engine.pointProfile(state, kp)` returns what a single status could not:

| Field | Question it answers |
|---|---|
| `seen` | How many answers has this point had? |
| `mastery` | How well is it known? (`null` when never tested — not `0`) |
| `stage` | Where does the lesson stand? `unseen` → `primed` → `introduced` → `practising` → `solid` |
| `due` / `dueInDays` | Is it time to review it? |

`mastery: null` matters. An untested point used to read as `0`, which looks
identical to "tested and failing". The Brainmap can now tell them apart.

`statusOf()` — the badge in lists — is derived from the profile, so the badge
and the numbers cannot disagree.

Accent-only answers are counted separately (`Engine.accentCount`), because the
grammar was known and the spelling was not. The drawer shows
*"8 answers · 8 right · next review in 7.8 days"* and adds
*"2 accepted without accents"* when there are any; Settings shows the total.

## BKT stays, and stays single-entry

Every real answer still goes through `Engine.applyAttempt()`. A skip
(`correct: null`) changes nothing; one answer is one attempt, one evidence
count and one correct/wrong increment. `tools/check_mastery.js` asserts this
rather than assuming it.

Nothing here replaces BKT. FSRS remains a future evaluation, not a swap — the
existing interval (`dueAt`, 0.25–12 days, growing with `p`) is what the review
date comes from, and it is now a *separate* signal rather than a status.

## Difficulty: authored ramp + type + measured

The stored `item.difficulty` was `point difficulty + position × 0.25` — a guess
from where the question sat in the array. `Engine.itemDifficulty()` blends
three inputs:

1. **the authored value** — the only thing that separates two questions of the
   same type inside a point. Removing it (the first attempt at this) made every
   item in a point identical, which is worse than trusting position;
2. **a type nudge** — choice < fill < correction, weighted at 0.5 so it tilts
   ties rather than dominating;
3. **measured difficulty** — `wrong / seen` for that exact question, blended in
   with a weight that grows to 0.65 by eight answers. 25% wrong is the neutral
   point: above it the question rates harder than its type suggests.

The last part is the "statistical calibration" the roadmap asked for, and it
costs one pass over `state.attempts` per session build.

## Streaks steer the choice

`Engine.buildSession()` reads the last three answers per point:

- **two misses in a row** → the easier end of the pool comes first, so the
  learner rebuilds on something they can do;
- **three right in a row** → the harder end comes first;
- otherwise the pool runs easy → hard as before.

A newcomer still meets the `check` questions before the `kwiz` ones. Whatever
happens, the pool is drawn from eligible points only — difficulty can reorder
the queue, never widen it.

## Verification

```bash
node tools/check_mastery.js     # 33 checks
```

`smoke17` still covers the scheduler; `check_mastery` covers the profile,
accent tracking, the difficulty blend, the streak rule, and that a session
never escapes its eligible pool or repeats a question.
