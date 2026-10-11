# -*- coding: utf-8 -*-
# 找到 culture 主题中 Volunteers 附近的原始文件内容（含精确换行）
import io

p = r'D:\六级APP\js\data\gen_templates.js'
t = io.open(p, encoding='utf-8').read()

# 找 Volunteers 附近
idx = t.find('Volunteers record')
# 打印前后 500 字符，转义显示
seg = t[idx-100:idx+300]
print(repr(seg))
