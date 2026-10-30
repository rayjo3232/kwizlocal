/* Mastery and difficulty checks: node tools/check_mastery.js
   No dependencies — runs the browser files in a VM. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../app");
const code = ["data.js", "extra.js", "curriculum.js", "engine.js"]
  .map(function (f) { return fs.readFileSync(path.join(root, f), "utf8"); })
  .join("\n;\n");

const ctx = { console, Date, Math };
vm.createContext(ctx);
vm.runInContext(code + "\n;globalThis.t = { KPS, KP_BY_ID, Engine };", ctx);
const { KPS, KP_BY_ID, Engine } = ctx.t;

let checks = 0;
function ok(name, cond, extra) {
  checks++;
  assert.ok(cond, name + (extra ? " — " + extra : ""));
}
function eq(name, actual, expected) {
  checks++;
  assert.equal(actual, expected, name + " (got " + JSON.stringify(actual) + ")");
}

const KP = KP_BY_ID["a0.etre.present"];

/* ---------- 1. the four signals are separate ---------- */
{
  const s = Engine.newState();
  const p = Engine.pointProfile(s, KP);
  eq("an untouched point is unseen", p.stage, "unseen");
  eq("with no evidence", p.seen, 0);
  eq("and no mastery figure at all", p.mastery, null);
  ok("null, not zero — never tested is not the same as known badly", p.mastery === null);
  eq("and nothing due", p.due, false);
}

/* ---------- 2. stage walks forward ---------- */
{
  const s = Engine.newState();
  Engine.ensure(s, KP.id).state = "primed";
  eq("a passed pre-learn is primed", Engine.pointProfile(s, KP).stage, "primed");

  Engine.applyAttempt(s, { kpId: KP.id, itemId: KP.items[2].id, correct: false });
  const p = Engine.pointProfile(s, KP);
  eq("one answer moves it to practising", p.stage, "practising");
  eq("coverage counts answers", p.seen, 1);
  eq("mastery is a number once tested", typeof p.mastery, "number");
  ok("a miss scores below zero", p.mastery < 0, String(p.mastery));

  for (let i = 3; i < 8; i++) {
    Engine.applyAttempt(s, { kpId: KP.id, itemId: KP.items[i].id, correct: true });
  }
  const solid = Engine.pointProfile(s, KP);
  eq("sustained success reaches solid", solid.stage, "solid");
  ok("with a high mastery figure", solid.mastery >= 75, String(solid.mastery));
  ok("coverage and mastery moved independently", solid.seen > p.seen && solid.mastery > p.mastery);
}

/* ---------- 3. review date is its own signal ---------- */
{
  const s = Engine.newState();
  Engine.applyAttempt(s, { kpId: KP.id, itemId: KP.items[2].id, correct: true });
  const fresh = Engine.pointProfile(s, KP);
  eq("a just-answered point is not due", fresh.due, false);
  ok("and reports when it will be", fresh.dueInDays > 0, String(fresh.dueInDays));

  s.kps[KP.id].dueAt = Date.now() - 1000;
  const overdue = Engine.pointProfile(s, KP);
  eq("a point past its date is due", overdue.due, true);
  ok("being due does not change mastery", overdue.mastery === fresh.mastery);
  eq("the badge follows the profile", Engine.statusOf(s, KP), "due");
}

/* ---------- 4. accent-only answers are tracked separately ---------- */
{
  const s = Engine.newState();
  Engine.applyAttempt(s, { kpId: KP.id, itemId: KP.items[2].id, correct: true, accent: true });
  Engine.applyAttempt(s, { kpId: KP.id, itemId: KP.items[3].id, correct: true });
  eq("accents are counted per point", Engine.accentCount(s, KP.id), 1);
  eq("and across the profile", Engine.accentCount(s), 1);
  eq("but mastery counts both as right", Engine.pointProfile(s, KP).correct, 2);
  eq("another point has none", Engine.accentCount(s, "a0.avoir.present"), 0);
}

