import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface JobData {
  title: string;
  company: string;
  location?: string;
  salary?: string;
  description?: string;
  requirements?: string;
  sourceUrl: string;
  source: string;
}

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 解析请求数据
    const jobData: JobData = await req.json();

    console.log("收到插件采集的岗位数据:", jobData);

    // 验证必需字段
    if (!jobData.title || !jobData.company) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "岗位标题和公司名称为必填项",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 检查是否已存在（避免重复）
    const { data: existing } = await supabase
      .from('jobs')
      .select('id')
      .eq('title', jobData.title)
      .eq('company', jobData.company)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "该岗位已存在",
          jobId: existing.id,
          isDuplicate: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 智能匹配分类
    const { data: categories } = await supabase
      .from('job_categories')
      .select('*');

    let categoryId = null;
    if (categories && categories.length > 0) {
      // 根据岗位标题匹配分类
      const title = jobData.title.toLowerCase();
      if (title.includes('产品') && !title.includes('运营')) {
        categoryId = categories.find(c => c.name.includes('产品经理'))?.id;
      } else if (title.includes('运营') || title.includes('营销')) {
        categoryId = categories.find(c => c.name.includes('运营'))?.id;
      } else if (title.includes('数据')) {
        categoryId = categories.find(c => c.name.includes('数据'))?.id;
      } else if (title.includes('分析') || title.includes('商业')) {
        categoryId = categories.find(c => c.name.includes('商业'))?.id;
      }
      
      // 如果没有匹配到，使用第一个分类
      if (!categoryId) {
        categoryId = categories[0].id;
      }
    }

    // 插入新岗位
    const { data: newJob, error } = await supabase
      .from('jobs')
      .insert({
        title: jobData.title,
        company: jobData.company,
        location: jobData.location || '未知',
        description: jobData.description || '',
        source_url: jobData.sourceUrl,
        category_id: categoryId,
        published_at: new Date().toISOString(),
        scraped_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("插入岗位失败:", error);
      throw error;
    }

    console.log("成功插入岗位:", newJob.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "岗位采集成功",
        jobId: newJob.id,
        job: newJob,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("处理失败:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "服务器错误",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
