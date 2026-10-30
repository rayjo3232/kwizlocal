/* Content library: 102 knowledge points, A0–B2, English explanations.
   Item tuple: [type, prompt, options, answer, explanation, hint]
   Stage by position: 0–1 guided, 2–3 check, 4 kwiz. */

const LEVELS = [
  { id: "A0", name: "A0 · Entry" },
  { id: "A1", name: "A1 · Beginner" },
  { id: "A2", name: "A2 · Intermediate" },
  { id: "B1", name: "B1 · Upper Intermediate" },
  { id: "B2", name: "B2 · Advanced" }
];

const CATEGORIES = {
  articles: "Articles & nouns",
  pronouns: "Pronouns",
  verbs: "Verbs & tenses",
  adjectives: "Adjectives & adverbs",
  prepositions: "Prepositions",
  syntax: "Negation & structure",
  expressions: "Expressions",
  reading: "Reading"
};

function K(id, level, category, title, titleFr, weight, difficulty, prereqs, rule, examples, pitfall, items) {
  return {
    id, level, category, title, titleFr, weight, difficulty, prereqs,
    rule, pitfall,
    examples: examples.map(function (e) { return { fr: e[0], en: e[1] }; }),
    items: items.map(function (it, i) {
      return {
        id: id + ".i" + (i + 1),
        type: it[0],
        stage: i < 2 ? "guided" : (i < 4 ? "check" : "kwiz"),
        prompt: it[1],
        options: it[2] || null,
        answer: it[3],
        explain: it[4],
        hint: it[5] || null,
        passage: it[6] || null,
        difficulty: Math.min(5, +(difficulty + i * 0.25).toFixed(2))
      };
    })
  };
}

/* Graded reading passages. Kept as constants so each item can carry the full
   text without repeating it five times in the source. */
const P_A1_INTRO =
  "Bonjour ! Je m'appelle Marie. J'ai vingt-cinq ans et j'habite à Lyon, en France. " +
  "Je suis étudiante à l'université. J'étudie les langues étrangères : l'anglais et l'espagnol. " +
  "J'aime beaucoup la musique et le cinéma. Le week-end, je retrouve mes amis dans un petit café " +
  "près de la gare. Nous parlons pendant des heures et nous buvons du chocolat chaud.";

const P_A1_BAKERY =
  "Il est huit heures du matin. Paul entre dans la boulangerie près de chez lui. " +
  "« Bonjour madame ! Je voudrais une baguette et deux croissants, s'il vous plaît. » " +
  "La boulangère sourit : « Voilà. Ça fait trois euros vingt. » Paul paie et sort. " +
  "Il a encore faim, alors il mange un croissant tout de suite dans la rue.";

const P_A2_WEEKEND =
  "Samedi prochain, Julie et son frère vont faire une randonnée dans les montagnes. " +
  "Ils vont partir tôt le matin, vers sept heures, parce que le trajet dure deux heures. " +
  "Ils doivent prendre de l'eau, un sandwich et de bonnes chaussures. " +
  "La météo annonce du soleil mais aussi du vent. Le soir, ils rentreront fatigués mais contents, " +
  "et ils mangeront une pizza ensemble.";

const P_A2_RENT =
  "Appartement à louer. Quartier calme, près du centre-ville. Trois pièces : un salon, " +
  "une chambre et une cuisine équipée. Deuxième étage, sans ascenseur. " +
  "Le loyer est de six cents euros par mois, charges comprises. Disponible à partir du premier septembre. " +
  "Pour visiter, téléphonez au 06 12 34 56 78 après dix-huit heures.";

const P_B1_NEIGHBOURHOOD =
  "Depuis dix ans, le quartier a beaucoup changé. Avant, il y avait surtout des petits commerces " +
  "et des ateliers. Aujourd'hui, les vieux bâtiments ont été rénovés et de nombreux restaurants ont ouvert. " +
  "Certains habitants se réjouissent : le quartier est plus animé et plus sûr. " +
  "D'autres regrettent le temps où les loyers étaient abordables. La mairie promet de construire " +
  "des logements sociaux, mais les travaux ne commenceront pas avant deux ans.";

const P_B2_PHONES =
  "Faut-il interdire les téléphones portables à l'école ? Le débat revient régulièrement. " +
  "Les partisans de l'interdiction estiment que ces appareils distraient les élèves et nuisent à la concentration. " +
  "Ils rappellent aussi que les réseaux sociaux peuvent favoriser le harcèlement entre camarades. " +
  "En revanche, certains enseignants soulignent que le téléphone peut devenir un outil pédagogique utile, " +
  "à condition d'être encadré. Plutôt qu'une interdiction totale, ils proposent des règles claires, " +
  "adaptées à l'âge des élèves.";

