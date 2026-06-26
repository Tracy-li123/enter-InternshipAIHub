import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Job, JobWithStatus, UserJobStatus, JobStatus } from '@/types/job';
import { useAuth } from '@/hooks/use-auth';

/**
 * 获取岗位列表（带用户状态）
 */
export function useJobs(categoryId?: string, excludeStatuses: JobStatus[] = []) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['jobs', categoryId, excludeStatuses, user?.id],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          category:job_categories(*),
          user_status:user_job_status(id, status, is_bookmarked, updated_at)
        `)
        .is('deleted_at', null)
        .eq('user_id', user!.id)
        .order('published_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const jobs = (data as unknown[]).map((job: unknown) => {
        const jobData = job as Record<string, unknown>;
        const userStatus = jobData.user_status as Array<Record<string, unknown>> | undefined;
        return {
          ...jobData,
          status: userStatus?.[0]?.status || 'pending',
          is_bookmarked: userStatus?.[0]?.is_bookmarked || false,
          user_status_id: userStatus?.[0]?.id,
          status_updated_at: userStatus?.[0]?.updated_at,
        };
      }) as JobWithStatus[];

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
          user_status:user_job_status(id, status, is_bookmarked, notes, updated_at)
        `)
        .eq('id', jobId)
        .single();

      if (error) throw error;

      const jobData = data as Record<string, unknown>;
      const userStatus = jobData.user_status as Array<Record<string, unknown>> | undefined;
      return {
        ...jobData,
        status: userStatus?.[0]?.status || 'pending',
        is_bookmarked: userStatus?.[0]?.is_bookmarked || false,
        user_status_id: userStatus?.[0]?.id,
        status_updated_at: userStatus?.[0]?.updated_at,
      } as JobWithStatus;
    },
  });
}

/**
 * 获取已投递的岗位列表（不包括pending，包括已收藏的岗位）
 */
export function useAppliedJobs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['applied-jobs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_job_status')
        .select(`
          *,
          job:jobs(*)
        `)
        .eq('user_id', user!.id)
        .neq('status', 'pending')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as (UserJobStatus & { job: Job })[];
    },
  });
}

/**
 * 获取已收藏的岗位列表
 */
export function useBookmarkedJobs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bookmarked-jobs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_job_status')
        .select(`
          *,
          job:jobs!inner(*)
        `)
        .eq('user_id', user!.id)
        .eq('is_bookmarked', true)
        .is('job.deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      return (data as unknown[]).map((item: unknown) => {
        const itemData = item as Record<string, unknown>;
        const job = itemData.job as Record<string, unknown>;
        return {
          ...job,
          status: itemData.status,
          is_bookmarked: itemData.is_bookmarked,
          user_status_id: itemData.id,
          status_updated_at: itemData.updated_at,
        };
      }) as JobWithStatus[];
    },
  });
}

/**
 * 获取已删除的岗位列表
 */
export function useDeletedJobs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['deleted-jobs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          category:job_categories(*),
          user_status:user_job_status(id, status, is_bookmarked, updated_at)
        `)
        .eq('user_id', user!.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) throw error;

      const jobs = (data as unknown[]).map((job: unknown) => {
        const jobData = job as Record<string, unknown>;
        const userStatus = jobData.user_status as Array<Record<string, unknown>> | undefined;
        return {
          ...jobData,
          status: userStatus?.[0]?.status || 'pending',
          is_bookmarked: userStatus?.[0]?.is_bookmarked || false,
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', jobId)
        .eq('user_id', user!.id);

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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .update({ deleted_at: null })
        .eq('id', jobId)
        .eq('user_id', user!.id);

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
 * 切换收藏状态
 */
export function useToggleBookmark() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ jobId, isBookmarked }: { jobId: string; isBookmarked: boolean }) => {
      const { error } = await supabase
        .from('user_job_status')
        .upsert({
          job_id: jobId,
          user_id: user!.id,
          is_bookmarked: isBookmarked,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'job_id,user_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarked-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['user-job-status'] });
    },
  });
}

/**
 * 更新岗位状态
 */
export function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: JobStatus }) => {
      const { data, error } = await supabase
        .from('user_job_status')
        .upsert({
          job_id: jobId,
          status,
          user_id: user!.id,
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


