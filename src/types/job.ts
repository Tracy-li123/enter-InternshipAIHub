// 岗位状态枚举（移除bookmarked）
export type JobStatus = 
  | 'pending'           // 待投递
  | 'applied'           // 已投递
  | 'written_test'      // 笔试
  | 'first_interview'   // 一面
  | 'second_interview'  // 二面
  | 'final_interview'   // 终面
  | 'offer'             // Offer
  | 'rejected';         // 已淘汰

// 岗位分类
export interface JobCategory {
  id: string;
  name: string;
  user_id: string;
  display_order: number;
  created_at: string;
}

// 岗位信息
export interface Job {
  id: string;
  title: string;
  company: string;
  description: string | null;
  requirements: string | null;
  source_url: string | null;
  location: string | null;
  category_id: string | null;
  user_id: string | null;
  referral_code: string | null;
  published_at: string;
  scraped_at: string;
  created_at: string;
}

// 用户岗位状态
export interface UserJobStatus {
  id: string;
  job_id: string;
  user_id: string;
  status: JobStatus;
  is_bookmarked: boolean;
  notes: string | null;
  updated_at: string;
  created_at: string;
}

// 带状态的岗位信息（联合查询结果）
export interface JobWithStatus extends Job {
  status?: JobStatus;
  is_bookmarked?: boolean;
  user_status_id?: string;
  status_updated_at?: string;
  category?: JobCategory;
  deleted_at?: string | null;
}
