/* ===== 智能出题生成器·主题模板库 =====
   每个主题：nps 主题名词短语（填入句子槽位）、factTemplates 事实句（自带命题 q/a）、
   intro/stance 段落句、twPool 词义猜测题目标词（词库真实释义）、titles/summary。 */
window.GEN_THEMES = {
culture: {
  label: "文化与传承",
  titles: ["Keeping Traditions Alive", "Old Crafts, New Hands", "Heritage in a Modern City"],
  summary: "traditional culture is being protected and reinvented for modern life",
  nps: [["traditional festivals","传统节日"],["folk crafts","民间手工艺"],["ancient streets","古街"],["local opera","地方戏曲"],["calligraphy classes","书法课"],["heritage sites","文化遗产地"],["handmade goods","手工艺品"],["temple fairs","庙会"]],
  intro: [
    "In many towns, {np} are enjoying a revival that few predicted.",
    "A quiet return to {np} is reshaping how people spend their weekends."
  ],
  fact: [
    { s:"Young designers are giving {np} a modern look that appeals to tourists.", q:"What are young designers doing?", a:"Giving traditional crafts a modern look" },
    { s:"The city spends part of its budget on protecting {np} from damage.", q:"How does the city protect heritage?", a:"Spending part of its budget on protection" },
    { s:"Sales of {np} doubled after they appeared in short videos.", q:"What happened to sales after the videos?", a:"They doubled" },
    { s:"Schools invite old craftsmen to teach students about {np}.", q:"Who teaches students and about what?", a:"Old craftsmen teach about heritage" },
    { s:"Some worry that turning {np} into business may weaken their meaning.", q:"What worry is mentioned?", a:"Commercial use may weaken their meaning" },
    { s:"Museums now hold night tours where visitors experience {np} after dark.", q:"What do museums offer at night?", a:"Night tours to experience heritage" },
    { s:"Documentaries about {np} have won large audiences among the young.", q:"Who watches the documentaries?", a:"Large young audiences" },
    { s:"Volunteers record the memories of masters of {np} before they are lost.", q:"Why do volunteers record masters' memories?", a:"To preserve them before they are lost" }
  ],
  stance: "Tradition survives not by staying unchanged, but by finding new hands to carry it.",
  twPool: [["authentic","正宗的，真正的"],["delicate","精致的"],["prospering","兴旺的"],["fragile","脆弱的"],["fashionable","时髦的"]],
  sentiment: "warm and reflective"
},
tech: {
  label: "科技与人工智能",
  titles: ["AI and the Future of Work", "Smart Machines, Smarter Choices", "Living With Intelligent Machines"],
  summary: "artificial intelligence is reshaping work and daily life, and society must adapt wisely",
  nps: [["artificial intelligence","人工智能"],["smart devices","智能设备"],["automation","自动化"],["data platforms","数据平台"],["intelligent systems","智能系统"],["digital tools","数字工具"],["machine learning","机器学习"],["robots in factories","工厂机器人"]],
  intro: [
    "Few technologies have spread as fast as {np} in the past decade.",
    "From offices to classrooms, {np} are quietly changing everyday routines."
  ],
  fact: [
    { s:"A recent industry survey found that {np} now handles tasks that once required whole teams.", q:"According to the passage, what can {np} do?", a:"Handle tasks that once required whole teams" },
    { s:"Companies that adopt {np} report measurable gains in efficiency and product quality.", q:"What benefit do companies gain from {np}?", a:"Measurable gains in efficiency and quality" },
    { s:"Critics warn that {np} may widen the gap between skilled and unskilled workers.", q:"What do critics worry about?", a:"It may widen the gap between skilled and unskilled workers" },
    { s:"Governments are drafting new rules to keep {np} transparent and accountable.", q:"How are governments responding to {np}?", a:"Drafting rules to keep it transparent and accountable" },
    { s:"Universities have redesigned courses so that graduates can work alongside {np}.", q:"Why are universities redesigning courses?", a:"So graduates can work alongside the technology" },
    { s:"Small businesses say {np} lowers costs that once blocked their growth.", q:"What do small businesses say about {np}?", a:"It lowers costs that once blocked growth" },
    { s:"Engineers admit that {np} still fails at tasks requiring common sense.", q:"What limitation of {np} is mentioned?", a:"It still fails at tasks requiring common sense" },
    { s:"Public trust in {np} rises when its decisions can be explained.", q:"When does public trust in {np} rise?", a:"When its decisions can be explained" }
  ],
  stance: "The real question is not whether {np} will spread, but whether society is prepared to guide it.",
  twPool: [["sophisticated","精密的，复杂的"],["unprecedented","前所未有的"],["vulnerable","脆弱的"],["versatile","多才多艺的；多用途的"],["inevitable","不可避免的"]],
  sentiment: "balanced but cautiously optimistic"
},
env: {
  label: "环境与可持续发展",
  titles: ["Green Cities, Cleaner Future", "The Economics of Sustainability", "Rethinking Waste in Modern Cities"],
  summary: "cities and citizens are adopting practical measures to cut pollution and waste",
  nps: [["renewable energy","可再生能源"],["urban green spaces","城市绿地"],["recycling programs","回收计划"],["carbon emissions","碳排放"],["public transport","公共交通"],["plastic waste","塑料垃圾"],["solar panels","太阳能板"],["electric buses","电动公交"]],
  intro: [
    "Across the world, cities are rethinking how {np} fits into daily life.",
    "What began as protests has become practical policy, and {np} sits at its center."
  ],
  fact: [
    { s:"Cities that invest in {np} report cleaner air within a few years.", q:"What do cities gain by investing in the mentioned measure?", a:"Cleaner air within a few years" },
    { s:"Households using {np} cut their monthly energy bills significantly.", q:"How do households benefit?", a:"They cut monthly energy bills significantly" },
    { s:"Local governments subsidize {np} to encourage wider adoption.", q:"Why do local governments provide subsidies?", a:"To encourage wider adoption" },
    { s:"Schools now teach children how {np} affects the local environment.", q:"What do schools teach about {np}?", a:"How it affects the local environment" },
    { s:"Factory owners complain that rules on {np} raise short-term costs.", q:"What do factory owners complain about?", a:"Rules raise short-term costs" },
    { s:"Volunteers organize weekend events to promote {np} in neighborhoods.", q:"What do volunteers do?", a:"Organize weekend events to promote it" },
    { s:"Data shows that {np} grows fastest where citizens are well informed.", q:"Where does adoption grow fastest?", a:"Where citizens are well informed" },
    { s:"Engineers are designing {np} that also survive extreme weather.", q:"What improvement are engineers making?", a:"Designing systems that survive extreme weather" }
  ],
  stance: "Protecting the environment is no longer a slogan; it is a set of daily decisions.",
  twPool: [["feasible","可行的"],["sustainable","可持续的"],["detrimental","有害的"],["indispensable","必不可少的"],["radical","彻底的，激进的"]],
  sentiment: "practical and encouraging"
},
edu: {
  label: "教育与终身学习",
  titles: ["Learning Should Never Graduate", "Classrooms Beyond the Campus", "The New Rules of Studying"],
  summary: "education is extending beyond campuses into lifelong, flexible learning",
  nps: [["online courses","在线课程"],["lifelong learning","终身学习"],["vocational training","职业培训"],["study groups","学习小组"],["digital libraries","数字图书馆"],["skilled mentors","经验丰富的导师"],["exchange programs","交换项目"],["evening classes","夜校课程"]],
  intro: [
    "The old idea that learning ends with graduation is quietly disappearing.",
    "Millions of adults now return to study through {np} every year."
  ],
  fact: [
    { s:"Workers who complete {np} are more likely to be promoted within two years.", q:"What happens to workers who complete the programs?", a:"They are more likely to be promoted" },
    { s:"Students say {np} helps them balance jobs, family and study.", q:"Why do students value the mentioned option?", a:"It helps balance jobs, family and study" },
    { s:"Employers increasingly fund {np} instead of raising wages directly.", q:"How do employers support learning?", a:"By funding education programs" },
    { s:"Rural learners can now attend top lectures thanks to {np}.", q:"What benefit do rural learners get?", a:"Access to top lectures" },
    { s:"Dropout rates fall when {np} offers short, clear milestones.", q:"What reduces dropout rates?", a:"Short, clear milestones" },
    { s:"Critics argue that {np} cannot replace hands-on practice.", q:"What do critics argue?", a:"It cannot replace hands-on practice" },
    { s:"Older learners report that {np} sharpens memory and confidence.", q:"What do older learners report?", a:"Better memory and confidence" },
    { s:"Governments now count {np} in national education statistics.", q:"How has official recognition changed?", a:"Such learning is counted in national statistics" }
  ],
  stance: "A society that keeps learning keeps growing; the classroom is simply wherever curiosity happens.",
  twPool: [["flexible","灵活的"],["accessible","易获得的"],["rigorous","严格的"],["motivating","激励人的"],["outdated","过时的"]],
  sentiment: "positive and forward-looking"
},
health: {
  label: "健康与生活方式",
  titles: ["Small Habits, Big Health", "The Science of Feeling Better", "Rethinking Daily Routines"],
  summary: "small daily habits such as sleep, exercise and diet shape long-term health",
  nps: [["regular exercise","规律运动"],["a balanced diet","均衡饮食"],["enough sleep","充足睡眠"],["mental breaks","心理休息"],["screen time","屏幕时间"],["community sports","社区运动"],["healthy snacks","健康零食"],["morning walks","晨间散步"]],
  intro: [
    "Doctors keep repeating simple advice, yet habits around {np} are hard to change.",
    "New research explains why {np} matters more than most people expect."
  ],
  fact: [
    { s:"Adults who keep up {np} report sharper memory within months.", q:"What benefit is reported from the habit?", a:"Sharper memory within months" },
    { s:"Companies that encourage {np} see fewer sick days among staff.", q:"What do companies observe?", a:"Fewer sick days among staff" },
    { s:"Cutting late-night {np} improves sleep quality, studies show.", q:"What improves sleep quality?", a:"Cutting late-night screen time" },
    { s:"Neighborhoods with easy access to {np} have lower obesity rates.", q:"What lowers obesity rates in neighborhoods?", a:"Easy access to the healthy option" },
    { s:"Experts warn that skipping {np} quietly raises long-term risks.", q:"What do experts warn about?", a:"Skipping the habit raises long-term risks" },
    { s:"Apps that track {np} help people stick to their plans.", q:"How do apps help?", a:"They help people stick to plans" },
    { s:"Families say shared {np} builds better communication at home.", q:"What does the habit bring to families?", a:"Better communication at home" },
    { s:"Hospitals now prescribe {np} alongside traditional treatment.", q:"How do hospitals use the advice?", a:"They prescribe it alongside treatment" }
  ],
  stance: "Health is built in ordinary moments: the walk taken, the screen put down, the light turned off.",
  twPool: [["moderate","适度的"],["beneficial","有益的"],["excessive","过度的"],["consistent","持续的"],["harmful","有害的"]],
  sentiment: "encouraging and evidence-based"
},
society: {
  label: "社会现象与青年",
  titles: ["The Way We Live Now", "Young Voices, Changing Cities", "Community in a Connected Age"],
  summary: "social changes are reshaping how young people live, work and connect",
  nps: [["young graduates","年轻毕业生"],["community centers","社区中心"],["shared apartments","合租公寓"],["night markets","夜市"],["volunteer groups","志愿者组织"],["short videos","短视频"],["city libraries","城市图书馆"],["part-time jobs","兼职工作"]],
  intro: [
    "Every generation rewrites the rules of daily life, and {np} is where it shows first.",
    "Look closely at {np} and you will read the mood of a whole generation."
  ],
  fact: [
    { s:"Surveys show that {np} tops the list of where young people make friends.", q:"Where do young people most often make friends?", a:"It tops the list of places to make friends" },
    { s:"Cities that support {np} find it easier to attract talented youth.", q:"What do cities gain by supporting it?", a:"Easier attraction of talented youth" },
    { s:"Parents sometimes misunderstand {np}, seeing it as a waste of time.", q:"How do some parents view it?", a:"As a waste of time" },
    { s:"Economists link the boom of {np} to flexible working hours.", q:"What is the boom linked to?", a:"Flexible working hours" },
    { s:"Volunteers say {np} gives them a sense of belonging.", q:"What does volunteering give volunteers?", a:"A sense of belonging" },
    { s:"Local shops near {np} report rising sales on weekends.", q:"What happens to nearby shops?", a:"Rising sales on weekends" },
    { s:"Researchers studying {np} note both freedom and loneliness.", q:"What two things do researchers note?", a:"Both freedom and loneliness" },
    { s:"City planners now design streets with {np} in mind.", q:"What do city planners do?", a:"Design streets with the phenomenon in mind" }
  ],
  stance: "Behind every social trend stands a simple human wish: to be seen, connected and useful.",
  twPool: [["profound","深刻的"],["widespread","普遍的"],["tempting","诱人的"],["temporary","暂时的"],["genuine","真诚的"]],
  sentiment: "observant and empathetic"
}
};
