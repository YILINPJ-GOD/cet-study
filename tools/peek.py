# -*- coding: utf-8 -*-
import io, re
t = io.open(r'D:\六级APP\js\data\reading_careful.js', encoding='utf-8').read()
texts = re.findall(r'text:"(.*?)",questions', t, re.S)
for i, x in enumerate(texts):
    print('--- set', i + 1, 'len', len(x), 'newline-escapes:', x.count('\\n'))
    print(x[:100])
    print()
