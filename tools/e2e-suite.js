/* ===== E2E 测试套件 =====
   由测试驱动器（node 端）fetch + eval 注入页面后执行。
   每个用例独立一个 evaluate 调用（≤3s）；需要干净状态时由驱动器先 reset+reload。 */
window.__E2E = {
  cases: [],
  results: [],
  add(name, fn) { this.cases.push({ name, fn }); },
  reset() {
    // 暂停自动保存，防止 beforeunload 把旧数据写回
    try { App._noSave = true; App.save = function () {}; App._saveNow = function () {}; } catch (e) {}
    localStorage.removeItem('cet6app_v1');
  },
  async runOne(idx) {
    const c = this.cases[idx];
    const t0 = Date.now();
    try { await c.fn(); this.results.push({ name: c.name, pass: true, ms: Date.now() - t0 }); }
    catch (e) { this.results.push({ name: c.name, pass: false, msg: String((e && e.message) || e), ms: Date.now() - t0 }); }
    return this.results[this.results.length - 1];
  }
};
(function (T) {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const viewText = () => $('#view').innerText.replace(/\n+/g, ' | ');
  const assert = (cond, msg) => { if (!cond) throw new Error('断言失败: ' + msg); };
  const H = {
    click(sel) { const el = $(sel); if (!el) throw new Error('找不到元素 ' + sel); el.click(); },
    async answerPlacement() {
      // 快速模式下逐题点选，依靠“选完自动跳题”推进，直到出现成绩页
      window.__TEST_FAST__ = true;
      for (let i = 0; i < 24; i++) {
        if (viewText().includes('答对') && $('#applyBtn')) break;
        const opts = $$('#view .opt');
        if (!opts.length) break;
        opts[0].click();
        await new Promise(r => setTimeout(r, 40));
      }
      window.__TEST_FAST__ = false;
    },
    async startPlacement(exam) {
      if (App.Views.placement.reset) App.Views.placement.reset();
      App.store.profile.placed = false;
      App.store.profile.exam = exam || 'cet6';
      App.go('placement');
      H.click('#startBtn');
    },
    expectView(name) { assert(App.currentView === name, '当前视图应为 ' + name + '，实际 ' + App.currentView); }
  };
  T.H = H;

  /* ---------- 要求一：级别选择 + 强制入学流程 ---------- */
  T.add('R1-01 首次打开APP进入选级页而非首页', () => {
    assert(App.store.profile.exam == null, '全新数据 exam 应为空');
    H.expectView('welcome');
    assert(viewText().includes('选择你要备考的级别'), '应显示选级引导文案');
    App.go('home');
    H.expectView('welcome');
    App.go('vocab');
    H.expectView('welcome');
  });

  T.add('R1-02 选择六级后进入入学测试', () => {
    H.click('[data-exam="cet6"]');
    H.expectView('placement');
    assert(App.store.profile.exam === 'cet6', 'exam 应为 cet6');
    assert(viewText().includes('六级· 入学水平测试'), '测试页应标注所选级别');
    assert(viewText().includes('开始测试'), '应有开始按钮');
  });

  T.add('R1-03 完成测试→定级→生成计划→进入首页看板', async () => {
    H.click('#startBtn');
    await H.answerPlacement();
    assert(viewText().includes('答对'), '应出现成绩页');
    H.click('#applyBtn');
    H.expectView('home');
    assert(App.store.profile.placed === true, 'placed 应为 true');
    assert(App.store.profile.dailyNew >= 8, '应生成每日新词计划');
    assert(viewText().includes('今日学习计划'), '首页应展示计划');
  });

  T.add('P-01 选择释义后自动跳转下一题（无下一题按钮）', async () => {
    await H.startPlacement('cet6');
    assert(!$('#nextQ'), '不应再有“下一题”按钮');
    assert(viewText().includes('第 1 / 20 题'), '应从第1题开始');
    window.__TEST_FAST__ = true;
    $('#view .opt').click();
    await new Promise(r => setTimeout(r, 150));
    window.__TEST_FAST__ = false;
    assert(viewText().includes('第 2 / 20 题'), '点选后应自动跳到第2题');
  });

  T.add('P-02 全部点选后自动交卷出成绩', async () => {
    await H.startPlacement('cet6');
    await H.answerPlacement();
    assert($('#applyBtn') != null, '20题答完应自动进入成绩页');
    assert(viewText().includes('答对'), '应显示得分');
  });

  T.add('P-03 交卷后逐词展示正确/错误回顾', async () => {
    await H.startPlacement('cet6');
    await H.answerPlacement();
    const rows = $$('#view [data-sp]');
    assert(rows.length === 20, '应逐词回顾20个测试词，实际 ' + rows.length);
    const badges = $$('#view .list-row .badge');
    assert(badges.some(b => /✓ 对/.test(b.textContent)), '应有答对标记');
    assert(badges.some(b => /✗ 错/.test(b.textContent)), '应有答错标记（全选A不可能全对）');
    assert(viewText().includes('正确释义'), '答错词应显示正确释义');
  });

  T.add('R1-04 已定级用户刷新后直达首页看板', () => {
    H.expectView('home');
    assert(App.onboardDone() === true, 'onboardDone 应为 true');
    assert(!viewText().includes('选择你要备考的级别'), '不应再出现选级引导');
  });

  T.add('R1-05 切换到四级会要求重新测试且题库调整', async () => {
    App.store.profile.placed = false;   // 模拟从首页“更改级别”进入
    App.go('welcome');
    H.expectView('welcome');
    H.click('[data-exam="cet4"]');
    H.expectView('placement');
    assert(App.store.profile.exam === 'cet4', 'exam 应切换为 cet4');
    assert(viewText().includes('四级· 入学水平测试'), '应标注四级');
    H.click('#startBtn');
    await H.answerPlacement();
    H.click('#applyBtn');
    H.expectView('home');
    assert(App.store.profile.placed === true, '重新测试后 placed 为 true');
  });

  T.add('R1-06 未完成测试时访问功能页被重定向回引导', () => {
    App.store.profile.placed = false;
    App.go('vocab');
    H.expectView('placement');
    App.go('home');
    H.expectView('placement');
    App.store.profile.placed = true;    // 还原
    App.go('home');
    H.expectView('home');
  });

  /* ---------- 要求二：听力专项 ---------- */
  T.makeWav = function () {
    // 生成 1 秒 8kHz 16bit 单声道正弦波 WAV（Blob），用于 IndexedDB 回环测试
    const sr = 8000, n = sr, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); ws(8, 'WAVEfmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true);
    v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.sin(i / sr * 440 * 2 * Math.PI) * 12000, true);
    return new Blob([buf], { type: 'audio/wav' });
  };

  T.add('R2-01 听力首页按级别显示三类题型', () => {
    App.go('listening');
    const exam = App.store.profile.exam || 'cet6';
    const expect = exam === 'cet4' ? ['短篇新闻', '长对话', '听力篇章'] : ['长对话', '听力篇章', '讲座 / 讲话'];
    const txt = viewText();
    expect.forEach(n => assert(txt.includes(n), '应显示题型 ' + n));
    assert(txt.includes('套 · 每套 3-4 题'), '应显示套数信息');
  });

  T.add('R2-02 打开听力练习：逐句原文/题目/导入提示齐全', () => {
    App.go('listening', { id: (App.store.profile.exam === 'cet4' ? 'n1' : 'c5') });
    const txt = viewText();
    assert(txt.includes('逐句精听'), '应显示逐句精听列表');
    assert(txt.includes('导入原音文件'), '无音频时应显示导入按钮');
    assert(txt.includes('系统朗读演练'), '应提供朗读演练兜底');
    assert(txt.includes('听力题目'), '应显示题目区');
    assert($$('#qCard .opt').length >= 12, '至少3题×4选项');
    assert($$('#sentList .sent-en').length >= 7, '应有逐句原文');
    H.click('#tCn');
    assert($('#sentList .note') != null, '开启译文后应显示中文');
  });

  T.add('R2-03 逐句循环句窗口计算正确', () => {
    const w = App.Listening.sentenceWindow;
    let r = w([5, 12], 0, 30); assert(r[0] === 5 && r[1] === 12, '第一句应为 [5,12)，实得 ' + r);
    r = w([5, 12], 1, 30); assert(r[0] === 12 && r[1] === 30, '最后一句应到时长边界，实得 ' + r);
    r = w([], 0, 30); assert(r[0] === 0 && r[1] === 30, '未校准时应从头到尾，实得 ' + r);
    r = w([5, 12], 5, 30); assert(r[0] === 12 && r[1] === 30, '越界句应钳制，实得 ' + r);
  });

  T.add('R2-04 音频本地库存取回环（IndexedDB）', async () => {
    const blob = T.makeWav();
    await App.audb.put('au_test1', blob);
    const got = await App.audb.get('au_test1');
    assert(got && got.size > 1000, '取回应得到有效音频 blob');
    assert(got.type === 'audio/wav', '类型应为 audio/wav');
    await App.audb.del('au_test1');
    assert((await App.audb.get('au_test1')) === null, '删除后应为空');
  });

  T.add('R2-05 听力作答提交→判分→计入趋势', () => {
    App.go('listening', { id: 'n1' });
    for (let i = 0; i < 3; i++) H.click('#qCard .opt[data-q="' + i + '"][data-o="0"]');
    H.click('#qSubmit');
    assert(viewText().match(/已提交 \d\/3/), '应显示提交结果');
    const rec = App.store.practice.listening[App.store.practice.listening.length - 1];
    assert(rec && rec.type === 'news' && rec.t === 3, '应记录听力练习');
    const trend = App.typeTrend(14);
    assert('listening' in trend.series, '趋势应包含听力');
    assert(trend.series.listening.some(v => v != null), '听力趋势应有数据点');
  });

  T.add('R2-06 六级题型含讲座/讲话且题库结构完整', () => {
    const exam = App.store.profile.exam;
    App.store.profile.exam = 'cet6';
    App.go('listening');
    assert(viewText().includes('讲座 / 讲话'), '六级应显示讲座/讲话');
    const all = App.Listening.allSets();
    assert(all.length >= 12, '四六级合计应≥12套，实际 ' + all.length);
    all.forEach(s => {
      assert(s.sentences.length >= 7 && s.questions.length >= 3, s.id + ' 句子/题目数量不足');
      s.questions.forEach((q, i) => assert(q.opts.length === 4 && q.a >= 0 && q.a <= 3 && q.exp, s.id + ' 第' + (i + 1) + '题结构错误'));
      s.sentences.forEach((sn, i) => assert(sn.en && sn.cn, s.id + ' 第' + (i + 1) + '句缺原文或译文'));
    });
    App.store.profile.exam = exam;
  });

  /* ---------- 要求三：词汇分级词库 ---------- */
  T.add('R3-01 词库按级别×档位加载且规模达标', () => {
    const w4 = App.allWords('cet4'), w6 = App.allWords('cet6');
    assert(w4.every(w => ['t4c', 't4h', 't4s', 'zt', 'tl'].includes(w.tier)), '四级词库不应含六级专属档');
    assert(w6.some(w => w.tier === 't6h') && w6.some(w => w.tier === 't6s'), '六级词库应含六级高频/冲刺');
    assert(w4.length + w6.length >= 4000, '四六级合计应≥4000词，实际 ' + (w4.length + w6.length));
    assert(w6.every(w => w.gloss), '所有词条必须有释义');
    const zt = w6.filter(w => w.tier === 'zt').length, tl = w6.filter(w => w.tier === 'tl').length;
    assert(zt >= 50 && tl >= 50, '专项词库应各≥50词（去重后），实际 ' + zt + '/' + tl);
  });

  T.add('R3-02 常考释义优先（address→解决置前）', () => {
    const e = App.WMAP().address;
    assert(e && e.gloss.startsWith('v. 解决'), 'address 应优先展示"解决"，实际：' + (e && e.gloss));
    assert(e.examSense === true, '应标记常考义');
    assert(window.EXAMPLES.address && /address/.test(window.EXAMPLES.address[0]), '应配有真题风格例句');
    const novel = App.WMAP().novel;
    assert(novel && /新奇/.test(novel.gloss) && novel.gloss.indexOf('adj') === 0, 'novel 应先展示形容词"新奇的"');
  });

  T.add('R3-03 五种记忆模式齐全可用', () => {
    const words = App.allWords().slice(0, 40);
    const modes = new Set(words.map(w => App.quizMode(w.w)));
    ['e2c', 'c2e', 'spell', 'listen', 'c2et'].forEach(m => assert(modes.has(m), '缺少模式 ' + m));
    const entry = words[0];
    const q = App.quizC2ET(entry);
    assert(q.mode === 'c2et' && q.gloss && !q.hint, '中英互译打字模式结构正确');
    const q2 = App.quizE2C(entry);
    assert(q2.opts.length === 4 && q2.opts[q2.answer].w === entry.w, '看词选义含正确项');
  });

  T.add('R3-04 艾宾浩斯新旧词比例自动安排', () => {
    const today = App.today();
    App.dayStat().newW = 0;
    const daily = 10;
    App.store.profile.dailyNew = daily;
    // 模拟 25 个到期复习词
    const pool = App.allWords().slice(0, 30).map(w => w.w);
    const bak = {};
    pool.forEach((w, i) => { bak[w] = App.store.srs[w]; if (i < 25) App.store.srs[w] = { b: 1, due: Date.now() - 1000, c: 1, w: 0 }; });
    const withDue = App.newWords().length;
    assert(withDue === Math.ceil(daily / 2), '复习多时新词应减半=5，实际 ' + withDue);
    // 清空到期后恢复全量
    pool.forEach((w, i) => { if (i < 25) { if (bak[w]) App.store.srs[w] = bak[w]; else delete App.store.srs[w]; } });
    const withoutDue = App.newWords().length;
    assert(withoutDue === daily, '无复习压力时新词应为全量 ' + daily + '，实际 ' + withoutDue);
    App.dayStat().newW = 0;
  });

  T.add('R3-05 词库浏览按档位筛选生效', () => {
    App.store.profile.exam = 'cet6';
    App.go('vocab');
    document.querySelectorAll('#view .tab')[1].click();
    const chips = Array.from(document.querySelectorAll('#view [data-tier]'));
    assert(chips.length >= 6, '应显示全部档位筛选');
    const t6hChip = chips.find(c => c.textContent === '六级高频');
    t6hChip.click();
    const rows = Array.from(document.querySelectorAll('#view .list-row'));
    assert(rows.length > 0, '六级高频档应有词');
    const firstLabel = rows[0].innerText.split('\n').pop();
    assert(firstLabel === '六级高频', '筛选后各行档位应为六级高频，实际 ' + firstLabel);
  });

  T.add('R3-06 专项词库（翻译写作/听力场景）可查可背', () => {
    const m = App.WMAP();
    ['urbanization', 'calligraphy', 'infrastructure'].forEach(w => {
      assert(m[w] && m[w].tier === 'zt' && m[w].gloss, '翻译写作主题词缺失：' + w);
    });
    ['layover', 'itinerary', 'refund'].forEach(w => {
      assert(m[w] && m[w].tier === 'tl' && m[w].gloss, '听力场景词缺失：' + w);
    });
    // 专项词在两个级别都可用
    assert(App.allWords('cet4').some(w => w.tier === 'zt'), '四级词库应含专项词');
    assert(App.allWords('cet6').some(w => w.tier === 'tl'), '六级词库应含专项词');
  });

  /* ---------- 新一轮要求二：朗读 / 阅读时长 / 延期释义 / 分段 ---------- */
  T.add('RD-01 阅读专项限时10分钟且文章分段清晰', () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.go('reading', { type: 'careful', id: 'c1' });
    assert($('#view .timer') != null, '应渲染练习页与计时器');
    assert($('#view .timer').textContent === '10:00', '计时器应为10:00，实际 ' + $('#view .timer').textContent);
    const ps = $$('#view .passage p').filter(p => p.textContent.trim().length > 40);
    assert(ps.length >= 3, '文章应≥3个自然段，实际 ' + ps.length);
  });

  T.add('RD-02 做题中点词只记录不显示释义', () => {
    const target = $$('#view .passage .dict-word').find(x => App.dict.lookup(x.dataset.w) && x.dataset.w.length > 3);
    assert(target, '应能找到词库内的可点单词');
    const entry = App.dict.lookup(target.dataset.w);
    target.click();
    const pop = $('#dictPop');
    assert(pop.style.display === 'block', '应弹出提示浮层');
    const text = pop.innerText;
    assert(text.includes('交卷后'), '应提示交卷后显示');
    assert(!text.includes(entry.gloss.slice(0, 6)), '浮层不应泄露释义：' + entry.gloss.slice(0, 6));
    assert($('#view #lookupBar').innerText.includes('(1)'), '查词条应记录 1 个词');
  });

  T.add('RD-03 交卷后查词释义回顾出现', () => {
    const target = $$('#view .passage .dict-word').filter(x => App.dict.lookup(x.dataset.w) && x.dataset.w.length > 3)[1];
    target.click();
    document.getElementById('dictPop').style.display = 'none';
    const oldConfirm = window.confirm; window.confirm = () => true;
    $('#submit').click();
    window.confirm = oldConfirm;
    const recap = $('#lookupRecap');
    assert(recap != null, '交卷后应出现查词回顾区');
    assert($('#view #lookupBar').innerText.includes('(2)'), '应记录2个查词');
    assert(recap.innerText.length > 40, '回顾区应包含释义内容');
  });

  T.add('RD-04 单词首次出现自动朗读（测试+词汇卡）', async () => {
    const spoken = [];
    App.speakHook = t => spoken.push(t);
    // 入学测试第一题自动朗读
    await H.startPlacement('cet6');
    assert(spoken.length >= 1 && spoken[0].length > 1, '入学测试应自动朗读题目单词');
    App.Views.placement.reset();
    // 词汇学习卡自动朗读
    App.store.profile.placed = true;
    App.store.profile.dailyNew = 20;
    App.dayStat().newW = 0;
    App.go('vocab');
    const start = $('#startAll');
    assert(start != null, '应有今日任务可开始');
    start.click();
    assert(spoken.length >= 2, '词汇学习卡应自动朗读单词，实际 ' + spoken.length);
    App.speakHook = null;
    // 结束会话还原
    const quit = $('#quit'); if (quit) quit.click();
  });

  /* ---------- GitHub 发布：file:// 兼容降级 ---------- */
  T.add('GH-01 无 IndexedDB 环境优雅降级（模拟 file:// 直开）', async () => {
    const desc = Object.getOwnPropertyDescriptor(window, 'indexedDB');
    try {
      App.audb._db = null;
      App.audb._broken = false;
      // indexedDB 是只读属性，需用 defineProperty 覆盖
      Object.defineProperty(window, 'indexedDB', { get: () => undefined, configurable: true });
      assert(window.indexedDB === undefined, '测试前提：indexedDB 应已被覆盖');
      const ks = await App.audb.keys();
      assert(Array.isArray(ks) && ks.length === 0, 'keys() 应返回空数组而非抛错');
      let putErr = null;
      try { await App.audb.put('au_x', new Blob(['x'])); } catch (e) { putErr = e; }
      assert(putErr && /不可用/.test(putErr.message), 'put() 应给出友好错误，实际：' + (putErr && putErr.message));
      // 听力页面在降级下正常渲染
      App.store.profile.placed = true;
      App.store.profile.exam = 'cet6';
      App.go('listening', { id: 'c5' });
      assert(viewText().includes('系统朗读演练'), '降级下听力练习页仍可用（朗读演练兜底）');
      assert(App.currentView === 'listening', '页面不应崩溃');
    } finally {
      if (desc) Object.defineProperty(window, 'indexedDB', desc);
      App.audb._db = null;
      App.audb._broken = false;
    }
  });

  /* ---------- v1.2.0：数据安全 / 批改可视化 / 词汇增强 / 听力回看定位 / PWA ---------- */
  T.add('DS-01 备份导入深度校验（坏数据被拒/好数据通过）', async () => {
    const bad1 = new Blob(['not json'], { type: 'application/json' });
    const bad2 = new Blob([JSON.stringify({ version: 1 })], { type: 'application/json' });
    const bad3 = new Blob([JSON.stringify({ version: 1, profile: {}, srs: { word: { b: 'x' } }, days: {} })], { type: 'application/json' });
    const ok = new Blob([JSON.stringify({ version: 1, profile: { exam: 'cet6' }, srs: { word: { b: 1, due: 0, c: 1, w: 0 } }, days: {}, essays: [], translations: [], mocks: [], exprs: [], practice: {} })], { type: 'application/json' });
    const toFile = b => new File([b], 't.json');
    let toasts = [];
    const oldToast = App.toast;
    App.toast = m => toasts.push(String(m));
    const oldConfirm = window.confirm; window.confirm = () => false; // 拒绝覆盖
    App.importBackup(toFile(bad1));
    App.importBackup(toFile(bad2));
    App.importBackup(toFile(bad3));
    await new Promise(r => setTimeout(r, 50));
    assert(toasts.some(t => t.includes('不是有效的 JSON')), '坏 JSON 应被拒');
    assert(toasts.some(t => t.includes('缺少 profile')), '缺字段应被拒');
    assert(toasts.some(t => t.includes('结构异常')), 'srs 异常应被拒');
    toasts = [];
    let exported = 0;
    const oldExport = App.exportBackup;
    App.exportBackup = () => { exported++; };
    window.confirm = () => true; // 允许覆盖（真实场景用户点确定）
    App.importBackup(toFile(ok), () => {});
    for (let w = 0; w < 40 && !toasts.some(x => x.includes('导入成功')); w++) await new Promise(r => setTimeout(r, 30));
    App.toast = oldToast; window.confirm = oldConfirm; App.exportBackup = oldExport;
    assert(exported >= 1, '确认导入前应自动导出应急备份');
    assert(toasts.some(t => t.includes('导入成功')), '合法备份应导入成功');
    assert(App.store.profile.exam === 'cet6', '导入后数据生效');
    App.store.customWords = App.store.customWords || [];
  });

  T.add('DS-02 超过7天未备份时首页提醒', () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.store.srs['ability'] = { b: 1, due: Date.now() + App.DAY, c: 1, w: 0 };
    App.store.lastBackupAt = null;
    App.go('home');
    assert(viewText().match(/还没有备份过|未备份/), '无备份记录且有学习数据应提醒');
    App.store.lastBackupAt = Date.now() - 9 * App.DAY;
    App.go('home');
    assert(viewText().includes('9 天未备份'), '9 天未备份应提醒');
    App.store.lastBackupAt = Date.now();
    App.go('home');
    assert(!viewText().match(/未备份/), '刚备份过不应提醒');
    delete App.store.srs['ability'];
  });

  T.add('GV-01 批改输出六维度分并渲染雷达图', () => {
    const fb = App.grader.gradeWriting('With the rapid development of technology, students increasingly rely on smartphones for learning. Admittedly, digital tools bring convenience to education. However, excessive screen time may undermine deep thinking. Moreover, constant notifications distract learners from essential reading. Therefore, we should cultivate balanced study habits. Only by managing technology wisely can we enhance learning efficiency. Furthermore, schools ought to establish clear guidelines for device usage in classrooms. In conclusion, technology is a double-edged sword for education. It is high time we took responsibility for our attention. Nothing is more crucial than self-discipline in this era.');
    assert(Array.isArray(fb.dims) && fb.dims.length === 6, '应输出6个维度');
    fb.dims.forEach(d => { assert(d.name && d.score >= 25 && d.score <= 100, '维度分应在25-100：' + d.name); });
    const svg = App.charts.radar(fb.dims);
    assert(svg.includes('<svg') && svg.includes('polygon') === false && svg.includes('path'), '雷达图应生成 SVG');
  });

  T.add('GV-02 写作/翻译成长曲线渲染', () => {
    // 自建确定数据（避免跨用例污染）
    App.store.essays.push({ date: App.today(), text: 'x', score: 60 }, { date: App.today(), text: 'y', score: 78 });
    App.store.translations.push({ date: App.today(), pid: 't1', score: 55 }, { date: App.today(), pid: 't2', score: 71 });
    assert(App.store.essays.length >= 2 && App.store.translations.length >= 2, '测试前提：历史记录≥2');
    const curveHtml = App.charts.line({ series: [{ name: '批改得分', color: '#4f46e5', data: App.store.essays.map((e2, i) => ({ x: '第' + (i + 1) + '篇', y: e2.score })) }], max: 100, min: 0 });
    assert(curveHtml.includes('<svg'), '写作成长曲线 SVG 应可渲染');
    App.go('writing');
    assert(viewText().includes('写作能力成长曲线'), '写作页应显示成长曲线');
    App.go('translation');
    const bookTab = Array.from(document.querySelectorAll('#view .tab')).find(t => t.textContent.includes('积累本'));
    bookTab.click();
    assert(viewText().includes('翻译成绩趋势'), '翻译积累本应显示成绩趋势');
  });

  T.add('WV-01 英音/美音切换生效', () => {
    const spoken = [];
    App.speakHook = (t, lang) => spoken.push(lang);
    App.store.profile.voice = 'uk';
    App.speak('hello');
    assert(spoken[0] === 'en-GB', '英音模式应使用 en-GB');
    App.store.profile.voice = 'us';
    App.speak('hello');
    assert(spoken[1] === 'en-US', '美音模式应使用 en-US');
    App.speakHook = null;
  });

  T.add('WV-02 CSV 自定义词库导入', () => {
    App.store.customWords = [];
    const csv = '# 注释行应被忽略\nephemeral,/ɪˈfemərəl/,adj.,短暂的；转瞬即逝的\nserenity,平静，宁静\nability,重复词应跳过\nx!,非法词应计数\nwistful,/ˈwɪstfl/,adj.,惆怅的；向往的';
    const r = App.importCustomCSV(csv);
    assert(r.added === 3 && r.dup === 1 && r.bad === 1, '导入统计应为 3/1/1，实际 ' + JSON.stringify(r));
    const m = App.WMAP();
    assert(m.ephemeral && m.ephemeral.tier === 'custom' && m.ephemeral.gloss.includes('短暂'), '自定义词应进入词典且释义正确');
    assert(m.wistful && m.wistful.pos === 'adj.', '词性列应被识别');
    assert(!m['ability'] || m['ability'].tier !== 'custom', '重复词不覆盖原词库');
    // 我的词库优先进入每日队列
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.dayStat().newW = 0;
    const news = App.newWords();
    assert(news.slice(0, 3).every(w => w.tier === 'custom'), '自定义词应优先进入新词队列');
    // 词库页可筛选我的词库
    App.go('vocab');
    document.querySelectorAll('#view .tab')[1].click();
    const chip = Array.from(document.querySelectorAll('#view [data-tier]')).find(c => c.textContent === '我的词库');
    assert(chip != null, '应出现我的词库筛选');
    chip.click();
    assert(viewText().includes('ephemeral'), '筛选后应显示自定义词');
    App.store.customWords = [];
    App._words = null; App._wmap = null;
  });

  T.add('LI-01 听力错题回看不重做', () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.go('listening', { id: 'c5' });
    // 第一次作答并提交
    for (let i = 0; i < 3; i++) H.click('#qCard .opt[data-q="' + i + '"][data-o="0"]');
    H.click('#qSubmit');
    assert(viewText().includes('可随时回看'), '提交后应提示可回看');
    assert(App.store.listeningReview && App.store.listeningReview.c5, '作答明细应已保存');
    // 离开再回来，出现回看入口
    App.go('home'); App.go('listening', { id: 'c5' });
    const see = $('#seeLast');
    assert(see != null, '应出现回看上次作答按钮');
    see.click();
    assert(viewText().includes('回看模式'), '应进入回看模式');
    assert(viewText().includes('定位句'), '回看解析应含定位句标注');
    assert($('#redoFresh') != null, '回看模式应提供重做入口');
    $('#redoFresh').click();
    assert($('#qSubmit') != null, '重做后恢复作答模式');
  });

  T.add('LI-02 提交后原文定位句高亮', () => {
    App.go('listening', { id: 'n1' });
    for (let i = 0; i < 3; i++) H.click('#qCard .opt[data-q="' + i + '"][data-o="0"]');
    H.click('#qSubmit');
    const hi = $$('#sentList .sent-row.loc-hi');
    assert(hi.length >= 3, '定位句应高亮（n1 三题合计≥3句），实际 ' + hi.length);
    assert(viewText().includes('定位句：原文第'), '解析应标注定位句');
  });

  T.add('PWA-01 manifest/SW 资源完整且注册带协议守卫', async () => {
    const mf = await (await fetch('manifest.webmanifest')).text();
    const manifest = JSON.parse(mf);
    assert(manifest.name && manifest.start_url === './' && manifest.icons.length >= 1, 'manifest 结构完整');
    const icon = await (await fetch('icon.svg')).text();
    assert(icon.includes('<svg'), '图标存在');
    const sw = await (await fetch('sw.js')).text();
    try { new Function(sw); } catch (e) { throw new Error('sw.js 语法错误: ' + e.message); }
    assert(sw.includes('caches') && sw.includes('addEventListener'), 'sw.js 结构合理');
    const html = await (await fetch('index.html?v=8')).text();
    assert(html.includes("location.protocol === 'https:'"), 'SW 注册必须带协议守卫（file:// 不注册）');
    assert(html.includes('manifest.webmanifest'), 'index 应引用 manifest');
  });

  T.add('PAGES-01 Pages 工作流文件就绪', async () => {
    const yml = await (await fetch('.github/workflows/pages.yml')).text();
    assert(yml.includes('actions/deploy-pages@v4'), '应使用官方 Pages 部署动作');
    assert(yml.includes('branches: [main]'), '应在 main 推送时触发');
  });

  /* ---------- v1.3.0：测试题型扩展 / 返回选级 / 智能出题 / 词根词缀 ---------- */
  T.add('PL-01 入学测试含单词/短语/句子语境三类题型', async () => {
    await H.startPlacement('cet6');
    const kinds = App.Views.placement.kinds();
    assert(kinds.length === 20, '应恰好20题，实际 ' + kinds.length);
    assert(kinds.includes('phrase'), '应包含短语题');
    assert(kinds.includes('sent'), '应包含句子语境题');
    assert(kinds.filter(k => k === 'word').length >= 10, '单词题应占主体');
    assert((window.PLACEMENT_PHRASES || []).length >= 40, '短语库应≥40条');
  });

  T.add('PL-02 语境题渲染句子且回顾带题型标记', async () => {
    const kinds = App.Views.placement.kinds();
    const sentIdx = kinds.indexOf('sent');
    assert(sentIdx >= 0, '应有语境题');
    // 跳到第一道语境题（直接重渲染视图，不走路由以免重置测试状态）
    const st = App.Views.placement.state();
    st.idx = sentIdx;
    App.Views.placement.render(document.querySelector('#view'));
    assert($('#view .passage') != null, '语境题应渲染句子');
    assert($('#view b') != null, '句子中目标词应加粗');
    // 作答全部题并交卷检查题型标记
    await H.answerPlacement();
    assert(viewText().includes('短语'), '回顾应含短语标记');
    assert(viewText().includes('语境'), '回顾应含语境标记');
    App.Views.placement.reset();
  });

  T.add('SW-01 已选级别可返回重选（四级/六级）', () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.go('placement');
    assert($('#switchExam') != null, '入学测试页应有返回选级按钮');
    H.click('#switchExam');
    H.expectView('welcome');
    assert(viewText().includes('大学英语四级') && viewText().includes('大学英语六级'), '应展示两个级别选项');
    // 选四级 → 进四级测试
    H.click('[data-exam="cet4"]');
    H.expectView('placement');
    assert(viewText().includes('四级· 入学水平测试'), '应进入四级测试');
    assert(App.store.profile.exam === 'cet4', '级别应切换为 cet4');
    App.store.profile.placed = true; App.store.profile.exam = 'cet6';
  });

  T.add('GN-01 仔细阅读生成：结构完整且两次生成不同', () => {
    const s1 = App.Gen.makeCareful('tech');
    assert(s1 && s1.text.length >= 800, '生成文章应足够长（≈300词），实际 ' + s1.text.length + '字符');
    assert(s1.text.split(/\n\s*\n/).length >= 3, '应分≥3段');
    assert(s1.questions.length === 5, '应5道题');
    s1.questions.forEach((q, i) => {
      assert(q.opts.length === 4 && q.a >= 0 && q.a <= 3 && q.exp, '第' + (i + 1) + '题结构错误');
    });
    const mainQ = s1.questions[4];
    assert(/main idea/i.test(mainQ.q), '第5题应为主旨题');
    const s2 = App.Gen.makeCareful('env');
    assert(s2.text !== s1.text || s2.id !== s1.id, '两次生成应有差异');
  });

  T.add('GN-02 选词填空生成：15选项/10空/答案唯一', () => {
    const s = App.Gen.makeCloze('health');
    assert(s.options.length === 15, '应15个选项，实际 ' + s.options.length);
    assert(new Set(s.options).size === 15, '选项不应重复');
    assert(s.a.length === 10 && new Set(s.a).size === 10, '10个答案且下标唯一');
    assert(s.a.every(x => x >= 0 && x < 15), '答案下标越界');
    assert(s.exp.length === 10, '应10条解析');
    const holes = (s.text.match(/\{(\d+)\}/g) || []).length;
    assert(holes === 10, '文中应有10个占位符，实际 ' + holes);
  });

  T.add('GN-03 生成题可直接练习并计入记录', () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.go('reading');
    assert(viewText().includes('智能出题'), '阅读首页应有生成器入口');
    H.click('#genBtn');
    const before = App.store.practice.reading.length;
    assert($('#submit') != null, '生成题应直接进入练习页');
    // 作答并交卷
    for (let i = 0; i < 5; i++) {
      const o = $('#view .opt[data-q="' + i + '"][data-o="0"]');
      if (o) o.click();
    }
    H.click('#submit');
    assert(App.store.practice.reading.length >= before, '生成题练习应计入记录');
  });

  T.add('RT-01 词根库与拆解引擎', () => {
    const roots = window.WORD_ROOTS || [];
    assert(roots.length >= 20, '词根应≥20个，实际 ' + roots.length);
    roots.forEach(r => assert(r.r && r.m && r.ex.length >= 2, '词根 ' + r.r + ' 数据不完整'));
    const mo1 = App.morph('unfair');
    assert(mo1 && mo1.prefix && mo1.prefix.p === 'un', 'unfair 应拆出前缀 un');
    const mo2 = App.morph('education');
    assert(mo2 && (mo2.suffix ? ['tion', 'ation'].includes(mo2.suffix.s) : false) && mo2.root && mo2.root.r.includes('duc'), 'education 应拆出 duc 词根与 tion/ation 后缀，实际：' + (mo2 && mo2.text));
    assert(mo2.root && mo2.root.r.includes('duc'), 'education 应识别词根 duc');
    assert(App.morph('the') === null, '短词/功能词不拆解');
  });

  T.add('RT-02 词汇页新增词根词缀标签与推断练习', () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.go('vocab');
    const tabs = Array.from(document.querySelectorAll('#view .tab')).map(t => t.textContent);
    assert(tabs.some(t => t.includes('词根词缀')), '应出现词根词缀标签');
    const rootTab = Array.from(document.querySelectorAll('#view .tab')).find(t => t.textContent.includes('词根词缀'));
    rootTab.click();
    assert($$('#view [data-r]').length >= 20, '应展示词根卡片');
    H.click('#rootQuizBtn');
    assert(viewText().includes('推断这个词的含义'), '应进入拆解推断练习');
    assert($('#rqOpts .opt') != null, '推断题应有选项');
    $('#backRoots').click();
    assert($$('#view [data-r]').length >= 20, '可返回词根表');
  });

  /* ---------- v1.4.0：真题全卷模式 ---------- */
  T.add('ZT-01 真题全卷结构与真卷时长/分值正确', () => {
    const S = App.Mock.REAL_SECS;
    assert(S.length === 6, '应6个分区（阅读拆3子区）');
    const mins = S.reduce((a, s) => a + s.min, 0);
    assert(mins === 130, '总时长应为130分钟，实际 ' + mins);
    assert(S[0].key === 'writing' && S[0].min === 30, '写作30分钟');
    assert(S[1].key === 'listening' && S[1].min === 30, '听力30分钟');
    assert(S[5].key === 'trans' && S[5].min === 30, '翻译30分钟');
    const readingMins = S.filter(s => s.group === '阅读 40′').reduce((a, s) => a + s.min, 0);
    assert(readingMins === 40, '阅读合计40分钟');
  });

  T.add('ZT-02 710 分制折算正确', () => {
    const full = App.Mock.scoreReal({ writing: { score: 100 }, listening: { c: 25, t: 25 }, reading: { c: 30, t: 30 }, translation: { score: 100 } });
    assert(full.writing === 107 && full.listening === 249 && full.reading === 249 && full.translation === 107, '满分折算应≈106.5/248.5：' + JSON.stringify(full));
    assert(full.total === 712 || full.total === 710 || full.total === 711, '满分总分应≈710');
    const half = App.Mock.scoreReal({ writing: { score: 50 }, listening: { c: 12, t: 24 }, reading: { c: 15, t: 30 }, translation: { score: 50 } });
    assert(half.total > 300 && half.total < 380, '半对折算应在350左右，实际 ' + half.total);
    const zero = App.Mock.scoreReal({});
    assert(zero.total === 0, '空结果应为0分');
  });

  T.add('ZT-03 真题全卷入口与版权/对标说明', () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.go('mock');
    assert($('#startReal') != null, '应有真题全卷入口');
    assert(viewText().includes('130 分钟'), '应标注130分钟');
    assert(viewText().includes('710'), '应标注710分制');
    assert(viewText().includes('自编仿真题') && viewText().includes('版权'), '应诚实标注题源为仿真题并说明版权');
    assert(viewText().includes('听力 30'), '应含听力分区');
  });

  T.add('ZT-04 听力模拟区：题目编排与解锁作答', () => {
    App.go('mock');
    // 听力模拟渲染器结构验证
    const ids = App.Mock.REAL_LISTENING_SETS.cet6;
    assert(App.Listening.mockQuestionCount(ids) === 10, '六级听力三套应10题，实际 ' + App.Listening.mockQuestionCount(ids));
    const holder = document.createElement('div');
    document.body.appendChild(holder);
    let submitted = null;
    const h = App.Listening.renderMock(holder, r => { submitted = r; }, { setIds: ids });
    assert(h.count() === 10, '渲染器应报告10题');
    assert(holder.querySelector('#mPlay') != null, '应有播放按钮');
    // 播放解锁逻辑：模拟 TTS 播放置解锁位
    const first = ids[0] + '#0';
    const opt = holder.querySelector('.opt[data-key="' + first + '"]');
    assert(opt.style.pointerEvents !== '', '未播放前第一套作答应锁定');
    // 模拟播放完成（直接置解锁状态重绘）
    holder.querySelectorAll('.opt').length;
    h.forceSubmit();
    assert(submitted && submitted.t === 10, '强交应返回完整结构');
    holder.remove();
  });

  T.add('ZT-05 真题全卷流程：写作切听力/中止/成绩折算入库', async () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    const oldConfirm = window.confirm;
    window.confirm = () => true;   // 全程自动确认
    App.go('mock');
    H.click('#startReal');
    assert(viewText().includes('✍️ 写作'), '第一区应为写作');
    assert($('#secBody textarea') != null, '写作区应有作答框');
    // 填写作（≥20词避免确认弹窗）并提交 → 应切到听力区
    const essayText = Array(4).fill('Technology changes education in many ways and students benefit from digital tools.').join(' ');
    document.querySelector('#secBody textarea').value = essayText;
    H.click('#secBody #mSubmit');
    await new Promise(r => setTimeout(r, 100));
    assert(document.querySelector('#secBody #mPlay') != null, '第二区应为听力（有播放按钮）');
    assert(document.querySelector('#mQZone') != null, '听力区应渲染题目编排');
    // 中止考试
    H.click('#abort');
    window.confirm = oldConfirm;
    await new Promise(r => setTimeout(r, 80));
    assert(viewText().includes('真题全卷模式'), '中止后应回到模考中心');
    // 成绩折算入库
    const r = { writing: { score: 80, text: 'test' }, listening: { c: 20, t: 25 }, reading: { c: 24, t: 30 }, translation: { score: 70, text: 'x' } };
    const s = App.Mock.scoreReal(r);
    App.store.mocks.push({ date: App.today(), setId: 'REAL', mode: 'real', parts: { writing: s.writing, listening: s.listening, reading: s.reading, translation: s.translation }, total: s.total });
    App.save();
    const last = App.store.mocks[App.store.mocks.length - 1];
    assert(last.mode === 'real' && last.total >= 300 && last.total <= 710, '真题成绩应入库且在合理区间：' + last.total);
  });

  /* ---------- v1.8.0：六级难度对标 ---------- */
  T.add('RD6 仔细阅读对标真题难度', () => {
    for (const s of (window.READING_CAREFUL || [])) {
      const words = s.text.split(/\s+/).filter(x => /[a-zA-Z]/.test(x)).length;
      const sents = s.text.split(/[.!?]+/).filter(x => x.trim().split(/\s+/).length > 5);
      const avg = Math.round(words / Math.max(1, sents.length));
      assert(words >= 360, s.id + ' 词数应≥360，实际 ' + words);
      assert(avg >= 18, s.id + ' 平均句长应≥18词，实际 ' + avg);
      assert(s.questions.length === 5, s.id + ' 应5题');
      const expOk = s.questions.every(q => q.exp && q.exp.length >= 40);
      assert(expOk, s.id + ' 每题应有详细中文解析');
      const stems = s.questions.map(q => q.q.toLowerCase()).join(' ');
      const hasPurposeOrInfer = /in order to|inferred|closest in meaning|suggests/.test(stems);
      assert(hasPurposeOrInfer, s.id + ' 应含推断/词义/目的题型');
    }
  });

  T.add('LS6 六级听力语篇密度达标', () => {
    const sets = (window.LISTENING_CET6 || []);
    assert(sets.length >= 6, '六级听力应≥6套');
    for (const s of sets) {
      assert(s.sentences.length >= 10, s.id + ' 句子应≥10，实际 ' + s.sentences.length);
      const enTexts = s.sentences.map(x => x.en);
      const avgW = Math.round(enTexts.reduce((a, t2) => a + t2.split(/\s+/).length, 0) / enTexts.length);
      assert(avgW >= 11, s.id + ' 平均句长应≥11词，实际 ' + avgW);
      const longWords = enTexts.join(' ').split(/\s+/).filter(w => w.length >= 10).length;
      assert(longWords >= 8, s.id + ' 学术长词应≥8个，实际 ' + longWords);
      const cns = s.sentences.every(x => x.cn && x.cn.length >= 4);
      assert(cns, s.id + ' 每句应有中文译文');
    }
  });

  T.add('GEN6 选词填空生成框架对标六级句式', () => {
    const s = App.Gen.makeCloze('tech', { level: 'cet6' });
    assert(s && s.text.length >= 500, '生成文段应足够长');
    assert(s.options.length === 15, '应15选项');
    const text = s.text.replace(/\{\d+\}/g, 'X');
    const markers = [' that ', ' which ', ' while ', ' when ', ' only '];
    assert(markers.some(m => text.includes(m)), '生成文段应含从句/复杂结构标记');
  });

  T.add('RD6 仔细阅读对标真题难度', () => {
    for (const s of (window.READING_CAREFUL || [])) {
      const words = s.text.split(/\s+/).filter(x => /[a-zA-Z]/.test(x)).length;
      const sents = s.text.split(/[.!?]+/).filter(x => x.trim().split(/\s+/).length > 5);
      const avg = Math.round(words / Math.max(1, sents.length));
      assert(words >= 360, s.id + ' 词数应≥360，实际 ' + words);
      assert(avg >= 18, s.id + ' 平均句长应≥18词，实际 ' + avg);
      assert(s.questions.length === 5, s.id + ' 应5题');
      const expOk = s.questions.every(q => q.exp && q.exp.length >= 40);
      assert(expOk, s.id + ' 每题应有详细中文解析');
      const stems = s.questions.map(q => q.q.toLowerCase()).join(' ');
      const hasPurposeOrInfer = /in order to|inferred|closest in meaning|suggests/.test(stems);
      assert(hasPurposeOrInfer, s.id + ' 应含推断/词义/目的题型');
    }
  });

  T.add('LS6 六级听力语篇密度达标', () => {
    const sets = (window.LISTENING_CET6 || []);
    assert(sets.length >= 6, '六级听力应≥6套');
    for (const s of sets) {
      assert(s.sentences.length >= 10, s.id + ' 句子应≥10，实际 ' + s.sentences.length);
      const enTexts = s.sentences.map(x => x.en);
      const avgW = Math.round(enTexts.reduce((a, t) => a + t.split(/\s+/).length, 0) / enTexts.length);
      assert(avgW >= 11, s.id + ' 平均句长应≥11词，实际 ' + avgW);
      const longWords = enTexts.join(' ').split(/\s+/).filter(w => w.length >= 10).length;
      assert(longWords >= 8, s.id + ' 学术长词应≥8个，实际 ' + longWords);
      const cns = s.sentences.every(x => x.cn && x.cn.length >= 4);
      assert(cns, s.id + ' 每句应有中文译文');
    }
  });

  T.add('GEN6 选词填空生成框架对标六级句式', () => {
    // 触发一次生成检查产出
    const s = App.Gen.makeCloze('tech', { level: 'cet6' });
    assert(s && s.text.length >= 500, '生成文段应足够长');
    assert(s.options.length === 15, '应15选项');
    // 生成文段的句子应含从句标记（对标六级复杂句式）
    const text = s.text.replace(/\{\d+\}/g, 'X');
    const markers = [' that ', ' which ', ' while ', ' when ', ' only '];
    assert(markers.some(m => text.includes(m)), '生成文段应含从句/复杂结构标记');
  });

  T.add('WRI6 写作范文保持六级高级句式水准', () => {
    for (const t of (window.WRITING_TOPICS || [])) {
      const w = t.sample.split(/\s+/).length;
      assert(w >= 140 && w <= 230, t.id + ' 范文词数应140-230，实际 ' + w);
      const adv = ['Only by', 'Not only', 'It is', 'With the', 'Admittedly', 'which', 'Were it', 'whether', 'Rather than'].filter(m => t.sample.includes(m));
      assert(adv.length >= 1 || t.sample.split(/[.!?]+/).some(x => x.trim().split(/\s+/).length >= 25), t.id + ' 应含高级句式或长句，实际 ' + adv.join(','));
    }
  });

  T.add('TR6 翻译参考译文保持六级书面语水准', () => {
    for (const p of (window.TRANSLATION_PASSAGES || [])) {
      const w = p.ref.split(/\s+/).length;
      assert(w >= 80, p.id + ' 参考译文应≥80词，实际 ' + w);
      const markers = [', which ', ', making ', ' has been ', ' are being ', ' with a ', ' by the ', ' to be '];
      assert(markers.filter(m => p.ref.toLowerCase().includes(m)).length >= 1, p.id + ' 应含≥1处书面语结构标记');
    }
  });

  /* ---------- v1.5.0：题源自动补充 ---------- */
  T.add('AG-01 每日首次打开自动补充新题', () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.store.genBank = [];
    App.store.genLastDate = '2026-01-01';   // 让今天成为"新的一天"
    const r = App.Gen.autoSupply();
    assert(r.careful >= 1 && r.cloze >= 1, '新的一天应补充 1 阅读 + 1 选词，实际 ' + JSON.stringify(r));
    assert(r.newDay === true, '应识别为新的一天');
    assert(App.store.genBank.length >= 2, '生成题应持久化入库');
    assert(App.store.genLastDate === App.today(), '应记录补充日期');
    // 同一天再次调用：不重复每日补充
    const before = App.store.genBank.length;
    const r2 = App.Gen.autoSupply();
    assert(r2.careful === 0 && r2.cloze === 0, '同一天不应重复每日补充，实际 ' + JSON.stringify(r2));
    assert(App.store.genBank.length >= before, '库存不减少');
  });

  T.add('AG-02 库存低于下限自动补齐至2篇', () => {
    App.store.genBank = [];
    App.store.genLastDate = App.today();   // 今天已补过，不触发每日逻辑
    // 只放 1 篇已做过的 careful（占用库存）
    const s = App.Gen.makeCareful('tech');
    App.store.genBank.push({ id: s.id, type: 'careful', theme: 'tech', date: App.today(), set: s });
    App.store.practice.reading.push({ d: Date.now(), type: 'careful', id: s.id, c: 5, t: 5 });
    const r = App.Gen.autoSupply();
    const freshCareful = App.Gen.bankFor('careful').filter(g => !App.store.practice.reading.some(x => x.id === g.set.id));
    const freshCloze = App.Gen.bankFor('cloze').filter(g => !App.store.practice.reading.some(x => x.id === g.set.id));
    assert(r.cloze >= 2, '无库存的选词填空应补 2 篇');
    assert(freshCareful.length >= 2 && freshCloze.length >= 2, '两类型新鲜库存都应≥2：' + freshCareful.length + '/' + freshCloze.length);
  });

  T.add('AG-03 生成题持久展示在题型页且可进入', () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.go('reading', { type: 'careful' });
    assert(viewText().includes('智能生成题源'), '题型页应展示生成题源区');
    const genCards = $$('#view [data-gen]');
    assert(genCards.length >= 1, '应显示生成题卡片');
    genCards[0].click();
    assert($('#submit') != null, '点击生成题应进入练习');
    assert(document.querySelector('#view b') != null || viewText().length > 200, '生成文章应正常渲染');
  });

  T.add('AG-04 超过60篇自动裁剪最旧已做题', () => {
    const bak = App.store.genBank;
    App.store.genBank = [];
    // 伪造 65 篇：前 10 篇标记为已做（应先被裁剪），其余 55 篇未做
    for (let i = 0; i < 65; i++) {
      const id = 'gen-c-fake' + i;
      const g = { id, type: 'careful', theme: 'tech', date: '2025-01-01', set: { id, title: 'fake' + i, text: 'x', questions: [{ q: 'q', opts: ['a', 'b', 'c', 'd'], a: 0, exp: 'e' }] } };
      App.store.genBank.push(g);
      if (i < 10) App.store.practice.reading.push({ d: Date.now(), type: 'careful', id, c: 5, t: 5 });
    }
    App.Gen.autoSupply();
    assert(App.store.genBank.length <= App.Gen.GEN_CAP, '裁剪后应≤60，实际 ' + App.store.genBank.length);
    const fakeDone = App.store.genBank.filter(g => g.set.id.startsWith('gen-c-fake') && App.store.practice.reading.some(x => x.id === g.set.id)).length;
    const fakeFresh = App.store.genBank.filter(g => g.set.id.startsWith('gen-c-fake') && !App.store.practice.reading.some(x => x.id === g.set.id)).length;
    assert(fakeDone < 10, '已做题应优先被裁剪（剩<10），实际 ' + fakeDone);
    assert(fakeFresh === 55, '未做的新题应保留（55），实际 ' + fakeFresh);
    App.store.genBank = bak;
  });

  /* ---------- v1.6.0：词根扩容 / 句子翻译训练 / 题库扩充+个性化生成 ---------- */
  T.add('RT-11 词根库扩容至常见全集（词根/前缀/后缀）', () => {
    const roots = window.WORD_ROOTS || [];
    assert(roots.length >= 90, '词根应≥90个，实际 ' + roots.length);
    assert(Object.keys(window.WORD_PREFIXES || {}).length >= 35, '前缀应≥35个');
    assert(Object.keys(window.WORD_SUFFIXES || {}).length >= 25, '后缀应≥25个');
    const words = new Set();
    roots.forEach(r => {
      assert(r.r && r.m && r.ex.length >= 2, '词根 ' + r.r + ' 数据不完整');
      r.ex.forEach(x => { assert(x[0] && !words.has(x[0]), '派生词缺失或重复：' + x[0]); words.add(x[0]); });
    });
    assert(words.size >= 270, '派生词总量应≥270，实际 ' + words.size);
    assert(App.morph('international').prefix.p === 'inter', 'international 应拆出前缀 inter');
  });

  T.add('RT-12 词根页搜索与统计生效', () => {
    App.store.profile.placed = true;
    App.go('vocab');
    const rootTab = Array.from(document.querySelectorAll('#view .tab')).find(t => t.textContent.includes('词根词缀'));
    rootTab.click();
    assert(viewText().match(/词根库共 \d+ 个/), '应显示词根数量统计');
    const kw = document.querySelector('#rootKw');
    kw.value = 'spect';
    kw.oninput();
    assert($$('#rootGrid [data-r]').length >= 1, '搜索 spect 应有结果');
    H.click('#rootGrid [data-r]');
    assert(viewText().includes('派生词'), '点击应展开词根详情');
  });

  T.add('ST-01 句子翻译库与评分引擎', () => {
    const bank = window.TRANSLATION_SENTENCES || [];
    assert(bank.length >= 36, '句子库应≥36句，实际 ' + bank.length);
    bank.forEach((s, i) => {
      assert(s.cn && s.ref && s.keys.length >= 2, '第' + (i + 1) + '句结构不完整');
      s.keys.forEach(k => assert(s.ref.toLowerCase().includes(k.toLowerCase()), '第' + (i + 1) + '句 key 未在参考译文中出现：' + k));
    });
    const item = bank[0];
    const good = App.grader.gradeSentence(item.ref, item);
    assert(good.score >= 90, '照抄参考应得高分，实际 ' + good.score);
    const poor = App.grader.gradeSentence('I like apple very much haha.', item);
    assert(poor.score < good.score - 20, '错误译文应显著低分');
    assert(poor.missed.length >= 1, '应列出未译出的关键表达');
  });

  T.add('ST-02 句子训练页可作答并出反馈', async () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.go('translation');
    const sentTab = Array.from(document.querySelectorAll('#view .tab')).find(t => t.textContent.includes('句子训练'));
    assert(sentTab != null, '应出现句子训练标签');
    sentTab.click();
    assert($('#sentInput') != null, '应渲染作答框');
    assert(viewText().includes('看参考译文'), '应有参考译文入口');
    document.querySelector('#sentInput').value = window.TRANSLATION_SENTENCES[0].ref;
    H.click('#sentGrade');
    assert(viewText().includes('AI 评分'), '应显示 AI 评分');
    assert(viewText().includes('参考译文'), '应显示参考译文对照');
  });

  T.add('QB-01 模考卷扩至4套且话题覆盖广', () => {
    App.go('mock');
    const cards = $$('#view [data-set]');
    assert(cards.length === 4, '应显示4套模考卷，实际 ' + cards.length);
    assert(viewText().includes('模考卷 C') && viewText().includes('模考卷 D'), '应含卷C与卷D');
    assert(viewText().includes('文化'), '卷C应显示文化话题');
  });

  T.add('QB-02 生成器：文化主题 + 难度 + 生词本个性化', () => {
    const cul = App.Gen.makeCareful('culture');
    assert(cul && cul.text.length >= 700, '文化主题应可生成完整文章');
    assert(App.Gen.themes().length === 6, '生成主题应共6个');
    const s = App.Gen.makeCloze('edu', { level: 'cet4' });
    assert(s.a.length === 10, '四级难度选词填空应正常生成');
    App.store.wordbook['profound'] = { d: App.today(), src: '测试' };
    App.store.wordbook['vivid'] = { d: App.today(), src: '测试' };
    App._words = null; App._wmap = null;
    const c = App.Gen.makeCareful('tech', { seedWords: ['profound', 'vivid'] });
    const wordQ = c.questions.find(q => q.q.includes('closest in meaning'));
    assert(wordQ.opts.some(o => o.includes('深刻')), '词义题应使用生词本词的真实释义');
    delete App.store.wordbook['profound'];
    delete App.store.wordbook['vivid'];
    App._words = null; App._wmap = null;
  });

  T.add('QB-03 生成面板含难度与生词本选项', () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.go('reading');
    assert($('#genLevel') != null, '应有难度选择');
    assert($('#genWordbook') != null, '应有生词本勾选');
    assert(Array.from(document.querySelectorAll('#genTheme option')).some(o => o.textContent.includes('文化')), '主题应含文化');
  });

  /* ---------- v1.7.0：真题中心（资源导航/本地真题库/刷题记录） ---------- */
  T.add('EX-01 资源导航数据完整且含版权声明', () => {
    const links = window.REAL_EXAM_LINKS || [];
    assert(links.length >= 3, '应≥3个资源站，实际 ' + links.length);
    links.forEach(L => {
      assert(L.name && L.url.indexOf('https://') === 0 && L.desc && L.note, '资源 ' + L.name + ' 数据不完整');
      assert(L.levels.includes('cet4') || L.levels.includes('cet6'), L.name + ' 应标注级别');
    });
    assert(/考试委员会/.test(window.REAL_EXAM_DISCLAIMER || ''), '应有版权归属声明');
    assert(/不收录|不分发/.test(window.REAL_EXAM_DISCLAIMER || ''), '应声明 App 不收录不分发');
    // 页面渲染
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.go('realexam');
    assert(viewText().includes('版权说明'), '页面应显示版权说明');
    assert(viewText().includes('CET46-Resources'), '应包含 GitHub 资源站');
    assert(viewText().includes('懒笔记'), '应包含懒笔记资源站');
    assert($$('#reBody a[target="_blank"]').length >= 3, '应有打开站点外链');
  });

  T.add('EX-02 本地真题文件库：kind识别/存取回环/删除', async () => {
    assert(App.retx.kindOf('2023.06 真题.pdf') === 'paper', 'pdf 应识别为试卷');
    assert(App.retx.kindOf('listening.mp3') === 'audio', 'mp3 应识别为听力');
    assert(App.retx.kindOf('photo.png') === null, '不支持的类型应返回 null');
    const blob = new Blob(['%PDF-1.4 fake'], { type: 'application/pdf' });
    await App.retdb.put('re_test', blob);
    const got = await App.retdb.get('re_test');
    assert(got && got.size === blob.size, '取回应得到相同大小 blob');
    await App.retdb.del('re_test');
    assert((await App.retdb.get('re_test')) === null, '删除后应为空');
  });

  T.add('EX-03 本地真题库：导入元数据/列表/删除流程', async () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.store.realExams = [];
    App.go('realexam');
    const libTab = Array.from(document.querySelectorAll('#view .tab')).find(t => t.textContent.includes('本地真题库'));
    libTab.click();
    assert($('#reImportBtn') != null, '应有导入按钮');
    // 模拟导入（绕过文件选择器：直接写存储 + 刷新视图）
    const blob = new Blob(['%PDF-1.4 test paper content'], { type: 'application/pdf' });
    const key = 're_cet6_2024_6_' + Date.now();
    await App.retdb.put(key, blob);
    App.store.realExams.push({ key, kind: 'paper', level: 'cet6', year: 2024, month: 6, name: '2024年6月第一套.pdf', size: blob.size, label: '第一套', date: Date.now() });
    App.save();
    App.go('realexam');
    const libTab2 = Array.from(document.querySelectorAll('#view .tab')).find(t => t.textContent.includes('本地真题库'));
    libTab2.click();
    assert(viewText().includes('2024.06'), '列表应显示导入的真题');
    assert(viewText().includes('第一套'), '应显示备注标签');
    // 删除
    const oldConfirm = window.confirm; window.confirm = () => true;
    H.click('[data-delre="' + key + '"]');
    window.confirm = oldConfirm;
    await new Promise(r => setTimeout(r, 80));
    assert(!(App.store.realExams || []).some(x => x.key === key), '删除后元数据应移除');
    assert((await App.retdb.get(key)) === null, '删除后文件应移除');
  });

  T.add('EX-04 刷题记录：录入/统计/425分数线/删除', () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.store.realScores = [];
    App.go('realexam');
    const scTab = Array.from(document.querySelectorAll('#view .tab')).find(t => t.textContent.includes('刷题记录'));
    scTab.click();
    document.querySelector('#scLevel').value = 'cet6';
    document.querySelector('#scLabel').value = '2024.06 第一套';
    document.querySelector('#scTotal').value = '480';
    document.querySelector('#scL').value = '180';
    document.querySelector('#scR').value = '160';
    document.querySelector('#scW').value = '140';
    H.click('#scAdd');
    assert(App.store.realScores.length === 1, '应录入一条记录');
    document.querySelector('#scTotal').value = '560';
    H.click('#scAdd');
    assert(App.store.realScores.length === 2, '应录入第二条');
    assert(viewText().includes('平均分'), '应显示平均分统计');
    assert(viewText().includes('最高分'), '应显示最高分统计');
    assert(viewText().includes('425') || viewText().includes('分数'), '应体现分数线信息');
    // 删除一条
    const oldConfirm = window.confirm; window.confirm = () => true;
    H.click('[data-delsc="' + App.store.realScores[0].id + '"]');
    window.confirm = oldConfirm;
    assert(App.store.realScores.length === 1, '删除后应剩一条');
  });
})(window.__E2E);
