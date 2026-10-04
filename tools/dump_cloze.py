# -*- coding: utf-8 -*-
import io
t = io.open(r'D:\六级APP\js\views\reading.js', encoding='utf-8').read()
i = t.find('render_cloze')
io.open(r'D:\六级APP\tools\cloze.txt', 'w', encoding='utf-8').write(t[i:i+2400])
print('ok', i)
