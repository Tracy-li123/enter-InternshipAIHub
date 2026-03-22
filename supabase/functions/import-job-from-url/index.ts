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

    // 抓取网页内容
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`无法访问该网页: ${response.status}`);
    }

    const html = await response.text();
    
    // 解析岗位信息
    const jobInfo = parseJobInfo(url, html);

    if (!jobInfo.title || !jobInfo.company) {
      throw new Error("未能识别岗位信息，请确保链接正确");
    }

    // 保存到数据库
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 检查是否已存在
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

    // 智能匹配分类
    const { data: categories } = await supabase.from('job_categories').select('*');
    const categoryId = matchCategory(jobInfo.title, categories || []);

    // 插入新岗位
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
        error: error.message || "导入失败，请重试",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseJobInfo(url: string, html: string): any {
  const jobInfo: any = {
    sourceUrl: url,
  };

  // BOSS直聘
  if (url.includes('zhipin.com')) {
    jobInfo.title = extractText(html, /<div class="job-title[^"]*">([^<]+)<\/div>/) ||
                    extractText(html, /<h1[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/h1>/);
    jobInfo.company = extractText(html, /<h3 class="[^"]*company-name[^"]*">([^<]+)<\/h3>/) ||
                      extractText(html, /<div class="[^"]*sider-company[^"]*">.*?<a[^>]*>([^<]+)<\/a>/s);
    jobInfo.location = extractText(html, /<span class="[^"]*location-address[^"]*">([^<]+)<\/span>/);
    jobInfo.salary = extractText(html, /<span class="[^"]*salary[^"]*">([^<]+)<\/span>/);
    jobInfo.description = extractText(html, /<div class="job-sec-text">([^]+?)<\/div>/);
    jobInfo.source = 'BOSS直聘';
  }
  
  // 拉勾网
  else if (url.includes('lagou.com')) {
    jobInfo.title = extractText(html, /<h1[^>]*class="[^"]*job-name[^"]*"[^>]*>([^<]+)<\/h1>/);
    jobInfo.company = extractText(html, /<div class="[^"]*company[^"]*">([^<]+)<\/div>/);
    jobInfo.location = extractText(html, /<span class="[^"]*work_addr[^"]*">([^<]+)<\/span>/);
    jobInfo.salary = extractText(html, /<span class="[^"]*salary[^"]*">([^<]+)<\/span>/);
    jobInfo.description = extractText(html, /<div class="[^"]*job-detail[^"]*">([^]+?)<\/div>/);
    jobInfo.source = '拉勾网';
  }
  
  // 智联招聘
  else if (url.includes('zhaopin.com')) {
    jobInfo.title = extractText(html, /<h1[^>]*>([^<]+)<\/h1>/) ||
                    extractText(html, /"jobName":"([^"]+)"/);
    jobInfo.company = extractText(html, /"companyName":"([^"]+)"/);
    jobInfo.location = extractText(html, /"cityName":"([^"]+)"/);
    jobInfo.salary = extractText(html, /"salary":"([^"]+)"/);
    jobInfo.description = extractText(html, /"jobDescription":"([^"]+)"/);
    jobInfo.source = '智联招聘';
  }
  
  // 字节跳动
  else if (url.includes('bytedance.com') || url.includes('jobs.toutiao.com')) {
    jobInfo.title = extractText(html, /<h1[^>]*>([^<]+)<\/h1>/);
    jobInfo.company = '字节跳动';
    jobInfo.location = extractText(html, /<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/span>/);
    jobInfo.description = extractText(html, /<div[^>]*class="[^"]*description[^"]*"[^>]*>([^]+?)<\/div>/s);
    jobInfo.source = '字节跳动官网';
  }

  // 清理HTML标签和多余空格
  Object.keys(jobInfo).forEach(key => {
    if (typeof jobInfo[key] === 'string') {
      jobInfo[key] = jobInfo[key]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
    }
  });

  return jobInfo;
}

function extractText(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function matchCategory(title: string, categories: any[]): string | null {
  const titleLower = title.toLowerCase();
  
  for (const category of categories) {
    const categoryName = category.name.toLowerCase();
    if (titleLower.includes(categoryName)) {
      return category.id;
    }
  }

  if (titleLower.includes('产品') && !titleLower.includes('运营')) {
    return categories.find(c => c.name.includes('产品经理'))?.id || null;
  }
  if (titleLower.includes('运营') || titleLower.includes('营销')) {
    return categories.find(c => c.name.includes('运营'))?.id || null;
  }
  if (titleLower.includes('数据')) {
    return categories.find(c => c.name.includes('数据'))?.id || null;
  }
  if (titleLower.includes('分析') || titleLower.includes('商业')) {
    return categories.find(c => c.name.includes('商业'))?.id || null;
  }

  return categories[0]?.id || null;
}
