/* Original teaching notes and transfer exercises. These checks are scaffolded
   practice, never independent evidence for grammar mastery. */
const COACHING = {
  "a0.articles.definite": {
    rule: "谈论已知的人或物，或泛指某类事物时，用定冠词。先看名词的性数：阳性单数 le，阴性单数 la，复数 les；元音或哑音 h 前，单数变为 l’。",
    trap: "不要把中文里省略冠词的习惯带进法语；复数 les 不再区分阴阳性。",
    examples: [["le jardin → les jardins", "花园：单数变复数，le 变为 les。"], ["la porte → l’école", "阴性单数在元音前也要省音。"]],
    prompt: "J’aime ___ jardins de cette ville.", answer: "les", options: ["le", "la", "les"],
    why: "jardins 是复数，所以用 les；这里指这座城市的花园。"
  },
  "a0.articles.indefinite": {
    rule: "第一次提到一个可数的人或物，常用 un（阳性）、une（阴性）；不特指的复数用 des。性别由名词决定，不能按中文意思猜。",
    trap: "une 不是“一个女性用的东西”，而是阴性单数名词前的冠词。",
    examples: [["un vélo / une voiture", "一辆自行车 / 一辆汽车，冠词跟名词性别走。"], ["une clé → des clés", "一把钥匙 → 一些钥匙，复数用 des。"]],
    prompt: "Dans mon sac, il y a ___ clés.", answer: "des", options: ["un", "une", "des"],
    why: "clés 是复数，表示一些钥匙，用 des。"
  },
  "a0.etre.present": {
    rule: "être 表示“是”或描述状态。现在时要随主语变化：je suis，tu es，il/elle/on est，nous sommes，vous êtes，ils/elles sont。",
    trap: "中文的“是”不变化；法语不能把所有主语都接 est。",
    examples: [["Elle est prête. / Elles sont prêtes.", "她准备好了 / 她们准备好了：主语变复数，动词也变。"], ["Tu es ici. / Vous êtes ici.", "你在这里 / 您或你们在这里。"]],
    prompt: "Nous ___ à la bibliothèque.", answer: "sommes", options: ["sont", "sommes", "êtes"],
    why: "nous 对应 sommes；sont 对应 ils/elles，êtes 对应 vous。"
  },
  "a0.avoir.present": {
    rule: "avoir 表示“有”，也用于年龄等固定表达：j’ai，tu as，il/elle/on a，nous avons，vous avez，ils/elles ont。je 在 ai 前省音为 j’。",
    trap: "说年龄用 avoir：J’ai vingt ans。不要照中文或英文写成 Je suis vingt ans。",
    examples: [["Elle a un vélo. / Elles ont un vélo.", "她有一辆自行车 / 她们有一辆自行车。"], ["J’ai vingt ans. / J’ai faim.", "我二十岁 / 我饿了：都使用 avoir。"]],
    prompt: "Vous ___ un dictionnaire ?", answer: "avez", options: ["ont", "avons", "avez"],
    why: "vous 对应 avez；avons 属于 nous，ont 属于 ils/elles。"
  },
  "a0.er.present": {
    rule: "规则 -er 动词现在时：去掉 -er，再按 je/tu/il/nous/vous/ils 添加 -e/-es/-e/-ons/-ez/-ent。aller 不属于这条规则。",
    trap: "许多词尾听起来一样，但书写仍需配合主语；不要只凭发音选词尾。",
    examples: [["Tu parles. / Vous parlez.", "同一个 parler，tu 与 vous 的词尾不同。"], ["Elle travaille. / Elles travaillent.", "词尾 -e 与 -ent 通常听起来相同，拼写不同。"]],
    prompt: "Nous ___ le français. (étudier)", answer: "étudions", options: ["étudiez", "étudient", "étudions"],
    why: "étudier 去掉 -er 后，nous 加 -ons，得到 étudions。"
  },
  "a1.negation.ne_pas": {
    rule: "基本否定用 ne + 变位动词 + pas。动词以元音或哑音 h 开头时，ne 变成 n’。口语可能省 ne，正式书写应保留。",
    trap: "pas 不是随便放在句末：先找到变位动词，再把 ne…pas 放在它两侧。",
    examples: [["Il parle. → Il ne parle pas.", "把 ne 和 pas 放在 parle 两边。"], ["Elle aime le café. → Elle n’aime pas le café.", "aime 前需要省音 n’。"]],
    prompt: "Elle ___ habite pas ici.", answer: "n’", options: ["ne", "n’", "pas"],
    why: "habiter 的 h 不发音，因此 ne 在 habite 前变成 n’。"
  },
  "a1.articles.partitive": {
    rule: "表达不确定数量的食物或物质，常用 du、de la、de l’。du 用于阳性单数，de la 用于阴性单数，元音或哑音 h 前用 de l’。",
    trap: "泛指喜欢某种食物时用定冠词；表示吃喝了一些时常用部分冠词。一般否定数量时改用 de/d’，être 后等情况另论。",
    examples: [["J’aime le lait. / Je bois du lait.", "我喜欢牛奶（泛指）/ 我喝一些牛奶（数量）。"], ["Elle boit de l’eau. / Elle ne boit pas d’eau.", "不定数量的水 / 否定时变为 d’eau。"]],
    prompt: "Je bois ___ eau.", answer: "de l’", options: ["du", "de la", "de l’"],
    why: "eau 是以元音开头的阴性单数名词，表示一些水，用 de l’eau。"
  },
  "a1.possessives": {
    rule: "mon/ma/mes 等主有形容词与被拥有的名词配合，不随拥有者的性别变化。mon 对阳性单数，ma 对阴性单数，mes 对复数。",
    trap: "元音或哑音 h 开头的阴性单数名词前，也用 mon/ton/son：mon amie。",
    examples: [["son frère / sa sœur", "他的或她的兄弟 / 他的或她的姐妹：看 frère/sœur。"], ["ma voisine / mon amie", "两个名词都指女性，但 amie 前使用 mon。"]],
    prompt: "C’est ___ amie Léa.", answer: "mon", options: ["mon", "ma", "mes"],
    why: "amie 虽是阴性单数，但以元音开头，所以用 mon amie。"
  },
  "a1.adjectives.agreement": {
    rule: "形容词通常随被描述的名词配合性数：grand/grande/grands/grandes。常见变化为阴性加 -e、复数加 -s，但也有不规则形式。",
    trap: "先找形容词描述谁；不能根据说话者的性别或离它最近的词判断。",
    examples: [["un petit jardin / une petite maison", "阳性 petit，阴性 petite。"], ["une petite maison / des petites maisons", "阴性单数 petite，阴性复数 petites。"]],
    prompt: "Ces maisons sont ___. (petit)", answer: "petites", options: ["petits", "petite", "petites"],
    why: "maisons 是阴性复数，形容词用 petites。"
  },
  "a2.pronouns.cod": {
    rule: "直接宾语代词替代不经介词连接的宾语。le 代阳性单数，la 代阴性单数，les 代复数；在简单句中放在变位动词前。",
    trap: "先确认动词是否直接接宾语。parler à quelqu’un 的 à 不能忽略，它不使用这里的 le/la/les。",
    examples: [["Je vois Paul. → Je le vois.", "Paul 是直接宾语，用 le，放在 vois 前。"], ["Je lis les lettres. → Je les lis.", "复数 les lettres 用 les 替代。"]],
    prompt: "Tu regardes les photos ? Oui, je ___ regarde.", answer: "les", options: ["le", "les", "lui"],
    why: "regarder 直接接宾语；les photos 是复数，因此用 les。lui 用于某些间接宾语。"
  }
};
