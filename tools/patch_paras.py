# -*- coding: utf-8 -*-
"""在 reading_careful.js 的三篇文章 text 中插入 \\n\\n 分段"""
import io, re

path = r'D:\六级APP\js\data\reading_careful.js'
t = io.open(path, encoding='utf-8').read()

# 每套的分段点：在这些句子（按 . 分句后的序号）前插入换行
BREAKS = {0: [3, 7, 10], 1: [4, 7, 12], 2: [3, 7, 12]}

def add_breaks(text, breaks):
    sents = re.split(r'(?<=[.!?]) (?=[A-Z])', text)
    for b in sorted(breaks, reverse=True):
        if 0 < b < len(sents):
            sents[b] = '\\n\\n' + sents[b]
    return ' '.join(sents)

out = []
idx = 0
pos = 0
for m in re.finditer(r'text:"(.*?)",questions', t, re.S):
    out.append(t[pos:m.start(1)])
    out.append(add_breaks(m.group(1), BREAKS[idx]))
    pos = m.end(1)
    idx += 1
out.append(t[pos:])
new = ''.join(out)
io.open(path, 'w', encoding='utf-8').write(new)

# 校验
texts = re.findall(r'text:"(.*?)",questions', new, re.S)
for i, x in enumerate(texts):
    print('set', i + 1, 'paras', x.count('\\n\\n') + 1)
