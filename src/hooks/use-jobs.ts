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
        .is('deleted_at', null)  // 只获取未删除的岗位
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
 * 获取已删除的岗位列表
 */
export function useDeletedJobs() {
  return useQuery({
    queryKey: ['deleted-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          category:job_categories(*),
          user_status:user_job_status(id, status, updated_at)
        `)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

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

      return jobs;
    },
  });
}

/**
 * 软删除岗位
 */
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job'] });
    },
  });
}

/**
 * 恢复已删除的岗位
 */
export function useRestoreJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .update({ deleted_at: null })
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['deleted-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job'] });
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


