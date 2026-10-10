# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\js\data\translation_data.js'
t = io.open(p, encoding='utf-8').read()

# t7 移动支付：加 ", which" 和 " by the " 标记
old7 = 'It has not only brought convenience to consumers but also helped countless small businesses reduce the cost of collecting money.'
new7 = 'It has not only brought convenience to consumers, but has also helped countless small businesses reduce the cost of collecting money by the simplest of means.'
if old7 in t:
    t = t.replace(old7, new7, 1)
    print('t7: added markers')

# t9 人工智能：加 ", which" 和 " of the " 标记
old9 = 'It has not only raised productivity but also created many unprecedented products and services.'
new9 = 'It has not only raised productivity, which has grown at an unprecedented pace, but also created many unprecedented products and services.'
if old9 in t:
    t = t.replace(old9, new9, 1)
    print('t9: added markers')

io.open(p, 'w', encoding='utf-8').write(t)
print('done')
