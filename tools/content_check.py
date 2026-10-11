# -*- coding: utf-8 -*-
"""最终内容校验 v1.8.1"""
import io, re

ok = True

# 1. 仔细阅读难度
src = io.open(r'D:\六级APP\js\data\reading_careful.js', encoding='utf-8').read()
texts = re.findall(r'text:"(.*?)",questions', src, re.S)
for i, x in enumerate(texts):
    real = x.encode().decode('unicode_escape')
    words = len(re.findall(r'[A-Za-z]+', real))
    paras = real.count('\n\n') + 1
    sents = [s for s in re.split(r'(?<=[.!?])\s+', real) if len(s) > 20]
    avg = words // max(1, len(sents))
    status = '✓' if words >= 350 and avg >= 18 and paras >= 4 else '✗'
    print(f'{status} RD{i+1}: words={words} avgSent={avg} paras={paras}')
    if status == '✗': ok = False

# 2. 听力六级
src2 = io.open(r'D:\六级APP\js\data\listening_cet6.js', encoding='utf-8').read()
for sid in ['c5','c6','p5','p6','l1','l2']:
    blk = src2[src2.find(f'id:"{sid}"'):src2.find(']', src2.find(f'id:"{sid}"'))]
    ens = re.findall(r'en:"(.*?)"', blk)
    long_w = sum(1 for w in ' '.join(ens).split() if len(w) >= 10)
    status = '✓' if long_w >= 8 else '✗'
    print(f'{status} LS-{sid}: longWords={long_w}')
    if status == '✗': ok = False

# 3. 写作
src3 = io.open(r'D:\六级APP\js\data\writing_data.js', encoding='utf-8').read()
markers = ['Only by', 'Not only', 'It is', 'With the', 'Admittedly', 'which', 'whether', 'Rather than']
for wid in re.findall(r'id:"(w\d)"', src3):
    i = src3.find(f'id:"{wid}"')
    sm = re.search(r'sample:"(.*?)"', src3[i:i+6000], re.S)
    if not sm: continue
    sample = sm.group(1).replace('\\n', ' ')
    wc = len(sample.split())
    hits = [m for m in markers if m in sample]
    long_sent = any(len(s.split()) >= 22 for s in re.split(r'[.!?]+', sample))
    status = '✓' if 140 <= wc <= 230 and (len(hits) >= 1 or long_sent) else '✗'
    print(f'{status} {wid}: words={wc} markers={len(hits)} longSent={long_sent}')
    if status == '✗': ok = False

# 4. 翻译
src4 = io.open(r'D:\六级APP\js\data\translation_data.js', encoding='utf-8').read()
struct = [', which ', ', making ', ' has been ', ' are being ', ' with a ', ' by the ', ' to be ', ', and ', ' of the ', ' in the ']
for tid in re.findall(r'id:"(t\d)"', src4):
    i = src4.find(f'id:"{tid}"')
    rm = re.search(r'ref:"(.*?)"', src4[i:i+4000], re.S)
    if not rm: continue
    ref = rm.group(1).lower()
    wc = len(ref.split())
    hits = sum(1 for m in struct if m in ref)
    status = '✓' if wc >= 80 and hits >= 1 else '✗'
    print(f'{status} TR-{tid}: words={wc} structHits={hits}')
    if status == '✗': ok = False

print(f'\n总体: {"✅ 全部达标" if ok else "❌ 有不达标项"}')
