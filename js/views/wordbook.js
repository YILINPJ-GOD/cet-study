/* ===== 生词本：查过的词集中管理 ===== */
App.Views.wordbook = App.Views.wordbook || {};
(function () {
  const V = App.Views.wordbook;
  V.render = function (el) {
    const words = Object.keys(App.store.wordbook).sort((a, b) => App.store.wordbook[b].d.localeCompare(App.store.wordbook[a].d));
    el.innerHTML = `
      <div class="card">
        <h3>⭐ 生词本 <span class="sub">${words.length} 个词 · 自动进入每日复习队列</span></h3>
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">
          <input class="txt" id="lookup" placeholder="输入单词查询内置词典并收藏…" style="flex:1">
          <button class="btn ghost" id="lookupBtn">查词</button>
        </div>
        <div class="note">来源：① 阅读/写作/翻译页面点击生词 → 「加入生词本」；② 背词、速刷时标记「有点难/不认识」自动收录。生词本中的词与正式词库一样参与间隔重复。</div>
        <div id="lookupResult" style="margin-top:10px"></div>
      </div>
      <div class="card">
        <h3>我的生词</h3>
        ${words.length ? words.map(w => {
          const e = App.WMAP()[w];
          const st = App.srsStatus(w);
          const meta = App.store.wordbook[w];
          return `<div class="list-row">
            <div style="flex:1;min-width:0">
              <b style="font-size:15px">${w}</b>
              ${e ? '<span class="note">/' + e.ipa + '/ ' + e.pos + '</span>' : '<span class="badge warn">未收录</span>'}
              <span class="badge ${st.cls || 'tag'}" style="${st.cls ? '' : 'background:#f1f3fa;color:var(--ink2)'}">${st.label}</span>
              <div class="note">${e ? App.esc(e.gloss) : '（词库未收录释义，点击 🔊 听发音）'} <span style="opacity:.6">· ${meta.d} 加入 · ${meta.src}</span></div>
            </div>
            ${e ? '<button class="ico-btn" data-sp="' + w + '">🔊</button>' : '<button class="ico-btn" data-sp="' + w + '">🔊</button>'}
            <button class="btn danger sm" data-del="${w}">移除</button>
          </div>`;
        }).join('') : '<div class="empty"><div class="big">📭</div>生词本还是空的。去阅读文章里点几个生词试试！</div>'}
      </div>`;
    const doLookup = () => {
      const q = el.querySelector('#lookup').value.trim();
      const box = el.querySelector('#lookupResult');
      if (!q) return;
      const entry = App.dict.lookup(q);
      if (entry) {
        box.innerHTML = `<div class="fb-item info"><b>${entry.w}</b><span>/${entry.ipa}/ ${entry.pos} · ${App.esc(entry.gloss)} <button class="btn ghost sm" id="addIt">＋ 加入生词本</button></span></div>`;
        box.querySelector('#addIt').onclick = () => App.dict.addToBook(entry.w, '手动查询');
      } else {
        box.innerHTML = '<div class="fb-item warn"><b>未收录</b><span>「' + App.esc(q) + '」不在内置词典中，可直接加入生词本记录。<button class="btn ghost sm" id="addIt2">＋ 仍要加入</button></span></div>';
        box.querySelector('#addIt2').onclick = () => App.dict.addToBook(q.toLowerCase(), '手动查询-未收录');
      }
      App.speak(q);
    };
    el.querySelector('#lookupBtn').onclick = doLookup;
    el.querySelector('#lookup').onkeydown = e => { if (e.key === 'Enter') doLookup(); };
    el.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => App.speak(b.dataset.sp));
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      if (App.confirmBox('把「' + b.dataset.del + '」从生词本移除？（学习记录将一并清除）')) {
        App.dict.removeFromBook(b.dataset.del);
        delete App.store.srs[b.dataset.del];
        App.save();
        V.render(el);
      }
    });
  };
})();
