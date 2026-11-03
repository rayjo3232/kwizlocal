const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({});
for(const file of ['data.js','extra.js','foundations.js','learning-support.js'])vm.runInContext(fs.readFileSync(path.join(root,'app',file),'utf8'),ctx);
const {KPS,KP_BY_ID,LEVELS,LearningSupport,wordSupportHtml}=vm.runInContext('({KPS,KP_BY_ID,LEVELS,LearningSupport,wordSupportHtml})',ctx);
let checks=0;function check(v,m){assert.ok(v,m);checks++;}
const sample=LearningSupport.selectPlacement(KPS,LEVELS);
check(sample.length===20&&new Set(sample.map(r=>r.kpId)).size===20,'twenty distinct knowledge points');
for(const level of LEVELS){
 const refs=sample.filter(r=>KP_BY_ID[r.kpId].level===level.id);
 check(refs.length===4,'four questions per level');
 check(new Set(refs.map(r=>KP_BY_ID[r.kpId].category)).size>=3,'multiple skill areas per level');
 for(const r of refs)check(KP_BY_ID[r.kpId].items.some(i=>i.id===r.itemId&&i.stage!=='guided'),'real non-guided source');
}
const answer=f=>sample.map((r,i)=>({...r,correct:f(KP_BY_ID[r.kpId].level,i)}));
check(LearningSupport.summarize(answer(()=>true),KP_BY_ID,LEVELS).level==='B2','strong learner may start B2');
const skip=LearningSupport.summarize(answer(()=>null),KP_BY_ID,LEVELS);
check(!skip.sufficient&&skip.answered===0,'all skips produce no level evidence');
const lucky=LearningSupport.summarize(answer((l,i)=>i%4===0?true:null),KP_BY_ID,LEVELS);
check(!lucky.sufficient&&lucky.level==='A0','one lucky answer per level cannot imply B2');
check(LearningSupport.summarize(answer(l=>['A0','A1','A2'].includes(l)),KP_BY_ID,LEVELS).level==='A2','consecutive lower-level evidence supports A2');
check(LearningSupport.summarize(answer(l=>l!=='A1'),KP_BY_ID,LEVELS).level==='A0','higher hits cannot conceal lower-level gaps');
const article={type:'fill',prompt:'Ouvre ___ fenêtre de la cuisine.',answer:'la'};
const hints=LearningSupport.lexicalHints(article);
check(hints.some(h=>h.word==='fenêtre'&&h.zh==='窗户')&&hints.some(h=>h.word==='cuisine'),'content words translated');
check(!hints.some(h=>h.word==='la'),'grammar target not disclosed');
check(!LearningSupport.lexicalHints({type:'fill',prompt:'Une fleur ___ (blanc)',answer:'blanc'}).some(h=>h.word==='blanc'),'even known target lexeme excluded');
check(!LearningSupport.lexicalHints({type:'choice',prompt:'Une fleur ___ (blanc)',answer:'blanche',options:['blanc','blanche']}).some(h=>['blanc','blanche'].includes(h.word)),'option-target words excluded');
check(LearningSupport.lexicalHints({type:'correct',prompt:'只改冠词：Le chaise est près du bureau.',answer:'La chaise est près du bureau.'}).some(h=>h.word==='chaise'),'correction tasks still translate unchanged content words');
check(LearningSupport.lexicalHints({type:'fill',prompt:'Ils ___ le petit-déjeuner.',answer:'prennent'}).some(h=>h.zh==='早餐'),'compound breakfast meaning retained');
check(LearningSupport.lexicalHints({type:'fill',prompt:"Tu ___ en avance aujourd’hui.",answer:'es'}).some(h=>h.word==='aujourd’hui'&&h.zh==='今天'),'apostrophe word is shown intact');
check(wordSupportHtml({level:'A1'},article)==='','support does not change other levels');
check(wordSupportHtml({level:'A0'},article).includes('中文词汇提示'),'A0 direct visible support');
let supported=0;
for(const kp of KPS.filter(k=>k.level==='A0'))for(const item of kp.items){
 const rows=LearningSupport.lexicalHints(item);if(rows.length)supported++;
 check(new Set(rows.map(r=>r.word)).size===rows.length&&rows.every(r=>r.word&&r.zh),'deduplicated nonempty translations');
}
check(supported>120,'substantial A0 question coverage');
console.log(`${checks} learning-support checks passed; ${supported} existing A0 questions have direct Chinese vocabulary support.`);
