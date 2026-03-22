import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "请提供岗位链接" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("开始抓取链接:", url);

    if (url.includes('zhipin.com')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "BOSS直聘使用了动态加载技术，暂时无法自动抓取。请使用手动添加功能。",
          needManualInput: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html",
      },
    });

    if (!response.ok) {
      throw new Error("无法访问该网页");
    }

    const html = await response.text();
    const jobInfo = parseJobInfo(url, html);

    if (!jobInfo.title || !jobInfo.company) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "未能识别岗位信息，请使用手动添加功能。",
          needManualInput: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: existing } = await supabase
      .from('jobs')
      .select('id')
      .eq('source_url', url)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "该岗位已存在",
          jobId: existing.id,
          isDuplicate: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: categories } = await supabase.from('job_categories').select('*');
    const categoryId = matchCategory(jobInfo.title, categories || []);

    const { data: newJob, error } = await supabase
      .from('jobs')
      .insert({
        title: jobInfo.title,
        company: jobInfo.company,
        location: jobInfo.location || '未知',
        description: jobInfo.description || '',
        source_url: url,
        category_id: categoryId,
        published_at: new Date().toISOString(),
        scraped_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        message: `成功导入《${jobInfo.title}》`,
        job: newJob,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("导入失败:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "导入失败，请重试",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseJobInfo(url: string, html: string) {
  const jobInfo: any = { sourceUrl: url };
  
  if (url.includes('bytedance.com')) {
    const titleMatch = html.match(/<title>([^<]+?)\s*-\s*字节跳动/i);
    if (titleMatch) {
      jobInfo.title = titleMatch[1].trim();
    }
    
    const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{.+?\});/s);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        if (data.jobDetail) {
          jobInfo.title = data.jobDetail.title || jobInfo.title;
          jobInfo.location = data.jobDetail.cityName;
          jobInfo.description = data.jobDetail.description || '';
        }
      } catch (e) {
        console.log("JSON parse failed");
      }
    }
    
    jobInfo.company = '字节跳动';
  }
  
  Object.keys(jobInfo).forEach(key => {
    if (typeof jobInfo[key] === 'string') {
      jobInfo[key] = jobInfo[key]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  });

  return jobInfo;
}

function matchCategory(title: string, categories: any[]) {
  const lower = title.toLowerCase();
  
  for (const cat of categories) {
    if (lower.includes(cat.name.toLowerCase())) {
      return cat.id;
    }
  }

  if (lower.includes('产品')) return categories.find(c => c.name.includes('产品'))?.id;
  if (lower.includes('运营')) return categories.find(c => c.name.includes('运营'))?.id;
  if (lower.includes('数据')) return categories.find(c => c.name.includes('数据'))?.id;

  return categories[0]?.id;
}
