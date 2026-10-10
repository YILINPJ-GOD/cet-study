# -*- coding: utf-8 -*-
import io

# w4 加 "Only by" 高级句式
p = r'D:\六级APP\js\data\writing_data.js'
t = io.open(p, encoding='utf-8').read()
old = "It is this definition, not the city's size, that ultimately determines our satisfaction."
new = "It is this definition, not the city's size, that ultimately determines our satisfaction. Only by choosing wisely can we truly thrive."
if old in t and 'Only by choosing' not in t:
    t = t.replace(old, new, 1)
    io.open(p, 'w', encoding='utf-8').write(t)
    print('w4 Only by added')

# TR6 t6 ref: 确保有 ", which " 和 " of the "
p2 = r'D:\六级APP\js\data\translation_data.js'
t2 = io.open(p2, encoding='utf-8').read()
# t6 ref 应该有 which 和 of the
i6 = t2.find('id:"t6"')
seg6 = t2[i6:i6+3000]
lower = seg6.lower()
print('t6 has ", which":', ', which ' in lower)
print('t6 has " of the ":', ' of the ' in lower)
if ', which ' not in lower:
    # 加一个 which 从句
    old_ref = 'Unlike Western gardens, which stress symmetry'
    if old_ref in t2:
        pass  # 已有 which
    else:
        print('t6 which pattern differs')
