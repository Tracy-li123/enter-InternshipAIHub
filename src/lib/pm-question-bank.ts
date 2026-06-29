// PM Interview Question Bank
// Source: github.com/Tracy-li123/non-technical-interview-coach
// Ported from Python CLI to TypeScript for browser/edge use

export type QuestionCategory =
  | 'opening'
  | 'project'
  | 'product_sense'
  | 'demand_research'
  | 'data_metrics'
  | 'prioritization'
  | 'cross_functional'
  | 'ai_product'
  | 'agent'
  | 'model_evaluation'
  | 'commercialization'
  | 'competitor'
  | 'personal';

export interface Question {
  id: string;
  category: QuestionCategory;
  categoryLabel: string;
  text: string;
  source: string;
  tags: string[];
  framework?: string; // suggested answer framework
}

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  opening: '开场与动机',
  project: '项目深挖',
  product_sense: '产品感觉与产品批判',
  demand_research: '需求与用户调研',
  data_metrics: '数据与指标',
  prioritization: '优先级与Roadmap',
  cross_functional: '跨职能协作',
  ai_product: 'AI产品与RAG',
  agent: 'Agent与AI工作流',
  model_evaluation: '模型选型与Prompt与评测',
  commercialization: '商业化与增长',
  competitor: '竞品与行业洞察',
  personal: '个人特质与职业规划',
};

