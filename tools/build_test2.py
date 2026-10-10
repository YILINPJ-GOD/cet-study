# -*- coding: utf-8 -*-
# 构建测试页（外链引用所有 JS）
import io, os

app_dir = r'D:\六级APP'
scripts = [
    'js/data/words/basic-1.js', 'js/data/words/basic-2.js',
    'js/data/words/core-1.js', 'js/data/words/core-2.js',
    'js/data/words/adv-1.js', 'js/data/words/adv-2.js',
    'js/data/words/sense-overrides.js', 'js/data/words/bank-t4h.js',
    'js/data/words/bank-t4s.js', 'js/data/words/bank-t6h2.js',
    'js/data/words/bank-zt.js', 'js/data/words/bank-tl.js',
    'js/data/examples.js', 'js/data/examples2.js',
    'js/data/reading_careful.js', 'js/data/reading_matching.js',
    'js/data/reading_cloze.js', 'js/data/writing_data.js',
    'js/data/translation_data.js', 'js/data/listening_cet4.js',
    'js/data/listening_cet6.js', 'js/data/listening_loc.js',
    'js/data/placement_phrases.js', 'js/data/real_exam_links.js',
    'js/data/extra_dict.js',
    'js/util.js', 'js/storage.js', 'js/srs.js', 'js/grader.js',
    'js/charts.js', 'js/gen.js', 'js/audio-db.js', 'js/retstore.js',
    'js/dict.js',
    'js/views/home.js', 'js/views/welcome.js', 'js/views/placement.js',
    'js/views/vocab.js', 'js/views/listening.js', 'js/views/reading.js',
    'js/views/writing.js', 'js/views/translation.js', 'js/views/mock.js',
    'js/views/wordbook.js', 'js/views/realexam.js', 'js/app.js',
    'tools/e2e-suite.js',
]

html = '<!DOCTYPE html><html><head><meta charset="UTF-8">'
html += '<link rel="stylesheet" href="css/style.css">'
html += '</head><body><div id="view"></div><div id="dictPop"></div><div id="toastBox"></div>'
for s in scripts:
    html += f'<script src="{s}"></script>\n'
html += '<script>App._noSave = true; localStorage.removeItem("cet6app_v1");</script>'
html += '</body></html>'

out = os.path.join(app_dir, 'test_page.html')
io.open(out, 'w', encoding='utf-8').write(html)
print('test page rebuilt with script refs:', len(html))
