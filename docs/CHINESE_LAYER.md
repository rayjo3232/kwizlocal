# The Chinese layer (LANG-011, scoped)

The roadmap's LANG-011 asked for a full Chinese explanation track. That would
have duplicated ~9,000 words of English deep explanation, doubled the cost of
every future content edit, and contradicted the project's own opening rule —
*explanations in English, because the English is readable*.

What a Chinese learner actually lacks is not a translation. It is the answer to
"why do I keep getting this wrong?" — and the answer is always the same shape:
**Chinese does not have this category at all.** No articles, no grammatical
gender, no verb agreement, no subjunctive, no imperfect.

So the Chinese layer does two jobs, neither of which is translating:

## 1. Locator — `app/zh.js`

One short Chinese line under every point title. **162 / 162 covered.**
Pure orientation: `定冠词 le / la / les`, `复合过去时（助动词 être）`,
`阅读：租房广告`. It appears in the drawer, the pre-learn header and the
Library, and it never replaces anything.

## 2. Contrast — `app/contrast.js`

**43 notes**, only for points where the two languages genuinely diverge. Each
one names the Chinese side explicitly:

> 中文母语提示
> 中文没有冠词，所以冠词是最容易被整个漏掉的成分。说「我喜欢音乐」时，法语必须补上 la。

> 中文母语提示
> 中文说「我二十岁」「我饿」「我冷」，法语这三句都用 avoir，不用 être。

The test suite enforces that every note contains 中文/汉语 — a note that does
not name the difference is just a worse explanation, and belongs in the English
track instead.

## What stays English

Rules, examples, hints, explanations, question prompts, answers — all English
and French. `smoke18` asserts no Chinese has leaked into any exercise.

## Why not the full track

| | Full Chinese track | What was built |
|---|---|---|
| Volume | ~9,000 Chinese words | ~2,600 characters |
| Maintenance | every edit twice | additive only |
| Fails if | the two tracks drift | — |
| Teaches | the rule again | why the rule is hard |

If the project ever genuinely goes Chinese-first, the right move is to replace
the English track, not to run both — parallel content always drifts.

## Content source (CONTENT-008)

`app/data.js` is the single source of truth. `content/curriculum.json` is a
**generated** projection (162 points, 1,274 items) for inspection and tooling:

```bash
node tools/export_content.js            # write it
node tools/export_content.js --check    # fail if it is stale
python tools/validate_content.py        # check_data + export sync
```

The old `content/kp/*.json` drafts moved to `content/legacy/`. They used a
different schema (`title_zh`, `rule_zh`, `fr.`-prefixed ids, levels A2L/A2U/C1)
and were never loaded by the app — editing them changed nothing, which was
exactly the problem CONTENT-008 named.
