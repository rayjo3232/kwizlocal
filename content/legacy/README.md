# Legacy M0 content drafts

These files were the first attempt at a Chinese-first course format
(`title_zh`, `rule_zh`, `explain_zh`, `fr.`-prefixed ids, levels A2L / A2U / C1).

They are **not loaded by the app**. The course the app actually runs lives in
`app/data.js`, and the only machine-readable view of it is the generated
`content/curriculum.json`.

Kept for two reasons:

- the id map (`fr.a1.negation.ne_pas` → `a1.negation.ne_pas`) is documented
  history, and the prefix is simply stripped;
- the `pitfall_zh` wording in the negation draft was the seed of the Chinese
  contrast notes now in `app/contrast.js`.

Do not edit these expecting a visible change.
