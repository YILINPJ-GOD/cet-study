# -*- coding: utf-8 -*-
import io, re
t = io.open(r'D:\六级APP\tools\e2e-suite.js', encoding='utf-8').read()
# 找不在 async 函数内的顶层 await（粗查：行首含 await 且该行不含 async）
for i, line in enumerate(t.split('\n')):
    stripped = line.strip()
    if stripped.startswith('await ') and 'async' not in stripped:
        print(f'TOP-LEVEL AWAIT at line {i+1}: {stripped[:80]}')
# 也检查是否有孤立的 await（不在任何函数内）
# 粗查：找所有 await，看前一行是否是 async
lines = t.split('\n')
for i, l in enumerate(lines):
    if 'await ' in l and 'async' not in l and 'function' not in l and 'T.add' not in l:
        # 检查前 3 行是否有 async
        ctx = '\n'.join(lines[max(0,i-3):i+1])
        if 'async' not in ctx:
            print(f'SUSPICIOUS AWAIT at line {i+1}: {l.strip()[:80]}')
print('done')
