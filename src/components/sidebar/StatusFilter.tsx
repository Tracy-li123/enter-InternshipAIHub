import { useAppliedJobs } from '@/hooks/use-jobs';
import { JobStatus } from '@/types/job';
import { statusLabelMap, statusColorMap } from '@/lib/status-colors';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusFilterProps {
  selectedStatus: JobStatus | null;
  onSelectStatus: (status: JobStatus | null) => void;
}

export function StatusFilter({ selectedStatus, onSelectStatus }: StatusFilterProps) {
  const { data: appliedJobs } = useAppliedJobs();

  // 统计各状态数量
  const statusCounts: Partial<Record<JobStatus, number>> = {};
  appliedJobs?.forEach(item => {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
  });

  const statuses: JobStatus[] = [
    'applied',
    'written_test',
    'first_interview',
    'second_interview',
    'final_interview',
    'offer',
    'rejected',
  ];

  return (
    <div className="space-y-2 p-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">投递状态</h3>
      <div className="space-y-1">
        {statuses.map(status => {
          const count = statusCounts[status] || 0;
          
          return (
            <Button
              key={status}
              variant={selectedStatus === status ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-between h-auto py-2',
                selectedStatus === status && 'bg-primary/10 border border-primary/20'
              )}
              onClick={() => onSelectStatus(status)}
            >
              <div className="flex items-center gap-2">
                <div className={cn('h-2 w-2 rounded-full', statusColorMap[status])} />
                <span className="text-sm">{statusLabelMap[status]}</span>
              </div>
              <Badge variant="outline" className="ml-auto">
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
