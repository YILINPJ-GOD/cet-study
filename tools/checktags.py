# -*- coding: utf-8 -*-
import io, re
t = io.open(r'D:\六级APP\index.html', encoding='utf-8').read()
print('gen_templates tag:', 'gen_templates' in t)
print('gen.js tag:', 'js/gen.js' in t)
print('roots tag:', 'roots.js' in t)
print('sentences tag:', 'translation_sentences' in t)
print('phrases tag:', 'placement_phrases' in t)
print('real_exam tag:', 'real_exam_links' in t)
# 列出所有 data script
tags = re.findall(r'src="(js/data/[^"]+)"', t)
print('data scripts:', len(tags))
for tag in tags:
    print(' ', tag)
