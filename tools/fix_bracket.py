# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\js\data\gen_templates.js'
t = io.open(p, encoding='utf-8').read()

# 找到 stance 行前面缺少 fact 数组闭合 ] 的地方
# 每个主题的 fact 数组应该以 ],\n 结尾然后才是 stance:
# 我们的新 fact 条目直接被插入在 stance: 前面，但没有加 ] 来关闭 fact 数组
lines = t.split('\n')
fixed = False
for i, l in enumerate(lines):
    stripped = l.strip()
    if stripped.startswith('stance:') and i > 0:
        prev = lines[i-1].strip()
        # 上一个条目是 fact 数组的一部分（以 } 或 ,结尾）
        # 需要在 stance: 之前插入 ] 来关闭 fact 数组
        if prev.endswith('},') and '  { s:' in prev or 'a:"' in prev:
            # 检查 fact 数组是否已经关闭
            # 找上一个 ] 的位置
            if '],\n' not in lines[i-1] and not lines[i-1].strip().startswith(']'):
                # fact 数组没有关闭！
                lines[i-1] = lines[i-1].rstrip() + '\n  ],'
                fixed = True
                print(f'added ] before stance at line {i+1}')

if fixed:
    io.open(p, 'w', encoding='utf-8').write('\n'.join(lines))
    print('fixed')
else:
    print('no fix needed')
