/* ===== 音频本地库（IndexedDB）：存放用户导入的真题原音 =====
   兼容性说明：以 file:// 方式双击打开时，部分浏览器会禁用 IndexedDB。
   本模块保证在不可用时优雅降级：查询返回空、写入给出友好错误，页面不崩溃。 */
App.audb = {
  _db: null,
  _broken: false,
  available() { return !this._broken; },
  open() {
    if (this._db) return Promise.resolve(this._db);
    if (this._broken) return Promise.reject(new Error('IndexedDB 不可用'));
    return new Promise((res, rej) => {
      let req;
      try {
        if (!window.indexedDB) throw new Error('浏览器未提供 IndexedDB');
        req = indexedDB.open('cet_audio', 1);
      } catch (e) {
        this._broken = true;
        rej(new Error('音频存储不可用（file:// 直开模式下浏览器会禁用本地数据库），听力音频导入功能暂不可用，其余功能不受影响'));
        return;
      }
      req.onupgradeneeded = e => { e.target.result.createObjectStore('audio'); };
      req.onsuccess = e => { this._db = e.target.result; res(this._db); };
      req.onerror = () => {
        this._broken = true;
        rej(new Error('音频存储打开失败，已降级运行（不影响其他功能）'));
      };
    });
  },
  async put(id, blob) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('audio', 'readwrite');
      tx.objectStore('audio').put(blob, id);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error || new Error('写入失败'));
    });
  },
  async get(id) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const req = db.transaction('audio').objectStore('audio').get(id);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => rej(req.error);
    });
  },
  async del(id) {
    const db = await this.open();
    return new Promise(res => {
      const tx = db.transaction('audio', 'readwrite');
      tx.objectStore('audio').delete(id);
      tx.oncomplete = () => res(true);
      tx.onerror = () => res(false);
    });
  },
  async keys() {
    try {
      const db = await this.open();
      return await new Promise(res => {
        const req = db.transaction('audio').objectStore('audio').getAllKeys();
        req.onsuccess = () => res(req.result || []);
        req.onerror = () => res([]);
      });
    } catch (e) {
      return [];
    }
  }
};
