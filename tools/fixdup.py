# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\js\data\gen_templates.js'
lines = io.open(p, encoding='utf-8').read().split('\n')

# 找连续两个 ], 的地方并删除多余的那个
result = []
prev_was_bracket = False
removed = 0
for i, l in enumerate(lines):
    stripped = l.strip()
    is_bracket = (stripped == '],')
    if is_bracket and prev_was_bracket:
        removed += 1
        continue  # 跳过重复的 ], 
    result.append(l)
    prev_was_bracket = is_bracket

io.open(p, 'w', encoding='utf-8').write('\n'.join(result))
print(f'removed {removed} duplicate brackets')
