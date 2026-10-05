# -*- coding: utf-8 -*-
"""为 index.html 的本地资源统一设置版本号：python tools\ver.py 15"""
import io, re, sys
p = r'D:\六级APP\index.html'
v = sys.argv[1] if len(sys.argv) > 1 else '15'
t = io.open(p, encoding='utf-8').read()
t = re.sub(r'(src="|href=")([^?"]+\.css|[^?"]+\.js|[^?"]+\.webmanifest)(\?v=\d+)?"',
           lambda m: m.group(1) + m.group(2) + '?v=' + v + '"', t)
io.open(p, 'w', encoding='utf-8').write(t)
print('v' + v, 'tags:', len(re.findall(r'\?v=' + v, t)))
