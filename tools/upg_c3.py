# -*- coding: utf-8 -*-
import io, re

p = r'D:\六级APP\js\data\reading_careful.js'
t = io.open(p, encoding='utf-8').read()

# 1. c3 text 追加深化段
old_end = 'The task is not to log off but to rebuild the settings in which connection used to happen.",questions:['
new_end = ('The task is not to log off but to rebuild the settings in which connection used to happen. A quiet corollary is spreading through the research: measurement itself has become part of the problem. When a university counts volunteer hours to prove its students are engaged, engagement turns into a box to tick; when a hospital logs loneliness as a diagnosis, the diagnosis begins to stand in for the conversation it should have prompted. The instruments designed to detect the epidemic are quietly teaching institutions to respond to the paperwork rather than to the person.",questions:[')
assert old_end in t, 'c3 end anchor missing'
t = t.replace(old_end, new_end, 1)

# 2. 替换 c3 题目数组（5 题：悖论细节 + 词义 + 推断 + 态度升级 + 主旨升级为引申）
i = t.find('id:"c3"')
qs_start = t.find('questions:[', i)
qs_end = t.find(']},', qs_start)
old_q = t[qs_start:qs_end + 3]
new_q = '''questions:[
 {q:"The paradox presented in Paragraph 1 consists in the fact that ______.",opts:["the generation with the densest digital contact reports the deepest isolation","older adults have begun to outnumber the young on social platforms","loneliness among the young has declined while anxiety has risen","messages flow constantly but are rarely answered in time"],a:0,"exp":"细节题。定位首段：报告孤独与焦虑比例最高的恰是史上联系最紧密的一代——联系密度与孤独程度并置构成悖论。故A正确。B、C、D偷换比较对象或与文意相悖。"},
 {q:"The word thin in Paragraph 2 most probably means",opts:["physically slim","unreliable in transmission","lacking in depth and substance","costly to maintain"],a:2,"exp":"定位第二段：数字交流高效却单薄，即简短消息与快速反应要求少、给予也少，与下文较慢、无计划的面对面互动形成对照，故thin指缺乏深度与实质。C正确。A取字面义；B、D无中生有。"},
 {q:"What can be inferred about strict digital detox experiments?",opts:["Their failure shows that willpower matters most.","They may fail because they cut off contact without offering substitutes.","They prove that social media does more good than harm.","They work best when combined with professional therapy."],a:1,"exp":"定位第三段：严格戒断实验常失败，因为它们切断了联系却未提供替代。故B正确。A把失败归因于意志力，属无中生有；C与原文相悖；D文中未提戒断与治疗的组合。"},
 {q:"The author's attitude toward treating every ordinary worry as a disorder is",opts:["approving, as it encourages early treatment","critical, as it may persuade people they are fragile","neutral, as the evidence remains inconclusive","sympathetic, as therapists face rising demand"],a:1,"exp":"态度题。定位第三段：治疗师提醒，把每个寻常焦虑都当作疾病，会让人相信自己脆弱——而某些焦虑恰是对真实困境的相称反应。语气明确批评，故B正确。A、C、D均与原文语气相悖。"},
 {q:"It can be inferred from the last two paragraphs that the most effective response to loneliness would be ______.",opts:["redesigning the environments where connection naturally occurs","persuading individuals to reduce their screen time","training medical staff to diagnose loneliness earlier","expanding digital platforms to host more community events"],a:0,"exp":"引申题。定位末两段：孤独是设计问题而非个人过失，任务不是下线而是重建联结发生的环境——由此可推知最有效的应对是重塑场景本身，A正确。B正是作者批评的误读；C把病理性路线推向极端；D与线上低质量联系加剧孤立的论点相悖。"}
]},'''
t = t.replace(old_q, new_q, 1)

io.open(p, 'w', encoding='utf-8').write(t)
print('c3 upgraded, file len', len(t))
