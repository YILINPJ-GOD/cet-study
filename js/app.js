/* ===== 主控：导航路由 + 学习计时 + 初始化 ===== */
(function () {
  const NAV = [
    ['home', '🏠', '首页看板', 'Dashboard'],
    ['placement', '🧭', '入学测试', 'Placement Test'],
    ['vocab', '📚', '词汇记忆', 'Vocabulary'],
    ['listening', '🎧', '听力专项', 'Listening'],
    ['reading', '📖', '阅读专项', 'Reading'],
    ['writing', '✍️', '写作专项', 'Writing'],
    ['translation', '🀄', '翻译专项', 'Translation'],
    ['mock', '⏱', '冲刺模考', 'Mock Exam'],
    ['realexam', '📜', '真题中心', 'Past Papers'],
    ['wordbook', '⭐', '生词本', 'Word Book']
  ];
  const TITLES = { home: '首页看板', welcome: '选择备考级别', placement: '入学水平测试', vocab: '核心词汇记忆系统', listening: '听力专项 · 真题原音精听', reading: '阅读专项训练', writing: '写作专项 · AI 批改', translation: '翻译专项训练', mock: '冲刺模考', realexam: '真题中心 · 资源与本地库', wordbook: '生词本' };

  App.currentView = 'home';
  App.EXAM_NAMES = { cet4: '四级', cet6: '六级' };
  App.examName = function () { return App.EXAM_NAMES[App.store.profile.exam] || ''; };
  /* 未选定级别/未完成入学测试时，除引导流程外的页面一律重定向 */
  App.onboardDone = function () { return !!App.store.profile.exam && !!App.store.profile.placed; };
  App.go = function (name, param) {
    if (!App.Views[name]) return;
    if (!App.onboardDone() && name !== 'welcome' && name !== 'placement') {
      name = App.store.profile.exam ? 'placement' : 'welcome';
      App.toast('请先完成级别选择与入学测试');
    }
    App.currentView = name;
    const el = document.getElementById('view');
    el.innerHTML = '';
    el.dataset.src = name;
    window.scrollTo(0, 0);
    document.getElementById('viewTitle').textContent = TITLES[name] || name;
    document.querySelectorAll('#nav .nav-item').forEach(n => n.classList.toggle('active', n.dataset.v === name));
    // 视图内部瞬态状态（tab/会话）在路由切换时重置
    if (App.Views[name].reset) { try { App.Views[name].reset(); } catch (e) {} }
    try { App.Views[name].render(el, param); }
    catch (e) {
      console.error(e);
      el.innerHTML = '<div class="card"><div class="empty"><div class="big">😵</div>页面加载出错：' + App.esc(e.message) + '<br><br><button class="btn" onclick="App.go(\'home\')">返回首页</button></div></div>';
    }
    paintTop();
    paintNavCount();
  };

  function paintTop() {
    const sec = App.dayStat().sec || 0;
    const streak = App.streak();
    const examChip = App.store.profile.exam ? '<span class="chip">' + App.examName() + '</span>' : '';
    document.getElementById('topRight').innerHTML =
      examChip +
      '<span class="chip">今日 ' + App.fmtSec(sec) + '</span>' +
      (streak > 0 ? '<span class="chip fire">🔥 连续 ' + streak + ' 天</span>' : '<span class="note">今日学习满10分钟即打卡</span>');
  }

  function paintNavCount() {
    const plan = App.planToday();
    const due = plan.revTotal - plan.revDone + plan.newTotal - plan.newDone;
    document.querySelectorAll('#nav .nav-item').forEach(n => {
      let c = n.querySelector('.cnt');
      if (n.dataset.v === 'vocab' && due > 0 && App.store.profile.placed) {
        if (!c) { c = document.createElement('span'); c.className = 'cnt'; n.appendChild(c); }
        c.textContent = due;
      } else if (c) c.remove();
    });
  }

  function buildNav() {
    const nav = document.getElementById('nav');
    nav.innerHTML = NAV.map(([id, ico, cn, en]) =>
      '<button class="nav-item" data-v="' + id + '"><span class="ico">' + ico + '</span><span>' + cn + '</span></button>').join('');
    nav.querySelectorAll('.nav-item').forEach(b => b.onclick = () => App.go(b.dataset.v));
    document.getElementById('sideFoot').innerHTML = '本地离线运行 · 数据存于本机<br><span style="opacity:.6">四六级智学 v' + App.VERSION + '</span>';
  }

  /* 学习时长心跳：页面可见时每 15 秒计 15 秒 */
  function startHeartbeat() {
    setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const d = App.dayStat();
      d.sec = (d.sec || 0) + 15;
      App.save();
      paintTop();
    }, 15000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') paintTop(); });
  }

  function init() {
    App.load();
    // 旧数据迁移：已完成定级的老用户默认为六级
    if (App.store.profile.placed && !App.store.profile.exam) App.store.profile.exam = 'cet6';
    // 每日自动补充智能生成题源（每天首次打开补充 1 阅读 + 1 选词）
    try { if (App.Gen && App.Gen.autoSupply) App.Gen.autoSupply(); } catch (e) {}
    buildNav();
    App.dict.init();
    startHeartbeat();
    App.go(App.onboardDone() ? 'home' : 'welcome');
    window.addEventListener('beforeunload', App._saveNow);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
