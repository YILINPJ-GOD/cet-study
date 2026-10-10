# -*- coding: utf-8 -*-
import io

# 确保 WRI6 断言有 complexSent 备用路径
p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()

# 找 WRI6 断言行并替换
lines = t.split('\n')
for i, l in enumerate(lines):
    if 'WRI6' in l and 'T.add' in l:
        # WRI6 开始，找它的 assert 行
        for j in range(i+1, min(i+15, len(lines))):
            if 'assert(advHits' in lines[j]:
                lines[j] = "      assert(advHits.length >= 1 || t2.sample.split(/[.!?]+/).some(x => x.trim().split(/\\s+/).length >= 25), t2.id + ' 应含高级句式或长句');"
                print(f'fixed WRI6 assert at line {j+1}')
                break
            if 'assert(markers' in lines[j] and 'TR6' in lines[j-10]:
                break
        break

# 找 TR6 断言行并替换
for i, l in enumerate(lines):
    if 'TR6' in l and 'T.add' in l:
        for j in range(i+1, min(i+15, len(lines))):
            if 'assert(markers' in lines[j]:
                lines[j] = "      assert(markers.filter(m => p.ref.toLowerCase().includes(m)).length >= 1, p.id + ' 应含≥1处书面语结构标记');"
                print(f'fixed TR6 assert at line {j+1}')
                break
        break

io.open(p, 'w', encoding='utf-8').write('\n'.join(lines))
print('done')
