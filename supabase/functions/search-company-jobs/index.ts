import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
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

    // 获取 Tavily API Key
    const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
    if (!TAVILY_API_KEY) {
      console.error("❌ Tavily API Key未配置");
      throw new Error("Tavily API Key未配置");
    }

    console.log("✅ Tavily API Key已找到");

    // 步骤1: 使用Tavily API搜索
    const searchQuery = `${company} ${jobType} 招聘 site:jobs.${company.toLowerCase()}.com OR site:zhaopin.com OR site:lagou.com OR site:51job.com`;
    console.log("搜索关键词:", searchQuery);

    const tavilyResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
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
        JSON.stringify({
          success: false,
          error: `未找到"${company}"的${jobType}岗位，请尝试更换关键词或使用"链接导入"`,
          jobs: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 步骤2: 使用AI从搜索结果中提取岗位信息
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_62325baf28c7");
    if (!AI_API_TOKEN) {
      throw new Error("AI配置未找到");
    }

    // 准备搜索结果给AI分析
    const searchResultsText = tavilyData.results
      .map((result: any, index: number) => {
        return `${index + 1}. 标题: ${result.title}\n   链接: ${result.url}\n   摘要: ${result.content}\n`;
      })
      .join("\n");

    console.log("🤖 使用AI分析搜索结果...");

    const aiResponse = await fetch("https://api.enter.pro/code/api/v1/ai/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2.5",
        messages: [
          {
            role: "user",
            content: `以下是搜索"${company} ${jobType}"得到的真实网页结果。请从中筛选出${jobType}岗位，并提取信息。

搜索结果：
${searchResultsText}

要求：
1. 只选择与"${company}"和"${jobType}"直接相关的岗位
2. 必须使用搜索结果中提供的**真实URL**（不要修改或创造URL）
3. 从标题和摘要中提取：岗位名称、工作地点、简短描述
4. 最多返回5个最相关的岗位
5. 以JSON数组格式返回，不要markdown代码块

返回格式：
[
  {
    "title": "从标题中提取的岗位名称",
    "location": "从内容中提取的城市名（如：北京、上海），找不到就用"未知"",
    "url": "搜索结果中的原始URL，必须完整保留",
    "description": "从摘要中提取的岗位描述（1-2句话）"
  }
]

如果搜索结果中没有相关的${jobType}岗位，返回空数组 []`,
          },
        ],
        stream: false,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("❌ AI调用失败:", errorText.substring(0, 500));
      throw new Error("AI分析失败");
    }

    const aiResult = await aiResponse.json();
    console.log("✅ AI分析完成");

    // 提取文本
    let aiText = "";
    if (aiResult.content && Array.isArray(aiResult.content)) {
      const textBlock = aiResult.content.find((block: any) => block.type === "text");
      if (textBlock) {
        aiText = textBlock.text;
      }
    }

    console.log("📋 AI返回:", aiText.substring(0, 300));

    // 解析JSON
    let jobs: any[];
    try {
      jobs = JSON.parse(aiText);
    } catch (e) {
      // 尝试提取JSON数组
      const jsonMatch = aiText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          jobs = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.error("❌ JSON解析失败");
          throw new Error("AI返回格式不正确");
        }
      } else {
        throw new Error("AI未返回JSON格式");
      }
    }

    // 验证和清理数据
    const validJobs = jobs.filter((job: any) => {
      return job.url && job.url.startsWith('http') && job.title;
    });

    if (validJobs.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `搜索结果中未找到"${company}"的${jobType}岗位，建议使用"链接导入"或"手动添加"`,
          jobs: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ 成功提取 ${validJobs.length} 个有效岗位`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `找到 ${validJobs.length} 个相关岗位`,
        jobs: validJobs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ 搜索失败:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "搜索失败，请重试",
        jobs: [],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
