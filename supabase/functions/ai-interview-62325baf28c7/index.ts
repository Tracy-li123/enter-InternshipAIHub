const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// PM role detection
const PM_KEYWORDS = [
  "产品经理", "产品总监", "产品负责人", "产品主管", "产品专家",
  "ai产品", "ai pm", "aigc产品", "智能产品",
  "产品运营", "产品策划", "产品设计", "产品分析",
  "增长产品", "增长pm", "growth product",
  "数据产品", "data product",
  "b端产品", "b2b产品", "saas产品", "企业产品", "tob产品",
  "c端产品", "消费者产品", "toc产品",
  "策略产品", "推荐产品", "搜索产品",
  "用户研究", "需求分析", "ux researcher",
  "product manager", "product director", "product owner",
];

function isPMRole(title: string, category: string): boolean {
  const text = (title + " " + category).toLowerCase().replace(/\s/g, "");
  return PM_KEYWORDS.some(k => text.includes(k.toLowerCase().replace(/\s/g, "")));
}

function isAIPMRole(title: string, category: string): boolean {
  const text = (title + " " + category).toLowerCase();
  return /ai产品|aigc产品|智能产品|ai pm|llm产品|大模型产品/.test(text);
}

const BIG_TECH = ["腾讯", "字节跳动", "阿里巴巴", "美团", "百度", "京东", "滴滴", "小红书"];

function isBigTech(company: string): boolean {
  return BIG_TECH.some(c => company.includes(c));
}

// ── Question Bank (ported from github.com/Tracy-li123/non-technical-interview-coach) ──

type QCategory = "opening" | "project" | "product_sense" | "demand_research" |
  "data_metrics" | "prioritization" | "cross_functional" | "ai_product" |
  "agent" | "model_evaluation" | "commercialization" | "competitor" | "personal";

interface Q {
  id: string;
  category: QCategory;
  categoryLabel: string;
  text: string;
  source: string;
  tags: string[];
  framework?: string;
}

