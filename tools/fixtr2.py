# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\js\data\translation_data.js'
t = io.open(p, encoding='utf-8').read()

# t6 加 " in the "
old6 = 'The classical gardens of Suzhou are outstanding examples and have been inscribed'
new6 = 'The classical gardens in the city of Suzhou are outstanding examples and have been inscribed'
if old6 in t:
    t = t.replace(old6, new6, 1)
    print('t6: added in the')

# t7 加 ", and " + " of the "
old7 = 'people can complete a payment simply by scanning a QR code with their phones.'
new7 = 'people can complete a payment simply by scanning a QR code on their phones.'
if old7 in t:
    t = t.replace(old7, new7, 1)
    print('t7: simplified QR sentence')
old7b = 'and hundreds of millions of rural residents have moved to cities to work and live.'
if old7b not in t:
    # t7 是移动支付，改用其他方式
    old7c = 'It has not only brought convenience to consumers'
    if old7c in t:
        pass  # 已有 not only 标记

# t9 加 ", and "
old9 = 'from self-driving cars to smart factories, AI is going deep into every industry.'
new9 = 'from self-driving cars to smart factories, AI is going deep into every industry, and its influence continues to expand.'
if old9 in t:
    t = t.replace(old9, new9, 1)
    print('t9: added , and')

io.open(p, 'w', encoding='utf-8').write(t)
print('done')
