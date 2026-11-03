/* French traditional proverbs: source attestations retained per entry.
   English and Chinese are original learning translations, not quotations
   attributed to a modern author. No online quote service is required. */
const HOME_SAYINGS=[
  {id:'nid',fr:'Petit à petit, l’oiseau fait son nid.',en:'Little by little, the bird builds its nest.',zh:'小鸟一点一点筑成巢；积少成多。',theme:'积累',source:'https://www.dictionnaire-academie.fr/article/A9P1804',chunk:'petit à petit',note:'表示“一点一点地、逐渐地”，可以用来描述缓慢但持续的进步。',kpId:'b1.adverbs.maniere'},
  {id:'forgeron',fr:'C’est en forgeant qu’on devient forgeron.',en:'It is by forging that one becomes a blacksmith; skill grows through practice.',zh:'铁匠是打铁练成的；熟能生巧。',theme:'练习',source:'https://www.dictionnaire-academie.fr/article/A9F1263',chunk:'en forgeant',note:'en + 现在分词可说明方式：通过做某事。这里表示“通过打铁”。',kpId:'b1.verbs.gerondif'},
  {id:'risque',fr:'Qui ne risque rien n’a rien.',en:'Those who risk nothing gain nothing.',zh:'不冒一点风险，就不会有所收获。',theme:'勇气',source:'https://www.dictionnaire-academie.fr/article/A9R2712',chunk:'ne … rien',note:'表示“什么也不……”。元音前 ne 省音为 n’，如这里的 n’a rien。',kpId:'a1.syntax.negation_rien_jamais'},
  {id:'cherche',fr:'Qui cherche trouve.',en:'Those who seek will find.',zh:'用心寻找，终有所获。',theme:'探索',source:'https://www.dictionnaire-academie.fr/article/A9T2547',chunk:'cherche / trouve',note:'chercher 和 trouver 都是规则 -er 动词；这里用第三人称单数现在时。',kpId:'a0.er.present'},
  {id:'pluie',fr:'Après la pluie, le beau temps.',en:'After the rain comes fair weather.',zh:'雨后会有晴天；困难终会过去。',theme:'希望',source:'https://www.dictionnaire-academie.fr/article/A9T0658',chunk:'le beau temps',note:'表示“好天气”；描述天气时，常说 Il fait beau。',kpId:'a0.expressions.weather'},
  {id:'tard',fr:'Mieux vaut tard que jamais.',en:'Better late than never.',zh:'迟做总比不做好。',theme:'开始',source:'https://www.dictionnaire-academie.fr/article/A9M2111',chunk:'mieux … que',note:'mieux 表示“更好”，是 bien 的比较级；这里比较“迟一些”和“从不”。',kpId:'b1.comparison'},
  {id:'vouloir',fr:'Vouloir, c’est pouvoir.',en:'Where there is a will, there is a way.',zh:'有志者，事竟成。',theme:'决心',source:'https://www.dictionnaire-academie.fr/article/A8V0798',chunk:'vouloir / pouvoir',note:'vouloir 表示“想要”，pouvoir 表示“能够”。这两个动词都需要单独记变位。',kpId:'a1.verbs.modals'},
  {id:'coeur',fr:'À cœur vaillant, rien d’impossible.',en:'To a courageous heart, nothing is impossible.',zh:'心有勇气，便无不可逾越之事。',theme:'信心',source:'https://www.dictionnaire-academie.fr/article/A9V0061',chunk:'cœur vaillant',note:'cœur（心）是阳性单数名词；形容词 vaillant 在这里也用阳性单数。',kpId:'a1.adjectives.agreement'},
  {id:'union',fr:'L’union fait la force.',en:'Unity creates strength.',zh:'团结就是力量。',theme:'合作',source:'https://www.dictionnaire-academie.fr/article/A9F1230',chunk:'fait',note:'fait 是 faire 的第三人称单数现在时；句子的主语是单数 l’union。',kpId:'a0.verbs.faire'},
  {id:'attendre',fr:'Tout vient à point à qui sait attendre.',en:'Good things come in due time to those who know how to wait.',zh:'懂得耐心等待，终会等来合适的时机。',theme:'耐心',source:'https://dictionnaire-academie.fr/article/A9P3089',chunk:'attendre',note:'attendre 表示“等待”，属于规则 -re 动词；现在时如 j’attends、nous attendons。',kpId:'a1.verbs.re_regular'}
];

