import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJob } from '@/hooks/use-jobs';
import { useAIInterview } from '@/hooks/use-ai-interview';
import { InterviewMessage } from '@/components/interview/InterviewMessage';
import { InterviewSetup, InterviewMode } from '@/components/interview/InterviewSetup';
import { QuickPracticeMode } from '@/components/interview/QuickPracticeMode';
import { PrepMode } from '@/components/interview/PrepMode';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, AlertCircle, LayoutGrid } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

type PageState = 'setup' | InterviewMode;

export default function Interview() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading: jobLoading } = useJob(jobId!);
  const [pageState, setPageState] = useState<PageState>('setup');
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading: aiLoading,
    error,
    sendMessage,
    startInterview,
  } = useAIInterview(
    job?.description || '',
    job?.title || '',
    job?.category?.name || '',
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSelectMode = (mode: InterviewMode) => {
    setPageState(mode);
    if (mode === 'ai_mock') {
      startInterview();
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || aiLoading) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

      {pageState === 'prep' && (
        <PrepMode job={job} onBack={() => setPageState('setup')} />
      )}

      {pageState === 'ai_mock' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1" ref={scrollRef}>
            <div className="min-h-full">
              {messages.length === 0 && !aiLoading ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                  AI 面试官正在准备中...
                </div>
              ) : (
                messages.map((message, index) => (
                  <InterviewMessage key={index} message={message} />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t bg-card p-4">
            {error && (
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="输入你的回答... (Shift + Enter 换行)"
                className="min-h-[80px] resize-none"
                disabled={aiLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || aiLoading}
                size="icon"
                className="h-[80px] w-[80px] shrink-0"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              建议使用 STAR+ 法则（情境→任务→行动→结果→反思）组织回答
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
