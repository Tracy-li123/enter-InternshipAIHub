import { useEffect } from 'react';
import { Job } from '@/types/job';
import { useQuickPractice } from '@/hooks/use-quick-practice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, SkipForward, Lightbulb, RefreshCw, ArrowLeft, Trophy } from 'lucide-react';
import { FRAMEWORK_DESCRIPTIONS } from '@/lib/pm-question-bank';

interface QuickPracticeModeProps {
  job: Job;
  onBack: () => void;
}

export function QuickPracticeMode({ job, onBack }: QuickPracticeModeProps) {
  const {
    questions,
    currentQuestion,
    currentIndex,
    ratings,
    isAIPM,
    isLoading,
    error,
    isShowingHint,
    isComplete,
    masteredCount,
    needsPracticeCount,
    fetchQuestions,
    rateQuestion,
    toggleHint,
    reset,
  } = useQuickPractice(job.title, job.category?.name ?? '', job.company ?? '');

  useEffect(() => {
    fetchQuestions(8);
  }, [fetchQuestions]);

  if (isLoading) {
    return (
      <div className="flex-1 p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-48 w-full" />
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
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

  // Summary screen
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
                  <p className="text-sm">{q.text}</p>
                  <Badge variant="outline" className="mt-2 text-xs">{q.categoryLabel}</Badge>
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
            再练一组
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;
  const frameworkDesc = currentQuestion.framework ? FRAMEWORK_DESCRIPTIONS[currentQuestion.framework] : null;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>第 {currentIndex + 1} 题 / 共 {questions.length} 题</span>
            <div className="flex gap-2">
              {isAIPM && <Badge variant="secondary" className="text-xs">AI PM 专项</Badge>}
              <span>{currentQuestion.categoryLabel}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              <Badge variant="outline" className="shrink-0 mt-0.5">{currentQuestion.source}</Badge>
            </div>
            <p className="text-lg font-medium leading-relaxed">{currentQuestion.text}</p>

            {/* Hint toggle */}
            {currentQuestion.framework && (
              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleHint}
                  className="text-muted-foreground h-8 px-2"
                >
                  <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
                  {isShowingHint ? '收起回答框架' : '查看回答框架'}
                </Button>
                {isShowingHint && frameworkDesc && (
                  <div className="mt-2 p-3 rounded-md bg-muted text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{currentQuestion.framework}：</span>
                    {frameworkDesc}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Think note */}
        <p className="text-sm text-muted-foreground text-center">
          先在脑子里或纸上组织你的回答，然后评估掌握程度
        </p>

        {/* Rating buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="flex-col h-auto py-3 gap-1 border-green-300 hover:bg-green-50 hover:border-green-400 dark:border-green-800 dark:hover:bg-green-950/20"
            onClick={() => rateQuestion(currentQuestion.id, 'mastered')}
          >
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-xs text-green-700 dark:text-green-300 font-medium">掌握</span>
          </Button>
          <Button
            variant="outline"
            className="flex-col h-auto py-3 gap-1 border-amber-300 hover:bg-amber-50 hover:border-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/20"
            onClick={() => rateQuestion(currentQuestion.id, 'needs_practice')}
          >
            <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">需要练习</span>
          </Button>
          <Button
            variant="outline"
            className="flex-col h-auto py-3 gap-1"
            onClick={() => rateQuestion(currentQuestion.id, 'skipped')}
          >
            <SkipForward className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">跳过</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
