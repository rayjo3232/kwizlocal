/* UI + routing. Plain JS, no build step, works from file://. */

const LS_STATE = "kwizlocal.state.v1";
const LS_SESSION = "kwizlocal.session.v1";
const LS_PLACEMENT = "kwizlocal.placement.v1";
const LS_EXAM = "kwizlocal.exam.v1";

let stateRescued = false;
let saveFailed = false;
let lastSavedAt = null;
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
    lastSavedAt = new Date();
  } catch (e) {
    /* Silently swallowing this meant answers kept landing in memory and
       vanished on reload. Say it once. */
    if (!saveFailed) {
      saveFailed = true;
      try { toast("Could not save progress — browser storage is full. Export a backup."); } catch (_) {}
    }
  }
  renderSaveStatus();
}

function renderSaveStatus() {
  const el = document.getElementById("saveStatus");
  if (!el) return;
  el.classList.toggle("save-error", saveFailed);
  el.innerHTML = saveFailed
    ? '<span>● 进度未保存，请先导出备份</span><a href="#/settings">备份与恢复 →</a>'
    : '<span>● ' + (lastSavedAt ? "已保存到此浏览器 · " + esc(lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })) : "学习记录保存在此浏览器") + '</span>';
}

function releaseHtml(compact) {
  return '<section class="release-card' + (compact ? ' release-compact' : '') + '" aria-labelledby="releaseTitle">'
    + '<div class="release-heading"><span class="release-tag">WHAT’S NEW · V' + esc(RELEASE.version) + '</span>'
    + '<span class="release-date">' + esc(RELEASE.date) + '</span></div>'
    + '<h2 id="releaseTitle">' + esc(RELEASE.title) + '</h2>'
    + (compact ? '' : '<p>让每一次练习，都知道为什么。</p>')
    + '<details><summary>看看这次更新了什么</summary><ul>'
    + RELEASE.changes.map(function (line) { return '<li>' + esc(line) + '</li>'; }).join("")
    + '</ul></details></section>';
}

function coachingHtml(kpId, withPractice) {
  const note = COACHING[kpId];
  if (!note) return "";
  return '<section class="coach-note"><div class="coach-kicker">理解 → 对比 → 再试一次</div>'
    + '<h3>用中文理清这一点</h3><p>' + esc(note.rule) + '</p>'
    + (withPractice ? '<details class="coach-details"><summary>展开易错提醒与对比例句</summary>' : '')
    + '<p class="coach-trap"><b>易错提醒</b> ' + esc(note.trap) + '</p>'
    + '<div class="coach-examples">' + note.examples.map(function (e) {
      return '<div><span lang="fr">' + esc(e[0]) + '</span><small>' + esc(e[1]) + '</small></div>';
    }).join("") + '</div>' + (withPractice ? '</details>' : '')
    + (withPractice ? '<div class="coach-practice" data-coach="' + esc(kpId) + '"><b>换个语境，再试一次</b>'
      + '<p lang="fr">' + esc(note.prompt) + '</p><div class="coach-options">'
      + note.options.map(function (o) { return '<button type="button" class="btn sm ghost" data-coach-answer="' + esc(o) + '">' + esc(o) + '</button>'; }).join("")
      + '</div><p class="coach-result" role="status" aria-live="polite"></p>'
      + '<small>这是有提示的巩固练习，不计入掌握度。</small></div>' : "") + '</section>';
}

/* Delegation survives course and quiz rerenders. A correction can be retried
   without changing the main question, score, or saved session. */
app.addEventListener("click", function (event) {
  const sourceLevel = event.target.closest('[data-source-level]');
  if (sourceLevel) {
    sourceFilter = { query: '', level: sourceLevel.getAttribute('data-source-level'), category: 'all', read: 'all', page: 0 };
    navigate('#/sources');
    return;
  }
  const foundationButton = event.target.closest('[data-foundation-check]');
  if (foundationButton) {
    startFoundationCheck(foundationButton.getAttribute('data-foundation-check'));
    return;
  }
  if (event.target.closest('[data-notebook-review]')) {
    notebookView = { query: '', level: 'all', status: 'open', sort: 'missed' };
    return;
  }
  const button = event.target.closest("[data-coach-answer]");
  if (!button) return;
  const block = button.closest("[data-coach]");
  const note = COACHING[block.getAttribute("data-coach")];
  const correct = button.getAttribute("data-coach-answer") === note.answer;
  block.querySelector(".coach-result").textContent = (correct ? "✓ 答对了。" : "再想一想。") + note.why;
  if (correct) block.querySelectorAll("button").forEach(function (b) { b.disabled = true; });
});

function foundationLessonHtml(kp) {
  const lesson = FOUNDATIONS[kp.id];
  if (!lesson) return '';
  return '<section class="coach-note foundation-lesson"><span class="coach-kicker">基础精讲 · 学会怎么判断</span>'
    + '<h2>学完这一课，你应该能做到</h2><p class="foundation-goal">' + esc(lesson.goal) + '</p>'
    + '<div class="foundation-steps">' + lesson.steps.map(function (step, index) {
      return '<article><span>0' + (index + 1) + '</span><div><h3>' + esc(step[0]) + '</h3><p>' + esc(step[1]) + '</p></div></article>';
    }).join('') + '</div><h3>跟着例句走一遍</h3><div class="foundation-worked">'
    + lesson.worked.map(function (example) { return '<article><p lang="fr">' + esc(example[0]) + '</p><p>' + esc(example[1]) + '</p><p class="worked-reason"><b>为什么这样写：</b>' + esc(example[2]) + '</p></article>'; }).join('')
    + '</div><div class="foundation-check-entry"><div><b>能选对，也要能写对、改对。</b><p>6 道新编题：辨认规则、独立填空、整句纠错各 2 题。整组完成后统一核对。</p></div>'
    + '<button class="btn sm ghost" data-foundation-check="' + esc(kp.id) + '">学后检测 · 6 题 →</button></div></section>';
}

function startFoundationCheck(kpId) {
  const lesson = FOUNDATIONS[kpId];
  if (!lesson) return;
  const seenBefore = lesson.items.filter(function (item) { return state.attempts.some(function (a) { return a.itemId === item.id; }) || (state.skips || []).some(function (s) { return s.itemId === item.id; }); }).length;
  startSessionFromItems(lesson.items.map(function (item) { return { kpId: kpId, itemId: item.id }; }));
  session.foundationCheck = { kpId: kpId, seenBefore: seenBefore };
  saveSession();
  renderKwiz();
}

function renderFoundations() {
  app.innerHTML = '<div class="container"><div class="page-head"><span class="studio-eyebrow">LEARN THE RULE · PROVE YOU CAN USE IT</span><h1>基础精讲与学后检测</h1>'
    + '<p>10 个基础知识点 · 30 个判断步骤 · 20 组解析例句 · 60 道新编练习</p></div>'
    + '<div class="foundation-intro"><b>先学会怎么判断，再检验能否独立完成。</b><p>每课先看中文精讲和推理过程，再做引导练习；最后用选择、填空、整句纠错三类题检测。检测结束后一次核对答案，不在中途提示对错。</p></div>'
    + '<div class="foundation-catalog">' + Object.keys(FOUNDATIONS).map(function (id, index) {
      const kp = KP_BY_ID[id], lesson = FOUNDATIONS[id];
      return '<article class="foundation-course"><div class="foundation-course-top"><span>' + String(index + 1).padStart(2, '0') + '</span><span>' + esc(kp.level) + ' · 6 题检测</span></div>'
        + '<h2>' + esc(zhOf(kp) || kp.title) + '</h2><p>' + esc(lesson.goal) + '</p>'
        + '<div class="foundation-course-actions"><a class="btn sm" href="#/prelearn/' + esc(id) + '">学习精讲 →</a><button class="btn sm ghost" data-foundation-check="' + esc(id) + '">独立检测</button></div></article>';
    }).join('') + '</div><p class="small section-gap">这是首批重点增强的基础课；<a href="#/library" class="small">全部知识点仍在课程库中</a>。</p></div>';
}

