/* ===== SRS 间隔重复 + 每日计划 + 考查题生成 ===== */
App.SRS_INTERVALS = [0, 1, 2, 4, 8, 15, 30]; // box -> 下次复习间隔（天），box0 当天再来一次
App.DAY = 86400000;

App.srsGet = function (w) { return App.store.srs[w] || null; };

/* 记录一次作答。ok=true 升箱，false 退回 box0 立即复习 */
App.srsReview = function (w, ok, fuzzy) {
  const rec = App.store.srs[w] || { b: 0, due: 0, c: 0, w: 0 };
  if (fuzzy) {
    rec.due = Date.now() + 5 * 60 * 1000;
  } else if (ok) {
    rec.b = Math.min((rec.b || 0) + 1, 6); rec.c++;
    rec.due = Date.now() + App.SRS_INTERVALS[rec.b] * App.DAY;
  } else {
    rec.b = 0; rec.w++;
    rec.due = Date.now() + 10 * 60 * 1000;
  }
  rec.t = Date.now();
  App.store.srs[w] = rec;
  return rec;
};

App.srsStatus = function (w) {
  const rec = App.srsGet(w);
  if (!rec) return { label: '未学', cls: '' };
  if (rec.b >= 4) return { label: '已掌握', cls: 'ok' };
  if (rec.b >= 1) return { label: '学习中', cls: 'warn' };
  return { label: '待巩固', cls: 'bad' };
};

/* 今日待复习（到期未超过每日上限） */
App.dueWords = function () {
  const cap = App.store.profile.reviewCap || 60;
  const done = (App.dayStat().revW) || 0;
  const list = Object.keys(App.store.srs)
    .filter(w => App.store.srs[w].due <= Date.now() && App.WMAP()[w])
    .sort((a, b) => App.store.srs[a].due - App.store.srs[b].due);
  return list.slice(0, Math.max(0, cap - done));
};

/* 今日新词：按所选档位顺序取；到期复习多时自动减半新词（艾宾浩斯新旧配比） */
App.newWords = function () {
  const exam = App.store.profile.exam || 'cet6';
  const dueCount = App.dueWords().length;
  const daily = App.store.profile.dailyNew || 8;
  const done = (App.dayStat().newW) || 0;
  if (done >= daily) return [];
  // 新旧比例自动安排：到期复习超过 20 个时，新词减半，优先清复习
  let quota = daily - done;
  if (dueCount > 20) quota = Math.ceil(quota / 2);
  const lv = App.store.profile.startLevel || 1;
  const tierOrder = exam === 'cet4'
    ? (App.store.customWords && App.store.customWords.length ? ['custom'] : []).concat(['t4c', 't4h', 't4s'])
    : (App.store.customWords && App.store.customWords.length ? ['custom'] : []).concat(lv === 3 ? ['t6h', 't6s', 't4c'] : lv === 2 ? ['t6h', 't4c', 't6s'] : ['t4c', 't6h', 't6s']);
  const pool = [];
  for (const t of tierOrder) pool.push(...App.allWords().filter(e => e.tier === t && !App.store.srs[e.w]));
  return pool.slice(0, quota);
};

/* 今日计划概览 */
App.planToday = function () {
  const due = Object.keys(App.store.srs).filter(w => App.store.srs[w].due <= Date.now() && App.WMAP()[w]).length;
  const cap = App.store.profile.reviewCap || 60;
  const doneRev = App.dayStat().revW || 0;
  const doneNew = App.dayStat().newW || 0;
  const daily = App.store.profile.dailyNew || 8;
  return {
    newTotal: daily, newDone: doneNew,
    revTotal: Math.min(due, cap), revDone: doneRev,
    needTest: !App.store.profile.placed
  };
};

App.recordVocab = function (isNew, ok) {
  const d = App.dayStat();
  if (isNew) d.newW = (d.newW || 0) + 1; else d.revW = (d.revW || 0) + 1;
  App.store.practice.vocab.push({ d: App.today(), new: !!isNew, ok: !!ok });
  if (App.store.practice.vocab.length > 2000) App.store.practice.vocab = App.store.practice.vocab.slice(-1500);
  App.save();
};

/* ---- 考查题生成（五种记忆模式）---- */
App.quizMode = function (w) { return ['e2c', 'c2e', 'spell', 'listen', 'c2et'][App.hash(w) % 5]; };