/* ---------- 5. difficulty is measured, not positional ---------- */
{
  const s = Engine.newState();
  const stats = Engine.itemStats(s);
  /* Same question, different type: the type prior must move the estimate. */
  const base = KP.items[3];
  const asChoice = Object.assign({}, base, { type: "choice" });
  const asCorrect = Object.assign({}, base, { type: "correct" });
  ok("a choice is rated easier than a sentence correction",
    Engine.itemDifficulty(asChoice, KP, stats) < Engine.itemDifficulty(asCorrect, KP, stats),
    Engine.itemDifficulty(asChoice, KP, stats).toFixed(2) + " vs " + Engine.itemDifficulty(asCorrect, KP, stats).toFixed(2));

  /* Same item, same type, different history: the one that keeps going wrong
     must rate harder. */
  const a = KP.items[2], b = KP.items[3];
  for (let i = 0; i < 6; i++) {
    s.attempts.push({ itemId: a.id, kpId: KP.id, correct: false, at: Date.now(), source: "kwiz" });
    s.attempts.push({ itemId: b.id, kpId: KP.id, correct: true, at: Date.now(), source: "kwiz" });
  }
  const stats2 = Engine.itemStats(s);
  ok("a question you keep missing rates harder",
    Engine.itemDifficulty(a, KP, stats2) > Engine.itemDifficulty(b, KP, stats2),
    Engine.itemDifficulty(a, KP, stats2).toFixed(2) + " vs " + Engine.itemDifficulty(b, KP, stats2).toFixed(2));

  /* One attempt should not swing it far. */
  const s1 = Engine.newState();
  s1.attempts.push({ itemId: a.id, kpId: KP.id, correct: false, at: Date.now(), source: "kwiz" });
  const d1 = Engine.itemDifficulty(a, KP, Engine.itemStats(s1));
  const d0 = Engine.itemDifficulty(a, KP, Engine.itemStats(Engine.newState()));
  ok("one answer moves the estimate only a little", Math.abs(d1 - d0) < 0.4,
    d0.toFixed(2) + " -> " + d1.toFixed(2));
}

/* ---------- 6. a streak steers which question comes first ---------- */
{
  const firstDifficulty = function (wrong) {
    const s = Engine.newState();
    const rec = Engine.ensure(s, KP.id);
    rec.state = "primed";
    /* Same three items answered, only the result differs, so the pool of
       unseen items is identical in both cases. */
    [2, 3, 4].forEach(function (i) {
      Engine.applyAttempt(s, { kpId: KP.id, itemId: KP.items[i].id, correct: !wrong });
    });
    s.kps[KP.id].dueAt = Date.now() + 86400000;   // keep it out of the due bucket
    /* One question, so the choice is the selection rule itself rather than the
       session's own easy-to-hard ramp. */
    const sess = Engine.buildSession(s, 1);
    return sess.items.length ? sess.items[0].difficulty : null;
  };

  const afterMisses = firstDifficulty(true);
  const afterRights = firstDifficulty(false);
  ok("both cases produced a question", afterMisses != null && afterRights != null,
    afterMisses + " / " + afterRights);
  ok("after two misses the easier question comes back",
    afterMisses < afterRights, afterMisses + " vs " + afterRights);
}

/* ---------- 7. difficulty never escapes the eligible pool ---------- */
{
  const s = Engine.newState();
  const ids = KPS.filter(function (k) { return k.level === "A0" && k.category !== "reading"; }).slice(0, 4);
  ids.forEach(function (kp) {
    const r = Engine.ensure(s, kp.id);
    r.state = "primed";
  });
  const sess = Engine.buildSession(s, 10);
  const allowed = {};
  ids.forEach(function (kp) { allowed[kp.id] = true; });
  ok("every question comes from an introduced point",
    sess.items.every(function (it) { return allowed[it.kpId]; }),
    sess.items.map(function (it) { return it.kpId; }).join(","));
  ok("no question is served twice in a session",
    new Set(sess.items.map(function (it) { return it.itemId; })).size === sess.items.length);
}

/* ---------- 8. no double counting ---------- */
{
  const s = Engine.newState();
  Engine.applyAttempt(s, { kpId: KP.id, itemId: KP.items[2].id, correct: true, accent: true });
  eq("one answer is one attempt", s.attempts.length, 1);
  eq("one answer is one evidence count", s.kps[KP.id].n, 1);
  eq("one answer is one correct", s.kps[KP.id].correct, 1);
  const before = JSON.stringify(s.kps[KP.id]);
  Engine.applyAttempt(s, { kpId: KP.id, itemId: KP.items[2].id, correct: null });
  eq("a skip changes nothing", JSON.stringify(s.kps[KP.id]), before);
}

console.log(checks + " mastery and difficulty checks passed.");
