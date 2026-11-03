/* Compiled practice stays separate from the adaptive mastery engine. Example
   recall is never pooled with independent answers in the result breakdown. */
let batchCatalog=null,batchPromise=null,batchIndex=null,batchStudy=null;
let batchFilter={query:'',level:'all',coverage:'all'};
function batchEntryHtml(){return '<div class="batch-entry"><div><span class="studio-eyebrow">BULK CONTENT · TARGETED PRACTICE</span><h2>按知识点，读例句、做专项。</h2><p>整库批量整理；原有题、新变位题与例句回忆分别标注，学完就能核对。</p></div><a class="btn sm" href="#/practice-bank">打开专项练习库 →</a></div>';}
function loadBatchCatalog(){
  if(batchCatalog)return Promise.resolve(batchCatalog);if(batchPromise)return batchPromise;
  batchPromise=new Promise(function(resolve,reject){
    if(globalThis.GENERATED_PRACTICE){resolve(globalThis.GENERATED_PRACTICE);return;}
    const script=document.createElement('script');script.src='generated-practice.js';script.onload=function(){resolve(globalThis.GENERATED_PRACTICE);};script.onerror=function(){script.remove();reject(new Error('Practice bank unavailable'));};document.head.appendChild(script);
  }).then(function(data){if(!data||!Array.isArray(data.items)||!Array.isArray(data.points))throw new Error('Invalid bank');batchCatalog=data;batchIndex=Object.fromEntries(data.items.map(function(i){return [i.id,i];}));return data;}).catch(function(error){batchPromise=null;throw error;});return batchPromise;
}
function batchLoading(render){const hash=location.hash;app.innerHTML='<div class="container"><p class="source-loading" role="status">正在打开专项练习库…</p></div>';loadBatchCatalog().then(function(){if(location.hash===hash)render();}).catch(function(){if(location.hash===hash)app.innerHTML='<div class="container"><div class="empty">暂时无法读取练习库，请联网更新离线缓存后重试。<a href="#/library">回到课程库</a></div></div>';});}
function batchLabel(kind){return {seed:'原有专项题',recall:'例句回忆',form:'新增变位题'}[kind];}
function renderBatchCatalog(){
  if(!batchCatalog){batchLoading(renderBatchCatalog);return;}
  const words=sourceFold(batchFilter.query).trim().split(/\s+/).filter(Boolean);
  const rows=batchCatalog.points.filter(function(p){return (batchFilter.level==='all'||p.level===batchFilter.level)&&(batchFilter.coverage==='all'||p.counts.recall+p.counts.form>0)&&words.every(function(w){return sourceFold(p.title+' '+(zhOf(KP_BY_ID[p.id])||'')+' '+p.id).includes(w);});});
  app.innerHTML='<div class="container"><a href="#/library" class="small">← 返回课程库</a><div class="page-head"><span class="studio-eyebrow">LEARN → PRACTISE → CHECK</span><h1>知识点专项练习库</h1><p>全部 '+batchCatalog.points.length+' 个知识点已整理 · '+batchCatalog.counts.form.toLocaleString()+' 道新增变位题 · '+batchCatalog.counts.recall+' 道例句回忆</p></div>'
    +'<div class="theme-intro"><b>练习来源清楚，结果分开看。</b><p>'+batchCatalog.counts.seed+' 道原有题复用现有题干与解释；新增题由已保存变位表转换，例句回忆用于复原学过的写法。新增变位来自已保存的 KwizIQ 表，结果可回查来源。专项结果单独保存，不改变自适应掌握度。未生成新题的知识点仍保留原有专项题。</p></div>'
    +'<div class="batch-filters"><label>搜索知识点<input id="batchSearch" type="search" value="'+esc(batchFilter.query)+'" placeholder="例如 冠词、未来时、être"></label><label>级别<select id="batchLevel"><option value="all">全部级别</option>'+LEVELS.map(function(l){return '<option value="'+l.id+'"'+(batchFilter.level===l.id?' selected':'')+'>'+l.id+'</option>';}).join('')+'</select></label><label>内容<select id="batchCoverage"><option value="all">全部知识点</option><option value="new"'+(batchFilter.coverage==='new'?' selected':'')+'>本轮有新题</option></select></label></div><p class="small" role="status">找到 '+rows.length+' 个知识点</p><div class="source-grid">'
    +rows.map(function(p){return '<article class="source-card"><span class="source-card-level">'+p.level+'</span><h2>'+esc(zhOf(KP_BY_ID[p.id])||p.title)+'</h2><p>'+esc(p.title)+'</p><p class="small">原有 '+p.counts.seed+' · 新变位 '+p.counts.form+' · 例句回忆 '+p.counts.recall+'</p><a class="btn sm" href="#/practice-point/'+p.id+'">学习与练习 →</a></article>';}).join('')+(!rows.length?'<div class="empty">没有匹配项，请减少关键词。</div>':'')+'</div></div>';
  const search=function(e){if(e.isComposing)return;const pos=e.target.selectionStart;batchFilter.query=e.target.value;renderBatchCatalog();const input=document.getElementById('batchSearch');input.focus();input.setSelectionRange(pos,pos);};document.getElementById('batchSearch').oninput=search;document.getElementById('batchSearch').oncompositionend=search;
  document.getElementById('batchLevel').onchange=function(e){batchFilter.level=e.target.value;renderBatchCatalog();document.getElementById('batchLevel').focus();};document.getElementById('batchCoverage').onchange=function(e){batchFilter.coverage=e.target.value;renderBatchCatalog();document.getElementById('batchCoverage').focus();};
}
function restoreBatchStudy(){
  if(batchStudy)return;const saved=state.batchStudy;
  if(!saved||saved.buildId!==batchCatalog.buildId||!['strict','lenient'].includes(saved.answerMode)||typeof saved.kpId!=='string'||!Object.prototype.hasOwnProperty.call(KP_BY_ID,saved.kpId)||!['check','form','recall'].includes(saved.mode)||typeof saved.id!=='string'||!Array.isArray(saved.ids)||!saved.ids.length||saved.ids.length>8||new Set(saved.ids).size!==saved.ids.length||!Array.isArray(saved.answers)||saved.answers.length>saved.ids.length||!saved.answers.every(function(a){return typeof a==='string'&&a.length<=2000;})||!saved.ids.every(function(id){const item=typeof id==='string'&&Object.prototype.hasOwnProperty.call(batchIndex,id)?batchIndex[id]:null;return item&&item.kpIds.includes(saved.kpId)&&(saved.mode==='recall'?item.kind==='recall':saved.mode==='form'?item.kind==='form':item.kind!=='recall');}))return;
  batchStudy=saved;
}
function renderBatchPoint(id){
  if(!batchCatalog){batchLoading(function(){renderBatchPoint(id);});return;}
  const kp=KP_BY_ID[id],point=batchCatalog.points.find(function(p){return p.id===id;});if(!kp||!point){app.innerHTML='<div class="container"><div class="empty">找不到这个知识点。<a href="#/practice-bank">返回目录</a></div></div>';return;}
  restoreBatchStudy();
  const history=Array.isArray(state.batchPractice)?state.batchPractice.filter(function(r){return r&&typeof r==='object'&&r.kpId===id;}):[];
  app.innerHTML='<div class="container"><a class="small" href="#/practice-bank">← 返回专项练习库</a><div class="page-head"><span class="studio-eyebrow">'+kp.level+' · '+esc(kp.title)+'</span><h1>'+esc(zhOf(kp)||kp.title)+'</h1><p>原有题 '+point.counts.seed+' · 新变位 '+point.counts.form+' · 例句回忆 '+point.counts.recall+'</p></div><div class="rule-box"><b>先看规则：</b>'+esc(kp.rule)+'</div>'
    +'<div class="batch-actions"><button class="btn" data-batch-start="check">专项检测 · 最多 8 题</button>'+(point.counts.form?'<button class="btn ghost" data-batch-start="form">只练新增变位</button>':'')+(point.counts.recall?'<button class="btn ghost" data-batch-start="recall">例句回忆</button>':'')+'</div><p class="small">检测提交后统一核对答案；例句回忆是学过原句的参考写法核对，单独计分。刷新后可继续尚未完成的一轮。</p>'
    +(batchStudy&&batchStudy.kpId===id&&batchStudy.answers.length<batchStudy.ids.length?'<p><a class="btn sm" href="#/practice-round/'+id+'">继续上次练习 →</a></p>':'')
    +'<details class="batch-examples"><summary>学习本课例句 · '+kp.examples.length+' 句</summary>'+kp.examples.map(function(e){return '<div class="ex-item"><p lang="fr">'+esc(e.fr)+'</p><p>'+esc(e.en)+'</p></div>';}).join('')+'</details><p><a href="#/prelearn/'+id+'">打开完整讲解与引导练习 →</a></p>'
    +(history.length?'<p class="small">最近完成 '+history.length+' 轮专项（全站保留最近 20 轮），结果与语法掌握度分开记录。</p>':'')+'</div>';
  document.querySelectorAll('[data-batch-start]').forEach(function(button){button.onclick=function(){startBatchPractice(id,button.dataset.batchStart);};});
}
function batchShuffle(items){const out=items.slice();for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function startBatchPractice(id,mode){
  const pool=batchCatalog.items.filter(function(i){return i.kpIds.includes(id);});let selected;
  if(mode==='check'){
    const seeds=batchShuffle(pool.filter(function(i){return i.kind==='seed';})),forms=batchShuffle(pool.filter(function(i){return i.kind==='form';}));
    selected=batchShuffle(seeds.slice(0,forms.length?4:8).concat(forms.slice(0,4)));
  }else selected=batchShuffle(pool.filter(function(i){return i.kind===mode;})).slice(0,8);
  if(!selected.length){toast('此知识点暂无这类练习。');return;}
  batchStudy={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9),buildId:batchCatalog.buildId,answerMode:answerMode(),kpId:id,mode,ids:selected.map(function(i){return i.id;}),answers:[],recorded:false};state.batchStudy=batchStudy;saveState();navigate('#/practice-round/'+id);
}
function batchMatch(item,given,mode){return item.type==='choice'?{accepted:given===item.answer,status:given===item.answer?'exact':'incorrect'}:Engine.matchAnswer(item,given,mode||answerMode());}
function renderBatchRound(id){
  if(!batchCatalog){batchLoading(function(){renderBatchRound(id);});return;}restoreBatchStudy();
  if(!batchStudy||batchStudy.kpId!==id){app.innerHTML='<div class="container"><div class="empty">没有可继续的本轮练习。内容更新后请重新开一轮。<a href="#/practice-point/'+esc(id)+'">回到知识点</a></div></div>';return;}
  const study=batchStudy;if(study.answers.length===study.ids.length){renderBatchResult();return;}
  const index=study.answers.length,item=batchIndex[study.ids[index]],kp=KP_BY_ID[id];
  app.innerHTML='<div class="container batch-round"><a class="small" href="#/practice-point/'+id+'">← 暂停并返回知识点</a><div class="page-head"><span class="studio-eyebrow">'+esc(batchLabel(item.kind))+' · '+(index+1)+' / '+study.ids.length+'</span><h1>'+esc(zhOf(kp)||kp.title)+'</h1><p>完成本轮后统一查看答案与解释。</p></div>'
    +(item.passage?'<div class="batch-passage" lang="fr">'+esc(item.passage)+'</div>':'')+'<div class="kwiz-prompt batch-prompt">'+esc(item.prompt)+'</div>'
    +(item.kind==='form'?'<dl class="batch-spec"><div><dt>动词</dt><dd lang="fr">'+esc(item.inf)+'</dd></div><div><dt>时态 / 语式</dt><dd>'+esc(item.tense)+'</dd></div><div><dt>主语 / 人称</dt><dd lang="fr">'+esc(item.person)+'</dd></div></dl>':'')
    +wordSupportHtml(kp,item)
    +(item.translation?'<p>'+esc(item.translation)+'</p>':'')
    +'<form id="batchAnswerForm">'+(item.type==='choice'?'<fieldset class="batch-options"><legend>选择一个答案</legend>'+item.options.map(function(option,i){return '<label><input type="radio" name="batchChoice" value="'+i+'" required><span>'+esc(option)+'</span></label>';}).join('')+'</fieldset>':'<label>你的答案<input id="batchAnswer" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="2000" required></label>'+accentBarHtml('batchAnswer'))+'<button class="btn" type="submit">'+(index+1===study.ids.length?'提交并查看结果':'保存答案 · 下一题')+'</button></form></div>';
  wireAccentBars();const input=document.getElementById('batchAnswer');if(input)input.focus();
  document.getElementById('batchAnswerForm').onsubmit=function(event){event.preventDefault();if(study!==batchStudy||study.answers.length!==index)return;const chosen=document.querySelector('input[name="batchChoice"]:checked');const given=item.type==='choice'?(chosen?item.options[Number(chosen.value)]:''):input.value.trim();if(!given)return;study.answers.push(given);state.batchStudy=study;saveState();renderBatchRound(id);scrollTo(0,0);};
}
function renderBatchResult(){
  const study=batchStudy,items=study.ids.map(function(id){return batchIndex[id];});
  const results=items.map(function(item,i){return batchMatch(item,study.answers[i],study.answerMode);});
  const summary=['seed','form','recall'].filter(function(kind){return items.some(function(i){return i.kind===kind;});}).map(function(kind){const group=items.map(function(item,i){return {item,match:results[i]};}).filter(function(r){return r.item.kind===kind;});return {kind,total:group.length,correct:group.filter(function(r){return r.match.accepted;}).length};});
  if(!study.recorded){const records=Array.isArray(state.batchPractice)?state.batchPractice.filter(function(r){return r&&typeof r==='object'&&typeof r.id==='string';}):[];if(!records.some(function(r){return r.id===study.id;}))records.push({id:study.id,kpId:study.kpId,mode:study.mode,at:Date.now(),summary});state.batchPractice=records.slice(-20);study.recorded=true;state.batchStudy=study;saveState();}
  app.innerHTML='<div class="container batch-result"><div class="page-head"><span class="studio-eyebrow">CHECK THE RULE · TRY ANOTHER ROUND</span><h1>本轮核对结果</h1><p>专项结果单独保存；例句回忆不等于独立掌握，未匹配参考写法也不等于所有其他表达都错误。</p></div><div class="batch-summary">'+summary.map(function(s){return '<article><span>'+batchLabel(s.kind)+'</span><b>'+s.correct+' / '+s.total+'</b></article>';}).join('')+'</div><div class="batch-actions"><a class="btn" href="#/practice-point/'+study.kpId+'">回看规则，再练一轮 →</a><a class="btn ghost" href="#/practice-bank">选择其他知识点</a></div>'
    +items.map(function(item,i){const match=results[i];return '<article class="batch-answer-card"><h2>'+ (i+1)+'. '+(match.accepted?'✓ 已匹配':'需回顾')+' · '+batchLabel(item.kind)+'</h2><p class="batch-prompt">'+esc(item.prompt)+'</p>'+(item.inf?'<p>'+esc(item.inf)+' · '+esc(item.tense)+' · '+esc(item.person)+'</p>':'')+'<p>你的答案：<span lang="fr">'+esc(study.answers[i])+'</span></p><p>参考写法：<b lang="fr">'+esc([item.answer].concat(item.accept||[]).join(' / '))+'</b></p>'+(match.status==='accent_only'?'<p>字母匹配；请留意参考写法中的重音。</p>':'')+'<p>'+esc(item.explain)+'</p>'+(item.source.example?'<p lang="fr">完整原例句：'+esc(item.source.example)+'</p>':'')+(item.source.url?'<a href="#/verb-table/'+item.source.id+'">查看本地原版变位表 →</a>':'<a href="#/prelearn/'+study.kpId+'">回看本课讲解 →</a>')+'</article>';}).join('')+'</div>';
}
