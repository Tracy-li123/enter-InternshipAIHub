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
    const { company, jobType = "internship" } = await req.json();

    if (!company) {
      return new Response(
        JSON.stringify({ success: false, error: "please provide company name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("searching:", company, jobType);

    const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");
    console.log("TAVILY_API_KEY exists:", !!TAVILY_API_KEY);
    console.log("TAVILY_API_KEY prefix:", TAVILY_API_KEY ? TAVILY_API_KEY.substring(0, 8) : "none");

    if (!TAVILY_API_KEY) throw new Error("Tavily API Key not configured");

    const searchQuery = company + " " + jobType + " 招聘 岗位";
    console.log("search query:", searchQuery);

    const tavilyResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + TAVILY_API_KEY,
      },
      body: JSON.stringify({
        query: searchQuery,
        search_depth: "basic",
        include_answer: false,
        include_raw_content: false,
        max_results: 10,
      }),
    });

    console.log("Tavily status:", tavilyResponse.status);

    if (!tavilyResponse.ok) {
      const errorText = await tavilyResponse.text();
      console.error("Tavily failed:", errorText);
      throw new Error("search service unavailable: " + tavilyResponse.status);
    }

    const tavilyData = await tavilyResponse.json();
    console.log("Tavily results count:", tavilyData.results ? tavilyData.results.length : 0);

    if (!tavilyData.results || tavilyData.results.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "no results found for " + company, jobs: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_62325baf28c7");
    if (!AI_API_TOKEN) throw new Error("AI token not configured");

    const searchResultsText = tavilyData.results
      .map((r: any, i: number) => (i + 1) + ". title: " + r.title + "\n   url: " + r.url + "\n   summary: " + r.content + "\n")
      .join("\n");

    console.log("calling AI...");

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
            content: "You are a job search assistant. Filter real job listings from search results and return only a JSON array, no markdown.",
          },
          {
            role: "user",
            content: "From these search results for company '" + company + "' and job type '" + jobType + "', extract relevant job listings.\n\nSearch results:\n" + searchResultsText + "\n\nRules:\n1. Only include results related to " + company + " and " + jobType + " jobs\n2. Use the ORIGINAL URLs from search results only\n3. Return max 5 most relevant jobs\n4. Return only JSON array\n\nFormat:\n[{\"title\":\"job title\",\"location\":\"city or unknown\",\"url\":\"original url\",\"description\":\"brief description\"}]\n\nIf no relevant jobs, return []",
          },
        ],
        stream: false,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI failed:", errorText.substring(0, 200));
      throw new Error("AI analysis failed");
    }

    const aiResult = await aiResponse.json();
    const aiText = (aiResult.choices && aiResult.choices[0] && aiResult.choices[0].message)
      ? aiResult.choices[0].message.content
      : "";
    console.log("AI result:", aiText.substring(0, 200));

    let jobs: any[];
    try {
      jobs = JSON.parse(aiText);
    } catch {
      const jsonMatch = aiText.match(/\[[\s\S]*\]/);
      jobs = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }

    const validJobs = jobs.filter((j: any) => j.url && j.url.startsWith("http") && j.title);
    console.log("valid jobs:", validJobs.length);

    return new Response(
      JSON.stringify({
        success: validJobs.length > 0,
        message: validJobs.length > 0 ? "found " + validJobs.length + " jobs" : "no relevant jobs found",
        jobs: validJobs,
        error: validJobs.length === 0 ? "no relevant jobs found, try URL import or manual entry" : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("search failed:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "search failed", jobs: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
