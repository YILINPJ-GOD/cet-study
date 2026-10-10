# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()

anchor = "assert(markers.filter(m => p.ref.toLowerCase().includes(m)).length >= 2, p.id + ' 应含≥2处书面语结构标记');\n    }\n  });"
assert anchor in t, 'TR6 anchor missing'

new_cases = anchor + '''

  /* ---------- v1.8.1：回忆式复习模式 ---------- */
  T.add('RV-01 复习流程为回忆式（看词→自评→翻面→确认）', async () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.store.profile.dailyNew = 2;
    App.dayStat().newW = 0;
    const words = App.allWords().slice(0, 2);
    words.forEach(w => { App.store.srs[w.w] = { b: 1, due: Date.now() - 1000, c: 1, w: 0 }; });
    App.store.genLastDate = App.today();
    App.go('vocab');
    const start = document.querySelector('#startAll');
    if (!start) { App.Views.vocab.reset(); App.go('vocab'); }
    const start2 = document.querySelector('#startAll');
    if (!start2) throw new Error('应有今日任务');
    start2.click();
    const card = document.querySelector('#cardBox .flashcard');
    if (!card) throw new Error('应渲染卡片');
    const fw = card.querySelector('.fw');
    if (!fw || fw.textContent.trim().length < 2) throw new Error('应显示英文单词');
    const fg = card.querySelector('.fg');
    if (fg && fg.textContent.length > 2) throw new Error('初始不应显示释义');
    const rateBtns = document.querySelectorAll('#selfRate [data-r]');
    if (rateBtns.length !== 3) throw new Error('应有3个自评按钮');
    rateBtns[0].click();
    await new Promise(r => setTimeout(r, 100));
    const reveal = document.querySelector('#revealArea');
    if (!reveal || reveal.style.display === 'none') throw new Error('自评后应翻面显示释义');
    const confirmNext = document.querySelector('#confirmNext');
    if (!confirmNext) throw new Error('应有下一个按钮');
    confirmNext.click();
    await new Promise(r => setTimeout(r, 100));
    if (!document.querySelector('#cardBox .flashcard')) throw new Error('应切换到下一张卡片');
  });

  T.add('RV-02 回忆式模糊评分：SRS 停留不升降', () => {
    const w = 'test_fuzzy_word';
    App.store.srs[w] = { b: 2, due: 0, c: 1, w: 0 };
    App.srsReview(w, false, true);
    const rec = App.store.srs[w];
    if (rec.b !== 2) throw new Error('fuzzy 不应改变箱级');
    if (rec.due <= 0) throw new Error('fuzzy 应设置到期时间');
    App.srsReview(w, false);
    if (App.store.srs[w].b !== 0) throw new Error('忘记应降回箱0');
    App.srsReview(w, true);
    if (App.store.srs[w].b !== 1) throw new Error('认识应升到箱1');
    delete App.store.srs[w];
  });

  T.add('RV-03 新词学习卡仍直接显示释义', () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.dayStat().newW = 0;
    App.store.genLastDate = App.today();
    App.store.genBank = [];
    App.go('vocab');
    const start = document.querySelector('#startAll');
    if (!start) throw new Error('应有今日任务');
    start.click();
    const card = document.querySelector('#cardBox .flashcard');
    if (!card) throw new Error('应渲染卡片');
    const fg = card.querySelector('.fg');
    if (!fg || fg.textContent.length < 2) throw new Error('新词学习卡应直接显示释义');
    const selfRate = document.querySelector('#selfRate');
    if (selfRate) throw new Error('新词卡不应有自评按钮');
    const easy = document.querySelector('#easy');
    if (easy) easy.click();
  });'''

t = t.replace(anchor, new_cases, 1)
io.open(p, 'w', encoding='utf-8').write(t)
print('RV cases added. T.add total:', t.count('T.add('))
