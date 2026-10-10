# -*- coding: utf-8 -*-
import io
t = io.open(r'D:\六级APP\js\data\reading_careful.js', encoding='utf-8').read()
i = t.find('id:"c2"')
q = t.find('questions:[', i)
j = t.find('id:"c3"')
seg = t[q:j]
print('c2 q segment len:', len(seg))
print(repr(seg[:600]))
print('...')
print(repr(seg[-400:]))
