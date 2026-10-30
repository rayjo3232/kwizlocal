/* UI token check: node tools/check_ui_tokens.js
   No dependencies — reads the stylesheet as text. */
const fs = require("node:fs");
const path = require("node:path");

const CSS = path.join(__dirname, "..", "app", "styles.css");
const css = fs.readFileSync(CSS, "utf8");

let problems = 0;
function fail(msg) { console.log("FAIL  " + msg); problems++; }
function ok(msg) { console.log("ok    " + msg); }

/* ---------- one text scale ---------- */
const SCALE = ["--fs-1", "--fs-2", "--fs-3", "--fs-4", "--fs-5", "--fs-6"];
SCALE.forEach(function (t) {
  if (css.indexOf(t + ":") < 0) fail("missing type token " + t);
});
if (problems === 0) ok("the six type tokens are defined");

const tokenised = (css.match(/font-size:var\(--fs-[1-6]\)/g) || []).length;
const raw = css.match(/font-size:[0-9.]+px/g) || [];

/* Two display sizes are allowed to sit outside the scale: the flashcard word
   and the exam score. Anything else is a size that escaped the system. */
const ALLOWED_RAW = 2;
if (raw.length > ALLOWED_RAW) {
  fail("font-size in raw px: " + raw.length + " (only the two display sizes may be raw) — " + raw.slice(0, 6).join(", "));
} else {
  ok(tokenised + " text sizes resolve to the scale, " + raw.length + " display size(s) stay raw");
}

/* The old file carried sizes half a pixel apart; that is what made every line
   look equally important. Nothing may reintroduce them. */
const halfPixels = (css.match(/font-size:[0-9]+\.[0-9]+px/g) || []);
if (halfPixels.length) fail("half-pixel font sizes came back: " + halfPixels.slice(0, 5).join(", "));
else ok("no half-pixel font sizes");

/* ---------- one spacing step for the page header ---------- */
if (!/\.page-head\{[^}]*text-align:left/.test(css)) {
  fail("page heads are centred again — they should start at the same edge as the cards");
} else {
  ok("page heads are left-aligned");
}

console.log("");
if (problems) {
  console.log(problems + " problem(s) found.");
  process.exit(1);
}
console.log("UI token checks passed.");
