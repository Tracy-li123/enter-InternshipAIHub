import { useState } from 'react';
import { Job } from '@/types/job';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Lightbulb, HelpCircle, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StudyModeProps {
  job: Job;
  onStartMockInterview: () => void;
}

export function StudyMode({ job, onStartMockInterview }: StudyModeProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);

  // 根据岗位生成学习内容
  const industryKnowledge = generateIndustryKnowledge(job);
  const requiredSkills = generateRequiredSkills(job);
  const commonQuestions = generateCommonQuestions(job);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">学习模式</h2>
            <p className="text-sm text-muted-foreground mt-1">
              准备充分后再开始模拟面试
            </p>
          </div>
          <Button onClick={onStartMockInterview} size="lg">
            <MessageSquare className="h-4 w-4 mr-2" />
            开始模拟面试
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          <Tabs defaultValue="industry" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="industry" className="gap-2">
                <BookOpen className="h-4 w-4" />
                行业知识
              </TabsTrigger>
              <TabsTrigger value="skills" className="gap-2">
                <Lightbulb className="h-4 w-4" />
                能力要求
              </TabsTrigger>
              <TabsTrigger value="questions" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                常见问题
              </TabsTrigger>
            </TabsList>

            <TabsContent value="industry" className="mt-6 space-y-4">
              {industryKnowledge.map((item, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {item.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="skills" className="mt-6 space-y-4">
              {requiredSkills.map((skill, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{skill.name}</CardTitle>
                      <Badge>{skill.level}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{skill.description}</p>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">如何准备：</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {skill.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="questions" className="mt-6 space-y-4">
              <div className="grid gap-3">
                {commonQuestions.map((q, index) => (
                  <Card 
                    key={index}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedQuestion(selectedQuestion === index ? null : index)}
                  >
                    <CardHeader>
                      <CardTitle className="text-base font-medium">
                        {index + 1}. {q.question}
                      </CardTitle>
                    </CardHeader>
                    {selectedQuestion === index && (
                      <CardContent className="space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold mb-2 text-primary">
                            参考回答思路：
                          </h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {q.answer}
                          </p>
                        </div>
                        {q.tips && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2 text-primary">
                              回答要点：
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {q.tips.map((tip, tipIndex) => (
                                <li key={tipIndex} className="flex items-start gap-2">
                                  <span className="text-primary">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}

// 生成行业知识
function generateIndustryKnowledge(job: Job) {
  const title = job.title.toLowerCase();
  const company = job.company;

  const knowledge = [
    {
      title: `${company}公司背景`,
      content: `${company}是中国领先的互联网科技公司之一，在${
        title.includes('电商') ? '电商' :
        title.includes('社交') ? '社交' :
        title.includes('内容') ? '内容' : '互联网'
      }领域具有重要影响力。

公司核心业务包括：
• 主营产品和服务的市场定位
• 技术创新和产品迭代
• 用户规模和市场份额
• 商业模式和变现方式

了解公司背景有助于你更好地理解岗位价值和发展方向。`,
    },
    {
      title: '行业发展趋势',
      content: `当前${title.includes('产品') ? '产品' : title.includes('运营') ? '运营' : title.includes('数据') ? '数据' : '互联网'}行业正处于快速发展阶段，主要趋势包括：

• AI技术的深度应用和智能化升级
• 用户体验和个性化服务的重要性提升
• 数据驱动决策成为标准实践
• 移动端和多端协同体验优化

作为实习生，你需要关注这些趋势，并思考如何将其应用到实际工作中。`,
    },
  ];

  return knowledge;
}

// 生成能力要求
function generateRequiredSkills(job: Job) {
  const title = job.title.toLowerCase();
  
  const baseSkills = [
    {
      name: '逻辑思维能力',
      level: '核心要求',
      description: '能够清晰地分析问题、拆解需求、找到解决方案',
      tips: [
        '练习使用结构化思维框架（如金字塔原理）',
        '多做案例分析，培养问题拆解能力',
        '学习使用流程图、思维导图等工具',
      ],
    },
    {
      name: '沟通协作能力',
      level: '重要',
      description: '与团队成员高效沟通，推动项目进展',
      tips: [
        '主动参与团队讨论，表达自己的观点',
        '学会倾听他人意见，理解不同角色的诉求',
        '及时同步项目进度，建立信任关系',
      ],
    },
  ];

  if (title.includes('产品')) {
    baseSkills.push({
      name: '产品设计能力',
      level: '核心要求',
      description: '理解用户需求，设计产品功能和交互流程',
      tips: [
        '学习使用Axure、Figma等原型工具',
        '研究优秀产品的设计思路',
        '建立用户同理心，从用户角度思考问题',
      ],
    });
  }

  if (title.includes('数据') || title.includes('分析')) {
    baseSkills.push({
      name: '数据分析能力',
      level: '核心要求',
      description: '熟练使用数据工具，从数据中发现洞察',
      tips: [
        '熟练掌握SQL、Python等数据分析工具',
        '学习基础的统计学知识',
        '练习数据可视化和报告撰写',
      ],
    });
  }

  if (title.includes('运营')) {
    baseSkills.push({
      name: '内容创作能力',
      level: '重要',
      description: '撰写吸引用户的文案和策划创意活动',
      tips: [
        '多阅读优质内容，培养文案感觉',
        '研究成功的运营案例',
        '练习不同场景下的文案撰写',
      ],
    });
  }

  return baseSkills;
}

// 生成常见问题
function generateCommonQuestions(job: Job) {
  const title = job.title.toLowerCase();
  
  const commonQuestions = [
    {
      question: '请做一个简单的自我介绍',
      answer: `建议使用"现在-过去-未来"的结构：

现在：我是XX大学XX专业的学生，目前大三/研二
过去：在校期间我参与了XX项目，担任XX角色，取得了XX成果
未来：我对${job.title}岗位很感兴趣，希望能将所学应用到实践中

注意控制在1-2分钟内，突出与岗位相关的经历。`,
      tips: [
        '提前准备，但不要背稿',
        '突出与岗位匹配的经历',
        '展现你的热情和动力',
      ],
    },
    {
      question: '为什么选择我们公司？',
      answer: `可以从以下角度回答：

1. 公司层面：被公司的产品/文化/发展前景吸引
2. 岗位层面：岗位职责与自己的兴趣和能力匹配
3. 成长层面：公司能提供的学习和发展机会

例如："我一直在使用贵公司的产品，对其设计理念很认同。这个岗位的职责与我的实习经历高度匹配，我相信能快速上手并做出贡献..."`,
      tips: [
        '提前研究公司和产品',
        '展现对行业的了解',
        '表达真诚的兴趣',
      ],
    },
  ];

  if (title.includes('产品')) {
    commonQuestions.push({
      question: '如果让你改进XX产品，你会怎么做？',
      answer: `可以使用以下框架回答：

1. 现状分析：目前产品的优势和不足
2. 用户洞察：目标用户的痛点是什么
3. 解决方案：提出2-3个具体的改进建议
4. 效果预期：预期能带来什么价值

示例思路：
"首先我会分析产品的用户群体和使用场景...然后发现用户在XX环节存在XX痛点...我建议通过XX功能来解决...预期能提升XX%的用户留存..."`,
      tips: [
        '展现你的产品思维',
        '结合具体数据和案例',
        '考虑实现成本和优先级',
      ],
    });
  }

  if (title.includes('数据') || title.includes('分析')) {
    commonQuestions.push({
      question: '如何分析用户流失原因？',
      answer: `可以按照以下步骤：

1. 定义流失：明确流失的定义标准（如30天未活跃）
2. 数据收集：收集用户行为数据、留存数据
3. 特征分析：对比流失用户和留存用户的特征差异
4. 原因挖掘：通过用户调研、数据分析找到根本原因
5. 提出建议：针对原因提出优化方案

重点是展现你的数据思维和分析框架。`,
      tips: [
        '展现结构化的分析思路',
        '提到具体的分析方法和工具',
        '结合实际案例更佳',
      ],
    });
  }

  commonQuestions.push({
    question: '你的优势和劣势是什么？',
    answer: `优势：选择与岗位相关的1-2个优势，用具体事例证明
例如："我的逻辑思维能力较强，在XX项目中，我通过XX方法成功解决了XX问题..."

劣势：选择一个真实但不致命的劣势，并说明改进计划
例如："我在XX方面经验还不够丰富，但我正在通过XX方式学习提升..."

关键是展现自我认知和成长意愿。`,
    tips: [
      '优势要有具体事例支撑',
      '劣势要展现改进意识',
      '保持真诚，不要过于完美',
    ],
  });

  return commonQuestions;
}
