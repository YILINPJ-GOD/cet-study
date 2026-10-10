# -*- coding: utf-8 -*-
# 逐行定位 reading_careful.js 的括号/引号不平衡
import io

p = r'D:\六级APP\js\data\reading_careful.js'
lines = io.open(p, encoding='utf-8').read().split('\n')

carry = {'[': 0, '{': 0, '(': 0}
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
            if ch in '[{(':
                carry[ch] += 1
            elif ch in ']})':
                carry[{'[': ']', '{': '}', '(': ')'}[ch]] -= 1
        j += 1
    if i < 5 or i > len(lines) - 4 or (i % 20 == 0):
        pass  # 只报告异常行

# 报告 carry 归零后再次非零的行
carry2 = {'[': 0, '{': 0, '(': 0}
zero_at = None
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
            if ch in '[{(':
                carry2[ch] += 1
            elif ch in ']})':
                carry2[{'[': ']', '{': '}', '(': ')'}[ch]] -= 1
        j += 1
    total = sum(carry2.values())
    if total == 0 and zero_at is None:
        zero_at = i + 1
    if total != 0 and zero_at is not None:
        print('REOPENED at line', i + 1, 'delta:', {k: v for k, v in carry2.items() if v}, '| line:', l[:100])
        break

print('final carry:', carry2)
print('first zero at line:', zero_at)
