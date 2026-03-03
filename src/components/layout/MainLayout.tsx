import { ReactNode } from 'react';
import { CategorySidebar } from '@/components/category/CategorySidebar';
import { AppliedSidebar } from '@/components/applied/AppliedSidebar';
import { Button } from '@/components/ui/button';
import { Menu, Briefcase, LayoutDashboard } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate, useLocation } from 'react-router-dom';

interface MainLayoutProps {
  children: ReactNode;
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function MainLayout({ children, selectedCategoryId, onSelectCategory }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

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
                  <div className="flex flex-col h-full">
                    <CategorySidebar 
                      selectedCategoryId={selectedCategoryId}
                      onSelectCategory={onSelectCategory}
                    />
                    <AppliedSidebar />
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">职达实习生</h1>
            </button>
          </div>
          
          <Button
            variant={location.pathname === '/dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            数据看板
          </Button>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧边栏（桌面端）：分类 + 已投递 */}
        {!isMobile && (
          <aside className="w-64 border-r bg-card flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <CategorySidebar 
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={onSelectCategory}
              />
            </div>
            <div className="border-t">
              <AppliedSidebar />
            </div>
          </aside>
        )}

        {/* 中间内容区 */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
