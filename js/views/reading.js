/* ===== 阅读专项：仔细阅读 / 长篇匹配 / 选词填空 ===== */
App.Views.reading = App.Views.reading || {};
App.Reading = {}; // 模考复用的题型渲染器

(function () {
  const TYPES = {
    careful: { name: '仔细阅读', desc: '1 篇文章 + 5 道四选一，考细节、推理、主旨与词义', icon: '🔍' },
    matching: { name: '长篇阅读', desc: '9 段文章 + 5 句信息匹配，练定位关键词的能力', icon: '🧩' },
    cloze: { name: '选词填空', desc: '15 个备选词填 10 个空，考词性判断与上下文语义', icon: '🧪' }
  };
  const DATA = { careful: () => window.READING_CAREFUL || [], matching: () => window.READING_MATCHING || [], cloze: () => window.READING_CLOZE || [] };

  function bestScore(type, id) {
    const recs = App.store.practice.reading.filter(r => r.type === type && r.id === id);
    if (!recs.length) return null;
    return Math.max(...recs.map(r => Math.round(r.c / r.t * 100)));
  }
  function record(type, id, c, t, sec) {
    App.store.practice.reading.push({ d: Date.now(), type, id, c, t, sec: sec || 0 });
    if (App.store.practice.reading.length > 600) App.store.practice.reading = App.store.practice.reading.slice(-500);
    App.save();
  }

  /* ---------- 做题查词：先记录，交卷后统一显示释义 ---------- */
  const READING_TIME = 600; // 阅读专项每篇限时 10 分钟
  function lookupBarHtml(lookups) {
    return '<b>🔍 本次已查词 (' + lookups.length + ')</b>' + (lookups.length
      ? '：<span class="tag">' + lookups.join('</span> <span class="tag">') + '</span> <span class="note">释义将在交卷后显示</span>'
      : '<span class="note">做题时点击文章中的生词即可记录，交卷后统一显示释义</span>');
  }
  function recapHtml(lookups) {
    if (!lookups.length) return '';
    return '<div class="card" id="lookupRecap"><h3>📖 本次查词释义回顾 <span class="sub">' + lookups.length + ' 个词 · 做题时不显示，现在集中学</span></h3>'
      + lookups.map(w => {
        const e = App.dict.lookup(w);
        return '<div class="list-row"><b style="min-width:110px;font-size:15px">' + App.esc(w) + '</b>'
          + '<div style="flex:1" class="note">' + (e ? (e.ipa ? '/' + App.esc(e.ipa) + '/ ' : '') + App.esc(e.pos) + ' ' + App.esc(e.gloss)
            : '暂未收录释义') + '</div>'
          + '<button class="ico-btn ' + (App.dict.inBook(w) ? 'starred' : '') + '" data-book="' + App.esc(w) + '">' + (App.dict.inBook(w) ? '✓ 已加入' : '＋生词本') + '</button></div>';
      }).join('') + '</div>';
  }
  function mountRecap(el, lookups) {
    if (!lookups.length) return;
    el.insertAdjacentHTML('beforeend', recapHtml(lookups));
    const recap = el.querySelector('#lookupRecap');
    recap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    recap.querySelectorAll('[data-book]').forEach(b => b.onclick = () => {
      App.dict.addToBook(b.dataset.book, '阅读查词');
      b.textContent = '✓ 已加入'; b.classList.add('starred');
    });
  }

  const V = App.Views.reading;
  V.render = function (el, param) {
    if (param && param.type && param.id) return App.Reading['render_' + param.type](el, param.id, param.opts || {}, () => V.render(el, { type: param.type }));
    if (param && param.type) return renderType(el, param.type);
    if (param && param.gen) return renderGen(el);
    const supply = App.Gen.autoSupply();
    const genTotal = App.Gen.bankFor('careful').length + App.Gen.bankFor('cloze').length;
    el.innerHTML = '<div class="grid3">' + Object.keys(TYPES).map(k => {
      const t = TYPES[k];
      const sets = DATA[k]();
      const done = App.store.practice.reading.filter(r => r.type === k);
      const acc = done.length ? Math.round(done.reduce((a, r) => a + r.c / r.t, 0) / done.length * 100) : null;
      return `<div class="card" style="cursor:pointer" data-type="${k}">
        <div style="font-size:30px">${t.icon}</div>
        <h3 style="margin:8px 0 4px">${t.name}</h3>
        <div class="note" style="min-height:42px">${t.desc}</div>
        <hr class="hr">
        <div style="display:flex;justify-content:space-between;font-size:13px"><span>${sets.length} 篇题源</span><b>${acc == null ? '未开练' : '平均正确率 ' + acc + '%'}</b></div>
      </div>`;
    }).join('') + '</div>' +
    `<div class="card">
      <h3>🎯 智能出题 <span class="sub">选主题，即时生成全新文章与题目</span></h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <select class="selct" id="genType">
          <option value="careful">仔细阅读（5 题）</option>
          <option value="cloze">选词填空（15 选 10）</option>
        </select>
        <select class="selct" id="genTheme">
          ${App.Gen.themes().map(t => '<option value="' + t.key + '">' + t.label + '</option>').join('')}
        </select>
        <button class="btn" id="genBtn">✨ 生成新题</button>
        <span class="badge ok" id="genStock">🤖 题源库 ${genTotal} 篇${supply.careful + supply.cloze > 0 ? ' · 今日已自动补充 ' + (supply.careful + supply.cloze) + ' 篇' : ''}</span>
      </div>
      <div class="note" style="margin-top:8px">生成器按主题模板即时组装全新文章与题目（细节/词义/主旨全覆盖，选词填空自动配 15 选项与逐空解析），每次生成的文章都不同；练习成绩照常计入趋势。<b>每天打开应用会自动补充新题</b>，做完题库也不会枯竭。</div>
    </div>` +
    `<div class="card"><h3>💡 练法建议</h3><div class="note">每个题型单独训练手感和节奏：仔细阅读限时 <b>9 分钟/篇</b>，长篇阅读 <b>7 分钟/篇</b>，选词填空 <b>6 分钟/篇</b>（正式考试阅读部分共 40 分钟）。做题时<b>点击文章中的任何单词</b>即可查释义并加入生词本。</div></div>`;
    el.querySelectorAll('[data-type]').forEach(c => c.onclick = () => V.render(el, { type: c.dataset.type }));
    el.querySelector('#genBtn').onclick = () => {
      const type = el.querySelector('#genType').value;
      const theme = el.querySelector('#genTheme').value;
      const set = type === 'cloze' ? App.Gen.makeCloze(theme) : App.Gen.makeCareful(theme);
      if (!set) { App.toast('生成失败，请重试'); return; }
      App.store.genBank.push({ id: set.id, type, theme, date: App.today(), set });
      App.save();
      App.Reading['render_' + type](el, set.id, { set }, () => V.render(el));
    };
  }

  function renderGen(el) { /* 预留 */ }

  function renderType(el, type) {
    const t = TYPES[type];
    const sets = DATA[type]();
    const genSets = App.Gen.bankFor(type);
    el.innerHTML = `<div class="card"><h3>${t.icon} ${t.name} <button class="btn plain sm" id="back" style="margin-left:auto">‹ 返回</button></h3>
      <div class="note" style="margin-bottom:12px">${t.desc}</div>
      <div class="grid3">${sets.map((s, i) => {
        const best = bestScore(type, s.id);
        return `<div class="topic-card" data-id="${s.id}">
          <div class="tc-title">${s.title}</div>
          <div class="tc-meta">第 ${i + 1} 篇 · ${type === 'careful' ? '5 题' : type === 'matching' ? s.paras.length + ' 段 5 题' : '15 选 10'}</div>
          <div style="margin-top:8px">${best == null ? '<span class="tag">未做过</span>' : '<span class="badge ' + (best >= 70 ? 'ok' : best >= 50 ? 'warn' : 'bad') + '">最好成绩 ' + best + '%</span>'}</div>
        </div>`;
      }).join('')}</div>
      ${genSets.length ? `<hr class="hr"><h3 style="font-size:14px">🤖 智能生成题源 <span class="sub">${genSets.length} 篇 · 自动补充</span></h3>
      <div class="grid3">${genSets.map(g => {
        const best = bestScore(type, g.set.id);
        return `<div class="topic-card" data-gen="${g.id}">
          <div class="tc-title">${App.esc(g.set.title)} <span class="badge lv2">🤖</span></div>
          <div class="tc-meta">${g.date} · ${(window.GEN_THEMES[g.theme] || {}).label || ''}</div>
          <div style="margin-top:8px">${best == null ? '<span class="tag">未做过</span>' : '<span class="badge ' + (best >= 70 ? 'ok' : best >= 50 ? 'warn' : 'bad') + '">最好成绩 ' + best + '%</span>'}</div>
        </div>`;
      }).join('')}</div>` : ''}
    </div>`;
    el.querySelector('#back').onclick = () => V.render(el);
    el.querySelectorAll('.topic-card').forEach(c => c.onclick = () => {
      if (c.dataset.gen) {
        const g = App.Gen.bankFor(type).find(x => x.set.id === c.dataset.gen);
        if (g) return App.Reading['render_' + type](el, g.set.id, { set: g.set }, () => V.render(el, { type }));
      }
      V.render(el, { type, id: c.dataset.id });
    });
  }

  /* ---------- 计时器工具 ---------- */
  function startTimer(el, limitSec, onEnd) {
    let left = limitSec;
    const paint = () => { const t = el.querySelector('.timer'); if (t) { t.textContent = App.mmss(left); if (left <= 60) t.classList.remove('cool'); } };
    paint();
    const timer = setInterval(() => {
      left--;
      if (left <= 0) { clearInterval(timer); onEnd(); return; }
      paint();
    }, 1000);
    return { stop: () => clearInterval(timer), elapsed: limitSec - left, left: () => left };
  }

  /* ---------- 仔细阅读 ---------- */
  App.Reading.render_careful = function (el, id, opts, onBack) {
    const set = opts.set || (window.READING_CAREFUL || []).find(s => s.id === id);
    if (!set) { el.innerHTML = '<div class="card">题库未加载</div>'; return; }
    const answers = new Array(set.questions.length).fill(null);
    const lookups = [];
    el.innerHTML = `<div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <button class="btn plain sm" id="back">‹ 返回</button><b>${set.title}</b>
        <span style="margin-left:auto" class="timer cool">--:--</span>
        <button class="btn sm" id="submit">交卷</button>
      </div>
      <div class="passage" data-src="仔细阅读" data-defer="1">${set.text.split(/\n+/).map(p => '<p>' + App.esc(p) + '</p>').join('')}</div>
      <div id="lookupBar" class="note" style="margin-top:10px"></div>
    </div>
    <div class="card">
      <h3>题目</h3>
      <div id="qList">${set.questions.map((q, i) => `
        <div style="margin-bottom:18px">
          <b>${i + 1}. ${App.esc(q.q)}</b>
          ${q.opts.map((o, j) => `<div class="opt" data-q="${i}" data-o="${j}"><span class="k">${'ABCD'[j]}</span><span>${App.esc(o)}</span></div>`).join('')}
          <div class="exp" id="exp${i}" style="display:none"></div>
        </div>`).join('')}</div>
    </div>`;
    const pass = el.querySelector('.passage');
    App.dict.wrapWords(pass);
    const bar = el.querySelector('#lookupBar');
    bar.innerHTML = lookupBarHtml(lookups);
    App.dict.onDeferredLookup = w => { if (!lookups.includes(w)) { lookups.push(w); bar.innerHTML = lookupBarHtml(lookups); } };
    el.querySelector('#back').onclick = onBack;
    el.querySelectorAll('.opt').forEach(o => o.onclick = () => {
      const qi = +o.dataset.q;
      el.querySelectorAll('.opt[data-q="' + qi + '"]').forEach(x => x.classList.remove('sel'));
      o.classList.add('sel');
      answers[qi] = +o.dataset.o;
    });
    const t = startTimer(el, opts.timeLimit || READING_TIME, () => doSubmit(true));
    function doSubmit(auto) {
      if (answers.includes(null) && !auto && !App.confirmBox('还有题目没作答，确定交卷吗？')) return;
      t.stop();
      pass.removeAttribute('data-defer');
      const c = answers.filter((a, i) => a === set.questions[i].a).length;
      record('careful', id, c, set.questions.length, t.elapsed);
      el.querySelectorAll('.opt').forEach(o => {
        const qi = +o.dataset.q, oi = +o.dataset.o;
        o.style.pointerEvents = 'none';
        if (oi === set.questions[qi].a) o.classList.add('right');
        else if (answers[qi] === oi) o.classList.add('wrong');
      });
      set.questions.forEach((q, i) => {
        const exp = el.querySelector('#exp' + i);
        exp.style.display = 'block';
        exp.className = 'fb-item ' + (answers[i] === q.a ? 'good' : 'bad');
        exp.innerHTML = '<b>' + (answers[i] === q.a ? '✓ 正确' : '✗ 你的答案：' + (answers[i] == null ? '未作答 · ' : String.fromCharCode(65 + answers[i]) + ' · ')) + '正确：' + String.fromCharCode(65 + q.a) + '</b><span>' + App.esc(q.exp) + '</span>';
      });
      const sub = el.querySelector('#submit'); sub.disabled = true; sub.textContent = '已交卷';
      const acc = Math.round(c / set.questions.length * 100);
      el.querySelector('.timer').outerHTML = '<span class="badge ' + (acc >= 70 ? 'ok' : acc >= 50 ? 'warn' : 'bad') + '" style="font-size:14px;padding:4px 14px">得分 ' + c + '/' + set.questions.length + '（' + acc + '%）</span>';
      bar.innerHTML = '<b>🔍 本次已查词 (' + lookups.length + ')</b>：<span class="note">释义见下方回顾</span>';
      mountRecap(el, lookups);
      el.querySelector('#qList').scrollIntoView({ behavior: 'smooth' });
      App.toast(auto ? '⏰ 时间到，已自动交卷' : '交卷成功：' + acc + '%');
      if (opts.onSubmit) opts.onSubmit({ c, t: set.questions.length });
    }
    el.querySelector('#submit').onclick = () => doSubmit(false);
  };

  /* ---------- 长篇匹配 ---------- */
  App.Reading.render_matching = function (el, id, opts, onBack) {
    const set = (window.READING_MATCHING || []).find(s => s.id === id);
    if (!set) { el.innerHTML = '<div class="card">题库未加载</div>'; return; }
    const letters = set.paras.map(p => p[0]);
    const picks = new Array(set.items.length).fill(null);
    const lookups = [];
    el.innerHTML = `<div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <button class="btn plain sm" id="back">‹ 返回</button><b>${set.title}</b>
        <span style="margin-left:auto" class="timer cool">--:--</span><button class="btn sm" id="submit">交卷</button>
      </div>
      <div class="passage" data-src="长篇阅读" data-defer="1" style="max-height:480px">${set.paras.map(([L, txt]) => '<div class="par-row"><span class="pl">' + L + '</span><p style="margin:0">' + App.esc(txt) + '</p></div>').join('')}</div>
      <div id="lookupBar" class="note" style="margin-top:10px"></div>
    </div>
    <div class="card"><h3>把下列句子与原文段落匹配</h3>
      ${set.items.map((it, i) => `<div style="margin-bottom:14px">
        <b>${i + 1}. ${App.esc(it.stmt)}</b>
        <div style="margin-top:6px">
          <select class="selct" data-i="${i}"><option value="">选择段落…</option>${letters.map(L => '<option value="' + L + '">' + L + '</option>').join('')}</select>
          <span class="note" id="note${i}" style="display:none;margin-left:8px"></span>
        </div>
        <div class="fb-item" id="exp${i}" style="display:none"></div>
      </div>`).join('')}
    </div>`;
    App.dict.wrapWords(el.querySelector('.passage'));
    const mBar = el.querySelector('#lookupBar');
    mBar.innerHTML = lookupBarHtml(lookups);
    App.dict.onDeferredLookup = w => { if (!lookups.includes(w)) { lookups.push(w); mBar.innerHTML = lookupBarHtml(lookups); } };
    el.querySelector('#back').onclick = onBack;
    const t = startTimer(el, opts.timeLimit || READING_TIME, () => doSubmit(true));
    function doSubmit(auto) {
      if (picks.includes(null) && !auto && !App.confirmBox('还有题目没作答，确定交卷吗？')) return;
      t.stop();
      el.querySelector('.passage').removeAttribute('data-defer');
      let c = 0;
      set.items.forEach((it, i) => {
        const sel = el.querySelector('select[data-i="' + i + '"]');
        sel.disabled = true;
        const ok = picks[i] === it.a;
        if (ok) c++;
        const note = el.querySelector('#note' + i);
        note.style.display = 'inline';
        note.innerHTML = ok ? '<span class="badge ok">✓ ' + it.a + '</span>' : '<span class="badge bad">✗ 你的答案 ' + (picks[i] || '未答') + ' · 正确 ' + it.a + '</span>';
        const exp = el.querySelector('#exp' + i);
        exp.style.display = 'flex';
        exp.innerHTML = '<b>解析</b><span>' + App.esc(it.exp) + '</span>';
      });
      record('matching', id, c, set.items.length, t.elapsed);
      const sub = el.querySelector('#submit'); sub.disabled = true; sub.textContent = '已交卷';
      const acc = Math.round(c / set.items.length * 100);
      el.querySelector('.timer').outerHTML = '<span class="badge ' + (acc >= 70 ? 'ok' : acc >= 50 ? 'warn' : 'bad') + '" style="font-size:14px;padding:4px 14px">得分 ' + c + '/' + set.items.length + '（' + acc + '%）</span>';
      mBar.innerHTML = '<b>🔍 本次已查词 (' + lookups.length + ')</b>：<span class="note">释义见下方回顾</span>';
      mountRecap(el, lookups);
      App.toast(auto ? '⏰ 时间到，已自动交卷' : '交卷成功：' + acc + '%');
      if (opts.onSubmit) opts.onSubmit({ c, t: set.items.length });
    }
    el.querySelector('#submit').onclick = () => doSubmit(false);
    el.querySelectorAll('select[data-i]').forEach(sel => sel.onchange = () => { picks[+sel.dataset.i] = sel.value || null; });
  };

  /* ---------- 选词填空 ---------- */
  App.Reading.render_cloze = function (el, id, opts, onBack) {
    const set = opts.set || (window.READING_CLOZE || []).find(s => s.id === id);
    if (!set) { el.innerHTML = '<div class="card">题库未加载</div>'; return; }
    const N = 10;
    const picks = new Array(N).fill(null);
    const lookups = [];
    const paras = set.text.split(/\n+/);
    el.innerHTML = `<div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <button class="btn plain sm" id="back">‹ 返回</button><b>${set.title}</b>
        <span style="margin-left:auto" class="timer cool">--:--</span><button class="btn sm" id="submit">交卷</button>
      </div>
      <div style="background:var(--warn-soft);border-radius:10px;padding:10px 14px;margin-bottom:12px">
        <b>备选词（A–O）：</b>
        <span data-src="选词填空" data-defer="1">${set.options.map((o, i) => '<span class="dict-word" data-w="' + o + '"><b>' + String.fromCharCode(65 + i) + '</b>. ' + o + '</span>').join('　')}</span>
      </div>
      <div class="passage" data-src="选词填空" data-defer="1" id="pass">${paras.map(p => '<p>' + App.esc(p) + '</p>').join('')}</div>
      <div id="lookupBar" class="note" style="margin-top:10px"></div>
    </div>`;
    // 把 {n} 替换成下拉框（在转义后的文本上处理）
    const pass = el.querySelector('#pass');
    pass.innerHTML = pass.innerHTML.replace(/\((\d+)\)____/g, '($1)____').replace(/\{(\d+)\}/g, (m, n) => {
      const i = +n - 1;
      let opts2 = '<option value="">?'+n+'</option>';
      set.options.forEach((o, j) => { opts2 += '<option value="' + j + '">' + String.fromCharCode(65 + j) + '. ' + o + '</option>'; });
      return '<select class="selct blank-sel" data-b="' + i + '">' + opts2 + '</select>';
    });
    App.dict.wrapWords(pass);
    const kBar = el.querySelector('#lookupBar');
    kBar.innerHTML = lookupBarHtml(lookups);
    App.dict.onDeferredLookup = w => { if (!lookups.includes(w)) { lookups.push(w); kBar.innerHTML = lookupBarHtml(lookups); } };
    el.querySelector('#back').onclick = onBack;
    el.querySelectorAll('select[data-b]').forEach(sel => sel.onchange = () => { picks[+sel.dataset.b] = sel.value === '' ? null : +sel.value; });
    const t = startTimer(el, opts.timeLimit || READING_TIME, () => doSubmit(true));
    function doSubmit(auto) {
      if (picks.includes(null) && !auto && !App.confirmBox('还有空没填，确定交卷吗？')) return;
      t.stop();
      pass.removeAttribute('data-defer');
      el.querySelector('[data-src="选词填空"]').removeAttribute('data-defer');
      let c = 0;
      set.a.forEach((ai, i) => {
        const sel = el.querySelector('select[data-b="' + i + '"]');
        sel.disabled = true;
        const ok = picks[i] === ai;
        if (ok) c++;
        sel.style.borderColor = ok ? 'var(--ok)' : 'var(--bad)';
        sel.style.background = ok ? 'var(--ok-soft)' : 'var(--bad-soft)';
        if (!ok) sel.style.borderColor = 'var(--bad)';
      });
      record('cloze', id, c, N, t.elapsed);
      const sub = el.querySelector('#submit'); sub.disabled = true; sub.textContent = '已交卷';
      const acc = Math.round(c / N * 100);
      el.querySelector('.timer').outerHTML = '<span class="badge ' + (acc >= 70 ? 'ok' : acc >= 50 ? 'warn' : 'bad') + '" style="font-size:14px;padding:4px 14px">得分 ' + c + '/' + N + '（' + acc + '%）</span>';
      kBar.innerHTML = '<b>🔍 本次已查词 (' + lookups.length + ')</b>：<span class="note">释义见下方回顾</span>';
      mountRecap(el, lookups);
      // 解析
      const expCard = document.createElement('div');
      expCard.className = 'card';
      expCard.innerHTML = '<h3>逐空解析</h3>' + set.a.map((ai, i) => {
        const ok = picks[i] === ai;
        return '<div class="fb-item ' + (ok ? 'good' : 'bad') + '"><b>' + (i + 1) + '. ' + (ok ? '✓ ' : '✗ 正确 ') + String.fromCharCode(65 + ai) + '. ' + set.options[ai] + '</b><span>' + App.esc(set.exp[i]) + '</span></div>';
      }).join('');
      el.appendChild(expCard);
      expCard.scrollIntoView({ behavior: 'smooth' });
      App.toast(auto ? '⏰ 时间到，已自动交卷' : '交卷成功：' + acc + '%');
      if (opts.onSubmit) opts.onSubmit({ c, t: N });
    }
    el.querySelector('#submit').onclick = () => doSubmit(false);
  };
})();
