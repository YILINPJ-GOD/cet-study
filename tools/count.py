# -*- coding: utf-8 -*-
import io, re
tot = 0
for f in ['basic-1','basic-2','core-1','core-2','adv-1','adv-2']:
    t = io.open(r'D:\六级APP\js\data\words\%s.js' % f, encoding='utf-8').read()
    n = len(re.findall(r'^\["', t, re.M))
    tot += n
    print(f, n)
print('total lines', tot)
