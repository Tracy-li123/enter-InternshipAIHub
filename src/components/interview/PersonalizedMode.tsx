import { useRef, useState } from 'react';
import { Job } from '@/types/job';
import { usePersonalizedQuestions } from '@/hooks/use-personalized-questions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload, FileText, X, Loader2, AlertCircle, ArrowLeft, Sparkles,
  ChevronDown, ChevronRight, Lightbulb, Send, RefreshCw,
} from 'lucide-react';
import { FRAMEWORK_DESCRIPTIONS } from '@/lib/pm-question-bank';
import { cn } from '@/lib/utils';

interface PersonalizedModeProps {
  job: Job & { requirements?: string | null };
  onBack: () => void;
}

interface UploadedFile {
  name: string;
  text: string;
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export function PersonalizedMode({ job, onBack }: PersonalizedModeProps) {
  const [resumeFile, setResumeFile] = useState<UploadedFile | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const {
    questions, isLoading, error, hasGenerated,
    followups, followupLoading,
    generateQuestions, sendFollowup, reset,
  } = usePersonalizedQuestions({
    jobTitle: job.title,
    jobCategory: job.category?.name ?? '',
    company: job.company ?? '',
    jobDescription: job.description ?? '',
    jobRequirements: job.requirements ?? '',
  });

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      setUploadError('请上传 .docx 格式的文件');
      return;
    }
    setIsParsing(true);
    try {
      const text = await extractDocxText(file);
      if (!text.trim()) {
        setUploadError('文件内容为空，请检查文件是否正确');
        return;
      }
      setResumeFile({ name: file.name, text });
    } catch {
      setUploadError('文件解析失败，请确保是有效的 .docx 文件');
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerate = () => {
    generateQuestions(resumeFile?.text ?? '', 6);
  };

  // ── Results screen ──────────────────────────────────────────────────────
  if (hasGenerated || isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => reset()} disabled={isLoading}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h3 className="font-semibold text-sm">个性化面试问题</h3>
                <p className="text-xs text-muted-foreground">{job.title} · {job.company}</p>
              </div>
            </div>
            {!isLoading && (
              <Button variant="ghost" size="sm" onClick={() => generateQuestions(resumeFile?.text ?? '', 6)}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                换一批
              </Button>
            )}
          </div>

          {isLoading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 animate-pulse" />
                AI 正在结合{resumeFile ? '简历和' : ''}岗位信息生成问题...
              </div>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isLoading && questions.map(q => (
            <QuestionItem
              key={q.id}
              question={q}
              followupMessages={followups[q.id] ?? []}
              isFollowupLoading={!!followupLoading[q.id]}
              onSendFollowup={(content) => sendFollowup(q.id, content)}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Setup screen ─────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-semibold">个性化提问</h2>
            <p className="text-sm text-muted-foreground">结合岗位JD{resumeFile ? '和你的简历' : ''}，AI生成可能会被问到的问题</p>
          </div>
        </div>

        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Resume upload — optional */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">简历（可选）</p>
              <span className="text-xs text-muted-foreground">不上传则仅结合岗位信息出题</span>
            </div>
            <input
              ref={resumeInputRef}
              type="file"
              accept=".docx,.doc"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
                e.target.value = '';
              }}
            />
            {resumeFile ? (
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{resumeFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {resumeFile.text.slice(0, 80).replace(/\n/g, ' ')}...
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setResumeFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed h-16 flex-col gap-1.5"
                disabled={isParsing}
                onClick={() => resumeInputRef.current?.click()}
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">解析中...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">点击上传 .docx 简历（可选）</span>
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Job context preview */}
        <Card className="bg-muted/30">
          <CardContent className="pt-5">
            <p className="text-sm font-medium mb-1">将使用的岗位信息</p>
            <p className="text-sm text-muted-foreground">{job.title} · {job.company}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {job.description || '暂无岗位描述'}
            </p>
          </CardContent>
        </Card>

        <Button className="w-full" size="lg" onClick={handleGenerate}>
          <Sparkles className="h-4 w-4 mr-2" />
          生成个性化问题
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          简历内容仅用于本次生成，不会被保存
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function QuestionItem({
  question,
  followupMessages,
  isFollowupLoading,
  onSendFollowup,
}: {
  question: { id: string; question: string; reason: string; framework: string | null; referenceAnswer: string };
  followupMessages: { role: 'user' | 'assistant'; content: string; isStreaming?: boolean }[];
  isFollowupLoading: boolean;
  onSendFollowup: (content: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const frameworkDesc = question.framework ? FRAMEWORK_DESCRIPTIONS[question.framework] : null;

  const handleSend = () => {
    if (!inputValue.trim() || isFollowupLoading) return;
    onSendFollowup(inputValue);
    setInputValue('');
  };

  return (
    <Card className="border-border/60">
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">{question.question}</p>
          {question.reason && (
            <p className="text-xs text-muted-foreground mt-1.5">{question.reason}</p>
          )}
        </div>
      </button>

      {isExpanded && (
        <CardContent className="pt-0 pb-5 pl-12 space-y-4">
          {frameworkDesc && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span><span className="font-medium text-foreground">{question.framework}：</span>{frameworkDesc}</span>
            </div>
          )}

          <div className="p-3 rounded-md bg-muted text-sm leading-relaxed whitespace-pre-wrap">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">参考答案</p>
            {question.referenceAnswer}
          </div>

          {/* Per-question follow-up conversation */}
          {followupMessages.length > 0 && (
            <div className="space-y-2">
              {followupMessages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'text-sm p-3 rounded-md whitespace-pre-wrap leading-relaxed',
                    m.role === 'user' ? 'bg-primary/10 ml-6' : 'bg-muted mr-6',
                  )}
                >
                  {m.content}
                  {m.isStreaming && <span className="inline-block w-1.5 h-4 bg-current animate-pulse ml-0.5" />}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="针对这道题追问或完善你的回答..."
              className="min-h-[60px] resize-none text-sm"
              disabled={isFollowupLoading}
            />
            <Button
              size="icon"
              className="h-[60px] w-[48px] shrink-0"
              disabled={!inputValue.trim() || isFollowupLoading}
              onClick={handleSend}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
