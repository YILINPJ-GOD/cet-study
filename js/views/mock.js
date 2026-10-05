/* ===== 冲刺模考：限时分区组卷 + 成绩报告 ===== */
App.Views.mock = App.Views.mock || {};
(function () {
  const SETS = [
    { id: 'A', name: '模考卷 A', essay: 'w1', careful: 'c1', matching: 'm1', cloze: 'k1', trans: 't7' },
    { id: 'B', name: '模考卷 B', essay: 'w3', careful: 'c2', matching: 'm2', cloze: 'k2', trans: 't9' }
  ];
  const SECS = [
    { key: 'writing', name: '✍️ 写作', min: 30 },
    { key: 'careful', name: '🔍 仔细阅读', min: 15 },
    { key: 'matching', name: '🧩 长篇阅读', min: 10 },
    { key: 'cloze', name: '🧪 选词填空', min: 8 },
    { key: 'trans', name: '🀄 翻译', min: 30 }
  ];
  let run = null; // {setId, secIdx, results:{writing:{score},careful:{c,t},...}}

  /* ===== 真题全卷模式：真实结构/时长/710 分制 ===== */
  App.Mock = {};
  App.Mock.REAL_SECS = [
    { key: 'writing', name: '✍️ 写作', short: '写作', min: 30 },
    { key: 'listening', name: '🎧 听力', short: '听力', min: 30 },
    { key: 'rcloze', name: '🧪 阅读·选词填空', short: '选词', min: 12, group: '阅读 40′' },
    { key: 'rmatch', name: '🧩 阅读·长篇匹配', short: '匹配', min: 12, group: '阅读 40′' },
    { key: 'rcareful', name: '🔍 阅读·仔细阅读', short: '仔细', min: 16, group: '阅读 40′' },
    { key: 'trans', name: '🀄 翻译', short: '翻译', min: 30 }
  ];
  App.Mock.REAL_LISTENING_SETS = { cet4: ['n1', 'c1', 'p1'], cet6: ['c5', 'p5', 'l1'] };
  App.Mock.REAL_READING_SETS = { cloze: 'k1', match: 'm1', careful: 'c1' };
  /* 710 分制折算：写作 106.5 · 听力 248.5 · 阅读 248.5 · 翻译 106.5 */
  App.Mock.scoreReal = function (r) {
    const w = Math.round(106.5 * (r.writing ? r.writing.score / 100 : 0));
    const l = Math.round(248.5 * (r.listening ? r.listening.c / Math.max(1, r.listening.t) : 0));
    const rd = Math.round(248.5 * (r.reading ? r.reading.c / Math.max(1, r.reading.t) : 0));
    const t = Math.round(106.5 * (r.translation ? r.translation.score / 100 : 0));
    return { writing: w, listening: l, reading: rd, translation: t, total: w + l + rd + t };
  };
  App.Mock.scoreQuick = function (r) {
    const readingC = (r.careful ? r.careful.c : 0) + (r.matching ? r.matching.c : 0) + (r.cloze ? r.cloze.c : 0);
    const readingT = (r.careful ? r.careful.t : 0) + (r.matching ? r.matching.t : 0) + (r.cloze ? r.cloze.t : 0);
    return {
      writing: r.writing ? Math.round(r.writing.score / 100 * 106.5) : 0,
      reading: Math.round(readingC / (readingT || 1) * 248.5),
      trans: r.trans ? r.trans.estCET : 0,
      readingDetail: readingC + '/' + readingT
    };
  };

  const V = App.Views.mock;
  V.reset = function () { run = null; };
  V.render = function (el) {
    if (run && run.mode === 'real') return renderRealRun(el);
    if (run) return renderRun(el);
    el.innerHTML = `
      <div class="card">
        <h3>⏱ 冲刺模考 <span class="sub">不含听力 · 全程限时 · 自动切区</span></h3>
        <div class="note" style="margin-bottom:12px">完整体验考场节奏：写作 30 分钟 → 仔细阅读 15 分钟 → 长篇阅读 10 分钟 → 选词填空 8 分钟 → 翻译 30 分钟，共约 93 分钟。每区到时自动提交进入下一区，中途不能回退。交卷后按六级分值折算预估分（写作 106.5 + 阅读 248.5 + 翻译 106.5；听力 248.5 分不在本模考范围内）。</div>
        <div class="grid2">
          ${SETS.map(s => {
            const last = App.store.mocks.filter(m => m.setId === s.id).pop();
            return `<div class="card" style="cursor:pointer;margin:0" data-set="${s.id}">
              <h3 style="margin-bottom:6px">${s.name}</h3>
              <div class="note">写作：${(window.WRITING_TOPICS || []).find(t => t.id === s.essay).cat} 话题 · 阅读：第 1-${SETS.indexOf(s) + 1} 套 · 翻译：${(window.TRANSLATION_PASSAGES || []).find(t => t.id === s.trans).title}</div>
              <div style="margin-top:10px">${last ? '<span class="badge ok">上次预估 ' + last.total + ' 分</span>' : '<span class="tag">未挑战</span>'}</div>
              <button class="btn" style="margin-top:12px">开始模考</button>
            </div>`;
          }).join('')}
        </div>
      </div>
      ${App.store.mocks.length ? `<div class="card"><h3>模考记录</h3>${App.store.mocks.slice().reverse().slice(0, 6).map(m => `<div class="list-row"><span class="tag">${m.date}</span><b>${m.setId} 卷</b><div style="flex:1" class="note">${m.mode === 'real' ? '真题全卷 · 710 制' : '写作 ' + (m.parts.writing || '—') + ' 分 · 阅读 ' + m.parts.reading + ' · 翻译 ' + (m.parts.trans || '—') + ' 分'}</div><span class="badge ${m.total >= (m.mode === 'real' ? 425 : 330) ? 'ok' : 'warn'}" style="font-size:13px">预估 ${m.total}${m.mode === 'real' ? '/710' : '/461.5'}</span></div>`).join('')}</div>` : ''}
      <div class="card">
        <h3>🏛 真题全卷模式 <span class="sub">真实结构 · 真实时长 · 710 分制 · 含听力</span></h3>
        <div class="note" style="margin-bottom:12px">完全对标真卷流程：<b>写作 30′ → 听力 30′ → 阅读 40′（选词/匹配/仔细）→ 翻译 30′</b>，共 130 分钟，到时自动切区。交卷按真卷分值折算 710 分制预估分（写作 106.5 · 听力 248.5 · 阅读 248.5 · 翻译 106.5）。<br>📌 题源说明：本模式题源为自编仿真题（结构对标 2020–2024 真卷）；真题原题受版权保护不予收录，冲刺阶段请搭配正版真题集，用本模式模拟考场节奏。</div>
        <button class="btn big" id="startReal">🏛 开始真题全卷（${App.examName()} · 130 分钟）</button>
        ${App.store.mocks.filter(m => m.mode === 'real').length ? '<span class="tag" style="margin-left:10px">已完成 ' + App.store.mocks.filter(m => m.mode === 'real').length + ' 次 · 最近 ' + App.store.mocks.filter(m => m.mode === 'real').pop().total + ' 分</span>' : ''}
      </div>`;
    el.querySelectorAll('[data-set]').forEach(c => c.onclick = () => {
      if (!App.confirmBox('模考全程约 93 分钟，中途退出不计成绩。确定开始吗？')) return;
      run = { setId: c.dataset.set, secIdx: 0, results: {} };
      renderRun(el);
    });
    const sr = el.querySelector('#startReal');
    if (sr) sr.onclick = () => {
      if (!App.confirmBox('真题全卷共 130 分钟（写作30 → 听力25 → 阅读40 → 翻译30），到时自动切区，中途退出不计成绩。确定开始吗？')) return;
      run = { mode: 'real', secIdx: 0, results: {} };
      renderRealRun(el);
    };
  }

  /* ===== 真题全卷运行 ===== */
  function renderRealRun(el) {
    if (run.secIdx >= App.Mock.REAL_SECS.length) return renderRealReport(el);
    const sec = App.Mock.REAL_SECS[run.secIdx];
    el.innerHTML = `
      <div class="card">
        <div class="steps">${App.Mock.REAL_SECS.map((s, i) => '<span class="step ' + (i < run.secIdx ? 'done' : i === run.secIdx ? 'cur' : '') + '">' + s.short + ' ' + s.min + '′</span>').join('')}</div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <b>${sec.name}</b>
          <span class="note">${sec.group || '真卷流程'} · 限时 ${sec.min} 分钟，到时自动提交</span>
          <span class="timer cool" style="margin-left:auto" id="secTimer">--:--</span>
          <button class="btn danger sm" id="abort">中止考试</button>
        </div>
      </div>
      <div id="secBody"></div>`;
    el.querySelector('#abort').onclick = () => {
      if (App.confirmBox('中止后本次真题全卷成绩将作废，确定？')) { run = null; V.render(el); }
    };
    const body = el.querySelector('#secBody');
    const timeLimit = sec.min * 60;
    let left = timeLimit;
    const tEl = el.querySelector('#secTimer');
    tEl.textContent = App.mmss(left);
    const tick = setInterval(() => { left--; if (tEl.isConnected) tEl.textContent = App.mmss(left); }, 1000);
    let autoTimer = null;
    const exam = App.store.profile.exam || 'cet6';
    const goNext = (result) => {
      clearInterval(tick);
      clearInterval(autoTimer);
      run.results[sec.key] = result;
      run.secIdx++;
      App.toast('「' + sec.short + '」已提交');
      renderRealRun(el);
    };
    let forceSubmit = null;
    if (sec.key === 'writing') {
      renderWritingSec(body, { essay: 'w1' }, goNext, f => forceSubmit = f);
    } else if (sec.key === 'listening') {
      const setIds = App.Mock.REAL_LISTENING_SETS[exam];
      const h = App.Listening.renderMock(body, goNext, { setIds });
      forceSubmit = h.forceSubmit;
    } else if (sec.key === 'rcloze' || sec.key === 'rmatch' || sec.key === 'rcareful') {
      const map = { rcloze: 'cloze', rmatch: 'matching', rcareful: 'careful' };
      App.Reading['render_' + map[sec.key]](body, App.Mock.REAL_READING_SETS[map[sec.key]], { timeLimit, onSubmit: goNext }, () => {});
      clearInterval(tick);
      tEl.style.display = 'none';
    } else if (sec.key === 'trans') {
      renderTransSec(body, { trans: exam === 'cet4' ? 't1' : 't7' }, goNext, f => forceSubmit = f);
    }
    // 到时自动提交（阅读三区由渲染器自带计时接管）
    if (sec.key === 'writing' || sec.key === 'listening' || sec.key === 'trans') {
      autoTimer = setInterval(() => {
        if (run == null) { clearInterval(autoTimer); return; }
        if (left > 0) return;
        clearInterval(autoTimer);
        App.toast('⏰ 「' + sec.short + '」时间到，自动提交');
        if (forceSubmit) forceSubmit();
      }, 1000);
    }
  }

  function renderRealReport(el) {
    const r = run.results;
    const s = App.Mock.scoreReal(r);
    const rec = { date: App.today(), setId: 'REAL', mode: 'real', parts: { writing: s.writing, listening: s.listening, reading: s.reading, translation: s.translation }, total: s.total };
    App.store.mocks.push(rec);
    if (r.writing && r.writing.text) {
      App.store.essays.push({ date: App.today() + '（真题卷）', topicId: 'w1', cat: '真题全卷', text: r.writing.text, score: r.writing.score, items: 0 });
    }
    App.save();
    el.innerHTML = `<div class="card" style="max-width:700px;margin:20px auto;text-align:center;padding:34px">
      <div style="font-size:46px">🏛</div>
      <h2>真题全卷完成！</h2>
      <div style="font-size:42px;font-weight:800;color:var(--pri);margin:8px 0">预估总分 ${s.total}<span style="font-size:16px;color:var(--ink3)"> / 710</span></div>
      <div class="grid4" style="grid-template-columns:repeat(4,1fr);text-align:left;margin:14px 0">
        <div class="stat-card"><div class="num" style="font-size:19px">${s.writing}<small>/106.5</small></div><div class="lab">写作</div></div>
        <div class="stat-card"><div class="num" style="font-size:19px">${s.listening}<small>/248.5</small></div><div class="lab">听力</div></div>
        <div class="stat-card"><div class="num" style="font-size:19px">${s.reading}<small>/248.5</small></div><div class="lab">阅读</div></div>
        <div class="stat-card"><div class="num" style="font-size:19px">${s.translation}<small>/106.5</small></div><div class="lab">翻译</div></div>
      </div>
      <div class="note" style="margin-bottom:14px">分值说明：写作 15% · 听力 35% · 阅读 35% · 翻译 15%（710 分制，与真卷一致）。听力和阅读的正确率详见各分区解析。</div>
      <button class="btn big" id="backMock">返回模考中心</button>
    </div>`;
    el.querySelector('#backMock').onclick = () => { run = null; V.render(el); };
  };

  function renderRun(el) {
    if (run.secIdx >= SECS.length) return renderReport(el);
    const set = SETS.find(s => s.id === run.setId);
    const sec = SECS[run.secIdx];
    el.innerHTML = `
      <div class="card">
        <div class="steps">${SECS.map((s, i) => '<span class="step ' + (i < run.secIdx ? 'done' : i === run.secIdx ? 'cur' : '') + '">' + s.name.replace(/^\S+\s/, '') + ' ' + s.min + '′</span>').join('')}</div>
        <div style="display:flex;align-items:center;gap:12px">
          <b>${sec.name}</b>
          <span class="note">限时 ${sec.min} 分钟，到时自动提交</span>
          <span class="timer cool" style="margin-left:auto" id="secTimer">--:--</span>
          <button class="btn danger sm" id="abort">中止模考</button>
        </div>
      </div>
      <div id="secBody"></div>`;
    el.querySelector('#abort').onclick = () => {
      if (App.confirmBox('中止后本次模考成绩将作废，确定？')) { run = null; V.render(el); }
    };
    const body = el.querySelector('#secBody');
    const timeLimit = sec.min * 60;
    // 区内倒计时显示
    let left = timeLimit;
    const tEl = el.querySelector('#secTimer');
    tEl.textContent = App.mmss(left);
    const tick = setInterval(() => { left--; if (tEl.isConnected) tEl.textContent = App.mmss(left); }, 1000);

    const goNext = (result) => {
      clearInterval(tick);
      run.results[sec.key] = result;
      run.secIdx++;
      App.toast('「' + sec.name.replace(/^\S+\s/, '') + '」已提交');
      renderRun(el);
    };
    const autoNext = () => { App.toast('⏰ 本区时间到，自动提交'); forceSubmit && forceSubmit(); };

    let forceSubmit = null;
    if (sec.key === 'writing') renderWritingSec(body, set, goNext, f => forceSubmit = f);
    else if (sec.key === 'trans') renderTransSec(body, set, goNext, f => forceSubmit = f);
    else {
      App.Reading['render_' + sec.key](body, set[sec.key], { timeLimit, onSubmit: goNext }, () => {});
      clearInterval(tick);          // 题型渲染器自带倒计时
      tEl.style.display = 'none';   // 隐藏外层计时，避免重复显示
    }
  }

  function renderWritingSec(body, set, done, regForce) {
    const topic = (window.WRITING_TOPICS || []).find(t => t.id === set.essay);
    body.innerHTML = `<div class="card">
      <div class="note" style="margin-bottom:8px"><b>题目：</b>${App.esc(topic.title)}</div>
      <textarea id="mEssay" rows="12" placeholder="考场作文：150–200 词，建议三段式…"></textarea>
      <div style="display:flex;align-items:center;gap:12px;margin-top:10px">
        <span class="note">词数：<b id="mWc">0</b></span>
        <button class="btn big" id="mSubmit" style="margin-left:auto">提交并进入下一区 →</button>
      </div></div>`;
    const ta = body.querySelector('#mEssay');
    ta.oninput = () => body.querySelector('#mWc').textContent = App.grader.tokenize(ta.value).length;
    const submit = () => {
      const text = ta.value.trim();
      if (App.grader.tokenize(text).length < 20 && !App.confirmBox('作文不足 20 词，仍要提交吗？')) return;
      const fb = App.grader.gradeWriting(text);
      done({ score: fb.score, text, estCET: Math.round(fb.score / 100 * 106.5) });
    };
    body.querySelector('#mSubmit').onclick = submit;
    regForce(submit);
  }

  function renderTransSec(body, set, done, regForce) {
    const p = (window.TRANSLATION_PASSAGES || []).find(t => t.id === set.trans);
    body.innerHTML = `<div class="card">
      <div class="passage" style="max-height:none;background:#fffdf5" data-src="翻译原文">${App.esc(p.cn)}</div>
      <textarea id="mTrans" rows="9" style="margin-top:12px" placeholder="考场翻译：先抓关键表达，再保证句子完整…"></textarea>
      <div style="display:flex;align-items:center;gap:12px;margin-top:10px">
        <span class="note">词数：<b id="mTc">0</b></span>
        <button class="btn big" id="mSubmit2" style="margin-left:auto">提交并交卷 →</button>
      </div></div>`;
    const ta = body.querySelector('#mTrans');
    ta.oninput = () => body.querySelector('#mTc').textContent = App.grader.tokenize(ta.value).length;
    const submit = () => {
      const text = ta.value.trim();
      if (App.grader.tokenize(text).length < 10 && !App.confirmBox('译文不足 10 词，仍要提交吗？')) return;
      const r = App.grader.gradeTranslation(text, p);
      done({ score: r.score, text, estCET: r.estCET });
    };
    body.querySelector('#mSubmit2').onclick = submit;
    regForce(submit);
  }

  function renderReport(el) {
    const set = SETS.find(s => s.id === run.setId);
    const r = run.results;
    const readingC = (r.careful ? r.careful.c : 0) + (r.matching ? r.matching.c : 0) + (r.cloze ? r.cloze.c : 0);
    const readingT = (r.careful ? r.careful.t : 0) + (r.matching ? r.matching.t : 0) + (r.cloze ? r.cloze.t : 0);
    const readingScore = Math.round(readingC / (readingT || 1) * 248.5);
    const writingScore = r.writing ? r.writing.estCET : 0;
    const transScore = r.trans ? r.trans.estCET : 0;
    const total = readingScore + writingScore + transScore;
    const rec = { date: App.today(), setId: set.id, parts: { writing: writingScore, reading: readingScore + '分(' + readingC + '/' + readingT + ')', trans: transScore }, total, detail: { careful: r.careful, matching: r.matching, cloze: r.cloze, writingScore: r.writing ? r.writing.score : 0, transScore: r.trans ? r.trans.score : 0 } };
    App.store.mocks.push(rec);
    App.save();
    el.innerHTML = `<div class="card" style="max-width:680px;margin:20px auto;text-align:center;padding:34px">
      <div style="font-size:46px">🏁</div>
      <h2>${set.name} 完成！</h2>
      <div style="font-size:40px;font-weight:800;color:var(--pri);margin:8px 0">预估总分 ${total}<span style="font-size:16px;color:var(--ink3)"> / 461.5（不含听力）</span></div>
      <div class="note" style="margin-bottom:16px">折算说明：写作 ${writingScore}/106.5 · 阅读 ${readingScore}/248.5（${readingC}/${readingT}）· 翻译 ${transScore}/106.5。含听力的 710 分制中，听力另占 248.5 分。</div>
      <div class="grid3" style="text-align:left">
        <div class="stat-card"><div class="num" style="font-size:20px">${r.writing ? r.writing.score : '—'}<small>/100</small></div><div class="lab">写作（AI批改）</div></div>
        <div class="stat-card"><div class="num" style="font-size:20px">${readingT ? Math.round(readingC / readingT * 100) + '%' : '—'}</div><div class="lab">阅读正确率</div></div>
        <div class="stat-card"><div class="num" style="font-size:20px">${r.trans ? r.trans.score : '—'}<small>/100</small></div><div class="lab">翻译（AI批改）</div></div>
      </div>
      <div style="margin-top:18px">
        <button class="btn big" id="backHome">返回模考中心</button>
      </div>
      <div class="note" style="margin-top:12px">模考中写作/翻译的详细 AI 批改报告，可到「写作专项→批改历史」回看（写作作文已保存）。</div>
    </div>`;
    // 模考作文也存入批改历史
    if (r.writing && r.writing.text) {
      App.store.essays.push({ date: App.today() + '（模考' + set.id + '）', topicId: set.essay, cat: '模考', text: r.writing.text, score: r.writing.score, items: 0 });
      App.save();
    }
    el.querySelector('#backHome').onclick = () => { run = null; V.render(el); };
  }
})();
