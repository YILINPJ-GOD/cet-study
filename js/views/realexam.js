/* ===== 真题中心：资源导航 + 本地真题库 + 刷题记录 ===== */
App.Views.realexam = App.Views.realexam || {};
(function () {
  let tab = 'links';
  const V = App.Views.realexam;
  V.reset = function () { tab = 'links'; };
  V.render = function (el) {
    el.innerHTML = '<div class="tabs">' +
      [['links', '🔗 资源导航'], ['lib', '📁 本地真题库'], ['scores', '📝 刷题记录']]
        .map(([k, t]) => '<button class="tab ' + (tab === k ? 'active' : '') + '" data-t="' + k + '">' + t + '</button>').join('') + '</div><div id="reBody"></div>';
    el.querySelectorAll('.tab').forEach(b => b.onclick = () => { tab = b.dataset.t; V.render(el); });
    const body = el.querySelector('#reBody');
    if (tab === 'links') renderLinks(body);
    else if (tab === 'lib') renderLib(body);
    else renderScores(body);
  };

  /* ---------- 资源导航 ---------- */
  function renderLinks(el) {
    const links = window.REAL_EXAM_LINKS || [];
    el.innerHTML = `
      <div class="card">
        <h3>📜 真题资源导航 <span class="sub">第三方公开资源站汇总</span></h3>
        <div class="fb-item warn"><b>⚖️ 版权说明</b><span>${App.esc(window.REAL_EXAM_DISCLAIMER || '')}</span></div>
        ${links.map((L, i) => `<div class="card" style="margin:10px 0 0">
          <h3 style="flex-wrap:wrap">${App.esc(L.name)}
            <a href="${L.url}" target="_blank" rel="noopener noreferrer"><button class="btn sm" data-open="${i}" style="margin-left:auto">打开站点 ↗</button></a>
          </h3>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">${L.tags.map(t => '<span class="tag">' + App.esc(t) + '</span>').join('')}</div>
          <div class="note" style="line-height:1.8">${App.esc(L.desc)}</div>
          <div class="note" style="margin-top:6px;opacity:.85">⚖️ ${App.esc(L.note)}</div>
          <div class="note" style="margin-top:6px">💡 用法：在站点下载真题 PDF / 听力音频到本机 → 切到「📁 本地真题库」导入 → 配合「冲刺模考」的真题全卷模式或打印对照使用。</div>
        </div>`).join('')}
      </div>`;
  }

  /* ---------- 本地真题库 ---------- */
  function renderLib(el) {
    const metas = (App.store.realExams || []).slice().sort((a, b) => b.date - a.date);
    const broken = !App.retdb.available();
    el.innerHTML = `
      <div class="card">
        <h3>📁 本地真题库 <span class="sub">${metas.length} 个文件 · 存于本机 IndexedDB</span></h3>
        ${broken ? '<div class="fb-item bad"><b>⚠️ 本地文件库不可用</b><span>当前以 file:// 方式打开，浏览器禁用了本地数据库。真题导入功能不可用——请通过本地服务器或 GitHub Pages 在线版使用本功能；其余学习模块不受影响。</span></div>' : `
        <div class="note" style="margin-bottom:10px">导入你下载好的真题 PDF（试卷/解析）或听力音频 MP3，打上级别与年月标签。文件只保存在本机，不上传任何服务器。</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin-bottom:12px">
          <div><div class="note">级别</div><select class="selct" id="reLevel"><option value="cet6">六级</option><option value="cet4">四级</option></select></div>
          <div><div class="note">年份</div><input class="txt" id="reYear" type="number" min="2010" max="2027" value="2025" style="width:90px"></div>
          <div><div class="note">月份/考次</div><select class="selct" id="reMonth"><option value="6">6 月</option><option value="12">12 月</option><option value="3">3 月加考</option><option value="9">9 月加考</option></select></div>
          <div><div class="note">备注（可选）</div><input class="txt" id="reLabel" placeholder="如：第一套 / 解析版" style="width:140px"></div>
          <button class="btn" id="reImportBtn">⬆ 选择文件导入</button>
          <input type="file" id="reFile" accept=".pdf,.mp3,.wav,.m4a,.aac,.ogg,.doc,.docx" style="display:none">
        </div>`}
        <div id="reList"></div>
      </div>`;
    if (broken) return;
    const fileInput = el.querySelector('#reFile');
    el.querySelector('#reImportBtn').onclick = () => fileInput.click();
    fileInput.onchange = async () => {
      const f = fileInput.files[0];
      if (!f) return;
      const kind = App.retx.kindOf(f.name);
      if (!kind) { App.toast('仅支持 PDF/Word 试卷或音频文件'); return; }
      const level = el.querySelector('#reLevel').value;
      const year = parseInt(el.querySelector('#reYear').value) || 2025;
      const month = el.querySelector('#reMonth').value;
      const label = el.querySelector('#reLabel').value.trim();
      const key = 're_' + level + '_' + year + '_' + month + '_' + Date.now();
      try {
        await App.retdb.put(key, f);
        App.store.realExams = App.store.realExams || [];
        App.store.realExams.push({
          key, kind, level, year, month,
          name: f.name, size: f.size, label,
          date: Date.now()
        });
        App.save();
        App.toast('已导入：' + f.name);
        V.render(el);
      } catch (e) {
        App.toast('导入失败：' + (e.message || '存储不可用'));
      }
    };
    const list = el.querySelector('#reList');
    const paint = () => {
      if (!metas.length) { list.innerHTML = '<div class="empty"><div class="big">📭</div>还没有导入真题。去「资源导航」下载，再回到这里导入。</div>'; return; }
      list.innerHTML = metas.map(m => `<div class="list-row">
        <span class="badge ${m.kind === 'audio' ? 'warn' : 'ok'}" style="min-width:52px;text-align:center">${m.kind === 'audio' ? '🎧 听力' : '📄 试卷'}</span>
        <div style="flex:1;min-width:0">
          <b>${App.esc((m.level === 'cet4' ? '四级 ' : '六级 ') + m.year + '.' + String(m.month).padStart(2, '0'))}</b>
          ${m.label ? '<span class="tag">' + App.esc(m.label) + '</span>' : ''}
          <div class="note" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${App.esc(m.name)} · ${(m.size / 1048576).toFixed(1)} MB</div>
        </div>
        <button class="btn ghost sm" data-openre="${m.key}">${m.kind === 'audio' ? '▶ 播放' : '📂 打开'}</button>
        <button class="btn danger sm" data-delre="${m.key}">删除</button>
      </div>`).join('');
      list.querySelectorAll('[data-openre]').forEach(b => b.onclick = async () => {
        const m = metas.find(x => x.key === b.dataset.openre);
        const r = await App.retx.openFile(m.key, m.name);
        if (r && r.inline) {
          let zone = document.getElementById('rePlayer');
          if (!zone) {
            el.querySelector('#reList').insertAdjacentHTML('beforebegin', '<div class="card" id="rePlayer" style="margin-bottom:12px"></div>');
            zone = document.getElementById('rePlayer');
          }
          zone.innerHTML = '<h3>🎧 正在播放：' + App.esc(m.name) + '</h3><audio controls autoplay style="width:100%" src="' + r.url + '"></audio>';
        }
      });
      list.querySelectorAll('[data-delre]').forEach(b => b.onclick = async () => {
        const m = metas.find(x => x.key === b.dataset.delre);
        if (!App.confirmBox('删除「' + ((m.level === 'cet4' ? '四级 ' : '六级 ') + m.year + '.' + String(m.month).padStart(2, '0')) + '」的本地文件？')) return;
        await App.retdb.del(m.key);
        App.store.realExams = (App.store.realExams || []).filter(x => x.key !== m.key);
        App.save();
        V.render(el);
      });
    };
    paint();
  }

  /* ---------- 刷题记录 ---------- */
  function renderScores(el) {
    const scores = (App.store.realScores || []).slice().sort((a, b) => b.date - a.date);
    const avg = scores.length ? Math.round(scores.reduce((a, s) => a + s.total, 0) / scores.length) : null;
    const best = scores.length ? Math.max(...scores.map(s => s.total)) : null;
    el.innerHTML = `
      <div class="card">
        <h3>📝 真题刷题记录 <span class="sub">手动录入做过的真题分数 · 计入个人成长</span></h3>
        <div class="note" style="margin-bottom:10px">用导入的真题 PDF 计时模考后，在这里录入分数。425 分为普遍认为的及格线，550+ 为优秀（数据参考：CET通备考平台）。</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end;margin-bottom:12px">
          <div><div class="note">级别</div><select class="selct" id="scLevel"><option value="cet6">六级</option><option value="cet4">四级</option></select></div>
          <div><div class="note">试卷标注</div><input class="txt" id="scLabel" placeholder="如 2024.06 第一套" style="width:160px"></div>
          <div><div class="note">总分（必填）</div><input class="txt" id="scTotal" type="number" min="0" max="710" style="width:90px"></div>
          <div><div class="note">听力</div><input class="txt" id="scL" type="number" min="0" max="248.5" style="width:76px"></div>
          <div><div class="note">阅读</div><input class="txt" id="scR" type="number" min="0" max="248.5" style="width:76px"></div>
          <div><div class="note">写作翻译</div><input class="txt" id="scW" type="number" min="0" max="213" style="width:76px"></div>
          <button class="btn" id="scAdd">＋ 记录</button>
        </div>
        ${scores.length ? `<div style="display:flex;gap:18px;margin:6px 0 12px;flex-wrap:wrap">
          <div><div class="num" style="font-size:22px;font-weight:800">${avg}</div><div class="note">平均分</div></div>
          <div><div class="num" style="font-size:22px;font-weight:800;color:var(--ok)">${best}</div><div class="note">最高分</div></div>
          <div><div class="num" style="font-size:22px;font-weight:800">${scores.length}</div><div class="note">已刷套数</div></div>
        </div>` : ''}
        <div id="scList"></div>
      </div>`;
    const list = el.querySelector('#scList');
    const paint = () => {
      if (!scores.length) { list.innerHTML = '<div class="empty"><div class="big">📋</div>还没有记录。做一套真题，回来录入分数吧。</div>'; return; }
      list.innerHTML = scores.map(s => `<div class="list-row">
        <span class="badge ${s.total >= 550 ? 'ok' : s.total >= 425 ? 'warn' : 'bad'}" style="min-width:70px;text-align:center;font-size:14px">${s.total} 分</span>
        <div style="flex:1;min-width:0"><b>${s.level === 'cet4' ? '四级' : '六级'} · ${App.esc(s.label)}</b>
          <div class="note">${s.sub ? '听力 ' + (s.sub.l ?? '—') + ' · 阅读 ' + (s.sub.r ?? '—') + ' · 写翻 ' + (s.sub.w ?? '—') + ' · ' : ''}${s.date}</div></div>
        <button class="btn danger sm" data-delsc="${s.id}">删除</button>
      </div>`).join('');
      list.querySelectorAll('[data-delsc]').forEach(b => b.onclick = () => {
        if (!App.confirmBox('删除这条刷题记录？')) return;
        App.store.realScores = (App.store.realScores || []).filter(x => x.id !== b.dataset.delsc);
        App.save();
        V.render(el);
      });
    };
    el.querySelector('#scAdd').onclick = () => {
      const totalV = parseInt(el.querySelector('#scTotal').value);
      if (!totalV || totalV < 0 || totalV > 710) { App.toast('请输入 0-710 之间的总分'); return; }
      const sub = {
        l: el.querySelector('#scL').value || null,
        r: el.querySelector('#scR').value || null,
        w: el.querySelector('#scW').value || null
      };
      App.store.realScores = App.store.realScores || [];
      App.store.realScores.push({
        id: 'sc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        level: el.querySelector('#scLevel').value,
        label: el.querySelector('#scLabel').value.trim() || '未命名试卷',
        total: totalV, sub, date: App.today()
      });
      App.save();
      App.toast('已记录');
      V.render(el);
    };
    paint();
  }
})();
