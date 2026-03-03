import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_62325baf28c7");
    if (!AI_API_TOKEN) {
      throw new Error("AI_API_TOKEN is not configured");
    }

    const { messages, model, jobDescription } = await req.json();

    // 构建系统提示词
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

    // 构建完整的消息列表
    const fullMessages = [
      { role: "user", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch("https://api.enter.pro/code/api/v1/ai/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "anthropic/claude-sonnet-4.5",
        messages: fullMessages,
        stream: true,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      // Parse upstream SSE error response
      const text = await response.text();
      let errorMessage = "AI服务错误";
      let errorCode = "api_error";
      
      const dataMatch = text.match(/data: (.+)/);
      if (dataMatch) {
        try {
          const errorData = JSON.parse(dataMatch[1]);
          errorMessage = errorData.error?.message || errorMessage;
          errorCode = errorData.error?.type || errorCode;
        } catch { /* use defaults */ }
      }
      
      // Return error in SSE format to match frontend expectations
      const errorSSE = `event: error\ndata: ${JSON.stringify({
        type: "error",
        error: { type: errorCode, message: errorMessage }
      })}\n\n`;
      
      return new Response(errorSSE, {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" }
      });
    }

    // Stream SSE response to client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    // Return error in SSE format for consistency
    const errorSSE = `event: error\ndata: ${JSON.stringify({
      type: "error",
      error: { type: "api_error", message: error.message }
    })}\n\n`;
    
    return new Response(errorSSE, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" }
    });
  }
});
