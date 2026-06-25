const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Company → Official Campus Recruitment Mapping ────────────────────────────

interface CampusSource {
  companyName: string;
  aliases: string[];
  campusUrl: string;
  includeDomains: string[];
}

const CAMPUS_SOURCES: CampusSource[] = [
  {
    companyName: "字节跳动",
    aliases: ["字节", "bytedance", "ByteDance", "抖音"],
    campusUrl: "https://jobs.bytedance.com/campus",
    includeDomains: ["jobs.bytedance.com"],
  },
  {
    companyName: "美团",
    aliases: ["美团点评", "meituan", "Meituan"],
    campusUrl: "https://zhaopin.meituan.com/web/campus",
    includeDomains: ["zhaopin.meituan.com", "campus.meituan.com"],
  },
  {
    companyName: "腾讯",
    aliases: ["tencent", "Tencent", "腾讯公司"],
    campusUrl: "https://join.qq.com/",
    includeDomains: ["join.qq.com"],
  },
  {
    companyName: "阿里巴巴",
    aliases: ["阿里", "alibaba", "Alibaba", "淘宝", "天猫"],
    campusUrl: "https://campus-talent.alibaba.com/",
    includeDomains: ["campus-talent.alibaba.com", "talent.alibaba.com"],
  },
  {
    companyName: "京东",
    aliases: ["jd", "JD", "JD.com", "京东集团"],
    campusUrl: "https://campus.jd.com/",
    includeDomains: ["campus.jd.com"],
  },
  {
    companyName: "小红书",
    aliases: ["rednote", "REDnote", "xiaohongshu", "Xiaohongshu"],
    campusUrl: "https://job.xiaohongshu.com/campus",
    includeDomains: ["job.xiaohongshu.com"],
  },
  {
    companyName: "快手",
    aliases: ["kuaishou", "Kuaishou"],
    campusUrl: "https://campus.kuaishou.cn/",
    includeDomains: ["campus.kuaishou.cn"],
  },
  {
    companyName: "网易",
    aliases: ["网易集团", "netease", "NetEase"],
    campusUrl: "https://campus.163.com/",
    includeDomains: ["campus.163.com"],
  },
  {
    companyName: "百度",
    aliases: ["baidu", "Baidu", "百度集团"],
    campusUrl: "https://talent.baidu.com/jobs/campus",
    includeDomains: ["talent.baidu.com"],
  },
  {
    companyName: "滴滴",
    aliases: ["滴滴出行", "didi", "DiDi", "Didi"],
    campusUrl: "https://campus.didiglobal.com/",
    includeDomains: ["campus.didiglobal.com"],
  },
  {
    companyName: "华为",
    aliases: ["huawei", "Huawei", "华为技术"],
    campusUrl: "https://career.huawei.com/cn/campus-recruitment",
    includeDomains: ["career.huawei.com"],
  },
  {
    companyName: "哔哩哔哩",
    aliases: ["b站", "B站", "bilibili", "Bilibili"],
    campusUrl: "https://jobs.bilibili.com/campus/",
    includeDomains: ["jobs.bilibili.com"],
  },
  {
    companyName: "蚂蚁集团",
    aliases: ["蚂蚁", "蚂蚁金服", "ant group", "Ant Group"],
    campusUrl: "https://talent.antgroup.com/campus",
    includeDomains: ["talent.antgroup.com"],
  },
  {
    companyName: "拼多多",
    aliases: ["pdd", "PDD", "pinduoduo", "Pinduoduo"],
    campusUrl: "https://careers.pddglobalhr.com/campus",
    includeDomains: ["careers.pddglobalhr.com"],
  },
  {
    companyName: "商汤科技",
    aliases: ["商汤", "sensetime", "SenseTime"],
    campusUrl: "https://hr.sensetime.com/SU62e109640dcad44de6f28a87/mc/position/campus",
    includeDomains: ["hr.sensetime.com"],
  },
  {
    companyName: "微软",
    aliases: ["microsoft", "Microsoft", "MSFT"],
    campusUrl: "https://careers.microsoft.com/students/us/en/chinastudentjob",
    includeDomains: ["careers.microsoft.com"],
  },
  {
    companyName: "谷歌",
    aliases: ["google", "Google", "谷歌中国"],
    campusUrl: "https://careers.google.com/students/",
    includeDomains: ["careers.google.com"],
  },
  {
    companyName: "苹果",
    aliases: ["apple", "Apple"],
    campusUrl: "https://www.apple.com/careers/cn/students.html",
    includeDomains: ["www.apple.com"],
  },
];

