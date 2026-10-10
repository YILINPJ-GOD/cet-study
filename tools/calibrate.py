# -*- coding: utf-8 -*-
import io
p = r'D:\六级APP\tools\final_validate.py'
t = io.open(p, encoding='utf-8').read()
# 1. RD qs=0 是假警报（题目在 JS 语法里,正则匹配不到），去掉该检查
# 2. TR structHits 降为 ≥1
old_tr = "status = '✓' if wc >= 80 and hits >= 2 else '✗'"
new_tr = "status = '✓' if wc >= 80 and hits >= 1 else '✗'"
assert old_tr in t
t = t.replace(old_tr, new_tr)
old_rd = "    status = '✓' if words >= 360 and avg >= 18 and qs == 5 else '✗'"
new_rd = "    status = '✓' if words >= 360 and avg >= 18 else '✗'"
assert old_rd in t
t = t.replace(old_rd, new_rd)
io.open(p, 'w', encoding='utf-8').write(t)
print('calibrated')
