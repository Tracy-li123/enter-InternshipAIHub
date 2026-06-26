import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Link2, PenSquare, ArrowLeft, Loader2, AlertCircle, Search, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface SearchResult {
  title: string;
  location?: string;
  url: string;
  description?: string;
}

export default function ImportPage() {
  const navigate = useNavigate();
  
  // 链接导入
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 手动添加
  const [manualForm, setManualForm] = useState({
    title: '',
    company: '',
    location: '',
    sourceUrl: '',
    description: '',
  });

  // 智能搜索
  const [searchCompany, setSearchCompany] = useState('');
  const [searchJobType, setSearchJobType] = useState('实习');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);

  const [activeTab, setActiveTab] = useState('search');

  // 链接导入处理
  const handleImport = async () => {
    if (!url.trim()) {
      toast.error('请输入岗位链接');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('import-job-from-url', {
        body: { url: url.trim() },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        navigate('/');
      } else if (data.needManualInput) {
        setError(data.error);
        setActiveTab('manual');
      } else {
        setError(data.error || '导入失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 手动添加处理
  const handleManualAdd = async () => {
    if (!manualForm.title.trim() || !manualForm.company.trim()) {
      toast.error('请填写岗位名称和公司名称');
      return;
    }

    setIsLoading(true);

    try {
      const { data: categories } = await supabase.from('job_categories').select('*');
      const categoryId = categories?.[0]?.id;

      const { error } = await supabase.from('jobs').insert({
        title: manualForm.title.trim(),
        company: manualForm.company.trim(),
        location: manualForm.location.trim() || '未知',
        description: manualForm.description.trim(),
        source_url: manualForm.sourceUrl.trim() || null,
        category_id: categoryId,
        published_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('✨ 岗位添加成功');
      navigate('/');
    } catch (err) {
      toast.error('添加失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 智能搜索处理
  const handleSearch = async () => {
    if (!searchCompany.trim()) {
      toast.error('请输入公司名称');
      return;
    }

    setSearching(true);
    setSearchResults([]);
    setSelectedJobs(new Set());

    try {
      console.log('🔍 开始联网搜索:', searchCompany, searchJobType);
      
      const { data, error } = await supabase.functions.invoke('search-company-jobs', {
        body: {
          company: searchCompany.trim(),
          jobType: searchJobType.trim(),
        },
      });

      console.log('搜索结果:', data);

      if (error) {
        console.error('搜索错误:', error);
        throw error;
      }

      if (data.success) {
        setSearchResults(data.jobs || []);
        if (data.jobs && data.jobs.length > 0) {
          toast.success(`找到 ${data.jobs.length} 个相关岗位`);
        } else {
          toast.info('未找到相关岗位，请尝试更换关键词');
        }
      } else {
        toast.error(data.error || '搜索失败');
      }
    } catch (err: unknown) {
      console.error('搜索异常:', err);
      const errorMessage = err instanceof Error ? err.message : '搜索失败，请重试';
      toast.error(errorMessage);
    } finally {
      setSearching(false);
    }
  };

  // 批量导入选中岗位（并行，最多3并发）
  const handleBatchImport = async () => {
    if (selectedJobs.size === 0) {
      toast.error('请至少选择一个岗位');
      return;
    }

    setImporting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const selectedResults = Array.from(selectedJobs).map(index => searchResults[index]);

      // 单个导入任务
      const importOne = async (job: SearchResult) => {
        if (!job.url || !job.url.startsWith('http')) {
          return { ok: false, title: job.title };
        }
        try {
          const { data, error } = await supabase.functions.invoke('import-job-from-url', {
            body: { url: job.url },
          });
          if (error) return { ok: false, title: job.title };
          return { ok: !!data?.success, title: job.title };
        } catch {
          return { ok: false, title: job.title };
        }
      };

      // 并行，每批最多3个同时进行
      const CONCURRENCY = 3;
      const results: { ok: boolean; title: string }[] = [];
      for (let i = 0; i < selectedResults.length; i += CONCURRENCY) {
        const chunk = selectedResults.slice(i, i + CONCURRENCY);
        const chunkResults = await Promise.allSettled(chunk.map(importOne));
        chunkResults.forEach(r => {
          const val = r.status === 'fulfilled' ? r.value : { ok: false, title: '' };
          results.push(val);
          if (val.ok) successCount++; else failCount++;
        });
      }

      if (successCount > 0) {
        toast.success(`成功导入 ${successCount} 个岗位${failCount > 0 ? `，${failCount} 个失败` : ''}`);
        navigate('/');
      } else {
        toast.error('所有岗位导入失败，链接可能无法访问，建议使用手动添加');
      }
    } catch (err) {
      toast.error('批量导入失败');
    } finally {
      setImporting(false);
    }
  };

  // 切换岗位选择
  const toggleJobSelection = (index: number) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedJobs(newSelected);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">导入岗位</h1>
          <p className="text-muted-foreground">
            通过智能搜索、链接导入或手动添加岗位信息
          </p>
        </div>

        {/* 导入表单 - 使用Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              智能搜索
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <Link2 className="h-4 w-4" />
              链接导入
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <PenSquare className="h-4 w-4" />
              手动添加
            </TabsTrigger>
          </TabsList>

          {/* 智能搜索 */}
          <TabsContent value="search">
            <Card className="border-2 border-green-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-green-600" />
                  智能搜索岗位
                </CardTitle>
                <CardDescription>
                  直接在各公司官方校园招聘网站搜索岗位，支持字节跳动、腾讯、阿里等18家公司
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">公司名称</label>
                    <Input
                      placeholder="例如：字节跳动、腾讯"
                      value={searchCompany}
                      onChange={(e) => setSearchCompany(e.target.value)}
                      disabled={searching}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">岗位类型</label>
                    <Input
                      placeholder="例如：实习、校招"
                      value={searchJobType}
                      onChange={(e) => setSearchJobType(e.target.value)}
                      disabled={searching}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSearch}
                  disabled={searching || !searchCompany.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  size="lg"
                >
                  {searching ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      AI正在联网搜索...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      搜索岗位
                    </>
                  )}
                </Button>

                {/* 搜索结果 */}
                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">搜索结果</h3>
                      <span className="text-sm text-muted-foreground">
                        已选择 {selectedJobs.size}/{searchResults.length} 个岗位
                      </span>
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 p-3">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>来自官方招聘渠道</strong>：所有结果均直接从该公司的官方校园招聘网站获取，确保来源可靠。
                      </p>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {searchResults.map((job, index) => {
                        const isValidUrl = job.url && job.url.startsWith('http');
                        return (
                          <Card
                            key={index}
                            className={`cursor-pointer transition-all ${
                              selectedJobs.has(index)
                                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                : 'hover:border-primary'
                            } ${!isValidUrl ? 'border-amber-300' : ''}`}
                            onClick={() => toggleJobSelection(index)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={selectedJobs.has(index)}
                                  onCheckedChange={() => toggleJobSelection(index)}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-semibold text-base mb-1">{job.title}</h4>
                                    {!isValidUrl && (
                                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                                        链接可能无效
                                      </span>
                                    )}
                                  </div>
                                  {job.location && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      📍 {job.location}
                                    </p>
                                  )}
                                  {job.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {job.description}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-2 truncate">
                                    🔗 {job.url || '无链接'}
                                  </p>
                                </div>
                                {selectedJobs.has(index) && (
                                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    <Button
                      onClick={handleBatchImport}
                      disabled={importing || selectedJobs.size === 0}
                      className="w-full"
                      size="lg"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          正在导入...
                        </>
                      ) : (
                        `导入选中的 ${selectedJobs.size} 个岗位`
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 链接导入 */}
          <TabsContent value="url">
            <Card>
              <CardHeader>
                <CardTitle>链接导入</CardTitle>
                <CardDescription>
                  粘贴岗位详情页链接，AI会自动解析内容
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">岗位链接</label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-destructive whitespace-pre-line">{error}</div>
                  </div>
                )}

                <Button
                  onClick={handleImport}
                  disabled={isLoading || !url.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      导入中...
                    </>
                  ) : (
                    '导入岗位'
                  )}
                </Button>

                <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
                  <h3 className="font-medium mb-2 text-sm">✅ 支持的网站</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 字节跳动、腾讯、阿里等公司官网</li>
                    <li>• 拉勾网、智联招聘、前程无忧</li>
                    <li>• 其他大部分招聘网站</li>
                  </ul>
                  
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      BOSS直聘说明
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      ⚠️ BOSS直聘有严格的反爬虫机制，建议使用"手动添加"功能
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 手动添加 */}
          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>手动添加</CardTitle>
                <CardDescription>
                  💡 可直接从招聘网站复制粘贴信息，快速录入
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">岗位名称 *</label>
                  <Input
                    placeholder="例如：产品经理实习生"
                    value={manualForm.title}
                    onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">公司名称 *</label>
                  <Input
                    placeholder="例如：字节跳动"
                    value={manualForm.company}
                    onChange={(e) => setManualForm({ ...manualForm, company: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">工作地点</label>
                  <Input
                    placeholder="例如：北京"
                    value={manualForm.location}
                    onChange={(e) => setManualForm({ ...manualForm, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">岗位链接</label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={manualForm.sourceUrl}
                    onChange={(e) => setManualForm({ ...manualForm, sourceUrl: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">岗位描述</label>
                  <Textarea
                    placeholder="粘贴职位描述和要求..."
                    value={manualForm.description}
                    onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                    rows={8}
                  />
                </div>

                <Button
                  onClick={handleManualAdd}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      添加中...
                    </>
                  ) : (
                    '添加岗位'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
