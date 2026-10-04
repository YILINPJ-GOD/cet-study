# -*- coding: utf-8 -*-
"""只提取英文正文（字符串值），排除功能词后统计词典真实缺口"""
import io, re, os, collections, json

BASE = r"D:\六级APP\js\data"
word_re = re.compile(r'\["([^"]+)","([^"]*)","([^"]*)","([^"]*)",(\d)\]')
known = set()
for f in ["basic-1","basic-2","core-1","core-2","adv-1","adv-2"]:
    t = io.open(os.path.join(BASE, "words", f + ".js"), encoding="utf-8").read()
    for w, *_ in word_re.findall(t): known.add(w.lower())
ex = io.open(os.path.join(BASE, "examples.js"), encoding="utf-8").read()
for w, _, _ in re.findall(r'\n([a-z]+):\["([^"]*)","([^"]*)"\]', ex): known.add(w)
exd = io.open(os.path.join(BASE, "extra_dict.js"), encoding="utf-8").read()
for w in re.findall(r'"([a-z\-\']+)"\s*:\s*\[', exd): known.add(w)

STOP = set(('a an the and or but of to in on at for with by from as is are was were be been being am do does did have has had will would can could may might must shall should this that these those it its there here not no nor so than then too very s t d ll re ve m o y our your my his her their we you they he she i us them me him if when while which who whom whose what where why how all any both each few more most other some such only own same upon into over under about after before between during through against above below up down out off again further once also just now yet ever never still already almost quite rather too thus hence therefore however moreover furthermore nevertheless meanwhile instead otherwise besides indeed perhaps maybe certainly obviously generally usually often sometimes always never seldom rarely today tomorrow yesterday one two three four five six seven eight nine ten first second third next last other another every each per less least much many lot lots plenty enough half quarter percent hundred thousand million billion zero'.split()))
IRREG = set("went gone better best worse worst more most less least felt thought taught brought took taken made wrote written said saw seen grew grown knew known gave given found told held kept left met paid ran won spoke spent understood wore children men women feet teeth people".split())

def cands(w):
    c = [w]
    def push(x):
        if x and len(x) >= 2 and x not in c: c.append(x)
    if len(w) <= 3: return c
    if w.endswith('ies') and len(w) > 4: push(w[:-3] + 'y')
    if w.endswith(('sses', 'shes', 'ches', 'xes')): push(w[:-2])
    elif w.endswith('s') and not w.endswith(('ss', 'us', 'is')): push(w[:-1])
    if w.endswith('ied') and len(w) > 4: push(w[:-3] + 'y')
    if w.endswith('ed'):
        push(w[:-1]); push(w[:-2])
        b = w[:-2]
        if len(b) >= 3 and b[-1] == b[-2]: push(b[:-1])
    if w.endswith('ing'):
        push(w[:-3] + 'e'); push(w[:-3])
        b = w[:-3]
        if len(b) >= 3 and b[-1] == b[-2]: push(b[:-1])
    if w.endswith('ly') and len(w) > 4: push(w[:-2])
    if w.endswith('er') and len(w) > 4: push(w[:-1]); push(w[:-2])
    if w.endswith('est') and len(w) > 5: push(w[:-3] + 'y'); push(w[:-3])
    return c

# 只提取像英文的字符串值
STR = re.findall(r'"([^"\n]{3,})"', "")
content = ""
for f in ["reading_careful.js", "reading_matching.js", "reading_cloze.js", "writing_data.js", "translation_data.js"]:
    t = io.open(os.path.join(BASE, f), encoding="utf-8").read()
    for s in re.findall(r'"([^"\n]+)"', t):
        # 英文判定：无中文，字母占比高
        if re.search(r'[\u4e00-\u9fff]', s): continue
        letters = len(re.findall(r'[A-Za-z]', s))
        if letters < max(3, len(s) * 0.55): continue
        if re.fullmatch(r'[a-z0-9_\- ]{1,12}', s.strip()) and ' ' not in s.strip():
            # 可能是短键值如 w1 / c1 / t7，跳过
            if re.fullmatch(r'[a-z]\d|cid|[a-z]{1,3}', s.strip()): continue
        content += " " + s

raw = re.findall(r"[A-Za-z][A-Za-z'-]*", content)
freq = collections.Counter(); capform = collections.Counter()
for w in raw:
    lw = w.lower().strip("-'")
    if not lw: continue
    freq[lw] += 1
    if w[0].isupper(): capform[lw] += 1

missing = collections.Counter()
for lw, n in freq.items():
    if lw in known or lw in IRREG or lw in STOP: continue
    if len(lw) <= 2: continue
    if any(c in known for c in cands(lw)): continue
    if capform[lw] >= n * 0.8: continue
    missing[lw] = n

out = missing.most_common(600)
print("正文真实缺口:", len(missing))
for w, n in out: print(f"{w}\t{n}")
json.dump(out, io.open(r"D:\六级APP\tools\missing_words.json", "w", encoding="utf-8"), ensure_ascii=False)
