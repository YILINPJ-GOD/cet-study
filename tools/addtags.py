# -*- coding: utf-8 -*-
import io
p = r'D:\六级APP\index.html'
t = io.open(p, encoding='utf-8').read()
a = '<script src="js/audio-db.js?v=18"></script>'
if 'retstore.js' not in t:
    t = t.replace(a, a + '\n<script src="js/retstore.js?v=18"></script>')
b = '<script src="js/views/mock.js?v=18"></script>'
if 'realexam.js' not in t:
    t = t.replace(b, b + '\n<script src="js/views/realexam.js?v=18"></script>')
io.open(p, 'w', encoding='utf-8').write(t)
print('retstore:', 'retstore.js' in t, '| realexam:', 'realexam.js' in t)
