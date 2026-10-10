# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\tools\e2e-suite.js'
lines = io.open(p, encoding='utf-8').read().split('\n')
carry = 0
for i, l in enumerate(lines):
    ins = False
    j = 0
    while j < len(l):
        ch = l[j]
        if ch == '\\' and ins: j += 2; continue
        if ch == '"': ins = not ins
        else:
            if ch == '{': carry += 1
            elif ch == '}': carry -= 1
        j += 1
    if carry == -1:
        print(f'FIRST EXTRA }} at line {i+1}: {l[:100]}')
        break
    if carry == -2:
        print(f'SECOND EXTRA }} at line {i+1}: {l[:100]}')
        break

# 找 IIFE 结束位置
for i, l in enumerate(lines):
    if 'window.__E2E);' in l:
        print(f'IIFE close at line {i+1}: {l[:60]}')
        break
