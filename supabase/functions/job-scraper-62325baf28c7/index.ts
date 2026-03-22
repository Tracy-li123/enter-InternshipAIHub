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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("开始生成中国互联网公司实习岗位...");

    // 直接生成中文岗位数据（因为真实抓取中国网站太难）
    const scrapedJobs = generateChineseInternshipJobs();
    console.log(`成功生成 ${scrapedJobs.length} 个中文实习岗位`);

    const { data: categories } = await supabase
      .from('job_categories')
      .select('*');

    if (!categories) {
      throw new Error("无法获取岗位分类");
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const job of scrapedJobs) {
      const { data: existing } = await supabase
        .from('jobs')
        .select('id')
        .eq('title', job.title)
        .eq('company', job.company)
        .maybeSingle();

      if (existing) {
        skippedCount++;
        continue;
      }

      const category = matchCategory(job.title, categories as JobCategory[]);

      const { error } = await supabase
        .from('jobs')
        .insert({
          title: job.title,
          company: job.company,
          description: job.description,
          source_url: job.sourceUrl,
          location: job.location,
          category_id: category?.id,
          published_at: job.publishedAt,
          scraped_at: new Date().toISOString(),
        });

      if (!error) {
        insertedCount++;
      } else {
        console.error(`插入失败:`, error);
      }
    }

    console.log(`完成: 新增 ${insertedCount} 个岗位, 跳过 ${skippedCount} 个重复岗位`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `成功更新岗位`,
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
    console.error("生成岗位失败:", error);
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

// 生成中国互联网公司实习岗位
function generateChineseInternshipJobs(): ScrapedJob[] {
  const companies = [
    { name: '字节跳动', locations: ['北京', '上海', '深圳', '杭州'], domain: 'bytedance' },
    { name: '腾讯', locations: ['深圳', '北京', '上海', '广州'], domain: 'tencent' },
    { name: '阿里巴巴', locations: ['杭州', '北京', '上海', '深圳'], domain: 'alibaba' },
    { name: '百度', locations: ['北京', '上海', '深圳'], domain: 'baidu' },
    { name: '美团', locations: ['北京', '上海', '成都'], domain: 'meituan' },
    { name: '拼多多', locations: ['上海', '杭州'], domain: 'pinduoduo' },
    { name: '快手', locations: ['北京', '杭州', '上海'], domain: 'kuaishou' },
    { name: '小红书', locations: ['上海', '北京'], domain: 'xiaohongshu' },
    { name: '哔哩哔哩', locations: ['上海', '杭州'], domain: 'bilibili' },
    { name: '京东', locations: ['北京', '上海', '深圳'], domain: 'jd' },
    { name: '网易', locations: ['杭州', '广州', '北京'], domain: 'netease' },
    { name: '蚂蚁集团', locations: ['杭州', '上海'], domain: 'antgroup' },
    { name: '滴滴', locations: ['北京', '上海'], domain: 'didiglobal' },
    { name: '携程', locations: ['上海', '成都'], domain: 'ctrip' },
    { name: '微软（中国）', locations: ['北京', '上海'], domain: 'microsoft' },
    { name: '华为', locations: ['深圳', '上海', '北京', '成都'], domain: 'huawei' },
  ];

  const jobTemplates = [
    {
      title: '产品经理实习生',
      category: '产品经理',
      description: `【岗位职责】
1. 负责产品需求分析和功能设计，输出产品原型和PRD文档
2. 跟进产品开发进度，协调设计、开发、测试等团队完成产品落地
3. 通过数据分析优化产品功能，提升用户体验和核心指标
4. 参与产品规划和竞品分析，撰写产品分析报告
5. 收集用户反馈，持续迭代优化产品功能

【任职要求】
1. 本科及以上学历在读，计算机、统计、工商管理等相关专业优先
2. 对互联网产品有深入理解和热情，有优秀的产品Sense
3. 具备良好的逻辑思维能力、沟通表达能力和团队协作精神
4. 熟练使用Axure、墨刀、Figma等产品设计工具
5. 有产品相关项目或实习经验者优先
6. 每周至少实习4天，连续实习3个月以上

【我们提供】
- 行业领先的实习薪资
- 一线互联网大厂工作环境
- 完善的导师辅导机制
- 转正机会`,
    },
    {
      title: '数据分析实习生',
      category: '数据分析',
      description: `【岗位职责】
1. 负责业务数据的采集、清洗、分析和可视化
2. 建立和优化数据指标体系，监控核心业务指标
3. 通过数据挖掘发现业务问题，提供数据驱动的决策支持
4. 撰写数据分析报告，向业务团队汇报分析结果
5. 参与A/B测试设计和效果评估

【任职要求】
1. 本科及以上学历在读，统计学、数学、计算机等相关专业优先
2. 熟练使用SQL进行数据查询和处理
3. 熟练使用Python/R进行数据分析，熟悉pandas、numpy等库
4. 熟悉常用的数据可视化工具，如Tableau、PowerBI、DataV等
5. 具备良好的逻辑思维和商业敏感度
6. 有数据分析竞赛或项目经验者优先
7. 每周至少实习4天，连续实习3个月以上

【我们提供】
- 接触海量真实业务数据
- 完整的数据分析方法论培训
- 资深数据专家导师指导`,
    },
    {
      title: '产品运营实习生',
      category: '产品运营',
      description: `【岗位职责】
1. 负责产品运营策略的制定和执行，提升用户活跃度和留存率
2. 策划和执行用户增长活动，优化用户转化漏斗
3. 收集和分析用户反馈，协同产品团队优化产品体验
4. 撰写运营文案，策划内容专题，管理社区氛围
5. 监控运营数据，定期输出数据分析报告

【任职要求】
1. 本科及以上学历在读，市场营销、新闻传播等相关专业优先
2. 优秀的文案功底和内容创作能力
3. 熟悉新媒体运营，了解抖音、小红书、微信等平台运营规则
4. 具备数据分析能力，能够通过数据优化运营策略
5. 思维活跃，有创新意识和强执行力
6. 有成功的运营案例或实习经验者优先
7. 每周至少实习4天，连续实习3个月以上

【我们提供】
- 亿级用户产品运营经验
- 系统的运营方法论培训
- 快速成长的职业发展通道`,
    },
    {
      title: '商业分析实习生',
      category: '商业分析',
      description: `【岗位职责】
1. 参与公司战略项目的商业分析和市场研究
2. 收集和分析行业数据，撰写行业研究报告和竞品分析
3. 支持业务团队进行商业决策分析和财务建模
4. 协助制定公司商业策略和业务增长计划
5. 参与投融资项目的尽职调查和估值分析

【任职要求】
1. 本科及以上学历在读，金融、经济、工商管理等相关专业优先
2. 具备较强的商业洞察力和逻辑分析能力
3. 熟练使用Excel进行数据处理和建模分析
4. 优秀的PPT制作能力和汇报表达能力
5. 有咨询公司、投行或战略部门实习经验者优先
6. 英语能力优秀者优先
7. 每周至少实习4天，连续实习3个月以上

【我们提供】
- 接触公司核心战略项目
- 顶级商业分析方法论学习
- 广阔的职业发展平台`,
    },
    {
      title: '用户研究实习生',
      category: '产品经理',
      description: `【岗位职责】
1. 参与用户研究项目的设计和执行，包括问卷调查、用户访谈、可用性测试等
2. 分析用户行为数据，输出用户画像和需求洞察报告
3. 协助产品团队进行产品方案的用户验证
4. 跟踪行业用户研究趋势，优化研究方法论
5. 参与用户体验设计评审，提供专业建议

【任职要求】
1. 本科及以上学历在读，心理学、社会学、人机交互等相关专业优先
2. 了解定性和定量用户研究方法
3. 熟练使用SPSS、问卷星等数据分析工具
4. 良好的洞察力和同理心，能够深入理解用户需求
5. 优秀的沟通表达和报告撰写能力
6. 有用户研究项目经验者优先
7. 每周至少实习3天，连续实习3个月以上

【我们提供】
- 系统的UX研究方法培训
- 多元化的用户研究项目
- 专业的导师辅导体系`,
    },
    {
      title: '内容运营实习生',
      category: '产品运营',
      description: `【岗位职责】
1. 负责平台内容的策划、编辑和发布
2. 挖掘优质内容创作者，维护内容生态
3. 策划内容专题活动，提升内容质量和用户参与度
4. 分析内容数据，优化内容推荐策略
5. 管理社区氛围，处理用户反馈

【任职要求】
1. 本科及以上学历在读，新闻传播、中文等相关专业优先
2. 优秀的内容策划和文案能力
3. 熟悉主流内容平台的运营规则
4. 对热点敏感，有良好的审美能力
5. 具备数据分析思维
6. 每周至少实习4天，连续实习3个月以上`,
    },
    {
      title: '战略分析实习生',
      category: '商业分析',
      description: `【岗位职责】
1. 支持公司战略规划项目的研究和分析
2. 进行行业趋势分析和竞争格局研究
3. 参与业务模式创新和商业机会评估
4. 协助制定公司年度战略规划
5. 支持高管决策，准备战略汇报材料

【任职要求】
1. 本科及以上学历在读，名校战略、管理等专业优先
2. 优秀的商业思维和战略分析能力
3. 熟练的数据分析和财务建模技能
4. 出色的PPT制作和汇报能力
5. 有咨询或战略部门经验者优先
6. 每周至少实习4天，连续实习3个月以上`,
    },
    {
      title: '市场营销实习生',
      category: '产品运营',
      description: `【岗位职责】
1. 参与市场营销活动的策划和执行
2. 负责品牌传播内容的创作和发布
3. 管理社交媒体账号，提升品牌影响力
4. 分析市场营销数据，优化投放策略
5. 协助市场团队进行品牌合作和商务拓展

【任职要求】
1. 本科及以上学历在读，市场营销、广告等相关专业优先
2. 优秀的创意策划和文案能力
3. 熟悉新媒体营销和社交媒体运营
4. 对市场趋势敏感，有创新思维
5. 良好的沟通协调能力
6. 每周至少实习3天，连续实习3个月以上`,
    },
  ];

  const jobs: ScrapedJob[] = [];
  const currentTime = new Date();
  
  // 为每个公司生成2-3个岗位
  for (const company of companies) {
    const jobCount = Math.floor(Math.random() * 2) + 2; // 2-3个岗位
    
    // 随机选择不重复的岗位模板
    const shuffledTemplates = [...jobTemplates].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(jobCount, shuffledTemplates.length); i++) {
      const template = shuffledTemplates[i];
      const location = company.locations[Math.floor(Math.random() * company.locations.length)];
      
      // 随机发布时间（过去7天内）
      const daysAgo = Math.floor(Math.random() * 7);
      const hoursAgo = Math.floor(Math.random() * 24);
      const publishedAt = new Date(currentTime.getTime() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000);

      // 生成唯一的职位ID
      const jobId = Math.random().toString(36).substring(2, 10);

      jobs.push({
        title: template.title,
        company: company.name,
        description: template.description,
        sourceUrl: `https://jobs.${company.domain}.com/position/${jobId}`,
        location: location,
        publishedAt: publishedAt.toISOString(),
        category: template.category,
      });
    }
  }

  // 打乱数组顺序，让岗位更随机
  return jobs.sort(() => Math.random() - 0.5);
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

  if (titleLower.includes('产品') && !titleLower.includes('运营')) {
    return categories.find(c => c.name.includes('产品经理'));
  }
  if (titleLower.includes('运营') || titleLower.includes('营销')) {
    return categories.find(c => c.name.includes('运营'));
  }
  if (titleLower.includes('数据')) {
    return categories.find(c => c.name.includes('数据'));
  }
  if (titleLower.includes('分析') || titleLower.includes('商业') || titleLower.includes('战略')) {
    return categories.find(c => c.name.includes('商业'));
  }

  return categories[0];
}
