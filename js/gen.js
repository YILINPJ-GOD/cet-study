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

  /* 六级真题仔细阅读为 400-450 词、多段的学术说明/论说文。
     生成器用满主题事实句模板装配 7 段：8 条六级风格长句（≥26 词）与 10 条短句
     搭配进段，保证每段 ≥45 词、全文 ≥400 词，杜绝"两三句话算一段"的薄段落。 */
  const DETAIL_DISTRACTORS = [
    "It has no effect on ordinary people",
    "It disappeared after a short period",
    "Only large companies benefit from it",
    "It was abandoned soon after being proposed",
    "It mainly affects a single small group",
    "It has been universally rejected by experts",
    "It contradicts what earlier studies found"
  ];
  const LONG_MIN_WORDS = 22; // 六级长句模板均 ≥26 词，基础短模板均 ≤19 词

  /* ---------- 仔细阅读生成（支持个性化：难度 + 生词本植入） ---------- */
  App.Gen.makeCareful = function (themeKey, opts) {
    opts = opts || {};
    const theme = (window.GEN_THEMES || {})[themeKey];
    if (!theme) return null;
    const seed = (Date.now() % 100000000) + (counter++);
    const r = rng(seed);
    const nps = shuffle(r, theme.nps);
    const wc = s => (s.match(/\S+/g) || []).length;
    let longs = shuffle(r, theme.fact.filter(x => wc(x.s) >= LONG_MIN_WORDS));
    let shorts = shuffle(r, theme.fact.filter(x => wc(x.s) < LONG_MIN_WORDS));
    while (longs.length < 8) longs = longs.concat(shuffle(r, theme.fact));
    while (shorts.length < 10) shorts = shorts.concat(shuffle(r, theme.fact));
    const L = i => fill(longs[i % longs.length].s, nps, r).text;
    const S = i => fill(shorts[i % shorts.length].s, nps, r).text;
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
      intro1 + " " + intro2 + " " + S(0) + " " + L(0),
      L(1) + " " + S(1) + " " + S(2),
      S(3) + " " + S(4) + " " + L(2) + " " + sent1,
      L(3) + " " + S(5) + " " + S(6),
      S(7) + " " + S(8) + " " + L(4) + " " + sent2,
      L(5) + " " + L(6) + " " + S(9),
      L(7) + " " + stance
    ].filter(s => s.trim().length > 30).join("\n\n");

    // 题目：2 细节 + 2 词义 + 1 主旨 = 5 题（细节题取自前两段的长句，便于定位）
    const qs = [];
    [[L(0), longs[0]], [L(1), longs[1]]].forEach(([sen, ft]) => {
      const npForQ = ft.q.includes('{np}') ? (sen.match(/(?:[A-Z][a-z]+ ?){1,3}/) || ['the trend'])[0] : '';
      const ds = shuffle(r, DETAIL_DISTRACTORS.filter(x => x !== ft.a)).slice(0, 3);
      const opts = shuffle(r, [ft.a].concat(ds));
      qs.push({
        q: ft.q.replace(/\{np\}/g, npForQ || 'the change'),
        opts,
        a: opts.indexOf(ft.a),
        exp: "细节题。定位句：" + sen
      });
    });
    tws.forEach((tw, i) => {
      // 干扰项按中文释义去重，避免不同主题词池出现同义释义导致选项重复
      const seen = new Set([tw[1]]);
      const ds = [];
      for (const x of shuffle(r, otherTw)) {
        if (!seen.has(x[1])) { seen.add(x[1]); ds.push(x[1]); }
        if (ds.length === 3) break;
      }
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
    return {
      id: 'gen-c-' + seed,
      title: title + '（智能生成 · ' + theme.label + '）',
      text,
      questions: qs.slice(0, 5),
      gen: true, theme: themeKey
    };
  };

  /* ---------- 长篇阅读生成（9 段 + 5 句信息匹配，篇幅难度对标静态题库三篇） ---------- */
  /* mBank 每主题 10 组"段落（3 句，含 {np} 槽位）+ 匹配句（真题式改写）+ 解析"；
     生成时随机取 9 段标 A–I，再按散开位置抽 5 段出题，保证答案字母分布均匀。 */
  const MATCH_PATTERNS = [
    [0, 2, 3, 5, 7],
    [1, 2, 4, 6, 8],
    [0, 1, 3, 5, 8],
    [0, 2, 4, 5, 7],
    [1, 3, 4, 6, 7],
    [0, 3, 4, 6, 8]
  ];

  App.Gen.makeMatching = function (themeKey, opts) {
    opts = opts || {};
    const theme = (window.GEN_THEMES || {})[themeKey];
    if (!theme || !Array.isArray(theme.mBank) || theme.mBank.length < 9) return null;
    const seed = (Date.now() % 100000000) + 9000 + (counter++);
    const r = rng(seed);
    const nps = shuffle(r, theme.nps);
    const wc = s => (s.match(/\S+/g) || []).length;
    const picks = shuffle(r, theme.mBank).slice(0, 9);
    // 每段追加一句主题内的补充短句（取自该主题事实句池），使段落厚度对标静态题库（约 55-70 词/段）
    let shorts = shuffle(r, (theme.fact || []).filter(x => wc(x.s) < 22));
    while (shorts.length < picks.length) shorts = shorts.concat(shuffle(r, theme.fact || []));
    const letters = 'ABCDEFGHI';
    const paras = picks.map((f, i) => [
      letters[i],
      f.p.map(s => fill(s, nps, r).text).join(' ') + ' ' + fill(shorts[i % shorts.length].s, nps, r).text
    ]);
    const idxs = pick(r, MATCH_PATTERNS);
    const items = idxs.map(i => ({
      stmt: picks[i].stmt,
      a: letters[i],
      exp: "定位 " + letters[i] + " 段：" + picks[i].exp
    }));
    return {
      id: 'gen-m-' + seed,
      title: pick(r, theme.titles) + '（智能生成 · ' + theme.label + '）',
      paras, items,
      gen: true, theme: themeKey
    };
  };

  /* ---------- 选词填空生成 ---------- */
  /* 20 个六级长难句框架（带 {b} 空槽与词性/解题提示），每次抽 10 个；
     篇幅目标：6 段 500 词以上，对标六级真题语篇密度。 */
  const CLOZE_FRAMES = [
    { s: "Whether such policies can {b} the inequalities they inherit remains sharply contested among researchers who have watched similar promises quietly fade before.", pos: 'v', cue: "whether 主语从句后缺谓语动词原形，与 inequalities 搭配" },
    { s: "What looks like a purely {b} shift often carries consequences that reach far beyond its original context, touching households that never asked for it.", pos: 'adj', cue: "纯修饰语位置需要形容词，与 shift 搭配" },
    { s: "Underlying the whole debate is a deeper {b}: who bears the cost when circumstances change, and who exactly gets to decide?", pos: 'n', cue: "形容词 deeper 后需要名词，冒号后为解释" },
    { s: "Officials responded to the evidence {b}, adjusting their targets only after the damage had been measured, photographed and widely reported.", pos: 'adv', cue: "修饰 responded 需要副词，与 after 从句语义呼应" },
    { s: "The committee has urged ministers to {b} rules that were drafted for conditions that no longer exist in any meaningful form.", pos: 'v', cue: "不定式 to 后缺动词原形，与 rules 搭配" },
    { s: "What appears {b} in theory frequently proves far harder to deliver in practice, where budgets, habits and elections intervene.", pos: 'adj', cue: "系动词 appears 后需要形容词作表语" },
    { s: "Behind the statistics lies a {b} question: whether the gains are shared fairly across generations, or merely postponed for them to repay.", pos: 'adj', cue: "名词 question 前需要形容词作定语" },
    { s: "Several cities have tried to {b} the model, only to discover that copying a policy is far easier than copying the conditions that made it work.", pos: 'v', cue: "不定式 to 后缺动词原形，与 only to 发现搭配" },
    { s: "The pace at which such arrangements are being {b} has caught many observers off guard, including some who helped design them.", pos: 'v', cue: "被动语态 be + 过去分词，与 arrangements 搭配" },
    { s: "Critics concede the ambition is admirable, yet question whether the {b} justifies the expense at a time of tight budgets.", pos: 'n', cue: "定冠词 the 后需要名词，与 expense 并列对照" },
    { s: "The evidence, though still fragmentary, {b} that early intervention matters more than later correction, however expensive the former may seem.", pos: 'v', cue: "主语 evidence 为单数，缺谓语动词，与 that 从句搭配" },
    { s: "Few institutions are willing to {b} practices that have long defined their public identity, even when those practices no longer serve it.", pos: 'v', cue: "不定式 to 后缺动词原形，与 practices 搭配" },
    { s: "What many analysts overlook is how quickly public attitudes {b} once the costs of inaction become visible to ordinary households rather than to statisticians.", pos: 'v', cue: "复数主语 attitudes 缺谓语动词原形，与 once 从句呼应" },
    { s: "Critics and supporters {b} on one point: the status quo cannot hold for another decade without serious reform.", pos: 'v', cue: "并列复数主语缺谓语动词，与介词 on 搭配" },
    { s: "Whether the policy survives the next election depends less on ideology than on the measurable {b} it can show within two years.", pos: 'n', cue: "定冠词 the 后需要名词，与 measurable 及后文 show 的宾语呼应" },
    { s: "To assume the trend will simply reverse is to misread how deeply the {b} has entered everyday decisions in ordinary families.", pos: 'n', cue: "定冠词 the 后需要名词作从句主语，谓语为单数" },
    { s: "The transition is neither smooth nor {b}, and pretending otherwise has only delayed the honest planning that officials now acknowledge.", pos: 'adj', cue: "neither...nor 并列结构需要形容词，与 smooth 对照" },
    { s: "Households that adopted the practice early report savings that are anything but {b}, a detail that has quietly changed the debate.", pos: 'adj', cue: "anything but 后需要形容词作表语，与 savings 呼应" },
    { s: "The plan is ambitious in outline yet worryingly {b} in precisely the details that matter most to the people affected by it.", pos: 'adj', cue: "副词 worryingly 后需要形容词作表语，与 in the details 搭配" },
    { s: "Officials now publish the numbers quarterly, a habit that would have been almost unthinkable a decade {b} in this sector.", pos: 'adv', cue: "a decade 后需要时间副词，与句首 now 呼应" }
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
    const intro1 = fill(theme.intro[0], nps, r).text;
    const intro2 = fill(theme.intro[1] || theme.intro[0], nps, r).text;
    const stance = fill(theme.stance, nps, r).text;
    /* 填充句用满主题事实句池（8 条长句 + 10 条短句，均无空格），支撑六段 500 词以上的六级语篇密度 */
    const wc2 = s => (s.match(/\S+/g) || []).length;
    const allFacts = shuffle(r, theme.fact || []);
    const longs = allFacts.filter(x => wc2(x.s) >= 22).map(x => fill(x.s, nps, r).text);
    const shorts = allFacts.filter(x => wc2(x.s) < 22).map(x => fill(x.s, nps, r).text);
    while (longs.length < 8) longs.push(fill(pick(r, allFacts).s, nps, r).text);
    while (shorts.length < 10) shorts.push(fill(pick(r, allFacts).s, nps, r).text);
    const L = i => longs[i % longs.length];
    const S = i => shorts[i % shorts.length];
    /* 六段装配：空格分布 2/2/2/2/1/1，段段有事实句铺垫，全文约 550-650 词 */
    const text = [
      intro1 + " " + intro2 + " " + S(0) + " " + sentTexts[0] + " " + S(1) + " " + sentTexts[1],
      L(0) + " " + sentTexts[2] + " " + S(2) + " " + L(1) + " " + sentTexts[3],
      S(3) + " " + sentTexts[4] + " " + L(2) + " " + sentTexts[5] + " " + S(4),
      L(3) + " " + sentTexts[6] + " " + S(5) + " " + L(4) + " " + sentTexts[7],
      L(5) + " " + sentTexts[8] + " " + S(6) + " " + L(6),
      L(7) + " " + S(7) + " " + sentTexts[9] + " " + S(8) + " " + S(9) + " " + stance
    ].join("\n\n");

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
     规则：① 每天首次打开自动补充 1 篇仔细阅读 + 1 篇长篇阅读 + 1 篇选词填空；
     ② 未做过的库存低于下限（各 6 篇）时自动补齐；
     ③ 生成题持久化保存、可回看重做；已做过的不再计入库存；
     ④ 总量超过 60 篇时自动裁剪最旧的已做题。 */
  App.Gen.MIN_STOCK = 6;
  App.Gen.GEN_CAP = 60;
  /* 六级篇幅标准：<5 段或 <350 词的仔细阅读、<500 词的选词填空，均视为旧版薄文章（升级前生成器的产物） */
  function meetsCarefulStandard(set) {
    if (!set || typeof set.text !== 'string') return false;
    const paras = set.text.split(/\n\s*\n/).filter(x => x.trim().length > 30).length;
    const words = set.text.split(/\s+/).filter(x => /[a-zA-Z]/.test(x)).length;
    return paras >= 5 && words >= 350;
  }
  function meetsClozeStandard(set) {
    if (!set || typeof set.text !== 'string') return false;
    const words = set.text.replace(/\{\d+\}/g, ' X ').split(/\s+/).filter(x => /[a-zA-Z]/.test(x)).length;
    return words >= 500;
  }
  App.Gen.autoSupply = function (nowMs) {
    const today = App.today(new Date(nowMs || Date.now()));
    const st = App.store;
    if (!Array.isArray(st.genBank)) st.genBank = [];
    // 本地题库中旧版生成的薄文章（仔细阅读 <5段/<350词、选词填空 <500词）自动淘汰，
    // 由下方补给逻辑按新标准重建。仅针对生成器产物（set.gen 标记），不影响其他来源的题源数据。
    const before = st.genBank.length;
    st.genBank = st.genBank.filter(g => {
      if (!g.set || !g.set.gen) return true;
      if (g.type === 'careful') return meetsCarefulStandard(g.set);
      if (g.type === 'cloze') return meetsClozeStandard(g.set);
      return true;
    });
    const removedLegacy = before - st.genBank.length;
    const seenIds = new Set((st.practice.reading || []).filter(r => String(r.id || '').indexOf('gen-') === 0).map(r => r.id));
    const isFresh = g => !seenIds.has(g.set.id);
    const newDay = st.genLastDate !== today;
    const themes = App.Gen.themes().map(t => t.key);
    let idx = st.genThemeIdx || 0;
    const added = { careful: 0, matching: 0, cloze: 0, themes: [] };

    const addFor = (type) => {
      const fresh = () => st.genBank.filter(g => g.type === type && isFresh(g)).length;
      const need = Math.max(0, App.Gen.MIN_STOCK - fresh()) + (newDay ? 1 : 0);
      let made = 0;
      for (let k = 0; k < need; k++) {
        const themeKey = themes[(idx + k) % themes.length];
        const set = type === 'careful' ? App.Gen.makeCareful(themeKey)
          : type === 'matching' ? App.Gen.makeMatching(themeKey)
          : App.Gen.makeCloze(themeKey);
        if (!set) continue;
        st.genBank.push({ id: set.id, type, theme: themeKey, date: today, set });
        added.themes.push(themeKey);
        made++;
      }
      idx += Math.max(need, 1);
      return made;
    };
    added.careful = addFor('careful');
    added.matching = addFor('matching');
    added.cloze = addFor('cloze');
    st.genThemeIdx = idx;
    st.genLastDate = today;

    // 裁剪：超过上限时优先删除最旧的已做题
    while (st.genBank.length > App.Gen.GEN_CAP) {
      const doneIdx = st.genBank.findIndex(g => !isFresh(g));
      if (doneIdx >= 0) st.genBank.splice(doneIdx, 1);
      else st.genBank.shift();
    }
    if (added.careful + added.matching + added.cloze > 0 || removedLegacy > 0) App.save();
    return { careful: added.careful, matching: added.matching, cloze: added.cloze, newDay, stock: { careful: st.genBank.filter(g => g.type === 'careful' && isFresh(g)).length, matching: st.genBank.filter(g => g.type === 'matching' && isFresh(g)).length, cloze: st.genBank.filter(g => g.type === 'cloze' && isFresh(g)).length } };
  };
  /* 供界面展示：某题型的生成题列表 */
  App.Gen.bankFor = function (type) {
    return (App.store.genBank || []).filter(g => g.type === type);
  };
})();
