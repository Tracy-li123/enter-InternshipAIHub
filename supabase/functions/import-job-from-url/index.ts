import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getUserIdFromToken(req: Request): string | null {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

async function fetchPageContent(url: string): Promise<string> {
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
      if (text.length > 1500) {
        console.log("direct fetch ok, length:", text.length);
        return text;
      }
    }
  } catch (e: any) {
    console.log("direct fetch failed:", e.message);
  }

  console.log("falling back to Jina...");
  const jinaRes = await fetch("https://r.jina.ai/" + url, {
    headers: { "Accept": "application/json", "X-Return-Format": "markdown", "X-Timeout": "15" },
    signal: AbortSignal.timeout(20000),
  });
  if (!jinaRes.ok) throw new Error("cannot access the webpage");
  const jinaData = await jinaRes.json();
  const content = (jinaData.data && jinaData.data.content) ? jinaData.data.content : (jinaData.content || "");
  if (content.length < 100) throw new Error("webpage content is empty or blocked");
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

    const userId = getUserIdFromToken(req);

    if (url.includes("zhipin.com")) {
      return new Response(
        JSON.stringify({ success: false, error: "BOSS直聘无法抓取，请手动填写岗位信息", needManualInput: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) throw new Error("DeepSeek API key not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [content, existingResult, categoriesResult] = await Promise.all([
      fetchPageContent(url),
      supabase.from("jobs").select("id").eq("source_url", url).maybeSingle(),
      supabase.from("job_categories").select("*"),
    ]);

    if (existingResult.data) {
      return new Response(
        JSON.stringify({ success: true, message: "job already exists", jobId: existingResult.data.id, isDuplicate: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedContent = content.slice(0, 6000);

    console.log("calling DeepSeek for extraction...");
    const aiResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + DEEPSEEK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a job info extractor. Return only valid JSON, no markdown fences, no extra text.",
          },
          {
            role: "user",
            content: `Extract job info from the content below. Return exactly this JSON structure:
{
  "title": "specific job title (no company name)",
  "company": "company name",
  "location": "city or region",
  "description": "job responsibilities and duties (preserve structure: use numbered lists like 1. 2. 3. or bullet points - for each item, keep original format)",
  "requirements": "job requirements and qualifications (preserve structure: use numbered lists or bullet points, keep original format)"
}

Rules:
- Keep description and requirements as separate fields
- Preserve numbered lists and bullet points from the original
- If requirements section doesn't exist separately, extract any qualification/requirement sentences into requirements field
- Use the original language (Chinese if source is Chinese)

Content:
${trimmedContent}`,
          },
        ],
        stream: false,
        max_tokens: 2500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("DeepSeek call failed:", errorText.slice(0, 300));
      throw new Error("AI analysis failed");
    }

    const aiResult = await aiResponse.json();
    const aiText = (aiResult.choices && aiResult.choices[0] && aiResult.choices[0].message)
      ? aiResult.choices[0].message.content
      : "";

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
        JSON.stringify({ success: false, error: "AI无法提取岗位信息，请手动填写", needManualInput: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const categories = categoriesResult.data || [];
    const categoryId = matchCategory(jobInfo.title, categories, userId);

    const { data: newJob, error: insertError } = await supabase
      .from("jobs")
      .insert({
        title: jobInfo.title.trim(),
        company: jobInfo.company.trim(),
        location: (jobInfo.location || "").trim() || "未知",
        description: (jobInfo.description || "").trim(),
        requirements: (jobInfo.requirements || "").trim(),
        source_url: url,
        category_id: categoryId,
        user_id: userId,
        published_at: new Date().toISOString(),
        scraped_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, message: "导入成功: " + jobInfo.title, job: newJob }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("import failed:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "导入失败" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function matchCategory(title: string, categories: any[], userId: string | null) {
  const lower = title.toLowerCase();
  const keyMap: Record<string, string[]> = {
    "产品": ["产品", "product", "pm"],
    "运营": ["运营", "增长", "operations", "growth"],
    "市场": ["市场", "营销", "marketing", "brand", "公关"],
    "战略": ["战略", "战规", "strategy", "strategic"],
    "商分": ["商分", "商业分析", "业务分析", "数据分析", "business analyst", "analytics", "analyst"],
  };
  for (const [catName, keywords] of Object.entries(keyMap)) {
    if (keywords.some((k) => lower.includes(k.toLowerCase()))) {
      const userCat = userId
        ? categories.find((c: any) => c.name === catName && c.user_id === userId)
        : null;
      return (userCat || categories.find((c: any) => c.name === catName))?.id;
    }
  }
  const userOther = userId
    ? categories.find((c: any) => c.name === "其他" && c.user_id === userId)
    : null;
  return (userOther || categories.find((c: any) => c.name === "其他"))?.id;
}
