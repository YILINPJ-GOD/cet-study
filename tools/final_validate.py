# -*- coding: utf-8 -*-
"""v1.8.0 内容校验（不经浏览器，直接解析 JS 数据文件）"""
import io, re, sys

ok = True

# 1. reading_careful.js
src = io.open(r'D:\六级APP\js\data\reading_careful.js', encoding='utf-8').read()
try:
    compile(src, 'reading_careful.js', 'exec')
except SyntaxError as e:
    # JS 不是 Python，改用简单检查
    pass
words_all = re.findall(r'text:"(.*?)",questions', src, re.S)
for i, x in enumerate(words_all):
    real = x.encode().decode('unicode_escape')
    words = len(re.findall(r'[A-Za-z]+(?:[\'-][A-Za-z]+)*', real))
    paras = real.count('\n\n') + 1
    sents = [s for s in re.split(r'(?<=[.!?])\s+', real) if len(s) > 20]
    avg = words // max(1, len(sents))
    qs = len(re.findall(r'\{q:"', x))
    status = '✓' if words >= 360 and avg >= 18 else '✗'
    print(f'{status} RD{i+1}: words={words} avgSent={avg} paras={paras} qs={qs}')
    if status == '✗': ok = False

# 2. listening_cet6.js
src2 = io.open(r'D:\六级APP\js\data\listening_cet6.js', encoding='utf-8').read()
for sid in ['c5','c6','p5','p6','l1','l2']:
    blk = src2[src2.find(f'id:"{sid}"'):src2.find(']', src2.find(f'id:"{sid}"'))]
    ens = re.findall(r'en:"(.*?)"', blk)
    long_w = sum(1 for w in ' '.join(ens).split() if len(w) >= 10)
    status = '✓' if long_w >= 8 and len(ens) >= 10 else '✗'
    print(f'{status} LS-{sid}: sents={len(ens)} longWords={long_w}')
    if status == '✗': ok = False

# 3. writing_data.js
src3 = io.open(r'D:\六级APP\js\data\writing_data.js', encoding='utf-8').read()
markers = ['Only by', 'Not only', 'It is', 'With the', 'Admittedly', 'which', 'whether', 'Rather than', 'were it']
for wid in re.findall(r'id:"(w\d)"', src3):
    i = src3.find(f'id:"{wid}"')
    seg = src3[i:i+5000]
    sm = re.search(r'sample:"(.*?)"', seg, re.S)
    if not sm: continue
    sample = sm.group(1).replace('\\n', ' ')
    wc = len(sample.split())
    hits = [m for m in markers if m in sample]
    has_long = any(len(s.split()) >= 22 for s in re.split(r'[.!?]+', sample))
    status = '✓' if 140 <= wc <= 230 and (len(hits) >= 2 or has_long) else '✗'
    print(f'{status} {wid}: words={wc} markers={len(hits)} longSent={has_long}')
    if status == '✗': ok = False

# 4. translation_data.js
src4 = io.open(r'D:\六级APP\js\data\translation_data.js', encoding='utf-8').read()
struct = [', which ', ', making ', ' has been ', ' are being ', ' with a ', ' by the ', ' to be ', ', and ', ' of the ', ' in the ']
for tid in re.findall(r'id:"(t\d)"', src4):
    i = src4.find(f'id:"{tid}"')
    rm = re.search(r'ref:"(.*?)"', src4[i:i+3000], re.S)
    if not rm: continue
    ref = rm.group(1).lower()
    wc = len(ref.split())
    hits = sum(1 for m in struct if m in ref)
    status = '✓' if wc >= 80 and hits >= 1 else '✗'
    print(f'{status} TR-{tid}: words={wc} structHits={hits}')
    if status == '✗': ok = False

print(f'\n{"="*40}')
print('总体:', '✅ 全部达标' if ok else '❌ 有不达标项')
sys.exit(0 if ok else 1)
