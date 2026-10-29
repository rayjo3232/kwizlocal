/* Deeper explanations for the most-used points.
   Keyed by knowledge-point id. Anything missing falls back to the short rule
   already in data.js, so this file can grow in batches.

   Shape: { usage: "when you actually meet it", more: [[fr, en], ...], tip: "memory hook" } */
const DEEP = {
  "a0.articles.definite": {
    usage: "Use it for something the listener can already identify — mentioned before, obvious from context, or unique. French also uses it for likes and dislikes, body parts and days of the week, where English often drops it.",
    more: [
      ["J'aime le chocolat.", "I like chocolate."],
      ["Elle a mal à la tête.", "She has a headache."],
      ["Le musée est fermé le lundi.", "The museum is closed on Mondays."]
    ],
    tip: "English says \"I like chocolate\" with no article. French insists on \"J'aime le chocolat\" — general likes still take the definite article."
  },

  "a0.articles.indefinite": {
    usage: "For one of many, or the first mention of something. Drop it entirely before a profession: je suis médecin, elle est avocate.",
    more: [
      ["J'ai un frère et une sœur.", "I have a brother and a sister."],
      ["Elle cherche un appartement.", "She is looking for a flat."],
      ["Ce sont des amis.", "They are friends."]
    ],
    tip: "In a negative sentence un/une/des collapse to de: Je n'ai pas de frère."
  },

  "a0.pronouns.subject": {
    usage: "French verbs barely sound different across persons, so the pronoun is not optional — it is what tells you who is doing it.",
    more: [
      ["Il pleut.", "It is raining."],
      ["On mange à huit heures.", "We eat at eight."],
      ["Elles sont arrivées.", "They (all female) have arrived."]
    ],
    tip: "In speech, on replaces nous almost everywhere: on mange, on y va, on est prêts."
  },

  "a0.etre.present": {
    usage: "Identity, nationality, profession, state, and location. Also the auxiliary for a small set of verbs in the passé composé.",
    more: [
      ["Je suis étudiant.", "I am a student."],
      ["Nous sommes à Paris.", "We are in Paris."],
      ["Vous êtes prêts ?", "Are you ready?"]
    ],
    tip: "vous êtes is the only form with a circumflex. If you see ê, it is être."
  },

  "a0.avoir.present": {
    usage: "Possession, age, and physical states (avoir faim, soif, froid, chaud, peur). It is also the default auxiliary for the passé composé.",
    more: [
      ["J'ai vingt ans.", "I am twenty."],
      ["Elle a deux chats.", "She has two cats."],
      ["Nous avons faim.", "We are hungry."]
    ],
    tip: "French \"has\" an age rather than \"being\" one. Saying je suis vingt is a classic beginner slip."
  },

  "a0.er.present": {
    usage: "About nine out of ten French verbs end in -er. Get this pattern solid and you can already talk about work, home, study and travel.",
    more: [
      ["Je travaille dans un bureau.", "I work in an office."],
      ["Nous habitons à Lyon.", "We live in Lyon."],
      ["Ils étudient le français.", "They study French."]
    ],
    tip: "-e, -es, -e and -ent are all silent. Only -ons and -ez make a sound, which is why spoken French leans so hard on the pronoun."
  },

  "a0.nouns.gender": {
    usage: "Every noun is masculine or feminine, and the article, adjective and pronoun must all agree. Endings are your best guess before you have memorised the word.",
    more: [
      ["la nation, la beauté, la culture", "feminine: -tion, -té, -ure"],
      ["le gouvernement, le bureau, le tourisme", "masculine: -ment, -eau, -isme"],
      ["un problème, un système", "masculine despite the -e"]
    ],
    tip: "Endings get you to roughly 80%. The remaining 20% is pure memory — learn the article together with the noun, never the noun alone."
  },

  "a0.nouns.plural": {
    usage: "Written French marks the plural with -s, but that -s is almost always silent. In speech the only reliable signal is the article.",
    more: [
      ["les livres", "the books"],
      ["les chevaux", "the horses (-al becomes -aux)"],
      ["les gâteaux", "the cakes (-eau becomes -eaux)"]
    ],
    tip: "You cannot hear le/la versus les by the noun alone. Train your ear on the article, not the ending."
  },

  "a0.verbs.aller": {
    usage: "Going somewhere, asking how someone is, and building the near future (aller + infinitive).",
    more: [
      ["Je vais au travail.", "I go to work."],
      ["Comment ça va ?", "How are you?"],
      ["Nous allons partir.", "We are going to leave."]
    ],
    tip: "aller is the only -er verb that takes être in the passé composé: je suis allé, not j'ai allé."
  },

  "a0.adjectives.position": {
    usage: "Most adjectives follow the noun. A short, high-frequency group goes before it — and getting this wrong sounds foreign even when the words are right.",
    more: [
      ["une belle maison", "a beautiful house"],
      ["une voiture rouge", "a red car"],
      ["un petit café", "a small café"]
    ],
    tip: "BANGS: Beauty, Age, Number, Goodness, Size. Those go before the noun; everything else goes after."
  },

  "a0.expressions.il_y_a": {
    usage: "Talking about what exists — in a room, a town, a situation. It never changes form, whether the thing is singular or plural.",
    more: [
      ["Il y a un problème.", "There is a problem."],
      ["Il n'y a pas de place.", "There is no room."],
      ["Est-ce qu'il y a un hôtel près d'ici ?", "Is there a hotel near here?"]
    ],
    tip: "Do not confuse il y a (there is) with il a (he has). The y is the whole difference."
  },

  "a0.syntax.cest_vs_il_est": {
    usage: "c'est points at a thing or a person and is followed by a noun or name. il est describes a person or situation and is followed by an adjective or a profession without an article.",
    more: [
      ["C'est mon frère.", "That is my brother."],
      ["Il est médecin.", "He is a doctor."],
      ["C'est difficile.", "It is difficult."]
    ],
    tip: "For professions, French drops the article: il est professeur, never il est un professeur."
  },

  "a0.verbs.faire": {
    usage: "Doing or making, the weather (il fait beau), and sport or music (faire du vélo, faire du piano).",
    more: [
      ["Je fais mes devoirs.", "I do my homework."],
      ["Il fait beau aujourd'hui.", "The weather is nice today."],
      ["Nous faisons du vélo.", "We cycle."]
    ],
    tip: "vous faites is irregular. \"vous faisez\" is one of the most common written errors."
  },

  "a0.verbs.venir": {
    usage: "Coming, coming from a place, and the passé récent (venir de + infinitive = to have just done something).",
    more: [
      ["Je viens de Paris.", "I come from Paris."],
      ["Elle vient de partir.", "She has just left."],
      ["Ils viennent demain.", "They are coming tomorrow."]
    ],
    tip: "venir de + place = come from; venir de + verb = have just done. Same words, different job."
  },

  "a0.adjectives.colors": {
    usage: "Colours agree like any other adjective — except the ones borrowed from nouns, which never change.",
    more: [
      ["une fleur rouge", "a red flower"],
      ["des yeux bleus", "blue eyes"],
      ["des chaussures marron", "brown shoes"]
    ],
    tip: "rose, orange and marron are named after flowers, fruit and chestnuts, so they stay frozen: des fleurs orange, never oranges."
  },

  "a0.expressions.time": {
    usage: "Asking and telling the time, making appointments.",
    more: [
      ["Il est trois heures et quart.", "It is a quarter past three."],
      ["Il est midi et demi.", "It is half past twelve."],
      ["Il est sept heures moins le quart.", "It is a quarter to seven."]
    ],
    tip: "French counts hours, not points: il est trois heures, literally \"it is three hours\". Midi and minuit take no heure."
  },

  "a0.expressions.weather": {
    usage: "Weather almost always runs through il fait, il pleut or il neige. The il carries no meaning at all.",
    more: [
      ["Il fait froid en hiver.", "It is cold in winter."],
      ["Il pleut depuis ce matin.", "It has been raining since this morning."],
      ["Il y a du vent.", "It is windy."]
    ],
    tip: "Never swap that il for elle, even when talking about la pluie. Weather il is fixed."
  },

  "a0.syntax.questions_intonation": {
    usage: "The everyday way to ask a yes/no question in speech. Same words as the statement, rising tone at the end.",
    more: [
      ["Tu viens ?", "Are you coming?"],
      ["Vous parlez anglais ?", "Do you speak English?"],
      ["C'est bon ?", "Is it good?"]
    ],
    tip: "In writing, est-ce que or inversion is safer. In speech, intonation is what people actually use."
  },

  "a0.verbs.prendre": {
    usage: "Taking something, taking transport, and having food or drink (prendre un café).",
    more: [
      ["Je prends le métro.", "I take the metro."],
      ["Elle prend un café.", "She has a coffee."],
      ["Nous prenons le train à huit heures.", "We take the train at eight."]
    ],
    tip: "Every form keeps the d except the third person singular: il prend."
  },

  "a0.nouns.days_months": {
    usage: "Dates and appointments. Days and months are lowercase in French — capitalising them is an English habit.",
    more: [
      ["On se voit lundi.", "See you Monday."],
      ["Mon anniversaire est en mars.", "My birthday is in March."],
      ["Le 14 juillet est un jour férié.", "July 14 is a public holiday."]
    ],
    tip: "French dates run day then month: le 3 mai, not \"mai 3\"."
  },

  "a0.expressions.greetings": {
    usage: "Opening and closing an interaction, and the small politeness formulas that make you sound civil rather than rude.",
    more: [
      ["Bonne journée !", "Have a good day!"],
      ["À bientôt !", "See you soon!"],
      ["Excusez-moi, je suis en retard.", "Sorry, I am late."]
    ],
    tip: "bonjour covers the whole day, bonsoir takes over in the evening, and salut is only for people you would call by first name."
  },

  "a0.nouns.numbers": {
    usage: "Prices, times, ages, phone numbers. These come up in almost every real conversation, so they are worth drilling until automatic.",
    more: [
      ["Ça fait douze euros.", "That comes to twelve euros."],
      ["J'ai dix-huit ans.", "I am eighteen."],
      ["Il est neuf heures.", "It is nine o'clock."]
    ],
    tip: "17 to 19 are literally ten-seven, ten-eight, ten-nine: dix-sept, dix-huit, dix-neuf."
  },

  "a1.negation.ne_pas": {
    usage: "Negates any verb. In speech the ne is often swallowed (\"j'sais pas\"), but in writing it must be there — dropping it looks sloppy rather than casual.",
    more: [
      ["Je ne comprends pas.", "I don't understand."],
      ["Il n'y a plus de pain.", "There is no more bread."],
      ["Nous ne sommes pas prêts.", "We are not ready."]
    ],
    tip: "The ne elides before a vowel: je ne ai becomes je n'ai. That apostrophe is not optional."
  },

  "a1.questions.est_ce_que": {
    usage: "The safest way to ask anything — spoken and written, formal and casual. No inversion to memorise.",
    more: [
      ["Est-ce que tu viens ?", "Are you coming?"],
      ["Est-ce qu'il pleut ?", "Is it raining?"],
      ["Quand est-ce que tu pars ?", "When are you leaving?"]
    ],
    tip: "Question word first, then est-ce que, then the statement word order unchanged."
  },

  "a1.possessives": {
    usage: "Saying my/your/his/her. The form follows the gender and number of the thing owned, not of the owner.",
    more: [
      ["mon père et ma mère", "my father and my mother"],
      ["son frère", "his or her brother"],
      ["leurs enfants", "their children"]
    ],
    tip: "son and sa do not tell you whether the owner is male or female. son livre could be his book or her book."
  },

  "a1.adjectives.agreement": {
    usage: "Adjectives copy the gender and number of the noun. This is the single most common thing to get wrong when writing French.",
    more: [
      ["un petit chat / une petite chatte", "a small cat (m/f)"],
      ["des amis français / des amies françaises", "French friends (m/f)"],
      ["un livre intéressant / une idée intéressante", "interesting (m/f)"]
    ],
    tip: "A few feminines are irregular and worth memorising: beau → belle, vieux → vieille, blanc → blanche, bon → bonne."
  },

  "a1.aller.prepositions": {
    usage: "Saying where you are going. The preposition changes with the kind of place, not with the verb.",
    more: [
      ["Je vais à Paris.", "I am going to Paris. (city: à)"],
      ["Je vais en France.", "I am going to France. (feminine country: en)"],
      ["Je vais au Canada.", "I am going to Canada. (masculine country: au)"]
    ],
    tip: "Countries ending in -e are usually feminine (la France, la Chine); the rest are masculine. Watch the exceptions: le Mexique, le Cambodge."
  },

  "a1.passe_recent": {
    usage: "Something that happened a moment ago. Stronger and more immediate than the passé composé.",
    more: [
      ["Je viens d'arriver.", "I have just arrived."],
      ["Elle vient de partir.", "She has just left."],
      ["Nous venons de manger.", "We have just eaten."]
    ],
    tip: "venir stays in the present; the action verb stays in the infinitive. Only venir carries the tense."
  },

  "a1.articles.partitive": {
    usage: "An unspecified amount of something you cannot count — food, drink, abstract nouns. English usually uses no article here.",
    more: [
      ["Je bois du café.", "I drink coffee."],
      ["Elle mange de la soupe.", "She eats soup."],
      ["Nous achetons des fruits.", "We buy fruit."]
    ],
    tip: "After a negation the partitive collapses to de: Je ne bois pas de café."
  },

  "a1.adjectives.demonstrative": {
    usage: "Pointing at this or that. cet exists purely to stop two vowels colliding.",
    more: [
      ["ce livre", "this book"],
      ["cet homme", "this man"],
      ["cette femme", "this woman"],
      ["ces enfants", "these children"]
    ],
    tip: "ce homme is unpronounceable, which is exactly why cet homme exists."
  },

  "a1.verbs.futur_proche": {
    usage: "Plans and imminent events. In conversation this replaces the simple future almost entirely.",
    more: [
      ["Je vais téléphoner.", "I am going to call."],
      ["Il va pleuvoir.", "It is going to rain."],
      ["Nous allons déménager.", "We are going to move house."]
    ],
    tip: "Two parts, both required: aller conjugated plus the infinitive. Je vais téléphoner, never je vais téléphone."
  },

  "a1.verbs.reflexive": {
    usage: "The action loops back to the subject: getting up, washing, remembering, arguing with each other.",
    more: [
      ["Je me lève à sept heures.", "I get up at seven."],
      ["Elle se lave les mains.", "She washes her hands."],
      ["Nous nous souvenons.", "We remember."]
    ],
    tip: "In the negative the ne goes before the reflexive pronoun: je ne me lève pas."
  },

  "a1.verbs.imperative": {
    usage: "Orders, advice, instructions, recipes. No subject pronoun at all.",
    more: [
      ["Parle plus lentement !", "Speak more slowly!"],
      ["Finissez vos devoirs.", "Finish your homework."],
      ["Ne fumez pas ici.", "Do not smoke here."]
    ],
    tip: "-er verbs drop the -s in the tu form so the two words do not blur together: parle, not parles."
  },

  "a1.prepositions.place": {
    usage: "Saying where something sits relative to something else.",
    more: [
      ["Le chat est sur la table.", "The cat is on the table."],
      ["Les clés sont dans mon sac.", "The keys are in my bag."],
      ["La banque est à côté de la gare.", "The bank is next to the station."]
    ],
    tip: "Compound prepositions ending in de contract: à côté de + le parc → à côté du parc."
  },

  "a1.pronouns.stress": {
    usage: "After a preposition, for emphasis, and when answering with just a pronoun.",
    more: [
      ["C'est pour moi.", "It is for me."],
      ["Moi, je préfère le thé.", "Me, I prefer tea."],
      ["Ils viennent avec nous.", "They are coming with us."]
    ],
    tip: "English \"me too\" is moi aussi. Saying je aussi is a giveaway that you translated word for word."
  },

  "a1.verbs.modals": {
    usage: "Ability, wanting and obligation. The second verb stays in the infinitive with no preposition between them.",
    more: [
      ["Je peux venir.", "I can come."],
      ["Elle veut partir.", "She wants to leave."],
      ["Nous devons travailler.", "We have to work."]
    ],
    tip: "English says \"want to go\"; French says vouloir aller. No \"to\" in the middle."
  },

  "a1.adjectives.comparative": {
    usage: "Comparing two things on a scale: more, less, as much.",
    more: [
      ["Il est plus grand que moi.", "He is taller than me."],
      ["Ce livre est moins cher.", "This book is cheaper."],
      ["Elle est aussi intelligente que lui.", "She is as clever as him."]
    ],
    tip: "bon → meilleur and bien → mieux. \"plus bon\" and \"plus bien\" are simply wrong."
  },

  "a1.syntax.negation_rien_jamais": {
    usage: "Nothing and never. These replace pas — they are not added on top of it.",
    more: [
      ["Je ne vois rien.", "I see nothing."],
      ["Il ne mange jamais de viande.", "He never eats meat."],
      ["Elle n'a rien dit.", "She said nothing."]
    ],
    tip: "\"ne ... pas rien\" is a double negative and does not exist. rien already carries the negation."
  },

  "a1.expressions.quantity": {
    usage: "Talking about amounts without exact numbers. The noun after de never takes an article.",
    more: [
      ["beaucoup de travail", "a lot of work"],
      ["un peu de sucre", "a little sugar"],
      ["trop de bruit", "too much noise"]
    ],
    tip: "Two exceptions keep the article: bien des and la plupart des."
  },

  "a1.prepositions.time": {
    usage: "Clock time, days, months, and how far in the future something is.",
    more: [
      ["à huit heures", "at eight o'clock"],
      ["le lundi", "on Mondays"],
      ["en juillet", "in July"],
      ["dans deux jours", "in two days"]
    ],
    tip: "dans looks forward from now; en measures duration. Je le fais en deux heures means it takes two hours."
  },

  "a1.verbs.irregular_ir": {
    usage: "partir, dormir, sortir and friends drop the final consonant in the singular, then grow it back in the plural.",
    more: [
      ["Je pars demain.", "I leave tomorrow."],
      ["Tu dors encore ?", "Are you still asleep?"],
      ["Ils sortent ce soir.", "They are going out tonight."]
    ],
    tip: "Short in je/tu/il, long in nous/vous/ils. Feel that rhythm and the endings follow."
  },

  "a1.verbs.stem_changing": {
    usage: "acheter, préférer, appeler — the stem vowel shifts whenever the stress lands on it.",
    more: [
      ["J'achète du pain.", "I buy bread."],
      ["Je préfère le café.", "I prefer coffee."],
      ["Nous achetons, vous achetez", "no change in nous/vous"]
    ],
    tip: "nous and vous never change, because the stress sits on the ending, not the stem."
  },

  "a1.pronouns.indefinite": {
    usage: "Someone, something, nobody, nothing. personne and rien are inherently negative.",
    more: [
      ["Quelqu'un a appelé.", "Someone called."],
      ["Je cherche quelque chose.", "I am looking for something."],
      ["Personne n'est venu.", "Nobody came."]
    ],
    tip: "When personne is the subject, the ne still appears: Personne n'est venu."
  },

  "a1.syntax.connectors_basic": {
    usage: "Joining clauses so you can say more than one thing at a time.",
    more: [
      ["Je suis fatigué mais je continue.", "I am tired but I continue."],
      ["Il pleut, donc je reste.", "It is raining, so I am staying."],
      ["Je pars parce que je suis en retard.", "I am leaving because I am late."]
    ],
    tip: "parce que answers \"why\" in speech; car is its more formal written cousin. Neither means \"so that\" — that is pour que."
  },

  "a1.expressions.food": {
    usage: "Reading a menu, ordering, paying. The vocabulary is small but the words are easy to confuse.",
    more: [
      ["Je voudrais le menu, s'il vous plaît.", "I would like the set menu, please."],
      ["L'addition, s'il vous plaît.", "The bill, please."],
      ["Qu'est-ce que vous recommandez ?", "What do you recommend?"]
    ],
    tip: "le menu is the fixed-price set meal; la carte is the full list you order from. Asking for \"the menu\" when you want la carte is a classic slip."
  },

  "a1.adjectives.position_meaning": {
    usage: "A handful of adjectives change meaning depending on whether they sit before or after the noun.",
    more: [
      ["un ancien professeur", "a former teacher"],
      ["un professeur ancien", "an elderly teacher"],
      ["mon propre lit / un lit propre", "my own bed / a clean bed"]
    ],
    tip: "Before the noun reads as figurative or subjective; after the noun reads as literal and physical."
  },

  "a1.negation.plus_personne": {
    usage: "No longer, and nobody. Both slot into the same ne ... position as pas.",
    more: [
      ["Je ne fume plus.", "I no longer smoke."],
      ["Il ne voit personne.", "He sees nobody."],
      ["Elle n'écoute plus personne.", "She listens to nobody any more."]
    ],
    tip: "In this negative plus the s is silent (plu). The \"more\" plus keeps it (pluss). Same spelling, different word."
  },

  "a1.expressions.il_faut": {
    usage: "Saying something is necessary, with no named person doing it. Extremely common and completely impersonal.",
    more: [
      ["Il faut partir.", "We have to leave."],
      ["Il faut de l'eau.", "Some water is needed."],
      ["Il ne faut pas fumer ici.", "You must not smoke here."]
    ],
    tip: "That il refers to nobody. You cannot swap it for je or tu — for a specific person you need devoir."
  },

  "a1.adverbs.intensity": {
    usage: "Dialling an adjective or adverb up or down.",
    more: [
      ["Il est très grand.", "He is very tall."],
      ["C'est trop cher.", "It is too expensive."],
      ["J'ai assez mangé.", "I have eaten enough."]
    ],
    tip: "très cannot modify a verb. \"I like it very much\" is j'aime beaucoup, not j'aime très."
  },

  "a1.adverbs.place_time": {
    usage: "Here, there, now, soon, yesterday, today. Short words that anchor a sentence in space or time.",
    more: [
      ["Je suis ici.", "I am here."],
      ["Il arrive demain.", "He arrives tomorrow."],
      ["Nous partons maintenant.", "We are leaving now."]
    ],
    tip: "Time adverbs float: Demain, il arrive and Il arrive demain are both fine. Place adverbs stay closer to the verb."
  },

  "a1.pronouns.on": {
    usage: "The everyday stand-in for we, and also for people in general. The verb stays third person singular.",
    more: [
      ["On y va ?", "Shall we go?"],
      ["On dit que...", "People say that..."],
      ["On a fini.", "We have finished."]
    ],
    tip: "on takes il/elle verb forms no matter how many people are involved: on est, on a, on va."
  }
};
