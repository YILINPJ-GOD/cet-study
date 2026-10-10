# -*- coding: utf-8 -*-
import io

# 1. w4 范文加 "It is" 高级句式
p = r'D:\六级APP\js\data\writing_data.js'
t = io.open(p, encoding='utf-8').read()
old_w4 = 'Where to start a career matters less than whether the choice matches one\'s own definition of a good life.'
new_w4 = 'Where to start a career matters less than whether the choice matches one\'s own definition of a good life. It is this definition, not the city\'s size, that ultimately determines our satisfaction.'
if old_w4 in t:
    t = t.replace(old_w4, new_w4, 1)
    io.open(p, 'w', encoding='utf-8').write(t)
    print('w4 fixed')

# 2. t6 已在 fixfinal.py 修复（检查确认）
t2 = io.open(r'D:\六级APP\js\data\translation_data.js', encoding='utf-8').read()
print('t6 has "which":', 'which were never' in t2)
print('t6 has " of the ":', ' of the ' in t2.lower())
