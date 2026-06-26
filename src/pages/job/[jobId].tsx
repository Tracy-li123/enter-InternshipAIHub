import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ExternalLink, Bookmark, Brain, BookmarkCheck, Trash2, RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { statusLabelMap } from '@/lib/status-colors';
import { formatRelativeTime } from '@/lib/date-utils';
import { toast } from 'sonner';
import { JobStatus } from '@/types/job';
import { useDeleteJob, useRestoreJob, useToggleBookmark } from '@/hooks/use-jobs';
import { useAuth } from '@/hooks/use-auth';

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentStatus, setCurrentStatus] = useState<JobStatus>('pending');
  const [isBookmarked, setIsBookmarked] = useState(false);

  // 获取岗位详情
  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, job_categories(*)')
        .eq('id', jobId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // 获取用户状态
  const { data: userStatus } = useQuery({
    queryKey: ['user-job-status', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_job_status')
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', user?.id || '')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });

  // 设置初始状态
  useEffect(() => {
    if (userStatus) {
      setCurrentStatus(userStatus.status as JobStatus);
      setIsBookmarked(userStatus.is_bookmarked || false);
    }
  }, [userStatus]);

  // 更新状态
  const updateStatusMutation = useMutation({
    mutationFn: async (status: JobStatus) => {
      if (userStatus) {
        const { error } = await supabase
          .from('user_job_status')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', userStatus.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_job_status')
          .insert({
            job_id: jobId,
            user_id: user?.id || '',
            status,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-job-status', jobId] });
      queryClient.invalidateQueries({ queryKey: ['applied-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('状态已更新');
    },
    onError: () => {
      toast.error('更新失败，请重试');
    },
  });

  const handleStatusChange = (status: string) => {
    const newStatus = status as JobStatus;
    setCurrentStatus(newStatus);
    updateStatusMutation.mutate(newStatus);
  };

  const toggleBookmarkMutation = useToggleBookmark();

  const handleToggleBookmark = () => {
    toggleBookmarkMutation.mutate(
      { jobId: jobId!, isBookmarked: !isBookmarked },
      {
        onSuccess: () => {
          setIsBookmarked(!isBookmarked);
          toast.success(isBookmarked ? '已取消收藏' : '已添加收藏');
        },
        onError: () => {
          toast.error('操作失败，请重试');
        },
      }
    );
  };

  // 删除和恢复功能
  const deleteJobMutation = useDeleteJob();
  const restoreJobMutation = useRestoreJob();

  const handleDelete = async () => {
    if (!confirm('确定要删除这个岗位吗？删除后可以在"已删除"栏目中恢复。')) {
      return;
    }

    try {
      await deleteJobMutation.mutateAsync(jobId!);
      toast.success('岗位已删除');
      navigate('/');
    } catch (error) {
      toast.error('删除失败，请重试');
    }
  };

  const handleRestore = async () => {
    try {
      await restoreJobMutation.mutateAsync(jobId!);
      toast.success('岗位已恢复');
      navigate('/');
    } catch (error) {
      toast.error('恢复失败，请重试');
    }
  };

  const isDeleted = !!job?.deleted_at;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">岗位不存在</p>
          <Button onClick={() => navigate('/')}>返回首页</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* 岗位标题 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="default">{job.job_categories?.name || '未分类'}</Badge>
                  <Badge variant="outline">{job.location || '未知地点'}</Badge>
                </div>
                <CardTitle className="text-3xl mb-3">{job.title}</CardTitle>
                <p className="text-xl text-muted-foreground font-medium">{job.company}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  发布于 {formatRelativeTime(job.published_at)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 已删除提示 */}
            {isDeleted && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">⚠️ 此岗位已被删除</p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-3">
              {isDeleted ? (
                // 已删除状态：显示恢复按钮
                <Button 
                  variant="default" 
                  size="lg"
                  className="gap-2"
                  onClick={handleRestore}
                >
                  <RotateCcw className="h-4 w-4" />
                  恢复岗位
                </Button>
              ) : (
                // 正常状态：显示所有操作按钮
                <>
                  <Button 
                    variant="default" 
                    size="lg"
                    className="gap-2"
                    onClick={() => navigate(`/interview/${jobId}`)}
                  >
                    <Brain className="h-4 w-4" />
                    岗位认知 / AI模拟
                  </Button>
                  <Button 
                    variant={isBookmarked ? 'secondary' : 'outline'}
                    size="lg"
                    className="gap-2"
                    onClick={handleToggleBookmark}
                  >
                    {isBookmarked ? (
                      <>
                        <BookmarkCheck className="h-4 w-4" />
                        已收藏
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-4 w-4" />
                        收藏
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="gap-2"
                    onClick={() => window.open(job.source_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    前往投递
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="lg"
                    className="gap-2"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    删除
                  </Button>
                </>
              )}
            </div>

            <Separator />

            {/* 状态管理 */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">当前状态：</span>
              <Select value={currentStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待投递</SelectItem>
                  <SelectItem value="applied">已投递</SelectItem>
                  <SelectItem value="written_test">笔试</SelectItem>
                  <SelectItem value="first_interview">一面</SelectItem>
                  <SelectItem value="second_interview">二面</SelectItem>
                  <SelectItem value="final_interview">终面</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="rejected">已淘汰</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 岗位描述 */}
        <Card>
          <CardHeader>
            <CardTitle>岗位描述</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {job.description || '暂无岗位描述'}
            </div>
          </CardContent>
        </Card>

        {/* 底部操作 */}
        <div className="flex justify-center gap-4 pt-4">
          <Button 
            variant="default" 
            size="lg"
            onClick={() => navigate(`/interview/${jobId}`)}
          >
            开始准备面试
          </Button>
          <Button 
            variant="outline"
            size="lg"
            onClick={() => window.open(job.source_url, '_blank')}
          >
            立即投递
          </Button>
        </div>
      </div>
    </div>
  );
}
