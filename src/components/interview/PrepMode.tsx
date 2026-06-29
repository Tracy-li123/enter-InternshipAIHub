import { useState, useRef, useCallback } from 'react';
import { Job } from '@/types/job';
import { useInterviewPrep } from '@/hooks/use-interview-prep';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileText, X, Loader2, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';

interface PrepModeProps {
  job: Job;
  onBack: () => void;
}

interface UploadedFile {
  name: string;
  text: string;
}

// Use mammoth to extract text from .docx
async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export function PrepMode({ job, onBack }: PrepModeProps) {
  const [resumeFile, setResumeFile] = useState<UploadedFile | null>(null);
  const [jdFile, setJdFile] = useState<UploadedFile | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [isParsingJd, setIsParsingJd] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);

  const { prepContent, isLoading, error, generatePrep, reset } = useInterviewPrep(
    job.title,
    job.category?.name ?? '',
    job.company ?? '',
  );

  const handleFileUpload = useCallback(async (
    file: File,
    setFile: (f: UploadedFile | null) => void,
    setIsParsingState: (b: boolean) => void,
  ) => {
    setUploadError(null);
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      setUploadError('请上传 .docx 格式的文件');
      return;
    }
    setIsParsingState(true);
    try {
      const text = await extractDocxText(file);
      if (!text.trim()) {
        setUploadError('文件内容为空，请检查文件是否正确');
        return;
      }
      setFile({ name: file.name, text });
    } catch {
      setUploadError('文件解析失败，请确保是有效的 .docx 文件');
    } finally {
      setIsParsingState(false);
    }
  }, []);

  const handleGenerate = () => {
    if (!resumeFile || !jdFile) return;
    generatePrep(resumeFile.text, jdFile.text);
  };

  const canGenerate = resumeFile && jdFile && !isLoading;

  // If we have prep content, show it
  if (prepContent || isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { reset(); }} disabled={isLoading}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h3 className="font-semibold text-sm">个性化面试准备方案</h3>
              <p className="text-xs text-muted-foreground">{job.title} · {job.company}</p>
            </div>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              AI 分析中...
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 max-w-3xl mx-auto">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {prepContent && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <PrepContentRenderer content={prepContent} isStreaming={isLoading} />
              </div>
            )}
            {isLoading && !prepContent && (
              <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                正在生成个性化准备方案...
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Upload screen
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-semibold">简历 + JD 个性化准备</h2>
            <p className="text-sm text-muted-foreground">上传简历和岗位JD，生成专属面试准备方案</p>
          </div>
        </div>

        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Resume upload */}
        <FileUploadCard
          label="简历"
          description="上传你的简历（.docx 格式）"
          file={resumeFile}
          isParsing={isParsingResume}
          inputRef={resumeInputRef}
          onFileChange={(f) => handleFileUpload(f, setResumeFile, setIsParsingResume)}
          onRemove={() => setResumeFile(null)}
        />

        {/* JD upload */}
        <FileUploadCard
          label="岗位JD"
          description="上传目标岗位的职位描述（.docx 格式）"
          file={jdFile}
          isParsing={isParsingJd}
          inputRef={jdInputRef}
          onFileChange={(f) => handleFileUpload(f, setJdFile, setIsParsingJd)}
          onRemove={() => setJdFile(null)}
        />

        {/* Output preview */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">生成内容包括</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              {[
                'JD Signal Map', '简历证据匹配', '差距风险分析',
                '高概率面试题', 'STAR+ 故事库', '优先练习清单',
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          disabled={!canGenerate}
          onClick={handleGenerate}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isLoading ? '生成中...' : '生成个性化准备方案'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          简历和JD内容仅用于本次生成，不会被保存
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function FileUploadCard({
  label,
  description,
  file,
  isParsing,
  inputRef,
  onFileChange,
  onRemove,
}: {
  label: string;
  description: string;
  file: { name: string; text: string } | null;
  isParsing: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{label}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <input
          ref={inputRef}
          type="file"
          accept=".docx,.doc"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileChange(f);
            e.target.value = '';
          }}
        />
        {file ? (
          <div className="flex items-center gap-3 p-3 rounded-md bg-muted">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {file.text.slice(0, 80).replace(/\n/g, ' ')}...
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full border-dashed h-20 flex-col gap-2"
            disabled={isParsing}
            onClick={() => inputRef.current?.click()}
          >
            {isParsing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">解析中...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">点击上传 .docx 文件</span>
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function PrepContentRenderer({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  // Split by ## headings and render each section
  const sections = content.split(/(?=^## )/m).filter(Boolean);

  return (
    <div className="space-y-6">
      {sections.map((section, i) => {
        const lines = section.split('\n');
        const heading = lines[0].replace(/^## /, '').trim();
        const body = lines.slice(1).join('\n').trim();

        return (
          <div key={i} className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2.5">
              <h3 className="font-semibold text-sm">{heading}</h3>
            </div>
            <div className="p-4">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground">
                {body}
              </pre>
            </div>
          </div>
        );
      })}
      {isStreaming && content && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          继续生成...
        </div>
      )}
    </div>
  );
}