export const PM_QUESTIONS: Question[] = [
  // ── Opening and Motivation ──────────────────────────────────────────────
  {
    id: 'op1',
    category: 'opening',
    categoryLabel: '开场与动机',
    text: '请做一个 60-90 秒自我介绍，重点讲你和产品经理岗位最相关的经历。',
    source: '[AI-PM-BANK]',
    tags: ['通用', '开场'],
    framework: 'Past-Present-Future',
  },
  {
    id: 'op2',
    category: 'opening',
    categoryLabel: '开场与动机',
    text: '你做过最能代表你产品能力的项目是什么？为什么选它？',
    source: '[AI-PM-BANK]',
    tags: ['通用', '开场'],
    framework: 'Claim-Evidence-Learning',
  },
  {
    id: 'op3',
    category: 'opening',
    categoryLabel: '开场与动机',
    text: '如果入职这个岗位，你认为自己最能胜任哪三件事？分别有什么证据？',
    source: '[AI-PM-BANK]',
    tags: ['通用', '开场'],
    framework: 'Claim-Evidence-Learning',
  },
  {
    id: 'op4',
    category: 'opening',
    categoryLabel: '开场与动机',
    text: '你为什么从现在的背景转向产品经理？转型过程中沉淀了什么可迁移能力？',
    source: '[AI-PM-BANK]',
    tags: ['转岗', '动机'],
    framework: 'Past-Present-Future',
  },
  {
    id: 'op5',
    category: 'opening',
    categoryLabel: '开场与动机',
    text: '你为什么投我们公司和这个岗位？你提前做过哪些产品或业务研究？',
    source: '[AI-PM-BANK]',
    tags: ['动机', '腾讯', '大厂'],
    framework: 'Past-Present-Future',
  },
  {
    id: 'op6',
    category: 'opening',
    categoryLabel: '开场与动机',
    text: '你找工作最看重什么？你更想做用户增长、业务提效、平台工具还是C端体验？',
    source: '[AI-PM-BANK]',
    tags: ['动机', '职业规划'],
  },
  {
    id: 'op7',
    category: 'opening',
    categoryLabel: '开场与动机',
    text: '如果你没有传统产品实习，为什么你仍然适合产品经理？',
    source: '[GENERAL-PM]',
    tags: ['校招', '应届'],
    framework: 'Claim-Evidence-Learning',
  },

  // ── Resume and Project Deep Dive ───────────────────────────────────────
  {
    id: 'pr1',
    category: 'project',
    categoryLabel: '项目深挖',
    text: '介绍一个核心项目：背景、目标、你的动作、结果。',
    source: '[AI-PM-BANK]',
    tags: ['通用', '项目'],
    framework: 'STAR+',
  },
  {
    id: 'pr2',
    category: 'project',
    categoryLabel: '项目深挖',
    text: '这个项目的需求最初从哪里来？是谁提出的？你如何判断它值得做？',
    source: '[AI-PM-BANK]',
    tags: ['项目', '需求'],
  },
  {
    id: 'pr3',
    category: 'project',
    categoryLabel: '项目深挖',
    text: '你在项目中的真实角色是什么？哪些决策是你主导的？',
    source: '[AI-PM-BANK]',
    tags: ['项目', '所有权'],
    framework: 'Claim-Evidence-Learning',
  },
  {
    id: 'pr4',
    category: 'project',
    categoryLabel: '项目深挖',
    text: '这个项目从 0 到 1 的流程是什么？你如何推进每个阶段？',
    source: '[AI-PM-BANK]',
    tags: ['项目', '执行'],
    framework: 'STAR+',
  },
  {
    id: 'pr5',
    category: 'project',
    categoryLabel: '项目深挖',
    text: '项目里最难的取舍是什么？你当时有哪些备选方案？',
    source: '[GENERAL-PM]',
    tags: ['项目', '决策'],
  },
  {
    id: 'pr6',
    category: 'project',
    categoryLabel: '项目深挖',
    text: '如果让你重做这个项目，你会改哪三个地方？',
    source: '[AI-PM-BANK]',
    tags: ['项目', '复盘'],
    framework: 'Claim-Evidence-Learning',
  },
  {
    id: 'pr7',
    category: 'project',
    categoryLabel: '项目深挖',
    text: '你简历里写到"负责/参与/优化"，请具体说你做了什么，不要讲团队整体。',
    source: '[GENERAL-PM]',
    tags: ['项目', '所有权'],
  },
  {
    id: 'pr8',
    category: 'project',
    categoryLabel: '项目深挖',
    text: '项目现在是什么状态？上线了吗？还在使用吗？如果没有，原因是什么？',
    source: '[AI-PM-BANK]',
    tags: ['项目', '结果'],
  },

  // ── Product Sense and Critique ─────────────────────────────────────────
  {
    id: 'ps1',
    category: 'product_sense',
    categoryLabel: '产品感觉',
    text: '选一个你常用的腾讯产品，说一个你认为可以优化的点。',
    source: '[GENERAL-PM]',
    tags: ['腾讯', '产品批判'],
    framework: 'User-Problem-Solution-Tradeoff',
  },
  {
    id: 'ps2',
    category: 'product_sense',
    categoryLabel: '产品感觉',
    text: '如果让你优化微信/腾讯会议/腾讯文档/QQ音乐的一个场景，你会如何定义目标用户和核心问题？',
    source: '[GENERAL-PM]',
    tags: ['腾讯', '产品设计'],
    framework: 'User-Problem-Solution-Tradeoff',
  },
  {
    id: 'ps3',
    category: 'product_sense',
    categoryLabel: '产品感觉',
    text: '你如何判断一个功能该不该做？请用用户价值、业务价值、成本风险说明。',
    source: '[GENERAL-PM]',
    tags: ['通用', '决策'],
  },
  {
    id: 'ps4',
    category: 'product_sense',
    categoryLabel: '产品感觉',
    text: '设计一个面向大学生的腾讯产品新功能，你会怎么从需求到方案再到验证？',
    source: '[GENERAL-PM]',
    tags: ['腾讯', '产品设计', '校招'],
    framework: 'User-Problem-Solution-Tradeoff',
  },
  {
    id: 'ps5',
    category: 'product_sense',
    categoryLabel: '产品感觉',
    text: '哪些需求看起来合理但其实是伪需求？你怎么识别？',
    source: '[AI-PM-BANK]',
    tags: ['通用', '需求判断'],
  },
  {
    id: 'ps6',
    category: 'product_sense',
    categoryLabel: '产品感觉',
    text: '你怎么把一个业务需求转化成功能需求？举一个真实例子。',
    source: '[AI-PM-BANK]',
    tags: ['通用', '需求转化'],
  },
  {
    id: 'ps7',
    category: 'product_sense',
    categoryLabel: '产品感觉',
    text: '你如何写一份让研发和设计都能理解的产品方案？',
    source: '[GENERAL-PM]',
    tags: ['通用', '协作'],
  },

  // ── Demand Research ────────────────────────────────────────────────────
  {
    id: 'dr1',
    category: 'demand_research',
    categoryLabel: '需求与用户调研',
    text: '你通常怎么做产品需求调研？最终产出应该是什么？',
    source: '[AWESOME-PM]',
    tags: ['通用', '调研'],
  },
  {
    id: 'dr2',
    category: 'demand_research',
    categoryLabel: '需求与用户调研',
    text: '需求调研和用户调研有什么区别？分别解决什么问题？',
    source: '[AWESOME-PM]',
    tags: ['通用', '调研'],
  },
  {
    id: 'dr3',
    category: 'demand_research',
    categoryLabel: '需求与用户调研',
    text: '你怎么做用户访谈？如何避免被用户带节奏？',
    source: '[AWESOME-PM]',
    tags: ['通用', '用户研究'],
  },
  {
    id: 'dr4',
    category: 'demand_research',
    categoryLabel: '需求与用户调研',
    text: '用户说的话如何转化成产品需求？请讲一个具体流程。',
    source: '[AWESOME-PM]',
    tags: ['通用', '需求'],
  },
  {
    id: 'dr5',
    category: 'demand_research',
    categoryLabel: '需求与用户调研',
    text: '调研中老板、销售、客服、研发意见冲突时，你怎么处理？',
    source: '[AWESOME-PM]',
    tags: ['通用', '协作'],
    framework: 'STAR+',
  },
  {
    id: 'dr6',
    category: 'demand_research',
    categoryLabel: '需求与用户调研',
    text: '你如何判断需求真伪？如果不做这个需求，代价是什么？',
    source: '[AWESOME-PM]',
    tags: ['通用', '需求判断'],
  },
  {
    id: 'dr7',
    category: 'demand_research',
    categoryLabel: '需求与用户调研',
    text: '你怎么做竞品调研？输出物应该包括哪些部分？',
    source: '[AWESOME-PM]',
    tags: ['通用', '竞品'],
  },

  // ── Metrics, Data, SQL ────────────────────────────────────────────────
  {
    id: 'dm1',
    category: 'data_metrics',
    categoryLabel: '数据与指标',
    text: '这个产品的北极星指标是什么？为什么选它？',
    source: '[AI-PM-BANK]',
    tags: ['通用', '指标', '腾讯'],
  },
  {
    id: 'dm2',
    category: 'data_metrics',
    categoryLabel: '数据与指标',
    text: '如果产品 DAU 下降 10%，你会如何拆解原因？',
    source: '[GENERAL-PM]',
    tags: ['通用', '数据诊断', '腾讯'],
  },
  {
    id: 'dm3',
    category: 'data_metrics',
    categoryLabel: '数据与指标',
    text: '如果用户反馈很好但数据没有提升，你会如何判断？',
    source: '[GENERAL-PM]',
    tags: ['通用', '数据分析'],
  },
  {
    id: 'dm4',
    category: 'data_metrics',
    categoryLabel: '数据与指标',
    text: '你会为一个新功能设计哪些埋点？上线前后分别看什么？',
    source: '[AI-PM-BANK]',
    tags: ['通用', '数据', '上线'],
  },
  {
    id: 'dm5',
    category: 'data_metrics',
    categoryLabel: '数据与指标',
    text: '留存、转化、活跃、使用深度这些指标分别适合回答什么问题？',
    source: '[AWESOME-PM]',
    tags: ['通用', '指标'],
  },
  {
    id: 'dm6',
    category: 'data_metrics',
    categoryLabel: '数据与指标',
    text: '给定用户行为表和订单表，你会如何计算次日留存或转化漏斗？',
    source: '[AWESOME-PM]',
    tags: ['通用', 'SQL', '数据'],
  },
  {
    id: 'dm7',
    category: 'data_metrics',
    categoryLabel: '数据与指标',
    text: '如果数据被活动激励或刷量污染，你如何识别并修正判断？',
    source: '[AI-PM-BANK]',
    tags: ['通用', '数据质量'],
  },

  // ── Prioritization ────────────────────────────────────────────────────
  {
    id: 'prio1',
    category: 'prioritization',
    categoryLabel: '优先级与Roadmap',
    text: '面对多个需求，你会如何排序？请说出一套可执行标准。',
    source: '[GENERAL-PM]',
    tags: ['通用', '优先级', '腾讯'],
  },
  {
    id: 'prio2',
    category: 'prioritization',
    categoryLabel: '优先级与Roadmap',
    text: '业务方强烈要求上线，研发资源不够，你怎么决策？',
    source: '[GENERAL-PM]',
    tags: ['通用', '资源冲突', '协作'],
    framework: 'STAR+',
  },
  {
    id: 'prio3',
    category: 'prioritization',
    categoryLabel: '优先级与Roadmap',
    text: '如果老板要求做一个你认为价值不高的功能，你怎么沟通？',
    source: '[AI-PM-BANK]',
    tags: ['通用', '向上管理'],
    framework: 'STAR+',
  },
  {
    id: 'prio4',
    category: 'prioritization',
    categoryLabel: '优先级与Roadmap',
    text: 'MVP 应该做到什么程度？哪些东西第一版不做？',
    source: '[GENERAL-PM]',
    tags: ['通用', 'MVP'],
  },
  {
    id: 'prio5',
    category: 'prioritization',
    categoryLabel: '优先级与Roadmap',
    text: '如何平衡短期商业目标和长期用户体验？',
    source: '[GENERAL-PM]',
    tags: ['通用', '取舍'],
  },
  {
    id: 'prio6',
    category: 'prioritization',
    categoryLabel: '优先级与Roadmap',
    text: '如果竞品突然上线同类功能，你们要不要跟进？如何决策？',
    source: '[AI-PM-BANK]',
    tags: ['通用', '竞品', '决策'],
  },

  // ── Cross-Functional ──────────────────────────────────────────────────
  {
    id: 'cf1',
    category: 'cross_functional',
    categoryLabel: '跨职能协作',
    text: '你日常和哪些岗位协作？分别解决什么问题？',
    source: '[AI-PM-BANK]',
    tags: ['通用', '协作'],
  },
  {
    id: 'cf2',
    category: 'cross_functional',
    categoryLabel: '跨职能协作',
    text: '你如何和研发沟通需求？如果研发认为实现成本太高怎么办？',
    source: '[AI-PM-BANK]',
    tags: ['通用', '协作', '腾讯'],
    framework: 'STAR+',
  },
  {
    id: 'cf3',
    category: 'cross_functional',
    categoryLabel: '跨职能协作',
    text: '设计、研发、运营对方案意见不一致时，你怎么推动共识？',
    source: '[AI-PM-BANK]',
    tags: ['通用', '协作'],
    framework: 'STAR+',
  },
  {
    id: 'cf4',
    category: 'cross_functional',
    categoryLabel: '跨职能协作',
    text: '没有职权时，你怎么让别人愿意配合你推进？',
    source: '[AI-PM-BANK]',
    tags: ['通用', '影响力'],
    framework: 'STAR+',
  },
  {
    id: 'cf5',
    category: 'cross_functional',
    categoryLabel: '跨职能协作',
    text: '讲一次你和团队发生分歧但最终推进成功的经历。',
    source: '[GENERAL-PM]',
    tags: ['通用', '协作'],
    framework: 'STAR+',
  },

  // ── AI Product, RAG, Knowledge Base ───────────────────────────────────
  {
    id: 'ai1',
    category: 'ai_product',
    categoryLabel: 'AI产品与RAG',
    text: '你怎么看 AI 产品和传统产品的区别？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm'],
  },
  {
    id: 'ai2',
    category: 'ai_product',
    categoryLabel: 'AI产品与RAG',
    text: '哪些场景不适合用 AI？请举一个伪需求例子。',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', '需求判断'],
  },
  {
    id: 'ai3',
    category: 'ai_product',
    categoryLabel: 'AI产品与RAG',
    text: '如果做一个知识库问答产品，完整链路应该是什么？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', 'RAG'],
    framework: 'User-Problem-Solution-Tradeoff',
  },
  {
    id: 'ai4',
    category: 'ai_product',
    categoryLabel: 'AI产品与RAG',
    text: '知识库的数据从哪里来？如何保证合规、更新和质量？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', 'RAG', '数据质量'],
  },
  {
    id: 'ai5',
    category: 'ai_product',
    categoryLabel: 'AI产品与RAG',
    text: 'AI 幻觉问题如何控制？产品上如何降低事故概率？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', '幻觉', '风险'],
  },
  {
    id: 'ai6',
    category: 'ai_product',
    categoryLabel: 'AI产品与RAG',
    text: '文档切片、向量检索、rerank、top-k 这些会如何影响用户体验？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', 'RAG', '技术'],
  },
  {
    id: 'ai7',
    category: 'ai_product',
    categoryLabel: 'AI产品与RAG',
    text: '知识库日常如何维护和迭代？准确率如何提升？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', 'RAG', '运营'],
  },

  // ── Agent and AI Workflow ─────────────────────────────────────────────
  {
    id: 'ag1',
    category: 'agent',
    categoryLabel: 'Agent与AI工作流',
    text: '为什么选择 Multi-Agent 而不是单 Agent？分别适用什么场景？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', 'Agent'],
  },
  {
    id: 'ag2',
    category: 'agent',
    categoryLabel: 'Agent与AI工作流',
    text: '子 Agent 如何划分？为什么是这些角色和数量？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', 'Agent'],
  },
  {
    id: 'ag3',
    category: 'agent',
    categoryLabel: 'Agent与AI工作流',
    text: '主控 Agent 和子 Agent 如何路由、传递信息、处理失败？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', 'Agent', '容错'],
  },
  {
    id: 'ag4',
    category: 'agent',
    categoryLabel: 'Agent与AI工作流',
    text: '举一个具体智能体例子，说明它如何完成意图理解、任务规划和主动执行。',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', 'Agent'],
    framework: 'User-Problem-Solution-Tradeoff',
  },
  {
    id: 'ag5',
    category: 'agent',
    categoryLabel: 'Agent与AI工作流',
    text: 'AI 自动化流程上线前，你会如何做人工审核和兜底？',
    source: '[GENERAL-PM]',
    tags: ['ai_pm', 'Agent', '风险'],
  },
  {
    id: 'ag6',
    category: 'agent',
    categoryLabel: 'Agent与AI工作流',
    text: '如何区分真正的 Agent 和固定流程自动化？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', 'Agent'],
  },

  // ── Model Selection, Prompting, Evaluation ────────────────────────────
  {
    id: 'me1',
    category: 'model_evaluation',
    categoryLabel: '模型选型与Prompt与评测',
    text: '你用过哪些大模型？如何做模型选型？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', '模型选型'],
  },
  {
    id: 'me2',
    category: 'model_evaluation',
    categoryLabel: '模型选型与Prompt与评测',
    text: '选择模型时如何权衡效果、成本、延迟、稳定性和安全？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', '模型选型'],
  },
  {
    id: 'me3',
    category: 'model_evaluation',
    categoryLabel: '模型选型与Prompt与评测',
    text: '你如何设计 Prompt？能说一个真实迭代过程吗？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', 'Prompt'],
  },
  {
    id: 'me4',
    category: 'model_evaluation',
    categoryLabel: '模型选型与Prompt与评测',
    text: '如何把模糊业务标准翻译成 AI 可执行的评分 Prompt？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', 'Prompt', '评测'],
  },
  {
    id: 'me5',
    category: 'model_evaluation',
    categoryLabel: '模型选型与Prompt与评测',
    text: '你如何搭建 AI 效果评测体系？评测维度有哪些？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', '评测'],
  },
  {
    id: 'me6',
    category: 'model_evaluation',
    categoryLabel: '模型选型与Prompt与评测',
    text: '没有 ground truth 时，如何做冷启动评测？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', '评测', '冷启动'],
  },
  {
    id: 'me7',
    category: 'model_evaluation',
    categoryLabel: '模型选型与Prompt与评测',
    text: 'bad case 如何收集、归因和排序？是不是所有 bad case 都要修？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', '评测', '迭代'],
  },
  {
    id: 'me8',
    category: 'model_evaluation',
    categoryLabel: '模型选型与Prompt与评测',
    text: 'LLM-as-Judge 能不能用？有哪些风险？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', '评测'],
  },

  // ── Commercialization and Growth ──────────────────────────────────────
  {
    id: 'co1',
    category: 'commercialization',
    categoryLabel: '商业化与增长',
    text: '你的产品商业模式是什么？变现路径是什么？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', '商业化', '增长'],
  },
  {
    id: 'co2',
    category: 'commercialization',
    categoryLabel: '商业化与增长',
    text: '定价策略如何制定？用户分层依据是什么？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', '商业化'],
  },
  {
    id: 'co3',
    category: 'commercialization',
    categoryLabel: '商业化与增长',
    text: '付费转化路径是什么？免费功能和付费功能怎么切？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', '商业化', '增长'],
  },
  {
    id: 'co4',
    category: 'commercialization',
    categoryLabel: '商业化与增长',
    text: '如果增长数据好但留存差，说明什么？你会如何分析？',
    source: '[GENERAL-PM]',
    tags: ['通用', '增长', '数据'],
  },
  {
    id: 'co5',
    category: 'commercialization',
    categoryLabel: '商业化与增长',
    text: '你如何设计一个从冷启动到规模化的增长路径？',
    source: '[GENERAL-PM]',
    tags: ['通用', '增长'],
    framework: 'User-Problem-Solution-Tradeoff',
  },

  // ── Competitor and Industry ────────────────────────────────────────────
  {
    id: 'ci1',
    category: 'competitor',
    categoryLabel: '竞品与行业洞察',
    text: '你研究过哪些竞品？主打方向、优势和问题分别是什么？',
    source: '[AI-PM-BANK]',
    tags: ['通用', '竞品'],
  },
  {
    id: 'ci2',
    category: 'competitor',
    categoryLabel: '竞品与行业洞察',
    text: '大厂也能做这个功能，用户为什么要用你的产品？',
    source: '[AI-PM-BANK]',
    tags: ['通用', '竞品', '差异化'],
  },
  {
    id: 'ci3',
    category: 'competitor',
    categoryLabel: '竞品与行业洞察',
    text: '最近你关注的 AI 技术或产品趋势是什么？为什么重要？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', '行业'],
  },
  {
    id: 'ci4',
    category: 'competitor',
    categoryLabel: '竞品与行业洞察',
    text: '描述一个 AI 难以替代人类决策的场景，产品应该如何设计人机协作？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', '人机协作'],
  },
  {
    id: 'ci5',
    category: 'competitor',
    categoryLabel: '竞品与行业洞察',
    text: '如果 AI 产品进入医疗、税务、教育等强监管行业，哪些红线不能碰？',
    source: '[AI-PM-BANK]',
    tags: ['ai_pm', '合规', '风险'],
  },

  // ── Personal Traits and Career Planning ───────────────────────────────
  {
    id: 'pe1',
    category: 'personal',
    categoryLabel: '个人特质',
    text: '你觉得自己是什么样的人？请用具体事例证明，不要用形容词。',
    source: '[AI-PM-BANK]',
    tags: ['通用'],
    framework: 'Claim-Evidence-Learning',
  },
  {
    id: 'pe2',
    category: 'personal',
    categoryLabel: '个人特质',
    text: '你职业生涯中最大的挫折是什么？你从中学到了什么？',
    source: '[AI-PM-BANK]',
    tags: ['通用'],
    framework: 'STAR+',
  },
  {
    id: 'pe3',
    category: 'personal',
    categoryLabel: '个人特质',
    text: '你未来 3 年的职业规划是什么？这份工作如何帮助你实现这个规划？',
    source: '[AI-PM-BANK]',
    tags: ['通用', '职业规划'],
    framework: 'Past-Present-Future',
  },
  {
    id: 'pe4',
    category: 'personal',
    categoryLabel: '个人特质',
    text: '你在压力下如何保持判断力？举一个具体的高压场景。',
    source: '[AI-PM-BANK]',
    tags: ['通用', '压力'],
    framework: 'STAR+',
  },
];

