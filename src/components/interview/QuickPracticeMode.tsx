import { useEffect } from 'react';
import { Job } from '@/types/job';
import { useQuickPractice } from '@/hooks/use-quick-practice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2, XCircle, SkipForward, ChevronDown, ChevronRight,
  RefreshCw, ArrowLeft, Trophy, Sparkles, Lightbulb,
} from 'lucide-react';
import { FRAMEWORK_DESCRIPTIONS } from '@/lib/pm-question-bank';
import { cn } from '@/lib/utils';

interface QuickPracticeModeProps {
  job: Job & { requirements?: string | null };
  onBack: () => void;
}

export function QuickPracticeMode({ job, onBack }: QuickPracticeModeProps) {
  const {
    questions,
    expandedIds,
    ratings,
    isAIPM,
    isLoading,
    error,
    isFallback,
    isComplete,
    masteredCount,
    needsPracticeCount,
    ratedCount,
    fetchQuestions,
    toggleExpand,
    rateQuestion,
    reset,
  } = useQuickPractice(
    job.title,
    job.category?.name ?? '',
    job.company ?? '',
    job.description ?? '',
    job.requirements ?? '',
  );

  useEffect(() => {
    fetchQuestions(8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 p-6 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Sparkles className="h-4 w-4 animate-pulse" />
          AI 正在为该岗位生成定制题目...
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => fetchQuestions(8)}>重试</Button>
      </div>
    );
  }

  // Summary screen once all questions are rated
  if (isComplete) {
    const needsPracticeList = questions.filter(q => ratings[q.id] === 'needs_practice');
    return (
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Trophy className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">练习完成</h2>
          <p className="text-muted-foreground">共完成 {questions.length} 道题</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{masteredCount}</div>
              <div className="text-sm text-muted-foreground mt-1">已掌握</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{needsPracticeCount}</div>
              <div className="text-sm text-muted-foreground mt-1">需要练习</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-muted-foreground">
                {questions.length - masteredCount - needsPracticeCount}
              </div>
              <div className="text-sm text-muted-foreground mt-1">已跳过</div>
            </CardContent>
          </Card>
        </div>

        {needsPracticeList.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
              需要重点练习
            </h3>
            <div className="space-y-2">
              {needsPracticeList.map(q => (
                <div key={q.id} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm">{q.question}</p>
                  <Badge variant="outline" className="mt-2 text-xs">{q.category}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回选择
          </Button>
          <Button className="flex-1" onClick={() => { reset(); fetchQuestions(8); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            换一批题目
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>已完成 {ratedCount} / {questions.length} 题</span>
            {isAIPM && <Badge variant="secondary" className="text-xs">AI PM 专项</Badge>}
            {isFallback && <Badge variant="outline" className="text-xs">备用题库</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => { reset(); fetchQuestions(8); }}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            换一批
          </Button>
        </div>

        {questions.map((q) => {
          const isExpanded = expandedIds.has(q.id);
          const rating = ratings[q.id];
          const frameworkDesc = q.framework ? FRAMEWORK_DESCRIPTIONS[q.framework] : null;

          return (
            <Card key={q.id} className={cn('border-border/60', rating && 'opacity-70')}>
              <button
                className="w-full text-left px-5 py-4 flex items-start gap-3"
                onClick={() => toggleExpand(q.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">{q.category}</Badge>
                    {rating === 'mastered' && <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />}
                    {rating === 'needs_practice' && <XCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
                    {rating === 'skipped' && <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{q.question}</p>
                </div>
              </button>

              {isExpanded && (
                <CardContent className="pt-0 pb-5 pl-12 space-y-4">
                  {frameworkDesc && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span><span className="font-medium text-foreground">{q.framework}：</span>{frameworkDesc}</span>
                    </div>
                  )}

                  <div className="p-3 rounded-md bg-muted text-sm leading-relaxed whitespace-pre-wrap">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">参考答案</p>
                    {q.referenceAnswer}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-300 hover:bg-green-50 hover:border-green-400 dark:border-green-800 dark:hover:bg-green-950/20"
                      onClick={() => rateQuestion(q.id, 'mastered')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-600 dark:text-green-400" />
                      掌握
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-300 hover:bg-amber-50 hover:border-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/20"
                      onClick={() => rateQuestion(q.id, 'needs_practice')}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5 text-amber-600 dark:text-amber-400" />
                      需要练习
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rateQuestion(q.id, 'skipped')}
                    >
                      <SkipForward className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      跳过
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
