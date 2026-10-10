# -*- coding: utf-8 -*-
# 重建整个 reading_careful.js（三套题干各5题，含新增段与升级题型）
import io, re

p = r'D:\六级APP\js\data\reading_careful.js'
src = io.open(p, encoding='utf-8').read()

# 提取三套的 text（含新增段落）
texts = re.findall(r'text:"(.*?)",questions', src, re.S)
assert len(texts) >= 3, f'只有 {len(texts)} 篇 text'
c1_text = texts[0].encode().decode('unicode_escape')
c2_text = texts[1].encode().decode('unicode_escape')
c3_text = texts[2].encode().decode('unicode_escape')

def js_str(s):
    return '"' + s.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n') + '"'

# 每套的题目数据（新升级版本）
C1_QS = [
{"q":"The author introduces the Luddites in the first paragraph in order to ______.",
 "opts":["provide a historical parallel whose incomplete lesson still shapes thinking today",
          "blame English textile workers for delaying technological progress",
          "illustrate how violently early protests against machines were suppressed",
          "suggest that modern workers share the Luddites' occupational skills"],
 "a":0,
 "exp":"目的题。作者以卢德分子开篇，是为引出经济学家从中得到的宽慰——技术进步虽有破坏但总体有利于就业市场，而后文将论证这一类比的不足。故A（提供一个教训并不完整、却仍影响今日思考的历史平行案例）正确。B、D曲解人物立场；C无中生有。"},
{"q":"The phrase \"a cottage industry of productivity applications\" suggests applications that are ______.",
 "opts":["developed by a small-scale sector promising relief from distraction",
          "produced by factories to industrialise cognitive work",
          "officially certified to regulate platform notifications",
          "designed by platform firms to raise engagement"],
 "a":0,
 "exp":"词义猜测题。cottage industry 本义为小规模行业，此处修饰承诺隔离干扰的生产力应用，即小团队开发的防打扰应用；D 与文中其通知同样参与竞争相悖。"},
{"q":"What can be inferred about productivity applications from Paragraph 2?",
 "opts":["Their developers profit from the very attention market they promise to fix.",
          "They have restored engineers' capacity for sustained concentration.",
          "They are required by field studies of workplace interruption.",
          "They rarely deliver any feature users are willing to pay for."],
 "a":0,
 "exp":"推断题。定位：其开发者很少承认自己的通知也在同一市场里竞争——可推知开发者本身从注意力经济中获利，A 正确；B、C 无据，D 偷换为收费话题。"},
{"q":"The author cites Europe's regulatory approach primarily to ______.",
 "opts":["illustrate remedies that leave the underlying business model untouched",
          "praise regulators for dismantling the attention market",
          "contrast European and American attitudes to privacy",
          "prove that focus modes have already become obsolete"],
 "a":0,
 "exp":"推断题。末段将法规与付费专注模式归入 such remedies，而它们只是舀出船舱积水的权宜之计——作者举欧洲例子意在说明治标不治本，A 正确。"},
{"q":"Which of the following best summarises the passage?",
 "opts":["Attention has become a commodity, and current fixes barely touch the incentive structure that exhausts it.",
          "Knowledge workers should abandon productivity applications altogether.",
          "The history of media panics proves that fears about attention are groundless.",
          "Platform firms will inevitably reform their models under regulatory pressure."],
 "a":0,
 "exp":"主旨题。全文链条：注意力成为商品→激励错位伤害深度工作→现有应用是同一市场玩家→监管与付费模式仍是权宜之计，A 概括最完整。"}
]

C2_QS = [
{"q":"The first paragraph suggests that cities' traditional approach to rainwater failed because ______.",
 "opts":["it was conceived for a climate that no longer exists",
          "municipal governments stopped funding drainage long ago",
          "engineers favored pumping stations over tunnels",
          "residents objected to underground construction"],
 "a":0,
 "exp":"推断题。定位首段：旧逻辑为更温和的年代而设计，而气候变化使暴雨更猛烈更难预测，一场降雨即可超过设计输送量——可见失效根源在于设计所依据的气候前提已不复存在。故A正确。"},
{"q":"The word modest in Paragraph 2 most probably means",
 "opts":["limited in scale","cautious in attitude","cheap in price","friendly to the environment"],
 "a":0,
 "exp":"定位第二段末：每项措施本身规模有限，合起来却能让城市像森林地表一样吸水，故modest此处指规模小。C利用其可表价格低之义偷换概念。"},
{"q":"The author quotes the sponge city advocates' concession about maintenance in order to ______.",
 "opts":["underscore that sustaining infrastructure is a continuing commitment rather than a one-off project",
          "mock the movement for abandoning its earliest achievement",
          "shift responsibility for flooding from planners to residents",
          "prove that permeable pavements never function as designed"],
 "a":0,
 "exp":"目的题。定位末段：拥护者承认维护预算被削减后透水铺装堵塞、雨水花园失效——举此例强调海绵设施需要年年续约式的持续投入，A正确。"},
{"q":"What is the author's attitude toward the sponge city approach?",
 "opts":["Uncritically enthusiastic.","Favorable yet aware of its limits.","Strongly skeptical of its feasibility.","Indifferent to its social side effects."],
 "a":1,
 "exp":"第三段先列举益处，再指出极端暴雨下可能失效及绿色绅士化的隐忧；末段主张绿色与灰色互补。作者总体赞同而有所保留，故B正确。"},
{"q":"It can be learned from the last paragraph that the success of urban water management ultimately depends on ______.",
 "opts":["complementary infrastructure combined with sustained governance",
          "a complete replacement of pipes by sponge measures",
          "the frequency of extreme storms in a given year",
          "the speedy expansion of green space alone"],
 "a":2,
 "exp":"末段点明：绿色与灰色基建互补，而成败更取决于治理——持续的维护预算、跨部门协作与居民认同。故C概括最完整。"}
]

