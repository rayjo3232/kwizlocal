const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../app/kwiziq-reference.js'),'utf8'),context);
const data=context.KWIZIQ_REFERENCE;
let checks=0,forms=0,blocks=0;
function check(value,message){assert.ok(value,message);checks++;}
check(data.glossary.length===152&&data.verbs.length===100,'complete public directory manifests');
for(const kind of ['glossary','verbs']){
  check(new Set(data[kind].map(r=>r.id)).size===data[kind].length,'unique stable reference ids');
  for(const row of data[kind]){
    check(/^[a-f0-9]{16}$/.test(row.id)&&row.url.startsWith('https://french.kwiziq.com/revision/'),'known source and stable identity');
    if(row.status!=='ready'){
      check((kind==='glossary'&&row.error==='Empty glossary definition')||(kind==='verbs'&&row.url.endsWith('/rougir')&&row.error==='Missing conjugation tables'),'only verified empty or redirected upstream pages are unavailable');
      check(!row.html&&!row.blocks,'unavailable pages contain no invented content');continue;
    }
    check(/^[a-f0-9]{64}$/.test(row.rawSha256)&&!isNaN(Date.parse(row.fetchedAt)),'provenance retained');
    check(!/<(?:script|iframe|form|audio|video|input)\b|\son\w+=|javascript:|data-audio-/i.test(row.html+(row.relatedHtml||'')),'remote content is inert');
    check(!row.html.includes('\ufffd')&&!row.title.includes('\ufffd'),'no replacement characters in learning content');
    if(kind==='glossary')check(row.text.length>=30&&typeof row.subtitle==='string','nonempty definition and source classification');
    else{
      check(row.blocks.length>=7,'source tenses are present');blocks+=row.blocks.length;
      check(new Set(row.blocks.map(b=>b.title)).size===row.blocks.length,'no duplicated tense blocks');
      for(const b of row.blocks){
        check(b.title&&b.forms.length>0,'named nonempty tense block');
        for(const f of b.forms){check((f.person||(row.url.endsWith('/pouvoir')&&b.title.includes('Impératif')&&f.form==='(n/a form)'))&&f.form&&!f.form.includes('\ufffd'),'complete conjugation row or explicit source n/a');forms++;}
      }
    }
  }
}
const arriver=data.verbs.find(r=>r.url.endsWith('/arriver'));
check(arriver.blocks.some(b=>b.forms.some(f=>f.form==='suis arrivé(e)')),'gender alternatives preserved literally');
check(arriver.blocks.some(b=>b.title.includes('Impératif'))&&arriver.blocks.some(b=>b.title.includes('Subjonctif Passé')),'expanded moods available');
for(const [legacy,url] of Object.entries(data.aliases||{}))check(/^https:\/\/french.kwiziq.com\/(?:my-languages\/french\/glossary\/\d+|revision\/grammar\/verbs\/[^/]+)$/.test(legacy)&&url.startsWith('https://french.kwiziq.com/revision/'),'aliases use verified public canonical paths');
check(Object.keys(data.aliases||{}).length>=100,'legacy archive links resolved');
console.log(`${checks} reference archive checks passed: ${data.glossary.filter(r=>r.status==='ready').length}/152 glossary definitions, ${data.verbs.filter(r=>r.status==='ready').length}/100 verbs, ${blocks} tense blocks, ${forms} forms.`);
