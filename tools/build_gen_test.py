# -*- coding: utf-8 -*-
# 用完全不同的方法验证：直接构建一个仅包含 gen_templates.js 的页面
import io

gt = io.open(r'D:\六级APP\js\data\gen_templates.js', encoding='utf-8').read()

html = f'''<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>
<script>
window.__errs = [];
window.addEventListener('error', function(e) {{
  window.__errs.push({{msg: e.message, line: e.lineno, col: e.colno}});
}});
</script>
<script>
{gt}
</script>
<script>
document.title = 'THEMES:' + Object.keys(window.GEN_THEMES).length +
  '|TECH_FACTS:' + window.GEN_THEMES.tech.fact.length;
</script>
</body></html>'''

io.open(r'D:\六级APP\tools\gen_test.html', 'w', encoding='utf-8').write(html)
print('written', len(html))
