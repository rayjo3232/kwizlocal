/* Curriculum graph: teaching order, soft prerequisites, and stage.

   The hard prerequisites already live on each point in data.js (`prereqs`) —
   they are what actually gates practice. This file adds the two things that
   were missing:

   - `order`: the teaching sequence *within a level*, written down explicitly
     instead of being inferred from array position. Inserting a point into
     data.js no longer silently reshuffles the course, and the order is
     reviewable in one place.
   - `soft`: advisory links. A soft prerequisite never blocks anything; it only
     moves a lesson ahead of a sibling whose soft prerequisites are untouched,
     so the plan prefers the point that builds on something you already know.

   Points missing from LEARNING_ORDER are appended in authored order and
   reported by tools/check_curriculum.js — the fallback keeps the app working,
   the report stops the gap going unnoticed. */

const CURRICULUM_ORDER = {
  A0: [
    "a0.articles.definite",
    "a0.articles.indefinite",
    "a0.pronouns.subject",
    "a0.etre.present",
    "a0.avoir.present",
    "a0.er.present",
    "a0.nouns.gender",
    "a0.nouns.plural",
    "a0.verbs.aller",
    "a0.adjectives.position",
    "a0.expressions.il_y_a",
    "a0.syntax.cest_vs_il_est",
    "a0.verbs.faire",
    "a0.verbs.venir",
    "a0.adjectives.colors",
    "a0.expressions.time",
    "a0.expressions.weather",
    "a0.syntax.questions_intonation",
    "a0.verbs.prendre",
    "a0.nouns.days_months",
    "a0.expressions.greetings",
    "a0.nouns.numbers"
  ],
  A1: [
    "a1.negation.ne_pas",
    "a1.questions.est_ce_que",
    "a1.possessives",
    "a1.adjectives.agreement",
    "a1.aller.prepositions",
    "a1.passe_recent",
    "a1.articles.partitive",
    "a1.adjectives.demonstrative",
    "a1.verbs.futur_proche",
    "a1.verbs.reflexive",
    "a1.verbs.imperative",
    "a1.prepositions.place",
    "a1.pronouns.stress",
    "a1.verbs.modals",
    "a1.adjectives.comparative",
    "a1.syntax.negation_rien_jamais",
    "a1.expressions.quantity",
    "a1.prepositions.time",
    "a1.verbs.irregular_ir",
    "a1.verbs.stem_changing",
    "a1.pronouns.indefinite",
    "a1.syntax.connectors_basic",
    "a1.expressions.food",
    "a1.adjectives.position_meaning",
    "reading.a1.intro",
    "reading.a1.bakery",
    "a1.negation.plus_personne",
    "a1.expressions.il_faut",
    "a1.adverbs.intensity",
    "a1.adverbs.place_time",
    "a1.pronouns.on",
    "a1.verbs.ir_regular",
    "a1.verbs.re_regular",
    "a1.verbs.irregular_oir",
    "a1.nouns.numbers_big",
    "a1.expressions.date",
    "a1.adjectives.irregular",
    "a1.prepositions.transport"
  ],
  A2: [
    "a2.passe_compose.avoir",
    "a2.passe_compose.etre",
    "a2.imparfait.formation",
    "a2.imparfait_vs_pc",
    "a2.pronouns.cod",
    "a2.pronouns.y_en",
    "a2.pronouns.coi",
    "a2.syntax.relative_ou",
    "a2.syntax.time_markers",
    "a2.adjectives.superlative",
    "a2.adjectives.adverbs_ment",
    "a2.prepositions.geography",
    "a2.verbs.pronominaux_passe",
    "a2.verbs.imparfait_usage",
    "a2.pronouns.possessive",
    "a2.pronouns.demonstrative",
    "a2.syntax.cause_consequence",
    "a2.expressions.avoir",
    "a2.verbs.accord_participe",
    "a2.syntax.discours_indirect",
    "a2.pronouns.indefinite",
    "a2.prepositions.expressions",
    "a2.expressions.faux_amis",
    "a2.syntax.interrogation_quel",
    "reading.a2.weekend",
    "reading.a2.rent",
    "a2.adverbs.frequency",
    "a2.verbs.politesse",
    "a2.adjectives.tout",
    "a2.prepositions.movement",
    "a2.syntax.interrogation_complete",
    "a2.syntax.comparison_quantity",
    "a2.verbs.imperatif_pronoms",
    "a2.verbs.venir_tenir",
    "a2.verbs.savoir_connaitre",
    "a2.verbs.devoir_falloir",
    "a2.pronouns.neuter_le",
    "a2.pronouns.tout"
  ],
  B1: [
    "b1.future.simple",
    "b1.conditional.present",
    "b1.subjunctive.present",
    "b1.relative.qui_que",
    "b1.comparison",
    "b1.pronoun_order",
    "b1.verbs.plus_que_parfait",
    "b1.verbs.passive",
    "b1.syntax.relative_dont",
    "b1.syntax.si_clauses",
    "b1.verbs.gerondif",
    "b1.expressions.connectors",
    "b1.verbs.subjunctive_conj",
    "b1.verbs.conditional_past",
    "b1.syntax.inversion",
    "b1.syntax.emphasis",
    "b1.pronouns.relative_compose",
    "b1.expressions.formal",
    "b1.verbs.futur_anterieur",
    "b1.syntax.concession",
    "b1.syntax.but",
    "b1.syntax.participle_present",
    "b1.pronouns.relatifs_composes",
    "b1.expressions.synonyms",
    "reading.b1.email",
    "reading.b1.notice",
    "reading.b1.neighbourhood",
    "b1.negation.que_aucun",
    "b1.adjectives.indefinis",
    "b1.adverbs.maniere",
    "b1.adjectives.ci_la",
    "b1.verbs.prepositionnels",
    "b1.verbs.passe_simple",
    "b1.syntax.discours_indirect",
    "b1.syntax.si_present",
    "b1.verbs.faire_causatif",
    "b1.pronouns.ce_dont"
  ],
  B2: [
    "b2.syntax.nominalisation",
    "b2.verbs.subjonctif_passe",
    "b2.syntax.discours_indirect_passe",
    "b2.expressions.registre",
    "reading.b2.article",
    "reading.b2.job_ad",
    "reading.b2.phones",
    "b2.verbs.infinitif_passe",
    "b2.negation.expletif",
    "b2.syntax.sans_au_cas",
    "b2.expressions.presentatifs",
    "b2.verbs.prepositionnels_avance",
    "b2.syntax.connecteurs_avances",
    "b2.syntax.concordance",
    "b2.pronouns.indefinis",
    "b2.syntax.opposition",
    "b2.syntax.consequence",
    "b2.verbs.passe_anterieur",
    "b2.syntax.nominalisation_2",
    "b2.verbs.passif_avance",
    "b2.pronouns.relatifs_composes_2",
    "b2.verbs.subjonctif_avance",
    "b2.syntax.locutions_conjonctives",
    "b2.expressions.idiomatiques",
    "b2.adverbs.attitude",
    "b2.syntax.insertion",
    "b2.expressions.registre_shift"
  ],
};

