import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, FolderOpen, Bookmark, ListChecks } from 'lucide-react';
import { CategorySidebar } from '@/components/category/CategorySidebar';
import { StatusFilter } from './StatusFilter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { JobStatus } from '@/types/job';

interface CollapsibleSidebarProps {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  selectedStatus: JobStatus | null;
  onSelectStatus: (status: JobStatus | null) => void;
  bookmarkedCount: number;
  onShowBookmarked: () => void;
  showBookmarked: boolean;
}

export function CollapsibleSidebar({
  selectedCategoryId,
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  bookmarkedCount,
  onShowBookmarked,
  showBookmarked,
}: CollapsibleSidebarProps) {
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [statusOpen, setStatusOpen] = useState(true);

  return (
    <div className="space-y-1 p-3">
      {/* 收藏 */}
      <Button
        variant={showBookmarked ? 'secondary' : 'ghost'}
        className={cn(
          'w-full justify-between h-auto py-2.5',
          showBookmarked && 'bg-primary/10 border border-primary/20'
        )}
        onClick={onShowBookmarked}
      >
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4" />
          <span className="font-medium">收藏</span>
        </div>
        <Badge variant="outline">{bookmarkedCount}</Badge>
      </Button>

      {/* 岗位分类 - 可折叠 */}
      <Collapsible open={categoryOpen} onOpenChange={setCategoryOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between h-auto py-2.5 hover:bg-muted"
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="font-semibold">岗位分类</span>
            </div>
            <ChevronDown 
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                categoryOpen && 'rotate-180'
              )} 
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1">
          <CategorySidebar
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={onSelectCategory}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* 投递状态 - 可折叠 */}
      <Collapsible open={statusOpen} onOpenChange={setStatusOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between h-auto py-2.5 hover:bg-muted"
          >
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              <span className="font-semibold">投递状态</span>
            </div>
            <ChevronDown 
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                statusOpen && 'rotate-180'
              )} 
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1">
          <StatusFilter
            selectedStatus={selectedStatus}
            onSelectStatus={onSelectStatus}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
