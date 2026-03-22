import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = "https://jobs.bytedance.com/campus/position/7616304766817519877/detail";
    
    console.log("开始fetch:", url);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    const html = await response.text();
    
    console.log("HTML长度:", html.length);
    console.log("HTML前2000字符:", html.substring(0, 2000));
    
    // 检查是否包含关键内容
    const hasTitle = html.includes("大语言模型") || html.includes("算法实习生");
    const hasDescription = html.includes("职位描述") || html.includes("职位要求");
    
    console.log("包含标题:", hasTitle);
    console.log("包含描述:", hasDescription);
    
    return new Response(
      JSON.stringify({
        length: html.length,
        preview: html.substring(0, 2000),
        hasContent: hasTitle && hasDescription,
        hasTitle,
        hasDescription,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