const PM_QUESTIONS: Q[] = [
  { id: "op1", category: "opening", categoryLabel: "开场与动机", text: "请做一个 60-90 秒自我介绍，重点讲你和产品经理岗位最相关的经历。", source: "[AI-PM-BANK]", tags: ["通用", "开场"], framework: "Past-Present-Future" },
  { id: "op2", category: "opening", categoryLabel: "开场与动机", text: "你做过最能代表你产品能力的项目是什么？为什么选它？", source: "[AI-PM-BANK]", tags: ["通用", "开场"], framework: "Claim-Evidence-Learning" },
  { id: "op3", category: "opening", categoryLabel: "开场与动机", text: "如果入职这个岗位，你认为自己最能胜任哪三件事？分别有什么证据？", source: "[AI-PM-BANK]", tags: ["通用", "开场"] },
  { id: "op4", category: "opening", categoryLabel: "开场与动机", text: "你为什么从现在的背景转向产品经理？转型过程中沉淀了什么可迁移能力？", source: "[AI-PM-BANK]", tags: ["转岗"], framework: "Past-Present-Future" },
  { id: "op5", category: "opening", categoryLabel: "开场与动机", text: "你为什么投我们公司和这个岗位？你提前做过哪些产品或业务研究？", source: "[AI-PM-BANK]", tags: ["动机", "腾讯"] },
  { id: "pr1", category: "project", categoryLabel: "项目深挖", text: "介绍一个核心项目：背景、目标、你的动作、结果。", source: "[AI-PM-BANK]", tags: ["通用"], framework: "STAR+" },
  { id: "pr2", category: "project", categoryLabel: "项目深挖", text: "这个项目的需求最初从哪里来？是谁提出的？你如何判断它值得做？", source: "[AI-PM-BANK]", tags: ["通用"] },
  { id: "pr3", category: "project", categoryLabel: "项目深挖", text: "你在项目中的真实角色是什么？哪些决策是你主导的？", source: "[AI-PM-BANK]", tags: ["通用"], framework: "Claim-Evidence-Learning" },
  { id: "pr4", category: "project", categoryLabel: "项目深挖", text: "项目里最难的取舍是什么？你当时有哪些备选方案？", source: "[GENERAL-PM]", tags: ["通用"] },
  { id: "pr5", category: "project", categoryLabel: "项目深挖", text: "如果让你重做这个项目，你会改哪三个地方？", source: "[AI-PM-BANK]", tags: ["通用"], framework: "Claim-Evidence-Learning" },
  { id: "ps1", category: "product_sense", categoryLabel: "产品感觉", text: "选一个你常用的腾讯产品，说一个你认为可以优化的点。", source: "[GENERAL-PM]", tags: ["腾讯"], framework: "User-Problem-Solution-Tradeoff" },
  { id: "ps2", category: "product_sense", categoryLabel: "产品感觉", text: "你如何判断一个功能该不该做？请用用户价值、业务价值、成本风险说明。", source: "[GENERAL-PM]", tags: ["通用"] },
  { id: "ps3", category: "product_sense", categoryLabel: "产品感觉", text: "哪些需求看起来合理但其实是伪需求？你怎么识别？", source: "[AI-PM-BANK]", tags: ["通用"] },
  { id: "ps4", category: "product_sense", categoryLabel: "产品感觉", text: "设计一个面向大学生的腾讯产品新功能，你会怎么从需求到方案再到验证？", source: "[GENERAL-PM]", tags: ["腾讯", "校招"], framework: "User-Problem-Solution-Tradeoff" },
  { id: "dr1", category: "demand_research", categoryLabel: "需求与用户调研", text: "你通常怎么做产品需求调研？最终产出应该是什么？", source: "[AWESOME-PM]", tags: ["通用"] },
  { id: "dr2", category: "demand_research", categoryLabel: "需求与用户调研", text: "你怎么做用户访谈？如何避免被用户带节奏？", source: "[AWESOME-PM]", tags: ["通用"] },
  { id: "dr3", category: "demand_research", categoryLabel: "需求与用户调研", text: "调研中老板、销售、客服、研发意见冲突时，你怎么处理？", source: "[AWESOME-PM]", tags: ["通用"], framework: "STAR+" },
  { id: "dr4", category: "demand_research", categoryLabel: "需求与用户调研", text: "你如何判断需求真伪？如果不做这个需求，代价是什么？", source: "[AWESOME-PM]", tags: ["通用"] },
  { id: "dm1", category: "data_metrics", categoryLabel: "数据与指标", text: "这个产品的北极星指标是什么？为什么选它？", source: "[AI-PM-BANK]", tags: ["通用", "腾讯"] },
  { id: "dm2", category: "data_metrics", categoryLabel: "数据与指标", text: "如果产品 DAU 下降 10%，你会如何拆解原因？", source: "[GENERAL-PM]", tags: ["通用", "腾讯"] },
  { id: "dm3", category: "data_metrics", categoryLabel: "数据与指标", text: "如果用户反馈很好但数据没有提升，你会如何判断？", source: "[GENERAL-PM]", tags: ["通用"] },
  { id: "dm4", category: "data_metrics", categoryLabel: "数据与指标", text: "你会为一个新功能设计哪些埋点？上线前后分别看什么？", source: "[AI-PM-BANK]", tags: ["通用"] },
  { id: "dm5", category: "data_metrics", categoryLabel: "数据与指标", text: "留存、转化、活跃、使用深度这些指标分别适合回答什么问题？", source: "[AWESOME-PM]", tags: ["通用"] },
  { id: "dm6", category: "data_metrics", categoryLabel: "数据与指标", text: "给定用户行为表和订单表，你会如何计算次日留存或转化漏斗？", source: "[AWESOME-PM]", tags: ["通用", "SQL"] },
  { id: "prio1", category: "prioritization", categoryLabel: "优先级与Roadmap", text: "面对多个需求，你会如何排序？请说出一套可执行标准。", source: "[GENERAL-PM]", tags: ["通用", "腾讯"] },
  { id: "prio2", category: "prioritization", categoryLabel: "优先级与Roadmap", text: "业务方强烈要求上线，研发资源不够，你怎么决策？", source: "[GENERAL-PM]", tags: ["通用"], framework: "STAR+" },
  { id: "prio3", category: "prioritization", categoryLabel: "优先级与Roadmap", text: "如果老板要求做一个你认为价值不高的功能，你怎么沟通？", source: "[AI-PM-BANK]", tags: ["通用"], framework: "STAR+" },
  { id: "prio4", category: "prioritization", categoryLabel: "优先级与Roadmap", text: "MVP 应该做到什么程度？哪些东西第一版不做？", source: "[GENERAL-PM]", tags: ["通用"] },
  { id: "cf1", category: "cross_functional", categoryLabel: "跨职能协作", text: "你如何和研发沟通需求？如果研发认为实现成本太高怎么办？", source: "[AI-PM-BANK]", tags: ["通用", "腾讯"], framework: "STAR+" },
  { id: "cf2", category: "cross_functional", categoryLabel: "跨职能协作", text: "设计、研发、运营对方案意见不一致时，你怎么推动共识？", source: "[AI-PM-BANK]", tags: ["通用"], framework: "STAR+" },
  { id: "cf3", category: "cross_functional", categoryLabel: "跨职能协作", text: "没有职权时，你怎么让别人愿意配合你推进？", source: "[AI-PM-BANK]", tags: ["通用"], framework: "STAR+" },
  { id: "cf4", category: "cross_functional", categoryLabel: "跨职能协作", text: "讲一次你和团队发生分歧但最终推进成功的经历。", source: "[GENERAL-PM]", tags: ["通用"], framework: "STAR+" },
  { id: "ai1", category: "ai_product", categoryLabel: "AI产品与RAG", text: "你怎么看 AI 产品和传统产品的区别？", source: "[AI-PM-BANK]", tags: ["ai_pm"] },
  { id: "ai2", category: "ai_product", categoryLabel: "AI产品与RAG", text: "哪些场景不适合用 AI？请举一个伪需求例子。", source: "[AI-PM-BANK]", tags: ["ai_pm"] },
  { id: "ai3", category: "ai_product", categoryLabel: "AI产品与RAG", text: "如果做一个知识库问答产品，完整链路应该是什么？", source: "[AI-PM-BANK]", tags: ["ai_pm", "RAG"], framework: "User-Problem-Solution-Tradeoff" },
  { id: "ai4", category: "ai_product", categoryLabel: "AI产品与RAG", text: "知识库的数据从哪里来？如何保证合规、更新和质量？", source: "[AI-PM-BANK]", tags: ["ai_pm", "RAG"] },
  { id: "ai5", category: "ai_product", categoryLabel: "AI产品与RAG", text: "AI 幻觉问题如何控制？产品上如何降低事故概率？", source: "[AI-PM-BANK]", tags: ["ai_pm"] },
  { id: "ai6", category: "ai_product", categoryLabel: "AI产品与RAG", text: "文档切片、向量检索、rerank、top-k 这些会如何影响用户体验？", source: "[AI-PM-BANK]", tags: ["ai_pm", "RAG"] },
  { id: "ag1", category: "agent", categoryLabel: "Agent与AI工作流", text: "为什么选择 Multi-Agent 而不是单 Agent？分别适用什么场景？", source: "[AI-PM-BANK]", tags: ["ai_pm"] },
  { id: "ag2", category: "agent", categoryLabel: "Agent与AI工作流", text: "主控 Agent 和子 Agent 如何路由、传递信息、处理失败？", source: "[AI-PM-BANK]", tags: ["ai_pm"] },
  { id: "ag3", category: "agent", categoryLabel: "Agent与AI工作流", text: "举一个具体智能体例子，说明它如何完成意图理解、任务规划和主动执行。", source: "[AI-PM-BANK]", tags: ["ai_pm"] },
  { id: "ag4", category: "agent", categoryLabel: "Agent与AI工作流", text: "AI 自动化流程上线前，你会如何做人工审核和兜底？", source: "[GENERAL-PM]", tags: ["ai_pm"] },
  { id: "ag5", category: "agent", categoryLabel: "Agent与AI工作流", text: "如何区分真正的 Agent 和固定流程自动化？", source: "[AI-PM-BANK]", tags: ["ai_pm"] },
  { id: "me1", category: "model_evaluation", categoryLabel: "模型选型与Prompt", text: "你用过哪些大模型？如何做模型选型？选择时如何权衡效果、成本、延迟、稳定性？", source: "[AI-PM-BANK]", tags: ["ai_pm"] },
  { id: "me2", category: "model_evaluation", categoryLabel: "模型选型与Prompt", text: "你如何设计 Prompt？能说一个真实迭代过程吗？如何把模糊业务标准翻译成可执行指令？", source: "[AI-PM-BANK]", tags: ["ai_pm"] },
  { id: "me3", category: "model_evaluation", categoryLabel: "模型选型与Prompt", text: "你如何搭建 AI 效果评测体系？没有 ground truth 时如何做冷启动评测？", source: "[AI-PM-BANK]", tags: ["ai_pm"] },
  { id: "me4", category: "model_evaluation", categoryLabel: "模型选型与Prompt", text: "bad case 如何收集、归因和排序？LLM-as-Judge 能不能用，风险是什么？", source: "[AI-PM-BANK]", tags: ["ai_pm"] },
  { id: "co1", category: "commercialization", categoryLabel: "商业化与增长", text: "你的产品商业模式是什么？变现路径和定价策略如何制定？", source: "[AI-PM-BANK]", tags: ["ai_pm", "增长"] },
  { id: "co2", category: "commercialization", categoryLabel: "商业化与增长", text: "如果增长数据好但留存差，说明什么？你会如何分析和处理？", source: "[GENERAL-PM]", tags: ["通用", "增长"] },
  { id: "co3", category: "commercialization", categoryLabel: "商业化与增长", text: "你如何设计一个从冷启动到规模化的增长路径？", source: "[GENERAL-PM]", tags: ["通用"], framework: "User-Problem-Solution-Tradeoff" },
  { id: "ci1", category: "competitor", categoryLabel: "竞品与行业洞察", text: "你研究过哪些竞品？主打方向、优势和问题分别是什么？", source: "[AI-PM-BANK]", tags: ["通用"] },
  { id: "ci2", category: "competitor", categoryLabel: "竞品与行业洞察", text: "最近你关注的 AI 技术或产品趋势是什么？为什么重要？", source: "[AI-PM-BANK]", tags: ["ai_pm"] },
  { id: "ci3", category: "competitor", categoryLabel: "竞品与行业洞察", text: "描述一个 AI 难以替代人类决策的场景，产品应该如何设计人机协作？", source: "[AI-PM-BANK]", tags: ["ai_pm"] },
  { id: "pe1", category: "personal", categoryLabel: "个人特质", text: "你职业生涯中最大的挫折是什么？你从中学到了什么？", source: "[AI-PM-BANK]", tags: ["通用"], framework: "STAR+" },
  { id: "pe2", category: "personal", categoryLabel: "个人特质", text: "你未来 3 年的职业规划是什么？这份工作如何帮助你实现这个规划？", source: "[AI-PM-BANK]", tags: ["通用"], framework: "Past-Present-Future" },
];

