/* Run: node tools/smoke_studio.cjs
   Requires Playwright (npm install --prefix .dev playwright) and its Chromium.
   Uses an isolated browser profile and local server; never touches user data. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(require.resolve('playwright', { paths: [path.resolve(__dirname, '../.dev'), __dirname] }));
const root = path.resolve(__dirname, '../app');
const output = path.resolve(__dirname, '../.dev');
const currentRelease = require('node:vm').runInNewContext(fs.readFileSync(path.join(root, 'release.js'), 'utf8') + '\nRELEASE');
const futureRelease = { ...currentRelease, id: currentRelease.id + '-test-next', version: String(Number(currentRelease.version) + 1) };
const versionLabel = release => 'V' + release.version + ' · 更新说明';
let nextRelease = false;
const server = http.createServer((req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try {
    let body = fs.readFileSync(file);
    if (nextRelease && name === '/release.js') body = Buffer.from('const RELEASE = ' + JSON.stringify(futureRelease) + ';');
    res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.png':'image/png'})[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(body);
  } catch (_) { res.writeHead(404).end(); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let checks = 0;
  function check(value, message) { assert.ok(value, message); checks++; }
  try {
    await page.goto(url);
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await page.locator('#versionChip').waitFor();
    check(await page.locator('#versionChip').innerText() === versionLabel(currentRelease), 'release identity');
    await page.locator('.release-card summary').click();
    check(await page.locator('.release-card li').count() === 3, 'visible release notes');
    await page.locator('.release-card summary').click();
    await page.screenshot({ path: path.join(output, 'studio-desktop.png') });
    check(await page.locator('.route-step:disabled').count() === 2, 'new learner cannot review unseen content');
    check(await page.locator('.practice-metric b').allTextContents().then(values => values.every(v => v === '—')), 'empty practice history never claims zero accuracy');
    check(await page.locator('.todaybar .goal-num').innerText().then(t => t.includes('/ 10')), 'daily goal has a denominator');

    await page.evaluate(() => {
      state.translate = { done: 4, totalPct: 230 };
      state.sentences = { articles: { seen: 2, correct: 1 }, negation: { seen: 10, correct: 9 } };
      renderDashboard();
    });
    const report = await page.evaluate(() => {
      const before = JSON.stringify(state); const report = practiceReport();
      return { report, unchanged: before === JSON.stringify(state) };
    });
    check(report.unchanged && report.report.translationPct === 58 && report.report.sentencePct === 83, 'lifetime reports are weighted and read-only');
    await page.locator('.practice-tags summary').click();
    check(await page.locator('.practice-tag-row').first().innerText().then(t => t.includes('Articles')), 'lower accuracy context comes first');
    await page.locator('.practice-history').screenshot({ path: path.join(output, 'compass-progress.png') });
    await page.locator('[data-practice-tag="articles"]').click();
    await page.locator('#sentStart').waitFor();
    check(await page.evaluate(() => sentTag === 'articles' && sentLevel === 'all'), 'tag practice link sets the filter');

    await page.goto(url + '#/translate');
    await page.locator('#trInput').fill(await page.evaluate(() => trDrill.queue[0].fr));
    await page.locator('#trCheck').click();
    check(await page.evaluate(() => practiceReport().translationDone === 5 && practiceReport().translationPct === 66), 'translation answers update the lifetime report');
    await page.locator('#trNext').click();
    await page.locator('#trReveal').click();
    check(await page.evaluate(() => practiceReport().translationDone === 6 && practiceReport().translationPct === 55), 'reveals lower the average with a zero attempt');
    await page.goto(url + '#/sentences');
    await page.locator('#sentStart').waitFor();
    await page.evaluate(() => {
      const item = sentenceBank().find(s => s[5] === 'gap');
      sentDrill = { queue: [item], index: 0, correct: 0, wrong: 0, checked: null, picked: null, chosen: [] };
      renderSentDrill();
    });
    const blank = await page.evaluate(() => sentDrill.queue[0][3]);
    await page.locator('[data-sd]').filter({ hasText: blank }).filter({ visible: true }).first().click();
    check(await page.evaluate(() => practiceReport().sentenceSeen === 13), 'sentence answers update the lifetime report');
    await page.goto(url + '#/');
    await page.locator('.practice-tags summary').click();
    await page.locator('[data-practice-tag="articles"]').click();
    await page.locator('#sentResume').waitFor();
    check(await page.locator('#sentResume').count() === 1 && await page.locator('#sentStart').count() === 1, 'filter navigation preserves suspended practice and opens the overview');
    await page.locator('#sentResume').click();
    check(await page.locator('#sdNext').count() === 1, 'suspended sentence answer can be resumed');
    await page.evaluate(() => { state.translate = { done: 0, totalPct: 0 }; state.sentences = {}; trDrill = null; sentDrill = null; saveState(); });

    await page.evaluate(() => {
      window.beforeNotebookTest = JSON.parse(JSON.stringify(state));
      state.notebook = { items: [], kps: [] };
      const points = [KP_BY_ID['a0.articles.definite'], KP_BY_ID['a1.negation.ne_pas']];
      points.forEach((kp, index) => kp.items.slice(0, index ? 2 : 6).forEach(item => Engine.noteWrong(state, item.id, kp.id)));
      state.notebook.items.forEach((note, index) => { note.lastAt = 1000 + index; });
      state.notebook.items[0].wrong = 4;
      state.notebook.items[7].resolved = true;
      saveState();
    });
    await page.goto(url + '#/notebook');
    await page.locator('#nbSearch').waitFor();
    check(await page.locator('.nb-item').count() === 7, 'notebook defaults to unresolved valid entries');
    check(await page.locator('.notebook-overview b').allTextContents().then(a => a.join(',') === '7,1,1'), 'notebook summary distinguishes repeated and resolved mistakes');
    check(await page.locator('.nb-answer[open]').count() === 0, 'notebook answers are initially hidden');
    const notebookBeforeReveal = await page.evaluate(() => JSON.stringify(state));
    await page.locator('.nb-answer summary').first().click();
    check(await page.locator('.nb-answer[open]').count() === 1 && notebookBeforeReveal === await page.evaluate(() => JSON.stringify(state)), 'revealing notebook answer does not score an attempt');
    await page.locator('#nbSearch').fill('定冠词');
    check(await page.locator('.nb-item').count() === 6, 'Chinese title search');
    check(await page.locator('#nbSearch').evaluate(el => el === document.activeElement && el.selectionStart === el.value.length), 'search preserves typing focus and caret');
    await page.locator('#nbSearch').fill('');
    check(await page.evaluate(() => {
      const input = document.getElementById('nbSearch');
      input.value = '定冠';
      input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
      return input === document.getElementById('nbSearch');
    }), 'Chinese IME composition does not replace the input');
    await page.locator('#nbSearch').dispatchEvent('compositionend');
    check(await page.locator('.nb-item').count() === 6, 'Chinese composition filters after completion');
    await page.locator('#nbSearch').fill('');
    await page.locator('#nbLevel').selectOption('A1');
    check(await page.locator('.nb-item').count() === 1, 'notebook level filter');
    await page.locator('#nbStatus').selectOption('resolved');
    check(await page.locator('.nb-item').count() === 1 && await page.locator('#nbPractiseAll').isDisabled(), 'resolved-only view never silently queues retired mistakes');
    await page.locator('#nbStatus').selectOption('all');
    check(await page.locator('.nb-item').count() === 2, 'all status includes retired history');
    await page.locator('#nbPractiseAll').click();
    await page.locator('#skipBtn').waitFor();
    check(await page.evaluate(() => session.session.items.length === 1 && session.session.items[0].kpId === 'a1.negation.ne_pas'), 'filtered batch contains only matching unresolved questions');
    await page.goto(url + '#/notebook');
    await page.locator('#nbLevel').selectOption('all');
    await page.locator('#nbStatus').selectOption('open');
    await page.locator('#nbSort').selectOption('recent');
    check(await page.locator('[data-nb-practice]').first().getAttribute('data-nb-practice') === await page.evaluate(() => state.notebook.items[6].itemId), 'recent mistake sorting');
    await page.locator('#nbSort').selectOption('missed');
    check(await page.locator('[data-nb-practice]').first().getAttribute('data-nb-practice') === await page.evaluate(() => state.notebook.items[0].itemId), 'repeated mistakes sorting');
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, 'workshop-desktop.png') });
    await page.locator('#nbPractiseAll').click();
    await page.locator('#skipBtn').waitFor();
    check(await page.evaluate(() => session.session.items.length === 5), 'notebook batches are capped at five');
    await page.goto(url + '#/notebook');
    await page.locator('#nbSearch').fill('不存在的知识点');
    check(await page.locator('.nb-item').count() === 0 && await page.locator('#nbPractiseAll').isDisabled(), 'no-match search disables practice without clearing history');
    await page.locator('#nbSearch').fill('');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile notebook fits');
    await page.screenshot({ path: path.join(output, 'workshop-mobile.png') });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url + '#/');
    await page.locator('.notebook-preview').waitFor();
    check(await page.locator('.notebook-preview h2').innerText().then(t => t.includes('7')), 'dashboard links to the pending mistake queue');
    await page.evaluate(() => { notebookView = { query: 'no-match', level: 'B2', status: 'resolved', sort: 'recent' }; });
    await page.locator('[data-notebook-review]').click();
    await page.locator('#nbSearch').waitFor();
    check(await page.locator('.nb-item').count() === 7 && await page.locator('#nbStatus').inputValue() === 'open', 'dashboard queue entry resets stale notebook filters');
    await page.evaluate(() => { state = window.beforeNotebookTest; session = null; saveState(); saveSession(); });

    const coverage = await page.evaluate(() => Object.keys(COACHING).map(id => ({ id, exists: !!KP_BY_ID[id], fresh: !KP_BY_ID[id].items.some(i => i.prompt === COACHING[id].prompt), answerCount: COACHING[id].options.filter(o => o === COACHING[id].answer).length })));
    check(coverage.length === 10 && coverage.every(c => c.exists && c.fresh && c.answerCount === 1), 'ten valid fresh transfer exercises');
    for (const entry of coverage) {
      await page.goto(url + '#/prelearn/' + entry.id);
      check(await page.locator('.coach-note').count() === 1, 'primer teaching note: ' + entry.id);
    }
    await page.goto(url + '#/prelearn/a0.articles.definite');
    await page.locator('#step1Next').click();
    const wrong = await page.evaluate(() => KP_BY_ID['a0.articles.definite'].items[0].options.find(o => o !== KP_BY_ID['a0.articles.definite'].items[0].answer));
    const choice = page.locator('[data-g-option]').filter({ hasText: new RegExp('^' + wrong + 'tap again$') });
    await choice.click(); await choice.click();
    await page.locator('[data-coach]').waitFor();
    check(await page.locator('.coach-details').getAttribute('open') === null, 'long error explanation starts collapsed');
    await page.locator('.coach-details summary').click();
    check(await page.locator('.coach-examples').isVisible(), 'contrast examples can be expanded');
    const before = await page.evaluate(() => JSON.stringify({ state, session, prelearn }));
    await page.locator('[data-coach-answer="le"]').click();
    check((await page.locator('.coach-result').innerText()).includes('再想一想'), 'wrong transfer answer explains');
    await page.locator('[data-coach-answer="les"]').click();
    check((await page.locator('.coach-result').innerText()).includes('答对了'), 'correct transfer answer');
    check(before === await page.evaluate(() => JSON.stringify({ state, session, prelearn })), 'coaching never alters scores or session');
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, 'studio-coaching.png'), fullPage: true });

    await page.evaluate(() => {
      const kp = KP_BY_ID['a0.articles.definite'];
      startSessionFromItems([{ kpId: kp.id, itemId: kp.items[0].id }]);
    });
    await page.locator('#skipBtn').waitFor();
    const quizChoice = page.locator('[data-option]').filter({ hasText: new RegExp('^\\d' + wrong + 'tap again$') });
    await quizChoice.click(); await quizChoice.click();
    await page.locator('[data-coach]').waitFor();
    const quizBefore = await page.evaluate(() => JSON.stringify({ state, session }));
    await page.locator('[data-coach-answer="les"]').click();
    check(quizBefore === await page.evaluate(() => JSON.stringify({ state, session })), 'quiz remediation keeps mastery and retry queue unchanged');
    check(await page.locator('#continueBtn').count() === 1, 'main quiz can still continue');

    const vocab = await page.evaluate(() => ({ pending: VOCAB.filter(v => v.pos === 'noun' && !v.g && !v.note).length, pronoun: VOCAB_BY_WORD.quoi.pos, excluded: ['enfant','gens','chef','tour','livre','geste','aide','mort','merci'].every(w => VOCAB_BY_WORD[w].genderDrill === false) }));
    check(vocab.pending === 0 && vocab.pronoun === 'pronoun' && vocab.excluded, 'reviewed genders and ambiguous senses');

    await page.goto(url + '#/settings');
    await page.evaluate(() => {
      window.originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function () { throw new DOMException('Full', 'QuotaExceededError'); };
      saveState();
    });
    check(await page.locator('#saveStatus.save-error').count() === 1, 'persistent save failure');
    await page.goto(url + '#/');
    check(await page.locator('#saveStatus').innerText().then(t => t.includes('未保存')), 'failure survives navigation');
    check(await page.locator('.toast').getAttribute('aria-live') === 'polite', 'accessible toast');
    await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; saveState(); });
    check(await page.locator('#saveStatus.save-error').count() === 0, 'successful save clears failure');
    await page.locator('.toast:not(.show)').waitFor({ state: 'attached' });
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.toast')).opacity === '0');

    await page.goto(url + '#/settings');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#exportBtn').click();
    const backup = JSON.parse(fs.readFileSync(await (await downloadPromise).path(), 'utf8'));
    check(backup.app === 'kwizlocal' && backup.attempts.length === 1, 'backup exports the scored attempt');
    // Change the isolated test profile, then restore the exported file through UI.
    await page.evaluate(() => { state.goal = 99; saveState(); });
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#importFile').setInputFiles({ name: 'test-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
    await page.waitForFunction(() => state.goal !== 99);
    check(await page.evaluate(() => state.attempts.length === 1 && session === null), 'backup restores progress and clears in-flight session');
    await page.goto(url + '#/');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.toast')).opacity === '0');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile dashboard fits');
    await page.screenshot({ path: path.join(output, 'studio-mobile.png') });
    await page.goto(url + '#/prelearn/a1.possessives');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile lesson fits');
    await page.evaluate(() => toast('测试手机提示位置'));
    check(await page.locator('.toast').evaluate(el => el.getBoundingClientRect().bottom) <= await page.locator('.tabbar').evaluate(el => el.getBoundingClientRect().top), 'mobile toast stays above navigation');
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto(url + '#/');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'narrow phone dashboard fits');
    await page.locator('.todaybar small').waitFor();
    await page.goto(url + '#/prelearn/a1.possessives');

    // Existing release must stay coherent until the user activates the update.
    nextRelease = true;
    await page.evaluate(async () => { const reg = await navigator.serviceWorker.getRegistration(); await reg.update(); });
    await page.locator('.sw-update-go').waitFor();
    check(await page.locator('#versionChip').innerText() === versionLabel(currentRelease), 'old release stays active before approval');
    await page.locator('.sw-update-go').click();
    await page.waitForFunction(label => document.getElementById('versionChip').textContent === label, versionLabel(futureRelease));
    check(await page.evaluate(id => RELEASE.id === id, futureRelease.id), 'reload waits for new controller');
    await context.setOffline(true);
    await page.reload();
    await page.locator('.coach-note').waitFor();
    check(await page.locator('#versionChip').innerText() === versionLabel(futureRelease), 'new release works offline');
    check(await page.evaluate(() => state.attempts.length === 1), 'progress survives upgrade and offline reload');
    await context.setOffline(false);
    check(errors.length === 0, 'no browser errors: ' + errors.join(', '));
    console.log(`${checks} study-studio browser checks passed (including offline upgrade).`);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
