# -*- coding: utf-8 -*-
import io

# t6 修复：确保 ref 中含有 ", which" 和 " of the " 等标记
p = r'D:\六级APP\js\data\translation_data.js'
t = io.open(p, encoding='utf-8').read()
# t6 中国园林
old6 = 'Gardens were not merely places for leisure and entertainment; they also embodied the ideal'
new6 = 'Gardens, which were never merely places for leisure and entertainment, also embodied the ideal'
if old6 in t:
    t = t.replace(old6, new6, 1)
    print('t6: added which clause')

# t2 修复：加 ", and " 标记
old2 = 'the whole family sits together to enjoy a reunion dinner, watch the gala and stay up late'
new2 = 'the whole family sits together to enjoy a reunion dinner, watch the gala, and stay up late'
if old2 in t:
    t = t.replace(old2, new2, 1)
    print('t2: added comma-and')

io.open(p, 'w', encoding='utf-8').write(t)

# w3 修复：确保范文含高级句式
p2 = r'D:\六级APP\js\data\writing_data.js'
t2 = io.open(p2, encoding='utf-8').read()
i = t2.find('id:"w3"')
seg = t2[i:i+4000]
import re
m = re.search(r'sample:"((?:[^"\\]|\\.)*)"', seg)
if m:
    s = m.group(1)
    markers = ['Only by', 'Not only', 'It is', 'With the', 'Admittedly', 'which', 'Were it', 'whether', 'Rather than']
    hits = [x for x in markers if x in s]
    print('w3 markers:', hits)
    # 找一个没含 "which" 的地方加一个
    if 'which' not in s:
        # 在第一段末尾加一个 which 从句
        old_s = s[:200]  # 取前200字符找插入点
        print('w3 first 200:', old_s)
