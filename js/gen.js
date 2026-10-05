/* ===== 智能出题生成器 App.Gen =====
   按主题+题型程序化生成全新文章与题目，产出的 set 对象直接复用
   阅读专项的渲染器（render_careful / render_cloze）与练习记录。 */
App.Gen = {};
(function () {
  /* 可复现随机：mulberry32 */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  let counter = 0;
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function shuffle(r, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  App.Gen.themes = function () {
    const t = window.GEN_THEMES || {};
    return Object.keys(t).map(k => ({ key: k, label: t[k].label }));
  };

  function fill(text, nps, r) {
    // {np} 槽位依次从名词短语池取（不重复），首字母大写若在句首
    let i = 0;
    const used = new Set();
    return {
      text: text.replace(/\{np\}/g, () => {
        if (i >= nps.length) i = 0;
        let tries = 0, idx = Math.floor(r() * nps.length);
        while (used.has(idx) && tries < nps.length) { idx = Math.floor(r() * nps.length); tries++; }
        used.add(idx); i++;
        return nps[idx][0];
      }),
      used
    };
  }

  /* ---------- 仔细阅读生成（支持个性化：难度 + 生词本植入） ---------- */
  App.Gen.makeCareful = function (themeKey, opts) {
    opts = opts || {};
    const theme = (window.GEN_THEMES || {})[themeKey];
    if (!theme) return null;
    const seed = (Date.now() % 100000000) + (counter++);
    const r = rng(seed);
    const nps = shuffle(r, theme.nps);
    const facts = shuffle(r, theme.fact).slice(0, 6);
    const f0 = fill(facts[0].s, nps, r).text;
    const f1 = fill(facts[1].s, nps, r).text;
    const f2 = fill(facts[2].s, nps, r).text;
    const f3 = fill(facts[3].s, nps, r).text;
    const f4 = fill(facts[4].s, nps, r).text;
    const f5 = fill(facts[5].s, nps, r).text;
    const intro1 = fill(theme.intro[0], nps, r).text;
    const intro2 = fill(theme.intro[1], nps, r).text;
    const stance = fill(theme.stance, nps, r).text;
    const title = pick(r, theme.titles);

    // 词义猜测题：优先植入个性化词（生词本/我的词库），否则用主题目标词
    let tws = [];
    if (opts.seedWords && opts.seedWords.length >= 2) {
      tws = opts.seedWords.slice(0, 2).map(w => {
        const e = App.WMAP()[w];
        return [w, e ? e.gloss : ''];
      }).filter(x => x[1]);
    }
    if (tws.length < 2) tws = shuffle(r, theme.twPool).slice(0, 2);
    const otherTw = shuffle(r, Object.keys(window.GEN_THEMES).filter(k => k !== themeKey)
      .flatMap(k => window.GEN_THEMES[k].twPool).filter(x => !tws.some(t2 => t2[0] === x[0])));
    const sent1 = pick(r, ["To many observers, the change feels utterly {tw}.", "Yet the results have been remarkably {tw} so far.", "Some early attempts proved surprisingly {tw}."]).replace('{tw}', tws[0][0]);
    const sent2 = pick(r, ["Researchers describe the trend as {tw} for at least another decade.", "Officials called the progress {tw}, urging patience.", "Without support, such gains may remain {tw} for many families."]).replace('{tw}', tws[1][0]);

    const text = [
      intro1 + " " + intro2 + " " + f0,
      f1 + " " + sent1 + " " + f2 + " " + f3,
      sent2 + " " + f4 + " " + f5 + " " + stance
    ].join("\n\n");

    // 题目：2 细节 + 2 词义 + 1 主旨
    const qs = [];
    [[f0, facts[0]], [f1, facts[1]]].forEach(([sen, ft]) => {
      const npForQ = ft.q.includes('{np}') ? (sen.match(/(?:[A-Z][a-z]+ ?){1,3}/) || ['the trend'])[0] : '';
      qs.push({
        q: ft.q.replace(/\{np\}/g, npForQ || 'the change'),
        opts: shuffle(r, [ft.a, "It has no effect on ordinary people", "It disappeared after a short period", "Only large companies benefit from it"]),
        a: 0, // 占位，下面重算
        exp: "细节题。定位句：" + sen,
        _a: ft.a
      });
    });
    tws.forEach((tw, i) => {
      const ds = shuffle(r, otherTw).slice(0, 3).map(x => x[1]);
      const opts = shuffle(r, [tw[1]].concat(ds));
      qs.push({
        q: "The word \"" + tw[0] + "\" in the passage is closest in meaning to ______.",
        opts, a: opts.indexOf(tw[1]),
        exp: "词义猜测题。结合上下文与构词法推断，" + tw[0] + " 意为「" + tw[1] + "」；其余选项为词库中其他词的释义。"
      });
    });
    const summaries = shuffle(r, Object.keys(window.GEN_THEMES).filter(k => k !== themeKey))
      .slice(0, 3)
      .map(k => ({ k, s: "It discusses how " + window.GEN_THEMES[k].summary + "." }));
    summaries.push({ k: themeKey, s: "It discusses how " + theme.summary + "." });
    const mainOpts = shuffle(r, summaries.map(x => x.s));
    qs.push({
      q: "Which of the following best states the main idea of the passage?",
      opts: mainOpts, a: mainOpts.indexOf(summaries.find(x => x.k === themeKey).s),
      exp: "主旨题。全文围绕「" + theme.label + "」展开；其余选项偷换主题，文中并未论述。"
    });
    // 重算细节题答案索引
    qs.forEach(q => { if (q._a != null) { q.a = q.opts.indexOf(q._a); delete q._a; } });
    qs.forEach((q, i) => { q.q = (i === qs.length - 1 ? "" : "") + q.q; });

    return {
      id: 'gen-c-' + seed,
      title: title + '（智能生成 · ' + theme.label + '）',
      text,
      questions: qs.slice(0, 5),
      gen: true, theme: themeKey
    };
  };

  /* ---------- 选词填空生成 ---------- */
  const CLOZE_FRAMES = [
    { s: "Experts {b} that the trend will continue for years.", pos: 'v', cue: "主语为复数名词且缺谓语动词，与 that 从句搭配" },
    { s: "This {b} change has drawn wide public attention.", pos: 'adj', cue: "冠词与名词之间需要形容词作定语" },
    { s: "The {b} of new technology is hard to ignore.", pos: 'n', cue: "定冠词 the 后需要名词，与 of 短语搭配" },
    { s: "People are adapting to the new situation {b}.", pos: 'adv', cue: "修饰整个句子的成分需要副词" },
    { s: "Local governments have begun to {b} practical measures.", pos: 'v', cue: "to 不定式后需要动词原形" },
    { s: "The results seem {b} to most researchers.", pos: 'adj', cue: "seem 后需要形容词作表语" },
    { s: "Public interest in the {b} keeps growing.", pos: 'n', cue: "定冠词 the 后需要名词" },
    { s: "Many families now {b} this new habit in daily life.", pos: 'v', cue: "主语后缺谓语动词原形" },
    { s: "The change is developing at an {b} speed.", pos: 'adj', cue: "an 提示后面以元音开头的形容词" },
    { s: "Officials responded {b} to the public's concerns.", pos: 'adv', cue: "修饰动词 responded 需要副词" }
  ];

  App.Gen.makeCloze = function (themeKey, opts) {
    opts = opts || {};
    const theme = (window.GEN_THEMES || {})[themeKey];
    if (!theme) return null;
    const seed = (Date.now() % 100000000) + 5000 + (counter++);
    const r = rng(seed);
    const exam = opts.level || (App.store.profile.exam || 'cet6');
    const tiers = exam === 'cet4' ? ['t4c', 't4h'] : ['t6h', 't6s', 't4h'];
    const bank = App.allWords().filter(w => tiers.includes(w.tier));
    const pool = pos => bank.filter(w => w.tier !== 'custom' && w.gloss && w.gloss.length <= 12 &&
      (pos === 'v' ? w.pos.startsWith('v') : pos === 'adj' ? w.pos.startsWith('adj') : pos === 'n' ? w.pos.startsWith('n') : w.pos.startsWith('adv')));
    const frames = shuffle(r, CLOZE_FRAMES).slice(0, 10);
    const nps = shuffle(r, theme.nps);

    const answers = [], exps = [], usedWords = new Set();
    let npIdx = 0;
    const sentTexts = frames.map((f, i) => {
      // 选正确词：先按词性从主题相关池抽（全局词库）
      let pool2 = pool(f.pos).filter(w => !usedWords.has(w.w));
      if (pool2.length < 4) pool2 = pool(f.pos).filter(w => !usedWords.has(w.w));
      const word = pool2[Math.floor(r() * pool2.length)] || pool(f.pos)[0];
      usedWords.add(word.w);
      answers.push(word);
      exps.push("第" + (i + 1) + "空需要" + ({ v: '动词', adj: '形容词', n: '名词', adv: '副词' }[f.pos]) +
        "（" + f.cue + "），结合语义选 " + word.w + "（" + word.gloss + "）。");
      let s = f.s.replace('{b}', '{' + (i + 1) + '}');
      // 嵌入主题名词短语（若句中有可替换的泛指名词短语）
      if (s.includes('the trend')) s = s.replace('the trend', nps[npIdx++ % nps.length][0] === undefined ? 'the trend' : pick(r, theme.nps)[0]);
      if (s.includes('the new situation')) s = s.replace('the new situation', pick(r, theme.nps)[0]);
      if (s.includes('the {b} of new technology')) s = s.replace('new technology', pick(r, theme.nps)[0]);
      return s;
    });
    const intro = fill(pick(r, theme.intro), nps, r).text;
    const stance = fill(pick(r, theme.stance), nps, r).text;
    const text = intro + "\n\n" + sentTexts.slice(0, 5).join(" ") + "\n\n" + sentTexts.slice(5).join(" ") + " " + stance;

    // 15 选项 = 10 答案 + 5 干扰（不同词性的库内词）
    const distractors = shuffle(r, bank.filter(w => !usedWords.has(w.w) && w.gloss && w.gloss.length <= 12)).slice(0, 5);
    const options = shuffle(r, answers.map(a => a.w).concat(distractors.map(d => d.w)));
    const a = answers.map(ans => options.indexOf(ans.w));
    const title = pick(r, theme.titles) + '（智能生成 · 15选10）';
    return {
      id: 'gen-k-' + seed,
      title, text, options, a, exp: exps,
      gen: true, theme: themeKey
    };
  };
  /* ---------- 题源自动补给 ----------
     规则：① 每天首次打开自动补充 1 篇仔细阅读 + 1 篇选词填空；
     ② 未做过的库存低于下限（各 2 篇）时自动补齐；
     ③ 生成题持久化保存、可回看重做；已做过的不再计入库存；
     ④ 总量超过 60 篇时自动裁剪最旧的已做题。 */
  App.Gen.MIN_STOCK = 2;
  App.Gen.GEN_CAP = 60;
  App.Gen.autoSupply = function (nowMs) {
    const today = App.today(new Date(nowMs || Date.now()));
    const st = App.store;
    if (!Array.isArray(st.genBank)) st.genBank = [];
    const seenIds = new Set((st.practice.reading || []).filter(r => String(r.id || '').indexOf('gen-') === 0).map(r => r.id));
    const isFresh = g => !seenIds.has(g.set.id);
    const newDay = st.genLastDate !== today;
    const themes = App.Gen.themes().map(t => t.key);
    let idx = st.genThemeIdx || 0;
    const added = { careful: 0, cloze: 0, themes: [] };

    const addFor = (type) => {
      const fresh = () => st.genBank.filter(g => g.type === type && isFresh(g)).length;
      const need = Math.max(0, App.Gen.MIN_STOCK - fresh()) + (newDay ? 1 : 0);
      let made = 0;
      for (let k = 0; k < need; k++) {
        const themeKey = themes[(idx + k) % themes.length];
        const set = type === 'careful' ? App.Gen.makeCareful(themeKey) : App.Gen.makeCloze(themeKey);
        if (!set) continue;
        st.genBank.push({ id: set.id, type, theme: themeKey, date: today, set });
        added.themes.push(themeKey);
        made++;
      }
      idx += Math.max(need, 1);
      return made;
    };
    added.careful = addFor('careful');
    added.cloze = addFor('cloze');
    st.genThemeIdx = idx;
    st.genLastDate = today;

    // 裁剪：超过上限时优先删除最旧的已做题
    while (st.genBank.length > App.Gen.GEN_CAP) {
      const doneIdx = st.genBank.findIndex(g => !isFresh(g));
      if (doneIdx >= 0) st.genBank.splice(doneIdx, 1);
      else st.genBank.shift();
    }
    if (added.careful + added.cloze > 0) App.save();
    return { careful: added.careful, cloze: added.cloze, newDay, stock: { careful: st.genBank.filter(g => g.type === 'careful' && isFresh(g)).length, cloze: st.genBank.filter(g => g.type === 'cloze' && isFresh(g)).length } };
  };
  /* 供界面展示：某题型的生成题列表 */
  App.Gen.bankFor = function (type) {
    return (App.store.genBank || []).filter(g => g.type === type);
  };
})();
