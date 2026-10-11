# -*- coding: utf-8 -*-
import io, re

t = io.open(r'D:\六级APP\js\data\gen_templates.js', encoding='utf-8').read()

# 提取 GEN_THEMES 对象
start = t.find('window.GEN_THEMES')
eq_pos = t.find('=', start)
brace_start = t.find('{', eq_pos)
depth = 0
end_pos = brace_start
for i in range(brace_start, len(t)):
    if t[i] == '{': depth += 1
    elif t[i] == '}':
        depth -= 1
        if depth == 0: end_pos = i; break

obj = t[brace_start:end_pos + 1]

# 更准确的 fact 计数
for theme in ['tech', 'env', 'edu', 'health', 'society', 'culture']:
    idx = obj.find(theme + ': {')
    if idx < 0:
        print(theme, 'NOT FOUND'); continue
    # 找到该主题结束（下一个主题开头或对象结尾）
    nexts = [obj.find(x + ': {', idx + 10) for x in ['tech', 'env', 'edu', 'health', 'society', 'culture'] if x != theme]
    nexts = [x for x in nexts if x > idx]
    end = min(nexts) if nexts else len(obj)
    blk = obj[idx:end]
    fact_count = blk.count('{ s:')
    print(theme, 'facts:', fact_count)
