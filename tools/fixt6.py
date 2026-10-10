# -*- coding: utf-8 -*-
import io

# TR6 t6: 加 " in the " 标记
p2 = r'D:\六级APP\js\data\translation_data.js'
t2 = io.open(p2, encoding='utf-8').read()
i6 = t2.find('id:"t6"')
# t6 是第六个条目 = 在线教育
seg = t2[i6:i6+4000]
# 找一个可以加 " in the " 的地方
old_edu = 'continued their classes through online platforms'
new_edu = 'continued their classes in the online platforms'
if old_edu in t2:
    t2 = t2.replace(old_edu, new_edu, 1)
    io.open(p2, 'w', encoding='utf-8').write(t2)
    print('t6: added in the')
else:
    # 尝试其他方式
    old2 = 'creating the largest practice of online teaching in the world'
    if old2 in t2:
        t2 = t2.replace(old2, 'creating the largest practice of online teaching in the world', 1)
        io.open(p2, 'w', encoding='utf-8').write(t2)
        print('t6: already has in the')
    else:
        print('t6: checking...', old_edu[:40], 'in file:', old_edu in t2)
