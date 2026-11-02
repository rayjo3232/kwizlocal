const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({});
vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../app/kwiziq-themes.js'),'utf8'),ctx);
const data=ctx.KWIZIQ_THEMES;
let checks=0;
function check(ok,message){assert.ok(ok,message);checks++;}
check(data.total===228&&data.themes.length===data.total,'all directory entries are accounted for');
check(new Set(data.themes.map(t=>t.id)).size===data.total,'unique theme ids');
const unavailable=new Set(['11310282','11310472','241']);
let imported=0,entries=0;
for(const theme of data.themes){
 check(/^https:\/\/french\.kwiziq\.com\/learn\/theme\/\d+$/.test(theme.url)&&theme.url.endsWith('/'+theme.id),'source and stable id');
 check(['A0','A1','A2','B1','B2','C1'].includes(theme.level),'known source level');
 if(theme.status!=='ready'){
  check(unavailable.has(theme.id)&&theme.error.includes('404'),'unavailable links are verified upstream 404s, not silent imports');
  check(!theme.entries,'unavailable themes have no invented vocabulary');continue;
 }
 imported++;entries+=theme.entries.length;
 check(theme.entries.length>0&&theme.rawRows>=theme.entries.length,'nonempty complete vocabulary rows');
 check(new Set(theme.entries.map(e=>e.id)).size===theme.entries.length,'deduplicated pair ids');
 check(/^[a-f0-9]{64}$/.test(theme.rawSha256)&&!isNaN(Date.parse(theme.fetchedAt)),'download provenance');
 for(const entry of theme.entries){check(entry.fr.trim()&&entry.en.trim()&&/^[a-f0-9]{16}$/.test(entry.id),'complete bilingual entry');}
}
check(imported===data.imported&&entries===data.entryCount,'manifest counts agree with imported content');
console.log(`${checks} theme archive checks passed: ${imported}/${data.total} themes, ${entries} bilingual entries, ${data.total-imported} documented upstream 404s.`);
