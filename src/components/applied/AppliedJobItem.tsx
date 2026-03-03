import { UserJobStatus, Job, JobStatus } from '@/types/job';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { statusLabelMap, statusColorMap } from '@/lib/status-colors';
import { formatRelativeTime } from '@/lib/date-utils';
import { useUpdateJobStatus } from '@/hooks/use-jobs';
import { toast } from 'sonner';
import { MessageSquare, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AppliedJobItemProps {
  item: UserJobStatus & { job: Job };
}

export function AppliedJobItem({ item }: AppliedJobItemProps) {
  const { job, status, updated_at } = item;
  const updateStatus = useUpdateJobStatus();
  const navigate = useNavigate();

  const handleStatusChange = (newStatus: JobStatus) => {
    updateStatus.mutate(
      { jobId: job.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success('状态已更新');
        },
        onError: () => {
          toast.error('更新失败，请重试');
        },
      }
    );
  };

  const handleStartInterview = () => {
    navigate(`/interview/${job.id}`);
  };

  const progressStatuses: JobStatus[] = [
    'applied',
    'written_test',
    'first_interview',
    'second_interview',
    'final_interview',
    'offer',
    'rejected',
  ];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-sm line-clamp-1">{job.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{job.company}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleStartInterview}>
                <MessageSquare className="h-4 w-4 mr-2" />
                AI模拟面试
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">当前状态</span>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-7 w-auto min-w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {progressStatuses.map(s => (
                <SelectItem key={s} value={s}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${statusColorMap[s]}`} />
                    {statusLabelMap[s]}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          更新于 {formatRelativeTime(updated_at)}
        </div>
      </CardContent>
    </Card>
  );
}
