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

/**
 * Try ByteDance's internal JSON API first. As of late 2025 the public
 * `jobs.bytedance.com/api/v1/ats/campus/position/{id}/details` endpoint
 * returns an HTML shell (猎头平台) instead of JSON, and the site itself
 * often times out for datacenter egress IPs. The reliable fast path is to
 * ask Jina's renderer for just the <title> via X-Target-Selector, which
 * returns the real role name (e.g. "AI策略产品实习生-抖音电商").
 */
async function fetchBytedanceJob(url: string): Promise<string | null> {
  let title = "";

  // 1) Fast path: Jina renderer + X-Target-Selector:title (~3-5s)
  try {
    const jinaRes = await fetch("https://r.jina.ai/" + url, {
      headers: {
        "Accept": "application/json",
        "X-Return-Format": "markdown",
        "X-Timeout": "8",
        "X-Target-Selector": "title",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (jinaRes.ok) {
      const jinaData = await jinaRes.json();
      const content = (jinaData.data && jinaData.data.content) ? jinaData.data.content : (jinaData.content || "");
      title = content.replace(/-\s*加入字节跳动.*$/i, "").replace(/-\s*字节跳动.*$/i, "").replace(/[|\s]*字节跳动[|\s]*$/, "").trim();
      if (title && !/校园招聘|招聘|加入字节跳动/i.test(title)) {
        console.log("ByteDance title via Jina succeeded:", title);
      } else {
        title = "";
      }
    }
  } catch (e: any) {
    console.log("ByteDance Jina title attempt failed:", e.message);
  }

  // 1b) If we got the title, also try grabbing the full page via Jina so the
  //     description/requirements fields aren't empty. Best-effort, bounded.
  if (title) {
    try {
      const fullRes = await fetch("https://r.jina.ai/" + url, {
        headers: {
          "Accept": "application/json",
          "X-Return-Format": "markdown",
          "X-Timeout": "10",
          "X-Remove-Selector": "header,footer,nav,.nav,.header,.footer,.breadcrumb,.sidebar",
        },
        signal: AbortSignal.timeout(12000),
      });
      if (fullRes.ok) {
        const fullData = await fullRes.json();
        const fullContent = (fullData.data && fullData.data.content) ? fullData.data.content : (fullData.content || "");
        // Strip nav noise: drop markdown link-only lines ([text](url)), images,
        // and leading site-shell boilerplate.
        let clean = fullContent
          .split("\n")
          .filter((line: string) => {
            const trimmed = line.trim();
            // remove pure navigation link lines, images, empty heading links
            if (/^!\[/.test(trimmed)) return false; // images
            if (/^\[.*\]\(https?:\/\/[^)]*\)$/.test(trimmed)) return false; // nav links
            if (/^(首页|职位|招聘动态|登录|技术人才项目|社会招聘|产品与技术|成长与回报)$/.test(trimmed)) return false;
            return true;
          })
          .join("\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();

        // Detect an offline/expired posting
        if (/该职位已下线|职位已下线|已结束|已过期/.test(clean)) {
          console.log("ByteDance posting appears offline:", title);
          return JSON.stringify({ title, company: "字节跳动", location: "", description: "", requirements: "", category: "" });
        }

        if (clean.length > 300) {
          console.log("ByteDance full page via Jina, length:", clean.length);
          return JSON.stringify({ title, company: "字节跳动", location: "", description: clean.slice(0, 6000), requirements: "", category: "" });
        }
      }
    } catch (e: any) {
      console.log("ByteDance full page attempt failed:", e.message);
    }
    return JSON.stringify({ title, company: "字节跳动", location: "", description: "", requirements: "", category: "" });
  }

  // 2) Old JSON API — fails fast on non-JSON responses
  try {
    const match = url.match(/\/position\/(\d+)/);
    if (!match) return null;
    const positionId = match[1];
    const apiUrl = `https://jobs.bytedance.com/api/v1/ats/campus/position/${positionId}/details`;
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://jobs.bytedance.com/",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        const data = json?.data || json;
        const position = data?.position || data?.job || data;
        if (position?.name || position?.title) {
          const title = position.name || position.title || "";
          const company = "字节跳动";
          const location = (position.location_name_list || position.locations || []).join("、") || position.location || "";
          const description = position.job_description || position.description || "";
          const requirements = position.job_requirement || position.requirements || "";
          const category = position.category_name || position.job_category || "";
          console.log("ByteDance JSON API succeeded:", title);
          return JSON.stringify({ title, company, location, description, requirements, category });
        }
      }
    }
  } catch (e: any) {
    console.log("ByteDance API attempt failed:", e.message);
  }

  return null;
}

interface FetchResult {
  content: string;
  errorReason?: string;
}

/**
 * Next.js SSR/SSG pages embed a <script id="__NEXT_DATA__"> tag with the
 * server-rendered props as JSON. If pageProps has real data (not an empty
 * object), that's far cleaner and more reliable than scraping visible text.
 * Pure client-side-rendered Next.js pages (e.g. pddglobalhr.com) leave
 * pageProps empty — data only arrives after a signed API call in the
 * browser, which we cannot replicate server-side, so we just return null
 * and let the normal fallback chain continue.
 */
function extractNextData(html: string): string | null {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    const json = JSON.parse(match[1]);
    const pageProps = json?.props?.pageProps;
    if (!pageProps || Object.keys(pageProps).length === 0) return null;
    const text = JSON.stringify(pageProps);
    if (text.length < 200) return null;
    console.log("extracted __NEXT_DATA__ pageProps, length:", text.length);
    return text;
  } catch {
    return null;
  }
}

async function fetchPageContent(url: string): Promise<FetchResult> {
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

      // Prefer structured Next.js SSR data when available
      const nextData = extractNextData(html);
      if (nextData) {
        return { content: nextData };
      }

      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length > 1500) {
        console.log("direct fetch ok, length:", text.length);
        return { content: text };
      }
    }
  } catch (e: any) {
    console.log("direct fetch failed:", e.message);
  }

    console.log("falling back to Jina...");
  try {
    // Hash-routed SPAs (e.g. https://campus.jd.com/#/details?id=8006) put the
    // real route after "#". Per URL spec, everything after "#" is a client-side
    // fragment and is NEVER sent over the wire — fetch() strips it, so Jina would
    // only ever see the site's root path and return the homepage shell.
    // Encoding "#" as "%23" makes it a literal path segment Jina can navigate to.
    const jinaTargetUrl = url.includes("/#/") ? url.replace("/#/", "/%23/") : url;
    const jinaRes = await fetch("https://r.jina.ai/" + jinaTargetUrl, {
      headers: {
        "Accept": "application/json",
        "X-Return-Format": "markdown",
        "X-Timeout": "12",
        // Remove common nav/footer noise to get the main content
        "X-Remove-Selector": "header,footer,nav,.nav,.header,.footer,.breadcrumb,.sidebar",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!jinaRes.ok) {
      const rawText = await jinaRes.text();
      let reason = "该网站限制了自动抓取";
      try {
        const j = JSON.parse(rawText);
        if (j.name === "AbuseAlleviationError") {
          reason = "该网站页面为动态加载内容，第三方抓取服务暂时限流，请稍后重试或手动填写";
        } else if (j.message) {
          reason = "抓取失败：" + String(j.message).slice(0, 120);
        }
      } catch { /* keep default reason */ }
      console.log("Jina failed:", jinaRes.status, reason);
      return { content: "", errorReason: reason };
    }

    const jinaData = await jinaRes.json();
    const content = (jinaData.data && jinaData.data.content) ? jinaData.data.content : (jinaData.content || "");
    if (content.length < 100) {
      // Last resort: many SPA sites still expose a descriptive <title> (e.g.
      // "产品经理实习生 - XX招聘"). Grab it so the AI can at least extract a title.
      try {
        const titleRes = await fetch("https://r.jina.ai/" + jinaTargetUrl, {
          headers: {
            "Accept": "application/json",
            "X-Return-Format": "markdown",
            "X-Timeout": "8",
            "X-Target-Selector": "title",
          },
          signal: AbortSignal.timeout(10000),
        });
        if (titleRes.ok) {
          const titleData = await titleRes.json();
          const titleContent = (titleData.data && titleData.data.content) ? titleData.data.content : (titleData.content || "");
          if (titleContent && !/^(首页|登录|招聘|校园招聘|加入我们)$/.test(titleContent.trim())) {
            console.log("Jina title fallback got:", titleContent);
            return { content: "TITLE_ONLY:" + titleContent.trim() };
          }
        }
      } catch { /* ignore */ }
      return { content: "", errorReason: "网页内容为空，可能需要登录或存在反爬保护" };
    }
    return { content };
  } catch (e: any) {
    console.log("Jina fetch threw:", e.message);
    return { content: "", errorReason: "抓取超时或网络异常，请稍后重试" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Overall budget: answer within ~22s so the browser never sees a
    //    network-level timeout ("Failed to send a request to the Edge Function").
    const result = await Promise.race([
      handleImport(req),
      new Promise<Response>((resolve) =>
        setTimeout(
          () =>
            resolve(
              new Response(
                JSON.stringify({
                  success: false,
                  error: "处理超时，该网站响应较慢。请稍后重试，或直接手动填写岗位信息。",
                  needManualInput: true,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              )
            ),
          22000
        )
      ),
    ]);
    return result;
  } catch (error: any) {
    console.error("import failed:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "导入失败" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleImport(req: Request): Promise<Response> {
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

    const [existingResult, categoriesResult] = await Promise.all([
      supabase.from("jobs").select("id").eq("source_url", url).maybeSingle(),
      supabase.from("job_categories").select("*"),
    ]);

    if (existingResult.data) {
      return new Response(
        JSON.stringify({ success: true, message: "job already exists", jobId: existingResult.data.id, isDuplicate: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Try ByteDance internal API first (much more reliable for their SPA) ──
    let directJson: string | null = null;
    if (url.includes("bytedance.com") || url.includes("jobs.bytedance")) {
      directJson = await fetchBytedanceJob(url);
    }

    let jobInfo: any = null;

    if (directJson) {
      // Parse structured data directly, no AI needed for basic fields
      try {
        const parsed = JSON.parse(directJson);
        if (parsed.title && parsed.company) {
          jobInfo = parsed;
          console.log("ByteDance API extraction succeeded:", parsed.title);
        }
      } catch { /* fall through to AI */ }
    }

    if (!jobInfo) {
      // ── Fallback: scrape + AI extraction ──
      const fetchResult = await fetchPageContent(url);

      if (!fetchResult.content) {
        // Return 200 with a clear reason instead of a generic 500 "network error"
        return new Response(
          JSON.stringify({
            success: false,
            error: fetchResult.errorReason || "该网页无法自动抓取，请手动填写岗位信息",
            needManualInput: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // TITLE_ONLY: content extraction failed but we got a usable <title>.
      // Skip the expensive DeepSeek round-trip — derive a minimal job record.
      if (fetchResult.content.startsWith("TITLE_ONLY:")) {
        const titleOnly = fetchResult.content.replace("TITLE_ONLY:", "").trim();
        // "产品经理实习生 - 腾讯招聘" → "产品经理实习生"
        const cleanedTitle = titleOnly
          .replace(/\s*[-–—|│·]\s*(腾讯|字节跳动|京东|百度|阿里|美团|招聘|校园招聘|加入我们).*$/i, "")
          .replace(/\s*(招聘|校园招聘|热招)$/i, "")
          .trim();
        if (cleanedTitle && !/^(首页|登录|招聘|校园招聘|加入我们)$/.test(cleanedTitle)) {
          console.log("Importing from title-only fallback:", cleanedTitle);
          return await insertJobFromInfo({
            supabase,
            categories: categoriesResult.data || [],
            userId,
            url,
            jobInfo: { title: cleanedTitle, company: "", location: "", description: "", requirements: "", category: "" },
          });
        }
      }

      // Increase limit to 15000 to capture full job content on long pages
      const trimmedContent = fetchResult.content.slice(0, 15000);

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
              content: `Extract the SPECIFIC job posting info from the content below. Return exactly this JSON structure:
{
  "title": "specific job title (e.g. '产品经理实习生', NOT generic terms like '校园招聘' or '招聘' or the company name)",
  "company": "company name",
  "location": "city or region",
  "description": "job responsibilities and duties (preserve structure: use numbered lists like 1. 2. 3. or bullet points - for each item, keep original format)",
  "requirements": "job requirements and qualifications (preserve structure: use numbered lists or bullet points, keep original format)"
}

Rules:
- The title must be the SPECIFIC role name, never navigation labels or category names
- Keep description and requirements as separate fields
- Preserve numbered lists and bullet points from the original
- If requirements section doesn't exist separately, extract any qualification/requirement sentences into requirements field
- Use the original language (Chinese if source is Chinese)

Content:
${trimmedContent}`,
            },
          ],
          stream: false,
          max_tokens: 3000,
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("DeepSeek call failed:", errorText.slice(0, 300));
        return new Response(
          JSON.stringify({ success: false, error: "AI解析岗位信息失败，请手动填写", needManualInput: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const aiResult = await aiResponse.json();
      const aiText = (aiResult.choices && aiResult.choices[0] && aiResult.choices[0].message)
        ? aiResult.choices[0].message.content
        : "";

      try {
        jobInfo = JSON.parse(aiText);
      } catch {
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { jobInfo = JSON.parse(jsonMatch[0]); } catch { jobInfo = null; }
        }
      }
    }

    if (!jobInfo || !jobInfo.title || !jobInfo.company) {
      return new Response(
        JSON.stringify({ success: false, error: "AI无法提取岗位信息，请手动填写", needManualInput: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return await insertJobFromInfo({
      supabase,
      categories: categoriesResult.data || [],
      userId,
      url,
      jobInfo,
    });
}

async function insertJobFromInfo(args: {
  supabase: any;
  categories: any[];
  userId: string | null;
  url: string;
  jobInfo: any;
}): Promise<Response> {
  const { supabase, categories, userId, url, jobInfo } = args;

  // Guess a company name from the URL when the extractor left it empty
  let company = (jobInfo.company || "").trim();
  if (!company) {
    const hostMatch = url.match(/https?:\/\/(?:www\.)?([^/]+)/);
    if (hostMatch) {
      const host = hostMatch[1].replace(/^jobs\.|^careers\.|^campus\.|^talent\.|\.com$|\.cn$|\.global$|\.hr$/g, "");
      const known: Record<string, string> = {
        bytedance: "字节跳动", jd: "京东", baidu: "百度", tencent: "腾讯",
        alibaba: "阿里巴巴", meituan: "美团", xiaohongshu: "小红书",
      };
      company = known[host] || host;
    }
  }
  if (!company) company = "未知公司";

  const categoryId = matchCategory(jobInfo.title, categories, userId);

  const { data: newJob, error: insertError } = await supabase
    .from("jobs")
    .insert({
      title: jobInfo.title.trim(),
      company: company,
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
}

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
