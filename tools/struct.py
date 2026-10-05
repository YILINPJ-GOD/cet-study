# -*- coding: utf-8 -*-
import io, re
t = io.open(r'D:\六级APP\tools\e2e-suite.js', encoding='utf-8').read()
print('const $ count:', len(re.findall(r'const \$ =', t)))
print('window.__E2E assign:', len(re.findall(r'window\.__E2E = \{', t)))
print('T.add count:', len(re.findall(r'T\.add\(', t)))
print('IIFE close:', len(re.findall(r'\}\)\(window\.__E2E\)', t)))
# 找出每个 const $ 的行号
for m in re.finditer(r'const \$ =', t):
    line = t[:m.start()].count('\n') + 1
    print('const $ at line', line)
