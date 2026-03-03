import { Job } from '@/types/job';

interface CompanyInfo {
  name: string;
  description: string;
  businessModel: {
    title: string;
    sections: Array<{
      name: string;
      content: string;
      keyPoints: string[];
    }>;
  };
  products: string[];
}

interface PositionInfo {
  keywords: string[];
  title: string;
  description: string;
  sections: Array<{
    name: string;
    content: string;
    keyPoints: string[];
  }>;
}

// 公司商业化知识库
export const companyKnowledge: Record<string, CompanyInfo> = {
  '字节跳动': {
    name: '字节跳动',
    description: '字节跳动是全球领先的移动互联网公司，旗下拥有抖音、今日头条等多款现象级产品。',
    products: ['抖音', '今日头条', '西瓜视频', '飞书', 'TikTok'],
    businessModel: {
      title: '字节跳动商业化体系',
      sections: [
        {
          name: '信息流广告',
          content: '字节跳动的核心变现模式，基于推荐算法的精准广告投放',
          keyPoints: [
            '原生广告形式，与内容深度融合',
            '基于用户兴趣的智能推荐',
            'oCPM优化出价模型，追求转化效果',
            '支持品牌广告、效果广告、本地生活等多种形式',
          ],
        },
        {
          name: '广告竞价机制',
          content: '今日头条采用oCPM（优化千次展示成本）竞价模式',
          keyPoints: [
            'eCPM = 出价 × 预估点击率 × 预估转化率 × 1000',
            '实时竞价RTB，每次展示机会都进行竞价',
            '广告质量度影响竞价排名',
            '智能出价策略优化广告投放效果',
          ],
        },
        {
          name: '广告策略优化',
          content: '通过数据分析和A/B测试持续优化广告效果',
          keyPoints: [
            '定向策略：性别、年龄、地域、兴趣标签等多维定向',
            '创意优化：多素材测试，找到高点击率创意',
            '落地页优化：提升转化率，降低跳出率',
            'ROI监控：实时跟踪广告投放回报率',
          ],
        },
        {
          name: '电商变现',
          content: '抖音电商快速崛起，GMV持续增长',
          keyPoints: [
            '直播带货：实时互动，边看边买',
            '短视频带货：种草型内容营销',
            '抖音商城：独立电商生态',
            '达人合作：KOL/KOC内容带货',
          ],
        },
      ],
    },
  },
  
  '腾讯': {
    name: '腾讯',
    description: '中国最大的互联网综合服务提供商，业务涵盖社交、游戏、金融等领域。',
    products: ['微信', 'QQ', '王者荣耀', '腾讯视频', '微信支付'],
    businessModel: {
      title: '腾讯商业化体系',
      sections: [
        {
          name: '社交广告',
          content: '基于微信、QQ等社交平台的广告体系',
          keyPoints: [
            '朋友圈广告：原生信息流形式，高用户触达',
            '公众号广告：内容营销，精准粉丝触达',
            '小程序广告：转化路径短，效果可追踪',
            '社交裂变：利用社交关系链传播',
          ],
        },
        {
          name: '游戏变现',
          content: '游戏业务是腾讯最大营收来源',
          keyPoints: [
            '道具收费：皮肤、装备等虚拟商品',
            '通行证系统：赛季制付费内容',
            '抽卡系统：概率型商业化',
            'IP联动：品牌合作增加商业价值',
          ],
        },
        {
          name: '金融科技',
          content: '微信支付和理财通构建金融生态',
          keyPoints: [
            '支付手续费：商家交易抽成',
            '理财产品：货币基金、定期理财',
            '信用支付：微粒贷等消费金融',
          ],
        },
      ],
    },
  },

  '阿里巴巴': {
    name: '阿里巴巴',
    description: '全球最大的电商平台之一，构建了完整的数字商业生态。',
    products: ['淘宝', '天猫', '支付宝', '菜鸟', '钉钉', '阿里云'],
    businessModel: {
      title: '阿里巴巴商业化体系',
      sections: [
        {
          name: '电商广告',
          content: '基于电商场景的广告体系',
          keyPoints: [
            '直通车：关键词竞价广告',
            '钻展：展示类广告',
            '超级推荐：智能推荐广告',
            '品销合一：品牌曝光+效果转化',
          ],
        },
        {
          name: '佣金与服务费',
          content: '平台交易佣金是重要营收来源',
          keyPoints: [
            '天猫年费及佣金：商家入驻费用',
            '技术服务费：平台服务费',
            '增值服务：数据、营销工具等',
          ],
        },
        {
          name: '云计算',
          content: '阿里云是亚洲最大的云服务提供商',
          keyPoints: [
            '计算服务：ECS、函数计算',
            '存储服务：OSS对象存储',
            'CDN加速：内容分发网络',
          ],
        },
      ],
    },
  },

  '拼多多': {
    name: '拼多多',
    description: '新电商平台，以低价拼团模式起家，现已发展为综合电商平台。',
    products: ['拼多多', '多多买菜', 'Temu'],
    businessModel: {
      title: '拼多多商业化体系',
      sections: [
        {
          name: '广告收入',
          content: '搜索广告和推荐广告是核心营收',
          keyPoints: [
            '搜索推广：关键词竞价',
            '场景推广：首页、频道页等场景广告',
            '多多场景：全站资源位广告',
            '拼单返现：激励用户分享',
          ],
        },
      ],
    },
  },

  '美团': {
    name: '美团',
    description: '本地生活服务平台，覆盖餐饮、酒旅、出行等多个场景。',
    products: ['美团外卖', '美团买菜', '美团酒店', '美团打车'],
    businessModel: {
      title: '美团商业化体系',
      sections: [
        {
          name: '佣金收入',
          content: '平台交易佣金是核心营收',
          keyPoints: [
            '外卖佣金：每单收取商家佣金',
            '酒旅佣金：订单金额的百分比',
            '到店佣金：团购等服务佣金',
          ],
        },
        {
          name: '广告收入',
          content: '商家推广服务',
          keyPoints: [
            '搜索广告：关键词推广',
            '展示广告：banner、信息流',
            '直通车：店铺推广工具',
          ],
        },
      ],
    },
  },

  '百度': {
    name: '百度',
    description: '中国最大的搜索引擎，AI技术领先企业。',
    products: ['百度搜索', '百度地图', '百度网盘', '文心一言'],
    businessModel: {
      title: '百度商业化体系',
      sections: [
        {
          name: '搜索广告',
          content: '百度核心营收来源',
          keyPoints: [
            '关键词竞价：CPC点击付费',
            '品牌专区：品牌保护和展示',
            '知识营销：百度百科、知道推广',
          ],
        },
        {
          name: 'AI商业化',
          content: '文心一言等AI产品商业化探索',
          keyPoints: [
            'API调用：按量计费',
            '企业定制：私有化部署',
            '行业解决方案：垂直领域应用',
          ],
        },
      ],
    },
  },

  '小红书': {
    name: '小红书',
    description: '生活方式分享平台，以种草内容和社区互动为核心。',
    products: ['小红书App', '小红书商城'],
    businessModel: {
      title: '小红书商业化体系',
      sections: [
        {
          name: '广告收入',
          content: '信息流广告和搜索广告',
          keyPoints: [
            '信息流广告：原生内容形式',
            '搜索广告：关键词推广',
            'KOL合作：达人种草推广',
          ],
        },
        {
          name: '电商变现',
          content: '从种草到拔草的闭环',
          keyPoints: [
            '自营商城：精选商品',
            '第三方店铺：品牌入驻',
            '直播带货：内容+电商',
          ],
        },
      ],
    },
  },

  '哔哩哔哩': {
    name: '哔哩哔哩',
    description: '年轻人的视频社区，以ACG内容起家。',
    products: ['哔哩哔哩视频', '哔哩哔哩直播', '哔哩哔哩游戏'],
    businessModel: {
      title: '哔哩哔哩商业化体系',
      sections: [
        {
          name: '增值服务',
          content: '大会员和直播礼物',
          keyPoints: [
            '大会员订阅：去广告、高清画质',
            '直播礼物：虚拟礼物打赏',
            '付费内容：番剧、课程',
          ],
        },
        {
          name: '广告收入',
          content: '商业化探索',
          keyPoints: [
            '贴片广告：视频前中后广告',
            '品牌合作：定制内容营销',
            'UP主商单：创作者接广告',
          ],
        },
      ],
    },
  },

  '快手': {
    name: '快手',
    description: '短视频和直播平台，注重普惠和真实。',
    products: ['快手', '快手极速版', '快手电商'],
    businessModel: {
      title: '快手商业化体系',
      sections: [
        {
          name: '直播打赏',
          content: '用户给主播送礼物',
          keyPoints: [
            '虚拟礼物：平台分成',
            '主播公会：签约分成',
            'PK连麦：互动带动打赏',
          ],
        },
        {
          name: '电商广告',
          content: '电商业务快速增长',
          keyPoints: [
            '直播带货：主播卖货分佣',
            '短视频带货：内容营销',
            '广告推广：商家推广工具',
          ],
        },
      ],
    },
  },
};

