/* Extra practice items.

   Every point shipped with five questions, which is enough to learn a rule and
   not nearly enough to keep from memorising the question instead of the rule.
   These are appended as additional kwiz-stage items, so the original five keep
   their guided / check / kwiz roles and nothing that already worked moves.

   Same tuple shape as data.js:
     [type, prompt, options, answer, explain, hint]

   Rules for anything added here:
   - a different sentence from the five already in the point, not a rephrasing;
   - exactly one defensible answer (no "il vente" vs "il y a du vent" pairs);
   - the explanation says why, not just "because it is". */

const EXTRA_ITEMS = {

  /* ---------------- A0 ---------------- */

  "a0.articles.definite": [
    ["choice", "___ hôtel", ["le", "la", "l'"], "l'", "hôtel starts with a silent h, so le becomes l'."],
    ["fill", "___ enfants jouent dehors.", null, "Les", "Plural nouns take les, whatever the gender."],
    ["choice", "Je cherche ___ clé.", ["le", "la", "les"], "la", "clé is feminine singular, so it takes la."]
  ],

  "a0.articles.indefinite": [
    ["fill", "C'est ___ idée.", null, "une", "idée is feminine, and une never elides: une idée."],
    ["choice", "Elle achète ___ livres.", ["un", "une", "des"], "des", "livres is plural, so the indefinite article is des."],
    ["fill", "Il y a ___ homme devant la porte.", null, "un", "homme is masculine singular, so it takes un."]
  ],

  "a0.pronouns.subject": [
    ["choice", "___ êtes professeur.", ["Nous", "Vous", "Ils"], "Vous", "êtes only goes with vous."],
    ["fill", "Les enfants sont petits. ___ sont petits.", null, "Ils", "les enfants is plural masculine or mixed, so ils."],
    ["fill", "___ sommes en retard.", null, "Nous", "sommes only goes with nous."]
  ],

  "a0.etre.present": [
    ["choice", "Elle ___ italienne.", ["est", "es", "sont"], "est", "elle + être = elle est."],
    ["fill", "Ils ___ à la maison.", null, "sont", "ils + être = ils sont."],
    ["fill", "On ___ prêt.", null, "est", "on is conjugated like il: on est."]
  ],

  "a0.avoir.present": [
    ["choice", "Il ___ vingt ans.", ["a", "as", "ont"], "a", "il + avoir = il a."],
    ["fill", "Vous ___ une belle maison.", null, "avez", "vous + avoir = vous avez."],
    ["fill", "Nous ___ soif.", null, "avons", "nous + avoir = nous avons."]
  ],

  "a0.er.present": [
    ["choice", "Elle ___ dans un bureau. (travailler)", ["travaille", "travailles", "travaillent"], "travaille", "elle takes the -e ending: elle travaille."],
    ["fill", "Nous ___ à la maison. (dîner)", null, "dînons", "nous takes -ons: nous dînons."],
    ["fill", "Ils ___ la télévision. (regarder)", null, "regardent", "ils takes -ent, which is silent: ils regardent."]
  ],

  "a0.nouns.gender": [
    ["choice", "___ problème", ["le", "la", "les"], "le", "Words in -ème are usually masculine: le problème."],
    ["choice", "___ culture", ["le", "la", "les"], "la", "Words in -ure are usually feminine: la culture."],
    ["fill", "___ département", null, "le", "Words in -ment are usually masculine: le département."]
  ],

  "a0.nouns.plural": [
    ["fill", "un cheval → des ___", null, "chevaux", "-al becomes -aux: un cheval, des chevaux."],
    ["choice", "un nez → des ___", ["nez", "nezz", "nezes"], "nez", "Nouns ending in -s, -x or -z do not change."],
    ["fill", "une fenêtre → des ___", null, "fenêtres", "Most nouns just take an -s: des fenêtres."]
  ],

  "a0.verbs.aller": [
    ["choice", "Elle ___ au marché.", ["va", "vas", "vont"], "va", "elle + aller = elle va."],
    ["fill", "Ils ___ à la plage.", null, "vont", "ils + aller = ils vont."],
    ["choice", "Vous ___ au théâtre ce soir.", ["allez", "allons", "vont"], "allez", "vous + aller = vous allez."]
  ],

  "a0.adjectives.position": [
    ["choice", "a beautiful garden", ["un beau jardin", "un jardin beau"], "un beau jardin", "beau belongs to the short list that goes before the noun."],
    ["fill", "une voiture ___ (French)", null, "française", "Nationalities are longer adjectives and follow the noun."],
    ["choice", "a new book", ["un nouveau livre", "un livre nouveau"], "un nouveau livre", "nouveau goes before the noun, like beau and vieux."]
  ],

  "a0.expressions.il_y_a": [
    ["fill", "___ beaucoup de monde ici.", null, "Il y a", "il y a covers both 'there is' and 'there are'."],
    ["choice", "Il n'y a pas ___ école dans ce village.", ["d'", "de", "des"], "d'", "de becomes d' before a vowel: pas d'école."],
    ["fill", "___ un problème ? (question)", null, "Est-ce qu'il y a", "A question wraps il y a in est-ce que: est-ce qu'il y a."]
  ],

  "a0.syntax.cest_vs_il_est": [
    ["choice", "___ une belle ville.", ["C'est", "Il est", "Elle est"], "C'est", "A noun with its article takes c'est: c'est une ville."],
    ["fill", "Mon père ___ ingénieur.", null, "est", "A profession after a name uses il est / elle est, with no article."],
    ["choice", "___ très intelligent.", ["C'est", "Il est", "Il a"], "Il est", "An adjective describing a person takes il est."]
  ],

  "a0.verbs.faire": [
    ["choice", "Elle ___ ses devoirs.", ["fait", "fais", "font"], "fait", "elle + faire = elle fait."],
    ["fill", "Vous ___ du vélo.", null, "faites", "vous + faire = vous faites, not 'faisez'."],
    ["fill", "Ils ___ la fête.", null, "font", "ils + faire = ils font."]
  ],

  "a0.verbs.venir": [
    ["choice", "Elle ___ de Rome.", ["vient", "viens", "viennent"], "vient", "elle + venir = elle vient."],
    ["fill", "Ils ___ de partir.", null, "viennent", "ils + venir = ils viennent, with a double n."],
    ["fill", "Je ___ avec toi.", null, "viens", "je + venir = je viens."]
  ],

  "a0.adjectives.colors": [
    ["choice", "une voiture ___ (rouge)", ["rouge", "rougee", "rouges"], "rouge", "rouge already ends in -e, so the feminine looks the same."],
    ["fill", "des fleurs ___ (blanc)", null, "blanches", "blanc → blanche → blanches: feminine plural takes both marks."],
    ["fill", "un pull ___ (gris)", null, "gris", "gris is invariable in the masculine singular; only the plural adds -s."]
  ],

  "a0.expressions.time": [
    ["fill", "Il est deux heures et ___ . (2:15)", null, "quart", "A quarter past is et quart."],
    ["choice", "Il est dix heures ___ . (10:45)", ["moins le quart", "et quart", "et demie"], "moins le quart", "A quarter to is moins le quart."],
    ["fill", "Il est une ___ . (1:00)", null, "heure", "One o'clock is singular: une heure, not une heures."]
  ],

  "a0.expressions.weather": [
    ["choice", "It is hot.", ["Il fait chaud.", "Il est chaud.", "Il a chaud."], "Il fait chaud.", "Weather uses il fait + adjective. il a chaud means a person is hot."],
    ["fill", "Il fait ___ au printemps. (nice)", null, "beau", "Nice weather is il fait beau."],
    ["fill", "En automne, il ___ souvent. (pleuvoir)", null, "pleut", "Rain has its own verb: il pleut, never il fait pluie."]
  ],

  "a0.syntax.questions_intonation": [
    ["fill", "Il ___ français ? (être, il)", null, "est", "Same word order as a statement, only the question mark and the rising tone change."],
    ["choice", "Which one is a statement?", ["Tu parles français.", "Tu parles français ?", "Parles-tu français ?"], "Tu parles français.", "Only the full stop makes it a statement."],
    ["fill", "Elle ___ à Paris ? (habiter)", null, "habite", "Intonation questions keep the normal conjugation: elle habite."]
  ],

  "a0.verbs.prendre": [
    ["choice", "Elle ___ un taxi.", ["prend", "prends", "prennent"], "prend", "elle + prendre = elle prend, with no -s."],
    ["fill", "Ils ___ le petit-déjeuner.", null, "prennent", "ils + prendre = ils prennent, double n."],
    ["fill", "Nous ___ une décision.", null, "prenons", "nous + prendre = nous prenons, single n."]
  ],

  "a0.nouns.days_months": [
    ["fill", "The month before juin is ___ .", null, "mai", "mai comes before juin."],
    ["choice", "The day after vendredi is ___ .", ["samedi", "dimanche", "jeudi"], "samedi", "The week runs lundi → dimanche, so samedi follows vendredi."],
    ["fill", "The first month of the year is ___ .", null, "janvier", "janvier, février, mars…"]
  ],

  "a0.expressions.greetings": [
    ["choice", "You leave at night.", ["Bonne nuit", "Bonsoir", "Bonjour"], "Bonne nuit", "Bonne nuit is for going to bed; bonsoir is for arriving in the evening."],
    ["choice", "You greet a friend in the morning, casually. Which one?", ["Salut", "Bonsoir", "Bonne nuit"], "Salut", "Salut is the informal hello between friends; bonsoir is evening and bonne nuit is for going to bed."],
    ["choice", "Someone thanks you. You answer:", ["De rien", "S'il vous plaît", "Excusez-moi"], "De rien", "De rien is the standard reply to merci."]
  ],

  "a0.nouns.numbers": [
    ["fill", "3 = ___", null, "trois", "trois."],
    ["fill", "16 = ___", null, "seize", "After seize the pattern becomes dix-sept, dix-huit, dix-neuf."],
    ["choice", "19 =", ["dix-neuf", "dix-neufs", "dixneuf"], "dix-neuf", "Teens from 17 take a hyphen: dix-sept, dix-huit, dix-neuf."]
  ],

  /* ---------------- A1 ---------------- */

  "a1.negation.ne_pas": [
    ["choice", "Tu ___ pas le temps.", ["as", "n'as", "es"], "n'as", "ne elides to n' before a vowel: tu n'as pas."],
    ["fill", "Ils ne travaillent ___ le samedi.", null, "pas", "pas follows the conjugated verb."],
    ["correct", "Correct this sentence: Elle ne mange pas de la viande.", null, "Elle ne mange pas de viande.", "After a negation, du / de la / des all become de."]
  ],

  "a1.questions.est_ce_que": [
    ["fill", "___ est-ce que tu pars ? (when)", null, "Quand", "The question word goes before est-ce que."],
    ["choice", "___ est-ce que tu préfères ? (what)", ["Qu'est-ce que", "Qui", "Où"], "Qu'est-ce que", "qu'est-ce que asks about a thing; qui asks about a person."],
    ["fill", "Est-ce que vous ___ français ? (parler)", null, "parlez", "est-ce que does not change the conjugation: vous parlez."]
  ],

  "a1.possessives": [
    ["choice", "___ école (my)", ["mon", "ma", "mes"], "mon", "école is feminine, but a feminine noun starting with a vowel takes mon."],
    ["fill", "___ frère est médecin. (her)", null, "Son", "The form agrees with the noun, not the owner: son frère."],
    ["choice", "___ chaussures sont neuves. (his)", ["son", "sa", "ses"], "ses", "chaussures is plural, so ses."]
  ],

  "a1.adjectives.agreement": [
    ["fill", "une robe ___ (rouge)", null, "rouge", "rouge already ends in -e, so the feminine looks identical."],
    ["choice", "des amis ___ (italien)", ["italien", "italiens", "italiennes"], "italiens", "Masculine plural adds -s: italiens."],
    ["fill", "une porte ___ (ouvert)", null, "ouverte", "ouvert → ouverte in the feminine."]
  ],

  "a1.aller.prepositions": [
    ["fill", "Elle va ___ Japon.", null, "au", "Masculine countries take au: au Japon."],
    ["choice", "Nous allons ___ Italie.", ["en", "au", "aux"], "en", "Feminine countries take en: en Italie."],
    ["fill", "Ils vont ___ Louvre. (à + le)", null, "au", "à + le contracts to au: au Louvre."]
  ],

  "a1.passe_recent": [
    ["fill", "Vous ___ de commencer. (venir)", null, "venez", "vous + venir = vous venez."],
    ["choice", "Nous venons ___ arriver.", ["de", "d'", "des"], "d'", "de becomes d' before a vowel: d'arriver."],
    ["fill", "Elle ___ de téléphoner. (venir)", null, "vient", "elle + venir = elle vient."]
  ],

  "a1.articles.partitive": [
    ["fill", "Il mange ___ riz.", null, "du", "An unspecified amount of a masculine noun: du riz."],
    ["choice", "Elle boit ___ eau.", ["de l'", "du", "de la"], "de l'", "eau starts with a vowel, so du / de la become de l'."],
    ["choice", "Tu prends ___ fromage ?", ["du", "de", "le"], "du", "fromage is masculine and the quantity is unspecified: du fromage."]
  ],

  "a1.adjectives.demonstrative": [
    ["choice", "___ hôtel", ["ce", "cet", "cette", "ces"], "cet", "A masculine noun starting with a silent h takes cet."],
    ["fill", "___ maison est vieille. (this)", null, "Cette", "maison is feminine: cette."],
    ["choice", "___ livres sont à moi.", ["ce", "cet", "cette", "ces"], "ces", "livres is plural: ces."]
  ],

  "a1.verbs.futur_proche": [
    ["fill", "Ils vont ___ (partir).", null, "partir", "aller + infinitive: the second verb stays in the infinitive."],
    ["choice", "Nous ___ manger.", ["allons", "allez", "vont"], "allons", "nous + aller = nous allons."],
    ["fill", "Elle va ___ (arriver).", null, "arriver", "The infinitive never agrees: elle va arriver."]
  ],

  "a1.verbs.reflexive": [
    ["choice", "Je ___ réveille à six heures.", ["me", "te", "se"], "me", "je takes me: je me réveille."],
    ["fill", "Vous ___ levez tôt. (se lever)", null, "vous", "vous takes the reflexive pronoun vous."],
    ["choice", "Elles ___ rencontrent souvent.", ["se", "s'", "nous"], "se", "rencontrer starts with a consonant, so se does not elide."]
  ],

  "a1.verbs.imperative": [
    ["fill", "___ la porte ! (ouvrir, tu)", null, "Ouvre", "-er verbs drop the -s in the tu imperative: ouvre !"],
    ["choice", "___ ici ! (venir, vous)", ["Venez", "Viens", "Venir"], "Venez", "The vous imperative keeps its -ez ending: venez."],
    ["fill", "___ tes devoirs ! (faire, tu)", null, "Fais", "faire is irregular in the imperative: fais."]
  ],

  "a1.prepositions.place": [
    ["fill", "Le chat dort ___ le canapé. (on)", null, "sur", "sur = on top of."],
    ["choice", "L'école est ___ la banque et la poste. (between)", ["entre", "devant", "derrière"], "entre", "entre = between two things."],
    ["fill", "Il est ___ moi. (in front of)", null, "devant", "devant = in front of."]
  ],

  "a1.pronouns.stress": [
    ["choice", "C'est ___ qui l'ai fait. (me)", ["moi", "me", "je"], "moi", "Emphasis uses the stress pronoun: c'est moi qui…"],
    ["fill", "Elle travaille avec ___ . (us)", null, "nous", "After a preposition, use the stress pronoun: avec nous."],
    ["choice", "Tu penses à ___ ? (them, feminine)", ["elles", "les", "leur"], "elles", "After à, the stress pronoun is required: à elles."]
  ],

  "a1.verbs.modals": [
    ["choice", "Je ___ partir maintenant.", ["dois", "doit", "devez"], "dois", "je + devoir = je dois."],
    ["fill", "Elles ___ venir. (pouvoir)", null, "peuvent", "elles + pouvoir = elles peuvent."],
    ["fill", "Nous ___ attendre. (pouvoir)", null, "pouvons", "nous + pouvoir = nous pouvons."]
  ],

  "a1.adjectives.comparative": [
    ["fill", "Il est aussi grand ___ son frère.", null, "que", "Comparisons close with que: aussi grand que."],
    ["choice", "C'est le ___ restaurant de la ville.", ["meilleur", "mieux", "plus bon"], "meilleur", "bon becomes meilleur; mieux replaces bien, not bon."],
    ["fill", "Elle chante ___ bien que sa sœur. (as)", null, "aussi", "aussi … que = as … as."]
  ],

  "a1.syntax.negation_rien_jamais": [
    ["fill", "Il ne mange ___ . (nothing)", null, "rien", "rien replaces pas and means nothing."],
    ["fill", "Nous ne buvons ___ de café. (never)", null, "jamais", "jamais replaces pas and means never."],
    ["correct", "Correct: Je ne vois pas rien.", null, "Je ne vois rien.", "rien already makes the sentence negative, so pas has to go."]
  ],

  "a1.expressions.quantity": [
    ["fill", "Il y a trop ___ sucre.", null, "de", "Quantity words are followed by de, with no article."],
    ["choice", "J'ai assez ___ argent.", ["d'", "de", "des"], "d'", "de becomes d' before a vowel: assez d'argent."],
    ["fill", "Nous avons peu ___ temps.", null, "de", "peu de + noun, no article."]
  ],

  "a1.prepositions.time": [
    ["choice", "Nous sommes ___ printemps.", ["au", "en", "à"], "au", "Seasons take au except en automne: au printemps."],
    ["fill", "Elle arrive ___ trois jours. (in, from now)", null, "dans", "dans + a duration means in that much time from now."],
    ["choice", "Il travaille ___ matin.", ["le", "en", "à"], "le", "Habitual days take le: le matin, le lundi."]
  ],

  "a1.verbs.irregular_ir": [
    ["choice", "Elle ___ à midi. (partir)", ["part", "pars", "partent"], "part", "elle + partir = elle part, no -s."],
    ["fill", "Ils ___ tard. (sortir)", null, "sortent", "ils + sortir = ils sortent."],
    ["fill", "Tu ___ bien ? (dormir)", null, "dors", "tu + dormir = tu dors."]
  ],

  "a1.verbs.stem_changing": [
    ["fill", "Elle ___ du café. (préférer)", null, "préfère", "é becomes è in the singular: elle préfère."],
    ["choice", "Nous ___ la porte. (appeler)", ["appelons", "appellons", "appelont"], "appelons", "The double consonant only appears in je / tu / il / ils: nous appelons."],
    ["fill", "Ils ___ du pain. (acheter)", null, "achètent", "acheter adds a grave accent in the singular and 3rd plural: ils achètent."]
  ],

  "a1.pronouns.indefinite": [
    ["fill", "___ est venu hier. (someone)", null, "Quelqu'un", "quelqu'un = someone, and it is singular."],
    ["choice", "Tu as vu ___ ? (something)", ["quelque chose", "quelqu'un", "rien"], "quelque chose", "quelque chose = something (a thing, not a person)."],
    ["fill", "Il n'y a ___ à faire. (nothing)", null, "rien", "rien = nothing, and it is already negative."]
  ],

  "a1.syntax.connectors_basic": [
    ["fill", "Il est malade, ___ il ne vient pas. (so)", null, "donc", "donc = so / therefore."],
    ["choice", "Je prends du thé ___ du café.", ["ou", "et", "mais"], "ou", "ou = or."],
    ["fill", "Elle reste à la maison ___ elle est fatiguée. (because)", null, "parce qu'", "parce que elides before a vowel: parce qu'elle."]
  ],

  "a1.expressions.food": [
    ["fill", "L'___ , s'il vous plaît. (bill)", null, "addition", "l'addition is the bill."],
    ["choice", "I would like the set menu.", ["le menu", "la carte", "l'addition"], "le menu", "le menu is the fixed set meal; la carte is the list you order from."],
    ["fill", "Nous voudrions ___ une table. (to book)", null, "réserver", "réserver une table = to book a table."]
  ],

  "a1.adjectives.position_meaning": [
    ["choice", "une chemise propre", ["a clean shirt", "my own shirt", "an expensive shirt"], "a clean shirt", "After the noun, propre means clean."],
    ["fill", "un ___ ami (dear)", null, "cher", "Before the noun, cher means dear: un cher ami."],
    ["choice", "mon ancien collègue", ["my former colleague", "my old colleague", "my new colleague"], "my former colleague", "Before the noun, ancien means former."]
  ],

  "a1.negation.plus_personne": [
    ["fill", "Elle ne travaille ___ ici. (no longer)", null, "plus", "ne … plus = no longer."],
    ["choice", "Nobody is here.", ["Personne n'est ici.", "Rien n'est ici.", "Personne est ici."], "Personne n'est ici.", "personne is the subject, so ne still goes before the verb."],
    ["fill", "Je ne le vois ___ . (no longer)", null, "plus", "plus sits where pas would sit."]
  ],

  "a1.expressions.il_faut": [
    ["fill", "Il ___ prendre un parapluie.", null, "faut", "il faut is always third person singular."],
    ["choice", "You must not smoke here.", ["Il ne faut pas fumer ici.", "Il ne faut fumer pas ici.", "Il faut ne pas fumer ici."], "Il ne faut pas fumer ici.", "ne and pas wrap faut, not the infinitive."],
    ["fill", "Il faut ___ à l'heure. (arriver)", null, "arriver", "il faut is followed by the infinitive."]
  ],

  "a1.adverbs.intensity": [
    ["fill", "Elle est ___ gentille. (very)", null, "très", "très = very."],
    ["choice", "Il fait ___ froid pour sortir.", ["trop", "très", "assez"], "trop", "trop = too much, and here it explains why you stay in."],
    ["fill", "J'ai ___ mangé. (enough)", null, "assez", "assez = enough."]
  ],

  "a1.adverbs.place_time": [
    ["fill", "Il est arrivé ___ . (yesterday)", null, "hier", "hier = yesterday."],
    ["choice", "We are leaving ___ . (tomorrow)", ["demain", "hier", "maintenant"], "demain", "demain = tomorrow."],
    ["fill", "Elle habite ___ . (here)", null, "ici", "ici = here."]
  ],

  "a1.pronouns.on": [
    ["fill", "En France, ___ mange beaucoup de pain. (people)", null, "on", "on stands for people in general."],
    ["choice", "On ___ souvent au cinéma.", ["va", "vont", "allons"], "va", "on always takes the third person singular."],
    ["fill", "___ ne sait jamais. (one)", null, "On", "on ne sait jamais = you never know."]
  ],

  "a1.verbs.ir_regular": [
    ["fill", "Tu ___ (choisir) le menu.", null, "choisis", "tu takes -is: tu choisis."],
    ["choice", "Elle ___ (finir) à six heures.", ["finit", "finis", "finissent"], "finit", "elle takes -it: elle finit."],
    ["fill", "Nous ___ (réussir) toujours.", null, "réussissons", "The plural stem adds -iss: nous réussissons."]
  ],

  "a1.verbs.re_regular": [
    ["fill", "Tu ___ (attendre) le bus.", null, "attends", "tu takes -s: tu attends."],
    ["choice", "Nous ___ (vendre) la maison.", ["vendons", "vendez", "vendent"], "vendons", "nous takes -ons: nous vendons."],
    ["fill", "Ils ___ (répondre) vite.", null, "répondent", "ils takes -ent: ils répondent."]
  ],

  "a1.verbs.irregular_oir": [
    ["fill", "Nous ___ (voir) la mer.", null, "voyons", "voir has a y in the nous and vous forms: nous voyons."],
    ["choice", "Ils ___ (boire) du thé.", ["boivent", "boive", "buvons"], "boivent", "ils + boire = ils boivent."],
    ["fill", "Elle ___ (croire) tout.", null, "croit", "elle + croire = elle croit."]
  ],

  "a1.nouns.numbers_big": [
    ["fill", "40 = ___", null, "quarante", "quarante."],
    ["fill", "70 = ___", null, "soixante-dix", "French counts 70 as sixty-ten."],
    ["choice", "99 =", ["quatre-vingt-dix-neuf", "quatre-vingt-dix-neufs", "nonante-neuf"], "quatre-vingt-dix-neuf", "Only quatre-vingts keeps its -s, and only when nothing follows it."]
  ],

  "a1.expressions.date": [
    ["fill", "Nous sommes le 25 ___ . (December)", null, "décembre", "Months are lowercase: décembre."],
    ["choice", "Which month comes after août?", ["septembre", "octobre", "juillet"], "septembre", "août → septembre → octobre."],
    ["fill", "Le ___ juillet (14th).", null, "quatorze", "Only the 1st is ordinal: le 14 juillet uses the cardinal number."]
  ],

  "a1.adjectives.irregular": [
    ["fill", "un ___ hôtel (beau)", null, "bel", "beau becomes bel before a vowel or silent h."],
    ["choice", "un ___ ordinateur (nouveau)", ["nouvel", "nouveau", "nouvelle"], "nouvel", "nouveau becomes nouvel before a vowel."],
    ["fill", "un ___ homme (vieux)", null, "vieil", "vieux becomes vieil before a vowel or silent h."]
  ],

  "a1.prepositions.transport": [
    ["fill", "Nous allons ___ bus. (by)", null, "en", "Enclosed vehicles take en: en bus."],
    ["choice", "Elle va au travail ___ moto.", ["à", "en", "dans"], "à", "Open vehicles take à: à moto, à vélo."],
    ["fill", "Ils voyagent ___ train. (by)", null, "en", "en train, en avion, en voiture."]
  ],

  /* ---------------- A2 ---------------- */

  "a2.passe_compose.avoir": [
    ["fill", "Tu ___ fini ? (avoir)", null, "as", "tu + avoir = tu as."],
    ["choice", "Elle a ___ (descendre)", ["descendu", "descendue", "descendus"], "descendu", "With avoir the participle never agrees with the subject: elle a descendu."],
    ["fill", "Nous avons ___ la porte. (ouvrir)", null, "ouvert", "ouvrir has the irregular participle ouvert."]
  ],

  "a2.passe_compose.etre": [
    ["fill", "Nous sommes ___ (partir)", null, "partis", "With être the participle agrees: nous sommes partis."],
    ["choice", "Elle est ___ (aller)", ["allé", "allée", "allés"], "allée", "The subject is feminine singular: elle est allée."],
    ["fill", "Elles sont ___ (arriver)", null, "arrivées", "Feminine plural takes -es: elles sont arrivées."]
  ],

  "a2.imparfait.formation": [
    ["fill", "Je ___ (parler) souvent à lui.", null, "parlais", "The stem is parl- from nous parlons: je parlais."],
    ["choice", "Ils ___ (être) contents.", ["étaient", "étaients", "seraient"], "étaient", "être has the irregular stem ét-: ils étaient."],
    ["fill", "Tu ___ (avoir) raison.", null, "avais", "avoir has the stem av-: tu avais."]
  ],

  "a2.pronouns.cod": [
    ["fill", "Tu connais cette fille ? — Oui, je ___ connais.", null, "la", "A feminine singular direct object becomes la."],
    ["choice", "Il achète les billets ? — Oui, il ___ achète.", ["le", "la", "les"], "les", "A plural direct object becomes les, whatever the gender."],
    ["fill", "Vous voyez le musée ? — Oui, nous ___ voyons.", null, "le", "le musée is masculine singular: le."]
  ],

  "a2.pronouns.y_en": [
    ["fill", "Tu penses à ton travail ? — Oui, j'___ pense.", null, "y", "y replaces à + a thing."],
    ["choice", "Elle a du pain ? — Oui, elle ___ a.", ["y", "en", "le"], "en", "en replaces de + a quantity: elle en a."],
    ["fill", "Nous allons à la plage ? — Oui, nous ___ allons.", null, "y", "y replaces à + a place."]
  ],

  "a2.pronouns.coi": [
    ["fill", "Il écrit à ses parents. → Il ___ écrit.", null, "leur", "à + plural person becomes leur, with no -s."],
    ["choice", "Je téléphone à Paul. → Je ___ téléphone.", ["lui", "leur", "le"], "lui", "à + one person becomes lui."],
    ["fill", "Tu parles à ta sœur ? → Tu ___ parles ?", null, "lui", "lui covers both to him and to her."]
  ],

  "a2.syntax.relative_ou": [
    ["fill", "L'année ___ il est né.", null, "où", "où also replaces a time: the year when."],
    ["choice", "Le café ___ nous allons est fermé.", ["où", "que", "qui"], "où", "où replaces a place: the café where."],
    ["fill", "C'est le moment ___ je préfère.", null, "où", "où replaces a moment: the moment I prefer."]
  ],

  "a2.syntax.time_markers": [
    ["fill", "Il travaille ici ___ trois ans. (still true)", null, "depuis", "depuis marks something still going on."],
    ["choice", "Elle a vécu à Rome ___ deux ans.", ["depuis", "pendant", "il y a"], "pendant", "pendant marks a finished stretch of time."],
    ["fill", "Le train est parti ___ cinq minutes.", null, "il y a", "il y a + time = ago."]
  ],

  "a2.adjectives.superlative": [
    ["fill", "C'est la ___ grande ville du pays. (most)", null, "plus", "le / la / les plus + adjective."],
    ["choice", "C'est ___ moins cher.", ["le", "la", "les"], "le", "The article agrees with the noun being compared, here masculine singular."],
    ["fill", "C'est le ___ restaurant de la ville. (best)", null, "meilleur", "bon → meilleur, so the superlative is le meilleur."]
  ],

  "a2.adjectives.adverbs_ment": [
    ["fill", "doux (feminine douce) → ___", null, "doucement", "The adverb is built on the feminine: douce → doucement."],
    ["choice", "vrai → ___", ["vraiment", "vraiement", "vraimente"], "vraiment", "Adjectives ending in a vowel keep the -e of the feminine and add -ment: vraiment."],
    ["fill", "facile → ___", null, "facilement", "facile ends in -e already: facilement."]
  ],

  "a2.prepositions.geography": [
    ["fill", "Nous allons ___ Allemagne.", null, "en", "Feminine countries take en."],
    ["choice", "Il revient ___ Brésil.", ["du", "de", "des"], "du", "Coming from a masculine country: de + le = du."],
    ["fill", "Elle vit ___ Mexique.", null, "au", "Masculine countries take au."]
  ],

  "a2.verbs.pronominaux_passe": [
    ["fill", "Nous nous sommes ___ (lever) à six heures.", null, "levés", "Reflexive verbs take être, so the participle agrees: levés."],
    ["choice", "Elle s'est ___ (laver).", ["lavé", "lavée", "lavés"], "lavée", "The subject is feminine: elle s'est lavée."],
    ["fill", "Ils se sont ___ (rencontrer) hier.", null, "rencontrés", "Masculine plural: rencontrés."]
  ],

  "a2.verbs.imparfait_usage": [
    ["fill", "Quand j'étais petit, je ___ (aller) à l'école à pied.", null, "allais", "A childhood habit takes the imparfait."],
    ["choice", "Ce jour-là, il ___ très froid.", ["faisait", "a fait", "fait"], "faisait", "Weather is background description: imparfait."],
    ["fill", "Elle ___ (lire) quand je suis arrivé.", null, "lisait", "The action in progress is imparfait; the interruption is passé composé."]
  ],

  "a2.pronouns.possessive": [
    ["fill", "Ces livres sont ___ . (ours)", null, "les nôtres", "Plural masculine: les nôtres."],
    ["choice", "Ma sœur et ___ (his) habitent ici.", ["la sienne", "le sien", "les siens"], "la sienne", "sœur is feminine singular, so la sienne."],
    ["fill", "Ton idée est meilleure que ___ . (mine)", null, "la mienne", "idée is feminine singular: la mienne."]
  ],

  "a2.pronouns.demonstrative": [
    ["fill", "Ce gâteau ? Je préfère ___ . (that one, m.)", null, "celui-là", "Masculine singular with -là: celui-là."],
    ["choice", "___ que je connais sont partis.", ["Ceux", "Celles", "Celui"], "Ceux", "Masculine plural: ceux."],
    ["fill", "Les fleurs ? ___ du jardin sont belles. (those)", null, "celles", "Feminine plural: celles."]
  ],

  "a2.syntax.cause_consequence": [
    ["fill", "Il est tard, ___ je rentre. (so)", null, "donc", "donc introduces the consequence."],
    ["choice", "___ elle était malade, elle est restée.", ["Comme", "Donc", "C'est pourquoi"], "Comme", "comme opens the sentence with the cause."],
    ["fill", "Je prends un parapluie ___ il pleut. (because)", null, "parce qu'", "parce que elides before a vowel: parce qu'il."]
  ],

  "a2.expressions.avoir": [
    ["fill", "Tu ___ soif ?", null, "as", "avoir soif: tu as soif."],
    ["choice", "I am afraid.", ["J'ai peur.", "Je suis peur.", "J'ai peure."], "J'ai peur.", "French says avoir peur, not être peur."],
    ["fill", "Elle a ___ de partir. (want to)", null, "envie", "avoir envie de = to feel like."]
  ],

  "a2.verbs.accord_participe": [
    ["choice", "Les lettres que j'ai ___ .", ["écrites", "écrit", "écrits"], "écrites", "The direct object (les lettres) comes first and is feminine plural: écrites."],
    ["fill", "Les photos que j'ai ___ (prendre).", null, "prises", "prendre → pris, and the preceding object is feminine plural: prises."],
    ["choice", "J'ai ___ la lettre.", ["écrit", "écrite", "écrits"], "écrit", "The object comes after the verb, so no agreement: j'ai écrit."]
  ],

  "a2.syntax.discours_indirect": [
    ["choice", "Il dit : « Je pars. » → Il dit qu'il ___ .", ["part", "partait", "partira"], "part", "After a present-tense reporting verb, the tense does not shift."],
    ["fill", "Elle a dit qu'elle ___ (être) fatiguée.", null, "était", "After a past reporting verb, the present becomes imparfait."],
    ["choice", "« Nous venons. » → Ils ont dit qu'ils ___ .", ["venaient", "viennent", "viendront"], "venaient", "Present → imparfait in past reported speech."]
  ],

  "a2.pronouns.indefinite": [
    ["fill", "___ des deux est correct. (each one, m.)", null, "Chacun", "chacun = each one, masculine."],
    ["choice", "___ étudiants ont réussi.", ["Plusieurs", "Plusieurs de", "Chacun"], "Plusieurs", "plusieurs goes straight before the noun, with no de."],
    ["fill", "La ___ des gens aiment le café. (most)", null, "plupart", "la plupart de = most of."]
  ],

  "a2.prepositions.expressions": [
    ["choice", "___ ton aide, j'ai fini.", ["Grâce à", "À cause de", "Malgré"], "Grâce à", "grâce à introduces a positive cause."],
    ["fill", "___ la fatigue, il continue. (despite)", null, "Malgré", "malgré + noun, with no de."],
    ["choice", "Le match est annulé ___ la neige.", ["à cause de", "grâce à", "malgré"], "à cause de", "à cause de introduces a negative cause."]
  ],

  "a2.expressions.faux_amis": [
    ["choice", "Il est actuellement en France.", ["He is currently in France.", "He is actually in France.", "He is eventually in France."], "He is currently in France.", "actuellement means currently — the English 'actually' is en fait."],
    ["fill", "Il faut ___ le bus. (wait for)", null, "attendre", "attendre means to wait for, not to attend."],
    ["choice", "J'ai ___ à la réunion. (attended)", ["assisté", "aidé", "attendu"], "assisté", "assister à = to attend."]
  ],

  "a2.syntax.interrogation_quel": [
    ["fill", "___ sont tes amis ? (which ones, m. pl.)", null, "Quels", "quel agrees with the noun: masculine plural quels."],
    ["choice", "___ de ces deux robes ?", ["Laquelle", "Quelle", "Lesquelles"], "Laquelle", "As a pronoun it takes the article: laquelle."],
    ["fill", "___ couleur préfères-tu ?", null, "Quelle", "Before a feminine noun: quelle couleur."]
  ],

  "a2.adverbs.frequency": [
    ["fill", "Il va ___ à la piscine. (sometimes)", null, "parfois", "parfois = sometimes."],
    ["choice", "Elle arrive ___ en retard.", ["souvent", "jamais", "toujours"], "souvent", "souvent = often."],
    ["fill", "Je ne mange ___ de sucre. (never)", null, "jamais", "jamais = never, and it is already negative."]
  ],

  "a2.verbs.politesse": [
    ["fill", "Vous ___ m'aider ? (pouvoir, conditional)", null, "pourriez", "The conditional softens the request: pourriez-vous."],
    ["choice", "Polite request:", ["Je voudrais un café.", "Je veux un café.", "J'aime un café."], "Je voudrais un café.", "voudrais is the conditional of vouloir, and it is the polite form."],
    ["fill", "Nous ___ réserver une table. (aimer, conditional)", null, "aimerions", "aimer → aimerions in the conditional."]
  ],

  "a2.adjectives.tout": [
    ["fill", "___ la nuit", null, "toute", "nuit is feminine singular: toute la nuit."],
    ["choice", "___ le monde est là.", ["Tout", "Tous", "Toute"], "Tout", "monde is masculine singular: tout le monde."],
    ["fill", "Elle travaille ___ les jours.", null, "tous", "jours is masculine plural: tous les jours."]
  ],

  "a2.prepositions.movement": [
    ["fill", "Nous rentrons ___ Paris. (from)", null, "de", "de marks the origin."],
    ["choice", "Il marche ___ la rivière. (towards)", ["vers", "par", "chez"], "vers", "vers = towards."],
    ["fill", "Je vais ___ le dentiste. (to the dentist's)", null, "chez", "chez + a person = at that person's place."]
  ],

  "a2.syntax.interrogation_complete": [
    ["fill", "___ partez-vous ? (why)", null, "Pourquoi", "pourquoi = why."],
    ["choice", "___ de livres as-tu ?", ["Combien", "Quel", "Pourquoi"], "Combien", "combien de + noun asks for a quantity."],
    ["fill", "___ est ton avis ? (what, m.)", null, "Quel", "avis is masculine singular: quel."]
  ],

  "a2.syntax.comparison_quantity": [
    ["fill", "Elle a autant ___ patience que toi.", null, "de", "Quantity comparisons use de before the noun."],
    ["choice", "J'ai ___ de travail que toi.", ["moins", "aussi", "autant"], "moins", "moins de … que = less … than."],
    ["fill", "Il y a plus ___ étudiants cette année.", null, "d'", "de becomes d' before a vowel: plus d'étudiants."]
  ],

  "a2.verbs.imperatif_pronoms": [
    ["fill", "Donne-___ ton livre. (me)", null, "moi", "In the affirmative imperative the pronoun follows with a hyphen: donne-moi."],
    ["choice", "Don't tell her:", ["Ne le lui dis pas", "Ne lui le dis pas", "Dis-le-lui ne pas"], "Ne le lui dis pas", "In the negative the pronouns go back before the verb, in the order le + lui."],
    ["fill", "Parle-___ ! (to them)", null, "leur", "The indirect pronoun follows the verb: parle-leur."]
  ],

  "a2.verbs.venir_tenir": [
    ["fill", "Elle ___ (devenir) médecin.", null, "devient", "devenir follows venir: elle devient."],
    ["choice", "Ils ___ (revenir) demain.", ["reviennent", "revenent", "revienssent"], "reviennent", "revenir doubles the n in the plural: ils reviennent."],
    ["fill", "Nous ___ (obtenir) une réponse.", null, "obtenons", "tenir keeps its e in the nous form: nous obtenons."]
  ],

  "a2.verbs.savoir_connaitre": [
    ["fill", "Elle ___ jouer du piano. (savoir)", null, "sait", "savoir + infinitive = know how to."],
    ["choice", "Tu ___ ce film ? (you are familiar with it)", ["connais", "sais", "connaît"], "connais", "A work you know is something you are familiar with: connaître."],
    ["fill", "Vous ___ le chemin ? (savoir)", null, "savez", "Knowing a fact takes savoir."]
  ],

  "a2.verbs.devoir_falloir": [
    ["fill", "Nous ___ travailler. (devoir)", null, "devons", "A named person is obliged, so devoir."],
    ["choice", "It is necessary to leave.", ["Il faut partir.", "Je dois partir.", "Tu dois partir."], "Il faut partir.", "No person is named, so the impersonal il faut."],
    ["fill", "Il ___ prendre le train. (falloir)", null, "faut", "falloir only exists in the il form: il faut."]
  ],

  "a2.pronouns.neuter_le": [
    ["choice", "C'est difficile ? — Oui, je ___ crois.", ["le", "la", "les"], "le", "le stands for the whole idea, so it stays masculine singular."],
    ["fill", "Il pleut ? — Oui, je ___ vois.", null, "le", "The neuter le never agrees with anything."],
    ["choice", "Tu as compris ? — Oui, je ___ comprends.", ["le", "la", "les"], "le", "Even after a question with no noun, the answer is le."]
  ],

  "a2.pronouns.tout": [
    ["choice", "Ils ont ___ mangé.", ["tout", "tous", "toutes"], "tout", "tout as an object pronoun means everything and never changes."],
    ["fill", "Nous avons ___ vu. (everything)", null, "tout", "Everything = tout, invariable."],
    ["choice", "___ les deux sont venus.", ["Tous", "Tout", "Toutes"], "Tous", "For people, tout agrees: masculine plural tous."]
  ],

  /* ---------------- B1 ---------------- */

  "b1.future.simple": [
    ["fill", "L'année prochaine, nous ___ (visiter) Rome.", null, "visiterons", "The future stem is the infinitive: visiter → visiterons."],
    ["choice", "Ils ___ (pouvoir) venir.", ["peuvent", "pourront", "pourraient"], "pourront", "pouvoir has the irregular future stem pourr-."],
    ["fill", "Je ___ (devoir) partir tôt.", null, "devrai", "devoir → devr- + ai."]
  ],

  "b1.conditional.present": [
    ["fill", "Si j'étais toi, je ___ (partir).", null, "partirais", "The conditional is the future stem plus the imparfait endings."],
    ["choice", "Nous ___ (aimer) venir.", ["aimons", "aimerions", "aimerons"], "aimerions", "-ions on the future stem gives the conditional."],
    ["fill", "Tu ___ (devoir) te reposer.", null, "devrais", "devoir → devr- + ais."]
  ],

  "b1.subjunctive.present": [
    ["fill", "Il faut que vous ___ (partir).", null, "partiez", "The subjunctive of vous takes -iez: que vous partiez."],
    ["choice", "Je veux qu'il ___ . (savoir)", ["sait", "sache", "saura"], "sache", "savoir has the irregular subjunctive sache."],
    ["fill", "Bien que nous ___ (avoir) faim.", null, "ayons", "avoir → que nous ayons."]
  ],

  "b1.relative.qui_que": [
    ["fill", "L'homme ___ je vois est mon oncle.", null, "que", "The subject follows, so the relative pronoun is the object: que."],
    ["choice", "La maison ___ est là est vieille.", ["qui", "que", "dont"], "qui", "No subject follows, so qui is the subject of est."],
    ["fill", "Le train ___ part à huit heures.", null, "qui", "qui is the subject of part."]
  ],

  "b1.comparison": [
    ["fill", "Il est ___ grand que son père. (as)", null, "aussi", "aussi … que = as … as."],
    ["choice", "Elle parle ___ que moi.", ["meilleur", "mieux", "plus bien"], "mieux", "The adverb bien becomes mieux."],
    ["fill", "C'est la ___ belle ville du pays. (most)", null, "plus", "le / la / les plus + adjective."]
  ],

  "b1.pronoun_order": [
    ["choice", "Il ___ donne. (to you + it)", ["te le", "le te", "toi le"], "te le", "Indirect comes first, then direct: te le."],
    ["fill", "Elle ___ envoie. (to us + it, masculine)", null, "nous le", "nous + le, in that order."],
    ["choice", "Je ___ ai parlé. (to them)", ["leur", "leurs", "les"], "leur", "The indirect pronoun leur never takes an -s."]
  ],

  "b1.verbs.plus_que_parfait": [
    ["fill", "Nous ___ déjà mangé. (avoir)", null, "avions", "avoir in the imparfait + participle."],
    ["choice", "Elle ___ partie avant moi.", ["était", "est", "sera"], "était", "être in the imparfait + participle."],
    ["fill", "Ils ___ vu le film. (avoir)", null, "avaient", "ils + avoir in the imparfait = avaient."]
  ],

  "b1.verbs.passive": [
    ["fill", "La lettre a été ___ (écrire) hier.", null, "écrite", "The participle agrees with the subject: la lettre → écrite."],
    ["choice", "Les enfants sont ___ par la maîtresse.", ["grondés", "grondé", "grondées"], "grondés", "Masculine plural subject: grondés."],
    ["fill", "Ce livre est ___ (lire) par tous.", null, "lu", "lire → lu."]
  ],

  "b1.syntax.relative_dont": [
    ["fill", "C'est l'ami ___ je t'ai parlé.", null, "dont", "parler de → dont."],
    ["choice", "Le projet ___ je rêve.", ["dont", "que", "qui"], "dont", "rêver de → dont."],
    ["fill", "Voilà la raison ___ il est parti.", null, "dont", "The reason he left: la raison dont il est parti."]
  ],

  "b1.verbs.gerondif": [
    ["fill", "Il a appris le français ___ regardant la télé.", null, "en", "The gerund is en + present participle."],
    ["choice", "___ courant, il est tombé.", ["En", "Au", "À"], "En", "Only en forms the gerund."],
    ["fill", "Elle pense ___ (marcher).", null, "en marchant", "en + marchant, and the two words stay together."]
  ],

  "b1.expressions.connectors": [
    ["fill", "Il est tard ; ___ , je reste. (however)", null, "cependant", "cependant contrasts with what came before."],
    ["choice", "Elle est malade ; ___ , elle vient.", ["pourtant", "donc", "en effet"], "pourtant", "pourtant = yet, and it sets up the contradiction."],
    ["fill", "___ , je pense qu'il a raison. (furthermore)", null, "Par ailleurs", "par ailleurs adds a second point."]
  ],

  "b1.verbs.subjunctive_conj": [
    ["fill", "Je pars avant qu'il ___ (arriver).", null, "arrive", "avant que always takes the subjunctive."],
    ["choice", "Pour que nous ___ à l'heure, partons tôt.", ["arrivions", "arrivons", "arriverons"], "arrivions", "pour que takes the subjunctive: que nous arrivions."],
    ["fill", "À moins qu'il ___ (pleuvoir).", null, "pleuve", "à moins que takes the subjunctive."]
  ],

  "b1.verbs.conditional_past": [
    ["fill", "Nous ___ pu venir. (pouvoir)", null, "aurions", "avoir in the conditional + participle."],
    ["choice", "Elle ___ venue si elle avait su.", ["serait", "sera", "est"], "serait", "être in the conditional + participle."],
    ["fill", "Vous ___ dû me le dire. (devoir)", null, "auriez", "vous + avoir in the conditional = auriez."]
  ],

  "b1.syntax.inversion": [
    ["fill", "___ -vous français ? (parler)", null, "Parlez", "Inversion keeps the normal conjugation: parlez-vous."],
    ["choice", "Où ___ -elle ?", ["va", "vas", "vont"], "va", "elle + aller = va, and the hyphen links it to the pronoun."],
    ["fill", "___ -tu venu ? (comment)", null, "Comment", "The question word opens the sentence."]
  ],

  "b1.syntax.emphasis": [
    ["choice", "C'est à Paris ___ nous habitons.", ["que", "qui", "dont"], "que", "The emphasised element is not the subject, so que."],
    ["fill", "C'est ___ qui ai raison. (me)", null, "moi", "The stress pronoun follows c'est."],
    ["choice", "C'est le livre ___ il parle.", ["dont", "que", "qui"], "dont", "parler de → dont."]
  ],

  "b1.pronouns.relative_compose": [
    ["fill", "___ tu dis est vrai. (what)", null, "Ce que", "ce que stands for the object of dire."],
    ["choice", "Je sais ___ il a fait.", ["ce qu'", "ce qui", "ce dont"], "ce qu'", "ce que elides before a vowel: ce qu'il."],
    ["fill", "___ me plaît, c'est le calme.", null, "Ce qui", "ce qui is the subject of plaît."]
  ],

  "b1.expressions.formal": [
    ["choice", "Formal way to ask someone to sit.", ["Veuillez vous asseoir.", "Assieds-toi.", "Tu t'assieds."], "Veuillez vous asseoir.", "Veuillez + infinitive is the formal request."],
    ["fill", "Nous vous prions de bien vouloir nous ___ . (excuse)", null, "excuser", "prier de bien vouloir + infinitive."],
    ["choice", "Formal opening of a letter.", ["Madame, Monsieur,", "Salut,", "Coucou,"], "Madame, Monsieur,", "Letters open with Madame, Monsieur, when the name is unknown."]
  ],

  "b1.verbs.futur_anterieur": [
    ["fill", "Nous ___ terminé avant lui. (avoir)", null, "aurons", "avoir in the future + participle."],
    ["choice", "Elle ___ partie à midi.", ["sera", "serait", "est"], "sera", "être in the future + participle."],
    ["fill", "Vous ___ vu le film. (avoir)", null, "aurez", "vous + avoir in the future = aurez."]
  ],

  "b1.syntax.concession": [
    ["choice", "___ qu'il fasse froid, nous sortons.", ["Bien", "Même", "Si"], "Bien", "bien que takes the subjunctive: bien qu'il fasse."],
    ["fill", "Même s'il ___ (pleuvoir), nous sortons.", null, "pleut", "même si takes the indicative, not the subjunctive."],
    ["choice", "Il est venu ___ qu'il soit fatigué.", ["bien", "même", "si"], "bien", "bien que + subjunctive again."]
  ],

  "b1.syntax.but": [
    ["fill", "Elle étudie ___ réussir. (in order to)", null, "pour", "pour + infinitive when no new subject appears."],
    ["choice", "Je parle lentement ___ vous compreniez.", ["pour que", "pour", "afin de"], "pour que", "A different subject needs pour que + subjunctive."],
    ["fill", "Afin de ___ (réussir), il travaille.", null, "réussir", "afin de + infinitive, same subject."]
  ],

  "b1.syntax.participle_present": [
    ["fill", "___ fatigué, il s'est couché. (être)", null, "Étant", "The present participle of être is étant."],
    ["choice", "___ la porte, elle est entrée.", ["Ouvrant", "Ouvre", "Ouvert"], "Ouvrant", "The present participle ends in -ant: ouvrant."],
    ["fill", "Les enfants ___ (courir) sont tombés.", null, "courant", "courir → courant."]
  ],

  "b1.pronouns.relatifs_composes": [
    ["fill", "La personne ___ je pense.", null, "à laquelle", "à + laquelle for a feminine singular antecedent."],
    ["choice", "Le stylo avec ___ j'écris.", ["lequel", "auquel", "duquel"], "lequel", "avec takes lequel, with no contraction."],
    ["fill", "Les livres ___ je me réfère. (à + pl.)", null, "auxquels", "à + lesquels contracts to auxquels."]
  ],

  "b1.expressions.synonyms": [
    ["choice", "Formal 'to make a decision'.", ["prendre une décision", "faire une décision", "dire une décision"], "prendre une décision", "French takes a decision, it does not make one."],
    ["fill", "Il a ___ une solution. (proposed)", null, "proposé", "proposer une solution."],
    ["choice", "Formal 'to carry out a study'.", ["mener une étude", "faire une étude", "dire une étude"], "mener une étude", "mener une étude is the formal register."]
  ],

  "b1.negation.que_aucun": [
    ["fill", "Il n'a ___ deux ans.", null, "que", "ne … que restricts rather than negates: only two years old."],
    ["choice", "___ solution n'est parfaite.", ["Aucune", "Aucun", "Aucunes"], "Aucune", "solution is feminine singular: aucune."],
    ["choice", "He has neither brother nor sister.", ["Il n'a ni frère ni sœur.", "Il n'a pas ni frère ni sœur.", "Il n'a ni frère ou sœur."], "Il n'a ni frère ni sœur.", "ni … ni replaces pas; adding pas is wrong."]
  ],

  "b1.adjectives.indefinis": [
    ["fill", "___ étudiant peut s'inscrire. (any)", null, "N'importe quel", "n'importe quel + noun = any."],
    ["choice", "___ décision a des conséquences.", ["Toute", "Tout", "Toutes"], "Toute", "décision is feminine singular: toute."],
    ["fill", "La plupart ___ étudiants travaillent.", null, "des", "la plupart de + les contracts to des."]
  ],

  "b1.adverbs.maniere": [
    ["fill", "Il parle ___ . (clearly)", null, "clairement", "clair → claire → clairement."],
    ["choice", "Elle répond ___ .", ["poliment", "poli", "polimente"], "poliment", "poli → poliment, with a single m."],
    ["fill", "Il a ___ refusé. (firmly)", null, "fermement", "ferme → fermement."]
  ],

  "b1.adjectives.ci_la": [
    ["fill", "Cette voiture-___ est rapide. (this)", null, "ci", "-ci points at the nearer one."],
    ["choice", "Celui-___ est à moi. (that)", ["là", "ci", "la"], "là", "-là points at the further one."],
    ["fill", "Ces livres-___ sont anciens. (those)", null, "là", "The suffix attaches to the noun with a hyphen: livres-là."]
  ],

  "b1.verbs.prepositionnels": [
    ["fill", "Elle a oublié ___ fermer la porte.", null, "de", "oublier de + infinitive."],
    ["choice", "Nous pensons ___ toi.", ["à", "de", "pour"], "à", "penser à quelqu'un = to think of someone."],
    ["fill", "Je commence ___ comprendre.", null, "à", "commencer à + infinitive."]
  ],

  "b1.verbs.passe_simple": [
    ["choice", "Which tense is 'il fut'?", ["passé simple", "imparfait", "futur simple"], "passé simple", "fut is the passé simple of être."],
    ["fill", "Elle ___ la porte. (fermer, passé simple)", null, "ferma", "-er verbs take -a in the third person singular: ferma."],
    ["choice", "Ils ___ . (être, passé simple)", ["furent", "étaient", "seront"], "furent", "être is irregular even in the passé simple: ils furent."]
  ],

  "b1.syntax.discours_indirect": [
    ["fill", "Il demande ___ je viens. (yes/no question)", null, "si", "A yes/no question becomes si in reported speech."],
    ["choice", "Elle a dit qu'elle ___ demain.", ["viendrait", "viendra", "vient"], "viendrait", "The future shifts to the conditional after a past reporting verb."],
    ["fill", "Il m'a demandé ___ j'habitais.", null, "où", "The question word is kept: où."]
  ],

  "b1.syntax.si_present": [
    ["fill", "S'il ___ (pleuvoir), nous restons.", null, "pleut", "si + present, and the main clause stays present."],
    ["choice", "Si tu ___ , nous partons.", ["veux", "voudras", "voudrais"], "veux", "Never a future or conditional after si."],
    ["fill", "Si nous ___ (pouvoir), nous venons.", null, "pouvons", "si + present indicative."]
  ],

  "b1.verbs.faire_causatif": [
    ["fill", "Je fais ___ (réparer) la voiture.", null, "réparer", "faire + infinitive: you are not doing the repairing."],
    ["choice", "She has her hair done: Elle ___ faire couper les cheveux.", ["fait", "fais", "faire"], "fait", "elle + faire = fait."],
    ["fill", "Nous avons fait ___ (construire) une maison.", null, "construire", "The causative keeps the infinitive after faire."]
  ],

  "b1.pronouns.ce_dont": [
    ["fill", "Voilà ce ___ j'ai besoin.", null, "dont", "avoir besoin de → ce dont."],
    ["choice", "___ il est fier, c'est son fils.", ["Ce dont", "Ce que", "Ce à quoi"], "Ce dont", "être fier de → ce dont."],
    ["fill", "C'est ce ___ je pense. (à)", null, "à quoi", "penser à → ce à quoi."]
  ],

  /* ---------------- B2 ---------------- */

  "b2.syntax.nominalisation": [
    ["choice", "The noun of 'améliorer'.", ["une amélioration", "un amélioration", "une améliorage"], "une amélioration", "-er verbs usually give -ation: améliorer → une amélioration."],
    ["fill", "The noun of 'traduire'.", null, "une traduction", "-uire gives -uction: traduire → une traduction."],
    ["choice", "The noun of 'croître'.", ["une croissance", "un croissement", "une croîte"], "une croissance", "-aître / -oître give -issance: croître → la croissance."]
  ],

  "b2.verbs.subjonctif_passe": [
    ["fill", "Je doute qu'il ___ (venir).", null, "soit venu", "Passé du subjonctif: être in the subjunctive + participle."],
    ["choice", "Bien qu'elle ___ partie.", ["soit", "est", "était"], "soit", "bien que takes the subjunctive, here the past one."],
    ["fill", "Je suis content que tu ___ réussi.", null, "aies", "avoir in the subjunctive, tu form: que tu aies."]
  ],

  "b2.syntax.discours_indirect_passe": [
    ["fill", "« Aujourd'hui » → Il a dit que ___ .", null, "ce jour-là", "Time words shift: aujourd'hui becomes ce jour-là."],
    ["choice", "« Demain » becomes ___ .", ["le lendemain", "la veille", "ce jour-là"], "le lendemain", "demain → le lendemain; hier → la veille."],
    ["fill", "« J'habite ici » → Il a dit qu'il habitait ___ .", null, "là", "ici becomes là in reported speech."]
  ],

  "b2.expressions.registre": [
    ["choice", "Informal for 'manger'.", ["bouffer", "dîner", "goûter"], "bouffer", "bouffer is the slang register for eating."],
    ["choice", "Informal for 'partir'.", ["se barrer", "s'en aller", "partir"], "se barrer", "se barrer is slang; s'en aller is simply neutral."],
    ["fill", "Standard for 'crever'.", null, "mourir", "crever is slang for dying; the standard verb is mourir."]
  ],

  "b2.verbs.infinitif_passe": [
    ["fill", "Après ___ fini, elle est sortie.", null, "avoir", "après avoir + participle for most verbs."],
    ["choice", "Il est content d'___ réussi.", ["avoir", "être", "ayant"], "avoir", "The past infinitive is avoir + participle."],
    ["fill", "Après ___ partis, ils ont téléphoné.", null, "être", "Movement verbs take être in the past infinitive."]
  ],

  "b2.negation.expletif": [
    ["fill", "Je crains qu'il ___ vienne.", null, "ne", "craindre que takes the expletive ne, which adds no meaning."],
    ["choice", "___ ne le sait.", ["Nul", "Aucun", "Personne"], "Nul", "nul as a subject means no one, in a formal register."],
    ["fill", "Elle est partie sans qu'il ___ . (comprendre)", null, "comprenne", "sans que takes the subjunctive."]
  ],

  "b2.syntax.sans_au_cas": [
    ["fill", "Au cas où tu ___, appelle-moi. (avoir, conditional)", null, "aurais", "au cas où takes the conditional, not the subjunctive."],
    ["choice", "Il est entré ___ frapper.", ["sans", "sans que", "au cas où"], "sans", "Same subject, so plain sans + infinitive."],
    ["choice", "___ il viendrait, nous partirons.", ["Au cas où", "Sans que", "Sans"], "Au cas où", "au cas où + conditional = in case."]
  ],

  "b2.expressions.presentatifs": [
    ["fill", "___ mes clés. (here are)", null, "Voici", "voici points at what is close."],
    ["choice", "___ les enfants qui ont gagné.", ["Ce sont", "C'est", "Voici"], "Ce sont", "A plural noun after c'est becomes ce sont."],
    ["fill", "___ un problème. (there is)", null, "Voilà", "voilà points at what is there."]
  ],

  "b2.verbs.prepositionnels_avance": [
    ["fill", "Il s'est ___ de son erreur. (rendre compte)", null, "rendu", "se rendre compte de: the participle agrees with the reflexive subject."],
    ["choice", "Elle s'intéresse ___ la peinture.", ["à", "de", "pour"], "à", "s'intéresser à."],
    ["fill", "Nous nous ___ de vous. (souvenir)", null, "souvenons", "se souvenir de: nous nous souvenons."]
  ],

  "b2.syntax.connecteurs_avances": [
    ["fill", "Il est tard ; ___ , nous restons. (nevertheless)", null, "néanmoins", "néanmoins contrasts, in a formal register."],
    ["choice", "___ , il a refusé.", ["En revanche", "En effet", "Donc"], "En revanche", "en revanche introduces the opposite case."],
    ["fill", "___ , je conclus que c'est faux. (therefore)", null, "Par conséquent", "par conséquent marks the conclusion."]
  ],

  "b2.syntax.concordance": [
    ["fill", "Ils pensaient que nous ___ (être) en retard.", null, "étions", "The present shifts to the imparfait after a past reporting verb."],
    ["choice", "Elle a dit qu'elle ___ . (future in the past)", ["viendrait", "viendra", "venait"], "viendrait", "The future becomes the conditional."],
    ["fill", "Il croyait que tu ___ (avoir) raison.", null, "avais", "avoir in the imparfait, tu form."]
  ],

  "b2.pronouns.indefinis": [
    ["fill", "___ des deux a menti. (one of them)", null, "L'un", "l'un de + plural = one of them."],
    ["choice", "___ sont venus.", ["Certains", "Chacun", "L'un"], "Certains", "certains = some, and it is plural."],
    ["fill", "___ a ses raisons. (everyone)", null, "Chacun", "chacun is always singular."]
  ],

  "b2.syntax.opposition": [
    ["fill", "___ la pluie, nous sortons. (despite)", null, "Malgré", "malgré + noun, no de."],
    ["choice", "Il a réussi ___ les difficultés.", ["malgré", "contrairement", "cependant"], "malgré", "malgré introduces what did not prevent the result."],
    ["fill", "___ à son frère, il est calme. (unlike)", null, "Contrairement", "contrairement à = unlike."]
  ],

  "b2.syntax.consequence": [
    ["fill", "Il a tant travaillé ___ il est épuisé.", null, "qu'", "tant … que, and que elides before il."],
    ["choice", "Il est si fatigué ___ il dort debout.", ["qu'", "que", "dont"], "qu'", "si + adjective + que."],
    ["fill", "Elle crie ___ tout le monde l'entende. (so that)", null, "de sorte que", "de sorte que + subjunctive for a purpose."]
  ],

  "b2.verbs.passe_anterieur": [
    ["choice", "'il eut parlé' is which tense?", ["passé antérieur", "plus-que-parfait", "passé simple"], "passé antérieur", "avoir in the passé simple + participle."],
    ["fill", "Dès qu'il ___ fini, il sortit.", null, "eut", "The passé antérieur follows dès que in a literary narrative."],
    ["choice", "Quand elles ___ parties, il pleuvait.", ["furent", "étaient", "seront"], "furent", "être in the passé simple + participle."]
  ],

  "b2.syntax.nominalisation_2": [
    ["fill", "la ___ (grand)", null, "grandeur", "grand → la grandeur."],
    ["choice", "le ___ (savoir)", ["savoir", "sachance", "savement"], "savoir", "The infinitive itself becomes a noun: le savoir."],
    ["fill", "la ___ (croire)", null, "croyance", "croire → la croyance."]
  ],

  "b2.verbs.passif_avance": [
    ["fill", "Il s'est fait ___ (voler) son vélo.", null, "voler", "se faire + infinitive: the participle does not agree."],
    ["choice", "La porte est ___ ouverte.", ["restée", "resté", "rester"], "restée", "The participle agrees with la porte."],
    ["fill", "Ce livre est connu ___ tous les étudiants.", null, "de", "With verbs of feeling or knowledge, the agent takes de."]
  ],

  "b2.pronouns.relatifs_composes_2": [
    ["fill", "La personne ___ je parle est ma voisine.", null, "à laquelle", "à + laquelle for a feminine singular antecedent."],
    ["choice", "Les collègues avec ___ je travaille.", ["lesquels", "auxquels", "desquels"], "lesquels", "avec takes lesquels, with no contraction."],
    ["fill", "Le projet ___ je participe. (à + m.)", null, "auquel", "participer à → auquel."]
  ],

  "b2.verbs.subjonctif_avance": [
    ["fill", "Je reste jusqu'à ce qu'il ___ . (revenir)", null, "revienne", "jusqu'à ce que takes the subjunctive."],
    ["choice", "___ qu'il pleuve, nous sortons.", ["À moins", "Pourvu", "De peur"], "À moins", "à moins que + subjunctive = unless."],
    ["fill", "Il parle bas de peur qu'on ne l'___ . (entendre)", null, "entende", "de peur que takes the subjunctive, with an expletive ne."]
  ],

  "b2.syntax.locutions_conjonctives": [
    ["fill", "___ que je sache, il est absent. (as far as)", null, "Pour autant", "pour autant que je sache = as far as I know."],
    ["choice", "___ qu'il soit d'accord, je signe.", ["En admettant", "Dès lors", "Pour autant"], "En admettant", "en admettant que + subjunctive."],
    ["fill", "___ qu'il fasse beau, nous sortirons. (supposing)", null, "En supposant", "en supposant que + subjunctive."]
  ],

  "b2.expressions.idiomatiques": [
    ["fill", "Il a ___ part à la réunion. (taken part)", null, "pris", "prendre part à = to take part in."],
    ["choice", "Il ___ le jour où il l'a rencontrée.", ["se souvient du", "rappelle du", "souvient le"], "se souvient du", "se souvenir de, not se rappeler de."],
    ["fill", "Nous avons ___ une décision.", null, "pris", "prendre une décision."]
  ],

  "b2.adverbs.attitude": [
    ["fill", "___ , il a plu. (unfortunately)", null, "Malheureusement", "malheureux → malheureusement."],
    ["choice", "___ , tout s'est bien passé.", ["Heureusement", "Heureux", "Malheureusement"], "Heureusement", "The adverb, not the adjective."],
    ["fill", "___ , il a menti. (obviously)", null, "Évidemment", "évident → évidemment, with -emment."]
  ],

  "b2.syntax.insertion": [
    ["fill", "Elle viendra, je ___ , demain.", null, "crois", "The parenthetical clause keeps normal word order."],
    ["choice", "'Je pars', ___ .", ["dit-elle", "elle dit", "a dit"], "dit-elle", "Inversion with a hyphen marks the inserted reporting clause."],
    ["fill", "Il est, ___ , très intelligent.", null, "paraît-il", "paraît-il is a fixed parenthetical form."]
  ],

  "b2.expressions.registre_shift": [
    ["choice", "Formal way to ask for help.", ["Pourriez-vous m'aider ?", "Tu peux m'aider ?", "File-moi un coup de main."], "Pourriez-vous m'aider ?", "The conditional plus vous is the formal register."],
    ["fill", "Formal: Je vous prie de bien vouloir m'___ .", null, "excuser", "prier de bien vouloir + infinitive."],
    ["choice", "Informal way to say 'let's go'.", ["On y va ?", "Partons-nous ?", "Nous partons."], "On y va ?", "on is the everyday spoken subject."]
  ]

};

/* Append the extra items to their points. This file is loaded right after
   data.js, so KPS already exists; the originals keep their guided / check /
   kwiz roles and these only ever show up as further practice. */
(function mergeExtra() {
  if (typeof KPS === "undefined") return;
  KPS.forEach(function (kp) {
    const extra = EXTRA_ITEMS[kp.id];
    if (!extra) return;
    extra.forEach(function (it, i) {
      kp.items.push({
        id: kp.id + ".x" + (i + 1),
        type: it[0],
        stage: "kwiz",
        prompt: it[1],
        options: it[2] || null,
        answer: it[3],
        explain: it[4],
        hint: it[5] || null,
        passage: it[6] || null,
        difficulty: Math.min(5, +(kp.difficulty + (5 + i) * 0.25).toFixed(2))
      });
    });
  });
})();
