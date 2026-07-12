# 面试模块重构：快速练习 AI 化 + 合并 AI 面试官/简历JD为个性化提问

## Context
用户反馈现有模拟面试三个模式体验不好：
1. **快速练习**：目前是固定本地题库，同岗位题目每次都一样，且没有参考答案
2. **AI 面试官**：多轮对话式模拟面试，用户认为价值和"简历+JD"模式重叠，希望去掉
3. **简历+JD个性化准备**：要求同时上传简历和JD文件才能用，但岗位JD其实已经在系统里（`job.description`/`job.requirements`），不该要求用户重复上传

## 目标行为（改造后只有 2 个模式）

### 模式一：快速练习（改造）
- 调用 AI 一次性生成一批（8道）**真正贴合该岗位**的题目 + 参考答案，不再是写死的本地题库
- 每题默认收起答案，点击"查看参考答案"展开
- 不是多轮对话，一次性生成即可，加载几秒可接受
- 保留原有的"掌握/需要练习/跳过"自评 + 结束总结报告 UI 结构，但题目来源换成 AI

### 模式二：个性化提问（合并 AI 面试官 + 简历JD准备）
- 简历上传改为**可选**（.docx，沿用 mammoth 解析）
- 不再要求上传JD文件——直接使用当前岗位的 `title` + `company` + `description` + `requirements` 作为 JD 上下文
- 有简历：结合简历 + 岗位JD 生成个性化提问；无简历：仅结合岗位JD生成通用但岗位相关的提问
- 一次性生成一批（6-8道）高概率面试题列表，默认收起，点击展开显示：
  - 该题为什么会被问（简历/JD关联理由，可选）
  - 参考答案（AI生成，贴合真实岗位）
- 每道题展开后下方有独立输入框，用户可以针对**这道题**继续追问/完善回答，形成该题目独立的多轮追问对话（各题目对话互不影响）

### InterviewSetup 精简为 2 张卡片
- "快速练习"（不再强调"不调用AI"，因为现在也调用AI了；改为强调"针对该岗位定制"）
- "个性化提问"（替代原 ai_mock + prep）

## 架构设计

### 后端：`supabase/functions/ai-interview-62325baf28c7/index.ts`
现有 `mode` 分支重构为：
- 删除 `mode: "mock"` 的多轮对话流程（多轮聊天 UI 移除，不再需要）
- `mode: "quick_questions"`（新，替代本地 `filterQuestions`）：
  - 输入：jobTitle, company, jobDescription, jobRequirements, isAIPM, isBigTech
  - 调用 DeepSeek 一次性生成 JSON 数组：`[{question, category, referenceAnswer, framework}]`（非流式，用 `response_format` 或提示词强约束 JSON 输出）
  - 复用现有 `isPMRole`/`isAIPMRole`/`isBigTech` 判定逻辑决定 prompt 侧重
- `mode: "personalized_questions"`（新，替代 prep）：
  - 输入：jobTitle, company, jobDescription, jobRequirements, resumeText(可选)
  - 调用 DeepSeek 一次性生成 JSON 数组：`[{question, reason, referenceAnswer}]`
  - 有简历 vs 无简历两种 system prompt 分支
- `mode: "followup"`（新）：单题追问，流式返回
  - 输入：该题原始 question + referenceAnswer(可选) + 该题的对话历史(user追问/AI回复) + 岗位上下文
  - 流式 SSE 返回（复用现有 fetchEventSource 流式基础设施）
- 保留 `PM_QUESTIONS` 本地题库作为**当 AI 调用失败时的 fallback**（避免完全失败无内容）

### 前端文件改动

**删除**：
- `src/hooks/use-ai-interview.ts`（多轮 mock 对话，不再需要）
- `src/components/interview/InterviewMessage.tsx`（多轮消息气泡，不再需要）
- `src/hooks/use-interview-prep.ts`（被新 hook 替代）

