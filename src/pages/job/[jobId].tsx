import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, ExternalLink, Bookmark, Brain, BookmarkCheck, Trash2, RotateCcw,
  Pencil, Check, X, Ticket,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { statusLabelMap } from '@/lib/status-colors';
import { formatRelativeTime } from '@/lib/date-utils';
import { toast } from 'sonner';
import { JobStatus } from '@/types/job';
import { useDeleteJob, useRestoreJob, useToggleBookmark, useUpdateJob, useUpdateReferralCode } from '@/hooks/use-jobs';
import { useJobCategories } from '@/hooks/use-job-categories';
import { useAuth } from '@/hooks/use-auth';
import { JobDescriptionRenderer } from '@/components/job/JobDescriptionRenderer';

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentStatus, setCurrentStatus] = useState<JobStatus>('pending');
  const [isBookmarked, setIsBookmarked] = useState(false);

  // 编辑岗位内容
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '', company: '', location: '', category_id: '', description: '', requirements: '',
  });

  // 内推码
  const [isEditingReferral, setIsEditingReferral] = useState(false);
  const [referralInput, setReferralInput] = useState('');

  const { data: categories } = useJobCategories();
  const updateJobMutation = useUpdateJob();
  const updateReferralMutation = useUpdateReferralCode();

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

  // 岗位内容变化时，同步编辑表单和内推码输入框的初始值
  useEffect(() => {
    if (job) {
      setEditForm({
        title: job.title || '',
        company: job.company || '',
        location: job.location || '',
        category_id: job.category_id || '',
        description: job.description || '',
        requirements: job.requirements || '',
      });
      setReferralInput(job.referral_code || '');
    }
  }, [job]);

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

  // 编辑岗位内容
  const handleStartEdit = () => setIsEditing(true);

  const handleCancelEdit = () => {
    if (job) {
      setEditForm({
        title: job.title || '',
        company: job.company || '',
        location: job.location || '',
        category_id: job.category_id || '',
        description: job.description || '',
        requirements: job.requirements || '',
      });
    }
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editForm.company.trim()) {
      toast.error('请填写岗位名称和公司名称');
      return;
    }
    try {
      await updateJobMutation.mutateAsync({
        jobId: jobId!,
        updates: {
          title: editForm.title.trim(),
          company: editForm.company.trim(),
          location: editForm.location.trim() || null,
          category_id: editForm.category_id || null,
          description: editForm.description.trim() || null,
          requirements: editForm.requirements.trim() || null,
        },
      });
      toast.success('岗位信息已保存');
      setIsEditing(false);
    } catch {
      toast.error('保存失败，请重试');
    }
  };

  // 内推码：组内任何人都可以填写/更新
  const handleSaveReferral = async () => {
    if (!referralInput.trim()) {
      toast.error('请输入内推码');
      return;
    }
    try {
      await updateReferralMutation.mutateAsync({ jobId: jobId!, referralCode: referralInput.trim() });
      toast.success('内推码已更新，组内成员均可查看');
      setIsEditingReferral(false);
    } catch {
      toast.error('更新失败，请重试');
    }
  };

  const isDeleted = !!job?.deleted_at;
  const isOwner = !!user && job?.user_id === user.id;

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
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">岗位名称</label>
                        <Input
                          value={editForm.title}
                          onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="岗位名称"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">公司名称</label>
                        <Input
                          value={editForm.company}
                          onChange={(e) => setEditForm(f => ({ ...f, company: e.target.value }))}
                          placeholder="公司名称"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">工作地点</label>
                        <Input
                          value={editForm.location}
                          onChange={(e) => setEditForm(f => ({ ...f, location: e.target.value }))}
                          placeholder="工作地点"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">分类</label>
                        <Select
                          value={editForm.category_id}
                          onValueChange={(v) => setEditForm(f => ({ ...f, category_id: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择分类" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="default">{job.job_categories?.name || '未分类'}</Badge>
                      <Badge variant="outline">{job.location || '未知地点'}</Badge>
                    </div>
                    <CardTitle className="text-3xl mb-3">{job.title}</CardTitle>
                    <p className="text-xl text-muted-foreground font-medium">{job.company}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      发布于 {formatRelativeTime(job.published_at)}
                    </p>
                  </>
                )}
              </div>

              {isOwner && !isDeleted && (
                isEditing ? (
                  <div className="flex gap-2 shrink-0">
                    <Button size="icon" variant="outline" onClick={handleCancelEdit} title="取消">
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="icon" onClick={handleSaveEdit} disabled={updateJobMutation.isPending} title="保存">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button size="icon" variant="outline" onClick={handleStartEdit} title="编辑岗位信息" className="shrink-0">
                    <Pencil className="h-4 w-4" />
                  </Button>
                )
              )}
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
                  {isOwner && (
                    <Button 
                      variant="destructive" 
                      size="lg"
                      className="gap-2"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-4 w-4" />
                      删除
                    </Button>
                  )}
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

        {/* 内推码 — 组内所有人可填写，填写后所有人可见 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ticket className="h-4 w-4 text-primary" />
              内推码
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditingReferral ? (
              <div className="flex gap-2">
                <Input
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value)}
                  placeholder="填写内推码，组内成员都能看到"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => { setIsEditingReferral(false); setReferralInput(job.referral_code || ''); }}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button size="icon" onClick={handleSaveReferral} disabled={updateReferralMutation.isPending}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : job.referral_code ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md flex-1">{job.referral_code}</p>
                <Button size="sm" variant="ghost" className="gap-1.5 shrink-0" onClick={() => setIsEditingReferral(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                  修改
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsEditingReferral(true)}>
                <Pencil className="h-3.5 w-3.5" />
                填写内推码
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 岗位描述 */}
        <Card>
          <CardHeader>
            <CardTitle>岗位描述</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                placeholder="岗位描述"
                className="min-h-[160px]"
              />
            ) : (
              <JobDescriptionRenderer text={job.description || '暂无岗位描述'} />
            )}
          </CardContent>
        </Card>

        {/* 岗位要求 */}
        {(isEditing || job.requirements) && (
          <Card>
            <CardHeader>
              <CardTitle>岗位要求</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editForm.requirements}
                  onChange={(e) => setEditForm(f => ({ ...f, requirements: e.target.value }))}
                  placeholder="岗位要求"
                  className="min-h-[120px]"
                />
              ) : (
                <JobDescriptionRenderer text={job.requirements} />
              )}
            </CardContent>
          </Card>
        )}

        {/* 底部操作 */}
        {!isEditing && (
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
        )}
      </div>
    </div>
  );
}
