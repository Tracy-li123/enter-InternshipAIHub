const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const JOB_TITLE_KEYWORDS = [
  "实习生", "实习", "工程师", "产品经理", "运营", "设计师", "算法",
  "研发", "开发", "分析师", "策略", "市场", "销售", "经理", "专员",
  "工作室", "实验室", "助理", "架构师", "测试", "前端", "后端", "全栈",
];

// Titles that are NOT job titles (homepage/list pages)
const GENERIC_TITLES = [
  "校园招聘", "社会招聘", "招聘官网", "首页", "职位列表", "岗位列表",
  "招聘信息", "实习信息", "简历投递", "职位详情", "岗位投递",
  "BOSS直聘", "智联招聘", "前程无忧", "猎聘", "拉勾", "求职网",
];

// URL exclusion patterns (non-job content)
const SKIP_URL_PATTERNS = [
  "pdf", ".github.io", "zhihu.com", "weibo.com", "mp.weixin", "jianshu.com",
  "csdn.net", "51job.com", "douyin.com",
];

const CITY_LIST = ["北京", "上海", "杭州", "深圳", "广州", "成都", "武汉", "南京", "西安", "重庆", "苏州", "天津"];

const COMPANY_SUFFIXES = [
  "正在招聘", "招聘官网", "官网", "校园招聘", "Careers", "Campus",
  "字节跳动", "美团", "腾讯", "阿里巴巴", "百度", "京东", "快手", "哔哩哔哩",
  "ByteDance", "Meituan", "Tencent", "Alibaba",
  "BOSS直聘", "猎聘", "牛客", "智联招聘", "应届生求职网", "牛企直聘",
  "实习僧", "校招薄",
];

function isJobTitle(title: string): boolean {
  if (!title || title.length < 4) return false;
  // Skip if the title IS exactly a generic page title (not just contains it)
  if (GENERIC_TITLES.some((g) => title === g)) return false;
  // Must contain a job-related keyword
  return JOB_TITLE_KEYWORDS.some((k) => title.includes(k));
}

function shouldSkipUrl(url: string): boolean {
  return SKIP_URL_PATTERNS.some((p) => url.includes(p));
}

function cleanJobTitle(raw: string, company: string): string {
  let t = raw;
  // Remove company name prefix (e.g., "美团正在招聘服务商运营实习生")
  t = t.replace(new RegExp("^[「」【】]?" + company + "[^的？！，。]*?招聘"), "");
  // Remove site/company suffixes after separators
  for (const suffix of COMPANY_SUFFIXES) {
    t = t.replace(new RegExp("\\s*[-|–|｜]\\s*" + suffix + ".*$"), "");
    t = t.replace(new RegExp("\\s*[（(]" + suffix + "[）)].*$"), "");
  }
  // Remove leading/trailing brackets
  t = t.replace(/^[「」【】《》\[\]()（）]+|[「」【】《》\[\]()（）]+$/g, "").trim();
  return t || raw.split(/[-|–|｜]/)[0].trim();
}

