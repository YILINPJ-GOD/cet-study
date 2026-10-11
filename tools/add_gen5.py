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
  /* ---------- GEN5：生成器 5 段文章对标六级 ---------- */
  T.add('GEN5 生成仔细阅读应≥5段且词数≥350', () => {
    for (const theme of ['tech', 'env', 'edu', 'health', 'society', 'culture']) {
      const s = App.Gen.makeCareful(theme);
      if (!s) throw new Error(theme + ' 生成失败');
      const paras = s.text.split(/\\n\\s*\\n/).filter(x => x.trim().length > 30);
      if (paras.length < 5) throw new Error(theme + ' 段数应≥5，实际 ' + paras.length);
      const words = s.text.split(/\\s+/).filter(x => /[a-zA-Z]/.test(x)).length;
      if (words < 350) throw new Error(theme + ' 词数应≥350，实际 ' + words);
      if (s.questions.length !== 5) throw new Error(theme + ' 应5题');
      s.questions.forEach((q, i) => {
        if (q.opts.length !== 4) throw new Error(theme + ' 题' + (i+1) + ' 选项数错误');
        if (q.a < 0 || q.a > 3) throw new Error(theme + ' 题' + (i+1) + ' 答案越界');
        if (!q.exp || q.exp.length < 20) throw new Error(theme + ' 题' + (i+1) + ' 解析过短');
      });
    }
  });

'''
t = t[:idx] + new_cases + '  ' + close_tag
io.open(p, 'w', encoding='utf-8').write(t)
print('GEN5 case added. T.add total:', t.count('T.add('))
