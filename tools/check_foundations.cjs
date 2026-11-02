/* Validate the content loaded by browsers, including assessment matching. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../app');
const code = ['data.js','extra.js','foundations.js','answer-matcher.js','curriculum.js','engine.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;');
const ctx = vm.createContext({ console });
vm.runInContext(code + '\n;globalThis.test = {FOUNDATIONS,KP_BY_ID,Engine};', ctx);
const { FOUNDATIONS, KP_BY_ID, Engine } = ctx.test;
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; }
check(Object.keys(FOUNDATIONS).length === 10, 'ten authored foundation lessons');
for (const [id, lesson] of Object.entries(FOUNDATIONS)) {
  check(lesson.goal && lesson.steps.length === 3 && lesson.worked.length === 2, id + ': complete teaching sequence');
  check(lesson.items.length === 6 && [0,1,2].every(skill => lesson.items.filter(i => i.skill === skill).length === 2), id + ': balanced six-question assessment');
  check(lesson.items.filter(i => i.type === 'choice').length === 2 && lesson.items.filter(i => i.type === 'fill').length === 2 && lesson.items.filter(i => i.type === 'correct').length === 2, id + ': three actual task types');
  check(KP_BY_ID[id].items.filter(i => i.foundation).length === 6, id + ': questions reach the real practice pool');
  for (const item of lesson.items) {
    check(KP_BY_ID[id].items.filter(i => i.id === item.id).length === 1, item.id + ': stable unique id');
    check(item.stage === 'kwiz' && !item.hint && item.explain.length > 15, item.id + ': independent question with explanatory feedback');
    if (item.type === 'choice') {
      check(item.options.filter(o => o === item.answer).length === 1 && item.options.filter(o => o !== item.answer).every(o => item.distract[o]), item.id + ': every distractor has a reason');
    } else {
      check(Engine.matchAnswer(item, item.answer, 'strict').accepted, item.id + ': reference answer passes strict checking');
      check(!Engine.matchAnswer(item, 'xyz', 'lenient').accepted, item.id + ': nonsense rejected');
      if (item.type === 'correct') {
        const original = item.prompt.split('：')[1];
        check(original && !Engine.matchAnswer(item, original, 'lenient').accepted, item.id + ': original grammar error cannot pass as a typo');
      }
    }
  }
}
console.log(checks + ' foundation-content checks passed (10 lessons, 60 new questions).');
