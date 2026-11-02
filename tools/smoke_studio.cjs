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

    const beforeThemeTest=await page.evaluate(()=>JSON.stringify(state));
    await page.goto(url+'#/library');
    await page.locator('.theme-library-entry a').click();
    await page.locator('#themeSearch').waitFor();
    check(await page.evaluate(()=>themeCatalog.total===228&&themeCatalog.imported===225&&themeCatalog.entryCount===4339),'theme manifest exposes saved and unavailable content honestly');
    await page.screenshot({path:path.join(output,'theme-catalog.png')});
    await page.locator('#themeLevel').selectOption('A0');
    check(await page.locator('.theme-card').count()===10,'theme level filter includes documented missing links');
    await page.locator('#themeSearch').fill('le chat');
    check(await page.locator('.theme-card').count()>0,'theme search includes actual French vocabulary');
    await page.locator('#themeSearch').fill('no-such-vocabulary-123');
    check(await page.locator('.theme-card').count()===0,'theme no-match state');
    await page.locator('#themeReset').click();
    await page.goto(url+'#/theme/128');
    await page.locator('#themeHide').waitFor();
    check(await page.locator('.theme-table tbody tr').count()===12,'theme preserves all bilingual word pairs');
    await page.locator('#themeHide').click();
    check(await page.locator('.theme-meaning').first().evaluate(el=>getComputedStyle(el).visibility==='hidden'),'translation can be hidden for recall');
    await page.locator('#themeHide').click();
    await page.screenshot({path:path.join(output,'theme-lesson.png')});
    const themeMastery=await page.evaluate(()=>JSON.stringify({kps:state.kps,attempts:state.attempts,sessions:state.sessions}));
    check(await page.evaluate(()=>themeNormalize('école')!==themeNormalize('ecole')&&themeNormalize('L’école!')===themeNormalize("l'école")),'reference matching preserves accents but normalizes punctuation and apostrophes');
    check(await page.evaluate(()=>themePracticeGroups({entries:[{en:'car',fr:'une voiture'},{en:'car',fr:'une automobile'}]})[0].answers.length===2),'identical English prompts preserve all source French answers');
    await page.locator('#themeCards').click();
    await page.locator('#themeReveal').waitFor();
    check(await page.locator('.theme-revealed').count()===0,'recall cards hide meanings initially');
    for(let i=0;i<10;i++){await page.locator('#themeReveal').click();await page.locator('#themeKnow').click();}
    await page.locator('.theme-result-score').waitFor();
    check(await page.evaluate(()=>state.themePractice['128'].cardRounds===1),'completed card round is recorded separately');
    await page.evaluate(()=>renderThemePractice('128'));
    check(await page.evaluate(()=>state.themePractice['128'].cardRounds===1),'rerender does not double-count completed rounds');
    await page.goto(url+'#/theme/128');
    await page.locator('#themeWrite').click();
    await page.locator('#themeInput').waitFor();
    await page.locator('#themeInput').fill('c');
    await page.locator('.accent-bar[data-for="themeInput"] [data-accent="ç"]').click();
    check((await page.locator('#themeInput').inputValue()).includes('ç'),'theme spelling supports French accent keys');
    await page.locator('#themeInput').fill('');
    await page.locator('#themeCheck').click();
    check(await page.evaluate(()=>themeStudy.responses.length===0),'empty spelling answer is not counted');
    for(let i=0;i<10;i++){
      if(i===2){await page.locator('#themeSkip').click();continue;}
      const answer=i===1?'xyz':await page.evaluate(()=>themeStudy.queue[themeStudy.index].answers[0]);
      await page.locator('#themeInput').fill(answer);await page.locator('#themeCheck').click();
      await page.locator('#themeContinue').waitFor();
      if(i===0){
        await page.reload();await page.locator('#themeContinue').waitFor();
        check(await page.evaluate(()=>themeStudy.index===0&&themeStudy.responses.length===1&&themeStudy.result.matched),'checked theme answer resumes after reload without scoring twice');
        await page.screenshot({path:path.join(output,'theme-practice.png')});
      }
      await page.locator('#themeContinue').click();
    }
    await page.locator('.theme-result-score').waitFor();
    check((await page.locator('.theme-result-score').innerText()).includes('8 / 10'),'spelling result distinguishes matched, unmatched and skipped words');
    check(await page.evaluate(()=>state.themePractice['128'].writeRounds===1),'spelling round is recorded once');
    check(themeMastery===await page.evaluate(()=>JSON.stringify({kps:state.kps,attempts:state.attempts,sessions:state.sessions})),'theme practice never fabricates grammar mastery or quiz attempts');
    await page.setViewportSize({width:390,height:844});
    await page.goto(url+'#/theme/128');
    await page.locator('#themeHide').waitFor();
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile theme word list fits');
    await page.screenshot({path:path.join(output,'theme-mobile.png')});
    await page.setViewportSize({width:1280,height:900});
    await page.goto(url+'#/vocab');
    await page.locator('.theme-library-entry a').waitFor();
    check(await page.locator('.theme-library-entry a').getAttribute('href')==='#/themes','theme vocabulary is discoverable from the existing vocabulary page');
    await page.goto(url+'#/source/90cab11663b9bd45');
    await page.locator('.source-content').waitFor();
    await page.locator('.source-content a[href="https://french.kwiziq.com/learn/theme/1512981"]').first().click();
    await page.waitForFunction(()=>location.hash==='#/theme/1512981');
    await page.locator('.theme-table').waitFor();
    check(await page.locator('.theme-table').count()===1,'imported grammar lessons open their saved theme word lists locally');
    await page.evaluate(snapshot=>{state=JSON.parse(snapshot);themeStudy=null;saveState();},beforeThemeTest);

    const beforeSourceTest = await page.evaluate(() => JSON.stringify(state));
    await page.goto(url + '#/library');
    await page.locator('.source-library-entry a').click();
    await page.locator('#sourceSearch').waitFor();
    check(await page.evaluate(() => sourceCatalog.total === 541 && sourceCatalog.imported === 541), 'all authorized directory lessons are available in the offline reader');
    check(await page.locator('.source-card').count() === 24, 'source catalog paginates long course lists');
    const firstSourceTitle = await page.locator('.source-card h2').first().innerText();
    await page.locator('#sourceNext').click();
    check(await page.locator('.source-card h2').first().innerText() !== firstSourceTitle, 'source catalog next page changes courses');
    await page.locator('#sourceLevel').selectOption('A0');
    check(await page.evaluate(() => filteredSourceLessons().length === 28), 'source CEFR filter');
    await page.locator('#sourceCategory').selectOption('Pronouns');
    check(await page.locator('.source-card-level').allTextContents().then(a => a.length > 0 && a.every(t => t.includes('A0') && t.includes('Pronouns'))), 'source grammar-area filter');
    await page.locator('#sourceSearch').fill("m'appelle");
    check(await page.evaluate(() => filteredSourceLessons().some(l => l.text.includes("m'appelle"))), 'source search includes actual lesson content');
    await page.locator('#sourceReset').click();
    await page.screenshot({ path: path.join(output, 'source-catalog.png') });
    const sourceId = await page.evaluate(() => sourceCatalog.lessons[0].id);
    await page.goto(url + '#/source/' + sourceId);
    await page.locator('.source-content').waitFor();
    check(await page.locator('.source-content').innerText().then(t => t.length > 120), 'reader displays the imported body rather than an external embed');
    check(await page.locator('.source-content .source-example').count() > 0, 'reader retains teaching examples');
    check(await page.locator('.source-meta').innerText().then(t => t.includes('Written by') && t.includes('原文与来源')), 'reader retains author attribution and original source');
    const masteryBeforeRead = await page.evaluate(() => JSON.stringify({ kps:state.kps, attempts:state.attempts, sessions:state.sessions }));
    await page.locator('#sourceMarkRead').click();
    check(await page.locator('#sourceMarkRead').getAttribute('aria-pressed') === 'true', 'reader records read progress');
    check(masteryBeforeRead === await page.evaluate(() => JSON.stringify({ kps:state.kps, attempts:state.attempts, sessions:state.sessions })), 'reading does not fabricate grammar mastery');
    await page.reload();
    await page.locator('.source-content').waitFor();
    check(await page.locator('#sourceMarkRead').getAttribute('aria-pressed') === 'true', 'read progress survives reload');
    await page.screenshot({ path: path.join(output, 'source-lesson.png') });
    check(await page.evaluate(() => {
      const safe = sourceSafeHtml('<img src=x onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">x</a><p style="position:fixed" onclick="alert(1)">safe</p>');
      return safe.includes('safe') && !/script|onerror|onclick|style=/.test(safe);
    }), 'reader strips active HTML and unsafe links even if archive content is tampered with');
    await page.locator('.source-pagination a[href^="#/source/"]').last().click();
    await page.waitForFunction(id => location.hash !== '#/source/' + id, sourceId);
    check(await page.locator('.source-content').count() === 1, 'course navigation stays inside the offline reader');
    await page.goto(url + '#/sources');
    await page.locator('#sourceRead').selectOption('read');
    check(await page.locator('.source-card').count() === 1, 'read-progress filter');
    await page.setViewportSize({ width:390, height:844 });
    await page.goto(url + '#/source/' + sourceId);
    await page.locator('.source-content').waitFor();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile source lesson fits the viewport');
    await page.screenshot({ path:path.join(output,'source-mobile.png') });
    await page.goto(url + '#/prelearn/a0.articles.definite');
    await page.locator('[data-source-level]').click();
    await page.locator('#sourceLevel').waitFor();
    check(await page.locator('#sourceLevel').inputValue() === 'A0', 'existing lessons can open source explanations at their own level');
    await page.setViewportSize({width:1280,height:900});
    await page.evaluate(snapshot => { state=JSON.parse(snapshot); saveState(); }, beforeSourceTest);
    const filePage = await context.newPage();
    await filePage.goto(require('node:url').pathToFileURL(path.join(root, 'index.html')).href + '#/sources');
    await filePage.locator('#sourceSearch').waitFor();
    check(await filePage.locator('.source-card').count() === 24, 'source archive also loads when the local app is opened as a file');
    await filePage.goto(require('node:url').pathToFileURL(path.join(root,'index.html')).href+'#/themes');
    await filePage.locator('#themeSearch').waitFor();
    check(await filePage.evaluate(()=>themeCatalog.imported===225),'theme archive works from the local file app');
    await filePage.close();

    const beforeFoundationTest = await page.evaluate(() => JSON.stringify(state));
    await page.goto(url + '#/library');
    await page.locator('.foundation-library-entry a').click();
    await page.locator('.foundation-catalog').waitFor();
    check(await page.locator('.foundation-course').count() === 10, 'core learning catalog exposes ten enhanced lessons');
    await page.screenshot({ path: path.join(output, 'foundations-catalog.png') });
    for (const id of await page.evaluate(() => Object.keys(FOUNDATIONS))) {
      await page.goto(url + '#/prelearn/' + id);
      check(await page.locator('.foundation-steps article').count() === 3 && await page.locator('.foundation-worked article').count() === 2, 'worked teaching steps: ' + id);
    }
    await page.goto(url + '#/prelearn/a0.articles.definite');
    await page.screenshot({ path: path.join(output, 'foundation-lesson.png') });
    check(await page.evaluate(() => !commonMistakes(KP_BY_ID['a0.articles.definite']).some(row => row.right.includes('fenêtre'))), 'independent check answers are not leaked in lesson mistake tables');
    await page.locator('[data-foundation-check]').click();
    await page.locator('.assessment-banner').waitFor();
    check(await page.evaluate(() => session.foundationCheck.seenBefore === 0 && session.session.items.length === 6), 'assessment starts with exactly six unseen authored questions');
    for (let index = 0; index < 6; index++) {
      const item = await page.evaluate(() => getItem(session.session.items[session.index]).item);
      if (index === 2) await page.locator('#skipBtn').click();
      else if (item.type === 'choice') {
        const answer = index === 0 ? item.options.find(o => o !== item.answer) : item.answer;
        const option = page.locator('[data-option]').filter({ hasText: answer }).first();
        await option.click(); await option.click();
      } else {
        await page.locator('#answerInput').fill(index === 4 ? 'xyz' : item.answer);
        await page.locator('#checkBtn').click();
      }
      await page.locator('.assessment-recorded').waitFor();
      check(await page.locator('.answer-line,.option.correct,.option.wrong,.score-move,.why-wrong').count() === 0, 'assessment withholds correctness and answers: question ' + index);
      check(await page.evaluate(() => session.session.items.length === 6), 'assessment never adds immediate retries');
      if (index === 0) {
        await page.reload();
        await page.locator('.assessment-recorded').waitFor();
        check(await page.evaluate(() => !!session.foundationCheck && session.answers.length === 1), 'assessment mode survives reload without revealing first answer');
      }
      if (index === 1) {
        await page.waitForTimeout(1200);
        check(await page.evaluate(() => session.index === 1), 'assessment does not auto-advance a correct answer');
      }
      await page.locator('#continueBtn').click();
    }
    await page.locator('.foundation-report').waitFor();
    check(await page.locator('.foundation-scores article b').allTextContents().then(a => a.join(',') === '1 / 2,1 / 2,1 / 2'), 'report separates recognition, production, correction and unanswered items');
    check(await page.evaluate(() => state.sessions.at(-1).answers.length === 6 && state.attempts.filter(a => a.source === 'foundation-check').length === 5), 'assessment scores each answered question once and never scores skipped items');
    await page.locator('.foundation-report').screenshot({ path: path.join(output, 'foundation-result.png') });
    await page.evaluate(() => startFoundationCheck('a0.articles.definite'));
    check(await page.evaluate(() => session.foundationCheck.seenBefore === 6), 'repeat assessments disclose previously seen and skipped questions');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url + '#/prelearn/a0.articles.definite');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'expanded lesson fits phone width');
    await page.goto(url + '#/foundations');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'foundation catalog fits phone width');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(snapshot => { state = JSON.parse(snapshot); session = null; saveState(); saveSession(); }, beforeFoundationTest);

    const coverage = await page.evaluate(() => Object.keys(COACHING).map(id => ({ id, exists: !!KP_BY_ID[id], fresh: !KP_BY_ID[id].items.some(i => i.prompt === COACHING[id].prompt), answerCount: COACHING[id].options.filter(o => o === COACHING[id].answer).length })));
    check(coverage.length === 10 && coverage.every(c => c.exists && c.fresh && c.answerCount === 1), 'ten valid fresh transfer exercises');
    for (const entry of coverage) {
      await page.goto(url + '#/prelearn/' + entry.id);
      await page.locator('.coach-note').waitFor();
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
    await page.goto(url + '#/sources');
    await page.locator('#sourceSearch').waitFor();
    check(await page.evaluate(() => sourceCatalog.imported === 541), 'complete source archive is cached for offline use');
    const offlineSourceId = await page.evaluate(() => sourceCatalog.lessons[0].id);
    await page.goto(url + '#/source/' + offlineSourceId);
    await page.locator('.source-content').waitFor();
    check(await page.locator('.source-content').innerText().then(t => t.length > 120), 'imported lesson opens without a network connection');
    await page.goto(url+'#/themes');
    await page.locator('#themeSearch').waitFor();
    check(await page.evaluate(()=>themeCatalog.imported===225),'theme vocabulary is available offline');
    await page.goto(url+'#/theme/128');
    await page.locator('#themeCards').click();
    await page.locator('#themeReveal').waitFor();
    check(await page.evaluate(()=>themeStudy.queue.length===10),'theme recall exercises work offline');
    await context.setOffline(false);
    check(errors.length === 0, 'no browser errors: ' + errors.join(', '));
    console.log(`${checks} study-studio browser checks passed (including offline upgrade).`);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
