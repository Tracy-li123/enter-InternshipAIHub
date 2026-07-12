import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJob } from '@/hooks/use-jobs';
import { InterviewSetup, InterviewMode } from '@/components/interview/InterviewSetup';
import { QuickPracticeMode } from '@/components/interview/QuickPracticeMode';
import { PersonalizedMode } from '@/components/interview/PersonalizedMode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type PageState = 'setup' | InterviewMode;

export default function Interview() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading: jobLoading } = useJob(jobId!);
  const [pageState, setPageState] = useState<PageState>('setup');

  const handleSelectMode = (mode: InterviewMode) => {
    setPageState(mode);
  };

  if (jobLoading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="border-b p-4">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">岗位不存在</p>
            <Button onClick={() => navigate('/')} className="w-full mt-4">
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (pageState === 'setup') navigate('/');
              else setPageState('setup');
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="font-semibold text-base truncate">{job.title}</h1>
              {job.category && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {job.category.name}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{job.company}</p>
          </div>

          {/* Back to mode selection */}
          {pageState !== 'setup' && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 shrink-0"
              onClick={() => setPageState('setup')}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">切换模式</span>
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      {pageState === 'setup' && (
        <InterviewSetup job={job} onSelectMode={handleSelectMode} />
      )}

      {pageState === 'quick' && (
        <QuickPracticeMode job={job} onBack={() => setPageState('setup')} />
      )}

      {pageState === 'personalized' && (
        <PersonalizedMode job={job} onBack={() => setPageState('setup')} />
      )}
    </div>
  );
}
