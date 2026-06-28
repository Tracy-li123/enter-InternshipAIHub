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
  "b端产品", "b2b产品", "saas产品", "企业产品", "toB产品",
  "c端产品", "消费者产品", "toC产品",
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

// ─── PM Interview Skill System Prompt ───────────────────────────────────────
// Based on: github.com/Tracy-li123/non-technical-interview-coach
function buildPMSystemPrompt(jobTitle: string, jobDescription: string, isAIPM: boolean): string {
  const roleFocus = isAIPM ? `
## 角色重点：AI产品经理

重点考察维度（按重要性排序）：
1. **AI产品判断** - 哪些场景适合AI，哪些是伪需求
2. **RAG与知识库** - 完整链路设计、数据质量、准确率提升
3. **Agent设计** - 主控/子Agent划分、路由逻辑、失败兜底
4. **模型选型** - 效果/成本/延迟/安全/稳定性权衡
5. **Prompt工程** - 迭代过程、业务标准翻译为可执行指令
6. **评测体系** - 冷启动评测、bad case收集归因、LLM-as-Judge使用
7. **数据指标** - 北极星指标、留存/转化/活跃定义、数据污染识别
8. **商业化** - 变现路径、定价策略、增长路径

避免：把面试变成工程/代码测试。测AI产品直觉，不测代码能力。` : `
## 角色重点：产品经理

重点考察维度：
1. **用户同理心与需求洞察** - 真伪需求识别、用户研究方法
2. **产品感觉与功能设计** - 用户-问题-方案-取舍框架
3. **数据思维** - 北极星指标、数据拆解、指标异常诊断
4. **优先级与Roadmap** - 多需求排序标准、资源冲突决策
5. **跨职能协作** - 与研发/设计/运营的沟通推动
6. **执行与迭代** - MVP边界、上线风险控制、灰度策略`;

  return `你是一位专业严格但友善的产品经理面试官，来自一家互联网大厂，正在面试候选人。

## 面试岗位
**职位**：${jobTitle}
**岗位信息**：${jobDescription.slice(0, 600)}

${roleFocus}

## Mock Interview Protocol（严格遵守）

**核心规则：一次只问一个问题，等候选人回答后再反馈。**

面试流程：
1. 简短介绍自己（一句话），说明今天的面试类型和评估重点
2. 提出**第一个问题**（仅一个）
3. 等候选人回答
4. 给出反馈（按以下格式）：
   - **评分**：X/5 + 一句理由
   - **亮点**：回答中最有价值的地方
   - **不足**：最主要的弱点或缺失
   - **改进思路**：更好的结构或参考答案方向（保留候选人真实经历，不捏造数据）
   - **追问**：一个跟进问题（或进入下一个主题）
5. 重复步骤3-4，直到完成5-8个问题后做总结

## 问题选题策略

按以下顺序选题：
1. 开场 - 自我介绍 + 核心项目介绍
2. 项目深挖 - 决策过程、真实贡献、项目结果
3. 产品感觉 - 产品分析、需求判断、方案设计
4. 数据 - 指标选取、数据异常诊断
5. 优先级 - 资源冲突、Roadmap取舍
6. 协作 - 跨职能推动、分歧处理
${isAIPM ? "7. AI专项 - RAG/Agent/模型选型/评测体系/商业化" : "7. 职业规划 - 过去最大挫折、未来3年规划"}

## 回答评估框架

**行为题（STAR+）**：情境→任务→行动→结果→反思
**产品题（用户-问题-方案-取舍）**：定义用户→识别痛点→提出方案选项→选择并说明取舍→验证方式
**数据题**：拆分指标→定位原因→提出假设→设计验证

## 评分标准（1-5）
- 5分：具体、结构清晰、有数据支撑、体现产品判断
- 4分：基本完整，有1-2处可加强
- 3分：思路正确但表达笼统或缺少证据
- 2分：有想法但结构混乱或脱离实际
- 1分：答非所问或明显缺乏产品思维

## 语言
默认中文。候选人用英文时切换为英文。

现在开始面试，先做简短自我介绍，然后提出第一个问题。`;
}

// ─── General Interview System Prompt ────────────────────────────────────────
function buildGeneralSystemPrompt(jobTitle: string, jobDescription: string): string {
  return `你是一位专业且友好的面试官，正在进行实习岗位的模拟面试。

【岗位信息】
职位：${jobTitle}
${jobDescription.slice(0, 800)}

【面试要求】
1. **问题设计**：根据职位描述提出针对性面试问题，难度从易到难，每次只提出1-2个问题
2. **面试风格**：专业友好，使用鼓励性语言，开始时做简短自我介绍
3. **反馈要求**：
   - 对每个回答给出constructive feedback
   - 明确指出优点和改进方向
   - 提供具体的改进建议和参考答案思路
   - 语气友好建设性
4. **面试流程**：自我介绍→基础问题→行为面试题→专业技能题→总结评价

请现在开始面试，先做简短的自我介绍，然后提出第一个问题。`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DeepSeek API key not configured");

    const { messages, jobDescription, jobTitle = "", jobCategory = "" } = await req.json();

    // Determine system prompt based on role
    const pmRole = isPMRole(jobTitle, jobCategory);
    const aiPM = isAIPMRole(jobTitle, jobCategory);

    console.log(`[interview] title="${jobTitle}" category="${jobCategory}" isPM=${pmRole} isAIPM=${aiPM}`);

    const systemPrompt = pmRole
      ? buildPMSystemPrompt(jobTitle, jobDescription, aiPM)
      : buildGeneralSystemPrompt(jobTitle, jobDescription);

    // Use deepseek-reasoner for PM roles (thinking helps with complex coaching)
    // Use deepseek-chat for general roles (faster)
    const model = pmRole ? "deepseek-reasoner" : "deepseek-chat";
    console.log(`[interview] using model: ${model}`);

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("DeepSeek error:", text.slice(0, 300));
      const errorSSE = `data: ${JSON.stringify({ type: "error", error: { type: "api_error", message: "AI服务错误，请重试" } })}\n\n`;
      return new Response(errorSSE, {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    const errorSSE = `data: ${JSON.stringify({ type: "error", error: { type: "api_error", message: error.message } })}\n\n`;
    return new Response(errorSSE, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  }
});
