# -*- coding: utf-8 -*-
# 逐行定位 reading_careful.js 括号不平衡
import io

p = r'D:\六级APP\js\data\reading_careful.js'
lines = io.open(p, encoding='utf-8').read().split('\n')

pairs = {'[': ']', '{': '}', '(': ')'}
close = {v: k for k, v in pairs.items()}
carry = {'[': 0, '{': 0, '(': 0}
first_zero = None

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
    total = sum(abs(v) for v in carry.values())
    if total == 0 and first_zero is None:
        first_zero = i + 1
    if total != 0 and first_zero is not None:
        print('REOPENED at line', i + 1, 'delta:', {k: v for k, v in carry.items() if v != 0})
        print('line:', repr(l[:120]))
        break

print('first zero at line:', first_zero)
print('final carry:', {k: v for k, v in carry.items() if v != 0})
