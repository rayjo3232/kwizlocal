const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({});
for(const f of ['data.js','extra.js','foundations.js','answer-matcher.js','kwiziq-reference.js','generated-practice.js'])vm.runInContext(fs.readFileSync(path.join(root,'app',f),'utf8'),ctx);
const {KPS,AnswerMatch}=vm.runInContext('({KPS,AnswerMatch})',ctx),data=ctx.GENERATED_PRACTICE,ref=ctx.KWIZIQ_REFERENCE;
const report=JSON.parse(fs.readFileSync(path.join(root,'content/pipeline-report.json'),'utf8'));
let checks=0;function check(value,message){assert.ok(value,message);checks++;}
check(data.points.length===162&&report.processedPoints===162,'all existing points processed');
check(data.items.length===data.counts.seed+data.counts.form+data.counts.recall&&data.items.length===report.totalItems,'honest distinct totals');
check(data.counts.seed===1334&&data.counts.form>10000&&data.counts.recall>200,'existing seeds and genuinely derived tasks separated');
check(new Set(data.items.map(i=>i.id)).size===data.items.length,'globally unique stable ids');
for(const p of data.points){
  check(KPS.some(k=>k.id===p.id)&&p.counts.seed>0,'every real point has existing practice');
  for(const kind of ['seed','form','recall'])check(p.counts[kind]===data.items.filter(i=>i.kind===kind&&i.kpIds.includes(p.id)).length,'per-point coverage reconciles');
}
for(const item of data.items){
  check(item.answer&&item.explain&&item.kpIds.length&&item.kpIds.every(id=>KPS.some(k=>k.id===id)),'complete point-linked task');
  if(item.type==='choice')check(item.options.includes(item.answer)&&new Set(item.options).size===item.options.length,'choice retains actual options');
  else{
    check(AnswerMatch.matchItem(item,item.answer,'strict').accepted,'reference answer is accepted');
    check(!AnswerMatch.matchItem(item,'xyz NOT AN ANSWER','lenient').accepted,'unrelated answer rejected');
    for(const answer of item.accept)check(AnswerMatch.matchItem(item,answer,'strict').accepted,'each explicit alternative accepted');
  }
  if(item.kind==='seed'){
    const original=KPS.flatMap(k=>k.items).find(i=>i.id===item.source.itemId);
    check(original&&original.type===item.type&&original.prompt===item.prompt&&original.answer===item.answer,'seed preserves original task and answer');
    check(item.source.file===(original.foundation?'app/foundations.js':/\.x\d+$/.test(original.id)?'app/extra.js':'app/data.js'),'seed provenance correct');
  }else if(item.kind==='recall'){
    const example=KPS.find(k=>k.id===item.kpIds[0]).examples.find(e=>e.fr===item.source.example);
    check(example&&example.en===item.translation,'recall anchored to actual bilingual example');
    const sentence=item.prompt.split('\n').slice(1).join('\n');
    check(sentence.split('____').length===2&&sentence.replace('____',item.answer)===example.fr,'one blank exactly reconstructs source');
  }else{
    const verb=ref.verbs.find(v=>v.id===item.source.id),block=verb.blocks.find(b=>b.title===item.source.block),row=block.forms[item.source.row];
    check(row.person===item.source.person&&row.form===item.source.form&&verb.url===item.source.url,'form anchored to exact source row');
    check(item.prompt.includes('不写主语')&&item.inf&&item.person&&item.tense,'task explicitly constrains person and tense');
    check([item.answer,...item.accept].every(a=>!/\(|\)|\/|n\/a/.test(a)),'no unresolved table notation used as an answer');
  }
}
const arrive=data.items.find(i=>i.kind==='form'&&i.inf==='arriver'&&i.tense==='Le Passé Composé (Indicatif)'&&i.person==='je');
check(arrive&&[arrive.answer,...arrive.accept].includes('suis arrivée')&&[arrive.answer,...arrive.accept].includes('suis arrivé'),'gender variants both accepted');
const imperative=data.items.find(i=>i.kind==='form'&&i.inf==='arriver'&&i.tense==="L'Impératif Présent"&&i.person==='tu');
check(imperative&&imperative.answer==='arrive','imperative form/person columns interpreted correctly');
check(!data.items.some(i=>i.kind==='form'&&i.inf==='pouvoir'&&i.tense.includes('Impératif')),'inapplicable imperative never generated');
check(report.newItemPoints===data.points.filter(p=>p.counts.form+p.counts.recall>0).length,'new coverage never conflated with existing seed coverage');
check(report.rejected.length===Object.values(report.rejectionCounts).reduce((a,b)=>a+b,0),'every rejected candidate has an accounted reason');
console.log(`${checks} practice-pipeline checks passed: ${data.counts.form} forms, ${data.counts.recall} example recalls, ${data.counts.seed} existing seeds, ${report.newItemPoints}/162 points with additions.`);
