# -*- coding: utf-8 -*-
# 用 Node.js 语法检查 gen_templates.js
# 尝试通过浏览器 fetch + new Function
import io, os

# 先手动检查：生成一个精简版确认问题所在
t = io.open(r'D:\六级APP\js\data\gen_templates.js', encoding='utf-8').read()

# 检查是否有尾随逗号在最后一个属性后
import re
# 找 culture 主题结尾到文件尾
last_theme = t.rfind('culture:')
file_end = t[last_theme:]
# 检查最后一个 } 前是否有逗号
tail = file_end[-100:]
print('file tail:', repr(tail))

# 检查是否有 "stance:" 后缺少 "twPool:" 的情况
for theme in ['tech', 'env', 'edu', 'health', 'society', 'culture']:
    idx = t.find(theme + ': {')
    if idx < 0:
        print(theme, 'NOT FOUND')
        continue
    # 找该主题的结束
    next_themes = [t.find(x + ': {', idx + 1) for x in ['tech', 'env', 'edu', 'health', 'society', 'culture'] if x != theme]
    next_themes = [x for x in next_themes if x > idx]
    end = min(next_themes) if next_themes else len(t)
    blk = t[idx:end]
    has_sentiment = 'sentiment' in blk
    has_twPool = 'twPool' in blk
    has_nps = 'nps' in blk
    has_fact = 'fact' in blk
    has_intro = 'intro' in blk
    has_stance = 'stance' in blk
    missing = []
    if not has_nps: missing.append('nps')
    if not has_fact: missing.append('fact')
    if not has_intro: missing.append('intro')
    if not has_stance: missing.append('stance')
    if not has_twPool: missing.append('twPool')
    if not has_sentiment: missing.append('sentiment')
    if missing:
        print(theme, 'MISSING:', missing)
    else:
        print(theme, 'OK')
