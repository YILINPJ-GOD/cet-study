# -*- coding: utf-8 -*-
import io
p = r'D:\六级APP\js\gen.js'
t = io.open(p, encoding='utf-8').read()
# 检查 makeCareful 中的 fact 切片数
i = t.find('makeCareful')
seg = t[i:i+3000]
print(seg[:2000])
