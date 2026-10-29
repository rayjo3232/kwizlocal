/* Distractor-specific feedback for the points learners get wrong most often.

   A generic "not quite, the answer is X" does not teach anything: you already
   knew the right form was an option. What you need to know is why the form you
   picked is wrong *here*. This file answers that for the twenty highest-traffic
   points — one short sentence per wrong option.

   Keyed by knowledge-point id, then by the wrong option exactly as it appears
   in the question (lookups are normalised, so "n'ai" matches "n’ai"). Missing
   ids fall back silently to the item's own explanation. */

const DISTRACT = {

  /* ---- articles ---- */
  "a0.articles.definite": {
    "le": "« le » is masculine singular. Check the noun's gender before choosing it.",
    "la": "« la » is feminine singular — the noun in this sentence is not feminine.",
    "les": "« les » is plural, for both genders. This blank is singular."
  },
  "a0.articles.indefinite": {
    "un": "« un » is masculine singular ('a').",
    "une": "« une » is feminine singular ('a').",
    "des": "« des » is plural ('some'). This blank is singular."
  },
  "a1.articles.partitive": {
    "du": "« du » = de + le: masculine singular, an unspecified amount.",
    "de": "« de » on its own comes after a quantity or a negation, not before a noun.",
    "le": "« le » means 'the' — a specific thing, not 'some of it'.",
    "de l'": "« de l' » is for a singular noun starting with a vowel or a silent h.",
    "de la": "« de la » is feminine singular."
  },

  /* ---- adjectives ---- */
  "a1.possessives": {
    "mon": "« mon » goes with a masculine singular noun (and with any noun starting with a vowel).",
    "ma": "« ma » goes with a feminine singular noun — never before a vowel.",
    "mes": "« mes » is plural, whatever the gender."
  },
  "a1.adjectives.agreement": {
    "grand": "« grand » is masculine singular — the noun it describes is not.",
    "grande": "« grande » is feminine singular.",
    "grands": "« grands » is masculine plural.",
    "français": "« français » is masculine singular.",
    "française": "« française » is feminine singular.",
    "françaises": "« françaises » is feminine plural."
  },
  "a1.adjectives.demonstrative": {
    "ce": "« ce » goes with a masculine singular noun that starts with a consonant.",
    "cet": "« cet » is for a masculine singular noun starting with a vowel or silent h.",
    "cette": "« cette » is feminine singular, whatever the first letter.",
    "ces": "« ces » is plural, both genders."
  },

  /* ---- pronouns ---- */
  "a0.pronouns.subject": {
    "je": "« je » is first person singular; the verb here is not first person.",
    "tu": "« tu » is one person you know well — check the verb ending.",
    "il": "« il » is masculine singular; check whether the subject is plural.",
    "elle": "« elle » is feminine singular.",
    "ils": "« ils » is masculine or mixed plural.",
    "elles": "« elles » is feminine plural only."
  },
  "a2.pronouns.cod": {
    "le": "« le » replaces a masculine singular direct object.",
    "la": "« la » replaces a feminine singular direct object.",
    "les": "« les » replaces a plural direct object, either gender."
  },
  "a2.pronouns.coi": {
    "lui": "« lui » is a singular indirect object: to him, to her.",
    "leur": "« leur » is a plural indirect object (to them) and never takes an -s.",
    "la": "« la » is a direct object pronoun; this verb takes à + a person, so you need an indirect one.",
    "les": "« les » is a direct object pronoun, not an indirect one.",
    "le": "« le » is a direct object pronoun, not an indirect one."
  },
  "a2.pronouns.y_en": {
    "y": "« y » replaces à + a place or a thing ('there', 'about it').",
    "en": "« en » replaces de + a thing or a quantity ('some', 'of it').",
    "le": "« le » is a direct object pronoun — it cannot stand for a place."
  },

  /* ---- verbs ---- */
  "a0.etre.present": {
    "est": "« est » is il / elle / on.",
    "sont": "« sont » is ils / elles.",
    "êtes": "« êtes » is vous."
  },
  "a0.avoir.present": {
    "a": "« a » is il / elle / on.",
    "ont": "« ont » is ils / elles.",
    "avez": "« avez » is vous."
  },
  "a0.er.present": {
    "travaille": "« travaille » is je / tu / il — the ending carries the subject.",
    "travaillons": "« travaillons » is nous.",
    "travaillent": "« travaillent » is ils / elles."
  },
  "a1.negation.ne_pas": {
    "ai": "Without « ne » this is a positive statement, not a negation.",
    "n'ai": "« n'ai » is the negated form of avoir — check whether this sentence needs avoir or être.",
    "suis": "« suis » is être; this sentence is built on avoir."
  },
  "a2.passe_compose.avoir": {
    "prendu": "« prendu » does not exist — prendre has an irregular past participle.",
    "pris": "« pris » is the participle; it still needs the auxiliary in front.",
    "prendre": "« prendre » is the infinitive, not a past participle."
  },
  "a2.passe_compose.etre": {
    "arrivé": "« arrivé » is masculine singular.",
    "arrivés": "« arrivés » is masculine plural (or mixed).",
    "arrivées": "« arrivées » is feminine plural."
  },
  "a2.imparfait.formation": {
    "faisait": "« faisait » is imparfait: the stem is the nous-form minus -ons.",
    "ferait": "« ferait » is the conditional, not the imparfait.",
    "fit": "« fit » is the passé simple — literary, not spoken French."
  },

  /* ---- structure ---- */
  "b1.relative.qui_que": {
    "qui": "« qui » is the subject of the verb that follows it.",
    "que": "« que » is the object — a subject has to come after it.",
    "dont": "« dont » replaces de + noun: 'whose', 'of which'."
  },
  "a1.aller.prepositions": {
    "à": "« à » works for a city. For a masculine country you need « au ».",
    "au": "« au » = à + le, used with masculine countries.",
    "à l'": "« à l' » is for a singular noun starting with a vowel or silent h."
  },
  "a0.syntax.cest_vs_il_est": {
    "c'est": "« C'est » points at a thing or an idea. Before a profession or an adjective describing a person, French uses « il est ».",
    "il est": "« Il est » + adjective or profession. Before a name, or a noun with its own article, use « c'est ».",
    "il a": "« Il a » means 'he has' — a different verb entirely."
  }
};
