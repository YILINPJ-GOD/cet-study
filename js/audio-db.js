/* ===== 音频本地库（IndexedDB）：存放用户导入的真题原音 ===== */
App.audb = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      const req = indexedDB.open('cet_audio', 1);
      req.onupgradeneeded = e => { e.target.result.createObjectStore('audio'); };
      req.onsuccess = e => { this._db = e.target.result; res(this._db); };
      req.onerror = () => rej(req.error);
    });
  },
  async put(id, blob) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('audio', 'readwrite');
      tx.objectStore('audio').put(blob, id);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
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
    });
  },
  async keys() {
    const db = await this.open();
    return new Promise(res => {
      const req = db.transaction('audio').objectStore('audio').getAllKeys();
      req.onsuccess = () => res(req.result || []);
    });
  }
};
