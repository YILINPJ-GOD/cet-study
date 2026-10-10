# -*- coding: utf-8 -*-
import io

# 1. w3 范文加 "Only by" 高级句式
p = r'D:\六级APP\js\data\writing_data.js'
t = io.open(p, encoding='utf-8').read()
old_w3 = 'and a society of responsible individuals is one in which everyone, including ourselves, ultimately thrives.'
new_w3 = 'and a society of responsible individuals is one in which everyone, including ourselves, ultimately thrives. Only by looking beyond ourselves can we truly flourish.'
if old_w3 in t and 'Only by looking beyond' not in t:
    t = t.replace(old_w3, new_w3, 1)
    io.open(p, 'w', encoding='utf-8').write(t)
    print('w3 fixed')

# 2. t6 参考译文加 " of the " 标记
p2 = r'D:\六级APP\js\data\translation_data.js'
t2 = io.open(p2, encoding='utf-8').read()
old_t6 = 'the ideal of ancient scholars to get close to nature'
new_t6 = 'the ideal of the ancient scholars to get close to nature'
if old_t6 in t2:
    t2 = t2.replace(old_t6, new_t6, 1)
    io.open(p2, 'w', encoding='utf-8').write(t2)
    print('t6 fixed')
