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

    console.log("开始抓取:", url);

    // 检测动态加载网站
    if (url.includes('zhipin.com') || url.includes('bytedance.com') || url.includes('tencent.com')) {
      const siteName = url.includes('zhipin.com') ? 'BOSS直聘' : 
                      url.includes('bytedance.com') ? '字节跳动' : '腾讯招聘';
      return new Response(
        JSON.stringify({
          success: false,
          error: `${siteName}使用了JavaScript动态加载技术，无法自动抓取。\n\n请切换到"手动添加"标签，复制页面信息手动录入。`,
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
          error: "未能识别岗位信息，该网站可能使用了动态加载。\n\n请尝试手动添加岗位。",
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
        error: "导入失败，请重试或使用手动添加功能",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseJobInfo(url: string, html: string) {
  const jobInfo: any = { sourceUrl: url };
  
  // 拉勾网
  if (url.includes('lagou.com')) {
    jobInfo.title = extractText(html, /<h1[^>]*>([^<]+)<\/h1>/i);
    jobInfo.company = extractText(html, /<em class="fl-cn">([^<]+)<\/em>/i);
    jobInfo.location = extractText(html, /<em class="address">([^<]+)<\/em>/i);
    jobInfo.description = extractText(html, /<dd class="job_bt">([^]+?)<\/dd>/is);
    jobInfo.source = '拉勾网';
  }
  
  // 智联招聘
  else if (url.includes('zhaopin.com')) {
    const jsonTitleMatch = html.match(/"jobName":"([^"]+)"/);
    if (jsonTitleMatch) {
      jobInfo.title = jsonTitleMatch[1];
      jobInfo.company = extractText(html, /"companyName":"([^"]+)"/);
      jobInfo.location = extractText(html, /"cityName":"([^"]+)"/);
      jobInfo.description = extractText(html, /"jobDescription":"([^"]+)"/);
    }
    jobInfo.source = '智联招聘';
  }
  
  // 前程无忧
  else if (url.includes('51job.com')) {
    jobInfo.title = extractText(html, /<h1[^>]*>([^<]+)<\/h1>/i);
    jobInfo.company = extractText(html, /<p class="cname">.*?<a[^>]*>([^<]+)<\/a>/is);
    jobInfo.location = extractText(html, /<span class="lname">([^<]+)<\/span>/i);
    jobInfo.description = extractText(html, /<div class="bmsg job_msg inbox">([^]+?)<\/div>/is);
    jobInfo.source = '前程无忧';
  }

  // 清理HTML标签
  Object.keys(jobInfo).forEach(key => {
    if (typeof jobInfo[key] === 'string') {
      jobInfo[key] = jobInfo[key]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
        
      if (key === 'description' && jobInfo[key].length > 5000) {
        jobInfo[key] = jobInfo[key].substring(0, 5000) + '...';
      }
    }
  });

  return jobInfo;
}

function extractText(html: string, regex: RegExp): string {
  const match = html.match(regex);
  return match ? match[1].trim() : '';
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
