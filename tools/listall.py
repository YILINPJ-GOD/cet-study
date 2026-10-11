# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()

# 数用例数
import re
cases = re.findall(r"T\.add\('([^']+)'", t)
print('cases:', len(cases))
for i, c in enumerate(cases):
    print(f'{i}: {c}')
