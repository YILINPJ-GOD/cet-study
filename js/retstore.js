/* ===== 本地真题文件库（IndexedDB 'cet_files'）===== */
App.retdb = {
  _db: null,
  _broken: false,
  available() { return !this._broken; },
  open() {
    if (this._db) return Promise.resolve(this._db);
    if (this._broken) return Promise.reject(new Error('本地文件库不可用'));
    return new Promise((res, rej) => {
      let req;
      try {
        if (!window.indexedDB) throw new Error('浏览器未提供 IndexedDB');
        req = indexedDB.open('cet_files', 1);
      } catch (e) {
        this._broken = true;
        rej(new Error('本地文件库不可用（file:// 直开模式下浏览器会禁用本地数据库），真题导入功能暂不可用，其余功能不受影响'));
        return;
      }
      req.onupgradeneeded = e => { e.target.result.createObjectStore('files'); };
      req.onsuccess = e => { this._db = e.target.result; res(this._db); };
      req.onerror = () => { this._broken = true; rej(new Error('本地文件库打开失败，已降级运行')); };
    });
  },
  async put(key, blob) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put(blob, key);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error || new Error('写入失败'));
    });
  },
  async get(key) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const req = db.transaction('files').objectStore('files').get(key);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => rej(req.error);
    });
  },
  async del(key) {
    const db = await this.open();
    return new Promise(res => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').delete(key);
      tx.oncomplete = () => res(true);
      tx.onerror = () => res(false);
    });
  }
};

/* 真题库工具：kind 识别与打开 */
App.retx = {
  kindOf(name) {
    const n = String(name || '').toLowerCase();
    if (/\.(mp3|wav|m4a|aac|ogg)$/.test(n)) return 'audio';
    if (/\.(pdf|doc|docx)$/.test(n)) return 'paper';
    return null;
  },
  async openFile(key, name) {
    const blob = await App.retdb.get(key).catch(() => null);
    if (!blob) { App.toast('文件不存在或已被清理'); return false; }
    const url = URL.createObjectURL(blob);
    if (this.kindOf(name) === 'audio') return { url, inline: true };
    const w = window.open(url, '_blank');
    if (!w) {
      const a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return { opened: true };
  }
};
