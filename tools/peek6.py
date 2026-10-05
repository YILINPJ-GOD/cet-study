# -*- coding: utf-8 -*-
import io
p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()
i = t.find('^https')
print('idx', i)
print(repr(t[i - 40:i + 60]))
