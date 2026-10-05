# -*- coding: utf-8 -*-
import io, re
p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()
i = t.find('https:')
print(repr(t[i - 30:i + 60]))
