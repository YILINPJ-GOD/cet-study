# -*- coding: utf-8 -*-
# 问题找到了！Volunteers 后面的条目之间缺少逗号
# "Large young audiences" } 和 { s:"Enthusiasts..." 之间缺少 ,
# 同样 Enthusiasts 条目和 Digital platforms 条目之间也缺少逗号

import io

p = r'D:\六级APP\js\data\gen_templates.js'
t = io.open(p, encoding='utf-8').read()

# 找所有 " } \n    { " 模式（缺逗号的条目分隔）并替换为 " },\n    { "
import re

# 模式： } 后跟换行+空格+{ 但中间没有逗号
fixes = 0
lines = t.split('\n')
result = []
for i, l in enumerate(lines):
    stripped = l.strip()
    # 如果当前行以 } 结尾且不以 }, 结尾，且下一行以 { s: 开头
    if stripped.endswith('}') and not stripped.endswith('},') and not stripped.endswith('"]'):
        # 检查下一行
        if i + 1 < len(lines):
            next_stripped = lines[i+1].strip()
            if next_stripped.startswith('{ s:'):
                # 缺逗号！
                lines[i] = l.rstrip() + ','
                fixes += 1

io.open(p, 'w', encoding='utf-8').write('\n'.join(lines))
print(f'added {fixes} missing commas')
