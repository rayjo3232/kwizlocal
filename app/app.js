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

const app = document.getElementById("app");
const tooltip = document.getElementById("tooltip");
const drawer = document.getElementById("drawer");
const drawerBody = document.getElementById("drawerBody");
const drawerTitle = document.getElementById("drawerTitle");
const scrim = document.getElementById("scrim");

/* ---------------- storage ---------------- */

function loadState() {
  try {
    const raw = localStorage.getItem(LS_STATE);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.version === 1) return s;
    }
  } catch (e) { /* file:// may block storage */ }
  return Engine.newState();
}

function saveState() {
  try { localStorage.setItem(LS_STATE, JSON.stringify(state)); } catch (e) {}
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
    new: ["NEW", "new"], due: ["DUE", "due"], weak: ["WEAK", "weak"], ok: ["OK", "ok"]
  };
  const m = map[status] || map.new;
  return '<span class="badge ' + m[1] + '">' + m[0] + "</span>";
}

function passageHtml(item) {
  if (!item.passage) return "";
  const words = item.passage.split(/\s+/).filter(Boolean).length;
  const secs = Math.max(15, Math.round(words / 2.6));
  return '<div class="passage"><div class="passage-meta">'
    + words + " words · about " + secs + "s"
    + "</div>" + esc(item.passage) + "</div>";
}

function typeLabel(item) {
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

function getItem(ref) {
  const kp = KP_BY_ID[ref.kpId];
  if (!kp) return null;
  const item = kp.items.filter(function (i) { return i.id === ref.itemId; })[0];
  return item ? { kp: kp, item: item } : null;
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
    + esc(name) + ' · ' + lvScore + '%</text>');
  svg.push('<rect data-level="' + levelId + '" x="' + rect.x + '" y="' + rect.y + '" width="' + rect.w
    + '" height="' + Math.min(22, rect.h) + '" fill="transparent" style="cursor:pointer"/>');
  const pad = 4;
  categoryBlocks(svg, kps, rect.x + pad, rect.y + 22, rect.w - pad * 2, rect.h - 28, showCategories, levelId);
}