**重写**：
- `src/lib/pm-question-bank.ts`：保留 `PM_QUESTIONS`、`isPMRoleClient`/`isAIPMRoleClient`/`isBigTechCompany`、`FRAMEWORK_DESCRIPTIONS` 作为 fallback 与判定工具；移除前端 `filterQuestions`（改由后端 AI 生成，但保留作为 fallback 兜底函数）
- `src/hooks/use-quick-practice.ts`：改为调用 `mode: "quick_questions"`，非流式一次性拿到题目+答案数组；状态从"当前题目 index + 评分"改为"题目列表 + 每题展开/收起状态 + 评分"
- `src/components/interview/QuickPracticeMode.tsx`：改为题目列表页（类似 Accordion），每题：题干 + "查看参考答案"按钮 + 展开后显示答案 + 掌握/需要练习/跳过 三按钮；顶部保留生成中 loading、失败重试
- `src/components/interview/InterviewSetup.tsx`：`InterviewMode` 从 `'quick'|'ai_mock'|'prep'` 精简为 `'quick'|'personalized'`；卡片文案更新

**新建**：
- `src/hooks/use-personalized-questions.ts`：管理个性化提问列表生成（一次性调用）+ 每题的追问对话状态（`Record<questionId, {messages, isLoading}>`）+ 简历上传状态
- `src/components/interview/PersonalizedMode.tsx`：替代 `PrepMode.tsx`
  - 顶部：可选简历上传（保留 mammoth 逻辑，改为可选，不再要求JD上传）
  - "生成个性化问题"按钮（无需等JD，因为JD来自岗位本身）
  - 题目列表（Accordion 形式）：题干 + reason（为什么问这题）+ 展开显示参考答案 + 独立追问输入框和该题对话历史

**修改**：
- `src/pages/interview/[jobId].tsx`：
  - `PageState` 从 `'setup'|'quick'|'ai_mock'|'prep'` 改为 `'setup'|'quick'|'personalized'`
  - 移除 `useAIInterview` 相关的多轮聊天渲染分支（ScrollArea + InterviewMessage + 底部输入框整段）
  - 渲染 `QuickPracticeMode` 和 `PersonalizedMode` 两个分支

## 需要传递的岗位上下文
统一使用 `job.title`, `job.company`, `job.description`, `job.requirements`（`requirements` 目前不在 `Job` 类型里但 DB 有此列且 `job/[jobId].tsx` 已直接用 `job.requirements`，沿用相同用法，不改类型定义避免影响范围）。

## 关键文件清单
- `supabase/functions/ai-interview-62325baf28c7/index.ts`（重写 mode 分支）
- `src/lib/pm-question-bank.ts`（精简，保留 fallback）
- `src/hooks/use-quick-practice.ts`（重写）
- `src/components/interview/QuickPracticeMode.tsx`（重写 UI）
- `src/hooks/use-personalized-questions.ts`（新建）
- `src/components/interview/PersonalizedMode.tsx`（新建，替代 PrepMode.tsx）
- `src/components/interview/InterviewSetup.tsx`（精简为2卡片）
- `src/pages/interview/[jobId].tsx`（状态机精简）
- 删除：`src/hooks/use-ai-interview.ts`、`src/components/interview/InterviewMessage.tsx`、`src/hooks/use-interview-prep.ts`、`src/components/interview/PrepMode.tsx`

## 验证方式
1. 打开任意岗位面试页 → 只看到"快速练习"和"个性化提问"两张卡片
2. 快速练习：点击进入后等待几秒，看到8道贴合该岗位标题/描述的题目列表（换一个岗位题目应明显不同），点击"查看参考答案"展开显示AI生成的参考答案
3. 个性化提问：不上传简历直接生成 → 得到基于岗位JD的通用但相关的问题列表；上传一份简历后重新生成 → 问题应体现简历经历与JD的结合
4. 展开某道题后，在其下方输入追问内容并提交 → 该题独立显示多轮追问对话，流式返回，不影响其他题目状态
