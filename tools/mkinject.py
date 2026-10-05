# -*- coding: utf-8 -*-
# 生成单行注入脚本（避免引号/正则转义问题）
script = """(async () => {
  const src = await (await fetch('tools/e2e-suite.js?v=' + Date.now())).text();
  const fn = new Function(src);
  fn.call(window);
  return (window.__E2E && window.__E2E.cases) ? window.__E2E.cases.length : -1;
})()"""
io_open = open(r'D:\六级APP\tools\inject.txt', 'w', encoding='utf-8')
io_open.write(script)
io_open.close()
print('written')
