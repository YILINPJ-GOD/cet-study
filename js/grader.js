/* ===== 本地智能批改引擎（写作 + 翻译）===== */
App.grader = {};

/* ---------- 基础资源 ---------- */
const G_STOP = new Set(('a an the and or but of to in on at for with by from as is are was were be been am do does did have has had will would can could may might must should this that these those it its there here not no so than then too very s t d ll re ve m o y our your my his her their we you they he she i us them me him if when while which who whom whose what where why how all any both each few more most other some such only own same upon into over under about after before between during through against above below up down out off again further once also just now'.split(' ')));

const G_ADV = new Set(('advocate assess assume attribute comprehensive considerable controversy crucial cultivate deliberate demonstrate emphasize enhance essential evaluate facilitate fundamental implement insight integrate justify potential profound rigorous significant sophisticated strategy substantial sufficient superior underlying unprecedented valid vital vulnerable ambiguous anticipate appropriate arbitrary beneficial capacity compensate component comprehensive conduct confer dilemma diminish discrimination dominant eliminate empirical feasible incentive inevitable innovative maintain nevertheless notion numerous objective obtain occur outcome perspective phenomenon plausible prevail priority promote perspective relevant remarkable reluctant restrict retain reveal scenario scrutiny skeptical strategy subsequent substitute sustain tendency transform tremendous undermine verify'.split(' ')));

const G_CONNECTIVES = [
  ['however', '转折'], ['nevertheless', '转折'], ['nonetheless', '转折'], ['whereas', '转折'], ['by contrast', '对比'], ['on the contrary', '对比'], ['in contrast', '对比'],
  ['moreover', '递进'], ['furthermore', '递进'], ['in addition', '递进'], ['additionally', '递进'], ['besides', '递进'], ['meanwhile', '递进'], ['similarly', '并列'], ['likewise', '并列'],
  ['therefore', '因果'], ['thus', '因果'], ['hence', '因果'], ['consequently', '因果'], ['as a result', '因果'], ['accordingly', '因果'],
  ['for instance', '举例'], ['for example', '举例'], ['such as', '举例'], ['in particular', '强调'], ['notably', '强调'], ['indeed', '强调'],
  ['on the one hand', '对照'], ['firstly', '顺序'], ['secondly', '顺序'], ['finally', '顺序'], ['first and foremost', '顺序'],
  ['in conclusion', '总结'], ['to sum up', '总结'], ['in summary', '总结'], ['overall', '总结'], ['in short', '总结']
];

const G_PATTERNS = [
  { re: /with the (rapid|fast|increasing|constant) (development|growth|advancement|progress) of/i, name: 'With the rapid development of...' },
  { re: /there is no denying that/i, name: 'There is no denying that...' },
  { re: /it is universally acknowledged that/i, name: 'It is universally acknowledged that...' },
  { re: /as far as i am concerned/i, name: 'As far as I am concerned...' },
  { re: /when it comes to/i, name: 'When it comes to...' },
  { re: /only (by|in this way|through)[^,.]{0,40} can we/i, name: 'Only by... can we...（倒装）' },
  { re: /it is high time (that|for)/i, name: 'It is high time...（虚拟）' },
  { re: /not only (does|is|are|can|will|has|have)\b/i, name: 'Not only 倒装' },
  { re: /hardly\b[^.]{0,60}\bwhen\b/i, name: 'Hardly... when...（倒装）' },
  { re: /no sooner\b[^.]{0,60}\bthan\b/i, name: 'No sooner... than...（倒装）' },
  { re: /nothing is more .{2,30} than/i, name: 'Nothing is more... than...' },
  { re: /\bplay(s|ed)? an (increasingly )?(important|vital|crucial|essential|indispensable) (role|part)\b/i, name: 'play an important role in...' },
  { re: /\bit is .{3,40} that\b/i, name: 'It is... that（强调/形式主语）' },
  { re: /\bnowadays\b|\bcurrently\b|\bin recent years\b|\bwith the age of\b|\bin an age when\b/i, name: '时代引入语（Nowadays/In recent years...）' }
];

