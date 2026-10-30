/* Saved-profile migration checks: node tools/check_state_migration.js
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
vm.runInContext(code + "\n;globalThis.t = { Engine: Engine, KPS: KPS };", ctx);
const { Engine, KPS } = ctx.t;

let checks = 0;
function ok(name, cond, extra) {
  checks++;
  assert.ok(cond, name + (extra ? " — " + extra : ""));
}
function eq(name, actual, expected) {
  checks++;
  assert.equal(actual, expected, name + " (got " + JSON.stringify(actual) + ")");
}

/* ---------- what counts as a profile ---------- */
ok("a fresh state is a profile", Engine.migrateState(Engine.newState()) !== null);
ok("null is not", Engine.migrateState(null) === null);
ok("a string is not", Engine.migrateState("hello") === null);
ok("an array is not", Engine.migrateState([]) === null);
ok("an unrelated object is not", Engine.migrateState({ hello: 1 }) === null);
ok("an object with kps is", Engine.migrateState({ kps: {} }) !== null);
ok("an object with only attempts is", Engine.migrateState({ attempts: [] }) !== null);

/* ---------- version 1 saves survive ---------- */
{
  const v1 = {
    version: 1,
    kps: { "a0.etre.present": { p: 0.82, n: 6, correct: 5, wrong: 1 } },
    attempts: [{ itemId: "a0.etre.present.i1", kpId: "a0.etre.present", correct: true, at: 1700000000000, source: "kwiz" }],
    sessions: [{ at: 1700000000000, total: 3, correct: 2 }],
    goal: 30,
    streak: { count: 4, last: "2026-10-29" }
  };
  const m = Engine.migrateState(v1);
  eq("v1 is upgraded to the current version", m.version, Engine.STATE_VERSION);
  eq("scores are kept", m.kps["a0.etre.present"].p, 0.82);
  eq("attempts are kept", m.attempts.length, 1);
  eq("sessions are kept", m.sessions.length, 1);
  eq("the daily goal is kept", m.goal, 30);
  eq("the streak is kept", m.streak.count, 4);
  ok("a field added later gets its default", m.accentLenient === true);
}

/* ---------- a profile from before any of the current fields ---------- */
{
  const ancient = { kps: {}, attempts: [] };   // no version, no settings, no notebook
  const m = Engine.migrateState(ancient);
  ok("a version-less profile still loads", m !== null);
  eq("it is stamped with the current version", m.version, Engine.STATE_VERSION);
  ok("the notebook is created", Array.isArray(m.notebook.items) && Array.isArray(m.notebook.kps));
  ok("the vocabulary store is created", typeof m.vocab === "object" && m.vocab !== null);
  ok("the verb store is created", typeof m.verbs === "object" && m.verbs !== null);
  ok("the sentence store is created", typeof m.sentences === "object" && m.sentences !== null);
  eq("the daily goal falls back to the default", m.goal, Engine.newState().goal);
  ok("accent matching defaults to lenient", m.accentLenient === true);
}

/* ---------- a newer profile is not rejected ---------- */
{
  const future = { version: 99, kps: { x: { p: 0.7, n: 3 } }, attempts: [], somethingNew: [1, 2] };
  const m = Engine.migrateState(future);
  ok("a future version still loads", m !== null);
  ok("unknown fields are preserved, not dropped", Array.isArray(m.somethingNew) && m.somethingNew.length === 2);
  eq("it is stamped with the version this build understands", m.version, Engine.STATE_VERSION);
}

