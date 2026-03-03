import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { JobCategory } from '@/types/job';

/**
 * 获取岗位分类列表
 */
export function useJobCategories() {
  return useQuery({
    queryKey: ['job-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as JobCategory[];
    },
  });
}
