const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Role detection ─────────────────────────────────────────────────────────
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

// ─── Fallback local question bank (used only if AI generation fails) ───────
const FALLBACK_QUESTIONS = [
  { question: "请做一个 60-90 秒自我介绍，重点讲你和这个岗位最相关的经历。", category: "开场与动机", framework: "Past-Present-Future" },
  { question: "介绍一个你最有代表性的项目：背景、目标、你的动作、结果。", category: "项目深挖", framework: "STAR+" },
  { question: "你如何判断一个功能/需求该不该做？", category: "产品感觉", framework: "User-Problem-Solution-Tradeoff" },
  { question: "如果核心数据指标突然下降，你会如何拆解排查？", category: "数据与指标" },
  { question: "面对多个需求，你会如何排序优先级？", category: "优先级与Roadmap" },
  { question: "讲一次你和团队意见不一致但最终推进成功的经历。", category: "跨职能协作", framework: "STAR+" },
  { question: "你职业生涯中最大的挫折是什么？学到了什么？", category: "个人特质", framework: "STAR+" },
  { question: "你未来3年的职业规划是什么？这份工作如何帮助你实现？", category: "个人特质", framework: "Past-Present-Future" },
];

function buildFallbackQuestions(count: number) {
  return FALLBACK_QUESTIONS.slice(0, count).map((q, i) => ({
    id: `fallback_${i}`,
    question: q.question,
    category: q.category,
    framework: q.framework || null,
    referenceAnswer: "（AI生成暂不可用，请参考回答框架自行组织答案：" + (q.framework || "STAR+：情境→任务→行动→结果→反思") + "）",
  }));
}

// ─── Prompt builders ─────────────────────────────────────────────────────────
function buildRoleFocus(isAIPM: boolean, isBigTechCo: boolean): string {
  const parts: string[] = [];
  if (isAIPM) {
    parts.push("这是AI产品经理岗位，请优先覆盖：AI产品判断、RAG/知识库、Agent设计、模型选型、Prompt工程、评测体系、AI商业化等题型。避免把面试变成工程/代码测试。");
  } else {
    parts.push("重点考察：用户同理心与需求洞察、产品感觉与功能设计、数据思维、优先级与Roadmap、跨职能协作、执行与迭代。");
  }
  if (isBigTechCo) {
    parts.push("目标公司是知名大厂，请适当加入产品critique、数据指标、跨团队协作、需求优先级相关的高频真题风格。");
  }
  return parts.join("\n");
}

function buildJobContext(jobTitle: string, company: string, jobDescription: string, jobRequirements: string): string {
  return `职位：${jobTitle}${company ? " @ " + company : ""}
岗位描述：${(jobDescription || "").slice(0, 1200)}
岗位要求：${(jobRequirements || "").slice(0, 800)}`;
}

function buildQuickQuestionsPrompt(
  jobTitle: string, company: string, jobDescription: string, jobRequirements: string,
  isAIPM: boolean, isBigTechCo: boolean, count: number,
): { system: string; user: string } {
  const system = `你是一位资深产品经理面试官和面试教练。请根据给定的岗位信息，生成一批贴合该岗位的模拟面试题，并为每道题提供详细的参考答案。

${buildRoleFocus(isAIPM, isBigTechCo)}

要求：
1. 题目必须结合岗位的具体描述和要求，不能是泛泛而谈的通用题（比如提到岗位JD中的具体业务、产品、技术栈）
2. 题目覆盖不同维度：开场自我介绍、项目深挖、产品感觉、数据指标、优先级决策、跨职能协作、个人特质等，尽量不重复维度
3. 每道题提供一个具体、可操作的参考答案，参考答案应该给出结构化的回答思路和要点（不是泛泛的"要展示你的能力"这种空话），可以适当假设合理的候选人背景来举例
4. 严格按以下JSON数组格式输出，不要输出任何其他文字、不要使用markdown代码块：
[{"question":"题目内容","category":"题目类别(如:开场与动机/项目深挖/产品感觉/数据与指标/优先级/跨职能协作/个人特质/AI专项)","framework":"建议使用的回答框架(如STAR+/User-Problem-Solution-Tradeoff/Past-Present-Future，没有合适的可为null)","referenceAnswer":"详细参考答案，200-400字"}]`;

  const user = `${buildJobContext(jobTitle, company, jobDescription, jobRequirements)}

请生成 ${count} 道贴合以上岗位的模拟面试题及参考答案，严格输出JSON数组。`;

  return { system, user };
}