/* Advisory only: these pairs read better in one order, but neither point is a
   genuine gate. Keep this list short — anything that truly blocks belongs in
   `prereqs` on the point itself. */
const CURRICULUM_SOFT = {
  "a1.possessives": ["a0.nouns.gender"],
  "a1.adjectives.agreement": ["a0.nouns.gender"],
  "a1.prepositions.time": ["a0.expressions.time"],
  "a1.verbs.reflexive": ["a1.pronouns.stress"],
  "a2.pronouns.cod": ["a1.pronouns.stress"],
  "a2.adjectives.superlative": ["a1.adjectives.comparative"],
  "a2.prepositions.geography": ["a1.prepositions.place"],
  "a2.syntax.cause_consequence": ["a1.syntax.connectors_basic"],
  "b1.comparison": ["a1.adjectives.comparative"],
  "b1.pronoun_order": ["a1.pronouns.stress"],
  "b1.expressions.connectors": ["a1.syntax.connectors_basic"],
  "b1.verbs.plus_que_parfait": ["a2.imparfait_vs_pc"],
  "b1.syntax.concession": ["a2.syntax.cause_consequence"],
  "b1.syntax.but": ["a1.expressions.il_faut"],
  "b1.negation.que_aucun": ["a1.syntax.negation_rien_jamais"],
  "b1.verbs.prepositionnels": ["a2.prepositions.expressions"],
  "b2.syntax.nominalisation": ["b1.verbs.passive"]
};

/* Attach the curriculum to the points. Called once, right after data.js and
   extra.js have built KPS. */
function applyCurriculum() {
  if (typeof KPS === "undefined") return;
  const byId = {};
  KPS.forEach(function (kp) { byId[kp.id] = kp; });

  const placed = {};
  Object.keys(CURRICULUM_ORDER).forEach(function (level) {
    CURRICULUM_ORDER[level].forEach(function (id, i) {
      const kp = byId[id];
      if (!kp) return;                 // reported by the validator
      kp.order = i;
      placed[id] = true;
    });
  });

  /* Anything the list does not mention keeps a stable position at the end of
     its own level, in authored order. */
  const tail = {};
  KPS.forEach(function (kp) {
    if (placed[kp.id]) return;
    tail[kp.level] = (tail[kp.level] || 0) + 1;
    kp.order = 1000 + tail[kp.level];
  });

  KPS.forEach(function (kp) {
    kp.soft = CURRICULUM_SOFT[kp.id] || [];
    kp.stage = kp.category === "reading" ? "reading"
      : kp.level === "B2" ? "extension"
        : (kp.prereqs || []).length ? "core" : "foundation";
  });
}

applyCurriculum();
