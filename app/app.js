/* UI + routing. Plain JS, no build step, works from file://. */

const LS_STATE = "kwizlocal.state.v1";
const LS_SESSION = "kwizlocal.session.v1";
const LS_PLACEMENT = "kwizlocal.placement.v1";
const LS_EXAM = "kwizlocal.exam.v1";

let state = loadState();
let session = loadSession();
let prelearn = null;
let placement = loadPlacement();
let exam = loadExam();
let examTimer = null;
let drawerReturn = null;   // element to give focus back to when the drawer closes

const app = document.getElementById("app");
const tooltip = document.getElementById("tooltip");
const drawer = document.getElementById("drawer");
const drawerBody = document.getElementById("drawerBody");
const drawerTitle = document.getElementById("drawerTitle");
const scrim = document.getElementById("scrim");

/* ---------------- storage ---------------- */

let stateRescued = false;
let saveFailed = false;

/* Anything stored under our key is treated as the learner's data. If it cannot
   be read, it is copied aside before a fresh profile replaces it — the old
   loader simply dropped the profile when `version` was not 1. */
function rescueStoredState(raw) {
  try {
    const key = LS_STATE + ".rescue." + Date.now();
    localStorage.setItem(key, raw);
    localStorage.setItem(LS_STATE + ".rescue.last", key);
    stateRescued = true;
  } catch (e) { /* out of quota: nothing more we can do */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_STATE);
    if (raw) {
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
      const migrated = Engine.migrateState(parsed);
      if (migrated) return migrated;
      rescueStoredState(raw);
    }
  } catch (e) { /* file:// may block storage */ }
  return Engine.newState();
}

function saveState() {
  try {
    localStorage.setItem(LS_STATE, JSON.stringify(state));
    saveFailed = false;
  } catch (e) {
    /* Silently swallowing this meant answers kept landing in memory and
       vanished on reload. Say it once. */
    if (!saveFailed) {
      saveFailed = true;
      try { toast("Could not save progress — browser storage is full. Export a backup."); } catch (_) {}
    }
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(LS_SESSION);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function loadExam() {
  try {
    const raw = localStorage.getItem(LS_EXAM);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function saveExam() {
  try {
    if (exam) localStorage.setItem(LS_EXAM, JSON.stringify(exam));
    else localStorage.removeItem(LS_EXAM);
  } catch (e) {}
}

function loadPlacement() {
  try {
    const raw = localStorage.getItem(LS_PLACEMENT);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function savePlacement() {
  try {
    if (placement) localStorage.setItem(LS_PLACEMENT, JSON.stringify(placement));
    else localStorage.removeItem(LS_PLACEMENT);
  } catch (e) {}
}

function saveSession() {
  try {
    if (session) localStorage.setItem(LS_SESSION, JSON.stringify(session));
    else localStorage.removeItem(LS_SESSION);
  } catch (e) {}
}

/* ---------------- helpers ---------------- */

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* English prose that quotes French. Four passes:
   1. *asterisks* — French marked by hand in the data
   2. multi-word phrases, parked on placeholders so the word rules below
      cannot split them (est-ce que must not become est + ce + que)
   3. any word carrying an accent — English almost never uses one
   4. high-frequency French function words with no English homograph
   Wrapping twice is harmless (nested <i> looks identical), so we do not
   bother tracking what is already inside a tag. */
function frify(text) {
  var s = esc(text);

  s = s.replace(/\*([^*]+)\*/g, '<i class="fr-inline">$1</i>');

  var held = [];
  s = s.replace(/(?<![\w-])(qu'est-ce qu['e]|est-ce qu['e]|n'est-ce pas|est-ce|c'est|ce sont|il n'y a|il y a|s'il vous pla[iî]t|s'il te pla[iî]t|d'accord|au revoir)/gi,
    function (m) {
      held.push(m);
      return "\uE000" + (held.length - 1) + "\uE001";
    });

  s = s.replace(/([A-Za-z\u00C0-\u017F]*[\u00E0\u00E2\u00E7\u00E9\u00E8\u00EA\u00EB\u00EE\u00EF\u00F4\u00FB\u00F9\u00FC\u00FF\u0153\u00C0\u00C2\u00C7\u00C9\u00C8\u00CA\u00CB\u00CE\u00CF\u00D4\u00DB\u00D9\u00DC\u0178\u0152][A-Za-z\u00C0-\u017F'\u2019-]*)/g,
    '<i class="fr-inline">$1</i>');

  /* (?<!['’]) keeps quelqu'un and l'un whole — otherwise the "un" inside
     an elided word gets italicised on its own. */
  s = s.replace(/(?<!['\u2019])\b(le|la|les|un|une|des|du|au|aux|je|tu|nous|vous|ils|elles|est|sont|ne|pas|dans|pour|avec|mais|donc|tr\u00E8s|plus|moins|que|qui|ce|cet|cette|ces)\b/g,
    '<i class="fr-inline">$1</i>');

  return s.replace(/\uE000(\d+)\uE001/g, function (m, i) {
    return '<i class="fr-inline">' + held[+i] + "</i>";
  });
}

function stars(n) {
  let out = "";
  for (let i = 0; i < 5; i++) out += '<span class="' + (i < n ? "on" : "") + '">★</span>';
  return out;
}

function badge(status) {
  const map = {
    new: ["NEW", "new"], due: ["DUE", "due"], weak: ["WEAK", "weak"], ok: ["OK", "ok"],
    available: ["OPEN", "ok"], learning: ["LEARNING", "new"],
    solid: ["SOLID", "ok"], locked: ["LOCKED", "locked"]
  };
  const m = map[status] || map.new;
  return '<span class="badge ' + m[1] + '">' + m[0] + "</span>";
}

/* Seven states, because "new" was hiding three different situations: a point
   you could start right now, one whose prerequisites are missing, and one
   above your guided level. Library and the drawer both use this. */
function pointStatus(kp) {
  const prof = Engine.pointProfile(state, kp);
  const rank = function (lv) { return LEVELS.findIndex(function (l) { return l.id === lv; }); };

  if (prof.stage === "unseen") {
    if (rank(kp.level) > rank(Engine.guidedLevel(state))) return "locked";
    return Engine.prereqReady(state, kp) ? "available" : "locked";
  }
  if (prof.due) return "due";
  if (prof.stage === "primed" || !prof.seen) return "learning";
  if (prof.mastery != null && prof.mastery < 50) return "weak";
  if (prof.stage === "solid") return "solid";
  return "learning";
}

function passageHtml(item) {
  if (!item.passage) return "";
  const kpId = item.id.replace(/\.i\d+$/, "");
  const en = (typeof READING_EN !== "undefined" && READING_EN[kpId]) || "";
  const words = item.passage.split(/\s+/).filter(Boolean).length;
  const secs = Math.max(15, Math.round(words / 2.6));
  return '<div class="passage"><div class="passage-meta">'
    + words + " words · about " + secs + "s"
    + (en ? '<button class="passage-toggle" data-passage-toggle="1">Show translation</button>' : "")
    + '</div><div class="passage-fr">' + glossify(item.passage) + "</div>"
    + (en ? '<div class="passage-en" hidden>' + esc(en) + "</div>" : "")
    + "</div>";
}

function typeLabel(item) {
  if (item.topic === "vocab") return "Which word fits?";
  if (item.topic === "verbs") return "Conjugate the verb";
  if (item.type === "choice") return "Choose the correct answer";
  if (item.type === "fill" || item.type === "multi_fill") return "Complete the sentence";
  if (item.type === "correct") return "Correct the sentence";
  if (item.type === "translate") return "Translate into French";
  if (item.type === "dictation") return "Listen and write";
  if (item.type === "order") return "Put the words in order";
  return "Answer";
}

function scoreColor(score, n) {
  if (!n) return "var(--faint)";
  if (score < -10) return "var(--red)";
  if (score < 50) return "var(--yellow)";
  if (score < 75) return "#5FB56F";
  return "var(--green)";
}

function navigate(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(function () { el.classList.remove("show"); }, 1800);
}

/* Resolve an item id against a point: hand-written questions first, then the
   sentence bank (ids prefixed "sent."). */
function findItem(kp, itemId) {
  const s = String(itemId);
  if (s.indexOf("topic.") === 0) return topicItem(s);
  if (s.indexOf("sent.") === 0) return sentItem(s);
  if (!kp) return null;
  return kp.items.filter(function (i) { return i.id === itemId; })[0] || null;
}

/* Vocabulary cards, cloze, gender and conjugation drills all count as practice
   — they just do not move grammar mastery, because there is no grammar point
   to move. Logging them through the same pipeline is what makes the daily goal
   and the weekly card tell the truth: before this, ten minutes of vocabulary
   left the dashboard reading "0 questions today". */
function logTopicAnswer(source, itemId, correct) {
  Engine.applyAttempt(state, {
    kpId: null, itemId: itemId, correct: correct,
    source: source, noMastery: true
  });
}

function getItem(ref) {
  const kp = ref.kpId ? KP_BY_ID[ref.kpId] : null;
  const item = findItem(kp, ref.itemId);
  if (!item) return null;
  return { kp: kp || TOPIC_KP[item.topic], item: item };
}

function monthSessions() {
  const d = new Date();
  const y = d.getFullYear(), m = d.getMonth();
  return state.sessions.filter(function (s) {
    const x = new Date(s.at);
    return x.getFullYear() === y && x.getMonth() === m;
  }).length;
}

/* ---------------- treemap ---------------- */

function treemap(items, x, y, w, h) {
  if (!items.length || w <= 0 || h <= 0) return [];
  if (items.length === 1) return [{ item: items[0], x: x, y: y, w: w, h: h }];
  const total = items.reduce(function (s, i) { return s + i.value; }, 0);
  let acc = 0, idx = 0;
  while (idx < items.length - 1 && acc + items[idx].value < total / 2) {
    acc += items[idx].value;
    idx++;
  }
  if (idx <= 0) idx = 1;
  if (idx >= items.length) idx = items.length - 1;
  const a = items.slice(0, idx), b = items.slice(idx);
  const aVal = a.reduce(function (s, i) { return s + i.value; }, 0);
  const ratio = total ? aVal / total : 0.5;
  if (w >= h) {
    const w1 = w * ratio;
    return treemap(a, x, y, w1, h).concat(treemap(b, x + w1, y, w - w1, h));
  }
  const h1 = h * ratio;
  return treemap(a, x, y, w, h1).concat(treemap(b, x, y + h1, w, h - h1));
}

let mapFocus = null; // null | { level, category }

const CAT_SHORT = {
  articles: "ARTICLES", pronouns: "PRONOUNS", verbs: "VERBS",
  adjectives: "ADJ. & ADV.", prepositions: "PREP.", syntax: "STRUCTURE", expressions: "EXPRESSIONS", reading: "READING"
};

function groupByCategory(list) {
  const groups = {};
  list.forEach(function (k) {
    if (!groups[k.category]) groups[k.category] = [];
    groups[k.category].push(k);
  });
  return Object.keys(groups).map(function (cat) {
    return {
      cat: cat,
      kps: groups[cat],
      value: groups[cat].reduce(function (sum, k) { return sum + k.weight; }, 0)
    };
  });
}

/* Pointy-top hexagon, the shape Kwiziq tiles its Brainmap with. */
function hexPath(cx, cy, r) {
  let d = "";
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (60 * i - 30);
    d += (i ? "L" : "M") + (cx + r * Math.cos(a)).toFixed(1) + "," + (cy + r * Math.sin(a)).toFixed(1);
  }
  return d + "Z";
}

/* Pick the column count that yields the largest hexagon.

   Bisecting on the radius does not work: it happily accepts a single row of
   tiny hexagons because that also "fits". Enumerating columns and keeping the
   best radius fills the box properly. The radius is capped so that a level
   with only two or three points does not turn into three giant tiles. */
function hexGrid(n, w, h) {
  const MAX_R = 64, MIN_R = 10;
  let best = null;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const RbyW = (w / (cols + 0.5)) / Math.sqrt(3);
    const RbyH = h / (1.5 * (rows - 1) + 2);
    const R = Math.min(RbyW, RbyH, MAX_R);
    if (R < MIN_R) continue;
    /* Same radius in several layouts? Prefer the one closest to square, so
       five points do not end up in a single vertical column. */
    const square = Math.sqrt(n);
    const better = !best || R > best.R + 0.01 ||
      (Math.abs(R - best.R) <= 0.01 && Math.abs(cols - square) < Math.abs(best.cols - square));
    if (better) {
      best = {
        R: R,
        cols: cols,
        rows: rows,
        hexW: Math.sqrt(3) * R,
        rowStep: 1.5 * R,
        totalW: cols * Math.sqrt(3) * R + Math.sqrt(3) * R * 0.5,
        totalH: (rows - 1) * 1.5 * R + 2 * R
      };
    }
  }
  return best;
}

function kpCells(svg, kps, x, y, w, h, labels) {
  if (w <= 2 || h <= 2 || !kps.length) return;
  const g = hexGrid(kps.length, w, h);
  if (!g) return;

  const startX = x + (w - g.totalW) / 2;
  const startY = y + (h - g.totalH) / 2;

  kps.forEach(function (kp, i) {
    const row = Math.floor(i / g.cols);
    const col = i % g.cols;
    const offset = row % 2 ? g.hexW / 2 : 0;
    const cx = startX + col * g.hexW + g.hexW / 2 + offset;
    const cy = startY + row * g.rowStep + g.R;

    const st = state.kps[kp.id];
    const sc = st ? Engine.display(st.p, st.n) : 0;
    const n = st ? st.n : 0;
    const fill = Engine.colorFor(sc, n);

    svg.push('<path class="map-cell" data-kp="' + kp.id + '" d="' + hexPath(cx, cy, g.R * 0.93)
      + '" fill="' + fill + '"/>');

    if (labels !== false && g.R >= 14) {
      const short = kp.category === "reading" ? kp.title.replace("Reading: ", "") : kp.title.split(":")[0];
      const fs = Math.max(7, Math.min(11, g.R * 0.42));
      /* A hexagon only offers about 60% of its width as usable line length. */
      const maxChars = Math.max(3, Math.floor((g.hexW * 0.62) / (fs * 0.55)));
      const label = short.length > maxChars ? short.slice(0, maxChars - 1) + "…" : short;
      const dark = (n === 0 || (sc >= 0 && sc < 50));
      svg.push('<text class="map-label' + (dark ? " dark" : "") + '" x="' + cx.toFixed(1) + '" y="'
        + (cy + fs * 0.35).toFixed(1) + '" text-anchor="middle" style="font-size:' + fs.toFixed(1) + 'px">'
        + esc(label) + '</text>');
    }
  });
}

function categoryBlocks(svg, kps, x, y, w, h, showLabels, levelId) {
  if (!showLabels) {
    kpCells(svg, kps, x, y, w, h, false);
    return;
  }
  const cats = groupByCategory(kps);
  const rects = treemap(cats, x, y, w, h);
  rects.forEach(function (r) {
    const item = r.item;
    if (r.w < 6 || r.h < 6) return;
    const label = (CAT_SHORT[item.cat] || CATEGORIES[item.cat] || item.cat).toUpperCase();
    svg.push('<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="' + r.h + '" rx="3" fill="none" stroke="#E6E8EB"/>');
    const maxChars = Math.floor((r.w - 8) / 5.4);
    const canLabel = r.w > 56 && r.h > 40 && maxChars >= 6;
    const labelH = canLabel ? 14 : 2;
    if (canLabel) {
      const text = label.length > maxChars ? label.slice(0, maxChars - 1) + "…" : label;
      svg.push('<text x="' + (r.x + 5) + '" y="' + (r.y + 9) + '" font-size="8" font-weight="700" fill="#8A939E" letter-spacing=".02em">'
        + esc(text) + '</text>');
      svg.push('<line x1="' + (r.x + 3) + '" y1="' + (r.y + labelH - 2) + '" x2="' + (r.x + r.w - 3) + '" y2="' + (r.y + labelH - 2) + '" stroke="#E6E8EB"/>');
      svg.push('<rect data-cat="' + item.cat + '" data-cat-level="' + levelId + '" x="' + r.x + '" y="' + r.y
        + '" width="' + r.w + '" height="' + labelH + '" fill="transparent" style="cursor:pointer"/>');
    }
    kpCells(svg, item.kps, r.x + 1, r.y + labelH, r.w - 2, r.h - labelH - 1);
  });
}

function levelRegion(svg, rect, levelId, kps, showCategories) {
  const lvScore = Math.max(0, Math.round(Engine.levelScore(state, levelId)));
  const name = (LEVELS.filter(function (l) { return l.id === levelId; })[0] || { name: levelId }).name;
  svg.push('<rect x="' + rect.x + '" y="' + rect.y + '" width="' + rect.w + '" height="' + rect.h
    + '" rx="8" fill="#FAFBFC" stroke="#E6E8EB"/>');
  svg.push('<text x="' + (rect.x + 10) + '" y="' + (rect.y + 15) + '" font-size="10.5" font-weight="700" fill="#6B7480">'
    + esc(name) + ' · score ' + lvScore + '</text>');
  svg.push('<rect data-level="' + levelId + '" x="' + rect.x + '" y="' + rect.y + '" width="' + rect.w
    + '" height="' + Math.min(22, rect.h) + '" fill="transparent" style="cursor:pointer"/>');
  const pad = 4;
  categoryBlocks(svg, kps, rect.x + pad, rect.y + 22, rect.w - pad * 2, rect.h - 28, showCategories, levelId);
}

/* ---------- brainmap: card views ----------
   The SVG map scales a 1000-wide viewBox down to a phone screen, which makes
   every label unreadable. Levels and categories are therefore plain HTML
   cards that reflow; only the innermost point grid stays vector. */

function avgScoreOf(list) {
  let sum = 0, n = 0;
  list.forEach(function (k) {
    const s = state.kps[k.id];
    if (s && s.n) { sum += Engine.display(s.p, s.n); n++; }
  });
  return n ? Math.round(sum / n) : null;
}

function scoreTint(list) {
  const avg = avgScoreOf(list);
  const tested = list.filter(function (k) {
    const s = state.kps[k.id];
    return s && s.n;
  }).length;
  return Engine.colorFor(avg == null ? 0 : avg, tested);
}

function levelCardsHtml(compact) {
  return '<div class="bmap-levels' + (compact ? " compact" : "") + '">'
    + LEVELS.map(function (lv) {
      const list = KPS.filter(function (k) { return k.level === lv.id; });
      if (!list.length) return "";
      /* The dashboard clamps level scores at 0; this card did not, so B2 could
         read "-11" and look like a bug. */
      const raw = avgScoreOf(list);
      const score = raw == null ? null : Math.max(0, Math.round(raw));
      const weak = list.filter(function (k) {
        const s = state.kps[k.id];
        return Engine.guidedEligible(state, k) && Engine.hasStarted(state, k) && s && s.n && Engine.display(s.p, s.n) < 50;
      }).length;
      const due = list.filter(function (k) {
        const s = state.kps[k.id];
        return s && s.dueAt && s.dueAt <= Date.now();
      }).length;
      const unseen = list.filter(function (k) {
        const s = state.kps[k.id];
        return !s || !s.n;
      }).length;
      const cats = groupByCategory(list);
      const bar = cats.map(function (c) {
        const w = Math.max(8, Math.round(c.kps.length / list.length * 100));
        return '<i style="width:' + w + '%;background:' + scoreTint(c.kps) + '"></i>';
      }).join("");
      return '<button class="bmap-lv" data-level="' + lv.id + '">'
        + '<span class="bmap-lv-top"><b>' + esc(lv.name) + "</b>"
        + "<em>" + (score == null ? "—" : score) + "</em></span>"
        + '<span class="bmap-lv-bar">' + bar + "</span>"
        + '<span class="bmap-lv-meta">' + list.length + " points"
        + (unseen ? ' · <b class="new">' + unseen + " new</b>" : "")
        + (weak ? ' · <b class="weak">' + weak + " weak</b>" : "")
        + (due ? ' · <b class="due">' + due + " due</b>" : "") + "</span>"
        + "</button>";
    }).join("")
    + "</div>";
}

function categoryCardsHtml(levelId, compact) {
  const list = KPS.filter(function (k) { return k.level === levelId; });
  const cats = groupByCategory(list);
  return '<div class="bmap-cats' + (compact ? " compact" : "") + '">'
    + cats.map(function (c) {
      const score = avgScoreOf(c.kps);
      return '<button class="bmap-cat" data-cat="' + c.cat + '" data-cat-level="' + levelId + '">'
        + '<span class="bmap-cat-dot" style="background:' + scoreTint(c.kps) + '"></span>'
        + '<span class="bmap-cat-body"><b>' + esc(CATEGORIES[c.cat] || c.cat) + "</b>"
        + '<span class="bmap-cat-meta">' + c.kps.length + " points</span></span>"
        + '<em class="bmap-cat-score">' + (score == null ? "—" : score) + "</em>"
        + "</button>";
    }).join("")
    + "</div>";
}

function renderMap(height, compact) {
  const focus = compact ? null : mapFocus;
  if (focus && focus.category) return hexMapSvg(height, focus);
  if (focus) return categoryCardsHtml(focus.level, compact);
  return levelCardsHtml(compact);
}

/* Phone fallback for the hexagon grid: the same points as readable rows. */
function kpListHtml(list) {
  return '<div class="map-list">'
    + list.map(function (kp) {
      const s = state.kps[kp.id];
      const n = s ? s.n : 0;
      const sc = s ? Engine.display(s.p, s.n) : 0;
      return '<div class="map-row" data-kp="' + kp.id + '">'
        + '<span class="mr-dot" style="background:' + Engine.colorFor(sc, n) + '"></span>'
        + '<span class="mr-body"><b>' + esc(kp.title) + "</b>"
        + "<small>" + esc(CATEGORIES[kp.category] || kp.category) + " · " + esc(kp.level) + "</small></span>"
        + badge(Engine.statusOf(state, kp))
        + '<span class="mr-score" style="color:' + scoreColor(sc, n) + '">' + (n ? sc : "—") + "</span>"
        + '<button class="btn sm ghost" data-practice="' + kp.id + '">Practise</button>'
        + "</div>";
    }).join("")
    + "</div>";
}

function hexMapSvg(H, focus) {
  const width = 1000;
  const list = KPS.filter(function (k) {
    return k.level === focus.level && k.category === focus.category;
  });
  const title = CATEGORIES[focus.category] || focus.category;
  const svg = ['<svg class="map-svg" viewBox="0 0 ' + width + " " + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Knowledge points">'];
  svg.push('<text x="10" y="22" font-size="20" font-weight="800" fill="#262626" letter-spacing="-.02em">' + esc(title) + "</text>");
  svg.push('<text x="10" y="40" font-size="11" fill="#666">' + list.length + " knowledge points · tap one for details</text>");
  kpCells(svg, list, 8, 54, width - 16, H - 62);
  svg.push("</svg>");
  return '<div class="map-svg-wrap">' + svg.join("") + "</div>" + kpListHtml(list);
}

/* ---------------- dashboard ---------------- */

/* Rolling 7-day summary: volume, time, and the weakest grammar area. */
function weeklyReport() {
  const weekAgo = Date.now() - 7 * 86400000;
  const sessions = (state.sessions || []).filter(function (s) { return s.at >= weekAgo; });
  const attempts = (state.attempts || []).filter(function (a) { return a.at >= weekAgo; });

  /* Grammar, vocabulary and conjugation are counted separately: mixing them
     made the accuracy number meaningless (a flashcard is not a grammar
     answer) while hiding that the words were practised at all. */
  const grammar = attempts.filter(function (a) { return !a.noMastery; });
  const vocab = attempts.filter(function (a) { return a.source === "vocab"; });
  const verbs = attempts.filter(function (a) { return a.source === "verbs"; });
  const questions = attempts.length;
  const correct = grammar.filter(function (a) { return a.correct; }).length;
  const minutes = Math.round(sessions.reduce(function (n, s) { return n + (s.durationMs || 0); }, 0) / 60000);

  const byCat = {};
  KPS.forEach(function (k) {
    const st = state.kps[k.id];
    if (!st || !st.n) return;
    const sc = Engine.display(st.p, st.n);
    if (!byCat[k.category]) byCat[k.category] = { sum: 0, n: 0 };
    byCat[k.category].sum += sc;
    byCat[k.category].n += 1;
  });
  let weakest = null;
  Object.keys(byCat).forEach(function (c) {
    const avg = byCat[c].sum / byCat[c].n;
    if (!weakest || avg < weakest.avg) weakest = { cat: c, avg: Math.round(avg) };
  });

  return {
    questions: questions, correct: correct, minutes: minutes, sessions: sessions.length,
    grammar: grammar.length, vocab: vocab.length, verbs: verbs.length,
    weakest: weakest
  };
}

/* Activity strip: bar height = questions answered, colour = accuracy.
   The weekly card used to show totals only, so a flat week and a burst looked
   identical. Toggle between the last week and the last month — the month view
   is the long-term trend Kwiziq surfaces in its reports. */
let actRange = 7;

function activityBars() {
  const DAY = ["S", "M", "T", "W", "T", "F", "S"];
  const key = function (ts) {
    const d = new Date(ts);
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  };
  const n = actRange === 30 ? 30 : 7;
  const days = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({ key: key(d), label: DAY[d.getDay()], n: 0, c: 0 });
  }
  const idx = {};
  days.forEach(function (d, i) { idx[d.key] = i; });
  (state.attempts || []).forEach(function (a) {
    const i = idx[key(a.at)];
    if (i == null) return;
    days[i].n += 1;
    if (a.correct) days[i].c += 1;
  });
  const max = Math.max(1, Math.max.apply(null, days.map(function (d) { return d.n; })));
  const thin = n > 7;
  const bars = days.map(function (d) {
    const h = d.n ? Math.max(10, Math.round(d.n / max * 100)) : 0;
    const acc = d.n ? Math.round(d.c / d.n * 100) : 0;
    const cls = !d.n ? "" : acc >= 70 ? "good" : acc >= 40 ? "mid" : "low";
    const tip = d.n ? d.n + " questions · " + acc + "% correct" : "no practice";
    return '<div class="act-col" title="' + tip + '">'
      + '<div class="act-track"><span class="act-bar ' + cls + '" style="height:' + h + '%"></span></div>'
      + (thin ? "" : '<span class="act-day">' + d.label + "</span>")
      + "</div>";
  }).join("");
  return '<div class="act-head"><span class="act-title">Last ' + n + " days</span>"
    + '<span class="act-toggle">'
    + '<button type="button" data-act-range="7" class="' + (n === 7 ? "on" : "") + '">7d</button>'
    + '<button type="button" data-act-range="30" class="' + (n === 30 ? "on" : "") + '">30d</button>'
    + "</span></div>"
    + '<div class="act-bars' + (thin ? " thin" : "") + '">' + bars + "</div>";
}

function weeklyHtml() {
  const w = weeklyReport();
  if (!w.sessions && !w.questions) {
    return '<div class="week-card"><div class="wk-title">This week</div>'
      + '<div class="wk-empty">No sessions yet. Finish a quick kwiz and your numbers land here.</div></div>';
  }
  const acc = w.grammar ? Math.round(w.correct / w.grammar * 100) : 0;
  const mix = [];
  if (w.vocab) mix.push(w.vocab + " word" + (w.vocab === 1 ? "" : "s"));
  if (w.verbs) mix.push(w.verbs + " verb form" + (w.verbs === 1 ? "" : "s"));
  return '<div class="week-card"><div class="wk-title">This week</div>'
    + '<div class="wk-stats">'
    + '<div class="wk-stat"><b>' + w.questions + "</b><span>questions</span></div>"
    + '<div class="wk-stat"><b>' + acc + "%</b><span>grammar accuracy</span></div>"
    + '<div class="wk-stat"><b>' + (w.minutes ? w.minutes : "—") + "</b><span>minutes</span></div>"
    + '<div class="wk-stat"><b>' + w.sessions + "</b><span>sessions</span></div>"
    + "</div>"
    + (mix.length
      ? '<div class="wk-mix">Also this week: ' + mix.join(" · ") + "</div>"
      : "")
    + '<div id="actWrap">' + activityBars() + "</div>"
    + (w.weakest
      ? '<div class="wk-weak">Weakest area: <b>' + esc(CATEGORIES[w.weakest.cat] || w.weakest.cat)
        + "</b> (" + w.weakest.avg + ") · "
        + '<button class="linkbtn" data-weak="1">practise it</button></div>'
      : "")
    + "</div>";
}

function renderDashboard() {
  const streak = state.streak.count;
  const today = Engine.todayCount(state);
  const dailyGoal = state.goal || 20;
  const due = Engine.dueCount(state);
  const weak = Engine.weakCount(state);

  /* Compute the deterministic guided plan from current learning evidence.
     Reconcile legacy cached plans on first load after the upgrade, otherwise
     an old random B2 recommendation could survive indefinitely in localStorage. */
  const plan = Engine.planList(state, 10);
  const planIds = plan.map(function (k) { return k.id; });
  if (JSON.stringify(state.plan || []) !== JSON.stringify(planIds)) {
    state.plan = planIds;
    saveState();
  }
  const recommended = LEVELS.filter(function (l) {
    return l.id === Engine.guidedLevel(state);
  })[0] || LEVELS[0];

  let levelRows = LEVELS.map(function (l) {
    const sc = Math.max(0, Math.round(Engine.levelScore(state, l.id)));
    const bar = Math.min(100, sc);
    const isCurrent = l.id === recommended.id;
    return '<div class="level-row' + (isCurrent ? " current" : "") + '">'
      + '<span class="name">' + esc(l.name) + '</span>'
      + '<span class="mini-bar"><span style="width:' + bar + '%"></span></span>'
      /* A display score, not a percentage — labelling it "%" made it read as
         an accuracy rate. */
      + '<span class="pct' + (sc < 40 ? " low" : "") + '" title="Confidence score, −100 to 100">' + sc + '</span>'
      + '<button class="btn sm ghost" data-kwiz-level="' + l.id + '">Kwiz</button>'
      + "</div>";
  }).join("");

  let planRows = plan.map(function (kp, i) {
    const s = state.kps[kp.id];
    const sc = s ? Engine.display(s.p, s.n) : 0;
    const st = Engine.statusOf(state, kp);
    return '<div class="plan-item" data-kp="' + kp.id + '" style="cursor:pointer">'
      + '<span class="idx">' + (i + 1) + "</span>"
      + '<span class="title">' + esc(kp.title) + "<small>" + esc(kp.titleFr) + "</small></span>"
      + badge(st)
      + '<span class="score-chip" style="color:' + scoreColor(sc, s ? s.n : 0) + '">' + (s && s.n ? sc : "—") + "</span>"
      + "</div>";
  }).join("");

  /* ---- one primary action, then at most three reasons to do something else.
     The old first screen offered five equal-weight buttons (placement, quick,
     full, weak, brainmap, learn-new) plus achievements and a level table, so
     nothing read as "do this next". ---- */
  const nextLesson = Engine.nextNewPoint(state);
  const unseen = nextLesson ? 1 : 0;
  const inProgress = !!(session && session.session);
  const steps = [];
  /* Each step carries roughly how long it takes, so "do I have time for this"
     is answerable without opening it. */
  if (due) steps.push({ title: "Review what is due", sub: due + " point" + (due === 1 ? "" : "s"), mins: 4, action: "due" });
  if (weak) steps.push({ title: "Drill your weak points", sub: weak + " below 50", mins: 4, action: "weak" });
  /* The primary button already offers the next lesson when that is the
     recommendation — listing it again underneath is the same sentence twice. */
  const outlook = Engine.practiceOutlook(state);
  if (unseen && outlook.recommend !== "learn") {
    steps.push({
      title: "Learn next: " + nextLesson.title,
      sub: nextLesson.level + " · " + Engine.lessonReason(state, nextLesson),
      mins: 3,
      action: "new"
    });
  }
  const stepsHtml = steps.slice(0, 3).map(function (st) {
    return '<button class="next-step" data-step="' + st.action + '">'
      + '<span class="ns-body"><b>' + esc(st.title) + "</b><small>" + esc(st.sub)
      + (st.mins ? " · ~" + st.mins + " min" : "") + "</small></span>"
      + '<span class="ns-go">→</span></button>';
  }).join("");

  const canPractise = outlook.canPractise;
  /* Nothing due and nothing weak? Then another pass over solid material is
     the wrong move — the next lesson is. Without this the primary button kept
     serving the same point for as long as the learner kept pressing it. */
  const primaryBtn = inProgress
    ? '<button class="btn block" id="resumeBtn">Resume · ' + (session.index + 1) + " / " + session.session.items.length + " done</button>"
    : (outlook.recommend === "learn" && nextLesson)
      ? '<button class="btn block" id="newPointBtn2">Learn: ' + esc(nextLesson.title)
        + "<small>" + esc(nextLesson.level) + (canPractise ? " · nothing due right now" : " · next unlocked lesson") + "</small></button>"
      : '<button class="btn block" data-start="3">Quick · 3 questions<small>about a minute</small></button>';

  app.innerHTML = '<div class="container">'
    + '<div class="page-head"><h1>Your French Dashboard</h1>'
    + '<p>' + KPS.length + ' points · A0 to B2 · stored on this device</p></div>'

    + '<div class="todaybar' + (today >= dailyGoal ? " done" : "") + '">'
    + '<div class="goal"><div class="goal-head">'
    + '<span class="label">TODAY</span>'
    + '<span class="goal-num">' + today + ' <small>/ ' + dailyGoal + ' questions</small></span>'
    + (today >= dailyGoal ? '<span class="goal-check">✓ Goal met</span>' : "")
    + '</div><div class="track"><span class="fill" style="width:' + Math.min(100, Math.round(today / dailyGoal * 100)) + '%"></span></div></div>'
    + '<div class="streak-box"><span class="streak-num">' + streak + '</span>'
    + '<span class="streak-lbl">day streak</span></div>'
    + '</div>'

    + '<section class="card hero">'
    + '<div class="hero-left">'
    + '<div class="hero-top"><div class="avatar">K</div><div class="hero-copy">'
    + '<div class="hello">' + (today ? "Welcome back." : "Hello!") + "</div>"
    + "<p>" + (inProgress
      ? "You left a session part-finished — pick it up where you stopped."
      : (outlook.recommend === "learn" && nextLesson
        ? "Nothing is due. The next lesson takes about three minutes."
        : canPractise
          ? "Short on time? Three questions takes about a minute."
          : "Start with the next unlocked lesson. Quizzes will follow the material you learn.")) + "</p></div></div>"
    + primaryBtn
    + '<div class="hero-sub">'
    + (inProgress
      ? '<button class="btn subtle" data-start="3">Start a fresh quick kwiz</button>'
      : (outlook.recommend === "learn" && canPractise
        ? '<button class="btn subtle" data-start="3">Quick · 3 questions</button>'
        : ""))
    + (canPractise ? '<button class="btn subtle" data-start="10">Full kwiz · 10</button>' : '')
    + "</div>"
    + (state.attempts.length === 0 && !state.seeded && !state.placement
      ? '<div class="firstrun"><div><b>First time here?</b> A 20-question placement test tells you where you are in about 5 minutes.</div>'
        + '<span class="spacer"></span><button class="btn sm ghost" data-placement>Start placement</button>'
        + '<a href="#/settings" class="small">or load demo data</a></div>'
      : "")
    + "</div>"
    + '<div class="hero-side">'
    + (stepsHtml
      ? '<div class="next-steps"><div class="ns-title">Or, in order of urgency</div>' + stepsHtml
        + (steps.length < 2 ? '<p class="ns-empty">Nothing else is due for review.</p>' : "") + "</div>"
      : '<div class="next-steps"><div class="ns-title">' + (outlook.canPractise ? "All caught up" : "Nothing to quiz yet") + "</div>"
        + '<p class="ns-empty">' + esc(outlook.canPractise
          ? (outlook.recommend === "learn" ? "The next lesson is already the button above." : "Nothing is due and nothing is weak.")
          : outlook.nextLesson
            ? "Guided quizzes only cover lessons you have started. Learn " + outlook.nextLesson.title + " first."
            : "Every point at your level is introduced. Review from the Notebook, or change your starting level in Settings.") + "</p></div>")
    + "</div>"
    + "</section>"

    + weeklyHtml()

    + '<div class="grid2 section-gap">'
    + '<section class="card"><h2 style="font-size:15px;margin-bottom:4px">Your achievements</h2>'
    + '<div class="stat-grid">'
    + '<div class="stat"><div class="k">Recommended level</div><div class="v">' + recommended.id + "</div></div>"
    + '<div class="stat"><div class="k">Sessions this month</div><div class="v">' + monthSessions() + "</div></div>"
    + '<div class="stat"><div class="k">Questions answered</div><div class="v">' + state.attempts.length + "</div></div>"
    + '<div class="stat"><div class="k">Points mastered</div><div class="v">'
    + KPS.filter(function (k) { const s = state.kps[k.id]; return s && s.n && Engine.display(s.p, s.n) >= 75; }).length
    + '<small> / ' + KPS.length + "</small></div></div>"
    + "</div>"
    + (state.placement
      ? '<div class="tiny" style="margin-top:8px">Placement: <b>' + esc(state.placement.level) + "</b> · "
        + new Date(state.placement.at).toLocaleDateString() + "</div>"
      : "")
    + (state.exams && state.exams.length
      ? '<div class="tiny" style="margin-top:4px">Last mock exam: <b>' + state.exams[state.exams.length - 1].score + " / 699</b> · "
        + esc(state.exams[state.exams.length - 1].band) + "</div>"
      : "")
    + '<div style="margin-top:12px;border:1px solid #D6E8F5;background:#F3F9FE;border-radius:7px;padding:8px 11px;font-size:11.5px;color:#2A5A78">'
    + "Personal build · unlimited kwizzes · no subscription</div>"
    + "</section>"

    + '<section class="card"><h2 style="font-size:15px;margin-bottom:4px">Choose your own adventure</h2>'
    + levelRows + "</section></div>"

    + '<section class="card section-gap dash-map"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">'
    + '<h2 style="font-size:15px">Your Brainmap</h2><span class="spacer" style="flex:1"></span>'
    + '<a href="#/brainmap" class="small">Open full map</a></div>'
    + '<div class="map-wrap" style="border:none;padding:0">' + renderMap(300, true) + "</div>"
    + legendHtml() + "</section>"

    + '<section class="card section-gap"><h2 style="font-size:15px;margin-bottom:4px">Your Studyplan</h2>'
    + '<p class="small">Guided path · " + esc(Engine.guidedLevel(state)) + " · review due points, then learn unlocked lessons.</p>'
    + '<div class="plan-list">' + planRows + "</div></section>"
    + "</div>";

  bindMap();
  document.querySelectorAll("[data-start]").forEach(function (b) {
    b.addEventListener("click", function () {
      startSession(parseInt(b.getAttribute("data-start"), 10) || 10);
    });
  });
  const npb2 = document.getElementById("newPointBtn2");
  if (npb2) npb2.addEventListener("click", startNewPoint);
  document.querySelectorAll("[data-step]").forEach(function (b) {
    b.addEventListener("click", function () {
      const step = b.getAttribute("data-step");
      if (step === "due") startDueSession();
      else if (step === "weak") startWeakSession();
      else startNewPoint();
    });
  });
  document.querySelectorAll("[data-kwiz-level]").forEach(function (b) {
    b.addEventListener("click", function () {
      const lvl = b.getAttribute("data-kwiz-level");
      const items = KPS.filter(function (k) { return k.level === lvl; });
      startSessionFromKps(items, 8);
    });
  });
  document.querySelectorAll(".plan-item[data-kp]").forEach(function (row) {
    row.addEventListener("click", function () { openDrawer(row.getAttribute("data-kp")); });
  });
  const dueBtn = document.querySelector("[data-due]");
  if (dueBtn) dueBtn.addEventListener("click", startDueSession);
  document.querySelectorAll("[data-weak]").forEach(function (b) {
    b.addEventListener("click", startWeakSession);
  });
  const pBtn = document.querySelector("[data-placement]");
  if (pBtn) pBtn.addEventListener("click", startPlacement);
  const resumeBtn = document.getElementById("resumeBtn");
  if (resumeBtn) resumeBtn.addEventListener("click", function () { navigate("#/kwiz"); });
}

function legendHtml() {
  return '<div class="legend">'
    + '<span><i style="background:#DDE0E4"></i>Not seen</span>'
    + '<span><i style="background:#D51C1B"></i>Needs review</span>'
    + '<span><i style="background:#F2D24B"></i>Weak</span>'
    + '<span><i style="background:#8FCB9B"></i>Getting there</span>'
    + '<span><i style="background:#5FB56F"></i>Strong</span>'
    + '<span><i style="background:#2E7D32"></i>Mastered</span>'
    + "</div>";
}

/* ---------------- brainmap ---------------- */

function crumbsHtml() {
  if (!mapFocus) return "";
  const cat = mapFocus.category ? (CATEGORIES[mapFocus.category] || mapFocus.category) : "";
  return '<div class="crumbs">'
    + '<button data-crumb="all">All levels</button>'
    + '<span class="sep">/</span>'
    + (mapFocus.category
      ? '<button data-crumb="level">' + esc(mapFocus.level) + '</button><span class="sep">/</span><span class="here">' + esc(cat) + '</span>'
      : '<span class="here">' + esc(mapFocus.level) + '</span>')
    + '<span class="spacer"></span>'
    + '<button class="btn sm subtle" data-crumb="all">Reset view</button>'
    + "</div>";
}

function renderBrainmap() {
  const shown = mapFocus
    ? KPS.filter(function (k) { return k.level === mapFocus.level && (!mapFocus.category || k.category === mapFocus.category); }).length
    : KPS.length;

  app.innerHTML = '<div class="container">'
    + '<div class="page-head"><h1>Your Brainmap</h1>'
    + '<p>Level, then grammar area, then the points inside.</p></div>'
    + '<div class="map-wrap"><div class="map-toolbar">'
    + '<span class="small"><b>' + shown + '</b> points shown · <b>' + KPS.length + '</b> total</span>'
    + '<span class="spacer"></span>'
    + '<span class="small">' + Engine.dueCount(state) + ' due · ' + Engine.weakCount(state) + ' weak</span>'
    + "</div>"
    + crumbsHtml() + renderMap(mapFocus ? 440 : 680) + legendHtml() + "</div>"
    + '<div class="section-gap" style="text-align:center">'
    + '<button class="btn" data-start="1">Start a 10-question kwiz</button></div>'
    + "</div>";

  bindMap();
  bindMapNav();
  document.querySelectorAll("[data-start]").forEach(function (b) {
    b.addEventListener("click", function () { startSession(); });
  });
}

function bindMapNav() {
  document.querySelectorAll("[data-level]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.stopPropagation();
      mapFocus = { level: el.getAttribute("data-level"), category: null };
      renderBrainmap();
    });
  });
  document.querySelectorAll("[data-cat]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.stopPropagation();
      mapFocus = { level: el.getAttribute("data-cat-level"), category: el.getAttribute("data-cat") };
      renderBrainmap();
    });
  });
  document.querySelectorAll("[data-crumb]").forEach(function (b) {
    b.addEventListener("click", function () {
      mapFocus = b.getAttribute("data-crumb") === "level" && mapFocus
        ? { level: mapFocus.level, category: null }
        : null;
      renderBrainmap();
    });
  });
}

function bindMap() {
  document.querySelectorAll(".map-cell").forEach(function (cell) {
    const kpId = cell.getAttribute("data-kp");
    cell.addEventListener("mousemove", function (e) {
      const kp = KP_BY_ID[kpId];
      const s = state.kps[kpId];
      const sc = s ? Engine.display(s.p, s.n) : 0;
      tooltip.hidden = false;
      tooltip.innerHTML = "<b>" + esc(kp.title) + "</b>"
        + esc(kp.level) + " · " + esc(CATEGORIES[kp.category] || kp.category)
        + (s && s.n ? " · score " + sc + " (" + s.n + " attempts)" : " · not seen yet");
      tooltip.style.left = Math.min(window.innerWidth - 250, e.clientX + 14) + "px";
      tooltip.style.top = (e.clientY + 16) + "px";
    });
    cell.addEventListener("mouseleave", function () { tooltip.hidden = true; });
    cell.addEventListener("click", function () { openDrawer(kpId); });
  });

  /* Phone list rows: tap the row for the drawer, tap Practise to drill it. */
  document.querySelectorAll(".map-row[data-kp]").forEach(function (row) {
    row.addEventListener("click", function (e) {
      if (e.target && e.target.closest && e.target.closest("[data-practice]")) return;
      openDrawer(row.getAttribute("data-kp"));
    });
  });
  document.querySelectorAll(".map-list [data-practice]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      startFocusSession(b.getAttribute("data-practice"));
    });
  });
}

