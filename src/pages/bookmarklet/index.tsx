import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, Download, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function BookmarkletPage() {
  const bookmarkletCode = `javascript:(function(){const s=document.createElement('script');s.src='https://mqlhknolbjnsfrqyzidh.supabase.co/functions/v1/bookmarklet-collector';s.onload=function(){if(window.zhidaCollector){window.zhidaCollector.collect();}};document.body.appendChild(s);})();`;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', bookmarkletCode);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    alert('已复制到剪贴板！');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            📋 职达实习生 · 一键采集工具
          </h1>
          <p className="text-gray-600">无需安装插件，拖拽到书签栏即可使用</p>
        </div>

        {/* 书签按钮 */}
        <Card className="mb-6 border-2 border-purple-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-purple-600" />
              一键采集书签
            </CardTitle>
            <CardDescription>
              拖拽下面的按钮到浏览器书签栏，即可在任何招聘网站一键采集岗位
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-8 rounded-lg text-center">
              <a
                href={bookmarkletCode}
                draggable="true"
                onDragStart={handleDragStart}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-full shadow-xl hover:shadow-2xl transition-all cursor-move select-none text-lg"
                onClick={(e) => {
                  e.preventDefault();
                  alert('请将此按钮拖拽到浏览器书签栏！');
                }}
              >
                <Bookmark className="h-5 w-5" />
                📋 采集岗位到职达
              </a>
              <p className="text-sm text-gray-600 mt-4">👆 拖动我到书签栏</p>
            </div>
            
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={copyToClipboard} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                复制代码（手动添加书签用）
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 使用步骤 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🚀 使用步骤</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">拖拽书签按钮</h4>
                  <p className="text-sm text-gray-600">
                    将上面的紫色按钮拖拽到浏览器顶部的书签栏
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">访问招聘网站</h4>
                  <p className="text-sm text-gray-600">
                    打开BOSS直聘、拉勾网等招聘网站的岗位详情页
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">点击书签采集</h4>
                  <p className="text-sm text-gray-600">
                    点击书签栏中的"📋 采集岗位到职达"按钮，自动采集并保存
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">完成！</h4>
                  <p className="text-sm text-gray-600">
                    岗位信息已自动保存到您的职达实习生平台
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 支持的网站 */}
        <Card>
          <CardHeader>
            <CardTitle>✅ 支持的招聘网站</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                'BOSS直聘',
                '拉勾网',
                '智联招聘',
                '前程无忧',
                '字节跳动官网',
                '腾讯招聘',
                '阿里巴巴招聘',
                '百度招聘',
                '更多网站...',
              ].map((site) => (
                <div
                  key={site}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{site}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 返回首页 */}
        <div className="text-center mt-8">
          <Button asChild>
            <a href="/">
              返回首页
              <ArrowRight className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
