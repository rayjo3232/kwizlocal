/* Mastery engine: BKT update, display score, scheduling, session builder.
   Pure functions over a plain state object; no DOM access. */

const Engine = (function () {

  /* Bump when the saved shape changes in a way that needs code. migrateState
     upgrades anything older; it never throws away a field it does not know. */
  const STATE_VERSION = 2;

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
      version: STATE_VERSION,
      createdAt: Date.now(),
      kps: {},
      attempts: [],
      sessions: [],
      streak: { count: 0, last: null },
      goal: 20,
      learningLevel: null, // null = use placement estimate or start at A0
      /* Lenient French accents: "etre" passes against "être". Default on
         because typing accents on a phone keyboard is genuinely painful;
         false means every diacritic must be typed. */
      accentLenient: true,
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

  /* Bring any saved profile up to the current shape.

     The old loader threw away the whole profile whenever `version` was not
     exactly 1 — one stale or hand-edited backup and months of progress were
     gone with no warning. This keeps every field it recognises, fills in the
     ones it does not find, and only returns null when the input is clearly not
     a profile at all. */
  function migrateState(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const looksLikeProfile = (raw.kps && typeof raw.kps === "object") || Array.isArray(raw.attempts);
    if (!looksLikeProfile) return null;

    const base = newState();
    const out = Object.assign({}, base, raw);
    out.version = STATE_VERSION;

    if (!out.kps || typeof out.kps !== "object") out.kps = {};
    if (!Array.isArray(out.attempts)) out.attempts = [];
    if (!Array.isArray(out.sessions)) out.sessions = [];
    if (!out.streak || typeof out.streak !== "object") out.streak = { count: 0, last: null };
    if (!out.notebook || typeof out.notebook !== "object") out.notebook = { items: [], kps: [] };
    if (!Array.isArray(out.notebook.items)) out.notebook.items = [];
    if (!Array.isArray(out.notebook.kps)) out.notebook.kps = [];
    if (!out.vocab || typeof out.vocab !== "object") out.vocab = {};
    if (!out.verbs || typeof out.verbs !== "object") out.verbs = {};
    if (!out.sentences || typeof out.sentences !== "object") out.sentences = {};
    if (!out.translate || typeof out.translate !== "object") out.translate = { done: 0, totalPct: 0 };
    if (typeof out.goal !== "number" || !isFinite(out.goal) || out.goal <= 0) out.goal = base.goal;

    /* Settings added after this profile was saved: default them the way a new
       profile would be, not the way `undefined` happens to behave. */
    out.accentLenient = out.accentLenient !== false;
    out.autoAdvance = out.autoAdvance !== false;

    /* A point record with a missing or broken p / n makes display() return
       NaN, which then spreads through every score on the Brainmap. */
    Object.keys(out.kps).forEach(function (id) {
      const s = out.kps[id];
      if (!s || typeof s !== "object") { delete out.kps[id]; return; }
      if (typeof s.p !== "number" || !isFinite(s.p)) s.p = 0.5;
      if (typeof s.n !== "number" || !isFinite(s.n) || s.n < 0) s.n = 0;
      if (typeof s.correct !== "number" || !isFinite(s.correct)) s.correct = 0;
      if (typeof s.wrong !== "number" || !isFinite(s.wrong)) s.wrong = 0;
    });

    /* Rows without an item id or a timestamp cannot be scored or plotted;
       everything else is kept even if it predates the current fields. */
    out.attempts = out.attempts.filter(function (a) {
      return a && typeof a === "object" && a.itemId && typeof a.at === "number";
    });

    out.plan = null;   // recomputed on the next dashboard visit
    return out;
  }

  /* Why the practice button is available or not, in one place, so the
     dashboard and the quiz both explain the same thing. */
  /* What the learner should actually do next.

     Practice only covers introduced points, so once the first point is
     answered there is always something to serve — and a learner who presses
     the primary button every day practises that one point forever. Simulating
     thirty days of three questions a day produced 86 questions on a single
     point and never introduced a second one.

     So: if anything is due or weak, review. If not, the useful move is the
     next lesson, not another pass over material that is already solid. */
  function practiceOutlook(state) {
    const nextLesson = nextNewPoint(state);
    const canPractise = buildSession(state, 1).items.length > 0;
    const introduced = KPS.filter(function (k) { return hasStarted(state, k) && guidedEligible(state, k); }).length;
    const due = dueCount(state);
    const weak = weakCount(state);

    let reason = "ok";
    if (!canPractise) {
      if (!introduced) reason = nextLesson ? "nothing-introduced" : "no-next-lesson";
      else reason = "no-items";
    }

    /* A point that was just introduced has no answers yet, so it is neither
       due nor weak — and recommending "learn" again would stack up seven
       un-practised lessons before a single question. Fresh material comes
       first, then new material. */
    const fresh = schedule(state).buckets.current.length;

    let recommend = "practise";
    if (due || weak) recommend = "review";
    else if (fresh) recommend = "practise";
    else if (nextLesson) recommend = "learn";

    return {
      canPractise: canPractise,
      reason: reason,
      recommend: recommend,
      nextLesson: nextLesson,
      introduced: introduced,
      due: due,
      weak: weak
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

  /* Four separate signals, because one number cannot answer four questions:
     how much has been seen, how well it is known, where the lesson stands, and
     whether it is due. The old `statusOf` collapsed them into one badge and
     the UI had to guess the rest. */
  function pointProfile(state, kp) {
    const s = state.kps[kp.id];
    const n = s ? s.n : 0;
    const mastery = s && n ? display(s.p, n) : null;
    const dueAt = s && s.dueAt ? s.dueAt : null;
    const now = Date.now();

    let stage;
    if (!s) stage = "unseen";
    else if (s.state === "primed" && !n) stage = "primed";
    else if (!n) stage = "introduced";
    else if (mastery >= 75 && n >= 4) stage = "solid";
    else stage = "practising";

    return {
      seen: n,
      correct: s ? s.correct : 0,
      wrong: s ? s.wrong : 0,
      mastery: mastery,
      stage: stage,
      due: !!(dueAt && dueAt <= now),
      dueInDays: dueAt ? Math.round((dueAt - now) / 8640000) / 10 : null
    };
  }

  /* Answers that were right apart from their accents. Tracked separately from
     mastery: the grammar was known, the spelling was not. */
  function accentCount(state, kpId) {
    let n = 0;
    (state.attempts || []).forEach(function (a) {
      if (a.accent && (!kpId || a.kpId === kpId)) n++;
    });
    return n;
  }

  /* The badge shown in lists. Derived from the profile so the two cannot
     disagree. */
  function statusOf(state, kp) {
    const prof = pointProfile(state, kp);
    if (prof.stage === "unseen") return "new";
    if (prof.stage === "primed") return "weak";
    if (prof.due) return "due";
    if (prof.mastery != null && prof.mastery < 50) return "weak";
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
      // Do not let a very low reading difficulty send a new learner straight
      // into a passage: grammar leads inside a level.
      if ((a.category === "reading") !== (b.category === "reading")) {
        return a.category === "reading" ? 1 : -1;
      }
      const sa = softReady(state, a) ? 0 : 1;
      const sb = softReady(state, b) ? 0 : 1;
      if (sa !== sb) return sa - sb;
      return orderOf(a) - orderOf(b);
    });
  }

  function nextNewPoint(state) { return newCandidates(state)[0] || null; }

  /* Stable teaching position. curriculum.js sets `order`; the array position is
     only a fallback for tools that load the engine without it. */
  function orderOf(kp) {
    return typeof kp.order === "number" ? kp.order : KPS.indexOf(kp);
  }

  /* A soft prerequisite never blocks. It only decides which of two ready
     lessons is the better next step: the one that builds on something you have
     already met wins. */
  function softReady(state, kp) {
    const soft = kp.soft || [];
    if (!soft.length) return false;
    return soft.some(function (id) {
      const pre = KP_BY_ID[id];
      return pre && hasStarted(state, pre);
    });
  }

  /* Why this lesson, in one sentence — used by the dashboard and the drawer. */
  function lessonReason(state, kp) {
    if (!kp) return "";
    const start = levelIndex(startingLevel(state));
    const missing = (kp.prereqs || []).filter(function (id) {
      const pre = KP_BY_ID[id];
      if (pre && levelIndex(pre.level) < start) return false;   // assumed at this entry level
      const s = state.kps[id];
      return !(s && s.n >= 2 && display(s.p, s.n) >= 30);
    });
    if (missing.length) {
      return "Needs " + missing.map(function (id) {
        return (KP_BY_ID[id] && KP_BY_ID[id].title) || id;
      }).join(" and ") + " first.";
    }
    if (hasStarted(state, kp)) {
      const s = state.kps[kp.id];
      if (s && s.dueAt && s.dueAt <= Date.now()) return "Due for review.";
      const score = s && s.n ? display(s.p, s.n) : 0;
      if (!s || !s.n) return "Introduced, waiting for its first answers.";
      if (score < 50) return "Weak — scoring " + score + ".";
      return "Already solid; keeping it warm.";
    }
    const soft = (kp.soft || []).filter(function (id) {
      const pre = KP_BY_ID[id];
      return pre && hasStarted(state, pre);
    });
    if (soft.length) return "Builds on " + ((KP_BY_ID[soft[0]] && KP_BY_ID[soft[0]].title) || soft[0]) + ".";
    if (!(kp.prereqs || []).length) return "No prerequisites — a starting point.";
    return "Prerequisites ready — next in the sequence.";
  }

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
  /* Everything the learner could be doing right now, split into the four
     buckets the study plan mixes from. One function so Learn, the plan, the
     quiz and the dashboard cannot disagree about what is eligible. */
  function schedule(state) {
    const now = Date.now();
    const buckets = { due: [], weak: [], current: [], stretch: [] };

    KPS.forEach(function (kp) {
      if (!hasStarted(state, kp) || !guidedEligible(state, kp)) return;
      const s = state.kps[kp.id];
      const score = s && s.n ? display(s.p, s.n) : 0;
      if (s && s.dueAt && s.dueAt <= now) buckets.due.push(kp);
      else if (!s || !s.n) buckets.current.push(kp);
      else if (score < 50) buckets.weak.push(kp);
      else buckets.stretch.push(kp);
    });

    const order = function (a, b) {
      const d = priority(state, b) - priority(state, a);
      return d || levelIndex(a.level) - levelIndex(b.level) || orderOf(a) - orderOf(b);
    };
    Object.keys(buckets).forEach(function (k) { buckets[k].sort(order); });

    return {
      buckets: buckets,
      lesson: newCandidates(state)[0] || null,
      active: buckets.due.concat(buckets.weak, buckets.current, buckets.stretch)
    };
  }

  /* Smooth weighted round-robin: 40% due review, 30% weak, 20% the lesson in
     progress, 10% keeping mastered material warm. A target, not a quota — an
     empty bucket simply hands its slots to the others. */
  const SHARES = { due: 0.4, weak: 0.3, current: 0.2, stretch: 0.1 };

  function rankedByShare(state) {
    const buckets = schedule(state).buckets;
    const taken = { due: 0, weak: 0, current: 0, stretch: 0 };
    const total = Object.keys(buckets).reduce(function (n, k) { return n + buckets[k].length; }, 0);
    const out = [];
    for (let i = 0; i < total; i++) {
      let best = null, bestDeficit = -Infinity;
      Object.keys(buckets).forEach(function (k) {
        if (taken[k] >= buckets[k].length) return;
        const deficit = SHARES[k] * (i + 1) - taken[k];
        if (deficit > bestDeficit) { bestDeficit = deficit; best = k; }
      });
      if (!best) break;
      out.push(buckets[best][taken[best]]);
      taken[best] += 1;
    }
    return out;
  }

  function planList(state, n) {
    const limit = n || 10;
    const sched = schedule(state);
    const out = [];
    const push = function (kp) {
      if (kp && out.indexOf(kp) < 0 && out.length < limit) out.push(kp);
    };
    /* Review first, then the next lesson, then everything else in bucket
       order. Same rule the quiz uses, so the plan cannot promise a lesson the
       quiz will refuse. */
    sched.buckets.due.slice(0, 3).forEach(push);
    push(sched.lesson);
    sched.buckets.weak.forEach(push);
    sched.buckets.current.forEach(push);
    sched.buckets.due.forEach(push);
    sched.buckets.stretch.forEach(push);
    newCandidates(state).slice(0, 3).forEach(push);
    return out.slice(0, limit);
  }

  function recentItemIds(state, n) {
    const ids = {};
    state.attempts.slice(-n).forEach(function (a) { ids[a.itemId] = true; });
    return ids;
  }

  /* Only introduced knowledge points enter Guided Practice. All selection
     uses the same eligibility as Study Plan and Learn New. */
  /* ---- how hard is a question, really -------------------------------------

     The stored `difficulty` was `point difficulty + position * 0.25`: a guess
     from where the question sits in the array. This blends that prior with how
     the question has actually gone for this learner. */

  const TYPE_PRIOR = { choice: 0, fill: 0.35, correct: 0.7, translate: 0.5, order: 0.5, multi_fill: 0.5 };

  function itemStats(state) {
    const out = {};
    (state.attempts || []).forEach(function (a) {
      if (!a.itemId || a.correct === null || a.correct === undefined || a.noMastery) return;
      const r = out[a.itemId] = out[a.itemId] || { seen: 0, wrong: 0 };
      r.seen++;
      if (!a.correct) r.wrong++;
    });
    return out;
  }

  /* Last three real answers per point, so a streak can steer difficulty. */
  function streakMap(state) {
    const out = {};
    (state.attempts || []).forEach(function (a) {
      if (!a.kpId || a.correct === null || a.correct === undefined || a.noMastery) return;
      const list = out[a.kpId] = out[a.kpId] || [];
      list.push(!!a.correct);
      if (list.length > 3) list.shift();
    });
    return out;
  }

  function itemDifficulty(item, kp, stats) {
    /* Three inputs: the authored ramp (the only thing that separates two items
       of the same type inside a point), a small nudge for question type, and
       what has actually happened. Dropping the authored value made every item
       in a point identical, which is worse than trusting position. */
    const authored = typeof item.difficulty === "number"
      ? item.difficulty
      : (kp && kp.difficulty ? kp.difficulty : 2);
    const base = authored + (TYPE_PRIOR[item.type] || 0) * 0.5;
    const st = stats && stats[item.id];
    if (!st || !st.seen) return base;
    /* 25% wrong is the neutral point: above it the question is harder than its
       type suggests, below it easier. The weight grows with evidence. */
    const observed = base + (st.wrong / st.seen - 0.25) * 2.5;
    const w = Math.min(0.65, st.seen / 8);
    return Math.max(0.5, Math.min(6, base * (1 - w) + observed * w));
  }

  function buildSession(state, size) {
    const n = size || 10;
    const recent = recentItemIds(state, 24);
    const ranked = rankedByShare(state);
    const chosen = ranked.slice(0, Math.min(8, ranked.length));
    const stats = itemStats(state);
    const streaks = streakMap(state);

    const pools = chosen.map(function (kp) {
      const all = kp.items.filter(function (it) { return it.stage !== "guided"; });
      const fresh = all.filter(function (it) { return !recent[it.id]; });
      const s = state.kps[kp.id];
      const answered = s ? s.n : 0;
      const streak = streaks[kp.id] || [];

      /* Score each question on measured difficulty, not array position. */
      const scored = (fresh.length ? fresh : all).map(function (it) {
        return { item: it, diff: itemDifficulty(it, kp, stats) };
      });

      scored.sort(function (a, b) {
        /* A newcomer meets the check questions before the kwiz ones. */
        if (answered <= 2) {
          const sa = a.item.stage === "check" ? 0 : 1;
          const sb = b.item.stage === "check" ? 0 : 1;
          if (sa !== sb) return sa - sb;
        }
        return a.diff - b.diff;
      });

      /* Two misses in a row: go back to the easier end and rebuild.
         Three right in a row: let the harder end come forward. */
      const lastTwoWrong = streak.length >= 2 && !streak[streak.length - 1] && !streak[streak.length - 2];
      const lastThreeRight = streak.length === 3 && streak.every(function (c) { return c; });
      if (lastTwoWrong) scored.sort(function (a, b) { return a.diff - b.diff; });
      else if (lastThreeRight) scored.sort(function (a, b) { return b.diff - a.diff; });

      return scored;
    });

    const picked = [];
    let added = true;
    while (picked.length < n && added) {
      added = false;
      for (let i = 0; i < pools.length && picked.length < n; i++) {
        if (!pools[i].length) continue;
        const next = pools[i].shift();
        picked.push({ kpId: chosen[i].id, itemId: next.item.id, difficulty: Math.round(next.diff * 100) / 100 });
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
  /* One row shape for every logged answer. `accent` is only written when the
     answer was right apart from its diacritics, so old rows stay untouched and
     a plain "how many accent slips" query is just a filter. */
  function attemptRow(a, correct, source, noMastery) {
    const row = {
      itemId: a.itemId,
      kpId: a.kpId,
      correct: correct,
      at: a.at || Date.now(),
      source: source
    };
    if (noMastery) row.noMastery = true;
    if (a.accent) row.accent = true;
    return row;
  }

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
      state.attempts.push(attemptRow(a, correct, a.source || "sentence", true));
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
    state.attempts.push(attemptRow(a, correct, a.source || "kwiz", false));
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
    /* A floor of one star made a 0/2 session look rated rather than failed. */
    const stars = answered && correct === answered ? 5 : ratio >= 0.8 ? 4 : ratio >= 0.6 ? 3 : ratio >= 0.4 ? 2 : ratio > 0 ? 1 : 0;

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

  /* Kept for callers that only want a boolean. The full result — including
     whether the answer was right apart from its accents — comes from
     matchAnswer, and that is what the UI uses to explain itself. */
  function isCorrect(item, given, mode) {
    return matchAnswer(item, given, mode).accepted;
  }

  function matchAnswer(item, given, mode) {
    if (typeof AnswerMatch !== "undefined") return AnswerMatch.matchItem(item, given, mode);
    /* Fallback for tools that load engine.js without the matcher. */
    const g = normalize(given);
    if (!g) return { status: "incorrect", accepted: false, expected: String(item.answer || ""), input: g, notes: [], semantic: false };
    const hit = [item.answer].concat(item.accept || []).some(function (a) { return normalize(a) === g; });
    return { status: hit ? "exact" : "incorrect", accepted: hit, expected: String(item.answer || ""), input: g, notes: [], semantic: false };
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
    schedule: schedule,
    rankedByShare: rankedByShare,
    lessonReason: lessonReason,
    orderOf: orderOf,
    pointProfile: pointProfile,
    accentCount: accentCount,
    itemDifficulty: itemDifficulty,
    itemStats: itemStats,
    seedDemo: seedDemo,
    normalize: normalize,
    isCorrect: isCorrect,
    migrateState: migrateState,
    practiceOutlook: practiceOutlook,
    STATE_VERSION: STATE_VERSION,
    matchAnswer: matchAnswer,
    todayStr: todayStr
  };
})();
