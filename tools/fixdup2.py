# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\js\data\gen_templates.js'
t = io.open(p, encoding='utf-8').read()
lines = t.split('\n')

# 找到每对重复的 ], 并只保留一个
result = []
prev_close = False
for i, l in enumerate(lines):
    stripped = l.strip()
    is_close = (stripped == '],')
    if is_close and prev_close:
        print(f'removing duplicate ], at line {i+1}')
        continue  # skip
    result.append(l)
    prev_close = is_close

t2 = '\n'.join(result)
# 检查是否仍有问题
# 验证 GEN_THEMES 赋值后的花括号计数
start = t2.find('window.GEN_THEMES')
if start >= 0:
    brace_start = t2.find('{', start)
    depth = 0
    end = brace_start
    for j in range(brace_start, len(t2)):
        if t2[j] == '{': depth += 1
        elif t2[j] == '}':
            depth -= 1
            if depth == 0: end = j; break
    obj = t2[brace_start:end+1]
    # 检查 obj 中每个主题
    import re
    for theme in ['tech', 'env', 'edu', 'health', 'society', 'culture']:
        idx = obj.find(theme + ': {')
        nexts = [obj.find(x + ': {', idx + 10) for x in ['tech', 'env', 'edu', 'health', 'society', 'culture'] if x != theme]
        nexts = [x for x in nexts if x > idx]
        end_t = min(nexts) if nexts else len(obj)
        blk = obj[idx:end_t]
        facts = blk.count('{ s:')
        print(f'{theme}: {facts} facts')

io.open(p, 'w', encoding='utf-8').write(t2)
print('saved')
