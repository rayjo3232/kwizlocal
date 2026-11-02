/* Offline references supplement lessons; recall here is self-assessed and
   never changes grammar mastery or the independent conjugation drill. */
let referenceCatalog=null,referencePromise=null;
let referenceFilter={glossary:'',verbs:''};
/* Original Chinese lookup labels; the archived definition stays verbatim. */
const REFERENCE_ZH={agreement:'配合：性、数等形式相互一致',adjective:'形容词',adverb:'副词',article:'冠词',noun:'名词',pronoun:'代词',verb:'动词',gender:'语法性',number:'语法数',conjunction:'连词',preposition:'介词','demonstrative-adjectives':'指示形容词','indefinite-adjectives':'泛指形容词','possessive-adjectives':'主有形容词','indefinite-article':'不定冠词','french-definite-articles-les-articles-definis':'定冠词','french-partitive-articles-les-articles-partitifs':'部分冠词','l-elision-elision':'省音','la-concordance-des-temps-sequence-of-tenses':'时态配合','le-comparatif-comparative':'比较级'};
function referenceChinese(row){return REFERENCE_ZH[row.url.split('/').pop()]||'';}
function loadReferenceCatalog(){
  if(referenceCatalog)return Promise.resolve(referenceCatalog);
  if(referencePromise)return referencePromise;
  referencePromise=new Promise(function(resolve,reject){
    if(globalThis.KWIZIQ_REFERENCE){resolve(globalThis.KWIZIQ_REFERENCE);return;}
    const script=document.createElement('script');script.src='kwiziq-reference.js';
    script.onload=function(){resolve(globalThis.KWIZIQ_REFERENCE);};
    script.onerror=function(){script.remove();reject(new Error('Reference unavailable'));};document.head.appendChild(script);
  }).then(function(data){if(!data||!Array.isArray(data.glossary)||!Array.isArray(data.verbs))throw new Error('Invalid reference');referenceCatalog=data;return data;})
    .catch(function(error){referencePromise=null;throw error;});
  return referencePromise;
}
function referenceEntryHtml(){
  return '<div class="reference-entry"><div><span class="studio-eyebrow">UNDERSTAND THE TERMS · RECALL THE FORMS</span><h2>术语查明白，变位自己想。</h2><p>离线术语解释与完整变位表，随时从精讲链接进入；遮住形式后逐行核对。</p></div><div class="reference-links"><a class="btn sm" href="#/glossary">语法术语库 →</a><a class="btn sm ghost" href="#/verb-reference">扩展变位表 →</a></div></div>';
}
function referenceLoading(render){
  const hash=location.hash;app.innerHTML='<div class="container"><p class="source-loading" role="status">正在打开术语与变位参考库…</p></div>';
  loadReferenceCatalog().then(function(){if(location.hash===hash)render();}).catch(function(){if(location.hash===hash)app.innerHTML='<div class="container"><div class="empty">暂时无法读取参考库，请联网更新离线缓存后重试。<a href="#/library">返回课程库</a></div></div>';});
}
function renderReferenceCatalog(kind){
  if(!referenceCatalog){referenceLoading(function(){renderReferenceCatalog(kind);});return;}
  const verb=kind==='verbs',all=referenceCatalog[kind],words=sourceFold(referenceFilter[kind]).trim().split(/\s+/).filter(Boolean);
  const rows=all.filter(function(r){return words.every(function(w){return sourceFold(r.title+' '+referenceChinese(r)+' '+(r.subtitle||'')+' '+(verb?'':r.text||'')).includes(w);});});
  app.innerHTML='<div class="container"><a class="small" href="#/library">← 返回课程库</a><div class="page-head"><span class="studio-eyebrow">'+(verb?'CONJUGATION REFERENCE':'GRAMMAR GLOSSARY')+'</span><h1>'+(verb?'扩展动词变位表':'语法术语库')+'</h1><p>'+all.filter(function(r){return r.status==='ready';}).length+' / '+all.length+' 项已保存 · '+(verb?'原版时态与语式，保留性数变体':'保留原站法语及英语术语分类与定义')+'</p></div>'
    +'<div class="theme-intro"><b>'+(verb?'先看规则，再遮住形式逐行回忆。':'先弄懂“它是什么意思”，再回到知识点练习。')+'</b><p>'+(verb?'部分表含文学时态。括号表示原版中的可选形式或性数变化；本页以自查方式核对，自动判分练习仍在动词练习页。':'原站有些条目只有标题，或目前无法访问，均显示实际状态；查阅不会记为已掌握。')+'</p></div>'
    +'<label class="reference-search">'+(verb?'搜索动词或英文含义':'搜索术语、英文解释或定义')+'<input id="referenceSearch" type="search" value="'+esc(referenceFilter[kind])+'" placeholder="'+(verb?'例如 arriver、être、to learn':'例如 accord、agreement、subjonctif')+'"></label><p role="status" class="small">找到 '+rows.length+' 项</p><div class="source-grid">'
    +rows.map(function(r){return '<article class="source-card"><span class="source-card-level">'+esc(verb?(r.blocks?r.blocks.length+' 组时态 / 语式':'原站不可用'):(r.subtitle||'术语参考'))+'</span><h2>'+esc(r.title)+'</h2>'+(referenceChinese(r)?'<p class="small">'+esc(referenceChinese(r))+'</p>':'')+(r.status==='ready'?'<a class="btn sm" href="#/'+(verb?'verb-table':'term')+'/'+r.id+'">'+(verb?'查阅与回忆':'阅读解释')+' →</a>':'<p class="small">'+(r.error==='Empty glossary definition'?'原站目前没有定义正文，未计入已保存解释。':'当前未能导入，保留原站入口。')+'</p><a class="btn sm ghost" href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">查看原站 ↗</a>')+'</article>';}).join('')+(!rows.length?'<div class="empty">没有匹配项，请减少关键词。</div>':'')+'</div></div>';
  const search=function(e){if(e.isComposing)return;const cursor=e.target.selectionStart;referenceFilter[kind]=e.target.value;renderReferenceCatalog(kind);const input=document.getElementById('referenceSearch');input.focus();input.setSelectionRange(cursor,cursor);};
  document.getElementById('referenceSearch').oninput=search;document.getElementById('referenceSearch').oncompositionend=search;
}
function referenceCredit(row){return '<p class="source-credit">来源：KwizIQ · '+esc(row.author)+' · '+esc(row.sourceUpdated)+' · 保存日期 '+esc(row.fetchedAt.slice(0,10))+' · <a href="'+esc(row.url)+'" target="_blank" rel="noopener noreferrer">原版参考 ↗</a>。按你提供的授权导入，音频未保存。</p>';}
function renderReferenceItem(kind,id){
  if(!referenceCatalog){referenceLoading(function(){renderReferenceItem(kind,id);});return;}
  const verb=kind==='verbs',row=referenceCatalog[kind].find(function(r){return r.id===id&&r.status==='ready';});
  if(!row){app.innerHTML='<div class="container"><div class="empty">此项尚无可用的本地正文。<a href="#/'+(verb?'verb-reference':'glossary')+'">返回目录</a></div></div>';return;}
  app.innerHTML='<div class="container reference-reader"><a class="small" href="#/'+(verb?'verb-reference':'glossary')+'">← 返回'+(verb?'变位目录':'术语目录')+'</a><div class="page-head"><span class="studio-eyebrow">'+(verb?'READ · COVER · RECALL':'UNDERSTAND THE LANGUAGE OF GRAMMAR')+'</span><h1>'+esc(row.title)+'</h1>'+(referenceChinese(row)?'<p>'+esc(referenceChinese(row))+' · 中文检索提示</p>':'')+'</div><div class="source-content">'+sourceSafeHtml(row.html)+'</div>'
    +(verb?'<div class="reference-controls"><label>时态 / 语式<select id="referenceTense">'+row.blocks.map(function(b,i){return '<option value="'+i+'">'+esc(b.title)+'</option>';}).join('')+'</select></label><button class="btn" id="referenceCover" aria-pressed="false">遮住变位 · 开始回忆</button></div><p class="small">先说出或写下完整形式，再逐行揭晓。括号及不同拼写保留原样；揭晓表示已核对，不代表已掌握。</p><div id="referenceForms"></div>':'')
    +(row.relatedHtml?'<section class="source-content reference-related">'+sourceSafeHtml(row.relatedHtml)+'</section>':'')
    +referenceCredit(row)+'<div class="reference-return"><a class="btn sm ghost" href="#/sources">继续读语法精讲 →</a><a class="btn sm ghost" href="#/verbs">进入自动判分变位练习 →</a></div></div>';
  if(!verb)return;
  let covered=false;
  const draw=function(){
    const block=row.blocks[Number(document.getElementById('referenceTense').value)];
    const unavailable=block.forms.every(function(f){return f.form==='(n/a form)';});
    document.getElementById('referenceCover').disabled=unavailable;
    if(unavailable){document.getElementById('referenceForms').innerHTML='<h2>'+esc(block.title)+'</h2><p class="theme-intro">原版表格将本组标为不适用（n/a），不生成回忆题。</p>';return;}
    document.getElementById('referenceForms').innerHTML='<h2>'+esc(block.title)+'</h2><div class="reference-form-list">'+block.forms.map(function(f,i){return '<div class="reference-form-row"><span lang="fr">'+esc(f.person)+'</span><span class="reference-form" lang="fr"'+(covered?' hidden':'')+'>'+esc(f.form)+'</span><button class="btn sm ghost reference-reveal" data-form="'+i+'"'+(!covered?' hidden':'')+' aria-label="揭晓第 '+(i+1)+' 行 '+esc(f.person)+' 的形式">揭晓形式</button></div>';}).join('')+'</div>';
    document.querySelectorAll('.reference-reveal').forEach(function(button){button.onclick=function(){button.previousElementSibling.hidden=false;button.hidden=true;};});
  };
  document.getElementById('referenceTense').onchange=draw;
  document.getElementById('referenceCover').onclick=function(){covered=!covered;this.setAttribute('aria-pressed',String(covered));this.textContent=covered?'显示全部变位':'遮住变位 · 开始回忆';draw();};draw();
}
function referenceLocalRoute(url){
  if(!referenceCatalog)return null;
  const canonical=(referenceCatalog.aliases||{})[url]||url;
  for(const kind of ['glossary','verbs']){
    const row=referenceCatalog[kind].find(function(r){return r.url===canonical&&r.status==='ready';});
    if(row)return '#/'+(kind==='verbs'?'verb-table':'term')+'/'+row.id;
  }
  return null;
}
document.addEventListener('click',function(event){
  if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
  const link=event.target.closest('a[href]');if(!link||!link.closest('.source-content,.source-related'))return;
  const url=link.getAttribute('href').split(/[?#]/)[0];
  if(!/^https:\/\/french\.kwiziq\.com\/(?:revision\/glossary\/|revision\/grammar\/verbs\/|my-languages\/french\/glossary\/)/.test(url))return;
  const hash=location.hash,original=link.href;event.preventDefault();
  loadReferenceCatalog().then(function(){if(location.hash!==hash)return;const route=referenceLocalRoute(url);if(route)navigate(route);else location.href=original;}).catch(function(){if(location.hash===hash)toast('本地参考库暂时不可用，请更新离线缓存后重试。');});
});
/* Related lessons in a definition/table return to the imported explanation. */
document.addEventListener('click',function(event){
  if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
  const link=event.target.closest('.reference-reader .source-content a[href]');if(!link)return;
  const url=link.getAttribute('href').split(/[?#]/)[0];
  if(!/^https:\/\/french\.kwiziq\.com\/(?:revision\/grammar\/(?!verbs(?:\/|$))|my-languages\/french\/view\/)/.test(url))return;
  const hash=location.hash,original=link.href;event.preventDefault();
  loadSourceCatalog().then(function(){
    if(location.hash!==hash)return;
    const legacy=/\/view\/(\d+)$/.exec(url);
    const lesson=sourceCatalog.lessons.find(function(r){return r.status==='ready'&&(r.url===url||(legacy&&String(r.sourceLessonId)===legacy[1]));});
    if(lesson)navigate('#/source/'+lesson.id);else location.href=original;
  }).catch(function(){if(location.hash===hash)toast('本地课程库暂时不可用，请更新离线缓存后重试。');});
});
