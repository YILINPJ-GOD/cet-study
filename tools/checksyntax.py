# -*- coding: utf-8 -*-
# 逐行二分定位 gen_templates.js 的语法错误
import io, re

p = r'D:\六级APP\js\data\gen_templates.js'
t = io.open(p, encoding='utf-8').read()

# 检查新加的 fact 条目周围是否有语法问题
# 找所有 "  { s:" 开头的行前面是否有上一个条目的闭合 },
lines = t.split('\n')
for i, l in enumerate(lines):
    stripped = l.strip()
    if stripped.startswith('{ s:"') and i > 0:
        prev = lines[i-1].strip()
        # 上一个条目应该以 },或 ] 结尾
        if not prev.endswith('},') and not prev.endswith('],') and not prev.endswith('[,') and not prev.endswith(',') and not prev.endswith('['):
            print(f'PROBLEM at line {i+1}: prev ends with {repr(prev[-20:])}')
            print(f'  prev: {prev[:80]}')
            print(f'  curr: {stripped[:80]}')

# 检查 stance 前最后一个 fact 条目后面是否缺了闭合
for theme in ['tech', 'env', 'edu', 'health', 'society', 'culture']:
    idx = t.find(theme + ': {')
    stance_pos = t.find('stance:', idx)
    if stance_pos < 0: continue
    # stance 前面的文本
    before_stance = t[stance_pos-5:stance_pos].strip()
    # stance 前应该有 ],来关闭 fact 数组
    seg_before = t[max(0,stance_pos-200):stance_pos].strip()
    last_line = seg_before.split('\n')[-1].strip() if '\n' in seg_before else seg_before
    if not last_line.endswith('],') and not last_line.endswith('], ') and not last_line.endswith('],\r'):
        print(f'{theme}: line before stance: {repr(last_line[-40:])}')