function filterQuestions(opts: { role?: string; company?: string; count?: number; isAIPM?: boolean; isBigTechCo?: boolean }): Q[] {
  const { count = 8, isAIPM = false, isBigTechCo = false } = opts;
  const scored = PM_QUESTIONS.map(q => {
    let score = Math.random() * 0.4;
    if (q.category === "opening") score += 2;
    if (isAIPM && q.tags.includes("ai_pm")) score += 3;
    if (isAIPM && ["ai_product", "agent", "model_evaluation"].includes(q.category)) score += 2;
    if (isBigTechCo && q.tags.includes("腾讯")) score += 2;
    if (isBigTechCo && ["data_metrics", "prioritization", "cross_functional", "product_sense"].includes(q.category)) score += 1;
    if (!isAIPM && q.tags.includes("ai_pm") && !["opening", "project", "personal"].includes(q.category)) score -= 2;
    return { q, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const result: Q[] = [];
  const catCount: Record<string, number> = {};
  for (const { q } of scored) {
    const cat = q.category;
    catCount[cat] = (catCount[cat] ?? 0);
    const max = cat === "opening" ? 1 : 2;
    if (catCount[cat] < max) {
      result.push(q);
      catCount[cat]++;
      if (result.length >= count) break;
    }
  }
  if (result.length < count) {
    for (const { q } of scored) {
      if (!result.find(r => r.id === q.id)) {
        result.push(q);
        if (result.length >= count) break;
      }
    }
  }
  return result.slice(0, count);
}

function buildPMSystemPrompt(jobTitle: string, jobDescription: string, isAIPM: boolean): string {
  const roleFocus = isAIPM
    ? `## 角色重点：AI产品经理\n重点考察：AI产品判断、RAG与知识库、Agent设计、模型选型、Prompt工程、评测体系、数据指标、商业化\n避免：把面试变成工程/代码测试。测AI产品直觉，不测代码能力。`
    : `## 角色重点：产品经理\n重点考察：用户同理心与需求洞察、产品感觉与功能设计、数据思维、优先级与Roadmap、跨职能协作、执行与迭代`;

  return `你是一位专业严格但友善的产品经理面试官，来自一家互联网大厂。

## 面试岗位
职位：${jobTitle}
岗位信息：${jobDescription.slice(0, 600)}

${roleFocus}

## Mock Interview Protocol（严格遵守）

核心规则：一次只问一个问题，等候选人回答后再给反馈，再问下一题。

面试流程：
1. 简短介绍自己（一句话），说明今天的面试类型和评估重点
2. 提出第一个问题（仅一个）
3. 等候选人回答
4. 给出反馈（严格按以下格式）：

评分：X/5（一句理由）
亮点：回答中最有价值的地方
不足：最主要的弱点或缺失
改进思路：更好的结构或参考答案方向
追问：一个跟进问题

5. 重复步骤3-4，完成5-8个问题后生成总结报告

## 评分标准（来自evaluation-rubric.md）
5/5：清晰、具体、有数据支撑、体现产品判断、反思深刻
4/5：基本完整，有1-2处可加强
3/5：思路正确但表达笼统或缺少证据
2/5：有想法但结构混乱或脱离实际
1/5：答非所问或明显缺乏产品思维

## 回答框架提示（answer-frameworks.md）
行为题：STAR+（情境→任务→行动→结果→反思）
产品题：用户-问题-方案-取舍（定义用户→识别痛点→提出选项→选择并说明取舍→验证方式）
数据题：拆分指标→定位原因→提出假设→设计验证
开场题：Past-Present-Future

语言：默认中文。候选人用英文时切换英文。

现在开始面试，先简短自我介绍，然后提出第一道问题。`;
}

function buildGeneralSystemPrompt(jobTitle: string, jobDescription: string): string {
  return `你是一位专业且友好的面试官，正在进行实习岗位的模拟面试。

岗位信息：
职位：${jobTitle}
${jobDescription.slice(0, 800)}

面试要求：
1. 每次只提出1个问题，等候选人回答后给反馈，再问下一题
2. 反馈格式：评分(X/5) + 亮点 + 不足 + 改进建议 + 追问
3. 完成5-8题后生成总结报告
4. 语气专业友好，给出建设性反馈

现在开始面试，先简短自我介绍，然后提出第一道问题。`;
}

function buildPrepSystemPrompt(role: string, company: string, isAIPM: boolean): string {
  const aiSection = isAIPM
    ? "\n【AI产品经理专项】\n重点分析JD中涉及的AI技术关键词：RAG、Agent、Prompt、评测体系、模型选型、AI商业化\n为每个关键词找简历中的相关经历证据或标记为Gap"
    : "";

  return `你是一位专业的产品经理面试教练，正在帮助候选人准备${company ? company + " " : ""}${role}岗位的面试。

请根据候选人提供的简历和JD，生成一份完整的个性化面试准备方案。

【输出格式】严格按以下结构输出，每部分用 ## 标题分隔：

## JD Signal Map（JD关键信号）
列出JD中最重要的3-5个能力要求信号，每条说明：这个信号对应什么考察维度

## Resume Evidence Map（简历证据匹配）
将JD的每个信号映射到简历中的最佳证据，格式：
- [JD信号] → [简历中的对应项目/经历] → [可提炼的核心论点]

## Gap Risks（差距风险）
列出2-3个简历中缺失但JD要求的能力，建议如何弥补或如何在面试中应对

## Likely Questions（高概率面试题）
根据JD信号和简历，列出5-8道最可能被问到的问题，每道题说明为什么会被问
${aiSection}

## Story Bank（故事素材库）
从简历中提炼3-4个最适合用于面试的核心故事，每个故事用STAR+框架简要列出：
- 情境(S): 一句话背景
- 任务(T): 你的职责目标
- 行动(A): 你的关键决策和行动
- 结果(R): 可量化的成果
- 反思(+): 学到什么

## Priority Drills（优先练习清单）
列出3-5道最需要重点准备的题目，标明为什么这些题目高优先级

【注意】
- 紧扣简历和JD内容，不要编造简历中没有的经历
- 用中文输出
- 分析要具体，避免泛泛而谈`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DeepSeek API key not configured");

    const body = await req.json();
    const { mode = "mock", jobTitle = "", jobCategory = "", jobDescription = "", company = "", messages = [] } = body;

    console.log(`[interview] mode=${mode} title="${jobTitle}" category="${jobCategory}"`);

    if (mode === "questions") {
      const { role = jobTitle, count = 8 } = body;
      const aiPM = isAIPMRole(role, jobCategory);
      const bigTech = isBigTech(company);
      const questions = filterQuestions({ role, company, count: Number(count), isAIPM: aiPM, isBigTechCo: bigTech });
      return new Response(JSON.stringify({ questions, isAIPM: aiPM, isBigTech: bigTech }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "prep") {
      const { resumeText = "", jdText = "", role = jobTitle } = body;
      if (!resumeText || !jdText) {
        return new Response(JSON.stringify({ error: "resumeText and jdText are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const aiPM = isAIPMRole(role, jobCategory);
      const systemPrompt = buildPrepSystemPrompt(role, company, aiPM);
      const userMessage = `【岗位】${role}${company ? " @ " + company : ""}\n\n【岗位JD】\n${jdText.slice(0, 3000)}\n\n【简历】\n${resumeText.slice(0, 3000)}\n\n请生成完整的个性化面试准备方案。`;

      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          stream: true,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("DeepSeek prep error:", text.slice(0, 300));
        const errorSSE = `data: ${JSON.stringify({ type: "error", error: { type: "api_error", message: "AI服务错误，请重试" } })}\n\n`;
        return new Response(errorSSE, { status: 500, headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    // Default: mock
    const pmRole = isPMRole(jobTitle, jobCategory);
    const aiPM = isAIPMRole(jobTitle, jobCategory);
    const systemPrompt = pmRole
      ? buildPMSystemPrompt(jobTitle, jobDescription, aiPM)
      : buildGeneralSystemPrompt(jobTitle, jobDescription);
    const model = pmRole ? "deepseek-reasoner" : "deepseek-chat";
    console.log(`[interview] mock model: ${model} isPM=${pmRole} isAIPM=${aiPM}`);

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("DeepSeek error:", text.slice(0, 300));
      const errorSSE = `data: ${JSON.stringify({ type: "error", error: { type: "api_error", message: "AI服务错误，请重试" } })}\n\n`;
      return new Response(errorSSE, { status: response.status, headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });

  } catch (error: any) {
    const errorSSE = `data: ${JSON.stringify({ type: "error", error: { type: "api_error", message: error.message } })}\n\n`;
    return new Response(errorSSE, { status: 500, headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  }
});