/* ---------- broken point records are repaired, not propagated ---------- */
{
  const broken = {
    kps: {
      "a0.etre.present": { p: "high", n: null },
      "a0.avoir.present": { p: NaN, n: -3 },
      "a0.articles.definite": null,
      "a0.pronouns.subject": { p: 0.6, n: 4, correct: 3, wrong: 1 }
    },
    attempts: []
  };
  const m = Engine.migrateState(broken);
  const a = m.kps["a0.etre.present"];
  ok("a text probability becomes a number", typeof a.p === "number" && isFinite(a.p));
  eq("a null evidence count becomes zero", a.n, 0);
  const b = m.kps["a0.avoir.present"];
  ok("NaN does not survive", isFinite(b.p) && isFinite(b.n));
  eq("a negative count is clamped", b.n, 0);
  ok("a null record is dropped", !("a0.articles.definite" in m.kps));
  eq("a healthy record is untouched", m.kps["a0.pronouns.subject"].p, 0.6);

  /* The point of the repair: scores must stay numbers, not NaN. */
  const score = Engine.scoreOf(m, "a0.etre.present");
  ok("the repaired point scores as a number", typeof score === "number" && isFinite(score), String(score));
}

/* ---------- broken attempt rows are dropped, good ones kept ---------- */
{
  const messy = {
    kps: {},
    attempts: [
      { itemId: "a.i1", kpId: "a", correct: true, at: 1700000000000 },
      null,
      { kpId: "a", correct: true },                       // no item id
      { itemId: "a.i2", correct: false, at: "yesterday" }, // bad timestamp
      { itemId: "a.i3", kpId: "a", correct: null, at: 1700000000001, accent: true }
    ]
  };
  const m = Engine.migrateState(messy);
  eq("only usable rows survive", m.attempts.length, 2);
  ok("a skipped answer with a timestamp is kept", m.attempts.some(function (x) { return x.correct === null; }));
  ok("the accent flag survives", m.attempts.some(function (x) { return x.accent === true; }));
}

/* ---------- settings booleans keep an explicit false ---------- */
{
  const off = { kps: {}, attempts: [], accentLenient: false, autoAdvance: false };
  const m = Engine.migrateState(off);
  eq("lenient accents stay off", m.accentLenient, false);
  eq("auto-advance stays off", m.autoAdvance, false);
}

/* ---------- migration is idempotent ---------- */
{
  const once = Engine.migrateState({ version: 1, kps: { a: { p: 0.5, n: 2 } }, attempts: [] });
  const twice = Engine.migrateState(JSON.parse(JSON.stringify(once)));
  eq("running it again changes nothing", JSON.stringify(twice.kps), JSON.stringify(once.kps));
  eq("the version is stable", twice.version, once.version);
}

/* ---------- an exported file round-trips ---------- */
{
  const live = Engine.newState();
  live.kps["a0.etre.present"] = { p: 0.8, n: 5, correct: 4, wrong: 1, dueAt: 1700000000000 };
  live.attempts.push({ itemId: "a0.etre.present.i1", kpId: "a0.etre.present", correct: true, at: 1700000000000, source: "kwiz" });
  /* What the export button writes: the state plus metadata. */
  const exported = Object.assign({}, live, { exportedAt: "2026-10-30T00:00:00.000Z", app: "kwizlocal", appVersion: Engine.STATE_VERSION });
  const back = Engine.migrateState(JSON.parse(JSON.stringify(exported)));
  eq("the round trip keeps the score", back.kps["a0.etre.present"].p, 0.8);
  eq("the round trip keeps the attempt", back.attempts.length, 1);
  ok("export metadata is harmless", back !== null);
}

/* ---------- the practice outlook explains itself ---------- */
{
  const fresh = Engine.newState();
  const a = Engine.practiceOutlook(fresh);
  eq("a fresh profile cannot practise yet", a.canPractise, false);
  eq("and says why", a.reason, "nothing-introduced");
  ok("and names the next lesson", !!a.nextLesson);

  const started = Engine.newState();
  const first = Engine.nextNewPoint(started);
  const s = Engine.ensure(started, first.id);
  s.state = "primed";
  const b = Engine.practiceOutlook(started);
  eq("once a lesson is introduced, practice opens", b.canPractise, true);
  eq("and the reason is ok", b.reason, "ok");
}

console.log(checks + " state-migration checks passed.");