// ── Filtering Logic ──────────────────────────────────────────────────────
const BIG_TECH_COMPANIES = ['腾讯', '字节跳动', '阿里巴巴', '美团', '百度', '京东', '滴滴', '小红书'];
const AI_PM_KEYWORDS = ['ai产品', 'ai pm', 'aigc', '大模型', 'llm', '智能产品'];

export function isPMRoleClient(title: string, category: string): boolean {
  const text = (title + ' ' + category).toLowerCase();
  return /产品经理|产品总监|产品运营|产品策划|产品设计|产品分析|增长产品|数据产品|b端产品|c端产品|策略产品|用户研究|product manager|product owner/.test(text);
}

export function isAIPMRoleClient(title: string, category: string): boolean {
  const text = (title + ' ' + category).toLowerCase();
  return AI_PM_KEYWORDS.some(k => text.includes(k));
}

export function isBigTechCompany(company: string): boolean {
  return BIG_TECH_COMPANIES.some(c => company.includes(c));
}

export interface FilterOptions {
  role?: string;
  company?: string;
  count?: number;
  isAIPM?: boolean;
  isBigTech?: boolean;
  categories?: QuestionCategory[];
}

export function filterQuestions(opts: FilterOptions): Question[] {
  const { role = '', company = '', count = 8, isAIPM = false, isBigTech = false, categories } = opts;

  let pool = [...PM_QUESTIONS];

  // If specific categories requested, filter to those
  if (categories && categories.length > 0) {
    pool = pool.filter(q => categories.includes(q.category));
  }

  // Score each question based on role/company fit
  const scored = pool.map(q => {
    let score = 0;

    // AI PM priority
    if (isAIPM && q.tags.includes('ai_pm')) score += 3;
    if (isAIPM && ['ai_product', 'agent', 'model_evaluation'].includes(q.category)) score += 2;

    // Big tech / 腾讯 priority
    if (isBigTech && (q.tags.includes('腾讯') || q.tags.includes('大厂'))) score += 2;
    if (isBigTech && ['data_metrics', 'prioritization', 'cross_functional', 'product_sense'].includes(q.category)) score += 1;

    // General PM: deprioritize AI-only questions
    if (!isAIPM && q.tags.includes('ai_pm') && !['opening', 'project', 'personal'].includes(q.category)) score -= 2;

    // Opening questions always included (high base score)
    if (q.category === 'opening') score += 1;

    // Add some randomness to vary results
    score += Math.random() * 0.5;

    return { q, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Ensure category variety: max 2 per category for diversity
  const result: Question[] = [];
  const categoryCount: Record<string, number> = {};

  // First pass: include top-scoring unique categories
  for (const { q } of scored) {
    const cat = q.category;
    if (!categoryCount[cat]) categoryCount[cat] = 0;

    const maxPerCat = cat === 'opening' ? 1 : 2;
    if (categoryCount[cat] < maxPerCat) {
      result.push(q);
      categoryCount[cat]++;
      if (result.length >= count) break;
    }
  }

  // Second pass: fill remaining spots if needed
  if (result.length < count) {
    for (const { q } of scored) {
      if (!result.includes(q)) {
        result.push(q);
        if (result.length >= count) break;
      }
    }
  }

  return result.slice(0, count);
}

export const FRAMEWORK_DESCRIPTIONS: Record<string, string> = {
  'STAR+': 'Situation（情境）→ Task（任务）→ Action（行动）→ Result（结果）→ Reflection（反思）',
  'Past-Present-Future': 'Past（相关经历）→ Present（现在能力）→ Future（为什么这份工作是下一步）',
  'User-Problem-Solution-Tradeoff': 'User（目标用户）→ Problem（核心痛点）→ Solution（方案选项）→ Tradeoff（取舍与验证）',
  'Claim-Evidence-Learning': 'Claim（结论）→ Evidence（项目上下文+行动+指标）→ Learning（收获）',
  'Clarify-Structure-Analyze-Recommend': 'Clarify（明确目标）→ Structure（分析框架）→ Analyze（具体分析）→ Recommend（结论与建议）',
};
