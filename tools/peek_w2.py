# -*- coding: utf-8 -*-
import io, re
t = io.open(r'D:\六级APP\js\data\writing_data.js', encoding='utf-8').read()
i = t.find('id:"w2"')
seg = t[i:i+3000]
m = re.search(r'sample:"((?:[^"\\]|\\.)*)"', seg, re.S)
if m:
    s = m.group(1)
    ws = s.split()
    print('w2 sample words:', len(ws))
    print('tail:', repr(s[-180:]))
    for marker in ['Only by', 'Not only', 'It is', 'With the', 'Admittedly', 'which', 'Were it', 'whether']:
        if marker in s:
            print('HAS:', marker)
