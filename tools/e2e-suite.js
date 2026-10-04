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
})(window.__E2E);
