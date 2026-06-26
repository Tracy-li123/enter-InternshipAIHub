import { ReactNode } from 'react';
import { CollapsibleSidebar } from '@/components/sidebar/CollapsibleSidebar';
import { Button } from '@/components/ui/button';
import { Menu, Briefcase, LayoutDashboard, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import { JobStatus } from '@/types/job';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MainLayoutProps {
  children: ReactNode;
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  selectedStatus: JobStatus | null;
  onSelectStatus: (status: JobStatus | null) => void;
  bookmarkedCount: number;
  onShowBookmarked: () => void;
  showBookmarked: boolean;
  deletedCount: number;
  onShowDeleted: () => void;
  showDeleted: boolean;
}

export function MainLayout({ 
  children, 
  selectedCategoryId, 
  onSelectCategory,
  selectedStatus,
  onSelectStatus,
  bookmarkedCount,
  onShowBookmarked,
  showBookmarked,
  deletedCount,
  onShowDeleted,
  showDeleted,
}: MainLayoutProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('已退出登录');
    navigate('/auth');
  };

  const userInitial = (user?.user_metadata?.display_name || user?.email || '?')[0].toUpperCase();

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
                  <CollapsibleSidebar
                    selectedCategoryId={selectedCategoryId}
                    onSelectCategory={onSelectCategory}
                    selectedStatus={selectedStatus}
                    onSelectStatus={onSelectStatus}
                    bookmarkedCount={bookmarkedCount}
                    onShowBookmarked={onShowBookmarked}
                    showBookmarked={showBookmarked}
                    deletedCount={deletedCount}
                    onShowDeleted={onShowDeleted}
                    showDeleted={showDeleted}
                  />
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
          
          <div className="flex items-center gap-2">
            <Button
              variant={location.pathname === '/dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              数据看板
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm text-muted-foreground truncate">
                  {user?.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧边栏（桌面端）：分类 + 已投递 */}
        {!isMobile && (
          <aside className="w-64 border-r bg-card overflow-y-auto">
            <CollapsibleSidebar
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
              selectedStatus={selectedStatus}
              onSelectStatus={onSelectStatus}
              bookmarkedCount={bookmarkedCount}
              onShowBookmarked={onShowBookmarked}
              showBookmarked={showBookmarked}
              deletedCount={deletedCount}
              onShowDeleted={onShowDeleted}
              showDeleted={showDeleted}
            />
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
