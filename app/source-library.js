/* Offline reader for the user-authorized KwizIQ grammar archive. Reading is
   tracked separately from independently demonstrated grammar mastery. */
let sourceCatalog = null;
let sourceCatalogPromise = null;
let sourceFilter = { query: '', level: 'all', category: 'all', read: 'all', page: 0 };

function loadSourceCatalog() {
  if (sourceCatalog) return Promise.resolve(sourceCatalog);
  if (sourceCatalogPromise) return sourceCatalogPromise;
  sourceCatalogPromise = new Promise(function (resolve, reject) {
    if (globalThis.KWIZIQ_ARCHIVE) { resolve(globalThis.KWIZIQ_ARCHIVE); return; }
    const script = document.createElement('script');
    script.src = 'kwiziq-lessons.js';
    script.onload = function () { resolve(globalThis.KWIZIQ_ARCHIVE); };
    script.onerror = function () { script.remove(); reject(new Error('Archive unavailable')); };
    document.head.appendChild(script);
  }).then(function (data) {
    if (!data || !Array.isArray(data.lessons)) throw new Error('Invalid archive');
    sourceCatalog = data;
    return data;
  }).catch(function (error) { sourceCatalogPromise = null; throw error; });
  return sourceCatalogPromise;
}

function sourceFold(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function filteredSourceLessons() {
  if (!sourceCatalog) return [];
  const words = sourceFold(sourceFilter.query).trim().split(/\s+/).filter(Boolean);
  return sourceCatalog.lessons.filter(function (lesson) {
    const read = !!(state.sourceRead && state.sourceRead[lesson.id]);
    return (sourceFilter.level === 'all' || lesson.level === sourceFilter.level)
      && (sourceFilter.category === 'all' || lesson.category === sourceFilter.category)
      && (sourceFilter.read === 'all' || (sourceFilter.read === 'read' ? read : !read))
      && words.every(function (word) { return sourceFold(lesson.title + ' ' + lesson.category + ' ' + (lesson.text || '')).includes(word); });
  });
}

function sourceLoadView(kind, id) {
  app.innerHTML = '<div class="container"><div class="source-loading" role="status">正在打开离线语法库…</div></div>';
  loadSourceCatalog().then(function () {
    if (kind === 'catalog' && location.hash === '#/sources') renderSourceCatalog();
    if (kind === 'lesson' && location.hash === '#/source/' + id) renderSourceLesson(id);
  }).catch(function () {
    if (location.hash !== (kind === 'catalog' ? '#/sources' : '#/source/' + id)) return;
    app.innerHTML = '<div class="container"><div class="empty"><h1>暂时无法读取离线课程库</h1><p>请检查网络或离线缓存是否已更新。原有学习记录仍保留。</p><a class="btn sm ghost" href="#/library">回到课程库</a><button class="btn sm" id="sourceRetry">重试</button></div></div>';
    document.getElementById('sourceRetry').onclick = function () { sourceLoadView(kind, id); };
  });
}

function sourceSafeHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = String(html || '');
  const allowed = new Set('P DIV SPAN H2 H3 H4 H5 STRONG B EM I U S SUB SUP UL OL LI TABLE THEAD TBODY TR TH TD A BR HR BLOCKQUOTE'.split(' '));
  template.content.querySelectorAll('script,style,iframe,object,embed,form,input,button,svg,math,link,meta').forEach(function (node) { node.remove(); });
  template.content.querySelectorAll('*').forEach(function (node) {
    if (!allowed.has(node.tagName)) { node.replaceWith.apply(node, Array.from(node.childNodes)); return; }
    Array.from(node.attributes).forEach(function (attr) {
      const keep = attr.name === 'class' && attr.value.split(/\s+/).every(function (name) { return /^source-[a-z-]+$/.test(name); })
        || node.tagName === 'A' && attr.name === 'href' && (/^https:\/\//.test(attr.value) || /^#\/source\/[a-f0-9]{16}$/.test(attr.value))
        || ['TD','TH'].includes(node.tagName) && ['colspan','rowspan'].includes(attr.name) && /^(?:[1-9]|[12][0-9]|30)$/.test(attr.value);
      if (!keep) node.removeAttribute(attr.name);
    });
    if (node.tagName === 'A' && /^https:\/\//.test(node.getAttribute('href') || '')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
  return template.innerHTML;
}

function renderSourceCatalog() {
  if (!sourceCatalog) { sourceLoadView('catalog'); return; }
  const lessons = filteredSourceLessons();
  const size = 24;
  sourceFilter.page = Math.min(sourceFilter.page, Math.max(0, Math.ceil(lessons.length / size) - 1));
  const categories = Array.from(new Set(sourceCatalog.lessons.map(function (lesson) { return lesson.category; })));
  const levels = ['A0','A1','A2','B1','B2','C1','C2'].filter(function (level) { return sourceCatalog.lessons.some(function (l) { return l.level === level; }); });
  const countRead = sourceCatalog.lessons.filter(function (lesson) { return state.sourceRead && state.sourceRead[lesson.id]; }).length;
  const options = function (values, selected, first) {
    return '<option value="all">' + first + '</option>' + values.map(function (value) { return '<option value="' + esc(value) + '"' + (selected === value ? ' selected' : '') + '>' + esc(value) + '</option>'; }).join('');
  };
  app.innerHTML = '<div class="container"><div class="page-head"><span class="studio-eyebrow">KWIZIQ · OFFLINE GRAMMAR LIBRARY</span><h1>原版语法精讲库</h1><p>'
    + sourceCatalog.imported + ' / ' + sourceCatalog.total + ' 篇已导入 · A0–C1 · 已读 ' + countRead + ' 篇</p></div>'
    + '<div class="source-intro"><b>保留原版讲解、例句与注意事项，离线也能学。</b><p>来源：KwizIQ 公开语法目录及各课程署名作者。按你提供的授权导入。已读只记录阅读进度，不代表掌握度。在线测验、音频与视频未导入。</p></div>'
    + '<div class="source-filters"><label>搜索讲解与例句<input type="search" id="sourceSearch" placeholder="例如 articles、subjonctif、avoir faim" value="' + esc(sourceFilter.query) + '"></label>'
    + '<label>级别<select id="sourceLevel">' + options(levels, sourceFilter.level, '全部级别') + '</select></label>'
    + '<label>语法分类<select id="sourceCategory">' + options(categories, sourceFilter.category, '全部分类') + '</select></label>'
    + '<label>阅读进度<select id="sourceRead">' + [['all','全部课程'],['unread','未读'],['read','已读']].map(function (o) { return '<option value="' + o[0] + '"' + (sourceFilter.read === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label></div>'
    + '<div class="source-list-head"><span role="status">找到 ' + lessons.length + ' 篇课程</span><button class="btn sm ghost" id="sourceReset">重置筛选</button></div>'
    + '<div class="source-grid">' + lessons.slice(sourceFilter.page * size, (sourceFilter.page + 1) * size).map(function (lesson) {
      return '<article class="source-card"><span class="source-card-level">' + esc(lesson.level) + ' · ' + esc(lesson.category) + '</span><h2>' + esc(lesson.title) + '</h2>'
        + '<p>' + (lesson.status === 'ready' ? esc(lesson.text.slice(0, 135)) + '…' : '尚未导入：' + esc(lesson.error || '等待抓取')) + '</p>'
        + '<div>' + (lesson.status === 'ready' ? '<a class="btn sm" href="#/source/' + lesson.id + '">学习精讲 →</a>' : '<a class="btn sm ghost" href="' + esc(lesson.url) + '" target="_blank" rel="noopener noreferrer">查看原文</a>')
        + (state.sourceRead && state.sourceRead[lesson.id] ? '<span class="source-read-label">✓ 已读</span>' : '') + '</div></article>';
    }).join('') + '</div>'
    + (!lessons.length ? '<div class="empty">没有匹配课程，试着减少关键词或重置筛选。</div>' : '')
    + '<div class="source-pagination"><button class="btn sm ghost" id="sourcePrev"' + (!sourceFilter.page ? ' disabled' : '') + '>上一页</button><span>' + (sourceFilter.page + 1) + ' / ' + Math.max(1, Math.ceil(lessons.length / size)) + '</span><button class="btn sm ghost" id="sourceNext"' + ((sourceFilter.page + 1) * size >= lessons.length ? ' disabled' : '') + '>下一页</button></div></div>';
  const search = function (event) {
    if (event.isComposing) return;
    const cursor = event.target.selectionStart;
    sourceFilter.query = event.target.value; sourceFilter.page = 0;
    renderSourceCatalog();
    const input = document.getElementById('sourceSearch'); input.focus(); input.setSelectionRange(cursor, cursor);
  };
  document.getElementById('sourceSearch').addEventListener('input', search);
  document.getElementById('sourceSearch').addEventListener('compositionend', search);
  [['sourceLevel','level'],['sourceCategory','category'],['sourceRead','read']].forEach(function (pair) {
    document.getElementById(pair[0]).onchange = function (event) { sourceFilter[pair[1]] = event.target.value; sourceFilter.page = 0; renderSourceCatalog(); document.getElementById(pair[0]).focus(); };
  });
  document.getElementById('sourceReset').onclick = function () { sourceFilter = { query:'', level:'all', category:'all', read:'all', page:0 }; renderSourceCatalog(); };
  document.getElementById('sourcePrev').onclick = function () { sourceFilter.page--; renderSourceCatalog(); window.scrollTo(0, 0); };
  document.getElementById('sourceNext').onclick = function () { sourceFilter.page++; renderSourceCatalog(); window.scrollTo(0, 0); };
}

function renderSourceLesson(id) {
  if (!sourceCatalog) { sourceLoadView('lesson', id); return; }
  const lesson = sourceCatalog.lessons.find(function (entry) { return entry.id === id; });
  if (!lesson || lesson.status !== 'ready') {
    app.innerHTML = '<div class="container"><div class="empty">这篇课程暂时不可用。<a href="#/sources">回到语法库</a></div></div>'; return;
  }
  const read = !!(state.sourceRead && state.sourceRead[id]);
  const ready = filteredSourceLessons().filter(function (entry) { return entry.status === 'ready'; });
  const index = ready.findIndex(function (entry) { return entry.id === id; });
  const related = (lesson.related || []).map(function (entry) {
    const local = sourceCatalog.lessons.find(function (l) { return l.url === entry.url && l.status === 'ready'; });
    return '<li><a href="' + esc(local ? '#/source/' + local.id : entry.url) + '"' + (local ? '' : ' target="_blank" rel="noopener noreferrer"') + '>' + esc(entry.title) + '</a></li>';
  }).join('');
  app.innerHTML = '<div class="container source-reader"><a class="small" href="#/sources">← 返回语法精讲库</a><div class="page-head"><span class="studio-eyebrow">' + esc(lesson.level) + ' · ' + esc(lesson.category) + '</span><h1>' + esc(lesson.title) + '</h1></div>'
    + '<div class="source-meta"><p>' + esc(lesson.author) + '</p><p>' + esc(lesson.sourceUpdated) + ' · 导入日期 ' + esc(lesson.fetchedAt.slice(0, 10)) + '</p><a href="' + esc(lesson.url) + '" target="_blank" rel="noopener noreferrer">原文与来源 ↗</a>'
    + '<button class="btn sm ghost" id="sourceMarkRead" aria-pressed="' + read + '">' + (read ? '✓ 已读 · 点击撤销' : '标记已读') + '</button></div>'
    + '<article class="source-content">' + sourceSafeHtml(lesson.html) + '</article>'
    + (related ? '<section class="source-related"><h2>相关精讲</h2><ul>' + related + '</ul></section>' : '')
    + '<p class="source-credit">课程内容来自 KwizIQ 及其署名作者，按你提供的授权导入。音频、视频及原站在线测验未导入；已读不代表语法掌握度。</p>'
    + '<nav class="source-pagination" aria-label="课程翻页">' + (index > 0 ? '<a class="btn sm ghost" href="#/source/' + ready[index-1].id + '">← 上一课</a>' : '<span></span>')
    + '<a class="btn sm ghost" href="#/library">回课程库选择练习</a>' + (index >= 0 && index + 1 < ready.length ? '<a class="btn sm ghost" href="#/source/' + ready[index+1].id + '">下一课 →</a>' : '') + '</nav></div>';
  document.getElementById('sourceMarkRead').onclick = function () {
    if (!state.sourceRead || typeof state.sourceRead !== 'object' || Array.isArray(state.sourceRead)) state.sourceRead = {};
    if (state.sourceRead[id]) delete state.sourceRead[id]; else state.sourceRead[id] = Date.now();
    saveState(); renderSourceLesson(id);
  };
}
