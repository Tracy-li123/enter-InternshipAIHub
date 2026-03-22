import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { JobList } from '@/components/job/JobList';
import { useJobs, useAppliedJobs, useDeletedJobs } from '@/hooks/use-jobs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { JobStatus } from '@/types/job';
import { statusLabelMap } from '@/lib/status-colors';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 获取所有岗位、已投递岗位、已删除岗位
  const { data: allJobs, isLoading: allJobsLoading, refetch } = useJobs(
    selectedCategoryId || undefined,
    []
  );
  const { data: appliedJobs, isLoading: appliedJobsLoading } = useAppliedJobs();
  const { data: deletedJobs, isLoading: deletedJobsLoading } = useDeletedJobs();

  // 统计收藏和删除数量
  const bookmarkedCount = appliedJobs?.filter(item => item.status === 'bookmarked').length || 0;
  const deletedCount = deletedJobs?.length || 0;

  // 互斥选择逻辑
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedStatus(null);
    setShowBookmarked(false);
    setShowDeleted(false);
  };

  const handleStatusSelect = (status: JobStatus | null) => {
    setSelectedStatus(status);
    setSelectedCategoryId(null);
    setShowBookmarked(false);
    setShowDeleted(false);
  };

  const handleShowBookmarked = () => {
    setShowBookmarked(!showBookmarked);
    setSelectedCategoryId(null);
    setSelectedStatus(null);
    setShowDeleted(false);
  };

  const handleShowDeleted = () => {
    setShowDeleted(!showDeleted);
    setSelectedCategoryId(null);
    setSelectedStatus(null);
    setShowBookmarked(false);
  };

  // 根据筛选条件选择显示哪些岗位
  const displayJobs = showDeleted
    ? deletedJobs
    : showBookmarked
    ? appliedJobs
        ?.filter(item => item.status === 'bookmarked')
        .map(item => ({
          ...item.job,
          status: item.status,
          user_status_id: item.id,
        }))
    : selectedStatus
    ? appliedJobs
        ?.filter(item => item.status === selectedStatus)
        .map(item => ({
          ...item.job,
          status: item.status,
          user_status_id: item.id,
        }))
    : allJobs?.filter(job => 
        !['applied', 'written_test', 'first_interview', 'second_interview', 
          'final_interview', 'offer', 'rejected', 'bookmarked'].includes(job.status as JobStatus)
      );

  const isLoading = showDeleted ? deletedJobsLoading : (selectedStatus || showBookmarked ? appliedJobsLoading : allJobsLoading);

  // 根据搜索关键词过滤岗位
  const filteredJobs = displayJobs?.filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.location?.toLowerCase().includes(query)
    );
  });

  const handleRefreshJobs = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('job-scraper-62325baf28c7');
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(`成功更新岗位！新增 ${data.stats.inserted} 个岗位`);
        refetch();
      } else {
        toast.error('更新失败，请稍后重试');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('更新失败，请稍后重试');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <MainLayout 
      selectedCategoryId={selectedCategoryId}
      onSelectCategory={handleCategorySelect}
      selectedStatus={selectedStatus}
      onSelectStatus={handleStatusSelect}
      bookmarkedCount={bookmarkedCount}
      onShowBookmarked={handleShowBookmarked}
      showBookmarked={showBookmarked}
      deletedCount={deletedCount}
      onShowDeleted={handleShowDeleted}
      showDeleted={showDeleted}
    >
      <div className="h-full flex flex-col">
        {/* 搜索栏 */}
        <div className="border-b bg-card">
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索岗位、公司或地点..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button 
                variant="outline"
                onClick={() => navigate('/import')}
                className="gap-2"
              >
                <Link2 className="h-4 w-4" />
                导入链接
              </Button>
              <Button 
                variant="outline"
                onClick={handleRefreshJobs}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? '更新中...' : '更新岗位'}
              </Button>
            </div>
          </div>
        </div>

        {/* 岗位列表 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">
                {showBookmarked
                  ? '收藏岗位'
                  : selectedStatus 
                    ? `${statusLabelMap[selectedStatus]}岗位` 
                    : selectedCategoryId 
                      ? '分类岗位' 
                      : '全部岗位'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredJobs ? `共 ${filteredJobs.length} 个岗位` : '加载中...'}
              </p>
            </div>
            <JobList jobs={filteredJobs} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
