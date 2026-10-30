/* French answer matching.

   Typing é / è / ê on an Android keyboard is painful, so "etre" should pass
   when the answer is "être" — but "parle" must still fail against "parler".
   That distinction is exactly "same word once the diacritics are removed",
   which is what this file implements. No edit distance, no guessing: either
   the letters are identical apart from accents, or it is wrong.

   Three outcomes, because two are not enough:
     exact       — identical apart from case and surrounding space
     accent_only — identical once diacritics are stripped; accepted, reported
     incorrect   — anything else

   `accent_only` is accepted in lenient mode only. Strict mode requires every
   accent, and is what the Settings toggle switches to.

   Only text the learner types goes through here. Choice options, ids, names
   and search boxes are compared exactly, on purpose. */

const AnswerMatch = (function () {

  /* Words whose accent changes the meaning, not just the spelling. In lenient
     mode they still pass, but the feedback has to say so — otherwise the app
     quietly teaches that "a" and "à" are the same word. */
  const SEMANTIC = ["a", "ou", "du", "la", "sur", "des", "cote", "tache", "mur", "peche", "mais"];

  const COMBINING = /[\u0300-\u036f]/;

  /* NFC first, so a pre-composed é and a combining e + ́ end up identical.
     Apostrophes are unified, runs of space collapse, and trailing sentence
     punctuation is dropped — all of which the app already did before this
     change, so nothing that used to pass starts failing. */
  function collapse(value) {
    return String(value == null ? "" : value)
      .normalize("NFC")
      .replace(/[\u2019\u2018]/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[.!?]+$/, "");
  }

  function fold(value) {
    return collapse(value).toLocaleLowerCase("fr");
  }

  function strip(value) {
    return collapse(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC").toLocaleLowerCase("fr");
  }

  /* Which characters actually carry a different accent, so the feedback can
     point at ê rather than repeating the whole word. */
  function accentNotes(input, expected) {
    const E = collapse(expected).normalize("NFD");
    const I = collapse(input).normalize("NFD");
    const notes = [];
    let ei = 0, ii = 0;
    while (ei < E.length && ii < I.length) {
      if (COMBINING.test(E[ei])) { ei++; continue; }
      if (COMBINING.test(I[ii])) { ii++; continue; }
      const eBase = E[ei], iBase = I[ii];
      let eAcc = "", k = ei + 1;
      while (k < E.length && COMBINING.test(E[k])) { eAcc += E[k]; k++; }
      let iAcc = "", m = ii + 1;
      while (m < I.length && COMBINING.test(I[m])) { iAcc += I[m]; m++; }
      if (eBase.toLowerCase() === iBase.toLowerCase() && eAcc !== iAcc) {
        notes.push({
          base: eBase,
          expected: (eBase + eAcc).normalize("NFC"),
          got: (iBase + iAcc).normalize("NFC")
        });
      }
      ei = k; ii = m;
    }
    return notes;
  }

  function match(input, expected, mode) {
    const strict = mode === "strict";
    const a = collapse(input);
    const b = collapse(expected);
    const base = { expected: b, input: a, notes: [], semantic: false };

    if (!a) return Object.assign(base, { status: "incorrect", accepted: false });
    if (fold(a) === fold(b)) return Object.assign(base, { status: "exact", accepted: true });

    if (!strict && strip(a) === strip(b)) {
      return Object.assign(base, {
        status: "accent_only",
        accepted: true,
        notes: accentNotes(a, b),
        semantic: SEMANTIC.indexOf(strip(b)) >= 0
      });
    }
    return Object.assign(base, { status: "incorrect", accepted: false });
  }

  /* Try the primary answer and every accepted variant. An exact hit wins over
     an accent-only hit, so the feedback always names the best match. */
  function matchItem(item, given, mode) {
    const answers = [item && item.answer].concat((item && item.accept) || []);
    let accentHit = null;
    for (let i = 0; i < answers.length; i++) {
      const r = match(given, answers[i], mode);
      if (r.status === "exact") return r;
      if (r.status === "accent_only" && !accentHit) accentHit = r;
    }
    return accentHit || match(given, item && item.answer, mode);
  }

  return {
    collapse: collapse,
    fold: fold,
    strip: strip,
    accentNotes: accentNotes,
    match: match,
    matchItem: matchItem,
    SEMANTIC: SEMANTIC
  };
})();