const KPS = [

  /* ---------------- A0 ---------------- */
  K("a0.articles.definite", "A0", "articles",
    "Definite articles: le, la, les", "Les articles définis", 1.3, 1.2, [],
    "Use le for masculine nouns, la for feminine, les for plural. Before a vowel or silent h, le/la become l'.",
    [["le livre", "the book"], ["la table", "the table"], ["l'école", "the school"], ["les enfants", "the children"]],
    "English has one word for 'the'. In French the article must agree with the noun's gender and number.",
    [
      ["choice", "___ livre (masculine)", ["le", "la", "les"], "le", "livre is masculine singular, so it takes le."],
      ["choice", "___ table (feminine)", ["le", "la", "les"], "la", "table is feminine singular, so it takes la."],
      ["fill", "___ école (feminine, starts with a vowel)", null, "l'", "le and la lose their vowel before a vowel or silent h: l'école.", "Use the elided form."],
      ["choice", "___ livres (plural)", ["le", "la", "les"], "les", "All plural nouns take les, regardless of gender."],
      ["fill", "J'aime ___ musique.", null, "la", "musique is feminine singular, so la musique."]
    ]),

  K("a0.articles.indefinite", "A0", "articles",
    "Indefinite articles: un, une, des", "Les articles indéfinis", 1.2, 1.3, ["a0.articles.definite"],
    "Use un for masculine nouns, une for feminine, des for plural. In a negative sentence they usually become de.",
    [["un chat", "a cat"], ["une maison", "a house"], ["des amis", "some friends"]],
    "English 'a/an' has no plural. French uses des, and switches to de after a negation.",
    [
      ["choice", "___ chat (masculine)", ["un", "une", "des"], "un", "chat is masculine singular, so un."],
      ["choice", "___ maison (feminine)", ["un", "une", "des"], "une", "maison is feminine singular, so une."],
      ["fill", "J'ai ___ amis.", null, "des", "Plural indefinite article before a noun: des amis."],
      ["choice", "C'est ___ problème.", ["un", "une", "des"], "un", "problème is masculine singular."],
      ["fill", "Elle a ___ voiture.", null, "une", "voiture is feminine singular, so une."]
    ]),

  K("a0.pronouns.subject", "A0", "pronouns",
    "Subject pronouns", "Les pronoms sujets", 1.2, 1.1, [],
    "je, tu, il/elle/on, nous, vous, ils/elles. The pronoun always comes before the verb.",
    [["Je suis prêt.", "I am ready."], ["Elle est belge.", "She is Belgian."], ["Ils sont amis.", "They are friends."]],
    "English 'you' covers both tu (one person, informal) and vous (plural or polite).",
    [
      ["choice", "___ suis étudiant.", ["Je", "Tu", "Il"], "Je", "The verb suis goes with je."],
      ["choice", "___ es français.", ["Je", "Tu", "Elle"], "Tu", "The verb es goes with tu."],
      ["fill", "Marie est belge. ___ est belge.", null, "Elle", "Marie is feminine, so use elle.", "Replace Marie with a pronoun."],
      ["choice", "Pierre et Paul ___ sont amis.", ["il", "ils", "elles"], "ils", "Two men = masculine plural ils."],
      ["fill", "Ma sœur et moi, ___ sommes ici.", null, "nous", "Two people including the speaker = nous."]
    ]),

  K("a0.etre.present", "A0", "verbs",
    "être in the present tense", "Le verbe être au présent", 1.4, 1.5, ["a0.pronouns.subject"],
    "être is irregular: je suis, tu es, il/elle est, nous sommes, vous êtes, ils/elles sont.",
    [["Je suis français.", "I am French."], ["Nous sommes à Paris.", "We are in Paris."], ["Ils sont étudiants.", "They are students."]],
    "Do not translate 'am/is/are' with a single form. Each subject has its own form.",
    [
      ["fill", "Je ___ français.", null, "suis", "je + être = je suis."],
      ["fill", "Tu ___ prêt ?", null, "es", "tu + être = tu es.", "It is not 'suis'."],
      ["fill", "Nous ___ à Paris.", null, "sommes", "nous + être = nous sommes."],
      ["choice", "Ils ___ étudiants.", ["est", "sont", "êtes"], "sont", "ils + être = ils sont."],
      ["fill", "Vous ___ gentil.", null, "êtes", "vous + être = vous êtes."]
    ]),

  K("a0.avoir.present", "A0", "verbs",
    "avoir in the present tense", "Le verbe avoir au présent", 1.4, 1.5, ["a0.pronouns.subject"],
    "avoir is irregular: j'ai, tu as, il/elle a, nous avons, vous avez, ils/elles ont.",
    [["J'ai un chat.", "I have a cat."], ["Tu as raison.", "You are right."], ["Ils ont faim.", "They are hungry."]],
    "French uses avoir for age and hunger: j'ai 20 ans, j'ai faim — not 'I am'.",
    [
      ["fill", "J'___ un chat.", null, "ai", "je + avoir = j'ai (elision before a vowel)."],
      ["fill", "Tu ___ raison.", null, "as", "tu + avoir = tu as."],
      ["fill", "Nous ___ deux enfants.", null, "avons", "nous + avoir = nous avons."],
      ["choice", "Elles ___ faim.", ["a", "ont", "avez"], "ont", "elles + avoir = elles ont."],
      ["fill", "J'___ besoin d'aide.", null, "ai", "avoir: j'ai besoin de… — the same form in a different phrase."]
    ]),

  K("a0.er.present", "A0", "verbs",
    "Regular -er verbs in the present", "Les verbes en -er au présent", 1.4, 1.8, ["a0.pronouns.subject"],
    "Drop -er and add: -e, -es, -e, -ons, -ez, -ent. The endings are silent except -ons and -ez.",
    [["Je parle français.", "I speak French."], ["Nous regardons le film.", "We are watching the film."]],
    "The endings -e, -es, -ent are silent, so je parle, tu parles and ils parlent sound identical.",
    [
      ["fill", "Je ___ français. (parler)", null, "parle", "je + parler → parle."],
      ["fill", "Tu ___ à Paris. (habiter)", null, "habites", "tu + habiter → habites.", "Add -s for tu."],
      ["fill", "Nous ___ le film. (regarder)", null, "regardons", "nous + regarder → regardons."],
      ["choice", "Ils ___ ensemble. (travailler)", ["travaille", "travaillons", "travaillent"], "travaillent", "ils + travailler → travaillent."],
      ["fill", "Vous ___ la question. (écouter)", null, "écoutez", "vous + écouter → écoutez."]
    ]),

  /* ---------------- A1 ---------------- */
  K("a1.negation.ne_pas", "A1", "syntax",
    "Negation: ne ... pas", "La négation ne ... pas", 1.5, 1.8, ["a0.etre.present", "a0.avoir.present"],
    "Put ne before the verb and pas after it. un/une/des become de (d' before a vowel).",
    [["Je n'ai pas de chat.", "I don't have a cat."], ["Elle ne mange pas de pommes.", "She doesn't eat apples."], ["Ce n'est pas un problème.", "It's not a problem."]],
    "English 'not' does not change the article. French turns un/une/des into de after a negation.",
    [
      ["choice", "Je ___ pas de chat.", ["ai", "n'ai", "suis"], "n'ai", "ne elides to n' before a vowel: je n'ai pas."],
      ["fill", "Elle ne mange ___ de pommes.", null, "pas", "The second half of the negation is pas."],
      ["fill", "Nous n'avons pas ___ argent.", null, "d'", "de becomes d' before a vowel: d'argent.", "Elision."],
      ["fill", "Il n'y a pas ___ nuages.", null, "de", "des becomes de in a negative sentence."],
      ["correct", "Correct this sentence: Je n'ai pas un chien.", null, "Je n'ai pas de chien.", "un/une/des become de after a negation."]
    ]),

  K("a1.questions.est_ce_que", "A1", "syntax",
    "Questions with est-ce que", "Les questions avec est-ce que", 1.3, 2.0, ["a0.etre.present"],
    "Add est-ce que before a normal statement. Question words go before est-ce que: Où est-ce que...?",
    [["Est-ce que tu parles français ?", "Do you speak French?"], ["Où est-ce que tu habites ?", "Where do you live?"]],
    "English swaps the subject and verb. French can simply add est-ce que and keep the word order.",
    [
      ["choice", "___ tu parles français ?", ["Est-ce que", "Qui", "Comment"], "Est-ce que", "est-ce que turns a statement into a yes/no question."],
      ["fill", "___ est-ce que tu habites ? (where)", null, "Où", "The question word for place is où."],
      ["fill", "Est-ce que tu ___ français ? (parler)", null, "parles", "After est-ce que the word order stays the same: tu parles."],
      ["choice", "___ est-ce que c'est ? (who)", ["Qui", "Que", "Où"], "Qui", "Qui asks about a person."],
      ["fill", "Est-ce qu'il ___ là ? (être)", null, "est", "il + être = il est; est-ce que elides to est-ce qu'."]
    ]),

  K("a1.possessives", "A1", "adjectives",
    "Possessive adjectives", "Les adjectifs possessifs", 1.3, 2.0, ["a0.articles.definite"],
    "mon/ma/mes, ton/ta/tes, son/sa/ses. The form agrees with the noun, not with the owner.",
    [["mon père", "my father"], ["ma mère", "my mother"], ["mes parents", "my parents"]],
    "It agrees with the thing possessed: 'sa mère' can mean his mother or her mother.",
    [
      ["choice", "___ père (masculine)", ["mon", "ma", "mes"], "mon", "père is masculine singular → mon."],
      ["choice", "___ mère (feminine)", ["mon", "ma", "mes"], "ma", "mère is feminine singular → ma."],
      ["fill", "___ parents sont ici. (my)", null, "Mes", "parents is plural → mes.", "Capitalise the first word."],
      ["fill", "C'est ___ amie. (my, feminine)", null, "mon", "Before a vowel, ma becomes mon for pronunciation: mon amie.", "Watch the vowel."],
      ["choice", "___ frères (masculine plural)", ["mon", "ma", "mes"], "mes", "Plural noun → mes."]
    ]),

  K("a1.adjectives.agreement", "A1", "adjectives",
    "Adjective agreement", "L'accord des adjectifs", 1.3, 2.1, ["a0.articles.definite"],
    "Adjectives agree with the noun: add -e for feminine, -s for plural (masculine plural often silent).",
    [["une grande maison", "a big house"], ["des livres intéressants", "interesting books"]],
    "English adjectives never change. In French the adjective copies the gender and number of the noun.",
    [
      ["choice", "une ___ maison", ["grand", "grande", "grands"], "grande", "maison is feminine singular → grande."],
      ["fill", "des livres ___ (intéressant)", null, "intéressants", "livres is masculine plural → intéressants.", "Add -s."],
      ["choice", "Elle est ___.", ["français", "française", "françaises"], "française", "Elle is feminine singular → française."],
      ["fill", "un homme ___ (heureux)", null, "heureux", "heureux is invariable in the masculine singular."],
      ["fill", "deux filles ___ (content)", null, "contentes", "filles is feminine plural → contentes."]
    ]),

  K("a1.aller.prepositions", "A1", "prepositions",
    "aller + place prepositions", "Aller et les prépositions de lieu", 1.3, 2.2, ["a0.etre.present"],
    "à + city, au + masculine country, aux + plural country, en + feminine country, à l' before a vowel.",
    [["Je vais à Paris.", "I am going to Paris."], ["Nous allons au cinéma.", "We are going to the cinema."], ["Elle va en France.", "She is going to France."]],
    "English uses 'to' everywhere. French contracts à + le = au, à + les = aux.",
    [
      ["fill", "Je vais ___ Paris.", null, "à", "Cities take à with no article."],
      ["fill", "Nous allons ___ cinéma.", null, "au", "à + le contracts to au."],
      ["fill", "Ils vont ___ États-Unis.", null, "aux", "à + les contracts to aux.", "Plural country."],
      ["choice", "Elle va ___ école.", ["à", "au", "à l'"], "à l'", "école starts with a vowel → à l'."],
      ["fill", "Tu vas ___ France ?", null, "en", "Feminine countries take en."]
    ]),

  K("a1.passe_recent", "A1", "verbs",
    "Passé récent: venir de", "Le passé récent", 1.2, 2.1, ["a1.aller.prepositions"],
    "venir (present) + de + infinitive = to have just done something.",
    [["Je viens de manger.", "I have just eaten."], ["Ils viennent d'arriver.", "They have just arrived."]],
    "English uses 'just' with the past tense. French uses a present-tense verb + de + infinitive.",
    [
      ["fill", "Je ___ de manger. (venir)", null, "viens", "je + venir = viens."],
      ["fill", "Il vient ___ partir.", null, "de", "The pattern is venir + de + infinitive."],
      ["choice", "Nous ___ d'arriver.", ["venons", "venez", "vient"], "venons", "nous + venir = venons."],
      ["fill", "Elles viennent ___ finir.", null, "de", "de becomes d' only before a vowel; finir starts with a consonant."],
      ["fill", "Ils ___ d'arriver. (venir)", null, "viennent", "ils + venir = ils viennent: ils viennent d'arriver."]
    ]),

  /* ---------------- A2 ---------------- */
  K("a2.passe_compose.avoir", "A2", "verbs",
    "Passé composé with avoir", "Le passé composé avec avoir", 1.5, 2.5, ["a0.avoir.present", "a0.er.present"],
    "avoir (present) + past participle. Most verbs use avoir; the participle does not agree with the subject.",
    [["J'ai mangé.", "I ate / I have eaten."], ["Elle a fini.", "She finished."], ["Ils ont pris le train.", "They took the train."]],
    "English has one simple past. French uses a helper verb + participle, and irregular participles must be memorised.",
    [
      ["fill", "J'___ mangé. (avoir)", null, "ai", "j'ai + past participle."],
      ["fill", "Elle a ___ (parler)", null, "parlé", "-er verbs form the participle in -é."],
      ["fill", "Nous avons ___ (finir)", null, "fini", "-ir verbs form the participle in -i."],
      ["choice", "Ils ont ___ (prendre)", ["prendu", "pris", "prendre"], "pris", "prendre has the irregular participle pris."],
      ["fill", "J'ai ___ le film. (voir)", null, "vu", "voir → vu."]
    ]),

  K("a2.passe_compose.etre", "A2", "verbs",
    "Passé composé with être", "Le passé composé avec être", 1.5, 3.0, ["a0.etre.present", "a2.passe_compose.avoir"],
    "A small group of verbs (aller, venir, partir, arriver, naître, mourir...) use être. The participle agrees with the subject.",
    [["Elle est partie.", "She left."], ["Ils sont allés au cinéma.", "They went to the cinema."], ["Marie et Anne sont venues.", "Marie and Anne came."]],
    "With être the participle behaves like an adjective: -e for feminine, -s for plural, -es for feminine plural.",
    [
      ["fill", "Elle est ___ (partir)", null, "partie", "Feminine subject → add -e to parti."],
      ["fill", "Ils sont ___ (aller)", null, "allés", "Masculine plural subject → add -s."],
      ["choice", "Nous sommes ___ (arriver)", ["arrivé", "arrivés", "arrivées"], "arrivés", "Nous is masculine or mixed → -s."],
      ["fill", "Marie et Anne sont ___ (venir)", null, "venues", "Two feminine subjects → -ues.", "Feminine plural."],
      ["fill", "Il est ___ (naître)", null, "né", "naître has the irregular participle né."]
    ]),

  K("a2.imparfait.formation", "A2", "verbs",
    "Imparfait: formation", "L'imparfait", 1.4, 2.4, ["a0.er.present"],
    "Take the nous form of the present, drop -ons, add: -ais, -ais, -ait, -ions, -iez, -aient.",
    [["je jouais", "I used to play"], ["nous finissions", "we were finishing"], ["ils avaient", "they had"]],
    "The endings are the same for every verb; only être is irregular (ét-).",
    [
      ["fill", "Quand j'étais petit, je ___ (jouer) souvent.", null, "jouais", "je + imparfait ending -ais."],
      ["fill", "Nous ___ (finir) à huit heures.", null, "finissions", "nous form finissons → finiss- + ions."],
      ["choice", "Il ___ (faire) beau.", ["faisait", "ferait", "fit"], "faisait", "faire: nous faisons → fais- + ait."],
      ["fill", "Vous ___ (aller) à l'école.", null, "alliez", "aller: nous allons → all- + iez."],
      ["fill", "Elles ___ (avoir) peur.", null, "avaient", "avoir: av- + aient."]
    ]),

  K("a2.imparfait_vs_pc", "A2", "verbs",
    "Imparfait vs passé composé", "Imparfait ou passé composé ?", 1.5, 3.2, ["a2.imparfait.formation", "a2.passe_compose.avoir"],
    "Passé composé = a completed event. Imparfait = a habit, a description, or background action.",
    [["Hier, je suis allé au cinéma.", "Yesterday I went to the cinema."], ["Quand j'étais enfant, j'allais souvent.", "When I was a child, I often went."]],
    "English 'I went' can be either. Ask: is it a single finished event, or an ongoing habit/background?",
    [
      ["choice", "Hier, je ___ au cinéma.", ["allais", "suis allé", "vais"], "suis allé", "Hier marks a single completed event → passé composé."],
      ["choice", "Quand j'étais enfant, je ___ souvent.", ["suis allé", "allais", "vais"], "allais", "A repeated habit in the past → imparfait."],
      ["fill", "Il ___ (lire) quand je suis entré.", null, "lisait", "Background action interrupted by a completed event → imparfait."],
      ["fill", "Soudain, elle ___ (tomber).", null, "est tombée", "Soudain marks a single event → passé composé with être."],
      ["choice", "Avant, nous ___ à la plage chaque été.", ["sommes allés", "allions", "allons"], "allions", "Chaque été = repeated habit → imparfait."],
      ["choice", "Pendant que je ___, le téléphone a sonné.", ["dormais", "ai dormi", "dors"], "dormais", "Pendant que sets the background scene → imparfait."],
      ["choice", "L'année dernière, nous ___ Paris.", ["avons visité", "visitions", "visitons"], "avons visité", "L'année dernière + one trip → passé composé."],
      ["fill", "Quand elle était petite, elle ___ (avoir) un chat.", null, "avait", "A description of the past → imparfait."],
      ["fill", "Il ___ (pleuvoir) quand nous sommes sortis.", null, "pleuvait", "Weather as the background → imparfait."],
      ["choice", "Tout à coup, il ___.", ["a compris", "comprenait", "comprend"], "a compris", "Tout à coup marks a sudden completed event → passé composé."],
      ["fill", "Chaque matin, il ___ (boire) un café.", null, "buvait", "Chaque matin = repeated habit → imparfait."],
      ["choice", "Hier soir, elle ___ son travail à dix heures.", ["a fini", "finissait", "finit"], "a fini", "Hier soir + a specific time = one completed event → passé composé."]
    ]),

  K("a2.pronouns.cod", "A2", "pronouns",
    "Direct object pronouns: le, la, les", "Les pronoms compléments directs", 1.4, 2.6, ["a0.articles.definite"],
    "Replace a direct object with le (m.), la (f.), les (pl.). The pronoun goes before the verb.",
    [["Tu vois Marie ? — Je la vois.", "Do you see Marie? — I see her."], ["Tu aimes les films ? — Je les aime.", "Do you like films? — I like them."]],
    "English puts the pronoun after the verb ('I see her'). French puts it before: je la vois.",
    [
      ["choice", "Tu vois Marie ? — Oui, je ___ vois.", ["la", "le", "les"], "la", "Marie is feminine singular → la."],
      ["choice", "Tu aimes les films ? — Oui, je ___ aime.", ["le", "la", "les"], "les", "les films is plural → les."],
      ["fill", "Il connaît Paul ? — Oui, il ___ connaît.", null, "le", "Paul is masculine singular → le."],
      ["fill", "Nous attendons les enfants. Nous ___ attendons.", null, "les", "les enfants is plural → les."],
      ["choice", "Elle regarde la télé ? — Oui, elle ___ regarde.", ["le", "la", "les"], "la", "la télé is feminine singular → la."]
    ]),

  K("a2.pronouns.y_en", "A2", "pronouns",
    "The pronouns y and en", "Les pronoms y et en", 1.5, 3.0, ["a2.pronouns.cod"],
    "y replaces à + place/thing. en replaces de + noun or a quantity.",
    [["Tu vas à Paris ? — J'y vais.", "Are you going to Paris? — I'm going there."], ["Tu veux du café ? — J'en veux.", "Do you want coffee? — I want some."]],
    "English uses 'there' and 'some'. French has dedicated pronouns that also go before the verb.",
    [
      ["choice", "Tu vas à Paris ? — Oui, j'___ vais.", ["y", "en", "le"], "y", "à Paris is replaced by y."],
      ["choice", "Tu veux du café ? — Oui, j'___ veux.", ["y", "en", "le"], "en", "du café (a quantity) is replaced by en."],
      ["fill", "Il pense à Marie ? — Oui, il ___ pense.", null, "y", "penser à + person is replaced by y in this pattern."],
      ["fill", "Elle a des amis ? — Oui, elle ___ a.", null, "en", "des amis (a quantity) → en."],
      ["choice", "Nous parlons de ce film. Nous ___ parlons.", ["y", "en", "le"], "en", "parler de + thing → en."]
    ]),

  /* ---------------- B1 ---------------- */
  K("b1.future.simple", "B1", "verbs",
    "Future simple", "Le futur simple", 1.4, 3.0, ["a0.er.present"],
    "Add the future endings to the infinitive: -ai, -as, -a, -ons, -ez, -ont. Many verbs have an irregular stem.",
    [["je parlerai", "I will speak"], ["nous finirons", "we will finish"], ["ils seront", "they will be"]],
    "English uses 'will + verb'. French attaches the ending to the infinitive, and common verbs change stem.",
    [
      ["fill", "Demain, je ___ (parler).", null, "parlerai", "Infinitive parler + ai."],
      ["fill", "Nous ___ (finir).", null, "finirons", "Infinitive finir + ons."],
      ["choice", "Ils ___ (être) là.", ["seront", "sont", "seraient"], "seront", "être has the irregular future stem ser-."],
      ["fill", "Tu ___ (avoir) le temps.", null, "auras", "avoir has the irregular future stem aur-."],
      ["fill", "Elle ___ (aller) à Lyon.", null, "ira", "aller: ir- + a."]
    ]),

  K("b1.conditional.present", "B1", "verbs",
    "Conditional present", "Le conditionnel présent", 1.4, 3.2, ["b1.future.simple"],
    "Future stem + imparfait endings: -ais, -ais, -ait, -ions, -iez, -aient.",
    [["je voyagerais", "I would travel"], ["nous pourrions", "we could"], ["ils seraient", "they would be"]],
    "English uses 'would + verb'. The French stem is the same as the future stem.",
    [
      ["fill", "Si j'avais de l'argent, je ___ (voyager).", null, "voyagerais", "Future stem voyager- + ais."],
      ["fill", "Nous ___ (pouvoir) venir.", null, "pourrions", "pouvoir has the stem pourr-."],
      ["choice", "Tu ___ (vouloir) un café ?", ["veux", "voudrais", "voudras"], "voudrais", "Polite request uses the conditional voudrais."],
      ["fill", "Ils ___ (être) contents.", null, "seraient", "être: ser- + aient."],
      ["fill", "Elle ___ (faire) ça.", null, "ferait", "faire: fer- + ait."]
    ]),

  K("b1.subjunctive.present", "B1", "verbs",
    "Present subjunctive", "Le subjonctif présent", 1.5, 3.8, ["a0.er.present"],
    "Used after expressions of necessity, will, doubt or emotion (il faut que, je veux que...). Regular endings: -e, -es, -e, -ions, -iez, -ent.",
    [["Il faut que tu sois là.", "You need to be there."], ["Je veux que tu viennes.", "I want you to come."]],
    "English uses the infinitive after 'I want you to...'. French needs que + a different verb form.",
    [
      ["fill", "Il faut que tu ___ (être) là.", null, "sois", "être is irregular in the subjunctive: sois."],
      ["fill", "Je veux que tu ___ (venir).", null, "viennes", "venir: vienn- + es."],
      ["choice", "Bien qu'il ___ malade, il travaille.", ["est", "soit", "sera"], "soit", "bien que always triggers the subjunctive: soit."],
      ["fill", "Il faut que nous ___ (faire) attention.", null, "fassions", "faire: fass- + ions."],
      ["fill", "Je doute qu'elle ___ (pouvoir).", null, "puisse", "pouvoir: puiss- + e."]
    ]),

  K("b1.relative.qui_que", "B1", "syntax",
    "Relative pronouns: qui and que", "Les pronoms relatifs qui et que", 1.3, 3.1, ["a1.questions.est_ce_que"],
    "qui is the subject of the relative clause; que is the direct object. que becomes qu' before a vowel.",
    [["L'homme qui parle est mon père.", "The man who is speaking is my father."], ["Le livre que je lis est bon.", "The book that I am reading is good."]],
    "English 'who/that' can be dropped. French que can never be omitted.",
    [
      ["choice", "Le livre ___ je lis est bon.", ["qui", "que", "dont"], "que", "je is the subject; the book is the object → que."],
      ["choice", "L'homme ___ parle est mon père.", ["qui", "que", "dont"], "qui", "The man is the subject of parle → qui."],
      ["fill", "La fille ___ je connais est là.", null, "que", "The girl is the object of connais → que."],
      ["fill", "C'est moi ___ ai fait ça.", null, "qui", "moi is the subject of ai fait → qui."],
      ["choice", "Le film ___ nous parlons est célèbre.", ["qui", "que", "dont"], "dont", "parler de → the relative pronoun is dont."]
    ]),

  K("b1.comparison", "B1", "adjectives",
    "Comparatives and superlatives", "Les comparatifs et superlatifs", 1.2, 2.8, ["a1.adjectives.agreement"],
    "plus / moins / aussi + adjective + que. Irregular: bon → meilleur, bien → mieux.",
    [["Elle est plus grande que moi.", "She is taller than me."], ["C'est le meilleur film.", "It's the best film."]],
    "English 'better' covers both meilleur (adjective) and mieux (adverb). French keeps them apart.",
    [
      ["fill", "Elle est plus grande ___ moi.", null, "que", "Comparison marker: plus ... que."],
      ["choice", "C'est le ___ film de l'année.", ["meilleur", "mieux", "plus bon"], "meilleur", "bon → meilleur when it modifies a noun."],
      ["fill", "Il travaille ___ que moi. (less)", null, "moins", "Less = moins."],
      ["fill", "Cette voiture est ___ chère que l'autre. (as ... as)", null, "aussi", "Equality: aussi ... que."],
      ["choice", "Je vais ___ aujourd'hui.", ["meilleur", "mieux", "plus bien"], "mieux", "bien → mieux when it modifies a verb."]
    ]),

  K("b1.pronoun_order", "B1", "pronouns",
    "Order of object pronouns", "L'ordre des pronoms", 1.4, 3.6, ["a2.pronouns.cod", "a2.pronouns.y_en"],
    "Order: me/te/se/nous/vous → le/la/les → lui/leur → y → en. Only one pronoun per column.",
    [["Il me le donne.", "He gives it to me."], ["Je le lui ai donné.", "I gave it to him."]],
    "English says 'give it to me'. French stacks the pronouns in a fixed order before the verb.",
    [
      ["choice", "Il ___ donne. (to me + it)", ["me le", "le me", "moi le"], "me le", "me comes before le."],
      ["fill", "Elle ___ envoie. (to me + it, feminine)", null, "me la", "me before la."],
      ["choice", "Je ___ ai donné. (to him + it)", ["lui le", "le lui", "le lui ai"], "le lui", "le comes before lui."],
      ["fill", "Nous ___ y emmenons. (them + there)", null, "les", "les comes before y."],
      ["choice", "Il ___ en parle. (to me)", ["me", "moi", "le"], "me", "me comes before en."]
    ]),

  /* ---------------- A0 additions ---------------- */
  K("a0.nouns.gender", "A0", "articles",
    "Noun gender: useful patterns", "Le genre des noms", 1.2, 1.9, ["a0.articles.definite"],
    "Endings help: -tion, -té, -ure are usually feminine; -ment, -eau, -isme are usually masculine.",
    [["la nation", "the nation"], ["la liberté", "freedom"], ["le moment", "the moment"], ["le tourisme", "tourism"]],
    "English has no gender, so always learn a noun together with its article.",
    [
      ["choice", "___ nation", ["le", "la", "les"], "la", "-tion is almost always feminine."],
      ["choice", "___ moment", ["le", "la", "les"], "le", "-ment is usually masculine."],
      ["fill", "___ liberté (feminine)", null, "la", "-té is usually feminine."],
      ["choice", "___ tourisme", ["le", "la", "les"], "le", "-isme is masculine."],
      ["fill", "___ voiture (feminine)", null, "la", "-ure is usually feminine."]
    ]),

  K("a0.nouns.plural", "A0", "articles",
    "Plural nouns", "Le pluriel des noms", 1.1, 1.7, ["a0.nouns.gender"],
    "Add -s in most cases. Nouns ending in -s, -x, -z do not change; -al becomes -aux; -eau becomes -eaux.",
    [["des livres", "books"], ["des prix", "prices"], ["des journaux", "newspapers"], ["des bateaux", "boats"]],
    "The plural -s is usually silent; listen for the article des/les instead.",
    [
      ["fill", "un livre → des ___", null, "livres", "Most nouns add -s."],
      ["choice", "un journal → des ___", ["journals", "journaux", "journales"], "journaux", "-al becomes -aux."],
      ["fill", "un prix → des ___", null, "prix", "Nouns ending in -x do not change."],
      ["choice", "un bateau → des ___", ["bateaus", "bateaux", "bateau"], "bateaux", "-eau adds -x."],
      ["fill", "une maison → des ___", null, "maisons", "Regular noun: add -s."]
    ]),

  K("a0.verbs.aller", "A0", "verbs",
    "aller in the present", "Le verbe aller au présent", 1.3, 1.8, ["a0.pronouns.subject"],
    "aller is irregular: je vais, tu vas, il/elle va, nous allons, vous allez, ils/elles vont.",
    [["Je vais à l'école.", "I go to school."], ["Nous allons au cinéma.", "We are going to the cinema."]],
    "Do not confuse aller (to go) with avoir (to have): je vais vs j'ai.",
    [
      ["fill", "Je ___ à l'école.", null, "vais", "je + aller = vais."],
      ["fill", "Tu ___ bien ?", null, "vas", "tu + aller = vas."],
      ["fill", "Nous ___ au cinéma.", null, "allons", "nous + aller = allons."],
      ["choice", "Ils ___ en France.", ["vont", "von", "allent"], "vont", "ils + aller = vont."],
      ["fill", "Vous ___ à Paris ?", null, "allez", "vous + aller = allez."]
    ]),

  K("a0.adjectives.position", "A0", "adjectives",
    "Adjective position", "La place de l'adjectif", 1.2, 2.0, [],
    "Most adjectives go after the noun. A short list (beau, joli, grand, petit, jeune, vieux, bon, mauvais) goes before.",
    [["une voiture rouge", "a red car"], ["une petite maison", "a small house"], ["un bon restaurant", "a good restaurant"]],
    "Position can change meaning: un ancien professeur = a former teacher, un professeur ancien = an old teacher.",
    [
      ["choice", "a red car", ["une rouge voiture", "une voiture rouge"], "une voiture rouge", "Colours go after the noun."],
      ["choice", "a small house", ["une petite maison", "une maison petite"], "une petite maison", "petit belongs to the short before-noun group."],
      ["fill", "un ___ restaurant (good)", null, "bon", "bon goes before the noun."],
      ["choice", "a young man", ["un jeune homme", "un homme jeune"], "un jeune homme", "jeune goes before the noun."],
      ["fill", "une histoire ___ (interesting)", null, "intéressante", "Long adjectives go after the noun and agree."]
    ]),

  K("a0.expressions.il_y_a", "A0", "expressions",
    "il y a: there is / there are", "Il y a", 1.3, 1.6, [],
    "il y a means both there is and there are. Negative: il n'y a pas. Question: est-ce qu'il y a...?",
    [["Il y a un chat.", "There is a cat."], ["Il n'y a pas de problème.", "There is no problem."]],
    "English changes is/are; French keeps il y a for singular and plural.",
    [
      ["fill", "___ un chat dans la pièce.", null, "Il y a", "There is = il y a."],
      ["choice", "___ deux livres sur la table.", ["Il y a", "Il est", "Ils ont"], "Il y a", "Plural still uses il y a."],
      ["fill", "Il n'y a pas ___ problème.", null, "de", "After a negation, un/une/des become de."],
      ["choice", "___ une banque près d'ici ?", ["Est-ce qu'il y a", "Il y a", "Est-il"], "Est-ce qu'il y a", "Yes/no question with est-ce que."],
      ["fill", "Il y ___ des fleurs.", null, "a", "The form is fixed: il y a."]
    ]),

  K("a0.syntax.cest_vs_il_est", "A0", "syntax",
    "c'est vs il est", "C'est ou il est ?", 1.2, 2.1, ["a0.etre.present"],
    "c'est + noun or name. il/elle est + profession or adjective, with no article.",
    [["C'est un médecin.", "He is a doctor. (noun)"], ["Il est médecin.", "He is a doctor. (profession)"], ["C'est Marie.", "It's Marie."]],
    "English says 'he is a doctor'; French drops the article after il est: il est médecin.",
    [
      ["choice", "___ un étudiant.", ["C'est", "Il est", "Il a"], "C'est", "c'est before a noun with an article."],
      ["choice", "___ médecin.", ["C'est", "Il est", "Il a"], "Il est", "Profession after il est takes no article."],
      ["fill", "___ Marie.", null, "C'est", "Names take c'est."],
      ["choice", "___ très gentil.", ["C'est", "Il est", "Il a"], "Il est", "Adjective describing a person: il est."],
      ["fill", "Elle ___ professeur.", null, "est", "elle + être = est."]
    ]),

  /* ---------------- A1 additions ---------------- */
  K("a1.articles.partitive", "A1", "articles",
    "Partitive articles: du, de la, des", "Les articles partitifs", 1.4, 2.2, ["a0.articles.indefinite"],
    "Use du / de la / de l' / des for an unspecified quantity. After a negation they become de.",
    [["Je bois du café.", "I drink coffee."], ["Elle mange de la soupe.", "She eats soup."], ["Je ne bois pas de café.", "I don't drink coffee."]],
    "English often uses no article ('I drink coffee'); French needs a partitive.",
    [
      ["fill", "Je bois ___ café.", null, "du", "Masculine noun: du café."],
      ["fill", "Elle mange ___ soupe.", null, "de la", "Feminine noun: de la soupe."],
      ["choice", "Il achète ___ pain.", ["du", "de", "le"], "du", "Unspecified quantity: du pain."],
      ["fill", "Nous ne buvons pas ___ vin.", null, "de", "Negation turns du into de."],
      ["choice", "Tu veux ___ eau ?", ["de l'", "du", "de la"], "de l'", "Vowel: de l'eau."]
    ]),

  K("a1.adjectives.demonstrative", "A1", "adjectives",
    "Demonstrative adjectives", "Les adjectifs démonstratifs", 1.3, 2.0, ["a0.articles.definite"],
    "ce + masculine, cet + masculine before a vowel, cette + feminine, ces + plural.",
    [["ce livre", "this book"], ["cet homme", "this man"], ["cette femme", "this woman"], ["ces enfants", "these children"]],
    "cet exists only to avoid two vowels colliding: cet homme, cet arbre.",
    [
      ["choice", "___ livre", ["ce", "cet", "cette", "ces"], "ce", "livre is masculine singular."],
      ["choice", "___ homme", ["ce", "cet", "cette", "ces"], "cet", "Masculine noun starting with a vowel: cet."],
      ["choice", "___ femme", ["ce", "cet", "cette", "ces"], "cette", "femme is feminine singular."],
      ["fill", "___ enfants sont ici.", null, "Ces", "Plural: ces."],
      ["fill", "___ école est grande.", null, "Cette", "Feminine noun starting with a vowel: cette."]
    ]),

  K("a1.verbs.futur_proche", "A1", "verbs",
    "Futur proche: aller + infinitive", "Le futur proche", 1.3, 1.9, ["a0.verbs.aller"],
    "aller in the present + infinitive = to be going to do something.",
    [["Je vais partir.", "I am going to leave."], ["Nous allons manger.", "We are going to eat."]],
    "English 'will' can be near or distant future; near future uses aller + infinitive.",
    [
      ["fill", "Je ___ partir.", null, "vais", "je + aller = vais."],
      ["fill", "Nous allons ___ (manger).", null, "manger", "After aller, use the infinitive."],
      ["choice", "Ils ___ arriver.", ["vont", "vont à", "va"], "vont", "ils + aller = vont."],
      ["fill", "Tu vas ___ (travailler).", null, "travailler", "Infinitive after vas."],
      ["choice", "Elle ___ téléphoner.", ["va", "vas", "vont"], "va", "elle + aller = va."]
    ]),

  K("a1.verbs.reflexive", "A1", "verbs",
    "Reflexive verbs in the present", "Les verbes pronominaux", 1.4, 2.4, ["a0.pronouns.subject"],
    "Add me, te, se, nous, vous, se before the verb: je me lève, tu te lèves, il se lève.",
    [["Je me lève à sept heures.", "I get up at seven."], ["Elle se couche tard.", "She goes to bed late."]],
    "English often drops the reflexive idea ('I get up'); French always keeps the pronoun.",
    [
      ["fill", "Je ___ lève à sept heures.", null, "me", "je → me."],
      ["fill", "Tu ___ couches tard.", null, "te", "tu → te."],
      ["choice", "Elle ___ habille.", ["se", "s'", "me"], "s'", "Vowel: se elides to s'."],
      ["fill", "Nous ___ levons tôt.", null, "nous", "nous → nous."],
      ["choice", "Ils ___ amusent.", ["se", "s'", "nous"], "s'", "Vowel: se elides to s'."]
    ]),

  K("a1.verbs.imperative", "A1", "verbs",
    "The imperative", "L'impératif", 1.2, 2.3, ["a0.er.present"],
    "Drop the subject. For -er verbs, the tu form loses its -s: parle ! finis ! attendez !",
    [["Parle plus lentement !", "Speak more slowly!"], ["Finissons !", "Let's finish!"], ["Écoutez !", "Listen!"]],
    "The tu form of -er verbs has no -s in the imperative, unlike the present tense.",
    [
      ["choice", "___ plus lentement ! (parler, tu)", ["Parles", "Parle", "Parlez"], "Parle", "-er verb: drop the -s."],
      ["fill", "___ tes devoirs ! (finir, tu)", null, "Finis", "-ir verbs keep the -s."],
      ["fill", "___ ici ! (attendre, vous)", null, "Attendez", "vous form: -ez."],
      ["choice", "___ attention ! (faire, vous)", ["Faites", "Fais", "Fait"], "Faites", "faire is irregular: faites."],
      ["fill", "___ la porte ! (fermer, nous)", null, "Fermons", "nous form: -ons."]
    ]),

  K("a1.prepositions.place", "A1", "prepositions",
    "Prepositions of place", "Les prépositions de lieu", 1.2, 2.1, ["a0.articles.definite"],
    "sur (on), sous (under), dans (in), devant (in front of), derrière (behind), entre (between), à côté de (next to).",
    [["Le livre est sur la table.", "The book is on the table."], ["Le chat est sous le lit.", "The cat is under the bed."]],
    "English 'in' can be dans (inside) or à (at a place); they are not interchangeable.",
    [
      ["fill", "Le livre est ___ la table. (on)", null, "sur", "on = sur."],
      ["fill", "Le chat est ___ le lit. (under)", null, "sous", "under = sous."],
      ["choice", "Les clés sont ___ le sac. (in)", ["dans", "sur", "à"], "dans", "inside = dans."],
      ["fill", "Il est ___ la porte. (behind)", null, "derrière", "behind = derrière."],
      ["choice", "La banque est ___ de la poste. (next to)", ["à côté", "devant", "entre"], "à côté", "next to = à côté de."]
    ]),

  /* ---------------- A2 additions ---------------- */
  K("a2.pronouns.coi", "A2", "pronouns",
    "Indirect object pronouns: lui, leur", "Les pronoms compléments indirects", 1.4, 2.7, ["a2.pronouns.cod"],
    "Replace à + person with lui (singular) or leur (plural). The pronoun goes before the verb.",
    [["Je parle à Marie. → Je lui parle.", "I speak to Marie. → I speak to her."], ["Il téléphone aux enfants. → Il leur téléphone.", "He calls the children. → He calls them."]],
    "lui/leur are mostly for people; things after à often take y instead.",
    [
      ["choice", "Je parle à Marie. → Je ___ parle.", ["lui", "leur", "la"], "lui", "à + singular person → lui."],
      ["choice", "Il téléphone aux enfants. → Il ___ téléphone.", ["lui", "leur", "les"], "leur", "à + plural person → leur."],
      ["fill", "Elle écrit à son père. → Elle ___ écrit.", null, "lui", "Singular person → lui."],
      ["fill", "Nous parlons aux voisins. → Nous ___ parlons.", null, "leur", "Plural person → leur."],
      ["choice", "Tu réponds au professeur ? → Tu ___ réponds ?", ["lui", "leur", "le"], "lui", "répondre à + singular → lui."]
    ]),

  K("a2.syntax.relative_ou", "A2", "syntax",
    "Relative pronoun où", "Le pronom relatif où", 1.2, 2.8, [],
    "où replaces a place or a time: la ville où je vis, le jour où il est parti.",
    [["La maison où j'habite est petite.", "The house where I live is small."], ["C'est le moment où il arrive.", "This is the moment when he arrives."]],
    "English 'where/when' can be omitted; French où cannot.",
    [
      ["choice", "La ville ___ je vis est grande.", ["où", "que", "qui"], "où", "Place → où."],
      ["choice", "Le jour ___ nous sommes partis.", ["où", "que", "qui"], "où", "Time → où."],
      ["fill", "La maison ___ il habite est vieille.", null, "où", "Place → où."],
      ["fill", "C'est l'heure ___ le train part.", null, "où", "Time → où."],
      ["choice", "Le pays ___ elle vient.", ["d'où", "où", "que"], "d'où", "Origin: venir de → d'où."]
    ]),

  K("a2.syntax.time_markers", "A2", "syntax",
    "depuis, pendant, il y a", "Les marqueurs de temps", 1.3, 3.0, ["a2.imparfait_vs_pc"],
    "depuis = since/for (still true). pendant = during/for (finished). il y a = ago.",
    [["J'habite ici depuis 2020.", "I have lived here since 2020."], ["J'ai vécu à Lyon pendant deux ans.", "I lived in Lyon for two years."], ["Il est parti il y a une heure.", "He left an hour ago."]],
    "English 'for' is ambiguous; French picks the word by whether the action still continues.",
    [
      ["fill", "J'apprends le français ___ deux ans.", null, "depuis", "Still learning → depuis."],
      ["fill", "J'ai travaillé ___ six mois.", null, "pendant", "Finished period → pendant."],
      ["fill", "Elle est arrivée ___ dix minutes.", null, "il y a", "Ago → il y a."],
      ["choice", "Nous habitons ici ___ 2019.", ["depuis", "pendant", "il y a"], "depuis", "Still living there → depuis."],
      ["choice", "Il a plu ___ trois jours.", ["depuis", "pendant", "il y a"], "pendant", "Finished period → pendant."]
    ]),

  K("a2.adjectives.superlative", "A2", "adjectives",
    "Superlative", "Le superlatif", 1.3, 2.6, ["a1.adjectives.agreement"],
    "le/la/les plus + adjective, or le/la/les moins + adjective. The group is introduced by de.",
    [["C'est le plus grand restaurant de la ville.", "It is the biggest restaurant in town."], ["C'est la moins chère.", "It is the least expensive one."]],
    "The article agrees with the noun, not with a default masculine form.",
    [
      ["fill", "C'est ___ plus grand restaurant de la ville.", null, "le", "restaurant is masculine singular → le."],
      ["fill", "C'est la ___ chère voiture. (least)", null, "moins", "least = le/la/les moins."],
      ["choice", "C'est ___ meilleur film.", ["le", "la", "les"], "le", "film is masculine singular → le."],
      ["fill", "Ce sont les ___ intéressants. (most)", null, "plus", "most = le/la/les plus."],
      ["choice", "C'est la plus belle ville ___ France.", ["de", "en", "à"], "de", "The group takes de."]
    ]),

  K("a2.adjectives.adverbs_ment", "A2", "adjectives",
    "Adverbs in -ment", "Les adverbes en -ment", 1.2, 2.5, ["a1.adjectives.agreement"],
    "Add -ment to the feminine form: lent → lente → lentement. Adjectives in -ant/-ent give -amment/-emment.",
    [["lentement", "slowly"], ["rapidement", "quickly"], ["patiemment", "patiently"]],
    "English adds -ly to the adjective; French builds from the feminine stem.",
    [
      ["fill", "lent (feminine lente) → ___", null, "lentement", "Feminine stem + ment."],
      ["fill", "rapide (feminine rapide) → ___", null, "rapidement", "rapide ends in -e: add -ment."],
      ["choice", "heureux → ___", ["heureusement", "heureuxment", "heureusment"], "heureusement", "heureux → heureuse + ment."],
      ["fill", "sérieux → ___", null, "sérieusement", "sérieuse + ment."],
      ["choice", "patient → ___", ["patiemment", "patientment", "patiencement"], "patiemment", "-ent becomes -emment."]
    ]),

  K("a2.prepositions.geography", "A2", "prepositions",
    "Prepositions with countries", "Les prépositions avec les pays", 1.3, 2.4, ["a1.aller.prepositions"],
    "en + feminine country, au + masculine, aux + plural, à + city. From: de / du / des.",
    [["en France", "to France"], ["au Canada", "to Canada"], ["aux États-Unis", "to the United States"], ["à Paris", "to Paris"]],
    "Country gender is invisible on the map; learn it with its article.",
    [
      ["fill", "Je vais ___ France.", null, "en", "France is feminine → en."],
      ["fill", "Il va ___ Canada.", null, "au", "Canada is masculine → au."],
      ["fill", "Nous allons ___ États-Unis.", null, "aux", "Plural country → aux."],
      ["choice", "Elle habite ___ Japon.", ["au", "en", "aux"], "au", "Japon is masculine → au."],
      ["fill", "Ils viennent ___ Italie.", null, "d'", "de + feminine country → d' before a vowel."]
    ]),

  /* ---------------- B1 additions ---------------- */
  K("b1.verbs.plus_que_parfait", "B1", "verbs",
    "Plus-que-parfait", "Le plus-que-parfait", 1.4, 3.3, ["a2.passe_compose.avoir", "a2.imparfait.formation"],
    "avoir or être in the imparfait + past participle = had done.",
    [["J'avais mangé.", "I had eaten."], ["Elle était partie.", "She had left."]],
    "The auxiliary still follows the avoir/être rule, and être verbs still agree.",
    [
      ["fill", "J'___ mangé avant ton arrivée.", null, "avais", "avoir in the imparfait: avais."],
      ["fill", "Elle ___ partie.", null, "était", "être in the imparfait: était."],
      ["choice", "Nous ___ fini.", ["avions", "étions", "avons"], "avions", "finir uses avoir → avions."],
      ["fill", "Ils ___ arrivés avant midi.", null, "étaient", "arriver uses être → étaient."],
      ["fill", "Tu avais ___ (voir) le film.", null, "vu", "voir has the participle vu."]
    ]),

  K("b1.verbs.passive", "B1", "verbs",
    "Passive voice", "La voix passive", 1.4, 3.4, ["a2.passe_compose.etre"],
    "être + past participle + par. The participle agrees with the subject.",
    [["Le livre est écrit par Marie.", "The book is written by Marie."], ["Les fenêtres sont fermées.", "The windows are closed."]],
    "English 'by' is usually par; with feelings or states French may use de.",
    [
      ["choice", "Le livre est ___ par Marie.", ["écrit", "écrite", "écrits"], "écrit", "livre is masculine singular."],
      ["fill", "Les fenêtres sont ___ (fermer).", null, "fermées", "Feminine plural → -ées."],
      ["fill", "La maison a été ___ (construire) en 1900.", null, "construite", "Feminine singular → -e."],
      ["choice", "Ce tableau est admiré ___ tout le monde.", ["par", "de", "à"], "par", "Agent → par."],
      ["fill", "Le problème sera ___ (résoudre).", null, "résolu", "résoudre has the participle résolu."]
    ]),

  K("b1.syntax.relative_dont", "B1", "syntax",
    "Relative pronoun dont", "Le pronom relatif dont", 1.4, 3.5, ["b1.relative.qui_que"],
    "dont replaces de + noun: le livre dont je parle (parler de).",
    [["Le film dont je parle est célèbre.", "The film I am talking about is famous."], ["L'homme dont je connais la fille.", "The man whose daughter I know."]],
    "English has 'of which / whose'; French uses one word, dont, and it cannot be dropped.",
    [
      ["choice", "Le film ___ je parle est célèbre.", ["dont", "que", "qui"], "dont", "parler de → dont."],
      ["choice", "L'homme ___ la fille est médecin.", ["dont", "que", "qui"], "dont", "Possession: dont."],
      ["fill", "C'est le livre ___ j'ai besoin.", null, "dont", "avoir besoin de → dont."],
      ["fill", "La personne ___ je me souviens.", null, "dont", "se souvenir de → dont."],
      ["choice", "Voici l'outil ___ il se sert.", ["dont", "que", "qui"], "dont", "se servir de → dont."]
    ]),

  K("b1.syntax.si_clauses", "B1", "syntax",
    "si clauses", "Les phrases avec si", 1.5, 3.7, ["b1.conditional.present", "b1.future.simple"],
    "si + present → future. si + imparfait → conditional. Never put a conditional right after si.",
    [["Si tu viens, nous mangerons.", "If you come, we will eat."], ["Si j'avais le temps, je voyagerais.", "If I had time, I would travel."]],
    "English allows 'if I would'; French never uses a conditional after si.",
    [
      ["fill", "Si tu ___ (venir), nous mangerons.", null, "viens", "si + present → future."],
      ["fill", "Si j'avais le temps, je ___ (voyager).", null, "voyagerais", "si + imparfait → conditional present."],
      ["choice", "Si elle ___ riche, elle partirait.", ["était", "serait", "est"], "était", "Never a conditional after si."],
      ["fill", "Nous sortirons s'il ___ (faire) beau.", null, "fait", "si + present → future."],
      ["choice", "S'il ___, nous serions restés.", ["avait plu", "aurait plu", "pleuvait"], "avait plu", "Past hypothesis: si + plus-que-parfait → conditional past."],
      ["fill", "Si nous ___ (avoir) le temps, nous visiterions le musée.", null, "avions", "Unreal now: si + imparfait → conditional present."],
      ["fill", "S'il ___ (pleuvoir), nous resterons à la maison.", null, "pleut", "Real condition: si + present → future."],
      ["choice", "Si tu ___ plus tôt, tu aurais vu Marie.", ["étais arrivé", "arrivais", "arriveras"], "étais arrivé", "Unreal past: si + plus-que-parfait → conditional past."],
      ["fill", "Si elle ___ (savoir), elle serait venue.", null, "avait su", "si + plus-que-parfait → conditional past."],
      ["choice", "Which is correct?", ["Si j'étais riche, je voyagerais.", "Si je serais riche, je voyagerais.", "Si j'étais riche, je voyagerai."], "Si j'étais riche, je voyagerais.", "si + imparfait pairs with the conditional, never with a future."],
      ["fill", "Si vous ___ (vouloir), nous pouvons commencer.", null, "voulez", "Real condition: si + present can lead to a present result."],
      ["choice", "Si j'avais su, je ___.", ["serais venu", "viendrais", "venais"], "serais venu", "si + plus-que-parfait → conditional past."]
    ]),

  K("b1.verbs.gerondif", "B1", "verbs",
    "Gerund: en + -ant", "Le gérondif", 1.3, 3.2, ["a2.imparfait.formation"],
    "en + present participle expresses simultaneity or manner: en marchant, en lisant.",
    [["Il apprend en écoutant.", "He learns by listening."], ["Elle a réussi en travaillant.", "She succeeded by working."]],
    "The gerund's subject must be the same as the main clause's subject.",
    [
      ["fill", "Il apprend ___ écoutant.", null, "en", "Gerund = en + -ant."],
      ["fill", "Elle a réussi ___ travaillant.", null, "en", "Same pattern."],
      ["choice", "___ lisant, il a trouvé la réponse.", ["En", "Au", "À"], "En", "en + present participle."],
      ["fill", "Nous discutons ___ (manger).", null, "en mangeant", "manger → mangeant."],
      ["choice", "___ arrivant, elle a appelé.", ["En", "À", "De"], "En", "Simultaneous action → en."]
    ]),

  K("b1.expressions.connectors", "B1", "expressions",
    "Discourse connectors", "Les connecteurs logiques", 1.2, 3.0, ["b1.relative.qui_que"],
    "cependant (however), donc (so), pourtant (yet), en effet (indeed), par ailleurs (moreover).",
    [["Il pleut ; cependant, nous sortons.", "It is raining; however, we are going out."], ["Je pense, donc je suis.", "I think, therefore I am."]],
    "English 'so' has several translations; donc marks a logical consequence.",
    [
      ["choice", "Il pleut, ___ nous restons.", ["donc", "pourtant", "cependant"], "donc", "Consequence → donc."],
      ["choice", "Il est jeune ; ___ , il est très expérimenté.", ["cependant", "donc", "en effet"], "cependant", "Contrast → cependant."],
      ["fill", "Je pense, ___ je suis.", null, "donc", "Logical consequence."],
      ["choice", "Il a échoué, ___ il avait travaillé.", ["pourtant", "donc", "par ailleurs"], "pourtant", "Unexpected contrast → pourtant."],
      ["fill", "___ , le prix a augmenté. (moreover)", null, "Par ailleurs", "Adding a point → par ailleurs."]
    ]),

  /* ---------------- A0 round 2 ---------------- */
  K("a0.verbs.faire", "A0", "verbs",
    "faire in the present", "Le verbe faire au présent", 1.3, 1.8, ["a0.pronouns.subject"],
    "faire is irregular: je fais, tu fais, il/elle fait, nous faisons, vous faites, ils/elles font.",
    [["Je fais mes devoirs.", "I do my homework."], ["Il fait beau.", "The weather is nice."], ["Vous faites la cuisine.", "You are cooking."]],
    "vous faites, not 'vous faisez'. The vous form is the odd one out.",
    [
      ["fill", "Je ___ mes devoirs.", null, "fais", "je + faire = fais."],
      ["fill", "Il ___ beau aujourd'hui.", null, "fait", "il + faire = fait."],
      ["fill", "Nous ___ du sport.", null, "faisons", "nous + faire = faisons."],
      ["choice", "Vous ___ la cuisine.", ["faites", "faisez", "font"], "faites", "vous + faire = faites."],
      ["fill", "Ils ___ attention.", null, "font", "ils + faire = font."]
    ]),

  K("a0.verbs.venir", "A0", "verbs",
    "venir in the present", "Le verbe venir au présent", 1.2, 2.0, ["a0.pronouns.subject"],
    "venir is irregular: je viens, tu viens, il vient, nous venons, vous venez, ils viennent.",
    [["Je viens de Paris.", "I come from Paris."], ["Ils viennent demain.", "They are coming tomorrow."]],
    "The stem alternates: vien- in the singular, ven- in nous/vous, vienn- in ils/elles.",
    [
      ["fill", "Je ___ de Paris.", null, "viens", "je + venir = viens."],
      ["fill", "Il ___ demain.", null, "vient", "il + venir = vient."],
      ["fill", "Nous ___ de Lyon.", null, "venons", "nous + venir = venons."],
      ["choice", "Ils ___ ce soir.", ["viennent", "venent", "vienent"], "viennent", "ils + venir = viennent."],
      ["fill", "Vous ___ avec nous ?", null, "venez", "vous + venir = venez."]
    ]),

  K("a0.adjectives.colors", "A0", "adjectives",
    "Colour adjectives", "Les adjectifs de couleur", 1.1, 1.9, [],
    "Colours agree with the noun: add -e for feminine, -s for plural. rose, orange, marron stay invariable.",
    [["une voiture rouge", "a red car"], ["des fleurs blanches", "white flowers"], ["des chaussures orange", "orange shoes"]],
    "Colours taken from nouns (orange, marron, rose) usually do not agree.",
    [
      ["fill", "une fleur ___ (blanc)", null, "blanche", "blanc → blanche (feminine)."],
      ["choice", "des livres ___ (noir)", ["noir", "noirs", "noires"], "noirs", "Masculine plural → -s."],
      ["fill", "une robe ___ (vert)", null, "verte", "Feminine singular → -e."],
      ["choice", "des chaussures ___ (orange)", ["orange", "oranges", "orangées"], "orange", "orange is a colour here, so it stays invariable: des chaussures orange. (The fruit is variable — des oranges — but shoes aren't fruit!)"],
      ["fill", "des yeux ___ (bleu)", null, "bleus", "Masculine plural → -s."]
    ]),

  K("a0.expressions.time", "A0", "expressions",
    "Telling the time", "L'heure", 1.3, 2.0, ["a0.expressions.il_y_a"],
    "il est + number + heure(s). 12:00 = midi, 00:00 = minuit. Add et quart, et demie, moins le quart.",
    [["Il est trois heures.", "It is three o'clock."], ["Il est midi.", "It is noon."], ["Il est huit heures et demie.", "It is half past eight."]],
    "English 'o'clock' is never translated; heure(s) is required.",
    [
      ["fill", "Il est trois ___ .", null, "heures", "trois heures = three o'clock."],
      ["choice", "Il est ___ (12:00 noon).", ["midi", "douze", "minuit"], "midi", "Noon is midi."],
      ["fill", "Il est huit heures et ___ (8:30).", null, "demie", "Half past = et demie."],
      ["choice", "Il est neuf heures ___ (9:15).", ["et quart", "et demie", "moins le quart"], "et quart", "Quarter past = et quart."],
      ["fill", "Il est ___ (midnight).", null, "minuit", "Midnight is minuit."]
    ]),

  K("a0.expressions.weather", "A0", "expressions",
    "Weather with il fait", "La météo", 1.2, 1.8, ["a0.verbs.faire"],
    "il fait + adjective: beau, mauvais, chaud, froid. Rain and snow use il pleut / il neige.",
    [["Il fait beau.", "The weather is nice."], ["Il fait froid.", "It is cold."], ["Il pleut.", "It is raining."]],
    "English says 'it is hot'; French says il fait chaud, never il est chaud.",
    [
      ["fill", "Il ___ beau.", null, "fait", "Weather uses il fait + adjective."],
      ["fill", "Il fait ___ en hiver. (cold)", null, "froid", "cold = froid."],
      ["choice", "It is raining.", ["Il pleut.", "Il fait pluie.", "Il est pluie."], "Il pleut.", "Rain has its own verb: pleuvoir."],
      ["fill", "Il ___ chaud en été.", null, "fait", "il fait chaud = it is hot."],
      ["choice", "It is snowing.", ["Il neige.", "Il fait neige.", "Il est neige."], "Il neige.", "Snow has its own verb: neiger."]
    ]),

  K("a0.syntax.questions_intonation", "A0", "syntax",
    "Yes/no questions by intonation", "La question par intonation", 1.1, 1.7, ["a0.pronouns.subject"],
    "Any statement can become a question with a rising tone and a question mark: Tu parles français ?",
    [["Tu parles français ?", "Do you speak French?"], ["Vous êtes prêt ?", "Are you ready?"], ["C'est vrai ?", "Is that true?"]],
    "Spoken French often uses intonation instead of inversion; only the question mark changes in writing.",
    [
      ["choice", "Which is an informal question?", ["Tu parles français ?", "Tu parles français.", "Parles-tu français ?"], "Tu parles français ?", "Statement + question mark."],
      ["fill", "___ êtes prêt ? (formal you)", null, "Vous", "Keep the statement order."],
      ["choice", "C'est vrai ___", ["?", "!", "."], "?", "A question needs a question mark."],
      ["fill", "Tu ___ français ? (parler)", null, "parles", "tu + parler = parles."],
      ["choice", "Which is the most formal?", ["Parles-tu français ?", "Tu parles français ?", "Tu parles français."], "Parles-tu français ?", "Inversion is formal."]
    ]),

  /* ---------------- A1 round 2 ---------------- */
  K("a1.pronouns.stress", "A1", "pronouns",
    "Stress pronouns", "Les pronoms toniques", 1.2, 2.2, ["a0.pronouns.subject"],
    "moi, toi, lui, elle, nous, vous, eux, elles. Used after prepositions and for emphasis.",
    [["avec moi", "with me"], ["chez lui", "at his place"], ["C'est pour elle.", "It is for her."]],
    "English uses object pronouns after prepositions; French uses the stressed form.",
    [
      ["choice", "Tu viens avec ___ ?", ["moi", "me", "je"], "moi", "After a preposition: moi."],
      ["choice", "C'est pour ___ . (her)", ["elle", "la", "lui"], "elle", "After pour: elle."],
      ["fill", "Ils habitent chez ___ . (them, masculine)", null, "eux", "chez + stressed pronoun: eux."],
      ["fill", "Je pense à ___ . (you, informal)", null, "toi", "penser à + toi."],
      ["choice", "Nous partons sans ___ . (him)", ["lui", "le", "il"], "lui", "sans + lui."]
    ]),

  K("a1.verbs.modals", "A1", "verbs",
    "pouvoir, vouloir, devoir", "Les verbes modaux", 1.4, 2.2, ["a0.er.present"],
    "pouvoir (can), vouloir (want), devoir (must) + infinitive. Present: je peux, je veux, je dois.",
    [["Je peux venir.", "I can come."], ["Tu veux manger ?", "Do you want to eat?"], ["Nous devons partir.", "We must leave."]],
    "English modals never change form; French modals conjugate with every subject.",
    [
      ["fill", "Je ___ venir. (pouvoir)", null, "peux", "je + pouvoir = peux."],
      ["fill", "Tu ___ manger ? (vouloir)", null, "veux", "tu + vouloir = veux."],
      ["fill", "Nous ___ partir. (devoir)", null, "devons", "nous + devoir = devons."],
      ["choice", "Ils ___ venir.", ["peuvent", "peuvent pas", "pouvent"], "peuvent", "ils + pouvoir = peuvent."],
      ["fill", "Vous ___ attendre. (devoir)", null, "devez", "vous + devoir = devez."]
    ]),

  K("a1.adjectives.comparative", "A1", "adjectives",
    "Comparatives", "Le comparatif", 1.3, 2.3, ["a1.adjectives.agreement"],
    "plus / moins / aussi + adjective + que. bon becomes meilleur; bien becomes mieux.",
    [["Elle est plus grande que moi.", "She is taller than me."], ["Il est moins rapide que toi.", "He is less fast than you."]],
    "English 'better' covers meilleur (adjective) and mieux (adverb); French separates them.",
    [
      ["fill", "Elle est plus grande ___ moi.", null, "que", "Comparison marker: que."],
      ["fill", "Il est ___ rapide que toi. (less)", null, "moins", "less = moins."],
      ["choice", "Ce livre est ___ intéressant que l'autre. (as)", ["aussi", "plus", "moins"], "aussi", "Equality: aussi ... que."],
      ["fill", "C'est un ___ film. (better)", null, "meilleur", "bon → meilleur before a noun."],
      ["choice", "Elle travaille ___ que lui. (better, adverb)", ["mieux", "meilleur", "plus bon"], "mieux", "bien → mieux as an adverb."]
    ]),

  K("a1.syntax.negation_rien_jamais", "A1", "syntax",
    "ne... rien / ne... jamais", "La négation avec rien et jamais", 1.3, 2.4, ["a1.negation.ne_pas"],
    "rien replaces 'nothing/anything'; jamais replaces 'never/ever'. They replace pas, not add to it.",
    [["Je ne vois rien.", "I see nothing."], ["Il ne vient jamais.", "He never comes."]],
    "Do not add pas: 'je ne vois pas rien' is wrong in standard French.",
    [
      ["fill", "Je ne vois ___ . (nothing)", null, "rien", "rien = nothing."],
      ["fill", "Il ne vient ___ . (never)", null, "jamais", "jamais = never."],
      ["choice", "Which is correct?", ["Je ne vois rien.", "Je ne vois pas rien.", "Je vois rien."], "Je ne vois rien.", "rien replaces pas."],
      ["fill", "Elle n'a ___ dit. (nothing)", null, "rien", "ne ... rien."],
      ["choice", "Tu es déjà allé à Paris ? — Non, ___ .", ["jamais", "rien", "pas"], "jamais", "never = jamais."]
    ]),

  K("a1.expressions.quantity", "A1", "expressions",
    "Quantity expressions", "Les expressions de quantité", 1.2, 2.2, ["a1.articles.partitive"],
    "beaucoup de, un peu de, assez de, trop de + noun, with no article after de.",
    [["beaucoup de monde", "a lot of people"], ["un peu de sucre", "a little sugar"], ["trop de bruit", "too much noise"]],
    "English keeps 'of the'; French drops the article after a quantity expression.",
    [
      ["fill", "Il y a beaucoup ___ monde.", null, "de", "beaucoup de + noun."],
      ["fill", "Je veux un peu ___ sucre.", null, "de", "un peu de + noun."],
      ["choice", "Il y a trop ___ bruit.", ["de", "du", "le"], "de", "trop de + noun."],
      ["fill", "Nous avons assez ___ temps.", null, "de", "assez de + noun."],
      ["choice", "Beaucoup ___ étudiants travaillent.", ["d'", "de", "des"], "d'", "de elides before a vowel."]
    ]),

  K("a1.prepositions.time", "A1", "prepositions",
    "Time prepositions", "Les prépositions de temps", 1.2, 2.3, ["a1.aller.prepositions"],
    "à + clock time, le + day, en + month/year/season, dans + time from now.",
    [["à huit heures", "at eight o'clock"], ["le lundi", "on Mondays"], ["en juillet", "in July"], ["dans deux jours", "in two days"]],
    "English 'in' covers en, dans and à; French picks by the type of time.",
    [
      ["fill", "Le film commence ___ huit heures.", null, "à", "Clock time takes à."],
      ["fill", "Nous partons ___ juillet.", null, "en", "Months take en."],
      ["choice", "Je travaille ___ lundi.", ["le", "en", "à"], "le", "Days take le."],
      ["fill", "Il revient ___ deux jours.", null, "dans", "Future duration takes dans."],
      ["choice", "Elle est née ___ 1990.", ["en", "dans", "à"], "en", "Years take en."]
    ]),

  /* ---------------- A2 round 2 ---------------- */
  K("a2.verbs.pronominaux_passe", "A2", "verbs",
    "Reflexive verbs in passé composé", "Les verbes pronominaux au passé composé", 1.4, 2.9, ["a1.verbs.reflexive", "a2.passe_compose.etre"],
    "Reflexive verbs use être in the passé composé, and the participle agrees with the subject.",
    [["Je me suis levé.", "I got up."], ["Elle s'est couchée tard.", "She went to bed late."]],
    "The reflexive pronoun stays before the auxiliary: je me suis levé, not je suis me levé.",
    [
      ["fill", "Je ___ suis levé.", null, "me", "Reflexive pronoun before the auxiliary."],
      ["fill", "Elle s'est ___ (coucher).", null, "couchée", "Feminine subject → -e."],
      ["choice", "Nous ___ sommes amusés.", ["nous", "se", "s'"], "nous", "nous → nous."],
      ["fill", "Ils se sont ___ (habiller).", null, "habillés", "Masculine plural → -s."],
      ["choice", "Elle s'est ___ . (lever)", ["levée", "levé", "levés"], "levée", "Feminine singular → -e."]
    ]),

  K("a2.verbs.imparfait_usage", "A2", "verbs",
    "Imparfait: habits and descriptions", "L'imparfait : habitudes et descriptions", 1.4, 2.8, ["a2.imparfait.formation"],
    "The imparfait describes habits, states and background scenes; the passé composé reports a single event.",
    [["Quand j'étais enfant, je jouais dehors.", "When I was a child, I played outside."], ["Il faisait beau.", "The weather was nice."]],
    "One finished event uses the passé composé, even if it happened long ago.",
    [
      ["choice", "Quand j'étais enfant, je ___ souvent.", ["jouais", "ai joué", "joue"], "jouais", "Repeated habit → imparfait."],
      ["fill", "Il ___ beau ce jour-là. (faire)", null, "faisait", "Background description → imparfait."],
      ["choice", "Avant, elle ___ à Lyon.", ["habitait", "a habité", "habite"], "habitait", "Past state → imparfait."],
      ["fill", "Nous ___ (avoir) peur du noir.", null, "avions", "State in the past → imparfait."],
      ["choice", "Hier, il ___ un livre. (completed)", ["a lu", "lisait", "lit"], "a lu", "Single completed event → passé composé."]
    ]),

  K("a2.pronouns.possessive", "A2", "pronouns",
    "Possessive pronouns", "Les pronoms possessifs", 1.3, 2.8, ["a1.possessives"],
    "le mien, la mienne, les miens/miennes; le tien, le sien, le nôtre, le vôtre, le leur.",
    [["Ce livre est le mien.", "This book is mine."], ["Ma voiture est plus vieille que la tienne.", "My car is older than yours."]],
    "The article agrees with the thing possessed, not with the owner.",
    [
      ["choice", "Ce livre est ___ . (mine)", ["le mien", "mon", "moi"], "le mien", "Masculine singular possessed thing."],
      ["choice", "Ma voiture est plus vieille que ___ . (yours, f.)", ["la tienne", "le tien", "ton"], "la tienne", "Feminine singular → la tienne."],
      ["fill", "Ces clés sont ___ . (his)", null, "les siennes", "Feminine plural → les siennes."],
      ["fill", "Notre maison est plus grande que ___ . (theirs)", null, "la leur", "Feminine singular → la leur."],
      ["choice", "Ton stylo ? J'ai pris ___ . (mine)", ["le mien", "le tien", "la mienne"], "le mien", "stylo is masculine → le mien."]
    ]),

  K("a2.pronouns.demonstrative", "A2", "pronouns",
    "Demonstrative pronouns", "Les pronoms démonstratifs", 1.3, 2.9, ["a1.adjectives.demonstrative"],
    "celui, celle, ceux, celles + -ci/-là or de/qui/que. They replace a noun already mentioned.",
    [["Je préfère celui-ci.", "I prefer this one."], ["Ceux qui travaillent réussissent.", "Those who work succeed."]],
    "English 'the one(s)' has four forms in French, chosen by gender and number.",
    [
      ["choice", "Je préfère ___ . (this one, m.)", ["celui-ci", "celle-ci", "ceci"], "celui-ci", "Masculine singular → celui-ci."],
      ["choice", "___ qui travaillent réussissent.", ["Ceux", "Celles", "Celui"], "Ceux", "Masculine plural subject → ceux."],
      ["fill", "La robe ? Je prends ___ . (that one, f.)", null, "celle-là", "Feminine singular → celle-là."],
      ["fill", "Les livres ? ___ de Marie sont meilleurs.", null, "ceux", "Masculine plural → ceux."],
      ["choice", "___ que je connais sont sympas. (the girls)", ["Celles", "Ceux", "Celle"], "Celles", "Feminine plural → celles."]
    ]),

  K("a2.syntax.cause_consequence", "A2", "syntax",
    "Cause and consequence", "La cause et la conséquence", 1.2, 2.7, [],
    "parce que (because), comme (as/since), donc (so), c'est pourquoi (that's why).",
    [["Je reste parce qu'il pleut.", "I am staying because it is raining."], ["Il pleut, donc je reste.", "It is raining, so I am staying."]],
    "comme introduces the cause at the start of a sentence; parce que usually follows the main clause.",
    [
      ["fill", "Je reste ___ qu'il pleut.", null, "parce", "parce que = because."],
      ["choice", "___ il pleut, je reste.", ["Comme", "Parce que", "Donc"], "Comme", "Cause at the start → comme."],
      ["fill", "Il pleut, ___ je reste.", null, "donc", "Consequence → donc."],
      ["choice", "Il est malade, ___ il ne vient pas.", ["c'est pourquoi", "parce que", "comme"], "c'est pourquoi", "Consequence phrase."],
      ["fill", "Elle est absente ___ elle est malade.", null, "parce qu'", "parce que elides before a vowel."]
    ]),

  K("a2.expressions.avoir", "A2", "expressions",
    "Expressions with avoir", "Les expressions avec avoir", 1.2, 2.3, ["a0.avoir.present"],
    "avoir faim, soif, sommeil, peur, besoin de, envie de. French uses avoir where English uses 'to be'.",
    [["J'ai faim.", "I am hungry."], ["Elle a peur.", "She is afraid."], ["Nous avons besoin d'aide.", "We need help."]],
    "English 'I am hungry' is literally 'I have hunger' in French: j'ai faim.",
    [
      ["fill", "J'___ faim.", null, "ai", "avoir faim = to be hungry."],
      ["fill", "Elle a ___ du noir. (fear)", null, "peur", "avoir peur de = to be afraid of."],
      ["choice", "I am thirsty.", ["J'ai soif.", "Je suis soif.", "J'ai soifé."], "J'ai soif.", "avoir soif."],
      ["fill", "Nous avons ___ d'aide. (need)", null, "besoin", "avoir besoin de."],
      ["choice", "They are sleepy.", ["Ils ont sommeil.", "Ils sont sommeil.", "Ils ont dormi."], "Ils ont sommeil.", "avoir sommeil."]
    ]),

  /* ---------------- B1 round 2 ---------------- */
  K("b1.verbs.subjunctive_conj", "B1", "verbs",
    "Subjunctive after conjunctions", "Le subjonctif après les conjonctions", 1.4, 3.8, ["b1.subjunctive.present"],
    "bien que, pour que, avant que, à condition que always take the subjunctive.",
    [["Bien qu'il soit jeune, il est compétent.", "Although he is young, he is competent."], ["Je le fais pour que tu comprennes.", "I do it so that you understand."]],
    "These conjunctions trigger the subjunctive even when the fact is certain.",
    [
      ["fill", "Bien qu'il ___ (être) jeune, il est compétent.", null, "soit", "bien que + subjunctive."],
      ["fill", "Je le fais pour que tu ___ (comprendre).", null, "comprennes", "pour que + subjunctive."],
      ["choice", "Avant que tu ___ , appelle-moi.", ["partes", "pars", "partiras"], "partes", "avant que + subjunctive."],
      ["fill", "À condition qu'il ___ (venir).", null, "vienne", "à condition que + subjunctive."],
      ["choice", "Bien qu'elle ___ malade, elle travaille.", ["soit", "est", "sera"], "soit", "bien que + subjunctive."]
    ]),

  K("b1.verbs.conditional_past", "B1", "verbs",
    "Conditional past", "Le conditionnel passé", 1.4, 3.6, ["b1.conditional.present", "a2.passe_compose.avoir"],
    "avoir/être in the conditional + past participle = would have done.",
    [["J'aurais mangé.", "I would have eaten."], ["Elle serait partie.", "She would have left."]],
    "English 'would have' maps directly, but the auxiliary still follows the avoir/être rule.",
    [
      ["fill", "J'___ mangé.", null, "aurais", "avoir in the conditional: aurais."],
      ["fill", "Elle ___ partie.", null, "serait", "être in the conditional: serait."],
      ["choice", "Nous ___ fini.", ["aurions", "serions", "avons"], "aurions", "finir uses avoir → aurions."],
      ["fill", "Ils ___ arrivés plus tôt.", null, "seraient", "arriver uses être → seraient."],
      ["fill", "Tu aurais ___ (voir) le film.", null, "vu", "voir → vu."]
    ]),

  K("b1.syntax.inversion", "B1", "syntax",
    "Formal inversion questions", "L'inversion formelle", 1.4, 3.3, ["a1.questions.est_ce_que"],
    "Verb + hyphen + subject pronoun: Parles-tu français ? Que faites-vous ?",
    [["Parles-tu français ?", "Do you speak French?"], ["Où vas-tu ?", "Where are you going?"], ["Que faites-vous ?", "What are you doing?"]],
    "Inversion is formal or literary; speech prefers est-ce que or intonation.",
    [
      ["fill", "___ -tu français ? (parler)", null, "Parles", "parler, tu → parles."],
      ["choice", "Où ___ -tu ?", ["vas", "vais", "va"], "vas", "aller, tu → vas."],
      ["fill", "Que ___ -vous ? (faire)", null, "faites", "faire, vous → faites."],
      ["choice", "___ -il venir ?", ["Vient", "Viendra", "Va"], "Vient", "venir, il → vient."],
      ["fill", "Comment ___ -elle ? (s'appeler)", null, "s'appelle", "Pronominal inversion keeps the reflexive pronoun."]
    ]),

  K("b1.syntax.emphasis", "B1", "syntax",
    "Emphasis: c'est... qui / que", "La mise en relief", 1.3, 3.4, ["b1.relative.qui_que"],
    "c'est + element + qui (subject) or que (object). Used to spotlight information.",
    [["C'est Marie qui a appelé.", "It was Marie who called."], ["C'est ce livre que je veux.", "It is this book that I want."]],
    "English stresses with intonation; French uses a fixed c'est... qui/que frame.",
    [
      ["choice", "C'est Marie ___ a appelé.", ["qui", "que", "dont"], "qui", "Marie is the subject → qui."],
      ["choice", "C'est ce livre ___ je veux.", ["que", "qui", "dont"], "que", "The book is the object → que."],
      ["fill", "C'est ___ qui décide. (me)", null, "moi", "Stressed pronoun after c'est."],
      ["fill", "C'est demain ___ nous partons.", null, "que", "Time element → que."],
      ["choice", "C'est lui ___ l'a fait.", ["qui", "que", "dont"], "qui", "lui is the subject → qui."]
    ]),

  K("b1.pronouns.relative_compose", "B1", "pronouns",
    "ce qui / ce que", "Ce qui, ce que", 1.3, 3.5, ["b1.relative.qui_que"],
    "ce qui is the subject of the clause; ce que is the object. Both refer to an idea or thing.",
    [["Ce qui m'intéresse, c'est la musique.", "What interests me is music."], ["Je ne comprends pas ce que tu dis.", "I don't understand what you are saying."]],
    "English 'what' has two French forms; choose by its role in the clause.",
    [
      ["choice", "___ m'intéresse, c'est la musique.", ["Ce qui", "Ce que", "Ce dont"], "Ce qui", "Subject → ce qui."],
      ["choice", "Je ne comprends pas ___ tu dis.", ["ce que", "ce qui", "ce dont"], "ce que", "Object → ce que."],
      ["fill", "Dis-moi ___ tu veux.", null, "ce que", "Object → ce que."],
      ["fill", "___ est arrivé est étrange.", null, "Ce qui", "Subject → ce qui."],
      ["choice", "C'est exactement ___ j'ai besoin.", ["ce dont", "ce que", "ce qui"], "ce dont", "avoir besoin de → ce dont."]
    ]),

  K("b1.expressions.formal", "B1", "expressions",
    "Formal register", "Le registre formel", 1.2, 3.1, ["a1.verbs.imperative"],
    "Formal writing uses nous instead of on, full negation, and fixed formulas: veuillez, je vous prie de.",
    [["Veuillez patienter.", "Please wait."], ["Je vous prie de m'excuser.", "I beg your pardon."], ["Cordialement,", "Yours sincerely,"]],
    "English business tone does not transfer literally; French has its own formulas.",
    [
      ["choice", "Formal way to say 'please wait'.", ["Veuillez patienter.", "Attends.", "Tu patientes."], "Veuillez patienter.", "veuillez + infinitive is formal."],
      ["fill", "Je vous prie de m'___ . (excuse)", null, "excuser", "prier de + infinitive."],
      ["choice", "Formal closing.", ["Cordialement,", "Salut,", "À plus,"], "Cordialement,", "Cordialement is neutral-formal."],
      ["fill", "Nous sommes dans l'attente de votre ___ . (reply)", null, "réponse", "Fixed business phrase."],
      ["choice", "Formal 'we' in a letter.", ["Nous", "On", "Vous"], "Nous", "Avoid on in formal writing."]
    ]),

  /* ---------------- A0 round 3 ---------------- */
  K("a0.verbs.prendre", "A0", "verbs",
    "prendre in the present", "Le verbe prendre au présent", 1.3, 1.9, ["a0.pronouns.subject"],
    "prendre is irregular: je prends, tu prends, il prend, nous prenons, vous prenez, ils prennent.",
    [["Je prends le bus.", "I take the bus."], ["Nous prenons un café.", "We are having a coffee."]],
    "The plural drops the -d: ils prennent, not 'ils prendent'.",
    [
      ["fill", "Je ___ le bus.", null, "prends", "je + prendre = prends."],
      ["fill", "Il ___ un café.", null, "prend", "il + prendre = prend."],
      ["fill", "Nous ___ le train.", null, "prenons", "nous + prendre = prenons."],
      ["choice", "Ils ___ le métro.", ["prennent", "prendent", "prend"], "prennent", "ils + prendre = prennent."],
      ["fill", "Vous ___ des photos ?", null, "prenez", "vous + prendre = prenez."]
    ]),

  K("a0.nouns.days_months", "A0", "articles",
    "Days and months", "Les jours et les mois", 1.1, 1.6, [],
    "Days: lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche. Months: janvier to décembre. All lowercase.",
    [["lundi", "Monday"], ["janvier", "January"], ["le 5 mai", "the 5th of May"]],
    "Days and months are lowercase in French, unlike English.",
    [
      ["choice", "The first working day of the week.", ["lundi", "dimanche", "samedi"], "lundi", "Monday is lundi."],
      ["fill", "The month after mars is ___ .", null, "avril", "March → April = avril."],
      ["choice", "Which is correctly written?", ["le 5 mai", "le 5 Mai", "Le 5 mai"], "le 5 mai", "Months are lowercase."],
      ["fill", "The day after mercredi is ___ .", null, "jeudi", "Wednesday → Thursday = jeudi."],
      ["choice", "December in French.", ["décembre", "decembre", "Décembre"], "décembre", "Lowercase and accent."]
    ]),

  K("a0.expressions.greetings", "A0", "expressions",
    "Greetings and politeness", "Les salutations", 1.2, 1.4, [],
    "Bonjour (day), bonsoir (evening), salut (informal), merci, s'il vous plaît, excusez-moi.",
    [["Bonjour, comment allez-vous ?", "Hello, how are you?"], ["Merci beaucoup.", "Thank you very much."]],
    "Bonjour is used until early evening; switch to bonsoir after that.",
    [
      ["choice", "You enter a shop at 10 a.m.", ["Bonjour", "Bonsoir", "Bonne nuit"], "Bonjour", "Daytime greeting."],
      ["choice", "You enter at 8 p.m.", ["Bonsoir", "Bonjour", "Salut"], "Bonsoir", "Evening greeting."],
      ["fill", "Merci ___ . (very much)", null, "beaucoup", "merci beaucoup."],
      ["choice", "Polite 'excuse me' to a stranger.", ["Excusez-moi", "Excuse-moi", "Salut"], "Excusez-moi", "vous form is polite."],
      ["fill", "S'il vous ___ , où est la gare ?", null, "plaît", "s'il vous plaît."]
    ]),

  K("a0.nouns.numbers", "A0", "articles",
    "Numbers 1–20", "Les nombres de 1 à 20", 1.2, 1.6, [],
    "un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix, onze, douze, treize, quatorze, quinze, seize, dix-sept, dix-huit, dix-neuf, vingt.",
    [["sept", "seven"], ["quinze", "fifteen"], ["dix-huit", "eighteen"]],
    "17–19 are compound with a hyphen: dix-sept, dix-huit, dix-neuf.",
    [
      ["fill", "7 = ___", null, "sept", "seven = sept."],
      ["fill", "15 = ___", null, "quinze", "fifteen = quinze."],
      ["choice", "18 =", ["dix-huit", "dix-huitte", "dixhuite"], "dix-huit", "Compound with a hyphen."],
      ["fill", "20 = ___", null, "vingt", "twenty = vingt."],
      ["choice", "12 =", ["douze", "deuze", "douze-dix"], "douze", "twelve = douze."]
    ]),

  /* ---------------- A1 round 3 ---------------- */
  K("a1.verbs.irregular_ir", "A1", "verbs",
    "partir, dormir, sortir", "Les verbes partir, dormir, sortir", 1.4, 2.2, ["a0.er.present"],
    "These -ir verbs drop the final consonant in the singular: je pars, tu dors, il sort; nous partons, vous dormez, ils sortent.",
    [["Je pars demain.", "I am leaving tomorrow."], ["Il dort.", "He is sleeping."], ["Nous sortons ce soir.", "We are going out tonight."]],
    "The singular forms are short; the plural forms keep the full stem.",
    [
      ["fill", "Je ___ demain. (partir)", null, "pars", "je + partir = pars."],
      ["fill", "Il ___ huit heures. (dormir)", null, "dort", "il + dormir = dort."],
      ["fill", "Nous ___ ce soir. (sortir)", null, "sortons", "nous + sortir = sortons."],
      ["choice", "Ils ___ à huit heures.", ["sortent", "sortont", "sortent pas"], "sortent", "ils + sortir = sortent."],
      ["fill", "Vous ___ tôt. (partir)", null, "partez", "vous + partir = partez."]
    ]),

  K("a1.verbs.stem_changing", "A1", "verbs",
    "Stem-changing -er verbs", "Les verbes en -er à changement de radical", 1.4, 2.3, ["a0.er.present"],
    "acheter → j'achète; préférer → je préfère; appeler → j'appelle. The stem changes in je/tu/il/ils, not nous/vous.",
    [["J'achète du pain.", "I am buying bread."], ["Nous achetons du pain.", "We are buying bread."]],
    "The stem change does not apply to nous and vous: nous achetons, vous préférez.",
    [
      ["fill", "J'___ du pain. (acheter)", null, "achète", "acheter → achète."],
      ["fill", "Nous ___ du pain. (acheter)", null, "achetons", "nous keeps the original stem."],
      ["fill", "Je ___ le café. (préférer)", null, "préfère", "préférer → préfère."],
      ["choice", "Ils ___ souvent. (appeler)", ["appellent", "apelent", "appèlent"], "appellent", "appeler doubles the l."],
      ["fill", "Vous ___ tôt. (préférer)", null, "préférez", "vous keeps the é."]
    ]),

  K("a1.pronouns.indefinite", "A1", "pronouns",
    "quelqu'un, quelque chose, personne, rien", "Les pronoms indéfinis", 1.3, 2.4, ["a1.negation.ne_pas"],
    "quelqu'un (someone), quelque chose (something), personne (nobody), rien (nothing). personne and rien are negative.",
    [["Quelqu'un a appelé.", "Someone called."], ["Je ne vois rien.", "I see nothing."]],
    "personne and rien already carry the negative meaning; just add ne before the verb.",
    [
      ["choice", "___ a appelé.", ["Quelqu'un", "Personne", "Rien"], "Quelqu'un", "Positive sentence → quelqu'un."],
      ["fill", "Je ne vois ___ . (nothing)", null, "rien", "ne ... rien."],
      ["choice", "There is nobody.", ["Il n'y a personne.", "Il n'y a rien.", "Il y a personne."], "Il n'y a personne.", "ne + personne."],
      ["fill", "Tu veux ___ à boire ? (something)", null, "quelque chose", "quelque chose = something."],
      ["choice", "Nobody came.", ["Personne n'est venu.", "Rien n'est venu.", "Quelqu'un n'est venu."], "Personne n'est venu.", "personne as subject + ne."]
    ]),

  K("a1.syntax.connectors_basic", "A1", "syntax",
    "Basic connectors", "Les connecteurs de base", 1.2, 2.0, ["a0.er.present"],
    "et (and), mais (but), ou (or), donc (so), parce que (because).",
    [["Je bois du café et je lis.", "I drink coffee and I read."], ["Il est tard, donc je pars.", "It is late, so I am leaving."]],
    "ou without an accent means 'or'; où with an accent means 'where'.",
    [
      ["fill", "Je bois du café ___ je lis.", null, "et", "and = et."],
      ["choice", "Il est tard, ___ je pars.", ["donc", "mais", "ou"], "donc", "so = donc."],
      ["fill", "Tu veux du thé ___ du café ? (or)", null, "ou", "or = ou."],
      ["choice", "Je reste ___ il pleut.", ["parce qu'", "mais", "donc"], "parce qu'", "because = parce que, elided."],
      ["fill", "J'aime le thé, ___ je préfère le café. (but)", null, "mais", "but = mais."]
    ]),

  K("a1.expressions.food", "A1", "expressions",
    "At the restaurant", "Au restaurant", 1.2, 2.1, ["a1.articles.partitive"],
    "le menu (set meal), la carte (menu list), l'addition (bill), un plat (dish), une boisson (drink), commander, réserver.",
    [["Je voudrais le menu, s'il vous plaît.", "I would like the set menu, please."], ["L'addition, s'il vous plaît.", "The bill, please."]],
    "In France 'le menu' is the set meal; 'la carte' is the full list of dishes.",
    [
      ["choice", "The bill in a restaurant.", ["l'addition", "le menu", "la carte"], "l'addition", "bill = addition."],
      ["fill", "Je voudrais ___ le menu. (to order)", null, "commander", "to order = commander."],
      ["choice", "A set meal.", ["le menu", "la carte", "l'addition"], "le menu", "set meal = le menu."],
      ["fill", "Une ___ , s'il vous plaît. (drink)", null, "boisson", "drink = boisson."],
      ["choice", "Polite way to order.", ["Je voudrais...", "Je veux...", "J'aime..."], "Je voudrais...", "Conditional is polite."]
    ]),

  K("a1.adjectives.position_meaning", "A1", "adjectives",
    "Position changes meaning", "La place change le sens", 1.3, 2.5, ["a0.adjectives.position"],
    "ancien (former/old), cher (dear/expensive), propre (own/clean) change meaning with position.",
    [["un ancien professeur", "a former teacher"], ["un professeur ancien", "an old teacher"]],
    "English uses different words; French uses the same adjective in two positions.",
    [
      ["choice", "un ancien professeur =", ["a former teacher", "an old teacher", "a young teacher"], "a former teacher", "Before the noun = former."],
      ["choice", "un professeur ancien =", ["an old teacher", "a former teacher", "a strict teacher"], "an old teacher", "After the noun = old."],
      ["fill", "mon ___ bureau (my own)", null, "propre", "propre before the noun = own."],
      ["choice", "un bureau propre =", ["a clean desk", "my own desk", "a big desk"], "a clean desk", "After the noun = clean."],
      ["choice", "un cher ami =", ["a dear friend", "an expensive friend", "a close shop"], "a dear friend", "Before the noun = dear."]
    ]),

  /* ---------------- A2 round 3 ---------------- */
  K("a2.verbs.accord_participe", "A2", "verbs",
    "Past participle agreement with avoir", "L'accord du participe passé avec avoir", 1.5, 3.0, ["a2.passe_compose.avoir"],
    "With avoir, the participle agrees with a direct object placed before it: les fleurs que j'ai achetées.",
    [["La lettre que j'ai écrite.", "The letter that I wrote."], ["Les livres que j'ai lus.", "The books that I read."]],
    "No agreement when the object follows: j'ai acheté les fleurs.",
    [
      ["choice", "La lettre que j'ai ___ .", ["écrite", "écrit", "écrites"], "écrite", "letter is feminine singular before the verb."],
      ["choice", "Les livres que j'ai ___ .", ["lus", "lu", "lues"], "lus", "books is masculine plural."],
      ["fill", "Les fleurs que j'ai ___ (acheter).", null, "achetées", "feminine plural → -ées."],
      ["choice", "J'ai ___ les fleurs.", ["acheté", "achetées", "achetés"], "acheté", "Object follows → no agreement."],
      ["fill", "La voiture que nous avons ___ (vendre).", null, "vendue", "feminine singular → -e."]
    ]),

  K("a2.syntax.discours_indirect", "A2", "syntax",
    "Reported speech: present and past", "Le discours indirect", 1.4, 3.0, ["a2.passe_compose.avoir"],
    "Il dit qu'il est malade (present stays). Il a dit qu'il était malade (present → imparfait).",
    [["Elle dit qu'elle vient.", "She says she is coming."], ["Elle a dit qu'elle venait.", "She said she was coming."]],
    "After a past reporting verb, the present becomes imparfait.",
    [
      ["choice", "Il dit : « Je suis prêt. » → Il dit qu'il ___ prêt.", ["est", "était", "sera"], "est", "Reporting verb in the present → no shift."],
      ["choice", "Il a dit : « Je suis prêt. » → Il a dit qu'il ___ prêt.", ["était", "est", "sera"], "était", "Past reporting verb → imparfait."],
      ["fill", "Elle a dit qu'elle ___ (venir) demain.", null, "viendrait", "Future → conditional."],
      ["choice", "« Je pars. » → Il a dit qu'il ___ .", ["partait", "part", "partira"], "partait", "Present → imparfait."],
      ["fill", "Ils ont dit qu'ils ___ (avoir) faim.", null, "avaient", "Present → imparfait."]
    ]),

  K("a2.pronouns.indefinite", "A2", "pronouns",
    "chacun, plusieurs, la plupart", "Les indéfinis de quantité", 1.3, 2.9, ["a1.pronouns.indefinite"],
    "chacun/chacune (each), plusieurs (several), la plupart de (most of), quelques (a few).",
    [["Chacun a un livre.", "Each has a book."], ["La plupart des étudiants travaillent.", "Most students work."]],
    "la plupart de takes a plural noun and a plural verb.",
    [
      ["fill", "___ a un livre. (each)", null, "Chacun", "each = chacun."],
      ["choice", "___ des étudiants travaillent.", ["La plupart", "La plupart de", "Chacun"], "La plupart", "la plupart des = most of the."],
      ["fill", "J'ai ___ amis ici. (a few)", null, "quelques", "a few = quelques."],
      ["choice", "Plusieurs personnes ___ arrivées.", ["sont", "est", "a"], "sont", "plusieurs → plural verb."],
      ["fill", "___ des deux réponses est correcte. (each one, f.)", null, "Chacune", "feminine each = chacune."]
    ]),

  K("a2.prepositions.expressions", "A2", "prepositions",
    "à cause de, grâce à, malgré", "Les prépositions de cause et de concession", 1.3, 2.8, ["a1.prepositions.time"],
    "à cause de (because of, negative), grâce à (thanks to, positive), malgré (despite) + noun.",
    [["À cause de la pluie, je reste.", "Because of the rain, I am staying."], ["Grâce à toi, j'ai réussi.", "Thanks to you, I succeeded."]],
    "English 'because of' can be positive or negative; French distinguishes.",
    [
      ["choice", "___ la pluie, le match est annulé.", ["À cause de", "Grâce à", "Malgré"], "À cause de", "Negative cause."],
      ["choice", "___ ton aide, j'ai réussi.", ["Grâce à", "À cause de", "Malgré"], "Grâce à", "Positive cause."],
      ["fill", "___ la pluie, je sors. (despite)", null, "Malgré", "despite = malgré."],
      ["choice", "___ la neige, nous sommes arrivés.", ["Malgré", "Grâce à", "À cause de"], "Malgré", "Concession."],
      ["fill", "Le vol est retardé ___ cause du brouillard.", null, "à", "à cause de."]
    ]),

  K("a2.expressions.faux_amis", "A2", "expressions",
    "False friends", "Les faux amis", 1.3, 2.7, [],
    "actuellement = currently, éventuellement = possibly, attendre = to wait, assister à = to attend.",
    [["Il est actuellement en France.", "He is currently in France."], ["Je vais éventuellement venir.", "I may possibly come."]],
    "English 'actually' is en fait; 'eventually' is finalement.",
    [
      ["choice", "actuellement =", ["currently", "actually", "eventually"], "currently", "False friend."],
      ["choice", "éventuellement =", ["possibly", "eventually", "actually"], "possibly", "False friend."],
      ["fill", "J'attends ___ bus. (wait for the)", null, "le", "attendre + direct object."],
      ["choice", "assister à =", ["to attend", "to assist", "to help"], "to attend", "False friend."],
      ["choice", "Je suis ___ en retard. (actually)", ["en fait", "actuellement", "éventuellement"], "en fait", "actually = en fait."]
    ]),

  K("a2.syntax.interrogation_quel", "A2", "syntax",
    "quel and lequel", "Quel et lequel", 1.3, 2.9, ["a1.adjectives.demonstrative"],
    "quel/quelle/quels/quelles + noun; lequel/laquelle/lesquels/lesquelles as a pronoun.",
    [["Quel livre ?", "Which book?"], ["Lequel ?", "Which one?"]],
    "quel agrees with the noun; lequel replaces 'which one'.",
    [
      ["choice", "___ livre veux-tu ?", ["Quel", "Quelle", "Lequel"], "Quel", "livre is masculine singular."],
      ["choice", "___ heure est-il ?", ["Quelle", "Quel", "Lequel"], "Quelle", "heure is feminine."],
      ["fill", "___ est ta voiture ? (which one, f.)", null, "Laquelle", "pronoun, feminine singular."],
      ["choice", "___ films as-tu vus ?", ["Quels", "Quelles", "Lesquels"], "Quels", "films is masculine plural."],
      ["fill", "___ de ces livres préfères-tu ? (which one, m.)", null, "Lequel", "pronoun, masculine singular."]
    ]),

  /* ---------------- B1 round 3 ---------------- */
  K("b1.verbs.futur_anterieur", "B1", "verbs",
    "Futur antérieur", "Le futur antérieur", 1.4, 3.4, ["b1.future.simple", "a2.passe_compose.avoir"],
    "avoir/être in the future + past participle = will have done.",
    [["J'aurai fini avant midi.", "I will have finished before noon."], ["Elle sera partie.", "She will have left."]],
    "Used for a future action completed before another future action.",
    [
      ["fill", "J'___ fini avant midi.", null, "aurai", "avoir in the future: aurai."],
      ["fill", "Elle ___ partie.", null, "sera", "être in the future: sera."],
      ["choice", "Nous ___ terminé.", ["aurons", "serons", "avons"], "aurons", "terminer uses avoir → aurons."],
      ["fill", "Ils ___ arrivés avant nous.", null, "seront", "arriver uses être → seront."],
      ["fill", "Tu auras ___ (voir) le film.", null, "vu", "voir → vu."]
    ]),

  K("b1.syntax.concession", "B1", "syntax",
    "Concession", "L'expression de la concession", 1.4, 3.7, ["b1.subjunctive.present"],
    "bien que + subjunctive, quoique + subjunctive, même si + indicative.",
    [["Bien qu'il soit jeune, il est compétent.", "Although he is young, he is competent."], ["Même s'il est jeune, il est compétent.", "Even if he is young, he is competent."]],
    "même si takes the indicative, not the subjunctive.",
    [
      ["choice", "Bien qu'il ___ jeune...", ["soit", "est", "sera"], "soit", "bien que + subjunctive."],
      ["choice", "Même s'il ___ jeune...", ["est", "soit", "sera"], "est", "même si + indicative."],
      ["fill", "___ qu'il pleuve, nous sortons. (although)", null, "Bien", "bien que + subjunctive."],
      ["choice", "Quoiqu'elle ___ fatiguée...", ["soit", "est", "sera"], "soit", "quoique + subjunctive."],
      ["fill", "Même si tu ___ (vouloir), je pars.", null, "veux", "même si + indicative."]
    ]),

  K("b1.syntax.but", "B1", "syntax",
    "Purpose", "L'expression du but", 1.3, 3.5, ["b1.subjunctive.present"],
    "pour + infinitive (same subject); pour que / afin que + subjunctive (different subject).",
    [["Je travaille pour réussir.", "I work to succeed."], ["Je travaille pour que tu réussisses.", "I work so that you succeed."]],
    "English 'so that' has two forms depending on whether the subject changes.",
    [
      ["choice", "Je travaille ___ réussir.", ["pour", "pour que", "afin que"], "pour", "Same subject → infinitive."],
      ["choice", "Je travaille ___ tu réussisses.", ["pour que", "pour", "afin de"], "pour que", "Different subject → subjunctive."],
      ["fill", "Elle parle lentement ___ que nous comprenions.", null, "pour", "pour que + subjunctive."],
      ["choice", "Afin de ___ , il part tôt.", ["réussir", "réussisse", "réussit"], "réussir", "afin de + infinitive."],
      ["fill", "Je te le dis ___ que tu saches.", null, "pour", "pour que + subjunctive."]
    ]),

  K("b1.syntax.participle_present", "B1", "syntax",
    "Present participle", "Le participe présent", 1.3, 3.4, ["a2.imparfait.formation"],
    "The -ant form: parlant, finissant, ayant, étant. It is invariable.",
    [["Étant malade, il reste.", "Being ill, he stays."], ["Ayant fini, elle part.", "Having finished, she leaves."]],
    "The participle present is invariable; the gerund adds en.",
    [
      ["fill", "___ malade, il reste. (être)", null, "Étant", "être → étant."],
      ["fill", "___ fini, elle part. (avoir)", null, "Ayant", "avoir → ayant."],
      ["choice", "___ le film, il pleure.", ["Regardant", "Regarde", "Regardé"], "Regardant", "participle present."],
      ["fill", "Les étudiants ___ (travailler) dur réussissent.", null, "travaillant", "travailler → travaillant."],
      ["choice", "Which is a gerund?", ["en parlant", "parlant", "parlé"], "en parlant", "gerund = en + -ant."]
    ]),

  K("b1.pronouns.relatifs_composes", "B1", "pronouns",
    "lequel, auquel, duquel", "Les pronoms relatifs composés", 1.4, 3.6, ["b1.relative.qui_que"],
    "lequel/laquelle/lesquels/lesquelles; à + lequel = auquel; de + lequel = duquel.",
    [["Le livre auquel je pense.", "The book I am thinking about."], ["La ville dans laquelle je vis.", "The city in which I live."]],
    "Contractions: à + lesquels = auxquels; de + lesquelles = desquelles.",
    [
      ["choice", "Le livre ___ je pense.", ["auquel", "duquel", "lequel"], "auquel", "penser à → auquel."],
      ["choice", "La ville dans ___ je vis.", ["laquelle", "lequel", "lesquelles"], "laquelle", "ville is feminine → laquelle."],
      ["fill", "Les personnes ___ je parle.", null, "auxquelles", "parler à + feminine plural → auxquelles."],
      ["fill", "L'outil avec ___ il travaille.", null, "lequel", "avec + masculine singular → lequel."],
      ["choice", "Le sujet ___ nous parlons.", ["duquel", "auquel", "lequel"], "duquel", "parler de → duquel."]
    ]),

  K("b1.expressions.synonyms", "B1", "expressions",
    "Lexical precision", "Préciser le vocabulaire", 1.2, 3.3, ["b1.expressions.connectors"],
    "Avoid repeating faire/dire: effectuer, réaliser, déclarer, affirmer, expliquer.",
    [["Il a déclaré que...", "He stated that..."], ["Elle a effectué des recherches.", "She carried out research."]],
    "English 'do/say' has many French equivalents depending on register.",
    [
      ["choice", "Formal 'to do research'.", ["effectuer des recherches", "faire des recherches", "dire des recherches"], "effectuer des recherches", "effectuer is formal."],
      ["choice", "Formal 'to say' in a report.", ["déclarer", "dire", "parler"], "déclarer", "déclarer is formal."],
      ["fill", "Il a ___ qu'il viendrait. (stated)", null, "affirmé", "affirmer = to state."],
      ["choice", "To carry out a project.", ["réaliser un projet", "faire un projet", "dire un projet"], "réaliser un projet", "réaliser is standard-formal."],
      ["fill", "Elle a ___ le problème. (explained)", null, "expliqué", "expliquer = to explain."]
    ]),

  /* ---------------- B2 ---------------- */
  K("b2.syntax.nominalisation", "B2", "syntax",
    "Nominalisation", "La nominalisation", 1.4, 4.0, ["b1.syntax.participle_present"],
    "Turn verbs and adjectives into nouns: augmenter → une augmentation, décider → une décision.",
    [["Le gouvernement a décidé → la décision du gouvernement.", "The government decided → the government's decision."], ["Les prix augmentent → une augmentation des prix.", "Prices are rising → a rise in prices."]],
    "Formal written French prefers nouns; English often keeps the verb.",
    [
      ["choice", "The noun of 'augmenter'.", ["une augmentation", "un augmentement", "une augmentance"], "une augmentation", "-ation noun."],
      ["choice", "The noun of 'décider'.", ["une décision", "une décidance", "un décidé"], "une décision", "Irregular noun."],
      ["fill", "The noun of 'développer'.", null, "un développement", "-ment noun."],
      ["choice", "The noun of 'réduire'.", ["une réduction", "une réduisement", "un réduit"], "une réduction", "-tion noun."],
      ["fill", "The noun of 'apparaître'.", null, "une apparition", "-ition noun."]
    ]),

  K("b2.verbs.subjonctif_passe", "B2", "verbs",
    "Past subjunctive", "Le subjonctif passé", 1.4, 4.2, ["b1.subjunctive.present", "a2.passe_compose.avoir"],
    "avoir/être in the present subjunctive + past participle: que j'aie fini, qu'elle soit partie.",
    [["Bien qu'il ait fini.", "Although he has finished."], ["Je doute qu'elle soit venue.", "I doubt she came."]],
    "Used when the subjunctive action is already completed.",
    [
      ["fill", "Bien qu'il ___ fini.", null, "ait", "avoir subjunctive: ait."],
      ["fill", "Je doute qu'elle ___ venue.", null, "soit", "être subjunctive: soit."],
      ["choice", "Il faut que nous ___ terminé.", ["ayons", "avons", "aurons"], "ayons", "avoir subjunctive nous → ayons."],
      ["fill", "Bien qu'ils ___ arrivés.", null, "soient", "être subjunctive ils → soient."],
      ["fill", "Je regrette que tu ___ (partir).", null, "sois parti", "être + participle."]
    ]),

  K("b2.syntax.discours_indirect_passe", "B2", "syntax",
    "Reported speech in the past", "Le discours indirect au passé", 1.5, 4.1, ["a2.syntax.discours_indirect"],
    "Present → imparfait; passé composé → plus-que-parfait; future → conditional.",
    [["« Je viendrai » → Il a dit qu'il viendrait.", "I will come → He said he would come."], ["« J'ai fini » → Il a dit qu'il avait fini.", "I finished → He said he had finished."]],
    "Time markers shift too: demain → le lendemain, hier → la veille.",
    [
      ["choice", "« Je viendrai » → Il a dit qu'il ___ .", ["viendrait", "viendra", "venait"], "viendrait", "Future → conditional."],
      ["choice", "« J'ai fini » → Il a dit qu'il ___ .", ["avait fini", "a fini", "aurait fini"], "avait fini", "Passé composé → plus-que-parfait."],
      ["fill", "« Je pars demain » → Il a dit qu'il partait ___ .", null, "le lendemain", "demain → le lendemain."],
      ["choice", "« Hier » becomes ___ .", ["la veille", "le lendemain", "ce jour-là"], "la veille", "hier → la veille."],
      ["fill", "« Je suis malade » → Il a dit qu'il ___ malade.", null, "était", "Present → imparfait."]
    ]),

  K("b2.expressions.registre", "B2", "expressions",
    "Register: formal and informal", "Les registres de langue", 1.3, 3.9, ["b1.expressions.formal"],
    "Formal vs informal: travailler / bosser; manger / bouffer; un homme / un type.",
    [["Je vais travailler. (standard)", "I am going to work."], ["Je vais bosser. (informal)", "I am going to work (colloquial)."]],
    "Informal vocabulary is fine with friends, not in exams or formal writing.",
    [
      ["choice", "Informal for 'travailler'.", ["bosser", "bûcher", "œuvrer"], "bosser", "bosser is colloquial."],
      ["choice", "Standard for 'bouffer'.", ["manger", "dîner", "goûter"], "manger", "bouffer is slang for eating."],
      ["fill", "Formal 'I do not know'.", null, "Je ne sais pas", "Full negation is formal."],
      ["choice", "Informal for 'un homme'.", ["un type", "un monsieur", "un individu"], "un type", "un type is colloquial."],
      ["choice", "Which is formal?", ["demeurer", "crever", "bosser"], "demeurer", "demeurer is literary/formal."]
    ]),

  /* ---------------- Reading (TCF-style) ---------------- */
  K("reading.b1.email", "B1", "reading",
    "Reading: a short email", "Lecture : un courriel", 1.3, 2.6, [],
    "Read the whole text first, then answer. Do not translate every word: look for the information the question asks for.",
    [["Salut Marie, je t'écris de Lyon...", "Hi Marie, I'm writing from Lyon..."]],
    "TCF reading questions rarely need every word; locate the sentence that answers the question.",
    [
      ["choice", "Why is Lucas in Lyon?", ["He is starting an internship.", "He is on holiday.", "He is visiting family."], "He is starting an internship.", "« Demain, je commence mon stage » = tomorrow I start my internship.", null,
        "Salut Marie, Je t'écris de Lyon. Je suis arrivé hier soir et j'ai trouvé un petit appartement près de la gare. Il est un peu bruyant, mais pas très cher. Demain, je commence mon stage dans une agence de voyage. Je suis un peu nerveux, mais très content. Tu me manques ! À bientôt, Lucas"],
      ["choice", "What does he say about the flat?", ["It is noisy but cheap.", "It is quiet and expensive.", "It is far from the station."], "It is noisy but cheap.", "« un peu bruyant, mais pas très cher » = a bit noisy but not very expensive.", null,
        "Salut Marie, Je t'écris de Lyon. Je suis arrivé hier soir et j'ai trouvé un petit appartement près de la gare. Il est un peu bruyant, mais pas très cher. Demain, je commence mon stage dans une agence de voyage. Je suis un peu nerveux, mais très content. Tu me manques ! À bientôt, Lucas"],
      ["choice", "How does he feel about tomorrow?", ["Nervous but happy", "Angry", "Bored"], "Nervous but happy", "« un peu nerveux, mais très content ».", null,
        "Salut Marie, Je t'écris de Lyon. Je suis arrivé hier soir et j'ai trouvé un petit appartement près de la gare. Il est un peu bruyant, mais pas très cher. Demain, je commence mon stage dans une agence de voyage. Je suis un peu nerveux, mais très content. Tu me manques ! À bientôt, Lucas"],
      ["fill", "In the text, « un stage » means ___.", null, "an internship", "un stage = an internship / work placement."],
      ["fill", "Complete: Je suis arrivé ___ soir.", null, "hier", "« Je suis arrivé hier soir »."]
    ]),

  K("reading.b1.notice", "B1", "reading",
    "Reading: a building notice", "Lecture : un avis", 1.3, 2.7, [],
    "Read the notice and identify who it is for, what changes, and what residents must do.",
    [["Avis aux résidents : la piscine sera fermée...", "Notice to residents: the pool will be closed..."]],
    "Notices often contain a date range, an alternative, and a condition (badge, ticket).",
    [
      ["choice", "Why is the pool closed?", ["For repairs", "For a private event", "For the holidays"], "For repairs", "« pour des travaux » = for works/repairs.", null,
        "AVIS AUX RÉSIDENTS. La piscine sera fermée du 10 au 20 juillet pour des travaux. Pendant cette période, les résidents peuvent utiliser la piscine municipale, située rue Victor-Hugo, gratuitement, sur présentation de leur badge. La salle de sport reste ouverte. Nous vous remercions de votre compréhension."],
      ["choice", "Where can residents swim during this period?", ["At the municipal pool", "At the hotel", "At the beach"], "At the municipal pool", "« la piscine municipale » = the municipal pool.", null,
        "AVIS AUX RÉSIDENTS. La piscine sera fermée du 10 au 20 juillet pour des travaux. Pendant cette période, les résidents peuvent utiliser la piscine municipale, située rue Victor-Hugo, gratuitement, sur présentation de leur badge. La salle de sport reste ouverte. Nous vous remercions de votre compréhension."],
      ["choice", "What must they show?", ["Their badge", "Their passport", "A ticket"], "Their badge", "« sur présentation de leur badge ».", null,
        "AVIS AUX RÉSIDENTS. La piscine sera fermée du 10 au 20 juillet pour des travaux. Pendant cette période, les résidents peuvent utiliser la piscine municipale, située rue Victor-Hugo, gratuitement, sur présentation de leur badge. La salle de sport reste ouverte. Nous vous remercions de votre compréhension."],
      ["choice", "Is the gym open?", ["Yes", "No", "Only in the morning"], "Yes", "« La salle de sport reste ouverte. »"],
      ["fill", "The pool reopens on ___ July.", null, "21", "Closed 10–20 July → reopens on the 21st."]
    ]),

  K("reading.b2.article", "B2", "reading",
    "Reading: a short article", "Lecture : un article", 1.5, 3.5, [],
    "Identify the main claim, the supporting figure, and the recommendation.",
    [["Le télétravail a changé la vie de millions de salariés...", "Remote work has changed the lives of millions of employees..."]],
    "B2 reading often asks for the author's recommendation, not just a fact.",
    [
      ["choice", "What does the study show?", ["Most employees want some remote work.", "Most employees want to stop remote work.", "Remote work is illegal."], "Most employees want some remote work.", "« 62 % des employés préfèrent travailler au moins deux jours par semaine à la maison ».", null,
        "Le télétravail a changé la vie de millions de salariés. Selon une étude récente, 62 % des employés préfèrent travailler au moins deux jours par semaine à la maison. Les entreprises y voient un moyen de réduire leurs coûts, mais certains managers craignent une baisse de la coopération. Les experts recommandent un modèle hybride, avec des jours fixes au bureau pour maintenir le lien entre les équipes."],
      ["choice", "What do some managers fear?", ["Less cooperation", "Higher costs", "Longer commutes"], "Less cooperation", "« une baisse de la coopération ».", null,
        "Le télétravail a changé la vie de millions de salariés. Selon une étude récente, 62 % des employés préfèrent travailler au moins deux jours par semaine à la maison. Les entreprises y voient un moyen de réduire leurs coûts, mais certains managers craignent une baisse de la coopération. Les experts recommandent un modèle hybride, avec des jours fixes au bureau pour maintenir le lien entre les équipes."],
      ["choice", "What do experts recommend?", ["A hybrid model", "Full remote work", "A return to the office"], "A hybrid model", "« un modèle hybride ».", null,
        "Le télétravail a changé la vie de millions de salariés. Selon une étude récente, 62 % des employés préfèrent travailler au moins deux jours par semaine à la maison. Les entreprises y voient un moyen de réduire leurs coûts, mais certains managers craignent une baisse de la coopération. Les experts recommandent un modèle hybride, avec des jours fixes au bureau pour maintenir le lien entre les équipes."],
      ["fill", "In the text, « une baisse » means ___.", null, "a decrease", "une baisse = a fall / decrease."],
      ["choice", "Why do companies like remote work?", ["It reduces costs", "It increases rent", "It eliminates meetings"], "It reduces costs", "« un moyen de réduire leurs coûts »."]
    ]),

  K("reading.b2.job_ad", "B2", "reading",
    "Reading: a job advert", "Lecture : une offre d'emploi", 1.5, 3.4, [],
    "Job adverts list missions, profile, contract and how to apply. Scan for these four blocks.",
    [["Nous recherchons un assistant marketing...", "We are looking for a marketing assistant..."]],
    "The contract type (CDD/CDI) and the deadline are common TCF/TEF reading questions.",
    [
      ["choice", "What is the job?", ["Marketing assistant", "Social media manager", "English teacher"], "Marketing assistant", "« un assistant marketing ».", null,
        "Nous recherchons un assistant marketing pour notre bureau de Bordeaux. Missions : gérer les réseaux sociaux, rédiger des newsletters et participer aux campagnes publicitaires. Profil : bac +3 minimum, anglais courant, maîtrise des outils numériques. Contrat : CDD de six mois, à temps plein. Envoyer CV et lettre de motivation avant le 30 septembre."],
      ["choice", "What is required?", ["A bachelor's degree and fluent English", "A master's and Spanish", "No diploma"], "A bachelor's degree and fluent English", "« bac +3 minimum, anglais courant ».", null,
        "Nous recherchons un assistant marketing pour notre bureau de Bordeaux. Missions : gérer les réseaux sociaux, rédiger des newsletters et participer aux campagnes publicitaires. Profil : bac +3 minimum, anglais courant, maîtrise des outils numériques. Contrat : CDD de six mois, à temps plein. Envoyer CV et lettre de motivation avant le 30 septembre."],
      ["choice", "What type of contract?", ["A six-month fixed-term contract", "A permanent contract", "An internship"], "A six-month fixed-term contract", "« CDD de six mois » = six-month fixed-term contract.", null,
        "Nous recherchons un assistant marketing pour notre bureau de Bordeaux. Missions : gérer les réseaux sociaux, rédiger des newsletters et participer aux campagnes publicitaires. Profil : bac +3 minimum, anglais courant, maîtrise des outils numériques. Contrat : CDD de six mois, à temps plein. Envoyer CV et lettre de motivation avant le 30 septembre."],
      ["fill", "Candidates must send a CV and a ___.", null, "lettre de motivation", "« CV et lettre de motivation » = cover letter."],
      ["choice", "Where is the job?", ["Bordeaux", "Paris", "Lyon"], "Bordeaux", "« notre bureau de Bordeaux »."]
    ]),
  /* ---------------- graded reading: A1 → B2 ---------------- */
  K("reading.a1.intro", "A1", "reading",
    "Reading: a self-introduction", "Lecture : une présentation", 1.0, 1.1, [],
    "Read the whole passage first. The questions follow the order of the text.",
    [["Je m'appelle Marie.", "My name is Marie."]],
    "Do not translate every word — find the one sentence that answers the question.",
    [
      ["choice", "How old is Marie?", ["25", "20", "30"], "25", "« J'ai vingt-cinq ans ».", null, P_A1_INTRO],
      ["choice", "Where does she live?", ["Lyon", "Paris", "Nice"], "Lyon", "« j'habite à Lyon, en France ».", null, P_A1_INTRO],
      ["choice", "What does she study?", ["Languages", "Medicine", "Law"], "Languages", "« J'étudie les langues étrangères ».", null, P_A1_INTRO],
      ["choice", "Where does she meet her friends?", ["In a café near the station", "At the university", "At the cinema"], "In a café near the station", "« dans un petit café près de la gare ».", null, P_A1_INTRO],
      ["fill", "Le week-end, elle boit du chocolat ___.", null, "chaud", "« du chocolat chaud » = hot chocolate.", null, P_A1_INTRO]
    ]),

  K("reading.a1.bakery", "A1", "reading",
    "Reading: at the bakery", "Lecture : à la boulangerie", 1.0, 1.2, ["reading.a1.intro"],
    "A shop dialogue: greeting, order, price, payment.",
    [["Je voudrais une baguette.", "I would like a baguette."]],
    "« Je voudrais » is the polite way to order. Learn it as a block.",
    [
      ["choice", "What time is it?", ["8 a.m.", "10 a.m.", "noon"], "8 a.m.", "« Il est huit heures du matin ».", null, P_A1_BAKERY],
      ["choice", "What does Paul buy?", ["A baguette and two croissants", "Two baguettes", "A cake"], "A baguette and two croissants", "« une baguette et deux croissants ».", null, P_A1_BAKERY],
      ["choice", "How much does he pay?", ["3,20 €", "2,30 €", "13,20 €"], "3,20 €", "« trois euros vingt ».", null, P_A1_BAKERY],
      ["choice", "Where does he eat the croissant?", ["In the street", "At home", "In the shop"], "In the street", "« il mange un croissant tout de suite dans la rue ».", null, P_A1_BAKERY],
      ["fill", "Paul entre dans la ___.", null, "boulangerie", "« dans la boulangerie » = bakery.", null, P_A1_BAKERY]
    ]),

  K("reading.a2.weekend", "A2", "reading",
    "Reading: weekend plans", "Lecture : un projet de week-end", 1.1, 2.1, ["reading.a1.intro"],
    "Plans use aller + infinitive (futur proche). Watch the time markers.",
    [["Ils vont partir tôt.", "They are going to leave early."]],
    "Futur proche: aller + infinitive. « ils vont faire » = they are going to do.",
    [
      ["choice", "When will they leave?", ["Around 7 a.m.", "Around 9 a.m.", "At noon"], "Around 7 a.m.", "« vers sept heures ».", null, P_A2_WEEKEND],
      ["choice", "Why do they leave early?", ["The journey takes two hours", "The weather is bad", "The shops close early"], "The journey takes two hours", "« parce que le trajet dure deux heures ».", null, P_A2_WEEKEND],
      ["choice", "What must they take?", ["Water, a sandwich and good shoes", "A map and a camera", "Only water"], "Water, a sandwich and good shoes", "« de l'eau, un sandwich et de bonnes chaussures ».", null, P_A2_WEEKEND],
      ["choice", "What is the weather forecast?", ["Sun and wind", "Rain and snow", "Cloudy but warm"], "Sun and wind", "« du soleil mais aussi du vent ».", null, P_A2_WEEKEND],
      ["choice", "What will they eat in the evening?", ["A pizza", "A sandwich", "Nothing"], "A pizza", "« ils mangeront une pizza ensemble ».", null, P_A2_WEEKEND]
    ]),

  K("reading.a2.rent", "A2", "reading",
    "Reading: a flat to rent", "Lecture : une annonce immobilière", 1.1, 2.2, ["reading.a2.weekend"],
    "Rental ads follow a fixed order: location, rooms, floor, rent, availability, contact.",
    [["Trois pièces, charges comprises.", "Three rooms, charges included."]],
    "« sans ascenseur » means no lift — a detail French ads always mention.",
    [
      ["choice", "How many rooms?", ["Three", "Two", "Four"], "Three", "« Trois pièces ».", null, P_A2_RENT],
      ["choice", "Which floor?", ["Second, no lift", "First, with lift", "Ground floor"], "Second, no lift", "« Deuxième étage, sans ascenseur ».", null, P_A2_RENT],
      ["choice", "How much is the rent?", ["600 € per month, charges included", "600 € plus charges", "1,600 € per month"], "600 € per month, charges included", "« six cents euros par mois, charges comprises ».", null, P_A2_RENT],
      ["choice", "When is it available?", ["From 1 September", "From 1 October", "Immediately"], "From 1 September", "« à partir du premier septembre ».", null, P_A2_RENT],
      ["fill", "Pour visiter, il faut ___ après dix-huit heures.", null, "téléphoner", "« téléphonez au 06… » = call.", null, P_A2_RENT]
    ]),

  K("reading.b1.neighbourhood", "B1", "reading",
    "Reading: a changing neighbourhood", "Lecture : un quartier qui change", 1.3, 2.9, ["reading.a2.rent"],
    "A short opinion text: what changed, who is happy, who is not, what is promised.",
    [["Le quartier a beaucoup changé.", "The neighbourhood has changed a lot."]],
    "Watch contrast markers: certains… d'autres… (some… others…).",
    [
      ["choice", "What was there before?", ["Small shops and workshops", "Restaurants and bars", "Office buildings"], "Small shops and workshops", "« surtout des petits commerces et des ateliers ».", null, P_B1_NEIGHBOURHOOD],
      ["choice", "What has changed?", ["Old buildings were renovated and restaurants opened", "The metro was extended", "A park was built"], "Old buildings were renovated and restaurants opened", "« les vieux bâtiments ont été rénovés et de nombreux restaurants ont ouvert ».", null, P_B1_NEIGHBOURHOOD],
      ["choice", "What do some residents regret?", ["The time when rents were affordable", "The old shops", "The lack of restaurants"], "The time when rents were affordable", "« ils regrettent le temps où les loyers étaient abordables ».", null, P_B1_NEIGHBOURHOOD],
      ["choice", "What does the council promise?", ["To build social housing", "To close the restaurants", "To lower taxes"], "To build social housing", "« la mairie promet de construire des logements sociaux ».", null, P_B1_NEIGHBOURHOOD],
      ["choice", "When will the works start?", ["Not before two years", "Next month", "Next year"], "Not before two years", "« les travaux ne commenceront pas avant deux ans ».", null, P_B1_NEIGHBOURHOOD]
    ]),

  K("reading.b2.phones", "B2", "reading",
    "Reading: should phones be banned at school?", "Lecture : faut-il interdire le téléphone à l'école ?", 1.4, 3.6, ["reading.b1.neighbourhood"],
    "An argument text: thesis, supporting points, counter-argument, proposal.",
    [["Le débat revient régulièrement.", "The debate comes back regularly."]],
    "B2 reading tests stance: who thinks what, and what is proposed instead.",
    [
      ["choice", "What do supporters of a ban argue?", ["Phones distract pupils and harm concentration", "Phones are too expensive", "Phones are useless"], "Phones distract pupils and harm concentration", "« ces appareils distraient les élèves et nuisent à la concentration ».", null, P_B2_PHONES],
      ["choice", "What else do they mention?", ["Social media can encourage bullying", "Phones damage eyesight", "Phones waste electricity"], "Social media can encourage bullying", "« les réseaux sociaux peuvent favoriser le harcèlement entre camarades ».", null, P_B2_PHONES],
      ["choice", "What do some teachers point out?", ["A phone can be a useful teaching tool if supervised", "Phones should be sold at school", "Phones replace textbooks"], "A phone can be a useful teaching tool if supervised", "« un outil pédagogique utile, à condition d'être encadré ».", null, P_B2_PHONES],
      ["choice", "What do they propose instead of a total ban?", ["Clear rules adapted to pupils' age", "A ban only in the playground", "Nothing at all"], "Clear rules adapted to pupils' age", "« des règles claires, adaptées à l'âge des élèves ».", null, P_B2_PHONES],
      ["fill", "Plutôt qu'une interdiction ___, ils proposent des règles claires.", null, "totale", "« une interdiction totale » = a total ban.", null, P_B2_PHONES]
    ]),

  /* ---------------- A1 gaps (CEFR aligned) ---------------- */
  K("a1.negation.plus_personne", "A1", "syntax",
    "Negation: ne...plus / ne...personne", "La négation : ne...plus / ne...personne", 1.3, 2.0, ["a1.negation.ne_pas"],
    "plus = no longer; personne = nobody. Like pas, they go around the conjugated verb: Je ne fume plus. Il ne voit personne.",
    [["Je ne fume plus.", "I no longer smoke."], ["Il ne voit personne.", "He sees nobody."], ["Elle n'écoute personne.", "She listens to nobody."]],
    "personne and rien can be the subject: Personne n'est ici. Rien ne marche.",
    [
      ["fill", "Je ne fume ___ .", null, "plus", "plus = no longer."],
      ["fill", "Il ne voit ___ .", null, "personne", "personne = nobody."],
      ["choice", "She no longer eats meat.", ["Elle ne mange plus de viande.", "Elle ne mange pas plus de viande.", "Elle ne mange personne de viande."], "Elle ne mange plus de viande.", "plus goes around the verb."],
      ["correct", "Correct: Elle ne mange pas plus de viande.", null, "Elle ne mange plus de viande.", "Use plus, not pas plus."],
      ["fill", "___ n'est ici. (nobody)", null, "Personne", "personne as the subject: Personne n'est..."]
    ]),

  K("a1.expressions.il_faut", "A1", "expressions",
    "il faut / il ne faut pas + infinitive", "Il faut + infinitif", 1.2, 1.8, ["a0.verbs.faire"],
    "il faut + infinitive = it is necessary to. il ne faut pas + infinitive = you must not. The subject is impersonal.",
    [["Il faut partir.", "It is necessary to leave."], ["Il ne faut pas fumer.", "You must not smoke."], ["Il faut que je parte.", "I must leave."]],
    "il faut que requires the subjunctive, but il faut + infinitive does not.",
    [
      ["fill", "___ faut partir.", null, "Il", "Impersonal subject: il faut."],
      ["fill", "Il ne faut pas ___ . (smoke)", null, "fumer", "il ne faut pas + infinitive."],
      ["choice", "It is necessary to work.", ["Il faut travailler.", "Je faut travailler.", "Il faut que travailler."], "Il faut travailler.", "il faut + infinitive."],
      ["fill", "Il faut ___ les devoirs. (do)", null, "faire", "faire les devoirs = to do homework."],
      ["choice", "You must not be late.", ["Il ne faut pas être en retard.", "Ne faut pas être en retard.", "Il faut pas être en retard."], "Il ne faut pas être en retard.", "Keep the impersonal il."]
    ]),

  K("a1.adverbs.intensity", "A1", "adjectives",
    "Intensity adverbs: très, trop, assez, peu", "Les adverbes d'intensité", 1.1, 1.7, ["a1.adjectives.agreement"],
    "très = very; trop = too; assez = enough; peu = little. They go before the adjective or adverb they modify.",
    [["très grand", "very tall"], ["trop cher", "too expensive"], ["assez bien", "well enough"], ["peu intéressant", "not very interesting"]],
    "trop does not mean 'very'; it always carries excess. peu + adjective often needs a workaround in English.",
    [
      ["fill", "Il est ___ grand. (very)", null, "très", "très = very."],
      ["choice", "C'est ___ cher.", ["trop", "très", "peu"], "trop", "trop = too."],
      ["fill", "Elle parle ___ vite. (enough)", null, "assez", "assez = enough."],
      ["choice", "Ce film est ___ intéressant.", ["peu", "trop", "assez"], "peu", "peu = little / not very."],
      ["correct", "Correct: C'est trop très bon.", null, "C'est très bon.", "Do not stack très and trop."]
    ]),

  K("a1.adverbs.place_time", "A1", "prepositions",
    "Place and time adverbs", "Les adverbes de lieu et de temps", 1.1, 1.6, ["a1.prepositions.place"],
    "ici = here; là = there; maintenant = now; bientôt = soon; demain = tomorrow; hier = yesterday; aujourd'hui = today.",
    [["Viens ici !", "Come here!"], ["Il est là.", "He is there."], ["À bientôt !", "See you soon!"], ["Je pars demain.", "I am leaving tomorrow."]],
    "English uses prepositions with here/there ('in here'); French uses ici/là alone.",
    [
      ["fill", "Viens ___ ! (here)", null, "ici", "ici = here."],
      ["choice", "Il est ___ . (there)", ["là", "ici", "demain"], "là", "là = there."],
      ["fill", "Je pars ___ . (tomorrow)", null, "demain", "demain = tomorrow."],
      ["choice", "___ ! (See you soon)", ["À bientôt", "À demain", "À hier"], "À bientôt", "bientôt = soon."],
      ["fill", "Nous arrivons ___ . (now)", null, "maintenant", "maintenant = now."]
    ]),

  K("a1.pronouns.on", "A1", "pronouns",
    "The pronoun on", "Le pronom on", 1.3, 2.0, ["a0.pronouns.subject"],
    "on = nous (we), ils/les gens (they/people), or quelqu'un (someone). The verb is always 3rd person singular.",
    [["On part demain.", "We are leaving tomorrow."], ["On dit que...", "People say that..."], ["On frappe à la porte.", "Someone is knocking on the door."]],
    "In informal French on is used more often than nous; in writing nous is preferred.",
    [
      ["fill", "___ part demain. (we)", null, "On", "on replaces nous in speech."],
      ["choice", "___ dit que c'est vrai. (people)", ["On", "Nous", "Ils"], "On", "on = people/they."],
      ["fill", "___ frappe à la porte. (someone)", null, "On", "on = someone."],
      ["choice", "On ___ à la plage. (aller)", ["va", "vont", "allons"], "va", "on always takes 3rd person singular."],
      ["correct", "Correct: On vont au cinéma.", null, "On va au cinéma.", "on + 3rd person singular: va."]
    ]),

  /* ---------------- A2 gaps (CEFR aligned) ---------------- */
  K("a2.adverbs.frequency", "A2", "adjectives",
    "Frequency adverbs", "Les adverbes de fréquence", 1.2, 2.2, ["a1.adverbs.intensity"],
    "souvent = often; parfois = sometimes; rarement = rarely; toujours = always; jamais = never. They go after the verb.",
    [["Je vais souvent au cinéma.", "I often go to the cinema."], ["Il ne mange jamais de viande.", "He never eats meat."]],
    "With compound tenses, frequency adverbs go between the auxiliary and the participle: J'ai souvent mangé ici.",
    [
      ["fill", "Je vais ___ au cinéma. (often)", null, "souvent", "souvent = often."],
      ["choice", "Il ne mange ___ de viande.", ["jamais", "souvent", "parfois"], "jamais", "jamais = never."],
      ["fill", "Tu arrives ___ en retard. (rarely)", null, "rarement", "rarement = rarely."],
      ["choice", "Elle est ___ d'accord.", ["toujours", "souvent", "parfois"], "toujours", "toujours = always."],
      ["fill", "J'ai ___ mangé ici. (often)", null, "souvent", "Between auxiliary and participle."]
    ]),

  K("a2.verbs.politesse", "A2", "verbs",
    "Polite requests with the conditional", "Le conditionnel de politesse", 1.3, 2.4, [],
    "Je voudrais, J'aimerais, On pourrait, Pourriez-vous... Use the conditional to soften a request.",
    [["Je voudrais un café.", "I would like a coffee."], ["Pourriez-vous m'aider ?", "Could you help me?"], ["J'aimerais réserver une table.", "I would like to book a table."]],
    "English 'I want' is direct; French 'Je veux' is also direct. Use Je voudrais in shops and restaurants.",
    [
      ["fill", "Je ___ un café. (vouloir)", null, "voudrais", "vouloir in the conditional: voudrais."],
      ["choice", "___ -vous m'aider ? (pouvoir)", ["Pourriez", "Pouvez", "Pour"], "Pourriez", "pouvoir in the conditional: pourriez."],
      ["fill", "J'___ réserver une table. (aimer)", null, "aimerais", "aimer in the conditional: aimerais."],
      ["choice", "In a restaurant, you say:", ["Je voudrais un menu.", "Je veux un menu.", "Je vais un menu."], "Je voudrais un menu.", "Conditional is polite."],
      ["correct", "Correct: Je veux l'addition, s'il vous plaît.", null, "Je voudrais l'addition, s'il vous plaît.", "Use the conditional for politeness."]
    ]),

  K("a2.adjectives.tout", "A2", "adjectives",
    "The adjective tout", "L'adjectif tout", 1.2, 2.1, ["a1.adjectives.agreement"],
    "tout, toute, tous, toutes = all / every. They agree with the noun and go before it: tout le monde, toute la journée.",
    [["tout le monde", "everyone"], ["toute la journée", "the whole day"], ["tous les jours", "every day"], ["toutes les semaines", "every week"]],
    "tout le monde is singular; tous les jours is plural. The article (le/la/les) is required.",
    [
      ["fill", "___ le monde (everyone, m.)", null, "tout", "Masculine singular: tout."],
      ["fill", "___ la journée (all, f.)", null, "toute", "Feminine singular: toute."],
      ["choice", "___ les jours (all, m. pl.)", ["tous", "tout", "toutes"], "tous", "Masculine plural: tous."],
      ["choice", "___ les semaines (all, f. pl.)", ["toutes", "tous", "toute"], "toutes", "Feminine plural: toutes."],
      ["fill", "Il travaille ___ les matins.", null, "tous", "Masculine plural mornings."]
    ]),

  K("a2.prepositions.movement", "A2", "prepositions",
    "Prepositions of movement", "Les prépositions de mouvement", 1.3, 2.3, ["a1.prepositions.place"],
    "à = to (a place), de = from, par = through/by, pour = for, vers = towards, chez = at someone's place.",
    [["Je vais à Paris.", "I am going to Paris."], ["Il vient de Lyon.", "He comes from Lyon."], ["Nous passons par la gare.", "We are passing through the station."]],
    "aller uses à; venir uses de. English 'I go home' needs à: Je vais à la maison.",
    [
      ["fill", "Je vais ___ Paris.", null, "à", "Destination takes à."],
      ["fill", "Il vient ___ Lyon.", null, "de", "Origin takes de."],
      ["choice", "Nous passons ___ la gare.", ["par", "à", "de"], "par", "through = par."],
      ["fill", "Elle court ___ le parc. (towards)", null, "vers", "towards = vers."],
      ["choice", "Ils vont ___ Marie. (her place)", ["chez", "à", "de"], "chez", "at someone's place = chez."]
    ]),

  K("a2.syntax.interrogation_complete", "A2", "syntax",
    "Question words: pourquoi, combien, quel", "Les mots interrogatifs", 1.2, 2.2, ["a1.questions.est_ce_que"],
    "pourquoi = why; combien = how much/many; quel = which (agrees). Use est-ce que or inversion.",
    [["Pourquoi es-tu en retard ?", "Why are you late?"], ["Combien coûte ce livre ?", "How much does this book cost?"], ["Quelle heure est-il ?", "What time is it?"]],
    "quel agrees with the noun: quel livre (m.), quelle heure (f.), quels livres (m. pl.), quelles heures (f. pl.).",
    [
      ["fill", "___ es-tu en retard ? (why)", null, "Pourquoi", "why = pourquoi."],
      ["choice", "___ coûte ce livre ? (how much)", ["Combien", "Combien de", "Quel"], "Combien", "how much = combien (no de before a verb)."],
      ["fill", "___ heure est-il ? (what, f.)", null, "Quelle", "heure is feminine: quelle."],
      ["choice", "___ livres as-tu ? (which, m. pl.)", ["Quels", "Quel", "Quelles"], "Quels", "Masculine plural: quels."],
      ["correct", "Correct: Combien de coûte ce livre ?", null, "Combien coûte ce livre ?", "No de before a verb."]
    ]),

  /* ---------------- B1 gaps (CEFR aligned) ---------------- */
  K("b1.negation.que_aucun", "B1", "syntax",
    "ne...que / aucun / ni...ni", "La négation avancée", 1.3, 2.8, ["a1.negation.plus_personne"],
    "ne...que = only; aucun(e) = none/not any; ni...ni = neither...nor. Aucun and ni trigger the partitive de.",
    [["Je n'ai que cinq euros.", "I only have five euros."], ["Aucun élève n'a répondu.", "No pupil answered."], ["Il n'a ni frère ni sœur.", "He has neither brother nor sister."]],
    "aucun is more emphatic than pas de. ni...ni repeats ni before each item.",
    [
      ["fill", "Je n'ai ___ cinq euros.", null, "que", "ne...que = only."],
      ["choice", "___ élève n'a répondu.", ["Aucun", "Aucune", "Personne"], "Aucun", "élève is masculine: aucun."],
      ["fill", "Il n'a ___ frère ___ sœur.", null, "ni", "ni...ni."],
      ["choice", "She has no friends.", ["Elle n'a aucun ami.", "Elle n'a pas aucun ami.", "Elle n'a que des amis."], "Elle n'a aucun ami.", "aucun + noun."],
      ["correct", "Correct: Je n'ai pas que cinq euros.", null, "Je n'ai que cinq euros.", "Do not add pas with ne...que."]
    ]),

  K("b1.adjectives.indefinis", "B1", "adjectives",
    "Indefinite determiners", "Les déterminants indéfinis", 1.3, 2.6, ["a2.adjectives.tout"],
    "n'importe quel = any; tel = such; divers = various; la plupart de = most; chaque = each. Most take de before a plural noun.",
    [["n'importe quel jour", "any day"], ["tel père, tel fils", "like father, like son"], ["la plupart des gens", "most people"], ["divers problèmes", "various problems"]],
    "la plupart is always followed by de + article; the verb can be singular or plural.",
    [
      ["fill", "Tu peux venir ___ jour. (any)", null, "n'importe quel", "n'importe quel = any."],
      ["choice", "___ père, ___ fils.", ["tel", "tout", "quel"], "tel", "tel = such."],
      ["fill", "La plupart ___ gens sont gentils.", null, "des", "la plupart de + les = des."],
      ["choice", "___ problèmes restent à résoudre.", ["Divers", "Tout", "Chaque"], "Divers", "divers = various."],
      ["correct", "Correct: La plupart des gens est gentil.", null, "La plupart des gens sont gentils.", "plupart + plural verb is common."]
    ]),

  K("b1.adverbs.maniere", "B1", "adjectives",
    "Adverbs of manner", "Les adverbes de manière", 1.2, 2.5, ["a2.adjectives.adverbs_ment"],
    "finalement = finally; prudemment = carefully; brièvement = briefly; récemment = recently; sérieusement = seriously.",
    [["Il a finalement accepté.", "He finally accepted."], ["Conduis prudemment.", "Drive carefully."], ["Pourriez-vous parler brièvement ?", "Could you speak briefly?"]],
    "Many -ment adverbs come from the feminine form, but some are irregular: gentiment, énormément.",
    [
      ["fill", "Il a ___ accepté. (finally)", null, "finalement", "finalement = finally."],
      ["choice", "Conduis ___ .", ["prudemment", "prudent", "prudement"], "prudemment", "prudent → prudemment."],
      ["fill", "Parlez ___ . (briefly)", null, "brièvement", "brièvement = briefly."],
      ["choice", "Il travaille ___ .", ["sérieusement", "sérieux", "sérieuse"], "sérieusement", "sérieux → sérieusement."],
      ["fill", "Elle est ___ arrivée. (recently)", null, "récemment", "récemment = recently."]
    ]),

  K("b1.adjectives.ci_la", "B1", "adjectives",
    "-ci and -là", "-ci et -là", 1.2, 2.4, ["a1.adjectives.demonstrative"],
    "Add -ci (this/these) or -là (that/those) to a noun or demonstrative for emphasis: ce livre-ci, celui-là.",
    [["Ce livre-ci est intéressant.", "This book is interesting."], ["Celle-là est plus chère.", "That one is more expensive."], ["Prenez ces chaises-là.", "Take those chairs."]],
    "-ci and -là are optional; they add contrast or spatial reference. Do not use them with standard ce/cet/cette/ces alone.",
    [
      ["fill", "Ce livre-___ est intéressant. (this)", null, "ci", "-ci = this."],
      ["choice", "Celle-___ est plus chère. (that)", ["là", "ci", "la"], "là", "-là = that."],
      ["fill", "Prenez ces chaises-___ . (those)", null, "là", "-là for distance."],
      ["choice", "Which is correct?", ["cet homme-là", "cet-là homme", "ce homme-là"], "cet homme-là", "-là goes after the noun."],
      ["correct", "Correct: Ce livre-ci est meilleur que ce livre-là.", null, "Ce livre-ci est meilleur que celui-là.", "Replace the repeated noun with a pronoun."]
    ]),

  K("b1.verbs.prepositionnels", "B1", "verbs",
    "Verbs with prepositions", "Les verbes prépositionnels", 1.4, 2.9, ["a1.verbs.modals"],
    "French verbs often need a fixed preposition before an infinitive: arrêter de, penser à, rêver de, réussir à, décider de.",
    [["J'arrête de fumer.", "I am stopping smoking."], ["Elle pense à ses vacances.", "She is thinking about her holiday."], ["Il a réussi à partir.", "He managed to leave."]],
    "English 'think of' can be penser à or penser de depending on meaning. 'Stop to do' = s'arrêter pour faire; 'stop doing' = arrêter de faire.",
    [
      ["fill", "J'arrête ___ fumer.", null, "de", "arrêter de + infinitive."],
      ["choice", "Elle pense ___ ses vacances.", ["à", "de", "pour"], "à", "penser à = think about."],
      ["fill", "Il a réussi ___ partir.", null, "à", "réussir à + infinitive."],
      ["choice", "Ils ont décidé ___ partir.", ["de", "à", "pour"], "de", "décider de + infinitive."],
      ["correct", "Correct: Elle pense de ses vacances.", null, "Elle pense à ses vacances.", "penser à, not penser de (for 'thinking about')."]
    ]),

  K("b1.verbs.passe_simple", "B1", "verbs",
    "Recognising the passé simple", "Reconnaître le passé simple", 1.2, 3.0, ["a2.passe_compose.avoir"],
    "The passé simple is a literary past tense. Learn to recognise its forms: -ai, -as, -a, -âmes, -âtes, -èrent for -er verbs; -is, -it for others.",
    [["Il parla.", "He spoke."], ["Elle finit.", "She finished."], ["Ils vendirent.", "They sold."]],
    "You do not need to produce the passé simple, but you must recognise it in novels and formal texts.",
    [
      ["choice", "Which tense is 'parla' ?", ["passé simple", "imparfait", "futur simple"], "passé simple", "-a ending = passé simple."],
      ["fill", "Elle ___ son travail. (finir, passé simple)", null, "finit", "-it ending for -ir verbs."],
      ["choice", "Ils ___ la maison. (vendre, passé simple)", ["vendirent", "vendaient", "ont vendu"], "vendirent", "-irent ending for -re verbs."],
      ["fill", "Nous ___ ensemble. (parler, passé simple)", null, "parlâmes", "-âmes for nous."],
      ["correct", "Correct: Elle parla à son ami hier.", null, "Elle a parlé à son ami hier.", "Everyday French uses passé composé, not passé simple."]
    ]),

  K("b1.syntax.discours_indirect", "B1", "syntax",
    "Reported speech", "Le discours indirect", 1.4, 3.1, ["a2.syntax.discours_indirect"],
    "Report a statement with que + adapted tense; a yes/no question with si; a WH-question with the question word.",
    [["Il dit qu'il viendra.", "He says he will come."], ["Elle demande si tu es là.", "She asks if you are here."], ["Je ne sais pas où il est.", "I don't know where he is."]],
    "When the main verb is in the past, backshift the tense: il a dit qu'il viendrait (conditionnel).",
    [
      ["fill", "Il dit qu'il ___ . (venir, futur)", null, "viendra", "que + future after present main verb."],
      ["choice", "Elle demande ___ tu es là.", ["si", "que", "pourquoi"], "si", "yes/no question → si."],
      ["fill", "Je ne sais pas ___ il est.", null, "où", "WH-question keeps the question word."],
      ["choice", "Il a dit qu'il ___ .", ["viendrait", "viendra", "vient"], "viendrait", "Past main verb → backshift to conditional."],
      ["correct", "Correct: Elle demande que tu es là.", null, "Elle demande si tu es là.", "Questions use si, not que."]
    ]),

  K("b1.syntax.si_present", "B1", "syntax",
    "si + present (certain hypotheses)", "Si + présent", 1.3, 2.8, ["a2.syntax.cause_consequence"],
    "si + present → present/future/imperative. Used for real or very likely conditions.",
    [["S'il fait beau, nous irons à la plage.", "If the weather is nice, we will go to the beach."], ["Si tu es prêt, partons !", "If you are ready, let's go!"]],
    "Do not use the future after si: 'S'il fera beau' is wrong. Use the present.",
    [
      ["fill", "S'il fait beau, nous ___ à la plage. (aller)", null, "irons", "si + present → future."],
      ["choice", "Si tu es prêt, ___ !", ["partons", "partirons", "partons-nous"], "partons", "si + present → imperative."],
      ["fill", "Si elle ___ le temps, elle vient. (avoir)", null, "a", "si + present → present."],
      ["choice", "Which is wrong?", ["S'il fera beau...", "S'il fait beau...", "S'il pleut..."], "S'il fera beau...", "Never use future after si."],
      ["correct", "Correct: Si tu seras prêt, appelle-moi.", null, "Si tu es prêt, appelle-moi.", "Use present after si, not future."]
    ]),
  /* ---------------- B2 core (CEFR aligned) ---------------- */
  K("b2.verbs.infinitif_passe", "B2", "verbs",
    "Past infinitive", "L'infinitif passé", 1.4, 3.5, ["a2.passe_compose.avoir"],
    "avoir or être in the infinitive + past participle = to have done. Used after après, pour, sans, de.",
    [["Après avoir mangé, il est parti.", "After eating, he left."], ["Il regrette d'être parti.", "He regrets having left."], ["Merci d'avoir appelé.", "Thank you for calling."]],
    "The auxiliary matches the verb: après être allé (mover verb) vs après avoir fini.",
    [
      ["fill", "Après ___ mangé, il est parti.", null, "avoir", "manger uses avoir."],
      ["choice", "Il regrette d'___ parti.", ["être", "avoir", "être en"], "être", "partir uses être."],
      ["fill", "Merci d'___ appelé.", null, "avoir", "avoir + past participle."],
      ["choice", "Après ___ arrivés, nous avons mangé.", ["être", "avoir", "étant"], "être", "arriver uses être."],
      ["correct", "Correct: Après il a mangé, il est parti.", null, "Après avoir mangé, il est parti.", "Use the infinitive after après, not a conjugated verb."]
    ]),

  K("b2.negation.expletif", "B2", "syntax",
    "ne explétif / nul / nulle part", "La négation complexe", 1.3, 3.4, ["b1.negation.que_aucun"],
    "ne explétif is an extra ne after avant que, à moins que, craindre que. nul/nulle part = none/nowhere (formal).",
    [["Avant que je ne parte...", "Before I leave..."], ["Il n'y a nulle part où aller.", "There is nowhere to go."], ["Nul doute qu'il réussira.", "No doubt he will succeed."]],
    "The ne explétif is optional in modern French but expected in formal writing and exams.",
    [
      ["fill", "Avant que je ___ parte...", null, "ne", "ne explétif after avant que."],
      ["choice", "Il n'y a ___ où aller.", ["nulle part", "personne", "rien"], "nulle part", "nowhere = nulle part."],
      ["fill", "___ doute qu'il réussira.", null, "Nul", "nul = none (formal)."],
      ["choice", "Crains-tu qu'il ___ pleuve ?", ["ne", "pas", "n'"], "ne", "ne explétif after craindre que."],
      ["correct", "Correct: Avant que je parte, dis au revoir.", null, "Avant que je ne parte, dis au revoir.", "Add ne explétif in formal contexts."]
    ]),

  K("b2.syntax.sans_au_cas", "B2", "syntax",
    "sans / au cas où + conditional", "Sans et au cas où", 1.4, 3.6, ["b1.conditional.present"],
    "sans + noun/infinitive = without. au cas où + conditional = in case. Sans que + subjunctive = without doing.",
    [["Au cas où il pleuvrait, prends un parapluie.", "In case it rains, take an umbrella."], ["Il est parti sans dire au revoir.", "He left without saying goodbye."], ["Sans lui, nous n'y serions pas arrivés.", "Without him, we would not have managed."]],
    "au cas où always takes the conditional, even for present/future reference.",
    [
      ["fill", "Au cas où il ___, prends un parapluie. (pleuvoir, conditional)", null, "pleuvrait", "au cas où + conditional."],
      ["choice", "Il est parti ___ dire au revoir.", ["sans", "sans que", "au cas où"], "sans", "without + infinitive."],
      ["fill", "Sans lui, nous n'y serions pas ___ . (arriver)", null, "arrivés", "sans + conditional in the past."],
      ["choice", "Elle est sortie ___ personne ne la voie.", ["sans que", "sans", "au cas où"], "sans que", "without + subjunctive."],
      ["correct", "Correct: Au cas où il pleut, prends un parapluie.", null, "Au cas où il pleuvrait, prends un parapluie.", "au cas où needs the conditional."]
    ]),

  K("b2.expressions.presentatifs", "B2", "expressions",
    "Presentatives: voici / voilà / c'est", "Les présentatifs", 1.2, 2.9, ["a0.syntax.cest_vs_il_est"],
    "voici = here is; voilà = there is; c'est / ce sont = it is / they are. Used to present or identify.",
    [["Voici mon frère.", "This is my brother."], ["Voilà la solution.", "There is the solution."], ["Ce sont mes amis.", "These are my friends."]],
    "ce sont is required before a plural noun or pronoun: Ce sont eux. Not 'C'est eux' in formal French.",
    [
      ["fill", "___ mon frère. (here is)", null, "Voici", "voici = here is."],
      ["choice", "___ la solution. (there is)", ["Voilà", "Voici", "C'est"], "Voilà", "voilà = there is."],
      ["fill", "___ mes amis. (they are)", null, "Ce sont", "Plural → ce sont."],
      ["choice", "___ eux qui ont gagné.", ["Ce sont", "C'est", "Voici"], "Ce sont", "Plural pronoun → ce sont."],
      ["correct", "Correct: C'est mes amis.", null, "Ce sont mes amis.", "Plural requires ce sont."]
    ]),

  K("b2.verbs.prepositionnels_avance", "B2", "verbs",
    "Advanced prepositional verbs", "Les verbes prépositionnels avancés", 1.4, 3.3, ["b1.verbs.prepositionnels"],
    "se charger de = to take care of; se plaindre de = to complain about; hésiter à = to hesitate to; persuader de = to persuade to.",
    [["Je me charge du projet.", "I am taking care of the project."], ["Elle se plaint du bruit.", "She complains about the noise."], ["Il hésite à répondre.", "He hesitates to answer."]],
    "Some verbs change meaning with different prepositions: penser à (think about) vs penser de (have an opinion on).",
    [
      ["fill", "Je me ___ du projet. (charger)", null, "charge", "se charger de."],
      ["choice", "Elle se ___ du bruit.", ["plaint", "plaindre", "plaint de"], "plaint", "se plaindre de."],
      ["fill", "Il ___ à répondre. (hésiter)", null, "hésite", "hésiter à + infinitive."],
      ["choice", "Je l'ai persuadé ___ venir.", ["de", "à", "pour"], "de", "persuader de + infinitive."],
      ["correct", "Correct: Que penses-tu à ce film ?", null, "Que penses-tu de ce film ?", "opinion → penser de."]
    ]),

  K("b2.syntax.connecteurs_avances", "B2", "syntax",
    "Advanced connectors", "Les connecteurs avancés", 1.3, 3.2, ["b1.expressions.connectors"],
    "considérant que = considering; d'autant plus que = all the more because; en revanche = on the other hand; partant = therefore.",
    [["Considérant que le prix a augmenté, nous renonçons.", "Considering the price has risen, we are giving up."], ["Il est compétent, d'autant plus qu'il est jeune.", "He is competent, all the more so because he is young."]],
    "These connectors are typical of formal writing and B2-level exams.",
    [
      ["fill", "___ que le prix a augmenté, nous renonçons.", null, "Considérant", "considérant que = considering."],
      ["choice", "Il est compétent, ___ qu'il est jeune.", ["d'autant plus", "cependant", "pourtant"], "d'autant plus", "d'autant plus que = all the more because."],
      ["fill", "Les coûts ont baissé. ___ , la qualité a baissé aussi.", null, "En revanche", "en revanche = on the other hand."],
      ["choice", "___ , nous acceptons votre offre.", ["Partant", "Pourtant", "Cependant"], "Partant", "partant = therefore (formal)."],
      ["correct", "Correct: Il est compétent, d'autant qu'il est jeune.", null, "Il est compétent, d'autant plus qu'il est jeune.", "Full form: d'autant plus que."]
    ]),

  K("b2.syntax.concordance", "B2", "syntax",
    "Advanced tense agreement", "La concordance des temps", 1.4, 3.5, ["b1.syntax.discours_indirect"],
    "When the main verb is in the past, backshift the subordinate clause: présent → imparfait, futur → conditionnel, passé composé → plus-que-parfait.",
    [["Il a dit qu'il viendrait.", "He said he would come."], ["Elle pensait que j'étais malade.", "She thought I was ill."], ["Il croyait que nous avions fini.", "He believed we had finished."]],
    "The backshift rule is not absolute in modern spoken French, but it is required in formal contexts and exams.",
    [
      ["fill", "Il a dit qu'il ___ . (venir, conditional)", null, "viendrait", "futur → conditional."],
      ["choice", "Elle pensait que j'___ malade.", ["étais", "suis", "serais"], "étais", "présent → imparfait."],
      ["fill", "Il croyait que nous avions ___ . (finir)", null, "fini", "passé composé → plus-que-parfait."],
      ["choice", "Il a dit qu'il ___ riche.", ["était", "est", "serait"], "était", "présent → imparfait."],
      ["correct", "Correct: Il a dit qu'il viendra.", null, "Il a dit qu'il viendrait.", "Backshift futur to conditional."]
    ]),

  K("b2.pronouns.indefinis", "B2", "pronouns",
    "Indefinite pronouns", "Les pronoms indéfinis", 1.3, 3.1, ["a2.pronouns.indefinite"],
    "Plusieurs = several; certains = some; l'un... l'autre = one... the other; les uns... les autres = some... others; chacun = each.",
    [["Plusieurs sont partis.", "Several have left."], ["L'un parle, l'autre écoute.", "One speaks, the other listens."], ["Chacun pour soi.", "Every man for himself."]],
    "chacun is singular; plusieurs and certains are plural. l'un/l'autre agree with the nouns they replace.",
    [
      ["fill", "___ sont partis. (several)", null, "Plusieurs", "plusieurs = several."],
      ["choice", "___ parle, l'autre écoute.", ["L'un", "Un", "Chacun"], "L'un", "l'un... l'autre."],
      ["fill", "___ pour soi. (each)", null, "Chacun", "chacun = each."],
      ["choice", "___ ont réussi. (some)", ["Certains", "Plusieurs", "Chacun"], "Certains", "certains = some."],
      ["correct", "Correct: Chacun ont leur place.", null, "Chacun a sa place.", "chacun is singular."]
    ]),

  K("b2.syntax.opposition", "B2", "syntax",
    "Advanced opposition", "L'opposition avancée", 1.3, 3.3, ["b1.syntax.concession"],
    "sans que + subjunctive = without; contrairement à = contrary to; à l'inverse de = unlike; inversement = conversely.",
    [["Il est parti sans que personne ne le voie.", "He left without anyone seeing him."], ["Contrairement à toi, j'aime le froid.", "Unlike you, I like the cold."]],
    "sans que requires the subjunctive and often the ne explétif. contrairement à needs a noun or pronoun.",
    [
      ["fill", "Il est parti sans que personne ne le ___ . (voir)", null, "voie", "sans que + subjunctive."],
      ["choice", "___ à toi, j'aime le froid.", ["Contrairement", "Cependant", "Pourtant"], "Contrairement", "contrairement à = contrary to."],
      ["fill", "___ , la seconde proposition est fausse.", null, "Inversement", "inversement = conversely."],
      ["choice", "___ ce que tu penses, il est gentil.", ["Contrairement à", "Cependant", "Pourtant"], "Contrairement à", "contrairement à + noun clause."],
      ["correct", "Correct: Il est parti sans personne ne le voit.", null, "Il est parti sans que personne ne le voie.", "sans que + subjunctive + ne explétif."]
    ]),

  K("b2.syntax.consequence", "B2", "syntax",
    "Advanced consequence", "La conséquence avancée", 1.3, 3.2, ["a2.syntax.cause_consequence"],
    "si bien que = so much so that; au point que / à tel point que = to the point that; de sorte que = so that (result).",
    [["Il parle si bas si bien que personne ne l'entend.", "He speaks so quietly that nobody hears him."], ["Elle est malade au point qu'elle ne peut pas travailler.", "She is ill to the point that she cannot work."]],
    "si bien que and au point que can be followed by the indicative or the subjunctive depending on certainty.",
    [
      ["fill", "Il parle si bas ___ personne ne l'entend.", null, "si bien que", "si bien que = so much so that."],
      ["choice", "Elle est malade ___ elle ne peut pas travailler.", ["au point que", "donc", "par conséquent"], "au point que", "au point que = to the point that."],
      ["fill", "Il fait froid, ___ que les routes sont gelées.", null, "si bien", "si bien que."],
      ["choice", "C'est ___ point que j'ai peur.", ["à tel", "au", "telle"], "à tel", "à tel point que."],
      ["correct", "Correct: Il parle bas, donc personne ne l'entend.", null, "Il parle si bas si bien que personne ne l'entend.", "Use si bien que for degree + result."]
    ]),

  K("b2.verbs.passe_anterieur", "B2", "verbs",
    "Recognising the passé antérieur", "Reconnaître le passé antérieur", 1.2, 3.4, ["b1.verbs.passe_simple"],
    "The passé antérieur = passé simple of avoir/être + past participle. It expresses an action completed before another past action.",
    [["Quand il eut fini, il partit.", "When he had finished, he left."], ["Dès qu'elle fut arrivée, elle téléphona.", "As soon as she had arrived, she phoned."]],
    "Like the passé simple, it appears in literature and formal narrative. You need to recognise, not produce it.",
    [
      ["choice", "'eut fini' is which tense?", ["passé antérieur", "plus-que-parfait", "passé simple"], "passé antérieur", "avoir in passé simple + participle."],
      ["fill", "Dès qu'elle ___ arrivée, elle téléphona.", null, "fut", "être in passé simple: fut."],
      ["choice", "Quand il ___ mangé, il dormit.", ["eut", "avait", "a"], "eut", "avoir in passé simple: eut."],
      ["fill", "Après qu'ils ___ partis, la maison était vide.", null, "furent", "être in passé simple: furent."],
      ["correct", "Correct: Quand il avait fini, il est parti.", null, "Quand il eut fini, il partit.", "Literary narrative uses passé antérieur + passé simple."]
    ]),

  K("b2.syntax.nominalisation_2", "B2", "syntax",
    "Nominalisation of adjectives and verbs", "La nominalisation", 1.3, 3.2, ["b2.syntax.nominalisation"],
    "Turn adjectives and verbs into nouns: la jeunesse, la beauté, la réussite, le choix, la découverte, la perte.",
    [["la jeunesse", "youth"], ["la réussite", "success"], ["le choix", "choice"], ["la découverte", "discovery"]],
    "Nominalisation makes writing more formal and concise. Learn the common patterns: -esse, -eur, -tion, -ture, -ment.",
    [
      ["fill", "la ___ (jeune)", null, "jeunesse", "jeune → jeunesse."],
      ["choice", "la ___ (beau)", ["beauté", "beausse", "beaulté"], "beauté", "beau → beauté."],
      ["fill", "le ___ (choisir)", null, "choix", "choisir → choix."],
      ["choice", "la ___ (découvrir)", ["découverte", "découvreture", "découvremment"], "découverte", "découvrir → découverte."],
      ["correct", "Correct: Le fait qu'il est jeune est important.", null, "Sa jeunesse est importante.", "Nominalise for conciseness."]
    ]),

  K("b2.verbs.passif_avance", "B2", "verbs",
    "Advanced passive voice", "La voix passive avancée", 1.4, 3.4, ["b1.verbs.passive"],
    "Passive with an agent (par), with a state (de), or in the infinitive: être aimé, se faire + infinitive (causative passive).",
    [["Il s'est fait voler son portefeuille.", "He had his wallet stolen."], ["La porte est restée fermée.", "The door stayed closed."], ["Cette ville est connue de tous.", "This city is known to everyone."]],
    "se faire + infinitive expresses that something happens to the subject, often unwillingly.",
    [
      ["fill", "Il s'est fait ___ son portefeuille. (voler)", null, "voler", "se faire + infinitive."],
      ["choice", "La porte est ___ fermée.", ["restée", "resté", "rester"], "restée", "rester + adjective (state)."],
      ["fill", "Cette ville est connue ___ tous.", null, "de", "known to = connu de."],
      ["choice", "Elle s'est fait ___ par le médecin.", ["examiner", "examinée", "examiner par"], "examiner", "se faire + infinitive (no agreement)."],
      ["correct", "Correct: Il s'est fait volé son portefeuille.", null, "Il s'est fait voler son portefeuille.", "se faire + infinitive keeps the infinitive."]
    ]),

  K("b2.pronouns.relatifs_composes_2", "B2", "pronouns",
    "Complex relative pronouns", "Les pronoms relatifs composés", 1.4, 3.3, ["b1.pronouns.relatifs_composes"],
    "lequel / laquelle / lesquels / lesquelles agree with the antecedent. Contract with à and de: auquel, desquels.",
    [["Le bureau auquel je pense est cher.", "The office I am thinking of is expensive."], ["Les amis parmi lesquels il vit sont sympas.", "The friends he lives among are nice."]],
    "Use lequel after prepositions instead of qui/que when referring to things. After people, qui is preferred.",
    [
      ["fill", "Le bureau ___ je pense est cher.", null, "auquel", "penser à + lequel = auquel."],
      ["choice", "Les amis ___ il vit sont sympas.", ["parmi lesquels", "parmi lesquelles", "parmi qui"], "parmi lesquels", "After parmi, use lequel for things/people."],
      ["fill", "La ville ___ je viens est loin.", null, "de laquelle", "venir de + laquelle = de laquelle."],
      ["choice", "Les problèmes ___ nous avons parlé.", ["desquels", "duquel", "desquelles"], "desquels", "parler de + lesquels = desquels (masc pl)."],
      ["correct", "Correct: Le bureau à que je pense est cher.", null, "Le bureau auquel je pense est cher.", "à + lequel = auquel."]
    ]),

  K("b2.verbs.subjonctif_avance", "B2", "verbs",
    "Subjunctive after complex conjunctions", "Le subjonctif avancé", 1.4, 3.6, ["b1.verbs.subjunctive_conj"],
    "pourvu que = provided that; à moins que = unless; de crainte que / de peur que = for fear that; quoique = although.",
    [["Je viendrai pourvu que tu sois là.", "I will come provided you are there."], ["À moins qu'il ne pleuve, nous sortirons.", "Unless it rains, we will go out."]],
    "à moins que and de crainte que often take the ne explétif. quoique always takes the subjunctive.",
    [
      ["fill", "Je viendrai ___ tu sois là.", null, "pourvu que", "pourvu que = provided that."],
      ["choice", "___ qu'il ne pleuve, nous sortirons.", ["À moins", "Sans", "De peur"], "À moins", "à moins que = unless."],
      ["fill", "___ tu sois fatigué, travaille.", null, "Quoique", "quoique = although."],
      ["choice", "Il a parlé bas ___ on ne l'entende.", ["de crainte que", "pourvu que", "à moins que"], "de crainte que", "de crainte que = for fear that."],
      ["correct", "Correct: À moins qu'il pleuve, nous sortirons.", null, "À moins qu'il ne pleuve, nous sortirons.", "Add ne explétif after à moins que."]
    ]),

  K("b2.syntax.locutions_conjonctives", "B2", "syntax",
    "Complex conjunctions", "Les locutions conjonctives complexes", 1.3, 3.3, ["b2.verbs.subjonctif_avance"],
    "dès lors que = since; pour autant que = as long as; en admettant que = assuming; en supposant que = supposing.",
    [["Dès lors que tu es prêt, nous partons.", "Since you are ready, we are leaving."], ["Pour autant que je sache, il est parti.", "As far as I know, he has left."]],
    "dès lors que takes the indicative; en admettant que and en supposant que take the subjunctive.",
    [
      ["fill", "___ que tu es prêt, nous partons.", null, "Dès lors", "dès lors que = since (indicative)."],
      ["choice", "___ que je sache, il est parti.", ["Pour autant", "En admettant", "En supposant"], "Pour autant", "pour autant que = as far as."],
      ["fill", "___ que tu sois d'accord, je signerai.", null, "En admettant", "en admettant que + subjunctive."],
      ["choice", "___ qu'il fasse beau, nous irons.", ["En supposant", "Dès lors", "Pour autant"], "En supposant", "en supposant que + subjunctive."],
      ["correct", "Correct: Dès lors que tu sois prêt, nous partons.", null, "Dès lors que tu es prêt, nous partons.", "dès lors que takes the indicative."]
    ]),

  K("b2.expressions.idiomatiques", "B2", "expressions",
    "Idiomatic expressions", "Les expressions idiomatiques", 1.3, 3.0, ["b1.expressions.synonyms"],
    "Common fixed expressions: avoir le droit de, mettre au point, tenir compte de, tenir à, se rendre compte de.",
    [["Tu as le droit de partir.", "You have the right to leave."], ["Il tient compte de mon avis.", "He takes my opinion into account."], ["Je me rends compte de mon erreur.", "I realise my mistake."]],
    "These expressions cannot be translated word-for-word from English. Learn them as chunks.",
    [
      ["fill", "Tu as le ___ de partir.", null, "droit", "avoir le droit de = have the right to."],
      ["choice", "Il ___ compte de mon avis.", ["tient", "prend", "fait"], "tient", "tenir compte de = take into account."],
      ["fill", "Je me ___ compte de mon erreur.", null, "rends", "se rendre compte de = realise."],
      ["choice", "Nous avons ___ au point un nouveau système.", ["mis", "fait", "donné"], "mis", "mettre au point = develop/refine."],
      ["correct", "Correct: Il prend compte de mon avis.", null, "Il tient compte de mon avis.", "tenir compte de, not prendre compte de."]
    ]),

  K("b2.adverbs.attitude", "B2", "adjectives",
    "Attitude adverbs", "Les adverbes d'attitude", 1.2, 3.1, ["b1.adverbs.maniere"],
    "étonnamment = surprisingly; décevant = disappointingly; heureusement = fortunately; malheureusement = unfortunately.",
    [["Étonnamment, il a réussi.", "Surprisingly, he succeeded."], ["Heureusement, personne n'a été blessé.", "Fortunately, nobody was hurt."]],
    "These sentence adverbs comment on the whole clause. They are usually set off by commas.",
    [
      ["fill", "___, il a réussi. (surprisingly)", null, "Étonnamment", "étonnamment = surprisingly."],
      ["choice", "___, personne n'a été blessé.", ["Heureusement", "Heureux", "Heureuse"], "Heureusement", "heureusement = fortunately."],
      ["fill", "___, il a perdu son travail. (unfortunately)", null, "Malheureusement", "malheureusement = unfortunately."],
      ["choice", "___, le film était mauvais.", ["Décevant", "Décevante", "Décevantement"], "Décevant", "décevant = disappointingly (adjective used as adverb in formal style)."],
      ["correct", "Correct: Heureux, il a réussi.", null, "Heureusement, il a réussi.", "Use the adverb form with -ment."]
    ]),

  K("b2.syntax.insertion", "B2", "syntax",
    "Parenthetical and inserted clauses", "Les propositions incises", 1.3, 3.2, ["b2.syntax.concordance"],
    "Insert a comment with je pense, dit-il, semble-t-il, paraît-il. These clauses are set off by commas.",
    [["Il viendra, je pense, demain.", "He will come tomorrow, I think."], ["'Je suis prêt', dit-il.", "'I am ready', he said."]],
    "Inversion is common after inserted speech tags: dit-il, pense-t-il. Use hyphens.",
    [
      ["fill", "Il viendra, je ___, demain.", null, "pense", "je pense = I think."],
      ["choice", "'Je suis prêt', ___ .", ["dit-il", "il dit", "a dit"], "dit-il", "Inversion after direct speech."],
      ["fill", "Elle est, ___, très compétente.", null, "semble-t-il", "semble-t-il = it seems."],
      ["choice", "'Partons', ___ -elle.", ["dit", "a dit", "disait"], "dit", "dit-elle with inversion."],
      ["correct", "Correct: Il viendra je pense demain.", null, "Il viendra, je pense, demain.", "Set off the inserted clause with commas."]
    ]),

  K("b2.expressions.registre_shift", "B2", "expressions",
    "Register shifts", "Les changements de registre", 1.3, 3.0, ["b2.expressions.idiomatiques"],
    "Formal: nous / passif / nominalisation / subjonctif. Informal: on / tutoiement / ellipsis / fillers.",
    [["Formal: Nous vous prions de bien vouloir...", "We beg you to kindly..."], ["Informal: Tu peux me filer un coup de main ?", "Can you give me a hand?"]],
    "TCF and DELF test register awareness: choose the appropriate level for the context.",
    [
      ["choice", "Which is formal?", ["Nous vous prions de...", "Tu peux...", "Vas-y !"], "Nous vous prions de...", "Formal request."],
      ["fill", "Informal: Tu peux me ___ un coup de main ?", null, "filer", "filer = give (informal)."],
      ["choice", "Which is informal?", ["On y va ?", "Partons-nous ?", "Allons-nous partir ?"], "On y va ?", "on + familiar verb."],
      ["fill", "Formal: Veuillez ___ patienter.", null, "nous", "Veuillez + infinitive (formal)."],
      ["correct", "Correct: Tu peux me donner un coup de main ? (formal letter)", null, "Pourriez-vous m'accorder un peu de temps ?", "Adjust register to formal context."]
    ]),

  /* ---------------- added later: high-frequency gaps ---------------- */

  K("a1.verbs.ir_regular", "A1", "verbs",
    "Regular -ir verbs: finir", "Les verbes en -ir", 1.2, 1.7, ["a0.er.present"],
    "Regular -ir verbs add -is, -is, -it, -issons, -issez, -issent: finir → je finis, nous finissons.",
    [["Je finis mon travail.", "I finish my work."], ["Nous choisissons un film.", "We choose a film."], ["Ils réussissent.", "They succeed."]],
    "The plural forms grow -iss-: nous finissons, not *nous finons*.",
    [
      ["fill", "Je ___ (finir) à cinq heures.", null, "finis", "je + finir = finis."],
      ["choice", "Nous ___ (choisir) un restaurant.", ["choisissons", "choisisons", "choisirons"], "choisissons", "nous + choisir = choisissons (-iss-)."],
      ["fill", "Vous ___ (réussir) toujours.", null, "réussissez", "vous + réussir = réussissez."],
      ["choice", "Ils ___ (finir) tard.", ["finissent", "finis", "finissons"], "finissent", "ils + finir = finissent."],
      ["fill", "Elle ___ (grandir) vite.", null, "grandit", "elle + grandir = grandit."]
    ]),

  K("a1.verbs.re_regular", "A1", "verbs",
    "Regular -re verbs: vendre", "Les verbes en -re", 1.2, 1.7, ["a0.er.present"],
    "-re verbs drop the -re and add -s, -s, -, -ons, -ez, -ent: vendre → je vends, il vend, nous vendons.",
    [["Je vends ma voiture.", "I sell my car."], ["Il attend le bus.", "He waits for the bus."], ["Nous répondons vite.", "We answer quickly."]],
    "The third person singular has no ending: il vend, not *il vends*.",
    [
      ["fill", "Je ___ (vendre) mon vélo.", null, "vends", "je + vendre = vends."],
      ["choice", "Il ___ (attendre) le train.", ["attend", "attends", "attendent"], "attend", "il + attendre = attend (no ending)."],
      ["fill", "Nous ___ (répondre) à la question.", null, "répondons", "nous + répondre = répondons."],
      ["choice", "Elles ___ (descendre).", ["descendent", "descend", "descendes"], "descendent", "elles + descendre = descendent."],
      ["fill", "Vous ___ (perdre) du temps.", null, "perdez", "vous + perdre = perdez."]
    ]),

  K("a1.verbs.irregular_oir", "A1", "verbs",
    "voir, croire, boire", "Les verbes voir, croire, boire", 1.3, 1.9, ["a0.er.present"],
    "Three very common -oir verbs: voir (je vois, nous voyons), croire (je crois, nous croyons), boire (je bois, nous buvons).",
    [["Je vois la mer.", "I see the sea."], ["Je crois que oui.", "I think so."], ["Nous buvons de l'eau.", "We drink water."]],
    "boire changes stem in the plural: nous buvons, vous buvez, ils boivent.",
    [
      ["fill", "Je ___ (voir) un film.", null, "vois", "je + voir = vois."],
      ["choice", "Nous ___ (croire) à cette idée.", ["croyons", "croivons", "crois"], "croyons", "nous + croire = croyons."],
      ["fill", "Ils ___ (boire) du café.", null, "boivent", "ils + boire = boivent."],
      ["choice", "Tu ___ (voir) la différence ?", ["vois", "voit", "voyons"], "vois", "tu + voir = vois."],
      ["fill", "Vous ___ (boire) trop de soda.", null, "buvez", "vous + boire = buvez."]
    ]),

  K("a1.nouns.numbers_big", "A1", "articles",
    "Numbers 20–100", "Les nombres de 20 à 100", 1.1, 1.5, ["a0.nouns.numbers"],
    "20 vingt, 30 trente, 40 quarante, 50 cinquante, 60 soixante. 70 = soixante-dix, 80 = quatre-vingts, 90 = quatre-vingt-dix. 100 = cent.",
    [["vingt et un", "twenty-one"], ["quatre-vingts", "eighty"], ["cent euros", "one hundred euros"]],
    "70–99 are built on 60 and 80: 75 = soixante-quinze, 92 = quatre-vingt-douze.",
    [
      ["fill", "25 = vingt-___.", null, "cinq", "vingt-cinq = 25."],
      ["choice", "80 = ?", ["quatre-vingts", "huitante", "octante"], "quatre-vingts", "80 = quatre-vingts (with -s)."],
      ["fill", "90 = quatre-vingt-___.", null, "dix", "quatre-vingt-dix = 90."],
      ["choice", "71 = ?", ["soixante et onze", "septante et un", "soixante-onze"], "soixante et onze", "71 = soixante et onze (with et)."],
      ["fill", "100 = ___.", null, "cent", "cent = 100."]
    ]),

  K("a1.expressions.date", "A1", "expressions",
    "The date and ordinal numbers", "La date et les nombres ordinaux", 1.1, 1.6, ["a0.nouns.days_months", "a0.nouns.numbers"],
    "Dates use le + number + month: le 1er mai, le 2 juin. Only the 1st is ordinal (premier / 1er); the rest use cardinal numbers.",
    [["le premier janvier", "the first of January"], ["le 14 juillet", "the fourteenth of July"], ["Nous sommes le 3 mars.", "It's the 3rd of March."]],
    "Only 'first' is ordinal: le 1er mai, but le 2 mai (not *le 2ème mai*).",
    [
      ["fill", "Le ___ mai (1st).", null, "premier", "the 1st = le premier (1er)."],
      ["choice", "le 2 juin = ?", ["the second of June", "the two June", "June two"], "the second of June", "Dates read 'the Nth of Month'."],
      ["fill", "Nous sommes le 14 ___.", null, "juillet", "14 July = le 14 juillet."],
      ["choice", "Which is correct for the 1st?", ["le 1er mai", "le 1ème mai", "le un mai"], "le 1er mai", "1er is the abbreviation of premier."],
      ["fill", "Mon anniversaire est le 3 ___.", null, "mars", "3 March = le 3 mars."]
    ]),

  K("a2.syntax.comparison_quantity", "A2", "syntax",
    "Comparing quantities", "Comparer des quantités", 1.2, 2.2, ["a1.adjectives.comparative", "a1.expressions.quantity"],
    "Compare amounts with plus de / autant de / moins de + noun + que: plus de livres que, autant d'argent que, moins de temps que.",
    [["J'ai plus de livres que toi.", "I have more books than you."], ["Elle a autant d'argent que moi.", "She has as much money as me."], ["Nous avons moins de temps que prévu.", "We have less time than planned."]],
    "de becomes d' before a vowel: autant d'argent, not *autant de argent*.",
    [
      ["fill", "J'ai plus ___ livres que toi.", null, "de", "plus de + noun."],
      ["choice", "She has as much money: Elle a ___ d'argent que moi.", ["autant", "aussi", "plus"], "autant", "as much = autant de."],
      ["fill", "Nous avons moins ___ temps.", null, "de", "moins de + noun."],
      ["choice", "Which is correct?", ["autant d'amis", "autant de amis", "aussi d'amis"], "autant d'amis", "de → d' before a vowel."],
      ["fill", "Il y a plus ___ monde aujourd'hui.", null, "de", "plus de monde = more people."]
    ]),

  K("a2.verbs.imperatif_pronoms", "A2", "verbs",
    "Imperative with object pronouns", "L'impératif et les pronoms", 1.3, 2.5, ["a1.verbs.imperative", "a2.pronouns.cod"],
    "In the affirmative imperative, pronouns follow the verb with a hyphen: donne-le-moi, parlez-lui, asseyez-vous. In the negative, they go before: ne le lui donne pas.",
    [["Donne-le-moi.", "Give it to me."], ["Parlez-lui.", "Speak to him."], ["Ne le lui dis pas.", "Don't tell him."]],
    "Affirmative: pronoun after the verb (donne-le). Negative: pronoun before the verb (ne le donne pas).",
    [
      ["choice", "Give it to me: ___.", ["Donne-le-moi", "Me le donne", "Donne-moi le"], "Donne-le-moi", "Affirmative: verb + le + moi."],
      ["fill", "Speak to him: Parlez-___.", null, "lui", "parler à lui → parlez-lui."],
      ["choice", "Don't tell him: ___.", ["Ne le lui dis pas", "Ne dis-le-lui pas", "Dis-le-lui ne pas"], "Ne le lui dis pas", "Negative: ne + pronouns + verb + pas."],
      ["fill", "Sit down (vous): Asseyez-___.", null, "vous", "Reflexive imperative keeps the pronoun: asseyez-vous."],
      ["choice", "Give them to us: ___.", ["Donne-les-nous", "Donne-nous-les", "Nous les donne"], "Donne-les-nous", "Order: le/la/les before nous."]
    ]),

  K("a2.verbs.venir_tenir", "A2", "verbs",
    "venir, tenir and their derivatives", "venir, tenir et leurs dérivés", 1.3, 2.4, ["a0.verbs.venir"],
    "venir and tenir share a stem pattern: je viens / tiens, nous venons / tenons, ils viennent / tiennent. Derivatives follow: devenir, revenir, obtenir, appartenir.",
    [["Il devient médecin.", "He is becoming a doctor."], ["Elle revient demain.", "She comes back tomorrow."], ["Nous obtenons un résultat.", "We get a result."]],
    "The plural stem drops the -ien-: nous venons, vous tenez, ils viennent.",
    [
      ["fill", "Il ___ (devenir) professeur.", null, "devient", "il + devenir = devient."],
      ["choice", "Nous ___ (tenir) à vous remercier.", ["tenons", "tiennons", "tenons pas"], "tenons", "nous + tenir = tenons."],
      ["fill", "Ils ___ (revenir) lundi.", null, "reviennent", "ils + revenir = reviennent."],
      ["choice", "You get (obtenir): Vous ___.", ["obtenez", "obtiendrez", "obtenez pas"], "obtenez", "vous + obtenir = obtenez."],
      ["fill", "Elle ___ (appartenir) à ce club.", null, "appartient", "elle + appartenir = appartient."]
    ]),

  /* ---------------- breadth pass: high-frequency gaps ---------------- */

  K("a2.verbs.savoir_connaitre", "A2", "verbs",
    "savoir vs connaître", "savoir ou connaître ?", 1.3, 2.3, ["a1.verbs.modals"],
    "savoir = to know a fact or how to do something (+ infinitive). connaître = to know a person, place or work (be familiar with).",
    [["Je sais nager.", "I know how to swim."], ["Je connais Marie.", "I know Marie."], ["Tu sais où il habite ?", "Do you know where he lives?"]],
    "Both mean 'know'. savoir for facts and skills, connaître for people, places and works. Never *je connais nager*.",
    [
      ["fill", "Je ___ nager. (savoir)", null, "sais", "savoir + infinitive = know how to."],
      ["choice", "Je ___ Paris.", ["connais", "sais", "connaît"], "connais", "A place you are familiar with → connaître."],
      ["fill", "Tu ___ où il habite ? (savoir)", null, "sais", "Knowing a fact → savoir."],
      ["choice", "She knows the answer: Elle ___ la réponse.", ["sait", "connaît", "sais"], "sait", "A fact → savoir."],
      ["fill", "Nous ___ bien ce restaurant. (connaître)", null, "connaissons", "Being familiar with a place → connaître."]
    ]),

  K("a2.verbs.devoir_falloir", "A2", "verbs",
    "devoir vs il faut", "devoir ou il faut ?", 1.3, 2.4, ["a1.verbs.modals", "a1.expressions.il_faut"],
    "devoir + infinitive = must (a named person is obliged). il faut + infinitive = it is necessary (no person named).",
    [["Je dois partir.", "I must leave."], ["Il faut partir.", "One must leave."], ["Il faut que tu partes.", "You have to leave."]],
    "il faut is impersonal: it never means 'I must'. For a person, use devoir.",
    [
      ["fill", "Je ___ partir. (devoir)", null, "dois", "je + devoir = dois."],
      ["choice", "___ faut partir.", ["Il", "Je", "Tu"], "Il", "il faut is a fixed impersonal phrase."],
      ["fill", "Tu ___ finir ce travail. (devoir)", null, "dois", "tu + devoir = dois."],
      ["choice", "Which means 'one must'?", ["Il faut", "Je dois", "Tu dois"], "Il faut", "No person named → il faut."],
      ["fill", "Il ___ que tu partes. (falloir)", null, "faut", "il faut que + subjunctive."]
    ]),

  K("a1.adjectives.irregular", "A1", "adjectives",
    "beau, nouveau, vieux before a vowel", "beau, nouveau, vieux", 1.2, 1.8, ["a1.adjectives.agreement"],
    "beau, nouveau and vieux take a special masculine form before a vowel or silent h: un bel homme, un nouvel ami, un vieil arbre.",
    [["un bel homme", "a handsome man"], ["un nouvel ami", "a new friend"], ["un vieil arbre", "an old tree"]],
    "The special form is only for masculine nouns starting with a vowel/silent h. Feminine: belle, nouvelle, vieille.",
    [
      ["choice", "un ___ homme", ["bel", "beau", "belle"], "bel", "beau → bel before a vowel/silent h."],
      ["fill", "un ___ ami (nouveau)", null, "nouvel", "nouveau → nouvel before a vowel."],
      ["choice", "un ___ arbre", ["vieil", "vieux", "vieille"], "vieil", "vieux → vieil before a vowel."],
      ["fill", "une ___ maison (beau)", null, "belle", "Feminine keeps belle."],
      ["choice", "un ___ livre", ["beau", "bel", "belle"], "beau", "A consonant follows, so the normal form beau."]
    ]),

  K("a1.prepositions.transport", "A1", "prepositions",
    "Transport: en or à", "Les moyens de transport", 1.1, 1.6, ["a1.prepositions.place"],
    "en + enclosed vehicle (en voiture, en train, en bus, en avion). à + open vehicle (à vélo, à moto, à cheval). à pied = on foot.",
    [["Je vais au travail en train.", "I go to work by train."], ["Elle rentre à vélo.", "She goes home by bike."], ["Nous y allons à pied.", "We go there on foot."]],
    "en for getting into something; à for riding on top of something (vélo, moto, cheval) and for à pied.",
    [
      ["choice", "Je vais à Paris ___ train.", ["en", "à", "dans"], "en", "You get into a train → en."],
      ["fill", "Elle rentre ___ vélo.", null, "à", "You ride on a bike → à vélo."],
      ["choice", "Nous y allons ___ pied.", ["à", "en", "par"], "à", "à pied = on foot."],
      ["fill", "Il voyage ___ avion.", null, "en", "You get into a plane → en avion."],
      ["choice", "___ voiture", ["en", "à", "sur"], "en", "You get into a car → en voiture."]
    ]),

  K("a2.pronouns.neuter_le", "A2", "pronouns",
    "The neuter le", "Le « le » neutre", 1.3, 2.5, ["a2.pronouns.cod"],
    "le can stand for a whole idea or clause, not just a masculine noun: Je le sais, Il l'a dit. This neuter le never agrees.",
    [["Je le sais.", "I know it."], ["Elle l'a dit.", "She said it."], ["C'est vrai, je te le confirme.", "That's true, I confirm it to you."]],
    "Neuter le replaces an idea, so it stays le even when the idea is feminine: C'est une bonne idée — je le pense.",
    [
      ["choice", "C'est vrai ? — Oui, je ___ sais.", ["le", "la", "les"], "le", "It replaces the idea, not a noun."],
      ["choice", "C'est une bonne idée. — Je ___ pense.", ["le", "la", "les"], "le", "Neuter le, even though idée is feminine."],
      ["fill", "Je ___ sais déjà. (it)", null, "le", "Neuter le before the verb."],
      ["choice", "Il a tout compris, il ___ a dit.", ["l'", "le", "la"], "l'", "le elides to l' before a vowel."],
      ["fill", "Nous ___ savons. (it)", null, "le", "Neuter le stays le."]
    ]),

  K("a2.pronouns.tout", "A2", "pronouns",
    "tout as a pronoun", "Le pronom tout", 1.2, 2.2, ["a2.adjectives.tout"],
    "tout as a pronoun means everything / all of it: tout va bien, c'est tout. For people it agrees: tous sont venus, elles sont toutes parties.",
    [["Tout va bien.", "Everything is fine."], ["C'est tout.", "That's all."], ["Tous sont venus.", "They all came."]],
    "tout (everything) is invariable; tous/toutes (all of them, people) agree and are pronounced differently.",
    [
      ["choice", "___ va bien.", ["Tout", "Tous", "Toute"], "Tout", "Everything → invariable tout."],
      ["fill", "C'est ___. (that's all)", null, "tout", "c'est tout = that's all."],
      ["choice", "___ sont venus. (all the students)", ["Tous", "Tout", "Toutes"], "Tous", "All of them, masculine plural → tous."],
      ["fill", "Elles sont ___ arrivées. (all)", null, "toutes", "Feminine plural → toutes."],
      ["choice", "J'ai ___ compris.", ["tout", "tous", "toute"], "tout", "Everything → tout."]
    ]),

  K("b1.verbs.faire_causatif", "B1", "verbs",
    "faire + infinitive (causative)", "Le faire causatif", 1.4, 3.4, ["a0.verbs.faire"],
    "faire + infinitive = to have/get something done: je fais réparer ma voiture (I have my car repaired), elle fait rire tout le monde.",
    [["Je fais réparer ma voiture.", "I'm having my car repaired."], ["Elle fait rire tout le monde.", "She makes everyone laugh."], ["Il s'est fait couper les cheveux.", "He had his hair cut."]],
    "The person who does the action goes after à: je fais réparer la voiture au garagiste.",
    [
      ["choice", "I have my car repaired: Je ___ réparer ma voiture.", ["fais", "fait", "faire"], "fais", "je + faire = fais."],
      ["fill", "Elle ___ rire tout le monde. (faire)", null, "fait", "elle + faire = fait."],
      ["choice", "He had his hair cut: Il s'est ___ couper les cheveux.", ["fait", "fais", "faire"], "fait", "se faire + infinitive."],
      ["fill", "Nous faisons ___ la maison. (peindre)", null, "peindre", "faire + infinitive."],
      ["choice", "The mechanic does it: Je fais réparer la voiture ___ garagiste.", ["au", "à le", "du"], "au", "à + le = au."]
    ]),

  K("b1.pronouns.ce_dont", "B1", "pronouns",
    "ce dont / ce à quoi", "ce dont, ce à quoi", 1.4, 3.6, ["b1.pronouns.relative_compose", "b1.syntax.relative_dont"],
    "ce dont = 'what ... of/about' (replaces de + thing). ce à quoi = 'what ... to/about' (replaces à + thing).",
    [["Ce dont j'ai besoin, c'est du calme.", "What I need is calm."], ["Ce à quoi je pense, c'est aux vacances.", "What I'm thinking about is the holidays."], ["Dis-moi ce dont tu as peur.", "Tell me what you're afraid of."]],
    "Use ce dont when the verb takes de (avoir besoin de, parler de); ce à quoi when it takes à (penser à, s'attendre à).",
    [
      ["choice", "___ j'ai besoin, c'est du repos.", ["Ce dont", "Ce que", "Ce à quoi"], "Ce dont", "avoir besoin de → ce dont."],
      ["fill", "Dis-moi ce ___ tu as peur. (de)", null, "dont", "avoir peur de → ce dont."],
      ["choice", "___ je pense, c'est à toi.", ["Ce à quoi", "Ce dont", "Ce que"], "Ce à quoi", "penser à → ce à quoi."],
      ["fill", "C'est exactement ce ___ je m'attendais. (à)", null, "à quoi", "s'attendre à → ce à quoi."],
      ["choice", "Which is correct?", ["Ce dont je parle", "Ce que je parle de", "Ce à quoi je parle de"], "Ce dont je parle", "parler de → ce dont."]
    ]),

];

