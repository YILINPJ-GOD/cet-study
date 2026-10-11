# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\tools\e2e-suite.js'
t = io.open(p, encoding='utf-8').read()

# 更新 PL-01 断言：短语题从 4→6，句子题从 4→6
old = """    assert(kinds.includes('phrase'), '应包含短语题');
    assert(kinds.includes('sent'), '应包含句子语境题');
    assert(kinds.filter(k => k === 'word').length >= 10, '单词题应占主体');
    assert((window.PLACEMENT_PHRASES || []).length >= 40, '短语库应≥40条');"""
new = """    assert(kinds.includes('phrase'), '应包含短语题');
    assert(kinds.includes('sent'), '应包含句子语境题');
    assert(kinds.filter(k => k === 'word').length >= 6, '单词题应≥6题');
    assert(kinds.filter(k => k === 'phrase').length >= 4, '短语题应≥4题');
    assert(kinds.filter(k => k === 'sent').length >= 4, '句子语境题应≥4题');
    assert((window.PLACEMENT_PHRASES || []).length >= 75, '短语库应≥75条');"""
assert old in t, 'PL-01 anchor missing'
t = t.replace(old, new, 1)

io.open(p, 'w', encoding='utf-8').write(t)
print('PL-01 updated')
