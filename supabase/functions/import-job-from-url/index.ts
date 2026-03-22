import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "请提供岗位链接" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("🔍 开始处理:", url);

    // 步骤1: 使用Jina AI Reader获取页面内容（支持JavaScript渲染）
    console.log("📄 使用Jina AI Reader抓取内容...");
    const jinaResponse = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        "Accept": "application/json",
        "X-Return-Format": "markdown",
      },
    });

    if (!jinaResponse.ok) {
      throw new Error("无法访问该网页");
    }

    const jinaData = await jinaResponse.json();
    const content = jinaData.data?.content || jinaData.content || "";
    
    console.log("✅ 获取内容成功，长度:", content.length);
    console.log("📝 内容预览:", content.substring(0, 500));

    if (content.length < 100) {
      throw new Error("网页内容为空");
    }

    // 步骤2: 使用AI分析内容
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_62325baf28c7");
    if (!AI_API_TOKEN) {
      throw new Error("AI配置未找到");
    }

    console.log("🤖 使用AI提取岗位信息...");

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
            content: `你是招聘信息提取专家。请从以下内容中提取岗位信息。

内容：
${content.substring(0, 30000)}

请提取以下信息并以JSON格式返回：
1. title: 岗位名称（必须包含，如果是实习岗位要保留"实习"字样）
2. company: 公司名称（必须包含）
3. location: 工作地点（如：北京、上海等）
4. description: 完整的职位描述（包括职责和要求，尽可能详细）

要求：
- 只返回JSON，不要其他文字
- 不要使用markdown代码块
- 如果找不到某个字段，用空字符串""

返回格式：
{"title":"","company":"","location":"","description":""}`,
          },
        ],
        stream: false,
        max_tokens: 4000,
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

    console.log("📋 AI返回内容:", aiText.substring(0, 300));

    // 解析JSON
    let jobInfo: any;
    try {
      // 尝试直接解析
      jobInfo = JSON.parse(aiText);
    } catch (e) {
      // 尝试提取JSON
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          jobInfo = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.error("❌ JSON解析失败");
          throw new Error("AI返回格式不正确");
        }
      } else {
        throw new Error("AI未返回JSON格式");
      }
    }

    console.log("✅ 提取信息:", {
      title: jobInfo.title?.substring(0, 50),
      company: jobInfo.company,
      location: jobInfo.location,
      descLength: jobInfo.description?.length || 0,
    });

    // 验证必填字段
    if (!jobInfo.title || !jobInfo.company) {
      console.error("❌ 缺少必填字段 - title:", jobInfo.title, "company:", jobInfo.company);
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI未能识别完整信息，请尝试手动添加",
          needManualInput: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 步骤3: 保存到数据库
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 检查重复
    const { data: existing } = await supabase
      .from('jobs')
      .select('id')
      .eq('source_url', url)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "该岗位已存在",
          jobId: existing.id,
          isDuplicate: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 匹配分类
    const { data: categories } = await supabase.from('job_categories').select('*');
    const categoryId = matchCategory(jobInfo.title, categories || []);

    // 插入数据
    const { data: newJob, error: insertError } = await supabase
      .from('jobs')
      .insert({
        title: jobInfo.title.trim(),
        company: jobInfo.company.trim(),
        location: jobInfo.location?.trim() || '未知',
        description: jobInfo.description?.trim() || '',
        source_url: url,
        category_id: categoryId,
        published_at: new Date().toISOString(),
        scraped_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ 数据库插入失败:", insertError);
      throw insertError;
    }

    console.log("✅ 导入成功!");

    return new Response(
      JSON.stringify({
        success: true,
        message: `✨ 成功导入《${jobInfo.title}》`,
        job: newJob,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ 导入失败:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "导入失败，请重试",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function matchCategory(title: string, categories: any[]) {
  const lower = title.toLowerCase();
  
  for (const cat of categories) {
    if (lower.includes(cat.name.toLowerCase())) {
      return cat.id;
    }
  }

  if (lower.includes('产品')) return categories.find(c => c.name.includes('产品'))?.id;
  if (lower.includes('运营')) return categories.find(c => c.name.includes('运营'))?.id;
  if (lower.includes('数据')) return categories.find(c => c.name.includes('数据'))?.id;
  if (lower.includes('算法')) return categories.find(c => c.name.includes('算法'))?.id;
  if (lower.includes('开发') || lower.includes('工程')) return categories.find(c => c.name.includes('开发'))?.id;

  return categories[0]?.id;
}