function extractLocation(content: string): string {
  for (const city of CITY_LIST) {
    if (content.includes(city)) return city;
  }
  return "未知";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const company = body.company || "";
    const jobType = body.jobType || "实习";

    if (!company) {
      return new Response(
        JSON.stringify({ success: false, error: "请提供公司名称", jobs: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("搜索:", company, jobType);

    const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY") || "";
    console.log("Tavily Key 长度:", TAVILY_API_KEY.length, "前缀:", TAVILY_API_KEY.slice(0, 8));
    if (!TAVILY_API_KEY) throw new Error("Tavily API Key 未配置");

    const searchQuery = company + " " + jobType + " 招聘 岗位";
    console.log("搜索词:", searchQuery);

    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + TAVILY_API_KEY,
      },
      body: JSON.stringify({ query: searchQuery, search_depth: "basic", max_results: 10 }),
    });

    console.log("Tavily 状态:", tavilyRes.status);
    if (!tavilyRes.ok) {
      const errBody = await tavilyRes.text();
      console.error("Tavily 错误:", errBody.slice(0, 200));
      throw new Error("搜索服务不可用");
    }

    const tavilyData = await tavilyRes.json();
    const allResults = tavilyData.results || [];
    console.log("Tavily 结果数:", allResults.length);

    if (allResults.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "未找到相关结果，请尝试其他关键词", jobs: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === Direct extraction using title heuristic ===
    const directJobs: any[] = [];

    for (const r of allResults) {
      if (!r.url || !r.title) continue;
      if (shouldSkipUrl(r.url)) continue;
      if (!isJobTitle(r.title)) continue;

      const cleanTitle = cleanJobTitle(r.title, company);
      if (!cleanTitle || cleanTitle.length < 4) continue;
      // Skip if cleaned title is still a generic term
      if (GENERIC_TITLES.some((g) => cleanTitle === g)) continue;

      directJobs.push({
        title: cleanTitle,
        location: extractLocation(r.content || ""),
        url: r.url,
        description: (r.content || "").slice(0, 200),
      });
    }

    console.log("直接提取岗位数:", directJobs.length);

    if (directJobs.length >= 1) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "找到 " + directJobs.length + " 个相关岗位",
          jobs: directJobs.slice(0, 5),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === Fallback: AI analysis with 25s timeout ===
    const AI_TOKEN = Deno.env.get("AI_API_TOKEN_62325baf28c7") || "";
    if (!AI_TOKEN) throw new Error("AI Token 未配置");

    const resultsText = allResults
      .slice(0, 6)
      .map((r: any, i: number) => `${i + 1}. 标题: ${r.title || ""}\n   链接: ${r.url || ""}\n   摘要: ${(r.content || "").slice(0, 150)}`)
      .join("\n\n");

    console.log("使用 AI 分析（兜底）...");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const aiRes = await fetch("https://api.enter.pro/code/api/v1/ai/chat/completions", {
        method: "POST",
        headers: { "Authorization": "Bearer " + AI_TOKEN, "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: "moonshotai/kimi-k2.5",
          messages: [
            {
              role: "system",
              content: "从搜索结果中找与指定公司相关的招聘信息，返回纯JSON数组，不要markdown。",
            },
            {
              role: "user",
              content: `搜索"${company}""${jobType}":\n\n${resultsText}\n\n返回JSON: [{"title":"岗位名","location":"城市或未知","url":"原链接","description":"描述"}]\n无则返回[]`,
            },
          ],
          stream: false,
          max_tokens: 600,
        }),
      });
      clearTimeout(timeout);

      if (!aiRes.ok) throw new Error("AI 响应失败");
      const aiData = await aiRes.json();
      const aiText = aiData?.choices?.[0]?.message?.content || "[]";
      console.log("AI 返回:", aiText.slice(0, 200));

      let jobs: any[] = [];
      try { jobs = JSON.parse(aiText); } catch {
        const m = aiText.match(/\[[\s\S]*\]/);
        if (m) { try { jobs = JSON.parse(m[0]); } catch { jobs = []; } }
      }

      const valid = jobs.filter((j: any) => j?.url?.startsWith("http") && j?.title).slice(0, 5);

      return new Response(
        JSON.stringify({
          success: valid.length > 0,
          message: valid.length > 0 ? "找到 " + valid.length + " 个相关岗位" : "未找到相关岗位",
          jobs: valid,
          error: valid.length === 0 ? "未找到相关岗位，建议使用链接导入" : undefined,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (e: any) {
      clearTimeout(timeout);
      if (e.name === "AbortError") {
        return new Response(
          JSON.stringify({ success: false, error: "搜索超时，请尝试更具体的关键词或使用链接导入", jobs: [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw e;
    }

  } catch (err: any) {
    console.error("搜索失败:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "搜索失败，请重试", jobs: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
