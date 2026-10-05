# -*- coding: utf-8 -*-
import io
t = io.open(r'D:\六级APP\tools\e2e-suite.js', encoding='utf-8').read()
i = t.find('EX-04')
seg = t[i:i + 1500]
j = seg.find('删除一条')
print('EX-04 at', i, '| 删除 at', j)
print(repr(seg[j - 80:j + 260]))
