/* Notes for Chinese speakers.

   Not a translation of the English explanation. A Chinese learner reading
   "le is used for masculine nouns" in English already understands it — what
   the English track cannot tell them is *why they will keep getting it wrong*:
   Chinese has no articles, no grammatical gender, no verb agreement, no
   subjunctive. Those gaps are where the mistakes actually come from.

   So each entry is one or two sentences about the difference between the two
   languages, shown next to the rule and labelled as such. Explanations,
   examples and exercises stay English/French.

   Only points where the two languages genuinely diverge get an entry. A
   missing id simply shows nothing. */

const CONTRAST = {

  /* ---- A0 ---- */
  "a0.articles.definite": "中文没有冠词，所以冠词是最容易被整个漏掉的成分。说「我喜欢音乐」时，法语必须补上 la。",
  "a0.articles.indefinite": "中文的「一个」只在强调数量时才出现，法语的 un / une 几乎是名词的默认配件。",
  "a0.nouns.gender": "中文名词没有语法性别。法语的阴阳性没有语义道理，只能靠词尾规律加逐个记忆。",
  "a0.adjectives.position": "中文形容词一律前置（「红车」「好书」），法语大部分形容词后置，只有一小批短的可以前置。",
  "a0.etre.present": "中文把「是」和「在」分开（「他是学生」「他在巴黎」），法语 être 一个词全包。",
  "a0.avoir.present": "中文说「我二十岁」「我饿」「我冷」，法语这三句都用 avoir，不用 être。",
  "a0.syntax.cest_vs_il_est": "中文「他是医生」只有一种说法，法语要分 c'est（带冠词的名词）和 il est（职业、形容词）。",
  "a0.expressions.il_y_a": "中文一个「有」同时管「我有一个哥哥」和「桌上有一本书」，法语前者用 avoir，后者只能用 il y a。",

  /* ---- A1 ---- */
  "a1.negation.ne_pas": "中文一个「不」字就够了，法语是 ne … pas 两截把动词夹住。口语里常丢掉 ne，但书面语不能丢。",
  "a1.possessives": "中文的「我的」不随名词变化，法语的 mon / ma / mes 要跟名词的性和数一起变。",
  "a1.adjectives.agreement": "中文形容词永远不变形，法语形容词必须跟名词的性和数一致——这是中文母语者最高频的漏改点。",
  "a1.verbs.reflexive": "中文「起床」是一个词，法语 se lever 是「代词 + 动词」两部分，代词还要随人称变。",
  "a1.pronouns.stress": "中文的「我」在任何位置都是「我」，法语有 je / me / moi 三套，用错位置就错了。",
  "a1.questions.est_ce_que": "中文靠句末「吗」或语序提问，法语有三种方式（语调、est-ce que、倒装），正式程度不同。",
  "a1.expressions.quantity": "中文「很多书」直接连，法语 beaucoup de 后面不能带冠词，说 beaucoup des livres 是错的。",
  "a1.articles.partitive": "中文「我喝咖啡」不需要任何冠词，法语必须说 du café——这是中文母语者最容易整句漏掉的结构。",
  "a1.prepositions.time": "中文「在周一」「在七月」「在八点」都用「在」，法语 à / le / en 分工很严格。",
  "a1.verbs.imperative": "中文命令句不改变动词形式，法语有专门的命令式，而且 -er 动词的 tu 形式要去掉 -s。",
  "a1.adjectives.comparative": "中文「更好」是规则的，法语 bon 的比较级是不规则的 meilleur，不能说 plus bon。",

  /* ---- A2 ---- */
  "a2.passe_compose.avoir": "中文用「了」表示完成，不区分动词类别；法语要先判断用 avoir 还是 être 作助动词。",
  "a2.passe_compose.etre": "「移动类动词用 être」是法语特有的分组，中文完全没有对应概念，只能整组记住。",
  "a2.imparfait_vs_pc": "中文靠「了 / 过 / 着」和时间词区分，法语靠动词形式本身。选错时态不是不地道，是意思变了。",
  "a2.pronouns.cod": "中文宾语代词就是「他 / 它」，法语 le / la / les 要跟被替代名词的性和数一致。",
  "a2.pronouns.y_en": "中文没有 y 和 en 的对应物：「我去那里」的「那里」不能省，法语一个 y 就够。",
  "a2.pronouns.coi": "中文「给他」和「给他写信」里的「他」是同一个字，法语 lui 不分性别但要分单复数（lui / leur）。",
  "a2.verbs.accord_participe": "中文没有分词一致这回事。宾语提前时过去分词要变，这是法语写作里最常被漏掉的细节。",
  "a2.syntax.time_markers": "中文「我学法语两年了」用一个「了」，法语要用 depuis 且动词保持现在时。",
  "a2.expressions.avoir": "中文「我饿 / 我冷 / 我怕」都是形容词，法语全部用 avoir：avoir faim / froid / peur。",
  "a2.verbs.pronominaux_passe": "代动词的过去分词要跟主语一致，中文没有任何对应机制，只能刻意检查。",
  "a2.syntax.relative_ou": "中文「我住的城市」直接把两句并起来，法语中间必须有关系代词 où。",
  "a2.pronouns.possessive": "中文「我的」后面可以省略名词，法语的 le mien 不能省，而且必须带定冠词。",

  /* ---- B1 ---- */
  "b1.subjunctive.present": "中文没有「虚拟式」这个语法范畴，只能靠记触发词（il faut que、bien que、je veux que…）。",
  "b1.pronoun_order": "中文宾语代词顺序基本固定，法语 me / te / le / lui / y / en 有严格的先后规则。",
  "b1.verbs.passive": "中文被动常带「被」，但法语被动更偏书面，口语里更常说 on + 主动。",
  "b1.syntax.si_clauses": "中文「如果…就…」不要求时态配合，法语 si 从句里绝对不能出现将来时。",
  "b1.verbs.plus_que_parfait": "中文用「已经…了」表达更早的过去，法语有专门的时态，且要选对助动词。",
  "b1.syntax.relative_dont": "中文没有 dont 这种「de + 关系代词」合并的形式，遇到动词带 de 就要想到它。",
  "b1.verbs.gerondif": "中文用「一边…一边…」或直接连动词，法语用 en + -ant，而且主语必须和主句一致。",
  "b1.syntax.concession": "中文「虽然…但是…」可以同时出现，法语 bien que 从句后面不能再加 mais。",
  "b1.expressions.formal": "中文书信的客气靠套话，法语的正式感还靠动词形式：veuillez + 不定式、je vous prie de…",

  /* ---- B2 ---- */
  "b2.negation.expletif": "中文没有「赘余 ne」这种东西。它不表示否定，只是书面语的习惯，漏掉不算错但不地道。",
  "b2.syntax.nominalisation": "中文书面语也名词化，但法语更依赖这一点，而且后缀选择（-ment / -tion / -ance）没有统一规律。",
  "b2.expressions.registre": "中文的正式与口语差别主要在词汇，法语还体现在时态和人称上：nous 正式，on 口语。"
};
