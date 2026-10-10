# -*- coding: utf-8 -*-
# 重建 c2 的题目数组：加深化段 + 升级题干（目的/引申型）+ 保留词义题
import io, re

p = r'D:\六级APP\js\data\reading_careful.js'
t = io.open(p, encoding='utf-8').read()

# 1. c2 text 追加深化段（在 questions:[ 前的结尾句后加）
old_end = 'and residents who feel ownership of the green spaces at their doorstep.",questions:['
new_end = ('and residents who feel ownership of the green spaces at their doorstep. Recent history supplies a cautionary footnote: one pioneering city slashed maintenance budgets within two years of celebrating its first sponge district, and the following summer\'s storms found the permeable pavements clogged and the rain gardens waterlogged beyond function. Infrastructure, sponge advocates now concede, is less a project than a promise renewed annually — a discipline that applies with equal force to pipes, parks and the people hired to tend them.",questions:[')
assert old_end in t, 'c2 end anchor missing'
t = t.replace(old_end, new_end, 1)

# 2. 替换 c2 题目数组（5 题：细节升级 + 词义 + 目的题 + 态度 + 主旨引申）
m = re.search(r'\(id:"c2".*?questions:\[', t, re.S)
# 定位 c2 题目数组范围：从 'questions:[' 到 ']}],'（c2 结束）
i = t.find('id:"c2"')
qs_start = t.find('questions:[', i)
qs_end = t.find(']},', qs_start)
old_q = t[qs_start:qs_end + 3]
new_q = '''questions:[
 {q:"The first paragraph suggests that cities' traditional approach to rainwater failed because ______.",opts:["it was conceived for a climate that no longer exists","municipal governments stopped funding drainage long ago","engineers favored pumping stations over tunnels","residents objected to underground construction"],a:0,"exp":"推断题。定位首段：旧逻辑为更温和的年代而设计（pipes designed for a calmer era），而气候变化使暴雨更猛烈、更难预测，一场降雨即可超过设计输送量——可见失效根源在于设计所依据的气候前提已不复存在。故A正确。B、C、D无中生有。"},
 {q:"The word modest in Paragraph 2 most probably means",opts:["limited in scale","cautious in attitude","cheap in price","friendly to the environment"],a:0,"exp":"定位第二段末：每项措施本身规模有限，合起来却能让城市像森林地表一样吸水，故modest此处指规模小。C利用其可表价格低之义偷换概念；B、D脱离上下文对照，属主观臆断。"},
 {q:"The author quotes the sponge city advocates' concession about maintenance in order to ______.",opts:["underscore that sustaining infrastructure is a continuing commitment rather than a one-off project","mock the movement for abandoning its earliest achievement","shift responsibility for flooding from planners to residents","prove that permeable pavements never function as designed"],a:0,"exp":"目的题。定位末段：拥护者承认维护预算被削减后透水铺装堵塞、雨水花园失效——举此例强调海绵设施需要年年续约式的持续投入，A正确。B、C、D曲解引证意图。"},
 {q:"What is the author's attitude toward the sponge city approach?",opts:["Uncritically enthusiastic.","Favorable yet aware of its limits.","Strongly skeptical of its feasibility.","Indifferent to its social side effects."],a:1,"exp":"第三段先列举降温、涵养地下水、增加公共空间等益处，再指出其在极端暴雨下可能失效及绿色绅士化的隐忧；末段主张绿色与灰色互补。可见作者总体赞同而有所保留，故B正确。A无视局限；C与全文基调相反；D与作者对社会影响的关注相悖。"},
 {q:"It can be learned from the last paragraph that the success of urban water management ultimately depends on ______.",opts:["complementary infrastructure combined with sustained governance","a complete replacement of pipes by sponge measures","the frequency of extreme storms in a given year","the speedy expansion of green space alone"],a:2,"exp":"末段点明：绿色与灰色基建互补，而成败更取决于治理——持续的维护预算、跨部门协作与居民认同。故C概括最完整。A只讲一半；B、D偷换或夸大文意。"}
]},'''
t = t.replace(old_q, new_q, 1)

io.open(p, 'w', encoding='utf-8').write(t)
print('c2 upgraded, file len', len(t))