// ─── Company name matching ─────────────────────────────────────────────────────

function normalizeCompanyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/有限公司|股份有限公司|集团|公司|科技|技术/g, "");
}

function findCampusSource(companyInput: string): CampusSource | null {
  const normalized = normalizeCompanyName(companyInput);
  return (
    CAMPUS_SOURCES.find((source) => {
      const names = [source.companyName, ...source.aliases];
      return names.some((n) => normalizeCompanyName(n) === normalized);
    }) ?? null
  );
}

// ─── URL domain validation ─────────────────────────────────────────────────────

function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isAllowedUrl(url: string, source: CampusSource): boolean {
  const hostname = getHostname(url);
  if (!hostname) return false;
  return source.includeDomains.some(
    (domain) => hostname === domain || hostname.endsWith("." + domain)
  );
}

// ─── Campus signals filter ─────────────────────────────────────────────────────

const CAMPUS_SIGNALS = [
  "校园招聘", "校招", "应届生", "毕业生", "实习生", "实习",
  "管培生", "储备", "2026届", "2027届", "2028届",
  "campus", "graduate", "intern", "internship", "management trainee", "new grad",
];

const EXPERIENCED_SIGNALS = [
  "社会招聘", "社招", "experienced", "5年以上", "8年以上", "10年以上", "资深总监",
];

function isCampusJob(title: string, description: string): boolean {
  const text = (title + " " + description).toLowerCase();
  const hasExperienced = EXPERIENCED_SIGNALS.some((s) => text.includes(s.toLowerCase()));
  if (hasExperienced) return false;
  const hasCampus = CAMPUS_SIGNALS.some((s) => text.includes(s.toLowerCase()));
  return hasCampus;
}

// ─── Build Tavily search query ─────────────────────────────────────────────────

function buildSearchQuery(jobType: string): string {
  // Don't include company name — domain restriction already limits the scope
  const terms = [jobType, "校园招聘", "实习"];
  return [...new Set(terms)].filter(Boolean).join(" ");
}

