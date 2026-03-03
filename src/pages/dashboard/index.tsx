import { useAppliedJobs } from '@/hooks/use-jobs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JobStatus } from '@/types/job';
import { statusLabelMap, statusColorMap } from '@/lib/status-colors';
import { Briefcase, TrendingUp, Award, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function Dashboard() {
  const { data: appliedJobs } = useAppliedJobs();

  // 统计数据
  const stats = {
    total: appliedJobs?.length || 0,
    byStatus: {} as Record<JobStatus, number>,
    offers: 0,
    interviews: 0,
  };

  appliedJobs?.forEach(item => {
    stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
    if (item.status === 'offer') stats.offers++;
    if (['first_interview', 'second_interview', 'final_interview'].includes(item.status)) {
      stats.interviews++;
    }
  });

  const conversionRate = stats.total > 0 ? ((stats.offers / stats.total) * 100).toFixed(1) : '0';
  const interviewRate = stats.total > 0 ? ((stats.interviews / stats.total) * 100).toFixed(1) : '0';

  const statusOrder: JobStatus[] = [
    'applied',
    'written_test',
    'first_interview',
    'second_interview',
    'final_interview',
    'offer',
    'rejected',
  ];

  return (
    <div className="h-full overflow-y-auto bg-muted/30">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-3xl font-bold">数据看板</h1>
          <p className="text-muted-foreground mt-1">追踪你的求职进度</p>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已投递岗位</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                持续投递中
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">获得面试</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.interviews}</div>
              <p className="text-xs text-muted-foreground mt-1">
                面试率 {interviewRate}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">收到Offer</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.offers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                转化率 {conversionRate}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">成功率</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.offers > 0 ? '表现优秀' : '继续加油'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 各阶段分布 */}
        <Card>
          <CardHeader>
            <CardTitle>投递进度分布</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusOrder.map(status => {
              const count = stats.byStatus[status] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              
              if (count === 0) return null;
              
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${statusColorMap[status]}`} />
                      <span className="font-medium">{statusLabelMap[status]}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {count} 个 ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 建议和提示 */}
        <Card>
          <CardHeader>
            <CardTitle>求职建议</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.total === 0 && (
              <div className="text-sm text-muted-foreground">
                ✨ 开始投递你的第一份简历吧！建议每天投递3-5个岗位。
              </div>
            )}
            {stats.total > 0 && stats.interviews === 0 && (
              <div className="text-sm text-muted-foreground">
                💡 还没有收到面试邀请？试试优化简历或使用AI模拟面试提前准备。
              </div>
            )}
            {stats.interviews > 0 && stats.offers === 0 && (
              <div className="text-sm text-muted-foreground">
                🎯 已经获得面试机会了！使用AI模拟面试功能提升面试表现。
              </div>
            )}
            {stats.offers > 0 && (
              <div className="text-sm text-muted-foreground">
                🎉 恭喜获得Offer！继续保持，争取更多优质机会。
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              📚 使用"学习模式"了解岗位要求和行业知识，做好充分准备。
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
