# -*- coding: utf-8 -*-
import io
p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()
lines = t.split('\n')
for i, l in enumerate(lines):
    if '/^https:' in l:
        lines[i] = "      assert(L.name && L.url.indexOf('https://') === 0 && L.desc && L.note, '资源 ' + L.name + ' 数据不完整');"
        print('fixed line', i + 1)
        break
io.open(p, 'w', encoding='utf-8').write('\n'.join(lines))
