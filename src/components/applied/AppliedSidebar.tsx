import { useAppliedJobs } from '@/hooks/use-jobs';
import { AppliedJobItem } from './AppliedJobItem';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AppliedSidebar() {
  const { data: appliedJobs, isLoading } = useAppliedJobs();

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-32" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          已投递岗位
          {appliedJobs && appliedJobs.length > 0 && (
            <span className="text-sm text-muted-foreground">({appliedJobs.length})</span>
          )}
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {!appliedJobs || appliedJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>还没有投递任何岗位</p>
              <p className="mt-1">快去职位大厅看看吧～</p>
            </div>
          ) : (
            appliedJobs.map(item => (
              <AppliedJobItem key={item.id} item={item} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
