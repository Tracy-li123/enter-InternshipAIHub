const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) {
      throw new Error("DeepSeek API key not configured");
    }

    const { messages, jobDescription } = await req.json();

    const systemPrompt = `你是一位专业且友好的面试官，正在进行实习岗位的模拟面试。

【岗位信息】
${jobDescription}

【面试要求】
1. **问题设计**：
   - 根据职位描述（JD）提出针对性的面试问题
   - 问题难度从易到难递进
   - 包含行为面试题（STAR法则）和专业技能题
   - 每次只提出1-2个问题，不要一次性问太多

2. **面试风格**：
   - 保持专业但友好的态度
   - 使用鼓励性的语言
   - 在开始时做简短的自我介绍
   - 根据候选人回答进行自然的追问

3. **反馈要求**：
   - 对每个回答给予constructive feedback
   - 明确指出回答的优点（亮点）
   - 指出可改进的地方（不足）
   - 提供具体的改进建议和参考答案思路
   - 使用友好和建设性的语气

4. **面试流程**：
   - 第一轮：自我介绍和基础问题
   - 第二轮：行为面试题（过往经历）
   - 第三轮：专业技能题（根据JD要求）
   - 结束：总结评价和建议

请现在开始面试，先做简短的自我介绍，然后提出第一个问题。`;

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-reasoner",
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
      const errorSSE = `data: ${JSON.stringify({ type: "error", error: { type: "api_error", message: "AI服务错误" } })}\n\n`;
      return new Response(errorSSE, {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Stream DeepSeek response directly (OpenAI-compatible SSE format)
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
