/* ===== 存储层：localStorage 持久化 + 备份导入导出 ===== */
App.STORE_KEY = 'cet6app_v1';
App.CHECKIN_SEC = 600; // 当日学习满10分钟记为打卡
App.store = null;

App.defaultStore = function () {
  return {
    version: 1,
    createdAt: Date.now(),
    profile: { placed: false, startLevel: 1, dailyNew: 8, reviewCap: 60 },
    srs: {},            // word -> {b:box, due:时间戳, c:对, w:错, t:最后时间}
    wordbook: {},       // word -> {d:加入日期, src:来源}
    days: {},           // 'YYYY-MM-DD' -> {sec, newW, revW}
    practice: { reading: [], listening: [], vocab: [] },
    genBank: [],        // 智能生成的题源库 [{id,type,theme,date,set}]
    realExams: [],      // 本地导入的真题文件元数据 [{key,kind,level,year,month,name,size,label,date}]
    realScores: [],     // 真题刷题记录 [{id,level,label,total,sub,date}]
    essays: [],
    translations: [],
    mocks: [],
    exprs: []           // 翻译常用表达积累本
  };
};

App.load = function () {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(App.STORE_KEY) || 'null'); } catch (e) { data = null; }
  const def = App.defaultStore();
  if (data && typeof data === 'object') {
    App.store = Object.assign(def, data);
    App.store.profile = Object.assign(def.profile, data.profile || {});
    App.store.practice = Object.assign(def.practice, data.practice || {});
    for (const k of ['srs', 'wordbook', 'days']) if (!App.store[k] || typeof App.store[k] !== 'object') App.store[k] = {};
    for (const k of ['essays', 'translations', 'mocks', 'exprs']) if (!Array.isArray(App.store[k])) App.store[k] = [];
    // practice 子键归一化（防止旧版/部分备份缺数组导致崩溃）
    for (const k of ['reading', 'listening', 'vocab']) if (!Array.isArray(App.store.practice[k])) App.store.practice[k] = [];
    if (!Array.isArray(App.store.genBank)) App.store.genBank = [];
    if (!Array.isArray(App.store.realExams)) App.store.realExams = [];
    if (!Array.isArray(App.store.realScores)) App.store.realScores = [];
  } else {
    App.store = def;
  }
};

App._saveNow = function () {
  if (App._noSave) return;   // 测试/特殊场景下暂停自动持久化
  try { localStorage.setItem(App.STORE_KEY, JSON.stringify(App.store)); }
  catch (e) { console.warn('保存失败', e); App.toast('⚠️ 本地存储失败，请检查浏览器设置'); }
};
App.save = App.debounce(App._saveNow, 400);

App.exportBackup = function () {
  const blob = new Blob([JSON.stringify(App.store, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '六级智学备份_' + App.today() + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  App.store.lastBackupAt = Date.now();
  App.save();
  App.toast('备份已导出到下载目录');
};

/* 深度校验备份文件结构，返回 null 或错误原因 */
App.validateBackup = function (data) {
  if (!data || typeof data !== 'object') return '不是有效的 JSON 对象';
  if (typeof data.version !== 'number') return '缺少 version 字段';
  if (!data.profile || typeof data.profile !== 'object') return '缺少 profile';
  if (!data.srs || typeof data.srs !== 'object') return '缺少 srs（词汇记忆记录）';
  if (!data.days || typeof data.days !== 'object') return '缺少 days（学习时长记录）';
  for (const k of ['essays', 'translations', 'mocks', 'exprs']) {
    if (data[k] !== undefined && !Array.isArray(data[k])) return k + ' 应为数组';
  }
  if (data.practice !== undefined && (typeof data.practice !== 'object' || Array.isArray(data.practice))) return 'practice 结构错误';
  let badSrs = 0;
  for (const w of Object.keys(data.srs)) {
    const r = data.srs[w];
    if (!r || typeof r !== 'object' || typeof r.b !== 'number') badSrs++;
  }
  if (badSrs > 0) return 'srs 中有 ' + badSrs + ' 条记录结构异常';
  return null;
};

App.importBackup = function (file, cb) {
  const reader = new FileReader();
  reader.onload = function () {
    let data;
    try { data = JSON.parse(reader.result); }
    catch (e) { App.toast('导入失败：文件不是有效的 JSON'); return; }
    const err = App.validateBackup(data);
    if (err) { App.toast('导入失败：' + err); return; }
    if (!App.confirmBox('导入备份将覆盖当前全部学习数据（覆盖前会自动导出当前数据作应急备份）。确定继续吗？')) return;
    try { App.exportBackup(); } catch (e) { /* 应急备份失败不阻断导入 */ }
    try {
      localStorage.setItem(App.STORE_KEY, JSON.stringify(data));
    } catch (e) { App.toast('导入失败：本地存储写入出错'); return; }
    App.load();
    App.toast('导入成功');
    if (cb) cb();
  };
  reader.readAsText(file);
};

App.resetAll = function () {
  if (!App.confirmBox('确定要清空所有学习数据吗？此操作不可恢复！')) return;
  if (!App.confirmBox('再次确认：真的要清空吗？（建议先导出备份）')) return;
  localStorage.removeItem(App.STORE_KEY);
  location.reload();
};
