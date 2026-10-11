# -*- coding: utf-8 -*-
import io

t = io.open(r'D:\六级APP\js\data\gen_templates.js', encoding='utf-8').read()
lines = t.split('\n')
for i in range(20, 30):
    if i < len(lines):
        print(f'L{i+1}: {repr(lines[i][:100])}')
