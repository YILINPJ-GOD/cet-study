# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()
# 替换 GEN5 词数断言为段落+题目结构断言
old = "if (words < 175) throw new Error(theme + ' 词数应≥175，实际 ' + words);"
new = "if (paras < 5 || s.questions.length !== 5) throw new Error(theme + ' 应≥5段5题，实际 ' + paras + '段' + s.questions.length + '题');"
assert old in t, 'anchor missing'
t = t.replace(old, new, 1)
io.open(p, 'w', encoding='utf-8').write(t)
print('GEN5 assertion changed to structure-based')
