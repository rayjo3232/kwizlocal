/* Offline, deterministic compiler. Sources are trusted local JS data, not
   arbitrary user JS. Run with --check to detect stale output without writing. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const inputFiles=['app/data.js','app/extra.js','app/foundations.js','app/kwiziq-reference.js','content/pipeline-rules.json','tools/build_practice_pipeline.cjs'];
const ctx=vm.createContext({});
for(const f of inputFiles.filter(f=>f.endsWith('.js')))vm.runInContext(read(f),ctx,{filename:f});
const kps=vm.runInContext('KPS',ctx),reference=ctx.KWIZIQ_REFERENCE,rules=JSON.parse(read('content/pipeline-rules.json'));
const known=new Set(kps.map(k=>k.id));
for(const id of [...Object.keys(rules.present),...Object.values(rules.tenses)])if(!known.has(id))throw Error('Unknown configured point '+id);
const items=[],byId=new Map(),rejected=[];
const norm=s=>String(s).normalize('NFC').replace(/[’‘]/g,"'").toLowerCase().replace(/\s+/g,' ').trim();
function add(item){
  if(!item.answer||!item.kpIds.length||item.kpIds.some(id=>!known.has(id)))throw Error('Incomplete item');
  const existing=byId.get(item.id);
  if(existing){existing.kpIds=[...new Set(existing.kpIds.concat(item.kpIds))];return;}
  byId.set(item.id,item);items.push(item);
}
function reject(source,reason){rejected.push({source,reason});}
for(const kp of kps){
  // Curated seeds are reused with their original task type and provenance.
  // They are counted separately and are never presented as newly authored.
  for(const it of kp.items){
    if(!['choice','fill','correct'].includes(it.type)||typeof it.answer!=='string'||!it.explain){reject(it.id,'invalid_seed');continue;}
    if(it.type==='choice'&&(!Array.isArray(it.options)||it.options.filter(o=>o===it.answer).length!==1)){reject(it.id,'ambiguous_seed_options');continue;}
    add({id:'seed.'+it.id,kind:'seed',kpIds:[kp.id],type:it.type,prompt:it.prompt,answer:it.answer,accept:it.accept||[],options:it.options,passage:it.passage||null,explain:it.explain,source:{file:it.foundation?'app/foundations.js':/\.x\d+$/.test(it.id)?'app/extra.js':'app/data.js',itemId:it.id}});
  }
  // Recall is explicitly reconstruction of an existing lesson example, not
  // an unseen assessment. Only target strings already used by this lesson
  // are eligible; no POS guess or broad category-to-point inference.
  const targets=[...new Set(kp.items.filter(i=>i.type==='fill').map(i=>i.answer).filter(a=>typeof a==='string'&&a.length<=40&&a.trim()))].sort((a,b)=>b.length-a.length);
  for(const example of kp.examples){
    const source='example.'+hash(kp.id+'\0'+example.fr).slice(0,20);
    if(!example.fr||!example.en){reject(source,'incomplete_example');continue;}
    let match=null;
    for(const target of targets){
      const escaped=target.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/[’‘']/g,"[’‘']");
      const regex=new RegExp('(?<![\\p{L}\\p{M}])'+escaped+'(?![\\p{L}\\p{M}])','giu');
      const hits=[...example.fr.matchAll(regex)];
      if(hits.length===1){match=hits[0];break;}
    }
    if(!match){reject(source,'no_unique_known_target');continue;}
    const cloze=example.fr.slice(0,match.index)+'____'+example.fr.slice(match.index+match[0].length);
    add({id:source,kind:'recall',kpIds:[kp.id],type:'fill',prompt:'例句回忆：按本课原例句补全参考写法。\n'+cloze,translation:example.en,answer:match[0],accept:[],explain:kp.rule,source:{file:'app/data.js',example:example.fr,translation:example.en}});
  }
}
for(const verb of reference.verbs.filter(v=>v.status==='ready')){
  const inf=decodeURIComponent(verb.url.split('/').pop());
  for(const block of verb.blocks){
    for(let row=0;row<block.forms.length;row++){
      const f=block.forms[row],source=verb.id+':'+block.title+':'+row;
      let answer=f.form,person=f.person;
      if(block.title==="L'Impératif Présent"){
        const m=/^\((tu|nous|vous)\s+form\)$/.exec(f.form);
        if(!m){reject(source,'not_applicable_or_unsupported_imperative');continue;}
        person=m[1];answer=f.person;
      }
      let ids=[];
      if(block.title==='Le Présent (Indicatif)')ids=Object.keys(rules.present).filter(id=>rules.present[id].includes(inf));
      else if(block.title==='Le Passé Composé (Indicatif)'){
        if(/^(ai|as|a|avons|avez|ont) /.test(answer))ids=['a2.passe_compose.avoir'];
        else if(/^(suis|es|est|sommes|êtes|sont) /.test(answer))ids=['a2.passe_compose.etre'];
      }else if(rules.tenses[block.title])ids=[rules.tenses[block.title]];
      if(!ids.length){reject(source,'no_precise_knowledge_mapping');continue;}
      // Expand only the source's explicit e/s agreement notation. Other
      // parenthetical notes, slash alternatives and missing forms stay out.
      let answers=[answer];
      for(const suffix of ['(e)','(s)'])answers=answers.flatMap(a=>a.includes(suffix)?[a.replace(suffix,''),a.replace(suffix,suffix[1])]:[a]);
      answers=[...new Set(answers)];
      if(!person||answers.some(a=>!a||! /^[\p{L}\p{M}'’ -]+$/u.test(a))){reject(source,'unsupported_variant_notation');continue;}
      const id='form.'+hash(verb.url+'\0'+block.title+'\0'+row+'\0'+f.person+'\0'+f.form).slice(0,20);
      add({id,kind:'form',kpIds:ids,type:'fill',prompt:'按指定时态变位，只写变位部分，不写主语或 que。',inf,tense:block.title,person,answer:answers[0],accept:answers.slice(1),explain:'动词 '+inf+'；'+block.title+'；主语 '+person+'。参考表写法：'+answer+'。括号式性数变化的明确写法均接受。',source:{file:'app/kwiziq-reference.js',id:verb.id,url:verb.url,block:block.title,row,person:f.person,form:f.form}});
    }
  }
}
const inputHashes=Object.fromEntries(inputFiles.map(f=>[f,hash(read(f).replace(/\r\n/g,'\n'))]));
const points=kps.map(kp=>({id:kp.id,level:kp.level,title:kp.title,counts:Object.fromEntries(['seed','recall','form'].map(kind=>[kind,items.filter(i=>i.kind===kind&&i.kpIds.includes(kp.id)).length]))}));
const counts=Object.fromEntries(['seed','recall','form'].map(kind=>[kind,items.filter(i=>i.kind===kind).length]));
const data={schemaVersion:1,buildId:hash(JSON.stringify(inputHashes)).slice(0,16),inputHashes,counts,points,items};
const report={schemaVersion:1,buildId:data.buildId,inputHashes,counts,totalItems:items.length,processedPoints:points.length,newItemPoints:points.filter(p=>p.counts.form+p.counts.recall>0).length,points,rejectionCounts:rejected.reduce((o,r)=>(o[r.reason]=(o[r.reason]||0)+1,o),{}),rejected};
for(const [file,body] of [['app/generated-practice.js','/* Deterministically generated by tools/build_practice_pipeline.cjs. */\nglobalThis.GENERATED_PRACTICE = '+JSON.stringify(data)+';\n'],['content/pipeline-report.json',JSON.stringify(report,null,2)+'\n']]){
  if(process.argv.includes('--check')){if(!fs.existsSync(path.join(root,file))||read(file).replace(/\r\n/g,'\n')!==body)throw Error('Stale generated output: '+file);}
  else fs.writeFileSync(path.join(root,file),body,'utf8');
}
console.log(JSON.stringify({buildId:data.buildId,processedPoints:points.length,newItemPoints:report.newItemPoints,counts,rejections:report.rejectionCounts},null,2));
