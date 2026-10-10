# -*- coding: utf-8 -*-
# 重建 c2 完整条目（text 含深化段 + 5 题）
import io, re

p = r'D:\六级APP\js\data\reading_careful.js'
t = io.open(p, encoding='utf-8').read()

start = t.find('{id:"c2"')
end = t.find('{id:"c3"')
assert start > 0 and end > start, 'anchors missing'

new_c2 = '''{id:"c2",title:"Sponges in the City",text:"For most of the twentieth century, cities treated rainwater as a nuisance: collect it in gutters, bury it in pipes, and expel it as quickly as possible. That logic produced impressive engineering, from vast underground tunnels to powerful pumping stations, and for decades it worked. But as climate change makes storms more violent and unpredictable, even cities with world-class drainage are drowning. When a single downpour can exceed what pipes designed for a calmer era were built to carry, the obvious response, laying bigger pipes, is becoming ruinously expensive. \\n\\nA growing number of planners argue that the wiser strategy is to stop fighting water and start absorbing it. The sponge city approach spreads many small interventions across the urban landscape: pavements that let rain seep through, gardens planted on rooftops, wetlands restored at the edges of districts, and roadside trenches filled with vegetation that catch runoff. Each measure is modest on its own; together they aim to make a city behave less like plastic wrap and more like a forest floor. \\n\\nThe benefits extend beyond flood control. Vegetated surfaces cool overheated streets, filtered rainwater refills underground aquifers, and the new green space doubles as public parkland. Yet the approach has critics. Sponge measures absorb moderate showers well but can be overwhelmed by the extreme storms that are becoming ever more common. Environmentalists also warn of green gentrification: attractive parks raise nearby property values, quietly pushing out the lower-income residents whom such projects were supposed to serve. \\n\\nThe most sensible conclusion is that green and gray infrastructure are complements, not rivals. Pipes remain indispensable for the heaviest downpours, while spongy surfaces absorb the ordinary rain between them. What determines success, however, is less the technology than the governance behind it: sustained maintenance budgets, cooperation among municipal departments that rarely speak to one another, and residents who feel ownership of the green spaces at their doorstep. Recent history supplies a cautionary footnote: one pioneering city slashed maintenance budgets within two years of celebrating its first sponge district, and the following summer's storms found the permeable pavements clogged and the rain gardens waterlogged beyond function. Infrastructure, sponge advocates now concede, is less a project than a promise renewed annually — a discipline that applies with equal force to pipes, parks and the people hired to tend them.",questions:[
 {q:"The first paragraph suggests that cities' traditional approach to rainwater failed because ______.",opts:["it was conceived for a climate that no longer exists","municipal governments stopped funding drainage long ago","engineers favored pumping stations over tunnels","residents objected to underground construction"],a:0,"exp":"推断题。定位首段：旧逻辑为更温和的年代而设计（pipes designed for a calmer era），而气候变化使暴雨更猛烈、更难预测，一场降雨即可超过设计输送量——可见失效根源在于设计所依据的气候前提已不复存在。故A正确。B、C、D无中生有。"},
 {q:"The word modest in Paragraph 2 most probably means",opts:["limited in scale","cautious in attitude","cheap in price","friendly to the environment"],a:0,"exp":"定位第二段末：每项措施本身规模有限，合起来却能让城市像森林地表一样吸水，故modest此处指规模小。C利用其可表价格低之义偷换概念；B、D脱离上下文对照，属主观臆断。"},
 {q:"The author quotes the sponge city advocates' concession about maintenance in order to ______.",opts:["underscore that sustaining infrastructure is a continuing commitment rather than a one-off project","mock the movement for abandoning its earliest achievement","shift responsibility for flooding from planners to residents","prove that permeable pavements never function as designed"],a:0,"exp":"目的题。定位末段：拥护者承认维护预算被削减后透水铺装堵塞、雨水花园失效——举此例强调海绵设施需要年年续约式的持续投入，A正确。B、C、D曲解引证意图。"},
 {q:"What is the author's attitude toward the sponge city approach?",opts:["Uncritically enthusiastic.","Favorable yet aware of its limits.","Strongly skeptical of its feasibility.","Indifferent to its social side effects."],a:1,"exp":"第三段先列举降温、涵养地下水、增加公共空间等益处，再指出其在极端暴雨下可能失效及绿色绅士化的隐忧；末段主张绿色与灰色互补。可见作者总体赞同而有所保留，故B正确。A无视局限；C与全文基调相反；D与作者对社会影响的关注相悖。"},
 {q:"It can be learned from the last paragraph that the success of urban water management ultimately depends on ______.",opts:["complementary infrastructure combined with sustained governance","a complete replacement of pipes by sponge measures","the frequency of extreme storms in a given year","the speedy expansion of green space alone"],a:2,"exp":"末段点明：绿色与灰色基建互补，而成败更取决于治理——持续的维护预算、跨部门协作与居民认同。故C概括最完整。A只讲一半；B、D偷换或夸大文意。"}
]},
'''

t = t[:start] + new_c2 + '\n' + t[end:]
io.open(p, 'w', encoding='utf-8').write(t)

# 校验
blocks = re.split(r'\{id:"c\d"', t)[1:]
for i, blk in enumerate(blocks):
    qs = re.findall(r'\{q:"', blk)
    a = re.findall(r',a:(\d),', blk)
    txt = re.search(r'text:"(.*?)",questions', blk, re.S)
    w = len(re.findall(r'[A-Za-z]+(?:[\'-][A-Za-z]+)*', txt.group(1).encode().decode('unicode_escape'))) if txt else -1
    print(f'set{i+1}: questions={len(qs)} a={a} words={w}')
