# Guided Learning V1 — 2026-10-30

This is a conservative, no-build change to the existing KwizLocal browser app.
It does **not** replace its existing localStorage data model or import/export format.

## Changes

- **Learn new:** no more random point across the whole corpus; picks the next eligible lesson, in authored course order, with prerequisite checks.
- **Guided Practice:** uses only introduced points (`primed` after Pre-learn or with actual prior non-diagnostic attempts) within the learner's current guided level; initial Quick/Full practice redirects to an introductory lesson instead of testing unfamiliar grammar.
- **Study Plan:** deterministic, limited to due/weak work and currently unlocked new lessons; it shares a scheduler with Learn and Guided Practice. Placement questions and exploratory higher-level quizzes cannot silently inject advanced points into daily practice. Old random `state.plan` caches are reconciled on first upgraded dashboard visit.
- **Level settings:** Settings → Guided starting level (Auto / A0 / A1 / A2 / B1 / B2). Auto uses placement level if available, otherwise A0. Explicitly choosing A1 assumes *lower-level* prerequisites as an entry convention without falsifying past mastery; same-level prerequisites still need practice.
- **Progression:** after 75% of a level's points reach at least two real practice attempts and a display score >=50, the guided level can move to the next level. This is an initial heuristic, not an exact recreation of Kwiziq's proprietary scheduler.
- **Mixed-topic review:** vocabulary and conjugation only appear in guided mixed quizzes if the particular word/form has already been practised, and if its CEFR/tense is compatible with the guided level. The dedicated Vocab/Verbs sections remain free exploration.
- **Pre-learn check:** passing no longer fabricates two quiz attempts or changes BKT confidence. It sets `state='primed'` and allows subsequent real practice to supply the evidence.
- **Dependencies:** remove three invalid cross-level hard dependencies (A0 adjective position, A2 relative où, A2 polite conditional). These are self-contained teaching entries; details can be restructured later.
- **Offline updates:** Service Worker cache name bumped to `kwizlocal-v26-guided` for mobile PWA updates.

## Verification

Run in repository root:

```bash
node tools/check_data.js
node tools/check_guided.js
node --check app/engine.js
node --check app/app.js
python tools/build_dist.py
```

Browser smoke tests also exercised the initial page, a fresh A0 lesson, switching to an A1 start, guided-practice redirect, and the full pre-learn pass → real quiz path (with no fabricated attempts).

## Deploy to same Cloudflare Workers URL

If Cloudflare Workers is **already connected** to this GitHub repository with auto-deploy, committing to the tracked branch can trigger deployment. If it is not connected, pushing to GitHub **will not** update the live site by itself.

For direct deployment from a local checkout with Wrangler authenticated:

```bash
npx wrangler deploy
```

The existing `wrangler.jsonc` deploys `./app` as static assets. To verify deployment, open the existing Workers URL on your phone. The service worker cache upgrade should take effect after refreshing/reopening the PWA (avoid interrupting an in-progress quiz). Device-local progress stays in that browser's localStorage, but **does not automatically sync between PC and phone**.

## Known limitations and next iteration

- Knowledge point ordering is the hand-authored `KPS` order, not a fully curated curriculum graph. Dependencies need additional expert review.
- Per-question difficulties are approximate; they are not calibrated to real error rates or response times.
- CEFR tags on vocabulary do not fully grade sentence complexity; new words are therefore not introduced as surprise questions in guided mixed practice.
- Explicit level/topic quizzes and free exploration remain unrestricted by design.
- Practice beyond currently unlocked points is possible via manually navigated Library/Brainmap and level-specific quizzes, intentionally separate from Guided Practice. Such exploration is excluded from Guided Practice until the guided level reaches it.

## Sprint 2 verification (2026-10-30)

The behaviours above were re-checked against the code rather than the prose,
and the gaps were closed.

**Confirmed working**

- A0 fresh, manual A1, placement A1 and a migrated v1 profile all produce the
  same eligible scope from Learn, Study Plan and Quiz.
- Starting at A1 never opens with a reading passage: `newCandidates()` sorts
  reading after grammar within a level, so a prerequisite-free passage cannot
  jump the queue.
- A B2 point touched by the placement test never reaches an A1 plan or quiz.
- Pre-learn leaves `n === 0` and unlocks practice for that point only.
- The level-up heuristic needs 75% of a level at `n >= 2` and score >= 50, so
  it cannot skip a level without evidence.

**Fixed**

- "No guided practice available" was a dead end with no explanation. Both the
  dashboard and the quiz now use `Engine.practiceOutlook()`, which names the
  next lesson or says that every point at the current level is already
  introduced.
- The dashboard's empty state used to say "a longer kwiz will find something",
  which stopped being true once practice was restricted to introduced points.

**Known boundary**

Guided Practice is capped by level, but Library and Brainmap still let you open
and practise any point on purpose. That is free exploration by design: those
attempts move that point's own score but never unlock it for guided daily
practice while the guided level is lower.
