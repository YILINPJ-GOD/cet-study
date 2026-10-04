# -*- coding: utf-8 -*-
import io, re, os
pat = re.compile(r'App\.LV\[[^\]]*\]\.full|WORDS_L[123]')
hits = 0
for root, _, files in os.walk(r'D:\六级APP\js'):
    for f in files:
        if not f.endswith('.js'):
            continue
        p = os.path.join(root, f)
        t = io.open(p, encoding='utf-8').read()
        for m in pat.finditer(t):
            hits += 1
            print(p, m.group(0))
print('hits', hits)
