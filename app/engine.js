/* Mastery engine: BKT update, display score, scheduling, session builder.
   Pure functions over a plain state object; no DOM access. */

const Engine = (function () {

  const P_INIT = 0.30;   // prior for an unseen knowledge point
  const P_LEARN = 0.18;  // learning transition after each attempt
  const P_SLIP = 0.07;   // knows it but answers wrong
  const P_GUESS = 0.15;  // does not know it but answers right

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

  function todayStr(d) {
    const x = d || new Date();
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  }

  function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return todayStr(d);
  }

  function newState() {
    return {
      version: 1,
      createdAt: Date.now(),
      kps: {},
      attempts: [],
      sessions: [],
      streak: { count: 0, last: null },
      goal: 20,
      learningLevel: null, // null = use placement estimate or start at A0
      plan: null,
      autoAdvance: true,
      /* Notebook: mistakes collected automatically + points saved by hand. */
      notebook: { items: [], kps: [] },
      /* Per-form conjugation drill history: "parler|présent|2" -> { seen, correct }. */
      verbs: {},
      /* Sentence-bank accuracy per grammar tag. */
      sentences: {},
      /* Free-writing (translation) totals: done count and summed match %. */
      translate: { done: 0, totalPct: 0 },
      seeded: false
    };
  }

  function ensure(state, kpId) {
    if (!state.kps[kpId]) {
      state.kps[kpId] = {
        p: P_INIT,
        n: 0,
        correct: 0,
        wrong: 0,
        state: "unseen",
        dueAt: null,
        lastSeen: null
      };
    }
    return state.kps[kpId];
  }

  function display(p, n) {
    if (!n) return 0;
    const raw = (p - 0.5) * 200;
    const shrink = n / (n + 4);
    const evidence = Math.min(1, 0.4 + n * 0.2);
    return Math.round(clamp(raw * (0.45 + 0.55 * shrink) * evidence, -100, 100));
  }

  function scoreOf(state, kpId) {
    const s = state.kps[kpId];
    return s ? display(s.p, s.n) : 0;
  }

  function colorFor(score, n) {
    if (!n) return "#DDE0E4";
    if (score < -10) return "#D51C1B";
    if (score < 50) return "#F2D24B";
    if (score < 75) return "#8FCB9B";
    if (score < 90) return "#5FB56F";
    return "#2E7D32";
  }

  function statusOf(state, kp) {
    const s = state.kps[kp.id];
    if (s && s.state === "primed" && !s.n) return "weak";
    if (!s || !s.n) return "new";
    if (s.dueAt && s.dueAt <= Date.now()) return "due";
    if (display(s.p, s.n) < 50) return "weak";
    return "ok";
  }

  function updateKp(state, kpId, correct) {
    const s = ensure(state, kpId);
    let p = s.p;
    const slip = P_SLIP;
    const guess = P_GUESS;

    if (correct) {
      p = (p * (1 - slip)) / (p * (1 - slip) + (1 - p) * guess);
    } else {
      p = (p * slip) / (p * slip + (1 - p) * (1 - guess));
    }
    p = p + (1 - p) * P_LEARN * (correct ? 1 : 0.4);
    s.p = clamp(p, 0.02, 0.995);
    s.n += 1;
    if (correct) s.correct += 1; else s.wrong += 1;
    s.lastSeen = Date.now();

    const strength = Math.max(0, (s.p - 0.45) / 0.55);
    const days = 0.25 + 12 * strength * strength;
    s.dueAt = Date.now() + days * 86400000;

    if (s.state === "unseen" || s.state === "primed" || s.state === "learnable") {
      s.state = "testing";
    }
    if (s.p >= 0.85 && s.n >= 4) s.state = "mastered";
    return s;
  }

  function levelScore(state, level) {
    const list = KPS.filter(function (k) { return k.level === level; });
    let sumW = 0, sum = 0;
    list.forEach(function (k) {
      const s = state.kps[k.id];
      sumW += k.weight;
      sum += k.weight * (s ? display(s.p, s.n) : 0);
    });
    return sumW ? sum / sumW : 0;
  }

  function levelStats(state, level) {
    const list = KPS.filter(function (k) { return k.level === level; });
    let done = 0;
    list.forEach(function (k) {
      const s = state.kps[k.id];
      if (s && s.n > 0 && display(s.p, s.n) >= 50) done++;
    });
    return { total: list.length, done: done, pct: list.length ? Math.round(done / list.length * 100) : 0 };
  }

  /* Guided curriculum is separate from Free Explore / level-specific quizzes.
     Placement is an estimate, not proof of mastery for individual points. */
  const LEVEL_ORDER = ["A0", "A1", "A2", "B1", "B2"];
  function levelIndex(level) { return Math.max(0, LEVEL_ORDER.indexOf(level)); }

  function startingLevel(state) {
    const level = state.learningLevel || (state.placement && state.placement.level);
    return LEVEL_ORDER.indexOf(level) >= 0 ? level : "A0";
  }

  function guidedLevel(state) {
    let i = levelIndex(startingLevel(state));
    // Unlock the next level after substantial *demonstrated* coverage.
    while (i < LEVEL_ORDER.length - 1) {
      const points = KPS.filter(function (k) { return k.level === LEVEL_ORDER[i]; });
      const ready = points.filter(function (k) {
        const s = state.kps[k.id];
        return s && s.n >= 2 && display(s.p, s.n) >= 50;
      }).length;
      if (!points.length || ready / points.length < 0.75) break;
      i++;
    }
    return LEVEL_ORDER[i];
  }

  function prereqReady(state, kp) {
    return (kp.prereqs || []).every(function (id) {
      const pre = KP_BY_ID[id];
      // Starting from a placement / manually selected level treats lower-level
      // prerequisites as assumed, NOT as recorded mastery.
      if (pre && levelIndex(pre.level) < levelIndex(startingLevel(state))) return true;
      const s = state.kps[id];
      return !!(s && s.n >= 2 && display(s.p, s.n) >= 30);
    });
  }

  function hasStarted(state, kp) {
    const s = state.kps[kp.id];
    if (!s) return false;
    if (s.state === "primed" || s.state === "learnable" || s.state === "mastered") return true;
    if (!s.n) return false;
    // Placement and mock exams sample unfamiliar concepts to diagnose level;
    // they must NOT silently unlock those concepts for daily guided quizzes.
    // Previous installs lack an `introduced` flag, so inspect the durable
    // attempt sources to preserve their genuine guided-practice history.
    return (state.attempts || []).some(function (a) {
      return a.kpId === kp.id && a.correct !== null && a.correct !== undefined &&
        a.source !== "placement" && a.source !== "exam" && !a.noMastery;
    });
  }

  function guidedEligible(state, kp) {
    // Explicit free exploration / placement may touch B2, but must not
    // contaminate a learner's A0/A1 daily guided plan.
    if (levelIndex(kp.level) > levelIndex(guidedLevel(state))) return false;
    // A studied lower-level point can still be reviewed for remediation.
    return hasStarted(state, kp) || prereqReady(state, kp);
  }

  function newCandidates(state) {
    const cap = levelIndex(guidedLevel(state));
    return KPS.filter(function (kp) {
      return levelIndex(kp.level) >= levelIndex(startingLevel(state)) &&
        levelIndex(kp.level) <= cap && !hasStarted(state, kp) && prereqReady(state, kp);
    }).sort(function (a, b) {
      const l = levelIndex(a.level) - levelIndex(b.level);
      if (l) return l;
      // The content order is authored as a curriculum. Do not let a very
      // low reading difficulty send a new learner straight into a passage.
      if ((a.category === "reading") !== (b.category === "reading")) {
        return a.category === "reading" ? 1 : -1;
      }
      return KPS.indexOf(a) - KPS.indexOf(b);
    });
  }

  function nextNewPoint(state) { return newCandidates(state)[0] || null; }

  function priority(state, kp) {
    if (!guidedEligible(state, kp)) return -1;
    const s = state.kps[kp.id];
    if (!hasStarted(state, kp)) return 0.40;
    if (s && s.dueAt && s.dueAt <= Date.now()) {
      return 1.0 + Math.min(0.20, (Date.now() - s.dueAt) / 86400000 * 0.02);
    }
    const score = s ? display(s.p, s.n) : 0;
    if (!s || !s.n) return 0.85; // just completed pre-learn
    if (score < 50) return 0.80;
    if (score < 70) return 0.55;
    return 0.20;
  }

  /* Keep the plan deterministic. The first unstudied point is always an
     actionable lesson, not a randomly scored advanced topic. */
  function planList(state, n) {
    const limit = n || 10;
    const active = KPS.filter(function (k) { return hasStarted(state, k) && guidedEligible(state, k); })
      .sort(function (a, b) {
        const d = priority(state, b) - priority(state, a);
        return d || levelIndex(a.level) - levelIndex(b.level) || a.difficulty - b.difficulty;
      });
    const fresh = newCandidates(state);
    const out = [];
    // If review is due, prioritise it; otherwise lead with the next lesson.
    const due = active.filter(function (k) {
      const s = state.kps[k.id]; return s && s.dueAt && s.dueAt <= Date.now();
    });
    due.slice(0, 3).forEach(function (k) { out.push(k); });
    if (fresh.length) out.push(fresh[0]);
    active.forEach(function (k) { if (out.indexOf(k) < 0 && out.length < limit) out.push(k); });
    fresh.slice(0, 3).forEach(function (k) { if (out.indexOf(k) < 0 && out.length < limit) out.push(k); });
    return out.slice(0, limit);
  }

  function recentItemIds(state, n) {
    const ids = {};
    state.attempts.slice(-n).forEach(function (a) { ids[a.itemId] = true; });
    return ids;
  }

  /* Only introduced knowledge points enter Guided Practice. All selection
     uses the same eligibility as Study Plan and Learn New. */
  function buildSession(state, size) {
    const n = size || 10;
    const recent = recentItemIds(state, 24);
    const ranked = KPS.filter(function (kp) { return hasStarted(state, kp) && guidedEligible(state, kp); })
      .sort(function (a, b) {
        const p = priority(state, b) - priority(state, a);
        return p || levelIndex(a.level) - levelIndex(b.level) || a.difficulty - b.difficulty;
      });
    const chosen = ranked.slice(0, Math.min(8, ranked.length));
    const pools = chosen.map(function (kp) {
      const all = kp.items.filter(function (it) { return it.stage !== "guided"; });
      const fresh = all.filter(function (it) { return !recent[it.id]; });
      const s = state.kps[kp.id];
      const answered = s ? s.n : 0;
      const ordered = (fresh.length ? fresh : all).slice().sort(function (a, b) {
        return a.difficulty - b.difficulty;
      });
      // Difficulty rises as the learner accumulates actual evidence.
      if (answered <= 2) ordered.sort(function (a, b) {
        return (a.stage === "check" ? 0 : 1) - (b.stage === "check" ? 0 : 1) || a.difficulty - b.difficulty;
      });
      return ordered;
    });
    const picked = [];
    let added = true;
    while (picked.length < n && added) {
      added = false;
      for (let i = 0; i < pools.length && picked.length < n; i++) {
        if (!pools[i].length) continue;
        const item = pools[i].shift();
        picked.push({ kpId: chosen[i].id, itemId: item.id, difficulty: item.difficulty });
        added = true;
      }
    }
    picked.sort(function (a, b) { return a.difficulty - b.difficulty; });
    return { id: "s" + Date.now().toString(36), createdAt: Date.now(), items: picked };
  }

  function touchStreak(state) {
    const t = todayStr();
    if (state.streak.last === t) return;
    state.streak.count = state.streak.last === yesterdayStr() ? state.streak.count + 1 : 1;
    state.streak.last = t;
  }

  /* ---------------- notebook ---------------- */

  function ensureNotebook(state) {
    if (!state.notebook) state.notebook = { items: [], kps: [] };
    if (!Array.isArray(state.notebook.items)) state.notebook.items = [];
    if (!Array.isArray(state.notebook.kps)) state.notebook.kps = [];
    return state.notebook;
  }

  /* Wrong answers land here automatically; repeats bump a counter instead of
     duplicating. A repeat also reopens an entry that had been resolved. */
  function noteWrong(state, itemId, kpId) {
    const nb = ensureNotebook(state);
    const found = nb.items.filter(function (x) { return x.itemId === itemId; })[0];
    if (found) {
      found.wrong += 1;
      found.lastAt = Date.now();
      found.resolved = false;
      found.resolvedAt = null;
    } else {
      nb.items.push({
        itemId: itemId, kpId: kpId, wrong: 1,
        at: Date.now(), lastAt: Date.now(), resolved: false
      });
    }
    return nb;
  }

  /* Two correct answers on two different questions is the bar for calling a
     mistake fixed. The history is kept; the entry just leaves the queue. */
  function resolveNotebook(state, kpId) {
    const nb = ensureNotebook(state);
    let changed = 0;
    nb.items.forEach(function (x) {
      if (x.kpId === kpId && !x.resolved) {
        x.resolved = true;
        x.resolvedAt = Date.now();
        changed++;
      }
    });
    return changed;
  }

  function removeNote(state, itemId) {
    const nb = ensureNotebook(state);
    nb.items = nb.items.filter(function (x) { return x.itemId !== itemId; });
  }

  function toggleKpSave(state, kpId) {
    const nb = ensureNotebook(state);
    const i = nb.kps.indexOf(kpId);
    if (i >= 0) { nb.kps.splice(i, 1); return false; }
    nb.kps.push(kpId);
    return true;
  }

  function isKpSaved(state, kpId) {
    const nb = ensureNotebook(state);
    return nb.kps.indexOf(kpId) >= 0;
  }

  /* Unresolved first, then most-missed, then most recent. */
  function notebookItems(state) {
    const nb = ensureNotebook(state);
    return nb.items.slice().sort(function (a, b) {
      if (!!a.resolved !== !!b.resolved) return a.resolved ? 1 : -1;
      if (b.wrong !== a.wrong) return b.wrong - a.wrong;
      return b.lastAt - a.lastAt;
    });
  }

  /* The badge count is the review queue, so resolved entries stop counting. */
  function notebookCount(state) {
    const nb = ensureNotebook(state);
    return nb.items.filter(function (x) { return !x.resolved; }).length + nb.kps.length;
  }

  function clearNotebook(state) {
    state.notebook = { items: [], kps: [] };
  }

  /* The single place where an answer becomes learning evidence.

     correct is tri-state and the distinction matters:
       true  -> mastery up, attempt logged
       false -> mastery down, attempt logged, question goes to the Notebook
       null  -> skipped: no evidence at all (no BKT move, no Notebook entry,
                not counted in the accuracy denominator)

     Everything that scores an answer (kwiz, placement, exam, pre-learn) goes
     through here, so those three cases can never drift apart again. */
  function applyAttempt(state, a) {
    if (!Array.isArray(state.attempts)) state.attempts = [];
    const before = scoreOf(state, a.kpId);

    if (a.correct === null || a.correct === undefined) {
      return { skipped: true, before: before, after: before, delta: 0 };
    }

    const correct = !!a.correct;

    /* Sentence-bank questions are context, not evidence: the blank is a noun
       slot, so getting it wrong says nothing about whether you know the
       grammar point the sentence happens to contain. Log it, score it in the
       session, but leave mastery and the Notebook alone. */
    if (a.noMastery) {
      state.attempts.push({
        itemId: a.itemId, kpId: a.kpId, correct: correct,
        at: a.at || Date.now(), source: a.source || "sentence", noMastery: true
      });
      return { skipped: false, before: before, after: before, delta: 0, noMastery: true };
    }

    updateKp(state, a.kpId, correct);
    const kpState = ensure(state, a.kpId);

    if (correct) {
      /* Track distinct questions answered right since the last miss. */
      if (!Array.isArray(kpState.correctSince)) kpState.correctSince = [];
      if (kpState.correctSince.indexOf(a.itemId) < 0) kpState.correctSince.push(a.itemId);
      if (kpState.correctSince.length > 8) kpState.correctSince = kpState.correctSince.slice(-8);
      if (kpState.correctSince.length >= 2) resolveNotebook(state, a.kpId);
    } else {
      kpState.correctSince = [];
      noteWrong(state, a.itemId, a.kpId);
    }
    state.attempts.push({
      itemId: a.itemId,
      kpId: a.kpId,
      correct: correct,
      at: a.at || Date.now(),
      source: a.source || "kwiz"
    });
    state.plan = null;

    const after = scoreOf(state, a.kpId);
    return { skipped: false, before: before, after: after, delta: after - before };
  }

  function finishSession(state, session, answers) {
    let correct = 0, skipped = 0;
    answers.forEach(function (a) {
      if (a.correct === null || a.correct === undefined) { skipped++; return; }
      if (a.correct) correct++;
      /* Answers already scored at answer time (kwiz) must not be counted twice. */
      if (a.applied) return;
      applyAttempt(state, {
        kpId: a.kpId, itemId: a.itemId, correct: a.correct,
        source: a.source || "kwiz", noMastery: !!a.noMastery
      });
    });

    const total = answers.length;
    const answered = total - skipped;
    const ratio = answered ? correct / answered : 0;
    const stars = answered && correct === answered ? 5 : ratio >= 0.8 ? 4 : ratio >= 0.6 ? 3 : ratio >= 0.4 ? 2 : 1;

    const record = {
      id: session.id,
      at: Date.now(),
      total: total,
      answered: answered,
      correct: correct,
      skipped: skipped,
      stars: stars,
      answers: answers
    };
    state.sessions.push(record);
    touchStreak(state);
    return record;
  }

  function dueCount(state) {
    let c = 0;
    KPS.forEach(function (k) {
      const s = state.kps[k.id];
      if (s && hasStarted(state, k) && guidedEligible(state, k) && s.dueAt && s.dueAt <= Date.now()) c++;
    });
    return c;
  }

  /* Questions answered today, used for the daily goal ring on the dashboard. */
  function todayCount(state) {
    const t = todayStr();
    let c = 0;
    (state.attempts || []).forEach(function (a) {
      if (todayStr(new Date(a.at)) === t) c++;
    });
    return c;
  }

  /* Points whose confidence improved or dropped today — a light "progress today" signal. */
  function todayMoved(state) {
    const t = todayStr();
    const ids = {};
    (state.attempts || []).forEach(function (a) {
      if (!a.kpId) return;              /* vocabulary / conjugation rows */
      if (todayStr(new Date(a.at)) === t) ids[a.kpId] = true;
    });
    return Object.keys(ids).length;
  }

  function weakCount(state) {
    let c = 0;
    KPS.forEach(function (k) {
      const s = state.kps[k.id];
      if (s && hasStarted(state, k) && guidedEligible(state, k) && s.n && display(s.p, s.n) < 50) c++;
    });
    return c;
  }

  function seedDemo(state) {
    const target = { A0: 0.94, A1: 0.86, A2: 0.70, B1: 0.56, B2: 0.44 };
    KPS.forEach(function (kp) {
      const rough = Math.random() < 0.04;
      const p = rough
        ? 0.16 + Math.random() * 0.16
        : clamp(target[kp.level] + (Math.random() - 0.5) * 0.14, 0.10, 0.96);
      const n = 4 + Math.floor(Math.random() * 6);
      const wrong = Math.max(0, Math.round(n * (1 - p) * 0.8));
      const strength = Math.max(0, (p - 0.45) / 0.55);
      const overdue = Math.random() < 0.3;
      state.kps[kp.id] = {
        p: p,
        n: n,
        correct: n - wrong,
        wrong: wrong,
        state: p >= 0.85 ? "mastered" : "testing",
        dueAt: overdue
          ? Date.now() - (0.5 + Math.random() * 3) * 86400000
          : Date.now() + (0.2 + 10 * strength * strength) * 86400000,
        lastSeen: Date.now() - Math.floor(Math.random() * 6) * 86400000
      };
      for (let i = 0; i < n; i++) {
        state.attempts.push({
          itemId: kp.items[i % kp.items.length].id,
          kpId: kp.id,
          correct: Math.random() < p,
          at: Date.now() - Math.floor(Math.random() * 20) * 86400000
        });
      }
    });
    for (let i = 0; i < 6; i++) {
      const c = 4 + Math.floor(Math.random() * 7);
      state.sessions.push({
        id: "seed" + i, at: Date.now() - i * 86400000,
        total: 10, correct: c, skipped: 0,
        stars: c === 10 ? 5 : c >= 8 ? 4 : c >= 6 ? 3 : 2, answers: []
      });
    }
    state.streak = { count: 4, last: todayStr() };
    state.seeded = true;
    return state;
  }

  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .trim()
      .replace(/[’‘]/g, "'")
      .replace(/\s+/g, " ")
      .replace(/[.!?]+$/g, "");
  }

  function isCorrect(item, given) {
    const g = normalize(given);
    if (!g) return false;
    if (normalize(item.answer) === g) return true;
    return (item.accept || []).some(function (a) { return normalize(a) === g; });
  }

  return {
    newState: newState,
    ensure: ensure,
    display: display,
    scoreOf: scoreOf,
    colorFor: colorFor,
    statusOf: statusOf,
    updateKp: updateKp,
    applyAttempt: applyAttempt,
    levelScore: levelScore,
    levelStats: levelStats,
    buildSession: buildSession,
    startingLevel: startingLevel,
    guidedLevel: guidedLevel,
    prereqReady: prereqReady,
    guidedEligible: guidedEligible,
    nextNewPoint: nextNewPoint,
    hasStarted: hasStarted,
    finishSession: finishSession,
    touchStreak: touchStreak,
    noteWrong: noteWrong,
    resolveNotebook: resolveNotebook,
    removeNote: removeNote,
    toggleKpSave: toggleKpSave,
    isKpSaved: isKpSaved,
    notebookItems: notebookItems,
    notebookCount: notebookCount,
    clearNotebook: clearNotebook,
    dueCount: dueCount,
    todayCount: todayCount,
    todayMoved: todayMoved,
    weakCount: weakCount,
    planList: planList,
    seedDemo: seedDemo,
    normalize: normalize,
    isCorrect: isCorrect,
    todayStr: todayStr
  };
})();