const G_SYNONYMS = {
  important: 'crucial / vital / essential / indispensable',
  good: 'beneficial / favorable / positive',
  bad: 'detrimental / adverse / negative',
  many: 'numerous / a wealth of / a multitude of',
  much: 'a great deal of / substantial',
  think: 'argue / maintain / contend / hold the view that',
  'more and more': 'an increasing number of / a growing number of',
  very: 'exceedingly / remarkably / considerably',
  big: 'considerable / substantial / enormous',
  get: 'obtain / acquire / gain',
  help: 'facilitate / contribute to / assist',
  show: 'demonstrate / indicate / reveal',
  use: 'utilize / employ / adopt',
  thing: 'aspect / factor / element',
  people: 'individuals / the public / citizens',
  so: 'therefore / consequently / as a result',
  but: 'however / nevertheless / yet',
  also: 'furthermore / moreover / in addition',
  problem: 'issue / challenge / dilemma',
  because: 'owing to / due to / in that',
  now: 'currently / at present / nowadays'
};

const G_IRREG = { went: 'go', gone: 'go', better: 'good', best: 'good', worse: 'bad', worst: 'bad', more: 'much', most: 'much', less: 'little', least: 'little', felt: 'feel', thought: 'think', taught: 'teach', brought: 'bring', took: 'take', taken: 'take', made: 'make', wrote: 'write', written: 'write', said: 'say', saw: 'see', seen: 'see', grew: 'grow', grown: 'grow', knew: 'know', known: 'know', gave: 'give', given: 'give', found: 'find', told: 'tell', held: 'hold', kept: 'keep', left: 'leave', met: 'meet', paid: 'pay', ran: 'run', won: 'win', spoke: 'speak', spent: 'spend', understood: 'understand', wore: 'wear', children: 'child', men: 'man', women: 'woman', feet: 'foot', teeth: 'tooth', people: 'person' };

