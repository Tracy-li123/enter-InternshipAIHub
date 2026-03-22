import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Link2, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ImportPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; job?: { title: string; company: string; location?: string } } | null>(null);

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

        {/* 导入表单 */}
        <Card className="mb-6 border-2 border-purple-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-purple-600" />
              岗位链接
            </CardTitle>
            <CardDescription>
              从BOSS直聘、拉勾网等招聘网站复制岗位详情页链接
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">岗位链接 *</label>
              <Input
                type="url"
                placeholder="例如：https://www.zhipin.com/job_detail/xxx.html"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                className="text-base"
              />
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
                      className={`font-medium ${
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

        {/* 支持的网站 */}
        <Card>
          <CardHeader>
            <CardTitle>✅ 支持的招聘网站</CardTitle>
            <CardDescription>以下网站的岗位链接可以直接导入</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { name: 'BOSS直聘', domain: 'zhipin.com' },
                { name: '拉勾网', domain: 'lagou.com' },
                { name: '智联招聘', domain: 'zhaopin.com' },
                { name: '前程无忧', domain: '51job.com' },
                { name: '字节跳动', domain: 'bytedance.com' },
                { name: '腾讯招聘', domain: 'tencent.com' },
              ].map((site) => (
                <div
                  key={site.domain}
                  className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="font-medium text-sm">{site.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-6">{site.domain}</span>
                </div>
              ))}
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
                <span>系统自动抓取岗位信息并保存，导入完成！</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
