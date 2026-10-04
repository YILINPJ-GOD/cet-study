/* ===== 即点即查词典 + 生词本 ===== */
App.dict = {};

/* 查词：词库 + 词典补充词 + 形态还原 */
App.dict.lookup = function (word) {
  const wm = App.WMAP();
  const w = String(word || '').toLowerCase().replace(/['-]/g, '');
  if (!w) return null;
  if (wm[w]) return wm[w];
  for (const c of App.grader.lemmaCandidates(w)) if (wm[c]) return wm[c];
  return null;
};

/* 把容器内的英文单词包上可点击 span */
App.dict.wrapWords = function (root) {
  const skipTags = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1, BUTTON: 1, TITLE: 1 };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      const p = node.parentElement;
      if (!p || skipTags[p.tagName] || p.closest('.no-dict')) return NodeFilter.FILTER_REJECT;
      return /[A-Za-z]{2,}/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const frag = document.createDocumentFragment();
    let last = 0;
    const text = node.nodeValue;
    const re = /[A-Za-z][A-Za-z'-]*[A-Za-z]|[A-Za-z]/g;
    let m;
    while ((m = re.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const span = document.createElement('span');
      span.className = 'dict-word';
      span.dataset.w = m[0];
      span.textContent = m[0];
      frag.appendChild(span);
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
};

App.dict.inBook = function (w) { return !!App.store.wordbook[w.toLowerCase()]; };

/* 纯功能词：点击只做友好提示，不进词典也不收藏 */
App.dict.SKIP = new Set(('the a an and or but of to in on at for with by from as is are was were be been being am do does did have has had will would can could may might must shall should if when while which who whom whose what where why how not no nor so than then too very it its this that these those there here we you they he she i us them me him my your our their his her hers mine yours ours theirs ourselves themselves itself myself yourself'.split(' ')));

App.dict.addToBook = function (w, src) {
  w = w.toLowerCase();
  if (App.store.wordbook[w]) { App.toast('已在生词本中'); return; }
  App.store.wordbook[w] = { d: App.today(), src: src || '查词' };
  if (!App.store.srs[w]) App.store.srs[w] = { b: 0, due: Date.now(), c: 0, w: 0 };
  App.save();
  App.toast('「' + w + '」已加入生词本，将进入今日复习队列');
};

App.dict.removeFromBook = function (w) {
  w = w.toLowerCase();
  delete App.store.wordbook[w];
  App.save();
};

/* 浮层 */
App.dict.init = function () {
  const pop = document.getElementById('dictPop');
  let curWord = null;

  function hide() { pop.style.display = 'none'; curWord = null; }

  function show(word, x, y, src, deferred) {
    const wl = word.toLowerCase();
    if (App.dict.SKIP.has(wl)) {
      pop.innerHTML = '<div class="dw">' + App.esc(word) + '</div><div class="dg">常用功能词（冠词/代词/助动词等），无需查询</div>';
      pop.style.display = 'block';
      const r0 = pop.getBoundingClientRect();
      pop.style.left = Math.min(Math.max(8, x - 20), window.innerWidth - r0.width - 12) + 'px';
      pop.style.top = Math.min(y + 18, window.innerHeight - r0.height - 10) + 'px';
      return;
    }
    if (deferred) {
      // 考试模式：先记录，交卷后统一显示释义
      if (App.dict.onDeferredLookup) App.dict.onDeferredLookup(wl);
      pop.innerHTML = '<div class="dw">' + App.esc(word) + ' <button class="ico-btn" data-act="speak2">🔊</button></div>'
        + '<div class="dg">已记录本次查词。<b>释义将在交卷后统一显示</b>（做题模式不分心）。可先加入生词本。</div>'
        + '<button class="ico-btn ' + (App.dict.inBook(wl) ? 'starred' : '') + '" data-act="book">' + (App.dict.inBook(wl) ? '✓ 已在生词本' : '＋ 加入生词本') + '</button>';
      pop.style.display = 'block';
      const rect = pop.getBoundingClientRect();
      pop.style.left = Math.min(Math.max(8, x - 20), window.innerWidth - rect.width - 12) + 'px';
      pop.style.top = Math.min(y + 18, window.innerHeight - rect.height - 10) + 'px';
      const sp2 = pop.querySelector('[data-act=speak2]');
      if (sp2) sp2.onclick = e2 => { e2.stopPropagation(); App.speak(wl); };
      pop.querySelector('[data-act=book]').onclick = e2 => {
        e2.stopPropagation();
        if (App.dict.inBook(wl)) { App.dict.removeFromBook(wl); App.toast('已从生词本移除'); }
        else App.dict.addToBook(wl, src || '做题查词');
        show(word, x, y, src, deferred);
      };
      return;
    }
    const entry = App.dict.lookup(word);
    curWord = word.toLowerCase();
    const inBook = App.dict.inBook(curWord);
    let html;
    if (entry) {
      const tierMeta = App.TIERS[entry.tier];
      const lvBadge = tierMeta
        ? '<span class="badge lv' + (tierMeta.lv || 2) + '">' + tierMeta.label + (entry.examSense ? ' · 常考义' : '') + '</span>'
        : (entry.lv ? '<span class="badge lv' + entry.lv + '">' + App.LV[entry.lv].name + '档</span>' : '<span class="tag">词典</span>');
      html = '<div class="dw">' + App.esc(entry.w) + ' <button class="ico-btn" data-act="speak">🔊 发音</button></div>'
        + '<div class="dp">' + (entry.ipa ? '<span>/' + App.esc(entry.ipa) + '/</span>' : '')
        + '<span>' + App.esc(entry.pos) + '</span>'
        + lvBadge
        + '</div><div class="dg">' + App.esc(entry.gloss) + '</div>'
        + '<button class="ico-btn ' + (inBook ? 'starred' : '') + '" data-act="book">' + (inBook ? '✓ 已在生词本' : '＋ 加入生词本') + '</button>'
        + (window.EXAMPLES && window.EXAMPLES[entry.w] ? '<div class="note" style="margin-top:9px;font-style:italic">' + App.esc(window.EXAMPLES[entry.w][0]) + '<br>' + App.esc(window.EXAMPLES[entry.w][1]) + '</div>' : '');
    } else {
      html = '<div class="dw">' + App.esc(word) + '</div>'
        + '<div class="dg">「' + App.esc(word.toLowerCase()) + '」暂未收录于内置词典</div>'
        + '<button class="ico-btn ' + (inBook ? 'starred' : '') + '" data-act="book">' + (inBook ? '✓ 已在生词本' : '＋ 仍要加入生词本') + '</button>';
    }
    pop.innerHTML = html;
    pop.style.display = 'block';
    const rect = pop.getBoundingClientRect();
    let left = Math.min(Math.max(8, x - 20), window.innerWidth - rect.width - 12);
    let top = y + 18;
    if (top + rect.height > window.innerHeight - 10) top = Math.max(8, y - rect.height - 12);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    pop.querySelector('[data-act=speak]') && (pop.querySelector('[data-act=speak]').onclick = e => { e.stopPropagation(); App.speak(entry.w); });
    pop.querySelector('[data-act=book]').onclick = e => {
      e.stopPropagation();
      if (App.dict.inBook(curWord)) { App.dict.removeFromBook(curWord); App.toast('已从生词本移除'); }
      else App.dict.addToBook(curWord, src);
      show(word, x, y, src);
      if (App.currentView === 'wordbook') App.go('wordbook');
    };
  }

  document.addEventListener('click', function (e) {
    const t = e.target.closest('.dict-word');
    if (t) {
      e.preventDefault();
      e.stopPropagation();
      // 考试模式：做题容器标记 data-defer 时，点击只记录、不显示释义
      const deferred = !!t.closest('[data-defer]');
      show(t.dataset.w || t.textContent, e.clientX, e.clientY, t.closest('[data-src]') ? t.closest('[data-src]').dataset.src : '练习页面', deferred);
      return;
    }
    if (!pop.contains(e.target)) hide();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  // 供其他视图（如词库列表行）直接打开弹层
  App.dict.open = show;
  App.dict.hide = hide;
};
