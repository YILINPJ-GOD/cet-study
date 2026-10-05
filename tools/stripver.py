# -*- coding: utf-8 -*-
import io, re
p = r'D:\六级APP\index.html'
t = io.open(p, encoding='utf-8').read()
t2 = re.sub(r'\?v=\d+"', '"', t)
io.open(p, 'w', encoding='utf-8').write(t2)
print('remaining version tags:', len(re.findall(r'\?v=', t2)))