// ─── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const company: string = (body.company || "").trim();
    const jobType: string = (body.jobType || "实习").trim();

    if (!company) {
      return new Response(
        JSON.stringify({ success: false, error: "请提供公司名称", jobs: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Match company
    const source = findCampusSource(company);
    if (!source) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `暂未收录「${company}」的官方校园招聘渠道。请使用链接导入或手动添加。`,
          jobs: [],
          supportedCompanies: CAMPUS_SOURCES.map((s) => s.companyName),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("matched company:", source.companyName, "campus:", source.campusUrl);

    const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY") || "";
    const AI_TOKEN = Deno.env.get("AI_API_TOKEN_62325baf28c7") || "";

    if (!TAVILY_API_KEY) throw new Error("Tavily API Key 未配置");
    if (!AI_TOKEN) throw new Error("AI Token 未配置");

    // Step 2: Tavily domain-restricted search (primary) + Jina scrape (parallel)
    const searchQuery = buildSearchQuery(jobType);
    console.log("Tavily query:", searchQuery, "domains:", source.includeDomains);

    const [tavilyRes, jinaRes] = await Promise.allSettled([
      fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + TAVILY_API_KEY,
        },
        body: JSON.stringify({
          query: searchQuery,
          search_depth: "advanced",
          max_results: 15,
          include_domains: source.includeDomains,
        }),
      }),
      fetch("https://r.jina.ai/" + source.campusUrl, {
        headers: {
          "Accept": "application/json",
          "X-Return-Format": "markdown",
          "X-Timeout": "20",
        },
        signal: AbortSignal.timeout(25000),
      }),
    ]);

    // Parse Tavily results
    let tavilyResults: Array<{ title: string; url: string; content: string }> = [];
    if (tavilyRes.status === "fulfilled" && tavilyRes.value.ok) {
      const tavilyData = await tavilyRes.value.json();
      const raw = tavilyData.results || [];
      // Hard validate: only keep URLs from allowed domains
      tavilyResults = raw.filter((r: any) => r.url && isAllowedUrl(r.url, source));
      console.log("Tavily results (domain-validated):", tavilyResults.length, "/", raw.length);
    } else {
      const errMsg = tavilyRes.status === "rejected" ? tavilyRes.reason : "HTTP " + (tavilyRes.value?.status);
      console.error("Tavily failed:", errMsg);
    }

    // Parse Jina content for extra job links
    let jinaContent = "";
    if (jinaRes.status === "fulfilled" && jinaRes.value.ok) {
      const jinaData = await jinaRes.value.json().catch(() => ({}));
      jinaContent = (jinaData.data && jinaData.data.content) ? jinaData.data.content : (jinaData.content || "");
      console.log("Jina content length:", jinaContent.length);
    } else {
      console.log("Jina failed or timed out, skipping");
    }

    if (tavilyResults.length === 0 && jinaContent.length < 100) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `已检查「${source.companyName}」官方校园招聘渠道，暂未发现符合条件的岗位。请稍后重试或使用链接导入。`,
          jobs: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: AI extract job listings
    const tavilyText = tavilyResults
      .map((r, i) =>
        `[${i + 1}] 标题: ${r.title}\n    链接: ${r.url}\n    摘要: ${(r.content || "").slice(0, 400)}`
      )
      .join("\n\n");

    const jinaSnippet = jinaContent.slice(0, 3000);

    const prompt = `你是一个校园招聘岗位提取助手。

来源公司：${source.companyName}
官方招聘域名：${source.includeDomains.join(", ")}
用户搜索的岗位类型：${jobType}

以下是从该公司官方校园招聘网站获取的内容：

=== Tavily 域内搜索结果 ===
${tavilyText || "（无结果）"}

=== 官方校招入口页内容 ===
${jinaSnippet || "（无内容）"}

请从上面内容中提取具体的校园招聘/实习岗位，返回JSON数组（不要markdown）：
[{"title":"岗位名称","location":"城市（找不到写未知）","url":"完整链接","description":"简短描述（30字以内）"}]

严格要求：
1. 只返回属于校招、应届生、实习生、管培生的岗位
2. URL必须属于以下域名之一：${source.includeDomains.join(", ")}
3. 排除社会招聘（明确要求多年全职经验）
4. 排除公司首页、校招活动主页本身，只返回具体岗位
5. 没有符合条件的岗位则返回 []
6. 最多返回8个岗位`;

    console.log("calling AI for extraction...");
    const aiRes = await fetch("https://api.enter.pro/code/api/v1/ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + AI_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "alibaba/qwen-3.6-plus",
        messages: [
          { role: "system", content: "你是校园招聘岗位提取助手，只返回JSON数组，不要任何其他文字。" },
          { role: "user", content: prompt },
        ],
        stream: false,
        max_tokens: 2000,
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error("AI error:", err.slice(0, 200));
      throw new Error("AI分析失败");
    }

    const aiData = await aiRes.json();
    const aiText = aiData.choices?.[0]?.message?.content || "[]";
    console.log("AI output preview:", aiText.slice(0, 300));

    // Parse AI output
    let jobs: any[] = [];
    try {
      jobs = JSON.parse(aiText);
    } catch {
      const m = aiText.match(/\[[\s\S]*\]/);
      if (m) {
        try { jobs = JSON.parse(m[0]); } catch { jobs = []; }
      }
    }

    // Step 4: Final hard validation
    const validJobs = (Array.isArray(jobs) ? jobs : []).filter((j: any) => {
      if (!j || !j.title || !j.url) return false;
      if (!j.url.startsWith("http")) return false;
      // Hard domain check
      if (!isAllowedUrl(j.url, source)) {
        console.log("rejected non-official URL:", j.url);
        return false;
      }
      return true;
    });

    console.log("valid jobs after hard filter:", validJobs.length);

    const message = validJobs.length > 0
      ? `从「${source.companyName}」官方校园招聘找到 ${validJobs.length} 个岗位`
      : `已检查「${source.companyName}」官方校园招聘渠道，暂未发现符合条件的${jobType}岗位`;

    return new Response(
      JSON.stringify({
        success: validJobs.length > 0,
        message,
        jobs: validJobs,
        source: { company: source.companyName, campusUrl: source.campusUrl },
        error: validJobs.length === 0 ? message : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("搜索失败:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "搜索失败，请重试", jobs: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
