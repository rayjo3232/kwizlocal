const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync(path.resolve(__dirname, '../app/kwiziq-lessons.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(code, context);
const archive = context.KWIZIQ_ARCHIVE;
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; }
check(archive.schemaVersion === 1 && archive.total === archive.lessons.length, 'archive schema and directory count');
check(archive.imported === archive.total && archive.lessons.every(l => l.status === 'ready'), 'all directory lessons were imported');
check(new Set(archive.lessons.map(l => l.id)).size === archive.total && new Set(archive.lessons.map(l => l.url)).size === archive.total, 'unique identifiers and canonical sources');
const levels = {};
let examples = 0, localLinks = 0;
for (const lesson of archive.lessons) {
  levels[lesson.level] = (levels[lesson.level] || 0) + 1;
  examples += lesson.examples.length;
  check(/^https:\/\/french\.kwiziq\.com\/revision\/grammar\//.test(lesson.url), lesson.id + ': original source');
  check(lesson.html.length > 120 && lesson.text.length > 120 && lesson.title.length > 5, lesson.id + ': actual lesson content');
  check(/^[a-f0-9]{64}$/.test(lesson.rawSha256) && !isNaN(Date.parse(lesson.fetchedAt)), lesson.id + ': content provenance');
  check(!/<\/?(?:script|style|iframe|object|embed|img|audio|video|form|button|svg|input)\b/i.test(lesson.html), lesson.id + ': no executable or remote-media elements');
  check(!/<[^>]+\s(?:on[a-z]+|style|src|srcdoc|data-[a-z-]+)\s*=/i.test(lesson.html), lesson.id + ': no scripts, styling or tracking attributes');
  for (const match of lesson.html.matchAll(/href="([^"]+)"/g)) {
    check(/^https:\/\//.test(match[1]) || /^#\/source\/[a-f0-9]{16}$/.test(match[1]), lesson.id + ': safe link');
    if (match[1].startsWith('#/source/')) {
      localLinks++;
      check(archive.lessons.some(l => '#/source/' + l.id === match[1] && l.status === 'ready'), lesson.id + ': offline link resolves');
    }
  }
  check(lesson.examples.every(e => e.length === 2 && e.every(s => typeof s === 'string' && s.length)), lesson.id + ': bilingual example pairs');
}
check(['A0','A1','A2','B1','B2','C1'].every(level => levels[level] > 0), 'all six directory levels present');
console.log(`${checks} archive checks passed: ${archive.total} lessons, ${examples} example pairs, ${localLinks} offline links.`);
console.log(JSON.stringify(levels));
