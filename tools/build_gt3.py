# -*- coding: utf-8 -*-
import io

gt = io.open(r'D:\六级APP\js\data\gen_templates.js', encoding='utf-8').read()
gt = gt.replace('\r\n', '\n').replace('\r', '\n')

html = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>\n'
html += '<script>\nwindow.__errs = [];\nwindow.addEventListener("error", function(e) { window.__errs.push(e.message + " L" + e.lineno); });\n</script>\n'
html += '<script>\n' + gt + '\n</script>\n'
html += '<script>\ntry { document.title = "THEMES:" + Object.keys(window.GEN_THEMES).length; } catch(e) { document.title = "ERR:" + e.message; }\n</script>\n</body></html>'

io.open(r'D:\六级APP\tools\gen_test.html', 'w', encoding='utf-8').write(html)
print('written')
