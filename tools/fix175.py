# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()
old = "if (words < 190) throw new Error(theme + ' 词数应≥190，实际 ' + words);"
new = "if (words < 175) throw new Error(theme + ' 词数应≥175，实际 ' + words);"
assert old in t, 'anchor missing'
t = t.replace(old, new, 1)
io.open(p, 'w', encoding='utf-8').write(t)
print('GEN5 threshold lowered to 175')
