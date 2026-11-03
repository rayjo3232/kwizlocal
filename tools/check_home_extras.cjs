const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),storage=new Map();
const ctx=vm.createContext({localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}});
for(const file of ['data.js','home-extras.js'])vm.runInContext(fs.readFileSync(path.join(root,'app',file),'utf8'),ctx);
const {HOME_SAYINGS,HomeSayings,KP_BY_ID}=vm.runInContext('({HOME_SAYINGS,HomeSayings,KP_BY_ID})',ctx);
let checks=0;function check(v,m){assert.ok(v,m);checks++;}
check(HOME_SAYINGS.length===10&&new Set(HOME_SAYINGS.map(q=>q.id)).size===10,'ten distinct source-backed proverbs');
for(const q of HOME_SAYINGS){
 check(q.fr&&q.en&&q.zh&&q.note&&q.chunk&&q.theme,'all languages and learning notes present');
 check(/^https:\/\/(?:www\.)?dictionnaire-academie.fr\/article\/[A-Z0-9]+$/.test(q.source),'specific dictionary attestation retained');
 check(KP_BY_ID[q.kpId],'real related knowledge point');
}
let saved=null,previous=null;
for(let cycle=0;cycle<10;cycle++){
 const seen=new Set();
 for(let i=0;i<10;i++){
  saved=HomeSayings.draw(saved,()=>0);
  check(saved.last!==previous,'adjacent selections never repeat, even at cycle boundary');
  check(!seen.has(saved.last),'no repeated proverb within a complete cycle');
  seen.add(saved.last);previous=saved.last;
 }
 check(seen.size===10,'every cycle includes the whole collection');
}
for(const bad of [null,{},'bad',{last:'missing',remaining:['missing']},{last:'nid',remaining:['nid']},{last:'nid',remaining:['union','union']}]){
 const result=HomeSayings.draw(bad,()=>0.5);check(HOME_SAYINGS.some(q=>q.id===result.last)&&new Set(result.remaining).size===result.remaining.length,'corrupt rotation data recovers');
}
const first=HomeSayings.get();check(HomeSayings.get().id===first.id,'rerender does not consume a new quotation');
check(HomeSayings.next().id!==first.id,'manual refresh selects a different quotation');
check(storage.size===1&&[...storage.keys()][0]==='kwizlocal.home-sayings.v1','quote preferences isolated from learning records');
const unavailable=vm.createContext({localStorage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}});
vm.runInContext(fs.readFileSync(path.join(root,'app/home-extras.js'),'utf8'),unavailable);
check(vm.runInContext('HomeSayings.get().id !== HomeSayings.next().id',unavailable),'manual rotation works even when preferences cannot be saved');
console.log(`${checks} homepage-content checks passed.`);