function renderMap(height, compact) {
  const width = 1000;
  const H = height || 560;
  const focus = compact ? null : mapFocus;
  const svg = ['<svg class="map-svg" viewBox="0 0 ' + width + " " + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Brainmap">'];

  if (focus) {
    const list = KPS.filter(function (k) {
      return k.level === focus.level && (!focus.category || k.category === focus.category);
    });
    const title = focus.category
      ? (CATEGORIES[focus.category] || focus.category)
      : (LEVELS.filter(function (l) { return l.id === focus.level; })[0] || { name: focus.level }).name;
    svg.push('<text x="10" y="22" font-size="20" font-weight="800" fill="#14181D" letter-spacing="-.02em">' + esc(title) + '</text>');
    svg.push('<text x="10" y="40" font-size="10.5" fill="#8A939E">' + list.length + ' knowledge points · click a cell for details</text>');
    if (focus.category) {
      kpCells(svg, list, 8, 54, width - 16, H - 62);
    } else {
      categoryBlocks(svg, list, 8, 54, width - 16, H - 62, true, focus.level);
    }
  } else {
    const levelNodes = LEVELS.map(function (l) {
      const list = KPS.filter(function (k) { return k.level === l.id; });
      return {
        id: l.id, list: list,
        value: Math.max(18, list.reduce(function (sum, k) { return sum + k.weight; }, 0))
      };
    });
    treemap(levelNodes, 0, 0, width, H).forEach(function (r) {
      levelRegion(svg, r, r.item.id, r.item.list, !compact);
    });
  }

  svg.push("</svg>");
  return svg.join("");
}

/* ---------------- dashboard ---------------- */

/* Rolling 7-day summary: volume, time, and the weakest grammar area. */
function weeklyReport() {
  const weekAgo = Date.now() - 7 * 86400000;
  const sessions = (state.sessions || []).filter(function (s) { return s.at >= weekAgo; });
  const attempts = (state.attempts || []).filter(function (a) { return a.at >= weekAgo; });
  const questions = attempts.length;
  const correct = attempts.filter(function (a) { return a.correct; }).length;
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

  return { questions: questions, correct: correct, minutes: minutes, sessions: sessions.length, weakest: weakest };
}

function weeklyHtml() {
  const w = weeklyReport();
  if (!w.sessions && !w.questions) {
    return '<div class="week-card"><div class="wk-title">This week</div>'
      + '<div class="wk-empty">No sessions yet. Finish a quick kwiz and your numbers land here.</div></div>';
  }
  const acc = w.questions ? Math.round(w.correct / w.questions * 100) : 0;
  return '<div class="week-card"><div class="wk-title">This week</div>'
    + '<div class="wk-stats">'
    + '<div class="wk-stat"><b>' + w.questions + "</b><span>questions</span></div>"
    + '<div class="wk-stat"><b>' + acc + "%</b><span>accuracy</span></div>"
    + '<div class="wk-stat"><b>' + w.minutes + "</b><span>minutes</span></div>"
    + '<div class="wk-stat"><b>' + w.sessions + "</b><span>sessions</span></div>"
    + "</div>"
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

  /* Keep the study plan stable between renders — it should only reshuffle
     after a session, the way Kwiziq rebuilds it after each kwiz. */
  let plan;
  if (Array.isArray(state.plan) && state.plan.length) {
    plan = state.plan.map(function (id) { return KP_BY_ID[id]; }).filter(Boolean);
  }
  if (!plan || !plan.length) {
    plan = Engine.planList(state, 10);
    state.plan = plan.map(function (k) { return k.id; });
    saveState();
  }
  const recommended = LEVELS.slice().reverse().filter(function (l) {
    return Engine.levelScore(state, l.id) >= 35;
  })[0] || LEVELS[0];

  let levelRows = LEVELS.map(function (l) {
    const sc = Math.max(0, Math.round(Engine.levelScore(state, l.id)));
    const bar = Math.min(100, sc);
    const isCurrent = l.id === recommended.id;
    return '<div class="level-row' + (isCurrent ? " current" : "") + '">'
      + '<span class="name">' + esc(l.name) + '</span>'
      + '<span class="mini-bar"><span style="width:' + bar + '%"></span></span>'
      + '<span class="pct' + (sc < 40 ? " low" : "") + '">' + sc + '%</span>'
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

  app.innerHTML = '<div class="container">'
    + '<div class="page-head"><h1>Your French Dashboard</h1>'
    + '<p>' + KPS.length + ' knowledge points · A0 to B2 · everything stored on this computer</p></div>'

    + '<div class="todaybar' + (today >= dailyGoal ? " done" : "") + '">'
    + '<div class="goal"><div class="goal-head">'
    + '<span class="label">TODAY</span>'
    + '<span class="goal-num">' + today + ' <small>/ ' + dailyGoal + ' questions</small></span>'
    + (today >= dailyGoal ? '<span class="goal-check">✓ Goal met</span>' : "")
    + '</div><div class="track"><span class="fill" style="width:' + Math.min(100, Math.round(today / dailyGoal * 100)) + '%"></span></div></div>'
    + '<div class="streak-box"><span class="streak-num">' + streak + '</span>'
    + '<span class="streak-lbl">day streak</span></div>'
    + '</div>'

    + (state.attempts.length === 0 && !state.seeded && !state.placement
      ? '<div class="firstrun"><div><b>First time here?</b> Take a 20-question placement test to fill your Brainmap in about 5 minutes.</div>'
        + '<span class="spacer"></span><button class="btn sm" data-placement>Start placement</button>'
        + '<a href="#/settings" class="small">or load demo data</a></div>'
      : "")
    + (session && session.session
      ? '<div class="resume">You have a session in progress · ' + (session.index + 1) + " / " + session.session.items.length
        + '<span class="spacer"></span><button class="btn sm" id="resumeBtn">Resume</button></div>'
      : "")
    + '<div class="kwizbot">'
    + '<div class="avatar">K</div>'
    + '<div class="body"><div class="hello">Hello!</div>'
    + '<p>Short on time? Three questions takes about a minute. '
    + (due ? '<button class="linkbtn" data-due>' + due + " points are due</button>" : "Nothing due") + ", "
    + weak + " still weak.</p>"
    + '<div class="actions"><button class="btn" data-start="3">Quick · 3 questions</button>'
    + '<button class="btn subtle" data-start="10">Full kwiz · 10</button>'
    + (weak ? '<button class="btn ghost" data-weak="1">Weak points</button>' : "")
    + '<a href="#/brainmap" class="small">Brainmap</a>'
    + '<button class="linkbtn" id="newPointBtn2">Learn something new →</button></div></div></div>'

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

    + weeklyHtml()

    + '<section class="card section-gap dash-map"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">'
    + '<h2 style="font-size:15px">Your Brainmap</h2><span class="spacer" style="flex:1"></span>'
    + '<a href="#/brainmap" class="small">Open full map</a></div>'
    + '<div class="map-wrap" style="border:none;padding:0">' + renderMap(300, true) + "</div>"
    + legendHtml() + "</section>"

    + '<section class="card section-gap"><h2 style="font-size:15px;margin-bottom:4px">Your Studyplan</h2>'
    + '<p class="small">Ten points that will move your score the most right now.</p>'
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
    + '<span><i style="background:#D51C1B"></i>Mislearned</span>'
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
    + '<p>Levels contain grammar areas; every rectangle is a knowledge point. Click a level or area label to zoom in.</p></div>'
    + '<div class="map-wrap"><div class="map-toolbar">'
    + '<span class="small"><b>' + shown + '</b> points shown · <b>' + KPS.length + '</b> total</span>'
    + '<span class="spacer"></span>'
    + '<span class="small">' + Engine.dueCount(state) + ' due · ' + Engine.weakCount(state) + ' weak</span>'
    + '</div><p class="map-mobile-note">Small screen: labels are hidden — tap a block to see its name and score.</p>'
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
}

function openDrawer(kpId) {
  const kp = KP_BY_ID[kpId];
  const s = state.kps[kpId];
  const sc = s ? Engine.display(s.p, s.n) : 0;
  const st = Engine.statusOf(state, kp);

  drawerTitle.innerHTML = esc(kp.title)
    + (zhOf(kp) ? '<span class="t-zh" style="display:block">' + esc(zhOf(kp)) + "</span>" : "");
  let html = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'
    + '<span class="score-chip" style="font-size:14px;color:' + scoreColor(sc, s ? s.n : 0) + '">' + (s && s.n ? sc : "—") + "</span>"
    + badge(st) + '<span class="tiny">' + esc(kp.level) + " · " + esc(CATEGORIES[kp.category] || kp.category) + "</span></div>"
    + '<div class="rule">' + frify(kp.rule) + "</div>"
    + usageHtml(kp)
    + "<h4>Examples</h4>"
    + exampleList(kp).map(function (e) {
      return '<div class="ex"><b>' + esc(e[0]) + "</b><span>" + esc(e[1]) + "</span></div>";
    }).join("")
    + mistakesHtml(kp)
    + "<h4>Watch out</h4><div class=\"small\">" + frify(kp.pitfall) + "</div>"
    + tipHtml(kp)
    + '<div class="drawer-actions">'
    + '<button class="btn sm" data-practice="' + kp.id + '">Practice this</button>'
    + (st === "new" ? '<button class="btn sm ghost" data-prelearn="' + kp.id + '">Pre-learn (3 min)</button>' : "")
    + '<button class="btn sm subtle" data-save="' + kp.id + '">'
    + (Engine.isKpSaved(state, kp.id) ? "Saved ✓" : "Save to Notebook") + "</button>"
    + '<button class="btn sm subtle" data-master="' + kp.id + '">I already know this</button>'
    + "</div>";

  drawerBody.innerHTML = html;
  drawer.hidden = false;
  scrim.hidden = false;

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
}

function closeDrawer() {
  drawer.hidden = true;
  scrim.hidden = true;
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

function startSession(size) {
  const n = size || 10;
  const built = Engine.buildSession(state, n);
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
  const pool = [];
  kps.forEach(function (kp) {
    kp.items.filter(function (i) { return i.stage !== "guided"; }).forEach(function (i) {
      pool.push({ kpId: kp.id, itemId: i.id, difficulty: i.difficulty + Math.random() * 0.2 });
    });
  });
  pool.sort(function (a, b) { return a.difficulty - b.difficulty; });
  startSessionFromItems(pool.slice(0, size || 8));
}

function startFocusSession(kpId) {
  const kp = KP_BY_ID[kpId];
  startSessionFromItems(kp.items.slice(2, 5).map(function (i) {
    return { kpId: kp.id, itemId: i.id };
  }));
}

function startDueSession() {
  const due = KPS.filter(function (k) {
    const st = state.kps[k.id];
    return st && st.dueAt && st.dueAt <= Date.now();
  });
  if (due.length < 4) { startSession(); return; }
  const items = [];
  due.forEach(function (kp) {
    kp.items.filter(function (i) { return i.stage !== "guided"; }).slice(0, 1).forEach(function (i) {
      items.push({ kpId: kp.id, itemId: i.id });
    });
  });
  startSessionFromItems(items.slice(0, 10));
}

/* Practise everything currently sitting below the "weak" line,
   not just the mistakes from the last session. */
function startWeakSession() {
  const weakKps = KPS.filter(function (k) {
    const s = state.kps[k.id];
    return s && s.n && Engine.display(s.p, s.n) < 50;
  });
  if (!weakKps.length) { toast("No weak points right now — nice"); return; }
  startSessionFromKps(weakKps, 10);
}

/* Jump straight into a point the learner has never touched — the "learn"
   half of the learn → practise → learn loop. */
function startNewPoint() {
  const unseen = KPS.filter(function (k) {
    const s = state.kps[k.id];
    return !s || !s.n;
  });
  if (!unseen.length) { toast("You have opened every point already"); return; }
  const pick = unseen[Math.floor(Math.random() * unseen.length)];
  navigate("#/prelearn/" + pick.id);
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
      + (answered ? " disabled" : "") + ">";
  }

  let feedback = "";
  if (answered) {
    const l = session.last;
    const moveHtml = (l.delta != null)
      ? '<div class="score-move"><span class="sm-name">' + esc(kp.title.split(":")[0]) + "</span>"
        + '<span class="from">' + l.before + '</span><span class="arrow">→</span>'
        + '<span class="to">' + l.after + "</span>"
        + '<span class="delta ' + (l.delta > 0 ? "up" : l.delta < 0 ? "down" : "flat") + '">'
        + (l.delta > 0 ? "+" : "") + l.delta + "</span></div>"
      : "";
    if (l.skip) {
      feedback = '<div class="feedback skip"><div class="mark">–</div><div class="body">'
        + "<b>Skipped — no penalty.</b>"
        + '<div class="answer-line">' + esc(item.answer) + "</div>"
        + esc(item.explain) + "</div></div>";
    } else if (l.correct) {
      feedback = '<div class="feedback ok"><div class="mark">✓</div><div class="body">'
        + "<b>Correct.</b>" + moveHtml + esc(item.explain) + "</div></div>";
    } else {
      feedback = '<div class="feedback bad"><div class="mark">×</div><div class="body">'
        + "<b>Not quite.</b>" + moveHtml
        + '<div class="answer-line">' + esc(item.answer) + "</div>"
        + esc(item.explain)
        + '<div style="margin-top:6px"><a href="#/prelearn/' + kp.id + '" class="small" style="color:var(--blue);font-weight:600">Learn this point →</a></div>'
        + "</div></div>";
    }
  }

  const hint = (!answered && item.hint && item.stage === "guided")
    ? '<p class="small" style="margin-top:12px">Hint: ' + esc(item.hint) + "</p>" : "";

  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + '<div class="kwiz-top"><span>' + (session.index + 1) + " / " + total + "</span>"
    + '<span class="track"><span class="fill" style="width:' + (session.index / total * 100) + '%"></span></span>'
    + "<span>" + esc(kp.level) + " · " + esc(kp.title.split(":")[0]) + "</span></div>"
    + '<div class="kwiz-card">'
    + '<div class="kwiz-kicker">' + esc(typeLabel(item)) + "</div>"
    + passageHtml(item)
    + '<div class="kwiz-prompt">' + esc(item.prompt).replace(/___/g, '<span class="blank">____</span>') + "</div>"
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
    }
    document.getElementById("checkBtn").addEventListener("click", checkAnswer);
    document.getElementById("skipBtn").addEventListener("click", skipAnswer);
  } else {
    document.getElementById("continueBtn").addEventListener("click", continueSession);
    document.getElementById("continueBtn").focus();
  }
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
  const correct = Engine.isCorrect(item, given);

  /* Apply the mastery update immediately so the feedback can show the exact
     score movement for this answer, and so a half-finished session still
     counts. finishSession skips answers already marked applied. */
  const beforeScore = Engine.scoreOf(state, ref.kpId);
  Engine.updateKp(state, ref.kpId, correct);
  if (!correct) Engine.noteWrong(state, item.id, ref.kpId);
  state.attempts.push({ itemId: item.id, kpId: ref.kpId, correct: correct, at: Date.now() });
  state.plan = null;
  saveState();
  const afterScore = Engine.scoreOf(state, ref.kpId);

  session.answers.push({
    itemId: item.id, kpId: ref.kpId, correct: correct, given: given, applied: true
  });
  session.last = {
    correct: correct, given: given, skip: false,
    before: beforeScore, after: afterScore, delta: afterScore - beforeScore
  };
  session.phase = "feedback";
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
  session.answers.push({ itemId: pair.item.id, kpId: ref.kpId, correct: null, given: "" });
  session.last = { correct: false, given: "", skip: true };
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

  const rows = record.answers.map(function (a, i) {
    const kp = KP_BY_ID[a.kpId];
    const item = kp.items.filter(function (x) { return x.id === a.itemId; })[0];
    const cls = a.correct === null ? "skip" : a.correct ? "good" : "bad";
    const yours = a.correct === null ? "— skipped —" : (a.given || "—");
    const href = "#/prelearn/" + kp.id;
    return "<tr><td>" + (i + 1) + "</td>"
      + '<td class="q">' + esc(item.prompt) + '<div class="exp">' + esc(item.explain) + "</div></td>"
      + '<td class="' + cls + '">' + esc(yours) + "</td>"
      + '<td class="good">' + esc(item.answer) + "</td>"
      + '<td><a href="' + href + '" class="small">Study</a></td></tr>';
  }).join("");

  const wrong = record.answers.filter(function (a) { return a.correct === false; });

  /* Score movement per knowledge point, compared with the snapshot taken
     when the session started. Skipped items leave scores untouched. */
  const before = record.before || {};
  const touched = {};
  record.answers.forEach(function (a) {
    if (a.correct === null) return;
    if (!touched[a.kpId]) touched[a.kpId] = { right: 0, total: 0 };
    touched[a.kpId].total += 1;
    if (a.correct) touched[a.kpId].right += 1;
  });
  const changes = Object.keys(touched).map(function (kpid) {
    const s = state.kps[kpid];
    const now = s && s.n ? Engine.display(s.p, s.n) : 0;
    const prev = before[kpid] != null ? before[kpid] : 0;
    return {
      kp: KP_BY_ID[kpid], prev: prev, now: now, delta: now - prev,
      right: touched[kpid].right, total: touched[kpid].total
    };
  }).sort(function (a, b) { return Math.abs(b.delta) - Math.abs(a.delta); });

  const hasBefore = record.before && Object.keys(record.before).length > 0;
  const changeHtml = (hasBefore && changes.length)
    ? '<div class="card section-gap"><h2 style="font-size:15px;margin-bottom:2px">What changed</h2>'
      + '<p class="small" style="margin:0 0 6px">Your confidence score per point, before and after this session.</p>'
      + changes.map(function (c) {
        const cls = c.delta > 0 ? "up" : c.delta < 0 ? "down" : "flat";
        const sign = c.delta > 0 ? "+" : "";
        return '<div class="change-row">'
          + '<span class="name">' + esc(c.kp.title) + "<small>" + esc(c.kp.level) + " · " + c.right + " / " + c.total + " correct</small></span>"
          + '<span class="from">' + c.prev + '</span><span class="arrow">→</span>'
          + '<span class="to">' + c.now + "</span>"
          + '<span class="delta ' + cls + '">' + sign + c.delta + "</span></div>";
      }).join("")
      + "</div>"
    : "";

  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + '<div class="result-head"><h1 style="font-size:24px">'
    + (record.correct === record.total ? "Perfect!" : record.correct / record.total >= 0.6 ? "Nice effort!" : "Keep going!")
    + "</h1>"
    + '<div class="stars">' + stars(record.stars) + "</div>"
    + '<div class="result-score">' + record.correct + " of " + record.total + " correct"
    + (record.skipped ? " · " + record.skipped + " skipped" : "")
    + (record.durationMs ? " · " + fmtDuration(record.durationMs) : "") + "</div></div>"
    + changeHtml
    + '<div class="card' + (changes.length ? " section-gap" : "") + '"><table class="result-table"><thead><tr>'
    + "<th>#</th><th>Question</th><th>Your answer</th><th>Correct answer</th><th></th>"
    + "</tr></thead><tbody>" + rows + "</tbody></table></div>"
    + '<div style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap">'
    + (wrong.length ? '<button class="btn ghost" id="mistakesBtn">Practise ' + wrong.length + ' mistake' + (wrong.length > 1 ? "s" : "") + "</button>" : "")
    + '<button class="btn" data-start="' + record.total + '">Again · ' + record.total + " questions</button>"
    + '<button class="btn subtle" id="newPointBtn">Learn a new point</button>'
    + '<a class="btn subtle" href="#/">Back to dashboard</a></div>'
    + (wrong.length
      ? '<p class="small" style="text-align:center;margin-top:12px">'
        + wrong.length + " mistake" + (wrong.length > 1 ? "s" : "") + ' added to your <a href="#/notebook">Notebook</a>.</p>'
      : "")
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
    + '<div class="kwiz-prompt">' + esc(item.prompt).replace(/___/g, '<span class="blank">____</span>') + "</div>"
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

  const correct = skip ? null : Engine.isCorrect(item, given);
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
  placement.answers.forEach(function (a) {
    const kp = KP_BY_ID[a.kpId];
    counts[kp.level] += 1;
    if (a.correct) hits[kp.level] += 1;
  });

  const pct = {};
  LEVELS.forEach(function (l) {
    pct[l.id] = counts[l.id] ? hits[l.id] / counts[l.id] : 0;
  });

  let est = "A0";
  LEVELS.forEach(function (l) { if (pct[l.id] >= 0.6) est = l.id; });

  const estIdx = LEVELS.map(function (l) { return l.id; }).indexOf(est);

  KPS.forEach(function (k) {
    const acc = pct[k.level];
    const lvlIdx = LEVELS.map(function (l) { return l.id; }).indexOf(k.level);
    const rel = estIdx - lvlIdx;
    const p = Math.max(0.12, Math.min(0.95, 0.30 + 0.60 * acc + 0.08 * rel + (Math.random() - 0.5) * 0.06));
    const n = counts[k.level] || 3;
    const c = Math.round(n * acc);
    state.kps[k.id] = {
      p: p, n: n, correct: c, wrong: n - c,
      state: p >= 0.85 ? "mastered" : "testing",
      dueAt: Date.now() + (0.5 + Math.random() * 2.5) * 86400000,
      lastSeen: Date.now()
    };
  });

  placement.answers.forEach(function (a) {
    state.attempts.push({ itemId: a.itemId, kpId: a.kpId, correct: !!a.correct, at: Date.now() });
  });

  state.placement = { at: Date.now(), level: est, scores: pct, counts: counts };
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
    const p = Math.round(r.pct[l.id] * 100);
    return '<div class="level-row">'
      + '<span class="name">' + esc(l.name) + "</span>"
      + '<span class="mini-bar"><span style="width:' + p + '%"></span></span>'
      + '<span class="pct">' + r.hits[l.id] + " / " + r.counts[l.id] + "</span>"
      + "</div>";
  }).join("");

  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + '<div class="result-head"><div class="tiny" style="letter-spacing:.12em">YOUR ESTIMATED LEVEL</div>'
    + '<h1 style="font-size:52px;margin:4px 0">' + esc(r.level) + "</h1>"
    + '<p class="small">Based on ' + placement.answers.length + " questions. Your Brainmap will keep adjusting from here.</p></div>"
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
    + '<div class="kwiz-prompt">' + esc(item.prompt).replace(/___/g, '<span class="blank">____</span>') + "</div>"
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
    correct: skip ? null : Engine.isCorrect(item, given),
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
  let correct = 0;
  const sections = { structures: { c: 0, t: 0 }, reading: { c: 0, t: 0 } };

  exam.answers.forEach(function (a) {
    const kp = KP_BY_ID[a.kpId];
    const sec = kp.category === "reading" ? "reading" : "structures";
    sections[sec].t += 1;
    if (a.correct) { correct++; sections[sec].c += 1; }
    else Engine.noteWrong(state, a.itemId, a.kpId);
    Engine.updateKp(state, a.kpId, a.correct);
    state.attempts.push({
      itemId: a.itemId, kpId: a.kpId, correct: a.correct, at: Date.now()
    });
  });

  Engine.touchStreak(state);

  const score = Math.round(correct / total * 699);
  const record = {
    at: Date.now(), score: score, band: tcfBand(score),
    correct: correct, total: total, sections: sections, auto: !!auto,
    before: exam.before || {}
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
  const seenKp = {};
  exam.answers.forEach(function (a) { seenKp[a.kpId] = true; });
  const moves = Object.keys(seenKp).map(function (kpid) {
    const s = state.kps[kpid];
    const now = s && s.n ? Engine.display(s.p, s.n) : 0;
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
    const item = kp.items.filter(function (x) { return x.id === a.itemId; })[0];
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
    + '<p class="small">' + r.correct + " / " + r.total + " correct"
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

/* Optional Chinese subtitle for a point title. */
function zhOf(kp) {
  return (typeof ZH !== "undefined" && ZH[kp.id]) ? ZH[kp.id] : "";
}

/* Optional longer explanation, keyed by point id. */
function deepOf(kpId) {
  return (typeof DEEP !== "undefined" && DEEP[kpId]) ? DEEP[kpId] : null;
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
    prelearn = { kpId: kpId, step: 1, g: 0, c: 0, checkCorrect: 0, feedback: null, given: "" };
  }

  const stepHtml = function (n, label) {
    const cls = prelearn.step === n ? "step active" : (prelearn.step > n ? "step done" : "step");
    return '<span class="' + cls + '"><span class="dot">' + (prelearn.step > n ? "✓" : n) + "</span>" + label + "</span>";
  };

  let body = "";

  if (prelearn.step === 1) {
    body = '<div class="rule-box"><b>One rule:</b> ' + frify(kp.rule) + "</div>"
      + usageHtml(kp)
      + '<div class="ex-list">' + exampleList(kp).map(function (e) {
        return '<div class="ex-item"><div class="fr">' + esc(e[0]) + '</div><div class="en">' + esc(e[1]) + "</div></div>";
      }).join("") + "</div>"
      + mistakesHtml(kp)
      + '<div class="pitfall"><b>Watch out:</b> ' + frify(kp.pitfall) + "</div>"
      + tipHtml(kp)
      + '<div style="margin-top:18px"><button class="btn" id="step1Next">I am ready →</button>'
      + '<span class="small" style="margin-left:10px">About 3 minutes</span></div>';
  }

  if (prelearn.step === 2) {
    const item = kp.items[prelearn.g];
    const fb = prelearn.feedback;
    body = '<div class="check-progress">Guided practice · ' + (prelearn.g + 1) + " of 2</div>"
      + passageHtml(item)
      + '<div class="kwiz-prompt">' + esc(item.prompt).replace(/___/g, '<span class="blank">____</span>') + "</div>"
      + (item.type === "choice"
        ? '<div class="options">' + item.options.map(function (o) {
            let cls = "option";
            if (fb) {
              if (Engine.normalize(o) === Engine.normalize(item.answer)) cls += " correct";
              else if (prelearn.given === o) cls += " wrong";
            }
            return '<button class="' + cls + '" data-g-option="' + esc(o) + '"' + (fb ? " disabled" : "") + ">" + esc(o) + "</button>";
          }).join("") + "</div>"
        : '<input class="answer-input" id="gInput" autocomplete="off" value="' + esc(prelearn.given) + '"' + (fb ? " disabled" : "") + ">")
      + (item.hint ? '<p class="small" style="margin-top:10px">Hint: ' + esc(item.hint) + "</p>" : "")
      + (fb ? '<div class="feedback ' + (fb === "ok" ? "ok" : "bad") + '"><div class="mark">' + (fb === "ok" ? "✓" : "×")
          + '</div><div class="body"><b>' + (fb === "ok" ? "Correct." : "Not quite — try again.") + "</b>"
          + (fb === "bad" ? '<div class="answer-line">' + esc(item.answer) + "</div>" : "")
          + esc(item.explain) + "</div></div>" : "")
      + '<div class="kwiz-actions">'
      + (fb === "ok"
        ? '<button class="btn" id="gNext">Continue</button>'
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
          s.state = "learnable";
          s.p = Math.max(s.p, 0.45);
          s.n = Math.max(s.n, 2);
          s.dueAt = Date.now();
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
        + '<div class="kwiz-prompt">' + esc(item.prompt).replace(/___/g, '<span class="blank">____</span>') + "</div>"
        + (item.type === "choice"
          ? '<div class="options">' + item.options.map(function (o) {
              let cls = "option";
              if (fb) {
                if (Engine.normalize(o) === Engine.normalize(item.answer)) cls += " correct";
                else if (prelearn.given === o) cls += " wrong";
              }
              return '<button class="' + cls + '" data-c-option="' + esc(o) + '"' + (fb ? " disabled" : "") + ">" + esc(o) + "</button>";
            }).join("") + "</div>"
          : '<input class="answer-input" id="cInput" autocomplete="off" value="' + esc(prelearn.given) + '"' + (fb ? " disabled" : "") + ">")
        + (fb ? '<div class="feedback ' + (fb === "ok" ? "ok" : "bad") + '"><div class="mark">' + (fb === "ok" ? "✓" : "×")
            + '</div><div class="body"><b>' + (fb === "ok" ? "Correct." : "Not quite.") + "</b>"
            + '<div class="answer-line">' + esc(item.answer) + "</div>" + esc(item.explain) + "</div></div>" : "")
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
          prelearn.feedback = Engine.isCorrect(item, prelearn.given) ? "ok" : "bad";
          renderPrelearn(kp.id);
        });
      });
    } else {
      const input = document.getElementById("gInput");
      if (input && !prelearn.feedback) {
        input.focus();
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); document.getElementById("gCheck").click(); } });
      }
    }
    const gCheck = document.getElementById("gCheck");
    if (gCheck) gCheck.addEventListener("click", function () {
      const input = document.getElementById("gInput");
      prelearn.given = input ? input.value : prelearn.given;
      if (!Engine.normalize(prelearn.given)) { toast("Type an answer"); return; }
      prelearn.feedback = Engine.isCorrect(item, prelearn.given) ? "ok" : "bad";
      renderPrelearn(kp.id);
    });
    const gNext = document.getElementById("gNext");
    if (gNext) gNext.addEventListener("click", function () {
      prelearn.g += 1;
      prelearn.feedback = null;
      prelearn.given = "";
      if (prelearn.g >= 2) { prelearn.step = 3; prelearn.c = 0; prelearn.checkCorrect = 0; }
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
            const ok = Engine.isCorrect(item, prelearn.given);
            if (ok) prelearn.checkCorrect++;
            prelearn.feedback = ok ? "ok" : "bad";
            renderPrelearn(kp.id);
          });
        });
      } else {
        const input = document.getElementById("cInput");
        if (input && !prelearn.feedback) {
          input.focus();
          input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); document.getElementById("cCheck").click(); } });
        }
      }
      const cCheck = document.getElementById("cCheck");
      if (cCheck) cCheck.addEventListener("click", function () {
        const input = document.getElementById("cInput");
        prelearn.given = input ? input.value : prelearn.given;
        if (!Engine.normalize(prelearn.given)) { toast("Type an answer"); return; }
        const ok = Engine.isCorrect(item, prelearn.given);
        if (ok) prelearn.checkCorrect++;
        prelearn.feedback = ok ? "ok" : "bad";
        renderPrelearn(kp.id);
      });
      const cNext = document.getElementById("cNext");
      if (cNext) cNext.addEventListener("click", function () {
        prelearn.c += 1;
        prelearn.feedback = null;
        prelearn.given = "";
        renderPrelearn(kp.id);
      });
    } else {
      const sp = document.getElementById("startPractice");
      if (sp) sp.addEventListener("click", function () { startFocusSession(kp.id); });
      const rg = document.getElementById("retryGuided");
      if (rg) rg.addEventListener("click", function () {
        prelearn.step = 2; prelearn.g = 0; prelearn.feedback = null; prelearn.given = "";
        renderPrelearn(kp.id);
      });
    }
  }
}