const HomeSayings=(function(){
  const key='kwizlocal.home-sayings.v1',ids=HOME_SAYINGS.map(q=>q.id);
  let current=null,rotation=null;
  function shuffle(values,random){const out=values.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
  function draw(saved,random){
    const last=saved&&ids.includes(saved.last)?saved.last:null;
    let remaining=saved&&Array.isArray(saved.remaining)&&saved.remaining.length<ids.length&&new Set(saved.remaining).size===saved.remaining.length&&saved.remaining.every(id=>ids.includes(id)&&id!==last)?saved.remaining.slice():[];
    if(!remaining.length){remaining=shuffle(ids,random||Math.random);if(remaining[0]===last)[remaining[0],remaining[1]]=[remaining[1],remaining[0]];}
    return {last:remaining.shift(),remaining};
  }
  function next(){
    if(!rotation){try{rotation=JSON.parse(localStorage.getItem(key));}catch(_){rotation=null;}}
    rotation=draw(rotation,Math.random);current=HOME_SAYINGS.find(q=>q.id===rotation.last);
    try{localStorage.setItem(key,JSON.stringify(rotation));}catch(_){}
    return current;
  }
  function get(){return current||next();}
  return {get,next,draw};
})();

function homeSayingHtml(){
  const q=HomeSayings.get(),kp=KP_BY_ID[q.kpId];
  return '<section class="home-saying" aria-labelledby="homeSayingTitle" data-saying-id="'+q.id+'"><div class="saying-heading"><div><span class="studio-eyebrow">UNE PENSÉE POUR AVANCER</span><h2 id="homeSayingTitle">一句法语，一点力量。</h2></div><button type="button" class="btn sm ghost" id="nextSaying" aria-label="换一句三语箴言">换一句 ↻</button></div>'
    +'<div class="saying-copy" aria-live="polite" aria-atomic="true"><span class="saying-theme">'+esc(q.theme)+' · 法国谚语</span><blockquote lang="fr">'+esc(q.fr)+'</blockquote><p class="saying-translation" lang="en"><span>EN</span>'+esc(q.en)+'</p><p class="saying-translation" lang="zh-CN"><span>中</span>'+esc(q.zh)+'</p></div>'
    +'<div class="saying-footer"><details><summary>随手学个表达</summary><p><b lang="fr">'+esc(q.chunk)+'</b> · '+esc(q.note)+'</p><a href="#/prelearn/'+q.kpId+'">了解相关语法 · '+kp.level+' →</a></details><a class="saying-source" href="'+esc(q.source)+'" target="_blank" rel="noopener noreferrer">原文出处 ↗</a></div><p class="saying-caption">英中为学习译文 · 刷新或手动换句，同轮不重复</p></section>';
}
function wireHomeSaying(){
  const button=document.getElementById('nextSaying');if(!button)return;
  button.onclick=function(){const section=document.querySelector('.home-saying');HomeSayings.next();const template=document.createElement('template');template.innerHTML=homeSayingHtml();const next=template.content.firstElementChild;section.dataset.sayingId=next.dataset.sayingId;section.querySelector('.saying-copy').innerHTML=next.querySelector('.saying-copy').innerHTML;section.querySelector('.saying-footer').replaceWith(next.querySelector('.saying-footer'));button.focus({preventScroll:true});};
}

/* Surface paused secondary activities without loading the large archives.
   Destinations validate their own saved payload before resuming. */
function pausedLearningLinks(){
  const rows=[],batch=state.batchStudy,theme=state.themeStudy;
  if(batch&&typeof batch.kpId==='string'&&Object.prototype.hasOwnProperty.call(KP_BY_ID,batch.kpId)&&['check','form','recall'].includes(batch.mode)&&Array.isArray(batch.ids)&&batch.ids.length>0&&batch.ids.length<=8&&batch.ids.every(id=>typeof id==='string'&&/^(seed|form|example)\./.test(id))&&new Set(batch.ids).size===batch.ids.length&&Array.isArray(batch.answers)&&batch.answers.length<batch.ids.length&&batch.answers.every(a=>typeof a==='string')){
    rows.push({kind:'batch',href:'#/practice-point/'+batch.kpId,title:'知识点专项 · '+(zhOf(KP_BY_ID[batch.kpId])||KP_BY_ID[batch.kpId].title),progress:batch.answers.length+' / '+batch.ids.length+' 题已提交'});
  }
  if(theme&&typeof theme.id==='string'&&/^\d+$/.test(theme.id)&&['cards','write'].includes(theme.mode)&&Array.isArray(theme.queue)&&theme.queue.length>0&&theme.queue.length<=10&&Number.isInteger(theme.index)&&theme.index>=0&&theme.index<theme.queue.length&&Array.isArray(theme.responses)&&theme.responses.length<=10&&theme.responses.every(r=>r&&typeof r==='object'&&!Array.isArray(r))&&theme.queue.every(q=>q&&typeof q.en==='string'&&(theme.mode==='cards'?typeof q.fr==='string':Array.isArray(q.answers)&&q.answers.length>0&&q.answers.every(a=>typeof a==='string')))){
    rows.push({kind:'theme',href:'#/theme-practice/'+theme.id,title:'主题词汇 · '+(theme.mode==='cards'?'遮义回忆':'参考写法'),progress:theme.index+' / '+theme.queue.length+' 项已完成'});
  }
  if(placement&&placement.phase==='question'&&Array.isArray(placement.items)&&placement.items.length>0&&placement.items.length<=20&&Number.isInteger(placement.index)&&placement.index>=0&&placement.index<placement.items.length&&placement.items.every(r=>r&&typeof r.kpId==='string'&&typeof r.itemId==='string'&&Object.prototype.hasOwnProperty.call(KP_BY_ID,r.kpId)&&getItem(r))){
    rows.push({kind:'placement',href:'#/placement',title:'水平摸底评测',progress:placement.index+' / '+placement.items.length+' 题已提交'});
  }
  return rows;
}
function pausedLearningHtml(){
  const rows=pausedLearningLinks();if(!rows.length)return '';
  return '<section class="paused-learning" aria-labelledby="pausedLearningTitle"><div class="paused-heading"><span class="studio-eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2 id="pausedLearningTitle">继续未完成的学习</h2></div>'+rows.map(r=>'<a class="paused-row" data-paused-kind="'+r.kind+'" href="'+r.href+'"><span><b>'+esc(r.title)+'</b><small>'+esc(r.progress)+'</small></span><span aria-hidden="true">继续 →</span></a>').join('')+'</section>';
}
function wirePausedLearning(){
  const themeLink=document.querySelector('[data-paused-kind="theme"]');
  if(themeLink)themeLink.addEventListener('click',function(event){if(event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.shiftKey)themeStudy=null;});
  const link=document.querySelector('[data-paused-kind="batch"]');if(!link)return;
  link.addEventListener('click',function(event){if(event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;event.preventDefault();const hash=location.hash,id=state.batchStudy.kpId;
    loadBatchCatalog().then(function(){if(location.hash!==hash)return;batchStudy=null;restoreBatchStudy();if(batchStudy&&batchStudy.kpId===id&&batchStudy.answers.length<batchStudy.ids.length)navigate('#/practice-round/'+id);else{toast('练习内容已更新，请重新开一轮。');navigate('#/practice-point/'+id);}}).catch(function(){if(location.hash===hash)toast('暂时无法打开专项，请更新离线缓存后重试。');});
  });
}
