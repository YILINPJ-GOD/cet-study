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

  const V = App.Views.mock;
  V.render = function (el) {
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
      ${App.store.mocks.length ? `<div class="card"><h3>模考记录</h3>${App.store.mocks.slice().reverse().slice(0, 6).map(m => `<div class="list-row"><span class="tag">${m.date}</span><b>${m.setId} 卷</b><div style="flex:1" class="note">写作 ${m.parts.writing || '—'} 分 · 阅读 ${m.parts.reading} · 翻译 ${m.parts.trans || '—'} 分</div><span class="badge ${m.total >= 330 ? 'ok' : 'warn'}" style="font-size:13px">预估 ${m.total}/461.5</span></div>`).join('')}</div>` : ''}`;
    el.querySelectorAll('[data-set]').forEach(c => c.onclick = () => {
      if (!App.confirmBox('模考全程约 93 分钟，中途退出不计成绩。确定开始吗？')) return;
      run = { setId: c.dataset.set, secIdx: 0, results: {} };
      renderRun(el);
    });
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
