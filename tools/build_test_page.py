# -*- coding: utf-8 -*-
"""最终全量回归：读套件源码，注入后分三阶段跑 64 例"""
import http.server, threading, functools, os, json, urllib.request

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=r'D:\六级APP')
handler_class = type('H', (handler,), {
    'end_headers': lambda self: (self.send_header('Cache-Control', 'no-store'),
                                  self.send_header('Pragma', 'no-cache'),
                                  super(type(self), self).end_headers())
})
httpd = http.server.TCPServer(('127.0.0.1', 8766), handler_class)
threading.Thread(target=httpd.serve_forever, daemon=True).start()
print('server on 8766')

suite = io.open(r'D:\六级APP\tools\e2e-suite.js', encoding='utf-8').read()

# 输出注入用 HTML
html = f'''<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
<script src="js/data/words/basic-1.js"></script>
<script src="js/data/words/basic-2.js"></script>
<script src="js/data/words/core-1.js"></script>
<script src="js/data/words/core-2.js"></script>
<script src="js/data/words/adv-1.js"></script>
<script src="js/data/words/adv-2.js"></script>
<script src="js/data/words/sense-overrides.js"></script>
<script src="js/data/words/bank-t4h.js"></script>
<script src="js/data/words/bank-t4s.js"></script>
<script src="js/data/words/bank-t6h2.js"></script>
<script src="js/data/words/bank-zt.js"></script>
<script src="js/data/words/bank-tl.js"></script>
<script src="js/data/examples.js"></script>
<script src="js/data/examples2.js"></script>
<script src="js/data/reading_careful.js"></script>
<script src="js/data/reading_matching.js"></script>
<script src="js/data/reading_cloze.js"></script>
<script src="js/data/writing_data.js"></script>
<script src="js/data/translation_data.js"></script>
<script src="js/data/listening_cet4.js"></script>
<script src="js/data/listening_cet6.js"></script>
<script src="js/data/listening_loc.js"></script>
<script src="js/data/placement_phrases.js"></script>
<script src="js/data/real_exam_links.js"></script>
<script src="js/data/extra_dict.js"></script>
<script>window.READING_CAREFUL_EXTRA=[];window.READING_MATCHING_EXTRA=[];window.READING_CLOZE_EXTRA=[];</script>
<script src="js/util.js"></script>
<script src="js/storage.js"></script>
<script src="js/srs.js"></script>
<script src="js/grader.js"></script>
<script src="js/charts.js"></script>
<script src="js/gen.js"></script>
<script src="js/audio-db.js"></script>
<script src="js/retstore.js"></script>
<script src="js/dict.js"></script>
<script>App._noSave = true; localStorage.removeItem('cet6app_v1');</script>
<script>{json.dumps(suite)}</script>
</body></html>'''

out = 'D:\\六级APP\\tools\\test_page.html'
io.open(out, 'w', encoding='utf-8').write(html)
print('test page written:', len(html))
