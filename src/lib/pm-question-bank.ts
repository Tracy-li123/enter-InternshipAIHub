// Role/company detection utilities + answer framework descriptions.
// Question generation itself now happens server-side via AI (see
// supabase/functions/ai-interview-62325baf28c7), this file only keeps
// small client-side helpers used for UI badges (e.g. "AI PM 专属题库").

const BIG_TECH_COMPANIES = ['腾讯', '字节跳动', '阿里巴巴', '美团', '百度', '京东', '滴滴', '小红书'];
const AI_PM_KEYWORDS = ['ai产品', 'ai pm', 'aigc', '大模型', 'llm', '智能产品'];

export function isPMRoleClient(title: string, category: string): boolean {
  const text = (title + ' ' + category).toLowerCase();
  return /产品经理|产品总监|产品运营|产品策划|产品设计|产品分析|增长产品|数据产品|b端产品|c端产品|策略产品|用户研究|product manager|product owner/.test(text);
}

export function isAIPMRoleClient(title: string, category: string): boolean {
  const text = (title + ' ' + category).toLowerCase();
  return AI_PM_KEYWORDS.some(k => text.includes(k));
}

export function isBigTechCompany(company: string): boolean {
  return BIG_TECH_COMPANIES.some(c => company.includes(c));
}

export const FRAMEWORK_DESCRIPTIONS: Record<string, string> = {
  'STAR+': 'Situation（情境）→ Task（任务）→ Action（行动）→ Result（结果）→ Reflection（反思）',
  'Past-Present-Future': 'Past（相关经历）→ Present（现在能力）→ Future（为什么这份工作是下一步）',
  'User-Problem-Solution-Tradeoff': 'User（目标用户）→ Problem（核心痛点）→ Solution（方案选项）→ Tradeoff（取舍与验证）',
  'Claim-Evidence-Learning': 'Claim（结论）→ Evidence（项目上下文+行动+指标）→ Learning（收获）',
  'Clarify-Structure-Analyze-Recommend': 'Clarify（明确目标）→ Structure（分析框架）→ Analyze（具体分析）→ Recommend（结论与建议）',
};
