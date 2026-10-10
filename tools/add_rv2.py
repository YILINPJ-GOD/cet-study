# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()

# 找 IIFE 结尾前插入
close_tag = '})(window.__E2E);'
idx = t.rfind(close_tag)
if idx < 0:
    raise ValueError('IIFE close not found')

new_cases = '''
  /* ---------- v1.8.1：回忆式复习模式 ---------- */
  T.add('RV-01 复习流程为回忆式（看词-自评-翻面-确认）', async () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.store.profile.dailyNew = 2;
    App.dayStat().newW = 0;
    const words = App.allWords().slice(0, 2);
    words.forEach(w => { App.store.srs[w.w] = { b: 1, due: Date.now() - 1000, c: 1, w: 0 }; });
    App.store.genLastDate = App.today();
    App.go('vocab');
    await new Promise(r => setTimeout(r, 100));
    const start = document.querySelector('#startAll');
    if (!start) {
      // 可能任务面板没渲染，强制进入
      App.go('vocab');
      await new Promise(r => setTimeout(r, 100));
    }
    const start2 = document.querySelector('#startAll');
    if (!start2) throw new Error('startAll not found after go(vocab)');
    start2.click();
    await new Promise(r => setTimeout(r, 200));
    const card = document.querySelector('#cardBox .flashcard');
    if (!card) throw new Error('no flashcard rendered');
    const fw = card.querySelector('.fw');
    if (!fw || fw.textContent.trim().length < 2) throw new Error('no word shown');
    const fg = card.querySelector('.fg');
    if (fg && fg.textContent.trim().length > 2) throw new Error('meaning should not be visible initially');
    const rateBtns = document.querySelectorAll('#selfRate [data-r]');
    if (rateBtns.length !== 3) throw new Error('expected 3 self-rate buttons, got ' + rateBtns.length);
    if (document.querySelector('#confirmNext')) throw new Error('confirmNext should not exist before self-assessment');
    rateBtns[0].click();
    await new Promise(r => setTimeout(r, 200));
    const reveal = document.querySelector('#revealArea');
    if (!reveal || reveal.style.display === 'none') throw new Error('revealArea should be visible after self-assessment');
    const confirmNext = document.querySelector('#confirmNext');
    if (!confirmNext) throw new Error('confirmNext not found after reveal');
    confirmNext.click();
    await new Promise(r => setTimeout(r, 200));
    if (!document.querySelector('#cardBox .flashcard')) throw new Error('should advance to next card');
  });

  T.add('RV-02 fuzzy SRS review stays at current box', () => {
    const w = 'test_fuzzy_word';
    App.store.srs[w] = { b: 2, due: 0, c: 1, w: 0 };
    App.srsReview(w, false, true);
    if (App.store.srs[w].b !== 2) throw new Error('fuzzy should stay at box level');
    if (App.store.srs[w].due <= 0) throw new Error('fuzzy should set due time');
    App.srsReview(w, false);
    if (App.store.srs[w].b !== 0) throw new Error('forgot should go to box 0');
    App.srsReview(w, true);
    if (App.store.srs[w].b !== 1) throw new Error('know should go to box 1');
    delete App.store.srs[w];
  });

  T.add('RV-03 new word card shows meaning directly (no self-assess)', () => {
    App.store.profile.placed = true;
    App.store.profile.exam = 'cet6';
    App.dayStat().newW = 0;
    App.store.genLastDate = App.today();
    App.store.genBank = App.store.genBank || [];
    App.go('vocab');
    const start = document.querySelector('#startAll');
    if (!start) throw new Error('startAll not found on task panel');
    start.click();
    const card = document.querySelector('#cardBox .flashcard');
    if (!card) throw new Error('no card rendered');
    const fg = card.querySelector('.fg');
    if (!fg || fg.textContent.trim().length < 2) throw new Error('new word card should show meaning directly');
    const selfRate = document.querySelector('#selfRate');
    if (selfRate) throw new Error('new word card should not have self-assessment buttons');
    const easy = document.querySelector('#easy');
    if (easy) easy.click();
  });

'''
t = t[:idx] + new_cases + '  ' + close_tag
io.open(p, 'w', encoding='utf-8').write(t)
print('RV cases appended. T.add total:', t.count('T.add('))