/* ---------------- notebook ---------------- */

function renderNotebook() {
  const nb = Engine.notebookItems(state);
  const savedIds = (state.notebook && state.notebook.kps) || [];
  const savedKps = savedIds.map(function (id) { return KP_BY_ID[id]; }).filter(Boolean);

  const rows = nb.map(function (n, i) {
    const kp = KP_BY_ID[n.kpId];
    if (!kp) return "";
    const item = kp.items.filter(function (x) { return x.id === n.itemId; })[0];
    if (!item) return "";
    return "<tr>"
      + "<td>" + (i + 1) + "</td>"
      + '<td class="q">' + esc(item.prompt) + '<div class="exp">' + esc(kp.title) + "</div></td>"
      + '<td class="good">' + esc(item.answer) + "</td>"
      + '<td><span class="miss-chip">×' + n.wrong + "</span></td>"
      + '<td><button class="btn sm ghost" data-nb-practice="' + n.itemId + '">Practise</button></td>'
      + '<td><button class="btn sm subtle" data-nb-remove="' + n.itemId + '">Remove</button></td>'
      + "</tr>";
  }).join("");

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
    + '<p>Wrong answers land here automatically. Review them until they stop being mistakes.</p></div>'
    + '<div class="nb-actions">'
    + (nb.length ? '<button class="btn" id="nbPractiseAll">Practise all ' + nb.length + "</button>" : "")
    + (nb.length ? '<button class="btn subtle" id="nbClear">Clear mistakes</button>' : "")
    + '<span class="spacer"></span>'
    + '<span class="small">' + nb.length + " mistake" + (nb.length === 1 ? "" : "s")
    + " · " + savedKps.length + " saved point" + (savedKps.length === 1 ? "" : "s") + "</span>"
    + "</div>"
    + (nb.length
      ? '<div class="card"><table class="result-table"><thead><tr><th>#</th><th>Question</th><th>Answer</th><th>Missed</th><th></th><th></th></tr></thead><tbody>' + rows + "</tbody></table></div>"
      : '<div class="empty">No mistakes yet. Finish a kwiz and anything you miss shows up here.</div>')
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
      const n = nb.filter(function (x) { return x.itemId === itemId; })[0];
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
    return '<div class="vocab-card" data-vcard="' + esc(v.w) + '">'
      + '<div class="vc-head"><span class="vc-word">' + esc(v.w) + "</span>"
      + '<span class="vc-pos">' + esc(v.pos) + (g ? " · " + g : "") + "</span>"
      + '<span class="vc-rank">' + esc(v.level || "") + " · #" + v.rank + "</span></div>"
      + (ex
        ? '<div class="vc-ex"><div class="fr">' + esc(ex[0]) + '</div>'
          + '<div class="en" hidden>' + esc(ex[1]) + "</div></div>"
        : '<div class="vc-ex"><div class="fr muted">No example sentence yet.</div></div>')
      + '<div class="vc-foot">'
      + (ex ? '<button class="linkbtn" data-vreveal="' + esc(v.w) + '">Show translation</button>' : '<span></span>')
      + '<button class="btn sm subtle" data-vknown="' + esc(v.w) + '">'
      + (st === "known" ? "Known ✓" : "Mark known") + "</button>"
      + "</div></div>";
  }).join("");

  app.innerHTML = '<div class="container">'
    + '<div class="page-head"><h1>Vocabulary</h1>'
    + '<p>' + VOCAB_LIST.length + ' high-frequency French words, ranked by real usage. '
    + "Frequency from Lexique 3.83, examples from Tatoeba.</p></div>"
    + '<div class="nb-actions">'
    + '<button class="btn" id="vocabFlashBtn">Flashcards · ' + counts.new + " new</button>"
    + '<button class="btn ghost" id="vocabClozeBtn">Cloze</button>'
    + '<button class="btn ghost" id="vocabGenderBtn">Gender drill</button>'
    + '<button class="btn subtle" id="vocabKnownBtn">Practise known</button>'
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
  document.querySelectorAll("[data-vreveal]").forEach(function (b) {
    b.addEventListener("click", function () {
      const card = b.closest(".vocab-card");
      const en = card.querySelector(".en");
      en.hidden = !en.hidden;
      b.textContent = en.hidden ? "Show translation" : "Hide translation";
    });
  });
  document.querySelectorAll("[data-vknown]").forEach(function (b) {
    b.addEventListener("click", function () {
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

  const cards = VERB_TENSE_LIST.map(function (tense) {
    const forms = v.t[tense];
    if (!forms) return "";
    return '<div class="tense-card"><div class="tense-name">' + esc(tense) + "</div>"
      + forms.map(function (f, i) {
        return '<div class="tense-row"><span class="pron">' + esc(VERB_PERSON_LIST[i]) + "</span>"
          + '<span class="form">' + esc(verbElide(VERB_PERSON_LIST[i], f)) + "</span></div>";
      }).join("")
      + "</div>";
  }).join("");

  const idx = VERB_LIST.findIndex(function (x) { return x.inf === verbFocus; });
  const prev = VERB_LIST[(idx - 1 + VERB_LIST.length) % VERB_LIST.length].inf;
  const next = VERB_LIST[(idx + 1) % VERB_LIST.length].inf;

  app.innerHTML = '<div class="container">'
    + '<div class="page-head"><h1>Verb conjugations</h1>'
    + '<p>' + VERB_LIST.length + " core verbs × " + VERB_TENSE_LIST.length
    + " tenses. Generated from verbecc.</p></div>"
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
    + (checked
      ? '<div class="feedback ' + (checked === "ok" ? "ok" : "bad") + '"><div class="mark">'
        + (checked === "ok" ? "✓" : "×") + '</div><div class="body">'
        + "<b>" + (checked === "ok" ? "Correct." : "Not quite.") + "</b>"
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
  const ok = Engine.normalize(given) === Engine.normalize(q.answer);
  d.given = given;
  d.checked = ok ? "ok" : "bad";
  if (ok) d.correct += 1; else d.wrong += 1;
  const rec = verbRecord(q.inf + "|" + q.tense + "|" + q.person);
  rec.seen += 1;
  rec.last = Date.now();
  if (ok) rec.correct += 1;
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
const SENTENCE_BANK = (typeof SENTENCES !== "undefined" && Array.isArray(SENTENCES)) ? SENTENCES : [];

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
  SENTENCE_BANK.forEach(function (s) { out[s[2]] = (out[s[2]] || 0) + 1; });
  return out;
}

function sentStat(tag) {
  if (!state.sentences) state.sentences = {};
  if (!state.sentences[tag]) state.sentences[tag] = { seen: 0, correct: 0 };
  return state.sentences[tag];
}

function renderSentences() {
  if (!SENTENCE_BANK.length) {
    app.innerHTML = '<div class="container"><div class="empty">'
      + "<b>Sentence bank is not built yet.</b><br><br>"
      + "Run <code>python tools/build_sentences.py</code> in the project folder.<br><br>"
      + "It mines Tatoeba sentence pairs into thousands of gap-fill and word-order items."
      + "</div></div>";
    return;
  }
  if (sentDrill) { renderSentDrill(); return; }
  if (trDrill) { renderTranslate(); return; }

  const counts = sentTagCounts();
  const chips = SENT_TAGS.filter(function (pair) {
    return pair[0] === "all" || counts[pair[0]];
  }).map(function (pair) {
    const n = pair[0] === "all" ? SENTENCE_BANK.length : counts[pair[0]];
    return '<button class="chip' + (sentTag === pair[0] ? " active" : "") + '" data-stag="' + pair[0] + '">'
      + pair[1] + " " + n + "</button>";
  }).join("");

  const total = SENTENCE_BANK.length;
  const gaps = SENTENCE_BANK.filter(function (s) { return s[5] === "gap"; }).length;

  const levelCounts = {};
  SENTENCE_BANK.forEach(function (s) {
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

  const poolSize = SENTENCE_BANK.filter(function (s) {
    return (sentTag === "all" || s[2] === sentTag) && (sentLevel === "all" || s[6] === sentLevel);
  }).length;

  app.innerHTML = '<div class="container">'
    + '<div class="page-head"><h1>Sentence practice</h1>'
    + '<p>' + total + " real French sentences from Tatoeba · " + gaps
    + " gap-fill, " + (total - gaps) + " word-order. Filter by grammar and level, then drill.</p></div>"
    + '<div class="nb-actions">'
    + '<button class="btn" id="sentStart"' + (poolSize ? "" : " disabled") + '>Practise 10</button>'
    + '<button class="btn subtle" id="sentStart20"' + (poolSize ? "" : " disabled") + ">20</button>"
    + '<button class="btn ghost" id="trStart">Translate</button>'
    + '<span class="spacer"></span>'
    + '<span class="small">' + poolSize + " in this filter</span></div>"
    + '<div class="lib-filters">' + chips + "</div>"
    + '<div class="lib-filters" style="margin-top:-6px">' + levelChips + "</div>"
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
  const pool = SENTENCE_BANK.filter(function (s) {
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
    const status = Engine.statusOf(state, kp);
    const hay = (kp.title + " " + kp.titleFr + " " + kp.rule + " " + (CATEGORIES[kp.category] || "")).toLowerCase();
    return '<div class="lib-card" data-level="' + kp.level + '" data-cat="' + kp.category + '"'
      + ' data-text="' + esc(hay) + '" data-idx="' + idx + '"'
      + ' data-score="' + (st && st.n ? sc : -999) + '"'
      + ' data-last="' + (st && st.lastSeen ? st.lastSeen : 0) + '">'
      + '<div class="lvl">' + esc(kp.level) + " · " + esc(CATEGORIES[kp.category] || kp.category) + "</div>"
      + '<div class="t">' + esc(kp.title) + "</div>"
      + (zhOf(kp) ? '<div class="t-zh">' + esc(zhOf(kp)) + "</div>" : "")
      + '<div class="fr">' + esc(kp.titleFr) + "</div>"
      + '<div class="foot"><span class="score" style="color:' + scoreColor(sc, st ? st.n : 0) + '">'
      + (st && st.n ? sc : "—") + "</span>" + badge(status)
      + '<button class="btn sm ghost" data-kp-open="' + kp.id + '">' + (status === "new" ? "Learn" : "Practice") + "</button></div></div>";
  }).join("");

  app.innerHTML = '<div class="container">'
    + '<div class="page-head"><h1>Library</h1><p>All ' + KPS.length + ' points. Filter by level or grammar area, search a rule, then open one to learn or practise.</p></div>'
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
    + '<div class="page-head"><h1>Settings</h1><p>Everything lives in this browser only.</p></div>'
    + '<div class="card">'
    + '<div class="setting-row"><div class="txt"><b>TCF-style exam</b>'
    + '<span>20 timed questions, score out of 699 with a CEFR estimate.</span></div>'
    + '<button class="btn sm" id="examBtn">Start</button></div>'
    + '<div class="setting-row"><div class="txt"><b>Placement test</b>'
    + '<span>20 questions to estimate your level and seed the Brainmap.</span></div>'
    + '<button class="btn sm" id="placementBtn">Start</button></div>'
    + '<div class="setting-row"><div class="txt"><b>Load demo progress</b>'
    + '<span>Fills the map with realistic scores so you can see the Brainmap in action.</span></div>'
    + '<button class="btn sm" id="seedBtn">Load</button></div>'
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
    + '<p class="small" style="margin-top:16px">Current data: ' + state.attempts.length + " attempts, "
    + state.sessions.length + " sessions, " + KPS.length + " knowledge points.</p>"
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
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
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
        if (!data || data.version !== 1 || !data.kps) throw new Error("bad shape");
        if (!confirm("Replace current progress with this backup?")) return;
        state = data;
        if (!state.attempts) state.attempts = [];
        if (!state.sessions) state.sessions = [];
        if (!state.streak) state.streak = { count: 0, last: null };
        if (!state.goal) state.goal = 20;
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
  document.getElementById("goalSelect").addEventListener("change", function (e) {
    state.goal = parseInt(e.target.value, 10) || 20;
    saveState();
    toast("Daily goal set to " + state.goal);
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

route();
