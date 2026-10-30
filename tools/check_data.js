/* Data integrity check for data.js: run with node tools/check_data.js */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const APP = path.join(__dirname, "..", "app");
const src = ["data.js", "extra.js"]
  .map(function (f) { return fs.readFileSync(path.join(APP, f), "utf8"); })
  .join("\n;\n");
const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(src + "\n;globalThis.__data = { KPS: KPS, LEVELS: LEVELS, CATEGORIES: CATEGORIES };", sandbox);
const KPS = sandbox.__data.KPS;
const LEVELS = sandbox.__data.LEVELS;
const CATEGORIES = sandbox.__data.CATEGORIES;

let problems = 0;
const fail = function (msg) { console.log("FAIL  " + msg); problems++; };

const ids = new Set();
const levelIds = new Set(LEVELS.map(function (l) { return l.id; }));

KPS.forEach(function (kp) {
  if (ids.has(kp.id)) fail("duplicate kp id: " + kp.id);
  ids.add(kp.id);

  if (!levelIds.has(kp.level)) fail(kp.id + ": unknown level " + kp.level);
  if (!CATEGORIES[kp.category]) fail(kp.id + ": unknown category " + kp.category);
  if (!kp.rule || kp.rule.length < 10) fail(kp.id + ": rule too short");
  if (!kp.examples || !kp.examples.length) fail(kp.id + ": no examples");
  if (!kp.pitfall) fail(kp.id + ": no pitfall");
  /* 5 is the baseline; a point that needs more drill material (tense contrast,
     for example) may carry up to 12. Pre-learn still uses items 2–4. */
  if (kp.items.length < 5) fail(kp.id + ": " + kp.items.length + " items (expected at least 5)");
  if (kp.items.length > 16) fail(kp.id + ": " + kp.items.length + " items (max 16)");

  /* A guided question may name the grammar ("___ livre (masculine)") because
     it is the first exposure. A check or kwiz question must not: the bracket
     hands over the answer and turns the item into a reading exercise. */
  /* Only a bracket that *is* the grammar label leaks the answer. "(feminine
     douce)" hands you a form to transform, "(formal letter)" names the task,
     and "(that one, f.)" disambiguates the referent — none of those give the
     answer away. */
  const GIVEAWAY = /\((masculine|feminine|plural|singular|formal|informal)(\s*,[^)]*)?\)/i;
  kp.items.forEach(function (it) {
    if (it.stage === "guided") return;
    if (GIVEAWAY.test(String(it.prompt))) {
      fail(it.id + ": prompt gives the grammar away (" + it.prompt + ")");
    }
  });

  /* The same prompt twice inside one point is a data bug, not variety: the
     learner sees the identical question again and learns nothing. */
  const prompts = {};
  kp.items.forEach(function (it) {
    const key = String(it.prompt).trim().toLowerCase();
    if (prompts[key]) fail(kp.id + ": duplicate prompt (" + it.prompt + ")");
    prompts[key] = true;
  });

  kp.items.forEach(function (it) {
    if (!it.answer) fail(it.id + ": missing answer");
    if (!it.explain) fail(it.id + ": missing explanation");
    if (it.type === "choice") {
      if (!it.options || it.options.length < 2) fail(it.id + ": choice with <2 options");
      else {
        const hit = it.options.some(function (o) {
          return String(o).toLowerCase().trim() === String(it.answer).toLowerCase().trim();
        });
        if (!hit) fail(it.id + ": answer not among options (" + it.answer + ")");
        // Case differences are intentional in some items (lowercase rules),
        // so only exact duplicates count as a problem.
        const dup = new Set(it.options.map(function (o) { return String(o).trim(); }));
        if (dup.size !== it.options.length) fail(it.id + ": duplicate options");
      }
    }
  });
});

KPS.forEach(function (kp) {
  (kp.prereqs || []).forEach(function (p) {
    if (!ids.has(p)) fail(kp.id + ": missing prereq " + p);
  });
});

const itemIds = new Set();
KPS.forEach(function (kp) {
  kp.items.forEach(function (it) {
    if (itemIds.has(it.id)) fail("duplicate item id: " + it.id);
    itemIds.add(it.id);
  });
});

const byLevel = {};
KPS.forEach(function (k) { byLevel[k.level] = (byLevel[k.level] || 0) + 1; });
const byType = {};
KPS.forEach(function (k) { k.items.forEach(function (i) { byType[i.type] = (byType[i.type] || 0) + 1; }); });

console.log("");
console.log("points:", KPS.length, "items:", itemIds.size);
console.log("by level:", JSON.stringify(byLevel));
console.log("by item type:", JSON.stringify(byType));

/* Depth per level: the thing that keeps a learner from memorising the
   question instead of the rule. Report it so a regression is visible. */
const depth = {};
KPS.filter(function (k) { return k.category !== "reading"; }).forEach(function (k) {
  const d = depth[k.level] = depth[k.level] || { n: 0, items: 0, min: 99 };
  d.n++; d.items += k.items.length;
  d.min = Math.min(d.min, k.items.length);
});
const depthStr = Object.keys(depth).map(function (l) {
  const d = depth[l];
  return l + " avg " + (d.items / d.n).toFixed(1) + " min " + d.min;
}).join(" · ");
console.log("depth (non-reading):", depthStr);
const thin = KPS.filter(function (k) { return k.category !== "reading" && k.items.length < 8; });
if (thin.length) console.log("thin points (<8 items):", thin.length, thin.slice(0, 8).map(function (k) { return k.id; }).join(", "));
console.log(problems ? "\n" + problems + " problem(s) found." : "\nNo problems found.");
process.exit(problems ? 1 : 0);
