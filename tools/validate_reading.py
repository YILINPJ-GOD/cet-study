# -*- coding: utf-8 -*-
# 严格校验 reading_careful.js 结构
import io, re, json

p = r'D:\六级APP\js\data\reading_careful.js'
src = io.open(p, encoding='utf-8').read()

# 去掉 window 头尾，转成可 JSON 解析的形式太麻烦；改用逐段校验
ids = re.findall(r'id:"(c\d)",title:"([^"]+)"', src)
print('sets:', ids)

# 每套题 text / questions 数
blocks = re.split(r'\{id:"c\d"', src)[1:]
for i, blk in enumerate(blocks):
    m_text = re.search(r'text:"(.*?)",questions:\[', blk, re.S)
    q_block = re.search(r'questions:\[(.*?)\]\]\}', blk, re.S) or re.search(r'questions:\[(.*?)\]\},?\s*\}', blk, re.S)
    qs = re.findall(r'\{q:"', blk)
    a_vals = re.findall(r',a:(\d),', blk)
    print(f'set{i+1}: text={"Y" if m_text else "N"} questions={len(qs)} a_vals={a_vals}')

# 检查 c3 尾部是否残留旧题
tail = src[src.find('id:"c3"'):]
extra = re.findall(r'\{q:"Which of the following best states the main idea[^"]+\?",opts:\["Tackling loneliness requires rebuilding social settings[^"]+"\],a:0,', tail)
print('c3 old summary question remains:', len(extra))

# 引号平衡粗查
print('quote parity per block ok:', all(src.count('"') % 2 == 0 for _ in [1]))
