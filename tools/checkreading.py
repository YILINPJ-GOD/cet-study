# -*- coding: utf-8 -*-
# 语法检查 + 词数统计（不经浏览器）
import io, re, json

p = r'D:\六级APP\js\data\reading_careful.js'
src = io.open(p, encoding='utf-8').read()

# 用 JS 语法快速检查：node 不可用，用括号配对粗查
print('len:', len(src))
print('ids:', re.findall(r'id:"(c\d)"', src))
print('questions count per set:', [len(re.findall(r'\{q:"', blk)) for blk in src.split('questions:[')[1:]])

# 手工解析 text 词数
texts = re.findall(r'text:"(.*?)",questions', src, re.S)
for i, x in enumerate(texts):
    real = x.encode().decode('unicode_escape')
    words = len(re.findall(r'[A-Za-z]+(?:[\'-][A-Za-z]+)*', real))
    paras = real.count('\n\n') + 1
    sents = [s for s in re.split(r'(?<=[.!?])\s+', real) if len(s) > 10]
    print(f'set{i+1}: words={words} paras={paras} sents={len(sents)} avg={words//max(1,len(sents))}')