/* A note for Chinese speakers, when Chinese and French genuinely diverge on
   this point. Additive: the English rule above it is unchanged. */
function contrastHtml(kpId) {
  if (typeof CONTRAST === "undefined") return "";
  const note = CONTRAST[kpId];
  if (!note) return "";
  return '<div class="contrast-note"><b>中文母语提示</b>' + esc(note) + "</div>";
}

/* Coverage, mastery, lesson stage and review date, kept apart. One number
   could not answer all four, and the drawer used to show only the badge. */
function profileLine(kp) {
  const prof = Engine.pointProfile(state, kp);
  const bits = [];
  if (prof.seen) bits.push(prof.seen + " answer" + (prof.seen === 1 ? "" : "s") + " · " + prof.correct + " right");
  if (prof.due) bits.push("due for review");
  else if (prof.dueInDays != null && prof.seen) bits.push("next review in " + prof.dueInDays + " day" + (prof.dueInDays === 1 ? "" : "s"));
  const accents = Engine.accentCount(state, kp.id);
  if (accents) bits.push(accents + " accepted without accents");
  if (!bits.length) return "";
  return '<div class="drawer-stats">' + esc(bits.join(" · ")) + "</div>";
}

function openDrawer(kpId) {
  const kp = KP_BY_ID[kpId];
  const s = state.kps[kpId];
  const sc = s ? Engine.display(s.p, s.n) : 0;
  const st = Engine.statusOf(state, kp);

  const guided = Engine.guidedLevel(state);
  const beyond = LEVELS.findIndex(function (l) { return l.id === kp.level; })
    > LEVELS.findIndex(function (l) { return l.id === guided; });
  const whyText = beyond
    ? "Beyond your guided level (" + guided + "). Practising it here is free exploration — it will not unlock this point for daily practice."
    : Engine.lessonReason(state, kp);

  drawerTitle.innerHTML = esc(kp.title)
    + (zhOf(kp) ? '<span class="t-zh" style="display:block">' + esc(zhOf(kp)) + "</span>" : "");
  let html = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'
    + '<span class="score-chip" style="font-size:14px;color:' + scoreColor(sc, s ? s.n : 0) + '">' + (s && s.n ? sc : "—") + "</span>"
    + badge(pointStatus(kp)) + '<span class="tiny">' + esc(kp.level) + " · " + esc(CATEGORIES[kp.category] || kp.category) + "</span></div>"
    + (whyText ? '<div class="drawer-why' + (beyond ? " beyond" : "") + '">' + esc(whyText) + "</div>" : "")
    + profileLine(kp)
    + '<div class="rule">' + frify(kp.rule) + "</div>"
    + contrastHtml(kp.id)
    + usageHtml(kp)
    + "<h4>Examples</h4>"
    + exampleList(kp).map(function (e) {
      return '<div class="ex"><div class="ex-fr">' + glossify(e[0]) + '</div><span>' + esc(e[1]) + "</span></div>";
    }).join("")
    + mistakesHtml(kp)
    + "<h4>Watch out</h4><div class=\"small\">" + frify(kp.pitfall) + "</div>"
    + tipHtml(kp)
    + relatedHtml(kp)
    + '<div class="drawer-actions">'
    + '<button class="btn sm" data-practice="' + kp.id + '">Practice this</button>'
    + (st === "new" ? '<button class="btn sm ghost" data-prelearn="' + kp.id + '">Pre-learn (3 min)</button>' : "")
    + '<button class="btn sm subtle" data-save="' + kp.id + '">'
    + (Engine.isKpSaved(state, kp.id) ? "Saved ✓" : "Save to Notebook") + "</button>"
    + '<button class="btn sm subtle" data-master="' + kp.id + '">I already know this</button>'
    + "</div>";

  drawerBody.innerHTML = html;
  if (drawer.hidden) drawerReturn = document.activeElement;
  drawer.hidden = false;
  scrim.hidden = false;
  /* Focus goes into the dialog and stays there until it closes. */
  const first = drawer.querySelector(".icon-btn");
  if (first) first.focus();
  document.addEventListener("keydown", drawerKeys);

  drawerBody.querySelectorAll("[data-practice]").forEach(function (b) {
    b.addEventListener("click", function () { closeDrawer(); startFocusSession(b.getAttribute("data-practice")); });
  });
  drawerBody.querySelectorAll("[data-prelearn]").forEach(function (b) {
    b.addEventListener("click", function () { closeDrawer(); navigate("#/prelearn/" + b.getAttribute("data-prelearn")); });
  });
  drawerBody.querySelectorAll("[data-save]").forEach(function (b) {
    b.addEventListener("click", function () {
      const kpid = b.getAttribute("data-save");
      const on = Engine.toggleKpSave(state, kpid);
      saveState();
      toast(on ? "Saved to Notebook" : "Removed from Notebook");
      openDrawer(kpid);
    });
  });
  drawerBody.querySelectorAll("[data-master]").forEach(function (b) {
    b.addEventListener("click", function () {
      const kpid = b.getAttribute("data-master");
      Engine.ensure(state, kpid);
      const s = state.kps[kpid];
      s.p = 0.90; s.n = 5; s.correct = 5; s.wrong = 0; s.state = "mastered";
      const strength = Math.max(0, (s.p - 0.45) / 0.55);
      const days = 0.25 + 12 * strength * strength;
      s.dueAt = Date.now() + days * 86400000;
      s.lastSeen = Date.now();
      state.plan = null;
      saveState();
      toast("Marked as mastered");
      closeDrawer();
      if (location.hash.indexOf("brainmap") >= 0 || location.hash.indexOf("library") >= 0) route();
    });
  });
  drawerBody.querySelectorAll("[data-rel]").forEach(function (b) {
    b.addEventListener("click", function () { openDrawer(b.getAttribute("data-rel")); });
  });
}

function closeDrawer() {
  drawer.hidden = true;
  scrim.hidden = true;
  document.removeEventListener("keydown", drawerKeys);
  if (drawerReturn && drawerReturn.focus) drawerReturn.focus();
  drawerReturn = null;
}

/* Esc closes; Tab cycles inside the dialog instead of escaping to the page
   behind the scrim. */
