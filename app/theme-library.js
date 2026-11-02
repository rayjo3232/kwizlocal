/* Theme vocabulary is kept separate from grammar mastery. Exercise feedback
   means reference-spelling matching, not general translation correctness. */
let themeCatalog = null, themeCatalogPromise = null;
let themeFilter = { level:'all', query:'', page:0 };
let themeStudy = null;

function restoreThemeStudy(id) {
  if(themeStudy&&themeStudy.id===id)return;
  const saved=state.themeStudy;
  if(saved&&saved.id===id&&['cards','write'].includes(saved.mode)&&Array.isArray(saved.queue)&&saved.queue.length>0&&saved.queue.length<=10&&Array.isArray(saved.responses)&&saved.responses.length<=10&&Number.isInteger(saved.index)&&saved.index>=0&&saved.index<=saved.queue.length
    &&saved.responses.every(function(r){return r&&typeof r==='object'&&!Array.isArray(r);})
    &&saved.queue.every(function(q){return q&&typeof q.en==='string'&&(saved.mode==='cards'?typeof q.fr==='string':Array.isArray(q.answers)&&q.answers.length>0&&q.answers.every(function(a){return typeof a==='string';}));}))themeStudy=saved;
}
function saveThemeStudy(){state.themeStudy=themeStudy;saveState();}

function themeEntryHtml() {
  return '<div class="theme-library-entry"><div><span class="studio-eyebrow">VOCABULARY IN CONTEXT · A0–C1</span><h2>按主题积累词汇，学完就回忆。</h2><p>原版主题词表、遮义记忆卡和参考写法练习，连接词汇学习与验证。</p></div><a class="btn sm" href="#/themes">进入主题词汇库 →</a></div>';
}

/* The grammar archive contains links to theme lists. Plain clicks on imported
   lists stay local; missing lists retain their original destination. */
