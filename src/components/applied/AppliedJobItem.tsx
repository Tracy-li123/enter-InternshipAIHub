import { UserJobStatus, Job, JobStatus } from '@/types/job';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { statusLabelMap, statusColorMap } from '@/lib/status-colors';
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
import { cn } from '@/lib/utils';

interface AppliedJobItemProps {
  item: UserJobStatus & { job: Job };
  compact?: boolean;
}

export function AppliedJobItem({ item, compact = false }: AppliedJobItemProps) {
  const { job, status } = item;
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

  if (compact) {
    return (
      <Card 
        className="hover:shadow-sm transition-shadow cursor-pointer"
        onClick={handleStartInterview}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-xs line-clamp-1">{job.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
            </div>
            <div className={cn('h-2 w-2 rounded-full shrink-0 mt-1', statusColorMap[status])} />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              {statusLabelMap[status]}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
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
        <div className="space-y-2">
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
        </div>
      </CardContent>
    </Card>
  );
}
