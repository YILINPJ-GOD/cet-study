# -*- coding: utf-8 -*-
import io, re

p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()
lines = t.split('\n')
for i, l in enumerate(lines):
    if 'T.add(' in l and ('WRI6' in l or 'TR6' in l):
        print(f'line {i+1}: {l[:80]}')
