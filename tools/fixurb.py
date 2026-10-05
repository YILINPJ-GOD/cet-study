# -*- coding: utf-8 -*-
import io
p = r'D:\六级APP\js\data\roots.js'
t = io.open(p, encoding='utf-8').read()
lines = t.split('\n')
print('LINE95 full:', repr(lines[94]))
# 修复：确保以 ]}, 结尾
if not lines[94].rstrip('\r').endswith(']},'):
    base = lines[94].rstrip('\r').rstrip()
    if base.endswith(']]'):
        lines[94] = base + '},\r'
        print('fixed to ]},')
    elif base.endswith(']'):
        lines[94] = base + '},\r'
        print('fixed to ]}, (from ])')
t = '\n'.join(lines)
io.open(p, 'w', encoding='utf-8').write(t)
print('saved')
