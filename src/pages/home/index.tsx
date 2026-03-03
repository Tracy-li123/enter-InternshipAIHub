import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { JobList } from '@/components/job/JobList';
import { useJobs } from '@/hooks/use-jobs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function Home() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 获取岗位列表，排除已投递的岗位
  const { data: jobs, isLoading } = useJobs(
    selectedCategoryId || undefined,
    ['applied', 'written_test', 'first_interview', 'second_interview', 'final_interview', 'offer', 'rejected']
  );

  // 根据搜索关键词过滤岗位
  const filteredJobs = jobs?.filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.location?.toLowerCase().includes(query)
    );
  });

  return (
    <MainLayout 
      selectedCategoryId={selectedCategoryId}
      onSelectCategory={setSelectedCategoryId}
    >
      <div className="h-full flex flex-col">
        {/* 搜索栏 */}
        <div className="border-b bg-card">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索岗位、公司或地点..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* 岗位列表 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">
                {selectedCategoryId ? '分类岗位' : '全部岗位'}
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
