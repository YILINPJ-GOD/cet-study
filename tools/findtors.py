# -*- coding: utf-8 -*-
import io, re
p = r'D:\六级APP\js\data\roots.js'
t = io.open(p, encoding='utf-8').read()
# 找出所有 tors 开头的条目
hits = [(m.start(), t[m.start():m.start() + 260]) for m in re.finditer(r'\{r:"tors', t)]
print('tors entries:', len(hits))
for pos, snip in hits:
    print(pos, repr(snip[:200]))