function drawerKeys(e) {
  if (e.key === "Escape") { e.preventDefault(); closeDrawer(); return; }
  if (e.key !== "Tab") return;
  const focusables = drawer.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ---------------- sessions ---------------- */

/* Snapshot each involved point's display score before the session,
   so the result page can show what actually moved. */
function snapshotScores(items) {
  const seen = {};
  const snap = {};
  items.forEach(function (it) {
    if (seen[it.kpId]) return;
    seen[it.kpId] = true;
    const s = state.kps[it.kpId];
    snap[it.kpId] = s && s.n ? Engine.display(s.p, s.n) : 0;
  });
  return snap;
}

/* Swap in a real sentence for a couple of questions once a point is
   established — same grammar, new vocabulary, so you cannot memorise the
   hand-written question instead of learning the rule. */
function addSentenceVariety(items) {
  if (!sentenceBank().length) return items;
  const usedKp = {};
  let swaps = 0;
  return items.map(function (ref) {
    const st = state.kps[ref.kpId];
    if (!st || st.n < 3 || swaps >= 2 || usedKp[ref.kpId]) return ref;
    const taken = {};
    items.forEach(function (x) { taken[x.itemId] = true; });
    const id = sentIdsFor(ref.kpId, st.n + swaps).filter(function (x) { return !taken[x]; })[0];
    if (!id) return ref;
    usedKp[ref.kpId] = true;
    swaps++;
    return { kpId: ref.kpId, itemId: id, difficulty: ref.difficulty, fromSentence: true };
  });
}

function startSession(size) {
  const n = size || 10;
  const built = Engine.buildSession(state, n);
  if (!built.items.length) {
    /* Say what is missing rather than dropping the learner back on the page
       they came from with no explanation. */
    const look = Engine.practiceOutlook(state);
    if (look.nextLesson) {
      toast("Guided practice only covers lessons you have started — opening " + look.nextLesson.title);
      navigate("#/prelearn/" + look.nextLesson.id);
    } else {
      toast("Every point at your level is introduced. Review from the Notebook, or change your starting level in Settings.");
    }
    return;
  }
  built.items = addSentenceVariety(built.items);
  built.items = mixTopics(built.items, n);
  session = {
    session: built,
    before: snapshotScores(built.items),
    todayBefore: Engine.todayCount(state),
    startedAt: Date.now(),
    index: 0, phase: "question", answers: [], last: null, selected: null
  };
  saveSession();
  navigate("#/kwiz");
}

/* Pick questions by rotating through the points instead of sorting one flat
   pool by difficulty. The old approach had a coverage bug: with many weak
   points, the easiest items from the easiest points filled the session every
   time, so the harder points never came up and the same questions kept
   reappearing. Rotation gives one question per point before any point gets a
   second, and recent items are skipped so a session is not a rerun. */
function pickByRotation(kps, size, perKpCap) {
  const n = size || 10;
  const cap = perKpCap || 2;
  const recent = {};
  state.attempts.slice(-80).forEach(function (a) { recent[a.itemId] = true; });

  /* Points practised in the previous session go to the back of the queue, so
     a long list of weak points actually gets covered over several sessions
     instead of the same ten every time. */
  const last = (state.sessions || [])[(state.sessions || []).length - 1];
  const seenLast = {};
  if (last && last.answers) {
    last.answers.forEach(function (a) { if (a.correct !== null) seenLast[a.kpId] = true; });
  }
  const ordered = kps.filter(function (k) { return !seenLast[k.id]; })
    .concat(kps.filter(function (k) { return seenLast[k.id]; }));

  const queues = ordered.map(function (kp) {
    const all = kp.items.filter(function (i) { return i.stage !== "guided"; });
    const fresh = all.filter(function (i) { return !recent[i.id]; });
    let pool = (fresh.length ? fresh : all).slice();
    pool.sort(function (a, b) { return a.difficulty - b.difficulty; });
    /* Cycle the starting item by how often the point has been answered, so the
       same point serves a different question each time it comes round. */
    const st = state.kps[kp.id];
    const seen = st ? st.n : 0;
    const off = pool.length ? seen % pool.length : 0;
    if (off) pool = pool.slice(off).concat(pool.slice(0, off));

    /* Once a point is established, real sentences from the bank lead — the
       hand-written questions are there to teach the rule, the sentences are
       there to prove it survives contact with a real sentence. */
    const sents = sentIdsFor(kp.id, seen).filter(function (id) { return !recent[id]; })
      .map(function (id) { return { id: id, difficulty: 3, stage: "kwiz", fromSentence: true }; });
    if (sents.length) pool = seen >= 3 ? sents.concat(pool) : pool.concat(sents);

    return { kp: kp, pool: pool, used: 0 };
  }).filter(function (q) { return q.pool.length; });

  const picked = [];
  let guard = 0;
  while (picked.length < n && guard < 20) {
    guard++;
    let added = false;
    for (let i = 0; i < queues.length && picked.length < n; i++) {
      const q = queues[i];
      if (!q.pool.length || q.used >= cap) continue;
      const it = q.pool.shift();
      picked.push({ kpId: q.kp.id, itemId: it.id, difficulty: it.difficulty });
      q.used += 1;
      added = true;
    }
    if (!added) break;
  }
  return picked;
}

/* ---- sentence bank as kwiz material ----

   The 13k-sentence bank was only reachable from its own page. Each grammar tag
   maps to the points that tag actually exercises, so a kwiz can drop in a real
   sentence once you have seen the hand-written questions for that point. Only
   "gap" items qualify: word-order items need their own interface. */
const SENT_TAG_KPS = {
  negation: ["a1.negation.ne_pas", "a1.syntax.negation_rien_jamais"],
  question: ["a1.questions.est_ce_que", "a0.syntax.questions_intonation", "b1.syntax.inversion"],
  relative: ["b1.relative.qui_que", "b1.syntax.relative_dont", "a2.syntax.relative_ou"],
  conditionnel: ["b1.conditional.present", "b1.syntax.si_clauses", "b1.verbs.conditional_past"],
  subjonctif: ["b1.subjunctive.present", "b1.verbs.subjunctive_conj"],
  passe_compose: ["a2.passe_compose.avoir", "a2.passe_compose.etre", "a2.imparfait_vs_pc", "a2.verbs.pronominaux_passe"],
  futur: ["b1.future.simple", "a1.verbs.futur_proche"],
  prepositions: ["a1.prepositions.place", "a1.prepositions.time", "a2.prepositions.geography", "a1.aller.prepositions"],
  articles: ["a0.articles.definite", "a0.articles.indefinite", "a1.articles.partitive"],
  pronouns: ["a2.pronouns.cod", "a2.pronouns.coi", "a2.pronouns.y_en", "a1.pronouns.stress", "b1.pronoun_order"],
  adverbs: ["a2.adjectives.adverbs_ment", "b1.comparison"]
};

const SENT_KP_TAGS = (function () {
  const out = {};
  Object.keys(SENT_TAG_KPS).forEach(function (tag) {
    SENT_TAG_KPS[tag].forEach(function (kpId) {
      (out[kpId] = out[kpId] || []).push(tag);
    });
  });
  return out;
})();

const SENT_LEVEL_DIFF = { A1: 1, A2: 2, B1: 3, B2: 4 };
let SENT_TAG_INDEX = null;

function sentTagIndex() {
  if (SENT_TAG_INDEX) return SENT_TAG_INDEX;
  SENT_TAG_INDEX = {};
  sentenceBank().forEach(function (s, i) {
    if (s[5] !== "gap" || !s[3] || !s[4] || !s[4].length) return;
    (SENT_TAG_INDEX[s[2]] = SENT_TAG_INDEX[s[2]] || []).push(i);
  });
  return SENT_TAG_INDEX;
}

/* Turn a bank row into an item shaped like a hand-written choice question. */
function sentItem(itemId) {
  const i = parseInt(String(itemId).slice(5), 10);
  const s = sentenceBank()[i];
  if (!s) return null;
  return {
    id: itemId,
    type: "choice",
    prompt: blankWord(s[0], s[3]) || s[0],
    options: s[4],
    answer: s[3],
    explain: s[1],
    difficulty: SENT_LEVEL_DIFF[s[6]] || 2,
    stage: "kwiz",
    fromSentence: true
  };
}

/* Candidate sentence ids for a point, rotated by how often it has been seen. */
function sentIdsFor(kpId, offset) {
  const tags = SENT_KP_TAGS[kpId];
  if (!tags || !sentenceBank().length) return [];
  const idx = sentTagIndex();
  const ids = [];
  tags.forEach(function (t) {
    (idx[t] || []).forEach(function (i) { ids.push("sent." + i); });
  });
  if (!ids.length) return [];
  const start = (offset * 11) % ids.length;
  return ids.slice(start).concat(ids.slice(0, start)).slice(0, 8);
}

/* ---- vocabulary and conjugation inside normal sessions ----

   The daily three used to be 100% grammar. 600 words and 3,108 verb forms sat
   behind their own pages, so they only got practised on the days you happened
   to remember to open them. They now take a share of every session — scored
   as work, never as grammar evidence.

   Items are built lazily from their id and cached, because the options must
   not reshuffle between the question render and the feedback render. */
const TOPIC_KP = {
  vocab: { id: "topic.vocab", title: "Vocabulary", titleFr: "", level: "", category: "vocab", items: [] },
  verbs: { id: "topic.verbs", title: "Conjugation", titleFr: "", level: "", category: "verbs", items: [] }
};

const TOPIC_CACHE = {};

function topicItem(itemId) {
  const s = String(itemId);
  if (TOPIC_CACHE[s]) return TOPIC_CACHE[s];
  let item = null;

  if (s.indexOf("topic.vocab:") === 0) {
    const v = VOCAB_BY_WORD[s.slice(12)];
    const ex = v && v.ex && v.ex[0];
    const blanked = ex ? blankWord(ex[0], v.w) : null;
    /* A blank at the start of the sentence is not a question — there is no
       context to work from — so those examples are skipped. */
    const usable = blanked && blanked.indexOf("____") > 2 && ex[0].split(/\s+/).length >= 5;
    if (usable) {
      const others = VOCAB_LIST.filter(function (x) { return x.pos === v.pos && x.w !== v.w; })
        .map(function (x) { return x.w; });
      if (others.length >= 3) {
        item = {
          id: s, type: "choice", prompt: blanked,
          options: vocabShuffle([v.w].concat(vocabShuffle(others).slice(0, 3))),
          answer: v.w, explain: ex[1], difficulty: 2, stage: "kwiz", topic: "vocab"
        };
      }
    }
  } else if (s.indexOf("topic.verbs:") === 0) {
    const parts = s.slice(12).split("|");
    const v = VERB_BY_INF[parts[0]];
    const form = v && v.t[parts[1]] && v.t[parts[1]][parseInt(parts[2], 10)];
    if (form) {
      const pronoun = VERB_PERSON_LIST[parseInt(parts[2], 10)];
      item = {
        id: s, type: "fill",
        prompt: "« " + parts[0] + " » — " + parts[1] + ", " + pronoun,
        answer: form,
        accept: [verbElide(pronoun, form)],
        explain: v.en ? v.en : "",
        difficulty: 3, stage: "kwiz", topic: "verbs"
      };
    }
  }

  if (!item) return null;
  if (Object.keys(TOPIC_CACHE).length > 300) {
    Object.keys(TOPIC_CACHE).forEach(function (k) { delete TOPIC_CACHE[k]; });
  }
  TOPIC_CACHE[s] = item;
  return item;
}

/* Which words are worth asking: unknown ones first, then the ones you keep
   getting wrong, then whatever you have not seen for longest. */
function topicVocabRefs(n) {
  const pool = VOCAB_LIST.filter(function (v) {
    // Vocabulary starts at A1; avoid mixing it into A0 foundation sessions.
    const cap = Engine.guidedLevel(state);
    const levelRank = { A0: 0, A1: 1, A2: 2, B1: 3, B2: 4 };
    if (levelRank[v.level || "B2"] > levelRank[cap]) return false;
    if (!(v.ex && v.ex[0] && v.ex[0][0])) return false;
    // A vocabulary word should enter mixed review only after it was learned
    // in Vocab. CEFR word labels alone do not guarantee a simple sentence.
    if (!state.vocab || !state.vocab[v.w] || !state.vocab[v.w].seen) return false;
    if (state.vocab[v.w].known) return false;
    const b = blankWord(v.ex[0][0], v.w);
    return b && b.indexOf("____") > 2 && v.ex[0][0].split(/\s+/).length >= 5;
  }).map(function (v) {
    const r = state.vocab && state.vocab[v.w];
    const misses = r ? Math.max(0, r.seen - r.correct) : 0;
    return { w: v.w, misses: misses, seen: r ? r.seen : 0, last: r ? r.last : 0 };
  });
  pool.sort(function (a, b) {
    if (a.misses !== b.misses) return b.misses - a.misses;
    if (a.seen !== b.seen) return a.seen - b.seen;
    return a.last - b.last;
  });
  return pool.slice(0, n).map(function (x) {
    return { kpId: null, topic: "vocab", itemId: "topic.vocab:" + x.w };
  });
}

function topicVerbRefs(n) {
  const pool = [];
  const cap = Engine.guidedLevel(state);
  const levelRank = { A0: 0, A1: 1, A2: 2, B1: 3, B2: 4 };
  const tenseGate = {
    "présent": { level: "A0", kp: "a0.etre.present" },
    "passé composé": { level: "A2", kp: "a2.passe_compose.avoir" },
    "imparfait": { level: "A2", kp: "a2.imparfait_vs_pc" },
    "futur simple": { level: "B1", kp: "b1.future.simple" },
    "conditionnel": { level: "B1", kp: "b1.conditional.present" },
    "subjonctif": { level: "B1", kp: "b1.subjunctive.present" },
    "plus-que-parfait": { level: "B2", kp: "b2.verbs.plus_que_parfait" }
  };
  VERB_LIST.forEach(function (v) {
    VERB_TENSE_LIST.forEach(function (t) {
      const gate = tenseGate[t];
      if (!gate || levelRank[cap] < levelRank[gate.level]) return;
      const studied = state.kps[gate.kp];
      if (!studied || !studied.n) return;
      if (!v.t[t]) return;
      for (let p = 0; p < 6; p++) {
        const key = v.inf + "|" + t + "|" + p;
        const r = state.verbs && state.verbs[key];
        const seen = r ? r.seen : 0;
        // Never introduce an unfamiliar conjugation via mixed guided practice.
        if (!seen) continue;
        const acc = r.correct / seen;
        pool.push({
          key: key,
          score: seen ? (1 - acc) + Math.random() * 0.15 : 0.5 + Math.random() * 0.2
        });
      }
    });
  });
  pool.sort(function (a, b) { return b.score - a.score; });
  return pool.slice(0, n).map(function (x) {
    return { kpId: null, topic: "verbs", itemId: "topic.verbs:" + x.key };
  });
}

/* Replace roughly one question in three, never the opening one, so a session
   still starts with the grammar it was built around. */
function mixTopics(items, n) {
  // No random topic mix in a brand-new learner's foundation practice.
  if (Engine.guidedLevel(state) === "A0") return items;
  const slots = n <= 3 ? 1 : Math.max(1, Math.round(n * 0.3));
  const wantVocab = Math.ceil(slots / 2);
  const picks = topicVocabRefs(wantVocab).concat(topicVerbRefs(slots - wantVocab));
  if (!picks.length) return items;

  const out = items.slice();
  const positions = [];
  for (let i = 1; i < out.length && positions.length < picks.length; i += 3) positions.push(i);
  positions.forEach(function (pos, k) {
    const ref = picks[k];
    if (!ref) return;
    if (!topicItem(ref.itemId)) return;     /* drop refs whose data is missing */
    out[pos] = ref;
  });
  return out;
}

function startSessionFromItems(items) {
  if (!items.length) { toast("Nothing to practise yet"); return; }
  session = {
    session: { id: "s" + Date.now().toString(36), createdAt: Date.now(), items: items },
    before: snapshotScores(items),
    todayBefore: Engine.todayCount(state),
    startedAt: Date.now(),
    index: 0, phase: "question", answers: [], last: null, selected: null
  };
  saveSession();
  navigate("#/kwiz");
}

function startSessionFromKps(kps, size) {
  startSessionFromItems(pickByRotation(kps, size || 8, 2));
}

function startFocusSession(kpId) {
  const kp = KP_BY_ID[kpId];
  /* Points normally carry 5 items (3 after the guided pair), but a drill-heavy
     point such as the tense contrast carries more. Take up to 8 so "Practice
     this" actually uses the extra material. */
  startSessionFromItems(kp.items.slice(2, 10).map(function (i) {
    return { kpId: kp.id, itemId: i.id };
  }));
}

function startDueSession() {
  const due = KPS.filter(function (k) {
    const st = state.kps[k.id];
    return Engine.guidedEligible(state, k) && Engine.hasStarted(state, k) && st && st.dueAt && st.dueAt <= Date.now();
  });
  if (due.length < 4) { startSession(); return; }
  /* Most overdue first, then one question per point — taking "the first item"
     for every due point meant the same five questions came back forever. */
  due.sort(function (a, b) { return state.kps[a.id].dueAt - state.kps[b.id].dueAt; });
  startSessionFromItems(pickByRotation(due, 10, 1));
}

/* Practise everything currently sitting below the "weak" line,
   not just the mistakes from the last session. */
function startWeakSession() {
  const weakKps = KPS.filter(function (k) {
    const s = state.kps[k.id];
    return s && s.n && Engine.display(s.p, s.n) < 50;
  });
  if (!weakKps.length) { toast("No weak points right now — nice"); return; }
  weakKps.sort(function (a, b) { return Engine.scoreOf(state, a.id) - Engine.scoreOf(state, b.id); });
  startSessionFromKps(weakKps, 10);
}

/* Jump straight into a point the learner has never touched — the "learn"
   half of the learn → practise → learn loop. */
function startNewPoint() {
  const next = Engine.nextNewPoint(state);
  if (!next) {
    toast("No unlocked new lessons — review your current points or change your starting level in Settings");
    return;
  }
  navigate("#/prelearn/" + next.id);
}

/* Reading practice: take the weakest passage and run all its questions in a row.
   Ties go to the easier level, so a fresh profile starts at A1. */
function startReadingSession() {
  const readings = KPS.filter(function (k) { return k.category === "reading"; });
  if (!readings.length) { toast("No reading passages yet"); return; }
  const lvl = { A0: 0, A1: 1, A2: 2, B1: 3, B2: 4 };
  const sorted = readings.slice().sort(function (a, b) {
    const d = Engine.scoreOf(state, a.id) - Engine.scoreOf(state, b.id);
    if (d !== 0) return d;
    return (lvl[a.level] || 0) - (lvl[b.level] || 0);
  });
  const kp = sorted[0];
  startSessionFromItems(kp.items.map(function (it) {
    return { kpId: kp.id, itemId: it.id };
  }));
}

function renderKwiz() {
  if (!session || !session.session || !session.session.items.length) {
    app.innerHTML = '<div class="container"><div class="empty">No active session. '
      + '<a href="#/">Go back to the dashboard</a>.</div></div>';
    return;
  }

  const total = session.session.items.length;
  const ref = session.session.items[session.index];
  const pair = getItem(ref);
  if (!pair) { session = null; saveSession(); navigate("#/"); return; }
  const kp = pair.kp, item = pair.item;
  const answered = session.phase === "feedback";

  let inputHtml = "";
  if (item.type === "choice") {
    inputHtml = '<div class="options">' + item.options.map(function (o, oi) {
      let cls = "option";
      if (!answered && session.selected === o) cls += " selected";
      if (answered) {
        if (Engine.normalize(o) === Engine.normalize(item.answer)) cls += " correct";
        else if (session.selected === o) cls += " wrong";
      }
      return '<button class="' + cls + '" data-option="' + esc(o) + '"' + (answered ? " disabled" : "") + ">"
        + '<span class="opt-key">' + (oi + 1) + "</span>" + esc(o) + "</button>";
    }).join("") + "</div>";
  } else {
    inputHtml = '<input class="answer-input" id="answerInput" autocomplete="off" autocapitalize="off" spellcheck="false" '
      + 'placeholder="Type your answer" value="' + (answered ? esc(session.last && session.last.given || "") : "") + '"'
      + (answered ? " disabled" : "") + ">"
      + (answered ? "" : accentBarHtml("answerInput"));
  }

  let feedback = "";
  if (answered) {
    const l = session.last;
    const moveHtml = (l.delta != null && !l.noMastery)
      ? '<div class="score-move"><span class="sm-name">' + esc(kp.title.split(":")[0]) + "</span>"
        + '<span class="from">' + l.before + '</span><span class="arrow">→</span>'
        + '<span class="to">' + l.after + "</span>"
        + '<span class="delta ' + (l.delta > 0 ? "up" : l.delta < 0 ? "down" : "flat") + '">'
        + (l.delta > 0 ? "+" : "") + l.delta + "</span></div>"
      : "";
    const ctxNote = item.topic
      ? '<div class="ctx-note">' + (item.topic === "verbs" ? "Conjugation" : "Vocabulary")
        + " — it counts towards this session, not towards your grammar score.</div>"
      : (l.noMastery
        ? '<div class="ctx-note">Context question — a real sentence from the bank. It counts towards this session but not towards your confidence score.</div>'
        : "");
    if (l.skip) {
      feedback = '<div class="feedback skip" role="status" aria-live="polite"><div class="mark">–</div><div class="body">'
        + "<b>Skipped — no penalty.</b>"
        + '<div class="answer-line">' + esc(item.answer) + "</div>"
        + esc(item.explain) + "</div></div>";
    } else if (l.correct) {
      feedback = '<div class="feedback ok" role="status" aria-live="polite"><div class="mark">✓</div><div class="body">'
        + "<b>Correct.</b>" + accentNoteHtml(l.accent) + moveHtml + ctxNote + esc(item.explain) + "</div></div>";
    } else {
      feedback = '<div class="feedback bad" role="status" aria-live="polite"><div class="mark">×</div><div class="body">'
        + "<b>Not quite.</b>" + moveHtml + ctxNote
        + '<div class="answer-line">' + esc(item.answer) + "</div>"
        + (item.type === "choice" && !item.fromSentence && !item.topic ? whyWrongHtml(kp.id, l.given) : "")
        + esc(item.explain)
        /* The per-question explanation is a five-word restatement — enough when
           you were right, useless when you were wrong. A miss gets the rule
           itself, in the place where it is needed. */
        + (item.topic ? "" : '<div class="rule-nudge"><b>The rule</b>' + frify(kp.rule) + "</div>")
        + (item.topic
          ? ""
          : '<div style="margin-top:6px"><a href="#/prelearn/' + kp.id + '" class="small" style="color:var(--blue);font-weight:600">Learn this point →</a></div>')
        + "</div></div>";
    }
  }

  const hint = (!answered && item.hint && item.stage === "guided")
    ? '<p class="small" style="margin-top:12px">Hint: ' + esc(item.hint) + "</p>" : "";

  const headLabel = item.topic
    ? (item.topic === "verbs" ? "Conjugation" : "Vocabulary")
    : esc(kp.level) + " · " + esc(kp.title.split(":")[0]);

  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + '<div class="kwiz-top"><span>' + (session.index + 1) + " / " + total + "</span>"
    + '<span class="track"><span class="fill" style="width:' + (session.index / total * 100) + '%"></span></span>'
    + "<span>" + headLabel + "</span></div>"
    + '<div class="kwiz-card">'
    + '<div class="kwiz-kicker">' + (ref.retry ? '<span class="retry-badge">Retry</span> ' : "") + esc(typeLabel(item)) + "</div>"
    + passageHtml(item)
    + '<div class="kwiz-prompt">' + esc(item.prompt).replace(/_{3,}/g, '<span class="blank">____</span>') + "</div>"
    + inputHtml + hint + feedback
    + '<div class="kwiz-actions">'
    + (answered
      ? '<button class="btn" id="continueBtn">' + (session.index + 1 >= total ? "See results" : "Continue") + "</button>"
      : '<button class="btn" id="checkBtn">Check</button>'
        + '<button class="btn subtle" id="skipBtn">Skip</button>'
        + '<span class="spacer"></span><span class="kbd-hint"><kbd>1</kbd>–<kbd>4</kbd> pick · <kbd>Enter</kbd> check · <kbd>Esc</kbd> skip</span>')
    + "</div></div></div></div>";

  if (!answered) {
    if (item.type === "choice") {
      document.querySelectorAll("[data-option]").forEach(function (b) {
        b.addEventListener("click", function () {
          session.selected = b.getAttribute("data-option");
          saveSession();
          document.querySelectorAll("[data-option]").forEach(function (x) { x.classList.remove("selected"); });
          b.classList.add("selected");
        });
      });
    } else {
      const input = document.getElementById("answerInput");
      input.focus();
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); checkAnswer(); }
      });
      wireAccentBars();
    }
    document.getElementById("checkBtn").addEventListener("click", checkAnswer);
    document.getElementById("skipBtn").addEventListener("click", skipAnswer);
  } else {
    document.getElementById("continueBtn").addEventListener("click", continueSession);
    document.getElementById("continueBtn").focus();
  }
}

/* Adaptive retry: a point you just got wrong comes back a couple of questions
   later, using a question you have not seen in this session. This is the one
   behaviour that actually changes whether something sticks, and it mirrors how
   Kwiziq's kwiz keeps re-testing a weak point instead of moving on.
   Short sessions (the 3-question quick kwiz) are left alone on purpose — they
   are meant to finish in about a minute. */
function maybeQueueRetry(ref) {
  const s = session && session.session;
  if (!s || !s.items) return;
  if (s.items.length < 8) return;                 // keep the quick kwiz quick
  s.retryKps = s.retryKps || {};
  if (s.retryKps[ref.kpId]) return;               // one retry per point
  const kp = KP_BY_ID[ref.kpId];
  if (!kp) return;

  const used = {};
  s.items.forEach(function (it) { used[it.itemId] = true; });
  (session.answers || []).forEach(function (a) { used[a.itemId] = true; });

  /* Prefer another choice item so the retry is quick to answer, then fall
     back to any unused item from the point. */
  const fresh = kp.items.filter(function (it) { return !used[it.id]; });
  if (!fresh.length) return;
  const pick = fresh.filter(function (it) { return it.type === "choice"; })[0] || fresh[0];

  s.retryKps[ref.kpId] = true;
  const at = Math.min(s.items.length, session.index + 3);
  s.items.splice(at, 0, { kpId: ref.kpId, itemId: pick.id, difficulty: pick.difficulty, retry: true });
}

/* ---- answer matching -------------------------------------------------------
   Typing accents on a phone is painful, so by default "etre" passes against
   "être" and the feedback names the accent that was missed. Choice questions
   compare exactly; only typed French goes through the matcher. */

function answerMode() {
  return state.accentLenient === false ? "strict" : "lenient";
}

function matchOf(item, given) {
  if (item.type === "choice") {
    const ok = Engine.normalize(given) === Engine.normalize(item.answer);
    return { status: ok ? "exact" : "incorrect", accepted: ok, expected: item.answer, input: given, notes: [], semantic: false };
  }
  return Engine.matchAnswer(item, given, answerMode());
}

