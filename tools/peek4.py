# -*- coding: utf-8 -*-
import io
p = r'D:\六级APP\js\data\roots.js'
t = io.open(p, encoding='utf-8').read()
i = t.find(']);')
print('pos', i)
print(repr(t[max(0, i - 140):i + 80]))
