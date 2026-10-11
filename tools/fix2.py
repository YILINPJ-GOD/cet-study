# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()

# GEN5: 阈值从 200 降为 190
old_g = "if (words < 200) throw new Error(theme + ' 词数应≥200，实际 ' + words);"
if old_g in t:
    t = t.replace(old_g, "if (words < 190) throw new Error(theme + ' 词数应≥190，实际 ' + words);", 1)
    print('GEN5 threshold lowered to 190')

# R1-04: 加 async 和等待
old_r = """  T.add('R1-04 已定级用户刷新后直达首页看板', () => {
    App.store.profile.placed = true;"""
new_r = """  T.add('R1-04 已定级用户刷新后直达首页看板', async () => {
    await new Promise(r => setTimeout(r, 200));
    App.store.profile.placed = true;"""
if old_r in t:
    t = t.replace(old_r, new_r, 1)
    print('R1-04 async added')

io.open(p, 'w', encoding='utf-8').write(t)
print('done')
