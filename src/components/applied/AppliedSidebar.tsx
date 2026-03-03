import { useAppliedJobs } from '@/hooks/use-jobs';
import { AppliedJobItem } from './AppliedJobItem';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AppliedSidebar() {
  const { data: appliedJobs, isLoading } = useAppliedJobs();

  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        <Skeleton className="h-5 w-24" />
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[300px]">
      <div className="p-3 border-b">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          已投递
          {appliedJobs && appliedJobs.length > 0 && (
            <span className="text-xs text-muted-foreground">({appliedJobs.length})</span>
          )}
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {!appliedJobs || appliedJobs.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-xs">
              <p>还没有投递岗位</p>
            </div>
          ) : (
            appliedJobs.slice(0, 5).map(item => (
              <AppliedJobItem key={item.id} item={item} compact />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