/* "Accepted — accent only. Standard spelling: être · you wrote etre — check ê." */
function accentNoteHtml(m) {
  if (!m || m.status !== "accent_only") return "";
  const marks = (m.notes || []).map(function (n) { return n.expected; })
    .filter(function (v, i, a) { return a.indexOf(v) === i; }).join(" ");
  let html = '<div class="accent-note"><b>Accepted — the accent is missing or different.</b> '
    + "Standard spelling: <b>" + esc(m.expected) + "</b>"
    + " · you wrote <i>" + esc(m.input) + "</i>";
  if (marks) html += " — check " + esc(marks);
  html += ".";
  if (m.semantic) {
    html += ' <span class="accent-warn">Here the accent changes the meaning, not just the spelling — worth getting right.</span>';
  }
  return html + "</div>";
}

function checkAnswer() {
  const ref = session.session.items[session.index];
  const pair = getItem(ref);
  const item = pair.item;
  let given = "";
  if (item.type === "choice") {
    if (!session.selected) { toast("Pick an option first"); return; }
    given = session.selected;
  } else {
    const input = document.getElementById("answerInput");
    given = input ? input.value : "";
    if (!Engine.normalize(given)) { toast("Type an answer, or skip"); return; }
  }
  const m = matchOf(item, given);
  const correct = m.accepted;

  /* Apply the mastery update immediately so the feedback can show the exact
     score movement for this answer, and so a half-finished session still
     counts. finishSession skips answers already marked applied. */
  const res = Engine.applyAttempt(state, {
    kpId: ref.kpId || null, itemId: item.id, correct: correct,
    source: item.topic || (item.fromSentence ? "sentence" : "kwiz"),
    noMastery: !!item.fromSentence || !!item.topic,
    accent: m.status === "accent_only"
  });
  saveState();
  const beforeScore = res.before;
  const afterScore = res.after;

  session.answers.push({
    itemId: item.id, kpId: ref.kpId || null, correct: correct, given: given, applied: true,
    noMastery: !!item.fromSentence || !!item.topic,
    topic: item.topic || null,
    accent: m.status === "accent_only"
  });
  session.last = {
    correct: correct, given: given, skip: false,
    noMastery: !!item.fromSentence || !!item.topic,
    accent: m,
    before: beforeScore, after: afterScore, delta: afterScore - beforeScore
  };
  session.phase = "feedback";
  if (!correct) maybeQueueRetry(ref);
  saveSession();
  renderKwiz();

  /* Auto-advance only on a correct answer: a wrong one deserves a pause. */
  if (correct && state.autoAdvance !== false) {
    const token = session.last;
    setTimeout(function () {
      if (session && session.phase === "feedback" && session.last === token) continueSession();
    }, 1100);
  }
}

function skipAnswer() {
  const ref = session.session.items[session.index];
  const pair = getItem(ref);
  /* A skip is not a wrong answer: nothing is written to mastery, the Notebook
     or the attempts log. It only records that the question went unanswered. */
  session.answers.push({ itemId: pair.item.id, kpId: ref.kpId, correct: null, given: "", applied: true });
  const now = Engine.scoreOf(state, ref.kpId);
  session.last = { correct: false, given: "", skip: true, before: now, after: now, delta: 0 };
  session.phase = "feedback";
  saveSession();
  renderKwiz();
}

function continueSession() {
  session.index += 1;
  session.phase = "question";
  session.selected = null;
  session.last = null;
  if (session.index >= session.session.items.length) {
    const record = Engine.finishSession(state, session.session, session.answers);
    record.before = session.before || {};
    /* Freeze the scores this session produced. Later practice must never
       rewrite an old report's "What changed". */
    record.after = snapshotScores(session.session.items);
    record.durationMs = Math.max(0, Date.now() - (session.startedAt || Date.now()));
    state.plan = null;
    saveState();

    /* Celebrate the moment the daily goal is crossed, not every session after. */
    const goal = state.goal || 20;
    const nowToday = Engine.todayCount(state);
    if (session.todayBefore != null && session.todayBefore < goal && nowToday >= goal) {
      setTimeout(function () { toast("Daily goal reached — " + nowToday + " questions today"); }, 500);
    }

    session = null;
    saveSession();
    navigate("#/result/" + record.id);
    return;
  }
  saveSession();
  renderKwiz();
}

/* ---------------- result ---------------- */

function fmtDuration(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return s + "s";
  return Math.floor(s / 60) + "m " + String(s % 60).padStart(2, "0") + "s";
}

function renderResult(id) {
  const record = state.sessions.filter(function (s) { return s.id === id; }).pop();
  if (!record) {
    app.innerHTML = '<div class="container"><div class="empty">Result not found. <a href="#/">Dashboard</a></div></div>';
    return;
  }

  /* One block per question rather than a five-column table: on a phone a
     table collapses into unreadable slivers, and the thing you actually want
     is "what did I write / what was right / why". */
  const rowHtml = function (a) {
    const kp = a.kpId ? KP_BY_ID[a.kpId] : TOPIC_KP[a.topic];
    const item = findItem(kp, a.itemId);
    if (!kp || !item) return "";
    const cls = a.correct === null ? "skip" : a.correct ? "good" : "bad";
    const mark = a.correct === null ? "–" : a.correct ? "✓" : "×";
    const yours = a.correct === null ? "skipped" : (a.given || "—");
    const qHtml = esc(item.prompt).replace(/_{3,}/g, '<span class="blank">____</span>');
    return '<div class="res-row ' + cls + '">'
      + '<div class="res-mark">' + mark + "</div>"
      + '<div class="res-main">'
      + '<div class="res-q">' + qHtml + "</div>"
      + '<div class="res-answers">'
      + '<div class="res-a"><span>You wrote</span><b>' + esc(yours) + "</b></div>"
      + (a.correct === false
        ? '<div class="res-a ok"><span>Correct</span><b>' + esc(item.answer) + "</b></div>"
        : "")
      + "</div>"
      + (a.accent
        ? '<div class="res-ctx">Accepted without the accent · standard: ' + esc(item.answer) + "</div>"
        : "")
      + (a.noMastery
        ? '<div class="res-ctx">' + (a.topic
          ? (a.topic === "verbs" ? "Conjugation" : "Vocabulary") + " · counts in this session, not in your grammar score"
          : "Context question from the sentence bank · not scored") + "</div>"
        : "")
      + (item.explain ? '<div class="res-exp">' + esc(item.explain) + "</div>" : "")
      + "</div>"
      + (a.kpId ? '<a class="res-study" href="#/prelearn/' + kp.id + '">Study</a>' : '<span class="res-study"></span>')
      + "</div>";
  };

  /* Missed and skipped answers come first; the ones you got right are folded
     away so the next action is not buried under ten correct rows. */
  const missedRows = record.answers.filter(function (a) { return a.correct !== true; }).map(rowHtml).join("");
  const rightRows = record.answers.filter(function (a) { return a.correct === true; }).map(rowHtml).join("");
  const rightCount = record.answers.filter(function (a) { return a.correct === true; }).length;

  const wrong = record.answers.filter(function (a) { return a.correct === false; });

  /* Score movement per knowledge point, compared with the snapshot taken
     when the session started. Skipped items leave scores untouched. */
  const before = record.before || {};
  const after = record.after || {};
  const touched = {};
  record.answers.forEach(function (a) {
    if (a.correct === null || a.noMastery) return;
    if (!touched[a.kpId]) touched[a.kpId] = { right: 0, total: 0 };
    touched[a.kpId].total += 1;
    if (a.correct) touched[a.kpId].right += 1;
  });
  const changes = Object.keys(touched).map(function (kpid) {
    const s = state.kps[kpid];
    const live = s && s.n ? Engine.display(s.p, s.n) : 0;
    /* Prefer the frozen snapshot: an old report keeps its own numbers even
       after you practise the same points again. */
    const now = after[kpid] != null ? after[kpid] : live;
    const prev = before[kpid] != null ? before[kpid] : 0;
    return {
      kp: KP_BY_ID[kpid], prev: prev, now: now, delta: now - prev,
      right: touched[kpid].right, total: touched[kpid].total
    };
  }).sort(function (a, b) { return Math.abs(b.delta) - Math.abs(a.delta); });

  const hasBefore = record.before && Object.keys(record.before).length > 0;
  const changeRow = function (c) {
    const cls = c.delta > 0 ? "up" : c.delta < 0 ? "down" : "flat";
    const sign = c.delta > 0 ? "+" : "";
    return '<div class="change-row">'
      + '<span class="name">' + esc(c.kp.title) + "<small>" + esc(c.kp.level) + " · " + c.right + " / " + c.total + " correct</small></span>"
      + '<span class="from">' + c.prev + '</span><span class="arrow">→</span>'
      + '<span class="to">' + c.now + "</span>"
      + '<span class="delta ' + cls + '">' + sign + c.delta + "</span></div>";
  };
  /* Biggest three by default; the rest stay one tap away instead of pushing
     the actual next action off the screen. */
  const changeHtml = (hasBefore && changes.length)
    ? '<div class="card section-gap"><h2 style="font-size:15px;margin-bottom:2px">What changed</h2>'
      + '<p class="small" style="margin:0 0 6px">Your confidence score per point, before and after this session.</p>'
      + changes.slice(0, 3).map(changeRow).join("")
      + (changes.length > 3
        ? "<details class=\"res-more\"><summary>Show all " + changes.length + " points</summary>"
          + changes.slice(3).map(changeRow).join("") + "</details>"
        : "")
      + "</div>"
    : "";

  const answered = record.answered != null ? record.answered : record.total - (record.skipped || 0);
  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + '<div class="result-head"><h1 style="font-size:24px">'
    + (answered && record.correct === answered ? "Perfect!" : answered && record.correct / answered >= 0.6 ? "Nice effort!" : "Keep going!")
    + "</h1>"
    /* Three questions is not a rating. Short sessions show the exact count
       instead of a five-star scale. */
    + (record.total >= 5 ? '<div class="stars">' + stars(record.stars) + "</div>" : "")
    + '<div class="result-score">' + record.correct + " of " + answered + " correct"
    + (record.skipped ? " · " + record.skipped + " skipped" : "")
    + (record.durationMs ? " · " + fmtDuration(record.durationMs) : "") + "</div></div>"
    /* One solid button. The other three were equally weighted boxes, which is
       four decisions at the moment the learner wants one. */
    + '<div class="res-actions">'
    + (wrong.length
      ? '<button class="btn block" id="mistakesBtn">Practise ' + wrong.length + ' mistake' + (wrong.length > 1 ? "s" : "") + "</button>"
      : '<button class="btn block" id="newPointBtn">Learn a new point</button>')
    + '<div class="res-links">'
    + '<button class="linkbtn" data-start="' + record.total + '">Again · ' + record.total + " questions</button>"
    + (wrong.length ? '<button class="linkbtn" id="newPointBtn">Learn a new point</button>' : "")
    + '<a class="linkbtn" href="#/">Back to dashboard</a>'
    + "</div></div>"
    + (wrong.length
      ? '<p class="small" style="text-align:center;margin:10px 0 0">'
        + wrong.length + " mistake" + (wrong.length > 1 ? "s" : "") + ' added to your <a href="#/notebook">Notebook</a>.</p>'
      : "")
    + changeHtml
    + '<div class="card section-gap">'
    + '<h2 style="font-size:15px;margin-bottom:2px">' + (missedRows ? "What you missed" : "Every question") + "</h2>"
    + '<p class="small" style="margin:0 0 4px">Tap Study to open the grammar behind a question.</p>'
    + (missedRows ? '<div class="res-list">' + missedRows + "</div>" : "")
    + (rightRows
      ? (missedRows
        ? '<details class="res-fold"><summary>Show ' + rightCount + " correct answer" + (rightCount === 1 ? "" : "s") + "</summary>"
          + '<div class="res-list">' + rightRows + "</div></details>"
        : '<div class="res-list">' + rightRows + "</div>")
      : "")
    + "</div>"
    + "</div></div>";

  document.querySelectorAll("[data-start]").forEach(function (b) {
    b.addEventListener("click", function () {
      startSession(parseInt(b.getAttribute("data-start"), 10) || 10);
    });
  });
  const mb = document.getElementById("mistakesBtn");
  if (mb) mb.addEventListener("click", function () {
    startSessionFromItems(wrong.map(function (a) { return { kpId: a.kpId, itemId: a.itemId }; }));
  });
  const npb = document.getElementById("newPointBtn");
  if (npb) npb.addEventListener("click", startNewPoint);
}

/* ---------------- placement ---------------- */

function startPlacement() {
  const items = [];
  LEVELS.forEach(function (l) {
    const pool = [];
    KPS.filter(function (k) { return k.level === l.id; }).forEach(function (k) {
      k.items.filter(function (i) { return i.stage !== "guided"; }).forEach(function (i) {
        pool.push({ kpId: k.id, itemId: i.id, d: i.difficulty });
      });
    });
    pool.sort(function (a, b) { return a.d - b.d; });
    const step = Math.max(1, Math.floor(pool.length / 4));
    for (let i = 0; i < 4 && i * step < pool.length; i++) {
      items.push({ kpId: pool[i * step].kpId, itemId: pool[i * step].itemId });
    }
  });
  placement = { items: items, index: 0, answers: [], phase: "question", selected: null, result: null };
  savePlacement();
  navigate("#/placement");
}

function renderPlacement() {
  if (!placement) { startPlacement(); return; }
  if (placement.phase === "result") return renderPlacementResult();

  const total = placement.items.length;
  const ref = placement.items[placement.index];
  const pair = getItem(ref);
  if (!pair) { placement = null; savePlacement(); navigate("#/"); return; }
  const kp = pair.kp, item = pair.item;

  let inputHtml = "";
  if (item.type === "choice") {
    inputHtml = '<div class="options">' + item.options.map(function (o) {
      return '<button class="option' + (placement.selected === o ? " selected" : "") + '" data-p-option="' + esc(o) + '">' + esc(o) + "</button>";
    }).join("") + "</div>";
  } else {
    inputHtml = '<input class="answer-input" id="pInput" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer">';
  }

  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + '<div class="kwiz-top"><span>' + (placement.index + 1) + " / " + total + "</span>"
    + '<span class="track"><span class="fill" style="width:' + (placement.index / total * 100) + '%"></span></span>'
    + "<span>Placement · " + esc(kp.level) + "</span></div>"
    + '<div class="kwiz-card">'
    + '<div class="kwiz-kicker">Find your level · ' + esc(typeLabel(item)) + "</div>"
    + passageHtml(item)
    + '<div class="kwiz-prompt">' + esc(item.prompt).replace(/_{3,}/g, '<span class="blank">____</span>') + "</div>"
    + inputHtml
    + '<div class="kwiz-actions">'
    + '<button class="btn" id="pNext">Next</button>'
    + '<button class="btn subtle" id="pSkip">Skip</button>'
    + '<span class="spacer"></span><span class="kbd-hint">No feedback until the end</span>'
    + "</div></div></div></div>";

  if (item.type === "choice") {
    document.querySelectorAll("[data-p-option]").forEach(function (b) {
      b.addEventListener("click", function () {
        placement.selected = b.getAttribute("data-p-option");
        document.querySelectorAll("[data-p-option]").forEach(function (x) { x.classList.remove("selected"); });
        b.classList.add("selected");
      });
    });
  } else {
    const input = document.getElementById("pInput");
    input.focus();
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); placementNext(false); }
    });
  }
  document.getElementById("pNext").addEventListener("click", function () { placementNext(false); });
  document.getElementById("pSkip").addEventListener("click", function () { placementNext(true); });
}

function placementNext(skip) {
  const ref = placement.items[placement.index];
  const pair = getItem(ref);
  const item = pair.item;
  let given = "";

  if (!skip) {
    if (item.type === "choice") {
      if (!placement.selected) { toast("Pick an option first"); return; }
      given = placement.selected;
    } else {
      const input = document.getElementById("pInput");
      given = input ? input.value : "";
      if (!Engine.normalize(given)) { toast("Type an answer, or skip"); return; }
    }
  }

  const correct = skip ? null : matchOf(item, given).accepted;
  placement.answers.push({ kpId: ref.kpId, itemId: item.id, correct: correct, given: given });
  placement.index += 1;
  placement.selected = null;

  if (placement.index >= placement.items.length) {
    finishPlacement();
    return;
  }
  savePlacement();
  renderPlacement();
}

function finishPlacement() {
  const counts = {}, hits = {};
  LEVELS.forEach(function (l) { counts[l.id] = 0; hits[l.id] = 0; });

  /* Skipped questions are not evidence: they do not enter the denominator. */
  placement.answers.forEach(function (a) {
    if (a.correct === null) return;
    const kp = KP_BY_ID[a.kpId];
    counts[kp.level] += 1;
    if (a.correct) hits[kp.level] += 1;
  });

  const pct = {};
  LEVELS.forEach(function (l) {
    pct[l.id] = counts[l.id] ? hits[l.id] / counts[l.id] : null;
  });

  let est = "A0";
  LEVELS.forEach(function (l) { if (pct[l.id] != null && pct[l.id] >= 0.6) est = l.id; });

  /* Only the questions actually answered become evidence. A 20-question test
     cannot speak for every point in the course, so everything else stays
     genuinely untested instead of being filled with invented attempts. */
  placement.answers.forEach(function (a) {
    Engine.applyAttempt(state, {
      kpId: a.kpId, itemId: a.itemId, correct: a.correct, source: "placement"
    });
  });

  state.placement = {
    at: Date.now(), level: est, scores: pct, counts: counts, hits: hits,
    answered: placement.answers.filter(function (a) { return a.correct !== null; }).length
  };
  state.plan = null;
  saveState();

  placement.result = { level: est, pct: pct, counts: counts, hits: hits };
  placement.phase = "result";
  savePlacement();
  renderPlacement();
}

function renderPlacementResult() {
  const r = placement.result;
  const rows = LEVELS.map(function (l) {
    const seen = r.counts[l.id] || 0;
    if (!seen) {
      return '<div class="level-row">'
        + '<span class="name">' + esc(l.name) + "</span>"
        + '<span class="mini-bar"><span style="width:0"></span></span>'
        + '<span class="pct">not tested</span></div>';
    }
    const p = Math.round(r.pct[l.id] * 100);
    return '<div class="level-row">'
      + '<span class="name">' + esc(l.name) + "</span>"
      + '<span class="mini-bar"><span style="width:' + p + '%"></span></span>'
      + '<span class="pct">' + r.hits[l.id] + " / " + seen + "</span>"
      + "</div>";
  }).join("");

  const answered = placement.answers.filter(function (a) { return a.correct !== null; }).length;
  const skipped = placement.answers.length - answered;

  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + '<div class="result-head"><div class="tiny" style="letter-spacing:.12em">YOUR ESTIMATED LEVEL</div>'
    + '<h1 style="font-size:52px;margin:4px 0">' + esc(r.level) + "</h1>"
    + '<p class="small">Based on ' + answered + " answered question" + (answered === 1 ? "" : "s")
    + (skipped ? " (" + skipped + " skipped)" : "")
    + ". Only those points were measured — the rest of your Brainmap is still blank on purpose.</p></div>"
    + '<div class="card">' + rows + "</div>"
    + '<div style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap">'
    + '<a class="btn" href="#/">Start learning</a>'
    + '<button class="btn subtle" id="retakePlacement">Retake</button>'
    + "</div></div></div>";

  document.getElementById("retakePlacement").addEventListener("click", function () {
    placement = null; savePlacement(); startPlacement();
  });
}

/* ---------------- exam mode (TCF-style) ---------------- */

function tcfBand(score) {
  if (score < 101) return "A1 not reached";
  if (score < 200) return "A1";
  if (score < 300) return "A2";
  if (score < 400) return "B1";
  if (score < 500) return "B2";
  if (score < 600) return "C1";
  return "C2";
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = list[i]; list[i] = list[j]; list[j] = t;
  }
  return list;
}

function pickChoiceItems(kps, n) {
  const pool = [];
  kps.forEach(function (k) {
    k.items.filter(function (i) { return i.type === "choice"; }).forEach(function (i) {
      pool.push({ kpId: k.id, itemId: i.id });
    });
  });
  return shuffle(pool).slice(0, n);
}

function startExam() {
  const structures = pickChoiceItems(KPS.filter(function (k) {
    return (k.level === "A2" || k.level === "B1" || k.level === "B2") && k.category !== "reading";
  }), 14);
  const reading = pickChoiceItems(KPS.filter(function (k) { return k.category === "reading"; }), 6);

  exam = {
    items: structures.concat(reading),
    index: 0,
    answers: [],
    selected: null,
    startedAt: Date.now(),
    duration: 12 * 60 * 1000,
    phase: "question",
    result: null,
    before: snapshotScores(structures.concat(reading))
  };
  saveExam();
  navigate("#/exam");
}

function fmtTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

function renderExam() {
  if (!exam) { startExam(); return; }
  if (exam.phase === "result") return renderExamResult();

  const total = exam.items.length;
  const ref = exam.items[exam.index];
  const pair = getItem(ref);
  if (!pair) { exam = null; saveExam(); navigate("#/"); return; }
  const item = pair.item;

  let inputHtml = "";
  if (item.type === "choice") {
    inputHtml = '<div class="options">' + item.options.map(function (o, oi) {
      return '<button class="option' + (exam.selected === o ? " selected" : "") + '" data-e-option="' + esc(o) + '">'
        + '<span class="opt-key">' + (oi + 1) + "</span>" + esc(o) + "</button>";
    }).join("") + "</div>";
  } else {
    inputHtml = '<input class="answer-input" id="eInput" autocomplete="off" spellcheck="false" placeholder="Type your answer">';
  }

  const left = exam.duration - (Date.now() - exam.startedAt);

  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + '<div class="kwiz-top"><span>' + (exam.index + 1) + " / " + total + "</span>"
    + '<span class="track"><span class="fill" style="width:' + (exam.index / total * 100) + '%"></span></span>'
    + '<span class="exam-timer" id="examTimer">' + fmtTime(left) + "</span></div>"
    + '<div class="kwiz-card">'
    + '<div class="kwiz-kicker">TCF-style · ' + esc(typeLabel(item)) + "</div>"
    + passageHtml(item)
    + '<div class="kwiz-prompt">' + esc(item.prompt).replace(/_{3,}/g, '<span class="blank">____</span>') + "</div>"
    + inputHtml
    + '<div class="kwiz-actions">'
    + '<button class="btn" id="eNext">Next</button>'
    + '<button class="btn subtle" id="eSkip">Skip</button>'
    + '<span class="spacer"></span><span class="kbd-hint"><kbd>1</kbd>–<kbd>4</kbd> pick · <kbd>Enter</kbd> next · no feedback until the end</span>'
    + "</div></div></div></div>";

  if (item.type === "choice") {
    document.querySelectorAll("[data-e-option]").forEach(function (b) {
      b.addEventListener("click", function () {
        exam.selected = b.getAttribute("data-e-option");
        document.querySelectorAll("[data-e-option]").forEach(function (x) { x.classList.remove("selected"); });
        b.classList.add("selected");
      });
    });
  } else {
    const input = document.getElementById("eInput");
    input.focus();
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); examNext(false); }
    });
  }
  document.getElementById("eNext").addEventListener("click", function () { examNext(false); });
  document.getElementById("eSkip").addEventListener("click", function () { examNext(true); });

  if (examTimer) clearInterval(examTimer);
  examTimer = setInterval(function () {
    const el = document.getElementById("examTimer");
    if (!el) { clearInterval(examTimer); examTimer = null; return; }
    const ms = exam.duration - (Date.now() - exam.startedAt);
    el.textContent = fmtTime(ms);
    el.classList.toggle("low", ms < 60000);
    if (ms <= 0) {
      clearInterval(examTimer); examTimer = null;
      finishExam(true);
    }
  }, 500);
}

function examNext(skip) {
  const ref = exam.items[exam.index];
  const pair = getItem(ref);
  const item = pair.item;
  let given = "";

  if (!skip) {
    if (item.type === "choice") {
      if (!exam.selected) { toast("Pick an option first"); return; }
      given = exam.selected;
    } else {
      const input = document.getElementById("eInput");
      given = input ? input.value : "";
      if (!Engine.normalize(given)) { toast("Type an answer, or skip"); return; }
    }
  }

  exam.answers.push({
    kpId: ref.kpId, itemId: item.id,
    correct: skip ? null : matchOf(item, given).accepted,
    given: given
  });
  exam.index += 1;
  exam.selected = null;

  if (exam.index >= exam.items.length) { finishExam(false); return; }
  saveExam();
  renderExam();
}

function finishExam(auto) {
  if (examTimer) { clearInterval(examTimer); examTimer = null; }
  const total = exam.items.length;
  let correct = 0, skipped = 0;
  const sections = { structures: { c: 0, t: 0 }, reading: { c: 0, t: 0 } };

  exam.answers.forEach(function (a) {
    /* Unanswered is not wrong: no mastery change, no Notebook entry, and it
       stays out of the score denominator. */
    if (a.correct === null) { skipped++; return; }
    const kp = KP_BY_ID[a.kpId];
    const sec = kp.category === "reading" ? "reading" : "structures";
    sections[sec].t += 1;
    if (a.correct) { correct++; sections[sec].c += 1; }
    Engine.applyAttempt(state, {
      kpId: a.kpId, itemId: a.itemId, correct: a.correct, source: "exam"
    });
  });

  Engine.touchStreak(state);

  const answered = total - skipped;
  const score = answered ? Math.round(correct / answered * 699) : 0;
  const record = {
    at: Date.now(), score: score, band: tcfBand(score),
    correct: correct, total: total, answered: answered, skipped: skipped,
    sections: sections, auto: !!auto,
    before: exam.before || {},
    after: snapshotScores(exam.items)
  };

  state.exams = state.exams || [];
  state.exams.push(record);
  state.plan = null;
  saveState();

  exam.result = record;
  exam.phase = "result";
  saveExam();
  renderExam();
}