/* ---------- 分词与形态处理 ---------- */
App.grader.tokenize = function (text) {
  return (text.toLowerCase().match(/[a-z][a-z'-]*/g) || []);
};
/* 词形还原：给出候选链；若提供 dict 则返回词典中存在的首个候选 */
App.grader.lemmaCandidates = function (w) {
  const cands = [w];
  const push = x => { if (x && x.length >= 2 && !cands.includes(x)) cands.push(x); };
  if (w.length <= 3) return cands;
  if (w.endsWith('ies') && w.length > 4) push(w.slice(0, -3) + 'y');
  if (w.endsWith('sses') || w.endsWith('shes') || w.endsWith('ches') || w.endsWith('xes')) push(w.slice(0, -2));
  else if (w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us') && !w.endsWith('is')) push(w.slice(0, -1));
  if (w.endsWith('ied') && w.length > 4) push(w.slice(0, -3) + 'y');
  if (w.endsWith('ed')) {
    push(w.slice(0, -1));            // hated -> hate
    push(w.slice(0, -2));            // walked -> walk
    const b2 = w.slice(0, -2);
    if (b2.length >= 3 && b2[b2.length - 1] === b2[b2.length - 2]) push(b2.slice(0, -1)); // stopped -> stop
  }
  if (w.endsWith('ing')) {
    push(w.slice(0, -3) + 'e');      // making -> make
    push(w.slice(0, -3));            // reading -> read
    const b3 = w.slice(0, -3);
    if (b3.length >= 3 && b3[b3.length - 1] === b3[b3.length - 2]) push(b3.slice(0, -1)); // running -> run
  }
  if (w.endsWith('ly') && w.length > 4) push(w.slice(0, -2));
  if (w.endsWith('er') && w.length > 4) { push(w.slice(0, -1)); push(w.slice(0, -2)); }
  if (w.endsWith('est') && w.length > 5) { push(w.slice(0, -3) + 'y'); push(w.slice(0, -3)); }
  return cands;
};
App.grader.lemma = function (w, dict) {
  if (G_IRREG[w]) return G_IRREG[w];
  const cands = App.grader.lemmaCandidates(w);
  if (dict) { for (const c of cands) if (dict[c]) return c; return w; }
  return cands[cands.length - 1] !== w ? cands[1] || w : w;
};

/* 拼写检查：不在词典中的词（含形态还原尝试） */
App.grader.spellCheck = function (text) {
  const dict = App.WMAP();
  const unknown = new Set();
  for (const tok of App.grader.tokenize(text)) {
    const w = tok.replace(/['-]/g, '');
    if (!w || w.length < 3 || G_STOP.has(w)) continue;
    if (dict[w]) continue;
    const hit = App.grader.lemmaCandidates(w).some(c => dict[c]);
    if (!hit) unknown.add(tok);
  }
  return Array.from(unknown).slice(0, 12);
};

/* ---------- 写作批改 ---------- */
App.grader.gradeWriting = function (text) {
  const items = [];
  const add = (type, title, detail) => items.push({ type, title, detail });
  let score = 70;

  const words = App.grader.tokenize(text);
  const wc = words.length;
  const paras = text.split(/\n\s*\n|\n/).map(p => p.trim()).filter(p => p.length > 20);
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => App.grader.tokenize(s).length > 2);
  const sLens = sentences.map(s => App.grader.tokenize(s).length);

  // 1 词数
  if (wc < 100) { score -= 14; add('bad', '篇幅不足', '全文仅 ' + wc + ' 词。六级要求 150–200 词，字数不足会直接拉低内容分。把每个分论点补一句解释或例证。'); }
  else if (wc < 150) { score -= 4; add('warn', '篇幅偏短', '目前 ' + wc + ' 词，距 150 词下限还差一点，建议再扩展一个例证或让步段。'); }
  else if (wc <= 200) { score += 8; add('good', '篇幅达标', '全文 ' + wc + ' 词，正好落在 150–200 词的理想区间。'); }
  else if (wc <= 230) { score += 2; add('good', '篇幅合适', '全文 ' + wc + ' 词，内容充实，注意誊写时间即可。'); }
  else { score -= 3; add('warn', '篇幅偏长', '全文 ' + wc + ' 词，超出上限较多，考场写不完反而丢分，学会精炼例证。'); }

  // 2 结构
  if (paras.length === 3) { score += 4; add('good', '结构清晰', '全文三段，符合「引入—论证—总结」的经典结构。'); }
  else if (paras.length >= 2) { add('info', '段落提示', '检测到 ' + paras.length + ' 个自然段。六级作文建议三段式：引出话题 → 展开论证 → 总结升华。'); }
  else { score -= 5; add('bad', '缺少分段', '全文只有一段。请按「开头—主体—结尾」分段，阅卷老师非常看重结构分。'); }

  // 3 衔接词
  const lower = text.toLowerCase();
  const usedConn = G_CONNECTIVES.filter(([c]) => lower.includes(c));
  const distinct = new Set(usedConn.map(c => c[1])).size;
  if (usedConn.length >= 6 && distinct >= 3) { score += 8; add('good', '衔接丰富', '使用了 ' + usedConn.length + ' 处衔接词（如 ' + usedConn.slice(0, 4).map(c => c[0]).join('、') + '），逻辑连贯性好。'); }
  else if (usedConn.length >= 3) { score += 3; add('info', '衔接尚可', '检测到 ' + usedConn.length + ' 处衔接词。试着增加 However / Moreover / As a result 等不同类别的衔接，让段落内逻辑更顺。'); }
  else { score -= 6; add('warn', '衔接不足', '几乎没检测到衔接词。句子之间建议补充 However（转折）、Moreover（递进）、As a result（因果）等过渡。'); }

  // 4 句式多样性
  if (sLens.length >= 3) {
    const avg = sLens.reduce((a, b) => a + b, 0) / sLens.length;
    const sd = Math.sqrt(sLens.reduce((a, b) => a + (b - avg) ** 2, 0) / sLens.length);
    const longS = sLens.filter(l => l > 32).length;
    if (sd >= 6.5) { score += 6; add('good', '长短句结合', '句子长度富于变化（平均 ' + avg.toFixed(1) + ' 词/句），读起来有节奏感。'); }
    else { score -= 4; add('warn', '句长单一', '各句长度接近（平均 ' + avg.toFixed(1) + ' 词/句）。试着把某些短句合并成定语从句，或用 Only by.../Not until... 倒装句打破节奏。'); }
    if (longS > 0) { score -= Math.min(longS, 4); add('warn', '存在过长句', longS + ' 个句子超过 32 词，容易产生语法错误。建议用逗号拆分或改为两句。'); }
    if (avg < 9) { score -= 2; add('warn', '句式过短', '平均每句不到 9 词，多为简单句。用 with 复合结构、定语从句、分词短语升级其中两三句。'); }
  }

  // 5 高级词汇
  const advWords = words.filter(w => G_ADV.has(w) || (w.length >= 9 && !G_STOP.has(w)));
  const advRatio = wc ? advWords.length / wc : 0;
  if (advRatio >= 0.08) { score += 6; add('good', '用词地道', '高级词汇占比约 ' + Math.round(advRatio * 100) + '%（如 ' + advWords.slice(0, 5).join('、') + '），词汇多样性出色。'); }
  else if (advRatio >= 0.04) { add('info', '词汇提示', '高级词汇占比约 ' + Math.round(advRatio * 100) + '%。把部分基础词替换为更精准的表达会更有亮点。'); }
  else { score -= 2; add('warn', '词汇平淡', '全文以基础词汇为主。尝试替换：important→crucial、think→argue、more and more→a growing number of。'); }

  // 6 句式/模板命中
  const hits = G_PATTERNS.filter(p => p.re.test(text)).map(p => p.name);
  if (hits.length >= 3) { score += 6; add('good', '亮点句式', '检测到 ' + hits.length + ' 处高级句式：' + hits.slice(0, 3).join('；') + '。'); }
  else if (hits.length >= 1) { add('info', '句式提示', '检测到 ' + hits.length + ' 处高级句式（' + hits[0] + '）。再埋入一个倒装或强调句，作文档次会明显提升。'); }
  else { score -= 2; add('warn', '句式保守', '未检测到倒装、强调、虚拟等亮点句式。参考「进阶句式」库，至少套用 1–2 个。'); }

  // 7 拼写
  const unknown = App.grader.spellCheck(text);
  if (unknown.length) { score -= Math.min(unknown.length * 3, 12); add('bad', '疑似拼写问题', '以下单词不在词库中，请核对拼写：' + unknown.join('、') + '。（专有名词可忽略）'); }

  // 8 用词重复
  const freq = {};
  for (const w of words) if (!G_STOP.has(w) && w.length >= 4) freq[w] = (freq[w] || 0) + 1;
  const overused = Object.keys(freq).filter(w => freq[w] >= 5).sort((a, b) => freq[b] - freq[a]).slice(0, 3);
  for (const w of overused) {
    score -= 2;
    const syn = G_SYNONYMS[w];
    add('warn', '「' + w + '」重复 ' + freq[w] + ' 次', syn ? '建议交替使用：' + syn + '。' : '尝试用同义词或代词替换，避免用词单调。');
  }

  // 9 格式与硬伤
  const cn = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  if (cn > 5) { score -= 15; add('bad', '混入中文', '检测到 ' + cn + ' 个中文字符——写作时记得切换输入法，中文词阅卷时按错误处理。'); }
  const badCaps = (text.match(/[.!?]\s+[a-z]/g) || []).length;
  const startLower = /^[a-z]/.test(text.trim());
  if (badCaps || startLower) { score -= Math.min(2 * (badCaps + (startLower ? 1 : 0)), 6); add('warn', '句首未大写', '检测到 ' + (badCaps + (startLower ? 1 : 0)) + ' 处句首小写。每个句子的首字母务必大写。'); }
  const noSpace = (text.match(/[,;][A-Za-z]/g) || []).length + (text.match(/[a-z]\.[A-Z]/g) || []).length;
  if (noSpace > 2) { add('warn', '标点后缺空格', '检测到 ' + noSpace + ' 处逗号/句号后直接接单词，标点后应空一格。'); }
  const aAnErr = (text.match(/\ba\s+[aeiou]\w+/gi) || []).filter(t => !/^an? hour/i.test(t)).length;
  if (aAnErr) { add('warn', '冠词 a/an', '检测到 ' + aAnErr + ' 处「a + 元音开头单词」，元音前应用 an。'); }
  if (!/[.!?]\s*$/.test(text.trim())) { add('info', '结尾标点', '全文结尾似乎缺句号，记得收尾补上。'); }

  score = Math.max(40, Math.min(96, Math.round(score)));
  const grade = score >= 90 ? '优秀' : score >= 80 ? '良好' : score >= 70 ? '中等' : score >= 60 ? '基本合格' : '待提高';
  const band = score >= 90 ? '13–14 分档' : score >= 80 ? '11–12 分档' : score >= 70 ? '9–10 分档' : score >= 60 ? '7–8 分档' : '6 分档以下';
  const summary = '综合评分 ' + score + '/100（预估 ' + band + '），等级：' + grade + '。全文 ' + wc + ' 词、' + sentences.length + ' 句、' + paras.length + ' 段。';
  return { score, grade, band, summary, items, wc, hits, unknown };
};

/* ---------- 翻译批改 ---------- */
App.grader.lemmaSet = function (text) {
  const s = new Set();
  for (const tok of App.grader.tokenize(text)) {
    s.add(tok);
    if (G_IRREG[tok]) s.add(G_IRREG[tok]);
    for (const c of App.grader.lemmaCandidates(tok)) s.add(c);
  }
  return s;
};
App.grader.gradeTranslation = function (userText, passage) {
  const items = [];
  const add = (type, title, detail) => items.push({ type, title, detail });
  let score = 50;
  const userLemmas = App.grader.lemmaSet(userText);
  const refWords = App.grader.tokenize(passage.ref).length;
  const userWords = App.grader.tokenize(userText).length;
  const ratio = refWords ? userWords / refWords : 0;

  // 关键表达命中：关键词的任一形态出现在译文候选集合中即算命中
  let hits = 0;
  const detail = [];
  for (const k of passage.keys) {
    const kws = App.grader.tokenize(k.en).filter(t => !G_STOP.has(t) && t.length > 2);
    const ok = kws.length ? kws.every(t => App.grader.lemmaCandidates(t).some(c => userLemmas.has(c))) : false;
    if (ok) hits++; else detail.push(k);
  }
  const ratio2 = passage.keys.length ? hits / passage.keys.length : 0;
  score = 45 + ratio2 * 40;
  if (ratio2 >= 0.8) add('good', '关键表达到位', '核心表达命中 ' + hits + '/' + passage.keys.length + '，主要信息点基本覆盖。');
  else if (ratio2 >= 0.5) add('info', '关键表达尚可', '命中 ' + hits + '/' + passage.keys.length + '。对照下方未命中的表达，练习时要有意识地积累对应译法。');
  else add('warn', '关键表达缺失较多', '仅命中 ' + hits + '/' + passage.keys.length + '。翻译先抓核心表达（四六级常考中国文化/社会/科技固定译法），再看通顺。');

  // 长度
  if (ratio < 0.55) { score -= 8; add('bad', '译文过短', '你的译文 ' + userWords + ' 词，参考译文 ' + refWords + ' 词。大量信息点可能漏译，逐句核对中文原文。'); }
  else if (ratio < 0.8) { score -= 3; add('warn', '译文偏短', '约为参考译文的 ' + Math.round(ratio * 100) + '%，检查是否有整句漏译。'); }
  else if (ratio <= 1.35) { score += 6; add('good', '篇幅匹配', '译文长度约为参考译文的 ' + Math.round(ratio * 100) + '%，信息量适中。'); }
  else { score -= 3; add('warn', '译文偏长', '约为参考译文的 ' + Math.round(ratio * 100) + '%，可能存在过度增译或重复，汉语多短句，英文注意合并。'); }

  // 句子数
  const userS = userText.split(/[.!?]+/).filter(s => App.grader.tokenize(s).length > 2).length;
  const refS = passage.ref.split(/[.!?]+/).filter(s => App.grader.tokenize(s).length > 2).length;
  if (Math.abs(userS - refS) <= 1) { score += 4; add('info', '断句合理', '你的译文 ' + userS + ' 句，参考译文 ' + refS + ' 句。汉译英常需合并中文短句，用分词、从句衔接。'); }
  else if (userS > refS + 1) add('info', '断句提示', '你译成 ' + userS + ' 句（参考 ' + refS + ' 句）。中文多流水句，英译时尝试把两三个短句合并成一个带连接词或分词的长句。');
  else add('info', '断句提示', '你译成 ' + userS + ' 句（参考 ' + refS + ' 句）。长句堆砌容易出错，必要时拆分为两句。');

  // 拼写与硬伤
  const unknown = App.grader.spellCheck(userText);
  if (unknown.length) { score -= Math.min(unknown.length * 3, 12); add('bad', '疑似拼写问题', '请核对：' + unknown.join('、')); }
  const cn = (userText.match(/[\u4e00-\u9fff]/g) || []).length;
  if (cn > 3) { score -= 15; add('bad', '混入中文', '译文中有 ' + cn + ' 个中文字符，记得切换输入法。'); }
  const startLower = /^[a-z]/.test(userText.trim());
  if (startLower) { score -= 2; add('warn', '句首未大写', '译文开头小写了，英文每句首字母要大写。'); }

  score = Math.max(35, Math.min(96, Math.round(score)));
  const grade = score >= 90 ? '优秀' : score >= 80 ? '良好' : score >= 70 ? '中等' : score >= 60 ? '基本合格' : '待提高';
  const band = score >= 90 ? '13–14 分档' : score >= 80 ? '11–12 分档' : score >= 70 ? '9–10 分档' : score >= 60 ? '7–8 分档' : '6 分档以下';
  return {
    score, grade, band,
    estCET: Math.round(score / 100 * 106.5),
    summary: '综合评分 ' + score + '/100（预估 ' + band + '），关键表达命中 ' + hits + '/' + passage.keys.length + '。',
    missedKeys: detail, items, ratio
  };
};
