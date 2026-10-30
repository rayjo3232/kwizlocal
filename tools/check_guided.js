/* No dependencies: node tools/check_guided.js */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../app');
const files = ['data.js', 'extra.js', 'engine.js'];
const code = files.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n;\n');
const ctx={console, Date, Math};
vm.createContext(ctx);
vm.runInContext(code+'\n;globalThis.test={Engine,KPS,KP_BY_ID,LEVELS}',ctx);
const {Engine,KPS,KP_BY_ID,LEVELS} = ctx.test;
const fresh=Engine.newState();
const first=Engine.nextNewPoint(fresh);
assert.ok(first && first.level==='A0','fresh profile must start at A0');
assert.equal(Engine.guidedLevel(fresh),'A0');
assert.equal(Engine.buildSession(fresh,10).items.length,0,'unlearned grammar must not enter guided practice');
assert.ok(Engine.planList(fresh,10).every(k=>k.level==='A0'),'study plan cannot jump to B2');
// A1 starting point may assume A0 prerequisites but may not show A0 lessons.
const a1=Engine.newState(); a1.learningLevel='A1';
assert.equal(Engine.guidedLevel(a1),'A1');
assert.equal(Engine.nextNewPoint(a1).level,'A1');
assert.ok(Engine.planList(a1,10).every(k=>k.level==='A1'));
const b2=Engine.newState(); b2.learningLevel='B2';
assert.equal(Engine.nextNewPoint(b2).level,'B2');
// A passed pre-learn does not magically add attempts or confidence.
const primed=Engine.newState();
const p=Engine.ensure(primed,first.id); p.state='primed';p.primedAt=Date.now();
assert.equal(p.n,0);
assert.equal(Engine.statusOf(primed,first),'weak');
const q=Engine.buildSession(primed,10);
assert.ok(q.items.length > 0 && q.items.every(i=>i.kpId===first.id));
assert.ok(q.items.every(i=>!KP_BY_ID[i.kpId].items.find(x=>x.id===i.itemId && x.stage==='guided')));
assert.equal(Engine.nextNewPoint(primed).id !== first.id,true,'next lesson should exclude prelearned');
const before=primed.attempts.length;
Engine.applyAttempt(primed,{kpId:first.id,itemId:q.items[0].itemId,correct:true});
assert.equal(primed.attempts.length,before+1);
// A placement test records B2 answers without introducing B2 to guided study.
const diagnosed=Engine.newState();
const difficult=KPS.find(k=>k.level==='B2');
Engine.applyAttempt(diagnosed,{kpId:difficult.id,itemId:difficult.items[2].id,correct:false,source:'placement'});
assert.equal(Engine.hasStarted(diagnosed,difficult),false,'diagnosis is not learning');
assert.equal(Engine.buildSession(diagnosed,10).items.length,0,'B2 diagnosis must not appear in A0 quiz');
assert.equal(Engine.guidedLevel(diagnosed),'A0');
assert.ok(Engine.planList(diagnosed,10).every(k=>k.level==='A0'));
// An explicitly explored B2 topic does not contaminate A0 guided review.
const explored=Engine.newState();
Engine.applyAttempt(explored,{kpId:difficult.id,itemId:difficult.items[3].id,correct:false,source:'kwiz'});
assert.equal(Engine.hasStarted(explored,difficult),true);
assert.equal(Engine.guidedEligible(explored,difficult),false);
assert.equal(Engine.buildSession(explored,10).items.length,0);
assert.equal(Engine.dueCount(explored),0);
// Started level stays restricted even after many due review points.
const advanced=Engine.newState();advanced.learningLevel='A1';
const anyB2=KPS.find(k=>k.level==='B2');
assert.equal(Engine.guidedEligible(advanced,anyB2),false);
assert.equal(Engine.buildSession(advanced,3).items.length,0);
// All strict prerequisite references should point at same or earlier level.
const order=Object.fromEntries(LEVELS.map((l,i)=>[l.id,i]));
for(const kp of KPS) for(const id of kp.prereqs){
 assert.ok(order[KP_BY_ID[id].level]<=order[kp.level],`invalid cross-level prerequisite ${kp.id} -> ${id}`);
}
console.log('Guided scheduler regression checks passed.');
