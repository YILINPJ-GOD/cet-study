# -*- coding: utf-8 -*-
# 精确修复 gen_templates.js：将新加的 fact 条目移到正确位置
import io

p = r'D:\六级APP\js\data\gen_templates.js'
lines = io.open(p, encoding='utf-8').read().split('\n')

# 策略：从后往前扫描，找到连续的 fact 行后跟两个 ], 的模式
# 将 fact 行移到第一个 ], 之前

result = []
i = 0
while i < len(lines):
    l = lines[i]
    result.append(l)
    stripped = l.strip()

    # 检测 fact 数组关闭模式：}],\n  ],\n    { s: ... \n  ],
    if stripped == '],':
        # 检查下一行和下下行
        if i + 2 < len(lines):
            next1 = lines[i+1].strip()
            next2 = lines[i+2].strip() if i + 2 < len(lines) else ''
            # 模式：], 后面跟 { s: 行，然后又是 ], 
            if next1.startswith('{ s:') and next2 == '],':
                # 将 next1 的 fact 条目移到 ], 之前
                fact_line = lines[i+1]
                # 移除已经添加的 ], 
                result.pop()
                # 添加 fact 行
                result.append(fact_line)
                # 添加 ], 
                result.append('  ],')
                i += 3  # 跳过 ], 和 fact 行
                continue
    i += 1

io.open(p, 'w', encoding='utf-8').write('\n'.join(result))
print(f'fixed, old lines: {len(lines)}, new lines: {len(result)}')
