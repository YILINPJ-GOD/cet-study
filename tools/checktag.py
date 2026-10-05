# -*- coding: utf-8 -*-
import io
p = r'D:\六级APP\index.html'
t = io.open(p, encoding='utf-8').read()
print('roots tag:', 'js/data/roots.js?v=17' in t)
print('sent tag:', 'translation_sentences' in t)
if 'translation_sentences' not in t:
    anchor = '<script src="js/data/listening_loc.js?v=17"></script>'
    t = t.replace(anchor, anchor + '\n<script src="js/data/translation_sentences.js?v=17"></script>')
    io.open(p, 'w', encoding='utf-8').write(t)
    print('added now:', 'translation_sentences' in t)
