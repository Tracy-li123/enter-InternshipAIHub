const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company, jobType = "实习" } = await req.json();

    if (!company) {
      return new Response(
        JSON.stringify({ success: false, error: "请提供公司名称" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🔍 使用Tavily搜索：${company} ${jobType}岗位`);

    const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
    if (!TAVILY_API_KEY) throw new Error("Tavily API Key未配置");

    // 步骤1: Tavily搜索
    const searchQuery = `${company} ${jobType} 招聘 岗位`;
    const tavilyResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query: searchQuery,
        search_depth: "basic",
        include_answer: false,
        include_raw_content: false,
        max_results: 10,
      }),
    });

    if (!tavilyResponse.ok) {
      const errorText = await tavilyResponse.text();
      console.error("❌ Tavily搜索失败:", errorText);
      throw new Error("搜索服务暂时不可用");
    }

    const tavilyData = await tavilyResponse.json();
    console.log(`✅ Tavily返回 ${tavilyData.results?.length || 0} 个结果`);

    if (!tavilyData.results || tavilyData.results.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: `未找到"${company}"的${jobType}岗位`, jobs: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 步骤2: AI分析搜索结果（使用正确的 OpenAI Chat Completions 协议）
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_62325baf28c7");
    if (!AI_API_TOKEN) throw new Error("AI配置未找到");

    const searchResultsText = tavilyData.results
      .map((r: any, i: number) => `${i + 1}. 标题: ${r.title}\n   链接: ${r.url}\n   摘要: ${r.content}\n`)
      .join("\n");

    console.log("🤖 使用AI分析搜索结果...");

    const aiResponse = await fetch("https://api.enter.pro/code/api/v1/ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2.5",
        messages: [
          {
            role: "system",
            content: "你是招聘信息提取助手。从搜索结果中筛选真实岗位，只返回JSON数组，不要其他文字。",
          },
          {
            role: "user",
            content: `以下是搜索"${company} ${jobType}"的真实网页结果，请筛选出${jobType}岗位：

${searchResultsText}

要求：
1. 只选与"${company}"和"${jobType}"直接相关的结果
2. 必须使用搜索结果中的原始URL，禁止修改或创造URL
3. 最多返回5个最相关的岗位
4. 只返回JSON数组，不要markdown代码块

格式：
[{"title":"岗位名称","location":"城市（找不到用未知）","url":"原始URL","description":"一两句描述"}]

如果没有相关岗位，返回 []`,
          },
        ],
        stream: false,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("❌ AI调用失败:", errorText.substring(0, 300));
      throw new Error("AI分析失败");
    }

    const aiResult = await aiResponse.json();
    const aiText = aiResult.choices?.[0]?.message?.content || "";
    console.log("📋 AI返回:", aiText.substring(0, 300));

    let jobs: any[];
    try {
      jobs = JSON.parse(aiText);
    } catch {
      const jsonMatch = aiText.match(/\[[\s\S]*\]/);
      jobs = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }

    const validJobs = jobs.filter((j: any) => j.url?.startsWith('http') && j.title);
    console.log(`✅ 找到 ${validJobs.length} 个有效岗位`);

    if (validJobs.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: `未找到"${company}"的${jobType}岗位，建议使用"链接导入"或"手动添加"`, jobs: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: `找到 ${validJobs.length} 个相关岗位`, jobs: validJobs }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ 搜索失败:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "搜索失败，请重试", jobs: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
