# -*- coding: utf-8 -*-
import urllib.request, time
for i in range(5):
    try:
        r = urllib.request.urlopen('http://127.0.0.1:8765/index.html', timeout=8)
        print('srv:', r.status)
        break
    except Exception as e:
        print('retry', i, e)
        time.sleep(3)