function renderExamResult() {
  const r = exam.result;
  const wrong = exam.answers.filter(function (a) { return a.correct === false; });

  /* Exams now feed the Brainmap, so surface what moved. */
  const before = r.before || {};
  const after = r.after || {};
  const seenKp = {};
  exam.answers.forEach(function (a) { if (a.correct !== null) seenKp[a.kpId] = true; });
  const moves = Object.keys(seenKp).map(function (kpid) {
    const s = state.kps[kpid];
    const live = s && s.n ? Engine.display(s.p, s.n) : 0;
    const now = after[kpid] != null ? after[kpid] : live;
    const prev = before[kpid] != null ? before[kpid] : 0;
    return { kp: KP_BY_ID[kpid], prev: prev, now: now, delta: now - prev };
  }).sort(function (a, b) { return Math.abs(b.delta) - Math.abs(a.delta); });
  const upCount = moves.filter(function (m) { return m.delta > 0; }).length;
  const downCount = moves.filter(function (m) { return m.delta < 0; }).length;
  const topMoves = moves.filter(function (m) { return m.delta !== 0; }).slice(0, 5);

  const movesHtml = (r.before && Object.keys(r.before).length && topMoves.length)
    ? '<div class="card section-gap"><h2 style="font-size:15px;margin-bottom:2px">Brainmap updated</h2>'
      + '<p class="small" style="margin:0 0 6px">' + upCount + " point" + (upCount === 1 ? "" : "s") + " up, "
      + downCount + " down. Biggest moves:</p>"
      + topMoves.map(function (m) {
        const cls = m.delta > 0 ? "up" : "down";
        return '<div class="change-row"><span class="name">' + esc(m.kp.title)
          + "<small>" + esc(m.kp.level) + "</small></span>"
          + '<span class="from">' + m.prev + '</span><span class="arrow">→</span>'
          + '<span class="to">' + m.now + "</span>"
          + '<span class="delta ' + cls + '">' + (m.delta > 0 ? "+" : "") + m.delta + "</span></div>";
      }).join("")
      + "</div>"
    : "";

  const rows = wrong.map(function (a, i) {
    const kp = KP_BY_ID[a.kpId];
    const item = findItem(kp, a.itemId);
    if (!item) return "";
    return "<tr><td>" + (i + 1) + "</td>"
      + '<td class="q">' + esc(item.prompt) + "</td>"
      + '<td class="bad">' + esc(a.given || "—") + "</td>"
      + '<td class="good">' + esc(item.answer) + "</td>"
      + '<td><a href="#/prelearn/' + kp.id + '" class="small">Study</a></td></tr>';
  }).join("");

  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + '<div class="result-head"><div class="tiny" style="letter-spacing:.12em">TCF-STYLE ESTIMATE</div>'
    + '<div class="exam-score">' + r.score + ' <span style="font-size:16px;color:var(--muted)">/ 699</span></div>'
    + '<div style="margin:6px 0 2px"><span class="badge ok" style="font-size:12px">' + esc(r.band) + "</span></div>"
    + '<p class="small">' + r.correct + " / " + (r.answered != null ? r.answered : r.total) + " correct"
    + (r.skipped ? " · " + r.skipped + " skipped" : "")
    + (r.auto ? " · time expired" : "") + " · this is a practice estimate, not an official score.</p></div>"

    + '<div class="card"><div class="level-row"><span class="name">Structures</span>'
    + '<span class="mini-bar"><span style="width:' + Math.round(r.sections.structures.c / Math.max(1, r.sections.structures.t) * 100) + '%"></span></span>'
    + '<span class="pct">' + r.sections.structures.c + " / " + r.sections.structures.t + "</span></div>"
    + '<div class="level-row"><span class="name">Reading</span>'
    + '<span class="mini-bar"><span style="width:' + Math.round(r.sections.reading.c / Math.max(1, r.sections.reading.t) * 100) + '%"></span></span>'
    + '<span class="pct">' + r.sections.reading.c + " / " + r.sections.reading.t + "</span></div></div>"

    + movesHtml

    + (wrong.length
      ? '<div class="card" style="margin-top:14px"><h2 style="font-size:15px;margin-bottom:8px">What to review</h2>'
        + '<table class="result-table"><thead><tr><th>#</th><th>Question</th><th>Your answer</th><th>Correct</th><th></th></tr></thead>'
        + "<tbody>" + rows + "</tbody></table></div>"
      : '<div class="card" style="margin-top:14px"><p class="small" style="margin:0">No mistakes. Try a harder set or move on to B2 reading.</p></div>')

    + '<div style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap">'
    + '<button class="btn" id="examAgain">Take again</button>'
    + '<a class="btn subtle" href="#/">Back to dashboard</a></div>'
    + "</div></div>";

  document.getElementById("examAgain").addEventListener("click", function () {
    exam = null; saveExam(); startExam();
  });
}

/* ---------------- pre-learn ---------------- */

/* Why the option you picked is wrong, for the twenty points people miss most.
   Falls back to "" so any point without curated feedback just shows the
   standard explanation. */
function distractFor(kpId, given) {
  if (typeof DISTRACT === "undefined" || !DISTRACT[kpId]) return "";
  const map = DISTRACT[kpId];
  const key = Engine.normalize(given);
  if (!key) return "";
  const hit = Object.keys(map).filter(function (k) { return Engine.normalize(k) === key; })[0];
  return hit ? map[hit] : "";
}

function whyWrongHtml(kpId, given) {
  const why = distractFor(kpId, given);
  if (!why) return "";
  return '<div class="why-wrong"><b>Why not « ' + esc(given) + " »?</b> " + esc(why) + "</div>";
}

/* ---- typing French on a phone -------------------------------------------

   The lenient matcher means a missing accent no longer fails you, but the
   fastest way to actually learn the accent is still to type it. These keys sit
   under the input; tapping é right after an e replaces the e instead of
   doubling it. */

const ACCENT_BASE = { "é": "e", "è": "e", "ê": "e", "ë": "e", "à": "a", "â": "a", "ù": "u", "û": "u", "ç": "c", "ï": "i", "î": "i", "ô": "o", "œ": "oe" };

function accentBarHtml(inputId) {
  return '<div class="accent-bar" data-for="' + inputId + '">'
    + Object.keys(ACCENT_BASE).map(function (c) {
      return '<button type="button" class="accent-key" data-accent="' + c + '">' + c + "</button>";
    }).join("")
    + "</div>";
}

function insertAccent(input, ch) {
  const base = ACCENT_BASE[ch];
  const start = input.selectionStart != null ? input.selectionStart : input.value.length;
  const end = input.selectionEnd != null ? input.selectionEnd : start;
  let value = input.value;
  let at = start;
  if (start === end && start > 0 && value.charAt(start - 1).toLowerCase() === base) {
    value = value.slice(0, start - 1) + ch + value.slice(start);
    at = start - 1;
  } else {
    value = value.slice(0, start) + ch + value.slice(end);
  }
  input.value = value;
  const pos = at + ch.length;
  if (input.setSelectionRange) input.setSelectionRange(pos, pos);
  input.focus();
}

function wireAccentBars() {
  document.querySelectorAll(".accent-bar").forEach(function (bar) {
    const input = document.getElementById(bar.getAttribute("data-for"));
    if (!input || input.disabled) return;
    bar.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-accent]");
      if (!btn) return;
      e.preventDefault();
      insertAccent(input, btn.getAttribute("data-accent"));
    });
  });
}

/* Optional Chinese subtitle for a point title. */
function zhOf(kp) {
  return (typeof ZH !== "undefined" && ZH[kp.id]) ? ZH[kp.id] : "";
}

/* Optional longer explanation, keyed by point id. */
function deepOf(kpId) {
  return (typeof DEEP !== "undefined" && DEEP[kpId]) ? DEEP[kpId] : null;
}

/* ---- tap-a-word glosses ---- */

function normWord(w) {
  let s = String(w).toLowerCase().replace(/[\u2019]/g, "'");
  s = s.replace(/^(?:[ldjmtnsc]|qu)'/, "");
  s = s.replace(/[^a-z\u00e0-\u00ff'-]/g, "");
  return s;
}

function glossFor(word) {
  if (typeof GLOSS === "undefined") return "";
  const n = normWord(word);
  if (!n) return "";
  const cands = [n, n.replace(/s$/, ""), n.replace(/e$/, ""), n.replace(/x$/, "")];
  for (let i = 0; i < cands.length; i++) {
    const c = cands[i];
    if (c && GLOSS[c]) return GLOSS[c];
  }
  return "";
}

/* Split a French example into clickable word buttons. Splitting and rejoining
   the same regex keeps the text character-for-character identical. */
function glossify(fr) {
  const parts = String(fr == null ? "" : fr).split(/([A-Za-z\u00c0-\u00ff]+(?:['\u2019][A-Za-z\u00c0-\u00ff]+)*)/);
  return parts.map(function (p) {
    if (/^[A-Za-z\u00c0-\u00ff]/.test(p)) {
      return '<button class="w" data-gloss="' + esc(p) + '">' + esc(p) + "</button>";
    }
    return esc(p);
  }).join("");
}

let glossPop = null;
function hideGloss() { if (glossPop) glossPop.hidden = true; }
function showGloss(word, cx, cy) {
  if (!glossPop) {
    glossPop = document.createElement("div");
    glossPop.className = "gloss-pop";
    glossPop.hidden = true;
    document.body.appendChild(glossPop);
  }
  const g = glossFor(word);
  glossPop.innerHTML = "<b>" + esc(word) + "</b>"
    + (g ? "<span>" + esc(g) + "</span>" : '<span class="muted">not in the 600-word deck</span>');
  glossPop.hidden = false;
  const w = glossPop.offsetWidth || 180;
  const h = glossPop.offsetHeight || 50;
  let left = cx - w / 2;
  let top = cy + 8;
  if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8;
  if (left < 8) left = 8;
  if (top + h > window.innerHeight - 8) top = cy - h - 16;
  glossPop.style.left = Math.round(left) + "px";
  glossPop.style.top = Math.round(top) + "px";
}

/* Extra examples from the deep record, merged with the short list. */
function exampleList(kp) {
  const base = kp.examples.map(function (e) { return [e.fr, e.en]; });
  const deep = deepOf(kp.id);
  if (!deep || !deep.more) return base;
  const seen = {};
  base.forEach(function (e) { seen[e[0].toLowerCase()] = true; });
  deep.more.forEach(function (e) {
    if (!seen[e[0].toLowerCase()]) {
      base.push(e);
      seen[e[0].toLowerCase()] = true;
    }
  });
  return base;
}

function usageHtml(kp) {
  const deep = deepOf(kp.id);
  if (!deep || !deep.usage) return "";
  return '<div class="usage-box">' + frify(deep.usage) + "</div>";
}

function tipHtml(kp) {
  const deep = deepOf(kp.id);
  if (!deep || !deep.tip) return "";
  return '<div class="tip-box"><span class="tip-mark">TIP</span><span>' + frify(deep.tip) + "</span></div>";
}

/* Cross-links to neighbouring lessons. "Builds on" comes from the point's own
   prereqs; "Leads to" is the reverse index built in data.js. Both are shown as
   chips that reopen the drawer on the linked point — the same navigation
   Kwiziq gives you at the foot of a lesson. */
function relatedHtml(kp) {
  const pick = function (ids) {
    return (ids || []).map(function (id) { return KP_BY_ID[id]; }).filter(Boolean);
  };
  const pre = pick(kp.prereqs);
  const dep = pick(typeof KP_DEPENDENTS !== "undefined" ? KP_DEPENDENTS[kp.id] : []);
  if (!pre.length && !dep.length) return "";

  const row = function (label, list) {
    if (!list.length) return "";
    return '<div class="rel-row"><span class="rel-label">' + label + "</span>"
      + list.slice(0, 4).map(function (p) {
        return '<button class="rel-link" data-rel="' + esc(p.id) + '">' + esc(p.title) + "</button>";
      }).join("")
      + "</div>";
  };
  return '<div class="rel-block"><div class="mb-title">Related points</div>'
    + row("Builds on", pre) + row("Leads to", dep) + "</div>";
}

/* Pull the wrong options out of the choice items so every point can show a
   "wrong vs right" table without anyone writing extra copy.
   Rows are grouped by prompt and the wrong options are merged, so a three-way
   article question reads as "la / les livre" rather than three near-identical
   lines. */
function commonMistakes(kp) {
  const groups = {};
  const order = [];
  kp.items.forEach(function (it) {
    if (it.type !== "choice" || !it.options) return;
    const right = String(it.answer).trim();
    const prompt = String(it.prompt || "");
    if (!groups[prompt]) {
      groups[prompt] = { wrongs: [], right: right, prompt: prompt };
      order.push(prompt);
    }
    it.options.forEach(function (o) {
      const wrong = String(o).trim();
      if (wrong.toLowerCase() === right.toLowerCase()) return;
      if (groups[prompt].wrongs.indexOf(wrong) < 0) groups[prompt].wrongs.push(wrong);
    });
  });
  const fill = function (prompt, word) {
    return prompt.indexOf("___") >= 0 ? prompt.replace("___", word) : word;
  };
  return order.filter(function (k) { return groups[k].wrongs.length; }).map(function (k) {
    const g = groups[k];
    return {
      wrong: fill(g.prompt, g.wrongs.join(" / ")),
      right: fill(g.prompt, g.right)
    };
  }).slice(0, 5);
}

function mistakesHtml(kp) {
  const rows = commonMistakes(kp);
  if (!rows.length) return "";
  return '<div class="mistakes-block"><div class="mb-title">Common mistakes</div>'
    + rows.map(function (r) {
      return '<div class="mb-row"><span class="x">✗</span><span class="w">' + esc(r.wrong) + "</span>"
        + '<span class="v">✓</span><span class="r">' + esc(r.right) + "</span></div>";
    }).join("")
    + "</div>";
}

function renderPrelearn(kpId) {
  const kp = KP_BY_ID[kpId];
  if (!kp) { app.innerHTML = '<div class="container"><div class="empty">Unknown point.</div></div>'; return; }
  if (!prelearn || prelearn.kpId !== kpId) {
    prelearn = { kpId: kpId, step: 1, g: 0, c: 0, checkCorrect: 0, feedback: null, given: "", revealed: false, match: null };
  }

  const stepHtml = function (n, label) {
    const cls = prelearn.step === n ? "step active" : (prelearn.step > n ? "step done" : "step");
    return '<span class="' + cls + '"><span class="dot">' + (prelearn.step > n ? "✓" : n) + "</span>" + label + "</span>";
  };

  let body = "";

  if (prelearn.step === 1) {
    /* First screen = the one rule, two examples, the single most likely
       mistake, and the button. Everything else is one tap away in <details>,
       so the primer stays a 3-minute read on a phone instead of a wall. */
    const ex = exampleList(kp);
    const firstEx = ex.slice(0, 2);
    const restEx = ex.slice(2);
    const rows = commonMistakes(kp);
    const exHtml = function (list) {
      return '<div class="ex-list">' + list.map(function (e) {
        return '<div class="ex-item"><div class="fr">' + esc(e[0]) + '</div><div class="en">' + esc(e[1]) + "</div></div>";
      }).join("") + "</div>";
    };
    const rowHtml = function (r) {
      return '<div class="mb-row"><span class="x">✗</span><span class="w">' + esc(r.wrong) + "</span>"
        + '<span class="v">✓</span><span class="r">' + esc(r.right) + "</span></div>";
    };
    const usage = usageHtml(kp);
    const tip = tipHtml(kp);

    body = '<div class="rule-box"><b>One rule:</b> ' + frify(kp.rule) + "</div>"
      + contrastHtml(kp.id)
      + exHtml(firstEx)
      + (rows.length
        ? '<div class="mistakes-block"><div class="mb-title">The usual mix-up</div>' + rowHtml(rows[0]) + "</div>"
        : "")
      + '<div style="margin-top:18px"><button class="btn block" id="step1Next">I am ready →</button>'
      + '<p class="small" style="text-align:center;margin:8px 0 0">Next: two guided questions, then three on your own.</p></div>'
      + '<div class="prelearn-more">'
      + (restEx.length
        ? "<details><summary>More examples<span class=\"cnt\">" + restEx.length + "</span></summary>" + exHtml(restEx) + "</details>"
        : "")
      + (usage
        ? "<details><summary>When to use it</summary>" + usage + "</details>"
        : "")
      + (rows.length > 1
        ? "<details><summary>Common mistakes<span class=\"cnt\">" + rows.length + "</span></summary>"
          + '<div class="mistakes-block">' + rows.slice(1).map(rowHtml).join("") + "</div></details>"
        : "")
      + (kp.pitfall
        ? "<details><summary>Watch out</summary><div class=\"pitfall\" style=\"margin-top:8px\">" + frify(kp.pitfall) + "</div></details>"
        : "")
      + (tip ? "<details><summary>Tip</summary>" + tip + "</details>" : "")
      + "</div>";
  }

  if (prelearn.step === 2) {
    const item = kp.items[prelearn.g];
    const fb = prelearn.feedback;
    const reveal = prelearn.revealed;
    body = '<div class="check-progress">Guided practice · ' + (prelearn.g + 1) + " of 2</div>"
      + passageHtml(item)
      + '<div class="kwiz-prompt">' + esc(item.prompt).replace(/_{3,}/g, '<span class="blank">____</span>') + "</div>"
      + (item.type === "choice"
        ? '<div class="options">' + item.options.map(function (o) {
            let cls = "option";
            if (fb) {
              /* After a miss we only mark the choice you made, so "Try again"
                 is a real retry rather than a second look at the answer. */
              if (prelearn.given === o && fb !== "ok") cls += " wrong";
              else if ((fb === "ok" || reveal) && Engine.normalize(o) === Engine.normalize(item.answer)) cls += " correct";
            }
            return '<button class="' + cls + '" data-g-option="' + esc(o) + '"' + (fb ? " disabled" : "") + ">" + esc(o) + "</button>";
          }).join("") + "</div>"
        : '<input class="answer-input" id="gInput" autocomplete="off" value="' + esc(prelearn.given) + '"' + (fb ? " disabled" : "") + ">"
          + (fb ? "" : accentBarHtml("gInput")))
      + (item.hint ? '<p class="small" style="margin-top:10px">Hint: ' + esc(item.hint) + "</p>" : "")
      + (fb ? '<div class="feedback ' + (fb === "ok" ? "ok" : "bad") + '"><div class="mark">' + (fb === "ok" ? "✓" : "×")
          + '</div><div class="body"><b>'
          + (fb === "ok" ? "Correct." : reveal ? "Here is the answer." : "Not quite — try again.")
          + "</b>"
          + (fb === "ok" ? accentNoteHtml(prelearn.match) : "")
          + ((fb === "ok" || reveal)
            ? '<div class="answer-line">' + esc(item.answer) + "</div>" + esc(item.explain)
            : "")
          + "</div></div>" : "")
      + '<div class="kwiz-actions">'
      + (fb === "ok" || reveal
        ? '<button class="btn" id="gNext">Continue</button>'
        : fb === "bad"
          ? '<button class="btn" id="gRetry">Try again</button>'
            + '<button class="btn subtle" id="gShow">Show answer</button>'
          : '<button class="btn" id="gCheck">Check</button>')
      + "</div>";
  }

  if (prelearn.step === 3) {
    const items = kp.items.slice(2, 5);
    if (prelearn.c >= items.length) {
      const passed = prelearn.checkCorrect >= 2;
      if (passed) {
        const s = Engine.ensure(state, kp.id);
        if (s.state === "unseen" || s.state === "primed") {
          s.state = "primed";
          s.primedAt = Date.now();
          // Guided checks are not independent quiz attempts: do not invent
          // mastery scores, question counts, or due dates.
          state.plan = null;
          saveState();
        }
      }
      body = '<div class="result-head" style="padding-top:0"><h2>' + (passed ? "You are ready." : "Almost there.") + "</h2>"
        + '<p class="small">' + prelearn.checkCorrect + " of " + items.length + " correct. "
        + (passed ? "This point is now unlocked for normal practice." : "Two out of three is the pass mark. Let's review the guided examples again.") + "</p></div>"
        + (passed
          ? '<button class="btn" id="startPractice">Practice this point</button>'
            + '<a class="btn subtle" href="#/brainmap" style="margin-left:8px">Back to Brainmap</a>'
          : '<button class="btn" id="retryGuided">Review again</button>');
    } else {
      const item = items[prelearn.c];
      const fb = prelearn.feedback;
      body = '<div class="check-progress">Check · ' + (prelearn.c + 1) + " of " + items.length
        + " · " + prelearn.checkCorrect + " correct so far</div>"
        + passageHtml(item)
        + '<div class="kwiz-prompt">' + esc(item.prompt).replace(/_{3,}/g, '<span class="blank">____</span>') + "</div>"
        + (item.type === "choice"
          ? '<div class="options">' + item.options.map(function (o) {
              let cls = "option";
              if (fb) {
                if (Engine.normalize(o) === Engine.normalize(item.answer)) cls += " correct";
                else if (prelearn.given === o) cls += " wrong";
              }
              return '<button class="' + cls + '" data-c-option="' + esc(o) + '"' + (fb ? " disabled" : "") + ">" + esc(o) + "</button>";
            }).join("") + "</div>"
          : '<input class="answer-input" id="cInput" autocomplete="off" value="' + esc(prelearn.given) + '"' + (fb ? " disabled" : "") + ">"
            + (fb ? "" : accentBarHtml("cInput")))
        + (fb ? '<div class="feedback ' + (fb === "ok" ? "ok" : "bad") + '"><div class="mark">' + (fb === "ok" ? "✓" : "×")
            + '</div><div class="body"><b>' + (fb === "ok" ? "Correct." : "Not quite.") + "</b>"
            + (fb === "ok" ? accentNoteHtml(prelearn.match) : "")
            + '<div class="answer-line">' + esc(item.answer) + "</div>"
            + (fb === "bad" && item.type === "choice" ? whyWrongHtml(kp.id, prelearn.given) : "")
            + esc(item.explain) + "</div></div>" : "")
        + '<div class="kwiz-actions">'
        + (fb ? '<button class="btn" id="cNext">Continue</button>' : '<button class="btn" id="cCheck">Check</button>')
        + "</div>";
    }
  }

  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + '<div class="page-head" style="text-align:left;margin-bottom:14px">'
    + '<div class="tiny" style="letter-spacing:.08em;color:var(--brand);font-weight:800">PRE-LEARN · ' + esc(kp.level) + "</div>"
    + '<h1 style="font-size:24px">' + esc(kp.title) + "</h1>"
    + (zhOf(kp) ? '<div class="t-zh">' + esc(zhOf(kp)) + "</div>" : "")
    + "</div>"
    + '<div class="stepper">' + stepHtml(1, "Primer") + '<span class="line"></span>'
    + stepHtml(2, "Guided") + '<span class="line"></span>' + stepHtml(3, "Check") + "</div>"
    + '<div class="card">' + body + "</div></div></div>";

  bindPrelearn(kp);
}

function bindPrelearn(kp) {
  const s1 = document.getElementById("step1Next");
  if (s1) s1.addEventListener("click", function () { prelearn.step = 2; renderPrelearn(kp.id); });

  if (prelearn.step === 2) {
    const item = kp.items[prelearn.g];
    if (item.type === "choice") {
      document.querySelectorAll("[data-g-option]").forEach(function (b) {
        b.addEventListener("click", function () {
          prelearn.given = b.getAttribute("data-g-option");
          prelearn.match = matchOf(item, prelearn.given);
          prelearn.feedback = prelearn.match.accepted ? "ok" : "bad";
          renderPrelearn(kp.id);
        });
      });
    } else {
      const input = document.getElementById("gInput");
      if (input && !prelearn.feedback) {
        input.focus();
        wireAccentBars();
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); document.getElementById("gCheck").click(); } });
      }
    }
    const gCheck = document.getElementById("gCheck");
    if (gCheck) gCheck.addEventListener("click", function () {
      const input = document.getElementById("gInput");
      prelearn.given = input ? input.value : prelearn.given;
      if (!Engine.normalize(prelearn.given)) { toast("Type an answer"); return; }
      prelearn.match = matchOf(item, prelearn.given);
      prelearn.feedback = prelearn.match.accepted ? "ok" : "bad";
      renderPrelearn(kp.id);
    });
    const gNext = document.getElementById("gNext");
    if (gNext) gNext.addEventListener("click", function () {
      prelearn.g += 1;
      prelearn.feedback = null;
      prelearn.given = "";
      prelearn.revealed = false;
      prelearn.match = null;
      if (prelearn.g >= 2) { prelearn.step = 3; prelearn.c = 0; prelearn.checkCorrect = 0; }
      renderPrelearn(kp.id);
    });
    /* A wrong guided answer used to dead-end here: every control was disabled
       and the only button was another Check. Now you can retry, or reveal and
       move on — both routes reach the Check step. */
    const gRetry = document.getElementById("gRetry");
    if (gRetry) gRetry.addEventListener("click", function () {
      prelearn.feedback = null;
      prelearn.given = "";
      prelearn.revealed = false;
      renderPrelearn(kp.id);
    });
    const gShow = document.getElementById("gShow");
    if (gShow) gShow.addEventListener("click", function () {
      prelearn.revealed = true;
      renderPrelearn(kp.id);
    });
  }

  if (prelearn.step === 3) {
    const items = kp.items.slice(2, 5);
    if (prelearn.c < items.length) {
      const item = items[prelearn.c];
      if (item.type === "choice") {
        document.querySelectorAll("[data-c-option]").forEach(function (b) {
          b.addEventListener("click", function () {
            prelearn.given = b.getAttribute("data-c-option");
            prelearn.match = matchOf(item, prelearn.given);
            const ok = prelearn.match.accepted;
            if (ok) prelearn.checkCorrect++;
            prelearn.feedback = ok ? "ok" : "bad";
            renderPrelearn(kp.id);
          });
        });
      } else {
        const input = document.getElementById("cInput");
        if (input && !prelearn.feedback) {
          input.focus();
          wireAccentBars();
          input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); document.getElementById("cCheck").click(); } });
        }
      }
      const cCheck = document.getElementById("cCheck");
      if (cCheck) cCheck.addEventListener("click", function () {
        const input = document.getElementById("cInput");
        prelearn.given = input ? input.value : prelearn.given;
        if (!Engine.normalize(prelearn.given)) { toast("Type an answer"); return; }
        prelearn.match = matchOf(item, prelearn.given);
        const ok = prelearn.match.accepted;
        if (ok) prelearn.checkCorrect++;
        prelearn.feedback = ok ? "ok" : "bad";
        renderPrelearn(kp.id);
      });
      const cNext = document.getElementById("cNext");
      if (cNext) cNext.addEventListener("click", function () {
        prelearn.c += 1;
        prelearn.feedback = null;
        prelearn.given = "";
        prelearn.match = null;
        renderPrelearn(kp.id);
      });
    } else {
      const sp = document.getElementById("startPractice");
      if (sp) sp.addEventListener("click", function () { startFocusSession(kp.id); });
      const rg = document.getElementById("retryGuided");
      if (rg) rg.addEventListener("click", function () {
        prelearn.step = 2; prelearn.g = 0; prelearn.feedback = null; prelearn.given = ""; prelearn.revealed = false;
        renderPrelearn(kp.id);
      });
    }
  }
}

