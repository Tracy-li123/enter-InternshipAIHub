import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const COMPANY_MAP: Record<string, string> = {
  "bytedance.com": "字节跳动",
  "feishu.cn": "字节跳动",
  "meituan.com": "美团",
  "tencent.com": "腾讯",
  "qq.com": "腾讯",
  "alibaba.com": "阿里巴巴",
  "taobao.com": "阿里巴巴",
  "alipay.com": "蚂蚁集团",
  "antgroup.com": "蚂蚁集团",
  "xiaohongshu.com": "小红书",
  "xhs.cn": "小红书",
  "jd.com": "京东",
  "baidu.com": "百度",
  "didi.com": "滴滴",
  "kuaishou.com": "快手",
  "bilibili.com": "哔哩哔哩",
  "pinduoduo.com": "拼多多",
  "netease.com": "网易",
};

const GENERIC_TITLES = ["undefined", "null", "校园招聘", "社会招聘", "招聘首页", "jobdesc", "careers", "首页"];

function detectCompany(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    for (const [domain, company] of Object.entries(COMPANY_MAP)) {
      if (hostname.includes(domain)) return company;
    }
  } catch {}
  return null;
}

function isGenericTitle(title: string): boolean {
  const t = title.toLowerCase().trim();
  return !t || t.length < 4 || GENERIC_TITLES.some((g) => t.includes(g.toLowerCase()));
}

