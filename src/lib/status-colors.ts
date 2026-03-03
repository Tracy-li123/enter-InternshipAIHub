import { JobStatus } from '@/types/job';

/**
 * 岗位状态对应的颜色配置
 */
export const statusColorMap: Record<JobStatus, string> = {
  pending: 'bg-gray-500',
  bookmarked: 'bg-yellow-500',
  applied: 'bg-blue-500',
  written_test: 'bg-indigo-500',
  first_interview: 'bg-purple-500',
  second_interview: 'bg-pink-500',
  final_interview: 'bg-orange-500',
  offer: 'bg-green-500',
  rejected: 'bg-red-500',
};

/**
 * 岗位状态对应的中文名称
 */
export const statusLabelMap: Record<JobStatus, string> = {
  pending: '待投递',
  bookmarked: '已收藏',
  applied: '已投递',
  written_test: '笔试',
  first_interview: '一面',
  second_interview: '二面',
  final_interview: '终面',
  offer: 'Offer',
  rejected: '已淘汰',
};

/**
 * 获取状态的 Badge variant
 */
export function getStatusVariant(status: JobStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'offer':
      return 'default';
    case 'rejected':
      return 'destructive';
    case 'pending':
      return 'outline';
    default:
      return 'secondary';
  }
}
