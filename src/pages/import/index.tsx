import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Link2, Loader2, CheckCircle2, AlertCircle, ArrowLeft, PenSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ImportPage() {
  const navigate = useNavigate();
  
  // 链接导入
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; job?: { title: string; company: string; location?: string } } | null>(null);
  
  // 手动添加
  const [manualJob, setManualJob] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    sourceUrl: '',
  });
  const [manualLoading, setManualLoading] = useState(false);

  const handleImport = async () => {
    if (!url.trim()) {
      toast.error('请输入岗位链接');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // 调用Edge Function抓取链接内容
      const { data, error } = await supabase.functions.invoke('import-job-from-url', {
        body: { url: url.trim() },
      });

      if (error) throw error;

      if (data.success) {
        setResult({
          success: true,
          message: data.message || '导入成功',
          job: data.job,
        });
        toast.success('岗位导入成功！');
        
        // 3秒后跳转到首页
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setResult({
          success: false,
          message: data.error || '导入失败',
        });
        toast.error(data.error || '导入失败');
      }
    } catch (error) {
      console.error('导入失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setResult({
        success: false,
        message: errorMessage || '网络错误，请重试',
      });
      toast.error('导入失败：' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualJob.title || !manualJob.company) {
      toast.error('请至少填写岗位名称和公司名称');
      return;
    }

    setManualLoading(true);

    try {
      // 智能匹配分类
      const { data: categories } = await supabase.from('job_categories').select('*');
      
      let categoryId = null;
      if (categories) {
        const titleLower = manualJob.title.toLowerCase();
        if (titleLower.includes('产品') && !titleLower.includes('运营')) {
          categoryId = categories.find(c => c.name.includes('产品经理'))?.id;
        } else if (titleLower.includes('运营')) {
          categoryId = categories.find(c => c.name.includes('运营'))?.id;
        } else if (titleLower.includes('数据')) {
          categoryId = categories.find(c => c.name.includes('数据'))?.id;
        } else if (titleLower.includes('分析') || titleLower.includes('商业')) {
          categoryId = categories.find(c => c.name.includes('商业'))?.id;
        }
        if (!categoryId) categoryId = categories[0]?.id;
      }

      // 插入岗位
      const { error } = await supabase.from('jobs').insert({
        title: manualJob.title,
        company: manualJob.company,
        location: manualJob.location || '未知',
        description: manualJob.description || '',
        source_url: manualJob.sourceUrl || `https://manual-add-${Date.now()}`,
        category_id: categoryId,
        published_at: new Date().toISOString(),
        scraped_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('岗位添加成功！');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error('添加失败:', error);
      toast.error('添加失败，请重试');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回首页
          </Button>
          <div className="flex-1" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* 标题 */}
        <div className="text-center mb-8 mt-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            🔗 导入岗位链接
          </h1>
          <p className="text-gray-600">复制招聘网站的岗位链接，自动抓取并保存</p>
        </div>

        {/* 导入表单 - 使用Tabs */}
        <Tabs defaultValue="url" className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" className="gap-2">
              <Link2 className="h-4 w-4" />
              链接导入
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <PenSquare className="h-4 w-4" />
              手动添加
            </TabsTrigger>
          </TabsList>

          {/* 链接导入 */}
          <TabsContent value="url">
            <Card className="border-2 border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-purple-600" />
                  岗位链接
                </CardTitle>
                <CardDescription>
                  ✨ 使用Jina Reader + Kimi AI智能解析岗位信息<br/>
                  <span className="text-primary font-medium">支持字节跳动、拉勾网、智联招聘等网站</span>
                  <br/>
                  <span className="text-orange-600 text-xs">⚠️ BOSS直聘有严格反爬虫，请使用"手动添加"</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">岗位链接 *</label>
                  <Input
                    type="url"
                    placeholder="例如：https://www.lagou.com/jobs/xxx.html"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={loading}
                    className="text-base"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 AI智能解析，自动提取岗位标题、公司、地点和职位描述
                  </p>
                </div>

                <Button
                  onClick={handleImport}
                  disabled={loading || !url.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      正在抓取岗位信息...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-5 w-5 mr-2" />
                      导入岗位
                    </>
                  )}
                </Button>

                {/* 结果显示 */}
                {result && (
                  <div
                    className={`p-4 rounded-lg ${
                      result.success
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`font-medium whitespace-pre-wrap ${
                            result.success ? 'text-green-900' : 'text-red-900'
                          }`}
                        >
                          {result.message}
                        </p>
                        {result.success && result.job && (
                          <div className="mt-2 text-sm text-green-800">
                            <p>岗位：{result.job.title}</p>
                            <p>公司：{result.job.company}</p>
                            <p className="text-xs text-green-600 mt-2">3秒后自动跳转到首页...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 手动添加 */}
          <TabsContent value="manual">
            <Card className="border-2 border-blue-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenSquare className="h-5 w-5 text-blue-600" />
                  手动添加岗位
                </CardTitle>
                <CardDescription>
                  适用于字节跳动、BOSS直聘等无法自动抓取的网站<br/>
                  <span className="text-blue-600 font-medium">💡 提示：可直接从招聘网站复制粘贴信息，快速录入</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">岗位名称 *</label>
                    <Input
                      placeholder="例如：产品经理实习生"
                      value={manualJob.title}
                      onChange={(e) => setManualJob({ ...manualJob, title: e.target.value })}
                      disabled={manualLoading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">公司名称 *</label>
                    <Input
                      placeholder="例如：字节跳动"
                      value={manualJob.company}
                      onChange={(e) => setManualJob({ ...manualJob, company: e.target.value })}
                      disabled={manualLoading}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">工作地点</label>
                    <Input
                      placeholder="例如：北京"
                      value={manualJob.location}
                      onChange={(e) => setManualJob({ ...manualJob, location: e.target.value })}
                      disabled={manualLoading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">岗位链接</label>
                    <Input
                      type="url"
                      placeholder="原网站链接（选填）"
                      value={manualJob.sourceUrl}
                      onChange={(e) => setManualJob({ ...manualJob, sourceUrl: e.target.value })}
                      disabled={manualLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">岗位描述</label>
                  <Textarea
                    placeholder="岗位职责、任职要求等信息（选填）"
                    value={manualJob.description}
                    onChange={(e) => setManualJob({ ...manualJob, description: e.target.value })}
                    disabled={manualLoading}
                    rows={6}
                  />
                </div>

                <Button
                  onClick={handleManualAdd}
                  disabled={manualLoading || !manualJob.title || !manualJob.company}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {manualLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      正在添加...
                    </>
                  ) : (
                    <>
                      <PenSquare className="h-5 w-5 mr-2" />
                      添加岗位
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 支持的网站 */}
        <Card>
          <CardHeader>
            <CardTitle>✨ AI智能解析 - 支持所有招聘网站</CardTitle>
            <CardDescription>使用Kimi AI模型分析网页内容，自动提取岗位信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: '字节跳动', domain: 'bytedance.com', supported: true },
                { name: '拉勾网', domain: 'lagou.com', supported: true },
                { name: '智联招聘', domain: 'zhaopin.com', supported: true },
                { name: '腾讯招聘', domain: 'tencent.com', supported: true },
                { name: '阿里招聘', domain: 'alibaba.com', supported: true },
                { name: 'BOSS直聘', domain: 'zhipin.com', supported: false, note: '请手动添加' },
              ].map((site, index) => (
                <div
                  key={index}
                  className={`flex flex-col gap-1 p-3 rounded-lg transition-colors ${
                    site.supported ? 'bg-green-50 hover:bg-green-100' : 'bg-orange-50 hover:bg-orange-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {site.supported ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    )}
                    <span className="font-medium text-sm">{site.name}</span>
                  </div>
                  {site.domain && (
                    <span className="text-xs text-gray-500 ml-6">{site.domain}</span>
                  )}
                  {site.note && (
                    <span className="text-xs text-orange-600 ml-6">{site.note}</span>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-primary/5 rounded-md border border-primary/20">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span>
                  <strong className="text-foreground">智能突破限制：</strong>即使网站使用JavaScript动态加载或反爬虫技术，AI模型也能理解并提取岗位信息
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📖 使用说明</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <span>在招聘网站找到感兴趣的岗位，打开岗位详情页</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <span>复制浏览器地址栏的完整链接（包括 https://）</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <span>粘贴到上方输入框，点击"导入岗位"</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-xs">
                  ✓
                </span>
                <span>AI智能分析网页内容，自动提取岗位信息并保存，导入完成！</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