// 岗位专业知识库
export const positionKnowledge: Record<string, PositionInfo> = {
  '商业化': {
    keywords: ['商业化', '广告', '变现', '营收'],
    title: '互联网商业化核心知识',
    description: '了解互联网产品如何通过广告、会员等方式实现变现',
    sections: [
      {
        name: '常见商业化模式',
        content: '互联网产品的主要变现方式',
        keyPoints: [
          '广告变现：展示广告、信息流广告、搜索广告',
          '会员订阅：视频会员、音乐会员、知识付费',
          '电商变现：直播带货、短视频带货、平台佣金',
          '游戏道具：皮肤、装备等虚拟商品',
          '增值服务：会员特权、付费功能',
        ],
      },
      {
        name: '广告竞价机制',
        content: '理解广告如何定价和投放',
        keyPoints: [
          'CPM（千次展示成本）：按展示次数计费',
          'CPC（单次点击成本）：按点击次数计费',
          'CPA（单次行动成本）：按转化行为计费',
          'oCPM：优化的CPM，追求转化效果',
          'RTB实时竞价：每次展示进行竞价',
        ],
      },
      {
        name: '广告效果优化',
        content: '如何提升广告ROI',
        keyPoints: [
          '定向优化：精准人群定向，减少浪费',
          '创意优化：A/B测试找到高CTR素材',
          '出价策略：智能出价vs固定出价',
          '落地页优化：提升转化率',
          '数据分析：监控核心指标，及时调整',
        ],
      },
    ],
  },

  '数据分析': {
    keywords: ['数据', '分析', 'SQL', 'Python', '算法'],
    title: '数据分析核心能力',
    description: '掌握数据处理、分析和可视化的关键技能',
    sections: [
      {
        name: '数据处理工具',
        content: '必备的数据分析工具和技能',
        keyPoints: [
          'SQL：数据查询、关联、聚合分析',
          'Python：pandas数据清洗、numpy科学计算',
          'Excel：快速数据透视和可视化',
          'Tableau/Power BI：专业数据可视化工具',
        ],
      },
      {
        name: '分析方法论',
        content: '常用的数据分析框架',
        keyPoints: [
          '指标体系：北极星指标、关键指标树',
          '漏斗分析：找到流失环节',
          '归因分析：找到问题根本原因',
          'A/B测试：科学验证假设',
          '用户分层：RFM模型、用户画像',
        ],
      },
      {
        name: '业务理解',
        content: '从数据到业务洞察',
        keyPoints: [
          '理解业务逻辑和商业模式',
          '找到影响核心指标的因素',
          '数据驱动决策而非拍脑袋',
          '将分析结果转化为行动建议',
        ],
      },
    ],
  },

  '产品': {
    keywords: ['产品', 'PM', '需求', '经理'],
    title: '产品经理核心能力',
    description: '产品规划、设计和管理的关键技能',
    sections: [
      {
        name: '需求分析',
        content: '理解用户需求，找到产品机会',
        keyPoints: [
          '用户调研：访谈、问卷、数据分析',
          '需求优先级：KANO模型、MoSCoW法则',
          '场景分析：用户在什么场景下使用',
          '竞品分析：学习对手的优缺点',
        ],
      },
      {
        name: '产品设计',
        content: '设计产品功能和交互',
        keyPoints: [
          '信息架构：内容的组织和层级',
          '交互设计：用户操作流程设计',
          '原型工具：Axure、Figma使用',
          '设计原则：简单、一致、可预期',
        ],
      },
      {
        name: '项目管理',
        content: '推动产品上线',
        keyPoints: [
          '需求文档PRD撰写',
          '跨团队协作：研发、设计、运营',
          '项目进度把控',
          '上线后数据跟踪和迭代',
        ],
      },
    ],
  },

  '运营': {
    keywords: ['运营', '活动', '用户', '内容'],
    title: '产品运营核心能力',
    description: '用户增长、活动策划和内容运营的关键技能',
    sections: [
      {
        name: '用户运营',
        content: '拉新、留存、促活、转化',
        keyPoints: [
          '用户生命周期管理',
          '用户分层运营',
          '用户激励体系设计',
          '社群运营',
        ],
      },
      {
        name: '活动运营',
        content: '策划和执行运营活动',
        keyPoints: [
          '活动策划：目标、玩法、奖励',
          '活动执行：流程把控、风险预案',
          '数据复盘：活动效果评估',
          '创意策划：吸引用户参与',
        ],
      },
      {
        name: '内容运营',
        content: '内容生产和分发',
        keyPoints: [
          '内容策划：选题、定位',
          '文案撰写：标题、正文、CTA',
          '内容分发：渠道选择、推送策略',
          'UGC运营：引导用户生产内容',
        ],
      },
    ],
  },

  '战略': {
    keywords: ['战略', '咨询', '商业'],
    title: '战略分析核心能力',
    description: '商业战略和市场分析的关键技能',
    sections: [
      {
        name: '战略分析框架',
        content: '常用的战略分析工具',
        keyPoints: [
          'SWOT分析：优势劣势机会威胁',
          '波特五力：行业竞争分析',
          'BCG矩阵：业务组合分析',
          'PEST分析：宏观环境分析',
        ],
      },
      {
        name: '市场研究',
        content: '理解市场和竞争',
        keyPoints: [
          '市场规模测算：TAM/SAM/SOM',
          '竞争格局分析：市场份额、护城河',
          '用户洞察：痛点、需求、行为',
          '趋势预判：技术、政策、消费变化',
        ],
      },
    ],
  },
};

// 生成学习内容
export function generateStudyContent(job: Job) {
  // 匹配公司知识
  const company = companyKnowledge[job.company];

  // 匹配岗位知识
  let position = null;
  for (const [, info] of Object.entries(positionKnowledge)) {
    if (info.keywords.some(keyword => job.title.toLowerCase().includes(keyword))) {
      position = info;
      break;
    }
  }

  return {
    company,
    position,
    job,
  };
}
