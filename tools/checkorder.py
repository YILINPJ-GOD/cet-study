# -*- coding: utf-8 -*-
import io, re

# 直接检查 index.html 中 gen_templates 的 script 标签位置
# 是否在 gen.js 之前
t = io.open(r'D:\六级APP\index.html', encoding='utf-8').read()
pos_gt = t.find('js/data/gen_templates.js')
pos_gj = t.find('js/gen.js')
pos_util = t.find('js/util.js')
pos_root = t.find('js/data/roots.js')
pos_rc = t.find('js/data/reading_careful.js')

print('gen_templates pos:', pos_gt)
print('gen.js pos:', pos_gj)
print('util.js pos:', pos_util)
print('roots.js pos:', pos_root)
print('reading_careful pos:', pos_rc)

# 检查 gen_templates.js 在 gen.js 之前
if pos_gt < pos_gj:
    print('OK: gen_templates before gen.js')
else:
    print('ERROR: gen_templates AFTER gen.js!')

# 检查是否有重复 script 标签
count = t.count('gen_templates')
print('gen_templates mentions:', count)
