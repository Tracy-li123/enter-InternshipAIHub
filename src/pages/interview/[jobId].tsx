import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJob } from '@/hooks/use-jobs';
import { useAIInterview } from '@/hooks/use-ai-interview';
import { InterviewMessage } from '@/components/interview/InterviewMessage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Interview() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading: jobLoading } = useJob(jobId!);
  const [inputValue, setInputValue] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { 
    messages, 
    isLoading: aiLoading, 
    error, 
    sendMessage, 
    startInterview 
  } = useAIInterview(job?.description || '');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  const handleStart = () => {
    setHasStarted(true);
    startInterview();
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
        <div className="flex items-center gap-4 px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-semibold text-lg truncate">{job.title}</h1>
              {job.category && (
                <Badge variant="outline" className="text-xs">
                  {job.category.name}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{job.company}</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1" ref={scrollRef}>
          {!hasStarted ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="max-w-md space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">AI 模拟面试</h2>
                  <p className="text-muted-foreground">
                    准备好开始面试了吗？AI面试官将根据岗位要求提出针对性的问题，并给予专业反馈。
                  </p>
                </div>

                {job.description && (
                  <Card>
                    <CardHeader>
                      <h3 className="font-semibold text-sm">岗位要求</h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground line-clamp-6 whitespace-pre-wrap">
                        {job.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Button 
                  size="lg" 
                  onClick={handleStart}
                  className="w-full"
                >
                  开始面试
                </Button>
              </div>
            </div>
          ) : (
            <div className="min-h-full">
              {messages.length === 0 && !aiLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  正在启动面试...
                </div>
              ) : (
                messages.map((message, index) => (
                  <InterviewMessage key={index} message={message} />
                ))
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        {hasStarted && (
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
              💡 提示：回答时可以使用STAR法则（情境、任务、行动、结果）来组织你的答案
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
