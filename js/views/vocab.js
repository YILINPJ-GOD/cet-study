/* ===== 词汇记忆系统：SRS 任务 / 词库浏览 / 速刷 / 统计 ===== */
App.Views.vocab = App.Views.vocab || {};
(function () {
  let tab = 'task';
  let session = null;   // {queue:[{entry, isNew, quiz?}], idx, ok, total}
  let flash = null;     // {stack:[entry], idx, flipped}

  const V = App.Views.vocab;
  V.reset = function () { tab = 'task'; session = null; flash = null; rootQuiz = null; };
  V.render = function (el) {
    el.innerHTML = '<div class="tabs">' +
      [['task', '🎯 今日任务'], ['bank', '📖 词库'], ['roots', '🧩 词根词缀'], ['flash', '⚡ 速刷'], ['stat', '📊 统计']]
        .map(([k, t]) => '<button class="tab ' + (tab === k ? 'active' : '') + '" data-t="' + k + '">' + t + '</button>').join('') + '</div><div id="vBody"></div>';
    el.querySelectorAll('.tab').forEach(b => b.onclick = () => { tab = b.dataset.t; session = null; rootQuiz = null; V.render(el); });
    const body = el.querySelector('#vBody');
    if (tab === 'task') renderTask(body);
    else if (tab === 'bank') renderBank(body);
    else if (tab === 'roots') renderRoots(body);
    else if (tab === 'flash') renderFlash(body);
    else renderStat(body);
  };

  /* ---------- 今日任务 ---------- */
  function renderTask(el) {
    const plan = App.planToday();
    if (!App.store.profile.placed) {
      el.innerHTML = '<div class="card"><div class="empty"><div class="big">🧭</div>先花 5 分钟做入学测试，我会为你定级并安排每天的背词任务。<br><br><button class="btn" onclick="App.go(\'placement\')">去测试</button></div></div>';
      return;
    }
    if (session) { renderSession(el); return; }
    const news = App.newWords();
    const due = App.dueWords();
    el.innerHTML = `
      <div class="card">
        <h3>今日任务 <span class="sub">${App.today()} · 按间隔重复算法安排</span></h3>
        <div class="grid2">
          <div class="stat-card"><div class="num">${plan.newDone}<small> / ${plan.newTotal}</small></div><div class="lab">今日新词（还剩 ${plan.newTotal - plan.newDone} 个）</div></div>
          <div class="stat-card"><div class="num">${plan.revDone}<small> / ${plan.revTotal}</small></div><div class="lab">今日复习（到期 ${due.length} 个）</div></div>
        </div>
        ${news.length + due.length === 0 ? '<div class="empty" style="padding:26px">🎉 今日任务已完成！<br>可以到「词库」预习、去「速刷」巩固，或练一篇阅读。</div>' :
        `<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">
          <button class="btn big" id="startAll">开始学习（新词 ${news.length} + 复习 ${due.length}）</button>
          ${due.length ? '<button class="btn ghost" id="startRev">只复习</button>' : ''}
          ${news.length ? '<button class="btn ghost" id="startNew">只学新词</button>' : ''}
        </div>`}
      </div>
      <div class="card"><h3>记忆机制</h3>
      <div class="note">每个词按 <b>认识 → 1天后 → 2天 → 4天 → 8天 → 15天 → 30天</b> 的间隔重复安排复习，答错立即回到队首重新记。新词先看卡片，再进入四种考查轮换：英译中 · 中译英 · 拼写 · 听音辨词。</div></div>`;
    const start = (mode) => {
      const q = [];
      if (mode !== 'new') due.forEach(w => q.push({ entry: App.WMAP()[w], isNew: false }));
      if (mode !== 'rev') news.forEach(e => q.push({ entry: e, isNew: true }));
      session = { queue: q, idx: 0, ok: 0, newDone: 0 };
      renderSession(el);
    };
    const b1 = el.querySelector('#startAll'); if (b1) b1.onclick = () => start('all');
    const b2 = el.querySelector('#startRev'); if (b2) b2.onclick = () => start('rev');
    const b3 = el.querySelector('#startNew'); if (b3) b3.onclick = () => start('new');
  }

  function renderSession(el) {
    const s = session;
    if (s.idx >= s.queue.length) return renderSessionDone(el);
    const item = s.queue[s.idx];
    const e = item.entry;
    const ex = window.EXAMPLES && window.EXAMPLES[e.w];
    el.innerHTML = `
      <div class="card" style="max-width:640px;margin:0 auto">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span class="badge lv${e.lv}">${App.LV[e.lv].name}档 · ${item.isNew ? '新词' : '复习'} ${s.idx + 1}/${s.queue.length}</span>
          <button class="btn plain sm" id="quit">结束并保存</button>
        </div>
        <div id="cardBox"></div>
      </div>`;
    el.querySelector('#quit').onclick = () => { session = null; V.render(el); };
    const box = el.querySelector('#cardBox');

    if (item.isNew && !item.quiz) {
      // 新词学习卡
      App.speak(e.w);   // 单词第一次出现自动朗读
      box.innerHTML = `
        <div class="flashcard" style="cursor:default">
          <div class="fw">${e.w} <button class="ico-btn" id="spk">🔊</button></div>
          <div class="fi">/${e.ipa}/ · ${e.pos}</div>
          <div class="fg">${e.gloss}</div>
          ${ex ? '<div class="fe">' + App.esc(ex[0]) + '<br>' + App.esc(ex[1]) + '</div>' : ''}
          <div class="hint">记住后选择下方按钮，这个词将按间隔重复安排复习</div>
        </div>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:16px">
          <button class="btn" style="background:var(--ok)" id="easy">😊 认识了</button>
          <button class="btn plain" id="hard">😅 有点难</button>
        </div>`;
      box.querySelector('#spk').onclick = () => App.speak(e.w);
      box.querySelector('#easy').onclick = () => { App.srsReview(e.w, true); App.recordVocab(true, true); next(el); };
      box.querySelector('#hard').onclick = () => { App.srsReview(e.w, false); App.recordVocab(true, false); App.dict.addToBook(e.w, '新词-难记'); next(el); };
      } else {
      // ===== 复习：回忆式（看词→自评→翻面→确认）=====
      App.speak(e.w);   // 自动朗读
      const ex = window.EXAMPLES && window.EXAMPLES[e.w];
      const exHtml = ex ? `<div class="fe" style="margin-top:12px;font-style:italic">${App.esc(ex[0])}<br>${App.esc(ex[1])}</div>` : '';
      box.innerHTML = `
        <div class="flashcard" style="cursor:default">
          <div class="fw">${e.w} <button class="ico-btn" id="spk">🔊</button></div>
          <div class="fi">/${e.ipa}/ · ${e.pos}</div>
          <div class="hint" style="margin-top:10px">回忆这个词的意思，然后自评</div>
        </div>
        <div style="display:flex;gap:12px;justify-content:center;margin-top:16px" id="selfRate">
          <button class="btn" style="background:var(--ok);min-width:90px" data-r="know">😊 认识</button>
          <button class="btn plain" style="min-width:90px;border-color:var(--warn);color:var(--warn)" data-r="fuzzy">🤔 模糊</button>
          <button class="btn" style="background:var(--bad);min-width:90px" data-r="forget">😅 忘记</button>
        </div>
        <div id="revealArea" style="margin-top:14px;display:none">
          <div style="background:var(--pri-soft);border-radius:12px;padding:14px 16px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:var(--ink)">${App.esc(e.gloss)}</div>
            ${exHtml}
          </div>
          <div style="display:flex;gap:12px;justify-content:center;margin-top:12px">
            <button class="btn" style="background:var(--ok)" id="confirmNext">✓ 下一个</button>
            <button class="btn plain" id="confirmWrong" style="border-color:var(--bad);color:var(--bad)">✗ 我记错了</button>
          </div>
        </div>`;
      box.querySelector('#spk').onclick = () => App.speak(e.w);
      box.querySelectorAll('#selfRate [data-r]').forEach(btn => btn.onclick = () => {
        // 翻面：显示释义 + 确认按钮
        box.querySelector('#selfRate').style.display = 'none';
        const reveal = box.querySelector('#revealArea');
        reveal.style.display = 'block';
        const rate = btn.dataset.r; // know / fuzzy / forget
        // SRS 评分：know=正确升级，fuzzy=停留当前箱，forget=降回箱0
        const srsOk = rate === 'know';
        const fuzzy = rate === 'fuzzy';
        App.srsReview(e.w, srsOk, fuzzy);
        App.recordVocab(false, srsOk);
        if (!srsOk) s.queue.push({ entry: e, isNew: false }); // 忘记/模糊 → 队尾重做
        if (fuzzy) {
          box.querySelector('#confirmNext').textContent = '↻ 再看一遍';
          box.querySelector('#confirmWrong').textContent = '✓ 我记住了，下一个';
        }
        box.querySelector('#confirmNext').onclick = () => { if (fuzzy) { App.srsReview(e.w, true); } next(el); };
        box.querySelector('#confirmWrong').onclick = () => { App.srsReview(e.w, false); App.recordVocab(false, false); next(el); };
      });
      // quiz 模式保留为可选路径（通过设置切换）
      if (item.quiz) {
        // ===== 备用：测验模式（5 种选择题）=====
        const q = item.quiz;
        let inner;
        if (q.mode === 'e2c') {
          inner = `<div class="flashcard" style="cursor:default"><div class="fw">${q.word} <button class="ico-btn" id="spk2">🔊</button></div><div class="hint">看词选义：选择正确释义</div></div>` +
            q.opts.map((o, i) => `<div class="opt" data-i="${i}"><span class="k">${'ABCD'[i]}</span><span>${App.esc(o.text)}</span></div>`).join('');
        } else if (q.mode === 'c2e') {
          inner = `<div class="flashcard" style="cursor:default"><div class="fg">${App.esc(e.gloss)}</div><div class="hint">中英互译：选择对应的英文单词</div></div>` +
            q.opts.map((o, i) => `<div class="opt" data-i="${i}"><span class="k">${'ABCD'[i]}</span><span style="font-weight:700">${App.esc(o.text)}</span></div>`).join('');
        } else if (q.mode === 'listen') {
          inner = `<div class="flashcard" style="cursor:default"><button class="btn ghost big" id="spk2" style="font-size:22px">🔊 点击听音</button><div class="hint">听音辨词：选出发音对应的单词</div></div>` +
            q.opts.map((o, i) => `<div class="opt" data-i="${i}"><span class="k">${'ABCD'[i]}</span><span style="font-weight:700">${App.esc(o.text)}</span></div>`).join('');
        } else {
          const isC2ET = q.mode === 'c2et';
          inner = `<div class="flashcard" style="cursor:default"><div class="fg">${App.esc(e.gloss)}</div><div class="fi">${e.pos || ''}</div>${isC2ET ? '' : `<div class="fi">提示：${q.hint}（共 ${e.w.length} 个字母）</div>`}<div class="hint">${isC2ET ? '中英互译：默写出这个单词' : '拼写默写：输入这个单词'}</div></div>
            <input class="txt" id="spellInput" style="text-align:center;font-size:20px;letter-spacing:2px" placeholder="输入拼写后回车" autocomplete="off">`;
        }
        // 备用模式入口按钮
        box.innerHTML = `
          <div style="text-align:center;margin-bottom:8px"><button class="btn ghost sm" id="backSelf">← 返回回忆模式</button></div>` + inner;
        const spk2 = box.querySelector('#spk2'); if (spk2) spk2.onclick = () => App.speak(q.word);
        const answer2 = (ok) => {
          App.srsReview(q.word, ok);
          App.recordVocab(false, ok);
          if (ok) s.ok++;
          if (!ok) s.queue.push({ entry: e, isNew: false });
          setTimeout(() => next(el), ok ? 350 : 900);
        };
        if (q.mode === 'spell') {
          const inp = box.querySelector('#spellInput');
          inp.focus();
          inp.onkeydown = ev => { if (ev.key === 'Enter') { const v = inp.value.trim().toLowerCase(); if (!v) return; if (v === q.word) { inp.style.borderColor = 'var(--ok)'; answer2(true); } else { inp.style.borderColor = 'var(--bad)'; inp.value = q.word; App.toast('正确拼写：' + q.word); answer2(false); } } };
        } else {
          box.querySelectorAll('.opt').forEach(o => o.onclick = () => {
            const i2 = +o.dataset.i;
            const correct = i2 === q.answer;
            box.querySelectorAll('.opt').forEach((oo, j) => { if (j === q.answer) oo.classList.add('right'); });
            if (!correct) o.classList.add('wrong'); else o.classList.add('right');
            if (q.mode === 'listen' || q.mode === 'c2e') App.speak(q.word);
            answer2(correct, false);
          });
        }
      }
    }
  }

  function next(el) {
    session.idx++;
    App.save();
    renderSession(el);
  }

  function renderSessionDone(el) {
    const s = session;
    const rate = s.queue.length ? Math.round(s.ok / s.queue.length * 100) : 100;
    el.innerHTML = `<div class="card" style="max-width:560px;margin:26px auto;text-align:center;padding:34px">
      <div style="font-size:44px">🎉</div><h2>本轮完成！</h2>
      <p style="color:var(--ink2)">共 ${s.queue.length} 词 · 作答正确率 ${rate}%<br>
      错词已自动排入稍后复习队列</p>
      <div class="note" style="margin:10px 0 16px">${App.dayStat().sec >= App.CHECKIN_SEC ? '✅ 今日已打卡' : '继续学习可累计打卡时长'}</div>
      <button class="btn big" id="back">返回任务面板</button></div>`;
    el.querySelector('#back').onclick = () => { session = null; V.render(el); };
  }

  /* ---------- 词库浏览（按档位筛选 + 自定义词导入） ---------- */
  App.importCustomCSV = function (text) {
    const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
    App.store.customWords = App.store.customWords || [];
    // 先清词库缓存，确保去重基于最新词库状态
    App._words = null; App._wmap = null;
    const existing = new Set(App.store.customWords.map(c => c.w));
    // 与主词库/词典已有词去重（重复导入无意义）
    const bank = App.WMAP();
    let added = 0, dup = 0, bad = 0;
    for (const line of lines) {
      // 每行 1-4 列：单词[,音标][,词性][,释义]，支持逗号/中文逗号/Tab 分隔
      const parts = line.split(/[,\t，]/).map(s => s.trim()).filter(s => s !== '');
      if (!parts.length) continue;
      const w = parts[0].toLowerCase().replace(/[^a-z'-]/g, '');
      if (!w || w.length < 2) { bad++; continue; }
      if (existing.has(w) || bank[w]) { dup++; continue; }
      // 音标/词性/释义按列特征识别：斜杠包裹或含 ɑɪʃ 视为音标；以 n./v./adj. 等开头的为词性
      let ipa = '', pos = '', gloss = '';
      for (const p of parts.slice(1)) {
        if (!ipa && /^\/.+\/$/.test(p)) { ipa = p.replace(/\//g, ''); continue; }
        if (!pos && /^(n|v|adj|adv|prep|conj|pron|num|vt|vi|aux)\./i.test(p)) { pos = p; continue; }
        if (!gloss) { gloss = p; continue; }
        gloss += '；' + p;
      }
      App.store.customWords.push({ w, ipa, pos, gloss: gloss || '（自定义词，未附释义）' });
      existing.add(w);
      added++;
    }
    App._words = null; App._wmap = null;
    App.save();
    return { added, dup, bad };
  };

  function renderBank(el) {
    const exam = App.store.profile.exam || 'cet6';
    const tiers = App.banksOf(exam);
    let tierFilter = '', kw = '', shown = 80;
    el.innerHTML = `
      <div class="card">
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px">
          <input class="txt" id="kw" placeholder="搜索单词或释义…" style="flex:1;min-width:200px" value="">
          <button class="btn ghost sm" id="csvBtn">⬆ 导入自定义词</button>
          <input type="file" id="csvFile" accept=".csv,.txt" style="display:none">
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px">
          <div id="lvChips">
            <button class="btn sm" data-tier="">全部</button>
            ${(App.store.customWords && App.store.customWords.length ? ['custom'] : []).concat(tiers).map(t => '<button class="btn sm plain" data-tier="' + t + '">' + App.TIERS[t].label + '</button>').join('')}
          </div>
        </div>
        <div id="csvMsg" class="note" style="margin-bottom:8px">导入格式：每行一个词，可选「单词,音标,词性,释义」（逗号/Tab 分隔均可），# 开头为注释行。导入的词将<b>优先</b>进入每日背词队列。</div>
        <div id="wordList"></div>
        <div style="text-align:center;margin-top:12px"><button class="btn plain" id="more">加载更多</button></div>
      </div>`;
    const list = el.querySelector('#wordList');
    const paint = () => {
      const kwL = kw.toLowerCase();
      let ws = App.allWords().filter(w =>
        (!tierFilter || w.tier === tierFilter) &&
        (!kwL || w.w.includes(kwL) || w.gloss.includes(kw)));
      ws = ws.slice(0, shown);
      list.innerHTML = ws.map(w => {
        const st = App.srsStatus(w.w);
        const inBook = App.dict.inBook(w.w);
        const tierLabel = (App.TIERS[w.tier] || {}).label || '';
        const senseMark = w.examSense ? ' <span class="badge warn">常考义</span>' : '';
        const delBtn = w.tier === 'custom' ? '<button class="btn danger sm" data-delcw="' + w.w + '">删除</button>' : '';
        return `<div class="list-row" style="cursor:pointer" data-w="${w.w}">
          <div style="flex:1;min-width:0">
            <b>${w.w}</b> <span class="note">/${w.ipa}/ ${w.pos}</span>
            ${inBook ? '<span class="badge warn">生词本</span>' : ''}
            ${st.cls ? '<span class="badge ' + st.cls + '">' + st.label + '</span>' : ''}
            <div class="note" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${App.esc(w.gloss)}${senseMark}</div>
          </div>
          <span class="note">${tierLabel}</span>${delBtn}
        </div>`;
      }).join('') || '<div class="empty">没有找到匹配的单词</div>';
      list.querySelectorAll('.list-row').forEach(r => r.onclick = (ev) => {
        if (ev.target.closest('[data-delcw]')) return;
        ev.stopPropagation();
        const rect = r.getBoundingClientRect();
        App.dict.open(r.dataset.w, Math.max(20, rect.right - 340), rect.top + 8, '词库浏览');
      });
      list.querySelectorAll('[data-delcw]').forEach(b => b.onclick = (ev) => {
        ev.stopPropagation();
        const w = b.dataset.delcw;
        if (!App.confirmBox('从我的词库删除「' + w + '」？（学习记录一并清除）')) return;
        App.store.customWords = (App.store.customWords || []).filter(c => c.w !== w);
        delete App.store.srs[w];
        App._words = null; App._wmap = null;
        App.save();
        paint();
      });
      el.querySelector('#more').style.display = ws.length >= shown ? '' : 'none';
    };
    el.querySelectorAll('#lvChips [data-tier]').forEach(b => b.onclick = () => {
      tierFilter = b.dataset.tier;
      el.querySelectorAll('#lvChips [data-tier]').forEach(bb => bb.className = 'btn sm ' + (bb.dataset.tier === tierFilter ? '' : 'plain'));
      shown = 80; paint();
    });
    el.querySelector('#kw').oninput = e => { kw = e.target.value.trim(); shown = 80; paint(); };
    el.querySelector('#more').onclick = () => { shown += 120; paint(); };
    el.querySelector('#csvBtn').onclick = () => el.querySelector('#csvFile').click();
    el.querySelector('#csvFile').onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        const r = App.importCustomCSV(rd.result);
        App.toast('导入完成：新增 ' + r.added + ' · 重复跳过 ' + r.dup + ' · 无效 ' + r.bad);
        V.render(el);
      };
      rd.readAsText(f);
    };
    paint();
  }

  /* ---------- 词根词缀：浏览 + 拆解推断练习 ---------- */
  let rootQuiz = null;
  function renderRoots(el) {
    const roots = window.WORD_ROOTS || [];
    if (rootQuiz) return renderRootQuiz(el);
    el.innerHTML = `<div class="card">
      <h3>🧩 词根词缀 · 单词拆解 <button class="btn ghost sm" id="rootQuizBtn" style="margin-left:auto">🎮 拆解推断练习</button></h3>
      <div class="note" style="margin:6px 0 10px">一个词根 = 一串单词。先记住词根含义，见到生词拆一拆：前缀（改意思）+ 词根（核心义）+ 后缀（改词性）。词根库共 ${roots.length} 个，前缀 ${Object.keys(window.WORD_PREFIXES || {}).length} 个，后缀 ${Object.keys(window.WORD_SUFFIXES || {}).length} 个。</div>
      <input class="txt" id="rootKw" placeholder="搜索词根/含义/派生词，如 spect、看、inspect…" style="margin-bottom:10px">
      <div class="grid3" id="rootGrid"></div>
      <div id="rootDetail" style="margin-top:14px"></div>
    </div>`;
    const grid = el.querySelector('#rootGrid');
    const detail = el.querySelector('#rootDetail');
    const kwEl = el.querySelector('#rootKw');
    const paintGrid = () => {
      const kw = (kwEl.value || '').trim().toLowerCase();
      const list = roots.filter(r => !kw || r.r.includes(kw) || r.m.includes(kw) || r.ex.some(x => x[0].includes(kw) || (x[1] || '').includes(kw)));
      grid.innerHTML = list.map(r => `<div class="topic-card" data-r="${r.r}">
        <div class="tc-title"><span style="font-family:Georgia,serif;color:var(--pri)">${r.r}</span> <span class="tag">${r.m}</span></div>
        <div class="tc-meta">${r.ex.slice(0, 3).map(x => x[0]).join(' · ')}…</div>
      </div>`).join('') || '<div class="empty">没有匹配的词根</div>';
      grid.querySelectorAll('[data-r]').forEach(c => c.onclick = () => {
        const rr = roots.find(x => x.r === c.dataset.r);
        detail.innerHTML = `<div class="card" style="margin:0">
          <h3><span style="font-family:Georgia,serif;color:var(--pri)">${rr.r}</span> = ${rr.m} <span class="sub">${rr.ex.length} 个派生词</span></h3>
          ${rr.ex.map(x => `<div class="fb-item info"><b>${x[0]}</b><span>${App.esc(x[2] || '')}<br><span class="note">${App.esc(x[1] || (App.WMAP()[x[0]] || {}).gloss || '')}</span></span></div>`).join('')}
        </div>`;
        detail.scrollIntoView({ behavior: 'smooth' });
      });
    };
    kwEl.oninput = paintGrid;
    paintGrid();
    el.querySelector('#rootQuizBtn').onclick = () => {
      const q = makeRootQuiz();
      if (!q) { App.toast('词根数据加载中'); return; }
      rootQuiz = q;
      renderRootQuiz(el);
    };
  }

  function makeRootQuiz() {
    const roots = (window.WORD_ROOTS || []).filter(r => r.ex && r.ex.length);
    if (!roots.length) return null;
    const r = roots[Math.floor(Math.random() * roots.length)];
    const target = r.ex[Math.floor(Math.random() * r.ex.length)];
    const bank = App.WMAP();
    const correct = (bank[target[0]] || {}).gloss || target[1] || '';
    const pool = shuffle2(roots.flatMap(x => x === r ? [] : x.ex)).filter(x => x[0] !== target[0]);
    const opts = shuffle2([[correct, true]].concat(pool.slice(0, 3).map(p => [(bank[p[0]] || {}).gloss || p[1], false])));
    return {
      root: r, word: target[0],
      exp: target[2] || (r.r + ' = ' + r.m),
      opts: opts.map(o => o[0]),
      answer: opts.findIndex(o => o[1])
    };
  }
  function shuffle2(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function renderRootQuiz(el) {
    const q = rootQuiz;
    el.innerHTML = `<div class="card" style="max-width:620px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <button class="btn plain sm" id="backRoots">‹ 返回词根表</button>
        <span class="tag">词根：${q.root.r} = ${q.root.m}</span>
      </div>
      <div class="flashcard" style="cursor:default">
        <div class="fw">${q.word}</div>
        <div class="hint">已知词根 <b style="color:var(--pri)">${q.root.r}</b>（${q.root.m}），推断这个词的含义</div>
      </div>
      <div id="rqOpts">${q.opts.map((o, i) => `<div class="opt" data-i="${i}"><span class="k">${'ABCD'[i]}</span><span>${App.esc(o)}</span></div>`).join('')}</div>
      <div id="rqFb"></div>
    </div>`;
    el.querySelector('#backRoots').onclick = () => { rootQuiz = null; renderRoots(el); };
    el.querySelectorAll('#rqOpts .opt').forEach(o => o.onclick = () => {
      const i = +o.dataset.i;
      const ok = i === q.answer;
      el.querySelectorAll('#rqOpts .opt').forEach((oo, j) => { if (j === q.answer) oo.classList.add('right'); });
      if (!ok) o.classList.add('wrong'); else o.classList.add('right');
      el.querySelectorAll('#rqOpts .opt').forEach(x => x.style.pointerEvents = 'none');
      el.querySelector('#rqFb').innerHTML = `<div class="fb-item ${ok ? 'good' : 'bad'}"><b>${ok ? '✓ 推断正确' : '✗ 应选 ' + 'ABCD'[q.answer]}</b><span>拆解：${App.esc(q.exp)}<br><button class="btn ghost sm" id="nextQ" style="margin-top:6px">下一题 →</button></span></div>`;
      el.querySelector('#nextQ').onclick = () => { rootQuiz = makeRootQuiz(); renderRootQuiz(el); };
    });
  }

  /* ---------- 速刷 ---------- */
  function renderFlash(el) {
    if (!flash || !flash.stack.length) {
      const pool = App.shuffle(App.allWords().filter(w => App.store.srs[w.w] || App.dict.inBook(w.w)));
      el.innerHTML = `<div class="card" style="max-width:560px;margin:20px auto;text-align:center;padding:30px">
        <div style="font-size:40px">⚡</div><h2>碎片速刷</h2>
        <p style="color:var(--ink2)">从你学过和收藏的 ${pool.length} 个词里随机抽卡，点击卡片翻面自评，适合排队、通勤时快速过词。速刷结果同样计入记忆进度。</p>
        ${pool.length ? '<button class="btn big" id="go">开始速刷</button>' : '<div class="note" style="margin:14px 0">还没有可速刷的词，先去「今日任务」学几个词吧。</div>'}
      </div>`;
      const b = el.querySelector('#go'); if (b) b.onclick = () => { flash = { stack: pool.slice(0, 50), idx: 0, flipped: false, ok: 0 }; renderFlash(el); };
      return;
    }
    const f = flash;
    if (f.idx >= f.stack.length) {
      el.innerHTML = `<div class="card" style="max-width:560px;margin:26px auto;text-align:center;padding:34px">
        <div style="font-size:44px">⚡</div><h2>速刷完成</h2><p>共 ${f.stack.length} 张卡 · 自评认识 ${f.ok} 个</p>
        <button class="btn big" id="again">再来一轮</button></div>`;
      el.querySelector('#again').onclick = () => { flash = null; renderFlash(el); };
      return;
    }
    const e = f.stack[f.idx];
    const ex = window.EXAMPLES && window.EXAMPLES[e.w];
    if (!f.flipped) App.speak(e.w);   // 速刷卡正面：单词首次出现自动朗读
    el.innerHTML = `<div class="card" style="max-width:560px;margin:20px auto">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <span class="badge lv${e.lv}">${App.LV[e.lv].name}档</span><span class="note">${f.idx + 1} / ${f.stack.length}</span>
      </div>
      <div class="flashcard" id="fc">
        ${f.flipped ?
          `<div class="fg" style="font-size:22px">${e.gloss}</div><div class="fi">/${e.ipa}/ · ${e.pos}</div>${ex ? '<div class="fe">' + App.esc(ex[0]) + '<br>' + App.esc(ex[1]) + '</div>' : ''}<div class="hint">这个词你真的记住了吗？</div>` :
          `<div class="fw">${e.w}</div><div class="fi">点击卡片查看释义</div>`}
      </div>
      ${f.flipped ? `<div style="display:flex;gap:12px;justify-content:center;margin-top:16px">
        <button class="btn" style="background:var(--ok)" id="knew">😊 认识</button>
        <button class="btn plain" id="forgot">😅 不认识</button></div>` : ''}
      <div style="text-align:center;margin-top:10px"><button class="btn plain sm" id="skip">跳过</button></div>
    </div>`;
    el.querySelector('#fc').onclick = () => { f.flipped = !f.flipped; renderFlash(el); };
    el.querySelector('#skip').onclick = () => { f.idx++; f.flipped = false; renderFlash(el); };
    const k = el.querySelector('#knew'), fo = el.querySelector('#forgot');
    if (k) k.onclick = () => { App.srsReview(e.w, true); f.ok++; f.idx++; f.flipped = false; App.save(); renderFlash(el); };
    if (fo) fo.onclick = () => { App.srsReview(e.w, false); App.dict.addToBook(e.w, '速刷-不认识'); f.idx++; f.flipped = false; App.save(); renderFlash(el); };
  }

  /* ---------- 统计 ---------- */
  function renderStat(el) {
    const st = App.vocabStats();
    const boxes = st.boxes.map((v, i) => ({ label: ['新学', '1天', '2天', '4天', '8天', '15天', '30天'][i] || '', value: v, color: i >= 4 ? '#16a34a' : '#6366f1' }));
    const today = App.dayStat();
    el.innerHTML = `
      <div class="grid4" style="grid-template-columns:repeat(4,1fr)">
        <div class="stat-card"><div class="num">${st.total}</div><div class="lab">词库总词数</div></div>
        <div class="stat-card"><div class="num">${st.learning}</div><div class="lab">在学</div></div>
        <div class="stat-card"><div class="num">${st.mastered}</div><div class="lab">已掌握</div></div>
        <div class="stat-card"><div class="num">${st.acc == null ? '—' : st.acc + '%'}</div><div class="lab">考查正确率</div></div>
      </div>
      <div class="grid2" style="margin-top:18px">
        <div class="card"><h3>记忆阶段分布</h3>${App.charts.bars({ data: boxes, max: Math.max(10, ...st.boxes) })}</div>
        <div class="card"><h3>今日词汇</h3>
          <div style="display:flex;gap:22px;margin:8px 0 16px">
            <div><div class="num" style="font-size:24px;font-weight:800">${today.newW || 0}</div><div class="note">新词</div></div>
            <div><div class="num" style="font-size:24px;font-weight:800">${today.revW || 0}</div><div class="note">复习</div></div>
          </div>
          <div class="note">「新学」= 刚开始记的词；「30天」= 即将长期掌握。坚持每天清空任务队列，记忆曲线会把你带到长期记忆区。</div>
        </div>
      </div>`;
  }
})();