function cleanTitle(title: string, company: string): string {
  // Remove site name suffixes
  const suffixes = ["- 字节跳动", "- 美团", "- 腾讯", "- 阿里巴巴", "- 百度", "- 京东", "- 加入字节跳动", "字节跳动", "美团招聘", "腾讯招聘"];
  let t = title;
  for (const s of suffixes) {
    t = t.replace(new RegExp("\\s*[-|–]\\s*" + s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ".*$", "i"), "");
  }
  // Remove trailing " - CompanyName"
  t = t.replace(/\s*[-|–]\s*\S+$/, "").trim();
  // Remove "实习招聘", "招聘" suffixes from title cleaning
  t = t.replace(/实习招聘.*$/, "").replace(/招聘.*$/, "").trim();
  return t || title.split(/[-|–]/)[0].trim();
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

    console.log("processing:", url);

    if (url.includes("zhipin.com")) {
      return new Response(
        JSON.stringify({ success: false, error: "BOSS直聘暂不支持自动导入，请手动填写", needManualInput: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_62325baf28c7");
    const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
    if (!AI_API_TOKEN) throw new Error("AI token not configured");

    const knownCompany = detectCompany(url);
    console.log("known company:", knownCompany || "none");

    // === STRATEGY 1: Tavily search for known SPA companies ===
    // Tavily has indexed these pages with JS rendering - gets real job titles fast
    if (knownCompany && TAVILY_API_KEY) {
      console.log("strategy 1: Tavily URL search...");
      try {
        // Extract the core URL path (without query params for cleaner search)
        const urlObj = new URL(url);
        const searchQuery = urlObj.hostname + urlObj.pathname;

        const tavilyRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + TAVILY_API_KEY,
          },
          body: JSON.stringify({
            query: searchQuery,
            max_results: 3,
            search_depth: "basic",
          }),
        });

        if (tavilyRes.ok) {
          const tavilyData = await tavilyRes.json();
          const results = tavilyData.results || [];
          console.log("Tavily found:", results.length, "results");

          // Find the result that matches our URL most closely
          let bestResult = null;
          for (const r of results) {
            if (r.url && (r.url.includes(urlObj.pathname) || urlObj.pathname.includes(r.url.split("?")[0].split("/").pop()))) {
              bestResult = r;
              break;
            }
          }
          // Fall back to first result if no exact match
          if (!bestResult && results.length > 0) {
            bestResult = results[0];
          }

          if (bestResult && bestResult.title && !isGenericTitle(bestResult.title)) {
            const jobTitle = cleanTitle(bestResult.title, knownCompany);
            console.log("Tavily title:", jobTitle);

            if (jobTitle && jobTitle.length > 2) {
              // Extract location from content
              const content = bestResult.content || "";
              const cities = ["北京", "上海", "杭州", "深圳", "广州", "成都", "武汉", "南京", "西安", "重庆"];
              let location = "未知";
              for (const city of cities) {
                if (content.includes(city)) { location = city; break; }
              }

              // Save to DB
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
              const categoryId = matchCategory(jobTitle, categories || []);

              const { data: newJob, error: insertError } = await supabase
                .from("jobs")
                .insert({
                  title: jobTitle,
                  company: knownCompany,
                  location,
                  description: content.substring(0, 500),
                  source_url: url,
                  category_id: categoryId,
                  published_at: new Date().toISOString(),
                  scraped_at: new Date().toISOString(),
                })
                .select()
                .single();

              if (insertError) throw insertError;
              console.log("Tavily strategy success:", newJob.title);
              return new Response(
                JSON.stringify({ success: true, message: "导入成功: " + jobTitle, job: newJob }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
        }
      } catch (e: any) {
        console.log("Tavily strategy failed:", e.message, "- falling back");
      }
    }

    // === STRATEGY 2: Direct HTML fetch - works for SSR sites (实习僧, 牛客, etc.) ===
    console.log("strategy 2: direct HTML fetch...");
    let pageTitle = "";
    let htmlBody = "";

    try {
      const directRes = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
          "Accept-Language": "zh-CN,zh;q=0.9",
        },
        signal: AbortSignal.timeout(6000),
      });
      if (directRes.ok) {
        const html = await directRes.text();
        const titleMatch = html.match(/<title[^>]*>([^<]{3,120})<\/title>/i);
        if (titleMatch) pageTitle = titleMatch[1].trim();

        const stripped = html
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (stripped.length > 200) htmlBody = stripped;
        console.log("direct fetch: title=", pageTitle, "body length=", htmlBody.length);
      }
    } catch (e: any) {
      console.log("direct fetch error:", e.message);
    }

    // If SSR site with useful title - fast AI extraction
    if (pageTitle && !isGenericTitle(pageTitle) && htmlBody.length > 100) {
      console.log("strategy 2 success: SSR site with title");
      const company = knownCompany || "";
      const cleanedTitle = cleanTitle(pageTitle, company);

      const aiRes = await fetch("https://api.enter.pro/code/api/v1/ai/chat/completions", {
        method: "POST",
        headers: { "Authorization": "Bearer " + AI_API_TOKEN, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "moonshotai/kimi-k2.5",
          messages: [
            { role: "system", content: "你是招聘信息提取助手。从给定内容提取岗位信息，返回纯JSON。" },
            { role: "user", content: "页面标题: " + cleanedTitle + (company ? "\n公司: " + company : "") + "\n\n正文:\n" + htmlBody.substring(0, 3000) + "\n\n返回JSON: {\"title\":\"岗位名称\",\"company\":\"公司名\",\"location\":\"工作城市\",\"description\":\"岗位职责简述\"}" },
          ],
          stream: false,
          max_tokens: 600,
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const aiText = aiData.choices?.[0]?.message?.content || "";
        let jobInfo: any;
        try { jobInfo = JSON.parse(aiText); } catch {
          const m = aiText.match(/\{[\s\S]*\}/);
          if (m) { try { jobInfo = JSON.parse(m[0]); } catch {} }
        }
        if (jobInfo?.title && jobInfo?.company) {
          if (knownCompany) jobInfo.company = knownCompany;
          return await saveJob(jobInfo, url);
        }
      }
    }

    // === STRATEGY 3: Jina fallback (last resort) ===
    console.log("strategy 3: Jina fallback...");
    const jinaContent = htmlBody.length > 200 ? htmlBody : await fetchViaJina(url);
    const content = jinaContent.substring(0, 4000);

    if (content.length < 100) {
      return new Response(
        JSON.stringify({ success: false, error: "无法获取页面内容，请手动填写岗位信息", needManualInput: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiRes = await fetch("https://api.enter.pro/code/api/v1/ai/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + AI_API_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2.5",
        messages: [
          { role: "system", content: "You are a job info extractor. Return only JSON, no markdown." },
          { role: "user", content: "Extract job info and return JSON: {\"title\":\"job title\",\"company\":\"company\",\"location\":\"city\",\"description\":\"description\"}\n\nContent:\n" + content },
        ],
        stream: false,
        max_tokens: 800,
      }),
    });

    if (!aiRes.ok) throw new Error("AI分析失败");
    const aiData = await aiRes.json();
    const aiText = aiData.choices?.[0]?.message?.content || "";
    let jobInfo: any;
    try { jobInfo = JSON.parse(aiText); } catch {
      const m = aiText.match(/\{[\s\S]*\}/);
      if (m) { try { jobInfo = JSON.parse(m[0]); } catch {} }
    }

    if (knownCompany && jobInfo) jobInfo.company = knownCompany;

    if (!jobInfo?.title || !jobInfo?.company) {
      return new Response(
        JSON.stringify({ success: false, error: "无法提取岗位信息，请手动填写", needManualInput: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return await saveJob(jobInfo, url);

  } catch (error: any) {
    console.error("import failed:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "导入失败，请重试" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function saveJob(jobInfo: any, sourceUrl: string): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: existing } = await supabase.from("jobs").select("id").eq("source_url", sourceUrl).maybeSingle();
  if (existing) {
    return new Response(
      JSON.stringify({ success: true, message: "job already exists", jobId: existing.id, isDuplicate: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: categories } = await supabase.from("job_categories").select("*");
  const categoryId = matchCategory(jobInfo.title, categories || []);

  const { data: newJob, error } = await supabase
    .from("jobs")
    .insert({
      title: (jobInfo.title || "").trim(),
      company: (jobInfo.company || "").trim(),
      location: (jobInfo.location || "").trim() || "未知",
      description: (jobInfo.description || "").trim(),
      source_url: sourceUrl,
      category_id: categoryId,
      published_at: new Date().toISOString(),
      scraped_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  console.log("saved:", newJob.title);
  return new Response(
    JSON.stringify({ success: true, message: "导入成功: " + jobInfo.title, job: newJob }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function fetchViaJina(url: string): Promise<string> {
  try {
    const res = await fetch("https://r.jina.ai/" + url, {
      headers: { "Accept": "application/json", "X-Return-Format": "markdown", "X-Timeout": "5" },
    });
    if (!res.ok) return "";
    const data = await res.json();
    return (data.data?.content || data.content || "");
  } catch {
    return "";
  }
}

function matchCategory(title: string, categories: any[]) {
  const lower = title.toLowerCase();
  const cnKeyMap: Record<string, string[]> = {
    "产品": ["产品", "pm", "product"],
    "运营": ["运营", "增长", "operation"],
    "数据": ["数据", "分析", "商分", "商业分析", "data", "analyst"],
    "算法": ["算法", "机器学习", "深度学习", "ai", "ml", "nlp"],
    "开发": ["开发", "工程", "前端", "后端", "engineer", "developer", "software"],
    "设计": ["设计", "design", "ui", "ux"],
    "市场": ["市场", "营销", "品牌", "marketing"],
  };
  for (const [catName, keywords] of Object.entries(cnKeyMap)) {
    if (keywords.some((k) => lower.includes(k))) {
      return categories.find((c: any) => c.name === catName)?.id;
    }
  }
  return categories.find((c: any) => c.name === "其他")?.id;
}
