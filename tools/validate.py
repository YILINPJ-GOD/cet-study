# -*- coding: utf-8 -*-
"""数据校验：词库格式/去重、题库结构、词典缺口统计"""
import re, io, os, sys, json, collections

BASE = r"D:\六级APP\js\data"
problems = []

# ---------- 1. 词库 ----------
word_re = re.compile(r'\["([^"]+)","([^"]*)","([^"]*)","([^"]*)",(\d)\]')
all_words = {}
per_file = {}
for fn in ["words/basic-1.js","words/basic-2.js","words/core-1.js","words/core-2.js","words/adv-1.js","words/adv-2.js"]:
    path = os.path.join(BASE, fn)
    text = io.open(path, encoding="utf-8").read()
    entries = word_re.findall(text)
    per_file[fn] = len(entries)
    for w, ipa, pos, gloss, lv in entries:
        if w in all_words:
            problems.append(f"重复词: {w} (in {fn}, first in {all_words[w][0]})")
        else:
            all_words[w] = (fn, ipa, pos, gloss, lv)
        if not ipa: problems.append(f"缺音标: {w}")
        if not gloss: problems.append(f"缺释义: {w}")
        if '"' in gloss or '\\' in gloss: problems.append(f"释义含非法字符: {w}")
        if int(lv) not in (1,2,3): problems.append(f"档位错误: {w}")
        # 音标只应含 IPA/常见符号
        if re.search(r'[^əɑæʌɛɪʊɔaouiːɪːeəɪʊuʊɜɔɑæʌŋŋʃʒθðɹjwpbfvmntdszklghrtʃdʒeɪaɪɔɪaʊoʊˌˈˈ\.ɚːr-]', ipa):
            problems.append(f"音标可疑字符: {w} -> {ipa}")

total = len(all_words)
print("== 词库 ==")
for fn, n in per_file.items(): print(f"  {fn}: {n}")
print(f"  合计去重后: {total}")

# ---------- 2. 阅读题库 ----------
def read(fn): return io.open(os.path.join(BASE, fn), encoding="utf-8").read()

print("== 阅读 ==")
rc = read("reading_careful.js")
n_sets = len(re.findall(r'\{id:"c\d"', rc))
n_q = len(re.findall(r'\{q:"', rc))
answers = [int(a) for a in re.findall(r',a:(\d),', rc)]
bad_ans = [a for a in answers if a not in (0,1,2,3)]
print(f"  careful: {n_sets} 套, {n_q} 题, 答案分布 {collections.Counter(answers)}")
if n_sets != 3: problems.append("careful 套数!=3")
if n_q != 15: problems.append("careful 题数!=15")
if bad_ans: problems.append(f"careful 非法答案索引 {bad_ans}")

rm = read("reading_matching.js")
n_sets_m = len(re.findall(r'\{id:"m\d"', rm))
n_items = len(re.findall(r'\{stmt:"', rm))
m_ans = re.findall(r',a:"([A-Z])"', rm)
paras = re.findall(r'\["([A-I])",', rm)
print(f"  matching: {n_sets_m} 套, {n_items} 题, 答案 {m_ans}, 段落数 {len(paras)}")
if n_sets_m != 3: problems.append("matching 套数!=3")
if n_items != 15: problems.append("matching 题数!=15")
if any(a not in set(paras) for a in m_ans): problems.append("matching 答案段落不存在")

rk = read("reading_cloze.js")
n_sets_k = len(re.findall(r'\{id:"k\d"', rk))
opt_lists = re.findall(r'options:\[([^\]]+)\]', rk)
a_lists = re.findall(r'a:\[([\d,]+)\]', rk)
print(f"  cloze: {n_sets_k} 套, 选项组 {len(opt_lists)}, 答案组 {len(a_lists)}")
for i, (o, a) in enumerate(zip(opt_lists, a_lists)):
    opts = re.findall(r'"([^"]+)"', o)
    idxs = [int(x) for x in a.split(",")]
    if len(opts) != 15: problems.append(f"cloze第{i+1}套选项数={len(opts)}")
    if len(idxs) != 10: problems.append(f"cloze第{i+1}套答案数={len(idxs)}")
    if any(x >= len(opts) for x in idxs): problems.append(f"cloze第{i+1}套答案越界")
    if len(set(idxs)) != 10: problems.append(f"cloze第{i+1}套答案重复")
texts_k = re.findall(r'text:"(.*?)"(?:,options|\})', rk, re.S)
for i, t in enumerate(texts_k):
    holes = re.findall(r'\{(\d+)\}', t)
    if sorted(int(h) for h in holes) != list(range(1,11)):
        problems.append(f"cloze第{i+1}篇占位符异常: {sorted(holes)}")

