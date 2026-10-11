# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\js\data\writing_data.js'
t = io.open(p, encoding='utf-8').read()
# w3 社会现象与责任：在尾段加 "Only by" 句式
old = 'a society of responsible individuals is one in which everyone, including ourselves, ultimately thrives.'
new = 'a society of responsible individuals is one in which everyone, including ourselves, ultimately thrives. Only by looking beyond our own interests can we truly flourish.'
if old in t and 'Only by looking beyond' not in t:
    t = t.replace(old, new, 1)
    io.open(p, 'w', encoding='utf-8').write(t)
    print('w3 Only by added')
