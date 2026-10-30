# Phone input, updates, and honest library states (Sprint 6)

Sprint 6 in the roadmap bundles UX-009, UX-010, MOBILE-012 and SETTINGS-013.
Most of UX-009 and UX-010 already existed from the v2.6 rework — a single
primary action, ranked reasons, clickable prerequisites, free exploration that
does not unlock anything. So this sprint only filled the gaps that were real.

## What already existed (checked, not rebuilt)

| Roadmap ask | Where it already lived |
|---|---|
| One primary action on the first screen | `renderDashboard` hero, v2.6 |
| Ranked reasons for the next step | `Engine.lessonReason`, Sprint 3 |
| Locked point explains its prerequisites | `relatedHtml` + drawer "Builds on" links |
| Free exploration does not unlock daily practice | `guidedEligible` + the amber drawer note |
| Answer input autofocuses | `input.focus()` in kwiz, pre-learn and the verb drill |
| Lenient accents toggle | Settings, Sprint 1 |

## What was added

**Accent keys.** Thirteen keys (é è ê ë à â ù û ç ï î ô œ) under every typed
French input — kwiz, pre-learn guided, pre-learn check, conjugation drill.
Tapping a key after its base letter *replaces* it, so `e` + `ê` is `ê`, not
`eê`; otherwise it inserts at the caret and the caret moves past it. The keys
disappear once the question is answered.

Lenient matching means a missing accent no longer fails you, but typing it is
still how you learn it — these two features are complementary, not redundant.

**Update prompt instead of silent takeover.** `sw.js` used to call
`skipWaiting()` on install, so a new build activated immediately and swapped
assets under a page that might be halfway through a quiz. Now the new worker
caches and *waits*; the page shows a banner ("新版本已就绪 · A new version is
ready.") with Reload / Later. Reload posts `SKIP_WAITING` and reloads. The
banner never appears on a first install, only when there is a controller.

**Seven library states.** `Engine.statusOf` returned four (new / weak / due /
ok), which hid three different situations behind "new". `pointStatus()` now
returns:

| State | Meaning | Badge |
|---|---|---|
| `locked` | prerequisites unmet, or above your guided level | LOCKED |
| `available` | nothing in the way — start it now | OPEN |
| `learning` | introduced, not yet answered | LEARNING |
| `weak` | scoring below 50 | WEAK |
| `due` | past its review date | DUE |
| `solid` | ≥75 with at least four answers | SOLID |

Locked cards are dimmed and their button says **Preview** instead of Learn —
they are still openable, because free exploration is allowed, it just does not
unlock anything.

**Time estimates.** Each ranked next step carries `~3 min` or `~4 min`, so
"do I have time for this" is answerable without opening it.

**Where the data lives.** Settings now names the storage key
(`kwizlocal.state.v1`), its size, and that there is no server copy and no
sync between devices.

## Deliberately not done

- **Dark mode.** A real theme is a separate pass over every colour token; half
  a dark mode is worse than none.
- **Target level and review intensity settings.** Both need real model support
  (a target level changes what counts as progress; review intensity changes the
  interval curve). Wiring a switch that does nothing would be worse than
  leaving them out.
- **Keyboard-avoidance scrolling.** Enter submits from anywhere in the input,
  and the accent keys mean most answers need no keyboard at all.

## Verification

```bash
node --check app/app.js
node --check app/sw.js
```

`smoke19` (20 checks) covers the accent-key editing rules, that the keys
disappear after answering, the locked/open split in the library, the time
estimates, the settings line, and — by reading the source — that install no
longer skips waiting.
