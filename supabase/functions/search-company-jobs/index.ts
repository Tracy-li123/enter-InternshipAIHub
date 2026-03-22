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

    console.log(`🔍 搜索：${company} ${jobType}岗位`);

    // 使用 Kimi AI 的联网搜索能力
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_62325baf28c7");
    if (!AI_API_TOKEN) {
      throw new Error("AI配置未找到");
    }

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
            content: `请帮我搜索"${company}"公司最新的"${jobType}"岗位。

**重要要求**：
1. 必须联网搜索真实的招聘信息
2. 返回的链接必须是可以直接访问的真实URL（完整的https://开头的链接）
3. 优先搜索：
   - ${company}公司官方招聘网站（如 jobs.bytedance.com）
   - 主流招聘平台（拉勾网、智联招聘、BOSS直聘等）
4. 只返回${jobType}相关的岗位
5. 每个岗位必须包含：岗位名称、工作地点、完整的岗位详情链接、简短描述

返回格式（纯JSON，不要markdown代码块）：
[
  {
    "title": "具体岗位名称",
    "location": "城市名称",
    "url": "完整的https://链接",
    "description": "岗位职责和要求的简短描述"
  }
]

**注意**：url字段必须是真实可访问的完整链接，例如：
- https://jobs.bytedance.com/campus/position/7612481443608709381/detail
- https://www.lagou.com/jobs/12345678.html

如果找不到真实链接，请返回空数组 []`,
          },
        ],
        stream: false,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("❌ AI调用失败:", errorText.substring(0, 500));
      throw new Error("AI搜索失败");
    }

    const aiResult = await aiResponse.json();
    console.log("✅ AI搜索完成");

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

    // 验证数据
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `未找到"${company}"的${jobType}岗位，请尝试更换关键词`,
          jobs: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ 找到 ${jobs.length} 个岗位`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `找到 ${jobs.length} 个相关岗位`,
        jobs: jobs,
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
