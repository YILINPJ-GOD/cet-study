/* ===== 首页：数据看板 ===== */
App.Views = App.Views || {};
App.Views.home = {
  render(el) {
    const plan = App.planToday();
    const st = App.vocabStats();
    const streak = App.streak();
    const todaySec = App.dayStat().sec || 0;
    const weak = App.weakestType();

    // 近7天学习时长
    const bars = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = App.today(d);
      const rec = App.store.days[key];
      bars.push({ label: (d.getMonth() + 1) + '/' + d.getDate(), value: rec ? Math.round(rec.sec / 60) : 0 });
    }

    const trend = App.typeTrend(14);
    const COLORS = { careful: '#4f46e5', matching: '#0d9488', cloze: '#d97706', vocab: '#dc2626' };
    const series = Object.keys(trend.series).filter(k => trend.series[k].some(v => v != null)).map(k => ({ name: trend.types[k], color: COLORS[k], data: trend.dates.map((d, i) => ({ x: d, y: trend.series[k][i] })) }));

    const examBanks = App.banksOf(App.store.profile.exam || 'cet6');
    const lvBars = examBanks.map(tier => {
      const meta = App.TIERS[tier];
      const all = App.allWords().filter(w => w.tier === tier).length;
      const lr = Object.keys(App.store.srs).filter(w => App.store.srs[w].b >= 1 && App.WMAP()[w] && App.WMAP()[w].tier === tier).length;
      return '<div style="margin:7px 0"><div style="display:flex;font-size:12.5px;justify-content:space-between"><span class="badge lv' + meta.lv + '">' + meta.label + '</span><span class="note">' + lr + '/' + all + (meta.goal ? ' · 目标 ' + meta.goal : '') + '</span></div><div class="progress" style="margin-top:4px"><i style="width:' + Math.min(100, Math.round(lr / (all || 1) * 100)) + '%"></i></div></div>';
    }).join('');

    const pct = Math.round(st.mastered / (st.total || 1) * 100);
    const lastEssay = App.store.essays[App.store.essays.length - 1];
    const lastTrans = App.store.translations[App.store.translations.length - 1];
    const lastMock = App.store.mocks[App.store.mocks.length - 1];

    el.innerHTML = `
    <div class="grid4" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card accent"><div class="num">${streak}<small> 天</small></div><div class="lab">连续打卡</div></div>
      <div class="stat-card"><div class="num mono">${todaySec >= 3600 ? App.fmtSec(todaySec) : Math.round(todaySec / 60) + '<small> 分钟</small>'}</div><div class="lab">今日学习时长</div></div>
      <div class="stat-card"><div class="num">${st.mastered}<small> / ${st.total}</small></div><div class="lab">词汇已掌握（${pct}%）</div></div>
      <div class="stat-card"><div class="num">${st.acc == null ? '—' : st.acc + '%'}</div><div class="lab">词汇考查正确率</div></div>
    </div>

    <div class="card" style="margin-top:18px">
      <h3>🎯 今日学习计划 <span class="sub">由入学水平与做题数据自动生成</span></h3>
      ${plan.needTest ? `
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <div style="flex:1;min-width:260px">你还没做入学测试。花 5 分钟测测词汇量，我会为你定级并生成专属每日计划（每天背多少新词、复习多少、练哪个题型）。</div>
          <button class="btn big" data-go="placement">开始 5 分钟水平测试 →</button>
        </div>` : `
        <div style="display:flex;gap:26px;flex-wrap:wrap;align-items:center">
          <div style="flex:1;min-width:230px">
            <div style="display:flex;justify-content:space-between;font-size:13px"><span>背新词 ${plan.newDone}/${plan.newTotal}</span><span>复习 ${plan.revDone}/${plan.revTotal}</span></div>
            <div class="progress" style="margin:6px 0 10px"><i style="width:${Math.round(plan.newDone / plan.newTotal * 100)}%"></i></div>
            <div class="progress"><i class="ok" style="width:${plan.revTotal ? Math.round(plan.revDone / plan.revTotal * 100) : 0}%"></i></div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn" data-go="vocab">📚 开始背单词</button>
            ${weak ? '<button class="btn ghost" data-go="reading">🎯 弱项特训：' + App.TYPE_NAMES[weak] + '</button>' : '<button class="btn ghost" data-go="reading">📖 去练阅读</button>'}
            <button class="btn plain" data-go="mock">⏱ 模拟考</button>
          </div>
        </div>
        <div class="note" style="margin-top:10px">💡 ${todaySec >= App.CHECKIN_SEC ? '今日已打卡，继续加油！' : '再学 ' + Math.ceil((App.CHECKIN_SEC - todaySec) / 60) + ' 分钟即可完成今日打卡'}</div>`}
    </div>

    <div class="grid2">
      <div class="card">
        <h3>📈 各题型正确率趋势 <span class="sub">近14个学习日</span></h3>
        ${App.charts.line({ series: series.length ? series : [{ name: '暂无', color: '#ccc', data: [] }], max: 100, yUnit: '%' })}
      </div>
      <div class="card">
        <h3>📅 打卡日历</h3>
        <div id="calBox"></div>
      </div>
    </div>

    <div class="grid2">
      <div class="card">
        <h3>⏳ 近7天学习时长（分钟）</h3>
        ${App.charts.bars({ data: bars, max: Math.max(30, ...bars.map(b => b.value)), yUnit: '' })}
        <div class="note">页面打开且在前台时自动计时（每小时约等于真实学习节奏）</div>
      </div>
      <div class="card">
        <h3>🔤 词汇掌握进度 <span class="sub">已掌握=复习4次以上全对</span></h3>
        <div class="progress" style="height:12px"><i style="width:${pct}%"></i></div>
        <div class="note" style="margin:6px 0 10px">${st.mastered} / ${st.total} 词已掌握 · ${st.learning} 词在学</div>
        ${lvBars}
      </div>
    </div>

    <div class="card">
      <h3>🗂 最近成果</h3>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <span class="tag">📝 作文 ${App.store.essays.length} 篇${lastEssay ? ' · 最近 ' + lastEssay.score + ' 分' : ''}</span>
        <span class="tag">🀄 翻译 ${App.store.translations.length} 篇${lastTrans ? ' · 最近 ' + lastTrans.score + ' 分' : ''}</span>
        <span class="tag">⏱ 模考 ${App.store.mocks.length} 次${lastMock ? ' · 最近 ' + lastMock.total + ' 分' : ''}</span>
        <span class="tag">⭐ 生词本 ${Object.keys(App.store.wordbook).length} 词</span>
      </div>
      <hr class="hr">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <b style="font-size:13.5px">数据安全：</b>
        <button class="btn ghost sm" data-act="export">导出备份（JSON）</button>
        <button class="btn ghost sm" data-act="import">导入备份</button>
        <button class="btn danger sm" data-act="reset">清空数据</button>
        <input type="file" id="importFile" accept=".json" style="display:none">
        <span class="note">数据保存在本机浏览器中，刷新/重启不丢失；换电脑或清缓存前请先导出备份。</span>
      </div>
      <hr class="hr">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <b style="font-size:13.5px">设置：</b>
        <span class="note">每日新词</span>
        <input type="number" class="txt" id="dailyNew" min="3" max="60" style="width:70px" value="${App.store.profile.dailyNew}">
        <span class="note">每日复习上限</span>
        <input type="number" class="txt" id="reviewCap" min="10" max="300" style="width:70px" value="${App.store.profile.reviewCap}">
        <button class="btn plain sm" id="saveProfile">保存</button>
        ${App.store.profile.placed ? '<button class="btn plain sm" data-go="placement">重新测水平</button>' : ''}
      </div>
    </div>`;

    App.charts.calendar(el.querySelector('#calBox'));

    el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => App.go(b.dataset.go));
    el.querySelector('[data-act=export]').onclick = App.exportBackup;
    el.querySelector('[data-act=import]').onclick = () => el.querySelector('#importFile').click();
    el.querySelector('#importFile').onchange = e => { if (e.target.files[0]) App.importBackup(e.target.files[0], () => App.go('home')); };
    el.querySelector('[data-act=reset]').onclick = App.resetAll;
    el.querySelector('#saveProfile').onclick = () => {
      const dn = parseInt(el.querySelector('#dailyNew').value) || 8;
      const rc = parseInt(el.querySelector('#reviewCap').value) || 60;
      App.store.profile.dailyNew = Math.max(3, Math.min(60, dn));
      App.store.profile.reviewCap = Math.max(10, Math.min(300, rc));
      App.save();
      App.toast('已保存');
      App.go('home');
    };
  }
};
