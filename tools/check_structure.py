# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\js\data\gen_templates.js'
t = io.open(p, encoding='utf-8').read()

# culture 主题的所有 fact 行都在正确位置了（L11-L20）
# L9 是 nps 的 ],（关闭 nps 数组）
# L21 是 fact 的 ],（关闭 fact 数组）
# 看起来结构是对的！让我验证其他主题

# 但问题可能是 fact 数组关闭 ] 后面缺少 ,逗号（如果还有下一个属性的话）
# 或者 fact 数组前面缺少 fact: [ 开头

# 让我检查 culture 的完整结构
idx = t.find('culture: {')
nexts = [t.find(x + ': {', idx + 10) for x in ['tech', 'env', 'edu', 'health', 'society'] if t.find(x + ': {', idx + 10) > idx]
end = min(nexts) if nexts else len(t)
blk = t[idx:end]
# 找所有行首的 ], 和 fact: [
for i, l in enumerate(blk.split('\n')):
    stripped = l.strip()
    if stripped == 'fact: [' or stripped == '],':
        print(f'L{i+1}: {repr(stripped)}')

# 再检查：fact 数组关闭 ], 后面紧跟的是什么属性？
lines = blk.split('\n')
for i, l in enumerate(lines):
    if l.strip() == '],':
        # 下一非空行是什么？
        for j in range(i+1, min(i+3, len(lines))):
            ns = lines[j].strip()
            if ns:
                print(f'after ], at L{i+1}: next is {repr(ns[:40])}')
                break