document.addEventListener('click',function(event){
  if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
  const link=event.target.closest('a[href]');
  if(!link||!link.closest('.source-content'))return;
  const match=/^https:\/\/french\.kwiziq\.com\/learn\/theme\/(\d+)(?:[?#].*)?$/.exec(link.getAttribute('href'));
  if(!match)return;
  const hash=location.hash,original=link.href;event.preventDefault();
  loadThemeCatalog().then(function(){if(location.hash!==hash)return;if(getTheme(match[1]))navigate('#/theme/'+match[1]);else location.href=original;})
    .catch(function(){if(location.hash===hash)toast('本地主题库暂时不可用，请更新离线缓存后重试。');});
});

function loadThemeCatalog() {
  if (themeCatalog) return Promise.resolve(themeCatalog);
  if (themeCatalogPromise) return themeCatalogPromise;
  themeCatalogPromise = new Promise(function (resolve,reject) {
    if (globalThis.KWIZIQ_THEMES) { resolve(globalThis.KWIZIQ_THEMES); return; }
    const script=document.createElement('script'); script.src='kwiziq-themes.js';
    script.onload=function(){resolve(globalThis.KWIZIQ_THEMES);};
    script.onerror=function(){script.remove();reject(new Error('Theme archive unavailable'));};
    document.head.appendChild(script);
  }).then(function(data){if(!data||!Array.isArray(data.themes))throw new Error('Invalid theme archive');themeCatalog=data;return data;})
    .catch(function(error){themeCatalogPromise=null;throw error;});
  return themeCatalogPromise;
}

function themeLoading(render, hash) {
  app.innerHTML='<div class="container"><div class="source-loading" role="status">正在打开主题词汇库…</div></div>';
  loadThemeCatalog().then(function(){if(location.hash===hash)render();}).catch(function(){
    if(location.hash!==hash)return;
    app.innerHTML='<div class="container"><div class="empty">暂时无法读取主题词汇库，请联网更新离线缓存后重试。<a href="#/library">回到课程库</a></div></div>';
  });
}

function themeMatches() {
  const words=sourceFold(themeFilter.query).trim().split(/\s+/).filter(Boolean);
  return themeCatalog.themes.filter(function(t){return (themeFilter.level==='all'||t.level===themeFilter.level)&&words.every(function(w){return sourceFold(t.title+' '+t.description+' '+(t.entries||[]).map(function(e){return e.fr+' '+e.en;}).join(' ')).includes(w);});});
}

function renderThemeCatalog() {
  if(!themeCatalog){themeLoading(renderThemeCatalog,'#/themes');return;}
  const themes=themeMatches(),size=24;
  themeFilter.page=Math.min(themeFilter.page,Math.max(0,Math.ceil(themes.length/size)-1));
  app.innerHTML='<div class="container"><div class="page-head"><span class="studio-eyebrow">LEARN BY THEME · REMEMBER IN CONTEXT</span><h1>主题词汇与表达</h1><p>'
    +themeCatalog.imported+' / '+themeCatalog.total+' 个主题已保存 · '+themeCatalog.entryCount+' 条双语词条 · A0–C1</p></div>'
    +'<div class="theme-intro"><b>先按场景学，再遮住答案回忆。</b><p>原版法语词条与英译，保留冠词和表达形式。可用记忆卡回顾，或进行英译法参考写法练习；练习数据单独记录，不写入语法掌握度。音频未导入。</p></div>'
    +'<div class="theme-filters"><label>搜索主题与词条<input id="themeSearch" type="search" placeholder="例如 restaurant、family、le chat" value="'+esc(themeFilter.query)+'"></label>'
    +'<label>级别<select id="themeLevel"><option value="all">全部级别</option>'+['A0','A1','A2','B1','B2','C1'].map(function(l){return '<option value="'+l+'"'+(themeFilter.level===l?' selected':'')+'>'+l+'</option>';}).join('')+'</select></label>'
    +'<button class="btn sm ghost" id="themeReset">重置筛选</button></div><p class="small theme-count" role="status">找到 '+themes.length+' 个主题；不同主题可能包含相同词条。</p>'
    +'<div class="source-grid">'+themes.slice(themeFilter.page*size,(themeFilter.page+1)*size).map(function(t){
      return '<article class="source-card theme-card"><span class="source-card-level">'+esc(t.level)+' · '+(t.entries?t.entries.length+' 条词汇':'尚未导入')+'</span><h2>'+esc(t.title)+'</h2><p>'+esc(t.description)+'</p>'
        +(t.status==='ready'?'<a class="btn sm" href="#/theme/'+t.id+'">学习这个主题 →</a>':'<p class="small">原站当前无法访问，未导入词条。</p><a class="btn sm ghost" href="'+esc(t.url)+'" target="_blank" rel="noopener noreferrer">查看原站</a>')+'</article>';
    }).join('')+'</div>'+(!themes.length?'<div class="empty">没有匹配主题，试着减少关键词。</div>':'')
    +'<div class="source-pagination"><button class="btn sm ghost" id="themePrev"'+(!themeFilter.page?' disabled':'')+'>上一页</button><span>'+(themeFilter.page+1)+' / '+Math.max(1,Math.ceil(themes.length/size))+'</span><button class="btn sm ghost" id="themeNext"'+((themeFilter.page+1)*size>=themes.length?' disabled':'')+'>下一页</button></div></div>';
  const search=function(event){if(event.isComposing)return;const cursor=event.target.selectionStart;themeFilter.query=event.target.value;themeFilter.page=0;renderThemeCatalog();const input=document.getElementById('themeSearch');input.focus();input.setSelectionRange(cursor,cursor);};
  document.getElementById('themeSearch').oninput=search;document.getElementById('themeSearch').oncompositionend=search;
  document.getElementById('themeLevel').onchange=function(e){themeFilter.level=e.target.value;themeFilter.page=0;renderThemeCatalog();document.getElementById('themeLevel').focus();};
  document.getElementById('themeReset').onclick=function(){themeFilter={level:'all',query:'',page:0};renderThemeCatalog();};
  document.getElementById('themePrev').onclick=function(){themeFilter.page--;renderThemeCatalog();scrollTo(0,0);};
  document.getElementById('themeNext').onclick=function(){themeFilter.page++;renderThemeCatalog();scrollTo(0,0);};
}

function getTheme(id) {return themeCatalog&&themeCatalog.themes.find(function(t){return t.id===id&&t.status==='ready';});}

function renderThemeLesson(id) {
  if(!themeCatalog){themeLoading(function(){renderThemeLesson(id);},'#/theme/'+id);return;}
  const theme=getTheme(id);
  if(!theme){app.innerHTML='<div class="container"><div class="empty">这个主题尚不可用。<a href="#/themes">回到主题库</a></div></div>';return;}
  restoreThemeStudy(id);
  const record=state.themePractice&&state.themePractice[id];
  app.innerHTML='<div class="container"><a class="small" href="#/themes">← 返回主题词汇库</a><div class="page-head"><span class="studio-eyebrow">'+esc(theme.level)+' · '+theme.entries.length+' 条词汇</span><h1>'+esc(theme.title)+'</h1><p>'+esc(theme.description)+'</p></div>'
    +'<div class="theme-study-actions"><button class="btn" id="themeCards">遮住释义 · 记忆卡</button><button class="btn ghost" id="themeWrite">英译法 · 参考写法练习</button>'
    +(themeStudy&&themeStudy.id===id&&themeStudy.index<themeStudy.queue.length?'<a class="btn subtle" href="#/theme-practice/'+id+'">继续上次练习</a>':'')+'</div>'
    +'<p class="small">'+(record?'已完成记忆卡 '+(record.cardRounds||0)+' 轮、写法练习 '+(record.writeRounds||0)+' 轮。':'先读词表，再试着独立回忆；每轮练习最多 10 个词。')+'</p>'
    +'<div class="theme-table-head"><h2>法语与英语对照</h2><button class="btn sm ghost" id="themeHide" aria-pressed="false">遮住英译</button></div>'
    +'<div class="theme-table-wrap"><table class="theme-table"><thead><tr><th scope="col">Français</th><th scope="col">English</th></tr></thead><tbody>'
    +theme.entries.map(function(e){return '<tr><td lang="fr">'+esc(e.fr)+'</td><td class="theme-meaning">'+esc(e.en)+'</td></tr>';}).join('')+'</tbody></table></div>'
    +(theme.notes||[]).map(function(note){return '<p class="small">'+esc(note)+'</p>';}).join('')
    +'<p class="source-credit">来源：KwizIQ · 抓取日期 '+esc(theme.fetchedAt.slice(0,10))+' · <a href="'+esc(theme.url)+'" target="_blank" rel="noopener noreferrer">原版词表 ↗</a>。按你提供的授权导入；音频未保存。</p></div>';
  document.getElementById('themeCards').onclick=function(){startThemePractice(id,'cards');};
  document.getElementById('themeWrite').onclick=function(){startThemePractice(id,'write');};
  document.getElementById('themeHide').onclick=function(){const hidden=this.getAttribute('aria-pressed')!=='true';this.setAttribute('aria-pressed',hidden);this.textContent=hidden?'显示英译':'遮住英译';document.querySelector('.theme-table').classList.toggle('hide-meaning',hidden);};
}

function themeNormalize(value) {return String(value||'').normalize('NFC').toLowerCase().replace(/[’‘]/g,"'").replace(/[.,!?;:«»"]/g,' ').replace(/\s+/g,' ').trim();}

function themePracticeGroups(theme) {
  const groups=new Map();
  theme.entries.forEach(function(entry){const key=themeNormalize(entry.en);if(!groups.has(key))groups.set(key,{en:entry.en,answers:[]});const group=groups.get(key);if(!group.answers.includes(entry.fr))group.answers.push(entry.fr);});
  return Array.from(groups.values());
}

function startThemePractice(id,mode) {
  const theme=getTheme(id);if(!theme)return;
  const pool=(mode==='cards'?theme.entries.map(function(e){return {fr:e.fr,en:e.en};}):themePracticeGroups(theme)).slice();
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=pool[i];pool[i]=pool[j];pool[j]=t;}
  themeStudy={id:id,mode:mode,queue:pool.slice(0,10),index:0,responses:[],revealed:false,given:'',result:null,saved:false};
  saveThemeStudy();
  navigate('#/theme-practice/'+id);renderThemePractice(id);
}

function renderThemePractice(id) {
  if(!themeCatalog){themeLoading(function(){renderThemePractice(id);},'#/theme-practice/'+id);return;}
  const theme=getTheme(id);if(!theme){renderThemeLesson(id);return;}
  restoreThemeStudy(id);
  if(!themeStudy||themeStudy.id!==id){startThemePractice(id,'write');return;}
  const d=themeStudy,total=d.queue.length;
  if(d.index>=total){
    const cards=d.mode==='cards';const matched=d.responses.filter(function(r){return cards?r.known:r.matched===true;}).length;
    const skipped=d.responses.filter(function(r){return r.matched===null;}).length;
    if(!d.saved){
      if(!state.themePractice||typeof state.themePractice!=='object'||Array.isArray(state.themePractice))state.themePractice={};
      const previous=state.themePractice[id]||{};
      state.themePractice[id]={cardRounds:(Number(previous.cardRounds)||0)+(cards?1:0),writeRounds:(Number(previous.writeRounds)||0)+(cards?0:1),lastAt:Date.now()};
      d.saved=true;saveState();
    }
    app.innerHTML='<div class="container theme-practice"><div class="page-head"><span class="studio-eyebrow">RECALL → CHECK → REVISIT</span><h1>'+(cards?'记忆卡回顾完成':'参考写法练习完成')+'</h1></div><section class="card"><div class="theme-result-score">'+matched+' / '+total+'</div><p>'+(cards?'以上是你自评认识的词数。':'以上是与词表参考写法匹配的题数。')+(skipped?'另有 '+skipped+' 题跳过，尚未验证。':'')+'</p><p class="small">'+(cards?'这是自评回顾，不是客观测试成绩。':'未匹配不一定表示表达错误；词表之外的合理表达请自行核对。')+' 本练习不影响语法掌握度。</p><div class="theme-result-rows">'
      +d.responses.map(function(r,i){const q=d.queue[i];return '<div><b>'+esc(q.en)+'</b><span lang="fr">'+esc(cards?q.fr:q.answers.join(' / '))+'</span>'+(!cards?'<small>你写的是：'+esc(r.given||'（跳过）')+'</small>':'')+'</div>';}).join('')+'</div><a class="btn sm" href="#/theme/'+id+'">回到词表 →</a></section></div>';return;
  }
  const item=d.queue[d.index],cards=d.mode==='cards';
  app.innerHTML='<div class="container theme-practice"><a class="small" href="#/theme/'+id+'">← 回到主题词表</a>'+kwizTopHtml(d.index,total,cards?'记忆卡 · 自评回顾':'英译法 · 参考写法')+'<section class="card theme-prompt-card"><span class="studio-eyebrow">'+esc(theme.title)+'</span><h1'+(cards?' lang="fr"':'')+'>'+esc(cards?item.fr:item.en)+'</h1>'
    +(cards?(d.revealed?'<p class="theme-revealed">'+esc(item.en)+'</p><div class="theme-study-actions"><button class="btn" id="themeKnow">自评：认识</button><button class="btn ghost" id="themeAgain">还需再记</button></div>':'<button class="btn" id="themeReveal">显示英译</button>')
      :'<p class="small">按词表原写法填写，包括冠词；重音需要一致。匹配只用于核对参考写法。</p><input class="answer-input" id="themeInput" aria-label="法语参考写法" autocomplete="off" spellcheck="false" value="'+esc(d.given)+'"'+(d.result?' disabled':'')+'>'
      +(d.result?'':accentBarHtml('themeInput'))
      +(d.result?'<div class="theme-write-feedback" role="status"><b>'+(d.result.matched?'匹配参考写法。':'未匹配参考写法，请核对。')+'</b><p lang="fr">'+esc(item.answers.join(' / '))+'</p></div><button class="btn" id="themeContinue">下一题 →</button>':'<div class="theme-study-actions"><button class="btn" id="themeCheck">核对</button><button class="btn ghost" id="themeSkip">跳过</button></div>'))+'</section></div>';
  if(cards){
    if(!d.revealed)document.getElementById('themeReveal').onclick=function(){d.revealed=true;saveThemeStudy();renderThemePractice(id);};
    else ['themeKnow','themeAgain'].forEach(function(key){document.getElementById(key).onclick=function(){d.responses.push({known:key==='themeKnow'});d.index++;d.revealed=false;saveThemeStudy();renderThemePractice(id);};});
  }else if(d.result){document.getElementById('themeContinue').onclick=function(){d.index++;d.given='';d.result=null;saveThemeStudy();renderThemePractice(id);};}
  else{
    document.getElementById('themeInput').focus();
    wireAccentBars();
    document.getElementById('themeCheck').onclick=function(){const given=document.getElementById('themeInput').value;if(!given.trim()){toast('先写出你的答案，或选择跳过。');return;}const matched=item.answers.some(function(fr){return themeNormalize(fr)===themeNormalize(given);});d.given=given;d.result={matched:matched};d.responses.push({given:given,matched:matched});saveThemeStudy();renderThemePractice(id);};
    document.getElementById('themeSkip').onclick=function(){d.responses.push({given:'',matched:null});d.index++;saveThemeStudy();renderThemePractice(id);};
    document.getElementById('themeInput').onkeydown=function(event){if(event.key==='Enter'){event.preventDefault();document.getElementById('themeCheck').click();}};
  }
}
