# -*- coding: utf-8 -*-
# 最终修复：将 L31 和 L32 的 orphan fact 条目移到 L33 的 ], 之前
import io

p = r'D:\六级APP\js\data\gen_templates.js'
lines = io.open(p, encoding='utf-8').read().split('\n')

# 找到 culture 主题的 "  ]," 后跟 "{ s:" 的位置
# 模式是：
# ... { s:"Volunteers..." },
#   { s:"Enthusiasts..." },   ← 这是正确的
#   { s:"Digital platforms..." }, ← 这也是正确的
#   ],                        ← 关闭 fact 数组
# stance: ...                ← 但如果新加的 fact 被放在 ], 后面就有问题

# 让我重新扫描整个文件，找出所有 "  ]," 后跟 "  { s:" 或 "    { s:" 的位置
# 并将这些 { s: 行移到 "  ]," 的前面

fixed = 0
i = 0
result = []
while i < len(lines):
    l = lines[i]
    stripped = l.strip()

    if stripped == '],':
        # 看后续行是否有 { s: 开头的行
        orphan_start = None
        orphan_end = None
        j = i + 1
        while j < len(lines):
            ns = lines[j].strip()
            if ns.startswith('{ s:') or ns.startswith('{s:'):
                if orphan_start is None:
                    orphan_start = j
                orphan_end = j
            elif ns == '],':
                # 遇到另一个 ],，停止
                break
            elif ns.startswith('stance') or ns.startswith('twPool') or ns.startswith('sentiment') or ns.startswith('  label'):
                break
            else:
                break
            j += 1

        if orphan_start is not None:
            # 将 orphan fact 行移到 ], 之前
            for k in range(orphan_start, orphan_end + 1):
                result.append(lines[k])
            result.append('  ],')
            fixed += 1
            i = orphan_end + 1
            continue

    result.append(l)
    i += 1

io.open(p, 'w', encoding='utf-8').write('\n'.join(result))
print(f'fixed {fixed} orphan fact blocks')
