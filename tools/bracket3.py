# -*- coding: utf-8 -*-
# 逐行报告 { } 差值
import io

p = r'D:\六级APP\js\data\reading_careful.js'
lines = io.open(p, encoding='utf-8').read().split('\n')

pairs = {'[': ']', '{': '}', '(': ')'}
close = {v: k for k, v in pairs.items()}
carry = 0
for i, l in enumerate(lines):
    in_str = False
    j = 0
    while j < len(l):
        ch = l[j]
        if ch == '\\' and in_str:
            j += 2
            continue
        if ch == '"':
            in_str = not in_str
        elif not in_str:
            if ch in carry:
                carry[ch] += 1
            elif ch in close:
                carry[close[ch]] -= 1
        j += 1
    if carry != 0 and i > 2:
        # 找到了第一个非零行
        pass

# 找到 { 差值首次非零（表示多余的 }）的行
carry = 0
prev = 0
for i, l in enumerate(lines):
    in_str = False
    j = 0
    while j < len(l):
        ch = l[j]
        if ch == '\\' and in_str:
            j += 2
            continue
        if ch == '"':
            in_str = not in_str
        elif not in_str:
            if ch == '{':
                carry += 1
            elif ch == '}':
                carry -= 1
        j += 1
    if carry < prev and carry == -1:
        print('first carry=-1 at line', i + 1, ':', repr(l[:120]))
        break
    prev = carry
