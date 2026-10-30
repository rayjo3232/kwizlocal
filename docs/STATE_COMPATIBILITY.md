# Saved-profile compatibility (DATA-003)

Learning history lives in `localStorage` under `kwizlocal.state.v1`. There is
no server copy, so a bug in the loader is unrecoverable data loss. Two things
were wrong with the old one:

```js
const s = JSON.parse(raw);
if (s && s.version === 1) return s;     // anything else: silently replaced
```

- A profile whose `version` was not exactly `1` — an older save, a newer one, a
  hand-edited file — was **thrown away without a word**.
- A profile that failed to parse was also replaced, and the original was gone
  the moment the next answer was saved.

## What it does now

`Engine.migrateState(raw)` accepts anything that looks like a profile and
returns a complete state:

| Input | Result |
|---|---|
| `version: 1` | upgraded, every field kept |
| no `version` at all | accepted, missing stores created |
| `version: 99` (newer build) | accepted, unknown fields preserved |
| broken point record (`p: null`, `n: "many"`, `n: -3`) | repaired to a number, never `NaN` |
| attempt row without an item id or timestamp | dropped; everything else kept |
| `null`, a string, an array, an unrelated object | rejected (`null`) |

The repair matters beyond tidiness: a single `p: null` makes `display()` return
`NaN`, and from there every score on the Brainmap reads `NaN`.

Migration is idempotent, so running it on an already-migrated profile changes
nothing. It also clears `state.plan`, which is a cache and gets recomputed.

## Loading and rescuing

- `loadState()` runs the stored value through `migrateState`.
- If that returns `null`, the raw text is copied to
  `kwizlocal.state.v1.rescue.<timestamp>` (with a pointer at
  `kwizlocal.state.v1.rescue.last`) **before** a fresh profile replaces it, and
  the app says so once on boot. Nothing is destroyed silently.
- If saving fails — quota, private mode — a toast says so once instead of
  swallowing the error while answers keep landing in memory.

## Import and export

- Import runs through the same migration. A version-less or newer backup loads;
  only input that is clearly not a profile is refused.
- Export keeps the state object at the root and adds `exportedAt`, `app` and
  `appVersion` alongside it, so older builds can still read the file.

## Service worker

`sw.js` only touches `caches` — it deletes old cache buckets on activate and
never reads or writes `localStorage`. Progress and the in-flight session are
therefore untouched by a cache update. The cache name is bumped on every
release (`kwizlocal-v28-guided-data`).

## Secrets

`.gitignore` now also covers `kwizlocal-*.json` (exported personal backups),
`.dev.vars`, `.env*`, `.wrangler/`, `*.pem` and `*.key`. No credential files are
tracked; `git ls-files` has no match for any of them.

## Verification

```bash
node tools/check_state_migration.js   # 47 checks
node tools/check_guided.js            # guided + migration scenarios
```

The browser suite adds `smoke16` (28 checks): a v1 profile boots with its
scores intact, a future-version profile keeps its unknown fields, a corrupt
value is rescued rather than overwritten, and the dashboard still renders in
every case.
