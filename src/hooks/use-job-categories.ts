import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { JobCategory } from '@/types/job';
import { useAuth } from '@/hooks/use-auth';

/**
 * 获取当前用户 + 同组成员的岗位分类列表（按名字去重，优先保留自己的版本）
 */
export function useJobCategories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['job-categories', user?.id],
    enabled: !!user,
    queryFn: async () => {
      // RLS 自动返回自己 + 同组成员的分类
      const { data, error } = await supabase
        .from('job_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      // 按名字去重，优先保留当前用户自己的分类版本
      const nameMap = new Map<string, JobCategory>();
      // 先放自己的（优先级高）
      for (const cat of data as JobCategory[]) {
        if (cat.user_id === user!.id) nameMap.set(cat.name, cat);
      }
      // 再补充组员的（不覆盖已有同名分类）
      for (const cat of data as JobCategory[]) {
        if (cat.user_id !== user!.id && !nameMap.has(cat.name)) {
          nameMap.set(cat.name, cat);
        }
      }

      return Array.from(nameMap.values())
        .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
    },
  });
}
