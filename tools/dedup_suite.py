# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()
lines = t.split('\n')

# 删除旧的 WRI6 (line 783 起) 和旧的 TR6 (line 794 起)
# 找到旧 WRI6 块（到下一个 T.add 前的空行）
remove_start = None
for i, l in enumerate(lines):
    if 'WRI6' in l and 'T.add' in l and i < 800:
        remove_start = i
        break

if remove_start is not None:
    # 找这个 T.add 块的结束（下一个 T.add 或 TR6 前）
    remove_end = None
    for j in range(remove_start + 1, len(lines)):
        if 'T.add(' in lines[j] and 'WRI6' not in lines[j]:
            remove_end = j
            break
    if remove_end:
        print(f'removing old WRI6 lines {remove_start+1}-{remove_end}')
        del lines[remove_start:remove_end]

# 同样删除旧 TR6
for i, l in enumerate(lines):
    if 'TR6' in l and 'T.add' in l and '保持六级书面语' in l and '应含≥2处' not in l:
        remove_start = i
        # 找结束
        remove_end = None
        for j in range(remove_start + 1, len(lines)):
            if 'T.add(' in lines[j]:
                remove_end = j
                break
        if remove_end:
            print(f'removing old TR6 lines {remove_start+1}-{remove_end}')
            del lines[remove_start:remove_end]
        break

io.open(p, 'w', encoding='utf-8').write('\n'.join(lines))
print('done, T.add count:', t.count('T.add('))
