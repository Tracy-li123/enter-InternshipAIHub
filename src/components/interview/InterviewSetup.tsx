import { Job } from '@/types/job';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, BrainCircuit, FileText, ChevronRight } from 'lucide-react';
import { isPMRoleClient, isAIPMRoleClient } from '@/lib/pm-question-bank';

export type InterviewMode = 'quick' | 'ai_mock' | 'prep';

interface InterviewSetupProps {
  job: Job;
  onSelectMode: (mode: InterviewMode) => void;
}

export function InterviewSetup({ job, onSelectMode }: InterviewSetupProps) {
  const isPM = isPMRoleClient(job.title, job.category?.name ?? '');
  const isAIPM = isAIPMRoleClient(job.title, job.category?.name ?? '');

  const modes = [
    {
      key: 'quick' as InterviewMode,
      icon: Zap,
      title: '快速练习',
      badge: null,
      description: '不调用AI，速度快，适合刷题和熟悉题型。每次随机抽取8道题，逐题练习，自我评估。',
      features: ['即时加载，无需等待', '产品经理专属题库', '按自己节奏刷题'],
      cta: '开始快速练习',
      variant: 'outline' as const,
    },
    {
      key: 'ai_mock' as InterviewMode,
      icon: BrainCircuit,
      title: 'AI 面试官',
      badge: '推荐',
      description: '调用DeepSeek，一问一答模拟真实面试，每道题给出评分、亮点、不足和追问。',
      features: ['评分 X/5 + 详细反馈', '追问和改写建议', '最后生成总结报告'],
      cta: '开始 AI 模拟面试',
      variant: 'default' as const,
    },
    {
      key: 'prep' as InterviewMode,
      icon: FileText,
      title: '简历 + JD 个性化准备',
      badge: null,
      description: '上传简历和岗位JD（.docx格式），AI生成专属准备方案：信号图谱、证据匹配、高概率题目、故事素材库。',
      features: ['JD Signal Map', '简历证据匹配', '高概率题 + 故事库'],
      cta: '上传简历开始准备',
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* PM Badge */}
        {isPM && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              {isAIPM ? 'AI产品经理专属题库已启用' : '产品经理专属题库已启用'}
            </span>
            {isAIPM && (
              <div className="flex gap-1 ml-auto flex-wrap">
                {['RAG', 'Agent', 'Prompt', '评测体系'].map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mode Cards */}
        <div className="space-y-4">
          {modes.map(({ key, icon: Icon, title, badge, description, features, cta, variant }) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all hover:shadow-md ${
                variant === 'default' ? 'border-primary/30 bg-primary/5' : ''
              }`}
              onClick={() => onSelectMode(key)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${variant === 'default' ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`h-5 w-5 ${variant === 'default' ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{title}</CardTitle>
                        {badge && (
                          <Badge className="text-xs px-2 py-0">{badge}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
                </div>
                <CardDescription className="text-sm leading-relaxed mt-1">
                  {description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2 mb-4">
                  {features.map(f => (
                    <span key={f} className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground">
                      {f}
                    </span>
                  ))}
                </div>
                <Button
                  variant={variant}
                  size="sm"
                  className="w-full"
                  onClick={(e) => { e.stopPropagation(); onSelectMode(key); }}
                >
                  {cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skill Attribution */}
        <p className="text-xs text-muted-foreground text-center">
          题库来源：non-technical-interview-coach skill
          · 支持产品经理、AI PM、产品运营等岗位
        </p>
      </div>
    </div>
  );
}
