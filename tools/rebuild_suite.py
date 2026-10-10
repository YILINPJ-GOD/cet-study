# -*- coding: utf-8 -*-
# 重建 e2e-suite.js（从当前文件提取有效用例，去掉损坏结构）
import io, re

p = r'D:\六级APP\tools\e2e-suite.js'
src = io.open(p, encoding='utf-8').read()

# 提取所有 T.add 调用（含函数体，到下一个 T.add 或 IIFE 结束）
cases = []
for m in re.finditer(r"T\.add\('([^']+)',\s*(.*?)\)\);\s*(?=T\.add|forEach|window\.__E2E|$)", src, re.S):
    name, body = m.group(1), m.group(2)
    cases.append((name, body))

print(f'提取到 {len(cases)} 个用例')
for name, _ in cases:
    print(f'  {name}')

# 重建套件
header = '''/* ===== E2E 测试套件 ===== */
window.__E2E = {
  cases: [],
  results: [],
  add(name, fn) { this.cases.push({ name, fn }); },
  reset() {
    try { App._noSave = true; App.save = function(){}; App._saveNow = function(){}; } catch(e) {}
    localStorage.removeItem('cet6app_v1');
  },
  async runOne(idx) {
    const c = this.cases[idx];
    const t0 = Date.now();
    try { await c.fn(); this.results.push({ name: c.name, pass: true, ms: Date.now() - t0 }); }
    catch (e) { this.results.push({ name: c.name, pass: false, msg: String((e && e.message) || e), ms: Date.now() - t0 }); }
    return this.results[this.results.length - 1];
  }
};
(function (T) {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const viewText = () => $('#view').innerText.replace(/\\n+/g, ' | ');
  const assert = (cond, msg) => { if (!cond) throw new Error('断言失败: ' + msg); };
  const H = {
    click(sel) { const el = $(sel); if (!el) throw new Error('找不到元素 ' + sel); el.click(); },
    async answerPlacement() {
      window.__TEST_FAST__ = true;
      for (let i = 0; i < 24; i++) {
        if (viewText().includes('答对') && $('#applyBtn')) break;
        const opts = $$('#view .opt');
        if (!opts.length) break;
        opts[0].click();
        await new Promise(r => setTimeout(r, 40));
      }
      window.__TEST_FAST__ = false;
    },
    async startPlacement(exam) {
      if (App.Views.placement.reset) App.Views.placement.reset();
      App.store.profile.placed = false;
      App.store.profile.exam = exam || 'cet6';
      App.go('placement');
      H.click('#startBtn');
    },
    expectView(name) { assert(App.currentView === name, '当前视图应为 ' + name + '，实际 ' + App.currentView); }
  };
  T.H = H;

  App.speakHook = null;
'''

footer = '''
})(window.__E2E);
'''

body = ''
for name, fn_body in cases:
    body += f"  T.add('{name}', {fn_body});\n"

output = header + '\n' + body + footer
io.open(p, 'w', encoding='utf-8').write(output)
print('rebuilt suite:', len(output), 'bytes,', len(cases), 'cases')
