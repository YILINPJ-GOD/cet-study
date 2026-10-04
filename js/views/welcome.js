/* ===== 欢迎页：选择四级 / 六级 → 进入入学测试 ===== */
App.Views.welcome = App.Views.welcome || {};
(function () {
  const V = App.Views.welcome;
  const EXAMS = {
    cet4: {
      name: '大学英语四级', tag: 'CET-4', icon: '🌱',
      desc: '词汇量约 4500，适合大一大二或首次报考。听力含短新闻、长对话、听力篇章。',
      ratio: '写作 15% · 听力 35% · 阅读 35% · 翻译 15%'
    },
    cet6: {
      name: '大学英语六级', tag: 'CET-6', icon: '🚀',
      desc: '在四级基础上加难，词汇量约 5500+。听力含长对话、听力篇章、讲座/讲话。',
      ratio: '写作 15% · 听力 35% · 阅读 35% · 翻译 15%'
    }
  };

  V.render = function (el) {
    const cur = App.store.profile.exam;
    const placed = App.store.profile.placed;
    el.innerHTML = `
      <div style="max-width:860px;margin:14px auto 0">
        <div style="text-align:center;margin:10px 0 22px">
          <div style="font-size:44px">🎓</div>
          <h2 style="font-size:24px;margin:8px 0 4px">欢迎使用四六级智学</h2>
          <p style="color:var(--ink2)">第一步：选择你要备考的级别，随后进行 5 分钟入学测试，<br>我会根据测试结果为你定制每日学习计划。</p>
        </div>
        <div class="grid2" id="examCards">
          ${['cet4', 'cet6'].map(k => {
            const e = EXAMS[k];
            return `<div class="topic-card" data-exam="${k}" style="padding:22px;text-align:center">
              <div style="font-size:36px">${e.icon}</div>
              <div style="font-size:18px;font-weight:800;margin:8px 0 2px">${e.name}</div>
              <span class="badge ${k === 'cet4' ? 'lv1' : 'lv2'}">${e.tag}</span>
              <div class="note" style="margin:10px 0 4px;min-height:56px">${e.desc}</div>
              <div class="note" style="opacity:.75">${e.ratio}</div>
              <button class="btn big" style="margin-top:14px">${cur === k ? '继续备考' : '选择并开始测试'} →</button>
            </div>`;
          }).join('')}
        </div>
        ${placed ? '<div class="note" style="text-align:center;margin-top:16px">你已完成「' + (EXAMS[cur] || {}).name + '」的入学测试。切换级别将重新测试定级（已背单词保留）。</div>' : ''}
      </div>`;
    el.querySelectorAll('[data-exam]').forEach(card => card.onclick = () => {
      const exam = card.dataset.exam;
      const switching = App.store.profile.exam && App.store.profile.exam !== exam;
      App.store.profile.exam = exam;
      if (switching && App.store.profile.placed) {
        App.store.profile.placed = false;   // 换级别需重新定级
        App.toast('已切换到' + EXAMS[exam].name + '，请重新完成入学测试');
      }
      App.save();
      App.go('placement');
    });
  };
})();
