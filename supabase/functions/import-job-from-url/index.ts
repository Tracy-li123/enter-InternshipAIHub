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

    console.log("========== 开始抓取 ==========");
    console.log("URL:", url);

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
    console.log("HTML长度:", html.length);
    console.log("HTML前500字符:", html.substring(0, 500));
    
    const jobInfo = parseJobInfo(url, html);
    
    console.log("========== 解析结果 ==========");
    console.log("Title:", jobInfo.title);
    console.log("Company:", jobInfo.company);
    console.log("Location:", jobInfo.location);
    console.log("Description长度:", jobInfo.description?.length || 0);
    console.log("Description前100字:", jobInfo.description?.substring(0, 100));

    if (!jobInfo.title || !jobInfo.company) {
      console.log("解析失败：缺少必要信息");
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

    if (error) {
      console.error("插入失败:", error);
      throw error;
    }

    console.log("========== 成功插入 ==========");
    console.log("Job ID:", newJob.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: `成功导入《${jobInfo.title}》`,
        job: newJob,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("========== 错误 ==========");
    console.error("Error:", error);
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
  
  console.log("========== 开始解析 ==========");
  console.log("检测网站:", url.includes('bytedance.com') ? "字节跳动" : "其他");
  
  if (url.includes('bytedance.com')) {
    // 1. 尝试从title提取
    console.log("尝试提取title...");
    const titleMatch = html.match(/<title>([^<]+?)\s*[-–|]\s*字节跳动/i);
    if (titleMatch) {
      jobInfo.title = titleMatch[1].trim();
      console.log("从title提取到:", jobInfo.title);
    } else {
      console.log("title提取失败");
      // 备用方案
      const simpleTitleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (simpleTitleMatch) {
        const fullTitle = simpleTitleMatch[1];
        console.log("完整title:", fullTitle);
        jobInfo.title = fullTitle.split(/[-–|]/)[0].trim();
        console.log("提取后的title:", jobInfo.title);
      }
    }
    
    // 2. 尝试从JSON提取
    console.log("尝试提取JSON数据...");
    const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]+?\});/);
    if (jsonMatch) {
      console.log("找到JSON数据，长度:", jsonMatch[1].length);
      try {
        const data = JSON.parse(jsonMatch[1]);
        console.log("JSON解析成功");
        console.log("JSON keys:", Object.keys(data).join(', '));
        
        if (data.jobDetail) {
          console.log("找到jobDetail");
          console.log("jobDetail keys:", Object.keys(data.jobDetail).join(', '));
          
          if (data.jobDetail.title) {
            jobInfo.title = data.jobDetail.title;
            console.log("从JSON更新title:", jobInfo.title);
          }
          if (data.jobDetail.cityName) {
            jobInfo.location = data.jobDetail.cityName;
            console.log("从JSON提取location:", jobInfo.location);
          }
          if (data.jobDetail.description) {
            jobInfo.description = data.jobDetail.description;
            console.log("从JSON提取description长度:", jobInfo.description.length);
          }
        } else {
          console.log("JSON中没有jobDetail字段");
        }
      } catch (e) {
        console.log("JSON解析失败:", e.message);
      }
    } else {
      console.log("未找到JSON数据");
    }
    
    jobInfo.company = '字节跳动';
  }
  
  // 清理HTML标签
  console.log("清理HTML标签...");
  Object.keys(jobInfo).forEach(key => {
    if (typeof jobInfo[key] === 'string') {
      const before = jobInfo[key].length;
      jobInfo[key] = jobInfo[key]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const after = jobInfo[key].length;
      console.log(`${key}: ${before} -> ${after} 字符`);
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
