/* Every clickable thing has to look clickable.

   A button with `background:none;border:none` and no underline is just text
   with a cursor — it works, and nobody presses it. This tool reads the markup
   and the stylesheet and reports any interactive class that ends up with no
   edge, no fill and no underline.

   It is a heuristic: it looks for a border, a background or an underline
   anywhere in the rules that mention the class. That is exactly the property
   that was missing, so the heuristic is the requirement. */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const APP = path.join(ROOT, "app");
const js = fs.readFileSync(path.join(APP, "app.js"), "utf8");
const css = fs.readFileSync(path.join(APP, "styles.css"), "utf8");

/* ---- what the markup says ------------------------------------------------ */

const interactive = new Map();   // class-string -> sample tag
const tagRe = /<(button|a)\b[^>]*\bclass="([^"]*)"/g;
let m;
while ((m = tagRe.exec(js))) {
  const cls = m[2];
  /* Dynamic class strings (' + cls + ') cannot be resolved statically. */
  if (cls.indexOf("'") >= 0 || cls.indexOf("+") >= 0) continue;
  if (!interactive.has(cls)) interactive.set(cls, m[1]);
}

/* ---- what the stylesheet says ------------------------------------------- */

/* Every rule whose selector mentions the class, ignoring `:not(...)` — a rule
   like `a:not(.btn){text-decoration:underline}` must not be read as "the .btn
   class has an underline". That false positive is exactly how an invisible
   button would slip through. */
function ruleBodies(cls) {
  const safe = cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hit = new RegExp("\\." + safe + "(?![\\w-])");
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    let sel = m[1].trim();
    if (!sel || sel.charAt(0) === "@") continue;
    sel = sel.replace(/:not\([^)]*\)/g, "");
    if (hit.test(sel)) out.push(m[2]);
  }
  return out;
}

function hasAffordance(body) {
  const border = /border(?:-top|-right|-bottom|-left)?\s*:\s*([^;]+)/g;
  let b;
  while ((b = border.exec(body))) {
    const v = b[1].trim();
    if (!/^(none|0|0px)$/.test(v)) return "border";
  }
  const bg = /background(?:-color)?\s*:\s*([^;]+)/g;
  while ((b = bg.exec(body))) {
    const v = b[1].trim();
    if (!/^(none|transparent|0)$/.test(v)) return "background";
  }
  if (/text-decoration\s*:\s*underline/.test(body)) return "underline";
  return null;
}

/* A class is covered if it, or any other class in the same class attribute,
   provides an edge, a fill or an underline. */
function coverage(cls) {
  const tokens = cls.split(/\s+/).filter(Boolean);
  for (const t of tokens) {
    for (const body of ruleBodies(t)) {
      const kind = hasAffordance(body);
      if (kind) return { kind, via: t };
    }
  }
  return null;
}

/* Navigation and content blocks are allowed to be edge-less: the tab bar is
   chrome, and a tile carries its own colour. Everything else must have one. */
const ALLOWED = new Set([
  "tabbar-item",  // mobile tab bar: icon + label, active state carries it
  "next-step",    // (kept listed so the reason is written down, even if fixed)
]);

const missing = [];
const covered = [];
for (const [cls, tag] of interactive) {
  const hit = coverage(cls);
  if (hit) covered.push({ cls, tag, ...hit });
  else if (!ALLOWED.has(cls)) missing.push({ cls, tag });
}

console.log("interactive classes checked:", interactive.size);
console.log("with an edge, a fill or an underline:", covered.length);
const byKind = {};
covered.forEach(c => { byKind[c.kind] = (byKind[c.kind] || 0) + 1; });
console.log("  " + Object.keys(byKind).map(k => k + " " + byKind[k]).join(" · "));

if (process.argv.indexOf("--list") >= 0) {
  covered.forEach(c => console.log("  " + c.kind.padEnd(9) + " via ." + c.via.padEnd(14) + ' class="' + c.cls + '"'));
}

if (missing.length) {
  console.log("\nNO AFFORDANCE (" + missing.length + "):");
  missing.forEach(m => console.log("  <" + m.tag + ' class="' + m.cls + '">'));
  console.log("\ncontrols check FAILED");
  process.exit(1);
}
console.log("\ncontrols check passed.");
