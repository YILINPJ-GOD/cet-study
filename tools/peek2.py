# -*- coding: utf-8 -*-
import io, re
t = io.open(r'D:\六级APP\js\data\reading_careful.js', encoding='utf-8').read()
texts = re.findall(r'text:"(.*?)",questions', t, re.S)
out = io.open(r'D:\六级APP\tools\careful.txt', 'w', encoding='utf-8')
for i, x in enumerate(texts):
    sents = re.split(r'(?<=[.!?]) (?=[A-Z])', x)
    out.write('=== set %d sentences %d\n' % (i + 1, len(sents)))
    for j, s in enumerate(sents):
        out.write('%d %s\n' % (j, s[:72]))
out.close()
print('written')
