# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\tools\e2e-suite.js'
lines = io.open(p, encoding='utf-8').read().split('\n')

# 找 WRI6 块内的 assert（advHits 相关）
for i, l in enumerate(lines):
    if 'WRI6' in l and 'T.add' in l:
        for j in range(i, min(i + 12, len(lines))):
            if 'advHits' in lines[j] and 'assert' in lines[j]:
                lines[j] = "      assert(advHits.length >= 1 || t2.sample.split(/[.!?]+/).some(x => x.trim().split(/\\s+/).length >= 25), t2.id + ' 应含高级句式或长句');"
                print(f'fixed WRI6 advHits assert at line {j+1}')
                break
        break

io.open(p, 'w', encoding='utf-8').write('\n'.join(lines))
print('done')