/* 英译中四选一 */
App.quizE2C = function (entry) {
  const ds = App.glossDistractors(entry, 3);
  const opts = App.shuffle([entry].concat(ds)).map(e => ({ w: e.w, text: e.gloss }));
  return { mode: 'e2c', word: entry.w, opts, answer: opts.findIndex(o => o.w === entry.w) };
};
/* 中译英四选一 */
App.quizC2E = function (entry) {
  const ds = App.glossDistractors(entry, 3);
  const opts = App.shuffle([entry].concat(ds)).map(e => ({ w: e.w, text: e.w }));
  return { mode: 'c2e', word: entry.w, opts, answer: opts.findIndex(o => o.w === entry.w) };
};
/* 拼写默写（给中文提示和首尾字母） */
App.quizSpell = function (entry) {
  return { mode: 'spell', word: entry.w, gloss: entry.gloss, hint: entry.w[0] + '…' + entry.w[entry.w.length - 1] };
};
/* 中英互译·打字模式（只给中文释义，完整默写） */
App.quizC2ET = function (entry) {
  return { mode: 'c2et', word: entry.w, gloss: entry.gloss, pos: entry.pos };
};
/* 听音辨词四选一 */
App.quizListen = function (entry) {
  const ds = App.glossDistractors(entry, 3);
  const opts = App.shuffle([entry].concat(ds)).map(e => ({ w: e.w, text: e.w }));
  return { mode: 'listen', word: entry.w, opts, answer: opts.findIndex(o => o.w === entry.w) };
};
App.quizFor = function (entry) {
  switch (App.quizMode(entry.w)) {
    case 'c2e': return App.quizC2E(entry);
    case 'spell': return App.quizSpell(entry);
    case 'listen': return App.quizListen(entry);
    case 'c2et': return App.quizC2ET(entry);
    default: return App.quizE2C(entry);
  }
};

/* ---- 词汇统计 ---- */
App.vocabStats = function () {
  const total = App.allWords().length;
  let learning = 0, mastered = 0, accC = 0, accW = 0;
  const boxes = [0, 0, 0, 0, 0, 0, 0];
  for (const w of Object.keys(App.store.srs)) {
    const r = App.store.srs[w];
    if (!App.WMAP()[w]) continue;
    boxes[r.b || 0]++;
    if (r.b >= 1) learning++;
    if (r.b >= 4) mastered++;
    accC += r.c || 0; accW += r.w || 0;
  }
  return { total, learning, mastered, boxes, acc: (accC + accW) ? Math.round(accC / (accC + accW) * 100) : null };
};

/* 各题型正确率序列（最近 n 个日期） */
App.typeTrend = function (n) {
  const types = { careful: '仔细阅读', matching: '长篇匹配', cloze: '选词填空', listening: '听力', vocab: '词汇' };
  const byDate = {};
  for (const r of (App.store.practice.reading || [])) {
    const t = App.today(r.d ? new Date(r.d) : undefined);
    (byDate[t] = byDate[t] || {})[r.type] = byDate[t][r.type] || [0, 0];
    byDate[t][r.type][0] += r.c; byDate[t][r.type][1] += r.t;
  }
  for (const r of (App.store.practice.listening || [])) {
    const t = App.today(r.d ? new Date(r.d) : undefined);
    (byDate[t] = byDate[t] || {})['listening'] = byDate[t]['listening'] || [0, 0];
    byDate[t]['listening'][0] += r.c; byDate[t]['listening'][1] += r.t;
  }
  for (const r of (App.store.practice.vocab || []).filter(v => !v.new)) {
    const t = App.today(r.d ? new Date(r.d) : undefined);
    (byDate[t] = byDate[t] || {})['vocab'] = byDate[t]['vocab'] || [0, 0];
    byDate[t]['vocab'][0] += r.ok ? 1 : 0; byDate[t]['vocab'][1] += 1;
  }
  const dates = Object.keys(byDate).sort().slice(-n);
  const series = {};
  for (const k of Object.keys(types)) series[k] = dates.map(t => {
    const p = byDate[t][k];
    return p ? Math.round(p[0] / p[1] * 100) : null;
  });
  return { dates, series, types };
};

/* 最弱题型（练习≥1次的，正确率最低） */
App.weakestType = function () {
  const agg = {};
  for (const r of App.store.practice.reading) {
    agg[r.type] = agg[r.type] || [0, 0];
    agg[r.type][0] += r.c; agg[r.type][1] += r.t;
  }
  let worst = null, worstRate = 2;
  for (const k of Object.keys(agg)) {
    if (agg[k][1] < 3) continue;
    const rate = agg[k][0] / agg[k][1];
    if (rate < worstRate) { worstRate = rate; worst = k; }
  }
  return worst;
};
App.TYPE_NAMES = { careful: '仔细阅读', matching: '长篇阅读', cloze: '选词填空' };
