# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\js\data\reading_careful.js'
lines = io.open(p, encoding='utf-8').read().split('\n')
# 打印 lines 4-9（c1 questions 开头部分）
for i in range(3, 10):
    print(f'line {i+1}: carry={carry} | {repr(lines[i][:120])}')
    # 逐字符计
    in_str = False
    j = 0
    while j < len(lines[i]):
        ch = lines[i][j]
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
    print(f'  -> carry now: {carry}')