/* ---------------- notebook ---------------- */

function renderNotebook() {
  const everyNote = Engine.notebookItems(state);
  /* Resolved entries keep their history but leave the review queue. */
  const nb = everyNote.filter(function (n) { return !n.resolved; });
  const done = everyNote.filter(function (n) { return n.resolved; });
  const savedIds = (state.notebook && state.notebook.kps) || [];
  const savedKps = savedIds.map(function (id) { return KP_BY_ID[id]; }).filter(Boolean);

  const rowHtml = function (n) {
    const kp = KP_BY_ID[n.kpId];
    if (!kp) return "";
    const item = findItem(kp, n.itemId);
    if (!item) return "";
    const qHtml = esc(item.prompt).replace(/_{3,}/g, '<span class="blank">____</span>');
    return '<div class="nb-item' + (n.resolved ? " resolved" : "") + '">'
      + '<div class="nb-main">'
      + '<div class="nb-q">' + qHtml + "</div>"
      + '<div class="nb-meta">' + esc(kp.title) + ' · missed <b class="nb-miss">' + n.wrong + "×</b>"
      + (n.resolved ? ' · <span class="nb-ok">resolved</span>' : "") + "</div>"
      + '<div class="nb-ans"><span>Answer</span><b>' + esc(item.answer) + "</b></div>"
      + "</div>"
      + '<div class="nb-acts">'
      + '<button class="btn sm" data-nb-practice="' + n.itemId + '">Practise</button>'
      + '<button class="btn sm subtle" data-nb-remove="' + n.itemId + '">Remove</button>'
      + "</div></div>";
  };

  const rows = nb.map(rowHtml).join("");
  const doneRows = done.map(rowHtml).join("");

  const savedHtml = savedKps.length
    ? '<div class="lib-grid" style="margin-top:10px">' + savedKps.map(function (kp) {
        const s = state.kps[kp.id];
        const sc = s ? Engine.display(s.p, s.n) : 0;
        return '<div class="lib-card">'
          + '<div class="lvl">' + esc(kp.level) + " · " + esc(CATEGORIES[kp.category] || kp.category) + "</div>"
          + '<div class="t">' + esc(kp.title) + "</div>"
          + '<div class="fr">' + esc(kp.titleFr) + "</div>"
          + '<div class="foot"><span class="score" style="color:' + scoreColor(sc, s ? s.n : 0) + '">'
          + (s && s.n ? sc : "—") + "</span>"
          + '<button class="btn sm ghost" data-nb-open="' + kp.id + '">Open</button></div></div>';
      }).join("") + "</div>"
    : '<div class="empty" style="margin-top:10px">No saved points yet. Open any point and choose “Save to Notebook”.</div>';

  app.innerHTML = '<div class="container">'
    + '<div class="page-head"><h1>Notebook</h1>'
    + '<p>Wrong answers land here. Two right answers retire one.</p></div>'
    + '<div class="nb-actions">'
    + (nb.length ? '<button class="btn" id="nbPractiseAll">Practise all ' + nb.length + "</button>" : "")
    + (nb.length ? '<button class="btn subtle" id="nbClear">Clear mistakes</button>' : "")
    + '<span class="spacer"></span>'
    + '<span class="small">' + nb.length + " to review"
    + (done.length ? " · " + done.length + " resolved" : "")
    + " · " + savedKps.length + " saved point" + (savedKps.length === 1 ? "" : "s") + "</span>"
    + "</div>"
    + (nb.length
      ? '<div class="card"><div class="nb-list">' + rows + "</div></div>"
      : '<div class="empty">' + (done.length
        ? "Nothing left to review — every mistake here has been answered correctly since."
        : "No mistakes yet. Finish a kwiz and anything you miss shows up here.") + "</div>")
    + (done.length
      ? "<details class=\"nb-done\"><summary>Resolved<span class=\"cnt\">" + done.length + "</span></summary>"
        + '<div class="nb-list">' + doneRows + "</div></details>"
      : "")
    + '<h2 style="font-size:16px;margin:22px 0 2px">Saved points</h2>'
    + '<p class="small">Points you bookmarked to come back to.</p>'
    + savedHtml
    + "</div>";

  const all = document.getElementById("nbPractiseAll");
  if (all) all.addEventListener("click", function () {
    startSessionFromItems(nb.map(function (n) { return { kpId: n.kpId, itemId: n.itemId }; }));
  });
  const clear = document.getElementById("nbClear");
  if (clear) clear.addEventListener("click", function () {
    if (!confirm("Clear all collected mistakes? Saved points stay.")) return;
    state.notebook.items = [];
    saveState();
    toast("Mistakes cleared");
    renderNotebook();
  });
  document.querySelectorAll("[data-nb-practice]").forEach(function (b) {
    b.addEventListener("click", function () {
      const itemId = b.getAttribute("data-nb-practice");
      const n = everyNote.filter(function (x) { return x.itemId === itemId; })[0];
      if (n) startSessionFromItems([{ kpId: n.kpId, itemId: n.itemId }]);
    });
  });
  document.querySelectorAll("[data-nb-remove]").forEach(function (b) {
    b.addEventListener("click", function () {
      Engine.removeNote(state, b.getAttribute("data-nb-remove"));
      saveState();
      renderNotebook();
    });
  });
  document.querySelectorAll("[data-nb-open]").forEach(function (b) {
    b.addEventListener("click", function () { openDrawer(b.getAttribute("data-nb-open")); });
  });
}

/* ---------------- vocabulary ---------------- */

/* vocab.js is generated by tools/fetch_vocab_examples.py; tolerate it missing. */
const VOCAB_LIST = (typeof VOCAB !== "undefined" && Array.isArray(VOCAB)) ? VOCAB : [];
let vocabFilter = "all";
let vocabFlash = null;

function vocabRecord(word) {
  if (!state.vocab) state.vocab = {};
  if (!state.vocab[word]) state.vocab[word] = { seen: 0, correct: 0, known: false, last: 0 };
  return state.vocab[word];
}

function vocabStatus(v) {
  const r = state.vocab && state.vocab[v.w];
  if (!r || !r.seen) return "new";
  if (r.known) return "known";
  return "learning";
}

function vocabShuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function renderVocab() {
  if (!VOCAB_LIST.length) {
    app.innerHTML = '<div class="container"><div class="empty">'
      + "<b>Vocabulary data is not built yet.</b><br><br>"
      + "Run these two commands in the project folder:<br><br>"
      + "<code>python tools/build_vocab.py</code><br>"
      + "<code>python tools/fetch_vocab_examples.py</code><br><br>"
      + "The first reads Lexique 3.83, the second pulls example sentences from Tatoeba."
      + "</div></div>";
    return;
  }
  if (vocabFlash) { renderVocabFlash(); return; }
  if (vocabGender) { renderGenderDrill(); return; }
  if (vocabCloze) { renderCloze(); return; }

  const counts = { all: VOCAB_LIST.length, new: 0, learning: 0, known: 0 };
  VOCAB_LIST.forEach(function (v) { counts[vocabStatus(v)] += 1; });

  const chips = [["all", "All"], ["new", "New"], ["learning", "Learning"], ["known", "Known"]].map(function (pair) {
    return '<button class="chip' + (vocabFilter === pair[0] ? " active" : "") + '" data-vfilter="' + pair[0] + '">'
      + pair[1] + " " + counts[pair[0]] + "</button>";
  }).join("");

  const shown = VOCAB_LIST.filter(function (v) {
    return vocabFilter === "all" || vocabStatus(v) === vocabFilter;
  });

  const cards = shown.map(function (v) {
    const st = vocabStatus(v);
    const ex = v.ex && v.ex[0] ? v.ex[0] : null;
    const g = v.g === "f" ? "f." : v.g === "m" ? "m." : "";
    const tappable = !!ex;
    return '<div class="vocab-card' + (tappable ? " tappable" : "") + '" data-vcard="' + esc(v.w) + '"'
      + (tappable ? ' tabindex="0" role="button" aria-expanded="false"' : "") + '>'
      + '<div class="vc-head"><span class="vc-word">' + esc(v.w) + "</span>"
      + '<span class="vc-pos">' + esc(v.pos) + (g ? " · " + g : "") + "</span>"
      + '<span class="vc-rank">' + esc(v.level || "") + " · #" + v.rank + "</span></div>"
      + (ex
        ? '<div class="vc-ex"><div class="fr">' + esc(ex[0]) + '</div>'
          + '<div class="en" hidden>' + esc(ex[1]) + "</div></div>"
        : '<div class="vc-ex"><div class="fr muted">No example sentence yet.</div></div>')
      + '<div class="vc-foot">'
      + (tappable && !state.vocabTapped ? '<span class="vc-hint">Tap to translate</span>' : '<span></span>')
      + '<button class="btn sm subtle" data-vknown="' + esc(v.w) + '">'
      + (st === "known" ? "Known ✓" : "Mark known") + "</button>"
      + "</div></div>";
  }).join("");

  app.innerHTML = '<div class="container">'
    + '<div class="page-head"><h1>Vocabulary</h1>'
    + '<p>' + VOCAB_LIST.length + ' words, most useful first.</p></div>'
    + '<div class="nb-actions">'
    + '<button class="btn block" id="vocabFlashBtn">Flashcards · ' + counts.new + " new</button>"
    + '<div class="vocab-modes">'
    + '<button class="btn sm ghost" id="vocabClozeBtn">Cloze</button>'
    + '<button class="btn sm ghost" id="vocabGenderBtn">Gender drill</button>'
    + '<button class="btn sm ghost" id="vocabKnownBtn">Practise known</button>'
    + "</div>"
    + '<span class="spacer"></span>'
    + '<span class="small">' + counts.known + " known · " + counts.learning + " learning</span></div>"
    + '<div class="lib-filters">' + chips + "</div>"
    + (shown.length ? '<div class="vocab-grid">' + cards + "</div>"
      : '<div class="empty">Nothing in this filter yet.</div>')
    + "</div>";

  document.querySelectorAll("[data-vfilter]").forEach(function (b) {
    b.addEventListener("click", function () {
      vocabFilter = b.getAttribute("data-vfilter");
      renderVocab();
    });
  });
  /* The whole card is the tap target for the translation — a small link was
     hard to hit on a phone, and the card tint makes the state obvious. */
  function toggleVocabCard(card) {
    const en = card.querySelector(".en");
    if (!en) return;
    en.hidden = !en.hidden;
    const on = !en.hidden;
    card.classList.toggle("show-en", on);
    card.setAttribute("aria-expanded", on ? "true" : "false");
    const hint = card.querySelector(".vc-hint");
    if (hint) hint.textContent = on ? "Showing translation" : "Tap to translate";
    /* The instruction only needs saying once per device. */
    if (!state.vocabTapped) {
      state.vocabTapped = true;
      saveState();
      document.querySelectorAll(".vc-hint").forEach(function (h) { h.remove(); });
    }
  }
  document.querySelectorAll(".vocab-card.tappable").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest("[data-vknown]")) return;
      toggleVocabCard(card);
    });
    card.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (e.target.closest("[data-vknown]")) return;
      e.preventDefault();
      toggleVocabCard(card);
    });
  });
  document.querySelectorAll("[data-vknown]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      const w = b.getAttribute("data-vknown");
      const rec = vocabRecord(w);
      rec.known = !rec.known;
      if (rec.known) { rec.seen = Math.max(1, rec.seen); rec.correct = Math.max(1, rec.correct); }
      rec.last = Date.now();
      saveState();
      renderVocab();
    });
  });
  const fb = document.getElementById("vocabFlashBtn");
  if (fb) fb.addEventListener("click", function () {
    startVocabFlash(VOCAB_LIST.filter(function (v) { return vocabStatus(v) !== "known"; }));
  });
  const kb = document.getElementById("vocabKnownBtn");
  if (kb) kb.addEventListener("click", function () {
    const known = VOCAB_LIST.filter(function (v) { return vocabStatus(v) === "known"; });
    if (!known.length) { toast("No known words yet"); return; }
    startVocabFlash(known);
  });
  const gb = document.getElementById("vocabGenderBtn");
  if (gb) gb.addEventListener("click", startGenderDrill);
  const cb = document.getElementById("vocabClozeBtn");
  if (cb) cb.addEventListener("click", startCloze);
}

function startVocabFlash(list) {
  if (!list.length) { toast("Nothing to review"); return; }
  vocabGender = null;
  vocabFlash = { queue: vocabShuffle(list), index: 0, revealed: false, known: 0, unknown: 0 };
  renderVocabFlash();
}

function renderVocabFlash() {
  const f = vocabFlash;
  if (f.index >= f.queue.length) {
    const total = f.known + f.unknown;
    app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
      + '<div class="result-head"><h1 style="font-size:24px">Deck finished</h1>'
      + '<div class="result-score">' + f.known + " known · " + f.unknown + " to review"
      + (total ? " · " + Math.round(f.known / total * 100) + "%" : "") + "</div></div>"
      + '<div style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap">'
      + '<button class="btn" id="vDone">Back to vocabulary</button></div>'
      + "</div></div>";
    document.getElementById("vDone").addEventListener("click", function () {
      vocabFlash = null;
      renderVocab();
    });
    return;
  }

  const v = f.queue[f.index];
  const ex = v.ex && v.ex[0] ? v.ex[0] : null;
  const g = v.g === "f" ? "f." : v.g === "m" ? "m." : "";

  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + '<div class="kwiz-top"><span>' + (f.index + 1) + " / " + f.queue.length + "</span>"
    + '<span class="track"><span class="fill" style="width:' + (f.index / f.queue.length * 100) + '%"></span></span>'
    + "<span>Vocabulary</span></div>"
    + '<div class="kwiz-card flash-card">'
    + '<div class="flash-word">' + esc(v.w) + "</div>"
    + '<div class="flash-meta">' + esc(v.pos) + (g ? " · " + g : "")
    + (v.level ? " · " + esc(v.level) : "") + " · rank #" + v.rank + "</div>"
    + (ex
      ? '<div class="flash-ex' + (f.revealed ? "" : " blur") + '">'
        + '<div class="fr">' + esc(ex[0]) + "</div>"
        + '<div class="en">' + esc(ex[1]) + "</div></div>"
      : '<div class="flash-ex"><div class="fr muted">No example sentence.</div></div>')
    + (f.revealed
      ? '<div class="kwiz-actions">'
        + '<button class="btn" id="vKnow">I knew it</button>'
        + '<button class="btn subtle" id="vNo">Didn\'t know</button>'
        + '<span class="spacer"></span><span class="kbd-hint"><kbd>1</kbd> knew · <kbd>2</kbd> review</span></div>'
      : '<div class="kwiz-actions"><button class="btn" id="vReveal">Show meaning</button>'
        + '<span class="spacer"></span><span class="kbd-hint"><kbd>Space</kbd> reveal</span></div>')
    + "</div></div></div>";

  const advance = function (knew) {
    const rec2 = vocabRecord(v.w);
    rec2.seen += 1;
    rec2.last = Date.now();
    if (knew) { rec2.correct += 1; rec2.known = true; f.known += 1; }
    else { rec2.known = false; f.unknown += 1; }
    logTopicAnswer("vocab", "vocab." + v.w, knew);
    saveState();
    f.index += 1;
    f.revealed = false;
    renderVocabFlash();
  };

  const rev = document.getElementById("vReveal");
  if (rev) rev.addEventListener("click", function () { f.revealed = true; renderVocabFlash(); });
  const k = document.getElementById("vKnow");
  if (k) k.addEventListener("click", function () { advance(true); });
  const n = document.getElementById("vNo");
  if (n) n.addEventListener("click", function () { advance(false); });
}

/* Gender drill: only nouns where Lexique records a gender. */
let vocabGender = null;

function startGenderDrill() {
  const nouns = VOCAB_LIST.filter(function (v) {
    return v.pos === "noun" && (v.g === "m" || v.g === "f");
  });
  if (nouns.length < 6) { toast("Not enough nouns with gender data"); return; }
  vocabFlash = null;
  vocabGender = { queue: vocabShuffle(nouns).slice(0, 20), index: 0, correct: 0, wrong: 0, picked: null };
  renderGenderDrill();
}

function renderGenderDrill() {
  const g = vocabGender;
  if (g.index >= g.queue.length) {
    const total = g.correct + g.wrong;
    app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
      + '<div class="result-head"><h1 style="font-size:24px">Gender drill done</h1>'
      + '<div class="stars">' + stars(total ? Math.round(g.correct / total * 5) : 1) + "</div>"
      + '<div class="result-score">' + g.correct + " / " + total + " correct</div></div>"
      + '<div style="display:flex;gap:10px;justify-content:center;margin-top:18px">'
      + '<button class="btn" id="gDone">Back to vocabulary</button></div></div></div>';
    document.getElementById("gDone").addEventListener("click", function () {
      vocabGender = null;
      renderVocab();
    });
    return;
  }

  const v = g.queue[g.index];
  const ex = v.ex && v.ex[0] ? v.ex[0] : null;
  const answered = !!g.picked;
  const isRight = g.picked === v.g;

  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + '<div class="kwiz-top"><span>' + (g.index + 1) + " / " + g.queue.length + "</span>"
    + '<span class="track"><span class="fill" style="width:' + (g.index / g.queue.length * 100) + '%"></span></span>'
    + "<span>Gender · " + g.correct + " ✓ / " + g.wrong + " ✗</span></div>"
    + '<div class="kwiz-card">'
    + '<div class="kwiz-kicker">Masculine or feminine?</div>'
    + '<div class="flash-word" style="margin-bottom:4px">' + esc(v.w) + "</div>"
    + '<div class="flash-meta">' + esc(v.pos) + (v.level ? " · " + esc(v.level) : "") + "</div>"
    + '<div class="gender-choices">'
    + '<button class="gender-btn' + (answered && v.g === "m" ? " correct" : "") + (answered && g.picked === "m" && v.g !== "m" ? " wrong" : "") + '" data-g="m"' + (answered ? " disabled" : "") + ">le / un<small>masculine</small></button>"
    + '<button class="gender-btn' + (answered && v.g === "f" ? " correct" : "") + (answered && g.picked === "f" && v.g !== "f" ? " wrong" : "") + '" data-g="f"' + (answered ? " disabled" : "") + ">la / une<small>feminine</small></button>"
    + "</div>"
    + (answered
      ? '<div class="feedback ' + (isRight ? "ok" : "bad") + '"><div class="mark">' + (isRight ? "✓" : "×") + "</div>"
        + '<div class="body"><b>' + (isRight ? "Correct." : "Not quite.") + "</b>"
        + esc(v.w) + " is " + (v.g === "m" ? "masculine" : "feminine") + "."
        + (ex ? '<div class="small" style="margin-top:4px">' + esc(ex[0]) + "<br>" + esc(ex[1]) + "</div>" : "")
        + "</div></div>"
        + '<div class="kwiz-actions"><button class="btn" id="gNext">' + (g.index + 1 >= g.queue.length ? "See result" : "Next") + "</button>"
        + '<span class="spacer"></span><span class="kbd-hint"><kbd>Enter</kbd> next</span></div>'
      : '<div class="kwiz-actions"><span class="spacer"></span><span class="kbd-hint"><kbd>1</kbd> masculine · <kbd>2</kbd> feminine</span></div>')
    + "</div></div></div>";

  if (!answered) {
    document.querySelectorAll("[data-g]").forEach(function (b) {
      b.addEventListener("click", function () {
        g.picked = b.getAttribute("data-g");
        if (g.picked === v.g) g.correct += 1; else g.wrong += 1;
        const rec = vocabRecord(v.w);
        rec.seen += 1;
        rec.last = Date.now();
        if (g.picked === v.g) rec.correct += 1;
        logTopicAnswer("vocab", "gender." + v.w, g.picked === v.g);
        saveState();
        renderGenderDrill();
      });
    });
  } else {
    const nx = document.getElementById("gNext");
    if (nx) nx.addEventListener("click", function () {
      g.index += 1;
      g.picked = null;
      renderGenderDrill();
    });
  }
}

/* ---------------- verbs ---------------- */

/* verbs.js is generated by tools/build_verbs.py; tolerate it missing. */
const VERB_LIST = (typeof VERBS !== "undefined" && Array.isArray(VERBS)) ? VERBS : [];
const VERB_INDEX = (typeof VERB_BY_INF !== "undefined") ? VERB_BY_INF : {};
const VERB_TENSE_LIST = (typeof VERB_TENSES !== "undefined") ? VERB_TENSES : [];
const VERB_PERSON_LIST = (typeof VERB_PERSONS !== "undefined") ? VERB_PERSONS : [];

let verbFocus = "être";
let verbDrill = null;

function verbElide(pronoun, form) {
  const p = String(pronoun).split(" / ")[0];
  if (p === "je" && /^[aeiouâêîôûéèêëàù]/i.test(form)) return "j'" + form;
  return p + " " + form;
}

function verbRecord(key) {
  if (!state.verbs) state.verbs = {};
  if (!state.verbs[key]) state.verbs[key] = { seen: 0, correct: 0, last: 0 };
  return state.verbs[key];
}

function renderVerbs() {
  if (!VERB_LIST.length) {
    app.innerHTML = '<div class="container"><div class="empty">'
      + "<b>Conjugation data is not built yet.</b><br><br>"
      + "Run <code>python tools/build_verbs.py</code> in the project folder."
      + "</div></div>";
    return;
  }
  if (verbDrill) { renderVerbDrill(); return; }

  if (!VERB_INDEX[verbFocus]) verbFocus = VERB_LIST[0].inf;
  const v = VERB_INDEX[verbFocus];

  const options = VERB_LIST.map(function (x) {
    return '<option value="' + esc(x.inf) + '"' + (x.inf === verbFocus ? " selected" : "") + ">"
      + esc(x.inf) + " — " + esc(x.en) + "</option>";
  }).join("");

  /* Seven tenses of six forms is ~1,700px of table. Open the one you came for,
     collapse the rest; the summary still shows the tense name. */
  let openTense = 0;
  const cards = VERB_TENSE_LIST.map(function (tense) {
    const forms = v.t[tense];
    if (!forms) return "";
    const open = openTense++ === 0;
    return '<details class="tense-card"' + (open ? " open" : "") + ">"
      + '<summary class="tense-name">' + esc(tense) + "</summary>"
      + forms.map(function (f, i) {
        return '<div class="tense-row"><span class="pron">' + esc(VERB_PERSON_LIST[i]) + "</span>"
          + '<span class="form">' + esc(verbElide(VERB_PERSON_LIST[i], f)) + "</span></div>";
      }).join("")
      + "</details>";
  }).join("");

  const idx = VERB_LIST.findIndex(function (x) { return x.inf === verbFocus; });
  const prev = VERB_LIST[(idx - 1 + VERB_LIST.length) % VERB_LIST.length].inf;
  const next = VERB_LIST[(idx + 1) % VERB_LIST.length].inf;

  app.innerHTML = '<div class="container">'
    + '<div class="page-head"><h1>Verb conjugations</h1>'
    + '<p>' + VERB_LIST.length + " verbs × " + VERB_TENSE_LIST.length + " tenses.</p></div>"
    + '<div class="verb-bar">'
    + '<button class="btn sm subtle" data-verb-nav="' + esc(prev) + '">←</button>'
    + '<select id="verbSelect" class="goal-select">' + options + "</select>"
    + '<button class="btn sm subtle" data-verb-nav="' + esc(next) + '">→</button>'
    + '<span class="spacer" style="flex:1"></span>'
    + '<button class="btn" id="verbDrillBtn">Conjugation drill</button>'
    + "</div>"
    + '<div class="verb-head"><span class="verb-inf">' + esc(v.inf) + "</span>"
    + '<span class="verb-en">' + esc(v.en) + "</span>"
    + '<span class="verb-group">' + (v.group === 1 ? "1st group" : v.group === 2 ? "2nd group" : "irregular") + "</span></div>"
    + '<div class="tense-grid">' + cards + "</div>"
    + "</div>";

  document.getElementById("verbSelect").addEventListener("change", function (e) {
    verbFocus = e.target.value;
    renderVerbs();
  });
  document.querySelectorAll("[data-verb-nav]").forEach(function (b) {
    b.addEventListener("click", function () {
      verbFocus = b.getAttribute("data-verb-nav");
      renderVerbs();
    });
  });
  document.getElementById("verbDrillBtn").addEventListener("click", startVerbDrill);
}

function startVerbDrill() {
  if (!VERB_LIST.length) { toast("No conjugation data"); return; }
  verbDrill = { queue: [], index: 0, correct: 0, wrong: 0, checked: null, given: "" };
  verbDrill.queue = verbDrillQueue(15);
  renderVerbDrill();
}

function verbDrillQueue(n) {
  const pool = [];
  VERB_LIST.forEach(function (v) {
    VERB_TENSE_LIST.forEach(function (t) {
      if (!v.t[t]) return;
      for (let i = 0; i < 6; i++) {
        pool.push({ inf: v.inf, en: v.en, tense: t, person: i, answer: v.t[t][i] });
      }
    });
  });
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  return pool.slice(0, n);
}

