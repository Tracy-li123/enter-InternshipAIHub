import { Job } from '@/types/job';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, FileText, ChevronRight } from 'lucide-react';
import { isPMRoleClient, isAIPMRoleClient } from '@/lib/pm-question-bank';

export type InterviewMode = 'quick' | 'personalized';

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
      description: 'AI 针对该岗位实时生成定制题目和参考答案，每次换一批都不一样，适合快速刷题、熟悉题型。',
      features: ['针对岗位定制出题', '每题都有参考答案', '按自己节奏刷题'],
      cta: '开始快速练习',
      variant: 'outline' as const,
    },
    {
      key: 'personalized' as InterviewMode,
      icon: FileText,
      title: '个性化提问',
      badge: '推荐',
      description: '结合岗位JD（可选上传简历），AI生成可能会被问到的问题和参考答案，支持针对每道题继续追问、完善回答。',
      features: ['可选上传简历匹配JD', '题目 + 参考答案', '逐题追问完善'],
      cta: '开始个性化提问',
      variant: 'default' as const,
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
              {isAIPM ? 'AI产品经理专属出题已启用' : '产品经理专属出题已启用'}
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
      </div>
    </div>
  );
}
