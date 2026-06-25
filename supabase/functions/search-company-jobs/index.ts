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
    const body = await req.json();
    const company = body.company || "";
    const jobType = body.jobType || "实习";

    if (!company) {
      return new Response(
        JSON.stringify({ success: false, error: "请提供公司名称", jobs: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("开始搜索:", company, jobType);

    const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY") || "";
    console.log("Tavily Key 长度:", TAVILY_API_KEY.length);
    console.log("Tavily Key 前缀:", TAVILY_API_KEY.slice(0, 8));

    if (!TAVILY_API_KEY) {
      throw new Error("Tavily API Key 未配置");
    }

    // Tavily 搜索
    const searchQuery = company + " " + jobType + " 招聘 岗位";
    console.log("搜索词:", searchQuery);

    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + TAVILY_API_KEY,
      },
      body: JSON.stringify({
        query: searchQuery,
        search_depth: "basic",
        max_results: 10,
      }),
    });

    console.log("Tavily HTTP状态:", tavilyRes.status);

    if (!tavilyRes.ok) {
      const errBody = await tavilyRes.text();
      console.error("Tavily 错误:", errBody);
      throw new Error("搜索服务不可用 (状态码: " + tavilyRes.status + ")");
    }

    const tavilyData = await tavilyRes.json();
    const results = tavilyData.results || [];
    console.log("Tavily 返回结果数:", results.length);

    if (results.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "未找到相关结果，请尝试其他关键词", jobs: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AI 分析
    const AI_TOKEN = Deno.env.get("AI_API_TOKEN_62325baf28c7") || "";
    if (!AI_TOKEN) throw new Error("AI Token 未配置");

    const resultsText = results
      .map((r: any, i: number) => `${i + 1}. 标题: ${r.title || ""}\n   链接: ${r.url || ""}\n   摘要: ${r.content || ""}`)
      .join("\n\n");

    console.log("调用 AI 分析...");

    const aiRes = await fetch("https://api.enter.pro/code/api/v1/ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + AI_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2.5",
        messages: [
          {
            role: "system",
            content: "你是招聘信息筛选助手。从搜索结果中筛选与指定公司和岗位类型相关的结果，返回JSON数组。不要markdown代码块。",
          },
          {
            role: "user",
            content: `搜索公司"${company}"的"${jobType}"岗位，以下是搜索结果：\n\n${resultsText}\n\n请筛选最相关的结果（最多5个），使用搜索结果中的原始URL，返回JSON数组：\n[{"title":"岗位名","location":"城市(找不到写未知)","url":"原始链接","description":"简短描述"}]\n\n没有相关结果则返回[]`,
          },
        ],
        stream: false,
        max_tokens: 2000,
      }),
    });

    if (!aiRes.ok) {
      const aiErr = await aiRes.text();
      console.error("AI 错误:", aiErr.slice(0, 200));
      throw new Error("AI 分析失败");
    }

    const aiData = await aiRes.json();
    const aiText = (aiData.choices && aiData.choices[0] && aiData.choices[0].message && aiData.choices[0].message.content)
      ? aiData.choices[0].message.content
      : "[]";

    console.log("AI 返回:", aiText.slice(0, 200));

    let jobs: any[] = [];
    try {
      jobs = JSON.parse(aiText);
    } catch {
      const m = aiText.match(/\[[\s\S]*\]/);
      if (m) {
        try { jobs = JSON.parse(m[0]); } catch { jobs = []; }
      }
    }

    const valid = Array.isArray(jobs)
      ? jobs.filter((j: any) => j && j.url && typeof j.url === "string" && j.url.startsWith("http") && j.title)
      : [];

    console.log("有效岗位数:", valid.length);

    return new Response(
      JSON.stringify({
        success: valid.length > 0,
        message: valid.length > 0 ? `找到 ${valid.length} 个相关岗位` : "未找到相关岗位",
        jobs: valid,
        error: valid.length === 0 ? "未找到相关岗位，建议使用链接导入或手动添加" : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("搜索失败:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "搜索失败，请重试", jobs: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
