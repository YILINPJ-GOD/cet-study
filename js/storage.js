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
    practice: { reading: [], vocab: [] },
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
  App.toast('备份已导出到下载目录');
};

App.importBackup = function (file, cb) {
  const reader = new FileReader();
  reader.onload = function () {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !data.version || typeof data.srs !== 'object') throw new Error('格式不对');
      if (!App.confirmBox('导入备份将覆盖当前全部学习数据，确定继续吗？')) return;
      localStorage.setItem(App.STORE_KEY, JSON.stringify(data));
      App.load();
      App.toast('导入成功');
      if (cb) cb();
    } catch (e) { App.toast('导入失败：文件格式不正确'); }
  };
  reader.readAsText(file);
};

App.resetAll = function () {
  if (!App.confirmBox('确定要清空所有学习数据吗？此操作不可恢复！')) return;
  if (!App.confirmBox('再次确认：真的要清空吗？（建议先导出备份）')) return;
  localStorage.removeItem(App.STORE_KEY);
  location.reload();
};
