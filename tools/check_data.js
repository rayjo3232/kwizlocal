/* Data integrity check for data.js: run with node tools/check_data.js */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const APP = path.join(__dirname, "..", "app");
const src = fs.readFileSync(path.join(APP, "data.js"), "utf8");
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
  if (kp.items.length !== 5) fail(kp.id + ": " + kp.items.length + " items (expected 5)");

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
console.log(problems ? "\n" + problems + " problem(s) found." : "\nNo problems found.");
process.exit(problems ? 1 : 0);
