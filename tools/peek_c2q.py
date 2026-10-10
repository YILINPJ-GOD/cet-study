# -*- coding: utf-8 -*-
# 查看 c2 questions:[ 之后的完整内容直到 c3
import io
t = io.open(r'D:\六级APP\js\data\reading_careful.js', encoding='utf-8').read()
i = t.find('id:"c2"')
q = t.find('questions:[', i)
j = t.find('id:"c3"')
print(t[q:j][:2600])