function foundationReportHtml(record) {
  if (!record.foundationCheck) return '';
  const kp = KP_BY_ID[record.foundationCheck.kpId];
  if (!kp) return '';
  return '<section class="foundation-report card section-gap"><span class="studio-eyebrow">LEARN → APPLY → VERIFY</span><h2>这次，你学到哪一步了？</h2>'
    + '<div class="foundation-scores">' + FOUNDATION_SKILLS.map(function (skill, index) {
      const answers = record.answers.filter(function (a) { const item = findItem(kp, a.itemId); return item && item.foundation && item.skill === index; });
      const right = answers.filter(function (a) { return a.correct === true; }).length;
      const skipped = answers.filter(function (a) { return a.correct === null; }).length;
      return '<article><span>' + esc(skill) + '</span><b>' + right + ' / ' + answers.length + '</b><p>'
        + (right === answers.length && answers.length ? '本次已答对；过几天再检验。' : '回看讲解中的判断步骤，再换语境练习。')
        + (skipped ? '其中 ' + skipped + ' 题跳过，尚未验证。' : '') + '</p></article>';
    }).join('') + '</div><p class="small">这是本组首次作答的结果；不插入重试题，也不把即时订正算作掌握。'
    + (record.foundationCheck.seenBefore ? '本组有 ' + record.foundationCheck.seenBefore + ' 道题以前练过，因此不代表陌生题测试。' : '本组题目此前没有答题记录。')
    + '</p><a class="btn sm ghost" href="#/prelearn/' + esc(kp.id) + '">回到本课精讲 →</a></section>';
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
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
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

/* ---------------- the map's layout ----------------

   A mosaic: cells whose area is proportional to how much material they hold,
   packed into rows whose heights are proportional too.

   Greedy squarified packing was tried first and produced a sliver for the
   smallest region — five levels came out as 2 + 2 + one full-width strip 40px
   tall, which reads as a broken layout. Instead every row count is laid out
   and scored by its worst aspect ratio, and the best one wins. Five items land
   on 2 + 3; ten items on 3 + 3 + 4. */

function splitIntoRows(values, rows) {
  const groups = [];
  let i = 0;
  for (let r = 0; r < rows; r++) {
    const left = rows - r;
    let remaining = 0;
    for (let k = i; k < values.length; k++) remaining += values[k];
    const target = remaining / left;
    const g = [];
    let sum = 0;
    /* Always leave one item for each row that still has to be filled. */
    while (i < values.length - (left - 1)) {
      const v = values[i];
      if (g.length && Math.abs(sum + v - target) > Math.abs(sum - target)) break;
      g.push(v); sum += v; i++;
    }
    groups.push(g);
  }
  return groups;
}

function mosaic(items, W, H) {
  if (!items.length || W <= 0 || H <= 0) return [];
  const n = items.length;

  /* Largest first: a big cell at the edge of a row keeps the rest squarer. */
  const order = items.map(function (it, i) { return i; })
    .sort(function (a, b) { return items[b].value - items[a].value; });
  const values = order.map(function (i) { return Math.max(1, items[i].value); });
  const total = values.reduce(function (a, b) { return a + b; }, 0) || 1;

  /* Both axes get a floor, for the same reason. A row holding two of twelve
     points of material got 90px, which is less than a tile's own content, so
     the title was cut in half. The floor is taken from the rows that have
     slack, exactly as the width floor is taken from the wider cells. */
  const MIN_W = 74;
  const MIN_H = 128;

  const lift = function (sizes, floor) {
    let deficit = 0;
    sizes.forEach(function (v) { if (v < floor) deficit += floor - v; });
    if (deficit <= 0) return sizes;
    const donors = [];
    sizes.forEach(function (v, i) { if (v > floor) donors.push(i); });
    const slack = donors.reduce(function (a, i) { return a + (sizes[i] - floor); }, 0);
    if (slack > 0) {
      const take = Math.min(1, deficit / slack);
      donors.forEach(function (i) { sizes[i] -= (sizes[i] - floor) * take; });
      sizes.forEach(function (v, i) { if (sizes[i] < floor) sizes[i] = floor; });
    }
    return sizes;
  };

  let best = null;
  for (let rows = 1; rows <= Math.min(n, 6); rows++) {
    const groups = splitIntoRows(values, rows);
    const sums = groups.map(function (g) {
      return g.reduce(function (a, b) { return a + b; }, 0) || 1;
    });
    const heights = lift(sums.map(function (v) { return (v / total) * H; }), MIN_H);

    let worst = 0;
    let vi = 0;
    let y = 0;
    const rects = new Array(n);

    groups.forEach(function (g, gi) {
      const gSum = sums[gi];
      const rh = heights[gi];

      /* Score the row on its honest proportions: the width floor below makes a
         sliver look acceptable (74px wide, 250 tall scores as a 3.4 aspect
         ratio) and that pushed six areas into one row on a desktop. */
      g.forEach(function (v) {
        const cw = (v / gSum) * W;
        const ratio = Math.max(cw / Math.max(1, rh), rh / Math.max(1, cw));
        if (ratio > worst) worst = ratio;
      });

      const widths = lift(g.map(function (v) { return (v / gSum) * W; }), MIN_W);

      let x = 0;
      g.forEach(function (v, i) {
        rects[order[vi]] = { x: x, y: y, w: widths[i], h: rh };
        x += widths[i]; vi++;
      });
      y += rh;
    });

    if (!best || worst < best.worst - 0.001) best = { worst: worst, rects: rects };
  }

  return best.rects.map(function (r) {
    return {
      x: Math.round(r.x * 10) / 10,
      y: Math.round(r.y * 10) / 10,
      w: Math.round(r.w * 10) / 10,
      h: Math.round(r.h * 10) / 10
    };
  });
}

let mapFocus = null; // null | { level, category }

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


/* ---------- brainmap: the dashboard's preview ---------- */

/* The dashboard's preview strip. One number per level — the same "how much of
   this have I mastered" the full map uses — and a bar that fills with it. It
   used to show a confidence score next to a bar segmented by grammar area,
   which meant the number and the bar were measuring different things. */
function levelCardsHtml(compact) {
  return '<div class="bmap-levels' + (compact ? " compact" : "") + '">'
    + LEVELS.map(function (lv) {
      const list = KPS.filter(function (k) { return k.level === lv.id; });
      if (!list.length) return "";
      const st = regionStat(list);
      const tone = mapTone(st.pct, st.total - st.unseen, st.review);
      return '<button class="bmap-lv" data-level="' + lv.id + '">'
        + '<span class="bmap-lv-top"><b>' + esc(lv.name) + "</b>"
        + "<em>" + (st.unseen === st.total ? "—" : st.pct + "%") + "</em></span>"
        + '<span class="bmap-lv-bar"><i style="width:' + st.pct + "%;background:" + tone.bar + '"></i></span>'
        + '<span class="bmap-lv-meta">' + st.mastered + " of " + st.total + " mastered"
        + (st.unseen ? ' · <b class="new">' + st.unseen + " new</b>" : "")
        + (st.weak ? ' · <b class="weak">' + st.weak + " weak</b>" : "")
        + (st.due ? ' · <b class="due">' + st.due + " due</b>" : "") + "</span>"
        + "</button>";
    }).join("")
    + "</div>";
}

/* ---------------- brainmap: one canvas, three zoom levels ----------------

   Level, then grammar area, then the points inside — the same mosaic at every
   depth, so zooming in feels like zooming rather than like opening a list.
   Area carries the amount of material, colour carries how well it is known. */

/* How much of a region you have actually mastered, as a percentage.

   Every point contributes its display score clamped to 0–100, and a point you
   have never opened contributes 0. That is what "62% of A0" has to mean: a
   level you have answered twelve questions in is not two-thirds known. The
   average is weighted by each point's teaching weight, so a heavy point moves
   the number more than a footnote does. */
function regionStat(list) {
  let wsum = 0, sum = 0;
  /* Four buckets that add up to `total` — the summary bar draws them as
     widths, so they must not overlap. */
  const st = { pct: 0, mastered: 0, learning: 0, weak: 0, neg: 0, due: 0, unseen: 0, total: list.length };
  list.forEach(function (kp) {
    const w = Math.max(1, kp.weight || 1);
    const s = state.kps[kp.id];
    const n = s ? s.n : 0;
    const d = n ? Engine.display(s.p, s.n) : 0;
    const m = n ? Math.max(0, Math.min(100, d)) : 0;
    sum += m * w;
    wsum += w;
    if (!n) st.unseen++;
    else if (m >= 75) st.mastered++;
    else if (d < 50) st.weak++;
    else st.learning++;
    if (n && d < 0) st.neg++;
    if (s && s.dueAt && s.dueAt <= Date.now()) st.due++;
  });
  st.pct = wsum ? Math.round(sum / wsum) : 0;
  /* One shaky point out of thirty-eight is not "this level needs review". Red
     is for a region where a quarter of the attempts are going wrong. */
  const tested = st.total - st.unseen;
  st.review = st.neg >= 2 && st.neg / Math.max(1, tested) >= 0.25;
  return st;
}

/* Background tint and ink for a mastery percentage. Solid colour blocks would
   shout; these are the same hues the legend uses, softened so text stays
   readable. `weak` turns the tile red: an area where you are getting things
   wrong is worth more attention than one you have simply not opened. */
function mapTone(pct, tested, weak) {
  /* The background stays soft so a wall of tiles is not a traffic light, and
     the bar carries the saturation — it is the part that has to be read at a
     glance. The first pass used pastel bars on pastel backgrounds and the
     steps between 70% and 79% were invisible. */
  if (!tested) return { bg: "#EDEFF2", ink: "#5F6873", bar: "#AEB6BF" };
  if (weak) return { bg: "#F8E4E4", ink: "#8A2A2A", bar: "#C2181A" };
  if (pct < 40) return { bg: "#FBF2D4", ink: "#6A5000", bar: "#C08A00" };
  if (pct < 70) return { bg: "#E9F4EB", ink: "#2C5A38", bar: "#4E9A60" };
  if (pct < 90) return { bg: "#DCEEE0", ink: "#23502D", bar: "#2E7D42" };
  return { bg: "#CEE7D3", ink: "#1C4524", bar: "#1B5E27" };
}

/* A tile's percentage is the number people ask for, so every level of the map
   says "%" rather than a bare score. The sign is added once, by tileHtml. */
function pctText(pct, tested) {
  return tested ? pct : null;
}

/* One-word labels for cells too narrow for the full name. A clipped word reads
   as a bug; a shorter one reads as a decision. */
const CAT_TILE_SHORT = {
  articles: "Articles", pronouns: "Pronouns", verbs: "Verbs",
  adjectives: "Adj./adv.", prepositions: "Preps",
  syntax: "Structure", expressions: "Expressions", reading: "Reading"
};

/* How much room a tile has decides how much it says — one flag per line, so a
   narrow cell keeps its number instead of losing it along with the meta. */
function tileHtml(t, cell) {
  /* A hair of gap so two neighbouring tints never read as one block. */
  const gap = 1.5;
  const x = t.x + gap, y = t.y + gap;
  const w = Math.max(10, t.w - gap * 2), h = Math.max(10, t.h - gap * 2);
  const pad = w < 90 || h < 52 ? 8 : 12;
  /* "full" is the size with the display figure, so it also needs the height to
     carry a two-line title above it. A 150×125 cell took the display size on
     width alone and had no room left for the second line. */
  const size = w >= 132 && h >= 148 ? "full" : w >= 100 && h >= 84 ? "mid" : "small";
  const name = w < 104 && cell.short ? cell.short : cell.name;
  const known = cell.score != null;
  const showScore = known ? (w >= 56 && h >= 44) : (w >= 64 && h >= 46);

  /* The percentage is the point of the tile, so it gets the weight: a large
     number with the sign set small, and a bar underneath that draws the same
     number as a length. Without the bar a tile was a name at the top, a number
     at the far right and 120px of nothing in between. */
  const scoreHtml = '<span class="mt-score' + (known ? "" : " is-none") + '">'
    + (known ? cell.score : "—")
    + (known && cell.pct ? '<span class="pc">%</span>' : "") + "</span>";
  const bar = cell.pct
    ? '<span class="mt-bar"><i style="width:' + (known ? cell.score : 0)
      + "%;background:" + cell.tone.bar + '"></i></span>'
    : "";
  /* A row that only just fits its title, figure and bar has no room for a
     detail line; adding one there is what clipped the bottom of the tile. */
  const metaHtml = cell.meta && w >= 104 && h >= 126
    ? '<span class="mt-meta">' + esc(cell.meta) + "</span>" : "";

  /* How many lines the title may have is a function of the cell's height and
     of the title itself, not a constant. Ten points in four rows leave ~95px,
     and a fixed three-line clamp there sliced the title in half; a fixed
     one-line clamp gave "Articles &…". The other blocks have known heights, so
     the title is fitted into what is left. */
  const fsName = size === "full" ? 17 : size === "mid" ? 13 : 11;
  const lineH = Math.round(fsName * 1.2);
  const scoreH = size === "full" ? 33 : size === "mid" ? 20 : 15;
  const barH = size === "full" ? 6 : size === "mid" ? 5 : 4;
  const barGap = size === "full" ? 14 : size === "mid" ? 10 : 6;
  /* The descriptor is the first thing to go: it repeats what the level code
     already says, and it cost every tile a line and a half. */
  const hasSub = !!(cell.sub && size === "full" && h >= 180);
  const subH = hasSub ? 18 : 0;
  const metaH = metaHtml ? 15 : 0;
  const gaps = 3 * (2 + (hasSub ? 1 : 0) + (metaHtml ? 1 : 0));
  const room = h - pad * 2 - scoreH - barH - barGap - subH - metaH - gaps - 8;
  const perLine = Math.max(4, Math.floor((w - pad * 2) / (fsName * 0.55)));
  const wantLines = Math.ceil(name.length / perLine);
  const fitLines = Math.max(1, Math.floor(room / lineH));
  const nameLines = Math.max(1, Math.min(wantLines, fitLines, size === "mid" ? 3 : 2));

  /* One layout at every size: title, figure, bar, detail. Putting the figure
     beside the title cost the title half the width — "Articles & nouns" came
     out as "Articles &…" in a 165px tile — and stacking gives the number a
     full line to be big on. */
  const body = '<span class="mt-name" style="-webkit-line-clamp:' + nameLines + '">' + esc(name) + "</span>"
    + scoreHtml
    + (hasSub ? '<span class="mt-sub">' + esc(cell.sub) + "</span>" : "")
    + bar + metaHtml;

  return '<button class="map-tile d-' + size + (cell.cls ? " " + cell.cls : "") + '"'
    + (cell.attrs || "")
    + ' style="left:' + x + "px;top:" + y + "px;width:" + w + "px;height:" + h + "px;"
    + "background:" + cell.tone.bg + ";color:" + cell.tone.ink + ";padding:" + pad + 'px"'
    + ' aria-label="' + esc(cell.label) + '">'
    + body
    + "</button>";
}

function mapCanvasHtml(cells) {
  const W = cells.W, H = cells.H;
  const rects = mosaic(cells.items.map(function (c) { return { value: c.value }; }), W, H);
  return '<div class="map-canvas" style="width:' + W + "px;height:" + H + 'px">'
    + cells.items.map(function (c, i) {
      const t = rects[i];
      if (!t || t.w < 24 || t.h < 20) return "";
      return tileHtml(t, c);
    }).join("")
    + "</div>";
}

/* The canvas height: roughly square on a phone, a wide band on a desktop, and
   never taller than the number of cells needs. */
function mapHeight(W, n) {
  /* A desktop band of 250px made six areas into one row of slivers. */
  /* 0.8 squeezed a level tile below its own content and clipped the last line.
     The per-row budget is 118px, not 96: a row now holds a title, a figure, a
     bar and a detail line, and 96 was the height of a row that held two. */
  /* 300 is the floor a two-row layout needs for its taller row to hold a
     title, a figure, a bar and a detail line. Past six cells the rows start
     to squeeze, so the canvas grows with the count instead of dividing a fixed
     height into ever-shorter strips — ten points at 75px a row had room for
     one word of title. */
  const base = W < 560
    ? Math.max(300, Math.round(W * 0.9), 128 * Math.ceil(n / 3))
    : 330;
  return Math.max(150, Math.min(base, Math.round(118 * Math.ceil(n / 2))));
}

function levelTiles(W) {
  const items = [];
  LEVELS.forEach(function (lv) {
    const list = KPS.filter(function (k) { return k.level === lv.id; });
    if (!list.length) return;
    const st = regionStat(list);
    const tested = st.total - st.unseen;

    const meta = [];
    if (st.weak) meta.push(st.weak + " weak");
    if (st.due) meta.push(st.due + " due");
    if (st.unseen) meta.push(st.unseen + " new");

    /* The code is the label, the descriptor is the subtitle: "A0" fits in a
       74px cell, "A0 · Entry" does not. */
    const parts = String(lv.name).split("·");
    const desc = (parts[1] || "").trim();
    items.push({
      value: list.length,
      cls: "lvl",
      attrs: ' data-level="' + lv.id + '"',
      name: lv.id,
      score: pctText(st.pct, tested),
      pct: true,
      /* The descriptor, and only the descriptor. "Upper Intermediate · 37 pts"
         ran out of a 165px tile and ended in an ellipsis; the amount of
         material is what the tile's area already shows. */
      sub: desc || null,
      meta: meta.join(" · ") || null,
      tone: mapTone(st.pct, tested, st.review),
      label: lv.name + ", " + st.pct + "% mastered, " + st.mastered + " of " + st.total + " points"
    });
  });
  return { items: items, W: W, H: mapHeight(W, items.length) };
}

function categoryTiles(W, levelId) {
  const list = KPS.filter(function (k) { return k.level === levelId; });
  const cats = groupByCategory(list);
  const items = cats.map(function (c) {
    const st = regionStat(c.kps);
    const tested = st.total - st.unseen;
    return {
      value: c.kps.length,
      cls: "cat",
      attrs: ' data-cat="' + c.cat + '" data-cat-level="' + levelId + '"',
      name: CATEGORIES[c.cat] || c.cat,
      short: CAT_TILE_SHORT[c.cat] || null,
      score: pctText(st.pct, tested),
      pct: true,
      sub: null,
      meta: c.kps.length + " pts"
        + (st.unseen ? " · " + st.unseen + " new" : "")
        + (st.weak ? " · " + st.weak + " weak" : ""),
      tone: mapTone(st.pct, tested, st.review),
      label: (CATEGORIES[c.cat] || c.cat) + ", " + st.pct + "% mastered, "
        + st.mastered + " of " + c.kps.length + " points"
    };
  });
  return { items: items, W: W, H: mapHeight(W, items.length) };
}

function pointTiles(W, levelId, cat) {
  const list = KPS.filter(function (k) { return k.level === levelId && k.category === cat; });
  const items = list.map(function (kp) {
    const s = state.kps[kp.id];
    const n = s ? s.n : 0;
    const d = n ? Engine.display(s.p, s.n) : 0;
    const pct = n ? Math.max(0, Math.min(100, Math.round(d))) : 0;
    const parts = kp.title.split(":");
    const name = parts[0];
    const sub = parts.slice(1).join(":").trim();
    const st = pointStatus(kp);
    return {
      value: Math.max(1, kp.weight || 1),
      cls: "pt",
      attrs: ' data-kp="' + kp.id + '"',
      name: name,
      score: n ? pct : null,
      pct: true,
      sub: sub || null,
      /* Only the two states the number cannot express. "practising" next to
         67% is the same sentence twice, and in a 95px cell it truncates to
         "practisi…". */
      meta: !n ? "new" : st === "due" ? "due" : st === "weak" ? "weak" : null,
      tone: mapTone(pct, n, n && d < 0),
      label: kp.title + (n ? ", " + pct + "% mastered" : ", not started")
    };
  });
  return { items: items, W: W, H: mapHeight(W, items.length) };
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
  /* Capped on read as well as on write: profiles recorded before the cap
     existed still carry sessions measured in days, and one of them reported
     2,908 minutes for a week of 43 questions. */
  const minutes = Math.round(sessions.reduce(function (n, s) {
    const cap = Math.max(1, s.total || s.answered || 1) * 120000;
    return n + Math.min(s.durationMs || 0, cap);
  }, 0) / 60000);

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
  /* Heights in pixels, measured against the track. A percentage height on a
     flex item inside this column resolved to the column's height, not the
     track's, so an empty day came out 74px tall and covered the heading. */
  const TRACK = thin ? 34 : 46;
  const bars = days.map(function (d, i) {
    const today = i === days.length - 1;
    /* Height is volume. Colour used to be accuracy as well, which put red and
       yellow slabs on a card that already states the accuracy — it read as a
       page of errors. One bar per day, one colour, today marked. */
    const h = d.n ? Math.max(5, Math.round(d.n / max * TRACK)) : 3;
    const acc = d.n ? Math.round(d.c / d.n * 100) : 0;
    /* Not "empty": there is a global .empty empty-state card with 36px of
       padding, and the bar inherited it — every day without practice rendered
       74px tall and covered the heading above it. */
    const cls = !d.n ? "zero" : today ? "today" : "on";
    const tip = d.n ? d.n + " questions · " + acc + "% correct" : "no practice";
    return '<div class="act-col" title="' + tip + '">'
      + '<div class="act-track" style="height:' + TRACK + 'px">'
      + '<span class="act-bar ' + cls + '" style="height:' + h + 'px"></span></div>'
      + (thin ? "" : '<span class="act-day' + (today ? " today" : "") + '">' + (today ? "Today" : d.label) + "</span>")
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

/* These stores only contain lifetime aggregates. Do not invent dates, weekly
   totals, or grammar mastery from vocabulary-in-context and reference matching. */
function practiceReport() {
  const count = function (n) { return typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0; };
  const translation = state.translate || {};
  const done = count(translation.done);
  const totalPct = typeof translation.totalPct === "number" && Number.isFinite(translation.totalPct) ? translation.totalPct : 0;
  const tags = Object.keys(state.sentences || {}).map(function (tag) {
    const s = state.sentences[tag] || {};
    const seen = count(s.seen);
    const correct = Math.min(seen, count(s.correct));
    const label = SENT_TAGS.find(function (entry) { return entry[0] === tag; });
    return { tag: tag, label: label ? label[1] : tag, seen: seen, correct: correct, pct: seen ? Math.round(correct / seen * 100) : null };
  }).filter(function (s) { return s.seen > 0; });
  const seen = tags.reduce(function (n, s) { return n + s.seen; }, 0);
  const correct = tags.reduce(function (n, s) { return n + s.correct; }, 0);
  return {
    translationDone: done,
    translationPct: done ? Math.round(Math.max(0, Math.min(100, totalPct / done))) : null,
    sentenceSeen: seen,
    sentencePct: seen ? Math.round(correct / seen * 100) : null,
    tags: tags.sort(function (a, b) { return a.pct - b.pct || b.seen - a.seen || a.tag.localeCompare(b.tag); })
  };
}

function practiceHistoryHtml() {
  const report = practiceReport();
  const metric = function (value, label) {
    return '<div class="practice-metric"><b>' + (value == null ? '—' : value + '%') + '</b><span>' + label + '</span></div>';
  };
  return '<section class="practice-history section-gap" aria-labelledby="practiceHistoryTitle">'
    + '<div class="practice-heading"><div><span class="studio-eyebrow">YOUR PRACTICE FOOTPRINT</span>'
    + '<h2 id="practiceHistoryTitle">把练习，变成看得见的积累。</h2></div><span class="lifetime-label">累计记录</span></div>'
    + '<div class="practice-panels"><article class="practice-panel"><span class="practice-icon" aria-hidden="true">Aa ↗</span>'
    + '<h3>翻译 · 从理解到表达</h3>' + metric(report.translationPct, '平均参考句匹配度')
    + '<p>' + (report.translationDone ? '已练 ' + report.translationDone + ' 句；揭晓答案按 0 分计入平均。' : '还没有翻译记录，试着独立写出第一句法语。') + '</p>'
    + '<a class="btn sm ghost" href="#/translate">写几句法语 →</a></article>'
    + '<article class="practice-panel"><span class="practice-icon" aria-hidden="true">≋</span>'
    + '<h3>句子 · 放进真实语境</h3>' + metric(report.sentencePct, '句子练习正确率')
    + '<p>' + (report.sentenceSeen ? '已答 ' + report.sentenceSeen + ' 题，覆盖 ' + report.tags.length + ' 类语境。' : '还没有句子记录，从填空或词序练习开始。') + '</p>'
    + '<a class="btn sm ghost" href="#/sentences">练习真实句子 →</a></article></div>'
    + (report.tags.length ? '<details class="practice-tags"><summary>看看已练语境 · 优先显示正确率较低的标签</summary>'
      + report.tags.map(function (t) {
        const known = SENT_TAGS.some(function (entry) { return entry[0] === t.tag && entry[0] !== 'all'; });
        return '<div class="practice-tag-row"><span>' + esc(t.label) + '</span><small>' + t.correct + ' / ' + t.seen + ' 答对</small>'
          + '<b>' + t.pct + '%</b>'
          + (known ? '<button type="button" class="btn sm ghost" data-practice-tag="' + esc(t.tag) + '">再练 →</button>' : '') + '</div>';
      }).join('') + '</details>' : '')
    + '<p class="practice-footnote">翻译采用文字匹配参考；句子按答题结果统计。两者均不代表语法掌握度；独立练习不计入上方每日答题目标。</p></section>';
}

function learningRouteHtml(due, weak, nextLesson) {
  const rows = [
    { action: 'due', title: '复习到期内容', count: due, note: due ? due + ' 个已学知识点到期，先唤醒记忆。' : '暂无到期内容，今天可以轻装前进。' },
    { action: 'weak', title: '巩固薄弱内容', count: weak, note: weak ? weak + ' 个已学知识点需要巩固。' : '暂无待巩固的薄弱知识点。' },
    { action: 'new', title: '学习下一课', count: nextLesson ? 1 : 0, note: nextLesson ? (zhOf(nextLesson) || nextLesson.title) + ' · 约 3 分钟' : '当前级别的新课已介绍完，可以复习或调整起点。' }
  ];
  return '<div class="learning-route"><div class="ns-title">今天的学习路线</div>'
    + rows.map(function (row, i) {
      return '<button type="button" class="route-step" data-step="' + row.action + '"' + (row.count ? '' : ' disabled') + '>'
        + '<span class="route-number">0' + (i + 1) + '</span><span class="route-body"><b>' + row.title + '</b><small>' + esc(row.note) + '</small></span>'
        + '<span class="route-count">' + (row.count || '✓') + '</span></button>';
    }).join('') + '<p class="route-note">按已学内容安排复习，再逐步引入新课。</p></div>';
}

function notebookPreviewHtml() {
  const pending = Engine.notebookItems(state).filter(function (n) {
    const kp = KP_BY_ID[n.kpId];
    return !n.resolved && kp && findItem(kp, n.itemId);
  });
  if (!pending.length) return '';
  const repeated = pending.filter(function (n) { return n.wrong >= 2; }).length;
  return '<aside class="notebook-preview"><div><span class="studio-eyebrow">TURN MISTAKES INTO PROGRESS</span>'
    + '<h2>' + pending.length + ' 道错题，等你重新拿下。</h2><p>'
    + (repeated ? repeated + ' 道曾反复出错，优先巩固。' : '答案先折叠，先回忆，再用短练检验。')
    + '</p></div><a class="btn sm ghost" href="#/notebook" data-notebook-review>进入错题修复站 →</a></aside>';
}

function renderDashboard() {
  const streak = state.streak.count;
  const today = Engine.todayCount(state);
  const dailyGoal = state.goal || 10;
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
    /* Same number as the map: share of the level's points mastered. The old
       confidence score was a different scale in the same column, so the table
       and the map disagreed about the same level. */
    const st = regionStat(KPS.filter(function (k) { return k.level === l.id; }));
    const bar = st.pct;
    const isCurrent = l.id === recommended.id;
    return '<div class="level-row' + (isCurrent ? " current" : "") + '">'
      + '<span class="name">' + esc(l.name) + '</span>'
      + '<span class="mini-bar"><span style="width:' + bar + '%"></span></span>'
      + '<span class="pct' + (st.pct < 40 ? " low" : "") + '" title="Share of this level\'s points you have mastered">'
      + (st.unseen === st.total ? "—" : st.pct + "%") + '</span>'
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
  const inProgress = !!(session && session.session);
  const outlook = Engine.practiceOutlook(state);

  const canPractise = outlook.canPractise;
  /* Nothing due and nothing weak? Then another pass over solid material is
     the wrong move — the next lesson is. Without this the primary button kept
     serving the same point for as long as the learner kept pressing it. */
  const primaryBtn = inProgress
    ? '<button class="btn block" id="resumeBtn">继续上次练习<small>已完成 ' + session.answers.length + ' / ' + session.session.items.length + ' 题</small></button>'
    : (outlook.recommend === "learn" && nextLesson)
      ? '<button class="btn block" id="newPointBtn2">开始学习：' + esc(zhOf(nextLesson) || nextLesson.title)
        + '<small>' + esc(nextLesson.level) + ' · 约 3 分钟</small></button>'
      : '<button class="btn block" data-start="3">' + (outlook.recommend === 'review' ? '开始复习 · 3 题' : '巩固新知识 · 3 题') + '<small>约 1 分钟</small></button>';

  app.innerHTML = '<div class="container">'
    + '<div class="page-head studio-head"><div><span class="studio-eyebrow">YOUR DAILY FRENCH</span><h1>今天，让法语再进一步。</h1>'
    + '<p>' + KPS.length + ' points · A0 to B2 · 你的每日法语学习工作台</p></div><a class="btn sm ghost" href="#/library">探索课程 ↗</a></div>'
    + releaseHtml(true)

    + '<div class="todaybar' + (today >= dailyGoal ? " done" : "") + '">'
    + '<div class="goal"><div class="goal-head">'
    + '<span class="label">今日答题</span>'
    + '<span class="goal-num">' + today + ' <small>/ ' + dailyGoal + ' 题</small></span>'
    + (today >= dailyGoal ? '<span class="goal-check">✓ Goal met</span>' : "")
    + '</div><div class="track"><span class="fill" style="width:' + Math.min(100, Math.round(today / dailyGoal * 100)) + '%"></span></div></div>'
    + '<div class="streak-box"><span class="streak-num">' + streak + '</span>'
    + '<span class="streak-lbl">连续学习</span></div>'
    + '</div>'


    + '<section class="card hero">'
    + '<div class="hero-left">'
    + '<div class="hero-top"><div class="avatar lvl">' + esc(Engine.guidedLevel(state)) + '</div><div class="hero-copy">'
    + '<div class="hello">' + (today ? "欢迎回来，继续今天的学习。" : "从这一小步开始。") + "</div>"
    + "<p>" + (inProgress
      ? "上次的练习还在，接着完成就好。"
      : (outlook.recommend === "learn" && nextLesson
        ? (outlook.introduced ? "已学内容暂时无需复习，可以开始下一课。" : "从基础规则开始；学过的知识才会进入日常练习。")
        : canPractise
          ? (due ? '先复习到期内容：短测验会优先安排复习，并穿插已学知识。' : weak ? '先巩固薄弱内容，再继续前进。' : '刚学过的内容，先用几道题巩固一下。')
          : "先学习已解锁的课程，练习会跟随你的学习进度。")) + "</p></div></div>"
    + (function () {
      /* Where this level ends. At three questions a day a level takes months,
         and "still A0" with no distance attached reads as "nothing changes". */
      const p = Engine.levelProgress(state);
      if (!p.next) {
        return '<div class="lvl-progress"><span class="lvl-now">' + esc(p.level) + "</span>"
          + '<span class="lvl-note">' + p.ready + " of " + p.points + " points solid · top level of the course</span></div>";
      }
      return '<div class="lvl-progress"><span class="lvl-now">' + esc(p.level) + "</span>"
        + '<span class="lvl-track" title="' + p.ready + " of " + p.need + " points needed for " + esc(p.next) + '">'
        + '<i style="width:' + Math.min(100, Math.round(p.ready / Math.max(1, p.need) * 100)) + '%"></i></span>'
        + '<span class="lvl-note">' + p.left + " more point" + (p.left === 1 ? "" : "s") + " to " + esc(p.next) + "</span></div>";
    })()
    + primaryBtn
    + '<div class="hero-sub">'
    + (inProgress
      ? '<button class="btn subtle" data-start="3">另开一轮 · 3 题</button>'
      : (outlook.recommend === "learn" && canPractise
        ? '<button class="btn subtle" data-start="3">快速巩固 · 3 题</button>'
        : ""))
    + (canPractise ? '<button class="btn subtle" data-start="10">完整练习 · 10 题</button>' : '')
    + "</div>"
    + '<div class="firstrun placement-entry"><div><b>从适合你的级别开始</b><br>当前学习起点 '+esc(Engine.startingLevel(state))+' · 先做摸底评测，或自行选择 A0–B2。</div>'
    + '<button class="btn sm ghost" data-placement>评测与选择起点 →</button></div>'
    + "</div>"
    + '<div class="hero-side">'
    + learningRouteHtml(due, weak, nextLesson)
    + "</div>"
    + "</section>"

    + notebookPreviewHtml()
    + practiceHistoryHtml()
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
    + '<div class="map-wrap" style="border:none;padding:0">' + levelCardsHtml(true) + "</div>"
    + legendHtml() + "</section>"

    + '<section class="card section-gap"><h2 style="font-size:15px;margin-bottom:4px">Your Studyplan</h2>'
    + '<p class="small">Guided path · ' + esc(Engine.guidedLevel(state))
    + " · review due points, then learn unlocked lessons.</p>"
    + '<div class="plan-list">' + planRows + "</div></section>"
    + "</div>";

  bindMap();
  document.querySelectorAll('[data-practice-tag]').forEach(function (button) {
    button.addEventListener('click', function () {
      sentTag = button.getAttribute('data-practice-tag');
      sentLevel = 'all';
      navigate('#/sentences');
    });
  });
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
  if (pBtn) pBtn.addEventListener("click", function(){navigate("#/level-check");});
  const resumeBtn = document.getElementById("resumeBtn");
  if (resumeBtn) resumeBtn.addEventListener("click", function () { navigate("#/kwiz"); });
}

/* The legend swatches are the tiles' own tints, so the key and the map speak
   the same colour rather than a brighter cousin of it. The bands are the
   percentages on the tiles, not words like "weak" — the map says 34%, the key
   has to say what 34% looks like. */
function legendHtml() {
  const swatch = function (pct, tested, weak) {
    const t = mapTone(pct, tested, weak);
    return '<i style="background:' + t.bg + ";border-color:" + t.bar + '"></i>';
  };
  /* Five chips, one line. Six at full length wrapped onto a second row and
     read as a paragraph under the map. A grey tile says "not started" on its
     own face, so that key is not needed. */
  return '<div class="legend">'
    + "<span>" + swatch(30, 4) + "&lt;40%</span>"
    + "<span>" + swatch(55, 4) + "40–69%</span>"
    + "<span>" + swatch(80, 4) + "70–89%</span>"
    + "<span>" + swatch(95, 4) + "90%+</span>"
    + "<span>" + swatch(30, 4, true) + "needs review</span>"
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
    + "</div>";
}

/* The band above the canvas when you are inside a level or an area.

   A percentage on its own is a score; what people actually want to know when
   they open A0 is "how much of this have I got, and what is left". The bar
   splits the points into mastered / getting there / needs work / not started,
   so the shape answers that before the numbers do. */
function mapSummaryHtml() {
  if (!mapFocus) return "";
  const list = KPS.filter(function (k) {
    return k.level === mapFocus.level && (!mapFocus.category || k.category === mapFocus.category);
  });
  if (!list.length) return "";
  const st = regionStat(list);
  const lv = LEVELS.filter(function (l) { return l.id === mapFocus.level; })[0];
  const title = mapFocus.category
    ? (CATEGORIES[mapFocus.category] || mapFocus.category)
    : (lv ? lv.name : mapFocus.level);
  const sub = mapFocus.category ? mapFocus.level + " · " + list.length + " points" : list.length + " points";

  const seg = function (cls, n) {
    if (!n) return "";
    return '<i class="' + cls + '" style="width:' + (n / st.total * 100) + '%"></i>';
  };
  const parts = [];
  parts.push("<b>" + (st.total - st.unseen) + "</b> of " + st.total + " started");
  if (st.weak) parts.push('<b class="w">' + st.weak + "</b> needs work");
  if (st.unseen) parts.push("<b>" + st.unseen + "</b> not started");
  if (st.due) parts.push('<b class="d">' + st.due + " due</b>");

  return '<div class="map-sum">'
    + '<div class="ms-head">'
    + '<span class="ms-title">' + esc(title) + "<small>" + esc(sub) + "</small></span>"
    + '<span class="ms-pct">' + st.pct + "%<small>mastery</small></span>"
    + "</div>"
    + '<div class="ms-bar">'
    + seg("m-mastered", st.mastered) + seg("m-learning", st.learning)
    + seg("m-weak", st.weak) + seg("m-unseen", st.unseen)
    + "</div>"
    + '<div class="ms-meta">' + parts.join(" · ") + "</div>"
    + '<button class="btn sm subtle ms-go" data-practise-region="1">'
    + "Practise this " + (mapFocus.category ? "area" : "level") + "</button>"
    + "</div>";
}

function renderBrainmap() {
  const shown = mapFocus
    ? KPS.filter(function (k) { return k.level === mapFocus.level && (!mapFocus.category || k.category === mapFocus.category); }).length
    : KPS.length;

  app.innerHTML = '<div class="container">'
    + '<div class="page-head"><h1>Your Brainmap</h1>'
    + '<p>Area is how much material there is. The percentage is how much of it you have mastered.</p></div>'
    + '<div class="map-wrap"><div class="map-toolbar">'
    /* "162 points shown · 162 total" said the same number twice; with no
       filter applied there is only one number to give. */
    + '<span class="small">' + (mapFocus
      ? "<b>" + shown + "</b> of " + KPS.length + " points"
      : "<b>" + KPS.length + "</b> points") + "</span>"
    + '<span class="spacer"></span>'
    + '<span class="small">' + Engine.dueCount(state) + ' due · ' + Engine.weakCount(state) + ' weak</span>'
    + "</div>"
    + crumbsHtml() + mapSummaryHtml()
    + '<div id="mapHost" class="map-host"></div>' + legendHtml() + "</div>"
    + '<div class="section-gap" style="text-align:center">'
    + '<button class="btn" data-start="1">Start a 10-question kwiz</button></div>'
    + "</div>";

  paintMap();
  bindMapNav();
  document.querySelectorAll("[data-start]").forEach(function (b) {
    b.addEventListener("click", function () { startSession(); });
  });
}

/* The canvas is laid out in pixels, so it needs a measured width. Measuring
   after the markup is in place keeps it correct at every viewport; jsdom
   reports 0, so there is a sensible fallback for tests. */
let mapObserver = null;
let mapPaintedAt = 0;

function paintMap() {
  const host = document.getElementById("mapHost");
  if (!host) return;
  /* Capped so a wide desktop does not stretch five cells into ribbons. */
  const W = Math.max(260, Math.min(820, Math.round(host.clientWidth || 340)));
  mapPaintedAt = W;
  const cells = !mapFocus ? levelTiles(W)
    : mapFocus.category ? pointTiles(W, mapFocus.level, mapFocus.category)
      : categoryTiles(W, mapFocus.level);
  host.innerHTML = mapCanvasHtml(cells);
  bindMapTiles();
  bindMap();

  /* The canvas is laid out in pixels, so it has to be repainted when the box
     changes — including the 10px the page loses when the content grows tall
     enough to need a scrollbar, which fires no resize event. */
  /* The first paint happens before the page is tall enough to need a
     scrollbar; when it appears the viewport narrows by 10px and the canvas is
     already too wide. One frame later the box is final. */
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(function () {
      const el = document.getElementById("mapHost");
      if (el && el.firstChild && Math.abs(Math.round(el.clientWidth || 0) - mapPaintedAt) >= 2) paintMap();
    });
  }
  if (typeof ResizeObserver !== "undefined") {
    if (!mapObserver) {
      mapObserver = new ResizeObserver(function () {
        const el = document.getElementById("mapHost");
        if (!el || !el.firstChild) return;
        const w = Math.round(el.clientWidth || 340);
        if (Math.abs(w - mapPaintedAt) >= 2) paintMap();
      });
    }
    mapObserver.disconnect();
    mapObserver.observe(host);
  }
}

/* Zooming. Kept apart from the crumb binding because the canvas is repainted
   on resize and only these listeners belong to it. */
function bindMapTiles() {
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
}

function bindMapNav() {
  /* The percentage is a diagnosis; this is the prescription. Drilling exactly
     the region you just looked at saves going back to the dashboard. */
  document.querySelectorAll("[data-practise-region]").forEach(function (b) {
    b.addEventListener("click", function () {
      const list = KPS.filter(function (k) {
        return k.level === mapFocus.level && (!mapFocus.category || k.category === mapFocus.category);
      });
      if (list.length) startSessionFromKps(list, Math.min(10, list.length));
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
  /* The level cards on the dashboard look like buttons and were not wired to
     anything: tapping A0 did nothing. They now open the map already zoomed
     into that level, which is what the card is a preview of. */
  document.querySelectorAll(".bmap-lv[data-level]").forEach(function (b) {
    b.addEventListener("click", function () {
      mapFocus = { level: b.getAttribute("data-level"), category: null };
      navigate("#/brainmap");
    });
  });
  document.querySelectorAll(".map-tile[data-kp]").forEach(function (cell) {
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
  /* Word order is a production task: rebuilding a whole sentence is the
     slowest thing this app can ask for, so it never lands in a quick three,
     only once the point is properly established, and never twice in a row. */
  const fullLength = items.length >= 6;
  let orderUsed = false;
  return items.map(function (ref) {
    const st = state.kps[ref.kpId];
    if (!st || st.n < 3 || swaps >= 2 || usedKp[ref.kpId]) return ref;
    const taken = {};
    items.forEach(function (x) { taken[x.itemId] = true; });
    const free = function (list) { return list.filter(function (x) { return !taken[x]; })[0]; };
    const wantOrder = fullLength && !orderUsed && st.n >= 6;
    let id = wantOrder ? free(sentIdsFor(ref.kpId, st.n + swaps, true)) : null;
    if (id) orderUsed = true;
    else id = free(sentIdsFor(ref.kpId, st.n + swaps, false));
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
   sentence once you have seen the hand-written questions for that point.

   Both item types qualify now. Gap-fill is a recognition task and word-order
   is a production task, so they are not interchangeable: order items only
   appear in a full-length session, only for a point you have already answered
   six times, and at most one per session. A quick three-question kwiz stays
   quick. */
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
    const type = s[5];
    if (type !== "gap" && type !== "order") return;
    if (type === "gap" && (!s[3] || !s[4] || !s[4].length)) return;
    if (type === "order" && !s[0]) return;
    if (!s[2]) return;
    const slot = SENT_TAG_INDEX[s[2]] = SENT_TAG_INDEX[s[2]] || { gap: [], order: [] };
    slot[type].push(i);
  });
  return SENT_TAG_INDEX;
}

/* Which type a bank row is. The id alone does not say. */
function sentTypeOf(itemId) {
  const s = sentenceBank()[parseInt(String(itemId).slice(5), 10)];
  return s ? s[5] : null;
}

/* Turn a bank row into an item the kwiz can render.

   A gap row becomes a choice question. An order row becomes a production
   question: the English sentence is the cue, the French words arrive shuffled,
   and the answer is the sentence in its natural order. */
function sentItem(itemId) {
  const i = parseInt(String(itemId).slice(5), 10);
  const s = sentenceBank()[i];
  if (!s) return null;
  const base = {
    id: itemId,
    difficulty: SENT_LEVEL_DIFF[s[6]] || 2,
    stage: "kwiz",
    fromSentence: true
  };
  if (s[5] === "order") {
    return Object.assign(base, {
      type: "order",
      /* The cue is the meaning, not the words: you are rebuilding the French,
         not copying it. */
      prompt: s[1],
      tokens: sentWords(s[0]),
      answer: s[0],
      explain: ""
    });
  }
  return Object.assign(base, {
    type: "choice",
    prompt: blankWord(s[0], s[3]) || s[0],
    options: s[4],
    answer: s[3],
    explain: s[1]
  });
}

/* Candidate sentence ids for a point, rotated by how often it has been seen.
   `wantOrder` asks for production items only; the caller decides whether the
   point is ready for one. */
function sentIdsFor(kpId, offset, wantOrder) {
  const tags = SENT_KP_TAGS[kpId];
  if (!tags || !sentenceBank().length) return [];
  const idx = sentTagIndex();
  const ids = [];
  tags.forEach(function (t) {
    const slot = idx[t];
    if (!slot) return;
    (slot[wantOrder ? "order" : "gap"] || []).forEach(function (i) { ids.push("sent." + i); });
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
    const cap = Engine.guidedLevel(state);
    const levelRank = { A0: 0, A1: 1, A2: 2, B1: 3, B2: 4 };
    /* The word deck starts at A1 — there are no A0 words — so an A0 learner
       gets one level of allowance rather than none at all. Everything below
       still has to have been met in Vocab first. */
    const allowance = cap === "A0" ? 1 : 0;
    if (levelRank[v.level || "B2"] > levelRank[cap] + allowance) return false;
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
  const level = Engine.guidedLevel(state);
  /* At A0 only vocabulary joins, and only one question per session: a word you
     have already met is a fair question, a conjugated form you have not is not.
     Conjugation unlocks with A1, along with the tenses that make it meaningful. */
  const slots = level === "A0" ? 1 : (n <= 3 ? 1 : Math.max(1, Math.round(n * 0.3)));
  const wantVocab = level === "A0" ? slots : Math.ceil(slots / 2);
  const picks = topicVocabRefs(wantVocab)
    .concat(level === "A0" ? [] : topicVerbRefs(slots - wantVocab));
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

/* One header for every practice screen: the count, a segment per question, and
   what the session is about. */
function kwizTopHtml(index, total, label) {
  const segs = [];
  for (let i = 0; i < total; i++) {
    segs.push("<i" + (i < index ? ' class="done"' : i === index ? ' class="now"' : "") + "></i>");
  }
  return '<div class="kwiz-top">'
    + '<span class="kt-count">' + (index + 1) + " / " + total + "</span>"
    + '<span class="kt-segs">' + segs.join("") + "</span>"
    + '<span class="kt-tag">' + label + "</span></div>";
}

/* Word-order builder, the same interaction as the Sentences page: tap a word
   to place it, tap it in the line to send it back. The pool is keyed to the
   item id, so re-rendering (or resuming a saved session) keeps the same
   shuffle instead of reshuffling under the learner's finger. */
function orderBuilderHtml(item, answered) {
  /* Keyed by position as well as id: a retry re-queues the same item, and the
     second attempt has to start from an empty line, not the finished one. */
  const key = item.id + "@" + session.index;
  if (session.poolFor !== key) {
    session.pool = shuffleWords(item.tokens || []);
    session.chosen = [];
    session.poolFor = key;
  }
  if (!session.chosen) session.chosen = [];
  const placed = {};
  session.chosen.forEach(function (i) { placed[i] = true; });
  const skipped = !!(session.last && session.last.skip);
  const right = answered && !skipped && session.last && session.last.correct;
  const line = session.chosen.length
    ? session.chosen.map(function (i) {
      return '<button class="word-chip chosen" data-rw="' + i + '"' + (answered ? " disabled" : "") + ">"
        + esc(session.pool[i]) + "</button>";
    }).join("")
    : '<span class="order-hint">Tap the words in order</span>';
  const pool = session.pool.map(function (w, i) {
    return '<button class="word-chip' + (placed[i] ? " used" : "") + '" data-ww="' + i + '"'
      + (placed[i] || answered ? " disabled" : "") + ">" + esc(w) + "</button>";
  }).join("");
  /* A skip is not a wrong answer, so it does not paint the line red. */
  return '<div class="order-target' + (answered && !skipped ? (right ? " ok" : " bad") : "") + '">' + line + "</div>"
    + '<div class="order-pool">' + pool + "</div>";
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
      if (answered && !session.foundationCheck) {
        if (Engine.normalize(o) === Engine.normalize(item.answer)) cls += " correct";
        else if (session.selected === o) cls += " wrong";
      }
      return '<button class="' + cls + '" data-option="' + esc(o) + '"'
        + ' aria-pressed="' + (session.selected === o ? "true" : "false") + '"'
        + (answered ? " disabled" : "") + ">"
        + '<span class="opt-key">' + (oi + 1) + "</span>"
        + '<span class="opt-label">' + esc(o) + "</span>"
        + '<span class="opt-confirm">tap again</span></button>';
    }).join("") + "</div>";
  } else if (item.type === "order") {
    inputHtml = orderBuilderHtml(item, answered);
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
    if (session.foundationCheck) {
      feedback = '<div class="feedback assessment-recorded" role="status"><div class="mark">•</div><div class="body"><b>' + (l.skip ? '已跳过，标记为尚未验证。' : '已记录你的答案。') + '</b><p>完成全部 6 题后统一核对；先独立完成下一题。</p></div></div>';
    } else if (l.skip) {
      /* Skipping the same point over and over means the question is not the
         problem — the lesson is. Say so instead of serving it a fourth time. */
      const skipped = kp && kp.id ? Engine.skipCount(state, kp.id) : 0;
      feedback = '<div class="feedback skip" role="status" aria-live="polite"><div class="mark">–</div><div class="body">'
        + "<b>Skipped — no penalty.</b>"
        + '<div class="answer-line">' + esc(item.answer) + "</div>"
        + esc(item.explain)
        + (kp && kp.id && !item.topic
          ? '<div style="margin-top:6px"><a href="#/prelearn/' + kp.id + '" class="small" style="color:var(--blue);font-weight:600">'
            + (skipped >= 3 ? "Skipped " + skipped + " times — learn this point →" : "Learn this point →") + "</a></div>"
          : "")
        + "</div></div>";
    } else if (l.correct) {
      feedback = '<div class="feedback ok" role="status" aria-live="polite"><div class="mark">✓</div><div class="body">'
        + "<b>Correct.</b>" + accentNoteHtml(l.accent) + moveHtml + ctxNote + esc(item.explain) + "</div></div>";
    } else {
      feedback = '<div class="feedback bad" role="status" aria-live="polite"><div class="mark">×</div><div class="body">'
        + "<b>Not quite.</b>" + moveHtml + ctxNote
        + '<div class="answer-line">' + esc(item.answer) + "</div>"
        + (item.distract && item.distract[l.given] ? '<div class="why-wrong">' + esc(item.distract[l.given]) + '</div>' : item.type === "choice" && !item.fromSentence && !item.topic ? whyWrongHtml(kp.id, l.given) : "")
        + esc(item.explain)
        /* The per-question explanation is a five-word restatement — enough when
           you were right, useless when you were wrong. A miss gets the rule
           itself, in the place where it is needed. */
        + (item.topic ? "" : '<div class="rule-nudge"><b>The rule</b>' + frify(kp.rule) + "</div>")
        + (!item.topic && !item.fromSentence ? coachingHtml(kp.id, true) : "")
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
    + kwizTopHtml(session.index, total, headLabel)
    + (session.foundationCheck ? '<div class="assessment-banner">学后检测 · ' + esc(FOUNDATION_SKILLS[item.skill]) + ' · 独立作答，最后统一核对</div>' : '')
    + '<div class="kwiz-card">'
    + '<div class="kwiz-kicker">' + (ref.retry ? '<span class="retry-badge">Retry</span> ' : "") + esc(typeLabel(item)) + "</div>"
    + passageHtml(item)
    + '<div class="kwiz-prompt">' + esc(item.prompt).replace(/_{3,}/g, '<span class="blank">____</span>') + "</div>"
    + wordSupportHtml(kp,item)
    + inputHtml + hint + feedback
    + (answered && !session.foundationCheck ? '<p class="small manual-step-note">可以慢慢查看讲解；点击 Continue 后才会继续。</p>' : "")
    + '<div class="kwiz-actions">'
    + (answered
      ? '<button class="btn" id="continueBtn">' + (session.index + 1 >= total ? "Continue · See results" : "Continue") + "</button>"
      : item.type === "choice"
        /* No Check button: a choice answers itself on the second tap. */
        ? '<button class="btn subtle" id="skipBtn">Skip</button>'
          + '<span class="spacer"></span><span class="kbd-hint"><kbd>1</kbd>–<kbd>4</kbd> pick · tap again to confirm · <kbd>Esc</kbd> skip</span>'
        : '<button class="btn" id="checkBtn"' + (item.type === "order"
          && (!session.chosen || session.chosen.length < (session.pool || []).length) ? " disabled" : "") + '>Check</button>'
          + '<button class="btn subtle" id="skipBtn">Skip</button>'
          + '<span class="spacer"></span><span class="kbd-hint">'
          + (item.type === "order" ? "tap every word · <kbd>Esc</kbd> skip" : "<kbd>Enter</kbd> check · <kbd>Esc</kbd> skip")
          + "</span>")
    + "</div></div></div></div>";

  if (!answered) {
    if (item.type === "choice") {
      /* Two taps: the first selects, the second confirms and submits. A stray
         tap therefore costs nothing, there is no Check button to hunt for, and
         a double-click is the same two taps. */
      const buttons = Array.prototype.slice.call(document.querySelectorAll("[data-option]"));
      buttons.forEach(function (b) {
        b.addEventListener("click", function () {
          const value = b.getAttribute("data-option");
          const wasSelected = session.selected === value;
          session.selected = value;
          saveSession();
          buttons.forEach(function (x) {
            const on = x === b;
            x.classList.toggle("selected", on);
            x.setAttribute("aria-pressed", on ? "true" : "false");
          });
          if (wasSelected) checkAnswer();
        });
      });
    } else if (item.type === "order") {
      document.querySelectorAll("[data-ww]").forEach(function (b) {
        b.addEventListener("click", function () {
          const i = parseInt(b.getAttribute("data-ww"), 10);
          if (session.chosen.indexOf(i) < 0) session.chosen.push(i);
          saveSession();
          renderKwiz();
        });
      });
      document.querySelectorAll("[data-rw]").forEach(function (b) {
        b.addEventListener("click", function () {
          const i = parseInt(b.getAttribute("data-rw"), 10);
          session.chosen = session.chosen.filter(function (x) { return x !== i; });
          saveSession();
          renderKwiz();
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
    const checkBtn = document.getElementById("checkBtn");
    if (checkBtn) checkBtn.addEventListener("click", checkAnswer);
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
  /* Word order is the whole question here, so there is no partial credit: the
     fuzzy matcher would accept the same words in the wrong order. */
  if (item.type === "order") {
    const ok = Engine.normalize(given) === Engine.normalize(item.answer);
    return { status: ok ? "exact" : "incorrect", accepted: ok, expected: item.answer, input: given, notes: [], semantic: false };
  }
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
  } else if (item.type === "order") {
    const pool = session.pool || [];
    if (!session.chosen || session.chosen.length !== pool.length) { toast("Use every word"); return; }
    given = session.chosen.map(function (i) { return pool[i]; }).join(" ");
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
    source: session.foundationCheck ? 'foundation-check' : item.topic || (item.fromSentence ? "sentence" : "kwiz"),
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
  if (!correct && !session.foundationCheck) maybeQueueRetry(ref);
  saveSession();
  renderKwiz();

  /* Feedback remains until an explicit Continue action. */

}

function skipAnswer() {
  const ref = session.session.items[session.index];
  const pair = getItem(ref);
  /* A skip is not a wrong answer: nothing is written to mastery, the Notebook
     or the attempts log. It only records that the question went unanswered —
     and that this exact question has now been seen, so the next session does
     not serve it again. */
  session.answers.push({ itemId: pair.item.id, kpId: ref.kpId, correct: null, given: "", applied: true });
  if (ref.kpId) { Engine.noteSkip(state, ref.kpId, pair.item.id); saveState(); }
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
    if (session.foundationCheck) record.foundationCheck = session.foundationCheck;
    record.before = session.before || {};
    /* Freeze the scores this session produced. Later practice must never
       rewrite an old report's "What changed". */
    record.after = snapshotScores(session.session.items);
    /* Time on task, not wall-clock. A session left open over lunch used to
       report the whole gap: one real profile showed 2,908 minutes for 43
       questions because the tab stayed open for two days. Two minutes per
       question is the ceiling — a quick kwiz question takes ten seconds. */
    const wall = Math.max(0, Date.now() - (session.startedAt || Date.now()));
    const ceiling = Math.max(1, session.answers.length) * 120000;
    record.durationMs = Math.min(wall, ceiling);
    state.plan = null;
    saveState();

    /* Celebrate the moment the daily goal is crossed, not every session after. */
    const goal = state.goal || 10;
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
      + (a.correct === false && item.distract && item.distract[a.given] ? '<div class="why-wrong">' + esc(item.distract[a.given]) + '</div>' : '')
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
    + foundationReportHtml(record)
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

function renderPlacementIntro() {
  const current=Engine.startingLevel(state);
  const resumable=placement&&placement.phase==='question'&&placement.items&&placement.index<placement.items.length;
  app.innerHTML='<div class="container level-check-intro"><a class="small" href="#/">← 返回首页</a><div class="page-head"><span class="studio-eyebrow">FIND YOUR STARTING POINT</span><h1>先测水平，再开始学习。</h1><p>当前学习起点：<b>'+esc(current)+'</b>。已有基础的人可以从更合适的级别开始。</p></div>'
    +'<section class="card placement-guide"><h2>20 题摸底 · A0–B2</h2><p>每级 4 题，覆盖不同知识点。选择题再次点击确认，填空题提交后继续；不会提前显示对错，完成后统一推荐起点。不会的可以跳过，途中离开也能继续。</p><p>这是课程起点诊断，不是正式语言等级认证。选择较高级别不会把低级知识点标成已掌握；以后仍可返回补基础。</p><div class="batch-actions"><button class="btn" id="beginPlacement">'+(resumable?'重新开始 20 题评测':'开始 20 题评测')+'</button>'+(resumable?'<a class="btn ghost" href="#/placement">继续未完成的评测 →</a>':'')+(placement&&placement.phase==='result'?'<a class="btn ghost" href="#/placement">查看上次结果</a>':'')+'</div></section>'
    +'<section class="card placement-guide"><h2>也可以自行选择起点</h2><p>如果你已经知道自己的程度，可以直接选择。之前的作答、错题和知识点记录都会保留。</p><label for="entryLevelSelect">学习起点</label><select id="entryLevelSelect" class="goal-select">'+LEVELS.map(function(l){return '<option value="'+l.id+'"'+(l.id===current?' selected':'')+'>'+esc(l.name)+'</option>';}).join('')+'</select><button class="btn ghost" id="applyEntryLevel">采用这个起点 →</button></section></div>';
  document.getElementById('beginPlacement').onclick=startPlacement;
  document.getElementById('applyEntryLevel').onclick=function(){state.learningLevel=document.getElementById('entryLevelSelect').value;state.plan=null;saveState();navigate('#/');};
}

function startPlacement() {
  const items = LearningSupport.selectPlacement(KPS, LEVELS);
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
      const on = placement.selected === o;
      return '<button class="option' + (on ? " selected" : "") + '" data-p-option="' + esc(o) + '"'
        + ' aria-pressed="' + (on ? "true" : "false") + '">'
        + '<span class="opt-label">' + esc(o) + "</span>"
        + '<span class="opt-confirm">tap again</span></button>';
    }).join("") + "</div>";
  } else {
    inputHtml = '<input class="answer-input" id="pInput" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer">'+accentBarHtml('pInput');
  }

  app.innerHTML = '<div class="container"><div class="kwiz-wrap">'
    + kwizTopHtml(placement.index, total, "Placement · " + esc(kp.level))
    + '<div class="kwiz-card">'
    + '<div class="kwiz-kicker">Find your level · ' + esc(typeLabel(item)) + "</div>"
    + passageHtml(item)
    + '<div class="kwiz-prompt">' + esc(item.prompt).replace(/_{3,}/g, '<span class="blank">____</span>') + "</div>"
    + wordSupportHtml(kp,item)
    + inputHtml
    + '<div class="kwiz-actions">'
    + (item.type === "choice"
      ? '<button class="btn subtle" id="pSkip">Skip</button>'
        + '<span class="spacer"></span><span class="kbd-hint">tap again to confirm · no feedback until the end</span>'
      : '<button class="btn" id="pNext">Next</button>'
        + '<button class="btn subtle" id="pSkip">Skip</button>'
        + '<span class="spacer"></span><span class="kbd-hint">No feedback until the end</span>')
    + "</div></div></div></div>";

  if (item.type === "choice") {
    const buttons = Array.prototype.slice.call(document.querySelectorAll("[data-p-option]"));
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        const value = b.getAttribute("data-p-option");
        const wasSelected = placement.selected === value;
        placement.selected = value;
        buttons.forEach(function (x) {
          const on = x === b;
          x.classList.toggle("selected", on);
          x.setAttribute("aria-pressed", on ? "true" : "false");
        });
        if (wasSelected) placementNext(false);
      });
    });
  } else {
    const input = document.getElementById("pInput");
    input.focus();
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); placementNext(false); }
    });
  }
  wireAccentBars();
  const pNext = document.getElementById("pNext");
  if (pNext) pNext.addEventListener("click", function () { placementNext(false); });
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
  if (placement.phase === "result") {renderPlacementResult();return;}
  const diagnostic = LearningSupport.summarize(placement.answers,KP_BY_ID,LEVELS);
  const counts=diagnostic.counts,hits=diagnostic.hits,pct=diagnostic.pct,est=diagnostic.level;

  /* Only the questions actually answered become evidence. A 20-question test
     cannot speak for every point in the course, so everything else stays
     genuinely untested instead of being filled with invented attempts. */
  placement.answers.forEach(function (a) {
    Engine.applyAttempt(state, {
      kpId: a.kpId, itemId: a.itemId, correct: a.correct, source: "placement"
    });
  });

  if(diagnostic.sufficient) state.placement = {
    at: Date.now(), level: est, scores: pct, counts: counts, hits: hits,
    answered: placement.answers.filter(function (a) { return a.correct !== null; }).length
  };
  state.plan = null;
  saveState();

  placement.result = { level: est, pct: pct, counts: counts, hits: hits, sufficient:diagnostic.sufficient };
  placement.phase = "result";
  savePlacement();
  renderPlacement();
}

function renderPlacementResult() {
  const r = placement.result;
  const sufficient=r.sufficient!==undefined?r.sufficient:(r.counts.A0||0)>=3;
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
    + '<div class="result-head"><div class="tiny" style="letter-spacing:.12em">建议学习起点</div>'
    + '<h1 style="font-size:52px;margin:4px 0">' + esc(sufficient?r.level:"证据不足") + "</h1>"
    + '<p class="small">已作答 '+answered+' 题，跳过 '+skipped+' 题。每级 4 题，至少答对 3 题且较低级别连续达到标准，才提高建议起点。'
    + (sufficient?'结果只反映这次抽样，不是正式 CEFR 认证；未测试的知识点不会标成已掌握。':'A0 有效作答不足 3 题，暂不更改原学习起点。')+'</p></div>'
    + '<div class="card">' + rows + "</div>"
    + '<div style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap">'
    + (sufficient?'<button class="btn" id="applyPlacement">从 '+esc(r.level)+' 开始学习 →</button>':'<a class="btn" href="#/">保留原起点</a>')
    + '<a class="btn ghost" href="#/level-check">自行调整起点</a>'
    + '<button class="btn subtle" id="retakePlacement">Retake</button>'
    + "</div></div></div>";

  const apply=document.getElementById('applyPlacement');
  if(apply)apply.onclick=function(){state.learningLevel=r.level;state.plan=null;saveState();navigate('#/');};
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
  const kp = pair.kp, item = pair.item;

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
    + kwizTopHtml(exam.index, total, '<span class="exam-timer" id="examTimer">' + fmtTime(left) + "</span>")
    + '<div class="kwiz-card">'
    + '<div class="kwiz-kicker">TCF-style · ' + esc(typeLabel(item)) + "</div>"
    + passageHtml(item)
    + '<div class="kwiz-prompt">' + esc(item.prompt).replace(/_{3,}/g, '<span class="blank">____</span>') + "</div>"
    + wordSupportHtml(kp,item)
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
    if (it.foundation) return; // independent check answers are not lesson examples
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
    prelearn = { kpId: kpId, step: 1, g: 0, c: 0, checkCorrect: 0, feedback: null, given: "", revealed: false, match: null, selected: null };
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
      + (FOUNDATIONS[kp.id] ? foundationLessonHtml(kp) : coachingHtml(kp.id, false))
      + '<div class="source-lesson-entry"><span>需要更多讲解与例句？</span><button class="btn sm ghost" data-source-level="' + esc(kp.level) + '">阅读 ' + esc(kp.level) + ' 原版精讲 →</button></div>'
      + '<div class="batch-lesson-link"><b>学完这一点，换一组题核对。</b><a class="btn sm ghost" href="#/practice-point/'+esc(kp.id)+'">打开本课专项与例句 →</a></div>'
      + exHtml(firstEx)
      + (rows.length
        ? '<div class="mistakes-block"><div class="mb-title">The usual mix-up</div>' + rowHtml(rows[0]) + "</div>"
        : "")
      + '<div style="margin-top:18px"><button class="btn block" id="step1Next">开始引导练习 →</button>'
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
      + wordSupportHtml(kp,item)
      + (item.type === "choice"
        ? '<div class="options">' + item.options.map(function (o) {
            let cls = "option";
            if (!fb && prelearn.selected === o) cls += " selected";
            if (fb) {
              /* After a miss we only mark the choice you made, so "Try again"
                 is a real retry rather than a second look at the answer. */
              if (prelearn.given === o && fb !== "ok") cls += " wrong";
              else if ((fb === "ok" || reveal) && Engine.normalize(o) === Engine.normalize(item.answer)) cls += " correct";
            }
            return '<button class="' + cls + '" data-g-option="' + esc(o) + '"'
              + ' aria-pressed="' + (prelearn.selected === o ? "true" : "false") + '"'
              + (fb ? " disabled" : "") + ">"
              + '<span class="opt-label">' + esc(o) + "</span>"
              + '<span class="opt-confirm">tap again</span></button>';
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
          + (fb === "bad" ? coachingHtml(kp.id, true) : "")
          + "</div></div>" : "")
      + '<div class="kwiz-actions">'
      + (fb === "ok" || reveal
        ? '<button class="btn" id="gNext">Continue</button>'
        : fb === "bad"
          ? '<button class="btn" id="gRetry">Try again</button>'
            + '<button class="btn subtle" id="gShow">Show answer</button>'
          : item.type === "choice"
            ? '<span class="kbd-hint">tap your choice again to answer</span>'
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
          : '<button class="btn" id="retryGuided">Review again</button>')
        + (passed && FOUNDATIONS[kp.id] ? '<div class="foundation-check-entry"><p>引导练习完成。现在试试不提示对错的 6 题检测，看看能否独立运用。</p><button class="btn sm ghost" data-foundation-check="' + esc(kp.id) + '">学后检测 · 6 题 →</button></div>' : '');
    } else {
      const item = items[prelearn.c];
      const fb = prelearn.feedback;
      body = '<div class="check-progress">Check · ' + (prelearn.c + 1) + " of " + items.length
        + " · " + prelearn.checkCorrect + " correct so far</div>"
        + passageHtml(item)
        + '<div class="kwiz-prompt">' + esc(item.prompt).replace(/_{3,}/g, '<span class="blank">____</span>') + "</div>"
      + wordSupportHtml(kp,item)
        + (item.type === "choice"
          ? '<div class="options">' + item.options.map(function (o) {
              let cls = "option";
              if (!fb && prelearn.selected === o) cls += " selected";
              if (fb) {
                if (Engine.normalize(o) === Engine.normalize(item.answer)) cls += " correct";
                else if (prelearn.given === o) cls += " wrong";
              }
              return '<button class="' + cls + '" data-c-option="' + esc(o) + '"'
                + ' aria-pressed="' + (prelearn.selected === o ? "true" : "false") + '"'
                + (fb ? " disabled" : "") + ">"
                + '<span class="opt-label">' + esc(o) + "</span>"
                + '<span class="opt-confirm">tap again</span></button>';
            }).join("") + "</div>"
          : '<input class="answer-input" id="cInput" autocomplete="off" value="' + esc(prelearn.given) + '"' + (fb ? " disabled" : "") + ">"
            + (fb ? "" : accentBarHtml("cInput")))
        + (fb ? '<div class="feedback ' + (fb === "ok" ? "ok" : "bad") + '"><div class="mark">' + (fb === "ok" ? "✓" : "×")
            + '</div><div class="body"><b>' + (fb === "ok" ? "Correct." : "Not quite.") + "</b>"
            + (fb === "ok" ? accentNoteHtml(prelearn.match) : "")
            + '<div class="answer-line">' + esc(item.answer) + "</div>"
            + (fb === "bad" && item.type === "choice" ? whyWrongHtml(kp.id, prelearn.given) : "")
            + esc(item.explain) + (fb === "bad" ? coachingHtml(kp.id, true) : "") + "</div></div>" : "")
        + '<div class="kwiz-actions">'
        + (fb
          ? '<button class="btn" id="cNext">Continue</button>'
          : item.type === "choice"
            ? '<span class="kbd-hint">tap your choice again to answer</span>'
            : '<button class="btn" id="cCheck">Check</button>')
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
      const buttons = Array.prototype.slice.call(document.querySelectorAll("[data-g-option]"));
      buttons.forEach(function (b) {
        b.addEventListener("click", function () {
          const value = b.getAttribute("data-g-option");
          const wasSelected = prelearn.selected === value;
          prelearn.selected = value;
          if (!wasSelected) {
            buttons.forEach(function (x) {
              const on = x === b;
              x.classList.toggle("selected", on);
              x.setAttribute("aria-pressed", on ? "true" : "false");
            });
            return;
          }
          prelearn.given = value;
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
      prelearn.selected = null;
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
      prelearn.selected = null;
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
        const buttons = Array.prototype.slice.call(document.querySelectorAll("[data-c-option]"));
        buttons.forEach(function (b) {
          b.addEventListener("click", function () {
            const value = b.getAttribute("data-c-option");
            const wasSelected = prelearn.selected === value;
            prelearn.selected = value;
            if (!wasSelected) {
              buttons.forEach(function (x) {
                const on = x === b;
                x.classList.toggle("selected", on);
                x.setAttribute("aria-pressed", on ? "true" : "false");
              });
              return;
            }
            prelearn.given = value;
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
        prelearn.selected = null;
        renderPrelearn(kp.id);
      });
    } else {
      const sp = document.getElementById("startPractice");
      if (sp) sp.addEventListener("click", function () { startFocusSession(kp.id); });
      const rg = document.getElementById("retryGuided");
      if (rg) rg.addEventListener("click", function () {
        prelearn.step = 2; prelearn.g = 0; prelearn.feedback = null; prelearn.given = ""; prelearn.revealed = false; prelearn.selected = null;
        renderPrelearn(kp.id);
      });
    }
  }
}

/* ---------------- notebook ---------------- */

let notebookView = { query: '', level: 'all', status: 'open', sort: 'missed' };

function notebookMatches(note) {
  const kp = KP_BY_ID[note.kpId];
  const item = kp && findItem(kp, note.itemId);
  if (!item) return false;
  if (notebookView.status === 'open' && note.resolved) return false;
  if (notebookView.status === 'resolved' && !note.resolved) return false;
  if (notebookView.level !== 'all' && kp.level !== notebookView.level) return false;
  const fold = function (text) { return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); };
  const text = [kp.title, kp.titleFr, zhOf(kp), item.prompt].join(' ');
  return fold(text).includes(fold(notebookView.query).trim());
}

function renderNotebook() {
  const everyNote = Engine.notebookItems(state).filter(function (n) { const kp = KP_BY_ID[n.kpId]; return kp && findItem(kp, n.itemId); });
  /* Resolved entries keep their history but leave the review queue. */
  const nb = everyNote.filter(function (n) { return !n.resolved; });
  const done = everyNote.filter(function (n) { return n.resolved; });
  const filtered = everyNote.filter(notebookMatches).sort(function (a, b) {
    return notebookView.sort === 'recent'
      ? (b.lastAt || b.at || 0) - (a.lastAt || a.at || 0)
      : (b.wrong || 0) - (a.wrong || 0) || (b.lastAt || b.at || 0) - (a.lastAt || a.at || 0);
  });
  const review = filtered.filter(function (n) { return !n.resolved; }).slice(0, 5);
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
      + '<div class="nb-meta">' + esc(kp.level) + ' · ' + esc(zhOf(kp) || kp.title) + ' · 答错 <b class="nb-miss">' + esc(n.wrong) + " 次</b>"
      + (n.resolved ? ' · <span class="nb-ok">已巩固</span>' : "") + "</div>"
      + '<details class="nb-answer"><summary>先想一想，再看答案</summary><div class="nb-ans"><span>参考答案</span><b lang="fr">' + esc(item.answer) + '</b></div>'
      + (item.explain ? '<p>' + esc(item.explain) + '</p>' : '') + '</details>'
      + "</div>"
      + '<div class="nb-acts">'
      + '<button class="btn sm" data-nb-practice="' + esc(n.itemId) + '">再练此题</button>'
      + '<a class="btn sm ghost" href="#/prelearn/' + esc(kp.id) + '">重读讲解</a>'
      + '<button class="btn sm subtle" data-nb-remove="' + esc(n.itemId) + '">移出错题本</button>'
      + "</div></div>";
  };

  const rows = filtered.map(rowHtml).join("");

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
          + '<button class="btn sm ghost" data-nb-open="' + kp.id + '">查看</button></div></div>';
      }).join("") + "</div>"
    : '<div class="empty" style="margin-top:10px">还没有收藏。打开知识点，选择“Save to Notebook”即可收藏。</div>';

  app.innerHTML = '<div class="container">'
    + '<div class="page-head"><span class="studio-eyebrow">YOUR MISTAKE WORKSHOP</span><h1>错题修复站</h1>'
    + '<p>先回忆，再核对。一个知识点在两道不同题目上答对后，相关错题自动归入已巩固。</p></div>'
    + '<section class="notebook-overview" aria-label="错题概览">'
    + '<div><b>' + nb.length + '</b><span>待复习</span></div><div><b>' + done.length + '</b><span>已巩固</span></div>'
    + '<div><b>' + nb.filter(function (n) { return n.wrong >= 2; }).length + '</b><span>反复出错</span></div></section>'
    + '<div class="notebook-filters"><label>搜索错题<input id="nbSearch" type="search" placeholder="搜索知识点、中文标题或题干" value="' + esc(notebookView.query) + '"></label>'
    + '<label>级别<select id="nbLevel"><option value="all">全部级别</option>' + LEVELS.map(function (l) { return '<option value="' + l.id + '"' + (notebookView.level === l.id ? ' selected' : '') + '>' + l.id + '</option>'; }).join('') + '</select></label>'
    + '<label>状态<select id="nbStatus">' + [['open','待复习'],['resolved','已巩固'],['all','全部错题']].map(function (o) { return '<option value="' + o[0] + '"' + (notebookView.status === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>'
    + '<label>排序<select id="nbSort"><option value="missed">答错次数优先</option><option value="recent"' + (notebookView.sort === 'recent' ? ' selected' : '') + '>最近出错优先</option></select></label></div>'
    + '<div class="nb-actions notebook-review-bar">'
    + '<button class="btn" id="nbPractiseAll"' + (review.length ? '' : ' disabled') + '>复习这 ' + review.length + ' 题 →</button>'
    + '<span class="small" role="status">筛选出 ' + filtered.length + ' 题 · 每轮最多 5 道待复习题</span></div>'
    + (rows
      ? '<div class="card"><div class="nb-list">' + rows + "</div></div>"
      : '<div class="empty">' + (everyNote.length ? '当前筛选下没有错题，试试其他关键词或状态。' : '还没有错题。完成测验后，答错的语法题会自动收集到这里。') + '</div>')
    + (everyNote.length ? '<details class="notebook-manage"><summary>管理全部错题</summary><button class="btn sm subtle" id="nbClear">清空全部错题</button></details>' : '')
    + '<h2 style="font-size:16px;margin:22px 0 2px">收藏的知识点 · ' + savedKps.length + '</h2>'
    + '<p class="small">先存起来，按自己的节奏回看。</p>'
    + savedHtml
    + "</div>";

  const all = document.getElementById("nbPractiseAll");
  if (all) all.addEventListener("click", function () {
    if (!review.length) return;
    startSessionFromItems(review.map(function (n) { return { kpId: n.kpId, itemId: n.itemId }; }));
  });
  const updateSearch = function (event) {
    if (event.isComposing) return;
    const cursor = event.target.selectionStart;
    notebookView.query = event.target.value;
    renderNotebook();
    const input = document.getElementById('nbSearch');
    input.focus();
    input.setSelectionRange(cursor, cursor);
  };
  document.getElementById('nbSearch').addEventListener('input', updateSearch);
  document.getElementById('nbSearch').addEventListener('compositionend', updateSearch);
  [['nbLevel','level'], ['nbStatus','status'], ['nbSort','sort']].forEach(function (pair) {
    document.getElementById(pair[0]).addEventListener('change', function (event) {
      notebookView[pair[1]] = event.target.value;
      renderNotebook();
      document.getElementById(pair[0]).focus();
    });
  });
  const clear = document.getElementById("nbClear");
  if (clear) clear.addEventListener("click", function () {
    if (!confirm("清空全部错题记录（包括已巩固）？收藏的知识点会保留。")) return;
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
      + (v.note ? '<p class="vocab-note">' + esc(v.note) + '</p>' : "")
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
    + themeEntryHtml()
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
    + kwizTopHtml(f.index, f.queue.length, "Vocabulary")
    + '<div class="kwiz-card flash-card">'
    + '<div class="flash-word">' + esc(v.w) + "</div>"
    + '<div class="flash-meta">' + esc(v.pos) + (g ? " · " + g : "")
    + (v.level ? " · " + esc(v.level) : "") + " · rank #" + v.rank + "</div>"
    + (f.revealed && v.note ? '<p class="vocab-note">' + esc(v.note) + '</p>' : "")
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
    return v.pos === "noun" && v.genderDrill !== false && (v.g === "m" || v.g === "f");
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
    + kwizTopHtml(g.index, g.queue.length, "Gender · " + g.correct + " ✓ / " + g.wrong + " ✗")
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
    + batchEntryHtml()
    + referenceEntryHtml()
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
    + kwizTopHtml(d.index, d.queue.length, "Conjugation · " + d.correct + " ✓ / " + d.wrong + " ✗")
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
    + kwizTopHtml(c.index, c.queue.length, "Cloze · " + c.correct + " ✓ / " + c.wrong + " ✗")
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
  /* Explicit navigation opens the overview. Suspended drills remain available
     through a resume button, rather than hijacking a newly selected filter. */

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
    + (sentDrill ? '<div class="sentence-resume"><span>上次句子练习已答 ' + (sentDrill.correct + sentDrill.wrong) + ' / ' + sentDrill.queue.length + ' 题</span><button class="btn sm ghost" id="sentResume">继续上次练习 →</button></div>' : '')
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
  document.getElementById("trStart").addEventListener("click", function () { navigate('#/translate'); });
  const resumeSent = document.getElementById('sentResume');
  if (resumeSent) resumeSent.addEventListener('click', renderSentDrill);
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
    + kwizTopHtml(d.index, d.queue.length, esc(tagLabel) + (lvl ? " · " + esc(lvl) : "") + " · " + d.correct + " ✓ / " + d.wrong + " ✗")
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
    + kwizTopHtml(d.index, d.queue.length, "Translate · " + esc(lvl) + " · avg " + (d.done ? Math.round(d.score / d.done) : 0) + "%")
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
    + batchEntryHtml()
    + referenceEntryHtml()
    + themeEntryHtml()
    + '<div class="source-library-entry"><div><span class="studio-eyebrow">KWIZIQ · A0–C1</span><h2>原版语法讲解，带到你的学习工具里。</h2><p>按级别和语法分类查找精讲，保留原版例句、注意事项和相关课程，支持离线阅读。</p></div><a class="btn sm" href="#/sources">打开原版语法库 →</a></div>'
    + '<div class="foundation-library-entry"><div><b>基础内容，讲透再练。</b><p>首批 10 课中文精讲与 60 道新题，按步骤学习，再独立检测。</p></div><a class="btn sm" href="#/foundations">进入基础精讲 →</a></div>'
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
    + '<span class="lib-view" role="group" aria-label="View">'
    + '<button type="button" data-libview="grid" aria-label="Card view" title="Card view"'
    + (state.libView === "list" ? "" : ' class="on"') + '>'
    + '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 0h5v5H9z"/></svg></button>'
    + '<button type="button" data-libview="list" aria-label="List view" title="List view"'
    + (state.libView === "list" ? ' class="on"' : "") + '>'
    + '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12v2H2zm0 4h12v2H2zm0 4h12v2H2z"/></svg></button>'
    + "</span>"
    + '<span class="lib-count" id="libCount"></span></div>'
    + '<div class="lib-grid' + (state.libView === "list" ? " list" : "") + '" id="libGrid">' + cards + "</div>"
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
  /* Switching view is a class on the grid, so the filters and the search text
     survive it. */
  document.querySelectorAll("[data-libview]").forEach(function (b) {
    b.addEventListener("click", function () {
      state.libView = b.getAttribute("data-libview");
      saveState();
      document.getElementById("libGrid").classList.toggle("list", state.libView === "list");
      document.querySelectorAll("[data-libview]").forEach(function (x) {
        x.classList.toggle("on", x.getAttribute("data-libview") === state.libView);
      });
    });
  });
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
  let storedSize = "unavailable";
  try { storedSize = Math.round((localStorage.getItem(LS_STATE) || "").length / 1024) + " KB"; } catch (_) {}
  app.innerHTML = '<div class="container" style="max-width:760px">'
    + '<div class="page-head"><h1>Settings</h1><p>Stored in this browser only.</p></div>'
    + releaseHtml()
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
    + '<span>' + (function () {
      const p = Engine.levelProgress(state);
      const where = p.next ? "A level advances once " + p.need + " of its " + p.points + " points are confidently practised."
        : "This is the last level in the course.";
      return esc(where) + (p.next ? " " + p.left + " to go for " + esc(p.next) + "." : "");
    })() + "</span></div>"
    + '<b>' + esc(Engine.guidedLevel(state)) + '</b></div>'
    + '<div class="setting-row"><div class="txt"><b>Daily goal</b>'
    + '<span>Questions per day shown on the dashboard.</span></div>'
    + '<select id="goalSelect" class="goal-select">'
    + [10, 20, 30, 50].map(function (g) {
      return '<option value="' + g + '"' + ((state.goal || 10) === g ? " selected" : "") + ">" + g + " / day</option>";
    }).join("")
    + "</select></div>"
    + '<div class="setting-row"><div class="txt"><b>答题后手动继续</b>'
    + '<span>答对或答错都会保留讲解，点击 Continue 后才进入下一题。</span></div><span class="badge">手动</span></div>'
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
    + " · " + storedSize
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
    navigate("#/level-check");
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
    state.goal = parseInt(e.target.value, 10) || 10;
    /* Marked so a future change of default never overrides this choice. */
    state.goalSet = true;
    saveState();
    toast("Daily goal set to " + state.goal);
  });
  document.getElementById("accentBtn").addEventListener("click", function () {
    state.accentLenient = state.accentLenient === false;
    saveState();
    document.getElementById("accentBtn").textContent = state.accentLenient !== false ? "On" : "Off";
    toast(state.accentLenient !== false ? "Lenient accents on" : "Strict accents on");
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
  const navKey = ['foundations','sources','source','themes','theme','theme-practice','glossary','term','practice-bank','practice-point','practice-round'].includes(nav) ? 'library' : ['verb-reference','verb-table'].includes(nav) ? 'verbs' : (nav === "result" || nav === "kwiz" || nav === "prelearn") ? "dashboard" : nav;
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
    case "practice-bank": return renderBatchCatalog();
    case "practice-point": return renderBatchPoint(parts[1]);
    case "practice-round": return renderBatchRound(parts[1]);
    case "foundations": return renderFoundations();
    case "sources": return renderSourceCatalog();
    case "source": return renderSourceLesson(parts[1]);
    case "glossary": return renderReferenceCatalog("glossary");
    case "term": return renderReferenceItem("glossary",parts[1]);
    case "verb-reference": return renderReferenceCatalog("verbs");
    case "verb-table": return renderReferenceItem("verbs",parts[1]);
    case "themes": return renderThemeCatalog();
    case "theme": return renderThemeLesson(parts[1]);
    case "theme-practice": return renderThemePractice(parts[1]);
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
    case "level-check": return renderPlacementIntro();
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
        const value = item.options[n - 1];
        const wasSelected = session.selected === value;
        session.selected = value;
        saveSession();
        document.querySelectorAll("[data-option]").forEach(function (x, i) {
          const on = i === n - 1;
          x.classList.toggle("selected", on);
          x.setAttribute("aria-pressed", on ? "true" : "false");
        });
        /* The number keys follow the same rule as tapping: pick, then commit. */
        if (wasSelected) checkAnswer();
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
  } else if (e.key === "Enter" && session.phase === "feedback" && e.target.id === "continueBtn") {
    e.preventDefault();
    if (!e.repeat) continueSession();
  }
});

document.getElementById("drawerClose").addEventListener("click", closeDrawer);
scrim.addEventListener("click", closeDrawer);

/* The map is laid out in pixels, so a new viewport means a new layout. Only the
   canvas is repainted; the page around it does not move. */
let mapResizeTimer = null;
window.addEventListener("resize", function () {
  if (location.hash.indexOf("#/brainmap") !== 0) return;
  clearTimeout(mapResizeTimer);
  mapResizeTimer = setTimeout(function () {
    if (location.hash.indexOf("#/brainmap") === 0) paintMap();
  }, 140);
});

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
