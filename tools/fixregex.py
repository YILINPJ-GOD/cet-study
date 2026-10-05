# -*- coding: utf-8 -*-
import io
p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()
old = '/^https:\\\\/\\/\\//'
print('bad count:', t.count(old))
if t.count(old):
    t = t.replace(old, '/^https:\\/\\//')
    io.open(p, 'w', encoding='utf-8').write(t)
    print('fixed')
else:
    print('checking alt pattern...')
    old2 = '/^https:\\\\\\/\\\\\\//'
    print('alt count:', t.count(old2))