# ---------- 3. 写作 / 翻译 ----------
wt = read("writing_data.js")
n_topics = len(re.findall(r'\{id:"w\d"', wt))
n_tpl = len(re.findall(r'\{name:"', wt))
n_sent = len(re.findall(r'\{pat:"', wt))
print(f"== 写作 == 话题 {n_topics}, 模板 {n_tpl}, 句式 {n_sent}")
if n_topics != 8: problems.append("写作话题!=8")

tr = read("translation_data.js")
n_p = len(re.findall(r'\{id:"t\d"', tr))
print(f"== 翻译 == {n_p} 篇")
if n_p != 9: problems.append("翻译篇数!=9")
# 每篇 keys 中的 en 是否出现在 ref 中（宽松：词形还原后）
def lemmas(s):
    s = re.sub(r'[^a-zA-Z\s]', ' ', s.lower())
    out = []
    for w in s.split():
        if w.endswith('ies') and len(w)>4: w = w[:-3]+'y'
        elif w.endswith('s') and not w.endswith('ss'): w = w[:-1]
        if w.endswith('ing') and len(w)>5: out.append(w[:-3])
        if w.endswith('ed') and len(w)>4: out.append(w[:-2])
        out.append(w)
    return set(out)
tr_blocks = re.split(r'\{id:"t\d"', tr)[1:]
for i, blk in enumerate(tr_blocks):
    m_ref = re.search(r'ref:"(.*?)",keys', blk, re.S)
    m_keys = re.findall(r'\{zh:"([^"]+)",en:"([^"]+)"\}', blk)
    if not m_ref:
        problems.append(f"翻译第{i+1}篇 ref 缺失"); continue
    ref_l = lemmas(m_ref.group(1))
    miss = [k[1] for k in m_keys if not lemmas(k[1]).issubset(ref_l)]
    if miss: problems.append(f"翻译第{i+1}篇 keys 未命中参考译文: {miss}")
    if len(m_keys) < 8: problems.append(f"翻译第{i+1}篇 keys 少于8条")

# ---------- 4. 例句 ----------
ex = read("examples.js")
pairs = re.findall(r'\n([a-z]+):\["([^"]*)","([^"]*)"\]', ex)
print(f"== 例句 == {len(pairs)} 条")
bad_ex = [w for w, en, cn in pairs if not en or not cn]
if bad_ex: problems.append(f"例句缺内容: {bad_ex}")

# ---------- 5. 词典缺口（阅读/写作/翻译英文内容 vs 词库+例句+EXTRA） ----------
extra = read("extra_dict.js")
extra_words = set(re.findall(r'^"([^"]+)":\[', extra, re.M))
known = set(all_words.keys()) | extra_words | set(w for w,_,_ in pairs) | set("deter".split())
irreg = set("went gone better best worse worst more most less least felt thought taught brought took taken made wrote written said saw seen grew grown knew known gave given found told held kept left met paid ran won spoke spent understood wore children men women feet teeth people".split())

def eng_words(s):
    return re.findall(r"[A-Za-z][A-Za-z'-]*", s)

content = ""
for fn in ["reading_careful.js","reading_matching.js","reading_cloze.js","writing_data.js"]:
    content += read(fn)
content += read("translation_data.js")
# 只取英文文本：粗略排除 keys 的 zh 字段不影响（只找英文词）
missing = collections.Counter()
cap_only = collections.Counter()
lowers = set()
for w in eng_words(content):
    lw = w.lower().strip("-'")
    if lw in known or lw in irreg: continue
    lw2 = lw
    for suf in ("'s",):
        if lw2.endswith(suf): lw2 = lw2[:-2]
    if lw2 in known: continue
    base = lw2
    if base.endswith('ies') and len(base)>4: base = base[:-3]+'y'
    elif base.endswith('ses') or base.endswith('xes'): base = base[:-2]
    elif base.endswith('s') and not base.endswith('ss'): base = base[:-1]
    if base.endswith('ing') and len(base)>5: base = base[:-3]
    elif base.endswith('ed') and len(base)>4: base = base[:-2]
    if base in known: continue
    missing[lw] += 1
    if w[0].isupper(): cap_only[lw] += 1

print(f"== 词典缺口 == {len(missing)} 个未收录词形（含屈折/专名）")
json.dump(missing.most_common(500), io.open(r"D:\六级APP\tools\missing_words.json","w",encoding="utf-8"), ensure_ascii=False, indent=0)

print("== 问题 ==")
if problems:
    for p in problems[:60]: print("  ❌", p)
    if len(problems) > 60: print(f"  ...共 {len(problems)} 条")
else:
    print("  ✅ 全部通过")
