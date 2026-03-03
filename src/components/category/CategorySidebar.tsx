import { useJobCategories } from '@/hooks/use-job-categories';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Layers } from 'lucide-react';

interface CategorySidebarProps {
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategorySidebar({ selectedCategoryId, onSelectCategory }: CategorySidebarProps) {
  const { data: categories, isLoading } = useJobCategories();

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4" />
          岗位分类
        </h2>
        <div className="space-y-1">
          <Button
            variant={selectedCategoryId === null ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onSelectCategory(null)}
          >
            全部岗位
          </Button>
          {categories?.map(category => (
            <Button
              key={category.id}
              variant={selectedCategoryId === category.id ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onSelectCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