function renderVerbDrill() {
  const d = verbDrill;
  if (d.index >= d.queue.length) {
    const total = d.correct + d.wrong;
    app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
      + '<div class="result-head"><h1 style="font-size:24px">Drill done</h1>'
      + '<div class="stars">' + stars(total ? Math.round(d.correct / total * 5) : 1) + "</div>"
      + '<div class="result-score">' + d.correct + " / " + total + " correct</div></div>"
      + '<div style="display:flex;gap:10px;justify-content:center;margin-top:18px">'
      + '<button class="btn" id="vdDone">Back to verbs</button></div></div></div>';
    document.getElementById("vdDone").addEventListener("click", function () {
      verbDrill = null;
      renderVerbs();
    });
    return;
  }

  const q = d.queue[d.index];
  const checked = d.checked;
  const pronoun = VERB_PERSON_LIST[q.person];

  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + '<div class="kwiz-top"><span>' + (d.index + 1) + " / " + d.queue.length + "</span>"
    + '<span class="track"><span class="fill" style="width:' + (d.index / d.queue.length * 100) + '%"></span></span>'
    + "<span>Conjugation · " + d.correct + " ✓ / " + d.wrong + " ✗</span></div>"
    + '<div class="kwiz-card">'
    + '<div class="kwiz-kicker">' + esc(q.tense) + "</div>"
    + '<div class="verb-drill-prompt"><span class="verb-inf">' + esc(q.inf) + "</span>"
    + '<span class="verb-en">' + esc(q.en) + "</span></div>"
    + '<div class="verb-drill-person">' + esc(pronoun) + " ______</div>"
    + '<input class="answer-input" id="verbInput" autocomplete="off" autocapitalize="off" spellcheck="false" '
    + 'placeholder="Type the conjugated form"' + (checked ? ' value="' + esc(d.given) + '" disabled' : "") + ">"
    + (checked ? "" : accentBarHtml("verbInput"))
    + (checked
      ? '<div class="feedback ' + (checked === "ok" ? "ok" : "bad") + '"><div class="mark">'
        + (checked === "ok" ? "✓" : "×") + '</div><div class="body">'
        + "<b>" + (checked === "ok" ? "Correct." : "Not quite.") + "</b>"
        + (checked === "ok" ? accentNoteHtml(d.match) : "")
        + '<div class="answer-line">' + esc(verbElide(pronoun, q.answer)) + "</div>"
        + "</div></div>"
        + '<div class="kwiz-actions"><button class="btn" id="vdNext">'
        + (d.index + 1 >= d.queue.length ? "See result" : "Next") + "</button>"
        + '<span class="spacer"></span><span class="kbd-hint"><kbd>Enter</kbd> next</span></div>'
      : '<div class="kwiz-actions"><button class="btn" id="vdCheck">Check</button>'
        + '<button class="btn subtle" id="vdSkip">Skip</button>'
        + '<span class="spacer"></span><span class="kbd-hint"><kbd>Enter</kbd> check · <kbd>Esc</kbd> skip</span></div>')
    + "</div></div></div>";

  const input = document.getElementById("verbInput");
  if (!checked) {
    input.focus();
    wireAccentBars();
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); checkVerb(); }
    });
    document.getElementById("vdCheck").addEventListener("click", checkVerb);
    document.getElementById("vdSkip").addEventListener("click", function () {
      d.given = "";
      d.checked = "bad";
      d.wrong += 1;
      renderVerbDrill();
    });
  } else {
    document.getElementById("vdNext").addEventListener("click", function () {
      d.index += 1;
      d.checked = null;
      d.given = "";
      renderVerbDrill();
    });
  }
}

function checkVerb() {
  const d = verbDrill;
  const q = d.queue[d.index];
  const input = document.getElementById("verbInput");
  const given = input ? input.value : "";
  /* Conjugation is typed French too, so it goes through the same matcher:
     "etre" passes for "être", "somes" still fails for "sommes". */
  const m = Engine.matchAnswer({ answer: q.answer }, given, answerMode());
  const ok = m.accepted;
  d.given = given;
  d.match = m;
  d.checked = ok ? "ok" : "bad";
  if (ok) d.correct += 1; else d.wrong += 1;
  const rec = verbRecord(q.inf + "|" + q.tense + "|" + q.person);
  rec.seen += 1;
  rec.last = Date.now();
  if (ok) rec.correct += 1;
  logTopicAnswer("verbs", "verb." + q.inf + "|" + q.tense + "|" + q.person, ok);
  saveState();
  renderVerbDrill();
}

/* Cloze: blank the target word out of its example sentence, pick from 4 options. */
let vocabCloze = null;

function blankWord(sentence, word) {
  const safe = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp("(^|[^\\wÀ-ÿ'-])(" + safe + ")(?=[^\\wÀ-ÿ'-]|$)", "i");
  if (!re.test(sentence)) return null;
  return sentence.replace(re, "$1____");
}

function startCloze() {
  const pool = VOCAB_LIST.filter(function (v) {
    return v.ex && v.ex[0] && v.ex[0][0];
  });
  const picked = vocabShuffle(pool);
  const queue = [];
  for (let i = 0; i < picked.length && queue.length < 10; i++) {
    const v = picked[i];
    const fr = v.ex[0][0];
    const en = v.ex[0][1];
    const blanked = blankWord(fr, v.w);
    if (!blanked) continue;
    const others = VOCAB_LIST.filter(function (x) {
      return x.pos === v.pos && x.w !== v.w;
    }).map(function (x) { return x.w; });
    if (others.length < 3) continue;
    const distractors = vocabShuffle(others).slice(0, 3);
    queue.push({
      v: v, fr: fr, en: en, blanked: blanked,
      options: vocabShuffle([v.w].concat(distractors))
    });
  }
  if (!queue.length) { toast("Not enough example sentences to build a cloze"); return; }
  vocabFlash = null;
  vocabGender = null;
  vocabCloze = { queue: queue, index: 0, correct: 0, wrong: 0, picked: null };
  renderCloze();
}

function renderCloze() {
  const c = vocabCloze;
  if (c.index >= c.queue.length) {
    const total = c.correct + c.wrong;
    app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
      + '<div class="result-head"><h1 style="font-size:24px">Cloze done</h1>'
      + '<div class="stars">' + stars(total ? Math.round(c.correct / total * 5) : 1) + "</div>"
      + '<div class="result-score">' + c.correct + " / " + total + " correct</div></div>"
      + '<div style="display:flex;gap:10px;justify-content:center;margin-top:18px">'
      + '<button class="btn" id="czDone">Back to vocabulary</button></div></div></div>';
    document.getElementById("czDone").addEventListener("click", function () {
      vocabCloze = null;
      renderVocab();
    });
    return;
  }

  const q = c.queue[c.index];
  const answered = !!c.picked;
  const isRight = answered && c.picked === q.v.w;

  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + '<div class="kwiz-top"><span>' + (c.index + 1) + " / " + c.queue.length + "</span>"
    + '<span class="track"><span class="fill" style="width:' + (c.index / c.queue.length * 100) + '%"></span></span>'
    + "<span>Cloze · " + c.correct + " ✓ / " + c.wrong + " ✗</span></div>"
    + '<div class="kwiz-card">'
    + '<div class="kwiz-kicker">Fill the gap</div>'
    + '<div class="cloze-sentence">' + esc(q.blanked).replace(/____/g, '<span class="blank">____</span>') + "</div>"
    + '<div class="options">' + q.options.map(function (o, oi) {
      let cls = "option";
      if (answered) {
        if (o === q.v.w) cls += " correct";
        else if (o === c.picked) cls += " wrong";
      }
      return '<button class="' + cls + '" data-cz="' + esc(o) + '"' + (answered ? " disabled" : "") + ">"
        + '<span class="opt-key">' + (oi + 1) + "</span>" + esc(o) + "</button>";
    }).join("") + "</div>"
    + (answered
      ? '<div class="feedback ' + (isRight ? "ok" : "bad") + '"><div class="mark">'
        + (isRight ? "✓" : "×") + '</div><div class="body">'
        + "<b>" + (isRight ? "Correct." : "The answer is " + esc(q.v.w) + ".") + "</b>"
        + '<div class="small" style="margin-top:4px">' + esc(q.fr) + "<br>" + esc(q.en) + "</div>"
        + "</div></div>"
        + '<div class="kwiz-actions"><button class="btn" id="czNext">'
        + (c.index + 1 >= c.queue.length ? "See result" : "Next") + "</button>"
        + '<span class="spacer"></span><span class="kbd-hint"><kbd>Enter</kbd> next</span></div>'
      : '<div class="kwiz-actions"><span class="spacer"></span>'
        + '<span class="kbd-hint"><kbd>1</kbd>–<kbd>4</kbd> pick</span></div>')
    + "</div></div></div>";

  if (!answered) {
    document.querySelectorAll("[data-cz]").forEach(function (b) {
      b.addEventListener("click", function () {
        const choice = b.getAttribute("data-cz");
        c.picked = choice;
        const ok = choice === q.v.w;
        if (ok) c.correct += 1; else c.wrong += 1;
        const rec = vocabRecord(q.v.w);
        rec.seen += 1;
        rec.last = Date.now();
        if (ok) rec.correct += 1;
        logTopicAnswer("vocab", "cloze." + q.v.w, ok);
        saveState();
        renderCloze();
      });
    });
  } else {
    document.getElementById("czNext").addEventListener("click", function () {
      c.index += 1;
      c.picked = null;
      renderCloze();
    });
  }
}

/* ---------------- sentence bank ---------------- */

/* sentences.js is generated by tools/build_sentences.py; tolerate it missing. */
/* The bank is 2.3 MB of array literal — 77% of everything the app ships, and
   pure parse cost on every cold start. A fresh profile never needs it (sentence
   questions only join practice once a point has three attempts behind it), so
   it loads after first paint instead of blocking it. */
let SENT_CACHE = null;
let sentLoadPromise = null;

function sentenceBank() {
  if (!SENT_CACHE && typeof SENTENCES !== "undefined" && Array.isArray(SENTENCES)) SENT_CACHE = SENTENCES;
  return SENT_CACHE || [];
}

function loadSentences() {
  if (typeof SENTENCES !== "undefined") { SENT_CACHE = SENTENCES; return Promise.resolve(SENT_CACHE); }
  if (sentLoadPromise) return sentLoadPromise;
  sentLoadPromise = new Promise(function (resolve) {
    const el = document.createElement("script");
    el.src = "sentences.js";
    el.onload = function () { SENT_CACHE = null; SENT_TAG_INDEX = null; resolve(sentenceBank()); };
    el.onerror = function () { sentLoadPromise = null; resolve([]); };
    document.body.appendChild(el);
  });
  return sentLoadPromise;
}

const SENT_TAGS = [
  ["all", "All"],
  ["negation", "Negation"],
  ["question", "Questions"],
  ["relative", "Relatives"],
  ["conditionnel", "Conditionnel"],
  ["subjonctif", "Subjonctif"],
  ["passe_compose", "Passé composé"],
  ["futur", "Futur"],
  ["prepositions", "Prepositions"],
  ["articles", "Articles"],
  ["pronouns", "Pronouns"],
  ["adverbs", "Adverbs"],
  ["general", "General"]
];

let sentTag = "all";
let sentLevel = "all";
let sentDrill = null;

function sentTagCounts() {
  const out = {};
  sentenceBank().forEach(function (s) { out[s[2]] = (out[s[2]] || 0) + 1; });
  return out;
}

function sentStat(tag) {
  if (!state.sentences) state.sentences = {};
  if (!state.sentences[tag]) state.sentences[tag] = { seen: 0, correct: 0 };
  return state.sentences[tag];
}

function renderSentencesMissing() {
  app.innerHTML = '<div class="container"><div class="empty">'
    + "<b>Sentence bank is not built yet.</b><br><br>"
    + "Run <code>python tools/build_sentences.py</code> in the project folder.<br><br>"
    + "It mines Tatoeba sentence pairs into thousands of gap-fill and word-order items."
    + "</div></div>";
}

function renderSentences() {
  if (!sentenceBank().length) {
    /* First visit to this page after a cold start: the bank is still loading. */
    if (typeof SENTENCES === "undefined") {
      app.innerHTML = '<div class="container"><div class="empty">Loading the sentence bank…</div></div>';
      loadSentences().then(function (bank) {
        if (bank.length) renderSentences();
        else renderSentencesMissing();
      });
      return;
    }
    renderSentencesMissing();
    return;
  }
  if (sentDrill) { renderSentDrill(); return; }
  if (trDrill) { renderTranslate(); return; }

  const counts = sentTagCounts();
  const chips = SENT_TAGS.filter(function (pair) {
    return pair[0] === "all" || counts[pair[0]];
  }).map(function (pair) {
    const n = pair[0] === "all" ? sentenceBank().length : counts[pair[0]];
    return '<button class="chip' + (sentTag === pair[0] ? " active" : "") + '" data-stag="' + pair[0] + '">'
      + pair[1] + " " + n + "</button>";
  }).join("");

  const total = sentenceBank().length;
  const gaps = sentenceBank().filter(function (s) { return s[5] === "gap"; }).length;

  const levelCounts = {};
  sentenceBank().forEach(function (s) {
    const lv = s[6] || "A1";
    levelCounts[lv] = (levelCounts[lv] || 0) + 1;
  });
  const levelChips = ["all", "A1", "A2", "B1", "B2"].filter(function (lv) {
    return lv === "all" || levelCounts[lv];
  }).map(function (lv) {
    const n = lv === "all" ? total : levelCounts[lv];
    return '<button class="chip' + (sentLevel === lv ? " active" : "") + '" data-slev="' + lv + '">'
      + (lv === "all" ? "All levels" : lv) + " " + n + "</button>";
  }).join("");

  const poolSize = sentenceBank().filter(function (s) {
    return (sentTag === "all" || s[2] === sentTag) && (sentLevel === "all" || s[6] === sentLevel);
  }).length;

  app.innerHTML = '<div class="container">'
    + '<div class="page-head"><h1>Sentence practice</h1>'
    + '<p>' + total + " sentences · " + gaps + " gap-fill, " + (total - gaps) + " word order.</p></div>"
    /* This page used to open on twenty filter chips and nothing else: the
       filters were the page. Now the drill is the page and the filters are a
       disclosure that says what is currently selected. */
    + '<button class="btn block" id="sentStart"' + (poolSize ? "" : " disabled") + ">Practise 10 sentences</button>"
    + '<div class="sent-modes">'
    + '<button class="btn sm ghost" id="sentStart20"' + (poolSize ? "" : " disabled") + ">20 instead</button>"
    + '<button class="btn sm ghost" id="trStart">Write your own</button>'
    + "</div>"
    + '<p class="small sent-note">' + poolSize + " sentences match"
    + (sentTag === "all" && sentLevel === "all" ? " — everything in the bank." : " the current filter.") + "</p>"
    + '<p class="small sent-note" style="margin-top:6px">Each round is ten real sentences: pick the missing word, '
    + "or put the words back in order. About three minutes.</p>"
    + '<details class="sent-filter"><summary>'
    + "Filter · " + esc(sentTag === "all" ? "all grammar" : sentTag) + " · " + esc(sentLevel === "all" ? "all levels" : sentLevel)
    + "</summary>"
    + '<div class="lib-filters">' + chips + "</div>"
    + '<div class="lib-filters" style="margin-top:-6px">' + levelChips + "</div>"
    + "</details>"
    + "</div>";

  document.querySelectorAll("[data-stag]").forEach(function (b) {
    b.addEventListener("click", function () {
      sentTag = b.getAttribute("data-stag");
      renderSentences();
    });
  });
  document.querySelectorAll("[data-slev]").forEach(function (b) {
    b.addEventListener("click", function () {
      sentLevel = b.getAttribute("data-slev");
      renderSentences();
    });
  });
  document.getElementById("sentStart").addEventListener("click", function () { startSentDrill(10); });
  document.getElementById("sentStart20").addEventListener("click", function () { startSentDrill(20); });
  document.getElementById("trStart").addEventListener("click", function () { startTranslateDrill(10); });
}

function startSentDrill(n) {
  const pool = sentenceBank().filter(function (s) {
    return (sentTag === "all" || s[2] === sentTag) && (sentLevel === "all" || s[6] === sentLevel);
  });
  if (!pool.length) { toast("Nothing in this filter"); return; }
  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t;
  }
  sentDrill = { queue: shuffled.slice(0, n), index: 0, correct: 0, wrong: 0, checked: null, picked: null, chosen: [] };
  renderSentDrill();
}

function sentWords(fr) {
  return fr.split(/\s+/).filter(Boolean);
}

