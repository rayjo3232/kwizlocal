/* Project the curriculum to JSON.
 *
 *   node tools/export_content.js            # write content/curriculum.json
 *   node tools/export_content.js --check    # exit 1 if the file on disk is stale
 *
 * `app/data.js` is the single source of truth. This file exists so the course
 * can be inspected, diffed and fed to other tools without anyone editing a
 * second copy by hand — which is exactly how the old content/kp/*.json drafts
 * ended up describing a course the app never loaded.
 *
 * Ids are the app's own (`a0.articles.definite`). The legacy drafts used a
 * `fr.` prefix (`fr.a1.negation.ne_pas`); see content/README.md for the map.
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const APP = path.join(ROOT, "app");
const OUT = path.join(ROOT, "content", "curriculum.json");
const FILES = ["data.js", "extra.js", "curriculum.js", "deep.js", "zh.js", "contrast.js", "engine.js"];

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(
  FILES.map(function (f) { return fs.readFileSync(path.join(APP, f), "utf8"); }).join("\n;\n")
    + "\n;globalThis.t = { KPS, LEVELS, CATEGORIES, DEEP, ZH, CONTRAST, Engine };",
  ctx
);
const { KPS, LEVELS, CATEGORIES, DEEP, ZH, CONTRAST, Engine } = ctx.t;

const points = KPS.map(function (kp) {
  const deep = DEEP[kp.id] || null;
  return {
    id: kp.id,
    level: kp.level,
    category: kp.category,
    categoryLabel: CATEGORIES[kp.category] || kp.category,
    title: kp.title,
    titleFr: kp.titleFr || "",
    titleZh: ZH[kp.id] || "",
    stage: kp.stage,
    order: kp.order,
    weight: kp.weight,
    difficulty: kp.difficulty,
    prereqs: kp.prereqs || [],
    soft: kp.soft || [],
    rule: kp.rule,
    pitfall: kp.pitfall || "",
    examples: kp.examples || [],
    contrastZh: CONTRAST[kp.id] || "",
    deep: deep ? { usage: deep.usage || "", more: deep.more || "", tip: deep.tip || "" } : null,
    items: kp.items.map(function (it) {
      return {
        id: it.id,
        type: it.type,
        stage: it.stage,
        difficulty: it.difficulty,
        prompt: it.prompt,
        options: it.options || null,
        answer: it.answer,
        accept: it.accept || null,
        explain: it.explain,
        hint: it.hint || null
      };
    })
  };
});

const payload = {
  generated: {
    from: "app/data.js",
    by: "tools/export_content.js",
    stateVersion: Engine.STATE_VERSION,
    note: "Do not edit by hand — run the exporter instead."
  },
  levels: LEVELS,
  totals: {
    points: points.length,
    items: points.reduce(function (n, p) { return n + p.items.length; }, 0),
    withChineseTitle: points.filter(function (p) { return p.titleZh; }).length,
    withContrastNote: points.filter(function (p) { return p.contrastZh; }).length,
    withDeep: points.filter(function (p) { return p.deep; }).length
  },
  points: points
};

const text = JSON.stringify(payload, null, 2) + "\n";

if (process.argv.indexOf("--check") >= 0) {
  let current = "";
  try { current = fs.readFileSync(OUT, "utf8"); } catch (e) { current = ""; }
  if (current !== text) {
    console.log("content/curriculum.json is out of date — run: node tools/export_content.js");
    process.exit(1);
  }
  console.log("content/curriculum.json matches app/data.js (" + payload.totals.points + " points, " + payload.totals.items + " items).");
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, text);
console.log("wrote content/curriculum.json — " + payload.totals.points + " points, "
  + payload.totals.items + " items, " + Math.round(text.length / 1024) + " KB");
