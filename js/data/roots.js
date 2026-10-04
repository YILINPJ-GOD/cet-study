/* ===== 词根词缀库 + 单词拆解 ===== */
/* 词根：r=词根, m=含义, ex=派生词示例 [词, 释义, 拆解说明] */
window.WORD_ROOTS = [
{r:"spect",m:"看",ex:[["inspect","检查，视察","in(向内)+spect(看)→往里看→检查"],["respect","尊重；方面","re(反复)+spect(看)→一再看→尊重"],["prospect","前景，前途","pro(向前)+spect(看)→向前看→前景"],["suspect","怀疑","su(s)+spect(看)→从下面看→怀疑"]]},
{r:"port",m:"搬运，携带",ex:[["import","进口；输入","im(向内)+port(搬)→搬进来→进口"],["export","出口","ex(向外)+port(搬)→搬出去→出口"],["transport","运输","trans(跨越)+port(搬)→搬过地方→运输"],["portable","便携的","port(搬)+able(可…的)→可搬运的"]]},
{r:"dict",m:"说，断言",ex:[["predict","预测","pre(预先)+dict(说)→提前说→预测"],["contradict","反驳；矛盾","contra(相反)+dict(说)→反着说→反驳"],["indicate","表明，指示","in(向)+dic(说)+ate→向人说→表明"],["dedicate","奉献","de(加强)+dic(说)+ate→郑重说→奉献"]]},
{r:"duc/duct",m:"引导",ex:[["educate","教育","e(出)+duc(引导)+ate→把人引出来→教育"],["introduce","介绍；引入","intro(向内)+duce(引)→引进→介绍"],["reduce","减少","re(回)+duce(引)→往回引→减少"],["conduct","指挥；实施；行为","con(共同)+duct(引)→引导大家→指挥"]]},
{r:"fer",m:"带来，拿",ex:[["transfer","转移；转让","trans(跨越)+fer(拿)→拿过去→转移"],["prefer","更喜欢","pre(先)+fer(拿)→先拿→更喜欢"],["differ","不同","dif(分开)+fer(拿)→分开拿→不同"],["offer","提供","of(向)+fer(拿)→送到面前→提供"]]},
{r:"ject",m:"投掷",ex:[["project","投射；项目","pro(向前)+ject(投)→向前投→投射"],["reject","拒绝","re(回)+ject(投)→扔回来→拒绝"],["inject","注射；注入","in(向内)+ject(投)→投进去→注入"],["objective","客观的；目标","ob+ject+ive→放在面前的→客观的"]]},
{r:"mit/miss",m:"送，放出",ex:[["transmit","传输，传播","trans(跨越)+mit(送)→送过去→传输"],["submit","提交；服从","sub(下面)+mit(送)→从下面送上→提交"],["dismiss","解雇；解散","dis(分开)+miss(送)→分开送走→解散"],["permit","允许","per(贯穿)+mit(送)→完全送达→允许"]]},
{r:"press",m:"压",ex:[["impress","使印象深刻","im(向内)+press(压)→压入心里→印象深刻"],["compress","压缩","com(共同)+press(压)→一起压→压缩"],["pressure","压力","press(压)+ure(名词后缀)→压力"],["express","表达；快速的","ex(向外)+press(压)→压出来→表达"]]},
{r:"scrib/script",m:"写",ex:[["describe","描述","de(加强)+scrib(写)→写下来→描述"],["subscribe","订阅；赞成","sub(下面)+scrib(写)→在下面签名→订阅"],["prescribe","开处方；规定","pre(预先)+scrib(写)→预先写好→开处方"],["manuscript","手稿","manu(手)+script(写)→手写的→手稿"]]},
{r:"struct",m:"建立，结构",ex:[["structure","结构；建造","struct(建)+ure(名词后缀)→结构"],["construct","建造；构思","con(共同)+struct(建)→一起建→建造"],["instruct","指导；指示","in(向内)+struct(建)→往心里建→指导"],["destroy","破坏","de(相反)+stroy(struct 建)→反着建→破坏"]]},
{r:"tract",m:"拉，拖",ex:[["attract","吸引","at(向)+tract(拉)→拉过来→吸引"],["contract","合同；收缩","con(共同)+tract(拉)→拉到一起→合同"],["extract","提取；摘录","ex(向外)+tract(拉)→拉出来→提取"],["abstract","抽象的；摘要","abs(离开)+tract(拉)→拉出来概括→抽象的"]]},
{r:"vert/vers",m:"转",ex:[["convert","转换","con(完全)+vert(转)→完全转→转换"],["reverse","颠倒；相反的","re(回)+verse(转)→转回来→颠倒"],["advertise","做广告","ad(向)+vert(转)+ise→使注意力转向→做广告"],["diverse","多样的","di(分开)+verse(转)→转向各方→多样的"]]},
{r:"vis/vid",m:"看",ex:[["visible","可见的","vis(看)+ible(可…的)→可看见的"],["evident","明显的","e(向外)+vid(看)+ent→看得出→明显的"],["revise","修订；复习","re(again)+vis(看)→再看→修订"],["survey","调查；概观","sur(上面)+vey(看)→从上看→调查"]]},
{r:"form",m:"形式，形成",ex:[["reform","改革","re(again)+form(形成)→重新成形→改革"],["inform","通知","in(向内)+form(形成)→在心里成形→通知"],["transform","转变","trans(转)+form(形)→变形→转变"],["uniform","统一的；制服","uni(单一)+form(形)→一种形状→统一的"]]},
{r:"pos",m:"放置",ex:[["expose","暴露","ex(向外)+pos(放)→放出来→暴露"],["oppose","反对","op(相反)+pos(放)→放着反→反对"],["compose","组成；创作","com(共同)+pos(放)→放在一起→组成"],["dispose","处理；处置","dis(分开)+pos(放)→分开放→处理"]]},
{r:"sist",m:"站立",ex:[["insist","坚持","in(加强)+sist(站)→坚决站着→坚持"],["resist","抵抗","re(反)+sist(站)→反着站→抵抗"],["assist","协助","as(向)+sist(站)→站在旁边→协助"],["consist","由…组成","con(共同)+sist(站)→站在一起→组成"]]},
{r:"cess/ceed",m:"走，行进",ex:[["succeed","成功；继任","suc(下面)+ceed(走)→跟在后面走上去→成功"],["process","过程；加工","pro(向前)+cess(走)→向前走→过程"],["exceed","超过","ex(向外)+ceed(走)→走出去→超过"],["recede","后退","re(回)+cede(走)→走回去→后退"]]},
{r:"mot",m:"移动，动",ex:[["motivate","激励","mot(动)+ivate(动词后缀)→使动起来→激励"],["promote","促进；晋升","pro(向前)+mote(动)→往前动→晋升"],["emotion","情感","e(向外)+motion(动)→动出来的→情感"],["remote","遥远的","re(回)+mote(动)→动回到远处→遥远"]]},
{r:"cap/cept",m:"拿，取",ex:[["capture","捕获","capt(拿)+ure→拿住→捕获"],["accept","接受","ac(向)+cept(拿)→拿过来→接受"],["except","除…之外","ex(向外)+cept(拿)→拿出去→除外"],["capable","有能力的","cap(拿)+able(可…的)→能拿住的→有能力的"]]},
{r:"tain/ten",m:"握，持",ex:[["maintain","维持；坚称","main(手)+tain(握)→用手握住→维持"],["contain","包含","con(共同)+tain(握)→都握在里→包含"],["obtain","获得","ob(加强)+tain(握)→握到手→获得"],["tenant","租户","ten(握)+ant(人)→握住房子的→租户"]]},
{r:"greg",m:"群体",ex:[["segregate","隔离","se(分开)+greg(群)+ate→分群→隔离"],["aggregate","合计，总计","ag(向)+greg(群)+ate→聚成群→合计"],["gregarious","合群的，爱社交的","greg(群)+arious→爱扎堆的"]]},
{r:"cur/curr",m:"跑，发生",ex:[["occur","发生","oc(向)+cur(跑)→跑过来→发生"],["current","当前的；水流","curr(跑)+ent→正在跑的→当前的"],["excursion","远足","ex(向外)+cur(跑)+sion→跑出去→远足"],["incur","招致","in(向内)+cur(跑)→跑进来→招致"]]},
{r:"leg",m:"法律；收集",ex:[["legal","合法的","leg(法律)+al(形容词后缀)→法律的"],["legislate","立法","legis(法律)+late(带来)→带来法律→立法"],["delegate","代表；委派","de(离开)+leg(委派)+ate→派出去的人→代表"],["privilege","特权","privi(个人)+lege(法律)→限于个人的法→特权"]]},
{r:"labor",m:"劳动",ex:[["laboratory","实验室","labor(工作)+atory(场所)→工作的地方→实验室"],["elaborate","精心制作的；详述","e(加强)+labor(劳动)+ate→花工夫做的→精心的"],["collaborate","合作","col(共同)+labor(劳动)+ate→共同劳动→合作"]]},
{r:"liber",m:"自由",ex:[["liberate","解放","liber(自由)+ate(动词后缀)→使自由→解放"],["liberal","开明的；自由的","liber(自由)+al→自由的"],["liberty","自由","liber+ty(名词后缀)→自由"]]},
{r:"man/manu",m:"手",ex:[["manual","手工的；手册","manu(手)+al→手的"],["manufacture","制造","manu(手)+fact(做)+ure→用手做→制造"],["manage","管理","man(手)+age→用手操控→管理"],["manipulate","操纵","mani(手)+pul(拉)+ate→用手拉→操纵"]]},
{r:"medi",m:"中间",ex:[["medium","中等的；媒介","medi(中间)+um→中间物→媒介"],["mediate","调解","medi(中间)+ate→居中间→调解"],["immediate","立即的","im(不)+medi(中间)+ate→不隔中间的→立即的"],["Mediterranean","地中海","medi(中间)+terr(地)+anean→陆地中间的"]]},
{r:"memor",m:"记忆",ex:[["memory","记忆","memor+y→记忆"],["memorial","纪念的；纪念碑","memor+ial→用来记住的→纪念的"],["commemorate","纪念","com(共同)+memor(记忆)+ate→共同记住→纪念"],["remember","记得","re(再)+member(memor)→再想起→记得"]]}
];
window.WORD_ROOTS = window.WORD_ROOTS.filter(r => r.m && r.ex && r.ex.length);

/* 前缀 */
window.WORD_PREFIXES = {
un:["不，相反"], im:["不（用于 b/m/p 前）"], in:["不；向内"], dis:["不，分开"], re:["再，回"],
pre:["预先，在前"], anti:["反对"], de:["去除，向下"], ex:["向外；前任"], fore:["预先，在前"],
mis:["错误地"], over:["过度，在上"], sub:["下面，次级"], sur:["上面，超过"], trans:["跨越，转变"],
under:["下面，不足"], inter:["在…之间，相互"], post:["在后"], counter:["反对，对应"]
};
/* 后缀 */
window.WORD_SUFFIXES = {
tion:["名词后缀（行为/结果）"], sion:["名词后缀"], able:["可…的"], ible:["可…的"],
ify:["使…化"], ize:["使…化"], ous:["多…的，有…性质的"], ive:["有…性质的"],
ent:["…的（人/物）"], ant:["…的（人/物）"], ment:["名词后缀（行为/状态）"], ness:["名词后缀（性质）"],
ful:["充满…的"], less:["无…的"], ly:["…地（副词）"], er:["人/更…"], ist:["从事…的人"]
};
