# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()

# 找 RV-01 替换等待时序
old1 = """    start2.click();
    await new Promise(r => setTimeout(r, 200));
    const card = document.querySelector('#cardBox .flashcard');
    if (!card) throw new Error('no flashcard rendered');"""
new1 = """    start2.click();
    await new Promise(r => setTimeout(r, 500));
    const card = document.querySelector('#cardBox .flashcard');
    if (!card) {
      const txt = document.querySelector('#vBody') ? document.querySelector('#vBody').innerText.slice(0, 200) : 'no vBody';
      throw new Error('no flashcard after start. vBody: ' + txt);
    }"""
assert old1 in t, 'RV-01 anchor missing'
t = t.replace(old1, new1, 1)

# RV-03 同样加等待
old3 = """    start.click();
    const card = document.querySelector('#cardBox .flashcard');
    if (!card) throw new Error('no card rendered');"""
new3 = """    start.click();
    await new Promise(r => setTimeout(r, 500));
    const card = document.querySelector('#cardBox .flashcard');
    if (!card) {
      const txt = document.querySelector('#vBody') ? document.querySelector('#vBody').innerText.slice(0, 200) : 'no vBody';
      throw new Error('no card after start. vBody: ' + txt);
    }"""
assert old3 in t, 'RV-03 anchor missing'
t = t.replace(old3, new3, 1)

io.open(p, 'w', encoding='utf-8').write(t)
print('timing fixed')
