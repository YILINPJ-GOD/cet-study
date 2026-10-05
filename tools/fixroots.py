# -*- coding: utf-8 -*-
import io
p = r'D:\六级APP\js\data\roots.js'
t = io.open(p, encoding='utf-8').read()
bad = "]);\nwindow.WORD_ROOTS = window.WORD_ROOTS.filter"
good = "];\nwindow.WORD_ROOTS = window.WORD_ROOTS.filter"
assert bad in t, 'anchor missing'
t = t.replace(bad, good, 1)
io.open(p, 'w', encoding='utf-8').write(t)
print('fixed')
