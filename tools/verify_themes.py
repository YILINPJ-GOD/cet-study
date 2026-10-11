# -*- coding: utf-8 -*-
# 独立验证 gen_templates.js 是否语法正确
import io, re, subprocess, json

t = io.open(r'D:\六级APP\js\data\gen_templates.js', encoding='utf-8').read()

# 模拟 JS 解析：手工检查 window.GEN_THEMES 的赋值
# 提取 window.GEN_THEMES = { ... };  的内容
start = t.find('window.GEN_THEMES')
if start < 0:
    print('ERROR: no GEN_THEMES assignment')
    exit(1)

eq_pos = t.find('=', start)
brace_start = t.find('{', eq_pos)

# 逐字符扫描找到匹配的 }
depth = 0
end_pos = brace_start
for i in range(brace_start, len(t)):
    ch = t[i]
    if ch == '{': depth += 1
    elif ch == '}': depth -= 1
    if depth == 0:
        end_pos = i
        break

obj_str = t[brace_start:end_pos + 1]
print('GEN_THEMES object length:', len(obj_str))

# 检查是否有语法错误：尝试用 Python 的 json 模块（先转成合法 JSON）
# 这不可靠，改用简单检查：每行引号是否平衡
lines = obj_str.split('\n')
for i, l in enumerate(lines):
    dq = l.count('"')
    if dq % 2 != 0 and not l.strip().startswith('//'):
        print(f'ODD QUOTES at obj line {i+1}: {l[:80]}')

# 检查每个主题是否有所有必需字段
themes_found = re.findall(r'(tech|env|edu|health|society|culture):\s*\{', obj_str)
print('themes found:', themes_found)
print('fact count per theme:')
for theme in themes_found:
    # 找该主题的 fact 区域
    theme_start = obj_str.find(theme + ':')
    theme_end = obj_str.find('},', theme_start) + 2
    if theme_end <= theme_start:
        theme_end = theme_start + 1000
    blk = obj_str[theme_start:theme_end]
    facts = len(re.findall(r'\{ s:"', blk))
    print(f'  {theme}: {facts} facts')
