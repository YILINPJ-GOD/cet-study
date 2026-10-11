# -*- coding: utf-8 -*-
# 精确修复：在每个主题的 stance: 行之前，将新加的 fact 条目移到 ], 之前
import io, re

p = r'D:\六级APP\js\data\gen_templates.js'
lines = io.open(p, encoding='utf-8').read().split('\n')

result = []
i = 0
while i < len(lines):
    l = lines[i]
    stripped = l.strip()

    # 检测 stance 行
    if stripped.startswith('stance:') and i > 0:
        # 向前扫描，收集所有属于 fact 数组但在 ], 之后的 { s: 行
        # 并把它们移到 ], 之前
        orphan_facts = []
        j = i - 1
        while j >= 0:
            prev_stripped = lines[j].strip()
            if prev_stripped.startswith('{ s:'):
                orphan_facts.insert(0, lines[j])
                j -= 1
            elif prev_stripped == '],':
                # 找到了 ], 关闭符
                # 移除 orphan_facts 并重新排列
                # 从 result 中删除已经添加的 orphan 和 ],
                while result and result[-1].strip() == '],':
                    result.pop()
                # 重新添加
                for of in orphan_facts:
                    result.append(of)
                result.append('  ],')
                break
            elif prev_stripped.startswith('}') or prev_stripped.startswith('"'):
                # fact 数组还没关闭，继续向上
                orphan_facts.insert(0, lines[j])
                j -= 1
            else:
                break
        # 重置 i 到正确的位置
        i = j + 1 if j >= 0 else i
        continue

    result.append(l)
    i += 1

io.open(p, 'w', encoding='utf-8').write('\n'.join(result))
print('done')
