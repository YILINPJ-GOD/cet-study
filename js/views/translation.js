/* ===== 翻译专项：主题练习 / 双栏对照 / 积累本 ===== */
App.Views.translation = App.Views.translation || {};
(function () {
  let tab = 'practice';
  let theme = '全部';

  const THEMES = ['全部', '文化历史', '社会发展', '科技经济'];
  const V = App.Views.translation;
  V.reset = function () { tab = 'practice'; };

  V.render = function (el, param) {
    if (param && param.pid) return renderPractice(el, param.pid);
    el.innerHTML = '<div class="tabs">' +
      [['practice', '✍️ 主题练习'], ['sent', '✏️ 句子训练'], ['book', '📒 常用表达积累本']]
        .map(([k, t]) => '<button class="tab ' + (tab === k ? 'active' : '') + '" data-t="' + k + '">' + t + '</button>').join('') + '</div><div id="tBody"></div>';
    el.querySelectorAll('.tab').forEach(b => b.onclick = () => { tab = b.dataset.t; V.render(el); });
    if (tab === 'practice') renderList(el.querySelector('#tBody'));
    else if (tab === 'sent') renderSentences(el.querySelector('#tBody'));
    else renderBook(el.querySelector('#tBody'));
  };

  /* ---------- 句子翻译训练 ---------- */
  let sentIdx = null;
  function renderSentences(el) {
    const bank = window.TRANSLATION_SENTENCES || [];
    if (!bank.length) { el.innerHTML = '<div class="card">句子库未加载</div>'; return; }
    if (sentIdx == null) sentIdx = Math.floor(Math.random() * bank.length);
    const item = bank[sentIdx % bank.length];
    const done = (App.store.sentPractice || []).filter(s => s.id === sentIdx % bank.length);
    el.innerHTML = `<div class="card" style="max-width:760px;margin:0 auto">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <span class="tag">句子翻译训练</span><span class="note">第 ${sentIdx % bank.length + 1} / ${bank.length} 句 · 历史已练 ${done.length} 次</span>
        <button class="btn plain sm" id="nextSent" style="margin-left:auto">换一句 →</button>
      </div>
      <div class="passage" style="max-height:none;background:#fffdf5" data-src="翻译原文">${App.esc(item.cn)}</div>
      <textarea id="sentInput" rows="4" style="margin-top:12px" placeholder="把上面的中文句子翻译成英文…（先抓关键表达，再组合成句）"></textarea>
      <div style="display:flex;gap:10px;margin-top:10px">
        <button class="btn big" id="sentGrade">🤖 提交评分</button>
        <button class="btn ghost" id="sentRef">👀 看参考译文（不计分）</button>
      </div>
      <div id="sentResult"></div>
    </div>`;
    el.querySelector('#nextSent').onclick = () => { sentIdx = (sentIdx + 1 + Math.floor(Math.random() * 3)) % bank.length; renderSentences(el); };
    el.querySelector('#sentGrade').onclick = () => {
      const text = el.querySelector('#sentInput').value.trim();
      if (App.grader.tokenize(text).length < 4) { App.toast('先写出你的英文译文'); return; }
      const r = App.grader.gradeSentence(text, item);
      App.store.sentPractice = App.store.sentPractice || [];
      App.store.sentPractice.push({ id: sentIdx % bank.length, date: App.today(), score: r.score });
      if (App.store.sentPractice.length > 500) App.store.sentPractice = App.store.sentPractice.slice(-400);
      App.save();
      showSentResult(el, item, r);
    };
    el.querySelector('#sentRef').onclick = () => showSentResult(el, item, null);
  }

  function showSentResult(el, item, r) {
    const box = el.querySelector('#sentResult');
    const icons = { good: '✅', warn: '⚠️', bad: '❌', info: '💡' };
    let html = '<hr class="hr"><div class="grid2" style="grid-template-columns:1fr 1fr;gap:12px">' +
      '<div style="background:#f7f8fd;border-radius:12px;padding:12px 14px"><b class="note">✍️ 我的译文</b><div class="essay-pane" style="margin-top:6px">' + App.esc(el.querySelector('#sentInput').value.trim() || '（空）') + '</div></div>' +
      '<div style="background:var(--teal-soft);border-radius:12px;padding:12px 14px"><b class="note">📖 参考译文</b><div class="essay-pane" style="margin-top:6px">' + App.esc(item.ref) + '</div></div></div>';
    if (r) {
      html += `<div class="score-dial" style="margin-top:12px">
        <svg width="90" height="90" viewBox="0 0 110 110"><circle cx="55" cy="55" r="46" fill="none" stroke="#edeff7" stroke-width="11"/><circle cx="55" cy="55" r="46" fill="none" stroke="${r.score >= 80 ? '#16a34a' : r.score >= 60 ? '#d97706' : '#dc2626'}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${(r.score / 100 * 289).toFixed(0)} 289" transform="rotate(-90 55 55)"/><text x="55" y="55" text-anchor="middle" font-size="26" font-weight="800">${r.score}</text><text x="55" y="75" text-anchor="middle" font-size="11" fill="#8b93ab">${r.grade}</text></svg>
        <div><b>AI 评分</b><div class="note">${r.summary}</div></div></div>`;
      html += r.items.map(it => `<div class="fb-item ${it.type}"><b>${icons[it.type]} ${App.esc(it.title)}</b><span>${App.esc(it.detail)}</span></div>`).join('');
    }
    html += '<h3 style="font-size:13.5px;margin-top:12px">关键表达</h3><div style="display:flex;flex-wrap:wrap;gap:8px">' +
      item.keys.map(k => '<span class="tag">' + App.esc(k) + '</span>').join('') + '</div>';
    box.innerHTML = html;
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function allPassages() { return window.TRANSLATION_PASSAGES || []; }

  function renderList(el) {
    const list = allPassages().filter(p => theme === '全部' || p.theme === theme);
    el.innerHTML = `
      <div class="card">
        <div class="tabs" style="margin-bottom:6px">${THEMES.map(t => '<button class="tab ' + (t === theme ? 'active' : '') + '" data-th="' + t + '">' + t + '</button>').join('')}</div>
        <div class="note">六级翻译常考中国文化、社会发展与科技经济三大主题。先自己译，再对照参考译文；批改引擎会核对<b>关键表达</b>是否译出，命中的表达自动进入积累本。</div>
      </div>
      <div class="grid3">${list.map(p => {
        const recs = App.store.translations.filter(t => t.pid === p.id);
        const best = recs.length ? Math.max(...recs.map(r => r.score)) : null;
        return `<div class="card" style="cursor:pointer" data-p="${p.id}">
          <span class="tag">${p.theme}</span>
          <h3 style="margin:8px 0 4px">${p.title}</h3>
          <div class="note" style="min-height:36px">${App.esc(p.cn.slice(0, 40))}…</div>
          <hr class="hr">
          <div style="display:flex;justify-content:space-between;font-size:13px"><span>${p.keys.length} 个关键表达</span><b>${best == null ? '未练习' : '最好 ' + best + ' 分'}</b></div>
        </div>`;
      }).join('')}</div>`;
    el.querySelectorAll('[data-th]').forEach(b => b.onclick = () => { theme = b.dataset.th; V.render(el); });
    el.querySelectorAll('[data-p]').forEach(c => c.onclick = () => V.render(el, { pid: c.dataset.p }));
  }

  function addExprs(p) {
    for (const k of p.keys) {
      if (!App.store.exprs.some(e => e.zh === k.zh && e.theme === p.theme)) {
        App.store.exprs.push({ zh: k.zh, en: k.en, theme: p.theme, d: App.today() });
      }
    }
    App.save();
  }

  function renderPractice(el, pid) {
    const p = allPassages().find(x => x.id === pid);
    if (!p) { V.render(el); return; }
    const done = App.store.translations.filter(t => t.pid === pid);
    let graded = done.length ? done[done.length - 1] : null;
    el.innerHTML = `<div class="card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <button class="btn plain sm" id="back">‹ 返回</button>
        <span class="tag">${p.theme}</span><b>${p.title}</b>
        <span class="note" style="margin-left:auto">${done.length ? '已练 ' + done.length + ' 次 · 最好 ' + Math.max(...done.map(d => d.score)) + ' 分' : '第一次练习'}</span>
      </div>
      <div class="passage" style="max-height:none;background:#fffdf5" data-src="翻译原文">${App.esc(p.cn)}</div>
      <textarea id="trInput" rows="8" style="margin-top:12px" placeholder="在此写下你的英文译文…（对照上面的中文段落，建议先抓每句的关键表达）"></textarea>
      <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">
        <button class="btn big" id="submit">🤖 提交批改</button>
        <button class="btn ghost" id="peek">👀 直接看参考译文</button>
      </div>
      <div id="result"></div>
    </div>`;

    el.querySelector('#back').onclick = () => V.render(el);
    const ta = el.querySelector('#trInput');
    if (graded) { ta.value = graded.text; showResult(el, p, graded, true); }
    el.querySelector('#submit').onclick = () => {
      const text = ta.value.trim();
      if (App.grader.tokenize(text).length < 15) { App.toast('译文太短啦，先译完再提交'); return; }
      const r = App.grader.gradeTranslation(text, p);
      graded = { date: App.today(), pid, title: p.title, theme: p.theme, text, score: r.score, missed: r.missedKeys.length };
      App.store.translations.push(graded);
      if (App.store.translations.length > 200) App.store.translations = App.store.translations.slice(-150);
      App.save();
      addExprs(p);
      showResult(el, p, r, false);
    };
    el.querySelector('#peek').onclick = () => {
      if (!App.confirmBox('直接看参考译文将不计入练习成绩，继续吗？')) return;
      addExprs(p);
      showResult(el, p, null, false, true);
    };
  }

  function showResult(el, p, r, cached, peekOnly) {
    const box = el.querySelector('#result');
    const icons = { good: '✅', warn: '⚠️', bad: '❌', info: '💡' };
    let html = '<hr class="hr"><h3>对照与点评</h3>';
    if (r) {
      html += `<div class="score-dial" style="margin-bottom:10px">
        <svg width="100" height="100" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="46" fill="none" stroke="#edeff7" stroke-width="11"/>
          <circle cx="55" cy="55" r="46" fill="none" stroke="${r.score >= 80 ? '#16a34a' : r.score >= 60 ? '#d97706' : '#dc2626'}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${(r.score / 100 * 289).toFixed(0)} 289" transform="rotate(-90 55 55)"/>
          <text x="55" y="52" text-anchor="middle" font-size="24" font-weight="800">${r.score}</text>
          <text x="55" y="72" text-anchor="middle" font-size="10.5" fill="#8b93ab">${r.band}</text>
        </svg>
        <div><b>AI 翻译批改${cached ? '（上次练习）' : ''}</b><div class="note" style="max-width:420px">${r.summary} 折算六级翻译分约 ${r.estCET} / 106.5。</div></div>
      </div>`;
    }
    html += `<div class="grid2" style="grid-template-columns:1fr 1fr;gap:12px">
      <div style="background:#f7f8fd;border-radius:12px;padding:12px 14px">
        <b class="note">✍️ 我的译文</b>
        <div class="essay-pane" style="margin-top:6px">${App.esc(el.querySelector('#trInput').value.trim() || '（空）')}</div>
      </div>
      <div style="background:var(--teal-soft);border-radius:12px;padding:12px 14px">
        <b class="note">📖 参考译文</b>
        <div class="essay-pane no-dict" style="margin-top:6px">${App.esc(p.ref)}</div>
      </div>
    </div>`;
    if (r) {
      if (r.missedKeys.length) {
        html += '<h3 style="font-size:13.5px;margin-top:14px">未译出的关键表达（已存入积累本）</h3>' +
          r.missedKeys.map(k => `<div class="fb-item warn"><b>${App.esc(k.zh)}</b><span>→ <b>${App.esc(k.en)}</b></span></div>`).join('');
      }
      if (r.dims) {
        html += '<div class="grid2" style="grid-template-columns:280px 1fr;align-items:center"><div><b style="font-size:13.5px;display:block;text-align:center;margin-bottom:4px">维度画像</b>' + App.charts.radar(r.dims) + '</div><div>' +
          r.items.map(it => `<div class="fb-item ${it.type}"><b>${icons[it.type]} ${App.esc(it.title)}</b><span>${App.esc(it.detail)}</span></div>`).join('') + '</div></div>';
      } else {
        html += r.items.map(it => `<div class="fb-item ${it.type}"><b>${icons[it.type]} ${App.esc(it.title)}</b><span>${App.esc(it.detail)}</span></div>`).join('');
      }
    }
    html += '<h3 style="font-size:13.5px;margin-top:14px">本篇关键表达</h3><div style="display:flex;flex-wrap:wrap;gap:8px">' +
      p.keys.map(k => '<span class="tag" title="' + App.esc(k.en) + '">' + App.esc(k.zh) + ' → ' + App.esc(k.en) + '</span>').join('') + '</div>';
    box.innerHTML = html;
    box.scrollIntoView({ behavior: 'smooth' });
  }

  function renderBook(el) {
    const byTheme = {};
    for (const e of App.store.exprs) (byTheme[e.theme] = byTheme[e.theme] || []).push(e);
    const done = App.store.translations;
    const trend = done.length >= 2 ? '<div class="card"><h3>📈 翻译成绩趋势 <span class="sub">' + done.length + ' 次练习</span></h3>' +
      App.charts.line({ series: [{ name: '批改得分', color: '#0d9488', data: done.map((t, i) => ({ x: (t.date || '') + ' #' + (done.length - i), y: t.score })) }], max: 100, min: 0 }) + '</div>' : '';
    el.innerHTML = trend + `<div class="card">
      <h3>📒 常用表达积累本 <span class="sub">练习与浏览过的表达自动收录 · 共 ${App.store.exprs.length} 条</span></h3>
      ${App.store.exprs.length ? Object.keys(byTheme).map(th => `
        <h3 style="font-size:13.5px;margin-top:12px"><span class="tag">${th}</span> ${byTheme[th].length} 条</h3>
        ${byTheme[th].map(e => `<div class="list-row"><div style="flex:1"><b style="font-size:13.5px">${App.esc(e.zh)}</b><div class="note" style="font-family:Georgia,serif">${App.esc(e.en)}</div></div><span class="note">${e.d}</span></div>`).join('')}`).join('')
      : '<div class="empty"><div class="big">📭</div>还没有积累的表达。完成一篇翻译练习后，本篇的关键表达会自动收进来。</div>'}
    </div>`;
  }
})();
