# -*- coding: utf-8 -*-
import io
p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()
old = """    App.importBackup(toFile(ok), () => {});
    await new Promise(r => setTimeout(r, 60));"""
new = """    App.importBackup(toFile(ok), () => {});
    for (let w = 0; w < 40 && !toasts.some(x => x.includes('导入成功')); w++) await new Promise(r => setTimeout(r, 30));"""
assert old in t, 'anchor missing'
t = t.replace(old, new, 1)
io.open(p, 'w', encoding='utf-8').write(t)
print('fixed')
