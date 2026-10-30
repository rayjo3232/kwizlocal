/* Curriculum graph checks: node tools/check_curriculum.js
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
vm.runInContext(code + "\n;globalThis.t = { KPS, KP_BY_ID, LEVELS, Engine, CURRICULUM_ORDER, CURRICULUM_SOFT };", ctx);
const { KPS, KP_BY_ID, LEVELS, Engine, CURRICULUM_ORDER, CURRICULUM_SOFT } = ctx.t;

const levelIndex = function (lv) { return LEVELS.map(function (l) { return l.id; }).indexOf(lv); };
let problems = 0;
function fail(msg) { console.log("FAIL  " + msg); problems++; }
function ok(msg) { console.log("ok    " + msg); }

/* ---------- 1. the order list covers the course exactly ---------- */
{
  const listed = {};
  const dupes = [];
  const unknown = [];
  Object.keys(CURRICULUM_ORDER).forEach(function (lv) {
    if (levelIndex(lv) < 0) fail("order list has an unknown level: " + lv);
    CURRICULUM_ORDER[lv].forEach(function (id) {
      if (listed[id]) dupes.push(id);
      listed[id] = true;
      const kp = KP_BY_ID[id];
      if (!kp) { unknown.push(id); return; }
      if (kp.level !== lv) fail("order lists " + id + " under " + lv + " but it is " + kp.level);
    });
  });
  if (dupes.length) fail("duplicate ids in the order list: " + dupes.slice(0, 5).join(", "));
  if (unknown.length) fail("order list names points that do not exist: " + unknown.slice(0, 5).join(", "));

  const missing = KPS.filter(function (k) { return !listed[k.id]; }).map(function (k) { return k.id; });
  if (missing.length) fail("points missing from the order list (they fall back to the end): " + missing.slice(0, 5).join(", "));
  else ok("every point has an explicit position (" + KPS.length + ")");
}

/* ---------- 2. positions are unique within a level ---------- */
{
  const seen = {};
  let clash = 0;
  KPS.forEach(function (kp) {
    const key = kp.level + ":" + kp.order;
    if (seen[key]) { clash++; fail("two points share order " + kp.order + " in " + kp.level + ": " + seen[key] + ", " + kp.id); }
    seen[key] = kp.id;
  });
  if (!clash) ok("positions are unique inside each level");
}

/* ---------- 3. hard prerequisites are real, same-level or lower, acyclic ---------- */
{
  let missing = 0, cross = 0, self = 0;
  KPS.forEach(function (kp) {
    (kp.prereqs || []).forEach(function (id) {
      const pre = KP_BY_ID[id];
      if (!pre) { missing++; fail(kp.id + " requires " + id + " which does not exist"); return; }
      if (id === kp.id) { self++; fail(kp.id + " requires itself"); return; }
      if (levelIndex(pre.level) > levelIndex(kp.level)) {
        cross++;
        fail(kp.id + " (" + kp.level + ") requires " + id + " (" + pre.level + ")");
      }
    });
  });
  if (!missing && !cross && !self) ok("hard prerequisites exist, are same-level or lower, and are not self-referential");

  /* cycle detection over hard edges only */
  const state = {};
  const cycles = [];
  const walk = function (id, trail) {
    if (state[id] === 1) { cycles.push(trail.slice(trail.indexOf(id)).concat(id).join(" -> ")); return; }
    if (state[id] === 2) return;
    state[id] = 1;
    (KP_BY_ID[id].prereqs || []).forEach(function (p) { if (KP_BY_ID[p]) walk(p, trail.concat(id)); });
    state[id] = 2;
  };
  KPS.forEach(function (kp) { walk(kp.id, [kp.id]); });
  if (cycles.length) fail("prerequisite cycles: " + cycles.slice(0, 3).join(" | "));
  else ok("no prerequisite cycles");
}

/* ---------- 4. soft prerequisites are advisory and consistent ---------- */
{
  let bad = 0;
  Object.keys(CURRICULUM_SOFT).forEach(function (id) {
    const kp = KP_BY_ID[id];
    if (!kp) { bad++; fail("soft prerequisites listed for unknown point " + id); return; }
    CURRICULUM_SOFT[id].forEach(function (pre) {
      if (!KP_BY_ID[pre]) { bad++; fail(id + " has a soft prerequisite that does not exist: " + pre); return; }
      if ((kp.prereqs || []).indexOf(pre) >= 0) {
        bad++;
        fail(id + " lists " + pre + " as both hard and soft — pick one");
      }
      if (pre === id) { bad++; fail(id + " is its own soft prerequisite"); }
    });
  });
  if (!bad) ok("soft prerequisites are real, not duplicated as hard ones (" + Object.keys(CURRICULUM_SOFT).length + " entries)");
}