function buildPersonalizedQuestionsPrompt(
  jobTitle: string, company: string, jobDescription: string, jobRequirements: string,
  resumeText: string, isAIPM: boolean, isBigTechCo: boolean, count: number,
): { system: string; user: string } {
  const hasResume = !!resumeText && resumeText.trim().length > 0;

  const system = `你是一位专业的产品经理面试教练。请根据岗位信息${hasResume ? "和候选人简历" : ""}，生成一批候选人在面试中大概率会被问到的问题，并给出参考答案。

${buildRoleFocus(isAIPM, isBigTechCo)}

要求：
1. 题目必须紧扣岗位JD的具体要求和业务场景
${hasResume
  ? "2. 结合简历中的项目经历和岗位JD的要求，找出匹配点和差距点，针对性设计问题（比如简历中的某段经历会如何被追问、JD要求但简历中没体现的能力会如何被考察）"
  : "2. 简历未提供，请仅根据岗位JD的要求和业务场景设计通用但高度相关的问题"}
3. 每道题给出简短的"为什么会问这道题"的理由（reason字段，结合${hasResume ? "简历与" : ""}JD说明）
4. 每道题提供详细、结构化、可操作的参考答案${hasResume ? "，如果简历中有相关经历，答案应该基于简历内容组织（不要编造简历中没有的经历，如果简历信息不够具体，就给出通用但专业的回答框架和要点）" : "，给出专业、结构化的回答框架和要点"}
5. 严格按以下JSON数组格式输出，不要输出任何其他文字、不要使用markdown代码块：
[{"question":"题目内容","reason":"为什么会问这道题","framework":"建议回答框架或null","referenceAnswer":"详细参考答案，200-400字"}]`;

  const user = `${buildJobContext(jobTitle, company, jobDescription, jobRequirements)}
${hasResume ? `\n候选人简历：\n${resumeText.slice(0, 3000)}` : "\n（候选人未提供简历，请仅基于岗位信息出题）"}

请生成 ${count} 道题目，严格输出JSON数组。`;

  return { system, user };
}

function buildFollowupSystemPrompt(
  jobTitle: string, company: string, question: string, referenceAnswer: string,
): string {
  return `你是一位专业的产品经理面试教练，正在针对某一道面试题给候选人做追问式辅导。

面试题：${question}
参考答案要点：${referenceAnswer}
岗位：${jobTitle}${company ? " @ " + company : ""}

候选人会针对这道题输入自己的回答或问题，你需要：
1. 如果候选人提交了完整回答，给出具体反馈（亮点、不足、改进建议），并可以追问一个更深入的问题
2. 如果候选人只是提出疑问（比如"这道题应该怎么答"），给出针对性的指导
3. 保持简短聚焦，只讨论这一道题，不要跳到其他话题
4. 语言：默认中文，候选人用英文时切换英文`;
}

// ─── JSON parsing helper ────────────────────────────────────────────────────
function parseJsonArray(text: string): any[] | null {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* fall through */ }
  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* ignore */ }
  }
  return null;
}

async function callDeepSeekJSON(apiKey: string, system: string, user: string): Promise<any[] | null> {
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      stream: false,
      max_tokens: 4000,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("DeepSeek call failed:", text.slice(0, 300));
    return null;
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || "";
  return parseJsonArray(content);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DeepSeek API key not configured");

    const body = await req.json();
    const {
      mode = "quick_questions",
      jobTitle = "",
      jobCategory = "",
      jobDescription = "",
      jobRequirements = "",
      company = "",
      count = 8,
    } = body;

    console.log(`[interview] mode=${mode} title="${jobTitle}" category="${jobCategory}"`);

    const pmRole = isPMRole(jobTitle, jobCategory);
    const aiPM = isAIPMRole(jobTitle, jobCategory);
    const bigTech = isBigTech(company);

    // ── Mode: quick_questions — one-shot AI-generated question bank + answers ──
    if (mode === "quick_questions") {
      const { system, user } = buildQuickQuestionsPrompt(
        jobTitle, company, jobDescription, jobRequirements, aiPM, bigTech, Number(count),
      );
      const items = await callDeepSeekJSON(DEEPSEEK_API_KEY, system, user);

      if (!items || items.length === 0) {
        console.log("[interview] quick_questions AI generation failed, using fallback");
        return new Response(
          JSON.stringify({ questions: buildFallbackQuestions(Number(count)), isAIPM: aiPM, isBigTech: bigTech, fallback: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const questions = items.map((item, i) => ({
        id: `q_${i}`,
        question: item.question || "",
        category: item.category || "综合",
        framework: item.framework || null,
        referenceAnswer: item.referenceAnswer || "",
      })).filter(q => q.question);

      return new Response(
        JSON.stringify({ questions, isAIPM: aiPM, isBigTech: bigTech }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Mode: personalized_questions — resume(optional) + JD -> tailored Qs ──
    if (mode === "personalized_questions") {
      const { resumeText = "" } = body;
      const { system, user } = buildPersonalizedQuestionsPrompt(
        jobTitle, company, jobDescription, jobRequirements, resumeText, aiPM, bigTech, Number(count) || 6,
      );
      const items = await callDeepSeekJSON(DEEPSEEK_API_KEY, system, user);

      if (!items || items.length === 0) {
        return new Response(
          JSON.stringify({ error: "AI生成失败，请重试" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const questions = items.map((item, i) => ({
        id: `pq_${i}`,
        question: item.question || "",
        reason: item.reason || "",
        framework: item.framework || null,
        referenceAnswer: item.referenceAnswer || "",
      })).filter(q => q.question);

      return new Response(
        JSON.stringify({ questions, isAIPM: aiPM, isBigTech: bigTech, hasResume: !!resumeText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Mode: followup — streaming per-question follow-up chat ─────────────
    if (mode === "followup") {
      const { question = "", referenceAnswer = "", messages = [] } = body;
      const systemPrompt = buildFollowupSystemPrompt(jobTitle, company, question, referenceAnswer);

      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("DeepSeek followup error:", text.slice(0, 300));
        const errorSSE = `data: ${JSON.stringify({ type: "error", error: { type: "api_error", message: "AI服务错误，请重试" } })}\n\n`;
        return new Response(errorSSE, { status: 500, headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    return new Response(
      JSON.stringify({ error: "unknown mode" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error: any) {
    console.error("[interview] error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "服务错误" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