C3_QS = [
{"q":"The paradox presented in Paragraph 1 consists in the fact that ______.",
 "opts":["the generation with the densest digital contact reports the deepest isolation",
          "older adults have begun to outnumber the young on social platforms",
          "loneliness among the young has declined while anxiety has risen",
          "messages flow constantly but are rarely answered in time"],
 "a":0,
 "exp":"细节题。定位首段：报告孤独与焦虑比例最高的恰是史上联系最紧密的一代——联系密度与孤独程度并置构成悖论。故A正确。"},
{"q":"The word thin in Paragraph 2 most probably means",
 "opts":["physically slim","unreliable in transmission","lacking in depth and substance","costly to maintain"],
 "a":2,
 "exp":"定位第二段：数字交流高效却单薄，即简短消息与快速反应要求少、给予也少，与下文面对面互动形成对照，故thin指缺乏深度与实质。C正确。"},
{"q":"What can be inferred about strict digital detox experiments?",
 "opts":["Their failure shows that willpower matters most.",
          "They may fail because they cut off contact without offering substitutes.",
          "They prove that social media does more good than harm.",
          "They work best when combined with professional therapy."],
 "a":1,
 "exp":"定位第三段：严格戒断实验常失败，因为它们切断了联系却未提供替代。故B正确。"},
{"q":"The author's attitude toward treating every ordinary worry as a disorder is",
 "opts":["approving, as it encourages early treatment","critical, as it may persuade people they are fragile",
          "neutral, as the evidence remains inconclusive","sympathetic, as therapists face rising demand"],
 "a":1,
 "exp":"态度题。定位第三段：治疗师提醒，把每个寻常焦虑都当作疾病，会让人相信自己脆弱——而某些焦虑恰是对真实困境的相称反应。语气明确批评，故B正确。"},
{"q":"It can be inferred from the last two paragraphs that the most effective response to loneliness would be ______.",
 "opts":["redesigning the environments where connection naturally occurs",
          "persuading individuals to reduce their screen time",
          "training medical staff to diagnose loneliness earlier",
          "expanding digital platforms to host more community events"],
 "a":0,
 "exp":"引申题。定位末两段：孤独是设计问题而非个人过失，任务不是下线而是重建联结发生的环境——由此可推知最有效的应对是重塑场景本身，A正确。"}
]

def fmt_qs(qs):
    lines = []
    for q in qs:
        opts = ','.join('"' + o.replace('"', '\\"') + '"' for o in q['opts'])
        lines.append(' {q:"' + q['q'].replace('"', '\\"') + '",opts:[' + opts + '],a:' + str(q['a']) + ',"exp":"' + q['exp'].replace('"', '\\"') + '"},')
    return '\n'.join(lines)

def fmt_text(t):
    return '"' + t.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n') + '"'

output = 'window.READING_CAREFUL=[\n'
for sid, title, text, qs in [
    ('c1', 'The Paradox of Automation and the Erosion of Deep Work', c1_text, C1_QS),
    ('c2', 'Sponges in the City', c2_text, C2_QS),
    ('c3', 'The Loneliness of the Connected Generation', c3_text, C3_QS),
]:
    output += '{id:"' + sid + '",title:"' + title + '",text:' + fmt_text(text) + ',questions:[\n'
    output += fmt_qs(qs)
    output += '\n]},\n'
output = output.rstrip(',\n') + '\n];\n'
output += 'window.READING_CAREFUL_EXTRA=["Luddites","loom","baffle","utopian","apocalyptic","depreciate","nuisance","gutter","downpour","seep","runoff","aquifer","gentrification","meticulously","abstinence","detox","ritual","proportionate","compound","obituary","proxy"];'

io.open(p, 'w', encoding='utf-8').write(output)
print('rebuilt, len:', len(output))
