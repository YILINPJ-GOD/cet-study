/* ===== 工具层：全局对象、通用函数、词库装配 ===== */
const App = window.App = {};
App.VERSION = '1.8.1';

/* ---------- 日期与格式 ---------- */
App.today = function (d) {
  const t = d || new Date();
  return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
};
App.endOfToday = function () { const d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime(); };
App.fmtSec = function (s) {
  s = Math.round(s || 0);
  if (s < 60) return s + '秒';
  const m = Math.floor(s / 60);
  if (m < 60) return m + '分钟';
  return Math.floor(m / 60) + '小时' + (m % 60 ? (m % 60) + '分' : '');
};
App.mmss = function (s) {
  s = Math.max(0, Math.round(s || 0));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};
App.esc = function (s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
App.debounce = function (fn, ms) {
  let t = null;
  return function () { clearTimeout(t); const a = arguments, self = this; t = setTimeout(() => fn.apply(self, a), ms); };
};
App.shuffle = function (arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
App.randPick = function (arr, n, exclude) {
  const pool = App.shuffle(arr.filter(x => !exclude || !exclude.includes(x)));
  return pool.slice(0, n);
};
App.hash = function (str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
};
App.toast = function (msg, ms) {
  const box = document.getElementById('toastBox');
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, ms || 2200);
};
App.speak = function (text) {
  try {
    if (App.speakHook) return App.speakHook(text, App.speakLang());   // 测试/扩展钩子
    if (!window.speechSynthesis) { App.toast('当前浏览器不支持发音'); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = App.speakLang();
    // 按所选口音优先挑选匹配的语音包
    const want = u.lang;
    const voices = speechSynthesis.getVoices ? speechSynthesis.getVoices() : [];
    const v = voices.find(x => x.lang === want) || voices.find(x => x.lang && x.lang.replace('_', '-').startsWith(want.slice(0, 2)));
    if (v) u.voice = v;
    u.rate = 0.92;
    speechSynthesis.speak(u);
  } catch (e) { /* 忽略 */ }
};
/* 发音口音：美音(默认)/英音，可在首页设置 */
App.speakLang = function () {
  return (App.store && App.store.profile && App.store.profile.voice === 'uk') ? 'en-GB' : 'en-US';
};
App.confirmBox = function (msg) { return window.confirm(msg); };

/* ---------- 词库装配（四六级 × 档位 × 专项） ---------- */
App.LV = {
  1: { name: '常用', cls: 'lv1', color: '#0d9488', dailyNew: 8 },
  2: { name: '高频', cls: 'lv2', color: '#4f46e5', dailyNew: 12 },
  3: { name: '冲刺', cls: 'lv3', color: '#c2610a', dailyNew: 15 }
};
/* 档位注册表：exam 决定词库组成；goal 为目标词量（可分批补齐） */
App.TIERS = {
  custom: { label: '我的词库', short: '我的', exam: 'both', lv: 2, order: 0, goal: null },
  t4c: { label: '四级常用', short: '常用', exam: 'cet4', lv: 1, order: 1, goal: 5000 },
  t4h: { label: '四级高频', short: '高频', exam: 'cet4', lv: 2, order: 2, goal: 2500 },
  t4s: { label: '四级冲刺', short: '冲刺', exam: 'cet4', lv: 3, order: 3, goal: 800 },
  t6h: { label: '六级高频', short: '高频', exam: 'cet6', lv: 2, order: 2, goal: 2500 },
  t6s: { label: '六级冲刺', short: '冲刺', exam: 'cet6', lv: 3, order: 3, goal: 800 },
  zt: { label: '翻译写作主题词', short: '专项', exam: 'both', lv: 2, order: 4, goal: null },
  tl: { label: '听力场景词', short: '专项', exam: 'both', lv: 2, order: 5, goal: null }
};
App.BANKS = {
  t4c: { vars: ['BANK_T4C'] },
  t4h: { vars: ['BANK_T4H'] },
  t4s: { vars: ['BANK_T4S'] },
  t6h: { vars: ['BANK_T6H', 'BANK_T6H2'] },
  t6s: { vars: ['BANK_T6S'] },
  zt: { vars: ['BANK_ZT'] },
  tl: { vars: ['BANK_TL'] }
};
App.banksOf = function (exam) {
  return exam === 'cet4' ? ['t4c', 't4h', 't4s', 'zt', 'tl']
    : exam === 'cet6' ? ['t4c', 't4h', 't4s', 't6h', 't6s', 'zt', 'tl']
    : ['t4c', 't4h', 't4s', 't6h', 't6s', 'zt', 'tl'];
};
/* 定级档位 → 该级别下的起始档名称 */
App.lvTierLabel = function (lv) {
  const exam = (App.store && App.store.profile && App.store.profile.exam) || 'cet6';
  return exam === 'cet4'
    ? ({ 1: '四级常用', 2: '四级高频', 3: '四级冲刺' })[lv]
    : ({ 1: '四级常用（基础）', 2: '六级高频', 3: '六级冲刺' })[lv];
};
/* 常考释义优先（熟词僻义）：覆盖词库默认释义，考试义放第一位 */
App.SENSE_OVERRIDES = window.SENSE_OVERRIDES || {};

App.allWords = function (exam) {
  exam = exam || (App.store && App.store.profile && App.store.profile.exam) || 'cet6';
  if (App._words && App._wordsExam === exam) return App._words;
  const seen = {}, out = [];
  // 自定义词（导入的生词表）优先
  for (const cw of (App.store && App.store.customWords) || []) {
    if (!cw || !cw.w || seen[cw.w]) continue;
    seen[cw.w] = 1;
    out.push({ w: cw.w, ipa: cw.ipa || '', pos: cw.pos || '', gloss: cw.gloss || '', tier: 'custom', lv: 2 });
  }
  for (const tier of App.banksOf(exam)) {
    const meta = App.TIERS[tier];
    for (const vn of App.BANKS[tier].vars) {
      const arr = window[vn] || [];
      for (const it of arr) {
        if (!it || !it[0]) continue;
        const w = String(it[0]).trim().toLowerCase();
        if (!w || seen[w]) continue;
        seen[w] = 1;
        const ov = App.SENSE_OVERRIDES[w];
        out.push({
          w, ipa: it[1] || '', pos: it[2] || '',
          gloss: ov || it[3] || '',
          tier, lv: meta.lv,
          examSense: !!ov
        });
      }
    }
  }
  App._words = out;
  App._wordsExam = exam;
  return out;
};
App.WMAP = function () {
  if (App._wmap && App._wmapExam === (App.store && App.store.profile && App.store.profile.exam)) return App._wmap;
  const m = {};
  // 两个级别的词都进词典（点击查词全覆盖）
  for (const ex of ['cet4', 'cet6']) {
    for (const e of App.allWords(ex)) if (!m[e.w]) m[e.w] = e;
  }
  const extra = window.EXTRA_DICT || {};
  Object.keys(extra).forEach(k => {
    const v = extra[k];
    if (!m[k]) m[k] = { w: k, ipa: v[0] || '', pos: v[1] || '', gloss: v[2] || '', lv: 0, tier: 'dict' };
    else if (!m[k].ipa && v[0]) { m[k].ipa = v[0]; m[k].pos = m[k].pos || v[1]; }
  });
  App._wmap = m;
  App._wmapExam = App.store && App.store.profile && App.store.profile.exam;
  return m;
};
/* 释义干扰项（同档位优先） */
App.glossDistractors = function (entry, n) {
  const pool = App.allWords().filter(x => x.w !== entry.w && x.gloss !== entry.gloss);
  const same = pool.filter(x => x.lv === entry.lv);
  const picks = App.randPick(same, n);
  if (picks.length < n) picks.push(...App.randPick(pool, n - picks.length, picks.map(p => p.w).concat(entry.w)));
  return picks;
};

/* ---------- 学习计时（打卡/时长） ---------- */
App.dayStat = function (date) {
  const t = App.today(date);
  if (!App.store.days[t]) App.store.days[t] = { sec: 0, newW: 0, revW: 0 };
  return App.store.days[t];
};
App.streak = function () {
  let n = 0;
  const d = new Date();
  // 今天未打卡时从昨天起算，保持已有连续记录
  if (!(App.store.days[App.today(d)] && App.store.days[App.today(d)].sec >= App.CHECKIN_SEC)) d.setDate(d.getDate() - 1);
  while (App.store.days[App.today(d)] && App.store.days[App.today(d)].sec >= App.CHECKIN_SEC) { n++; d.setDate(d.getDate() - 1); }
  return n;
};

/* ---------- 单词拆解（词根词缀）：App.morph(word) → {prefix, root, suffix, text} 或 null ---------- */
App.morph = function (word) {
  const w = String(word || '').toLowerCase();
  if (!w || w.length < 4) return null;
  const P = window.WORD_PREFIXES || {}, S = window.WORD_SUFFIXES || {}, R = window.WORD_ROOTS || [];
  let prefix = null, suffix = null, root = null;
  for (const p of Object.keys(P).sort((a, b) => b.length - a.length)) {
    if (w.startsWith(p) && w.length - p.length >= 3) { prefix = { p, m: P[p] }; break; }
  }
  for (const s of Object.keys(S).sort((a, b) => b.length - a.length)) {
    if (w.endsWith(s) && w.length - s.length >= 3) { suffix = { s, m: S[s] }; break; }
  }
  const mid = w.slice(prefix ? prefix.p.length : 0, suffix ? w.length - suffix.s.length : w.length);
  for (const r of R) {
    const key = r.r.split('/')[0];
    const alt = r.r.split('/')[1] || '';
    if ((key && mid.includes(key)) || (alt && mid.includes(alt))) { root = { r: r.r, m: r.m }; break; }
  }
  const parts = [];
  if (prefix) parts.push(prefix.p + '（' + prefix.m + '）');
  if (root) parts.push((root.r.split('/')[0]) + '（' + root.m + '）');
  if (!root && mid && mid.length >= 3) parts.push(mid);
  if (suffix) parts.push(suffix.s + '（' + suffix.m + '）');
  if (parts.length < 2) return null;
  return { prefix, root, suffix, text: parts.join(' + ') };
};

/* ---------- 简易 DOM 助手 ---------- */
App.el = function (html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
App.$ = function (sel, root) { return (root || document).querySelector(sel); };
App.$$ = function (sel, root) { return Array.from((root || document).querySelectorAll(sel)); };
