import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JobCategory {
  id: string;
  name: string;
}

interface ScrapedJob {
  title: string;
  company: string;
  description: string;
  sourceUrl: string;
  location: string;
  publishedAt: string;
  category: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 初始化 Supabase 客户端
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("开始抓取招聘信息...");

    // 模拟抓取多个招聘网站的数据
    const scrapedJobs = await scrapeJobsFromMultipleSources();

    // 获取所有岗位分类
    const { data: categories } = await supabase
      .from('job_categories')
      .select('*');

    if (!categories) {
      throw new Error("无法获取岗位分类");
    }

    let insertedCount = 0;
    let skippedCount = 0;

    // 插入新岗位
    for (const job of scrapedJobs) {
      // 检查是否已存在（基于标题和公司去重）
      const { data: existing } = await supabase
        .from('jobs')
        .select('id')
        .eq('title', job.title)
        .eq('company', job.company)
        .single();

      if (existing) {
        skippedCount++;
        continue;
      }

      // 智能匹配分类
      const category = matchCategory(job.title, categories as JobCategory[]);

      // 插入新岗位
      const { error } = await supabase
        .from('jobs')
        .insert({
          title: job.title,
          company: job.company,
          description: job.description,
          source_url: job.sourceUrl,
          location: job.location,
          category_id: category?.id,
          published_at: job.publishedAt || new Date().toISOString(),
          scraped_at: new Date().toISOString(),
        });

      if (!error) {
        insertedCount++;
      }
    }

    console.log(`抓取完成: 新增 ${insertedCount} 个岗位, 跳过 ${skippedCount} 个重复岗位`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `成功抓取岗位数据`,
        stats: {
          total: scrapedJobs.length,
          inserted: insertedCount,
          skipped: skippedCount,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("抓取失败:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// 模拟从多个来源抓取岗位数据
async function scrapeJobsFromMultipleSources(): Promise<ScrapedJob[]> {
  // 在真实场景中，这里应该调用实际的爬虫逻辑
  // 这里我们生成一些模拟数据作为示例
  
  const companies = [
    '字节跳动', '腾讯', '阿里巴巴', '百度', '美团', 
    '拼多多', '快手', '小红书', '哔哩哔哩', '京东',
    '网易', '蚂蚁集团', '滴滴', '携程', '新浪'
  ];

  const locations = ['北京', '上海', '深圳', '杭州', '广州', '成都'];

  const jobTitles = [
    { title: '产品经理实习生', category: '产品经理' },
    { title: '产品运营实习生', category: '产品运营' },
    { title: '数据分析实习生', category: '数据分析' },
    { title: '商业分析实习生', category: '商业分析' },
    { title: '用户研究实习生', category: '产品经理' },
    { title: '增长产品经理', category: '产品经理' },
    { title: '内容运营实习生', category: '产品运营' },
    { title: '社区运营实习生', category: '产品运营' },
    { title: '数据挖掘实习生', category: '数据分析' },
    { title: '战略分析实习生', category: '商业分析' },
  ];

  const descriptions = [
    '岗位职责：\n1. 参与产品规划和设计\n2. 用户需求分析和调研\n3. 协调团队推进项目\n4. 数据分析和优化\n\n任职要求：\n1. 本科及以上学历\n2. 对互联网产品有热情\n3. 良好的逻辑思维\n4. 优秀的沟通能力',
    '岗位职责：\n1. 负责运营策略制定\n2. 用户活动策划执行\n3. 数据分析和报告\n4. 用户反馈收集\n\n任职要求：\n1. 优秀的文案能力\n2. 创意策划能力\n3. 数据敏感度\n4. 新媒体运营经验',
    '岗位职责：\n1. 业务数据分析\n2. 数据指标体系建立\n3. 数据可视化\n4. 决策支持\n\n任职要求：\n1. 统计学等相关专业\n2. 熟练使用SQL、Python\n3. 数据分析工具\n4. 商业理解能力',
  ];

  const jobs: ScrapedJob[] = [];
  const currentTime = new Date();

  // 生成10-15个新岗位
  const jobCount = Math.floor(Math.random() * 6) + 10;
  
  for (let i = 0; i < jobCount; i++) {
    const jobTemplate = jobTitles[Math.floor(Math.random() * jobTitles.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    // 随机发布时间（过去24小时内）
    const hoursAgo = Math.floor(Math.random() * 24);
    const publishedAt = new Date(currentTime.getTime() - hoursAgo * 60 * 60 * 1000);

    jobs.push({
      title: jobTemplate.title,
      company: company,
      description: description,
      sourceUrl: `https://jobs.${company.toLowerCase().replace(/\s/g, '')}.com`,
      location: location,
      publishedAt: publishedAt.toISOString(),
      category: jobTemplate.category,
    });
  }

  return jobs;
}

// 智能匹配岗位分类
function matchCategory(title: string, categories: JobCategory[]): JobCategory | undefined {
  const titleLower = title.toLowerCase();
  
  for (const category of categories) {
    const categoryName = category.name.toLowerCase();
    if (titleLower.includes(categoryName) || 
        titleLower.includes(categoryName.replace(/\s/g, ''))) {
      return category;
    }
  }

  // 基于关键词匹配
  if (titleLower.includes('产品') && !titleLower.includes('运营')) {
    return categories.find(c => c.name.includes('产品经理'));
  }
  if (titleLower.includes('运营')) {
    return categories.find(c => c.name.includes('运营'));
  }
  if (titleLower.includes('数据')) {
    return categories.find(c => c.name.includes('数据'));
  }
  if (titleLower.includes('分析') || titleLower.includes('商业')) {
    return categories.find(c => c.name.includes('商业'));
  }

  // 默认返回第一个分类
  return categories[0];
}
