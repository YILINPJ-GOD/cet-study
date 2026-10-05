# -*- coding: utf-8 -*-
import io
p = r'D:\六级APP\js\data\roots.js'
t = io.open(p, encoding='utf-8').read()
old = '{r:"tors/tort",m:"扭",ex:[["distort","歪曲","dis(离开)+tort(扭)→扭偏"],["retort","反驳","re(回)+tort(扭)→扭回话"],["contort","扭曲","con(加强)+tort(扭)→扭在一起"]]},\n'
assert t.count(old) == 1, f'count={t.count(old)}'
t = t.replace(old, '', 1)
io.open(p, 'w', encoding='utf-8').write(t)
print('removed old tors entry; remaining tors:', t.count('{r:"tors'))
