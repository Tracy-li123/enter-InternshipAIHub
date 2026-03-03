import { ReactNode } from 'react';
import { CategorySidebar } from '@/components/category/CategorySidebar';
import { AppliedSidebar } from '@/components/applied/AppliedSidebar';
import { Button } from '@/components/ui/button';
import { Menu, Briefcase } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function MainLayout({ children, selectedCategoryId, onSelectCategory }: MainLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 顶部导航栏 */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <CategorySidebar 
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={onSelectCategory}
                  />
                </SheetContent>
              </Sheet>
            )}
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">职达实习生</h1>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧分类侧边栏（桌面端） */}
        {!isMobile && (
          <aside className="w-56 border-r bg-card overflow-y-auto">
            <CategorySidebar 
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
            />
          </aside>
        )}

        {/* 中间内容区 */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* 右侧投递侧边栏（桌面端） */}
        {!isMobile && (
          <aside className="w-80 border-l bg-card overflow-y-auto">
            <AppliedSidebar />
          </aside>
        )}
      </div>

      {/* 移动端底部导航栏 */}
      {isMobile && (
        <div className="border-t bg-card">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="w-full py-6">
                查看已投递岗位
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <AppliedSidebar />
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}
