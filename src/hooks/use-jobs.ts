import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Job, JobWithStatus, UserJobStatus, JobStatus } from '@/types/job';

/**
 * 获取岗位列表（带用户状态）
 */
export function useJobs(categoryId?: string, excludeStatuses: JobStatus[] = []) {
  return useQuery({
    queryKey: ['jobs', categoryId, excludeStatuses],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          category:job_categories(*),
          user_status:user_job_status(id, status, updated_at)
        `)
        .order('published_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // 转换数据格式
      const jobs = (data as unknown[]).map((job: unknown) => {
        const jobData = job as Record<string, unknown>;
        const userStatus = jobData.user_status as Array<Record<string, unknown>> | undefined;
        return {
          ...jobData,
          status: userStatus?.[0]?.status || 'pending',
          user_status_id: userStatus?.[0]?.id,
          status_updated_at: userStatus?.[0]?.updated_at,
        };
      }) as JobWithStatus[];

      // 过滤掉指定状态的岗位
      if (excludeStatuses.length > 0) {
        return jobs.filter(job => !excludeStatuses.includes(job.status as JobStatus));
      }

      return jobs;
    },
  });
}

/**
 * 获取单个岗位详情
 */
export function useJob(jobId: string) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          category:job_categories(*),
          user_status:user_job_status(id, status, notes, updated_at)
        `)
        .eq('id', jobId)
        .single();

      if (error) throw error;

      const jobData = data as Record<string, unknown>;
      const userStatus = jobData.user_status as Array<Record<string, unknown>> | undefined;
      return {
        ...jobData,
        status: userStatus?.[0]?.status || 'pending',
        user_status_id: userStatus?.[0]?.id,
        status_updated_at: userStatus?.[0]?.updated_at,
      } as JobWithStatus;
    },
  });
}

/**
 * 获取已投递的岗位列表
 */
export function useAppliedJobs() {
  return useQuery({
    queryKey: ['applied-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_job_status')
        .select(`
          *,
          job:jobs(*)
        `)
        .neq('status', 'pending')
        .neq('status', 'bookmarked')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as (UserJobStatus & { job: Job })[];
    },
  });
}

/**
 * 更新岗位状态
 */
export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: JobStatus }) => {
      const { data, error } = await supabase
        .from('user_job_status')
        .upsert({
          job_id: jobId,
          status,
          user_id: 'default_user',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'job_id,user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['applied-jobs'] });
    },
  });
}
