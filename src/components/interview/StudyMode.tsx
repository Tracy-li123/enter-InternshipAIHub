import { Job } from '@/types/job';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Building2, Briefcase, MessageSquare, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { generateStudyContent } from '@/lib/knowledge-base';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface StudyModeProps {
  job: Job;
  onStartMockInterview: () => void;
}

export function StudyMode({ job, onStartMockInterview }: StudyModeProps) {
  const studyContent = generateStudyContent(job);

  // 常见面试问题（保持原有逻辑）
  const commonQuestions = [
    {
      question: '请介绍一下你自己',
      answer: '简要介绍教育背景、实习经历、项目经验，突出与岗位相关的技能和成就。',
      tips: ['控制在2-3分钟', '突出亮点', '与岗位相关'],
    },
    {
      question: '为什么想应聘这个岗位？',
      answer: '结合公司业务、岗位要求和个人兴趣，展示对公司和岗位的了解。',
      tips: ['展示对公司的了解', '结合自身优势', '表达职业规划'],
    },
    {
      question: '你最大的优势是什么？',
      answer: '选择2-3个与岗位最相关的优势，用具体案例支撑。',
      tips: ['用STAR法则讲故事', '突出可量化成果', '与JD要求匹配'],
    },
    {
      question: '遇到过什么困难，如何解决的？',
      answer: '用STAR法则：情境(Situation)、任务(Task)、行动(Action)、结果(Result)。',
      tips: ['选择有挑战性的案例', '突出解决问题的思路', '展示学习能力'],
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">学习模式</h2>
            <p className="text-sm text-muted-foreground mt-1">
              充分准备，提升面试通过率
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
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="company" className="gap-2">
                <Building2 className="h-4 w-4" />
                公司背景
              </TabsTrigger>
              <TabsTrigger value="position" className="gap-2">
                <Briefcase className="h-4 w-4" />
                岗位知识
              </TabsTrigger>
              <TabsTrigger value="questions" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                常见问题
              </TabsTrigger>
            </TabsList>

            {/* 公司背景 Tab */}
            <TabsContent value="company" className="mt-6">
              {studyContent.company ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {studyContent.company.name}
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        {studyContent.company.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-3 text-sm text-muted-foreground">核心产品</h4>
                        <div className="flex flex-wrap gap-2">
                          {studyContent.company.products.map(product => (
                            <Badge key={product} variant="secondary" className="text-sm">
                              {product}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">{studyContent.company.businessModel.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {studyContent.company.businessModel.sections.map((section, idx) => (
                        <div key={idx}>
                          {idx > 0 && <Separator className="my-6" />}
                          <div>
                            <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                              <div className="h-6 w-1 bg-primary rounded-full" />
                              {section.name}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4 ml-3">
                              {section.content}
                            </p>
                            <div className="bg-muted/50 rounded-lg p-4 ml-3">
                              <ul className="space-y-2.5">
                                {section.keyPoints.map((point, pointIdx) => (
                                  <li key={pointIdx} className="text-sm flex items-start gap-3">
                                    <span className="text-primary font-bold mt-0.5 text-base">•</span>
                                    <span className="flex-1">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="font-semibold text-lg mb-2">暂无该公司的详细资料</h3>
                    <p className="text-muted-foreground text-sm">
                      建议自行搜索了解公司背景和业务模式
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 岗位知识 Tab */}
            <TabsContent value="position" className="mt-6">
              {studyContent.position ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        {studyContent.position.title}
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        {studyContent.position.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {studyContent.position.sections.map((section, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-lg">{section.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {section.content}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <ul className="space-y-2.5">
                            {section.keyPoints.map((point, pointIdx) => (
                              <li key={pointIdx} className="text-sm flex items-start gap-3">
                                <span className="text-primary font-bold mt-0.5 text-base">•</span>
                                <span className="flex-1">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="font-semibold text-lg mb-2">暂无该岗位的专业知识</h3>
                    <p className="text-muted-foreground text-sm">
                      建议查看通用能力要求或自行学习相关专业知识
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 常见问题 Tab */}
            <TabsContent value="questions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    常见面试问题
                  </CardTitle>
                  <CardDescription>
                    准备这些问题，提升面试表现
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {commonQuestions.map((item, idx) => (
                      <AccordionItem key={idx} value={`item-${idx}`}>
                        <AccordionTrigger className="text-left font-medium">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3">
                          <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-sm leading-relaxed">{item.answer}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold mb-2 text-muted-foreground">回答要点：</p>
                            <ul className="space-y-1.5 ml-2">
                              {item.tips.map((tip, tipIdx) => (
                                <li key={tipIdx} className="text-sm flex items-start gap-2">
                                  <span className="text-primary mt-0.5">✓</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
