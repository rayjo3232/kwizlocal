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

  function prereqReady(state, kp) {
    if (!kp.prereqs.length) return true;
    return kp.prereqs.every(function (id) {
      const s = state.kps[id];
      return s && s.n > 0 && display(s.p, s.n) >= 30;
    });
  }

  function priority(state, kp) {
    const s = state.kps[kp.id];
    const score = s ? display(s.p, s.n) : 0;
    let v = 0;
    if (!s || !s.n) {
      const order = { A0: 0, A1: 1, A2: 2, B1: 3, B2: 4 };
      v = 0.62 - (order[kp.level] || 0) * 0.07;
    }
    else if (s.dueAt && s.dueAt <= Date.now()) v = 0.95;
    else if (score < 50) v = 0.75;
    else if (score < 70) v = 0.40;
    else v = 0.18;
    if (!prereqReady(state, kp)) v -= 0.22;
    if (s && s.dueAt) {
      const overdue = (Date.now() - s.dueAt) / 86400000;
      if (overdue > 0) v += Math.min(0.2, overdue * 0.02);
    }
    return v + Math.random() * 0.04;
  }

  function recentItemIds(state, n) {
    const ids = {};
    state.attempts.slice(-n).forEach(function (a) { ids[a.itemId] = true; });
    return ids;
  }

  function buildSession(state, size) {
    const n = size || 10;
    const recent = recentItemIds(state, 24);

    const ranked = KPS.slice().sort(function (a, b) { return priority(state, b) - priority(state, a); });
    const chosen = ranked.slice(0, Math.min(6, ranked.length));

    // Make sure at least one brand-new point appears if one is available.
    const unseen = ranked.filter(function (k) { const s = state.kps[k.id]; return !s || !s.n; });
    if (unseen.length && !chosen.some(function (k) { const s = state.kps[k.id]; return !s || !s.n; })) {
      chosen[chosen.length - 1] = unseen[0];
    }

    const pools = chosen.map(function (kp) {
      const items = kp.items.filter(function (it) {
        return it.stage !== "guided" && !recent[it.id];
      });
      const fallback = kp.items.filter(function (it) { return it.stage !== "guided"; });
      return (items.length ? items : fallback).slice().sort(function (a, b) { return a.difficulty - b.difficulty; });
    });

    const picked = [];
    let guard = 0;
    while (picked.length < n && guard < 200) {
      guard++;
      let added = false;
      for (let i = 0; i < pools.length && picked.length < n; i++) {
        if (!pools[i].length) continue;
        const it = pools[i].shift();
        if (!it) continue;
        picked.push({ kpId: chosen[i].id, itemId: it.id });
        added = true;
      }
      if (!added) break;
    }

    // Ascending difficulty, with a small jitter, then de-duplicate neighbours.
    picked.forEach(function (p) {
      const kp = KP_BY_ID[p.kpId];
      const it = kp.items.filter(function (x) { return x.id === p.itemId; })[0];
      p.difficulty = it.difficulty + Math.random() * 0.15;
    });
    picked.sort(function (a, b) { return a.difficulty - b.difficulty; });

    for (let i = 1; i < picked.length; i++) {
      if (picked[i].kpId === picked[i - 1].kpId && i + 1 < picked.length) {
        const tmp = picked[i];
        picked[i] = picked[i + 1];
        picked[i + 1] = tmp;
      }
    }

    return {
      id: "s" + Date.now().toString(36),
      createdAt: Date.now(),
      items: picked.slice(0, n)
    };
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

  /* Wrong answers land here automatically; repeats bump a counter instead of duplicating. */
  function noteWrong(state, itemId, kpId) {
    const nb = ensureNotebook(state);
    const found = nb.items.filter(function (x) { return x.itemId === itemId; })[0];
    if (found) {
      found.wrong += 1;
      found.lastAt = Date.now();
    } else {
      nb.items.push({ itemId: itemId, kpId: kpId, wrong: 1, at: Date.now(), lastAt: Date.now() });
    }
    return nb;
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

  /* Most-missed first, then most recent. */
  function notebookItems(state) {
    const nb = ensureNotebook(state);
    return nb.items.slice().sort(function (a, b) {
      if (b.wrong !== a.wrong) return b.wrong - a.wrong;
      return b.lastAt - a.lastAt;
    });
  }

  function notebookCount(state) {
    const nb = ensureNotebook(state);
    return nb.items.length + nb.kps.length;
  }

  function clearNotebook(state) {
    state.notebook = { items: [], kps: [] };
  }

  function finishSession(state, session, answers) {
    let correct = 0, skipped = 0;
    answers.forEach(function (a) {
      if (a.correct === null) { skipped++; return; }
      if (a.correct) correct++;
      /* Answers already scored at answer time (kwiz) must not be counted twice. */
      if (a.applied) return;
      if (!a.correct) noteWrong(state, a.itemId, a.kpId);
      updateKp(state, a.kpId, a.correct);
      state.attempts.push({
        itemId: a.itemId, kpId: a.kpId, correct: a.correct, at: Date.now()
      });
    });

    const total = answers.length;
    const ratio = total ? correct / total : 0;
    const stars = correct === total ? 5 : ratio >= 0.8 ? 4 : ratio >= 0.6 ? 3 : ratio >= 0.4 ? 2 : 1;

    const record = {
      id: session.id,
      at: Date.now(),
      total: total,
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
      if (s && s.dueAt && s.dueAt <= Date.now()) c++;
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
      if (todayStr(new Date(a.at)) === t) ids[a.kpId] = true;
    });
    return Object.keys(ids).length;
  }

  function weakCount(state) {
    let c = 0;
    KPS.forEach(function (k) {
      const s = state.kps[k.id];
      if (s && s.n && display(s.p, s.n) < 50) c++;
    });
    return c;
  }

  function planList(state, n) {
    return KPS.slice().sort(function (a, b) { return priority(state, b) - priority(state, a); }).slice(0, n || 10);
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
    levelScore: levelScore,
    levelStats: levelStats,
    buildSession: buildSession,
    finishSession: finishSession,
    touchStreak: touchStreak,
    noteWrong: noteWrong,
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
