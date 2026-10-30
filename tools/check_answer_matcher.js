/* Answer matching checks: node tools/check_answer_matcher.js
   No dependencies — runs the browser files in a VM. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../app");
const code = ["answer-matcher.js", "engine.js"]
  .map(function (f) { return fs.readFileSync(path.join(root, f), "utf8"); })
  .join("\n;\n");

const ctx = { console, Date, Math };
vm.createContext(ctx);
vm.runInContext(code + "\n;globalThis.test = { AnswerMatch: AnswerMatch, Engine: Engine };", ctx);
const { AnswerMatch, Engine } = ctx.test;

let checks = 0;
function ok(name, cond, extra) {
  checks++;
  assert.ok(cond, name + (extra ? " — " + extra : ""));
}
function eq(name, actual, expected) {
  checks++;
  assert.equal(actual, expected, name + " (got " + JSON.stringify(actual) + ")");
}

/* ---------- the acceptance table from the roadmap ---------- */
const cases = [
  ["être", "etre", "accent_only"],
  ["étudiant", "etudiant", "accent_only"],
  ["français", "francais", "accent_only"],
  ["été", "ete", "accent_only"],
  ["à", "a", "accent_only"],
  ["où", "ou", "accent_only"],
  ["parler", "parle", "incorrect"],
  ["sommes", "somes", "incorrect"],
  ["être", "être", "exact"]
];
cases.forEach(function (c) {
  const r = AnswerMatch.match(c[1], c[0], "lenient");
  eq("lenient: " + c[0] + " / " + c[1], r.status, c[2]);
  eq("lenient accepted: " + c[0] + " / " + c[1], r.accepted, c[2] !== "incorrect");
});

/* ---------- semantic pairs are flagged, not blocked ---------- */
ok("a / à warns about meaning", AnswerMatch.match("a", "à", "lenient").semantic === true);
ok("ou / où warns about meaning", AnswerMatch.match("ou", "où", "lenient").semantic === true);
ok("etre / être is not semantic", AnswerMatch.match("etre", "être", "lenient").semantic === false);

/* ---------- strict mode ---------- */
eq("strict rejects a missing accent", AnswerMatch.match("etre", "être", "strict").status, "incorrect");
eq("strict rejects a wrong accent", AnswerMatch.match("pére", "père", "strict").status, "incorrect");
eq("strict accepts correct accents", AnswerMatch.match("être", "être", "strict").status, "exact");
eq("strict still ignores case", AnswerMatch.match("ÊTRE", "être", "strict").status, "exact");

/* ---------- Unicode forms ---------- */
{
  const combining = "e\u0302tre";          // e + combining circumflex, NFD
  const composed = "être";                  // NFC
  /* Both normalise to NFC first, so the same word typed either way is exact. */
  eq("NFD input matches NFC answer", AnswerMatch.match(combining, composed, "lenient").status, "exact");
  eq("NFD answer matches NFC input", AnswerMatch.match(composed, combining, "lenient").status, "exact");
  eq("NFC and NFD are the same word", AnswerMatch.strip(combining), AnswerMatch.strip(composed));
}

/* ---------- wrong accent is still reported ---------- */
{
  const r = AnswerMatch.match("pére", "père", "lenient");
  eq("wrong accent is accent_only", r.status, "accent_only");
  ok("wrong accent is named", r.notes.length === 1 && r.notes[0].expected === "è", JSON.stringify(r.notes));
  const q = AnswerMatch.match("etre", "être", "lenient");
  ok("missing accent is named", q.notes.length === 1 && q.notes[0].expected === "ê", JSON.stringify(q.notes));
}

/* ---------- whitespace, case, punctuation ---------- */
eq("surrounding space is ignored", AnswerMatch.match("  etre  ", "être", "lenient").status, "accent_only");
eq("case is ignored", AnswerMatch.match("ETRE", "être", "lenient").status, "accent_only");
eq("trailing full stop is ignored", AnswerMatch.match("Il pleut.", "il pleut", "lenient").status, "exact");
eq("curly apostrophe matches straight", AnswerMatch.match("j’ai", "j'ai", "lenient").status, "exact");
eq("empty input is incorrect", AnswerMatch.match("", "être", "lenient").status, "incorrect");

/* ---------- multiple accepted answers ---------- */
{
  const item = { answer: "être", accept: ["sois", "soit"] };
  eq("first variant still matches", AnswerMatch.matchItem(item, "etre", "lenient").expected, "être");
  eq("second variant matches and names itself", AnswerMatch.matchItem(item, "sois", "lenient").expected, "sois");
  eq("third variant matches", AnswerMatch.matchItem(item, "soit", "lenient").status, "exact");
  eq("unknown input fails against the primary answer",
    AnswerMatch.matchItem(item, "somes", "lenient").expected, "être");
  eq("exact beats accent-only", AnswerMatch.matchItem({ answer: "etre", accept: ["être"] }, "être", "lenient").status, "exact");
}

/* ---------- engine wrapper ---------- */
{
  const item = { answer: "être" };
  eq("Engine.matchAnswer returns a status", Engine.matchAnswer(item, "etre", "lenient").status, "accent_only");
  eq("Engine.isCorrect accepts a lenient hit", Engine.isCorrect(item, "etre", "lenient"), true);
  eq("Engine.isCorrect rejects in strict mode", Engine.isCorrect(item, "etre", "strict"), false);
  eq("Engine.isCorrect still rejects real misspellings", Engine.isCorrect(item, "somes", "lenient"), false);
}

/* ---------- no edit-distance guessing ---------- */
{
  ["etr", "etrez", "atre", "e tre", "etr e"].forEach(function (bad) {
    eq("not accepted: " + bad, AnswerMatch.match(bad, "être", "lenient").status, "incorrect");
  });
}

console.log(checks + " answer-matching checks passed.");
