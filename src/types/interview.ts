// AI面试消息
export interface MockInterviewMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// AI面试会话
export interface MockInterviewSession {
  id: string;
  job_id: string;
  user_id: string;
  conversation_history: MockInterviewMessage[];
  feedback_summary: string | null;
  created_at: string;
  updated_at: string;
}

// AI面试请求参数
export interface AIInterviewRequest {
  jobDescription: string;
  conversationHistory: MockInterviewMessage[];
  userMessage: string;
}

// AI面试响应
export interface AIInterviewResponse {
  message: string;
  feedback?: string;
}
