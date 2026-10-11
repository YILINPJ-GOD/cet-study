# -*- coding: utf-8 -*-
# 升级 gen.js 的 makeCareful 生成器：从 3 段扩为 5 段，句子密度对标六级
import io

p = r'D:\六级APP\js\gen.js'
t = io.open(p, encoding='utf-8').read()

# 1. 修改 makeCareful 中的段落组装逻辑：从取 6 个 fact 改为取 10 个，组装 5 段
old_assemble = """    const facts = shuffle(r, theme.fact).slice(0, 6);
    const f0 = fill(facts[0].s, nps, r).text;
    const f1 = fill(facts[1].s, nps, r).text;
    const f2 = fill(facts[2].s, nps, r).text;
    const f3 = fill(facts[3].s, nps, r).text;
    const f4 = fill(facts[4].s, nps, r).text;
    const f5 = fill(facts[5].s, nps, r).text;"""
new_assemble = """    const facts = shuffle(r, theme.fact).slice(0, 10);
    const f = facts.map(x => fill(x.s, nps, r).text);"""
assert old_assemble in t, 'assemble anchor missing'
t = t.replace(old_assemble, new_assemble, 1)

# 2. 替换段落组装：从 3 段改为 5 段
old_text = """    const text = [
      intro1 + " " + intro2 + " " + f0,
      f1 + " " + sent1 + " " + f2 + " " + f3,
      sent2 + " " + f4 + " " + f5 + " " + stance
    ].join("\\n\\n");"""
new_text = """    const text = [
      intro1 + " " + intro2 + " " + f[0],
      f[1] + " " + f[2] + " " + sent1,
      f[3] + " " + f[4],
      f[5] + " " + f[6] + " " + sent2,
      f[7] + " " + (f[8] || "") + " " + f[9] + " " + stance
    ].filter(s => s.trim().length > 20).join("\\n\\n");"""
assert old_text in t, 'text anchor missing'
t = t.replace(old_text, new_text, 1)

# 3. 扩大事实题池：从 8 个模板扩到使用所有模板（确保有足够的 fact 模板）
io.open(p, 'w', encoding='utf-8').write(t)
print('makeCareful upgraded to 5-paragraph')