const KP_BY_ID = {};
KPS.forEach(function (kp) { KP_BY_ID[kp.id] = kp; });

/* Reverse prerequisite index: for each point, which points list it as a
   prerequisite. Used by the lesson drawer to show "leads to" links the way
   Kwiziq cross-links a basic lesson to the advanced ones. */
const KP_DEPENDENTS = {};
KPS.forEach(function (kp) {
  (kp.prereqs || []).forEach(function (p) {
    (KP_DEPENDENTS[p] = KP_DEPENDENTS[p] || []).push(kp.id);
  });
});

/* English translations for the graded reading passages, keyed by point id.
   The passage text lives on each item (it is repeated per question so the
   reader always sees it); this map lets the reader reveal a translation
   without storing the English ten times. */
const READING_EN = {
  "reading.a1.intro":
    "Hello! My name is Marie. I am twenty-five and I live in Lyon, in France. " +
    "I am a student at the university. I study foreign languages: English and Spanish. " +
    "I really like music and cinema. At the weekend I meet my friends in a small café " +
    "near the station. We talk for hours and we drink hot chocolate.",
  "reading.a1.bakery":
    "It is eight in the morning. Paul goes into the bakery near his home. " +
    "\u00ab Hello madam! I would like a baguette and two croissants, please. \u00bb " +
    "The baker smiles: \u00ab Here you are. That is three euros twenty. \u00bb Paul pays and leaves. " +
    "He is still hungry, so he eats a croissant straight away in the street.",
  "reading.a2.weekend":
    "Next Saturday, Julie and her brother are going hiking in the mountains. " +
    "They are going to leave early in the morning, around seven, because the journey takes two hours. " +
    "They must take water, a sandwich and good shoes. " +
    "The forecast says sun but also wind. In the evening they will come back tired but happy, " +
    "and they will eat a pizza together.",
  "reading.a2.rent":
    "Flat to rent. Quiet area, near the town centre. Three rooms: a living room, " +
    "a bedroom and a fitted kitchen. Second floor, no lift. " +
    "The rent is six hundred euros a month, charges included. Available from the first of September. " +
    "To view it, call 06 12 34 56 78 after six in the evening.",
  "reading.b1.neighbourhood":
    "For ten years the neighbourhood has changed a lot. Before, there were mainly small shops " +
    "and workshops. Today the old buildings have been renovated and many restaurants have opened. " +
    "Some residents are delighted: the area is livelier and safer. " +
    "Others miss the time when rents were affordable. The council promises to build " +
    "social housing, but the works will not start for two years.",
  "reading.b2.phones":
    "Should mobile phones be banned at school? The debate comes back regularly. " +
    "Supporters of a ban believe these devices distract pupils and harm concentration. " +
    "They also point out that social media can encourage bullying between classmates. " +
    "On the other hand, some teachers stress that a phone can become a useful teaching tool, " +
    "provided it is supervised. Rather than a total ban, they propose clear rules " +
    "adapted to pupils' age.",
  "reading.b1.email":
    "Hi Marie, I am writing to you from Lyon. I arrived last night and I found a small flat near the station. " +
    "It is a bit noisy, but not very expensive. Tomorrow I start my internship at a travel agency. " +
    "I am a little nervous, but very happy. I miss you! See you soon, Lucas",
  "reading.b1.notice":
    "NOTICE TO RESIDENTS. The pool will be closed from 10 to 20 July for repairs. " +
    "During this period, residents can use the municipal pool, on rue Victor-Hugo, free of charge, " +
    "on presentation of their badge. The gym stays open. Thank you for your understanding.",
  "reading.b2.article":
    "Remote work has changed the lives of millions of employees. According to a recent study, " +
    "62% of employees prefer to work at least two days a week from home. " +
    "Companies see it as a way to cut costs, but some managers fear a drop in cooperation. " +
    "Experts recommend a hybrid model, with fixed days in the office to maintain the bond between teams.",
  "reading.b2.job_ad":
    "We are looking for a marketing assistant for our Bordeaux office. " +
    "Duties: manage social media, write newsletters and take part in advertising campaigns. " +
    "Profile: at least a bachelor's degree, fluent English, command of digital tools. " +
    "Contract: six-month fixed-term, full-time. Send a CV and cover letter before 30 September."
};
