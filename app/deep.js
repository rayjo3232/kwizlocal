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
    tip: "rose, orange and marron are named after a flower, a fruit and a chestnut, so as colours they never change: des fleurs orange, not des fleurs oranges. Note the trap — the fruit itself is normal: j'achète des oranges."
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
  },

  /* ---- A2 ---- */
  "a2.passe_compose.avoir": {
    usage: "The default past tense for almost every verb. Built from a present-tense avoir plus the past participle.",
    more: [
      ["J'ai mangé une pomme.", "I ate an apple."],
      ["Nous avons fini le travail.", "We finished the work."],
      ["Elle a répondu à ma question.", "She answered my question."]
    ],
    tip: "With avoir the participle never agrees with the subject: elle a répondu, never répondue."
  },

  "a2.passe_compose.etre": {
    usage: "A short list of movement and change-of-state verbs take être instead, and their participle agrees with the subject.",
    more: [
      ["Elle est arrivée hier.", "She arrived yesterday."],
      ["Ils sont partis tôt.", "They left early."],
      ["Nous sommes restés à la maison.", "We stayed at home."]
    ],
    tip: "The list is aller, venir, arriver, partir, entrer, sortir, naître, mourir, rester, tomber, monter, descendre, retourner — plus all reflexive verbs."
  },

  "a2.imparfait.formation": {
    usage: "Take the nous form of the present, drop -ons, add the imperfect endings. One stem serves all six persons.",
    more: [
      ["nous parlons → je parlais", "I was speaking"],
      ["nous finissons → il finissait", "he was finishing"],
      ["être → j'étais", "the only irregular stem"]
    ],
    tip: "être is the sole exception (stem ét-). Everything else, including irregular verbs, follows the nous form."
  },

  "a2.imparfait_vs_pc": {
    usage: "The imperfect paints the background — habits, weather, states, things in progress. The passé composé reports events that happened and finished.",
    more: [
      ["Je lisais quand il est arrivé.", "I was reading when he arrived."],
      ["Quand j'étais petit, je jouais dehors.", "When I was little, I played outside."],
      ["Hier, j'ai vu Marie.", "Yesterday I saw Marie."]
    ],
    tip: "Ask yourself: am I describing, or reporting one thing that happened? Describing → imparfait. One event → passé composé."
  },

  "a2.pronouns.cod": {
    usage: "le, la, les stand in for a direct object already mentioned. They go before the verb, not after it as in English.",
    more: [
      ["Tu connais Marie ? — Oui, je la connais.", "Do you know Marie? Yes, I know her."],
      ["Le livre ? Je l'ai lu.", "The book? I've read it."],
      ["Les clés, je les cherche.", "The keys, I'm looking for them."]
    ],
    tip: "A direct object pronoun in front of a passé composé makes the participle agree: je les ai lus."
  },

  "a2.pronouns.y_en": {
    usage: "y replaces a place or an à-phrase; en replaces a de-phrase or a quantity. Both sit before the verb.",
    more: [
      ["Tu vas à Paris ? — J'y vais.", "Are you going to Paris? I'm going there."],
      ["Tu veux du café ? — J'en veux.", "Do you want coffee? I want some."],
      ["Combien de frères ? — J'en ai deux.", "How many brothers? I have two."]
    ],
    tip: "y answers \"where / to what\"; en answers \"of what / how many\". Getting these two straight removes a lot of hesitation."
  },

  "a2.pronouns.coi": {
    usage: "lui and leur replace an à + person phrase. Same slot as the direct object pronouns.",
    more: [
      ["Je parle à Marie → Je lui parle.", "I speak to her."],
      ["Il téléphone à ses parents → Il leur téléphone.", "He calls them."],
      ["Tu lui as dit ?", "Did you tell him?"]
    ],
    tip: "lui is singular for both genders; leur is plural for both. Unlike le/la, they do not mark gender."
  },

  "a2.syntax.relative_ou": {
    usage: "Beyond asking where, où links a clause to a place or a moment in time.",
    more: [
      ["La ville où je suis né.", "The town where I was born."],
      ["Le jour où on s'est rencontrés.", "The day we met."],
      ["C'est le moment où il faut partir.", "This is the moment when we have to leave."]
    ],
    tip: "English splits this into where and when; French uses où for both."
  },

  "a2.syntax.time_markers": {
    usage: "depuis = since/for, and the action is still going. pendant = for, and it is over. il y a = ago.",
    more: [
      ["J'habite ici depuis 2019.", "I have lived here since 2019."],
      ["J'ai travaillé pendant deux ans.", "I worked for two years."],
      ["Il est parti il y a trois jours.", "He left three days ago."]
    ],
    tip: "depuis takes the present tense in French, not the perfect: j'habite ici depuis 2019, not j'ai habité."
  },

  "a2.adjectives.superlative": {
    usage: "le plus / le moins plus the adjective. The article agrees with the noun.",
    more: [
      ["C'est le meilleur restaurant.", "It is the best restaurant."],
      ["la moins chère", "the cheapest (feminine)"],
      ["le plus intéressant", "the most interesting"]
    ],
    tip: "bon → meilleur. \"le plus bon\" does not exist."
  },

  "a2.adjectives.adverbs_ment": {
    usage: "Most adverbs are built from the feminine form of the adjective plus -ment.",
    more: [
      ["lent → lentement", "slowly"],
      ["heureux → heureusement", "fortunately"],
      ["vrai → vraiment", "really"]
    ],
    tip: "Adjectives ending in -ent or -ant become -emment or -amment, and both are pronounced the same."
  },

  "a2.prepositions.geography": {
    usage: "en for feminine countries and continents, au for masculine ones, aux for plurals, à for cities.",
    more: [
      ["en France, en Italie, en Afrique", "feminine or vowel-initial"],
      ["au Canada, au Japon, au Maroc", "masculine"],
      ["aux États-Unis, aux Philippines", "plural"]
    ],
    tip: "Countries ending in -e are usually feminine, but le Mexique, le Cambodge and le Zimbabwe break the rule."
  },

  "a2.verbs.pronominaux_passe": {
    usage: "Reflexive verbs take être in the passé composé, and the participle agrees with the subject unless a direct object follows.",
    more: [
      ["Je me suis levé tôt.", "I got up early."],
      ["Elle s'est couchée tard.", "She went to bed late."],
      ["Nous nous sommes amusés.", "We had fun."]
    ],
    tip: "Elle s'est lavée (agrees) but elle s'est lavé les mains (no agreement, because les mains is the object)."
  },

  "a2.verbs.imparfait_usage": {
    usage: "Past habits and background states: what used to happen, what things were like.",
    more: [
      ["Avant, je fumais.", "I used to smoke."],
      ["Il faisait beau ce jour-là.", "The weather was nice that day."],
      ["Elle avait vingt ans.", "She was twenty."]
    ],
    tip: "English \"used to\" and \"was -ing\" almost always map to the imparfait."
  },

  "a2.pronouns.possessive": {
    usage: "le mien, la mienne, les miens replace my + noun. The article and the possessive both agree with the thing owned.",
    more: [
      ["Ton stylo ? J'ai pris le mien.", "Your pen? I took mine."],
      ["Leurs enfants et les nôtres.", "Their children and ours."],
      ["C'est la mienne.", "It is mine (feminine)."]
    ],
    tip: "Two parts, both inflected: le mien, la mienne, les miens, les miennes."
  },

  "a2.pronouns.demonstrative": {
    usage: "celui, celle, ceux, celles stand in for \"the one(s)\" so you do not repeat the noun. They never appear alone.",
    more: [
      ["Quel livre ? — Celui de Marie.", "Which book? Marie's."],
      ["Je préfère celle-ci.", "I prefer this one."],
      ["Ceux qui travaillent réussissent.", "Those who work succeed."]
    ],
    tip: "Always followed by de, qui, or -ci / -là. A bare celui is incomplete."
  },

  "a2.syntax.cause_consequence": {
    usage: "parce que gives the reason, comme puts it up front, donc and c'est pourquoi introduce the result.",
    more: [
      ["Il est absent parce qu'il est malade.", "He is absent because he is ill."],
      ["Comme il pleuvait, on est restés.", "Since it was raining, we stayed."],
      ["Il pleut, donc je prends un parapluie.", "It is raining, so I am taking an umbrella."]
    ],
    tip: "comme sits at the head of the sentence; parce que answers a question. Swapping them sounds wrong even when the meaning is clear."
  },

  "a2.expressions.avoir": {
    usage: "French says you *have* hunger, thirst, fear and need where English says you *are* hungry, thirsty or afraid.",
    more: [
      ["J'ai faim.", "I am hungry."],
      ["Elle a peur des araignées.", "She is afraid of spiders."],
      ["Nous avons besoin d'aide.", "We need help."]
    ],
    tip: "avoir envie de = want, avoir besoin de = need. Both take de before a noun or an infinitive."
  },

  "a2.verbs.accord_participe": {
    usage: "With avoir, the past participle agrees only when the direct object comes before the verb.",
    more: [
      ["Les fleurs que j'ai cueillies.", "The flowers I picked."],
      ["Je les ai vus.", "I saw them."],
      ["Elle a écrit les lettres.", "She wrote the letters — no agreement."]
    ],
    tip: "The test is position, not meaning: object before the verb → agree; object after → leave it alone."
  },

  "a2.syntax.discours_indirect": {
    usage: "Reporting what someone said. If the reporting verb is past, the reported tense shifts back one step.",
    more: [
      ["Il dit qu'il est malade.", "He says he is ill."],
      ["Il a dit qu'il était malade.", "He said he was ill."],
      ["Elle demande si je viens.", "She asks whether I am coming."]
    ],
    tip: "Present becomes imperfect, passé composé becomes plus-que-parfait. Yes/no questions use si, not que."
  },

  "a2.pronouns.indefinite": {
    usage: "chacun, plusieurs, certains, la plupart — vague quantities without a number.",
    more: [
      ["Chacun a son opinion.", "Everyone has their opinion."],
      ["Plusieurs sont venus.", "Several came."],
      ["La plupart des gens pensent que...", "Most people think that..."]
    ],
    tip: "la plupart always needs de + definite article; chacun is always singular, even when it means everyone."
  },

  "a2.prepositions.expressions": {
    usage: "à cause de blames, grâce à credits, malgré concedes.",
    more: [
      ["À cause de la pluie, on est restés.", "Because of the rain, we stayed."],
      ["Grâce à toi, j'ai réussi.", "Thanks to you, I succeeded."],
      ["Malgré la fatigue, il continue.", "Despite the fatigue, he continues."]
    ],
    tip: "malgré takes a noun directly — no de. \"malgré de la fatigue\" is wrong."
  },

  "a2.expressions.faux_amis": {
    usage: "Words that look English but are not. These cause more embarrassment than grammar mistakes.",
    more: [
      ["actuellement = currently, not actually", "actually = en fait"],
      ["éventuellement = possibly, not eventually", "eventually = finalement"],
      ["assister à = to attend, not to assist", "to assist = aider"]
    ],
    tip: "The closer a word looks to English, the more it is worth checking. actuellement / actually is the classic trap."
  },

  "a2.syntax.interrogation_quel": {
    usage: "quel is an adjective and needs a noun; lequel is a pronoun and stands alone.",
    more: [
      ["Quel livre ?", "Which book?"],
      ["Quelle heure est-il ?", "What time is it?"],
      ["Lequel préfères-tu ?", "Which one do you prefer?"]
    ],
    tip: "lequel contracts with à and de: auquel, duquel, auxquels, desquels."
  },

  "a2.adverbs.frequency": {
    usage: "toujours, souvent, parfois, rarement, jamais — how often something happens.",
    more: [
      ["Je vais souvent au cinéma.", "I often go to the cinema."],
      ["Il a toujours aimé ça.", "He has always liked that."],
      ["Elle ne fume jamais.", "She never smokes."]
    ],
    tip: "In a compound tense the adverb sits between auxiliary and participle: j'ai souvent vu, not j'ai vu souvent."
  },

  "a2.verbs.politesse": {
    usage: "The conditional softens a request. je voudrais and pourriez-vous are the standard polite forms.",
    more: [
      ["Je voudrais un café.", "I would like a coffee."],
      ["Pourriez-vous m'aider ?", "Could you help me?"],
      ["Auriez-vous un moment ?", "Would you have a moment?"]
    ],
    tip: "je veux is not rude, but it is blunt. In shops and offices, je voudrais is what people expect."
  },

  "a2.adjectives.tout": {
    usage: "As an adjective it means all/every and agrees; as an adverb it means completely and usually stays invariable.",
    more: [
      ["Tous les étudiants sont là.", "All the students are here."],
      ["Toute la journée.", "All day."],
      ["Il est tout content.", "He is completely happy."]
    ],
    tip: "Adjective → agrees (tout, toute, tous, toutes). Adverb → frozen as tout, except before a feminine adjective starting with a consonant."
  },

  "a2.prepositions.movement": {
    usage: "vers heads towards, jusqu'à goes as far as, à travers cuts through.",
    more: [
      ["Il marche vers la gare.", "He walks towards the station."],
      ["Nous avons marché jusqu'au parc.", "We walked as far as the park."],
      ["À travers la forêt.", "Through the forest."]
    ],
    tip: "vers only gives a direction and may never arrive; jusqu'à insists on reaching the endpoint."
  },

  "a2.syntax.interrogation_complete": {
    usage: "The full question-word set, used with est-ce que or inversion.",
    more: [
      ["Pourquoi est-ce que tu pars ?", "Why are you leaving?"],
      ["Combien ça coûte ?", "How much does it cost?"],
      ["Depuis quand habites-tu ici ?", "Since when have you lived here?"]
    ],
    tip: "combien takes de before a noun: combien de personnes, combien d'argent."
  },

  /* ---------- B1 ---------- */

  "b1.future.simple": {
    usage: "For plans, predictions and promises further ahead. Speech often uses aller + infinitive instead, but writing and formal speech keep the simple future.",
    more: [
      ["Je te rappellerai demain.", "I'll call you back tomorrow."],
      ["Il pleuvra toute la journée.", "It will rain all day."],
      ["Nous partirons dès qu'il sera prêt.", "We'll leave as soon as he's ready."]
    ],
    tip: "The endings -ai, -as, -a, -ons, -ez, -ont are the present of avoir worn down. Irregular stems: ser-, aur-, ir-, fer-, pourr-, viendr-."
  },

  "b1.conditional.present": {
    usage: "Polite requests, hypotheses (with si + imparfait), and reported future. It softens a demand the way English uses 'would'.",
    more: [
      ["Je voudrais un café, s'il vous plaît.", "I would like a coffee, please."],
      ["Si j'avais le temps, je viendrais.", "If I had time, I would come."],
      ["Il a dit qu'il partirait.", "He said he would leave."]
    ],
    tip: "Same stem as the future, different endings: take the futur stem and add the imparfait endings — je serais, tu serais, il serait."
  },

  "b1.subjunctive.present": {
    usage: "After expressions of will, need, doubt or emotion, and after certain conjunctions, when the two clauses have different subjects.",
    more: [
      ["Il faut que tu partes.", "You must leave."],
      ["Je doute qu'il vienne.", "I doubt he'll come."],
      ["Bien que je sois fatigué, je continue.", "Although I'm tired, I carry on."]
    ],
    tip: "The trigger is almost always que. If both clauses share a subject, use an infinitive instead: je veux partir, not *je veux que je parte*."
  },

  "b1.relative.qui_que": {
    usage: "qui is the subject of the clause that follows; que is the direct object. Choose by looking at what comes right after the pronoun.",
    more: [
      ["La femme qui chante est ma sœur.", "The woman who is singing is my sister."],
      ["Le film que nous avons vu était long.", "The film we saw was long."],
      ["C'est l'ami qu'elle cherche.", "It's the friend she's looking for."]
    ],
    tip: "A verb straight after → qui (subject). A subject + verb after → que (object). que elides to qu' before a vowel."
  },

  "b1.comparison": {
    usage: "Compare with plus / moins / aussi + adjective + que. The superlative adds le/la/les plus or moins.",
    more: [
      ["Il est plus grand que moi.", "He is taller than me."],
      ["Ce livre est moins cher que l'autre.", "This book is cheaper than the other."],
      ["C'est la meilleure idée.", "It's the best idea."]
    ],
    tip: "bon → meilleur, bien → mieux. Never say *plus meilleur* — meilleur is already comparative."
  },

  "b1.pronoun_order": {
    usage: "When two object pronouns meet, they queue in a fixed order. Learn the queue, not a rule.",
    more: [
      ["Il me le donne.", "He gives it to me."],
      ["Je le lui ai envoyé.", "I sent it to him."],
      ["Nous y en avons mis.", "We put some there."]
    ],
    tip: "Order: me/te/se/nous/vous → le/la/les → lui/leur → y → en. You never use two from the same column."
  },

  "b1.verbs.plus_que_parfait": {
    usage: "The past of the past: an action already finished before another past action — English 'had done'.",
    more: [
      ["J'avais déjà mangé quand il est arrivé.", "I had already eaten when he arrived."],
      ["Elle était partie avant midi.", "She had left before noon."],
      ["Nous avions fini le travail.", "We had finished the work."]
    ],
    tip: "avoir/être in the imparfait + past participle. With être the participle agrees: elle était partie, ils étaient partis."
  },

  "b1.verbs.passive": {
    usage: "Put the action or the object in focus instead of the doer: être + past participle (+ par + agent).",
    more: [
      ["Le roman a été écrit par Hugo.", "The novel was written by Hugo."],
      ["Les fenêtres sont fermées.", "The windows are closed."],
      ["Cette maison est construite en pierre.", "This house is built of stone."]
    ],
    tip: "The participle agrees with the subject, never with the agent: les lettres sont écrites par Marie."
  },

  "b1.syntax.relative_dont": {
    usage: "dont replaces de + noun. It covers possession ('whose') and verbs built with de: parler de, avoir besoin de.",
    more: [
      ["Le film dont je parle est célèbre.", "The film I'm talking about is famous."],
      ["L'homme dont je connais la fille.", "The man whose daughter I know."],
      ["Voici le livre dont j'ai besoin.", "Here is the book I need."]
    ],
    tip: "If the verb takes de, use dont and drop the de: parler de → le film dont je parle. Never *dont je parle de*."
  },

  "b1.syntax.si_clauses": {
    usage: "The three-step ladder: si + present → future (real); si + imparfait → conditional (unreal now); si + plus-que-parfait → conditional past (unreal then).",
    more: [
      ["Si tu viens, nous mangerons.", "If you come, we'll eat."],
      ["Si j'avais de l'argent, j'achèterais une voiture.", "If I had money, I'd buy a car."],
      ["Si j'avais su, je serais venu.", "If I had known, I would have come."]
    ],
    tip: "Never put a conditional right after si. *Si je serais* is wrong — it's si j'étais."
  },

  "b1.verbs.gerondif": {
    usage: "en + present participle shows how or while something happens: manner, simultaneity, condition.",
    more: [
      ["Il apprend en écoutant.", "He learns by listening."],
      ["Elle a réussi en travaillant dur.", "She succeeded by working hard."],
      ["En arrivant, j'ai vu Marie.", "On arriving, I saw Marie."]
    ],
    tip: "The gerund's subject must match the main verb's, otherwise use a full clause. Don't confuse en + -ant (gerund) with bare -ant (present participle)."
  },

  "b1.expressions.connectors": {
    usage: "Logical links that make writing flow: addition, contrast, cause, consequence.",
    more: [
      ["Il pleut ; cependant, nous sortons.", "It's raining; however, we're going out."],
      ["Je pense, donc je suis.", "I think, therefore I am."],
      ["Elle est malade ; en effet, elle tousse.", "She's ill; indeed, she's coughing."]
    ],
    tip: "cependant and pourtant both mean 'yet', but pourtant stresses surprise. donc = consequence; en effet = confirmation."
  },

  "b1.verbs.subjunctive_conj": {
    usage: "Certain conjunctions always drag the subjunctive in: bien que, pour que, avant que, à condition que, quoique.",
    more: [
      ["Bien qu'il soit jeune, il est compétent.", "Although he's young, he's competent."],
      ["Je le fais pour que tu comprennes.", "I do it so that you understand."],
      ["Pars avant qu'il ne pleuve.", "Leave before it rains."]
    ],
    tip: "après que takes the indicative, avant que the subjunctive. The ne after avant que is expletive, not negative."
  },

  "b1.verbs.conditional_past": {
    usage: "Would have done: regret or an unreal past. avoir/être in the conditional + past participle.",
    more: [
      ["J'aurais mangé si j'avais eu faim.", "I would have eaten if I had been hungry."],
      ["Elle serait partie plus tôt.", "She would have left earlier."],
      ["Nous aurions dû écouter.", "We should have listened."]
    ],
    tip: "In a si-sentence the past conditional is the 'then' half, never the 'if' half: si j'avais su, j'aurais répondu."
  },

  "b1.syntax.inversion": {
    usage: "Formal or literary questions put the verb before the subject with a hyphen. In speech, est-ce que usually replaces it.",
    more: [
      ["Parles-tu français ?", "Do you speak French?"],
      ["Où vas-tu ?", "Where are you going?"],
      ["Que faites-vous ce soir ?", "What are you doing tonight?"]
    ],
    tip: "A vowel-initial verb needs -t- before il/elle/on: va-t-il, a-t-elle. puis-je is the one irregular je form."
  },

  "b1.syntax.emphasis": {
    usage: "Spotlight one element by framing it with c'est ... qui (subject) or c'est ... que (object).",
    more: [
      ["C'est Marie qui a appelé.", "It was Marie who called."],
      ["C'est ce livre que je veux.", "It's this book I want."],
      ["C'est à Paris qu'ils habitent.", "It's in Paris that they live."]
    ],
    tip: "qui if the spotlighted element is the subject of the following verb; que otherwise. Before a vowel, que → qu'."
  },

  "b1.pronouns.relative_compose": {
    usage: "ce qui / ce que refer to a whole idea or an unnamed thing — 'what' as a noun clause.",
    more: [
      ["Ce qui m'intéresse, c'est la musique.", "What interests me is music."],
      ["Je ne comprends pas ce que tu dis.", "I don't understand what you're saying."],
      ["Ce qu'il veut, c'est partir.", "What he wants is to leave."]
    ],
    tip: "ce qui = subject of the clause; ce que = object. A verb straight after → ce qui; subject + verb → ce que."
  },

  "b1.expressions.formal": {
    usage: "Written or polite French: full negation, nous instead of on, and fixed formulas for letters and service encounters.",
    more: [
      ["Veuillez patienter un instant.", "Please wait a moment."],
      ["Je vous prie de m'excuser.", "I beg your pardon."],
      ["Nous vous remercions de votre réponse.", "We thank you for your reply."]
    ],
    tip: "In formal writing ne is never dropped: je ne sais pas, not je sais pas. Sign off with Cordialement or Bien à vous."
  },

  "b1.verbs.futur_anterieur": {
    usage: "Will have done: an action completed before a future moment, often after quand, dès que, lorsque.",
    more: [
      ["J'aurai fini avant midi.", "I'll have finished before noon."],
      ["Elle sera partie à notre arrivée.", "She'll have left by the time we arrive."],
      ["Dès qu'il aura mangé, il sortira.", "As soon as he has eaten, he'll go out."]
    ],
    tip: "After quand/dès que about the future, French uses the future perfect, not the future: quand j'aurai fini, not *quand je finirai*."
  },

  "b1.syntax.concession": {
    usage: "Admit a fact that works against the main clause: bien que / quoique + subjunctive, même si + indicative.",
    more: [
      ["Bien qu'il soit jeune, il est compétent.", "Although he's young, he's competent."],
      ["Même s'il pleut, nous sortirons.", "Even if it rains, we'll go out."],
      ["Quoique fatiguée, elle continue.", "Although tired, she carries on."]
    ],
    tip: "bien que takes the subjunctive; même si takes the indicative. They are not interchangeable in mood."
  },

  "b1.syntax.but": {
    usage: "Purpose: pour + infinitive when one subject does both; pour que / afin que + subjunctive when the subjects differ.",
    more: [
      ["Je travaille pour réussir.", "I work to succeed."],
      ["Je travaille pour que tu réussisses.", "I work so that you succeed."],
      ["Elle parle lentement afin qu'on la comprenne.", "She speaks slowly so that people understand her."]
    ],
    tip: "Same subject → infinitive; different subject → que + subjunctive. pour que never takes an infinitive."
  },

  "b1.syntax.participle_present": {
    usage: "The -ant form states a simultaneous or preceding circumstance. Invariable, and more formal than a full clause.",
    more: [
      ["Étant malade, il reste à la maison.", "Being ill, he stays at home."],
      ["Ayant fini, elle est partie.", "Having finished, she left."],
      ["Voyant le danger, il a reculé.", "Seeing the danger, he stepped back."]
    ],
    tip: "The present participle (-ant) has no en; the gerund (en + -ant) does. Both are invariable — never *étante*."
  },

  "b1.pronouns.relatifs_composes": {
    usage: "When a relative needs a preposition other than de, use lequel / laquelle / lesquels / lesquelles, which agrees with the antecedent.",
    more: [
      ["Le livre auquel je pense est cher.", "The book I'm thinking of is expensive."],
      ["La ville dans laquelle je vis est calme.", "The city I live in is quiet."],
      ["Les amis avec lesquels je voyage.", "The friends I travel with."]
    ],
    tip: "à + lequel = auquel; de + lequel = duquel. For people, à qui / de qui sounds more natural than auquel."
  },

  "b1.expressions.synonyms": {
    usage: "Replace vague faire / dire with precise verbs — the mark of B1+ writing and of good style.",
    more: [
      ["Il a déclaré que le projet était fini.", "He stated that the project was finished."],
      ["Elle a effectué des recherches.", "She carried out research."],
      ["Nous avons réalisé une enquête.", "We conducted a survey."]
    ],
    tip: "dire → déclarer, affirmer, expliquer, préciser; faire → effectuer, réaliser, accomplir. Pick by nuance, not by length."
  },

  "b1.negation.que_aucun": {
    usage: "Advanced negation: ne...que (only), aucun(e) (not any), ni...ni (neither...nor).",
    more: [
      ["Je n'ai que cinq euros.", "I only have five euros."],
      ["Aucun élève n'a répondu.", "No pupil answered."],
      ["Il n'a ni frère ni sœur.", "He has neither brother nor sister."]
    ],
    tip: "ne...que is not really negative — it means 'only'. aucun and ni replace un/des with de: je n'ai aucun ami."
  },

  "b1.adjectives.indefinis": {
    usage: "Determiners for an unspecified quantity or identity: n'importe quel (any), tel (such), divers (various), la plupart de (most), chaque (each).",
    more: [
      ["N'importe quel jour me convient.", "Any day suits me."],
      ["La plupart des gens sont d'accord.", "Most people agree."],
      ["Chaque étudiant a un livre.", "Each student has a book."]
    ],
    tip: "chaque is always singular; la plupart de takes a plural noun and a plural verb: la plupart des gens pensent."
  },

  "b1.adverbs.maniere": {
    usage: "Manner adverbs built on the feminine adjective + -ment: lent → lentement, sérieux → sérieusement.",
    more: [
      ["Il a finalement accepté.", "He finally accepted."],
      ["Conduis prudemment.", "Drive carefully."],
      ["Elle a répondu brièvement.", "She answered briefly."]
    ],
    tip: "-ent / -ant adjectives make -emment / -amment (prudent → prudemment), both pronounced 'a-ment'."
  },

  "b1.adjectives.ci_la": {
    usage: "Attach -ci ('this/these', nearer) or -là ('that/those', further) to a noun with a demonstrative, or to celui/celle to stand alone.",
    more: [
      ["Ce livre-ci est intéressant.", "This book is interesting."],
      ["Celle-là est plus chère.", "That one is more expensive."],
      ["Prenez ces chaises-là.", "Take those chairs."]
    ],
    tip: "In speech -là is far more common than -ci, even for 'this': ce livre-là often just means 'this book'."
  },

  "b1.verbs.prepositionnels": {
    usage: "Many French verbs need a fixed preposition before an infinitive or noun — memorise each verb + preposition pair.",
    more: [
      ["J'arrête de fumer.", "I'm stopping smoking."],
      ["Elle pense à ses vacances.", "She's thinking about her holiday."],
      ["Il a réussi à partir.", "He managed to leave."]
    ],
    tip: "arrêter de, décider de, oublier de vs penser à, réussir à, hésiter à, rêver de. Learn each verb with its preposition."
  },

  "b1.verbs.passe_simple": {
    usage: "A literary past tense for finished actions in writing — novels, history, fairy tales. Recognise it; you rarely need to produce it.",
    more: [
      ["Il parla longtemps.", "He spoke for a long time."],
      ["Elle finit son travail.", "She finished her work."],
      ["Ils vendirent la maison.", "They sold the house."]
    ],
    tip: "-er verbs: -ai, -as, -a, -âmes, -âtes, -èrent. Others: -is, -it, -îmes, -îtes, -irent. il fut (être) and il eut (avoir) are everywhere."
  },

  "b1.syntax.discours_indirect": {
    usage: "Report what someone said: que for statements, si for yes/no questions, the question word for WH-questions.",
    more: [
      ["Il dit qu'il viendra.", "He says he'll come."],
      ["Elle demande si tu es là.", "She asks if you're here."],
      ["Je ne sais pas où il est.", "I don't know where he is."]
    ],
    tip: "In reported questions, drop est-ce que and use normal word order: 'Où est-il ?' → il demande où il est."
  },

  "b1.syntax.si_present": {
    usage: "si + present for real or likely conditions; the result can be present, future or imperative.",
    more: [
      ["S'il fait beau, nous irons à la plage.", "If the weather is nice, we'll go to the beach."],
      ["Si tu es prêt, partons !", "If you're ready, let's go!"],
      ["Si tu veux, je t'aide.", "If you want, I'll help you."]
    ],
    tip: "si + present never pairs with a conditional. The conditional belongs with si + imparfait."
  },

  /* ---------- B2 ---------- */

  "b2.syntax.nominalisation": {
    usage: "Turn a verb clause into a noun phrase — the hallmark of formal and academic French.",
    more: [
      ["Le gouvernement a décidé → la décision du gouvernement.", "The government decided → the government's decision."],
      ["Les prix augmentent → une augmentation des prix.", "Prices are rising → a rise in prices."],
      ["Il a réussi → sa réussite.", "He succeeded → his success."]
    ],
    tip: "The old object becomes de + noun: décider quelque chose → la décision de quelque chose. Watch irregular nouns: choisir → le choix."
  },

  "b2.verbs.subjonctif_passe": {
    usage: "Past subjunctive: a subjunctive action that is already complete. avoir/être in the present subjunctive + past participle.",
    more: [
      ["Bien qu'il ait fini, il reste.", "Although he has finished, he stays."],
      ["Je doute qu'elle soit venue.", "I doubt she came."],
      ["Il est possible qu'ils soient partis.", "It's possible they have left."]
    ],
    tip: "Both halves are subjunctive: que j'aie fini, que tu sois parti. Don't slip an indicative in."
  },

  "b2.syntax.discours_indirect_passe": {
    usage: "When the reporting verb is past, shift the reported tense back one step.",
    more: [
      ["« Je viendrai » → Il a dit qu'il viendrait.", "I'll come → He said he would come."],
      ["« J'ai fini » → Il a dit qu'il avait fini.", "I finished → He said he had finished."],
      ["« Je suis malade » → Elle a dit qu'elle était malade.", "I'm ill → She said she was ill."]
    ],
    tip: "present → imparfait, passé composé → plus-que-parfait, future → conditional. Time words shift too: demain → le lendemain."
  },

  "b2.expressions.registre": {
    usage: "Match vocabulary and grammar to the situation: formal writing, standard speech, or casual talk.",
    more: [
      ["Je vais travailler. (standard)", "I'm going to work."],
      ["Je vais bosser. (informal)", "I'm going to work (colloquial)."],
      ["Je me rends à mon lieu de travail. (formal)", "I am going to my place of work."]
    ],
    tip: "Informal: on, tu, bouffer, bosser, un type. Formal: nous, full negation, veuillez. Never mix registers in one text."
  },

  "b2.verbs.infinitif_passe": {
    usage: "To have done: avoir/être in the infinitive + past participle, after après, pour, sans, de.",
    more: [
      ["Après avoir mangé, il est parti.", "After eating, he left."],
      ["Il regrette d'être parti.", "He regrets having left."],
      ["Merci d'avoir appelé.", "Thank you for calling."]
    ],
    tip: "Same subject rule as the present infinitive. With être the participle agrees: après être partie."
  },

  "b2.negation.expletif": {
    usage: "The expletive ne adds no meaning but appears after avant que, à moins que, craindre que in careful French. nul / nulle part are formal negatives.",
    more: [
      ["Avant que je ne parte, appelle-moi.", "Before I leave, call me."],
      ["Il n'y a nulle part où aller.", "There is nowhere to go."],
      ["Nul doute qu'il réussira.", "No doubt he'll succeed."]
    ],
    tip: "The expletive ne is optional in speech and never negative — don't add pas. nul = no/none, nulle part = nowhere."
  },

  "b2.syntax.sans_au_cas": {
    usage: "sans + noun/infinitive = without; au cas où + conditional = in case; sans que + subjunctive = without someone doing.",
    more: [
      ["Au cas où il pleuvrait, prends un parapluie.", "In case it rains, take an umbrella."],
      ["Il est parti sans dire au revoir.", "He left without saying goodbye."],
      ["Sans lui, nous n'y serions pas arrivés.", "Without him, we wouldn't have managed."]
    ],
    tip: "au cas où always takes the conditional, never the present: au cas où il pleuvrait. sans que needs the subjunctive."
  },

  "b2.expressions.presentatifs": {
    usage: "Point to or introduce something: voici (here is), voilà (there is), c'est / ce sont (it is / they are).",
    more: [
      ["Voici mon frère.", "This is my brother."],
      ["Voilà la solution.", "There's the solution."],
      ["Ce sont mes amis.", "These are my friends."]
    ],
    tip: "ce sont before a plural noun; c'est before a singular or a name. In casual speech c'est often wins even for plurals."
  },

  "b2.verbs.prepositionnels_avance": {
    usage: "Higher-level verbs with a fixed preposition: se charger de, se plaindre de, hésiter à, persuader de.",
    more: [
      ["Je me charge du projet.", "I'm taking care of the project."],
      ["Elle se plaint du bruit.", "She complains about the noise."],
      ["Il hésite à répondre.", "He hesitates to answer."]
    ],
    tip: "se plaindre de (not *se plaindre sur*), hésiter à + infinitive, persuader quelqu'un de + infinitive. The preposition is fixed."
  },

  "b2.syntax.connecteurs_avances": {
    usage: "Formal connectors that carry precise logical weight: considérant que, d'autant plus que, en revanche, partant.",
    more: [
      ["Considérant que le prix a augmenté, nous renonçons.", "Considering the price has risen, we're giving up."],
      ["Il est compétent, d'autant plus qu'il est jeune.", "He's competent, all the more so because he's young."],
      ["En revanche, le service est excellent.", "On the other hand, the service is excellent."]
    ],
    tip: "d'autant plus que adds a reinforcing reason; en revanche contrasts. partant is bookish — 'therefore'."
  },

  "b2.syntax.concordance": {
    usage: "When the main verb is past, backshift the subordinate: présent → imparfait, futur → conditionnel, passé composé → plus-que-parfait.",
    more: [
      ["Il a dit qu'il viendrait.", "He said he would come."],
      ["Elle pensait que j'étais malade.", "She thought I was ill."],
      ["Il croyait que nous avions fini.", "He believed we had finished."]
    ],
    tip: "This is the same backshift as reported speech. A present-tense main verb keeps the original tense."
  },

  "b2.pronouns.indefinis": {
    usage: "Pronouns for unspecified people or things: plusieurs (several), certains (some), l'un... l'autre, chacun (each).",
    more: [
      ["Plusieurs sont partis.", "Several have left."],
      ["L'un parle, l'autre écoute.", "One speaks, the other listens."],
      ["Chacun pour soi.", "Every man for himself."]
    ],
    tip: "chacun is singular and takes a singular verb. l'un... l'autre agrees: l'une... l'autre for feminine."
  },

  "b2.syntax.opposition": {
    usage: "Contrast ideas with sans que + subjunctive, contrairement à, à l'inverse de, inversement.",
    more: [
      ["Il est parti sans que personne ne le voie.", "He left without anyone seeing him."],
      ["Contrairement à toi, j'aime le froid.", "Unlike you, I like the cold."],
      ["À l'inverse de son frère, elle est calme.", "Unlike her brother, she's calm."]
    ],
    tip: "sans que takes the subjunctive and often an expletive ne. contrairement à + noun, never + que."
  },

  "b2.syntax.consequence": {
    usage: "Express a result: si bien que, au point que / à tel point que, de sorte que.",
    more: [
      ["Il a plu toute la nuit, si bien que les routes sont inondées.", "It rained all night, so much so that the roads are flooded."],
      ["Elle est malade au point qu'elle ne peut pas travailler.", "She's ill to the point that she can't work."],
      ["Le match a été annulé, de sorte que nous sommes rentrés.", "The match was cancelled, so we went home."]
    ],
    tip: "de sorte que can also express purpose (so that) with the subjunctive — context decides. au point que = to the point that."
  },

  "b2.verbs.passe_anterieur": {
    usage: "Literary 'had done': passé simple of avoir/être + past participle, used after quand/dès que for an action completed before another past action.",
    more: [
      ["Quand il eut fini, il partit.", "When he had finished, he left."],
      ["Dès qu'elle fut arrivée, elle téléphona.", "As soon as she had arrived, she phoned."],
      ["Après qu'il eut mangé, il sortit.", "After he had eaten, he went out."]
    ],
    tip: "Recognise it in literature; in speech you use the plus-que-parfait. il eut (avoir) vs il fut (être) — one letter apart."
  },

  "b2.syntax.nominalisation_2": {
    usage: "Noun forms of adjectives and verbs, common in formal and journalistic French.",
    more: [
      ["la jeunesse", "youth"],
      ["la réussite", "success"],
      ["la découverte", "discovery"]
    ],
    tip: "Common suffixes: -esse (jeune → jeunesse), -té (beau → beauté), -tion. Some are irregular — learn the pairs."
  },

  "b2.verbs.passif_avance": {
    usage: "Beyond être + participle: passive with de (state), se faire + infinitive (causative passive), and passive infinitives.",
    more: [
      ["Il s'est fait voler son portefeuille.", "He had his wallet stolen."],
      ["La porte est restée fermée.", "The door stayed closed."],
      ["Cette ville est connue de tous.", "This city is known to everyone."]
    ],
    tip: "se faire + infinitive is the everyday causative passive: se faire voler, se faire couper les cheveux. de marks a state, par an action."
  },

  "b2.pronouns.relatifs_composes_2": {
    usage: "Complex relative pronouns agree with the antecedent and contract with à/de: auquel, desquels, parmi lesquels.",
    more: [
      ["Le bureau auquel je pense est cher.", "The office I'm thinking of is expensive."],
      ["Les amis parmi lesquels il vit sont sympas.", "The friends he lives among are nice."],
      ["La raison pour laquelle je pars est simple.", "The reason I'm leaving is simple."]
    ],
    tip: "Agreement is with the antecedent, not the clause: la raison pour laquelle. à + lesquels = auxquels; de + lesquels = desquels."
  },

  "b2.verbs.subjonctif_avance": {
    usage: "Subjunctive after complex conjunctions: pourvu que (provided), à moins que (unless), de crainte/peur que (for fear that), quoique (although).",
    more: [
      ["Je viendrai pourvu que tu sois là.", "I'll come provided you're there."],
      ["À moins qu'il ne pleuve, nous sortirons.", "Unless it rains, we'll go out."],
      ["De peur qu'il ne parte, elle le retient.", "For fear he might leave, she holds him back."]
    ],
    tip: "à moins que and de crainte que often add an expletive ne. pourvu que takes the subjunctive even though it feels like a condition."
  },

  "b2.syntax.locutions_conjonctives": {
    usage: "Bookish conjunctions: dès lors que (since), pour autant que (as far as), en admettant / supposant que (assuming).",
    more: [
      ["Dès lors que tu es prêt, nous partons.", "Since you're ready, we're leaving."],
      ["Pour autant que je sache, il est parti.", "As far as I know, he has left."],
      ["En supposant qu'il vienne, que ferons-nous ?", "Supposing he comes, what will we do?"]
    ],
    tip: "en supposant / en admettant que take the subjunctive. pour autant que takes the subjunctive in the 'as far as' sense."
  },

  "b2.expressions.idiomatiques": {
    usage: "Fixed verb + noun phrases you must learn whole: avoir le droit de, mettre au point, tenir compte de, tenir à, se rendre compte de.",
    more: [
      ["Tu as le droit de partir.", "You have the right to leave."],
      ["Il tient compte de mon avis.", "He takes my opinion into account."],
      ["Je me rends compte de mon erreur.", "I realise my mistake."]
    ],
    tip: "tenir à = to care about (je tiens à toi); tenir compte de = to take into account. Don't confuse the two."
  },

  "b2.adverbs.attitude": {
    usage: "Sentence adverbs that comment on the whole statement: étonnamment, heureusement, malheureusement, franchement.",
    more: [
      ["Étonnamment, il a réussi.", "Surprisingly, he succeeded."],
      ["Heureusement, personne n'a été blessé.", "Fortunately, nobody was hurt."],
      ["Franchement, je n'y crois pas.", "Frankly, I don't believe it."]
    ],
    tip: "These stand at the front, set off by a comma, and modify the sentence, not a verb. heureusement ≠ 'happily'."
  },

  "b2.syntax.insertion": {
    usage: "Insert a comment with je pense, dit-il, semble-t-il, paraît-il, set off by commas.",
    more: [
      ["Il viendra, je pense, demain.", "He'll come tomorrow, I think."],
      ["« Je suis prêt », dit-il.", "“I'm ready,” he said."],
      ["Il a, paraît-il, démissionné.", "He has reportedly resigned."]
    ],
    tip: "dit-il inverts and takes no -t-. semble-t-il and paraît-il are fixed impersonal tags meaning 'apparently'."
  },

  "b2.expressions.registre_shift": {
    usage: "Deliberately switch register for effect — or avoid mixing them. Formal: nous, passive, nominalisation, subjunctive. Informal: on, tu, ellipsis, fillers.",
    more: [
      ["Formel : Nous vous prions de bien vouloir patienter.", "Formal: We beg you to kindly wait."],
      ["Familier : Tu peux me filer un coup de main ?", "Casual: Can you give me a hand?"],
      ["Neutre : Pouvez-vous m'aider ?", "Neutral: Can you help me?"]
    ],
    tip: "Formal and informal grammar are not interchangeable: 'Nous vous prions' cannot sit next to 'filer un coup de main'. Keep one register per text."
  },

  /* ---------- added later: high-frequency gaps ---------- */

  "a1.verbs.ir_regular": {
    usage: "The second big regular group. Learn the -iss- plural once and you can conjugate hundreds of verbs: finir, choisir, réussir, grandir, obéir.",
    more: [
      ["Nous finissons à midi.", "We finish at noon."],
      ["Elle choisit la robe rouge.", "She chooses the red dress."],
      ["Vous réussissez toujours.", "You always succeed."]
    ],
    tip: "Singular forms look like -er verbs (je finis); the plural grows -iss- (nous finissons). That -iss- is the giveaway."
  },

  "a1.verbs.re_regular": {
    usage: "The third regular group: vendre, attendre, répondre, descendre, perdre. Drop -re and add the endings.",
    more: [
      ["Nous attendons le bus.", "We wait for the bus."],
      ["Elle répond vite.", "She answers quickly."],
      ["Ils perdent du temps.", "They waste time."]
    ],
    tip: "Third person singular is bare: il vend, il attend, il répond. No -s, no -t."
  },

  "a1.verbs.irregular_oir": {
    usage: "voir, croire and boire are everywhere, and their plural stems change shape.",
    more: [
      ["Nous voyons la mer.", "We see the sea."],
      ["Je crois qu'il vient.", "I think he's coming."],
      ["Ils boivent du thé.", "They drink tea."]
    ],
    tip: "voir → voy-, croire → croy-, boire → buv-/boiv-. The -oi- singular against the -oy-/-uv- plural is the pattern."
  },

  "a1.nouns.numbers_big": {
    usage: "Prices, times, dates and addresses all need 20–100. The 70s and 90s are arithmetic: 60+10, 80+10.",
    more: [
      ["Ça fait quarante-cinq euros.", "That's forty-five euros."],
      ["Il a soixante-dix ans.", "He is seventy."],
      ["Quatre-vingt-dix minutes.", "Ninety minutes."]
    ],
    tip: "71 and 81 keep 'et' (soixante et onze, quatre-vingt-un). 80 takes -s only when nothing follows: quatre-vingts, but quatre-vingt-un."
  },

  "a1.expressions.date": {
    usage: "Say the date with le + number + month. Only the first is ordinal; everything else is a plain number.",
    more: [
      ["Nous sommes le 5 avril.", "It's the 5th of April."],
      ["Le 1er mai est férié.", "The 1st of May is a holiday."],
      ["Mon anniversaire est le 12 octobre.", "My birthday is the 12th of October."]
    ],
    tip: "1er = premier. For 'the first of' use le premier, never *le un*. Months are lowercase."
  },

  "a2.syntax.comparison_quantity": {
    usage: "Compare amounts, not qualities: plus de, autant de, moins de + noun + que.",
    more: [
      ["Il a plus d'énergie que moi.", "He has more energy than me."],
      ["Nous avons autant de travail que vous.", "We have as much work as you."],
      ["Elle boit moins de café que lui.", "She drinks less coffee than him."]
    ],
    tip: "The de belongs to the quantity, not the noun: plus de livres, autant d'argent. Drop it and the sentence breaks."
  },

  "a2.verbs.imperatif_pronoms": {
    usage: "Telling someone to do something with an object: the pronoun moves after the verb in the affirmative, before it in the negative.",
    more: [
      ["Donne-le-moi.", "Give it to me."],
      ["Parlez-lui demain.", "Speak to him tomorrow."],
      ["Ne le lui dis pas.", "Don't tell him."]
    ],
    tip: "Affirmative: verb-pronoun with hyphens (donne-le-moi). Negative: ne + pronoun + verb + pas (ne le lui dis pas)."
  },

  "a2.verbs.venir_tenir": {
    usage: "venir and tenir are models for a whole family: devenir, revenir, prévenir, obtenir, appartenir, maintenir.",
    more: [
      ["Elle devient célèbre.", "She is becoming famous."],
      ["Nous tenons à vous remercier.", "We want to thank you."],
      ["Ils obtiennent une réponse.", "They get an answer."]
    ],
    tip: "Singular -ien- (je viens, il tient), plural -en- (nous venons, vous tenez), but ils viennent / tiennent keep -ien-."
  }
};
