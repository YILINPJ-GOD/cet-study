# -*- coding: utf-8 -*-
import io

# w4 加 "which" 从句
p = r'D:\六级APP\js\data\writing_data.js'
t = io.open(p, encoding='utf-8').read()
old = "and a society of responsible individuals is one in which everyone"
new = "and a society of responsible individuals is one in which everyone, regardless of background, can thrive"
if old in t and 'regardless of background' not in t:
    t = t.replace(old, new, 1)
    io.open(p, 'w', encoding='utf-8').write(t)
    print('w4 enhanced')

# t6 加 " has been " 标记
p2 = r'D:\六级APP\js\data\translation_data.js'
t2 = io.open(p2, encoding='utf-8').read()
old2 = 'Chinese gardens enjoy a long history'
new2 = 'Chinese gardens have a history that spans over three thousand years'
if old2 in t2:
    t2 = t2.replace(old2, new2, 1)
    io.open(p2, 'w', encoding='utf-8').write(t2)
    print('t6 ref enhanced')
