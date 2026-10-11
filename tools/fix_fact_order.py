# -*- coding: utf-8 -*-
import io, re

p = r'D:\六级APP\js\data\gen_templates.js'
t = io.open(p, encoding='utf-8').read()
lines = t.split('\n')

# 找到所有 "  ]," 后紧跟 "    { s:" 的模式（fact 被放到了数组外面）
# 并把这些 fact 条目移到 ], 之前
fixed_lines = []
skip_until_bracket = False
i = 0
while i < len(lines):
    l = lines[i]
    stripped = l.strip()

    # 如果当前行是 "  ],"（fact 数组关闭）
    if stripped == '],':
        fixed_lines.append(l)
        i += 1
        # 检查下一行是否是 fact 条目（{ s:" 开头）—— 这是被错误地放在数组外的
        while i < len(lines) and lines[i].strip().startswith('{ s:'):
            # 这行应该移到 ], 之前
            # 从 fixed_lines 中删除最后的 ], 并把 ], 放在这行后面
            last_bracket_idx = len(fixed_lines) - 1
            # 插入 fact 条目
            fixed_lines.append(lines[i])
            fixed_lines.append('  ],')
            # 删除原来位置的 ], 
            fixed_lines.pop(last_bracket_idx)
            i += 1
        continue

    fixed_lines.append(l)
    i += 1

io.open(p, 'w', encoding='utf-8').write('\n'.join(fixed_lines))
print('fixed', len(lines) - len(fixed_lines), 'lines changed')
