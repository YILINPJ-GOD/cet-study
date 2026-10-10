# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\js\data\reading_careful.js'
lines = io.open(p, encoding='utf-8').read().split('\n')
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
            if ch == '{':
                carry += 1
            elif ch == '}':
                carry -= 1
        j += 1
    if carry == -1:
        print('first carry=-1 at line', i + 1, ':', repr(l[:140]))
        break
print('done, final carry:', carry)
