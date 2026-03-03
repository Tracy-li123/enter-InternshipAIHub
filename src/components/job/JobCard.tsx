import { JobWithStatus, JobStatus } from '@/types/job';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/date-utils';
import { useUpdateJobStatus } from '@/hooks/use-jobs';
import { toast } from 'sonner';
import { MapPin, ExternalLink, Bookmark, Check, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: JobWithStatus;
}

export function JobCard({ job }: JobCardProps) {
  const updateStatus = useUpdateJobStatus();
  const navigate = useNavigate();
  const isBookmarked = job.status === 'bookmarked';
  const isApplied = job.status !== 'pending' && job.status !== 'bookmarked';

  const handleBookmark = () => {
    const newStatus: JobStatus = isBookmarked ? 'pending' : 'bookmarked';
    updateStatus.mutate(
      { jobId: job.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(isBookmarked ? '已取消收藏' : '已添加收藏');
        },
      }
    );
  };

  const handleApply = () => {
    updateStatus.mutate(
      { jobId: job.id, status: 'applied' },
      {
        onSuccess: () => {
          toast.success('已标记为已投递');
        },
      }
    );
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
      className="hover:shadow-lg transition-all duration-200 border-border/50 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {job.category && (
                <Badge variant="outline" className="text-xs">
                  {job.category.name}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg line-clamp-1">{job.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{job.company}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation(); // 阻止冒泡到卡片点击
              handleBookmark();
            }}
            className={cn(isBookmarked && 'text-yellow-500')}
          >
            <Bookmark className={cn('h-5 w-5', isBookmarked && 'fill-current')} />
          </Button>
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
        <Button
          variant="default"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          className="flex-1"
        >
          查看详情
        </Button>
        {!isApplied ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleApply();
            }}
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
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
