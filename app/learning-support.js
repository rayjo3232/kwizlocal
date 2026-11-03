/* Placement is a short curriculum diagnostic, not a certified CEFR exam.
   Lexical support is explicit Chinese vocabulary, never a grammar solution. */
const LearningSupport=(function(){
  const words={};
  const groups={
    'ajouter':'添加','chanter':'唱歌','compter':'数；计算','demander':'询问；请求','donner':'给','garder':'保留；看管','laisser':'留下；让','laver':'清洗','marcher':'走路','montrer':'展示','occuper':'占用','oublier':'忘记','penser':'想；认为','porter':'携带；穿着','pousser':'推','quitter':'离开','retourner':'返回','retrouver':'重新找到；会合','sembler':'似乎','tomber':'跌倒','tourner':'转动','trouver':'找到','aimer':'喜欢；爱','jouer':'玩；参加活动','livre|livres':'书','table|tables':'桌子','école|écoles':'学校','musique':'音乐','hôtel|hôtels':'旅馆','enfant|enfants':'孩子','jouent|jouer':'玩；参加活动','dehors':'在外面','cherche|chercher':'寻找','clé|clés':'钥匙','ouvre|ouvrir':'打开','fenêtre|fenêtres':'窗户','cuisine':'厨房；烹饪','arbre|arbres':'树','parc':'公园','grand|grands|grande|grandes':'大的','écoute|écouter|écoutez':'听','radio':'广播；收音机','matin|matins':'早晨','ordinateur|ordinateurs':'电脑','neuf|neuve':'新的','chaise|chaises':'椅子','près':'在附近','bureau|bureaux':'办公室；书桌','histoire|histoires':'故事；历史','intéressant|intéressante':'有趣的',
    'chat|chats':'猫','maison|maisons':'房子；家','ami|amis|amie|amies':'朋友','problème|problèmes':'问题；困难','voiture|voitures':'汽车','idée|idées':'想法','achète|acheter':'买','homme|hommes':'男人；人','devant':'在前面','porte|portes':'门；携带、穿着（porter 的变位）','robe|robes':'连衣裙','touriste|touristes':'游客','musée|musées':'博物馆','appartement|appartements':'公寓','adresse|adresses':'地址','utile|utiles':'有用的','pomme|pommes':'苹果','valise|valises':'行李箱',
    'étudiant|étudiants|étudiante|étudiantes':'学生','français|française':'法国的；法语','belge|belges':'比利时的；比利时人','sœur|sœurs':'姐妹','professeur|professeurs':'老师','petit|petits|petite|petites':'小的','retard':'迟到；延误','arrivent|arriver':'到达','ensemble':'一起','bienvenus|bienvenue':'受欢迎的；欢迎','fatigué|fatiguée':'疲倦的','habite|habiter':'居住','contentes|content|contents':'高兴的','prêt|prête':'准备好的','gentil|gentille':'友善的','italienne|italien':'意大利的；意大利人','avance':'提前','ouvertes|ouvert|ouverte':'开着的','jardin|jardins':'花园','patient|patients|patiente':'有耐心的','classe|classes':'班级；课堂','marché|marchés':'市场',
    'raison':'道理；理由','faim':'饥饿','besoin':'需要','aide':'帮助','ans':'岁；年','belle|beau':'美丽的；好看的','soif':'口渴','frère|frères':'兄弟','chien|chiens':'狗','stylo|stylos':'笔','question|questions':'问题；提问','réservation|réservations':'预订','parler':'说；讲','film|films':'电影','regarder':'看','travailler':'工作','dîner':'晚餐；吃晚饭','télévision':'电视','rivière|rivières':'河流','fermer':'关闭','souvent':'经常','rester':'停留','prépare|préparer':'准备','tennis':'网球',
    'nation|nations':'国家；民族','moment|moments':'时刻','liberté':'自由','tourisme':'旅游业','culture':'文化','département':'行政省；部门','journal|journaux':'报纸','prix':'价格；奖项','bateau|bateaux':'船','cheval|chevaux':'马','nez':'鼻子','cinéma':'电影院；电影','plage|plages':'海滩','théâtre':'剧院','soir|soirs':'晚上','restaurant|restaurants':'餐馆','jeune|jeunes':'年轻的','pièce|pièces':'房间；物件','banque|banques':'银行','fleur|fleurs':'花','beaucoup':'很多','monde':'人群；世界','village|villages':'村庄','médecin|médecins':'医生','ville|villes':'城市','père':'父亲','ingénieur|ingénieurs':'工程师','intelligent|intelligente':'聪明的',
    'devoirs':'作业','sport':'体育运动','attention':'注意','vélo':'自行车','fête':'聚会；节日','demain':'明天','partir':'离开；出发','chaussure|chaussures':'鞋','yeux':'眼睛','pull|pulls':'套头衫','blanc|blanche|blanches|blancs':'白色的','noir|noire|noirs|noires':'黑色的','vert|verte|verts|vertes':'绿色的','orange':'橙色的；橙子','bleu|bleue|bleus|bleues':'蓝色的','rouge|rouges':'红色的','gris|grise|grises':'灰色的','heure|heures':'小时；点钟','hiver':'冬季','été':'夏季','printemps':'春季','automne':'秋季','pleuvoir':'下雨','chaud':'热的','froid':'冷的','vrai':'真的','bus':'公共汽车','café':'咖啡；咖啡馆','train|trains':'火车','métro':'地铁','photo|photos':'照片','taxi':'出租车','déjeuner':'午餐；吃午饭','décision':'决定','gare':'车站','être':'是；处于某种状态','avoir':'有','aller':'去','faire':'做','venir':'来','prendre':'拿；乘坐；吃喝','finir':'结束','vendre':'卖'
  };
  for(const [forms,zh] of Object.entries(groups))for(const form of forms.split('|'))words[form]=zh;
  function tokens(text){return (String(text||'').normalize('NFC').toLowerCase().match(/[\p{L}\p{M}]+/gu)||[]);}
  function lexicalHints(item){
    const promptTokens=tokens(item.prompt+' '+(item.passage||'')+' '+(item.inf||''));
    const blocked=new Set();
    if(item.type==='correct'){
      const before=new Set(promptTokens),after=new Set(tokens(item.answer));
      for(const w of after)if(!before.has(w))blocked.add(w);
      for(const w of before)if(!after.has(w))blocked.add(w);
    }else for(const answer of [item.answer].concat(item.accept||[],item.options||[]))for(const w of tokens(answer))blocked.add(w);
    const seen=new Set(),hints=[];
    if(/aujourd['’]hui/i.test(item.prompt)&&!blocked.has('aujourd')&&!blocked.has('hui')){hints.push({word:'aujourd’hui',zh:'今天'});seen.add('aujourd');seen.add('hui');}
    if(/petit[-‑]déjeuner/i.test(item.prompt)&&!blocked.has('petit')&&!blocked.has('déjeuner')){hints.push({word:'petit-déjeuner',zh:'早餐'});seen.add('petit');seen.add('déjeuner');}
    for(const word of promptTokens){if(seen.has(word)||blocked.has(word)||!words[word])continue;seen.add(word);hints.push({word,zh:words[word]});}
    return hints;
  }
  function selectPlacement(kps,levels){
    const selected=[];
    for(const level of levels){
      const candidates=kps.filter(k=>k.level===level.id).map(k=>({kp:k,items:k.items.filter(i=>i.stage!=='guided'&&['choice','fill','correct'].includes(i.type))})).filter(k=>k.items.length);
      const categories=new Set(),points=[];
      for(const candidate of candidates){if(categories.has(candidate.kp.category))continue;categories.add(candidate.kp.category);points.push(candidate);if(points.length===4)break;}
      for(const candidate of candidates){if(points.length===4)break;if(!points.includes(candidate))points.push(candidate);}
      for(const {kp,items} of points){const item=items.find(i=>i.stage==='check')||items[0];selected.push({kpId:kp.id,itemId:item.id});}
    }
    return selected;
  }
  function summarize(answers,kpById,levels){
    const counts={},hits={},scheduled={},pct={};
    for(const l of levels){counts[l.id]=0;hits[l.id]=0;scheduled[l.id]=0;}
    for(const a of answers){const kp=kpById[a.kpId];if(!kp)continue;scheduled[kp.level]++;if(a.correct===null)continue;counts[kp.level]++;if(a.correct===true)hits[kp.level]++;}
    let level='A0',contiguous=true;
    for(const l of levels){pct[l.id]=counts[l.id]?hits[l.id]/counts[l.id]:null;const pass=scheduled[l.id]>=4&&counts[l.id]>=3&&hits[l.id]>=3;if(!pass)contiguous=false;if(contiguous)level=l.id;}
    const answered=Object.values(counts).reduce((a,b)=>a+b,0);
    return {level,counts,hits,pct,answered,sufficient:counts.A0>=3,scheduled};
  }
  return {lexicalHints,selectPlacement,summarize};
})();

function wordSupportHtml(kp,item){
  if(!kp||kp.level!=='A0')return '';
  const hints=LearningSupport.lexicalHints(item);if(!hints.length)return '';
  const escape=function(value){return String(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
  return '<aside class="word-support" aria-label="中文词汇提示"><b>词汇提示</b><dl>'+hints.map(function(h){return '<div><dt lang="fr">'+escape(h.word)+'</dt><dd>'+escape(h.zh)+'</dd></div>';}).join('')+'</dl><p>只辅助理解词义，不提示本题语法答案。</p></aside>';
}
