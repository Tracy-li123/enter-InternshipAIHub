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
        JSON.stringify({ success: false, error: "please provide url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("start processing:", url);

    if (url.includes("zhipin.com")) {
      return new Response(
        JSON.stringify({ success: false, error: "BOSS zhipin cannot be scraped, please use manual entry", needManualInput: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: fetch content via Jina AI Reader
    console.log("fetching content via Jina...");
    const jinaResponse = await fetch("https://r.jina.ai/" + url, {
      headers: { "Accept": "application/json", "X-Return-Format": "markdown", "X-Timeout": "10" },
    });

    if (!jinaResponse.ok) {
      throw new Error("cannot access the webpage");
    }

    const jinaData = await jinaResponse.json();
    const content = (jinaData.data && jinaData.data.content) ? jinaData.data.content : (jinaData.content || "");
    console.log("content length:", content.length);

    if (content.length < 100) {
      throw new Error("webpage content is empty or blocked");
    }

    // Step 2: use AI to extract job info - OpenAI Chat Completions protocol
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_62325baf28c7");
    if (!AI_API_TOKEN) throw new Error("AI token not configured");

    console.log("calling AI via openai chat completions...");

    const aiResponse = await fetch("https://api.enter.pro/code/api/v1/ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + AI_API_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2.5",
        messages: [
          {
            role: "system",
            content: "You are a job info extractor. Return only JSON, no markdown, no extra text.",
          },
          {
            role: "user",
            content: "Extract job info from the content below and return JSON: {\"title\":\"job title\",\"company\":\"company name\",\"location\":\"city\",\"description\":\"full job description\"}\n\nContent:\n" + content.substring(0, 20000),
          },
        ],
        stream: false,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI call failed:", errorText.substring(0, 300));
      throw new Error("AI analysis failed");
    }

    const aiResult = await aiResponse.json();
    console.log("AI done, choices:", aiResult.choices ? aiResult.choices.length : 0);

    const aiText = (aiResult.choices && aiResult.choices[0] && aiResult.choices[0].message) 
      ? aiResult.choices[0].message.content 
      : "";
    console.log("AI text preview:", aiText.substring(0, 200));

    // parse JSON
    let jobInfo: any;
    try {
      jobInfo = JSON.parse(aiText);
    } catch {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jobInfo = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("AI did not return valid JSON");
      }
    }

    if (!jobInfo.title || !jobInfo.company) {
      return new Response(
        JSON.stringify({ success: false, error: "AI could not extract job info, please use manual entry", needManualInput: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: save to database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existing } = await supabase.from("jobs").select("id").eq("source_url", url).maybeSingle();
    if (existing) {
      return new Response(
        JSON.stringify({ success: true, message: "job already exists", jobId: existing.id, isDuplicate: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: categories } = await supabase.from("job_categories").select("*");
    const categoryId = matchCategory(jobInfo.title, categories || []);

    const { data: newJob, error: insertError } = await supabase
      .from("jobs")
      .insert({
        title: jobInfo.title.trim(),
        company: jobInfo.company.trim(),
        location: (jobInfo.location || "").trim() || "unknown",
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
      JSON.stringify({ success: true, message: "imported: " + jobInfo.title, job: newJob }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("import failed:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "import failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function matchCategory(title: string, categories: any[]) {
  const lower = title.toLowerCase();
  const map: Record<string, string[]> = {
    "product": ["product", "pm"],
    "operations": ["operations", "growth"],
    "data": ["data", "analyst", "analytics"],
    "algorithm": ["algorithm", "ai", "ml", "machine learning"],
    "engineering": ["engineering", "engineer", "developer", "frontend", "backend"],
    "design": ["design", "ui", "ux"],
    "marketing": ["marketing", "brand"],
  };
  const cnMap: Record<string, string> = {
    "product": "产品", "operations": "运营", "data": "数据",
    "algorithm": "算法", "engineering": "开发", "design": "设计", "marketing": "市场",
  };
  const cnKeyMap: Record<string, string[]> = {
    "产品": ["产品"], "运营": ["运营", "增长"], "数据": ["数据", "分析"],
    "算法": ["算法", "机器学习", "深度学习"], "开发": ["开发", "工程", "前端", "后端"],
    "设计": ["设计"], "市场": ["市场", "营销"],
  };
  for (const [catName, keywords] of Object.entries(cnKeyMap)) {
    if (keywords.some((k) => lower.includes(k))) {
      return categories.find((c: any) => c.name === catName)?.id;
    }
  }
  for (const [key, keywords] of Object.entries(map)) {
    if (keywords.some((k) => lower.includes(k))) {
      const cnName = cnMap[key];
      return categories.find((c: any) => c.name === cnName)?.id;
    }
  }
  return categories.find((c: any) => c.name === "其他")?.id;
}
