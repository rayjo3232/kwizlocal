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
/* ---- CURR-002: the same answer from Learn, Plan and Quiz ---- */
function scopeOf(state) {
  const lesson = Engine.nextNewPoint(state);
  const plan = Engine.planList(state, 10);
  const items = Engine.buildSession(state, 10).items;
  return {
    lesson: lesson ? lesson.id : null,
    lessonLevel: lesson ? lesson.level : null,
    planIds: plan.map(k => k.id),
    itemKps: items.map(i => i.kpId)
  };
}

/* A brand-new A0 profile: lesson, plan and quiz must all sit in A0. */
{
  const s = Engine.newState();
  const o = scopeOf(s);
  assert.equal(o.lessonLevel, 'A0');
  assert.ok(o.planIds.every(id => KP_BY_ID[id].level === 'A0'), 'A0 plan leaked a higher level');
  assert.equal(o.itemKps.length, 0, 'nothing introduced yet, so nothing to quiz');
}

/* Starting at A1 must not open with a reading passage just because reading
   points have no prerequisites. */
for (const mode of ['manual', 'placement']) {
  const s = Engine.newState();
  if (mode === 'manual') s.learningLevel = 'A1'; else s.placement = { level: 'A1', at: Date.now() };
  const first = Engine.nextNewPoint(s);
  assert.equal(first.level, 'A1', mode + ': should start in A1');
  assert.notEqual(first.category, 'reading', mode + ': a passage must not be the first lesson');
  const grammarFirst = KPS.filter(k => k.level === 'A1' && k.category !== 'reading' && Engine.prereqReady(s, k));
  assert.ok(grammarFirst.length > 0, mode + ': A1 should offer grammar lessons');
}

/* A diagnosed B2 point must never surface in A1 guided work. */
{
  const s = Engine.newState();
  s.learningLevel = 'A1';
  const b2 = KPS.find(k => k.level === 'B2');
  Engine.applyAttempt(s, { kpId: b2.id, itemId: b2.items[2].id, correct: true, source: 'placement' });
  const o = scopeOf(s);
  assert.ok(o.planIds.every(id => KP_BY_ID[id].level !== 'B2'), 'B2 diagnosis reached the plan');
  assert.equal(o.itemKps.length, 0, 'B2 diagnosis produced practice items');
}

/* A migrated profile keeps both its history and its ceiling. */
{
  const s = Engine.migrateState({
    version: 1,
    learningLevel: 'A1',
    kps: { [KPS.find(k => k.level === 'A1').id]: { p: 0.7, n: 4, correct: 3, wrong: 1 } },
    attempts: [{ itemId: KPS.find(k => k.level === 'A1').items[2].id, kpId: KPS.find(k => k.level === 'A1').id, correct: true, at: Date.now() }]
  });
  assert.ok(s, 'a v1 profile should migrate');
  assert.equal(s.version, Engine.STATE_VERSION);
  const o = scopeOf(s);
  assert.ok(o.itemKps.length > 0, 'migrated history should unlock practice');
  assert.ok(o.itemKps.every(id => KP_BY_ID[id].level === 'A1'), 'migration let a higher level through');
}

/* After a pre-learn pass, Learn / Plan / Quiz agree on the same point. */
{
  const s = Engine.newState();
  s.learningLevel = 'A1';
  const first = Engine.nextNewPoint(s);
  const rec = Engine.ensure(s, first.id);
  rec.state = 'primed';
  const o = scopeOf(s);
  assert.ok(o.itemKps.length > 0, 'a primed lesson should open practice');
  assert.ok(o.itemKps.every(id => id === first.id), 'practice should stay on the introduced lesson');
  assert.ok(o.planIds.indexOf(first.id) >= 0, 'the plan should include the introduced lesson');
  assert.notEqual(o.lesson, first.id, 'the next lesson should move past the introduced one');
  assert.equal(rec.n, 0, 'pre-learn must not fabricate attempts');
}

/* The level-up heuristic never skips a level without evidence. */
{
  const s = Engine.newState();
  assert.equal(Engine.guidedLevel(s), 'A0');
  /* Half of A0 mastered is not enough. */
  const a0 = KPS.filter(k => k.level === 'A0');
  a0.slice(0, Math.floor(a0.length / 2)).forEach(k => {
    const r = Engine.ensure(s, k.id);
    r.p = 0.95; r.n = 5; r.correct = 5; r.wrong = 0;
  });
  assert.equal(Engine.guidedLevel(s), 'A0', 'level-up fired too early');
  a0.forEach(k => {
    const r = Engine.ensure(s, k.id);
    r.p = 0.95; r.n = 5; r.correct = 5; r.wrong = 0;
  });
  assert.equal(Engine.guidedLevel(s), 'A1', 'level-up should fire at 75% coverage');
}

/* When nothing is available, say why instead of picking something at random. */
{
  const s = Engine.newState();
  const look = Engine.practiceOutlook(s);
  assert.equal(look.canPractise, false);
  assert.equal(look.reason, 'nothing-introduced');
  assert.ok(look.nextLesson, 'the outlook should name the next lesson');
  assert.equal(Engine.buildSession(s, 10).items.length, 0, 'must not fall back to a random session');
}

console.log('Guided scheduler regression checks passed.');
