# -*- coding: utf-8 -*-
import io

t = io.open(r'D:\六级APP\js\data\gen_templates.js', encoding='utf-8').read()
idx = t.find('culture: {')
nexts = [t.find(x + ': {', idx + 10) for x in ['tech', 'env', 'edu', 'health', 'society'] if t.find(x + ': {', idx + 10) > idx]
end = min(nexts) if nexts else len(t)
blk = t[idx:end]
lines = blk.split('\n')
for i, l in enumerate(lines):
    stripped = l.strip()
    if stripped.startswith('{ s:') or stripped == '],':
        print(f'L{i+1}: {repr(l[:80])}')