/* ---------- 5. nothing is unreachable ---------- */
{
  /* Lower-level prerequisites are assumed when you start at a level; the model
     matches prereqReady(). A point that can never satisfy its prerequisites is
     a dead end the learner would be stuck behind. */
  const reachable = {};
  let changed = true;
  while (changed) {
    changed = false;
    KPS.forEach(function (kp) {
      if (reachable[kp.id]) return;
      const okAll = (kp.prereqs || []).every(function (id) {
        const pre = KP_BY_ID[id];
        if (!pre) return false;
        return reachable[id] || levelIndex(pre.level) < levelIndex(kp.level);
      });
      if (okAll) { reachable[kp.id] = true; changed = true; }
    });
  }
  const stuck = KPS.filter(function (k) { return !reachable[k.id]; });
  if (stuck.length) fail("unreachable points (deadlock): " + stuck.slice(0, 5).map(function (k) { return k.id; }).join(", "));
  else ok("every point can be reached from a starting point");
}

/* ---------- 6. the order respects prerequisites ---------- */
{
  const violations = [];
  KPS.forEach(function (kp) {
    (kp.prereqs || []).forEach(function (id) {
      const pre = KP_BY_ID[id];
      if (!pre || pre.level !== kp.level) return;   // cross-level is checked above
      if (pre.order >= kp.order) violations.push(kp.id + " (#" + kp.order + ") comes before its prerequisite " + id + " (#" + pre.order + ")");
    });
  });
  if (violations.length) fail("teaching order contradicts prerequisites:\n        " + violations.slice(0, 6).join("\n        "));
  else ok("every point comes after its same-level prerequisites");
}

/* ---------- 7. each level has a usable entry ---------- */
{
  LEVELS.forEach(function (lv) {
    const pts = KPS.filter(function (k) { return k.level === lv.id; });
    if (!pts.length) return;
    const grammarRoots = pts.filter(function (k) {
      return k.category !== "reading" && (k.prereqs || []).length === 0;
    });
    const lowerAssumed = pts.filter(function (k) {
      return (k.prereqs || []).length > 0 && (k.prereqs || []).every(function (id) {
        return KP_BY_ID[id] && levelIndex(KP_BY_ID[id].level) < levelIndex(lv.id);
      });
    });
    if (!grammarRoots.length && !lowerAssumed.length) {
      fail(lv.id + " has no grammar entry point — a learner starting here would land on a reading passage");
    } else {
      ok(lv.id + " has " + (grammarRoots.length + lowerAssumed.length) + " grammar entry points");
    }
  });
}

/* ---------- 8. stage is assigned everywhere ---------- */
{
  const bad = KPS.filter(function (k) { return !k.stage; });
  if (bad.length) fail("points without a stage: " + bad.slice(0, 5).map(function (k) { return k.id; }).join(", "));
  else ok("every point has a stage");
}

/* ---------- 9. the scheduler agrees with the curriculum ---------- */
{
  const fresh = Engine.newState();
  const sched = Engine.schedule(fresh);
  if (sched.lesson.level !== "A0") fail("a fresh profile should start at A0, got " + sched.lesson.level);
  if (sched.lesson.category === "reading") fail("a fresh profile should not start with a reading passage");
  if (sched.active.length) fail("a fresh profile should have nothing active yet");

  const started = Engine.newState();
  const first = Engine.nextNewPoint(started);
  Engine.ensure(started, first.id).state = "primed";
  const after = Engine.schedule(started);
  if (after.buckets.current.length !== 1) fail("the introduced lesson should sit in the current bucket");
  if (after.active.length !== 1) fail("only the introduced lesson should be active");

  const reason = Engine.lessonReason(started, first);
  if (!/waiting for its first answers|Introduced/.test(reason)) fail("unexpected reason for a primed lesson: " + reason);

  const locked = KPS.find(function (k) { return k.level === "B2"; });
  const lockedReason = Engine.lessonReason(started, locked);
  if (!/^Needs /.test(lockedReason)) fail("a locked B2 point should explain what it needs, got: " + lockedReason);
}

console.log("");
if (problems) {
  console.log(problems + " problem(s) found.");
  process.exit(1);
}
console.log("Curriculum graph checks passed.");
