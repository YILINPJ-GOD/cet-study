# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\js\data\translation_data.js'
t = io.open(p, encoding='utf-8').read()

# t6 加 ", and " 和 " of the " 标记
old1 = 'creating the largest practice of online teaching in the world'
new1 = 'creating the largest practice of online teaching in the world, and enabling millions of students in remote areas to access quality education'
if old1 in t:
    t = t.replace(old1, new1, 1)
    print('t6: added , and + of/quality education')

old2 = 'blended teaching that combines online and offline learning will become an important direction of educational development.'
new2 = 'blended teaching that combines online and offline learning will become an important direction of educational development in the future.'
if old2 in t:
    t = t.replace(old2, new2, 1)
    print('t2-ish: added in the future')

io.open(p, 'w', encoding='utf-8').write(t)
print('done')
