/* ===== 入学水平测试：20题 / 5分钟 / 选完自动跳题 / 交卷后逐词回顾 ===== */
App.Views.placement = App.Views.placement || {};
(function () {
  let state = null; // {qs, idx, answers, left, timer, spokenIdx, locked}

  function build() {
    const words = App.allWords();
    const pick = (tier, n) => App.randPick(words.filter(w => w.tier === tier), n);
    // 四级：常用为主；六级：常用→六级高频→六级冲刺梯度抽题
    const mix = App.store.profile.exam === 'cet4'
      ? [['t4c', 10], ['t4h', 6], ['t4s', 4]]
      : [['t4c', 5], ['t4h', 3], ['t6h', 7], ['t6s', 5]];
    const sel = mix.reduce((acc, [tier, n]) => acc.concat(pick(tier, n)), []);
    return sel.map(entry => {
      const ds = App.glossDistractors(entry, 3);
      const opts = App.shuffle([entry].concat(ds)).map(e => e.gloss);
      return { w: entry.w, gloss: entry.gloss, tier: entry.tier, opts, answer: opts.indexOf(entry.gloss) };
    });
  }

  function result(s) {
    const byLv = { 1: [0, 0], 2: [0, 0], 3: [0, 0] };
    s.qs.forEach((q, i) => {
      const lv = (App.TIERS[q.tier] || {}).lv || 2;
      byLv[lv][1]++;
      if (s.answers[i] === q.answer) byLv[lv][0]++;
    });
    const total = s.answers.filter((a, i) => a === s.qs[i].answer).length;
    // 逐词回顾：每题的正确/错误明细
    const review = s.qs.map((q, i) => ({
      w: q.w,
      ok: s.answers[i] === q.answer,
      your: s.answers[i] == null ? '未作答' : q.opts[s.answers[i]],
      correct: q.opts[q.answer]
    }));
    let lv, label, desc;
    if (total <= 8) { lv = 1; label = '基础起步'; desc = '建议从「常用」档开始背，每天 8 个新词，稳步打牢地基。'; }
    else if (total <= 14) { lv = 2; label = '进阶提升'; desc = '建议从「高频」档开始背，每天 12 个新词，重点突破高频词。'; }
    else { lv = 3; label = '冲刺强化'; desc = '基础扎实！建议从「冲刺」档开始，每天 15 个新词，向高分冲刺。'; }
    const dailyNew = App.LV[lv].dailyNew;
    return { total, byLv, lv, label, desc, dailyNew, review };
  }

  const V = App.Views.placement;
  V.reset = function () { if (state && state.timer) clearInterval(state.timer); state = null; };
  V.render = function (el) {
    if (state && state.mode === 'testing') { renderTest(el); return; }
    if (state && state.mode === 'done') { renderResult(el, state.r, false); return; }
    const p = App.store.profile;
    el.innerHTML = `
      <div class="card" style="max-width:640px;margin:30px auto;text-align:center;padding:36px">
        <div style="font-size:44px">🧭</div>
        <h2 style="margin:10px 0 6px">${App.examName() ? App.examName() + '· ' : ''}入学水平测试</h2>
        <p style="color:var(--ink2)">20 道高频词释义选择题 · 限时 5 分钟 · 选完自动跳下一题 · 到时自动交卷<br>测完为你定级，并生成专属每日背词计划；交卷后可逐词回顾对错</p>
        <div class="grid3" style="margin:18px 0;text-align:left">
          <div class="stat-card"><div class="num" style="font-size:20px">20<small> 题</small></div><div class="lab">四选一 · 选中文释义</div></div>
          <div class="stat-card"><div class="num" style="font-size:20px">5<small> 分钟</small></div><div class="lab">超时自动交卷</div></div>
          <div class="stat-card"><div class="num" style="font-size:20px">3<small> 档</small></div><div class="lab">常用 / 高频 / 冲刺</div></div>
        </div>
        ${p.placed ? `<div class="note" style="margin-bottom:12px">当前定级：${App.lvTierLabel(p.startLevel) || App.examName()} · 每日 ${p.dailyNew} 新词（重新测试会更新计划，已背词不受影响）</div>` : ''}
        <button class="btn big" id="startBtn">开始测试</button>
      </div>`;
    el.querySelector('#startBtn').onclick = () => {
      state = { mode: 'testing', qs: build(), idx: 0, answers: new Array(20).fill(null), left: 300, spokenIdx: -1, locked: false };
      renderTest(el);
    };
  };

  function renderTest(el) {
    const s = state;
    el.innerHTML = `
      <div class="card" style="max-width:680px;margin:20px auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <b>第 ${s.idx + 1} / 20 题</b>
          <span style="display:flex;gap:10px;align-items:center">
            <span class="note">点选释义后自动进入下一题</span>
            <span class="timer" id="tLeft">05:00</span>
          </span>
        </div>
        <div class="progress" style="margin-bottom:18px"><i style="width:${s.idx / 20 * 100}%"></i></div>
        <div id="qBox"></div>
        <div style="display:flex;justify-content:space-between;margin-top:16px;align-items:center">
          <span class="note">已答 ${s.answers.filter(a => a != null).length} / 20</span>
          <button class="btn plain sm" id="finishEarly">提前交卷</button>
        </div>
      </div>`;
    const qBox = el.querySelector('#qBox');
    const paint = () => {
      const q = s.qs[s.idx];
      qBox.innerHTML = `<div style="text-align:center;font-size:30px;font-weight:800;margin:14px 0 4px">${q.w} <button class="ico-btn" id="spk" title="点击重听">🔊</button></div>
        <div class="note" style="text-align:center;margin-bottom:14px">选出正确的中文释义</div>
        ${q.opts.map((o, i) => `<div class="opt ${s.answers[s.idx] === i ? 'sel' : ''}" data-i="${i}"><span class="k">${'ABCD'[i]}</span><span>${App.esc(o)}</span></div>`).join('')}`;
      qBox.querySelectorAll('.opt').forEach(o => o.onclick = () => pickOption(+o.dataset.i));
      qBox.querySelector('#spk').onclick = () => App.speak(q.w);
      // 单词首次出现自动朗读
      if (s.spokenIdx !== s.idx) { s.spokenIdx = s.idx; App.speak(q.w); }
    };
    const pickOption = (i) => {
      if (s.locked) return;
      s.locked = true;
      s.answers[s.idx] = i;
      // 选中高亮反馈
      qBox.querySelectorAll('.opt').forEach((o, j) => o.classList.toggle('sel', j === i));
      const delay = window.__TEST_FAST__ ? 15 : 320;
      setTimeout(() => {
        s.locked = false;
        if (s.idx < 19) { s.idx++; renderTest(el); }
        else finish(el);
      }, delay);
    };
    paint();
    el.querySelector('#finishEarly').onclick = () => {
      if (s.answers.includes(null) && !App.confirmBox('还有 ' + s.answers.filter(a => a == null).length + ' 题未作答，确定提前交卷吗？')) return;
      finish(el);
    };
    if (s.timer) clearInterval(s.timer);
    const tEl = el.querySelector('#tLeft');
    tEl.textContent = App.mmss(s.left);
    s.timer = setInterval(() => {
      s.left--;
      if (tEl.isConnected) tEl.textContent = App.mmss(s.left);
      if (s.left <= 0) { clearInterval(s.timer); App.toast('时间到，自动交卷'); finish(el); }
    }, 1000);
  }

  function finish(el) {
    if (state.timer) clearInterval(state.timer);
    try { speechSynthesis && speechSynthesis.cancel(); } catch (e) {}
    const r = result(state);
    state = { mode: 'done', r };
    renderResult(el, r, true);
  }

  function renderResult(el, r, isNew) {
    const right = r.review.filter(x => x.ok).length, wrong = r.review.length - right;
    el.innerHTML = `
      <div class="card" style="max-width:640px;margin:30px auto;text-align:center;padding:34px">
        <div style="font-size:40px">${isNew ? '🎉' : '🧭'}</div>
        <h2 style="margin:8px 0 2px">答对 ${r.total} / 20 题</h2>
        <div style="margin:4px 0 12px">
          <span class="badge lv${r.lv}" style="font-size:14px;padding:3px 14px">定级：${r.label} · 从「${App.lvTierLabel(r.lv)}」档开始</span>
        </div>
        <div class="grid3" style="margin:16px 0;text-align:center">
          ${[1, 2, 3].map(l => `<div class="stat-card"><div class="num" style="font-size:20px">${r.byLv[l][0]}<small>/${r.byLv[l][1]}</small></div><div class="lab">${App.LV[l].name}档词汇正确</div></div>`).join('')}
        </div>
        <p style="color:var(--ink2)">${r.desc}</p>
        <div class="note" style="margin:8px 0 16px">将为你生成计划：每天背 <b>${r.dailyNew}</b> 个新词 + 复习到期词汇（可随时在首页调整）</div>
        <button class="btn big" id="applyBtn">生成我的学习计划 →</button>
        <button class="btn plain" id="redoBtn" style="margin-left:8px">重新测试</button>
      </div>
      <div class="card" style="max-width:680px;margin:0 auto 30px">
        <h3>📋 逐词回顾 <span class="sub">答对 ${right} · 答错 ${wrong} · 点击单词可听发音</span></h3>
        ${r.review.map((x, i) => `
          <div class="list-row" style="cursor:pointer" data-sp="${x.w}">
            <span class="badge ${x.ok ? 'ok' : 'bad'}" style="min-width:44px;text-align:center">${x.ok ? '✓ 对' : '✗ 错'}</span>
            <div style="flex:1;min-width:0">
              <b>${x.w}</b>
              ${x.ok ? `<span class="note">${App.esc(x.correct)}</span>`
                : `<div class="note">你的选择：${App.esc(x.your)}<br>正确释义：<b style="color:var(--ok)">${App.esc(x.correct)}</b></div>`}
            </div>
            <button class="ico-btn" data-sp2="${x.w}">🔊</button>
          </div>`).join('')}
        <div class="note" style="margin-top:10px">💡 答错的词建议点「＋生词本」或在词汇系统的词库里搜索单独巩固。</div>
      </div>`;
    el.querySelector('#applyBtn').onclick = () => {
      App.store.profile.placed = true;
      App.store.profile.startLevel = r.lv;
      App.store.profile.dailyNew = r.dailyNew;
      App.save();
      state = null;
      App.toast('计划已生成，开始学习吧！');
      App.go('home');
    };
    el.querySelector('#redoBtn').onclick = () => { state = null; V.render(el); };
    el.querySelectorAll('[data-sp]').forEach(row => row.onclick = () => App.speak(row.dataset.sp));
  }
})();
