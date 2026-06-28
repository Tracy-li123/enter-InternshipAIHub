import { JobWithStatus, JobStatus } from '@/types/job';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/date-utils';
import { useUpdateJobStatus, useToggleBookmark, useDeleteJob, useRestoreJob } from '@/hooks/use-jobs';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { MapPin, ExternalLink, Bookmark, Check, Trash2, Users, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: JobWithStatus;
}

export function JobCard({ job }: JobCardProps) {
  const { user } = useAuth();
  const updateStatus = useUpdateJobStatus();
  const toggleBookmark = useToggleBookmark();
  const deleteJob = useDeleteJob();
  const restoreJob = useRestoreJob();
  const navigate = useNavigate();
  const isBookmarked = job.is_bookmarked || false;
  const isApplied = job.status !== 'pending';
  const isOwner = job.user_id === user?.id;
  const isDeleted = !!job.deleted_at;

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark.mutate(
      { jobId: job.id, isBookmarked: !isBookmarked },
      {
        onSuccess: () => {
          toast.success(isBookmarked ? '已取消收藏' : '已添加收藏');
        },
      }
    );
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatus.mutate(
      { jobId: job.id, status: 'applied' },
      {
        onSuccess: () => {
          toast.success('已标记为已投递');
        },
      }
    );
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个岗位吗？删除后可以在"已删除"栏目中恢复。')) {
      return;
    }
    
    try {
      await deleteJob.mutateAsync(job.id);
      toast.success('岗位已删除');
    } catch (error) {
      toast.error('删除失败，请重试');
    }
  };

  const handleRestore = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await restoreJob.mutateAsync(job.id);
      toast.success('岗位已恢复');
    } catch (error) {
      toast.error('恢复失败，请重试');
    }
  };

  const handleStartInterview = () => {
    navigate(`/job/${job.id}`); // 改为跳转到详情页
  };

  const handleViewDetails = () => {
    if (job.source_url) {
      window.open(job.source_url, '_blank');
    }
  };

  const handleCardClick = () => {
    navigate(`/job/${job.id}`); // 点击卡片跳转到详情页
  };

  return (
    <Card 
      className={cn(
        "hover:shadow-lg transition-all duration-200 border-border/50 cursor-pointer",
        isDeleted && "opacity-60 border-dashed"
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {isDeleted && (
                <Badge variant="destructive" className="text-xs">已删除</Badge>
              )}
              {!isOwner && !isDeleted && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Users className="h-3 w-3" />
                  共享
                </Badge>
              )}
              {job.category && (
                <Badge variant="outline" className="text-xs">
                  {job.category.name}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg line-clamp-1">{job.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{job.company}</p>
          </div>
          {!isDeleted && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBookmark}
                className={cn(isBookmarked && 'text-yellow-500')}
              >
                <Bookmark className={cn('h-5 w-5', isBookmarked && 'fill-current')} />
              </Button>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2">
          {job.location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {job.location}
            </div>
          )}
          {job.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {job.description}
            </p>
          )}
          <div className="text-xs text-muted-foreground">
            发布于 {formatRelativeTime(job.published_at)}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center gap-2 pt-3 border-t">
        {isDeleted ? (
          <Button
            variant="default"
            size="sm"
            onClick={handleRestore}
            disabled={restoreJob.isPending}
            className="flex-1 gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            恢复岗位
          </Button>
        ) : (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
              className="flex-1"
            >
              查看详情
            </Button>
            {!isApplied ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleApply}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                标记已投递
              </Button>
            ) : (
              <Badge variant="secondary" className="flex-1 justify-center py-2">
                已投递
              </Badge>
            )}
            {job.source_url && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); handleViewDetails(); }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
