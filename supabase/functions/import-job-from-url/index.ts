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

    console.log("🔍 AI智能分析:", url);

    // 步骤1: 抓取网页HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error("无法访问该网页");
    }

    const html = await response.text();
    console.log("✅ HTML获取:", html.length, "字符");

    // 步骤2: 使用AI模型解析网页内容
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_62325baf28c7");
    if (!AI_API_TOKEN) {
      throw new Error("AI配置未找到");
    }

    console.log("🤖 调用Kimi AI...");

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
            content: `你是招聘信息提取专家。请从HTML中提取岗位信息，返回JSON。

要求：
1. 提取：title（岗位名称）、company（公司）、location（地点）、description（完整职位描述）
2. 保留"实习"字样
3. description要完整，包括职责和要求
4. 无法提取的字段用空字符串
5. 只返回JSON，不要其他文字

HTML（前50000字符）：
${html.substring(0, 50000)}

返回格式（不要markdown）：
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
    console.log("✅ AI响应成功");

    // 提取AI返回的文本内容
    let aiText = "";
    if (aiResult.content && Array.isArray(aiResult.content)) {
      const textBlock = aiResult.content.find((block: any) => block.type === "text");
      if (textBlock) {
        aiText = textBlock.text;
      }
    }

    console.log("📄 AI返回:", aiText.substring(0, 300));

    // 解析JSON
    let jobInfo: any;
    try {
      jobInfo = JSON.parse(aiText);
    } catch (e) {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jobInfo = JSON.parse(jsonMatch[0]);
      } else {
        console.error("❌ JSON解析失败");
        throw new Error("AI返回格式不正确");
      }
    }

    console.log("✅ 提取结果:", {
      title: jobInfo.title?.substring(0, 50),
      company: jobInfo.company,
      location: jobInfo.location,
      descLength: jobInfo.description?.length || 0,
    });

    if (!jobInfo.title || !jobInfo.company) {
      console.error("❌ 缺少必填字段");
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

    const { data: categories } = await supabase.from('job_categories').select('*');
    const categoryId = matchCategory(jobInfo.title, categories || []);

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
      console.error("❌ 插入失败:", insertError);
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
