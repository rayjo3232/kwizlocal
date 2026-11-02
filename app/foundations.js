/* Original foundation lessons and six-question checks. New examples teach the
   procedure; check prompts use different sentences. Tuple: type, prompt,
   options, answer, Chinese explanation, optional option-specific feedback. */
const FOUNDATIONS = {
  "a0.articles.definite": {
    goal: "能根据名词的性数和开头发音，选择 le、la、l’ 或 les。",
    steps: [
      ["先判断是否在说已知事物", "双方知道是哪一个，或泛指喜欢的一类事物时，通常用定冠词。不要因为中文不说“这个”，就在法语里省去冠词。"],
      ["再判断单复数与性别", "复数直接选 les；单数看名词本身：阳性 le，阴性 la。名词的性别要与词一起记，不能根据物品的外观判断。"],
      ["最后检查是否需要省音", "元音或哑音 h 前，单数 le/la 变成 l’；复数 les 不省音。送气 h 不适用省音，遇到新词应查词典。"]
    ],
    worked: [["J’aime le cinéma.", "我喜欢电影。", "这里泛指电影这种活动；cinéma 是阳性单数，用 le。"], ["Ferme l’armoire.", "关上衣柜。", "armoire 是阴性，但开头是元音，因此 la 变成 l’。"]],
    checks: [
      ["choice", "Ouvre ___ fenêtre de la cuisine.", ["le", "la", "les"], "la", "fenêtre 是阴性单数，指定厨房的那扇窗，所以用 la。", {le:"le 对应阳性单数；fenêtre 是阴性。",les:"les 要接复数，而 fenêtre 是单数。"}],
      ["choice", "___ arbres du parc sont grands.", ["L’", "Le", "Les"], "Les", "arbres 是复数；即使以元音开头，也用 Les，不省音。", {"L’":"l’ 只用于单数省音，不能替代复数 les。",Le:"le 是阳性单数，arbres 是复数。"}],
      ["fill", "填定冠词：J’écoute ___ radio tous les matins.", null, "la", "radio 在这里是阴性单数名词，固定表达 écouter la radio。"],
      ["fill", "填定冠词：___ ordinateur de Paul est neuf.", null, "L’", "ordinateur 以元音开头，单数定冠词省音为 l’。"],
      ["correct", "只改冠词，写出完整正确句子：Le chaise est près du bureau.", null, "La chaise est près du bureau.", "chaise 是阴性单数，把 Le 改成 La，其余保留。"],
      ["correct", "只改冠词，写出完整正确句子：La histoire est intéressante.", null, "L’histoire est intéressante.", "histoire 的 h 是哑音，la 必须省音为 l’。"]
    ]
  },
  "a0.articles.indefinite": {
    goal: "能表达一个或一些不特指的人和物，并区分 un、une、des。",
    steps: [
      ["用来引入一个新事物", "第一次提到一个可数的人或物、不强调具体是哪一个时，用不定冠词。un/une 相当于一个，des 可以表达一些。"],
      ["先看数量，再看性别", "复数用 des；单数阳性用 un，单数阴性用 une。une 在元音前不省音，所以是 une adresse。"],
      ["留意否定中的变化", "一般否定存在或数量时，un/une/des 常变成 de/d’：Je n’ai pas de vélo。être 后保留不定冠词，如 Ce n’est pas un vélo。"]
    ],
    worked: [["Il y a une pharmacie ici.", "这里有一家药店。", "引入一家药店；pharmacie 是阴性单数，选 une。"], ["Nous avons des billets.", "我们有一些票。", "billets 是复数，用 des；不是单数 un。"]],
    checks: [
      ["choice", "Elle porte ___ robe bleue.", ["un", "une", "des"], "une", "robe 是阴性单数，所以选 une。", {un:"un 用于阳性单数，robe 是阴性。",des:"robe 没有复数词尾，这里只说一条裙子。"}],
      ["choice", "Il y a ___ touristes devant le musée.", ["un", "une", "des"], "des", "touristes 是复数，用 des，不再按性别区分。", {un:"un 只能修饰单数。",une:"une 只能修饰阴性单数。"}],
      ["fill", "填不定冠词：Paul cherche ___ appartement à Paris.", null, "un", "appartement 是阳性单数；un 不因后接元音而改变拼写。"],
      ["fill", "填不定冠词：C’est ___ adresse utile.", null, "une", "adresse 是阴性单数；une 在元音前保持完整。"],
      ["correct", "只改冠词，写出完整正确句子：Il achète un pommes.", null, "Il achète des pommes.", "pommes 是复数，把 un 改成 des。"],
      ["correct", "只改冠词，写出完整正确句子：C’est un valise.", null, "C’est une valise.", "valise 是阴性单数，应该是 une valise。"]
    ]
  },
  "a0.pronouns.subject": {
    goal: "能用合适的人称代词替代主语，并与动词对应。",
    steps: [
      ["先确定是谁在做动作", "je 是我，tu 是你，il/elle 是他/她，nous 是我们，vous 是您或你们，ils/elles 是他们/她们。完整陈述句通常不能省掉主语。"],
      ["替换姓名时保持人数与性别", "一个女性用 elle，一个男性用 il；全女性复数用 elles，男性或男女混合复数用 ils。复数不能用单数 il/elle。"],
      ["主语和动词一起检查", "nous 后接 sommes，vous 后接 êtes；不能只替换代词而保留不匹配的动词。je 在元音前省音为 j’，如 j’habite。on 按第三人称单数变位。"]
    ],
    worked: [["Nora est ici. → Elle est ici.", "诺拉在这里。→ 她在这里。", "Nora 指一名女性，因此替换为 elle。"], ["Lina et moi, nous sommes prêts.", "莉娜和我，我们准备好了。", "主语包含说话者自己，使用 nous；动词随之用 sommes。"]],
    checks: [
      ["choice", "Julie et Emma arrivent. ___ arrivent ensemble.", ["Elle", "Elles", "Ils"], "Elles", "两名女性组成复数主语，用 Elles。", {Elle:"Elle 只指一名女性。",Ils:"这里是全女性主语，应选 Elles。"}],
      ["choice", "___ êtes les bienvenus.", ["Nous", "Vous", "Ils"], "Vous", "êtes 是 être 对应 vous 的形式。", {Nous:"nous 对应 sommes，不对应 êtes。",Ils:"ils 对应 sont，不对应 êtes。"}],
      ["fill", "Hugo est fatigué. ___ est fatigué.", null, "Il", "Hugo 指一名男性，用 Il 替代。"],
      ["fill", "Toi et moi, ___ sommes amis.", null, "nous", "你和我包含说话者，因此用 nous。"],
      ["correct", "只改主语代词，写出完整正确句子：Je habite à Lille.", null, "J’habite à Lille.", "habiter 的 h 是哑音；je 在 habite 前省音为 j’。"],
      ["correct", "两位女性是主语；只改代词并写出完整句子：Ils sont contentes.", null, "Elles sont contentes.", "两位女性用 Elles；形容词 contentes 已经是阴性复数。"]
    ]
  },
  "a0.etre.present": {
    goal: "能根据主语写出 être 现在时，并用它说明身份、状态或位置。",
    steps: [
      ["确认要表达“是、处于某状态或位置”", "être 可用于身份、描述和位置：être professeur、être calme、être à la gare。法语通常需要显式写出动词，不能照中文省略“是”。"],
      ["把主语和六组变位一起记", "je suis；tu es；il/elle/on est；nous sommes；vous êtes；ils/elles sont。主语是多人时，先判断它对应 nous、vous 还是 ils/elles。"],
      ["区别读音相近的形式", "tu es 与 il est 的发音相同，但书写不同；ils sont 不能写成 ils ont。on 即使表示“我们”，动词也仍用 est。"]
    ],
    worked: [["On est à la gare.", "我们在火车站。", "on 的意义可能是我们，但语法上用第三人称单数 est。"], ["Mes parents sont occupés.", "我的父母很忙。", "mes parents 对应 ils，所以 être 选 sont。"]],
    checks: [
      ["choice", "Tu ___ en avance aujourd’hui.", ["est", "es", "suis"], "es", "tu 对应 es，不能按读音把它写成 est。", {est:"est 对应 il/elle/on；tu 应接 es。",suis:"suis 只对应 je。"}],
      ["choice", "Les fenêtres ___ ouvertes.", ["est", "sommes", "sont"], "sont", "les fenêtres 对应 elles，动词用 sont。", {est:"复数主语不能接单数 est。",sommes:"sommes 只对应 nous。"}],
      ["fill", "Je ___ dans le jardin. (être, présent)", null, "suis", "être 在 je 后的现在时是 suis。"],
      ["fill", "Vous ___ très patients. (être, présent)", null, "êtes", "vous 对应 êtes；注意标准拼写带 ê。"],
      ["correct", "只改动词，写出完整正确句子：Nous sont en classe.", null, "Nous sommes en classe.", "nous 必须接 sommes；sont 是第三人称复数。"],
      ["correct", "只改动词，写出完整正确句子：Elle es au marché.", null, "Elle est au marché.", "elle 对应 est，es 对应 tu。"]
    ]
  },
  "a0.avoir.present": {
    goal: "能写出 avoir 现在时，并正确表达拥有、年龄和饥渴。",
    steps: [
      ["先确认法语是否用 avoir", "avoir 不只表示拥有。说年龄、饿或渴时，也用 avoir：avoir dix ans、avoir faim、avoir soif，不能直接照搬英文 be。"],
      ["按主语选择变位", "j’ai；tu as；il/elle/on a；nous avons；vous avez；ils/elles ont。ai 前的 je 必须省音成 j’。"],
      ["辨清 a、as、ont 和 sont", "tu as 与 il a 发音接近但拼写不同。ils ont 表示他们有；ils sont 表示他们是或处于某状态，两者不是同一个动词。"]
    ],
    worked: [["Tu as soif.", "你渴了。", "法语用 avoir soif；tu 对应 as。"], ["Les enfants ont huit ans.", "孩子们八岁了。", "年龄用 avoir；les enfants 对应 ils，所以用 ont。"]],
    checks: [
      ["choice", "Mon frère ___ un chien.", ["as", "a", "ont"], "a", "mon frère 对应 il，avoir 用 a。", {as:"as 对应 tu，不对应 mon frère。",ont:"ont 对应复数 ils/elles。"}],
      ["choice", "Nous ___ besoin d’un stylo.", ["avons", "avez", "ont"], "avons", "avoir besoin de 表示需要；nous 对应 avons。", {avez:"avez 对应 vous。",ont:"ont 对应 ils/elles。"}],
      ["fill", "J’___ trente ans. (avoir, présent)", null, "ai", "年龄用 avoir，j’ 后填 ai。"],
      ["fill", "Elles ___ des questions. (avoir, présent)", null, "ont", "elles 对应 ont，表示她们有一些问题。"],
      ["correct", "只改动词，写出完整正确句子：Tu a faim.", null, "Tu as faim.", "avoir faim 的动词仍需配合主语，tu 后用 as。"],
      ["correct", "只改动词，写出完整正确句子：Vous avons une réservation.", null, "Vous avez une réservation.", "vous 对应 avez；avons 属于 nous。"]
    ]
  },
  "a0.er.present": {
    goal: "能给规则 -er 动词按主语变位，而不只识别熟悉的例句。",
    steps: [
      ["先确认是规则 -er 动词", "parler、chercher、regarder 适用这套现在时规则。aller 虽然以 -er 结尾，却是不规则动词，不能照套。"],
      ["去掉 -er，保留词干", "例如 regarder 去掉 -er 得 regard-，chercher 得 cherch-。先找到词干，再按主语加词尾。"],
      ["依次加上六组词尾", "je -e、tu -es、il/elle/on -e、nous -ons、vous -ez、ils/elles -ent。多个词尾发音相同，所以书写时必须看主语；-ger、-cer 等拼写变化另学。"]
    ],
    worked: [["Vous regardez la carte.", "您或你们在看地图。", "regard- 加上 vous 的 -ez，得到 regardez。"], ["Elles cherchent la sortie.", "她们在找出口。", "cherch- 加上 elles 的 -ent，得到 cherchent；不要凭发音省掉词尾。"]],
    checks: [
      ["choice", "Nous ___ près de la rivière. (habiter)", ["habitons", "habitez", "habitent"], "habitons", "habit- 加 nous 的 -ons，得到 habitons。", {habitez:"-ez 对应 vous。",habitent:"-ent 对应 ils/elles。"}],
      ["choice", "Tu ___ la porte. (fermer)", ["ferme", "fermes", "fermez"], "fermes", "tu 对应 -es，因此是 fermes。", {ferme:"-e 对应 je 或 il/elle/on，tu 需要 -es。",fermez:"-ez 对应 vous。"}],
      ["fill", "Elle ___ la musique. (écouter, présent)", null, "écoute", "écout- 加 elle 的 -e，得到 écoute。"],
      ["fill", "Vous ___ souvent ici. (rester, présent)", null, "restez", "rest- 加 vous 的 -ez，得到 restez。"],
      ["correct", "只改动词，写出完整正确句子：Ils prépare le dîner.", null, "Ils préparent le dîner.", "ils 是复数主语，prépar- 加 -ent。"],
      ["correct", "只改动词，写出完整正确句子：Nous jouez au tennis.", null, "Nous jouons au tennis.", "nous 对应 -ons，因此 jouer 变成 jouons。"]
    ]
  },
  "a1.negation.ne_pas": {
    goal: "能独立把简单现在时陈述句改成 ne…pas 否定句。",
    steps: [
      ["先找到已经变位的动词", "在简单现在时句子里，找出 parle、aime、est 等随主语变化的动词。ne 与 pas 围住的是这个动词，不是随意放在句首和句尾。"],
      ["放入 ne + 动词 + pas", "保留主语，动词前放 ne，动词后放 pas。原来的地点或其他补语继续放在后面：Il ne travaille pas ici。"],
      ["检查省音与书写语体", "元音或哑音 h 前用 n’，如 n’écoute、n’habite。口语常省掉 ne，但本课练习要求保留完整的书面否定。"]
    ],
    worked: [["Elle danse ici. → Elle ne danse pas ici.", "她在这里跳舞。→ 她不在这里跳舞。", "变位动词是 danse；ne 放前面，pas 放后面，ici 保持在最后。"], ["J’aime le thé. → Je n’aime pas le thé.", "我喜欢茶。→ 我不喜欢茶。", "aime 前用 n’；je 后面现在接 n，所以主语恢复为 Je。"]],
    checks: [
      ["choice", "Il ___ parle pas espagnol.", ["ne", "n’", "pas"], "ne", "parle 以辅音开头，前面用完整的 ne。", {"n’":"parle 不以元音或哑音 h 开头，不需要省音。",pas:"动词前需要 ne，pas 在动词后。"}],
      ["choice", "Elle ___ écoute pas la radio.", ["ne", "n’", "pas"], "n’", "écoute 以元音开头，ne 必须省音为 n’。", {ne:"元音前不能保留 ne 的 e。",pas:"这里空缺的是动词前的 n’，动词后已有 pas。"}],
      ["fill", "Nous ne travaillons ___ le dimanche.", null, "pas", "完整的 ne…pas 否定结构需要在 travaillons 后补 pas。"],
      ["fill", "Tu ___ aimes pas ce film.", null, "n’", "aimes 以元音开头，因此填 n’。"],
      ["correct", "补全书面否定，写出完整句子：Il ne regarde la télévision.", null, "Il ne regarde pas la télévision.", "已有 ne，但变位动词 regarde 后缺少 pas。"],
      ["correct", "只修正省音，写出完整正确句子：Elle ne arrive pas demain.", null, "Elle n’arrive pas demain.", "arrive 以元音开头，ne 改成 n’。"]
    ]
  },
  "a1.articles.partitive": {
    goal: "能表达不确定数量，并区别“喜欢某类东西”和“吃喝一些东西”。",
    steps: [
      ["判断是在谈类别还是数量", "J’aime le pain 泛指喜欢面包；Je mange du pain 表示吃一些面包。关键不在能否数出来，而在这句话把它当作类别还是不确定数量。"],
      ["按性别和开头选形式", "阳性单数用 du，阴性单数用 de la；元音或哑音 h 前用 de l’。例如 du riz、de la soupe、de l’huile。"],
      ["注意否定和数量表达", "一般否定数量时用 de/d’：Je ne mange pas de riz。明确数量后也常用 de：un bol de soupe。不要把所有位置的 de 都自动改成 du。"]
    ],
    worked: [["Je mange de la soupe.", "我喝一些汤。", "不是指定某一份汤，而是说不确定数量；soupe 阴性单数，选 de la。"], ["Il aime le chocolat, mais il ne mange pas de chocolat.", "他喜欢巧克力，但他不吃巧克力。", "喜欢某类事物用 le；否定吃的数量用 de。"]],
    checks: [
      ["choice", "Pour le déjeuner, je mange ___ riz.", ["du", "de la", "de l’"], "du", "riz 是辅音开头的阳性单数；表达一些米饭，用 du。", {"de la":"de la 对应阴性单数，而 riz 是阳性。","de l’":"riz 不以元音或哑音 h 开头。"}],
      ["choice", "Elle ajoute ___ huile dans la poêle.", ["du", "de la", "de l’"], "de l’", "huile 以哑音 h 开头，部分冠词用 de l’。", {du:"huile 不是辅音开头的阳性名词。","de la":"huile 虽然是阴性，但哑音 h 前要省音。"}],
      ["fill", "Je ne bois pas ___ café.", null, "de", "一般否定数量时，du 变成 de。"],
      ["fill", "填部分冠词：Au petit déjeuner, elle boit ___ lait.", null, "du", "lait 是阳性单数；表达喝一些牛奶，用 du。"],
      ["correct", "只改冠词，写出完整正确句子：Il mange du confiture.", null, "Il mange de la confiture.", "confiture 是阴性单数，应该用 de la。"],
      ["correct", "只修正省音，写出完整正确句子：Nous buvons de la eau.", null, "Nous buvons de l’eau.", "eau 以元音开头，de la 省音为 de l’。"]
    ]
  },
  "a1.possessives": {
    goal: "能根据拥有者和被拥有名词，分两步选择主有形容词。",
    steps: [
      ["先确定是谁的", "我的用 mon/ma/mes；你的用 ton/ta/tes；他或她的用 son/sa/ses。我们的、您或你们的、他们的分别用 notre/nos、votre/vos、leur/leurs。"],
      ["再看被拥有的名词", "同一个拥有者的名词仍有性数变化：mon sac、ma veste、mes chaussures。son/sa 不能用来区分拥有者是男性还是女性。"],
      ["检查阴性单数的元音开头", "阴性单数在元音或哑音 h 前也用 mon/ton/son，如 son adresse。复数仍用 mes/tes/ses，不因元音开头而变化。"]
    ],
    worked: [["Léa cherche son téléphone.", "莉娅在找她的手机。", "拥有者是 Léa，但形式取决于 téléphone 是阳性单数，所以是 son。"], ["Tu connais mon ancienne école.", "你知道我以前的学校。", "école 是阴性；紧接冠词的 ancienne 以元音开头，因此使用 mon。"]],
    checks: [
      ["choice", "Je mets ___ manteau. (my coat)", ["mon", "ma", "mes"], "mon", "manteau 是阳性单数；我的用 mon。", {ma:"ma 用于辅音开头的阴性单数。",mes:"mes 对应复数，这里是单数 manteau。"}],
      ["choice", "Paul cherche ___ sœur. (his sister)", ["son", "sa", "ses"], "sa", "看被拥有的 sœur，它是阴性单数，因此用 sa。", {son:"Paul 是男性并不决定这里用 son；sœur 是阴性。",ses:"ses 用于复数，这里是一位姐妹。"}],
      ["fill", "Voici ___ adresse. (your address, tu)", null, "ton", "adresse 虽是阴性，但以元音开头，因此用 ton。"],
      ["fill", "Je range ___ chaussures. (my shoes)", null, "mes", "chaussures 是复数，我的用 mes。"],
      ["correct", "只改主有形容词，写出完整正确句子：Elle téléphone à sa ami.", null, "Elle téléphone à son ami.", "ami 是阳性单数，主有形容词应为 son。"],
      ["correct", "只改主有形容词，写出完整正确句子：Tu prends ta clés.", null, "Tu prends tes clés.", "clés 是复数，你的用 tes；ta 是阴性单数。"]
    ]
  },
  "a1.adjectives.agreement": {
    goal: "能找到形容词描述的名词，并完成常见形容词的性数配合。",
    steps: [
      ["先找形容词描述谁", "看它修饰的名词或 être 前的主语。说话者是谁不影响配合：Paul dit que la maison est petite，petite 仍跟 maison 配合。"],
      ["先处理阴性，再处理复数", "规则形式常在阳性单数上给阴性加 -e，再给复数加 -s：petit、petite、petits、petites。不是所有形容词都规则变化。"],
      ["留意已经存在的词尾", "以 -e 结尾的形容词通常阴性不再加 e，如 calme；阳性以 -s 结尾通常复数不再加 s，如 français。long 的阴性是 longue；beau 的阴性是 belle，这些特殊形式需要单独记。"]
    ],
    worked: [["Le sac est lourd. / La valise est lourde.", "包很重。/ 箱子很重。", "sac 阳性用 lourd；valise 阴性用 lourde。"], ["Les valises sont lourdes.", "箱子们很重。", "valises 是阴性复数，先变 lourde，再加 s，得到 lourdes。"]],
    checks: [
      ["choice", "La route est ___. (long)", ["long", "longue", "longs"], "longue", "route 是阴性单数，long 的阴性是 longue。", {long:"long 是阳性单数，不与 route 配合。",longs:"longs 是阳性复数，这里是阴性单数。"}],
      ["choice", "Les garçons sont ___. (petit)", ["petite", "petits", "petites"], "petits", "garçons 是阳性复数，用 petits。", {petite:"petite 是阴性单数。",petites:"petites 是阴性复数，不对应 garçons。"}],
      ["fill", "Cette jupe est ___. (vert)", null, "verte", "jupe 是阴性单数，vert 加 e 成 verte。"],
      ["fill", "Ces fleurs sont ___. (joli)", null, "jolies", "fleurs 是阴性复数，joli 加 e 再加 s。"],
      ["correct", "只改形容词，写出完整正确句子：Les filles sont intelligent.", null, "Les filles sont intelligentes.", "filles 是阴性复数，形容词要变成 intelligentes。"],
      ["correct", "只改形容词，写出完整正确句子：Un vélo bleue est devant la maison.", null, "Un vélo bleu est devant la maison.", "vélo 是阳性单数，用 bleu，不加阴性 e。"]
    ]
  }
};

const FOUNDATION_SKILLS = ["辨认规则", "独立填空", "整句纠错"];
Object.keys(FOUNDATIONS).forEach(function (id) {
  const kp = KP_BY_ID[id];
  if (!kp) throw new Error('Unknown foundation point: ' + id);
  FOUNDATIONS[id].items = FOUNDATIONS[id].checks.map(function (row, index) {
    const item = { id: id + '.foundation' + (index + 1), type: row[0], stage: 'kwiz', prompt: row[1], options: row[2], answer: row[3], explain: row[4], distract: row[5] || null, foundation: true, skill: Math.floor(index / 2), difficulty: kp.difficulty + Math.floor(index / 2) * 0.3 };
    kp.items.push(item);
    return item;
  });
});
