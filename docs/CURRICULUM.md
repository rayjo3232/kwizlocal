# Curriculum graph and one scheduler (CURR-004 + SCHED-005)

The course already had hard prerequisites on every point (`prereqs` in
`data.js`) and a working "what is eligible" rule. What it did not have was a
reviewable teaching order, any notion of an advisory link, or a single place
that answers "what should I do next, and why".

## `app/curriculum.js`

Attaches three things to every point at load time.

| Field | Meaning |
|---|---|
| `order` | Position in the teaching sequence **within its level**. Written out explicitly instead of inferred from array position, so inserting a point into `data.js` no longer silently reshuffles the course. |
| `soft` | Advisory prerequisites. Never block anything; only decide which of two ready lessons is the better next step. |
| `stage` | `foundation` (no hard prerequisites), `core` (has them), `reading` (passages), `extension` (B2). |

`CURRICULUM_ORDER` lists all 162 ids. A point missing from it falls back to the
end of its level, and `tools/check_curriculum.js` reports it — the fallback
keeps the app working, the report stops the gap going unnoticed.

`CURRICULUM_SOFT` holds 17 curated links. It stays short on purpose: anything
that genuinely blocks belongs in `prereqs` on the point itself, and the
validator fails if the same pair appears in both.

## `tools/check_curriculum.js`

Checks the graph rather than trusting it:

- every listed id exists, appears once, and sits under its own level;
- every point has a position, unique within its level;
- hard prerequisites exist, are same-level or lower, and are not self-referential;
- no prerequisite cycles;
- soft prerequisites exist and are not duplicated as hard ones;
- **no deadlock**: iterating to a fixed point, every point can be reached from
  a starting point (lower-level prerequisites count as satisfied, matching
  `prereqReady()`);
- **order respects prerequisites**: inside a level, a point never comes before
  something it requires;
- every level has at least one grammar entry point, so starting there cannot
  dump you into a reading passage;
- every point has a stage.

Current state: 162 points, 161 hard edges, max fan-in 2, no cycles, no
cross-level edges, no deadlocks.

## One scheduler

`Engine.schedule(state)` is now the only place that decides what is eligible,
and everything else reads from it:

```
buckets: { due, weak, current, stretch }
lesson:  the next unlocked new lesson
active:  the four buckets concatenated
```

- **due** — introduced and past its review date
- **weak** — introduced and scoring below 50
- **current** — introduced but not yet answered
- **stretch** — introduced and solid, kept warm

`planList()` (the Study Plan), `buildSession()` (the quiz) and
`practiceOutlook()` (the dashboard) all consume it, so the plan can no longer
promise a lesson the quiz will refuse.

### The mix

`rankedByShare()` interleaves the buckets with smooth weighted round-robin at
**40% due / 30% weak / 20% current / 10% stretch**. It is a target, not a
quota: an empty bucket hands its slots to the others, and nothing is ever
invented to fill a slot. Small sessions naturally collapse toward the buckets
that have material.

The ranking is deterministic — the same state always produces the same order,
which is what makes it testable.

## Reasons, in the interface

`Engine.lessonReason(state, kp)` returns one sentence, and it is now shown
rather than implied:

- dashboard next-step: *"Learn next: Adjective position — A0 · Prerequisites ready"*
- drawer: *"Due for review."* / *"Weak — scoring 32."* / *"Builds on Definite articles."*
- a locked point: *"Needs être in the present tense and Passé composé with avoir first."*
- a point above the guided level: *"Beyond your guided level (A0). Practising it
  here is free exploration — it will not unlock this point for daily practice."*

That last line is the explicit free-exploration marker CURR-002 asked for:
Library and Brainmap still let you practise anything, but the app says what
that does and does not do.

## Verification

```bash
node tools/check_curriculum.js     # 13 graph checks
node tools/check_guided.js         # eligibility + migration scenarios
```

`smoke17` covers the scheduler end to end: the four buckets populate
correctly, due review leads the ranking, a session draws from several buckets,
the ranking is deterministic, and the dashboard and drawer show real reasons.
