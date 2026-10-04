# -*- coding: utf-8 -*-
import io, re
import collections
p = r'D:\六级APP\index.html'
t = io.open(p, encoding='utf-8').read()
t2 = re.sub(r'\?v=\d+"', '?v=6"', t)
io.open(p, 'w', encoding='utf-8').write(t2)
print(collections.Counter(re.findall(r'\?v=(\d+)', t2)))
