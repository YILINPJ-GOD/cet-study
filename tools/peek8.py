# -*- coding: utf-8 -*-
import io
p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()
i = t.find('应含')
# 找 TR6 的结尾
j = t.rfind('TR6')
seg = t[j:j+800]
print(repr(seg[-300:]))
