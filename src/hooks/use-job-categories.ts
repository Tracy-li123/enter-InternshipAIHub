import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { JobCategory } from '@/types/job';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 获取当前用户的岗位分类列表
 */
export function useJobCategories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['job-categories', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_categories')
        .select('*')
        .eq('user_id', user!.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as JobCategory[];
    },
  });
}
