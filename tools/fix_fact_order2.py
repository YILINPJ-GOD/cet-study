# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\js\data\gen_templates.js'
lines = io.open(p, encoding='utf-8').read().split('\n')

# 找出所有 "  ]," 后紧跟 "{ s:" 的地方，交换它们
fixed = 0
i = 0
result = []
while i < len(lines):
    l = lines[i]
    stripped = l.strip()
    result.append(l)

    if stripped == '],':
        # 看下一行
        if i + 1 < len(lines) and lines[i+1].strip().startswith('{ s:'):
            # 收集所有 { s: 行直到非 { s: 行
            j = i + 1
            fact_lines = []
            while j < len(lines) and (lines[j].strip().startswith('{ s:') or lines[j].strip().startswith('{s:')):
                fact_lines.append(lines[j])
                j += 1
            # 把 ], 移到 fact_lines 后面
            result.pop()  # 移除 ], 
            for fl in fact_lines:
                result.append(fl)
            result.append('  ],')
            fixed += 1
            i = j
            continue
    i += 1

io.open(p, 'w', encoding='utf-8').write('\n'.join(result))
print(f'fixed {fixed} instances')
