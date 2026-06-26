import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
      console.log("direct fetch content too short (" + text.length + " chars), falling back to Jina");
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
        JSON.stringify({ success: false, error: "BOSS zhipin cannot be scraped, please use manual entry", needManualInput: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_62325baf28c7");
    if (!AI_API_TOKEN) throw new Error("AI token not configured");

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

    const trimmedContent = content.slice(0, 5000);
    console.log("content trimmed to:", trimmedContent.length, "chars");

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
            content: "You are a job info extractor. Return only JSON, no markdown, no extra text.",
          },
          {
            role: "user",
            content: "Extract job info from the content below. Return exactly this JSON: {\"title\":\"specific job title only (no company name)\",\"company\":\"company name\",\"location\":\"city\",\"description\":\"job description\"}\n\nContent:\n" + trimmedContent,
          },
        ],
        stream: false,
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI call failed:", errorText.slice(0, 300));
      throw new Error("AI analysis failed");
    }

    const aiResult = await aiResponse.json();
    const aiText = (aiResult.choices && aiResult.choices[0] && aiResult.choices[0].message)
      ? aiResult.choices[0].message.content
      : "";
    console.log("AI text preview:", aiText.slice(0, 200));

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
        JSON.stringify({ success: false, error: "AI could not extract job info, please use manual entry", needManualInput: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const categories = categoriesResult.data || [];
    const categoryId = matchCategory(jobInfo.title, categories);

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
  const keyMap: Record<string, string[]> = {
    "\u4ea7\u54c1": ["\u4ea7\u54c1", "product", "pm"],
    "\u8fd0\u8425": ["\u8fd0\u8425", "\u589e\u957f", "operations", "growth"],
    "\u5e02\u573a": ["\u5e02\u573a", "\u8425\u9500", "marketing", "brand", "\u516c\u5173"],
    "\u6218\u7565": ["\u6218\u7565", "\u6218\u89c4", "strategy", "strategic"],
    "\u5546\u5206": ["\u5546\u5206", "\u5546\u4e1a\u5206\u6790", "\u4e1a\u52a1\u5206\u6790", "\u6570\u636e\u5206\u6790", "business analyst", "analytics", "analyst"],
  };
  for (const [catName, keywords] of Object.entries(keyMap)) {
    if (keywords.some((k) => lower.includes(k.toLowerCase()))) {
      return categories.find((c: any) => c.name === catName)?.id;
    }
  }
  return categories.find((c: any) => c.name === "\u5176\u4ed6")?.id;
}
