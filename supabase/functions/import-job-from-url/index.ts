import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "请提供岗位链接" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("🔍 开始处理:", url);

    // BOSS直聘特殊处理
    if (url.includes('zhipin.com')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "BOSS直聘有严格的反爬虫机制，暂时无法自动导入。\n\n请切换到"手动添加"标签，复制岗位信息手动录入。",
          needManualInput: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 步骤1: 使用Jina AI Reader获取页面内容
    console.log("📄 使用Jina AI Reader抓取内容...");
    const jinaResponse = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        "Accept": "application/json",
        "X-Return-Format": "markdown",
        "X-Timeout": "10",
      },
    });

    if (!jinaResponse.ok) {
      console.error("❌ Jina返回错误:", jinaResponse.status);
      throw new Error("无法访问该网页");
    }

    const jinaData = await jinaResponse.json();
    const content = jinaData.data?.content || jinaData.content || "";
    console.log("✅ 获取内容成功，长度:", content.length);

    if (content.length < 100) {
      throw new Error("网页内容为空或被拦截，请尝试手动添加");
    }

    // 步骤2: 使用AI分析内容（使用正确的 OpenAI Chat Completions 协议）
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_62325baf28c7");
    if (!AI_API_TOKEN) throw new Error("AI配置未找到");

    console.log("🤖 使用AI提取岗位信息...");

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
            content: "你是招聘信息提取专家。只返回JSON，不要其他文字，不要markdown代码块。",
          },
          {
            role: "user",
            content: `从以下内容中提取岗位信息，返回JSON格式：
{"title":"岗位名称","company":"公司名称","location":"工作地点","description":"完整职位描述"}

内容：
${content.substring(0, 20000)}`,
          },
        ],
        stream: false,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("❌ AI调用失败:", errorText.substring(0, 300));
      throw new Error("AI分析失败，请稍后重试");
    }

    const aiResult = await aiResponse.json();
    console.log("✅ AI分析完成");

    // 提取文本（OpenAI Chat Completions 响应格式）
    const aiText = aiResult.choices?.[0]?.message?.content || "";
    console.log("📋 AI返回:", aiText.substring(0, 300));

    // 解析JSON
    let jobInfo: any;
    try {
      jobInfo = JSON.parse(aiText);
    } catch {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jobInfo = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("AI未能识别岗位信息，请尝试手动添加");
      }
    }

    if (!jobInfo.title || !jobInfo.company) {
      return new Response(
        JSON.stringify({ success: false, error: "AI未能识别完整信息，请尝试手动添加", needManualInput: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        JSON.stringify({ success: true, message: "该岗位已存在", jobId: existing.id, isDuplicate: true }),
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

    if (insertError) throw insertError;

    console.log("✅ 导入成功:", newJob.title);

    return new Response(
      JSON.stringify({ success: true, message: `✨ 成功导入《${jobInfo.title}》`, job: newJob }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ 导入失败:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "导入失败，请重试" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function matchCategory(title: string, categories: any[]) {
  const lower = title.toLowerCase();
  const map: Record<string, string[]> = {
    '产品': ['产品', 'product', 'pm'],
    '运营': ['运营', '增长', 'operation'],
    '数据': ['数据', 'data', '分析', '商业智能'],
    '算法': ['算法', 'ai', '机器学习', '深度学习', 'nlp'],
    '开发': ['开发', '工程', 'engineer', 'developer', '前端', '后端', 'java', 'python'],
    '设计': ['设计', 'design', 'ui', 'ux'],
    '市场': ['市场', '营销', 'marketing', '品牌', '公关'],
  };
  for (const [catName, keywords] of Object.entries(map)) {
    if (keywords.some(k => lower.includes(k))) {
      return categories.find((c: any) => c.name === catName)?.id;
    }
  }
  return categories.find((c: any) => c.name === '其他')?.id;
}
