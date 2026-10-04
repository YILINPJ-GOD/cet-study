/* ===== 写作专项：智能批改 / 范文 / 模板 / 句式 / 过渡 ===== */
App.Views.writing = App.Views.writing || {};
(function () {
  let tab = 'grade';
  let curTopic = null, curFeedback = null;

  const V = App.Views.writing;
  V.render = function (el, param) {
    if (param && param.topicId) { tab = 'grade'; curTopic = (window.WRITING_TOPICS || []).find(t => t.id === param.topicId) || curTopic; }
    el.innerHTML = '<div class="tabs">' +
      [['grade', '🤖 AI 批改'], ['models', '📚 真题范文'], ['tpl', '🧱 高分模板'], ['sent', '✒️ 进阶句式'], ['trans', '🔗 万能过渡']]
        .map(([k, t]) => '<button class="tab ' + (tab === k ? 'active' : '') + '" data-t="' + k + '">' + t + '</button>').join('') + '</div><div id="wBody"></div>';
    el.querySelectorAll('.tab').forEach(b => b.onclick = () => { tab = b.dataset.t; V.render(el); });
    const body = el.querySelector('#wBody');
    if (tab === 'grade') renderGrade(body);
    else if (tab === 'models') renderModels(body);
    else if (tab === 'tpl') renderTpl(body);
    else if (tab === 'sent') renderSent(body);
    else renderTrans(body);
  };

  /* ---------- 批改 ---------- */
  function renderGrade(el) {
    const topics = window.WRITING_TOPICS || [];
    if (!curTopic) curTopic = topics[0];
    const essays = App.store.essays.slice().reverse();
    el.innerHTML = `
      <div class="card">
        <h3>选择题目 <span class="sub">按话题分类</span></h3>
        <div class="grid3" style="grid-template-columns:repeat(4,1fr)">
          ${topics.map(t => `<div class="topic-card ${curTopic && t.id === curTopic.id ? '' : 'no-dict'}" data-t="${t.id}" style="${curTopic && t.id === curTopic.id ? 'border-color:var(--pri);background:var(--pri-soft)' : ''}">
            <span class="tag">${t.cat}</span>
            <div class="tc-title" style="margin-top:6px;font-size:12.5px;line-height:1.5">${App.esc(t.title.replace(/^Directions:.*?essay\s*(related to|commenting on|on|to state your view[^.]*\.)?/i, '').slice(0, 60))}…</div>
          </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px">
          <div style="flex:1;min-width:260px"><b>题目：</b><span class="note">${App.esc(curTopic ? curTopic.title : '')}</span></div>
          <button class="btn ghost sm" id="showHint">💡 审题提示</button>
        </div>
        <div id="hintBox" style="display:none;background:var(--teal-soft);border-radius:10px;padding:10px 14px;margin-bottom:10px" class="note">${curTopic ? App.esc(curTopic.hint) : ''}</div>
        <textarea id="essay" rows="11" placeholder="在这里写作文…（写完后点下方按钮，本地批改引擎会从词数、结构、衔接、句式、用词、拼写六个维度评分并给出修改建议）">${curFeedback ? '' : ''}</textarea>
        <div style="display:flex;align-items:center;gap:14px;margin-top:10px;flex-wrap:wrap">
          <span class="note">词数：<b id="wc" class="mono">0</b> / 150–200</span>
          <span class="note">句子：<b id="sc" class="mono">0</b></span>
          <button class="btn big" id="gradeBtn" style="margin-left:auto">🤖 提交批改</button>
        </div>
        <div id="fbBox" style="margin-top:16px"></div>
      </div>
      <div class="card">
        <h3>我的批改历史 <span class="sub">${essays.length} 篇</span></h3>
        ${essays.length ? essays.slice(0, 8).map(e2 => `<div class="list-row"><span class="badge ${e2.score >= 80 ? 'ok' : e2.score >= 70 ? 'warn' : 'bad'}">${e2.score}分</span><div style="flex:1;min-width:0"><div style="font-size:13.5px" class="essay-pane">${App.esc(e2.text.slice(0, 80))}…</div><div class="note">${e2.date} · ${e2.cat || ''}</div></div><button class="btn plain sm" data-view="${e2.date}">查看</button></div>`).join('') : '<div class="empty">还没有批改记录</div>'}
      </div>`;
    // 事件
    el.querySelectorAll('[data-t]').forEach(c => c.onclick = () => { curTopic = topics.find(t => t.id === c.dataset.t); curFeedback = null; V.render(el); });
    el.querySelector('#showHint').onclick = () => { const h = el.querySelector('#hintBox'); h.style.display = h.style.display === 'none' ? 'block' : 'none'; };
    const ta = el.querySelector('#essay'), wc = el.querySelector('#wc'), sc = el.querySelector('#sc');
    const paint = () => {
      const words = App.grader.tokenize(ta.value).length;
      wc.textContent = words;
      wc.style.color = words >= 150 && words <= 200 ? 'var(--ok)' : words > 0 ? 'var(--warn)' : '';
      sc.textContent = ta.value.split(/[.!?]+/).filter(s => App.grader.tokenize(s).length > 2).length;
    };
    ta.oninput = paint;
    el.querySelector('#gradeBtn').onclick = () => {
      const text = ta.value.trim();
      if (App.grader.tokenize(text).length < 20) { App.toast('作文太短啦，先写几句再批改'); return; }
      const fb = App.grader.gradeWriting(text);
      curFeedback = fb;
      App.store.essays.push({ date: App.today(), topicId: curTopic ? curTopic.id : '', cat: curTopic ? curTopic.cat : '', text, score: fb.score, items: fb.items.length });
      if (App.store.essays.length > 60) App.store.essays = App.store.essays.slice(-50);
      App.save();
      renderFeedback(el.querySelector('#fbBox'), fb);
      el.querySelector('#fbBox').scrollIntoView({ behavior: 'smooth' });
    };
    el.querySelectorAll('[data-view]').forEach(b => b.onclick = () => {
      const rec = App.store.essays.find(e2 => e2.date === b.dataset.view);
      if (!rec) return;
      ta.value = rec.text; paint();
      const fb = App.grader.gradeWriting(rec.text);
      renderFeedback(el.querySelector('#fbBox'), fb, true);
      el.querySelector('#fbBox').scrollIntoView({ behavior: 'smooth' });
    });
    if (curFeedback) renderFeedback(el.querySelector('#fbBox'), curFeedback);
    paint();
  }

  function renderFeedback(box, fb, cached) {
    const icons = { good: ['✅', '亮点'], warn: ['⚠️', '建议'], bad: ['❌', '问题'], info: ['💡', '提示'] };
    box.innerHTML = `
      <div class="score-dial">
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="46" fill="none" stroke="#edeff7" stroke-width="11"/>
          <circle cx="55" cy="55" r="46" fill="none" stroke="${fb.score >= 80 ? '#16a34a' : fb.score >= 60 ? '#d97706' : '#dc2626'}" stroke-width="11" stroke-linecap="round"
            stroke-dasharray="${(fb.score / 100 * 289).toFixed(0)} 289" transform="rotate(-90 55 55)"/>
          <text x="55" y="52" text-anchor="middle" font-size="26" font-weight="800" fill="#1c2333">${fb.score}</text>
          <text x="55" y="72" text-anchor="middle" font-size="11" fill="#8b93ab">${fb.band}</text>
        </svg>
        <div><b style="font-size:16px">AI 批改报告${cached ? '（历史作文）' : ''}</b><div class="note" style="max-width:420px;margin-top:4px">${fb.summary}</div></div>
      </div>
      <hr class="hr">
      ${fb.items.map(it => `<div class="fb-item ${it.type}"><b>${icons[it.type][0]} ${App.esc(it.title)}</b><span>${App.esc(it.detail)}</span></div>`).join('')}
      <div class="note" style="margin-top:8px">批改维度：篇幅 · 结构 · 衔接 · 句式多样性 · 高级词汇 · 拼写规范。每次修改后重新提交，观察分数变化。</div>`;
  }

  /* ---------- 范文 ---------- */
  function renderModels(el) {
    const topics = window.WRITING_TOPICS || [];
    const cats = Array.from(new Set(topics.map(t => t.cat)));
    let curCat = cats[0];
    const paint = () => {
      const list = topics.filter(t => t.cat === curCat);
      el.innerHTML = `
        <div class="tabs" style="margin-bottom:14px">${cats.map(c => '<button class="tab ' + (c === curCat ? 'active' : '') + '" data-c="' + c + '">' + c + '</button>').join('')}</div>
        ${list.map(t => `<div class="card">
          <h3>${t.cat} · 范文赏析 <button class="btn ghost sm" data-go="${t.id}" style="margin-left:auto">✍️ 写这篇</button></h3>
          <div class="note" style="margin-bottom:8px"><b>题目：</b>${App.esc(t.title)}</div>
          <div style="background:var(--pri-soft);border-radius:10px;padding:10px 14px;margin-bottom:10px" class="note"><b>审题思路：</b>${App.esc(t.hint)}</div>
          <div class="passage essay-pane" data-src="范文" style="max-height:none">${App.esc(t.sample)}</div>
          <div class="note" style="margin:10px 0"><b>中文大意：</b>${App.esc(t.sampleNote)}</div>
          <h3 style="font-size:13.5px">可复用句式</h3>
          ${t.patterns.map(p => { const [en, cn] = p.split('|'); return '<div class="fb-item info"><b>✒️</b><span>' + App.esc(en) + '<br><span class="note">' + App.esc(cn || '') + '</span></span></div>'; }).join('')}
        </div>`).join('')}`;
      el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { curCat = b.dataset.c; paint(); });
      el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => V.render(el, { topicId: b.dataset.go }));
      el.querySelectorAll('.passage').forEach(p => App.dict.wrapWords(p));
    };
    paint();
  }

  /* ---------- 模板 ---------- */
  function renderTpl(el) {
    const tpls = window.WRITING_TEMPLATES || [];
    el.innerHTML = tpls.map(t => `<div class="card">
      <h3>🧱 ${t.name} <span class="sub">${t.desc}</span></h3>
      <div style="background:var(--teal-soft);border-radius:10px;padding:10px 14px" class="note"><b>结构骨架：</b>${App.esc(t.skeleton)}</div>
      <div style="margin-top:10px">${t.sentences.map(s => {
        const [en, cn] = s.split('|');
        return '<div class="fb-item info" style="align-items:flex-start"><b style="min-width:20px">▫</b><span style="font-family:Georgia,serif">' + App.esc(en) + '<br><span class="note" style="font-family:inherit">' + App.esc(cn || '') + '</span></span></div>';
      }).join('')}</div>
    </div>`).join('');
  }

  /* ---------- 句式 ---------- */
  function renderSent(el) {
    const sents = window.WRITING_SENTENCES || [];
    el.innerHTML = `<div class="card"><h3>✒️ 进阶句式库 <span class="sub">${sents.length} 个 · 写作时挑 1–2 个用即可</span></h3>
      ${sents.map(s => `<div class="fb-item info" style="align-items:flex-start">
        <b style="min-width:22px">✒️</b>
        <span style="font-family:Georgia,serif;font-size:14.5px">${App.esc(s.pat)}
        <br><span class="note" style="font-family:inherit">用法：${App.esc(s.cn)}</span>
        <br><span class="note" style="font-family:inherit;color:var(--teal)">例：${App.esc(s.eg)}</span></span>
      </div>`).join('')}</div>`;
  }

  /* ---------- 过渡 ---------- */
  function renderTrans(el) {
    const groups = window.WRITING_TRANSITIONS || [];
    el.innerHTML = `<div class="card"><h3>🔗 万能过渡语 <span class="sub">按功能分组 · 让段落逻辑显形</span></h3>
      ${groups.map(g => `<h3 style="font-size:13.5px;margin-top:14px">${g.group}</h3>
        ${g.items.map(([en, cn]) => `<div class="fb-item info"><b>${App.esc(en)}</b><span class="note">${App.esc(cn)}</span></div>`).join('')}`).join('')}
    </div>`;
  }
})();