function shuffleWords(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function renderSentDrill() {
  const d = sentDrill;
  if (d.index >= d.queue.length) {
    const total = d.correct + d.wrong;
    app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
      + '<div class="result-head"><h1 style="font-size:24px">'
      + (d.correct === total ? "Perfect!" : d.correct / total >= 0.6 ? "Nice effort!" : "Keep going!") + "</h1>"
      + '<div class="stars">' + stars(total ? Math.round(d.correct / total * 5) : 1) + "</div>"
      + '<div class="result-score">' + d.correct + " / " + total + " correct</div></div>"
      + '<div style="display:flex;gap:10px;justify-content:center;margin-top:18px">'
      + '<button class="btn" id="sdDone">Back to sentences</button></div></div></div>';
    document.getElementById("sdDone").addEventListener("click", function () {
      sentDrill = null;
      renderSentences();
    });
    return;
  }

  const item = d.queue[d.index];
  const fr = item[0], en = item[1], tag = item[2], blank = item[3], opts = item[4], type = item[5];
  const lvl = item[6] || "";
  const answered = !!d.checked;
  const tagLabel = (SENT_TAGS.filter(function (p) { return p[0] === tag; })[0] || [tag, tag])[1];

  /* Word-order items need their shuffled pool before the first render. */
  if (type === "order" && !d.pool) {
    d.pool = shuffleWords(sentWords(fr));
    d.chosen = [];
  }

  let body = "";
  if (type === "gap") {
    const blanked = blankWord(fr, blank) || fr;
    body = '<div class="cloze-sentence">' + esc(blanked).replace(/____/g, '<span class="blank">____</span>') + "</div>"
      + '<div class="options">' + opts.map(function (o, oi) {
        let cls = "option";
        if (answered) {
          if (o === blank) cls += " correct";
          else if (o === d.picked) cls += " wrong";
        }
        return '<button class="' + cls + '" data-sd="' + esc(o) + '"' + (answered ? " disabled" : "") + ">"
          + '<span class="opt-key">' + (oi + 1) + "</span>" + esc(o) + "</button>";
      }).join("") + "</div>";
  } else {
    const chosenSet = {};
    d.chosen.forEach(function (w, i) { chosenSet[i] = true; });
    const remaining = d.pool.map(function (w, i) {
      return '<button class="word-chip' + (chosenSet[i] ? " used" : "") + '" data-sw="' + i + '"'
        + (chosenSet[i] || answered ? " disabled" : "") + ">" + esc(w) + "</button>";
    }).join("");
    body = '<div class="order-target' + (answered ? (d.checked === "ok" ? " ok" : " bad") : "") + '">'
      + (d.chosen.length ? d.chosen.map(function (i) {
        return '<button class="word-chip chosen" data-sr="' + i + '"' + (answered ? " disabled" : "") + ">" + esc(d.pool[i]) + "</button>";
      }).join("") : '<span class="order-hint">Tap the words in order</span>')
      + "</div>"
      + '<div class="order-pool">' + remaining + "</div>";
  }

  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + '<div class="kwiz-top"><span>' + (d.index + 1) + " / " + d.queue.length + "</span>"
    + '<span class="track"><span class="fill" style="width:' + (d.index / d.queue.length * 100) + '%"></span></span>'
    + "<span>" + esc(tagLabel) + (lvl ? " · " + esc(lvl) : "") + " · " + d.correct + " ✓ / " + d.wrong + " ✗</span></div>"
    + '<div class="kwiz-card">'
    + '<div class="kwiz-kicker">' + (type === "gap" ? "Fill the gap" : "Put the words in order") + "</div>"
    + body
    + (answered
      ? '<div class="feedback ' + (d.checked === "ok" ? "ok" : "bad") + '"><div class="mark">'
        + (d.checked === "ok" ? "✓" : "×") + '</div><div class="body">'
        + "<b>" + (d.checked === "ok" ? "Correct." : "Not quite.") + "</b>"
        + '<div class="answer-line">' + esc(fr) + "</div>"
        + '<div class="small" style="margin-top:4px">' + esc(en) + "</div>"
        + "</div></div>"
        + '<div class="kwiz-actions"><button class="btn" id="sdNext">'
        + (d.index + 1 >= d.queue.length ? "See result" : "Next") + "</button>"
        + '<span class="spacer"></span><span class="kbd-hint"><kbd>Enter</kbd> next</span></div>'
      : '<div class="kwiz-actions">'
        + (type === "gap" ? "" : '<button class="btn" id="sdCheck"' + (d.chosen.length < d.pool.length ? " disabled" : "") + ">Check</button>")
        + '<button class="btn subtle" id="sdSkip">Skip</button>'
        + '<span class="spacer"></span><span class="kbd-hint">'
        + (type === "gap" ? "<kbd>1</kbd>–<kbd>4</kbd> pick" : "tap words in order")
        + " · <kbd>Esc</kbd> skip</span></div>")
    + "</div></div></div>";

  if (!answered) {
    if (type === "gap") {
      document.querySelectorAll("[data-sd]").forEach(function (b) {
        b.addEventListener("click", function () { sentAnswer(b.getAttribute("data-sd")); });
      });
    } else {
      document.querySelectorAll("[data-sw]").forEach(function (b) {
        b.addEventListener("click", function () {
          const i = parseInt(b.getAttribute("data-sw"), 10);
          if (d.chosen.indexOf(i) < 0) d.chosen.push(i);
          renderSentDrill();
        });
      });
      document.querySelectorAll("[data-sr]").forEach(function (b) {
        b.addEventListener("click", function () {
          const i = parseInt(b.getAttribute("data-sr"), 10);
          d.chosen = d.chosen.filter(function (x) { return x !== i; });
          renderSentDrill();
        });
      });
      const ck = document.getElementById("sdCheck");
      if (ck) ck.addEventListener("click", function () {
        const built = d.chosen.map(function (i) { return d.pool[i]; }).join(" ");
        sentAnswer(built, true);
      });
    }
    document.getElementById("sdSkip").addEventListener("click", function () {
      d.checked = "bad";
      d.wrong += 1;
      const st = sentStat(tag);
      st.seen += 1;
      saveState();
      renderSentDrill();
    });
  } else {
    document.getElementById("sdNext").addEventListener("click", function () {
      d.index += 1;
      d.checked = null;
      d.picked = null;
      d.pool = null;
      d.chosen = [];
      renderSentDrill();
    });
  }
}

function sentAnswer(given, isOrder) {
  const d = sentDrill;
  const item = d.queue[d.index];
  const fr = item[0], blank = item[3], tag = item[2];
  let ok;
  if (isOrder) {
    ok = Engine.normalize(given) === Engine.normalize(fr);
    d.chosenText = given;
  } else {
    ok = String(given).toLowerCase() === String(blank).toLowerCase();
    d.picked = given;
  }
  d.checked = ok ? "ok" : "bad";
  if (ok) d.correct += 1; else d.wrong += 1;
  const st = sentStat(tag);
  st.seen += 1;
  if (ok) st.correct += 1;
  saveState();
  renderSentDrill();
}

/* ---------------- translation practice ---------------- */

/* Everything here is deliberately forgiving: the point is sentence structure,
   not spelling. Accents are stripped before comparison, punctuation ignored,
   and scoring uses word-level LCS so a correct sentence in the wrong word
   order still gets partial credit instead of a flat zero. */

let trDrill = null;

function trNormalize(s) {
  return String(s)
    .toLowerCase()
    .replace(/[\u2019\u2018]/g, "'")
    .replace(/[.,!?;:\u00ab\u00bb"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trStrip(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function trWords(s) {
  return trNormalize(trStrip(s)).split(" ").filter(Boolean);
}

function lcsTable(a, b) {
  const dp = [];
  for (let i = 0; i <= a.length; i++) dp.push(new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

function scoreTranslation(given, answer) {
  const g = trWords(given);
  const a = trWords(answer);
  if (!g.length) return { pct: 0, level: "empty", g: g, a: a };
  if (g.join(" ") === a.join(" ")) return { pct: 100, level: "perfect", g: g, a: a };

  const dp = lcsTable(g, a);
  const lcs = dp[g.length][a.length];
  const precision = lcs / g.length;
  const recall = lcs / a.length;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  const pct = Math.round(f1 * 100);

  let level = "wrong";
  if (pct >= 88) level = "near";
  else if (pct >= 65) level = "close";
  else if (pct >= 40) level = "partial";
  return { pct: pct, level: level, g: g, a: a, dp: dp };
}

/* Mark which reference words the learner actually produced. */
function trDiffHtml(result) {
  const g = result.g;
  const a = result.a;
  if (!result.dp) return esc(a.join(" "));
  const marks = new Array(a.length).fill(false);
  let i = g.length, j = a.length;
  while (i > 0 && j > 0) {
    if (g[i - 1] === a[j - 1]) { marks[j - 1] = true; i--; j--; }
    else if (result.dp[i - 1][j] >= result.dp[i][j - 1]) i--;
    else j--;
  }
  return a.map(function (w, k) {
    return marks[k] ? esc(w) : '<span class="tr-miss">' + esc(w) + "</span>";
  }).join(" ");
}

/* Translation prompts come from the hand-written example sentences, not the
   mined corpus. Tatoeba's English side is full of idioms ("that doesn't add
   up"), which are impossible to produce from the translation alone. The
   examples were chosen to illustrate one grammar point each, so they are
   short, literal and always paired with a clean English gloss. */
function translatePool() {
  const out = [];
  KPS.forEach(function (kp) {
    if (kp.category === "reading") return;
    exampleList(kp).forEach(function (e) {
      const fr = e[0], en = e[1];
      if (!fr || !en) return;
      const w = fr.split(/\s+/).length;
      if (w < 3 || w > 14) return;
      out.push({ fr: fr, en: en, kp: kp });
    });
  });
  return out;
}

function startTranslateDrill(n) {
  const pool = translatePool();
  if (!pool.length) { toast("No example sentences available"); return; }
  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t;
  }
  trDrill = { queue: shuffled.slice(0, n || 10), index: 0, score: 0, done: 0, result: null, given: "" };
  renderTranslate();
}

function renderTranslate() {
  const d = trDrill;
  if (d.index >= d.queue.length) {
    const avg = d.done ? Math.round(d.score / d.done) : 0;
    app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
      + '<div class="result-head"><h1 style="font-size:24px">'
      + (avg >= 85 ? "Excellent!" : avg >= 60 ? "Getting there!" : "Keep going!") + "</h1>"
      + '<div class="stars">' + stars(d.done ? Math.round(avg / 20) : 1) + "</div>"
      + '<div class="result-score">average match ' + avg + "% over " + d.done + " sentence" + (d.done === 1 ? "" : "s") + "</div></div>"
      + '<div class="small" style="text-align:center;margin-top:8px;color:var(--muted)">'
      + "Accents and punctuation are ignored. Word order and word choice count.</div>"
      + '<div style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap">'
      + '<button class="btn" id="trAgain">10 more</button>'
      + '<button class="btn subtle" id="trDone">Back to sentences</button></div></div></div>';
    document.getElementById("trAgain").addEventListener("click", function () { startTranslateDrill(10); });
    document.getElementById("trDone").addEventListener("click", function () {
      trDrill = null;
      renderSentences();
    });
    return;
  }

  const item = d.queue[d.index];
  const fr = item.fr, en = item.en, lvl = item.kp.level || "";
  const r = d.result;
  const answered = !!r;

  let fb = "";
  if (answered) {
    const cls = r.level === "perfect" || r.level === "near" ? "ok"
      : r.level === "close" || r.level === "partial" ? "skip" : "bad";
    const mark = cls === "ok" ? "✓" : cls === "skip" ? "~" : "×";
    const label = r.level === "perfect" ? "Exactly right."
      : r.level === "near" ? "Very close — " + r.pct + "% match."
      : r.level === "close" ? "Close — " + r.pct + "% match."
      : r.level === "partial" ? "Partly there — " + r.pct + "% match."
      : "Not quite — " + r.pct + "% match.";
    fb = '<div class="feedback ' + cls + '"><div class="mark">' + mark + '</div><div class="body">'
      + "<b>" + label + "</b>"
      + '<div class="tr-block"><div class="tr-label">Reference</div>'
      + '<div class="tr-ref">' + trDiffHtml(r) + "</div></div>"
      + (d.given ? '<div class="tr-block"><div class="tr-label">You wrote</div>'
        + '<div class="tr-yours">' + esc(d.given) + "</div></div>" : "")
      + "</div></div>"
      + '<div class="kwiz-actions"><button class="btn" id="trNext">'
      + (d.index + 1 >= d.queue.length ? "See result" : "Next") + "</button>"
      + '<span class="spacer"></span><span class="kbd-hint"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> next</span></div>';
  } else {
    fb = '<div class="kwiz-actions"><button class="btn" id="trCheck">Check</button>'
      + '<button class="btn subtle" id="trReveal">Show answer</button>'
      + '<span class="spacer"></span><span class="kbd-hint"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> check</span></div>';
  }

  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + '<div class="kwiz-top"><span>' + (d.index + 1) + " / " + d.queue.length + "</span>"
    + '<span class="track"><span class="fill" style="width:' + (d.index / d.queue.length * 100) + '%"></span></span>'
    + "<span>Translate · " + esc(lvl) + " · avg " + (d.done ? Math.round(d.score / d.done) : 0) + "%</span></div>"
    + '<div class="kwiz-card">'
    + '<div class="kwiz-kicker">Write this in French · ' + esc(item.kp.title.split(":")[0]) + "</div>"
    + '<div class="tr-prompt">' + esc(en) + "</div>"
    + (answered
      ? '<div class="tr-answer-box">' + esc(d.given || "—") + "</div>"
      : '<textarea id="trInput" class="tr-input" lang="fr" autocomplete="off" autocapitalize="off" '
        + 'spellcheck="false" rows="2" placeholder="Écrivez la phrase en français…">' + esc(d.given) + "</textarea>")
    + fb
    + "</div></div></div>";

  if (!answered) {
    const input = document.getElementById("trInput");
    if (input) {
      input.focus();
      input.addEventListener("input", function () { d.given = input.value; });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          e.stopPropagation();
          checkTranslation();
        }
      });
    }
    document.getElementById("trCheck").addEventListener("click", checkTranslation);
    document.getElementById("trReveal").addEventListener("click", function () {
      d.given = "";
      d.result = scoreTranslation("", fr);
      d.result.pct = 0;
      d.result.level = "wrong";
      /* Giving up still counts as an attempt, at zero — otherwise the average
         quietly ignores the sentences you could not produce at all. */
      d.score += 0;
      d.done += 1;
      if (!state.translate) state.translate = { done: 0, totalPct: 0 };
      state.translate.done += 1;
      saveState();
      renderTranslate();
    });
  } else {
    document.getElementById("trNext").addEventListener("click", function () {
      d.index += 1;
      d.result = null;
      d.given = "";
      renderTranslate();
    });
  }
}

function checkTranslation() {
  const d = trDrill;
  const item = d.queue[d.index];
  const input = document.getElementById("trInput");
  const given = input ? input.value : d.given;
  d.given = given;
  const result = scoreTranslation(given, item.fr);
  d.result = result;
  d.score += result.pct;
  d.done += 1;
  if (!state.translate) state.translate = { done: 0, totalPct: 0 };
  state.translate.done += 1;
  state.translate.totalPct += result.pct;
  saveState();
  renderTranslate();
}

/* ---------------- library ---------------- */

let libFilter = "ALL";
let libCat = "ALL";

function renderLibrary() {
  const chips = ["ALL"].concat(LEVELS.map(function (l) { return l.id; })).map(function (id) {
    return '<button class="chip' + (libFilter === id ? " active" : "") + '" data-filter="' + id + '">' + id + "</button>";
  }).join("");

  const catOptions = ['<option value="ALL">All grammar areas</option>'].concat(
    Object.keys(CATEGORIES).map(function (c) {
      return '<option value="' + c + '"' + (libCat === c ? " selected" : "") + ">" + esc(CATEGORIES[c]) + "</option>";
    })
  ).join("");

  const cards = KPS.map(function (kp, idx) {
    const st = state.kps[kp.id];
    const sc = st ? Engine.display(st.p, st.n) : 0;
    const status = pointStatus(kp);
    const hay = (kp.title + " " + kp.titleFr + " " + kp.rule + " " + (CATEGORIES[kp.category] || "")).toLowerCase();
    return '<div class="lib-card" data-level="' + kp.level + '" data-cat="' + kp.category + '"'
      + ' data-text="' + esc(hay) + '" data-idx="' + idx + '"'
      + ' data-score="' + (st && st.n ? sc : -999) + '"'
      + ' data-last="' + (st && st.lastSeen ? st.lastSeen : 0) + '"'
      + (status === "locked" ? ' data-locked="1"' : "") + '>'
      + '<div class="lvl">' + esc(kp.level) + " · " + esc(CATEGORIES[kp.category] || kp.category) + "</div>"
      + '<div class="t">' + esc(kp.title) + "</div>"
      + (zhOf(kp) ? '<div class="t-zh">' + esc(zhOf(kp)) + "</div>" : "")
      + '<div class="fr">' + esc(kp.titleFr) + "</div>"
      + '<div class="foot"><span class="score" style="color:' + scoreColor(sc, st ? st.n : 0) + '">'
      + (st && st.n ? sc : "—") + "</span>" + badge(status)
      + '<button class="btn sm ghost" data-kp-open="' + kp.id + '">'
      + (status === "available" ? "Learn" : status === "locked" ? "Preview" : "Practice") + "</button></div></div>";
  }).join("");

  app.innerHTML = '<div class="container">'
    + '<div class="page-head"><h1>Library</h1><p>' + KPS.length + ' points. Filter, search, open.</p></div>'
    + '<div class="lib-filters">' + chips + "</div>"
    + '<div class="lib-tools"><select id="catFilter">' + catOptions + "</select>"
    + '<select id="libSort">'
    + '<option value="default">Default order</option>'
    + '<option value="weak">Weakest first</option>'
    + '<option value="strong">Strongest first</option>'
    + '<option value="recent">Recently practised</option>'
    + "</select>"
    + '<input id="libSearch" placeholder="Search: agreement, passé composé, pronoun..." autocomplete="off">'
    + '<button class="btn sm ghost" id="readBtn">Reading practice</button>'
    + '<span class="lib-count" id="libCount"></span></div>'
    + '<div class="lib-grid" id="libGrid">' + cards + "</div>"
    + '<div class="empty" id="libEmpty" hidden>No point matches these filters.</div>'
    + "</div>";

  function applyFilters() {
    const q = document.getElementById("libSearch").value.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll("#libGrid .lib-card").forEach(function (card) {
      const okLevel = libFilter === "ALL" || card.getAttribute("data-level") === libFilter;
      const okCat = libCat === "ALL" || card.getAttribute("data-cat") === libCat;
      const okText = !q || card.getAttribute("data-text").indexOf(q) >= 0;
      const ok = okLevel && okCat && okText;
      card.hidden = !ok;
      if (ok) shown++;
    });
    document.getElementById("libCount").textContent = shown + " / " + KPS.length;
    document.getElementById("libEmpty").hidden = shown > 0;
  }

  function sortCards(mode) {
    const grid = document.getElementById("libGrid");
    const cards = Array.prototype.slice.call(grid.children);
    cards.sort(function (a, b) {
      const sa = parseFloat(a.getAttribute("data-score"));
      const sb = parseFloat(b.getAttribute("data-score"));
      if (mode === "weak") return sa - sb;
      if (mode === "strong") return sb - sa;
      if (mode === "recent") {
        return parseFloat(b.getAttribute("data-last")) - parseFloat(a.getAttribute("data-last"));
      }
      return parseFloat(a.getAttribute("data-idx")) - parseFloat(b.getAttribute("data-idx"));
    });
    cards.forEach(function (c) { grid.appendChild(c); });
  }

  document.querySelectorAll("[data-filter]").forEach(function (b) {
    b.addEventListener("click", function () {
      libFilter = b.getAttribute("data-filter");
      document.querySelectorAll("[data-filter]").forEach(function (x) { x.classList.toggle("active", x === b); });
      applyFilters();
    });
  });
  document.getElementById("catFilter").addEventListener("change", function (e) {
    libCat = e.target.value;
    applyFilters();
  });
  const search = document.getElementById("libSearch");
  search.addEventListener("input", applyFilters);
  const sortSel = document.getElementById("libSort");
  if (sortSel) sortSel.addEventListener("change", function (e) { sortCards(e.target.value); });
  const readBtn = document.getElementById("readBtn");
  if (readBtn) readBtn.addEventListener("click", startReadingSession);
  document.querySelectorAll("[data-kp-open]").forEach(function (b) {
    b.addEventListener("click", function () {
      const id = b.getAttribute("data-kp-open");
      const st = Engine.statusOf(state, KP_BY_ID[id]);
      if (st === "new") navigate("#/prelearn/" + id);
      else startFocusSession(id);
    });
  });
  applyFilters();
}

/* ---------------- settings ---------------- */

function renderSettings() {
  app.innerHTML = '<div class="container" style="max-width:760px">'
    + '<div class="page-head"><h1>Settings</h1><p>Stored in this browser only.</p></div>'
    + '<div class="card">'
    + '<div class="setting-row"><div class="txt"><b>TCF-style exam</b>'
    + '<span>20 timed questions, score out of 699 with a CEFR estimate.</span></div>'
    + '<button class="btn sm ghost" id="examBtn">Start</button></div>'
    + '<div class="setting-row"><div class="txt"><b>Placement test</b>'
    + '<span>20 questions to estimate your level and seed the Brainmap.</span></div>'
    + '<button class="btn sm ghost" id="placementBtn">Start</button></div>'
    + '<div class="setting-row"><div class="txt"><b>Load demo progress</b>'
    + '<span>Fills the map with realistic scores so you can see the Brainmap in action.</span></div>'
    + '<button class="btn sm ghost" id="seedBtn">Load</button></div>'
    + '<div class="setting-row"><div class="txt"><b>Guided starting level</b>'
    + '<span>Set your learning entry point. A0 covers essentials; a placement test can also set a starting level. Higher starting levels assume earlier prerequisites without inventing mastery scores.</span></div>'
    + '<select id="learningLevelSelect" class="goal-select">'
    + '<option value="auto"' + (!state.learningLevel ? " selected" : "") + '>Auto (placement or A0)</option>'
    + LEVELS.map(function (l) {
      return '<option value="' + l.id + '"' + (state.learningLevel === l.id ? " selected" : "") + '>' + esc(l.name) + '</option>';
    }).join("")
    + '</select></div>'
    + '<div class="setting-row"><div class="txt"><b>Current guided level</b>'
    + '<span>Advances after at least 75% of points at the current level are confidently practised.</span></div>'
    + '<b>' + esc(Engine.guidedLevel(state)) + '</b></div>'
    + '<div class="setting-row"><div class="txt"><b>Daily goal</b>'
    + '<span>Questions per day shown on the dashboard.</span></div>'
    + '<select id="goalSelect" class="goal-select">'
    + [10, 20, 30, 50].map(function (g) {
      return '<option value="' + g + '"' + ((state.goal || 20) === g ? " selected" : "") + ">" + g + " / day</option>";
    }).join("")
    + "</select></div>"
    + '<div class="setting-row"><div class="txt"><b>Auto-advance</b>'
    + '<span>Jump to the next question right after a correct answer.</span></div>'
    + '<button class="btn sm subtle" id="autoBtn">' + (state.autoAdvance !== false ? "On" : "Off") + "</button></div>"
    + '<div class="setting-row"><div class="txt"><b>Lenient French accents</b>'
    + '<span>Typing <i>etre</i> passes when the answer is <i>être</i>, and the feedback shows the standard spelling. '
    + 'Off means every accent must be typed. Spelling still has to be right either way.</span></div>'
    + '<button class="btn sm subtle" id="accentBtn">' + (state.accentLenient !== false ? "On" : "Off") + "</button></div>"
    + '<div class="setting-row"><div class="txt"><b>Export progress</b>'
    + '<span>Download a JSON backup of every attempt and score.</span></div>'
    + '<button class="btn sm subtle" id="exportBtn">Export</button></div>'
    + '<div class="setting-row"><div class="txt"><b>Import progress</b>'
    + '<span>Restore a JSON backup. Replaces everything currently stored.</span></div>'
    + '<button class="btn sm subtle" id="importBtn">Import</button>'
    + '<input type="file" id="importFile" accept="application/json,.json" hidden></div>'
    + '<div class="setting-row"><div class="txt"><b>Reset everything</b>'
    + '<span>Clears all scores, sessions and streaks. Cannot be undone.</span></div>'
    + '<button class="btn sm subtle danger" id="resetBtn">Reset</button></div>'
    + "</div>"
    + '<p class="small" style="margin-top:16px">Stored in this browser under <code>' + LS_STATE + '</code>'
    + " · " + Math.round((localStorage.getItem(LS_STATE) || "").length / 1024) + " KB"
    + " · no server copy, no sync between devices.</p>"
    + '<p class="small" style="margin-top:6px">Current data: ' + state.attempts.length + " attempts, "
    + state.sessions.length + " sessions, " + KPS.length + " knowledge points"
    + (Engine.accentCount(state) ? " · " + Engine.accentCount(state) + " accepted without accents" : "")
    + ".</p>"
    + "</div>";

  document.getElementById("examBtn").addEventListener("click", function () {
    exam = null; saveExam(); startExam();
  });
  document.getElementById("placementBtn").addEventListener("click", function () {
    placement = null; savePlacement(); startPlacement();
  });
  document.getElementById("seedBtn").addEventListener("click", function () {
    Engine.seedDemo(state);
    state.plan = null;
    saveState();
    toast("Demo progress loaded");
    renderSettings();
  });
  document.getElementById("exportBtn").addEventListener("click", function () {
    /* The state object stays at the root so older builds can still read the
       file; the extra keys are metadata and are ignored on import. */
    const payload = Object.assign({}, state, {
      exportedAt: new Date().toISOString(),
      app: "kwizlocal",
      appVersion: Engine.STATE_VERSION
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "kwizlocal-" + Engine.todayStr() + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById("importBtn").addEventListener("click", function () {
    document.getElementById("importFile").click();
  });
  document.getElementById("importFile").addEventListener("change", function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(String(reader.result));
        /* Old backups, newer backups and hand-edited files all go through the
           same migration instead of being rejected on a version number. */
        const migrated = Engine.migrateState(data);
        if (!migrated) throw new Error("bad shape");
        if (!confirm("Replace current progress with this backup?")) return;
        state = migrated;
        /* Any in-flight session/exam refers to the old state — drop them. */
        session = null;
        exam = null;
        placement = null;
        saveState(); saveSession(); saveExam(); savePlacement();
        toast("Progress imported");
        renderSettings();
      } catch (err) {
        toast("That file is not a valid backup");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });
  document.getElementById("learningLevelSelect").addEventListener("change", function (e) {
    state.learningLevel = e.target.value === "auto" ? null : e.target.value;
    state.plan = null;
    saveState();
    renderSettings();
    toast("Guided learning starts at " + Engine.startingLevel(state));
  });
  document.getElementById("goalSelect").addEventListener("change", function (e) {
    state.goal = parseInt(e.target.value, 10) || 20;
    saveState();
    toast("Daily goal set to " + state.goal);
  });
  document.getElementById("accentBtn").addEventListener("click", function () {
    state.accentLenient = state.accentLenient === false;
    saveState();
    document.getElementById("accentBtn").textContent = state.accentLenient !== false ? "On" : "Off";
    toast(state.accentLenient !== false ? "Lenient accents on" : "Strict accents on");
  });
  document.getElementById("autoBtn").addEventListener("click", function () {
    state.autoAdvance = state.autoAdvance === false;
    saveState();
    document.getElementById("autoBtn").textContent = state.autoAdvance ? "On" : "Off";
  });
  document.getElementById("resetBtn").addEventListener("click", function () {
    if (!confirm("Reset all progress?")) return;
    state = Engine.newState();
    session = null;
    prelearn = null;
    exam = null;
    placement = null;
    saveState(); saveSession(); saveExam(); savePlacement();
    toast("Progress reset");
    navigate("#/");
  });
}

/* ---------------- router ---------------- */

function route() {
  if (examTimer) { clearInterval(examTimer); examTimer = null; }
  const hash = location.hash.replace(/^#/, "") || "/";
  const parts = hash.split("/").filter(Boolean);
  tooltip.hidden = true;
  hideGloss();
  closeDrawer();

  const nav = parts[0] || "dashboard";
  const navKey = (nav === "result" || nav === "kwiz" || nav === "prelearn") ? "dashboard" : nav;
  document.querySelectorAll(".nav a").forEach(function (a) {
    a.classList.toggle("active", a.getAttribute("data-nav") === navKey);
  });
  document.querySelectorAll("[data-tab]").forEach(function (a) {
    a.classList.toggle("active", a.getAttribute("data-tab") === navKey);
  });
  /* Pages that live under "More" should light up that tab. */
  const moreTab = document.querySelector('[data-tab-action="more"]');
  if (moreTab) {
    moreTab.classList.toggle("active", ["dashboard", "library", "notebook"].indexOf(navKey) < 0);
  }

  const chip = document.getElementById("streakChip");
  if (chip) chip.textContent = "DAY STREAK " + state.streak.count;

  /* Show a count on the Notebook tab so collected mistakes are visible. */
  const nbLink = document.querySelector('[data-nav="notebook"]');
  if (nbLink) {
    const nbN = Engine.notebookCount(state);
    nbLink.textContent = nbN ? "Notebook " + nbN : "Notebook";
  }

  if (!parts.length) return renderDashboard();
  switch (parts[0]) {
    case "brainmap": return renderBrainmap();
    case "library": return renderLibrary();
    case "notebook": return renderNotebook();
    case "vocab": return renderVocab();
    case "verbs": return renderVerbs();
    case "sentences": return renderSentences();
    case "translate":
      if (!trDrill) { startTranslateDrill(10); return; }
      return renderTranslate();
    case "settings": return renderSettings();
    case "kwiz": return renderKwiz();
    case "result": return renderResult(parts[1]);
    case "prelearn": return renderPrelearn(parts[1]);
    case "placement": return renderPlacement();
    case "exam": return renderExam();
    default: return renderDashboard();
  }
}

window.addEventListener("hashchange", route);

/* Reveal / hide the English translation under a reading passage.
   Delegated so it works on every screen that renders a passage. */
document.addEventListener("click", function (e) {
  const btn = e.target && e.target.closest ? e.target.closest("[data-passage-toggle]") : null;
  if (!btn) return;
  const box = btn.closest(".passage");
  const en = box ? box.querySelector(".passage-en") : null;
  if (!en) return;
  en.hidden = !en.hidden;
  btn.textContent = en.hidden ? "Show translation" : "Hide translation";
  if (box) box.classList.toggle("show-en", !en.hidden);
});

/* Tap a French word in an example to see its English gloss. */
document.addEventListener("click", function (e) {
  const t = e.target;
  if (t && t.closest && t.closest(".gloss-pop")) return;
  const w = t && t.closest ? t.closest("[data-gloss]") : null;
  if (w) {
    e.preventDefault();
    const r = w.getBoundingClientRect();
    showGloss(w.getAttribute("data-gloss"), r.left + r.width / 2, r.bottom);
    return;
  }
  hideGloss();
});

/* Switch the activity strip between the last week and the last month. */
document.addEventListener("click", function (e) {
  const b = e.target && e.target.closest ? e.target.closest("[data-act-range]") : null;
  if (!b) return;
  actRange = parseInt(b.getAttribute("data-act-range"), 10) === 30 ? 30 : 7;
  const wrap = document.getElementById("actWrap");
  if (wrap) wrap.innerHTML = activityBars();
});

document.addEventListener("keydown", function (e) {
  if (e.defaultPrevented) return;
  const hash = location.hash.replace(/^#/, "");

  /* ---- exam: 1-4 pick, Enter next, Esc skip ---- */
  if (hash.indexOf("/exam") === 0 && exam && exam.phase === "question") {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const epair = getItem(exam.items[exam.index]);
    const eitem = epair ? epair.item : null;
    if (eitem && eitem.type === "choice") {
      const en = parseInt(e.key, 10);
      if (en >= 1 && en <= eitem.options.length) {
        e.preventDefault();
        exam.selected = eitem.options[en - 1];
        saveExam();
        document.querySelectorAll("[data-e-option]").forEach(function (x, i) {
          x.classList.toggle("selected", i === en - 1);
        });
        return;
      }
    }
    if (e.key === "Enter") {
      const active = document.activeElement;
      if (active && active.id === "eInput") return;
      e.preventDefault();
      examNext(false);
    } else if (e.key === "Escape") {
      e.preventDefault();
      examNext(true);
    }
    return;
  }

  if (hash.indexOf("/kwiz") !== 0 || !session) return;
  if (session.phase === "question") {
    const pair = getItem(session.session.items[session.index]);
    const item = pair ? pair.item : null;
    if (item && item.type === "choice" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= item.options.length) {
        e.preventDefault();
        session.selected = item.options[n - 1];
        saveSession();
        document.querySelectorAll("[data-option]").forEach(function (x, i) {
          x.classList.toggle("selected", i === n - 1);
        });
        return;
      }
    }
    if (e.key === "Enter") {
      const active = document.activeElement;
      if (active && active.id === "answerInput") return;
      e.preventDefault();
      checkAnswer();
    } else if (e.key === "Escape") {
      e.preventDefault();
      skipAnswer();
    }
  } else if (e.key === "Enter" && session.phase === "feedback") {
    e.preventDefault();
    continueSession();
  }
});

document.getElementById("drawerClose").addEventListener("click", closeDrawer);
scrim.addEventListener("click", closeDrawer);

/* ---------------- mobile tab bar ---------------- */

const moreSheet = document.getElementById("moreSheet");
const sheetScrim = document.getElementById("sheetScrim");

function openSheet() {
  moreSheet.hidden = false;
  sheetScrim.hidden = false;
}

function closeSheet() {
  moreSheet.hidden = true;
  sheetScrim.hidden = true;
}

if (sheetScrim) sheetScrim.addEventListener("click", closeSheet);
if (moreSheet) {
  moreSheet.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeSheet);
  });
}
document.querySelectorAll("[data-tab-action]").forEach(function (b) {
  b.addEventListener("click", function () {
    const action = b.getAttribute("data-tab-action");
    if (action === "more") openSheet();
    if (action === "quick") startSession(3);
  });
});

/* Keep the "More" sheet's counts honest — both grow over time. */
(function () {
  const vEl = document.getElementById("moreVocabCount");
  if (vEl && typeof VOCAB !== "undefined" && VOCAB.length) {
    vEl.textContent = VOCAB.length + " words · flashcards · cloze";
  }
  const bEl = document.getElementById("moreBrainmapCount");
  if (bEl && typeof KPS !== "undefined" && KPS.length) {
    bEl.textContent = "Your " + KPS.length + " points, colour-coded";
  }
})();

route();

/* Pull the sentence bank in once the first screen is painted. Practice can use
   it from the second session onward; the Sentences page loads it explicitly if
   you get there first. */
(function warmSentences() {
  const go = function () { loadSentences(); };
  if (typeof requestIdleCallback === "function") requestIdleCallback(go, { timeout: 4000 });
  else setTimeout(go, 1500);
})();

/* If a stored profile could not be read it was copied aside first. Say so once
   rather than letting it look like the progress simply vanished. */
if (stateRescued) {
  setTimeout(function () {
    toast("Your saved progress could not be read. A copy was kept in this browser and a fresh profile was started.");
  }, 800);
}
