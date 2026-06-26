import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Fast direct fetch, fallback to Jina if blocked or content too short
async function fetchPageContent(url: string): Promise<string> {
  // Try direct fetch first (nearly instant for static pages)
  try {
    console.log("trying direct fetch...");
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const html = await res.text();
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      // Require substantial content — JS-rendered pages typically return < 1500 chars of shell
      if (text.length > 1500) {
        console.log("direct fetch ok, length:", text.length);
        return text;
      }
      console.log("direct fetch content too short (" + text.length + " chars), falling back to Jina");
    }
  } catch (e: any) {
    console.log("direct fetch failed:", e.message);
  }

  // Fallback: Jina AI Reader (renders JS pages properly)
  console.log("falling back to Jina...");
  const jinaRes = await fetch("https://r.jina.ai/" + url, {
    headers: { "Accept": "application/json", "X-Return-Format": "markdown", "X-Timeout": "15" },
    signal: AbortSignal.timeout(20000),
  });
  if (!jinaRes.ok) throw new Error("cannot access the webpage");
  const jinaData = await jinaRes.json();
  const content = (jinaData.data && jinaData.data.content) ? jinaData.data.content : (jinaData.content || "");
  if (content.length < 100) throw new Error("webpage content is empty or blocked");
  console.log("jina fetch ok, length:", content.length);
  return content;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "please provide url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("start processing:", url);

    if (url.includes("zhipin.com")) {
      return new Response(
        JSON.stringify({ success: false, error: "BOSS直聘无法抓取，请使用手动添加", needManualInput: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_62325baf28c7");
    if (!AI_API_TOKEN) throw new Error("AI token not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parallel: fetch page content + check duplicate + load categories
    const [content, existingResult, categoriesResult] = await Promise.all([
      fetchPageContent(url),
      supabase.from("jobs").select("id").eq("source_url", url).maybeSingle(),
      supabase.from("job_categories").select("*"),
    ]);

    if (existingResult.data) {
      return new Response(
        JSON.stringify({ success: true, message: "岗位已存在", jobId: existingResult.data.id, isDuplicate: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only send first 5000 chars — enough for any job listing
    const trimmedContent = content.slice(0, 5000);
    console.log("content trimmed to:", trimmedContent.length, "chars");

    // AI extraction using Qwen 3.6 Plus (fast + low cost)
    console.log("calling Qwen for extraction...");

    const aiResponse = await fetch("https://api.enter.pro/code/api/v1/ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + AI_API_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "alibaba/qwen-3.6-plus",
        messages: [
          {
            role: "system",
            content: "你是招聘信息提取助手。只返回JSON，不要markdown，不要其他文字。",
          },
          {
            role: "user",
            content: "从以下网页内容中提取岗位信息，返回格式：{\"title\":\"具体岗位名称（不要公司名）\",\"company\":\"公司名称\",\"location\":\"工作城市\",\"description\":\"岗位描述\"}\n\n内容：\n" + trimmedContent,
          },
        ],
        stream: false,
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI call failed:", errorText.slice(0, 300));
      throw new Error("AI分析失败");
    }

    const aiResult = await aiResponse.json();
    const aiText = (aiResult.choices && aiResult.choices[0] && aiResult.choices[0].message)
      ? aiResult.choices[0].message.content
      : "";
    console.log("AI text preview:", aiText.slice(0, 200));

    // Parse JSON
    let jobInfo: any;
    try {
      jobInfo = JSON.parse(aiText);
    } catch {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { jobInfo = JSON.parse(jsonMatch[0]); } catch { jobInfo = null; }
      }
    }

    if (!jobInfo || !jobInfo.title || !jobInfo.company) {
      return new Response(
        JSON.stringify({ success: false, error: "AI无法提取岗位信息，请使用手动添加", needManualInput: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to database
    const categories = categoriesResult.data || [];
    const categoryId = matchCategory(jobInfo.title, categories);

    const { data: newJob, error: insertError } = await supabase
      .from("jobs")
      .insert({
        title: jobInfo.title.trim(),
        company: jobInfo.company.trim(),
        location: (jobInfo.location || "").trim() || "未知",
        description: (jobInfo.description || "").trim(),
        source_url: url,
        category_id: categoryId,
        published_at: new Date().toISOString(),
        scraped_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log("import success:", newJob.title);
    return new Response(
      JSON.stringify({ success: true, message: "导入成功：" + jobInfo.title, job: newJob }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("import failed:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "导入失败，请重试" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function matchCategory(title: string, categories: any[]) {
  const lower = title.toLowerCase();
  const cnKeyMap: Record<string, string[]> = {
    "产品": ["产品"], "运营": ["运营", "增长"], "数据": ["数据", "分析"],
    "算法": ["算法", "机器学习", "深度学习"], "开发": ["开发", "工程", "前端", "后端"],
    "设计": ["设计"], "市场": ["市场", "营销"],
  };
  const enKeyMap: Record<string, string[]> = {
    "产品": ["product", "pm"], "运营": ["operations", "growth"], "数据": ["data", "analyst", "analytics"],
    "算法": ["algorithm", "ai", "ml", "machine learning"], "开发": ["engineer", "developer", "frontend", "backend"],
    "设计": ["design", "ui", "ux"], "市场": ["marketing", "brand"],
  };
  for (const [catName, keywords] of Object.entries(cnKeyMap)) {
    if (keywords.some((k) => lower.includes(k))) {
      return categories.find((c: any) => c.name === catName)?.id;
    }
  }
  for (const [catName, keywords] of Object.entries(enKeyMap)) {
    if (keywords.some((k) => lower.includes(k))) {
      return categories.find((c: any) => c.name === catName)?.id;
    }
  }
  return categories.find((c: any) => c.name === "其他")?.id;
}
