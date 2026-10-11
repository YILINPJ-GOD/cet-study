# -*- coding: utf-8 -*-
import io

p = r'D:\六级APP\js\data\gen_templates.js'
t = io.open(p, encoding='utf-8').read()

EXTRA = {
"tech": [
  {"s": "Research institutions are investing heavily in understanding how {np} affects human behaviour and decision-making.", "q": "What are research institutions investing in?", "a": "Understanding how the technology affects behaviour"},
  {"s": "Despite early enthusiasm, the adoption of {np} has been slower in sectors that rely heavily on human judgment.", "q": "Where has adoption been slower?", "a": "In sectors relying on human judgment"}
],
"env": [
  {"s": "International agreements on {np} have been signed but enforcement remains inconsistent across borders.", "q": "What is the status of international agreements?", "a": "Signed but enforcement is inconsistent"},
  {"s": "Economic analysts estimate that transitioning to {np} will create far more jobs than it eliminates.", "q": "What do analysts estimate about the transition?", "a": "It will create more jobs than it eliminates"}
],
"edu": [
  {"s": "Educational researchers have found that students retain more information when {np} is combined with hands-on practice.", "q": "When do students retain more information?", "a": "When learning is combined with hands-on practice"},
  {"s": "The demand for {np} has grown so fast that many institutions struggle to keep pace.", "q": "What challenge do institutions face?", "a": "They struggle to keep pace with demand"}
],
"health": [
  {"s": "Long-term studies suggest that {np} in early adulthood has lasting effects on health in later life.", "q": "What do long-term studies suggest?", "a": "Early habits have lasting effects on later health"},
  {"s": "Doctors who recommend {np} to their patients report higher compliance when family members are involved.", "q": "What improves patient compliance?", "a": "Involving family members"}
],
"society": [
  {"s": "Sociologists studying {np} note that its effects vary significantly across different income groups.", "q": "How do the effects vary?", "a": "They vary significantly across income groups"},
  {"s": "Policy makers who ignore the social dimension of {np} risk undermining public trust in government.", "q": "What risks do policy makers face?", "a": "Undermining public trust in government"}
],
"culture": [
  {"s": "Enthusiasts argue that {np} offers a sense of continuity that modern life often lacks.", "q": "What does the tradition offer according to enthusiasts?", "a": "A sense of continuity that modern life lacks"},
  {"s": "Digital platforms have made {np} accessible to audiences who would never visit a museum.", "q": "How have digital platforms helped?", "a": "Made heritage accessible to wider audiences"}
]
}

count = 0
for theme_key, extras in EXTRA.items():
    theme_start = t.find(theme_key + ": {")
    if theme_start < 0:
        theme_start = t.find(theme_key + ":{")
    if theme_start < 0:
        print("THEME NOT FOUND:", theme_key)
        continue
    stance_pos = t.find("stance:", theme_start)
    if stance_pos < 0:
        print("STANCE NOT FOUND for", theme_key)
        continue
    insert = ""
    for e in extras:
        insert += '  { s:"' + e["s"] + '", q:"' + e["q"] + '", a:"' + e["a"] + '" },\n'
    t = t[:stance_pos] + insert + t[stance_pos:]
    count += len(extras)

io.open(p, "w", encoding="utf-8").write(t)
print("added", count, "fact templates")
