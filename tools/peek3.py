# -*- coding: utf-8 -*-
import io
t = io.open(r'D:\六级APP\tools\e2e-suite.js', encoding='utf-8').read()
i = t.find('fakeFresh')
print('idx', i)
if i >= 0:
    print(repr(t[i:i + 280]))
