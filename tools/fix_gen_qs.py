# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\js\gen.js'
t = io.open(p, encoding='utf-8').read()

# 替换题目组装中的 f0-f5 引用为 f[] 数组
old_qs = """    [[f0, facts[0]], [f1, facts[1]]].forEach(([sen, ft]) => {
      const npForQ = ft.q.includes('{np}') ? (sen.match(/(?:[A-Z][a-z]+ ?){1,3}/) || ['the trend'])[0] : '';
      qs.push({
        q: ft.q.replace(/\\{np\\}/g, npForQ || 'the change'),
        opts: shuffle(r, [ft.a, "It has no effect on ordinary people", "It disappeared after a short period", "Only large companies benefit from it"]),
        a: 0, // 占位，下面重算
        exp: "细节题。定位句：" + sen,
        _a: ft.a
      });
    });"""
new_qs = """    [[f[0], facts[0]], [f[1], facts[1]], [f[3], facts[3]]].forEach(([sen, ft]) => {
      const npForQ = ft.q.includes('{np}') ? (sen.match(/(?:[A-Z][a-z]+ ?){1,3}/) || ['the trend'])[0] : '';
      qs.push({
        q: ft.q.replace(/\\{np\\}/g, npForQ || 'the change'),
        opts: shuffle(r, [ft.a, "It has no effect on ordinary people", "It disappeared after a short period", "Only large companies benefit from it"]),
        a: 0,
        exp: "细节题。定位句：" + sen,
        _a: ft.a
      });
    });"""
assert old_qs in t, 'qs anchor missing'
t = t.replace(old_qs, new_qs, 1)

io.open(p, 'w', encoding='utf-8').write(t)
print('gen.js question assembly fixed')
