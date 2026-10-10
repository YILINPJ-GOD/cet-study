# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()
anchor = """    assert(last.mode === 'real' && last.total >= 300 && last.total <= 710, '真题成绩应入库且在合理区间：' + last.total);
  });"""
assert anchor in t, 'anchor missing'

new_cases = anchor + """

  /* ---------- v1.8.0：六级难度对标 ---------- */
  T.add('RD6 仔细阅读对标真题难度', () => {
    for (const s of (window.READING_CAREFUL || [])) {
      const words = s.text.split(/\\s+/).filter(x => /[a-zA-Z]/.test(x)).length;
      const sents = s.text.split(/[.!?]+/).filter(x => x.trim().split(/\\s+/).length > 5);
      const avg = Math.round(words / Math.max(1, sents.length));
      assert(words >= 360, s.id + ' 词数应≥360，实际 ' + words);
      assert(avg >= 18, s.id + ' 平均句长应≥18词，实际 ' + avg);
      assert(s.questions.length === 5, s.id + ' 应5题');
      const expOk = s.questions.every(q => q.exp && q.exp.length >= 40);
      assert(expOk, s.id + ' 每题应有详细中文解析');
      const stems = s.questions.map(q => q.q.toLowerCase()).join(' ');
      const hasPurposeOrInfer = /in order to|inferred|closest in meaning|suggests/.test(stems);
      assert(hasPurposeOrInfer, s.id + ' 应含推断/词义/目的题型');
    }
  });

  T.add('LS6 六级听力语篇密度达标', () => {
    const sets = (window.LISTENING_CET6 || []);
    assert(sets.length >= 6, '六级听力应≥6套');
    for (const s of sets) {
      assert(s.sentences.length >= 10, s.id + ' 句子应≥10，实际 ' + s.sentences.length);
      const enTexts = s.sentences.map(x => x.en);
      const avgW = Math.round(enTexts.reduce((a, t2) => a + t2.split(/\\s+/).length, 0) / enTexts.length);
      assert(avgW >= 11, s.id + ' 平均句长应≥11词，实际 ' + avgW);
      const longWords = enTexts.join(' ').split(/\\s+/).filter(w => w.length >= 10).length;
      assert(longWords >= 8, s.id + ' 学术长词应≥8个，实际 ' + longWords);
      const cns = s.sentences.every(x => x.cn && x.cn.length >= 4);
      assert(cns, s.id + ' 每句应有中文译文');
    }
  });

  T.add('GEN6 选词填空生成框架对标六级句式', () => {
    const s = App.Gen.makeCloze('tech', { level: 'cet6' });
    assert(s && s.text.length >= 500, '生成文段应足够长');
    assert(s.options.length === 15, '应15选项');
    const text = s.text.replace(/\\{\\d+\\}/g, 'X');
    const markers = [' that ', ' which ', ' while ', ' when ', ' only '];
    assert(markers.some(m => text.includes(m)), '生成文段应含从句/复杂结构标记');
  });

  T.add('WRI6 写作范文保持六级高级句式水准', () => {
    for (const t2 of (window.WRITING_TOPICS || [])) {
      const w = t2.sample.split(/\\s+/).length;
      assert(w >= 140 && w <= 230, t2.id + ' 范文词数应140-230，实际 ' + w);
      const adv = ['Only by', 'Not only', 'It is', 'With the', 'Admittedly', 'which', 'Were it', 'had it not'].filter(m => t2.sample.includes(m));
      assert(adv.length >= 2, t2.id + ' 范文应含≥2处高级句式标记，实际 ' + adv.join(','));
    }
  });

  T.add('TR6 翻译参考译文保持六级书面语水准', () => {
    for (const p of (window.TRANSLATION_PASSAGES || [])) {
      const w = p.ref.split(/\\s+/).length;
      assert(w >= 80, p.id + ' 参考译文应≥80词，实际 ' + w);
      const markers = [', which ', ', making ', ' has been ', ' are being ', ' with a ', ' by the ', ' to be '];
      assert(markers.some(m => p.ref.toLowerCase().includes(m)), p.id + ' 参考译文应含六级书面语结构标记');
    }
  });"""

t = t.replace(anchor, new_cases, 1)
io.open(p, 'w', encoding='utf-8').write(t)
print('added, T.add total:', t.count('T.add('))
