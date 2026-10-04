/* ===== 听力专项：真题原音播放训练 + 题型分类刷题 ===== */
App.Views.listening = App.Views.listening || {};
App.Listening = {};
(function () {
  const LTYPES = {
    cet4: [
      { key: 'news', name: '短篇新闻', icon: '📰' },
      { key: 'conversation', name: '长对话', icon: '💬' },
      { key: 'passage', name: '听力篇章', icon: '📖' }
    ],
    cet6: [
      { key: 'conversation', name: '长对话', icon: '💬' },
      { key: 'passage', name: '听力篇章', icon: '📖' },
      { key: 'lecture', name: '讲座 / 讲话', icon: '🎤' }
    ]
  };
  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
  App.Listening.LTYPES = LTYPES;
  App.Listening.allSets = () => (window.LISTENING_CET4 || []).concat(window.LISTENING_CET6 || []);
  App.Listening.speeds = SPEEDS;
  /* 句窗口：返回 [start, end)（秒）；用于逐句循环与高亮。越界索引钳制到已校准范围 */
  App.Listening.sentenceWindow = function (calib, i, dur) {
    const c = calib || [];
    if (!c.length) return [0, dur || 6];
    const idx = Math.max(0, Math.min(i, c.length - 1));
    const start = typeof c[idx] === 'number' ? c[idx] : 0;
    const next = idx + 1 < c.length && typeof c[idx + 1] === 'number' ? c[idx + 1] : null;
    const end = next != null ? next : (dur || start + 6);
    return [start, Math.max(end, start + 0.5)];
  };
  function best(type, id) {
    const recs = (App.store.practice.listening || []).filter(r => r.type === type && r.id === id);
    return recs.length ? Math.max(...recs.map(r => Math.round(r.c / r.t * 100))) : null;
  }
  function record(type, id, c, t) {
    if (!App.store.practice.listening) App.store.practice.listening = [];
    App.store.practice.listening.push({ d: Date.now(), type, id, c, t });
    App.save();
  }

  let S = null; // 练习页状态 {set, calib, sentLoop, sentIdx, abA, abB, showText, showCn, calibMode, audioUrl, tts}

  const V = App.Views.listening;
  V.render = function (el, param) {
    if (param && param.id) return renderPractice(el, param.id);
    if (param && param.type) return renderType(el, param.type);
    renderHome(el);
  };

  function setsOf(exam, type) { return App.Listening.allSets().filter(s => s.exam === exam && s.type === type); }

  function renderHome(el) {
    const exam = App.store.profile.exam || 'cet6';
    const keys = App.audb ? [] : [];
    el.innerHTML = `<div class="card">
      <h3>🎧 听力专项 <span class="sub">${App.examName()} · 真题风格题源 + 原音精听工具</span></h3>
      <div class="note" style="margin-bottom:12px">音频说明：出于版权与离线要求，App 不内置音频。请把你持有的真题听力音频（MP3/M4A 等）通过每套题里的「导入原音」按钮导入，文件会保存在本机数据库中，重启不丢。未导入时可先用「系统朗读演练」熟悉原文（非真题原音）。</div>
      <div class="grid3" id="ltypes">
        ${LTYPES[exam].map(t => {
          const ss = setsOf(exam, t.key);
          const done = (App.store.practice.listening || []).filter(r => ss.some(s => s.id === r.id));
          const acc = done.length ? Math.round(done.reduce((a, r) => a + r.c / r.t, 0) / done.length * 100) : null;
          return `<div class="card" style="cursor:pointer;margin:0" data-type="${t.key}">
            <div style="font-size:28px">${t.icon}</div>
            <h3 style="margin:6px 0 4px">${t.name}</h3>
            <div class="note">${ss.length} 套 · 每套 3-4 题</div>
            <hr class="hr">
            <b style="font-size:13px">${acc == null ? '未开练' : '平均正确率 ' + acc + '%'}</b>
          </div>`;
        }).join('')}
      </div>
      <div class="note" style="margin-top:12px">💡 精听建议：第一遍常速盲听答题 → 第二遍 0.75× 逐句循环跟读 → 第三遍 1.25× 恢复常速检验。先点「校准句起点」把每句时间标出来，逐句循环才可用。</div>
    </div>`;
    el.querySelectorAll('[data-type]').forEach(c => c.onclick = () => V.render(el, { type: c.dataset.type }));
  }

  function renderType(el, type) {
    const exam = App.store.profile.exam || 'cet6';
    const t = LTYPES[exam].find(x => x.key === type) || { name: type, icon: '🎧' };
    const ss = setsOf(exam, type);
    el.innerHTML = `<div class="card"><h3>${t.icon} ${t.name} <button class="btn plain sm" id="back" style="margin-left:auto">‹ 返回</button></h3>
      <div class="grid2">${ss.map(s => {
        const b = best(type, s.id);
        return `<div class="topic-card" data-id="${s.id}">
          <div class="tc-title">${s.title}</div>
          <div class="tc-meta">${s.sentences.length} 句原文 · ${s.questions.length} 题</div>
          <div style="margin-top:8px">
            ${b == null ? '<span class="tag">未做过</span>' : '<span class="badge ' + (b >= 70 ? 'ok' : b >= 50 ? 'warn' : 'bad') + '">最好成绩 ' + b + '%</span>'}
            <span class="tag" data-audio="${s.id}">🔊 检查音频…</span>
          </div>
        </div>`;
      }).join('')}</div></div>`;
    el.querySelector('#back').onclick = () => V.render(el);
    el.querySelectorAll('.topic-card').forEach(c => c.onclick = () => V.render(el, { id: c.dataset.id }));
    // 音频状态标记
    App.audb.keys().then(ks => {
      ks.forEach(k => {
        const tag = el.querySelector('[data-audio="' + k.replace(/^au_/, '') + '"]');
        if (tag) tag.textContent = '✓ 已有原音';
      });
    }).catch(() => {});
  }

  /* ---------- 练习页 ---------- */
  function renderPractice(el, id) {
    const set = App.Listening.allSets().find(s => s.id === id);
    if (!set) return V.render(el);
    S = {
      set, calib: (App.store.calib && App.store.calib[id]) || [],
      sentLoop: false, sentIdx: 0, abA: null, abB: null,
      showText: true, showCn: false, calibMode: false,
      audioUrl: null, ttsOn: false
    };
    el.innerHTML = `
      <div class="card">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap">
          <button class="btn plain sm" id="back">‹ 返回</button>
          <b>${set.title}</b><span class="tag">${App.examName()}</span>
          <span class="tag">${(LTYPES[set.exam].find(t => t.key === set.type) || {}).name || set.type}</span>
          <span id="audioState" style="margin-left:auto" class="note">检查音频…</span>
        </div>
        <div id="playerZone"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">
          <button class="btn ghost sm" id="tSpeed">变速</button>
          <button class="btn ghost sm" id="tSent">逐句循环：关</button>
          <button class="btn ghost sm" id="tText">原文：显示</button>
          <button class="btn ghost sm" id="tCn">译文：隐藏</button>
          <button class="btn ghost sm" id="tCalib">校准句起点：关</button>
        </div>
        <div id="sentList"></div>
      </div>
      <div class="card" id="qCard"></div>`;

    el.querySelector('#back').onclick = () => { stopAll(); V.render(el, { type: S.set.type }); };
    // 控制条
    el.querySelector('#tSpeed').onclick = cycleSpeed;
    el.querySelector('#tSent').onclick = () => { S.sentLoop = !S.sentLoop; paintBtns(); if (S.sentLoop) jumpToSentence(S.sentIdx); };
    el.querySelector('#tText').onclick = () => { S.showText = !S.showText; paintBtns(); paintSentences(); };
    el.querySelector('#tCn').onclick = () => { S.showCn = !S.showCn; paintBtns(); paintSentences(); };
    el.querySelector('#tCalib').onclick = () => { S.calibMode = !S.calibMode; paintBtns(); paintSentences(); };

    loadAudio();
    paintPlayer();
    paintSentences();
    renderQuestions();
  }

  function stopAll() {
    if (S && S.audioEl) { try { S.audioEl.pause(); } catch (e) {} }
    if (S && S.ttsOn) { try { speechSynthesis.cancel(); } catch (e) {} S.ttsOn = false; }
    if (S && S.audioUrl) { URL.revokeObjectURL(S.audioUrl); S.audioUrl = null; }
  }

  function curAudio() { return S.audioEl || null; }

  function loadAudio() {
    const state = document.getElementById('audioState');
    App.audb.get('au_' + S.set.id).then(blob => {
      if (!blob) {
        state.innerHTML = '<span class="badge warn">未导入原音</span>';
        paintPlayer();
        return;
      }
      S.audioUrl = URL.createObjectURL(blob);
      const au = new Audio(S.audioUrl);
      au.preload = 'metadata';
      au.addEventListener('timeupdate', onTime);
      au.addEventListener('ended', onEnded);
      S.audioEl = au;
      state.innerHTML = '<span class="badge ok">✓ 原音已就绪</span>';
      paintPlayer();
    }).catch(() => { state.textContent = '音频库不可用'; });
  }

  function onTime() {
    const au = curAudio(); if (!au) return;
    const bar = document.getElementById('seek'); if (bar && au.duration) bar.value = au.currentTime / au.duration * 1000;
    const t = document.getElementById('tNow'); if (t) t.textContent = App.mmss(au.currentTime) + ' / ' + (au.duration ? App.mmss(au.duration) : '--:--');
    if (S.sentLoop) {
      const [a, b] = App.Listening.sentenceWindow(S.calib, S.sentIdx, au.duration);
      if (au.currentTime >= b - 0.03 || au.currentTime < a - 0.6) au.currentTime = a;
    }
    if (S.abA != null && S.abB != null && au.currentTime >= S.abB) au.currentTime = S.abA;
    // 高亮当前句
    if (S.calib.length) {
      const rows = document.querySelectorAll('#sentList .sent-row');
      let cur = 0;
      for (let i = 0; i < S.calib.length; i++) if (au.currentTime >= S.calib[i] - 0.2) cur = i;
      rows.forEach((r, i) => r.classList.toggle('cur', i === cur && S.calib[i] != null));
    }
  }

  function onEnded() {
    const au = curAudio(); if (!au) return;
    if (S.sentLoop) { const [a] = App.Listening.sentenceWindow(S.calib, S.sentIdx, au.duration); au.currentTime = a; au.play(); }
  }

  function jumpToSentence(i) {
    const n = S.set.sentences.length;
    S.sentIdx = Math.max(0, Math.min(n - 1, i));
    const au = curAudio();
    if (au && S.calib.length) {
      const [a] = App.Listening.sentenceWindow(S.calib, S.sentIdx, au.duration);
      au.currentTime = a;
      au.play().catch(() => {});
    }
    paintSentences();
  }

  function cycleSpeed() {
    const au = curAudio();
    const cur = au ? au.playbackRate : (S.rate || 1);
    const next = SPEEDS[(SPEEDS.indexOf(Math.round(cur * 100) / 100) + 1) % SPEEDS.length] || 1;
    S.rate = next;
    if (au) au.playbackRate = next;
    paintBtns();
  }

  function paintBtns() {
    const setTxt = (id, txt, active) => { const b = document.getElementById(id); if (b) { b.textContent = txt; b.style.borderColor = active ? 'var(--pri)' : ''; b.style.color = active ? 'var(--pri)' : ''; b.style.fontWeight = active ? '700' : ''; } };
    setTxt('tSpeed', '变速 ' + (S.rate || 1) + '×', (S.rate || 1) !== 1);
    setTxt('tSent', '逐句循环：' + (S.sentLoop ? '开' : '关'), S.sentLoop);
    setTxt('tText', '原文：' + (S.showText ? '显示' : '隐藏(精听)'), !S.showText);
    setTxt('tCn', '译文：' + (S.showCn ? '显示' : '隐藏'), S.showCn);
    setTxt('tCalib', '校准句起点：' + (S.calibMode ? '开' : '关'), S.calibMode);
  }

  function paintPlayer() {
    const zone = document.getElementById('playerZone'); if (!zone) return;
    const au = curAudio();
    if (au) {
      zone.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <button class="btn" id="playBtn">▶ 播放</button>
          <input type="range" id="seek" min="0" max="1000" value="0" style="flex:1;min-width:160px">
          <span class="note mono" id="tNow">00:00 / --:--</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center">
          <button class="btn plain sm" id="abA">设 A 点</button>
          <button class="btn plain sm" id="abB">设 B 点</button>
          <button class="btn plain sm" id="abClr">清除AB</button>
          <span class="note" id="abInfo">${S.abA != null ? 'AB复读已开启' : 'AB复读：先在播放中设 A 点，再设 B 点，区间将自动循环'}</span>
          <button class="btn danger sm" id="auDel" style="margin-left:auto">移除本套音频</button>
        </div>`;
      const play = zone.querySelector('#playBtn');
      play.onclick = () => {
        if (au.paused) { au.playbackRate = S.rate || 1; au.play(); play.textContent = '⏸ 暂停'; }
        else { au.pause(); play.textContent = '▶ 播放'; }
      };
      zone.querySelector('#seek').oninput = e => { if (au.duration) au.currentTime = e.target.value / 1000 * au.duration; };
      zone.querySelector('#abA').onclick = () => { S.abA = au.currentTime; S.abB = null; paintPlayer(); };
      zone.querySelector('#abB').onclick = () => { S.abB = Math.max(au.currentTime, (S.abA || 0) + 1); paintPlayer(); };
      zone.querySelector('#abClr').onclick = () => { S.abA = S.abB = null; paintPlayer(); };
      zone.querySelector('#auDel').onclick = async () => {
        if (!App.confirmBox('移除本套已导入的音频文件？')) return;
        await App.audb.del('au_' + S.set.id);
        stopAll(); App.toast('已移除'); V.render(document.getElementById('view'), { id: S.set.id });
      };
    } else {
      zone.innerHTML = `
        <div style="background:#f7f8fd;border:1.5px dashed var(--line);border-radius:12px;padding:14px">
          <b>📢 本套暂无原音</b>
          <div class="note" style="margin:6px 0 10px">导入你持有的真题听力音频（MP3/M4A/WAV），将保存在本机、重启不丢；或先用下方"系统朗读演练"熟悉原文（非真题原音）。</div>
          <input type="file" id="auFile" accept="audio/*" style="display:none">
          <button class="btn" id="auImport">⬆ 导入原音文件</button>
          <button class="btn ghost" id="ttsBtn" style="margin-left:8px">🗣 系统朗读演练</button>
          <button class="btn plain sm" id="ttsStop" style="margin-left:6px;display:none">⏹ 停止朗读</button>
        </div>`;
      const file = zone.querySelector('#auFile');
      zone.querySelector('#auImport').onclick = () => file.click();
      file.onchange = async () => {
        if (!file.files[0]) return;
        try {
          await App.audb.put('au_' + S.set.id, file.files[0]);
          App.toast('原音已导入并保存到本机');
        } catch (e) {
          App.toast('导入失败：' + (e.message || '本地音频存储不可用') + '。可改用系统朗读演练。');
          return;
        }
        V.render(document.getElementById('view'), { id: S.set.id });
      };
      const tts = zone.querySelector('#ttsBtn'), stop = zone.querySelector('#ttsStop');
      tts.onclick = () => {
        S.ttsOn = true; S.sentIdx = 0;
        tts.style.display = 'none'; stop.style.display = '';
        ttsSpeak();
      };
      stop.onclick = () => { S.ttsOn = false; try { speechSynthesis.cancel(); } catch (e) {} tts.style.display = ''; stop.style.display = 'none'; };
    }
  }

  function ttsSpeak() {
    if (!S.ttsOn) return;
    const ss = S.set.sentences;
    if (S.sentIdx >= ss.length) { S.ttsOn = false; paintPlayer(); return; }
    const u = new SpeechSynthesisUtterance(ss[S.sentIdx].en);
    u.lang = 'en-US';
    u.rate = S.rate || 1;
    u.onend = () => {
      if (!S.ttsOn) return;
      S.sentIdx = S.sentLoop ? S.sentIdx : S.sentIdx + 1;
      if (S.sentLoop && S.sentIdx >= ss.length) S.sentIdx = 0;
      paintSentences();
      setTimeout(ttsSpeak, 350);
    };
    speechSynthesis.speak(u);
  }

  function paintSentences() {
    const box = document.getElementById('sentList'); if (!box) return;
    const au = curAudio();
    box.innerHTML = '<h3 style="font-size:13.5px;margin:4px 0 8px">逐句精听 <span class="sub">' + (S.calib.length ? '已校准 ' + S.calib.filter(x => x != null).length + ' 句' : '尚未校准——打开「校准句起点」，播放中逐句点「设为起点」') + '</span></h3>' +
      S.set.sentences.map((sn, i) => {
        const t = S.calib[i] != null ? App.mmss(S.calib[i]) : '--:--';
        const isCur = S.sentLoop && i === S.sentIdx;
        return `<div class="sent-row ${isCur ? 'cur' : ''}" style="padding:8px 10px;border-bottom:1px dashed var(--line);border-radius:8px;${isCur ? 'background:var(--pri-soft)' : ''}">
          <div style="display:flex;gap:8px;align-items:flex-start">
            <span class="note mono" style="min-width:44px">${t}</span>
            <div style="flex:1;min-width:0">
              <div class="sent-en" style="${S.showText ? '' : 'filter:blur(5px);cursor:pointer;user-select:none'}" data-i="${i}">${App.esc(sn.en)}</div>
              ${S.showCn ? '<div class="note" style="margin-top:2px">' + App.esc(sn.cn) + '</div>' : ''}
            </div>
            ${S.calibMode ? '<button class="btn plain sm" data-cal="' + i + '">设为起点</button>' :
              (au ? '<button class="btn plain sm" data-loop="' + i + '">循环此句</button>' : '')}
          </div>
        </div>`;
      }).join('');
    box.querySelectorAll('.sent-en').forEach(x => x.onclick = () => { if (!S.showText) { S.showText = true; paintBtns(); paintSentences(); } });
    box.querySelectorAll('[data-cal]').forEach(b => b.onclick = () => {
      const a = curAudio();
      if (!a) { App.toast('请先导入并播放音频'); return; }
      S.calib[+b.dataset.cal] = Math.round(a.currentTime * 10) / 10;
      App.store.calib = App.store.calib || {};
      App.store.calib[S.set.id] = S.calib;
      App.save();
      paintSentences();
      // 自动播放下一句开头，方便连续校准
      if (S.calib[+b.dataset.cal + 1] == null) { a.currentTime = S.calib[+b.dataset.cal]; a.play().catch(() => {}); }
    });
    box.querySelectorAll('[data-loop]').forEach(b => b.onclick = () => { jumpToSentence(+b.dataset.loop); });
  }

  function renderQuestions() {
    const set = S.set;
    const card = document.getElementById('qCard');
    const answers = new Array(set.questions.length).fill(null);
    card.innerHTML = `<h3>听力题目 <span class="sub">先盲听作答，再对照解析</span></h3>
      ${set.questions.map((q, i) => `<div style="margin-bottom:16px">
        <b>${i + 1}. ${App.esc(q.q)}</b>
        ${q.opts.map((o, j) => `<div class="opt" data-q="${i}" data-o="${j}"><span class="k">${'ABCD'[j]}</span><span>${App.esc(o)}</span></div>`).join('')}
        <div class="fb-item" id="lexp${i}" style="display:none"></div>
      </div>`).join('')}
      <button class="btn" id="qSubmit">提交答案</button>`;
    card.querySelectorAll('.opt').forEach(o => o.onclick = () => {
      const qi = +o.dataset.q;
      card.querySelectorAll('.opt[data-q="' + qi + '"]').forEach(x => x.classList.remove('sel'));
      o.classList.add('sel');
      answers[qi] = +o.dataset.o;
    });
    card.querySelector('#qSubmit').onclick = () => {
      if (answers.includes(null) && !App.confirmBox('还有题目未作答，确定提交吗？')) return;
      let c = 0;
      set.questions.forEach((q, i) => {
        const ok = answers[i] === q.a;
        if (ok) c++;
        card.querySelectorAll('.opt[data-q="' + i + '"]').forEach(o2 => {
          o2.style.pointerEvents = 'none';
          const j = +o2.dataset.o;
          if (j === q.a) o2.classList.add('right');
          else if (answers[i] === j) o2.classList.add('wrong');
        });
        const exp = card.querySelector('#lexp' + i);
        exp.style.display = 'flex';
        exp.className = 'fb-item ' + (ok ? 'good' : 'bad');
        exp.innerHTML = '<b>' + (ok ? '✓ 正确' : '✗ 你的答案：' + (answers[i] == null ? '未作答 · ' : String.fromCharCode(65 + answers[i]) + ' · ')) + '正确：' + String.fromCharCode(65 + q.a) + '</b><span>' + App.esc(q.exp) + '</span>';
      });
      record(set.type, set.id, c, set.questions.length);
      const btn = card.querySelector('#qSubmit'); btn.disabled = true; btn.textContent = '已提交 ' + c + '/' + set.questions.length;
      App.toast('听力练习已记录：' + Math.round(c / set.questions.length * 100) + '%');
    };
  }
})();
